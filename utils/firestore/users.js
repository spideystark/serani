// userAuth.js
import { initializeAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { firestore } from "../firebaseConfig";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

// User schema
const userSchema = {
  id: "", // Firestore auto-generated ID
  email: "", // User email
  firstName: "", // User first name
  lastName: "", // User last name
  role: "client", // Default role
  profileImage: "", // URL of profile image
  createdAt: "", // Timestamp when user was created
  updatedAt: "", // Timestamp when user was last updated
};

// Function to register a new user
export const registerUser = async (email, password, firstName, lastName) => {
  try {
    // Create authentication user
    const auth = initializeAuth();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user profile in Firestore
    const userData = {
      ...userSchema,
      id: userCredential.user.uid,
      email,
      firstName,
      lastName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await setDoc(doc(firestore, "users", userCredential.user.uid), userData);
    return { success: true, user: userData };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Function to login user
export const loginUser = async (email, password) => {
  try {
    const auth = initializeAuth();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userData = await getUserById(userCredential.user.uid);
    return { success: true, user: userData };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Function to get user by ID
export const getUserById = async (userId) => {
  try {
    const userDoc = await getDoc(doc(firestore, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    throw error;
  }
};

// Function to update user profile
export const updateUserProfile = async (userId, updateData) => {
  try {
    const userRef = doc(firestore, "users", userId);
    await updateDoc(userRef, {
      ...updateData,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Function to update profile image
export const updateProfileImage = async (userId, imageUrl) => {
  try {
    const userRef = doc(firestore, "users", userId);
    await updateDoc(userRef, {
      profileImage: imageUrl,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};