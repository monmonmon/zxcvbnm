/*!
iPhone VR: Viewing 3D panoramas in Safari using JavaScript and -webkit-transform (modified for theta360.com)
http://www.bunnyhero.org/2008/10/13/iphone-vr-viewing-3d-panoramas-in-safari-using-javascript-and-webkit-transform/

Copyright (c) 2008-2010 wayne a. lee

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
*/
;
var drag_speedX = 0;
var drag_speedY = 0;
var drag_status = "not drag";
var drag_moving_attenuation_fps = 60;
var drag_moving_attenuation_interval = 1000 / drag_moving_attenuation_fps;
var drag_current_time;
var drag_last_time;
var rotY = 0;
var rotX = 0;
var camZ;
var active = 0;
var lastX;
var lastY;
var lastZ;
var drag_history_length = 30;
var drag_history = new Array(drag_history_length);
var $controller;
var isPinch = false;
var camZ_max = 1000;
var camZ_min = 100;

function build_texture() {
    initCss3dStyle();
    buildCube()
}

function initCss3dStyle() {
    rotY = 0;
    rotX = 0;
    lastX = 0;
    lastY = 0;
    lastZ = 0;
    var container_width = $("#container").width();
    var container_height = $("#container").height();
    var container_max = container_width > container_height ? container_width : container_height;
    var cube_size = $(".side").width();
    camZ = Math.floor(container_max * 0.54);
    camZ_min = camZ / 2;
    camZ_max = camZ * 3;
    if (container_max - cube_size > 0) {
        camZ += Math.floor((container_max - cube_size) / 4)
    }
    $("#controller").css("transform", "2000px");
    $("#container").css("transform-style", "preserve-3d").css("perspective", camZ);
    $("#cube").css("transform-style", "preserve-3d").css("transform", "translateZ(" + camZ + "px)");
    $(".side").css("backface-visibility", "hidden").css("left", Math.floor((container_width - cube_size) / 2)).css("top", Math.floor((container_height - cube_size) / 2));
    checkBlackoutBugChangeTranslateZ()
}

function buildCube() {
    var z = Math.floor(($(".side").width() / 2) / Math.tan(36 * Math.PI / 180));
    var translate_z = "translateZ(-" + z + "px)";
    $("#side2").css("transform", "rotateY(-144deg) " + translate_z);
    $("#side3").css("transform", "rotateY(-72deg) " + translate_z);
    $("#side4").css("transform", "rotateY(0deg) " + translate_z);
    $("#side5").css("transform", "rotateY(72deg) " + translate_z);
    $("#side6").css("transform", "rotateY(144deg) " + translate_z);
    var r = Math.floor(($(".side").width() / 2) * Math.sin(36 * Math.PI / 180)) - 1;
    var translate_top_y = "translateY(-" + r + "px)";
    $("#side0").css("transform", translate_top_y + " rotateY(72deg) rotateX(-90deg)");
    var translate_bottom_y = "translateY(" + r + "px)";
    $("#side1").css("transform", translate_bottom_y + " rotateY(180deg) rotateX(90deg)")
}

function pushDragHistory(x, y, time) {
    var history = {
        x: x,
        y: y,
        time: time
    };
    for (var i = drag_history_length - 2; i >= 0; i--) {
        drag_history[i + 1] = drag_history[i]
    }
    drag_history[0] = history
}

function popProperDragHistory() {
    var current_time = (new Date()).getTime();
    var proper_drag_history = null;
    for (var i = 0; i < drag_history_length; i++) {
        var h = drag_history[i];
        if (!h) {
            break
        }
        var drag_time = current_time - h.time;
        if (drag_time > 100) {
            break
        }
        proper_drag_history = h
    }
    return proper_drag_history
}

function clearDragHistory() {
    drag_history = new Array(drag_history_length)
}

function startDrag(e) {
    if (!in_area(e.pageX, e.pageY) || isPinch) {
        return
    }
    e.preventDefault();
    active = "mouse";
    lastX = e.pageX;
    lastY = e.pageY;
    drag_speedX = 0;
    drag_speedY = 0;
    clearDragHistory()
}

function moveDrag(e) {
    if (!in_area(e.pageX, e.pageY) || isPinch) {
        return
    }
    e.preventDefault();
    if (active) {
        doRotate(lastX, lastY, e.pageX, e.pageY, 0);
        pushDragHistory(lastX, lastY, drag_last_time);
        lastX = e.pageX;
        lastY = e.pageY;
        drag_last_time = e.timeStamp
    }
    if (zoom) {
        zoomStop(e)
    }
}

function endDrag(e) {
    drag_current_time = e.timeStamp;
    if (!in_area(e.pageX, e.pageY) || isPinch) {
        return
    }
    e.preventDefault();
    active = 0;
    if (drag_status != "moving") {
        var drag_history = popProperDragHistory();
        if (drag_history != null) {
            var drag_time = drag_current_time - drag_history.time;
            drag_speedX = (e.pageX - drag_history.x) * 0.6 / drag_time;
            drag_speedY = (e.pageY - drag_history.y) * 0.6 / drag_time;
            drag_status = "moving";
            movingDrag()
        } else {
            drag_speedX = 0;
            drag_speedY = 0
        }
    }
    if (zoom) {
        zoomStop(e)
    }
}

function moveWheel(e, d) {
    e.preventDefault();
    doRotate(0, 0, 0, 0, d)
}
var zoom_coef = 1;
var zoom;

function zoomIn(e) {
    zoom_coef = 1;
    zoomStart(e)
}

function zoomOut(e) {
    zoom_coef = -1;
    zoomStart(e)
}

function zoomStart(e) {
    if (zoom) {
        zoomStop(e)
    }
    stopAutoRotation();
    zoom = setInterval(function() {
        zoom_coef *= 1.05;
        doRotate(0, 0, 0, 0, zoom_coef)
    }, 33)
}

function zoomStop(e) {
    clearInterval(zoom);
    avoidIos3dRenderingBug()
}
var scrollInterval = null;

function avoidIos3dRenderingBug() {
    var is_ios = (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false);
    if (is_ios && !scrollInterval) {
        scrollInterval = setInterval(function() {
            window.scrollBy(0, 1)
        }, 100)
    }
}
var is_blackout_change_translate_z = false;

function checkBlackoutBugChangeTranslateZ() {
    var ua = navigator.userAgent;
    var is_android_browser = ((ua.indexOf("Android") > 0) && (ua.indexOf("Version") > 0) && (ua.indexOf("Safari") > 0));
    if (is_android_browser) {
        is_blackout_change_translate_z = true
    }
}

function movingDrag() {
    if (drag_status != "moving") {
        return
    }
    drag_speedX *= 0.955;
    drag_speedY *= 0.955;
    if (Math.abs(drag_speedX) > 0.004 || Math.abs(drag_speedY) > 0.004) {
        var deltaX = drag_speedX * drag_moving_attenuation_interval;
        var deltaY = drag_speedY * drag_moving_attenuation_interval;
        var targetX = lastX + deltaX;
        var targetY = lastY + deltaY;
        doRotate(lastX, lastY, targetX, targetY, 0);
        lastX = targetX;
        lastY = targetY;
        setTimeout(function() {
            movingDrag()
        }, drag_moving_attenuation_interval)
    } else {
        drag_status = "not drag"
    }
}

function in_area(x, y) {
    if (in_embed_button_area(x, y)) {
        return false
    }
    var c_x = $controller.offset().left;
    var c_y = $controller.offset().top;
    var c_w = $controller.width();
    var c_h = $controller.height();
    var inside = ((c_x <= x && x <= c_x + c_w) && (c_y <= y && y <= c_y + c_h));
    if (inside) {
        stopAutoRotation()
    }
    return inside
}

function in_embed_button_area(x, y) {
    if (in_element_area($(".embed .ricoh-theta"), x, y) || in_element_area($(".zoombtn#zoomin"), x, y) || in_element_area($(".zoombtn#zoomout"), x, y)) {
        return true
    }
    return false
}

function in_element_area(obj, x, y) {
    if (obj.size() > 0) {
        var e_x = obj.offset().left;
        var e_y = obj.offset().top;
        var e_w = obj.width();
        var e_h = obj.height();
        if ((e_x <= x && x <= e_x + e_w) && (e_y <= y && y <= e_y + e_h)) {
            return true
        }
    }
    return false
}
var coefficientRotation = 0.25;

function doRotate(lastX, lastY, curX, curY, wheelDelta) {
    var $e = $("#cube");
    var $c = $("#container");
    if ($e.size() == 0) {
        return
    }
    rotY -= (curX - lastX) * coefficientRotation;
    rotX += (curY - lastY) * coefficientRotation;
    rotX = Math.max(-88, Math.min(88, rotX));
    camZ += wheelDelta;
    if (camZ > camZ_max) {
        camZ = camZ_max
    }
    if (camZ < camZ_min) {
        camZ = camZ_min
    }
    if (is_blackout_change_translate_z && wheelDelta != 0) {
        $c.remove()
    }
    var transform_style = "translateZ(" + Math.floor(camZ) + "px) rotateX(" + rotX + "deg) rotateY(" + rotY + "deg)";
    $e.css("transform", transform_style);
    $c.css("perspective", Math.floor(camZ) + "px");
    if (is_blackout_change_translate_z && wheelDelta != 0) {
        $(".css3_3d_transform .body").prepend($c)
    }
}

function hideUrlBar() {
    setTimeout(function() {
        window.scrollTo(0, 1)
    }, 100)
}

function checksupport() {
    var props = ["perspectiveProperty", "WebkitPerspective", "MozPerspective", "OPerspective", "msPerspective"];
    var f = $("#cube")[0];
    for (var i = 0; i < props.length; i++) {
        if (props[i] in f.style) {
            var p = props[i].replace("Perspective", "");
            return p.toLowerCase()
        }
    }
    return false
}
var scaleDelta = 250;
var lastScale = 1;

function pinch(e) {
    switch (e.type) {
        case "pinchstart":
            lastScale = 1;
            return;
        case "pinchend":
            isPinch = false;
            lastScale = 1;
            return
    }
    isPinch = true;
    if (lastScale == e.scale) {
        return
    }
    var delta = scaleDelta * (e.scale - lastScale);
    lastScale = e.scale;
    doRotate(0, 0, 0, 0, delta)
}
var autoRotationFPS = 30;
var autoRotationDegPerSec = 5;
var autoRotationTimeoutID;

function autoRotation() {
    curX = (autoRotationDegPerSec / autoRotationFPS) / coefficientRotation;
    doRotate(0, 0, curX, 0, 0);
    autoRotationTimeoutID = setTimeout("autoRotation()", 1000 / autoRotationFPS)
}

function stopAutoRotation() {
    clearTimeout(autoRotationTimeoutID)
};
