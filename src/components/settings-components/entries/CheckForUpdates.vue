<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import VersionNumber from '../../../model/VersionNumber';
import ManagerInformation from '../../../_managerinf/ManagerInformation';
import { UpdateStatus } from '../../../model/UpdateStatus';
import SettingsViewWrapper from '../SettingsViewWrapper.vue';
import { useSettingSearch } from '../../composables/SettingSearchComposable';

const props = defineProps<{
    searchTerm?: string;
}>();

const { isVisible } = useSettingSearch(() => props.searchTerm, [
    'Check for updates',
    'Update',
]);

const currentVersion = ref<VersionNumber>(ManagerInformation.VERSION);
const status = ref<UpdateStatus>({ state: 'idle' });

onMounted(() => {
    window.app.onUpdateStatus((newStatus) => {
        status.value = newStatus;
    });
});

function checkNow() {
    window.app.checkForApplicationUpdates();
}

function installNow() {
    window.app.installUpdate();
}
</script>

<template>
    <SettingsViewWrapper v-show="isVisible">
        <template #title>Check for updates</template>
        <template #description>
            Current version: {{ currentVersion.toString() }}
        </template>

        <template v-if="status.state === 'idle' || status.state === 'not-available'">
            <button class="button" @click="checkNow">Check for updates</button>
            <span v-if="status.state === 'not-available'" class="tag is-success margin-left margin-left--half-width">
                You're up to date
            </span>
        </template>

        <template v-else-if="status.state === 'checking'">
            <button class="button" disabled>Checking for updates...</button>
        </template>

        <template v-else-if="status.state === 'available'">
            <span class="tag is-info">Update {{ status.version }} found, downloading...</span>
        </template>

        <template v-else-if="status.state === 'downloading'">
            <span class="tag is-info">Downloading update: {{ Math.round(status.percent) }}%</span>
        </template>

        <template v-else-if="status.state === 'downloaded'">
            <button class="button is-info" @click="installNow">
                Restart to install {{ status.version }}
            </button>
        </template>

        <template v-else-if="status.state === 'error'">
            <button class="button" @click="checkNow">Check for updates</button>
            <span class="tag is-danger margin-left margin-left--half-width">{{ status.message }}</span>
        </template>
    </SettingsViewWrapper>
</template>
