import { db } from "../firebaseConfig";
import { collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc } from "firebase/firestore";

// Function to create a chat session between a client and a runner
export const createChat = async (chatId, chatData) => {
  try {
    await setDoc(doc(db, "chats", chatId), chatData);
    console.log("Chat session created!");
  } catch (error) {
    console.error("Error creating chat:", error);
  }
};

// Function to send a message
export const sendMessage = async (chatId, messageData) => {
  try {
    const chatRef = doc(db, "chats", chatId);
    const chatSnapshot = await getDoc(chatRef);

    if (chatSnapshot.exists()) {
      const chat = chatSnapshot.data();
      const updatedMessages = [...chat.messages, messageData];

      await updateDoc(chatRef, { messages: updatedMessages });
      console.log("Message sent!");
    } else {
      console.error("Chat not found!");
    }
  } catch (error) {
    console.error("Error sending message:", error);
  }
};

// Function to get messages from a chat
export const getChatMessages = async (chatId) => {
  try {
    const chatDoc = await getDoc(doc(db, "chats", chatId));
    return chatDoc.exists() ? chatDoc.data().messages : [];
  } catch (error) {
    console.error("Error fetching chat messages:", error);
  }
};

// Function to fetch all chat sessions
export const getAllChats = async () => {
  try {
    const chatCollection = await getDocs(collection(db, "chats"));
    return chatCollection.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching chats:", error);
  }
};
