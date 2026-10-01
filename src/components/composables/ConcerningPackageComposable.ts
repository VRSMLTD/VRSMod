import { getStore } from '@r2/providers/generic/store/StoreProvider';
import { computed, onMounted, ref, watch } from 'vue';
import ManifestV2 from '@r2/model/ManifestV2';
import ThunderstoreMod from '@r2/model/ThunderstoreMod';
import VersionNumber from '@r2/model/VersionNumber';
import * as PackageDb from "@r2/r2mm/manager/PackageDexieStore";

type ConcerningPackage = {
    fullName: string;
    latestVersion: string;
    hexiumVersionStrings: Set<string>;
}

const store = getStore<any>();

const activeGame = computed(() => store.state.activeGame);

const localModList = computed<ManifestV2[]>(() => store.state.profile.modList);
const onlineModList = computed<Map<string, ConcerningPackage>>(() => {
    const mods: ThunderstoreMod[] = store.state.tsMods.mods;
    return new Map<string, ConcerningPackage>(mods.map(value => [value.getFullName(), {
        fullName: value.getFullName(),
        latestVersion: value.getLatestVersion(),
        hexiumVersionStrings: value.getSource() === 'hexium'
            ? new Set(value.getHexiumVersions().map(version => version.getVersionNumber().toString()))
            : new Set<string>(),
    }]));
});

const allConcerningPackages = ref<ManifestV2[]>([]);
const activeConcerningPackages = ref<ManifestV2[]>([]);

const allConcerningNames = computed(() => new Set(allConcerningPackages.value.map(mod => mod.getName())));
const activeConcerningNames = computed(() => new Set(activeConcerningPackages.value.map(mod => mod.getName())));

async function updateConcerningPackages() {
    const game = activeGame.value;
    const localMods = localModList.value;
    const concerningPackages: ManifestV2[] = [];
    const modsToCheck: ManifestV2[] = [];

    for (const mod of localMods) {
        if (!mod.isOnlineSource()) {
            continue;
        }
        if (!onlineModList.value.has(mod.getName())) {
            concerningPackages.push(mod);
        } else {
            modsToCheck.push(mod);
        }
    }

    const versionNumbersBatch = await PackageDb.getPackageVersionNumbersBatch(
        game.internalFolderName,
        modsToCheck.map(mod => mod.getName())
    );

    for (const mod of modsToCheck) {
        const installedVersion = mod.getVersionNumber().toString();
        const versions = versionNumbersBatch.get(mod.getName());
        const foundInThunderstore = !!versions && versions.includes(installedVersion);

        // Hexium-only versions aren't stored in PackageDb, so a version missing
        // from Thunderstore's list isn't concerning if Hexium still has it.
        const onlineMod = onlineModList.value.get(mod.getName());
        const foundInHexium = !!onlineMod && onlineMod.hexiumVersionStrings.has(installedVersion);

        if (!foundInThunderstore && !foundInHexium) {
            concerningPackages.push(mod);
        }
    }

    allConcerningPackages.value = concerningPackages;
    activeConcerningPackages.value = concerningPackages.filter(value => !value.isTrustedPackage());
}

watch([activeGame, localModList, onlineModList], async () => {
    await updateConcerningPackages();
});

let initialLoad: Promise<void> | null = null;

export function useConcerningPackageComposable() {

    onMounted(() => {
        if (initialLoad === null) {
            initialLoad = updateConcerningPackages();
        }
    });

    // The result can't be trusted yet in two windows: while a sync is
    // actively running (state.tsMods.mods can be mid-update, partway
    // through the Thunderstore load or the Hexium merge), and — the gap
    // that actually caused the launch-time flash — in the moment before any
    // sync has even started, when state.tsMods.mods is still its initial
    // empty array. That second window isn't covered by "sync in progress"
    // at all, since the sync hasn't been dispatched yet when this composable
    // first runs on mount. Hide the result in both cases rather than
    // showing a "remove this mod" warning that clears itself a moment later.
    const dataNotReady = computed<boolean>(() =>
        store.state.tsMods.isThunderstoreModListUpdateInProgress || store.state.tsMods.mods.length === 0
    );

    const hasConcerningPackages = computed<boolean>(() => !dataNotReady.value && activeConcerningPackages.value.length > 0);

    function isConcerningPackage(mod: ManifestV2) {
        return !dataNotReady.value && activeConcerningNames.value.has(mod.getName());
    }

    function wasConcerningPackage(mod: ManifestV2) {
        return !dataNotReady.value && allConcerningNames.value.has(mod.getName());
    }

    return {
        concerningPackages: activeConcerningPackages,
        hasConcerningPackages,
        isConcerningPackage,
        wasConcerningPackage,
    }
}
