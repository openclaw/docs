---
read_when:
    - 새 모델 provider 플러그인을 빌드하고 있습니다.
    - OpenAI 호환 프록시 또는 커스텀 LLM을 OpenClaw에 추가하려고 합니다.
    - provider 인증, 카탈로그, 그리고 런타임 hook을 이해해야 합니다.
sidebarTitle: Provider Plugins
summary: OpenClaw용 모델 provider 플러그인을 빌드하는 단계별 가이드
title: Provider 플러그인 빌드하기
x-i18n:
    generated_at: "2026-04-11T02:46:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06d7c5da6556dc3d9673a31142ff65eb67ddc97fc0c1a6f4826a2c7693ecd5e3
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

# Provider 플러그인 빌드하기

이 가이드는 OpenClaw에 모델 provider
(LLM)를 추가하는 provider 플러그인을 빌드하는 과정을 안내합니다. 이 가이드를 마치면 모델 카탈로그,
API 키 인증, 동적 모델 해석 기능이 있는 provider를 갖게 됩니다.

<Info>
  아직 OpenClaw 플러그인을 한 번도 만들어 본 적이 없다면,
  먼저 [Getting Started](/ko/plugins/building-plugins)를 읽고 기본 패키지
  구조와 매니페스트 설정을 확인하세요.
</Info>

<Tip>
  Provider 플러그인은 OpenClaw의 일반 추론 루프에 모델을 추가합니다. 모델이
  스레드, 압축, 또는 도구 이벤트를 관리하는 네이티브 에이전트 데몬을 통해 실행되어야 한다면,
  데몬 프로토콜 세부 사항을 core에 넣는 대신 [agent harness](/ko/plugins/sdk-agent-harness)와
  provider를 함께 사용하세요.
</Tip>

## 단계별 안내

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="패키지와 매니페스트">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-ai",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "providers": ["acme-ai"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-ai",
      "name": "Acme AI",
      "description": "Acme AI model provider",
      "providers": ["acme-ai"],
      "modelSupport": {
        "modelPrefixes": ["acme-"]
      },
      "providerAuthEnvVars": {
        "acme-ai": ["ACME_AI_API_KEY"]
      },
      "providerAuthAliases": {
        "acme-ai-coding": "acme-ai"
      },
      "providerAuthChoices": [
        {
          "provider": "acme-ai",
          "method": "api-key",
          "choiceId": "acme-ai-api-key",
          "choiceLabel": "Acme AI API key",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme AI API key"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    매니페스트는 `providerAuthEnvVars`를 선언하므로 OpenClaw가
    플러그인 런타임을 로드하지 않고도 자격 증명을 감지할 수 있습니다. provider 변형이 다른 provider id의 인증을 재사용해야 한다면 `providerAuthAliases`를 추가하세요. `modelSupport`
    는 선택 사항이며, 런타임 hook이 존재하기 전에 OpenClaw가 `acme-large` 같은 단축
    모델 id에서 provider 플러그인을 자동 로드할 수 있게 해줍니다. provider를
    ClawHub에 게시한다면 `package.json`의 `openclaw.compat` 및 `openclaw.build`
    필드는 필수입니다.

  </Step>

  <Step title="provider 등록">
    최소한의 provider에는 `id`, `label`, `auth`, `catalog`가 필요합니다.

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          docsPath: "/providers/acme-ai",
          envVars: ["ACME_AI_API_KEY"],

          auth: [
            createProviderApiKeyAuthMethod({
              providerId: "acme-ai",
              methodId: "api-key",
              label: "Acme AI API key",
              hint: "API key from your Acme AI dashboard",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Enter your Acme AI API key",
              defaultModel: "acme-ai/acme-large",
            }),
          ],

          catalog: {
            order: "simple",
            run: async (ctx) => {
              const apiKey =
                ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: {
                  baseUrl: "https://api.acme-ai.com/v1",
                  apiKey,
                  api: "openai-completions",
                  models: [
                    {
                      id: "acme-large",
                      name: "Acme Large",
                      reasoning: true,
                      input: ["text", "image"],
                      cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
                      contextWindow: 200000,
                      maxTokens: 32768,
                    },
                    {
                      id: "acme-small",
                      name: "Acme Small",
                      reasoning: false,
                      input: ["text"],
                      cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
                      contextWindow: 128000,
                      maxTokens: 8192,
                    },
                  ],
                },
              };
            },
          },
        });
      },
    });
    ```

    이것으로 동작하는 provider가 완성됩니다. 이제 사용자는
    `openclaw onboard --acme-ai-api-key <key>`를 실행하고
    `acme-ai/acme-large`를 자신의 모델로 선택할 수 있습니다.

    업스트림 provider가 OpenClaw와 다른 제어 토큰을 사용한다면, 스트림 경로를 교체하는 대신
    작은 양방향 텍스트 변환을 추가하세요.

    ```typescript
    api.registerTextTransforms({
      input: [
        { from: /red basket/g, to: "blue basket" },
        { from: /paper ticket/g, to: "digital ticket" },
        { from: /left shelf/g, to: "right shelf" },
      ],
      output: [
        { from: /blue basket/g, to: "red basket" },
        { from: /digital ticket/g, to: "paper ticket" },
        { from: /right shelf/g, to: "left shelf" },
      ],
    });
    ```

    `input`은 전송 전에 최종 시스템 프롬프트와 텍스트 메시지 콘텐츠를 다시 씁니다.
    `output`은 OpenClaw가 자체 제어 마커나 채널 전달을 파싱하기 전에
    어시스턴트 텍스트 델타와 최종 텍스트를 다시 씁니다.

    API 키 인증과 단일 catalog 기반 런타임만 등록하는 번들 provider의 경우,
    더 좁은 `defineSingleProviderPluginEntry(...)` 헬퍼를 우선 사용하세요.

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Acme AI API key",
            hint: "API key from your Acme AI dashboard",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Enter your Acme AI API key",
            defaultModel: "acme-ai/acme-large",
          },
        ],
        catalog: {
          buildProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    인증 흐름이 온보딩 중 `models.providers.*`, alias, 그리고
    에이전트 기본 모델도 함께 패치해야 한다면
    `openclaw/plugin-sdk/provider-onboard`의 preset 헬퍼를 사용하세요. 가장 좁은 헬퍼는
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)`, 그리고
    `createModelCatalogPresetAppliers(...)`입니다.

    provider의 네이티브 엔드포인트가 일반
    `openai-completions` 전송에서 스트리밍 usage block을 지원한다면, provider-id 검사를 하드코딩하는 대신
    `openclaw/plugin-sdk/provider-catalog-shared`의 공유 catalog 헬퍼를 우선 사용하세요.
    `supportsNativeStreamingUsageCompat(...)` 및
    `applyProviderNativeStreamingUsageCompat(...)`는 엔드포인트 capability map에서 지원 여부를 감지하므로,
    커스텀 provider id를 사용하는 플러그인에서도 네이티브 Moonshot/DashScope 스타일 엔드포인트가 여전히 opt-in할 수 있습니다.

  </Step>

  <Step title="동적 모델 해석 추가">
    provider가 임의의 모델 ID를 허용한다면(프록시 또는 router처럼)
    `resolveDynamicModel`을 추가하세요.

    ```typescript
    api.registerProvider({
      // ... 위의 id, label, auth, catalog

      resolveDynamicModel: (ctx) => ({
        id: ctx.modelId,
        name: ctx.modelId,
        provider: "acme-ai",
        api: "openai-completions",
        baseUrl: "https://api.acme-ai.com/v1",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 8192,
      }),
    });
    ```

    해석에 네트워크 호출이 필요하다면 비동기 워밍업을 위해 `prepareDynamicModel`을 사용하세요 —
    완료된 후 `resolveDynamicModel`이 다시 실행됩니다.

  </Step>

  <Step title="런타임 hook 추가(필요한 경우)">
    대부분의 provider에는 `catalog` + `resolveDynamicModel`만 필요합니다. provider에
    필요한 만큼 hook을 점진적으로 추가하세요.

    공유 헬퍼 빌더가 이제 가장 일반적인 replay/tool-compat
    계열을 다루므로, 플러그인은 보통 각 hook을 하나씩 직접 연결할 필요가 없습니다.

    ```typescript
    import { buildProviderReplayFamilyHooks } from "openclaw/plugin-sdk/provider-model-shared";
    import { buildProviderStreamFamilyHooks } from "openclaw/plugin-sdk/provider-stream";
    import { buildProviderToolCompatFamilyHooks } from "openclaw/plugin-sdk/provider-tools";

    const GOOGLE_FAMILY_HOOKS = {
      ...buildProviderReplayFamilyHooks({ family: "google-gemini" }),
      ...buildProviderStreamFamilyHooks("google-thinking"),
      ...buildProviderToolCompatFamilyHooks("gemini"),
    };

    api.registerProvider({
      id: "acme-gemini-compatible",
      // ...
      ...GOOGLE_FAMILY_HOOKS,
    });
    ```

    현재 사용 가능한 replay 계열:

    | Family | 연결되는 내용 |
    | --- | --- |
    | `openai-compatible` | OpenAI 호환 전송을 위한 공유 OpenAI 스타일 replay 정책. 여기에는 tool-call-id 정리, assistant-first 순서 수정, 전송에 필요한 경우 일반 Gemini 턴 검증이 포함됩니다 |
    | `anthropic-by-model` | `modelId`로 선택되는 Claude 인식 replay 정책. 따라서 Anthropic-message 전송은 실제로 해석된 모델이 Claude id일 때만 Claude 전용 thinking-block 정리를 적용받습니다 |
    | `google-gemini` | 네이티브 Gemini replay 정책과 bootstrap replay 정리, 그리고 태그된 reasoning-output 모드 |
    | `passthrough-gemini` | OpenAI 호환 프록시 전송을 통해 실행되는 Gemini 모델을 위한 Gemini thought-signature 정리. 네이티브 Gemini replay 검증이나 bootstrap 재작성은 활성화하지 않습니다 |
    | `hybrid-anthropic-openai` | 하나의 플러그인에서 Anthropic-message와 OpenAI 호환 모델 표면을 혼합하는 provider를 위한 하이브리드 정책. 선택적 Claude 전용 thinking-block 제거는 Anthropic 쪽에만 적용됩니다 |

    실제 번들 예시:

    - `google` 및 `google-gemini-cli`: `google-gemini`
    - `openrouter`, `kilocode`, `opencode`, `opencode-go`: `passthrough-gemini`
    - `amazon-bedrock` 및 `anthropic-vertex`: `anthropic-by-model`
    - `minimax`: `hybrid-anthropic-openai`
    - `moonshot`, `ollama`, `xai`, `zai`: `openai-compatible`

    현재 사용 가능한 stream 계열:

    | Family | 연결되는 내용 |
    | --- | --- |
    | `google-thinking` | 공유 스트림 경로에서 Gemini thinking payload 정규화 |
    | `kilocode-thinking` | 공유 프록시 스트림 경로에서 Kilo reasoning 래퍼. `kilo/auto` 및 지원되지 않는 프록시 reasoning id는 주입된 thinking을 건너뜁니다 |
    | `moonshot-thinking` | config + `/think` 수준에서 Moonshot 바이너리 native-thinking payload 매핑 |
    | `minimax-fast-mode` | 공유 스트림 경로에서 MiniMax fast-mode 모델 재작성 |
    | `openai-responses-defaults` | 공유 네이티브 OpenAI/Codex Responses 래퍼: attribution 헤더, `/fast`/`serviceTier`, 텍스트 verbosity, 네이티브 Codex 웹 검색, reasoning-compat payload shaping, Responses 컨텍스트 관리 |
    | `openrouter-thinking` | 프록시 경로용 OpenRouter reasoning 래퍼. 지원되지 않는 모델/`auto` 건너뛰기는 중앙에서 처리 |
    | `tool-stream-default-on` | Z.AI 같은 provider를 위한 기본 활성화 `tool_stream` 래퍼. 명시적으로 비활성화하지 않는 한 도구 스트리밍을 사용합니다 |

    실제 번들 예시:

    - `google` 및 `google-gemini-cli`: `google-thinking`
    - `kilocode`: `kilocode-thinking`
    - `moonshot`: `moonshot-thinking`
    - `minimax` 및 `minimax-portal`: `minimax-fast-mode`
    - `openai` 및 `openai-codex`: `openai-responses-defaults`
    - `openrouter`: `openrouter-thinking`
    - `zai`: `tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared`는 replay-family
    enum과 해당 family가 기반으로 삼는 공유 헬퍼도 export합니다. 일반적인 공개 export는
    다음과 같습니다.

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - `buildOpenAICompatibleReplayPolicy(...)`,
      `buildAnthropicReplayPolicyForModel(...)`,
      `buildGoogleGeminiReplayPolicy(...)`, 그리고
      `buildHybridAnthropicOrOpenAIReplayPolicy(...)` 같은 공유 replay 빌더
    - `sanitizeGoogleGeminiReplayHistory(...)`
      및 `resolveTaggedReasoningOutputMode()` 같은 Gemini replay 헬퍼
    - `resolveProviderEndpoint(...)`,
      `normalizeProviderId(...)`, `normalizeGooglePreviewModelId(...)`, 그리고
      `normalizeNativeXaiModelId(...)` 같은 endpoint/model 헬퍼

    `openclaw/plugin-sdk/provider-stream`는 family builder와
    해당 family가 재사용하는 공개 wrapper 헬퍼를 모두 노출합니다. 일반적인 공개 export는
    다음과 같습니다.

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - 다음과 같은 공유 OpenAI/Codex wrapper
      `createOpenAIAttributionHeadersWrapper(...)`,
      `createOpenAIFastModeWrapper(...)`,
      `createOpenAIServiceTierWrapper(...)`,
      `createOpenAIResponsesContextManagementWrapper(...)`, 그리고
      `createCodexNativeWebSearchWrapper(...)`
    - `createOpenRouterWrapper(...)`,
      `createToolStreamWrapper(...)`, `createMinimaxFastModeWrapper(...)` 같은
      공유 프록시/provider wrapper

    일부 stream 헬퍼는 의도적으로 provider 로컬에 남겨둡니다. 현재 번들
    예시: `@openclaw/anthropic-provider`는
    공개 `api.ts` /
    `contract-api.ts` 경계를 통해 `wrapAnthropicProviderStream`, `resolveAnthropicBetas`,
    `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, 그리고
    더 낮은 수준의 Anthropic wrapper builder를 export합니다. 이 헬퍼들은
    Claude OAuth beta 처리와 `context1m` 게이팅도 함께 인코딩하므로
    Anthropic 전용으로 유지됩니다.

    다른 번들 provider도 동작이 family 간에
    깔끔하게 공유되지 않는 경우 전송별 wrapper를 로컬에 유지합니다. 현재 예시:
    번들 xAI 플러그인은 네이티브 xAI Responses shaping을 자체
    `wrapStreamFn` 안에 유지하며, 여기에는 `/fast` alias 재작성, 기본 `tool_stream`,
    지원되지 않는 strict-tool 정리, 그리고 xAI 전용 reasoning-payload
    제거가 포함됩니다.

    `openclaw/plugin-sdk/provider-tools`는 현재 하나의 공유
    tool-schema family와 공유 schema/compat 헬퍼를 노출합니다.

    - `ProviderToolCompatFamily`는 현재의 공유 family 목록을 문서화합니다.
    - `buildProviderToolCompatFamilyHooks("gemini")`는 Gemini 안전 tool schema가 필요한 provider를 위해 Gemini schema
      정리 + 진단을 연결합니다.
    - `normalizeGeminiToolSchemas(...)`와 `inspectGeminiToolSchemas(...)`는
      기초가 되는 공개 Gemini schema 헬퍼입니다.
    - `resolveXaiModelCompatPatch()`는 번들 xAI compat 패치를 반환합니다:
      `toolSchemaProfile: "xai"`, 지원되지 않는 schema 키워드, 네이티브
      `web_search` 지원, 그리고 HTML entity 도구 호출 인자 디코딩입니다.
    - `applyXaiModelCompat(model)`은 실행기에 전달되기 전에
      해석된 모델에 동일한 xAI compat 패치를 적용합니다.

    실제 번들 예시: xAI 플러그인은 `normalizeResolvedModel`과
    `contributeResolvedModelCompat`를 사용해 해당 compat 메타데이터를
    core에 xAI 규칙을 하드코딩하는 대신 provider가 소유하도록 유지합니다.

    동일한 package-root 패턴은 다른 번들 provider에도 적용됩니다.

    - `@openclaw/openai-provider`: `api.ts`는 provider builder,
      default-model 헬퍼, realtime provider builder를 export합니다
    - `@openclaw/openrouter-provider`: `api.ts`는 provider builder와
      온보딩/config 헬퍼를 export합니다

    <Tabs>
      <Tab title="토큰 교환">
        매 추론 호출 전에 토큰 교환이 필요한 provider의 경우:

        ```typescript
        prepareRuntimeAuth: async (ctx) => {
          const exchanged = await exchangeToken(ctx.apiKey);
          return {
            apiKey: exchanged.token,
            baseUrl: exchanged.baseUrl,
            expiresAt: exchanged.expiresAt,
          };
        },
        ```
      </Tab>
      <Tab title="커스텀 헤더">
        커스텀 요청 헤더 또는 body 수정이 필요한 provider의 경우:

        ```typescript
        // wrapStreamFn은 ctx.streamFn에서 파생된 StreamFn을 반환합니다
        wrapStreamFn: (ctx) => {
          if (!ctx.streamFn) return undefined;
          const inner = ctx.streamFn;
          return async (params) => {
            params.headers = {
              ...params.headers,
              "X-Acme-Version": "2",
            };
            return inner(params);
          };
        },
        ```
      </Tab>
      <Tab title="네이티브 전송 ID">
        일반 HTTP 또는 WebSocket 전송에 네이티브 요청/세션 헤더나 메타데이터가 필요한 provider의 경우:

        ```typescript
        resolveTransportTurnState: (ctx) => ({
          headers: {
            "x-request-id": ctx.turnId,
          },
          metadata: {
            session_id: ctx.sessionId ?? "",
            turn_id: ctx.turnId,
          },
        }),
        resolveWebSocketSessionPolicy: (ctx) => ({
          headers: {
            "x-session-id": ctx.sessionId ?? "",
          },
          degradeCooldownMs: 60_000,
        }),
        ```
      </Tab>
      <Tab title="사용량 및 과금">
        사용량/과금 데이터를 제공하는 provider의 경우:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```
      </Tab>
    </Tabs>

    <Accordion title="사용 가능한 모든 provider hook">
      OpenClaw는 다음 순서로 hook을 호출합니다. 대부분의 provider는 2~3개만 사용합니다.

      | # | Hook | 사용 시점 |
      | --- | --- | --- |
      | 1 | `catalog` | 모델 카탈로그 또는 기본 `baseUrl` |
      | 2 | `applyConfigDefaults` | config materialization 중 provider 소유 전역 기본값 |
      | 3 | `normalizeModelId` | 조회 전 legacy/preview 모델 id alias 정리 |
      | 4 | `normalizeTransport` | 일반 모델 조립 전 provider-family `api` / `baseUrl` 정리 |
      | 5 | `normalizeConfig` | `models.providers.<id>` config 정규화 |
      | 6 | `applyNativeStreamingUsageCompat` | config provider용 네이티브 streaming-usage compat 재작성 |
      | 7 | `resolveConfigApiKey` | provider 소유 env-marker 인증 해석 |
      | 8 | `resolveSyntheticAuth` | 로컬/self-hosted 또는 config 기반 synthetic auth |
      | 9 | `shouldDeferSyntheticProfileAuth` | synthetic 저장 프로필 placeholder를 env/config 인증 뒤로 낮춤 |
      | 10 | `resolveDynamicModel` | 임의의 업스트림 모델 ID 허용 |
      | 11 | `prepareDynamicModel` | 해석 전 비동기 메타데이터 가져오기 |
      | 12 | `normalizeResolvedModel` | 실행기 전 transport 재작성 |

    런타임 fallback 참고 사항:

    - `normalizeConfig`는 먼저 일치하는 provider를 확인한 다음, 실제로 config를 변경하는 hook 가능 provider 플러그인을 차례로 확인합니다.
      어떤 provider hook도 지원되는 Google-family config 엔트리를 재작성하지 않으면,
      번들 Google config normalizer가 여전히 적용됩니다.
    - `resolveConfigApiKey`는 노출된 경우 provider hook을 사용합니다. 번들
      `amazon-bedrock` 경로는 여기에서 AWS env-marker resolver도 내장하고 있지만,
      Bedrock 런타임 인증 자체는 여전히 AWS SDK 기본 체인을 사용합니다.
      | 13 | `contributeResolvedModelCompat` | 다른 호환 transport 뒤의 vendor 모델용 compat 플래그 |
      | 14 | `capabilities` | legacy 정적 capability bag; 호환성 전용 |
      | 15 | `normalizeToolSchemas` | 등록 전 provider 소유 tool-schema 정리 |
      | 16 | `inspectToolSchemas` | provider 소유 tool-schema 진단 |
      | 17 | `resolveReasoningOutputMode` | 태그형 vs 네이티브 reasoning-output 계약 |
      | 18 | `prepareExtraParams` | 기본 요청 params |
      | 19 | `createStreamFn` | 완전한 커스텀 StreamFn transport |
      | 20 | `wrapStreamFn` | 일반 스트림 경로의 커스텀 헤더/body wrapper |
      | 21 | `resolveTransportTurnState` | 네이티브 턴별 헤더/메타데이터 |
      | 22 | `resolveWebSocketSessionPolicy` | 네이티브 WS 세션 헤더/쿨다운 |
      | 23 | `formatApiKey` | 커스텀 런타임 토큰 형식 |
      | 24 | `refreshOAuth` | 커스텀 OAuth 새로 고침 |
      | 25 | `buildAuthDoctorHint` | 인증 복구 가이드 |
      | 26 | `matchesContextOverflowError` | provider 소유 overflow 감지 |
      | 27 | `classifyFailoverReason` | provider 소유 rate-limit/overload 분류 |
      | 28 | `isCacheTtlEligible` | 프롬프트 캐시 TTL 게이팅 |
      | 29 | `buildMissingAuthMessage` | 커스텀 missing-auth 힌트 |
      | 30 | `suppressBuiltInModel` | 오래된 업스트림 행 숨기기 |
      | 31 | `augmentModelCatalog` | synthetic forward-compat 행 |
      | 32 | `isBinaryThinking` | 바이너리 thinking on/off |
      | 33 | `supportsXHighThinking` | `xhigh` reasoning 지원 |
      | 34 | `resolveDefaultThinkingLevel` | 기본 `/think` 정책 |
      | 35 | `isModernModelRef` | 라이브/스모크 모델 매칭 |
      | 36 | `prepareRuntimeAuth` | 추론 전 토큰 교환 |
      | 37 | `resolveUsageAuth` | 커스텀 사용량 자격 증명 파싱 |
      | 38 | `fetchUsageSnapshot` | 커스텀 사용량 엔드포인트 |
      | 39 | `createEmbeddingProvider` | memory/search용 provider 소유 embedding adapter |
      | 40 | `buildReplayPolicy` | 커스텀 대화 기록 replay/compaction 정책 |
      | 41 | `sanitizeReplayHistory` | 일반 정리 후 provider 전용 replay 재작성 |
      | 42 | `validateReplayTurns` | 임베디드 실행기 전 엄격한 replay-turn 검증 |
      | 43 | `onModelSelected` | 선택 후 콜백(예: telemetry) |

      프롬프트 튜닝 참고:

      - `resolveSystemPromptContribution`를 사용하면 provider가
        모델 family에 대해 캐시 인식 system-prompt 가이드를 주입할 수 있습니다. 이 동작이 하나의 provider/모델
        family에 속하고 안정적/동적 캐시 분리를 유지해야 한다면
        `before_prompt_build`보다 이것을 우선 사용하세요.

      자세한 설명과 실제 예시는
      [Internals: Provider Runtime Hooks](/ko/plugins/architecture#provider-runtime-hooks)를 참조하세요.
    </Accordion>

  </Step>

  <Step title="추가 기능 추가(선택 사항)">
    <a id="step-5-add-extra-capabilities"></a>
    provider 플러그인은 텍스트 추론과 함께 speech, realtime transcription, realtime
    voice, media understanding, image generation, video generation, web fetch,
    web search도 등록할 수 있습니다.

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

      api.registerSpeechProvider({
        id: "acme-ai",
        label: "Acme Speech",
        isConfigured: ({ config }) => Boolean(config.messages?.tts),
        synthesize: async (req) => ({
          audioBuffer: Buffer.from(/* PCM data */),
          outputFormat: "mp3",
          fileExtension: ".mp3",
          voiceCompatible: false,
        }),
      });

      api.registerRealtimeTranscriptionProvider({
        id: "acme-ai",
        label: "Acme Realtime Transcription",
        isConfigured: () => true,
        createSession: (req) => ({
          connect: async () => {},
          sendAudio: () => {},
          close: () => {},
          isConnected: () => true,
        }),
      });

      api.registerRealtimeVoiceProvider({
        id: "acme-ai",
        label: "Acme Realtime Voice",
        isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
        createBridge: (req) => ({
          connect: async () => {},
          sendAudio: () => {},
          setMediaTimestamp: () => {},
          submitToolResult: () => {},
          acknowledgeMark: () => {},
          close: () => {},
          isConnected: () => true,
        }),
      });

      api.registerMediaUnderstandingProvider({
        id: "acme-ai",
        capabilities: ["image", "audio"],
        describeImage: async (req) => ({ text: "A photo of..." }),
        transcribeAudio: async (req) => ({ text: "Transcript..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Acme Images",
        generate: async (req) => ({ /* image result */ }),
      });

      api.registerVideoGenerationProvider({
        id: "acme-ai",
        label: "Acme Video",
        capabilities: {
          generate: {
            maxVideos: 1,
            maxDurationSeconds: 10,
            supportsResolution: true,
          },
          imageToVideo: {
            enabled: true,
            maxVideos: 1,
            maxInputImages: 1,
            maxDurationSeconds: 5,
          },
          videoToVideo: {
            enabled: false,
          },
        },
        generateVideo: async (req) => ({ videos: [] }),
      });

      api.registerWebFetchProvider({
        id: "acme-ai-fetch",
        label: "Acme Fetch",
        hint: "Acme 렌더링 백엔드를 통해 페이지를 가져옵니다.",
        envVars: ["ACME_FETCH_API_KEY"],
        placeholder: "acme-...",
        signupUrl: "https://acme.example.com/fetch",
        credentialPath: "plugins.entries.acme.config.webFetch.apiKey",
        getCredentialValue: (fetchConfig) => fetchConfig?.acme?.apiKey,
        setCredentialValue: (fetchConfigTarget, value) => {
          const acme = (fetchConfigTarget.acme ??= {});
          acme.apiKey = value;
        },
        createTool: () => ({
          description: "Acme Fetch를 통해 페이지를 가져옵니다.",
          parameters: {},
          execute: async (args) => ({ content: [] }),
        }),
      });

      api.registerWebSearchProvider({
        id: "acme-ai-search",
        label: "Acme Search",
        search: async (req) => ({ content: [] }),
      });
    }
    ```

    OpenClaw는 이를 **hybrid-capability** 플러그인으로 분류합니다. 이는
    회사 플러그인(벤더당 하나의 플러그인)에 권장되는 패턴입니다. 자세한 내용은
    [Internals: Capability Ownership](/ko/plugins/architecture#capability-ownership-model)을 참조하세요.

    비디오 생성의 경우 위에 표시된 mode 인식 capability 형태를 우선 사용하세요.
    `generate`, `imageToVideo`, `videoToVideo`를 사용해야 합니다. `maxInputImages`,
    `maxInputVideos`, `maxDurationSeconds` 같은 평면 집계 필드만으로는
    transform 모드 지원 또는 비활성화된 모드를 깔끔하게 알리기에 충분하지 않습니다.

    음악 생성 provider도 같은 패턴을 따라야 합니다.
    프롬프트 전용 생성에는 `generate`, 참조 이미지 기반 생성에는 `edit`를 사용합니다.
    `maxInputImages`,
    `supportsLyrics`, `supportsFormat` 같은 평면 집계 필드만으로는 edit
    지원을 알리기에 충분하지 않습니다. 명시적인 `generate` / `edit` 블록이 기대되는 계약입니다.

  </Step>

  <Step title="테스트">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // index.ts 또는 별도 파일에서 provider config 객체를 export하세요
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("동적 모델을 해석한다", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("키가 있으면 catalog를 반환한다", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("키가 없으면 null catalog를 반환한다", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## ClawHub에 게시

Provider 플러그인은 다른 외부 코드 플러그인과 같은 방식으로 게시합니다.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

여기서는 legacy skill 전용 publish alias를 사용하지 마세요. 플러그인 패키지는
`clawhub package publish`를 사용해야 합니다.

## 파일 구조

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers 메타데이터
├── openclaw.plugin.json      # provider 인증 메타데이터가 있는 매니페스트
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # 테스트
    └── usage.ts              # 사용량 엔드포인트(선택 사항)
```

## Catalog order 참조

`catalog.order`는 내장 provider에 비해 catalog가 언제 병합되는지를 제어합니다.

| Order     | 시점          | 사용 사례                                      |
| --------- | ------------- | ---------------------------------------------- |
| `simple`  | 첫 번째 패스  | 일반 API 키 provider                           |
| `profile` | simple 이후   | 인증 profile에 의해 게이트되는 provider        |
| `paired`  | profile 이후  | 여러 관련 엔트리를 합성                        |
| `late`    | 마지막 패스   | 기존 provider 재정의(충돌 시 우선 적용)        |

## 다음 단계

- [Channel Plugins](/ko/plugins/sdk-channel-plugins) — 플러그인이 채널도 제공하는 경우
- [SDK Runtime](/ko/plugins/sdk-runtime) — `api.runtime` 헬퍼(TTS, 검색, subagent)
- [SDK Overview](/ko/plugins/sdk-overview) — 전체 하위 경로 import 참조
- [Plugin Internals](/ko/plugins/architecture#provider-runtime-hooks) — hook 세부 사항과 번들 예시
