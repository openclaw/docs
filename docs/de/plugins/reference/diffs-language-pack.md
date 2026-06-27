---
read_when:
    - Sie installieren, konfigurieren oder prüfen das diffs-language-pack-Plugin
summary: Fügt Syntaxhervorhebung für Sprachen hinzu, die nicht im Standardsatz des Diff-Viewers enthalten sind.
title: Diffs-Sprachpaket-Plugin
x-i18n:
    generated_at: "2026-06-27T17:53:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Diffs Language Pack-Plugin

Fügt Syntaxhervorhebung für Sprachen außerhalb des Standardsatzes des Diffs-Viewers hinzu.

## Distribution

- Package: `@openclaw/diffs-language-pack`
- Installationsweg: npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`

## Oberfläche

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## Hinzugefügte Sprachen

Das Basis-Plugin `diffs` hebt bereits die gängigen Sprachen hervor, die unter [Diffs](/de/tools/diffs) dokumentiert sind. Installieren Sie dieses Language Pack, wenn Sie Syntaxhervorhebung für einen breiteren Satz von Shiki-unterstützten Sprachen wünschen. Wenn das Paket nicht installiert ist, werden diese Dateien weiterhin als gut lesbarer Klartext dargestellt.

Beispiele sind Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI und diff-Dateien.

Siehe [Shiki-Sprachen](https://shiki.style/languages) für Shikis Upstream-Katalog der Sprachen und Aliase.

<!-- openclaw-plugin-reference:manual-end -->
