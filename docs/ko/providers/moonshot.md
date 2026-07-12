---
read_when:
    - Moonshot K2(Moonshot Open Platform)와 Kimi Coding 설정 비교를 원합니다
    - 별도의 엔드포인트, 키, 모델 참조를 이해해야 합니다
    - 두 제공업체 중 어느 쪽이든 복사하여 붙여넣을 수 있는 설정을 원합니다
summary: Moonshot K2와 Kimi Coding 구성하기(별도의 제공자 및 키 사용)
title: Moonshot AI
x-i18n:
    generated_at: "2026-07-12T01:11:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c917a595337fc2138601245f4c7055815859dfa3b2ddf90a56c980a7a4e09744
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot은 OpenAI 호환 엔드포인트를 갖춘 Kimi API를 제공합니다. Moonshot Open Platform의 기본 모델은 `moonshot/kimi-k2.6`으로 설정하고, Kimi Coding의 기본 모델은 `kimi/kimi-for-coding`으로 설정하세요.

<Warning>
Moonshot과 Kimi Coding은 각각 별도의 외부 Plugin으로 제공되는 **서로 다른 공급자**입니다. 키는 서로 바꿔 사용할 수 없고, 엔드포인트와 모델 참조도 다릅니다(`moonshot/...` 및 `kimi/...`).
</Warning>

## 기본 제공 모델 카탈로그

[//]: # "moonshot-kimi-k2-ids:start"

| 모델 참조                         | 이름                   | 추론      | 입력         | 컨텍스트 | 최대 출력 |
| --------------------------------- | ---------------------- | --------- | ------------ | -------- | --------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | 아니요    | 텍스트, 이미지 | 262,144  | 262,144   |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | 항상 켜짐 | 텍스트, 이미지 | 262,144  | 262,144   |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | 아니요    | 텍스트, 이미지 | 262,144  | 262,144   |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | 예        | 텍스트       | 262,144  | 262,144   |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | 예        | 텍스트       | 262,144  | 262,144   |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | 아니요    | 텍스트       | 256,000  | 16,384    |

[//]: # "moonshot-kimi-k2-ids:end"

카탈로그 비용 추정치는 Moonshot이 공개한 사용량 기반 요금을 사용합니다. Kimi K2.7 Code는 캐시 적중 시 $0.19/MTok, 입력 $0.95/MTok, 출력 $4.00/MTok이고, Kimi K2.6은 캐시 적중 시 $0.16/MTok, 입력 $0.95/MTok, 출력 $4.00/MTok이며, Kimi K2.5는 캐시 적중 시 $0.10/MTok, 입력 $0.60/MTok, 출력 $3.00/MTok입니다. 다른 카탈로그 항목은 구성에서 재정의하지 않는 한 비용이 0인 자리표시자를 유지합니다.

Kimi K2.7 Code는 항상 네이티브 사고를 사용합니다. Moonshot의 요구 사항에 따라 OpenClaw은 이 모델에 `on` 사고 상태만 노출하고, 송신 `thinking` 및 `reasoning_effort` 필드를 생략합니다. 또한 K2.7에서 공급자 기본값으로 고정되는 샘플링 재정의(`temperature`, `top_p`, `n`, `presence_penalty`, `frequency_penalty`)도 생략합니다. Kimi K2.6은 온보딩 기본값으로 유지됩니다.

## 시작하기

Moonshot과 Kimi Coding은 모두 외부 Plugin이므로 온보딩하기 전에 하나를 설치하세요.

<Tabs>
  <Tab title="Moonshot API">
    **적합한 용도:** Moonshot Open Platform을 통한 Kimi K2 모델 사용.

    <Steps>
      <Step title="Plugin 설치">
        ```bash
        openclaw plugins install @openclaw/moonshot-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="엔드포인트 리전 선택">
        | 인증 방식                | 엔드포인트                     | 리전     |
        | ------------------------ | ------------------------------ | -------- |
        | `moonshot-api-key`       | `https://api.moonshot.ai/v1`   | 국제     |
        | `moonshot-api-key-cn`    | `https://api.moonshot.cn/v1`   | 중국     |
      </Step>
      <Step title="온보딩 실행">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        중국 엔드포인트를 사용하려면 다음을 실행하세요.

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
      <Step title="실제 스모크 테스트 실행">
        일반 세션에 영향을 주지 않고 모델 접근과 비용 추적을 확인하려면 격리된 상태 디렉터리를 사용하세요.

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        JSON 응답에는 `provider: "moonshot"` 및 `model: "kimi-k2.6"`이 표시되어야 합니다. Moonshot이 사용량 메타데이터를 반환하면 어시스턴트 대화 기록 항목의 `usage.cost` 아래에 정규화된 토큰 사용량과 추정 비용이 저장됩니다.
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
    **적합한 용도:** Kimi Coding 엔드포인트를 통한 코드 중심 작업.

    <Note>
    Kimi Coding은 Moonshot(`moonshot/...`)과 다른 API 키 및 공급자 접두사(`kimi/...`)를 사용합니다. 안정적인 모델 참조는 `kimi/kimi-for-coding`이며, 레거시 참조인 `kimi/kimi-code`와 `kimi/k2p5`도 계속 허용되고 해당 모델 ID로 정규화됩니다.
    </Note>

    <Steps>
      <Step title="Plugin 설치">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        openclaw gateway restart
        ```
      </Step>
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
              model: { primary: "kimi/kimi-for-coding" },
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
  <Step title="대화형 웹 검색 설정 실행">
    ```bash
    openclaw configure --section web
    ```

    웹 검색 섹션에서 **Kimi**를 선택하여 `plugins.entries.moonshot.config.webSearch.*`를 저장하세요.

  </Step>
  <Step title="웹 검색 리전 및 모델 구성">
    대화형 설정에서 다음 항목을 묻습니다.

    | 설정                | 옵션                                                                 |
    | ------------------- | -------------------------------------------------------------------- |
    | API 리전            | `https://api.moonshot.ai/v1`(국제) 또는 `https://api.moonshot.cn/v1`(중국) |
    | 웹 검색 모델        | 기본값은 `kimi-k2.6`                                                  |

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
  <Accordion title="네이티브 사고 모드">
    Kimi K2.7 Code는 항상 네이티브 사고를 사용합니다. Moonshot은 클라이언트가 이 모델에 대해 `thinking` 필드를 생략하도록 요구하므로 OpenClaw은 `on`만 노출하고 오래된 `off` 설정은 무시합니다. 또한 K2.7에서는 `temperature`, `top_p`, `n`, `presence_penalty`, `frequency_penalty`가 고정되므로 OpenClaw은 해당 필드에 구성된 재정의를 생략합니다.

    다른 Moonshot Kimi 모델은 이진 네이티브 사고를 지원합니다.

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

    OpenClaw은 해당 모델의 런타임 `/think` 수준을 다음과 같이 매핑합니다.

    | `/think` 수준        | Moonshot 동작              |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | `off`가 아닌 모든 수준 | `thinking.type=enabled`  |

    <Warning>
    Moonshot 사고가 활성화되면 `tool_choice`는 `auto` 또는 `none`이어야 합니다. 고정된 도구 선택(`type: "tool"` 또는 `type: "function"`)은 요청된 도구가 계속 실행되도록 사고를 다시 `disabled`로 강제하며, `tool_choice: "required"`는 대신 `auto`로 정규화됩니다. 이는 사고 모드를 비활성화할 수 없는 Kimi K2.7 Code를 제외한 모든 Moonshot 모델에 적용됩니다. Kimi K2.7 Code의 `tool_choice`는 호환되지 않을 때 `auto`로 정규화됩니다.
    </Warning>

    Kimi K2.6은 여러 턴에 걸친 `reasoning_content` 보존을 제어하는 선택적 `thinking.keep` 필드도 지원합니다. 전체 추론을 턴 간에 유지하려면 `"all"`로 설정하고, 서버 기본 전략을 사용하려면 생략하거나 `null`로 두십시오. OpenClaw는 `moonshot/kimi-k2.6`에만 `thinking.keep`을 전달하며 다른 모델에서는 이를 제거합니다. Kimi K2.7 Code는 기본적으로 전체 추론 기록을 보존하는 반면, OpenClaw는 `thinking` 필드 전체를 생략합니다.

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
    Moonshot Kimi는 `functions.<name>:<index>` 형식의 네이티브 tool_call ID를 제공합니다. OpenClaw는 각 네이티브 Kimi ID의 첫 번째 항목을 보존하고 이후 중복 항목을 결정론적인 OpenAI 스타일의 `call_*` ID로 다시 작성합니다. 일치하는 도구 결과에도 동일한 ID를 다시 매핑하므로 Kimi의 첫 번째 네이티브 ID를 제거하지 않고도 재실행 시 고유성이 유지됩니다. 이 동작은 번들 Moonshot 제공자에 내장되어 있으며 사용자가 구성할 수 있는 설정이 아닙니다.
  </Accordion>

  <Accordion title="스트리밍 사용량 호환성">
    네이티브 Moonshot 엔드포인트(`https://api.moonshot.ai/v1` 및
    `https://api.moonshot.cn/v1`)는 스트리밍 사용량 호환성을 지원한다고 명시합니다.
    OpenClaw는 이를 제공자 ID가 아닌 엔드포인트 호스트를 기준으로 판단하므로, 동일한
    네이티브 Moonshot 호스트를 가리키는 사용자 지정 제공자 ID에도 동일한 스트리밍
    사용량 동작이 적용됩니다.

    카탈로그의 K2.6 가격을 사용할 경우 입력, 출력 및 캐시 읽기 토큰이 포함된
    스트리밍 사용량은 `/status`, `/usage full`, `/usage cost` 및 트랜스크립트를
    기반으로 한 세션 계산을 위한 로컬 추정 USD 비용으로도 변환됩니다.

  </Accordion>

  <Accordion title="엔드포인트 및 모델 참조 레퍼런스">
    | 제공자   | 모델 참조 접두사 | 엔드포인트                      | 인증 환경 변수        |
    | ---------- | ---------------- | ------------------------------ | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Kimi Coding 엔드포인트           | `KIMI_API_KEY`      |
    | 웹 검색 | 해당 없음              | Moonshot API와 동일한 리전    | `KIMI_API_KEY` 또는 `MOONSHOT_API_KEY` |

    - Kimi 웹 검색은 `KIMI_API_KEY` 또는 `MOONSHOT_API_KEY`를 사용하며, 기본 엔드포인트는 `https://api.moonshot.ai/v1`, 기본 모델은 `kimi-k2.6`입니다.
    - 필요한 경우 `models.providers`에서 가격 및 컨텍스트 메타데이터를 재정의하십시오.
    - Moonshot이 모델에 다른 컨텍스트 한도를 게시하는 경우 이에 맞게 `contextWindow`를 조정하십시오.

  </Accordion>
</AccordionGroup>

## 관련 문서

<CardGroup cols={2}>
  <Card title="모델 선택" href="/ko/concepts/model-providers" icon="layers">
    제공자, 모델 참조 및 장애 조치 동작을 선택하는 방법입니다.
  </Card>
  <Card title="웹 검색" href="/ko/tools/web" icon="magnifying-glass">
    Kimi를 포함한 웹 검색 제공자를 구성하는 방법입니다.
  </Card>
  <Card title="구성 레퍼런스" href="/ko/gateway/configuration-reference" icon="gear">
    제공자, 모델 및 Plugin의 전체 구성 스키마입니다.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Moonshot API 키 관리 및 문서입니다.
  </Card>
</CardGroup>
