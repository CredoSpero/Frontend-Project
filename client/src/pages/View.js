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
import Hammer from "hammerjs";

const mriImages = [
  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Structural_MRI_animation.ogv/220px--Structural_MRI_animation.ogv.jpg",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/RupturedAAA.png/250px-RupturedAAA.png"
];
const segmantationImages = [
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQjJeRHGA9au9dYtoM8aiMbp7bEEv_PNYrYrA&usqp=CAU",
  "https://miro.medium.com/max/394/1*WmnWtjS5UhGxCuKoAF4XpA.png"
];

const layers = [
  {
    images: mriImages,
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
    images: segmantationImages,
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

console.log(cornerstoneTools.ZoomTool);
const leftMouseToolChain = [
  { name: "Pan", func: cornerstoneTools.PanTool, config: {} },
  { name: "Magnify", func: cornerstoneTools.MagnifyTool, config: {} },
  { name: "Angle", func: cornerstoneTools.AngleTool, config: {} },
  { name: "Wwwc", func: cornerstoneTools.WwwcTool, config: {} },
  { name: "Eraser", func: cornerstoneTools.EraserTool, config: {} }
];

function View () {
  const [wheelY, setWheelY] = useState(0);
  const [opacity, setOpacity] = useState(0);
  const [layerIndex, setLayerIndex] = useState(1);
  const [isVisible, setIsVisible] = useState(true);
  const [colorMapList, setColorMapList] = useState(
    cornerstone.colors.getColormapsList()
  );
  const [color, setColor] = useState("");
  const viewerRef = useRef(null);
  const leftMouseToolsRef = useRef(null);
  const [leftMouseTool, setLeftMouseTool] = useState(
    leftMouseToolChain[0].name
  );

  function loadImages(index = 0) {
    const promises = [];

    layers.forEach(function (layer) {
      if (layer.options.visible) {
        const loadPromise = cornerstone.loadAndCacheImage(layer.images[index]);
        promises.push(loadPromise);
      }
    });

    return Promise.all(promises);
  }

  const updateTheImages = useCallback(
    async (index) => {
      const images = await loadImages(index);
      images.forEach((image, index) => {
        cornerstone.setLayerImage(
          viewerRef.current,
          image,
          layers[index].layerId
        );
        cornerstone.updateImage(viewerRef.current);
      });
    },
    [viewerRef]
  );

  useEffect(() => {
    if (!viewerRef.current) {
      return;
    }

    cornerstoneTools.external.cornerstone = cornerstone;
    cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
    cornerstoneWebImageLoader.external.cornerstone = cornerstone;
    cornerstoneTools.external.Hammer = Hammer;
    cornerstoneTools.init();
    cornerstone.enable(viewerRef.current);
    init();
    setTools();
    setEventListeners();
    return () => {
      removeEventListeners();
    };

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
      // active layer가 변경되면 발동되는 이벤트
      viewerRef.current.addEventListener(
        "cornerstoneactivelayerchanged",
        function (e) {
          const layer = cornerstone.getActiveLayer(viewerRef.current);
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
      const images = await loadImages();
      images.forEach((image, index) => {
        const layer = layers[index];
        const layerId = cornerstone.addLayer(
          viewerRef.current,
          image,
          layer.options
        );
        layers[index].layerId = layerId;

        // segmantaion 이미지를 액티브 레이어로 설정한다.
        if (index === 1) {
          cornerstone.setActiveLayer(viewerRef.current, layerId);
        }

        // Display the first image
        cornerstone.updateImage(viewerRef.current);
      });
    }
  }, [updateTheImages]);

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
      // false일 때 이미지 로딩하기
      // 만약 visible false로 두고 스크롤 시 visible false인 이미지는 loading하지 않음
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
    // cornerstone에서 object 값을 listen 한다.
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
    const index = event.target.value;
    setLayerIndex(index);
    cornerstone.setActiveLayer(viewerRef.current, layers[index].layerId);
  };

  const onChangeColorMapList = (event) => {
    // greyscale 일 때 color map 이슈가 있음 https://github.com/cornerstonejs/cornerstone/issues/463
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

  // TOOD: html overlay
  // svg로 도형 그려보기
  // stack 매니져 써보기
  // 툴 사용중 다른 툴로 넘어갈 때 angle이 그대로 작동됨 어떻게 해결할까?
  // 에러, 경고 없애기
  // 성능 측정
  // 최종 결과물: viewer 4개가 있고 하나의 viewer (3d rendering)따라서 Reference Lines Tool 기능 사용하기

  return (
    <div>
      <div>
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

export default View;
// const root = ReactDOM.createRoot(document.getElementById("root"))
// root.render(<App />);