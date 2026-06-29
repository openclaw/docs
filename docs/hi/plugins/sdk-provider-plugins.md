---
read_when:
    - आप एक नया मॉडल प्रदाता plugin बना रहे हैं
    - आप OpenClaw में OpenAI-संगत प्रॉक्सी या कस्टम LLM जोड़ना चाहते हैं
    - आपको प्रदाता प्रमाणीकरण, कैटलॉग और रनटाइम हुक्स को समझना होगा
sidebarTitle: Provider plugins
summary: OpenClaw के लिए मॉडल प्रदाता Plugin बनाने की चरण-दर-चरण मार्गदर्शिका
title: Provider Plugin बनाना
x-i18n:
    generated_at: "2026-06-28T23:52:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05ac4d08eae00e7e0fcf03edea691dc9ced7309421dd19a31edf69cee1e01f0b
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

यह गाइड ऐसा provider plugin बनाने की प्रक्रिया बताती है जो OpenClaw में एक मॉडल प्रदाता
(LLM) जोड़ता है। अंत तक आपके पास मॉडल कैटलॉग,
API key auth, और गतिशील मॉडल रिज़ॉल्यूशन वाला एक provider होगा।

<Info>
  अगर आपने पहले कोई OpenClaw plugin नहीं बनाया है, तो पहले बुनियादी पैकेज
  संरचना और manifest सेटअप के लिए
  [शुरू करें](/hi/plugins/building-plugins) पढ़ें।
</Info>

<Tip>
  Provider plugins OpenClaw के सामान्य inference loop में मॉडल जोड़ते हैं। अगर मॉडल
  को ऐसे native agent daemon के माध्यम से चलना है जो threads, Compaction, या tool
  events का स्वामी है, तो daemon protocol विवरण core में डालने के बजाय provider को
  किसी [agent harness](/hi/plugins/sdk-agent-harness) के साथ जोड़ें।
</Tip>

## वॉकथ्रू

<Steps>
  <Step title="Package and manifest">
    ### चरण 1: पैकेज और manifest

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

    manifest `setup.providers[].envVars` घोषित करता है ताकि OpenClaw आपके plugin runtime
    को लोड किए बिना credentials पहचान सके। जब किसी provider variant को किसी दूसरे
    provider id के auth का दोबारा उपयोग करना चाहिए, तब `providerAuthAliases` जोड़ें। `modelSupport`
    वैकल्पिक है और runtime hooks मौजूद होने से पहले OpenClaw को `acme-large` जैसे shorthand
    model ids से आपका provider plugin अपने-आप लोड करने देता है। अगर आप provider को
    ClawHub पर प्रकाशित करते हैं, तो `package.json` में वे `openclaw.compat` और `openclaw.build` fields
    आवश्यक हैं।

  </Step>

  <Step title="Register the provider">
    एक न्यूनतम text provider को `id`, `label`, `auth`, और `catalog` चाहिए।
    `catalog` provider-स्वामित्व वाला runtime/config hook है; यह live
    vendor APIs को call कर सकता है और `models.providers` entries लौटाता है।

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

    `registerModelCatalogProvider` list/help/picker UI के लिए नया control-plane catalog surface
    है। इसे text, image-generation,
    video-generation, और music-generation rows के लिए इस्तेमाल करें। vendor endpoint calls और
    response mapping को plugin में रखें; OpenClaw साझा row shape, source
    labels, और help rendering का स्वामी है।

    यह एक कार्यशील provider है। उपयोगकर्ता अब
    `openclaw onboard --acme-ai-api-key <key>` चला सकते हैं और
    `acme-ai/acme-large` को अपने मॉडल के रूप में चुन सकते हैं।

    ### Live model discovery

    अगर आपका provider `/models`-style API उपलब्ध कराता है, तो provider-specific
    endpoint और row projection को अपने plugin में रखें और साझा fetch
    lifecycle के लिए `openclaw/plugin-sdk/provider-catalog-live-runtime` का उपयोग करें।
    यह helper आपको guarded HTTP fetches, provider-auth headers,
    structured HTTP errors, TTL caching, और static fallback behavior देता है, बिना
    provider policy को OpenClaw core में डाले।

    जब live API केवल यह बताता है कि कौन-सी provider-स्वामित्व वाली static catalog rows
    इस समय उपलब्ध हैं, तब `buildLiveModelProviderConfig` इस्तेमाल करें:

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

    जब provider API अधिक समृद्ध metadata लौटाता है और plugin को rows को OpenClaw model
    definitions में स्वयं project करना होता है, तब `getCachedLiveProviderModelRows` इस्तेमाल करें:

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

    `run` auth-gated रहना चाहिए और जब कोई उपयोगी credential उपलब्ध न हो, तो `null` लौटाना चाहिए।
    एक offline `staticRun` या static fallback रखें ताकि setup, docs,
    tests, और picker surfaces live network access पर निर्भर न हों। model-list freshness के लिए
    उपयुक्त TTL इस्तेमाल करें, request-time filesystem polling से बचें,
    और provider-specific `readRows` / `readModelId` केवल तब पास करें जब
    upstream response OpenAI-compatible `{ data: [{ id, object }] }`
    shape न हो।

    अगर upstream provider OpenClaw से अलग control tokens इस्तेमाल करता है, तो stream path को
    बदलने के बजाय एक छोटा bidirectional text transform जोड़ें:

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

    `input` transport से पहले final system prompt और text message content को rewrite करता है।
    `output` OpenClaw द्वारा अपने control markers parse करने या channel delivery से पहले
    assistant text deltas और final text को rewrite करता है।

    bundled providers के लिए, जो API-key auth और एकल catalog-backed runtime के साथ
    केवल एक text provider register करते हैं, संकरे
    `defineSingleProviderPluginEntry(...)` helper को प्राथमिकता दें:

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

    `buildProvider` वह लाइव कैटलॉग पथ है जिसका उपयोग तब होता है जब OpenClaw वास्तविक
    प्रदाता प्रमाणीकरण हल कर सकता है। यह प्रदाता-विशिष्ट खोज कर सकता है।
    `buildStaticProvider` का उपयोग केवल उन ऑफलाइन पंक्तियों के लिए करें जिन्हें प्रमाणीकरण
    कॉन्फ़िगर होने से पहले दिखाना सुरक्षित हो; इसके लिए क्रेडेंशियल की आवश्यकता नहीं होनी चाहिए
    और न ही नेटवर्क अनुरोध करने चाहिए। OpenClaw का `models list --all` डिस्प्ले वर्तमान में
    केवल बंडल किए गए प्रदाता plugins के लिए, खाली कॉन्फ़िग, खाली env, और बिना
    agent/workspace पथों के, स्थिर कैटलॉग चलाता है।

    यदि आपके प्रमाणीकरण प्रवाह को onboarding के दौरान `models.providers.*`, aliases, और
    agent के डिफ़ॉल्ट मॉडल को भी पैच करना है, तो
    `openclaw/plugin-sdk/provider-onboard` से preset helpers का उपयोग करें। सबसे संकीर्ण helpers हैं
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)`, और
    `createModelCatalogPresetAppliers(...)`।

    जब किसी प्रदाता का नेटिव endpoint सामान्य `openai-completions` transport पर
    streamed usage blocks का समर्थन करता है, तो प्रदाता-id checks को hardcode करने के बजाय
    `openclaw/plugin-sdk/provider-catalog-shared` में shared catalog helpers को प्राथमिकता दें।
    `supportsNativeStreamingUsageCompat(...)` और
    `applyProviderNativeStreamingUsageCompat(...)` endpoint capability map से समर्थन पहचानते हैं,
    इसलिए नेटिव Moonshot/DashScope-शैली endpoints तब भी opt in करते हैं जब कोई plugin
    custom provider id का उपयोग कर रहा हो।

    ऊपर दिए गए live discovery उदाहरण `/models`-शैली प्रदाता APIs को कवर करते हैं। उस discovery को
    `catalog.run` के अंदर रखें, usable auth पर gated रखें, और offline catalog generation के लिए
    `staticRun` को network-free रखें।

  </Step>

  <Step title="डायनामिक मॉडल रिज़ॉल्यूशन जोड़ें">
    यदि आपका प्रदाता मनमाने model IDs स्वीकार करता है (जैसे proxy या router),
    तो `resolveDynamicModel` जोड़ें:

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

    यदि resolution के लिए network call चाहिए, तो async warm-up के लिए `prepareDynamicModel`
    का उपयोग करें - इसके पूरा होने के बाद `resolveDynamicModel` फिर चलता है।

  </Step>

  <Step title="runtime hooks जोड़ें (आवश्यकतानुसार)">
    अधिकांश प्रदाताओं को केवल `catalog` + `resolveDynamicModel` चाहिए। जैसे-जैसे आपके प्रदाता
    को उनकी आवश्यकता हो, hooks को क्रमिक रूप से जोड़ें।

    Shared helper builders अब सबसे सामान्य replay/tool-compat families को कवर करते हैं,
    इसलिए plugins को आमतौर पर हर hook को एक-एक करके हाथ से wire करने की आवश्यकता नहीं होती:

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

    आज उपलब्ध replay families:

    | Family | यह क्या wire करता है | बंडल किए गए उदाहरण |
    | --- | --- | --- |
    | `openai-compatible` | OpenAI-compatible transports के लिए shared OpenAI-style replay policy, जिसमें tool-call-id sanitation, assistant-first ordering fixes, और जहां transport को आवश्यकता हो वहां generic Gemini-turn validation शामिल है | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | `modelId` द्वारा चुनी गई Claude-aware replay policy, ताकि Anthropic-message transports को Claude-specific thinking-block cleanup केवल तब मिले जब resolved model वास्तव में Claude id हो | `amazon-bedrock`, `anthropic-vertex` |
    | `google-gemini` | Native Gemini replay policy और bootstrap replay sanitation। Shared family text-output Gemini CLI को tagged reasoning पर रखती है; direct `google` provider `resolveReasoningOutputMode` को `native` पर override करता है क्योंकि Gemini API thinking native thought parts के रूप में आती है। | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | OpenAI-compatible proxy transports के माध्यम से चल रहे Gemini models के लिए Gemini thought-signature sanitation; native Gemini replay validation या bootstrap rewrites को सक्षम नहीं करता | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | उन प्रदाताओं के लिए hybrid policy जो एक plugin में Anthropic-message और OpenAI-compatible model surfaces मिलाते हैं; वैकल्पिक Claude-only thinking-block dropping Anthropic side तक scoped रहता है | `minimax` |

    आज उपलब्ध stream families:

    | Family | यह क्या wire करता है | बंडल किए गए उदाहरण |
    | --- | --- | --- |
    | `google-thinking` | shared stream path पर Gemini thinking payload normalization | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | shared proxy stream path पर Kilo reasoning wrapper, जिसमें `kilo/auto` और unsupported proxy reasoning ids injected thinking को skip करते हैं | `kilocode` |
    | `moonshot-thinking` | config + `/think` level से Moonshot binary native-thinking payload mapping | `moonshot` |
    | `minimax-fast-mode` | shared stream path पर MiniMax fast-mode model rewrite | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | Shared native OpenAI/Codex Responses wrappers: attribution headers, `/fast`/`serviceTier`, text verbosity, native Codex web search, reasoning-compat payload shaping, और Responses context management | `openai` |
    | `openrouter-thinking` | proxy routes के लिए OpenRouter reasoning wrapper, जिसमें unsupported-model/`auto` skips centrally संभाले जाते हैं | `openrouter` |
    | `tool-stream-default-on` | Z.AI जैसे प्रदाताओं के लिए default-on `tool_stream` wrapper, जो explicit रूप से disabled न होने तक tool streaming चाहते हैं | `zai` |

    <Accordion title="family builders को शक्ति देने वाले SDK seams">
      हर family builder उसी package से export किए गए lower-level public helpers से composed होता है, जिनका उपयोग आप तब कर सकते हैं जब किसी प्रदाता को common pattern से अलग जाना पड़े:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)`, और raw replay builders (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`)। Gemini replay helpers (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) और endpoint/model helpers (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`) भी export करता है।
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, साथ ही shared OpenAI/Codex wrappers (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), DeepSeek V4 OpenAI-compatible wrapper (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), Anthropic Messages thinking prefill cleanup (`createAnthropicThinkingPrefillPayloadWrapper`), plain-text tool-call compat (`createPlainTextToolCallCompatWrapper`), और shared proxy/provider wrappers (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`)।
      - `openclaw/plugin-sdk/provider-stream-shared` - hot provider paths के लिए lightweight payload और event wrappers, जिनमें `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)`, और `setQwenChatTemplateThinking(...)` शामिल हैं।
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")`, और underlying provider schema helpers।

      Gemini-family प्रदाताओं के लिए, reasoning-output mode को
      transport के साथ aligned रखें। Direct Google Gemini API providers को `native`
      reasoning output का उपयोग करना चाहिए ताकि OpenClaw native thought parts को बिना
      `<think>` / `<final>` prompt directives जोड़े consume करे। Text-only Gemini CLI-style
      backends जो final JSON/text response parse करते हैं, वे shared
      `google-gemini` tagged contract रख सकते हैं।

      कुछ stream helpers जानबूझकर provider-local रहते हैं। `@openclaw/anthropic-provider` `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, और lower-level Anthropic wrapper builders को अपने public `api.ts` / `contract-api.ts` seam में रखता है क्योंकि वे Claude OAuth beta handling और `context1m` gating encode करते हैं। xAI plugin भी native xAI Responses shaping को अपने `wrapStreamFn` (`/fast` aliases, default `tool_stream`, unsupported strict-tool cleanup, xAI-specific reasoning-payload removal) में रखता है।

      वही package-root pattern `@openclaw/openai-provider` (provider builders, default-model helpers, realtime provider builders) और `@openclaw/openrouter-provider` (provider builder plus onboarding/config helpers) को भी support करता है।
    </Accordion>

    <Tabs>
      <Tab title="Token exchange">
        उन प्रदाताओं के लिए जिन्हें हर inference call से पहले token exchange चाहिए:

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
      <Tab title="Custom headers">
        उन प्रदाताओं के लिए जिन्हें custom request headers या body modifications चाहिए:

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
      <Tab title="Native transport identity">
        उन प्रदाताओं के लिए जिन्हें generic HTTP या WebSocket transports पर native request/session headers या metadata चाहिए:

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
      <Tab title="Usage and billing">
        उन प्रदाताओं के लिए जो उपयोग/बिलिंग डेटा उजागर करते हैं:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        `resolveUsageAuth` के तीन परिणाम होते हैं। जब प्रदाता के पास
        उपयोग/बिलिंग क्रेडेंशियल हो, तो `{ token, accountId? }` लौटाएं। केवल
        तब `{ handled: true }` लौटाएं जब प्रदाता ने उपयोग auth को निश्चित रूप
        से संभाल लिया हो लेकिन उसके पास उपयोग योग्य उपयोग token न हो, और
        OpenClaw को generic API-key/OAuth fallback छोड़ना हो। जब प्रदाता ने
        अनुरोध नहीं संभाला हो और OpenClaw को generic fallback जारी रखना चाहिए,
        तो `null` या `undefined` लौटाएं।
      </Tab>
    </Tabs>

    <Accordion title="All available provider hooks">
      OpenClaw इस क्रम में hooks कॉल करता है। अधिकांश प्रदाता केवल 2-3 का उपयोग करते हैं:
      compatibility-only प्रदाता fields जिन्हें OpenClaw अब कॉल नहीं करता, जैसे
      `ProviderPlugin.capabilities` और `suppressBuiltInModel`, यहां सूचीबद्ध
      नहीं हैं।

      | # | Hook | कब उपयोग करें |
      | --- | --- | --- |
      | 1 | `catalog` | मॉडल catalog या base URL defaults |
      | 2 | `applyConfigDefaults` | config materialization के दौरान प्रदाता-स्वामित्व वाले global defaults |
      | 3 | `normalizeModelId` | lookup से पहले legacy/preview model-id alias cleanup |
      | 4 | `normalizeTransport` | generic model assembly से पहले provider-family `api` / `baseUrl` cleanup |
      | 5 | `normalizeConfig` | `models.providers.<id>` config normalize करें |
      | 6 | `applyNativeStreamingUsageCompat` | config providers के लिए native streaming-usage compat rewrites |
      | 7 | `resolveConfigApiKey` | प्रदाता-स्वामित्व वाला env-marker auth resolution |
      | 8 | `resolveSyntheticAuth` | local/self-hosted या config-backed synthetic auth |
      | 9 | `shouldDeferSyntheticProfileAuth` | env/config auth के पीछे synthetic stored-profile placeholders को कम प्राथमिकता दें |
      | 10 | `resolveDynamicModel` | मनमाने upstream model IDs स्वीकार करें |
      | 11 | `prepareDynamicModel` | resolving से पहले async metadata fetch |
      | 12 | `normalizeResolvedModel` | runner से पहले transport rewrites |
      | 13 | `normalizeToolSchemas` | registration से पहले प्रदाता-स्वामित्व वाला tool-schema cleanup |
      | 14 | `inspectToolSchemas` | प्रदाता-स्वामित्व वाले tool-schema diagnostics |
      | 15 | `resolveReasoningOutputMode` | tagged बनाम native reasoning-output contract |
      | 16 | `prepareExtraParams` | default request params |
      | 17 | `createStreamFn` | पूरी तरह custom StreamFn transport |
      | 19 | `wrapStreamFn` | सामान्य stream path पर custom headers/body wrappers |
      | 20 | `resolveTransportTurnState` | native per-turn headers/metadata |
      | 21 | `resolveWebSocketSessionPolicy` | native WS session headers/cool-down |
      | 22 | `formatApiKey` | custom runtime token shape |
      | 23 | `refreshOAuth` | custom OAuth refresh |
      | 24 | `buildAuthDoctorHint` | auth repair guidance |
      | 25 | `matchesContextOverflowError` | प्रदाता-स्वामित्व वाला overflow detection |
      | 26 | `classifyFailoverReason` | प्रदाता-स्वामित्व वाला rate-limit/overload classification |
      | 27 | `isCacheTtlEligible` | prompt cache TTL gating |
      | 28 | `buildMissingAuthMessage` | custom missing-auth hint |
      | 29 | `augmentModelCatalog` | synthetic forward-compat rows |
      | 30 | `resolveThinkingProfile` | मॉडल-विशिष्ट `/think` option set |
      | 31 | `isBinaryThinking` | binary thinking on/off compatibility |
      | 32 | `supportsXHighThinking` | `xhigh` reasoning support compatibility |
      | 33 | `resolveDefaultThinkingLevel` | default `/think` policy compatibility |
      | 34 | `isModernModelRef` | live/smoke model matching |
      | 35 | `prepareRuntimeAuth` | inference से पहले token exchange |
      | 36 | `resolveUsageAuth` | custom usage credential parsing |
      | 37 | `fetchUsageSnapshot` | custom usage endpoint |
      | 38 | `createEmbeddingProvider` | memory/search के लिए प्रदाता-स्वामित्व वाला embedding adapter |
      | 39 | `buildReplayPolicy` | custom transcript replay/compaction policy |
      | 40 | `sanitizeReplayHistory` | generic cleanup के बाद प्रदाता-विशिष्ट replay rewrites |
      | 41 | `validateReplayTurns` | embedded runner से पहले strict replay-turn validation |
      | 42 | `onModelSelected` | post-selection callback (जैसे telemetry) |

      Runtime fallback notes:

      - `normalizeConfig` पहले matched provider जांचता है, फिर अन्य hook-capable provider plugins को तब तक जांचता है जब तक कोई वास्तव में config बदल न दे। अगर कोई provider hook supported Google-family config entry को rewrite नहीं करता, तो bundled Google config normalizer फिर भी लागू होता है।
      - `resolveConfigApiKey` उजागर होने पर provider hook का उपयोग करता है। Amazon Bedrock AWS env-marker resolution को अपने provider plugin में रखता है; runtime auth खुद अभी भी `auth: "aws-sdk"` के साथ configured होने पर AWS SDK default chain का उपयोग करता है।
      - `resolveThinkingProfile(ctx)` को selected `provider`, `modelId`, optional merged `reasoning` catalog hint, और optional merged model `compat` facts मिलते हैं। `compat` का उपयोग केवल provider की thinking UI/profile चुनने के लिए करें।
      - `resolveSystemPromptContribution` किसी provider को model family के लिए cache-aware system-prompt guidance inject करने देता है। जब behavior एक provider/model family से संबंधित हो और stable/dynamic cache split को preserve करना चाहिए, तो इसे `before_prompt_build` पर प्राथमिकता दें।

      विस्तृत विवरण और वास्तविक उदाहरणों के लिए, [आंतरिक विवरण: Provider Runtime Hooks](/hi/plugins/architecture-internals#provider-runtime-hooks) देखें।
    </Accordion>

  </Step>

  <Step title="Add extra capabilities (optional)">
    ### चरण 5: अतिरिक्त क्षमताएं जोड़ें

    कोई provider Plugin text inference के साथ embeddings, speech, realtime transcription,
    realtime voice, media understanding, image generation, video generation,
    web fetch, और web search register कर सकता है। OpenClaw इसे
    **hybrid-capability** Plugin के रूप में वर्गीकृत करता है - company plugins
    के लिए recommended pattern (प्रति vendor एक Plugin)। देखें
    [आंतरिक विवरण: क्षमता स्वामित्व](/hi/plugins/architecture#capability-ownership-model)।

    प्रत्येक capability को अपने मौजूदा `api.registerProvider(...)` call के साथ
    `register(api)` के भीतर register करें। केवल वे tabs चुनें जिनकी आपको आवश्यकता है:

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

        provider HTTP failures के लिए `assertOkOrThrowProviderError(...)` का उपयोग करें ताकि
        plugins capped error-body reads, JSON error parsing, और
        request-id suffixes साझा करें।
      </Tab>
      <Tab title="Realtime transcription">
        `createRealtimeTranscriptionWebSocketSession(...)` को प्राथमिकता दें - shared
        helper proxy capture, reconnect backoff, close flushing, ready
        handshakes, audio queueing, और close-event diagnostics संभालता है। आपका Plugin
        केवल upstream events map करता है।

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

        multipart audio POST करने वाले batch STT providers को
        `openclaw/plugin-sdk/provider-http` से
        `buildAudioTranscriptionFormData(...)` का उपयोग करना चाहिए। helper upload
        filenames normalize करता है, जिसमें compatible transcription APIs के लिए
        M4A-style filename की आवश्यकता वाले AAC uploads भी शामिल हैं।
      </Tab>
      <Tab title="Realtime voice">
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

        `capabilities` घोषित करें ताकि `talk.catalog` browser और native Talk
        clients के लिए मान्य modes, transports, audio formats, और feature flags
        दिखा सके। जब कोई transport यह पहचान सकता हो कि कोई मानव assistant
        playback को बाधित कर रहा है और provider active audio response को
        truncate या clear करने का समर्थन करता हो, तो `handleBargeIn`
        implement करें।
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

        Local या self-hosted media providers जिन्हें जानबूझकर credentials की
        आवश्यकता नहीं होती, वे `resolveAuth` expose कर सकते हैं और
        `kind: "none"` return कर सकते हैं। OpenClaw उन providers के लिए सामान्य
        auth gate फिर भी रखता है जो स्पष्ट रूप से opt in नहीं करते। मौजूदा
        providers `req.apiKey` पढ़ना जारी रख सकते हैं; नए providers को
        `req.auth` को प्राथमिकता देनी चाहिए।

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

        वही id `contracts.embeddingProviders` में घोषित करें। यह reusable
        vector generation के लिए सामान्य embedding contract है, जिसमें memory
        search शामिल है। `registerMemoryEmbeddingProvider(...)` मौजूदा
        memory-specific adapters के लिए deprecated compatibility है।
      </Tab>
      <Tab title="Image and video generation">
        Video capabilities **mode-aware** shape का उपयोग करती हैं: `generate`,
        `imageToVideo`, और `videoToVideo`। `maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds` जैसे flat aggregate fields
        transform-mode support या disabled modes को साफ़-साफ़ advertise करने
        के लिए पर्याप्त नहीं हैं। Music generation भी explicit `generate` /
        `edit` blocks के साथ यही pattern अपनाता है।

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
    ### चरण 6: परीक्षण

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

## ClawHub पर प्रकाशित करें

Provider Plugin किसी भी अन्य external code Plugin की तरह ही publish होते हैं:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

यहां legacy skill-only publish alias का उपयोग न करें; Plugin packages को
`clawhub package publish` का उपयोग करना चाहिए।

## फ़ाइल संरचना

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers metadata
├── openclaw.plugin.json      # Manifest with provider auth metadata
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # Tests
    └── usage.ts              # Usage endpoint (optional)
```

## Catalog order reference

`catalog.order` यह नियंत्रित करता है कि आपका catalog built-in providers के
सापेक्ष कब merge होता है:

| क्रम      | कब            | उपयोग का मामला                                  |
| --------- | ------------- | ----------------------------------------------- |
| `simple`  | पहला pass     | सामान्य API-key providers                       |
| `profile` | simple के बाद | auth profiles पर gated providers                |
| `paired`  | profile के बाद | कई संबंधित entries synthesize करें             |
| `late`    | अंतिम pass    | मौजूदा providers override करें (collision पर जीतता है) |

## अगले चरण

- [Channel Plugins](/hi/plugins/sdk-channel-plugins) - यदि आपका Plugin channel भी प्रदान करता है
- [SDK Runtime](/hi/plugins/sdk-runtime) - `api.runtime` helpers (TTS, search, subagent)
- [SDK Overview](/hi/plugins/sdk-overview) - पूरा subpath import reference
- [Plugin Internals](/hi/plugins/architecture-internals#provider-runtime-hooks) - hook details और bundled examples

## संबंधित

- [Plugin SDK setup](/hi/plugins/sdk-setup)
- [Building plugins](/hi/plugins/building-plugins)
- [Building channel plugins](/hi/plugins/sdk-channel-plugins)
