import { db } from "../utils/firebaseConfig"; // Ensure this path is correct
import { collection, doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";

// Function to save or update a user’s location (Runner/Client)
export const saveLocation = async (userId, locationData) => {
  try {
    await setDoc(doc(db, "locations", userId), { 
      ...locationData, 
      timestamp: serverTimestamp() // Firestore server timestamp
    }, { merge: true });
    console.log("✅ Location saved successfully!");
    return true;
  } catch (error) {
    console.error("❌ Error saving location:", error);
    return false;
  }
};

// Function to get a user's location
export const getLocation = async (userId) => {
  try {
    const locationDoc = await getDoc(doc(db, "locations", userId));
    if (locationDoc.exists()) {
      return locationDoc.data();
    } else {
      console.warn("⚠️ Location not found for user:", userId);
      return null;
    }
  } catch (error) {
    console.error("❌ Error getting location:", error);
    return null;
  }
};

// Function to update a user's location
export const updateLocation = async (userId, newLocation) => {
  try {
    await updateDoc(doc(db, "locations", userId), { 
      ...newLocation, 
      timestamp: serverTimestamp() 
    });
    console.log("✅ Location updated successfully!");
    return true;
  } catch (error) {
    console.error("❌ Error updating location:", error);
    return false;
  }
};

// Function to delete a user’s location (if they go offline)
export const deleteLocation = async (userId) => {
  try {
    await deleteDoc(doc(db, "locations", userId));
    console.log("✅ Location deleted successfully!");
    return true;
  } catch (error) {
    console.error("❌ Error deleting location:", error);
    return false;
  }
};
