var coordinates_arr;
var distance_arr = [];
var arr = [];
var values = [];


function get_polygon(polygoon_data){
	
	var coordinates_array = parseGeoData(polygoon_data);
	
	polygoon_data = polygoon_data.replace("POLYGON((","");
 	polygoon_data = polygoon_data.replace("))","");

 	var polygons = polygoon_data.split("),(");

	var main_array_whole_polygon = new Array();
	

	for(var i = 0; i < polygons.length; i++){
		var polygon = polygons[i];
		var values = polygon.split(",");
		var main_array = new Array();

		
		for(var j = 0; j<values.length; j++){
		 	var coord = values[j].split(" ");	 	
		 	var coords = {'x' : (coord[0]) * 1.0   , 'y' : (coord[1]) * 1.0, 'arr_index':j};//new google.maps.LatLng(coord[1] * 1, coord[0] * 1);		
			main_array.push(coords);		
		}
		
		main_array.splice(main_array.length-1,1);
		main_array_whole_polygon.push(main_array);

		
	}
		arr = main_array_whole_polygon;

	return main_array_whole_polygon;
}


function parse_data(polygon_data){	
	if (polygon_data.substring(0, 5) == "MULTI") {
    	return parse_multi_polygon(polygon_data);
	}else{
		return get_polygon(polygon_data);
	}
}


function parse_multi_polygon(string){
	
	string = string.replace("MULTIPOLYGON(((","");
 	string = string.replace(")))","");
		
	
 	var polygons = string.split(")),((");

	var main_array = new Array();


	for(j = 0; j < polygons.length; j++){
		var pol = polygons[j];
		var pol_split = pol.split("),(");
		var coords_arr = new Array();

		for(var i = 0; i < pol_split.length; i++){

			var p = pol_split[i];
			var values = p.split(",");
			var coords_arr_p = new Array();

				for(var z = 0; z<values.length; z++){
				 	var coord = values[z].split(" ");	 	
				 	var coords = {'x' : (coord[0]) * 1.0   , 'y' : (coord[1]) * 1.0, 'arr_index':z};	
					coords_arr_p.push(coords);		
				}
				coords_arr_p.splice(coords_arr.length-1,1);	
				coords_arr.push(coords_arr_p);	

		}
		main_array.push(coords_arr);

	}

 	return main_array;
}



function parse_coord_arr(main_array){

	var parsed_arr = [];
	for(var i = 0; i < main_array.length;i++){
		parsed_arr.push({'x' : parseFloat(main_array[i].lat())  , 'y' : parseFloat(main_array[i].lng())});
	}
	return parsed_arr;
}

var old_first_point = 0;
var old_last_point= 0;



function simplify_line(point_list,epsilon){
	var dmax = 0;
	var index = 0;

	var first_point = point_list[0];
	var last_point = point_list[point_list.length-1];

	var num;

	for(var i = 1; i <= point_list.length - 1; i++){ 
		num = i;

		var d = distToSegment(point_list[i], first_point, last_point);


		if(d > dmax){
			index = i;
			dmax = d;
		}
	}

	if(dmax > epsilon){

			var l1=point_list.slice(0, index+1);
	        var l2=point_list.slice(index);

	        var r1=simplify_line(l1,epsilon);
	        var r2=simplify_line(l2,epsilon);
	        
	        var rs=r1.slice(0,r1.length-1).concat(r2);
	        return rs;
					
	}else{	
			var returned_points = [first_point,last_point];

			return returned_points; // [first_point,last_point]
	}	

}

function simplify_polygon_line(multi_poly,epsilon){

	var multi_polygon_data = new Array();

	for(var i = 0; i < multi_poly.length;i++){
		var pol = multi_poly[i];
		var simplified_line = simplify_line(pol,epsilon);

		//repare if intersections accure
		//simplified_line = repair_intersections(simplified_line);

		//repare intersection using jsts
		// console.log(simplified_line);
		// var jstsCoordinates = simplified_line.map(function(pt) {
		// 	  return new jsts.geom.Coordinate(pt.x, pt.y);
		// });
		// jstsCoordinates[jstsCoordinates.length+1] = new jsts.geom.Coordinate(jstsCoordinates[0].x, jstsCoordinates[0].y)
		// convert_polygon(jstsCoordinates);

		multi_polygon_data.push(simplified_line);
	}
	
	return multi_polygon_data;
}




function simplify_multi_line(multi_poly,epsilon){

	var multi_polygon_data = new Array();

	for(var i = 0; i < multi_poly.length;i++){
		var pol = multi_poly[i];
		var coords = [];

		for(var j = 0; j < pol.length; j++){
			var simplified_line = simplify_line(pol[j],epsilon);

			//repare if intersections accure
			//simplified_line = repair_intersections(simplified_line);


			//repare intersection using jsts
			// var jstsCoordinates = simplified_line.map(function(pt) {
			//   return new jsts.geom.Coordinate(pt.x, pt.y);
			// });
			// jstsCoordinates[jstsCoordinates.length+1] = new jsts.geom.Coordinate(jstsCoordinates[0].x, jstsCoordinates[0].y)
			// convert_polygon(jstsCoordinates);
			
			
			coords.push(simplified_line);
		}

		multi_polygon_data.push(coords);
	}

	return multi_polygon_data;
}

function convert_polygon(array_coords){
	console.log(array_coords);
	// Create a GeometryFactory if you don't have one already
	var geometryFactory = new jsts.geom.GeometryFactory();;

	// Simply pass an array of Coordinate or a CoordinateSequence to its method
	var polygonFromCoordinates = geometryFactory.createPolygon(array_coords);
	var topologyPreservingSimplifier = new jsts.simplify.TopologyPreservingSimplifier(polygonFromCoordinates);
	//var simplified_polygon = topologyPreservingSimplifier.simplify(polygonFromCoordinates);
	console.log(topologyPreservingSimplifier.getResultGeometry());
	// console.log(polygonFromCoordinates instanceof jsts.geom.Polygon);
	// console.log(jsts_validate(polygonFromCoordinates));
}

/**
 * Get / create a valid version of the geometry given. If the geometry is a polygon or multi polygon, self intersections /
 * inconsistencies are fixed. Otherwise the geometry is returned.
 *
 * @param geom
 * @return a geometry
 */
function jsts_validate(geom) {
  if (geom instanceof jsts.geom.Polygon) {
    if (geom.isValid()) {
      geom.normalize(); // validate does not pick up rings in the wrong order - this will fix that
      return geom; // If the polygon is valid just return it
    }
    var polygonizer = new jsts.operation.polygonize.Polygonizer();
    jsts_addPolygon(geom, polygonizer);
    return jsts_toPolygonGeometry(polygonizer.getPolygons(), geom.getFactory());
  } else if (geom instanceof jsts.geom.MultiPolygon) {
    if (geom.isValid()) {
      geom.normalize(); // validate does not pick up rings in the wrong order - this will fix that
      return geom; // If the multipolygon is valid just return it
    }
    var polygonizer = new jsts.operation.polygonize.Polygonizer();

    for (var n = geom.getNumGeometries(); n > 0; n--) {
      jsts_addPolygon(geom.getGeometryN(n - 1), polygonizer);
    }
    return jsts_toPolygonGeometry(polygonizer.getPolygons(), geom.getFactory());
  } else {
    return geom; // In my case, I only care about polygon / multipolygon geometries
  }
}

/**
 * Add all line strings from the polygon given to the polygonizer given
 *
 * @param polygon polygon from which to extract line strings
 * @param polygonizer polygonizer
 */
var jsts_addPolygon = function(polygon, polygonizer) {
  jsts_addLineString(polygon.getExteriorRing(), polygonizer);

  for (var n = polygon.getNumInteriorRing(); n > 0; n--) {
    jsts_addLineString(polygon.getInteriorRingN(n), polygonizer);
  }
};

/**
 * Add the linestring given to the polygonizer
 *
 * @param linestring line string
 * @param polygonizer polygonizer
 */
var jsts_addLineString = function(lineString, polygonizer) {

  if (lineString instanceof jsts.geom.LinearRing) {
    // LinearRings are treated differently to line strings : we need a LineString NOT a LinearRing
    lineString = lineString.getFactory().createLineString(lineString.getCoordinateSequence());
  }

  // unioning the linestring with the point makes any self intersections explicit.
  var point = lineString.getFactory().createPoint(lineString.getCoordinateN(0));
  var toAdd = lineString.union(point); //geometry

  //Add result to polygonizer
  polygonizer.add(toAdd);
}

/**
 * Get a geometry from a collection of polygons.
 *
 * @param polygons collection
 * @param factory factory to generate MultiPolygon if required
 * @return null if there were no polygons, the polygon if there was only one, or a MultiPolygon containing all polygons otherwise
 */
var jsts_toPolygonGeometry = function(polygons, factory) {
  switch (polygons.size()) {
    case 0:
      return null; // No valid polygons!
    case 1:
      return polygons.iterator().next(); // single polygon - no need to wrap
    default:
      //polygons may still overlap! Need to sym difference them
      var iter = polygons.iterator();
      var ret = iter.next();
      while (iter.hasNext()) {
        ret = ret.symDifference(iter.next());
      }
      return ret;
  }
}

function debug_array(array){
	var polygonBounds = array.getPath();
	// Iterate over the polygonBounds vertices.
	polygonBounds.forEach(function(xy, i) {
	  contentString += '<br>' + 'Coordinate: ' + i + '<br>' + xy.lat() +',' + xy.lng();
	});
}


function rebuild_polygon_str(polygon_data){

	var start_polygon_data = "POLYGON(";
 	var end_polygon_data = ")";

 	var polygon_srt = start_polygon_data;
 	
 		for(var j = 0; j < polygon_data.length; j++){

			

	 		

	 		polygon_srt = polygon_srt + "(";
	 		var polygon_data_inner_polygon = polygon_data[j];

	 		var last_el = polygon_data_inner_polygon[polygon_data_inner_polygon.length-1].x + " " + polygon_data_inner_polygon[polygon_data_inner_polygon.length-1].y +",";

			polygon_srt =  polygon_srt + last_el;

		 	for(var i = 0; i < polygon_data_inner_polygon.length;i++){
		 		var coord = polygon_data_inner_polygon[i].x + " " + polygon_data_inner_polygon[i].y;

		 		if(i < polygon_data_inner_polygon.length - 1 ){
		 			polygon_srt = polygon_srt + coord + ",";
		 		}else{
		 			polygon_srt = polygon_srt + coord;
		 		}
		 	}
		 	

		 	if(j < polygon_data.length - 1 ){
		 			polygon_srt = polygon_srt + "),";
		 		}else{
		 			polygon_srt = polygon_srt + ")";
		 	}

		}


 	polygon_srt = polygon_srt + end_polygon_data;


 	return polygon_srt;

}


function rebuild_multipolygon_str(arr_polygon_data){
	var start_polygon_data = "MULTIPOLYGON(";
 	var end_polygon_data = ")";
 	

 	var polygon_srt = start_polygon_data;

 	for(var i = 0; i < arr_polygon_data.length; i++){
		polygon_srt = polygon_srt + "(";
			var poly = arr_polygon_data[i];

			for(var j = 0; j < poly.length; j++){

		 		polygon_srt = polygon_srt + "(";
		 		var polygon_data_inner_polygon = poly[j];

		 		var last_el = polygon_data_inner_polygon[polygon_data_inner_polygon.length-1].x + " " + polygon_data_inner_polygon[polygon_data_inner_polygon.length-1].y +",";

				polygon_srt =  polygon_srt + last_el;

				
				for(var z = 0; z < polygon_data_inner_polygon.length;z++){
				 		var coord = polygon_data_inner_polygon[z].x + " " + polygon_data_inner_polygon[z].y;

				 		if(z < polygon_data_inner_polygon.length - 1 ){
				 			polygon_srt = polygon_srt + coord + ",";
				 		}else{
				 			polygon_srt = polygon_srt + coord + "";
				 		}
				 }
			 	
				 if(j < poly.length - 1 ){
			 			polygon_srt = polygon_srt + "),";
			 		}else{
			 			polygon_srt = polygon_srt + ")";
			 	}

			}

		if(i < arr_polygon_data.length - 1 ){
		 			polygon_srt = polygon_srt + "),";
		}else{
		 			polygon_srt = polygon_srt + ")";
		}

	}
	polygon_srt = polygon_srt + end_polygon_data;

 	return polygon_srt;
}


function parse_to_lat_lng(point_list){
	var arr_lat_lng = [];

	for(var i=0;i<=point_list.length-1;i++){
		if(point_list[i]){
			var x = point_list[i].x;
			var y = point_list[i].y;

			
			var param = new google.maps.LatLng(x, y);
			//arr_lat_lng.push({'lat':y,'lng':x});
			arr_lat_lng.push(param);
		}
	}

	return arr_lat_lng;
}

function multipoly_parse_to_lat_lng(point_list){
	var arr_lat_lng = [];

	for(var i=0;i<=point_list.length-1;i++){
		var coords_poly = [];
		if(point_list[i]){
			var el = point_list[i];
			for(var j = 0; j <= el.length - 1; j++){
				var polygon_coords = el[j];
				var x = polygon_coords.x;
				var y = polygon_coords.y;

				
				var param = new google.maps.LatLng(x, y);
				coords_poly.push({'lat':x,'lng':y});
			}
			arr_lat_lng.push(coords_poly);
		}
	}
	return arr_lat_lng;
}



function sqr(x) { return x * x }

function dist2(v, w) { return sqr(v.x - w.x) + sqr(v.y - w.y) }

function distToSegmentSquared(p, v, w) {
  var l2 = dist2(v, w);
  if (l2 == 0) return dist2(p, v);
  var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return dist2(p, { x: v.x + t * (w.x - v.x),
                    y: v.y + t * (w.y - v.y) });
}

function distToSegment(p, v, w) { return Math.sqrt(distToSegmentSquared(p, v, w)); }





function parsePolygon (string) {

	string = string.replace("POLYGON((","");
 	string = string.replace("))","");
	
	return parsePolygonCoords(string);
}


function calculate_difference(arr,simplified_data){
	var num_points = 0;
	var num_simplified_points = 0;

	for(var i = 0; i <= arr.length; i++){
		num_points = num_points + arr[i].length;
	}

	for(var i = 0; i <= simplified_data.length; i++){
		num_simplified_points = num_simplified_points + simplified_data[i].length;
	}

	console.log("Number of points in polygon: " + num_points);
	console.log("Number of points in simplified polygon: " + num_simplified_points );
	console.log("Reduction: " + (100 - (num_simplified_points / num_points)*100) + " %");
}


// returns true iff the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
function intersects(a,b,c,d,p,q,r,s) {
  var det, gamma, lambda;
  det = (c - a) * (s - q) - (r - p) * (d - b);
  if (det === 0) {
    return false;
  } else {
    lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
    gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
  }
};


function repair_intersections(polyline){
	var reconstructed_polyline = [];

	for(i = 0; i < polyline.length; i++){
		var line_start = polyline[i];
		var line_end = polyline.slice((i+1)%polyline.length)[0] ; //polyline[(i+1)%polyline.length]  //array.slice((index+3)%array_length)[0]
		
		
		var surrounding_lines = get_points_around(polyline, i);

		if(check_for_intersection(line_start,line_end,surrounding_lines)){
			console.log("intersection!");
		}else{
			reconstructed_polyline.push(line_start);
		}
		
	}

	return reconstructed_polyline;
}

function get_points_around(array, index){
	var array_length = array.length;
	console.log([array.slice(index-6)[0],array.slice(index-5)[0],array.slice(index-4)[0],array.slice(index-3)[0],array.slice(index-2)[0],array.slice(index-1)[0],array.slice((index+1)%array_length)[0],array.slice((index+2)%array_length)[0],array.slice((index+3)%array_length)[0],array.slice((index+4)%array_length)[0],array.slice((index+5)%array_length)[0],array.slice((index+6)%array_length)[0]]);
	return [array.slice(index-6)[0],array.slice(index-5)[0],array.slice(index-4)[0],array.slice(index-3)[0],array.slice(index-2)[0],array.slice(index-1)[0],array.slice((index+1)%array_length)[0],array.slice((index+2)%array_length)[0],array.slice((index+3)%array_length)[0],array.slice((index+4)%array_length)[0],array.slice((index+5)%array_length)[0],array.slice((index+6)%array_length)[0]];
}

function check_for_intersection(line_start, line_end, surrounding_lines){
	var intersects_line =  false;

	for(j = 0; j< surrounding_lines.length; j++){
		if(intersects(line_start.x, line_start.y, line_end.x, line_end.y, surrounding_lines[j].x, surrounding_lines[j].y, surrounding_lines.slice((j+1)%surrounding_lines.length)[0].x, surrounding_lines.slice((j+1)%surrounding_lines.length)[0].y)){ // array.slice((index+3)%array_length)[0] // surrounding_lines[(j+1)%surrounding_lines.length].x
			return true;
		}else{
			intersects_line = false;
		}

	}

		return intersects_line;
}

function negArray(arr) {
  var dup = arr;

  return Proxy.create({
    set: function (proxy, index, value) {
      dup[index] = value;
    },
    get: function (proxy, index) {
        index = parseInt(index);
        return index < 0 ? dup[dummy.length + index] : dup[index];
    }
  });
}