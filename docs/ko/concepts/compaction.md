---
read_when:
    - 자동 Compaction과 /compact를 이해하려고 합니다
    - 컨텍스트 한도에 도달하는 긴 세션을 디버깅하고 있습니다
summary: OpenClaw가 모델 한도 내에서 유지하기 위해 긴 대화를 요약하는 방식
title: Compaction
x-i18n:
    generated_at: "2026-04-25T05:59:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e396a59d5346355cf2d87cd08ca8550877b103b1c613670fb3908fe1b028170
    source_path: concepts/compaction.md
    workflow: 15
---

모든 모델에는 처리할 수 있는 최대 토큰 수인 컨텍스트 창이 있습니다.
대화가 이 한도에 가까워지면 OpenClaw는 이전 메시지를 요약으로 **Compaction**하여
채팅을 계속할 수 있게 합니다.

## 작동 방식

1. 이전 대화 턴이 압축 항목으로 요약됩니다.
2. 요약은 세션 전사에 저장됩니다.
3. 최근 메시지는 그대로 유지됩니다.

OpenClaw가 기록을 Compaction 청크로 분할할 때는, assistant 도구 호출과
해당하는 `toolResult` 항목을 함께 유지합니다. 분할 지점이
도구 블록 내부에 걸리면 OpenClaw는 그 쌍이 함께 남고
현재 요약되지 않은 tail이 보존되도록 경계를 이동합니다.

전체 대화 기록은 디스크에 유지됩니다. Compaction은 다음 턴에서
모델이 보는 내용만 바꿉니다.

## 자동 Compaction

자동 Compaction은 기본적으로 켜져 있습니다. 세션이 컨텍스트
한도에 가까워질 때 실행되며, 모델이 컨텍스트 초과 오류를 반환하는 경우에도
실행됩니다(이 경우 OpenClaw는 Compaction한 뒤 재시도합니다). 일반적인 초과 시그니처에는
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model`, `ollama error: context length
exceeded`가 포함됩니다.

<Info>
Compaction 전에 OpenClaw는 중요한 메모를 [메모리](/ko/concepts/memory) 파일에 저장하라고
에이전트에 자동으로 상기시킵니다. 이렇게 하면 컨텍스트 손실을 방지할 수 있습니다.
</Info>

`openclaw.json`의 `agents.defaults.compaction` 설정을 사용해 Compaction 동작(모드, 대상 토큰 수 등)을 구성하세요.
Compaction 요약은 기본적으로 불투명 식별자를 보존합니다(`identifierPolicy: "strict"`). 이를 `identifierPolicy: "off"`로 재정의하거나, `identifierPolicy: "custom"`과 `identifierInstructions`를 사용해 사용자 지정 텍스트를 제공할 수 있습니다.

선택적으로 `agents.defaults.compaction.model`을 통해 Compaction 요약에 다른 모델을 지정할 수 있습니다. 기본 모델이 로컬 모델이거나 소형 모델이고, 더 성능 좋은 모델로 Compaction 요약을 생성하고 싶을 때 유용합니다. 이 재정의는 모든 `provider/model-id` 문자열을 허용합니다:

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

이 설정은 로컬 모델과도 함께 사용할 수 있습니다. 예를 들어 요약 전용의 두 번째 Ollama 모델이나 미세 조정된 Compaction 특화 모델을 사용할 수 있습니다:

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

설정하지 않으면 Compaction은 에이전트의 기본 모델을 사용합니다.

## 플러그형 Compaction 공급자

Plugin은 Plugin API의 `registerCompactionProvider()`를 통해 사용자 지정 Compaction 공급자를 등록할 수 있습니다. 공급자가 등록되고 구성되면 OpenClaw는 내장 LLM 파이프라인 대신 해당 공급자에 요약을 위임합니다.

등록된 공급자를 사용하려면 구성에서 공급자 id를 설정하세요:

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

`provider`를 설정하면 자동으로 `mode: "safeguard"`가 강제됩니다. 공급자는 내장 경로와 동일한 Compaction 지침 및 식별자 보존 정책을 받으며, OpenClaw는 공급자 출력 후에도 최근 턴 및 분할 턴의 suffix 컨텍스트를 계속 보존합니다. 공급자가 실패하거나 빈 결과를 반환하면, OpenClaw는 내장 LLM 요약으로 되돌아갑니다.

## 자동 Compaction(기본적으로 켜짐)

세션이 모델의 컨텍스트 창에 가까워지거나 이를 초과하면, OpenClaw는 자동 Compaction을 실행하고 압축된 컨텍스트를 사용해 원래 요청을 재시도할 수 있습니다.

다음과 같이 표시됩니다:

- 상세 모드에서 `🧹 Auto-compaction complete`
- `/status`에서 `🧹 Compactions: <count>`

Compaction 전에 OpenClaw는 **자동 메모리 플러시** 턴을 실행하여
지속되어야 하는 메모를 디스크에 저장할 수 있습니다. 자세한 내용과 구성은
[메모리](/ko/concepts/memory)를 참고하세요.

## 수동 Compaction

어떤 채팅에서든 `/compact`를 입력하면 Compaction을 강제로 실행할 수 있습니다. 요약을
유도하려면 지침을 덧붙이세요:

```
/compact API 설계 결정에 집중
```

`agents.defaults.compaction.keepRecentTokens`가 설정되어 있으면, 수동 Compaction은
해당 Pi 컷 포인트를 따르고 최근 tail을 재구성된 컨텍스트에 유지합니다. 명시적인 유지 예산이 없으면 수동 Compaction은 하드 체크포인트처럼 동작하며 새 요약만으로 계속 진행합니다.

## 다른 모델 사용

기본적으로 Compaction은 에이전트의 기본 모델을 사용합니다. 더 나은 요약을 위해
더 성능 좋은 모델을 사용할 수 있습니다:

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## Compaction 알림

기본적으로 Compaction은 조용히 실행됩니다. Compaction이
시작될 때와 완료될 때 짧은 알림을 표시하려면 `notifyUser`를 활성화하세요:

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

활성화하면 사용자는 각 Compaction 실행 전후에 짧은 상태 메시지
(예: "컨텍스트 Compaction 중..." 및 "Compaction 완료")를 보게 됩니다.

## Compaction과 pruning 비교

|                  | Compaction                    | pruning                         |
| ---------------- | ----------------------------- | -------------------------------- |
| **역할**         | 이전 대화를 요약함            | 오래된 도구 결과를 잘라냄        |
| **저장 여부**    | 예(세션 전사에 저장)          | 아니요(메모리 내에서만, 요청별)  |
| **범위**         | 전체 대화                     | 도구 결과만                      |

[세션 pruning](/ko/concepts/session-pruning)은
요약 없이 도구 출력을 줄이는 더 가벼운 보완 기능입니다.

## 문제 해결

**Compaction이 너무 자주 발생하나요?** 모델의 컨텍스트 창이 작거나, 도구
출력이 클 수 있습니다.
[세션 pruning](/ko/concepts/session-pruning)을 활성화해 보세요.

**Compaction 후 컨텍스트가 오래된 느낌인가요?** `/compact <주제>에 집중`을 사용해
요약을 유도하거나, 메모가 유지되도록 [메모리 플러시](/ko/concepts/memory)를
활성화하세요.

**완전히 새로 시작해야 하나요?** `/new`는 Compaction 없이 새 세션을 시작합니다.

고급 구성(예약 토큰, 식별자 보존, 사용자 지정
컨텍스트 엔진, OpenAI 서버 측 Compaction)은
[세션 관리 심화 가이드](/ko/reference/session-management-compaction)를 참고하세요.

## 관련 문서

- [세션](/ko/concepts/session) — 세션 관리 및 수명 주기
- [세션 Pruning](/ko/concepts/session-pruning) — 도구 결과 잘라내기
- [컨텍스트](/ko/concepts/context) — 에이전트 턴을 위한 컨텍스트 구성 방식
- [훅](/ko/automation/hooks) — Compaction 수명 주기 훅(before_compaction, after_compaction)
