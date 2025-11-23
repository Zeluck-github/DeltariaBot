import { config as dotenvConfig } from "dotenv"
dotenvConfig()

export interface ClientConfig {
    DISCORD_TOKEN: string;
    DISCORD_CLIENT_ID: string;
    DISCORD_GUILD_ID: string;
    LOG_CHANNEL_ID: string;
    WELCOME_CHANNEL_ID: string;
    ROLE_WELCOME_ID: string;
    TICKET_CHANNEL_ID: string;
    TICKET_LOGS_CHANNEL_ID: string;
    TICKET_CATEGORY_ID: string;
    COLOR: `#${string}`;
    [key: string]: string;
}

const clientConfig: ClientConfig = {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN || "",
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID || "",
    DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID || "",
    LOG_CHANNEL_ID: process.env.LOG_CHANNEL_ID || "",
    WELCOME_CHANNEL_ID: process.env.WELCOME_CHANNEL_ID || "",
    ROLE_WELCOME_ID: process.env.ROLE_WELCOME_ID || "",
    TICKET_CHANNEL_ID: process.env.TICKET_CHANNEL_ID || "",
    TICKET_LOGS_CHANNEL_ID: process.env.TICKET_LOGS_CHANNEL_ID || "",
    TICKET_CATEGORY_ID: process.env.TICKET_CATEGORY_ID || "",
    COLOR: (process.env.COLOR as `#${string}`) || "",
}

Object.keys(clientConfig).forEach((key) => {
    if (!clientConfig[key]) throw new Error(`${key} is not defined in the .env file`)
})

export default clientConfig