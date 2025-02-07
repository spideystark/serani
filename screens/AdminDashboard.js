import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';

const windowWidth = Dimensions.get('window').width;

// Simple Bar Chart using Views instead of SVG
const BarChart = ({ data }) => {
  const maxValue = Math.max(...data.map(item => item.tasks));
  const barWidth = (windowWidth - 60) / data.length - 10;

  return (
    <View style={styles.barChart}>
      {data.map((item, index) => (
        <View key={index} style={styles.barWrapper}>
          <View 
            style={[
              styles.bar, 
              { 
                height: (item.tasks / maxValue) * 150,
                width: barWidth 
              }
            ]} 
          />
          <Text style={styles.barLabel}>{item.name}</Text>
        </View>
      ))}
    </View>
  );
};

// Stats Card Component
const StatCard = ({ title, value, iconName, color }) => (
  <View style={styles.statCard}>
    <View>
      <Text style={styles.statLabel}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
    <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
      <MaterialCommunityIcons name={iconName} size={24} color={color} />
    </View>
  </View>
);

const AdminDashboard = () => {
  const navigation = useNavigation();
  const [selectedService, setSelectedService] = useState(null);
  
  const services = [
    { id: 1, name: 'Washing', count: 45, icon: '🧺' },
    { id: 2, name: 'Cleaning', count: 32, icon: '🧹' },
    { id: 3, name: 'Car Wash', count: 28, icon: '🚗' },
    { id: 4, name: 'Room Service', count: 35, icon: '🏠' },
  ];

  const recentTasks = [
    { id: 1, task: 'Floor Cleaning', time: 'Just now', status: 'completed', customer: 'John Doe' },
    { id: 2, task: 'Car Washing', time: '5 mins ago', status: 'ongoing', customer: 'Jane Smith' },
    { id: 3, task: 'Room Cleaning', time: '10 mins ago', status: 'pending', customer: 'Mike Johnson' },
  ];

  const taskStats = [
    { name: 'Completed', value: 30, color: '#0088FE', icon: 'check-circle' },
    { name: 'Ongoing', value: 15, color: '#00C49F', icon: 'trending-up' },
    { name: 'Available', value: 10, color: '#FFBB28', icon: 'alert-circle' },
  ];

  const barData = [
    { name: 'Mon', tasks: 20 },
    { name: 'Tue', tasks: 25 },
    { name: 'Wed', tasks: 18 },
    { name: 'Thu', tasks: 30 },
    { name: 'Fri', tasks: 22 },
    { name: 'Sat', tasks: 15 },
    { name: 'Sun', tasks: 12 },
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return '#22c55e';
      case 'ongoing': return '#3b82f6';
      case 'pending': return '#eab308';
      default: return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSubtitle}>Welcome back, Admin</Text>
          </View>
          <View style={styles.headerIcons}>
            <MaterialCommunityIcons name="clock-outline" size={24} color="#6b7280" />
            <TouchableOpacity 
              onPress={() => {
                if (navigation && navigation.openDrawer) {
                  navigation.openDrawer();
                }
              }}
            >
              <MaterialCommunityIcons name="menu" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsContainer}>
          {taskStats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.name}
              value={stat.value}
              iconName={stat.icon}
              color={stat.color}
            />
          ))}
        </ScrollView>

        {/* Charts */}
        <View style={styles.chartsContainer}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Weekly Task Overview</Text>
            <BarChart data={barData} />
          </View>
        </View>

        {/* Services Grid */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Available Services</Text>
          <View style={styles.servicesGrid}>
            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceCard}
                onPress={() => setSelectedService(service)}
              >
                <Text style={styles.serviceIcon}>{service.icon}</Text>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceCount}>{service.count} tasks</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Tasks */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Tasks</Text>
          {recentTasks.map((task) => (
            <View key={task.id} style={styles.taskItem}>
              <View>
                <Text style={styles.taskName}>{task.task}</Text>
                <Text style={styles.taskCustomer}>{task.customer}</Text>
              </View>
              <View style={styles.taskStatus}>
                <Text style={[styles.statusText, { color: getStatusColor(task.status) }]}>
                  {task.status}
                </Text>
                <Text style={styles.taskTime}>{task.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        <MaterialCommunityIcons name="home" size={24} color="#6b7280" />
        <MaterialCommunityIcons name="account-group" size={24} color="#6b7280" />
        <MaterialCommunityIcons name="wallet" size={24} color="#6b7280" />
        <MaterialCommunityIcons name="cog" size={24} color="#6b7280" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    width: 150,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  iconContainer: {
    padding: 8,
    borderRadius: 50,
  },
  chartsContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 200,
    paddingVertical: 16,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    backgroundColor: '#3b82f6',
    width: 20,
    borderRadius: 4,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#6b7280',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  serviceCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  taskName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  taskCustomer: {
    fontSize: 12,
    color: '#6b7280',
  },
  taskStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
});

export default AdminDashboard;