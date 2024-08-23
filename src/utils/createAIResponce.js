import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.API_KEY || "" 
});

export const createAIResponse = async (message) => {
    try {
        const stream = await openai.chat.completions.create({
            model: "gpt-4o-mini",  
            messages: [
                { "role": "system", "content": "You are a helpful assistant." },
                { "role": "user", "content": message }
            ],
            stream: true, 
        });

        let responseText = '';
        for await (const chunk of stream) {
            if (chunk.choices[0].delta?.content) {
                const content = chunk.choices[0].delta.content;
                process.stdout.write(content);
                responseText += content;
            }
        }
        return responseText; 
    } catch (error) {
        throw new Error("Failed to create AI response.");
    }
}
