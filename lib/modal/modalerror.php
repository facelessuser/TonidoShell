<?php
/*
    modalerror.php
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

$modalerror_easyjs_path = 'easyjs/';
$modalerror_modal_path = 'modal/';

/*Setup Error Handling*/
function modal_visual_error_handler($errno, $errstr, $errfile, $errline, $errcontext=array()) {
    modal_error_handler($errno, $errstr, $errfile, $errline, $errcontext, true);
}

function modal_visual_handle_shutdown() {
    $error = error_get_last();
    if ($error !== NULL) {
        modal_error_handler($error['type'], $error['message'], $error['file'], $error['line'], true);
    }
}

/*Setup Error Handling*/
function modal_error_handler($errno, $errstr, $errfile, $errline, $errcontext=array(), $display=false) {
    global $modalerror_modal_path;
    global $modalerror_easyjs_path;
    // if error has been supressed with an @
    if (error_reporting() == 0) {
        return;
    }

    switch ($errno) {
        case E_NOTICE:
        case E_USER_NOTICE:
            $errors = "Notice";
            break;
        case E_WARNING:
        case E_USER_WARNING:
            $errors = "Warning";
            break;
        case E_ERROR:
        case E_USER_ERROR:
            $errors = "Fatal Error";
            break;
        default:
            die(
                '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">' .
                '<html><head>' .
                '<link rel="stylesheet" href="modal/modal.css" type="text/css">' .
                '<script type="text/javascript" src="' . $modalerror_easyjs_path . 'easyjs.js"></script>' .
                '<script type="text/javascript" src="' . $modalerror_modal_path . 'modal.js"></script>' .
                '<script type="text/javascript">modal.loadDialog("standard");</script>' .
                '<title>Tonido Shell</title>' .
                '</head>' .
                '<body>' .
                '<script type="text/javascript">var errormsg = ' . json_encode($msg) . ';' .
                'error("php", errormsg);</script>' .
                '</body></html>'
            );
            $errors = "Unknown";
            break;
    }

    $msg = "PHP Error Report\n\n" .
        "File: $errfile at line # $errline\n\n" .
        "$errors: $errstr\n\n" .
        "Context: " . print_r($errcontext, TRUE) . "\n";

    if ($display) {
        die(
            '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">' .
            '<html><head>' .
            '<link rel="stylesheet" href="' . $modalerror_modal_path . '/modal.css" type="text/css">' .
            '<script type="text/javascript" src="' . $modalerror_easyjs_path . 'easyjs.js"></script>' .
            '<script type="text/javascript" src="' . $modalerror_modal_path . 'modal.js"></script>' .
            '<script type="text/javascript">modal.loadDialog("standard");</script>' .
            '<title>Tonido Shell</title>' .
            '</head>' .
            '<body>' .
            '<script type="text/javascript">var errormsg = ' . json_encode($msg) . ';' .
            'error("php", errormsg);</script>' .
            '</body></html>'
        );
    } else {
        $arr = array ('status' => 'Error',
                      'error'  => $msg);
        die(json_encode($arr));
    }
}

function modal_handle_shutdown() {
    $error = error_get_last();
    if ($error !== NULL) {
        modall_error_handler($error['type'], $error['message'], $error['file'], $error['line'], false);
    }
}

?>
