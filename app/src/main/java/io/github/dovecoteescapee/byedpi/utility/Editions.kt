package io.github.dovecoteescapee.byedpi.utility

import android.app.Activity
import android.content.ComponentName
import android.content.Context
import android.content.SharedPreferences
import android.content.pm.PackageManager
import io.github.dovecoteescapee.byedpi.R

object Editions {
    const val DEFAULT = "default"
    const val VILTRUM = "viltrum"

    private const val DEFAULT_ICON = "io.github.dovecoteescapee.byedpi.activities.DefaultLauncher"
    private const val VILTRUM_ICON = "io.github.dovecoteescapee.byedpi.activities.ViltrumLauncher"

    private fun store(context: Context): SharedPreferences =
        context.getSharedPreferences("editions", Context.MODE_PRIVATE)

    fun owned(context: Context): Set<String> =
        store(context).getStringSet("owned", null).orEmpty()

    fun selected(context: Context): String {
        val edition = store(context).getString("selected", DEFAULT) ?: DEFAULT
        return if (edition in owned(context)) edition else DEFAULT
    }

    fun applyTheme(activity: Activity) {
        if (selected(activity) == VILTRUM) activity.setTheme(R.style.Theme_Viltrum)
    }

    fun setOwned(context: Context, editions: Set<String>) {
        store(context).edit().putStringSet("owned", editions).apply()
        updateIcon(context)
    }

    fun select(context: Context, edition: String) {
        store(context).edit().putString("selected", edition).apply()
        updateIcon(context)
    }

    private fun updateIcon(context: Context) {
        val viltrum = selected(context) == VILTRUM
        // Enable first: the launcher must never see the app without an entry point.
        setIconEnabled(context, if (viltrum) VILTRUM_ICON else DEFAULT_ICON, true)
        setIconEnabled(context, if (viltrum) DEFAULT_ICON else VILTRUM_ICON, false)
    }

    private fun setIconEnabled(context: Context, name: String, enabled: Boolean) {
        val state = if (enabled) {
            PackageManager.COMPONENT_ENABLED_STATE_ENABLED
        } else {
            PackageManager.COMPONENT_ENABLED_STATE_DISABLED
        }
        val component = ComponentName(context, name)
        if (context.packageManager.getComponentEnabledSetting(component) != state) {
            context.packageManager.setComponentEnabledSetting(
                component,
                state,
                PackageManager.DONT_KILL_APP,
            )
        }
    }
}
