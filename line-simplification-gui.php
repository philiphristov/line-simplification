<?php

function line_simplification_menu(){

	?>
        <h1>Line Simplification</h1>
        <span> Location Category: <input id="location_category" value="17" /></span>
        <span> Epsilon Value: <input id="epsilon_factor" value="0.0019" /></span>
        <span> Specific Location id: <input id="specific_location_id"/></span>
        <button id="simplify_polygons">Simplify and Save</button>

        <button id="display_simplified_polygons">Display simplied polygons </button>

        <div id="map"></div>





		<script type="text/javascript">
			init_map();
		</script>

<?php
}
