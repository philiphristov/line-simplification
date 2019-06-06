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
              broken_down_polygon = find_start_end_match(polygon, polygon1_id, polygon_to_compare, polygon2_id);
            }
           }
         }

         console.log(polygons_to_simplify);
         display_polygon_intersections(polygons_to_simplify)

      }});
}

function find_start_end_match(polygon1, pol1_id, polygon2, pol2_id){

  pol1_coord = parseGeoDataArray(polygon1)
  pol2_coord = parseGeoDataArray(polygon2)

  pol1 = turf.polygon(pol1_coord)
  pol2 = turf.polygon(pol2_coord)

  
  try{
    intersection = turf.intersect(pol1, pol2);

    if(intersection){

      if(polygons_to_simplify.hasOwnProperty(pol1_id)){
        polygons_to_simplify[pol1_id].intersection.push(intersection);
      }else{
        arr = new Array();
        arr.push(intersection);
        polygons_to_simplify[pol1_id] = {intersection: arr, polygon: pol1};
      }

      if(polygons_to_simplify.hasOwnProperty(pol2_id)){
        polygons_to_simplify[pol2_id].intersection.push(intersection);
      }else{
        arr = new Array();
        arr.push(intersection);
        polygons_to_simplify[pol2_id] = {intersection: arr, polygon: pol2};
      }
      
    }

  }catch(e){
    // console.log(e)
  }
}

function rebuild_polygons(){
  for (var polygon in polygons_to_simplify) {
    if (polygons_to_simplify.hasOwnProperty(polygon)) {
      var intersections = polygons_to_simplify[polygon].intersections
    }
  }
}


function get_start_end_index(polygon, intersection){
  var intersection_start = intersection[0];
  var intersection_end = intersection[intersection.length - 1];

  var start_index = 0;
  var end_index = 0;

  for (var i = 0; i < polygon.length; i++){
    var polygon_coordinates = polygon[i];
    if(intersection_start){

    }
  }
}

function display_polygon_intersections(polygon_data){
  //remove old polygons
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
        strokeWeight: 0.1,
        fillColor: 'blue'
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

/*
get polygon data for one location
Init Simplification
*/
function request_data_qj(id_location,epsilon){
  //console.log(id_location);
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

/*
Parse and Simplify Polygon. 
*/
function parse_requsted_data(data,epsilon){
  if(data){
    //console.log(data);
  }else{
    var next_indx = locations_info.indexOf(id_last);
    request_data_qj(locations_info[next_indx + 1],epsilon);
    return;
  }
  
  var requested_data = JSON.parse(data);
   
  // console.log(requested_data);
  
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
  //console.log("request data");

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
            //console.log(el.id);
            add_geometry(geoData,color);

         }


      }});
}



