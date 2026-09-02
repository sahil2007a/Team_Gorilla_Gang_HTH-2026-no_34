import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `You are an expert agricultural AI assistant for the AgriFlow app. 
Context: The user is a soybean farmer. Their crop is in the Vegetative Growth stage (Day 47/110). Current soil moisture is 42% (slightly low).
Answer the following question from the farmer helpfully, concisely, and practically:
Why are my leaves turning yellow?`;

    console.log("Sending question to Gemini: 'Why are my leaves turning yellow?'...");
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    console.log("\n--- GEMINI RESPONSE ---\n");
    console.log(responseText);
    console.log("\n-----------------------\n");
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
