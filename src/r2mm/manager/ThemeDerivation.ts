// TypeScript port of the formulas in src/css/scheme/_theme-builder.scss.
// The 32 built-in themes are compiled ahead of time by Sass, but a
// user-created custom theme has no build step available at runtime, so the
// same 4-input -> full variable set derivation has to be computable live in
// the renderer. Keep this in lockstep with _theme-builder.scss - the two
// must produce identical output for the same 4 inputs.

export interface ThemeInputs {
    background: string;
    text: string;
    primary: string;
    danger: string;
    dark: boolean;
}

export interface CustomTheme extends ThemeInputs {
    id: string;
    label: string;
}

export const CUSTOM_THEME_PREFIX = 'custom:';

interface Rgb {
    r: number;
    g: number;
    b: number;
}

function hexToRgb(hex: string): Rgb {
    const clean = hex.replace('#', '');
    const full = clean.length === 3
        ? clean.split('').map(c => c + c).join('')
        : clean;
    const value = parseInt(full, 16);
    return {
        r: (value >> 16) & 255,
        g: (value >> 8) & 255,
        b: value & 255,
    };
}

function rgbToHex({ r, g, b }: Rgb): string {
    const toHex = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

interface Hsl {
    h: number;
    s: number;
    l: number;
}

function rgbToHsl({ r, g, b }: Rgb): Hsl {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const l = (max + min) / 2;

    if (max === min) {
        return { h: 0, s: 0, l: l * 100 };
    }

    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h: number;
    switch (max) {
        case rn:
            h = (gn - bn) / d + (gn < bn ? 6 : 0);
            break;
        case gn:
            h = (bn - rn) / d + 2;
            break;
        default:
            h = (rn - gn) / d + 4;
    }
    h *= 60;

    return { h, s: s * 100, l: l * 100 };
}

function hslToRgb({ h, s, l }: Hsl): Rgb {
    const hn = ((h % 360) + 360) % 360 / 360;
    const sn = clamp(s, 0, 100) / 100;
    const ln = clamp(l, 0, 100) / 100;

    if (sn === 0) {
        const v = ln * 255;
        return { r: v, g: v, b: v };
    }

    const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
    const p = 2 * ln - q;

    const hueToRgb = (t: number) => {
        let tt = t;
        if (tt < 0) tt += 1;
        if (tt > 1) tt -= 1;
        if (tt < 1 / 6) return p + (q - p) * 6 * tt;
        if (tt < 1 / 2) return q;
        if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
        return p;
    };

    return {
        r: hueToRgb(hn + 1 / 3) * 255,
        g: hueToRgb(hn) * 255,
        b: hueToRgb(hn - 1 / 3) * 255,
    };
}

// Sass color.adjust($base, $lightness: $amount): adds $amount percentage
// points to HSL lightness, clamped to [0, 100].
function adjustLightness(hex: string, amount: number): string {
    const hsl = rgbToHsl(hexToRgb(hex));
    hsl.l = clamp(hsl.l + amount, 0, 100);
    return rgbToHex(hslToRgb(hsl));
}

// Sass color.adjust($color, $hue: $degrees): adds $degrees to HSL hue, wraps.
function adjustHue(hex: string, degrees: number): string {
    const hsl = rgbToHsl(hexToRgb(hex));
    hsl.h = hsl.h + degrees;
    return rgbToHex(hslToRgb(hsl));
}

// Sass color.mix($color1, $color2, $weight): linear channel interpolation
// for two fully-opaque colors, which every theme input here always is.
function mix(hex1: string, hex2: string, weightOfFirst: number): string {
    const c1 = hexToRgb(hex1);
    const c2 = hexToRgb(hex2);
    const w = clamp(weightOfFirst, 0, 100) / 100;
    return rgbToHex({
        r: c1.r * w + c2.r * (1 - w),
        g: c1.g * w + c2.g * (1 - w),
        b: c1.b * w + c2.b * (1 - w),
    });
}

function contrastOn(bg: string): string {
    const { r, g, b } = hexToRgb(bg);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#1a1a1a' : '#ffffff';
}

function shade(base: string, amount: number, dark: boolean): string {
    return adjustLightness(base, dark ? amount : -amount);
}

function rotateHue(color: string, degrees: number): string {
    return adjustHue(color, degrees);
}

function overlayAlpha(dark: boolean, alpha: number): string {
    return dark ? `rgba(255, 255, 255, ${alpha})` : `rgba(0, 0, 0, ${alpha})`;
}

// Produces the same full variable set as the theme() mixin's
// :root.html--theme-#{$slug} block, keyed by CSS custom property name
// (without the leading "--").
export function deriveThemeVariables(inputs: ThemeInputs): Record<string, string> {
    const { background, text, primary, danger, dark } = inputs;

    const textSecondary = mix(text, background, 62);
    const textStrong = shade(text, 4, dark);
    const link = mix(primary, text, 55);
    const linkHover = mix(primary, text, 40);
    const border = shade(background, 8, dark);
    const borderSecondary = shade(background, 5, dark);
    const borderHover = shade(background, 16, dark);
    const borderActive = shade(background, 24, dark);
    const codeFontColor = mix(textSecondary, primary, 50);
    const previewPanelBackground = shade(background, 3, !dark);
    const warning = rotateHue(danger, 40);
    const onBackground = contrastOn(background);
    const onPrimary = contrastOn(primary);
    const onDanger = contrastOn(danger);
    const onWarning = contrastOn(warning);
    const overlayHover = overlayAlpha(dark, 0.08);
    const placeholderAlpha = overlayAlpha(dark, 0.3);
    const disabledPlaceholderAlpha = overlayAlpha(dark, 0.2);

    return {
        'card-expand-shadow-color': 'rgba(0, 0, 0, 0.5)',
        'card-expand-background-color': 'rgba(0, 0, 0, 0.2)',

        background: background,
        surface: shade(background, 3, dark),
        text: text,
        'text-secondary': textSecondary,
        'scheme-primary': primary,
        'scheme-danger': danger,
        'on-primary-text': onPrimary,
        'on-danger-text': onDanger,
        link: link,
        'link-hover': linkHover,
        shadow: 'rgba(0, 0, 0, 0.5)',
        border: border,
        'border-secondary': borderSecondary,
        'border-hover': borderHover,
        'border-active': borderActive,

        'text-strong': textStrong,

        'hr-background-color': border,
        'nav-hr-background-color': border,

        'code-background': border,

        'notification-background-color': border,

        'card-header-color': textStrong,
        'card-color': text,

        'menu-item-color': text,
        'menu-item-hover-background-color': border,
        'menu-item-hover-color': textStrong,
        'menu-item-active-background-color': overlayHover,
        'menu-label-color': text,

        'nav-active-color': 'rgba(0, 0, 0, 0.34)',
        'nav-active-secondary-color': 'rgba(120, 120, 120, 0.34)',
        'nav-active-text-color': contrastOn(primary),

        'tabs-link-color': text,
        'tabs-link-hover-color': textStrong,
        'tabs-link-active-color': link,

        'input-color': textStrong,
        'input-placeholder-color': placeholderAlpha,
        'input-focus-border-color': link,
        'input-disabled-color': textSecondary,
        'input-disabled-background-color': border,
        'input-disabled-border-color': border,
        'input-disabled-placeholder-color': disabledPlaceholderAlpha,

        'pagination-color': textStrong,
        'pagination-hover-color': textStrong,
        'pagination-focus-color': textStrong,

        'panel-block-hover-background-color': border,

        'code-font-color': codeFontColor,
        'preview-panel-background-color': previewPanelBackground,

        'v2-primary-text-color': textStrong,
        'v2-secondary-text-color': text,

        'v2-link-text-color': link,
        'v2-link-active-text-color': textStrong,

        'v2-hero-background-color': primary,
        'v2-hero-text-color': onPrimary,
        'v2-hero-subtitle-text-color': onPrimary,

        'v2-warning-background-color': warning,
        'v2-warning-text-color': onWarning,
        'v2-warning-subtitle-text-color': onWarning,

        'v2-table-row-background-color': borderSecondary,
        'v2-table-row-alt-background-color': border,
        'v2-table-row-text-color': textStrong,
        'v2-table-row-border-color': borderHover,

        'v2-active-tag-background-color': border,
        'v2-active-tag-color': textStrong,

        'v2-inactive-tag-background-color': primary,
        'v2-inactive-tag-color': onPrimary,

        'v2-active-menu-item-color': onBackground,
        'v2-inactive-menu-item-color': text,
    };
}

// Every CSS variable name a derived theme can set, used to fully clear a
// previous custom theme's inline styles before applying a different one.
export const THEME_VARIABLE_NAMES: string[] = Object.keys(deriveThemeVariables({
    background: '#000000',
    text: '#ffffff',
    primary: '#000000',
    danger: '#000000',
    dark: true,
}));
