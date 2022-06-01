import React, { useEffect, useState } from "react";
import {unstable_batchedUpdates} from "react-dom";
import cornerstone from "cornerstone-core";
import cornerstoneMath from "cornerstone-math";
import cornerstoneTools from "cornerstone-tools";
import Hammer from "hammerjs";
import * as cornerstoneWebImageLoader from "cornerstone-web-image-loader";
import cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import dicomParser from "dicom-parser";
import "./View.css";

const segmentationImages = [
    // "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/RupturedAAA.png/250px-RupturedAAA.png",
    "https://miro.medium.com/max/394/1*WmnWtjS5UhGxCuKoAF4XpA.png"
];

// A layers array to store and set the settings for the different kinds of images 
const layers = [
    {
    // images: imageIds, // array of dicom images (MAY NOT NEED THIS LINE)
    layerId: "", // array of dicom images ID
    options: {
        visible: true,
        opacity: 1,
        name: "DICOM",
        viewport: {
        colormap: ""
        }
    }
    },
    {
    images: segmentationImages, // array of segmentation images
    layerId: [],
    options: {
        name: "SEGMENTATION",
        visible: true,
        opacity: 0.7,
        viewport: {
        colormap: "",
        voi: {
            windowWidth: 30,
            windowCenter: 16
        }
        }
    }}
];

let element;
let pngElement;

const View = () => {

    cornerstoneTools.external.cornerstone = cornerstone;
    cornerstoneTools.external.Hammer = Hammer;
    cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
    cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
    cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
    cornerstoneWebImageLoader.external.cornerstone = cornerstone;
    
    cornerstoneTools.init();

    cornerstoneTools.init({
        mouseEnabled: true,
        touchEnabled: true,
        globalToolSyncEnabled: false,
        showSVGCursors: false
    });
    const fontFamily =
    "Work Sans, Roboto, OpenSans, HelveticaNeue-Light, Helvetica Neue Light, Helvetica Neue, Helvetica, Arial, Lucida Grande, sans-serif";

    cornerstoneTools.textStyle.setFont(`16px ${fontFamily}`);

    // Set the tool width
    cornerstoneTools.toolStyle.setToolWidth(2);

    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [imageIds, setImageIds] = useState([]);
    const [opacity, setOpacity] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    
    // NOT NEED FUNCTION
    const loadAndViewImage = imageId => {
        const element = document.getElementById("dicomImage");
        const start = new Date().getTime();
        cornerstone.loadImage(imageId).then(
        function(image) {
            console.log(image);
            const viewport = cornerstone.getDefaultViewportForImage(element, image);
            cornerstone.displayImage(element, image, viewport);
        },
        function(err) {
            alert(err);
        }
        );
    };

    function loadImages(index = 1) {
        const promises = [];

        console.log("Visibility: ", layers[index].options.visible);

        if (layers[index].options.visible){
            layers[index].images.forEach(function (image) {
                console.log("Image url: ", image);
                const loadPromise = cornerstone.loadAndCacheImage(image);
                promises.push(loadPromise);
                console.log("Promise has been pushed!");
            })
        }

        return Promise.all(promises); // Contains ALL the PNG ImageLoadObject
    }

    useEffect(() => {
        element = document.getElementById("dicomImage");
        cornerstone.enable(element);

        pngElement = document.getElementById("PNGImage");
        cornerstone.enable(pngElement);
    }, []);

    const handleFileChange = e => {
        const files = Array.from(e.target.files); // Assigning all the files uploaded to the variable "files"
        setUploadedFiles(files); 
    
        const imageIds = files.map(file => {
          return cornerstoneWADOImageLoader.wadouri.fileManager.add(file);
        }); // Creating an imageId for each file uploaded and saving it as imageIds 
        setImageIds(imageIds);
        // layers[0].layerId = imageIds[0]; // Assigning the first dicom image in the stack as the layerId

        // FUNCTION TO DISPLAY THE THUMBNAILS ON THE RIGHT
        setTimeout(() => {
            imageIds.forEach(imageId => {
              const thumbnailElement = document.getElementById(imageId);
              cornerstone.enable(thumbnailElement); // Enable the image element (IMPORTANT: enable the element first before the element can be loaded)
              cornerstone.loadImage(imageId).then(image => {
                cornerstone.displayImage(thumbnailElement, image);
                // cornerstoneTools.addStackStateManager(element, ["stack"]); // CODE IS NOT NEEDED AS IT IS NOT A STACK
                // cornerstoneTools.addToolState(element, "stack", stack);
              });
            });
        }, 1000);

        setTools();
        setEventListeners();

        function setTools() {

            console.log("Currently in setTools function");

            // STACK SCROLL MOUSEWHEEL TOOL
            const StackScrollMouseWheelTool = cornerstoneTools.StackScrollMouseWheelTool;
            const stack = {
                currentImageIdIndex: 0,
                imageIds
            };
            cornerstone.loadImage(imageIds[0]).then(image => {
                console.log("Image loaded");
            cornerstone.displayImage(element, image);
            cornerstoneTools.addStackStateManager(element, ["stack"]);
            cornerstoneTools.addToolState(element, "stack", stack);
            const layerId = cornerstone.addLayer( 
                element,
                image,
                layers[0].options
            );
            layers[0].layerId = layerId;
            cornerstone.setActiveLayer(element, layerId);
            console.log("Layer Id for DICOM is: ", layerId);

            // Zoom tool set to right click
            const zoomTool = cornerstoneTools.ZoomTool;
            cornerstoneTools.addTool(zoomTool, {
                configuration: {
                invert: false,
                preventZoomOutsideImage: false,
                minScale: 0.1,
                maxScale: 20.0
                }
            });
    
            cornerstoneTools.addTool(StackScrollMouseWheelTool);
            cornerstoneTools.setToolActive("StackScrollMouseWheel", {});
            cornerstoneTools.setToolActive("Zoom", { mouseButtonMask: 2 });

            // Calling PNG images
            init();
            });     
        }

        async function init() {
            
            const images = await loadImages(); // Contains ALL the PNG ImageLoadObject
            console.log("Images array: ", images);
    
            let layerIdPNG;
    
            images.forEach(function(image) {
                layerIdPNG = cornerstone.addLayer( 
                    element,
                    image,
                    layers[1].options
                );
                console.log("Current layerIdPNG is: ", layerIdPNG);
                layers[1].layerId.push(layerIdPNG);
            })
            console.log("Layer Id for PNG is: ", layers[1].layerId);
    
            // cornerstone.setActiveLayer(element, layerIdPNG);
            console.log("Current layers: ", cornerstone.getLayers(element));
            console.log("Current active layer: ", cornerstone.getActiveLayer(element));
            cornerstone.updateImage(element);
        }

        function setEventListeners() {
            
            // viewerRef.current.addEventListener(
            //   "cornerstonetoolsmousewheel",
            //   (event) => {
            //     // scroll forward
            //     if (event.detail.detail.deltaY < 0) {
            //       setWheelY((position) => {
            //         if (position >= 1) {
            //           position = 1;
            //         } else {
            //           position += 1;
            //         }
      
            //         updateTheImages(position);
            //         return position;
            //       });
            //     } else {
            //       // scroll back
            //       setWheelY((position) => {
            //         if (position <= 0) {
            //           position = 0;
            //         } else {
            //           position -= 1;
            //         }
      
            //         updateTheImages(position);
            //         return position;
            //       });
            //     }
            //   }
            // );
      
            // Whenever the active layer is changed. Updates the parameters 
            element.addEventListener(
              "cornerstoneactivelayerchanged",
              function (e) {
                const layer = cornerstone.getActiveLayer(element);
                // const colormap = layer.viewport.colormap;
                const opacity = layer.options.opacity;
                const isVisible = layer.options.visible;
      
                unstable_batchedUpdates(() => {
                  setOpacity(opacity);
                  setIsVisible(isVisible);
                //   setColor(colormap);
                });
              }
            );
          }

    };

    const onChangeLayer = (e) => {
        const type = e.target.value;
        console.log("Type value: ", type);

        if (type === "SEGMENTATION"){
            console.log("In segment, LayerId in layers array: ", layers[1].layerId[0]);
            cornerstone.setActiveLayer(element, layers[1].layerId[0]);
        }
        else{
            console.log("In dicom, LayerId in layers array: ", layers[0].layerId);
            cornerstone.setActiveLayer(element, layers[0].layerId);
        }
    };

    const setZoomActive = e => {
    const ZoomMouseWheelTool = cornerstoneTools.ZoomMouseWheelTool;

    cornerstoneTools.addTool(ZoomMouseWheelTool);
    cornerstoneTools.setToolActive("ZoomMouseWheel", { mouseButtonMask: 1 });
    const PanTool = cornerstoneTools.PanTool;

    cornerstoneTools.addTool(PanTool);
    cornerstoneTools.setToolActive("Pan", { mouseButtonMask: 1 });
    };

    const setMouseWheelActive = e => {
    const StackScrollMouseWheelTool =
    cornerstoneTools.StackScrollMouseWheelTool;
    cornerstoneTools.addTool(StackScrollMouseWheelTool);
    cornerstoneTools.setToolActive("StackScrollMouseWheel", {});
    };

    const setLengthActive = e => {
    const LengthTool = cornerstoneTools.LengthTool;
    cornerstoneTools.addTool(LengthTool);
    cornerstoneTools.setToolActive("Length", { mouseButtonMask: 1 });
    };

    const setWwwcActive = e => {
    const WwwcTool = cornerstoneTools.WwwcTool;
    cornerstoneTools.addTool(WwwcTool);
    cornerstoneTools.setToolActive("Wwwc", { mouseButtonMask: 1 });
    };

    const setEraserActive = e => {
    const EraserTool = cornerstoneTools.EraserTool;
    cornerstoneTools.addTool(EraserTool);
    cornerstoneTools.setToolActive("Eraser", { mouseButtonMask: 1 });
    };

    const onChangeOpacity = (e) => {
        const opacity = e.target.value;
        const layer = cornerstone.getActiveLayer(element);
        layer.options.opacity = opacity;
        cornerstone.updateImage(element);
        setOpacity(opacity);
    };

    const onChangeVisibility = (e) => {
        setIsVisible((isVisible = true) => {
            isVisible = !isVisible;
            
            const layer = cornerstone.getActiveLayer(element);
            layer.options.visible = isVisible;
            if (isVisible) {
                return isVisible;
            } else {
            return isVisible;
            }
        });
        cornerstone.updateImage(element);
    };

    return (
        <div>
            <h2>DICOM viewer demo</h2>
            <input type="file" onChange={handleFileChange} multiple />

            <label htmlFor="layer">Active layer: </label>
            <select id="layer" onChange={onChangeLayer}>
                <option value={"DICOM"}>DICOM</option>
                <option value={"SEGMENTATION"}>SEGMENTATION</option>
            </select>

            <label htmlFor="opacity"> Opacity: </label>
            <span id="opacity">{opacity}</span>
            <input
            type="range"
            onChange={onChangeOpacity}
            name="opacity"
            min="0"
            max="1"
            step="0.01"
            value={opacity}
            />

            <label htmlFor="visible"> visibility : </label>
            <input
            id="visible"
            type="checkbox"
            checked={isVisible}
            onChange={onChangeVisibility}
            />

            <button onClick={setZoomActive} style={{ marginLeft: "10px" }} >Zoom/Pan</button>
            <button onClick={setMouseWheelActive} style={{ marginLeft: "10px" }}>
                Scroll
            </button>
            <button onClick={setLengthActive} style={{ marginLeft: "10px" }}>
                Length
            </button>
            <button onClick={setWwwcActive} style={{ marginLeft: "10px" }}>
                WWWC
            </button>
            <button onClick={setEraserActive} style={{ marginLeft: "10px" }}>
                Eraser
            </button>
            <div className="dicom-wrapper">
                <div className="thumbnail-selector">
                <div className="thumbnail-list" id="thumbnail-list">
                    {imageIds.map(imageId => {
                    return (
                        <a>
                        <div id={imageId} className="thumbnail-item"/>
                        </a>
                    );
                    })}
                </div>
                </div>

                <div className="dicom-viewer">
                    <div id="dicomImage" />
                </div>
                
                <div className = 'PNG-viewer'>
                    <div id="PNGImage"/>
                </div>

            </div>
        </div>
    );
};

export default View;
