<template>
	<v-container fluid class="pa-0 ma-0">
		<v-card flat width="100%" class="pa-0 ma-0">
			<!-- Header: firmware version / source / boards + release-filter switches -->
			<v-card width="100%" class="pa-0 ma-0 mb-3">
				<v-card-text class="pa-0 ma-1" style="overflow: hidden !important;">
					<v-row dense class="pa-0 ma-0 mt-2" justify="center" align="start">
						<v-col cols="12" lg="8" md="12" class="pa-0 ma-0">
							<v-row dense class="pa-0 ma-0" justify="center" align="start">
								<v-col cols="4"><span><strong>{{ t("currFWVer") }}</strong> {{ fwVer }}</span></v-col>
								<v-spacer />
								<v-col cols="4"><span><strong>{{ t("currFWSrc") }}</strong> {{ fwSrcFriendlyName }}</span></v-col>
								<v-spacer />
								<v-col cols="2"><span><strong>{{ t("currCBoard") }}</strong></span></v-col>
								<v-col cols="2">
									<span v-for="(b, k) in conBoards" :key="k">{{ b.name }}<span v-if="bIsSBC && k === 0"> (+ SBC)</span><br></span>
								</v-col>
								<v-spacer />
							</v-row>
						</v-col>
						<v-col cols="12" lg="4" md="12" class="pa-0 ma-0">
							<v-row dense class="pa-0 ma-0" justify="start" align="center">
								<v-col cols="6">
									<v-switch class="pl-5" color="primary" hide-details :label="t('lblSWBetaRel')"
											  :model-value="bShowPreRelease" @update:model-value="onTogglePreRelease" />
								</v-col>
								<v-col cols="6">
									<v-switch v-if="bShowPreRelease" color="primary" hide-details :label="t('lblSWAllRel')"
											  :model-value="bShowAllReleases" @update:model-value="onToggleAllReleases" />
								</v-col>
							</v-row>
						</v-col>
					</v-row>
					<v-row dense class="pl-2 pt-0 ma-0" justify="start" align="center">
						<v-col v-if="bShowGloomyReleases" cols="3">
							<v-select :label="t('lblSelGloomyRel')" :items="gloomyFilteredTags" item-title="text" item-value="value"
									  density="compact" variant="outlined" hide-details
									  :model-value="selectedGloomyRelTag" @update:model-value="selectedGloomyTag" />
						</v-col>
						<v-spacer v-if="bShowGloomyReleases" />
						<v-col cols="3">
							<v-select :label="t('lblSelDuetRel')" :items="duetFilteredTags" item-title="text" item-value="value"
									  density="compact" variant="outlined" hide-details
									  :model-value="selectedDuetRelTag" @update:model-value="selectedDuetTag" />
						</v-col>
						<v-spacer />
						<v-col v-if="bHiddenDuetMenu" cols="2">
							<v-text-field label="release tag override" density="compact" variant="outlined" hide-details
										  :model-value="sReleaseTagOverride"
										  @update:model-value="(v: string) => { sReleaseTagOverride = v; selectedDuetTag(v); }" />
						</v-col>
						<v-col align="right">
							<v-tooltip location="top" :text="t('btnRefreshHover')">
								<template #activator="{ props }">
									<v-btn size="small" color="info" class="ml-6" v-bind="props" icon="mdi-autorenew" @click="refresh" />
								</template>
							</v-tooltip>
							<v-tooltip location="top" :text="t('btnSettingsHover')">
								<template #activator="{ props }">
									<v-btn size="small" color="info" class="ma-1 mr-6" v-bind="props" icon="mdi-cog" @click="bShowEditGlobalSettingsDialog = true" />
								</template>
							</v-tooltip>
							<v-tooltip location="top" text="About, updates & diagnostics">
								<template #activator="{ props }">
									<v-btn size="small" color="info" class="ma-1 mr-6" v-bind="props" icon="mdi-information-outline" @click="aboutOpen = true" />
								</template>
							</v-tooltip>
						</v-col>
					</v-row>
				</v-card-text>
			</v-card>

			<AboutDialog v-model="aboutOpen" plugin-id="ReleaseMgr" title="Release Manager"
				:description="aboutDescription" :model="machineStore.model"
				repo="https://github.com/jaysuk/ReleaseMgr"
				:update-available="updateState?.updateAvailable ?? false" :latest-version="updateState?.latestVersion"
				:checking="checking" :applying="applying" :pending-reload="pendingReload" :auto-check="autoCheck"
				@check-update="onCheckUpdate" @apply-update="applyUpdateNow" @toggle-auto-check="onToggleAutoCheck" />

			<!-- Release views -->
			<v-card v-if="currView" width="100%" class="pa-0 ma-0 mb-2">
				<v-tabs v-model="currTab">
					<v-tab v-if="bGotGloomyRI" value="gloomyRN"><v-icon class="mr-1">mdi-notebook</v-icon>Gloomy</v-tab>
					<v-tab v-if="bGotGloomyRI" value="gloomyRI"><v-icon class="mr-1">mdi-information</v-icon>Gloomy</v-tab>
					<v-tab v-if="bGotDuetRI" value="rrfRN"><v-icon class="mr-1">mdi-notebook</v-icon>RRF</v-tab>
					<v-tab v-if="bGotDuetRI" value="rrfRI"><v-icon class="mr-1">mdi-information</v-icon>RRF</v-tab>
					<v-tab v-if="bGotDuetDWCRI" value="dwcRN"><v-icon class="mr-1">mdi-notebook</v-icon>DWC</v-tab>
					<v-tab v-if="bGotDuetDWCRI" value="dwcRI"><v-icon class="mr-1">mdi-information</v-icon>DWC</v-tab>
					<v-tab v-if="bGotDuetSBCRI" value="dsfRN"><v-icon class="mr-1">mdi-notebook</v-icon>DSF</v-tab>
					<v-tab v-if="bGotDuetSBCRI" value="dsfRI"><v-icon class="mr-1">mdi-information</v-icon>DSF</v-tab>
					<v-tab v-if="bHiddenDuetMenu && bGotDuetRI" value="admin"><v-icon class="mr-1">mdi-text-box-search</v-icon>Formatting Check</v-tab>
				</v-tabs>
				<v-tabs-window v-model="currTab">
					<v-tabs-window-item v-if="bGotGloomyRI" value="gloomyRN">
						<v-row class="pa-0 ma-0">
							<v-col cols="12" lg="8" md="8"><DispRI :ri-j-s-o-n="gloomyRNJSON" :selected-tag="selectedGloomyRelTag" src-type="gloomyRN" /></v-col>
							<v-col cols="12" lg="4" md="4">
								<DispRNFiles :ri-j-s-o-n="gloomyRIJSON" :selected-tag="selectedGloomyRelTag" :b-show-overlay="bShowOverlay" />
								<v-chip class="rlMgrVchip mt-3" color="info" :title="t('gloomyGenUpdateIns1')" @click="hlpLinkClick(gloomyGenUpdateInsURL)">{{ t("fileDLNotice") }}</v-chip>
							</v-col>
						</v-row>
					</v-tabs-window-item>
					<v-tabs-window-item v-if="bGotGloomyRI" value="gloomyRI">
						<v-row class="pa-0 ma-0">
							<v-col cols="12" lg="8" md="8"><DispRI :ri-j-s-o-n="gloomyRIJSON" :selected-tag="selectedGloomyRelTag" src-type="gloomyRN" /></v-col>
							<v-col cols="12" lg="4" md="4">
								<DispRNFiles :ri-j-s-o-n="gloomyRIJSON" :selected-tag="selectedGloomyRelTag" :b-show-overlay="bShowOverlay" />
								<v-chip class="rlMgrVchip mt-3" color="info" :title="t('gloomyGenUpdateIns1')" @click="hlpLinkClick(gloomyGenUpdateInsURL)">{{ t("fileDLNotice") }}</v-chip>
							</v-col>
						</v-row>
					</v-tabs-window-item>
					<v-tabs-window-item v-if="bGotDuetRI" value="rrfRN">
						<v-row class="pa-0 ma-0">
							<v-col cols="12" lg="8" md="8"><DispRN :rn-j-s-o-n="duetRNJSON" :r-mgr-data="relMgrData" :selected-tag="selectedDuetRelTag" /></v-col>
							<v-col cols="12" lg="4" md="4">
								<DispRNFiles :ri-j-s-o-n="duetRIJSON" :selected-tag="selectedDuetRelTag" :b-show-overlay="bShowOverlay" />
								<v-chip class="rlMgrVchip mt-3" color="info" :title="t('rrfUpdateInstructions')" @click="hlpLinkClick(rrfUpdateInsURL)">{{ t("fileDLNotice") }}</v-chip>
							</v-col>
						</v-row>
					</v-tabs-window-item>
					<v-tabs-window-item v-if="bGotDuetRI" value="rrfRI">
						<v-row class="pa-0 ma-0">
							<v-col cols="12" lg="8" md="8"><DispRI :ri-j-s-o-n="duetRIJSON" :selected-tag="selectedDuetRelTag" src-type="RRFRI" /></v-col>
							<v-col cols="12" lg="4" md="4">
								<DispRNFiles :ri-j-s-o-n="duetRIJSON" :selected-tag="selectedDuetRelTag" :b-show-overlay="bShowOverlay" />
								<v-chip class="rlMgrVchip mt-3" color="info" :title="t('rrfUpdateInstructions')" @click="hlpLinkClick(rrfUpdateInsURL)">{{ t("fileDLNotice") }}</v-chip>
							</v-col>
						</v-row>
					</v-tabs-window-item>
					<v-tabs-window-item v-if="bGotDuetDWCRI" value="dwcRN">
						<v-row class="pa-0 ma-0">
							<v-col cols="12" lg="8" md="8"><DispRN :rn-j-s-o-n="dwcRNJSON" :r-mgr-data="relMgrData" :selected-tag="selectedDuetRelTag" /></v-col>
							<v-col cols="12" lg="4" md="4">
								<DispRNFiles :ri-j-s-o-n="dwcRIJSON" :selected-tag="selectedDuetRelTag" :b-show-overlay="bShowOverlay" />
								<v-chip class="rlMgrVchip mt-3" color="info" :title="t('rrfUpdateInstructions')" @click="hlpLinkClick(rrfUpdateInsURL)">{{ t("fileDLNotice") }}</v-chip>
							</v-col>
						</v-row>
					</v-tabs-window-item>
					<v-tabs-window-item v-if="bGotDuetDWCRI" value="dwcRI">
						<v-row class="pa-0 ma-0">
							<v-col cols="12" lg="8" md="8"><DispRI :ri-j-s-o-n="dwcRIJSON" :selected-tag="selectedDuetRelTag" src-type="DWCRI" /></v-col>
							<v-col cols="12" lg="4" md="4">
								<DispRNFiles :ri-j-s-o-n="dwcRIJSON" :selected-tag="selectedDuetRelTag" :b-show-overlay="bShowOverlay" />
								<v-chip class="rlMgrVchip mt-3" color="info" :title="t('rrfUpdateInstructions')" @click="hlpLinkClick(rrfUpdateInsURL)">{{ t("fileDLNotice") }}</v-chip>
							</v-col>
						</v-row>
					</v-tabs-window-item>
					<v-tabs-window-item v-if="bGotDuetSBCRI" value="dsfRN">
						<v-row class="pa-0 ma-0">
							<v-col cols="12" lg="8" md="8"><DispRN :r-mgr-data="relMgrData" :rn-j-s-o-n="sbcRNJSON" :selected-tag="selectedDuetRelTag" /></v-col>
							<v-col cols="12" lg="4" md="4">
								<v-card variant="outlined" elevation="3" class="pa-2">
									<a v-if="fwSrc === gitOwnerNameDuet" style="color: green; cursor: pointer" @click="hlpLinkClick(dsfUpdateInsURL)">{{ t("dsfUpdateInstructions") }}</a>
								</v-card>
							</v-col>
						</v-row>
					</v-tabs-window-item>
					<v-tabs-window-item v-if="bGotDuetSBCRI" value="dsfRI">
						<v-row class="pa-0 ma-0">
							<v-col cols="12" lg="8" md="8"><DispRI :ri-j-s-o-n="sbcRIJSON" :selected-tag="selectedDuetRelTag" src-type="DSFRI" /></v-col>
							<v-col cols="12" lg="4" md="4">
								<v-card variant="outlined" elevation="3" class="pa-2">
									<a v-if="fwSrc === gitOwnerNameDuet" style="color: green; cursor: pointer" @click="hlpLinkClick(dsfUpdateInsURL)">{{ t("dsfUpdateInstructions") }}</a>
								</v-card>
							</v-col>
						</v-row>
					</v-tabs-window-item>
					<v-tabs-window-item v-if="bHiddenDuetMenu && bGotDuetRI" value="admin">
						<v-row class="pa-0 ma-0">
							<v-col cols="12" lg="8" md="8"><DispAdminRN :rn-admin-j-s-o-n="duetAdminRNJSON" :r-mgr-data="relMgrData" :selected-tag="selectedDuetRelTag" :s-r-n-ovr-rd="sReleaseTagOverride" /></v-col>
							<v-col cols="12" lg="4" md="4"><DispRNFiles :ri-j-s-o-n="duetRIJSON" :selected-tag="selectedDuetRelTag" :b-show-overlay="bShowOverlay" /></v-col>
						</v-row>
					</v-tabs-window-item>
				</v-tabs-window>
			</v-card>

			<!-- Couldn't reach GitHub -->
			<v-row v-if="!bGotRelMgrData" class="pa-0 ma-0" justify="center" align="center">
				<v-card class="pa-2 ma-2 mt-4 text-center" width="75%">
					<!-- eslint-disable-next-line vue/no-v-html -->
					<div style="color: red" class="text-h5" v-html="t('connErr')"></div>
				</v-card>
			</v-row>

			<!-- Splash / intro when nothing is selected yet -->
			<v-row v-if="bGotRelMgrData && bGotSplashJSON && !currView" class="pa-0 ma-0" justify="center" align="center">
				<v-container fluid class="pa-0 ma-0"><DispSplash :ri-j-s-o-n="splashJSON" class="fill-height" /></v-container>
			</v-row>
			<v-row v-if="bGotRelMgrData && !bGotSplashJSON && !currView" class="pa-0 ma-0" justify="center" align="center">
				<v-card class="pa-2 ma-2 text-center" width="75%">
					<!-- eslint-disable-next-line vue/no-v-html -->
					<div class="text-body-1" v-html="t('notice')"></div>
					<v-btn size="small" color="info" @click="gotoForum">{{ t("noticeForum") }}</v-btn>
				</v-card>
			</v-row>
		</v-card>

		<editGlobalSettingsDialog v-model:shown="bShowEditGlobalSettingsDialog" :sys-data="relMgrSession" @save="callSaveSettings" />
	</v-container>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { marked } from "marked";

import i18n from "@/i18n";
import { useMachineStore } from "@/stores/machine";

import DispRN from "./DispRN.vue";
import DispRI from "./DispRI.vue";
import DispRNFiles from "./DispRNFiles.vue";
import DispAdminRN from "./DispAdminRN.vue";
import DispSplash from "./DispSplash.vue";
import editGlobalSettingsDialog from "./editGlobalSettingsDialog.vue";
import { getByGitAPI, getByGitFileRaw, getByGitWikiRaw } from "./model/git";
import { loadSettings, saveSettings } from "./model/settings";
import { DATA_OWNER, DATA_REPO } from "./model/constants";

import { AboutDialog } from "dwc-plugin-runtime";
import {
	applying, applyUpdateNow, checking, pendingReload, runUpdateCheck,
	setUpdateChecksEnabled, updateChecksEnabled, updateState,
} from "./model/updateCheck";

/* eslint-disable @typescript-eslint/no-explicit-any */

const machineStore = useMachineStore();
const t = (key: string) => i18n.global.t(`plugins.releaseMgr.${key}`);

const aboutOpen = ref(false);
const autoCheck = ref(updateChecksEnabled());
const aboutDescription = "Highlights the parts of an RRF / DWC / DSF release that matter for your config and connected hardware.";
function onCheckUpdate(): void { void runUpdateCheck({ force: true }); }
function onToggleAutoCheck(v: boolean): void { autoCheck.value = v; setUpdateChecksEnabled(v); }

// GitHub coordinates.
const gitOwnerNameDuet = "Duet3D";
const gitOwnerNameGloomy = "gloomyandy";
const gitRepoNameDuet = "RepRapFirmware";
const gitSBCRepoNameDuet = "DuetSoftwareFramework";
const gitDWCRepoNameDuet = "DuetWebControl";
const gitRepoNameGloomy = "RepRapFirmware";
const gitRepoNameGloomyESP = "DuetWiFiSocketServer";
const gitRelMgrSplashURL = "main/RelMgrData/splash/";
const gitRelMgrDataURL = "main/RelMgrData/RelMgrData.json";

const dsfUpdateInsURL = "https://docs.duet3d.com/User_manual/Machine_configuration/DSF_RPi#installing-updates";
const rrfUpdateInsURL = "https://docs.duet3d.com/User_manual/RepRapFirmware/Updating_firmware";
const gloomyGenUpdateInsURL = "https://teamgloomy.github.io/";

// State (the old data()).
const allDuetReleasesJSON = ref<any>(null);
const allSBCReleasesJSON = ref<any>(null);
const allGloomyReleasesJSON = ref<any>(null);
const allGloomyESPReleasesJSON = ref<any>(null);
const allDWCReleasesJSON = ref<any>(null);
const bGotAllSBCReleases = ref(false);
const bGotAllDWCReleases = ref(false);
const bGotSplashJSON = ref(false);
const splashJSON = ref<any>(null);
const relMgrData = ref<any>({});
const duetRNJSON = ref<any>({});
const duetRIJSON = ref<any>({});
const gloomyRIJSON = ref<any>({});
const gloomyESPRIJSON = ref<any>({});
const gloomyRNJSON = ref<any>({});
const sbcRIJSON = ref<any>({});
const sbcRNJSON = ref<any>({});
const dwcRIJSON = ref<any>({});
const dwcRNJSON = ref<any>({});
const duetAdminRNJSON = ref<any>({});
const bShowPreRelease = ref(false);
const bShowAllReleases = ref(false);
const selectedDuetRelTag = ref<any>(null);
const selectedGloomyRelTag = ref<any>(null);
const bGotDuetRI = ref(false);
const bGotDuetSBCRI = ref(false);
const bGotDuetDWCRI = ref(false);
const bGotRelMgrData = ref(false);
const bShowGloomyReleases = ref(false);
const bGotGloomyRI = ref(false);
const currDSFTag = ref<any>(null);
const currDWCTag = ref<any>(null);
const currView = ref<string | null>(null);
const currTab = ref<string | null>(null);
const bShowEditGlobalSettingsDialog = ref(false);
const relMgrSession = reactive(loadSettings());
const sReleaseTagOverride = ref("");

// Computeds.
const systemDSFVerStr = computed(() => { try { return (machineStore.model as any).sbc; } catch { return null; } });
const fwSrc = computed(() => {
	const boards = (machineStore.model as any).boards;
	if (typeof boards?.[0] !== "undefined") {
		const name = boards[0].firmwareName;
		return (name?.toLowerCase().includes("duet") || name === "") ? gitOwnerNameDuet : gitOwnerNameGloomy;
	}
	return "No Board Connected";
});
const fwSrcFriendlyName = computed(() => fwSrc.value === gitOwnerNameGloomy ? "Team Gloomy" : "Official Duet 3D");
const fwVer = computed(() => { try { return (machineStore.model as any).boards[0].firmwareVersion; } catch { return "Not Connected"; } });
const conBoards = computed<any>(() => { try { return (machineStore.model as any).boards; } catch { return []; } });
const bHiddenTestData = computed(() => {
	try { const g = (machineStore.model as any).global; return !!(g?.has?.("releaseMgrTestData") && g.get("releaseMgrTestData")); } catch { return false; }
});
const bHiddenDuetMenu = computed(() => {
	try { const g = (machineStore.model as any).global; return !!(g?.has?.("releaseMgrDuet") && g.get("releaseMgrDuet")); } catch { return false; }
});
const bIsSBC = computed(() => {
	if (systemDSFVerStr.value !== null && systemDSFVerStr.value !== "") { return true; }
	return bHiddenTestData.value;
});
const bShowOverlay = computed(() => fwSrc.value === gitOwnerNameGloomy && (currTab.value === "rrfRN" || currTab.value === "rrfRI"));

const duetFilteredTags = computed<any>(() => {
	const out: any = [];
	const all = allDuetReleasesJSON.value ?? [];
	for (let j = 0; j < all.length; j++) {
		const rel = all[j];
		if (rel.prerelease && bShowPreRelease.value && bShowAllReleases.value) { out.push({ text: rel.tag_name, value: rel.tag_name }); }
		else if (rel.prerelease && bShowPreRelease.value && !bShowAllReleases.value && j === 0) { out.push({ text: rel.tag_name, value: rel.tag_name }); }
		else if (rel.prerelease && !bShowPreRelease.value) { continue; }
		else if (!rel.prerelease) { out.push({ text: rel.tag_name, value: rel.tag_name }); }
	}
	return out;
});
const gloomyFilteredTags = computed<any>(() => {
	const out: any = [];
	for (const rel of allGloomyReleasesJSON.value ?? []) {
		if (rel.prerelease && !bShowPreRelease.value) { continue; }
		out.push({ text: rel.tag_name, value: rel.tag_name });
	}
	return out;
});

// --- GitHub fetch + parsing (ported logic) ---

async function getAllReleasesJSON(gitUName: string, gitRepoName: string): Promise<any> {
	if (!gitUName || !gitRepoName) { return null; }
	const relJSON: any = await getByGitAPI("releases", gitUName, gitRepoName);
	if (!relJSON) { console.warn("[ReleaseMgr] getAllReleasesJSON: no data"); return null; }
	let filtered = [...relJSON].sort((a: any, b: any) => (a.published_at < b.published_at) ? 1 : -1);
	if (gitUName === gitOwnerNameDuet && gitRepoName === gitRepoNameDuet) {
		filtered = relJSON.filter((item: { tag_name: string }) => item.tag_name >= "3.5" && item.tag_name.charAt(0) !== "v");
	}
	if (gitUName === gitOwnerNameDuet && gitRepoName === gitDWCRepoNameDuet) { return relJSON; }
	if (gitUName === gitOwnerNameGloomy && gitRepoName === gitRepoNameGloomy) {
		filtered = filtered.filter((item: { tag_name: string }) => item.tag_name >= "v3.5");
		bShowGloomyReleases.value = true;
	}
	return filtered;
}

async function getRelMgrData(): Promise<boolean> {
	const text = await getByGitFileRaw(gitRelMgrDataURL, DATA_OWNER, DATA_REPO);
	try {
		const parsed = text ? JSON.parse(text) : null;
		if (parsed && Array.isArray(parsed.boards)) {
			relMgrData.value = parsed;
			bGotRelMgrData.value = true;
			return true;
		}
	} catch { /* fall through */ }
	relMgrData.value = {};
	bGotRelMgrData.value = false;
	return false;
}

async function configSplash(): Promise<boolean> {
	for (const splash of splashJSON.value.splashes) {
		splash.mdTxt = await getByGitFileRaw(`${gitRelMgrSplashURL}${splash.file}`, DATA_OWNER, DATA_REPO);
	}
	return true;
}

async function startUp(): Promise<void> {
	bGotRelMgrData.value = false;
	if (await getRelMgrData()) {
		allDuetReleasesJSON.value = await getAllReleasesJSON(gitOwnerNameDuet, gitRepoNameDuet);
		if (fwSrc.value === gitOwnerNameGloomy) {
			allGloomyReleasesJSON.value = await getAllReleasesJSON(gitOwnerNameGloomy, gitRepoNameGloomy);
			allGloomyESPReleasesJSON.value = await getAllReleasesJSON(gitOwnerNameGloomy, gitRepoNameGloomyESP);
		}
		if (!bGotSplashJSON.value) {
			const raw = await getByGitFileRaw(`${gitRelMgrSplashURL}splash.json`, DATA_OWNER, DATA_REPO);
			try { splashJSON.value = raw ? JSON.parse(raw) : null; } catch { splashJSON.value = null; }
			if (splashJSON.value) { bGotSplashJSON.value = await configSplash(); }
		}
	}
}

function doFormatBold(str: string): string {
	return str.replace(/\*{2}(.*?)\*{2}/g, "<strong>$1</strong>") || str;
}

function doFormatLink(str: string): string {
	const strArr: any = str.match(/(?<!!)\[{1}(.*?)\]{1}\(http(.*?)\)/g);
	let newStr = str;
	for (const m of strArr ?? []) {
		const refPos = m.indexOf("(http");
		const tmpRef = m.substring(refPos + 1, m.length - 1);
		const txtPos = m.indexOf("]");
		const tmpTxt = m.substring(1, txtPos);
		newStr = newStr.replace(m, `<a title="${tmpRef}" onclick="window.open(this.title, '_blank')" style="color: green">${tmpTxt}</a>`);
	}
	return newStr;
}

function convertRNtoJSON(rnRawMD: any, strType: string, gitUName: string, gitTagName: string, gitRepoName: string): any {
	if (!rnRawMD || !strType || !gitUName || !gitTagName) { console.warn("[ReleaseMgr] convertRNtoJSON: missing args"); return null; }
	rnRawMD = doFormatBold(rnRawMD);
	rnRawMD = doFormatLink(rnRawMD);
	const rnArray: any = rnRawMD.split(/\r?\n/);
	let rnJSON: any = { lines: [] };
	for (const line of rnArray) { rnJSON.lines.push({ line }); }
	rnJSON.lines = rnJSON.lines.filter((item: { line: string }) => item.line !== "");
	for (const f of relMgrData.value.duetRNFilters ?? []) {
		rnJSON.lines = rnJSON.lines.filter((item: { line: string }) => !item.line.toLowerCase().includes(f));
	}
	rnJSON.lines = rnJSON.lines.filter((item: { line: string }) => !item.line.toLowerCase().includes("===="));

	const newRNJSON: any = { releases: [], relType: strType, selTag: gitTagName, gUName: gitUName, class: "rn", gRName: gitRepoName };
	let currSecStr = "";
	let currRelStr = "";
	const strIndex = gitRepoName === gitRepoNameDuet ? "reprapfirmware " : "version ";
	for (const lw of rnJSON.lines) {
		const line: string = lw.line;
		if (line.toLowerCase().indexOf(strIndex) === 0) {
			newRNJSON.releases.push({ release: line, sections: [], color: "", hover: "", hwMatch: false, confGMatch: false, fileMatch: false });
			currRelStr = line;
		} else if (line.slice(-1) === ":" && line.charAt(0) !== "-") {
			for (const rel of newRNJSON.releases) {
				if (rel.release === currRelStr) {
					rel.sections.push({ section: line, lines: [], color: "", hover: "", hwMatch: false, confGMatch: false, fileMatch: false });
					currSecStr = line;
				}
			}
		} else {
			for (const rel of newRNJSON.releases) {
				if (rel.release === currRelStr) {
					for (const sec of rel.sections) {
						if (sec.section === currSecStr) {
							const html = marked.parse(line, { gfm: true }) as string;
							sec.lines.push({ line: { text: html, color: "", hover: "", hwMatch: false, hwHover: "", confGMatch: false, fileMatch: false, fileHover: "" } });
						}
					}
				}
			}
		}
	}
	// Move the configured "Upgrade notes:" section to the top of each release.
	for (const rel of newRNJSON.releases) {
		for (let f = 0; f < rel.sections.length; f++) {
			if (rel.sections[f].section === relMgrData.value.duetRNSection) {
				const tmpSec = rel.sections[f];
				rel.sections.splice(f, 1);
				rel.sections.unshift(tmpSec);
			}
		}
	}
	return newRNJSON;
}

async function getReleaseNotes(gitUName: string, gitRepoName: string, gitTagName: string): Promise<any> {
	if (!gitUName || !gitRepoName || !gitTagName) { return null; }
	if (gitUName !== gitOwnerNameDuet) { return null; }
	const majorVNumStr = gitTagName.substring(0, 1);
	const isBeta = gitTagName.toLowerCase().includes("beta");
	const isRC = gitTagName.toLowerCase().includes("rc");
	let prefix = "RRF";
	if (gitRepoName === gitDWCRepoNameDuet) { prefix = "DWC"; }
	else if (gitRepoName === gitSBCRepoNameDuet) { prefix = "DSF"; }
	let tmpFName: string;
	let rnType: string;
	if (isBeta) { tmpFName = `Changelog-${prefix}-${majorVNumStr}.x-Beta.md`; rnType = "Beta"; }
	else if (isRC) { tmpFName = `Changelog-${prefix}-${majorVNumStr}.x-RC.md`; rnType = "RC"; }
	else { tmpFName = `Changelog-${prefix}-${majorVNumStr}.x.md`; rnType = "Full"; }

	const relText = await getByGitWikiRaw(tmpFName, gitUName, gitRepoName);
	if (!relText) { console.warn("[ReleaseMgr] getReleaseNotes: no data"); return null; }
	if (gitRepoName === gitRepoNameDuet) { return convertRNtoJSON(relText, rnType, gitUName, gitTagName, gitRepoName); }
	if (gitRepoName === gitDWCRepoNameDuet) { return convertRNtoJSON(relText, rnType, gitUName, currDWCTag.value, gitRepoName); }
	if (gitRepoName === gitSBCRepoNameDuet) { return convertRNtoJSON(relText, rnType, gitUName, currDSFTag.value, gitRepoName); }
	return null;
}

async function getDuetSBCDWCRI(tmpTag: string, gitRepoName: string): Promise<any> {
	const majorVNumStr = tmpTag.substring(0, 1);
	const minorVNumStr = tmpTag.substring(2, 3);
	const subVNumStr = tmpTag.substring(4, 5);
	const prefix2 = `${majorVNumStr}.${minorVNumStr}.${subVNumStr}`;
	let prefix = prefix2;
	let suffix = "";
	if (tmpTag.toLowerCase() === "3.5.0beta1") { prefix = "3.5"; suffix = "-b1"; }
	else if (tmpTag.toLowerCase() === "3.5.0beta2") { prefix = "3.5.0"; suffix = "-beta.2"; }
	else if (tmpTag.toLowerCase().includes("beta")) { suffix = `-beta.${parseInt(tmpTag.slice(tmpTag.toLowerCase().indexOf("beta") + 5))}`; }
	else if (tmpTag.toLowerCase().includes("rc")) { suffix = `-rc.${parseInt(tmpTag.slice(tmpTag.toLowerCase().indexOf("rc") + 3))}`; }
	let dsfTag = `${prefix}${suffix}`;

	const isDWC = gitRepoName === gitDWCRepoNameDuet;
	if (isDWC && !bGotAllDWCReleases.value) {
		allDWCReleasesJSON.value = await getByGitAPI("releases", gitOwnerNameDuet, gitDWCRepoNameDuet);
		bGotAllDWCReleases.value = true;
	} else if (!isDWC && !bGotAllSBCReleases.value) {
		allSBCReleasesJSON.value = await getByGitAPI("releases", gitOwnerNameDuet, gitSBCRepoNameDuet);
		bGotAllSBCReleases.value = true;
	}
	const pool: any = (isDWC ? allDWCReleasesJSON.value : allSBCReleasesJSON.value) ?? [];
	let curr = pool.filter((item: { tag_name: string }) => item.tag_name === dsfTag);
	if (curr.length === 0) {
		dsfTag = `v${prefix2}${suffix}`;
		curr = pool.filter((item: { tag_name: string }) => item.tag_name === dsfTag);
	}
	if (curr.length > 0) {
		if (isDWC) { bGotDuetDWCRI.value = true; currDWCTag.value = dsfTag; }
		else { bGotDuetSBCRI.value = true; currDSFTag.value = dsfTag; }
		return curr;
	}
	return [];
}

async function selectedDuetTag(tmpTag: any): Promise<void> {
	if (!tmpTag) { return; }
	selectedDuetRelTag.value = tmpTag;
	bGotDuetRI.value = false;
	duetRNJSON.value = {};
	duetRIJSON.value = { body: "" };
	duetRNJSON.value = await getReleaseNotes(gitOwnerNameDuet, gitRepoNameDuet, tmpTag);
	duetAdminRNJSON.value = JSON.parse(JSON.stringify(duetRNJSON.value ?? {}));
	let ri = (allDuetReleasesJSON.value ?? []).filter((item: { tag_name: string }) => item.tag_name === tmpTag);
	if (ri.length > 0) { duetRIJSON.value = ri[0]; bGotDuetRI.value = true; }

	// DWC release details (RI first, then RN).
	bGotDuetDWCRI.value = false;
	dwcRNJSON.value = {};
	dwcRIJSON.value = { body: "" };
	let dwc = await getDuetSBCDWCRI(tmpTag, gitDWCRepoNameDuet);
	if (dwc.length > 0) {
		dwcRIJSON.value = dwc[0];
		dwcRNJSON.value = await getReleaseNotes(gitOwnerNameDuet, gitDWCRepoNameDuet, tmpTag);
		if (bIsSBC.value) {
			bGotDuetSBCRI.value = false;
			sbcRNJSON.value = {};
			sbcRIJSON.value = { body: "" };
			const sbc = await getDuetSBCDWCRI(tmpTag, gitSBCRepoNameDuet);
			if (sbc.length > 0) {
				sbcRIJSON.value = sbc[0];
				sbcRNJSON.value = await getReleaseNotes(gitOwnerNameDuet, gitSBCRepoNameDuet, tmpTag);
			}
		}
	}
	currView.value = "duet";
	currTab.value = "rrfRN";
}

async function doGloomyRelease(tmpTag: string): Promise<void> {
	gloomyRIJSON.value = { body: "" };
	gloomyRNJSON.value = { body: "" };
	let ri = (allGloomyReleasesJSON.value ?? []).filter((item: { tag_name: string }) => item.tag_name === tmpTag);
	gloomyRIJSON.value = ri[0];
	const hrefArr = gloomyRIJSON.value.body.match(/https:.*WHATS_NEW_UNIFIED.md/g);
	if (!hrefArr) { return; }
	let tmpStr = hrefArr[0].replace("https://github.com/gloomyandy/RepRapFirmware/blob/", "");
	const tmpTxt = await getByGitFileRaw(tmpStr, gitOwnerNameGloomy, gitRepoNameGloomy);
	const espArr = gloomyRIJSON.value.body.match(/\(https:\/\/github.com\/gloomyandy\/DuetWiFiSocketServer\/releases\/tag\/(v|V).*\d\)/g);
	if (espArr) {
		const v = espArr[0].match(/(v|V)\d.*\d/g);
		if (v && v[0]) {
			const esp = (allGloomyESPReleasesJSON.value ?? []).filter((item: { tag_name: string }) => item.tag_name === v[0]);
			gloomyESPRIJSON.value = esp[0];
		}
	}
	gloomyRNJSON.value = { body: tmpTxt };
	bGotGloomyRI.value = true;
	currView.value = "gloomy";
	currTab.value = "gloomyRN";
}

async function selectedGloomyTag(tmpTag: string): Promise<void> {
	if (!tmpTag) { return; }
	selectedGloomyRelTag.value = tmpTag;
	bGotGloomyRI.value = false;
	currView.value = null;
	await doGloomyRelease(tmpTag);
}

function resetAll(): void {
	bGotDuetRI.value = false;
	bGotDuetSBCRI.value = false;
	bGotGloomyRI.value = false;
	bGotDuetDWCRI.value = false;
	selectedDuetRelTag.value = null;
	selectedGloomyRelTag.value = null;
	currView.value = null;
	currTab.value = null;
}

function onTogglePreRelease(v: boolean | null): void {
	bShowPreRelease.value = !!v;
	if (!bShowPreRelease.value) { bShowAllReleases.value = false; }
	resetAll();
}
function onToggleAllReleases(v: boolean | null): void {
	bShowAllReleases.value = !!v;
	resetAll();
}
function refresh(): void {
	resetAll();
	bShowGloomyReleases.value = false;
	void startUp();
}
function callSaveSettings(): void { saveSettings(relMgrSession); }
function gotoForum(): void { window.open("https://forum.duet3d.com/topic/27582", "_blank"); }
function hlpLinkClick(url: string): void { window.open(url, "_blank"); }

watch([bShowPreRelease, bShowAllReleases], resetAll);

void startUp();
</script>

<style scoped>
.rlMgrVchip { white-space: normal !important; height: auto !important; text-align: center !important; min-height: 35px !important; }
</style>
