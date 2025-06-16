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
    try {
      const response = await api.post('/chat', {
        message: content,
        orderId
      });

      if (!response.data || !response.data.data) {
        throw new Error('Réponse invalide du serveur');
      }

      const data = response.data.data;
      
      // Vérifier la structure de la réponse
      if (!data.userMessage || !data.aiMessage) {
        throw new Error('Structure de réponse invalide');
      }

      // Transformer les messages pour correspondre à l'interface ChatMessage
      return {
        userMessage: {
          id: data.userMessage.id,
          content: data.userMessage.message,
          senderType: 'user' as const,
          senderId: data.userMessage.userId,
          createdAt: data.userMessage.createdAt,
          orderId: data.userMessage.orderId,
          isRead: data.userMessage.isRead,
          updatedAt: data.userMessage.updatedAt
        },
        aiMessage: {
          id: data.aiMessage.id,
          content: data.aiMessage.message,
          senderType: 'ai' as const,
          senderId: data.aiMessage.userId,
          createdAt: data.aiMessage.createdAt,
          orderId: data.aiMessage.orderId,
          isRead: data.aiMessage.isRead,
          updatedAt: data.aiMessage.updatedAt
        }
      };
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi du message:', error);
      
      // Gérer les différents types d'erreurs
      if (error.response) {
        // Erreur avec réponse du serveur
        const errorMessage = error.response.data?.message || 'Erreur lors de l\'envoi du message';
        throw new Error(errorMessage);
      } else if (error.request) {
        // Erreur sans réponse du serveur
        throw new Error('Impossible de contacter le serveur');
      } else {
        // Autre type d'erreur
        throw new Error(error.message || 'Une erreur inattendue est survenue');
      }
    }
  },

  // Récupérer les messages
  getMessages: async (page: number = 1, limit: number = 20, orderId?: number): Promise<ChatResponse> => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(orderId && { orderId: orderId.toString() })
      });

      const response = await api.get(`/chat/history?${params.toString()}`);
      console.log('Réponse API chat:', response.data);

      // Vérifier si la réponse a la structure attendue
      if (!response.data || !response.data.data || !response.data.data.data) {
        console.error('Structure de réponse invalide:', response.data);
        return {
          data: [],
          meta: {
            total: 0,
            per_page: limit,
            current_page: page,
            last_page: 1
          }
        };
      }

      const messages = response.data.data.data;
      
      // Transformer les messages pour correspondre à l'interface ChatMessage
      const transformedMessages = Array.isArray(messages) ? messages.map((msg: any) => ({
        id: msg.id,
        content: msg.message,
        senderType: msg.isFromUser ? 'user' as const : 'ai' as const,
        senderId: msg.userId,
        createdAt: msg.createdAt,
        orderId: msg.orderId,
        isRead: msg.isRead,
        updatedAt: msg.updatedAt
      })) : [];

      return {
        data: transformedMessages,
        meta: {
          total: response.data.data.meta?.total || 0,
          per_page: response.data.data.meta?.perPage || limit,
          current_page: response.data.data.meta?.currentPage || page,
          last_page: response.data.data.meta?.lastPage || 1
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      return {
        data: [],
        meta: {
          total: 0,
          per_page: limit,
          current_page: page,
          last_page: 1
        }
      };
    }
  },

  // Récupérer un message spécifique
  getMessage: async (id: number): Promise<ChatMessage> => {
    try {
      const response = await api.get(`/chat/${id}`);
      const msg = response.data.data;
      
      if (!msg) {
        throw new Error('Message non trouvé');
      }

      return {
        id: msg.id,
        content: msg.message,
        senderType: msg.isFromUser ? 'user' : 'ai',
        senderId: msg.userId,
        createdAt: msg.createdAt,
        orderId: msg.orderId,
        isRead: msg.isRead,
        updatedAt: msg.updatedAt
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du message:', error);
      throw error;
    }
  },

  // Mettre à jour un message
  updateMessage: async (id: number, data: { content?: string; isRead?: boolean }): Promise<ChatMessage> => {
    try {
      const response = await api.put(`/chat/${id}`, {
        message: data.content,
        isRead: data.isRead
      });
      const msg = response.data.data;

      if (!msg) {
        throw new Error('Message non trouvé');
      }

      return {
        id: msg.id,
        content: msg.message,
        senderType: msg.isFromUser ? 'user' : 'ai',
        senderId: msg.userId,
        createdAt: msg.createdAt,
        orderId: msg.orderId,
        isRead: msg.isRead,
        updatedAt: msg.updatedAt
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du message:', error);
      throw error;
    }
  }
}; 