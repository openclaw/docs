---
read_when:
    - 새 모델 제공자 Plugin을 빌드하고 있습니다
    - OpenClaw에 OpenAI 호환 프록시 또는 사용자 지정 LLM을 추가하려는 경우
    - 공급자 인증, 카탈로그 및 런타임 훅을 이해해야 합니다
sidebarTitle: Provider plugins
summary: OpenClaw용 모델 제공자 Plugin 구축 단계별 가이드
title: 제공자 Plugin 빌드하기
x-i18n:
    generated_at: "2026-07-12T01:03:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ebbe59b4487a93c6fec3624251eff7394197e249bb8fc7899f1fc88162510d1c
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

OpenClaw에 모델 공급자(LLM)를 추가하는 공급자 Plugin을 구축합니다. 모델
카탈로그, API 키 인증, 동적 모델 해석을 포함합니다.

<Info>
  OpenClaw Plugin이 처음이신가요? 패키지 구조와 매니페스트 설정을 알아보려면
  먼저 [시작하기](/ko/plugins/building-plugins)를 읽어보세요.
</Info>

<Tip>
  공급자 Plugin은 OpenClaw의 일반 추론 루프에 모델을 추가합니다. 모델이 스레드,
  Compaction 또는 도구 이벤트를 소유하는 네이티브 에이전트 데몬을 통해 실행되어야
  한다면, 데몬 프로토콜 세부 정보를 코어에 넣는 대신 공급자를 [에이전트
  하네스](/ko/plugins/sdk-agent-harness)와 함께 사용하세요.
</Tip>

## 단계별 안내

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

    `setup.providers[].envVars`를 사용하면 OpenClaw가 Plugin 런타임을 로드하지
    않고도 자격 증명을 감지할 수 있습니다. 공급자 변형이 다른 공급자 ID의 인증을
    재사용해야 한다면 `providerAuthAliases`를 추가하세요. `modelSupport`는
    선택 사항이며, 런타임 훅이 존재하기 전에 `acme-large`와 같은 축약 모델
    ID를 통해 OpenClaw가 공급자 Plugin을 자동으로 로드할 수 있게 합니다.
    `package.json`의 `openclaw.compat` 및 `openclaw.build`는 ClawHub 게시에
    필요합니다(`openclaw.compat.pluginApi`와 `openclaw.build.openclawVersion`가
    필수 필드 두 개이며, `minGatewayVersion`을 생략하면
    `openclaw.install.minHostVersion`으로 대체됩니다).

  </Step>

  <Step title="공급자 등록">
    최소한의 텍스트 공급자에는 `id`, `label`, `auth`, `catalog`가 필요합니다.
    `catalog`는 공급자가 소유하는 런타임/구성 훅입니다. 실시간 공급업체 API를
    호출할 수 있으며 `models.providers` 항목을 반환합니다.

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

    `registerModelCatalogProvider`는 목록/도움말/선택기 UI를 위한 최신 제어 영역
    카탈로그 표면으로, `text`, `voice`, `image_generation`,
    `video_generation`, `music_generation` 행을 다룹니다. 공급업체 엔드포인트
    호출과 응답 매핑은 Plugin에 유지하세요. OpenClaw는 공유 행 형식, 소스
    레이블, 도움말 렌더링을 담당합니다.

    이것으로 작동하는 공급자가 완성됩니다. 이제 사용자는
    `openclaw onboard --acme-ai-api-key <key>`를 실행하고
    `acme-ai/acme-large`를 모델로 선택할 수 있습니다.

    ### 실시간 모델 검색

    공급자가 `/models` 형식의 API를 제공한다면, 공급자별 엔드포인트와 행
    프로젝션은 Plugin에 유지하고 공유 가져오기 수명 주기에는
    `openclaw/plugin-sdk/provider-catalog-live-runtime`을 사용하세요. 이
    도우미는 공급자 정책을 OpenClaw 코어에 넣지 않고도 보호된 HTTP 가져오기,
    공급자 인증 헤더, 구조화된 HTTP 오류, TTL 캐싱, 정적 대체 동작을 제공합니다.

    실시간 API가 현재 사용 가능한 공급자 소유 정적 카탈로그 행만 알려주는 경우
    `buildLiveModelProviderConfig`를 사용하세요.

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

    공급자 API가 더 풍부한 메타데이터를 반환하고 Plugin이 직접 행을 OpenClaw
    모델 정의로 프로젝션해야 한다면 `getCachedLiveProviderModelRows`를
    사용하세요.

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

    `run`에는 인증 관문을 유지해야 하며, 사용할 수 있는 자격 증명이 없으면
    `null`을 반환해야 합니다. 설정, 문서, 테스트, 선택기 표면이 실시간 네트워크
    접근에 의존하지 않도록 오프라인 `staticRun` 또는 정적 대체 경로를
    유지하세요. 모델 목록의 최신성에 적합한 TTL을 사용하고, 요청 시점 파일
    시스템 폴링을 피하세요. 업스트림 응답이 OpenAI 호환
    `{ data: [{ id, object }] }` 형식이 아닐 때만 공급자별 `readRows` /
    `readModelId`를 전달하세요.

    업스트림 공급자가 OpenClaw와 다른 제어 토큰을 사용한다면 스트림 경로를
    교체하지 말고 작은 양방향 텍스트 변환을 추가하세요.

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

    `input`은 전송 전에 최종 시스템 프롬프트와 텍스트 메시지 콘텐츠를 다시
    작성합니다. `output`은 OpenClaw가 자체 제어 마커를 파싱하거나 채널로
    전달하기 전에 어시스턴트 텍스트 델타와 최종 텍스트를 다시 작성합니다.

    API 키 인증과 단일 카탈로그 기반 런타임을 갖춘 텍스트 공급자 하나만 등록하는
    번들 공급자의 경우 더 범위가 좁은 `defineSingleProviderPluginEntry(...)`
    도우미를 우선 사용하세요:

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

    `buildProvider`는 OpenClaw가 실제 제공자 인증을 확인할 수 있을 때 사용하는
    실시간 카탈로그 경로입니다. 이 경로에서는 제공자별 탐색을 수행할 수 있습니다.
    인증을 구성하기 전에 표시해도 안전한 오프라인 항목에만
    `buildStaticProvider`를 사용하세요. 이 함수는 자격 증명을 요구하거나 네트워크
    요청을 수행해서는 안 됩니다. 현재 OpenClaw의 `models list --all` 표시는
    빈 구성과 빈 환경을 사용하고 에이전트/워크스페이스 경로 없이 번들 제공자
    Plugin에 대해서만 정적 카탈로그를 실행합니다.

    인증 흐름에서 온보딩 중 `models.providers.*`, 별칭 및 에이전트 기본 모델도
    수정해야 한다면 `openclaw/plugin-sdk/provider-onboard`의 프리셋 헬퍼를
    사용하세요. 가장 범위가 좁은 헬퍼는
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)` 및
    `createModelCatalogPresetAppliers(...)`입니다.

    제공자의 네이티브 엔드포인트가 일반 `openai-completions` 전송 방식에서
    스트리밍 사용량 블록을 지원한다면 제공자 ID 검사를 하드코딩하는 대신
    `openclaw/plugin-sdk/provider-catalog-shared`의 공유 카탈로그 헬퍼를
    사용하세요. `supportsNativeStreamingUsageCompat(...)` 및
    `applyProviderNativeStreamingUsageCompat(...)`는 엔드포인트 기능 맵에서
    지원 여부를 감지하므로, Plugin이 사용자 지정 제공자 ID를 사용하는 경우에도
    네이티브 Moonshot/DashScope 방식의 엔드포인트가 계속 명시적으로 참여할 수
    있습니다.

    위의 실시간 탐색 예시는 `/models` 방식의 제공자 API를 다룹니다. 해당 탐색은
    사용 가능한 인증이 있을 때만 `catalog.run` 내에서 수행하고, 오프라인
    카탈로그 생성을 위해 `staticRun`에서는 네트워크를 사용하지 마세요.

  </Step>

  <Step title="동적 모델 확인 추가">
    제공자가 프록시나 라우터처럼 임의의 모델 ID를 허용한다면
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

    확인에 네트워크 호출이 필요하다면 비동기 준비 작업에
    `prepareDynamicModel`을 사용하세요. 작업이 완료되면
    `resolveDynamicModel`이 다시 실행됩니다.

  </Step>

  <Step title="런타임 훅 추가(필요한 경우)">
    대부분의 제공자는 `catalog`와 `resolveDynamicModel`만 필요합니다. 제공자의
    요구 사항에 따라 훅을 점진적으로 추가하세요.

    이제 공유 헬퍼 빌더가 가장 일반적인 재생/도구 호환 제품군을 지원하므로,
    일반적으로 Plugin에서 각 훅을 하나씩 직접 연결할 필요가 없습니다.

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

    현재 사용 가능한 재생 제품군:

    | 제품군 | 연결되는 기능 | 번들 예시 |
    | --- | --- | --- |
    | `openai-compatible` | 도구 호출 ID 정리, 어시스턴트 우선 순서 수정 및 전송 방식에 필요한 일반 Gemini 턴 검증을 포함하는 OpenAI 호환 전송 방식용 공유 OpenAI 방식 재생 정책 | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | `modelId`에 따라 선택되는 Claude 인식 재생 정책으로, 확인된 모델이 실제 Claude ID인 경우에만 Anthropic 메시지 전송 방식에 Claude 전용 사고 블록 정리를 적용 | `amazon-bedrock` |
    | `native-anthropic-by-model` | `anthropic-by-model`과 동일한 모델별 Claude 정책에 더해, 공급업체 네이티브 ID를 유지해야 하는 전송 방식을 위한 도구 호출 ID 정리 및 네이티브 Anthropic 도구 사용 ID 보존 | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | 네이티브 Gemini 재생 정책 및 부트스트랩 재생 정리. 공유 제품군은 텍스트 출력 Gemini CLI에서 태그 기반 추론을 유지합니다. 직접 `google` 제공자는 Gemini API의 사고가 네이티브 사고 부분으로 전달되므로 `resolveReasoningOutputMode`를 `native`로 재정의합니다. | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | OpenAI 호환 프록시 전송 방식을 통해 실행되는 Gemini 모델을 위한 Gemini 사고 서명 정리. 네이티브 Gemini 재생 검증이나 부트스트랩 재작성을 활성화하지 않음 | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | 하나의 Plugin에서 Anthropic 메시지와 OpenAI 호환 모델 표면을 혼합하는 제공자를 위한 하이브리드 정책. 선택적인 Claude 전용 사고 블록 제거는 Anthropic 측에만 한정됨 | `minimax` |

    현재 사용 가능한 스트림 제품군:

    | 제품군 | 연결되는 기능 | 번들 예시 |
    | --- | --- | --- |
    | `google-thinking` | 공유 스트림 경로에서 Gemini 사고 페이로드 정규화 | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | 공유 프록시 스트림 경로의 Kilo 추론 래퍼. `kilo/auto` 및 지원되지 않는 프록시 추론 ID에서는 주입된 사고를 건너뜀 | `kilocode` |
    | `moonshot-thinking` | 구성 및 `/think` 수준에 따른 Moonshot 이진 네이티브 사고 페이로드 매핑 | `moonshot` |
    | `minimax-fast-mode` | 공유 스트림 경로에서 MiniMax 고속 모드 모델 재작성 | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | 공유 네이티브 OpenAI/Codex Responses 래퍼: 출처 표시 헤더, `/fast`/`serviceTier`, 텍스트 상세도, 네이티브 Codex 웹 검색, 추론 호환 페이로드 구성 및 Responses 컨텍스트 관리 | `openai` |
    | `openrouter-thinking` | 프록시 경로용 OpenRouter 추론 래퍼. 지원되지 않는 모델/`auto` 건너뛰기를 중앙에서 처리 | `openrouter` |
    | `tool-stream-default-on` | 명시적으로 비활성화하지 않는 한 도구 스트리밍을 사용하려는 Z.AI 같은 제공자를 위한 기본 활성 `tool_stream` 래퍼 | `zai` |

    <Accordion title="제품군 빌더를 지원하는 SDK 연결부">
      각 제품군 빌더는 동일한 패키지에서 내보내는 하위 수준 공개 헬퍼로 구성되며, 제공자가 일반적인 패턴을 벗어나야 할 때 사용할 수 있습니다.

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)` 및 원시 재생 빌더(`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`). 또한 Gemini 재생 헬퍼(`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`)와 엔드포인트/모델 헬퍼(`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`)를 내보냅니다.
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, 공유 OpenAI/Codex 래퍼(`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), DeepSeek V4 OpenAI 호환 래퍼(`createDeepSeekV4OpenAICompatibleThinkingWrapper`), Anthropic Messages 사고 미리 채우기 정리(`createAnthropicThinkingPrefillPayloadWrapper`), 일반 텍스트 도구 호출 호환 기능(`createPlainTextToolCallCompatWrapper`) 및 공유 프록시/제공자 래퍼(`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`).
      - `openclaw/plugin-sdk/provider-stream-shared` - `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)` 및 `setQwenChatTemplateThinking(...)`을 포함하는 사용 빈도가 높은 제공자 경로용 경량 페이로드 및 이벤트 래퍼.
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")` 및 기반 제공자 스키마 헬퍼.

      Gemini 제품군 제공자의 경우 추론 출력 모드를 전송 방식에 맞게
      유지하세요. 직접 Google Gemini API를 사용하는 제공자는 OpenClaw가
      `<think>` / `<final>` 프롬프트 지시문을 추가하지 않고 네이티브 사고 부분을
      처리할 수 있도록 `native` 추론 출력을 사용해야 합니다. 최종 JSON/텍스트
      응답을 파싱하는 텍스트 전용 Gemini CLI 방식 백엔드는 공유
      `google-gemini` 태그 기반 계약을 유지할 수 있습니다.

      일부 스트림 헬퍼는 의도적으로 제공자 로컬에 유지됩니다.
      `@openclaw/anthropic-provider`는 Claude OAuth 베타 처리와 `context1m`
      게이팅을 구현하므로 `wrapAnthropicProviderStream`,
      `resolveAnthropicBetas`, `resolveAnthropicFastMode`,
      `resolveAnthropicServiceTier` 및 하위 수준 Anthropic 래퍼 빌더를 자체
      공개 `api.ts` / `contract-api.ts` 연결부에 유지합니다. 마찬가지로 xAI
      Plugin은 네이티브 xAI Responses 구성을 자체 `wrapStreamFn`에 유지합니다
      (`/fast` 별칭, 기본 `tool_stream`, 지원되지 않는 엄격한 도구 정리,
      xAI 전용 추론 페이로드 제거).

      동일한 패키지 루트 패턴은 `@openclaw/openai-provider`(제공자 빌더,
      기본 모델 헬퍼, 실시간 제공자 빌더)와
      `@openclaw/openrouter-provider`(제공자 빌더 및 온보딩/구성 헬퍼)도
      지원합니다.
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
      <Tab title="네이티브 전송 방식 식별 정보">
        일반 HTTP 또는 WebSocket 전송 방식에 네이티브 요청/세션 헤더나
        메타데이터가 필요한 제공자의 경우:

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
        사용량/청구 데이터를 제공하는 공급자의 경우:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        `resolveUsageAuth`에는 세 가지 결과가 있습니다. 공급자에 사용량/청구
        자격 증명이 있으면 `{ token, accountId?, subscriptionType?,
        rateLimitTier? }`를 반환합니다(선택적 필드는 확인된 프로필의 비밀이 아닌
        요금제 메타데이터를 `fetchUsageSnapshot`으로 전달합니다). 공급자가 사용량
        인증을 확실히 처리했지만 사용할 수 있는 사용량 토큰이 없고 OpenClaw가
        일반 API 키/OAuth 대체 경로를 건너뛰어야 할 때만 `{ handled: true }`를
        반환합니다. 공급자가 요청을 처리하지 않았으며 OpenClaw가 일반 대체
        경로를 계속 사용해야 하면 `null` 또는 `undefined`를 반환합니다.

        `contracts.usageProviders`에 공급자 ID를 선언합니다. 해당 매니페스트
        계약과 **두** 훅이 모두 있으면 OpenClaw는 관련 없는 공급자 Plugin을
        로드하지 않고도 사용량 수집에 공급자를 자동으로 포함합니다. 코어
        허용 목록을 업데이트할 필요가 없습니다.
        `fetchUsageSnapshot`은 공유되는 공급자 중립적 형식을 반환합니다:

        - `plan`: 공급자가 보고한 구독 또는 키 레이블
        - `windows`: 사용률 백분율로 표시되는 재설정 가능 할당량 기간
        - `billing`: 유형이 지정된 `balance`, `spend` 또는 `budget` 항목.
          `unit`은 ISO 통화 또는 `credits` 같은 공급자 단위일 수 있습니다
        - `summary`: 위의 구조화된 필드에 포함되지 않는 간결한 공급자별 컨텍스트

        통화의 의미를 정확하게 유지하세요. 업스트림 계약에 명시되어 있지 않은
        한 공급자 크레딧은 USD가 아닙니다. `fetchUsageSnapshot`만 구현하는
        Plugin은 명시적/합성 호출자에게 계속 제공되지만 OpenClaw가 해당 사용량
        자격 증명을 확인할 수 없으므로 자동 검색되지 않습니다.
      </Tab>
    </Tabs>

    <Accordion title="일반적인 공급자 훅">
      OpenClaw는 모델/공급자 Plugin에 대해 대략 다음 순서로 훅을 호출합니다.
      대부분의 공급자는 2~3개만 사용합니다. 이는 전체 `ProviderPlugin`
      계약이 아닙니다. 완전하고 현재 기준으로 정확한 훅 목록 및 대체 경로 참고
      사항은 [내부 구조: 공급자 런타임
      훅](/ko/plugins/architecture-internals#provider-runtime-hooks)을 참조하세요.
      `ProviderPlugin.capabilities` 및 `suppressBuiltInModel`처럼 OpenClaw가
      더 이상 호출하지 않는 호환성 전용 공급자 필드는 여기에 나열되지 않습니다.

      | 훅 | 사용 시점 |
      | --- | --- |
      | `catalog` | 모델 카탈로그 또는 기본 URL 기본값 |
      | `applyConfigDefaults` | 구성 구체화 중 공급자가 소유하는 전역 기본값 |
      | `normalizeModelId` | 조회 전 레거시/미리 보기 모델 ID 별칭 정리 |
      | `normalizeTransport` | 일반 모델 조립 전 공급자 계열 `api` / `baseUrl` 정리 |
      | `normalizeConfig` | `models.providers.<id>` 구성 정규화 |
      | `applyNativeStreamingUsageCompat` | 구성 공급자의 네이티브 스트리밍 사용량 호환성 재작성 |
      | `resolveConfigApiKey` | 공급자가 소유하는 환경 변수 마커 인증 확인 |
      | `resolveSyntheticAuth` | 로컬/자체 호스팅 또는 구성 기반 합성 인증 |
      | `resolveExternalAuthProfiles` | CLI/앱에서 관리하는 자격 증명을 위해 공급자가 소유하는 외부 인증 프로필 오버레이 |
      | `shouldDeferSyntheticProfileAuth` | 환경 변수/구성 인증보다 합성 저장 프로필 자리표시자의 우선순위를 낮춤 |
      | `resolveDynamicModel` | 임의의 업스트림 모델 ID 허용 |
      | `prepareDynamicModel` | 확인 전 비동기 메타데이터 가져오기 |
      | `normalizeResolvedModel` | 실행기 전 전송 방식 재작성 |
      | `normalizeToolSchemas` | 등록 전 공급자가 소유하는 도구 스키마 정리 |
      | `inspectToolSchemas` | 공급자가 소유하는 도구 스키마 진단 |
      | `resolveReasoningOutputMode` | 태그 기반 및 네이티브 추론 출력 계약 |
      | `prepareExtraParams` | 기본 요청 매개변수 |
      | `createStreamFn` | 완전한 사용자 지정 StreamFn 전송 방식 |
      | `wrapStreamFn` | 일반 스트림 경로의 사용자 지정 헤더/본문 래퍼 |
      | `resolveTransportTurnState` | 네이티브 턴별 헤더/메타데이터 |
      | `resolveWebSocketSessionPolicy` | 네이티브 WS 세션 헤더/대기 시간 |
      | `formatApiKey` | 사용자 지정 런타임 토큰 형식 |
      | `refreshOAuth` | 사용자 지정 OAuth 갱신 |
      | `buildAuthDoctorHint` | 인증 복구 안내 |
      | `matchesContextOverflowError` | 공급자가 소유하는 오버플로 감지 |
      | `classifyFailoverReason` | 공급자가 소유하는 속도 제한/과부하 분류 |
      | `isCacheTtlEligible` | 프롬프트 캐시 TTL 적용 조건 |
      | `buildMissingAuthMessage` | 사용자 지정 인증 누락 안내 |
      | `augmentModelCatalog` | 합성 순방향 호환성 행(사용 중단됨 - `registerModelCatalogProvider` 권장) |
      | `resolveThinkingProfile` | 모델별 `/think` 옵션 집합 |
      | `isBinaryThinking` | 이진 사고 켜기/끄기 호환성(사용 중단됨 - `resolveThinkingProfile` 권장) |
      | `supportsXHighThinking` | `xhigh` 추론 지원 호환성(사용 중단됨 - `resolveThinkingProfile` 권장) |
      | `resolveDefaultThinkingLevel` | 기본 `/think` 정책 호환성(사용 중단됨 - `resolveThinkingProfile` 권장) |
      | `isModernModelRef` | 라이브/스모크 모델 일치 여부 |
      | `prepareRuntimeAuth` | 추론 전 토큰 교환 |
      | `resolveUsageAuth` | 사용자 지정 사용량 자격 증명 구문 분석 |
      | `fetchUsageSnapshot` | 사용자 지정 사용량 엔드포인트 |
      | `createEmbeddingProvider` | 메모리/검색용 공급자 소유 임베딩 어댑터 |
      | `buildReplayPolicy` | 사용자 지정 대화 기록 재생/Compaction 정책 |
      | `sanitizeReplayHistory` | 일반 정리 후 공급자별 재생 재작성 |
      | `validateReplayTurns` | 임베디드 실행기 전 엄격한 재생 턴 검증 |
      | `onModelSelected` | 선택 후 콜백(예: 원격 측정) |

      런타임 대체 경로 참고 사항:

      - `normalizeConfig`는 공급자 ID마다 하나의 소유 Plugin을 확인하고(번들 공급자를 먼저 확인한 뒤 일치하는 런타임 Plugin 확인) 해당 훅만 호출합니다. 다른 공급자를 모두 검색하지 않습니다. `google` / `google-vertex` / `google-antigravity` 구성 항목을 정규화하는 것은 Google 자체의 `normalizeConfig` 훅이며, 별도의 코어 대체 경로가 아닙니다.
      - `resolveConfigApiKey`는 제공되는 경우 공급자 훅을 사용합니다. Amazon Bedrock은 AWS 환경 변수 마커 확인을 해당 공급자 Plugin에 유지합니다. 런타임 인증 자체는 `auth: "aws-sdk"`로 구성된 경우에도 AWS SDK 기본 체인을 사용합니다.
      - `resolveThinkingProfile(ctx)`는 선택된 `provider`, `modelId`, 선택적인 병합된 `reasoning` 카탈로그 힌트, 선택적인 병합된 모델 `compat` 정보를 받습니다. 공급자의 사고 UI/프로필을 선택할 때만 `compat`을 사용하세요.
      - `resolveSystemPromptContribution`을 사용하면 공급자가 모델 계열에 캐시 인식 시스템 프롬프트 지침을 삽입할 수 있습니다. 동작이 하나의 공급자/모델 계열에 속하며 안정적/동적 캐시 분리를 유지해야 하는 경우 레거시 Plugin 전체 범위의 `before_prompt_build` 훅보다 이를 우선 사용하세요.

    </Accordion>

  </Step>

  <Step title="추가 기능 추가(선택 사항)">
    ### 5단계: 추가 기능 추가

    공급자 Plugin은 텍스트 추론과 함께 임베딩, 음성, 실시간 전사,
    실시간 음성, 미디어 이해, 이미지 생성, 동영상 생성,
    웹 가져오기 및 웹 검색을 등록할 수 있습니다. OpenClaw는 이를
    **하이브리드 기능** Plugin으로 분류합니다. 이는 회사 Plugin에 권장되는
    패턴입니다(공급업체당 하나의 Plugin). [내부 구조: 기능
    소유권](/ko/plugins/architecture#capability-ownership-model)을 참조하세요.

    기존 `api.registerProvider(...)` 호출과 함께 `register(api)` 내부에
    각 기능을 등록하세요. 필요한 탭만 선택하세요:

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

        공급자 HTTP 실패에는 `assertOkOrThrowProviderError(...)`를 사용하여
        Plugin들이 크기가 제한된 오류 본문 읽기, JSON 오류 구문 분석 및
        요청 ID 접미사를 공유하도록 하세요.
      </Tab>
      <Tab title="실시간 전사">
        `createRealtimeTranscriptionWebSocketSession(...)`을 우선 사용하세요.
        이 공유 도우미는 프록시 캡처, 재연결 백오프, 종료 시 플러시, 준비
        핸드셰이크, 오디오 대기열 처리 및 종료 이벤트 진단을 처리합니다.
        Plugin은 업스트림 이벤트만 매핑하면 됩니다.

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
        `buildAudioTranscriptionFormData(...)`를 사용해야 합니다. 이 헬퍼는
        호환되는 음성 변환 API를 위해 M4A 형식의 파일 이름이 필요한 AAC 업로드를
        포함하여 업로드 파일 이름을 정규화합니다.
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
            handlesInputAudioBargeIn: true,
            supportsToolCalls: true,
          },
          isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
          createBridge: (req) => ({
            // 제공자가 하나의 호출에 대해 여러 도구 응답을 허용하는 경우에만
            // 이를 설정합니다. 예를 들어 즉시 "작업 중" 응답을 보낸 뒤
            // 최종 결과를 보내는 경우입니다.
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

        `talk.catalog`가 브라우저 및 네이티브 Talk 클라이언트에 유효한 모드,
        전송 방식, 오디오 형식, 기능 플래그를 노출할 수 있도록 `capabilities`를
        선언하세요. 전송 방식에서 사람이 어시스턴트 재생을 중단하고 있음을 감지할
        수 있고 제공자가 활성 오디오 응답의 자르기 또는 지우기를 지원하는 경우
        `handleBargeIn`을 구현하세요.
        동기식 제출의 경우 `submitToolResult`가 `void`를 반환할 수 있으며,
        제공자 브리지가 노출할 수 있는 비동기 완료 경계의 경우
        `Promise<void>`를 반환할 수 있습니다. Gateway 릴레이 세션은 최종 결과를
        확인하거나 연결된 실행을 지우기 전에 해당 프로미스를 기다리며, 제출이
        실패하면 이를 거부해야 합니다.
        제공자가 `options.suppressResponse`를 준수할 수 없는 경우
        `supportsToolResultSuppression: false`를 설정하세요. 그러면 OpenClaw는
        내부 강제 협의 및 취소 결과에 응답 억제를 적용하지 않으며, 응답을 암묵적으로
        시작하는 대신 직접 전달된 억제 결과 요청을 거부합니다.
        `createRealtimeVoiceBridgeSession` 사용자는 마찬가지로 `onToolCall`에서
        프로미스를 반환할 수 있습니다. 동기식 예외와 거부는 세션의 `onError`
        콜백으로 전달됩니다.
        제공자 VAD가 `onClearAudio("barge-in")`을 호출하여 중단을 확인하는
        경우에만 `handlesInputAudioBargeIn`을 설정하세요. 이 플래그를 생략한
        제공자는 OpenClaw의 로컬 입력 오디오 대체 감지 기능을 사용합니다.
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

        의도적으로 자격 증명을 요구하지 않는 로컬 또는 자체 호스팅 미디어 제공자는
        `resolveAuth`를 노출하고 `kind: "none"`을 반환할 수 있습니다.
        OpenClaw는 명시적으로 이 동작을 선택하지 않은 제공자에 대해서는 여전히
        일반 인증 관문을 유지합니다. 기존 제공자는 계속 `req.apiKey`를 읽을 수
        있으며, 새 제공자는 `req.auth`를 우선 사용해야 합니다.

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
      <Tab title="임베딩">
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

        `contracts.embeddingProviders`에 동일한 ID를 선언하세요. 이는 메모리
        검색을 포함하여 재사용 가능한 벡터 생성을 위한 일반 임베딩 계약입니다.
        `registerMemoryEmbeddingProvider(...)`는 기존 메모리 전용 어댑터를 위한
        더 이상 권장되지 않는 호환성 기능입니다.
      </Tab>
      <Tab title="이미지 및 동영상 생성">
        이미지 및 동영상 기능은 **모드 인식형** 구조를 사용합니다. 이미지
        제공자는 필수 `generate` 및 `edit` 기능 블록을 선언하고, 동영상 제공자는
        `generate`, `imageToVideo`, `videoToVideo`를 선언합니다.
        `maxInputImages` / `maxInputVideos` / `maxDurationSeconds` 같은 평면형
        집계 필드만으로는 변환 모드 지원 여부나 비활성화된 모드를 명확하게 알릴 수
        없습니다. 음악 생성도 동일한 `generate` / `edit` 패턴을 따릅니다.

        ```typescript
        api.registerImageGenerationProvider({
          id: "acme-ai",
          label: "Acme Images",
          capabilities: {
            generate: { maxCount: 4, supportsSize: true },
            edit: { enabled: false },
          },
          generateImage: async (req) => ({ images: [] }),
        });

        api.registerVideoGenerationProvider({
          id: "acme-ai",
          label: "Acme Video",
          defaultTimeoutMs: 600_000,
          models: ["acme-video", "acme-image-video"],
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
          catalogByModel: {
            "acme-image-video": {
              modes: ["imageToVideo"],
              capabilities: {
                imageToVideo: {
                  enabled: true,
                  maxVideos: 1,
                  maxInputImages: 1,
                  resolutions: ["480P", "720P", "1080P"],
                  supportsResolution: true,
                },
                videoToVideo: { enabled: false },
              },
            },
          },
          generateVideo: async (req) => ({ videos: [] }),
        });
        ```

        두 제공자 유형 모두 `capabilities`가 필수이며, `edit`와 동영상 변환
        블록(`imageToVideo`, `videoToVideo`)에는 항상 명시적인 `enabled`
        플래그가 필요합니다.

        나열된 모델의 정적 모드 또는 기능이 제공자 기본값과 다른 경우
        `catalogByModel`을 사용하세요. 이 메타데이터를 사용하면 제공자 코드를
        호출하지 않고도 `video_generate action=list`와 모델 카탈로그를
        정확하게 유지할 수 있습니다. 요청 시점의 기능 조회 및 적용은 여전히
        `resolveModelCapabilities`와 `generateVideo`에서 처리해야 하며, 가능하면
        두 경로 모두에서 동일한 기능 상수를 재사용하세요.
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
          hint: "Search the web through Acme's search backend.",
          envVars: ["ACME_SEARCH_API_KEY"],
          placeholder: "acme-...",
          signupUrl: "https://acme.example.com/search",
          credentialPath: "plugins.entries.acme.config.webSearch.apiKey",
          getCredentialValue: (searchConfig) => searchConfig?.acme?.apiKey,
          setCredentialValue: (searchConfigTarget, value) => {
            const acme = (searchConfigTarget.acme ??= {});
            acme.apiKey = value;
          },
          createTool: () => ({
            description: "Search the web through Acme Search.",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });
        ```

        두 제공자 유형은 동일한 자격 증명 연결 구조를 공유합니다.
        `hint`, `envVars`, `placeholder`, `signupUrl`, `credentialPath`,
        `getCredentialValue`, `setCredentialValue`, `createTool`은 모두
        필수입니다.
      </Tab>
    </Tabs>

  </Step>

  <Step title="테스트">
    ### 6단계: 테스트

    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // index.ts 또는 전용 파일에서 제공자 구성 객체를 내보냅니다.
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

제공자 Plugin은 다른 외부 코드 Plugin과 동일한 방식으로 게시합니다.

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

`clawhub skill publish <path>`는 Plugin 패키지가 아니라 Skills 폴더를
게시하기 위한 별도의 명령입니다. 여기에서는 사용하지 마세요.

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

`catalog.order`는 기본 제공자에 상대적으로 카탈로그가 병합되는 시점을
제어합니다.

| 순서      | 시점          | 사용 사례                                            |
| --------- | ------------- | ---------------------------------------------------- |
| `simple`  | 첫 번째 패스  | 일반 API 키 제공자                                   |
| `profile` | simple 이후  | 인증 프로필로 제한되는 제공자                        |
| `paired`  | profile 이후 | 서로 관련된 여러 항목 생성                           |
| `late`    | 마지막 패스   | 기존 제공자 재정의(충돌 시 우선 적용)                |

## 다음 단계

- [채널 Plugin](/ko/plugins/sdk-channel-plugins) - Plugin이 채널도 제공하는 경우
- [SDK 런타임](/ko/plugins/sdk-runtime) - `api.runtime` 도우미(TTS, 검색, 하위 에이전트)
- [SDK 개요](/ko/plugins/sdk-overview) - 전체 하위 경로 가져오기 참조
- [Plugin 내부 구조](/ko/plugins/architecture-internals#provider-runtime-hooks) - 훅 세부 정보 및 번들 예시

## 관련 문서

- [Plugin SDK 설정](/ko/plugins/sdk-setup)
- [Plugin 구축](/ko/plugins/building-plugins)
- [채널 Plugin 구축](/ko/plugins/sdk-channel-plugins)
