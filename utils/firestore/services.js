import { db, storage } from "../firebaseConfig";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc 
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { Image } from "react-native";

// Load images dynamically using require()
const categoryImages = {
  grocery_shopping: require("../firestore/assets/grocery_shopping.jpg"),
  delivery_dropoffs: require("../firestore/assets/delivery.jpg"),
  household_chores: require("../firestore/assets/household_chores.jpg"),
  personal_assistance: require("../firestore/assets/personal_care.jpg"),
  business_services: require("../firestore/assets/biz.jpg"),
  automotive: require("../firestore/assets/automotive.jpg"),
  special_requests: require("../firestore/assets/event.jpg"),
  urgency_based: require("../firestore/assets/express.jpg"),
};

// Upload predefined categories to Firestore with image handling
export const uploadCategories = async () => {
  const categories = [
    { id: "grocery_shopping", name: "Grocery & Shopping", services: ["Grocery pickup", "Retail shopping", "Pharmacy runs"] },
    { id: "delivery_dropoffs", name: "Delivery & Drop-offs", services: ["Package delivery", "Document drop-off", "Food delivery"] },
    { id: "household_chores", name: "Household Chores", services: ["Laundry & dry cleaning", "Cleaning services", "Home repairs/maintenance"] },
    { id: "personal_assistance", name: "Personal Assistance", services: ["Appointment scheduling", "Pet care (walking, vet visits)", "Elderly assistance"] },
    { id: "business_services", name: "Business Services", services: ["Office supply runs", "Courier services"] },
    { id: "automotive", name: "Automotive", services: ["Car wash", "Vehicle maintenance (oil change, tire check)"] },
    { id: "special_requests", name: "Special Requests", services: ["Event planning assistance", "Gift shopping", "Custom errands"] },
    { id: "urgency_based", name: "Urgency-Based", services: ["Same-day/Express errands", "Scheduled errands", "Flexible timing errands"] },
  ];

  try {
    for (const category of categories) {
      try {
        const imageUri = Image.resolveAssetSource(categoryImages[category.id]).uri;
        const imageUrl = await uploadCategoryImage(category.id, imageUri);
        
        await setDoc(doc(db, "servicesCategories", category.id), {
          name: category.name,
          imageUrl,
          customImageUrl: null,
          services: category.services,
          isCustom: false,
        });
        console.log(`✅ Category ${category.id} uploaded successfully!`);
      } catch (categoryError) {
        console.error(`❌ Error uploading category ${category.id}:`, categoryError);
      }
    }
    console.log("✅ Categories upload process completed!");
  } catch (error) {
    console.error("❌ Overall error in uploadCategories:", error);
  }
};;

// Upload an image for a category
export const uploadCategoryImage = async (categoryId, imageUri) => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const storageRef = ref(storage, `category-images/${categoryId}`);
    const uploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (error) => {
          console.error("❌ Upload failed:", error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await updateDoc(doc(db, "servicesCategories", categoryId), {
            customImageUrl: downloadURL,
          });
          console.log("✅ Image uploaded successfully!");
          resolve(downloadURL);
        }
      );
    });
  } catch (error) {
    console.error("❌ Error uploading image:", error);
    throw error;
  }
};

// Retrieve all service categories
export const getAllCategories = async () => {
  try {
    const categoriesRef = collection(db, "servicesCategories");
    const snapshot = await getDocs(categoriesRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("❌ Error fetching categories:", error);
    throw error;
  }
};

// Retrieve a specific category by ID
export const getCategoryById = async (categoryId) => {
  try {
    const categoryRef = doc(db, "servicesCategories", categoryId);
    const snapshot = await getDoc(categoryRef);
    
    return snapshot.exists() 
      ? { id: snapshot.id, ...snapshot.data() } 
      : null;
  } catch (error) {
    console.error("❌ Error fetching category:", error);
    throw error;
  }
};

// Create a new custom category
export const createCustomCategory = async (categoryData) => {
  try {
    const newCategoryRef = doc(collection(db, "servicesCategories"));
    await setDoc(newCategoryRef, {
      ...categoryData,
      isCustom: true,
    });
    
    console.log("✅ Custom category created successfully!");
    return newCategoryRef.id;
  } catch (error) {
    console.error("❌ Error creating custom category:", error);
    throw error;
  }
};

// Update an existing category
export const updateCategory = async (categoryId, updateData) => {
  try {
    const categoryRef = doc(db, "servicesCategories", categoryId);
    await updateDoc(categoryRef, updateData);
    
    console.log("✅ Category updated successfully!");
  } catch (error) {
    console.error("❌ Error updating category:", error);
    throw error;
  }
};

// Delete a category (and its associated image)
export const deleteCategory = async (categoryId) => {
  try {
    // First, delete the image from storage if it exists
    try {
      const imageRef = ref(storage, `category-images/${categoryId}`);
      await deleteObject(imageRef);
    } catch (imageError) {
      console.warn("⚠️ No image found or error deleting image:", imageError);
    }

    // Then delete the category document
    const categoryRef = doc(db, "servicesCategories", categoryId);
    await deleteDoc(categoryRef);
    
    console.log("✅ Category deleted successfully!");
  } catch (error) {
    console.error("❌ Error deleting category:", error);
    throw error;
  }
};

// Add a service to a specific category
export const addServiceToCategory = async (categoryId, serviceName) => {
  try {
    const categoryRef = doc(db, "servicesCategories", categoryId);
    const categorySnapshot = await getDoc(categoryRef);
    
    if (!categorySnapshot.exists()) {
      throw new Error("Category not found");
    }

    const currentServices = categorySnapshot.data().services || [];
    
    // Prevent duplicate services
    if (!currentServices.includes(serviceName)) {
      await updateDoc(categoryRef, {
        services: [...currentServices, serviceName]
      });
      
      console.log("✅ Service added successfully!");
    } else {
      console.warn("⚠️ Service already exists in the category");
    }
  } catch (error) {
    console.error("❌ Error adding service:", error);
    throw error;
  }
};

// Remove a service from a category
export const removeServiceFromCategory = async (categoryId, serviceName) => {
  try {
    const categoryRef = doc(db, "servicesCategories", categoryId);
    const categorySnapshot = await getDoc(categoryRef);
    
    if (!categorySnapshot.exists()) {
      throw new Error("Category not found");
    }

    const currentServices = categorySnapshot.data().services || [];
    const updatedServices = currentServices.filter(service => service !== serviceName);
    
    await updateDoc(categoryRef, {
      services: updatedServices
    });
    
    console.log("✅ Service removed successfully!");
  } catch (error) {
    console.error("❌ Error removing service:", error);
    throw error;
  }
};