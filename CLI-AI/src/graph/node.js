import { ChatGroq } from "@langchain/groq"
import { getApiKey } from "../utils/file.utils.js";
import { AIMessage } from "langchain"

/**
 * LangGraph ka main LLM node jo conversation history lekar AI se response generate karta hai,
 * usse terminal par real-time stream karta hai, aur updated chat history state ko return karta hai.
 */
export async function LLMNode(state) {

    // Groq AI platform se connect hone ke liye ChatGroq model ka instance (object) banata hai
    const model = new ChatGroq({
        model: "openai/gpt-oss-120b",          // Groq server par kaunsa AI model run karna hai, uska naam specify karta hai
        apiKey: (await getApiKey()).apiKey    // Local settings file se saved Groq API key fetch karke authentication ke liye pass karta hai
    });

    // AI model ko ab tak ki poori conversation history bhej kar response ko tukdon (stream) mein mangwate hain
    const stream = await model.stream(state.messages);

    // Terminal mein bina new line (Enter) ke "[AI]: " prefix print karte hain taaki reply iske aage se shuru ho
    process.stdout.write("[AI]: ");

    // Poore AI response ko ek saath jodne aur memory mein save karne ke liye empty string banate hain
    let aiMessage = "";

    // Stream se aane wale har ek chhote chunk (word/token) ko ek-ek karke asynchronously receive karte hain
    for await (const chunk of stream) {
        // Har chunk ke text ko real-time mein terminal par print karte hain (bina line break ke)
        process.stdout.write(chunk.text);

        // Saath hi har chunk ko `aiMessage` mein jodte jaate hain taaki poora reply ek string mein save rahe
        aiMessage += chunk.text;
    }

    // Poora AI response print hone ke baad terminal mein ek new line (Enter) add karte hain
    process.stdout.write("\n")

    // Updated state return karte hain: purane saare messages ke aage naya AIMessage add karke
    return {
        messages: [
            ...state.messages,
            new AIMessage(aiMessage)
        ]
    }
}