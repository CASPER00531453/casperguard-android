package io.github.dovecoteescapee.byedpi.activities

import android.content.ActivityNotFoundException
import android.content.Intent
import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import io.github.dovecoteescapee.byedpi.R
import io.github.dovecoteescapee.byedpi.databinding.ActivityUpdateBinding
import io.github.dovecoteescapee.byedpi.utility.Updater
import kotlinx.coroutines.launch
import java.io.IOException

class UpdateActivity : AppCompatActivity() {
    private lateinit var binding: ActivityUpdateBinding

    companion object {
        private val TAG: String = UpdateActivity::class.java.simpleName
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivityUpdateBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.updateButton.setOnClickListener {
            binding.updateButton.isEnabled = false
            binding.updateMessage.setText(R.string.update_downloading)

            lifecycleScope.launch {
                try {
                    Updater.install(this@UpdateActivity) {
                        binding.updateMessage.text = getString(R.string.update_progress, it)
                    }
                    binding.updateMessage.setText(R.string.update_install_hint)
                } catch (e: IOException) {
                    Log.e(TAG, "Update download failed", e)
                    binding.updateMessage.setText(R.string.update_failed)
                } catch (e: ActivityNotFoundException) {
                    Log.e(TAG, "No installer found", e)
                    binding.updateMessage.setText(R.string.update_failed)
                }
                binding.updateButton.isEnabled = true
            }
        }
    }

    override fun onResume() {
        super.onResume()
        if (!Updater.isRequired(this)) {
            startActivity(Intent(this, MainActivity::class.java))
            finish()
        }
    }
}
