<!-- PdfViewer.vue -->
<template>
    <div id="viewerContainer">
        <div id="viewer" class="pdfViewer"></div>
    </div>
</template>

<script>
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'; 
import * as pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker';
import * as pdfjsViewer from 'pdfjs-dist/legacy/web/pdf_viewer';

const CMAP_URL = "pdfjs-dist/cmaps/";
const CMAP_PACKED = true;
const SANDBOX_BUNDLE_SRC = new URL(
    "pdfjs-dist/build/pdf.sandbox.mjs",
    window.location
);
const ENABLE_XFA = true;
const SEARCH_FOR = ""; // try "Mozilla";


export default {
    name: "PdfViewer",
    data(){
        return {
            pdfLoaded: false,
            page: 1,
            pdfUrl: this.$route.query.pdfUrl,
        }
    },

    mounted() {
        // 初始化PDF.js
        pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
        this.loadPdf(this.pdfUrl);
    },
    methods: {
        async loadPdf(pdfUrl) {
            // Load the PDF using PDF.js
            const container = document.getElementById("viewerContainer");
            const eventBus = new pdfjsViewer.EventBus();
            const pdfLinkService = new pdfjsViewer.PDFLinkService({
                eventBus,
            });
            const pdfFindController = new pdfjsViewer.PDFFindController({
                eventBus,
                linkService: pdfLinkService,
            });
            const pdfScriptingManager = new pdfjsViewer.PDFScriptingManager({
                eventBus,
                sandboxBundleSrc: SANDBOX_BUNDLE_SRC,
            });
            const pdfViewer = new pdfjsViewer.PDFViewer({
                container,
                eventBus,
                linkService: pdfLinkService,
                findController: pdfFindController,
                scriptingManager: pdfScriptingManager,
            });
            pdfViewer.textLayerMode = 1;
            pdfLinkService.setViewer(pdfViewer);
            pdfScriptingManager.setViewer(pdfViewer);

            eventBus.on("pagesinit", function () {
                // We can use pdfViewer now, e.g. let's change default scale.
                pdfViewer.currentScaleValue = "page-width";

                // We can try searching for things.
                if (SEARCH_FOR) {
                    eventBus.dispatch("find", { type: "", query: SEARCH_FOR });
                }
            });

            // Loading document.
            const loadingTask = pdfjsLib.getDocument({
                url: pdfUrl,
                cMapUrl: CMAP_URL,
                cMapPacked: CMAP_PACKED,
                enableXfa: ENABLE_XFA,
            });

            const pdfDocument = await loadingTask.promise;
            // Document loaded, specifying document for the viewer and
            // the (optional) linkService.
            pdfViewer.setDocument(pdfDocument);

            pdfLinkService.setDocument(pdfDocument, null);
        },
        readPdf() {
            // Read the PDF using browser's built-in TTS
            const utterance = new SpeechSynthesisUtterance();
            utterance.text = "Reading PDF content";
            speechSynthesis.speak(utterance);
        },
    },
};
</script>

<style>
body {
    background-color: #808080;
    margin: 0;
    padding: 0;
}

#viewerContainer {
    overflow: auto;
    position: absolute;
    width: 100%;
    height: 100%;
}
</style>