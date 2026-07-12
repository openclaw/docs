---
read_when:
    - Stai installando, configurando o verificando il plugin diffs-language-pack
summary: Aggiunge l'evidenziazione della sintassi per i linguaggi non inclusi nell'insieme predefinito del visualizzatore di diff.
title: Plugin del pacchetto lingua per i diff
x-i18n:
    generated_at: "2026-07-12T07:17:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Plugin del pacchetto linguistico Diffs

Aggiunge l'evidenziazione della sintassi per i linguaggi non inclusi nel set predefinito del visualizzatore di diff.

## Distribuzione

- Pacchetto: `@openclaw/diffs-language-pack`
- Metodo di installazione: npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`

## Superficie

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## Linguaggi aggiunti

Il Plugin `diffs` di base evidenzia già i linguaggi comuni documentati in [Diff](/it/tools/diffs). Installa questo pacchetto linguistico quando desideri l'evidenziazione della sintassi per un insieme più ampio di linguaggi supportati da Shiki. Se il pacchetto non è installato, questi file vengono comunque visualizzati come testo normale leggibile.

Gli esempi includono Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI e file diff.

Consulta [Linguaggi Shiki](https://shiki.style/languages) per il catalogo upstream dei linguaggi e degli alias di Shiki.

<!-- openclaw-plugin-reference:manual-end -->
