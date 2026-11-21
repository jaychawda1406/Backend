import { tool } from "langchain"
import * as z from "zod"
import fs from "fs/promises"

// Ek custom LangChain tool define kar rahe hain jo ek saath multiple files create ya update (upsert) kar sakta hai
export const upsertFiles = tool(
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
});

/**
 * Tool Name: listFiles
 * Purpose: Kisi diye gaye folder ke andar maujood sabhi files ki list nikalne ke liye (sub-folders ke andar jaakar bhi).
 * Working: Yeh recursion ka use karke folder aur uske sub-folders ko scan karta hai, 
 *          `node_modules` jaise heavy folders ko skip karta hai, aur sabhi files ke 
 *          full paths ki list ko JSON string ke roop mein return karta hai.
 */
export const listFiles = tool(
    async function ({ folder }) {
        // Sabhi mili hui files ke full paths is array mein store honge
        const results = []

        // Recursive helper function jo folder ke andar ke sub-folders ko bhi check karega
        async function traverse(currentFolder) {
            // `withFileTypes: true` se humein naam ke saath yeh bhi pata chalta hai ki item file hai ya folder
            const entries = await fs.readdir(currentFolder, { withFileTypes: true })

            for (const entry of entries) {
                // Current folder aur item ke naam ko jodkar poora path banaya
                const fullPath = `${currentFolder}/${entry.name}`

                // Check kar rahe hain ki kya yeh item ek folder (directory) hai
                if (entry.isDirectory()) {
                    // Agar folder `node_modules` hai toh use ignore karke aage badh jao
                    if (entry.name === "node_modules") continue

                    // Agar koi aur folder hai toh uske andar ki files dhoondhne ke liye function ko dobara call (recursion) karo
                    await traverse(fullPath)
                } else {
                    // Agar yeh ek normal file hai toh iska path `results` array mein daal do
                    results.push(fullPath)
                }
            }
        }

        // Main folder se scanning shuru kar rahe hain
        await traverse(folder)

        // LangChain tool output ke liye array ko JSON string mein convert karke return kiya
        return JSON.stringify(results)
    },
    {
        name: "listFiles", // Tool ka unique naam jisse AI ise call karega
        description: "List all the folder (recursively) and files in the current folder (ignore folders like node_modules)", // AI ko batane ke liye ki yeh tool kab use karna hai

        // Zod schema: AI ko is tool ko call karte waqt folder ka absolute path dena zaroori hai
        schema: z.object({
            folder: z.string().describe("absolute path of the folder to list")
        })
    }
)


/**
 * Tool Name: readFiles
 * Purpose: Ek hi baar mein multiple files ka data (content) read karne ke liye.
 * Working: Yeh AI se file paths ki ek list (array) leta hai, sabhi files ko ek saath 
 *          (parallel) read karta hai, aur unka path + content JSON string mein return karta hai.
 */
export const readFiles = tool(
    async function ({ files }) {
        // Promise.all ka use karke sabhi files ko ek saath (parallel) read kar rahe hain taaki time bache
        const results = await Promise.all(
            files.map(async (file) => {
                // Diye gaye path se file ka text content UTF-8 format mein read kar rahe hain
                const content = await fs.readFile(file.path, "utf-8");
                return { path: file.path, content };
            })
        );

        // LangChain tools string return karte hain, isliye results array ko JSON string mein convert kiya hai
        return JSON.stringify(results);
    },
    {
        name: "readFiles", // Tool ka unique naam jisse AI ise pehchanega
        description: "Read the content of multiple files at once", // AI ko batane ke liye ki yeh tool kab use karna hai

        // Zod schema: Yeh define karta hai ki AI ko is tool mein kis format mein input bhejna hai
        schema: z.object({
            files: z.array(
                z.object({
                    path: z.string().describe("absolute path of the file to be read"), // Har file ka poora (absolute) path zaroori hai
                })
            ),
        }),
    }
);