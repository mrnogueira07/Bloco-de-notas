import { GoogleGenAI } from "@google/genai";

// Initialize the client with the API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export type ToneType = 'formal' | 'professional' | 'informal';

/**
 * Helper to clean the model response.
 * Removes markdown code blocks and wrapping quotes if present.
 */
const cleanText = (text: string | undefined): string => {
  if (!text) return "";
  return text
    .replace(/^```(markdown|html|text)?\n/i, '') // Remove start code block
    .replace(/\n```$/i, '') // Remove end code block
    .trim();
};

/**
 * Improves the text content using Gemini.
 * Uses a specific system instruction for editing capabilities.
 */
export const enhanceNoteContent = async (text: string): Promise<string> => {
  if (!text.trim()) return text;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: text,
      config: {
        systemInstruction: "Você é um editor de texto especialista. Seu objetivo é melhorar o texto fornecido: corrija a gramática, melhore a clareza e a fluidez, e formate melhor se necessário. Mantenha o idioma original (Português). Retorne APENAS o texto melhorado, sem introduções, aspas ou explicações adicionais.",
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return cleanText(response.text) || text;
  } catch (error) {
    console.error("Erro ao conectar com Gemini (Enhance):", error);
    throw error;
  }
};

/**
 * Strictly fixes grammar and spelling errors without changing style or tone.
 */
export const fixGrammar = async (text: string): Promise<string> => {
  if (!text.trim()) return text;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: text,
      config: {
        systemInstruction: "Você é um corretor gramatical rigoroso. Sua tarefa é corrigir estritamente erros gramaticais, de ortografia e pontuação do texto fornecido. NÃO altere o estilo, tom ou estrutura das frases a menos que esteja gramaticalmente incorreto. Retorne APENAS o texto corrigido.",
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return cleanText(response.text) || text;
  } catch (error) {
    console.error("Erro ao conectar com Gemini (Grammar):", error);
    throw error;
  }
};

/**
 * Rewrites text in a specific tone using specific system instructions.
 */
export const changeTone = async (text: string, tone: ToneType): Promise<string> => {
  if (!text.trim()) return text;

  const instructions = {
    formal: "Reescreva o texto a seguir em um tom formal, culto e respeitoso. Utilize vocabulário adequado e estruturas frasais elegantes. Mantenha o significado original.",
    professional: "Reescreva o texto a seguir em um tom profissional, corporativo e objetivo. Seja claro e direto, ideal para ambiente de trabalho. Mantenha o significado original.",
    informal: "Reescreva o texto a seguir em um tom informal, conversacional e amigável. Use uma linguagem relaxada, como se estivesse falando com um amigo. Mantenha o significado original."
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: text,
      config: {
        systemInstruction: `${instructions[tone]} Retorne APENAS o texto reescrito, sem formatação Markdown.`,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return cleanText(response.text) || text;
  } catch (error) {
    console.error(`Erro ao mudar tom para ${tone}:`, error);
    throw error;
  }
};

/**
 * Generates a title based on the content of the note.
 */
export const generateTitle = async (content: string): Promise<string> => {
  if (!content.trim()) return "Nova Nota";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: content,
      config: {
        systemInstruction: "Gere um título curto, conciso e descritivo (máximo 5 palavras) para o texto fornecido. Retorne APENAS o título, sem aspas.",
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    let title = cleanText(response.text);
    return title ? title.replace(/^["']|["']$/g, '').trim() : "Nova Nota";
  } catch (error) {
    console.error("Erro ao gerar título:", error);
    return "Nova Nota";
  }
};