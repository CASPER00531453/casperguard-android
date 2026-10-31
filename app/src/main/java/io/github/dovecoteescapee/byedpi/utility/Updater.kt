package io.github.dovecoteescapee.byedpi.utility

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.util.Log
import androidx.core.content.FileProvider
import io.github.dovecoteescapee.byedpi.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONException
import org.json.JSONObject
import java.io.File
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

object Updater {
    private val TAG: String = Updater::class.java.simpleName
    private const val MANIFEST_URL =
        "https://github.com/CASPER00531453/casperguard-android/releases/download/test-latest/version.json"
    private const val CHECK_TIMEOUT_MS = 5_000
    private const val DOWNLOAD_TIMEOUT_MS = 30_000

    private fun store(context: Context): SharedPreferences =
        context.getSharedPreferences("updater", Context.MODE_PRIVATE)

    private fun open(url: String, timeout: Int): HttpURLConnection =
        (URL(url).openConnection() as HttpURLConnection).apply {
            connectTimeout = timeout
            readTimeout = timeout
            useCaches = false
        }

    /** A known newer version stays required even while the manifest is unreachable. */
    fun isRequired(context: Context): Boolean =
        store(context).getInt("version_code", 0) > BuildConfig.VERSION_CODE

    /** Fetches the manifest and returns whether an update is required. */
    suspend fun refresh(context: Context): Boolean {
        withContext(Dispatchers.IO) {
            try {
                val connection = open(MANIFEST_URL, CHECK_TIMEOUT_MS)
                try {
                    if (connection.responseCode == HttpURLConnection.HTTP_OK) {
                        val text = connection.inputStream.bufferedReader().use { it.readText() }
                        val json = JSONObject(text)
                        store(context).edit()
                            .putInt("version_code", json.getInt("versionCode"))
                            .putString("url", json.getString("url"))
                            .apply()
                    }
                } finally {
                    connection.disconnect()
                }
            } catch (e: IOException) {
                Log.w(TAG, "Update manifest unreachable", e)
            } catch (e: JSONException) {
                Log.w(TAG, "Bad update manifest", e)
            }
        }
        return isRequired(context)
    }

    /** Downloads the APK and opens the system installer. */
    suspend fun install(context: Context, onProgress: (Int) -> Unit) {
        val url = store(context).getString("url", null) ?: throw IOException("No update url")
        val file = File(context.cacheDir, "updates/CasperGuard.apk")

        withContext(Dispatchers.IO) {
            file.parentFile?.mkdirs()
            val connection = open(url, DOWNLOAD_TIMEOUT_MS)
            try {
                if (connection.responseCode != HttpURLConnection.HTTP_OK) {
                    throw IOException("HTTP ${connection.responseCode}")
                }
                val total = connection.contentLength
                var done = 0
                connection.inputStream.use { input ->
                    file.outputStream().use { output ->
                        val buffer = ByteArray(16384)
                        while (true) {
                            val read = input.read(buffer)
                            if (read < 0) break
                            output.write(buffer, 0, read)
                            done += read
                            if (total > 0) {
                                val percent = done * 100 / total
                                withContext(Dispatchers.Main) { onProgress(percent) }
                            }
                        }
                    }
                }
                if (total > 0 && done != total) throw IOException("Incomplete download")
            } finally {
                connection.disconnect()
            }
        }

        val uri = FileProvider.getUriForFile(context, "${context.packageName}.updates", file)
        context.startActivity(
            Intent(Intent.ACTION_VIEW)
                .setDataAndType(uri, "application/vnd.android.package-archive")
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        )
    }
}
