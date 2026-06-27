---
read_when:
    - Stai installando, configurando o verificando il Plugin diffs-language-pack
summary: Aggiunge l'evidenziazione della sintassi per i linguaggi al di fuori dell'insieme predefinito del visualizzatore di diff.
title: Plugin pacchetto lingua per diff
x-i18n:
    generated_at: "2026-06-27T17:55:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Plugin Diffs Language Pack

Aggiunge l’evidenziazione della sintassi per linguaggi non inclusi nel set predefinito del visualizzatore di diff.

## Distribuzione

- Pacchetto: `@openclaw/diffs-language-pack`
- Percorso di installazione: npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`

## Superficie

plugin

<!-- openclaw-plugin-reference:manual-start -->

## Linguaggi aggiunti

Il plugin `diffs` di base evidenzia già i linguaggi comuni documentati in [Diffs](/it/tools/diffs). Installa questo language pack quando vuoi l’evidenziazione della sintassi per un insieme più ampio di linguaggi supportati da Shiki. Se il pacchetto non è installato, quei file vengono comunque visualizzati come testo semplice leggibile.

Gli esempi includono Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI e file diff.

Vedi [linguaggi Shiki](https://shiki.style/languages) per il catalogo upstream di linguaggi e alias di Shiki.

<!-- openclaw-plugin-reference:manual-end -->
