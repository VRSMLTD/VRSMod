import { Dark } from "quasar";
import ManagerSettings from "./ManagerSettings";
import GameManager from '../../model/game/GameManager';

// Single source of truth for every available theme: its display label,
// and whether it has a dark or light background (drives Quasar's own
// dark-mode-aware styling, separate from our custom CSS variables).
export const THEMES: { slug: string; label: string; dark: boolean }[] = [
    { slug: "graphite", label: "Graphite", dark: true },
    { slug: "ash", label: "Ash", dark: true },
    { slug: "linen", label: "Linen", dark: false },
    { slug: "true-black", label: "True Black", dark: true },
    { slug: "denim", label: "Denim", dark: true },
    { slug: "paper", label: "Paper", dark: false },
    { slug: "frostbyte", label: "Frostbyte", dark: true },
    { slug: "terracotta", label: "Terracotta", dark: true },
    { slug: "pastel-mocha", label: "Pastel Mocha", dark: true },
    { slug: "nightshade", label: "Nightshade", dark: true },
    { slug: "chat-blue", label: "Chat Blue", dark: true },
    { slug: "dusky-rose", label: "Dusky Rose", dark: true },
    { slug: "blush", label: "Blush", dark: false },
    { slug: "snackbear", label: "SnackBear", dark: false },
    { slug: "chocolate-strawberry", label: "Chocolate Strawberry", dark: true },
    { slug: "larimar", label: "Larimar", dark: true },
    { slug: "lilac-breeze", label: "Lilac Breeze", dark: true },
    { slug: "chrome-tremolite-desire", label: "Chrome Tremolite Desire", dark: true },
];

export default class ThemeManager {

    public static async apply () {
        const settings = await ManagerSettings.getSingleton(GameManager.activeGame);
        await settings.load();
        const themeName = settings.getContext().global.themeName;
        const theme = THEMES.find(t => t.slug === themeName) || THEMES[0]!;

        Dark.set(theme.dark);

        document.documentElement.classList.forEach(className => {
            if (className.startsWith('html--theme-')) {
                document.documentElement.classList.remove(className);
            }
        });
        document.documentElement.classList.add(`html--theme-${theme.slug}`);
    }

}
