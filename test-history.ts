import { GoogleGenAI } from '@google/genai';
import { config } from 'dotenv';
config();

async function test() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const history = [
      { role: 'model', parts: [{ text: 'ola' }] },
      { role: 'user', parts: [{ text: 'tudo bem' }] }
    ];
    const contents = [...history, { role: 'user', parts: [{text: 'teste'}] }];
    const res = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents
    });
    console.log("SUCCESS:", res.text);
  } catch (e) {
    console.error("ERROR:", e);
  }
}
test();
