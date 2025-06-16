import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { chatApi, ChatMessage } from "../api/chat";
import { useAuth } from "../contexts/AuthContext";

export default function ChatbotScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  const fetchMessages = async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      setLoading(true);
      const response = await chatApi.getMessages(pageNum);
      const newMessages = response.data;
      
      if (refresh) {
        setMessages(newMessages);
      } else {
        setMessages(prev => [...prev, ...newMessages]);
      }
      
      setHasMore(pageNum < response.meta.last_page);
      setPage(pageNum);
    } catch (error) {
      console.error("Erreur lors de la récupération des messages:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMessages(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchMessages(page + 1);
    }
  };

  const handleSend = async () => {
    if (inputText.trim() === "" || sending) return;

    try {
      setSending(true);
      const response = await chatApi.sendMessage(inputText.trim());
      
      setMessages(prev => [response.userMessage, response.aiMessage, ...prev]);
      setInputText("");
      
      // Marquer les messages comme lus
      if (response.userMessage.id) {
        await chatApi.updateMessage(response.userMessage.id, { isRead: true });
      }
      if (response.aiMessage.id) {
        await chatApi.updateMessage(response.aiMessage.id, { isRead: true });
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.botIcon}>
          <Ionicons name="chatbubble" size={24} color="#F59E0B" />
        </View>
        <Text style={styles.headerTitle}>{t("chatbot")}</Text>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 20;
          if (layoutMeasurement.height + contentOffset.y >= 
              contentSize.height - paddingToBottom) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {loading && !refreshing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#F59E0B" />
          </View>
        )}
        
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.senderType === 'user' ? styles.userBubble : styles.botBubble,
            ]}
          >
            {message.senderType === 'ai' && (
              <View style={styles.botAvatar}>
                <Ionicons name="chatbubble" size={20} color="#F59E0B" />
              </View>
            )}
            <View style={styles.messageContent}>
              <Text
                style={[
                  styles.messageText,
                  message.senderType === 'user' ? styles.userText : styles.botText,
                ]}
              >
                {message.content}
              </Text>
              <Text style={styles.timestamp}>
                {formatDate(message.createdAt)}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder={t("type_message")}
          placeholderTextColor="#666"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendingButton]}
          onPress={handleSend}
          disabled={inputText.trim() === "" || sending}
        >
          {sending ? (
            <ActivityIndicator color="#F59E0B" size="small" />
          ) : (
            <Ionicons
              name="send"
              size={24}
              color={inputText.trim() === "" ? "#999" : "#F59E0B"}
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  botIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF5E6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  messageContent: {
    flex: 1,
  },
  userBubble: {
    backgroundColor: "#F59E0B",
    alignSelf: "flex-end",
  },
  botBubble: {
    backgroundColor: "#F5F5F5",
    alignSelf: "flex-start",
  },
  botAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFF5E6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  messageText: {
    fontSize: 16,
    flex: 1,
  },
  userText: {
    color: "#fff",
  },
  botText: {
    color: "#333",
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    backgroundColor: "#F5F5F5",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendingButton: {
    backgroundColor: "#FFF5E6",
  },
});
