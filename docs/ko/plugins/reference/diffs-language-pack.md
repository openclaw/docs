---
read_when:
    - diffs-language-pack Plugin을 설치, 구성 또는 감사하고 있습니다
summary: 기본 diff 뷰어에서 지원하는 언어 외의 언어에 구문 강조를 추가합니다.
title: Diffs 언어 팩 Plugin
x-i18n:
    generated_at: "2026-07-12T01:00:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Diffs 언어 팩 Plugin

기본 diffs 뷰어에 포함되지 않은 언어의 구문 강조 표시를 추가합니다.

## 배포

- 패키지: `@openclaw/diffs-language-pack`
- 설치 경로: npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`

## 제공 영역

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## 추가된 언어

기본 `diffs` Plugin은 [Diffs](/ko/tools/diffs)에 문서화된 일반적인 언어를 이미 강조 표시합니다. 더 폭넓은 Shiki 지원 언어에 구문 강조 표시를 적용하려면 이 언어 팩을 설치하세요. 이 팩이 설치되어 있지 않아도 해당 파일은 읽을 수 있는 일반 텍스트로 렌더링됩니다.

예를 들면 Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI 및 diff 파일이 포함됩니다.

Shiki의 업스트림 언어 및 별칭 목록은 [Shiki 언어](https://shiki.style/languages)를 참조하세요.

<!-- openclaw-plugin-reference:manual-end -->
