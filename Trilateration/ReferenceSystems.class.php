<?php
/**
 * Class to generate reference systems for trilateration
 *
 * No description
 *
 * @package EDTB\Backend
 * @author Mauri Kujala <contact@edtb.xyz>
 * @copyright Copyright (C) 2016, Mauri Kujala
 * @license http://www.gnu.org/licenses/old-licenses/gpl-2.0.html GNU Public License version 2
 */

 /*
 * ED ToolBox, a companion web app for the video game Elite Dangerous
 * (C) 1984 - 2016 Frontier Developments Plc.
 * ED ToolBox or its creator are not affiliated with Frontier Developments Plc.
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA
 */

/**
 * Generate reference systems for trilateration
 *
 * @author Mauri Kujala <contact@edtb.xyz>
 */
class ReferenceSystems
{
    /** @var bool $standard wether to use the standard set of references or not */
    public $standard = false;
    /** @var array $used reference systems already submitted */
    public $used = [];

    /**
     * ReferenceSystems constructor.
     */
    public function __construct()
    {
        global $server, $user, $pwd, $db;

        /**
         * Connect to MySQL database
         */
        $this->mysqli = new mysqli($server, $user, $pwd, $db);

        /**
         * check connection
         */
        if ($this->mysqli->connect_errno) {
            echo "Failed to connect to MySQL: " . $this->mysqli->connect_error;
        }
    }

    /**
     * Calculate optimal reference systems for trilateration
     *
     * @return array $references name => coordinates
     * @author Mauri Kujala <contact@edtb.xyz>
     */
    public function reference_systems()
    {
        try {
            /**
             * get "fuzziness" factor and coordinates
             */
            $start_point = $this->fuzziness();

            $start_name = $start_point["system_name"];
            $start_x = $start_point["x"];
            $start_y = $start_point["y"];
            $start_z = $start_point["z"];

            $fuzziness = $start_point["fuzziness"];

            /** @var string $esc_start_name Mysqli escaped system name */
            $esc_start_name = $this->mysqli->real_escape_string($start_name);

            /**
             * first, query the systems table to see if we can find enough reference systems inside the "fuzziness" bubble
             */
            $query = "  SELECT name, x, y, z
                        FROM edtb_systems
                        WHERE x BETWEEN (" . $start_x . " - " . $fuzziness . ") AND (" . $start_x . " + " . $fuzziness . ")
                        AND y BETWEEN (" . $start_y . " - " . $fuzziness . ") AND (" . $start_y . " + " . $fuzziness . ")
                        AND z BETWEEN (" . $start_z . " - " . $fuzziness . ") AND (" . $start_z . " + " . $fuzziness . ")
                        AND sqrt(pow((x-(" . $start_x . ")), 2)+pow((y-(" . $start_y . ")), 2)+pow((z-(" . $start_z . ")), 2)) < " . $fuzziness . "
                        AND name != '$esc_start_name'
                        ORDER BY sqrt(pow((x-(" . $start_x . ")), 2)+pow((y-(" . $start_y . ")), 2)+pow((z-(" . $start_z . ")), 2)) DESC";

            $result = $this->mysqli->query($query) or write_log($this->mysqli->error, __FILE__, __LINE__);
            $num = $result->num_rows;

            /**
             * if not enough reference systems are found, look outside the bubble
             */
            if ($num <= 4) {
                $result->close();

                $query = "  SELECT name, x, y, z
                            FROM edtb_systems
                            WHERE x NOT BETWEEN (" . $start_x . " - " . $fuzziness . ") AND (" . $start_x . " + " . $fuzziness . ")
                            AND y NOT BETWEEN (" . $start_y . " - " . $fuzziness . ") AND (" . $start_y . " + " . $fuzziness . ")
                            AND z NOT BETWEEN (" . $start_z . " - " . $fuzziness . ") AND (" . $start_z . " + " . $fuzziness . ")
                            AND sqrt(pow((x-(" . $start_x . ")), 2)+pow((y-(" . $start_y . ")), 2)+pow((z-(" . $start_z . ")), 2)) > " . $fuzziness . "
                            AND name != '$esc_start_name'
                            ORDER BY sqrt(pow((x-(" . $start_x . ")), 2)+pow((y-(" . $start_y . ")), 2)+pow((z-(" . $start_z . ")), 2)) ASC LIMIT 500";

                $result = $this->mysqli->query($query) or write_log($this->mysqli->error, __FILE__, __LINE__);
            }

            /**
             * read the results into an array
             */
            $i = 0;
            $pool = [];
            while ($obj = $result->fetch_object()) {
                $pool[$i]["name"] = $obj->name;
                $pool[$i]["x"] = $obj->x;
                $pool[$i]["y"] = $obj->y;
                $pool[$i]["z"] = $obj->z;

                $i++;
            }

            $result->close();

            /**
             * iterate over the different orders to get reference systems in all directions
             */
            $orders = array("z DESC", "z ASC", "x DESC", "x ASC");

            $references = [];
            foreach ($orders as $order) {
                Utility::orderBy($pool, $order);

                for ($is = 0; $is <= 4; $is++) {
                    if (!array_key_exists($pool[$is]["name"], $references) && !in_array($pool[$is]["name"], $this->used)) {
                        $references[$pool[$is]["name"]] = $pool[$is]["x"] . "," . $pool[$is]["y"] . "," . $pool[$is]["z"];
                        break;
                    }
                }
            }
        }
        catch (Exception $e) {
            echo 'Caught exception: ',  $e->getMessage(), "\n";
            /**
             *  If start point is not set, use standard set of references
             */
            $references = array("Sadr" => "-1794.69,53.6875,365.844",
                                "HD 1" => "-888.375,99.3125,-489.75",
                                "Cant" => "126.406,-249.031,87.7812",
                                "Nox"  => "38.8438,-17.7812,-63.875");
        }

        return $references;
    }

    /**
     * Define accuracy of current position
     *
     * Count how many jumps user has made since last known
     * coordinates and return a "fuzziness" factor
     *
     * @return array $value range in ly to use for reference systems
     * @throws Exception
     * @author Mauri Kujala <contact@edtb.xyz>
     */
    private function fuzziness()
    {
        /**
         * if user wants the standard references, we don't need any of this
         */
        if ($this->standard !== true) {
            $query = "  SELECT system_name
                        FROM user_visited_systems
                        ORDER BY visit DESC
                        LIMIT 30";

            $result = $this->mysqli->query($query) or write_log($this->mysqli->error, __FILE__, __LINE__);

            $count = $result->num_rows;

            if ($count > 0) {
                /**
                 * fetch user's last known system
                 */
                $last_known = last_known_system(true);
                /** @var string $last_known user's last known system */
                $last_known_name = $last_known["name"];

                if (!empty($last_known_name)) {
                    $num = 0;
                    $value = [];

                    /**
                     * loop for as long as it takes to find the last visited system with known cooords
                     */
                    while ($obj = $result->fetch_object()) {
                        $visited_system_name = $obj->system_name;

                        if ($visited_system_name == $last_known_name) {
                            break;
                        } else {
                            $num++;
                        }
                    }

                    $num = $num == 0 ? 1 : $num;
                    $fuzziness = $num * 40 + 20; // assuming a max range of 40 ly per jump (+ 20 ly just to be on the safe side)

                    $value["fuzziness"] = $fuzziness;
                    $value["system_name"] = $last_known_name;
                    $value["x"] = $last_known["x"];
                    $value["y"] = $last_known["y"];
                    $value["z"] = $last_known["z"];

                    $result->close();

                    return $value;
                } else {
                    throw new Exception('Cannot calculate fuzziness factor: no last known system');
                }
            } else {
                throw new Exception('Cannot calculate fuzziness factor: no visited systems');
            }
        }
        else {
            throw new Exception('Cannot calculate fuzziness factor: standard = true');
        }
    }
}
