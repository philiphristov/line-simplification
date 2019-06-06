var map;

var selected_polygon;


function init_map(){

  var myOptions = {
      center: {lat: 45.483678, lng: 11.410439},
          zoom:6,
          disableDefaultUI: true,
          
  };

  var styledMapType = new google.maps.StyledMapType ([
  {
    "featureType": "road",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  }
]);

  map = new google.maps.Map(document.getElementById('map'), myOptions);

  map.setOptions({styles : styledMapType});

  //register_map_events();
}

function add_geometry(geoData,color){
  var polygon = parseGeoData(geoData);

    try{
      console.log(polygon.getType());

      var options = {"geometry" : polygon};
      var feature = new google.maps.Data.Feature(options);

      map.data.add(feature);

      map.data.setStyle(function(feature) {
          var color = "blue";
          var opacity = 0.4;
          return ({
            fillOpacity:opacity,
            fillColor: color,
            strokeColor: color,
            strokeWeight: 1
          });
     });




    }catch(e){
        
    console.log("Error");
    console.log(e);

    var paths = new Array();

    for(var i = 0; i < polygon.length; i++){
      var coords = polygon[i];

      for(var j = 0; j < coords.length; j ++ ){
        paths.push({lat:coords[j].lat(),lng:coords[j].lng()});
      }
    }
    
    // // Construct the polygon.
    var options = {"geometry" :  new google.maps.Data.Polygon([paths])};
    var feature = new google.maps.Data.Feature(options);

   map.data.add(feature);
   
    map.data.setStyle(function(feature) {
          var color = "red";
          var opacity = 0.4;
          return ({
            fillOpacity:opacity,
            fillColor: color,
            strokeColor: color,
            strokeWeight: 1
          });
     });



   }

 }


function register_map_events(){
  map.data.addListener('click', function(event) {
        if (event.feature.getGeometry().getType() === 'Polygon') {
          //make clicked feature editable
          //map.data.overrideStyle(event.feature, { editable: true });

          selected_polygon = event.feature;
          console.log(event.feature.getGeometry());
          event.feature.getGeometry().forEachLatLng(function(latlng){
            var icon = {
                    path: "M -1 -1 L 1 -1 L 1 1 L -1 1 z",
                    strokeColor: "#FF0000",
                    strokeOpacity: 0,
                    fillColor: "#FF0000",
                    fillOpacity: 1,
                    scale: 5
                };

            var marker_options = {
              map: map,
              icon: icon,
              flat: true,
              draggable: true,
              raiseOnDrag: false
            };

            marker_options.position = latlng;
            var point = new google.maps.Marker(marker_options);
        
            map.data.addListener(point, "drag", update_polygon_closure(event.feature, latlng));

          });
        }
      })  
}

function update_polygon_closure(polygon, i){ 
  return function(event){
     //polygon.getPath().setAt(i, event.latLng); 
     console.log(event.latlng);
  }
}

 function drow_polygon(arr,color,multipolygon){
  
  if(multipolygon){
    for(var i = 0; i < arr.length; i++){
      var polyOptions = {
        path: arr[i],
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillOpacity: 0.6
      }

      var it = new google.maps.Polygon(polyOptions);
      it.setMap(map);
     }

   }else{
    var polyOptions = {
        path: arr,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillOpacity: 0.6
      }

      var it = new google.maps.Polygon(polyOptions);
      it.setMap(map);
   }
 }



function get_center(polygonCoords){
  var bounds = new google.maps.LatLngBounds();
  var i;

  for (i = 0; i < polygonCoords.length; i++) {
    bounds.extend(polygonCoords[i]);
  }


  return bounds.getCenter();
}
