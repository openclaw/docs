---
read_when:
    - diffs-language-pack Plugin のインストール、設定、または差分監査を行っています
summary: デフォルトの差分ビューアーに含まれていない言語の構文強調表示を追加します。
title: 差分言語パックPlugin
x-i18n:
    generated_at: "2026-07-11T22:29:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Diffs Language Pack Plugin

デフォルトのdiffsビューアーセットに含まれない言語のシンタックスハイライトを追加します。

## 配布

- パッケージ: `@openclaw/diffs-language-pack`
- インストール経路: npm、ClawHub: `clawhub:@openclaw/diffs-language-pack`

## 対象

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## 追加される言語

基本の`diffs` Pluginでは、[Diffs](/ja-JP/tools/diffs)に記載されている一般的な言語がすでにハイライトされます。Shikiがサポートする、より幅広い言語のシンタックスハイライトが必要な場合は、この言語パックをインストールしてください。このパックがインストールされていない場合でも、それらのファイルは読みやすいプレーンテキストとしてレンダリングされます。

例として、Astro、Vue、Svelte、MDX、GraphQL、Terraform/HCL、Nix、Clojure、Elixir、Haskell、OCaml、Scala、Zig、Solidity、Verilog/VHDL、Fortran、MATLAB、LaTeX、Mermaid、Sass/Less/SCSS、Nginx、Apache、CSV、dotenv、INI、diffファイルなどがあります。

Shikiの上流の言語およびエイリアスのカタログについては、[Shikiの言語](https://shiki.style/languages)を参照してください。

<!-- openclaw-plugin-reference:manual-end -->
