import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BluetoothBLE from '../../screens/bluetoothScannerBLE';
import BluetoothClassic from '../../screens/bluetoothScanner';
import Home from '../../screens/home';
import { StatusBar } from 'react-native';

export default function NavigatorComponent() {
    const Stack = createNativeStackNavigator()
    return (
        <>
            <StatusBar backgroundColor={"transparent"} translucent />
            <NavigationContainer>
                <Stack.Navigator initialRouteName="Home">
                    <Stack.Screen options={{ headerShown: false }} name="Home" component={Home} />
                    <Stack.Screen name="Bluetooth BLE" component={BluetoothBLE} />
                    <Stack.Screen name="Bluetooth Classic" component={BluetoothClassic} />
                </Stack.Navigator>
            </NavigationContainer>
        </>
    )
}