import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, ModalBuilder, PermissionsBitField, TextInputBuilder, TextInputStyle, UserSelectMenuBuilder } from "discord.js"
import { Buffer } from "node:buffer"
import config from "./config.js"

import type CustomClient from "./CustomClient.js"
import type { ButtonInteraction, CategoryChannel, ModalSubmitInteraction, TextChannel, UserSelectMenuInteraction } from "discord.js"
import clientConfig from "./config.js"

export class TicketManager {
    private client: CustomClient
    private ticketLogsChannel: string
    private ticketChannel: string
    private ticketCategory: string

    public constructor(client: CustomClient) {
        this.client = client
        this.ticketLogsChannel = config.TICKET_LOGS_CHANNEL_ID
        this.ticketChannel = config.TICKET_CHANNEL_ID
        this.ticketCategory = config.TICKET_CATEGORY_ID
    }

    public async createTicketMessage() {
        if(!this.ticketChannel) return console.error("Ticket channel is not initialized.")

        const guild = this.client.guilds.cache.get(config.DISCORD_GUILD_ID)
        if(!guild) return console.error("Guild not found.")

        const channel = guild.channels.cache.get(this.ticketChannel) as TextChannel
        if(!channel) return console.error("Ticket channel not found.")

        const embed = new EmbedBuilder()
            .setTitle("Inscription Équipe")
            .setDescription([
                "Si vous souhaitez inscrire votre équipe pour un événement, cliquez sur le bouton ci-dessous pour créer un ticket d'inscription.",
            ].join("\n"))
            .setColor("#84110F")

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("ticket_open")
                    .setLabel("Inscrire mon équipe")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("🎫"),
            )

        return await channel.send({
            embeds: [embed],
            components: [row],
        }).catch(console.error)
    }

    private async createTranscript(channelId: string) {
        if(!this.ticketLogsChannel) return console.error("Ticket logs channel is not initialized.")

        const guild = this.client.guilds.cache.get(config.DISCORD_GUILD_ID)
        if(!guild) return console.error("Guild not found.")

        const ticketChannel = guild.channels.cache.get(channelId) as TextChannel
        if(!ticketChannel) return console.error("Ticket channel not found.")

        const logsChannel = guild.channels.cache.get(this.ticketLogsChannel) as TextChannel
        if(!logsChannel) return console.error("Ticket logs channel not found.")

        const messages = await ticketChannel.messages.fetch({ limit: 100 })
        const messagesContent = messages.map(message => {
            if (message.attachments.size > 0) {
                return `${message.author.username}: ${message.content} (${message.attachments.map(attachment => attachment.url).join(", ")})`
            }
            if (message.content !== "") return `${message.author.username}: ${message.content}`
        }).join("\n")

        const buffer = Buffer.from(messagesContent, "utf-8")
        const fileAttachment = new AttachmentBuilder(buffer, { name: `ticket-${ticketChannel.name}-${ticketChannel.createdTimestamp}.txt` })
        
        return await logsChannel.send({
            content: `Transcription du ticket ${ticketChannel.name} (${ticketChannel.id})`,
            files: [fileAttachment],
        }).catch(console.error)
    }

    public async createTicket(interaction: ModalSubmitInteraction) {
        await interaction.deferReply({ ephemeral: true })
        if(!this.ticketCategory) return console.error("Ticket category is not initialized.")

        const guild = this.client.guilds.cache.get(config.DISCORD_GUILD_ID)
        if(!guild) return console.error("Guild not found.")

        const categoryTicket = guild.channels.cache.get(this.ticketCategory) as CategoryChannel
        if(!categoryTicket) return console.error("Ticket category not found.")

        const channelExist = categoryTicket.children.cache
            .filter(channel => channel.type === ChannelType.GuildText)
            .find(channel => channel.topic === interaction.user.id)

        if(channelExist) return interaction.followUp({ content: "Vous avez déjà un ticket ouvert." })

        const teamName = interaction.fields.getTextInputValue("inscription_equipe")
        const teamTag = interaction.fields.getTextInputValue("inscription_tag")
        const teamColor = interaction.fields.getTextInputValue("inscription_couleur")
        const teamMembers = interaction.fields.getTextInputValue("inscription_members")

        const ticketChannel = await guild.channels.create({
            name: `🎫-${teamName}`,
            type: ChannelType.GuildText,
            topic: interaction.user.id,
            parent: categoryTicket,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: interaction.user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                },
            ],
        })
        if(!ticketChannel) return console.error("Ticket channel not created.")

        const embed = new EmbedBuilder()
            .setTitle("🎫 Inscription Équipe")
            .setDescription([
                `Demande d'inscription par <@${interaction.user.id}> (${interaction.user.id})`,
                `**Nom de l'équipe :** \`${teamName}\``,
                teamTag ? `**TAG :** \`${teamTag}\`` : "",
                `**Couleur :** \`${teamColor}\``,
                `**Membres :**\n\`\`\`\n${teamMembers}\n\`\`\``,
                "",
                "*Un membre du staff vous répondra dès que possible.*",
            ].filter(line => line !== "").join("\n"))
            .setColor("#84110F")
            .setTimestamp()

        const selectRow = new ActionRowBuilder<UserSelectMenuBuilder>()
            .addComponents(
                new UserSelectMenuBuilder()
                    .setCustomId("ticket_user")
                    .setPlaceholder("Ajouter les membres de l'équipe au ticket")
                    .setMinValues(0)
                    .setMaxValues(5),
            )

        const buttonRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("ticket_close")
                    .setLabel("Fermer le ticket")
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji("🔒"),
                new ButtonBuilder()
                    .setCustomId("ticket_transcript")
                    .setLabel("Créer une transcription")
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji("📜"),
            )

        await ticketChannel.send({ 
            embeds: [embed], 
            components: [selectRow, buttonRow],
        })
        await interaction.followUp({ content: `Ticket créé : ${ticketChannel}` })
    }

    public async openTicketTrigger(interaction: ButtonInteraction) {
        const modal = new ModalBuilder()
            .setCustomId("ticket_modal")
            .setTitle("Inscription équipe")
            .addComponents(
                new ActionRowBuilder<TextInputBuilder>()
                    .addComponents(
                        new TextInputBuilder()
                            .setCustomId("inscription_equipe")
                            .setLabel("Nom")
                            .setPlaceholder("Nom de votre équipe")
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                            .setMaxLength(100),
                    ),
                new ActionRowBuilder<TextInputBuilder>()
                    .addComponents(
                        new TextInputBuilder()
                            .setCustomId("inscription_tag")
                            .setLabel("TAG")
                            .setPlaceholder("TAG de votre équipe")
                            .setStyle(TextInputStyle.Short)
                            .setRequired(false)
                            .setMaxLength(1000),
                    ),
                new ActionRowBuilder<TextInputBuilder>()
                    .addComponents(
                        new TextInputBuilder()
                            .setCustomId("inscription_couleur")
                            .setLabel("Couleur")
                            .setPlaceholder("Couleur de votre équipe (ex: #FF0000)")
                            .setStyle(TextInputStyle.Short)
                            .setRequired(true)
                            .setMaxLength(2000),
                    ),
                new ActionRowBuilder<TextInputBuilder>()
                    .addComponents(
                        new TextInputBuilder()
                            .setCustomId("inscription_members")
                            .setLabel("Pseudo Minecraft des membres de l'équipe")
                            .setPlaceholder("Zeluck_ , tonykun7 , Riveur , ...")
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                            .setMaxLength(4000),
                    ), 
            )

        return await interaction.showModal(modal)
    }

    public async closeTicketTrigger(interaction: ButtonInteraction) {
        await interaction.deferReply({ ephemeral: true })
        if(!this.ticketCategory) return console.error("Ticket category is not initialized.")
        if(!this.ticketLogsChannel) return console.error("Ticket logs channel is not initialized.")

        const guild = this.client.guilds.cache.get(config.DISCORD_GUILD_ID)
        if(!guild) return console.error("Guild not found.")

        const ticketChannel = guild.channels.cache.get(interaction.channelId) as TextChannel
        if(!ticketChannel) return interaction.followUp({ content: "Le ticket n'existe pas." })

        const logsChannel = guild.channels.cache.get(this.ticketLogsChannel) as TextChannel
        if(!logsChannel) return interaction.followUp({ content: "Le channel de logs n'existe pas." })

        if(!interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageMessages)) return interaction.followUp({ content: "Vous n'avez pas la permission de fermer ce ticket." })

        await this.createTranscript(ticketChannel.id).catch(console.error)
        return await ticketChannel.delete()
    }

    public async transcriptTicketTrigger(interaction: ButtonInteraction) {
        await interaction.deferReply({ ephemeral: true })
        if(!this.ticketLogsChannel) return console.error("Ticket logs channel is not initialized.")

        if(!interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageMessages)) return interaction.followUp({ content: "Vous n'avez pas la permission de créer une transcription." })

        const guild = this.client.guilds.cache.get(config.DISCORD_GUILD_ID)
        if(!guild) return console.error("Guild not found.")

        const ticketChannel = guild.channels.cache.get(interaction.channelId) as TextChannel
        if(!ticketChannel) return interaction.followUp({ content: "Le ticket n'existe pas." })

        const logsChannel = guild.channels.cache.get(this.ticketLogsChannel) as TextChannel
        if(!logsChannel) return interaction.followUp({ content: "Le channel de logs n'existe pas." })

        await this.createTranscript(ticketChannel.id).catch(console.error)

        return await interaction.followUp({ content: "Transcription créée." }).catch(console.error)
    }

    public async ticketMembersManagmentTrigger(interaction: UserSelectMenuInteraction) {
        await interaction.deferReply({ ephemeral: true })
        if(!this.ticketCategory) return console.error("Ticket category is not initialized.")
        if(!this.ticketLogsChannel) return console.error("Ticket logs channel is not initialized.")

        const guild = this.client.guilds.cache.get(config.DISCORD_GUILD_ID)
        if(!guild) return console.error("Guild not found.")

        const ticketChannel = guild.channels.cache.get(interaction.channelId) as TextChannel
        if(!ticketChannel) return interaction.followUp({ content: "Le ticket n'existe pas." })

        if(!interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageMessages)) return interaction.followUp({ content: "Vous n'avez pas la permission de gérer les utilisateurs de ce ticket." })

        const users = interaction.values.map(userId => guild.members.cache.get(userId))
        if(!users) return interaction.followUp({ content: "Les utilisateurs n'existent pas." })

        let removedUsers = []
        let addedUsers = []

        for(const user of users) {
            if(!user) continue
            if(ticketChannel.permissionOverwrites.cache.has(user.id)) {
                removedUsers.push(user.id)
                await ticketChannel.permissionOverwrites.edit(user.id, { ViewChannel: false }).catch(console.error)
            } else {
                addedUsers.push(user.id)
                await ticketChannel.permissionOverwrites.edit(user.id, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true,
                }).catch(console.error)
            }
        }

        if(removedUsers.length > 0) {
            const removedUsersMentions = removedUsers.map(userId => `<@${userId}>`).join(", ")
            if (removedUsersMentions.length == 1) await ticketChannel.send({ content: `L'utilisateur suivant a été retiré du ticket : ${removedUsersMentions}` }).catch(console.error)
            else if (removedUsersMentions.length > 1) await ticketChannel.send({ content: `Les utilisateurs suivants ont été retirés du ticket : ${removedUsersMentions}` }).catch(console.error)
        }

        if(addedUsers.length > 0) {
            const addedUsersMentions = addedUsers.map(userId => `<@${userId}>`).join(", ")
            if (addedUsersMentions.length == 1) await ticketChannel.send({ content: `L'utilisateur suivant a été ajouté au ticket : ${addedUsersMentions}` }).catch(console.error)
            else if (addedUsersMentions.length > 1) await ticketChannel.send({ content: `Les utilisateurs suivants ont été ajoutés au ticket : ${addedUsersMentions}` }).catch(console.error)
        }

        await interaction.followUp({ content: "Les utilisateurs ont été ajoutés ou retirés du ticket." }).catch(console.error)
    }

    public async validateTeam(interaction: ModalSubmitInteraction) {
        await interaction.deferReply({ ephemeral: false })

        const guild = this.client.guilds.cache.get(config.DISCORD_GUILD_ID)
        if(!guild) return console.error("Guild not found.")

        const teamName = interaction.fields.getTextInputValue("team_name")
        const teamTag = interaction.fields.getTextInputValue("team_tag")
        const teamColor = interaction.fields.getTextInputValue("team_color")

        const colorRegex = /^#[0-9A-F]{6}$/i
        if (!colorRegex.test(teamColor)) {
            return interaction.followUp({ 
                content: "❌ Le format de couleur est invalide. Utilisez le format hexadécimal (ex: #FF0000)", 
                ephemeral: true,
            })
        }

        const roleName = teamTag ? teamTag : teamName
        const role = await guild.roles.create({
            name: roleName,
            color: teamColor as `#${string}`,
            mentionable: true,
        }).catch(console.error)

        if (!role) {
            return interaction.followUp({ 
                content: "❌ Erreur lors de la création du rôle.", 
                ephemeral: true,
            })
        }

        const categoryName = teamTag ? `${teamTag} - ${teamName}` : teamName
        const category = await guild.channels.create({
            name: categoryName,
            type: ChannelType.GuildCategory,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: role.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.Connect,
                        PermissionsBitField.Flags.Speak,
                    ],
                },
            ],
        }).catch(console.error)

        if (!category) {
            return interaction.followUp({ 
                content: "❌ Erreur lors de la création de la catégorie.", 
                ephemeral: true,
            })
        }

        const textChannel = await guild.channels.create({
            name: teamTag ? `💬-${teamTag.toLowerCase()}` : `💬-${teamName.toLowerCase()}`,
            type: ChannelType.GuildText,
            parent: category,
        }).catch(console.error)

        const voiceChannel = await guild.channels.create({
            name: teamTag ? `🔊 ${teamTag}` : `🔊 ${teamName}`,
            type: ChannelType.GuildVoice,
            parent: category,
        }).catch(console.error)

        const embed = new EmbedBuilder()
            .setTitle("✅ Équipe Validée")
            .setDescription([
                `L'équipe a été validée par <@${interaction.user.id}>`,
                "",
                `**Nom de l'équipe :** \`${teamName}\``,
                teamTag ? `**TAG :** \`${teamTag}\`` : "",
                `**Couleur :** \`${teamColor}\``,
                `**Rôle créé :** ${role}`,
                "",
                "**Salons créés :**",
                textChannel ? `📝 Salon textuel : ${textChannel}` : "",
                voiceChannel ? `🔊 Salon vocal : ${voiceChannel}` : "",
            ].filter(line => line !== "").join("\n"))
            .setColor(teamColor as `#${string}`)
            .setTimestamp()

        await interaction.followUp({ embeds: [embed] })
    }
}