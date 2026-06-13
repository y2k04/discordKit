/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Button } from "@components/Button";
import definePlugin, { OptionType } from "@utils/types";
import { Alerts, showToast, Toasts } from "@webpack/common";

import { commands } from "./commands";
import PluralKit, { System, SystemAutoproxySettings } from "./PluralKit";
import { PKCache } from "./utils";

export let pk: PluralKit;
export const getToken: () => string = () => settings.store.pk_token;
export let cache: PKCache = {
    autoproxy: new Array<[string, SystemAutoproxySettings]>(),
    system: {} as System,
    userId: ""
};

export const settings = definePluginSettings({
    authorize: {
        type: OptionType.COMPONENT,
        component: () => {
            if (!getToken()) {
                return <Button onClick={() => {
                    pk.authorize(async (token: string) => {
                        settings.store.pk_token = token;
                        await pk.tryLogin(cache);
                    });
                }}>
                    Log into PluralKit
                </Button>;
            } else {
                return <Button onClick={() => {
                    settings.store.pk_token = "";
                    pk.deleteCacheFromStore(cache);
                    cache = {
                        autoproxy: new Array<[string, SystemAutoproxySettings]>(),
                        system: {} as System,
                        userId: ""
                    };
                    pk.isReady = false;
                    Alerts.show({
                        title: "Logged out of PluralKit and cleared cache",
                        body: "Please reload Discord to finish reset.",
                        confirmText: "Reload now",
                        onConfirm: () => location.reload()
                    });
                }}>
                    Log out and clear cache
                </Button>;
            }
        }
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
    authors: [{ name: "y2k4", id: 391801250909257728n }],
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
