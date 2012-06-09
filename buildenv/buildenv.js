/*
    buildenv.js
    A simple build environment for copying/deleting/moving/linting/packing files.
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
var fs = require('fs'),
    sfu = require('./lib/syncfileutil'),
    path = require('path'),
    is = require('./lib/istype').is;

exports.merge = function (obj, defaults) {
    var index;
    if (is.undefined(obj)) obj = {};
    for (index in defaults) {
        if (is.undefined(obj[index])) obj[index] = defaults[index];
    }
    return obj;
};

exports.epochTime = function (units) {
    var time = new Date().getTime();
    switch (units) {
        case 'mil': time = time;         break;
        case 'sec': time = time / 60;    break;
        case 'min': time = time / 3600;  break;
        case 'hr' : time = time / 21600; break;
        default : time = 0;              break;
    }
    return parseInt(time, 10);
};

exports.copyFiles = function (from, to, callback) {
    var flags;
    from = (is.array(from)) ? from : [from];
    from.forEach( function (item) {
        console.log("Copying: " + item);
        flags = (fs.statSync(item).isDirectory()) ? 'r' : '';
        if (sfu.cp(item, ((is.function(to)) ? to(item) : to), flags)) {
            throw 'Copy file exception: Cannot copy ' + item + '!';
        }
        if (callback) {
            callback(((is.function(to)) ? to(item) : to));
        }
    });
};

exports.removeFiles = function (target, callback) {
    var flags;
    target = (is.array(target)) ? target : [target];
    target.forEach( function (item) {
        item = path.normalize(item);
        console.log("Removing: " + item);
        flags = (fs.statSync(item).isDirectory()) ? 'r' : '';
        if (sfu.rm(item, flags)) {
            throw "Remove file exception: Cannot remove " + item + "!";
        }
        if (callback) {
            callback();
        }
    });
};

exports.makeDirs = function (dirs) {
    dirs = (is.array(dirs)) ? dirs : [dirs];
    dirs.forEach( function (item) {
        console.log("Making dir(s): " + item);
        if (sfu.mkdir(item, 0777, 'r')) {
            throw "Make dirctory exception: Cannot create " + item + "!";
        }
    });
};

exports.compileJS = function (files, dest, options) {
    var jsp = require('uglify-js').parser,
        pro = require('uglify-js').uglify;

    options = exports.merge(options,
        {
            postProcessing : null,
            debug : false,
            preferences : {}
        }
    );

    files = (is.array(files)) ? files : [files];
    files.forEach( function (file) {
        var results = '',
            ast, code, destPath;
        console.log('compressing JS: ' + file + '...');
        code = fs.readFileSync(file, 'utf8');

        if (options.preferences.preserve_copyright && !options.debug) {
            results = (function(comments) {
                // Find first comment
                var m = code.match(/^(\/\*[^\*]*\*+(?:[^\/\*][^\*]*\*+)*\/|\s*\/\/(?:[^\r\n])*)/);
                return ((m) ? m[0] + '\n' : '');
            })(code);
        }

        destPath = path.normalize((is.function(dest)) ? dest(path.basename(file)) : path.join(dest, path.basename(file)));

        if (options.debug) {
            fs.writeFileSync(destPath, code, 'utf8');
        } else {
            ast = jsp.parse(code, options.preferences.strict_semicolons);
            ast = pro.ast_mangle(ast, options.preferences.mangle_options);
            ast = pro.ast_squeeze(ast, options.preferences.squeeze_options);
            results += pro.gen_code(ast, options.preferences.gen_options);
            fs.writeFileSync(destPath, results, 'utf8');
        }

        if (options.postProcessing && is.function(options.postProcessing)) {
            options.postProcessing(destPath);
        }
    });
};

exports.lintJS = function (files, options) {
    var jshint = require('jshint').JSHINT,
        file, out, error, errors, i;
    options = (is.undefined(options)) ? {} : options;
    files = (is.array(files)) ? files : [files];
    while (files.length) {
        file = files.shift();

        if(jshint(fs.readFileSync(file, 'utf8'), options)) {
            console.log('Lint JS: ' + file + ' has no errors!');
        } else {
            console.log('Lint JS: Errors in file ' + file);
            console.log('');
            out = jshint.data(),
            errors = out.errors;

            for (i = 0; error = errors[i]; i++) {
                console.log(error.line + ':' + error.character + ' -> ' + error.reason + ' -> ' + error.evidence);
            }

            console.log('');
        }
    }
};

exports.compileCSS = function (files, dest, options) {
    // Does not work the same imported from node as it does called from the command line
    var pro = require('cssmin').cssmin;
    options = exports.merge(options,
        {
            postProcessing : null,
            debug : false,
            preferences : {}
        }
    );

    files = (is.array(files)) ? files : [files];
    files.forEach( function (file) {
        var results = '',
            code, destPath;
        console.log('compressing CSS: ' + file + '...');
        code = fs.readFileSync(file, 'utf8');

        if (options.preferences.preserve_copyright && !options.debug) {
            results = (function(comments) {
                var m = code.match(/^(\/\*[^\*]*\*+(?:[^\/\*][^\*]*\*+)*\/|\s*\/\/(?:[^\r\n])*)/);
                return ((m) ? m[0] + '\n' : '');
            })(code);
        }

        if (options.preferences.data_uri) {
            code = (function(c, base) {
                return code.replace(
                    /(url\()['"]?((?:[^\)]+?))['"]?(\))/g,
                    function ($0, $1, $2, $3){
                        var image = path.join(base, $2),
                            data, ext, uri;
                        if (path.existsSync(image)) {
                            try {
                                console.log('    Converting image to data uri: ' + image + '...');
                                ext = path.extname(image).replace('.', '').toLowerCase();
                                data = fs.readFileSync(image, 'base64');
                                uri = $1 + 'data:image/' + ext + ';base64,' + data + $3;
                            } catch (err) {
                                uri = $0;
                            }
                        }
                        return uri;
                    }
                );
            })(code, path.dirname(file));
        }

        destPath = (is.function(dest)) ? dest(path.basename(file)) : path.join(dest, path.basename(file));

        if (options.debug) {
            fs.writeFileSync(destPath, code, 'utf8');
        } else {
            results += pro(code);
            fs.writeFileSync(destPath, results, 'utf8');
        }

        if (options.postProcessing && is.function(options.postProcessing)) {
            options.postProcessing(destPath);
        }
    });
};

exports.is = is;
exports.syncfileutil = sfu;
exports.createManifest = require('./lib/manifest').createManifest;
