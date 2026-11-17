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

while (true) {
    const userInput = await readline.question("Enter your Input: ");
    const response = await model.stream([
        {
            "role": "user",
            "content": userInput,
        },
    ]) //use .stream for tokenwise output
    for await (const chunk of response) {
        process.stdout.write(chunk.content)
    }
    process.stdout.write("\n");
}