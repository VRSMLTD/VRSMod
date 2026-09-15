<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import CacheUtil from '../../r2mm/mods/CacheUtil';
import FileUtils from '../../utils/FileUtils';
import R2Error from '../../model/errors/R2Error';
import { getStore } from '../../providers/generic/store/StoreProvider';
import { State } from '../../store';

const store = getStore<State>();

const cacheSizeBytes = ref<number | null>(null);
const isLoadingSize = ref(true);
const isCleaning = ref(false);
const cacheEnabled = ref<boolean>(!store.state.download.ignoreCache);

async function refreshCacheSize() {
    isLoadingSize.value = true;
    try {
        cacheSizeBytes.value = await CacheUtil.getCacheSize();
    } catch (e) {
        store.commit('error/handleError', R2Error.fromThrownValue(e, 'Failed to read cache size'));
    } finally {
        isLoadingSize.value = false;
    }
}

async function toggleCache() {
    await store.dispatch('download/toggleIgnoreCache');
    cacheEnabled.value = !store.state.download.ignoreCache;
}

async function cleanCache() {
    isCleaning.value = true;
    try {
        await CacheUtil.clean();
        await refreshCacheSize();
    } catch (e) {
        store.commit('error/handleError', R2Error.fromThrownValue(e, 'Failed to clean the mod cache'));
    } finally {
        isCleaning.value = false;
    }
}

onMounted(refreshCacheSize);
</script>

<template>
    <div class="storage-view">
        <div class="card is-shadowless storage-summary">
            <p class="title is-5">Mod cache</p>
            <p class="subtitle is-6" v-if="!isLoadingSize">
                {{ FileUtils.humanReadableSize(cacheSizeBytes || 0) }} used across every downloaded mod version
            </p>
            <p class="subtitle is-6" v-else>Calculating cache size&hellip;</p>

            <button
                class="button is-info"
                :class="{ 'is-loading': isCleaning }"
                :disabled="isCleaning"
                @click="cleanCache"
            >
                Clean up unused versions
            </button>
            <p class="setting-hint">
                Removes cached mod versions that aren't used by any profile. Doesn't touch mods you have installed.
            </p>
        </div>

        <div class="card is-shadowless storage-summary">
            <p class="title is-5">Download cache</p>
            <div class="field" @click.prevent.stop="toggleCache">
                <input
                    id="toggle-download-cache-storage"
                    type="checkbox"
                    :class="['switch', { 'is-info': cacheEnabled }]"
                    :checked="cacheEnabled"
                />
                <label for="toggle-download-cache-storage">
                    {{ cacheEnabled ? 'Enabled' : 'Disabled' }}
                </label>
                <p class="setting-hint" @click.stop.prevent>
                    {{ cacheEnabled ? 'Reusing cached downloads (recommended)' : 'Ignores the cache when downloading mods. Re-downloads each time.' }}
                </p>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.storage-view {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.storage-summary {
    padding: 1.25rem;
    background-color: var(--card-expand-background-color, #f6f6f8);
    border-radius: 8px;
}
</style>
