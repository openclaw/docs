---
read_when:
    - Você está instalando, configurando ou auditando o Plugin diffs-language-pack
summary: Adiciona realce de sintaxe para linguagens fora do conjunto padrão do visualizador de diffs.
title: Plugin de pacote de idiomas para diffs
x-i18n:
    generated_at: "2026-06-27T17:52:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Plugin Diffs Language Pack

Adiciona destaque de sintaxe para linguagens fora do conjunto padrão do visualizador de diffs.

## Distribuição

- Pacote: `@openclaw/diffs-language-pack`
- Rota de instalação: npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`

## Superfície

plugin

<!-- openclaw-plugin-reference:manual-start -->

## Linguagens adicionadas

O Plugin `diffs` básico já destaca as linguagens comuns documentadas em [Diffs](/pt-BR/tools/diffs). Instale este pacote de linguagens quando quiser destaque de sintaxe para um conjunto mais amplo de linguagens compatíveis com Shiki. Se o pacote não estiver instalado, esses arquivos ainda serão renderizados como texto simples legível.

Exemplos incluem Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI e arquivos diff.

Consulte [linguagens do Shiki](https://shiki.style/languages) para ver o catálogo upstream de linguagens e aliases do Shiki.

<!-- openclaw-plugin-reference:manual-end -->
