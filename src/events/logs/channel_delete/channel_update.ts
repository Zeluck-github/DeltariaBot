import type { GuildChannel} from "discord.js"
import { EmbedBuilder} from "discord.js"

import type CustomClient from "../../../structures/CustomClient.js"
import clientConfig from "../../../structures/config.js"
import { lb } from "../../../utils/lb.js"

export default {
    name: "channelUpdate",
    once: false,
    async execute(client: CustomClient, channel: GuildChannel) {

        const embed = new EmbedBuilder()
        //
        // Embed content
        //

        const logChannel = channel.guild.channels.cache.get(clientConfig.LOG_CHANNEL_ID)
        if (logChannel?.isTextBased()) {
            await logChannel.send({
                embeds: [embed],
            })
        }
    },
}
