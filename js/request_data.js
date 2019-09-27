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


function rebuild_polygons(){
  for (var pol_id in polygons_to_simplify) {
    if (polygons_to_simplify.hasOwnProperty(pol_id)) {
      var intersections = polygons_to_simplify[pol_id].intersection
      var polygon = polygons_to_simplify[pol_id].polygon;
      polygons_to_simplify[pol_id]['simplified'] = new_simplify_and_perserve(polygon, intersections);

      
      // display_feature(polygon)

      // polygons_to_simplify[pol_id]['simplified'].map( feature => display_feature(feature))

      // var linestrings = turf.featureCollection(polygons_to_simplify[pol_id]['simplified']);

      // var point_list = polygons_to_simplify[pol_id]['simplified'].map(feature => feature.geometry.coordinates)
      
      try{
        // point_list = turf.polygon(point_list.flat())

        // console.log(point_list)

        // var hull = turf.concave(point_list);
        // var hull = turf.convex(linestrings);
      
        // display_feature(point_list) //polygon

      }catch(e){
        // console.log(point_list.flat())
      }
      
      

    }
  }
}


function find_intersections(polygon1, pol1_id, polygon2, pol2_id){
  

  var pol1_coord = parseGeoDataArray(polygon1)
  var pol2_coord = parseGeoDataArray(polygon2)

  var pol1 = turf.polygon(pol1_coord)
  var pol2 = turf.polygon(pol2_coord)
  
  for (var i = 0; i < pol1.geometry.coordinates.length; i++) {
    var pol1_geom = turf.polygon([pol1.geometry.coordinates[i]]);

    for (var j = 0; j < pol2.geometry.coordinates.length; j++) {
      var pol2_geom = turf.polygon([pol2.geometry.coordinates[j]]);

      var intersection = turf.intersect(pol1_geom, pol2_geom);

      if(intersection){

        if(polygons_to_simplify.hasOwnProperty(pol1_id + "-" + i)){
          var test = polygons_to_simplify[pol1_id]

          if(!polygons_to_simplify[pol1_id + "-" + i].intersection.hasOwnProperty(pol2_id + "-" + j)){
            polygons_to_simplify[pol1_id + "-" + i].intersection[pol2_id + "-" + j] = intersection

            if(polygons_to_simplify[pol1_id + "-" + i].polygon.length > 0){
              polygons_to_simplify[pol1_id + "-" + i].polygon = pol1_geom// .push(pol1_geom)
            }

          }

        }else{

          var arr = new Array();
          var intersection_object = new Object();
          arr.push(intersection);
          intersection_object[pol2_id + "-" + j] = intersection

          polygons_to_simplify[pol1_id + "-" + i] = {intersection: intersection_object, polygon: pol1_geom};

        }

        if(polygons_to_simplify.hasOwnProperty(pol2_id + "-" + j)){

          if(!polygons_to_simplify[pol2_id + "-" + j].intersection.hasOwnProperty(pol1_id + "-" + i)){
            polygons_to_simplify[pol2_id + "-" + j].intersection[pol1_id + "-" + i] = (intersection)

            if(polygons_to_simplify[pol2_id + "-" + j].polygon.length > 0){
              polygons_to_simplify[pol2_id + "-" + j].polygon = pol2_geom //.push(pol2_geom)
            }
          }

        }else{

          var arr = new Array();
          var intersection_object = new Object();
          arr.push(intersection);
          intersection_object[pol1_id + "-" + i] = intersection

          polygons_to_simplify[pol2_id + "-" + j] = {intersection: intersection_object, polygon: pol2_geom};
        }

      }

    }
  }
  

  
}

function new_simplify_and_perserve(multipolygon, intersections){

  var reconstructed_polygon = new Array();
  var intersections_arr = new Object()
  var options = {tolerance:  0.0006, highQuality: true, mutate: true};
  var multiline_coordinates = new Array();

  // var multipolygon = multipolygon.geometry.coordinates;

  // parse intersections linestrings to arrays of coordinates
  for (intersection in intersections){
    if(intersections.hasOwnProperty(intersection)){
      var multilinestring = []

      if(intersections[intersection].geometry.coordinates){
        multilinestring = intersections[intersection].geometry.coordinates
      }

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
      

      if(multilinestring.length > 2){

        var last_coords = multilinestring[multilinestring.length - 1][1]

        if(intersections_arr.hasOwnProperty(intersection)){
          intersections_arr[intersection].push([last_coords[0], last_coords[1]]);
        }else{
          arr = new Array();
          arr.push([last_coords[0], last_coords[1]]);
          intersections_arr[intersection] = arr;
        }
      }

    }
  }

  // compute outer linestrings of each polygon by substracting intersections from all polygon coodinates
  var multiline_coordinates = construct_outer_lines(multipolygon, intersections_arr);

  // simplify and display outher poligon linestrings
  for (var i = 0; i <  multiline_coordinates.length; i++) {
    var line_coordinates = multiline_coordinates[i];
    for (line in line_coordinates){
      if(line_coordinates.hasOwnProperty(line)){

        if(line_coordinates[line].length > 2){
          
          var current_line = line_coordinates[line];
          var simplify_ = simplify(current_line, 0.0003, true);

          // var line_string = turf.lineString(current_line)
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

      // var line_string = turf.lineString(intersections_arr[intersection])
      var simplify_ = simplify(intersections_arr[intersection], 0.0003, true);

      if(simplify_.length >= 2){
        try{
          var line_string = turf.lineString(simplify_)
          // display_feature(line_string)
          reconstructed_polygon.push(line_string);  
        }catch(e){
          var line_string = turf.lineString(simplify_.flat())
          // display_feature(line_string)
          reconstructed_polygon.push(line_string); 
        }
              
      }
      
    }
  }
  
  reconstructed_polygon = reconstructed_polygon.filter(el => el.hasOwnProperty('geometry') )

  linestrings_to_polygon(reconstructed_polygon);

  collection = []
  return reconstructed_polygon;
}

function construct_outer_lines(multipolygon, intersections){

var line_arr = []
var multipolygon = [multipolygon]

for (var p = 0; p < multipolygon.length; p++) {
  var polygon = multipolygon[p].geometry.coordinates[0]

  var lines = new Object()

  var counter = 0

  for(var i = 0; i < polygon.length; i++){

    var polygon_coordinates_lat = parseFloat(polygon[i][0].toFixed(6));
    var polygon_coordinates_lng = parseFloat(polygon[i][1].toFixed(6));

    var pt = turf.point([polygon_coordinates_lat, polygon_coordinates_lng])

    var intersections_bool_arr = []

    for(intersection in intersections){
      if(intersections.hasOwnProperty(intersection)){

        var isPointOnLine = point_on_line(polygon_coordinates_lat, polygon_coordinates_lng, intersections[intersection])

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
    line_arr.push(lines)
  }


  return line_arr;
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

function linestrings_to_polygon(feature_array){

  feature_array = feature_array.map(feature => feature.geometry.coordinates)
  ordered_linestrings = get_ordered_coords_array(feature_array)

  try{
    var line = turf.polygon([ordered_linestrings])
    console.log(line)
    // feature_collection = turf.lineToPolygon([feature_collection])
    // var polygon = turf.polygonize(feature_collection)
    // display_feature(feature_collection, "red")
    // var feature_collection = ordered_linestrings.map(line => turf.lineString(line))
    // feature_collection = turf.featureCollection(feature_collection)
    // var polygon = turf.polygonize(feature_collection)
    // var polygon = turf.polygon([ordered_linestrings.flat()])
    display_feature(line, "red")

  }catch(e){
    console.log(e)
    var split_index = start_end_index(ordered_linestrings)
    // console.log(split_index)
    var p1 = ordered_linestrings.slice(0,split_index);
    var p2 = ordered_linestrings.slice(split_index);
    var line = turf.lineString([p1.reverse(), p2.reverse()].flat())
    line = turf.cleanCoords(line)
    display_feature(line, "red")

    // ordered_linestrings = get_ordered_coords_array(ordered_linestrings)
    // var feature_collection = ordered_linestrings.map(line => turf.lineString(line))
    // feature_collection = turf.featureCollection(feature_collection)
    // var polygon = turf.polygonize(feature_collection)
    // display_feature(polygon, "red")

  }


}

function start_end_index(line){

  var index = 0

  line.forEach(function(coord_1, index_1){

    line.forEach(function(coord_2, index_2){
      if(index_1 != index_2){

        if(coord_1[0] == coord_2[0] && coord_1[1] == coord_2[1]){
          console.log("STARTEND!!!!!!!!!!!!!!!!!!!!!")
          index =  index_1

        }
      }
    })
    
  })
  return index
}

function get_ordered_coords_array(feature_array){
  var counter = 0
  var array_counter = [0]
  var current_element = feature_array[counter]
  var ordered_linestrings = []
  ordered_linestrings.push(feature_array[counter])
  ordered_linestrings = ordered_linestrings.flat()
  console.log("")
  console.log(feature_array)

  while((counter < feature_array.length)){ // (feature_array.length != ordered_linestrings.length) &&
    current_element = ordered_linestrings // 0 [counter]
    // console.log(ordered_linestrings)
    // console.log(current_element)
    if(current_element){

      var current_start = current_element[0]
      var current_end = current_element[current_element.length - 1]

      var closest_index_data = get_closest_index(counter,current_start,current_end,feature_array, array_counter)
      var closest_index = closest_index_data.index
      var flip = closest_index_data.flip
      var prepend = closest_index_data.prepend

      counter++
      if(!array_counter.includes(closest_index)){
        
        array_counter.push(closest_index)

        if(flip){
          coordinates_to_add = feature_array[closest_index].reverse()
          // coordinates_to_add = feature_array[closest_index]
        }else{
          coordinates_to_add = feature_array[closest_index]
        }

        if(prepend){
          // ordered_linestrings.unshift(coordinates_to_add)
          // console.log("prepend!!!!!!!!!!!!!!!!!!!!!!!!")
          coordinates_to_add.map(coord => ordered_linestrings.unshift(coord) )
        }else{
          // ordered_linestrings.push(coordinates_to_add)
          coordinates_to_add.map( coord => ordered_linestrings.push(coord))
        }

        // ordered_linestrings = ordered_linestrings.flat()

      }
    }else{
      break
    }
  }
  console.log(ordered_linestrings)
  return ordered_linestrings
}

function get_closest_index(current_index, current_start, current_end, elements_array, array_counter){
  
  closest_index_start_to_start = 0
  current_distance_start_to_start = 1000000000

  closest_index_start_to_end = 0
  current_distance_start_to_end = 1000000000

  //

  closest_index_end_to_start = 0
  current_distance_end_to_start = 1000000000

  closest_index_end_to_end = 0
  current_distance_end_to_end = 1000000000
  

  current_start_point = turf.point(current_start)

  current_end_point = turf.point(current_end)

  for(var i = 0; i < elements_array.length; i++){
    if(current_index != i){

      searched_element_start_point = turf.point(elements_array[i][0])
      searched_element_end_point = turf.point(elements_array[i][elements_array[i].length - 1])

      distance_start_to_start = turf.distance(current_start_point, searched_element_start_point)
      distance_start_to_end = turf.distance(current_start_point, searched_element_end_point)

      distance_end_to_start = turf.distance(current_end_point, searched_element_start_point)
      distance_end_to_end = turf.distance(current_end_point, searched_element_end_point)

      if(distance_start_to_start < current_distance_start_to_start && !array_counter.includes(i)){
        current_distance_start_to_start = distance_start_to_start
        closest_index_start_to_start = i
      }

      if(distance_start_to_end < current_distance_start_to_end && !array_counter.includes(i)){
        current_distance_start_to_end = distance_start_to_end
        closest_index_start_to_end = i
      }

      if(distance_end_to_start < current_distance_end_to_start && !array_counter.includes(i)){
        current_distance_end_to_start = distance_end_to_start
        closest_index_end_to_start = i
      }

      if(distance_end_to_end < current_distance_end_to_end && !array_counter.includes(i)){
        current_distance_end_to_end = distance_end_to_end
        closest_index_end_to_end = i
      }

    }
  }

  closest_start_distance = 10000000
  if(current_distance_start_to_end < current_distance_start_to_start){
    closest_index_start = closest_index_start_to_end
    closest_start_distance = current_distance_start_to_end
    flip = false
  }else{
    closest_index_start = closest_index_start_to_start
    closest_start_distance = current_distance_start_to_start
    flip = true
  }

  closest_end_distance = 10000000
  if(current_distance_end_to_end < current_distance_end_to_start){
    closest_index_end = closest_index_end_to_end
    closest_end_distance = current_distance_end_to_end
    flip = true
  }else{
    closest_index_end = closest_index_end_to_start
    closest_end_distance = current_distance_end_to_start
    flip = false
  }


  if(closest_end_distance < closest_start_distance){
    closest_index = closest_index_end
    prepend = false
  }else if(closest_end_distance > closest_start_distance){
    closest_index = closest_index_start
    prepend = true
  }else{
    closest_index = closest_index_end
    prepend = false
  }

  return { index: closest_index, flip: flip, prepend: prepend}
}

function concatenate_linestrings(feature_array){
  
  console.log(feature_array)

  var coordinates_array = new Array()
  var lines_array = new Array()

  for (feature in feature_array){
    if(feature_array.hasOwnProperty(feature)){
      if(feature_array[feature].hasOwnProperty('geometry')){
        coordinates_array.push(feature_array[feature].geometry.coordinates)
        // var ordered_linestring = turf.lineString(feature_array[feature].geometry.coordinates)
        // display_feature(ordered_linestring)
      // if(feature_array[feature].geometry.coordinates.length >= 4){
      //   lines_array.push(feature_array[feature])
      // }
      }else{
        // single points -> excluded for now
        coordinates_array.push(feature_array[feature])
        // var ordered_linestring = turf.point(feature_array[feature][0])
        // display_feature(ordered_linestring)
      }
    }
  }

  var reconstructed_array = new Array()
  reconstructed_array.push(coordinates_array[0])
  var coords_arr_to_compare = coordinates_array

  counter = "0"
  last_index = []
  to_reverse = false

  while(reconstructed_array.length < coordinates_array.length){
    if(to_reverse){
      current_line = coordinates_array[counter].reverse()
    }else{
      current_line = coordinates_array[counter]
    }

    var start_coords = current_line[0]

    if(current_line.length >= 2){
      var end_coords = current_line[current_line.length - 1]
    }else{
      var end_coords = current_line
    }

    nearest_data = get_nearest_line(counter, last_index, end_coords, coords_arr_to_compare)

    min_index = nearest_data.min_index
    to_reverse = nearest_data.to_reverse

    last_index.push(counter)
    counter = min_index
    
    if(!to_reverse){
      coord_arr = coordinates_array[min_index].reverse()
    }else{
      coord_arr = coordinates_array[min_index]
    }

    reconstructed_array.push(coord_arr) //.reverse()
  }
  
  

  // feature_collection = turf.featureCollection(lines_array)
  // console.log(lines_array)
  // poligonized_lines = turf.polygonize(feature_collection)
  // console.log(poligonized_lines)
  // display_feature(poligonized_lines)


  var ordered = reconstructed_array.flat();
  var split_index = ordered.getDuplicates()

  var split1 = ordered.slice(0,split_index).reverse()
  var split2 = ordered.slice(split_index,ordered.length-1).reverse()
  var concatenated = split1.concat(split2)
  var ordered_linestring = turf.lineString(concatenated)

  // display_feature(ordered_linestring)

  // reconstructed_array.map( function(feature){
  //   if(feature.length >= 2){
  //     display_feature(turf.lineString(feature))
  //   }
  // })

}

Array.prototype.getDuplicates = function () {
    var duplicate_index = 0;
    for (var i = 0; i < this.length; i++) {
        for (var y = 0; y < this.length; y++) {
          if(i != y){
            if(this[i][0] == this[y][0] && this[i][1] == this[y][1]){
              duplicate_index = i
            }
          }
        }
    }

    return duplicate_index;
};

function get_nearest_line(index_arr, last_index,  end_coords, coordinates_array){
  
  distance_object_to_start = new Object()
  distance_object_to_end = new Object()
  

  for (var i = 0; i < coordinates_array.length; i++) {
    if(index_arr != i && last_index.indexOf(i.toString()) == -1 ){
      var start_coordinates = coordinates_array[i][0]
      var end_coordinates = coordinates_array[i][coordinates_array[i].length - 1]

      if(end_coords.length == 1){
        end_coords = end_coords[0]
      }
      var from = turf.point(end_coords);
      var to_start = turf.point(start_coordinates);
      var to_end = turf.point(end_coordinates);
      var options = {units: 'kilometers'};

      var distance_to_start = turf.distance(from, to_start, options);
      var distance_to_end = turf.distance(from, to_end, options);

      if(distance_to_start != 0){
        distance_object_to_start[i] = distance_to_start
      }

      if(distance_to_end != 0){
        distance_object_to_end[i] = distance_to_end
      }

    }
    
  }

  min_distance_index_to_start = Infinity
  min_index_to_start = 0

  for(distance in distance_object_to_start){
    if(distance_object_to_start[distance] < min_distance_index_to_start){
      min_distance_index_to_start = distance_object_to_start[distance]
      min_index_to_start = distance
    }
  }

  min_distance_index_to_end = Infinity
  min_index_to_end = 0

  for(distance in distance_object_to_end){
    if(distance_object_to_end[distance] < min_distance_index_to_end){
      min_distance_index_to_end = distance_object_to_end[distance]
      min_index_to_end = distance
    }
  }

  if(min_distance_index_to_start < min_distance_index_to_end){
    min_index = min_index_to_start
    to_reverse = false
  }else{
    min_index = min_index_to_end
    to_reverse = true
  }

  return {min_index: min_index, reverse:to_reverse}
}


function display_feature(feature_data, color){
  map.data.addGeoJson(feature_data);

  map.data.setStyle(function(feature) {
    var opacity = 0.4;
    return ({
      fillOpacity:0.4,
      strokeWeight: 1,
      strokeColor: color
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