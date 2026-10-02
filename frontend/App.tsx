import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import { AuthProvider, useAuth } from "./src/context/Auth";
import { AuthScreen } from "./src/screens/AuthScreen";
import { Dashboard } from "./src/screens/Dashboard";
import { ResourceScreen } from "./src/screens/ResourceScreen";
import { Loading } from "./src/components/ui";
const Stack = createNativeStackNavigator();
function Routes() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: "none" }}
      >
        {user ? (
          <>
            <Stack.Screen name="Dashboard" component={Dashboard} />
            {[
              "players",
              "clubs",
              "teams",
              "tournaments",
              "matches",
              ...(user.role === "ADMIN" ? ["users"] : []),
            ].map((name) => (
              <Stack.Screen key={name} name={name} component={ResourceScreen} />
            ))}
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar barStyle="dark-content" />
        <Routes />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
