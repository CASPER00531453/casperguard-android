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

    companion object {
        private val CODE_PATTERN = Regex("CG[^A-Z0-9]*([A-Z0-9]{4})[^A-Z0-9]*([A-Z0-9]{4})")
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivityActivationBinding.inflate(layoutInflater)
        setContentView(binding.root)

        License.lastError(this)?.let { binding.activationMessage.setText(errorMessage(it)) }

        binding.activationButton.setOnClickListener {
            val code = parseCode(binding.activationCode.text.toString())
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
                        binding.activationMessage.text =
                            if (reply.error == "invalid_code") {
                                getString(R.string.activation_invalid_entered, code)
                            } else {
                                getString(errorMessage(reply.error))
                            }

                    LicenseReply.Unavailable ->
                        binding.activationMessage.setText(R.string.activation_unavailable)
                }
                binding.activationButton.isEnabled = true
            }
        }
    }

    // Pasted messages may carry extra text around the code.
    private fun parseCode(input: String): String {
        val text = input.uppercase()
        val match = CODE_PATTERN.find(text) ?: return text.filter { it in 'A'..'Z' || it in '0'..'9' || it == '-' }
        return "CG-${match.groupValues[1]}-${match.groupValues[2]}"
    }

    private fun errorMessage(error: String): Int =
        when (error) {
            "revoked" -> R.string.activation_revoked
            "expired" -> R.string.activation_expired
            "device_mismatch" -> R.string.activation_device_mismatch
            else -> R.string.activation_invalid
        }
}
