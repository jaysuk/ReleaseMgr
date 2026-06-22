/**
 * The plugin's *original* purpose's on-load helper: when enabled, check GitHub for the latest RRF /
 * Team Gloomy firmware release and notify the user if it's newer than what the board is running. This
 * is distinct from updateCheck.ts (which self-updates the plugin). Ported from the old Vue 2 index.ts
 * to read the board firmware from the Pinia machine store.
 */
import { useMachineStore } from "@/stores/machine";
import { LogLevel, useUiStore } from "@/stores/ui";
import i18n from "@/i18n";

import { getReleases } from "./git";
import { loadSettings, saveSettings } from "./settings";

interface Board { firmwareName?: string; firmwareVersion?: string }

/** Which firmware family the board runs, by its firmware name. */
export function firmwareSource(firmwareName: string | undefined): "Duet3D" | "gloomyandy" | "" {
	if (typeof firmwareName === "undefined") {
		return "";
	}
	const name = firmwareName.toLowerCase();
	if (name.includes("duet") || firmwareName === "") {
		return "Duet3D";
	}
	return "gloomyandy";
}

function firstBoard(): Board | undefined {
	const boards = (useMachineStore().model as { boards?: Array<Board> }).boards;
	return boards?.[0];
}

export async function runFirmwareCheck(): Promise<void> {
	const settings = loadSettings();
	if (!settings.checkOnLoad) {
		console.info("[ReleaseMgr] firmware update check disabled");
		return;
	}
	const board = firstBoard();
	const fwName = board?.firmwareName;
	const fwVersion = board?.firmwareVersion;
	if (!fwName || !fwVersion) {
		console.warn("[ReleaseMgr] no board detected for firmware check");
		return;
	}

	const source = firmwareSource(fwName);
	const owner = source === "gloomyandy" ? "gloomyandy" : "Duet3D";
	const releases = await getReleases(owner, "RepRapFirmware");
	if (!releases || releases.length === 0) {
		console.warn("[ReleaseMgr] unable to retrieve firmware release data");
		return;
	}

	// Newest first, filtered to >= 3.3 (matching the original behaviour, including Gloomy's "v" prefix).
	const sorted = [...releases].sort((a, b) => (a.published_at ?? "") < (b.published_at ?? "") ? 1 : -1);
	const filtered = source === "gloomyandy"
		? sorted.filter((r) => r.tag_name >= "v3.3")
		: sorted.filter((r) => r.tag_name >= "3.3" && r.tag_name.charAt(0) !== "v");
	const latest = filtered[0];
	if (!latest) {
		return;
	}

	const latestPlain = latest.tag_name.replace(/^v/, "");
	const isNew = latestPlain > fwVersion;
	const alreadyAlerted = settings.alertOnce && settings.lastVersion === latest.tag_name;

	if (isNew && !alreadyAlerted) {
		settings.lastVersion = latest.tag_name;
		saveSettings(settings);
		const which = source === "gloomyandy" ? "Team Gloomy" : "RepRapFirmware";
		useUiStore().makeNotification(
			LogLevel.info,
			i18n.global.t("plugins.releaseMgr.title"),
			`A new ${which} firmware update (${latest.tag_name}) has been released. Open ReleaseMgr to see details.`,
		);
	}
}
