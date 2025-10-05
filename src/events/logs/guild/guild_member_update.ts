 
import type { GuildMember } from "discord.js"
import { EmbedBuilder } from "discord.js"

import clientConfig from "../../../structures/config.js"
import type CustomClient from "../../../structures/CustomClient.js"
import { lb } from "../../../utils/lb.js"
import { plural } from "../../../utils/plural.js"

const pendingUpdates = new Map<
  string,
  {
    oldMember: GuildMember
    newMember: GuildMember
    timeout: NodeJS.Timeout
  }
>()

export default ({
    name: "guildMemberUpdate",
    once: false,
    async execute(client: CustomClient, oldMember: GuildMember, newMember: GuildMember) {
        if (!oldMember.guild) return

        const memberId = newMember.id
        if (pendingUpdates.has(memberId)) {
            const pending = pendingUpdates.get(memberId)!
            clearTimeout(pending.timeout)
            oldMember = pending.oldMember
        }

        const timeout = setTimeout(async () => {
            const pending = pendingUpdates.get(memberId)
            if (!pending) return
            const { oldMember, newMember } = pending

            const changes: string[] = []

            if (oldMember.nickname !== newMember.nickname) {
                changes.push(
                    `• Surnom: \`${oldMember.nickname ?? "Aucun"}\` → \`${newMember.nickname ?? "Aucun"}\``,
                )
            }
            const oldRoles = oldMember.roles.cache.map((r) => r.id).sort()
            const newRoles = newMember.roles.cache.map((r) => r.id).sort()
            if (JSON.stringify(oldRoles) !== JSON.stringify(newRoles)) {
                const added = newMember.roles.cache.filter((r) => !oldMember.roles.cache.has(r.id))
                const removed = oldMember.roles.cache.filter((r) => !newMember.roles.cache.has(r.id))
                if (added.size > 0) {
                    changes.push(
                        `• ${plural("Rôle ajouté", "Rôles ajoutés", added.size)}: ${added
                            .map((r) => `<@&${r.id}>`)
                            .join(", ")}`,
                    )
                }
                if (removed.size > 0) {
                    changes.push(
                        `• ${plural("Rôle retiré", "Rôles retirés", removed.size)}: ${removed
                            .map((r) => `<@&${r.id}>`)
                            .join(", ")}`,
                    )
                }
            }

            if (changes.length > 0) {
                const embed = new EmbedBuilder()
                    .setAuthor({
                        name: newMember.user.tag,
                        iconURL: newMember.user.avatarURL() ?? undefined,
                    })
                    .setDescription(
                        lb(`Membre mis à jour : ${newMember.toString()}`),
                    )
                    .setColor(clientConfig.COLOR)
                    .addFields(
                        {
                            name: `${plural("Modification", "Modifications", changes.length)} :`,
                            value: lb(...changes),
                            inline: false,
                        },
                        {
                            name: "Détails",
                            value: lb(`Membre ID: \`${newMember.id}\``),
                            inline: false,
                        },
                    )

                const logChannel = newMember.guild.channels.cache.get(clientConfig.LOG_CHANNEL_ID)
                if (logChannel?.isTextBased()) {
                    await logChannel.send({ embeds: [embed] })
                }
            }
            pendingUpdates.delete(memberId)
        }, 1500)

        pendingUpdates.set(memberId, { oldMember, newMember, timeout })
    },
})