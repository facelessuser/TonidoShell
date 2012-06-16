/*
    slideme.js
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

    /*INCLUDE_CSS("slideme", "slideme.css")*/

    var slideMe = {
        init : function(el, options) {
            var startVal,
                knobOffset = 4,
                knob       = $(el).query('.slider_knob')[0];

            options = $.merge(options, {
                'minRange'      : 0,
                'maxRange'      : 0,
                'defaults'      : null,
                'input'         : null,
                'onSlide'       : function(){},
                'onSlideUpdate' : function(){}
            });

            /*define event functions*/
            knob.onslide       = options.onSlide;
            knob.onslideupdate = options.onSlideUpdate;

            /*define value and drag ranges*/
            knob.minRange = parseFloat(options.minRange);
            knob.maxRange = parseFloat(options.maxRange);
            knob.minX     = -knobOffset;
            knob.maxX     = parseFloat(el.offsetWidth) + knobOffset;

            /*Target an input box if provided*/
            if (options.input != null) {
                options.input.onchange = function (e) {slideMe.val2pos.horiz(knob, options.input.value);};
            }

            /*initialize starting value*/
            startVal = (options.defaults != null) ? parseFloat(options.defaults) : knob.minRange;
            knob.lastVal = startVal;
            $(knob).addDrag({
                'onDrag' : function (x, y) {slideMe.pos2val.horiz(knob, x);},
                'minX'   : knob.minX,
                'maxX'   : knob.maxX,
                'minY'   : 0,
                'maxY'   : 0
            });
            slideMe.val2pos.horiz(knob, startVal);
        },

        setSliderAction : function (el, options) {
            if (!$.isUndef(options.onSlide))       el.onslide       = options.onSlide;
            if (!$.isUndef(options.onSlideUpdate)) el.onslideupdate = options.onSlideUpdate;
        },

        val2pos : {
            horiz : function (el, val) {
                var offset    = 4;
                el.lastVal    = val;
                el.style.left = (((val / (el.maxRange - el.minRange)) * (el.maxX - el.minX)) - offset) + 'px';
                el.onslideupdate();
            }
        },

        pos2val : {
            horiz : function(el, pos) {
                var offset = 4,
                    val    = ((pos + offset) / (el.maxX - el.minX)) * (el.maxRange - el.minRange);
                /*IE seems to throw NaNs on rare occasion that is difficult to pin down.
                  I have minimized the occurance by disabling text selection on drag.
                  As a work around, check in case for NaNs before return.  That is why I
                  keep last value; I need to return someting*/
                el.lastVal = (isNaN(val)) ? el.lastVal : val;
                el.onslide(el.lastVal);
            }
        }
    };

    $.addPrototype($.extenders.elExtender, 'addSlider', function (options) {
        slideMe.init(this.first(), options);
        return this;
    });
    $.addPrototype($.extenders.elExtender, 'setSliderAction', function (options) {
        slideMe.setSliderAction(this.first(), options);
        return this;
    });
})(easyJS);
