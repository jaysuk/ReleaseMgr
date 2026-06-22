import { beforeEach, describe, expect, it } from "vitest";

import { defaultSettings, loadSettings, saveSettings } from "../model/settings";

// Self-contained localStorage so the test doesn't depend on the runner's storage backend.
beforeEach(() => {
	const store: Record<string, string> = {};
	globalThis.localStorage = {
		getItem: (k: string) => (k in store ? store[k] : null),
		setItem: (k: string, v: string) => { store[k] = String(v); },
		removeItem: (k: string) => { delete store[k]; },
		clear: () => { for (const k of Object.keys(store)) delete store[k]; },
		key: () => null,
		length: 0,
	} as unknown as Storage;
});

describe("settings", () => {
	it("returns sensible defaults when nothing is stored", () => {
		expect(loadSettings()).toEqual(defaultSettings());
		expect(defaultSettings().checkOnLoad).toBe(true);
	});

	it("round-trips through localStorage", () => {
		saveSettings({ checkOnLoad: false, lastVersion: "3.6.0", alertOnce: false });
		expect(loadSettings()).toEqual({ checkOnLoad: false, lastVersion: "3.6.0", alertOnce: false });
	});

	it("migrates the legacy releaseMgrSettings key", () => {
		localStorage.setItem("releaseMgrSettings", JSON.stringify({ checkOnLoad: false, lastVersion: "3.5.4", alertOnce: true }));
		expect(loadSettings().lastVersion).toBe("3.5.4");
	});

	it("fills missing fields from defaults", () => {
		localStorage.setItem("releaseMgr.settings", JSON.stringify({ lastVersion: "3.6.1" }));
		const s = loadSettings();
		expect(s.lastVersion).toBe("3.6.1");
		expect(s.checkOnLoad).toBe(true);
		expect(s.alertOnce).toBe(true);
	});
});
