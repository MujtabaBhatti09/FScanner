import "../global.css";
import { Buffer } from 'buffer';
import Logo from "../assets/logo.png";
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert, Image, ScrollView, StatusBar, useWindowDimensions, PermissionsAndroid, Platform } from "react-native";
import RNBluetoothClassic, { BluetoothDevice } from 'react-native-bluetooth-classic';

export default function BluetoothClassic() {

  const { height } = useWindowDimensions();
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);
  const [bluetoothEnabled, setBluetoothEnabled] = useState<boolean>(false);
  const [fingerprintImage, setFingerprintImage] = useState<string | null>(null);
  const CMD_GETCHAR = 0x31;
  const CMD_PASSWORD = 0x01;
  const CMD_ENROLID = 0x02;
  const CMD_VERIFY = 0x03;
  const CMD_IDENTIFY = 0x04;
  const CMD_DELETEID = 0x05;
  const CMD_CLEARID = 0x06;
  const CMD_ENROLHOST = 0x07;
  const CMD_CAPTUREHOST = 0x08;
  const CMD_MATCH = 0x09;
  const CMD_WRITEFPCARD = 0x0A;
  const CMD_WRITEDATACARD = 0x0B;
  const CMD_READFPCARD = 0x0C;
  const CMD_READDATACARD = 0x0D;
  const CMD_FPCARDMATCH = 0x0E;
  const CMD_CARDSN = 0x0F;
  const CMD_GETSN = 0x10;
  const CMD_GETBAT = 0x11;
  const CMD_GETIMAGE = 0x12;

  const getPairedDevices = async () => {
    try {
      if (!bluetoothEnabled) {
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

  const sendCommand = async (cmdId: number, data: number[] = []) => {
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
      let checksum = calcCheckSum(sendBuf, 7 + size);
      sendBuf[7 + size] = checksum & 0xff;
      sendBuf[8 + size] = (checksum >> 8) & 0xff;

      await connectedDevice.write(Buffer.from(sendBuf));
      console.log(`Sent command: ${cmdId}`);

      // Delay before reading response
      await new Promise(resolve => setTimeout(resolve, 500));
      let response = await connectedDevice.read();
      console.log("Raw response:", response);

      if (!response) {
        console.log("Device returned null. Check connection and command format.");
        return;
      }

      // Handle command responses
      switch (cmdId) {
        case CMD_PASSWORD:
          console.log("Processing Password Command...");
          break;
        case CMD_ENROLID:
          console.log("Enrol ID...");
          break;
        case CMD_VERIFY:
          console.log("Verify ID...");
          break;
        case CMD_IDENTIFY:
          console.log("Search ID...");
          break;
        case CMD_DELETEID:
          console.log("Delete ID...");
          break;
        case CMD_CLEARID:
          console.log("Clear...");
          break;
        case CMD_ENROLHOST:
          console.log("Enrol Template...");
          break;
        case CMD_CAPTUREHOST:
          console.log("Capture Template...");
          break;
        case CMD_MATCH:
          console.log("Match Template...");
          break;
        case CMD_WRITEFPCARD:
        case CMD_WRITEDATACARD:
          console.log("Write Card...");
          break;
        case CMD_READFPCARD:
        case CMD_READDATACARD:
          console.log("Read Card...");
          break;
        case CMD_FPCARDMATCH:
          console.log("Fingerprint Card Match...");
          break;
        case CMD_CARDSN:
          console.log("Read Card SN...");
          break;
        case CMD_GETSN:
          console.log("Get Device SN...");
          break;
        case CMD_GETBAT:
          console.log("Get Battery Value...");
          break;
        case CMD_GETIMAGE:
          console.log("Get Fingerprint Image...");
          break;
        case CMD_GETCHAR:
          console.log("Get Fingerprint Data...");
          break;
        default:
          console.log("Unknown Command...");
      }
    } catch (error) {
      console.error("Command error:", error);
      Alert.alert("Error", "Failed to communicate with device");
    }
  };

  // Utility function to calculate checksum
  const calcCheckSum = (buffer: Uint8Array, length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += buffer[i];
    }
    return sum & 0xffff;
  };

  // Scan Fingerprint
  const scanFingerprint = async () => {
    await sendCommand(CMD_GETCHAR);
  };

  // const readResponse = async () => {
  //   try {
  //     let fullResponse = "";
  //     while (true) {
  //       let chunk = await connectedDevice.read();
  //       if (!chunk) break;
  //       fullResponse += chunk;
  //     }
  //     console.log("Full response:", fullResponse);
  //     return fullResponse;
  //   } catch (error) {
  //     console.error("Read error:", error);
  //     return null;
  //   }
  // };


  // Scan fingerprint
  // const scanFingerprint = async () => {
  //   await sendCommand(0x2048); // Correct command for fingerprint scan
  // };

  useEffect(() => {
    getPairedDevices();
    // readResponse()
  }, []);

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