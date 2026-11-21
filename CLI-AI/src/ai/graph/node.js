import { ChatGroq } from "@langchain/groq"
import { getApiKey } from "../../utils/file.utils.js";
import { AIMessage } from "langchain"
import { upsertFiles, readFiles, listFiles } from "../tools/file.tool.js"
import * as fileTools from "../tools/file.tool.js"
import rl from "../../utils/readline.js"

/**
 * LangGraph ka main LLM node jo conversation history lekar AI se response generate karta hai,
 * usse terminal par real-time stream karta hai, aur updated chat history state ko return karta hai.
 */
export async function LLMNode(state, config) {
    // Groq AI platform se connect hone ke liye ChatGroq model ka instance (object) banata hai
    const model = new ChatGroq({
        model: "openai/gpt-oss-120b",          // Groq server par kaunsa AI model run karna hai, uska naam specify karta hai
        apiKey: (await getApiKey()).apiKey    // Local settings file se saved Groq API key fetch karke authentication ke liye pass karta hai
    });

    // Model ko upsertFilesTool ke saath bind kar rahe hain taaki AI zaroorat padne par files create/update karne ke liye is tool ko call kar sake
    const modelWithTool = model.bindTools([upsertFiles, readFiles, listFiles]);

    // AI model ko ab tak ki poori conversation history bhej kar response ko tukdon (stream) mein mangwate hain
    const stream = await modelWithTool.stream(state.messages);

    // Terminal mein bina new line (Enter) ke "[AI]: " prefix print karte hain taaki reply iske aage se shuru ho
    process.stdout.write("[AI]: ");

    // Poore AI response ko ek saath jodne aur memory mein save karne ke liye empty string banate hain
    let aiMessage = null;

    // Stream se aane wale har ek chhote chunk (word/token) ko ek-ek karke asynchronously receive karte hain
    for await (const chunk of stream) {
        // Har chunk ke text ko real-time mein terminal par print karte hain (bina line break ke)
        process.stdout.write(chunk.text);

        // Agar `aiMessage` khali hai toh chunk assign karo, warna naye chunk ko usme jod do
        if (!aiMessage) aiMessage = chunk;
        else aiMessage = aiMessage.concat(chunk);
    }

    // Poora AI response print hone ke baad terminal mein ek new line (Enter) add karte hain
    process.stdout.write("\n")

    // Updated state return karte hain: purane saare messages ke aage naya AIMessage add karke
    return {
        messages: [
            ...state.messages,
            aiMessage
        ]
    }
}


/**
 * Node Name: ToolNode
 * Purpose: AI dwara maange gaye sabhi tool calls (jaise files banana, padhna, ya list karna) ko execute karne ke liye.
 * Working: Yeh conversation ke aakhiri message se `tool_calls` nikalta hai, har tool ke naam ke hisaab se 
 *          sahi function chalata hai (file create/update karne se pehle user se confirmation bhi leta hai), 
 *          aur saare tool results ko wapas graph ki state (`messages`) mein add kar deta hai.
 */
export async function ToolNode(state, config) {
    // Current state se ab tak ki poori conversation history (messages) nikal rahe hain
    const messages = state.messages

    // Conversation ka sabse aakhiri message le rahe hain (jo AI ka response hoga)
    const lastMessage = state.messages[state.messages.length - 1]

    // AI ke message ke andar se un tools ki list nikal rahe hain jinhe AI run karna chahta hai
    const toolCalls = lastMessage.tool_calls

    // Sabhi tools ke execution ka output (results) is array mein jama hoga
    const toolResults = []

    // Ek-ek karke har requested tool call par loop chala rahe hain
    for (const toolCall of toolCalls) {

        // Tool ke naam ke basis par decide kar rahe hain ki kaunsa action lena hai
        switch (toolCall.name) {
            case "upsertFiles":
                // Terminal par print kar rahe hain ki kaun-kaun si files create ya update hone wali hain
                process.stdout.write(`[Tool]: Updating/creating files ${JSON.stringify(toolCall.args.files.map(f => f.path).join(", "))}\n`)

                // Human-in-the-loop: File mein badlav karne se pehle user se terminal par 'yes/no' permission le rahe hain
                const userInput = await rl.question("Do you want to proceed? (yes/no): ")

                // Agar user 'yes' nahi likhta, toh operation ko cancel (abort) karke AI ko iski jaankari de rahe hain
                if (userInput.toLowerCase() !== "yes") {
                    process.stdout.write("Aborting file update.\n")
                    return new ToolMessage({
                        content: "User aborted file update/create.",
                        tool_call_id: toolCall.id
                    })
                }

                // User ki permission milne ke baad `upsertFiles` tool ko execute karke result save kar rahe hain
                const result = await fileTools.upsertFiles.invoke(toolCall)
                toolResults.push(result)
                break;

            case "readFiles":
                // Terminal par log dikha rahe hain ki kaunsi files read ki ja rahi hain
                process.stdout.write(`[Tool]: Reading files ${JSON.stringify(toolCall.args.files.map(f => f.path).join(", "))}\n`)

                // `readFiles` tool ko chala kar file ka content `toolResults` mein add kar rahe hain
                const readResult = await fileTools.readFiles.invoke(toolCall)
                toolResults.push(readResult)
                break;

            case "listFiles":
                // Terminal par log dikha rahe hain ki folder ki files list ki ja rahi hain
                process.stdout.write(`[Tool]: Listing files\n`)

                // `listFiles` tool ko chala kar sabhi files ki list `toolResults` mein add kar rahe hain
                const listResult = await fileTools.listFiles.invoke(toolCall)
                toolResults.push(listResult)
                break;

            default:
                // Agar AI kisi aise tool ka naam bhej de jo defined nahi hai, toh warning print kar rahe hain
                process.stdout.write(`[Tool]: Unknown tool ${toolCall.name}\n`)
                break;
        }

    }

    // Purane messages ke saath naye `toolResults` ko jodkar updated state return kar rahe hain (taaki AI aage ka jawab de sake)
    return {
        messages: [
            ...state.messages,
            ...toolResults
        ]
    }
}