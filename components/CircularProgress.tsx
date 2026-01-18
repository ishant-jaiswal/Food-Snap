import { Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";
import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

interface CircularProgressProps {
  value: number;
  maxValue: number;
  size: number;
  strokeWidth?: number;
  color?: string;
  showText?: boolean;
  children?: React.ReactNode;
}

export function CircularProgress({
  value,
  maxValue,
  size,
  strokeWidth = 8,
  color = Colors.light.primary,
  children,
}: CircularProgressProps) {
  const { isDark } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / maxValue, 1);
  const strokeDashoffset = circumference * (1 - progress);

  const trackColor = isDark ? "#333333" : "#E5E5E5";

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  svg: {
    position: "absolute",
  },
  content: {
    justifyContent: "center",
    alignItems: "center",
  },
});
