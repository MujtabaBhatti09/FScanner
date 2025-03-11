import React, { useEffect, useState } from "react";
import { View, Text, Button, PermissionsAndroid, Platform, TouchableOpacity, Alert } from "react-native";
import { BleManager, Device } from "react-native-ble-plx";

const BluetoothScanner = () => {
    const [devices, setDevices] = useState<Device[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [connectedDevice, setConnectedDevice] = useState<Device | null | string>(null);
    const [device, setDevice] = useState<string>("")
    const manager = new BleManager();

    // 🔹 Request Bluetooth Permissions
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
        return true; // iOS doesn't need explicit permissions
    };

    // 🔹 Scan for Bluetooth Devices
    const scanDevices = async () => {
        const hasPermission = await requestBluetoothPermission();
        if (!hasPermission) {
            console.warn("Bluetooth permissions denied.");
            return;
        }

        setIsScanning(true);
        setDevices([]); // Reset device list before new scan

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
        }, 5000); // Stop scanning after 5 seconds
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
                }
            }
        } catch (error) {
            console.error("Error discovering services:", error);
        }
    };

    // 🔹 Connect to a Bluetooth Device
    const connectToDevice = async (device: Device) => {
        try {
            console.log(`Connecting to ${device.name}...`);
            const connectedDevice = await device.connect();
            await connectedDevice.discoverAllServicesAndCharacteristics(); // Discover services

            setConnectedDevice(connectedDevice);
            console.log(`Connected to ${JSON.stringify(connectedDevice)}`);
            getDeviceServices()
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
                // Convert base64 to image URI
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
          // Example: Start Scan Command (Replace with actual command)
          const command = "A501"; // Check your scanner's manual for the correct command
          const commandBuffer = Buffer.from(command, "hex").toString("base64");
      
          await connectedDevice.writeCharacteristicWithResponseForService(
            serviceUUID,
            characteristicUUID,
            commandBuffer
          );
      
          Alert.alert("Command Sent", "Waiting for fingerprint...");
        } catch (error) {
          Alert.alert("Error", "Failed to send command");
          console.error(error);
        }
      };
      

    // 🔹 Disconnect from Bluetooth Device
    // const disconnectDevice = async () => {
    //     if (connectedDevice) {
    //         await connectedDevice.disconnect();
    //         setConnectedDevice(null);
    //         console.log("Disconnected from device.");
    //     }
    // };

    return (
        <>
            

        </>
    );
};

export default BluetoothScanner;
