import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, Text, View, Pressable, FlatList, TextInput, Alert } from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import Services from "../components/Services";
import DressItem from "../components/Activityitem";

const Clientpage = () => {
  const navigation = useNavigation();
  const [displayCurrentAddress, setDisplayCurrentAddress] = useState(
    "We are loading your location"
  );

  const currency = "Ksh";

  const services = [
    {
      id: "0",
      image: "https://cdn-icons-png.flaticon.com/128/4643/4643574.png",
      name: "shirt",
      quantity: 0,
      price: 50,
    },
    // ... rest of the services array
  ];

  // Location functions remain the same
  const checkIfLocationEnabled = useCallback(async () => {
    // ... same implementation
  }, []);

  const getCurrentLocation = useCallback(async () => {
    // ... same implementation
  }, []);

  useEffect(() => {
    checkIfLocationEnabled();
    getCurrentLocation();
  }, [checkIfLocationEnabled, getCurrentLocation]);

  const HeaderComponent = () => (
    <>
      {/* Location and Profile */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 10 }}>
        <MaterialIcons name="location-on" size={30} color="#fd5c63" />
        <View>
          <Text style={{ fontSize: 18, fontWeight: "600" }}>Home</Text>
          <Text>{displayCurrentAddress}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TextInput placeholder="Search for items or More" />
        <Feather name="search" size={24} color="#fd5c63" />
      </View>

      {/* Services Component */}
      <Services />

      {/* Static Title */}
      <Text style={styles.title}>Choose your specific service</Text>
    </>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={services}
        renderItem={({ item, index }) => (
          <DressItem item={item} key={index} currency={currency} />
        )}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={HeaderComponent}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      {/* Navigation */}
      <View style={styles.navigation}>
        <MaterialCommunityIcons 
          name="home" 
          size={26} 
          color="#6b7280"
          onPress={() => navigation.navigate('HomePage')} 
        />
        <MaterialCommunityIcons 
          name="account-search" 
          size={26} 
          color="#6b7280"
          onPress={() => navigation.navigate('Clientrequest')} 
        />
        <MaterialCommunityIcons name="wallet" size={26} color="#6b7280" />
        <MaterialCommunityIcons name="cog" size={26} color="#6b7280" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F0F0F0",
    flex: 1,
    marginTop: 50,
  },
  searchBar: {
    padding: 10,
    margin: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 0.8,
    borderColor: "#C0C0C0",
    borderRadius: 7,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    margin: 14,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
});

export default Clientpage;