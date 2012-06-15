<?php
/*
    command.php
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
/* Setup for Tonido Plug and Tonido Software */
error_reporting(E_ALL);
ini_set('display_errors', 0);
include_once('modal/modalerror.php');
set_error_handler('modal_error_handler');
register_shutdown_function('modal_handle_shutdown');

$TonidoProfileDir = getenv('TONIDO_PROFILE_ROOTDIR') . "/plugindata";
$TonidoPluginDir = getenv('DOCUMENT_ROOT') . "APP_DIR";
$InstallDir = $TonidoProfileDir . "/APP_DIR";
$SessionDir =$InstallDir . "/sessions";
$TonidoOS = 'nix';
$HostNames = '';

/*Setup session environment*/
session_save_path($SessionDir);
ini_set('session.gc_probability', 1);

/*Determine Host*/
if(strpos(strtolower(php_uname()), 'win') !== false) {
    $TonidoOS = 'win';
}

/*Format HostName for shell*/
if ($TonidoOS === 'win') {
    $HostNames = trim(basename(shell_exec("whoami"))) . "@" . trim(shell_exec("hostname"));
} else {
    $HostNames = trim(shell_exec("whoami")) . "@" . trim(shell_exec("hostname"));
}

function stripslashes_deep($value) {
    if(isset($value)) {
        $value = is_array($value) ? array_map('stripslashes_deep', $value) : stripslashes($value);
    }
    return $value;
}

/*Get Post values*/
if (get_magic_quotes_gpc()) {
    $_POST = stripslashes_deep($_POST);
}

$command  = isset($_POST['command']) ? $_POST['command']  : '';
$encoded  = isset($_POST['encode'])  ? $_POST['encode']   : 0;
$response = isset($_POST['response'])? $_POST['response'] : 1;
$session  = isset($_POST['session']) ? $_POST['session']  : 0;
$db       = $InstallDir . '/settings.sqlite';

session_name('SESSION_NAMEID' . $session);
define('PHPSHELL', true);
define('PDOPLUS', true);
include_once('phpshell/phpshell.php');
include_once('tonidoshell/pdoplus.php');
include_once('tonidoshell/dbdefaults.php');

/*Database Access*/
function initDB($db, $newDB) {
    global $ALIASES_DEFAULTS;
    global $SHELLMARK_DEFAULTS;
    global $TSHELL_DEFAULTS;
    $db->addTable("settings", "Id INTEGER PRIMARY KEY, key TEXT, value TEXT");
    $db->addTable("aliases", "Id INTEGER PRIMARY KEY, key TEXT, value TEXT");
    $db->addTable("shellmarks", "Id INTEGER PRIMARY KEY, key TEXT, value TEXT");

    if ($newDB) {
        $db->setRecords('aliases', $ALIASES_DEFAULTS);
        $db->setRecords('shellmarks', $SHELLMARK_DEFAULTS);
        $db->setRecords('settings', $TSHELL_DEFAULTS);
    }
}

function readDB($db) {
    $aliases    = array();
    $shellmarks = array();

    $result = $db->query('SELECT * FROM aliases');
    foreach($result as $entry) {
        $aliases[$entry['key']] = $entry['value'];
    }

    $result = $db->query('SELECT * FROM shellmarks');
    foreach($result as $entry) {
        $shellmarks[$entry['key']] = $entry['value'];
    }

    $_SESSION['database'] = array( 'aliases' => $aliases,
                                   'shellmarks' => $shellmarks);
}

function parseDB ($sqliteDB) {
    $newDB = (!file_exists($sqliteDB)) ? true : false;
    try {
        $db = new PDOPlus('sqlite:' . $sqliteDB);

        initDB($db, $newDB);
        readDB($db);

        $db = null;
    } catch(PDOException $e) {
        trigger_error('Exception : ' . $e->getMessage(), E_USER_WARNING);
    }
}

function setSymbol ($dbfile, $key, $value, $type){
    try {
        $db = new PDOPlus('sqlite:' . $dbfile);
        $sm = array($key => $value);
        $db->setRecords($type, $sm);
        readDB($db);
    } catch(PDOException $e) {
        trigger_error('Exception : ' . $e->getMessage(), E_USER_WARNING);
    }
    $db = null;
    return ($key . ' = ' . $value . "\n");
}

function deleteSymbol ($dbfile, $key, $type){
    try {
        $db = new PDOPlus('sqlite:' . $dbfile);
        $sm = array($key);
        $db->deleteRecords($type, $sm);
        readDB($db);
    } catch(PDOException $e) {
        trigger_error('Exception : ' . $e->getMessage(), E_USER_WARNING);
    }
    $db = null;
    return ("\n");
}

/*Get/Parse alias or shellmark symbols*/
function getSymbols ($sym) {
    $output = '';
    foreach ($_SESSION['database'][$sym] as $key => $value){
        $output .= sprintf("%-20s = %s\n", $key, $value);
    }
    return $output;
}

function parseSymbol ($dbfile, $mark, $type) {
    $output = '';
    $errMsg = "invalid parameters\n";
    if (preg_match('/(\-s|\-d)\s+(.+)/', $mark, $match)) {
        if ($match[1] === '-s') {
            if (preg_match('/([A-Za-z0-9_]+)\s+(.+)/', $match[2], $params)) {
                $output .= setSymbol($dbfile, $params[1], $params[2], $type);
            } else {
                $output .= $errMsg;
            }
        } else {
            if (preg_match('/^([A-Za-z0-9_]+)$/', trim($match[2]), $params)) {
                $output .= deleteSymbol($dbfile, $params[1], $type);
            } else {
                $output .= $errMsg;
            }
        }
    } else {
        $output .= $errMsg;
    }
    return $output;
}

/* Tonido file commands */
function download($file, $os) {
    $output   = '';
    $returns  = '';
    $filePath = ($os === 'win') ? PHPSHELL_winPath($file) : PHPSHELL_unixPath($file);
    if (is_dir($filePath)) {
        $output = "\n";
        $returns = array('type' => 'folder',
                         'path' => $filePath);
    } elseif (is_file($filePath)) {
        $output = "\n";
        $returns = array('type' => 'file',
                         'path' => $filePath);
    } else {
        $output .= '"' . $filePath . "\" not a valid file or folder!\n";
        $returns = array('', '');
    }
    return array($output, $returns);
}

function editNewFile($file, $os){
    $output   = '';
    $returns  = '';
    $filePath = ($os === 'win') ? PHPSHELL_winPath($file) : PHPSHELL_unixPath($file);
    if (is_dir(dirname($filePath))) {
        if (!is_file($filePath)) {
            $returns = $filePath;
            $output = "\n";
        } else {
            $output .= '"' . $filePath . "\" already exists!\n";
        }
    } else {
        $output .= '"' . dirname($filePath) . "\" is not a valid directory!\n";
    }
    return array($output, $returns);
}

function editFile($file, $os) {
    $output   = '';
    $returns  = '';
    $filePath = ($os === 'win') ? PHPSHELL_winPath($file) : PHPSHELL_unixPath($file);
    if (is_file($filePath)) {
        $returns = $filePath;
        $output .= "\n";
    } else {
        $output .= '"' . $filePath . "\" is not a valid file!\n";
    }
    return array($output, $returns);
}

/*Parse commands*/
#$PHPSHELL_startMsg = "Tonido Shell session started...\n";
PHPSHELL_init($TonidoOS);

/*Parse database if database has not been parsed yet in session*/
if (empty($_SESSION['database']) || !file_exists($db)) {
    parseDB($db);
}

/*Initialize terminal values*/
$terminal_input   = '';
$terminal_output  = '';
$terminal_returns = '';

/*Process command if one exists*/
if (!empty($command)) {
    // Apply shellmarks
    while (preg_match('/<\s*sm:\s*([A-Za-z0-9\-\_]+)\s*>/', $command, $matches)) {
        if (isset($_SESSION['database']['shellmarks'][$matches[1]])) {
            $command = PHPSHELL_preg_replace_all('|<\s*sm:\s*' . $matches[1] . '\s*>|', $_SESSION['database']['shellmarks'][$matches[1]], $command);
        } else {
            $command = PHPSHELL_preg_replace_all('|<\s*sm:\s*' . $matches[1] . '\s*>|', '', $command);
        }
    }

    // Parse the command
    $command = PHPSHELL_parseCommand($command, $HostNames);

    /* Expand aliases */
    if (preg_match('/^([A-Za-z0-9_]+)(\s+(?:.*)|)$/', $command, $matches)) {
        if (isset($_SESSION['database']['aliases'][$matches[1]])) {
            $command = $_SESSION['database']['aliases'][$matches[1]] . $matches[2];
        }
    }

    // Do TonidoShell specific things
    if ( $command === 'debug_throw_error') {
        $_SESSION['output'] .= "\n";
        $_SESSION['input'] = 'debug';
        trigger_error('Code monkeys left bannanas in server; please remove.', E_USER_WARNING);
    } elseif ( $command === 'debug_js_throw_error') {
        $_SESSION['output'] .= "\n";
        $_SESSION['input'] = 'debug js';
    } elseif ( $command === 'download') {
        $_SESSION['output'] .= "\n";
        $_SESSION['input'] = 'download';
    } elseif ( preg_match('/^(download)\s+(.+)$/', $command, $file) ) {
        $returns = download($file[2], $TonidoOS);
        $_SESSION['output'] .= $returns[0];
        $_SESSION['returns'] = $returns[1];
        $_SESSION['input'] = 'download files';
    } elseif ( $command === 'upload' ){
        $_SESSION['output'] .= "\n";
        $_SESSION['input'] = 'upload';
    } elseif ( preg_match('/^upload\s+(.+)$/', $command, $param) ){
        if (trim($param[1]) === '-admin') {
            $_SESSION['output'] .= "\n";
            $_SESSION['input'] = 'upload php';
        } else {
            $_SESSION['output'] .= "invalid parameter\n";
            $_SESSION['input'] = 'terminal';
        }
    } elseif ( $command === 'mktxt' ){
        $_SESSION['output'] .= "\n";
        $_SESSION['input'] = 'edit new';
    } elseif (preg_match('/^(mktxt)\s+(.+)$/', $command, $file)){
        $returns = editNewFile($file[2], $TonidoOS);
        $_SESSION['output'] .= $returns[0];
        $_SESSION['returns'] = $returns[1];
        $_SESSION['input'] = 'edit new file';
    } elseif ( $command === 'edit' || $command === 'vi') {
        $_SESSION['output'] .= "\n";
        $_SESSION['input'] = 'edit';
    } elseif (preg_match('/^(edit|vi)\s+(.+)$/', $command, $file)) {
        $returns = editFile($file[2], $TonidoOS);
        $_SESSION['output'] .= $returns[0];
        $_SESSION['returns'] = $returns[1];
        $_SESSION['input'] = 'edit file';
    } elseif ( $command === 'shellmarks' || $command === 'aliases') {
        $_SESSION['output'] .= getSymbols($command);
        $_SESSION['input'] = $command;
    } elseif (preg_match('/^(shellmarks|aliases)\s+(.+)$/', $command, $params)) {
        $_SESSION['output'] .= parseSymbol($db, $params[2], $params[1]);
        $_SESSION['input'] = $params[1];
    } else {
        // No TonidoShell specific commands, so execute PHP Shell command
        PHPSHELL_sendCommand($command, $TonidoOS, $response);
    }
}

// Get history and paths
$terminal_input   = PHPSHELL_getInput();
$terminal_output  = PHPSHELL_getOutput();
$terminal_returns = PHPSHELL_getReturns();
$terminal_history = PHPSHELL_getCommandHistory();
$terminal_cwdir   = PHPSHELL_getCWD();
$terminal_cwdrive = PHPSHELL_getDrive();

if($terminal_output === '') $terminal_output = ' ';

/*Return terminal session info*/
$arr = array('status'        => 'Success',
             'command'       => $terminal_input,
             'returns'       => $terminal_returns,
             'output'        => ($encoded) ? $terminal_output : htmlspecialchars_decode($terminal_output),
             'winTitle'      => $HostNames,
             'cmdPrompt'     => "[" . $HostNames . " " . basename($terminal_cwdir) . "/]#",
             'workingDir'    => ($TonidoOS === 'win') ? str_replace('\\', '/', $terminal_cwdir) : $terminal_cwdir,
             'appDir'        => ($TonidoOS === 'win') ? str_replace('\\', '/', $TonidoPluginDir) : $TonidoPluginDir,
             'rootFolder'    => ($TonidoOS === 'win')? $terminal_cwdrive : '/',
             'historyJS'     => $terminal_history,
             'session'       => $session);

PHPSHELL_resetInput();

die(json_encode($arr));
?>
