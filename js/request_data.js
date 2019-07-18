var simplified_data;
var locations_info;
var csv = "Id_Geo,GeoData\n";
var id_last;
var next_index;
var error;
var check_index;

polygons_to_simplify = {};

jQuery(document).ready(function(){

  jQuery("#display_simplified_polygons").on("click", function(){
    var polygon_category               = jQuery("#location_category").val();
    var epsilon_value                  = jQuery("#epsilon_factor").val();
    var specific_location              = jQuery("#specific_location_id").val();
    var specific_location_hierarchy_id = jQuery("#specific_location_hierarchy_id").val();

    console.log(epsilon_value + ",   " +  specific_location_hierarchy_id);

    if(polygon_category && epsilon_value && specific_location){
      //Display single specific locatation
      request_and_display_gemeinden("", epsilon_value, specific_location, "");
    }else if(polygon_category && epsilon_value){
      //Display Category
      request_and_display_gemeinden(polygon_category, epsilon_value,"", "");
    }else if (specific_location_hierarchy_id && epsilon_value){
      //Display locations by location hierarchy
      request_and_display_gemeinden("", epsilon_value,"", specific_location_hierarchy_id);
    }else{
      jQuery("#location_category").val("");
      jQuery("#epsilon_factor").val("");
    }
    
  })


  

  jQuery("#simplify_polygons").on("click", function(){
    var polygon_category            = jQuery("#location_category").val();
    var epsilon_value               = jQuery("#epsilon_factor").val();
    var specific_location           = jQuery("#specific_location_id").val();
    var specific_location_hierarchy = jQuery("#specific_location_hierarchy_id").val();

    if((polygon_category || specific_location || specific_location_hierarchy) && epsilon_value ){
      //working simplification algorithm
      // request_gemeinden_jq(polygon_category,epsilon_value,specific_location,specific_location_hierarchy);

      //TODO adjust algorithm to eliminate misallighment/holes/overlaps
      parse_hierarchy_polygons(polygon_category,epsilon_value,specific_location,specific_location_hierarchy);
   }else{
      jQuery("#location_category").val("");
      jQuery("#epsilon_factor").val("");
   }

  })

})


/*
Get polygons ids by gategory, simplify and save to database
*/
function request_gemeinden_jq(polygon_category, epsilon_val, specific_location, specific_location_hierarchy){
  jQuery.ajax({
         url: ajaxurl, 
         data:{
          action: "send_location_info",
          polygon_category : polygon_category,
          specific_location : specific_location,
          specific_location_hierarchy: specific_location_hierarchy
         },
         success: function(result){
         locations_info = JSON.parse(result);
         console.log("Array POlygon ids:");
         console.log(locations_info);
         request_data_qj(locations_info[0],epsilon_val); 
      }});
}

function parse_hierarchy_polygons(polygon_category, epsilon_val, specific_location, specific_location_hierarchy){
  jQuery.ajax({
         url: ajaxurl, 
         data:{
          action: "get_hierarchy_polygons",
          polygon_category : polygon_category,
          specific_location : specific_location,
          specific_location_hierarchy: specific_location_hierarchy
         },
         success: function(result){
         locations_info = JSON.parse(result);
         console.log("hierarchy polygons:");
         console.log(locations_info);

         for (var i = 0; i < locations_info.length; i++) {
          polygon = locations_info[i].coordinates;
          polygon1_id = locations_info[i].id;

           for (var j = 0; j < locations_info.length; j++) {
            if(i != j){
              polygon_to_compare = locations_info[j].coordinates;
              polygon2_id = locations_info[j].id;
              find_intersections(polygon, polygon1_id, polygon_to_compare, polygon2_id);
            }
           }
         }

         console.log(polygons_to_simplify);
         // display_polygon_intersections(polygons_to_simplify);
         rebuild_polygons();

         //display_simplified(polygons_to_simplify);

      }});
}

function find_intersections(polygon1, pol1_id, polygon2, pol2_id){
  

  var pol1_coord = parseGeoDataArray(polygon1)
  var pol2_coord = parseGeoDataArray(polygon2)

  try{

    var pol1 = turf.polygon(pol1_coord)
    var pol2 = turf.polygon(pol2_coord)

    var intersection = turf.intersect(pol1, pol2);

    if(intersection){

      if(polygons_to_simplify.hasOwnProperty(pol1_id)){

        if(!polygons_to_simplify[pol1_id].intersection.hasOwnProperty(pol2_id)){
          polygons_to_simplify[pol1_id].intersection[pol2_id] = intersection
        }

      }else{

        var arr = new Array();
        var intersection_object = new Object();
        arr.push(intersection);
        intersection_object[pol2_id] = intersection

        polygons_to_simplify[pol1_id] = {intersection: intersection_object, polygon: pol1};

      }

      if(polygons_to_simplify.hasOwnProperty(pol2_id)){

        if(!polygons_to_simplify[pol2_id].intersection.hasOwnProperty(pol1_id)){
          polygons_to_simplify[pol2_id].intersection[pol1_id] = intersection
        }

      }else{

        var arr = new Array();
        var intersection_object = new Object();
        arr.push(intersection);
        intersection_object[pol1_id] = intersection

        polygons_to_simplify[pol2_id] = {intersection: intersection_object, polygon: pol2};
      }

      
    }

  }catch(e){
    console.log(e)
  }
}

function rebuild_polygons(){
  for (var pol_id in polygons_to_simplify) {
    if (polygons_to_simplify.hasOwnProperty(pol_id)) {
      var intersections = polygons_to_simplify[pol_id].intersection
      var polygon = polygons_to_simplify[pol_id].polygon;
      polygons_to_simplify[pol_id]['simplified'] = new_simplify_and_perserve(polygon, intersections);
    }
  }
}


function new_simplify_and_perserve(multipolygon, intersections){

  var reconstructed_polygon = new Array();
  var intersections_arr = new Object()
  var options = {tolerance:  0.0006, highQuality: true, mutate: true};
  var multiline_coordinates = new Array();
  var multipolygon = multipolygon.geometry.coordinates;

  // parse intersections linestrings to arrays of coordinates
  for (intersection in intersections){
    if(intersections.hasOwnProperty(intersection)){
      var multilinestring = intersections[intersection].geometry.coordinates

      for(var i=0; i < multilinestring.length; i++){
        if(multilinestring.length > 2){
          var coords = multilinestring[i][0]
        }else{
          var coords = multilinestring[i]
          if(!isNaN(multilinestring[i])){
            coords = [multilinestring[0], multilinestring[1]]
          }
        }

        if(intersections_arr.hasOwnProperty(intersection)){
          intersections_arr[intersection].push([coords[0], coords[1]]);
        }else{
          arr = new Array();
          arr.push([coords[0], coords[1]]);
          intersections_arr[intersection] = arr;
        }
      }
      
      var last_coords = multilinestring[multilinestring.length - 1][1]

      if(multilinestring.length > 2){

        if(intersections_arr.hasOwnProperty(intersection)){
          intersections_arr[intersection].push([last_coords[0], last_coords[1]]);
        }else{
          arr = new Array();
          arr.push([last_coords[0], last_coords[1]]);
          intersections_arr[intersection] = arr;
        }
      }else{
      }

    }
  }

  // compute outer linestrings of each polygon by substracting intersections from all polygon coodinates
  var multiline_coordinates =[construct_outer_lines(multipolygon, intersections_arr)];

  // simplify and display outher poligon linestrings
  for (var i = 0; i <  multiline_coordinates.length; i++) {
    var line_coordinates = multiline_coordinates[i];
    for (line in line_coordinates){
      if(line_coordinates.hasOwnProperty(line)){
          if(line_coordinates[line].length > 2){
          
          var current_line = line_coordinates[line];

          var simplify_ = simplify(current_line, 0.0003, true);

          var line_string = turf.lineString(current_line)
          var line_string = turf.lineString(simplify_)

          // display_feature(line_string)

          reconstructed_polygon.push(line_string);
        }else{
          var current_line = line_coordinates[line];
          reconstructed_polygon.push(current_line)
        }
      }
    }
  }

  // simplify and display intersection linestring of each polygon
  for (intersection in intersections_arr){
    if(intersections_arr.hasOwnProperty(intersection)){
      // var simplified = turf.simplify(intersections_arr[intersection], options);

      var simplify_ = simplify(intersections_arr[intersection], 0.0003, true);

      var line_string = turf.lineString(intersections_arr[intersection])
      var line_string = turf.lineString(simplify_)

      // display_feature(line_string)

      reconstructed_polygon.push(line_string);      
    }
  }

  // remove loops start=end from linestrings
  // reconstructed_polygon = reconstructed_polygon.map(el => remove_start_end(el))
  
  // concatenate intersections linestring and outer linestrings in an order taking points(start end position) distance into consideration
  concatenate_linestrings(reconstructed_polygon)

  // testing functions
  // reconstructed_polygon = reconstructed_polygon.filter(el => el.geometry.coordinates.length > 4 )
  // reconstructed_polygon.map(el => display_feature(el))

  collection = []
  return collection;
}

function construct_outer_lines(polygon, intersections){

  var polygon = polygon[0]

  var lines = new Object()
  // var lines = []
  var counter = 0

  for(var i = 0; i < polygon.length; i++){

    var polygon_coordinates_lat = parseFloat(polygon[i][0].toFixed(6));
    var polygon_coordinates_lng = parseFloat(polygon[i][1].toFixed(6));

    var pt = turf.point([polygon_coordinates_lat, polygon_coordinates_lng])

    var intersections_bool_arr = []

    for(intersection in intersections){
      if(intersections.hasOwnProperty(intersection)){

        var intersection_line = turf.lineString(intersections[intersection])
        // var isPointOnLine = turf.booleanPointOnLine(pt, intersection_line);
        var isPointOnLine = point_on_line(polygon_coordinates_lat, polygon_coordinates_lng, intersections[intersection])
        // console.log(isPointOnLine)

        intersections_bool_arr.push(isPointOnLine)
      }
    }

    isPointOnLine = intersections_bool_arr.includes(true)
    if(!isPointOnLine){
      if(lines[counter]){
       lines[counter].push([polygon_coordinates_lat, polygon_coordinates_lng])
      }else{
        lines[counter] = []
        lines[counter].push([polygon_coordinates_lat, polygon_coordinates_lng])
      }

    }else{
      counter++;
    }

  }

  for(line in lines){
    if(lines.hasOwnProperty(line)){
      if(lines[line].length > 2){
        var turf_line = turf.lineString(lines[line])
        // display_feature(turf_line)
      }
    }
  }
 
  return lines;
}


function point_on_line(lat, lng, line){
  var bool = false;

  // console.log(lat)
  // console.log(lng)

  for(var i = 0; i < line.length; i ++){
    // console.log(line[i][0])
    // console.log(line[i][1])
    if(line[i][0] == lat && line[i][1] == lng){
      return true;
    }
  }
  return bool;
}


function concatenate_linestrings(feature_array){
  var coordinates_array = new Array()
  
  console.log(feature_array)
  for (feature in feature_array){
    console.log(feature_array[feature])
    if(feature_array.hasOwnProperty(feature)){
      if(feature_array[feature].hasOwnProperty('geometry')){
        console.log(feature_array[feature])
        coordinates_array.push(feature_array[feature].geometry.coordinates)
      }else{
        console.log(feature_array[feature])
        coordinates_array.push(feature_array[feature])
      }
    }
  }

  // console.log('unordered')
  // console.log(coordinates_array)

  var reconstructed_array = new Array()
  reconstructed_array.push(coordinates_array[0])
  var coords_arr_to_compare = coordinates_array

  counter = 1
  while(reconstructed_array.length < coordinates_array.length){
    var start_coords = coordinates_array[counter][0]

    if(coordinates_array[counter].length >= 2){
      var end_coords = coordinates_array[counter][coordinates_array[counter].length - 1]
    }else{
      var end_coords = coordinates_array[counter]
    }

    min_index = get_nearest_line(counter, end_coords, coords_arr_to_compare)

    counter = min_index
    reconstructed_array.push(coordinates_array[min_index]) //.reverse()
  }

  // console.log('reconstructed')
  // console.log(reconstructed_array)

  var ordered = reconstructed_array.flat();
  var ordered_linestring = turf.lineString(ordered)
  display_feature(ordered_linestring)
  // console.log('linestring')
  // console.log(ordered_linestring)

}

function get_nearest_line(index_arr, end_coords, coordinates_array){
  
  distance_object = new Object()
  

  for (var i = 0; i < coordinates_array.length; i++) {
    if(index_arr != i){
      var start_coordinates = coordinates_array[i][0]
      if(end_coords.length == 1){
        end_coords = end_coords[0]
      }
      var from = turf.point(end_coords);
      var to = turf.point(start_coordinates);
      var options = {units: 'kilometers'};

      var distance = turf.distance(from, to, options);

      if(distance != 0){
        distance_object[i] = distance
      }
    }
    
  }

  min_distance_index = Infinity
  min_index = 0

  for(distance in distance_object){
    if(distance_object[distance] < min_distance_index){
      min_distance_index = distance_object[distance]
      min_index = distance
    }
  }
  return min_index
}

function display_feature(feature_data){
  map.data.addGeoJson(feature_data);

  map.data.setStyle(function(feature) {
    var opacity = 0.4;
    return ({
      fillOpacity:0.4,
      strokeWeight: 1,
      strokeColor: 'red'
    });
  });
}


/*
get polygon data for one location
Init Simplification
*/
function request_data_qj(id_location,epsilon){
  id_last = id_location;
  jQuery.ajax({
    url: ajaxurl, //"send_json.php", 
    data:{
      action: "send_json",
      location_data : id_location
    },
    success: function(result){
        //OLD Algorithm
        //parse_requsted_data(result,epsilon);

        //New Simplification Algorithm
        parse_requsted_data_jsts(result,epsilon);        
      }});


}

function parse_requsted_data_jsts(data,epsilon){
  if(data){

  }else{
    var next_indx = locations_info.indexOf(id_last);
    request_data_qj(locations_info[next_indx + 1],epsilon);
    return;
  }
  
  var requested_data = JSON.parse(data);
  console.log("Saving Polygon id:" + requested_data[0].id);
  try{
        var geo_id = requested_data[0].id;
        if(requested_data){
          simplified_data = jsts_simplify(requested_data[0].coord,epsilon);
          send_modified_data_qj(simplified_data,geo_id,epsilon);
        }
      }catch(e){
        console.log(e);

        id_last = geo_id;
        next_index = locations_info.indexOf(id_last) + 1;
        request_data_qj(locations_info[next_index],epsilon);
        check_index = next_index;
      }

}


/*
Send to Server to save in DB
continue parsing next polygon by next index
*/
function send_modified_data_qj(loc_data,id,eps){
    jQuery.ajax({url: ajaxurl ,//"save_to_database.php", 
      type: "POST",
      data:{
        action: "save_to_database",
        id_data : id,
        location_data:loc_data,
        epsilon : eps
      },

      success: function(result){
           
           next_index = locations_info.indexOf(id_last);

           next_index = next_index + 1;

           request_data_qj(locations_info[next_index],eps);
         
      }});


}

var reader = new jsts.io.WKTReader();

var douglasPeuckerSimplifier = new jsts.simplify.DouglasPeuckerSimplifier("");

var wkt_writer = new jsts.io.WKTWriter();

function jsts_simplify(polygon, epsilon){

  
  let firstRead = reader.read(polygon);

  //Topology Preserving
  // var topologyPreservingSimplifier = new jsts.simplify.TopologyPreservingSimplifier(firstRead);
  // var simplified_geometry = topologyPreservingSimplifier.getResultGeometry();

  //DouglasPeuckerSimplifier
  var douglasPeuckerSimplifier = new jsts.simplify.DouglasPeuckerSimplifier(firstRead);
  var simplified_geometry = jsts.simplify.DouglasPeuckerSimplifier.simplify(firstRead, epsilon);


  
  var wkt_geometry = wkt_writer.write(simplified_geometry);
 
  return wkt_geometry;
}




/*
Display Polygons from category
*/
function request_and_display_gemeinden(polygon_category, epsilon_value,specific_location,specific_location_hierarchy_id){

   jQuery.ajax({
      type: 'POST',
      url: ajaxurl, //ajax_object.ajax_url
      data: {
         action : 'get_simpl_polygon_data',
         polygon_category: polygon_category,
         epsilon : epsilon_value,
         specific_location : specific_location,
         specific_location_hierarchy_id : specific_location_hierarchy_id
      },
    
      success: function(result){
         
         var arr_data = JSON.parse(result);

         //remove old polygons
         map.data.forEach(function(feature) {
            map.data.remove(feature);
        });
         
         for(var i = 0; i < arr_data.length;i++){

            var el = arr_data[i];
            var geoData = el.coord;
            var color = "red";
            add_geometry(geoData,color);

         }


      }});
}



 function display_polygon_intersections(polygon_data){

  map.data.forEach(function(feature) {
      map.data.remove(feature);
  });

  for (var key in polygon_data) {

    data_type = polygon_data[key].polygon.geometry.type;
    polygon = polygon_data[key].polygon.geometry.coordinates;
    intersections = polygon_data[key].intersection

    
    map.data.addGeoJson(polygon_data[key].polygon);

    map.data.setStyle(function(feature) {
      var opacity = 0.4;
      return ({
        fillOpacity:0.4,
        strokeWeight: 1,
        strokeColor: 'blue'
      });
    });

    for (is = 0; is < intersections.length; is++){
      intersection = intersections[is].geometry.coordinates;

      map.data.addGeoJson(intersections[is]);

      map.data.setStyle(function(feature) {
        var opacity = 0.4;
        return ({
          fillOpacity:0.4,
          strokeWeight: 0.7,
          strokeColor: 'red'
        });
      });
    }

  }
}

function display_simplified(polygon_data){

  map.data.forEach(function(feature) {
      map.data.remove(feature);
  });

  for (var key in polygon_data) {
    

    if(polygon_data[key].simplified){

      simplified = polygon_data[key].simplified;

      console.log(simplified)

      try{
        map.data.addGeoJson(simplified);

        map.data.setStyle(function(feature) {
          var opacity = 0.4;
          return ({
            fillOpacity:0.4,
            strokeWeight: 1,
            strokeColor: 'blue'
          });
        });
      }catch(e){
        console.log(e)
      }
        

      

    }

  }

}





/*DEPRICATED*/


/*
Parse and Simplify Polygon. 
*/
function parse_requsted_data(data,epsilon){
  if(data){
  }else{
    var next_indx = locations_info.indexOf(id_last);
    request_data_qj(locations_info[next_indx + 1],epsilon);
    return;
  }
  
  var requested_data = JSON.parse(data);
   
  
  try{
              var geo_id = requested_data[0].id;
              if(requested_data){

              //jsts_simplify(requested_data[0].coord);

                 var polygon_data = parse_data(requested_data[0].coord);

                 if(requested_data[0].coord.substring(0, 5) != "MULTI"){  // .substring(0, 4) == "MULTI" // 
                   simplified_data = simplify_polygon_line(polygon_data, epsilon); //  0.0012

                   send_modified_data_qj(JSON.stringify(rebuild_polygon_str(simplified_data)),geo_id,epsilon);
                 }else{
                   simplified_data = simplify_multi_line(polygon_data, epsilon);
      
                   send_modified_data_qj(JSON.stringify(rebuild_multipolygon_str(simplified_data)),geo_id,epsilon);               
                 }

         
                 //calculate_difference(arr,simplified_data);
              
              }
              }catch(e){
                console.log(e);

                id_last = geo_id;
                next_index = locations_info.indexOf(id_last) + 1;
                request_data_qj(locations_info[next_index],epsilon);
                check_index = next_index;
              }
}


function simplify_and_perserve(multipolygon, intersections){
  var intersections_start_end = new Array();

  for (var i = 0; i < intersections.length; i++){

    var intersection = intersections[i].geometry.coordinates;

    for (var j = 0; j < intersection.length; j++) {
      var coord = intersection[j]
      
      if(coord[0] instanceof Array){
        var intersection_start_lat = coord[0][0];
        var intersection_start_lng = coord[0][1];
      }else{
        var intersection_start_lat = coord[0];
        var intersection_start_lng = coord[1];
      }
      if(intersection_start_lat && intersection_start_lng){
        if(intersections_start_end[i]){
          intersections_start_end[i].push([intersection_start_lat, intersection_start_lng]);
        }else{
          intersections_start_end[i] = new Array();
          intersections_start_end[i].push([intersection_start_lat, intersection_start_lng]);
        }
      }
    }

  }


  var index = 99;


  var in_intersection = false;

  reconstructed_polygon = new Array();

  for (var i = 0; i < multipolygon.length; i++){
    var polygon = multipolygon[i];

    line_coordinates = new Object();

    for (var j = 0; j < polygon.length; j++){
      var polygon_coordinates = polygon[j];

      var polygon_coordinates_lat = parseFloat(polygon_coordinates[0].toFixed(6));
      var polygon_coordinates_lng = parseFloat(polygon_coordinates[1].toFixed(6));
      
      var intersection_data = is_intersection(polygon_coordinates_lat, polygon_coordinates_lng , intersections_start_end)
      var intersects = intersection_data[0]
      var intersection_index = intersection_data[1]

      // TODO Try using intersections_start_end + coordinates of not intersections from line_coordinates
      // TODO modify is_intersection to return only of coordinates not part of intersection
      

      // if(intersects){
      //   if(line_coordinates[intersection_index]){
      //     line_coordinates[intersection_index].push([polygon_coordinates_lat, polygon_coordinates_lng]);
      //   }else{
      //     line_coordinates[intersection_index] = new Array();
      //     line_coordinates[intersection_index].push([polygon_coordinates_lat, polygon_coordinates_lng]);
      //   }
      // }else{
      //   if(line_coordinates[index]){
      //     line_coordinates[index].push([polygon_coordinates_lat, polygon_coordinates_lng]);
      //   }else{
      //     line_coordinates[index] = new Array();
      //     line_coordinates[index].push([polygon_coordinates_lat, polygon_coordinates_lng]);          
      //   }
      // }

      // if(!intersects){
        if(line_coordinates[index]){
          line_coordinates[index].push([polygon_coordinates_lat, polygon_coordinates_lng]);
        }else{
          line_coordinates[index] = new Array();
          line_coordinates[index].push([polygon_coordinates_lat, polygon_coordinates_lng]);          
        }
      // }

    }
    
    var options = {tolerance: 0.001, highQuality: true};


    for (line in line_coordinates){

      if(line_coordinates.hasOwnProperty(line)){
        var line_ = turf.lineString(line_coordinates[line])
        // var simplified = turf.simplify(line_, options);

        reconstructed_polygon.push(line_);
      }

    }

    // for (line in intersections_start_end){

    //   if(intersections_start_end.hasOwnProperty(line)){
    //     if(intersections_start_end[line].length > 4){
    //       // console.log(intersections_start_end[line])
    //       var line_ = turf.lineString(intersections_start_end[line])
    //       // var simplified = turf.simplify(line_, options);

    //       if(line_.geometry.coordinates.length > 4){
    //         reconstructed_polygon.push(line_);
    //       }

    //     }
    //   }

    // }

    
  }


  var collection = turf.featureCollection(reconstructed_polygon);

  var simplified_ = turf.lineToPolygon(turf.combine(collection));


  return simplified_;
}

function is_intersection(location_lat, location_lng, intersections){
  
  intersects = false;

  for (var i = 0; i < intersections.length; i++) {

      intersection = intersections[i];
      if(intersection){
        for (var j = 0; j < intersection.length; j++) {
          var coord = intersection[j]

          if(coord[0] == location_lat && coord[1] == location_lng){
            intersects = true;
            return [intersects, i];
          }

        }
      }
  }

  return [intersects, 99];
}

function find_duplicates(inputArray){
  duplicate = false
  coord = new Array()

  for (var i = inputArray.length - 1; i >= 0; i--) {
    item = inputArray[i]
    for (var j = inputArray.length - 1; j >= 0; j--) {
      item1 = inputArray[j]
      if(i != j){
        if(item[0] == item1[0] && item[1] == item1[1]){
          duplicate =  true;
          coord = [item[0], item[1]]
          return [i, coord];
        }
      }
    }
  }

  return [duplicate, coord];
}


function remove_start_end(lineString){
  var first_coords = lineString.geometry.coordinates[0]
  var last_coords = lineString.geometry.coordinates[lineString.geometry.coordinates.length -1]
  if (first_coords[0] == last_coords[0] && first_coords[1] == last_coords[1]) {
    lineString.geometry.coordinates.pop()
  }  

  return lineString;
}

function remove_start_end_arr(arr_intersection){
  if(arr_intersection > 2){
    console.log(arr_intersection)
    var first_coords = arr_intersection[0]
    var last_coords = arr_intersection[arr_intersection.length -1]
    if (first_coords[0] == last_coords[0] && first_coords[1] == last_coords[1]) {
      arr_intersection.pop()
    }  
  }
  return arr_intersection;
}