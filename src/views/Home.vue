<template>
  <div class="home">
    <div class="flex items-center justify-center space-x-8">
      <!-- Drag & Drop -->
      <div @dragover.prevent @drop.prevent class="mx-4 mt-4 h-24 w-48 border-4">
        <div @drop="dragFile">
          <input
            type="file"
            multiple
            @change="uploadFile"
            class="h-full w-full opacity-0"
          />
          put your svg
        </div>
      </div>
    </div>
    <div class="flex">
      <div class="flex-item" v-if="svgData">
        before<br />
        <img :src="svgData" class="mx-4 mt-4 h-48 w-48" />
      </div>
      <div class="flex-item" v-if="convedSVGData">
        after<br />
        <img
          :src="convedSVGData"
          class="mx-4 mt-4 h-48 w-48"
        />
      </div>
    </div>
    <div v-if="svgText" class="mx-16 text-left">
      <h2>original svg</h2>
      <pre class="whitespace-pre-wrap break-words bg-gray-200 p-4">{{
        format(svgText)
      }}</pre>
    </div>
    <hr />
    <div v-if="convedSVGText" class="mx-16 text-left">
      <h2>converted svg</h2>
      <pre class="whitespace-pre-wrap break-words bg-gray-200 p-4">{{
        format(convedSVGText)
      }}</pre>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { convSVG2SVG, svg2imgSrc } from "@/lib/svgtool";
import format from "xml-formatter";

export default defineComponent({
  components: {},
  setup() {
    const file = ref();

    const svgData = ref("");
    const convedSVGData = ref("");

    const svgText = ref("");
    const convedSVGText = ref("");

    const readSVGData = async () => {
      svgText.value = await file.value.text();
      svgData.value = svg2imgSrc(svgText.value);
      convedSVGText.value = convSVG2SVG(svgText.value);
      convedSVGData.value = svg2imgSrc(convedSVGText.value);
    };

    const uploadFile = (e: any) => {
      if (e.target.files && e.target.files.length > 0) {
        file.value = e.target.files[0];
        readSVGData();
      }
    };
    const dragFile = (e: any) => {
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        file.value = e.dataTransfer.files[0];
        readSVGData();
      }
    };
    return {
      uploadFile,
      dragFile,

      svgData,
      convedSVGData,

      svgText,
      convedSVGText,

      format,
    };
  },
});
</script>
