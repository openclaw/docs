---
read_when:
    - Anda sedang memasang, mengonfigurasi, atau mengaudit Plugin diffs-language-pack
summary: Menambahkan penyorotan sintaks untuk bahasa yang tidak termasuk dalam kumpulan penampil diff bawaan.
title: Plugin Paket Bahasa Diffs
x-i18n:
    generated_at: "2026-07-12T14:27:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Plugin Paket Bahasa Diffs

Menambahkan penyorotan sintaks untuk bahasa di luar kumpulan bawaan penampil diff.

## Distribusi

- Paket: `@openclaw/diffs-language-pack`
- Jalur instalasi: npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`

## Permukaan

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## Bahasa yang ditambahkan

Plugin `diffs` dasar sudah menyoroti bahasa umum yang didokumentasikan dalam [Diffs](/id/tools/diffs). Instal paket bahasa ini jika Anda menginginkan penyorotan sintaks untuk kumpulan bahasa yang didukung Shiki secara lebih luas. Jika paket tidak diinstal, berkas tersebut tetap ditampilkan sebagai teks biasa yang mudah dibaca.

Contohnya meliputi Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, dan berkas diff.

Lihat [bahasa Shiki](https://shiki.style/languages) untuk katalog bahasa dan alias upstream Shiki.

<!-- openclaw-plugin-reference:manual-end -->
