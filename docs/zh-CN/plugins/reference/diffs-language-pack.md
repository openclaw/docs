---
read_when:
    - 你正在安装、配置或审计 diffs-language-pack 插件
summary: 为默认 Diffs 查看器语言集之外的语言添加语法高亮。
title: Diffs 语言包插件
x-i18n:
    generated_at: "2026-06-27T02:47:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Diffs 语言包插件

为默认 Diffs 查看器集合之外的语言添加语法高亮。

## 分发

- 包：`@openclaw/diffs-language-pack`
- 安装路径：npm；ClawHub：`clawhub:@openclaw/diffs-language-pack`

## 表面

插件

<!-- openclaw-plugin-reference:manual-start -->

## 新增语言

基础 `diffs` 插件已经会高亮 [Diffs](/zh-CN/tools/diffs) 中记录的常见语言。当你希望为更广泛的 Shiki 支持语言启用语法高亮时，请安装此语言包。如果未安装该包，这些文件仍会以可读的纯文本形式渲染。

示例包括 Astro、Vue、Svelte、MDX、GraphQL、Terraform/HCL、Nix、Clojure、Elixir、Haskell、OCaml、Scala、Zig、Solidity、Verilog/VHDL、Fortran、MATLAB、LaTeX、Mermaid、Sass/Less/SCSS、Nginx、Apache、CSV、dotenv、INI 和 diff 文件。

有关 Shiki 的上游语言和别名目录，请参阅 [Shiki languages](https://shiki.style/languages)。

<!-- openclaw-plugin-reference:manual-end -->
