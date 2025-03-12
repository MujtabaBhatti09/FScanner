import "../global.css"
import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StatusBar,
} from "react-native";

export default function Home({ navigation }: any) {
    const [toggle, setToggle] = useState<any>({
        class: false,
        ble: false
    })

    const pressFun = (service: String) => {
        if (service === "BLE") {
            navigation.navigate("Bluetooth BLE")
        } else if (service === "Classis") {
            navigation.navigate("Bluetooth Classic")
        }
    }
    return (
        <>
            <ScrollView className="bg-white p-2">
                <StatusBar translucent backgroundColor={"transparent"} />
                <Text className=" text-2xl text-center font-semibold mt-12">
                    Select the Bluetooth Service for Fingerprint Scanner
                </Text>

                <View className="w-full border-b mt-8"></View>

                <View className="h-full gap-y-10 mt-[20%]">
                    <TouchableOpacity onPress={() => pressFun("Classic")} activeOpacity={.7} className="shadow-2xl h-3/4 rounded-lg bg-blue-500 justify-center">
                        <Text className="text-3xl font-bold text-center">
                            Classic
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => pressFun("BLE")} activeOpacity={.7} className="shadow-2xl h-3/4 rounded-lg bg-blue-700 justify-center">
                        <Text className="text-3xl font-bold text-center">
                            BLE
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </>
    )
}