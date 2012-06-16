/*
    modalupload.js
    Upload file dialogs for modal
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
    /*INCLUDE_CSS("modal","modal-upload.css")*/
    function upload(text, options, fn) {
        options = $.merge(options, {
            'titleText'      : 'Upload',
            'titleColor'     : 'black',
            'titleTextColor' : 'white',
            'icon'           : 'upload.png',
            'uploadDir'      : null,
            'script'         : function(){},
            'drag'           : true,
            'closeBtn'       : true,
            'showUnzip'      : true
        });
        var id  = modal.uniqueId(),

        zip     = (!options.showUnzip) ? '' :
            '<p class="modal_upload_check">' +
                '<input type="checkbox" id="unzip' + id + '" name="unzip' + id + '" value="unzip" checked="true"/>' +
                '<label for="unzip' + id + '"><font size="1" >Extract Zip Files on Upload?</font><label>' +
            '</p>',

        body    =
            '<p class="modal_block" >' +
                '<table class="modal_upload" id="modalUploadTable' + id + '">' +
                    '<tr><td align="center"><b>Files</b></td>' +
                        '<td></td>' +
                        '<td>' +
                            '<a href="javascript:void(0)" ' +
                                'class="modal_upload_buttons modal_upload_add_button" ' +
                                'onclick="upload.addFile(\'' + id + '\',\'' + options.uploadDir + '\');">' +
                            '</a>' +
                        '</td>' +
                    '</tr>' +
                '</table>' +
            '</p>' +
            zip,

        focus    = 'modalOkay' + id,
        callback = (typeof(fn) != 'undefined') ?
            function (e) {upload.submitFile(id, options.uploadDir);fn();} :
            function (e) {upload.submitFile(id, options.uploadDir);};

        modal(
            id,
            {
                'title' : options.titleText,
                'text'          :text,
                'body'          :body,
                'fnYes'         :callback,
                'titleColor'    :options.titleColor,
                'titleTextColor':options.titleTextColor,
                'icon'          :options.icon,
                'drag'          :options.drag,
                'focus'         :focus,
                'cancelBtn'     :true,
                'okayText'      :'Upload',
                'cancelText'    :'Close'
            }
        );

        upload.init(id, options.script, options.showUnzip);
        upload.addFile(id, options.uploadDir);
        $('#modal' + id).center();
        return id;
    }

    var modalUpload = {
        init : function (id, action, unzip) {
            $('#modal' + id).attr({
                'uploadFile' : '',
                'submitted'  : false,
                'action'     : action,
                'showUnzip'  : unzip
            });
        },

        submitFile : function (id, dir) {
            var table = $('#modalUploadTable' + id).attr('firstChild'),
            children  = table.childNodes,
            diag      = $('#modal' + id)[0],
            unzip     = (diag.showUnzip) ? (($('#unzip' + id).attr('checked') === true) ? 1: 0) : 0,
            max       = children.length,
            i, td, form;

            for (i = 1; i < max; i++) {
                td     = children.item(i).childNodes[0];
                form   = td.firstChild;

                /*skip non valid rows*/
                if (form == null) continue;
                if (form.tagName !== 'FORM') continue;

                /*prep for submit*/
                $(diag).attr({'submitted' : true, 'uploadFile' : form.firstChild.value});

                /*Bail if nothing to submit*/
                if (form.firstChild.value === '')
                {
                    setTimeout(
                        function () {
                            td.innerHTML = '<font size="1">FAILED: No File!</font>';
                            upload.submitFile(id);
                        },
                        100
                    );
                    break;
                }
                /*submit to upload*/
                form.action = diag.action(dir, unzip);
                form.submit();
                td.innerHTML = '<font size="1">Uploading...</font>';
                break;
            }
        },

        addFile : function(id, dir) {
            var diag = $('#modal' + id)[0],
            table    = $('#modalUploadTable' + id).attr('firstChild');
            if (diag.submitted != null) {
                if (diag.submitted === true) {
                    diag.submitted = false;
                    upload.removeAllFiles(id);
                }
            }
            table.appendChild(upload.createRow(id, dir));
        },

        removeFile : function(el, id) {
            var node = el,
            tagName = '',
            table = $('#modalUploadTable' + id).attr('firstChild');
            do {
                node = node.parentNode;
                tagName = (node.tagName == null) ? '' : node.tagName;
            } while (tagName != 'TR');
            table.removeChild(node);
        },

        removeAllFiles : function(id) {
            var tagName  = '',
                table    = $('#modalUploadTable' + id).attr('firstChild'),
                children = table.childNodes,
                first    = table.firstChild,
                count    = children.length,
                i;
            for (i = (count - 1); i > 0; i--) {
                if (children.item(i).tagName == 'TR' && children.item(i) != first) {
                    table.removeChild(children.item(i));
                }
            }
        },

        createRow : function(id, dir){
            var formId = Math.floor(Math.random() * 999999),
                row    = $('<tr/>')[0],
                cell1  = $('<td/>').attr({
                    'id'        :'modalUploadCell' + formId,
                    'align'     :'left',
                    'nowrap'    :'nowrap',
                    'innerHTML' :
                        '<form enctype="multipart/form-data" ' +
                               'id="' + formId + '" ' +
                               'target="modalUploadFrame' + formId + '" ' +
                               'method="post">' +
                            '<input type="file" name="fileName" id="modalUploadFile' + formId + '">' +
                        '</form>'
                })[0],
                cell2  = $('<td/>').attr({
                    'id' : 'modalFrameCell'+formId,
                    'innerHTML' :
                        '<iframe name="modalUploadFrame' + formId + '" ' +
                                 'id="modalUploadFrame' + formId + '" ' +
                                 'class="modal_upload_frame" ' +
                                 'onload="upload.complete(\'' + formId + '\',\'' + id + '\',\'' + dir + '\');" >' +
                        '</iframe>'
                })[0],
                cell3  = $('<td/>').attr( 'innerHTML',
                    '<a href="javascript:void(0)" ' +
                        'onclick="upload.removeFile(this,\'' + id + '\');" ' +
                        'class="modal_upload_buttons modal_upload_remove_button">' +
                    '</a>'
                )[0];
            row.appendChild(cell1);
            row.appendChild(cell2);
            row.appendChild(cell3);
            return row;
        },

        complete : function (formId, id, dir) {
            /*As soon as iframes are created they launch the onload event
            IE won't allow you to change onload events once created, so
            I just catch the event instead of other crazy hacks*/
            var diag  = $('#modal' + id)[0],
            response, fileName;
            if (diag.submitted == null) return;
            if (diag.submitted === false) return;

            /*Get content from iframe*/
            response = $('#modalUploadFrame' + formId).getContent();

            /*Display success or failure*/
            fileName     = diag.uploadFile.basename();
            $('#modalUploadCell' + formId).attr('innerHTML',
                '<font size="1">' + (response ? response : '') + ': ' + fileName + '</font>'
            );
            setTimeout(function () {upload.submitFile(id, dir);}, 100);
        }
    };

    $.extend(upload, modalUpload);
    window.upload = upload;
})(easyJS);
