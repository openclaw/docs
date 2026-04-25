---
read_when:
    - 첫 번째 에이전트 실행에서 어떤 일이 일어나는지 이해하기
    - bootstrap 파일이 어디에 있는지 설명하기
    - 온보딩 identity 설정 디버깅하기
sidebarTitle: Bootstrapping
summary: 워크스페이스와 identity 파일을 시드하는 에이전트 bootstrap ritual
title: 에이전트 bootstrap
x-i18n:
    generated_at: "2026-04-25T06:10:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 435eb2a14707623903ab7873774cc8d4489b960719cf6a525d547983f8338027
    source_path: start/bootstrapping.md
    workflow: 15
---

bootstrap은 에이전트 워크스페이스를 준비하고 identity 세부정보를 수집하는 **첫 실행** ritual입니다. 온보딩 후, 에이전트가 처음 시작될 때 실행됩니다.

## bootstrap이 하는 일

첫 번째 에이전트 실행에서 OpenClaw는 워크스페이스(기본값
`~/.openclaw/workspace`)를 bootstrap합니다:

- `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`를 시드합니다.
- 짧은 Q&A ritual을 실행합니다(한 번에 한 질문씩).
- identity + preferences를 `IDENTITY.md`, `USER.md`, `SOUL.md`에 기록합니다.
- 완료되면 `BOOTSTRAP.md`를 제거하여 한 번만 실행되도록 합니다.

## bootstrap 건너뛰기

미리 시드된 워크스페이스에서 이를 건너뛰려면 `openclaw onboard --skip-bootstrap`을 실행하세요.

## 실행 위치

bootstrap은 항상 **gateway 호스트**에서 실행됩니다. macOS 앱이
원격 Gateway에 연결된 경우, 워크스페이스와 bootstrap 파일은 해당 원격
머신에 있습니다.

<Note>
Gateway가 다른 머신에서 실행 중이라면, 워크스페이스 파일은 gateway
호스트에서 편집하세요(예: `user@gateway-host:~/.openclaw/workspace`).
</Note>

## 관련 문서

- macOS 앱 온보딩: [Onboarding](/ko/start/onboarding)
- 워크스페이스 레이아웃: [Agent workspace](/ko/concepts/agent-workspace)
