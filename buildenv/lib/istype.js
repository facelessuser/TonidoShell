/*
    istype.js
    Simple helper functions for determining what type of object something is.
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

/*jshint node: true, strict: false*/
var is = {
    regex : function (obj) {
        return Object.toType(obj) === 'regexp';
    },
    string : function (obj) {
        return Object.toType(obj) === 'string';
    },
    function : function (obj) {
        return Object.toType(obj) === 'function';
    },
    array : function (obj) {
        return Object.toType(obj) === 'array';
    },
    undefined : function (obj) {
        return Object.toType(obj) === 'undefined';
    },
    float : function (value) {
        return (/^((?:-|)[0-9]*\.{0,1}[0-9]+)$/).test(value.toString().trim());
    },
    int : function (value) {
        return (/^((?:-|)[0-9]+)$/).test(value.toString().trim());
    }
};

exports.toType = function (obj) {
    return Object.toType(obj);
};

/*http://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator*/
Object.toType = (function toType() {
    var types = {};
    return function(obj) {
        var key;
        if (obj === null)   return "null";
        if (obj ==  null)   return "undefined";
        return (types[key = types.toString.call(obj)] || (types[key] = key.match(/\s([a-z|A-Z]+)/)[1].toLowerCase()));
    };
})();

exports.is = is;
