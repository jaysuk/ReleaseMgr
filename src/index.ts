/**
 * ReleaseMgr — entry point (DWC 3.7).
 *
 * Registers a standalone DWC page (Plugins → ReleaseMgr) that fetches the GitHub release notes for
 * RRF / DWC / DSF / Team Gloomy and highlights changes that may affect the user's config.g and
 * hardware. On load it optionally checks for a newer firmware release and notifies (the plugin's
 * original purpose), and wires in the shared runtime (self-update hub + error capture). App-lifetime
 * resources are torn down on `dwcPluginUnloaded`.
 */
import { registerPluginMessages, registerRoute, unregisterRoute } from "@/plugins";
import Events from "@/utils/events";
import { clearAnnouncedUpdate, installErrorCapture } from "dwc-plugin-runtime";

import ReleaseMgrMainPanel from "./ReleaseMgrMainPanel.vue";
import { PLUGIN_ID, PLUGIN_MANIFEST_ID, ROUTE_PATH } from "./model/constants";
import { runFirmwareCheck } from "./model/firmwareCheck";
import { runUpdateCheck } from "./model/updateCheck";
import en from "./i18n/en.json";

registerPluginMessages(PLUGIN_ID, { en });

registerRoute(ReleaseMgrMainPanel, {
	Plugins: {
		ReleaseMgr: {
			icon: "mdi-application-cog",
			caption: "plugins.releaseMgr.menuCaption",
			path: ROUTE_PATH,
		},
	},
});

const uninstallErrorCapture = installErrorCapture();

// Give the object model time to populate the board details before the firmware check reads them.
setTimeout(() => { void runFirmwareCheck(); }, 10000);
setTimeout(() => { void runUpdateCheck({ notify: true }); }, 4000);

function onPluginUnloaded(id: string): void {
	if (id === PLUGIN_MANIFEST_ID) {
		unregisterRoute(ROUTE_PATH);
		clearAnnouncedUpdate(PLUGIN_MANIFEST_ID);
		uninstallErrorCapture();
		Events.off("dwcPluginUnloaded", onPluginUnloaded);
	}
}
Events.on("dwcPluginUnloaded", onPluginUnloaded);
