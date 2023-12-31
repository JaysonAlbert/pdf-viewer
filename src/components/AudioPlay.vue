<template>
    <div style="position: absolute; top: 33%; left: 50%; transform: translate(-50%, -50%);">
        <textarea v-model="text" @blur="prepareAudioQueue" style="width: 90%; height: 200px;"></textarea>
        <div>
            <audio ref="audioPlayer" controls></audio>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            text: "today is a good day. tomorrow is a good day. yesterday was a good day. i am gona traval the world. wish me good luck. goodbye.",
            sentences: [],
            audioQueue: [],
            speaker_id: "Claribel Dervla",
            style_wav: "",
            language_id: "en",
            preloadLength: 3,
            leastWordCount: 50,
            mergeSentences: false,
        };
    },
    methods: {
        prepareAudioQueue() {
            this.rawSentences = this.text.match(/[^.!?]+[.!?]+/g) || [];
            this.sentences = this.mergeShortSentences(this.rawSentences);
            console.log('共拆分成了' + this.sentences.length + '个句子')
            this.audioQueue = this.sentences.splice(0, this.preloadLength).map(sentence => this.loadAudio(sentence));
            this.playNextSentence();
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
        loadAudio(sentence) {
            const audio = new Audio(this.createAudioUrl(sentence));
            console.log('loading audio: ' + sentence)
            audio.isReadyToPlay = false;
            audio.addEventListener('canplaythrough', () => {
                audio.isReadyToPlay = true;
                if(this.currentAudio == audio) {
                    this.playCurrentAudio();
                }
            });
            audio.addEventListener('ended', this.playNextSentence); // 添加播放结束事件监听器
            audio.load();
            return audio;
        },
        createAudioUrl(sentence) {
            return `/api/tts?text=${encodeURIComponent(sentence)}&speaker_id=${encodeURIComponent(this.speaker_id)}&style_wav=${encodeURIComponent(this.style_wav)}&language_id=${encodeURIComponent(this.language_id)}`;
        },
        loadNextAudio() {
            if (this.audioQueue.length > 0) {
                this.currentAudio = this.audioQueue.shift();
                if(this.currentAudio.isReadyToPlay) {
                    this.playCurrentAudio();
                }
            }
        },
        playCurrentAudio() {
            console.log('playing next audio: ' + this.extractTextFromUrl(this.currentAudio.src));

            this.currentAudio.play();
        },
        extractTextFromUrl(url) {
            return decodeURIComponent(url.split('text=')[1].split('&')[0]);
        },
        playNextSentence() {
            console.log('playing next sentence')
            this.loadNextAudio();
            this.addSentenceToQueue();
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
