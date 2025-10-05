import { EmbedBuilder, type GuildEmoji } from "discord.js"

import type CustomClient from "../../../structures/CustomClient.js"
import clientConfig from "../../../structures/config.js"
import { lb } from "../../../utils/lb.js"

export default {
    name: "emojiDelete",
    once: false,
    async execute(client: CustomClient, emoji: GuildEmoji) {

        const embed = new EmbedBuilder()
        //
        // Embed content
        //

        const logChannel = emoji.guild.channels.cache.get(clientConfig.LOG_CHANNEL_ID)
        if (logChannel?.isTextBased()) {
            await logChannel.send({
                embeds: [embed],
            })
        }
    },
}
