import { ChatGroq } from "@langchain/groq"
import dotenv from "dotenv"
import rl from "readline/promises";
import { tool, createAgent } from "langchain"
import * as z from "zod" // Zod: Validates unknown data at runtime (e.g., API responses, forms) and automatically generates TypeScript types via `z.infer<typeof Schema>`.
import { StateGraph, START, END } from "@langchain/langgraph"
// @langchain/langgraph: Builds stateful, multi-step AI agent workflows with loops & conditions.
// - StateGraph: Main graph container that holds and updates shared data (state/messages) across steps.
// - START / END: Special entry and exit markers defining where the workflow begins and stops.

// .env file se saare secret keys (jaise GROQ_API_KEY) ko process.env me load kar rahe hain
dotenv.config();

// Abhi ke liye dummy database (in-memory array) jisme saare created events store honge
const events = [];

const createEventTool = tool( //Tool is just like a function but agent cannot directly call it,it just request for tool call,it knows what is does,what is the name etc etc.
    // Jab AI model bolega ki event banana hai, tab ye actual JS function execute hoga
    async function ({ date, title, description }) {

        console.log("Creating Event", { date, title, description })

        // Naya event object bana kar upar wale events array me push kar rahe hain
        events.push({
            date,
            title,
            description
        })
        // Ye return string wapas AI ko jayegi taaki usko pata chale kaam ho gaya
        return "Event created successfully"
    },
    {
        name: "createEvent",
        description: "Creates an event",
        // AI ko batane ke liye ki is tool ko chalane ke liye kaunse 3 parameters aur kis type ke chahiye
        schema: z.object({
            date: z.string(),
            title: z.string(),
            description: z.string(),
        })
    }
)

const getEventsTool = tool(
    // Saare saved events fetch karne ke liye tool function
    async function ({ }) {
        console.log("Getting Events", events)
        return events;
    },
    {
        name: "getEvents",
        description: "Gets all the events",
        // Kyunki is tool ko koi input argument nahi chahiye, isliye empty object schema diya hai
        schema: z.object({})
    }
)

//Used to get input from user only for simple applications
const readline = rl.createInterface({
    input: process.stdin,
    output: process.stdout
})

// Groq API ke through LLM (AI brain) initialize kar rahe hain
const model = new ChatGroq({
    model: "openai/gpt-oss-120b",
    apiKey: process.env.GROQ_API_KEY,
})

// Graph ka ek step (Node) jo current state (messages) leta hai aur updated state return karta hai
async function LLMNode(state) { //Creation of LLM Node.Just a LLM Node 
    console.log("LLM Node: ", state)

    // Purane saare messages ko rakhte hue naya assistant reply list me append kar rahe hain (abhi hardcoded hai, baad me model.invoke lag sakta hai)
    return {
        messages: [
            ...state.messages,
            {
                role: "assistant",
                content: "Hey there"
            }
        ]
    }
}

/* ============================================================================
- STATE GRAPH INITIALIZATION (Shared Agent Memory)
- ----------------------------------------------------------------------------
- - `new StateGraph(...)` : Creates the main graph workflow container.
- - `z.object({ ... })`   : Uses Zod to define the shape of the shared state
-                           passed between every node in the graph.
- - `messages: z.array()` : Stores the conversation history (user prompts,
-                           AI responses, and tool outputs) as a list.
- ============================================================================ */
const graph = new StateGraph(
    z.object({
        messages: z.array(z.any())
    }))
    .addNode("LLMNodes", LLMNode)  //Adding Node
    .addEdge(START, "LLMNodes")    //Adding Edge START-------->LLMNode 
    .addEdge("LLMNodes", END)       //Adding Edge LLMNode-------->END
    .compile() // Poora workflow structure lock karke executable graph bana rahe hain

// Graph ko run (trigger) kar rahe hain initial user message ke saath aur result ka wait kar rahe hain
const graphResult = await graph.invoke({
    messages: [
        {
            role: "user",
            content: "Hello World"
        }
    ]
})

// Final state (user message + assistant reply) terminal me print karne ke liye
console.log(graphResult)