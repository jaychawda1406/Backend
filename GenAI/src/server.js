import { ChatGroq } from "@langchain/groq"
import dotenv from "dotenv"
import rl from "readline/promises";

dotenv.config();

//Used to get input from user only for simple applications
const readline = rl.createInterface({
    input: process.stdin,
    output: process.stdout
})

const model = new ChatGroq({
    model: "openai/gpt-oss-120b",
    apiKey: process.env.GROQ_API_KEY,
})

const messagesArray = []

while (true) {
    const userInput = await readline.question("Enter your Input: ");
    messagesArray.push({ //memory in the form of array.
        role: "user",
        content: userInput,
    })

    const response = await model.stream(messagesArray) //use .stream for tokenwise output
    
    let assistantResponse = ""
    for await (const chunk of response) {
        assistantResponse += chunk.content
        process.stdout.write(chunk.content)
    }

    messagesArray.push({
        role: "assistant",
        content: assistantResponse,
    })
    
    process.stdout.write("\n");
}