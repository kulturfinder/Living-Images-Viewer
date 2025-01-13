import Vue from 'vue'

// Living Image Marker Object for testing purposes
// should be put in a database in the future
class LIMarker {
  constructor(id, title, markerImageUrl, markerSetUrl, videoUrl, width, height, scale = 0.112, offsetX = 0, offsetY = 0, offsetZ = 0) {
    this.id = id // used for identification, must be unique
    this.title = title // seen in overview
    this.imageUrl = markerImageUrl
    this.setUrl = markerSetUrl // feature set name without extensions
    this.videoUrl = videoUrl
    this.width = width // video width
    this.height = height // video height
    this.scale = scale // need to adjust this to make the video fit the marker image
    this.offset = {
      x: offsetX,
      y: offsetY,
      z: offsetZ
    }
  }
}

export default {
  namespaced: true,
  state: {
    institution: {}
  },
  getters: {
    getData: (state) => state.institution
  },
  mutations: {
    save: (state, data) => {
      state.institution = data
    }
  },
  actions: {
    async fetchDetails({ commit, getters }, { id, locale }) {
      try {
        const response = await Vue.http.get(`https://kultursphaere.sh/corsproxy.php?url=http://xtree-actor-api.digicult-verbund.de/getRepositoryItem?id=${id}&lang=${locale}`)
        const data = await response.json()

        let institution = {
          id: data.Actor.id,
          name: undefined,
          livingImages: []
        }

        // set preferred name as value for name property (identifier: name.role = preferred)
        institution.name = data.Actor.name.find(item => item.role === 'preferred')
        if (institution.name.nameAddition) {
          institution.name = institution.name.nameAddition
        } else if (institution.name.label) {
          institution.name = institution.name.label
        } else {
          institution.name = 'Unbekannter Name'
        }

        /* TEST FOR LIVING IMAGES  */
        institution.livingImages = []
        const baseUrl = 'https://kultursphaere.sh/living-images/assets/'

        /* Test the Living-Image with 'https://localhost:8080?locale=de&id=(actid)'
            on phone with 'https://192.168.0.153:8080/de/?locale=de&id=(actid)' */

        /* Schauspielhaus */
        if (institution.id === 'act0002156') {
          institution.livingImages.push(
            new LIMarker(
              'die-raeuber',
              'Die Räuber',
              baseUrl + 'marko_nft.jpg',
              baseUrl + 'marko_nft',
              baseUrl + 'video_marko-gebbert.mp4',
              402, // 3418
              402, // 3418
              0.343 // 0.112
            ),
            new LIMarker(
              'drei-mal-leben',
              'Drei Mal Leben',
              baseUrl + 'yvonne_nft.jpg',
              baseUrl + 'yvonne_nft',
              baseUrl + 'video_yvonne-ruprecht.mp4',
              400,
              400,
              0.296,
              14,
              14
            )
          )
          /* Landesbibliothek SH */
          /* } else if (institution.id === 'act001653') {
          institution.livingImages.push(
            new LivingImage(
              '3d3dd3acca43b3fb4adca942235df783',
              'Gemälde von Monika-Maria Dotzer',
              baseUrl + 'marker_shlb-dotzer.jpg',
              baseUrl + 'pattern_shlb-dotzer.patt',
              baseUrl + 'video_shlb-dotzer.mp4'
            ),
            new LivingImage(
              '152857c7309e41f0bd49ed14ef900de6',
              'Willkommensgruß',
              baseUrl + 'marker_laetzel-willkommen.jpg',
              baseUrl + 'pattern_laetzel-willkommen.patt',
              baseUrl + 'video_laetzel-willkommen.mp4'
            )
          )
        } */

        /* Mediendom */
        } else if (institution.id === 'act001621') {
          institution.livingImages.push(
            new LIMarker(
              'mediendom-rundgang',
              'Mediendom-Rundgang',
              baseUrl + 'mediendomrundgang800.jpg',
              baseUrl + 'mediendomrundgang800',
              baseUrl + 'video_mediendom-rundgang.mp4',
              800,
              450,
              0.335,
              3,
              3
            )
          )

        /* Bunker-D */
        } else if (institution.id === 'act0002152') {
          institution.livingImages.push(
            new LIMarker(
              'bunker-d-buehne',
              'Bunker-D Bühne',
              baseUrl + 'Marker_Bunker-D_Buehne_800.jpg',
              baseUrl + 'Marker_Bunker-D_Buehne_800',
              baseUrl + 'Buehne3mbit480p.mp4',
              852, // 800
              480, // 450
              0.320,
              3,
              3
            ),
            new LIMarker(
              'bunker-d-rundgang',
              'Bunker-D Rundgang',
              baseUrl + 'Marker_Bunker-D_Rundgang_400.jpg',
              baseUrl + 'MarkerBunkerDRundgang400thresh',
              baseUrl + 'BunkerDRundgang480p3bit.mp4',
              800,
              450,
              0.435,
              3,
              3
            )
          )

        /* Computermuseum */
        } else if (institution.id === 'act001610') {
          institution.livingImages.push(
            new LIMarker(
              'computermuseum-rechner',
              'Computermuseum Rechner',
              baseUrl + 'Marker_Computermuseum_Markus-Rechner_400.jpg',
              baseUrl + 'MarkerComputermuseumMarkusRechner400thresh', // _800
              baseUrl + 'Computermuseum_Markus_Rechner_480_3bit.mp4',
              854, // 800
              480, // 450
              0.325
            ),
            new LIMarker(
              'computermuseum-rundgang',
              'Computermuseum Rundgang',
              baseUrl + 'Marker_Computermuseum_Rundgang_400.jpg',
              baseUrl + 'MarkerComputermuseumRundgang400thresh', // _800
              baseUrl + 'Computermuseum_Rundgang_480_3bit.mp4',
              400, // 800
              225, // 450
              0.680,
              3,
              3
            )
          )

        /* Weihnachtshaus */
        } else if (institution.id === 'act001696') {
          institution.livingImages.push(
            new LIMarker(
              'weihnachtsgruss2020',
              'Frohe Weihnachten!',
              baseUrl + 'weihnachtsgruss800.jpg',
              baseUrl + 'weihnachtsgruss800',
              baseUrl + 'Weihnachtshaus_720p_2MBIT.mp4',
              400,
              227,
              0.330
            )
          )

        /* Weihnachtskarte 2021 - Storm Museum */
        } else if (institution.id === 'act001651') {
          institution.livingImages.push(
            new LIMarker(
              'weihnachtsgruss2021',
              'Frohe Weihnachten! - 2021',
              baseUrl + 'Weihnachtskarte2021_400.jpg', // die Dateien fehlen sowohl im Dropbox als auch auf dem Server
              baseUrl + 'Weihnachtskarte2021_400',
              baseUrl + 'weihnachtskarte2021.mp4',
              854,
              480,
              0.166
            )
          )

        /* Focke Museum
          } else if (institution.id === 'act0002598') {
            institution.livingImages.push(
              new LIMarker(
                'pagos-erster-wurf',
                'Pagos erster Wurf',
                baseUrl + 'pagos-erster-wurf_400.jpg',
                baseUrl + 'pagos-erster-wurf_400',
                baseUrl + 'pagos-erster-wurf_3bit_480p.mp4',
                854,
                480,
                0.164
              )
            ) */
          /* Ozeaneum */
        } else if (institution.id === 'act0002741') {
          institution.livingImages.push(
            new LIMarker(
              'ozeaneum-marker',
              'Ozeaneum Marker',
              baseUrl + 'OzeaneumMarkerLI.jpg',
              baseUrl + 'OzeaneumMarkerLI_400_thresh',
              baseUrl + 'OzeaneumFilmLI.mp4',
              1920,
              1080,
              0.075,
              1,
              1
            )
          )
        } else if (institution.id === 'act0002644') { /* Staldgarden Museum Kolding */
          institution.livingImages.push(
            new LIMarker(
              'jenny',
              'Jenny ENG',
              baseUrl + 'jenny.jpeg', // LivingImagesJennyENGCoverphoto400.jpg
              baseUrl + 'jenny', // LivingImagesJennyENGCoverphoto400_thresh
              baseUrl + 'jenny.mov',
              1080, // 1920
              1080, // 1080 // 0.454
              0.180,
              8,
              8
            ),
            new LIMarker(
              'walther',
              'Walther ENG',
              baseUrl + 'walther.jpeg', // LivingImagesWaltherENGCoverphoto2_400
              baseUrl + 'walther', // LivingImagesWaltherENGCoverphoto2_400thresh
              baseUrl + 'walther.mov', // LivingImagesWaltherENG.mp4
              1080,
              1080,
              0.122,
              4,
              4
            )
          )
        }
        commit('save', institution)
        console.log('Daten geladen', institution)

        return getters.getData
      } catch (error) {
        console.error('Error while fetching details:', error)
        return false
      }
    }
  }
}
