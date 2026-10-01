import ThunderstoreMod from '../../../model/ThunderstoreMod';
import { retry } from '../../../utils/Common';
import { getAxiosWithTimeouts } from '../../../utils/HttpUtils';

/**
 * Fetches the flat package listing Hexium serves for a given community
 * (game). Hexium's API deliberately mirrors Thunderstore's own flat
 * /api/v1/package/ shape, so results are parsed with the same logic
 * used for Thunderstore, just tagged with their actual source.
 *
 * A failure here should never take down the whole mod list — Hexium is
 * an optional, opt-in extra source layered on top of Thunderstore, so
 * callers should treat a thrown error as "nothing to add this time"
 * rather than a fatal error.
 */
export default class HexiumClient {
    private static axios = getAxiosWithTimeouts(10000, 10000);

    public static async fetchMods(internalFolderName: string): Promise<ThunderstoreMod[]> {
        const url = `https://${internalFolderName.toLowerCase()}.hexium.gg/api/v1/package/`;
        const options = {attempts: 3, interval: 2000, throwLastErrorAsIs: true};
        const response = await retry(() => HexiumClient.axios.get(url), options);

        if (!Array.isArray(response.data)) {
            throw new Error('Received unexpected response shape from Hexium');
        }

        return response.data.map((entry: any) => ThunderstoreMod.parseFromHexiumData(entry));
    }
}