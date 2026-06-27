---
read_when:
    - 你正在安裝、設定或稽核 diffs-language-pack 外掛
summary: 為預設差異檢視器集合之外的語言新增語法醒目提示。
title: 差異語言套件外掛
x-i18n:
    generated_at: "2026-06-27T19:42:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Diffs 語言包外掛

為預設 diffs 檢視器集合以外的語言新增語法醒目提示。

## 發布

- 套件：`@openclaw/diffs-language-pack`
- 安裝路徑：npm；ClawHub：`clawhub:@openclaw/diffs-language-pack`

## 介面

外掛

<!-- openclaw-plugin-reference:manual-start -->

## 新增的語言

基礎 `diffs` 外掛已經會醒目提示 [Diffs](/zh-TW/tools/diffs) 中記錄的常見語言。當你想要為更廣泛的 Shiki 支援語言集合提供語法醒目提示時，請安裝此語言包。如果未安裝此語言包，這些檔案仍會以可讀的純文字呈現。

範例包括 Astro、Vue、Svelte、MDX、GraphQL、Terraform/HCL、Nix、Clojure、Elixir、Haskell、OCaml、Scala、Zig、Solidity、Verilog/VHDL、Fortran、MATLAB、LaTeX、Mermaid、Sass/Less/SCSS、Nginx、Apache、CSV、dotenv、INI 和 diff 檔案。

請參閱 [Shiki 語言](https://shiki.style/languages)，了解 Shiki 的上游語言與別名目錄。

<!-- openclaw-plugin-reference:manual-end -->
