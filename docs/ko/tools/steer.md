---
read_when:
    - 에이전트가 이미 실행 중일 때 /steer 또는 /tell 사용
    - /steer 모드와 /queue 모드 비교
    - 현재 실행 또는 ACP 세션을 조정할지 결정하기
sidebarTitle: Steer
summary: 활성 실행의 큐 모드를 변경하지 않고 조정하기
title: 조정
x-i18n:
    generated_at: "2026-06-27T18:16:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer`는 먼저 이미 활성화된 실행에 지침을 보내려고 시도합니다. 이는
"아직 작업 중인 이 실행을 조정"해야 하는 순간을 위한 것입니다. 현재 런타임이
조정을 수락할 수 없으면 OpenClaw는 메시지를 버리는 대신 일반 프롬프트로
전송합니다.

## 현재 세션

현재 세션의 활성 실행을 대상으로 하려면 최상위 `/steer`를 사용하세요.

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

동작:

- 현재 세션의 활성 실행만 대상으로 합니다.
- 세션의 `/queue` 모드와 독립적으로 작동합니다.
- 세션이 유휴 상태이거나 활성 실행이 조정을 수락할 수 없으면 같은 메시지로
  일반 턴을 시작합니다.
- 활성 런타임의 조정 경로를 사용하므로, 모델은 다음 지원 런타임 경계에서
  지침을 보게 됩니다.

## 조정과 큐

`/queue steer`는 실행이 활성 상태일 때 도착하는 일반 수신 메시지가 활성 실행을
조정하도록 시도하게 합니다. `/steer <message>`는 저장된 `/queue` 설정과
관계없이 해당 명령의 메시지를 다음 지원 런타임 경계에서 활성 실행에 주입하려고
시도하는 명시적 명령입니다. 해당 주입을 사용할 수 없으면 명령 접두사가 제거되고
`<message>`는 일반 프롬프트로 계속됩니다.

사용:

- 지금 바로 활성 실행을 안내하려면 `/steer <message>`를 사용하세요.
- 향후 일반 메시지가 기본적으로 활성 실행을 조정하게 하려면 `/queue steer`를
  사용하세요.
- 향후 일반 메시지가 활성 실행을 조정하는 대신 이후 턴을 기다려야 한다면
  `/queue collect` 또는 `/queue followup`을 사용하세요.
- 최신 메시지가 활성 실행을 조정하는 대신 대체해야 한다면 `/queue interrupt`를
  사용하세요.

큐 모드와 조정 경계는 [명령 큐](/ko/concepts/queue) 및
[조정 큐](/ko/concepts/queue-steering)를 참조하세요.

## 하위 에이전트

최상위 `/steer`는 현재 세션의 활성 실행을 대상으로 합니다. 하위 에이전트는
부모/요청자 세션에 보고하며, `/subagents`는 표시용으로만 사용됩니다.

## ACP 세션

대상이 ACP 하네스 세션인 경우 `/acp steer`를 사용하세요.

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

ACP 세션 선택 및 런타임 동작은 [ACP 에이전트](/ko/tools/acp-agents)를
참조하세요.

## 관련 항목

- [슬래시 명령](/ko/tools/slash-commands)
- [명령 큐](/ko/concepts/queue)
- [조정 큐](/ko/concepts/queue-steering)
- [하위 에이전트](/ko/tools/subagents)
