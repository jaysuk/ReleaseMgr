<template>
	<v-card flat variant="outlined" class="pa-0 ma-0 rMgrv-mainCardRLM">
		<v-card elevation="3" class="pa-0 ma-0 rMgrv-cardRLM">
			<v-card-title>
				<v-row class="pa-0 ma-0">
					<v-chip class="rlMgrVchip" color="info">RN Assessment</v-chip><v-spacer />
					<v-chip class="rlMgrVchip rmgr-nomatch-chip">Will Never Match</v-chip>
					<v-chip class="rlMgrVchip rmgr-match-chip">Will Match</v-chip>
				</v-row>
			</v-card-title>
			<v-card-text class="rMgrv-cardRLM__text">
				<v-expansion-panels class="mb-5" variant="accordion" multiple>
					<v-expansion-panel v-for="(rel, i) in panelJSON2.releases" :key="i">
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
import { onMounted, ref, watch } from "vue";

import { useMachineStore } from "@/stores/machine";

/* eslint-disable @typescript-eslint/no-explicit-any */

const props = defineProps<{ rnAdminJSON?: any; rMgrData?: any; selectedTag?: string; sRNOvrRd?: string }>();

const machineStore = useMachineStore();

const confGLineMatchCol = "rmgr-confg-line";
const gitOwnerNameDuet = "Duet3D";
const gitRepoNameDuet = "RepRapFirmware";

const panelJSON2 = ref<any>({ releases: [] });

function bIsSBC(): boolean {
	try { return !!(machineStore.model as any).sbc; } catch { return false; }
}
function rnHWLookup(): any { return props.rMgrData?.boards ?? []; }

function filterDuetRNJSON(): any {
	const rn = props.rnAdminJSON;
	if (rn.class === "rn" && rn.releases.length > 0) {
		const tmpJSON: any = { releases: [], relType: rn.relType, selTag: rn.selTag, gUName: rn.gUName, class: rn.class };
		if (rn.relType === "Beta" || rn.relType === "RC") {
			let trmTag = rn.selTag.slice(0, rn.selTag.toLowerCase().indexOf(rn.relType.toLowerCase()) + rn.relType.length);
			trmTag = trmTag.toLowerCase().replace("rc", "").replace("beta", "");
			const tP1: any = { releases: [] };
			for (const rel of rn.releases) {
				if (rel.release.toLowerCase().includes(`reprapfirmware ${trmTag}`)) {
					tP1.releases.push(rel);
				}
			}
			tmpJSON.releases = tP1.releases;
			return tmpJSON;
		}
		const tStr1 = props.sRNOvrRd ? `RepRapFirmware ${props.sRNOvrRd}` : `RepRapFirmware ${rn.selTag}`;
		tmpJSON.releases = rn.releases.filter((item: { release: string }) => item.release.includes(tStr1));
		return tmpJSON;
	}
	return { releases: [] };
}

function highlightRN2(): void {
	const statSNArr = rnHWLookup();
	for (const currRel of panelJSON2.value.releases) {
		for (const currSec of currRel.sections) {
			for (const lineWrap of currSec.lines) {
				const currLine = lineWrap.line;
				if (currLine.text.includes("<pre><code>")) {
					currLine.text = currLine.text.replace("<pre><code>", "<ul><li><code>");
					currLine.text = currLine.text.replace("</code></pre>", "</code></li></ul>");
				}
				const hwStr: any = currLine.text.match(/\[[^\]]*]/g);
				if (!hwStr) { continue; }
				let bSkipped = false;
				for (const hw of hwStr) {
					if (hw.length <= 3) { bSkipped = true; continue; } else { bSkipped = false; }
					if (hw.toLowerCase().includes("in standalone mode") && bIsSBC()) { continue; }
					let tmpHWStr = hw.replace("[", "").replace("]", "");
					if (tmpHWStr.toLowerCase().includes("in standalone mode") && !bIsSBC()) {
						tmpHWStr = tmpHWStr.toLowerCase().replaceAll(" in standalone mode", "");
					}
					const rnHWArr = tmpHWStr.split(" + ");
					let bHWMatch = false;
					for (let part of rnHWArr) {
						bHWMatch = false;
						if (part.toLowerCase().includes(" - ")) {
							part = part.substring(0, part.indexOf(" - "));
						}
						for (const sn of statSNArr) {
							const hwSNMatchArr = rnHWLookup().filter((item: { shortName: string }) => item.shortName === sn.shortName);
							if (hwSNMatchArr.length !== 0) {
								const isMatchArr = hwSNMatchArr[0].rnNames.filter((item: any) => item.toLowerCase() === part.toLowerCase());
								if (isMatchArr.length !== 0) { bHWMatch = true; }
							}
							if (bHWMatch) { break; }
						}
						if (!bHWMatch) { break; }
					}
					if (bHWMatch && !bSkipped) {
						currLine.text = currLine.text.replace(hw, `<span class="rmgr-match">${hw}</span>`);
						currLine.hwMatch = true;
						currLine.hwHover = "";
					} else if (!bHWMatch && !bSkipped) {
						currLine.text = currLine.text.replace(hw, `<span class="rmgr-nomatch">${hw}</span>`);
						currSec.color = confGLineMatchCol;
						currRel.color = confGLineMatchCol;
						currLine.hwMatch = false;
						currLine.hwHover = "";
					}
				}
			}
		}
	}
}

function startUp(): void {
	const rn = props.rnAdminJSON;
	if (rn && rn.gUName === gitOwnerNameDuet && rn.gRName === gitRepoNameDuet) {
		panelJSON2.value = filterDuetRNJSON();
		highlightRN2();
	}
}

onMounted(startUp);
watch([() => props.rnAdminJSON, () => props.selectedTag, () => props.sRNOvrRd], startUp);
</script>

<style scoped>
.rMgrv-cardRLM { display: flex !important; flex-direction: column; height: calc(100vh - 300px); }
.rMgrv-mainCardRLM { height: calc(100vh - 340px) !important; }
.rMgrv-cardRLM__text { flex-grow: 1; overflow-y: auto; overflow-x: hidden; }
.rlMgrVchip { white-space: normal !important; height: auto !important; text-align: center !important; min-height: 35px !important; }
.rmgr-match-chip { background-color: #4caf50; color: #000; }
.rmgr-nomatch-chip { background-color: #f44336; color: #000; }
</style>

<!-- Global highlight classes for v-html content (scoped CSS can't reach injected markup). -->
<style>
.rmgr-confg-line { background-color: #e57373; color: #000; }
.rmgr-match { color: #2e7d32; font-weight: 600; }
.rmgr-nomatch { color: #c62828; font-weight: 600; }
</style>
