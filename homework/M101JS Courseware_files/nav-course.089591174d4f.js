(function() {
    "use strict";

    // Position and resize the navbar to take up any available space in the viewport.
    // The viewport is the portion of the document that is currently visible in the browser window,
    // so it changes whenever you scroll or resize the window.
    function positionNavbar() {
        $('.nav-course-container').each(function() {
            var PADDING = 30;

            // Make sure the top of the navbar is within the viewport.
            var parentTop = $(this).parent().offset().top;
            var viewportTop = $(window).scrollTop() + PADDING;
            var elemTop = Math.max(parentTop, viewportTop);
            $(this).offset({ top: elemTop });

            // Make sure the bottom of the navbar is within the viewport.
            var viewportBottom = window.innerHeight + $(window).scrollTop();
            var courseContentBottom = $('.course-content').offset().top + $('.course-content').height();
            var availableHeight = Math.min(viewportBottom, courseContentBottom) - elemTop - PADDING;
            // Set max-height instead of height to avoid pushing the page footer out of the viewport
            $(this).height(availableHeight);
        });
    }

    // scroll the nav to keep the current lesson visible
    function scrollNavbar() {
        $('.nav-course-container').each(function() {
            var navOuter = $(this);
            var navInner = $(this).find('.nav-course');
            navOuter.find('.active').first().each(function() {
                var active = $(this);
                var activeTop = active.offset().top - navInner.offset().top;
                var activeMiddle = activeTop + 0.5*active.height();
                navOuter.scrollTop(activeMiddle - 0.25*navOuter.height());
            });
        });
    }


    // only show the bottom border when the content goes past what's visible
    function setNavbarBorder() {
        var outer = $('.nav-course-container');
        var inner = outer.find('.nav-course');

        var top = outer.scrollTop();
        var bottom = top + outer.height();

        if (bottom < inner.height()) {
            outer.css('border-bottom', '1px solid #ddd');
        } else {
            outer.css('border-bottom', 'none');
        }

    }

    $(document).ready(function() {
        $(window).resize(positionNavbar);
        $(window).scroll(positionNavbar);
        $(document).bind('ajaxComplete', positionNavbar);
        $(document).one('ajaxComplete', scrollNavbar);

        $(window).resize(setNavbarBorder);
        $(window).scroll(setNavbarBorder);
        $(document).bind('ajaxComplete', setNavbarBorder);
        $('.nav-course-container').scroll(setNavbarBorder);
        $('.nav-course-container').resize(setNavbarBorder);
        $('.nav-course').on($.support.transition.end, setNavbarBorder);
        $('.nav-course .accordion-toggle').click(function() { setTimeout(setNavbarBorder, 200); });

        positionNavbar();

        $('[data-toggle="tooltip"]').tooltip(); // initialize bootstrap tooltips
    });

})();
