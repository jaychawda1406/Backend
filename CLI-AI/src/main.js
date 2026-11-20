// Local JSON settings file ko read karne, API key save karne, aur key ko validate/fetch karne ke utility functions import kar rahe hain
import { getSettingsFile, saveApiKey, getApiKey } from "./utils/file.utils.js";

// Terminal se user input lene aur chat session khatam hone par readline interface close karne ke liye rl import kar rahe hain
import rl from "./utils/realine.js";

// LangGraph ka continuous terminal chat loop start karne wala main function import kar rahe hain
import initGraph from "./graph/graph.js";

/**
 * Yeh CLI application ka main entry function hai jo poora startup flow handle karta hai:
 * 1. Local settings file check karta hai ki API key pehle se saved hai ya nahi; agar nahi hai toh user se maang kar save karta hai.
 * 2. Saved API key ko Groq API ke through validate karta hai.
 * 3. Agar key invalid ya expired nikalti hai, toh error dikhakar nayi key maangta hai aur `main()` ko dubara call (recursion) karke re-verify karta hai.
 * 4. Key valid hone ke baad `initGraph()` call karke AI chat loop shuru karta hai aur end mein readline interface close karta hai.
 */
async function main() {
    // Local settings file read karke check karte hain ki usme pehle se koi API key stored hai ya nahi
    const settings = await getSettingsFile();

    // Agar settings file mein apiKey nahi milti (pehli baar run karne par), toh user se key input lekar save karte hain
    if (!settings.apiKey) {
        const apiKey = await rl.question("Please enter your API key: ")
        await saveApiKey(apiKey)
    }

    // Saved API key ko Groq endpoint par test karke uski validity check karte hain
    const response = await getApiKey()

    /*
     * API Key Validation & Retry Logic:
     * Agar Groq API key ko reject kar deta hai (`response.error`), toh user ko alert karke
     * terminal se dubara API key maangte hain, usse file mein overwrite/save karte hain,
     * aur `return main()` ke zariye poora check process fir se repeat karte hain jab tak valid key na mil jaye.
     */
    if (response.error) {
        console.error("Invalid OR Expired API key")

        const apiKey = await rl.question("Please enter your API key: ")
        await saveApiKey(apiKey)
        return main()
    }

    // Validated API key fetch karte hain
    const apiKey = await getApiKey()

    // Sab kuch verify hone ke baad LangGraph ka interactive AI chat loop start karte hain
    await initGraph();

    // Chat loop khatam hone par terminal ke readline input stream ko cleanly band karte hain
    rl.close();
}

// `main` function ko default export karte hain taaki CLI entry file (`cli.js`) isse import karke run kar sake
export default main