<template>
    <div>
        <button @click="playNextSentence"></button>
    </div>
</template>

<script>
export default {
    props: {
        preloadLength: {
            type: Number,
            default: 3,
        }
    },
    data() {
        return {
            sentences: [],
            audioQueue: [],
            speaker_id: "Claribel Dervla",
            style_wav: "",
            language_id: "en",
            leastWordCount: 50,
            mergeSentences: false,
            maxRetires: 3,
            playSelector: 'span',
            currentIndex: null,
            currentSentence: null,
            playLength: 0,
            playTimer: null,
            currentAudio: null,
            highLights: [],
        };
    },
    mounted() {
        this.playTimer = setInterval(() => {
            this.updateSentencesAndSpans()
        }, 5000)
    },
    methods: {
        updateSentencesAndSpans() {
            const spanElements = document.querySelectorAll(this.playSelector);
            if (spanElements.length == this.playLength) {
                return
            }
            this.playLength = spanElements.length;

            if (this.sentences.length == 0) {
                this.sentences = this.createSentenceSpans(spanElements);
                console.log('共拆分成了' + this.sentences.length + '个句子')
                if (!this.currentIndex) {
                    this.currentIndex = 0
                    this.audioQueue = this.sentences.slice(0, this.preloadLength).map(sentence => this.loadAudio(sentence));
                }
            } else {
                const lastSpan = this.sentences[this.sentences.length - 1]?.spans[0];
                this.sentences.pop(); //去掉最后一个不完整的句子
                const newSentences = this.createSentenceSpans(spanElements, lastSpan);
                this.sentences = this.sentences.concat(newSentences);
                console.log('新增了' + newSentences.length + '个句子')
            }

        },

        seek(span) {
            //找到this.sentences中第一个span的y坐标大于等于span的y坐标的句子所在的index
            const index = this.sentences.findIndex(sentence => sentence.spans[0].getBoundingClientRect().y >= span.getBoundingClientRect().y)
            if (index == -1) {
                return
            }

            if (this.currentAudio) {
                this.currentAudio.audio.pause()
            }

            this.currentIndex = index
            this.audioQueue = this.sentences.slice(index, index + this.preloadLength).map(sentence => this.loadAudio(sentence));
            this.audioQueue[0].audio.addEventListener('canplaythrough', () => {
                this.loadNextAudio()
            })
        },

        createSentenceSpans(spanElements, lastSpan = null) {
            spanElements.forEach(span => {
                span.addEventListener('click', () => {
                    this.seek(span)
                })
            })
            if (lastSpan) {
                spanElements = Array.from(spanElements);
                const continueSpanIndex = spanElements.indexOf(lastSpan);
                spanElements.splice(0, continueSpanIndex);
            }

            let fullText = '';
            let spanRanges = [];

            spanElements.forEach(span => {
                const start = fullText.length;
                const spanText = span.textContent;
                fullText += spanText;
                const end = fullText.length;
                spanRanges.push({ span, start, end });
            });

            const sentences = this.splitIntoSentences(fullText);

            return sentences.map(sentence => {
                const sentenceStart = fullText.indexOf(sentence);
                const sentenceEnd = sentenceStart + sentence.length;
                const relatedSpans = spanRanges.filter(({ start, end }) =>
                    (start < sentenceEnd && end > sentenceStart)
                ).map(range => range.span);

                return { text: sentence, spans: relatedSpans };
            });
        },

        splitIntoSentences(text) {
            const rawSentences = text.match(/[^.!?]+[.!?]+/g) || [];
            if (!this.mergeSentences) {
                return rawSentences;
            }
            return this.mergeShortSentences(rawSentences);
        },
        mergeShortSentences(sentences) {
            if (!this.mergeSentences) {
                return sentences;
            }
            const mergedSentences = [];
            let currentSentence = '';

            sentences.forEach(sentence => {
                // 将当前句子添加到累积句子中
                currentSentence += sentence;
                // 计算累积句子中的单词数量
                let wordCount = currentSentence.split(/\s+/).length;

                if (wordCount >= this.leastWordCount) {
                    // 如果累积句子的单词数达到50或以上，将其添加到结果数组中
                    mergedSentences.push(currentSentence);
                    currentSentence = ''; // 重置累积句子
                }
            });

            // 确保最后一部分句子也被添加，即使它的单词数少于50
            if (currentSentence) {
                mergedSentences.push(currentSentence);
            }

            return mergedSentences;
        },
        loadAudio(sentence, retryCount = 0) {
            const { text, spans } = sentence;
            const audio = new Audio(this.createAudioUrl(text));
            console.log('loading audio: ' + text)
            const audioSpans = { audio, spans }

            audio.isReadyToPlay = false;
            audio.addEventListener('canplaythrough', () => {
                audio.isReadyToPlay = true;
                if (this.currentAudio == audioSpans) {
                    this.playCurrentAudio();
                }
            });


            const errorHandler = () => {
                if (retryCount < this.maxRetries) {
                    console.log(`Retry loading audio: ${text}, attempt ${retryCount + 1}`);
                    const newAudioSpans = this.loadAudio(sentence, retryCount + 1);
                    // 用newAudio替换audioQueue中的audio
                    const index = this.audioQueue.indexOf(audioSpans);
                    this.audioQueue.splice(index, 1, newAudioSpans);
                } else {
                    console.error('Failed to load audio after retries: ' + text);
                }
            };

            audio.addEventListener('play', () => {
                if (this.highLights.length > 0) {
                    this.highLights.forEach(highLight => highLight.classList.remove('highlight'));
                    this.highLights = []
                }
                spans.forEach(span => span.classList.add('highlight'));
                this.highLights.push(...spans)
            });
            audio.addEventListener('error', errorHandler);
            audio.addEventListener('ended', () => {
                spans.forEach(span => span.classList.remove('highlight'));
                this.highLights = this.highLights.filter(highLight => !spans.includes(highLight))
                this.playNextSentence();
            });
            audio.load();
            return audioSpans;
        },
        createAudioUrl(sentence) {
            return `/api/tts?text=${encodeURIComponent(sentence)}&speaker_id=${encodeURIComponent(this.speaker_id)}&style_wav=${encodeURIComponent(this.style_wav)}&language_id=${encodeURIComponent(this.language_id)}`;
        },
        loadNextAudio() {
            if (this.audioQueue.length > 0) {
                if (this.audioQueue[0].audio.isReadyToPlay) {
                    this.currentAudio = this.audioQueue.shift();
                    this.playCurrentAudio();
                }
            }
        },
        playCurrentAudio() {
            console.log('playing next audio: ' + this.extractTextFromUrl(this.currentAudio.audio.src));
            this.currentAudio.audio.play();
            this.currentIndex = this.sentences.findIndex(sentence => sentence.text == this.extractTextFromUrl(this.currentAudio.audio.src));
            this.addSentenceToQueue();
        },
        extractTextFromUrl(url) {
            return decodeURIComponent(url.split('text=')[1].split('&')[0]);
        },
        playNextSentence() {
            if (this.currentIndex == null) {
                console.log('not ready yet')
                return
            }
            this.loadNextAudio();
        },
        addSentenceToQueue() {
            while (this.currentIndex < this.sentences.length && this.audioQueue.length < this.preloadLength) {
                const nextSentence = this.sentences[this.currentIndex + this.audioQueue.length + 1];
                const nextAudio = this.loadAudio(nextSentence);
                this.audioQueue.push(nextAudio);
            }
        },
    },
};
</script>
<style>
.highlight {
    background-color: yellow;
}

span:hover {
    background-color: pink;
    /* Adjust the color as needed */
}
</style>