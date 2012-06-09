/*
    easyJS.js
    easyJS framework
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

(function (document, window) {
    "use strict";
    var ezJS = function (obj, filters) {
        return new ezJS.init(obj, filters);
    },

    internal = {
        init : function (obj, filters) {
            var _ezJS    = this;
            this.selDoc  = document;
            this.selWin  = window;

            this.getDom = function (selector, filters) {
                /*get the actual dom elements by selector if elements were not provided*/
                var el, options;
                if      (ezJS.isMarkup(selector))  el = _ezJS.stringToHtml(selector);
                else if (ezJS.isString(selector))  el = _ezJS.query(_ezJS.selDoc, selector);
                else if (ezJS.isArray(selector))   el = _ezJS.onlyElements(selector);
                else if (ezJS.isFunction(selector))el = ezJS.domReady.check(selector);
                else                               el = selector;

                if (ezJS.isArray(el) && filters) _ezJS.filter(el, filters);

                /*extend DOM(s) with easyjs methods*/
                return _ezJS.getExtender(el);
            };

            this.stringToHtml = function (str) {
                var m = (/^\s*<\/?\s*([a-zA-Z]+)\s*\/?>\s*$/).exec(str);
                if (m) return this.selDoc.createElement(m[1]);
                return str;
            };

            this.query = function (parent, selector) {
                /*get elements based on selectors; this method seems more flexible than
                  the old method. Internal filters will be applied post query*/
                var elements = parent.querySelectorAll(selector);
                return (elements.length === 0) ? null : ezJS.toArray(elements);
            };

            this.filter = function (el, filters) {
                /*All filters are applied to the array except for First and Last;
                  they are applied to the filtered array.  This needs some optimization.*/
                /*filters*/
                var arr = filters.split(':'),
                    /*general vars*/
                    m, i, j, maxEl, maxFilter, maxItem, elements, val, parseArr, match = false,
                    /*filter vars*/
                    alt = 0, eq = [], lt = el.length, gt = -1, not = [], nth = 1, first, last;

                for (i = 0, maxFilter = arr.length; i < maxFilter; i++) {
                    if (arr[i] === 'first')       first = true;
                    else if (arr[i] === 'last') last  = true;
                    else if (arr[i] === 'even') alt   = (alt === 0 || alt === 1) ?   1 : 0;
                    else if (arr[i] === 'odd')  alt   = (alt === 0 || alt === -1) ? -1 : 0;
                    else if ((m = (/\s*(nth|gt|lt)\(([\s0-9]+)\)\s*/).exec(arr[i]))) {
                        val = parseInt(m[2], 10);
                        switch (m[1]) {
                            case 'gt' :
                                gt = (val > gt) ? val : gt;
                                break;
                            case 'lt' :
                                lt = (val < lt) ? val : lt;
                                break;
                            case 'nth':
                                nth = val;
                                break;
                            default:
                                break;
                        }
                    } else if ((m = (/\s*(eq|not)\(([\s\,\-0-9]+)\)\s*/).exec(arr[i]))) {
                        switch (m[1]) {
                            case 'eq' :
                                parseArr = m[2].split(',');
                                eq = [];
                                for (j = 0, maxItem = parseArr.length; j < maxItem; j++) {
                                    val = parseInt(parseArr[j], 10);
                                    if (!isNaN(val)) eq.push(val);
                                }
                                break;
                            case 'not':
                                parseArr = m[2].split(',');
                                not = [];
                                for (j = 0, maxItem = parseArr.length; j < maxItem; j++) {
                                    val = parseInt(parseArr[j], 10);
                                    if (!isNaN(val)) not.push(val);
                                }
                                break;
                            default:
                                break;
                        }
                    }
                }

                for (i = 0, maxEl = el.length; i < maxEl; i++){
                    /*within range*/
                    if (i < lt && i > gt) {
                        /*is odd or even*/
                        if (alt === 0 || ((alt === 1 && (i%2) === 0)) || ((alt === -1 && (i%2)))) {
                            /*nth match*/
                            if (nth === 1 || (i%nth) === 0) {
                                /*equal to*/
                                if (eq.length === 0) match = true;
                                for (j = 0, maxFilter = eq.length ; !match && j < maxFilter; j++) {
                                    if (i === eq[j])                              match = true;
                                    else if (eq[j] < 0 && (maxEl + eq[j]) === i) match = true;
                                }
                                /*not equal to*/
                                if (match) {
                                    for (j = 0, maxFilter = not.length; match && j < maxFilter; j++) {
                                        if (i === not[j])                               match = false;
                                        else if (not[j] < 0 && (maxEl + not[j]) === i) match = false;
                                    }
                                }
                            }
                        }
                    }
                    if (match === true) {
                        match = false;
                        if (elements)  elements.push(el[i]);
                        else elements = el.slice(i, i + 1);
                        /*Kick out if first is wanted*/
                        if (first) break;
                    }
                }

                /*last if items were found*/
                if (elements && last) elements.remove(0, -2);

                return elements;
            };

            this.getExtender = function (element, options) {
                var obj;

                /*pick the appropriate extender for the element(s). Elements are always arrays*/
                if      (element == null)              obj = new ezJS.extenders.baseExtender(element, this);
                else if (ezJS.isWindow(element))       obj = new ezJS.extenders.winExtender([element], this);
                else if (ezJS.isString(element))       obj = new ezJS.extenders.stringExtender([element], this);
                else if (ezJS.isElement(element))      obj = new ezJS.extenders.elExtender([element], this);
                else if (ezJS.isArray(element))        obj = new ezJS.extenders.elExtender(element, this);
                else if (ezJS.isDocument(element))     obj = new ezJS.extenders.docExtender([element], this);
                else                                   obj = new ezJS.extenders.baseExtender(null, this);
                return obj;
            };

            this.getElements = function(elements, idx) {
                var num;
                /*return either the element list, element, or specified element*/
                if (elements && ezJS.isArray(elements) && idx != null) {
                    if (idx < 0 && (elements.length - idx) > 0) return elements[elements.length - idx];
                    if (idx < elements.length)                  return elements[idx];
                    return null;
                }
                return elements;
            };

            this.onlyElements = function (el) {
                /*scan array weeding out non elements*/
                var arr = [], i, item;
                for (i = 0, item; item = el[i]; i++) {
                    if (ezJS.isElement(item)) arr.push(item);
                }
                return ((arr.length === 0) ? null : arr);
            };

            this.checkClasses = function (element, c) {
                /* check for class(es)*/
                var i, isClass, symbol, thisClass;
                for (i = 0; symbol = c[i]; i++) {
                    isClass = new RegExp("(?:^|\\s)" + symbol.regEscape() + "(?:$|\\s)");
                    thisClass   = element.className;
                    if (thisClass == null || thisClass.indexOf(symbol) == -1 || !isClass.test(thisClass)) {
                        element = null;
                        break;
                    }
                }
                return element;
            };

            this.checkAttr = function (element, a) {
                /*check for attribute*/
                var el, i, item;
                for (i = 0;item = a[i]; i++) {
                    if (element[item.name] == null && element[item.name] !== item.value) {
                        element = null;
                        break;
                    }
                }
                return element;
            };

            this.getById = function (i) {
                return [_ezJS.selDoc.getElementById(i)];
            };

            this.getByClass = function (c) {
                var elements = [], i, all, element;
                if (_ezJS.selDoc.getElementsByClassName) elements = _ezJS.selDoc.getElementsByClassName(c.join(' '));
                else {
                    all  = _ezJS.selDoc.getElementsByTagName("*");
                    for (i = 0; element = all[i]; i++) {
                        element = _ezJS.checkClasses(element, c);
                        if (element) elements.push(element);
                    }
                }
                return elements;
            };

            this.getByAttr = function (a) {
                var i, element,
                    all      = _ezJS.selDoc.getElementsByTagName("*"),
                    elements = [];
                for (i = 0; element = all[i]; i++) {
                    element = _ezJS.checkAttr(element, a);
                    if (element) elements.push(element);
                }
                return elements;
            };

            this.getByTag = function (t) {
                return ezJS.toArray(_ezJS.selDoc.getElementsByTagName(t));
            };

            this.getContent = function (doc) {
                var docContent = null;
                if      (doc.contentDocument) docContent = doc.contentDocument;
                else if (doc.contentWindow)   docContent = doc.contentWindow.document;
                else                          docContent = _ezJS.selWin.frames[doc.id].document;

                return ((docContent) ? docContent.body.innerHTML : null);
            };

            this.each = function (el, multiFn, options) {
                var status = [], i, item;
                if (ezJS.isArray(el)) {
                    for (i = 0, item; item = el[i]; i++) {
                        if (!ezJS.isUndef(options)) status.push(multiFn(item, options));
                        else                        status.push(multiFn(item));
                    }
                } else {
                    if (!ezJS.isUndef(options)) status = multiFn(el, options);
                    else                        status = multiFn(el);
                }
                return status;
            };

            this.absPos = function (el, dim) {
                var pos = 0;
                while(el) {
                    pos += (dim === 'y') ? el.offsetTop : el.offsetLeft;
                    el = el.offsetParent;
                }
                return pos;
            };

            this.css = function (elements, item, value) {
                var css2js = /(\-[a-z])/;
                //convert css notation to javascript
                while (css2js.test(item)) {
                    item = item.replace(
                        css2js,
                        function ($0, $1){
                            return $0.replace($1, $1[1].toUpperCase());
                        }
                    );
                }
                if (ezJS.isUndef(value)) return elements.style[item];
                else                     elements.style[item] = value;
            };

            this.attr = function (elements, item, value) {
                if (ezJS.isUndef(value)) return elements[item];
                else                     elements[item] = value;
            };

            this.elAssocMap = function (element, fn, params) {
                return ezJS.assocMap(function (opt1, opt2){return fn(element, opt1, opt2);}, params);
            };

            this.elArrayMap = function (element, fn, params) {
                return ezJS.arrayMap(function (options){return fn(element, options);}, params);
            };

            this.position = {
                center : function (el, dim) {
                    var c = _ezJS.win.center(),
                        top    = (c.y - (el.offsetHeight / 2)),
                        left   = (c.x - (el.offsetWidth / 2));
                    if (dim == null || dim === 'y') el.style.top  = (top < 0)  ? 0 + 'px' : top  + 'px';
                    if (dim == null || dim === 'x') el.style.left = (left < 0) ? 0 + 'px' : left + 'px';
                },

                set : function (el, x, y) {
                    var left, top;

                    if (typeof x === "undefined") x = null;
                    if (typeof y === "undefined") y = null;

                    if (y === 'center') {
                        _ezJS.position.center(el, 'y');
                    } else if (y === 'top') {
                        el.style.top = 0 + 'px';
                    } else if (y === 'bottom') {
                        top = (_ezJS.win.size('y') - (el.offsetHeight));
                        el.style.top = (top < 0) ? 0 + 'px' : top + 'px';
                    } else if (y.match(/^[\\d]+(%%|px|em|mm|cm|in|pt|pc)$/) != null) {
                        el.style.top = y;
                    }

                    if (x === "center") {
                        _ezJS.position.center(el, 'x');
                    } else if (x === 'left') {
                        el.style.left = 0 + 'px';
                    } else if (x === 'right') {
                        left = (_ezJS.win.size('x') - (el.offsetWidth));
                        el.style.left = (left < 0) ? 0 + 'px' : left + 'px';
                    } else if (x.match(/^[\\d]+(%%|px|em|mm|cm|in|pt|pc)$/) != null) {
                        el.style.left = x;
                    }
                }
            };

            this.win = {
                center : function (dim) {
                    var center = {
                        'x' : _ezJS.win.size('x') / 2,
                        'y' : _ezJS.win.size('y') / 2
                    };
                    return ((dim) ? center[dim] : center);
                },

                size : function (dim) {
                    var size = {
                        'x' : _ezJS.win.dimSize('x'),
                        'y' : _ezJS.win.dimSize('y')
                    };
                    return ((size[dim]) ? size[dim] : size);
                },

                dimSize : function(dir) {
                  dir = (dir === 'x') ? 'Width' : 'Height';
                  return ((_ezJS.selWin['inner' + dir]) ?
                      _ezJS.selWin['inner' + dir] :
                      ((_ezJS.selWin.document.documentElement && _ezJS.selWin.document.documentElement['client' + dir]) ?
                        _ezJS.selWin.document.documentElement['client' + dir] :
                        _ezJS.selWin.document.body['client' + dir]
                      )
                  );
                },

                scrollOffset : function (dim) {
                    var offsets = {
                        'x' : _ezJS.win.dimScrollOffset.offset('x'),
                        'y' : _ezJS.win.dimScrollOffset.offset('y')
                    };
                    return ((dim) ? offsets[dim] : offsets);
                },

                dimScrollOffset : function (dim) {
                    var dir = (dim === 'x') ? 'Left' : 'Top';
                    dim = dim.toUpperCase();
                    return ((_ezJS.selWin['page' + dim + 'Offset']) ?
                        _ezJS.selWin['page' + dim + 'Offset'] :
                        ((_ezJS.selWin.document.documentElement && _ezJS.selWin.document.documentElement['scroll' + dir]) ?
                          _ezJS.selWin.document.documentElement['scroll' + dir] :
                          _ezJS.selWin.document.body['scroll' + dir]
                        )
                    );
                }
            };

            this.cursor = {
                /*http://demo.vishalon.net/getset.htm*/
                get : function (el) {
                    var pos = 0, selection;
                    if (_ezJS.selDoc.selection) { /*IE*/
                        el.focus ();
                        selection = _ezJS.selDoc.selection.createRange ();
                        selection.moveStart ('character', -el.value.length);
                        pos = selection.text.length;
                    } else if (el.selectionStart || el.selectionStart == '0') { /*firefox*/
                        pos = el.selectionStart;
                    }
                    return pos;
                },

                set : function (el, pos) {
                    if (el.setSelectionRange) {
                        el.focus();
                        el.setSelectionRange(pos, pos);
                    } else if (el.createTextRange) {
                        var range = el.createTextRange();
                        range.collapse(true);
                        range.moveEnd('character', pos);
                        range.moveStart('character', pos);
                        range.select();
                    }
                },

                /*http://alexking.org/blog/2003/06/02/inserting-at-the-cursor-using-javascript*/
                insert : function (el, text, relPos) {
                    var selection, startPos, endPos;
                    relPos = (relPos) ? _ezJS.cursor.get(el) + text.length + relPos : _ezJS.cursor.get(el) + text.length;
                    if (_ezJS.selDoc.selection) { /*IE*/
                        el.focus();
                        selection      = _ezJS.selDoc.selection.createRange();
                        selection.text = text;
                    } else if (el.selectionStart || el.selectionStart == '0') { /*firefox*/
                        startPos = el.selectionStart;
                        endPos   = el.selectionEnd;
                        el.value = el.value.substring(0, startPos) +
                                   text +
                                   el.value.substring(endPos, el.value.length);
                    } else { /*others*/
                        el.value += text;
                    }
                    _ezJS.cursor.set(el, relPos);
                }
            };

            this.topZIndex = function () {
                var highestIndex = 0,
                    currentIndex = 0,
                    all          = _ezJS.selDoc.getElementsByTagName('*'),
                    i, el;

                for (i = 0, el; el = all[i]; i++) {
                    if (el.style) currentIndex = parseInt(el.style.zIndex, 10);
                    else if (_ezJS.selWin.getComputedStyle) {
                        currentIndex = parseInt(_ezJS.selDoc.defaultView.getComputedStyle(el, null).getPropertyValue('z-index'), 10);
                    }
                    if (!isNaN(currentIndex) && (currentIndex > highestIndex)) highestIndex = currentIndex;
                }
                return (highestIndex + 1);
            };

            this.mouse = {
                get : function (e, dim) {
                    var pos = {
                        'x' : _ezJS.mouse.pos(e, 'x'),
                        'y' : _ezJS.mouse.pos(e, 'y')
                    };
                    return ((dim) ? pos[dim] : pos);
                },

                pos : function (e, dim) {
                    var dir = (dim === 'x') ? 'Left' : 'Top';

                    dim = dim.toUpperCase();
                    e   = ezJS.isIEEvent(e);
                    return ((e['page' + dim]) ?
                        e['page' + dim] :
                        (e['client' + dim] + ((_ezJS.selDoc.documentElement['scroll' + dir]) ?
                            _ezJS.selDoc.documentElement['scroll' + dir] :
                            _ezJS.selDoc.body['scroll' + dir]
                        ))
                    );
                }
            };

            this.addEvent = function (el, name, fn) {
                if (el == null) return;
                var inline = ezJS.isInlineEvent(name);
                if (inline){
                    el['on' + inline] = fn;
                    return;
                }
                if (el.addEventListener) el.addEventListener(name, fn, false);
                else if (el.attachEvent) el.attachEvent('on' + name, fn);
            };

            this.removeEvent = function (el, name, fn) {
                if (el == null ) return;
                var inline = ezJS.isInlineEvent(name);
                if (inline){
                    el['on' + name] = null;
                    return;
                }
                if (el.removeEventListener) el.removeEventListener(name, fn, false);
                else if (el.detachEvent)    el.detachEvent('on' + name, fn);
            };

            this.parseVal = function (value) {
                if (ezJS.isInt(value))   return {'value': parseInt(value, 10), 'unit': 'int',   'type' : null};
                if (ezJS.isFloat(value)) return {'value': parseFloat(value), 'unit': 'float', 'type' : null};
                var val, type, unit, ext, re, m,
                    word  = value.toString().trim(),
                    num   = '((?:-|)[0-9\\.]+)',
                    types = {
                        'percent d': '(\\%d)',
                        'percent'  : '(\\%)',
                        'px'       : '(px)',
                        'em'       : '(em)',
                        'mm'       : '(mm)',
                        'cm'       : '(cm)',
                        'in'       : '(in)',
                        'pt'       : '(pt)',
                        'pc'       : '(pc)'
                    };

                for (ext in types) {
                    re = new RegExp('^' + num + types[ext] + '$');
                    m  = re.exec(word);
                    if (m) {
                        val = m[1]; type = m[2];
                        break;
                    }
                }
                if (val == null) val = word;
                if (ezJS.isInt(val)) {
                    val = parseInt(val, 10);
                    unit = 'int';
                } else if (ezJS.isFloat(val)) {
                    val = parseFloat(val);
                    unit = 'float';
                }

                return {'value': val, 'unit': unit, 'type' : type};
            };

            this.effects = {
                fade : function (el, options) {
                    var default_args = {
                        'end'      : 100,
                        'start'    : 100,
                        'fn' : function (){}
                    };

                    if (el == null) return;
                    options = ezJS.merge(options, default_args);

                    if (options.start != null && options.end != null) {
                        _ezJS.effects.animate(el, {
                            'css'   : true,
                            'target': 'opacity',
                            'start' : options.start,
                            'end'   : options.end
                        }, 500, options.fn);
                    }
                },

                animate : function (el, options, time, fn) {
                    var start, end, target;

                    options = ezJS.merge(options, {
                        'target': null,
                        'start' : null,
                        'end'   : null,
                        'css'   : false
                    });
                    if (
                        options.target == null ||
                        options.start  == null ||
                        options.end    == null ||
                        time == null
                    ) return;

                    fn = (fn) ? fn : function (){};

                    start     = _ezJS.parseVal(options.start);
                    end       = _ezJS.parseVal(options.end);
                    target    = options.target;

                    /*stop animation*/
                    if (el.ani && el.ani[target]) clearInterval(el.ani[target].id);

                    /*update Structure*/
                    if (el.ani == null) el.ani = {};
                    el.ani[target] = {
                        'start'    : start.value,
                        'end'      : end.value,
                        'dir'      : (start.value < end.value) ? 1 : -1,
                        'tTotal'   : parseFloat(time),
                        'tLeft'    : parseFloat(time),
                        'tLast'    : null,
                        'cssTarget': options.css,
                        'type'     : (options.target === 'opacity') ? '%d' : start.type,
                        'fn'       : fn
                    };

                    el.ani[target].id = setInterval(function(){_ezJS.effects.applyAnimation(el, target);}, 10);
                },

                applyAnimation : function (el, target) {
                    var delta     = (el.ani[target].tLast == null) ? 0 : (new Date().getTime() - el.ani[target].tLast),
                        endAni    = false,
                        finalVal  = 0.0,
                        totalTime = el.ani[target].tTotal,
                        range     = Math.abs(el.ani[target].start - el.ani[target].end),
                        val, fn;

                    el.ani[target].tLast   = new Date().getTime();
                    el.ani[target].tLeft  -= delta;
                    if (el.ani[target].tLeft < 0) el.ani[target].tLeft = 0;

                    /*Calculate value based on time left*/
                    val = (el.ani[target].tLeft / totalTime) * range;
                    /*Make value relative to direction endpoint*/
                    if (el.ani[target].dir == 1) val = range - val + el.ani[target].start;
                    else val += el.ani[target].end;

                    /*see if we need to end animation and
                      calculate the final value accordingly*/
                    if ((el.ani[target].dir == 1  && val > el.ani[target].end) ||
                       (el.ani[target].dir == -1 && val < el.ani[target].end) ||
                       (el.ani[target].tLeft === 0)) {
                            val = el.ani[target].end;
                            endAni = true;
                       }

                    /*set value and repeat if needed*/
                    if (target === 'opacity') {
                        /*workaround for IE filters affecting textareas*/
                        if (parseInt(val, 10) == 100) el.style.filter = null;
                        else                      el.style.filter = "alpha(opacity=" + parseInt(val, 10) + ");";
                    }
                    /*workaround. I know of other ways to selectively
                      change filters this is the only IE filter I want to support
                      Nukes the filter value leaving only opacity*/
                    if (el.ani[target].type) {
                        val = (el.ani[target].type === '%d') ? val = val / 100.0 : val = val + el.ani[target].type;
                    }

                    if (el.ani[target].cssTarget === true) el.style[target] = val;
                    else                                   el[target]       = val;

                    /*bail*/
                    if (endAni) {
                        clearInterval(el.ani[target].id);
                        fn = el.ani[target].fn;
                        delete el.ani[target];
                        fn();
                        return;
                    }
                }
            };

            this.shortcuts = {
                add : function (el, settings) {
                    settings = ezJS.merge(settings, {
                        "name"   : "default",
                        "on"     : "keydown",
                        "repeat" : true,
                        "key"    : "a",
                        "halt"   : false,
                        "fn"     : function(){},
                        "ctrl"   : false,
                        "shift"  : false,
                        "alt"    : false,
                        "meta"   : false
                    });
                    var key = ezJS.shortcuts.keys[settings.key],

                    /*Determine which keys on keydown, but only execute event if specified*/
                    keyDownEvent = function (e) {
                        var ev  = (!e) ? window.event : e,
                        keyCode = (window.event) ? window.event.keyCode : e.which,
                        firing;
                        if (_ezJS.shortcuts.evalModifier(ev.ctrlKey)  == settings.ctrl &&
                            _ezJS.shortcuts.evalModifier(ev.altKey)   == settings.alt  &&
                            _ezJS.shortcuts.evalModifier(ev.shiftKey) == settings.shift&&
                            _ezJS.shortcuts.evalModifier(ev.metaKey)  == settings.meta &&
                            keyCode == key)
                        {
                            firing = ezJS.isUndef(ezJS.shortcuts.payload[settings.name]);
                            if (firing || (!firing && settings.repeat === true)) {
                                ezJS.shortcuts.payload[settings.name] = settings.fn;
                                /*keep from repeating*/
                                ezJS.shortcuts.kill[settings.name] = (!settings.repeat);
                                if (settings.on === 'keydown') settings.fn(e);
                            }
                            if (settings.on === 'keydown' && settings.halt) {
                                _ezJS.shortcuts.stopPropagation(ev);
                                return false;
                            }
                        }
                    },

                    /*key up event. Execute payload if targeted, but always reset shortcut*/
                    keyUpEvent = function (e) {
                        if (ezJS.isUndef(ezJS.shortcuts.payload[settings.name])) return;
                        var ev   = (!e) ? window.event : e,
                        halt     = settings.halt;
                        if (settings.on === 'keyup') ezJS.shortcuts.payload[settings.name](e);
                        _ezJS.shortcuts.reset(settings.name);
                        if (halt) {
                            _ezJS.shortcuts.stopPropagation(ev);
                            return false;
                        }
                    },

                    /*Specific key press event.
                     Do nothing if we are targeting key up.*/
                    keyPressEvent = null;
                    /*only try and halt if keydown and no repeat*/
                    if (settings.on === 'keydown' && !settings.repeat) keyPressEvent = function (e) {
                        if (ezJS.isUndef(ezJS.shortcuts.payload[settings.name])) return;
                        var ev = (!e) ? window.event : e;
                        if (settings.halt) {
                            _ezJS.shortcuts.stopPropagation(ev);
                            return false;
                        }
                    };
                    /*if keydown and repeat or keypress, execute once and terminate if repeat is false*/
                    else if (settings.on !== 'keyup') keyPressEvent = function (e) {
                        if (ezJS.isUndef(ezJS.shortcuts.payload[settings.name])) return;
                        var ev = (!e) ? window.event : e;
                        if (!ezJS.shortcuts.kill[settings.name]) {
                            if (ezJS.shortcuts.repeat[settings.name]) {
                                /*debounce event*/
                                if (((new Date().getTime()) - ezJS.shortcuts.repeat[settings.name]) >= 100) {
                                    /*keep from repeating*/
                                    if (!settings.repeat) ezJS.shortcuts.kill[settings.name] = true;
                                    ezJS.shortcuts.repeat[settings.name] = new Date().getTime();
                                    ezJS.shortcuts.payload[settings.name](e);
                                }
                            }
                            else ezJS.shortcuts.repeat[settings.name] = new Date().getTime();
                        }
                        if (settings.halt) {
                            _ezJS.shortcuts.stopPropagation(ev);
                            return false;
                        }
                    };

                    ezJS.shortcuts.events[settings.name] = {
                        "keyDown"  : keyDownEvent,
                        "keyUp"    : keyUpEvent,
                        "keyPress" : keyPressEvent,
                        "key"      : settings.key,
                        "ctrl"     : settings.ctrl,
                        "shift"    : settings.shift,
                        "alt"      : settings.alt,
                        "meta"     : settings.meta
                    };
                    if (keyPressEvent) {
                        _ezJS.each(
                            el,
                            function (dom, options){
                                _ezJS.elAssocMap(dom, _ezJS.addEvent, options);
                            },
                            {
                                'keydown' : keyDownEvent,
                                'keyup'   : keyUpEvent,
                                'keypress': keyPressEvent
                            }
                        );
                    } else {
                        _ezJS.each(
                            el,
                            function (dom, options){
                                _ezJS.elAssocMap(dom, _ezJS.addEvent, options);
                            },
                            {
                                'keydown' : keyDownEvent,
                                'keyup'   : keyUpEvent
                            }
                        );
                    }
                },

                reset : function (name) {
                    delete ezJS.shortcuts.payload[name];
                    delete ezJS.shortcuts.repeat[name];
                    delete ezJS.shortcuts.kill[name];
                },

                remove : function (el, name) {
                    var keyEvent = ezJS.shortcuts.events[name];
                    delete ezJS.shortcuts.events[name];
                    if (!keyEvent) return false;

                    if (keyEvent.keyPress) {
                        _ezJS.each(
                            el,
                            function (dom, options){
                                _ezJS.elAssocMap(dom, _ezJS.removeEvent, options);
                            },
                            {
                                'keydown' : keyEvent.keyDown,
                                'keyup'   : keyEvent.keyUp,
                                'keypress': keyEvent.keyPress
                            }
                        );
                    } else {
                        _ezJS.each(
                            el,
                            function (dom, options){
                                _ezJS.elAssocMap(dom, _ezJS.removeEvent, options);
                            },
                            {
                                'keydown' : keyEvent.keyDown,
                                'keyup'   : keyEvent.keyUp
                            }
                        );
                    }
                },

                get : function (name) {
                    return ezJS.shortcuts.events[name];
                },

                evalModifier : function (modifier) {
                    return (modifier == null) ? false : modifier;
                },

                stopPropagation : function (e) {
                    e.cancelBubble = true; /*IE*/
                    e.returnValue  = false; /*others*/

                    /*firefox*/
                    if (e.stopPropagation) {
                        e.stopPropagation();
                        e.preventDefault();
                    }
                }
            };

            this.drag = {
                init : function (el, options) {
                    options = ezJS.merge(options, {
                        'grip'       : null,
                        'minX'       : null,
                        'minY'       : null,
                        'maxX'       : null,
                        'maxY'       : null,
                        'onDrag'     : function(){},
                        'onDragStart': function(){},
                        'onDragEnd'  : function(){}
                    });

                    var maxX    = options.maxX,
                        minX    = options.minX,
                        maxY    = options.maxY,
                        minY    = options.minY,
                        top     = !isNaN(parseFloat(el.style.top)),
                        bottom  = !isNaN(parseFloat(el.style.bottom)),
                        left    = !isNaN(parseFloat(el.style.left)),
                        right   = !isNaN(parseFloat(el.style.right)),
                        offsetX = el.offsetWidth  <= (maxX - minX) ? el.offsetWidth  : 0,
                        offsetY = el.offsetHeight <= (maxY - minY) ? el.offsetHeight : 0,

                    /*Set handle for dragging*/
                    grip             = options.grip != null ? options.grip : el;
                    grip.onmousedown = function (e) {_ezJS.drag.start(e, el);return false;};

                    /*Set drag limits and account for object width as long as specified size can completely contain object*/
                    if (!top && !bottom) el.style.top  = '0px';
                    if (!left && !right) el.style.left = '0px';

                    el.dirX = !left && right ? 1 : 0;
                    el.minX = minX != null ? (el.dirX ? (minX - offsetX) : minX) : null;
                    el.maxX = maxX != null ? (el.dirX ? maxX : (maxX - offsetX)) : null;

                    el.dirY = !top && bottom ? 1 : 0;
                    el.minY = minY != null ? (el.dirY ? (minY - offsetY) : minY) : null;
                    el.maxY = maxY != null ? (el.dirY ? maxY : (maxY - offsetY)) : null;

                    el.ondrag      = options.onDrag;
                    el.ondragstart = options.onDragStart;
                    el.ondragend   = options.onDragEnd;
                },

                setDragActions : function (el, options) {
                    if (!ezJS.isUndef(options.onDrag))      el.ondrag      = options.onDrag;
                    if (!ezJS.isUndef(options.onDragStart)) el.ondragstart = options.onDragStart;
                    if (!ezJS.isUndef(options.onDragEnd))   el.ondragend   = options.onDragEnd;
                },

                start : function (e, el) {
                    /*set  mouse position and drag events*/
                    var doc = document,
                        cords = _ezJS.mouse.get(e);

                    el.lastMouseX   = parseFloat(cords.x);
                    el.lastMouseY   = parseFloat(cords.y);
                    doc.onmousemove = function (e) {_ezJS.drag.move(e, el);return false;};
                    doc.onmouseup   = function (e) {_ezJS.drag.end(el);};
                    el.ondragstart();
                },

                move : function (e, el) {
                    /*when at window edge, on rare occasions you get NaNs; check in case*/
                    var x, y,
                        cords = _ezJS.mouse.get(e),
                        mX    = el.lastMouseX,
                        mY    = el.lastMouseY,
                        dX    = (isNaN(cords.x) ? 0.0 : parseFloat(cords.x)) - mX,
                        dY    = (isNaN(cords.y) ? 0.0 : parseFloat(cords.y)) - mY,
                        wX    = (el.dirX === 0 ? parseFloat(el.style.left) : parseFloat(el.style.right)) + dX,
                        wY    = (el.dirY === 0 ? parseFloat(el.style.top)  : parseFloat(el.style.bottom))+ dY;

                    /*drag object to new position if within limits*/
                    el.lastMouseX = mX + dX;
                    if (el.minX != null && el.minX > wX) wX = el.minX;
                    x  = (el.maxX != null && el.maxX < wX) ? el.maxX : wX;
                    el.style[el.dirX === 0 ? 'left' : 'right'] = x + 'px';

                    el.lastMouseY = (mY + dY);
                    if (el.minY != null && el.minY > wY) wY = el.minY;
                    y  = (el.maxY != null && el.maxY < wY) ? el.maxY : wY;
                    el.style[el.dirY === 0 ? 'top' : 'bottom'] = y + 'px';

                    el.ondrag(x, y);
                },

                end : function (el) {
                    /*unset events except grip handle*/
                    var doc = document;
                    doc.onmousemove = null;
                    doc.onmouseup   = null;
                    el.ondragend();
                }
            };

            this.isEmbedded = function (w) {
                var win = w || window,
                    status, i, frame, frameDoc,
                    iFrames = win.parent.document.getElementsByTagName("IFRAME");
                if (iFrames) {
                    for (i = 0, frame; frame = iFrames[i]; i++) {
                        frameDoc = frame.contentDocument || frame.contentWindow.document;
                        if (frameDoc === win.document) break;
                    }
                }
                return frame;
            };

            return this.getDom(obj, filters);
        },
    },

    about = {
        version : '1.1.0',
        author  : 'Isaac Muse'
    },

    util = {
        ajaxCallQueue   : {},
        cachedJS   : {},
        cachedCSS       : {},
        executingScript : [],

        domReady : {
            done : true,
            list : [],

            check : function (fn) {
                if (document == null) return;
                ezJS.domReady.done = false;
                /*if already done execute function*/
                if (document.readyState === "complete") {
                    ezJS.domReady.execute(null, fn);
                    return;
                /*Create DomReady events; only support IE8+, and other recent browsers*/
                } else if (fn && ezJS.domReady.list.length === 0) {
                    ezJS.domReady.list.push(fn);
                    if (document.addEventListener) {
                        document.addEventListener("DOMContentLoaded", ezJS.domReady.execute, false);
                        window.addEventListener( "load", ezJS.domReady.execute, false );
                    } else if (document.attachEvent) {
                        document.attachEvent('onreadystatechange', ezJS.domReady.execute);
                        window.attachEvent( "onload", ezJS.domReady.execute);
                    }
                }
                /*Keep checking until done*/
                setTimeout(function(){ezJS.domReady.check();}, 1);
            },

            execute : function (e, fn) {
                if (ezJS.domReady.done === false) {
                    ezJS.domReady.done = true;
                    /* Launch late function*/
                    if (fn) fn();
                    /* Loop through all early functions*/
                    if (ezJS.domReady.list.length > 0) {
                        /*Clean up current function and event*/
                        if (document.removeEventListener) {
                            document.removeEventListener("DOMContentLoaded", ezJS.domReady.execute, false);
                            window.removeEventListener( "load", ezJS.domReady.execute, false );
                        } else if (document.detachEvent) {
                            document.detachEvent('onreadystatechange', ezJS.domReady.execute);
                            window.detachEvent( "onload", ezJS.domReady.execute);
                        }
                        while (ezJS.domReady.list.length > 0){
                            ezJS.domReady.list.shift()();
                        }
                    }
                }
            },
        },

        shortcuts : {
            keys : {
                "Backspace" : 8,
                "Tab"       : 9,
                "Enter"     : 13,
                "Pause"     : 19,
                "Capslock"  : 20,
                "Esc"       : 27,
                "Space"     : 32,
                "Page up"   : 33,
                "Page down" : 34,
                "End"       : 35,
                "Home"      : 36,
                "Left"      : 37,
                "Up"        : 38,
                "Right"     : 39,
                "Down"      : 40,
                "Insert"    : 45,
                "Delete"    : 46,
                "0"         : 48,
                "1"         : 49,
                "2"         : 50,
                "3"         : 51,
                "4"         : 52,
                "5"         : 53,
                "6"         : 54,
                "7"         : 55,
                "8"         : 56,
                "9"         : 57,
                "a"         : 65,
                "b"         : 66,
                "c"         : 67,
                "d"         : 68,
                "e"         : 69,
                "f"         : 70,
                "g"         : 71,
                "h"         : 72,
                "i"         : 73,
                "j"         : 74,
                "k"         : 75,
                "l"         : 76,
                "m"         : 77,
                "n"         : 78,
                "o"         : 79,
                "p"         : 80,
                "q"         : 81,
                "r"         : 82,
                "s"         : 83,
                "t"         : 84,
                "u"         : 85,
                "v"         : 86,
                "w"         : 87,
                "x"         : 88,
                "y"         : 89,
                "z"         : 90,
                "0 numpad"  : 96,
                "1 numpad"  : 97,
                "2 numpad"  : 98,
                "3 numpad"  : 99,
                "4 numpad"  : 100,
                "5 numpad"  : 101,
                "6 numpad"  : 102,
                "7 numpad"  : 103,
                "8 numpad"  : 104,
                "9 numpad"  : 105,
                "* numpad"  : 106,
                "+ numpad"  : 107,
                "- numpad"  : 109,
                ". numpad"  : 110,
                "/ numpad"  : 111,
                "F1"        : 112,
                "F2"        : 113,
                "F3"        : 114,
                "F4"        : 115,
                "F5"        : 116,
                "F6"        : 117,
                "F7"        : 118,
                "F8"        : 119,
                "F9"        : 120,
                "F10"       : 121,
                "F11"       : 122,
                "F12"       : 123,
                "Equal"     : 187,
                "Coma"      : 188,
                "Slash"     : 191,
                "Backslash" : 220
            },

            payload : {},
            repeat  : {},
            kill    : {},
            events  : {}
        },

        require : function(script) {
            /*jshint evil: true*/
            var fail = false,
                ext = script.splitext()[1].toUpperCase(),
                statusCode = 0,
                fullPath = window.location.href.split('?')[0].dirname() + '/' + script,
                findScript = function (path, ext) {
                    var target = (ext === 'CSS') ? 'link' : 'script',
                        src = ezJS(document).query(target),
                        loaded = false,
                        i, item;
                    if (ezJS["cached" + ext][path] == null || ezJS["cached" + ext][path] === false) {
                        for (i = 0; item = src[i]; i++) {
                            if (item.src === path) {
                                loaded = true;
                                ezJS["cached" + ext][path] = true;
                                break;
                            }
                        }
                    } else {
                        loaded = true;
                    }
                    return loaded;
                };

            if (!findScript(fullPath, ext)) {
                ezJS.ajax(
                    {
                        'url' : script,
                        'header' : (ext === 'CSS') ? "text/css" : "text/javascript; charset=UTF-8",
                        'async': false,
                        'cache': false,
                        'fail' : function (e, status) {statusCode = status; ezJS["cached" + ext][fullPath] = false;},
                        'complete' : function (e, status){
                            var style;
                            statusCode = status;
                            // http://weblogs.java.net/blog/driscoll/archive/2009/09/08/eval-javascript-global-context
                            if (/\S/.test(e)) {
                                if (ext === 'CSS') {
                                    style = document.createElement("style");
                                    style.setAttribute("type", "text/css");
                                    if (style.styleSheet) style.styleSheet.cssText = e;
                                    else                  style.appendChild(document.createTextNode(e));
                                    document.getElementsByTagName("head")[0].appendChild(style);
                                    ezJS.cachedCSS[fullPath] = true;
                                } else {
                                    ezJS.executingScript.push(script);
                                    if (window.execScript){
                                        ezJS.cachedJS[fullPath] = true;
                                        window.execScript(e);
                                    } else {
                                        ezJS.cachedJS[fullPath] = true;
                                        window.eval.call(window, e);
                                    }
                                    ezJS.executingScript.pop();
                                }
                            } else {
                                fail = true;
                            }
                        }
                    }
                );
            } else {
                fail = true;
            }
            return {
                "done" : function (fn) {if (!fail) fn(statusCode); return this;},
                "fail" : function (fn) {if (fail) fn(statusCode); return this;},
                "status": !fail,
                "statusCode": statusCode
            };
        },

        getLoadingScriptPath : function (callback){
            var fullPath = window.location.href.split('?')[0].dirname() + '/',
                scripts, script;
            if (ezJS.executingScript.length){
                script = ezJS.executingScript[ezJS.executingScript.length - 1];
            } else {
                scripts = document.getElementsByTagName("script");
                script = scripts[scripts.length - 1].src.replace(fullPath, '');
            }
            if (callback) callback(script);
            return script;
        },

        getJSON : function(script) {
            var jsondata,
                fail = false,
                statusCode;
            ezJS.ajax(
                {
                    'url' : script,
                    'header' : "text/JSON; charset=UTF-8",
                    'cache': false,
                    'async': false,
                    'fail' : function (e, status) {fail = true; statusCode = status;},
                    'complete' : function (e, status){
                        statusCode = status;
                        if (/\S/.test(e, status)) {
                            jsondata = JSON.parse(e);
                        } else {
                            fail = true;
                        }
                    }
                }
            );
            return {
                "done" : function (fn) {if (!fail) fn(jsondata, statusCode); return this;},
                "fail" : function (fn) {if (fail) fn(statusCode); return this;},
                "status": !fail,
                "statusCode": statusCode
            };
        },

        ajax : function (options) {
            options = ezJS.merge(options, {
                'url'        : null,
                'type'       : 'GET',
                'parameters' : [],
                'async'      : true,
                'cache'      : true,
                'header'     : 'application/x-www-form-urlencoded; charset=UTF-8',
                'statusCode' : {},
                'complete'   : function (){},
                'fail'       : function (){},
                'exit'       : function (){}
            });
            var i,
                request = new XMLHttpRequest(),
                pushed  = false,
                urlParts, parms;
            for (i = 0; !pushed; i++) {
                pushed = (function (idx) {
                    if (ezJS.ajaxCallQueue['ajax' + idx] == null) {
                        var requestID = request.ajaxId = 'ajax' + idx;
                        request.onreadystatechange = function () {
                            if (this.readyState === 4){
                                if (options.statusCode[this.status]) {
                                    options.statusCode[this.status](this.responseText, this.status);
                                } else if ( this.status === 200 || window.location.href.indexOf("http") === -1) {
                                    options.complete(this.responseText, this.status);
                                } else {
                                    options.fail(this.responseText, this.status);
                                }

                                options.exit();
                                setTimeout(
                                    function () {
                                        if (ezJS.ajaxCallQueue[requestID] != null) delete ezJS.ajaxCallQueue[requestID];
                                    },
                                    100
                                );
                            }
                        };
                        ezJS.ajaxCallQueue['ajax' + idx] = request;
                        urlParts = options.url.split('?');
                        urlParts[1] = options.parameters.concat(urlParts[1] || []).join('&');
                        if (!options.cache) {
                            parms = urlParts[1].replace(/(_=)([\d]*)/, "$1" + ezJS.epochTime('sec'));
                            urlParts[1] = ((parms === urlParts[1]) ? [parms, "_=" + ezJS.epochTime('sec')].join('&'): parms);
                        }

                        if (options.type === 'GET') {
                            request.open(options.type, urlParts.join('?'), options.async);
                            request.setRequestHeader("Content-type", options.header);
                            if (!options.cache) request.setRequestHeader("Cache-Control", "no-cache");
                            request.send(null);
                        } else {
                            request.open(options.type, urlParts[0], options.async);
                            request.setRequestHeader("Content-type", options.header);
                            if (!options.cache) request.setRequestHeader("Cache-Control", "no-cache");
                            request.send(urlParts[1]);
                        }
                        return true;
                    }
                    return false;
                })(i);
            }
        },

        arrayMap : function (fn, params) {
            var status = [], i = 0,
                max    = (params && params.length) ? params.length : 0;
            for (; i < max; i++) {
                status[i] = fn(params[i]);
            }
            return ((i) ? status : null);
        },

        assocMap : function (fn, params) {
            var status = [], x, i = 0;
            if (status == null) return null;
            for (x in params) {
                status[i] = fn(x, params[x]);
                i++;
            }
            return ((i) ? status : null);
        },

        addPrototype : function (obj, item, proto) {
            if (item == null)           obj.prototype = proto;
            else if (obj[item] == null) obj.prototype[item] = proto;
        },

        inherit : function (child, parent) {
            function Inheritance() {}
            Inheritance.prototype = parent.prototype;
            child.prototype = new Inheritance();
            child.prototype.constructor = child;
            child.baseConstructor = parent;
        },

        epochTime : function (units) {
            var time = new Date().getTime();
            switch (units) {
                case 'mil': time = time;         break;
                case 'sec': time = time / 60;    break;
                case 'min': time = time / 3600;  break;
                case 'hr' : time = time / 21600; break;
                default : time = 0;              break;
            }
            return parseInt(time, 10);
        },

        merge : function (obj, defaults) {
            var index;
            if (Object.toType(obj) === 'undefined') obj = {};
            for (index in defaults) {
                if (Object.toType(obj[index]) === "undefined") obj[index] = defaults[index];
            }
            return obj;
        },

        mergeDeep : function (obj, defaults) {
            var index, type;
            type = Object.toType(obj);
            if (type === 'undefined' || type !== "object") obj = {};
            for (index in defaults) {
                (function (idx) {
                    type = Object.toType(obj[idx]);
                    if (type === "undefined") {
                        obj[idx] = defaults[idx];
                    } else if ( Object.toType(defaults[idx]) === "object") {
                        obj[idx] = ezJS.mergeDeep(obj[idx], defaults[idx]);
                    }
                })(index);
            }
            return obj;
        },

        toArray : function () {
            var array = [], i, item, obj;
            if (arguments.length === 0) return [];
            obj = (arguments.length === 1) ? arguments[0] : arguments;
            if (obj == null || ezJS.isArray(obj)) return obj;
            else if (!ezJS.isString(obj) && !ezJS.isUndef(obj.length)) {
                if (obj.length === 0) return null;
                else {
                    try {
                        return [].slice.call(obj);
                    } catch (err) {
                        for (i = 0, item; item = obj[i]; i++) {
                            array[i] = item;
                        }
                        return array;
                    }
                }
            }
            return [obj];
        },

        getType : function (obj) {
            return Object.toType(obj);
        },

        isString : function (obj) {
            return ezJS.getType(obj) === 'string';
        },

        isFunction : function (obj) {
            return ezJS.getType(obj) === 'function';
        },

        isMarkup : function (obj) {
            /*obviously not a validity checker and not robust at all
              just a quick probability check.  Probably only useful
              internally.  Might move it there.*/
            return (ezJS.isString(obj) && (/^\s*<.*>\s*$/).test(obj));
        },

        isArray : function (obj) {
            return ezJS.getType(obj) === 'array';
        },

        isRegex : function (obj) {
            return ezJS.getType(obj) === 'regexp';
        },

        isDocument : function (obj) {
            return (obj && obj.nodeType != null && obj.nodeType == 9);
        },

        isXML : function (obj) {
            return (ezJS.isDocument(obj) && ((obj.xmlVersion && obj.xmlVersion != null) || obj.xml || ezJS.getType(obj) === 'xmldocument'));
        },

        isElement : function (obj) {
            return (obj && obj.nodeType != null && obj.nodeType == 1);
        },

        isUndef : function (obj) {
            return ezJS.getType(obj) === 'undefined';
        },

        isWindow : function (obj) {
            /*Window isn't standardized, so its content can vary
              It really doesn't have a unique class either.  The best
              we can do is make sure the object isn't null, is a normal
              object, and look for something unique in window that is
              consistant in all browsers. We could also check if global, but
              I want to catch any window, not just the window of this frame.*/
            return (obj && (typeof obj === "object") && ("setTimeout" in obj));
        },

        isFloat : function (value) {
            return (/^((?:-|)[0-9]*\.{0,1}[0-9]+)$/).test(value.toString().trim());
        },

        isInt : function (value) {
            return (/^((?:-|)[0-9]+)$/).test(value.toString().trim());
        },

        isIEEvent : function (e) {
            return ((Object.toType(e) === 'undefined') ? window.event : e);
        },

        isInlineEvent : function (name) {
            var m = (/^([A-Za-z0-9]+)(\=)$/).exec(name);
            if (m) return m[1];
        },

        strToXML : function (str) {
            var xml, parser;
            if (window.ActiveXObject){
                xml       = new window.ActiveXObject('Microsoft.XMLDOM');
                xml.async = 'false';
                if (!xml.loadXML(str)) xml = null;
            } else {
                parser = new window.DOMParser();
                xml    = parser.parseFromString(str, 'text/xml');
            }
            return ((ezJS.isXML(xml)) ? xml : null);
        },

        extend : function (obj, extensions) {
            var x;
            for (x in extensions) {
                if (obj[x] == null) obj[x] = extensions[x];
            }
        }
    },

    extenders = {
        baseExtender : function (element, ez) {
            var i, item;
            element = element || [];
            for (i = 0, item; item = element[i]; i++) {
                this.push(item);
            }
            this._easyJS = ez;
            this._currentIndex = (this.length) ? 0 : -1;

            this.get = function (val) {
                if (this.length) return ez.getElements(ezJS.toArray(this), val);
                else             return null;
            };
            this.first = function () {
                if (this.length) return this[this._currentIndex];
                else             return null;
            };
            this.size = function () {
                return this.length;
            };
        },

        stringExtender : function (string, ez) {
            if (string != null) string = [string];
            ezJS.extenders.stringExtender.baseConstructor.call(this, string, ez);
            this.xml = function () {
                var xml = ezJS.strToXML(this.first());
                if (xml) {
                    return new ezJS.extenders.xmlExtender([xml], ez);
                }
                return null;
            };
        },

        browserExtender : function (element, ez) {
            ezJS.extenders.browserExtender.baseConstructor.call(this, element, ez);
            this.each = function (fn, options) {
                return ez.each(this.get(), fn, options);
            };
            this.addEvent = function (name, fn) {
                if (!ezJS.isString(name)) {
                    ez.each(this.get(), function (dom, options){ez.elAssocMap(dom, ez.addEvent, options);}, name);
                } else {
                    ez.each(this.get(), function (dom) {ez.addEvent(dom, name, fn);});
                }
                return this;
            };
            this.removeEvent = function (name, fn) {
                if (!ezJS.isString(name)) {
                    ez.each(this.get(), function (dom, options){ez.elAssocMap(dom, ez.removeEvent, options);}, name);
                } else {
                    ez.each(this.get(), function (dom) {ez.removeEvent(dom, name, fn);});
                }
                return this;
            };
            this.attr = function (item, value) {
                if (!ezJS.isString(item)) {
                    ez.each(this.get(), function (dom, options){ez.elAssocMap(dom, ez.attr, options);}, item);
                } else if (ezJS.isUndef(value)) {
                    return ez.attr(this.first(), item);
                } else {
                    ez.each(this.get(), function (dom) {return ez.attr(dom, item, value);});
                }
                return this;
            };
        },

        domExtender : function (element, ez) {
            ezJS.extenders.domExtender.baseConstructor.call(this, element, ez);
            this.getContent = function () {
                return ez.getContent(this.first());
            };
            this.query = function (css, filters) {
                var elements = ez.query(this.first(), css);
                if (elements && !ezJS.isUndef(filters)) elements = ez.filter(elements, filters);
                return ez.getExtender(elements, css);
            };
            this.easyJS = function (obj, filters) {
                return ez.getDom(obj, filters);
            };
            this.addShortcut = function (settings) {
                if (ezJS.isArray(settings)) ez.elArrayMap(this.first(), ez.shortcuts.add, settings);
                else                     ez.shortcuts.add(this.first(), settings);
                return this;
            };
            this.removeShortcut = function (name) {
                if (ezJS.isArray(name)) ez.elArrayMap(this.first(), ez.shortcuts.remove, name);
                else                 ez.shortcuts.remove(this.first(), name);
                return this;
            };
        },

        elExtender : function (element, ez) {
            ezJS.extenders.elExtender.baseConstructor.call(this, element, ez);
            this.fade = function (options) {
                ez.effects.fade(this.first(), options);
                return this;
            };
            this.arrayMap = function (fn, options) {
                return ez.each(this.get(), function (dom) {return ez.elArrayMap(dom, fn, options);});
            };
            this.assocMap = function (fn, options) {
                return ez.each(this.get(), function (dom) {return ez.elAssocMap(dom, fn, options);});
            };
            this.center = function (dim) {
                ez.each(this.get(), ez.position.center, dim);
                return this;
            };
            this.absPos = function (dim) {
                return ez.absPos(this.first(), dim);
            };
            this.animate = function (options, time, fn) {
                ez.effects.animate(this.first(), options, time, fn);
                return this;
            };
            this.css = function (item, value) {
                if (!ezJS.isString(item)) {
                    ez.each(this.get(), function (dom, options){ez.elAssocMap(dom, ez.css, options);}, item);
                } else if (ezJS.isUndef(value)){
                    return ez.css(this.first(), item);
                } else {
                    ez.each(this.get(), function (dom) {return ez.css(dom, item, value);});
                }
                return this;
            };
            this.cursor = function (param1, param2) {
                if (param1 == null)        return ez.cursor.get(this.first());
                if (ezJS.isString(param1)) ez.cursor.insert(this.first(), param1, param2);
                else                       ez.cursor.set(this.first(), param1);
                return this;
            };
            this.filter = function (filters) {
                return ez.getExtender(ez.filter(this.get(), filters));
            };
            this.idx = function (idx) {
                if (idx < this.length) this._currentIndex = idx;
                return this;
            };
            this.addDrag = function (options) {
                ez.drag.init(this.first(), options);
                return this;
            };
            this.setDragActions = function (options) {
                ez.drag.setDragActions(this.first(), options);
                return this;
            };
        },

        docExtender : function (element, ez) {
            ezJS.extenders.docExtender.baseConstructor.call(this, element, ez);
            ez.selDoc = this.first();
            ez.selWin = 'defaultView' in ez.selDoc ? ez.selDoc.defaultView : ez.selDoc.parentWindow;
            if (ez.selDoc === document) {
                this.domReady = function (fn) {
                    ez.domReady.check(fn);
                    return this;
                };
            }
            this.create = function (type) {
                var el = this.first().createElement(type);
                return ((ezJS.isElement(el)) ? ez.getExtender(el) :  null);
            };
            this.getById = function (i) {
                return ez.getById(i);
            };
            this.getByClass = function (c) {
                if (!ezJS.isArray()) c = [c];
                return ez.getByClass(c);
            };
            this.getByAttr = function (a) {
                if (!ezJS.isArray(a)) a = [a];
                return ez.getByAttr(a);
            };
            this.getByTag = function (t) {
                return ez.getByTag(t);
            };
            this.topZIndex = function () {
                return ez.topZIndex();
            };
            this.mousePos = function (e, dim) {
                return ez.mouse.get(e, dim);
            };
            this.xml = function () {
                return ((ezJS.isXML(this.first())) ? new ezJS.extenders.xmlExtender([this.first()], ez) : null);
            };
            this.isEmbedded = function () {
                return ez.isEmbedded(ez.selWin);
            };
        },

        xmlExtender : function (el, ez) {
            /*read only for now*/
            ezJS.extenders.xmlExtender.baseConstructor.call(this, el, ez);
            ez.selDoc = this.first();
            this.firstElement = function (name) {
                var elements, ext;
                if (name == null && this.first().firstChild) {
                    ext = new ezJS.extenders.xmlNodeExtender([this.first().firstChild], this.first(), ez);
                } else {
                  elements = this.getElements(name);
                    if (elements) ext = new ezJS.extenders.xmlNodeExtender(elements.slice(0, 1), this.first(), ez);
                }
                return ext;
            };
            this.findElements = function (name) {
                var elements = this.getElements(name);
                return ((elements) ? new ezJS.extenders.xmlNodeExtender(elements, this.first(), ez) : null);
            };
            this.getElements = function (name) {
                var elements = ezJS.toArray(this.first().getElementsByTagName(name));
                return ((elements && elements.length > 0) ? elements : null);
            };
            this.attr = function(item) {
                return ez.attr(this.first(), item);
            };
            this.idx = function (idx) {
                if (idx < this.length) this._currentIndex = idx;
                return this;
            };
            this.filter = function (filters) {
                return ez.getExtender(ez.filter(this.get(), filters));
            };
            this.root = function () {
                return new ezJS.extenders.xmlExtender([ez.selDoc], ez);
            };
        },

        xmlNodeExtender : function (el, root, ez) {
            ezJS.extenders.xmlNodeExtender.baseConstructor.call(this, el, ez);
            ez.selDoc = root;
            this.value = function () {
                return ((this.first().textContent != null) ? this.first().textContent : this.first().text);
            };
        },

        winExtender : function (element, ez) {
            ezJS.extenders.winExtender.baseConstructor.call(this, element, ez);
            ez.selWin = this.first();
            ez.selDoc = ez.selWin.document;
            this.size = function (dim) {
                return ez.win.size(dim);
            };
            this.scrollOffset = function (dir) {
                return ez.win.scrollOffset(dir);
            };
            this.center = function (dim) {
                return ez.win.center(dim);
            };
        }
    };

    /*Extend the easyJS object with methods etc.*/
    util.extend(ezJS, {'about' : about});
    util.extend(ezJS, {'extenders' :extenders});
    util.extend(ezJS, util);
    util.extend(ezJS, internal);

    /*Setup HTML object iheritance for basic stuff*/
    /*Make the base extender an array like object*/
    ezJS.addPrototype(
        ezJS.extenders.baseExtender,
        null,
        {
            constructor: ezJS.extenders.baseExtender,
            length  : 0,
            push    : [].push,
            splice  : [].splice,
            indexOf : [].indexOf
        }
    );
    ezJS.inherit(ezJS.extenders.browserExtender, ezJS.extenders.baseExtender);
    ezJS.inherit(ezJS.extenders.stringExtender,  ezJS.extenders.baseExtender);
    ezJS.inherit(ezJS.extenders.xmlExtender,     ezJS.extenders.baseExtender);
    ezJS.inherit(ezJS.extenders.xmlNodeExtender, ezJS.extenders.xmlExtender);
    ezJS.inherit(ezJS.extenders.domExtender,     ezJS.extenders.browserExtender);
    ezJS.inherit(ezJS.extenders.winExtender,     ezJS.extenders.browserExtender);
    ezJS.inherit(ezJS.extenders.docExtender,     ezJS.extenders.domExtender);
    ezJS.inherit(ezJS.extenders.elExtender,      ezJS.extenders.domExtender);

    /*Prototype away! Add useful prototypes */
    /*http://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator*/
    Object.toType = (function toType(global) {
        var types = {};
        return function(obj) {
            var key;
            if (obj === null)   return "null";
            if (obj ==  null)   return "undefined";
            if (obj === global) return "global";
            return (types[key = types.toString.call(obj)] || (types[key] = key.match(/\s([a-z|A-Z]+)/)[1].toLowerCase()));
        };
    })(window);
    ezJS.addPrototype(Array, 'remove', function (from, to) {
        this.splice(
            from,
            (to >= 0) * to||
            (to < 0 && ((from < to) * (from - to - 1) * (-1) || ((this.length + to + 1) !== from) * (this.length + to - from + 1)))
        );
        return this.length;
    });
    ezJS.addPrototype(String, 'regEscape', function () {
        return this.replace(/[\-\[\]\{\}\(\)\*\+\?\.\,\\\^\$\|\#\s\!]/g, "\\$&");
    });
    ezJS.addPrototype(String, 'trim', function (value) {
        var str;
        if (value == null) {
            str = this.replace(/^\s+|\s+$/g, '');
        } else {
            value = value.regEscape();
            str   = this.replace(new RegExp('^(' + value + ')+|(' + value + ')+$', 'g'), '');
        }
        return str;
    });
    ezJS.addPrototype(String, 'ltrim', function (value) {
      return ((value == null) ?
        this.replace(/^\s+/g, '') : this.replace(new RegExp('^(' + value.regEscape() + ')+', 'g'), ''));
    });
    ezJS.addPrototype(String, 'rtrim', function (value) {
        return ((value == null) ?
            this.replace(/\s+$/g, '') : this.replace(new RegExp('(' + value.regEscape() + ')+$', 'g'), ''));
    });
    ezJS.addPrototype(String, 'dirname', function () {
        return this.replace(/\\/g, '/').replace(/\/[^\/]*$/, '');
    });
    ezJS.addPrototype(String, 'basename', function () {
        return this.replace(/\\/g, '/').replace(/.*\//, '');
    });
     ezJS.addPrototype(String, 'splitext', function () {
        var base,
            pieces = this.split('.'),
            ext = (pieces.length > 1) ? pieces.pop() : "";
        if (!(ext !== "" && (/^[^\\\/]*$/).exec(ext))) {
            ext = "";
            base = this;
        } else {
            base = pieces.join('.');
        }
        return [base, ext];
    });
    ezJS.addPrototype(String, 'toFwdSlash', function () {
        return this.replace(/\\/g, '/');
    });
    ezJS.addPrototype(String, 'toBackSlash', function () {
        return this.replace(/\//g, '\\');
    });
    ezJS.addPrototype(String, 'splice', function (from, to, insert) {
        var arr = this.split('');
        arr.splice(from, to, insert);
        return arr.join('');
    });
    ezJS.addPrototype(String, 'subSelect', function (from, to) {
        return this.split('').splice(from, to).join('');
    });

    /*setup access*/
    window.easyJS = window.$ = ezJS;
})(document, this);
