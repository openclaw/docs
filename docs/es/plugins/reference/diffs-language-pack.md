---
read_when:
    - Estás instalando, configurando o auditando el Plugin diffs-language-pack
summary: Añade resaltado de sintaxis para lenguajes que no forman parte del conjunto predeterminado del visor de diferencias.
title: Plugin de paquete de idioma para diffs
x-i18n:
    generated_at: "2026-07-11T23:20:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Plugin de paquete de idiomas para Diffs

Añade resaltado de sintaxis para idiomas que no forman parte del conjunto predeterminado del visor de diferencias.

## Distribución

- Paquete: `@openclaw/diffs-language-pack`
- Método de instalación: npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`

## Superficie

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## Idiomas añadidos

El Plugin base `diffs` ya resalta los idiomas comunes documentados en [Diffs](/es/tools/diffs). Instala este paquete de idiomas cuando quieras resaltado de sintaxis para un conjunto más amplio de idiomas compatibles con Shiki. Si el paquete no está instalado, esos archivos se seguirán mostrando como texto sin formato legible.

Algunos ejemplos son Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI y archivos diff.

Consulta [Idiomas de Shiki](https://shiki.style/languages) para ver el catálogo principal de idiomas y alias de Shiki.

<!-- openclaw-plugin-reference:manual-end -->
