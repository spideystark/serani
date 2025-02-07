import * as React from 'react';
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Modal,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ErrandDashboard = () => {
  const navigation = useNavigation();
  const [showEndTaskModal, setShowEndTaskModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const availableTasks = [
    { id: 1, title: "Grocery Shopping", status: "pending", location: "Downtown Market" },
    { id: 2, title: "Package Pickup", status: "pending", location: "Post Office" },
  ];

  const ongoingTasks = [
    { id: 3, title: "Document Delivery", status: "in-progress", location: "Business District" },
  ];

  const completedTasks = [
    { id: 4, title: "Pet Walking", status: "completed", earnings: "$25" },
    { id: 5, title: "Pharmacy Pickup", status: "completed", earnings: "$15" },
  ];

  const TaskCard = ({ title, status, location, earnings }) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{title}</Text>
        <View style={[styles.badge, styles[`${status}Badge`]]}>
          <Text style={styles.badgeText}>{status}</Text>
        </View>
      </View>
      <Text style={styles.taskDetails}>
        {location ? `📍 ${location}` : `💰 ${earnings}`}
      </Text>
    </View>
  );

  const CustomModal = ({ visible, onClose, title, description, onConfirm, confirmText, confirmStyle }) => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalDescription}>{description}</Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalCancelButton} onPress={onClose}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalConfirmButton, confirmStyle]} 
              onPress={() => {
                onConfirm();
                onClose();
              }}
            >
              <Text style={styles.modalButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Image
              style={styles.menuIcon}
              source={require('../assets/menu.png')}
            />
            <Text style={styles.welcomeText}>Welcome back</Text>
          </View>
          <Image
            style={styles.profileIcon}
            source={require('../assets/unsplashj3lfjn6deo3.png')}
          />
        </View>

        {/* Task Sections */}
        <View style={styles.taskSections}>
          <View style={styles.taskSection}>
            <Text style={styles.sectionTitle}>Available Tasks</Text>
            <ScrollView style={styles.taskList}>
              {availableTasks.map(task => (
                <TaskCard key={task.id} {...task} />
              ))}
            </ScrollView>
          </View>

          <View style={styles.taskSection}>
            <Text style={styles.sectionTitle}>Ongoing Tasks</Text>
            <ScrollView style={styles.taskList}>
              {ongoingTasks.map(task => (
                <TaskCard key={task.id} {...task} />
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Completed Tasks */}
        <View style={styles.completedSection}>
          <Text style={styles.sectionTitle}>Completed Tasks</Text>
          <ScrollView style={styles.taskList}>
            {completedTasks.map(task => (
              <TaskCard key={task.id} {...task} />
            ))}
          </ScrollView>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statsCard, styles.earningsCard]}>
            <Text style={styles.statsTitle}>Earnings</Text>
            <Text style={styles.statsValue}>$245.00</Text>
          </View>
          <View style={[styles.statsCard, styles.paymentCard]}>
            <Text style={styles.statsTitle}>Payment Status</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Up to date</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.endTaskButton]}
            onPress={() => setShowEndTaskModal(true)}
          >
            <Text style={styles.buttonText}>End Task</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.locationButton]}
            onPress={() => setShowLocationModal(true)}
          >
            <Text style={styles.buttonText}>Location Sharing</Text>
          </TouchableOpacity>
        </View>

        
        {/* Navigation */}
        <View style={styles.navigation}>

          <MaterialCommunityIcons name="home" size={26} color="#6b7280"
            onPress={() => navigation.navigate('HomePage')} />
          <MaterialCommunityIcons name="account-group" size={26} color="#6b7280" 
          />
          <MaterialCommunityIcons name="wallet" size={26} color="#6b7280" 
          />
          <MaterialCommunityIcons name="cog" size={26} color="#6b7280" 
          />
        </View>

        {/* Modals */}
        <CustomModal
          visible={showEndTaskModal}
          onClose={() => setShowEndTaskModal(false)}
          title="End Current Task?"
          description="Are you sure you want to end the current task? This action cannot be undone."
          onConfirm={() => console.log('Task ended')}
          confirmText="End Task"
          confirmStyle={styles.endTaskModalButton}
        />

        <CustomModal
          visible={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          title="Share Location"
          description="Share your real-time location with the client? This helps them track their errand progress."
          onConfirm={() => {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude } = position.coords;
                // TODO: Send location to your backend/client
                console.log(`Location: ${latitude}, ${longitude}`);
              },
              (error) => {
                console.error('Error getting location:', error);
              }
            );
          }}
          confirmText="Share Location"
          confirmStyle={styles.locationModalButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF3E3', // Antique white color
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  menuIcon: {
    width: 30,
    height: 30,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 8,
  },
  taskSections: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 24,
  },
  taskSection: {
    backgroundColor: '#334155', // slate-700
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  completedSection: {
    backgroundColor: '#E0F7FA', // cyan-100
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#b0b0b0',
  },
  taskList: {
    maxHeight: 200,
  },
  taskCard: {
    backgroundColor: '#475569', // slate-600
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  taskDetails: {
    fontSize: 14,
    color: '#CBD5E1', // slate-300
    marginTop: 4,
  },
  badge: {
    backgroundColor: '#64748B', // slate-500
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  pendingBadge: {
    backgroundColor: '#FCD34D', // yellow-400
  },
  'in-progressBadge': {
    backgroundColor: '#60A5FA', // blue-400
  },
  completedBadge: {
    backgroundColor: '#34D399', // emerald-400
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statsCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  earningsCard: {
    backgroundColor: '#3B82F6', // blue-500
  },
  paymentCard: {
    backgroundColor: '#8B5CF6', // purple-500
  },
  statsTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  statsValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 80,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  endTaskButton: {
    backgroundColor: '#EF4444', // red-500
  },
  locationButton: {
    backgroundColor: '#3B82F6', // blue-500
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navIcon: {
    width: 24,
    height: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelButton: {
    backgroundColor: '#64748B',
    borderRadius: 8,
    padding: 12,
  },
  modalConfirmButton: {
    borderRadius: 8,
    padding: 12,
  },
  endTaskModalButton: {
    backgroundColor: '#EF4444',
  },
  locationModalButton: {
    backgroundColor: '#3B82F6',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
});

export default ErrandDashboard;