<?php

function line_simplification_menu(){

	?>
        <h1>Line Simplification</h1>
        <span> Location Category: <input id="location_category" value="" /></span><br>
        <span> Specific Location Hierarchy id: <input id="specific_location_hierarchy_id" value=""/></span><br>
        <span> Specific Location id: <input id="specific_location_id"  /></span><br> 
        <!-- 180986 180992 180997   180996 180948  180800-->
        <span> Epsilon Value: <input id="epsilon_factor" value="0.0009" /></span><br>
        <!-- <span>All location hierarchies <input id="all_locations" type="checkbox"></span><br><br> -->
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
