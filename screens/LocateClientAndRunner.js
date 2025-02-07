import * as React from "react";
import { Image } from "expo-image";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { Color, Border, FontSize, FontFamily } from "../GlobalStyles";

const LocateClientAndRunner = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.locateClientAndRunner}>
     
  
      <View style={[styles.iphone13ProMax2, styles.iconPosition]}>
        <Pressable
          style={[styles.homeIcon, styles.iconLayout]}
          onPress={() => navigation.navigate("RunnerPage")}
        >
          <Image
            style={styles.icon2}
            contentFit="cover"
            source={require("../assets/home.png")}
          />
        </Pressable>
        <Pressable
          style={[styles.squaredMenuIcon, styles.iconLayout]}
          onPress={() => navigation.navigate("RunnerPage")}
        >
          <Image
            style={styles.icon2}
            contentFit="cover"
            source={require("../assets/squared-menu.png")}
          />
        </Pressable>
        <Image
          style={[styles.settingsIcon, styles.iconLayout]}
          contentFit="cover"
          source={require("../assets/settings.png")}
        />
        <Image
          style={[styles.walletIcon, styles.iconLayout]}
          contentFit="cover"
          source={require("../assets/wallet.png")}
        />
        <View style={[styles.mapWrapper, styles.mapLayout]}>
          <View style={[styles.map, styles.mapLayout]}>
            <View style={[styles.rectangleParent, styles.frameChildLayout]}>
              <View style={[styles.frameChild, styles.mapItemBorder]} />
              <Text
                style={[styles.nairobiKenya, styles.nairobiKenyaPosition]}
              >{`Nairobi, Kenya `}</Text>
            </View>
            <Image
              style={[styles.searchIcon, styles.iconPosition]}
              contentFit="cover"
              source={require("../assets/search.png")}
            />
            <Image
              style={[styles.mapChild, styles.mapLayout]}
              contentFit="cover"
              source={require("../assets/rectangle-15.png")}
            />
            <View style={[styles.mapItem, styles.mapItemBorder]} />
            <Image
              style={[styles.vectorIcon, styles.iconPosition]}
              contentFit="cover"
              source={require("../assets/vector.png")}
            />
            <Image
              style={[styles.iconsansboldmessage2, styles.iconPosition]}
              contentFit="cover"
              source={require("../assets/iconsansboldmessage2.png")}
            />
          </View>
        </View>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  iconLayout2: {
    width: 53,
    position: "absolute",
  },
 
  mapLayout: {
    width: 360,
    position: "absolute",
  },
  frameChildLayout: {
    height: 38,
    width: 323,
  },
  mapItemBorder: {
    borderWidth: 1,
    borderColor: Color.colorBlack,
    borderStyle: "solid",
    left: 0,
    position: "absolute",
    backgroundColor: Color.colorWhite,
  },
  nairobiKenyaPosition: {
    left: "50%",
    position: "absolute",
  },


  locateClientAndRunnerChild: {
    left: 42,
  },
  locateClientAndRunnerItem: {
    left: 235,
  },

  locateClientAndRunnerInner: {
    top: 553,
  },
  rectangleView: {
    top: 657,
  },
  locateClientAndRunnerChild1: {
    top: 758,
  },
 
  homeIcon: {
    top: 864,
    left: 57,
  },
  squaredMenuIcon: {
    top: 865,
    left: 145,
  },
  settingsIcon: {
    top: 863,
    left: 321,
  },
  walletIcon: {
    top: 862,
    left: 235,
  },
  icon2: {
    height: "100%",
    width: "100%",
  },
  frameChild: {
    borderRadius: Border.br_11xl,
    height: 38,
    width: 323,
    top: 0,
  },
  nairobiKenya: {
    marginTop: -8,
    marginLeft: -122.5,
    top: "50%",
    fontSize: FontSize.size_smi,
    letterSpacing: 1,
    lineHeight: 16,
    fontFamily: FontFamily.robotoBold,
    textAlign: "center",
    color: Color.colorBlack,
    fontWeight: "600",
    left: "50%",
  },
  rectangleParent: {
    marginLeft: -161,
    top: 13,
    left: "50%",
    position: "absolute",
  },
  searchIcon: {
    top: 20,
    left: 296,
    width: 24,
    height: 24,
  },
  mapChild: {
    top: 62,
    height: 621,
    left: 0,
  },
  mapItem: {
    top: 165,
    width: 34,
    height: 43,
  },
  vectorIcon: {
    height: "2.08%",
    width: "3.06%",
    top: "30.93%",
    right: "93.61%",
    bottom: "66.99%",
    left: "3.33%",
    maxWidth: "100%",
    maxHeight: "100%",
  },
 
  map: {
    height: 668,
    left: 0,
    top: 0,
  },
  mapWrapper: {
    top: 119,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    height: 715,
    borderColor: Color.colorBlack,
    borderStyle: "solid",
    width: 360,
    left: 29,
  },
 
  locateClientAndRunner: {
    flex: 1,
    overflow: "hidden",
    height: 926,
    width: "100%",
    backgroundColor: Color.colorWhite,
    borderRadius: Border.br_21xl,
  },
});

export default LocateClientAndRunner;
