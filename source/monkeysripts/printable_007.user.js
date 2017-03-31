// ==UserScript==
// @name        chenshake.com
// @namespace   http://www.lnmpy.com
// @version     0.3
// @description Chenshake博客
// @match       http://www.chenshake.com/*
// @author      ElvisMacak
// @run-at      document-end
// ==/UserScript==


jQuery('#header-container').remove();
jQuery('#sidebar-shell-1').remove();
jQuery('#comments').remove();
jQuery('nav.post-nav.fix').remove();
jQuery('#wrapper').css('max-width','none');
jQuery('#wrapper').css('width','96%');
jQuery('#wrapper').css('margin','20px 1%');
jQuery('#container').css('padding-right','0');
jQuery('#main-col').css('width','100%');
jQuery('#main-col').css('float','none');
jQuery('body').css('background-color','white');
