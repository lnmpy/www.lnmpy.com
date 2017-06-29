// ==UserScript==
// @name        coolshell.net
// @namespace   http://www.lnmpy.com
// @version     1.0
// @description CoolShell博客
// @match       http://coolshell.cn/articles/*
// @author      ElvisMacak
// @run-at      document-end
// ==/UserScript==



$('div#header').remove();
$('div#navigation').remove();
$('div#sidebar').remove();
$('div#postpath').remove();
$('div#related_posts').remove();
$('div#comments').remove();
$('div#postnavi').remove();
$('div#footer').remove();
$('div.info').remove();
$('div.under').remove();
$('div.jiathis_style').remove();
$('div.post-ratings').remove();

$('form#commentform').remove()

$('div#main').css('width', '100%');
