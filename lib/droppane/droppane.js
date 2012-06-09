/*
    droppane.js
    dropdown pane
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
(function ($){
    "use strict";

    // Detect module folder
    $.getLoadingScriptPath(
        function (script) {
            var scriptPath = script.dirname();
            if (scriptPath !== '') scriptPath += "/";
            // Load CSS for module if not already loaded
            $.require(scriptPath + "droppane.css");
        }
    );

    var droppane = function (content) {
        var id  = Math.floor(Math.random() * 999999),
            div = $('<div/>').attr({
                'id'       : 'dropPaneDetect' + id ,
                'className':'drop_pane_common drop_pane_detect'
            }).css(
                'zIndex', $(document).topZIndex() + 10
            ).addEvent('mouseover', function () {
                $('#dropPane' + id).attr('paneShow', true);
                setTimeout(function () {
                    if ($('#dropPane' + id).attr('paneShow')) {
                        $('#dropPane' + id).attr('paneShow', false).animate({
                            'css'   : true,
                            'target': 'top',
                            'start' : '-24px',
                            'end'   : '0px'
                        }, 500);
                        document.onmouseup = function () {
                            $('#dropPane' + id).animate({
                                'css'   : true,
                                'target': 'top',
                                'start' : '0px',
                                'end'   : '-24px'
                            }, 500);
                            document.onmouseup = null;
                        };
                    }
                }, 1500);
            }).addEvent('mouseout', function () {
                $('#dropPane' + id).attr('paneShow', false);
            })[0],
            innerContent =
                '<div class="drop_pane_trans"></div>' +
                '<div class="drop_pane_content">' + content + '</div>',
            dropDown  = $('<div/>').attr({
                'id'       : 'dropPane' + id ,
                'className': 'drop_pane_common drop_pane',
                'innerHTML': innerContent
            }).css(
                'zIndex', $(document).topZIndex() + 10
            )[0];

        document.body.insertBefore(dropDown, document.body.firstChild);
        document.body.insertBefore(div, document.body.firstChild);
    };

    $.extend($, {'droppane':droppane});
})(easyJS);
