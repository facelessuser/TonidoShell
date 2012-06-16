/*
    modal-shortcuts.js
    Shortcut Manager dialog
    Copyright 2010 Isaac Muse

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

/*global modal: false, busy: false, prompt: false, textBox: false, info: false,
         alert: false, warn: false, error: false*/

(function ($) {
    "use strict";
    /*INCLUDE_CSS("modal","modal-shortcuts.css")*/
    function shortcutMgr(text, options, fn) {
        options = $.merge(options, {
            'titleText'      : 'Shortcuts',
            'titleColor'     : 'black',
            'titleTextColor' : 'white',
            'icon'           : 'shortcut.png',
            'drag'           : true,
            'shortcuts'      : [],
            'closeBtn'       : true
        });
        var i, max,
        id       = modal.uniqueId(),
        focus    = "modalOkay" + id,
        callback = (typeof(fn) != 'undefined') ?
            function (e) {shortcutMgr.returns(id);modal.destroy(id);fn();} :
            function (e) {shortcutMgr.returns(id);modal.destroy(id);},

        rows     = shortcutMgr.addRows(options.shortcuts, id),
        body     =
            '<p class="modal_block">' +
                '<table class="modal_shortcut">' +
                    rows.rows +
                '</table>' +
            '</p>';

        modal(
            id,
            {
                'title'         :options.titleText,
                'text'          :text,
                'body'          :body,
                'fnYes'       :callback,
                'titleColor'    :options.titleColor,
                'titleTextColor':options.titleTextColor,
                'icon'          :options.icon,
                'drag'          :options.drag,
                'focus'         :focus,
                'okayText'      :'Apply',
                'cancelBtn'     :true,
                'closeBtn'      :options.closeBtn
            }
        );

        for (i = 0, max = rows.select.length; i < max; i++) {
            $('#shortcut' + i + '_' + id).attr('selectedIndex', rows.select[i]);
        }

        $('#modal' + id).attr('shortcutCount', rows.select.length);

        return id;
    }

    var shortcutLib = {
        addRows : function (list, id) {
            var rows = '',
            selected = [],
            i, item, sCut, options;
            for (i = 0; item = list[i];i++) {
                sCut    = $.shortcuts.events[item.id];
                options = shortcutMgr.addKeys(sCut.key);
                selected[i] = options.index;
                rows +=
                    '<tr id="shortcutRow' + i + '_' + id + '" class="shortcut_row">' +
                        '<td align="right"><input type="hidden" name="key" value="' + item.id + '">' +
                            '<label class="modal_shortcut_label">' + item.display + ':</label>' +
                        '</td>' +
                        '<td>' + shortcutMgr.addModifiers(sCut.ctrl, sCut.alt, sCut.shift, sCut.meta, i, id) + '</td>' +
                        '<td><select name="shortcut' + i + '" id="shortcut' + i + '_' + id + '">' + options.html + '</select></td>' +
                    '</tr>';
            }
            return {'rows': rows, 'select' : selected};
        },

        returns : function (id) {
            var cutCount = $('#modal' + id).attr('shortcutCount'),
            returns      = [],
            i, row, list;
            for (i = 0; i < cutCount; i++) {
                row = $('#shortcutRow' + i + '_' + id).get(0);
                list    = row.childNodes[2].childNodes[0];
                returns[i] =
                row.childNodes[0].firstChild.value + ':' +
                ((row.childNodes[1].childNodes[0].checked) ? 'true:' : 'false:') +
                ((row.childNodes[1].childNodes[2].checked) ? 'true:' : 'false:') +
                ((row.childNodes[1].childNodes[4].checked) ? 'true:' : 'false:') +
                ((row.childNodes[1].childNodes[6].checked) ? 'true:' : 'false:') +
                list.options[list.selectedIndex].value;
            }
            modal.returns = returns;
        },

        addModifiers : function (ctrl, alt, shift, meta, idx, id) {
            var modCtrl = shortcutMgr.addModifier('ctrl', ctrl, idx, id),
            modAlt      = shortcutMgr.addModifier('alt',  alt, idx, id),
            modShift    = shortcutMgr.addModifier('shift', shift, idx, id),
            modMeta     = shortcutMgr.addModifier('meta', meta, idx, id);
            return (modCtrl + modAlt + modShift + modMeta);
        },

        addModifier: function (name, mod, idx, id) {
            return (($.isUndef(mod)   || !mod) ?
            '<input type="checkbox" name="' + name + '" id="' + name + idx + '_' + id + '" /><label for="' + name + idx + '_' + id + '">' + name + ' </label>' :
            '<input type="checkbox" name="' + name + '" id="' + name + idx + '_' + id + '" checked="1"/><label for="' + name + idx + '_' + id + '">' + name + ' </label>');
        },

        addKeys : function (key) {
            var options = '',
            index       = 0,
            i           = 0,
            x;
            for (x in $.shortcuts.keys) {
                if (key === x) index = i;
                options += '<option value="' + x + '">' + ((/^[a-z]{1}$/.test(x)) ? x.toUpperCase() : x) + '</option>';
                i++;
            }
            return {'html': options, 'index' : index};
        }
    };

    $.extend(shortcutMgr, shortcutLib);
    window.shortcutMgr = shortcutMgr;
})(easyJS);
