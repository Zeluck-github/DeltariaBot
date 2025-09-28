import type { Interaction } from "discord.js"
import type CustomClient from "../../structures/CustomClient.js"
import { LogLevel } from "../../structures/CustomClient.js"

export default {
    name: "interactionCreate",
    once: false,
    async execute(client: CustomClient, interaction: Interaction) { 
        if (interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName)

            if (!command) return client.logger(LogLevel.WARN, "InteractionCommand", `Command ${interaction.commandName} not found!`, interaction)

            try {
                await command.execute(client, interaction)
            } catch (error) {
                client.logger(LogLevel.ERROR, "InteractionCommand", `Error while executing command ${interaction.commandName}`, error)
                await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true }).catch(console.error)
            }
        } else if (interaction.isAutocomplete()) {
            const command = client.commands.get(interaction.commandName)

            if (!command || !command.autocomplete) return client.logger(LogLevel.WARN, "InteractionAutocomplete", `Command ${interaction.commandName} not found or does not have an autocomplete method!`, interaction)

            try {
                await command.autocomplete(client, interaction)
            } catch (error) {
                client.logger(LogLevel.ERROR, "InteractionAutocomplete", `Error while executing autocomplete for command ${interaction.commandName}`, error)
                await interaction.respond([{ name: "There was an error while executing this command!", value: "error" }]).catch(console.error)
            }
        }
    },
}
