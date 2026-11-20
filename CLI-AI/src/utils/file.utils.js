import fs from 'fs/promises' // Enables async reading, writing, and managing of files and directories
import { CONFIG_DIR, HOME_DIR } from './constant.js'
import path from "path"
import axios from "axios"

/* Return the content of the settings file (create if it doesnt exist) */
export async function getSettingsFile() {
    /*
     * Verifies that the configuration directory exists.
     * If it is missing, creates the directory (including any
     * required parent folders) so settings files can be saved safely.
     */
    try {
        await fs.access(CONFIG_DIR)
    } catch (err) {
        await fs.mkdir(CONFIG_DIR, { recursive: true })
    }

    // Resolve the full path to the settings.json file inside the config directory
    const settingsFilePath = path.join(CONFIG_DIR, "settings.json")

    /*
     * Attempts to read and parse the existing settings file.
     * If the file does not exist or cannot be read, initializes
     * a new empty JSON settings file and returns an empty object.
     * Load settings from file if it exists; otherwise, create a default empty file and return {}
     */
    try {
        await fs.access(settingsFilePath)
        const content = await fs.readFile(settingsFilePath, 'utf-8')
        return JSON.parse(content)
    } catch (err) {
        await fs.writeFile(settingsFilePath, JSON.stringify({}))
        return {}
    }
}

/*
 * Saves or updates the provided API key in settings.json
 * while preserving all existing configuration properties.
 */
export async function saveApiKey(apiKey) {
    const settingsFilePath = path.join(CONFIG_DIR, "settings.json")

    const settingsContent = await getSettingsFile()
    await fs.writeFile(settingsFilePath, JSON.stringify({
        ...settingsContent,
        apiKey
    }))
}

/*
 * Retrieves the saved API key from settings.json.
 * Returns undefined if no API key has been configured yet.
 */
export async function getApiKey() {
    const settings = await getSettingsFile()
    const apiKey = settings.apiKey

    if (!apiKey) {
        throw new Error("API key not found. Please save your API key first.")
    }

    /*
     * Validates the provided Groq API key by querying the models endpoint.
     * Returns the key object if valid, or a user-friendly error message
     * if the request fails due to an invalid or expired key.
     */
    try {
        const response = await axios.get("https://api.groq.com/openai/v1/models", {
            headers: {
                Authorization: `Bearer ${apiKey}`
            }
        })
        return {
            apiKey
        }
    } catch (err) {
        return {
            error: "Invalid API key"
        }
    }
}