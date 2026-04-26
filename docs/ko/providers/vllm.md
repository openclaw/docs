---
read_when:
    - 로컬 vLLM 서버에 연결해 OpenClaw를 실행하려고 합니다.
    - 직접 선택한 모델로 OpenAI 호환 `/v1` 엔드포인트를 사용하려고 합니다.
summary: vLLM(OpenAI 호환 로컬 서버)로 OpenClaw 실행하기
title: vLLM
x-i18n:
    generated_at: "2026-04-26T11:38:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbf424cb532f2b3e188c39545b187e5db6274ff2fadc01c9e4cb0901dbe9824c
    source_path: providers/vllm.md
    workflow: 15
---

vLLM은 **OpenAI 호환** HTTP API를 통해 오픈소스 모델(및 일부 사용자 지정 모델)을 제공할 수 있습니다. OpenClaw는 `openai-completions` API를 사용해 vLLM에 연결합니다.

또한 `VLLM_API_KEY`로 opt-in하고 명시적인 `models.providers.vllm` 항목을 정의하지 않으면, OpenClaw는 vLLM에서 사용 가능한 모델을 **자동 검색**할 수 있습니다(vLLM 서버가 인증을 강제하지 않는 경우 어떤 값이든 동작).

OpenClaw는 `vllm`을 streamed usage accounting을 지원하는 로컬 OpenAI 호환 provider로 취급하므로, 상태/컨텍스트 token 수는 `stream_options.include_usage` 응답으로부터 업데이트될 수 있습니다.

| 속성             | 값                                       |
| ---------------- | ---------------------------------------- |
| Provider ID      | `vllm`                                   |
| API              | `openai-completions` (OpenAI 호환)       |
| 인증             | `VLLM_API_KEY` 환경 변수                 |
| 기본 base URL    | `http://127.0.0.1:8000/v1`               |

## 시작하기

<Steps>
  <Step title="OpenAI 호환 서버로 vLLM 시작">
    base URL은 `/v1` 엔드포인트(예: `/v1/models`, `/v1/chat/completions`)를 노출해야 합니다. vLLM은 보통 다음에서 실행됩니다:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="API 키 환경 변수 설정">
    서버가 인증을 강제하지 않는다면 어떤 값이든 동작합니다:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="모델 선택">
    vLLM 모델 ID 중 하나로 바꾸세요:

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

## 모델 검색(암시적 provider)

`VLLM_API_KEY`가 설정되어 있거나(auth profile이 존재하고), **`models.providers.vllm`을 정의하지 않은 경우**, OpenClaw는 다음을 질의합니다:

```
GET http://127.0.0.1:8000/v1/models
```

그리고 반환된 ID를 모델 항목으로 변환합니다.

<Note>
`models.providers.vllm`을 명시적으로 설정하면 자동 검색은 건너뛰며, 모델을 수동으로 정의해야 합니다.
</Note>

## 명시적 구성(수동 모델)

다음 경우에는 명시적 구성을 사용하세요:

- vLLM이 다른 호스트 또는 포트에서 실행되는 경우
- `contextWindow` 또는 `maxTokens` 값을 고정하고 싶은 경우
- 서버가 실제 API 키를 요구하는 경우(또는 헤더를 직접 제어하고 싶은 경우)
- 신뢰된 loopback, LAN, 또는 Tailscale vLLM 엔드포인트에 연결하는 경우

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        models: [
          {
            id: "your-model-id",
            name: "로컬 vLLM 모델",
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

## 고급 구성

<AccordionGroup>
  <Accordion title="프록시 스타일 동작">
    vLLM은 네이티브 OpenAI 엔드포인트가 아니라 프록시 스타일 OpenAI 호환 `/v1` 백엔드로 취급됩니다. 이는 다음을 의미합니다:

    | 동작 | 적용 여부 |
    |----------|----------|
    | 네이티브 OpenAI 요청 형상화 | 아니요 |
    | `service_tier` | 전송되지 않음 |
    | 응답 `store` | 전송되지 않음 |
    | 프롬프트 캐시 힌트 | 전송되지 않음 |
    | OpenAI reasoning 호환 페이로드 형상화 | 적용되지 않음 |
    | 숨겨진 OpenClaw attribution 헤더 | 사용자 지정 base URL에 주입되지 않음 |

  </Accordion>

  <Accordion title="Nemotron 3 thinking 제어">
    vLLM/Nemotron 3는 reasoning이 숨겨진 reasoning으로 반환될지, 아니면 보이는 답변 텍스트로 반환될지를 제어하기 위해 chat-template kwargs를 사용할 수 있습니다. OpenClaw 세션이
    thinking이 꺼진 상태로 `vllm/nemotron-3-*`를 사용하면, OpenClaw는 다음을 전송합니다:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    이 값을 사용자 지정하려면 모델 params 아래에 `chat_template_kwargs`를 설정하세요.
    `params.extra_body.chat_template_kwargs`도 설정한 경우에는 `extra_body`가 최종 요청 본문 재정의이므로
    해당 값이 최종 우선순위를 가집니다.

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

  <Accordion title="사용자 지정 base URL">
    vLLM 서버가 기본이 아닌 호스트 또는 포트에서 실행된다면, 명시적 provider 구성에서 `baseUrl`을 설정하세요:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            models: [
              {
                id: "my-custom-model",
                name: "원격 vLLM 모델",
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
  <Accordion title="서버에 연결할 수 없음">
    vLLM 서버가 실행 중이고 접근 가능한지 확인하세요:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    연결 오류가 보이면 호스트, 포트, 그리고 vLLM이 OpenAI 호환 서버 모드로 시작되었는지 확인하세요.
    명시적인 loopback, LAN, 또는 Tailscale 엔드포인트의 경우
    `models.providers.vllm.request.allowPrivateNetwork: true`도 설정하세요. provider
    요청은 provider가 명시적으로 신뢰되지 않는 한 기본적으로 private-network URL을 차단합니다.

  </Accordion>

  <Accordion title="요청에서 인증 오류 발생">
    요청이 인증 오류로 실패하면, 서버 구성과 일치하는 실제 `VLLM_API_KEY`를 설정하거나 `models.providers.vllm` 아래에 provider를 명시적으로 구성하세요.

    <Tip>
    vLLM 서버가 인증을 강제하지 않는 경우, 비어 있지 않은 아무 값이나 `VLLM_API_KEY`에 넣으면 OpenClaw의 opt-in 신호로 동작합니다.
    </Tip>

  </Accordion>

  <Accordion title="검색된 모델이 없음">
    자동 검색은 `VLLM_API_KEY`가 설정되어 있어야 하고, **`models.providers.vllm` 구성 항목이 없어야만** 작동합니다. provider를 수동으로 정의한 경우, OpenClaw는 검색을 건너뛰고 선언한 모델만 사용합니다.
  </Accordion>
</AccordionGroup>

<Warning>
추가 도움말: [문제 해결](/ko/help/troubleshooting) 및 [FAQ](/ko/help/faq).
</Warning>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 참조, failover 동작을 선택하는 방법.
  </Card>
  <Card title="OpenAI" href="/ko/providers/openai" icon="bolt">
    네이티브 OpenAI provider 및 OpenAI 호환 경로 동작.
  </Card>
  <Card title="OAuth 및 인증" href="/ko/gateway/authentication" icon="key">
    인증 세부 사항 및 자격 증명 재사용 규칙.
  </Card>
  <Card title="문제 해결" href="/ko/help/troubleshooting" icon="wrench">
    일반적인 문제와 해결 방법.
  </Card>
</CardGroup>
