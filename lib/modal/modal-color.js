/*
    modal-color.js
    Color picker dialog for modal.js
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
    modal.loadDialog("standard");
    $.require(modal.scriptPath + "slideme/slideme.js");
    /*INCLUDE_CSS("modal","modal-color.css")*/
    function colorPicker(text, options, fn) {
        options          = $.merge(options, {
            'titleText'      : 'Color Selector',
            'titleColor'     : 'black',
            'titleTextColor' : 'white',
            'icon'           : 'color.png',
            'drag'           : true,
            'defaultColor'   : 'rgb(0,0,0)',
            'defaultAlpha'   : '100',
            'closeBtn'       : true,
            'alpha'          : false
        });
        var defColor     = colorPicker.parseChannels(options.defaultColor),
            id           = modal.uniqueId(),
            focus        = 'modalColorR' + id,
            nextBlue     = (options.alpha) ? 'modalAlpha' : 'modalOkay',
            sliders      = [],
            body, callback;
        sliders[0]   = colorPicker.createSlider(
            id,
            'slideRed',
            'knobRed',
            'modalColorR',
            'modalColorG',
            defColor.red,
            'R'
        );
        sliders[1] = colorPicker.createSlider(
            id,
            'slideGreen',
            'knobGreen',
            'modalColorG',
            'modalColorB',
            defColor.green,
            'G'
        );
        sliders[2] = colorPicker.createSlider(
            id,
            'slideBlue',
            'knobBlue',
            'modalColorB',
            nextBlue,
            defColor.blue,
            'B'
        );
        sliders[3] = (!options.alpha) ? '' :
            colorPicker.createSlider(
                id,
                'slideAlpha',
                'knobalpha',
                'modalAlpha',
                'modalOkay',
                options.defaultAlpha,
                'A'
            );

        body =
            '<p class="modal_block">' +
                '<table class="modal_color">' +
                    sliders[0] + sliders[1]+ sliders[2] + sliders[3] +
                    '<tr class="modal_color_preview">' +
                        '<td colspan="2"  ' +
                             'id="modalColorPreviewWrap' + id + '" ' +
                             'class="modal_color_preview">' +
                            '<div id="modalColorPreview' + id + '"></div>' +
                        '</td>' +
                    '</tr>' +
                '</table>' +
            '</p>';

        callback = (typeof(fn) != 'undefined') ?
            function (e) {colorPicker.setReturn(id);modal.destroy(id);fn();} :
            function (e) {colorPicker.setReturn(id);modal.destroy(id);};

        modal(
            id,
            {
                'title'          : options.titleText,
                'text'           : text,
                'body'           : body,
                'fnYes'          : callback,
                'titleColor'     : options.titleColor,
                'titleTextColor' : options.titleTextColor,
                'icon'           : options.icon,
                'drag'           : options.drag,
                'focus'          : focus,
                'cancelBtn'      : true,
                'okayText'       : 'Submit',
                'closeBtn'       : options.closeBtn
            }
        );

        colorPicker.addSlider('slideRed' + id,   0, 255, defColor.red,   'modalColorR' + id, id, 'color');
        colorPicker.addSlider('slideGreen' + id, 0, 255, defColor.green, 'modalColorG' + id, id, 'color');
        colorPicker.addSlider('slideBlue' + id,  0, 255, defColor.blue,  'modalColorB' + id, id, 'color');
        if (options.alpha) {
            colorPicker.addSlider('slideAlpha' + id, 0, 100, options.defaultAlpha, 'modalAlpha' + id, id, 'alpha');
        }

        colorPicker.preview(id);
        return id;
    }

    /*helper objects for specific dialogs*/
    var modalColor = {
        createSlider : function (id, slideName, knobName, inputName, nextName, defVal, label) {
            var html =
                '<tr><td>' +
                    '<div id="' + slideName + id + '" class="slider modal_color_slider" >' +
                        '<div  class="slider_left" ></div>' +
                        '<div class="slider_right"></div>' +
                        '<div id="' + knobName + id + '" class="' + knobName + ' slider_knob" ></div>' +
                    '</div>' +
                '</td>' +
                '<td nowrap="nowrap">' + label + ': ' +
                    '<input type="text" ' +
                            'id="' + inputName + id + '" ' +
                            'maxlength="3" ' +
                            'onkeypress="return colorPicker.validateKey(event,\'' + nextName + id + '\');" ' +
                            'onblur="colorPicker.validateVal(this,' + id + ');"' +
                            'class="modal_color_prompt" value="' + defVal + '">' +
                '</td></tr>';
            return html;
        },

        addSlider : function (sliderId, min, max, defval, inputId, id, type) {
            var input = $('#' + inputId)[0];
            $('#' + sliderId).addSlider({
                'minRange' : min,
                'maxRange' : max,
                'defaults' : defval,
                'input'    : input,
                'onSlide'  : function (val) {
                    input.value = Math.round(val);
                    colorPicker.validateVal(input, id, type);
                },
                'onSlideUpdate' : function () {
                    colorPicker.validateVal(input, id, type);
                }
            });
        },

        parseChannels : function (color) {
            var channels = (/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/).exec(color);
            return {
                'red'   : parseInt(channels[1], 10),
                'green' : parseInt(channels[2], 10),
                'blue'  : parseInt(channels[3], 10)
            };
        },

        validateKey : function (e, next) {
            var key = window.event ? e.keyCode : e.which,
            keychar = String.fromCharCode(key);
            if ((/([\d])/).test(keychar)) {
                return true;
            } else if (key == 13) {
                $('#' + next)[0].focus();
                return false;
            } else if ((key == 8) || (key == 9) || (key == 9 && key == 15) || (key == 15) || (!key)) {
                return true;
            }
            return false;
        },

        validateVal : function (el, id, type) {
            var min = 0,
            max     = 0,
            value   = parseInt(el.value, 10);
            switch (type) {
                case 'alpha': max = 100;break;
                case 'color': max = 255;break;
                default:
                    return;
            }
            if (isNaN(value)) el.value = 0;
            if (value < min) {
                el.value = '' + min;
            } else if (value > max) {
                el.value = '' + max;
            }
            colorPicker.preview(id);
        },

        preview : function (id) {
            var r    = $('#modalColorR' + id).attr('value'),
            g        = $('#modalColorG' + id).attr('value'),
            b        = $('#modalColorB' + id).attr('value'),
            alpha    = $('#modalAlpha' + id )[0], a,
            settings = {'background' : 'rgb(' + r + ',' + g + ',' + b + ')'};
            if (alpha != null) {
                a = alpha.value;
                settings.opacity = parseInt(a, 10) / 100;
                settings.filter  = 'alpha(opacity=' + a + ')';
            }
            $('#modalColorPreview' + id).css(settings);
        },

        setReturn : function (id) {
            var alpha = $('#modalAlpha' + id )[0],
            r         = $('#modalColorR' + id).attr('value'),
            g         = $('#modalColorG' + id).attr('value'),
            b         = $('#modalColorB' + id).attr('value'),
            a         = (alpha == null) ? 100 : alpha.value;
            modal.returns = {'color' : 'rgb(' + r + ',' + g + ',' + b + ')','alpha' : a};
        }
    };

    $.extend(colorPicker, modalColor);
    window.colorPicker = colorPicker;
})(easyJS);
