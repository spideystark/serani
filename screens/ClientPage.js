import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  Pressable, 
  FlatList, 
  TextInput, 
  Alert,
  Modal,
  TouchableOpacity,
  ScrollView
} from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons, Feather, MaterialCommunityIcons, Ionicons, FontAwesome5, FontAwesome } from "@expo/vector-icons";
import * as Location from "expo-location";
import MapView, { Marker,  } from "react-native-maps";
import Services from "../components/Services";
import DressItem from "../components/Activityitem";
import { doc, setDoc, getDocs, updateDoc } from "firebase/firestore";
import { db, auth } from "../utils/firebaseConfig";



const Clientpage = () => {
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const [displayCurrentAddress, setDisplayCurrentAddress] = useState(
    "We are loading your location"
  );
  const [userLocation, setUserLocation] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showSubcategories, setShowSubcategories] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [showMap, setShowMap] = useState(false);

  const currency = "Ksh";

  // Main service categories with updated relevant icons
  const categories = [
    {
      id: "0",
      image: "https://cdn-icons-png.flaticon.com/128/2082/2082841.png", // Home cleaning icon
      name: "Household Chores",
    },
    {
      id: "1",
      image: "https://cdn-icons-png.flaticon.com/128/2830/2830312.png", // Delivery box icon
      name: "Delivery and Drop-offs",
    },
    {
      id: "2",
      image: "https://cdn-icons-png.flaticon.com/128/1567/1567073.png", // Briefcase icon
      name: "Business Services",
    },
    {
      id: "3",
      image: "https://cdn-icons-png.flaticon.com/128/3050/3050209.png", // Grocery cart icon
      name: "Grocery & Shopping",
    },
    {
      id: "4",
      image: "https://cdn-icons-png.flaticon.com/128/3349/3349234.png", // Gift box icon
      name: "Special Requests",
    },
    {
      id: "5",
      image: "https://cdn-icons-png.flaticon.com/128/1869/1869679.png", // Personal assistant icon
      name: " Personal Assistant",
    },
    {
      id: "6",
      image: "https://cdn-icons-png.flaticon.com/128/3373/3373118.png", // Calendar event icon
      name: "Event Planning",
    },
    {
      id: "7",
      image: "https://cdn-icons-png.flaticon.com/128/1076/1076826.png", // Pet paw icon
      name: "Pet Care",
    },
    {
      id: "8",
      image: "https://cdn-icons-png.flaticon.com/128/3094/3094972.png", // Tools icon
      name: "Home Improvement",
    },
    {
      id: "11",
      image: "https://cdn-icons-png.flaticon.com/128/3097/3097138.png", // Car icon
      name: "Automotive",
    },
    {
      id: "12",
      image: "https://cdn-icons-png.flaticon.com/128/2888/2888407.png", // Computer icon
      name: "Tech Support",
    },
    {
      id: "16",
      image: "https://cdn-icons-png.flaticon.com/128/2921/2921566.png", // Miscellaneous icon
      name: "Others",
    },
  ];
  
  // Subcategories with added icons
  const subcategories = {
    "0": [ // Household Chores
      { id: "0-0", name: "House Cleaning", price: 1500, icon: "broom" },
      { id: "0-1", name: "Laundry & Ironing", price: 800, icon: "tshirt" },
      { id: "0-2", name: "Dish Washing", price: 500, icon: "utensils" },
      { id: "0-3", name: "Window Cleaning", price: 1200, icon: "wind" },
      { id: "0-4", name: "Carpet Cleaning", price: 2000, icon: "snowflake" },
      { id: "0-5", name: "Bathroom Deep Clean", price: 1800, icon: "toilet" },
      { id: "0-6", name: "Kitchen Deep Clean", price: 2000, icon: "blender" },
      { id: "0-7", name: "Organizing & Decluttering", price: 1500, icon: "archive" },
      { id: "0-8", name: "Bed Making & Changing", price: 500, icon: "bed" },
      { id: "0-9", name: "Floor Mopping & Sweeping", price: 800, icon: "broom" }
    ],
    "1": [ // Delivery and Drop-offs
      { id: "1-0", name: "Food Delivery", price: 300, icon: "hamburger" },
      { id: "1-1", name: "Package Pickup & Delivery", price: 500, icon: "box" },
      { id: "1-2", name: "Grocery Delivery", price: 600, icon: "shopping-basket" },
      { id: "1-3", name: "Document Delivery", price: 400, icon: "file-alt" },
      { id: "1-4", name: "Medicine Delivery", price: 400, icon: "pills" },
      { id: "1-5", name: "Gift Delivery", price: 500, icon: "gift" },
      { id: "1-6", name: "Laundry Pickup & Drop", price: 400, icon: "tshirt" },
      { id: "1-7", name: "Courier Services", price: 600, icon: "shipping-fast" },
      { id: "1-8", name: "Furniture Delivery", price: 2000, icon: "couch" },
      { id: "1-9", name: "Same Day Delivery", price: 800, icon: "bolt" }
    ],
    "2": [ // Business Services
      { id: "2-0", name: "Data Entry", price: 1000, icon: "keyboard" },
      { id: "2-1", name: "Document Scanning", price: 500, icon: "file-upload" },
      { id: "2-2", name: "Filing & Organization", price: 1200, icon: "folder" },
      { id: "2-3", name: "Basic Bookkeeping", price: 2000, icon: "book" },
      { id: "2-4", name: "Presentation Creation", price: 1500, icon: "desktop" },
      { id: "2-5", name: "Research Services", price: 1800, icon: "search" },
      { id: "2-6", name: "Meeting Minutes Taking", price: 1000, icon: "pen" },
      { id: "2-7", name: "Email Management", price: 1200, icon: "envelope" },
      { id: "2-8", name: "Schedule Management", price: 1500, icon: "calendar" },
      { id: "2-9", name: "Business Document Writing", price: 2000, icon: "file-word" }
    ],
    "3": [ // Grocery & Shopping
      { id: "3-0", name: "Grocery Shopping", price: 800, icon: "shopping-cart" },
      { id: "3-1", name: "Personal Shopping", price: 1000, icon: "shopping-bag" },
      { id: "3-2", name: "Home Supplies Shopping", price: 800, icon: "home" },
      { id: "3-3", name: "Electronics Shopping", price: 1000, icon: "laptop" },
      { id: "3-4", name: "Gift Shopping", price: 1000, icon: "gift" },
      { id: "3-5", name: "Medicine Shopping", price: 600, icon: "pills" },
      { id: "3-6", name: "Clothing Shopping", price: 1200, icon: "tshirt" },
      { id: "3-7", name: "Office Supplies Shopping", price: 800, icon: "paperclip" },
      { id: "3-8", name: "Market Price Comparison", price: 500, icon: "balance-scale" },
      { id: "3-9", name: "Bulk Shopping", price: 1500, icon: "boxes" }
    ],
    "4": [ // Special Requests
      { id: "4-0", name: "Custom Tasks", price: 1500, icon: "thumbtack" },
      { id: "4-1", name: "Holiday Decorating", price: 2000, icon: "holly-berry" },
      { id: "4-2", name: "Gift Wrapping", price: 500, icon: "gift" },
      { id: "4-3", name: "Plant Watering", price: 400, icon: "seedling" },
      { id: "4-4", name: "Mail Collection", price: 300, icon: "mail-bulk" },
      { id: "4-5", name: "Wait in Line Service", price: 800, icon: "users" },
      { id: "4-6", name: "Moving Help", price: 2500, icon: "truck-moving" },
      { id: "4-7", name: "Furniture Assembly", price: 1500, icon: "tools" },
      { id: "4-8", name: "Basic Home Repairs", price: 1000, icon: "wrench" },
      { id: "4-9", name: "Picture Hanging", price: 800, icon: "image" }
    ],
    "5": [ // Personal Assistant
      { id: "5-0", name: "Schedule Management", price: 1500, icon: "calendar-check" },
      { id: "5-1", name: "Email Management", price: 1200, icon: "envelope-open-text" },
      { id: "5-2", name: "Travel Arrangements", price: 1000, icon: "plane" },
      { id: "5-3", name: "Bill Payments", price: 500, icon: "money-bill" },
      { id: "5-4", name: "Phone Call Handling", price: 800, icon: "phone" },
      { id: "5-5", name: "Appointment Setting", price: 600, icon: "clock" },
      { id: "5-6", name: "Research Tasks", price: 1500, icon: "search" },
      { id: "5-7", name: "Document Organization", price: 1000, icon: "folder-open" },
      { id: "5-8", name: "Task Management", price: 1200, icon: "tasks" },
      { id: "5-9", name: "Personal Errands", price: 1000, icon: "running" }
    ],
    "6": [ // Event Planning
      { id: "6-0", name: "Birthday Party Planning", price: 3000, icon: "birthday-cake" },
      { id: "6-1", name: "Wedding Planning", price: 5000, icon: "ring" },
      { id: "6-2", name: "Corporate Event Planning", price: 4000, icon: "briefcase" },
      { id: "6-3", name: "Venue Scouting", price: 2000, icon: "building" },
      { id: "6-4", name: "Decoration Setup", price: 2500, icon: "theater-masks" },
      { id: "6-5", name: "Catering Coordination", price: 1500, icon: "utensils" },
      { id: "6-6", name: "Event Photography", price: 3000, icon: "camera" },
      { id: "6-7", name: "Guest List Management", price: 1000, icon: "clipboard-list" },
      { id: "6-8", name: "Event Budget Planning", price: 2000, icon: "dollar-sign" },
      { id: "6-9", name: "On-site Event Coordination", price: 3500, icon: "headset" }
    ],
    "7": [ // Pet Care
      { id: "7-0", name: "Dog Walking", price: 500, icon: "dog" },
      { id: "7-1", name: "Pet Sitting", price: 1000, icon: "home" },
      { id: "7-2", name: "Pet Grooming", price: 1500, icon: "cut" },
      { id: "7-3", name: "Pet Feeding", price: 400, icon: "bone" },
      { id: "7-4", name: "Vet Appointment", price: 600, icon: "clinic-medical" },
      { id: "7-5", name: "Pet Transportation", price: 800, icon: "truck" },
      { id: "7-6", name: "Litter Box Cleaning", price: 400, icon: "broom" },
      { id: "7-7", name: "Pet Supply Shopping", price: 600, icon: "shopping-bag" },
      { id: "7-8", name: "Dog Training", price: 2000, icon: "graduation-cap" },
      { id: "7-9", name: "Pet Exercise & Play", price: 700, icon: "running" }
    ],
    "8": [ // Home Improvement
      { id: "8-0", name: "Painting", price: 3000, icon: "paint-roller" },
      { id: "8-1", name: "Plumbing Repairs", price: 2000, icon: "faucet" },
      { id: "8-2", name: "Electrical Work", price: 2500, icon: "bolt" },
      { id: "8-3", name: "Carpentry", price: 3000, icon: "hammer" },
      { id: "8-4", name: "Tiling", price: 2500, icon: "border-all" },
      { id: "8-5", name: "Wallpaper Installation", price: 2000, icon: "scroll" },
      { id: "8-6", name: "Door/Window Repairs", price: 1500, icon: "door-open" },
      { id: "8-7", name: "Flooring Installation", price: 3500, icon: "ruler-combined" },
      { id: "8-8", name: "Shelving Installation", price: 1200, icon: "stream" },
      { id: "8-9", name: "Cabinet Installation", price: 2500, icon: "box-open" }
    ],
    "11": [ // Automotive
      { id: "11-0", name: "Car Washing", price: 1000, icon: "car-side" },
      { id: "11-1", name: "Interior Cleaning", price: 1500, icon: "couch" },
      { id: "11-2", name: "Oil Change", price: 2000, icon: "oil-can" },
      { id: "11-3", name: "Tire Change", price: 1500, icon: "circle-notch" },
      { id: "11-4", name: "Battery Service", price: 1000, icon: "car-battery" },
      { id: "11-5", name: "Car Detailing", price: 3000, icon: "brush" },
      { id: "11-6", name: "Windshield Repair", price: 2000, icon: "window-restore" },
      { id: "11-7", name: "Car Maintenance", price: 2500, icon: "tools" },
      { id: "11-8", name: "Jump Start Service", price: 800, icon: "bolt" },
      { id: "11-9", name: "Fuel Delivery", price: 1000, icon: "gas-pump" }
    ],
    "12": [ // Tech Support
      { id: "12-0", name: "Computer Repair", price: 2000, icon: "laptop-medical" },
      { id: "12-1", name: "Smartphone Setup", price: 1000, icon: "mobile-alt" },
      { id: "12-2", name: "WiFi Setup", price: 1500, icon: "wifi" },
      { id: "12-3", name: "Printer Setup", price: 1000, icon: "print" },
      { id: "12-4", name: "Software Installation", price: 1200, icon: "download" },
      { id: "12-5", name: "Data Recovery", price: 2500, icon: "database" },
      { id: "12-6", name: "Smart Home Setup", price: 2000, icon: "home" },
      { id: "12-7", name: "Virus Removal", price: 1500, icon: "shield-virus" },
      { id: "12-8", name: "Tech Training", price: 1800, icon: "chalkboard-teacher" },
      { id: "12-9", name: "Computer Cleanup", price: 1200, icon: "broom" },
      { id: "12-10", name: "Custom Projects", price: 2000, icon: "project-diagram" },
      { id: "12-11", name: "Language Translation", price: 1500, icon: "language" },
      { id: "12-12", name: "Music Lessons", price: 2000, icon: "music" },
      { id: "12-13", name: "Art Lessons", price: 2000, icon: "palette" },
      { id: "12-14", name: "Fitness Training", price: 2500, icon: "dumbbell" },
      { id: "12-15", name: "Academic Tutoring", price: 2000, icon: "book-reader" },
      { id: "12-16", name: "Photography Services", price: 3000, icon: "camera" },
      { id: "12-17", name: "Voice Recording", price: 1500, icon: "microphone" },
      { id: "12-18", name: "Video Editing", price: 2500, icon: "film" },
      { id: "12-19", name: "Resume Writing", price: 1500, icon: "file-alt" }
    ],
  };

  // Sample service providers (simulating admin-assigned tasks)
  const mockAvailableProviders = [
    { 
      id: "p1", 
      name: "John Doe", 
      rating: 4.8, 
      distance: "1.2 km",
      location: { latitude: -1.291, longitude: 36.822 },
      services: ["0-0", "0-1", "0-2"]
    },
    { 
      id: "p2", 
      name: "Jane Smith", 
      rating: 4.9, 
      distance: "2.3 km",
      location: { latitude: -1.285, longitude: 36.826 },
      services: ["0-0", "0-3"] 
    },
    { 
      id: "p3", 
      name: "Alex Johnson", 
      rating: 4.7, 
      distance: "1.8 km",
      location: { latitude: -1.294, longitude: 36.818 },
      services: ["1-0", "1-1", "2-0", "2-1"] 
    },
    { 
      id: "p4", 
      name: "Sarah Williams", 
      rating: 4.6, 
      distance: "3.1 km",
      location: { latitude: -1.288, longitude: 36.831 },
      services: ["3-0", "3-1", "3-2"] 
    },
    { 
      id: "p5", 
      name: "Michael Brown", 
      rating: 4.5, 
      distance: "2.7 km",
      location: { latitude: -1.298, longitude: 36.824 },
      services: ["4-0", "4-1", "4-2"] 
    }
  ];

  // Location functions
  const checkIfLocationEnabled = useCallback(async () => {
    let enabled = await Location.hasServicesEnabledAsync();
    if (!enabled) {
      Alert.alert(
        'Location services are not enabled',
        'Please enable location services',
        [{ text: 'OK' }],
        { cancelable: false }
      );
    } else {
      getCurrentLocation();
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission denied',
          'Allow the app to use location services.',
          [{ text: 'OK' }],
          { cancelable: false }
        );
        return;
      }
      
      let { coords } = await Location.getCurrentPositionAsync({});
      if (coords) {
        const { latitude, longitude } = coords;
        setUserLocation({ latitude, longitude });
        
        let response = await Location.reverseGeocodeAsync({
          latitude,
          longitude
        });
        
        for (let item of response) {
          let address = `${item.name || ''}, ${item.street || ''}, ${item.postalCode || ''}`;
          setDisplayCurrentAddress(address);
        }
      }
    } catch (error) {
      console.error("Error getting location: ", error);
      setDisplayCurrentAddress("Could not get your location");
    }
  }, []);

  useEffect(() => {
    checkIfLocationEnabled();
  }, [checkIfLocationEnabled]);

  // Handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setShowSubcategories(true);
  };

  // Handle subcategory selection
  const handleSubcategorySelect = (subcategory) => {
    setSelectedTask(subcategory);
    setShowTaskDetails(true);
    
    // Filter providers that offer this service
    const providers = mockAvailableProviders.filter(provider => 
      provider.services.includes(subcategory.id)
    );
    
    setAvailableTasks(providers);
  };

  

  // Proceed to map view
  const proceedToMap = () => {
    navigation.navigate('LocateClientAndRunner', {
      selectedTask: selectedTask,
      availableTasks: availableTasks
    });
  };
  
  // Book a service provider
  const bookProvider = (provider) => {
    Alert.alert(
      "Booking Confirmation",
      `Do you want to book ${provider.name} for ${selectedTask.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: () => {
            Alert.alert("Success", "Your booking has been confirmed. The service provider will contact you shortly.");
            setShowMap(false);
          }
        }
      ]
    );
  };

  const HeaderComponent = () => (
    <>
      {/* Location and Profile */}
      <View style={styles.header}>
        <View style={styles.locationContainer}>
          <MaterialIcons name="location-on" size={30} color="#fd5c63" />
          <View>
            <Text style={{ fontSize: 18, fontWeight: "600" }}>Home</Text>
            <Text numberOfLines={1} style={styles.addressText}>{displayCurrentAddress}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <MaterialCommunityIcons name="account-circle" size={40} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Feather name="search" size={24} color="#fd5c63" />
        <TextInput 
          placeholder="Search for services..." 
          style={styles.searchInput}
        />
      </View>

      {/* Services Component 
      <Services />*/}

      {/* Categories Section */}
      <Text style={styles.title}>Choose a Service Category</Text>
    </>
  );

  // Render each category item
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.categoryItem}
      onPress={() => handleCategorySelect(item)}
    >
      <Image 
        source={{ uri: item.image }} 
        style={styles.categoryImage}
      />
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  // Render category list or flow based on user selection
  const renderMainContent = () => {
    if (showMap) {
      return (
        <View style={styles.mapContainer}>
          <View style={styles.mapHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setShowMap(false)}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.mapTitle}>Available Service Providers</Text>
          </View>
          
          {userLocation && (
            <MapView
              ref={mapRef}
              style={styles.map}
              // Remove the PROVIDER_GOOGLE line
              initialRegion={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.015,
                longitudeDelta: 0.0121,
              }}
            >
              {/* User's location */}
              <Marker
                coordinate={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude
                }}
                title="Your Location"
                description={displayCurrentAddress}
                pinColor="blue"
              />

              {/* Available service providers */}
              {availableTasks.map(provider => (
                <Marker
                  key={provider.id}
                  coordinate={{
                    latitude: provider.location.latitude,
                    longitude: provider.location.longitude
                  }}
                  title={provider.name}
                  description={`Rating: ${provider.rating} • ${provider.distance}`}
                  pinColor="red"
                />
              ))}
            </MapView>
          )}
          
          <View style={styles.providerListContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {availableTasks.map(provider => (
                <TouchableOpacity 
                  key={provider.id}
                  style={styles.providerCard}
                  onPress={() => bookProvider(provider)}
                >
                  <View style={styles.providerImageContainer}>
                    <MaterialCommunityIcons name="account" size={40} color="#555" />
                  </View>
                  <View style={styles.providerInfo}>
                    <Text style={styles.providerName}>{provider.name}</Text>
                    <View style={styles.ratingContainer}>
                      <MaterialIcons name="star" size={16} color="#FFD700" />
                      <Text style={styles.ratingText}>{provider.rating}</Text>
                    </View>
                    <Text style={styles.distanceText}>{provider.distance}</Text>
                  </View>
                  <View style={styles.bookButtonContainer}>
                    <TouchableOpacity 
                      style={styles.bookButton}
                      onPress={() => bookProvider(provider)}
                    >
                      <Text style={styles.bookButtonText}>Book</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      );
    }
    
    if (showTaskDetails) {
      return (
        <View style={styles.detailsContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setShowTaskDetails(false)}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.taskDetailsCard}>
            <Text style={styles.taskTitle}>{selectedTask.name}</Text>
            <Text style={styles.taskCategory}>
              Category: {categories.find(cat => selectedTask.id.startsWith(cat.id)).name}
            </Text>
            <Text style={styles.taskPrice}>Price: {currency} {selectedTask.price}</Text>
            
            <View style={styles.divider} />
            
            <Text style={styles.taskDescriptionTitle}>Service Description</Text>
            <Text style={styles.taskDescription}>
              Professional {selectedTask.name.toLowerCase()} service tailored to your needs. 
              Our experts use high-quality tools and materials to ensure the best results.
            </Text>
            
            <View style={styles.detailRow}>
              <MaterialIcons name="schedule" size={20} color="#555" />
              <Text style={styles.detailText}>Duration: 2-3 hours</Text>
            </View>
            
            <View style={styles.detailRow}>
              <MaterialIcons name="verified-user" size={20} color="#555" />
              <Text style={styles.detailText}>Professional, verified service providers</Text>
            </View>
            
            <View style={styles.detailRow}>
              <MaterialIcons name="payments" size={20} color="#555" />
              <Text style={styles.detailText}>Secure payment after service</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={proceedToMap}
            >
              <Text style={styles.continueButtonText}>View Available Providers</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    // Inside renderMainContent function
if (showSubcategories && selectedCategory) {
  const categorySubcategories = subcategories[selectedCategory.id];

  return (
    <View style={styles.subcategoriesContainer}>
      <View style={styles.subcategoryHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => setShowSubcategories(false)}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.subcategoryTitle}>{selectedCategory.name} Services</Text>
      </View>
      
      <FlatList
        data={categorySubcategories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.subcategoryItem}
            onPress={() => handleSubcategorySelect(item)}
          >
            <View style={styles.subcategoryContent}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* Render the icon */}
                <FontAwesome5 
                  name={item.icon} 
                  size={20} 
                  color="#fd5c63" 
                  style={{ marginRight: 10 }} 
                />
                <Text style={styles.subcategoryName}>{item.name}</Text>
              </View>
              <Text style={styles.subcategoryPrice}>{currency} {item.price}</Text>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={18} color="#999" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
    
    // Default view - category list
    return (
      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={HeaderComponent}
        numColumns={2}
        contentContainerStyle={styles.categoryList}
      />
    );
  };

  return (
    <View style={styles.container}>
      {renderMainContent()}

      {/* Bottom Navigation */}
      {!showSubcategories && !showTaskDetails && !showMap && (
        <View style={styles.navigation}>
          <TouchableOpacity style={styles.navItem}>
            <MaterialCommunityIcons name="home" size={26} color="#fd5c63" />
            <Text style={[styles.navText, { color: "#fd5c63" }]}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('Clientrequest')}
          >
            <MaterialCommunityIcons name="clipboard-text" size={26} color="#6b7280" />
            <Text style={styles.navText}>Requests</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem}>
            <MaterialCommunityIcons name="wallet" size={26} color="#6b7280" />
            <Text style={styles.navText}>Payments</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem}>
            <MaterialCommunityIcons name="account" size={26} color="#6b7280" />
            <Text style={styles.navText}>Profile</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F5F7FA",
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  addressText: {
    color: "#666",
    maxWidth: 250,
  },
  profileButton: {
    marginLeft: 10,
  },
  searchBar: {
    margin: 15,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    margin: 15,
    marginBottom: 10,
  },
  categoryList: {
    paddingBottom: 80,
  },
  categoryItem: {
    flex: 1,
    margin: 8,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryImage: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    padding: 10,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 12,
    marginTop: 2,
    color: "#6b7280",
  },
  subcategoriesContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  subcategoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 5,
  },
  subcategoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 15,
  },
  subcategoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  subcategoryContent: {
    flex: 1,
  },
  subcategoryName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
  },
  subcategoryPrice: {
    fontSize: 14,
    color: "#fd5c63",
    fontWeight: "bold",
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    padding: 15,
  },
  taskDetailsCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginTop: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
  },
  taskCategory: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  taskPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fd5c63",
    marginBottom: 15,
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 15,
  },
  taskDescriptionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  taskDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#555",
  },
  continueButton: {
    backgroundColor: "#fd5c63",
    borderRadius: 8,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  continueButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 5,
  },
  mapContainer: {
    flex: 1,
  },
  mapHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    zIndex: 10,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 15,
  },
  map: {
    flex: 1,
  },
  customMarker: {
    backgroundColor: "#fd5c63",
    padding: 5,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "white",
  },
  providerListContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
  },
  providerCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    width: 280,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  providerImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  ratingText: {
    marginLeft: 5,
    fontWeight: "bold",
  },
  distanceText: {
    fontSize: 12,
    color: "#666",
  },
  bookButtonContainer: {
    justifyContent: "center",
  },
  bookButton: {
    backgroundColor: "#fd5c63",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  bookButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default Clientpage;