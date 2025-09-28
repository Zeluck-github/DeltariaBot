import type { ClientOptions, SlashCommandBuilder, CommandInteraction, AutocompleteInteraction, Message } from "discord.js"
import { Client } from "discord.js"
import path from "path"
import fs from "fs"
import { fileURLToPath, pathToFileURL } from "url"
import chalk from "chalk"

const _filename = fileURLToPath(import.meta.url)
const _dirname = path.dirname(_filename)

interface Command {
    data: SlashCommandBuilder;
    execute: (client: CustomClient, interaction: CommandInteraction) => Promise<void>;
    autocomplete?: (client: CustomClient, interaction: AutocompleteInteraction) => Promise<void>;
    messageExecute?: (client: CustomClient, message: Message, args: string[]) => Promise<void>;
}

interface Event {
    name: string;
    once?: boolean;
    execute: (client: CustomClient, ...args: any[]) => void;
}

export enum LogLevel {
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR",
    DEBUG = "DEBUG",
    CUSTOM = "CUSTOM"
}

class CustomClient extends Client {
    public commands: Map<string, Command>
    public cooldowns: Map<string, Map<string, number>>

    public constructor(options: ClientOptions) {
        super(options)
        this.commands = new Map()
        this.cooldowns = new Map()
    }

    public logger(level: LogLevel, prefix: string, message: string, ...optionalParams: any[]): void {
        const timestamp = new Date().toISOString()
        let formattedMessage = ""

        switch (level) {
            case LogLevel.INFO:
                formattedMessage = `${chalk.blue(`[${timestamp}] [${prefix}]`)} ${message}`
                break
            case LogLevel.WARN:
                formattedMessage = `${chalk.yellow(`[${timestamp}] [${prefix}]`)} ${message}`
                break
            case LogLevel.ERROR:
                formattedMessage = `${chalk.red(`[${timestamp}] [${prefix}]`)} ${message}`
                break
            case LogLevel.DEBUG:
                formattedMessage = `${chalk.green(`[${timestamp}] [${prefix}]`)} ${message}`
                break
            case LogLevel.CUSTOM:
                formattedMessage = `[${timestamp}] [${prefix}] ${message}`
                break
            default:
                formattedMessage = `[${timestamp}] [${prefix}] ${message}`
                break
        }

        console.log(formattedMessage, ...optionalParams)
    }

    public async loadCommands(): Promise<void> {
        const commandPath = path.join(_dirname, "../commands")

        const loadCommandsRecursively = (dir: string) => {
            const files = fs.readdirSync(dir)

            for (const file of files) {
                const filePath = path.join(dir, file)
                const stat = fs.statSync(filePath)

                if (stat.isDirectory()) {
                    loadCommandsRecursively(filePath)
                } else if (file.endsWith(".js") || file.endsWith(".ts")) {
                    const commandURL = pathToFileURL(filePath).href
                    import(commandURL).then((commandModule) => {
                        if (commandModule && commandModule.default) {
                            const command = commandModule.default as Command
                            this.commands.set(command.data.name, command)
                            this.logger(LogLevel.INFO, "Commands", `Loaded command: ${command.data.name}`)
                        } else {
                            this.logger(LogLevel.WARN, "Commands", `Command module at ${filePath} has no default export.`)
                        }
                    }).catch((err) => {
                        this.logger(LogLevel.ERROR, "Commands", `Failed to load command ${file}:`, err)
                    })
                }
            }
        }

        loadCommandsRecursively(commandPath)
    }

    public async loadEvents(): Promise<void> {
        const eventPath = path.join(_dirname, "../events")

        const loadEventsRecursively = (dir: string) => {
            const files = fs.readdirSync(dir)

            for (const file of files) {
                const filePath = path.join(dir, file)
                const stat = fs.statSync(filePath)

                if (stat.isDirectory()) {
                    loadEventsRecursively(filePath)
                } else if (file.endsWith(".js") || file.endsWith(".ts")) {
                    const eventURL = pathToFileURL(filePath).href
                    import(eventURL).then((eventModule) => {
                        if (eventModule && eventModule.default) {
                            const event = eventModule.default as Event
                            if (event.once) {
                                this.once(event.name, (...args) => event.execute(this as CustomClient, ...args))
                            } else {
                                this.on(event.name, (...args) => event.execute(this as CustomClient, ...args))
                            }
                            this.logger(LogLevel.INFO, "Events", `Loaded event: ${event.name}`)
                        } else {
                            this.logger(LogLevel.WARN, "Events", `Event module at ${filePath} has no default export.`)
                        }
                    }).catch((err) => {
                        this.logger(LogLevel.ERROR, "Events", `Failed to load event ${file}:`, err)
                    })
                }
            }
        }

        loadEventsRecursively(eventPath)
    }

    public init(token: string): void {
        this.loadCommands().catch((err) => this.logger(LogLevel.ERROR, "Init", "Failed to load commands:", err))
        this.loadEvents().catch((err) => this.logger(LogLevel.ERROR, "Init", "Failed to load events:", err))
        this.login(token).catch((err) => this.logger(LogLevel.ERROR, "Init", "Failed to login:", err))
    }
}

export default CustomClient
