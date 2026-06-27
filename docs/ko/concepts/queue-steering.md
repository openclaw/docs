---
read_when:
    - 에이전트가 도구를 사용하는 동안 steer가 동작하는 방식 설명
    - 활성 실행 큐 동작 또는 런타임 조정 통합 변경
    - followup, collect, interrupt 큐 모드로 스티어링 비교하기
summary: 활성 실행 조정이 런타임 경계에서 메시지를 큐에 넣는 방식
title: 조정 큐
x-i18n:
    generated_at: "2026-06-27T17:25:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b38d036d2a44af431653746e2d5918af0a8af471450f440479cf0a1acc86c9cd
    source_path: concepts/queue-steering.md
    workflow: 16
---

일반 프롬프트가 도착했을 때 세션 실행이 이미 스트리밍 중이면, OpenClaw는 큐 모드가 `steer`일 경우 기본적으로 해당 프롬프트를 활성 런타임으로 보내려고 시도합니다. 이 기본 동작에는 config 항목이나 큐 지시어가 필요하지 않습니다. OpenClaw와 네이티브 Codex app-server 하네스는 전달 세부 방식을 서로 다르게 구현합니다.

## 런타임 경계

steering은 이미 실행 중인 도구 호출을 중단하지 않습니다. OpenClaw는 모델 경계에서 큐에 대기 중인 steering 메시지를 확인합니다.

1. 어시스턴트가 도구 호출을 요청합니다.
2. OpenClaw가 현재 어시스턴트 메시지의 도구 호출 배치를 실행합니다.
3. OpenClaw가 턴 종료 이벤트를 내보냅니다.
4. OpenClaw가 큐에 대기 중인 steering 메시지를 비웁니다.
5. OpenClaw가 다음 LLM 호출 전에 해당 메시지들을 사용자 메시지로 추가합니다.

이렇게 하면 도구 결과가 이를 요청한 어시스턴트 메시지와 짝을 이루도록 유지한 다음, 다음 모델 호출이 최신 사용자 입력을 볼 수 있게 합니다.

네이티브 Codex app-server 하네스는 OpenClaw 런타임의 내부 steering 큐 대신 `turn/steer`를 노출합니다. OpenClaw는 구성된 대기 시간 동안 큐에 대기 중인 프롬프트를 배치 처리한 다음, 수집된 모든 사용자 입력을 도착 순서대로 포함하는 단일 `turn/steer` 요청을 보냅니다.

Codex 리뷰와 수동 Compaction 턴은 같은 턴 steering을 거부합니다. 런타임이 `steer` 모드에서 steering을 수락할 수 없으면, OpenClaw는 프롬프트를 시작하기 전에 활성 실행이 끝날 때까지 기다립니다.

이 페이지는 모드가 `steer`일 때 일반 인바운드 메시지에 대한 큐 모드 steering을 설명합니다. 모드가 `followup` 또는 `collect`이면 일반 메시지는 이 steering 경로에 들어가지 않고, 활성 실행이 끝날 때까지 기다립니다. 명시적인 `/steer <message>` 명령은 [Steer](/ko/tools/steer)를 참조하세요.

## 모드

| 모드        | 활성 실행 동작                                    | 이후 동작                                                                      |
| ----------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `steer`     | 가능하면 프롬프트를 활성 런타임으로 steering합니다. | steering을 사용할 수 없으면 활성 실행이 끝날 때까지 기다립니다.                      |
| `followup`  | steering하지 않습니다.                                        | 활성 실행이 끝난 후 큐에 대기 중인 메시지를 나중에 실행합니다.                               |
| `collect`   | steering하지 않습니다.                                        | debounce 시간 이후 호환되는 큐 대기 메시지를 하나의 나중 턴으로 병합합니다. |
| `interrupt` | 활성 실행을 steering하는 대신 중단합니다.          | 중단한 후 최신 메시지를 시작합니다.                                           |

## 버스트 예시

에이전트가 도구 호출을 실행하는 동안 네 명의 사용자가 메시지를 보내면:

- 기본 동작에서는 활성 런타임이 다음 모델 결정을 내리기 전에 네 메시지를 모두 도착 순서대로 받습니다. OpenClaw는 다음 모델 경계에서 이를 비우고, Codex는 이를 하나의 배치 처리된 `turn/steer`로 받습니다.
- `/queue collect`를 사용하면 OpenClaw는 steering하지 않습니다. 활성 실행이 끝날 때까지 기다린 다음, debounce 시간 이후 호환되는 큐 대기 메시지로 후속 턴을 만듭니다.
- `/queue interrupt`를 사용하면 OpenClaw는 활성 실행을 중단하고 steering 대신 최신 메시지를 시작합니다.

## 범위

steering은 항상 현재 활성 세션 실행을 대상으로 합니다. 새 세션을 만들거나, 활성 실행의 도구 정책을 변경하거나, 발신자별로 메시지를 분할하지 않습니다. 다중 사용자 채널에서는 인바운드 프롬프트에 이미 발신자와 경로 컨텍스트가 포함되어 있으므로, 다음 모델 호출은 각 메시지를 누가 보냈는지 볼 수 있습니다.

활성 실행을 steering하는 대신 메시지를 기본적으로 큐에 넣고 싶으면 `followup` 또는 `collect`를 사용하세요. 최신 프롬프트가 활성 실행을 대체해야 하면 `interrupt`를 사용하세요.

## Debounce

`messages.queue.debounceMs`는 큐에 대기 중인 `followup` 및 `collect` 전달에 적용됩니다. 네이티브 Codex 하네스의 `steer` 모드에서는 배치 처리된 `turn/steer`를 보내기 전 대기 시간도 설정합니다. OpenClaw의 경우 활성 steering 자체는 debounce 타이머를 사용하지 않습니다. OpenClaw가 다음 모델 경계까지 메시지를 자연스럽게 배치 처리하기 때문입니다.

## 관련 항목

- [명령 큐](/ko/concepts/queue)
- [Steer](/ko/tools/steer)
- [메시지](/ko/concepts/messages)
- [에이전트 루프](/ko/concepts/agent-loop)
