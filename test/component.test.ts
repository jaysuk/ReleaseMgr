import { beforeEach, describe, expect, it } from "vitest";

import { mountInDwc, resetDwc } from "dwc-plugin-test-kit";

import ReleaseMgrMainPanel from "../src/ReleaseMgrMainPanel.vue";

describe("ReleaseMgrMainPanel", () => {
	beforeEach(() => {
		resetDwc();
		// The panel fetches GitHub data on mount; stub fetch so tests stay offline and deterministic.
		globalThis.fetch = (async () => ({ ok: false, status: 404, json: async () => ({}), text: async () => "" })) as unknown as typeof fetch;
	});

	it("mounts without throwing", () => {
		const wrapper = mountInDwc(ReleaseMgrMainPanel);
		expect(wrapper.exists()).toBe(true);
	});

	it("renders the firmware-source summary from the object model", async () => {
		const wrapper = mountInDwc(ReleaseMgrMainPanel);
		await wrapper.vm.$nextTick();
		// fwSrcFriendlyName is a literal computed (not i18n), so it's stable across the test harness.
		expect(wrapper.text()).toMatch(/Team Gloomy|Official Duet 3D|No Board Connected/);
	});
});
