/*
    horizontal menus
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
(function ($) {
    "use strict";

    /*INCLUDE_CSS("horizmenu", "horizmenu.css")*/

    var horizmenu = {
        init : function (el) {
            var id = '#' + el.id;
            $(el).attr(
                'triggered', false
            ).addEvent('click', function (e) {
                var menu = $(id)[0];
                if (menu.className === 'menu menuon') {
                    menu.className = 'menu menuoff';
                    menu.triggered = false;
                } else {
                    menu.className = 'menu menuon';
                    menu.triggered = true;
                    setTimeout(function () { menu.triggered = false;}, 100);
                }
                document.onclick = function (e) {
                    var menu = $(id)[0];
                    if (menu.triggered !== true) {
                        menu.className   = 'menu menuoff';
                        document.onclick = null;
                    }
                };
            });
        }
    };

    $.addPrototype($.extenders.elExtender, 'menu', function () {
        var ez = this._easyJS;
        ez.each(this.get(), horizmenu.init);
        return this;
    });
})(easyJS);
