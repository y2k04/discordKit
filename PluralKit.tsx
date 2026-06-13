/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { DataStore } from "@api/index";
import { DefinedSettings } from "@utils/types";
import { Guild } from "@vencord/discord-types";
import { OAuth2AuthorizeModal, openModal, RestAPI, showToast, Toasts, UserStore } from "@webpack/common";

import { getToken } from ".";
import { PKCache } from "./utils";

export default class {
    private endpoint: string = "https://api.pluralkit.me/v2";
    private dataStoreKey: string = "";
    public isReady: boolean = false;

    constructor(settings: DefinedSettings, cache: PKCache) {
        this.dataStoreKey = `discordKit_${UserStore.getCurrentUser().id}`;

        if (getToken() !== "") {
            if (!this.tryLogin(cache)) {
                settings.store.pk_token = "";
                this.syncCacheToStore(cache);
            }
        }
    }

    async tryLogin(cache: PKCache): Promise<boolean> {
        try {
            if (!await this.testToken(getToken())) throw "Invalid token.";

            this.setCacheFromStore(cache);
            if (cache.system.id === undefined) {
                cache.system = await this.getSystem("@me", getToken());
                cache.userId = UserStore.getCurrentUser()?.id;
                this.syncCacheToStore(cache);
            }
            this.isReady = true;

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

    async testToken(token: string): Promise<boolean> {
        return (await this.api("GET", "/systems/@me/autoproxy", token)).status === 501;
    }

    async setCacheFromStore(cache: PKCache) {
        const tmp = await DataStore.get<PKCache>(this.dataStoreKey);
        if (tmp) cache = tmp;
        else return false;
    }

    syncCacheToStore(cache: PKCache) {
        DataStore.set(this.dataStoreKey, cache);
    }

    deleteCacheFromStore(cache: PKCache) {
        DataStore.del(this.dataStoreKey);
    }

    async api(method: string = "GET", path: string, token: string, body: BodyInit | null = null, headers: HeadersInit | null = null): Promise<Response> {
        return fetch(`${this.endpoint}${path}`, {
            method,
            body,
            headers: {
                Authorization: token,
                ...headers
            }
        });
    }

    async getSystem(system: string = "@me", token: string, cache: PKCache | null = null): Promise<System> {
        let res: System;

        if (cache?.system) res = cache.system;
        else res = await this.api("GET", `/systems/${system}`, token).then(r => r.json()) as System;

        if (system === "@me" && cache?.system.members === undefined) {
            res.members = await this.api("GET", `/systems/${system}/members`, token).then(r => r.json()) as Member[];
        }
        return res;
    }

    async getAutoproxySettings(guild_id: string, token: string): Promise<SystemAutoproxySettings> {
        return await this.api("GET", `/systems/@me/autoproxy?guild_id=${guild_id}`, token).then(r => r.json()) as SystemAutoproxySettings;
    }

    async setAutoproxy(member: Member | null, cache: PKCache, guild: Guild | null = null, mode: string = "member"): Promise<boolean> {
        const guild_id = guild ? guild.id : "0"; // 0 = DMs
        const autoproxy = cache.autoproxy.find(e => e[0] === guild_id);

        const req = await this.api("PATCH", `/systems/@me/autoproxy?guild_id=${guild_id}`, getToken(),
            JSON.stringify({ guild_id: Number.parseInt(guild_id), autoproxy_member: member?.id, autoproxy_mode: mode }),
            { "Content-Type": "application/json" }
        ).then(r => r.json()).catch(r => { throw r; });

        if (autoproxy === undefined) cache.autoproxy.push(req);
        else if (req !== autoproxy) cache.autoproxy[cache.autoproxy.findIndex(e => e[0] === guild_id)][1] = req;
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
    autoproxy_mode: AutoproxyMode | null;
    autoproxy_member: string | null;
    readonly last_latch_timestamp: Date | null;
}

export enum AutoproxyMode {
    "off",
    "front",
    "latch",
    "member"
}
