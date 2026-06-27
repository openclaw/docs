---
read_when:
    - Je installeert, configureert of controleert de diffs-language-pack Plugin
summary: Voegt syntaxisaccentuering toe voor talen buiten de standaardset van de diff-viewer.
title: Plugin voor het Diffs-taalpakket
x-i18n:
    generated_at: "2026-06-27T18:00:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Diffs-taalpakket-Plugin

Voegt syntaxisaccentuering toe voor talen buiten de standaardset van de diffs-viewer.

## Distributie

- Pakket: `@openclaw/diffs-language-pack`
- Installatieroute: npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`

## Oppervlak

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## Toegevoegde talen

De basis-Plugin `diffs` accentueert al de gangbare talen die zijn gedocumenteerd in [Diffs](/nl/tools/diffs). Installeer dit taalpakket wanneer je syntaxisaccentuering wilt voor een bredere set door Shiki ondersteunde talen. Als het pakket niet is geïnstalleerd, worden die bestanden nog steeds weergegeven als leesbare platte tekst.

Voorbeelden zijn Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI en diff-bestanden.

Zie [Shiki-talen](https://shiki.style/languages) voor Shiki's upstream-catalogus voor talen en aliassen.

<!-- openclaw-plugin-reference:manual-end -->
