import React, {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import {unstable_batchedUpdates} from "react-dom";
import cornerstone from "cornerstone-core";
import cornerstoneMath from "cornerstone-math";
import cornerstoneTools from "cornerstone-tools";
import cornerstoneWebImageLoader from "cornerstone-web-image-loader";
import cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import dicomParser from "dicom-parser";
import Hammer from "hammerjs";

const mriImages = [
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Structural_MRI_animation.ogv/220px--Structural_MRI_animation.ogv.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/RupturedAAA.png/250px-RupturedAAA.png"
];
const segmantationImages = [
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQjJeRHGA9au9dYtoM8aiMbp7bEEv_PNYrYrA&usqp=CAU",
  "https://miro.medium.com/max/394/1*WmnWtjS5UhGxCuKoAF4XpA.png"
];

// A layers array to store and set the settings for the different kinds of images 
const layers = [
  {
    images: mriImages, // array of MRI images
    layerId: "",
    options: {
      visible: true,
      opacity: 1,
      name: "MRI",
      viewport: {
        colormap: ""
      }
    }
  },
  {
    images: segmantationImages, // array of segmentation images
    layerId: "",
    options: {
      name: "SEGMANTATION",
      visible: true,
      opacity: 0.7,
      viewport: {
        colormap: "",
        voi: {
          windowWidth: 30,
          windowCenter: 16
        }
      }
    }
  }
];

// Array of tools for the left mouse click 
const leftMouseToolChain = [
  { name: "Pan", func: cornerstoneTools.PanTool, config: {} },
  { name: "Magnify", func: cornerstoneTools.MagnifyTool, config: {} },
  { name: "Angle", func: cornerstoneTools.AngleTool, config: {} },
  { name: "Wwwc", func: cornerstoneTools.WwwcTool, config: {} },
  { name: "Eraser", func: cornerstoneTools.EraserTool, config: {} }
];

// Viewer Component
function Viewer () {

  // All react states
  const [wheelY, setWheelY] = useState(0);
  const [opacity, setOpacity] = useState(0);
  const [layerIndex, setLayerIndex] = useState(1);
  const [isVisible, setIsVisible] = useState(true);
  const [color, setColor] = useState("");
  const [colorMapList, setColorMapList] = useState(
    cornerstone.colors.getColormapsList()
  );
  const [leftMouseTool, setLeftMouseTool] = useState(
    leftMouseToolChain[0].name //default left click is to "Pan"
  );

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [imageIds, setImageIds] = useState([]);
  let element;

  // All react references
  const viewerRef = useRef(null);
  const leftMouseToolsRef = useRef(null);

  // Function that returns the ImageLoadObject in the layers array (index 0 being the first combinatino of MRI and segmentation images)
  // NOTE that the default index is 0, thus, the first combination of MRI and segmentation images will be displayed
  function loadImages(index = 0) {
    const promises = [];

    // NOTE: A layer refers to a type of images (eg. Segmentation or MRI)
    layers.forEach(function (layer) {
      if (layer.options.visible) {
        console.log("ImageId: ", layer.images[index]);
        const loadPromise = cornerstone.loadAndCacheImage(layer.images[index]); // returns ImageLoadObject which is a promise  
        promises.push(loadPromise);
      }
    });

    // Loads all the images if all is sucessful and will not load any if a single fails
    return Promise.all(promises); 
  }

  // Function that upadates the images (based on index) whenever the viewerRef is altered. useCallback returns the function 'updateTheImages" itself
  const updateTheImages = useCallback(
    async (index) => {
      console.log("Updating the images. Currently in the function updateTheImages");
      const images = await loadImages(index); // Calls the loadImages function which returns all the Image Objects
      images.forEach((image, index) => {
        cornerstone.setLayerImage( // Sets a new image for a specific layedid
          viewerRef.current,
          image,
          layers[index].layerId
        );
        cornerstone.updateImage(viewerRef.current); // Forces the images to be updated/ redrawn for the specificed enabled element
      });
      console.log("Current layers: ", cornerstone.getLayers(viewerRef.current));
    },
    []
  );

  // An effect that runs whenever updateTheImages function is altered 
  useEffect(() => {
    if (!viewerRef.current) { // Value will be false after mounting as viewerRef.current will be assigned with the DOM element
      return;
    }

    console.log("Currently in the useEffect function");

    cornerstoneTools.external.cornerstone = cornerstone;
    cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
    cornerstoneWebImageLoader.external.cornerstone = cornerstone;
    cornerstoneTools.external.Hammer = Hammer;
    cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
    cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
    cornerstoneTools.init();

    // Enabling the viewerRef element 
    cornerstone.enable(viewerRef.current);
    init();
    setTools();
    setEventListeners();

    console.log("Current layers FINAL: ", cornerstone.getLayers(viewerRef.current));
    console.log("Current active layer FINAL: ", cornerstone.getActiveLayer(viewerRef.current));

    // ADDED LINES
    // element = document.getElementById("dicomImage");
    // cornerstone.enable(element);

    // When component gets unmounted -> need to remove all the event listeners
    return () => {
      removeEventListeners();
    };

    // NEED TO IMPLEMENT REMOVE EVENT LISTENERS IF NOT THE EVENTS WILL ALWAYS BE LISTENED FOR
    function removeEventListeners() {}

    function setEventListeners() {
      viewerRef.current.addEventListener(
        "cornerstonetoolsmousedrag",
        (event) => {
          // console.log(event.detail)
        }
      );

      viewerRef.current.addEventListener(
        "cornerstonetoolsmousewheel",
        (event) => {
          // scroll forward
          if (event.detail.detail.deltaY < 0) {
            setWheelY((position) => {
              if (position >= 1) {
                position = 1;
              } else {
                position += 1;
              }

              updateTheImages(position);
              return position;
            });
          } else {
            // scroll back
            setWheelY((position) => {
              if (position <= 0) {
                position = 0;
              } else {
                position -= 1;
              }

              updateTheImages(position);
              return position;
            });
          }
        }
      );

      // Whenever the active layer is changed. Updates the parameters 
      viewerRef.current.addEventListener(
        "cornerstoneactivelayerchanged",
        function (e) {
          const layer = cornerstone.getActiveLayer(viewerRef.current);
          console.log("Currently in event listener. Current active layer: ", layer);
          const colormap = layer.viewport.colormap;
          const opacity = layer.options.opacity;
          const isVisible = layer.options.visible;

          unstable_batchedUpdates(() => {
            setOpacity(opacity);
            setIsVisible(isVisible);
            setColor(colormap);
          });
        }
      );
    }

    function setTools() {

      console.log("Currently in setTools function");
      
      // zoom
      const zoomTool = cornerstoneTools.ZoomTool;
      cornerstoneTools.addTool(zoomTool, {
        configuration: {
          invert: false,
          preventZoomOutsideImage: false,
          minScale: 0.1,
          maxScale: 20.0
        }
      });
      cornerstoneTools.setToolActive("Zoom", { mouseButtonMask: 2 });

      for (let i = 0; i < leftMouseToolChain.length; i++) {
        if (i === 0) {
          // panning
          cornerstoneTools.addTool(leftMouseToolChain[i].func);
          cornerstoneTools.setToolActive(leftMouseToolChain[i].name, {
            mouseButtonMask: 1
          });
        } else {
          cornerstoneTools.addTool(leftMouseToolChain[i].func);
          cornerstoneTools.setToolPassive(leftMouseToolChain[i].name, {
            mouseButtonMask: 1
          });
        }
      }
    }

    async function init() {

      // Images now contains the first combination of images: MRI + Segmentation
      const images = await loadImages();
      console.log("Images array: ", images);

      images.forEach((image, index) => {
        const layer = layers[index];
        const layerId = cornerstone.addLayer( // Added both MRI + Segmentation as a layer
          viewerRef.current,
          image,
          layer.options
        );
        layers[index].layerId = layerId;

        // Segmentation will be the active layer
        if (index === 1) { 
          cornerstone.setActiveLayer(viewerRef.current, layerId);
        }

        // Display the first image
        console.log("Current layers: ", cornerstone.getLayers(viewerRef.current));
        cornerstone.updateImage(viewerRef.current);
      });
    }

  }, []);

  
  const onClickToggleInterpolation = () => {
    const viewport = cornerstone.getViewport(viewerRef.current);
    viewport.pixelReplication = !viewport.pixelReplication;
    cornerstone.setViewport(viewerRef.current, viewport);
  };

  const onClickRotation = () => {
    const viewport = cornerstone.getViewport(viewerRef.current);
    viewport.rotation += 90;
    cornerstone.setViewport(viewerRef.current, viewport);
  };

  const onChangeVisibility = (event) => {
    setIsVisible((isVisible = true) => {
      isVisible = !isVisible;
      
      const layer = cornerstone.getActiveLayer(viewerRef.current);
      layer.options.visible = isVisible;
      if (isVisible) {
        updateTheImages(wheelY).then(() => {
          return isVisible;
        });
      } else {
        return isVisible;
      }
    });
    cornerstone.updateImage(viewerRef.current);
  };

  const onChangeOpacity = (event) => {
    const opacity = event.target.value;
    const layer = cornerstone.getActiveLayer(viewerRef.current);
    layer.options.opacity = opacity;
    cornerstone.updateImage(viewerRef.current);
    setOpacity(opacity);
  };

  const onChangeLayer = (event) => {
    const index = event.target.value; // Index 0 refers to MRI and index 1 refers to Segmentation
    setLayerIndex(index);
    cornerstone.setActiveLayer(viewerRef.current, layers[index].layerId);
    console.log("Layer being changed... currently in onChangeLayer function");
  };

  const onChangeColorMapList = (event) => {
    // greyscale https://github.com/cornerstonejs/cornerstone/issues/463
    const color = event.target.value;
    const layer = cornerstone.getActiveLayer(viewerRef.current);
    layer.viewport.colormap = color;
    cornerstone.updateImage(viewerRef.current);
    setColor(color);
  };

  const onClickToggleInvert = (event) => {
    const viewport = cornerstone.getViewport(viewerRef.current);
    viewport.invert = !viewport.invert;
    cornerstone.setViewport(viewerRef.current, viewport);
  };

  const onChangeLTools = (event) => {
    const toolName = event.target.value;

    for (let i = 0; i < leftMouseToolChain.length; i++) {
      if (leftMouseToolChain[i].name === toolName) {
        // panning
        cornerstoneTools.addTool(leftMouseToolChain[i].func);
        cornerstoneTools.setToolActive(leftMouseToolChain[i].name, {
          mouseButtonMask: 1
        });
      } else {
        cornerstoneTools.addTool(leftMouseToolChain[i].func);
        cornerstoneTools.setToolPassive(leftMouseToolChain[i].name, {
          mouseButtonMask: 1
        });

        // You can make tool disabled
        // cornerstoneTools.setToolDisabled(leftMouseToolChain[i].name, {
        //   mouseButtonMask: 1
        // });
        cornerstone.updateImage(viewerRef.current);
      }
    }

    setLeftMouseTool(toolName);
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setUploadedFiles(files);
    const imageIds = files.map(file => {
      return cornerstoneWADOImageLoader.wadouri.fileManager.add(file);
    });
    setImageIds(imageIds);
    const StackScrollMouseWheelTool =
      cornerstoneTools.StackScrollMouseWheelTool;
    const stack = {
      currentImageIdIndex: 0,
      imageIds
    };
    cornerstone.loadImage(imageIds[0]).then(image => {
      cornerstone.displayImage(element, image);
      cornerstoneTools.addStackStateManager(element, ["stack"]);
      cornerstoneTools.addToolState(element, "stack", stack);
    });
    setTimeout(() => {
      imageIds.forEach(imageId => {
        const thumbnailElement = document.getElementById(imageId);
        cornerstone.enable(thumbnailElement);
        cornerstone.loadImage(imageId).then(image => {
          cornerstone.displayImage(thumbnailElement, image);
          cornerstoneTools.addStackStateManager(element, ["stack"]);
          cornerstoneTools.addToolState(element, "stack", stack);
        });
      });
    }, 1000);
    cornerstoneTools.addTool(StackScrollMouseWheelTool);
    cornerstoneTools.setToolActive("StackScrollMouseWheel", {});
  };

  return (
    <div>
      <div>
        <input type="file" onChange={handleFileChange} multiple />
        
        <div className="dicom-wrapper">
          <h1>TEST</h1>
          <div className="thumbnail-selector">
            <div className="thumbnail-list" id="thumbnail-list">
              {imageIds.map(imageId => {
                return (
                  <a
                    onContextMenu={() => false}
                    unselectable="on"
                    onMouseDown={() => false}
                    onSelect={() => false}
                  >
                    
                  </a>
                );
              })}
            </div>
          </div>
          <div
            onContextMenu={() => false}
            className="dicom-viewer"
            unselectable="on"
          >
          <div id="dicomImage" />
        </div>
      </div>


        <label htmlFor="layer">Active layer: </label>
        <select id="layer" onChange={onChangeLayer} value={layerIndex}>
          <option value={0}>MRI</option>
          <option value={1}>SEGMANTATION</option>
        </select>

        <label htmlFor="wheelY"> wheelY: </label>
        <span id="wheelY">{wheelY}</span>

        <label htmlFor="opacity"> opacity: </label>
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

        <label htmlFor="layer"> Color map: </label>
        <select id="colorMap" value={color} onChange={onChangeColorMapList}>
          <option value="">None</option>
          {colorMapList.map((colorMapItem, index) => (
            <option key={colorMapItem.name + index} value={colorMapItem.id}>
              {colorMapItem.name}
            </option>
          ))}
        </select>

        <label htmlFor="visible"> visibility : </label>
        <input
          id="visible"
          type="checkbox"
          checked={isVisible}
          onChange={onChangeVisibility}
        />

        <button id="rotate" onClick={onClickRotation}>
          rotate 90
        </button>
        <button id="interpolation" onClick={onClickToggleInterpolation}>
          toggle interpolation
        </button>
        <button id="interpolation" onClick={onClickToggleInvert}>
          toggle invert
        </button>

        <form
          id="l-mouse-tools"
          ref={leftMouseToolsRef}
          onChange={onChangeLTools}
        >
          <label htmlFor="l-mouse-tools"> select L-mouse tool: </label>
          {leftMouseToolChain.map((tool) => (
            <Fragment key={tool.name}>
              <label htmlFor={tool.name}>{`| ${tool.name} =>`}</label>
              <input
                type="radio"
                name="l-mouse-tool"
                id={tool.name}
                value={tool.name}
                checked={tool.name === leftMouseTool}
              />
            </Fragment>
          ))}
        </form>

      </div>
      <div
        ref={viewerRef}
        id="viewer"
        style={{
          width: "512px",
          height: "512px"
        }}
      />
    </div>
  );
};

export default Viewer;
