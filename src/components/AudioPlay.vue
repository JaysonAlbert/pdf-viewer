<template>
    <div class="audio-play" style="height: 33vh;">
        <div class="input-container">
            <input type="text" v-model="text" @blur="setText" />
        </div>

        <div class="audio-container">
            <audio controls autoplay :src="audioUrl"></audio>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            text: "today is a good day. tommorrow is a good day. yesterday was a good day.",
            speaker_id: "Claribel Dervla",
            style_wav: "",
            language_id: "en",
            audioText: ""
        };
    },
    computed: {
        audioUrl() {
            return `/api/tts?text=${encodeURIComponent(this.audioText)}&speaker_id=${encodeURIComponent(
                this.speaker_id
            )}&style_wav=${encodeURIComponent(this.style_wav)}&language_id=${encodeURIComponent(
                this.language_id
            )}`;
        }
    },
    methods: {
        setText() {
            this.audioText = this.text;
        }
    }
};
</script>

<style scoped>
.audio-play {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.input-container {
    margin-bottom: 1rem;
}

.audio-container {
    margin-top: 1rem;
}
</style>
