package com.somus.app.leap

import ai.liquid.leap.Conversation
import ai.liquid.leap.GenerationOptions
import ai.liquid.leap.ModelRunner
import ai.liquid.leap.downloader.LeapModelDownloader
import ai.liquid.leap.message.ChatMessage
import ai.liquid.leap.message.ChatMessageContent
import ai.liquid.leap.message.MessageResponse
import ai.liquid.leap.structuredoutput.Generatable
import ai.liquid.leap.structuredoutput.GeneratableFactory
import ai.liquid.leap.structuredoutput.Guide
import android.content.Context
import android.util.Log
import java.io.File
import java.net.URL
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.uimanager.ViewManager
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject

// ── LeapPackage ────────────────────────────────────────────────

class LeapPackage : ReactPackage {
    override fun createNativeModules(ctx: ReactApplicationContext): List<NativeModule> =
        listOf(LeapModule(ctx))
    override fun createViewManagers(ctx: ReactApplicationContext): List<ViewManager<*, *>> =
        emptyList()
}

// ── TransactionSchema ──────────────────────────────────────────

@Serializable
@Generatable(description = "Financial transaction extracted from a bank SMS message")
data class TransactionSchema(
    @Guide(description = "true if this is a bank/financial transaction SMS, false otherwise")
    val isFinancial: Boolean = false,

    @Guide(description = "Transaction amount as a positive number. 0.0 if not financial")
    val amount: Double = 0.0,

    @Guide(description = "ISO 4217 currency code detected from symbol or context: INR USD EUR GBP AED SAR KES PHP IDR THB CNY JPY KRW MXN SGD MYR")
    val currencyCode: String = "",

    @Guide(description = "Merchant name, store, service, or recipient. Empty string if unknown")
    val merchant: String = "",

    @Guide(description = "Best matching spending category")
    val category: TransactionCategory = TransactionCategory.OTHER,

    @Guide(description = "DEBIT if money left account, CREDIT if money entered account")
    val type: TransactionType = TransactionType.DEBIT,

    @Guide(description = "Last 4 digits of card or account number if mentioned. Null otherwise")
    val accountReference: String? = null,

    @Guide(description = "Confidence 0.0 to 1.0: how clearly the SMS states transaction details")
    val confidence: Float = 0.0f
)

@Serializable
enum class TransactionCategory {
    FOOD_DINING, TRANSPORT, SHOPPING, GROCERIES,
    UTILITIES, ENTERTAINMENT, HEALTH_MEDICAL, TRAVEL,
    EDUCATION, FUEL, ATM_CASH, TRANSFER,
    SUBSCRIPTION, INSURANCE, RENT, OTHER
}

@Serializable
enum class TransactionType { DEBIT, CREDIT }

// ── BankFormatRegistry ─────────────────────────────────────────

data class BankHint(val bank: String, val country: String, val currency: String)

object BankFormatRegistry {
    private val registry = mapOf(
        "HDFCBK"    to BankHint("HDFC Bank", "India", "INR"),
        "ICICIBK"   to BankHint("ICICI Bank", "India", "INR"),
        "SBINBK"    to BankHint("State Bank of India", "India", "INR"),
        "AXISBK"    to BankHint("Axis Bank", "India", "INR"),
        "KOTAKB"    to BankHint("Kotak Mahindra Bank", "India", "INR"),
        "PAYTMB"    to BankHint("Paytm Payments Bank", "India", "INR"),
        "Safaricom" to BankHint("M-Pesa", "Kenya", "KES"),
        "MPESA"     to BankHint("M-Pesa", "Kenya", "KES"),
        "EQBNK"     to BankHint("Equity Bank", "Kenya", "KES"),
        "EmirNBD"   to BankHint("Emirates NBD", "UAE", "AED"),
        "ADCBSMS"   to BankHint("ADCB", "UAE", "AED"),
        "FABSMS"    to BankHint("First Abu Dhabi Bank", "UAE", "AED"),
        "ALRAJHI"   to BankHint("Al Rajhi Bank", "Saudi Arabia", "SAR"),
        "SNCB"      to BankHint("Saudi National Bank", "Saudi Arabia", "SAR"),
        "BDO"       to BankHint("BDO Unibank", "Philippines", "PHP"),
        "BPI"       to BankHint("Bank of Philippine Islands", "Philippines", "PHP"),
        "GCASH"     to BankHint("GCash", "Philippines", "PHP"),
        "MANDIRI"   to BankHint("Bank Mandiri", "Indonesia", "IDR"),
        "BCA"       to BankHint("Bank Central Asia", "Indonesia", "IDR"),
        "KBANKTH"   to BankHint("Kasikorn Bank", "Thailand", "THB"),
        "SCBTH"     to BankHint("Siam Commercial Bank", "Thailand", "THB"),
        "DBS"       to BankHint("DBS Bank", "Singapore", "SGD"),
        "OCBC"      to BankHint("OCBC Bank", "Singapore", "SGD"),
        "UOB"       to BankHint("United Overseas Bank", "Singapore", "SGD"),
        "CHASE"     to BankHint("Chase", "USA", "USD"),
        "BOFA"      to BankHint("Bank of America", "USA", "USD"),
        "BARCLAYS"  to BankHint("Barclays", "UK", "GBP"),
        "HSBC"      to BankHint("HSBC", "UK", "GBP"),
        "SPARKASSE" to BankHint("Sparkasse", "Germany", "EUR"),
        "BBVAMX"    to BankHint("BBVA México", "Mexico", "MXN"),
        "MAYBK"     to BankHint("Maybank", "Malaysia", "MYR"),
        "CIMBMY"    to BankHint("CIMB Bank", "Malaysia", "MYR"),
        "KBSMS"     to BankHint("KB Kookmin Bank", "South Korea", "KRW"),
        "MUFG"      to BankHint("MUFG Bank", "Japan", "JPY"),
        "SMBC"      to BankHint("Sumitomo Mitsui", "Japan", "JPY")
    )

    fun getHint(sender: String): BankHint? {
        registry[sender]?.let { return it }
        val upper = sender.uppercase()
        return registry.entries.firstOrNull { (k, _) -> upper.contains(k.uppercase()) }?.value
    }
}

// ── TransactionResult ──────────────────────────────────────────

data class TransactionResult(
    val sender: String,
    val amount: Double,
    val currencyCode: String,
    val merchant: String,
    val category: String,
    val type: String,
    val accountReference: String?,
    val confidence: Float,
    val rawSms: String,
    val smsDate: Long
) {
    fun toWritableMap(): WritableMap = Arguments.createMap().apply {
        putString("sender", sender)
        putDouble("amount", amount)
        putString("currencyCode", currencyCode)
        putString("merchant", merchant)
        putString("category", category)
        putString("type", type)
        putString("accountReference", accountReference)
        putDouble("confidence", confidence.toDouble())
        putString("rawSms", rawSms)
        putDouble("smsDate", smsDate.toDouble())
    }
}

// ── LeapService ────────────────────────────────────────────────

class LeapService private constructor(private val context: Context) {

    private var modelRunner: ModelRunner? = null
    var currentModelSlug: String = ""; private set
    var currentQuantSlug: String = ""; private set

    fun isLoaded() = modelRunner != null

    suspend fun downloadAndLoad(
        modelSlug: String,
        quantSlug: String,
        onProgress: (Float) -> Unit
    ) = withContext(Dispatchers.IO) {
        val dl = LeapModelDownloader(context)
        val modelDir = dl.getModelResourceFolder(modelSlug, quantSlug)
        val ggufFilename = "LFM2.5-1.2B-Instruct.Q4_K_M.gguf"
        val schemaFile = File(modelDir, "$modelSlug-$quantSlug.json")
        val ggufFile = File(modelDir, ggufFilename)

        Log.i(TAG, "Model dir: ${modelDir.path}")
        Log.i(TAG, "GGUF exists: ${ggufFile.exists()} (${ggufFile.length()} bytes)")

        if (ggufFile.exists() && ggufFile.length() > 1_000_000) {
            Log.i(TAG, "Model already on device, ensuring manifest...")
            writeCompatibleManifest(schemaFile, ggufFilename)
            onProgress(0.9f)
        } else {
            // Download GGUF directly from HuggingFace (bypasses broken SDK manifest parser)
            val ggufUrl = "https://huggingface.co/9eve5h/$modelSlug/resolve/main/$ggufFilename"
            Log.i(TAG, "Downloading: $ggufUrl")
            onProgress(0.01f)

            modelDir.mkdirs()
            val tmpFile = File(modelDir, "$ggufFilename.tmp")

            val conn = URL(ggufUrl).openConnection().apply {
                connectTimeout = 30_000
                readTimeout = 60_000
                setRequestProperty("User-Agent", "Somus/1.0")
            }
            // Follow redirects (HuggingFace uses 302)
            val actualConn = if (conn is java.net.HttpURLConnection) {
                conn.instanceFollowRedirects = true
                conn
            } else conn

            val totalBytes = actualConn.contentLengthLong
            Log.i(TAG, "Download size: ${totalBytes / 1_048_576} MB")

            actualConn.getInputStream().use { input ->
                tmpFile.outputStream().use { output ->
                    val buf = ByteArray(131_072) // 128KB buffer
                    var downloaded = 0L
                    var lastReport = 0L
                    while (true) {
                        val n = input.read(buf)
                        if (n == -1) break
                        output.write(buf, 0, n)
                        downloaded += n
                        // Report progress every 1MB
                        if (downloaded - lastReport > 1_048_576) {
                            lastReport = downloaded
                            val p = if (totalBytes > 0) (downloaded.toFloat() / totalBytes) else 0f
                            Log.d(TAG, "Download: ${downloaded / 1_048_576}MB / ${totalBytes / 1_048_576}MB (${(p * 100).toInt()}%)")
                            onProgress(p * 0.9f)
                        }
                    }
                }
            }

            // Rename tmp to final
            tmpFile.renameTo(ggufFile)
            Log.i(TAG, "Download complete: ${ggufFile.length()} bytes")

            // Write SDK-compatible manifest
            writeCompatibleManifest(schemaFile, ggufFilename)
            onProgress(0.9f)
        }

        // Load the model via SDK
        Log.i(TAG, "Loading model into memory...")
        modelRunner = dl.loadModel(modelSlug, quantSlug)
        onProgress(1.0f)

        currentModelSlug = modelSlug
        currentQuantSlug = quantSlug
        Log.i(TAG, "Model loaded: $modelSlug / $quantSlug")
    }

    private fun writeCompatibleManifest(schemaFile: File, ggufFilename: String) {
        schemaFile.parentFile?.mkdirs()
        schemaFile.writeText("""{
  "schema_version": "1.0.0",
  "inference_type": "llama.cpp/text-to-text",
  "load_time_parameters": {
    "model": "$ggufFilename"
  },
  "generation_time_parameters": {
    "sampling_parameters": {
      "temperature": 0.1,
      "repetition_penalty": 1.05
    }
  }
}""")
        Log.i(TAG, "Wrote manifest: ${schemaFile.path}")
    }

    // Removed isLikelyFinancial since the fine-tuned model natively handles non-financial SMS by returning {"isFinancial": false}

    /**
     * Validate that the model's extracted amount actually appears in the SMS text.
     * Prevents hallucinated amounts.
     */
    private fun validateAmount(body: String, amount: Double): Boolean {
        if (amount <= 0.0) return false
        // Format amount as different representations that might appear in SMS
        val amtLong = amount.toLong()
        val amtStr = if (amount == amtLong.toDouble()) amtLong.toString() else "%.2f".format(amount)
        // Also try without decimals and with commas removed
        val bodyClean = body.replace(",", "")
        return bodyClean.contains(amtStr) ||
               bodyClean.contains(amtLong.toString()) ||
               bodyClean.contains("%.1f".format(amount)) ||
               bodyClean.contains("%.0f".format(amount))
    }

    // Removed correctCategory as the fine-tuned model has learned merchant-to-category mappings accurately.

    suspend fun extractTransaction(
        sender: String,
        body: String,
        timestamp: Long
    ): TransactionResult? = withContext(Dispatchers.IO) {
        // The fine-tuned model handles the non-financial filtering directly!

        val runner = modelRunner ?: return@withContext null
        val conversation: Conversation = runner.createConversation()
        val hint = BankFormatRegistry.getHint(sender)

        // Set system prompt via SYSTEM message
        conversation.appendToHistory(
            ChatMessage(ChatMessage.Role.SYSTEM, buildSystemPrompt(hint))
        )

        val options = GenerationOptions().apply {
            temperature = 0.1f
            minP = 0.05f
        }

        var rawJson: String? = null

        try {
            conversation.generateResponse(
                "SMS sender: $sender body: \"$body\"",
                options
            ).onEach { response ->
                if (response is MessageResponse.Complete) {
                    val content = response.fullMessage.content.firstOrNull()
                    rawJson = (content as? ChatMessageContent.Text)?.text
                }
            }.catch { e ->
                Log.e(TAG, "Generation error", e)
            }.collect()
        } catch (e: Exception) {
            Log.e(TAG, "Inference failed", e)
            return@withContext null
        }

        rawJson?.let { json ->
            try {
                // LFM2.5-1.2B may wrap JSON in markdown code blocks: ```json ... ```
                val cleanJson = json.trim()
                    .removePrefix("```json").removePrefix("```")
                    .removeSuffix("```")
                    .trim()
                Log.i(TAG, "Clean JSON: $cleanJson")
                val lenientJson = Json { ignoreUnknownKeys = true; isLenient = true; coerceInputValues = true }
                val schema = lenientJson.decodeFromString<TransactionSchema>(cleanJson)
                if (!schema.isFinancial) return@withContext null
                // Post-validate: reject if model hallucinated the amount
                if (!validateAmount(body, schema.amount)) {
                    Log.w(TAG, "Amount ${schema.amount} not found in SMS, rejecting")
                    return@withContext null
                }
                TransactionResult(
                    sender = sender,
                    amount = schema.amount,
                    currencyCode = schema.currencyCode.ifBlank { hint?.currency ?: "USD" },
                    merchant = schema.merchant,
                    category = schema.category.name,
                    type = schema.type.name,
                    accountReference = schema.accountReference,
                    confidence = schema.confidence,
                    rawSms = body,
                    smsDate = timestamp
                )
            } catch (e: Exception) {
                Log.e(TAG, "Deserialization failed: $json", e)
                null
            }
        }
    }

    suspend fun unload() = withContext(Dispatchers.IO) {
        modelRunner?.unload()
        modelRunner = null
    }

    private fun buildSystemPrompt(hint: BankHint?): String {
        val hintText = if (hint != null)
            "\nContext: SMS is from ${hint.bank} (${hint.country}). Default currency: ${hint.currency}."
        else ""

        return """Extract transaction details from this bank SMS as JSON.$hintText

IMPORTANT RULES:
- isFinancial=true ONLY if money HAS ALREADY been debited/credited (past tense: "debited", "credited", "sent", "paid", "received")
- isFinancial=false for: reminders, upcoming payments, "will be debited", "due on", "scheduled", renewals, alerts, OTPs, promotions
- amount: the EXACT number from SMS. Never invent or guess amounts.
- merchant: the actual payee/store/recipient name, NOT the SMS sender code (like AD-HDFCBK)
- category: SUBSCRIPTION for recurring services (Netflix, Spotify, Claude, ChatGPT, Adobe, cloud storage, etc.)
- category: SHOPPING for e-commerce (Amazon, Flipkart, etc.)
- category: FOOD_DINING for restaurants and food delivery
- category: TRANSFER for person-to-person or bank transfers

Output JSON: {"isFinancial":bool,"amount":number,"currencyCode":"XXX","merchant":"name","category":"CAT","type":"DEBIT or CREDIT","accountReference":"last4 or null","confidence":0.0-1.0}
category: FOOD_DINING|TRANSPORT|SHOPPING|GROCERIES|UTILITIES|ENTERTAINMENT|HEALTH_MEDICAL|TRAVEL|EDUCATION|FUEL|ATM_CASH|TRANSFER|SUBSCRIPTION|INSURANCE|RENT|OTHER

Output ONLY the JSON, nothing else.""".trimIndent()
    }

    companion object {
        private const val TAG = "LeapService"

        @Volatile private var instance: LeapService? = null

        fun getInstance(context: Context? = null): LeapService? {
            return instance ?: context?.let {
                synchronized(this) {
                    instance ?: LeapService(it.applicationContext).also { svc -> instance = svc }
                }
            }
        }
    }
}

// ── LeapModule ─────────────────────────────────────────────────

class LeapModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "LeapModule"

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())

    private fun emitProgress(progress: Float) {
        val p = Arguments.createMap()
        p.putDouble("progress", progress.toDouble())
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("LeapModelProgress", p)
    }

    @ReactMethod
    fun downloadAndLoadModel(modelSlug: String, quantSlug: String, promise: Promise) {
        scope.launch {
            try {
                LeapService.getInstance(reactContext)!!.downloadAndLoad(
                    modelSlug = modelSlug,
                    quantSlug = quantSlug,
                    onProgress = { progress ->
                        // Emit directly — RCTDeviceEventEmitter is thread-safe
                        emitProgress(progress)
                    }
                )
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("MODEL_LOAD_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun processSms(sender: String, body: String, timestamp: Double, promise: Promise) {
        scope.launch {
            try {
                val svc = LeapService.getInstance()
                    ?: return@launch promise.reject("MODEL_NOT_LOADED", "Model not loaded")
                val result = svc.extractTransaction(sender, body, timestamp.toLong())
                promise.resolve(result?.toWritableMap())
            } catch (e: Exception) {
                promise.reject("INFERENCE_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun processBatch(messages: ReadableArray, promise: Promise) {
        scope.launch {
            try {
                val svc = LeapService.getInstance()
                    ?: return@launch promise.reject("MODEL_NOT_LOADED", "Model not loaded")
                val results = Arguments.createArray()
                val total = messages.size()
                Log.i("LeapModule", "processBatch: starting $total messages")
                for (i in 0 until total) {
                    val msg = messages.getMap(i) ?: continue
                    val sender = msg.getString("sender") ?: ""
                    val body = msg.getString("body") ?: ""
                    try {
                        val tx = svc.extractTransaction(
                            sender = sender,
                            body   = body,
                            timestamp = msg.getDouble("date").toLong()
                        )
                        if (tx != null) results.pushMap(tx.toWritableMap())
                    } catch (e: Exception) {
                        Log.w("LeapModule", "Inference failed for msg $i ($sender): ${e.message}")
                        // Continue with next message instead of failing the whole batch
                    }
                    // Emit progress on every message
                    val p = Arguments.createMap()
                    p.putInt("processed", i + 1)
                    p.putInt("total", total)
                    p.putInt("found", results.size())
                    reactContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        .emit("LeapBatchProgress", p)
                }
                Log.i("LeapModule", "processBatch: done, found ${results.size()} transactions")
                promise.resolve(results)
            } catch (e: Exception) {
                Log.e("LeapModule", "processBatch failed", e)
                promise.reject("BATCH_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun isModelLoaded(promise: Promise) {
        promise.resolve(LeapService.getInstance()?.isLoaded() ?: false)
    }

    @ReactMethod
    fun unloadModel(promise: Promise) {
        scope.launch {
            try { LeapService.getInstance()?.unload(); promise.resolve(true) }
            catch (e: Exception) { promise.reject("UNLOAD_ERROR", e.message, e) }
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    override fun onCatalystInstanceDestroy() {
        scope.cancel()
        super.onCatalystInstanceDestroy()
    }
}
