package io.github.dovecoteescapee.byedpi.utility

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.app.NotificationCompat
import io.github.dovecoteescapee.byedpi.R
import io.github.dovecoteescapee.byedpi.activities.GamesActivity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONException
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

object GameInvites {
    private val TAG: String = GameInvites::class.java.simpleName
    private const val URL_INVITES = "https://casperguard.casperguard-server.workers.dev/api/games/invites"
    private const val TIMEOUT_MS = 10_000
    private const val CHANNEL_ID = "CasperGuardGameInvites"
    private const val NOTIFICATION_ID_BASE = 1000

    /** Shows a notification for each pending invite not shown before; network problems are ignored. */
    suspend fun notifyNew(context: Context) {
        val code = License.code(context) ?: return
        val invites = fetch(context, code) ?: return
        val store = context.getSharedPreferences("game_invites", Context.MODE_PRIVATE)
        val seen = store.getStringSet("seen", null).orEmpty()
        val fresh = invites.filter { it.first.toString() !in seen }
        if (fresh.isEmpty()) return

        fresh.forEach { (id, from) -> notify(context, id, from) }
        store.edit().putStringSet("seen", seen + fresh.map { it.first.toString() }).apply()
    }

    private suspend fun fetch(context: Context, code: String): List<Pair<Long, String>>? =
        withContext(Dispatchers.IO) {
            try {
                val connection = URL(URL_INVITES).openConnection() as HttpURLConnection
                try {
                    connection.requestMethod = "POST"
                    connection.connectTimeout = TIMEOUT_MS
                    connection.readTimeout = TIMEOUT_MS
                    connection.doOutput = true
                    connection.setRequestProperty("Content-Type", "application/json")
                    val body = JSONObject().put("code", code).put("device_id", License.deviceId(context))
                    connection.outputStream.use { it.write(body.toString().toByteArray()) }
                    if (connection.responseCode != HttpURLConnection.HTTP_OK) return@withContext null

                    val json = JSONObject(connection.inputStream.bufferedReader().use { it.readText() })
                    val invites = json.getJSONArray("invites")
                    (0 until invites.length()).map {
                        val invite = invites.getJSONObject(it)
                        invite.getLong("id") to invite.getJSONObject("from").getString("nickname")
                    }
                } finally {
                    connection.disconnect()
                }
            } catch (e: IOException) {
                Log.w(TAG, "Game invites unreachable", e)
                null
            } catch (e: JSONException) {
                Log.w(TAG, "Bad game invites response", e)
                null
            }
        }

    private fun notify(context: Context, id: Long, from: String) {
        registerNotificationChannel(context, CHANNEL_ID, R.string.game_invite_channel_name)

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(context.getString(R.string.game_invite_title))
            .setContentText(context.getString(R.string.game_invite_text, from))
            .setAutoCancel(true)
            .setContentIntent(
                PendingIntent.getActivity(
                    context,
                    0,
                    Intent(context, GamesActivity::class.java),
                    PendingIntent.FLAG_IMMUTABLE,
                )
            )
            .build()

        context.getSystemService(NotificationManager::class.java)
            ?.notify(NOTIFICATION_ID_BASE + (id % 1000).toInt(), notification)
    }
}
