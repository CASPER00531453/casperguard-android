package io.github.dovecoteescapee.byedpi.activities

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import io.github.dovecoteescapee.byedpi.R
import io.github.dovecoteescapee.byedpi.databinding.ActivityActivationBinding
import io.github.dovecoteescapee.byedpi.utility.License
import io.github.dovecoteescapee.byedpi.utility.LicenseReply
import kotlinx.coroutines.launch

class ActivationActivity : AppCompatActivity() {
    private lateinit var binding: ActivityActivationBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivityActivationBinding.inflate(layoutInflater)
        setContentView(binding.root)

        License.lastError(this)?.let { binding.activationMessage.setText(errorMessage(it)) }

        binding.activationButton.setOnClickListener {
            val code = binding.activationCode.text.toString().trim().uppercase()
            if (code.isEmpty()) return@setOnClickListener

            binding.activationButton.isEnabled = false
            binding.activationMessage.setText(R.string.activation_checking)

            lifecycleScope.launch {
                when (val reply = License.activate(this@ActivationActivity, code)) {
                    is LicenseReply.Active -> {
                        startActivity(Intent(this@ActivationActivity, MainActivity::class.java))
                        finish()
                    }

                    is LicenseReply.Denied ->
                        binding.activationMessage.setText(errorMessage(reply.error))

                    LicenseReply.Unavailable ->
                        binding.activationMessage.setText(R.string.activation_unavailable)
                }
                binding.activationButton.isEnabled = true
            }
        }
    }

    private fun errorMessage(error: String): Int =
        when (error) {
            "revoked" -> R.string.activation_revoked
            "expired" -> R.string.activation_expired
            "device_mismatch" -> R.string.activation_device_mismatch
            else -> R.string.activation_invalid
        }
}
