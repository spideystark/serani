import React, { useMemo } from "react";
import { StyleSheet, View, Text } from "react-native";
import { Color, Border, FontFamily, FontSize } from "../GlobalStyles";

const getStyleValue = (key, value) => {
  if (value === undefined) return;
  return { [key]: value === "unset" ? undefined : value };
};
const Email = ({ propTop }) => {
  const emailStyle = useMemo(() => {
    return {
      ...getStyleValue("top", propTop),
    };
  }, [propTop]);

  return (
    <View style={[styles.email, styles.emailLayout, emailStyle]}>
      <View style={[styles.emailChild, styles.emailLayout]} />
      <Text style={[styles.email1, styles.emailPosition]}>Email</Text>
      <Text style={[styles.text, styles.emailPosition]}> :</Text>
      <Text style={[styles.enterYourEmail, styles.emailPosition]}>
        Enter your email or phone number
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  emailLayout: {
    height: 45,
    position: "absolute",
  },
  emailPosition: {
    textAlign: "center",
    color: Color.colorBlack,
    lineHeight: 16,
    letterSpacing: 1,
    top: 15,
    position: "absolute",
  },
  emailChild: {
    top: 0,
    left: 0,
    borderRadius: Border.br_11xl,
    backgroundColor: Color.colorPaleturquoise,
    width: 325,
  },
  email1: {
    left: 28,
    fontFamily: FontFamily.robotoBold,
    fontWeight: "600",
    fontSize: FontSize.size_mini,
    color: Color.colorBlack,
    lineHeight: 16,
    letterSpacing: 1,
    top: 15,
  },
  text: {
    left: 70,
    fontFamily: FontFamily.robotoBold,
    fontWeight: "600",
    fontSize: FontSize.size_mini,
    color: Color.colorBlack,
    lineHeight: 16,
    letterSpacing: 1,
    top: 15,
  },
  enterYourEmail: {
    left: 105,
    fontSize: FontSize.size_2xs,
    fontWeight: "300",
    fontFamily: FontFamily.robotoLight,
    color: Color.colorBlack,
    lineHeight: 16,
    letterSpacing: 1,
    top: 15,
  },
  email: {
    top: 272,
    left: 14,
    width: 331,
  },
});

export default Email;
