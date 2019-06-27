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
      arr_bools.push({isPointOnLine: isPointOnLine, intersection_index: intersection})
    }
  }
  pointOnLine = false
  coords = []
  for(var i = 0; i < arr_bools.length; i++){
    if(!arr_bools[i].isPointOnLine){
      coords = [lat,lng]
      index = arr_bools[i].intersection_index
      break;
    }
  }

  // if(arr_bools.includes(true)){
  //   coords = []
  // }else{
  //   coords = [lat,lng]
  // }

  // console.log(arr_bools.includes(true))
  return [coords, index];
}
