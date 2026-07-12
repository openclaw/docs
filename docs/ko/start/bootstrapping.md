---
read_when:
    - 첫 번째 에이전트 실행 시 발생하는 작업 이해하기
    - 부트스트래핑 파일의 위치 설명
    - 온보딩 ID 설정 디버깅
sidebarTitle: Bootstrapping
summary: 워크스페이스와 ID 파일을 초기화하는 에이전트 부트스트래핑 절차
title: 에이전트 부트스트래핑
x-i18n:
    generated_at: "2026-07-12T01:13:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8356684e8567b02f558ce2b455a20019e55579e5dcb4625bb441d66656098e0
    source_path: start/bootstrapping.md
    workflow: 16
---

부트스트래핑은 새 에이전트 작업 공간을 초기화하고 에이전트가 정체성을 선택하도록 안내하는 최초 실행 절차입니다. 온보딩 직후 에이전트의 첫 번째 실제 턴에서 한 번만 실행됩니다.

## 진행 과정

완전히 새로운 작업 공간(기본값: `~/.openclaw/workspace`)에서 처음 실행하면 OpenClaw는 다음을 수행합니다.

- `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`를 초기화합니다.
- 에이전트가 `BOOTSTRAP.md`를 따르도록 합니다. 이는 이름, 성격, 분위기를 정하기 위한 자유 형식의 대화이며, 고정된 질의응답 양식이 아닙니다.
- 대화에서 파악한 내용을 `IDENTITY.md`, `USER.md`, `SOUL.md`에 기록합니다.
- 작업 공간의 구성이 완료된 것으로 보이면 `BOOTSTRAP.md`를 삭제하여 이 절차가 한 번만 실행되도록 합니다.

`SOUL.md`, `IDENTITY.md`, `USER.md` 중 하나가 초기 템플릿과 달라졌거나 `memory/` 폴더가 있으면 작업 공간이 구성된 것으로 간주합니다.

<Note>
`BOOTSTRAP.md`에는 전체 정체성 설정 대화가 포함되어 있습니다. 자세한 내용은 [BOOTSTRAP.md 템플릿](/ko/reference/templates/BOOTSTRAP)을 참조하세요.
</Note>

## 임베디드 및 로컬 모델 실행

임베디드 또는 로컬 모델 실행 시 OpenClaw는 `BOOTSTRAP.md`를 권한이 부여된 시스템 컨텍스트에 포함하지 않습니다. 기본 대화형 최초 실행에서는 여전히 파일 내용을 사용자 프롬프트를 통해 전달하므로, `read` 도구를 안정적으로 호출하지 못하는 모델도 이 절차를 완료할 수 있습니다. 현재 실행에서 작업 공간에 안전하게 접근할 수 없는 경우 에이전트는 일반적인 인사말 대신 제한된 부트스트래핑에 관한 짧은 안내를 받습니다.

## 부트스트래핑 건너뛰기

미리 초기화된 작업 공간에서 이 과정을 건너뛰려면 다음을 실행합니다.

```bash
openclaw onboard --skip-bootstrap
```

## 실행 위치

부트스트래핑은 항상 Gateway 호스트에서 실행됩니다. macOS 앱이 원격 Gateway에 연결된 경우 작업 공간과 부트스트랩 파일은 Mac이 아닌 해당 원격 머신에 있습니다.

<Note>
Gateway가 다른 머신에서 실행 중인 경우 Gateway 호스트에서 작업 공간 파일을 편집하세요(예: `user@gateway-host:~/.openclaw/workspace`).
</Note>

## 관련 문서

- macOS 앱 온보딩: [온보딩](/ko/start/onboarding)
- 작업 공간 구조: [에이전트 작업 공간](/ko/concepts/agent-workspace)
- 템플릿 내용: [BOOTSTRAP.md 템플릿](/ko/reference/templates/BOOTSTRAP)
