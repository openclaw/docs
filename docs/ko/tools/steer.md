---
read_when:
    - 에이전트가 이미 실행 중일 때 /steer 또는 /tell 사용하기
    - /steer와 /queue 모드 비교
    - 현재 실행을 조정할지 ACP 세션을 조정할지 결정하기
sidebarTitle: Steer
summary: 큐 모드를 변경하지 않고 활성 실행 제어하기
title: 조정하기
x-i18n:
    generated_at: "2026-07-12T01:22:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer`는 먼저 이미 활성화된 실행에 지침을 보내려고 시도합니다. 이는
"아직 작업 중인 이 실행을 조정"해야 할 때 사용합니다. 현재 런타임이
스티어링을 수락할 수 없으면 OpenClaw는 메시지를 삭제하지 않고 일반 프롬프트로
전송합니다.

## 현재 세션

최상위 `/steer`를 사용하여 현재 세션의 활성 실행을 대상으로 지정합니다.

```text
/steer 더 작은 패치를 선호하고 테스트 범위를 집중해서 유지해
/tell 다음 도구를 호출하기 전에 요약해
```

동작:

- 현재 세션의 활성 실행만 대상으로 지정합니다.
- 세션의 `/queue` 모드와 독립적으로 작동합니다.
- 세션이 유휴 상태이거나 활성 실행이 스티어링을 수락할 수 없으면 동일한 메시지로
  일반 턴을 시작합니다.
- 활성 런타임의 스티어링 경로를 사용하므로 모델은 다음으로 지원되는 런타임
  경계에서 지침을 확인합니다.

## 스티어링과 대기열 비교

`/queue steer`를 사용하면 실행이 활성 상태일 때 도착하는 일반 수신 메시지가
활성 실행을 스티어링하려고 시도합니다. `/steer <message>`는 저장된 `/queue`
설정과 관계없이, 다음으로 지원되는 런타임 경계에서 해당 명령의 메시지를 활성
실행에 주입하려고 시도하는 명시적 명령입니다. 주입할 수 없는 경우 명령 접두사가
제거되고 `<message>`가 일반 프롬프트로 계속 처리됩니다.

사용법:

- 지금 바로 활성 실행에 지침을 제공하려면 `/steer <message>`를 사용합니다.
- 향후 일반 메시지가 기본적으로 활성 실행을 스티어링하도록 하려면 `/queue steer`를
  사용합니다.
- 향후 일반 메시지가 활성 실행을 스티어링하지 않고 이후 턴까지 대기해야 한다면
  `/queue collect` 또는 `/queue followup`을 사용합니다.
- 최신 메시지가 활성 실행을 스티어링하는 대신 대체해야 한다면 `/queue interrupt`를
  사용합니다.

대기열 모드와 스티어링 경계에 관한 자세한 내용은 [명령 대기열](/ko/concepts/queue)과
[스티어링 대기열](/ko/concepts/queue-steering)을 참조하세요.

## 하위 에이전트

최상위 `/steer`는 현재 세션의 활성 실행을 대상으로 지정합니다. 하위 에이전트는
상위/요청자 세션에 결과를 보고하며, `/subagents`는 가시성 확인 용도로만 사용됩니다.

## ACP 세션

대상이 ACP 하네스 세션이라면 `/acp steer`를 사용합니다.

```text
/acp steer --session agent:main:acp:codex 재현 범위를 좁혀
```

ACP 세션 선택 및 런타임 동작에 관한 자세한 내용은
[ACP 에이전트](/ko/tools/acp-agents)를 참조하세요.

## 관련 항목

- [슬래시 명령](/ko/tools/slash-commands)
- [명령 대기열](/ko/concepts/queue)
- [스티어링 대기열](/ko/concepts/queue-steering)
- [하위 에이전트](/ko/tools/subagents)
