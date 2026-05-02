---
read_when:
    - 새 모델 제공자 Plugin을 구축하고 있습니다
    - OpenClaw에 OpenAI 호환 프록시 또는 사용자 지정 LLM을 추가하려는 경우
    - 제공자 인증, 카탈로그, 런타임 훅을 이해해야 합니다
sidebarTitle: Provider plugins
summary: OpenClaw용 모델 제공자 Plugin을 구축하기 위한 단계별 가이드
title: 프로바이더 Plugin 구축하기
x-i18n:
    generated_at: "2026-05-02T21:10:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f9d721673bdfef0b9c1979b4b8b4c86f19d114374d6b941facb928c3574cd1b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

이 가이드는 OpenClaw에 모델 제공자(LLM)를 추가하는 제공자 Plugin을 만드는 과정을 안내합니다. 끝까지 따라 하면 모델 카탈로그, API 키 인증, 동적 모델 해석을 갖춘 제공자를 만들 수 있습니다.

<Info>
  이전에 OpenClaw Plugin을 만든 적이 없다면 먼저 기본 패키지
  구조와 매니페스트 설정을 위해
  [시작하기](/ko/plugins/building-plugins)를 읽으세요.
</Info>

<Tip>
  제공자 Plugin은 OpenClaw의 일반 추론 루프에 모델을 추가합니다. 모델이
  스레드, Compaction 또는 도구 이벤트를 소유하는 네이티브 에이전트 데몬을
  통해 실행되어야 한다면, 데몬 프로토콜 세부 정보를 코어에 넣는 대신
  제공자를 [에이전트 하네스](/ko/plugins/sdk-agent-harness)와 함께 사용하세요.
</Tip>

## 안내

<Steps>
  <Step title="Package and manifest">
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

    매니페스트는 `providerAuthEnvVars`를 선언하여 OpenClaw가 Plugin 런타임을
    로드하지 않고도 자격 증명을 감지할 수 있게 합니다. 제공자 변형이 다른
    제공자 ID의 인증을 재사용해야 할 때 `providerAuthAliases`를 추가하세요.
    `modelSupport`는 선택 사항이며, 런타임 훅이 존재하기 전에 OpenClaw가
    `acme-large` 같은 축약 모델 ID에서 제공자 Plugin을 자동 로드할 수 있게
    합니다. 제공자를 ClawHub에 게시하는 경우 `package.json`에 있는 해당
    `openclaw.compat` 및 `openclaw.build` 필드가 필요합니다.

  </Step>

  <Step title="Register the provider">
    최소 제공자에는 `id`, `label`, `auth`, `catalog`가 필요합니다.

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

    이것으로 동작하는 제공자가 완성됩니다. 이제 사용자는
    `openclaw onboard --acme-ai-api-key <key>`를 실행하고
    `acme-ai/acme-large`를 모델로 선택할 수 있습니다.

    업스트림 제공자가 OpenClaw와 다른 제어 토큰을 사용한다면 스트림 경로를
    교체하는 대신 작은 양방향 텍스트 변환을 추가하세요.

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

    `input`은 전송 전에 최종 시스템 프롬프트와 텍스트 메시지 내용을 다시
    작성합니다. `output`은 OpenClaw가 자체 제어 마커 또는 채널 전달을
    파싱하기 전에 어시스턴트 텍스트 델타와 최종 텍스트를 다시 작성합니다.

    API 키 인증과 단일 카탈로그 기반 런타임을 갖춘 하나의 텍스트 제공자만
    등록하는 번들 제공자의 경우, 더 좁은
    `defineSingleProviderPluginEntry(...)` 헬퍼를 선호하세요.

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
          buildStaticProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    `buildProvider`는 OpenClaw가 실제 제공자 인증을 해석할 수 있을 때
    사용되는 라이브 카탈로그 경로입니다. 제공자별 탐색을 수행할 수 있습니다.
    `buildStaticProvider`는 인증이 구성되기 전에 표시해도 안전한 오프라인
    행에만 사용하세요. 자격 증명을 요구하거나 네트워크 요청을 해서는 안
    됩니다. OpenClaw의 `models list --all` 표시는 현재 빈 구성, 빈 env,
    에이전트/워크스페이스 경로 없음 상태에서 번들 제공자 Plugin에 대해서만
    정적 카탈로그를 실행합니다.

    인증 흐름이 온보딩 중 `models.providers.*`, 별칭, 에이전트 기본 모델도
    패치해야 한다면 `openclaw/plugin-sdk/provider-onboard`의 프리셋 헬퍼를
    사용하세요. 가장 좁은 헬퍼는
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)`,
    `createModelCatalogPresetAppliers(...)`입니다.

    제공자의 네이티브 엔드포인트가 일반 `openai-completions` 전송에서
    스트리밍 사용량 블록을 지원하는 경우, 제공자 ID 검사를 하드코딩하는 대신
    `openclaw/plugin-sdk/provider-catalog-shared`의 공유 카탈로그 헬퍼를
    선호하세요. `supportsNativeStreamingUsageCompat(...)`와
    `applyProviderNativeStreamingUsageCompat(...)`는 엔드포인트 기능 맵에서
    지원 여부를 감지하므로, Plugin이 사용자 지정 제공자 ID를 사용하더라도
    네이티브 Moonshot/DashScope 스타일 엔드포인트가 계속 옵트인됩니다.

  </Step>

  <Step title="Add dynamic model resolution">
    제공자가 임의의 모델 ID를 허용한다면(예: 프록시 또는 라우터)
    `resolveDynamicModel`을 추가하세요.

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog from above

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

    해석에 네트워크 호출이 필요하다면 비동기 워밍업에
    `prepareDynamicModel`을 사용하세요. 완료된 뒤 `resolveDynamicModel`이
    다시 실행됩니다.

  </Step>

  <Step title="Add runtime hooks (as needed)">
    대부분의 제공자는 `catalog` + `resolveDynamicModel`만 있으면 됩니다.
    제공자에 필요해질 때마다 훅을 점진적으로 추가하세요.

    공유 헬퍼 빌더가 이제 가장 일반적인 replay/tool-compat 계열을 다루므로,
    Plugin은 보통 각 훅을 하나씩 직접 연결할 필요가 없습니다.

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

    | 계열 | 연결되는 항목 | 번들 예시 |
    | --- | --- | --- |
    | `openai-compatible` | 도구 호출 ID 정리, assistant-first 순서 수정, 전송에 필요한 경우 일반 Gemini 턴 검증을 포함한 OpenAI 호환 전송용 공유 OpenAI 스타일 replay 정책 | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | `modelId`로 선택되는 Claude 인식 replay 정책입니다. 따라서 Anthropic-message 전송은 해석된 모델이 실제로 Claude ID일 때만 Claude 전용 thinking-block 정리를 받습니다 | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | 네이티브 Gemini replay 정책과 부트스트랩 replay 정리 및 태그가 지정된 reasoning-output 모드 | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | OpenAI 호환 프록시 전송을 통해 실행되는 Gemini 모델의 Gemini thought-signature 정리입니다. 네이티브 Gemini replay 검증 또는 부트스트랩 재작성을 활성화하지 않습니다 | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | 하나의 Plugin에서 Anthropic-message와 OpenAI 호환 모델 표면을 혼합하는 제공자를 위한 하이브리드 정책입니다. 선택적 Claude 전용 thinking-block 삭제는 Anthropic 쪽으로 범위가 유지됩니다 | `minimax` |

    현재 사용 가능한 스트림 계열:

    | 제품군 | 연결하는 항목 | 번들 예시 |
    | --- | --- | --- |
    | `google-thinking` | 공유 스트림 경로에서 Gemini thinking 페이로드 정규화 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 공유 프록시 스트림 경로에서 Kilo reasoning 래퍼. `kilo/auto`와 지원되지 않는 프록시 reasoning ID는 주입된 thinking을 건너뜀 | `kilocode` |
    | `moonshot-thinking` | config + `/think` 수준에서 Moonshot 바이너리 native-thinking 페이로드 매핑 | `moonshot` |
    | `minimax-fast-mode` | 공유 스트림 경로에서 MiniMax fast-mode 모델 재작성 | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 공유 네이티브 OpenAI/Codex Responses 래퍼: attribution headers, `/fast`/`serviceTier`, 텍스트 상세도, 네이티브 Codex 웹 검색, reasoning 호환 페이로드 구성, Responses 컨텍스트 관리 | `openai`, `openai-codex` |
    | `openrouter-thinking` | 프록시 라우트를 위한 OpenRouter reasoning 래퍼. 지원되지 않는 모델/`auto` 건너뛰기는 중앙에서 처리됨 | `openrouter` |
    | `tool-stream-default-on` | 명시적으로 비활성화하지 않는 한 도구 스트리밍을 원하는 Z.AI 같은 제공자를 위한 기본 켜짐 `tool_stream` 래퍼 | `zai` |

    <Accordion title="제품군 빌더를 구동하는 SDK 연결 지점">
      각 제품군 빌더는 같은 패키지에서 내보내는 더 낮은 수준의 공개 헬퍼로 구성되며, 제공자가 일반 패턴을 벗어나야 할 때 이를 사용할 수 있습니다.

      - `openclaw/plugin-sdk/provider-model-shared` — `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)`, 원시 replay 빌더(`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). 또한 Gemini replay 헬퍼(`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`)와 endpoint/model 헬퍼(`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`)를 내보냅니다.
      - `openclaw/plugin-sdk/provider-stream` — `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, 그리고 공유 OpenAI/Codex 래퍼(`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), DeepSeek V4 OpenAI 호환 래퍼(`createDeepSeekV4OpenAICompatibleThinkingWrapper`), Anthropic Messages thinking prefill 정리(`createAnthropicThinkingPrefillPayloadWrapper`), 공유 프록시/제공자 래퍼(`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` — `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, 기반 Gemini 스키마 헬퍼(`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`), xAI 호환 헬퍼(`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). 번들 xAI Plugin은 이들과 함께 `normalizeResolvedModel` + `contributeResolvedModelCompat`를 사용해 xAI 규칙을 제공자가 소유하도록 유지합니다.

      일부 스트림 헬퍼는 의도적으로 제공자 로컬에 남아 있습니다. `@openclaw/anthropic-provider`는 `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`와 더 낮은 수준의 Anthropic 래퍼 빌더를 자체 공개 `api.ts` / `contract-api.ts` 연결 지점에 유지합니다. Claude OAuth beta 처리와 `context1m` 게이팅을 인코딩하기 때문입니다. xAI Plugin도 네이티브 xAI Responses 구성을 자체 `wrapStreamFn`에 유지합니다(`/fast` 별칭, 기본 `tool_stream`, 지원되지 않는 strict-tool 정리, xAI 전용 reasoning 페이로드 제거).

      같은 패키지 루트 패턴은 `@openclaw/openai-provider`(제공자 빌더, 기본 모델 헬퍼, realtime 제공자 빌더)와 `@openclaw/openrouter-provider`(제공자 빌더 및 온보딩/config 헬퍼)도 뒷받침합니다.
    </Accordion>

    <Tabs>
      <Tab title="토큰 교환">
        각 추론 호출 전에 토큰 교환이 필요한 제공자의 경우:

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
        사용자 지정 요청 헤더 또는 본문 수정이 필요한 제공자의 경우:

        ```typescript
        // wrapStreamFn returns a StreamFn derived from ctx.streamFn
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
        범용 HTTP 또는 WebSocket 전송에서 네이티브 요청/세션 헤더나 메타데이터가 필요한 제공자의 경우:

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
      <Tab title="사용량 및 청구">
        사용량/청구 데이터를 노출하는 제공자의 경우:

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

    <Accordion title="사용 가능한 모든 제공자 훅">
      OpenClaw는 다음 순서로 훅을 호출합니다. 대부분의 제공자는 2~3개만 사용합니다.
      OpenClaw가 더 이상 호출하지 않는 호환성 전용 제공자 필드(예:
      `ProviderPlugin.capabilities` 및 `suppressBuiltInModel`)는 여기에
      나열하지 않았습니다.

      | # | 훅 | 사용 시점 |
      | --- | --- | --- |
      | 1 | `catalog` | 모델 카탈로그 또는 기본 URL 기본값 |
      | 2 | `applyConfigDefaults` | config 구체화 중 제공자 소유 전역 기본값 |
      | 3 | `normalizeModelId` | 조회 전 레거시/preview model-id 별칭 정리 |
      | 4 | `normalizeTransport` | 범용 모델 조립 전 제공자 제품군 `api` / `baseUrl` 정리 |
      | 5 | `normalizeConfig` | `models.providers.<id>` config 정규화 |
      | 6 | `applyNativeStreamingUsageCompat` | config 제공자의 네이티브 streaming-usage 호환 재작성 |
      | 7 | `resolveConfigApiKey` | 제공자 소유 env-marker 인증 해석 |
      | 8 | `resolveSyntheticAuth` | 로컬/셀프 호스팅 또는 config 기반 합성 인증 |
      | 9 | `shouldDeferSyntheticProfileAuth` | env/config 인증 뒤로 합성 저장 프로필 플레이스홀더 낮추기 |
      | 10 | `resolveDynamicModel` | 임의의 업스트림 모델 ID 허용 |
      | 11 | `prepareDynamicModel` | 해석 전 비동기 메타데이터 가져오기 |
      | 12 | `normalizeResolvedModel` | 러너 전 전송 재작성 |
      | 13 | `contributeResolvedModelCompat` | 다른 호환 전송 뒤에 있는 벤더 모델용 호환 플래그 |
      | 14 | `normalizeToolSchemas` | 등록 전 제공자 소유 도구 스키마 정리 |
      | 15 | `inspectToolSchemas` | 제공자 소유 도구 스키마 진단 |
      | 16 | `resolveReasoningOutputMode` | tagged vs native reasoning-output 계약 |
      | 17 | `prepareExtraParams` | 기본 요청 파라미터 |
      | 18 | `createStreamFn` | 완전한 사용자 지정 StreamFn 전송 |
      | 19 | `wrapStreamFn` | 일반 스트림 경로의 사용자 지정 헤더/본문 래퍼 |
      | 20 | `resolveTransportTurnState` | 네이티브 턴별 헤더/메타데이터 |
      | 21 | `resolveWebSocketSessionPolicy` | 네이티브 WS 세션 헤더/cool-down |
      | 22 | `formatApiKey` | 사용자 지정 런타임 토큰 형태 |
      | 23 | `refreshOAuth` | 사용자 지정 OAuth refresh |
      | 24 | `buildAuthDoctorHint` | 인증 복구 안내 |
      | 25 | `matchesContextOverflowError` | 제공자 소유 overflow 감지 |
      | 26 | `classifyFailoverReason` | 제공자 소유 rate-limit/overload 분류 |
      | 27 | `isCacheTtlEligible` | 프롬프트 캐시 TTL 게이팅 |
      | 28 | `buildMissingAuthMessage` | 사용자 지정 누락 인증 힌트 |
      | 29 | `augmentModelCatalog` | 합성 forward-compat 행 |
      | 30 | `resolveThinkingProfile` | 모델별 `/think` 옵션 세트 |
      | 31 | `isBinaryThinking` | 바이너리 thinking on/off 호환성 |
      | 32 | `supportsXHighThinking` | `xhigh` reasoning 지원 호환성 |
      | 33 | `resolveDefaultThinkingLevel` | 기본 `/think` 정책 호환성 |
      | 34 | `isModernModelRef` | live/smoke 모델 매칭 |
      | 35 | `prepareRuntimeAuth` | 추론 전 토큰 교환 |
      | 36 | `resolveUsageAuth` | 사용자 지정 사용량 자격 증명 파싱 |
      | 37 | `fetchUsageSnapshot` | 사용자 지정 사용량 endpoint |
      | 38 | `createEmbeddingProvider` | memory/search용 제공자 소유 embedding adapter |
      | 39 | `buildReplayPolicy` | 사용자 지정 transcript replay/Compaction 정책 |
      | 40 | `sanitizeReplayHistory` | 범용 정리 후 제공자별 replay 재작성 |
      | 41 | `validateReplayTurns` | 임베디드 러너 전 엄격한 replay-turn 검증 |
      | 42 | `onModelSelected` | 선택 후 콜백(예: telemetry) |

      런타임 fallback 참고:

      - `normalizeConfig`는 먼저 매칭된 제공자를 확인한 다음, 실제로 config를 변경하는 제공자가 나올 때까지 훅을 지원하는 다른 제공자 Plugin을 확인합니다. 지원되는 Google 제품군 config 항목을 어떤 제공자 훅도 재작성하지 않으면 번들 Google config 정규화기가 계속 적용됩니다.
      - `resolveConfigApiKey`는 노출된 경우 제공자 훅을 사용합니다. 번들 `amazon-bedrock` 경로도 여기에서 내장 AWS env-marker resolver를 갖지만, Bedrock 런타임 인증 자체는 여전히 AWS SDK 기본 체인을 사용합니다.
      - `resolveSystemPromptContribution`은 제공자가 모델 제품군을 위한 캐시 인식 시스템 프롬프트 안내를 주입할 수 있게 합니다. 동작이 하나의 제공자/모델 제품군에 속하며 안정/동적 캐시 분리를 보존해야 할 때는 `before_prompt_build`보다 이를 선호하세요.

      자세한 설명과 실제 예시는 [내부 구조: 제공자 런타임 훅](/ko/plugins/architecture-internals#provider-runtime-hooks)을 참조하세요.
    </Accordion>

  </Step>

  <Step title="추가 기능 추가(선택 사항)">
    제공자 Plugin은 텍스트 추론과 함께 음성, realtime 전사, realtime
    음성, 미디어 이해, 이미지 생성, 비디오 생성, 웹 가져오기,
    웹 검색을 등록할 수 있습니다. OpenClaw는 이를
    **hybrid-capability** Plugin으로 분류합니다. 회사 Plugin에 권장되는
    패턴입니다(벤더당 하나의 Plugin). 
    [내부 구조: 기능 소유권](/ko/plugins/architecture#capability-ownership-model)을 참조하세요.

    기존 `api.registerProvider(...)` 호출과 함께 `register(api)` 내부에
    각 기능을 등록하세요. 필요한 탭만 선택하세요:

    <Tabs>
      <Tab title="Speech (TTS)">
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

        Provider HTTP 실패에는 `assertOkOrThrowProviderError(...)`를 사용하여
        Plugin들이 제한된 오류 본문 읽기, JSON 오류 구문 분석, 그리고
        request-id 접미사를 공유하도록 하세요.
      </Tab>
      <Tab title="Realtime transcription">
        `createRealtimeTranscriptionWebSocketSession(...)`를 선호하세요. 공유
        helper가 proxy capture, reconnect backoff, close flushing, ready
        handshakes, audio queueing, close-event diagnostics를 처리합니다. Plugin은
        upstream events만 매핑하면 됩니다.

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

        multipart audio를 POST하는 배치 STT provider는
        `openclaw/plugin-sdk/provider-http`의
        `buildAudioTranscriptionFormData(...)`를 사용해야 합니다. 이 helper는 호환되는
        transcription API를 위해 M4A 스타일 파일 이름이 필요한 AAC 업로드를 포함해
        업로드 파일 이름을 정규화합니다.
      </Tab>
      <Tab title="Realtime voice">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
            // Set this only if the provider accepts multiple tool responses for
            // one call, for example an immediate "working" response followed by
            // the final result.
            supportsToolResultContinuation: false,
            connect: async () => {},
            sendAudio: () => {},
            setMediaTimestamp: () => {},
            handleBargeIn: () => {},
            submitToolResult: () => {},
            acknowledgeMark: () => {},
            close: () => {},
            isConnected: () => true,
          }),
        });
        ```

        transport가 사람이 assistant 재생을 끊고 있음을 감지할 수 있고 provider가
        활성 audio response를 자르거나 지우는 것을 지원한다면 `handleBargeIn`을
        구현하세요.
      </Tab>
      <Tab title="Media understanding">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "A photo of..." }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Image and video generation">
        video capabilities는 **mode-aware** 형태를 사용합니다: `generate`,
        `imageToVideo`, `videoToVideo`. `maxInputImages` / `maxInputVideos` /
        `maxDurationSeconds` 같은 flat aggregate field만으로는 transform-mode 지원이나
        비활성화된 모드를 깔끔하게 알리기에 충분하지 않습니다.
        music generation도 명시적인 `generate` / `edit` block으로 같은 패턴을 따릅니다.

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
            imageToVideo: {
              enabled: true,
              maxVideos: 1,
              maxInputImages: 1,
              maxInputImagesByModel: { "acme/reference-to-video": 9 },
              maxDurationSeconds: 5,
            },
            videoToVideo: { enabled: false },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```
      </Tab>
      <Tab title="Web fetch and search">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "Fetch pages through Acme's rendering backend.",
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
            description: "Fetch a page through Acme Fetch.",
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

  <Step title="Test">
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // Export your provider config object from index.ts or a dedicated file
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("resolves dynamic models", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("returns catalog when key is available", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("returns null catalog when no key", async () => {
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

Provider Plugin은 다른 외부 code Plugin과 같은 방식으로 게시합니다:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

여기서는 기존 skill-only 게시 alias를 사용하지 마세요. Plugin package는
`clawhub package publish`를 사용해야 합니다.

## 파일 구조

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with provider auth metadata
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## Catalog 순서 참조

`catalog.order`는 catalog가 내장 provider와 비교해 언제 병합되는지를 제어합니다:

| 순서      | 시점          | 사용 사례                                      |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 첫 번째 pass  | 일반 API key provider                          |
| `profile` | simple 이후   | auth profile에 의해 제어되는 provider           |
| `paired`  | profile 이후  | 여러 관련 entry 합성                            |
| `late`    | 마지막 pass   | 기존 provider 재정의(충돌 시 우선)              |

## 다음 단계

- [Channel Plugin](/ko/plugins/sdk-channel-plugins) — Plugin이 channel도 제공하는 경우
- [SDK Runtime](/ko/plugins/sdk-runtime) — `api.runtime` helper(TTS, search, subagent)
- [SDK 개요](/ko/plugins/sdk-overview) — 전체 subpath import 참조
- [Plugin 내부 구조](/ko/plugins/architecture-internals#provider-runtime-hooks) — hook 세부 정보와 번들 예제

## 관련 항목

- [Plugin SDK 설정](/ko/plugins/sdk-setup)
- [Plugin 빌드](/ko/plugins/building-plugins)
- [channel Plugin 빌드](/ko/plugins/sdk-channel-plugins)
