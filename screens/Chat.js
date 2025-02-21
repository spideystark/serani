import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Alert
} from 'react-native';
import { collection, doc, getDoc, query, orderBy, addDoc, onSnapshot, where, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../utils/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

const ChatScreen = ({ route, navigation }) => {
  const { taskId, runnerId, clientId } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUserName, setOtherUserName] = useState('');
  const [validTaskId, setValidTaskId] = useState(true);
  const flatListRef = useRef(null);
  const currentUserId = auth.currentUser.uid;
  const isRunner = currentUserId === runnerId;

  useEffect(() => {
    // Verify taskId is valid
    const checkTaskValidity = async () => {
      try {
        const taskDocRef = doc(db, 'tasks', taskId);
        const taskDoc = await getDoc(taskDocRef);
        
        if (!taskDoc.exists()) {
          setValidTaskId(false);
          Alert.alert(
            'Invalid Task',
            'This task no longer exists.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
          return;
        }
        
        // Ensure chat document exists
        const chatDocRef = doc(db, 'chats', taskId);
        const chatDoc = await getDoc(chatDocRef);
        
        if (!chatDoc.exists()) {
          // Create chat document if it doesn't exist
          await setDoc(chatDocRef, {
            taskId: taskId,
            runnerId: runnerId,
            clientId: clientId,
            createdAt: serverTimestamp(),
            lastMessage: null,
            lastMessageTime: null
          });
        }
      } catch (error) {
        console.error('Error checking task validity:', error);
        setValidTaskId(false);
        Alert.alert(
          'Error',
          'Failed to validate task. Please try again.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    };
    
    checkTaskValidity();
  }, [taskId]);

  useEffect(() => {
    // Fetch other user's name
    const fetchOtherUserName = async () => {
      try {
        const collectionName = isRunner ? 'users' : 'runners';
        const userId = isRunner ? clientId : runnerId;
        const userDoc = await getDoc(doc(db, collectionName, userId));
        if (userDoc.exists()) {
          setOtherUserName(userDoc.data().name || 'User');
        }
      } catch (error) {
        console.error('Error fetching user name:', error);
      }
    };

    if (validTaskId) {
      fetchOtherUserName();
    }
  }, [validTaskId]);

  useEffect(() => {
    // Set up chat header
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>{otherUserName}</Text>
          <Text style={styles.headerSubtitle}>Task #{taskId.slice(0, 6)}</Text>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('TaskDetails', { taskId })}
        >
          <Ionicons name="information-circle-outline" size={24} color="#2196F3" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, otherUserName]);

  useEffect(() => {
    // Subscribe to messages
    const messagesRef = collection(db, 'chats', taskId, 'messages');
    const q = query(
      messagesRef,
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(newMessages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [taskId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const messagesRef = collection(db, 'chats', taskId, 'messages');
      await addDoc(messagesRef, {
        text: newMessage.trim(),
        senderId: currentUserId,
        senderType: isRunner ? 'runner' : 'client',
        timestamp: serverTimestamp(),
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.senderId === currentUserId;

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.text}
          </Text>
          {item.timestamp && (
            <Text style={[
              styles.messageTime,
              isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
            ]}>
              {new Date(item.timestamp.toDate()).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          onLayout={() => flatListRef.current?.scrollToEnd()}
        />
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !newMessage.trim() && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons 
              name="send" 
              size={24} 
              color={newMessage.trim() ? "#2196F3" : "#999"} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  headerButton: {
    padding: 10,
  },
  messagesList: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  messageContainer: {
    marginVertical: 5,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 20,
    padding: 12,
    maxWidth: '100%',
  },
  ownMessageBubble: {
    backgroundColor: '#2196F3',
  },
  otherMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#000000',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
    color: '#000',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default ChatScreen;