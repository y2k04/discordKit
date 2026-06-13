/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandOptionType } from "@api/Commands";
import { Command } from "@vencord/discord-types";

import { cache, pk } from ".";
import autoproxy from "./commands/autoproxy";
import system from "./commands/system";
import { CmdArgToDict } from "./utils";

export const commands: Command[] = [
    {
        name: "pk;system",
        description: "System Commands",
        options: [
            {
                name: "id",
                description: "System ID",
                type: ApplicationCommandOptionType.STRING,
                required: false
            }
        ],
        execute: async (args, ctx) => await system(pk, cache, CmdArgToDict(args))
    },
    {
        name: "pk;autoproxy",
        description: "Autoproxy Commands",
        options: [
            {
                name: "mode",
                description: "Autoproxy mode",
                type: ApplicationCommandOptionType.STRING,
                choices: [
                    {
                        name: "Off",
                        label: "",
                        value: "off"
                    },
                    {
                        name: "Front",
                        label: "",
                        value: "front"
                    },
                    {
                        name: "Latch",
                        label: "",
                        value: "latch"
                    }
                ],
                required: false
            },
            {
                name: "member",
                type: ApplicationCommandOptionType.STRING,
                displayName: "member",
                description: "ID or name of a member of your system"
            }
        ],
        execute: async (args, ctx) => await autoproxy(pk, cache, ctx, CmdArgToDict(args))
    }
];
