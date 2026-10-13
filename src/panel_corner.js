import Clutter from 'gi://Clutter';
import St from 'gi://St';
import GObject from 'gi://GObject';
import Cairo from 'cairo';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as Utils from './utils.js';
import { get_work_area } from './screen_corner.js';
import { ANIMATION_TIME } from 'resource:///org/gnome/shell/ui/overview.js';

const SYNC_CREATE = GObject.BindingFlags.SYNC_CREATE;

export class PanelCorners {
    #settings;
    #connections;

    constructor(settings, connections) {
        this.#settings = settings;
        this.#connections = connections;
    }

    /**
     * Updates the corners.
     *
     * This removes already existing corners (previously created by the
     * extension, or from the shell itself), and create new ones.
     */
    update() {
        this.#log("updating panel corners...");

        // remove already existing corners
        this.remove();

        // create each corner
        Main.panel._leftCorner = new PanelCorner(
            St.Side.LEFT, this.#settings
        );
        Main.panel._rightCorner = new PanelCorner(
            St.Side.RIGHT, this.#settings
        );

        // update each of them
        this.update_corner(Main.panel._leftCorner);
        this.update_corner(Main.panel._rightCorner);

        this.#log("corners updated.");
    }

    /**
     * Updates the given corner.
     */
    update_corner(corner) {
        // bind corner style to the panel style
        Main.panel.bind_property('style', corner, 'style', SYNC_CREATE);

        // add corner to the panel
        Main.panel.add_child(corner);

        // update its style, showing it
        corner.vfunc_style_changed();

        const actor = (this.#settings.settings);

        // connect to each preference change from the extension, allowing the
        // corner to be updated when the user changes preferences
        this.#settings.keys.forEach(key => {
            this.#connections.connect(
                actor,
                'changed::' + key.name,
                corner.vfunc_style_changed.bind(corner)
            );
        });
    }

    /**
     * Removes existing corners.
     *
     * It is meant to destroy entirely old corners, except if they were saved
     * by the extension on load; in which case it keep them intact to restore
     * them on extension disable.
     */
    remove() {
        // disconnect every signal created by the extension
        this.#connections.disconnect_all();

        let panel = Main.panel;

        // disable each corner

        if (panel._leftCorner) {
            this.remove_corner(panel._leftCorner);
            delete panel._leftCorner;
        }

        if (panel._rightCorner) {
            this.remove_corner(panel._rightCorner);
            delete panel._rightCorner;
        }
    }

    /**
     * Removes the given corner.
     */
    remove_corner(corner) {
        // remove connections
        corner.remove_connections();

        // remove from panel
        Main.panel.remove_child(corner);

        // destroy the corner
        corner.destroy();
    }

    #log(str) {
        if (this.#settings.DEBUG.get())
            console.log(`[UG Usable Desktop Corners NX] ${str}`);
    }
}


export class PanelCorner extends St.DrawingArea {
    static {
        GObject.registerClass(this);
    }

    #side;
    #settings;

    #position_changed_id = Main.panel.connect(
        'notify::position',
        this.#update_allocation.bind(this)
    );

    #size_changed_id = Main.panel.connect(
        'notify::size',
        this.#update_allocation.bind(this)
    );


    constructor(side, settings) {
        super({ style_class: 'panel-corner' });

        this.#side = side;
        this.#settings = settings;

        this.#update_allocation();
    }

    remove_connections() {
        if (this.#position_changed_id) {
            Main.panel.disconnect(this.#position_changed_id);
            this.#position_changed_id = null;
        }
        if (this.#size_changed_id) {
            Main.panel.disconnect(this.#size_changed_id);
            this.#size_changed_id = null;
        }
    }

    #update_allocation() {
        let childBox = new Clutter.ActorBox();

        let cornerWidth, cornerHeight;
        [, cornerWidth] = this.get_preferred_width(-1);
        [, cornerHeight] = this.get_preferred_height(-1);

        let allocWidth = Main.panel.width;
        let allocHeight = Main.panel.height;

        // place the corners at the edges of the usable desktop space (work
        // area) of the primary monitor instead of the edges of the panel, so
        // that e.g. a dock always visible on the left pushes the left corner
        // to its right
        let left = 0;
        let right = allocWidth;
        let monitor = Main.layoutManager.primaryMonitor;
        if (monitor) {
            let area = get_work_area(monitor);
            // the panel box spans the primary monitor; the corners are
            // allocated relative to the panel itself
            let panel_x = Main.layoutManager.panelBox.x + Main.panel.x;
            if (!Number.isFinite(panel_x))
                panel_x = monitor.x;
            left = Math.max(0, area.x - panel_x);
            right = Math.min(allocWidth, area.x + area.width - panel_x);
            if (right <= left) {
                left = 0;
                right = allocWidth;
            }
        }

        switch (this.#side) {
            case St.Side.LEFT:
                childBox.x1 = left;
                childBox.x2 = left + cornerWidth;
                childBox.y1 = allocHeight;
                childBox.y2 = allocHeight + cornerHeight;
                break;

            case St.Side.RIGHT:
                childBox.x1 = right - cornerWidth;
                childBox.x2 = right;
                childBox.y1 = allocHeight;
                childBox.y2 = allocHeight + cornerHeight;
                break;
        }

        this.allocate(childBox);
    }

    vfunc_repaint() {
        let node = this.get_theme_node();

        let cornerRadius = Utils.lookup_for_length(node, '-panel-corner-radius', this.#settings, 'corner-radius');
        let borderWidth = Utils.lookup_for_length(node, '-panel-corner-border-width', this.#settings);

        let backgroundColor = Utils.lookup_for_color(node, '-panel-corner-background-color', this.#settings);

        let cr = this.get_context();
        cr.setOperator(Cairo.Operator.SOURCE);

        cr.moveTo(0, 0);
        if (this.#side == St.Side.LEFT) {
            cr.arc(cornerRadius,
                borderWidth + cornerRadius,
                cornerRadius, Math.PI, 3 * Math.PI / 2);
        } else {
            cr.arc(0,
                borderWidth + cornerRadius,
                cornerRadius, 3 * Math.PI / 2, 2 * Math.PI);
        }
        cr.lineTo(cornerRadius, 0);
        cr.closePath();

        cr.setSourceColor(backgroundColor);
        cr.fill();

        cr.$dispose();
    }

    vfunc_style_changed() {
        super.vfunc_style_changed();
        let node = this.get_theme_node();

        let cornerRadius = Utils.lookup_for_length(node, '-panel-corner-radius', this.#settings, 'corner-radius');
        let borderWidth = Utils.lookup_for_length(node, '-panel-corner-border-width', this.#settings);

        let opacity = Utils.lookup_for_double(node, '-panel-corner-opacity', this.#settings);

        // the corners round the usable desktop space, which still exists in
        // the overview (between the panel and the dock), so they are kept
        // visible there instead of being faded out

        this.#update_allocation();
        this.set_size(cornerRadius, borderWidth + cornerRadius);
        this.translation_y = -borderWidth;

        this.remove_transition('opacity');
        this.ease({
            opacity: opacity * 255,
            duration: ANIMATION_TIME,
            mode: Clutter.AnimationMode.EASE_IN_OUT_QUAD,
        });
    }

    #log(str) {
        if (this.#settings.DEBUG.get())
            console.log(`[UG Usable Desktop Corners NX] ${str}`);
    }
}
