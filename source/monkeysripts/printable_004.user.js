// ==UserScript==
// @name        51cto.com
// @namespace   http://www.lnmpy.com
// @version     1.1
// @description 51CTO博客
// @match       http://*.blog.51cto.com/*/*
// @author      ElvisMacak
// @run-at      document-end
// ==/UserScript==



$('#bdshare_s').remove();
$('#message').remove();
$('#home_top').remove();
$('#s3.subMenu3').remove();
$('#share.share').remove();
$('.headerBox').remove();
$('.mainNav').remove();
$('.blogLeft').remove();
$('.CopyrightStatement').remove();
$('.art_tj').remove();
$('.showTags').remove();
$('.m_sharebtn clear').remove();
$('.showBottom').remove();
$('div.relatedArt.box').remove();
$('div.artComm.box').remove();
$('form#form1').remove();
$('div.backToTop.tops').remove();
$('div#footer').remove();
$('div.m_sharebtn').remove();
$('.box.edu-col-b').remove();


$('div.blogRight').css('width','100%');
$('body').css('background','none');

