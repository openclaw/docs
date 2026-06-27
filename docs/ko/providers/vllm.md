---
read_when:
    - 로컬 vLLM 서버에서 OpenClaw를 실행하려는 경우
    - 자체 모델로 OpenAI 호환 /v1 엔드포인트를 사용하려는 경우
summary: vLLM으로 OpenClaw 실행하기(OpenAI 호환 로컬 서버)
title: vLLM
x-i18n:
    generated_at: "2026-06-27T18:04:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3a5da5ce359bf62c44cddd0c97d2852d98c996ad6d44552a68d4aeb4d1d2893
    source_path: providers/vllm.md
    workflow: 16
---

vLLM은 **OpenAI 호환** HTTP API를 통해 오픈 소스 및 일부 사용자 지정 모델을 제공할 수 있습니다. OpenClaw는 `openai-completions` API를 사용해 vLLM에 연결합니다.

또한 `VLLM_API_KEY`로 옵트인하면 OpenClaw가 vLLM에서 사용 가능한 모델을 **자동 검색**할 수 있습니다(서버가 인증을 강제하지 않는 경우 어떤 값이든 작동합니다). 사용자 지정 vLLM 기본 URL도 구성하는 경우 `agents.defaults.models`에서 `vllm/*`를 사용하여 검색을 동적으로 유지하세요.

OpenClaw는 `vllm`을 스트리밍 사용량 집계를 지원하는 로컬 OpenAI 호환 제공자로 취급하므로, 상태/컨텍스트 토큰 수가 `stream_options.include_usage` 응답에서 업데이트될 수 있습니다.

| 속성             | 값                                       |
| ---------------- | ---------------------------------------- |
| 제공자 ID        | `vllm`                                   |
| API              | `openai-completions` (OpenAI 호환)       |
| 인증             | `VLLM_API_KEY` 환경 변수                 |
| 기본 기준 URL    | `http://127.0.0.1:8000/v1`               |

## 시작하기

<Steps>
  <Step title="OpenAI 호환 서버로 vLLM 시작">
    기준 URL은 `/v1` 엔드포인트(예: `/v1/models`, `/v1/chat/completions`)를 노출해야 합니다. vLLM은 일반적으로 다음에서 실행됩니다.

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="API 키 환경 변수 설정">
    서버가 인증을 강제하지 않는 경우 어떤 값이든 작동합니다.

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="모델 선택">
    vLLM 모델 ID 중 하나로 바꾸세요.

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="모델 사용 가능 여부 확인">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## 모델 검색(암시적 제공자)

`VLLM_API_KEY`가 설정되어 있거나 인증 프로필이 존재하고, `models.providers.vllm`을 정의하지 **않은** 경우 OpenClaw는 다음을 쿼리합니다.

```
GET http://127.0.0.1:8000/v1/models
```

그리고 반환된 ID를 모델 항목으로 변환합니다.

<Note>
`models.providers.vllm`을 명시적으로 설정하면 OpenClaw는 기본적으로 선언된 모델을 사용합니다. OpenClaw가 구성된 제공자의 `/models` 엔드포인트를 쿼리하고 광고된 모든 vLLM 모델을 포함하도록 하려면 `agents.defaults.models`에 `"vllm/*": {}`를 추가하세요.
</Note>

## 명시적 구성(수동 모델)

다음과 같은 경우 명시적 구성을 사용하세요.

- vLLM이 다른 호스트 또는 포트에서 실행되는 경우
- `contextWindow` 또는 `maxTokens` 값을 고정하려는 경우
- 서버에 실제 API 키가 필요한 경우(또는 헤더를 제어하려는 경우)
- 신뢰할 수 있는 loopback, LAN 또는 Tailscale vLLM 엔드포인트에 연결하는 경우

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        timeoutSeconds: 300, // Optional: extend connect/header/body/request timeout for slow local models
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

모든 모델을 수동으로 나열하지 않고 이 제공자를 동적으로 유지하려면 표시되는 모델 카탈로그에 제공자 와일드카드를 추가하세요.

```json5
{
  agents: {
    defaults: {
      models: {
        "vllm/*": {},
      },
    },
  },
}
```

## 고급 구성

<AccordionGroup>
  <Accordion title="프록시 스타일 동작">
    vLLM은 기본 OpenAI 엔드포인트가 아니라 프록시 스타일의 OpenAI 호환 `/v1` 백엔드로 취급됩니다. 이는 다음을 의미합니다.

    | 동작 | 적용 여부 |
    |----------|----------|
    | 기본 OpenAI 요청 형태 조정 | 아니요 |
    | `service_tier` | 전송되지 않음 |
    | Responses `store` | 전송되지 않음 |
    | 프롬프트 캐시 힌트 | 전송되지 않음 |
    | OpenAI 추론 호환 페이로드 형태 조정 | 적용되지 않음 |
    | 숨겨진 OpenClaw 귀속 헤더 | 사용자 지정 기준 URL에 주입되지 않음 |

  </Accordion>

  <Accordion title="Qwen thinking 제어">
    vLLM을 통해 제공되는 Qwen 모델의 경우 서버가 Qwen 채팅 템플릿 kwargs를 예상할 때 구성된 제공자 모델 행에 `compat.thinkingFormat: "qwen-chat-template"`을 설정하세요. 이렇게 구성된 모델은 Qwen 템플릿 thinking이 OpenAI 스타일 노력 단계가 아니라 켜기/끄기 요청 플래그이기 때문에 바이너리 `/think` 프로필(`off`, `on`)을 노출합니다.

    ```json5
    {
      models: {
        providers: {
          vllm: {
            models: [
              {
                id: "Qwen/Qwen3-8B",
                name: "Qwen3 8B",
                reasoning: true,
                compat: { thinkingFormat: "qwen-chat-template" },
              },
            ],
          },
        },
      },
    }
    ```

    OpenClaw는 `/think off`를 다음으로 매핑합니다.

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    `off`가 아닌 thinking 수준은 `enable_thinking: true`를 전송합니다. 엔드포인트가 대신 DashScope 스타일의 최상위 플래그를 예상하는 경우 `compat.thinkingFormat: "qwen"`을 사용해 요청 루트에 `enable_thinking`을 전송하세요.

  </Accordion>

  <Accordion title="Nemotron 3 thinking 제어">
    vLLM/Nemotron 3는 추론이 숨겨진 추론으로 반환될지 표시되는 답변 텍스트로 반환될지 제어하기 위해 채팅 템플릿 kwargs를 사용할 수 있습니다. OpenClaw 세션이 thinking off 상태로 `vllm/nemotron-3-*`를 사용할 때, 번들 vLLM Plugin은 다음을 전송합니다.

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    이 값을 사용자 지정하려면 모델 params 아래에 `chat_template_kwargs`를 설정하세요. `params.extra_body.chat_template_kwargs`도 설정한 경우, `extra_body`가 마지막 요청 본문 override이므로 해당 값이 최종 우선순위를 갖습니다.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/nemotron-3-super": {
              params: {
                chat_template_kwargs: {
                  enable_thinking: false,
                  force_nonempty_content: true,
                },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Qwen 도구 호출이 텍스트로 표시됨">
    먼저 vLLM이 해당 모델에 맞는 올바른 도구 호출 파서와 채팅 템플릿으로 시작되었는지 확인하세요. 예를 들어 vLLM은 Qwen2.5 모델에는 `hermes`, Qwen3-Coder 모델에는 `qwen3_xml`을 문서화합니다.

    증상:

    - Skills 또는 도구가 실행되지 않음
    - 어시스턴트가 `{"name":"read","arguments":...}` 같은 원시 JSON/XML을 출력함
    - OpenClaw가 `tool_choice: "auto"`를 전송할 때 vLLM이 빈 `tool_calls` 배열을 반환함

    일부 Qwen/vLLM 조합은 요청이 `tool_choice: "required"`를 사용할 때만 구조화된 도구 호출을 반환합니다. 해당 모델 항목의 경우 `params.extra_body`로 OpenAI 호환 요청 필드를 강제하세요.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/Qwen-Qwen2.5-Coder-32B-Instruct": {
              params: {
                extra_body: {
                  tool_choice: "required",
                },
              },
            },
          },
        },
      },
    }
    ```

    `Qwen-Qwen2.5-Coder-32B-Instruct`를 다음에서 반환되는 정확한 ID로 바꾸세요.

    ```bash
    openclaw models list --provider vllm
    ```

    CLI에서도 동일한 override를 적용할 수 있습니다.

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    이는 옵트인 호환성 우회 방법입니다. 도구가 포함된 모든 모델 턴에서 도구 호출이 필요해지므로, 이 동작이 허용되는 전용 로컬 모델 항목에만 사용하세요. 모든 vLLM 모델에 대한 전역 기본값으로 사용하지 말고, 임의의 어시스턴트 텍스트를 실행 가능한 도구 호출로 무분별하게 변환하는 프록시를 사용하지 마세요.

  </Accordion>

  <Accordion title="사용자 지정 기준 URL">
    vLLM 서버가 기본값이 아닌 호스트 또는 포트에서 실행되는 경우 명시적 제공자 구성에서 `baseUrl`을 설정하세요.

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## 문제 해결

<AccordionGroup>
  <Accordion title="느린 첫 응답 또는 원격 서버 시간 초과">
    큰 로컬 모델, 원격 LAN 호스트 또는 tailnet 링크의 경우 제공자 범위 요청 시간 초과를 설정하세요.

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds`는 연결 설정, 응답 헤더, 본문 스트리밍, 전체 guarded-fetch 중단을 포함하여 vLLM 모델 HTTP 요청에만 적용됩니다. 전체 에이전트 실행을 제어하는 `agents.defaults.timeoutSeconds`를 늘리기 전에 이를 우선 사용하세요.

  </Accordion>

  <Accordion title="서버에 연결할 수 없음">
    vLLM 서버가 실행 중이고 접근 가능한지 확인하세요.

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    연결 오류가 표시되면 호스트, 포트, 그리고 vLLM이 OpenAI 호환 서버 모드로 시작되었는지 확인하세요.
    명시적 loopback, LAN 또는 Tailscale 엔드포인트의 경우 OpenClaw는 보호된 모델 요청에 대해 정확히 구성된 `models.providers.vllm.baseUrl` 원본을 신뢰합니다. 메타데이터/link-local 원본은 명시적 옵트인 없이는 계속 차단됩니다. vLLM 요청이 다른 비공개 원본에 도달해야 하는 경우에만 `models.providers.vllm.request.allowPrivateNetwork: true`를 설정하고, 정확한 원본 신뢰를 옵트아웃하려면 이를 `false`로 설정하세요.

  </Accordion>

  <Accordion title="요청의 인증 오류">
    요청이 인증 오류로 실패하면 서버 구성과 일치하는 실제 `VLLM_API_KEY`를 설정하거나 `models.providers.vllm` 아래에서 제공자를 명시적으로 구성하세요.

    <Tip>
    vLLM 서버가 인증을 강제하지 않는 경우 비어 있지 않은 어떤 `VLLM_API_KEY` 값이든 OpenClaw의 옵트인 신호로 작동합니다.
    </Tip>

  </Accordion>

  <Accordion title="검색된 모델 없음">
    자동 검색에는 `VLLM_API_KEY` 설정이 필요합니다. `models.providers.vllm`을 정의한 경우, `agents.defaults.models`에 `"vllm/*": {}`가 포함되어 있지 않으면 OpenClaw는 선언된 모델만 사용합니다.
  </Accordion>

  <Accordion title="도구가 원시 텍스트로 렌더링됨">
    Qwen 모델이 skill을 실행하는 대신 JSON/XML 도구 구문을 출력하는 경우 위의 고급 구성에서 Qwen 지침을 확인하세요. 일반적인 해결 방법은 다음과 같습니다.

    - 해당 모델에 맞는 올바른 파서/템플릿으로 vLLM 시작
    - `openclaw models list --provider vllm`으로 정확한 모델 ID 확인
    - `tool_choice: "auto"`가 여전히 비어 있거나 텍스트 전용 도구 호출을 반환하는 경우에만 전용 모델별 `params.extra_body.tool_choice: "required"` override 추가

  </Accordion>
</AccordionGroup>

<Warning>
추가 도움말: [문제 해결](/ko/help/troubleshooting) 및 [FAQ](/ko/help/faq).
</Warning>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    공급자, 모델 참조, 장애 조치 동작 선택.
  </Card>
  <Card title="OpenAI" href="/ko/providers/openai" icon="bolt">
    네이티브 OpenAI 공급자 및 OpenAI 호환 라우트 동작.
  </Card>
  <Card title="OAuth 및 인증" href="/ko/gateway/authentication" icon="key">
    인증 세부 정보 및 자격 증명 재사용 규칙.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제와 해결 방법.
  </Card>
</CardGroup>
