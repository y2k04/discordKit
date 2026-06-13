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

export async function UpdateProfile(args: Record<string, any>) {
    return RestAPI.patch({
        url: Constants.Endpoints.ME,
        body: args
    });
}

export interface Cache {
    isReady: boolean,
    token: () => string,
    autoproxy: [string, SystemAutoproxySettings][],
    system: System,
    userId: string;
}
