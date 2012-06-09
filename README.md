# About

<img src="http://dl.dropbox.com/u/342698/TonidoShell/tonidoshell_preview.png" border="0"/>

Tonido Shell is a web based faux terminal built around the core code of Martin Geisler's PHP Shell 2.1. PHP Shell has been heavily modified.  Tonidoshell also can be built with Ace Editor.

Tonido Shell currently works on the TonidoPlug v1-v2 and Tonido for Windows|Linux. Mac will be supported as soon as Tonido for Mac supports PHP.

The Tonido Shell project serves as a useful tool for Tonido enabled devices and as learning environment for me to play around and experiment with PHP and JavaScript.

Tonido Shell is available for free through the Tonido App Store, or it can be built and installed manually.

# Building
To build Tonido Shell, you must have [node.js](https://nodejs.org "node.js") installed.

After that you need the jshint, node-cssmin, and uglify-js modules installed.  You can install them from the root of the project by using npm.

```
npm install jshint
```

```
npm install cssmin
```

```
npm install uglify-js
```

After that you can build/package by using:

```
node make.js
```

You can also build the package without compression for debugging.

```
node make.js -d
```

If you have a stable version of Tonido Shell installed, but want to test an unstable version at the same time, you can install a develpment version side by side on your Tonido device by using the experimental option.  This will create a package called **devshell** that can be installed on the your Tonido device next to the **tonidoshell** package.

```
node make.js -e
```

Tonido Shell uses the unaltered Ace Editor.  In order to have Ace Editor included, you can clone https://github.com/ajaxorg/ace-builds into ```<project root>/ace```.

```
git clone https://github.com/ajaxorg/ace-builds ace
```

Alternatively, you grab the latest source from https://github.com/ajaxorg/ace and build it placing the build content into ```<project root>/ace```.

On Linux and Mac systems the plugin will automatically be zipped in a package that can be uploaded and unzipped on the Tonido device.  Windows does not contain a built in command line zip, and there are not yet any reliable node packages that zip 100% proper, so zipping on Windows must be done manual.  In the future if a reliable node zip package becomes available, or I settle on a Windows zip dependancy, this will change.

# Tonido Shell License
Copyright (C) 2010 Isaac Muse <isaacmuse@gmail.com>
Licensed under the GNU GPLv2.  See the file COPYING for details.

# Credits
PHP Shell by Martin Geisler licensed under the GNU GPLv2: http://phpshell.sourceforge.net/

Ace Editor by Ajax.org licensed under the Mozilla tri-license (MPL/GPL/LGPL): https://github.com/ajaxorg/ace
