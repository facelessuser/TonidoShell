/*
    sessionbar.js
    session tab bar
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

/*global INCLUDE_CSS: false*/
(function ($){
    "use strict";

    /*INCLUDE_CSS("sessionbar","sessionbar.css")*/

    var tabbar = {
        init : function (el, tabs, select, fn) {
            el.style.height = '24px';
            var id          = Math.floor(Math.random() * 999999),
            width           = 100 / tabs,
            count           = 0,
            html = '<table id="tabTable' + id + '" ' +
                           'class="tab" nowrap="nowrap" ' +
                           'cellpadding="0" cellspacing="0" >' +
                        '<tr class="tabrow">',
            i, j;
            for (i = 0; i < tabs; i++) {
                count = i + 1;
                html +=
                    '<td class="tab" nowrap="nowrap" style="width:' + width + '%;" >' +
                        '<div id="tab' + (i + 1) + '_' + id + '" ' +
                              'class="tab ' + ((i == parseInt(select, 10)) ? 'tab_selected': 'tab_unselected') + ' tab' + id + '" > ' +
                                '<label>Session ' + (i + 1) + '</label>' +
                        '</div>' +
                    '</td>';
            }
            html += '</tr></table>';
            el.innerHTML = html;

            for (j = 0; j < count; j++) {
                (function (idx) {
                    $('#tab' + (j + 1) + '_' + id).addEvent('click=', function(){tabbar.select(this, id, idx);});
                })(j);
            }
            $('#tabTable' + id).attr('tabSelect', ((fn) ? fn : function(){}));

            el.tabId = id;
        },

        select : function (el, id, num) {
            $('div.tab' + id).attr('className', 'tab tab_unselected tab' + id);
            el.className = 'tab tab_selected tab' + id;
            $('#tabTable' + id).attr('tabSelect')(num);
        },

        resize : function (el, size) {
            $("#tabTable" + el.tabId).css('width', size + 'px');
        }
    };
    $.addPrototype($.extenders.elExtender, 'sessionbar', function () {
        var ez  = this._easyJS,
        obj     = this;
        return ({
            'add' : function (tabs, select, fn) {
                ez.each(obj.get(), function (dom){return tabbar.init(dom, tabs, select, fn);});
                return obj;
            },
            'resize' : function (size) {
                ez.each(obj.get(), tabbar.resize, size);
                return obj;
            }
        });
    });
})(easyJS);
