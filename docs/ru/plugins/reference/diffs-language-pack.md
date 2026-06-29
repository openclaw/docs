---
read_when:
    - Вы устанавливаете, настраиваете или проверяете plugin diffs-language-pack
summary: Добавляет подсветку синтаксиса для языков вне набора средства просмотра различий по умолчанию.
title: Plugin языкового пакета Diffs
x-i18n:
    generated_at: "2026-06-28T23:23:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Plugin языкового пакета Diffs

Добавляет подсветку синтаксиса для языков за пределами набора средства просмотра diffs по умолчанию.

## Распространение

- Пакет: `@openclaw/diffs-language-pack`
- Маршрут установки: npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`

## Поверхность

plugin

<!-- openclaw-plugin-reference:manual-start -->

## Добавленные языки

Базовый Plugin `diffs` уже подсвечивает распространенные языки, описанные в [Diffs](/ru/tools/diffs). Установите этот языковой пакет, если нужна подсветка синтаксиса для более широкого набора языков, поддерживаемых Shiki. Если пакет не установлен, эти файлы все равно отображаются как читаемый простой текст.

Примеры включают Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI и diff-файлы.

См. [языки Shiki](https://shiki.style/languages) для вышестоящего каталога языков и псевдонимов Shiki.

<!-- openclaw-plugin-reference:manual-end -->
