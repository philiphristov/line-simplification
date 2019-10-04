<?php
/* 
Hadling Ajax request from request_data.js
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

add_action('wp_ajax_nopriv_get_simpl_polygon_data', 'get_simpl_polygon_data');
add_action('wp_ajax_get_simpl_polygon_data', 'get_simpl_polygon_data');
function get_simpl_polygon_data(){
	global $db_obj;

	$polygon_category = $_POST['polygon_category'];
	$epsilon = $_POST['epsilon'];
	$specific_location = $_POST['specific_location'];
	$specific_location_hierarchy_id = $_POST['specific_location_hierarchy_id'];

	error_log('Epsilon: ' . $epsilon);
	error_log('Hierarchie: ' . $specific_location_hierarchy_id);
	error_log('Cat: ' . $polygon_category);
	error_log('Specific: ' . $specific_location);
	

	if(strcmp($specific_location_hierarchy_id, "") != 0){
		error_log('Hierarchie');
		$location_data = $db_obj->get_results("SELECT polygone_vereinfacht.Id_Ort, ST_AsText(polygone_vereinfacht.Geodaten) AS coordinates 
		FROM polygone_vereinfacht, orte, orte_hierarchien
		WHERE polygone_vereinfacht.Id_Ort = orte.Id_Ort AND orte_hierarchien.Id_Ueberort = $specific_location_hierarchy_id  AND orte.Id_Ort = orte_hierarchien.Id_Ort AND polygone_vereinfacht.Epsilon = $epsilon");
	}else if(strcmp($polygon_category, "") != 0){
		error_log('Category');
		$location_data = $db_obj->get_results("SELECT polygone_vereinfacht.Id_Ort, ST_AsText(polygone_vereinfacht.Geodaten) AS coordinates 
		FROM polygone_vereinfacht, orte
		WHERE polygone_vereinfacht.Id_Ort = orte.Id_Ort AND orte.Id_Kategorie = $polygon_category AND polygone_vereinfacht.Epsilon = $epsilon
		");
	}else if(strcmp($specific_location, "") != 0){
		error_log('specific');
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


add_action('wp_ajax_nopriv_get_hierarchy_polygons', 'get_hierarchy_polygons');
add_action('wp_ajax_get_hierarchy_polygons', 'get_hierarchy_polygons');
function get_hierarchy_polygons(){
	global $db_obj;

	$polygon_category = $_REQUEST["polygon_category"];
	$loc_id = $_REQUEST["specific_location"];
	$specific_location_hierarchy = $_REQUEST["specific_location_hierarchy"];

	if(strcmp($loc_id, "") != 0){
		$loc_id = $_REQUEST["specific_location"];
		$location_data = $db_obj->get_results("SELECT Id_Ort, ST_AsText(orte.Geodaten)  as coordinates FROM orte WHERE Id_Ort = $loc_id");
	}else if(strcmp($specific_location_hierarchy, "") != 0){
		$location_data = $db_obj->get_results("SELECT o.Id_Ort, ST_AsText(o.Geodaten) as coordinates FROM orte o join orte_hierarchien o_h on o.Id_Ort = o_h.Id_Ort WHERE Id_Ueberort = $specific_location_hierarchy");
	}else{
		$location_data = $db_obj->get_results("SELECT Id_Ort, ST_AsText(orte.Geodaten) as coordinates FROM orte WHERE Id_Kategorie = $polygon_category");
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




add_action('wp_ajax_nopriv_save_to_database', 'save_to_database');
add_action('wp_ajax_save_to_database', 'save_to_database');
function save_to_database(){
	global $db_obj;

	//INSERT INTO polygone_vereinfacht (Id_Ort, Geodaten,Epsilon) VALUES ($loc_id, ST_GeomFromText($location_data),$epsilon)
	$id_data = $_REQUEST["id_data"];
	$location_data = (string) stripcslashes((string)$_REQUEST["location_data"]);
	//$location_data = ($_REQUEST["location_data"]);
	$epsilon = $_REQUEST["epsilon"];

	$sql = ("INSERT INTO `polygone_vereinfacht` (`Id_Ort`, `Geodaten`, `Epsilon`, `Mittelpunkt`) values ($id_data, ST_GeomFromText('".$location_data."'), $epsilon, ST_Centroid(ST_GeomFromText('".$location_data."')))");

	$db_obj->query($sql);


	echo json_encode("saved");
	wp_die();
}

add_action('wp_ajax_nopriv_get_all_hierarchies', 'get_all_hierarchies');
add_action('wp_ajax_get_all_hierarchies', 'get_all_hierarchies');
function get_all_hierarchies(){
	global $db_obj;

	$hierarchy_ids = [];

	$location_data = $db_obj->get_results("SELECT DISTINCT Id_Ueberort FROM orte_hierarchien");

	foreach ($location_data as $value) {
		array_push($hierarchy_ids, $value->Id_Ueberort);
	}
		

	echo json_encode($hierarchy_ids);
	wp_die();
}