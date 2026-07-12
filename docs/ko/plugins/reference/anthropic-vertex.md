---
read_when:
    - anthropic-vertex Plugin을 설치, 구성 또는 감사하고 있습니다.
summary: Google Vertex AI의 Claude 모델을 위한 OpenClaw Anthropic Vertex 제공자 Plugin입니다.
title: Anthropic Vertex Plugin
x-i18n:
    generated_at: "2026-07-12T15:35:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fe5500ca56df49c0ef6ccbf39ced71e3fd0b18776ad23716de8575bc6ba64cb8
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Anthropic Vertex Plugin

Google Vertex AI의 Claude 모델을 위한 OpenClaw Anthropic Vertex 제공자 Plugin입니다.

## 배포

- 패키지: `@openclaw/anthropic-vertex-provider`
- 설치 경로: npm; ClawHub

## 제공 표면

제공자: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Google Cloud 리전에서 모델을 사용할 수 있는 경우 `anthropic-vertex/claude-fable-5`를 사용하십시오.
Fable 5는 항상 적응형 사고를 사용하며 기본 노력 수준은 `high`입니다. 이 모델은 사고 비활성화를 지원하지 않으므로 `/think off`와
`/think minimal`은 `low` 노력 수준을 사용합니다.

## Claude Sonnet 5

Vertex의 `global`, `us` 또는 `eu` 엔드포인트에서 `anthropic-vertex/claude-sonnet-5`를 사용하십시오.
Sonnet 5는 기본적으로 `high` 노력 수준의 적응형 사고를 사용하며
`/think off` 또는 네이티브 `/think xhigh|max` 수준을 지원합니다. OpenClaw는
1,000,000토큰 컨텍스트 창과 128,000토큰 출력 제한을 자동으로 게시합니다.

카탈로그 가격은 2026년 8월 31일까지 입력/출력 토큰 100만 개당 `$2/$10`인
Vertex의 글로벌 출시 요금을 따르며, 9월 1일부터는 `$3/$15`가 적용됩니다.
`us` 및 `eu` 멀티 리전 엔드포인트에는 Vertex가 명시한
10% 할증이 적용됩니다.

<!-- openclaw-plugin-reference:manual-end -->
