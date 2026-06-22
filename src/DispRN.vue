<template>
	<v-card flat variant="outlined" class="pa-0 ma-0 rMgrv-mainCardRLM">
		<v-card elevation="3" class="pa-0 ma-0 rMgrv-cardRLM">
			<v-card-title>
				<v-row class="pa-0 ma-0">
					<v-chip class="rlMgrVchip" color="info">Release Notes</v-chip><v-spacer />
					<v-chip v-if="rnJSON?.gRName === gitRepoNameDuet" class="rlMgrVchip rmgr-confg-line">G Code</v-chip>
					<v-chip v-if="rnJSON?.gRName === gitRepoNameDuet" class="rlMgrVchip rmgr-hw-line">HW</v-chip>
					<v-chip v-if="rnJSON?.gRName === gitRepoNameDuet" class="rlMgrVchip rmgr-both-line">Both</v-chip>
				</v-row>
			</v-card-title>
			<v-card-text v-if="currReleaseJSON" class="rMgrv-cardRLM__text">
				<v-expansion-panels class="mb-5" variant="accordion" multiple>
					<v-expansion-panel v-for="(rel, i) in currReleaseJSON.releases" :key="i">
						<v-expansion-panel-title :class="rel.color" :title="rel.hover">{{ rel.release }}</v-expansion-panel-title>
						<v-expansion-panel-text>
							<v-expansion-panels variant="accordion" multiple>
								<v-expansion-panel v-for="(sec, j) in rel.sections" :key="j">
									<v-expansion-panel-title :class="sec.color" :title="sec.hover">{{ sec.section }}</v-expansion-panel-title>
									<v-expansion-panel-text>
										<span v-for="(content, k) in sec.lines" :key="k">
											<span :title="content.line.hover">
												<!-- eslint-disable-next-line vue/no-v-html -->
												<div :class="`${content.line.colour} pa-1`" v-html="content.line.text"></div>
											</span>
										</span>
									</v-expansion-panel-text>
								</v-expansion-panel>
							</v-expansion-panels>
						</v-expansion-panel-text>
					</v-expansion-panel>
				</v-expansion-panels>
			</v-card-text>
		</v-card>
	</v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

import i18n from "@/i18n";
import { useMachineStore } from "@/stores/machine";

/* eslint-disable @typescript-eslint/no-explicit-any */

const props = defineProps<{ rnJSON?: any; rMgrData?: any; selectedTag?: string }>();

const machineStore = useMachineStore();
const t = (key: string) => i18n.global.t(`plugins.releaseMgr.${key}`);

// Highlight classes — defined as global rmgr-* CSS below (v-html content ignores scoped styles).
const confGLineMatchCol = "rmgr-confg-line";
const confGCodeMatchCol = "rmgr-confg-code";
const shortNLineMatchCol = "rmgr-hw-line";
const dualHWGCMatchLineColor = "rmgr-both-line";

const gitOwnerNameDuet = "Duet3D";
const gitRepoNameDuet = "RepRapFirmware";
const gitSBCRepoNameDuet = "DuetSoftwareFramework";
const gitDWCRepoNameDuet = "DuetWebControl";
const duetDocsURL = "https://docs.duet3d.com/en/User_manual/Reference/Gcodes/";

const currReleaseJSON = ref<any>(null);
let panelJSON: any = { releases: [] };
let confGText: any = null;

const systemDirectory = computed(() => (machineStore.model as any).directories?.system ?? "0:/sys");
const bIsSBC = computed(() => {
	try { return !!(machineStore.model as any).sbc; } catch { return false; }
});
const rnHWLookup = computed(() => props.rMgrData?.boards ?? []);
const bHiddenTestData = computed(() => {
	try {
		const g = (machineStore.model as any).global;
		return !!(g?.has?.("releaseMgrTestData") && g.get("releaseMgrTestData"));
	} catch { return false; }
});
const systemBoardSNames = computed(() => bHiddenTestData.value ? (props.rMgrData?.testData ?? []) : (machineStore.model as any).boards ?? []);

function makeArrayUniq(a: Array<string>): Array<string> {
	return a.sort().filter((item, pos, ary) => !pos || item !== ary[pos - 1]);
}

function getTagSubNumber(type: string, releaseTag: string): number {
	const tmpType = type.toLowerCase();
	const tmpRTag = releaseTag.toLowerCase();
	let tmpBetaNumber = "";
	const betaRex = /beta.[0-9]+/;
	const betaRex2 = /beta[0-9]+/;
	if (tmpType === "beta") {
		if (betaRex.test(tmpRTag)) {
			tmpBetaNumber = tmpRTag.slice(tmpRTag.indexOf("beta") + 5);
		} else if (betaRex2.test(tmpRTag)) {
			tmpBetaNumber = tmpRTag.slice(tmpRTag.indexOf("beta") + 4);
		} else {
			tmpBetaNumber = tmpRTag.slice(tmpRTag.indexOf("b") + 1);
		}
	} else if (tmpType === "rc") {
		tmpBetaNumber = tmpRTag.slice(tmpRTag.indexOf("rc") + 3);
	}
	if (tmpBetaNumber.includes("+")) {
		tmpBetaNumber = tmpBetaNumber.slice(0, tmpBetaNumber.length - 1);
	}
	return parseInt(tmpBetaNumber);
}

function getSBCTag(type: string, releaseTag: string): string {
	let tmpType = type.toLowerCase();
	const tmpRTag = releaseTag.toLowerCase();
	const betaRex = /beta.[0-9]+/;
	const rcRex = /rc.[0-9]+/;
	if (!betaRex.test(tmpRTag)) { if (tmpType === "beta") tmpType = "-b"; }
	else { if (tmpType === "beta") tmpType = "-beta."; }
	if (!rcRex.test(tmpRTag)) { if (tmpType === "rc") tmpType = "-rc"; }
	else { if (tmpType === "rc") tmpType = "-rc."; }
	return tmpRTag.substring(0, tmpRTag.indexOf(tmpType) + tmpType.length);
}

function filterDuetSBCRNJSON(): any {
	const rn = props.rnJSON;
	if (rn.class === "rn" && rn.releases.length > 0) {
		const tmpJSON: any = { releases: [], relType: rn.relType, selTag: rn.selTag, gUName: rn.gUName, class: rn.class };
		if (rn.relType.toLowerCase() === "beta" || rn.relType.toLowerCase() === "rc") {
			const trmTag = rn.selTag.substring(0, 1) === "v" ? rn.selTag.substring(1) : rn.selTag;
			const tmpBetaNumber = getTagSubNumber(rn.relType, trmTag);
			const tP1: any = { releases: [] };
			for (const rel of rn.releases) {
				if (rel.release.toLowerCase().includes(`version ${getSBCTag(rn.relType, trmTag)}`)) {
					if (getTagSubNumber(rn.relType, rel.release) <= tmpBetaNumber) {
						tP1.releases.push(rel);
					}
				}
			}
			tmpJSON.releases = tP1.releases;
			return tmpJSON;
		}
		const trmTag2 = rn.selTag.substring(0, 1) === "v" ? rn.selTag.substring(1) : rn.selTag;
		tmpJSON.releases = rn.releases.filter((item: { release: string }) => item.release.includes(`Version ${trmTag2}`));
		return tmpJSON;
	}
	return { releases: [] };
}

function filterDuetRNJSON(): any {
	const rn = props.rnJSON;
	if (rn.class === "rn" && rn.releases.length > 0) {
		const tmpJSON: any = { releases: [], relType: rn.relType, selTag: rn.selTag, gUName: rn.gUName, class: rn.class };
		if (rn.relType === "Beta" || rn.relType === "RC") {
			const trmTag = rn.selTag.slice(0, rn.selTag.toLowerCase().indexOf(rn.relType.toLowerCase()) + rn.relType.length);
			const tmpBetaNumber = getTagSubNumber(rn.relType, rn.selTag);
			const tP1: any = { releases: [] };
			for (const rel of rn.releases) {
				if (rel.release.toLowerCase().includes(`reprapfirmware ${trmTag}`)) {
					if (getTagSubNumber(rn.relType, rel.release) <= tmpBetaNumber) {
						tP1.releases.push(rel);
					}
				}
			}
			tmpJSON.releases = tP1.releases;
			return tmpJSON;
		}
		tmpJSON.releases = rn.releases.filter((item: { release: string }) => item.release.includes(`RepRapFirmware ${rn.selTag}`));
		return tmpJSON;
	}
	return { releases: [] };
}

function reFormatCodeBlockLine(): void {
	for (const currRel of panelJSON.releases) {
		for (const currSec of currRel.sections) {
			for (const lineWrap of currSec.lines) {
				const currLine = lineWrap.line;
				if (currLine.text.includes("<pre><code>")) {
					currLine.text = currLine.text.replace("<pre><code>", "<ul><li><code>");
					currLine.text = currLine.text.replace("</code></pre>", "</code></li></ul>");
				}
			}
		}
	}
}

async function loadConfGFile(): Promise<any> {
	try {
		const setFileName = `${systemDirectory.value.replace(/\/+$/, "")}/config.g`;
		return await (machineStore as any).download({ filename: setFileName, type: "text" }, false, false, false);
	} catch (e) {
		console.warn("[ReleaseMgr] couldn't load config.g:", e);
		return null;
	}
}

function highlightRN(): void {
	if (!confGText) {
		currReleaseJSON.value = JSON.parse(JSON.stringify(panelJSON));
		return;
	}
	// Strip comments, collect the unique g-codes (and sub-codes) used in config.g.
	confGText = confGText.replace(/;.*/g, "");
	let arrAllConfGcodes: any = confGText.match(/\b[(g|G|m|M]{1}\d{1,3}\b(?!\.)/g);
	arrAllConfGcodes = arrAllConfGcodes ? makeArrayUniq(arrAllConfGcodes) : [];
	let arrAllConfSubGcodes: any = confGText.match(/\b[(g|G|m|M]{1}\d{1,3}\.\d{1,3}\b/g);
	if (arrAllConfSubGcodes) { arrAllConfSubGcodes = makeArrayUniq(arrAllConfSubGcodes); }

	const statSNArr: any = JSON.parse(JSON.stringify(systemBoardSNames.value));
	currReleaseJSON.value = JSON.parse(JSON.stringify(panelJSON));
	if (bIsSBC.value && currReleaseJSON.value) {
		statSNArr.push({ shortName: "SBC" });
	}

	for (const currRel of currReleaseJSON.value.releases) {
		for (const currSec of currRel.sections) {
			for (const lineWrap of currSec.lines) {
				const currLine = lineWrap.line;
				if (currLine.text.includes("<pre><code>")) {
					currLine.text = currLine.text.replace("<pre><code>", "<ul><li><code>");
					currLine.text = currLine.text.replace("</code></pre>", "</code></li></ul>");
				}
				// HW matching: lines flagging hardware are written as "[xxx]" in the notes.
				let bHWLine = false;
				let bHWMatch = false;
				let bSkipped = false;
				const hwStr: any = currLine.text.match(/\[[^\]]*]/g);
				if (hwStr) {
					bHWLine = true;
					for (const hw of hwStr) {
						if (hw.length <= 3) { bSkipped = true; continue; } else { bSkipped = false; }
						if (hw.toLowerCase().includes("in standalone mode") && bIsSBC.value) { continue; }
						let tmpHWStr = hw.replace("[", "").replace("]", "");
						if (tmpHWStr.toLowerCase().includes("in standalone mode") && !bIsSBC.value) {
							tmpHWStr = tmpHWStr.toLowerCase().replaceAll(" in standalone mode", "");
						}
						const rnHWArr = tmpHWStr.split(" + ");
						for (let part of rnHWArr) {
							bHWMatch = false;
							if (part.toLowerCase().includes(" - ")) {
								part = part.substring(0, part.indexOf(" - "));
							}
							for (const sn of statSNArr) {
								const hwSNMatchArr = rnHWLookup.value.filter((item: { shortName: string }) => item.shortName === sn.shortName);
								if (hwSNMatchArr.length !== 0) {
									const isMatchArr = hwSNMatchArr[0].rnNames.filter((item: string) => item.toLowerCase() === part.toLowerCase());
									if (isMatchArr.length !== 0) { bHWMatch = true; }
								}
								if (bHWMatch) { break; }
							}
							if (!bHWMatch) { break; }
						}
						if (bHWMatch) {
							currLine.text = currLine.text.replace(hw, `<span title="${t("shortNMatchedHW")}" class="rmgr-hw-text">${hw}</span>`);
						}
					}
					if (bHWMatch && !bSkipped) {
						currLine.hwMatch = true;
						if (currLine.confGMatch) {
							currLine.colour = dualHWGCMatchLineColor;
							currSec.hwMatch = true;
						} else {
							currLine.colour = shortNLineMatchCol;
							currSec.hwMatch = true;
						}
						currLine.hwHover = t("shortNMatchedHW");
						currLine.hover = "";
						continue;
					}
				}
				// G-code matching (only for non-HW lines).
				if (!currLine.hwMatch && !bHWLine) {
					let clTxtArr: any = currLine.text.match(/\b[(g|G|m|M]{1}\d{1,3}\b(?!\.)/g);
					const clTxtArr2: any = currLine.text.match(/\b[(g|G|m|M]{1}\d{1,3}\.\d{1,3}\b/g);
					if (clTxtArr) {
						clTxtArr = makeArrayUniq(clTxtArr);
						for (const code of clTxtArr) {
							const repTxt = `<a onclick="window.open('${duetDocsURL}${code}', '_blank')"><span title="${t("gcodeLink2Doc")}" class="rmgr-doc-link">${code}</span></a>`;
							currLine.text = currLine.text.replaceAll(code, repTxt);
							for (const cg of arrAllConfGcodes) {
								if (code === cg) {
									currLine.text = currLine.text.replaceAll(repTxt, `<a onclick="window.open('${duetDocsURL}${cg}', '_blank')"><span title="${t("gcodeMatchConfG")}" class="${confGCodeMatchCol}">${cg}</span></a>`);
									currLine.colour = confGLineMatchCol;
									currLine.confGMatch = true;
									currLine.fileHover = t("gcodeMatchConfG");
									currLine.hover = "";
									currSec.confGMatch = true;
								}
							}
						}
					}
					if (clTxtArr2) {
						const subs = makeArrayUniq(clTxtArr2);
						for (const code of subs) {
							const tmpURLCode = code.replace(/\b\.\d{1,3}\b/g, "");
							const repTxt = `<a onclick="window.open('${duetDocsURL}${tmpURLCode}', '_blank')"><span title="${t("gcodeLink2Doc")}" class="rmgr-doc-link">${code}</span></a>`;
							currLine.text = currLine.text.replaceAll(code, repTxt);
							if (arrAllConfSubGcodes) {
								for (const cg of arrAllConfSubGcodes) {
									if (code === cg) {
										currLine.text = currLine.text.replaceAll(repTxt, `<a onclick="window.open('${duetDocsURL}${tmpURLCode}', '_blank')"><span title="${t("gcodeMatchConfG")}" class="${confGCodeMatchCol}">${code}</span></a>`);
										currLine.colour = confGLineMatchCol;
										currLine.confGMatch = true;
										currLine.fileHover = t("gcodeMatchConfG");
										currLine.hover = "";
										currSec.confGMatch = true;
									}
								}
							}
						}
					}
				}
			}
			// Colour the section header by what it contains.
			if (currSec.hwMatch && currSec.confGMatch) {
				currSec.hover = t("BothMatchSection");
				currSec.color = dualHWGCMatchLineColor;
				currRel.hwMatch = true;
				currRel.confGMatch = true;
			} else if (currSec.hwMatch && !currSec.confGMatch) {
				currSec.hover = t("HWMatchHWSection");
				currSec.color = shortNLineMatchCol;
				currRel.hwMatch = true;
			} else if (!currSec.hwMatch && currSec.confGMatch) {
				currSec.hover = t("gcodeMatchConfGSection");
				currSec.color = confGLineMatchCol;
				currRel.confGMatch = true;
			}
		}
		// Colour the release header by what it contains.
		if (currRel.hwMatch && currRel.confGMatch) {
			currRel.hover = t("BothMatchRN");
			currRel.color = dualHWGCMatchLineColor;
		} else if (currRel.hwMatch && !currRel.confGMatch) {
			currRel.hover = t("HWMatchHWRN");
			currRel.color = shortNLineMatchCol;
		} else if (!currRel.hwMatch && currRel.confGMatch) {
			currRel.hover = t("gcodeMatchConfGRN");
			currRel.color = confGLineMatchCol;
		}
	}
}

async function startUp(): Promise<void> {
	const rn = props.rnJSON;
	if (!rn) { return; }
	if (rn.gUName === gitOwnerNameDuet && rn.gRName === gitRepoNameDuet) {
		panelJSON = filterDuetRNJSON();
		confGText = await loadConfGFile();
		highlightRN();
	} else if (rn.gUName === gitOwnerNameDuet && (rn.gRName === gitSBCRepoNameDuet || rn.gRName === gitDWCRepoNameDuet)) {
		panelJSON = filterDuetSBCRNJSON();
		reFormatCodeBlockLine();
		currReleaseJSON.value = JSON.parse(JSON.stringify(panelJSON));
	} else {
		// Team Gloomy and anything else: show the structured notes without config.g/HW highlighting.
		panelJSON = rn.releases ? { releases: rn.releases } : { releases: [] };
		reFormatCodeBlockLine();
		currReleaseJSON.value = JSON.parse(JSON.stringify(panelJSON));
	}
}

onMounted(startUp);
watch([() => props.rnJSON, () => props.selectedTag], startUp);
</script>

<style scoped>
.rMgrv-mainCardRLM { max-width: 100%; }
.rMgrv-cardRLM__text { overflow-y: auto; overflow-x: hidden; max-height: 100%; }
.rlMgrVchip { white-space: normal !important; height: auto !important; text-align: center !important; min-height: 35px !important; }
</style>

<!-- Global (un-scoped) highlight classes: applied to markdown injected via v-html, which scoped CSS can't reach. -->
<style>
.rmgr-confg-line { background-color: #e57373; color: #000; }
.rmgr-confg-code { background-color: #f06292; color: #000; padding: 0 2px; border-radius: 3px; }
.rmgr-hw-line { background-color: #bbdefb; color: #000; }
.rmgr-hw-text { color: #0d47a1; font-weight: 600; }
.rmgr-both-line { background-color: #e1bee7; color: #000; }
.rmgr-doc-link { color: #2e7d32; cursor: pointer; }
</style>
