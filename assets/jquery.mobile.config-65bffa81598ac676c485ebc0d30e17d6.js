$(document).bind("mobileinit",function(){$.mobile.ajaxEnabled=false;$.mobile.defaultPageTransition="none";$.mobile.page.prototype.options.backBtnTheme="a";$.mobile.page.prototype.options.headerTheme="a";$.mobile.page.prototype.options.contentTheme="a";$.mobile.page.prototype.options.footerTheme="a";$.mobile.listview.prototype.options.headerTheme="a";$.mobile.listview.prototype.options.theme="a";$.mobile.listview.prototype.options.dividerTheme="a";$.mobile.listview.prototype.options.splitTheme="a";$.mobile.listview.prototype.options.countTheme="a";$.mobile.listview.prototype.options.filterTheme="a";var isEmbed=$("html.embed").size()>0?true:false;if(isEmbed){$.mobile.focusPage=function(page){return}}});