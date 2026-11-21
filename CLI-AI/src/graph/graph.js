import { StateGraph, END, START } from "@langchain/langgraph"// LangGraph se workflow banane wali main class (StateGraph) aur graph ke entry/exit points (START, END) import kar rahe hain
import { LLMNode } from "./node.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages"; // User ke input aur system ke instructions ko structured LangChain message format mein wrap karne ke liye HumanMessage aur SystemMessage import kar rahe hain
import rl from "../utils/realine.js";
import * as z from "zod";

// LangGraph ke state (memory) ka structure define karta hai jisme saare chat messages ek array ke andar store honge
const stateFormat = z.object({
    messages: z.array(z.any())
})

// LangGraph workflow banata aur compile karta hai:
// START -> LLMNode (AI response generate karta hai) -> END
const graph = new StateGraph(stateFormat)
    .addNode("LLMNode", LLMNode)   // Graph mein "LLMNode" naam ka step/node register karta hai
    .addEdge(START, "LLMNode")     // Graph start hote hi seedha "LLMNode" par bhejta hai
    .addEdge("LLMNode", END)       // "LLMNode" ka kaam poora hone ke baad workflow ko END karta hai
    .compile();                    // Poora graph structure lock karke executable/runnable banata hai

/**
* Yeh function terminal mein ek continuous (infinite) chat loop start karta hai
* jisse user baar-baar AI agent se baat kar sake.
* 
* Flow:
* 1. `while (true)` loop chalata hai taaki chat chalti rahe aur program ek hi sawaal ke baad band na ho.
* 2. Terminal mein user se input maangta hai (`rl.question`).
* 3. User ke text ko `HumanMessage` mein wrap karke LangGraph workflow (`graph.invoke`) ko bhejta hai aur response ka wait karta hai.
* 
* Note: Abhi isme loop rokne ki koi exit condition nahi hai (Ctrl + C se hi rukega)
* aur response ko terminal mein print (`console.log`) bhi nahi kiya gaya hai.
*/
export default async function initGraph() {
    let messagesArray = [
        new SystemMessage("You respond under 50 words and you always communicate in Cavemen language.")
    ]
    while (true) {
        const userInput = await rl.question("Enter Your Input: ")

        if (userInput.toLowerCase() === "/bye") { //Logic for stopping the graph to run
            break;
        }
        messagesArray.push(new HumanMessage(userInput))
        const response = await graph.invoke({ messages: messagesArray }, { context: { username: "Rohan" } })

        messagesArray = response.messages
    }
}