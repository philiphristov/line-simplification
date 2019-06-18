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

         // display_simplified(polygons_to_simplify);

      }});
}

function find_intersections(polygon1, pol1_id, polygon2, pol2_id){

  var pol1_coord = parseGeoDataArray(polygon1)
  var pol2_coord = parseGeoDataArray(polygon2)

  var pol1 = turf.polygon(pol1_coord)
  var pol2 = turf.polygon(pol2_coord)
  
  try{

    var intersection = turf.intersect(pol1, pol2);
    // var line = turf.polygonToLine(pol1);
    // var intersection = turf.lineSplit(line, pol2);
    // console.log(intersection)

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

        polygons_to_simplify[pol2_id] = {intersection: intersection_object, polygon: pol1};
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
      var polygon = polygons_to_simplify[pol_id].polygon.geometry.coordinates;

      // polygons_to_simplify[pol_id]['simplified'] = simplify_and_perserve(polygon, intersections);
      polygons_to_simplify[pol_id]['simplified'] = new_simplify_and_perserve(polygon, intersections);
    }
  }
}


function new_simplify_and_perserve(multipolygon, intersections){
  var reconstructed_polygon = new Array();

  var intersections_arr = new Object()

  for (intersection in intersections){
    if(intersections.hasOwnProperty(intersection)){
      var multilinestring = intersections[intersection].geometry.coordinates

      console.log(multilinestring)
      
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
      // intersections_arr[intersection].push([last_coords[0], last_coords[1]]);
      // console.log(last_coords)
      if(multilinestring.length > 2){

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

  console.log(intersections_arr);

  var line_coordinates = new Object();

  for (var i = 0; i < multipolygon.length; i++){
    var polygon = multipolygon[i];

    for (var j = 0; j < polygon.length; j++){
      var polygon_coordinates = polygon[j];

      var polygon_coordinates_lat = parseFloat(polygon_coordinates[0].toFixed(6));
      var polygon_coordinates_lng = parseFloat(polygon_coordinates[1].toFixed(6));

      var coords = check_point_on_intersection(polygon_coordinates_lat,polygon_coordinates_lng, intersections_arr)
      // console.log(coords);

      if(coords.length != 0){
        if(line_coordinates[i]){
          line_coordinates[i].push([polygon_coordinates_lat, polygon_coordinates_lng]);
        }else{
          line_coordinates[i] = new Array();
          line_coordinates[i].push([polygon_coordinates_lat, polygon_coordinates_lng]);          
        }
      }

    }

  }

  var options = {tolerance:  0.0006, highQuality: true, mutate: true};

  for (line in line_coordinates){
    if(line_coordinates.hasOwnProperty(line)){
      var current_line = line_coordinates[line];
      // if(current_line.length > 4){

        // var line_string = turf.lineString(current_line)
        // var simplified = turf.simplify(line_string, options);

        var simplify_ = simplify(current_line, 0.0003, true);
      
        var line_string = turf.lineString(simplify_)

        map.data.addGeoJson(line_string);

        map.data.setStyle(function(feature) {
          var opacity = 0.4;
          return ({
            fillOpacity:0.4,
            strokeWeight: 1,
            strokeColor: 'blue'
          });
        });

        reconstructed_polygon.push(line_string);      
      // }

    }
  }


  for (intersection in intersections_arr){
    if(intersections_arr.hasOwnProperty(intersection)){
      // var simplified = turf.simplify(intersections_arr[intersection], options);
      // console.log(intersections_arr[intersection])
      var simplify_ = simplify(intersections_arr[intersection], 0.0003, true);
      // console.log(simplify_)
      var line_string = turf.lineString(simplify_)

      // map.data.addGeoJson(line_string);

      // map.data.setStyle(function(feature) {
      //   var opacity = 0.4;
      //   return ({
      //     fillOpacity:0.4,
      //     strokeWeight: 1,
      //     strokeColor: 'blue'
      //   });
      // });


      reconstructed_polygon.push(line_string);      
    }
  }

  if(reconstructed_polygon.length == 1){
    var collection = turf.polygon([reconstructed_polygon[0].geometry.coordinates]);
  }else{
    poly_array = new Array();

    for (var y = 0; reconstructed_polygon.length <= y; y++) {
      poly_array.push(reconstructed_polygon[y].geometry.coordinates)
    }
    var collection = turf.multiPolygon([poly_array]);
  }

  return collection;
}

function check_point_on_intersection(lat,lng, intersections){
  var coords = new Array();
  var pt = turf.point([lat, lng]);
  var arr_bools = new Array();


  // for (var z = 0; z <= intersections.length; z++){
  //   var intersection = intersections[z];
  //   var isPointOnLine = turf.booleanPointOnLine(pt, intersection);
  //   arr_bools.push(isPointOnLine)
  // }
 for (intersection in intersections){
   if(intersections.hasOwnProperty(intersection)){
        var intersection_line = turf.lineString(intersections[intersection])
        var isPointOnLine = turf.booleanPointOnLine(pt, intersection_line);
        arr_bools.push(isPointOnLine)
    }
  }

  if(arr_bools.includes(true)){
    coords = []
  }else{
    coords = [lat,lng]
  }

  console.log(arr_bools.includes(true))

  return coords;
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
