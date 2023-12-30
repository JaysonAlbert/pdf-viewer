<template>
  <div class="container">
    <div class="input-wrapper">
      <input v-model="paperLink" placeholder="输入pdf链接" class="input-field" @keyup.enter="checkLinkValidity" @focus="inputFocus" @blur="inputBlur" />
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      paperLink: "",
      isFocused: false,
    };
  },
  methods: {
    checkLinkValidity() {
      if (this.paperLink.startsWith("http") && this.paperLink.endsWith(".pdf")) {
        this.$router.push({
          path: "/viewer",
          query: {
            pdfUrl: this.paperLink,
          },
        });
      } else {
        alert("请输入有效的PDF链接");
      }
    },
    inputFocus() {
      this.isFocused = true;
    },
    inputBlur() {
      this.isFocused = false;
    },
  },
};
</script>

<style>
.container {
  display: flex;
  justify-content: center;
  align-items: flex-start; /* 调整为上部1/3 */
  height: 100vh;
  background-color: #877a7a; /* 设置背景色 */
}

.input-wrapper {
  margin-top: 33.33vh; /* 上部1/3的高度 */
  position: relative; /* 添加相对定位 */
}

.input-field {
  padding: 10px;
  margin-right: 10px;
  width: 500px;
  background-color: #f2f2f2;
  border: none;
  border-radius: 5px;
  outline: none; /* 去除输入框的聚焦边框 */
}

.input-field:focus {
  background-color: #ffffff; /* 设置聚焦后的背景色 */
}

</style>
