import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Import your screens
import AdminDashboard from './AdminDashboard';
import Settings from './Settings';
import UserManagement from './Usermanagement';
import LogoutScreen from '../screens/HomePage';
import Products from './Products';

const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props) => {
  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerHeaderTitle}>Admin Panel</Text>
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
};

const AdminDrawer = () => {
  return (
    <NavigationContainer>
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={({ route }) => ({
          drawerIcon: ({ focused, color, size }) => {
            let iconName;
            switch (route.name) {
              case 'Dashboard':
                iconName = 'view-dashboard';
                break;
              case 'Settings':
                iconName = 'cog';
                break;
              case 'UserManagement':
                iconName = 'account-group';
                break;
              case 'Products':
                iconName = 'format-list-bulleted';
                break;
              case 'Logout':
                iconName = 'logout';
                break;
            }
            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Drawer.Screen name="Dashboard" component={AdminDashboard} />
        <Drawer.Screen name="Settings" component={Settings} />
        <Drawer.Screen name="UserManagement" component={UserManagement} />
        <Drawer.Screen name="Products" component={Products} />
        <Drawer.Screen name="Logout" component={LogoutScreen} />
      </Drawer.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  drawerHeader: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  drawerHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  }
});

export default AdminDrawer;