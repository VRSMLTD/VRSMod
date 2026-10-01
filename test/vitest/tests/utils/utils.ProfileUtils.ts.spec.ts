import Game from "../../../../src/model/game/Game";
import { GameInstanceType, GameSelectionDisplayMode, PackageLoader } from '../../../../src/model/schema/ThunderstoreSchema';
import ExportMod from "../../../../src/model/exports/ExportMod";
import ThunderstoreMod from "../../../../src/model/ThunderstoreMod";
import ThunderstoreVersion from "../../../../src/model/ThunderstoreVersion";
import VersionNumber from "../../../../src/model/VersionNumber";
import * as PackageDexieStoreMockables from '../../../../src/r2mm/manager/PackageDexieStoreMockables';
import { exportModsToCombos } from "../../../../src/utils/ProfileUtils";
import { describe, beforeEach, test, expect, vi } from 'vitest';
import { providePathImplementation } from '../../../../src/providers/node/path/path';
import { TestPathProvider } from '../../stubs/providers/node/Node.Path.Provider';

type MockDexieVersion = Partial<PackageDexieStoreMockables.DexieVersion>;
type MockDexiePackage = Partial<Omit<PackageDexieStoreMockables.DexiePackage, "versions">> & {
    full_name: string;
    versions: MockDexieVersion[];
};

let mockPackageStorage: MockDexiePackage[] = [];

vi.spyOn(PackageDexieStoreMockables, "fetchPackagesByCommunityPackagePairs").mockImplementation(async (
    db: any,
    communityPackagePairs: [string, string][]
): Promise<PackageDexieStoreMockables.DexiePackage[]> => {
    const dependencyStrings = communityPackagePairs.map((pair) => pair[1]);
    return mockPackageStorage.filter(
        (pkg) => dependencyStrings.includes(pkg.full_name)
    ) as PackageDexieStoreMockables.DexiePackage[];
});

const game = new Game(
    "", "RiskOfRain2", "", "", [], "", "", "riskofrain2", [], "",
    GameSelectionDisplayMode.VISIBLE, GameInstanceType.GAME, PackageLoader.BEPINEX, []
);

function addMockThunderstorePackage(fullName: string, version: string) {
    mockPackageStorage.push({
        full_name: fullName,
        community: game.internalFolderName,
        versions: [{ full_name: `${fullName}-${version}`, version_number: version }]
    });
}

describe("ProfileUtils.exportModsToCombos", () => {
    beforeEach(() => {
        mockPackageStorage = [];
        providePathImplementation(() => TestPathProvider);
    });

    test("resolves a mod that's only cached in PackageDb", async () => {
        addMockThunderstorePackage("author-mod", "1.0.0");
        const exportMods = [new ExportMod("author-mod", new VersionNumber("1.0.0"), true)];

        const { known, unknown } = await exportModsToCombos(exportMods, game);

        expect(unknown).toHaveLength(0);
        expect(known.map((c) => c.getDependencyString())).toEqual(["author-mod-1.0.0"]);
    });

    test("falls back to the Hexium mod list for a version PackageDb never stored", async () => {
        const hexiumMod = new ThunderstoreMod();
        hexiumMod.setName("hexiumOnlyMod");
        hexiumMod.setFullName("author-hexiumOnlyMod");
        hexiumMod.setSource("hexium");
        hexiumMod.setLatestVersion("3.1.6");

        const hexiumVersion = new ThunderstoreVersion();
        hexiumVersion.setVersionNumber(new VersionNumber("3.1.6"));
        hexiumVersion.setName("author-hexiumOnlyMod-3.1.6");
        hexiumMod.setHexiumVersions([hexiumVersion]);

        const exportMods = [new ExportMod("author-hexiumOnlyMod", new VersionNumber("3.1.6"), true)];

        const { known, unknown } = await exportModsToCombos(exportMods, game, [hexiumMod]);

        expect(unknown).toHaveLength(0);
        expect(known.map((c) => c.getDependencyString())).toEqual(["author-hexiumOnlyMod-3.1.6"]);
    });

    test("still reports a mod as unknown when it's on neither PackageDb nor Hexium", async () => {
        const exportMods = [new ExportMod("author-missingMod", new VersionNumber("1.0.0"), true)];

        const { known, unknown } = await exportModsToCombos(exportMods, game, []);

        expect(known).toHaveLength(0);
        expect(unknown).toEqual(["author-missingMod-1.0.0"]);
    });
});
