import { EmbedBuilder, type GuildMember } from "discord.js"
import type CustomClient from "../../structures/CustomClient.js"
import clientConfig from "../../structures/config.js"

export default {
    name: "guildMemberAdd",
    once: false,
    async execute(client: CustomClient, member: GuildMember) {
        
        member.roles.add(clientConfig.ROLE_WELCOME_ID).catch(() => null)

        const embed = new EmbedBuilder()
            .setTitle("🚀 ➤ Nouvelle arrivée")
            .setDescription(`**Bienvenue à <@${member.user.id}> qui a rejoint le discord de Deltaria.**`)
            .setColor(clientConfig.COLOR)
            .setTimestamp()
            .setFooter({ text: "Deltaria - Semi-Rp / Semi-RPG", iconURL: client.user?.displayAvatarURL() })
        const welcomeChannel = member.guild.channels.cache.get(clientConfig.WELCOME_CHANNEL_ID)
        if (welcomeChannel?.isTextBased()) {
            await welcomeChannel.send({
                embeds: [embed],
            })
        }
    },
}
