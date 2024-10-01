import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
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
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route, navigation }) => ({
          headerStyle: {
            backgroundColor: '#228B22', 
          },
          headerTintColor: '#fff', 
          headerTitleStyle: {
            fontWeight: 'bold',
          },
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
              <TouchableOpacity
                onPress={() => navigation.navigate(route.name)}
                style={{ 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: 50,
                  height: 50,
                }}
              >
                <View
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: 8,
                    opacity: 0,
                  }}
                />
                <TabIcon
                  name={iconName}
                  size={size}
                  color={color}
                  focused={focused}
                />
              </TouchableOpacity>
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
  );
}
