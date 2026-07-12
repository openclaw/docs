---
read_when:
    - Вы устанавливаете, настраиваете или проверяете Plugin diffs-language-pack.
summary: Добавляет подсветку синтаксиса для языков, не входящих в стандартный набор средства просмотра различий.
title: Plugin языкового пакета Diffs
x-i18n:
    generated_at: "2026-07-12T11:38:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Plugin языкового пакета Diffs

Добавляет подсветку синтаксиса для языков, не входящих в стандартный набор средства просмотра различий.

## Распространение

- Пакет: `@openclaw/diffs-language-pack`
- Способ установки: npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`

## Область применения

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## Добавленные языки

Базовый Plugin `diffs` уже поддерживает подсветку распространённых языков, перечисленных в разделе [Различия](/ru/tools/diffs). Установите этот языковой пакет, если вам нужна подсветка синтаксиса для более широкого набора языков, поддерживаемых Shiki. Если пакет не установлен, такие файлы всё равно отображаются как читаемый обычный текст.

В число примеров входят Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI и файлы различий.

Полный каталог языков и псевдонимов Shiki см. на странице [Языки Shiki](https://shiki.style/languages).

<!-- openclaw-plugin-reference:manual-end -->
