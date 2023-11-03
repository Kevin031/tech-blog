import { defineConfig, DefaultTheme } from "vitepress";
import fs from "fs";
import path, { dirname } from "path";

const mdList = fs.readdirSync(path.resolve(__dirname, "../frontend"));
mdList.forEach((name) => {});

/**
 * 根据目录地址创建侧边导航栏
 * @param dirName
 * @returns
 */
const makeNavFromDir = (dirName) => {
  const ABS_PATH = path.resolve(__dirname, `../${dirName}`);
  let result: Array<DefaultTheme.SidebarItem> = [];
  const mdList = fs.readdirSync(ABS_PATH);
  for (let name of mdList) {
    if (name.endsWith(".md")) {
      let fileName = name.replace(".md", "");
      if (fileName === "index") continue;
      result.unshift({
        text: fileName,
        link: `/${dirName}/${fileName}`,
      });
    } else if (!name.includes(".")) {
      try {
        let childList = fs.readdirSync(ABS_PATH + "/" + name);
        let items: Array<DefaultTheme.SidebarItem> = [];
        for (let childName of childList) {
          if (childName.endsWith("md")) {
            let fileName = childName.replace(".md", "");
            items.push({
              text: fileName,
              link: `/${dirName}/${name}/${fileName}`,
            });
          }
        }
        result.push({
          text: name,
          items,
        });
      } catch (err) {
        console.error(err);
        continue;
      }
    }
  }
  return result;
};

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Kevin的技术博客",
  description: "",
  lastUpdated: true,
  markdown: {
    anchor: {},
    toc: { level: [1, 2, 3] },
    theme: {
      light: "min-dark",
      dark: "one-dark-pro",
    },
  },
  themeConfig: {
    search: {
      provider: "local",
    },
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "首页", link: "/" },
      { text: "知识体系", link: "/frontend/前端知识体系" },
      { text: "前端挑战", link: "/challenge/index" },
      { text: "实验室", link: "/playground/index" },
      {
        text: "其它",
        items: [
          { text: "实用工具", link: "/tools/index" },
          { text: "文章", link: "/posts/index" },
        ],
      },
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
      "/frontend": makeNavFromDir("frontend"),
      "/challenge": makeNavFromDir("challenge"),
    },

    footer: {
      copyright: "©2017-2023 | 粤ICP备20019685号",
    },

    socialLinks: [{ icon: "github", link: "https://github.com/Kevin031" }],
  },
});
