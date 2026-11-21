/**
 * Node.js ke `readline/promises` module ka use karke terminal mein
 * user se input lene aur output dikhane ke liye ek interface (`rl`) setup karta hai.
 *
 * - `input: process.stdin`: Keyboard se user ka type kiya hua input read karta hai.
 * - `output: process.stdout`: Terminal screen par prompts aur messages print karta hai.
 *
 * Isko default export kiya gaya hai taaki doosri files mein `await rl.question()`
 * ke zariye aasaani se user se sawaal pooche ja sakein.
 */
import readline from "readline/promises";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})
export default rl