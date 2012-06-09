/*
    modal.js
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

/*Generic Modal Object*/
(function ($) {
    "use strict";
    var modal = function (id, options) {
        return new modal.create(id, options);
    },

    internal = {
        scriptPath : '.',
        returns : null,
        badges : {},

        init : function(script) {
            if (script) modal.scriptPath = script;
            $.require(modal.scriptPath + "modal.css");
        },

        uniqueId : function () {
            var id = null;
            do {
                id = Math.floor(Math.random() * 999999);
            } while ($('#modal' + id).get(0));
            return id;
        },

        create : function (id, options) {
            options = $.merge(options, {
                'title'          : 'Modal Dialog',
                'text'           : 'text goes here',
                'body'           : '',
                'fnYes'          : function(e) {modal.destroy(id);},
                'fnNo'           : function(e) {modal.destroy(id);},
                'titleColor'     : 'black',
                'titleTextColor' : 'white',
                'icon'           : 'info.png',
                'drag'           : true,
                'focus'          : 'modalOkay' + id,
                'cancelBtn'      : false,
                'okayText'       : 'Okay',
                'cancelText'     : 'Cancel',
                'silent'         : false,
                'closeBtn'       : true,
                'okayBtn'        : true
            });

            modal.returns = null;

            var el, focusEl,

                /*Add overlay*/
                overlay = modal._createOverlay('modalOverlay', id),

                /*create main div*/
                dvid = 'modal' + id,

                icon = (options.icon == null) ? '' :
                    '<img id="modalBadge' + id + '" class="modal_badge" src="' +
                    (modal.badges[options.icon] || options.icon) +
                     '" >',

                titleClose = (!options.closeBtn) ? '' :
                    '<td class="modal_close" >' +
                      '<a href="javascript:void(0)" id="modalXCloseBtn' + id + '" class="modal_close" ></a>' +
                    '</td>',

                okayBtn = (!options.okayBtn) ? '' :
                    '<input type="button" id="modalOkay' + id + '" value="' + options.okayText + '" ></input>',

                cancelBtn = (!options.cancelBtn) ? '' :
                    '<input type="button" id="modalCancel' + id + '" value="' + options.cancelText + '" ></input>',

                div  = $('<div/>').attr({
                    'id'       : dvid ,
                    'className':'modal_diag'
                }).css('zIndex', $(document).topZIndex() + 500).attr('innerHTML',
                    '<table id="modalBody' + id + '" cellpadding="0" cellspacing="0">' +
                        '<tr class="modal_top" style="background-color:' + options.titleColor + ';">' +
                            '<td class="modal_T_L" ></td>' +
                            '<td class="modal_T_C">' +
                                '<table class="modal_bar" cellpadding="0" cellspacing="0" >' +
                                    '<tr class="modal_bar" ' +
                                        'align="justify" ' +
                                        'style="color:' + options.titleTextColor + ';">' +
                                        '<td id="modal_grip' + id + '" ' +
                                          'nowrap="nowrap" ' +
                                          'align="center" >' +
                                        '<label id="modalTitle' + id + '">' + options.title + '</label>' +
                                        '</td>' +
                                        titleClose +
                                    '</tr>' +
                                '</table>' +
                            '</td>' +
                            '<td class="modal_T_R" ></td>' +
                        '</tr>' +
                        '<tr class="modal_center">' +
                            '<td class="modal_C_L" ></td>' +
                            '<td  class="modal_C_C">' +
                                icon +
                                '<p id="modalText' + id + '" class="modal_text" align="center" >' + options.text + '</p>' +
                                options.body +
                                '<p class="modal_block" id="modalDiagButtons' + id + '">' +
                                    okayBtn + cancelBtn +
                                '</p>' +
                            '</td>' +
                            '<td class="modal_C_R"></td>' +
                        '</tr>' +
                        '<tr class="modal_bottom">' +
                            '<td class="modal_B_L""></td>' +
                            '<td class="modal_B_C"></td>' +
                            '<td class="modal_B_R"></td>' +
                        '</tr>' +
                    '</table>'
                )[0];

            document.body.insertBefore(div, document.body.firstChild);

            /*modal buttons click events*/
            if (options.okayBtn)   $('#modalOkay' + id).addEvent('click=', options.fnYes);
            if (options.cancelBtn) $('#modalCancel' + id).addEvent('click=', options.fnNo);
            if (options.closeBtn)  $('#modalXCloseBtn' + id).addEvent('click=', options.fnNo);

            el = $('#' + dvid)[0];

            /*focus*/
            if (focusEl = $('#' + options.focus).get(0)) {
                focusEl.focus();
            }

            if (options.maximize != null ){
                modal.maximize(id, options.maximize);
            } else if (options.drag) {
                modal._enableDrag(el, $('#modal_grip' + id)[0]);
            }

            /*center*/
            $(el).center();

            if (!options.silent) {
                $([el, overlay]).css({
                    'visibility':'visible',
                    'display':'block'
                });
                $('#modalOverlay' + id).fade({
                    'start'    : 0,
                    'end'      : 65,
                    'fn' : function () {$(el).fade({
                        'start' : 0,
                        'end'   : 100
                    });}
                });
            } else {
                $([el, overlay]).css({
                    'visibility':'visible',
                    'display':'none'
                });
            }
        },

        loadDialog : function() {
            var arg, module;
            for (arg = 0; module = arguments[arg]; arg++) {
                $.require(modal.scriptPath + "modal-" + module + '.js');
            }
        },

        hide : function (id, fn) {
            if (fn == null) fn = function(){};
            $('#modal' + id).fade({
                'end'   : 0,
                'start' : 100,
                'fn'    : function () {
                    $("#modalOverlay" + id).fade({
                    'start' : 65,
                    'end'   : 0,
                    'fn'    : function() {
                        $('#modalOverlay' + id + ',#modal' + id).css({'zIndex' : -1, 'display' : 'none'});
                        fn();
                    }
                });
            }});
        },

        show : function (id, text, fn) {
            if (fn == null) fn = function(){};
            var overlay = $('#modalOverlay' + id),
                dialog  = $('#modal' + id),
                shown   = (dialog.css('display') === 'block');

            if (!shown) {
                overlay.css({
                    'display' : 'block',
                    'zIndex'  : $(document).topZIndex() + 500
                });

                dialog.css({
                    'display':'block',
                    'zIndex' : $(document).topZIndex() + 500
                });
            }
            if (text != null) {
                modal.changeText(text, id);
            }
            dialog.center();
            if (!shown) {
                overlay.fade({
                    'start': 0,
                    'end'  : 65,
                    'fn'   : function () {dialog.fade({
                        'start' : 0,
                        'end'   : 100,
                        'fn'    : fn
                    });}
                });
            } else {
                if (fn) fn();
            }
        },

        maximize : function (id, fn) {
            var winSize = $(window).size();
            $('#modal' + id).css({
                'top'        : '0px',
                'left'       : '0px',
                'height'     : (winSize.y) + 'px',
                'width'      : (winSize.x) + 'px'
            }).attr('className', 'modal_diag modal_maximize');
            $('#modalBody' + id).css({'height': '100%', 'width' : '100%'});
            fn();
        },

        appendText : function (text, id) {
            var current = $('#modalText' + id).attr('innerHTML');
            $('#modalText' + id).attr('innerHTML', current + text);
        },

        changeText : function (text, id) {
            $('#modalText' + id).attr('innerHTML', text);
        },

        destroy : function (id) {
            $("#modal" + id).fade({
                'end'   : 0,
                'start' : 100,
                'fn'    : function () {
                    document.body.removeChild($('#modal' + id)[0]);
                    modal._destroyOverlay("modalOverlay", id);
                }
            });
        },

        _enableDrag : function (el, handle) {
            var dragStart = function () {
                $(el).fade({
                    'start' : 100,
                    'end'   : 75
                });
            },
            dragEnd = function () {
                $(el).fade({
                    'end'   : 100,
                    'start' : 75
                });
            };
            $(el).addDrag({
                'grip'        : handle,
                'onDragStart' : dragStart,
                'onDragEnd'   : dragEnd
            });
        },

        _createOverlay : function (name, id) {
            var overlay = $("<div/>").attr({
                "id"        : name + id,
                "className" : "modal_overlay"
            }).css(
                'zIndex', $(document).topZIndex() + 500
            )[0];
            document.body.insertBefore(overlay, document.body.firstChild);
            return overlay;
        },

        _destroyOverlay : function (name, id) {
            $('#' + name + id).fade({
                'end'   : 0,
                'start' : 65,
                'fn'    : function () {document.body.removeChild($('#' + name + id)[0]);}
            });
        }
    };

    $.extend(modal, internal);
    window.modal = modal;

    // Detect modal paths
    $.getLoadingScriptPath(
        function (script) {
            var scriptPath = script.dirname();
            if (scriptPath !== '') scriptPath += "/";
            modal.init(scriptPath);
        }
    );
})(easyJS);
