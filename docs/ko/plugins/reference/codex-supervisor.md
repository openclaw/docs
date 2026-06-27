---
read_when:
    - codex-supervisor Plugin을 설치, 구성 또는 감사하고 있습니다
summary: OpenClaw에서 Codex 앱 서버 세션을 감독합니다.
title: Codex Supervisor Plugin
x-i18n:
    generated_at: "2026-06-27T17:49:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62d0791cf6aab23cb3ac14949742735ac45ac9210c608890048e9e3edc4dd9a5
    source_path: plugins/reference/codex-supervisor.md
    workflow: 16
---

# Codex Supervisor Plugin

OpenClaw에서 Codex app-server 세션을 감독합니다.

## 배포

- 패키지: `@openclaw/codex-supervisor`
- 설치 경로: OpenClaw에 포함됨

## 표면

계약: 도구

<!-- openclaw-plugin-reference:manual-start -->

## 세션 목록

`codex_sessions_list`는 기본적으로 로드된 Codex 세션만 표시합니다. 저장된 기록을 포함하려면 `include_stored`를 설정하세요. Plugin은 Codex app-server의 state-DB 전용 목록 경로를 사용하며, 저장된 결과를 기본적으로 200개로 제한합니다. 이 제한을 낮추거나 높이려면 `max_stored_sessions`를 전달하세요. 최대 1000개까지 가능합니다.

<!-- openclaw-plugin-reference:manual-end -->
