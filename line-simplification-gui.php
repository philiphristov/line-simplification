<?php

function line_simplification_menu(){

	?>
        <!-- <h1></h1> -->
        <!-- <span> Location Category: <input id="location_category" value="" /></span><br>
        <span> Specific Location Hierarchy id: </span><br>
        <span> Specific Location id: <input id="specific_location_id"  /></span><br> -->
        <!-- 180986 180992 180997   180996 180948  180800 -->
        <!-- <span> Epsilon Value: <input id="epsilon_factor" value="0.0009" /></span><br> --> 
        <!-- <span>All location hierarchies <input id="all_locations" type="checkbox"></span><br><br> -->

        <table>
                <th>Polygon Simplification Parameters</th>
                <tr><td>Location Category: </td><td><input id="location_category" value="" /></td></tr>
                <tr><td>Specific Location Hierarchy id:</td><td><input id="specific_location_hierarchy_id" value=""/></td></tr>
                <tr><td>Specific Location id:</td><td><input id="specific_location_id"  /></td></tr>
                <tr><td>Epsilon Value:</td><td><input id="epsilon_factor" value="0.0009" /></td></tr>
        </table>
        <br>
        <div>
                Simplify Polygons by ID/Category - Takes longer because it calculates neighbouring polygons
                <br>
                <button id="simplify_polygons">Simplify and Save</button>
        </div>
        <br>
        <div>
                Simplify Polygons by Category - Using existing Polygon neighbourhood Calculations to speedup Simplification 
                (a txt File needs to be placed in the main directory of the plugin with the name scheme neighbours_{polygon category}_all.txt )
                <br>
                <button id="simplify_polygons_json">Simplify JSON Polygons</button><br>
        </div>
        <br>
        <div>
                Display Simplified Polygons
                <br>
        <button id="display_simplified_polygons">Display simplied polygons </button><br>
        </div>
        <br>
        
        <div id="loading"></div>
        <div id="map"></div>





		<script type="text/javascript">
			init_map();
		</script>

<?php
}
