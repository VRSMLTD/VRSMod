<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import UUID from 'uuid-js';
import { ModalCard } from '../../all';
import { CustomTheme, deriveThemeVariables } from '../../../r2mm/manager/ThemeDerivation';

type Props = {
    modelValue: boolean;
    editingTheme?: CustomTheme | null;
};

const props = withDefaults(defineProps<Props>(), {
    editingTheme: null,
});

const emits = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'saved', theme: CustomTheme): void;
    (e: 'deleted', id: string): void;
}>();

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

const label = ref<string>('');
const background = ref<string>('#1a1a1a');
const text = ref<string>('#e6e6e6');
const primary = ref<string>('#b0b0b0');
const danger = ref<string>('#ba7881');
const dark = ref<boolean>(true);

const isEditing = computed(() => props.editingTheme !== null);

watch(() => props.modelValue, (isOpen) => {
    if (!isOpen) {
        return;
    }
    if (props.editingTheme) {
        label.value = props.editingTheme.label;
        background.value = props.editingTheme.background;
        text.value = props.editingTheme.text;
        primary.value = props.editingTheme.primary;
        danger.value = props.editingTheme.danger;
        dark.value = props.editingTheme.dark;
    } else {
        label.value = '';
        background.value = '#1a1a1a';
        text.value = '#e6e6e6';
        primary.value = '#b0b0b0';
        danger.value = '#ba7881';
        dark.value = true;
    }
});

function sanitize(value: string, fallback: string): string {
    return HEX_PATTERN.test(value) ? value : fallback;
}

function onBackgroundBlur() {
    background.value = sanitize(background.value, '#1a1a1a');
}

function onTextBlur() {
    text.value = sanitize(text.value, '#e6e6e6');
}

function onPrimaryBlur() {
    primary.value = sanitize(primary.value, '#b0b0b0');
}

function onDangerBlur() {
    danger.value = sanitize(danger.value, '#ba7881');
}

const previewVars = computed(() => deriveThemeVariables({
    background: background.value,
    text: text.value,
    primary: primary.value,
    danger: danger.value,
    dark: dark.value,
}));

const canSave = computed(() => label.value.trim().length > 0
    && HEX_PATTERN.test(background.value)
    && HEX_PATTERN.test(text.value)
    && HEX_PATTERN.test(primary.value)
    && HEX_PATTERN.test(danger.value));

function closeModal() {
    emits('update:modelValue', false);
}

function save() {
    if (!canSave.value) {
        return;
    }
    const theme: CustomTheme = {
        id: props.editingTheme?.id ?? UUID.create().toString(),
        label: label.value.trim(),
        background: background.value,
        text: text.value,
        primary: primary.value,
        danger: danger.value,
        dark: dark.value,
    };
    emits('saved', theme);
    closeModal();
}

function deleteTheme() {
    if (props.editingTheme) {
        emits('deleted', props.editingTheme.id);
        closeModal();
    }
}
</script>

<template>
    <ModalCard
        id="custom-theme-editor-modal"
        v-if="modelValue"
        :is-active="modelValue"
        @close-modal="closeModal"
    >
        <template v-slot:header>
            <h2 class="modal-title">{{ isEditing ? 'Edit custom theme' : 'Create custom theme' }}</h2>
        </template>

        <template v-slot:body>
            <div class="theme-editor-body">
                <div class="theme-editor-fields">
                    <div class="field-row">
                        <label for="custom-theme-label">Name</label>
                        <input
                            id="custom-theme-label"
                            class="input"
                            type="text"
                            v-model="label"
                            placeholder="My theme"
                            autocomplete="off"
                        />
                    </div>

                    <div class="field-row">
                        <label for="custom-theme-background">Background</label>
                        <input id="custom-theme-background" type="color" v-model="background" @blur="onBackgroundBlur" />
                        <input class="input hex-input" type="text" v-model="background" @blur="onBackgroundBlur" />
                    </div>

                    <div class="field-row">
                        <label for="custom-theme-text">Text</label>
                        <input id="custom-theme-text" type="color" v-model="text" @blur="onTextBlur" />
                        <input class="input hex-input" type="text" v-model="text" @blur="onTextBlur" />
                    </div>

                    <div class="field-row">
                        <label for="custom-theme-primary">Primary</label>
                        <input id="custom-theme-primary" type="color" v-model="primary" @blur="onPrimaryBlur" />
                        <input class="input hex-input" type="text" v-model="primary" @blur="onPrimaryBlur" />
                    </div>

                    <div class="field-row">
                        <label for="custom-theme-danger">Danger</label>
                        <input id="custom-theme-danger" type="color" v-model="danger" @blur="onDangerBlur" />
                        <input class="input hex-input" type="text" v-model="danger" @blur="onDangerBlur" />
                    </div>

                    <div class="field-row">
                        <label for="custom-theme-dark">Background is dark</label>
                        <input id="custom-theme-dark" type="checkbox" v-model="dark" />
                    </div>
                </div>

                <div
                    class="theme-editor-preview"
                    :style="{
                        backgroundColor: previewVars.background,
                        color: previewVars.text,
                        borderColor: previewVars.border,
                    }"
                >
                    <p class="preview-title" :style="{ color: previewVars['text-strong'] }">Preview</p>
                    <p class="preview-subtitle" :style="{ color: previewVars['text-secondary'] }">
                        Sample text on this theme's background.
                    </p>
                    <div class="preview-buttons">
                        <span
                            class="preview-button"
                            :style="{ backgroundColor: previewVars['scheme-primary'], color: previewVars['on-primary-text'] }"
                        >Primary</span>
                        <span
                            class="preview-button"
                            :style="{ backgroundColor: previewVars['scheme-danger'], color: previewVars['on-danger-text'] }"
                        >Danger</span>
                    </div>
                </div>
            </div>
        </template>

        <template v-slot:footer>
            <button
                v-if="isEditing"
                class="button is-danger"
                @click="deleteTheme"
            >Delete</button>
            <button class="button is-info" :disabled="!canSave" @click="save">Save</button>
        </template>
    </ModalCard>
</template>

<style scoped lang="scss">
.theme-editor-body {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.theme-editor-fields {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex: 1;
    min-width: 16rem;
}

.field-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;

    label {
        flex: 0 0 9rem;
        font-size: 0.9rem;
        color: var(--text-secondary, #6b6464);
    }
}

.hex-input {
    max-width: 8rem;
}

.theme-editor-preview {
    flex: 0 0 14rem;
    border: 1px solid;
    border-radius: 12px;
    padding: 1.25rem;
    height: min-content;
}

.preview-title {
    font-weight: 700;
    font-size: 1.1rem;
    margin-bottom: 0.25rem;
}

.preview-subtitle {
    font-size: 0.85rem;
    margin-bottom: 1rem;
}

.preview-buttons {
    display: flex;
    gap: 0.5rem;
}

.preview-button {
    padding: 0.35rem 0.75rem;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
}
</style>
