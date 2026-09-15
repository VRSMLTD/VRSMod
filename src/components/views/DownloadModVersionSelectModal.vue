<template>
    <ModalCard id="download-mod-version-select-modal" :is-active="isOpen" :can-close="true" v-if="thunderstoreMod !== null" @close-modal="closeModal()">
        <template v-slot:header>
            <h2 class='modal-title' v-if="thunderstoreMod !== null">
                Select a version of {{thunderstoreMod.getName()}} to download
            </h2>
        </template>
        <template v-slot:body>
            <p>It's recommended to select the latest version of all mods.</p>
            <p>Using outdated versions may cause problems.</p>
            <br/>
            <div class="columns is-vcentered">
                <template v-if="currentVersion !== null">
                    <div class="column is-narrow">
                        <select class="select" disabled="true">
                            <option selected>
                                {{currentVersion}}
                            </option>
                        </select>
                    </div>
                    <div class="column is-narrow">
                        <span class="margin-right margin-right--half-width"><span class="margin-right margin-right--half-width"/> <i class='fas fa-long-arrow-alt-right'></i></span>
                    </div>
                </template>
                <div class="column is-narrow">
                    <select class='select' v-model="selectedVersion">
                        <option v-for='(value, index) in versionNumbers' :key='index' :value='value'>
                            {{value}}
                        </option>
                    </select>
                </div>
                <div class="column is-narrow">
                    <span class="tag is-dark" v-if='selectedVersion === null'>
                        You need to select a version
                    </span>
                    <span class="tag is-success" v-else-if='recommendedVersion === selectedVersion'>
                        {{selectedVersion}} is the recommended version
                    </span>
                    <span class="tag is-success" v-else-if='versionNumbers[0] === selectedVersion'>
                        {{selectedVersion}} is the latest version
                    </span>
                    <span class="tag is-danger" v-else-if='versionNumbers[0] !== selectedVersion'>
                        {{selectedVersion}} is an outdated version
                    </span>
                </div>
            </div>
            <br/>
            <div v-if="changelog !== null">
                <h3 class="title is-6">Changelog for {{selectedVersion}}</h3>
                <MarkdownRender :markdown="changelog" />
            </div>
            <p v-else-if="changelogError !== null" class="has-text-grey">
                No changelog available for this version.
            </p>
        </template>
        <template v-slot:footer>
            <button class="button is-info" @click="downloadMod">Download with dependencies</button>
        </template>
    </ModalCard>
</template>

<script lang="ts" setup>
import ModalCard from "../ModalCard.vue";
import MarkdownRender from "../v2/MarkdownRender.vue";
import R2Error from "../../model/errors/R2Error";
import ManifestV2 from "../../model/ManifestV2";
import ThunderstoreVersion from "../../model/ThunderstoreVersion";
import { MOD_LOADER_VARIANTS } from "../../r2mm/installing/profile_installers/ModLoaderVariantRecord";
import * as PackageDb from "../../r2mm/manager/PackageDexieStore";
import ProfileModList from "../../r2mm/mods/ProfileModList";
import Game from '../../model/game/Game';
import { computed, ref, watch } from 'vue';
import { getStore } from '../../providers/generic/store/StoreProvider';
import { State } from '../../store';
import ThunderstoreMod from '../../model/ThunderstoreMod';
import ThunderstoreCombo from "../../model/ThunderstoreCombo";
import { InstallMode } from "../../utils/DependencyUtils";
import { transformPackageUrl } from '../../providers/cdn/PackageUrlTransformer';

const store = getStore<State>();

const versionNumbers = ref<string[]>([]);
const recommendedVersion = ref<string | null>(null);
const selectedVersion = ref<string | null>(null);
const currentVersion = ref<string | null>(null);
const changelog = ref<string | null>(null);
const changelogError = ref<R2Error | null>(null);

const isOpen = computed(() => store.state.modals.isDownloadModVersionSelectModalOpen);
const thunderstoreMod = computed(() => store.state.modals.downloadModalMod);

function closeModal() {
    store.commit("closeDownloadModVersionSelectModal");
}

function fetchChangelogFor(mod: ThunderstoreMod, versionString: string) {
    changelog.value = null;
    changelogError.value = null;
    return fetch(transformPackageUrl(`https://thunderstore.io/api/cyberstorm/package/${mod.getOwner()}/${mod.getName()}/v/${versionString}/changelog/`))
        .then(res => {
            if (!res.ok) {
                throw new Error(`No changelog available for ${mod.getName()} ${versionString}`);
            }
            return res.json();
        })
        .then(res => {
            if (res.html && res.html.trim().length > 0) {
                changelog.value = res.html;
            } else {
                changelog.value = null;
                changelogError.value = new R2Error('No changelog', 'This version has no changelog.', null);
            }
        })
        .catch(e => {
            changelog.value = null;
            changelogError.value = R2Error.fromThrownValue(e);
        });
}

watch(selectedVersion, async (newVersion) => {
    const mod = thunderstoreMod.value;
    if (mod !== null && newVersion !== null) {
        await fetchChangelogFor(mod, newVersion);
    }
});

watch(() => store.state.modals.downloadModalMod, async () => {
    currentVersion.value = null;
    const mod = thunderstoreMod.value;
    if (mod !== null) {
        const activeGame: Game = store.state.activeGame;
        selectedVersion.value = mod.getLatestVersion();
        recommendedVersion.value = null;

        versionNumbers.value = await PackageDb.getPackageVersionNumbers(
            activeGame.internalFolderName,
            mod.getFullName()
        );

        const foundRecommendedVersion = MOD_LOADER_VARIANTS[activeGame.internalFolderName]!
            .find(value => value.packageName === mod.getFullName());

        if (foundRecommendedVersion && foundRecommendedVersion.recommendedVersion) {
            recommendedVersion.value = foundRecommendedVersion.recommendedVersion.toString();

            // Auto-select recommended version if it's found.
            const recommendedVersionToSelect = versionNumbers.value.find(
                (ver) => ver === foundRecommendedVersion.recommendedVersion!.toString()
            );
            if (recommendedVersionToSelect) {
                selectedVersion.value = recommendedVersionToSelect;
            }
        }

        const modListResult = await ProfileModList.getModList(store.getters['profile/activeProfile'].asImmutableProfile());
        if (!(modListResult instanceof R2Error)) {
            const manifestMod = modListResult.find((local: ManifestV2) => local.getName() === mod.getFullName());
            if (manifestMod !== undefined) {
                currentVersion.value = manifestMod.getVersionNumber().toString();
            }
        }
    }
});

async function downloadMod() {
    const mod = thunderstoreMod.value;
    const versionString = selectedVersion.value;
    if (mod === null || versionString === null) {
        // Shouldn't happen, but shouldn't throw an error.
        console.log(`Download initiated with null mod [${mod}] or version [${versionString}]`);
        return;
    }

    let version: ThunderstoreVersion;
    const activeGame: Game = store.state.activeGame;

    try {
        version = await PackageDb.getVersionAsThunderstoreVersion(
            activeGame.internalFolderName,
            mod.getFullName(),
            versionString
        );
    } catch {
        console.log(`Failed to get version [${versionString}] for mod [${mod.getFullName()}]`);
        return;
    }

    downloadHandler(mod, version);
}

async function downloadHandler(tsMod: ThunderstoreMod, tsVersion: ThunderstoreVersion) {
    closeModal();

    const profile = store.getters['profile/activeProfile'].asImmutableProfile();
    let previouslyInstalledMod: ManifestV2 | undefined;
    const modListResult = await ProfileModList.getModList(profile);
    if (!(modListResult instanceof R2Error)) {
        previouslyInstalledMod = modListResult.find((local: ManifestV2) => local.getName() === tsMod.getFullName());
    }

    const combos = [new ThunderstoreCombo()];
    combos[0]!.setMod(tsMod);
    combos[0]!.setVersion(tsVersion);

    await store.dispatch('download/downloadAndInstallCombos', {
        combos,
        profile,
        game: store.state.activeGame,
        installMode: InstallMode.INSTALL_SPECIFIC
    });

    // If this was a genuine update (not a downgrade), remember the version we
    // came from so it can be restored later via "Undo last update".
    if (previouslyInstalledMod !== undefined && tsVersion.getVersionNumber().isNewerThan(previouslyInstalledMod.getVersionNumber())) {
        const oldVersion = previouslyInstalledMod.getVersionNumber();
        await ProfileModList.updateMod(previouslyInstalledMod, profile, async (mod) => {
            mod.setPreviousVersionNumber(oldVersion);
        });
    }
}

</script>
