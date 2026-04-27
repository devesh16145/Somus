// Liquid OS themed dialog — drop-in replacement for Alert.alert.
// Imperative API: LiquidDialog.show({ title, message?, buttons? })
// A single <LiquidDialogHost /> must be mounted once at the app root.

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Modal, TouchableWithoutFeedback, TouchableOpacity, StyleSheet, Animated, Easing,
} from 'react-native';
import { themes, font, accent, accentInk, alpha } from '../theme';
import { useStore } from '../store';

export type DialogButtonStyle = 'default' | 'destructive' | 'cancel';

export interface DialogButton {
  text: string;
  style?: DialogButtonStyle;
  onPress?: () => void;
}

export interface DialogOptions {
  title: string;
  message?: string;
  buttons?: DialogButton[];
}

type Listener = (opts: DialogOptions | null) => void;

let activeListener: Listener | null = null;

export const LiquidDialog = {
  show(opts: DialogOptions) {
    if (activeListener) activeListener(opts);
  },
  alert(title: string, message?: string, buttons?: DialogButton[]) {
    if (activeListener) activeListener({ title, message, buttons });
  },
  dismiss() {
    if (activeListener) activeListener(null);
  },
};

export function LiquidDialogHost() {
  const { themeMode } = useStore();
  const t = themes[themeMode];
  const aink = accentInk(themeMode);

  const [opts, setOpts] = useState<DialogOptions | null>(null);
  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    activeListener = (next) => {
      if (next) {
        setOpts(next);
        setVisible(true);
      } else {
        close();
      }
    };
    return () => { activeListener = null; };
  }, []);

  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      scale.setValue(0.92);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  function close(after?: () => void) {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.94, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      setOpts(null);
      if (after) after();
    });
  }

  function handlePress(btn: DialogButton) {
    close(() => { if (btn.onPress) btn.onPress(); });
  }

  function handleBackdrop() {
    // If a Cancel button exists, behave like pressing Cancel. Otherwise just dismiss.
    if (!opts) return;
    const cancel = opts.buttons?.find((b) => b.style === 'cancel');
    if (cancel) handlePress(cancel);
    else close();
  }

  if (!visible || !opts) return null;

  const buttons = opts.buttons && opts.buttons.length > 0
    ? opts.buttons
    : [{ text: 'OK', style: 'default' as const }];

  const isRow = buttons.length === 2;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleBackdrop} statusBarTranslucent>
      <TouchableWithoutFeedback onPress={handleBackdrop}>
        <Animated.View style={[styles.backdrop, { opacity }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.card,
                {
                  backgroundColor: t.surface,
                  borderColor: t.rule,
                  transform: [{ scale }],
                },
              ]}>
              <Text style={[styles.title, { color: t.ink }]}>{opts.title}</Text>
              {opts.message ? (
                <Text style={[styles.message, { color: t.inkDim }]}>{opts.message}</Text>
              ) : null}

              <View style={[styles.actions, isRow ? styles.actionsRow : styles.actionsCol]}>
                {buttons.map((b, i) => {
                  const destructive = b.style === 'destructive';
                  const cancel = b.style === 'cancel';
                  const bg = destructive
                    ? '#E06B4A'
                    : cancel
                      ? 'transparent'
                      : accent.v;
                  const fg = destructive
                    ? '#fff'
                    : cancel
                      ? t.inkDim
                      : '#051911';
                  const border = cancel ? t.rule : 'transparent';
                  return (
                    <TouchableOpacity
                      key={i}
                      activeOpacity={0.85}
                      onPress={() => handlePress(b)}
                      style={[
                        styles.btn,
                        isRow ? { flex: 1 } : { alignSelf: 'stretch' },
                        {
                          backgroundColor: bg,
                          borderColor: border,
                          borderWidth: cancel ? 1 : 0,
                        },
                      ]}>
                      <Text style={[styles.btnText, { color: fg }]}>{b.text}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 24,
  },
  title: {
    fontFamily: font.display,
    fontSize: 22,
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  message: {
    fontFamily: font.ui,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  actions: {
    marginTop: 20,
    gap: 10,
  },
  actionsRow: {
    flexDirection: 'row',
  },
  actionsCol: {
    flexDirection: 'column',
  },
  btn: {
    height: 46,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  btnText: {
    fontFamily: font.uiBold,
    fontSize: 14,
  },
});

export default LiquidDialog;
