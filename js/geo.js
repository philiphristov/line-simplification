/**
 * @module  Geo_Parser
 */
//@file Parses Coordinate Objects to Google Maps Geo Objects

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

function parseGeoData (string) {
	if(string.indexOf("MULTIPOLYGON") != -1){
		return parseMultiPolygon(string);
	}
	else if(string.indexOf("POLYGON") != -1){
		return parsePolygon(string);
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

function parsePolygon (string) {

	string = string.replace("POLYGON((","");
 	string = string.replace("))","");
	
	return new google.maps.Data.Polygon(parsePolygonCoords(string));
}

/**
 * @param {string} string 
 * 
 * @return {google.maps.Data.Polygon}
 */

function parseMultiPolygon (string) {
	string = string.replace("MULTIPOLYGON(((","");
 	string = string.replace(")))","");
	
	/**
	 * @type {Array<string>} 
	 */	
 	var polygons = string.split(")),((");
 	
 	polygons[0].replace("((", "");
 	polygons[polygons.length-1].replace("))", "");
 	
 	/**
 	 * @type {Array<Array<google.maps.LatLng>>} 
 	 */
 	var resultList = new Array();
 	
 	for (var i = 0; i < polygons.length; i++) {
		resultList = resultList.concat(parsePolygonCoords(polygons[i]));
 	}
 	return new google.maps.Data.Polygon(resultList);
}

/**
 * @param {string} string
 * 
 * @return {Array<Array<google.maps.LatLng>>} 
 */
function parsePolygonCoords (string){
	
	/**
	 * @type {Array<Array<google.maps.LatLng>>}
	 */
 	var coords = new Array();
	/**
	 * @type {Array<string>} 
	 */
	var polygons = string.split("),(");

	for (var /** number */ i = 0; i < polygons.length; i++) {
  		coords[i] = new Array();
  		var values = polygons[i].split(",");
		for (var /** number */ j = 0; j < values.length; j++) {
	 		var /** Array<string> */ coord = values[j].split(" ");
	 		coords[i].push(new google.maps.LatLng(coord[1] * 1, coord[0] * 1));
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