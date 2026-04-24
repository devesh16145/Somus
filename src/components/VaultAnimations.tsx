import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, Pressable, Platform, UIManager, LayoutAnimation, StyleSheet } from 'react-native';

// Enable LayoutAnimation on Android globally simply by calling this somewhere early
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// 1. Ticker Hook Core Logic
export function AnimatedNumber({ value, formatter, style, delay = 0 }: { value: number, formatter: (v: number) => string, style?: any, delay?: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    anim.addListener((state) => setDisplayValue(state.value));
    
    Animated.timing(anim, {
      toValue: value,
      duration: 800,
      delay,
      useNativeDriver: false,
    }).start();

    return () => anim.removeAllListeners();
  }, [value, delay]);

  return <Text style={style}>{formatter(displayValue)}</Text>;
}

// 2. Fast Snappy Pressable
export function PressableScale({ children, style, onPress, ...props }: any) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.94,
      useNativeDriver: true,
      speed: 60,
      bounciness: 0
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 60,
      bounciness: 8
    }).start();
  };

  // Extract position-related styles for the outer Pressable wrapper
  const flatStyle = StyleSheet.flatten(style) || {};
  const { position, top, bottom, left, right, zIndex, ...innerStyle } = flatStyle;
  const outerStyle: any = {};
  if (position) outerStyle.position = position;
  if (top !== undefined) outerStyle.top = top;
  if (bottom !== undefined) outerStyle.bottom = bottom;
  if (left !== undefined) outerStyle.left = left;
  if (right !== undefined) outerStyle.right = right;
  if (zIndex !== undefined) outerStyle.zIndex = zIndex;

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={outerStyle}
      {...props}
    >
      <Animated.View style={[innerStyle, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// 3. Staggered Entry Wrapper
export function StaggerFade({ index = 0, children, style }: any) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      delay: index * 60, // Rapid staggering
      useNativeDriver: true,
      speed: 12,
      bounciness: 4,
    }).start();
  }, [index]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });
  
  return (
    <Animated.View style={[style, { opacity: anim, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

// 4. Global Reflow Helper (Configures a quick spring layout shift)
export function smoothReflow() {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
}
