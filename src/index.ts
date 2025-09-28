import { GatewayIntentBits } from "discord.js"
import CustomClient from "./structures/CustomClient.js"
import config from "./structures/config.js"

const client = new CustomClient({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
    ],
})

client.commands = new Map()

client.init(config.DISCORD_TOKEN)