/**
 * @param {string} string
 *
 * @return {google.maps.Data.Point}
 */
function parsePoint(string) {
	string = string.replace("POINT(", "");
	string = string.replace(")", "");
	var /** Array<string> */ result = string.split(' ');
	if(result.length != 2)
		return null;
	return new google.maps.Data.Point(new google.maps.LatLng(result[1] * 1, result[0] * 1));
}

/**
 * @param {string} string 
 * 
 * @return {google.maps.Data.Geometry}
 */

function parseGeoDataArray (string) {
	if(string.indexOf("MULTIPOLYGON") != -1){
		return parseMultiPolygonArray(string);
	}
	else if(string.indexOf("POLYGON") != -1){
		return parsePolygonArray(string);
	}
	else if(string.indexOf("MULTILINESTRING") != -1){
		return parseMultiLineString(string);
	}
	else if(string.indexOf("LINESTRING") != -1){
		return parseLineString(string);
	}
	else if(string.indexOf("POINT") != -1){
		return parsePoint(string);
	}
	return null;
}

/**
 * @param {string} string
 * 
 * @return {google.maps.Data.Polygon}
 */

function parsePolygonArray (string) {

	string = string.replace("POLYGON((","");
 	string = string.replace("))","");
	
	polygons_arr = string.split("),(")

	var resultList = new Array();
	for (var i = 0; i < polygons_arr.length; i++) {
		polygons_arr[i] = polygons_arr[i].replace("((", "");
		polygons_arr[i] = polygons_arr[i].replace("))", "");
		resultList.push(parsePolygonCoordsArray(polygons_arr[i]));
	}

	//return parsePolygonCoordsArray(string);
	return [resultList];
}

/**
 * @param {string} string 
 * 
 * @return {google.maps.Data.Polygon}
 */

function parseMultiPolygonArray (string) {
	// Old Working, with the Error multipolygon
	// string = string.replace("MULTIPOLYGON(((","");
 // 	string = string.replace(")))","");
	
 // 	var polygons = string.split(")),((");
 	
 // 	polygons[0].replace("((", "");
 // 	polygons[polygons.length-1].replace("))", "");
 	
 // 	var resultList = new Array();
 	
 // 	for (var i = 0; i < polygons.length; i++) {
	// 	resultList = resultList.concat(parsePolygonCoordsArray(polygons[i]));
 // 	}
 // 	return resultList;



 	// NEW FOR JSON

	string = string.replace("MULTIPOLYGON(","");
 	string = string.slice(0, -1);
	
 	var polygons = string.split(")),((");
 	
 	multipolygon =  new Array();

 	for(var j = 0; j < polygons.length; j++){
 		polygons[j].replace("((", "");
 		polygons[j].replace("))", "");
	
 		polygons_arr = polygons[j].split("),(")

 		var resultList = new Array();
 		
 		for (var i = 0; i < polygons_arr.length; i++) {
 			polygons_arr[i] = polygons_arr[i].replace("((", "");
 			polygons_arr[i] = polygons_arr[i].replace("))", "");
			resultList.push(parsePolygonCoordsArray(polygons_arr[i]));
 		}

 		multipolygon.push(resultList)
 		
 	}

 	return multipolygon;
}

/**
 * @param {string} string
 * 
 * @return {Array<Array<google.maps.LatLng>>} 
 */
function parsePolygonCoordsArray (string){
	
	/**
	 * @type {Array<Array<google.maps.LatLng>>}
	 */
 	var coords = new Array();
	/**
	 * @type {Array<string>} 
	 */
	//console.log(string);
	var polygons = string.split("),(");
	//console.log(polygons);
	for (var /** number */ i = 0; i < polygons.length; i++) {
  		coords[i] = new Array();
  		var values = polygons[i].split(",");
		for (var /** number */ j = 0; j < values.length; j++) {
			//console.log(values[j]);
	 		var /** Array<string> */ coord = values[j].split(" ");
	 		coords[i].push([coord[0] * 1, coord[1] * 1]);
		}
 	}
 	return coords;
}

/**
 * @param {string} string
 * 
 * @return {Array<google.maps.LatLng>} 
 */
function parseLineCoords (string){
	/**
	 * @type {Array<google.maps.LatLng>} 
	 */
	var coords = new Array();
  	var values = string.split(",");
	for (var /** number */ j = 0; j < values.length; j++) {
	 	var /** Array<string> */ coord = values[j].split(" ");
	 	coords.push(new google.maps.LatLng(coord[1] * 1, coord[0] * 1));
 	}
 	return coords;
}

/**
 * @param {string} string
 * 
 * @return {google.maps.Data.MultiLineString} 
 */
function parseMultiLineString (string) {
	string = string.replace("MULTILINESTRING((","");
 	string = string.replace("))","");
	
	
	/**
	 * @type {Array<string>} 
	 */	
 	var polylines = string.split("),(");
 	/**
	 * @type {Array<Array<google.maps.LatLng>>} 
	 */
	var resultList = new Array(polylines.length);
 	
 	polylines[0].replace("(", "");
 	polylines[polylines.length-1].replace(")", "");
 	
 	for (var i = 0; i < polylines.length; i++) {
 		resultList[i] = parseLineCoords(polylines[i]);
 	}
 	return new google.maps.Data.MultiLineString(resultList);
}

/**
 * @param {string} string
 * 
 * @return {google.maps.Data.LineString} 
 */
function parseLineString (string) {
	string = string.replace("LINESTRING(","");
 	string = string.replace(")","");
	
 	return new google.maps.Data.LineString(parseLineCoords(string));
}