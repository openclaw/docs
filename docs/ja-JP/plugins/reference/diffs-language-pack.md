---
read_when:
    - diffs-language-pack Pluginをインストール、設定、または監査しています
summary: デフォルトの diffs viewer セット外の言語に構文ハイライトを追加します。
title: Diffs 言語パック Plugin
x-i18n:
    generated_at: "2026-06-27T12:23:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Diffs Language Pack プラグイン

デフォルトの diffs ビューアセットに含まれない言語のシンタックスハイライトを追加します。

## 配布

- パッケージ: `@openclaw/diffs-language-pack`
- インストール経路: npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`

## 対象

プラグイン

<!-- openclaw-plugin-reference:manual-start -->

## 追加言語

基本の `diffs` プラグインは、[Diffs](/ja-JP/tools/diffs) に記載されている一般的な言語をすでにハイライトします。Shiki がサポートするより幅広い言語セットのシンタックスハイライトが必要な場合は、この言語パックをインストールしてください。このパックがインストールされていない場合でも、それらのファイルは読みやすいプレーンテキストとして表示されます。

例には、Astro、Vue、Svelte、MDX、GraphQL、Terraform/HCL、Nix、Clojure、Elixir、Haskell、OCaml、Scala、Zig、Solidity、Verilog/VHDL、Fortran、MATLAB、LaTeX、Mermaid、Sass/Less/SCSS、Nginx、Apache、CSV、dotenv、INI、diff ファイルが含まれます。

Shiki の上流の言語とエイリアスのカタログについては、[Shiki languages](https://shiki.style/languages) を参照してください。

<!-- openclaw-plugin-reference:manual-end -->
