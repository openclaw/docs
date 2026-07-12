---
read_when:
    - 로컬 vLLM 서버에서 OpenClaw를 실행하려는 경우
    - 자체 모델로 OpenAI 호환 /v1 엔드포인트를 사용하려는 경우
summary: vLLM(OpenAI 호환 로컬 서버)로 OpenClaw 실행하기
title: vLLM
x-i18n:
    generated_at: "2026-07-12T01:09:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98d1044c0a82efb6c9937e961d765d0cfcea8664cbaa043168921b457756512c
    source_path: providers/vllm.md
    workflow: 16
---

vLLM은 **OpenAI 호환** HTTP API를 통해 오픈 소스 모델과 일부 사용자 지정 모델을 제공합니다. OpenClaw는 `openai-completions` API를 사용해 연결하며, `VLLM_API_KEY`로 사용을 명시하면 모델을 **자동 검색**할 수 있습니다.

| 속성             | 값                                         |
| ---------------- | ------------------------------------------ |
| 제공자 ID        | `vllm`                                     |
| API              | `openai-completions` (OpenAI 호환)         |
| 인증             | `VLLM_API_KEY` 환경 변수                   |
| 기본 베이스 URL  | `http://127.0.0.1:8000/v1`                 |
| 스트리밍 사용량  | 지원됨 (`stream_options.include_usage`)    |

## 시작하기

<Steps>
  <Step title="Start vLLM with an OpenAI-compatible server">
    베이스 URL은 `/v1` 엔드포인트(`/v1/models`, `/v1/chat/completions`)를 제공해야 합니다. vLLM은 일반적으로 다음 주소에서 실행됩니다.

    ```text
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Set the API key environment variable">
    서버가 인증을 강제하지 않는다면 비어 있지 않은 어떤 값이든 사용할 수 있습니다.

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Select a model">
    다음 값을 사용 중인 vLLM 모델 ID 중 하나로 바꾸세요.

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
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

<Tip>
비대화형 설정(CI, 스크립팅)에서는 베이스 URL, 키, 모델을 직접 전달하세요.

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice vllm \
  --custom-base-url "http://127.0.0.1:8000/v1" \
  --custom-api-key "vllm-local" \
  --custom-model-id "your-model-id"
```

</Tip>

## 모델 검색(암시적 제공자)

`VLLM_API_KEY`가 설정되어 있거나 인증 프로필이 존재하고 `models.providers.vllm`이 정의되어 **있지 않으면**, OpenClaw는 `GET http://127.0.0.1:8000/v1/models`를 조회하고 반환된 ID를 모델 항목으로 변환합니다.

<Note>
`models.providers.vllm`을 명시적으로 설정하면 OpenClaw는 선언한 모델만 사용합니다. OpenClaw가 구성된 해당 제공자의 `/models` 엔드포인트도 조회하고 공개된 모든 vLLM 모델을 포함하도록 하려면 `agents.defaults.models`에 `"vllm/*": {}`를 추가하세요.
</Note>

## 명시적 구성

vLLM이 다른 호스트나 포트에서 실행되거나, `contextWindow`/`maxTokens`를 고정하려거나, 서버에 실제 API 키가 필요하거나, 신뢰할 수 있는 루프백, LAN 또는 Tailscale 엔드포인트에 연결하려면 명시적으로 구성하세요.

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        timeoutSeconds: 300, // Optional: extend request timeout for slow local models
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

모든 모델을 나열하지 않고 제공자를 동적으로 유지하려면 표시되는 모델 카탈로그에 와일드카드를 추가하세요.

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
  <Accordion title="Proxy-style behavior">
    vLLM은 네이티브 OpenAI 엔드포인트가 아니라 프록시 방식의 OpenAI 호환 `/v1` 백엔드로 취급됩니다.

    | 동작                                    | 적용 여부                        |
    | --------------------------------------- | -------------------------------- |
    | 네이티브 OpenAI 요청 형식 구성          | 아니요                           |
    | `service_tier`                          | 전송하지 않음                    |
    | Responses `store`                       | 전송하지 않음                    |
    | 프롬프트 캐시 힌트                      | 전송하지 않음                    |
    | OpenAI 추론 호환 페이로드 형식 구성     | 적용하지 않음                    |
    | 숨겨진 OpenClaw 출처 헤더               | 사용자 지정 베이스 URL에 삽입하지 않음 |

  </Accordion>

  <Accordion title="Qwen thinking controls">
    Qwen 모델의 경우 서버가 Qwen 채팅 템플릿 키워드 인수를 요구하면 모델 항목에 `compat.thinkingFormat: "qwen-chat-template"`을 설정하세요. Qwen 채팅 템플릿의 사고 기능은 OpenAI 방식의 단계별 노력 수준이 아니라 켜기/끄기 플래그이므로, 이러한 모델은 이진 `/think` 프로필(`off`, `on`)을 제공합니다.

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

    OpenClaw는 `/think off`를 다음과 같이 매핑합니다.

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    `off`가 아닌 사고 수준은 `enable_thinking: true`를 전송합니다. 엔드포인트가 대신 DashScope 방식의 최상위 플래그를 요구한다면 `compat.thinkingFormat: "qwen"`을 사용하여 요청 루트에 `enable_thinking`을 전송하세요.

  </Accordion>

  <Accordion title="Nemotron 3 thinking controls">
    사고 기능이 꺼진 `vllm/nemotron-3-*` 모델의 경우 번들 Plugin은 다음을 전송합니다.

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    이러한 값을 사용자 지정하려면 모델 매개변수 아래에 `chat_template_kwargs`를 설정하세요. `params.extra_body.chat_template_kwargs`도 설정하면 `extra_body`가 요청 본문의 마지막 재정의이므로 해당 값이 우선합니다.

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

  <Accordion title="Qwen tool calls appear as text">
    먼저 vLLM이 해당 모델에 맞는 도구 호출 파서와 채팅 템플릿으로 시작되었는지 확인하세요. vLLM 문서에서는 Qwen2.5 모델에 `hermes`, Qwen3-Coder 모델에 `qwen3_xml`을 사용하도록 안내합니다.

    증상: Skills/도구가 전혀 실행되지 않거나, 어시스턴트가 `{"name":"read","arguments":...}` 같은 원시 JSON/XML을 출력하거나, OpenClaw가 `tool_choice: "auto"`를 전송할 때 vLLM이 빈 `tool_calls` 배열을 반환합니다.

    일부 Qwen/vLLM 조합은 요청에서 `tool_choice: "required"`를 사용할 때만 구조화된 도구 호출을 반환합니다. `params.extra_body`를 사용해 모델별로 강제하세요.

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

    모델 ID를 `openclaw models list --provider vllm`에서 확인한 정확한 ID로 바꾸거나, CLI에서 동일한 재정의를 적용하세요.

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    이는 명시적으로 사용해야 하는 우회 방법입니다. 도구가 있는 모든 턴에서 도구 호출을 강제하므로, 이를 허용할 수 있는 전용 모델 항목에만 사용하세요. 모든 vLLM 모델의 전역 기본값으로 설정하지 말고, 임의의 어시스턴트 텍스트를 실행 가능한 도구 호출로 변환하는 프록시와 함께 사용하지 마세요.

  </Accordion>

  <Accordion title="Custom base URL">
    vLLM 서버가 기본값이 아닌 호스트나 포트에서 실행되는 경우 명시적 제공자 구성에서 `baseUrl`을 설정하세요.

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
  <Accordion title="Slow first response or remote server timeout">
    대규모 로컬 모델, 원격 LAN 호스트 또는 테일넷 링크에서는 제공자 범위의 요청 제한 시간을 설정하세요.

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

    `timeoutSeconds`는 vLLM 모델 HTTP 요청에만 적용됩니다. 여기에는 연결 설정, 응답 헤더, 본문 스트리밍 및 보호된 가져오기의 전체 중단 제한 시간이 포함됩니다. 또한 이 제공자의 암시적 기본값인 약 120초보다 LLM 유휴/스트림 감시 제한을 높입니다. 전체 에이전트 실행을 제어하는 `agents.defaults.timeoutSeconds`를 늘리는 것보다 이 설정을 우선 사용하세요.

  </Accordion>

  <Accordion title="Server not reachable">
    vLLM 서버가 실행 중이며 접근 가능한지 확인하세요.

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    연결 오류가 표시되면 호스트와 포트를 확인하고 vLLM이 OpenAI 호환 서버 모드로 시작되었는지 확인하세요. OpenClaw는 루프백, LAN 및 Tailscale 엔드포인트에서 보호된 모델 요청을 수행할 때 구성된 정확한 `models.providers.vllm.baseUrl` 출처를 신뢰합니다. 메타데이터/링크 로컬 출처는 명시적으로 허용하지 않는 한 계속 차단됩니다. vLLM 요청이 다른 비공개 출처에 도달해야 할 때만 `models.providers.vllm.request.allowPrivateNetwork: true`를 설정하고, 정확한 출처 신뢰를 사용하지 않으려면 `false`로 설정하세요.

  </Accordion>

  <Accordion title="Auth errors on requests">
    요청이 인증 오류로 실패하면 서버 구성과 일치하는 실제 `VLLM_API_KEY`를 설정하거나 `models.providers.vllm` 아래에서 제공자를 명시적으로 구성하세요.

    <Tip>
    vLLM 서버가 인증을 강제하지 않는다면 비어 있지 않은 어떤 `VLLM_API_KEY` 값이든 OpenClaw 사용을 명시하는 신호로 사용할 수 있습니다.
    </Tip>

  </Accordion>

  <Accordion title="No models discovered">
    자동 검색을 사용하려면 `VLLM_API_KEY`가 설정되어 있어야 합니다. `models.providers.vllm`을 정의했다면 `agents.defaults.models`에 `"vllm/*": {}`가 포함되지 않는 한 OpenClaw는 선언한 모델만 사용합니다.
  </Accordion>

  <Accordion title="Tools render as raw text">
    Qwen 모델이 Skills을 실행하는 대신 JSON/XML 도구 구문을 출력한다면 다음을 수행하세요.

    - 해당 모델에 맞는 파서/템플릿으로 vLLM을 시작하세요.
    - `openclaw models list --provider vllm`으로 정확한 모델 ID를 확인하세요.
    - `tool_choice: "auto"`가 계속 비어 있거나 텍스트 전용 도구 호출을 반환하는 경우에만 모델별 전용 `params.extra_body.tool_choice: "required"` 재정의를 추가하세요.

  </Accordion>
</AccordionGroup>

<Warning>
추가 도움말: [문제 해결](/ko/help/troubleshooting) 및 [자주 묻는 질문](/ko/help/faq).
</Warning>

## 관련 항목

<CardGroup cols={2}>
  <Card title="Model selection" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조 및 장애 조치 동작을 선택합니다.
  </Card>
  <Card title="OpenAI" href="/ko/providers/openai" icon="bolt">
    네이티브 OpenAI 제공자 및 OpenAI 호환 경로 동작입니다.
  </Card>
  <Card title="OAuth and auth" href="/ko/gateway/authentication" icon="key">
    인증 세부 정보 및 자격 증명 재사용 규칙입니다.
  </Card>
  <Card title="Troubleshooting" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제와 해결 방법입니다.
  </Card>
</CardGroup>
