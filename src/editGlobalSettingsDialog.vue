<template>
	<v-dialog v-model="innerShown" persistent width="60vw" @keydown.escape="dismissed">
		<v-card class="TUICardDVars" height="40vh">
			<v-card-title>
				<v-row justify="center" class="mt-2">
					<v-chip color="info"><span class="text-h6">{{ t("settingsTitle") }}</span></v-chip>
				</v-row>
			</v-card-title>
			<v-row dense class="pa-0 ma-0" justify="center">
				<v-col cols="12">
					<v-tooltip location="bottom" :text="t('switchGSCheckOnLoadHover')">
						<template #activator="{ props }">
							<v-row v-bind="props" dense class="pa-0 ma-0" justify="center">
								<v-switch v-model="sysData.checkOnLoad" color="primary" hide-details
										  :label="t('switchGSCheckOnLoad')" />
							</v-row>
						</template>
					</v-tooltip>
				</v-col>
			</v-row>
			<v-row dense class="pa-0 ma-0" justify="center">
				<v-col cols="12">
					<v-tooltip location="bottom" :text="t('switchGSAlertOnceHover')">
						<template #activator="{ props }">
							<v-row v-bind="props" dense class="pa-0 ma-0" justify="center">
								<v-switch v-model="sysData.alertOnce" color="primary" hide-details
										  :label="t('switchGSAlertOnce')" />
							</v-row>
						</template>
					</v-tooltip>
				</v-col>
			</v-row>
			<v-row class="pa-0 ma-0 mb-6" justify="center" align="center">
				<v-tooltip location="bottom" :text="t('settingsSave')">
					<template #activator="{ props }">
						<v-btn rounded class="mr-2" color="info" v-bind="props" @click="dismissed">
							{{ t("settingsSave") }}
						</v-btn>
					</template>
				</v-tooltip>
			</v-row>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";

import i18n from "@/i18n";

import type { ReleaseMgrSettings } from "./model/settings";

const props = defineProps<{ shown: boolean; sysData: ReleaseMgrSettings }>();
const emit = defineEmits<{ save: []; "update:shown": [boolean] }>();

const t = (key: string) => i18n.global.t(`plugins.releaseMgr.${key}`);

const innerShown = computed({
	get: () => props.shown,
	set: (v: boolean) => emit("update:shown", v),
});

function dismissed(): void {
	emit("save");
	emit("update:shown", false);
}
</script>

<style scoped>
.TUICardDVars {
	overflow-y: auto;
	overflow-x: hidden;
}
</style>
