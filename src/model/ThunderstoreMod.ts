import ThunderstoreVersion from './ThunderstoreVersion';

export default class ThunderstoreMod extends ThunderstoreVersion {
    private rating: number = 0;
    private owner: string = '';
    private packageUrl: string = '';
    private dateUpdated: string = '';
    private uuid4: string = '';
    private pinned: boolean = false;
    private deprecated: boolean = false;
    private categories: string[] = [];
    private hasNsfwContent: boolean = false;
    private donationLink: string | null = null;
    private latestVersion: string = '';
    private source: 'thunderstore' | 'hexium' = 'thunderstore';
    private hexiumVersions: ThunderstoreVersion[] = [];

    // Imitate the order where mods are returned from Thunderstore package listing API.
    public static defaultOrderComparer(a: ThunderstoreMod, b: ThunderstoreMod): number {
        // Pinned mods first.
        if (a.isPinned() !== b.isPinned()) {
            return a.isPinned() ? -1 : 1;
        }

        // Deprecated mods last.
        if (a.isDeprecated() !== b.isDeprecated()) {
            return a.isDeprecated() ? 1 : -1;
        }

        // Sort mods with same boolean flags by update date.
        return a.getDateUpdated() >= b.getDateUpdated() ? -1 : 1;
    }

        public static override parseFromThunderstoreData(data: any): ThunderstoreMod {
        const mod = new ThunderstoreMod();
        mod.setName(data.name);
        mod.setFullName(data.full_name);
        mod.setOwner(data.owner);
        mod.setDateCreated(data.date_created);
        mod.setDateUpdated(data.date_updated);
        mod.setDeprecatedStatus(data.is_deprecated);
        mod.setPinnedStatus(data.is_pinned);
        mod.setRating(data.rating_score);
        mod.setDownloadCount(
            data.versions.reduce(
                (x: number, y: {downloads: number}) => x + y.downloads,
                0
            )
        );
        mod.setPackageUrl(data.package_url);
        mod.setCategories(data.categories);
        mod.setNsfwFlag(data.has_nsfw_content);
        mod.setDonationLink(data.donation_link);
        mod.setLatestVersion(data.versions[0].version_number);
        mod.setDescription(data.versions[0].description);
        mod.setIcon(data.versions[0].icon);
        return mod;
    }

    // Hexium serves the same flat package-listing shape as Thunderstore's
    // own API, so we can reuse the same parsing logic and just tag the
    // result with where it actually came from.
    public static parseFromHexiumData(data: any): ThunderstoreMod {
        const mod = ThunderstoreMod.parseFromThunderstoreData(data) as ThunderstoreMod;
        mod.setSource('hexium');

        const versions: ThunderstoreVersion[] = (data.versions ?? [])
            .filter((version: any) => /^\d+\.\d+\.\d+$/.test(version.version_number))
            .map((version: any) => ThunderstoreVersion.parseFromThunderstoreData(version))
            .sort((a: ThunderstoreVersion, b: ThunderstoreVersion) =>
                a.getVersionNumber().compareToDescending(b.getVersionNumber())
            );

        if (versions.length > 0) {
            mod.setHexiumVersions(versions);
            mod.setLatestVersion(versions[0]!.getVersionNumber().toString());
        }

        return mod;
    }

    // Must set the same fields as parseFromThunderstoreData from the summary
    // table's precomputed values, otherwise the online mod list desyncs.
    public static parseFromSummary(data: any): ThunderstoreMod {
        const mod = new ThunderstoreMod();
        mod.setName(data.name);
        mod.setFullName(data.full_name);
        mod.setOwner(data.owner);
        mod.setDateCreated(data.date_created);
        mod.setDateUpdated(data.date_updated);
        mod.setDeprecatedStatus(data.is_deprecated);
        mod.setPinnedStatus(data.is_pinned);
        mod.setRating(data.rating_score);
        mod.setDownloadCount(data.total_downloads);
        mod.setPackageUrl(data.package_url);
        mod.setCategories(data.categories);
        mod.setNsfwFlag(data.has_nsfw_content);
        mod.setDonationLink(data.donation_link);
        mod.setLatestVersion(data.latest_version_number);
        mod.setDescription(data.latest_description);
        mod.setIcon(data.latest_icon);
        return mod;
    }

    public getLatestVersion(): string {
        return this.latestVersion;
    }

    public setLatestVersion(versionNumber: string) {
        this.latestVersion = versionNumber;
    }

    public getLatestDependencyString(): string {
        return `${this.getFullName()}-${this.getLatestVersion()}`;
    }

    public getRating(): number {
        return this.rating;
    }

    public setRating(rating: number) {
        this.rating = rating;
    }

    public getSource(): 'thunderstore' | 'hexium' {
        return this.source;
    }

    public setSource(source: 'thunderstore' | 'hexium') {
        this.source = source;
    }

    public getHexiumVersions(): ThunderstoreVersion[] {
        return this.hexiumVersions;
    }

    public setHexiumVersions(versions: ThunderstoreVersion[]) {
        this.hexiumVersions = versions;
    }

    public getOwner(): string {
        return this.owner;
    }

    public setOwner(owner: string) {
        this.owner = owner;
    }

    public getPackageUrl(): string {
        return this.packageUrl;
    }

    public setPackageUrl(url: string) {
        this.packageUrl = url;
    }

    public getDateUpdated(): string {
        return this.dateUpdated;
    }

    public setDateUpdated(date: string) {
        this.dateUpdated = date;
    }

    public getUuid4(): string {
        return this.uuid4;
    }

    public setUuid4(uuid4: string) {
        this.uuid4 = uuid4;
    }

    public isPinned(): boolean {
        return this.pinned;
    }

    public setPinnedStatus(pin: boolean) {
        this.pinned = pin;
    }

    public isDeprecated(): boolean {
        return this.deprecated;
    }

    public setDeprecatedStatus(deprecated: boolean) {
        this.deprecated = deprecated;
    }

    public getCategories(): string[] {
        return this.categories;
    }

    public setCategories(categories: string[]) {
        this.categories = categories;
    }

    public getNsfwFlag(): boolean {
        return this.hasNsfwContent;
    }

    public setNsfwFlag(isNsfw: boolean) {
        this.hasNsfwContent = isNsfw;
    }

    public getDonationLink(): string | null {
        return this.donationLink;
    }

    public setDonationLink(url: string | null | undefined) {
        this.donationLink = url || null;
    }
}