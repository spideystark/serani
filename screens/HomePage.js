import * as React from "react";
import { Text, StyleSheet, View, Pressable, ScrollView, SafeAreaView, Dimensions } from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { Color, Border, FontFamily, FontSize } from "../GlobalStyles";

const { width } = Dimensions.get("window");

const HomePage = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.homePage}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Image
          style={styles.seraniIcon}
          contentFit="cover"
          source={require("../assets/serenlogs.png")}
        />


        <Pressable
          onPress={() => navigation.navigate("Adminlogin")} >
        <Text style={styles.chooseYourService}>Choose your Service</Text>
        </Pressable>
        <Text style={styles.description}>
           A team of professional service providers supervised by a manager complete your tasks efficiently.
        </Text>
        
        <Pressable
          style={styles.loginButton}
          onPress={() => navigation.navigate("Profiles1")}
        >
          <Text style={styles.loginButtonText}>Client Login</Text>
        </Pressable>
        
        <Pressable
          style={styles.loginButton}
          onPress={() => navigation.navigate("Profiles")}
        >
          <Text style={styles.loginButtonText}>Errand Provider Login</Text>
        </Pressable>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  homePage: {
    backgroundColor: 'white',
    flex: 1,
  },
  scrollViewContent: {
    alignItems: "center",
    padding: 16,
  },
  seraniIcon: {
    width: "100%",
    height: width * 0.7, // Adjust height based on screen width for better responsiveness
    borderRadius: Border.br_21xl,
    marginBottom: 50,
  },
  chooseYourService: {
    fontSize: FontSize.size_11xl,
    
    fontFamily: FontFamily.montserratSemiBold,
    textAlign: "center",
    color: Color.colorBlack,
    marginBottom: 30,
    fontWeight: "bold",
  },
  description: {
    fontSize: 15,
    fontFamily: FontFamily.montserratMedium,
    textAlign: "center",
    color: Color.colorBlack,
    marginBottom: 50,
    paddingHorizontal: 16,
    fontWeight: "bold",
  },
  loginButton: {
    width: "80%",
    paddingVertical: 15,
    backgroundColor: Color.colorPaleturquoise,
    borderRadius: Border.br_xl,
    alignItems: "center",
    marginBottom: 20,
  },
  loginButtonAdmin: {
    
    fontFamily: FontFamily.montserratMedium,
    backgroundColor: Color.colorPaleturquoise,
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
 
  loginButtonText: {
    fontSize: FontSize.size_xl,
    fontFamily: FontFamily.montserratMedium,
    fontWeight: "500",
    color: Color.colorDarkslategray,
  },
  loginButtonTextAdmin: {
    fontSize: FontSize.size_smi,
    fontFamily: FontFamily.montserratMedium,
    fontWeight: "500",
    color: Color.colorDarkslategray,
    alignSelf: 'flex-end',
  },


});

export default HomePage;
