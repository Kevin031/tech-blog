import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Kevin的技术博客",
  description: "我的个人技术博客",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "首页", link: "/" },
      { text: "实用工具", link: "/tools/index" },
      { text: "知识图谱", link: "/前端知识图谱" },
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
    },

    footer: {
      copyright: "©2017-2023 | 粤ICP备20019685号",
    },

    socialLinks: [{ icon: "github", link: "https://github.com/Kevin031" }],
  },
});
