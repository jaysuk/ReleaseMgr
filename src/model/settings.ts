/**
 * ReleaseMgr user settings, persisted in localStorage (same store the original plugin used, so an
 * upgrade keeps the user's choices). Two flags drive the on-load update check in index.ts.
 */
import { LS_SETTINGS } from "./constants";

export interface ReleaseMgrSettings {
	/** Check GitHub for a newer firmware release when DWC loads. */
	checkOnLoad: boolean;
	/** Last firmware version we alerted about (so we only alert once per release). */
	lastVersion: string | null;
	/** Alert only once per release. */
	alertOnce: boolean;
}

export function defaultSettings(): ReleaseMgrSettings {
	return { checkOnLoad: true, lastVersion: null, alertOnce: true };
}

export function loadSettings(): ReleaseMgrSettings {
	try {
		// Legacy key from the original (pre-3.7) plugin, migrated transparently on first load.
		const raw = localStorage.getItem(LS_SETTINGS) ?? localStorage.getItem("releaseMgrSettings");
		if (raw) {
			return { ...defaultSettings(), ...JSON.parse(raw) as Partial<ReleaseMgrSettings> };
		}
	} catch { /* corrupt / disabled storage */ }
	return defaultSettings();
}

export function saveSettings(settings: ReleaseMgrSettings): void {
	try {
		localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
	} catch { /* storage disabled */ }
}
