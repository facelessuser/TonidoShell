/*
    tonidoshell.js
    useful functions to support TonidoShell
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

/*global modal: false, busy: false, prompt: false, textBox: false, info: false, textEdit: false,
         alert: false, warn: false, error: false, fileSelector: false, upload: false, download: false,
         shortcutMgr: false, colorPicker: false, aceEdit: false*/

/* Global Variables and their defaults*/
var appDir            = '',
    version           = '',
    last              = 0,
    response          = 1,
    workingDir        = '',
    openEditor        = false,
    useAceEditor      = true,
    scriptUp          = function(){},
    scriptPhpUp       = function(){},
    scriptDown        = function(){},
    startZipScript    = function(){},
    zipStatusScript   = function(){},
    zipDownloadScript = function(){},
    abandonZipScript  = function(){},
    colorWinTitle     = 'black',
    colorWinText      = 'white',
    colorTerm         = 'rgb(65,105,225)',
    colorTermText     = 'rgb(255,255,255)',
    colorTermAlpha    = '100',
    busyId            = '',
    busyMsg           = '',
    editContent       = '',
    editFormAction    = '',
    editFileName      = '',
    editFilePath      = '',
    rootFolder        = '',
    hostOS            = '',
    crumbSpeed        = 5,
    tabId             = '',
    session           = 0,
    manualScrollStep  = 30,
    scriptUrl         = '#',
    embedUrl          = '#',
    maxTab            = 2,
    shortcutList      = {},
    showcrumb         = false,
    showsession       = false,
    shortcutSettings  = {
        'crumbbar'   : {'name' : 'crumbbar',   'ctrl' : true, 'alt' : false, 'shift' : true,  'meta' : false, 'key' : 'b'},
        'sessionbar' : {'name' : 'sessionbar', 'ctrl' : true, 'alt' : false, 'shift' : true,  'meta' : false, 'key' : 's'},
        'focusinput' : {'name' : 'focusinput', 'ctrl' : true, 'alt' : false, 'shift' : true,  'meta' : false, 'key' : 'i'},
        'shellmarks' : {'name' : 'shellmarks', 'ctrl' : true, 'alt' : false, 'shift' : true,  'meta' : false, 'key' : 'm'},
        'scrollup'   : {'name' : 'shellmarks', 'ctrl' : true, 'alt' : false, 'shift' : false, 'meta' : false, 'key' : 'Up'},
        'scrolldown' : {'name' : 'shellmarks', 'ctrl' : true, 'alt' : false, 'shift' : false, 'meta' : false, 'key' : 'Down'}
    },

ts = (function ($){
    "use strict";

    /*INCLUDE_CSS("tonidoshell","tonidoshell.css")*/

    var ts = {
        /*Initialize*/
        init : function () {
            /*Error Handler*/
            modal.loadDialog('standard');
            error.defaultMsg =
                'Oops! Looks like the code monkeys have been goofing off again.<br>' +
                'Please refer to this error log when communicating with the developer.<br>' +
                'The developer can be reached in the <a href="http://tonido.com/forum">Tonido Forums</a>' +
                ' or by <a href="mailto:isaacmuse@gmail.com">email</a>.';
            window.defaultOnError = window.onerror; // store default handler
            window.onerror        = error.handler;  // assign own handler

            //Configure and size terminal window
            $("#output").css({'overflowY': 'auto', 'overflowX' : 'hidden'});
            $(document.shell).attr("autocomplete", "off");
            $("#mainWindow").css('display', "block");
            $("#command").attr('spellcheck', false);
            // Configure terminal toolbars
            $('.menu').menu();
            tabId = $("#tabbar").attr("className", "tabbar").sessionbar().add(
                maxTab,
                session,
                ts.switchSession
            ).attr('tabId');
            $("#crumbbar").attr("className", "crumbbar").crumbbar().add(
                function (path) {ts.selectDir(path);}, crumbSpeed
            );
            if (showsession) ts.toggleBar("tabbar");
            if (showcrumb) ts.toggleBar("crumbbar");
            ts.resize();

            /*Load modules and then retrieve session*/
            busyId = busy("Loading modules...", {'titleColor' : colorWinTitle, 'titleTextColor' : colorWinText});
            $('#modalBadge' + busyId).css('display', 'none');
            $('#modalText' + busyId).css('margin-left', '20px');
            modal.show(busyId, null, function () {
                    // Load other modules
                    ts.loadModules();
                    $('#modalBadge' + busyId).css('display', 'block');
                    $('#modalText' + busyId).css('margin-left', '54px');
                    ts.focusInput();
                    ts.sendCommand('Retrieving session...');
                }
            );
        },

        initFileTxCmds : function () {
            if (hostOS == "win") {
                scriptUp          = function (path, expand) {
                    return '/upload?appname=explorer&path=' + encodeURIComponent(path.replace(/\//g, '\\')) + '/&expandzip=' + expand;
                };
                scriptPhpUp       = function (path, expand) {
                    return 'modal/modalfile.php?modaluppath=' + encodeURIComponent(path.replace(/\//g, '\\')) + '&expandzip=' + expand;
                };
                scriptDown        = function (path, file) {
                    return '/core/downloadfile?disposition=attachment&filepath=' +
                        encodeURIComponent(path.replace(/\//g, '\\')) + '\\' + encodeURIComponent(file) +
                        '&filename=' + encodeURIComponent(file);
                };
                startZipScript    = function (path, time) {
                    return '/core/startzip?path=' + encodeURIComponent(path.replace(/\//g, '\\')) + '&time=' + time;
                };
            } else {
                scriptUp          = function (path, expand) {
                    return '/upload?appname=explorer&path=' + encodeURIComponent(path) + '/&expandzip=' + expand;
                };
                scriptPhpUp       = function (path, expand) {
                    return 'modal/modalfile.php?modaluppath=' + encodeURIComponent(path) + '&expandzip=' + expand;
                };
                scriptDown        = function (path, file) {
                    return '/core/downloadfile?disposition=attachment&filepath=' + encodeURIComponent(path) + '/' +
                    encodeURIComponent(file) + '&filename=' + encodeURIComponent(file);
                };
                startZipScript    = function (path, time) {
                    return '/core/startzip?path=' + encodeURIComponent(path) + '&time=' + time;
                };
            }
            zipStatusScript   = function (zipId, time) {
                return '/core/zipstatus?id=' + zipId + '&time=' + time;
            };
            zipDownloadScript = function (zipId) {
                return '/core/downloadaszip?id=' + zipId;
            };
            abandonZipScript  = function (zipId, time) {
                return '/core/abandonzip?id=' + zipId + '&time=' + time;
            };
        },

        /*Load Modules*/
        loadModules : function () {
            var loadModule = function (module, fn) {
                $.require(module + "/" + module + ".js").done(fn);
            };

            modal.loadDialog('file', 'edit', 'color', 'download', 'upload', 'shortcuts');
            if (useAceEditor) modal.loadDialog('ace');
            ts.addShortcuts();
            ts.initFileTxCmds();

            loadModule(
                'droppane',
                function () {
                    $.droppane((
                        ($(document).isEmbedded()) ?
                            '<a href="javascript:void(0)" onclick="window.top.location = \'' + scriptUrl + '\';" style="color:white;text-decoration:none;font-weight:bold;">Show Full Screen</a>' :
                            '<a href="' + embedUrl + '" style="color:white;text-decoration:none;font-weight:bold;">Show Tonido Interface</a>'
                    ));
                }
            );
        },

        /*resize*/
        resize : function () {
          var bodyMargin   = 26,
              winBevel     = 8,
              termInset    = 4,
              barHeight    = 24,
              minWinSize   = 100,
              fudgeOffeset = 180,        //uncalculated height offset value; trial and error
              frameSize    = 99.5 + '%', //100% didn't work; trial and error gave 99.5%
              frame        = $(document).isEmbedded(),
              winSize, pageHeight, pageWidth, crumbOffset, tabOffset, term, size, outSize;

          if (frame) frame.style.width = frameSize;
          winSize         = $(window).size();
          pageHeight      = winSize.y;
          pageWidth       = winSize.x;
          crumbOffset     = ($("#crumbbar").css('display') === "block") ? barHeight : 0;
          tabOffset       = ($("#tabbar").css('display')   === "block") ? barHeight : 0;
          term            = $("#terminal")[0];
          size            = parseInt(pageHeight - crumbOffset - tabOffset - fudgeOffeset, 10);
          outSize         = (size > minWinSize) ? size : minWinSize;

          $("#mainWindow").css('width' , (pageWidth - bodyMargin) + 'px');
          $("#output").css({
                'height' : outSize + 'px',
                'width' : (pageWidth - bodyMargin - winBevel - termInset - 6) + 'px', //6: uncalculated fudge factor with offset; trial and error
                'visibility' : 'visible'
          });
          $("#termSpacer").css(
                'height',
                ($('#outputWrapper').attr('offsetHeight') + $("#commandLine").attr('offsetHeight')) + 'px'
          );
          ts.resizeCrumb();
          ts.resizeTab();
          $('#termOverlay').css({
                'width' : (pageWidth - bodyMargin - winBevel - termInset) + 'px',
                'top'   : $(term).absPos('y') + "px",
                'left'  : $(term).absPos('x') + "px"
          });
        },

        resizeTab : function () {
            var ez = $("#tabbar"),
                winBevel  = 8;

            if (ez.sessionbar) {
                ez.sessionbar().resize(parseInt($("#mainWindow").css('width'), 10) - winBevel);
            }
        },

        resizeCrumb : function () {
            var ez = $("#crumbbar"),
                winBevel  = 8;

            if (ez.crumbbar) {
                ez.crumbbar().resize(parseInt($("#mainWindow").css('width'), 10) - winBevel);
            }
        },

        /*scroll*/
        scrollBottom : function () {
            var text = $("#output")[0];

            if (text.scrollTop == null) text.scrollTop = 0;
            $(text).animate({
                'target': 'scrollTop',
                'start' : ((text.scrollTop == null) ? 0 : text.scrollTop),
                'end'   : (text.scrollHeight - text.offsetHeight)
            }, 500);
        },

        scrollUp : function() {
            $("#output")[0].scrollTop -= manualScrollStep;
        },

        scrollDown : function() {
            $("#output")[0].scrollTop += manualScrollStep;
        },

        /*Show/Hide elements*/
        toggleBar : function (type) {
            var ez = $("#" + type);
            if (ez.css("display") === "none") ez.css("display", "block");
            else                              ez.css("display", "none");
            ts.resize();
        },

        /*Shortcuts*/
        setShortcutSettings : function (sc) {
            $("#shortcutcrumb").attr('value',      sc[0]);
            $("#shortcutsession").attr('value',    sc[1]);
            $("#shortcutfocus").attr('value',      sc[2]);
            $("#shortcutshellmark").attr('value',  sc[3]);
            $("#shortcutscrollup").attr('value',   sc[4]);
            $("#shortcutscrolldown").attr('value', sc[5]);
            $("#settings").attr('value', "update");
            ts.ignoreCommand();
            ts.submitForm ('Setting shortcuts...');
        },

        showShortcutMgr : function () {
            shortcutMgr(
                'Set shortcuts.',
                {
                    'titleColor'     : colorWinTitle,
                    'titleTextColor' : colorWinText,
                    'shortcuts'      : shortcutList
                },
                function () {ts.setShortcutSettings(modal.returns);}
            );
        },

        addShortcuts : function () {
            var num;
            shortcutList = [
                  {'id' : 'crumbbar',   'display' : 'Hide/show breadcrumbs bar'},
                  {'id' : 'sessionbar', 'display' : 'Hide/show sessions bar'},
                  {'id' : 'focusinput', 'display' : 'Focus on command line'},
                  {'id' : 'shellmarks', 'display' : 'Insert shellmarks'},
                  {'id' : 'scrollup',   'display' : 'Scroll output up'},
                  {'id' : 'scrolldown', 'display' : 'Scroll output down'}
            ];
            $(document).addShortcut([
                {
                    'name'  : 'crumbbar',
                    'key'   : shortcutSettings.crumbbar.key,
                    'halt'  : true,
                    'repeat': false,
                    'fn'    : function (e) {ts.toggleBar('crumbbar');},
                    'ctrl'  : shortcutSettings.crumbbar.ctrl,
                    'shift' : shortcutSettings.crumbbar.shift,
                    'alt'   : shortcutSettings.crumbbar.alt,
                    'meta'  : shortcutSettings.crumbbar.meta
                },
                {
                    'name'  : 'sessionbar',
                    'key'   : shortcutSettings.sessionbar.key,
                    'halt'  : true,
                    'repeat': false,
                    'fn'    : function (e) {ts.toggleBar('tabbar');},
                    'ctrl'  : shortcutSettings.sessionbar.ctrl,
                    'shift' : shortcutSettings.sessionbar.shift,
                    'alt'   : shortcutSettings.sessionbar.alt,
                    'meta'  : shortcutSettings.sessionbar.meta
                },
                {
                    'name'  : 'focusinput',
                    'key'   : shortcutSettings.focusinput.key,
                    'halt'  : true,
                    'repeat': false,
                    'fn'    : function (e) {ts.focusInput();},
                    'ctrl'  : shortcutSettings.focusinput.ctrl,
                    'shift' : shortcutSettings.focusinput.shift,
                    'alt'   : shortcutSettings.focusinput.alt,
                    'meta'  : shortcutSettings.focusinput.meta
                },
                {
                    'name'  : 'scrollup',
                    'key'   : shortcutSettings.scrollup.key,
                    'halt'  : true,
                    'ctrl'  : shortcutSettings.scrollup.ctrl,
                    'shift' : shortcutSettings.scrollup.shift,
                    'alt'   : shortcutSettings.scrollup.alt,
                    'meta'  : shortcutSettings.scrollup.meta,
                    'fn'    : function (e) {ts.scrollUp();}
                },
                {
                    'name'  : 'scrolldown',
                    'key'   : shortcutSettings.scrolldown.key,
                    'halt'  : true,
                    'ctrl'  : shortcutSettings.scrolldown.ctrl,
                    'shift' : shortcutSettings.scrolldown.shift,
                    'alt'   : shortcutSettings.scrolldown.alt,
                    'meta'  : shortcutSettings.scrolldown.meta,
                    'fn'    : function (e) {ts.scrollDown();}
                }
            ]);
            $("#command").addShortcut([
                {
                    'name'  : 'shellmarks',
                    'key'   : shortcutSettings.shellmarks.key,
                    'halt'  : true,
                    'repeat': false,
                    'fn'    : function (e) {ts.insertShellmark();},
                    'ctrl'  : shortcutSettings.shellmarks.ctrl,
                    'shift' : shortcutSettings.shellmarks.shift,
                    'alt'   : shortcutSettings.shellmarks.alt,
                    'meta'  : shortcutSettings.shellmarks.meta
                },
                {
                    'name'  : 'historynext',
                    'key'   : 'Up',
                    'halt'  : true,
                    'fn'    : function (e) {ts.cmdLine.historyFlip(1);}
                },
                {
                    'name'  : 'historyprev',
                    'key'   : 'Down',
                    'halt'  : true,
                    'fn'    : function (e) {ts.cmdLine.historyFlip(0);}
                },
                {
                    'name'  : 'submit',
                    'key'   : 'Enter',
                    'halt'  : true,
                    'repeat': false,
                    'fn'    : function (e) {ts.sendCommand(busyMsg);}
                }
            ]);
            for (num = 1; num <= maxTab; num++) {
                (function (val) {
                    $(document).addShortcut(
                        {
                            'name'  : 'session' + val,
                            'key'   : val.toString(),
                            'halt'  : true,
                            'fn'    : function (e) {ts.selectSessionTab(val);},
                            'ctrl'  : true,
                            'shift' : true
                        }
                   );
                })(num);
            }
        },

        /*Command Line and Interface*/
        cmdLine : {
            currentLine : 0,
            history     : null,

            historyFlip : function (dir) {
                if ((dir && ts.cmdLine.currentLine != ts.cmdLine.history.length) ||
                    (!dir && ts.cmdLine.currentLine !== 0)) {
                    var handle = $("#command");
                    ts.cmdLine.history[ts.cmdLine.currentLine] = handle.attr('value');
                    if (dir == 1) ts.cmdLine.currentLine++;
                    else          ts.cmdLine.currentLine--;
                    handle.attr('value', ts.cmdLine.history[ts.cmdLine.currentLine]);
                }
            }
        },

        submitForm : function (text) {
            if (!$.isUndef(text)) modal.changeText(text, busyId);
            document.shell.onsubmit();
            document.shell.submit();
        },

        selectDir : function (path) {
            $("#command").attr('value' , 'cd "' + path + '"');
            ts.sendCommand ('Changing directory...');
        },

        insertShellmark : function() {
            $("#command").cursor('<sm: >', -1);
        },

        focusInput : function () {
            $("#command")[0].focus();
        },

        ignoreCommand : function (){
            $("#command").attr('value', '');
        },

        sendCommand : function (msg) {
            modal.show(busyId, msg, function (){ts.executeCommand();});
        },

        setExport : function() {
            var textContent = "<pre>"+ $("#output").attr('innerHTML') + "</pre>",
                wnd         = window.open('', '_blank', "status=1,toolbar=0,scrollbars=1"),
                doc         = wnd.document;
            doc.write(textContent);
            doc.close();
            wnd.focus();
        },

        executeCommand : function () {
            var cmdInput   = $("#command")[0],
                command    = encodeURIComponent(cmdInput.value),
                parameters = ["command=" + command, "response=" + response, "session=" + session],
                complete;
            if ($("#output").attr('innerText') == null) parameters.push("encode=1");
            cmdInput.value = '';
            complete = function (e){
                var jsondata = JSON.parse(e),
                    el       = $("#output")[0],
                    crumb;
                if (jsondata.status === 'Success') {
                    if ( el.innerText ) el.innerText = jsondata.output;
                    else el.innerHTML = jsondata.output;
                    $("#userprompt").attr('innerHTML', jsondata.cmdPrompt);
                    $("#tshellTitle").attr('innerHTML', jsondata.winTitle);
                    workingDir   = jsondata.workingDir;
                    appDir       = jsondata.appDir;
                    rootFolder   = jsondata.rootFolder;
                    session      = jsondata.session;
                    ts.cmdLine.currentLine = 0;
                    ts.cmdLine.history     = jsondata.historyJS;
                    $("#crumbbar").crumbbar().update(workingDir, rootFolder);
                    ts.resizeCrumb();
                    switch (jsondata.command) {
                        case 'edit':
                            ts.editFile();
                            break;
                        case 'edit new':
                            ts.editNewFile();
                            break;
                        case 'edit new file':
                            if (jsondata.returns !== '') ts.editNewFile(jsondata.returns);
                            break;
                        case 'edit file':
                            if (jsondata.returns !== '') ts.setEditFile(jsondata.returns);
                            break;
                        case 'upload':
                            ts.uploadFile();
                            break;
                        case 'upload php':
                            ts.uploadFilePhp();
                            break;
                        case 'download':
                            ts.downloadFiles();
                            break;
                        case 'download files':
                            if (jsondata.returns.type === 'file') {
                                ts.downloadFileDirect(jsondata.returns.path);
                            } else if (jsondata.returns.type === 'folder') {
                                ts.downloadFolderDirect(jsondata.returns.path);
                            }
                            break;
                        case 'exit':
                            break;
                        case 'debug js':
                            modal.hide(busyId);
                            //bananas(); //Throw error to test error handler
                            break;
                        default: break;
                    }
                } else {
                    error('Ajax', jsondata.error);
                }
            };
            $.ajax({
                'url' : "command.php",
                'type': "POST",
                'parameters' : parameters,
                'exit' : function (){
                    setTimeout(function () {
                        modal.hide(busyId);
                        ts.scrollBottom();
                    }, 500);
                },
                'fail' : function (){
                    warn("An error has occured making the request", {
                        'titleText'      : 'Error',
                        'titleColor'     : colorWinTitle,
                        'titleTextColor' : colorWinText});
                },
                'complete' : complete,
                'statusCode' : {500 : complete}
            });
        },

        /*Sessions*/
        setSessions : function () {
            prompt(
                'Select number of sessions.',
                {
                    'titleColor'     : colorWinTitle,
                    'titleTextColor' : colorWinText,
                    'defaults'        : maxTab,
                    'type'           : 'list',
                    'list'           : [
                        {'display' : '1 Session',  'value' : 1},
                        {'display' : '2 Sessions', 'value' : 2},
                        {'display' : '3 Sessions', 'value' : 3},
                        {'display' : '4 Sessions', 'value' : 4},
                        {'display' : '5 Sessions', 'value' : 5},
                        {'display' : '6 Sessions', 'value' : 6},
                        {'display' : '7 Sessions', 'value' : 7},
                        {'display' : '8 Sessions', 'value' : 8},
                        {'display' : '9 Sessions', 'value' : 9}
                    ]
                },
                function (){ts.setSettings('maxtab', modal.returns);}
            );
        },

        selectSessionTab : function (number) {
            $('#tab' + number + '_' + tabId)[0].onclick();
        },

        switchSession : function (number) {
            session = number;
            ts.ignoreCommand();
            ts.sendCommand("Switching to session " + (session + 1) + '...');
        },

        killSession : function () {
            $("#command").attr('value', 'exit');
            ts.sendCommand ('Terminating session...');
        },

        /*Download*/
        downloadFileDirect : function (file) {
            download.file(
                {
                    'titleColor'     : colorWinTitle,
                    'titleTextColor' : colorWinText,
                    'downloadFile'   : scriptDown,
                    'path'           : file
                }
            );
        },

        downloadFolderDirect : function (folder) {
            download.folder(
                {
                    'titleColor'     : colorWinTitle,
                    'titleTextColor' : colorWinText,
                    'downloadDir'    : folder.toFwdSlash(),
                    'startZip'       : startZipScript,
                    'zipStatus'      : zipStatusScript,
                    'zipDownload'    : zipDownloadScript,
                    'abandonZip'     : abandonZipScript
                }
            );
        },

        downloadFiles : function () {
            download(
                'Select to download',
                {
                    'titleColor'     : colorWinTitle,
                    'titleTextColor' : colorWinText,
                    'downloadDir'    : workingDir,
                    'script'         : scriptDown,
                    'startZip'       : startZipScript,
                    'zipStatus'      : zipStatusScript,
                    'zipDownload'    : zipDownloadScript,
                    'abandonZip'     : abandonZipScript
                }
            );
        },

        /*upload*/
        uploadFile : function () {
            upload(
                'Select file(s) to upload',
                {
                    'titleColor'     : colorWinTitle,
                    'titleTextColor' : colorWinText,
                    'uploadDir'      : workingDir,
                    'script'         : scriptUp
                }
            );
        },

        uploadFilePhp : function () {
            upload(
                'Select file(s) to upload',
                {
                    'titleColor'     : colorWinTitle,
                    'titleTextColor' : colorWinText,
                    'uploadDir'      : workingDir,
                    'script'         : scriptPhpUp
                }
            );
        },

        /*File editing and viewing*/
        setEditFile : function(file) {
            if (file == null) return;
            ((useAceEditor) ? aceEdit : textEdit)(
                '',
                {
                    'titleText'      : 'Edit: ' + file.basename(),
                    'titleColor'     : colorWinTitle,
                    'titleTextColor' : colorWinText,
                    'root'           : rootFolder,
                    'filepath'       : file
                }
            );
        },

        editFile : function () {
            fileSelector(
                'Select file to edit',
                {
                    'titleColor'     : colorWinTitle,
                    'titleTextColor' : colorWinText,
                    'root'           : rootFolder,
                    'folder'         : workingDir,
                    'selectFiles'    : true,
                    'getDrives'      : true
                },
                function () {ts.setEditFile(modal.returns);}
            );
        },

        editNewFile : function (file){
            var filePath = (file == null) ? workingDir + '/Untitled.txt' : file.toFwdSlash(),
                title    = filePath.basename();
            ((useAceEditor) ? aceEdit : textEdit)(
                '',
                {
                    'titleText' : 'Edit: ' + title,
                    'filepath'  : filePath,
                    'root'      : rootFolder,
                    'formAction': editFormAction,
                    'newfile'   : true
                }
            );
        },

        catFile : function (path, file) {
            $("#command").attr('value', ((hostOS == 'win') ?
                'type "' + path + '\\' + file + '"' :
                'cat "' + path + '/' + file + '"'
            ));
            ts.sendCommand ('Reading file...');
        },

        /*UI management*/
        pickBackground : function (dir) {
            fileSelector(
                'Select background',
                {
                    'titleColor'     : colorWinTitle,
                    'titleTextColor' : colorWinText,
                    'root'           : dir,
                    'folder'         : dir,
                    'getFolders'     : false,
                    'selectFiles'    : true,
                    'getDrives'      : false
                },
                function () {ts.setSettings('background', modal.returns);}
            );
        },

        chooseColor : function (text, choice, defColor, defAlpha) {
            var alphaEnable = (choice === 'termcolor'),
                fn          = (alphaEnable) ?
                    function (e) {ts.setSettings(choice, modal.returns.color, modal.returns.alpha);} :
                    function (e) {ts.setSettings(choice, modal.returns.color);};
            colorPicker(
                text,
                {
                    'titleColor'     : colorWinTitle,
                    'titleTextColor' : colorWinText,
                    'defaultColor'   : defColor,
                    'defaultAlpha'   : (($.isUndef(defAlpha) || !alphaEnable) ? '100' : defAlpha),
                    'alpha'          : ((alphaEnable) ? true : false)
                },
                fn
            );
        },

        /*general settings*/
        confirmChoice : function (text, choice, value) {
            confirm(
                text,
                {
                    'titleColor'     : colorWinTitle,
                    'titleTextColor' : colorWinText
                },
                function (e) {ts.setSettings(choice, value);}
            );
        },

        setSettings : function (setting, param1, param2) {
            if (param1 == null) return;
            var text = 'Processing...';
            switch(setting) {
                case 'background' :
                    param1 = param1.basename();
                    text = 'Changing background...';
                    break;
                case 'response' :
                    text = 'Changing response setting...';
                    break;
                case 'showcrumb' :
                    text = 'Changing breadcrumb bar setting...';
                  break;
                case 'showsession' :
                    text = 'Changing session bar setting...';
                    break;
                case 'maxtab' :
                    text = 'Changing max sessions...';
                    break;
                case 'titlecolor' :
                    text = 'Setting title color...';
                    break;
                case 'titletextcolor' :
                    text = 'Setting title text color...';
                  break;
                case 'termtextcolor' :
                    text = 'Setting terminal text color...';
                    break;
                case 'textshadow' :
                    text = 'Changing text drop shadow settings...';
                    break;
                case 'useaceeditor' :
                    text = "Changing default editor...";
                    break;
                case 'backupacesettings' :
                    text = "Backing up Ace default settings...";
                    break;
                case 'restoreacesettings' :
                    text = "Restoring Ace default settings...";
                    break;
                case 'termcolor' :
                    if (param2) $("#termalpha").attr('value', param2);
                    text = 'Setting terminal color...';
                    break;
                default :
                    return;
            }
            $("#" + setting).attr('value', param1);
            $("#settings").attr('value', "update");
            ts.ignoreCommand();
            ts.submitForm (text);
        },

        /*about*/
        showAbout : function () {
            info(
                '<b>' + version + '</b><br>' +
                'Tonido Shell is wrapped around a heavily modified PHP Shell 2.1 core.<br>' +
                'The Tonido Shell project has since taken on a life of its own<br>' +
                'and brings new features and enhancments found only for Tonido.<br>' +
                'Tonido Shell is brought to you by: <a href="mailto:isaacmuse@gmail.com">Isaac Muse</a>.<br><br>' +
                'If you enjoy this application, consider donating to support future work.<br>' +
                '<form action="https://www.paypal.com/cgi-bin/webscr" method="post">' +
                    '<input type="hidden" name="cmd" value="_s-xclick">' +
                    '<input type="hidden" name="encrypted" value="' +
                        '-----BEGIN PKCS7-----' +
                        'MIIHRwYJKoZIhvcNAQcEoIIHODCCBzQCAQExggEwMIIBLAIBADCBlDCBjjELMAkGA1UEBhMCVVMxCzAJBgNVBAgTAkNBMRYw' +
                        'FAYDVQQHEw1Nb3VudGFpbiBWaWV3MRQwEgYDVQQKEwtQYXlQYWwgSW5jLjETMBEGA1UECxQKbGl2ZV9jZXJ0czERMA8GA1UE' +
                        'AxQIbGl2ZV9hcGkxHDAaBgkqhkiG9w0BCQEWDXJlQHBheXBhbC5jb20CAQAwDQYJKoZIhvcNAQEBBQAEgYAFvwQS7YscKCkq' +
                        'Ilna9ZhgljUuiYWnxAA/fEg/z40eG1ycJ3nfsKfMdyqIyzSQ5h/H/JTezqSz8HEoaNTfZGR6Wu2KwugRoMmKcSKD0Tc4dP8H' +
                        'Yup4E2t3qxfjgGTHdxCUCRAbmn5CQ+98zqafFE8YWvWINmiVBA6ll5cUiawUnDELMAkGBSsOAwIaBQAwgcQGCSqGSIb3DQEH' +
                        'ATAUBggqhkiG9w0DBwQIkhxpm2OYkGeAgaBYzbP8O3+Wzj3sz+LepM5O4V2ip2UtUDyI9jY7GlIBrpNfc8embaebjbdaTm7k' +
                        '+4bXIpfSN0SZ5WPWbfggJNNV6v8fkW1z3xxKC86Mqitn+/M/H4ysXsMcezG0RWQ1w3axVoISzK7aJ5k7djoY8NOgxd0QYaeJ' +
                        'dCavs0na4k/WwTACiwuwk+6gpEQHrnyeT3cvY4hggvMpUd76IxIiShMZoIIDhzCCA4MwggLsoAMCAQICAQAwDQYJKoZIhvcN' +
                        'AQEFBQAwgY4xCzAJBgNVBAYTAlVTMQswCQYDVQQIEwJDQTEWMBQGA1UEBxMNTW91bnRhaW4gVmlldzEUMBIGA1UEChMLUGF5' +
                        'UGFsIEluYy4xEzARBgNVBAsUCmxpdmVfY2VydHMxETAPBgNVBAMUCGxpdmVfYXBpMRwwGgYJKoZIhvcNAQkBFg1yZUBwYXlw' +
                        'YWwuY29tMB4XDTA0MDIxMzEwMTMxNVoXDTM1MDIxMzEwMTMxNVowgY4xCzAJBgNVBAYTAlVTMQswCQYDVQQIEwJDQTEWMBQG' +
                        'A1UEBxMNTW91bnRhaW4gVmlldzEUMBIGA1UEChMLUGF5UGFsIEluYy4xEzARBgNVBAsUCmxpdmVfY2VydHMxETAPBgNVBAMU' +
                        'CGxpdmVfYXBpMRwwGgYJKoZIhvcNAQkBFg1yZUBwYXlwYWwuY29tMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDBR07d' +
                        '/ETMS1ycjtkpkvjXZe9k+6CieLuLsPumsJ7QC1odNz3sJiCbs2wC0nLE0uLGaEtXynIgRqIddYCHx88pb5HTXv4SZeuv0Rqq' +
                        '4+axW9PLAAATU8w04qqjaSXgbGLP3NmohqM6bV9kZZwZLR/klDaQGo1u9uDb9lr4Yn+rBQIDAQABo4HuMIHrMB0GA1UdDgQW' +
                        'BBSWn3y7xm8XvVk/UtcKG+wQ1mSUazCBuwYDVR0jBIGzMIGwgBSWn3y7xm8XvVk/UtcKG+wQ1mSUa6GBlKSBkTCBjjELMAkG' +
                        'A1UEBhMCVVMxCzAJBgNVBAgTAkNBMRYwFAYDVQQHEw1Nb3VudGFpbiBWaWV3MRQwEgYDVQQKEwtQYXlQYWwgSW5jLjETMBEG' +
                        'A1UECxQKbGl2ZV9jZXJ0czERMA8GA1UEAxQIbGl2ZV9hcGkxHDAaBgkqhkiG9w0BCQEWDXJlQHBheXBhbC5jb22CAQAwDAYD' +
                        'VR0TBAUwAwEB/zANBgkqhkiG9w0BAQUFAAOBgQCBXzpWmoBa5e9fo6ujionW1hUhPkOBakTr3YCDjbYfvJEiv/2P+IobhOGJ' +
                        'r85+XHhN0v4gUkEDI8r2/rNk1m0GA8HKddvTjyGw/XqXa+LSTlDYkqI8OwR8GEYj4efEtcRpRYBxV8KxAW93YDWzFGvruKnn' +
                        'LbDAF6VR5w/cCMn5hzGCAZowggGWAgEBMIGUMIGOMQswCQYDVQQGEwJVUzELMAkGA1UECBMCQ0ExFjAUBgNVBAcTDU1vdW50' +
                        'YWluIFZpZXcxFDASBgNVBAoTC1BheVBhbCBJbmMuMRMwEQYDVQQLFApsaXZlX2NlcnRzMREwDwYDVQQDFAhsaXZlX2FwaTEc' +
                        'MBoGCSqGSIb3DQEJARYNcmVAcGF5cGFsLmNvbQIBADAJBgUrDgMCGgUAoF0wGAYJKoZIhvcNAQkDMQsGCSqGSIb3DQEHATAc' +
                        'BgkqhkiG9w0BCQUxDxcNMTAxMjIxMDMyNTExWjAjBgkqhkiG9w0BCQQxFgQUnVzcd1z7QPp8IdMcWC+7i2+gZZ4wDQYJKoZI' +
                        'hvcNAQEBBQAEgYBYr093tYltym2SeNquwiJcBUzhNMZG+wc+/7rSfCrnzhN6tH+4x6l0oyDu9IGIuHQCkWLDNg8RdROC12MW' +
                        'ntQfRF89KnkOnS01P0ZnwWTFi+D2oFDTtJTuH/4m5Kn20U93zlfms0Ch9EKsEXIXBbnHhlBUfYE0tgJ3ZlbprsAiJw==' +
                        '-----END PKCS7-----' +
                    '">' +
                    '<input type="image" ' +
                            'src="https://www.paypal.com/en_US/i/btn/btn_donateCC_LG.gif" ' +
                            'border="0" name="submit" alt="PayPal - The safer, easier way to pay online!">' +
                    '<img alt="" border="0" src="https://www.paypal.com/en_US/i/scr/pixel.gif" width="1" height="1">' +
                '</form><br><br>' +
                'Tonido Shell is released under the GPLv2<br>' +
                'The PHP Shell project can also be found at: <a href="http://phpshell.sourceforge.net/">http://phpshell.sourceforge.net/</a>.<br>' +
                'Tonido Shell uses the Ace Editor for in browser code editing.<br>' +
                'The Ace project can be found at: <a href="https://github.com/ajaxorg/ace/">https://github.com/ajaxorg/ace/</a>.',
                {
                    'titleText'      : version,
                    'titleColor'     : colorWinTitle,
                    'titleTextColor' : colorWinText
                }
            );
        }
    };
    return ts;
})(easyJS);

/*Execute on window load*/
$(function(){
    "use strict";
    ts.init();
    $('form[name=shell]').addEvent('submit=', function(){modal.show(busyId);});
    $(window).addEvent('resize', function(){setTimeout(function () {ts.resize();}, 100);});
    //Firefox: resize on minimize
    if ($.isUndef(window.onoverflow)) $(window).addEvent('overflow', function(){
        setTimeout(function () {ts.resize();}, 100);
    });
});
