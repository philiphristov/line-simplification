<?php

//localhost db
$db_obj = new wpdb("root", "", "va_test", "localhost");

add_action('admin_menu', 'init_line_simplification_menu');
 function init_line_simplification_menu(){
        add_menu_page( 'Line Simplify', 'Line Simplification', 'manage_options', 'line-simplification', 'line_simplification_menu' ); // test_import_init
}

add_action( 'admin_enqueue_scripts', 'load_custom_wp_admin_style' );
function load_custom_wp_admin_style($hook) {
	if($hook != 'toplevel_page_line-simplification') {
                return;
    }
    wp_register_style( 'custom_wp_admin_css', plugins_url('line-simplification-plugin') . '/admin-style-pol-simpl.css', false, '1.0.0' );
    wp_enqueue_style( 'custom_wp_admin_css' );
}



function pol_simpl_scripts($hook) {
    if ( 'toplevel_page_line-simplification' != $hook ) {
        return;
    }

    wp_localize_script( 'ajax_calls_handler', 'ajax_object',array( 'ajax_url' => admin_url( 'admin-ajax.php' )));

    wp_enqueue_script( 'jsts', plugins_url('line-simplification-plugin') . '/js/jsts.min.js' );
    wp_enqueue_script( 'map', plugins_url('line-simplification-plugin') . '/js/map.js' );
    wp_enqueue_script( 'geo', plugins_url('line-simplification-plugin') . '/js/geo.js' );
    wp_enqueue_script( 'line_simpl', plugins_url('line-simplification-plugin') . '/js/line_simplification.js' );
    wp_enqueue_script( 'req_data', plugins_url('line-simplification-plugin') . '/js/request_data.js' );


    ?>
    <script  src="https://maps.googleapis.com/maps/api/js?key=AIzaSyC28XHFNL1oOwEhotnCqyb_LkuYh1U6aVo&libraries=geometry" type="text/javascript" ></script>
    <?php
}
add_action( 'admin_enqueue_scripts', 'pol_simpl_scripts' );