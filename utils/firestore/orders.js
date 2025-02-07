import { db } from "../firebaseConfig";
import { collection, doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

// Function to create an order
export const createOrder = async (orderId, orderData) => {
  try {
    await setDoc(doc(db, "orders", orderId), orderData);
    console.log("Order created successfully!");
  } catch (error) {
    console.error("Error creating order:", error);
  }
};

// Function to get order details
export const getOrder = async (orderId) => {
  try {
    const orderDoc = await getDoc(doc(db, "orders", orderId));
    return orderDoc.exists() ? orderDoc.data() : null;
  } catch (error) {
    console.error("Error getting order:", error);
  }
};

// Function to update order status
export const updateOrderStatus = async (orderId, status) => {
  try {
    await updateDoc(doc(db, "orders", orderId), { status });
    console.log("Order status updated!");
  } catch (error) {
    console.error("Error updating order:", error);
  }
};

// Function to delete an order
export const deleteOrder = async (orderId) => {
  try {
    await deleteDoc(doc(db, "orders", orderId));
    console.log("Order deleted successfully!");
  } catch (error) {
    console.error("Error deleting order:", error);
  }
};
