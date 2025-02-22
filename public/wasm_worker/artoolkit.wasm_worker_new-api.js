// Only diffence here is the importScripts line
// which is changed to import the new-api version of artoolkit_wasm.js
window = {};
window.artoolkit_wasm_url = '../libs/artoolkit_wasm.wasm';
window.listeners = {};
window.addEventListener = function (name, callback) {
    if (!window.listeners[name]) {
        window.listeners[name] = [];
    }
    window.listeners[name].push(callback);
};
window.removeEventListener = function (name, callback) {
    if (window.listeners[name]) {
        var index = window.listeners[name].indexOf(callback);
        if (index > -1) {
            window.listeners[name].splice(index, 1);
        }
    }
};
window.dispatchEvent = function (event) {
    var listeners = window.listeners[event.type];
    if (listeners) {
        for (var i = 0; i < listeners.length; i++) {
            listeners[i].call(window, event);
        }
    }
};

importScripts('../libs/artoolkit_wasm_new-api.js' );
self.onmessage = function(e) {
    var msg = e.data;
    switch (msg.type) {
        case "load": {
            load(msg);
            return;
        }
        case "process": {
            next = msg.imagedata;
            process();
            return;
        }
    }
};

var next = null;

var ar = null;
var markerResult = null;

function load(msg) {
    var param = new ARCameraParam(msg.camera_para);
    param.onload = function () {
        ar = new ARController(msg.pw, msg.ph, param);
        var cameraMatrix = ar.getCameraMatrix();

        ar.addEventListener('getNFTMarker', function (ev) {
            markerResult = {type: "found", index: ev.data.index, matrixGL_RH: JSON.stringify(ev.data.matrixGL_RH), proj: JSON.stringify(cameraMatrix)};
        });

        ar.loadNFTMarkers(msg.markers, function (markerId) {
            ar.trackNFTMarkerId(markerId, 2);
            postMessage({type: "endLoading", end: true})
        });

        postMessage({type: "loaded", proj: JSON.stringify(cameraMatrix)});
    };
}

function process() {

    markerResult = null;

    if (ar) {
        ar.process(next);
    }

    if (markerResult) {
        postMessage(markerResult);
    } else {
        postMessage({type: "not found"});
    }

    next = null;
}

window.addEventListener('artoolkit-loaded', function() {
    console.log('artoolkit-loaded');
    Object.assign(self, window);
    postMessage({type: "wasm"});
});
