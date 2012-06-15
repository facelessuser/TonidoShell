<?php if (!defined('PHPSHELL')) exit();
// -*- coding: utf-8 -*-
/*

  ***********************************
  *         PHP Shell 2.1           *
  ***********************************

  PHP Shell is an interactive PHP script that will execute any command
  entered.  See the files README, INSTALL, and SECURITY or
  http://mgeisler.net/php-shell/ for further information.

  Copyright (C) 2000-2005 Martin Geisler <mgeisler@mgeisler.net>

  This program is free software; you can redistribute it and/or
  modify it under the terms of the GNU General Public License
  as published by the Free Software Foundation; either version 2
  of the License, or (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You can get a copy of the GNU General Public License from this
  address: http://www.gnu.org/copyleft/gpl.html#SEC1
  You can also write to the Free Software Foundation, Inc., 59 Temple
  Place - Suite 330, Boston, MA  02111-1307, USA.

*/

$PHPSHELL_startMsg = '';

function PHPSHELL_init ($os) {
    global $PHPSHELL_startMsg;
    session_start();
    /* Initialize the session variables. */
    if (empty($_SESSION['cwd'])) {
        $_SESSION['input']   = '';
        $_SESSION['history'] = array();
        $_SESSION['output']  = $PHPSHELL_startMsg;
        $_SESSION['returns'] = '';
        if ($os === 'win') {
            $_SESSION['drive']  = "C:"; //current
            $_SESSION['ldrive'] = "C:"; //last
            $_SESSION['tdrive'] = "C:"; //temp until chdir actaully occurs
            $_SESSION['cwd']    = "C:";
        } else {
            $_SESSION['cwd'] = '/';
        }
        if ($os === 'nix') {
            $_SESSION['home'] = exec('cd ~;pwd;');
        } else {
            $user  = trim(basename(shell_exec("whoami")));

            /*try and find a user directory*/
            $win7  = "C:\\Users\\" . $user;
            $winXp = "C:\\Documents and Settings\\" . $user;
            $winNt = "C:\\WINNT\\Profiles\\" . $user;
            if (file_exists($win7) && is_dir($win7)) {
                $_SESSION['home'] = $win7;
            } elseif (file_exists($winXp) && is_dir($winXp)) {
                $_SESSION['home'] = $winXp;
            } elseif (file_exists($winNt) && is_dir($winNt)) {
                $_SESSION['home'] = $winNt;
            } else {
                $_SESSION['home'] = "C:";
            }
        }
        $_SESSION['lwd']  = $_SESSION['cwd'];
    }
}

/*Clear Session*/
function PHPSHELL_killSession ($os) {
    session_destroy();
    PHPSHELL_init($os);
}

/*Get Session Variables*/
function PHPSHELL_getCWD() {
    return PHPSHELL_getSessionVar('cwd');
}

function PHPSHELL_getDrive() {
    return PHPSHELL_getSessionVar('drive');
}

function PHPSHELL_getOutput() {
    return PHPSHELL_getSessionVar('output');
}

function PHPSHELL_getInput() {
    return PHPSHELL_getSessionVar('input');
}

function PHPSHELL_getReturns(){
    return PHPSHELL_getSessionvar('returns');
}

function PHPSHELL_getSessionVar($variable) {
    if (empty($_SESSION[$variable])) {
         return '';
     } else {
         return $_SESSION[$variable];
    }
}

function PHPSHELL_getCommandHistory () {
    $js_command_hist = array('');
    if (!empty($_SESSION['history'])) {
        foreach ($_SESSION['history'] as $item) {
            $js_command_hist[] = $item;
        }
    }
    return $js_command_hist;
}

/*Clear values*/
function PHPSHELL_clearVar($variable) {
    $_SESSION[$variable] = '';
}

function PHPSHELL_resetReturns(){
    PHPSHELL_clearVar('returns');
}

function PHPSHELL_resetOutput() {
    PHPSHELL_clearVar('output');
}

function PHPSHELL_resetInput() {
    PHPSHELL_clearVar('input');
}

/*Parse commands*/
function PHPSHELL_parseCommand ($command, $HostNames) {
    /*Look for shellmarks and translate them or remove them*/
    PHPSHELL_resetReturns();

    /* Save the command for later use in the JavaScript.  If the command is
     * already in the history, then the old entry is removed before the
     * new entry is put into the list at the front. */
    if (($i = array_search($command, $_SESSION['history'])) !== false)
        unset($_SESSION['history'][$i]);
    array_unshift($_SESSION['history'], $command);

    /* Now append the commmand to the output. */
    $_SESSION['output'] .= htmlspecialchars("\n[" . $HostNames . ' ' . basename($_SESSION['cwd']) . '/]#' . $command . "\n", ENT_COMPAT, 'UTF-8');
    $command = trim($command);

    return $command;
}

function PHPSHELL_sendCommand ($command, $os, $response) {
    /* Determine whether command is handled internal or not */
    if (preg_match('/^[[:blank:]]*cd[[:blank:]]*$/', $command)) {
        $_SESSION['cwd'] = ($os === 'win') ? $_SESSION['drive'] : '/';
        $_SESSION['input'] = 'cd';
    } elseif (preg_match('/^[[:blank:]]*cd[[:blank:]]+([^;]+)$/', $command, $regs)) {
        $regs[1] = trim($regs[1], '\'"'); //trim surrounding quotes from path

        if ($regs[1] === '-') {
            /*goto last directory*/
            $regs[1] = $_SESSION['lwd'] . '/';
        }

        if ($os === 'win') {
            PHPSHELL_changeDir(PHPSHELL_winPath($regs[1]), $os);
        } else {
            PHPSHELL_changeDir(PHPSHELL_unixPath($regs[1]), $os);
        }
        $_SESSION['input'] = 'cd';
    } elseif ( $command === 'exit' ){
        PHPSHELL_killSession($os);
        $_SESSION['input'] = 'exit';
    } elseif ( $command === 'clear' || $command === 'cls' ) {
        PHPSHELL_resetOutput();
        $_SESSION['input'] = 'clear';
    } else {
        PHPSHELL_executeCmd($command, $response, $os);
        $_SESSION['input'] = 'terminal';
    }
}

/*Pass non internal command to host*/
function PHPSHELL_executeCmd($command, $response, $os) {
    /* The command is not an internal command, so we execute it after
    * changing the directory and save the output. */

    $slash = ($os === 'win') ? "\\" : '/';
    chdir($_SESSION['cwd'] . $slash);

    if ($response == 0 && $os === 'win') {
        $WshShell = new COM("WScript.Shell");
        $oExec = $WshShell->Run('cmd /C ' . $command, 0, false);
    } else {
        if ($response == 0) {
            $command = "(" . $command . ") > /dev/null 2> /dev/null";
        }

        $io = array();
        $p = proc_open(
            $command,
            array(
                1 => array('pipe', 'w'),
                2 => array('pipe', 'w')
            ),
            $io
        );

        /* Read output sent to stdout. */
        while (!feof($io[1])) {
            $_SESSION['output'] .= htmlspecialchars(fgets($io[1]), ENT_COMPAT, 'UTF-8');
        }

        /* Read output sent to stderr. */
        while (!feof($io[2])) {
            $_SESSION['output'] .= htmlspecialchars(fgets($io[2]), ENT_COMPAT, 'UTF-8');
        }

        fclose($io[1]);
        fclose($io[2]);
        proc_close($p);
    }
}

/*Resolve Windows Path*/
function PHPSHELL_winPath ($path) {
    $find       = array('|\x5C\.\x5C|', '|\x5C\x5C|', '|\x5C?[^\x5C]+\x5C\.\.(?![^\x5C])|', '|\x5C\.\.(?![^\x5C])|');
    $replace    = array('\\', '\\', '', '');
    $trackDrive = '';

    /* Transform '/' into '\' */
    $path = PHPSHELL_preg_replace_all('|/|', '\\', $path);

    /*replace  ~ with home directory*/
    if ($path === '~') {
        $path = preg_replace('/^~/', $_SESSION['home'], $path, 1);
    } elseif (preg_match('|^~\x5C|', $path, $match)) {
        $path = preg_replace('|^~\x5C|', $_SESSION['home'] . "\\", $path, 1);
    }

    if (preg_match('/^[a-zA-Z]:/', $path, $new_drive)) {
        /* Absolute Paths */
        $new_dir = str_replace($new_drive[0], strtoupper($new_drive[0]), $path);
        $trackDrive = strtoupper($new_drive[0]);
    } elseif ($path{0} == '\\') {
        /* Absolute Paths, but get drive because it was not included */
        if (preg_match('/^[a-zA-Z]:/', $_SESSION['cwd'], $new_drive)) {
            $new_dir = strtoupper($new_drive[0]) . '\\' . $path;
            $trackDrive = strtoupper($new_drive[0]);
        } else {
            /* Precaution incase drive was not found */
            $new_dir = $path;
        }
    } else {
        /* Relative path, we append it to the current working  directory. */
        $new_dir = $_SESSION['cwd'] . '\\' . $path;
    }

    /* Transform '\.\' into '\' and '\\' into '\' and 'x\..' into ''*/
    $new_dir = PHPSHELL_preg_replace_all($find, $replace, $new_dir);

    /*Check if path is empty or drive got regexed out*/
    if ($new_dir === '' || !(preg_match('/^[a-zA-Z]:/', $new_dir, $new_drive))) {
        if (preg_match('/^[a-zA-Z]:/', $_SESSION['cwd'], $new_drive)) {
            $new_dir = strtoupper($new_drive[0]) . $new_dir;
            $trackDrive = strtoupper($new_drive[0]);
        } else {
            /* Precaution incase drive was not found */
            $new_dir = '\\';
        }
    }

    if ($trackDrive !== '' ) {
        $_SESSION['tdrive'] = $trackDrive;
    }
    return $new_dir;
}

/*Resolve Unix Paths*/
function PHPSHELL_unixPath ($path) {
    $find    = array('|/\./|', '|//|', '|/?[^/]+/\.\.(?![^/])|', '|/\.\.(?![^/])|');
    $replace = array('/', '/', '', '');

    /*replace  ~ with home directory*/
    if ($path === '~') {
        $path = preg_replace('/^~/', $_SESSION['home'], $path, 1);
    } elseif (preg_match('|^~\/|', $path, $match)) {
        $path = preg_replace('|^~\/|', $_SESSION['home'] . "/", $path, 1);
    }

    if ($path{0} == '/') {
        /* Absolute path, we use it unchanged. */
        $new_dir = $path;
    } else {
        /* Relative path, we append it to the current working  directory. */
        $new_dir = $_SESSION['cwd'] . '/' . $path;
    }

    /* Transform '/./' into '/'  and '//' into '/' and 'x/..' into '' */
    $new_dir = PHPSHELL_preg_replace_all($find, $replace, $new_dir);
    /*if path is empty or been regexed away*/
    if ($new_dir === '') $new_dir = '/';
    return $new_dir;
}

/*change CWD*/
function PHPSHELL_changeDir ($dir, $os){
    /* Try to change directory. Look before leap*/
    if (file_exists($dir)){
        /*Don't kill the whole script if changing fails*/
        $slash = ($os === 'win') ? "\\" : '/';
        if (@chdir($dir . $slash)) {
            $_SESSION['lwd'] = $_SESSION['cwd'];
            $_SESSION['cwd'] = $dir;
            if ($os === 'win') {
                $_SESSION['ldrive'] = $_SESSION['drive'];
                $_SESSION['drive']  = $_SESSION['tdrive'];
            }
        }
        else $_SESSION['output'] .= "cd: could not change to: $dir\n";
    } else {
        $_SESSION['output'] .= "cd: could not change to: $dir\n";
    }
}

/*find and replace using array of find targets and replace strings*/
function PHPSHELL_preg_replace_all ($find, $replace, $str) {
    if (!is_array($find))    $find    = array($find);
    if (!is_array($replace)) $replace = array($replace);
    if (count($find) != count($replace)) return false;
    $maxIdx = count($find);
    for ( $idx = 0; $idx < $maxIdx; $idx++) {
        while (preg_match($find[$idx], $str)) {
            $str = preg_replace($find[$idx], $replace[$idx], $str, 1);
        }
    }
    return $str;
}
?>
