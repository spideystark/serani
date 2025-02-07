import React from "react";
import { View, Text, ScrollView } from "react-native";
import { useSelector } from "react-redux";

const CartPage = () => {
  const activities = useSelector((state) => state.activities.activities);

  return (
    <ScrollView>
      {activities.map((activity) => (
        <View key={activity.id} style={{ padding: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>{activity.name}</Text>
          <Text style={{ fontSize: 16, color: "gray" }}>Progress: {activity.progress}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

export default CartPage;
