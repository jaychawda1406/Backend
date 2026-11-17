import { ChatGroq } from "@langchain/groq"
import dotenv from "dotenv"
import rl from "readline/promises";
import { tool, createAgent } from "langchain"
import * as z from "zod"
dotenv.config();

const events = [];

const createEventTool = tool( //Tool is just like a function but LLM can call it directly
    async function ({ date, title, description }) {

        console.log("Creating Event",{date,title,description})

        events.push({
            date,
            title,
            description
        })
        return "Event created successfully"
    },
    {
        name: "createEvent",
        description: "Creates an event",
        schema: z.object({
            date: z.string(),
            title: z.string(),
            description: z.string(),
        })
    }
)

const getEventsTool = tool(
    async function ({ }) {
        console.log("Getting Events",events)
        return events;
    },
    {
        name: "getEvents",
        description: "Gets all the events",
        schema: z.object({})
    }
)

//Used to get input from user only for simple applications
const readline = rl.createInterface({
    input: process.stdin,
    output: process.stdout
})

const model = new ChatGroq({
    model: "openai/gpt-oss-120b",
    apiKey: process.env.GROQ_API_KEY,
})

const agent = createAgent({
    model,
    tool: [createEventTool, getEventsTool]
})

while (true) {
    const userInput = await readline.question("Enter your input : ");
    const stream = await agent.stream({
        messages: [
            {
                role: "user",
                content: userInput
            },
        ]
    }, { streamMode: "messages" })

    for await (const [chunk] of stream) {
        process.stdout.write(chunk.content)
    }

    process.stdout.write('\n')
}