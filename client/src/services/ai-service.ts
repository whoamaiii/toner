interface AIResponse {
  content: string;
  sources?: string[];
}

class AIService {
  private async callAPI(message: string, mode: string): Promise<string> {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          mode,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }

  async sendMessage(message: string, mode: 'DeepSearch' | 'Think'): Promise<string> {
    return this.callAPI(message, mode);
  }

  async generateImage(prompt: string): Promise<string> {
    // Placeholder for image generation
    throw new Error('Image generation not implemented yet');
  }

  async getLatestNews(query?: string): Promise<any[]> {
    // Placeholder for news fetching
    throw new Error('News fetching not implemented yet');
  }
}

export const aiService = new AIService();
