---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: '个人文章云笔记'
  text: '💻生命在于折腾'
  tagline: 知识、构思和行动
  # actions:
  #   - theme: brand
  #     text: Markdown Examples
  #     link: /markdown-examples
  #   - theme: alt
  #     text: API Examples
  #     link: /api-examples

features:
  - title: 📚 知识体系
    details: 从语言基础到工程化和UI框架
    link: /frontend/前端知识体系
  - title: ⛰ 技术挑战
    details: 记录思考过程和成果
    link: /challenge/index
  - title: 💡 想法与实践
    details: 尝试有趣的新技能
    link: /playground/index
---

<script setup>
import HomeBg from '/.vitepress/components/home-bg.vue'
</script>

<HomeBg />
