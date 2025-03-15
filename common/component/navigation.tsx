import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BluetoothBLE from '../../screens/bluetoothScannerBLE';
import BluetoothClassic from '../../screens/bluetoothScanner';
import Splash from '../../screens/splash';
import { StatusBar } from 'react-native';

export default function NavigatorComponent() {
    const Stack = createNativeStackNavigator()
    return (
        <>
            <StatusBar backgroundColor={"transparent"} translucent />
            <NavigationContainer>
                <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
                    <Stack.Screen name="Splash" component={Splash} />
                    <Stack.Screen name="Bluetooth Classic" component={BluetoothClassic} />
                </Stack.Navigator>
            </NavigationContainer>
        </>
    )
}