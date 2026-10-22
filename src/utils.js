import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';
import St from 'gi://St';
import Cogl from 'gi://Cogl';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export function lookup_for_length(node, prop, settings, key = prop.slice(1)) {
    const use_extension_values = node && settings.FORCE_EXTENSION_VALUES.get();

    let lookup = [];
    if (use_extension_values)
        lookup = node.lookup_length(prop, false);

    if (use_extension_values || !lookup[0]) {
        let scale_factor =
            St.ThemeContext.get_for_stage(global.stage).scale_factor;
        let length = settings.get_property(key).get();

        return length * scale_factor;
    } else {
        return lookup[1];
    }
};

export function lookup_for_double(node, prop, settings) {
    const use_extension_values = node && settings.FORCE_EXTENSION_VALUES.get();

    let lookup = [];
    if (use_extension_values)
        lookup = node.lookup_double(prop, false);

    if (use_extension_values || !lookup[0]) {
        return settings.get_property(prop.slice(1)).get();
    } else {
        return lookup[1];
    }
};

export function lookup_for_color(node, prop, settings) {
    const use_extension_values = node && settings.FORCE_EXTENSION_VALUES.get();

    let lookup = [];
    if (use_extension_values)
        lookup = node.lookup_color(prop, false);

    if (use_extension_values || !lookup[0]) {
        let color_str = settings.get_property(prop.slice(1)).get();
        let color_parsed = Clutter.Color ?
            Clutter.color_from_string(color_str) :
            Cogl.color_from_string(color_str);

        if (color_parsed[0]) {
            return color_parsed[1];
        } else {
            // could not parse color, defaulting to black
            settings.get_property(prop.slice(1)).set('#000000ff');

            return Clutter.Color ?
                Clutter.color_from_string('#000000ff')[1] :
                Cogl.color_from_string('#000000ff')[1];
        }
    } else {
        return lookup[1];
    }
};

/**
 * Whether we are running on Ubuntu (or an Ubuntu derivative), from
 * /etc/os-release.
 */
export const IS_UBUNTU = (() => {
    try {
        const id = GLib.get_os_info('ID') ?? '';
        const id_like = (GLib.get_os_info('ID_LIKE') ?? '').split(/\s+/);
        return id === 'ubuntu' || id_like.includes('ubuntu');
    } catch (e) {
        return false;
    }
})();

// last top bar colour seen outside the overview
let last_panel_color = null;

/** Forgets the cached top bar colour (call on extension disable). */
export function reset_panel_color_cache() {
    last_panel_color = null;
}

function in_overview() {
    return Main.overview.visible ||
        Main.panel.has_style_pseudo_class('overview');
}

/**
 * Returns the colour to paint a corner with.
 *
 * When `<prefix>-match-panel-color` is on, this is the top bar's current
 * background colour, read from its theme node so it follows theme, light/dark
 * style and state changes. Otherwise, or if the top bar's style can't be
 * read, falls back to `lookup_for_color`.
 *
 * On Ubuntu the corners are deliberately kept visible in the overview: there
 * the colour last seen outside the overview is used, so a theme that makes the
 * top bar transparent in the overview doesn't make the corners vanish.
 */
export function corner_color(node, prop, settings, match_key) {
    if (settings.get_property(match_key).get()) {
        try {
            if (IS_UBUNTU && in_overview()) {
                if (last_panel_color)
                    return last_panel_color;
                // never seen outside the overview yet: use the configured
                // colour rather than a possibly transparent one
            } else {
                last_panel_color =
                    Main.panel.get_theme_node().get_background_color();
                return last_panel_color;
            }
        } catch (e) {
            // the panel is not styled yet; use the configured colour
        }
    }

    return lookup_for_color(node, prop, settings);
};
