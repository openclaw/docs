---
read_when:
    - 워크플로 내에 JSON만 출력하는 LLM 단계를 사용하려는 경우
    - 자동화를 위해 스키마로 검증된 LLM 출력이 필요함
summary: 워크플로용 JSON 전용 LLM 작업(선택적 Plugin 도구)
title: LLM 작업
x-i18n:
    generated_at: "2026-07-12T01:15:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 78ea533f43546fbdd66c7f7138b8dea0b12b02d38925689324b390a12d0c4c5a
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task`는 단일 JSON 전용 LLM 호출을 실행하고 구조화된 출력을 반환하는 번들 **선택적 Plugin 도구**이며, 선택적으로 JSON Schema에 따라 유효성을 검사할 수 있습니다. Lobster 같은 워크플로 엔진에서 워크플로마다 사용자 지정 OpenClaw 코드를 작성하지 않고도 LLM 단계를 사용할 수 있게 해줍니다.

## 활성화

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

2. 도구를 허용합니다.

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

`alsoAllow`는 다른 핵심 도구를 제한하지 않고 활성 도구 프로필에 `llm-task`를 추가합니다. 대신 제한적인 허용 목록 모드를 사용하려는 경우에만 `tools.allow`를 사용하세요.

## 구성(선택 사항)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai",
          "defaultModel": "gpt-5.6-sol",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.6-sol"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels`는 `provider/model` 문자열의 허용 목록이며, 그 밖의 모델에 대한 요청은 거부됩니다. 다른 모든 키는 도구 호출에서 해당 매개변수를 생략할 때 사용되는 호출별 대체값입니다.

## 도구 매개변수

| 매개변수        | 유형   | 참고                                                                                                                                                        |
| --------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prompt`        | string | 필수. LLM에 대한 작업 지침입니다.                                                                                                                           |
| `input`         | any    | 선택적 페이로드입니다. JSON으로 직렬화되어 프롬프트에 추가됩니다.                                                                                           |
| `schema`        | object | 파싱된 출력이 준수해야 하는 선택적 JSON Schema입니다.                                                                                                       |
| `provider`      | string | `defaultProvider` / 에이전트의 기본 제공자를 재정의합니다.                                                                                                  |
| `model`         | string | `defaultModel`을 재정의합니다. 단순 모델 ID, 별칭 또는 `provider/model` 참조를 허용합니다(중복된 제공자 접두사는 자동으로 제거됩니다).                       |
| `thinking`      | string | 추론 수준입니다(예: `low`, `medium`). 결정된 모델이 지원하는 값 중 하나여야 합니다.                                                                         |
| `authProfileId` | string | `defaultAuthProfileId`를 재정의합니다.                                                                                                                      |
| `temperature`   | number | 가능한 범위에서 적용됩니다. 모든 제공자가 이를 준수하는 것은 아닙니다.                                                                                      |
| `maxTokens`     | number | 가능한 범위에서 적용되는 출력 토큰 상한입니다.                                                                                                              |
| `timeoutMs`     | number | 실행 시간 제한입니다. 기본값은 `30000`입니다.                                                                                                               |

## 출력

`details.json`(파싱되고 스키마 유효성 검사를 통과한 JSON)을 반환하며, 실제로 실행된 제공자와 모델을 나타내는 `details.provider` 및 `details.model`도 함께 반환합니다.

## 예시: Lobster 워크플로 단계

### 중요 제한 사항

아래 예시는 **독립 실행형 Lobster CLI**가 `openclaw.invoke`에 올바른 Gateway URL/인증 컨텍스트가 이미 설정된 환경에서 실행되고 있다고 가정합니다.

OpenClaw 내부의 번들 **임베디드** Lobster 실행기에서는 다음과 같은 중첩 CLI 패턴이 **현재 안정적으로 작동하지 않습니다**.

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

임베디드 Lobster에서 이 흐름을 지원하는 브리지가 제공될 때까지 다음 중 하나를 권장합니다.

- Lobster 외부에서 직접 `llm-task` 도구 호출 사용
- 중첩된 `openclaw.invoke` 호출에 의존하지 않는 Lobster 단계 사용

독립 실행형 Lobster CLI 예시:

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

- **JSON 전용**: 모델은 코드 펜스나 설명 없이 JSON 값만 반환하도록 지시받습니다.
- **도구 없음**: 기반 실행에서는 도구가 비활성화되므로 모델이 작업 도중 외부 호출을 수행할 수 없습니다.
- `schema`를 사용해 유효성을 검사하지 않는 한 출력을 신뢰할 수 없는 것으로 취급하세요.
- 이 출력을 사용하는 부수 효과가 있는 단계(전송, 게시, 실행) 앞에는 승인 절차를 배치하세요.

## 관련 항목

- [추론 수준](/ko/tools/thinking)
- [하위 에이전트](/ko/tools/subagents)
- [슬래시 명령어](/ko/tools/slash-commands)
