/* Plugin: SuiTab.js
* Version: 1.8
* Author:Sean
* License: MIT
*
* @param {Number} current : 0  the default shown tab
* @param {String} type : click | hover | auto
* @param {String} content : tab content elements
* @param {String} container : specify container element to control stop/start carousel
* @param {String} controller : tab trigger elements
* @param {String} active : active className of current trigger
* @param {String} effect : fade | fadeM | slide | slideV
* @param {Number} duration : 600
* @param {Number} pause : 4000  if type is "auto"
* @param {Boolean|Number} nav : value true means toggle-shown prev/next buttton,value 1 means they will be always shown
* @param {Number} width : 470  tab width
* @param {Number} height : 150 tab height
* @param {Number} single: 0 elements counts in one group
* @param {Number} move: 1  how much to be moved each time
* @param {String} easing: ease-in | ease-out-in | etc. support easing plugin
*/

;(function($) {
    $.fn.suiTabs = function(opts,callback) {
        var defaults = {
            container:null,
            current : 0,
            type : "click",
            content : $(this),
            duration : 300,
            active : "active",
            effect : "defaultE",
            pause : 4000,
            nav : false,
            single : 0,
            easing : "swing",
            move : 1,
            circle : true
        };

        var settings = $.extend(defaults, opts);

        if(!jQuery.easing.def){
            settings.easing = "swing";
        }

        var tabEle = $(settings.content),
        $this,
        length = tabEle.length,
        current = settings.current,
        tabParent = tabEle.parent(),
        tabHeight = settings.height || tabEle.eq(0).height(),
        tabWidth = settings.width || tabEle.eq(0).width(),
        single = settings.single,
        duration = settings.duration,
        easing = settings.easing,
        effect = settings.effect,
        move = settings.move,
        active = settings.active,
        index = 0,
        cloned,
        triggerParent,
        autoslide,
        mouseOn,
        eventMap = (function(){
            var e =  settings.type;
            if (e == "hover") e = "mouseover";
            if (e == "auto") e = "click";
            return e;
        })();

        if (single > 0) {
            var minus = single-move+1;
            var tabCon = "";
            for (var i = 0 ; i < length ;i++) {
                if(length<=single || (single>1 && (length-i<minus))){
                    tabCon += '<li class="hidden"></li>';
                }else{
                    tabCon += "<li></li>";
                }
            }
            triggerParent = $("<ul style='display:none;' class='tabCon'>" + tabCon + "</ul>");
            $this = triggerParent.children();
            tabParent.after(triggerParent);
        } else {
            $this = $(this);
            triggerParent = $this.parent();
        }


        function init(){
            if(length<=1 || single>=length) return;

            if(single>1){
                $this.eq(current).addClass("sibl").nextUntil($this.eq(current+minus)).addClass("sibl");
            }

            if(settings.circle && isSlide()){
                tabEle.last().addClass("last");
                tabEle.first().addClass("first");
            }

            if (settings.nav) { createNav(); }

            if (effect) { addWrapper(); }

            if (effect == "fadeM" || effect == "fade") {
                tabParent.css("position","relative");
                tabEle.css("position","absolute").not(":eq(" + current + ")").hide();
            }

            if (effect == "slide" || effect == "slideV") {
                tabParent.parent().css({
                    "overflow" : "hidden",
                    "height" : tabHeight,
                    "width" : tabWidth
                });
            }

            if (effect == "slide") {
                var tabEleWidth;
                if (single) {
                    tabEleWidth = Math.floor(tabWidth / single);
                } else {
                    tabEleWidth = tabWidth;
                }
                tabEle.css({
                    "width" : tabEleWidth,
                    "float" : "left"
                });
                tabParent.css({
                    "width" : tabEleWidth * length
                });
            }

            if (effect == "slideV") {
                var tabEleHeight;
                if (single) {
                    tabEleHeight = Math.floor(tabHeight/single);
                } else {
                    tabEleHeight = tabHeight;
                }
                tabEle.css({
                    "height" : tabEleHeight
                });
            }


            if (settings.circle && isSlide()){
                cloned = tabParent.clone().removeAttr("style").css({
                    "display":"none",
                    "position":"absolute",
                    "z-index":1
                });

                var circleStyle;

                if(effect == "slide"){
                    circleStyle = {"position":"absolute","left":tabWidth};
                }
                if(effect == "slideV"){
                    circleStyle = {"position":"absolute","top":tabHeight};
                }
                cloned.find(".first").css(circleStyle).siblings().not(":last").hide();
                cloned.insertBefore(tabParent);
            }

            if (settings.type == "auto"){
                containerHoverHandler();
                initCarousel();
            }

            $this.eq(current).addClass(active);
            $this.bind(eventMap,initEffect);
        }

        function containerHoverHandler(){
            var tabContainer = settings.container && $(settings.container) || tabParent.parent();
            tabContainer.hover(function(e) {
                mouseOn = 1;
                clearInterval(autoslide);
            }, function(e) {
                initCarousel();
                mouseOn = 0;
            });

            triggerParent.bind("mouseover",function(e) {
                clearInterval(autoslide);
            });
        }

        function addWrapper(){
            var html = "<div class='tabContent'></div>";
            var parentTagName = {"UL":1,"DL":1,"OL":1};
            if(parentTagName[tabParent[0].tagName]){
                tabParent.wrap(html);
                tabParent = tabParent.parent();
            }else{
                tabEle.wrapAll(html);
                tabParent = tabParent.find(".tabContent");
            }
        }

        function createNav(){
            var navparent = tabParent.parent();
            if (settings.prev||settings.next){
                prevBtn = $(settings.prev);
                nextBtn = $(settings.next);
            }else{
                var slideBtn = "<b class='slideBtn' style='display:none;z-index:2'></b>";
                prevBtn = $(slideBtn).addClass("prev").appendTo(navparent);
                nextBtn = $(slideBtn).addClass("next").appendTo(navparent);
                if(settings.nav === 1){
                    prevBtn.show();
                    nextBtn.show();
                }else{
                    navparent.hover(function() {
                        prevBtn.show();
                        nextBtn.show();
                    }, function() {
                        prevBtn.hide();
                        nextBtn.hide();
                    });
                }
            }

            prevBtn.click(prevHandler);
            nextBtn.click(nextHandler);

            if (settings.type == "auto") {
                var hoverHandler = function(e){
                    if(e.type == "mouseenter") {
                        clearInterval(autoslide);
                        return;
                    }

                    if(e.type == "mouseleave") {
                        if(mouseOn!=1){
                            initCarousel();
                            mouseOn=0;
                        }
                        return;
                    }
                };

                prevBtn.hover(hoverHandler);
                nextBtn.hover(hoverHandler);
            }
        }

        function circleHandler(isPrev){
            if(!(settings.circle && isSlide())) return;

            var style;
            var reset = function(){
                cloned.css({
                    "display":"none",
                    "top":"0"
                });
            };

            var toLeft = {"left":-tabWidth};
            var toTop = {"top":-tabHeight};

            if(isPrev){
                if (effect == "slide"){
                    cloned.show().css(toLeft).animate({"left":0},duration,easing,reset);
                }

                if (effect == "slideV"){
                    cloned.show().css(toTop).animate({"top":0},duration,easing,reset);
                }
            }else{
                if (effect == "slide"){
                    cloned.show().animate(toLeft,duration,easing,reset);
                }

                if (effect == "slideV"){
                    cloned.show().animate(toTop,duration,easing,reset);
                }
            }
        }

        function prevHandler(){
            if (single && (effect == "slide"||effect == "slideV") && index<1) {
                index = Math.ceil((length-single)/move)+1;
            }

            if (index === 0){
                circleHandler(true);
            }

            $this.eq(index - 1).triggerHandler("click");
        }

        function nextHandler(){
            if (single && (effect == "slide"||effect == "slideV") && index*move >= length - single) {
                index = -1;
            } else if (index == length - 1) {
                index = -1;
                circleHandler();
            }

            $this.eq(index + 1).triggerHandler("click");
        }

        function isSlide(){
            return effect == "slide" || effect == "slideV";
        }

        function initCarousel(){
            autoslide = setInterval(function() {
                nextHandler();
            }, settings.pause);
        }

        function initEffect(e){
            e.stopPropagation();
            var $eThis = $(this);
            index = $eThis.index();

            $this.removeClass(active);
            $eThis.addClass(active);

            if(single>1){
                $this.removeClass("sibl");
                $eThis.addClass("sibl").nextUntil($this.eq(index+minus)).addClass("sibl");
            }

            settings.efts[effect]();

            if(callback){
                callback.call($eThis,index,tabEle.eq(index));
            }
        }


        settings.efts = {
            fade : function(){
                tabEle.stop(true,true).hide().eq(index).fadeIn(duration,easing);
            },
            fadeM : function() {
                tabEle.stop(true,true).fadeOut(duration).eq(index).fadeIn(duration,easing);
            },
            slideV : function(){
                this.slide(true);
            },
            slide : function(vertical){
                var margin,range,name,ani={};
                tabParent.stop();

                if(vertical){
                    range = tabHeight;
                    name = "marginTop";
                }else{
                    range = tabWidth;
                    name = "marginLeft";
                }

                if (single) {
                    margin = Math.floor( range * (index / single) ) * move;
                } else {
                    margin = range * index;
                }

                ani[name] = -margin;

                tabParent.animate(ani,duration,easing);
            },
            defaultE : function(){
                tabEle.not(":eq(" + index + ")").hide();
                tabEle.eq(index).show();
            }
        };

        init();
        return this;

    };// end suiTabs
})(jQuery);

