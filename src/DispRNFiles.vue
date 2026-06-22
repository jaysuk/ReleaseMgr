<template>
	<v-card variant="outlined" elevation="3" class="rMgrv-cardRNFiles pa-0 ma-0">
		<v-card-title>{{ riJSON?.name }} Files</v-card-title>
		<v-card-text class="rMgrv-cardRNFiles__text">
			<v-overlay v-model="bSOvrlay" contained class="align-center justify-center text-center">
				<v-chip>{{ t("filesNotAvail") }}</v-chip>
				<v-btn rounded class="mr-2 mt-2" color="info" @click="bSOvrlay = false">
					{{ t("filesNotAvail2") }}
				</v-btn>
			</v-overlay>
			<span v-for="(fileLink, i) in riJSON?.assets ?? []" :key="i">
				<a :title="fileLink.browser_download_url" style="color: green; cursor: pointer"
				   @click="assetClick(fileLink.browser_download_url)">{{ fileLink.name }}</a><br>
			</span>
		</v-card-text>
	</v-card>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

import i18n from "@/i18n";

interface ReleaseLike { name?: string; assets?: Array<{ name: string; browser_download_url: string }> }

const props = defineProps<{ riJSON?: ReleaseLike; selectedTag?: string; bShowOverlay?: boolean }>();

const t = (key: string) => i18n.global.t(`plugins.releaseMgr.${key}`);

const bSOvrlay = ref(!!props.bShowOverlay);
watch(() => props.bShowOverlay, (v) => { bSOvrlay.value = !!v; });

function assetClick(url: string): void {
	window.open(url, "_blank");
}
</script>

<style scoped>
.rMgrv-cardRNFiles {
	display: flex !important;
	flex-direction: column;
	height: calc((100vh - 340px) / 2);
}
.rMgrv-cardRNFiles__text {
	flex-grow: 1;
	overflow-y: auto;
	overflow-x: hidden;
}
</style>
