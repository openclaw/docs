---
read_when:
    - 你正在安装、配置或审核 diffs-language-pack 插件
summary: 为默认 Diffs 查看器集合之外的语言添加语法高亮。
title: Diffs 语言包插件
x-i18n:
    generated_at: "2026-07-11T20:44:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Diffs 语言包插件

为默认 Diffs 查看器集合之外的语言添加语法高亮。

## 分发

- 软件包：`@openclaw/diffs-language-pack`
- 安装途径：npm；ClawHub：`clawhub:@openclaw/diffs-language-pack`

## 适用范围

插件

<!-- openclaw-plugin-reference:manual-start -->

## 新增语言

基础 `diffs` 插件已为 [Diffs](/zh-CN/tools/diffs) 中记录的常用语言提供高亮。当你需要为更多 Shiki 支持的语言提供语法高亮时，请安装此语言包。如果未安装此语言包，这些文件仍会以易读的纯文本形式呈现。

示例包括 Astro、Vue、Svelte、MDX、GraphQL、Terraform/HCL、Nix、Clojure、Elixir、Haskell、OCaml、Scala、Zig、Solidity、Verilog/VHDL、Fortran、MATLAB、LaTeX、Mermaid、Sass/Less/SCSS、Nginx、Apache、CSV、dotenv、INI 和 diff 文件。

有关 Shiki 的上游语言及别名目录，请参阅 [Shiki 语言](https://shiki.style/languages)。

<!-- openclaw-plugin-reference:manual-end -->
