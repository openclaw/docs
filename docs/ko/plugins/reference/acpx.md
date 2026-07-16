---
read_when:
    - acpx Plugin을 설치, 구성 또는 감사하고 있습니다
summary: Plugin이 세션 및 전송 관리를 소유하는 OpenClaw ACP 런타임 백엔드.
title: ACPx Plugin
x-i18n:
    generated_at: "2026-07-16T12:52:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9816ca3ada81eb44883b641f3d761b76f894bd83c8aa978c516125c77842f664
    source_path: plugins/reference/acpx.md
    workflow: 16
---

# ACPx Plugin

Plugin이 소유하는 세션 및 전송 관리를 지원하는 OpenClaw ACP 런타임 백엔드입니다.

## 배포

- 패키지: `@openclaw/acpx`
- 설치 경로: npm; ClawHub

## 제공 기능

Skills

<!-- openclaw-plugin-reference:manual-start -->

## Pi 네이티브 세션

번들 런타임은 Gateway와 페어링된 Node에서 Pi의 세션 저장소를 자동으로 감지합니다. 저장된 세션은 **Pi** 세션 사이드바 그룹에 표시되며, Pi에 문서화된 JSONL 세션 형식의 트랜스크립트를 읽기 전용으로 탐색할 수 있습니다. 카탈로그는 프로젝트 및 전역 `settings.json` 세션 디렉터리와 `PI_CODING_AGENT_DIR` 및 `PI_CODING_AGENT_SESSION_DIR`을 적용합니다. 상대 경로는 해당 `settings.json` 파일이 포함된 디렉터리를 기준으로 해석됩니다.

검색을 비활성화하려면 **Config > Plugins > ACPX Runtime**에서 **Pi Session Catalog**를 끄십시오. 기본적으로 활성화되어 있습니다.

<!-- openclaw-plugin-reference:manual-end -->

## 관련 문서

- [acpx](/ko/tools/acp-agents-setup)
