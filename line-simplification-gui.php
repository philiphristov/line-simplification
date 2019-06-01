<?php

function line_simplification_menu(){

	?>
        <h1>Line Simplification</h1>
        <span> Location Category: <input id="location_category" value="" /></span><br>
        <span> Epsilon Value: <input id="epsilon_factor" value="0.0019" /></span><br>
        <span> Specific Location id: <input id="specific_location_id"  /></span><br>
        <span> Specific Location Hierarchy id: <input id="specific_location_hierarchy_id" value="1387554"/></span><br>
        <button id="simplify_polygons">Simplify and Save</button><br>

        <button id="display_simplified_polygons">Display simplied polygons </button><br>

        <div id="map"></div>





		<script type="text/javascript">
			init_map();
		</script>

<?php
}
