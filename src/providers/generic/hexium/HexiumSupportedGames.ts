// Hexium (hexium.gg) currently only serves a subset of the games VRSMod
// supports. It mirrors each Thunderstore community's own internal slug
// (e.g. "valheim"), so no separate slug-mapping table is needed — just
// an allow-list of which of those slugs Hexium actually has a
// subdomain for right now. Extend this as Hexium adds more games.
export const HEXIUM_SUPPORTED_COMMUNITIES: string[] = [
    'valheim',
];

export function isHexiumSupportedForCommunity(internalFolderName: string): boolean {
    return HEXIUM_SUPPORTED_COMMUNITIES.includes(internalFolderName.toLowerCase());
}
