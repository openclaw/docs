---
read_when:
    - 자동 Compaction과 /compact를 이해하고 싶습니다
    - 컨텍스트 제한에 도달하는 장시간 세션을 디버깅하고 있습니다
summary: 모델 한도 내에서 작동하도록 OpenClaw가 긴 대화를 요약하는 방법
title: Compaction
x-i18n:
    generated_at: "2026-07-12T15:06:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: f00fb0cf59184ef450f1fc4d39a21a40ee4e8327d872766bca7f3642c0145514
    source_path: concepts/compaction.md
    workflow: 16
---

모든 모델에는 처리할 수 있는 최대 토큰 수인 컨텍스트 창이 있습니다. 대화가 해당 한도에 가까워지면 OpenClaw는 채팅을 계속할 수 있도록 이전 메시지를 요약으로 **압축**합니다.

## 작동 방식

1. 이전 대화 턴을 간결한 항목으로 요약합니다.
2. 요약을 세션 트랜스크립트에 저장합니다.
3. 최근 메시지는 그대로 유지합니다.

OpenClaw는 압축 분할 지점을 선택할 때 어시스턴트 도구 호출과 이에 대응하는 `toolResult` 항목을 한 쌍으로 유지합니다. 지점이 도구 블록 내부에 위치하면 OpenClaw는 쌍이 함께 유지되고 현재 요약되지 않은 뒷부분이 보존되도록 경계를 이동합니다.

전체 대화 기록은 디스크에 그대로 남습니다. 압축은 다음 턴에 모델이 보는 내용만 변경합니다.

<Note>
새 구성에서는 `agents.defaults.compaction.mode`의 기본값이 `"safeguard"`입니다(더 엄격한 가드레일, 요약 품질 감사). 사용하지 않으려면 `mode: "default"`를 명시적으로 설정하십시오.
</Note>

## 자동 압축

자동 압축은 기본적으로 활성화되어 있습니다. 세션이 컨텍스트 한도에 가까워지거나 모델이 컨텍스트 오버플로 오류를 반환할 때 실행됩니다. 후자의 경우 OpenClaw가 압축한 후 다시 시도합니다.

다음과 같이 표시됩니다.

- 일반 Gateway 로그의 `embedded run auto-compaction start` / `complete`.
- 상세 모드의 `🧹 Auto-compaction complete`.
- `/status`에 표시되는 `🧹 Compactions: <count>`.

<Info>
압축하기 전에 OpenClaw는 중요한 메모를 [메모리](/ko/concepts/memory) 파일에 저장하도록 에이전트에게 자동으로 알립니다. 이를 통해 컨텍스트 손실을 방지합니다.
</Info>

<AccordionGroup>
  <Accordion title="OpenClaw가 인식하는 오버플로 오류 패턴">
    OpenClaw는 수십 가지 공급자별 오버플로 오류 문자열(Anthropic, OpenAI, Bedrock, Gemini, Ollama, OpenRouter 등)을 일치시킵니다. 일반적인 예는 다음과 같습니다.

    - `request_too_large`
    - `context length exceeded`
    - `input exceeds the maximum number of tokens`
    - `input token count exceeds the maximum number of input tokens` (Bedrock)
    - `input is too long for the model`
    - `ollama error: context length exceeded`

  </Accordion>
</AccordionGroup>

## 수동 압축

어떤 채팅에서든 `/compact`를 입력하여 압축을 강제로 실행할 수 있습니다. 요약의 방향을 지정하려면 지침을 추가하십시오.

```text
/compact API 설계 결정에 집중하십시오
```

`agents.defaults.compaction.keepRecentTokens`가 설정되어 있으면(기본값: 20,000) 수동 압축은 해당 절단 지점을 따르며 재구성된 컨텍스트에 최근 뒷부분을 유지합니다. 명시적인 유지 예산이 없으면 수동 압축은 강제 체크포인트처럼 동작하며 새 요약만으로 계속 진행합니다.

## 구성

`openclaw.json`의 `agents.defaults.compaction`에서 압축을 구성하십시오. 가장 일반적인 설정은 아래에 나와 있으며, 전체 참조는 [세션 관리 심층 분석](/ko/reference/session-management-compaction)을 참조하십시오.

### 다른 모델 사용

기본적으로 압축에는 에이전트의 기본 모델이 사용됩니다. 더 유능하거나 전문화된 모델에 요약을 위임하려면 `agents.defaults.compaction.model`을 설정하십시오. 재정의 값으로 `provider/model-id` 문자열이나 `agents.defaults.models`에 구성된 단순 별칭을 사용할 수 있습니다.

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

구성된 단순 별칭은 압축이 시작되기 전에 정규 공급자 및 모델로 해석됩니다. 단순 값이 별칭과 구성된 리터럴 모델 ID 모두에 일치하면 리터럴 모델 ID가 우선합니다. 일치하지 않는 단순 값은 활성 공급자의 모델 ID로 유지됩니다.

로컬 모델에서도 사용할 수 있습니다. 예를 들어 요약 전용으로 두 번째 Ollama 모델을 사용할 수 있습니다.

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

설정하지 않으면 활성 세션 모델로 압축을 시작합니다. 모델 폴백이 허용되는 공급자 오류로 요약에 실패하면 OpenClaw는 세션의 기존 모델 폴백 체인을 통해 해당 압축 시도를 다시 수행합니다. 폴백 선택은 일시적이며 세션 상태에 다시 기록되지 않습니다. 명시적인 `agents.defaults.compaction.model` 재정의는 지정된 값을 정확히 사용하며 세션 폴백 체인을 상속하지 않습니다.

### 식별자 보존

압축 요약은 기본적으로 불투명 식별자를 보존합니다(`identifierPolicy: "strict"`). 비활성화하려면 `identifierPolicy: "off"`로 재정의하고, 사용자 지정 지침을 사용하려면 `identifierPolicy: "custom"`과 `identifierInstructions`를 함께 설정하십시오.

### 활성 트랜스크립트 바이트 보호 한도

`agents.defaults.compaction.maxActiveTranscriptBytes`가 설정된 경우 트랜스크립트 기록이
해당 크기에 도달하면 OpenClaw가 실행 전에 일반 로컬 압축을
트리거합니다. 이는 공급자 측 컨텍스트 관리로 모델 컨텍스트는 정상적으로
유지되는 동안 영구 저장된 트랜스크립트 기록이 계속 증가하는 장기 실행
세션에 유용합니다. 원시 바이트를 분할하지 않고 일반 압축
파이프라인에 의미론적 요약을 생성하도록 요청합니다.

<Warning>
바이트 보호 한도는 활성 SQLite 트랜스크립트 기록에 적용됩니다. 레거시 JSONL
체크포인트 아티팩트는 활성 압축 대상이 아닙니다.
</Warning>

### 후속 트랜스크립트

`agents.defaults.compaction.truncateAfterCompaction`이 활성화되면 OpenClaw는 기존 트랜스크립트를 그 자리에서 다시 작성하지 않습니다. 압축 요약, 보존된 상태, 요약되지 않은 뒷부분으로 새로운 활성 후속 트랜스크립트를 생성한 다음, 분기/복원 흐름이 해당 압축된 후속 트랜스크립트를 가리키도록 체크포인트 메타데이터를 기록합니다.
후속 트랜스크립트는 짧은 재시도 시간 범위 내에 도착하는 완전히 동일한 긴 사용자 턴도
제거하므로, 채널 재시도 폭주가 압축 후 다음 활성 트랜스크립트로
이어지지 않습니다.

OpenClaw는 새 압축에 대해 더 이상 별도의 `.checkpoint.*.jsonl` 사본을
작성하지 않습니다. 기존 레거시 체크포인트 파일은 참조되는 동안 계속 사용할 수
있으며 일반 세션 정리 과정에서 제거됩니다.

### 압축 알림

기본적으로 압축은 알림 없이 실행됩니다. 압축이 시작되고 완료될 때 간단한 상태 메시지를 표시하고, 압축 전 메모리 플러시가 모두 소진되었지만 응답은 계속되는 경우 성능 저하 알림을 표시하려면 `notifyUser`를 설정하십시오.

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

압축 전에 OpenClaw는 영구 메모를 디스크에 저장하기 위해 **자동 메모리 플러시** 턴을 실행할 수 있습니다. 이 정리 턴에서 활성 대화 모델 대신 로컬 모델을 사용해야 하는 경우 `agents.defaults.compaction.memoryFlush.model`을 설정하십시오.

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

메모리 플러시 모델 재정의는 지정된 값을 정확히 사용하며 활성 세션 폴백 체인을 상속하지 않습니다. 자세한 내용과 구성은 [메모리](/ko/concepts/memory)를 참조하십시오.

## 교체 가능한 압축 공급자

Plugin은 Plugin API의 `registerCompactionProvider()`를 통해 사용자 지정 압축 공급자를 등록할 수 있습니다. 공급자가 등록되고 구성되면 OpenClaw는 기본 제공 LLM 파이프라인 대신 해당 공급자에 요약을 위임합니다.

등록된 공급자를 사용하려면 구성에서 해당 ID를 설정하십시오.

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

`provider`를 설정하면 자동으로 `mode: "safeguard"`가 강제 적용됩니다. 공급자는 기본 제공 경로와 동일한 압축 지침 및 식별자 보존 정책을 받으며, OpenClaw는 공급자 출력 이후에도 최근 턴 및 분할된 턴의 접미 컨텍스트를 계속 보존합니다.

<Note>
공급자가 실패하거나 빈 결과를 반환하면 OpenClaw는 기본 제공 LLM 요약으로 폴백합니다.
</Note>

## 압축과 가지치기 비교

|                  | 압축                          | 가지치기                           |
| ---------------- | ----------------------------- | ---------------------------------- |
| **수행 작업**    | 이전 대화를 요약합니다       | 이전 도구 결과를 잘라냅니다        |
| **저장 여부**    | 예(세션 트랜스크립트에 저장) | 아니요(요청별로 메모리에만 유지)   |
| **범위**         | 전체 대화                     | 도구 결과만                        |

[세션 가지치기](/ko/concepts/session-pruning)는 요약하지 않고 도구 출력을 잘라내는 더 가벼운 보완 기능입니다.

## 문제 해결

**너무 자주 압축됩니까?** 모델의 컨텍스트 창이 작거나 도구 출력이 클 수 있습니다. [세션 가지치기](/ko/concepts/session-pruning)를 활성화해 보십시오.

**압축 후 컨텍스트가 오래된 것처럼 느껴집니까?** `/compact Focus on <topic>`을 사용하여 요약의 방향을 지정하거나 [메모리 플러시](/ko/concepts/memory)를 활성화하여 메모가 유지되도록 하십시오.

**처음부터 다시 시작해야 합니까?** `/new`는 압축하지 않고 새 세션을 시작합니다.

고급 구성(예약 토큰, 식별자 보존, 사용자 지정 컨텍스트 엔진, OpenAI 서버 측 압축)은 [세션 관리 심층 분석](/ko/reference/session-management-compaction)을 참조하십시오.

## 관련 항목

- [세션](/ko/concepts/session): 세션 관리 및 수명 주기.
- [세션 가지치기](/ko/concepts/session-pruning): 도구 결과 잘라내기.
- [컨텍스트](/ko/concepts/context): 에이전트 턴의 컨텍스트 구성 방식.
- [훅](/ko/automation/hooks): 압축 수명 주기 훅(`before_compaction`, `after_compaction`).
