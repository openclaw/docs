---
read_when:
    - आप एक नया मॉडल प्रदाता Plugin बना रहे हैं
    - आप OpenClaw में OpenAI-संगत प्रॉक्सी या कस्टम LLM जोड़ना चाहते हैं
    - आपको प्रदाता प्रमाणीकरण, कैटलॉग और रनटाइम हुक को समझना होगा
sidebarTitle: Provider plugins
summary: OpenClaw के लिए मॉडल प्रदाता Plugin बनाने की चरण-दर-चरण मार्गदर्शिका
title: प्रोवाइडर Plugin बनाना
x-i18n:
    generated_at: "2026-07-19T09:24:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f68a8581872f89ae8ac3b8660ee71ef9cfab7a5670b1dc68f64027601425a3dc
    source_path: plugins/sdk-provider-plugins.md
    workflow: 16
---

OpenClaw में एक मॉडल प्रदाता (LLM) जोड़ने के लिए प्रदाता Plugin बनाएँ: एक मॉडल
कैटलॉग, API-कुंजी प्रमाणीकरण और डायनेमिक मॉडल रिज़ॉल्यूशन।

<Info>
  OpenClaw plugins में नए हैं? पैकेज संरचना और मैनिफ़ेस्ट सेटअप के लिए पहले
  [आरंभ करना](/hi/plugins/building-plugins) पढ़ें।
</Info>

<Tip>
  प्रदाता plugins, OpenClaw के सामान्य इन्फ़रेंस लूप में मॉडल जोड़ते हैं। यदि
  मॉडल को ऐसे नेटिव एजेंट डेमन के माध्यम से चलना आवश्यक है जो थ्रेड, Compaction
  या टूल इवेंट का स्वामी है, तो डेमन प्रोटोकॉल का विवरण कोर में रखने के बजाय प्रदाता को
  [एजेंट हार्नेस](/hi/plugins/sdk-agent-harness) के साथ जोड़ें।
</Tip>

## चरण-दर-चरण विवरण

<Steps>
  <Step title="पैकेज और मैनिफ़ेस्ट">
    ### चरण 1: पैकेज और मैनिफ़ेस्ट

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
      "description": "Acme AI मॉडल प्रदाता",
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
          "choiceLabel": "Acme AI API कुंजी",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme AI API कुंजी"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    `setup.providers[].envVars`, आपके Plugin रनटाइम को लोड किए बिना OpenClaw को
    क्रेडेंशियल का पता लगाने देता है। जब किसी प्रदाता वैरिएंट को किसी अन्य प्रदाता आईडी के
    प्रमाणीकरण का पुनः उपयोग करना हो, तो `providerAuthAliases` जोड़ें। `modelSupport`
    वैकल्पिक है और रनटाइम हुक उपलब्ध होने से पहले `acme-large` जैसे संक्षिप्त
    मॉडल आईडी से OpenClaw को आपका प्रदाता Plugin स्वतः लोड करने देता है। ClawHub
    पर प्रकाशित करने के लिए `package.json` में `openclaw.compat`
    और `openclaw.build` आवश्यक हैं (`openclaw.compat.pluginApi` और `openclaw.build.openclawVersion`
    दो आवश्यक फ़ील्ड हैं; छोड़े जाने पर `minGatewayVersion`,
    `openclaw.install.minHostVersion` पर फ़ॉलबैक करता है)।

  </Step>

  <Step title="प्रदाता पंजीकृत करें">
    एक न्यूनतम टेक्स्ट प्रदाता को `id`, `label`, `auth` और `catalog` की आवश्यकता होती है।
    `catalog`, प्रदाता-स्वामित्व वाला रनटाइम/कॉन्फ़िगरेशन हुक है; यह लाइव
    विक्रेता API को कॉल कर सकता है और `models.providers` प्रविष्टियाँ लौटाता है।

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

    `registerModelCatalogProvider`, सूची/सहायता/चयनकर्ता UI के लिए नया कंट्रोल-प्लेन
    कैटलॉग सरफ़ेस है, जो `text`, `voice`, `image_generation`,
    `video_generation` और `music_generation` पंक्तियों को कवर करता है। विक्रेता एंडपॉइंट
    कॉल और प्रतिक्रिया मैपिंग को Plugin में रखें; साझा पंक्ति
    संरचना, स्रोत लेबल और सहायता रेंडरिंग का स्वामित्व OpenClaw के पास है।

    यह एक कार्यशील प्रदाता है। उपयोगकर्ता अब
    `openclaw onboard --acme-ai-api-key <key>` चला सकते हैं और
    अपने मॉडल के रूप में `acme-ai/acme-large` चुन सकते हैं।

    ### लाइव मॉडल खोज

    यदि आपका प्रदाता `/models`-शैली का API उपलब्ध कराता है, तो प्रदाता-विशिष्ट
    एंडपॉइंट और पंक्ति प्रोजेक्शन को अपने Plugin में रखें और साझा फ़ेच
    जीवनचक्र के लिए `openclaw/plugin-sdk/provider-catalog-live-runtime` का उपयोग करें।
    यह सहायक, OpenClaw कोर में प्रदाता नीति रखे बिना आपको सुरक्षित HTTP फ़ेच,
    प्रदाता-प्रमाणीकरण हेडर, संरचित HTTP त्रुटियाँ, TTL कैशिंग और स्थिर फ़ॉलबैक व्यवहार देता है।

    जब लाइव API केवल यह बताता है कि प्रदाता-स्वामित्व वाली स्थिर कैटलॉग पंक्तियों में से
    कौन-सी वर्तमान में उपलब्ध हैं, तब `buildLiveModelProviderConfig` का उपयोग करें:

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

    जब प्रदाता API अधिक समृद्ध मेटाडेटा लौटाता है और Plugin को स्वयं पंक्तियों को
    OpenClaw मॉडल परिभाषाओं में प्रोजेक्ट करने की आवश्यकता होती है, तब
    `getCachedLiveProviderModelRows` का उपयोग करें:

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

    `run` को प्रमाणीकरण द्वारा नियंत्रित रहना चाहिए और कोई उपयोग योग्य
    क्रेडेंशियल उपलब्ध न होने पर `null` लौटाना चाहिए। एक ऑफ़लाइन
    `staticRun` या स्थिर फ़ॉलबैक रखें, ताकि सेटअप, दस्तावेज़, परीक्षण और
    चयनकर्ता सरफ़ेस लाइव नेटवर्क पहुँच पर निर्भर न हों। मॉडल-सूची की ताज़गी के लिए
    उपयुक्त TTL का उपयोग करें, अनुरोध के समय फ़ाइल सिस्टम पोलिंग से बचें, और प्रदाता-विशिष्ट
    `readRows` / `readModelId` केवल तभी पास करें जब अपस्ट्रीम प्रतिक्रिया
    OpenAI-संगत `{ data: [{ id, object }] }` संरचना न हो।

    यदि अपस्ट्रीम प्रदाता OpenClaw से अलग नियंत्रण टोकन का उपयोग करता है, तो स्ट्रीम पथ को
    बदलने के बजाय एक छोटा द्विदिश टेक्स्ट रूपांतरण जोड़ें:

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

    `input`, ट्रांसपोर्ट से पहले अंतिम सिस्टम प्रॉम्प्ट और टेक्स्ट संदेश सामग्री को
    पुनर्लिखता है। `output`, OpenClaw द्वारा अपने नियंत्रण मार्करों को पार्स करने
    या चैनल डिलीवरी से पहले सहायक टेक्स्ट डेल्टा और अंतिम टेक्स्ट को पुनर्लिखता है।

    उन बंडल किए गए प्रदाताओं के लिए, जो API-कुंजी प्रमाणीकरण और एकल कैटलॉग-समर्थित
    रनटाइम के साथ केवल एक टेक्स्ट प्रदाता पंजीकृत करते हैं, अधिक सीमित
    `defineSingleProviderPluginEntry(...)` सहायक को प्राथमिकता दें:

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

    `buildProvider` वह लाइव कैटलॉग पथ है जिसका उपयोग तब किया जाता है जब OpenClaw वास्तविक
    प्रोवाइडर प्रमाणीकरण को हल कर सकता है। यह प्रोवाइडर-विशिष्ट खोज कर सकता है। केवल
    उन ऑफ़लाइन पंक्तियों के लिए `buildStaticProvider` का उपयोग करें जिन्हें प्रमाणीकरण
    कॉन्फ़िगर होने से पहले सुरक्षित रूप से दिखाया जा सकता है; इसे क्रेडेंशियल की आवश्यकता नहीं होनी चाहिए या नेटवर्क अनुरोध नहीं करने चाहिए।
    OpenClaw का `models list --all` प्रदर्शन वर्तमान में स्थिर कैटलॉग
    केवल बंडल किए गए प्रोवाइडर plugins के लिए, खाली कॉन्फ़िगरेशन, खाली env और बिना
    एजेंट/वर्कस्पेस पथों के निष्पादित करता है।

    यदि आपके प्रमाणीकरण प्रवाह को ऑनबोर्डिंग के दौरान `models.providers.*`, उपनामों और
    एजेंट के डिफ़ॉल्ट मॉडल को भी पैच करना है, तो
    `openclaw/plugin-sdk/provider-onboard` के प्रीसेट सहायकों का उपयोग करें। सबसे सीमित सहायक हैं
    `createDefaultModelPresetAppliers(...)`,
    `createDefaultModelsPresetAppliers(...)`, और
    `createModelCatalogPresetAppliers(...)`।

    जब किसी प्रोवाइडर का नेटिव एंडपॉइंट सामान्य
    `openai-completions` ट्रांसपोर्ट पर स्ट्रीम किए गए उपयोग ब्लॉक का समर्थन करता है, तो
    प्रोवाइडर-id जाँचों को हार्डकोड करने के बजाय
    `openclaw/plugin-sdk/provider-catalog-shared` में साझा कैटलॉग सहायकों को प्राथमिकता दें।
    `supportsNativeStreamingUsageCompat(...)` और
    `applyProviderNativeStreamingUsageCompat(...)` एंडपॉइंट क्षमता मैप से
    समर्थन का पता लगाते हैं, इसलिए नेटिव Moonshot/DashScope-शैली के एंडपॉइंट तब भी
    ऑप्ट इन करते हैं जब कोई plugin कस्टम प्रोवाइडर id का उपयोग कर रहा हो।

    ऊपर दिए गए लाइव खोज उदाहरण `/models`-शैली के प्रोवाइडर API को कवर करते हैं। उस
    खोज को `catalog.run` के भीतर रखें, उपयोग योग्य प्रमाणीकरण के आधार पर गेट करें, और
    ऑफ़लाइन कैटलॉग जनरेशन के लिए `staticRun` को नेटवर्क-मुक्त रखें।

  </Step>

  <Step title="डायनेमिक मॉडल समाधान जोड़ें">
    यदि आपका प्रोवाइडर मनमाने मॉडल ID स्वीकार करता है (जैसे कोई प्रॉक्सी या राउटर),
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

    यदि समाधान के लिए नेटवर्क कॉल आवश्यक है, तो एसिंक्रोनस
    वार्म-अप के लिए `prepareDynamicModel` का उपयोग करें—इसके पूरा होने के बाद
    `resolveDynamicModel` फिर से चलता है।

  </Step>

  <Step title="रनटाइम हुक जोड़ें (आवश्यकतानुसार)">
    अधिकांश प्रोवाइडर को केवल `catalog` + `resolveDynamicModel` की आवश्यकता होती है। अपने
    प्रोवाइडर की आवश्यकताओं के अनुसार क्रमिक रूप से हुक जोड़ें।

    साझा सहायक बिल्डर अब सबसे सामान्य रीप्ले/टूल-संगतता
    फ़ैमिली को कवर करते हैं, इसलिए plugins को आम तौर पर प्रत्येक हुक को एक-एक करके मैन्युअल रूप से वायर करने की आवश्यकता नहीं होती:

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

    आज उपलब्ध रीप्ले फ़ैमिली:

    | फ़ैमिली | यह क्या वायर करती है | बंडल किए गए उदाहरण |
    | --- | --- | --- |
    | `openai-compatible` | OpenAI-संगत ट्रांसपोर्ट के लिए साझा OpenAI-शैली की रीप्ले नीति, जिसमें टूल-कॉल-id सैनिटाइज़ेशन, assistant-first क्रम सुधार और जहाँ ट्रांसपोर्ट को इसकी आवश्यकता हो वहाँ सामान्य Gemini-टर्न सत्यापन शामिल हैं | `moonshot`, `ollama`, `xai`, `zai` |
    | `anthropic-by-model` | `modelId` द्वारा चुनी गई Claude-जागरूक रीप्ले नीति, ताकि Anthropic-संदेश ट्रांसपोर्ट को Claude-विशिष्ट थिंकिंग-ब्लॉक क्लीनअप केवल तभी मिले जब हल किया गया मॉडल वास्तव में Claude id हो | `amazon-bedrock` |
    | `native-anthropic-by-model` | `anthropic-by-model` जैसी ही मॉडल-आधारित Claude नीति, साथ ही उन ट्रांसपोर्ट के लिए टूल-कॉल-id सैनिटाइज़ेशन और नेटिव Anthropic टूल-उपयोग id संरक्षण जिन्हें विक्रेता-नेटिव id बनाए रखने होते हैं | `anthropic-vertex`, `clawrouter` |
    | `google-gemini` | नेटिव Gemini रीप्ले नीति और बूटस्ट्रैप रीप्ले सैनिटाइज़ेशन। साझा फ़ैमिली टेक्स्ट-आउटपुट Gemini CLI को टैग किए गए रीजनिंग पर रखती है; प्रत्यक्ष `google` प्रोवाइडर `resolveReasoningOutputMode` को `native` से ओवरराइड करता है क्योंकि Gemini API थिंकिंग नेटिव थॉट पार्ट्स के रूप में आती है। | `google`, `google-gemini-cli` |
    | `passthrough-gemini` | OpenAI-संगत प्रॉक्सी ट्रांसपोर्ट के माध्यम से चलने वाले Gemini मॉडल के लिए Gemini थॉट-सिग्नेचर सैनिटाइज़ेशन; नेटिव Gemini रीप्ले सत्यापन या बूटस्ट्रैप पुनर्लेखन सक्षम नहीं करता | `openrouter`, `kilocode`, `opencode`, `opencode-go` |
    | `hybrid-anthropic-openai` | उन प्रोवाइडर के लिए हाइब्रिड नीति जो एक ही plugin में Anthropic-संदेश और OpenAI-संगत मॉडल सतहों को मिलाते हैं; वैकल्पिक, केवल-Claude थिंकिंग-ब्लॉक हटाना Anthropic पक्ष तक सीमित रहता है | `minimax` |

    आज उपलब्ध स्ट्रीम फ़ैमिली:

    | फ़ैमिली | यह क्या वायर करती है | बंडल किए गए उदाहरण |
    | --- | --- | --- |
    | `google-thinking` | साझा स्ट्रीम पथ पर Gemini थिंकिंग पेलोड सामान्यीकरण | `google`, `google-gemini-cli` |
    | `kilocode-thinking` | साझा प्रॉक्सी स्ट्रीम पथ पर Kilo रीजनिंग रैपर, जिसमें `kilo-auto/balanced` और असमर्थित प्रॉक्सी रीजनिंग id इंजेक्ट की गई थिंकिंग को छोड़ देते हैं | `kilocode` |
    | `moonshot-thinking` | कॉन्फ़िगरेशन + `/think` स्तर से Moonshot बाइनरी नेटिव-थिंकिंग पेलोड मैपिंग | `moonshot` |
    | `minimax-fast-mode` | साझा स्ट्रीम पथ पर MiniMax फ़ास्ट-मोड मॉडल पुनर्लेखन | `minimax`, `minimax-portal` |
    | `openai-responses-defaults` | साझा नेटिव OpenAI/Codex Responses रैपर: एट्रिब्यूशन हेडर, `/fast`/`serviceTier`, टेक्स्ट वर्बोसिटी, नेटिव Codex वेब खोज, रीजनिंग-संगत पेलोड आकार-निर्धारण और Responses संदर्भ प्रबंधन | `openai` |
    | `openrouter-thinking` | प्रॉक्सी रूट के लिए OpenRouter रीजनिंग रैपर, जिसमें असमर्थित-मॉडल/`auto` स्किप केंद्रीय रूप से संभाले जाते हैं | `openrouter` |
    | `tool-stream-default-on` | Z.AI जैसे प्रोवाइडर के लिए डिफ़ॉल्ट-रूप-से-सक्षम `tool_stream` रैपर, जो स्पष्ट रूप से अक्षम न किए जाने पर टूल स्ट्रीमिंग चाहते हैं | `zai` |

    <Accordion title="फ़ैमिली बिल्डर को संचालित करने वाले SDK सीम">
      प्रत्येक फ़ैमिली बिल्डर उसी पैकेज से निर्यात किए गए निम्न-स्तरीय सार्वजनिक सहायकों से बना है, जिनका उपयोग तब किया जा सकता है जब किसी प्रोवाइडर को सामान्य पैटर्न से अलग जाना हो:

      - `openclaw/plugin-sdk/provider-model-shared` - `ProviderReplayFamily`, `buildProviderReplayFamilyHooks(...)`, और कच्चे रीप्ले बिल्डर (`buildOpenAICompatibleReplayPolicy`, `buildAnthropicReplayPolicyForModel`, `buildGoogleGeminiReplayPolicy`, `buildHybridAnthropicOrOpenAIReplayPolicy`)। Gemini रीप्ले सहायक (`sanitizeGoogleGeminiReplayHistory`, `resolveTaggedReasoningOutputMode`) और एंडपॉइंट/मॉडल सहायक (`resolveProviderEndpoint`, `normalizeProviderId`, `normalizeGooglePreviewModelId`) भी निर्यात करता है।
      - `openclaw/plugin-sdk/provider-stream` - `ProviderStreamFamily`, `buildProviderStreamFamilyHooks(...)`, `composeProviderStreamWrappers(...)`, साथ ही साझा OpenAI/Codex रैपर (`createOpenAIAttributionHeadersWrapper`, `createOpenAIFastModeWrapper`, `createOpenAIServiceTierWrapper`, `createOpenAIResponsesContextManagementWrapper`, `createCodexNativeWebSearchWrapper`), DeepSeek V4 OpenAI-संगत रैपर (`createDeepSeekV4OpenAICompatibleThinkingWrapper`), Anthropic Messages थिंकिंग प्रीफ़िल क्लीनअप (`createAnthropicThinkingPrefillPayloadWrapper`), सादे-टेक्स्ट टूल-कॉल संगतता (`createPlainTextToolCallCompatWrapper`), और साझा प्रॉक्सी/प्रोवाइडर रैपर (`createOpenRouterWrapper`, `createToolStreamWrapper`, `createMinimaxFastModeWrapper`)।
      - `openclaw/plugin-sdk/provider-stream-shared` - हॉट प्रोवाइडर पथों के लिए हल्के पेलोड और इवेंट रैपर, जिनमें `createOpenAICompatibleCompletionsThinkingOffWrapper`, `createPayloadPatchStreamWrapper`, `createPlainTextToolCallCompatWrapper`, `normalizeOpenAICompatibleReasoningPayload(...)`, और `setQwenChatTemplateThinking(...)` शामिल हैं।
      - `openclaw/plugin-sdk/provider-tools` - `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks("deepseek" | "gemini" | "openai")`, और अंतर्निहित प्रोवाइडर स्कीमा सहायक।

      Gemini-फ़ैमिली प्रोवाइडर के लिए, रीजनिंग-आउटपुट मोड को
      ट्रांसपोर्ट के अनुरूप रखें। प्रत्यक्ष Google Gemini API प्रोवाइडर को `native`
      रीजनिंग आउटपुट का उपयोग करना चाहिए, ताकि OpenClaw
      `<think>` / `<final>` प्रॉम्प्ट निर्देश जोड़े बिना नेटिव थॉट पार्ट्स का उपयोग करे। अंतिम JSON/टेक्स्ट प्रतिक्रिया पार्स करने वाले केवल-टेक्स्ट Gemini CLI-शैली
      बैकएंड साझा
      `google-gemini` टैग किए गए अनुबंध को बनाए रख सकते हैं।

      कुछ स्ट्रीम सहायक जानबूझकर प्रोवाइडर-स्थानीय रहते हैं। `@openclaw/anthropic-provider`, `wrapAnthropicProviderStream`, `resolveAnthropicBetas`, `resolveAnthropicFastMode`, `resolveAnthropicServiceTier`, और निम्न-स्तरीय Anthropic रैपर बिल्डर को अपने सार्वजनिक `api.ts` / `contract-api.ts` सीम में रखता है क्योंकि वे Claude OAuth बीटा प्रबंधन और `context1m` गेटिंग को एनकोड करते हैं। इसी तरह xAI plugin नेटिव xAI Responses आकार-निर्धारण को अपने `wrapStreamFn` में रखता है (`/fast` उपनाम, डिफ़ॉल्ट `tool_stream`, असमर्थित स्ट्रिक्ट-टूल क्लीनअप, xAI-विशिष्ट रीजनिंग-पेलोड हटाना)।

      यही पैकेज-रूट पैटर्न `@openclaw/openai-provider` (प्रोवाइडर बिल्डर, डिफ़ॉल्ट-मॉडल सहायक, रीयलटाइम प्रोवाइडर बिल्डर) और `@openclaw/openrouter-provider` (प्रोवाइडर बिल्डर तथा ऑनबोर्डिंग/कॉन्फ़िगरेशन सहायक) को भी आधार देता है।
    </Accordion>

    <Tabs>
      <Tab title="टोकन एक्सचेंज">
        उन प्रोवाइडर के लिए जिन्हें प्रत्येक इनफ़रेंस कॉल से पहले टोकन एक्सचेंज की आवश्यकता होती है:

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
      <Tab title="कस्टम हेडर">
        उन प्रोवाइडर के लिए जिन्हें कस्टम अनुरोध हेडर या बॉडी संशोधन की आवश्यकता होती है:

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
      <Tab title="नेटिव ट्रांसपोर्ट पहचान">
        उन प्रोवाइडर के लिए जिन्हें सामान्य HTTP या WebSocket ट्रांसपोर्ट पर
        नेटिव अनुरोध/सेशन हेडर या मेटाडेटा की आवश्यकता होती है:

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
      <Tab title="उपयोग और बिलिंग">
        उपयोग/बिलिंग डेटा उपलब्ध कराने वाले प्रोवाइडर के लिए:

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```

        `resolveUsageAuth` के तीन परिणाम होते हैं। जब
        प्रदाता के पास उपयोग/बिलिंग क्रेडेंशियल हो, तब
        `{ token, accountId?, subscriptionType?, rateLimitTier? }` लौटाएँ (वैकल्पिक फ़ील्ड समाधान की गई प्रोफ़ाइल से
        गैर-गोपनीय प्लान मेटाडेटा को
        `fetchUsageSnapshot` में ले जाते हैं)। `{ handled: true }`
        केवल तभी लौटाएँ, जब प्रदाता ने उपयोग प्रमाणीकरण को निश्चित रूप से संभाला हो,
        लेकिन उसके पास उपयोग योग्य उपयोग टोकन न हो और OpenClaw को सामान्य
        API-कुंजी/OAuth फ़ॉलबैक छोड़ना आवश्यक हो। जब प्रदाता ने अनुरोध को
        नहीं संभाला हो और OpenClaw को सामान्य फ़ॉलबैक जारी रखना चाहिए, तब
        `null` या `undefined` लौटाएँ।

        प्रदाता आईडी को `contracts.usageProviders` में घोषित करें। जब वह मैनिफ़ेस्ट
        अनुबंध और **दोनों** हुक मौजूद हों, तो OpenClaw असंबंधित प्रदाता
        plugins लोड किए बिना प्रदाता को उपयोग संग्रह में स्वचालित रूप से शामिल
        करता है। कोर अनुमति-सूची में किसी अपडेट की आवश्यकता नहीं है।
        `fetchUsageSnapshot` साझा प्रदाता-निरपेक्ष स्वरूप लौटाता है:

        - `plan`: प्रदाता द्वारा रिपोर्ट किया गया सदस्यता या कुंजी लेबल
        - `windows`: उपयोग किए गए प्रतिशत के रूप में रीसेट किए जा सकने वाले कोटा अंतराल
        - `billing`: टाइप की गई `balance`, `spend`, या `budget` प्रविष्टियाँ; `unit`
          कोई ISO मुद्रा या `credits` जैसी प्रदाता इकाई हो सकती है
        - `summary`: संक्षिप्त प्रदाता-विशिष्ट संदर्भ, जो उन
          संरचित फ़ील्ड में समाहित नहीं होता

        मुद्रा का अर्थ बिल्कुल सटीक रखें। प्रदाता क्रेडिट तब तक USD नहीं है, जब तक
        अपस्ट्रीम अनुबंध ऐसा न कहे। केवल
        `fetchUsageSnapshot` लागू करने वाला plugin स्पष्ट/सिंथेटिक कॉलर के लिए
        उपलब्ध रहता है, लेकिन उसका स्वतः पता नहीं लगाया जाता, क्योंकि OpenClaw
        उसके उपयोग क्रेडेंशियल का समाधान नहीं कर सकता।
      </Tab>
    </Tabs>

    <Accordion title="सामान्य प्रदाता हुक">
      OpenClaw मॉडल/प्रदाता plugins के लिए हुक को लगभग इस क्रम में कॉल करता है।
      अधिकांश प्रदाता केवल 2-3 का उपयोग करते हैं। यह पूरा `ProviderPlugin`
      अनुबंध नहीं है—संपूर्ण और वर्तमान में सटीक हुक सूची तथा फ़ॉलबैक टिप्पणियों के लिए
      [आंतरिक संरचना: प्रदाता रनटाइम
      हुक](/hi/plugins/architecture-internals#provider-runtime-hooks) देखें।
      केवल संगतता के लिए मौजूद वे प्रदाता फ़ील्ड, जिन्हें OpenClaw अब कॉल नहीं करता,
      जैसे `ProviderPlugin.capabilities` और `suppressBuiltInModel`, यहाँ
      सूचीबद्ध नहीं हैं।

      | हुक | कब उपयोग करें |
      | --- | --- |
      | `catalog` | मॉडल कैटलॉग या आधार URL के डिफ़ॉल्ट |
      | `applyConfigDefaults` | कॉन्फ़िगरेशन मूर्त रूप देते समय प्रदाता के स्वामित्व वाले वैश्विक डिफ़ॉल्ट |
      | `normalizeModelId` | लुकअप से पहले पुराने/पूर्वावलोकन मॉडल-आईडी उपनामों की सफ़ाई |
      | `normalizeTransport` | सामान्य मॉडल संयोजन से पहले प्रदाता-परिवार की `api` / `baseUrl` सफ़ाई |
      | `normalizeConfig` | `models.providers.<id>` कॉन्फ़िगरेशन को सामान्यीकृत करना |
      | `applyNativeStreamingUsageCompat` | कॉन्फ़िगरेशन प्रदाताओं के लिए मूल स्ट्रीमिंग-उपयोग संगतता पुनर्लेखन |
      | `resolveConfigApiKey` | प्रदाता के स्वामित्व वाले परिवेश-मार्कर प्रमाणीकरण का समाधान |
      | `resolveSyntheticAuth` | स्थानीय/स्वयं-होस्टेड या कॉन्फ़िगरेशन-समर्थित सिंथेटिक प्रमाणीकरण |
      | `resolveExternalAuthProfiles` | CLI/ऐप-प्रबंधित क्रेडेंशियल के लिए प्रदाता के स्वामित्व वाली बाहरी प्रमाणीकरण प्रोफ़ाइल को ओवरले करना |
      | `shouldDeferSyntheticProfileAuth` | परिवेश/कॉन्फ़िगरेशन प्रमाणीकरण के पीछे सिंथेटिक संग्रहीत-प्रोफ़ाइल प्लेसहोल्डर को कम प्राथमिकता देना |
      | `resolveDynamicModel` | मनमाने अपस्ट्रीम मॉडल आईडी स्वीकार करना |
      | `prepareDynamicModel` | समाधान से पहले एसिंक्रोनस मेटाडेटा प्राप्त करना |
      | `normalizeResolvedModel` | रनर से पहले ट्रांसपोर्ट पुनर्लेखन |
      | `normalizeToolSchemas` | पंजीकरण से पहले प्रदाता के स्वामित्व वाले टूल-स्कीमा की सफ़ाई |
      | `inspectToolSchemas` | प्रदाता के स्वामित्व वाले टूल-स्कीमा निदान |
      | `resolveReasoningOutputMode` | टैग किए गए बनाम मूल तर्क-आउटपुट का अनुबंध |
      | `prepareExtraParams` | डिफ़ॉल्ट अनुरोध पैरामीटर |
      | `createStreamFn` | पूरी तरह कस्टम StreamFn ट्रांसपोर्ट |
      | `wrapStreamFn` | सामान्य स्ट्रीम पथ पर कस्टम हेडर/बॉडी रैपर |
      | `resolveTransportTurnState` | प्रत्येक टर्न के मूल हेडर/मेटाडेटा |
      | `resolveWebSocketSessionPolicy` | मूल WS सत्र हेडर/कूल-डाउन |
      | `formatApiKey` | कस्टम रनटाइम टोकन स्वरूप |
      | `refreshOAuth` | कस्टम OAuth रीफ़्रेश |
      | `buildAuthDoctorHint` | प्रमाणीकरण सुधार मार्गदर्शन |
      | `matchesContextOverflowError` | प्रदाता के स्वामित्व वाली ओवरफ़्लो पहचान |
      | `classifyFailoverReason` | प्रदाता के स्वामित्व वाला दर-सीमा/अधिभार वर्गीकरण |
      | `isCacheTtlEligible` | प्रॉम्प्ट कैश TTL गेटिंग |
      | `buildMissingAuthMessage` | अनुपलब्ध प्रमाणीकरण का कस्टम संकेत |
      | `augmentModelCatalog` | सिंथेटिक फ़ॉरवर्ड-संगतता पंक्तियाँ (बहिष्कृत—`registerModelCatalogProvider` को प्राथमिकता दें) |
      | `resolveThinkingProfile` | मॉडल-विशिष्ट `/think` विकल्प समूह |
      | `isBinaryThinking` | बाइनरी चिंतन चालू/बंद संगतता (बहिष्कृत—`resolveThinkingProfile` को प्राथमिकता दें) |
      | `supportsXHighThinking` | `xhigh` तर्क समर्थन संगतता (बहिष्कृत—`resolveThinkingProfile` को प्राथमिकता दें) |
      | `resolveDefaultThinkingLevel` | डिफ़ॉल्ट `/think` नीति संगतता (बहिष्कृत—`resolveThinkingProfile` को प्राथमिकता दें) |
      | `isModernModelRef` | लाइव/स्मोक मॉडल मिलान |
      | `prepareRuntimeAuth` | अनुमान से पहले टोकन विनिमय |
      | `resolveUsageAuth` | कस्टम उपयोग क्रेडेंशियल पार्सिंग |
      | `fetchUsageSnapshot` | कस्टम उपयोग एंडपॉइंट |
      | `createEmbeddingProvider` | मेमोरी/खोज के लिए प्रदाता के स्वामित्व वाला एम्बेडिंग अडैप्टर |
      | `buildReplayPolicy` | कस्टम ट्रांसक्रिप्ट रीप्ले/Compaction नीति |
      | `sanitizeReplayHistory` | सामान्य सफ़ाई के बाद प्रदाता-विशिष्ट रीप्ले पुनर्लेखन |
      | `validateReplayTurns` | एम्बेडेड रनर से पहले सख़्त रीप्ले-टर्न सत्यापन |
      | `onModelSelected` | चयन-पश्चात कॉलबैक (जैसे टेलीमेट्री) |

      रनटाइम फ़ॉलबैक टिप्पणियाँ:

      - `normalizeConfig` प्रत्येक प्रदाता आईडी के लिए एक स्वामी plugin का समाधान करता है (पहले बंडल किए गए प्रदाता, फिर मेल खाने वाला रनटाइम plugin) और केवल उसी हुक को कॉल करता है—अन्य प्रदाताओं में कोई स्कैन नहीं होता। Google का अपना `normalizeConfig` हुक ही `google` / `google-vertex` / `google-antigravity` कॉन्फ़िगरेशन प्रविष्टियों को सामान्यीकृत करता है; यह अलग कोर फ़ॉलबैक नहीं है।
      - `resolveConfigApiKey` उपलब्ध कराए जाने पर प्रदाता हुक का उपयोग करता है। Amazon Bedrock अपने प्रदाता plugin में AWS परिवेश-मार्कर समाधान रखता है; `auth: "aws-sdk"` के साथ कॉन्फ़िगर किए जाने पर रनटाइम प्रमाणीकरण स्वयं अब भी AWS SDK की डिफ़ॉल्ट शृंखला का उपयोग करता है।
      - `resolveThinkingProfile(ctx)` चयनित `provider`, `modelId`, वैकल्पिक मर्ज किया गया `reasoning` कैटलॉग संकेत और वैकल्पिक मर्ज किए गए मॉडल के `compat` तथ्य प्राप्त करता है। केवल प्रदाता के चिंतन UI/प्रोफ़ाइल का चयन करने के लिए `compat` का उपयोग करें।
      - `resolveSystemPromptContribution` किसी प्रदाता को मॉडल परिवार के लिए कैश-जागरूक सिस्टम-प्रॉम्प्ट मार्गदर्शन इंजेक्ट करने देता है। जब व्यवहार किसी एक प्रदाता/मॉडल परिवार से संबंधित हो और उसे स्थिर/गतिशील कैश विभाजन बनाए रखना चाहिए, तब पुराने plugin-व्यापी `before_prompt_build` हुक के बजाय इसे प्राथमिकता दें।

    </Accordion>

  </Step>

  <Step title="अतिरिक्त क्षमताएँ जोड़ें (वैकल्पिक)">
    ### चरण 5: अतिरिक्त क्षमताएँ जोड़ें

    कोई प्रदाता plugin टेक्स्ट अनुमान के साथ एम्बेडिंग, वाक्, रियलटाइम ट्रांसक्रिप्शन,
    रियलटाइम वॉइस, मीडिया समझ, छवि निर्माण, वीडियो निर्माण,
    वेब फ़ेच और वेब खोज पंजीकृत कर सकता है। OpenClaw इसे
    **हाइब्रिड-क्षमता** plugin के रूप में वर्गीकृत करता है—कंपनी plugins के लिए
    अनुशंसित पैटर्न (प्रति विक्रेता एक plugin)। देखें
    [आंतरिक संरचना: क्षमता स्वामित्व](/hi/plugins/architecture#capability-ownership-model)।

    अपनी मौजूदा `api.registerProvider(...)` कॉल के साथ प्रत्येक क्षमता को
    `register(api)` के भीतर पंजीकृत करें। केवल आवश्यक टैब चुनें:

    <Tabs>
      <Tab title="वाक् (TTS)">
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

        प्रदाता HTTP विफलताओं के लिए `assertOkOrThrowProviderError(...)` का उपयोग करें, ताकि
        plugins सीमित त्रुटि-बॉडी पठन, JSON त्रुटि पार्सिंग और
        अनुरोध-आईडी प्रत्यय साझा करें।
      </Tab>
      <Tab title="रियलटाइम ट्रांसक्रिप्शन">
        `createRealtimeTranscriptionWebSocketSession(...)` को प्राथमिकता दें—साझा
        सहायक प्रॉक्सी कैप्चर, पुनः कनेक्शन बैकऑफ़, बंद करते समय फ़्लशिंग, तैयार
        हैंडशेक, ऑडियो कतारबद्ध करना और बंद-ईवेंट निदान संभालता है। आपका plugin
        केवल अपस्ट्रीम ईवेंट को मैप करता है।

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

        बैच STT प्रदाताओं को, जो multipart ऑडियो POST करते हैं,
        `openclaw/plugin-sdk/provider-http` से
        `buildAudioTranscriptionFormData(...)` का उपयोग करना चाहिए। यह सहायक अपलोड
        फ़ाइल नामों को सामान्यीकृत करता है, जिसमें वे AAC अपलोड भी शामिल हैं जिन्हें
        संगत ट्रांसक्रिप्शन API के लिए M4A-शैली के फ़ाइल नाम की आवश्यकता होती है।
      </Tab>
      <Tab title="रीयलटाइम वॉइस">
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
            // इसे केवल तभी सेट करें जब प्रदाता एक कॉल के लिए कई टूल प्रतिक्रियाएँ
            // स्वीकार करता हो, उदाहरण के लिए तत्काल "काम जारी है" प्रतिक्रिया के बाद
            // अंतिम परिणाम।
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

        `capabilities` घोषित करें, ताकि `talk.catalog` ब्राउज़र और नेटिव Talk
        क्लाइंट के लिए मान्य मोड, ट्रांसपोर्ट, ऑडियो फ़ॉर्मेट और फ़ीचर फ़्लैग उपलब्ध करा सके।
        जब कोई ट्रांसपोर्ट यह पता लगा सकता हो कि कोई
        व्यक्ति सहायक का प्लेबैक बाधित कर रहा है और प्रदाता सक्रिय ऑडियो प्रतिक्रिया को
        छोटा करने या साफ़ करने का समर्थन करता हो, तब `handleBargeIn` लागू करें।
        `submitToolResult` समकालिक सबमिशन के लिए `void`, या ऐसी अतुल्यकालिक
        पूर्णता सीमा के लिए `Promise<void>` लौटा सकता है जिसे प्रदाता
        ब्रिज उपलब्ध करा सकता है। Gateway रिले सत्र अंतिम परिणाम की पुष्टि करने या
        लिंक किए गए रन को साफ़ करने से पहले उस प्रॉमिस की प्रतीक्षा करते हैं; सबमिशन
        विफल होने पर उसे अस्वीकार करें।
        जब प्रदाता `options.suppressResponse` का पालन नहीं कर सकता हो, तब
        `supportsToolResultSuppression: false` सेट करें। इसके बाद OpenClaw आंतरिक
        फ़ोर्स्ड-कंसल्ट और रद्दीकरण परिणामों के लिए दमन से बचता है, और चुपचाप प्रतिक्रिया
        शुरू करने के बजाय प्रत्यक्ष दबाए गए परिणाम अनुरोधों को अस्वीकार करता है।
        `createRealtimeVoiceBridgeSession` के उपभोक्ता इसी प्रकार
        `onToolCall` से प्रॉमिस लौटा सकते हैं; समकालिक थ्रो और अस्वीकृतियाँ
        सत्र के `onError` कॉलबैक पर भेजी जाती हैं।
        `handlesInputAudioBargeIn` केवल तभी सेट करें जब प्रदाता VAD
        `onClearAudio("barge-in")` को कॉल करके व्यवधान की पुष्टि करे। जो प्रदाता
        फ़्लैग छोड़ देते हैं, वे OpenClaw की स्थानीय इनपुट-ऑडियो फ़ॉलबैक पहचान का उपयोग करते हैं।
      </Tab>
      <Tab title="मीडिया की समझ">
        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "acme-ai",
          capabilities: ["image", "audio"],
          describeImage: async (req) => ({ text: "एक फ़ोटो..." }),
          transcribeAudio: async (req) => ({ text: "ट्रांसक्रिप्ट..." }),
        });
        ```

        ऐसे स्थानीय या स्वयं-होस्ट किए गए मीडिया प्रदाता, जिन्हें जानबूझकर
        क्रेडेंशियल की आवश्यकता नहीं होती, `resolveAuth` उपलब्ध करा सकते हैं और `kind: "none"`
        लौटा सकते हैं। जो प्रदाता स्पष्ट रूप से ऑप्ट इन नहीं करते,
        उनके लिए OpenClaw अब भी सामान्य प्रमाणीकरण गेट बनाए रखता है।
        मौजूदा प्रदाता `req.apiKey` पढ़ना जारी रख सकते हैं;
        नए प्रदाताओं को `req.auth` को प्राथमिकता देनी चाहिए।

        ```typescript
        api.registerMediaUnderstandingProvider({
          id: "local-audio",
          capabilities: ["audio"],
          resolveAuth: () => ({
            kind: "none",
            source: "local-audio प्लगइन बिना-प्रमाणीकरण",
          }),
          transcribeAudio: async (req) => ({ text: "ट्रांसक्रिप्ट..." }),
        });
        ```
      </Tab>
      <Tab title="एम्बेडिंग">
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

        `contracts.embeddingProviders` में वही आईडी घोषित करें। यह पुनः उपयोग योग्य वेक्टर
        जनरेशन के लिए सामान्य एम्बेडिंग अनुबंध है, जिसमें मेमोरी खोज शामिल है।
        `registerMemoryEmbeddingProvider(...)` मौजूदा मेमोरी-विशिष्ट अडैप्टर के लिए
        अप्रचलित संगतता है।
      </Tab>
      <Tab title="इमेज और वीडियो जनरेशन">
        इमेज और वीडियो क्षमताएँ **मोड-सचेत** संरचना का उपयोग करती हैं। इमेज
        प्रदाता आवश्यक `generate` और `edit` क्षमता ब्लॉक घोषित करते हैं;
        वीडियो प्रदाता `generate`, `imageToVideo`, और
        `videoToVideo` घोषित करते हैं। `maxInputImages` /
        `maxInputVideos` / `maxDurationSeconds` जैसे समतल समेकित फ़ील्ड
        ट्रांसफ़ॉर्म-मोड समर्थन या अक्षम मोड को स्पष्ट रूप से दर्शाने के लिए पर्याप्त नहीं हैं।
        संगीत जनरेशन भी इसी `generate` / `edit` पैटर्न का
        पालन करता है।

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

        दोनों प्रदाता प्रकारों पर `capabilities` आवश्यक है; `edit` और
        वीडियो ट्रांसफ़ॉर्म ब्लॉक (`imageToVideo`, `videoToVideo`) को हमेशा
        एक स्पष्ट `enabled` फ़्लैग की आवश्यकता होती है।

        जब सूचीबद्ध मॉडल के स्थिर मोड या क्षमताएँ प्रदाता के डिफ़ॉल्ट से
        अलग हों, तब `catalogByModel` का उपयोग करें। यह मेटाडेटा प्रदाता कोड
        लागू किए बिना `video_generate action=list` और मॉडल कैटलॉग को सटीक रखता है।
        अनुरोध-समय क्षमता लुकअप और प्रवर्तन अब भी `resolveModelCapabilities` और
        `generateVideo` में होने चाहिए; जहाँ संभव हो दोनों पथों के लिए
        उसी क्षमता कॉन्स्टेंट का पुनः उपयोग करें।
      </Tab>
      <Tab title="वेब फ़ेच और खोज">
        ```typescript
        api.registerWebFetchProvider({
          id: "acme-ai-fetch",
          label: "Acme Fetch",
          hint: "Acme के रेंडरिंग बैकएंड के माध्यम से पेज फ़ेच करें।",
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
            description: "Acme Fetch के माध्यम से पेज फ़ेच करें।",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });

        api.registerWebSearchProvider({
          id: "acme-ai-search",
          label: "Acme Search",
          hint: "Acme के खोज बैकएंड के माध्यम से वेब पर खोजें।",
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
            description: "Acme Search के माध्यम से वेब पर खोजें।",
            parameters: {},
            execute: async (args) => ({ content: [] }),
          }),
        });
        ```

        दोनों प्रदाता प्रकार एक ही क्रेडेंशियल-वायरिंग संरचना साझा करते हैं:
        `hint`, `envVars`, `placeholder`, `signupUrl`, `credentialPath`,
        `getCredentialValue`, `setCredentialValue`, और `createTool` सभी
        आवश्यक हैं।
      </Tab>
    </Tabs>

  </Step>

  <Step title="परीक्षण">
    ### चरण 6: परीक्षण

    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // अपने प्रदाता कॉन्फ़िग ऑब्जेक्ट को index.ts या किसी समर्पित फ़ाइल से निर्यात करें
    import { acmeProvider } from "./provider.js";

    describe("acme-ai प्रदाता", () => {
      it("डायनेमिक मॉडल का समाधान करता है", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("कुंजी उपलब्ध होने पर कैटलॉग लौटाता है", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("कुंजी न होने पर शून्य कैटलॉग लौटाता है", async () => {
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

प्रदाता प्लगइन किसी भी अन्य बाहरी कोड प्लगइन की तरह ही प्रकाशित होते हैं:

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

`clawhub skill publish <path>` किसी स्किल फ़ोल्डर को प्रकाशित करने के लिए एक अलग कमांड है,
प्लगइन पैकेज के लिए नहीं—यहाँ इसका उपयोग न करें।

## फ़ाइल संरचना

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers मेटाडेटा
├── openclaw.plugin.json      # प्रदाता प्रमाणीकरण मेटाडेटा वाला मैनिफ़ेस्ट
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # परीक्षण
    └── usage.ts              # उपयोग एंडपॉइंट (वैकल्पिक)
```

## कैटलॉग क्रम संदर्भ

`catalog.order` यह नियंत्रित करता है कि आपका कैटलॉग अंतर्निहित
प्रदाताओं के सापेक्ष कब मर्ज होता है:

| क्रम      | कब            | उपयोग का मामला                                      |
| --------- | ------------- | --------------------------------------------------- |
| `simple`  | पहला चरण     | साधारण API-कुंजी प्रदाता                            |
| `profile` | सरल के बाद   | प्रमाणीकरण प्रोफ़ाइल से नियंत्रित प्रदाता            |
| `paired`  | प्रोफ़ाइल के बाद | एकाधिक संबंधित प्रविष्टियाँ तैयार करना           |
| `late`    | अंतिम चरण    | मौजूदा प्रदाताओं को ओवरराइड करना (टकराव पर प्रभावी) |

## अगले चरण

- [चैनल Plugin](/hi/plugins/sdk-channel-plugins) - यदि आपका Plugin कोई चैनल भी प्रदान करता है
- [SDK रनटाइम](/hi/plugins/sdk-runtime) - `api.runtime` सहायक (TTS, खोज, सबएजेंट)
- [SDK अवलोकन](/hi/plugins/sdk-overview) - संपूर्ण सबपाथ इम्पोर्ट संदर्भ
- [Plugin की आंतरिक संरचना](/hi/plugins/architecture-internals#provider-runtime-hooks) - हुक विवरण और बंडल किए गए उदाहरण

## संबंधित

- [Plugin SDK सेटअप](/hi/plugins/sdk-setup)
- [Plugin बनाना](/hi/plugins/building-plugins)
- [चैनल Plugin बनाना](/hi/plugins/sdk-channel-plugins)
