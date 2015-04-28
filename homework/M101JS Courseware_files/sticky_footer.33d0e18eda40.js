/**
 * Scripted behaviour to keep the "footer" element at the bottom of the page.
 */
$(function() {
    /**
     * Read the size of the window and reposition the footer at the bottom.
     */
    var stickyFooter = function(){
        var pageHeight = $('html').height();
        var windowHeight = $(window).height();
        var footerHeight = $('footer').outerHeight();

        // A footer with 'fixed-bottom' has the CSS attribute "position: absolute",
        // and thus is outside of its container and counted in $('html').height().
        var totalHeight = $('footer').hasClass('fixed-bottom') ?
            pageHeight + footerHeight : pageHeight;

        // If the window is larger than the content, fix the footer at the bottom.
        if (windowHeight >= totalHeight) {
            return $('footer').addClass('fixed-bottom');
        } else {
            // If the page content is larger than the window, the footer must move.
            return $('footer').removeClass('fixed-bottom');
        }
    };

    // Call when this script is first loaded.
    window.onload = stickyFooter;

    // Call again when the window is resized.
    $(window).resize(function() {
        stickyFooter();
    });
});
