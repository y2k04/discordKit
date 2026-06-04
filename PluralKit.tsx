/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { DefinedSettings } from "@utils/types";
import { Guild } from "@vencord/discord-types";
import { OAuth2AuthorizeModal, openModal, RestAPI, showToast, Toasts, UserStore } from "@webpack/common";

import { Cache } from "./utils";

export default class {
    private endpoint: string = "https://api.pluralkit.me/v2";

    constructor(settings: DefinedSettings, cache: Cache) {
        if (cache.token() !== "") {
            if (!this.tryLogin(cache)) {
                settings.store.pk_token = "";
            }
        }
    }

    async tryLogin(cache: Cache): Promise<boolean> {
        try {
            cache.system = await this.getSystem("@me", cache.token());
            cache.userId = UserStore.getCurrentUser()?.id;
            cache.isReady = true;

            showToast(`Succesfully logged into PluralKit: ${cache.system.id}`, Toasts.Type.SUCCESS);
            return true;
        } catch (e) {
            showToast((e as Error).message, Toasts.Type.FAILURE);
            return false;
        }
    }

    authorize(callback: any) {
        openModal(props =>
            <OAuth2AuthorizeModal
                {...props}
                scopes={["guilds", "identify"]}
                responseType="code"
                redirectUri="https://dash.pluralkit.me/login/discord"
                permissions={0n}
                clientId="466378653216014359"
                cancelCompletesFlow={false}
                callback={async (response: any) => {
                    try {
                        const code = new URLSearchParams(response.location.split("?")[1]).get("code");
                        const req = await RestAPI.post({
                            url: "https://api.pluralkit.me/private/discord/callback",
                            body: {
                                "code": code,
                                "redirect_domain": "https://dash.pluralkit.me"
                            }
                        });

                        await callback(req.body.token);
                    } catch (e) {
                        showToast((e as Error).message, Toasts.Type.FAILURE);
                    }
                }}
            />
        );
    }

    async api(method: string = "GET", path: string, token: string, body: BodyInit | null = null): Promise<any> {
        return (await fetch(`${this.endpoint}${path}`, {
            method,
            body,
            headers: {
                Authorization: token
            }
        })).json();
    }

    async getSystem(system: string = "@me", token: string): Promise<System> {
        const res = await this.api("GET", `/systems/${system}`, token) as System;
        if (system === "@me") res.members = await this.api("GET", `/systems/${system}/members`, token) as Member[] ?? [];
        return res;
    }

    async getAutoproxySettings(guild_id: string, token: string): Promise<SystemAutoproxySettings> {
        return await this.api("GET", `/systems/@me/autoproxy?guild_id=${guild_id}`, token) as SystemAutoproxySettings;
    }

    async setAutoproxy(member: Member | null, cache: Cache, guild: Guild | null = null, mode: string = "member"): Promise<boolean> {
        const guild_id = guild ? guild.id : "0"; // 0 = DMs
        const autoproxy = cache.autoproxy.get(guild_id);

        const req = await this.api("PATCH", `${this.endpoint}/systems/@me/autoproxy`, cache.token(),
            JSON.stringify({ guild_id, autoproxy_member: member?.id, autoproxy_mode: mode })
        );

        if (autoproxy === undefined || req !== autoproxy) cache.autoproxy.set(guild_id, req);
        else return false;

        return true;
    }
}

export interface System {
    id,
    uuid: string;
    name,
    description,
    tag,
    pronouns,
    avatar_url,
    banner,
    color: string | null;
    created: Date;
    privacy: SystemPrivacySettings | null;
    members: Member[];
}

export interface SystemPrivacySettings {
    name_privacy,
    description_privacy,
    avatar_privacy,
    banner_privacy,
    pronoun_privacy,
    member_list_privacy,
    group_list_privacy,
    front_privacy,
    front_history_privacy: string;
}

export interface Member {
    id,
    uuid,
    name: string;
    display_name,
    color,
    birthday,
    pronouns,
    avatar_url,
    webhook_avatar_url,
    banner,
    description: string | null;
    created: Date | null;
    proxy_tags: ProxyTags[];
    keep_proxy,
    tts: boolean;
    autoproxy_enabled: boolean | null;
    message_count: number | null;
    last_message_timestamp: Date | null;
    privacy: MemberPrivacySettings | null;
}

export interface MemberPrivacySettings {
    visibility,
    name_privacy,
    description_privacy,
    birthday_privacy,
    pronoun_privacy,
    avatar_privacy,
    banner_privacy,
    metadata_privacy,
    proxy_privacy: string;
}

export interface ProxyTags {
    prefix, suffix: string | null;
}

export interface SystemAutoproxySettings {
    guild_id, channel_id: bigint | null;
    autoproxy_mode: AutoproxyMode;
    autoproxy_member: string | null;
    readonly last_latch_timestamp: Date | null;
}

export enum AutoproxyMode {
    "off",
    "front",
    "latch",
    "member"
}
