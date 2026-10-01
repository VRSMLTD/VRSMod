import VersionNumber from '../model/VersionNumber';
import packageInfo from '../../package.json';

export default class ManagerInformation {
    public static VERSION: VersionNumber = new VersionNumber(packageInfo.version);
    public static IS_PORTABLE: boolean = false;
    public static APP_NAME: string = "VRSMod";
    public static WIKI_GAME_DIRECTORY_HELP_URL = "https://github.com/ebkr/r2modmanPlus/wiki/Why-aren't-my-mods-working%3F#games-via-steam";
}
