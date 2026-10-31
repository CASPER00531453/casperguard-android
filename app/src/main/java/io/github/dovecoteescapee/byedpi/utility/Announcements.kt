package io.github.dovecoteescapee.byedpi.utility

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.app.NotificationCompat
import io.github.dovecoteescapee.byedpi.R
import io.github.dovecoteescapee.byedpi.activities.MainActivity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONException
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

object Announcements {
    private val TAG: String = Announcements::class.java.simpleName
    private const val URL_ANNOUNCEMENT =
        "https://casperguard.casperguard-server.workers.dev/api/announcement"
    private const val TIMEOUT_MS = 10_000
    private const val CHANNEL_ID = "CasperGuardAnnouncements"
    private const val NOTIFICATION_ID = 3

    /** Returns the announcement text once per announcement, otherwise null. */
    suspend fun fetchNew(context: Context): String? =
        withContext(Dispatchers.IO) {
            try {
                val connection = URL(URL_ANNOUNCEMENT).openConnection() as HttpURLConnection
                try {
                    connection.connectTimeout = TIMEOUT_MS
                    connection.readTimeout = TIMEOUT_MS
                    connection.useCaches = false
                    if (connection.responseCode != HttpURLConnection.HTTP_OK) {
                        return@withContext null
                    }

                    val text = connection.inputStream.bufferedReader().use { it.readText() }
                    val json = JSONObject(text)
                    val id = json.getLong("id")
                    val message = json.getString("text")
                    val store = context.getSharedPreferences("announcements", Context.MODE_PRIVATE)
                    if (id == 0L || message.isBlank() || id == store.getLong("seen_id", 0L)) {
                        return@withContext null
                    }

                    store.edit().putLong("seen_id", id).apply()
                    message
                } finally {
                    connection.disconnect()
                }
            } catch (e: IOException) {
                Log.w(TAG, "Announcement unreachable", e)
                null
            } catch (e: JSONException) {
                Log.w(TAG, "Bad announcement", e)
                null
            }
        }

    fun notify(context: Context, message: String) {
        registerNotificationChannel(context, CHANNEL_ID, R.string.announcement_channel_name)

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(context.getString(R.string.announcement_title))
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setAutoCancel(true)
            .setContentIntent(
                PendingIntent.getActivity(
                    context,
                    0,
                    Intent(context, MainActivity::class.java),
                    PendingIntent.FLAG_IMMUTABLE,
                )
            )
            .build()

        context.getSystemService(NotificationManager::class.java)
            ?.notify(NOTIFICATION_ID, notification)
    }
}
