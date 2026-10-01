<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { getStore } from '../../../providers/generic/store/StoreProvider';
import { State } from '../../../store';
import ManagerSettings from '../../../r2mm/manager/ManagerSettings';
import SettingsViewWrapper from '../SettingsViewWrapper.vue';
import { useSettingSearch } from '../../composables/SettingSearchComposable';

const store = getStore<State>();

const props = defineProps<{
    searchTerm?: string;
}>();

const settings = ref<ManagerSettings | null>(null);
const hexiumEnabled = ref<boolean>(false);

const { isVisible } = useSettingSearch(() => props.searchTerm, [
    'Hexium',
    'Also check Hexium',
    'Second mod source',
]);

onMounted(async () => {
    settings.value = await ManagerSettings.getSingleton(store.state.activeGame);
    hexiumEnabled.value = settings.value.getContext().global.hexiumEnabled;
});

async function setHexiumEnabled(enabled: boolean) {
    hexiumEnabled.value = enabled;
    await settings.value?.setHexiumEnabled(enabled);
}
</script>

<template>
    <SettingsViewWrapper v-show="isVisible">
        <template #title>Also check Hexium</template>
        <template #description>
            Show mods from Hexium alongside Thunderstore, for the games it currently supports.
            Hexium can't verify who actually publishes a mod there the way Thunderstore can,
            so you'll be asked to confirm before installing anything from it.
        </template>
        <div class="field" @click.prevent.stop="setHexiumEnabled(!hexiumEnabled)">
            <input
                id="switch-hexium-enabled"
                type="checkbox"
                :class="['switch', { 'is-info': hexiumEnabled }]"
                :checked="hexiumEnabled"
            />
            <label for="switch-hexium-enabled">{{ hexiumEnabled ? 'On' : 'Off' }}</label>
        </div>
    </SettingsViewWrapper>
</template>
