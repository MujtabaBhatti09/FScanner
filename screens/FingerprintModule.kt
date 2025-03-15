package com.fscanner

import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.util.Log
import android.widget.Toast
import android.util.Base64
import android.hardware.biometrics.BiometricPrompt
import android.content.Context
import android.os.Build
import androidx.annotation.RequiresApi
import android.os.Handler
import android.os.Looper
import android.os.Message
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
// Import Fingerprint Reader and Processing Classes
import com.fpreader.fpdevice.AsyncBluetoothReader
import com.fpreader.fpdevice.AsyncUsbReader
import com.fpreader.fpdevice.BluetoothReader
import com.fpreader.fpdevice.UsbReader
import com.fpreader.fpdevice.UseManager
import com.fpreader.fpdevice.listener.ReaderListener

// Import Fingerprint Core Processing Classes
import com.fpreader.fpcore.FPFormat
import com.fpreader.fpcore.FPImage
import com.fpreader.fpcore.FPMatch
import com.fpreader.fpcore.wsq

class FingerprintModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var bluetoothReader: BluetoothReader? = null
    private val handler = createHandler()

    override fun getName(): String {
        return "FingerprintModule"
    }

    private fun createHandler(): Handler {
        return object : Handler(Looper.getMainLooper()) {
            override fun handleMessage(msg: Message) {
                when (msg.what) {
                    BluetoothReader.MESSAGE_STATE_CHANGE -> handleStateChange(msg.arg1)
                    BluetoothReader.MESSAGE_READ -> handleRead(msg.obj, msg.arg1)
                    BluetoothReader.MESSAGE_DEVICE_NAME -> handleDeviceName(msg.data)
                    BluetoothReader.MESSAGE_TOAST -> handleToast(msg.data)
                    // Add more message handlers as needed
                }
            }
        }
    }

    private fun handleStateChange(state: Int) {
        val stateMap = Arguments.createMap()
        stateMap.putInt("state", state)
        sendEvent("onStateChange", stateMap)
    }

    private fun handleRead(data: Any?, size: Int) {
        // Handle data read from the device
        // Convert to appropriate format and send as event
    }

    private fun handleDeviceName(bundle: Bundle) {
        val deviceName = bundle.getString(BluetoothReader.DEVICE_NAME)
        val deviceMap = Arguments.createMap()
        deviceName?.let { deviceMap.putString("deviceName", it) }
        sendEvent("onDeviceConnected", deviceMap)
    }

    private fun handleToast(bundle: Bundle) {
        val message = bundle.getString(BluetoothReader.TOAST)
        val messageVal = bundle.getInt(BluetoothReader.MSGVAL)
        val toastMap = Arguments.createMap()
        message?.let { toastMap.putString("message", it) }
        toastMap.putInt("messageVal", messageVal)
        sendEvent("onToast", toastMap)
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    @ReactMethod
    fun initialize(promise: Promise) {
        try {
            if (bluetoothReader == null) {
                bluetoothReader = BluetoothReader(reactApplicationContext, handler)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e("FingerprintModule", "Initialization error", e)
            promise.reject("INIT_ERROR", e.message)
        }
    }

    @ReactMethod
    fun startBluetooth(promise: Promise) {
        try {
            bluetoothReader?.start()
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e("FingerprintModule", "Start bluetooth error", e)
            promise.reject("START_ERROR", e.message)
        }
    }

    @ReactMethod
    fun connectToDevice(deviceAddress: String, promise: Promise) {
        try {
            val bluetoothAdapter = BluetoothAdapter.getDefaultAdapter()
            val device = bluetoothAdapter.getRemoteDevice(deviceAddress)
            bluetoothReader?.connect(device)
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e("FingerprintModule", "Connect error", e)
            promise.reject("CONNECT_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getDeviceInfo(promise: Promise) {
        try {
            bluetoothReader?.GetDeviceInfo()
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e("FingerprintModule", "Get device info error", e)
            promise.reject("DEVICE_INFO_ERROR", e.message)
        }
    }

    @ReactMethod
    fun captureFingerprint(promise: Promise) {
        try {
            bluetoothReader?.GetImageAndDate()
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e("FingerprintModule", "Capture fingerprint error", e)
            promise.reject("CAPTURE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun stopBluetooth(promise: Promise) {
        try {
            bluetoothReader?.stop()
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e("FingerprintModule", "Stop bluetooth error", e)
            promise.reject("STOP_ERROR", e.message)
        }
    }

    @ReactMethod
    fun enrollFingerprint(id: Int, promise: Promise) {
        try {
            bluetoothReader?.EnrolInModule(id)
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e("FingerprintModule", "Enroll fingerprint error", e)
            promise.reject("ENROLL_ERROR", e.message)
        }
    }
    
    @ReactMethod
    fun verifyFingerprint(id: Int, promise: Promise) {
        try {
            bluetoothReader?.VerifyInModule(id)
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e("FingerprintModule", "Verify fingerprint error", e)
            promise.reject("VERIFY_ERROR", e.message)
        }
    }
    
    @ReactMethod
    fun searchFingerprint(promise: Promise) {
        try {
            bluetoothReader?.SearchInModule()
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e("FingerprintModule", "Search fingerprint error", e)
            promise.reject("SEARCH_ERROR", e.message)
        }
    }
    
    @ReactMethod
    fun deleteFingerprint(id: Int, promise: Promise) {
        try {
            bluetoothReader?.DeleteInModule(id)
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e("FingerprintModule", "Delete fingerprint error", e)
            promise.reject("DELETE_ERROR", e.message)
        }
    }
    
    @ReactMethod
    fun clearAllFingerprints(promise: Promise) {
        try {
            bluetoothReader?.ClearModule()
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e("FingerprintModule", "Clear fingerprints error", e)
            promise.reject("CLEAR_ERROR", e.message)
        }
    }
}