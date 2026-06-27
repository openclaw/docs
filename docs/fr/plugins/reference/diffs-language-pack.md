---
read_when:
    - Vous installez, configurez ou auditez le plugin diffs-language-pack
summary: Ajoute la coloration syntaxique pour les langages en dehors de l’ensemble par défaut de la visionneuse de diffs.
title: Plugin de pack de langue pour les diffs
x-i18n:
    generated_at: "2026-06-27T17:53:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Plugin de pack de langues pour Diffs

Ajoute la coloration syntaxique pour des langages en dehors de l’ensemble par défaut du visualiseur de diffs.

## Distribution

- Package : `@openclaw/diffs-language-pack`
- Chemin d’installation : npm ; ClawHub : `clawhub:@openclaw/diffs-language-pack`

## Surface

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## Langages ajoutés

Le Plugin `diffs` de base applique déjà la coloration aux langages courants documentés dans [Diffs](/fr/tools/diffs). Installez ce pack de langues lorsque vous voulez la coloration syntaxique pour un ensemble plus large de langages pris en charge par Shiki. Si le pack n’est pas installé, ces fichiers restent affichés sous forme de texte brut lisible.

Les exemples incluent Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, et les fichiers diff.

Consultez [les langages Shiki](https://shiki.style/languages) pour le catalogue amont des langages et alias de Shiki.

<!-- openclaw-plugin-reference:manual-end -->
