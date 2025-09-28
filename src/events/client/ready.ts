import type CustomClient from "../../structures/CustomClient.js"
import { LogLevel } from "../../structures/CustomClient.js"

export default {
    name: "ready",
    once: true,
    execute(client: CustomClient) {
        
        client.logger(LogLevel.INFO, "Client", `Logged in as ${client.user?.tag}!`)
    },
}