/*
    syncfileutil.js
    Some synchronous file system functions.
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

/*jshint node:true, strict: false */
var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    crypto = require('crypto'),
    is = require('./istype').is;

function GlobPattern(pattern) {
    var _obj = this,
        result = '',
        c;
    this._string = pattern;
    this._seqFound = false;
    this._seqSlash = false;

    this.parse = function () {
        for (_obj._idx = 0; c = pattern[_obj._idx]; _obj._idx++) {
            if (c === '\\') {
                _obj._idx++;
                result += _obj.evalChar(c, pattern[_obj._idx]);
            } else {
                result += _obj.evalChar('', c);
            }
        }
        return result;
    };

    this.evalChar = function (slash, c) {
        var count = slash.length,
            val = slash + ((count % 2) ? c : _obj.evalRegChar(c));
        return val;
    };

    this.evalRegChar = function (c) {
        if (c === '[' && !_obj._seqFound) {
            // Found start of sequence
            if (_obj._string[_obj._idx + 1] === '!') {
                // exclamation is a "not" if first char in sequence
                c += '^';
                _obj._idx++;
            }
            if ((/(\]|\-)/).test(_obj._string[_obj._idx + 1])) {
                // Allow closing bracket and minus if first in sequence (not including "!")
                c += '\\' + _obj._string[_obj._idx + 1];
                _obj._idx++;
            }
            _obj._seqSlash = false;
            _obj._seqFound = true;
            return c;
        } else if (_obj._seqFound) {
            // Evaluate sequence body
            if(!_obj._seqSlash && (/(\]|\-)/).test(c) && _obj._string[_obj._idx + 1] === ']') {
                // if a closing bracket or minus is the last char in the sequence, accept literal
                c = '\\' + c + _obj._string[_obj._idx + 1];
                _obj._idx++;
                _obj._seqFound = false;
                return c;
            } else if (c === '\\' && !_obj._seqSlash) {
                // next char is escaped
                _obj._seqSlash = true;
                return c;
            } else if ((/\]/).test(c) && !_obj._seqSlash) {
                _obj._seqFound = false;
                return c;
            } else if (_obj._seqSlash) {
                _obj._seqSlash = false;
                return c;
            } else {
                return c.replace(/[\[\{\}\(\)\*\+\?\.\,\^\$\|\#\s\!]/g, '\\$&');
            }
        } else {
            if (c === '?') {
                return '.';
            } else if (c === '*') {
                return '.*';
            } else {
                return c.replace(/[\-\]\[\{\}\(\)\*\+\?\.\,\^\$\|\#\s\!]/g, '\\$&');
            }
        }
    };
    return this;
}

function chunkFile(file) {
    var results = '',
        Buffer = require('buffer').Buffer,
        size, chunk, chunks, data, last, leftover;

    file = path.normalize(file),
    data = fs.openSync(file, 'r');
    size = fs.statSync(file).size;
    chunks = parseInt(size / 1024, 10);
    leftover = size % 1024;

    chunk = new Buffer(1024);
    last = new Buffer(leftover);
    while(chunks) {
        fs.readSync(data, chunk, 0, 1024);
        results += chunk.toString('binary');
        chunks -= 1;
    }
    if (leftover) {
        fs.readSync(data, last, 0, leftover);
        results += last.toString('binary');
    }
    return results;
}

function copy(file, dest, move) {
    var link;
    if (fs.lstatSync(file).isSymbolicLink()) {
        try {
            link = fs.readlinkSync(file);
            fs.symlinkSync(link, dest);
        } catch(e) {
            console.log('ERROR - Cannot copy symlink: ' + file);
            return true;
        }
    } else {
        try {
            fs.writeFileSync(dest, chunkFile(file), 'binary');
        } catch (e) {
            console.log('ERROR - Cannot copy file: ' + file);
            return true;
        }
    }
    if (move) {
        try {
            fs.unlinkSync(file);
        } catch (e) {
            console.log('ERROR - Cannot remove: ' + file);
            return true;
        }
    }
    return false;
}

/*Synchronous File System Utilities*/
exports.glob = function(patterns, filePaths) {
    var files = [];
    patterns = (is.array(patterns)) ? patterns : [patterns];
    filePaths = (is.array(filePaths)) ? filePaths : [filePaths];

    patterns.forEach( function (pattern) {
        // Work in progress
        var globPattern = new GlobPattern(pattern),
            re = new RegExp('^' + globPattern.parse() + '$', 'i');

        filePaths.forEach( function (folder) {
            folder = path.normalize(folder);
            try {
                fs.readdirSync(folder).forEach(function (item) {
                    if (re.test(item)) {
                        files.push(path.join(folder, item));
                    }
                });
            } catch(e) {
                return null;
            }
        });
    });
    return files;
};

exports.mkdir = function(dest, mode, flags) {
    var created = false,
        folder = path.normalize(dest),
        parent = path.dirname(folder),
        dir;
    flags = (is.undefined(flags)) ? '' : flags;
    mode = mode || 0777;
    if ((parent !== '' || parent !== '.') && !path.existsSync(parent) && (/(r)/i).test(flags)) {
        if (exports.mkdir(parent, mode, flags)) {
            return true;
        }
    }
    try {
        fs.mkdirSync(folder, mode);
    } catch(e) {
        console.log('ERROR - Could not create: ' + folder);
        return true;
    }
    return false;
};

exports.rm = function (fileName, flags) {
    var files, i, filePath;
    fileName = path.normalize(fileName);
    flags = (is.undefined(flags)) ? '' : flags;
    if ((/(r)/i).test(flags)) {
        try {
            files = fs.readdirSync(fileName);
        } catch(e) {
            return true;
        }
        while (files.length) {
            filePath = path.join(fileName, files.shift());
            if (fs.lstatSync(filePath).isDirectory()) {
                if (exports.rm(filePath, 'r')){
                    return true;
                }
            } else if (fs.lstatSync(filePath).isSymbolicLink()) {
                fs.unlinkSync(filePath);
            } else {
                fs.unlinkSync(filePath);
            }
        }
        fs.rmdirSync(fileName);
    } else {
        if (fs.lstatSync(fileName).isFile() || fs.lstatSync(fileName).isSymbolicLink()) {
            fs.unlinkSync(fileName);
        } else {
            return true;
        }
    }
    return false;
};

exports.cp = function (src, dest, flags) {
    var files, i, filePath, source, destination, file, link;
    src = path.normalize(src);
    dest = path.normalize(dest);
    if (path.existsSync(dest)) {
        if (fs.lstatSync(dest).isDirectory()) {
            dest = path.join(dest, path.basename(src));
        }
    }
    flags = (is.undefined(flags)) ? '' : flags;
    if ((/(r)/i).test(flags)) {
        try {
            files = fs.readdirSync(src);
        } catch(e) {
            console.log('ERROR - Cannot read directory: ' + src);
            return true;
        }
        try {
            fs.mkdirSync(dest, fs.lstatSync(src).mode);
        } catch(e) {
            console.log('ERROR - Directory already exists: ' + dest);
            return true;
        }
        while (files.length) {
            file = files.shift();
            filePath = path.join(src, file);

            if (fs.lstatSync(filePath).isDirectory()) {
                if (exports.cp(filePath, path.join(dest, file), 'r')){
                    return true;
                }
            } else if (copy(src, path.join(dest, file))) {
                return true;
            }
        }
    } else if (copy(src, path.join(dest, file))) {
        return true;
    }
    return false;
};

exports.mv = function (src, dest, flags) {
    var files, i, filePath, source, destination, file, link;
    src = path.normalize(src);
    dest = path.normalize(dest);
    if (path.existsSync(dest)) {
        if (fs.lstatSync(dest).isDirectory()) {
            dest = path.join(dest, path.basename(src));
        } else {
            return true;
        }
    }
    flags = (is.undefined(flags)) ? '' : flags;
    if ((/(r)/i).test(flags)) {
        try {
            files = fs.readdirSync(src);
        } catch(e) {
            console.log('ERROR - Cannot read directory: ' + src);
            return true;
        }
        try {
            fs.mkdirSync(dest, fs.lstatSync(source).mode);
        } catch(e) {
            console.log('ERROR - Directory already exists: ' + dest);
            return true;
        }
        while (files.length) {
            file = files.shift();
            filePath = path.join(src, file);

            if (fs.lstatSync(filePath).isDirectory()) {
                if (exports.mv(filePath, path.join(dest, file), 'r')){
                    return true;
                }
            } else if (copy(filePath, path.join(dest, file), true)) {
                return true;
            }
        }
        fs.rmdirSync(src);
    } else if (copy(src, path.join(dest, file), true)) {
        return true;
    }
    return false;
};

exports.md5 = function (filePath) {
    var results = '',
        file = path.normalize(filePath),
        md5sum = crypto.createHash('md5'),
        Buffer = require('buffer').Buffer,
        size, chunk, chunks, data, last, leftover;

    data = fs.openSync(file, 'r');
    size = fs.statSync(file).size;
    chunks = parseInt(size / 1024, 10);
    leftover = size % 1024;

    chunk = new Buffer(1024);
    last = new Buffer(leftover);
    while(chunks) {
        fs.readSync(data, chunk, 0, 1024);
        md5sum.update(chunk.toString('binary'));
        chunks -= 1;
    }
    if (leftover) {
        fs.readSync(data, last, 0, leftover);
        md5sum.update(last.toString('binary'));
    }
    return md5sum.digest('hex');
};

exports.findReplace = function(file, find, replace) {
    var target;
    try {
        target = fs.readFileSync(file, 'utf8');
    } catch (err) {
        console.error("ERROR - Cannot open: " + file);
        return true;
    }

    if (is.string(find)) {
        find = new RegExp(find, 'g');
    }
    if (is.regex(find)) {
        try {
            fs.writeFileSync(file, target.replace(find, replace));
        } catch(e) {
            console.error("ERROR - Cannot write: " + file);
            return true;
        }
    } else {
        console.log('ERROR - Bad find pattern!');
        return true;
    }
    return false;
};

// var zipFile = function (file, archive, name) {
//     try {
//         archive.file(name, chunkFile(file), {base64:false, binary: true});
//     } catch(e) {
//         console.log('ERROR - Cannot read file: ' + file);
//         return true;
//     }
//     return false;
// };

// var zipDir =  function (dir, archive, base) {
//     var files, file, filePath, folder;
//     folder = archive.folder(base);
//     try {
//         files = fs.readdirSync(dir);
//     } catch(e) {
//         console.log('ERROR - Cannot read directory: ' + dir);
//         return true;
//     }
//     while (files.length) {
//         file = files.shift();
//         filePath = path.join(dir, file);

//         if (fs.lstatSync(filePath).isDirectory()) {
//             if (zipDir(filePath, folder, file)) {
//                 return true;
//             }
//         }else if (!fs.lstatSync(filePath).isSymbolicLink() && fs.lstatSync(filePath).isFile()) {
//             if (zipFile(filePath, folder, file)) {
//                 return true;
//             }
//         }
//     }
//     return false;
// };

// exports.zip = function(src, dest) {
//     var archive = require('node-zip')(),
//     data, folder;
//     src = path.normalize(src);
//     dest = path.normalize(dest);
//     try {
//         if (!fs.lstatSync(src).isSymbolicLink() && fs.lstatSync(src).isFile()) {
//             if (zipFile(src, archive, path.basename(src))) {
//                 return true;
//             }
//         } else if (fs.lstatSync(src).isDirectory()) {
//             if (zipDir(src, archive, path.basename(src))) {
//                 return true;
//             }
//         }
//     } catch(e) {
//         console.log('ERROR - Failed to create zip: ' + dest);
//         return true;
//     }
//     try {
//         fs.writeFileSync(dest, archive.generate({base64:false, compression: 'DEFLATE'}), 'binary');
//     } catch(e) {
//         console.log('ERROR - Failed to write zip: ' + dest);
//     }
// };
