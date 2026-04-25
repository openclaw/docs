---
read_when:
    - 새 모델 provider Plugin을 빌드하고 있습니다
    - OpenAI 호환 프록시 또는 사용자 지정 LLM을 OpenClaw에 추가하려고 합니다
    - provider auth, 카탈로그 및 런타임 hook을 이해해야 합니다
sidebarTitle: Provider plugins
summary: OpenClaw용 모델 provider Plugin 빌드를 위한 단계별 가이드
title: provider Plugin 빌드하기
x-i18n:
    generated_at: "2026-04-25T18:20:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: c31f73619aa8fecf1b409bbd079683fae9ba996dd6ce22bd894b47cc76d5e856
    source_path: plugins/sdk-provider-plugins.md
    workflow: 15
---

이 가이드는 OpenClaw에 모델 provider
(LLM)를 추가하는 provider Plugin 빌드 과정을 안내합니다. 이 가이드를 마치면 모델 카탈로그,
API 키 auth 및 동적 모델 해석 기능을 갖춘 provider를 갖게 됩니다.

<Info>
  아직 OpenClaw Plugin을 한 번도 만들어 본 적이 없다면,
  기본 패키지 구조와 manifest 설정을 위해 먼저
  [시작하기](/ko/plugins/building-plugins)를 읽으세요.
</Info>

<Tip>
  provider Plugin은 OpenClaw의 일반 추론 루프에 모델을 추가합니다. 모델이
  스레드, Compaction 또는 도구 이벤트를 소유하는 네이티브 에이전트 데몬을 통해 실행되어야 한다면,
  데몬 프로토콜 세부 정보를 코어에 넣는 대신 provider를 [agent harness](/ko/plugins/sdk-agent-harness)와
  함께 사용하세요.
</Tip>

## 단계별 안내

<Steps>
  <Step title="패키지 및 manifest">
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
      "description": "Acme AI 모델 provider",
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
          "choiceLabel": "Acme AI API 키",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme AI API 키"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    manifest는 `providerAuthEnvVars`를 선언하므로 OpenClaw가
    Plugin 런타임을 로드하지 않고도 자격 증명을 감지할 수 있습니다. provider variant가 다른 provider id의 auth를 재사용해야 하면
    `providerAuthAliases`를 추가하세요. `modelSupport`
    는 선택 사항이며 런타임 hook이 존재하기 전에 `acme-large`와 같은 축약 모델 ID에서
    OpenClaw가 provider Plugin을 자동 로드할 수 있게 해줍니다. ClawHub에 provider를 게시하는 경우,
    `package.json`에 있는 해당 `openclaw.compat` 및 `openclaw.build` 필드는
    필수입니다.

  </Step>

  <Step title="provider 등록">
    최소한의 provider에는 `id`, `label`, `auth`, `catalog`가 필요합니다:

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
              hint: "Acme AI 대시보드의 API 키",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Acme AI API 키를 입력하세요",
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
    모델로 `acme-ai/acme-large`를 선택할 수 있습니다.

    업스트림 provider가 OpenClaw와 다른 제어 토큰을 사용한다면, 스트림 경로를 교체하는 대신
    작은 양방향 텍스트 변환을 추가하세요:

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

    `input`은 전송 전에 최종 시스템 프롬프트와 텍스트 메시지 내용을 다시 씁니다.
    `output`은 OpenClaw가 자체 제어 마커 또는 채널 전달을 파싱하기 전에
    assistant 텍스트 델타와 최종 텍스트를 다시 씁니다.

    API 키 auth와 단일 catalog 기반 런타임만 등록하는 번들 provider의 경우,
    더 좁은 범위의 `defineSingleProviderPluginEntry(...)`
    헬퍼를 사용하는 것이 좋습니다:

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
            hint: "Acme AI 대시보드의 API 키",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Acme AI API 키를 입력하세요",
            defaultModel: "acme-ai/acme-large",
          },
        ],
        catalog: {
          buildProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
          buildStaticProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    `buildProvider`는 OpenClaw가 실제
    provider auth를 해석할 수 있을 때 사용하는 라이브 catalog 경로입니다. provider별 discovery를 수행할 수 있습니다.
    `buildStaticProvider`는 auth가
    구성되기 전에 안전하게 표시할 수 있는 오프라인 행에만 사용하세요. 자격 증명이 필요하거나 네트워크 요청을 만들어서는 안 됩니다.
    OpenClaw의 `models list --all` 표시는 현재 빈 config, 빈 env, 에이전트/워크스페이스 경로 없음 상태에서
    번들 provider Plugin에 대해서만 정적 catalog를 실행합니다.

    auth 흐름이 온보딩 중 `models.providers.*`, aliases, 에이전트 기본 모델도
    패치해야 한다면,
    `openclaw/plugin-sdk/provider-onboard`의 preset 헬퍼를 사용하세요. 가장 좁은 범위의 헬퍼는
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)`, 그리고
    `createModelCatalogPresetAppliers(...)`입니다.

    provider의 네이티브 엔드포인트가 일반 `openai-completions` 전송에서 streamed usage block을 지원한다면,
    provider-id 검사를 하드코딩하는 대신
    `openclaw/plugin-sdk/provider-catalog-shared`의 공용 catalog 헬퍼를 사용하는 것이 좋습니다.
    `supportsNativeStreamingUsageCompat(...)` 및
    `applyProviderNativeStreamingUsageCompat(...)`는
    엔드포인트 capability 맵에서 지원 여부를 감지하므로, 네이티브 Moonshot/DashScope 스타일 엔드포인트도 Plugin이 사용자 지정 provider id를 사용할 때
    여전히 opt-in할 수 있습니다.

  </Step>

  <Step title="동적 모델 해석 추가">
    provider가 임의의 모델 ID(예: 프록시 또는 라우터)를 허용한다면,
    `resolveDynamicModel`을 추가하세요:

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

    해석에 네트워크 호출이 필요하면, 비동기
    워밍업을 위해 `prepareDynamicModel`을 사용하세요 — 완료 후 `resolveDynamicModel`이 다시 실행됩니다.

  </Step>

  <Step title="런타임 hook 추가(필요 시)">
    대부분의 provider에는 `catalog` + `resolveDynamicModel`만 필요합니다. provider에 필요해질 때
    hook을 점진적으로 추가하세요.

    이제 공용 헬퍼 빌더가 가장 일반적인 replay/tool-compat
    계열을 다루므로, 일반적으로 Plugin이 각 hook을 하나씩 직접 연결할 필요가 없습니다:

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

    | 계열 | 연결되는 내용 | 번들 예시 |
    | --- | --- | --- |
    | `openai-compatible` | OpenAI 호환 전송을 위한 공용 OpenAI 스타일 replay 정책. 여기에는 tool-call-id 정리, assistant 우선 순서 수정, 전송에 필요할 때의 일반 Gemini turn 유효성 검사가 포함됩니다 | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | `modelId`로 선택되는 Claude 인지 replay 정책. 따라서 Anthropic-message 전송은 해석된 모델이 실제 Claude ID일 때만 Claude 전용 thinking-block 정리를 적용받습니다 | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | 네이티브 Gemini replay 정책과 bootstrap replay 정리 및 태그 지정된 reasoning-output 모드 | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | OpenAI 호환 프록시 전송을 통해 실행되는 Gemini 모델용 Gemini thought-signature 정리. 네이티브 Gemini replay 유효성 검사 또는 bootstrap 재작성은 활성화하지 않습니다 | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | 하나의 Plugin에서 Anthropic-message와 OpenAI 호환 모델 표면을 혼합하는 provider를 위한 하이브리드 정책. 선택적인 Claude 전용 thinking-block 제거는 Anthropic 측에만 한정됩니다 | `minimax` |

    현재 사용 가능한 stream 계열:

    | 계열 | 연결되는 내용 | 번들 예시 |
    | --- | --- | --- |
    | `google-thinking` | 공용 스트림 경로에서 Gemini thinking payload 정규화 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 공용 프록시 스트림 경로에서 Kilo reasoning 래퍼, `kilo/auto` 및 지원되지 않는 프록시 reasoning ID는 주입된 thinking을 건너뜀 | `kilocode` |
    | `moonshot-thinking` | config + `/think` 수준에서 Moonshot 바이너리 native-thinking payload 매핑 | `moonshot` |
    | `minimax-fast-mode` | 공용 스트림 경로에서 MiniMax fast-mode 모델 재작성 | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 공용 네이티브 OpenAI/Codex Responses 래퍼: attribution 헤더, `/fast`/`serviceTier`, 텍스트 verbosity, 네이티브 Codex web search, reasoning-compat payload shaping, Responses 컨텍스트 관리 | `openai`, `openai-codex` |
    | `openrouter-thinking` | 프록시 경로용 OpenRouter reasoning 래퍼, 지원되지 않는 모델/`auto` 건너뛰기는 중앙에서 처리 | `openrouter` |
    | `tool-stream-default-on` | Z.AI 같은 provider에서 명시적으로 비활성화하지 않는 한 tool streaming을 사용하도록 하는 기본 활성화 `tool_stream` 래퍼 | `zai` |

    <Accordion title="계열 빌더를 구동하는 SDK seam">
      각 계열 빌더는 같은 패키지에서 export되는 더 낮은 수준의 공개 헬퍼로 구성되며, provider가 공통 패턴에서 벗어나야 할 때 이를 사용할 수 있습니다:

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)`, 그리고 원시 replay 빌더(`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). 또한 Gemini replay 헬퍼(`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`)와 endpoint/model 헬퍼(`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`)도 export합니다.
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, 그리고 공용 OpenAI/Codex 래퍼(`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), DeepSeek V4 OpenAI 호환 래퍼(`createDeepSeekV4OpenAICompatibleThinkingWrapper`), 공용 proxy/provider 래퍼(`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, 기본 Gemini schema 헬퍼(`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`), 그리고 xAI compat 헬퍼(`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). 번들 xAI Plugin은 xAI 규칙의 소유권을 provider에 유지하기 위해 이들과 함께 `normalizeResolvedModel` + `contributeResolvedModelCompat`를 사용합니다.

      일부 stream 헬퍼는 의도적으로 provider 로컬로 유지됩니다. `@openclaw/anthropic-provider`는 Claude OAuth beta 처리와 `context1m` 게이팅을 인코딩하기 때문에 `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, 더 낮은 수준의 Anthropic 래퍼 빌더를 자체 공개 `api.ts` / `contract-api.ts` seam에 보관합니다. xAI Plugin도 마찬가지로 네이티브 xAI Responses shaping을 자체 `wrapStreamFn` 안에 유지합니다(`(/fast` aliases, 기본 `tool_stream`, 지원되지 않는 strict-tool 정리, xAI 전용 reasoning-payload 제거).

      동일한 패키지 루트 패턴은 `@openclaw/openai-provider`(provider 빌더, 기본 모델 헬퍼, realtime provider 빌더)와 `@openclaw/openrouter-provider`(provider 빌더와 onboarding/config 헬퍼)도 지원합니다.
    </Accordion>

    <Tabs>
      <Tab title="토큰 교환">
        각 추론 호출 전에 토큰 교환이 필요한 provider의 경우:

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
      <Tab title="사용자 지정 헤더">
        사용자 지정 요청 헤더 또는 본문 수정이 필요한 provider의 경우:

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
        일반 HTTP 또는 WebSocket 전송에서 네이티브 요청/세션 헤더 또는 메타데이터가 필요한 provider의 경우:

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
        사용량/과금 데이터를 노출하는 provider의 경우:

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
      OpenClaw는 다음 순서로 hook을 호출합니다. 대부분의 provider는 2~3개만 사용합니다:

      | # | Hook | 사용 시점 |
      | --- | --- | --- |
      | 1 | `catalog` | 모델 catalog 또는 base URL 기본값 |
      | 2 | `applyConfigDefaults` | config materialization 중 provider 소유 전역 기본값 |
      | 3 | `normalizeModelId` | 조회 전 레거시/preview model-id alias 정리 |
      | 4 | `normalizeTransport` | 일반 모델 조립 전 provider 계열 `api` / `baseUrl` 정리 |
      | 5 | `normalizeConfig` | `models.providers.<id>` config 정규화 |
      | 6 | `applyNativeStreamingUsageCompat` | config provider용 네이티브 streaming-usage compat 재작성 |
      | 7 | `resolveConfigApiKey` | provider 소유 env-marker auth 해석 |
      | 8 | `resolveSyntheticAuth` | 로컬/self-hosted 또는 config 기반 synthetic auth |
      | 9 | `shouldDeferSyntheticProfileAuth` | synthetic 저장 프로필 placeholder를 env/config auth 뒤로 낮춤 |
      | 10 | `resolveDynamicModel` | 임의의 업스트림 모델 ID 허용 |
      | 11 | `prepareDynamicModel` | 해석 전 비동기 메타데이터 가져오기 |
      | 12 | `normalizeResolvedModel` | runner 이전 전송 재작성 |
      | 13 | `contributeResolvedModelCompat` | 다른 호환 전송 뒤에 있는 vendor 모델용 compat 플래그 |
      | 14 | `capabilities` | 레거시 정적 capability bag; 호환성 전용 |
      | 15 | `normalizeToolSchemas` | 등록 전 provider 소유 tool-schema 정리 |
      | 16 | `inspectToolSchemas` | provider 소유 tool-schema 진단 |
      | 17 | `resolveReasoningOutputMode` | 태그 지정 vs 네이티브 reasoning-output 계약 |
      | 18 | `prepareExtraParams` | 기본 요청 params |
      | 19 | `createStreamFn` | 완전 사용자 지정 StreamFn 전송 |
      | 20 | `wrapStreamFn` | 일반 스트림 경로의 사용자 지정 헤더/본문 래퍼 |
      | 21 | `resolveTransportTurnState` | 네이티브 턴별 헤더/메타데이터 |
      | 22 | `resolveWebSocketSessionPolicy` | 네이티브 WS 세션 헤더/쿨다운 |
      | 23 | `formatApiKey` | 사용자 지정 런타임 토큰 형태 |
      | 24 | `refreshOAuth` | 사용자 지정 OAuth 갱신 |
      | 25 | `buildAuthDoctorHint` | auth 복구 안내 |
      | 26 | `matchesContextOverflowError` | provider 소유 overflow 감지 |
      | 27 | `classifyFailoverReason` | provider 소유 rate-limit/overload 분류 |
      | 28 | `isCacheTtlEligible` | 프롬프트 캐시 TTL 게이팅 |
      | 29 | `buildMissingAuthMessage` | 사용자 지정 누락 auth 힌트 |
      | 30 | `suppressBuiltInModel` | 오래된 업스트림 행 숨기기 |
      | 31 | `augmentModelCatalog` | synthetic forward-compat 행 |
      | 32 | `resolveThinkingProfile` | 모델별 `/think` 옵션 세트 |
      | 33 | `isBinaryThinking` | 바이너리 thinking on/off 호환성 |
      | 34 | `supportsXHighThinking` | `xhigh` reasoning 지원 호환성 |
      | 35 | `resolveDefaultThinkingLevel` | 기본 `/think` 정책 호환성 |
      | 36 | `isModernModelRef` | live/smoke 모델 매칭 |
      | 37 | `prepareRuntimeAuth` | 추론 전 토큰 교환 |
      | 38 | `resolveUsageAuth` | 사용자 지정 사용량 자격 증명 파싱 |
      | 39 | `fetchUsageSnapshot` | 사용자 지정 사용량 endpoint |
      | 40 | `createEmbeddingProvider` | memory/search용 provider 소유 embedding adapter |
      | 41 | `buildReplayPolicy` | 사용자 지정 transcript replay/Compaction 정책 |
      | 42 | `sanitizeReplayHistory` | 일반 정리 후 provider 전용 replay 재작성 |
      | 43 | `validateReplayTurns` | embedded runner 이전 strict replay-turn 유효성 검사 |
      | 44 | `onModelSelected` | 선택 후 콜백(예: telemetry) |

      런타임 fallback 참고 사항:

      - `normalizeConfig`는 먼저 일치하는 provider를 확인한 다음, 실제로 config를 변경할 때까지 hook 가능 provider Plugin을 확인합니다. 어떤 provider hook도 지원되는 Google 계열 config 항목을 재작성하지 않으면, 번들 Google config normalizer가 계속 적용됩니다.
      - `resolveConfigApiKey`는 노출된 경우 provider hook을 사용합니다. 번들 `amazon-bedrock` 경로도 여기에서 내장 AWS env-marker resolver를 갖지만, Bedrock 런타임 auth 자체는 여전히 AWS SDK 기본 체인을 사용합니다.
      - `resolveSystemPromptContribution`을 사용하면 provider가 모델 계열에 대해 캐시 인식 시스템 프롬프트 안내를 주입할 수 있습니다. 동작이 특정 provider/모델 계열에 속하고 안정적/동적 캐시 분리를 유지해야 한다면 `before_prompt_build`보다 이것을 우선하세요.

      자세한 설명과 실제 예시는 [Internals: Provider Runtime Hooks](/ko/plugins/architecture-internals#provider-runtime-hooks)를 참조하세요.
    </Accordion>

  </Step>

  <Step title="추가 capability 추가(선택 사항)">
    provider Plugin은 텍스트 추론과 함께 음성, realtime transcription, realtime
    voice, 미디어 이해, 이미지 생성, 비디오 생성, web fetch,
    web search를 등록할 수 있습니다. OpenClaw는 이를
    **hybrid-capability** Plugin으로 분류하며, 이는 회사 Plugin에 권장되는 패턴입니다
    (벤더당 하나의 Plugin). 자세한 내용은
    [Internals: Capability Ownership](/ko/plugins/architecture#capability-ownership-model)을 참조하세요.

    기존 `api.registerProvider(...)` 호출과 함께 `register(api)` 내부에서
    각 capability를 등록하세요. 필요한 탭만 선택하세요:

    <Tabs>
      <Tab title="음성(TTS)">
        ```typescript
        import {
          assertOkOrThrowProviderError,
          postJsonRequest,
        } from "openclaw/plugin-sdk/provider-http";

        api.registerSpeechProvider({
          id: "acme-ai",
          label: "Acme Speech",
          isConfigured: ({ config }) => Boolean(config.messages?.tts),
          synthesize: async (req) => {
            const { response, release } = await postJsonRequest({
              url: "https://api.example.com/v1/speech",
              headers: new Headers({ "Content-Type": "application/json" }),
              body: { text: req.text },
              timeoutMs: req.timeoutMs,
              fetchFn: fetch,
              auditContext: "acme speech",
            });
            try {
              await assertOkOrThrowProviderError(response, "Acme Speech API error");
              return {
                audioBuffer: Buffer.from(await response.arrayBuffer()),
                outputFormat: "mp3",
                fileExtension: ".mp3",
                voiceCompatible: false,
              };
            } finally {
              await release();
            }
          },
        });
        ```

        provider HTTP 실패에는 `assertOkOrThrowProviderError(...)`를 사용하세요.
        이렇게 하면 Plugin이 제한된 error-body 읽기, JSON 오류 파싱,
        request-id 접미사를 공통으로 사용합니다.
      </Tab>
      <Tab title="realtime transcription">
        `createRealtimeTranscriptionWebSocketSession(...)` 사용을 권장합니다 —
        이 공용 헬퍼는 프록시 캡처, 재연결 백오프, 종료 시 플러시, 준비 핸드셰이크,
        오디오 큐잉, 종료 이벤트 진단을 처리합니다. Plugin은 업스트림 이벤트만 매핑하면 됩니다.

        ```typescript
        api.registerRealtimeTranscriptionProvider({
          id: "acme-ai",
          label: "Acme Realtime Transcription",
          isConfigured: () => true,
          createSession: (req) => {
            const apiKey = String(req.providerConfig.apiKey ?? "");
            return createRealtimeTranscriptionWebSocketSession({
              providerId: "acme-ai",
              callbacks: req,
              url: "wss://api.example.com/v1/realtime-transcription",
              headers: { Authorization: `Bearer ${apiKey}` },
              onMessage: (event, transport) => {
                if (event.type === "session.created") {
                  transport.sendJson({ type: "session.update" });
                  transport.markReady();
                  return;
                }
                if (event.type === "transcript.final") {
                  req.onTranscript?.(event.text);
                }
              },
              sendAudio: (audio, transport) => {
                transport.sendJson({
                  type: "audio.append",
                  audio: audio.toString("base64"),
                });
              },
              onClose: (transport) => {
                transport.sendJson({ type: "audio.end" });
              },
            });
          },
        });
        ```

        multipart 오디오를 POST하는 배치 STT provider는
        `openclaw/plugin-sdk/provider-http`의
        `buildAudioTranscriptionFormData(...)`를 사용해야 합니다. 이 헬퍼는 업로드
        파일 이름을 정규화하며, 여기에는 호환되는 transcription API를 위해 M4A 스타일 파일 이름이 필요한
        AAC 업로드도 포함됩니다.
      </Tab>
      <Tab title="Realtime voice">
        ```typescript
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
        ```
      </Tab>
      <Tab title="미디어 이해">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="이미지 및 비디오 생성">
        비디오 capability는 **모드 인식** 형태를 사용합니다: `generate`,
        `imageToVideo`, `videoToVideo`. `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` 같은
        평면 집계 필드만으로는 transform 모드 지원 또는 비활성화된 모드를 깔끔하게
        알릴 수 없습니다.
        음악 생성도 명시적인 `generate` /
        `edit` 블록을 사용하는 동일한 패턴을 따릅니다.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* image result */ }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          capabilities: {
            generate: { maxVideos: 1, maxDurationSeconds: 10, supportsResolution: true },
            imageToVideo: { enabled: true, maxVideos: 1, maxInputImages: 1, maxDurationSeconds: 5 },
            videoToVideo: { enabled: false },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```
      </Tab>
      <Tab title="Web fetch 및 검색">
        ```typescript
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
        ```
      </Tab>
    </Tabs>

  </Step>

  <Step title="테스트">
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

      it("키를 사용할 수 있으면 catalog를 반환한다", async () => {
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

provider Plugin은 다른 외부 코드 Plugin과 동일한 방식으로 게시됩니다:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

여기서는 레거시 skill 전용 게시 별칭을 사용하지 마세요. Plugin 패키지는
`clawhub package publish`를 사용해야 합니다.

## 파일 구조

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers 메타데이터
├── openclaw.plugin.json      # provider auth 메타데이터가 포함된 Manifest
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # 테스트
    └── usage.ts              # 사용량 endpoint (선택 사항)
```

## Catalog 순서 참조

`catalog.order`는 기본 제공
provider에 비해 catalog가 병합되는 시점을 제어합니다:

| 순서      | 시점          | 사용 사례                                      |
| --------- | ------------- | ---------------------------------------------- |
| `simple`  | 첫 번째 패스  | 일반 API 키 provider                           |
| `profile` | simple 이후   | auth 프로필로 제어되는 provider                |
| `paired`  | profile 이후  | 여러 관련 항목을 합성                          |
| `late`    | 마지막 패스   | 기존 provider override(충돌 시 우선 적용)      |

## 다음 단계

- [채널 Plugin](/ko/plugins/sdk-channel-plugins) — Plugin이 채널도 제공하는 경우
- [SDK Runtime](/ko/plugins/sdk-runtime) — `api.runtime` 헬퍼(TTS, search, subagent)
- [SDK 개요](/ko/plugins/sdk-overview) — 전체 하위 경로 import 참조
- [Plugin Internals](/ko/plugins/architecture-internals#provider-runtime-hooks) — hook 세부 정보 및 번들 예시

## 관련 항목

- [Plugin SDK 설정](/ko/plugins/sdk-setup)
- [Plugin 빌드하기](/ko/plugins/building-plugins)
- [채널 Plugin 빌드하기](/ko/plugins/sdk-channel-plugins)
