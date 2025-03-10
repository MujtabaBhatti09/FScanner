import "./global.css"
import Logo from "./assets/logo.png"

import { Image, ScrollView, StatusBar, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";

export default function App() {
  const { height, width } = useWindowDimensions()

  return (
    <>
      <ScrollView className="bg-white p-2">
        <StatusBar translucent backgroundColor={"transparent"} />
        <View className="mt-10 flex flex-col justify-between h-screen">
          <View className="gap-y-6">
            <Text className="text-4xl font-bold text-center">
              Finger Print Scanner
            </Text>
            <View className="border rounded-lg shadow-xl bg-white" style={{ height: height / 2.4 }}>
              <Image source={Logo} className="object-contain h-full w-full" />
            </View>
            <View className="flex flex-row gap-6 flex-wrap justify-around">
              <TouchableOpacity activeOpacity={.5} className="p-4 shadow-lg rounded-lg bg-gray-300"><Text className="font-semibold text-gray-700">Scan Resolution 1</Text></TouchableOpacity>
              <TouchableOpacity activeOpacity={.5} className="p-4 shadow-lg rounded-lg bg-gray-300"><Text className="font-semibold text-gray-700">Scan Resolution 2</Text></TouchableOpacity>
              <TouchableOpacity activeOpacity={.5} className="p-4 shadow-lg rounded-lg bg-gray-300"><Text className="font-semibold text-gray-700">Scan Resolution 3</Text></TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity activeOpacity={.5} className="p-4 shadow-lg rounded-lg bg-black"><Text className="font-semibold text-white text-center">Upload</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </>
  )
}