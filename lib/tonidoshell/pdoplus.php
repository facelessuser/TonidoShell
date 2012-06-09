<?php if (!defined('PDOPLUS')) exit();
/*
    pdoplus.php
    An extended PDO object with some simple functions
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

class PDOPlus extends PDO {
    public function __construct($dsn, $username=null, $password=null, $driver_options=null) {
        parent::__construct($dsn, $username, $password, $driver_options);
    }

    public function getTable($table) {
        return (parent::query('SELECT * FROM ' . $table));
    }

    public function addTable ($table, $params) {
        parent::exec("CREATE TABLE IF NOT EXISTS " . $table . "(" . $params . ");");
    }

    public function setRecords ($table, $input) {
        $stmt = parent::prepare("SELECT key, value FROM " . $table);
        $stmt->execute();
        $result = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
        foreach($input as $key => $value) {
            if (in_array($key, $result)) {
                $stmt = parent::prepare("UPDATE " . $table . " SET value=:value WHERE key=:key");
                $this->insertItems($stmt, array($key => $value));
            } else {
                $stmt = parent::prepare("INSERT INTO " . $table . "(key,value) VALUES (:key,:value);");
                $this->insertItems($stmt, array($key => $value));
            }
        }
    }

    public function deleteRecords ($table, $input) {
        if ( (array) $input !== $input ) $input = array($input);
        foreach($input as $key) {
            $stmt = $this->prepare("DELETE FROM " . $table . " WHERE key=:key");
            $stmt->bindParam(':key', $key);
            $stmt->execute();
        }
    }

    private function insertItems ($stmt, $input) {
        foreach ($input as $key => $value) {
            $stmt->bindParam(':key', $key);
            $stmt->bindParam(':value', $value);
            $stmt->execute();
        }
    }
}
?>
