---
read_when:
    - 워크플로 내에서 JSON 전용 LLM 단계를 사용하려는 경우
    - 자동화를 위해 스키마 검증된 LLM 출력이 필요합니다
summary: 워크플로용 JSON 전용 LLM 작업(선택적 Plugin 도구)
title: LLM 작업
x-i18n:
    generated_at: "2026-05-04T02:25:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cdc5d4feef17fb6d6d90d819d4c92d26a4ec43e4f5364c6acbaad1934a89269
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task`는 JSON 전용 LLM 작업을 실행하고 구조화된 출력(선택적으로 JSON Schema에 대해 검증됨)을 반환하는 **선택적 Plugin 도구**입니다.

Lobster와 같은 워크플로 엔진에 적합합니다. 각 워크플로마다 사용자 지정 OpenClaw 코드를 작성하지 않고도 단일 LLM 단계를 추가할 수 있습니다.

## Plugin 활성화

1. Plugin을 활성화합니다.

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. 선택적 도구를 허용합니다.

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

제한적 허용 목록 모드를 사용하려는 경우에만 `tools.allow`를 사용하세요.

## 구성(선택 사항)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.4"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels`는 `provider/model` 문자열의 허용 목록입니다. 설정하면 목록 밖의 모든 요청이 거부됩니다.

## 도구 매개변수

- `prompt`(문자열, 필수)
- `input`(모든 값, 선택 사항)
- `schema`(객체, 선택적 JSON Schema)
- `provider`(문자열, 선택 사항)
- `model`(문자열, 선택 사항)
- `thinking`(문자열, 선택 사항)
- `authProfileId`(문자열, 선택 사항)
- `temperature`(숫자, 선택 사항)
- `maxTokens`(숫자, 선택 사항)
- `timeoutMs`(숫자, 선택 사항)

`thinking`은 `low` 또는 `medium` 같은 표준 OpenClaw 추론 프리셋을 허용합니다.

## 출력

파싱된 JSON이 포함된 `details.json`을 반환합니다(`schema`가 제공된 경우 이에 대해 검증함).

## 예: Lobster 워크플로 단계

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": {
    "subject": "Hello",
    "body": "Can you help?"
  },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

## 안전 참고 사항

- 이 도구는 **JSON 전용**이며 모델에 JSON만 출력하도록 지시합니다(코드 펜스나 설명 없음).
- 이 실행에서는 모델에 어떤 도구도 노출되지 않습니다.
- `schema`로 검증하지 않는 한 출력을 신뢰할 수 없는 것으로 취급하세요.
- 부작용이 있는 단계(전송, 게시, 실행) 앞에는 승인을 배치하세요.

## 관련 항목

- [사고 수준](/ko/tools/thinking)
- [하위 에이전트](/ko/tools/subagents)
- [슬래시 명령](/ko/tools/slash-commands)
