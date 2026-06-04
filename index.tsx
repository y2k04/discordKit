/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { commands } from "@equicordplugins/discordKit/commands";
import { Cache } from "@equicordplugins/discordKit/utils";
import { EquicordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { showToast, Toasts } from "@webpack/common";

import PluralKit, { System, SystemAutoproxySettings } from "./PluralKit";

export let pk: PluralKit;
export const cache: Cache = {
    isReady: false,
    token: () => settings.store.pk_token,
    autoproxy: {} as Map<string, SystemAutoproxySettings>,
    system: {} as System,
    userId: ""
};

export const settings = definePluginSettings({
    authorize: {
        type: OptionType.COMPONENT,
        component: () => (
            <Button onClick={() => {
                pk.authorize(async (token: string) => {
                    settings.store.pk_token = token;
                    await pk.tryLogin(cache);
                });
            }}>
                Log into PluralKit
            </Button>
        )
    },
    pk_token: {
        type: OptionType.STRING,
        hidden: true,
        description: "PluralKit API token",
        default: ""
    }
});

export default definePlugin({
    name: "DiscordKit",
    description: "Integrates PluralKit into the Discord client",
    authors: [EquicordDevs.y2k4],
    settings,

    commands,
    start: async () => {
        await VencordNative.csp.requestAddOverride("*.pluralkit.me", ["connect-src"], "DiscordKit");
        pk = new PluralKit(settings, cache);
    },
    stop: async () => {
        await VencordNative.csp.removeOverride("*.pluralkit.me");
        showToast("Unloaded DiscordKit", Toasts.Type.SUCCESS);
    }
});
