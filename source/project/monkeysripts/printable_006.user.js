// ==UserScript==
// @name        iteye.com
// @namespace   http://www.lnmpy.com
// @version     1.0
// @description iteye博客
// @match       http://*.iteye.com/blog/*
// @author      ElvisMacak
// @run-at      document-end
// ==/UserScript==

function __removeAll(nodes){for(var i = nodes.length - 1; i >= 0; i--){nodes[i].remove();};}
function __clearWidth(nodes){for(var i = nodes.length - 1; i >= 0; i--){nodes[i].style.width='100%';};}
document.getElementById('header').remove();
document.getElementById('branding').remove();
document.getElementById('footer').remove();
document.getElementById('local').remove();
document.getElementById('bottoms').remove();
document.getElementById('page').style.backgroundColor = '#FFF';
document.getElementById('main').style.width ="100%";
document.getElementById('main').style.border = 0;
__clearWidth(document.getElementsByClassName('blog_main'));
__removeAll(document.getElementsByClassName('attachments'));
__removeAll(document.getElementsByClassName('blog_categories'));
__removeAll(document.getElementsByClassName('news_tag'));
__removeAll(document.getElementsByClassName('blog_categories'));
__removeAll(document.getElementsByClassName('blog_nav'));
__removeAll(document.getElementsByClassName('blog_bottom'));
__removeAll(document.getElementsByClassName('blog_comment'));
