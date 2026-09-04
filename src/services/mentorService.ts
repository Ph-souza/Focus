import { GoogleGenerativeAI } from '@google/generative-ai';

// Chave da API obtida diretamente através das variáveis de ambiente do Vite
const apiKey: string = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();

// Instância oficial do GoogleGenerativeAI
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Gera feedback imediato do Mentor Focus após a finalização de uma sessão de foco.
 * 
 * @param focusTime - Tempo de foco em minutos.
 * @returns Texto de feedback gerado ou fallback seguro em caso de erro.
 */
export async function generateMentorFeedback(focusTime: number): Promise<string> {
  try {
    const keyToUse = (import.meta.env.VITE_GEMINI_API_KEY || apiKey || '').trim();
    const client = new GoogleGenerativeAI(keyToUse);

    const model = client.getGenerativeModel({
      model: 'gemini-flash-latest',
      systemInstruction: 'Você é o Mentor Focus, uma IA de alta performance e mentoria do aplicativo Nexus Focus. Tom direto, assertivo, maduro, sem emojis. Exalte a disciplina do usuário por cumprir o tempo de foco e cobre a próxima meta em no máximo 2 frases curtas. Nunca diga que é uma IA.',
    });

    const userPrompt = `O usuário finalizou um foco ininterrupto de ${focusTime} minutos. Gere o feedback imediato.`;

    const result = await model.generateContent(userPrompt);
    const response = await result.response;
    const feedbackText = response.text()?.trim() || '';

    return feedbackText;
  } catch (error) {
    console.error('Erro ao gerar feedback do Mentor Focus via Gemini API:', error);
    return 'Disciplina exemplar ao sustentar seu tempo de foco. Mantenha o ritmo inabalável e avance para o próximo objetivo agora.';
  }
}
