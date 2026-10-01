<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { getStore } from '../../../providers/generic/store/StoreProvider';
import { State } from '../../../store';
import ManagerSettings from '../../../r2mm/manager/ManagerSettings';
import ThemeManager, { THEMES } from '../../../r2mm/manager/ThemeManager';
import { CUSTOM_THEME_PREFIX, CustomTheme } from '../../../r2mm/manager/ThemeDerivation';
import SettingsViewWrapper from '../SettingsViewWrapper.vue';
import CustomThemeEditorModal from './CustomThemeEditorModal.vue';
import { useSettingSearch } from '../../composables/SettingSearchComposable';

const store = getStore<State>();
const settings = ref<ManagerSettings | null>(null);
const theme = ref<string>(THEMES[0]!.slug);
const customThemes = ref<CustomTheme[]>([]);
const isEditorOpen = ref<boolean>(false);
const editingTheme = ref<CustomTheme | null>(null);

const props = defineProps<{
    searchTerm?: string;
}>();

const { isVisible } = useSettingSearch(() => props.searchTerm, [
    'Theme',
    'Appearance',
    ...THEMES.map(t => t.label),
]);

const activeCustomTheme = computed<CustomTheme | undefined>(() => {
    if (!theme.value.startsWith(CUSTOM_THEME_PREFIX)) {
        return undefined;
    }
    const id = theme.value.slice(CUSTOM_THEME_PREFIX.length);
    return customThemes.value.find(t => t.id === id);
});

onMounted(async () => {
    settings.value = await ManagerSettings.getSingleton(store.state.activeGame);
    theme.value = settings.value.getContext().global.themeName;
    customThemes.value = settings.value.getCustomThemes();
});

async function setTheme(value: string) {
    theme.value = value;
    if (settings.value) {
        await settings.value.setThemeName(value);
    }
    await ThemeManager.apply();
}

function openCreateEditor() {
    editingTheme.value = null;
    isEditorOpen.value = true;
}

function openEditEditor(custom: CustomTheme) {
    editingTheme.value = custom;
    isEditorOpen.value = true;
}

async function onThemeSaved(saved: CustomTheme) {
    if (settings.value) {
        await settings.value.saveCustomTheme(saved);
        customThemes.value = settings.value.getCustomThemes();
    }
    await setTheme(`${CUSTOM_THEME_PREFIX}${saved.id}`);
}

async function onThemeDeleted(id: string) {
    if (!settings.value) {
        return;
    }
    await settings.value.deleteCustomTheme(id);
    customThemes.value = settings.value.getCustomThemes();
    if (theme.value === `${CUSTOM_THEME_PREFIX}${id}`) {
        await setTheme(THEMES[0]!.slug);
    }
}
</script>

<template>
    <SettingsViewWrapper v-show="isVisible">
        <template #title>Theme</template>
        <template #description>
            Choose an appearance for the manager, or create your own.
        </template>
        <select
            class="select"
            :value="theme"
            @change="setTheme(($event.target as HTMLSelectElement).value)"
        >
            <optgroup label="Built-in">
                <option v-for="t in THEMES" :key="t.slug" :value="t.slug">
                    {{ t.label }}
                </option>
            </optgroup>
            <optgroup label="Custom" v-if="customThemes.length > 0">
                <option v-for="t in customThemes" :key="t.id" :value="`${CUSTOM_THEME_PREFIX}${t.id}`">
                    {{ t.label }}
                </option>
            </optgroup>
        </select>
        <button class="button is-ghost" @click="openCreateEditor">Create custom theme</button>
        <button v-if="activeCustomTheme" class="button is-ghost" @click="openEditEditor(activeCustomTheme)">Edit</button>
    </SettingsViewWrapper>
    <CustomThemeEditorModal
        v-model="isEditorOpen"
        :editing-theme="editingTheme"
        @saved="onThemeSaved"
        @deleted="onThemeDeleted"
    />
</template>
