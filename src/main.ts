import { createApp } from "vue";
import "virtual:windi.css";
import router from "@/router";
import App from "./App.vue";
import '@arco-design/web-vue/es/message/style/css.js'

const app = createApp(App);
app.use(router).mount("#app");
