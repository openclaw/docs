---
read_when:
    - 첫 에이전트 실행 시 어떤 일이 일어나는지 이해하기
    - 부트스트래핑 파일이 어디에 있는지 설명
    - 온보딩 ID 설정 디버깅
sidebarTitle: Bootstrapping
summary: 작업 공간과 ID 파일을 시드하는 에이전트 부트스트랩 절차
title: 에이전트 부트스트래핑
x-i18n:
    generated_at: "2026-04-30T06:51:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: de829f82016ae1e4dcd7714502ca8d11755556fed18b985a7e2bada4149a2d46
    source_path: start/bootstrapping.md
    workflow: 16
---

부트스트래핑은 에이전트 작업 공간을 준비하고 신원 세부 정보를 수집하는 **첫 실행** 절차입니다. 온보딩 후 에이전트가 처음 시작될 때 실행됩니다.

## 부트스트래핑이 하는 일

첫 에이전트 실행 시 OpenClaw는 작업 공간(기본값 `~/.openclaw/workspace`)을 부트스트랩합니다.

- `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`를 시드합니다.
- 짧은 Q&A 절차를 실행합니다(한 번에 하나의 질문).
- 신원 + 선호 사항을 `IDENTITY.md`, `USER.md`, `SOUL.md`에 기록합니다.
- 완료되면 `BOOTSTRAP.md`를 제거하여 한 번만 실행되도록 합니다.

임베디드/로컬 모델 실행의 경우 OpenClaw는 `BOOTSTRAP.md`를 권한 있는 시스템 컨텍스트에서 제외합니다. 기본 대화형 첫 실행에서는 `read` 도구를 안정적으로 호출하지 않는 모델도 절차를 완료할 수 있도록 사용자 프롬프트에 파일 내용을 계속 전달합니다. 현재 실행이 작업 공간에 안전하게 접근할 수 없는 경우, 에이전트는 일반적인 인사말 대신 제한된 부트스트랩 메모를 받습니다.

## 부트스트래핑 건너뛰기

미리 시드된 작업 공간에서 이를 건너뛰려면 `openclaw onboard --skip-bootstrap`을 실행하세요.

## 실행 위치

부트스트래핑은 항상 **Gateway 호스트**에서 실행됩니다. macOS 앱이 원격 Gateway에 연결하는 경우, 작업 공간과 부트스트래핑 파일은 해당 원격 머신에 있습니다.

<Note>
Gateway가 다른 머신에서 실행되는 경우, Gateway 호스트에서 작업 공간 파일을 편집하세요(예: `user@gateway-host:~/.openclaw/workspace`).
</Note>

## 관련 문서

- macOS 앱 온보딩: [온보딩](/ko/start/onboarding)
- 작업 공간 레이아웃: [에이전트 작업 공간](/ko/concepts/agent-workspace)
