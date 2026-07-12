---
read_when:
    - 您正在安裝、設定或稽核 diffs-language-pack 外掛
summary: 為預設差異檢視器支援範圍以外的語言新增語法醒目提示。
title: 差異語言套件外掛
x-i18n:
    generated_at: "2026-07-11T21:35:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Diffs 語言套件外掛

為預設 Diffs 檢視器支援範圍以外的語言新增語法醒目提示。

## 發佈

- 套件：`@openclaw/diffs-language-pack`
- 安裝途徑：npm；ClawHub：`clawhub:@openclaw/diffs-language-pack`

## 介面

外掛

<!-- openclaw-plugin-reference:manual-start -->

## 新增的語言

基礎 `diffs` 外掛已支援 [Diffs](/zh-TW/tools/diffs) 中記載之常見語言的語法醒目提示。若希望為更多 Shiki 支援的語言提供語法醒目提示，請安裝此語言套件。即使未安裝此套件，這些檔案仍會以可讀的純文字形式顯示。

範例包括 Astro、Vue、Svelte、MDX、GraphQL、Terraform/HCL、Nix、Clojure、Elixir、Haskell、OCaml、Scala、Zig、Solidity、Verilog/VHDL、Fortran、MATLAB、LaTeX、Mermaid、Sass/Less/SCSS、Nginx、Apache、CSV、dotenv、INI 及 diff 檔案。

如需查看 Shiki 上游支援的語言與別名目錄，請參閱 [Shiki 語言](https://shiki.style/languages)。

<!-- openclaw-plugin-reference:manual-end -->
