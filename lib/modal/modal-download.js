/*
    modal-download.js
    File download dialog for modal
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

(function ($) {
    "use strict";
    modal.loadDialog("standard");
    /*INCLUDE_CSS("modal","modal-download.css")*/
    function download(text, options, fn) {
        options = $.merge(options, {
            'titleText'      : 'Download',
            'titleColor'     : 'black',
            'titleTextColor' : 'white',
            'icon'           : 'download.png',
            'downloadDir'    : null,
            'script'         : function(){},
            'startZip'       : function(){},
            'zipStatus'      : function(){},
            'zipDownload'    : function(){},
            'abandonZip'     : function(){},
            'drag'           : true,
            'closeBtn'       : true
        });

        download.folder(
            {
                'titleColor'     : options.titleColor,
                'titleTextColor' : options.titleTextColor,
                'startZip'       : options.startZip,
                'zipStatus'      : options.zipStatus,
                'zipDownload'    : options.zipDownload,
                'abandonZip'     : options.abandonZip
            }
        );

        download.file(
            {
                'titleColor'     : options.titleColor,
                'titleTextColor' : options.titleTextColor,
                'downloadFile'   : options.script
            }
        );

        var id = modal.uniqueId(),
        body   =
            '<p class="modal_block" >' +
                '<div id="modalDownTableDiv' + id + '" class="modal_down">' +
                    '<table class="modal_down" id="modalDownTable' + id + '" cellpadding="0" cellspacing="0" >' +
                        '<tr class="modal_down"><td align="center"><font size="2"><b>File</b></font></td>' +
                            '<td align="center" ><font size="2"><b>Size</b></font></td>' +
                        '</tr>' +
                    '</table>' +
                '</div>' +
            '</p>',

        focus          = 'modalOkay' + id,
        downloadBusyId = busy(
            'Getting file list...',
            {
                'titleText'      : 'Busy',
                'titleColor'     : options.titleColor,
                'titleTextColor' : options.titleTextColor
            }
        ),
        callback = (typeof(fn) != 'undefined') ?
            function (e) {modal.destroy(downloadBusyId);modal.destroy(id);fn();} :
            function (e) {modal.destroy(downloadBusyId);modal.destroy(id);};

        modal(
            id,
            {
                'title'         :options.titleText,
                'text'          :text,
                'body'          :body,
                'fnYes'         :callback,
                'fnNo'          :callback,
                'titleColor'    :options.titleColor,
                'titleTextColor':options.titleTextColor,
                'icon'          :options.icon,
                'drag'          :options.drag,
                'focus'         :focus,
                'okayText'      :'Close'
            }
        );

        $('#modal' + id).attr({
            'busyId'   : downloadBusyId,
            'download' : options.script,
            'scanPath' : (options.downloadDir + '/').replace(/\/\/$/g, '\/'),
            'fileList' : '',
            'alert'    : function(alertMsg){
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

        modal.show(
            downloadBusyId,
            null,
            function (){download.getFileList(id, options.downloadDir);}
        );

        return id;
  }

  /*Download Folder Object*/
    function file (options){
        options = $.merge(options, {
            'titleColor'     : 'black',
            'titleTextColor' : 'white',
            'downloadFile'   : function(){},
            'path'           : null
        });

        download.file.fn   = options.downloadFile;
        download.file.warn = function() {
            warn(
                'Failed to download file!<br>Make sure popups are not blocked and try again.',
                {
                    'titleText'      : 'Error',
                    'titleColor'     : options.titleColor,
                    'titleTextColor' : options.titleTextColor
                }
            );
        };

        if (options.path != null) download.file.download(options.path);
    }

    /*Download Folder Object*/
    function folder (options){
        options = $.merge(options, {
            'titleColor'     : 'black',
            'titleTextColor' : 'white',
            'startZip'       : function(){},
            'zipStatus'      : function(){},
            'zipDownload'    : function(){},
            'abandonZip'     : function(){},
            'downloadDir'    : null
        });

        var statusFn =  function () {
            return textBox(
                'Compressing...',
                {
                    'icon'           : 'download.png',
                    'titleText'      : 'Zip Status',
                    'titleColor'     : options.titleColor,
                    'titleTextColor' : options.titleTextColor,
                    'rows'           : 16,
                    'cols'           : 50,
                    'readonly'       : true,
                    'okayText'       : 'Abort'},
                    function () {download.folder.abandonZip();
                }
            );
        };

        download.folder.init(
            options.startZip,
            options.zipStatus,
            options.zipDownload,
            options.abandonZip,
            statusFn
        );

        download.folder.alertFn = function(alertMsg){
            warn(
                alertMsg,
                {
                    'titleText'      : 'Error',
                    'titleColor'     : options.titleColor,
                    'titleTextColor' : options.titleTextColor
                }
            );
        };

        if (options.downloadDir != null) download.folder.startZip(options.downloadDir);
    }

    var modalDownload = {
        addFiles : function (id, parentDir) {
            /*get file list; return if nothing found*/
            var diag  = $('#modal' + id)[0],
            files     = diag.fileList,
            table, fileList, i, count, max, file, isDir, div, width;

            if (files === '') {
                modal.hide(diag.busyId);
                return;
            }

            /*Split list into an array of files*/
            table    = $('#modalDownTable' + id).attr('lastChild');
            fileList = files.split('__file##');

            /*Break apart file into name and file size part*/
            for (i = 0, count = 0, max = fileList.length; i < max; i++, count++) {
                if (files === '__nocontent##') break;
                file = fileList[i].split('__size##');

                /*Check if file is a folder and strip off identifier*/
                if ( ((/^__drv##/).test(file[0])) || ((/^__dxr##/).test(file[0])) ) continue;
                if ((isDir = (/^__dir##/.test(file[0])))) file[0] = file[0].ltrim('__dir##');

                /*create row*/
                table.appendChild(download.createRow(id, file[0], file[1], parentDir, count, isDir));
            }

            /*Resize Div to keep within a reasonable size and to prevent horizontal scroll bar*/
            div   = $('#modalDownTableDiv' + id)[0];
            width = parseInt(div.offsetWidth, 10) + 1;

            if (parseInt(div.offsetHeight, 10) > 300) div.style.height = '300px';
            div.style.width = (width < 350) ? 350 + 'px': width + 'px';

            $(diag).center();
            modal.hide(diag.busyId);
        },

        createRow : function (id, fileName, fileSize, dir, rowNum, isDir) {
            var diag = $('#modal' + id)[0],
                downId   = Math.floor(Math.random() * 999999),
                downLink =  function (e, n) {
                    return '<font size="2">' +
                        '<a href="javascript:void(0);" id="downCell' + n + '_' + id + '_' + rowNum + '"' +
                            'style="display:block;" ' +
                            'class="modal_down_buttons" ' +
                            'target="_blank">' +
                            e +
                        '</a>' +
                    '</font>';
                },
                row = $('<tr/>').attr('className', ((rowNum%2 === 0) ? 'modal_down_row1 modal_down_row' : 'modal_down_row2 modal_down_row'))[0],

                cell1 = $('<td/>').attr({
                    'id'       :'downFormCell' + downId,
                    'align'    :'left',
                    'nowrap'   :'nowrap',
                    'innerHTML': downLink(
                      '&nbsp;<span class="modal_file_buttons ' + ((isDir) ? 'modal_file_folder' : 'modal_file_document') + '"></span>&nbsp;' + fileName, 1
                    )
                })[0],

                cell2 = $('<td/>').attr({
                    'align'    :'right',
                    'nowrap'   :'nowrap',
                    'className': 'modal_down_size_cell',
                    'innerHTML': downLink(fileSize, 2)
                })[0],

                cell3 = $('<td/>')[0];
            if (isDir) {
                $(cell1).query('#downCell1_' + id + '_' + rowNum).addEvent(
                    "click=", function () {download.folder.startZip(dir + '/' + fileName);return false;}
                );
                $(cell2).query('#downCell2_' + id + '_' + rowNum).addEvent(
                    "click=", function () {download.folder.startZip(dir + '/' + fileName);return false;}
                );
            } else {
                $(cell1).query('#downCell1_' + id + '_' + rowNum).addEvent(
                    "click=", function () {download.file.download(dir + '/' + fileName);return false;}
                );
                $(cell2).query('#downCell2_' + id + '_' + rowNum).addEvent(
                    "click=", function () {download.file.download(dir + '/' + fileName);return false;}
                );
            }
            row.appendChild(cell1);
            row.appendChild(cell2);
            row.appendChild(cell3);
            return row;
        },

        getFileList : function (id, parentDir) {
            var diag   = $('#modal' + id)[0],
                errMsg = 'Cannot get file list!',
                errFn  = function () {
                    diag.alert(errMsg);
                    modal.hide(diag.busyId);
                },
                parameters = ['scanPath=' + encodeURIComponent(diag.scanPath), 'folders=1', 'files=1', 'getsize=1'],
                complete;
            parentDir  = parentDir.replace(/\/$/g, '');
            complete   = function (e) {
                var jsondata = JSON.parse(e);
                if (jsondata.status !== 'Success') {
                    if (jsondata.status === 'Error') error('Ajax', jsondata.error);
                    else errFn(errMsg);
                } else {
                    diag.fileList = jsondata.files;
                    download.addFiles(id, parentDir);
                }
            };
            $.ajax({
                'url'        : modal.scriptPath + "modalfile.php",
                'type'       : "POST",
                'parameters' : parameters,
                'fail'       : errFn,
                'complete'   : complete,
                'statusCode' : {500 : complete}
            });
        }
    },

    modalDownloadFolder = {
        startZipFn    : function(){},
        zipStatusFn   : function(){},
        downloadZipFn : function(){},
        abandonZipFn  : function(){},
        statusDiagFn  : function(){},
        statusId      : null,
        zipId         : null,
        zipDone       : false,

        init : function (start, status, downloadZip, abandonZip, statusFn) {
            download.folder.startZipFn    = start;
            download.folder.zipStatusFn   = status;
            download.folder.downloadZipFn = downloadZip;
            download.folder.abandonZipFn  = abandonZip;
            download.folder.statusDiagFn  = statusFn;
        },

        reset : function () {
            download.folder.statusId = null;
            download.folder.zipId    = null;
            download.folder.zipDone  = false;
        },

        startZip : function (dir) {
            var complete = function (e) { download.folder.ajaxMgr(e);};
            download.folder.reset();
            $.ajax({
                'url'       : download.folder.startZipFn(dir, $.epochTime('sec')),
                'type'      : "GET",
                'fail'      : function() { download.folder.alertFn('Failed to download folder!');},
                'complete'  : complete,
                'statusCode': {500: complete}
            });
        },

        requestZipStatus : function () {
            var complete = function (e) {download.folder.ajaxMgr(e, download.folder.zipId);};
            $.ajax({
                'url'      : download.folder.zipStatusFn(download.folder.zipId, $.epochTime('sec')),
                'type'     : "GET",
                'fail'     : function() { download.folder.alertFn('Failed to download folder!');},
                'complete' : complete,
                'statusCode': {500: complete}
            });
        },

        abandonZip : function () {
            if (download.folder.zipDone === false) {
                download.folder.zipDone = true;
                $.ajax({
                    'url'      : download.folder.abandonZipFn(download.folder.zipId, $.epochTime('sec')),
                    'type'     : "GET"
                });
            }
        },

        ajaxMgr : function(content, zipId) {
            /*Convert to XML and get type*/
            var xml  = $(content).xml(),
                type = xml.firstElement("type").value();

            if (type != null) {
                /*If startzip finished, get zip id*/
                if (type == 'startzip') {
                    if (download.folder.getZipId(xml) && download.folder.zipId != null) {
                        download.folder.requestZipStatus();
                    }
                /* if folder is being zipped, monitor for completion or abortion*/
                } else if ( type === 'zipstatus' && zipId != null && download.folder.zipDone === false) {
                    /*Download*/
                    if (download.folder.getZipStatus(xml)) {
                        download.folder.downloadZip();
                    } else {
                        /*Keep checking status*/
                        download.folder.requestZipStatus();
                    }
                }
            } else {
                download.folder.alertFn('Failed to download folder!');
            }
        },

        getZipId : function (xml) {
            var result  = xml.firstElement("result").value();
            if (result === '1') {
                download.folder.zipId = xml.firstElement("message").value();
                download.folder.statusId = download.folder.statusDiagFn();
            }
            return (result === '1');
        },

        getZipStatus : function (xml) {
            var result = xml.firstElement("result").value(),
            zipFiles   = xml.firstElement("message").value(),
            files, i, file;
            if (zipFiles != null) {
                files = zipFiles.split('nline_');
                for (i = 0; file = files[i]; i++) {
                    if (file !== '') textBox.appendText(download.folder.statusId, file + "\n");
                }
            }
            return (result === '1');
        },

        downloadZip : function () {
            try {
                window.open('', '_self').location.href = download.folder.downloadZipFn(download.folder.zipId);
            } catch (err) {
                download.folder.alertFn('Failed to download folder!<br>Make sure popups are not blocked and try again.');
            }
            download.folder.zipDone = true;
            $('#modalOkay' + download.folder.statusId).attr('value', 'Close');
        }
    },

    modalDownloadFile = {
        warn     : function(){},

        download : function (file) {
            var path     = file.dirname(),
            filename     = file.basename();
            try {
                window.open('', '_self').location.href = download.file.fn(path, filename);
            } catch (err) {
                download.file.warn();
            }
        }
    };

    $.extend(download, modalDownload);
    $.extend(download, {'folder': folder});
    $.extend(download, {'file': file});
    $.extend(download.folder, modalDownloadFolder);
    $.extend(download.file, modalDownloadFile);
    window.download = download;
})(easyJS);
