import {
    SlashCommandBuilder,
    PermissionFlagsBits,
    type ChatInputCommandInteraction,
    type GuildMember,
} from "discord.js"
import type CustomClient from "../../structures/CustomClient.js"

export default {
    data: new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Expulse un membre du serveur.")
        .addUserOption(option =>
            option
                .setName("membre")
                .setDescription("Le membre à expulser.")
                .setRequired(true),
        )
        .addStringOption(option =>
            option
                .setName("raison")
                .setDescription("La raison de l'expulsion."),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
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

        const failureResponse = (() => {
            switch (true) {
                case !target:
                    return {
                        content: "Impossible de trouver ce membre sur le serveur.",
                        ephemeral: true,
                    }
                case !!target && target.id === executor.id:
                    return {
                        content: "Tu ne peux pas t'expulser toi-même.",
                        ephemeral: true,
                    }
                case !!target && target.id === interaction.client.user?.id:
                    return {
                        content: "Je ne peux pas m'expulser moi-même.",
                        ephemeral: true,
                    }
                case !!target && executor.roles.highest.comparePositionTo(target.roles.highest) <= 0 &&
                    interaction.guild.ownerId !== executor.id:
                    return {
                        content: "Tu ne peux pas expulser un membre ayant un rôle supérieur ou égal au tien.",
                        ephemeral: true,
                    }
                case !me?.permissions.has(PermissionFlagsBits.KickMembers):
                    return {
                        content: "Je n'ai pas la permission d'expulser des membres.",
                        ephemeral: true,
                    }
                case !!target && me && target.roles.highest.comparePositionTo(me.roles.highest) >= 0:
                    return {
                        content: "Je ne peux pas expulser ce membre car son rôle est trop élevé.",
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

        const memberToKick = target as GuildMember
        const reason = interaction.options.getString("raison") ?? "Aucune raison fournie."

        try {
            await memberToKick.kick(reason)
            await interaction.reply({
                content: `${memberToKick.user.tag} a été expulsé. Raison : ${reason}`,
            })
        } catch (error) {
            await interaction.reply({
                content: "Une erreur est survenue lors de l'expulsion de ce membre.",
                ephemeral: true,
            })
        }
    },
}