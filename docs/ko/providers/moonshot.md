---
read_when:
    - Moonshot K2(Moonshot Open Platform)와 Kimi Coding 설정 비교가 필요합니다
    - 별도의 엔드포인트, 키, 모델 참조를 이해해야 합니다
    - 두 Provider 중 하나에 대해 복사/붙여넣기 가능한 구성을 원합니다
summary: Moonshot K2와 Kimi Coding 구성(별도 제공자 + 키)
title: Moonshot AI
x-i18n:
    generated_at: "2026-06-27T18:03:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7365d7e843275750824a937553dcf535245146fb49fe00c622bf14b71d2dd17
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot은 OpenAI 호환 엔드포인트로 Kimi API를 제공합니다. 공급자를 구성하고
기본 모델을 `moonshot/kimi-k2.6`으로 설정하거나,
Kimi Coding에는 `kimi/kimi-for-coding`을 사용하세요.

<Warning>
Moonshot과 Kimi Coding은 **별도의 공급자**입니다. 키는 서로 바꿔 쓸 수 없고, 엔드포인트가 다르며, 모델 참조도 다릅니다(`moonshot/...` vs `kimi/...`).
</Warning>

## 기본 제공 모델 카탈로그

[//]: # "moonshot-kimi-k2-ids:start"

| 모델 참조                         | 이름                   | 추론 | 입력       | 컨텍스트 | 최대 출력 |
| --------------------------------- | ---------------------- | --------- | ----------- | ------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | 아니요        | 텍스트, 이미지 | 262,144 | 262,144    |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | 항상 켜짐 | 텍스트, 이미지 | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | 아니요        | 텍스트, 이미지 | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | 예       | 텍스트        | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | 예       | 텍스트        | 262,144 | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | 아니요        | 텍스트        | 256,000 | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

현재 Moonshot 호스팅 K2 모델의 카탈로그 비용 추정치는 Moonshot이
게시한 종량제 요율을 사용합니다. Kimi K2.7 Code는 캐시 적중
$0.19/MTok, 입력 $0.95/MTok, 출력 $4.00/MTok입니다. Kimi K2.6은 캐시 적중
$0.16/MTok, 입력 $0.95/MTok, 출력 $4.00/MTok입니다. Kimi K2.5는 캐시 적중
$0.10/MTok, 입력 $0.60/MTok, 출력 $3.00/MTok입니다. 다른 레거시 카탈로그 항목은
구성에서 재정의하지 않는 한 비용 0 플레이스홀더를 유지합니다.

Kimi K2.7 Code는 항상 네이티브 thinking을 사용합니다. OpenClaw는 이 모델에 대해
`on` thinking 상태만 노출하며, Moonshot 요구사항에 따라 outbound `thinking` 및
`reasoning_effort` 제어를 생략합니다. OpenClaw는 또한 K2.7이 공급자 기본값으로
고정하는 샘플링 재정의도 생략합니다. Kimi K2.6은 온보딩 기본값으로 유지됩니다.

## 시작하기

공급자를 선택하고 설정 단계를 따르세요.

<Tabs>
  <Tab title="Moonshot API">
    **적합한 용도:** Moonshot Open Platform을 통한 Kimi K2 모델.

    <Steps>
      <Step title="Choose your endpoint region">
        | 인증 선택               | 엔드포인트                       | 지역        |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | 국제 |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | 중국         |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        또는 중국 엔드포인트의 경우:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Run a live smoke test">
        일반 세션을 건드리지 않고 모델 액세스와 비용 추적을 검증하려면
        격리된 상태 디렉터리를 사용하세요.

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        JSON 응답은 `provider: "moonshot"` 및
        `model: "kimi-k2.6"`을 보고해야 합니다. Moonshot이 사용량 메타데이터를 반환하면
        어시스턴트 transcript 항목은 정규화된 토큰 사용량과 추정 비용을
        `usage.cost` 아래에 저장합니다.
      </Step>
    </Steps>

    ### 구성 예시

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
            "moonshot/kimi-k2.7-code": { alias: "Kimi K2.7 Code" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.7-code",
                name: "Kimi K2.7 Code",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    공식 Plugin을 설치한 다음 Gateway를 다시 시작하세요.

    ```bash
    openclaw plugins install @openclaw/kimi-provider
    openclaw gateway restart
    ```
    **적합한 용도:** Kimi Coding 엔드포인트를 통한 코드 중심 작업.

    <Note>
    Kimi Coding은 Moonshot(`moonshot/...`)과 다른 API 키 및 공급자 접두사(`kimi/...`)를 사용합니다. 안정 API 모델 참조는 `kimi/kimi-for-coding`입니다. 레거시 참조 `kimi/kimi-code`와 `kimi/k2p5`는 계속 허용되며 해당 API 모델 ID로 정규화됩니다.
    </Note>

    <Steps>
      <Step title="Install the plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        ```
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-for-coding" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### 구성 예시

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: {
            "kimi/kimi-for-coding": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Kimi 웹 검색

Moonshot Plugin은 Moonshot 웹 검색을 기반으로 하는 `web_search` 공급자로 **Kimi**도 등록합니다.

<Steps>
  <Step title="Run interactive web search setup">
    ```bash
    openclaw configure --section web
    ```

    웹 검색 섹션에서 **Kimi**를 선택해
    `plugins.entries.moonshot.config.webSearch.*`를 저장하세요.

  </Step>
  <Step title="Configure the web search region and model">
    대화형 설정은 다음을 입력하라는 메시지를 표시합니다.

    | 설정             | 옵션                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | API 지역          | `https://api.moonshot.ai/v1`(국제) 또는 `https://api.moonshot.cn/v1`(중국) |
    | 웹 검색 모델    | 기본값은 `kimi-k2.6`                                             |

  </Step>
</Steps>

구성은 `plugins.entries.moonshot.config.webSearch` 아래에 있습니다.

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // or use KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## 고급 구성

<AccordionGroup>
  <Accordion title="Native thinking mode">
    Kimi K2.7 Code는 항상 네이티브 thinking을 사용합니다. Moonshot은 클라이언트가
    이 모델에 대해 `thinking` 필드를 생략하도록 요구하므로, OpenClaw는 `on`만 노출하고
    오래된 `off` 설정을 무시합니다. K2.7은 또한 `temperature`, `top_p`, `n`,
    `presence_penalty`, `frequency_penalty`를 고정합니다. OpenClaw는 해당 필드에 대해
    구성된 재정의를 생략합니다.

    다른 Moonshot Kimi 모델은 이진 네이티브 thinking을 지원합니다.

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    `agents.defaults.models.<provider/model>.params`를 통해 모델별로 구성하세요.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw는 해당 모델의 런타임 `/think` 레벨을 매핑합니다.

    | `/think` 레벨       | Moonshot 동작          |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | off가 아닌 모든 레벨    | `thinking.type=enabled`    |

    <Warning>
    Moonshot thinking이 활성화되면 `tool_choice`는 `auto` 또는 `none`이어야 합니다. OpenClaw는 호환되지 않는 값을 `auto`로 정규화합니다. 여기에는 pinned 도구 선택을 보존하기 위해 thinking 모드를 비활성화할 수 없는 Kimi K2.7 Code도 포함됩니다.
    </Warning>

    Kimi K2.6은 `reasoning_content`의 멀티 턴 보존을 제어하는 선택적 `thinking.keep` 필드도 허용합니다. 전체 추론을 턴 간에 유지하려면 `"all"`로 설정하고, 서버 기본 전략을 사용하려면 생략하거나 `null`로 둡니다. OpenClaw는 `moonshot/kimi-k2.6`에 대해서만 `thinking.keep`을 전달하고 다른 모델에서는 제거합니다. Kimi K2.7 Code는 기본적으로 전체 추론 기록을 보존하며, OpenClaw는 전체 `thinking` 필드를 생략합니다.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="도구 호출 ID 정리">
    Moonshot Kimi는 `functions.<name>:<index>` 형태의 네이티브 tool_call ID를 제공합니다. OpenAI-completions 전송의 경우 OpenClaw는 각 네이티브 Kimi ID의 첫 번째 발생을 보존하고, 이후 중복 항목은 결정적 OpenAI 스타일 `call_*` ID로 다시 작성합니다. 일치하는 도구 결과도 동일한 ID로 다시 매핑되므로 Kimi의 첫 번째 네이티브 ID를 제거하지 않고도 재생이 고유하게 유지됩니다.

    사용자 지정 OpenAI 호환 제공자에서 엄격한 정리를 강제하려면 `sanitizeToolCallIds: true`를 설정합니다.

    ```json5
    {
      models: {
        providers: {
          "my-kimi-proxy": {
            api: "openai-completions",
            sanitizeToolCallIds: true,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="스트리밍 사용량 호환성">
    네이티브 Moonshot 엔드포인트(`https://api.moonshot.ai/v1` 및
    `https://api.moonshot.cn/v1`)는 공유 `openai-completions` 전송에서
    스트리밍 사용량 호환성을 알립니다. OpenClaw는 이를 엔드포인트 기능에
    따라 키로 처리하므로, 동일한 네이티브 Moonshot 호스트를 대상으로 하는
    호환 사용자 지정 제공자 ID는 동일한 스트리밍 사용량 동작을 상속합니다.

    카탈로그 K2.6 가격으로, 입력, 출력, 캐시 읽기 토큰이 포함된 스트리밍 사용량은
    `/status`, `/usage full`, `/usage cost`, 그리고 transcript 기반 세션
    회계를 위한 로컬 추정 USD 비용으로도 변환됩니다.

  </Accordion>

  <Accordion title="엔드포인트 및 모델 참조 레퍼런스">
    | 제공자   | 모델 참조 접두사 | 엔드포인트                      | 인증 env var        |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Kimi Coding 엔드포인트          | `KIMI_API_KEY`      |
    | 웹 검색 | N/A              | Moonshot API 리전과 동일   | `KIMI_API_KEY` 또는 `MOONSHOT_API_KEY` |

    - Kimi 웹 검색은 `KIMI_API_KEY` 또는 `MOONSHOT_API_KEY`를 사용하며, 기본값은 모델 `kimi-k2.6`과 함께 `https://api.moonshot.ai/v1`입니다.
    - 필요한 경우 `models.providers`에서 가격 및 컨텍스트 메타데이터를 재정의합니다.
    - Moonshot이 모델에 대해 다른 컨텍스트 제한을 게시하는 경우 그에 맞게 `contextWindow`를 조정합니다.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조, 장애 조치 동작을 선택합니다.
  </Card>
  <Card title="웹 검색" href="/ko/tools/web" icon="magnifying-glass">
    Kimi를 포함한 웹 검색 제공자를 구성합니다.
  </Card>
  <Card title="구성 레퍼런스" href="/ko/gateway/configuration-reference" icon="gear">
    제공자, 모델, Plugin에 대한 전체 구성 스키마입니다.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Moonshot API 키 관리 및 문서입니다.
  </Card>
</CardGroup>
