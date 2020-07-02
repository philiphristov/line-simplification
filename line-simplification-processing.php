<?php
/* 
Handling Ajax request from request_data.js
*/

/**
 * Get All polygons in specific category
 */
add_action('wp_ajax_nopriv_get_polygon_data', 'get_polygon_data');
add_action('wp_ajax_get_polygon_data', 'get_polygon_data');
function get_polygon_data(){
	global $db_obj;

	$polygon_category = $_POST['polygon_category'];

	$location_data = $db_obj->get_results("SELECT Id_Ort, AsText(Geodaten) As coordinates FROM orte WHERE Id_Kategorie = $polygon_category");
	$json_data = [];


	foreach ($location_data as $value) {

		$single_location_data = array(
				"id" => $value->Id_Ort,
				"coord" => strip_tags($value->coordinates)
		);
		array_push($json_data,$single_location_data);
	}

	echo json_encode($json_data);
	wp_die();
}

/**
 * Get All polygons data from an array of polygon ids
 */
add_action('wp_ajax_nopriv_get_corresponding_polygons', 'get_corresponding_polygons');
add_action('wp_ajax_get_corresponding_polygons', 'get_corresponding_polygons');
function get_corresponding_polygons(){
	global $db_obj;

	$polygon_id = $_REQUEST['polygon_id'];

	if(isset($_REQUEST['polygon_id_array'])){
		$polygon_arr = $_REQUEST['polygon_id_array'];
	}else{
		$polygon_arr = [];	
	}
	


	$polygon_ids = array_merge($polygon_id, $polygon_arr);

	$location_data = $db_obj->get_results("SELECT Id_Ort, AsText(Geodaten) As coordinates FROM orte WHERE Id_Ort in ( " . implode(", ", $polygon_ids) . "  )" );
	$json_data = [];


	foreach ($location_data as $value) {

		$single_location_data = array(
				"id" => $value->Id_Ort,
				"coordinates" => strip_tags($value->coordinates)
		);
		array_push($json_data,$single_location_data);
	}

	echo json_encode($json_data);
	wp_die();
}

/**
 * Gets Simplified Polygons from polygone_vereinfacht Table 
 * An epsilon needs to be specified along as searched polygon id/category
 * Possible Search options:
 * By polygon ID
 * By polygon Hierarchy (Id Ueberort)
 * By Polygon category
 */
add_action('wp_ajax_nopriv_get_simpl_polygon_data', 'get_simpl_polygon_data');
add_action('wp_ajax_get_simpl_polygon_data', 'get_simpl_polygon_data');
function get_simpl_polygon_data(){
	global $db_obj;

	// $display_data = $_REQUEST['display_data']

	$display_data = json_decode(stripslashes($_REQUEST["display_data"]), true)['display_data'];
	
	$polygon_category = $display_data['polygon_category'];
	$epsilon = $display_data['epsilon'];
	$specific_location = $display_data['specific_location'];
	$specific_location_hierarchy_id = $display_data['specific_location_hierarchy_id'];

	$all_simplified_polygons = $display_data['all_simplified_polygons'];
	
	if(filter_var($all_simplified_polygons, FILTER_VALIDATE_BOOLEAN)){
		$location_data = $db_obj->get_results("SELECT polygone_vereinfacht.Id_Ort, ST_AsText(polygone_vereinfacht.Geodaten) AS coordinates 
		FROM polygone_vereinfacht
		WHERE  polygone_vereinfacht.Epsilon = $epsilon");
	}else if(count($specific_location_hierarchy_id) != 0){
		$location_data = $db_obj->get_results("SELECT polygone_vereinfacht.Id_Ort, ST_AsText(polygone_vereinfacht.Geodaten) AS coordinates 
		FROM polygone_vereinfacht, orte, orte_hierarchien
		WHERE polygone_vereinfacht.Id_Ort = orte.Id_Ort AND orte_hierarchien.Id_Ueberort in ( " . implode(", ", $specific_location_hierarchy_id) . " )" . " AND orte.Id_Ort = orte_hierarchien.Id_Ort AND polygone_vereinfacht.Epsilon = $epsilon");
	}else if(strcmp($polygon_category, "") != 0){
		$location_data = $db_obj->get_results("SELECT polygone_vereinfacht.Id_Ort, ST_AsText(polygone_vereinfacht.Geodaten) AS coordinates 
		FROM polygone_vereinfacht, orte
		WHERE polygone_vereinfacht.Id_Ort = orte.Id_Ort AND orte.Id_Kategorie = $polygon_category AND polygone_vereinfacht.Epsilon = $epsilon
		");
	}else if(strcmp($specific_location, "") != 0){
		$location_data = $db_obj->get_results("SELECT polygone_vereinfacht.Id_Ort, ST_AsText(polygone_vereinfacht.Geodaten) AS coordinates 
		FROM polygone_vereinfacht, orte
		WHERE polygone_vereinfacht.Id_Ort = orte.Id_Ort AND polygone_vereinfacht.Epsilon = $epsilon AND orte.Id_Ort = $specific_location
		");
	}

	

	$json_data = [];


	foreach ($location_data as $value) {

		$single_location_data = array(
				"id" => $value->Id_Ort,
				"coord" => strip_tags($value->coordinates)
		);
		array_push($json_data,$single_location_data);
	}

	echo json_encode($json_data);
	wp_die();
}


/**
 * Get Array of Polygon Ids that satisfy the search createria:
 * Polygon Id
 * location hierarchy
 * location category
 */
add_action('wp_ajax_nopriv_send_location_info', 'send_location_info');
add_action('wp_ajax_send_location_info', 'send_location_info');
function send_location_info(){
	global $db_obj;

	$polygon_category = $_REQUEST["polygon_category"];
	$loc_id = $_REQUEST["specific_location"];
	$specific_location_hierarchy = $_REQUEST["specific_location_hierarchy"];

	if(strcmp($loc_id, "") != 0){
		$loc_id = $_REQUEST["specific_location"];
		$location_data = $db_obj->get_results("SELECT Id_Ort AS coordinates  FROM orte WHERE Id_Ort = $loc_id");
	}else if(strcmp($specific_location_hierarchy, "") != 0){
		$location_data = $db_obj->get_results("SELECT o.Id_Ort FROM orte o join orte_hierarchien o_h on o.Id_Ort = o_h.Id_Ort WHERE Id_Ueberort = $specific_location_hierarchy");
	}else{
		$location_data = $db_obj->get_results("SELECT Id_Ort FROM orte WHERE Id_Kategorie = $polygon_category");
	}
	
	$json_data = [];

	foreach ($location_data as $value) {
		array_push($json_data,$value->Id_Ort);
	}

	echo json_encode($json_data);
	wp_die();
}

add_action('wp_ajax_nopriv_get_ueberort_by_category', 'get_ueberort_by_category');
add_action('wp_ajax_get_ueberort_by_category', 'get_ueberort_by_category');
function get_ueberort_by_category(){
	global $db_obj;

	$polygon_category = $_REQUEST["category"];

	$location_data = $db_obj->get_results("SELECT  DISTINCT orte_hierarchien.Id_Ueberort as id_ueberort FROM `orte` 
		JOIN orte_hierarchien ON orte.Id_Ort = orte_hierarchien.Id_Ort 
		Where orte.Id_Kategorie = $polygon_category"); // orte_hierarchien.Id_Ort as id_ort,

	$json_data = [];

	foreach ($location_data as $value) {
		// if (array_key_exists($value->id_ueberort, $json_data)){
		// 	array_push($json_data[$value->id_ueberort], $value->id_ort);
		// }else{
		// 	$json_data[$value->id_ueberort] = [$value->id_ort];
		// }
		array_push($json_data, $value->id_ueberort);
	}

	echo json_encode($json_data);
	wp_die();
}


/**
 * Get Polygon ID and Coordinates by:
 * location id
 * location hierarchie
 */
add_action('wp_ajax_nopriv_get_hierarchy_polygons', 'get_hierarchy_polygons');
add_action('wp_ajax_get_hierarchy_polygons', 'get_hierarchy_polygons');
function get_hierarchy_polygons(){
	global $db_obj;

	$loc_id = $_REQUEST["specific_location"];
	$specific_location_hierarchy = $_REQUEST["specific_location_hierarchy"];

	if(strcmp($loc_id, "") != 0){
		$loc_id = $_REQUEST["specific_location"];
		$location_data = $db_obj->get_results("SELECT Id_Ort, ST_AsText(orte.Geodaten)  as coordinates FROM orte WHERE Id_Ort = $loc_id");
	}else if(!empty($specific_location_hierarchy)){
		$location_data = $db_obj->get_results("SELECT o.Id_Ort, ST_AsText(o.Geodaten) as coordinates FROM orte o join orte_hierarchien o_h on o.Id_Ort = o_h.Id_Ort WHERE Id_Ueberort in ( " . implode(", ", $specific_location_hierarchy) . " )");
	}
	
	$json_data = [];

	foreach ($location_data as $value) {
		$obj_data = array(
			"id" => $value->Id_Ort,
			"coordinates" => $value->coordinates
		);
		array_push($json_data, $obj_data);
	}

	echo json_encode($json_data);
	wp_die();
}

/**
 * Get Single polygon Data by ID
 */
add_action('wp_ajax_nopriv_send_json', 'send_json');
add_action('wp_ajax_send_json', 'send_json');
function send_json(){
	global $db_obj;

	$loc_id = $_REQUEST['location_data'];

	$location_data = $db_obj->get_results("SELECT AsText(Centroid(Geodaten)) AS center, Id_Ort, AsText(Geodaten) As coordinates   FROM orte WHERE Id_Ort = $loc_id");
	$json_data = [];


	foreach ($location_data as $value) {

		$loc_arr = array(
			"id" => $value->Id_Ort,
			"coord" => $value->coordinates,
			"center" => $value->center
		);

		array_push($json_data, $loc_arr);
	}

	echo json_encode($json_data);
	wp_die();
}



/**
 * Save simplified polygons in Table `polygone_vereinfacht`
 */
add_action('wp_ajax_nopriv_save_to_database', 'save_to_database');
add_action('wp_ajax_save_to_database', 'save_to_database');
function save_to_database(){
	global $db_obj;

	set_time_limit(500);
	//INSERT INTO polygone_vereinfacht (Id_Ort, Geodaten,Epsilon) VALUES ($loc_id, ST_GeomFromText($location_data),$epsilon)
	// $id_data = $_REQUEST["id_data"];
	// $location_data = (string) stripcslashes((string)$_REQUEST["location_data"]);
	// $epsilon = $_REQUEST["epsilon"];

	$geo_data_array = json_decode(stripslashes($_REQUEST["geo_data_to_save"]), true)['locations_data'];

	$query_status = "";

	for ($i=0; $i < count($geo_data_array) ; $i++) { 
		$geo_data = $geo_data_array[$i];

		$id_data 	   = $geo_data["id"];
		$location_data = $geo_data["location_data"];
		$epsilon  	   = $geo_data["epsilon"];

		$latest_id = $id_data;
		
		if (check_polygon_exists($id_data, $epsilon)){
			$sql = ("UPDATE `polygone_vereinfacht` SET 
				`Id_Ort` = $id_data,
				`Geodaten` = ST_GeomFromText('".$location_data."'),
				`Epsilon` = $epsilon,
				`Mittelpunkt`=  ST_Centroid(ST_GeomFromText('".$location_data."')) 
				 WHERE polygone_vereinfacht.Id_Ort = $id_data LIMIT 1 " );
				error_log(print_r("Updating Polygon Data $id_data", true));
		}else{
			$sql = ("INSERT INTO `polygone_vereinfacht` (`Id_Ort`, `Geodaten`, `Epsilon`, `Mittelpunkt`) values ($id_data, ST_GeomFromText('".$location_data."'), $epsilon, ST_Centroid(ST_GeomFromText('".$location_data."')))" );
			error_log(print_r("Creating Polygon Data $id_data", true));
		}

		

		$query_status = $db_obj->query($sql);
	}

	echo json_encode([$query_status,$latest_id ]);
	wp_die();
}

/**
 * Get Array of polygon Ids from a specific category
 */
add_action('wp_ajax_nopriv_get_all_hierarchies', 'get_all_hierarchies');
add_action('wp_ajax_get_all_hierarchies', 'get_all_hierarchies');
function get_all_hierarchies(){
	global $db_obj;
	$category = $_REQUEST['category'];

	$hierarchy_ids = [];

	$location_data = $db_obj->get_results("SELECT DISTINCT Id_Ort FROM orte WHERE orte.Id_Kategorie = $category");

	// if(strcmp($category, "") != 0){
	// 	$location_data = $db_obj->get_results("SELECT DISTINCT Id_Ueberort FROM orte_hierarchien, orte WHERE orte.Id_Ort = orte_hierarchien.Id_Ueberort AND orte.Id_Kategorie = $category");
	// }else{
	// 	$location_data = $db_obj->get_results("SELECT DISTINCT Id_Ueberort FROM orte_hierarchien");

	// }

	foreach ($location_data as $value) {
		array_push($hierarchy_ids, $value->Id_Ort);
	}
		

	echo json_encode($hierarchy_ids);
	wp_die();
}

function check_polygon_exists($polygon_id, $epsilon){
	global $db_obj;
	$already_exists = false;

	$location_check = $db_obj->get_results("SELECT Id_Ort FROM polygone_vereinfacht WHERE polygone_vereinfacht.Id_Ort = $polygon_id AND polygone_vereinfacht.Epsilon = $epsilon ");

	if (!empty($location_check)) {
		$already_exists = true;
	}

	return $already_exists;
}