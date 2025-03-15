import "../global.css"
import React, { useEffect, useState, useRef } from "react";
import {
    View,
    Text,
    Animated,
    StyleSheet
} from "react-native";

export default function Splash({ navigation }: any) {

    const fadeAnim = useRef(new Animated.Value(0)).current

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true
        }).start()
    }, [fadeAnim])


    useEffect(() => {
        setTimeout(() => {
            navigation.replace("Bluetooth Classic")
        }, 3000)
    }, [])

    return (
        <>
            <View className="h-full items-center justify-center">
                <Animated.View className={`bg-red-900 w-3/4 justify-center h-2/6 rounded-full`} style={{ opacity: fadeAnim }}>
                    <Text className="text-4xl font-bold text-black text-center">PPF</Text>
                </Animated.View>
            </View>
        </>
    )
}