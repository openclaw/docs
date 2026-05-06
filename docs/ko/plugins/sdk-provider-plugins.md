---
read_when:
    - 새 모델 제공자 Plugin을 만들고 있습니다
    - OpenClaw에 OpenAI 호환 프록시 또는 사용자 지정 LLM을 추가하려는 경우
    - 제공자 인증, 카탈로그, 런타임 훅을 이해해야 합니다
sidebarTitle: Provider plugins
summary: OpenClaw용 모델 제공자 Plugin 구축 단계별 가이드
title: 프로바이더 Plugin 빌드하기
x-i18n:
    generated_at: "2026-05-06T06:35:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f62f4b4df055412288b9d56f0344c76b9adfc3a04f3916eba37c04d22a3d808
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

이 가이드는 OpenClaw에 모델 제공자(LLM)를 추가하는 제공자 Plugin을 빌드하는 과정을 안내합니다. 끝까지 진행하면 모델 카탈로그, API 키 인증, 동적 모델 해석을 갖춘 제공자를 만들 수 있습니다.

<Info>
  OpenClaw Plugin을 빌드해 본 적이 없다면 먼저 기본 패키지
  구조와 매니페스트 설정을 다루는
  [시작하기](/ko/plugins/building-plugins)를 읽어보세요.
</Info>

<Tip>
  제공자 Plugin은 OpenClaw의 일반 추론 루프에 모델을 추가합니다. 모델이
  스레드, Compaction 또는 도구 이벤트를 소유하는 네이티브 에이전트 데몬을 통해
  실행되어야 한다면, 데몬 프로토콜 세부 정보를 코어에 넣는 대신 제공자를
  [에이전트 하네스](/ko/plugins/sdk-agent-harness)와 함께 사용하세요.
</Tip>

## 연습

<Steps>
  <Step title="패키지와 매니페스트">
    ### 1단계: 패키지와 매니페스트

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
    로드하지 않고도 자격 증명을 감지할 수 있게 합니다. 제공자 변형이 다른 제공자
    ID의 인증을 재사용해야 할 때는 `providerAuthAliases`를 추가하세요.
    `modelSupport`는 선택 사항이며, 런타임 훅이 존재하기 전에 OpenClaw가
    `acme-large` 같은 축약 모델 ID로부터 제공자 Plugin을 자동 로드할 수 있게
    합니다. 제공자를 ClawHub에 게시하는 경우 `package.json`에 있는
    `openclaw.compat` 및 `openclaw.build` 필드가 필요합니다.

  </Step>

  <Step title="제공자 등록">
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

    이제 작동하는 제공자가 준비되었습니다. 사용자는 이제
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

    `input`은 전송 전에 최종 시스템 프롬프트와 텍스트 메시지 콘텐츠를 다시 씁니다.
    `output`은 OpenClaw가 자체 제어 마커나 채널 전달을 파싱하기 전에 어시스턴트
    텍스트 델타와 최종 텍스트를 다시 씁니다.

    API 키 인증과 단일 카탈로그 기반 런타임이 있는 텍스트 제공자 하나만 등록하는
    번들 제공자의 경우, 더 좁은 범위의 `defineSingleProviderPluginEntry(...)`
    헬퍼를 선호하세요.

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

    `buildProvider`는 OpenClaw가 실제 제공자 인증을 해석할 수 있을 때 사용하는
    라이브 카탈로그 경로입니다. 제공자별 검색을 수행할 수 있습니다.
    `buildStaticProvider`는 인증이 구성되기 전에 표시해도 안전한 오프라인 행에만
    사용하세요. 이 함수는 자격 증명을 요구하거나 네트워크 요청을 해서는 안 됩니다.
    OpenClaw의 `models list --all` 표시는 현재 빈 설정, 빈 환경, 에이전트/작업공간
    경로 없음 상태에서 번들 제공자 Plugin에 대해서만 정적 카탈로그를 실행합니다.

    인증 흐름에서 온보딩 중 `models.providers.*`, 별칭, 에이전트 기본 모델도
    패치해야 한다면 `openclaw/plugin-sdk/provider-onboard`의 프리셋 헬퍼를
    사용하세요. 가장 좁은 범위의 헬퍼는
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)`, 그리고
    `createModelCatalogPresetAppliers(...)`입니다.

    제공자의 네이티브 엔드포인트가 일반 `openai-completions` 전송에서 스트리밍된
    사용량 블록을 지원하는 경우, 제공자 ID 검사를 하드코딩하는 대신
    `openclaw/plugin-sdk/provider-catalog-shared`의 공유 카탈로그 헬퍼를
    선호하세요. `supportsNativeStreamingUsageCompat(...)` 및
    `applyProviderNativeStreamingUsageCompat(...)`는 엔드포인트 기능 맵에서 지원을
    감지하므로, Plugin이 사용자 지정 제공자 ID를 사용하더라도 네이티브
    Moonshot/DashScope 스타일 엔드포인트는 계속 명시적으로 활성화됩니다.

  </Step>

  <Step title="동적 모델 해석 추가">
    제공자가 임의의 모델 ID를 허용한다면(예: 프록시 또는 라우터),
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

    해석에 네트워크 호출이 필요하다면 비동기 워밍업에 `prepareDynamicModel`을
    사용하세요. 완료된 후 `resolveDynamicModel`이 다시 실행됩니다.

  </Step>

  <Step title="런타임 훅 추가(필요한 경우)">
    대부분의 제공자는 `catalog` + `resolveDynamicModel`만 필요합니다. 제공자에
    필요해질 때마다 훅을 점진적으로 추가하세요.

    공유 헬퍼 빌더는 이제 가장 일반적인 리플레이/도구 호환성 계열을 처리하므로,
    Plugin은 일반적으로 각 훅을 하나씩 직접 연결할 필요가 없습니다.

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

    현재 사용할 수 있는 리플레이 계열:

    | 계열 | 연결되는 항목 | 번들 예시 |
    | --- | --- | --- |
    | `openai-compatible` | OpenAI 호환 전송을 위한 공유 OpenAI 스타일 리플레이 정책입니다. 도구 호출 ID 정리, 어시스턴트 우선 순서 수정, 전송에서 필요한 경우의 일반 Gemini 턴 검증을 포함합니다 | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | `modelId`로 선택되는 Claude 인식 리플레이 정책입니다. 따라서 Anthropic 메시지 전송은 해석된 모델이 실제로 Claude ID일 때만 Claude별 사고 블록 정리를 받습니다 | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | 네이티브 Gemini 리플레이 정책과 부트스트랩 리플레이 정리 및 태그가 지정된 추론 출력 모드입니다 | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | OpenAI 호환 프록시 전송을 통해 실행되는 Gemini 모델을 위한 Gemini 사고 서명 정리입니다. 네이티브 Gemini 리플레이 검증이나 부트스트랩 재작성은 활성화하지 않습니다 | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | 하나의 Plugin 안에서 Anthropic 메시지와 OpenAI 호환 모델 표면을 함께 제공하는 제공자를 위한 하이브리드 정책입니다. 선택적인 Claude 전용 사고 블록 삭제는 Anthropic 쪽으로만 범위가 제한됩니다 | `minimax` |

    현재 사용 가능한 스트림 패밀리:

    | 패밀리 | 연결하는 항목 | 번들 예시 |
    | --- | --- | --- |
    | `google-thinking` | 공유 스트림 경로에서 Gemini thinking 페이로드 정규화 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 공유 프록시 스트림 경로의 Kilo 추론 래퍼. `kilo/auto` 및 지원되지 않는 프록시 추론 ID는 주입된 thinking을 건너뜀 | `kilocode` |
    | `moonshot-thinking` | 설정 + `/think` 수준에서 Moonshot 바이너리 네이티브 thinking 페이로드 매핑 | `moonshot` |
    | `minimax-fast-mode` | 공유 스트림 경로에서 MiniMax fast-mode 모델 재작성 | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 공유 네이티브 OpenAI/Codex Responses 래퍼: 속성 헤더, `/fast`/`serviceTier`, 텍스트 상세도, 네이티브 Codex 웹 검색, 추론 호환 페이로드 형성, Responses 컨텍스트 관리 | `openai`, `openai-codex` |
    | `openrouter-thinking` | 프록시 라우트용 OpenRouter 추론 래퍼. 지원되지 않는 모델/`auto` 건너뛰기는 중앙에서 처리 | `openrouter` |
    | `tool-stream-default-on` | 명시적으로 비활성화하지 않는 한 도구 스트리밍을 원하는 Z.AI 같은 제공자를 위한 기본 활성화 `tool_stream` 래퍼 | `zai` |

    <Accordion title="패밀리 빌더를 구동하는 SDK 연결부">
      각 패밀리 빌더는 같은 패키지에서 내보내는 더 낮은 수준의 공개 헬퍼로 구성되며, 제공자가 일반 패턴을 벗어나야 할 때 사용할 수 있습니다.

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)`, 원시 리플레이 빌더(`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). Gemini 리플레이 헬퍼(`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`)와 엔드포인트/모델 헬퍼(`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`, `normalizeNativeXaiModelId`)도 내보냅니다.
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`와 공유 OpenAI/Codex 래퍼(`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), DeepSeek V4 OpenAI 호환 래퍼(`createDeepSeekV4OpenAICompatibleThinkingWrapper`), Anthropic Messages thinking 프리필 정리(`createAnthropicThinkingPrefillPayloadWrapper`), 공유 프록시/제공자 래퍼(`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("gemini")`, 기반 Gemini 스키마 헬퍼(`normalizeGeminiToolSchemas`, `inspectGeminiToolSchemas`), xAI 호환성 헬퍼(`resolveXaiModelCompatPatch()`, `applyXaiModelCompat(model)`). 번들 xAI Plugin은 xAI 규칙을 제공자가 소유하도록 유지하기 위해 이들과 함께 `normalizeResolvedModel` + `contributeResolvedModelCompat`를 사용합니다.

      일부 스트림 헬퍼는 의도적으로 제공자 로컬에 남겨둡니다. `@openclaw/anthropic-provider`는 Claude OAuth 베타 처리와 `context1m` 게이팅을 인코딩하므로 `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier` 및 더 낮은 수준의 Anthropic 래퍼 빌더를 자체 공개 `api.ts` / `contract-api.ts` 연결부에 유지합니다. xAI Plugin도 마찬가지로 네이티브 xAI Responses 형성을 자체 `wrapStreamFn`에 유지합니다(`/fast` 별칭, 기본 `tool_stream`, 지원되지 않는 strict-tool 정리, xAI 전용 추론 페이로드 제거).

      동일한 패키지 루트 패턴은 `@openclaw/openai-provider`(제공자 빌더, 기본 모델 헬퍼, 실시간 제공자 빌더)와 `@openclaw/openrouter-provider`(제공자 빌더 및 온보딩/설정 헬퍼)도 지원합니다.
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
        사용자 지정 요청 헤더나 본문 수정이 필요한 제공자의 경우:

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
        일반 HTTP 또는 WebSocket 전송에서 네이티브 요청/세션 헤더나 메타데이터가 필요한 제공자의 경우:

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
      OpenClaw는 다음 순서로 훅을 호출합니다. 대부분의 제공자는 2-3개만 사용합니다.
      `ProviderPlugin.capabilities` 및 `suppressBuiltInModel`처럼 OpenClaw가 더 이상 호출하지 않는 호환성 전용 제공자 필드는 여기에 나열하지 않습니다.

      | # | 훅 | 사용 시점 |
      | --- | --- | --- |
      | 1 | `catalog` | 모델 카탈로그 또는 기본 베이스 URL |
      | 2 | `applyConfigDefaults` | 설정 구체화 중 제공자 소유 전역 기본값 |
      | 3 | `normalizeModelId` | 조회 전 레거시/프리뷰 모델 ID 별칭 정리 |
      | 4 | `normalizeTransport` | 일반 모델 조립 전 제공자 패밀리 `api` / `baseUrl` 정리 |
      | 5 | `normalizeConfig` | `models.providers.<id>` 설정 정규화 |
      | 6 | `applyNativeStreamingUsageCompat` | 설정 제공자의 네이티브 스트리밍 사용량 호환 재작성 |
      | 7 | `resolveConfigApiKey` | 제공자 소유 env-marker 인증 해석 |
      | 8 | `resolveSyntheticAuth` | 로컬/셀프 호스팅 또는 설정 기반 합성 인증 |
      | 9 | `shouldDeferSyntheticProfileAuth` | env/config 인증 뒤로 합성 저장 프로필 자리표시자 낮추기 |
      | 10 | `resolveDynamicModel` | 임의의 업스트림 모델 ID 수락 |
      | 11 | `prepareDynamicModel` | 해석 전 비동기 메타데이터 가져오기 |
      | 12 | `normalizeResolvedModel` | 러너 전 전송 재작성 |
      | 13 | `contributeResolvedModelCompat` | 다른 호환 전송 뒤의 벤더 모델에 대한 호환성 플래그 |
      | 14 | `normalizeToolSchemas` | 등록 전 제공자 소유 도구 스키마 정리 |
      | 15 | `inspectToolSchemas` | 제공자 소유 도구 스키마 진단 |
      | 16 | `resolveReasoningOutputMode` | 태그 지정 추론 출력 계약과 네이티브 추론 출력 계약 |
      | 17 | `prepareExtraParams` | 기본 요청 매개변수 |
      | 18 | `createStreamFn` | 완전 사용자 지정 StreamFn 전송 |
      | 19 | `wrapStreamFn` | 일반 스트림 경로의 사용자 지정 헤더/본문 래퍼 |
      | 20 | `resolveTransportTurnState` | 네이티브 턴별 헤더/메타데이터 |
      | 21 | `resolveWebSocketSessionPolicy` | 네이티브 WS 세션 헤더/쿨다운 |
      | 22 | `formatApiKey` | 사용자 지정 런타임 토큰 형식 |
      | 23 | `refreshOAuth` | 사용자 지정 OAuth 갱신 |
      | 24 | `buildAuthDoctorHint` | 인증 복구 안내 |
      | 25 | `matchesContextOverflowError` | 제공자 소유 오버플로 감지 |
      | 26 | `classifyFailoverReason` | 제공자 소유 속도 제한/과부하 분류 |
      | 27 | `isCacheTtlEligible` | 프롬프트 캐시 TTL 게이팅 |
      | 28 | `buildMissingAuthMessage` | 사용자 지정 인증 누락 힌트 |
      | 29 | `augmentModelCatalog` | 합성 forward-compat 행 |
      | 30 | `resolveThinkingProfile` | 모델별 `/think` 옵션 세트 |
      | 31 | `isBinaryThinking` | 바이너리 thinking 켜기/끄기 호환성 |
      | 32 | `supportsXHighThinking` | `xhigh` 추론 지원 호환성 |
      | 33 | `resolveDefaultThinkingLevel` | 기본 `/think` 정책 호환성 |
      | 34 | `isModernModelRef` | 라이브/스모크 모델 매칭 |
      | 35 | `prepareRuntimeAuth` | 추론 전 토큰 교환 |
      | 36 | `resolveUsageAuth` | 사용자 지정 사용량 자격 증명 파싱 |
      | 37 | `fetchUsageSnapshot` | 사용자 지정 사용량 엔드포인트 |
      | 38 | `createEmbeddingProvider` | 메모리/검색용 제공자 소유 임베딩 어댑터 |
      | 39 | `buildReplayPolicy` | 사용자 지정 트랜스크립트 리플레이/Compaction 정책 |
      | 40 | `sanitizeReplayHistory` | 일반 정리 후 제공자별 리플레이 재작성 |
      | 41 | `validateReplayTurns` | 임베디드 러너 전 엄격한 리플레이 턴 검증 |
      | 42 | `onModelSelected` | 선택 후 콜백(예: 텔레메트리) |

      런타임 폴백 참고:

      - `normalizeConfig`는 먼저 일치하는 제공자를 확인한 다음, 실제로 설정을 변경하는 훅 지원 제공자 Plugin이 나올 때까지 다른 제공자 Plugin을 확인합니다. 지원되는 Google 패밀리 설정 항목을 재작성하는 제공자 훅이 없으면 번들 Google 설정 정규화기가 계속 적용됩니다.
      - `resolveConfigApiKey`는 노출된 경우 제공자 훅을 사용합니다. 번들 `amazon-bedrock` 경로에도 이 위치에 내장 AWS env-marker 해석기가 있지만, Bedrock 런타임 인증 자체는 여전히 AWS SDK 기본 체인을 사용합니다.
      - `resolveSystemPromptContribution`을 사용하면 제공자가 모델 패밀리에 대해 캐시 인식 시스템 프롬프트 안내를 주입할 수 있습니다. 동작이 하나의 제공자/모델 패밀리에 속하고 안정/동적 캐시 분할을 보존해야 한다면 `before_prompt_build`보다 이를 선호하세요.

      자세한 설명과 실제 예시는 [내부 구조: 제공자 런타임 훅](/ko/plugins/architecture-internals#provider-runtime-hooks)을 참조하세요.
    </Accordion>

  </Step>

  <Step title="추가 기능 추가(선택 사항)">
    ### 5단계: 추가 기능 추가

    제공자 Plugin은 텍스트 추론과 함께 음성, 실시간 전사, 실시간 음성, 미디어 이해, 이미지 생성, 비디오 생성, 웹 가져오기, 웹 검색을 등록할 수 있습니다. OpenClaw는 이를 **하이브리드 기능** Plugin으로 분류하며, 회사 Plugin에 권장되는 패턴입니다(벤더당 하나의 Plugin). [내부 구조: 기능 소유권](/ko/plugins/architecture#capability-ownership-model)을 참조하세요.

    기존 `api.registerProvider(...)` 호출과 함께 `register(api)` 안에서 각 기능을 등록하세요. 필요한 탭만 선택하세요:

    <Tabs>
      <Tab title="음성 (TTS)">
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

        제공자 HTTP 실패에는 `assertOkOrThrowProviderError(...)`를 사용하세요. 그러면
        Plugin이 제한된 오류 본문 읽기, JSON 오류 파싱,
        요청 ID 접미사를 공유할 수 있습니다.
      </Tab>
      <Tab title="실시간 전사">
        `createRealtimeTranscriptionWebSocketSession(...)`를 사용하는 것이 좋습니다. 공유
        헬퍼가 프록시 캡처, 재연결 백오프, 종료 플러시, 준비
        핸드셰이크, 오디오 큐잉, 종료 이벤트 진단을 처리합니다. Plugin은
        업스트림 이벤트만 매핑하면 됩니다.

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

        멀티파트 오디오를 POST하는 배치 STT 제공자는
        `openclaw/plugin-sdk/provider-http`의
        `buildAudioTranscriptionFormData(...)`를 사용해야 합니다. 이 헬퍼는 호환되는 전사 API를 위해
        M4A 스타일 파일 이름이 필요한 AAC 업로드를 포함해 업로드
        파일 이름을 정규화합니다.
      </Tab>
      <Tab title="실시간 음성">
        ```typescript
        api.registerRealtimeVoiceProvider({
          id: "acme-ai",
          label: "Acme Realtime Voice",
          capabilities: {
            transports: ["gateway-relay"],
            inputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            outputAudioFormats: [{ encoding: "pcm16", sampleRateHz: 24000, channels: 1 }],
            supportsBargeIn: true,
            supportsToolCalls: true,
          },
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

        `talk.catalog`가 브라우저 및 네이티브 Talk
        클라이언트에 유효한 모드, 전송, 오디오 형식, 기능 플래그를 노출할 수 있도록
        `capabilities`를 선언하세요. 전송이 사람이 어시스턴트 재생을 중단하고 있음을
        감지할 수 있고 제공자가 활성 오디오 응답의 자르기 또는 지우기를
        지원할 때 `handleBargeIn`을 구현하세요.
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
        비디오 기능은 **모드 인식** 형태를 사용합니다: `generate`,
        `imageToVideo`, `videoToVideo`. `maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds` 같은 평면 집계 필드만으로는
        변환 모드 지원이나 비활성화된 모드를 깔끔하게 알리기에 충분하지 않습니다.
        음악 생성도 명시적인 `generate` /
        `edit` 블록으로 같은 패턴을 따릅니다.

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
      <Tab title="웹 가져오기 및 검색">
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

  <Step title="테스트">
    ### 6단계: 테스트

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

제공자 Plugin은 다른 외부 코드 Plugin과 같은 방식으로 게시합니다.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

여기서는 레거시 Skills 전용 게시 별칭을 사용하지 마세요. Plugin 패키지는
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

## 카탈로그 순서 참조

`catalog.order`는 카탈로그가 내장
제공자와 비교해 언제 병합되는지 제어합니다.

| 순서      | 시점          | 사용 사례                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 첫 번째 패스  | 일반 API 키 제공자                              |
| `profile` | simple 이후   | 인증 프로필로 제한되는 제공자                   |
| `paired`  | profile 이후  | 여러 관련 항목 합성                             |
| `late`    | 마지막 패스   | 기존 제공자 재정의(충돌 시 우선 적용)           |

## 다음 단계

- [채널 Plugin](/ko/plugins/sdk-channel-plugins) - Plugin이 채널도 제공하는 경우
- [SDK 런타임](/ko/plugins/sdk-runtime) - `api.runtime` 헬퍼(TTS, 검색, 하위 에이전트)
- [SDK 개요](/ko/plugins/sdk-overview) - 전체 하위 경로 가져오기 참조
- [Plugin 내부 구조](/ko/plugins/architecture-internals#provider-runtime-hooks) - 훅 세부 정보 및 번들 예시

## 관련 항목

- [Plugin SDK 설정](/ko/plugins/sdk-setup)
- [Plugin 빌드](/ko/plugins/building-plugins)
- [채널 Plugin 빌드](/ko/plugins/sdk-channel-plugins)
