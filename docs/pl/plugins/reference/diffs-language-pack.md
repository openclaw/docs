---
read_when:
    - Instalujesz, konfigurujesz lub audytujesz plugin diffs-language-pack
summary: Dodaje podświetlanie składni dla języków spoza domyślnego zestawu przeglądarki różnic.
title: Plugin pakietu językowego Diffs
x-i18n:
    generated_at: "2026-07-12T15:25:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Plugin pakietu językowego Diffs

Dodaje podświetlanie składni dla języków spoza domyślnego zestawu przeglądarki różnic.

## Dystrybucja

- Pakiet: `@openclaw/diffs-language-pack`
- Sposób instalacji: npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`

## Powierzchnia

plugin

<!-- openclaw-plugin-reference:manual-start -->

## Dodane języki

Podstawowy plugin `diffs` już podświetla popularne języki opisane w sekcji [Różnice](/pl/tools/diffs). Zainstaluj ten pakiet językowy, jeśli potrzebujesz podświetlania składni dla szerszego zestawu języków obsługiwanych przez Shiki. Jeśli pakiet nie jest zainstalowany, pliki te nadal są wyświetlane jako czytelny zwykły tekst.

Przykłady obejmują Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI oraz pliki różnic.

Katalog języków i aliasów projektu Shiki znajduje się na stronie [Języki Shiki](https://shiki.style/languages).

<!-- openclaw-plugin-reference:manual-end -->
