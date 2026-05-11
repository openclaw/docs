---
read_when:
    - 자동 Compaction과 /compact를 이해하려고 합니다
    - 컨텍스트 제한에 도달하는 긴 세션을 디버깅하고 있습니다
summary: OpenClaw가 모델 한도 내에 머물기 위해 긴 대화를 요약하는 방식
title: Compaction
x-i18n:
    generated_at: "2026-05-11T20:27:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: edef60498a1e91405bd42d5e6eb4883719487f6d6f40936c4168e8bc5f40a39a
    source_path: concepts/compaction.md
    workflow: 16
---

모든 모델에는 컨텍스트 창이 있습니다. 이는 처리할 수 있는 최대 토큰 수입니다. 대화가 이 한도에 가까워지면 OpenClaw는 채팅을 계속할 수 있도록 오래된 메시지를 요약으로 **Compaction**합니다.

## 작동 방식

1. 이전 대화 턴이 간결한 항목으로 요약됩니다.
2. 요약은 세션 트랜스크립트에 저장됩니다.
3. 최근 메시지는 그대로 유지됩니다.

OpenClaw가 기록을 Compaction 청크로 나눌 때, assistant 도구 호출을 해당 `toolResult` 항목과 함께 유지합니다. 분할 지점이 도구 블록 안에 걸리면 OpenClaw는 쌍이 함께 유지되고 현재 요약되지 않은 꼬리 부분이 보존되도록 경계를 이동합니다.

전체 대화 기록은 디스크에 유지됩니다. Compaction은 다음 턴에서 모델이 보는 내용만 변경합니다.

## 자동 Compaction

자동 Compaction은 기본적으로 켜져 있습니다. 세션이 컨텍스트 한도에 가까워지거나 모델이 컨텍스트 오버플로 오류를 반환할 때 실행됩니다. 후자의 경우 OpenClaw가 Compaction한 뒤 다시 시도합니다.

다음이 표시됩니다.

- 일반 Gateway 로그의 `embedded run auto-compaction start` / `complete`.
- verbose 모드의 `🧹 Auto-compaction complete`.
- `/status`에 표시되는 `🧹 Compactions: <count>`.

<Info>
Compaction하기 전에 OpenClaw는 agent에게 중요한 메모를 [메모리](/ko/concepts/memory) 파일에 저장하라고 자동으로 알려 줍니다. 이렇게 하면 컨텍스트 손실을 방지할 수 있습니다.
</Info>

<AccordionGroup>
  <Accordion title="인식되는 오버플로 시그니처">
    OpenClaw는 다음 provider 오류 패턴에서 컨텍스트 오버플로를 감지합니다.

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens`
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## 수동 Compaction

Compaction을 강제로 실행하려면 아무 채팅에서나 `/compact`를 입력합니다. 요약을 안내할 지침을 추가할 수 있습니다.

```
/compact Focus on the API design decisions
```

`agents.defaults.compaction.keepRecentTokens`가 설정되어 있으면 수동 Compaction은 해당 Pi cut-point를 존중하고 재구성된 컨텍스트에서 최근 꼬리 부분을 유지합니다. 명시적인 유지 예산이 없으면 수동 Compaction은 하드 체크포인트처럼 동작하며 새 요약만으로 계속 진행합니다.

## 구성

`openclaw.json`의 `agents.defaults.compaction` 아래에서 Compaction을 구성합니다. 가장 일반적인 조정 항목은 아래에 나와 있습니다. 전체 참조는 [세션 관리 심층 가이드](/ko/reference/session-management-compaction)를 참조하세요.

### 다른 모델 사용

기본적으로 Compaction은 agent의 기본 모델을 사용합니다. 요약을 더 유능하거나 특화된 모델에 위임하려면 `agents.defaults.compaction.model`을 설정합니다. 이 override는 모든 `provider/model-id` 문자열을 허용합니다.

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

예를 들어 요약 전용 두 번째 Ollama 모델처럼 로컬 모델에서도 작동합니다.

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

설정하지 않으면 Compaction은 활성 세션 모델로 시작합니다. 요약이 모델 fallback 대상 provider 오류로 실패하면 OpenClaw는 해당 Compaction 시도를 세션의 기존 모델 fallback 체인을 통해 다시 시도합니다. fallback 선택은 일시적이며 세션 상태에 다시 기록되지 않습니다. 명시적인 `agents.defaults.compaction.model` override는 정확히 유지되며 세션 fallback 체인을 상속하지 않습니다.

### 식별자 보존

Compaction 요약은 기본적으로 불투명 식별자를 보존합니다(`identifierPolicy: "strict"`). 비활성화하려면 `identifierPolicy: "off"`로 override하거나, 사용자 지정 지침에는 `identifierPolicy: "custom"`과 `identifierInstructions`를 함께 사용합니다.

### 활성 트랜스크립트 바이트 가드

`agents.defaults.compaction.maxActiveTranscriptBytes`가 설정되어 있으면 활성 JSONL이 해당 크기에 도달했을 때 OpenClaw는 실행 전에 일반 로컬 Compaction을 트리거합니다. 이는 provider 측 컨텍스트 관리가 모델 컨텍스트를 건강하게 유지하는 동안 로컬 트랜스크립트가 계속 커질 수 있는 장기 실행 세션에 유용합니다. 원시 JSONL 바이트를 분할하지는 않으며, 일반 Compaction 파이프라인에 의미론적 요약을 만들도록 요청합니다.

<Warning>
바이트 가드에는 `truncateAfterCompaction: true`가 필요합니다. 트랜스크립트 rotation이 없으면 활성 파일이 줄어들지 않으며 가드는 비활성 상태로 유지됩니다.
</Warning>

### 후속 트랜스크립트

`agents.defaults.compaction.truncateAfterCompaction`이 활성화되면 OpenClaw는 기존 트랜스크립트를 제자리에서 다시 쓰지 않습니다. Compaction 요약, 보존된 상태, 요약되지 않은 꼬리 부분으로 새 활성 후속 트랜스크립트를 만든 뒤, 이전 JSONL은 보관된 체크포인트 소스로 유지합니다.
후속 트랜스크립트는 짧은 재시도 창 안에 들어오는 정확히 중복된 긴 사용자 턴도 제거하므로, 채널 재시도 폭주가 Compaction 후 다음 활성 트랜스크립트로 이어지지 않습니다.

Compaction 전 체크포인트는 OpenClaw의 체크포인트 크기 상한보다 작게 유지되는 동안에만 보존됩니다. 크기가 초과된 활성 트랜스크립트도 여전히 Compaction되지만, OpenClaw는 디스크 사용량을 두 배로 늘리는 대신 큰 디버그 스냅샷을 건너뜁니다.

### Compaction 알림

기본적으로 Compaction은 조용히 실행됩니다. Compaction이 시작되고 완료될 때 간단한 상태 메시지를 표시하려면 `notifyUser`를 설정합니다.

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

### 메모리 플러시

Compaction 전에 OpenClaw는 내구성 있는 메모를 디스크에 저장하기 위해 **silent memory flush** 턴을 실행할 수 있습니다. 이 정리용 턴이 활성 대화 모델 대신 로컬 모델을 사용해야 하는 경우 `agents.defaults.compaction.memoryFlush.model`을 설정합니다.

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

memory-flush 모델 override는 정확하며 활성 세션 fallback 체인을 상속하지 않습니다. 자세한 내용과 구성은 [메모리](/ko/concepts/memory)를 참조하세요.

## 플러그형 Compaction provider

Plugin은 plugin API의 `registerCompactionProvider()`를 통해 사용자 지정 Compaction provider를 등록할 수 있습니다. provider가 등록되고 구성되면 OpenClaw는 내장 LLM 파이프라인 대신 해당 provider에 요약을 위임합니다.

등록된 provider를 사용하려면 구성에서 해당 id를 설정합니다.

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

`provider`를 설정하면 자동으로 `mode: "safeguard"`가 강제됩니다. provider는 내장 경로와 동일한 Compaction 지침 및 식별자 보존 정책을 받으며, OpenClaw는 provider 출력 이후에도 최근 턴과 split-turn suffix 컨텍스트를 계속 보존합니다.

<Note>
provider가 실패하거나 빈 결과를 반환하면 OpenClaw는 내장 LLM 요약으로 fallback합니다.
</Note>

## Compaction과 pruning 비교

|                  | Compaction                    | Pruning                          |
| ---------------- | ----------------------------- | -------------------------------- |
| **수행 작업** | 이전 대화를 요약함 | 오래된 도구 결과를 잘라냄           |
| **저장 여부**       | 예(세션 트랜스크립트에 저장)   | 아니요(요청별 메모리 내에서만) |
| **범위**        | 전체 대화           | 도구 결과만                |

[세션 pruning](/ko/concepts/session-pruning)은 요약 없이 도구 출력을 잘라내는 더 가벼운 보완 기능입니다.

## 문제 해결

**Compaction이 너무 자주 발생하나요?** 모델의 컨텍스트 창이 작거나 도구 출력이 클 수 있습니다. [세션 pruning](/ko/concepts/session-pruning)을 활성화해 보세요.

**Compaction 후 컨텍스트가 오래된 것처럼 느껴지나요?** `/compact Focus on <topic>`을 사용해 요약을 안내하거나 [memory flush](/ko/concepts/memory)를 활성화해 메모가 유지되도록 하세요.

**새로 시작해야 하나요?** `/new`는 Compaction 없이 새 세션을 시작합니다.

고급 구성(reserve tokens, 식별자 보존, 사용자 지정 컨텍스트 엔진, OpenAI 서버 측 Compaction)은 [세션 관리 심층 가이드](/ko/reference/session-management-compaction)를 참조하세요.

## 관련 항목

- [세션](/ko/concepts/session): 세션 관리 및 수명 주기.
- [세션 pruning](/ko/concepts/session-pruning): 도구 결과 잘라내기.
- [컨텍스트](/ko/concepts/context): agent 턴을 위한 컨텍스트가 구성되는 방식.
- [Hooks](/ko/automation/hooks): Compaction 수명 주기 hook(`before_compaction`, `after_compaction`).
