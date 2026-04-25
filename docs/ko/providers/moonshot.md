---
read_when:
    - Moonshot K2(Moonshot Open Platform)와 Kimi Coding 설정을 원합니다
    - 서로 다른 엔드포인트, 키, 모델 참조를 이해해야 합니다
    - 각 provider에 대해 바로 복사해서 쓸 수 있는 config가 필요합니다
summary: Moonshot K2와 Kimi Coding 구성하기(분리된 provider + 키)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-25T06:09:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd6ababe59354a302975b68f4cdb12a623647f8e5cadfb8ae58a74bb2934ce65
    source_path: providers/moonshot.md
    workflow: 15
---

Moonshot는 OpenAI 호환 엔드포인트로 Kimi API를 제공합니다. provider를 구성하고
기본 모델을 `moonshot/kimi-k2.6`으로 설정하거나,
`kimi/kimi-code`로 Kimi Coding을 사용할 수 있습니다.

<Warning>
Moonshot와 Kimi Coding은 **서로 다른 provider**입니다. 키는 서로 호환되지 않고, 엔드포인트도 다르며, 모델 참조도 다릅니다(`moonshot/...` vs `kimi/...`).
</Warning>

## 내장 모델 카탈로그

[//]: # "moonshot-kimi-k2-ids:start"

| Model ref                         | 이름                   | Reasoning | 입력       | 컨텍스트 | 최대 출력 |
| --------------------------------- | ---------------------- | --------- | ----------- | ------- | ---------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | 아니요        | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | 아니요        | text, image | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | 예       | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | 예       | text        | 262,144 | 262,144    |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | 아니요        | text        | 256,000 | 16,384     |

[//]: # "moonshot-kimi-k2-ids:end"

현재 Moonshot가 호스팅하는 K2 모델에 대한 번들 비용 추정치는 Moonshot의
공개 종량제 요금을 사용합니다. Kimi K2.6은 캐시 적중 시 $0.16/MTok,
입력 $0.95/MTok, 출력 $4.00/MTok이며, Kimi K2.5는 캐시 적중 시 $0.10/MTok,
입력 $0.60/MTok, 출력 $3.00/MTok입니다. 다른 레거시 카탈로그 항목은
config에서 재정의하지 않는 한 0 비용 placeholder를 유지합니다.

## 시작하기

사용할 provider를 선택하고 설정 단계를 따르세요.

<Tabs>
  <Tab title="Moonshot API">
    **가장 적합한 경우:** Moonshot Open Platform을 통해 Kimi K2 모델을 사용할 때.

    <Steps>
      <Step title="엔드포인트 리전 선택">
        | 인증 선택지            | 엔드포인트                       | 리전        |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | 국제 |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | 중국         |
      </Step>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        또는 중국 엔드포인트의 경우:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="기본 모델 설정">
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
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="live smoke 테스트 실행">
        일반 세션을 건드리지 않고 모델 접근성과 비용
        추적을 검증하려면 격리된 상태 디렉터리를 사용하세요:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        JSON 응답에는 `provider: "moonshot"` 및
        `model: "kimi-k2.6"`이 보고되어야 합니다. assistant transcript 항목에는 Moonshot가
        사용량 메타데이터를 반환할 때 정규화된 토큰 사용량과 추정 비용이
        `usage.cost` 아래에 저장됩니다.
      </Step>
    </Steps>

    ### config 예시

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
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
    **가장 적합한 경우:** Kimi Coding 엔드포인트를 통한 코드 중심 작업.

    <Note>
    Kimi Coding은 Moonshot(`moonshot/...`)과 다른 API 키 및 provider 접두사(`kimi/...`)를 사용합니다. 레거시 모델 참조 `kimi/k2p5`도 호환성 ID로 계속 허용됩니다.
    </Note>

    <Steps>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="기본 모델 설정">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-code" },
            },
          },
        }
        ```
      </Step>
      <Step title="모델 사용 가능 여부 확인">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### config 예시

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: {
            "kimi/kimi-code": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Kimi 웹 검색

OpenClaw는 Moonshot 웹
검색을 기반으로 하는 `web_search` provider로 **Kimi**도 함께 제공합니다.

<Steps>
  <Step title="대화형 웹 검색 설정 실행">
    ```bash
    openclaw configure --section web
    ```

    웹 검색 섹션에서 **Kimi**를 선택하면
    `plugins.entries.moonshot.config.webSearch.*`가 저장됩니다.

  </Step>
  <Step title="웹 검색 리전과 모델 구성">
    대화형 설정은 다음 항목을 묻습니다:

    | 설정             | 옵션                                                              |
    | ------------------- | -------------------------------------------------------------------- |
    | API 리전          | `https://api.moonshot.ai/v1` (국제) 또는 `https://api.moonshot.cn/v1` (중국) |
    | 웹 검색 모델    | 기본값 `kimi-k2.6`                                             |

  </Step>
</Steps>

config는 `plugins.entries.moonshot.config.webSearch` 아래에 저장됩니다:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // 또는 KIMI_API_KEY / MOONSHOT_API_KEY 사용
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
  <Accordion title="기본 thinking 모드">
    Moonshot Kimi는 이진 기본 thinking을 지원합니다:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    `agents.defaults.models.<provider/model>.params`를 통해 모델별로 구성하세요:

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

    OpenClaw는 Moonshot에 대해 런타임 `/think` 수준도 매핑합니다:

    | `/think` 수준       | Moonshot 동작          |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | off가 아닌 모든 수준    | `thinking.type=enabled`    |

    <Warning>
    Moonshot thinking이 활성화되면 `tool_choice`는 `auto` 또는 `none`이어야 합니다. OpenClaw는 호환성을 위해 호환되지 않는 `tool_choice` 값을 `auto`로 정규화합니다.
    </Warning>

    Kimi K2.6은 또한 `reasoning_content`의
    다중 턴 유지 방식을 제어하는 선택적 `thinking.keep` 필드를 허용합니다. 턴 간 전체
    reasoning을 유지하려면 `"all"`로 설정하고, 서버 기본 전략을 사용하려면 생략하거나
    `null`로 두세요. OpenClaw는 `thinking.keep`을
    `moonshot/kimi-k2.6`에만 전달하고 다른 모델에서는 제거합니다.

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

  <Accordion title="도구 호출 ID 정제">
    Moonshot Kimi는 `functions.<name>:<index>` 형태의 tool_call ID를 제공합니다. OpenClaw는 다중 턴 도구 호출이 계속 작동하도록 이를 변경하지 않고 그대로 유지합니다.

    사용자 지정 OpenAI 호환 provider에서 엄격한 정제를 강제하려면 `sanitizeToolCallIds: true`를 설정하세요:

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
    기본 Moonshot 엔드포인트(`https://api.moonshot.ai/v1` 및
    `https://api.moonshot.cn/v1`)는 공유
    `openai-completions` 전송에서 스트리밍 사용량 호환성을 알립니다. OpenClaw는 이를 엔드포인트
    capability를 기준으로 판단하므로, 동일한 기본 Moonshot 호스트를 대상으로 하는 호환 사용자 지정 provider ID도
    같은 스트리밍 사용량 동작을 상속합니다.

    번들된 K2.6 가격 책정에서는 입력, 출력,
    캐시 읽기 토큰을 포함하는 스트리밍 사용량도 `/status`, `/usage full`, `/usage cost`, transcript 기반 세션
    회계를 위한 로컬 추정 USD 비용으로 변환됩니다.

  </Accordion>

  <Accordion title="엔드포인트 및 모델 참조 참조">
    | Provider   | 모델 참조 접두사 | 엔드포인트                      | 인증 env var        |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Kimi Coding 엔드포인트          | `KIMI_API_KEY`      |
    | 웹 검색 | 해당 없음              | Moonshot API 리전과 동일   | `KIMI_API_KEY` 또는 `MOONSHOT_API_KEY` |

    - Kimi 웹 검색은 `KIMI_API_KEY` 또는 `MOONSHOT_API_KEY`를 사용하며, 기본값은 `https://api.moonshot.ai/v1`와 모델 `kimi-k2.6`입니다.
    - 필요하면 `models.providers`에서 가격 및 컨텍스트 메타데이터를 재정의하세요.
    - Moonshot가 특정 모델에 대해 다른 컨텍스트 제한을 게시하면 `contextWindow`를 그에 맞게 조정하세요.

  </Accordion>
</AccordionGroup>

## 관련 항목

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    provider, 모델 참조, 장애 조치 동작 선택하기.
  </Card>
  <Card title="웹 검색" href="/ko/tools/web" icon="magnifying-glass">
    Kimi를 포함한 웹 검색 provider 구성하기.
  </Card>
  <Card title="구성 참조" href="/ko/gateway/configuration-reference" icon="gear">
    provider, 모델, Plugin에 대한 전체 config 스키마.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Moonshot API 키 관리 및 문서.
  </Card>
</CardGroup>
