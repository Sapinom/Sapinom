import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { GameProvider, useGame } from './src/hooks/useGame';
import StartScreen from './src/screens/StartScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import BusinessScreen from './src/screens/BusinessScreen';
import MarketScreen from './src/screens/MarketScreen';
import BankScreen from './src/screens/BankScreen';
import EventsScreen from './src/screens/EventsScreen';
import EventChoiceModal from './src/components/EventChoiceModal';
import { COLORS } from './src/data/constants';

const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

function GameNavigator() {
  const { state } = useGame();

  if (!state.started || !state.player.name) {
    return <StartScreen />;
  }

  return (
    <>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: 'rgba(15,12,41,0.98)',
              borderTopColor: 'rgba(255,255,255,0.08)',
              paddingTop: 6,
              height: 85,
            },
            tabBarActiveTintColor: COLORS.blue,
            tabBarInactiveTintColor: COLORS.textDim,
            tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
          }}
        >
          <Tab.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{
              tabBarLabel: 'Home',
              tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="Business"
            component={BusinessScreen}
            options={{
              tabBarLabel: 'Business',
              tabBarIcon: ({ focused }) => <TabIcon emoji="🏢" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="Market"
            component={MarketScreen}
            options={{
              tabBarLabel: 'Marché',
              tabBarIcon: ({ focused }) => <TabIcon emoji="🛒" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="Bank"
            component={BankScreen}
            options={{
              tabBarLabel: 'Banque',
              tabBarIcon: ({ focused }) => <TabIcon emoji="🏦" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="Events"
            component={EventsScreen}
            options={{
              tabBarLabel: 'Events',
              tabBarIcon: ({ focused }) => <TabIcon emoji="📰" focused={focused} />,
              tabBarBadge: state.world.eventLog.length > 0 ? state.world.eventLog.length : undefined,
              tabBarBadgeStyle: { backgroundColor: COLORS.red, fontSize: 10 },
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
      <EventChoiceModal />
      <StatusBar style="light" />
    </>
  );
}

export default function App() {
  return (
    <GameProvider>
      <GameNavigator />
    </GameProvider>
  );
}
