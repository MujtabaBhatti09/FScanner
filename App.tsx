import "./global.css"

import { ScrollView, StatusBar, Text, View } from "react-native";

export default function App() {
  return (
    <>
      <ScrollView className="bg-white">
        <StatusBar translucent backgroundColor={"transparent"} />
        <View className="mt-14 p-2">
          <Text className="text-4xl font-bold">
            Hello TailwindCss
          </Text>
        </View>
      </ScrollView>
    </>
  )
}