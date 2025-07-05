export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
}

export interface ActionButton {
  id: string;
  label: string;
  icon: string;
  action: () => void;
}
