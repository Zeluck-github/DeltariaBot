import { PermissionFlagsBits, SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js"
import type CustomClient from "../structures/CustomClient.js"
import { TicketManager } from "../structures/Ticket.js"

export default {
    data: new SlashCommandBuilder()
        .setName("ticket")
        .setDescription("Creates embed for ticket system")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(client: CustomClient, interaction: ChatInputCommandInteraction) {
        const ticketManager = new TicketManager(client)
        
        await ticketManager.createTicketMessage()
        await interaction.reply({ content: "Le message du système de ticket a été créé avec succès !", ephemeral: true })
    },
}
