import { ShardingManager } from "discord.js"
import { config } from "dotenv"
config()

const manager = new ShardingManager("./build/index.js", {
    token: process.env.DISCORD_TOKEN,
    totalShards: "auto",
})

manager.on("shardCreate", shard => console.log(`Launched shard ${shard.id}`))

void manager.spawn()