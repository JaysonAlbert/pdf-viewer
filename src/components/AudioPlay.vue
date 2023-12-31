<template>
    <div>
        <button @click="playNextSentence"></button>
    </div>
</template>

<script>
export default {
    props: {
        text: {
            type: String,
            required: true,
        },
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
        };
    },
    watch: {
        text() {
            if (this.currentAudio) {
                this.currentAudio.pause();
            }
            this.prepareAudioQueue();
        },
    },
    methods: {
        prepareAudioQueue() {
            this.rawSentences = this.text.match(/[^.!?]+[.!?]+/g) || [];
            this.sentences = this.mergeShortSentences(this.rawSentences);
            console.log('共拆分成了' + this.sentences.length + '个句子')
            this.audioQueue = this.sentences.splice(0, this.preloadLength).map(sentence => this.loadAudio(sentence));
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
            const audio = new Audio(this.createAudioUrl(sentence));
            console.log('loading audio: ' + sentence)
            audio.isReadyToPlay = false;
            audio.addEventListener('canplaythrough', () => {
                audio.isReadyToPlay = true;
                if (this.currentAudio == audio) {
                    this.playCurrentAudio();
                }
            });

            const errorHandler = () => {
                if (retryCount < this.maxRetries) {
                    console.log(`Retry loading audio: ${sentence}, attempt ${retryCount + 1}`);
                    const newAudio = this.loadAudio(sentence, retryCount + 1);
                    // 用newAudio替换audioQueue中的audio
                    const index = this.audioQueue.indexOf(audio);
                    this.audioQueue.splice(index, 1, newAudio);
                } else {
                    console.error('Failed to load audio after retries: ' + sentence);
                }
            };

            audio.addEventListener('error', errorHandler);
            audio.addEventListener('ended', this.playNextSentence); // 添加播放结束事件监听器
            audio.load();
            return audio;
        },
        createAudioUrl(sentence) {
            return `http://10.60.114.123:5002/api/tts?text=${encodeURIComponent(sentence)}&speaker_id=${encodeURIComponent(this.speaker_id)}&style_wav=${encodeURIComponent(this.style_wav)}&language_id=${encodeURIComponent(this.language_id)}`;
        },
        loadNextAudio() {
            if (this.audioQueue.length > 0) {
                if (this.audioQueue[0].isReadyToPlay) {
                    this.currentAudio = this.audioQueue.shift();
                    this.playCurrentAudio();
                }
            }
        },
        playCurrentAudio() {
            console.log('playing next audio: ' + this.extractTextFromUrl(this.currentAudio.src));
            this.currentAudio.play();
            this.addSentenceToQueue();
        },
        extractTextFromUrl(url) {
            return decodeURIComponent(url.split('text=')[1].split('&')[0]);
        },
        playNextSentence() {
            console.log('playing next sentence')
            this.loadNextAudio();
        },
        addSentenceToQueue() {
            if (this.sentences.length > 0) {
                const nextSentence = this.sentences.shift();
                const nextAudio = this.loadAudio(nextSentence);
                this.audioQueue.push(nextAudio);
            }
        },
    },
};
</script>
