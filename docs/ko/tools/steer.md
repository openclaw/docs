---
read_when:
    - 에이전트가 이미 실행 중일 때 /steer 또는 /tell 사용
    - /steer와 /queue steer 비교
    - 현재 실행, 하위 에이전트 또는 ACP 세션 중 무엇을 조정할지 결정하기
sidebarTitle: Steer
summary: 대기열 모드를 변경하지 않고 활성 실행 제어하기
title: 조정
x-i18n:
    generated_at: "2026-05-04T02:26:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71e1c80c0eea86d5c3c29513d3ed0675c04779fc9c6ee3b8a76c4bedaa264d22
    source_path: tools/steer.md
    workflow: 16
---

`/steer`는 이미 활성화된 실행에 지침을 보냅니다. 새 턴을 시작하기 위한 것이 아니라, "이 실행이 아직 작업 중일 때 조정"해야 하는 순간에 사용합니다.

## 현재 세션

최상위 `/steer`를 사용해 현재 세션의 활성 실행을 대상으로 지정합니다.

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

동작:

- 현재 세션의 활성 실행만 대상으로 지정합니다.
- 세션의 `/queue` 모드와 독립적으로 작동합니다.
- 세션이 유휴 상태일 때 새 실행을 시작하지 않습니다.
- 조정할 활성 실행이 없으면 경고로 응답합니다.
- 활성 런타임의 조정 경로를 사용하므로, 모델은 다음에 지원되는 런타임 경계에서 지침을 확인합니다.

## steer와 queue 비교

`/queue steer`는 실행이 활성 상태일 때 일반 수신 메시지가 도착하면 해당 메시지가 어떻게 동작할지 변경합니다. `/steer <message>`는 저장된 `/queue` 설정과 관계없이, 다음에 지원되는 런타임 경계에서 해당 명령의 메시지를 활성 실행에 주입하려고 시도하는 명시적 명령입니다.

사용:

- 활성 실행을 지금 바로 안내하려면 `/steer <message>`를 사용합니다.
- 앞으로 일반 메시지가 기본적으로 활성 실행을 조정하도록 하려면 `/queue steer`를 사용합니다.
- 새 메시지가 활성 실행을 조정하는 대신 이후 턴을 기다려야 한다면 `/queue collect` 또는 `/queue followup`을 사용합니다.

큐 모드와 폴백 동작은 [명령 큐](/ko/concepts/queue) 및 [조정 큐](/ko/concepts/queue-steering)를 참조하세요.

## 하위 에이전트

대상이 하위 실행인 경우 `/subagents steer`를 사용합니다.

```text
/subagents steer 2 focus only on the API surface
```

최상위 `/steer`는 id나 목록 인덱스로 하위 에이전트를 선택하지 않습니다. 항상 현재 세션의 활성 실행을 대상으로 지정합니다. 하위 에이전트 id, 레이블, 제어 명령은 [하위 에이전트](/ko/tools/subagents)를 참조하세요.

## ACP 세션

대상이 ACP 하네스 세션인 경우 `/acp steer`를 사용합니다.

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

ACP 세션 선택과 런타임 동작은 [ACP 에이전트](/ko/tools/acp-agents)를 참조하세요.

## 관련 항목

- [슬래시 명령](/ko/tools/slash-commands)
- [명령 큐](/ko/concepts/queue)
- [조정 큐](/ko/concepts/queue-steering)
- [하위 에이전트](/ko/tools/subagents)
