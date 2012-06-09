/*
    modal-edit.js
    File edit dialog for modal
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
         alert: false, warn: false, error: false, fileSelector: false*/

(function ($) {
    "use strict";
    modal.loadDialog("standard", "file");
    function textEdit(text, options, fn) {
        options = $.merge(options, {
            'titleText'      : 'Edit',
            'titleColor'     : 'black',
            'titleTextColor' : 'white',
            'icon'           : 'file.png',
            'root'           : '',
            'readonly'       : false,
            'filepath'       : '',
            'newfile'        : false,
            'okayText'       : 'Save',
            'cancelText'     : 'Close',
            'cancelBtn'      : true,
            'submit'         : true,
            'maximize'       : true,
            'fnNo'           : function(){},
            'closeBtn'       : true
        });

        if (options.root === '') options.root = options.filepath.dirname();

        var buttons, saveBtn, editBusyId,
            id  = textBox(text, options),

            /*Create a save as button to insert*/
            saveAsBtn = $('<input/>').attr({
                'type': 'button',
                'id': 'saveAs' + id,
                'value': 'Save As'
            })[0],

            /*Chain callback functions for "Save As" functionality*/
            /*Save Function*/
            saveFn = function () {
                $('#modal' + id).attr('fileName', modal.returns);
                $('#modalOkay' + id)[0].onclick();
            },

            maxCleanUp = (options.maximize) ?
                function () {$('body').css('overflow', 'auto');} :
                function () {},

            /*File Name Prompt*/
            selectNameFn = function () {
                $('#modal' + id).attr('pathName', modal.returns);
                prompt(
                    'Enter filename',
                    {
                        'titleText'      : 'File Name',
                        'titleColor'     : options.titleColor,
                        'titleTextColor' : options.titleTextColor,
                        'icon'           : 'file.png',
                        'defaults'        : options.filepath.basename()
                    },
                    saveFn
                );
            };

        /*Select destination directory*/
        saveAsBtn.onclick  = function () {
            $('#modal' + id).attr({
                'pathName' : null,
                'fileName' : null
            });
            fileSelector(
                'Select Destination',
                {
                    'titleText'      : 'Folder Selector',
                    'titleColor'     : options.titleColor,
                    'titleTextColor' : options.titleTextColor,
                    'root'           : options.root,
                    'folder'         : options.filepath.dirname(),
                    'getFiles'       : true,
                    'selectFiles'    : false,
                    'getDrives'      : true
                },
                selectNameFn
            );
        };

        /*Add save as button*/
        buttons = $('#modalDiagButtons' + id)[0];
        buttons.insertBefore(saveAsBtn, buttons.firstChild);

        /*Modify okay button to save files only*/
        saveBtn  = $('#modalOkay' + id)[0];
        if (fn == null) fn = function(){};
        saveBtn.onclick = function () {
            textEdit.saveFile(id);
            fn();
        };
        if (options.newfile) saveBtn.style.display = 'none';

        /*Initialize variables and error and busy dialogs call*/
        $('#modal' + id).attr({
            'pathName' : options.filepath.dirname(),
            'fileName' : options.filepath.basename(),
            'alertFn': function(alertMsg){
                warn(
                    alertMsg,
                    {
                        'titleText'      : 'Error',
                        'titleColor'     : options.titleColor,
                        'titleTextColor' : options.titleTextColor
                    }
                );
            },
            'busyId'  : busy(
                'Please wait...',
                {
                    'titleText'      : 'File Operation',
                    'titleColor'     : options.titleColor,
                    'titleTextColor' : options.titleTextColor
                }
            )
        });

        /*adjust cancel/close buttons*/
        $('#modalCancel' + id + ',#modalXCloseBtn' + id).addEvent('click=', function(e) {
            maxCleanUp();
            modal.destroy($('#modal' + id).attr('busyId'));
            modal.destroy(id);
            options.fnNo();
        });

        if (!options.newfile) textEdit.getContent(id);

        return id;
    }

    var modalEditBox = {
        getContent : function (id) {
            var diag = $('#modal' + id)[0],
            alertMsg = 'Could not open file!';
            modal.show(diag.busyId, 'Loading file...', function () {
                var filePath = encodeURIComponent(diag.pathName + '/' + diag.fileName),
                parameters   = ["modaltextread=1", "modalfile=" + filePath],
                complete     = function (e) {
                    var jsondata = JSON.parse(e);
                    if (jsondata.status !== 'Success') {
                        if (jsondata.status === 'Error') error('Ajax', jsondata.error);
                        else diag.alertFn(alertMsg);
                    } else {
                        textBox.setText(id, jsondata.modaltextcontent);
                    }
                };
                $.ajax({
                    'url' : modal.scriptPath + "modalfile.php",
                    'type': "POST",
                    'parameters' : parameters,
                    'exit' : function (){modal.hide(diag.busyId);},
                    'fail' : function (){diag.alertFn(alertMsg);},
                    'complete' : complete,
                    'statusCode' : {500 : complete}
                });
            });
        },

        saveFile : function (id) {
            var diag  = $('#modal' + id)[0],
            saveAlert = 'Could not save file!';
            modal.show(diag.busyId, 'Saving file...', function () {
                var filePath = encodeURIComponent(diag.pathName + '/' + diag.fileName),
                content      = encodeURIComponent($("#textBox" + id).attr('value')),
                parameters   = ["modaltextresult=" + content, "modaltextpath=" + filePath],
                complete     = function (e) {
                    var jsondata = JSON.parse(e);
                    if (jsondata.status !== 'Success') {
                        if (jsondata.status === 'Error') error('Ajax', jsondata.error);
                        else diag.alertFn(saveAlert);
                    } else {
                        $('#modalTitle' + id).attr('innerHTML', 'Edit: ' + diag.fileName);
                        $('#modalOkay' + id).css('display', 'inline');
                    }
                };
                $.ajax({
                    'url' : modal.scriptPath + "modalfile.php",
                    'type': "POST",
                    'parameters' : parameters,
                    'exit' : function (){modal.hide(diag.busyId);},
                    'fail' : function (){diag.alertFn(saveAlert);},
                    'complete' : complete,
                    'statusCode' : {500 : complete}
                });
            });
        }
    };

    $.extend(textEdit, modalEditBox);
    window.textEdit = textEdit;
})(easyJS);
