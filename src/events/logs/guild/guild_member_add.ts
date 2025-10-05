import { EmbedBuilder, type GuildMember } from "discord.js"
import type CustomClient from "../../../structures/CustomClient.js"
import clientConfig from "../../../structures/config.js"

export default {
    name: "guildMemberAdd",
    once: false,
    async execute(client: CustomClient, member: GuildMember) {
        const embed = new EmbedBuilder()
            .setAuthor({
                name: member.user.tag,
                iconURL: member.user.displayAvatarURL() ?? undefined,
            })
            .setDescription(`${member.toString()} Vient de rejoindre`)
            .setColor(clientConfig.COLOR)
        const logChannel = member.guild.channels.cache.get(clientConfig.LOG_CHANNEL_ID)
        if (logChannel?.isTextBased()) {
            await logChannel.send({
                embeds: [embed],
            })
        }
    },
}
