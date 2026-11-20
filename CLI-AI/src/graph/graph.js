import { StateGraph, END, START } from "@langchain/langgraph"
import { LLMNode } from "./node.js";
import { HumanMessage } from "@langchain/core/messages";// User ke plain text input ko structured LangChain message format mein wrap karne ke liye HumanMessage import kar rahe hain
import rl from "../utils/realine.js";
import * as z from "zod";
const stateFormat = z.object({
    messages: z.array(z.any())
})

//Creation of state graph
const graph = new StateGraph(stateFormat)
    .addNode("LLMNode", LLMNode)
    .addEdge(START, "LLMNode")
    .addEdge("LLMNode", END)
    .compile();

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
    while (true) {
        const userInput = await rl.question("Enter Your Input: ")
        const response = await graph.invoke({
            messages: [
                new HumanMessage(userInput)
            ]
        })
        console.log("[AI]", response)
    }
}