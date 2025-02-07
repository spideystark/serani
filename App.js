import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { useFonts } from "expo-font";
import { Provider } from 'react-redux';
import { store } from './redux/store';

// Import your screens
import HomePage from "./screens/HomePage";
import ClientPage from "./screens/ClientPage";
import AdminDashboard from "./screens/AdminDashboard";
import LocateClientAndRunner from "./screens/LocateClientAndRunner";
import RunnerPage from "./screens/RunnerPage";
import Profiles from "./screens/Errandproviderlogin";
import Profiles1 from "./screens/Clientlogin";
import Adminlogin from "./screens/Adminlogin";

// New Drawer Screens
import Settings from "./components/Settings";
import UserManagement from "./components/Usermanagement";
import Products from "./components/Products";
import LogOut from "./screens/HomePage";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Drawer Navigator for Admin Dashboard
const AdminDrawerNavigator = () => {
  return (
    <Drawer.Navigator 
      screenOptions={{ 
        headerShown: false,
        drawerPosition: 'right'
      }}
    >
      <Drawer.Screen 
        name="AdminMainDashboard" 
        component={AdminDashboard} 
        options={{ title: 'Dashboard' }}
      />
      <Drawer.Screen 
        name="Settings" 
        component={Settings} 
        options={{ title: 'Settings' }}
      />
      <Drawer.Screen 
        name="UserManagement" 
        component={UserManagement} 
        options={{ title: 'User Management' }}
      />
      <Drawer.Screen 
        name="Services" 
        component={Products} 
        options={{ title: 'Services' }}
      />
      <Drawer.Screen
        name="LogOut"
        component={LogOut}
        options={{ title: 'Log Out' }}
      />
    </Drawer.Navigator>
  );
};

const AppNavigator = () => {
  const [fontsLoaded, error] = useFonts({
    "Montserrat-Medium": require("./assets/fonts/Montserrat-Medium.ttf"),
    "Montserrat-SemiBold": require("./assets/fonts/Montserrat-SemiBold.ttf"),
    "Roboto-Thin": require("./assets/fonts/Roboto-Thin.ttf"),
    "Roboto-Light": require("./assets/fonts/Roboto-Light.ttf"),
    "Roboto-Regular": require("./assets/fonts/Roboto-Regular.ttf"),
    "Roboto-Bold": require("./assets/fonts/Roboto-Bold.ttf"),
    "Roboto-BoldItalic": require("./assets/fonts/Roboto-BoldItalic.ttf"),
  });

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="HomePage"
        component={HomePage}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ClientPage"
        component={ClientPage}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDrawerNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="LocateClientAndRunner"
        component={LocateClientAndRunner}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RunnerPage"
        component={RunnerPage}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Profiles"
        component={Profiles}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Profiles1"
        component={Profiles1}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Adminlogin"
        component={Adminlogin}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </Provider>
  );
};

export default App;