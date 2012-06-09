/*
    manifest.js
    Generate Tonido plugin manifest.
    Copyright 2011 Isaac Muse

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

/*jshint node:true, strict:false*/

var toType = require('./istype').toType;

function mergeDeep(obj, defaults) {
    var index,type;
    type = toType(obj);
    if (type === 'undefined' || type !== "object") obj = {};
    for(index in defaults) {
        (function (idx) {
            type = toType(obj[idx]);
            if(type === "undefined") {
                obj[idx] = defaults[idx];
            } else if(toType(defaults[idx]) === "object") {
                obj[idx] = mergeDeep(obj[idx], defaults[idx]);
            }
        })(index);
    }
    return obj;
}

function indent(tab) {
    var tabs = '', i;
    for (i = 0; i < tab; i++) {
        tabs += '    ';
    }
    return tabs;
}

function convertElements(options, tab) {
    var elements = '', x;
    for (x in options) {
        (function (y) {
            elements += indent(tab);
            if(typeof options[y] === 'object') {
                elements += "<" + y + ">\n";
                elements += convertElements(options[y], tab + 1);
                elements += indent(tab);
                elements += "</" + y + ">\n";
            } else {
                elements += "<" + y + ">" + options[y] + "</" + y + ">\n";
            }
        })(x);
    }
    return elements;
}

function xmlDump(output, options) {
    var tab    = 0,
        fs     = require('fs'),
        path   = require('path'),
        xml    = "<?xml version='1.0' encoding='utf-8'?>\n";

        xml += convertElements(options, tab);
        fs.writeFileSync(path.normalize(output), xml);
}

exports.createManifest = function (output, options) {
    var defaultOptions = {
        "TonidoManifest" : {
            "Meta" : {
                "Name"              : "application",
                "DisplayName"       : "Application",
                "BaseUrl"           : "",
                "HomePageUrl"       : "",
                "Version"           : "0.0.0.0",
                "CompatibleVersion" : "\\d+\\.\\d+\\.\\d+\\.\\d+",
                "OS"                : "Linux|Windows NT|Darwin",
                "OSVersion"         : "",
                "Arch"              : "i386|i686|x86_64|IA32|armv5",
                "Vendor"            : "Vendor",
                "Description"       : "Application",
                "Critical"          : "false",
                "License"           : "free",
                "AppURL"            : "dyn/application/index.php",
                "Authentication"    : "AUTH_ROLE_OWNER",
                "Runtime"           : "php"
            },
            "Files" : "",
            "SharedLibraries" : ""
        }
    };
    console.log('Genrating manifest: ' + output);
    xmlDump(output, mergeDeep(options, defaultOptions));
};
