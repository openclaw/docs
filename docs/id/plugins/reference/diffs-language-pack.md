---
read_when:
    - Anda sedang menginstal, mengonfigurasi, atau mengaudit plugin diffs-language-pack
summary: Menambahkan penyorotan sintaks untuk bahasa di luar kumpulan penampil diff default.
title: Plugin Paket Bahasa Diff
x-i18n:
    generated_at: "2026-06-27T17:53:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Plugin Paket Bahasa Diffs

Menambahkan penyorotan sintaks untuk bahasa di luar kumpulan penampil diffs default.

## Distribusi

- Paket: `@openclaw/diffs-language-pack`
- Rute instalasi: npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`

## Permukaan

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## Bahasa yang ditambahkan

Plugin dasar `diffs` sudah menyorot bahasa umum yang didokumentasikan di [Diffs](/id/tools/diffs). Instal paket bahasa ini ketika Anda menginginkan penyorotan sintaks untuk kumpulan bahasa yang didukung Shiki yang lebih luas. Jika paket tidak terinstal, file tersebut tetap dirender sebagai teks biasa yang mudah dibaca.

Contohnya mencakup Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, dan file diff.

Lihat [bahasa Shiki](https://shiki.style/languages) untuk katalog bahasa dan alias upstream Shiki.

<!-- openclaw-plugin-reference:manual-end -->
