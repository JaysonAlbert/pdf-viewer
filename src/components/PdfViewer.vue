<template>
    <div id="pdfvuer">
        <div id="buttons" class="ui grey three item inverted bottom fixed menu transition hidden">
            <a class="item" @click="page > 1 ? page-- : 1">
                <i class="left chevron icon"></i>
                Back
            </a>
            <a class="ui active item">
                {{ page }} / {{ numPages ? numPages : '∞' }}
            </a>
            <a class="item" @click="page < numPages ? page++ : 1">
                Forward
                <i class="right chevron icon"></i>
            </a>
        </div>
        <div id="buttons" class="ui grey three item inverted bottom fixed menu transition hidden">
            <a class="item" @click="scale -= scale > 0.2 ? 0.1 : 0">
                <i class="left chevron icon" />
                Zoom -
            </a>
            <a class="ui active item">
                {{ formattedZoom }} %
            </a>
            <a class="item" @click="scale += scale < 2 ? 0.1 : 0">
                Zoom +
                <i class="right chevron icon" />
            </a>
        </div>
        <audio-play style="width: 50px"></audio-play>
        <pdf :src="pdfdata" v-for="i in loadedPages" :key="i" :id="i" :page="i" v-model:scale="scale"
            style="width:100%;margin:20px auto;" :annotation="true" :resize="true" @link-clicked="handle_pdf_link">
            <template v-slot:loading>
                loading content here...
            </template>
        </pdf>
    </div>
</template>

<script>
import pdfvuer from 'pdfvuer'
import $ from 'jquery'
import AudioPlay from './AudioPlay.vue'

export default {
    components: {
        pdf: pdfvuer,
        AudioPlay
    },
    data() {
        return {
            page: 1,
            numPages: 0,
            loadedPages: 0,
            pdfdata: undefined,
            errors: [],
            scale: 'page-width',
            pdfUrl: this.$route.query.pdfUrl,
            preloadSize: 10,
        }
    },
    computed: {
        formattedZoom() {
            return Number.parseInt(this.scale * 100);
        },
    },
    mounted() {
        this.getPdf()
    },
    watch: {
        show: function (s) {
            if (s) {
                this.getPdf();
            }
        },
        page: function (p) {
            if (window.scrollY <= this.findPos(document.getElementById(p)) || (document.getElementById(p + 1) && window.scrollY >= this.findPos(document.getElementById(p + 1)))) {
                // window.scrollTo(0,this.findPos(document.getElementById(p)));
                document.getElementById(p).scrollIntoView();
            }
            this.loadedPages = Math.max(this.loadedPages, Math.min(p + this.preloadSize, this.numPages));
        }
    },
    methods: {
        handle_pdf_link: function (params) {
            // Scroll to the appropriate place on our page - the Y component of
            // params.destArray * (div height / ???), from the bottom of the page div
            var page = document.getElementById(String(params.pageNumber));
            page.scrollIntoView();
        },
        async getPdf() {
            var self = this;
            self.pdfdata = pdfvuer.createLoadingTask(this.pdfUrl);

            const pdf = await self.pdfdata;

            self.loadedPages = Math.min(self.preloadSize, pdf.numPages);
            self.numPages = pdf.numPages;

            this.text = ''
            let extractedText = '';
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                textContent.items.forEach(item => {
                    extractedText += item.str;
                });
            }

            this.text = extractedText;

            window.onscroll = function () {
                changePage()
                stickyNav()
            }

            // Get the offset position of the navbar
            var sticky = $('#buttons')[0].offsetTop

            // Add the sticky class to the self.$refs.nav when you reach its scroll position. Remove "sticky" when you leave the scroll position
            function stickyNav() {
                if (window.scrollY >= sticky) {
                    $('#buttons')[0].classList.remove("hidden")
                } else {
                    $('#buttons')[0].classList.add("hidden")
                }
            }

            function changePage() {
                var i = 1, count = Number(self.loadedPages);
                do {
                    if (window.scrollY >= self.findPos(document.getElementById(i)) &&
                        window.scrollY <= self.findPos(document.getElementById(i + 1))) {
                        self.page = i
                    }
                    i++
                } while (i < count)
                if (window.scrollY >= self.findPos(document.getElementById(i))) {
                    self.page = i
                }
            }
        },
        findPos(obj) {
            return obj.offsetTop;
        }
    }
}
</script>
<style src="pdfvuer/dist/pdfvuer.css"></style>
<style lang="css" scoped>
#buttons {
    margin-left: 0 !important;
    margin-right: 0 !important;
}

/* Page content */
.content {
    padding: 16px;
}
</style>