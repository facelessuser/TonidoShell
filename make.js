/*
    Build Tonido Shell
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

/*jshint node:true, strict:false */
var fs = require('fs'),
    build = require('./buildenv/buildenv'),
    exec = require('child_process').exec,
    sfu = require('./buildenv/buildenv').syncfileutil,
    path = require('path'),
    options = JSON.parse(fs.readFileSync('build-options.json', 'utf8').replace(/[ \t]*\/\/[^\r\n]*/g, '')),
    debug = false,
    version = '1.4.0.' + Math.floor(Math.random() * 99999),
    appName = 'tonidoshell',
    displayName = 'Tonido Shell',
    zipFile = appName + "_" + version + "_universal.zip",
    zipCommand = "zip -rq " + zipFile + " " + appName;

function parseArgs(args) {
    var options = [],
        opt;
    if (args.length > 2) {
        options = args.slice();
    } else {
        return;
    }
    while (options.length) {
        opt = options.shift();
        if ((/(-d|--debug)/).test(opt)) {
            debug = true;
        } else if ((/(-e|--experimental)/).test(opt)) {
            appName = 'devshell';
            displayName = 'Dev Shell';
        }
    }
    if (debug) {
        zipFile = appName + "_" + version + "_universal_debug.zip";
    } else {
        zipFile = appName + "_" + version + "_universal.zip";
    }
    zipCommand = "zip -rq " + zipFile + " " + appName;
}

function dataUriReplace(file, graphics, find, replace){
    var key, ext, data, filename, obj, srcExt;
    srcExt = path.extname(file).replace('.', '').toLowerCase();
    if ( srcExt === 'js') {
        obj = {};
        while (graphics.length > 0) {
            filename = graphics.shift();
            key = path.basename(filename);
            ext = path.extname(filename).replace('.', '').toLowerCase();
            try {
                data = fs.readFileSync(filename, 'base64');
                obj[key] = 'data:image/' + ext + ';base64,' + data;
            } catch (err) {
                console.error("ERROR - Cannot open: " + filename);
                console.log(err);
                process.exit(1);
            }
        }

        sfu.findReplace(file, find, replace + JSON.stringify(obj));
    } else if (srcExt === 'php') {
        obj = "array(";
        while (graphics.length > 0) {
            filename = graphics.shift();
            key = path.basename(filename);
            ext = path.extname(filename).replace('.', '').toLowerCase();
            try {
                data = fs.readFileSync(filename, 'base64');
                obj += '"' + key + '" => "' + 'data:image/' + ext + ';base64,' + data + '"';
                if (graphics.length) {
                    obj += ', ';
                } else {
                    obj += ');';
                }
            } catch (err) {
                console.error("ERROR - Cannot open: " + filename);
                console.log(err);
                process.exit(1);
            }
        }

        sfu.findReplace(file, find, replace + obj);
    }
}

parseArgs(process.argv);

console.log('Removing: ' + 'build/' + appName + ' build directory...');
build.removeFiles(sfu.glob([appName + '_*.zip', appName], './build'));

build.makeDirs(
    [
        'build/' + appName + '/background',
        'build/' + appName + '/modal/slideme',
        'build/' + appName + '/sessionbar',
        'build/' + appName + '/breadcrumbs',
        'build/' + appName + '/droppane',
        'build/' + appName + '/easyjs',
        'build/' + appName + '/horizmenu',
        'build/' + appName + '/phpshell',
        'build/' + appName + '/tonidoshell',
        'build/' + appName + '/document'
    ]
);

if (path.existsSync('ace')) {
    build.makeDirs('build/' + appName + '/ace');
}

build.lintJS(
    sfu.glob(
        '*.js',
        [
            'lib/easyjs',
            'lib/modal',
            'lib/horizmenu',
            'lib/modal/slideme',
            'lib/sessionbar',
            'lib/droppane',
            'lib/tonidoshell',
            'lib/breadcrumbs'
        ]
    ),
    options.jslint
);

build.compileJS(sfu.glob('*.js', 'lib/modal/slideme'), 'build/' + appName + '/modal/slideme', {"debug": debug, "preferences": options.uglifyjs});
build.compileJS(sfu.glob('*.js', 'lib/horizmenu'), 'build/' + appName + '/horizmenu', {"debug": debug, "preferences": options.uglifyjs});
build.compileJS(sfu.glob('*.js', 'lib/breadcrumbs'), 'build/' + appName + '/breadcrumbs', {"debug": debug, "preferences": options.uglifyjs});
build.compileJS(sfu.glob('*.js', 'lib/sessionbar'), 'build/' + appName + '/sessionbar', {"debug": debug, "preferences": options.uglifyjs});
build.compileJS(sfu.glob('*.js', 'lib/droppane'), 'build/' + appName + '/droppane', {"debug": debug, "preferences": options.uglifyjs});
build.compileJS(sfu.glob('*.js', 'lib/easyjs'), 'build/' + appName + '/easyjs', {"debug": debug, "preferences": options.uglifyjs});
build.compileJS(sfu.glob('*.js', 'lib/tonidoshell'), 'build/' + appName + '/tonidoshell', {"debug": debug, "preferences": options.uglifyjs});
build.compileJS(sfu.glob('*modal-*.js', 'lib/modal'), 'build/' + appName + '/modal', {"debug": debug, "preferences": options.uglifyjs});
build.compileJS(
    'lib/modal/modal.js',
    'build/' + appName + '/modal',
    {
        "debug": debug,
        "postProcessing": function (e) {
            dataUriReplace(
                e,
                sfu.glob(['*.png', '*.gif'], 'lib/modal/images/badges'),
                /(badges\s*:\s*)\{\}/,
                '$1'
            );
        },
        "preferences": options.uglifyjs
    }
);

build.compileCSS(sfu.glob('*.css', 'lib/modal'), 'build/' + appName + '/modal', {"debug": debug, "preferences": options.cleancss});
build.compileCSS(sfu.glob('*.css', 'lib/modal/slideme'), 'build/' + appName + '/modal/slideme', {"debug": debug, "preferences": options.cleancss});
build.compileCSS(sfu.glob('*.css', 'lib/horizmenu'), 'build/' + appName + '/horizmenu', {"debug": debug, "preferences": options.cleancss});
build.compileCSS(sfu.glob('*.css', 'lib/breadcrumbs'), 'build/' + appName + '/breadcrumbs', {"debug": debug, "preferences": options.cleancss});
build.compileCSS(sfu.glob('*.css', 'lib/sessionbar'), 'build/' + appName + '/sessionbar', {"debug": debug, "preferences": options.cleancss});
build.compileCSS(sfu.glob('*.css', 'lib/droppane'), 'build/' + appName + '/droppane', {"debug": debug, "preferences": options.cleancss});
build.compileCSS(sfu.glob('*.css', 'lib/easyjs'), 'build/' + appName + '/easyjs', {"debug": debug, "preferences": options.cleancss});
build.compileCSS(sfu.glob('*.css', 'lib/tonidoshell'), 'build/' + appName + '/tonidoshell', {"debug": debug, "preferences": options.cleancss});

build.copyFiles(sfu.glob(['index.php', 'command.php'], 'lib/tonidoshell'), 'build/' + appName);
build.copyFiles(sfu.glob(['pdoplus.php', 'dbdefaults.php'], 'lib/tonidoshell'), 'build/' + appName + '/tonidoshell');
build.copyFiles(
    [
        'phpshell/phpshell.php',
        'phpshell/AUTHORS',
        'phpshell/CHANGELOG',
        'phpshell/COPYING',
        'phpshell/README',
        'phpshell/SECURITY',
        'phpshell/INSTALL'
    ],
    'build/' + appName + '/phpshell'
);

dataUriReplace(
    'build/' + appName + '/index.php',
    sfu.glob('*.png', 'lib/tonidoshell/images'),
    /\/\*GRAPHICS\*\//,
    "$settings['ui'] = "
);

sfu.findReplace('build/' + appName + '/index.php', "VERSION", version);
sfu.findReplace('build/' + appName + '/index.php', "APP_DIR", appName);
sfu.findReplace('build/' + appName + '/command.php', "APP_DIR", appName);
sfu.findReplace('build/' + appName + '/command.php', "SESSION_NAME", appName.toUpperCase());

build.copyFiles(
    sfu.glob(['*.php', '*.html'], 'lib/modal'),
    'build/' + appName + '/modal'
);

if (path.existsSync('ace')) {
    build.copyFiles(sfu.glob('*.js', ((debug) ? 'ace/src' : 'ace/src-min')), 'build/' + appName + '/ace');
    build.copyFiles(['ace/LICENSE', 'ace/ChangeLog.txt', 'ace/README.md'], 'build/' + appName + '/ace');
}

build.copyFiles(
    sfu.glob('icon*.gif', 'lib/tonidoshell/images'),
    'build/' + appName
);
build.copyFiles(
    sfu.glob(['*.png', '*.gif'], 'lib/tonidoshell/images/background'),
    'build/' + appName + '/background'
);

build.copyFiles(
    [
        "README.md",
        "COPYING",
        "MANUAL",
        "CHANGELOG"
    ],
    'build/' + appName + '/document'
);

build.createManifest(
    'build/' + appName + '/manifest.xml',
    {
        "TonidoManifest" : {
            "Meta" : {
                "Name"              : appName,
                "DisplayName"       : displayName,
                "Vendor"            : "Isaac Muse",
                "Description"       : "A web terminal for Tonido",
                "AppURL"            : "dyn/" + appName + "/index.php",
                "Version"           : version
            },
            "Files" : "",
            "SharedLibraries" : ""
        }
    }
);

// node-zip is not too reliable with its compression
// Particularly, iconbg.gif never gets compressed right causing the zip not to decompress.
// It does work if STORE is used instead of DEFLATE, but then you don't have any compression.
// For now windows users can do a manual zip.
// if (!sfu.zip('tonidoshell', zipFile)) {
//     console.log(sfu.md5(zipFile));
// }

// Windows doesn't have a built in zip command line.
// Until I come up with a cross platform zipping method that works,
// Windows will have to manually zip the build folder
if (!(/^win/).test(process.platform)) {
    process.chdir('build');
    exec(
        zipCommand,
        function (error, stdout, stderr) {
            if (error !== null) {
                console.log('ERROR - Zip failure: ' + stderr);
            } else {
                console.log(sfu.md5(zipFile));
            }
        }
    );
}
