package com.somus.app.sms

import android.Manifest
import android.content.ContentResolver
import android.content.pm.PackageManager
import android.database.Cursor
import android.net.Uri
import android.provider.Telephony
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import kotlinx.coroutines.*

class SmsModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "SmsModule"

    private val moduleScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    // ── MODE A: Fetch SMS in a user-selected time period ──────────
    @ReactMethod
    fun fetchPeriod(startMs: Double, endMs: Double, batchSize: Int, promise: Promise) {
        if (!hasSmsPermission()) {
            promise.reject("PERMISSION_DENIED", "READ_SMS permission not granted")
            return
        }
        moduleScope.launch {
            try {
                val messages = querySmsInbox(
                    selection = "${Telephony.Sms.DATE} >= ? AND ${Telephony.Sms.DATE} <= ?",
                    selectionArgs = arrayOf(startMs.toLong().toString(), endMs.toLong().toString()),
                    limit = batchSize.coerceAtMost(MAX_BATCH_SIZE)
                )
                promise.resolve(buildJsArray(messages))
            } catch (e: Exception) {
                promise.reject("FETCH_ERROR", e.message, e)
            }
        }
    }

    // ── MODE C: Fetch SMS since last sync timestamp ───────────────
    @ReactMethod
    fun fetchSince(sinceMs: Double, promise: Promise) {
        if (!hasSmsPermission()) {
            promise.reject("PERMISSION_DENIED", "READ_SMS permission not granted")
            return
        }
        moduleScope.launch {
            try {
                val messages = querySmsInbox(
                    selection = "${Telephony.Sms.DATE} > ?",
                    selectionArgs = arrayOf(sinceMs.toLong().toString()),
                    limit = MAX_BATCH_SIZE
                )
                promise.resolve(buildJsArray(messages))
            } catch (e: Exception) {
                promise.reject("FETCH_ERROR", e.message, e)
            }
        }
    }

    // ── Fetch with progress events for large imports ───────────────
    @ReactMethod
    fun fetchPeriodWithProgress(startMs: Double, endMs: Double, promise: Promise) {
        if (!hasSmsPermission()) {
            promise.reject("PERMISSION_DENIED", "READ_SMS permission not granted")
            return
        }
        moduleScope.launch {
            try {
                val total = countSmsInPeriod(startMs.toLong(), endMs.toLong())
                var offset = 0
                emitProgress(0, total, "started")

                while (offset < total) {
                    val batch = querySmsInbox(
                        selection = "${Telephony.Sms.DATE} >= ? AND ${Telephony.Sms.DATE} <= ?",
                        selectionArgs = arrayOf(startMs.toLong().toString(), endMs.toLong().toString()),
                        limit = PROGRESS_BATCH_SIZE,
                        offset = offset
                    )
                    if (batch.isEmpty()) break
                    emitSmsBatch(buildJsArray(batch), offset, total)
                    offset += PROGRESS_BATCH_SIZE
                    emitProgress(offset.coerceAtMost(total), total, "processing")
                    delay(80) // breathe between batches
                }

                emitProgress(total, total, "complete")
                promise.resolve(total)
            } catch (e: Exception) {
                promise.reject("FETCH_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun hasPermission(promise: Promise) {
        promise.resolve(hasSmsPermission())
    }

    @ReactMethod
    fun countInPeriod(startMs: Double, endMs: Double, promise: Promise) {
        if (!hasSmsPermission()) {
            promise.reject("PERMISSION_DENIED", "READ_SMS permission not granted")
            return
        }
        moduleScope.launch {
            try {
                promise.resolve(countSmsInPeriod(startMs.toLong(), endMs.toLong()))
            } catch (e: Exception) {
                promise.reject("COUNT_ERROR", e.message, e)
            }
        }
    }

    // ── Core ContentResolver query ─────────────────────────────────
    private fun querySmsInbox(
        selection: String? = null,
        selectionArgs: Array<String>? = null,
        limit: Int = MAX_BATCH_SIZE,
        offset: Int = 0
    ): List<SmsMessage> {
        val messages = mutableListOf<SmsMessage>()
        val cr: ContentResolver = reactContext.contentResolver

        val projection = arrayOf(
            Telephony.Sms._ID,
            Telephony.Sms.ADDRESS,
            Telephony.Sms.BODY,
            Telephony.Sms.DATE
        )

        val cursor: Cursor? = cr.query(
            Uri.parse("content://sms/inbox"),
            projection,
            selection,
            selectionArgs,
            "${Telephony.Sms.DATE} DESC LIMIT $limit OFFSET $offset"
        )

        cursor?.use {
            val idIdx = it.getColumnIndexOrThrow(Telephony.Sms._ID)
            val addrIdx = it.getColumnIndexOrThrow(Telephony.Sms.ADDRESS)
            val bodyIdx = it.getColumnIndexOrThrow(Telephony.Sms.BODY)
            val dateIdx = it.getColumnIndexOrThrow(Telephony.Sms.DATE)

            while (it.moveToNext()) {
                messages.add(
                    SmsMessage(
                        id = it.getString(idIdx) ?: "",
                        sender = it.getString(addrIdx) ?: "",
                        body = it.getString(bodyIdx) ?: "",
                        date = it.getLong(dateIdx)
                    )
                )
            }
        }
        return messages
    }

    private fun countSmsInPeriod(startMs: Long, endMs: Long): Int {
        val cursor = reactContext.contentResolver.query(
            Uri.parse("content://sms/inbox"),
            null,
            "${Telephony.Sms.DATE} >= ? AND ${Telephony.Sms.DATE} <= ?",
            arrayOf(startMs.toString(), endMs.toString()),
            null
        )
        return cursor?.use { it.count } ?: 0
    }

    private fun buildJsArray(messages: List<SmsMessage>): WritableArray {
        val array = Arguments.createArray()
        for (msg in messages) {
            val map = Arguments.createMap()
            map.putString("id", msg.id)
            map.putString("sender", msg.sender)
            map.putString("body", msg.body)
            map.putDouble("date", msg.date.toDouble())
            array.pushMap(map)
        }
        return array
    }

    private fun emitProgress(processed: Int, total: Int, status: String) {
        val params = Arguments.createMap()
        params.putInt("processed", processed)
        params.putInt("total", total)
        params.putString("status", status)
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("SmsProgress", params)
    }

    private fun emitSmsBatch(batch: WritableArray, offset: Int, total: Int) {
        val params = Arguments.createMap()
        params.putArray("messages", batch)
        params.putInt("offset", offset)
        params.putInt("total", total)
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("SmsBatch", params)
    }

    private fun hasSmsPermission(): Boolean =
        ContextCompat.checkSelfPermission(
            reactContext, Manifest.permission.READ_SMS
        ) == PackageManager.PERMISSION_GRANTED

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    override fun onCatalystInstanceDestroy() {
        moduleScope.cancel()
        super.onCatalystInstanceDestroy()
    }

    companion object {
        const val MAX_BATCH_SIZE = 500
        const val PROGRESS_BATCH_SIZE = 50
    }
}

data class SmsMessage(
    val id: String,
    val sender: String,
    val body: String,
    val date: Long
)
