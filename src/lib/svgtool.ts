import { parse, ElementNode, Node } from "svg-parser";

import { normalizePath, compressPath, solidityString } from "./pathUtils";

// svg to svg
const circle2path = (element: ElementNode) => {
  const cx = Number(element.properties?.cx);
  const cy = Number(element.properties?.cy);
  const r = Number(element.properties?.r);
  return `M ${cx} ${cy} m ${-r}, 0 a ${r},${r} 0 1,1 ${
    r * 2
  },0 a ${r},${r} 0 1,1 ${-(r * 2)},0`;
};

const polygon2path = (element: ElementNode) => {
  const points = ((element.properties?.points as string) || "").split(/\s+|,/);
  const x0 = points.shift();
  const y0 = points.shift();
  return "M" + x0 + "," + y0 + "L" + points.join(" ") + "z";
};

const ellipse2path = (element: ElementNode) => {
  const cx = Number(element.properties?.cx);
  const cy = Number(element.properties?.cy);
  const rx = Number(element.properties?.rx);
  const ry = Number(element.properties?.ry);
  return `M ${cx} ${cy} m ${-rx}, 0 a ${rx},${ry} 0 1,0 ${
    rx * 2
  },0 a ${rx},${ry} 0 1,0 ${-(rx * 2)},0`;
};

const rect2path = (element: ElementNode) => {
  const x = Number(element.properties?.x || "0");
  const y = Number(element.properties?.y || "0");
  const rx = Number(element.properties?.width);
  const ry = Number(element.properties?.height);
  return `M ${x} ${y} H ${rx + x} V ${ry + y} H ${x} Z`;
};
// end of svg to svg

const findPath = (obj: ElementNode[]) => {
  const ret: ElementNode[] = [];

  obj.map((element) => {
    if (element.children) {
      findPath(element.children as ElementNode[]).map((childRet) => {
        ret.push(childRet);
      });
    }
    if (element.tagName === "path") {
      ret.push(element);
    }
    if (element.tagName === "circle") {
      if (element.properties) {
        element.properties.d = circle2path(element);
      }
      ret.push(element);
    }
    if (element.tagName === "ellipse") {
      if (element.properties) {
        element.properties.d = ellipse2path(element);
      }
      ret.push(element);
    }
    if (element.tagName === "rect") {
      if (element.properties) {
        element.properties.d = rect2path(element);
      }
      ret.push(element);
    }
    if (element.tagName === "polygon") {
      if (element.properties) {
        element.properties.d = polygon2path(element);
      }
      ret.push(element);
    }
  });
  return ret;
};

const getSvgSize = (svg: ElementNode) => {
  const viewBox = ((svg.properties?.viewBox as string) || "").split(" ");
  const originalWidth = parseInt(viewBox[2], 10);
  const originalHeight = parseInt(viewBox[3], 10);
  const max = Math.max(originalWidth, originalHeight);
  const width = Math.round((originalWidth * 1024) / max);
  const height = Math.round((originalHeight * 1024) / max);

  return { height, width, max };
};

// properties

// end of properties

const dumpConvertSVG = (svg: ElementNode, paths: any[]) => {
  const vb = (svg.properties?.viewBox as string) || "";
  const ret =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">\n\t<g>\n` +
    paths
      .map((pathData) => {
        const d = pathData["path"];

        // styles
        const fill = pathData["fill"];
        const strokeW = pathData["strokeW"];
        const stroke = pathData["stroke"];
        const styles = [];
        if (fill) {
          styles.push(`fill:${fill}`);
        }
        if (strokeW || stroke) {
          styles.push(`stroke-linecap:round;stroke-linejoin:round`);
          styles.push(`stroke-width:${strokeW || 3}`);
          styles.push(`stroke:${stroke || "#000"}`);
        }
        const style = styles.join(";");

        const opts: string[] = [];
        if (pathData["translate"] && pathData["translate"].length == 2) {
          const x = pathData["translate"][0];
          const y = pathData["translate"][1];
          opts.push(`transform="translate(${x},${y})"`);
        }
        const options = opts.join(" ");
        return `\t\t<path d="${d}" style="${style}" ${options} />`;
      })
      .join("\n") +
    "\n\t</g>\n</svg>\n";
  return ret;
};

const style2elem = (style: string) => {
  const styles = style.split(";").map((a) => a.split(":"));
  return styles.reduce((tmp: any, key: string[]) => {
    tmp[key[0]] = key[1];
    return tmp;
  }, {});
};

const getElementProperty = (element: ElementNode, name: string) => {
  if ((element.properties || {})[name]) {
    return (element.properties || {})[name];
  }
  const styles = style2elem((element.properties?.style as string) || "");
  const fill = styles[name] || "";
  return fill;
};

const element2fill = (element: ElementNode) => {
  return getElementProperty(element, "fill");
};
const element2stroke = (element: ElementNode) => {
  return getElementProperty(element, "stroke");
};

const element2strokeWidth = (element: ElementNode, max: number) => {
  if ((element.properties || {})["stroke-width"]) {
    return (element.properties || {})["stroke-width"];
  }
  const styles = style2elem((element.properties?.style as string) || "");
  const match = (styles["stroke-width"] || "").match(/^\d+/);
  const stroke = match ? (match[0] * 1024) / max : 0;

  return Math.round(stroke);
};

const element2translate = (element: ElementNode) => {
  const transform = getElementProperty(element, "transform");
  const match = (transform || "").match(/translate\((\d+),(\d+)\)/);
  if (match) {
    return [Number(match[1]), Number(match[2])];
  }
  return [];
};

export const convSVG2SVG = (svtText: string) => {
  const obj = parse(svtText);

  const svg = obj.children[0] as ElementNode;
  const { height, width, max } = getSvgSize(svg);

  const pathElements = findPath(svg.children as ElementNode[]);
  console.log(pathElements);
  const path2 = pathElements.map((element: ElementNode) => {
    const fill = element2fill(element);
    const stroke = element2stroke(element);
    const strokeWidth = element2strokeWidth(element, max);
    const translate = element2translate(element);
    console.log(strokeWidth, translate);
    return {
      path: normalizePath(String(element.properties?.d) || "", Number(max)),
      fill,
      stroke,
      strokeW: strokeWidth,
      translate,
    };
  });

  const convertedSVG = dumpConvertSVG(svg, path2);
  return convertedSVG;
};

const main = async (folder: string) => {
  /*

  const obj = parse(svgData);

  const svg = obj.children[0] as ElementNode;
  const { height, width, max } = getSvgSize(svg);
  
  const pathElements = findPath(svg.children as ElementNode[]);
  
  const path = pathElements
  .map((item: ElementNode) => {
  return item.properties?.d;
  })
  .join("");
  //console.log(path)
  

  });
  const constants = array
    .map((item) => {
      const length = item.path2.length;
      const {  width, height, max } = item;
      const paths: any[] = [];
      const fills: any[] = [];
      const stroke: any[] = [];

      item.path2.map((path, k) => {
        paths.push(`          paths[${k}] = "${solidityString(compressPath(path.path as string, 1024))}";`);
        fills.push(`          fill[${k}] = "${path.fill}";`);
        stroke.push(`          stroke[${k}] = ${path.stroke || 0};`);
        // console.log(path.fill);
      });
      const code = [
        `      function parts_${item.name}() internal pure returns(uint16[4] memory sizes, bytes[] memory paths, string[] memory fill, uint8[] memory stroke) {`,
        `          sizes = [${length}, ${max}, ${width}, ${height}];`,
        "          paths = new bytes[](sizes[0]);",
        "          fill = new string[](sizes[0]);",
        "          stroke = new uint8[](sizes[0]);",
        "",
        paths.join("\n"),
        fills.join("\n"),
        stroke.join("\n"),
        "      }",
      ].join("\n");
      // console.log(item);
      
      // const code = `bytes constant ${item.name} = "${item.bytes}"`;
      stream.write(`${code}\n`);

      return code;
    })
    .join("\n");
  console.log(constants);
  
  const calls = array
    .map((item) => {
      const code = `register("${item.char}", ${item.name}, ${item.width});`;
      stream.write(`${code}\n`);
      return code;
    })
    .join("\n");
  // console.log(calls);

  const calls2 = array
    .map((item) => {
      const code = `parts["${item.name}"] = parts_${item.name};`
      stream.write(`${code}\n`);
      return code;
    })
    .join("\n");
  // console.log(calls);
  console.log(calls2)
      
*/
};
