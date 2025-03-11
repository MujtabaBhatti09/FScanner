// import "./global.css"
// import Logo from "./assets/logo.png"
// import React, { useEffect, useState } from "react";
// import { View, Text, Button, PermissionsAndroid, Platform, TouchableOpacity, Alert, Image, ScrollView, StatusBar, useWindowDimensions } from "react-native";
// import { BleManager, Device } from "react-native-ble-plx";

// export default function App() {
//   const { height, width } = useWindowDimensions()
//   const [devices, setDevices] = useState<Device[]>([]);
//   const [isScanning, setIsScanning] = useState(false);
//   const [connectedDevice, setConnectedDevice] = useState<Device | null | string>(null);
//   const [device, setDevice] = useState<string>("")
//   const manager = new BleManager();

//   // 🔹 Request Bluetooth Permissions
//   const requestBluetoothPermission = async () => {
//     if (Platform.OS === "android") {
//       try {
//         const granted = await PermissionsAndroid.requestMultiple([
//           PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
//           PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
//           PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//         ]);

//         return (
//           granted["android.permission.BLUETOOTH_SCAN"] === PermissionsAndroid.RESULTS.GRANTED &&
//           granted["android.permission.BLUETOOTH_CONNECT"] === PermissionsAndroid.RESULTS.GRANTED &&
//           granted["android.permission.ACCESS_FINE_LOCATION"] === PermissionsAndroid.RESULTS.GRANTED
//         );
//       } catch (error) {
//         console.error("Permission error:", error);
//         return false;
//       }
//     }
//     return true; // iOS doesn't need explicit permissions
//   };

//   // 🔹 Scan for Bluetooth Devices
//   const scanDevices = async () => {
//     const hasPermission = await requestBluetoothPermission();
//     if (!hasPermission) {
//       console.warn("Bluetooth permissions denied.");
//       return;
//     }

//     setIsScanning(true);
//     setDevices([]); // Reset device list before new scan

//     manager.startDeviceScan(null, null, (error, device) => {
//       if (error) {
//         console.error("Scan error:", error);
//         manager.stopDeviceScan();
//         return;
//       }

//       if (device && device.name) {
//         setDevices((prevDevices) => {
//           const isDuplicate = prevDevices.some((d) => d.id === device.id);
//           return isDuplicate ? prevDevices : [...prevDevices, device];
//         });
//       }
//     });

//     setTimeout(() => {
//       manager.stopDeviceScan();
//       setIsScanning(false);
//     }, 5000); // Stop scanning after 5 seconds
//   };

//   const getDeviceServices = async () => {
//     if (!connectedDevice) {
//       Alert.alert("Error", "No device connected");
//       return;
//     }

//     try {
//       const services = await connectedDevice.services();
//       for (const service of services) {
//         console.log(`Service: ${service.uuid}`);

//         const characteristics = await service.characteristics();
//         for (const characteristic of characteristics) {
//           console.log(`  Characteristic: ${characteristic.uuid}`);
//         }
//       }
//     } catch (error) {
//       console.error("Error discovering services:", error);
//     }
//   };

//   // 🔹 Connect to a Bluetooth Device
//   const connectToDevice = async (device: Device) => {
//     try {
//       console.log(`Connecting to ${device.name}...`);
//       const connectedDevice = await device.connect();
//       await connectedDevice.discoverAllServicesAndCharacteristics(); // Discover services

//       setConnectedDevice(connectedDevice);
//       console.log(`Connected to ${JSON.stringify(connectedDevice)}`);
//       getDeviceServices()
//     } catch (error) {
//       console.error("Connection error:", error);
//     }
//   };

//   const readFingerprintData = async (serviceUUID: string, characteristicUUID: string) => {
//     if (!connectedDevice) {
//       Alert.alert("Error", "No device connected");
//       return;
//     }

//     try {
//       const fingerprintData = await connectedDevice.readCharacteristicForService(serviceUUID, characteristicUUID);
//       console.log("Received fingerprint data:", fingerprintData.value);

//       if (fingerprintData.value) {
//         // Convert base64 to image URI
//         const imageURI = `data:image/png;base64,${fingerprintData.value}`;
//         setFingerprintImage(imageURI);
//       }
//     } catch (error) {
//       Alert.alert("Error", "Failed to read fingerprint data");
//       console.error(error);
//     }
//   };

//   const sendStartScanCommand = async (serviceUUID: string, characteristicUUID: string) => {
//     if (!connectedDevice) {
//       Alert.alert("Error", "No device connected");
//       return;
//     }

//     try {
//       // Example: Start Scan Command (Replace with actual command)
//       const command = "A501"; // Check your scanner's manual for the correct command
//       const commandBuffer = Buffer.from(command, "hex").toString("base64");

//       await connectedDevice.writeCharacteristicWithResponseForService(
//         serviceUUID,
//         characteristicUUID,
//         commandBuffer
//       );

//       Alert.alert("Command Sent", "Waiting for fingerprint...");
//     } catch (error) {
//       Alert.alert("Error", "Failed to send command");
//       console.error(error);
//     }
//   };
//   return (
//     <>
//       <ScrollView className="bg-white p-2">
//         <StatusBar translucent backgroundColor={"transparent"} />
//         <View className="mt-10 flex flex-col justify-between h-screen">
//           <View className="gap-y-6">
//             <Text className="text-4xl font-bold text-center">
//               Finger Print Scanner
//             </Text>
//             <View className="border rounded-lg shadow-xl bg-white" style={{ height: height / 2.4 }}>
//               <Image source={Logo} className="object-contain h-full w-full" />
//             </View>
//             <View className="flex flex-row gap-6 flex-wrap justify-around">
//               <TouchableOpacity activeOpacity={.5} className="p-4 shadow-lg rounded-lg bg-gray-300"><Text className="font-semibold text-gray-700">Scan Resolution 1</Text></TouchableOpacity>
//               <TouchableOpacity activeOpacity={.5} className="p-4 shadow-lg rounded-lg bg-gray-300"><Text className="font-semibold text-gray-700">Scan Resolution 2</Text></TouchableOpacity>
//               <TouchableOpacity activeOpacity={.5} className="p-4 shadow-lg rounded-lg bg-gray-300"><Text className="font-semibold text-gray-700">Scan Resolution 3</Text></TouchableOpacity>
//               {!isScanning && (
//                 <TouchableOpacity
//                   onPress={scanDevices}
//                   disabled={isScanning}
//                   activeOpacity={0.5}
//                   className="p-4 shadow-lg rounded-lg bg-gray-300"
//                 >
//                   <Text className="font-semibold text-gray-700">Scan Finger Scanner</Text>
//                 </TouchableOpacity>
//               )}

//               {isScanning && (
//                 <View className="absolute h-5/6 w-11/12 shadow-xl flex gap-y-2 items-center bg-[#F4F4F4]/80 rounded-lg">
//                   <Text className="text-2xl">Detected Bluetooth Devices:</Text>

//                   {devices.length > 0 ? (
//                     devices.map((device: any, index: number) => (
//                       <TouchableOpacity
//                         key={index}
//                         className="bg-black/70 px-4 rounded-md py-1"
//                         onPress={() => connectToDevice(device)} // Add device connection functionality
//                         activeOpacity={0.7}
//                       >
//                         <Text className="text-white font-semibold">
//                           {device.name} :-: {device.id}
//                         </Text>
//                       </TouchableOpacity>
//                     ))
//                   ) : (
//                     <Text className="text-red-600">No devices found</Text>
//                   )}
//                 </View>
//               )}
//             </View>
//           </View>
//           <TouchableOpacity activeOpacity={.5} className="p-4 shadow-lg rounded-lg bg-black"><Text className="font-semibold text-white text-center">Upload</Text></TouchableOpacity>
//         </View>
//       </ScrollView>
//     </>
//   )
// }
import "./global.css";
import Logo from "./assets/logo.png";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  useWindowDimensions,
  PermissionsAndroid,
  Platform,
} from "react-native";
import { BleManager, Device } from "react-native-ble-plx";
import base64 from "react-native-base64";

export default function App() {
  const { height } = useWindowDimensions();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [fingerprintImage, setFingerprintImage] = useState<string | null>(null);
  const [serviceUUID, setServiceUUID] = useState<string>("")
  const [characteristicUUID, setcharacteristicUUID] = useState<string>("")

  const manager = new BleManager();

  const requestBluetoothPermission = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return (
          granted["android.permission.BLUETOOTH_SCAN"] === PermissionsAndroid.RESULTS.GRANTED &&
          granted["android.permission.BLUETOOTH_CONNECT"] === PermissionsAndroid.RESULTS.GRANTED &&
          granted["android.permission.ACCESS_FINE_LOCATION"] === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (error) {
        console.error("Permission error:", error);
        return false;
      }
    }
    return true;
  };

  const scanDevices = async () => {
    const hasPermission = await requestBluetoothPermission();
    if (!hasPermission) {
      console.warn("Bluetooth permissions denied.");
      return;
    }

    setIsScanning(true);
    setDevices([]);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error("Scan error:", error);
        manager.stopDeviceScan();
        return;
      }

      if (device && device.name) {
        setDevices((prevDevices) => {
          const isDuplicate = prevDevices.some((d) => d.id === device.id);
          return isDuplicate ? prevDevices : [...prevDevices, device];
        });
      }
    });

    setTimeout(() => {
      manager.stopDeviceScan();
      setIsScanning(false);
    }, 5000);
  };

  const getDeviceServices = async () => {
    if (!connectedDevice) {
      Alert.alert("Error", "No device connected");
      return;
    }

    try {
      const services = await connectedDevice.services();
      for (const service of services) {
        console.log(`Service: ${service.uuid}`);
        const characteristics = await service.characteristics();
        for (const characteristic of characteristics) {
          console.log(`  Characteristic: ${characteristic.uuid}`);
          setServiceUUID(service.uuid)
          setcharacteristicUUID(characteristic.uuid)
        }
      }
    } catch (error) {
      console.error("Error discovering services:", error);
    }
  };


  const connectToDevice = async (device: Device) => {
    try {
      console.log(`Connecting to ${device.name}...`);
      const connectedDevice = await device.connect();
      await connectedDevice.discoverAllServicesAndCharacteristics(); // Discover services

      setConnectedDevice(connectedDevice);
      console.log(`Connected to ${JSON.stringify(connectedDevice)}`);
      getDeviceServices();
    } catch (error) {
      console.error("Connection error:", error);
    }
  };


  const readFingerprintData = async (serviceUUID: string, characteristicUUID: string) => {
    if (!connectedDevice) {
      Alert.alert("Error", "No device connected");
      return;
    }
    try {
      const fingerprintData = await connectedDevice.readCharacteristicForService(serviceUUID, characteristicUUID);
      console.log("Received fingerprint data:", fingerprintData.value);
      if (fingerprintData.value) {
        const imageURI = `data:image/png;base64,${fingerprintData.value}`;
        setFingerprintImage(imageURI);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to read fingerprint data");
      console.error(error);
    }
  };

  const sendStartScanCommand = async (serviceUUID: string, characteristicUUID: string) => {
    if (!connectedDevice) {
      Alert.alert("Error", "No device connected");
      return;
    }
    try {
      const command = "A501";
      const commandBuffer = base64.encode(command);
      await connectedDevice.writeCharacteristicWithResponseForService(serviceUUID, characteristicUUID, commandBuffer);
      Alert.alert("Command Sent", "Waiting for fingerprint...");
    } catch (error) {
      Alert.alert("Error", "Failed to send command");
      console.error(error);
    }
  };

  // serviceUUID = '00001800-0000-1000-8000-00805f9b34fb'
  // characteristicUUID = "00002a00-0000-1000-8000-00805f9b34fb"

  return (
    <ScrollView className="bg-white p-2">
      <StatusBar translucent backgroundColor="transparent" />
      <View className="mt-10 flex flex-col justify-between h-screen">
        <Text className="text-4xl font-bold text-center">Finger Print Scanner</Text>
        <View className="border rounded-lg shadow-xl bg-white" style={{ height: height / 2.4 }}>
          {fingerprintImage ? (
            <Image source={{ uri: fingerprintImage }} className="object-contain h-full w-full" />
          ) : (
            <Image source={Logo} className="object-contain h-full w-full" />
          )}
        </View>
        <TouchableOpacity onPress={scanDevices} activeOpacity={0.5} className="p-4 shadow-lg rounded-lg bg-gray-300">
          <Text className="font-semibold text-gray-700">Scan Finger Scanner</Text>
        </TouchableOpacity>
        {devices.map((device, index) => (
          <TouchableOpacity key={index} onPress={() => connectToDevice(device)} className="p-4 shadow-lg rounded-lg bg-black">
            <Text className="font-semibold text-white">Connect to {device.name}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={() => sendStartScanCommand(serviceUUID, characteristicUUID)} className="p-4 shadow-lg rounded-lg bg-green-500">
          <Text className="font-semibold text-white text-center">Start Fingerprint Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => readFingerprintData(serviceUUID, characteristicUUID)} className="p-4 shadow-lg rounded-lg bg-blue-500">
          <Text className="font-semibold text-white text-center">Read Fingerprint Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
