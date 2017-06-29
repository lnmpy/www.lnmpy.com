// ==UserScript==
// @name        rackspace.com
// @namespace   http://www.lnmpy.com
// @version     1.0
// @description Rackspace博客
// @match       http://developer.rackspace.com/blog/*
// @author      ElvisMacak
// @run-at      document-end
// ==/UserScript==

$('.navbar-inner').remove();
$('.sidebar').remove();
$('#footer').remove();
$('footer').remove();
$('.categories').remove();
$('#basement-wrap').remove();
$('article').removeClass('span9');
