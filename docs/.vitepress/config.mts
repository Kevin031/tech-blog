import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Kevin的技术博客",
  description: "",
  themeConfig: {
    search: {
      provider: "local",
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "首页", link: "/" },
      { text: "实用工具", link: "/tools/index" },
      { text: "知识体系", link: "/frontend/前端知识体系" },
      { text: "前端挑战", link: "/challenge/index" },
      { text: "实验室", link: "/playground/index" },
    ],

    sidebar: {
      "/tools": [
        {
          text: "实用工具整理",
          items: [
            { text: "Markdown Examples", link: "/markdown-examples" },
            { text: "Markdown Examples", link: "/markdown-examples" },
            { text: "Runtime API Examples", link: "/api-examples" },
          ],
        },
      ],
      "/frontend": [
        {
          text: "JavaScript",
          items: [
            {
              text: "浅谈javascript中的观察者模式",
              link: "/frontend/javascript/浅谈javascript中的观察者模式",
            },
          ],
        },
        {
          text: "CSS",
          items: [
            {
              text: "rem布局原理及简单实践",
              link: "/frontend/css/rem布局原理及简单实践",
            },
          ],
        },
      ],
      "/challenge": [
        {
          text: "前端挑战",
          items: [{ text: "test", link: "/challenge/index" }],
        },
      ],
    },

    footer: {
      copyright: "©2017-2023 | 粤ICP备20019685号",
    },

    socialLinks: [{ icon: "github", link: "https://github.com/Kevin031" }],
  },
});
