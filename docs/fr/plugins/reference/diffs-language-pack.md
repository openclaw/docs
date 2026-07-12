---
read_when:
    - Vous installez, configurez ou auditez le plugin diffs-language-pack
summary: Ajoute la coloration syntaxique pour les langages ne faisant pas partie de l’ensemble par défaut de l’afficheur de différences.
title: Plugin de pack linguistique pour les diffs
x-i18n:
    generated_at: "2026-07-12T03:07:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Plugin de pack linguistique pour Diffs

Ajoute la coloration syntaxique pour les langages qui ne figurent pas dans l’ensemble par défaut de la visionneuse de diffs.

## Distribution

- Paquet : `@openclaw/diffs-language-pack`
- Méthode d’installation : npm ; ClawHub : `clawhub:@openclaw/diffs-language-pack`

## Surface

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## Langages ajoutés

Le Plugin `diffs` de base assure déjà la coloration des langages courants répertoriés dans [Diffs](/fr/tools/diffs). Installez ce pack linguistique lorsque vous souhaitez bénéficier de la coloration syntaxique pour un ensemble plus large de langages pris en charge par Shiki. Si le pack n’est pas installé, ces fichiers restent affichés sous forme de texte brut lisible.

Les exemples incluent Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI et les fichiers diff.

Consultez [les langages Shiki](https://shiki.style/languages) pour découvrir le catalogue de référence des langages et des alias de Shiki.

<!-- openclaw-plugin-reference:manual-end -->
