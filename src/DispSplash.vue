<template>
	<v-card variant="outlined" elevation="3" class="rMgrv-cardRLM">
		<v-card-text class="fill-height">
			<v-carousel show-arrows="hover" height="auto" continuous hide-delimiters>
				<v-carousel-item>
					<v-card flat class="rMgrv-CarCard">
						<v-row class="pa-2 ma-2" justify="center" align="center">
							<v-card class="pa-2 ma-2 text-center" width="75%">
								<!-- eslint-disable-next-line vue/no-v-html -->
								<div class="text-body-1" v-html="t('notice')"></div>
								<v-row class="pa-2 ma-2" justify="center" align="center">
									<v-chip class="rlMgrVchip" :style="chipStyle('#e57373')">{{ t("redTxt") }}</v-chip>
									<v-chip class="rlMgrVchip" :style="chipStyle('#bbdefb')">{{ t("blueTxt") }}</v-chip>
									<v-chip class="rlMgrVchip" :style="chipStyle('#e1bee7')">{{ t("purpleTxt") }}</v-chip>
								</v-row>
								<!-- eslint-disable-next-line vue/no-v-html -->
								<div class="text-body-1" v-html="t('noticeFooter')"></div>
								<v-btn size="small" color="info" @click="gotoForum">{{ t("noticeForum") }}</v-btn>
							</v-card>
							<v-card class="pa-2 ma-2 mt-8 text-center" width="75%">
								<!-- eslint-disable-next-line vue/no-v-html -->
								<div class="text-body-1" v-html="t('guide')"></div>
							</v-card>
						</v-row>
					</v-card>
				</v-carousel-item>
				<v-carousel-item v-for="(splash, i) in riJSON?.splashes ?? []" :key="i">
					<v-card flat class="rMgrv-CarCard">
						<v-card-text>
							<v-row class="fill-height ma-2" align="center" justify="center">
								<!-- eslint-disable-next-line vue/no-v-html -->
								<div v-html="processRIJSON(splash.mdTxt)"></div>
							</v-row>
						</v-card-text>
					</v-card>
				</v-carousel-item>
			</v-carousel>
		</v-card-text>
	</v-card>
</template>

<script setup lang="ts">
import { marked } from "marked";

import i18n from "@/i18n";

interface SplashJSON { splashes?: Array<{ file?: string; mdTxt: string }> }

defineProps<{ riJSON?: SplashJSON }>();

const t = (key: string) => i18n.global.t(`plugins.releaseMgr.${key}`);

function chipStyle(bg: string): Record<string, string> {
	return { backgroundColor: bg, color: "#000", whiteSpace: "normal", height: "auto", minHeight: "35px", textAlign: "center" };
}

/** Render markdown to HTML, rewriting anchors to open in a new tab (green, click-to-open). */
function processRIJSON(mdStr: string): string {
	let html = marked.parse(mdStr, { gfm: true, breaks: true }) as string;
	const anchors = html.match(/<a[^>]*>(.*?)<\/a>/g) ?? [];
	for (const anchor of anchors) {
		const urlMatch = anchor.match(/".*"/g);
		const textMatch = anchor.match(/>.*</g);
		if (!urlMatch || !textMatch) {
			continue;
		}
		const url = urlMatch[0].substring(1, urlMatch[0].length - 1);
		const text = textMatch[0].substring(1, textMatch[0].length - 1);
		html = html.replace(anchor, `<a title="${url}" onclick="window.open(this.title, '_blank')" style="color: green">${text}</a>`);
	}
	return html;
}

function gotoForum(): void {
	window.open("https://forum.duet3d.com/topic/27582", "_blank");
}
</script>

<style scoped>
.rMgrv-cardRLM {
	display: flex !important;
	flex-direction: column;
	height: calc(100vh - 300px);
}
.rMgrv-CarCard {
	min-height: calc(100vh - 340px);
	max-height: calc(100vh - 340px);
	flex-grow: 1;
	overflow-y: auto;
	overflow-x: hidden;
}
.rlMgrVchip:not(:last-child) {
	margin-right: 8px;
}
</style>
