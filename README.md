# kultursphaere Living Images

<a href="https://kulturfinder.sh" target="_blank">
    <img 
        src="docs/logo_sh.png" 
        alt="Logo of kulturfinder.sh" 
        height="50px" 
        style="margin: 16px; background-color: #fff"
    />
</a>

### First of all, what is Living Images? In augmented reality, a living image refer to an image that, when viewed through an AR app or device, displays additional content or animation superimposed on the original image. This could make the image appear as though it is moving or alive. Try it out and scan the QR-Code from the following Image!
<a target="_blank">
    <img 
        src="docs/LI_Weihnachtshaus.jpg" 
        alt="Living Image Weihnachtshaus" 
        height="400px"
        width="500"
        style="margin: 16px; background-color: #fff"
    />
</a>

## [To learn more about Kulturfinder read the Kulturfinder Frontent readme page](https://github.com/kultursphaere-sh/kulturfinder.sh-frontend?tab=readme-ov-file#beschreibung---description)
## 1. Marker Image
To create a Living Imgae you need a marker image. Ideally, you should take the first frame of the video for the “Living Image” effect so that it looks as if the image is coming to life.
As a result, the image and video are automatically the same size, which must be taken into account elsewhere so that the video can cover the entire image (unless otherwise desired).
## 2. Feature Sets .fset .iset .fset3 Files
In the next step, the feature files are created. This can be imagined as simplified, abstracted representations of the images. A computer vision algorithm has scanned the image according to color values, whereby corners and edges can be seen through contrast (and thus different color values), which can also be used to determine the rotation. An asymmetrical and colorful, high-contrast image is therefore important. You can find out more about good markers [here.](https://github.com/Carnaux/NFT-Marker-Creator/wiki/Creating-good-markers)
The following Marker Creator is used to create the files: [NFT Marker Creator](https://carnaux.github.io/NFT-Marker-Creator/#/)
## Instruction for the Marker Creator
1. Upload the marker image JPG/PNG any [here](https://carnaux.github.io/NFT-Marker-Creator/)
2. You can set max_thresh to 3 and min_thresh to 0, it will make the marker more stable
3. Click the generate Button
4. The files will automatically download when generator is finished

The creation algorithm works better (and faster) with smaller image files. For this, the marker image is taken (note: must be the final marker image, otherwise there will be shifts or similar!) and exported proportionally correctly in 800p and 400p (longest side). These two resulting images can now be passed to the Creator, which creates three files each containing the features for ARToolkit's tracking algorithm (iset, fset, fset3). We have three of these files.
## 3. Upload files to server
The created files, the jpeg file and the LivingImage video must then be uploaded to Server via [File Zilla](https://filezilla-project.org/) in the folder “kultursphäre.sh /living-image/assets” folder.
The following files are required as a minimum:
- MP4 video file: 1-3mbit target bit rate to reduce file size.
- jpg/png marker image: Will be displayed in the “Already found” gallery, can be uploaded as a 400p version accordingly
- iset
- fset
- fset3
## 4. Add Living Image in the LivingImages project
The last step is to add the Living Image to the app. To do this, a new LivingImage marker must be created in the
LivingImages project in [institution.js](https://github.com/kultursphaere-sh/Living-Images-Viewer/blob/main/src/store/modules/institution.js) in the “src/store/modules” directory, a new LivingImage marker must be created.
```
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

```
### Example
```
/* Mediendom */
        } else if (institution.id === 'act001621') {
          institution.livingImages.push(
            new LIMarker(
              'mediendom-rundgang',
              'Mediendom-Rundgang',
              baseUrl + 'mediendom-rundgang_nft.jpg',
              baseUrl + 'mediendom-rundgang_nft',
              baseUrl + 'video_mediendom-rundgang.mp4',
              800,
              450,
              0.084
            )
          )
        }
```
If the institution does not yet exist in the file, it must be added to the if query; the institutions are differentiated by the “actid” from Digicult.
To create a new living image, an “LIMarker” is instantiated. The individual properties are explained at the top of the file.
In the markerSetUrl, the previously created
created 400p and 800p feature sets can now be tried out (important: without file extension, all three feature files must have the same name).

Depending on the marker, the video may appear different sizes. This must then be brought to the correct size using the Scale property so that the video overlays the image in the correct proportions. However, the scale also influences the offset. The smaller the scale, the smaller the individual scale unit appears. The offset itself can in turn be used to move the video if required.
If required, the axes helper of our 3D render package “threejs” can be activated. This is located at the zero point of the virtual “threejs” scene, allowing the position of a video that is also a virtual “threejs” object (2D plane with video texture) to be debugged. To do this, search for axesHelper in the [“threejs_wasm_worker.js”](https://github.com/kultursphaere-sh/Living-Images-Viewer/blob/main/src/jsartoolkit5/threejs_wasm_worker.js) file in the “/src/jsartoolkit5/” directory and “uncomment” the block.
```
// axes helper for debugging
 let axesHelper = new THREE.AxesHelper(50);
  root.add(axesHelper)
```

## 5. npm build 

## Contributing

[Contributor License Agreement](./docs/CONTRIBUTOR-AGREEMENT.md)

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your tests
```
npm run test
```

### Lints and fixes files
```
npm run lint
```

### Test service worker with local http-server
```
npm install http-server -g
npm run build
http-server dist
```
Um Änderungen zu testen, muss mit npm neu gebaut werden. Der Server muss dafür nicht neu gestartet werden.

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
