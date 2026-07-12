---
read_when:
    - Ви встановлюєте, налаштовуєте або перевіряєте зміни Plugin diffs-language-pack
summary: Додає підсвічування синтаксису для мов, які не входять до стандартного набору засобу перегляду різниць.
title: Plugin мовного пакета Diffs
x-i18n:
    generated_at: "2026-07-12T13:29:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Plugin мовного пакета Diffs

Додає підсвічування синтаксису для мов, які не входять до стандартного набору засобу перегляду різниць.

## Розповсюдження

- Пакет: `@openclaw/diffs-language-pack`
- Спосіб установлення: npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`

## Поверхня

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## Додані мови

Базовий Plugin `diffs` уже підсвічує поширені мови, описані в розділі [Різниці](/uk/tools/diffs). Установіть цей мовний пакет, якщо вам потрібне підсвічування синтаксису для ширшого набору мов, які підтримує Shiki. Якщо пакет не встановлено, ці файли все одно відображаються як читабельний звичайний текст.

Серед прикладів: Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI та файли різниць.

Перегляньте [мови Shiki](https://shiki.style/languages), щоб ознайомитися з основним каталогом мов і псевдонімів Shiki.

<!-- openclaw-plugin-reference:manual-end -->
