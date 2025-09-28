import { REST, Routes } from "discord.js"
import { config } from "dotenv"
import fs from "fs"
import path from "path"
import { fileURLToPath, pathToFileURL } from "url"

config()

const _filename = fileURLToPath(import.meta.url)
const _dirname = path.dirname(_filename)

const commands: any[] = []
const commandsPath = path.join(_dirname, "commands")

const loadCommandsRecursively = async(dir: string) => {
    const files = fs.readdirSync(dir)

    for (const file of files) {
        const filePath = path.join(dir, file)
        const stat = fs.statSync(filePath)

        if (stat.isDirectory()) {
            await loadCommandsRecursively(filePath)
        } else if (file.endsWith(".ts") || file.endsWith(".js")) {
            const fileUrl = pathToFileURL(filePath).href
            await import(fileUrl).then((commandModule) => {
                const command = commandModule.default

                if ("data" in command && "execute" in command) {
                    commands.push(command.data.toJSON())
                }
            }).catch((err) => {
                console.error(`Failed to load command ${file}:`, err)
            })
        }
    }
}

await loadCommandsRecursively(commandsPath)

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!)

void (async () => {
    try {
        console.log("Suppression de toutes les commandes globales existantes...")

        await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!), {
            body: [],
        })
        console.log("Toutes les commandes globales ont été supprimées.")

        console.log("Déploiement des nouvelles commandes...")

        await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!), {
            body: commands,
        })

        console.log("Commandes globales déployées avec succès.")
    } catch (error) {
        console.error("Erreur lors du déploiement des commandes:", error)
    }
})()
