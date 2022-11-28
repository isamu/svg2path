<template>
<div>
  {{}}
    <div class="flex" v-for="(image, k) in images" :key="k">
      <div class="flex-item">
        before<br />
        <img :src="image.svgData" class="mx-4 mt-4 h-48 w-48" />
      </div>
      <div class="flex-item">
        after<br />
        <img
          :src="image.convedSVGData"
          class="mx-4 mt-4 h-48 w-48"
        />
      </div>
    </div>

</div>
</template>
<script lang="ts">
import { defineComponent, ref } from "vue";
import { convSVG2SVG, svg2imgSrc } from "@/lib/svgtool";

import { svg } from "../testdata/svg1";

export default defineComponent({
  components: {},
  setup() {
    console.log(svg);

    const images = svg.map(item => {
      const svgData = svg2imgSrc(item);
      const convedSVGText = convSVG2SVG(item);
      const convedSVGData = svg2imgSrc(convedSVGText);
      return {
        svgData,
        convedSVGData,
      };
    });
    
    return {
      images,
    };
  },
});
</script>
