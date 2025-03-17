import "../global.css";
import { Buffer } from 'buffer';
import RNFS from 'react-native-fs';
import Logo from "../assets/logo.png";
import React, { useEffect, useState } from "react";
import RNBluetoothClassic, { BluetoothDevice } from 'react-native-bluetooth-classic';
import { View, Text, TouchableOpacity, Alert, Image, ScrollView, StatusBar, useWindowDimensions, PermissionsAndroid, Platform } from "react-native";
import { decodeResponse, decodeWithPolyfill, manualDecode } from "../common/utils/Decode";
// import { convertToBitmap, processFingerprint } from "../common/utils/BitmapCoversion";

export default function BluetoothClassic() {

  const { height } = useWindowDimensions();
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);
  const [bluetoothEnabled, setBluetoothEnabled] = useState<boolean>(false);
  const [fingerprintImage, setFingerprintImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false)

  const CMD_PASSWORD = 0x01;    // Password
  const CMD_ENROLID = 0x02;     // Enroll in Device
  const CMD_VERIFY = 0x03;      // Verify in Device
  const CMD_IDENTIFY = 0x04;    // Identify in Device
  const CMD_DELETEID = 0x05;    // Delete in Device
  const CMD_CLEARID = 0x06;     // Clear in Device
  const CMD_ENROLHOST = 0x07;   // Enroll to Host
  const CMD_CAPTUREHOST = 0x08; // Capture to Host
  const CMD_MATCH = 0x09;       // Match
  const CMD_WRITEFPCARD = 0x0A; // Write Card Data
  const CMD_READFPCARD = 0x0B;  // Read Card Data
  const CMD_CARDSN = 0x0E;      // Read Card Sn
  const CMD_GETSN = 0x10;       // Get SN
  const CMD_FPCARDMATCH = 0x13; // Card Match
  const CMD_WRITEDATACARD = 0x14; // Write Card Data
  const CMD_READDATACARD = 0x15;  // Read Card Data
  const CMD_GETBAT = 0x21;      // Get Battery
  const CMD_GETIMAGE = 0x30;    // Get Image
  const CMD_GETCHAR = 0x31;     // Get Char
  const CMD_UPCARDSN = 0x43;    // Up Card SN
  const CMD_SETTIMEOUT = 0x50;  // Set Timeout
  const CMD_STOPWORK = 0x51;    // Stop Work

  // Class variables
  let mIsWork = false;
  let mDeviceCmd = 0;
  let mCmdSize = 0;
  let mUpImageSize = 0;


  const getPairedDevices = async () => {
    try {
      if (bluetoothEnabled) {
        console.log("Bluetooth Already Enabled")
      }
      else if (!bluetoothEnabled) {
        Alert.alert("Bluetooth is Off", "Please turn on Bluetooth first", [
          { text: "Turn On", onPress: enableBluetooth },
          { text: "Cancel", style: "cancel" },
        ]);
        return;
      }

      const paired = await RNBluetoothClassic.getBondedDevices();
      setDevices(paired);
    } catch (error) {
      console.error("Error fetching devices:", error);
      Alert.alert("Error", "Failed to get paired devices");
    }
  };

  useEffect(() => {
    checkBluetoothStatus();
    getPairedDevices()
  }, []);

  // Check if Bluetooth is enabled
  const checkBluetoothStatus = async () => {
    try {
      const isEnabled = await RNBluetoothClassic.isBluetoothEnabled();
      setBluetoothEnabled(isEnabled);
    } catch (error) {
      console.error("Error checking Bluetooth status:", error);
    }
  };

  // Function to enable Bluetooth
  const enableBluetooth = async () => {
    try {
      const success = await RNBluetoothClassic.requestBluetoothEnabled();
      if (success) {
        setBluetoothEnabled(true);
        getPairedDevices(); // Fetch devices after enabling Bluetooth
      }
    } catch (error) {
      console.error("Error enabling Bluetooth:", error);
      Alert.alert("Error", "Could not enable Bluetooth");
    }
  };

  // Connect to device
  const connectToDevice = async (device: BluetoothDevice) => {
    try {
      const isConnected = await device.isConnected();
      if (!isConnected) {
        await device.connect();
      }
      setConnectedDevice(device);
      Alert.alert("Connected", `Connected to ${device.name}`);
    } catch (error) {
      console.error("Connection error:", error);
      Alert.alert("Error", `Failed to connect to ${device.name}`);
    }
  };

  // Utility function to calculate checksum
  const calcCheckSum = (buffer: Uint8Array, length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += buffer[i];
    }
    return sum & 0x00ff; // Match Java implementation exactly (0x00ff, not 0xffff)
  };

  // Utility function to add status messages
  const AddStatusList = (message: string) => {
    console.log(message);
  };

  // Timeout functionality
  const TimeOutStart = () => {
    console.log("Starting timeout timer");
  };

  // const sendCommand = async (cmdId: number, data: number[] = []) => {
  //   if (mIsWork) return;

  //   if (!connectedDevice || !connectedDevice.isConnected) {
  //     Alert.alert("Error", "No device connected or connection lost.");
  //     return;
  //   }

  //   try {
  //     let size = data.length;
  //     let sendSize = 9 + size;
  //     let sendBuf = new Uint8Array(sendSize);

  //     sendBuf[0] = "F".charCodeAt(0);
  //     sendBuf[1] = "T".charCodeAt(0);
  //     sendBuf[2] = 0;
  //     sendBuf[3] = 0;
  //     sendBuf[4] = cmdId;
  //     sendBuf[5] = size & 0xff;
  //     sendBuf[6] = (size >> 8) & 0xff;

  //     if (size > 0) {
  //       for (let i = 0; i < size; i++) {
  //         sendBuf[7 + i] = data[i];
  //       }
  //     }

  //     // Calculate checksum
  //     let sum = calcCheckSum(sendBuf, (7 + size));
  //     sendBuf[7 + size] = sum & 0xff;
  //     sendBuf[8 + size] = (sum >> 8) & 0xff;

  //     mIsWork = true;
  //     TimeOutStart();
  //     mDeviceCmd = cmdId;
  //     mCmdSize = 0;

  //     await connectedDevice.write(Buffer.from(sendBuf));

  //     // Process command type and update status
  //     switch (cmdId) {
  //       case CMD_PASSWORD:
  //         // Password handling
  //         break;
  //       case CMD_ENROLID:
  //         AddStatusList("Enrol ID ...");
  //         break;
  //       case CMD_VERIFY:
  //         AddStatusList("Verify ID ...");
  //         break;
  //       case CMD_IDENTIFY:
  //         AddStatusList("Search ID ...");
  //         break;
  //       case CMD_DELETEID:
  //         AddStatusList("Delete ID ...");
  //         break;
  //       case CMD_CLEARID:
  //         AddStatusList("Clear ...");
  //         break;
  //       case CMD_ENROLHOST:
  //         AddStatusList("Enrol Template ...");
  //         break;
  //       case CMD_CAPTUREHOST:
  //         AddStatusList("Capture Template ...");
  //         break;
  //       case CMD_MATCH:
  //         AddStatusList("Match Template ...");
  //         break;
  //       case CMD_WRITEFPCARD:
  //       case CMD_WRITEDATACARD:
  //         AddStatusList("Write Card ...");
  //         break;
  //       case CMD_READFPCARD:
  //       case CMD_READDATACARD:
  //         AddStatusList("Read Card ...");
  //         break;
  //       case CMD_FPCARDMATCH:
  //         AddStatusList("FingerprintCard Match ...");
  //         break;
  //       case CMD_CARDSN:
  //         AddStatusList("Read Card SN ...");
  //         break;
  //       case CMD_GETSN:
  //         AddStatusList("Get Device SN ...");
  //         break;
  //       case CMD_GETBAT:
  //         AddStatusList("Get Battery Value ...");
  //         break;
  //       case CMD_GETIMAGE:
  //         mUpImageSize = 0;
  //         AddStatusList("Get Fingerprint Image ...");
  //         break;
  //       case CMD_GETCHAR:
  //         AddStatusList("Get Fingerprint Data ...");
  //         break;
  //     }
  //     setLoading(true)
  //     // Delay before reading response
  //     await new Promise(resolve => setTimeout(resolve, 500));
  //     let response: any = await connectedDevice.read();
  //     console.log("Raw response:", response);

  //     if (!response) {
  //       setLoading(false)
  //       console.log("Device returned null. Check connection and command format.");
  //       return null;
  //     }
  //     console.log(cmdId === CMD_GETIMAGE)
  //     if (cmdId === CMD_GETIMAGE || cmdId === CMD_GETCHAR) {
  //       setLoading(false)
  //       console.log("Response:", response);
  //       const imageDataUrl = processFingerprint(response);
  //       if (imageDataUrl) {
  //         // Return the image data URL that can be used in an <Image> component
  //         return imageDataUrl;
  //       }
  //     }

  //     // Process other responses...
  //     return response;
  //   } catch (error) {
  //     setLoading(false)
  //     console.error("Command error:", error);
  //     Alert.alert("Error", "Failed to communicate with device");
  //     return null;
  //   } finally {
  //     setLoading(false)
  //     mIsWork = false;
  //   }
  // };

  // const processFingerprint = (response: Buffer | Uint8Array): string | null => {
  //   try {
  //     // Verify the response starts with 'FT'
  //     if (response[0] !== 'F'.charCodeAt(0) || response[1] !== 'T'.charCodeAt(0)) {
  //       console.error("Invalid response format, doesn't start with FT");
  //       return null;
  //     }

  //     // Parse the response header
  //     const cmdId = response[4];

  //     // Get the data length (little endian)
  //     const dataLength = response[5] + (response[6] << 8);

  //     // Extract the image data (starts at position 7)
  //     const imageData = response.slice(7, 7 + dataLength);

  //     // For fingerprint images (CMD_GETCHAR or CMD_GETIMAGE)
  //     if (cmdId === CMD_GETCHAR || cmdId === CMD_GETIMAGE) {
  //       // Convert the raw image data to a bitmap format
  //       convertToBitmap(imageData);
  //     }

  //     return null;
  //   } catch (error) {
  //     console.error("Error processing fingerprint data:", error);
  //     return null;
  //   }
  // };

  // Function to convert raw fingerprint data to a displayable image
  // const convertToBitmap = (data: Uint8Array | Buffer): string => {
  //   // For a grayscale fingerprint image:
  //   // 1. Determine the dimensions (typically fixed for the scanner model)
  //   const width = 256; // Adjust based on your scanner's specifications
  //   const height = 288; // Adjust based on your scanner's specifications

  //   // 2. Create a canvas element (using react-native-canvas or a similar library)
  //   const canvas = document.createElement('canvas');
  //   canvas.width = width;
  //   canvas.height = height;
  //   const ctx = canvas.getContext('2d');

  //   if (!ctx) {
  //     console.error("Could not get canvas context");
  //     return '';
  //   }

  //   // 3. Create an ImageData object
  //   const imageData = ctx.createImageData(width, height);

  //   // 4. Fill the ImageData with the fingerprint data
  //   for (let i = 0; i < data.length && i < width * height; i++) {
  //     const value = data[i]; // Grayscale value

  //     // For each pixel, set RGBA values (grayscale)
  //     imageData.data[i * 4] = value;     // R
  //     imageData.data[i * 4 + 1] = value; // G
  //     imageData.data[i * 4 + 2] = value; // B
  //     imageData.data[i * 4 + 3] = 255;   // Alpha (fully opaque)
  //   }

  //   // 5. Put the image data on the canvas
  //   ctx.putImageData(imageData, 0, 0);

  //   // 6. Convert to base64 data URL that can be used as an image source
  //   return canvas.toDataURL('image/png');
  // };

  // Scan Fingerprint

  const sendCommand = async (cmdId: number, data: number[] = []) => {
    if (mIsWork) return;

    if (!connectedDevice || !connectedDevice.isConnected) {
      Alert.alert("Error", "No device connected or connection lost.");
      return;
    }

    try {
      let size = data.length;
      let sendSize = 9 + size;
      let sendBuf = new Uint8Array(sendSize);

      sendBuf[0] = "F".charCodeAt(0);
      sendBuf[1] = "T".charCodeAt(0);
      sendBuf[2] = 0;
      sendBuf[3] = 0;
      sendBuf[4] = cmdId;
      sendBuf[5] = size & 0xff;
      sendBuf[6] = (size >> 8) & 0xff;

      if (size > 0) {
        for (let i = 0; i < size; i++) {
          sendBuf[7 + i] = data[i];
        }
      }

      // Calculate checksum
      let sum = calcCheckSum(sendBuf, (7 + size));
      sendBuf[7 + size] = sum & 0xff;
      sendBuf[8 + size] = (sum >> 8) & 0xff;

      mIsWork = true;
      TimeOutStart();
      mDeviceCmd = cmdId;
      mCmdSize = 0;

      await connectedDevice.write(Buffer.from(sendBuf));

      // Process command type and update status
      switch (cmdId) {
        case CMD_PASSWORD:
          // Password handling
          break;
        case CMD_ENROLID:
          AddStatusList("Enrol ID ...");
          break;
        case CMD_VERIFY:
          AddStatusList("Verify ID ...");
          break;
        case CMD_IDENTIFY:
          AddStatusList("Search ID ...");
          break;
        case CMD_DELETEID:
          AddStatusList("Delete ID ...");
          break;
        case CMD_CLEARID:
          AddStatusList("Clear ...");
          break;
        case CMD_ENROLHOST:
          AddStatusList("Enrol Template ...");
          break;
        case CMD_CAPTUREHOST:
          AddStatusList("Capture Template ...");
          break;
        case CMD_MATCH:
          AddStatusList("Match Template ...");
          break;
        case CMD_WRITEFPCARD:
        case CMD_WRITEDATACARD:
          AddStatusList("Write Card ...");
          break;
        case CMD_READFPCARD:
        case CMD_READDATACARD:
          AddStatusList("Read Card ...");
          break;
        case CMD_FPCARDMATCH:
          AddStatusList("FingerprintCard Match ...");
          break;
        case CMD_CARDSN:
          AddStatusList("Read Card SN ...");
          break;
        case CMD_GETSN:
          AddStatusList("Get Device SN ...");
          break;
        case CMD_GETBAT:
          AddStatusList("Get Battery Value ...");
          break;
        case CMD_GETIMAGE:
          mUpImageSize = 0;
          AddStatusList("Get Fingerprint Image ...");
          break;
        case CMD_GETCHAR:
          AddStatusList("Get Fingerprint Data ...");
          break;
      }

      // Delay before reading response
      await new Promise(resolve => setTimeout(resolve, 500));
      let response = await connectedDevice.read();
      console.log("Raw response:", response);
      const decodedResponse = decodeWithPolyfill(response)
      console.log("Decoded response:", decodedResponse);
      decodeResponse(response)
      // const manualResponse = manualDecode(response)
      // console.log("Decoded response:", manualResponse);
      if (!response) {
        console.log("Device returned null. Check connection and command format.");
        return;
      }

      // Process response here
      // ...

    } catch (error) {
      console.error("Command error:", error);
      Alert.alert("Error", "Failed to communicate with device");
    } finally {
      mIsWork = false; // Reset work state regardless of outcome
    }
  };

  const scanFingerprint = async () => {
    await sendCommand(CMD_GETCHAR);
  };

  // const scanFingerprint = async () => {
  //   const imageData = await sendCommand(CMD_GETCHAR);

  //   if (imageData) {
  //     // Display the fingerprint image
  //     setFingerprintImage(imageData); // Assuming you have a state variable for this
  //   } else {
  //     console.error("Failed to get fingerprint image");
  //   }
  // };

  return (
    <ScrollView className="bg-white p-2">
      <StatusBar translucent backgroundColor="transparent" />
      <View className="mt-10 flex flex-col justify-between h-screen">
        <Text className="text-4xl font-bold text-center">Fingerprint Scanner</Text>

        <View className="border rounded-lg shadow-xl bg-white" style={{ height: height / 4 }}>
          {fingerprintImage ? (
            <Image source={{ uri: fingerprintImage }} className="h-full w-full" />
          ) : (
            <Image source={Logo} className="object-contain h-full w-full" />
          )}
        </View>

        <TouchableOpacity onPress={scanFingerprint} className="p-4 bg-red-950 rounded-lg">
          <Text className="text-white text-center font-bold">Scan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={getPairedDevices}
          className="p-4 my-2 bg-blue-500 rounded-lg"
        >
          <Text className="text-white text-center font-bold">Refresh Paired Devices</Text>
        </TouchableOpacity>

        {devices.map((device, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => connectToDevice(device)}
            className={`p-4 my-2 rounded-lg ${connectedDevice?.address === device.address ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <Text className="text-center font-bold">
              {device.name} ({device.address})
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}