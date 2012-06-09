<?php
/*
    modalfile.php
    Copyright 2010-2011 Isaac Muse

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
error_reporting(E_ALL);
ini_set('display_errors', 0);
include_once('modalerror.php');
set_error_handler('modal_error_handler');
register_shutdown_function('modal_handle_shutdown');

define('KILO', 1024);
define('MEGA', 1048576);
define('GIGA', 1073741824);
define('TERA', 1099511627776);
$TonidoOS = 'nix';

if (strpos(strtolower(php_uname()), 'win') !== false) {
    $TonidoOS = 'win';
}

$getFolders = false;
if (isset($_POST['folders'])) {
    if ($_POST['folders'] == 1) $getFolders = true;
}

$getDrives = false;
if (isset($_POST['drives'])) {
    if ($_POST['drives'] == 1) $getDrives = true;
}

$getFiles = true;
if (isset($_POST['files'])) {
    if ($_POST['files'] == 0) $getFiles = false;
}

$checkSize = true;
if (isset($_POST['getsize'])) {
    if ($_POST['getsize'] == 0) $checkSize = false;
}

if (isset($_GET['modaluppath'])) {
    $upPath = urldecode($_GET['modaluppath']);
    if (is_dir($upPath) && isset($_FILES['fileName'])) {
        $target_path = $upPath . '/' . basename( $_FILES['fileName']['name']);
        if (@move_uploaded_file($_FILES['fileName']['tmp_name'], $target_path)) {
            if ($_GET['expandzip'] == 1 && preg_match('/\.zip$/', $target_path)) {
                if (unzip($target_path, $upPath)){
                    unlink($target_path);
                } else {
                     die("Unzip Failed");
                }
            }
            die("Upload Succeeded");
        } else {
            die("Failed");
        }
    } else {
        die("Failed");
    }
} else if (isset($_POST['modaltextread']) && isset($_POST['modalfile'])) {
    $arr;
    $path = urldecode($_POST['modalfile']);
    if (is_file($path)) {
        $arr = array ('command'          => 'open text',
                      'modaltextcontent' => getTextFile($path),
                      'status'           => 'Success');
    } else {
        $arr = array ('command'          => 'open text',
                      'modaltextcontent' => '',
                      'status'           => 'Fail');
    }
    die(json_encode($arr));
} else if (isset($_POST['modaltextresult']) && isset($_POST['modaltextpath'])) {
    $msg = "Fail";
    $path = urldecode($_POST['modaltextpath']);
    $content = $_POST['modaltextresult'];
    if (!is_dir($path)) {
        $msg = $path;
        if (saveTextFile($content, $path, $TonidoOS)) {
            $msg = "Success";
        }
    }
    $arr = array('command' => 'save text',
                 'status'  => $msg);
    die(json_encode($arr));
} else if (isset($_POST['scanPath'])) {
    $files = '';
    if ($TonidoOS === 'win' && $getDrives == true) {
        $files .= getAvailableDrives();
    }
    $current_path = urldecode($_POST['scanPath']);
    $dirs = scandir($current_path);
    foreach($dirs as $file) {
        $file_path = $current_path . '/' . $file;
        if (($file === '.')||($file === '..')) {
            continue;
        } elseif (isFileType($getFolders, $getFiles, $file_path)) {
            $isDir = is_dir($file_path);
  
            /*get size*/
            $size = false;
            if ($checkSize) $size = getFileSize($TonidoOS, $file_path, $isDir);
            $size = ($size != false) ? format_size($size) : '--';
  
            /*add split token*/
            if ($files !== '') $files .= '__file##';
  
            /*add dir token*/
            if ($isDir) {
                /*ignore windows symlinks and inaccessable folders*/
                $files .= (isViewable($file_path)) ? '__dir##' : '__dxr##';
            }
  
            /*add size*/
            $files .= $file . "__size##" . $size;
        }
    }
    $files = ($files  === '') ? '__nocontent##' : $files;
    $arr = array('command' => 'filelist',
                 'status'  => 'Success',
                 'files'   =>  $files);
    die(json_encode($arr));
} else {
    $arr = array('status'  => 'Error',
                 'error'     =>'no valid command');
    die(json_encode($arr));
}

function isFileType ($folders, $files, $file_path) {
    $correctType = is_dir($file_path);
    $isType = ($folders) ? $correctType : !($correctType);
    if ($isType == false) {
        $isType = ($files) ? !($correctType) : $correctType;
    }
    return $isType;
}

function getAvailableDrives () {
    $value = '';
    ob_start();
    passthru('wmic logicaldisk get DeviceId');
    $drives = ob_get_contents();
    ob_end_clean();
    $drives = preg_replace(array('/DeviceID/'), array(''), $drives);
    if ($drives !== false) {
        $arr = explode(':', $drives);
        foreach($arr as $key => $drive) {
            $drive = trim($drive);
            if ($drive === '') continue;
            /*get size*/
            $size = '--';
            /*add split token*/
            if ($value !== '') $value .= '__file##';

            /*add dir token*/
            $value .= '__drv##';

            /*add size*/
            $value .= $drive . ":__size##" . $size;
        }
    }
    return ($value);
}

function getFileSize ($os, $file_path, $isDir) {
    $size = false;
    if ($os === 'win') {
        $winFile = false;
        $winFileObj = new COM("Scripting.FileSystemObject");
        if (!$isDir && $winFileObj) {
            $winFile = $winFileObj->GetFile($file_path);
        }
        /*Can't find quick reliable folder size query for windows*/
        if ($winFile) $size = $winFile->Size;
    } else {
        if ($isDir) {
            /*works well, but can be slow*/
            //$size = exec('du -sb '.escapeshellarg($file_path).' | awk \'{print $1}\'');
        } else {
            $size = exec('stat -c %s '. escapeshellarg ($file_path));
        }
    }
    return $size;
}

function getTextFile($targetFile) {
    $text = '';
    if (file_exists($targetFile)) {
        $file = fopen($targetFile, "r");
        while (!feof($file)) {
            $text .= fgets($file, 4096);
        }
        fclose($file);
    }
    return utf8_encode($text);
}

function saveTextFile($content, $targetFile, $os) {
    $status = false;
    if (get_magic_quotes_gpc()) {
        $content = stripslashes($content);
    }
    if ($os === 'nix') {
        $content = str_replace(array(chr(13)), '', $content);
    }
    $out_stream = fopen($targetFile, "w+");
    if ($out_stream) {
        fwrite($out_stream, $content);
        fclose($out_stream);
        $status = true;
    }

    return $status;
}

function isViewable ($path) {
    $status = false;
    if ($handle = @opendir($path)) {
        closedir($handle);
        $status = true;
    }
    return $status;
}

function unzip ($file, $destination) {
    $zip = new ZipArchive;
    if ($zip->open($file) === true) {
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $zipItem = $zip->getNameIndex($i);
            if (!$zip->renameName($zip->getNameIndex($i), str_replace('\\', '/', $zip->getNameIndex($i)))) {
                return false;
            }
            if (!$zip->extractTo($destination, array($zip->getNameIndex($i)))) {
                return false;
            }
        }
        $zip->close();
    } else {
        return false;
    }
    return true;
}

function format_size($bytes) {
    if ($bytes < KILO) return $bytes . ' B';
    elseif ($bytes < MEGA) return round($bytes / KILO, 2) . ' KB';
    elseif ($bytes < GIGA) return round($bytes / MEGA, 2) . ' MB';
    elseif ($bytes < TERA) return round($bytes / GIGA, 2) . ' GB';
    else return round($bytes / TERA, 2) . ' TB';
}

?>
