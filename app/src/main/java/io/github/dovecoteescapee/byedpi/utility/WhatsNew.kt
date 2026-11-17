package io.github.dovecoteescapee.byedpi.utility

import android.app.Activity
import android.content.Context
import android.net.Uri
import android.view.LayoutInflater
import android.widget.VideoView
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import io.github.dovecoteescapee.byedpi.R

object WhatsNew {
    // Raise this when the window should appear again with new content.
    private const val CONTENT_ID = 1

    private fun store(context: Context) =
        context.getSharedPreferences("whats_new", Context.MODE_PRIVATE)

    fun shouldShow(context: Context): Boolean =
        store(context).getInt("seen", 0) < CONTENT_ID

    fun show(activity: Activity) {
        // Marked first so a recreated activity never shows it twice.
        store(activity).edit().putInt("seen", CONTENT_ID).apply()

        val view = LayoutInflater.from(activity).inflate(R.layout.dialog_whats_new, null)
        val video = view.findViewById<VideoView>(R.id.whats_new_video)
        video.setVideoURI(Uri.parse("android.resource://${activity.packageName}/${R.raw.whats_new}"))
        video.setOnPreparedListener { player ->
            player.isLooping = true
            player.setVolume(0f, 0f)
            video.start()
        }
        // A video the device cannot play must not block the window.
        video.setOnErrorListener { _, _, _ ->
            video.visibility = android.view.View.GONE
            true
        }

        MaterialAlertDialogBuilder(activity)
            .setView(view)
            .setPositiveButton(R.string.whats_new_ok, null)
            .setOnDismissListener { video.stopPlayback() }
            .show()
    }
}
