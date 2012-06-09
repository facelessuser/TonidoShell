/*
    breadcrumbs.js
    breadcrumb bar
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

(function ($) {
    "use strict";

    // Detect module folder
    $.getLoadingScriptPath(
        function (script) {
            var scriptPath = script.dirname();
            if (scriptPath !== '') scriptPath += "/";
            // Load CSS for module if not already loaded
            $.require(scriptPath + "breadcrumbs.css");
        }
    );

    var crumbbar = {
        init : function (el, goDir, speed) {
            var id = Math.floor(Math.random() * 999999),
            html =
                '<table class="crumbtable" border="0" cellpadding="0" cellspacing="0"><tr class="crumbrow">' +
                    '<td class="crumbscroller">' +
                        '<div id="crumbscrollleft' + id + '" class="crumbscroller_wrap" >' +
                            '<div class="crumbscroller_arrow crumbscroller_arrow_left"></div>' +
                        '</div>' +
                    '</td>' +
                    '<td>' +
                        '<div id="crumbdiv' + id + '" class="crumbdiv" ></div>' +
                    '</td>' +
                    '<td class="crumbscroller" align="right" >' +
                        '<div id="crumbscrollright' + id + '" class="crumbscroller_wrap" >' +
                            '<div class="crumbscroller_arrow crumbscroller_arrow_right"></div>' +
                        '</div>' +
                    '</td>' +
                '</tr></table>';
            el.innerHTML = html;
            $("#crumbdiv" + id).attr({
                'speed'    : ((speed == null) ? 10 : speed) ,
                'goDir'    : ((goDir == null) ? function(){} : goDir)
            });
            $("#crumbscrollleft" + id).addEvent('mouseover', function(){
                crumbbar.scroll(id, 'start', speed, 0);
            }).addEvent('mouseout', function(){
                crumbbar.scroll(id, 'end');
            });
            $("#crumbscrollright" + id).addEvent('mouseover', function(){
                crumbbar.scroll(id, 'start', speed, 1);
            }).addEvent('mouseout', function(){
                crumbbar.scroll(id, 'end');
            });
            el.crumbId = id;
        },

        goDir : function (id, crumbs) {
            $("#crumbdiv" + id)[0].goDir(crumbs);
        },

        shift : function (id, dir) {
            var el = $("#crumbdiv" + id)[0],
            pos, diff, limit;
            if (el.speed !== 0) {
                pos    = (dir) ? el.scrollLeft + el.speed : el.scrollLeft - el.speed;
                diff   = Math.abs(pos - el.scrollWidth);
                limit  = (dir) ? el.scrollWidth : 0;
                if ((dir && pos <= limit) || (!dir && pos >= limit) ) {
                    el.scrollLeft = pos;
                    setTimeout(function(){crumbbar.shift(id, dir);}, 100);
                } else {
                    if (diff < el.speed) el.scrollLeft = (dir) ? pos - diff : pos + diff;
                    el.speed = 0;
                }
            }
        },

        getBreadCrumbs : function (dir, root) {
            var crumbs = [];
            while (dir !== "" && dir !== root) {
                crumbs.push(dir);
                dir = dir.dirname();
            }

            crumbs.push((root === '/' || dir === "") ? root : dir);

            return crumbs;
        },

        updateMenu : function (el, path, root) {
            var id    = el.crumbId,
            crumbs    = crumbbar.getBreadCrumbs(path, root),
            html      = '<table border="0" cellpadding="0" cellspacing="0"><tr>',
            maxCrumbs = crumbs.length - 1,
            skipFirst = false,
            name, i, j;
            for (i = maxCrumbs; i >= 0 ; i--) {
                name = crumbs[i].basename();
                if (name === '' && i == maxCrumbs) name = '/';
                if (name !== '') {
                    html +=
                        ((i != maxCrumbs) ? '<td class="crumbdivider">&#62;</td>' : '') +
                            '<td class ="crumbitem" >' +
                                '<a href="javascript:void(0)" ' +
                                    'id="crumblink' + id + '_' + i + '" ' +
                                    'class="crumblink">' + name + '</a>' +
                            '</td>';
                } else if (i === 0) {
                    skipFirst = true;
                }
            }
            $("#crumbdiv" + id).attr('innerHTML', html + '<td class="crumbspacer" ></td></tr></table>');
            for (j = 0; j <= maxCrumbs; j++) {
                (function (idx) {
                    if (j !== 0 || !skipFirst) {
                        $("#crumblink" + id + "_" + idx).addEvent('click', function () {crumbbar.goDir(id, crumbs[idx]);});
                    }
                })(j);
            }
        },

        resize : function (el, size) {
            var id = el.crumbId;
            if (size > 24) size = size - 24;
            $("#crumbdiv" + id).css('width', size + 'px');
        },

        scroll : function (id, type, speed, dir) {
            if (type === 'start') {
                $("#crumbdiv" + id).attr('speed', speed);
                crumbbar.shift(id, dir);
            } else {
                $("#crumbdiv" + id).attr('speed', 0);
            }
        }
    };

    $.addPrototype($.extenders.elExtender, 'crumbbar', function () {
        var ez  = this._easyJS,
        obj     = this;
        return ({
            'add' : function (goDir, speed) {
                ez.each(obj.get(), function (dom){return crumbbar.init(dom, goDir, speed);});
                return obj;
            },
            'resize' : function (size) {
                ez.each(obj.get(), crumbbar.resize, size);
                return obj;
            },
            'update' : function (path, root) {
                ez.each(obj.get(), function (dom) {crumbbar.updateMenu(dom, path, root);});
                return obj;
            }
        });
    });
})(easyJS);
