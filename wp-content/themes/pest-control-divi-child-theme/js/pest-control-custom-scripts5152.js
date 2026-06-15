// Custom menu V1 (show the menu)

jQuery(document).ready(function(){
    jQuery(".custom-menu-v1-button").click(function(){
        jQuery(".custom-menu-v1-row").toggleClass("active-menu-v1");

    });
});

// collpasing mobile menu

jQuery(function($) {
    $(document).ready(function() {
        $("body ul.et_mobile_menu li.menu-item-has-children, body ul.et_mobile_menu  li.page_item_has_children").append('<a href="#" class="mobile-toggle-icon"></a>');
        $('ul.et_mobile_menu li.menu-item-has-children .mobile-toggle-icon, ul.et_mobile_menu li.page_item_has_children .mobile-toggle-icon').click(function(event) {
            event.preventDefault();
            $(this).parent('li').toggleClass('mobile-toggle-open');
            $(this).parent('li').find('ul.children').first().toggleClass('visible');
            $(this).parent('li').find('ul.sub-menu').first().toggleClass('visible');
        });
        iconFINAL = 'P';
        $('body ul.et_mobile_menu li.menu-item-has-children, body ul.et_mobile_menu li.page_item_has_children').attr('data-icon', iconFINAL);
        $('.mobile-toggle-icon').on('mouseover', function() {
            $(this).parent().addClass('active-toggle');
        }).on('mouseout', function() {
            $(this).parent().removeClass('active-toggle');
        })
    });
});