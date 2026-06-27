---
read_when:
    - diffs-language-pack Plugin을 설치, 구성 또는 감사하고 있습니다
summary: 기본 diff 뷰어 집합에 없는 언어에 대한 구문 강조를 추가합니다.
title: Diffs 언어 팩 Plugin
x-i18n:
    generated_at: "2026-06-27T17:50:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e63f896b937be27bd00a7a728b128ec0d1d5eee91d6f1023862274e32afe5db1
    source_path: plugins/reference/diffs-language-pack.md
    workflow: 16
---

# Diffs Language Pack Plugin

기본 diffs 뷰어 세트 외 언어에 대한 구문 강조를 추가합니다.

## 배포

- 패키지: `@openclaw/diffs-language-pack`
- 설치 경로: npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`

## 표면

Plugin

<!-- openclaw-plugin-reference:manual-start -->

## 추가된 언어

기본 `diffs` Plugin은 [Diffs](/ko/tools/diffs)에 문서화된 일반적인 언어를 이미 강조 표시합니다. 더 폭넓은 Shiki 지원 언어 세트에 구문 강조가 필요할 때 이 언어 팩을 설치하세요. 팩이 설치되어 있지 않아도 해당 파일은 여전히 읽기 쉬운 일반 텍스트로 렌더링됩니다.

예로는 Astro, Vue, Svelte, MDX, GraphQL, Terraform/HCL, Nix, Clojure, Elixir, Haskell, OCaml, Scala, Zig, Solidity, Verilog/VHDL, Fortran, MATLAB, LaTeX, Mermaid, Sass/Less/SCSS, Nginx, Apache, CSV, dotenv, INI, diff 파일 등이 있습니다.

Shiki의 업스트림 언어 및 별칭 카탈로그는 [Shiki languages](https://shiki.style/languages)를 참조하세요.

<!-- openclaw-plugin-reference:manual-end -->
