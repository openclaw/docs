---
read_when:
    - 첫 번째 에이전트 실행 시 발생하는 작업 이해하기
    - 부트스트래핑 파일의 위치 설명
    - 온보딩 ID 설정 디버깅
sidebarTitle: Bootstrapping
summary: 에이전트 부트스트래핑 과정으로 작업 공간과 ID 파일을 초기화합니다.
title: 에이전트 부트스트래핑
x-i18n:
    generated_at: "2026-07-12T15:46:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d8356684e8567b02f558ce2b455a20019e55579e5dcb4625bb441d66656098e0
    source_path: start/bootstrapping.md
    workflow: 16
---

부트스트래핑은 새 에이전트 워크스페이스의 초기 구성을 채우고 에이전트가 정체성을 선택하도록 안내하는 최초 실행 절차입니다. 온보딩 직후 에이전트의 첫 번째 실제 턴에서 한 번만 실행됩니다.

## 진행 과정

완전히 새로운 워크스페이스(기본값: `~/.openclaw/workspace`)에서 처음 실행하면 OpenClaw는 다음 작업을 수행합니다.

- `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`를 초기 구성으로 생성합니다.
- 에이전트가 `BOOTSTRAP.md`에 따라 이름, 성격, 분위기를 정하기 위한 자유 형식의 대화(고정된 질의응답 양식이 아님)를 진행하게 합니다.
- 대화를 통해 파악한 내용을 `IDENTITY.md`, `USER.md`, `SOUL.md`에 기록합니다.
- 워크스페이스가 구성된 것으로 판단되면 `BOOTSTRAP.md`를 삭제하여 이 절차가 한 번만 실행되도록 합니다.

`SOUL.md`, `IDENTITY.md`, `USER.md` 중 하나가 시작 템플릿과 달라졌거나 `memory/` 폴더가 존재하면 워크스페이스가 구성된 것으로 간주합니다.

<Note>
`BOOTSTRAP.md`에는 전체 정체성 설정 대화가 포함되어 있습니다. 자세한 내용은 [BOOTSTRAP.md 템플릿](/ko/reference/templates/BOOTSTRAP)을 참조하십시오.
</Note>

## 임베디드 및 로컬 모델 실행

임베디드 또는 로컬 모델 실행 시 OpenClaw는 `BOOTSTRAP.md`를 권한이 부여된 시스템 컨텍스트에 포함하지 않습니다. 하지만 기본 대화형 최초 실행에서는 파일 내용을 사용자 프롬프트를 통해 계속 전달하므로, `read` 도구를 안정적으로 호출하지 못하는 모델도 이 절차를 완료할 수 있습니다. 현재 실행에서 워크스페이스에 안전하게 접근할 수 없는 경우 에이전트는 일반적인 인사말 대신 짧은 제한적 부트스트랩 안내를 받습니다.

## 부트스트래핑 건너뛰기

미리 구성된 워크스페이스에서 이 과정을 건너뛰려면 다음 명령을 실행하십시오.

```bash
openclaw onboard --skip-bootstrap
```

## 실행 위치

부트스트래핑은 항상 Gateway 호스트에서 실행됩니다. macOS 앱이 원격 Gateway에 연결되면 워크스페이스와 해당 부트스트랩 파일은 Mac이 아니라 원격 시스템에 위치합니다.

<Note>
Gateway가 다른 시스템에서 실행되는 경우 Gateway 호스트에서 워크스페이스 파일을 편집하십시오(예: `user@gateway-host:~/.openclaw/workspace`).
</Note>

## 관련 문서

- macOS 앱 온보딩: [온보딩](/ko/start/onboarding)
- 워크스페이스 구조: [에이전트 워크스페이스](/ko/concepts/agent-workspace)
- 템플릿 내용: [BOOTSTRAP.md 템플릿](/ko/reference/templates/BOOTSTRAP)
