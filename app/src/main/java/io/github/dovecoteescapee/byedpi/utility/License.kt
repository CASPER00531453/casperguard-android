package io.github.dovecoteescapee.byedpi.utility

import android.annotation.SuppressLint
import android.content.Context
import android.content.SharedPreferences
import android.provider.Settings
import android.util.Base64
import android.util.Log
import io.github.dovecoteescapee.byedpi.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

sealed interface LicenseReply {
    data class Active(val token: String) : LicenseReply
    data class Denied(val error: String) : LicenseReply
    data object Unavailable : LicenseReply
}

object License {
    private val TAG: String = License::class.java.simpleName
    private const val API_BASE = "https://casperguard.casperguard-server.workers.dev"
    private const val CHECK_INTERVAL_MS = 60_000L
    private const val UPDATE_CHECK_EVERY = 60
    private const val TIMEOUT_MS = 10_000
    private val DENIED_ERRORS = setOf("invalid_code", "revoked", "expired", "device_mismatch")

    private fun store(context: Context): SharedPreferences =
        context.getSharedPreferences("license", Context.MODE_PRIVATE)

    fun hasCode(context: Context): Boolean = store(context).getString("code", null) != null

    fun lastError(context: Context): String? = store(context).getString("error", null)

    suspend fun activate(context: Context, code: String): LicenseReply {
        val reply = post(context, "/api/activate", code)
        if (reply is LicenseReply.Active) {
            store(context).edit()
                .putString("code", code)
                .putString("token", reply.token)
                .remove("error")
                .apply()
        }
        return reply
    }

    /**
     * Returns when the app must stop: an update is required, the code was denied,
     * or the last token expired without reaching the server.
     * Runs until cancelled otherwise.
     */
    suspend fun watch(context: Context) {
        var checks = 0
        while (true) {
            if (checks++ % UPDATE_CHECK_EVERY == 0 && Updater.refresh(context)) return

            val code = store(context).getString("code", null) ?: return
            when (val reply = post(context, "/api/check", code)) {
                is LicenseReply.Active ->
                    store(context).edit().putString("token", reply.token).apply()

                is LicenseReply.Denied -> {
                    store(context).edit()
                        .remove("code")
                        .remove("token")
                        .putString("error", reply.error)
                        .apply()
                    return
                }

                LicenseReply.Unavailable -> if (!tokenAlive(context)) return
            }
            delay(CHECK_INTERVAL_MS)
        }
    }

    private fun tokenAlive(context: Context): Boolean =
        try {
            val token = store(context).getString("token", null).orEmpty()
            val payload = Base64.decode(token.substringBefore('.'), Base64.URL_SAFE)
            JSONObject(String(payload)).getLong("exp") > System.currentTimeMillis() / 1000
        } catch (e: Exception) {
            Log.w(TAG, "Unreadable token", e)
            false
        }

    @SuppressLint("HardwareIds")
    private fun deviceId(context: Context): String =
        Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID).orEmpty()

    private suspend fun post(context: Context, path: String, code: String): LicenseReply =
        withContext(Dispatchers.IO) {
            val body = JSONObject()
                .put("code", code)
                .put("device_id", deviceId(context))
                .put("platform", "android")
                .put("app_version", BuildConfig.VERSION_NAME.removeSuffix("-debug"))
                .toString()

            try {
                val connection = URL(API_BASE + path).openConnection() as HttpURLConnection
                try {
                    connection.requestMethod = "POST"
                    connection.connectTimeout = TIMEOUT_MS
                    connection.readTimeout = TIMEOUT_MS
                    connection.doOutput = true
                    connection.setRequestProperty("Content-Type", "application/json")
                    connection.outputStream.use { it.write(body.toByteArray()) }

                    val ok = connection.responseCode == HttpURLConnection.HTTP_OK
                    val stream = if (ok) connection.inputStream else connection.errorStream
                    val json = JSONObject(stream?.bufferedReader()?.use { it.readText() } ?: "{}")
                    val error = json.optString("error")
                    when {
                        ok -> LicenseReply.Active(json.getString("token"))
                        error in DENIED_ERRORS -> LicenseReply.Denied(error)
                        else -> LicenseReply.Unavailable
                    }
                } finally {
                    connection.disconnect()
                }
            } catch (e: IOException) {
                Log.w(TAG, "License server unreachable", e)
                LicenseReply.Unavailable
            } catch (e: org.json.JSONException) {
                Log.w(TAG, "Bad license response", e)
                LicenseReply.Unavailable
            }
        }
}
