package com.fscanner

import android.bluetooth.BluetoothDevice
import android.util.Base64
import android.os.Handler
import android.os.Looper
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.fpreader.fpdevice.BluetoothReader
import com.fpreader.fpdevice.listener.ReaderListener
import com.fpreader.fpcore.FPImage

class FingerprintModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), ReaderListener {

    private var bluetoothReader: BluetoothReader? = null
    private val handler = Handler(Looper.getMainLooper())

    override fun getName(): String {
        return "FingerprintModule"
    }

    @ReactMethod
    fun initialize(promise: Promise) {
        try {
            if (bluetoothReader == null) {
                bluetoothReader = BluetoothReader(reactApplicationContext, handler)
                bluetoothReader?.setReaderListener(this) // Attach the listener to the class instance
            }
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e("FingerprintModule", "Initialization error", e)
            promise.reject("INIT_ERROR", e.message)
        }
    }

    override fun onDeviceConnected(device: BluetoothDevice) {
        val deviceMap = Arguments.createMap().apply {
            putString("deviceName", device.name)
        }
        sendEvent("onDeviceConnected", deviceMap)
    }

    override fun onDeviceDisconnected() {
        sendEvent("onDeviceDisconnected", Arguments.createMap())
    }

    override fun onFingerprintCaptured(image: FPImage) {
        val imageData = Base64.encodeToString(image.data, Base64.DEFAULT)
        val map = Arguments.createMap().apply {
            putString("fingerprintImage", imageData)
        }
        sendEvent("onFingerprintCaptured", map)
    }

    override fun onError(errorCode: Int, errorMessage: String) {
        val errorMap = Arguments.createMap().apply {
            putInt("errorCode", errorCode)
            putString("errorMessage", errorMessage)
        }
        sendEvent("onError", errorMap)
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            ?.emit(eventName, params)
    }
}