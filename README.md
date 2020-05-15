# Plugin for Polygon Simplification
Simplifying individual polygons is a way to reduce polygon size and increase loading speeds. This is accomplished by polygons being represented by fewer coordinate points while still keeping the general form of the polygon. The main problem of polygon simplification algorithms is that they only consider single polygons. When applying a simplification polygon to multiple neighboring polygons gaps and overlaps become visible between the borders of the polygons. This is due to the reduced details of the polygons. 
The main purpose of the plugin is to simplify Multiple Polygons while reducing or completely removing the Overlaps or Gaps between the simplified polygons.
This is accolpished by:
####Given a list of polygons
1. calculate neighboring polygons
1. Split each polygon into multiple lines:
    1. all lines that are intersections with neighboring polygons
    1. all outer lines that are no intersection with neighboring polygons
    1. simplify individual lines
    1. rebuild simplified polygons from all simplified individual lines

### Setup
1. Set a database connection in line-simplification-lib.php
1. Activate Plugin
1. The plugin can be accessed from the admin WordPress page (in the admin menu)

### Use
1. Specify Epsilon value: how high should be the distance/tolerance between coordinate points that are kept or are removed. This is the only parameter the Simplification Algorithm Uses.
1. Two Ways to specify polygons for simplification
    1. Specify Only polygon ID, polygon Category OR polygon Hierarchie (Ueberort)
    1. Specify the category AND Add a JSON txt File in the main plugin folder in the format neighbours _{category id}_all.txt