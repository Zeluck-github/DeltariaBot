import { PermissionFlagsBits, SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, type ChatInputCommandInteraction } from "discord.js"
import type CustomClient from "../../structures/CustomClient.js"

export default {
    data: new SlashCommandBuilder()
        .setName("validate-team")
        .setDescription("Valider une équipe avec ses informations (nom, tag, couleur)")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(client: CustomClient, interaction: ChatInputCommandInteraction) {
        const modal = new ModalBuilder()
            .setCustomId("validate_team_modal")
            .setTitle("Validation d'équipe")
            .addComponents(
                new ActionRowBuilder<TextInputBuilder>()
                    .addComponents(
                        new TextInputBuilder()
                            .setCustomId("team_name")
                            .setLabel("Nom de l'équipe")
                            .setPlaceholder("Entrez le nom de l'équipe")
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                            .setMaxLength(100),
                    ),
                new ActionRowBuilder<TextInputBuilder>()
                    .addComponents(
                        new TextInputBuilder()
                            .setCustomId("team_tag")
                            .setLabel("TAG de l'équipe")
                            .setPlaceholder("Entrez le TAG de l'équipe")
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                            .setMaxLength(50),
                    ),
                new ActionRowBuilder<TextInputBuilder>()
                    .addComponents(
                        new TextInputBuilder()
                            .setCustomId("team_color")
                            .setLabel("Couleur de l'équipe")
                            .setPlaceholder("Format hexadécimal (ex: #FF0000)")
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                            .setMaxLength(7),
                    ),
            )

        await interaction.showModal(modal)
    },
}
