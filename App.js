import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity, StatusBar, Text } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/HomeScreen';
import GoalScreen from './src/screens/GoalScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import ProductionScreen from './src/screens/ProductionScreen';
import SplashScreen from './src/screens/SplashScreen';

const Tab = createBottomTabNavigator();

const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);

const TabIcon = ({ name, focused, color, size }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(focused ? 1.2 : 1) }],
    };
  });

  return (
    <AnimatedIcon
      name={name}
      size={size}
      color={color}
      style={animatedStyle}
    />
  );
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
  }, []);

  if (isLoading) {
    return <SplashScreen onFinish={() => setIsLoading(false)} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerStyle: {
              backgroundColor: '#228B22',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            header: ({ options }) => (
              <SafeAreaView edges={['top']} style={{ backgroundColor: '#228B22' }}>
                <View style={{ 
                  height: 60, 
                  backgroundColor: '#228B22', 
                  justifyContent: 'flex-end',
                  paddingBottom: 10,
                  paddingLeft: 15
                }}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 25 }}>
                    {route.name}
                  </Text>
                </View>
              </SafeAreaView>
            ),
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Meta') {
                iconName = focused ? 'flag' : 'flag-outline';
              } else if (route.name === 'Calendário') {
                iconName = focused ? 'calendar' : 'calendar-outline';
              } else if (route.name === 'Produção') {
                iconName = 'logo-usd';
              }

              return (
                <TabIcon
                  name={iconName}
                  size={size}
                  color={color}
                  focused={focused}
                />
              );
            },
            tabBarActiveTintColor: '#3CB371',
            tabBarInactiveTintColor: 'gray',
            tabBarStyle: {
              backgroundColor: 'white',
              height: 60,
              paddingBottom: 5,
            },
            tabBarLabelStyle: {
              fontSize: 12,
            },
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Meta" component={GoalScreen} />
          <Tab.Screen name="Calendário" component={CalendarScreen} />
          <Tab.Screen name="Produção" component={ProductionScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
