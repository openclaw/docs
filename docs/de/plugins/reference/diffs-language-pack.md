---
read_when:
    - Sie installieren, konfigurieren oder prüfen das Plugin diffs-language-pack.
summary: Fügt Syntaxhervorhebung für Sprachen hinzu, die nicht im Standardsatz des Diff-Viewers enthalten sind.
title: Diffs-Sprachpaket-Plugin
x-i18n:
    generated_at: "2026-07-24T05:15:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Diffs-Sprachpaket-Plugin

Fügt Syntaxhervorhebung für Sprachen hinzu, die nicht im Standardsatz des Diffs-Viewers enthalten sind.

## Distribution

- Paket: `@openclaw/diffs-language-pack`
- Installationsweg: npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`

## Oberfläche

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## Hinzugefügte Sprachen

Das grundlegende `diffs`-Plugin hebt bereits die gängigen Sprachen hervor, die unter [Diffs](/de/tools/diffs) dokumentiert sind. Installieren Sie dieses Sprachpaket, wenn Sie Syntaxhervorhebung für eine größere Auswahl von Shiki-unterstützten Sprachen benötigen. Wenn das Paket nicht installiert ist, werden diese Dateien weiterhin als lesbarer Klartext dargestellt.

Beispiele sind Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI und Diff-Dateien.

Den Katalog der von Shiki unterstützten Sprachen und Aliasse finden Sie unter [Shiki-Sprachen](https://shiki.style/languages).

<!-- openclaw-plugin-reference:manual-end -->
