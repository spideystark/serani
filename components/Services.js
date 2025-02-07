import { StyleSheet, Text, View, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { getAllCategories } from '../utils/firestore/services'; // Import the function to fetch categories

const Services = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories from Firestore on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getAllCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("❌ Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Services Available</Text>

      {/* Show loading indicator while fetching data */}
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <Pressable style={styles.card} key={category.id}>
              <Image source={{ uri: category.imageUrl }} style={styles.image} />
              <Text style={styles.text}>{category.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

export default Services;

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 7,
  },
  card: {
    margin: 10,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 7,
    alignItems: "center",
  },
  image: {
    width: 70,
    height: 70,
  },
  text: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
    fontWeight: "500",
  },
});
