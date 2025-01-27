import * as THREE from 'three';

function isMobile() {
    return /Android|mobile|iPad|iPhone/i.test(navigator.userAgent);
}

/* the interpolation stabilizes the video and prevents shaking  */
const maxInterpolationFactor = 18; // 24
const minInterpolationFactor = 1
let curInterpolationFactor = 1;

const fadeTime = 1; // in seconds
let ready = false;

let trackedMatrix = {
  // for interpolation
  delta: [
      0,0,0,0,
      0,0,0,0,
      0,0,0,0,
      0,0,0,0
  ],
  interpolated: [
      0,0,0,0,
      0,0,0,0,
      0,0,0,0,
      0,0,0,0
  ]
}

let setMatrix = function(matrix, value) {
    let array = [];
    for (let key in value) {
        array[key] = value[key];
    }
    if (typeof matrix.elements.set === "function") {
        matrix.elements.set(array);
    } else {
        matrix.elements = [].slice.call(array);
    }
};
const publicPath = process.env.NODE_ENV && process.env.NODE_ENV === 'development'
    ? '/'
    : '/living-images/';
let worker;
function start(markers, video, input_width, input_height, canvas_draw, render_update, track_update) {
  const workerPath = process.env.VUE_APP_NEW_API === 'true'
    ? 'wasm_worker/artoolkit.wasm_worker_new-api.js'
    : 'wasm_worker/artoolkit.wasm_worker.js';
  worker = new Worker(publicPath + workerPath);
  worker.onmessage = function() {
    start2(markers, video, input_width, input_height, canvas_draw, render_update, track_update);
  }
}

function start2(markers, video, input_width, input_height, canvas_draw, render_update, track_update) {
  let vw, vh;
  let sw, sh;
  let pscale, sscale;
  let w, h;
  let pw, ph;
  let ox, oy;
  let camera_para = publicPath + 'data/camera_para.dat'
  let cameraMatrix = {}
  let canvas_process = document.createElement('canvas');
  let context_process = canvas_process.getContext('2d');
  let renderer = new THREE.WebGLRenderer({canvas: canvas_draw, alpha: true, antialias: true});
  renderer.setPixelRatio(window.devicePixelRatio);
  let scene = new THREE.Scene();

  let camera = new THREE.Camera();
  camera.matrixAutoUpdate = false;

  scene.add(camera);
  let root = new THREE.Object3D();
  scene.add(root);

  root.matrixAutoUpdate = false;
  root.visible = false;

  // create living image three.js objects
  let livingImages = [];
  const markerUrls = [];
  for (let marker of markers) {
    let texture = new THREE.VideoTexture(marker.video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBFormat;

    let livingImage = new THREE.Mesh(
      new THREE.PlaneGeometry(marker.width * marker.scale, marker.height * marker.scale),
      new THREE.MeshBasicMaterial({ map: texture }) // for debug: color: 0xffff0
    );
    livingImage.name = 'v-' + marker.id;
    livingImage.position.x = livingImage.geometry.parameters.width / 2 + marker.offset.x;
    livingImage.position.y = livingImage.geometry.parameters.height / 2 + marker.offset.y /* 120 */;
    livingImage.position.z = marker.offset.z;
    livingImage.material.transparent = true;
    livingImage.material.opacity = 0;

    livingImages.push(livingImage);
    markerUrls.push(marker.setUrl);

    // video events
    marker.video.ontimeupdate = function() {
      // start fading out shortly before end
      if (marker.video.duration <= fadeTime) return;
      if (marker.video.currentTime >= marker.video.duration - fadeTime && !marker.fadingOut && !marker.ended) {
        marker.fadingOut = true;
        livingImage.material.transparent = true;
        livingImage.material.opacity = 0;
      }
    }
    marker.video.onended = function() {
      marker.fadingOut = false;
      marker.ended = true;
      marker.video.currentTime = 0;
    }
  }

  // axes helper for debugging
/*   let axesHelper = new THREE.AxesHelper(50);
  root.add(axesHelper) */;
  let resize = function() {
    vw = video.videoWidth;
    vh = video.videoHeight;

    pscale = 320 / Math.max(vw, vh / 3 * 4);
    sscale = isMobile() ? window.outerWidth / video.videoWidth : 1;

    sw = vw * sscale;
    sh = vh * sscale;
    w = vw * pscale;
    h = vh * pscale;
    pw = Math.max(w, h / 3 * 4);
    ph = Math.max(h, w / 4 * 3);
    ox = (pw - w) / 2;
    oy = (ph - h) / 2;
    canvas_process.style.clientWidth = pw + "px";
    canvas_process.style.clientHeight = ph + "px";
    canvas_process.width = pw;
    canvas_process.height = ph;

    renderer.setSize(vw, vh);

    //Update camera matrix
    if (cameraMatrix) {
      let ratioW = pw / w;
      let ratioH = ph / h;
      let proj = {};
      Object.assign(proj, cameraMatrix);
      proj[0] *= ratioW;
      proj[4] *= ratioW;
      proj[8] *= ratioW;
      proj[12] *= ratioW;
      proj[1] *= ratioH;
      proj[5] *= ratioH;
      proj[9] *= ratioH;
      proj[13] *= ratioH;
      setMatrix(camera.projectionMatrix, proj);
    }
  }
  let load = function() {
    vw = input_width;
    vh = input_height;
    pscale = 320 / Math.max(vw, vh / 3 * 4);
    sscale = isMobile() ? window.outerWidth / input_width : 1;

    sw = vw * sscale;
    sh = vh * sscale;
    w = vw * pscale;
    h = vh * pscale;
    pw = Math.max(w, h / 3 * 4);
    ph = Math.max(h, w / 4 * 3);
    ox = (pw - w) / 2;
    oy = (ph - h) / 2;
    canvas_process.style.clientWidth = pw + "px";
    canvas_process.style.clientHeight = ph + "px";
    canvas_process.width = pw;
    canvas_process.height = ph;

    renderer.setSize(sw, sh);
    console.log('markerUrl', markerUrls[0])
    worker.postMessage({type: "load", pw: pw, ph: ph, camera_para: camera_para, markers: markerUrls});

    worker.onmessage = function(ev) {
        let msg = ev.data;
        switch (msg.type) {
            case "loaded": {
                let proj = JSON.parse(msg.proj);
                Object.assign(cameraMatrix, proj)
                let ratioW = pw / w;
                let ratioH = ph / h;
                proj[0] *= ratioW;
                proj[4] *= ratioW;
                proj[8] *= ratioW;
                proj[12] *= ratioW;
                proj[1] *= ratioH;
                proj[5] *= ratioH;
                proj[9] *= ratioH;
                proj[13] *= ratioH;
                setMatrix(camera.projectionMatrix, proj);
                break;
            }

            case "endLoading": {
              if (msg.end == true) {
                window.dispatchEvent(new Event('loaded'))
                setTimeout(() => {
                  ready = true;
                }, 1.2)
              }
              break;
            }

            case "found": {
                found(msg);
                break;
            }

            case "not found": {
                found(null);
                break;
            }
        }

        track_update();
        process();
    };
  };

  let world;
  let foundMarkerID = null;
  let firstFrame = true; //prevents code from running every frame

  let found = function(msg) {
    if (!ready) return;
    if (!msg) {
      world = null;
      root.visible = false;

      if (foundMarkerID !== null) {
        window.dispatchEvent(new Event('marker-lost'))
        let marker = markers[foundMarkerID];
        marker.video.pause();
        marker.playing = false;
        marker.active = false;
        root.remove(livingImages[foundMarkerID])
      }

      foundMarkerID = null;
      firstFrame = true;
      curInterpolationFactor = minInterpolationFactor;
    } else {
      world = JSON.parse(msg.matrixGL_RH);
      foundMarkerID = msg.index;
      let marker = markers[foundMarkerID];
      let livingImage = livingImages[foundMarkerID];

      // check if pause/play button pressed
      if (marker.userPaused && marker.playing) {
        marker.video.pause();
        marker.playing = false;
      } else if (!marker.userPaused && !marker.playing) {
        marker.video.play();
        marker.playing = true;
      }

      if (!firstFrame) return;

      // first frame after every detection
      window.dispatchEvent(new CustomEvent('marker-found', { detail: msg.index }))
      firstFrame = false;
      curInterpolationFactor = minInterpolationFactor;
      // beginning interpolation fix
      setTimeout(() => {
        if (msg) {
          curInterpolationFactor = maxInterpolationFactor;
          root.add(livingImage);
          root.visible = true;
          marker.active = true;
          marker.video.play();
          marker.playing = true;
        }
      }, 150);

      // fade video in when video not played yet or ended and played again
      if (!marker.found || marker.ended) {
        livingImage.material.opacity = 1;
        livingImage.material.transparent = false;
        if (marker.ended) marker.ended = false;
        else marker.found = true;
      }
    }
  };

  let lasttime = Date.now();
  let time = 0;

  let draw = function() {
      render_update();
      let now = Date.now();
      let dt = now - lasttime;
      time += dt;
      lasttime = now;
      if (world) {
        // interpolate matrix
        for (let i = 0; i < 16; i++) {
          trackedMatrix.delta[i] = world[i] - trackedMatrix.interpolated[i];
          trackedMatrix.interpolated[i] =
            trackedMatrix.interpolated[i] +
            trackedMatrix.delta[i] / curInterpolationFactor;
        }

        // set matrix of 'root' by detected 'world' matrix
        setMatrix(root.matrix, trackedMatrix.interpolated);
      }
      renderer.render(scene, camera);
  };

  function process() {
    // only resize if videoWith changes -> if phone was rotated
    if (video.videoWidth != vw) {
      resize();
    }
    context_process.fillStyle = "black";
    context_process.fillRect(0, 0, pw, ph);
    context_process.drawImage(video, 0, 0, vw, vh, ox, oy, w, h);

    let imageData = context_process.getImageData(0, 0, pw, ph);
    worker.postMessage({ type: "process", imagedata: imageData }, [
      imageData.data.buffer
    ]);
  }
  let tick = function() {
      draw();
      requestAnimationFrame(tick);
  };
  load();
  tick();
  process();
}

export { start }
