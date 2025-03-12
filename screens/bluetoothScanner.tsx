// import "../global.css";
// import Logo from "../assets/logo.png";
// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   Alert,
//   Image,
//   ScrollView,
//   StatusBar,
//   useWindowDimensions,
//   PermissionsAndroid,
//   Platform,
// } from "react-native";
// import RNBluetoothClassic, { BluetoothDevice } from 'react-native-bluetooth-classic';

// export default function BluetoothClassic() {
//   const { height } = useWindowDimensions();
//   const [devices, setDevices] = useState<BluetoothDevice[]>([]);
//   const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);
//   const [fingerprintImage, setFingerprintImage] = useState<string | null>(null);

//   // Request Bluetooth permissions
//   const requestBluetoothPermission = async () => {
//     if (Platform.OS === "android") {
//       try {
//         const granted = await PermissionsAndroid.requestMultiple([
//           PermissionsAndroid.PERMISSIONS.BLUETOOTH,
//           PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
//           PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
//         ]);

//         return (
//           granted["android.permission.BLUETOOTH"] === PermissionsAndroid.RESULTS.GRANTED &&
//           granted["android.permission.BLUETOOTH_ADMIN"] === PermissionsAndroid.RESULTS.GRANTED
//         );
//       } catch (error) {
//         console.error("Permission error:", error);
//         return false;
//       }
//     }
//     return true;
//   };

//   // Get paired devices
//   const getPairedDevices = async () => {
//     const hasPermission = await requestBluetoothPermission();
//     if (!hasPermission) {
//       Alert.alert("Error", "Bluetooth permissions denied");
//       return;
//     }

//     try {
//       const paired = await RNBluetoothClassic.getBondedDevices();
//       setDevices(paired.filter(device => device.name.includes('FINGERPRINT')));
//     } catch (error) {
//       console.error("Error fetching devices:", error);
//       Alert.alert("Error", "Failed to get paired devices");
//     }
//   };

//   // Connect to device
//   const connectToDevice = async (device: BluetoothDevice) => {
//     try {
//       const isConnected = await device.isConnected();
//       if (!isConnected) {
//         await device.connect();
//       }
//       setConnectedDevice(device);
//       Alert.alert("Connected", `Connected to ${device.name}`);
//     } catch (error) {
//       console.error("Connection error:", error);
//       Alert.alert("Error", `Failed to connect to ${device.name}`);
//     }
//   };

//   // Send command to device
//   const sendCommand = async (command: string) => {
//     if (!connectedDevice) {
//       Alert.alert("Error", "No device connected");
//       return;
//     }

//     try {
//       await connectedDevice.write(command);
//       const response = await connectedDevice.read();
      
//       if (response) {
//         const imageURI = `data:image/png;base64,${response}`;
//         setFingerprintImage(imageURI);
//       }
//     } catch (error) {
//       console.error("Command error:", error);
//       Alert.alert("Error", "Failed to communicate with device");
//     }
//   };

//   // Scan fingerprint
//   const scanFingerprint = async () => {
//     await sendCommand("SCAN");
//   };

//   // Disconnect device
//   const disconnectDevice = async () => {
//     if (connectedDevice) {
//       try {
//         await connectedDevice.disconnect();
//         setConnectedDevice(null);
//         Alert.alert("Disconnected", "Device disconnected");
//       } catch (error) {
//         console.error("Disconnection error:", error);
//       }
//     }
//   };

//   useEffect(() => {
//     getPairedDevices();
    
//     return () => {
//       if (connectedDevice) {
//         disconnectDevice();
//       }
//     };
//   }, []);

//   return (
//     <ScrollView className="bg-white p-2">
//       <StatusBar translucent backgroundColor="transparent" />
//       <View className="mt-10 flex flex-col justify-between h-screen">
//         <Text className="text-4xl font-bold text-center">Fingerprint Scanner</Text>
        
//         <View className="border rounded-lg shadow-xl bg-white" style={{ height: height / 2.4 }}>
//           {fingerprintImage ? (
//             <Image source={{ uri: fingerprintImage }} className="object-contain h-full w-full" />
//           ) : (
//             <Image source={Logo} className="object-contain h-full w-full" />
//           )}
//         </View>

//         <TouchableOpacity 
//           onPress={getPairedDevices} 
//           className="p-4 my-2 bg-blue-500 rounded-lg"
//         >
//           <Text className="text-white text-center font-bold">Refresh Paired Devices</Text>
//         </TouchableOpacity>

//         {devices.map((device, index) => (
//           <TouchableOpacity
//             key={index}
//             onPress={() => connectToDevice(device)}
//             className={`p-4 my-2 rounded-lg ${connectedDevice?.address === device.address ? 'bg-green-500' : 'bg-gray-300'}`}
//           >
//             <Text className="text-center font-bold">
//               {device.name} ({device.address})
//             </Text>
//           </TouchableOpacity>
//         ))}

//         {connectedDevice && (
//           <>
//             <TouchableOpacity 
//               onPress={scanFingerprint} 
//               className="p-4 my-2 bg-purple-500 rounded-lg"
//             >
//               <Text className="text-white text-center font-bold">Scan Fingerprint</Text>
//             </TouchableOpacity>

//             <TouchableOpacity 
//               onPress={disconnectDevice} 
//               className="p-4 my-2 bg-red-500 rounded-lg"
//             >
//               <Text className="text-white text-center font-bold">Disconnect Device</Text>
//             </TouchableOpacity>
//           </>
//         )}
//       </View>
//     </ScrollView>
//   );
// }
import "../global.css";
import Logo from "../assets/logo.png";
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Alert, Image, ScrollView, StatusBar, useWindowDimensions, PermissionsAndroid, Platform } from "react-native";
import RNBluetoothClassic, { BluetoothDevice } from 'react-native-bluetooth-classic';

export default function App() {
  const { height } = useWindowDimensions();
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null);
  const [fingerprintImage, setFingerprintImage] = useState<string | null>(null);

  const requestBluetoothPermission = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADMIN,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        return (
          granted["android.permission.BLUETOOTH"] === PermissionsAndroid.RESULTS.GRANTED &&
          granted["android.permission.BLUETOOTH_ADMIN"] === PermissionsAndroid.RESULTS.GRANTED
        );
      } catch (error) {
        console.error("Permission error:", error);
        return false;
      }
    }
    return true;
  };

  const getPairedDevices = async () => {
    const hasPermission = await requestBluetoothPermission();
    if (!hasPermission) {
      Alert.alert("Error", "Bluetooth permissions denied");
      return;
    }

    try {
      const paired = await RNBluetoothClassic.getBondedDevices();
      setDevices(paired.filter(device => device.name.includes('FINGERPRINT')));
    } catch (error) {
      console.error("Error fetching devices:", error);
      Alert.alert("Error", "Failed to get paired devices");
    }
  };

  useEffect(() => {
    getPairedDevices();
  }, []);

  return (
    <ScrollView className="bg-white p-2">
      <StatusBar translucent backgroundColor="transparent" />
      <View className="mt-10 flex flex-col justify-between h-screen">
        <Text className="text-4xl font-bold text-center">Fingerprint Scanner</Text>
        
        <View className="border rounded-lg shadow-xl bg-white" style={{ height: height / 2.4 }}>
          {fingerprintImage ? (
            <Image source={{ uri: fingerprintImage }} className="object-contain h-full w-full" />
          ) : (
            <Image source={Logo} className="object-contain h-full w-full" />
          )}
        </View>

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