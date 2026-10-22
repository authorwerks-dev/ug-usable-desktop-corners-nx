NAME = ug-usable-desktop-corners-nx
UUID = $(NAME)@authorwerks-dev


.PHONY: build install pot test-shell test-prefs remove clean


build: clean
	mkdir -p build/
	cd src && gnome-extensions pack -f \
			--extra-source=../metadata.json \
			--extra-source=../resources/ui \
			--extra-source=./conveniences \
			--extra-source=./utils.js \
			--extra-source=./panel_corner.js \
			--extra-source=./screen_corner.js \
			--podir=../po \
			--schema=../schemas/org.gnome.shell.extensions.$(NAME).gschema.xml \
			-o ../build


install: build remove
	gnome-extensions install -f build/$(UUID).shell-extension.zip


pot:
	find resources/ui -iname "*.ui" -printf "%p\n" | sort | \
		xargs xgettext --output=po/$(UUID).pot --from-code=utf-8 --package-name=$(UUID)

	rm po/LINGUAS
	for l in $$(ls po/*.po); do \
		basename $$l .po >> po/LINGUAS; \
	done

	cd po && \
	for lang in $$(cat LINGUAS); do \
    	mv $${lang}.po $${lang}.po.old; \
    	msginit --no-translator --locale=$$lang --input $(UUID).pot -o $${lang}.po.new; \
    	msgmerge -N $${lang}.po.old $${lang}.po.new > $${lang}.po; \
    	rm $${lang}.po.old $${lang}.po.new; \
	done


test-prefs: install
	gnome-extensions prefs $(UUID)


# GNOME 49+ dropped the X11 nested mode; --devkit opens a nested Wayland
# session in a window (needs mutter-dev-bin / mutter-devkit installed).
test-shell: install
	dbus-run-session -- gnome-shell --devkit --wayland


remove:
	rm -rf $(HOME)/.local/share/gnome-shell/extensions/$(UUID)


clean:
	rm -rf build/ po/*.mo