var locations_info
var epsilon_value
var hierarchies = []
var next_hierarchy_index = 0

polygons_to_simplify = {}


jQuery(document).ready(function(){

  jQuery("#display_simplified_polygons").on("click", function(){
    polygon_category               = jQuery("#location_category").val();
    epsilon_value                  = jQuery("#epsilon_factor").val();
    specific_location              = jQuery("#specific_location_id").val();
    specific_location_hierarchy_id = jQuery("#specific_location_hierarchy_id").val().split(',');
    all_locations                  = jQuery("#all_locations").is(":checked")

    if(all_locations){
      request_and_display_gemeinden("", epsilon_value,"", specific_location_hierarchy_id, all_locations);
    }else if(epsilon_value && specific_location){
      //Display single specific locatation
      request_and_display_gemeinden("", epsilon_value, specific_location, [], false);
    }else if(polygon_category && epsilon_value){
      //Display Category
      request_and_display_gemeinden(polygon_category, epsilon_value,"", [], false);
    }else if (specific_location_hierarchy_id && epsilon_value){
      //Display locations by location hierarchy
      request_and_display_gemeinden("", epsilon_value,"", specific_location_hierarchy_id, false);
    }else{
      jQuery("#location_category").val("");
      jQuery("#epsilon_factor").val("");
    }
    
  })


  

  jQuery("#simplify_polygons").on("click", function(){
    polygon_category            = jQuery("#location_category").val();
    epsilon_value               = jQuery("#epsilon_factor").val();
    specific_location           = jQuery("#specific_location_id").val();
    specific_location_hierarchy = jQuery("#specific_location_hierarchy_id").val();
    all_locations               = jQuery("#all_locations").is(":checked")

   if(polygon_category && epsilon_value){
      if(all_locations){
        var callback = function(specific_location_hierarchy){
          parse_hierarchy_polygons("",epsilon_value,"",specific_location_hierarchy)
        }
        get_all_hierarchies(callback, polygon_category)
      }else{
        parse_hierarchy_polygons(polygon_category,epsilon_value,"",[])
      }
    }else if(( specific_location || specific_location_hierarchy) && epsilon_value ){
      parse_hierarchy_polygons(polygon_category,epsilon_value,specific_location,specific_location_hierarchy.split(","));
    } else if(all_locations){
      var callback = function(specific_location_hierarchy){
        parse_hierarchy_polygons("",epsilon_value,"",specific_location_hierarchy)
      }
      get_all_hierarchies(callback, "")

    }else {
      jQuery("#location_category").val("");
      jQuery("#epsilon_factor").val("");
    }

  })

})

function get_all_hierarchies(parse_data_callback, category){
  jQuery.ajax({
         url: ajaxurl, 
         data:{
          action: "get_all_hierarchies",
          category : category
         },
         success: function(result){
          hierarchies = JSON.parse(result)
          console.log(hierarchies)
          parse_data_callback([hierarchies[0]])
          // next_hierarchy_index = 1
          // for(var i = 0; i < hierarchies.length; i++){
          //   polygons_to_simplify = {}
          //   setTimeout(function () { ), i * 10000 })
          // }
         }
       })

}


function parse_hierarchy_polygons(polygon_category, epsilon_val, specific_location, specific_location_hierarchy){
  console.log("GETTING POLYGONS FOR HIERARCHY ID: " + specific_location_hierarchy)
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
           // console.log(polygon1_id)
           for (var j = 0; j < locations_info.length; j++) {
            if(i != j){
              polygon_to_compare = locations_info[j].coordinates;
              polygon2_id = locations_info[j].id;
              find_intersections(polygon, polygon1_id, polygon_to_compare, polygon2_id);
            }
           }
         }

         rebuild_polygons();

      }});
}

/*
Display Polygons from category
*/
function request_and_display_gemeinden(polygon_category, epsilon_value,specific_location,specific_location_hierarchy_id,all_simplified_polygons){
  display_data = { polygon_category: polygon_category,
                   epsilon : epsilon_value,
                   specific_location : specific_location,
                   specific_location_hierarchy_id : specific_location_hierarchy_id,
                   all_simplified_polygons : all_simplified_polygons
                 }

   jQuery.ajax({
      type: 'POST',
      url: ajaxurl, //ajax_object.ajax_url
      data: {
         action : 'get_simpl_polygon_data',
        display_data : JSON.stringify({display_data : display_data})
      },
    
      success: function(result){
         
         var arr_data = JSON.parse(result);
         console.log(arr_data)

         //remove old polygons
         map.data.forEach(function(feature) {
            map.data.remove(feature);
        });
         
         for(var i = 0; i < arr_data.length;i++){

            var el = arr_data[i];
            var geoData = parseGeoDataArray(el.coord);
            var color = "red";

            var polygon = turf.polygon(geoData)
            display_feature(polygon, "red")

         }


      }});
}


/*
Send to Server to save in DB
continue parsing next polygon by next index
*/
function send_to_db(geo_data_to_save){
    jQuery.ajax({url: ajaxurl ,//"save_to_database.php", 
      type: "POST",
      data:{
        action: "save_to_database",
        geo_data_to_save : JSON.stringify({locations_data : geo_data_to_save})
        // id_data : id,
        // location_data:loc_data,
        // epsilon : eps
      },

      success: function(result){
        console.log("SAVED")
        if(hierarchies.length > 0){
          next_hierarchy_index++
          if(hierarchies[next_hierarchy_index]){
            // console.log(next_hierarchy_index)
            parse_hierarchy_polygons("",epsilon_value,"",[hierarchies[next_hierarchy_index]]);
          }
        }
      }});

}

function rebuild_polygons(){
  for (var pol_id in polygons_to_simplify) {
    if (polygons_to_simplify.hasOwnProperty(pol_id)) {
      var intersections = polygons_to_simplify[pol_id].intersection
      var polygon = polygons_to_simplify[pol_id].polygon;
      polygons_to_simplify[pol_id]['simplified'] = new_simplify_and_perserve(polygon, intersections);

      if(polygons_to_simplify[pol_id]['simplified']){
        // console.log("original length: " + polygon.geometry.coordinates[0].length)
        // console.log("simplified length: " + polygons_to_simplify[pol_id]['simplified'].length)
        // console.log("")
      }else{
        polygons_to_simplify[pol_id]['simplified'] = polygon.geometry.coordinates[0]
        console.log("Not simplified")
        // console.log("not simplified!!!!!!!!")
        // console.log("original length: " + polygon.geometry.coordinates[0].length)
        // console.log("simplified length: " + polygons_to_simplify[pol_id]['simplified'].length)
        // console.log("")
      }
      // var polygon = turf.polygon([polygons_to_simplify[pol_id]['simplified']])
      // display_feature(polygon, "red")
    }
  }

  to_save_in_db = []

  for(var i = 0; i < locations_info.length; i++){
    var geo_data = locations_info[i]
    var cur_id = geo_data.id
    if(geo_data.coordinates.includes("POLYGON")) { var geo_type = "polygon" }
    if(geo_data.coordinates.includes("MULTIPOLYGON")) { var geo_type = "multipolygon" }

    var geo_objects = []
    for(poly in polygons_to_simplify){
      if(poly.includes(cur_id)){
        geo_objects.push(polygons_to_simplify[poly])
      }
    }

    var wkt_data = json_to_wkt(geo_type,geo_objects)

    to_save_in_db.push({id:cur_id, location_data:wkt_data, epsilon: epsilon_value })
        
  }

  send_to_db(to_save_in_db)

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

      var intersection = turf.lineOverlap(pol1_geom, pol2_geom); // intersect

      if(intersection.features.length > 0){

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
  var options = {tolerance: 0.01, highQuality: true};
  var multiline_coordinates = new Array();


  // parse intersections linestrings to arrays of coordinates
  for (intersection in intersections){
    if(intersections.hasOwnProperty(intersection)){

      for(var i = 0; i < intersections[intersection].features.length; i++){
        var current_intersection_feature = intersections[intersection].features[i]
        
        var multilinestring = []
        var linestrings_array = []

        if(current_intersection_feature.geometry.coordinates){


          switch(current_intersection_feature.geometry.type){
            case "Point":
              multilinestring.push([current_intersection_feature.geometry.coordinates,current_intersection_feature.geometry.coordinates])
              linestrings_array.push(multilinestring)
              break
            case "LineString":
              current_intersection_feature.geometry.coordinates.forEach(function(coord){
                multilinestring.push(coord)
              })
              linestrings_array.push(multilinestring)
            break
            case "MultiLineString":
              current_intersection_feature.geometry.coordinates.forEach(function(coord){
                multilinestring = multilinestring.concat(coord)
              })
              linestrings_array.push(multilinestring)
              
            break
            default:
              // console.log("DEFAULT")
              // console.log(element.coordinates)
          }

        }else{
          var linestrings_array_line_string = []
          var linestrings_array_multi_line_string = []
          var linestrings_array_point = []

          current_intersection_feature.geometry.geometries.forEach(function(element){
            switch(element.type){
              case "LineString":
                linestrings_array_line_string = linestrings_array_line_string.concat(element.coordinates)
              break
              case "MultiLineString":
                current_intersection_feature.geometry.coordinates.forEach(function(coord){
                  multilinestring.push(coord.flat())
                })

                linestrings_array_multi_line_string.push(multilinestring)
              break
              case "Point":
                linestrings_array_point.push([element.coordinates, element.coordinates])
              break
              default:
              // console.log("DEFAULT")
              // console.log(element.coordinates)
            }
          })

          if (linestrings_array_line_string.length > 0)       {linestrings_array.push(linestrings_array_line_string)}
          if (linestrings_array_multi_line_string.length > 0) {linestrings_array.push(linestrings_array_multi_line_string)}
          if (linestrings_array_point.length > 0)             {linestrings_array.push(linestrings_array_point)}
          
        }

        if(intersections_arr.hasOwnProperty(intersection + i)){
          intersections_arr[intersection + i].push(linestrings_array); // concat
        }else{
          intersections_arr[intersection + i] = linestrings_array;
        }

    }

    }
  }
  // compute outer linestrings of each polygon by substracting intersections from all polygon coodinates
  var multiline_coordinates = construct_outer_lines(multipolygon, intersections_arr);

  // simplify and display outer poligon linestrings
  for (var i = 0; i <  multiline_coordinates.length; i++) {
    var line_coordinates = multiline_coordinates[i];
    for (line in line_coordinates){
      if(line_coordinates.hasOwnProperty(line)){
        
        if(line_coordinates[line].length > 2){
          
          var current_line = line_coordinates[line];

          if(true){ //  current_line.length > 10
            var simplify_ = simplify(current_line, epsilon_value, true)
          }else{
            var simplify_ = current_line
          }
          
          var line_string = turf.lineString(simplify_, options)
          
          // reconstructed_polygon.push(line_string)
          reconstructed_polygon.push(simplify_)
        }else{
          var current_line = line_coordinates[line]
          reconstructed_polygon.push(current_line)
        }
      }
    }
  }

  // simplify and display intersection linestring of each polygon
  for (intersection in intersections_arr){
    if(intersections_arr.hasOwnProperty(intersection)){
      if(Array.isArray(intersections_arr[intersection]) && intersections_arr[intersection].length > 0){
        
        if(true){ //   intersections_arr[intersection][0].length > 10
          var simplify_ = simplify(intersections_arr[intersection][0], epsilon_value, true)
        }else{
          var simplify_ = intersections_arr[intersection]
        }

        if(simplify_){
          if(simplify_.length >= 2){
            try{
              var line_string = turf.lineString(simplify_)
              // reconstructed_polygon.push(line_string);  
              reconstructed_polygon.push(simplify_);  
            }catch(e){
              console.log(e)
              var line_string = turf.lineString([simplify_,simplify_])
              // reconstructed_polygon.push(line_string); 
              reconstructed_polygon.push([simplify_,simplify_]); 
            } 
          }
        }

      }
      
    }
  }


  // reconstructed_polygon = reconstructed_polygon.filter(el => el.hasOwnProperty('geometry') )
  reconstructed_polygon = linestrings_to_polygon(reconstructed_polygon);

  return reconstructed_polygon;
}

function print_first_last_coords(array, polygon_part){
  
  switch(polygon_part){
    case "outer":
      console.log("outer")
      console.log(array)
      array = array[0]
      for(element in array){
        if(array.hasOwnProperty(element)){
          // console.log("FIRST AND LAST OUTER")
          // console.log(array[element][0])
          // console.log(array[element][array[element].length - 1])
        }
      }
      break

    case "intersections":
      console.log("intersections")
      console.log(array)
      for(element in array){
        if(array.hasOwnProperty(element)){
          // console.log("FIRST AND LAST INTERSECTION")
          // console.log(array[element][0])
          // console.log(array[element][array[element].length - 1])
        }
      }
      break
  }
  
}



function construct_outer_lines(multipolygon, intersections){

var line_arr = []
var multipolygon = [multipolygon]

for (var p = 0; p < multipolygon.length; p++) {
  var polygon = multipolygon[p].geometry.coordinates[0]
  
  var lines = new Object()
  var lines_test = new Object()

  var counter = 0
  var counter_test = 0

  var first_coords_to_add = false
  var last_coords_to_add = false

  var last_point_lat = 0
  var last_point_lng = 0
  
  for(var i = 0; i < polygon.length; i++){

    var polygon_coordinates_lat = parseFloat(polygon[i][0]); // .toFixed(6)
    var polygon_coordinates_lng = parseFloat(polygon[i][1]); // .toFixed(6)

    var pt = turf.point([polygon_coordinates_lat, polygon_coordinates_lng])

    var intersections_bool_arr = []

    for(intersection in intersections){
      if(intersections.hasOwnProperty(intersection)){

        for(var j = 0; j < intersections[intersection].length; j++){
          var current_intersection = intersections[intersection][j]
        
          // var isPointOnLine = point_on_line(polygon_coordinates_lat, polygon_coordinates_lng, current_intersection)

          try{
            var isPointOnLine = turf.booleanPointOnLine(pt, turf.lineString(current_intersection)) // booleanPointOnLine
          }catch(e){

            try{
              var isPointOnLine = turf.booleanPointOnLine(pt, turf.lineString(current_intersection.flat()))
            }catch(e){
              console.log("ERRRRRRRRRRRRRRRRRRRRRRR")
              var isPointOnLine = false
            }

          }

          intersections_bool_arr.push(isPointOnLine)

        }

      }
    }

    isPointOnLine = intersections_bool_arr.includes(true)

    if(first_coords_to_add && !isPointOnLine){ // first_coords_to_add

      var last_lat = parseFloat(polygon[i - 1][0]); // .toFixed(6)
      var last_lng = parseFloat(polygon[i - 1][1]); // .toFixed(6)

      if(lines[counter]){
        lines[counter].push([last_lat, last_lng])
      }else{
        lines[counter] = []
        lines[counter].push([last_lat, last_lng])
      }

      first_coords_to_add = false
                  
    }else if(last_coords_to_add && isPointOnLine){ // last_coords_to_add

      var last_lat = parseFloat(polygon[i][0]); // .toFixed(6)
      var last_lng = parseFloat(polygon[i][1]); // .toFixed(6)

      if(lines[counter]){
        lines[counter].push([last_lat, last_lng])
      }else{
        lines[counter] = []
        lines[counter].push([last_lat, last_lng])
      }

      last_coords_to_add = false

    }

    if(!isPointOnLine){

      if(lines[counter]){
        lines[counter].push([polygon_coordinates_lat, polygon_coordinates_lng])
      }else{
        lines[counter] = []
        lines[counter].push([polygon_coordinates_lat, polygon_coordinates_lng])
      }
      
      last_coords_to_add = true

    }else{

      counter++;
      first_coords_to_add = true

    }

  }

    last_point_lat = polygon_coordinates_lat
    last_point_lng = polygon_coordinates_lng

    line_arr.push(lines)
  }

  return line_arr;
}


function point_on_line(lat, lng, line){
  var bool = false;

  for(var i = 0; i < line.length; i ++){
    if(parseFloat(line[i][0]).toFixed(6) == lat && parseFloat(line[i][1]).toFixed(6) == lng){
      return true;
    }
  }
  return bool;
}

function linestrings_to_polygon(feature_array){

  // coordinates_array = feature_array.map(feature => feature.geometry.coordinates)
  coordinates_array = feature_array
  
  if(Array.isArray(coordinates_array) && coordinates_array.length > 0){
    ordered_linestrings = get_ordered_coords_array(coordinates_array)

    try{
      var polygon = turf.polygon([ordered_linestrings])

    }catch(e){
      // console.log("Error")
      try{
        var first_point = ordered_linestrings[0]
        var last_point = ordered_linestrings[ordered_linestrings.length - 1]
        if(first_point[0] != last_point[0]){
            ordered_linestrings.push(first_point)
        }
        var polygon = turf.polygon([ordered_linestrings])
      }catch(e){
        console.log(e)
        console.log(ordered_linestrings)
        ordered_linestrings = null
      }

    }
  }else{
    ordered_linestrings = null
  }

  return ordered_linestrings
}


function get_ordered_coords_array(feature_array){
  var counter = 0
  var array_counter = [0]
  var current_element = feature_array[counter]
  var ordered_linestrings = []
  ordered_linestrings.push(feature_array[counter])
  ordered_linestrings = ordered_linestrings.flat()

  while((counter < feature_array.length)){ 
    current_element = ordered_linestrings 

    if(current_element){

      var current_start = current_element[0]
      var current_end = current_element[current_element.length - 1]

      // var closest_index_data = get_closest_index(counter,current_start,current_end,feature_array, array_counter)
      // var closest_index_data = get_closest_index_test(counter,current_start,current_end,feature_array, array_counter)
      var closest_index_data = get_closest_index_test2(counter,current_start,current_end,feature_array, array_counter)

      var closest_index = closest_index_data.index
      var flip = closest_index_data.flip
      var prepend = closest_index_data.prepend

      counter++

      if(!array_counter.includes(closest_index)){
        
        array_counter.push(closest_index)

        if(flip){
          flipped = feature_array[closest_index].reverse()
          coordinates_to_add = flipped
        }else{
          coordinates_to_add = feature_array[closest_index]
        }

        if(prepend){
          // coordinates_to_add.map(coord => ordered_linestrings.unshift(coord) )
          ordered_linestrings = coordinates_to_add.concat(ordered_linestrings)
        }else{
          // coordinates_to_add.map( coord => ordered_linestrings.push(coord))
          ordered_linestrings = ordered_linestrings.concat(coordinates_to_add)
        }

      }
    }else{
      break
    }
  }
  // console.log(ordered_linestrings)
  return ordered_linestrings
}





function get_closest_index(current_index, current_start, current_end, elements_array, array_counter){
  
  closest_index_start_to_start = 0
  current_distance_start_to_start = 100

  closest_index_start_to_end = 0
  current_distance_start_to_end = 100

  //

  closest_index_end_to_start = 0
  current_distance_end_to_start = 100

  closest_index_end_to_end = 0
  current_distance_end_to_end = 100
  

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

      if((distance_start_to_start < current_distance_start_to_start) && !array_counter.includes(i)){
        current_distance_start_to_start = distance_start_to_start
        closest_index_start_to_start = i
      }

      if((distance_start_to_end < current_distance_start_to_end) && !array_counter.includes(i)){
        current_distance_start_to_end = distance_start_to_end
        closest_index_start_to_end = i
      }

      if((distance_end_to_start < current_distance_end_to_start) && !array_counter.includes(i)){
        current_distance_end_to_start = distance_end_to_start
        closest_index_end_to_start = i
      }

      if((distance_end_to_end < current_distance_end_to_end) && !array_counter.includes(i)){
        current_distance_end_to_end = distance_end_to_end
        closest_index_end_to_end = i
      }

    }
  }

  closest_start_distance = 10000000
  if(current_distance_start_to_end < current_distance_start_to_start){
    closest_index_start = closest_index_start_to_end
    closest_start_distance = current_distance_start_to_end
    // flip = false
  }else{
    closest_index_start = closest_index_start_to_start
    closest_start_distance = current_distance_start_to_start
    // flip = true
  }

  closest_end_distance = 10000000
  if(current_distance_end_to_end < current_distance_end_to_start){
    closest_index_end = closest_index_end_to_end
    closest_end_distance = current_distance_end_to_end
    // flip = true
  }else{
    closest_index_end = closest_index_end_to_start
    closest_end_distance = current_distance_end_to_start
    // flip = false
  }

  if(closest_end_distance < closest_start_distance){
    closest_index = closest_index_end
    prepend = false

    if(current_distance_end_to_end < current_distance_end_to_start){
      flip = true
    }else{
      flip = false
    }

  }else if(closest_end_distance > closest_start_distance){
    closest_index = closest_index_start
    prepend = true
    
    if(current_distance_start_to_end < current_distance_start_to_start){
      flip = true
    }else{
      flip = false
    }

  }else{
    closest_index = closest_index_end
    prepend = false

    if(current_distance_end_to_end < current_distance_end_to_start){
      flip = true
    }else{
      flip = false
    }

  }



  return { index: closest_index, flip: flip, prepend: prepend}
}

function get_closest_index_test(current_index, current_start, current_end, elements_array, array_counter){
  
  // closest_index_start_to_start = 0
  // current_distance_start_to_start = 100

  // closest_index_start_to_end = 0
  // current_distance_start_to_end = 100

  // //

  // closest_index_end_to_start = 0
  // current_distance_end_to_start = 100

  // closest_index_end_to_end = 0
  // current_distance_end_to_end = 100
  

  current_start_point = turf.point(current_start)

  current_end_point = turf.point(current_end)

  flip = false
  prepend = false
  next_index = 0
  
  for(var i = 0; i < elements_array.length; i++){
    if(current_index != i){

      if(current_start == elements_array[i][0]){
        next_index = i
        flip = true
        prepend = true
      }

      if(current_start == elements_array[i][elements_array[i].length - 1]){
        next_index = i
        flip = false
        prepend = true
      }

      if(current_end_point == elements_array[i][0]){
        next_index = i
        flip = false
        prepend = false
      }

      if(current_end_point == elements_array[i][elements_array[i].length - 1]){
        next_index = i
        flip = true
        prepend = false
      }
      // searched_element_start_point = turf.point(elements_array[i][0])
      // searched_element_end_point = turf.point(elements_array[i][elements_array[i].length - 1])

      // distance_start_to_start = turf.distance(current_start_point, searched_element_start_point)
      // distance_start_to_end = turf.distance(current_start_point, searched_element_end_point)

      // distance_end_to_start = turf.distance(current_end_point, searched_element_start_point)
      // distance_end_to_end = turf.distance(current_end_point, searched_element_end_point)

      // if((distance_start_to_start < current_distance_start_to_start) && !array_counter.includes(i)){
      //   current_distance_start_to_start = distance_start_to_start
      //   closest_index_start_to_start = i
      // }

      // if((distance_start_to_end < current_distance_start_to_end) && !array_counter.includes(i)){
      //   current_distance_start_to_end = distance_start_to_end
      //   closest_index_start_to_end = i
      // }

      // if((distance_end_to_start < current_distance_end_to_start) && !array_counter.includes(i)){
      //   current_distance_end_to_start = distance_end_to_start
      //   closest_index_end_to_start = i
      // }

      // if((distance_end_to_end < current_distance_end_to_end) && !array_counter.includes(i)){
      //   current_distance_end_to_end = distance_end_to_end
      //   closest_index_end_to_end = i
      // }

    }
  }

  // closest_start_distance = 10000000
  // if(current_distance_start_to_end < current_distance_start_to_start){
  //   closest_index_start = closest_index_start_to_end
  //   closest_start_distance = current_distance_start_to_end
  //   // flip = false
  // }else{
  //   closest_index_start = closest_index_start_to_start
  //   closest_start_distance = current_distance_start_to_start
  //   // flip = true
  // }

  // closest_end_distance = 10000000
  // if(current_distance_end_to_end < current_distance_end_to_start){
  //   closest_index_end = closest_index_end_to_end
  //   closest_end_distance = current_distance_end_to_end
  //   // flip = true
  // }else{
  //   closest_index_end = closest_index_end_to_start
  //   closest_end_distance = current_distance_end_to_start
  //   // flip = false
  // }

  // if(closest_end_distance < closest_start_distance){
  //   closest_index = closest_index_end
  //   prepend = false

  //   if(current_distance_end_to_end < current_distance_end_to_start){
  //     flip = true
  //   }else{
  //     flip = false
  //   }

  // }else if(closest_end_distance > closest_start_distance){
  //   closest_index = closest_index_start
  //   prepend = true
    
  //   if(current_distance_start_to_end < current_distance_start_to_start){
  //     flip = true
  //   }else{
  //     flip = false
  //   }

  // }else{
  //   closest_index = closest_index_end
  //   prepend = false

  //   if(current_distance_end_to_end < current_distance_end_to_start){
  //     flip = true
  //   }else{
  //     flip = false
  //   }

  // }

  if(next_index == 0){
    return get_closest_index(current_index, current_start, current_end, elements_array, array_counter)
  }

  return { index: next_index, flip: flip, prepend: prepend}
}


function get_closest_index_test2(current_index, current_start, current_end, elements_array, array_counter){
  
  closest_index_start_to_start = 0
  current_distance_start_to_start = 100

  closest_index_start_to_end = 0
  current_distance_start_to_end = 100

  //

  closest_index_end_to_start = 0
  current_distance_end_to_start = 100

  closest_index_end_to_end = 0
  current_distance_end_to_end = 100
  

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

      if((distance_start_to_start < current_distance_start_to_start) && !array_counter.includes(i)){
        current_distance_start_to_start = distance_start_to_start
        closest_index_start_to_start = i
        if(current_distance_start_to_start == 0){
          return { index: i, flip: true, prepend: true}
        }
      }

      if((distance_start_to_end < current_distance_start_to_end) && !array_counter.includes(i)){
        current_distance_start_to_end = distance_start_to_end
        closest_index_start_to_end = i
        if(current_distance_start_to_end == 0){
          return { index: i, flip: false, prepend: true}
        }
      }

      if((distance_end_to_start < current_distance_end_to_start) && !array_counter.includes(i)){
        current_distance_end_to_start = distance_end_to_start
        closest_index_end_to_start = i
        if(current_distance_end_to_start == 0){
          return { index: i, flip: false, prepend: false}
        }
      }

      if((distance_end_to_end < current_distance_end_to_end) && !array_counter.includes(i)){
        current_distance_end_to_end = distance_end_to_end
        closest_index_end_to_end = i
        if(current_distance_end_to_end == 0){
          return { index: i, flip: true, prepend: false}
        }
      }

    }
  }

  closest_start_distance = 10000000
  if(current_distance_start_to_end < current_distance_start_to_start){
    closest_index_start = closest_index_start_to_end
    closest_start_distance = current_distance_start_to_end
    // flip = false
  }else{
    closest_index_start = closest_index_start_to_start
    closest_start_distance = current_distance_start_to_start
    // flip = true
  }

  closest_end_distance = 10000000
  if(current_distance_end_to_end < current_distance_end_to_start){
    closest_index_end = closest_index_end_to_end
    closest_end_distance = current_distance_end_to_end
    // flip = true
  }else{
    closest_index_end = closest_index_end_to_start
    closest_end_distance = current_distance_end_to_start
    // flip = false
  }

  if(closest_end_distance < closest_start_distance){
    closest_index = closest_index_end
    prepend = false

    if(current_distance_end_to_end < current_distance_end_to_start){
      flip = true
    }else{
      flip = false
    }

  }else if(closest_end_distance > closest_start_distance){
    closest_index = closest_index_start
    prepend = true
    
    if(current_distance_start_to_end < current_distance_start_to_start){
      flip = true
    }else{
      flip = false
    }

  }else{
    closest_index = closest_index_end
    prepend = false

    if(current_distance_end_to_end < current_distance_end_to_start){
      flip = true
    }else{
      flip = false
    }

  }



  return { index: closest_index, flip: flip, prepend: prepend}
}

function json_to_wkt(obj_type, json_data){
  var polygons_to_join = []

  switch(obj_type){
    case "polygon":
      poly_start = "POLYGON ("
      poly_end = " )"
    break
    case "multipolygon":
      poly_start = "MULTIPOLYGON (("
      poly_end = "))"
    break
  }

  polygon = poly_start

  for(poly in json_data){
    if(json_data.hasOwnProperty(poly)){
      polygons_to_join.push( '(' + json_data[poly].simplified.map(function(p) {
                    return p[0] + ' ' + p[1];
                  }).join(', ') + ')' );

    }
  }

  polygon += polygons_to_join.join(", ")

  polygon += poly_end
  

  return polygon
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

