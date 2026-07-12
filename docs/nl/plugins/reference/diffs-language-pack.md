---
read_when:
    - U installeert, configureert of controleert de Plugin diffs-language-pack.
summary: Voegt syntaxisaccentuering toe voor talen die niet in de standaardset van de diffviewer staan.
title: Plugin voor het Diffs-taalpakket
x-i18n:
    generated_at: "2026-07-12T09:06:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Plugin voor het Diffs-taalpakket

Voegt syntaxisaccentuering toe voor talen die niet in de standaardset van de diffs-viewer staan.

## Distributie

- Pakket: `@openclaw/diffs-language-pack`
- Installatieroute: npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`

## Oppervlak

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## Toegevoegde talen

De basis-Plugin `diffs` accentueert al de gangbare talen die in [Diffs](/nl/tools/diffs) zijn gedocumenteerd. Installeer dit taalpakket wanneer je syntaxisaccentuering wilt voor een bredere reeks door Shiki ondersteunde talen. Als het pakket niet is geïnstalleerd, worden die bestanden nog steeds als leesbare platte tekst weergegeven.

Voorbeelden zijn Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI en diff-bestanden.

Zie [Shiki-talen](https://shiki.style/languages) voor de bovenliggende catalogus van talen en aliassen van Shiki.

<!-- openclaw-plugin-reference:manual-end -->
