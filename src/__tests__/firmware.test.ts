import { describe, expect, it } from "vitest";

import { firmwareSource } from "../model/firmwareCheck";

describe("firmwareSource", () => {
	it("identifies official Duet firmware by name", () => {
		expect(firmwareSource("RepRapFirmware for Duet 3 MB6HC")).toBe("Duet3D");
		expect(firmwareSource("RepRapFirmware for Duet 2 WiFi/Ethernet")).toBe("Duet3D");
	});

	it("treats an empty firmware name as Duet", () => {
		expect(firmwareSource("")).toBe("Duet3D");
	});

	it("identifies non-Duet (Team Gloomy STM32) firmware", () => {
		expect(firmwareSource("RepRapFirmware for STM32F4 based boards")).toBe("gloomyandy");
	});

	it("returns empty when the name is undefined", () => {
		expect(firmwareSource(undefined)).toBe("");
	});
});
