import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    type ChatInputCommandInteraction,
    type GuildMember,
} from "discord.js"

import type CustomClient from "../../structures/CustomClient.js"

const MAX_TIMEOUT_MINUTES = 28 * 24 * 60 // 28 days

export default {
    data: new SlashCommandBuilder()
        .setName("timeout")
        .setDescription("Réduit un membre au silence pendant une durée donnée.")
        .addUserOption((option) =>
            option
                .setName("membre")
                .setDescription("Le membre à mettre en timeout.")
                .setRequired(true),
        )
        .addIntegerOption((option) =>
            option
                .setName("duree")
                .setDescription("Durée du timeout en minutes (1 à 40320).")
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(MAX_TIMEOUT_MINUTES),
        )
        .addStringOption((option) =>
            option
                .setName("raison")
                .setDescription("La raison du timeout."),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false),
    async execute(client: CustomClient, interaction: ChatInputCommandInteraction) {
        if (!interaction.inCachedGuild()) {
            await interaction.reply({
                content: "Cette commande ne peut être utilisée que dans un serveur.",
                ephemeral: true,
            })
            return
        }

        const executor = interaction.member as GuildMember
        const target = interaction.options.getMember("membre") as GuildMember | null
        const me = interaction.guild.members.me
        const durationMinutes = interaction.options.getInteger("duree") ?? 0

        const failureResponse = (() => {
            switch (true) {
                case !target:
                    return {
                        content: "Impossible de trouver ce membre sur le serveur.",
                        ephemeral: true,
                    }
                case !!target && target.id === executor.id:
                    return {
                        content: "Tu ne peux pas te mettre toi-même en timeout.",
                        ephemeral: true,
                    }
                case !!target && target.id === interaction.client.user?.id:
                    return {
                        content: "Je ne peux pas me mettre en timeout moi-même.",
                        ephemeral: true,
                    }
                case !Number.isFinite(durationMinutes) || durationMinutes <= 0:
                    return {
                        content: "La durée du timeout doit être un nombre positif.",
                        ephemeral: true,
                    }
                case durationMinutes > MAX_TIMEOUT_MINUTES:
                    return {
                        content: "La durée maximale d'un timeout est de 28 jours (40320 minutes).",
                        ephemeral: true,
                    }
                case !!target && executor.roles.highest.comparePositionTo(target.roles.highest) <= 0 &&
                    interaction.guild.ownerId !== executor.id:
                    return {
                        content: "Tu ne peux pas mettre en timeout un membre ayant un rôle supérieur ou égal au tien.",
                        ephemeral: true,
                    }
                case !me?.permissions.has(PermissionFlagsBits.ModerateMembers):
                    return {
                        content: "Je n'ai pas la permission de mettre des membres en timeout.",
                        ephemeral: true,
                    }
                case !!target && me && target.roles.highest.comparePositionTo(me.roles.highest) >= 0:
                    return {
                        content: "Je ne peux pas mettre ce membre en timeout car son rôle est trop élevé.",
                        ephemeral: true,
                    }
                case !!target && !target.moderatable:
                    return {
                        content: "Je ne peux pas mettre ce membre en timeout.",
                        ephemeral: true,
                    }
                case !!target && target.communicationDisabledUntilTimestamp &&
                    target.communicationDisabledUntilTimestamp > Date.now():
                    return {
                        content: "Ce membre est déjà en timeout.",
                        ephemeral: true,
                    }
                default:
                    return null
            }
        })()

        if (failureResponse) {
            await interaction.reply(failureResponse)
            return
        }

        const memberToTimeout = target as GuildMember
        const reason = interaction.options.getString("raison") ?? "Aucune raison fournie."
        const durationMs = durationMinutes * 60 * 1000

        try {
            await memberToTimeout.timeout(durationMs, reason)
            await interaction.reply({
                content: `${memberToTimeout.user.tag} a été mis en timeout pour ${durationMinutes} minute(s). Raison : ${reason}`,
            })
        } catch (error) {
            await interaction.reply({
                content: "Une erreur est survenue lors de la mise en timeout de ce membre.",
                ephemeral: true,
            })
        }
    },
}
