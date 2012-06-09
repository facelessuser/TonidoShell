<?php
/*
    dbdefaults.php
    Default settings for Tonido Shell
    Copyright 2012 Isaac Muse

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

$TSHELL_DEFAULTS = array(
    'response'           => "true",
    'useaceeditor'       => "true",
    'titlecolor'         => "rgb(0,0,0)",
    'titletextcolor'     => "rgb(255,255,255)",
    'termcolor'          => "rgb(65,105,225)",
    'termtextcolor'      => "rgb(255,255,255)",
    'textshadow'         => "true",
    'background'         => "weave.gif",
    'showcrumb'          => "false",
    'showsession'        => "false",
    'termalpha'          => "100",
    'maxtab'             => "2",
    'shortcutcrumb'      => "crumbbar:true:false:true:false:b",
    'shortcutsession'    => "sessionbar:true:false:true:false:s",
    'shortcutfocus'      => "focusinput:true:false:true:false:i",
    'shortcutshellmark'  => "shellmarks:true:false:true:false:m",
    'shortcutscrollup'   => "scrollup:true:false:false:false:Up",
    'shortcutscrolldown' => "scrolldown:true:false:false:false:Down"
);

$ALIASES_DEFAULTS = array('ls' => 'ls -CvhF', 'll' => 'ls -lvhF');

$SHELLMARK_DEFAULTS =  array("hello" => "echo 'Hello World!'");
?>
