import React, { useMemo } from "react";
import { StyleSheet, View, Text } from "react-native";
import { Color, Border, FontSize, FontFamily } from "../GlobalStyles";

const getStyleValue = (key, value) => {
  if (value === undefined) return;
  return { [key]: value === "unset" ? undefined : value };
};
const Name1 = ({ name1, enterYourName, propTop, propWidth }) => {
  const nameStyle = useMemo(() => {
    return {
      ...getStyleValue("top", propTop),
      ...getStyleValue("width", propWidth),
    };
  }, [propTop, propWidth]);

  return (
    <View style={[styles.name, styles.nameLayout, nameStyle]}>
      <View style={[styles.nameChild, styles.nameLayout]} />
      <Text style={[styles.name1, styles.namePosition]}>{name1}</Text>
      <Text style={[styles.enterYourName, styles.namePosition]}>
        {enterYourName}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  nameLayout: {
    height: 45,
    position: "absolute",
  },
  namePosition: {
    textAlign: "center",
    color: Color.colorBlack,
    lineHeight: 16,
    letterSpacing: 1,
    top: 15,
    position: "absolute",
  },
  nameChild: {
    top: 0,
    left: 0,
    borderRadius: Border.br_11xl,
    backgroundColor: Color.colorPaleturquoise,
    width: 325,
  },
  name1: {
    left: 20,
    fontSize: FontSize.size_mini,
    fontWeight: "600",
    fontFamily: FontFamily.robotoBold,
  },
  enterYourName: {
    left: 158,
    fontSize: FontSize.size_2xs,
    fontWeight: "300",
    fontFamily: FontFamily.robotoLight,
  },
  name: {
    top: 209,
    left: 14,
    width: 331,
  },
});

export default Name1;
