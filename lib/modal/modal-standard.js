/*
    modal-standard.js
    busy, confirm, warn, alert, info, error handler, textbox dialogs
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

/*global modal: false*/
(function ($) {
    "use strict";
    function busy(text, options) {
        options = $.merge(options, {
            'titleText'      : 'Busy',
            'titleColor'     : 'black',
            'titleTextColor' : 'white',
            'icon'           : 'busy.gif',
            'drag'           : false
        });

        var id  = modal.uniqueId(),
        body    = '';

        modal(
            id,
            {
                'title'         :options.titleText,
                 'text'          :text,
                 'body'          :body,
                 'titleColor'    :options.titleColor,
                 'titleTextColor':options.titleTextColor,
                 'icon'          :options.icon,
                 'drag'          :options.drag,
                 'silent'        :true,
                 'okayBtn'       :false,
                 'closeBtn'      :false
            }
        );
        return id;
    }

    function confirm(text, options, fn) {
        options  = $.merge(options, {
            'titleText'      : 'Confirm',
            'titleColor'     : 'black',
            'titleTextColor' : 'white',
            'icon'           : 'prompt.png',
            'drag'           : true,
            'closeBtn'       : true
        });
        var id   = modal.uniqueId(),
        body     = '',
        focus    = "modalOkay" + id,
        callback = (typeof(fn) != 'undefined') ?
            function (e) {modal.destroy(id);fn();} :
            function (e) {modal.destroy(id);};

        modal(
            id,
            {
                'title'         :options.titleText,
                'text'          :text,
                'body'          :body,
                'fnYes'         :callback,
                'titleColor'    :options.titleColor,
                'titleTextColor':options.titleTextColor,
                'icon'          :options.icon,
                'drag'          :options.drag,
                'focus'         :focus,
                'cancelBtn'     :true,
                'closeBtn'      :options.closeBtn
            }
        );
        return id;
    }

    function alert(text, options, fn) {
        options  = $.merge(options, {
            'titleText'      : 'Alert',
            'titleColor'     : 'black',
            'titleTextColor' : 'white',
            'icon'           : 'alert.png',
            'drag'           : true,
            'closeBtn'       : true
        });
        var id   = modal.uniqueId(),
        body     = '',
        focus    = "modalOkay" + id,
        callback = (typeof(fn) != 'undefined') ?
            function (e) {modal.destroy(id);fn();} :
            function (e) {modal.destroy(id);};
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
                'closeBtn'      :options.closeBtn
            }
        );
        return id;
    }

    function warn(text, options, fn) {
        var default_args = {
            'titleText'      : 'Warning!',
            'icon'           : 'warn.png'
        };
        options = $.merge(options, default_args);
        alert(text, options, fn);
    }

    function info(text, options, fn) {
        var default_args = {
            'titleText'      : 'Info',
            'icon'           : 'info.png'
        };
        options = $.merge(options, default_args);
        alert(text, options, fn);
    }

    function prompt(text, options, fn) {
        options   = $.merge(
            options,
            {
                'titleText'      : 'Prompt',
                'titleColor'     : 'black',
                'titleTextColor' : 'white',
                'icon'           : 'prompt.png',
                'type'           : 'text',
                'list'           : [],
                'drag'           : true,
                'defaults'       : '',
                'closeBtn'       : true
            }
        );
        var id    = modal.uniqueId(),
        focus     = 'modalInput' + id,
        listbox   = (options.type === 'list') ?  prompt.setListBox(options.defaults, options.list) : '',
        body      = (options.type === 'text') ?
            '<p class="modal_block modal_prompt_box" >' +
                '<input class="modal_input"' +
                        'type="text"' +
                        'name="modalInput"' +
                        'id="modalInput' + id + '"' +
                        'value="' + options.defaults + '">' +
            '</p>':
            '<p class="modal_block modal_prompt_box" >' +
                '<select name="modalInput" ' +
                         'id="modalInput' + id + '" >' +
                     listbox.html +
                '</select>' +
            '</p>',

        callback   = (typeof(fn) != 'undefined') ?
            function (e) {$('#modalInput' + id).removeShortcut(id);prompt.setReturn(id);modal.destroy(id);fn();} :
            function (e) {$('#modalInput' + id).removeShortcut(id);prompt.setReturn(id);modal.destroy(id);},
        callbackNo = function (e) {$('#modalInput' + id).removeShortcut(id);modal.destroy(id);};
        modal(
            id,
            {
                'title'         :options.titleText,
                'text'          :text,
                'body'          :body,
                'fnYes'         :callback,
                'fnNo'          :callbackNo,
                'titleColor'    :options.titleColor,
                'titleTextColor':options.titleTextColor,
                'icon'          :options.icon,
                'drag'          :options.drag,
                'focus'         :focus,
                'cancelBtn'     :true,
                'okayText'      :'Submit',
                'closeBtn'      :options.closeBtn
            }
         );

        if (options.type === 'list') $('#modalInput' + id).attr('selectedIndex', listbox.index);

        $('#modalInput' + id).addShortcut(
            {
                'name' : id,
                'key'  : 'Enter',
                'halt' : true,
                'fn'   : function (e) {$('#modalOkay' + id)[0].focus();}
            }
        );

        $('#modal' + id).attr('promptType', options.type);
        return id;
    }

    function textBox(text, options, fn) {
        options  = $.merge(
            options,
            {
                'titleText'      : 'Info',
                'titleColor'     : 'black',
                'titleTextColor' : 'white',
                'icon'           : 'info.png',
                'rows'           : 10,
                'cols'           : 70,
                'readonly'       : true,
                'message'        : '',
                'drag'           : true,
                'okayText'       : 'Okay',
                'cancelText'     : 'Cancel',
                'cancelBtn'      : false,
                'formResultName' : 'modaltextresult',
                'formAction'     : '',
                'submit'         : false,
                'maximize'       : false,
                'fnNo'           : function(){},
                'closeBtn'       : true
            }
        );
        var id   = modal.uniqueId(),
        readOnly = (options.readonly === false) ? '' : ' readonly="readonly" ',

        body     =
            '<p class="modal_block">' +
                '<form name="modalTextForm' + id + '"' +
                      'id="modalTextForm' + id + '"' +
                      'action="' + options.formAction + '" method="post" >' +
                    '<textarea name="' + options.formResultName + '"' +
                              'id="textBox' + id + '" ' +
                              'style="margin:0px 10px;"' +
                              'rows="' + options.rows + '" ' +
                              'cols="' + options.cols + '" ' +
                              readOnly + ' >' +
                    '</textarea>' +
                '</form>' +
            '</p>',
        focus    = "textBox" + id,

        cleanUp = (options.maximize) ?
            function () {$('body').css('overflow', 'auto');textBox.getText(id, options.readonly);} :
            function (){textBox.getText(id, options.readonly);},

        callback = (options.submit) ?
            function (e) {
                textBox.submitForm('modalTextForm' + id);} :
                (
                    (typeof(fn) != 'undefined') ?
                        function (e) {
                            cleanUp();
                            modal.destroy(id);
                            fn();
                        } :
                        function (e) {
                            cleanUp();
                            modal.destroy(id);
                        }
                ),

        maximize = (options.maximize === false) ?
            null :
            function () {
                var body = $('#modalBody' + id)[0],
                height =
                    body.offsetHeight -
                    $('#modalBadge' + id).attr('offsetHeight') -
                    $('#modalDiagButtons' + id).attr('offsetHeight') - 36 - 48,
                width  = body.offsetWidth - 48 - 8;
                $('#textBox' + id).css({'height': (height) + 'px', 'width' : (width) + 'px'});
            };

        if (options.maximize) $('body').css('overflow', 'hidden');

        modal(
            id,
            {
                'title'         : options.titleText,
                'text'          : text,
                'body'          : body,
                'fnYes'         : callback,
                'fnNo'          : function(e) {
                    cleanUp();
                    modal.destroy(id);
                    options.fnNo();
                },
                'titleColor'    : options.titleColor,
                'titleTextColor': options.titleTextColor,
                'icon'          : options.icon,
                'drag'          : options.drag,
                'focus'         : focus,
                'maximize'      : maximize,
                'okayText'      : options.okayText,
                'cancelText'    : options.cancelText,
                'closeBtn'      : options.closeBtn,
                'cancelBtn'     : options.cancelBtn
            }
        );

        textBox.setText(id, options.message);
        return id;
    }

    function error (type, message) {
        var err = new Error();
        err.name = 'Internal ' + type + ' Error';
        err.message = message;
        error.handler(err);
    }

    var modalPrompt = {
        setReturn : function (id) {
            var input = $("#modalInput" + id)[0];
            modal.returns = (input != null) ?
                (($('#modal' + id).attr('promptType') === 'text') ?
                  input.value : input.options[input.selectedIndex].value ):
                '';
        },

        setListBox : function (defVal, list) {
            var options = '',
            index       = 0,
            max         = list.length,
            i;
            for (i = 0; i < max; i++) {
                if (defVal === list[i].value) index = i;
                options += '<option value="' + list[i].value + '">' + list[i].display + '</option>';
            }
            return {'html': options, 'index' : index};
        }
    },

    modalTextBox = {
        setText : function (id, text) {
            $('#textBox' + id).attr('value', text);
        },

        appendText : function (id, text) {
            $('#textBox' + id)[0].value += text;
        },

        getText : function (id, readonly) {
            if (!readonly) modal.returns = $('#textBox' + id).attr('value');
        },

        submitForm : function (formName) {
            $('#' + formName)[0].submit();
        }
    },

    modalError = {
        defaultMsg : 'An Error Occured!',

        handler : function (err, url, line) {
            var errMsg = (err.message == null) ?
                "File: " + url + " at line # " + line + "\n\nError: " + err + "\n\n" :
                err.name + "\n\nError: " + err.message + "\n\n",

            msg = "Error Report\n\n" + errMsg;

            textBox(error.defaultMsg, {'titleText':'Error!', 'icon':'warn.png', 'message':errMsg});
            return true;
        }
    };

    $.extend(textBox, modalTextBox);
    $.extend(prompt, modalPrompt);
    $.extend(error, modalError);

    window.busy    = busy;
    window.confirm = confirm;
    window.prompt  = prompt;
    window.alert   = alert;
    window.warn    = warn;
    window.info    = info;
    window.textBox = textBox;
    window.error   = error;
})(easyJS);
