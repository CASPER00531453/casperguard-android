package io.github.dovecoteescapee.byedpi.activities

import android.annotation.SuppressLint
import android.graphics.Color
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import io.github.dovecoteescapee.byedpi.utility.Editions
import io.github.dovecoteescapee.byedpi.utility.License

class BurakAiActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    private inner class Bridge {
        @JavascriptInterface
        fun getCode(): String = License.code(this@BurakAiActivity).orEmpty()

        @JavascriptInterface
        fun getDeviceId(): String = License.deviceId(this@BurakAiActivity)

        @JavascriptInterface
        fun getEdition(): String = Editions.selected(this@BurakAiActivity)
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        Editions.applyTheme(this)
        super.onCreate(savedInstanceState)

        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        webView = WebView(this)
        setContentView(webView)

        val viltrum = Editions.selected(this) == Editions.VILTRUM
        webView.setBackgroundColor(Color.parseColor(if (viltrum) "#140808" else "#0F172A"))
        webView.settings.javaScriptEnabled = true
        webView.addJavascriptInterface(Bridge(), "CasperBridge")
        webView.webViewClient = object : WebViewClient() {
            // Only the bundled chat page may run with the bridge attached.
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest) = true
        }
        webView.loadUrl("file:///android_asset/chat/index.html")
    }

    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
