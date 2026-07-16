---
read_when:
    - opencode Plugin을 설치, 구성 또는 감사하고 있습니다
summary: OpenClaw에 OpenCode 모델 제공자 지원을 추가합니다.
title: OpenCode Plugin
x-i18n:
    generated_at: "2026-07-16T12:55:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: aecf396cfc645e4a036b8130ed7f33db9081dffda120c6d06ebe863dd3be3730
    source_path: plugins/reference/opencode.md
    workflow: 16
---

# OpenCode Plugin

OpenClaw에 OpenCode 모델 제공자 지원을 추가합니다.

## 배포

- 패키지: `@openclaw/opencode-provider`
- 설치 경로: OpenClaw에 포함됨

## 표면

제공자: `opencode`; 계약: `mediaUnderstandingProviders`

<!-- openclaw-plugin-reference:manual-start -->

## 네이티브 세션

OpenClaw는 Gateway와 페어링된 노드에서 `opencode` CLI를 자동으로 감지합니다. 그러면 저장된
세션이 **OpenCode** 세션 사이드바 그룹에 표시되며, 공식 `opencode --pure db ... --format json`
및 `opencode --pure export` 명령을 통해 읽기 전용으로
트랜스크립트를 탐색할 수 있습니다. 제한된 환경과 `--pure`
모드는 카탈로그 탐색 시 프로젝트 Plugin을 로드하거나 관련 없는
Gateway 자격 증명을 상속하지 못하도록 합니다.

검색을 비활성화하려면 **Config > Plugins > OpenCode**에서 **OpenCode Session Catalog**를
끄십시오. 기본적으로 활성화되어 있습니다.

<!-- openclaw-plugin-reference:manual-end -->

## 관련 문서

- [opencode](/ko/providers/opencode)
