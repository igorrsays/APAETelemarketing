import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const SplashScreen = ({ onFinish }) => {
  const [progress] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 100,
      duration: 2000,
      useNativeDriver: false,
    }).start(() => {
      onFinish();
    });
  }, []);

  const width = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Apae - Telemarketing</Text>
      <View style={styles.progressContainer}>
        <Animated.View style={[styles.progressBar, { width }]} />
      </View>
      <Text style={styles.loadingText}>Carregando...</Text>
      <Text style={styles.footer}>Desenvolvido por: Igor</Text>
      <Text style={styles.version}>versão 1.0</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  progressContainer: {
    width: '80%',
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    fontSize: 16,
  },
  version: {
    position: 'absolute',
    bottom: 20,
    fontSize: 14,
  },
});

export default SplashScreen;