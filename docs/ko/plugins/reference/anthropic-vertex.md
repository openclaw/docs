---
read_when:
    - anthropic-vertex Plugin을 설치, 구성 또는 감사하고 있습니다
summary: Google Vertex AI의 Claude 모델용 OpenClaw Anthropic Vertex 공급자 Plugin.
title: Anthropic Vertex Plugin
x-i18n:
    generated_at: "2026-06-27T17:48:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f772c9a5bf1edd6a270b7ba5e6d695290fe96648c9ac38d0bc90bb1504f50cd7
    source_path: plugins/reference/anthropic-vertex.md
    workflow: 16
---

# Anthropic Vertex Plugin

Google Vertex AI의 Claude 모델을 위한 OpenClaw Anthropic Vertex 제공자 Plugin입니다.

## 배포

- 패키지: `@openclaw/anthropic-vertex-provider`
- 설치 경로: npm; ClawHub

## 노출 영역

providers: anthropic-vertex

<!-- openclaw-plugin-reference:manual-start -->

## Claude Fable 5

Google Cloud 리전에서 해당 모델을 사용할 수 있는 경우 `anthropic-vertex/claude-fable-5`를 사용하세요.
Fable 5는 항상 적응형 사고를 사용하며 기본값은 `high` 노력 수준입니다. 모델이 사고 비활성화를 지원하지 않으므로 `/think off` 및
`/think minimal`은 `low` 노력 수준을 사용합니다.

<!-- openclaw-plugin-reference:manual-end -->
