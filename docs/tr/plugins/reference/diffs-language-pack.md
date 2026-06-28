---
read_when:
    - diffs-language-pack Plugin'ini kuruyor, yapılandırıyor veya denetliyorsunuz
summary: Varsayılan fark görüntüleyici kümesi dışındaki diller için söz dizimi vurgulaması ekler.
title: Diffs Dil Paketi Plugin
x-i18n:
    generated_at: "2026-06-28T00:59:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Diffs Dil Paketi Plugin’i

Varsayılan diffs görüntüleyici kümesinin dışındaki diller için sözdizimi vurgulaması ekler.

## Dağıtım

- Paket: `@openclaw/diffs-language-pack`
- Kurulum yolu: npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`

## Yüzey

plugin

<!-- openclaw-plugin-reference:manual-start -->

## Eklenen diller

Temel `diffs` plugin’i, [Diffs](/tr/tools/diffs) içinde belgelenen yaygın dilleri zaten vurgular. Shiki tarafından desteklenen daha geniş bir dil kümesi için sözdizimi vurgulaması istediğinizde bu dil paketini kurun. Paket kurulu değilse, bu dosyalar yine okunabilir düz metin olarak işlenir.

Örnekler arasında Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI ve diff dosyaları bulunur.

Shiki’nin yukarı akış dil ve alias kataloğu için [Shiki dilleri](https://shiki.style/languages) sayfasına bakın.

<!-- openclaw-plugin-reference:manual-end -->
