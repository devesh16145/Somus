package com.somus.app.sms

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.IBinder
import android.os.PowerManager
import android.provider.Telephony
import android.util.Log
import androidx.core.app.NotificationCompat
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.somus.app.R
import com.somus.app.leap.LeapService
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

// ── SmsPackage ─────────────────────────────────────────────────

class SmsPackage : ReactPackage {
    override fun createNativeModules(ctx: ReactApplicationContext): List<NativeModule> =
        listOf(SmsModule(ctx))
    override fun createViewManagers(ctx: ReactApplicationContext): List<ViewManager<*, *>> =
        emptyList()
}

// ── SmsReceiver ────────────────────────────────────────────────

class SmsReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

        val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        if (messages.isNullOrEmpty()) return

        for (sms in messages) {
            val sender = sms.displayOriginatingAddress ?: continue
            val body = sms.messageBody ?: continue
            val timestamp = sms.timestampMillis

            if (isLikelyFinancial(body)) {
                val si = Intent(context, SmsForegroundService::class.java).apply {
                    putExtra("sender", sender)
                    putExtra("body", body)
                    putExtra("timestamp", timestamp)
                    putExtra("dedup_key", "${sender}_${timestamp}")
                }
                context.startForegroundService(si)
            }
        }
    }

    private fun isLikelyFinancial(body: String): Boolean {
        val lower = body.lowercase()
        return KEYWORDS.any { lower.contains(it) }
    }

    companion object {
        private val KEYWORDS = setOf(
            // English
            "debited","credited","spent","payment","transaction",
            "withdraw","deposit","transfer","balance","purchase",
            "charged","txn","upi","atm","neft","imps",
            // Arabic
            "خصم","إيداع","رصيد","تحويل",
            // Chinese
            "消费","转账","余额","付款","扣款",
            // Spanish
            "débito","crédito","pago","saldo",
            // French
            "débit","crédit","paiement","solde",
            // German
            "abbuchung","gutschrift","zahlung","kontostand",
            // Japanese
            "引き落とし","入金","振込","残高",
            // Korean
            "출금","입금","결제","이체","잔액",
            // Symbols
            "₹","$","€","£","¥","₩","aed","kes","php"
        )
    }
}

// ── SmsForegroundService ───────────────────────────────────────

class SmsForegroundService : Service() {

    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var wakeLock: PowerManager.WakeLock? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val sender    = intent?.getStringExtra("sender")   ?: return START_NOT_STICKY
        val body      = intent.getStringExtra("body")      ?: return START_NOT_STICKY
        val timestamp = intent.getLongExtra("timestamp", System.currentTimeMillis())
        val dedupKey  = intent.getStringExtra("dedup_key") ?: "${sender}_${timestamp}"

        startForeground(NOTIF_ID, buildNotification())
        acquireWakeLock()

        scope.launch {
            try {
                LeapService.getInstance()?.processLiveSms(sender, body, timestamp, dedupKey)
            } catch (e: Exception) {
                Log.e(TAG, "Live SMS inference error", e)
            } finally {
                releaseWakeLock()
                stopSelf(startId)
            }
        }
        return START_NOT_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        scope.cancel()
        releaseWakeLock()
        super.onDestroy()
    }

    private fun acquireWakeLock() {
        val pm = getSystemService(POWER_SERVICE) as PowerManager
        wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Somus:SmsService")
            .apply { acquire(30_000L) }
    }

    private fun releaseWakeLock() {
        wakeLock?.let { if (it.isHeld) it.release() }
        wakeLock = null
    }

    private fun createNotificationChannel() {
        val ch = NotificationChannel(CH_ID, "Transaction Processing",
            NotificationManager.IMPORTANCE_LOW).apply {
            description = "Processing incoming bank SMS"
            setShowBadge(false)
        }
        getSystemService(NotificationManager::class.java).createNotificationChannel(ch)
    }

    private fun buildNotification(): Notification =
        NotificationCompat.Builder(this, CH_ID)
            .setContentTitle("Somus")
            .setContentText("Processing transaction…")
            .setSmallIcon(R.drawable.ic_notification)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()

    companion object {
        const val CH_ID   = "somus_processing"
        const val NOTIF_ID = 1001
        const val TAG      = "SmsForegroundService"
    }
}
