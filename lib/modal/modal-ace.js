/*
    modal-ace.js
    modal dialog for Ace Editor
    Copyright 2012 Isaac Muse

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
*/

/*global modal: false, busy: false, prompt: false, info: false,
         alert: false, warn: false, error: false, fileSelector: false, ace: false, require: false*/

(function ($) {
    "use strict";
    modal.loadDialog("standard", "file");
    /*INCLUDE_CSS("modal", "modal-ace.css")*/
    var preferences = "preferences.ace-settings",

    defaultSettings = {
        "animateScrolling": false,
        "customFileRules": {},
        "customThemes": [],
        "enableBehaviours": true,
        "fadeFoldWidgets": true,
        "fontSize": 12,
        "highlightActiveLine": true,
        "highlightSelectedWord": true,
        "persistentHorizScroll": false,
        "printMargin": 80,
        "showFoldWidgets": true,
        "showGutter": true,
        "showInvisibles": false,
        "showPrintMargin": true,
        "softTab": true,
        "softWrap": false,
        "tabSize": 4,
        "theme": "clouds",
    },

    defaultSupportedThemes = [
        "chrome",
        "clouds",
        "clouds_midnight",
        "cobalt",
        "crimson_editor",
        "dawn",
        "dreamweaver",
        "eclipse",
        "github",
        "idle_fingers",
        "kr_theme",
        "merbivore_soft",
        "merbivore",
        "mono_industrial",
        "monokai",
        "pastel_on_dark",
        "solarized_dark",
        "solarized_light",
        "textmate",
        "tomorrow_night_blue",
        "tomorrow_night_bright",
        "tomorrow_night_eighties",
        "tomorrow_night",
        "tomorrow",
        "twilight",
        "vibrant_ink"
    ],

    defaultSupportedLanguages = {
        "c_cpp": "c|cc|cpp|cxx|h|hh|hpp",
        "clojure": "clj",
        "coffee": "coffee|^Cakefile",
        "coldfusion": "cfm|cfml|cfc",
        "csharp": "cs",
        "css": "css",
        "diff": "diff|patch",
        "golang": "go",
        "groovy": "groovy",
        "haxe": "hx",
        "html": "htm|html|xhtml",
        "java": "java",
        "javascript": "js",
        "json": "json|ace-settings",
        "jsx": "jsx",
        "latex": "latex|tex|ltx|bib",
        "less": "less",
        "liquid": "liquid",
        "lua": "lua",
        "luahtml": null,
        "luapage": "lp",
        "markdown": "md|markdown",
        "ocaml": "ocaml|ml|mli",
        "perl": "pl|pm",
        "pgsql": "pgsql",
        "php": "php|phtml",
        "powershell": "ps1",
        "python": "py",
        "ruby": "ru|gemspec|rake|rb",
        "scad": "scad",
        "scala": "scala|scl",
        "scss": "scss|sass",
        "sh": "sh|bash|bat",
        "sql": "sql",
        "svg": "svg",
        "text": "txt",
        "textile": "textile",
        "xml": "xml|rdf|rss|wsdl|xslt|atom|mathml|mml|xul|xbl",
        "xquery": "xq|xqy|xquery",
        "yaml": "yml"
    },

    util = {
        detectMode : function (path, rules, defaults) {
            var mode = "ace/mode/",
                lang, re;

            rules = $.merge(rules, defaultSupportedLanguages);

            for (lang in rules) {
                // Assume each rule is an extension and add a "." before unless it starts with "^"
                if (rules[lang] == null) continue;
                re = new RegExp("(" + (rules[lang].replace(/(^|\|)([^\^])/g, "$1\\.$2")) + ")$", "i");
                if (re.exec(path.basename())) {
                    return mode + lang;
                }
            }

            return mode + "text";
        },

        getMode : function (mode, additional) {
            var path = "ace/mode/",
                defaultTheme = "text",
                modes = $.merge(additional, defaultSupportedLanguages);

            mode = mode.replace(/[ ]/g, "_").toLowerCase();

            if (modes[mode]) {
                return path + mode;
            }

            return path + mode;
        },

        getTheme : function (theme, additional) {
            var path = "ace/theme/",
                defaultTheme = "clouds",
                themes = defaultSupportedThemes,
                lang, max, i;

            theme = theme.replace(/[ ]/g, "_").toLowerCase();
            themes = themes.concat(additional);
            max = themes.length;

            for (i = 0; i < max; i++) {
                if (themes[i] === theme) {
                    return path + theme;
                }
            }

            return path + defaultTheme;
        },

        translateName : function (name) {
            var underscore  = /(_[a-z\d])/,
                firstLetter = /(^[a-z])/;

            /* First letter */
            name = name.replace(
                firstLetter,
                function ($0, $1){
                    return $0.replace($1, $1[0].toUpperCase());
                }
            );

            /* underscores */
            while (underscore.test(name)) {
                name = name.replace(
                    underscore,
                    function ($0, $1){
                        return $0.replace($1, " " + $1[1].toUpperCase());
                    }
                );
            }
            return name;
        },

        generateSelectEntries : function (selection, custom, defaults) {
            var options = "",
                selected = false,
                item, arr, i;

            /* Handle object or array */
            if (!$.isArray(defaults)) {
                arr = [];
                for (i in $.merge(custom || {}, defaults)) {
                    arr.push(i);
                }
            } else {
                arr = defaults.concat(custom || []);
            }

            arr.sort();
            for (i = 0; item = arr[i]; i++) {
                if (!selected && item === selection.replace(/[ ]/g, "_").toLowerCase()) {
                    options += '<option selected>' + util.translateName(item) + '</option>';
                } else {
                    options += '<option>' + util.translateName(item) + '</option>';
                }
            }
            return options;
        }
    },

    modalAceEditor = {
        setText : function (id, text) {
            var editor = $('#aceEditor' + id).attr("aceHandle");
            editor.getSession().setValue(text);
        },

        appendText : function (id, text) {
            var editor = $('#aceEditor' + id).attr("aceHandle");
            text += editor.getSession().getValue();
            editor.getSession().setValue(text);
        },

        getText : function (id, readonly) {
            var editor = $('#aceEditor' + id).attr("aceHandle");
            if (!readonly) modal.returns = editor.getSession().getValue();
        },

        setSettings : function (id, editor, filepath, settings, manual) {
            var userSettings = $.merge(settings, defaultSettings);
            $($("#aceEditor" + id)[0].contentDocument).query("#editor")[0].style.fontSize = userSettings.fontSize + 'px';
            editor.setTheme(util.getTheme(userSettings.theme, userSettings.customThemes));
            if (manual) editor.getSession().setMode(util.getMode(userSettings.mode, userSettings.customFileRules));
            else        editor.getSession().setMode(util.detectMode(filepath, userSettings.customFileRules));
            editor.getSession().setUseWorker(false);
            editor.getSession().setUseSoftTabs(userSettings.softTab);
            editor.getSession().setTabSize(userSettings.tabSize);
            editor.renderer.setShowGutter(userSettings.showGutter);
            editor.renderer.setShowInvisibles(userSettings.showInvisibles);
            editor.renderer.setAnimatedScroll(userSettings.animateScrolling);
            editor.renderer.setHScrollBarAlwaysVisible(userSettings.persistentHorizScroll);
            editor.renderer.setShowPrintMargin(userSettings.showPrintMargin);
            editor.setHighlightActiveLine(userSettings.highlightActiveLine);
            editor.setHighlightSelectedWord(userSettings.highlightSelectedWord);
            editor.setBehavioursEnabled(userSettings.enableBehaviours);
            editor.setShowFoldWidgets(userSettings.showFoldWidgets);
            editor.setFadeFoldWidgets(userSettings.fadeFoldWidgets);
            editor.renderer.setPrintMarginColumn(userSettings.printMargin);
            if (userSettings.softWrap === false) {
                editor.getSession().setUseWrapMode(userSettings.softWrap);
            } else if (userSettings.softWrap === "free") {
                editor.getSession().setUseWrapMode(true);
                editor.getSession().setWrapLimitRange(null, null);
            } else {
                editor.getSession().setUseWrapMode(true);
                editor.getSession().setWrapLimitRange(userSettings.printMargin, userSettings.printMargin);
            }
        }
    },

    modalAceEditBox = {
        getContent : function (id) {
            var diag = $('#modal' + id)[0],
            alertMsg = 'Could not open file!',
            complete = function (e) {
                var jsondata = JSON.parse(e);
                if (jsondata.status !== 'Success') {
                    if (jsondata.status === 'Error') error('Ajax', jsondata.error);
                    else diag.alertFn(alertMsg);
                } else {
                    modalAceEditor.setText(id, jsondata.modaltextcontent);
                }
            };
            modal.show(diag.busyId, 'Loading file...', function () {
                var filePath   = encodeURIComponent(diag.pathName + '/' + diag.fileName),
                    parameters = ["modaltextread=1", "modalfile=" + filePath];
                $.ajax({
                    'url' : modal.scriptPath + "modalfile.php",
                    'type': "POST",
                    'parameters' : parameters,
                    'exit' : function (){modal.hide(diag.busyId);},
                    'fail' : function (){diag.alertFn(alertMsg);},
                    'complete' : complete,
                    'statusCode' : {500 : complete}
                });
            });
        },

        saveFile : function (id) {
            var diag  = $('#modal' + id)[0],
            saveAlert = 'Could not save file!';
            modal.show(diag.busyId, 'Saving file...', function () {
                var filePath   = encodeURIComponent(diag.pathName + '/' + diag.fileName),
                    editor     = $('#aceEditor' + id).attr("aceHandle"),
                    content    = encodeURIComponent(editor.getSession().getValue()),
                    parameters = ["modaltextresult=" + content, "modaltextpath=" + filePath],
                    complete   = function (e) {
                        var jsondata = JSON.parse(e);
                        if (jsondata.status !== 'Success') {
                            if (jsondata.status === 'Error') error('Ajax', jsondata.error);
                            else diag.alertFn(saveAlert);
                        } else {
                            $('#modalTitle' + id).attr('innerHTML', 'Edit: ' + diag.fileName);
                            $('#modalOkay' + id).css('display', 'inline');
                        }
                    };
                $.ajax({
                    'url' : modal.scriptPath + "modalfile.php",
                    'type': "POST",
                    'parameters' : parameters,
                    'exit' : function (){modal.hide(diag.busyId);},
                    'fail' : function (){diag.alertFn(saveAlert);},
                    'complete' : complete,
                    'statusCode' : {500 : complete}
                });
            });
        }
    };

    function aceEdit(text, options, fn) {
        options = $.merge(options, {
            'titleText'      : 'Edit',
            'titleColor'     : 'black',
            'titleTextColor' : 'white',
            'icon'           : 'file.png',
            'root'           : '',
            'readonly'       : false,
            'message'        : null,
            'filepath'       : '',
            'newfile'        : false,
            'okayText'       : 'Save',
            'cancelText'     : 'Close',
            'cancelBtn'      : true,
            'maximize'       : true,
            'fnNo'           : function(){},
            'closeBtn'       : true,
            'editorSettings' : {}
        });

        if (options.root === '') options.root = options.filepath.dirname();

        var buttons, saveBtn, editBusyId, editor, JavaScriptMode, aceWindow, waitForAccess, frame,
            id   = modal.uniqueId(),
            body     =
                '<p class="modal_block">' +
                    '<iframe id="aceEditor' + id + '" ' +
                             'class="ace_modal_frame"' +
                             'src="' + modal.scriptPath + 'editor.html">' +
                    '</iframe>' +
                '</p>',
            focus    = "aceEditor" + id,

            cleanUp = (options.maximize) ?
                function () {$('body').css('overflow', 'auto'); modalAceEditor.getText(id, options.readonly);} :
                function (){modalAceEditor.getText(id, options.readonly);},

            callback = (typeof(fn) != 'undefined') ?
                function (e) {
                    cleanUp();
                    modal.destroy(id);
                    fn();
                } :
                function (e) {
                    cleanUp();
                    modal.destroy(id);
                },

            maximize = (options.maximize === false) ?
                null :
                function () {
                    var body = $('#modalBody' + id)[0],
                    height =
                        body.offsetHeight -
                        $('#modalBadge' + id).attr('offsetHeight') -
                        $('#modalDiagButtons' + id).attr('offsetHeight') - 36 - 48,
                    width  = body.offsetWidth - 48 - 8;
                    $('#aceEditor' + id).css({'height': (height) + 'px', 'width' : (width) + 'px'});
                },

            /*Create a save as button to insert*/
            saveAsBtn = $('<input/>').attr({
                'type': 'button',
                'id': 'saveAs' + id,
                'value': 'Save As'
            })[0],

            /*Chain callback functions for "Save As" functionality*/
            /*Save Function*/
            saveFn = function () {
                $('#modal' + id).attr('fileName', modal.returns);
                $('#modalOkay' + id)[0].onclick();
            },

            maxCleanUp = (options.maximize) ?
                function () {$('body').css('overflow', 'auto');} :
                function () {},

            /*File Name Prompt*/
            selectNameFn = function () {
                $('#modal' + id).attr('pathName', modal.returns);
                prompt(
                    'Enter filename',
                    {
                        'titleText'      : 'File Name',
                        'titleColor'     : options.titleColor,
                        'titleTextColor' : options.titleTextColor,
                        'icon'           : options.icon,
                        'defaults'       : options.filepath.basename()
                    },
                    saveFn
                );
            };

        if (options.maximize) $('body').css('overflow', 'hidden');

        modal(
            id,
            {
                'title'         : options.titleText,
                'text'          : (
                    '<button class="ace_modal_settings_button" id="aceSettings' + id + '" type="button">Settings</button>'
                ),
                'body'          : body,
                'fnYes'         : callback,
                'fnNo'          : function(e) {
                    cleanUp();
                    modal.destroy(id);
                    options.fnNo();
                },
                'titleColor'    : options.titleColor,
                'titleTextColor': options.titleTextColor,
                'icon'          : options.icon,
                'drag'          : options.drag,
                'focus'         : focus,
                'maximize'      : maximize,
                'okayText'      : options.okayText,
                'cancelText'    : options.cancelText,
                'closeBtn'      : options.closeBtn,
                'cancelBtn'     : options.cancelBtn
            }
        );

        $("#aceSettings" + id)[0].onclick = function () {
            var doc = $("#aceEditor" + id)[0].contentDocument,
                overlay = $(doc).query("#aceSettingsOverlay" + id).get(0),
                editor =  $('#aceEditor' + id).attr("aceHandle"),
                frame,
                wrapRange,
                wrapping,
                aceUserSettings = {};

            if (overlay) {
                aceUserSettings = {
                    "softTab"               : $("#softTab" + id).attr("checked"),
                    "tabSize"               : parseInt($("#tabSize" + id).attr("value"), 10),
                    "showGutter"            : $("#showGutter" + id).attr("checked"),
                    "showFoldWidgets"       : $("#showFoldWidgets" + id).attr("checked"),
                    "highlightActiveLine"   : $("#highlightActiveLine" + id).attr("checked"),
                    "showInvisibles"        : $("#showInvisibles" + id).attr("checked"),
                    "persistentHorizScroll" : $("#persistentHorizScroll" + id).attr("checked"),
                    "animateScrolling"      : $("#animateScrolling" + id).attr("checked"),
                    "showPrintMargin"       : $("#showPrintMargin" + id).attr("checked"),
                    "highlightSelectedWord" : $("#highlightSelectedWord" + id).attr("checked"),
                    "enableBehaviours"      : $("#enableBehaviours" + id).attr("checked"),
                    "fadeFoldWidgets"       : $("#fadeFoldWidgets" + id).attr("checked"),
                    "fontSize"              : parseFloat($("#fontSize" + id).attr("value")),
                    "printMargin"           : parseInt($("#printMargin" + id).attr("value"), 10),
                    "theme"                 : $("#theme" + id).attr("value"),
                    "mode"                  : $("#mode" + id).attr("value")
                };
                wrapping = $("#softWrap" + id).attr("value");
                if (wrapping === 'On')        aceUserSettings.softWrap = true;
                else if (wrapping === 'Free') aceUserSettings.softWrap = "free";
                else if (wrapping === 'Off')  aceUserSettings.softWrap = false;
                $.getJSON(preferences).done(function (e) {aceUserSettings = $.merge(aceUserSettings, e);});

                modalAceEditor.setSettings(id, editor, options.filepath, aceUserSettings, true);
                $("#aceSettings" + id).attr('disabled', true);
                $("#aceSettingsPanel" + id).fade(
                    {
                        'start': 100,
                        'end': 0,
                        'fn': function (){
                            document.body.removeChild($("#aceSettingsPanel" + id)[0]);
                            $(doc).easyJS(overlay).fade(
                                {
                                    'start': 75,
                                    'end': 0,
                                    'fn': function () {
                                        doc.body.removeChild(overlay);
                                        $("#aceSettings" + id).attr(
                                            {
                                                "innerHTML": "Settings",
                                                "disabled" : false
                                            }
                                        );
                                    }
                                }
                            );
                        }
                    }
                );
            } else {
                aceUserSettings = {
                    "theme"                 : editor.getTheme().basename(),
                    "mode"                  : (editor.getSession().getMode().$id || "text").basename(),
                    "softTab"               : editor.getSession().getUseSoftTabs(),
                    "tabSize"               : editor.getSession().getTabSize(),
                    "showInvisibles"        : editor.renderer.getShowInvisibles(),
                    "persistentHorizScroll" : editor.renderer.getHScrollBarAlwaysVisible(),
                    "animateScrolling"      : editor.renderer.getAnimatedScroll(),
                    "showGutter"            : editor.renderer.getShowGutter(),
                    "showPrintMargin"       : editor.renderer.getShowPrintMargin(),
                    "printMargin"           : editor.renderer.getPrintMarginColumn(),
                    "showFoldWidgets"       : editor.getShowFoldWidgets(),
                    "highlightActiveLine"   : editor.getHighlightActiveLine(),
                    "highlightSelectedWord" : editor.getHighlightSelectedWord(),
                    "enableBehaviours"      : editor.getBehavioursEnabled(),
                    "fadeFoldWidgets"       : editor.getFadeFoldWidgets(),
                    "fontSize"              : parseFloat($($("#aceEditor" + id)[0].contentDocument).query("#editor")[0].style.fontSize)
                };
                wrapRange = editor.getSession().getWrapLimitRange();
                if (!editor.getSession().getUseWrapMode()) {
                    aceUserSettings.softWrap = false;
                } else if (editor.getSession().getUseWrapMode() && wrapRange.min == null) {
                    aceUserSettings.softWrap = "free";
                } else {
                    aceUserSettings.softWrap = true;
                    aceUserSettings.printMargin =  wrapRange.min;
                }
                $.getJSON(preferences).done(function (e) {aceUserSettings = $.merge(aceUserSettings, e);});

                doc.body.insertBefore(
                    $(doc).create("div").attr(
                        "id", "aceSettingsOverlay" + id
                    ).css(
                        {
                            "background-color" : "#000",
                            "opacity"          : "0",
                            "filter"           : "alpha(opacity=0)",
                            "position"         : "fixed",
                            "top"              : "0",
                            "left"             : "0",
                            "width"            : "100%",
                            "height"           : "100%",
                            'zIndex'           : $(doc).topZIndex() + 500
                        }
                    )[0],
                    doc.body.firstChild
                );
                $("#aceSettings" + id).attr('disabled', true);
                frame = $("#aceEditor" + id);
                document.body.insertBefore(
                    $('<div/>').attr(
                        {
                            "id"        : "aceSettingsPanel" + id,
                            "innerHTML" : (
                                '<table class="ace_settings_panel">' +
                                    '<tr><td class="ace_settings_label">' +
                                        '<label>Theme</label>' +
                                    '</td><td class="ace_settings_option">' +
                                        '<select id="theme' + id + '">' +
                                            util.generateSelectEntries(
                                                aceUserSettings.theme,
                                                aceUserSettings.customThemes,
                                                defaultSupportedThemes
                                            ) +
                                        '</select>' +
                                    '</td></tr>' +
                                    '<tr><td class="ace_settings_label">' +
                                        '<label>Language</label>' +
                                    '</td><td class="ace_settings_option">' +
                                        '<select id="mode' + id + '">' +
                                            util.generateSelectEntries(
                                                aceUserSettings.mode,
                                                aceUserSettings.customFileRules,
                                                defaultSupportedLanguages
                                            ) +
                                        '</select>' +
                                    '</td></tr>' +
                                    '<tr><td class="ace_settings_label">' +
                                        '<label>Font Size</label>' +
                                    '</td><td class="ace_settings_option">' +
                                        '<input type="text" id="fontSize' + id + '" value="' + aceUserSettings.fontSize + '"/>' +
                                    '</td></tr>' +
                                    '<tr><td class="ace_settings_label">' +
                                        '<label>Wrapping</label>' +
                                    '</td><td class="ace_settings_option">' +
                                        '<select id="softWrap' + id + '">' +
                                          '<option' + ((aceUserSettings.softWrap === true) ? ' selected' : '') + '>On</option>' +
                                          '<option' + ((aceUserSettings.softWrap === false) ? ' selected' : '') + '>Off</option>' +
                                          '<option' + ((aceUserSettings.softWrap === "free") ? ' selected' : '') + '>Free</option>' +
                                        '</select>' +
                                    '</td></tr>' +
                                    '<tr><td class="ace_settings_label">' +
                                        '<label>Print Margin</label>' +
                                    '</td><td class="ace_settings_option">' +
                                        '<input type="text" id="printMargin' + id + '" value="' + aceUserSettings.printMargin + '"/>' +
                                    '</td></tr>' +
                                    '<tr><td class="ace_settings_label">' +
                                        '<label for="showPrintMargin' + id + '">Show Print Margin</label>' +
                                    '</td><td class="ace_settings_option">' +
                                        '<input type="checkbox" id="showPrintMargin' + id + '" ' + ((aceUserSettings.showPrintMargin) ? 'checked="checked"' : '') + '/>' +
                                    '</td></tr>' +
                                    '<tr><td class="ace_settings_label">' +
                                        '<label for="showInvisibles' + id + '">Show Invisibles</label>' +
                                    '</td><td class="ace_settings_option">' +
                                        '<input type="checkbox" id="showInvisibles' + id + '" ' + ((aceUserSettings.showInvisibles) ? 'checked="checked"' : '') + '/>' +
                                    '</td></tr>' +
                                    '<tr><td class="ace_settings_label">' +
                                        '<label>Tab Size</label>' +
                                    '</td><td class="ace_settings_option">' +
                                        '<input type="text" id="tabSize' + id + '" value="' + aceUserSettings.tabSize + '"/>' +
                                    '</td></tr>' +
                                    '<tr><td class="ace_settings_label">' +
                                        '<label for="softTab' + id + '">Use Soft Tabs</label>' +
                                    '</td><td class="ace_settings_option">' +
                                        '<input type="checkbox" id="softTab' + id + '" ' + ((aceUserSettings.softTab) ? 'checked="checked"' : '') + '/>' +
                                    '</td></tr>' +
                                    '<tr><td class="ace_settings_label">' +
                                        '<label for="highlightSelectedWord' + id + '">Highlight Selected Word</label>' +
                                    '</td><td class="ace_settings_option">' +
                                        '<input type="checkbox" id="highlightSelectedWord' + id + '" ' + ((aceUserSettings.highlightSelectedWord) ? 'checked="checked"' : '') + '/>' +
                                    '</td></tr>' +
                                    '<tr><td class="ace_settings_label">' +
                                        '<label for="highlightActiveLine' + id + '">HighlightActiveLine</label>' +
                                    '</td><td class="ace_settings_option">' +
                                        '<input type="checkbox" id="highlightActiveLine' + id + '" ' + ((aceUserSettings.highlightActiveLine) ? 'checked="checked"' : '') + '/>' +
                                    '</td></tr>' +
                                    '<tr><td class="ace_settings_label">' +
                                        '<label for="showGutter' + id + '">Use Show Gutter</label>' +
                                    '</td><td class="ace_settings_option">' +
                                        '<input type="checkbox" id="showGutter' + id + '" ' + ((aceUserSettings.showGutter) ? 'checked="checked"' : '') + '/>' +
                                    '</td></tr>' +
                                    '<tr><td class="ace_settings_label">' +
                                        '<label for="showFoldWidgets' + id + '">Show Fold Widgets</label>' +
                                    '</td><td class="ace_settings_option">' +
                                        '<input type="checkbox" id="showFoldWidgets' + id + '" ' + ((aceUserSettings.showFoldWidgets) ? 'checked="checked"' : '') + '/>' +
                                    '</td></tr>' +
                                    '<tr><td class="ace_settings_label">' +
                                        '<label for="fadeFoldWidgets' + id + '">Fade Fold Widgets</label>' +
                                    '</td><td class="ace_settings_option">' +
                                        '<input type="checkbox" id="fadeFoldWidgets' + id + '" ' + ((aceUserSettings.fadeFoldWidgets) ? 'checked="checked"' : '') + '/>' +
                                    '</td></tr>' +
                                    '<tr><td class="ace_settings_label">' +
                                        '<label for="persistentHorizScroll' + id + '">Persistent Horizontal Scroll</label>' +
                                    '</td><td class="ace_settings_option">' +
                                        '<input type="checkbox" id="persistentHorizScroll' + id + '" ' + ((aceUserSettings.persistentHorizScroll) ? 'checked="checked"' : '') + '/>' +
                                    '</td></tr>' +
                                    '<tr><td class="ace_settings_label">' +
                                        '<label for="animateScrolling' + id + '">Animate Scrolling</label>' +
                                    '</td><td class="ace_settings_option">' +
                                        '<input type="checkbox" id="animateScrolling' + id + '" ' + ((aceUserSettings.animateScrolling) ? 'checked="checked"' : '') + '/>' +
                                    '</td></tr>' +
                                    '<tr><td class="ace_settings_label">' +
                                        '<label for="enableBehaviours' + id + '">Enable Behaviours</label>' +
                                    '</td><td class="ace_settings_option">' +
                                        '<input type="checkbox" id="enableBehaviours' + id + '" ' + ((aceUserSettings.enableBehaviours) ? 'checked="checked"' : '') + '/>' +
                                    '</td></tr>' +
                                '</table>'
                            )
                        }
                    ). css(
                        {
                            "border"     : frame.attr("border"),
                            "margin"     : frame.attr("margin"),
                            "top"        : frame.absPos('y') + "px",
                            "left"       : frame.absPos('x') + "px",
                            "width"      : frame.attr("offsetWidth") + "px",
                            "height"     : frame.attr("offsetHeight") + "px",
                            "position"   : "fixed",
                            "opacity"    : "0",
                            "filter"     : "alpha(opacity=0)",
                            "color"      : "white",
                            "overflow"   : "auto",
                            "text-align" : "center",
                            "zIndex"     : $(document).topZIndex() + 500,
                        }
                    )[0],
                    document.body.firstChild
                );
                $('#fontSize' + id).addEvent('change', function () {
                    var fontSize = this.value.toString(),
                        parts;
                    if (!(/^[0-9]*(\.5)?$/).test(fontSize)) {
                        parts = fontSize.replace(/[^\d\.]/g, "").split('.');
                        fontSize = parts[0] + ((parts[1]) ? ((parts[1] !== "") ? ".5" : "") : "");
                    }
                    this.value = fontSize;
                });
                $('#printMargin' + id, '#tabSize' + id).addEvent('change', function () {
                    this.value = this.value.toString().replace(/[^\d]/g, "");
                });
                $(doc).query("#aceSettingsOverlay" + id).fade(
                    {
                        'start': 0,
                        'end' : 75,
                        'fn' : function () {
                            $("#aceSettingsPanel" + id).fade({'start': 0, 'end' : 100});
                            $("#aceSettings" + id).attr(
                                {
                                    "innerHTML": "Apply",
                                    "disabled" : false
                                }
                            );
                        }
                    }
                );
            }
        };

        /*Select destination directory*/
        saveAsBtn.onclick  = function () {
            $('#modal' + id).attr({
                'pathName' : null,
                'fileName' : null
            });
            fileSelector(
                'Select Destination',
                {
                    'titleText'      : 'Folder Selector',
                    'titleColor'     : options.titleColor,
                    'titleTextColor' : options.titleTextColor,
                    'root'           : options.root,
                    'folder'         : options.filepath.dirname(),
                    'icon'           : options.icon,
                    'getFiles'       : true,
                    'selectFiles'    : false,
                    'getDrives'      : true
                },
                selectNameFn
            );
        };

        /*Add save as button*/
        buttons = $('#modalDiagButtons' + id)[0];
        buttons.insertBefore(saveAsBtn, buttons.firstChild);

        /*Modify okay button to save files only*/
        saveBtn  = $('#modalOkay' + id)[0];
        if (fn == null) fn = function(){};
        saveBtn.onclick = function () {
            modalAceEditBox.saveFile(id);
            fn();
        };
        if (options.newfile) saveBtn.style.display = 'none';

        /*Initialize variables and error and busy dialogs call*/
        $('#modal' + id).attr({
            'pathName' : options.filepath.dirname(),
            'fileName' : options.filepath.basename(),
            'alertFn': function(alertMsg){
                warn(
                    alertMsg,
                    {
                        'titleText'      : 'Error',
                        'titleColor'     : options.titleColor,
                        'titleTextColor' : options.titleTextColor
                    }
                );
            },
            'busyId'  : busy(
                'Please wait...',
                {
                    'titleText'      : 'File Operation',
                    'titleColor'     : options.titleColor,
                    'titleTextColor' : options.titleTextColor
                }
            )
        });

        /*adjust cancel/close buttons*/
        $('#modalCancel' + id + ', #modalXCloseBtn' + id).addEvent('click=', function(e) {
            var settingsPanel = $("#aceSettingsPanel" +id).get(0);
            if (settingsPanel) document.body.removeChild(settingsPanel);
            maxCleanUp();
            modal.destroy($('#modal' + id).attr('busyId'));
            modal.destroy(id);
            options.fnNo();
        });

        waitForAccess = function () {
            var userSettings = {};

            aceWindow = $("#aceEditor" + id)[0].contentWindow;
            if (typeof aceWindow.ace !== "undefined") {
                $.getJSON(preferences).done(function (e) {userSettings = e;});
                editor = aceWindow.ace.edit("editor");
                modalAceEditor.setSettings(id, editor, options.filepath, $.merge(options.editorSettings, userSettings), false);
                $('#aceEditor' + id).attr("aceHandle", editor);

                if      (options.message != null) modalAceEditor.setText(id, options.message);
                else if (!options.newfile)        modalAceEditBox.getContent(id);
            } else {
                setTimeout(waitForAccess, 1000);
            }
        };

        setTimeout(waitForAccess, 1000);

        return id;
    }

    $.extend(aceEdit, modalAceEditor);

    window.aceEdit = aceEdit;
})(easyJS);
