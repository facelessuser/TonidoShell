<?php
/*
    Tonido Shell
    This is the manin UI that is wrapped around a modified core of PHPShell 2.1
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
/*setup error handling*/
error_reporting(E_ALL);
ini_set('display_errors', 0);
include_once('modal/modalerror.php');
set_error_handler('modal_visual_error_handler');
register_shutdown_function('modal_visual_handle_shutdown');

/* Setup for Tonido Plug and Tonido Software */
$TonidoShellVer = 'VERSION';
$TonidoProfileDir = getenv('TONIDO_PROFILE_ROOTDIR') . "/plugindata";
$TonidoPluginDir = getenv('DOCUMENT_ROOT') . "APP_DIR";
$InstallDir = $TonidoProfileDir . "/APP_DIR";
$SessionDir = $InstallDir . "/sessions";
$SettingsDb = $InstallDir . "/settings.sqlite";
$EditorSettings = "preferences.ace-settings";
define('TONIDOSHELL', $TonidoShellVer);

/*Get URLs configuration*/
$UrlScheme = (@$_SERVER['HTTPS'] == 'on' || @$_SERVER['SERVER_PORT'] == 443) ? 'https' : 'http';
$UrlPort = (@$_SERVER['SERVER_PORT'] == 80) ? '' : ':' . $_SERVER['SERVER_PORT'];

/*Setup data dir to install settings*/
if (!file_exists($InstallDir)) {
    mkdir($InstallDir);
}
if (!file_exists($SessionDir)) {
    mkdir($SessionDir);
}

/*Create editor config if missing. Also, restore or backup config if required*/
function create_editor_settings($name) {
    $file = @fopen($name, 'w');
    if ($file != false) {
        $json = "{\n" .
        "    \"theme\": \"clouds\",\n" .
        "    \"fontSize\": 12,\n" .
        "    \"printMargin\": 80,\n" .
        "    \"showFoldWidgets\": true,\n" .
        "    \"highlightActiveLine\": true,\n" .
        "    \"showInvisibles\": false,\n" .
        "    \"persistentHorizScroll\": false,\n" .
        "    \"animateScrolling\": false,\n" .
        "    \"softWrap\": false,\n" .
        "    \"showGutter\": true,\n" .
        "    \"showPrintMargin\": true,\n" .
        "    \"softTab\": true,\n" .
        "    \"tabSize\": 4,\n" .
        "    \"highlightSelectedWord\": true,\n" .
        "    \"enableBehaviours\": true,\n" .
        "    \"fadeFoldWidgets\": true,\n" .
        "    \"customFileRules\": {},\n" .
        "    \"customThemes\": []\n" .
        "}\n";
        fwrite($file, $json);
        fclose($file);
    }
}

if (!file_exists($EditorSettings)) {
    create_editor_settings($EditorSettings);
} elseif (isset($_POST["backupacesettings"]) and $_POST["backupacesettings"] == "true"){
    copy($EditorSettings, $InstallDir . '/' . $EditorSettings);
} elseif (isset($_POST["restoreacesettings"]) && $_POST["restoreacesettings"] == "true") {
    if(file_exists($InstallDir . '/' . $EditorSettings)){
        copy($InstallDir . '/' . $EditorSettings, $EditorSettings);
    }
}

/*Initialize settings*/
function stripslashes_deep($value) {
    if (isset($value)) {
        $value = is_array($value) ? array_map('stripslashes_deep', $value) : stripslashes($value);
    }
    return $value;
}

if (get_magic_quotes_gpc()) {
    $_POST = stripslashes_deep($_POST);
}

/*initialize or open settings database*/
define('PDOPLUS', true);
include_once('tonidoshell/pdoplus.php');
include_once('tonidoshell/dbdefaults.php');

/*defaults*/
$defaults = $TSHELL_DEFAULTS;

/*actual settings*/
$settings = array();

$db = null;
$newDB = (!file_exists($SettingsDb)) ? true : false;
try {
    $db = new PDOPlus('sqlite:' . $SettingsDb);
    $db->addTable("settings", "Id INTEGER PRIMARY KEY, key TEXT, value TEXT");
    $db->addTable("aliases", "Id INTEGER PRIMARY KEY, key TEXT, value TEXT");
    $db->addTable("shellmarks", "Id INTEGER PRIMARY KEY, key TEXT, value TEXT");
    if ($newDB) {
        $db->setRecords('settings', $defaults);
        $db->setRecords('aliases', $ALIASES_DEFAULTS);
        $db->setRecords('shellmarks', $SHELLMARK_DEFAULTS);
    }

    // To be removed in future when sufficient time has elasped
    // Merge the old separate databases into one (settings.sqlite)
    if (file_exists($InstallDir . "/userconfig.sqlite")) {
        $olddb = new PDOPlus('sqlite:' . $InstallDir . "/userconfig.sqlite");

        $aliases    = array();
        $shellmarks = array();

        $result = $olddb->query('SELECT * FROM aliases');
        foreach($result as $entry) {
            $aliases[$entry['key']] = $entry['value'];
        }

        $result = $olddb->query('SELECT * FROM shellmarks');
        foreach($result as $entry) {
            $shellmarks[$entry['key']] = $entry['value'];
        }

        $db->setRecords('aliases', $aliases);
        $db->setRecords('shellmarks', $shellmarks);

        $olddb = null;
        unlink($InstallDir . "/userconfig.sqlite");
    }

    //get items from database and log missing or new items; add new items to settings
    $result = $db->getTable('settings');
    $remove = array();
    $add    = array();
    foreach($result as $entry) {
        if (!isset($defaults[$entry['key']])) {
            $remove[] = $entry['key'];
        } else {
            if (isset($_POST[$entry['key']])) {
                $settings[$entry['key']] = $_POST[$entry['key']];
                $add[$entry['key']]      = $_POST[$entry['key']];
            } else {
                $settings[$entry['key']] = $entry['value'];
            }
        }
    }
    foreach($defaults as $key => $value) {
        if (!isset($settings[$key])) {
            $add[$key]      = $value;
            $settings[$key] = $value;
        }
    }

    //remove  and add items from database
    if (count($add))    $db->setRecords('settings', $add);
    if (count($remove)) $db->deleteRecords('settings', $remove);

} catch(PDOException $e) {
    trigger_error('Exception : ' . $e->getMessage(), E_USER_WARNING);
}

function getJsShortcutObject ($value) {
    list($name, $ctrl, $alt, $shift, $meta, $key) = explode(':', $value);
    return ("{'name' : '$name',  'ctrl' :  $ctrl, 'alt' : $alt, 'shift' : $shift, 'meta' : $meta, 'key' : '$key'}");
}

/*shortcuts*/
list(
    $settings['shortcutcrumbjs'],
    $settings['shortcutsessionjs'],
    $settings['shortcutfocusjs'],
    $settings['shortcutshellmarkjs'],
    $settings['shortcutscrollupjs'],
    $settings['shortcutscrolldownjs']
) = array_map('getJsShortcutObject', array(
    $settings['shortcutcrumb'],
    $settings['shortcutsession'],
    $settings['shortcutfocus'],
    $settings['shortcutshellmark'],
    $settings['shortcutscrollup'],
    $settings['shortcutscrolldown']
));

/*non configurable settings*/
$settings['hostos']         = (strpos(strtolower(php_uname()), 'win') !== false) ? 'win' : 'nix';
$settings['scripturl']      = $UrlScheme . '://' . $_SERVER['HTTP_HOST'] . $UrlPort . '/dyn/APP_DIR/index.php';
$settings['embedurl']       = $UrlScheme . '://' . $_SERVER['HTTP_HOST'] . $UrlPort . '/ui/core/index.html#inline./dyn/APP_DIR/index.php';
$settings['documents']      = ($settings['hostos'] === 'win') ? addslashes($TonidoPluginDir . '\\document') : $TonidoPluginDir . '/document';
$settings['editorsettings'] = ($settings['hostos'] === 'win') ? addslashes($TonidoPluginDir . '\\' . $EditorSettings) : $TonidoPluginDir . '/' . $EditorSettings;
$settings['aceinstalled'] = 'true';
if (!file_exists('ace')) {
    $settings['useaceeditor'] = 'false';
    $settings['aceinstalled'] = 'false';
}

// Graphics for Tonidoshell
/*GRAPHICS*/

$db = null;
?>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <!--meta name="viewport" content="initial-scale=1.0, width=device-width"-->
    <title>Tonido Shell</title>
    <!--Load JS that must be present right away; the rest is deferred-->
    <script type="text/javascript" src="easyjs/easyjs.js"></script>
    <script type="text/javascript" src="modal/modal.js"></script>
    <script type="text/javascript" src="tonidoshell/tonidoshell.js"></script>
    <script type="text/javascript">
        shortcutSettings  = {
            'crumbbar'   : <?php echo $settings['shortcutcrumbjs'] ?>,
            'sessionbar' : <?php echo $settings['shortcutsessionjs'] ?>,
            'focusinput' : <?php echo $settings['shortcutfocusjs'] ?>,
            'shellmarks' : <?php echo $settings['shortcutshellmarkjs'] ?>,
            'scrollup'   : <?php echo $settings['shortcutscrollupjs'] ?>,
            'scrolldown' : <?php echo $settings['shortcutscrolldownjs'] ?>
        };
        version           = 'Tonido Shell <?php echo $TonidoShellVer ?>';
        hostOS            = '<?php echo $settings['hostos'] ?>';
        maxTab            = <?php echo $settings['maxtab'] ?>;
        scriptUrl         = '<?php echo $settings['scripturl'] ?>';
        embedUrl          = '<?php echo $settings['embedurl'] ?>';
        showcrumb         = <?php echo $settings['showcrumb'] ?>;
        showsession       = <?php echo $settings['showsession'] ?>;
        aceInstalled      = <?php echo $settings['aceinstalled'] ?>;
        useAceEditor      = (<?php echo $settings['useaceeditor'] ?> && aceInstalled);
        colorWinTitle     = '<?php echo $settings['titlecolor'] ?>';
        colorWinText      = '<?php echo $settings['titletextcolor'] ?>';
        colorTerm         = '<?php echo $settings['termcolor'] ?>';
        colorTermText     = '<?php echo $settings['termtextcolor'] ?>';
        colorTermAlpha    = '<?php echo $settings['termalpha'] ?>';
        busyMsg           = '<?php echo ($settings['response'] === 'true') ? 'Waiting for response...' : 'Processing command...' ?>';
        response          = '<?php echo ($settings['response'] === 'true') ? '1' : '0' ?>';
    </script>
</head>
<body style="background: url('background/<?php echo $settings['background'] ?>') top left repeat;">

    <div id="mainWindow" class="win_frame">
        <table cellpadding="0" cellspacing="0">
            <tr class="modal_top" style="background-color:<?php echo $settings['titlecolor'] ?>;">
                <td class="modal_T_L" ></td>
                <td class="modal_T_C">

                    <!-- Form Title Bar -->
                    <table id="mainTitleBar" class="win_frame win_main win_bar" cellpadding="0" cellspacing="0" >
                        <tr class="win_title" style="color:<?php echo $settings['titletextcolor'] ?>;" >
                            <td id="winTitleLeft" class="win_title">
                                <img id="winLogo" class="win_img_button" src="<?php echo $settings['ui']['winicon.png']?>"><label>Tonido Shell</label>
                            </td>
                            <td id="winTitleCenter" class="win_title" align="center" ondblclick="ts.resize();">
                                <label id="tshellTitle" ></label>
                            </td>
                            <td id="winTitleRight" class="win_title" >
                                <a href="javascript:void(0)" class="modal_close" title="Kill Session" onclick="ts.killSession();"></a>
                            </td>
                        </tr>
                    </table><!-- End Form Title Bar -->

                </td>
                <td class="modal_T_R" ></td>
            </tr>
            <tr class="modal_center">
                <td class="modal_C_L" ></td>
                <td class="modal_C_C" style="background:transparent;">

                    <!-- Menu Bar -->
                    <div id="menu" class="menu menuoff">
                        <ul class="level1">
                            <li><a href="javascript:void(0)" class="level1">File</a>
                                <ul>
                                    <li><a href="javascript:void(0)" onclick="ts.downloadFiles();">Download File(s)</a></li>
                                    <li><a href="javascript:void(0)" onclick="ts.uploadFile();">Upload File(s)</a></li>
                                    <li><a href="javascript:void(0)" onclick="ts.uploadFilePhp();">Upload File(s) [admin]</a></li>
                                    <li><a href="javascript:void(0)" onclick="ts.setExport();">Expand Output</a></li>
                                    <li><span><hr></span></li>
                                    <li><a href="javascript:void(0)" onclick="ts.killSession();">Exit (Close Session)</a></li>
                                </ul>
                            </li>
                        </ul>
                        <ul class="level1">
                            <li><a href="javascript:void(0)" class="level1">Edit</a>
                                <ul>
                                    <li><a href="javascript:void(0)" onclick="ts.editNewFile();">New Text Document</a></li>
                                    <li><a href="javascript:void(0)" onclick="ts.editFile();">Edit Text Document</a></li>
                                </ul>
                            </li>
                        </ul>
                        <ul class="level1">
                            <li><a href="javascript:void(0)" class="level1">View</a>
                                <ul>
<?php if($settings['showcrumb'] === "false") { ?>
                                    <li><a href="javascript:void(0)" onclick="ts.confirmChoice('Show breadcrumb bar by default?', 'showcrumb', true);">Show Breadcrumb Bar by Default</a></li>
<?php } else { ?>
                                    <li><a href="javascript:void(0)" onclick="ts.confirmChoice('Hide breadcrumb bar by default?', 'showcrumb', false);">Hide Breadcrumb Bar by Default</a></li>
<?php } ?>
<?php if($settings['showsession'] === "false") { ?>
                                    <li><a href="javascript:void(0)" onclick="ts.confirmChoice('Show session bar by default?', 'showsession', true);">Show Session Bar by Default</a></li>
<?php } else { ?>
                                    <li><a href="javascript:void(0)" onclick="ts.confirmChoice('Hide session bar by default?', 'showsession', false);">Hide Session Bar by Default</a></li>
<?php } ?>
                                </ul>
                            </li>
                        </ul>
                        <ul class="level1">
                            <li><a href="javascript:void(0)" class="level1">Settings</a>
                                <ul>
                                    <li><span><div class="arrow"></div><a href="javascript:void(0)">Change Colors</a></span>
                                        <ul>
                                            <li><a href="javascript:void(0)" onclick="ts.chooseColor('Select title bar color:', 'titlecolor', colorWinTitle);">Title Bar Color</a></li>
                                            <li><a href="javascript:void(0)" onclick="ts.chooseColor('Select title bar text color:', 'titletextcolor', colorWinText);">Title Bar Text Color</a></li>
                                            <li><a href="javascript:void(0)" onclick="ts.chooseColor('Select terminal color:', 'termcolor', colorTerm, colorTermAlpha);">Terminal Color</a></li>
                                            <li><a href="javascript:void(0)" onclick="ts.chooseColor('Select terminal text color:', 'termtextcolor', colorTermText);">Terminal Text Color</a></li>
                                        </ul>
                                    </li>
<?php if($settings['textshadow'] === "false") { ?>
                                    <li><a href="javascript:void(0)" onclick="ts.confirmChoice('Show text drop shadow?', 'textshadow', true);">Show Text Drop Shadow</a></li>
<?php } else { ?>
                                    <li><a href="javascript:void(0)" onclick="ts.confirmChoice('Hide text drop shadow?', 'textshadow', false);">Hide Text Drop Shadow</a></li>
<?php } ?>
                                    <li><a href="javascript:void(0)" onclick="ts.pickBackground(appDir+'/background/');">Change Background</a></li>
                                    <li><a href="javascript:void(0)" onclick="ts.setSessions();">Change Number of Sessions</a></li>
                                    <li><a href="javascript:void(0)" onclick="ts.showShortcutMgr();">Change Shortcuts</a></li>
                                    <li><span><div class="arrow"></div><a href="javascript:void(0)">Editor Settings</a></span>
                                        <ul>
<?PHP if ($settings['aceinstalled'] === "true") { ?>
<?php if($settings['useaceeditor'] === "false") { ?>
                                            <li><a href="javascript:void(0)" onclick="ts.confirmChoice('Enable Ace as the editor?', 'useaceeditor', true);">Enable Ace Editor</a></li>
<?php } else { ?>
                                            <li><a href="javascript:void(0)" onclick="ts.confirmChoice('Disable Ace as the editor?', 'useaceeditor', false);">Disable Ace Editor</a></li>
<?php } ?>
<?php if(file_exists($EditorSettings)) { ?>
                                            <li><a href="javascript:void(0)" onclick="ts.setEditFile('<?php echo $settings['editorsettings'] ?>');">Edit Ace Default Preferences</a></li>
                                            <li><a href="javascript:void(0)" onclick="ts.confirmChoice('Backup Ace Default Preferences?', 'backupacesettings', true);">Backup Ace Default Preferences</a></li>
<?php } ?>
<?php if(file_exists($InstallDir . '/' . $EditorSettings)) { ?>
                                            <li><a href="javascript:void(0)" onclick="ts.confirmChoice('Restore Ace Default Preferences?', 'restoreacesettings', true);">Restore Ace Default Preferences</a></li>
<?php } ?>
<?php } ?>
                                        </ul>
                                    </li>
<?php if($settings['response'] === "false") { ?>
                                    <li><a href="javascript:void(0)" onclick="ts.confirmChoice('Enable response?', 'response', true);">Enable Response</a></li>
<?php } else { ?>
                                    <li><a href="javascript:void(0)" onclick="ts.confirmChoice('Disable response?', 'response', false);">Disable Response</a></li>
<?php } ?>
                                </ul>
                            </li>
                        </ul>
                        <ul class="level1">
                            <li><a href="javascript:void(0)" class="level1">Help</a>
                                <ul>
                                    <li><a href="javascript:void(0)" onclick="ts.catFile('<?php echo $settings['documents'] ?>', 'MANUAL')">User Manual</a></li>
                                    <li><a href="javascript:void(0)" onclick="ts.catFile('<?php echo $settings['documents'] ?>', 'COPYING')">License</a></li>
                                    <li><a href="javascript:void(0)" onclick="ts.catFile('<?php echo $settings['documents'] ?>', 'CHANGELOG')">Change Log</a></li>
                                    <li><span><hr></span></li>
                                    <li><a href="javascript:void(0)" onclick="ts.showAbout();">About</a></li>
                                </ul>
                            </li>
                        </ul>
                    </div><!-- End Menu Bar Div -->

                    <!-- Crumb Bar -->
                    <div id="crumbbar" style="display:none;"></div><!-- End Crumb Bar -->
                    <!-- Session Bar -->
                    <div id="tabbar" style="display:none;"></div><!-- End Session Bar -->
                    <!-- Terminal -->
                    <div id="termWrap" >
                        <div id="terminal"
                             style="opacity: <?php echo ($settings['termalpha']/100)?>;
                                    filter: alpha(opacity=<?php echo $settings['termalpha'] ?>);
                                    background:<?php echo $settings['termcolor']?>;">
                             <div id="termSpacer" ></div>
                        </div>
                    </div><!-- End Terminal Div -->

                    <!-- Window Footer -->
                    <table class="win_frame" cellpadding="0" cellspacing="0">
                        <tr>
                            <td nowrap="nowrap" id="statusCell" class="footer_bar">
                                <div></div>
                            </td>
                            <td nowrap="nowrap" id="toolCell" class="footer_bar">
                                <div>
<?php if($settings['response'] === 'true') { ?>
                                    <input type="image"
                                           src="<?php echo $settings['ui']['resp_e.png']?>"
                                           title="Response enabled"
                                           style="vertical-align:middle;"
                                           onmousedown="ts.confirmChoice('Disable response?', 'response', false);return false;">
<?php } else { ?>
                                    <input type="image"
                                           src="<?php echo $settings['ui']['resp_d.png']?>"
                                           title="Response disabled"
                                           style="vertical-align:middle;"
                                           onmousedown="ts.confirmChoice('Enable response?', 'response', true);return false;">
<?php } ?>
                                </div>
                            </td>
                        </tr>
                    </table><!-- End Window Footer -->

                </td>
                <td class="modal_C_R"></td>
            </tr>
            <tr class="modal_bottom">
                <td class="modal_B_L"></td>
                <td class="modal_B_C"></td>
                <td class="modal_B_R"></td>
            </tr>
        </table>

    </div><!-- End win_frame Div -->
    <div id="termOverlay" class="pre_wrap" >
        <form name="shell" action="<?php echo $_SERVER['PHP_SELF'] ?>" method="post" >
            <!-- Input Settings -->
            <input type="hidden" name="response" id="response" value="<?php echo $settings['response'] ?>">
            <input type="hidden" name="titlecolor" id="titlecolor" value="<?php echo $settings['titlecolor'] ?>">
            <input type="hidden" name="titletextcolor" id="titletextcolor" value="<?php echo $settings['titletextcolor'] ?>">
            <input type="hidden" name="termcolor" id="termcolor" value="<?php echo $settings['termcolor'] ?>">
            <input type="hidden" name="termtextcolor" id="termtextcolor" value="<?php echo $settings['termtextcolor'] ?>">
            <input type="hidden" name="textshadow" id="textshadow" value="<?php echo $settings['textshadow'] ?>">
            <input type="hidden" name="termalpha" id="termalpha" value="<?php echo $settings['termalpha'] ?>">
            <input type="hidden" name="background" id="background" value="<?php echo $settings['background'] ?>">
            <input type="hidden" name="showcrumb" id="showcrumb" value="<?php echo $settings['showcrumb'] ?>">
            <input type="hidden" name="showsession" id="showsession" value="<?php echo $settings['showsession'] ?>">
            <input type="hidden" name="maxtab" id="maxtab" value="<?php echo $settings['maxtab'] ?>">
            <input type="hidden" name="shortcutcrumb" id="shortcutcrumb" value="<?php echo $settings['shortcutcrumb'] ?>">
            <input type="hidden" name="shortcutsession" id="shortcutsession" value="<?php echo $settings['shortcutsession'] ?>">
            <input type="hidden" name="shortcutfocus" id="shortcutfocus" value="<?php echo $settings['shortcutfocus'] ?>">
            <input type="hidden" name="shortcutshellmark" id="shortcutshellmark" value="<?php echo $settings['shortcutshellmark'] ?>">
            <input type="hidden" name="shortcutscrollup" id="shortcutscrollup" value="<?php echo $settings['shortcutscrollup'] ?>">
            <input type="hidden" name="shortcutscrolldown" id="shortcutscrolldown" value="<?php echo $settings['shortcutscrolldown'] ?>">
            <input type="hidden" name="useaceeditor" id="useaceeditor" value="<?php echo $settings['useaceeditor'] ?>">
            <input type="hidden" name="backupacesettings" id="backupacesettings" value="false">
            <input type="hidden" name="restoreacesettings" id="restoreacesettings" value="false">
            <input type="hidden" name="settings" id="settings">
            <!-- End Input Settings -->
            <table id="outputWrapper" border="0" class="pre_wrap"><tr><td>
                <pre id="output"
                     class="term_text <?php echo ($settings['textshadow'] === 'true')? 'term_text_shadow' : '' ?>"
                     style="color:<?php echo $settings['termtextcolor'] ?>;
                            width:100%;height:0px;visibility:hidden;"
                     ondblclick="ts.setExport();">
                </pre>
            </td></tr></table><!-- End Output Window -->
            <table id="commandLine" class="win_frame" cellpadding="0" cellspacing="0">
                <tr>
                    <td nowrap="nowrap">
                        <label id="userprompt"
                               class="term_text <?php echo ($settings['textshadow'] === 'true')? 'term_text_shadow' : '' ?>"
                               style="color:<?php echo $settings['termtextcolor'] ?>;">
                        </label>
                    </td>
                    <td id="cmdCell" >
                        <input id="command" name="command"
                               class="term_text <?php echo ($settings['textshadow'] === 'true')? 'term_text_shadow' : '' ?>"
                               style="color:<?php echo $settings['termtextcolor'] ?>;"
                               autocomplete="off"
                               type="text"
                               tabindex="1" >
                    </td>
                </tr>
            </table>
        </form>
    </div>
</body>
</html>
