# UG Usable Desktop Corners NX

This fork rounds the corners of the *usable desktop space* (the monitor's work area, excluding the top panel and any always-visible dock) instead of the physical screen/panel edges. For example, with a dock fixed on the left, the left corners are drawn just to the right of the dock.

[<img src="https://github.com/aunetx/files_utils/raw/master/get_it_on_gnome_extensions.png" height="100" align="right">](https://extensions.gnome.org/extension/4805/panel-corners/)

A GNOME shell extension to keep the old topbar corners, which were removed for GNOME 42. It also allows you to customize the rounded corners, even if you use GNOME 40 or 41.

- if your GNOME shell theme still supports rounded corners (which is the case for Adwaita until GNOME 42), then this extension will provide them.
- else, this extension will provide them, and manage automatically the corners settings: the radius, background-color, ... which are normally set by the theme are then managed by the extension directly.

If your theme supports panel corners but you want to customize them anyway, you can set the setting `force-extension-values` to `true` (see [Customization](https://github.com/authorwerks-dev/ug-usable-desktop-corners-nx/blob/master/README.md#Customization)).


A very big part of the code is directly ported from the [official GNOME shell repository](https://gitlab.gnome.org/GNOME/gnome-shell), so the immense majority of the work was done by various gnome contributors. All this extension does is integrate the previous code as an extension, provide some configuration options and make all of this compatible for GNOME 42 and later.

The bottom corners code is directly ported from [this merge request by Alice Mikhaylenko](https://gitlab.gnome.org/GNOME/gnome-shell/-/merge_requests/1328) to have roundness on every corner of every screen.

## Installation

This fork is not on extensions.gnome.org (the link above is the upstream
Panel Corners extension), so install it from source.

### Requirements

`make`, `gettext` (to compile the translations), plus the `gnome-extensions`
and `glib-compile-schemas` tools (on Ubuntu these come with `gnome-shell` and
`libglib2.0-bin`):

```sh
sudo apt install make gettext libglib2.0-bin
```

### Build and install

```sh
git clone https://github.com/authorwerks-dev/ug-usable-desktop-corners-nx.git
cd ug-usable-desktop-corners-nx
make install
```

This packs the extension into
`build/ug-usable-desktop-corners-nx@authorwerks-dev.shell-extension.zip` and
installs it to `~/.local/share/gnome-shell/extensions/`. `make build` only
creates the zip.

GNOME 49+ runs on Wayland only, so the shell can't be restarted in place:
**log out and back in**, then enable it:

```sh
gnome-extensions enable ug-usable-desktop-corners-nx@authorwerks-dev
```

(or use the Extensions app). Open the settings with `make test-prefs` or
`gnome-extensions prefs ug-usable-desktop-corners-nx@authorwerks-dev`.

### Uninstall

```sh
make remove
```

## Customization

By default the corners take the top bar's background color and follow it as it
changes (theme, light/dark style, lock screen). On Ubuntu they always stay
visible in the overview, keeping the top bar's color from outside it. Turn off
"Match top bar color" for the panel or screen corners to use a fixed color
instead.

Most options are in the preferences window. Every setting can also be changed
with gsettings once the extension is installed:

```sh
gsettings --schemadir=$HOME/.local/share/gnome-shell/extensions/ug-usable-desktop-corners-nx@authorwerks-dev/schemas \
    set org.gnome.shell.extensions.ug-usable-desktop-corners-nx preference value
```

You can see available preferences in `schemas/org.gnome.shell.extensions.ug-usable-desktop-corners-nx.gschema.xml`.

## Versions support

This extension was created for GNOME 42 and later, but was backward-compatible. Last versions are not, because they only are compatibility updates.

| GNOME shell version | Extension version |
| ------------------- | ----------------- |
| 46, 47, 48, 49, 50  | 15                |
| 45                  | 11                |
| 42, 43, 44          | 7                 |
| 40, 41              | 3                 |

## License

This extensions is licensed under GPLv3.
