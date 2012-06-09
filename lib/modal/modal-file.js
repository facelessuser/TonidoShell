  /*
    modal-file.js
    File selector dialog for modal
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
         alert: false, warn: false, error: false*/

(function ($){
    "use strict";
    modal.loadDialog("standard");
    $.require(modal.scriptPath + "modal-file.css");
    function fileSelector(text, options, fn) {
        options = $.merge(options, {
            'titleText'      : 'File Selector',
            'titleColor'     : 'black',
            'titleTextColor' : 'white',
            'icon'           : 'file.png',
            'folder'         : null,
            'drag'           : true,
            'closeBtn'       : true,
            'getFolders'     : true,
            'getFiles'       : false,
            'getDrives'      : false,
            'selectFiles'    : true,
            'root'           : ''
        });
        if (options.root === '') options.root = options.folder;
        if (options.selectFiles) options.getFiles = true;

        var id   = modal.uniqueId(),
        body     =
            '<p class="modal_block" >' +
                '<input type="hidden" name="rootPath" id="rootPath' + id + '" value="' + (options.root + '/').dirname().replace(/\/$/g, '') + '">' +
                '<div id="modalFileTableDiv' + id + '" class="modal_file"></div>' +
            '</p>',

        focus      = 'modalOkay' + id,
        fileBusyId = busy(
            'Getting file list...',
            {
                'titleText'      : 'Busy',
                'titleColor'     : options.titleColor,
                'titleTextColor' : options.titleTextColor
            }
        ),

        callback   = (typeof(fn) != 'undefined') ?
            function (e) {modal.destroy(fileBusyId);modal.destroy(id);fn();} :
            function (e) {modal.destroy(fileBusyId);modal.destroy(id);},
        callbackNo = function (e) {modal.destroy(fileBusyId);modal.destroy(id);};

        modal(
            id,
            {
                'title'         : options.titleText,
                'text'          : text,
                'body'          : body,
                'fnYes'         : callback,
                'fnNo'          : callbackNo,
                'titleColor'    : options.titleColor,
                'titleTextColor': options.titleTextColor,
                'icon'          : options.icon,
                'drag'          : options.drag,
                'focus'         : focus,
                'okayText'      : 'Select',
                'closeBtn'      : options.closeBtn,
                'cancelBtn'     : options.selectFiles,
                'cancelText'    : 'Close'
            }
        );

        if (options.selectFiles === true) $('#modalOkay' + id).css('display', 'none');

        $('#modal' + id).attr({
            'busyId': fileBusyId,
            'fileList': '',
            'getFiles'   : options.getFiles,
            'getFolders' : options.getFolders,
            'getSize'    : false,
            'selectFile' : options.selectFiles,
            'getDrives'  : options.getDrives,
            'scanPath'   : (options.folder + '/').replace(/\/\/$/g, '\/'),
            'alert'      : function (alertMsg){
                warn(
                    alertMsg,
                    {
                        'titleText'      : 'Error',
                        'titleColor'     : options.titleColor,
                        'titleTextColor' : options.titleTextColor
                    }
                );
            }
        });
        modal.show(fileBusyId, null, function () {fileSelector.getFileList(id, options.folder, true);});
        return id;
    }

    var modalFile = {
        addFiles : function (id, parentDir, center) {
            var diag  = $('#modal' + id).attr('scanPath', parentDir + '/')[0],
            files     = diag.fileList,
            fileList, table, count, backDir, baseName, dirPath, i, item, file, isDrv, isDxr, isDir, div, width;
            if (files === '') {
                modal.hide(diag.busyId);
                return;
            }

            fileList  = files.split('__file##');
            table     = $('#modalFileTable' + id).attr('lastChild');
            count     = 0;

            /*Save Windows Drive*/
            if ($('#rootPath' + id).attr('value') !== parentDir && (/^[a-zA-Z]:$/m).test(parentDir) === false) {
                backDir  = parentDir.dirname();
                baseName = backDir.basename().replace(/^[a-zA-Z]:$/g, '');
                dirPath  = backDir.dirname();

                table.appendChild(fileSelector.createRow(id, '(..)', baseName, dirPath, count, true));
                count++;
            }

            /*Create list of folders and files*/
            for (i = 0; item = fileList[i]; i++, count++) {
                /*Quit if there are no files*/
                if (files === '__nocontent##') break;

                /*Determine object type and strip out identifier*/
                file = item.split('__size##');
                if ((isDrv = (/^__drv##/.test(item)))) file[0] = file[0].ltrim('__drv##');
                if ((isDxr = (/^__dxr##/.test(item)))) file[0] = file[0].ltrim('__dxr##');
                if ((isDir = (/^__dir##/.test(item)))) file[0] = file[0].ltrim('__dir##');

                /*Add the according row*/
                if (isDrv) {
                    table.appendChild(fileSelector.createRow(id, file[0], '',      file[0],   count, isDir, isDrv, isDxr));
                } else if (isDir || isDxr){
                    table.appendChild(fileSelector.createRow(id, file[0], file[0], parentDir, count, true,  isDrv, isDxr));
                } else {
                    table.appendChild(fileSelector.createRow(id, file[0], file[0], parentDir, count, isDir, isDrv, isDxr));
                }
            }

            /*Resize Div to keep within a reasonable size and to prevent horizontal scroll bar*/
            div = $('#modalFileTableDiv' + id)[0];
            width   = parseInt(div.offsetWidth, 10) + 1;
            if (parseInt(div.offsetHeight, 10) > 300) div.style.height = '300px';
            div.style.width = (width < 300) ? 300 + 'px': width + 'px';
            if (center) $('#modal' + id).center();

            /*Set return if needed nad hide busy dialog*/
            if (!diag.selectFile) modal.returns = parentDir;
            modal.hide(diag.busyId);
        },

        createRow : function (id, displayName, fileName, dir, rowNum, isDir, isDrv, isDxr) {
            var diag       = $('#modal' + id)[0],
                fileId     = Math.floor(Math.random() * 999999),
                icon       = (isDir || isDrv) ? ((isDrv) ? 'modal_file_drive' : ((isDxr) ? 'modal_file_restricted_folder' :'modal_file_folder')) : 'modal_file_document',
                changeRoot = (isDrv) ? 'true' : 'false',
                click      = (isDir || isDrv) ?
                    ((!isDxr) ? 'onclick="fileSelector.selectChild(\'' + id + '\',\'' + dir + '\',\'' + fileName + '\',' + changeRoot + ');">' : '>') :
                    ((diag.selectFile) ? 'onclick="modal.returns = \'' + dir + '/' + fileName + '\';$(\'#\' + \'modalOkay' + id + '\')[0].onclick();">' : '>'),

                row  = $('<tr/>').attr('className' , ((rowNum%2 === 0) ? 'modal_file_row1 modal_file_row' : 'modal_file_row2 modal_file_row'))[0],
                cell = $('<td/>').attr({
                    'id'        :'fileFormCell' + fileId,
                    'align'     :'left',
                    'nowrap'    :'nowrap',
                    'innerHTML' :
                        '<font size="2">' +
                            '<a class="modal_file_buttons" ' +
                                'style="display:block;" ' +
                                'href="Javascript:void(0)" ' +
                                  click +
                              '&nbsp;<span class="modal_file_buttons ' + icon + '"></span>&nbsp;' + displayName +
                            '</a>' +
                        '</font>'
                })[0];

            cell.onClick = function(){};
            row.appendChild(cell);
            return row;
        },

        selectChild : function (id, parentDir, file, changeRoot) {
            var diag = $('#modal' + id)[0],
            newDir;
            if (changeRoot) $('#rootPath' + id).attr('value' , parentDir);
            newDir        = parentDir + '/' + file;
            diag.scanPath = newDir + '/';
            modal.show(diag.busyId, null, function (){fileSelector.getFileList(id, newDir, false);});
        },

        getFileList : function (id, parentDir, center) {
            var folderName = (parentDir = parentDir.replace(/\/$/g, '')).basename(),
            diag           = $('#modal' + id)[0],
            errorFn        = function() {
                diag.alert('Cannot get file list!');
                modal.hide(diag.busyId);
            },
            parameters = [
                'scanPath=' + encodeURIComponent(diag.scanPath),
                'folders=' + ((diag.getFolders === true) ? '1' : '0'),
                'files=' + ((diag.getFiles   === true) ? '1' : '0'),
                'drives=' + ((diag.getDrives  === true) ? '1' : '0'),
                'getsize=' + ((diag.getSize    === true) ? '1' : '0')
            ],
            complete = function (e) {
                var jsondata = JSON.parse(e);
                if (jsondata.status !== 'Success') {
                    if (jsondata.status === 'Error') error('Ajax', jsondata.error);
                    else errorFn();
                } else {
                    diag.fileList = jsondata.files;
                    fileSelector.addFiles(id, parentDir, center);
                }
            };

            $('#modalFileTableDiv' + id).attr('innerHTML',
                '<table class="modal_file" ' +
                        'id="modalFileTable' + id + '" ' +
                        'cellpadding="0" ' +
                        'cellspacing="0" >' +
                    '<tr class="modal_file">' +
                        '<td align="center">' +
                            '<font size="2">' +
                                '<b>Folder: ' + ((folderName === '') ? '/' : folderName) + '</b>' +
                            '</font>' +
                        '</td>' +
                    '</tr>' +
                '</table>');

            $.ajax({
                'url'        : modal.scriptPath + "modalfile.php",
                'type'       : "POST",
                'parameters' : parameters,
                'fail'       : function(){errorFn();},
                'complete'   : complete,
                'statusCode' : {500 : complete}
            });
        }
    };

    $.extend(fileSelector, modalFile);
    window.fileSelector = fileSelector;
})(easyJS);
