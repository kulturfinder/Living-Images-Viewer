<template>
  <div id="ar-viewer">
    <!-- LOADING SCREEN -->
    <welcome-screen
      v-if="!removeWelcomeScreen"
      :cam-rejected="camRejected"
      @remove-screen="removeWelcomeScreen = true"
      @loaded="loaded = true"
    />

    <!-- BACK BUTTON -->
    <b-button
      id="back-button"
      @click="onBackBtn()"
      variant="none"
    >
      <icon-base
        :title="$t('buttons.back')"
        :color="loaded
          ? '#fff'
          : '#003064'"
        role="img"
        width="18"
        height="18"
      >
        <icon-arrow-left />
      </icon-base>
    </b-button>

    <!-- INFO BUTTON -->
    <b-button
      id="info-button"
      class="ui-button"
      v-b-modal.info-modal
      variant="none"
    >
      <icon-base
        :title="$t('buttons.info')"
        width="24"
        height="24"
        color="#fff"
        role="img"
      >
        <icon-info />
      </icon-base>
    </b-button>

    <!-- INFO MODAL -->
    <info-modal :version="version" />

    <!-- STATS (debug) -->
    <!-- <div id="stats">
      <div id="stats1" class="stats-item">
        <p class="stats-item-title">
          {{ $t('stats.main') }}
        </p>
      </div>
      <div id="stats2" class="stats-item">
        <p class="stats-item-title">
          {{ $t('stats.worker') }}
        </p>
      </div>
    </div> -->

    <!-- AR SCENE CANVAS -->
    <div id="ar-scene" ref="ar-scene">
      <!-- CAMERA VIDEO -->
      <video
        id="cam-video"
        loop
        autoplay
        muted
        webkit-playsinline
        playsinline
      />

      <canvas id="canvas" />

      <!-- LIVING IMAGE VIDEOS -->
      <video
        :id="`v-${ livingImage.id}`"
        v-for="livingImage in livingImages"
        :key="livingImage.id"
        :muted="muted"
        webkit-playsinline
        playsinline
        crossOrigin="anonymous"
        style="opacity:0"
      >
        <source :src="livingImage.videoUrl" type="video/mp4">
      </video>
    </div>

    <!-- SCAN OVERLAY -->
    <transition
      name="scan-animation"
      enter-active-class="animate__animated animate__zoomIn"
      leave-active-class="animate__animated animate__pulse animate__faster"
      enter="overlayInAnimationEnded"
    >
      <div
        id="scan-overlay-wrapper"
        v-if="loaded && !activeLivingImage"
      >
        <div id="scan-overlay-top-left" />
        <div id="scan-overlay-top-right" />
        <div id="scan-overlay-bottom-right" />
        <div id="scan-overlay-bottom-left" />
      </div>
    </transition>

    <div id="scan-overlay-message-wrapper">
      <transition
        name="overlay-message-animation"
        enter-active-class="animate__animated animate__fadeIn"
        leave-active-class="animate__animated animate__fadeOut"
      >
        <div id="scan-overlay-message" v-if="showMessage">
          {{ overlayMessage }}
        </div>
      </transition>
    </div>

    <!-- BOTTOM BUTTON BAR -->
    <div id="bottom-bar">
      <!-- MUTE/UNMUTE BUTTON -->
      <b-button
        @click="muted = !muted"
        id="mute-button"
        class="bottom-bar-btn ui-button bg-button"
        :class="{'muted': muted}"
        variant="none"
      >
        <img
          src="@/assets/img/icons/volume_off.svg"
          :alt="$t('buttons.muted')"
          width="20"
          height="20"
          v-if="muted"
        >
        <img
          src="@/assets/img/icons/volume_up.svg"
          :alt="$t('buttons.unmuted')"
          width="20"
          height="20"
          v-else
        >
      </b-button>

      <!-- PLAY/PAUSE BUTTON -->
      <!-- <b-button
        @click="activeLivingImage.userPaused = !activeLivingImage.userPaused"
        :disabled="!activeLivingImage
          || activeLivingImage.ended
          || activeLivingImage.fadingOut"
        id="play-button"
        class="bottom-bar-btn ui-button bg-button"
        variant="none"
      >
        <img
          src="@/assets/img/icons/pause.svg"
          :alt="$t('buttons.pause')"
          width="36"
          height="36"
          v-if="activeLivingImage
            && activeLivingImage.playing
            && !activeLivingImage.ended"
        >
        <img
          src="@/assets/img/icons/play_arrow.svg"
          :alt="$t('buttons.play')"
          width="36"
          height="36"
          v-else
        >
      </b-button> -->

      <!-- OVERVIEW BUTTON -->
      <b-button
        id="overview-button"
        class="bottom-bar-btn ui-button position-relative bg-button"
        v-b-modal.overview-modal
        variant="none"
      >
        <icon-base
          :title="$t('buttons.overview')"
          width="28"
          height="28"
          color="#ddd"
          role="img"
        >
          <icon-living-images />
        </icon-base>
        <div v-if="unfoundLivingImages > 0" id="unfoundIndicator">
          {{ unfoundLivingImages }}
        </div>
      </b-button>

      <!-- OVERVIEW MODAL -->
      <overview-modal :living-images="livingImages" />
    </div>
  </div>
</template>

<script>
import WelcomeScreen from '@/components/WelcomeScreen.vue'
import InfoModal from '@/components/InfoModal.vue'
import OverviewModal from '@/components/OverviewModal.vue'
import 'three'
/* import Stats from 'stats.js' */
import { start } from '@/jsartoolkit5/threejs_wasm_worker.js'

export default {
  name: 'ARViewer',
  components: {
    WelcomeScreen,
    InfoModal,
    OverviewModal
  },
  data() {
    return {
      params: {},
      version: '0.3.0',
      loaded: false,
      removeWelcomeScreen: false,
      livingImages: [],
      muted: false,
      error: '',
      showMessage: false,
      camRejected: false
    }
  },
  computed: {
    unfoundLivingImages() {
      return this.livingImages.filter(li => !li.found).length
    },
    activeLivingImage() {
      if (this.livingImages.length === 0) return
      return this.livingImages.find(livingImage => {
        return livingImage.active === true
      })
    },
    overlayMessage() {
      return this.error
        ? this.error
        : this.$t('scanOverlay.defaultMessage')
    }
  },
  methods: {
    getAllUrlParams(url) {
      var queryString = url
        ? url.split('?')[1]
        : window.location.search.slice(1)
      var obj = {}

      if (queryString) {
        queryString = queryString.split('#')[0]
        var arr = queryString.split('&')

        for (var i = 0; i < arr.length; i++) {
          var a = arr[i].split('=')
          var paramName = a[0]
          var paramValue = typeof (a[1]) === 'undefined' ? true : a[1]
          paramName = paramName.toLowerCase()
          if (typeof paramValue === 'string') paramValue = paramValue.toLowerCase()
          if (paramName.match(/\[(\d+)?\]$/)) {
            var key = paramName.replace(/\[(\d+)?\]/, '')

            if (!obj[key]) obj[key] = []

            if (paramName.match(/\[\d+\]$/)) {
              var index = /\[(\d+)\]/.exec(paramName)[1]
              obj[key][index] = paramValue
            } else {
              obj[key].push(paramValue)
            }
          } else {
            if (!obj[paramName]) {
              obj[paramName] = paramValue
            } else if (obj[paramName] && typeof obj[paramName] === 'string') {
              obj[paramName] = [obj[paramName]]
              obj[paramName].push(paramValue)
            } else {
              obj[paramName].push(paramValue)
            }
          }
        }
      }

      return obj
    },
    onBackBtn() {
      window.parent.postMessage('back-button-clicked', '*')
    },
    onMarkerFound(markerId) {
      console.log('MARKER FOUND', markerId)
      this.showMessage = false
    },
    onMarkerLost() {
      console.log('MARKER LOST')
      // ...
    },
    overlayInAnimationEnded(ev) {
      this.showMessage = true
    }
  },
  created() {
    this.params = this.getAllUrlParams(window.location.href)
    // set locale
    this.$i18n.locale = this.params.locale
    // if no id, set default
    if (!this.params.id) this.params.id = 'act001610'
  },
  async mounted() {
    // fetch living images
    const institution = await this.$store.dispatch('institution/fetchDetails', {
      id: this.params.id,
      locale: this.$i18n.locale
    })
    this.livingImages = institution.livingImages.map(livingImage => {
      return {
        ...livingImage,
        video: null,
        active: false,
        found: false,
        playing: false,
        userPaused: false,
        fadingOut: false,
        ended: false
      }
    })

    document.getElementById('accept-button').addEventListener('click', () => {
      for (let livingImage of this.livingImages) {
        // assign element to living image object
        livingImage.video = document.getElementById('v-' + livingImage.id)

        // mobile autoplay hack
        livingImage.video.play()
        livingImage.video.pause()
      }

      /**
       * STATS
       */
      /* let statsMain = new Stats()
      statsMain.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
      document.getElementById('stats1').appendChild(statsMain.dom)

      let statsWorker = new Stats()
      statsWorker.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
      document.getElementById('stats2').appendChild(statsWorker.dom) */

      /**
       * APP / ELEMENTS
       */
      let camVideo = document.getElementById('cam-video')
      let canvas = document.getElementById('canvas')

      /**
       * APP / VIDEO STREAM
       */
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        let mediaOptions = {
          audio: false,
          video: {
            facingMode: 'environment'
          }
        }

        navigator.mediaDevices.getUserMedia(mediaOptions)
          .then(stream => {
            camVideo.srcObject = stream
            camVideo.addEventListener('loadedmetadata', () => {
              camVideo.play()
              start(
                this.livingImages,
                camVideo,
                camVideo.videoWidth,
                camVideo.videoHeight,
                canvas,
                function () {
                  /* statsMain.update() */
                },
                function () {
                  /* statsWorker.update() */
                }
              )
            })
          })
          .catch(err => {
            console.error(err)
            this.camRejected = true
          })
      }
    })
    window.addEventListener('marker-found', (ev) => {
      this.onMarkerFound(ev.detail)
    })
    window.addEventListener('marker-lost', () => {
      this.onMarkerLost()
    })
  }
}
</script>

<style lang="scss" scoped>
#stats {
  position: fixed;
  margin: 0.5rem;
  background-color: rgba(0, 48, 100, 0.7);
  border-radius: 6px;
  top: 0;
  right: 0;
  z-index: 201;
  margin: 0.5rem;
  padding: 0.5rem 0.5rem 0;
}
.stats-item {
  margin: 0 0 0.5rem;
}
.stats-item-title {
  margin: 0 0 0.25rem;
  font-size: 0.7rem;
  font-weight: 500;
  color: #fff;
}
::v-deep #stats div {
  position: relative !important;
}

#ar-scene {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

#cam-video {
  position: absolute;
  top: 0;
  left: 0;
  display: block;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover;
}

#canvas {
  position: absolute;
  left: 0;
  top: 0;
  z-index: 100;
  display: block;
  width: 100% !important;
  height: 100% !important;
  object-fit: cover;
}

#scan-overlay-wrapper {
  height: 100%;
  width: 100%;
  position: fixed;
  z-index: 200;
  pointer-events: none;
}
#scan-overlay-top-left {
  width: 50px;
  height: 50px;
  position: absolute;
  top: 70px;
  left: 30px;
  border-top: 1px solid $primary;
  border-left: 1px solid $primary;
  border-radius: 30% 0 0 0;
}
#scan-overlay-top-left::after {
  content: "";
  width: 49px;
  height: 49px;
  position: absolute;
  top: 0px;
  left: 0px;
  border-top: 1px solid #fff;
  border-left: 1px solid #fff;
  border-radius: 30% 0 0 0;
}
#scan-overlay-top-right {
  width: 50px;
  height: 50px;
  position: absolute;
  top: 70px;
  right: 30px;
  border-top: 1px solid $primary;
  border-right: 1px solid $primary;
  border-radius: 0 30% 0 0;
}
#scan-overlay-top-right::after {
  content: "";
  width: 49px;
  height: 49px;
  position: absolute;
  top: 0px;
  right: 0px;
  border-top: 1px solid #fff;
  border-right: 1px solid #fff;
  border-radius: 0 30% 0 0;
}
#scan-overlay-bottom-right {
  width: 50px;
  height: 50px;
  position: absolute;
  bottom: 100px;
  right: 30px;
  border-bottom: 1px solid $primary;
  border-right: 1px solid $primary;
  border-radius: 0 0 30% 0;
}
#scan-overlay-bottom-right::after {
  content: "";
  width: 49px;
  height: 49px;
  position: absolute;
  bottom: 0px;
  right: 0px;
  border-bottom: 1px solid #fff;
  border-right: 1px solid #fff;
  border-radius: 0 0 30% 0;
}
#scan-overlay-bottom-left {
  width: 50px;
  height: 50px;
  position: absolute;
  bottom: 100px;
  left: 30px;
  border-bottom: 1px solid $primary;
  border-left: 1px solid $primary;
  border-radius: 0 0 0 30%;
}
#scan-overlay-bottom-left::after {
  content: "";
  width: 49px;
  height: 49px;
  position: absolute;
  bottom: 0px;
  left: 0px;
  border-bottom: 1px solid #fff;
  border-left: 1px solid #fff;
  border-radius: 0 0 0 30%;
}
#scan-overlay-message-wrapper {
  width: 100%;
  height: 100%;
  position: fixed;
  /* bottom: 115px; */
  display: flex;
  justify-content: center;
  align-items: center;
}
#scan-overlay-message {
  font-size: 0.8rem;
  font-weight: 500;
  text-align: center;
  color: #fff;
  background-color: rgba(0, 48, 100, 0.8);
  position: absolute;
  /* bottom: 0; */
  padding: 13px 20px 15px;
  max-width: 80%;
  border-radius: 20px;
}

.ui-button {
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 0;
  z-index: 11;
}
.ui-button:active:not(.disabled) {
  box-shadow: 0px 0px 11px 1px rgba(255, 255, 255, 0.5) !important;
}
.ui-button.disabled {
  background-color: rgb(46, 49, 49);
}
.bg-button {
  background-color: rgba(0, 48, 100, 0.8);
}
#back-button {
  top: 20px;
  left: 16px;
  height: 28px;
  width: 28px;
  border-radius: 14px;
  z-index: 101;
  position: fixed;
  padding: 0;
  border: 0;
}
#info-button {
  top: 20px;
  right: 20px;
  height: 28px;
  width: 28px;
  border-radius: 14px;
  position: fixed;
  padding: 0;
}
/* #info-buttons-wrapper {
  bottom: 20%;
  right: 15px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-flow: column wrap;
  z-index: 11;
  position: fixed;
} */
#unfoundIndicator {
  height: 20px;
  width: 20px;
  background-color: #fff;
  color: $primary;
  font-size: 0.6rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  left: 29px;
  bottom: 29px;
  padding: 0.1rem;
  border-radius: 50%;
}
#play-button {
  width: 60px;
  height: 60px;
  border-radius: 30px;
}
#mute-button {
  width: 46px;
  height: 46px;
  border-radius: 23px;
}
#mute-button * {
  pointer-events: none;
}
.muted {
  background-color: rgba(212,0,75,.8) !important;
}
#overview-button {
  width: 46px;
  height: 46px;
  border-radius: 23px;
}

#bottom-bar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display:flex;
  align-items: center;
  justify-content: center;
}
.bottom-bar-btn {
  margin: 0 10px;
}
/* ::v-deep .svg-stroke g {
  stroke: #003064;
  stroke-width: .5;
} */
</style>
