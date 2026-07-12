---
read_when:
    - diffs-language-pack Pluginini yüklüyor, yapılandırıyor veya denetliyorsunuz
summary: Varsayılan fark görüntüleyicisi kümesinin dışındaki diller için söz dizimi vurgulaması ekler.
title: Diffs Dil Paketi plugin'i
x-i18n:
    generated_at: "2026-07-12T12:32:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Diffs Dil Paketi Plugin'i

Varsayılan diffs görüntüleyici kümesinin dışındaki diller için sözdizimi vurgulaması ekler.

## Dağıtım

- Paket: `@openclaw/diffs-language-pack`
- Kurulum yolu: npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`

## Yüzey

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## Eklenen diller

Temel `diffs` Plugin'i, [Diffs](/tr/tools/diffs) bölümünde belgelenen yaygın dilleri zaten vurgular. Shiki tarafından desteklenen daha geniş bir dil kümesi için sözdizimi vurgulaması istediğinizde bu dil paketini kurun. Paket kurulmamışsa bu dosyalar yine okunabilir düz metin olarak görüntülenir.

Örnekler arasında Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI ve diff dosyaları bulunur.

Shiki'nin üst kaynak dil ve takma ad kataloğu için [Shiki dilleri](https://shiki.style/languages) sayfasına bakın.

<!-- openclaw-plugin-reference:manual-end -->
