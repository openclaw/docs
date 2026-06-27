---
read_when:
    - 새 모델 제공자 Plugin을 구축하고 있습니다
    - OpenClaw에 OpenAI 호환 프록시 또는 사용자 지정 LLM을 추가하려는 경우
    - 프로바이더 인증, 카탈로그, 런타임 훅을 이해해야 합니다
sidebarTitle: Provider plugins
summary: OpenClaw용 모델 제공자 Plugin 구축 단계별 가이드
title: Provider Plugin 빌드하기
x-i18n:
    generated_at: "2026-06-27T17:56:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05ac4d08eae00e7e0fcf03edea691dc9ced7309421dd19a31edf69cee1e01f0b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

이 가이드는 모델 제공자(LLM)를 OpenClaw에 추가하는 제공자 Plugin을 빌드하는 과정을 안내합니다. 끝까지 진행하면 모델 카탈로그, API 키 인증, 동적 모델 해석을 갖춘 제공자를 만들 수 있습니다.

<Info>
  OpenClaw Plugin을 아직 만들어 본 적이 없다면, 기본 패키지 구조와 매니페스트 설정을 위해
  먼저 [시작하기](/ko/plugins/building-plugins)를 읽어 보세요.
</Info>

<Tip>
  제공자 Plugin은 OpenClaw의 일반 추론 루프에 모델을 추가합니다. 모델이 스레드, Compaction 또는 도구 이벤트를 소유하는 네이티브 에이전트 데몬을 통해 실행되어야 한다면, 데몬 프로토콜 세부 정보를 코어에 넣는 대신 제공자를 [에이전트 하네스](/ko/plugins/sdk-agent-harness)와 함께 사용하세요.
</Tip>

## 따라 하기

<Steps>
  <Step title="Package and manifest">
    ### 1단계: 패키지 및 매니페스트

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
      "setup": {
        "providers": [
          {
            "id": "acme-ai",
            "envVars": ["ACME_AI_API_KEY"]
          }
        ]
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

    매니페스트는 OpenClaw가 Plugin 런타임을 로드하지 않고도 자격 증명을 감지할 수 있도록 `setup.providers[].envVars`를 선언합니다. 제공자 변형이 다른 제공자 ID의 인증을 재사용해야 할 때는 `providerAuthAliases`를 추가하세요. `modelSupport`는 선택 사항이며, 런타임 훅이 존재하기 전에 `acme-large` 같은 축약 모델 ID에서 OpenClaw가 제공자 Plugin을 자동 로드할 수 있게 합니다. ClawHub에 제공자를 게시하는 경우 `package.json`의 해당 `openclaw.compat` 및 `openclaw.build` 필드가 필요합니다.

  </Step>

  <Step title="Register the provider">
    최소 텍스트 제공자에는 `id`, `label`, `auth`, `catalog`가 필요합니다. `catalog`는 제공자가 소유하는 런타임/구성 훅입니다. 라이브 벤더 API를 호출할 수 있으며 `models.providers` 항목을 반환합니다.

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

        api.registerModelCatalogProvider({
          provider: "acme-ai",
          kinds: ["text"],
          liveCatalog: async (ctx) => {
            const apiKey = ctx.resolveProviderApiKey("acme-ai").apiKey;
            if (!apiKey) return null;
            return [
              {
                kind: "text",
                provider: "acme-ai",
                model: "acme-large",
                label: "Acme Large",
                source: "live",
              },
            ];
          },
        });
      },
    });
    ```

    `registerModelCatalogProvider`는 목록/도움말/선택기 UI를 위한 더 새로운 제어 평면 카탈로그 표면입니다. 텍스트, 이미지 생성, 비디오 생성, 음악 생성 행에 사용하세요. 벤더 엔드포인트 호출과 응답 매핑은 Plugin에 두세요. OpenClaw는 공유 행 형태, 소스 레이블, 도움말 렌더링을 소유합니다.

    이것으로 작동하는 제공자가 완성됩니다. 이제 사용자는
    `openclaw onboard --acme-ai-api-key <key>`를 실행하고
    `acme-ai/acme-large`를 모델로 선택할 수 있습니다.

    ### 라이브 모델 검색

    제공자가 `/models` 스타일 API를 노출한다면, 제공자별 엔드포인트와 행 투영은 Plugin에 두고 공유 가져오기 수명 주기에는
    `openclaw/plugin-sdk/provider-catalog-live-runtime`을 사용하세요. 이 헬퍼는 제공자 정책을 OpenClaw 코어에 넣지 않고도 보호된 HTTP 가져오기, 제공자 인증 헤더, 구조화된 HTTP 오류, TTL 캐싱, 정적 폴백 동작을 제공합니다.

    라이브 API가 제공자 소유의 정적 카탈로그 행 중 현재 사용 가능한 항목만 알려 주는 경우 `buildLiveModelProviderConfig`를 사용하세요.

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import {
      buildLiveModelProviderConfig,
      type LiveModelCatalogFetchGuard,
    } from "openclaw/plugin-sdk/provider-catalog-live-runtime";

    const STATIC_MODELS = [
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
    ] as const;

    async function buildAcmeLiveProvider(params: {
      apiKey: string;
      discoveryApiKey?: string;
      fetchGuard?: LiveModelCatalogFetchGuard;
    }) {
      return await buildLiveModelProviderConfig({
        providerId: "acme-ai",
        endpoint: "https://api.acme-ai.com/v1/models",
        providerConfig: {
          baseUrl: "https://api.acme-ai.com/v1",
          api: "openai-completions",
        },
        models: STATIC_MODELS,
        apiKey: params.apiKey,
        discoveryApiKey: params.discoveryApiKey,
        fetchGuard: params.fetchGuard,
        ttlMs: 60_000,
        auditContext: "acme-ai-model-discovery",
      });
    }

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          catalog: {
            order: "simple",
            run: async (ctx) => {
              const auth = ctx.resolveProviderAuth("acme-ai");
              const apiKey =
                auth.apiKey ?? ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: await buildAcmeLiveProvider({
                  apiKey,
                  discoveryApiKey: auth.discoveryApiKey,
                }),
              };
            },
          },
          staticCatalog: {
            order: "simple",
            run: async () => ({
              provider: {
                baseUrl: "https://api.acme-ai.com/v1",
                api: "openai-completions",
                models: [...STATIC_MODELS],
              },
            }),
          },
        });
      },
    });
    ```

    제공자 API가 더 풍부한 메타데이터를 반환하고 Plugin이 행을 OpenClaw 모델 정의로 직접 투영해야 하는 경우 `getCachedLiveProviderModelRows`를 사용하세요.

    ```typescript index.ts
    import {
      getCachedLiveProviderModelRows,
      LiveModelCatalogHttpError,
    } from "openclaw/plugin-sdk/provider-catalog-live-runtime";

    async function discoverAcmeModels(apiKey: string) {
      try {
        const rows = await getCachedLiveProviderModelRows({
          providerId: "acme-ai",
          endpoint: "https://api.acme-ai.com/v1/models",
          apiKey,
          ttlMs: 60_000,
          auditContext: "acme-ai-model-discovery",
        });
        return rows
          .map((row) => projectAcmeModel(row))
          .filter((model) => model !== null);
      } catch (error) {
        if (error instanceof LiveModelCatalogHttpError) {
          return STATIC_MODELS;
        }
        throw error;
      }
    }
    ```

    `run`은 인증으로 보호된 상태를 유지해야 하며, 사용할 수 있는 자격 증명이 없으면 `null`을 반환해야 합니다. 설정, 문서, 테스트, 선택기 표면이 라이브 네트워크 접근에 의존하지 않도록 오프라인 `staticRun` 또는 정적 폴백을 유지하세요. 모델 목록 신선도에 적합한 TTL을 사용하고, 요청 시점의 파일 시스템 폴링은 피하며, 업스트림 응답이 OpenAI 호환 `{ data: [{ id, object }] }` 형태가 아닐 때만 제공자별 `readRows` / `readModelId`를 전달하세요.

    업스트림 제공자가 OpenClaw와 다른 제어 토큰을 사용한다면, 스트림 경로를 교체하는 대신 작은 양방향 텍스트 변환을 추가하세요.

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

    `input`은 전송 전에 최종 시스템 프롬프트와 텍스트 메시지 콘텐츠를 다시 씁니다. `output`은 OpenClaw가 자체 제어 마커를 파싱하거나 채널에 전달하기 전에 어시스턴트 텍스트 델타와 최종 텍스트를 다시 씁니다.

    API 키 인증과 단일 카탈로그 기반 런타임을 사용하는 하나의 텍스트 제공자만 등록하는 번들 제공자의 경우, 더 좁은
    `defineSingleProviderPluginEntry(...)` 헬퍼를 선호하세요:

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

    `buildProvider`는 OpenClaw가 실제 제공자 인증을 확인할 수 있을 때 사용하는 라이브 카탈로그 경로입니다. 제공자별 탐색을 수행할 수 있습니다. `buildStaticProvider`는 인증이 구성되기 전에 표시해도 안전한 오프라인 행에만 사용하세요. 이 함수는 자격 증명을 요구하거나 네트워크 요청을 해서는 안 됩니다. OpenClaw의 `models list --all` 표시는 현재 번들 제공자 Plugin에 대해서만 정적 카탈로그를 실행하며, 빈 구성, 빈 환경, agent/workspace 경로 없이 실행합니다.

    인증 흐름에서 온보딩 중 `models.providers.*`, 별칭, 에이전트 기본 모델도 패치해야 한다면 `openclaw/plugin-sdk/provider-onboard`의 프리셋 헬퍼를 사용하세요. 가장 좁은 헬퍼는 `createDefaultModelPresetAppliers(...)`, `createDefaultModelsPresetAppliers(...)`, `createModelCatalogPresetAppliers(...)`입니다.

    제공자의 네이티브 엔드포인트가 일반 `openai-completions` 전송에서 스트리밍 사용량 블록을 지원하는 경우, 제공자 ID 검사를 하드코딩하지 말고 `openclaw/plugin-sdk/provider-catalog-shared`의 공유 카탈로그 헬퍼를 선호하세요. `supportsNativeStreamingUsageCompat(...)`와 `applyProviderNativeStreamingUsageCompat(...)`는 엔드포인트 기능 맵에서 지원 여부를 감지하므로, Plugin이 사용자 지정 제공자 ID를 사용하더라도 네이티브 Moonshot/DashScope 스타일 엔드포인트는 계속 옵트인됩니다.

    위의 라이브 탐색 예시는 `/models` 스타일 제공자 API를 다룹니다. 해당 탐색은 사용 가능한 인증으로 게이트된 `catalog.run` 안에 두고, `staticRun`은 오프라인 카탈로그 생성을 위해 네트워크를 사용하지 않도록 유지하세요.

  </Step>

  <Step title="동적 모델 해석 추가">
    제공자가 임의 모델 ID를 허용한다면(프록시나 라우터처럼) `resolveDynamicModel`을 추가하세요.

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

    해석에 네트워크 호출이 필요하다면 비동기 워밍업에 `prepareDynamicModel`을 사용하세요. 완료 후 `resolveDynamicModel`이 다시 실행됩니다.

  </Step>

  <Step title="런타임 훅 추가(필요한 경우)">
    대부분의 제공자는 `catalog` + `resolveDynamicModel`만 필요합니다. 제공자가 요구할 때 훅을 점진적으로 추가하세요.

    공유 헬퍼 빌더는 이제 가장 일반적인 재생/도구 호환 계열을 다루므로, Plugin은 일반적으로 각 훅을 하나씩 직접 연결할 필요가 없습니다.

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

    현재 사용 가능한 재생 계열:

    | 계열 | 연결되는 항목 | 번들 예시 |
    | --- | --- | --- |
    | `openai-compatible` | 도구 호출 ID 정리, 어시스턴트 우선 순서 수정, 전송에서 필요한 경우의 일반 Gemini 턴 검증을 포함하는 OpenAI 호환 전송용 공유 OpenAI 스타일 재생 정책 | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | `modelId`로 선택되는 Claude 인식 재생 정책입니다. 따라서 Anthropic 메시지 전송은 해석된 모델이 실제로 Claude ID일 때만 Claude 전용 thinking 블록 정리를 받습니다 | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | 네이티브 Gemini 재생 정책과 부트스트랩 재생 정리입니다. 공유 계열은 텍스트 출력 Gemini CLI를 태그된 추론에 유지합니다. 직접 `google` 제공자는 Gemini API thinking이 네이티브 thought 파트로 도착하므로 `resolveReasoningOutputMode`를 `native`로 재정의합니다. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | OpenAI 호환 프록시 전송을 통해 실행되는 Gemini 모델용 Gemini thought-signature 정리입니다. 네이티브 Gemini 재생 검증이나 부트스트랩 재작성을 활성화하지 않습니다 | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | 하나의 Plugin에서 Anthropic 메시지와 OpenAI 호환 모델 표면을 혼합하는 제공자를 위한 하이브리드 정책입니다. 선택적 Claude 전용 thinking 블록 드롭은 Anthropic 쪽으로 범위가 제한됩니다 | `minimax` |

    현재 사용 가능한 스트림 계열:

    | 계열 | 연결되는 항목 | 번들 예시 |
    | --- | --- | --- |
    | `google-thinking` | 공유 스트림 경로의 Gemini thinking 페이로드 정규화 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 공유 프록시 스트림 경로의 Kilo 추론 래퍼입니다. `kilo/auto`와 지원되지 않는 프록시 추론 ID는 주입된 thinking을 건너뜁니다 | `kilocode` |
    | `moonshot-thinking` | 구성 + `/think` 수준에서 Moonshot 바이너리 네이티브 thinking 페이로드 매핑 | `moonshot` |
    | `minimax-fast-mode` | 공유 스트림 경로의 MiniMax 빠른 모드 모델 재작성 | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 공유 네이티브 OpenAI/Codex Responses 래퍼: 속성 헤더, `/fast`/`serviceTier`, 텍스트 상세도, 네이티브 Codex 웹 검색, 추론 호환 페이로드 형성, Responses 컨텍스트 관리 | `openai` |
    | `openrouter-thinking` | 프록시 경로용 OpenRouter 추론 래퍼입니다. 지원되지 않는 모델/`auto` 건너뛰기는 중앙에서 처리됩니다 | `openrouter` |
    | `tool-stream-default-on` | 명시적으로 비활성화하지 않는 한 도구 스트리밍을 원하는 Z.AI 같은 제공자를 위한 기본 활성화 `tool_stream` 래퍼 | `zai` |

    <Accordion title="계열 빌더를 구동하는 SDK 접점">
      각 계열 빌더는 같은 패키지에서 내보내는 하위 수준 공개 헬퍼로 구성되어 있으며, 제공자가 공통 패턴을 벗어나야 할 때 사용할 수 있습니다.

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)`, 원시 재생 빌더(`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`)입니다. Gemini 재생 헬퍼(`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`)와 엔드포인트/모델 헬퍼(`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`)도 내보냅니다.
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`와 공유 OpenAI/Codex 래퍼(`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), DeepSeek V4 OpenAI 호환 래퍼(`createDeepSeekV4OpenAICompatibleThinkingWrapper`), Anthropic Messages thinking 프리필 정리(`createAnthropicThinkingPrefillPayloadWrapper`), 일반 텍스트 도구 호출 호환(`createPlainTextToolCallCompatWrapper`), 공유 프록시/제공자 래퍼(`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`)입니다.
      - `openclaw/plugin-sdk/provider-stream-shared` - `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)`, `setQwenChatTemplateThinking(...)`을 포함하는, 핫 제공자 경로용 경량 페이로드 및 이벤트 래퍼입니다.
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")`, 그리고 기반 제공자 스키마 헬퍼입니다.

      Gemini 계열 제공자의 경우 추론 출력 모드를 전송과 맞게 유지하세요. 직접 Google Gemini API 제공자는 OpenClaw가 `<think>` / `<final>` 프롬프트 지시문을 추가하지 않고 네이티브 thought 파트를 소비하도록 `native` 추론 출력을 사용해야 합니다. 최종 JSON/텍스트 응답을 파싱하는 텍스트 전용 Gemini CLI 스타일 백엔드는 공유 `google-gemini` 태그 계약을 유지할 수 있습니다.

      일부 스트림 헬퍼는 의도적으로 제공자 로컬에 남아 있습니다. `@openclaw/anthropic-provider`는 Claude OAuth 베타 처리와 `context1m` 게이팅을 인코딩하므로 `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, 하위 수준 Anthropic 래퍼 빌더를 자체 공개 `api.ts` / `contract-api.ts` 접점에 유지합니다. xAI Plugin도 네이티브 xAI Responses 형성을 자체 `wrapStreamFn`(`/fast` 별칭, 기본 `tool_stream`, 지원되지 않는 strict-tool 정리, xAI 전용 추론 페이로드 제거)에 유지합니다.

      동일한 패키지 루트 패턴은 `@openclaw/openai-provider`(제공자 빌더, 기본 모델 헬퍼, 실시간 제공자 빌더)와 `@openclaw/openrouter-provider`(제공자 빌더 및 온보딩/구성 헬퍼)도 뒷받침합니다.
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

        `resolveUsageAuth`에는 세 가지 결과가 있습니다. 제공자에 사용량/청구
        자격 증명이 있으면 `{ token, accountId? }`를 반환합니다. 제공자가
        사용량 auth를 확실히 처리했지만 사용할 수 있는 사용량 토큰이 없고,
        OpenClaw가 일반 API 키/OAuth 폴백을 건너뛰어야 하는 경우에만
        `{ handled: true }`를 반환합니다. 제공자가 요청을 처리하지 않았고
        OpenClaw가 일반 폴백을 계속해야 하는 경우 `null` 또는 `undefined`를
        반환합니다.
      </Tab>
    </Tabs>

    <Accordion title="사용 가능한 모든 제공자 훅">
      OpenClaw는 다음 순서로 훅을 호출합니다. 대부분의 제공자는 2-3개만 사용합니다.
      `ProviderPlugin.capabilities` 및 `suppressBuiltInModel`처럼 OpenClaw가
      더 이상 호출하지 않는 호환성 전용 제공자 필드는 여기에 나열하지 않습니다.

      | # | 훅 | 사용 시점 |
      | --- | --- | --- |
      | 1 | `catalog` | 모델 카탈로그 또는 기본 base URL |
      | 2 | `applyConfigDefaults` | 구성 구체화 중 제공자가 소유한 전역 기본값 |
      | 3 | `normalizeModelId` | 조회 전 레거시/프리뷰 모델 ID 별칭 정리 |
      | 4 | `normalizeTransport` | 일반 모델 조립 전 제공자 계열 `api` / `baseUrl` 정리 |
      | 5 | `normalizeConfig` | `models.providers.<id>` 구성 정규화 |
      | 6 | `applyNativeStreamingUsageCompat` | 구성 제공자의 네이티브 streaming-usage 호환성 재작성 |
      | 7 | `resolveConfigApiKey` | 제공자 소유 env-marker auth 해석 |
      | 8 | `resolveSyntheticAuth` | 로컬/자체 호스팅 또는 구성 기반 synthetic auth |
      | 9 | `shouldDeferSyntheticProfileAuth` | synthetic 저장 프로필 placeholder를 env/config auth 뒤로 낮춤 |
      | 10 | `resolveDynamicModel` | 임의의 업스트림 모델 ID 허용 |
      | 11 | `prepareDynamicModel` | 해석 전 비동기 메타데이터 가져오기 |
      | 12 | `normalizeResolvedModel` | 러너 전 transport 재작성 |
      | 13 | `normalizeToolSchemas` | 등록 전 제공자 소유 도구 스키마 정리 |
      | 14 | `inspectToolSchemas` | 제공자 소유 도구 스키마 진단 |
      | 15 | `resolveReasoningOutputMode` | 태그 기반 대 네이티브 reasoning-output 계약 |
      | 16 | `prepareExtraParams` | 기본 요청 매개변수 |
      | 17 | `createStreamFn` | 완전한 사용자 지정 StreamFn transport |
      | 19 | `wrapStreamFn` | 일반 스트림 경로의 사용자 지정 헤더/본문 래퍼 |
      | 20 | `resolveTransportTurnState` | 네이티브 턴별 헤더/메타데이터 |
      | 21 | `resolveWebSocketSessionPolicy` | 네이티브 WS 세션 헤더/쿨다운 |
      | 22 | `formatApiKey` | 사용자 지정 런타임 토큰 형태 |
      | 23 | `refreshOAuth` | 사용자 지정 OAuth refresh |
      | 24 | `buildAuthDoctorHint` | Auth 복구 가이드 |
      | 25 | `matchesContextOverflowError` | 제공자 소유 overflow 감지 |
      | 26 | `classifyFailoverReason` | 제공자 소유 rate-limit/overload 분류 |
      | 27 | `isCacheTtlEligible` | 프롬프트 캐시 TTL 게이팅 |
      | 28 | `buildMissingAuthMessage` | 사용자 지정 missing-auth 힌트 |
      | 29 | `augmentModelCatalog` | Synthetic forward-compat 행 |
      | 30 | `resolveThinkingProfile` | 모델별 `/think` 옵션 집합 |
      | 31 | `isBinaryThinking` | 이진 thinking on/off 호환성 |
      | 32 | `supportsXHighThinking` | `xhigh` reasoning 지원 호환성 |
      | 33 | `resolveDefaultThinkingLevel` | 기본 `/think` 정책 호환성 |
      | 34 | `isModernModelRef` | 라이브/스모크 모델 매칭 |
      | 35 | `prepareRuntimeAuth` | 추론 전 토큰 교환 |
      | 36 | `resolveUsageAuth` | 사용자 지정 사용량 자격 증명 파싱 |
      | 37 | `fetchUsageSnapshot` | 사용자 지정 사용량 엔드포인트 |
      | 38 | `createEmbeddingProvider` | 메모리/검색을 위한 제공자 소유 임베딩 어댑터 |
      | 39 | `buildReplayPolicy` | 사용자 지정 transcript replay/compaction 정책 |
      | 40 | `sanitizeReplayHistory` | 일반 정리 후 제공자별 replay 재작성 |
      | 41 | `validateReplayTurns` | 임베디드 러너 전 엄격한 replay-turn 검증 |
      | 42 | `onModelSelected` | 선택 후 콜백(예: telemetry) |

      런타임 폴백 참고:

      - `normalizeConfig`는 먼저 매칭된 제공자를 확인한 다음, 실제로 구성을 변경하는 훅이 나올 때까지 훅을 지원하는 다른 제공자 Plugin을 확인합니다. 지원되는 Google 계열 구성 항목을 재작성하는 제공자 훅이 없으면 번들 Google 구성 정규화기가 계속 적용됩니다.
      - `resolveConfigApiKey`는 노출된 경우 제공자 훅을 사용합니다. Amazon Bedrock은 AWS env-marker 해석을 해당 제공자 Plugin에 유지합니다. 런타임 auth 자체는 `auth: "aws-sdk"`로 구성된 경우 여전히 AWS SDK 기본 체인을 사용합니다.
      - `resolveThinkingProfile(ctx)`는 선택된 `provider`, `modelId`, 선택적으로 병합된 `reasoning` 카탈로그 힌트, 선택적으로 병합된 모델 `compat` 사실을 받습니다. `compat`는 제공자의 thinking UI/profile을 선택하는 데만 사용하세요.
      - `resolveSystemPromptContribution`을 사용하면 제공자가 모델 계열에 대해 캐시 인식 system-prompt 가이드를 주입할 수 있습니다. 동작이 하나의 제공자/모델 계열에 속하고 stable/dynamic 캐시 분할을 보존해야 할 때는 `before_prompt_build`보다 이를 선호하세요.

      자세한 설명과 실제 예시는 [내부: 제공자 런타임 훅](/ko/plugins/architecture-internals#provider-runtime-hooks)을 참조하세요.
    </Accordion>

  </Step>

  <Step title="추가 기능 추가(선택 사항)">
    ### 단계 5: 추가 기능 추가

    제공자 Plugin은 텍스트 추론과 함께 임베딩, 음성, 실시간 전사,
    실시간 음성, 미디어 이해, 이미지 생성, 비디오 생성, 웹 가져오기,
    웹 검색을 등록할 수 있습니다. OpenClaw는 이를 **하이브리드 기능**
    Plugin으로 분류합니다. 회사 Plugin에 권장되는 패턴입니다
    (벤더당 하나의 Plugin). [내부: 기능 소유권](/ko/plugins/architecture#capability-ownership-model)을
    참조하세요.

    기존 `api.registerProvider(...)` 호출과 함께 `register(api)` 안에서
    각 기능을 등록합니다. 필요한 탭만 선택하세요:

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
          defaultTimeoutMs: 120_000,
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

        제공자 HTTP 실패에는 `assertOkOrThrowProviderError(...)`를 사용하여
        Plugin이 제한된 오류 본문 읽기, JSON 오류 파싱, request-id 접미사를
        공유하도록 하세요.
      </Tab>
      <Tab title="실시간 전사">
        `createRealtimeTranscriptionWebSocketSession(...)`을 선호하세요. 공유
        헬퍼가 프록시 캡처, 재연결 backoff, close flushing, ready handshake,
        오디오 큐잉, close-event 진단을 처리합니다. Plugin은 업스트림 이벤트만
        매핑하면 됩니다.

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

        multipart 오디오를 POST하는 배치 STT 제공자는
        `openclaw/plugin-sdk/provider-http`의
        `buildAudioTranscriptionFormData(...)`를 사용해야 합니다. 이 헬퍼는
        호환되는 전사 API를 위해 M4A 스타일 파일명이 필요한 AAC 업로드를
        포함해 업로드 파일명을 정규화합니다.
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

        `capabilities`를 선언하여 `talk.catalog`가 유효한 모드,
        전송 방식, 오디오 형식, 기능 플래그를 브라우저 및 네이티브 Talk
        클라이언트에 노출할 수 있게 하세요. 전송 방식이 사람이 어시스턴트 재생을
        중단하고 있음을 감지할 수 있고 공급자가 활성 오디오 응답을
        자르거나 지우는 기능을 지원하는 경우 `handleBargeIn`을 구현하세요.
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

        의도적으로 자격 증명을 요구하지 않는 로컬 또는 자체 호스팅 미디어 공급자는
        `resolveAuth`를 노출하고 `kind: "none"`을 반환할 수 있습니다.
        명시적으로 옵트인하지 않은 공급자에 대해서는 OpenClaw가 여전히 일반 인증 게이트를
        유지합니다. 기존 공급자는 계속 `req.apiKey`를 읽어도 되며,
        새 공급자는 `req.auth`를 선호해야 합니다.

        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "local-audio",
          capabilities: ["audio"],
          resolveAuth: () => ({
            kind: "none",
            source: "local-audio plugin no-auth",
          }),
          transcribeAudio: async (req) => ({ text: "Transcript..." }),
        });
        ```
      </Tab>
      <Tab title="Embeddings">
        ```typescript
        api.registerEmbeddingProvider({
          id: "acme-ai",
          defaultModel: "acme-embed",
          transport: "remote",
          authProviderId: "acme-ai",
          create: async ({ model }) => ({
            provider: {
              id: "acme-ai",
              model,
              dimensions: 1536,
              embed: async (input) => {
                const text = typeof input === "string" ? input : input.text;
                return fetchAcmeEmbedding(text);
              },
              embedBatch: async (inputs) =>
                Promise.all(
                  inputs.map((input) =>
                    fetchAcmeEmbedding(typeof input === "string" ? input : input.text),
                  ),
                ),
            },
          }),
        });
        ```

        `contracts.embeddingProviders`에 동일한 id를 선언하세요. 이는
        메모리 검색을 포함해 재사용 가능한 벡터 생성을 위한 일반 임베딩 계약입니다.
        `registerMemoryEmbeddingProvider(...)`는 기존 메모리 전용 어댑터를 위한
        사용 중단된 호환성입니다.
      </Tab>
      <Tab title="Image and video generation">
        비디오 기능은 **모드 인식** 형태를 사용합니다: `generate`,
        `imageToVideo`, `videoToVideo`. `maxInputImages` / `maxInputVideos` /
        `maxDurationSeconds` 같은 평면 집계 필드만으로는 변환 모드 지원이나
        비활성화된 모드를 깔끔하게 알리기에 충분하지 않습니다.
        음악 생성도 명시적인 `generate` / `edit` 블록으로 동일한 패턴을 따릅니다.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          generate: async (req) => ({ /* image result */ }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          defaultTimeoutMs: 600_000,
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

공급자 Plugin은 다른 외부 코드 Plugin과 동일한 방식으로 게시합니다.

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

`catalog.order`는 내장 공급자와 비교해 카탈로그가 병합되는 시점을 제어합니다.

| 순서      | 시점          | 사용 사례                                        |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | 첫 번째 패스  | 단순 API 키 공급자                              |
| `profile` | simple 이후   | 인증 프로필에 의해 제한되는 공급자              |
| `paired`  | profile 이후  | 관련 항목 여러 개 합성                          |
| `late`    | 마지막 패스   | 기존 공급자 재정의(충돌 시 우선)                |

## 다음 단계

- [채널 Plugin](/ko/plugins/sdk-channel-plugins) - Plugin이 채널도 제공하는 경우
- [SDK 런타임](/ko/plugins/sdk-runtime) - `api.runtime` 헬퍼(TTS, 검색, 하위 에이전트)
- [SDK 개요](/ko/plugins/sdk-overview) - 전체 하위 경로 가져오기 참조
- [Plugin 내부 구조](/ko/plugins/architecture-internals#provider-runtime-hooks) - 훅 세부 정보와 번들 예시

## 관련 항목

- [Plugin SDK 설정](/ko/plugins/sdk-setup)
- [Plugin 빌드](/ko/plugins/building-plugins)
- [채널 Plugin 빌드](/ko/plugins/sdk-channel-plugins)
