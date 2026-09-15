<script lang="ts" setup>
import { computed } from 'vue';

import ModalCard from '../ModalCard.vue';
import ThunderstoreCombo from '../../model/ThunderstoreCombo';
import ManifestV2 from '../../model/ManifestV2';
import VersionNumber from '../../model/VersionNumber';
import R2Error from '../../model/errors/R2Error';
import ProfileModList from '../../r2mm/mods/ProfileModList';
import { getStore } from '../../providers/generic/store/StoreProvider';
import { State } from '../../store';
import { InstallMode } from '../../utils/DependencyUtils';

const store = getStore<State>();

const isOpen = computed(() => store.state.modals.isUpdateAllModsModalOpen);
const modsWithUpdates = computed(() => store.getters['profile/modsWithUpdates']);

function closeModal() {
    store.commit("closeUpdateAllModsModal");
}

async function updateAllToLatestVersion() {
    closeModal();
    const combos: ThunderstoreCombo[] = await store.dispatch('profile/getCombosWithUpdates');
    const profile = store.getters['profile/activeProfile'].asImmutableProfile();

    // Record each mod's current version before updating, so any of them can
    // be reverted afterwards via "Undo last update" on that mod's card.
    const previousVersions = new Map<string, VersionNumber>();
    const modListResult = await ProfileModList.getModList(profile);
    if (!(modListResult instanceof R2Error)) {
        for (const combo of combos) {
            const existing = modListResult.find((local: ManifestV2) => local.getName() === combo.getMod().getFullName());
            if (existing !== undefined) {
                previousVersions.set(existing.getName(), existing.getVersionNumber());
            }
        }
    }

    await store.dispatch('download/downloadAndInstallCombos', {
        combos,
        profile,
        game: store.state.activeGame,
        installMode: InstallMode.UPDATE_ALL
    });

    const updatedModListResult = await ProfileModList.getModList(profile);
    if (!(updatedModListResult instanceof R2Error)) {
        for (const mod of updatedModListResult) {
            const oldVersion = previousVersions.get(mod.getName());
            if (oldVersion !== undefined && mod.getVersionNumber().isNewerThan(oldVersion)) {
                await ProfileModList.updateMod(mod, profile, async (m) => {
                    m.setPreviousVersionNumber(oldVersion);
                });
            }
        }
    }
}
</script>

<template>
    <ModalCard id="update-all-installed-mods-modal" :is-active="isOpen" :can-close="true" v-if="modsWithUpdates.length === 0" @close-modal="closeModal()">
        <template v-slot:header>
            <h2 class='modal-title'>No mods to update</h2>
        </template>
        <template v-slot:body>
            <p>Either all installed mods are up to date, or there are no installed mods.</p>
        </template>
        <template v-slot:footer>
            <button class="button is-info" @click="closeModal()">Close</button>
        </template>
    </ModalCard>
    <ModalCard id="update-all-installed-mods-modal" :is-active="isOpen" :can-close="true" v-else @close-modal="closeModal()">
        <template v-slot:header>
            <h2 class='modal-title'>Update all installed mods</h2>
        </template>
        <template v-slot:body>
            <p>All installed mods will be updated to their latest versions.</p>
            <p>Any missing dependencies will be installed.</p>
            <p>The following mods will be downloaded and installed:</p>
            <br/>
            <ul class="list">
                <li class="list-item" v-for='(mod, index) in modsWithUpdates'
                    :key='`to-update-${index}-${mod.getFullName()}`'>
                    {{mod.getName()}} will be updated to: {{mod.getLatestVersion()}}
                </li>
            </ul>
        </template>
        <template v-slot:footer>
            <button class="button is-info" @click="updateAllToLatestVersion()">Update all</button>
        </template>
    </ModalCard>
</template>
