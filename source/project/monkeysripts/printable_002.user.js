// ==UserScript==
// @name        my.oschina.net
// @namespace   http://www.lnmpy.com
// @version     1.0
// @description OsChina博客
// @match       http://my.oschina.net/*
// @author      ElvisMacak
// @run-at      document-end
// ==/UserScript==


$('div#SpaceLeft').remove();
$('div#OSC_Banner').remove();
$('div#OSC_Topbar').remove();
$('div#topcontrol').remove();
$('div#RelativeBlogs').remove();
$('div#OSC_Footer').remove();
$('div#inline_reply_editor').remove();
$('div.BlogComments').remove();
$('div.BlogLinks').remove();
$('div.BlogShare').remove();
$('div.BlogCommentForm').remove();
$('div.BlogCopyright').remove();
$('div.TopBar').remove();
$('div.BlogStat').remove();
$('div.tvote').remove();

$('div#OSC_Content div.SpaceList:first').css('margin',0);
$('div#OSC_Content div.SpaceList').slice(1).remove();
