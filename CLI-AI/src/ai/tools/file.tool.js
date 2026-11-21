import { tool } from "langchain"
import * as z from "zod"
import fs from "fs/promises"

// Ek custom LangChain tool define kar rahe hain jo ek saath multiple files create ya update (upsert) kar sakta hai
export const upsertFilesTool = tool(
    // Tool ka main logic: files array ko receive karke sabhi files ko disk par write karta hai
    async function ({ files }) {
        // Promise.all ka use karke saari files ko parallelly (ek saath) write kar rahe hain
        await Promise.all(files.map(async file => {
            return await fs.writeFile(file.path, file.content)
        }))
        // Execution complete hone par AI model ko confirmation message return kar rahe hain
        return "file created successfully"
    }, {
    name: "upsertFiles", // Tool ka unique naam jo model identify karega
    description: "Create/Update multiple files at once (create one if not existed)", // Model ko batane ke liye ki yeh tool kab use karna hai
    // Zod schema jo validate karta hai ki model sahi format mein 'files' array (path aur content ke saath) pass kare
    schema: z.object({
        files: z.array(z.object({
            path: z.string().describe("absolute path of the file to be created/update"),
            content: z.string().describe("content of the file to be created/update")
        }))
    })
}
);