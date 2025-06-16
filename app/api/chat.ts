import api from './api';

export interface ChatMessage {
  id: number;
  content: string;
  senderType: 'user' | 'ai';
  senderId: string;
  createdAt: string;
  orderId: number | null;
  isRead?: boolean;
  updatedAt?: string;
}

export interface ChatResponse {
  data: ChatMessage[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

export interface SendMessageResponse {
  userMessage: ChatMessage;
  aiMessage: ChatMessage;
}

export const chatApi = {
  // Envoyer un nouveau message
  sendMessage: async (content: string, orderId?: number): Promise<SendMessageResponse> => {
    const response = await api.post('/api/v1/chat', {
      message: content,
      orderId
    });
    return response.data;
  },

  // Récupérer les messages
  getMessages: async (page: number = 1, limit: number = 20, orderId?: number): Promise<ChatResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(orderId && { orderId: orderId.toString() })
    });

    const response = await api.get(`/api/v1/chat/history?${params.toString()}`);
    return response.data;
  },

  // Récupérer un message spécifique
  getMessage: async (id: number): Promise<ChatMessage> => {
    const response = await api.get(`/api/v1/chat/${id}`);
    return response.data;
  },

  // Mettre à jour un message
  updateMessage: async (id: number, data: { content?: string; isRead?: boolean }): Promise<ChatMessage> => {
    const response = await api.put(`/api/v1/chat/${id}`, {
      message: data.content,
      isRead: data.isRead
    });
    return response.data;
  }
}; 