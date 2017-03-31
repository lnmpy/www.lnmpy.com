// ==UserScript==
// @name        baidu.com
// @namespace   http://www.baidu.com
// @version     0.1
// @description 百度推广
// @match       http://www.baidu.com/*
// @author      ElvisMacak
// @run-at      document-end
// ==/UserScript==


jQuery('#content_left>table').remove()
jQuery('#content_left>div').map(function(e, elem){ if (elem.className != "result c-container ") {elem.remove()}})
