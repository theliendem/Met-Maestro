import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, PanResponder, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button } from 'react-native-paper';
import { ThemedText } from './ThemedText';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const TOP_MARGIN = 96;

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose, children }) => {
  const [internalVisible, setInternalVisible] = useState(visible);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Show modal when parent requests
  useEffect(() => {
    if (visible) {
      setInternalVisible(true);
      // Set translateY to SCREEN_HEIGHT before animating in
      translateY.setValue(SCREEN_HEIGHT);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    } else if (internalVisible) {
      // Animate out
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        setInternalVisible(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Swipe down to close logic
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80) {
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            setInternalVisible(false);
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // Overlay tap to close
  const handleOverlayPress = () => {
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setInternalVisible(false);
      onClose();
    });
  };

  if (!internalVisible) return null;

  return (
    <Modal visible transparent animationType="none">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleOverlayPress}>
        <Animated.View
          style={[
            styles.fullContent,
            { transform: [{ translateY }] },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.dragHandleWrap}>
            <View style={styles.dragHandle} />
          </View>
          <TouchableOpacity activeOpacity={1} style={{ flex: 1 }} onPress={e => e.stopPropagation()}>
            <ThemedText type="title" style={{ marginBottom: 16 }}>Settings</ThemedText>
            {children || <ThemedText>Settings go here.</ThemedText>}
            <View style={{ marginTop: 24, alignItems: 'flex-end' }}>
              <Button onPress={handleOverlayPress} mode="contained">Close</Button>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  fullContent: {
    backgroundColor: '#23242A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    minHeight: SCREEN_HEIGHT - TOP_MARGIN,
    maxHeight: SCREEN_HEIGHT - 12,
    width: '100%',
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  dragHandleWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  dragHandle: {
    width: 48,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#444',
    opacity: 0.4,
  },
}); 