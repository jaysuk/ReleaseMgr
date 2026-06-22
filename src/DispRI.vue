<template>
	<v-card variant="outlined" elevation="3" class="rMgrv-mainCardRLM pa-0 ma-0">
		<v-card-title>{{ riJSON?.name }}</v-card-title>
		<v-card-text class="rMgrv-cardRLM__text">
			<!-- eslint-disable-next-line vue/no-v-html -->
			<div v-html="panelHTML"></div>
		</v-card-text>
	</v-card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { marked } from "marked";

interface ReleaseLike { name?: string; body?: string }

const props = defineProps<{ riJSON?: ReleaseLike; selectedTag?: string; srcType?: string }>();

/** Render the release body markdown, rewriting anchors to open in a new tab (green, click-to-open). */
const panelHTML = computed(() => {
	const body = props.riJSON?.body;
	if (!body) {
		return "";
	}
	// Team Gloomy notes pack their lines tightly; insert explicit breaks for readability.
	const markdown = props.srcType === "gloomyRN" ? body.replace(/\n(?=\n)/g, "\n\n<br/>\n") : body;
	let html = marked.parse(markdown, { gfm: true, breaks: true }) as string;
	const anchorStarts = html.match(/<\s*a[^>]*/g) ?? [];
	for (const start of anchorStarts) {
		const rewritten = start.replace("href", "title");
		html = html.replace(start, `${rewritten} onclick="window.open(this.title, '_blank')" style="color: green"`);
	}
	return html;
});
</script>

<style scoped>
.rMgrv-mainCardRLM {
	max-width: 100%;
}
.rMgrv-cardRLM__text {
	overflow-y: auto;
	overflow-x: hidden;
	max-height: 90%;
}
</style>
