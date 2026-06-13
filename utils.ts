/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { CommandArgument } from "@vencord/discord-types";
import { Constants, RestAPI } from "@webpack/common";

import { System, SystemAutoproxySettings } from "./PluralKit";

export function CmdArgToDict(args: CommandArgument[]): Record<string, any> {
    return Object.fromEntries(args.map(v => [v.name, v.value]));
}

export async function UpdateMainProfile(args: Record<string, any>) {
    return RestAPI.patch({
        url: Constants.Endpoints.ME,
        body: args
    });
}

export async function UpdateGuildProfile(guild_id: string, args: Record<string, any>) {
    return RestAPI.patch({
        url: `/guilds/${guild_id}/members/@me`,
        body: args,
        oldFormErrors: true
    });
}

export interface PKCache {
    autoproxy: [string, SystemAutoproxySettings][],
    system: System,
    userId: string;
}
