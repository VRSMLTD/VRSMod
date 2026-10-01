import { Dark } from "quasar";
import ManagerSettings from "./ManagerSettings";
import GameManager from '../../model/game/GameManager';
import { CUSTOM_THEME_PREFIX, deriveThemeVariables, THEME_VARIABLE_NAMES } from "./ThemeDerivation";

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
    { slug: "blush", label: "Blush", dark: false },
    { slug: "snackbear", label: "SnackBear", dark: false },
    { slug: "chocolate-strawberry", label: "Chocolate Strawberry", dark: true },
    { slug: "larimar", label: "Larimar", dark: true },
    { slug: "chartreuse", label: "Chartreuse", dark: true },
    { slug: "forest", label: "Forest", dark: true },
    { slug: "deep-ocean", label: "Deep Ocean", dark: true },
    { slug: "crimson", label: "Crimson", dark: true },
    { slug: "latte", label: "Latte", dark: true },
    { slug: "sage", label: "Sage", dark: false },
    { slug: "amethyst", label: "Amethyst", dark: false },
    { slug: "amber", label: "Amber", dark: true },
    { slug: "lagoon", label: "Lagoon", dark: true },
    { slug: "navy", label: "Navy", dark: true },
    { slug: "wine", label: "Wine", dark: true },
    { slug: "coral", label: "Coral", dark: false },
    { slug: "midnight", label: "Midnight", dark: true },
    { slug: "indigo", label: "Indigo", dark: true },
    { slug: "moss", label: "Moss", dark: true },
    { slug: "sky", label: "Sky", dark: false },
    { slug: "fuchsia", label: "Fuchsia", dark: true },
];

export default class ThemeManager {

    public static async apply () {
        const settings = await ManagerSettings.getSingleton(GameManager.activeGame);
        await settings.load();
        const themeName = settings.getContext().global.themeName;

        // Always start from a clean slate: a previously-applied custom
        // theme sets its variables as inline styles, which would otherwise
        // keep overriding whichever theme class gets applied next.
        for (const name of THEME_VARIABLE_NAMES) {
            document.documentElement.style.removeProperty(`--${name}`);
        }

        Array.from(document.documentElement.classList).forEach(className => {
            if (className.startsWith('html--theme-')) {
                document.documentElement.classList.remove(className);
            }
        });

        if (themeName.startsWith(CUSTOM_THEME_PREFIX)) {
            const customId = themeName.slice(CUSTOM_THEME_PREFIX.length);
            const customTheme = settings.getCustomThemes().find(t => t.id === customId);
            if (customTheme) {
                Dark.set(customTheme.dark);
                document.documentElement.classList.toggle('html--dark', customTheme.dark);
                const vars = deriveThemeVariables(customTheme);
                for (const [name, value] of Object.entries(vars)) {
                    document.documentElement.style.setProperty(`--${name}`, value);
                }
                return;
            }
        }

        const theme = THEMES.find(t => t.slug === themeName) || THEMES[0]!;
        Dark.set(theme.dark);
        document.documentElement.classList.toggle('html--dark', theme.dark);
        document.documentElement.classList.add(`html--theme-${theme.slug}`);
    }

}
