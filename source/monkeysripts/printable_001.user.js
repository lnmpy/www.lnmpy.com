// ==UserScript==
// @name        blog.csdn.net
// @namespace   http://www.lnmpy.com
// @version     1.5
// @description CSDN博客
// @match       http://blog.csdn.net/*/article/details/*
// @author      ElvisMacak
// @run-at      document-end
// ==/UserScript==

$('div#side').remove();
$('div#header').remove();
$('div#navigator').remove();
$('div.csdn-toolbar').remove();
$('div.notice').remove();
$('div.tag2box').remove();
$('div.article_manage').remove();
$('div#comment_title.panel_head').remove();
$('div#comment_form').remove();
$('div#comment_list').remove();
$('div.announce').remove();
$('div.article_next_prev').remove();
$('div#bdshare').remove();
$('div#bdshare_s').remove();
$('div.pub_footerall').remove();
$('div#d-top').remove();
$('div.tag_list').remove();
$('div#digg').remove();
$('dl.blog-associat-tag').remove();
$('dl.blog-ass-articl').remove();
$('a[title="展开"]').parent().parent().remove();
$('#ad_cen').remove();
$('#_popup_msg_container').remove();
$('#job_blog_reco').remove();
$('.pub_fo').remove();
$('.tracking-ad').remove();



$('div#body').css('width','98%').css('border',0);
$('div#main').css('width','98%');
$('div#main div.main').css('border',0);
$('div#main').css('border',0);
$('div.main').css("margin-left", 0);
$('body').css('background', 'none');
$('div#container').css('background', 'none');
$('ul.article_next_prev').remove();
$('.bdsharebuttonbox').remove()
