/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { CommandContext, CommandReturnValue } from "@vencord/discord-types";

import PluralKit, { AutoproxyMode } from "../PluralKit";
import { Cache, UpdateProfile } from "../utils";

export default async function (pk: PluralKit, cache: Cache, ctx: CommandContext, args: Record<string, any>): Promise<CommandReturnValue> {
    if (cache.isReady)
        return {
            content: await (
                args.mode ? mode(pk, cache, ctx, args) :
                    args.member ? member(pk, cache, ctx, args) :
                        _default(pk, cache, ctx)
            )
        };
    return { content: "DiscordKit is not ready." };
}

async function mode(pk: PluralKit, cache: Cache, ctx: CommandContext, args: Record<string, any>): Promise<string> {
    const request = await pk.setAutoproxy(null, cache, ctx.guild, args.mode);
    if (request === false) return "Autoproxy settings unchanged.";

    switch (args.mode) {
        case "off":
            await UpdateProfile({
                bio: cache.system.description ?? "",
                "global_name": cache.system.name,
                "banner_color": `#${cache.system.color ?? ""}`
            });
            break;
    }

    return `Autoproxy mode set to ${args.mode}.`;
}

async function member(pk: PluralKit, cache: Cache, ctx: CommandContext, args: Record<string, any>): Promise<string> {
    const member = cache.system.members.find(e => e.name === args.member || e.id === args.member);
    if (!member) return `Could not find "${args.member}" in system.`;

    const request = await pk.setAutoproxy(member, cache, ctx.guild);
    if (request === false) return "Autoproxy settings unchanged.";

    const update = await UpdateProfile({
        "bio": member.description ?? "",
        "global_name": member.name,
        "banner_color": `#${member.color ?? ""}`
    }).then(r => `Autoproxy set to ${member.name} (${member.id})`).catch(e => e.message);

    return update;
}

async function _default(pk: PluralKit, cache: Cache, ctx: CommandContext): Promise<string> {
    if (ctx.guild !== undefined) {
        let data = cache.autoproxy.find(e => e[0] === ctx.guild?.id);
        if (data === undefined) {
            const tmp = await pk.getAutoproxySettings(ctx.guild.id, cache.token());
            cache.autoproxy.push([ctx.guild.id, tmp]);
            data = cache.autoproxy.find(e => e[0] === ctx.guild?.id);
            if (data === undefined)
                return `Failed to create autoproxy cache for guild \`${ctx.guild?.id}\``;
        }

        return [
            `__Autoproxy settings for ${ctx.guild.name}__`,
            data[1]?.autoproxy_member ? `Member: ${data[1].autoproxy_member}` : "",
            `Mode: ${data[1].autoproxy_mode}`,
            data[1]?.last_latch_timestamp ? `Last latch timestamp: ${data[1].last_latch_timestamp}` : ""
        ].join("\n").replaceAll("\n\n", "\n");
    } else {
        let data = cache.autoproxy.find(e => e[0] === "0");
        if (data === undefined) {
            cache.autoproxy.push(["0", { autoproxy_member: null, autoproxy_mode: AutoproxyMode.off, last_latch_timestamp: null }]);
            data = cache.autoproxy.find(e => e[0] === ctx.guild?.id);
            if (data === undefined)
                return "Failed to create autoproxy cache for DMs";
        }
        return [
            "__Autoproxy settings for DMs__",
            data[1]?.autoproxy_member ? `Member: ${data[1].autoproxy_member}` : "",
            `Mode: ${data[1]?.autoproxy_mode}`,
            data[1]?.last_latch_timestamp ? `Last latch timestamp: ${data[1].last_latch_timestamp}` : ""
        ].join("\n").replaceAll("\n\n", "\n");
    }
}
