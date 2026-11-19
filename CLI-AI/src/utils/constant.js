import os from "os"
import path from "path"

export const HOME_DIR = os.homedir() // user/jaychawda
export const CONFIG_DIR = path.join(HOME_DIR, ".beta") // user/jaychawda/.beta