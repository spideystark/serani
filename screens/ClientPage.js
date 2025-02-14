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
      name: "House Cleaning",
      quantity: 0,
      price: 1500,
    },
    {
      id: "1",
      image: "https://cdn-icons-png.flaticon.com/128/995/995016.png",
      name: "Plumbing",
      quantity: 0,
      price: 800,
    },
    {
      id: "2",
      image: "https://cdn-icons-png.flaticon.com/128/2271/2271062.png",
      name: "Electrician",
      quantity: 0,
      price: 1000,
    },
    {
      id: "3",
      image: "https://cdn-icons-png.flaticon.com/128/3079/3079165.png",
      name: "Painting",
      quantity: 0,
      price: 2000,
    },
    {
      id: "4",
      image: "https://cdn-icons-png.flaticon.com/128/1785/1785210.png",
      name: "Gardening",
      quantity: 0,
      price: 500,
    }
  ];

  // Location functions remain the same
  const checkIfLocationEnabled = useCallback(async () => {
    // ... same implementation
    let enabled = await Location.hasServicesEnabledAsync();
    if (!enabled) {
      Alert.alert(
        'Location services are not enabled',
        'Please enable location services',
        [{ text: 'OK' }],
        { cancelable: false }
      );
    } else {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission denied',
          'Allow the app to use location services.',
          [{ text: 'OK' }],
          { cancelable: false }
        );
      }
    }

    let { coords } = await Location.getCurrentPositionAsync();
    if (coords) {
      const { latitude, longitude } = coords;
      let response = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });
      for (let item of response) {
        let address = `${item.name}, ${item.street}, ${item.postalCode}`;
        setDisplayCurrentAddress(address);
      }
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    // ... same implementation
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission denied',
        'Allow the app to use location services.',
        [{ text: 'OK' }],
        { cancelable: false }
      );
    }
    

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