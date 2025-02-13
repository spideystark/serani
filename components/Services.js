import { StyleSheet, Text, View, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import React, { useEffect, useState, useCallback, memo } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../utils/firebaseConfig';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Memoized Category Card Component
const CategoryCard = memo(({ item, isSelected, onPress }) => (
  <Pressable 
    style={[styles.categoryCard, isSelected && styles.selectedCard]} 
    onPress={onPress}
  >
    <Image 
      source={item.icon}
      style={styles.categoryImage}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
    />
    <View style={styles.categoryBadge}>
      <FontAwesome5 
        name={getCategoryIcon(item.id)} 
        size={16} 
        color="#007AFF" 
      />
    </View>
    <View style={styles.categoryTextContainer}>
      <Text style={styles.categoryText}>{item.name}</Text>
    </View>
  </Pressable>
));

// Enhanced Task Card Component
const TaskCard = memo(({ item, onPressLocation, onPressClient, onPressRunner }) => (
  <Pressable style={styles.taskCard}>
    <View style={styles.taskHeader}>
      <View style={styles.taskTitleContainer}>
        <FontAwesome5 
          name={getCategoryIcon(item.category)} 
          size={20} 
          color="#007AFF" 
          style={styles.taskIcon}
        />
        <Text style={styles.taskTitle}>{item.title}</Text>
      </View>
      <View style={styles.headerActions}>
        <View style={[styles.statusContainer, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
        <Pressable 
          style={styles.locationContainer}
          onPress={onPressLocation}
        >
          <MaterialIcons name="location-on" size={20} color="#FF4444" />
          <Text style={styles.locationText}>View Location</Text>
        </Pressable>
      </View>
    </View>

    <View style={styles.serviceNameContainer}>
      <Ionicons name="people" size={16} color="#007AFF" />
      <Text style={styles.taskServiceName}>{item.serviceName}</Text>
    </View>

    <Text style={styles.taskDescription}>{item.description}</Text>

    <View style={styles.taskFooter}>
      <Pressable 
        style={styles.userInfoContainer}
        onPress={onPressClient}
      >
        <Ionicons name="person-circle-outline" size={20} color="#666" />
        <Text style={styles.userInfoText}>Client</Text>
      </Pressable>
      <Pressable 
        style={styles.userInfoContainer}
        onPress={onPressRunner}
      >
        <FontAwesome5 name="running" size={20} color="#666" />
        <Text style={styles.userInfoText}>Runner</Text>
      </Pressable>
    </View>
  </Pressable>
));

// Categories Header Component
const CategoriesHeader = memo(({ categories, selectedCategory, onCategoryPress }) => (
  <View style={styles.categoriesHeader}>
    <Text style={styles.sectionTitle}>Categories Available</Text>
    <FlatList
      horizontal
      data={categories}
      renderItem={({ item }) => (
        <CategoryCard
          item={item}
          isSelected={selectedCategory === item.id}
          onPress={() => onCategoryPress(item.id)}
        />
      )}
      keyExtractor={item => item.id}
      showsHorizontalScrollIndicator={false}
      style={styles.categoryList}
      removeClippedSubviews={true}
      initialNumToRender={5}
      maxToRenderPerBatch={5}
      windowSize={3}
    />
  </View>
));

// Helper function to get category-specific icons
const getCategoryIcon = (category) => {
  const iconMap = {
    grocery_shopping: 'shopping-cart',
    delivery_dropoffs: 'truck',
    household_chores: 'home',
    personal_assistance: 'user-tie',
    business_services: 'briefcase',
    automotive: 'car',
    special_requests: 'star',
    urgency_based: 'bolt',
  };
  return iconMap[category] || 'tasks';
};

// Helper function to get status colors
const getStatusColor = (status) => {
  const statusColors = {
    'pending': '#FFA500',
    'in_progress': '#007AFF',
    'completed': '#4CAF50',
    'cancelled': '#FF4444',
  };
  return statusColors[status] || '#666';
};

const Services = () => {
  const navigation = useNavigation(); // Hook to access navigation object
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = [
    {
      id: "grocery_shopping",
      name: "Grocery & Shopping",
      icon: require('../assets/grocery_shopping.jpg'),
    },
    {
      id: "delivery_dropoffs",
      name: "Delivery & Drop-offs",
      icon: require('../assets/delivery.jpg'),
    },
    {
      id: "household_chores",
      name: "Household Chores",
      icon: require('../assets/household_chores.jpg'),
    },
    {
      id: "personal_assistance",
      name: "Personal Assistance",
      icon: require('../assets/personal_care.jpg'),
    },
    {
      id: "business_services",
      name: "Business Services",
      icon: require('../assets/biz.jpg'),
    },
    {
      id: "automotive",
      name: "Automotive",
      icon: require('../assets/automotive.jpg'),
    },
    {
      id: "special_requests",
      name: "Special Requests",
      icon: require('../assets/event.jpg'),
    },
    {
      id: "urgency_based",
      name: "Urgency-Based",
      icon: require('../assets/express.jpg'),
    }
  ];

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const tasksCollection = collection(db, 'tasks');
      const taskQuery = selectedCategory
        ? query(tasksCollection, where("category", "==", selectedCategory))
        : tasksCollection;
      
      const taskSnapshot = await getDocs(taskQuery);
      const tasksList = taskSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(tasksList);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      alert('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCategoryPress = useCallback((categoryId) => {
    setSelectedCategory(prevCategory => 
      prevCategory === categoryId ? null : categoryId
    );
  }, []);

  const handleLocationPress = useCallback((taskId) => {
    // Navigate to LocationClientPage with the task ID
    navigation.navigate('LocateClientAndRunner', {
      tasksId: taskId,  // Match the prop name expected by LocationTracker
      userType: 'client', // Add this to specify user type
      otherUserInfo: { name: 'runner' } // Add this for the other user's infotaskId
       });
  }, [useNavigation]);

  const handleClientPress = useCallback((taskId) => {
    // Implement client profile view logic
    console.log('View client profile for task:', taskId);
  }, []);

  const handleRunnerPress = useCallback((taskId) => {
    // Implement runner profile view logic

    console.log('View runner profile for task:', taskId);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CategoriesHeader
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryPress={handleCategoryPress}
      />
      
      <Text style={styles.tasksHeader}>
        {selectedCategory 
          ? `${categories.find(c => c.id === selectedCategory)?.name} Services` 
          : 'All Services Available'}
      </Text>

      <FlatList
        data={tasks}
        renderItem={({ item }) => (
          <TaskCard 
            item={item}
            onPressLocation={() => handleLocationPress(item.id)}
            onPressClient={() => handleClientPress(item.id)}
            onPressRunner={() => handleRunnerPress(item.id)}
          />
        )}
        keyExtractor={item => item.id}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
        initialNumToRender={10}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="tasks" size={40} color="#666" />
            <Text style={styles.emptyText}>No tasks found in this category</Text>
          </View>
        }
        contentContainerStyle={styles.tasksContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(53, 215, 226, 0.9)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoriesHeader: {
    backgroundColor: 'white',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 15,
    color: '#333',
  },
  categoryList: {
    paddingHorizontal: 10,
  },
  categoryCard: {
    width: 130,
    height: 130,
    marginHorizontal: 6,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 6,
    elevation: 2,
  },
  categoryTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  tasksHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 15,
    paddingHorizontal: 15,
    color: '#333',
  },
  tasksContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  taskCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskIcon: {
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  locationText: {
    color: '#FF4444',
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  serviceNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskServiceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 6,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  userInfoText: {
    marginLeft: 6,
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  taskStatus: {
    position: 'absolute',
    top: 15,
    right: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

});

export default memo(Services);