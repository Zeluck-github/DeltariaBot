import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js"
import type CustomClient from "../structures/CustomClient.js"

export default {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with Pong!"),
    async execute(client: CustomClient, interaction: ChatInputCommandInteraction) {
        await interaction.reply("Pong! 🏓")
    },
}
