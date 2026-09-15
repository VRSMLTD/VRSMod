<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { getStore } from '../../../providers/generic/store/StoreProvider';
import { State } from '../../../store';
import ManagerSettings from '../../../r2mm/manager/ManagerSettings';
import ThemeManager, { THEMES } from '../../../r2mm/manager/ThemeManager';
import SettingsViewWrapper from '../SettingsViewWrapper.vue';
import { useSettingSearch } from '../../composables/SettingSearchComposable';

const store = getStore<State>();
const settings = ref<ManagerSettings | null>(null);
const theme = ref<string>(THEMES[0]!.slug);

const props = defineProps<{
    searchTerm?: string;
}>();

const { isVisible } = useSettingSearch(() => props.searchTerm, [
    'Theme',
    'Appearance',
    ...THEMES.map(t => t.label),
]);

onMounted(async () => {
    settings.value = await ManagerSettings.getSingleton(store.state.activeGame);
    theme.value = settings.value.getContext().global.themeName;
});

async function setTheme(value: string) {
    theme.value = value;
    if (settings.value) {
        await settings.value.setThemeName(value);
    }
    await ThemeManager.apply();
}
</script>

<template>
    <SettingsViewWrapper v-show="isVisible">
        <template #title>Theme</template>
        <template #description>
            Choose an appearance for the manager.
        </template>
        <select
            class="select"
            :value="theme"
            @change="setTheme(($event.target as HTMLSelectElement).value)"
        >
            <option v-for="t in THEMES" :key="t.slug" :value="t.slug">
                {{ t.label }}
            </option>
        </select>
    </SettingsViewWrapper>
</template>
