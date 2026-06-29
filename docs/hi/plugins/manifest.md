---
read_when:
    - आप एक OpenClaw Plugin बना रहे हैं
    - आपको Plugin कॉन्फ़िग स्कीमा शिप करना है या Plugin सत्यापन त्रुटियों को डीबग करना है
summary: Plugin मैनिफ़ेस्ट + JSON स्कीमा आवश्यकताएँ (सख्त कॉन्फ़िग सत्यापन)
title: Plugin मेनिफेस्ट
x-i18n:
    generated_at: "2026-06-28T23:37:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 62f6684ab074e4f14ce5c833fe8c8c624a2750f80215bdeffd972e27dd6bfc9c
    source_path: plugins/manifest.md
    workflow: 16
---

यह पृष्ठ केवल **नेटिव OpenClaw Plugin मेनिफेस्ट** के लिए है।

संगत बंडल लेआउट के लिए, [Plugin बंडल](/hi/plugins/bundles) देखें।

संगत बंडल फ़ॉर्मैट अलग मेनिफेस्ट फ़ाइलों का उपयोग करते हैं:

- Codex बंडल: `.codex-plugin/plugin.json`
- Claude बंडल: `.claude-plugin/plugin.json` या बिना मेनिफेस्ट वाला डिफ़ॉल्ट Claude घटक
  लेआउट
- Cursor बंडल: `.cursor-plugin/plugin.json`

OpenClaw उन बंडल लेआउट को भी स्वतः पहचानता है, लेकिन उन्हें यहाँ वर्णित
`openclaw.plugin.json` स्कीमा के विरुद्ध सत्यापित नहीं किया जाता।

संगत बंडलों के लिए, OpenClaw वर्तमान में बंडल मेटाडेटा के साथ घोषित
skill रूट, Claude कमांड रूट, Claude बंडल `settings.json` डिफ़ॉल्ट,
Claude बंडल LSP डिफ़ॉल्ट, और समर्थित hook पैक पढ़ता है, जब लेआउट
OpenClaw रनटाइम अपेक्षाओं से मेल खाता है।

हर नेटिव OpenClaw Plugin को **Plugin रूट** में एक `openclaw.plugin.json` फ़ाइल
शिप करनी **अनिवार्य** है। OpenClaw इस मेनिफेस्ट का उपयोग **Plugin कोड निष्पादित किए बिना**
कॉन्फ़िगरेशन सत्यापित करने के लिए करता है। अनुपस्थित या अमान्य मेनिफेस्ट को
Plugin त्रुटियाँ माना जाता है और वे कॉन्फ़िग सत्यापन को रोकते हैं।

पूरा Plugin सिस्टम गाइड देखें: [Plugins](/hi/tools/plugin)।
नेटिव क्षमता मॉडल और वर्तमान बाहरी-संगतता मार्गदर्शन के लिए:
[क्षमता मॉडल](/hi/plugins/architecture#public-capability-model)।

## यह फ़ाइल क्या करती है

`openclaw.plugin.json` वह मेटाडेटा है जिसे OpenClaw आपका
**Plugin कोड लोड करने से पहले** पढ़ता है। नीचे दी गई हर चीज़ इतनी हल्की होनी चाहिए
कि Plugin रनटाइम बूट किए बिना निरीक्षण की जा सके।

**इसका उपयोग करें:**

- Plugin पहचान, कॉन्फ़िग सत्यापन, और कॉन्फ़िग UI संकेतों के लिए
- auth, ऑनबोर्डिंग, और सेटअप मेटाडेटा (alias, auto-enable, provider env vars, auth choices) के लिए
- control-plane सतहों के लिए activation संकेतों के लिए
- मॉडल-फ़ैमिली स्वामित्व के शॉर्टहैंड के लिए
- स्थिर क्षमता-स्वामित्व स्नैपशॉट (`contracts`) के लिए
- QA runner मेटाडेटा जिसे साझा `openclaw qa` होस्ट निरीक्षण कर सके
- catalog और validation सतहों में merge किए गए channel-specific config metadata के लिए

**इसका उपयोग न करें:** रनटाइम व्यवहार रजिस्टर करने, कोड entrypoints घोषित करने,
या npm install metadata के लिए। वे आपके Plugin कोड और `package.json` में होते हैं।

## न्यूनतम उदाहरण

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## समृद्ध उदाहरण

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "OpenRouter provider plugin",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "modelIdNormalization": {
    "providers": {
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  },
  "providerEndpoints": [
    {
      "endpointClass": "openrouter",
      "hostSuffixes": ["openrouter.ai"]
    }
  ],
  "providerRequest": {
    "providers": {
      "openrouter": {
        "family": "openrouter"
      }
    }
  },
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
  "setup": {
    "providers": [
      {
        "id": "openrouter",
        "envVars": ["OPENROUTER_API_KEY"]
      }
    ]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## शीर्ष-स्तरीय फ़ील्ड संदर्भ

| फ़ील्ड                               | आवश्यक | प्रकार                           | इसका अर्थ                                                                                                                                                                                                                                      |
| ------------------------------------ | ------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | हाँ    | `string`                         | कैननिकल plugin id. यह `plugins.entries.<id>` में उपयोग किया जाने वाला id है।                                                                                                                                                                    |
| `configSchema`                       | हाँ    | `object`                         | इस plugin के config के लिए इनलाइन JSON Schema.                                                                                                                                                                                                 |
| `requiresPlugins`                    | नहीं   | `string[]`                       | Plugin ids जो इस plugin के प्रभावी होने के लिए साथ में इंस्टॉल होने चाहिए। Discovery plugin को लोड करने योग्य रखती है, लेकिन कोई आवश्यक plugin न मिलने पर चेतावनी देती है।                                                                     |
| `enabledByDefault`                   | नहीं   | `true`                           | bundled plugin को डिफ़ॉल्ट रूप से सक्षम के रूप में चिह्नित करता है। इसे छोड़ दें, या कोई भी non-`true` मान सेट करें, ताकि plugin डिफ़ॉल्ट रूप से अक्षम रहे।                                                                                   |
| `enabledByDefaultOnPlatforms`        | नहीं   | `string[]`                       | bundled plugin को केवल सूचीबद्ध Node.js platforms पर डिफ़ॉल्ट रूप से सक्षम के रूप में चिह्नित करता है, उदाहरण के लिए `["darwin"]`. स्पष्ट config फिर भी प्राथमिक रहेगा।                                                                      |
| `legacyPluginIds`                    | नहीं   | `string[]`                       | Legacy ids जो इस कैननिकल plugin id में normalize होते हैं।                                                                                                                                                                                     |
| `autoEnableWhenConfiguredProviders`  | नहीं   | `string[]`                       | Provider ids जो auth, config, या model refs में उल्लिखित होने पर इस plugin को auto-enable करें।                                                                                                                                                |
| `kind`                               | नहीं   | `"memory"` \| `"context-engine"` | `plugins.slots.*` द्वारा उपयोग किया जाने वाला एक exclusive plugin kind घोषित करता है।                                                                                                                                                          |
| `channels`                           | नहीं   | `string[]`                       | इस plugin के स्वामित्व वाले Channel ids. Discovery और config validation के लिए उपयोग किया जाता है।                                                                                                                                             |
| `providers`                          | नहीं   | `string[]`                       | इस plugin के स्वामित्व वाले Provider ids.                                                                                                                                                                                                      |
| `providerCatalogEntry`               | नहीं   | `string`                         | plugin root के सापेक्ष lightweight provider-catalog module path, manifest-scoped provider catalog metadata के लिए, जिसे पूरे plugin runtime को सक्रिय किए बिना लोड किया जा सकता है।                                                            |
| `modelSupport`                       | नहीं   | `object`                         | runtime से पहले plugin को auto-load करने के लिए उपयोग किया जाने वाला manifest-owned shorthand model-family metadata.                                                                                                                           |
| `modelCatalog`                       | नहीं   | `object`                         | इस plugin के स्वामित्व वाले providers के लिए declarative model catalog metadata. यह भविष्य की read-only listing, onboarding, model pickers, aliases, और plugin runtime लोड किए बिना suppression के लिए control-plane contract है।              |
| `modelPricing`                       | नहीं   | `object`                         | Provider-owned external pricing lookup policy. इसका उपयोग local/self-hosted providers को remote pricing catalogs से opt out करने या core में provider ids hardcode किए बिना provider refs को OpenRouter/LiteLLM catalog ids पर map करने के लिए करें। |
| `modelIdNormalization`               | नहीं   | `object`                         | Provider-owned model-id alias/prefix cleanup जो provider runtime लोड होने से पहले चलना चाहिए।                                                                                                                                                  |
| `providerEndpoints`                  | नहीं   | `object[]`                       | Provider routes के लिए manifest-owned endpoint host/baseUrl metadata, जिसे core को provider runtime लोड होने से पहले classify करना चाहिए।                                                                                                      |
| `providerRequest`                    | नहीं   | `object`                         | Generic request policy द्वारा provider runtime लोड होने से पहले उपयोग किया जाने वाला सस्ता provider-family और request-compatibility metadata.                                                                                                  |
| `secretProviderIntegrations`         | नहीं   | `Record<string, object>`         | Declarative SecretRef exec provider presets जिन्हें setup या install surfaces core में provider-specific integrations hardcode किए बिना offer कर सकते हैं।                                                                                       |
| `cliBackends`                        | नहीं   | `string[]`                       | इस plugin के स्वामित्व वाले CLI inference backend ids. explicit config refs से startup auto-activation के लिए उपयोग किया जाता है।                                                                                                              |
| `syntheticAuthRefs`                  | नहीं   | `string[]`                       | Provider या CLI backend refs जिनके plugin-owned synthetic auth hook को runtime लोड होने से पहले cold model discovery के दौरान probe किया जाना चाहिए।                                                                                            |
| `nonSecretAuthMarkers`               | नहीं   | `string[]`                       | Bundled-plugin-owned placeholder API key values जो non-secret local, OAuth, या ambient credential state को दर्शाते हैं।                                                                                                                         |
| `commandAliases`                     | नहीं   | `object[]`                       | इस plugin के स्वामित्व वाले Command names, जिन्हें runtime लोड होने से पहले plugin-aware config और CLI diagnostics उत्पन्न करने चाहिए।                                                                                                         |
| `providerAuthEnvVars`                | नहीं   | `Record<string, string[]>`       | Provider auth/status lookup के लिए deprecated compatibility env metadata. नए plugins के लिए `setup.providers[].envVars` को प्राथमिकता दें; OpenClaw deprecation window के दौरान इसे अभी भी पढ़ता है।                                          |
| `providerAuthAliases`                | नहीं   | `Record<string, string>`         | Provider ids जिन्हें auth lookup के लिए किसी अन्य provider id का पुनः उपयोग करना चाहिए, उदाहरण के लिए ऐसा coding provider जो base provider API key और auth profiles साझा करता है।                                                             |
| `channelEnvVars`                     | नहीं   | `Record<string, string[]>`       | सस्ता channel env metadata जिसे OpenClaw plugin code लोड किए बिना inspect कर सकता है। इसका उपयोग env-driven channel setup या auth surfaces के लिए करें जिन्हें generic startup/config helpers को देखना चाहिए।                                |
| `providerAuthChoices`                | नहीं   | `object[]`                       | Onboarding pickers, preferred-provider resolution, और simple CLI flag wiring के लिए सस्ता auth-choice metadata.                                                                                                                                |
| `activation`                         | नहीं   | `object`                         | startup, provider, command, channel, route, और capability-triggered loading के लिए सस्ता activation planner metadata. केवल metadata; actual behavior का स्वामित्व अभी भी plugin runtime के पास है।                                           |
| `setup`                              | नहीं   | `object`                         | सस्ते setup/onboarding descriptors जिन्हें discovery और setup surfaces plugin runtime लोड किए बिना inspect कर सकते हैं।                                                                                                                        |
| `qaRunners`                          | नहीं   | `object[]`                       | shared `openclaw qa` host द्वारा plugin runtime लोड होने से पहले उपयोग किए जाने वाले सस्ते QA runner descriptors.                                                                                                                             |
| `contracts`                          | नहीं   | `object`                         | external auth hooks, embeddings, speech, realtime transcription, realtime voice, media-understanding, image-generation, music-generation, video-generation, web-fetch, web search, और tool ownership के लिए static capability ownership snapshot. |
| `mediaUnderstandingProviderMetadata` | नहीं   | `Record<string, object>`         | `contracts.mediaUnderstandingProviders` में घोषित provider ids के लिए सस्ते media-understanding defaults.                                                                                                                                      |
| `imageGenerationProviderMetadata`    | नहीं   | `Record<string, object>`         | `contracts.imageGenerationProviders` में घोषित provider ids के लिए सस्ता image-generation auth metadata, जिसमें provider-owned auth aliases और base-url guards शामिल हैं।                                                                      |
| `videoGenerationProviderMetadata`    | नहीं   | `Record<string, object>`         | `contracts.videoGenerationProviders` में घोषित provider ids के लिए सस्ता video-generation auth metadata, जिसमें provider-owned auth aliases और base-url guards शामिल हैं।                                                                      |
| `musicGenerationProviderMetadata`    | नहीं   | `Record<string, object>`         | `contracts.musicGenerationProviders` में घोषित provider ids के लिए सस्ता music-generation auth metadata, जिसमें provider-owned auth aliases और base-url guards शामिल हैं।                                                                      |
| `toolMetadata`                       | नहीं       | `Record<string, object>`         | `contracts.tools` में घोषित Plugin-स्वामित्व वाले टूल के लिए हल्का उपलब्धता मेटाडेटा। इसका उपयोग तब करें जब किसी टूल को कॉन्फ़िग, परिवेश, या प्रमाणीकरण प्रमाण मौजूद होने तक रनटाइम लोड नहीं करना चाहिए।                                                                       |
| `channelConfigs`                     | नहीं       | `Record<string, object>`         | रनटाइम लोड होने से पहले डिस्कवरी और सत्यापन सतहों में मर्ज किया गया मैनिफ़ेस्ट-स्वामित्व वाला चैनल कॉन्फ़िग मेटाडेटा।                                                                                                                                      |
| `skills`                             | नहीं       | `string[]`                       | लोड करने के लिए Skills निर्देशिकाएं, Plugin रूट के सापेक्ष।                                                                                                                                                                                         |
| `name`                               | नहीं       | `string`                         | मनुष्य-पठनीय Plugin नाम।                                                                                                                                                                                                                     |
| `description`                        | नहीं       | `string`                         | Plugin सतहों में दिखाया गया संक्षिप्त सारांश।                                                                                                                                                                                                         |
| `icon`                               | नहीं       | `string`                         | मार्केटप्लेस/कैटलॉग कार्ड के लिए HTTPS छवि URL। ClawHub किसी भी मान्य `https://` URL को स्वीकार करता है और इसके छोड़े जाने या अमान्य होने पर डिफ़ॉल्ट Plugin आइकन पर वापस जाता है।                                                                              |
| `version`                            | नहीं       | `string`                         | सूचनात्मक Plugin संस्करण।                                                                                                                                                                                                                   |
| `uiHints`                            | नहीं       | `Record<string, object>`         | कॉन्फ़िग फ़ील्ड के लिए UI लेबल, प्लेसहोल्डर, और संवेदनशीलता संकेत।                                                                                                                                                                               |

## जनरेशन प्रोवाइडर मेटाडेटा संदर्भ

जनरेशन प्रोवाइडर मेटाडेटा फ़ील्ड उन प्रोवाइडर के लिए स्थिर ऑथ सिग्नल बताते हैं
जो संबंधित `contracts.*GenerationProviders` सूची में घोषित हैं।
OpenClaw इन फ़ील्ड को प्रोवाइडर रनटाइम लोड होने से पहले पढ़ता है ताकि कोर टूल
हर प्रोवाइडर Plugin को इंपोर्ट किए बिना तय कर सकें कि कोई जनरेशन प्रोवाइडर उपलब्ध है या नहीं।

इन फ़ील्ड का उपयोग केवल सस्ते, घोषणात्मक तथ्यों के लिए करें। ट्रांसपोर्ट, अनुरोध
ट्रांसफ़ॉर्म, टोकन रिफ़्रेश, क्रेडेंशियल सत्यापन, और वास्तविक जनरेशन व्यवहार
Plugin रनटाइम में रहते हैं।

```json
{
  "contracts": {
    "imageGenerationProviders": ["example-image"]
  },
  "imageGenerationProviderMetadata": {
    "example-image": {
      "aliases": ["example-image-oauth"],
      "authProviders": ["example-image"],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example-image.config",
          "overlayPath": "image",
          "mode": {
            "path": "mode",
            "default": "local",
            "allowed": ["local"]
          },
          "requiredAny": ["workflow", "workflowPath"],
          "required": ["promptNodeId"]
        }
      ],
      "authSignals": [
        {
          "provider": "example-image"
        },
        {
          "provider": "example-image-oauth",
          "providerBaseUrl": {
            "provider": "example-image",
            "defaultBaseUrl": "https://api.example.com/v1",
            "allowedBaseUrls": ["https://api.example.com/v1"]
          }
        }
      ]
    }
  }
}
```

हर मेटाडेटा एंट्री समर्थित करती है:

| फ़ील्ड                  | आवश्यक | प्रकार     | इसका अर्थ                                                                                                                                       |
| ---------------------- | -------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aliases`              | नहीं       | `string[]` | अतिरिक्त प्रोवाइडर ids जिन्हें जनरेशन प्रोवाइडर के लिए स्थिर ऑथ उपनाम माना जाना चाहिए।                                                       |
| `authProviders`        | नहीं       | `string[]` | प्रोवाइडर ids जिनकी कॉन्फ़िगर की गई ऑथ प्रोफ़ाइलों को इस जनरेशन प्रोवाइडर के लिए ऑथ माना जाना चाहिए।                                                      |
| `configSignals`        | नहीं       | `object[]` | लोकल या स्वयं-होस्टेड प्रोवाइडर के लिए सस्ते केवल-कॉन्फ़िग उपलब्धता सिग्नल, जिन्हें ऑथ प्रोफ़ाइलों या env vars के बिना कॉन्फ़िगर किया जा सकता है।                 |
| `authSignals`          | नहीं       | `object[]` | स्पष्ट ऑथ सिग्नल। मौजूद होने पर ये प्रोवाइडर id, `aliases`, और `authProviders` से बने डिफ़ॉल्ट सिग्नल सेट को बदल देते हैं।                     |
| `referenceAudioInputs` | नहीं       | `boolean`  | केवल वीडियो-जनरेशन। जब प्रोवाइडर संदर्भ ऑडियो एसेट स्वीकार करता हो तो `true` पर सेट करें; अन्यथा `video_generate` ऑडियो संदर्भ पैरामीटर छिपा देता है। |

हर `configSignals` एंट्री समर्थित करती है:

| फ़ील्ड            | आवश्यक | प्रकार     | इसका अर्थ                                                                                                                                                                             |
| ---------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`       | हाँ      | `string`   | जाँचने के लिए Plugin-स्वामित्व वाले कॉन्फ़िग ऑब्जेक्ट तक डॉट पाथ, उदाहरण के लिए `plugins.entries.example.config`।                                                                                      |
| `overlayPath`    | नहीं       | `string`   | रूट कॉन्फ़िग के अंदर डॉट पाथ, जिसका ऑब्जेक्ट सिग्नल का मूल्यांकन करने से पहले रूट ऑब्जेक्ट पर ओवरले होना चाहिए। इसे `image`, `video`, या `music` जैसी क्षमता-विशिष्ट कॉन्फ़िग के लिए उपयोग करें।   |
| `overlayMapPath` | नहीं       | `string`   | रूट कॉन्फ़िग के अंदर डॉट पाथ, जिसके ऑब्जेक्ट मानों में से हर एक रूट ऑब्जेक्ट पर ओवरले होना चाहिए। इसे `accounts` जैसे नामित अकाउंट मैप के लिए उपयोग करें, जहाँ कोई भी कॉन्फ़िगर किया गया अकाउंट पात्र होना चाहिए। |
| `required`       | नहीं       | `string[]` | प्रभावी कॉन्फ़िग के अंदर डॉट पाथ जिनमें कॉन्फ़िगर किए गए मान होने चाहिए। स्ट्रिंग खाली नहीं होनी चाहिए; ऑब्जेक्ट और ऐरे खाली नहीं होने चाहिए।                                                  |
| `requiredAny`    | नहीं       | `string[]` | प्रभावी कॉन्फ़िग के अंदर डॉट पाथ, जिनमें से कम से कम एक में कॉन्फ़िगर किया गया मान होना चाहिए।                                                                                                    |
| `mode`           | नहीं       | `object`   | प्रभावी कॉन्फ़िग के अंदर वैकल्पिक स्ट्रिंग मोड गार्ड। इसका उपयोग तब करें जब केवल-कॉन्फ़िग उपलब्धता सिर्फ़ एक मोड पर लागू होती हो।                                                                  |

हर `mode` गार्ड समर्थित करता है:

| फ़ील्ड        | आवश्यक | प्रकार     | इसका अर्थ                                                                      |
| ------------ | -------- | ---------- | ---------------------------------------------------------------------------------- |
| `path`       | नहीं       | `string`   | प्रभावी कॉन्फ़िग के अंदर डॉट पाथ। डिफ़ॉल्ट `mode` है।                          |
| `default`    | नहीं       | `string`   | जब कॉन्फ़िग पाथ छोड़ देता है, तब उपयोग करने वाला मोड मान।                                  |
| `allowed`    | नहीं       | `string[]` | मौजूद होने पर, सिग्नल केवल तब पास होता है जब प्रभावी मोड इन मानों में से एक हो। |
| `disallowed` | नहीं       | `string[]` | मौजूद होने पर, सिग्नल तब विफल होता है जब प्रभावी मोड इन मानों में से एक हो।       |

हर `authSignals` एंट्री समर्थित करती है:

| फ़ील्ड             | आवश्यक | प्रकार   | इसका अर्थ                                                                                                                                                                 |
| ----------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | हाँ      | `string` | कॉन्फ़िगर की गई ऑथ प्रोफ़ाइलों में जाँचने के लिए प्रोवाइडर id।                                                                                                                             |
| `providerBaseUrl` | नहीं       | `object` | वैकल्पिक गार्ड जो सिग्नल को केवल तब गिनता है जब संदर्भित कॉन्फ़िगर किया गया प्रोवाइडर अनुमत बेस URL का उपयोग करता हो। इसका उपयोग तब करें जब कोई ऑथ उपनाम केवल कुछ APIs के लिए मान्य हो। |

हर `providerBaseUrl` गार्ड समर्थित करता है:

| फ़ील्ड             | आवश्यक | प्रकार     | इसका अर्थ                                                                                                                                        |
| ----------------- | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | हाँ      | `string`   | प्रोवाइडर कॉन्फ़िग id, जिसका `baseUrl` जाँचना चाहिए।                                                                                                |
| `defaultBaseUrl`  | नहीं       | `string`   | जब प्रोवाइडर कॉन्फ़िग `baseUrl` छोड़ देता है, तब मानने वाला बेस URL।                                                                                         |
| `allowedBaseUrls` | हाँ      | `string[]` | इस ऑथ सिग्नल के लिए अनुमत बेस URLs। जब कॉन्फ़िगर किया गया या डिफ़ॉल्ट बेस URL इन सामान्यीकृत मानों में से किसी एक से मेल नहीं खाता, तो सिग्नल अनदेखा किया जाता है। |

## टूल मेटाडेटा संदर्भ

`toolMetadata` टूल नाम से की गई कुंजी के साथ, जनरेशन प्रोवाइडर मेटाडेटा जैसी ही
`configSignals` और `authSignals` आकृतियों का उपयोग करता है। `contracts.tools` स्वामित्व घोषित करता है।
`toolMetadata` सस्ता उपलब्धता प्रमाण घोषित करता है ताकि OpenClaw केवल अपने टूल फ़ैक्टरी से `null`
वापस दिलाने के लिए Plugin रनटाइम इंपोर्ट करने से बच सके।

```json
{
  "setup": {
    "providers": [
      {
        "id": "example",
        "envVars": ["EXAMPLE_API_KEY"]
      }
    ]
  },
  "contracts": {
    "tools": ["example_search"]
  },
  "toolMetadata": {
    "example_search": {
      "authSignals": [
        {
          "provider": "example"
        }
      ],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example.config",
          "overlayPath": "search",
          "required": ["apiKey"]
        }
      ]
    }
  }
}
```

यदि किसी टूल के पास `toolMetadata` नहीं है, तो OpenClaw मौजूदा व्यवहार सुरक्षित रखता है और
टूल कॉन्ट्रैक्ट पॉलिसी से मेल खाने पर स्वामित्व वाला Plugin लोड करता है। हॉट-पाथ
टूल जिनकी फ़ैक्टरी ऑथ/कॉन्फ़िग पर निर्भर करती है, उनके लिए Plugin लेखकों को पूछने के लिए
कोर से रनटाइम इंपोर्ट करवाने के बजाय `toolMetadata` घोषित करना चाहिए।

## providerAuthChoices संदर्भ

हर `providerAuthChoices` एंट्री एक ऑनबोर्डिंग या ऑथ विकल्प बताती है।
OpenClaw इसे प्रोवाइडर रनटाइम लोड होने से पहले पढ़ता है।
प्रोवाइडर सेटअप सूचियाँ प्रोवाइडर रनटाइम लोड किए बिना इन मैनिफ़ेस्ट विकल्पों, डिस्क्रिप्टर-व्युत्पन्न सेटअप
विकल्पों, और इंस्टॉल-कैटलॉग मेटाडेटा का उपयोग करती हैं।

| फ़ील्ड                 | आवश्यक | प्रकार                                                                  | इसका अर्थ क्या है                                                                                            |
| --------------------- | -------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `provider`            | हाँ      | `string`                                                              | प्रदाता आईडी जिससे यह विकल्प संबंधित है।                                                                      |
| `method`              | हाँ      | `string`                                                              | जिस पर डिस्पैच करना है वह प्रमाणीकरण विधि आईडी।                                                                           |
| `choiceId`            | हाँ      | `string`                                                              | ऑनबोर्डिंग और CLI फ़्लो द्वारा उपयोग की जाने वाली स्थिर प्रमाणीकरण-विकल्प आईडी।                                                  |
| `choiceLabel`         | नहीं       | `string`                                                              | उपयोगकर्ता को दिखने वाला लेबल। अगर छोड़ा गया हो, तो OpenClaw `choiceId` पर वापस जाता है।                                        |
| `choiceHint`          | नहीं       | `string`                                                              | पिकर के लिए छोटा सहायक टेक्स्ट।                                                                        |
| `assistantPriority`   | नहीं       | `number`                                                              | कम मान सहायक-संचालित इंटरैक्टिव पिकर में पहले क्रमबद्ध होते हैं।                                       |
| `assistantVisibility` | नहीं       | `"visible"` \| `"manual-only"`                                        | मैन्युअल CLI चयन की अनुमति देते हुए भी विकल्प को सहायक पिकर से छिपाएँ।                        |
| `deprecatedChoiceIds` | नहीं       | `string[]`                                                            | पुराने विकल्प आईडी जिन्हें उपयोगकर्ताओं को इस प्रतिस्थापन विकल्प पर रीडायरेक्ट करना चाहिए।                                 |
| `groupId`             | नहीं       | `string`                                                              | संबंधित विकल्पों को समूहित करने के लिए वैकल्पिक समूह आईडी।                                                          |
| `groupLabel`          | नहीं       | `string`                                                              | उस समूह के लिए उपयोगकर्ता को दिखने वाला लेबल।                                                                        |
| `groupHint`           | नहीं       | `string`                                                              | समूह के लिए छोटा सहायक टेक्स्ट।                                                                         |
| `optionKey`           | नहीं       | `string`                                                              | सरल एक-फ़्लैग प्रमाणीकरण फ़्लो के लिए आंतरिक विकल्प कुंजी।                                                      |
| `cliFlag`             | नहीं       | `string`                                                              | CLI फ़्लैग नाम, जैसे `--openrouter-api-key`।                                                           |
| `cliOption`           | नहीं       | `string`                                                              | पूरा CLI विकल्प आकार, जैसे `--openrouter-api-key <key>`।                                             |
| `cliDescription`      | नहीं       | `string`                                                              | CLI सहायता में उपयोग किया गया विवरण।                                                                            |
| `onboardingScopes`    | नहीं       | `Array<"text-inference" \| "image-generation" \| "music-generation">` | यह विकल्प किन ऑनबोर्डिंग सतहों में दिखना चाहिए। अगर छोड़ा गया हो, तो यह डिफ़ॉल्ट रूप से `["text-inference"]` होता है। |

## commandAliases संदर्भ

`commandAliases` का उपयोग तब करें जब कोई Plugin ऐसा रनटाइम कमांड नाम रखता हो जिसे उपयोगकर्ता
गलती से `plugins.allow` में डाल सकते हैं या root CLI कमांड की तरह चलाने की कोशिश कर सकते हैं। OpenClaw
Plugin रनटाइम कोड आयात किए बिना निदान के लिए इस मेटाडेटा का उपयोग करता है।

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| फ़ील्ड        | आवश्यक | प्रकार              | इसका अर्थ क्या है                                                           |
| ------------ | -------- | ----------------- | ----------------------------------------------------------------------- |
| `name`       | हाँ      | `string`          | कमांड नाम जो इस Plugin से संबंधित है।                               |
| `kind`       | नहीं       | `"runtime-slash"` | उपनाम को root CLI कमांड के बजाय चैट स्लैश कमांड के रूप में चिह्नित करता है। |
| `cliCommand` | नहीं       | `string`          | CLI संचालन के लिए सुझाने योग्य संबंधित root CLI कमांड, अगर कोई मौजूद हो।  |

## activation संदर्भ

`activation` का उपयोग तब करें जब Plugin कम लागत में यह घोषित कर सकता हो कि किन नियंत्रण-प्लेन इवेंट्स
में उसे सक्रियण/लोड योजना में शामिल किया जाना चाहिए।

यह ब्लॉक प्लानर मेटाडेटा है, लाइफ़साइकल API नहीं। यह
रनटाइम व्यवहार पंजीकृत नहीं करता, `register(...)` को प्रतिस्थापित नहीं करता, और यह वादा नहीं करता कि
Plugin कोड पहले ही निष्पादित हो चुका है। सक्रियण प्लानर मौजूदा मैनिफ़ेस्ट स्वामित्व
मेटाडेटा जैसे `providers`, `channels`, `commandAliases`, `setup.providers`,
`contracts.tools`, और हुक्स पर वापस जाने से पहले उम्मीदवार Plugins को सीमित करने के लिए इन फ़ील्ड्स का उपयोग करता है।

सबसे संकीर्ण मेटाडेटा को प्राथमिकता दें जो पहले से स्वामित्व का वर्णन करता हो। जब
`providers`, `channels`, `commandAliases`, सेटअप डिस्क्रिप्टर, या `contracts`
संबंध व्यक्त करते हों, तो उनका उपयोग करें। अतिरिक्त प्लानर
संकेतों के लिए `activation` का उपयोग करें जिन्हें उन स्वामित्व फ़ील्ड्स से निरूपित नहीं किया जा सकता।
`claude-cli`, `my-cli`, या `google-gemini-cli` जैसे CLI रनटाइम उपनामों के लिए शीर्ष-स्तरीय `cliBackends` का उपयोग करें; `activation.onAgentHarnesses` केवल उन
एम्बेडेड एजेंट हार्नेस आईडी के लिए है जिनके पास पहले से कोई स्वामित्व फ़ील्ड नहीं है।

यह ब्लॉक केवल मेटाडेटा है। यह रनटाइम व्यवहार पंजीकृत नहीं करता, और यह
`register(...)`, `setupEntry`, या अन्य रनटाइम/Plugin एंट्रीपॉइंट्स को प्रतिस्थापित नहीं करता।
वर्तमान उपभोक्ता व्यापक Plugin लोडिंग से पहले इसे सीमित करने वाले संकेत के रूप में उपयोग करते हैं, इसलिए
गैर-स्टार्टअप सक्रियण मेटाडेटा का न होना आम तौर पर केवल प्रदर्शन की लागत बनता है; जब तक
मैनिफ़ेस्ट स्वामित्व फॉलबैक अभी भी मौजूद हैं, इससे शुद्धता नहीं बदलनी चाहिए।

हर Plugin को `activation.onStartup` जानबूझकर सेट करना चाहिए। इसे `true`
केवल तब सेट करें जब Plugin को Gateway स्टार्टअप के दौरान चलना ही हो। इसे `false` तब सेट करें जब
Plugin स्टार्टअप पर निष्क्रिय हो और केवल संकीर्ण ट्रिगर्स से लोड होना चाहिए।
`onStartup` छोड़ देने से अब Plugin परोक्ष रूप से स्टार्टअप-लोड नहीं होता; स्टार्टअप, चैनल, कॉन्फ़िग, एजेंट-हार्नेस, मेमोरी, या
अन्य संकीर्ण सक्रियण ट्रिगर्स के लिए स्पष्ट सक्रियण मेटाडेटा का उपयोग करें।

```json
{
  "activation": {
    "onStartup": false,
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onConfigPaths": ["browser"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| फ़ील्ड              | आवश्यक | प्रकार                                                 | इसका अर्थ क्या है                                                                                                                                                                               |
| ------------------ | -------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | नहीं       | `boolean`                                            | स्पष्ट Gateway स्टार्टअप सक्रियण। हर Plugin को यह सेट करना चाहिए। `true` स्टार्टअप के दौरान Plugin आयात करता है; `false` इसे तब तक स्टार्टअप-लेज़ी रखता है जब तक कोई दूसरा मिलान वाला ट्रिगर लोडिंग की मांग न करे। |
| `onProviders`      | नहीं       | `string[]`                                           | प्रदाता आईडी जिन्हें इस Plugin को सक्रियण/लोड योजनाओं में शामिल करना चाहिए।                                                                                                                      |
| `onAgentHarnesses` | नहीं       | `string[]`                                           | एम्बेडेड एजेंट हार्नेस रनटाइम आईडी जिन्हें इस Plugin को सक्रियण/लोड योजनाओं में शामिल करना चाहिए। CLI बैकएंड उपनामों के लिए शीर्ष-स्तरीय `cliBackends` का उपयोग करें।                                           |
| `onCommands`       | नहीं       | `string[]`                                           | कमांड आईडी जिन्हें इस Plugin को सक्रियण/लोड योजनाओं में शामिल करना चाहिए।                                                                                                                       |
| `onChannels`       | नहीं       | `string[]`                                           | चैनल आईडी जिन्हें इस Plugin को सक्रियण/लोड योजनाओं में शामिल करना चाहिए।                                                                                                                       |
| `onRoutes`         | नहीं       | `string[]`                                           | रूट प्रकार जिन्हें इस Plugin को सक्रियण/लोड योजनाओं में शामिल करना चाहिए।                                                                                                                       |
| `onConfigPaths`    | नहीं       | `string[]`                                           | root-सापेक्ष कॉन्फ़िग पथ जिन्हें पथ मौजूद होने और स्पष्ट रूप से अक्षम न होने पर इस Plugin को स्टार्टअप/लोड योजनाओं में शामिल करना चाहिए।                                                      |
| `onCapabilities`   | नहीं       | `Array<"provider" \| "channel" \| "tool" \| "hook">` | नियंत्रण-प्लेन सक्रियण योजना द्वारा उपयोग किए जाने वाले व्यापक क्षमता संकेत। संभव होने पर संकीर्ण फ़ील्ड्स को प्राथमिकता दें।                                                                                     |

वर्तमान लाइव उपभोक्ता:

- Gateway स्टार्टअप योजना स्पष्ट स्टार्टअप
  आयात के लिए `activation.onStartup` का उपयोग करती है
- कमांड-ट्रिगर वाली CLI योजना पुराने
  `commandAliases[].cliCommand` या `commandAliases[].name` पर वापस जाती है
- एजेंट-रनटाइम स्टार्टअप योजना
  एम्बेडेड हार्नेस के लिए `activation.onAgentHarnesses` और CLI रनटाइम उपनामों के लिए शीर्ष-स्तरीय `cliBackends[]` का उपयोग करती है
- चैनल-ट्रिगर सेटअप/चैनल योजना स्पष्ट चैनल सक्रियण मेटाडेटा न होने पर पुराने `channels[]`
  स्वामित्व पर वापस जाती है
- स्टार्टअप Plugin योजना bundled ब्राउज़र Plugin के `browser` ब्लॉक जैसी गैर-चैनल root
  कॉन्फ़िग सतहों के लिए `activation.onConfigPaths` का उपयोग करती है
- प्रदाता-ट्रिगर सेटअप/रनटाइम योजना स्पष्ट प्रदाता
  सक्रियण मेटाडेटा न होने पर पुराने `providers[]` और शीर्ष-स्तरीय `cliBackends[]` स्वामित्व पर वापस जाती है

प्लानर निदान स्पष्ट सक्रियण संकेतों को मैनिफ़ेस्ट
स्वामित्व फॉलबैक से अलग कर सकते हैं। उदाहरण के लिए, `activation-command-hint` का अर्थ है कि
`activation.onCommands` मिला, जबकि `manifest-command-alias` का अर्थ है कि
प्लानर ने इसके बजाय `commandAliases` स्वामित्व का उपयोग किया। ये कारण लेबल
होस्ट निदान और परीक्षणों के लिए हैं; Plugin लेखकों को वह मेटाडेटा घोषित करते रहना चाहिए
जो स्वामित्व का सबसे अच्छा वर्णन करता है।

## qaRunners संदर्भ

`qaRunners` का उपयोग तब करें जब कोई Plugin साझा
`openclaw qa` root के नीचे एक या अधिक ट्रांसपोर्ट रनर योगदान करता हो। इस मेटाडेटा को सस्ता और स्थिर रखें; Plugin
रनटाइम अभी भी हल्के
`runtime-api.ts` सतह के माध्यम से वास्तविक CLI पंजीकरण का स्वामी है जो `qaRunnerCliRegistrations` निर्यात करती है।

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Run the Docker-backed Matrix live QA lane against a disposable homeserver"
    }
  ]
}
```

| फ़ील्ड        | आवश्यक | प्रकार   | इसका अर्थ                                                        |
| ------------- | -------- | -------- | ------------------------------------------------------------------ |
| `commandName` | हाँ      | `string` | `openclaw qa` के नीचे माउंट किया गया उपकमांड, उदाहरण के लिए `matrix`। |
| `description` | नहीं     | `string` | साझा होस्ट को स्टब कमांड की आवश्यकता होने पर उपयोग किया जाने वाला फ़ॉलबैक सहायता पाठ। |

## setup संदर्भ

जब सेटअप और ऑनबोर्डिंग सतहों को रनटाइम लोड होने से पहले सस्ते Plugin-स्वामित्व वाले मेटाडेटा की आवश्यकता हो, तब `setup` का उपयोग करें।

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"],
        "authEvidence": [
          {
            "type": "local-file-with-env",
            "fileEnvVar": "OPENAI_CREDENTIALS_FILE",
            "requiresAllEnv": ["OPENAI_PROJECT"],
            "credentialMarker": "openai-local-credentials",
            "source": "openai local credentials"
          }
        ]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

शीर्ष-स्तरीय `cliBackends` वैध रहता है और CLI अनुमान
बैकएंड का वर्णन करना जारी रखता है। `setup.cliBackends` उन
कंट्रोल-प्लेन/setup फ़्लो के लिए सेटअप-विशिष्ट वर्णनकर्ता सतह है जिन्हें केवल-मेटाडेटा रहना चाहिए।

मौजूद होने पर, `setup.providers` और `setup.cliBackends` सेटअप खोज के लिए
पसंदीदा वर्णनकर्ता-प्रथम लुकअप सतह हैं। यदि वर्णनकर्ता केवल उम्मीदवार
Plugin को सीमित करता है और सेटअप को अभी भी अधिक समृद्ध सेटअप-समय रनटाइम
हुक की आवश्यकता है, तो `requiresRuntime: true` सेट करें और फ़ॉलबैक
निष्पादन पथ के रूप में `setup-api` को बनाए रखें।

OpenClaw सामान्य प्रदाता प्रमाणीकरण और पर्यावरण-चर लुकअप में
`setup.providers[].envVars` भी शामिल करता है। `providerAuthEnvVars` अवमूल्यन
विंडो के दौरान संगतता अडैप्टर के माध्यम से समर्थित रहता है, लेकिन जो गैर-बंडल Plugins अभी भी इसका उपयोग करते हैं
उन्हें मैनिफ़ेस्ट डायग्नोस्टिक मिलता है। नए Plugins को सेटअप/स्थिति पर्यावरण मेटाडेटा
`setup.providers[].envVars` पर रखना चाहिए।

जब कोई सेटअप प्रविष्टि उपलब्ध न हो, या जब `setup.requiresRuntime: false`
सेटअप रनटाइम को अनावश्यक घोषित करता हो, तब OpenClaw `setup.providers[].authMethods`
से सरल सेटअप विकल्प भी निकाल सकता है। स्पष्ट `providerAuthChoices` प्रविष्टियां
कस्टम लेबल, CLI फ़्लैग, ऑनबोर्डिंग स्कोप, और सहायक मेटाडेटा के लिए पसंदीदा रहती हैं।

`requiresRuntime: false` केवल तब सेट करें जब वे वर्णनकर्ता सेटअप सतह के लिए
पर्याप्त हों। OpenClaw स्पष्ट `false` को केवल-वर्णनकर्ता अनुबंध मानता है
और सेटअप लुकअप के लिए `setup-api` या `openclaw.setupEntry` निष्पादित नहीं करेगा। यदि
केवल-वर्णनकर्ता Plugin फिर भी उन सेटअप रनटाइम प्रविष्टियों में से एक भेजता है,
तो OpenClaw एक योगात्मक डायग्नोस्टिक रिपोर्ट करता है और उसे अनदेखा करना जारी रखता है। छोड़ा गया
`requiresRuntime` विरासत फ़ॉलबैक व्यवहार बनाए रखता है ताकि जिन मौजूदा Plugins ने
फ़्लैग के बिना वर्णनकर्ता जोड़े थे, वे टूटें नहीं।

क्योंकि सेटअप लुकअप Plugin-स्वामित्व वाला `setup-api` कोड निष्पादित कर सकता है, सामान्यीकृत
`setup.providers[].id` और `setup.cliBackends[]` मान खोजे गए Plugins में
अद्वितीय रहने चाहिए। अस्पष्ट स्वामित्व खोज क्रम से
विजेता चुनने के बजाय बंद होकर विफल होता है।

जब सेटअप रनटाइम निष्पादित होता है, सेटअप रजिस्ट्री डायग्नोस्टिक्स वर्णनकर्ता
बहाव रिपोर्ट करते हैं यदि `setup-api` कोई ऐसा प्रदाता या CLI बैकएंड पंजीकृत करता है जिसे मैनिफ़ेस्ट
वर्णनकर्ता घोषित नहीं करते, या यदि किसी वर्णनकर्ता का मेल खाता रनटाइम
पंजीकरण नहीं है। ये डायग्नोस्टिक्स योगात्मक हैं और विरासत Plugins को अस्वीकार नहीं करते।

### setup.providers संदर्भ

| फ़ील्ड         | आवश्यक | प्रकार     | इसका अर्थ                                                                                         |
| -------------- | -------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `id`           | हाँ      | `string`   | सेटअप या ऑनबोर्डिंग के दौरान उजागर किया गया प्रदाता id। सामान्यीकृत ids को वैश्विक रूप से अद्वितीय रखें। |
| `authMethods`  | नहीं     | `string[]` | वे सेटअप/प्रमाणीकरण विधि ids जिन्हें यह प्रदाता पूर्ण रनटाइम लोड किए बिना समर्थन करता है।              |
| `envVars`      | नहीं     | `string[]` | वे पर्यावरण चर जिन्हें सामान्य सेटअप/स्थिति सतहें Plugin रनटाइम लोड होने से पहले जांच सकती हैं।         |
| `authEvidence` | नहीं     | `object[]` | उन प्रदाताओं के लिए सस्ती स्थानीय प्रमाणीकरण साक्ष्य जांच जो गैर-गुप्त मार्कर से प्रमाणीकरण कर सकते हैं। |

`authEvidence` प्रदाता-स्वामित्व वाले स्थानीय क्रेडेंशियल मार्कर के लिए है जिन्हें
रनटाइम कोड लोड किए बिना सत्यापित किया जा सकता है। ये जांचें सस्ती और स्थानीय रहनी चाहिए:
कोई नेटवर्क कॉल नहीं, कोई कीचेन या सीक्रेट-मैनेजर रीड नहीं, कोई शेल कमांड नहीं, और कोई
प्रदाता API जांच नहीं।

समर्थित साक्ष्य प्रविष्टियां:

| फ़ील्ड             | आवश्यक | प्रकार     | इसका अर्थ                                                                                                  |
| ------------------ | -------- | ---------- | -------------------------------------------------------------------------------------------------------------- |
| `type`             | हाँ      | `string`   | वर्तमान में `local-file-with-env`।                                                                               |
| `fileEnvVar`       | नहीं     | `string`   | स्पष्ट क्रेडेंशियल फ़ाइल पथ रखने वाला पर्यावरण चर।                                                           |
| `fallbackPaths`    | नहीं     | `string[]` | जब `fileEnvVar` अनुपस्थित या खाली हो, तब जांचे जाने वाले स्थानीय क्रेडेंशियल फ़ाइल पथ। `${HOME}` और `${APPDATA}` समर्थित हैं। |
| `requiresAnyEnv`   | नहीं     | `string[]` | साक्ष्य वैध होने से पहले सूचीबद्ध पर्यावरण चरों में से कम से कम एक गैर-खाली होना चाहिए।                         |
| `requiresAllEnv`   | नहीं     | `string[]` | साक्ष्य वैध होने से पहले प्रत्येक सूचीबद्ध पर्यावरण चर गैर-खाली होना चाहिए।                                   |
| `credentialMarker` | हाँ      | `string`   | साक्ष्य मौजूद होने पर लौटाया जाने वाला गैर-गुप्त मार्कर।                                                       |
| `source`           | नहीं     | `string`   | प्रमाणीकरण/स्थिति आउटपुट के लिए उपयोगकर्ता-दर्शित स्रोत लेबल।                                                |

### setup फ़ील्ड

| फ़ील्ड             | आवश्यक | प्रकार     | इसका अर्थ                                                                                       |
| ------------------ | -------- | ---------- | --------------------------------------------------------------------------------------------------- |
| `providers`        | नहीं     | `object[]` | सेटअप और ऑनबोर्डिंग के दौरान उजागर किए गए प्रदाता सेटअप वर्णनकर्ता।                                  |
| `cliBackends`      | नहीं     | `string[]` | वर्णनकर्ता-प्रथम सेटअप लुकअप के लिए उपयोग किए गए सेटअप-समय बैकएंड ids। सामान्यीकृत ids को वैश्विक रूप से अद्वितीय रखें। |
| `configMigrations` | नहीं     | `string[]` | इस Plugin की सेटअप सतह के स्वामित्व वाले कॉन्फ़िग माइग्रेशन ids।                                      |
| `requiresRuntime`  | नहीं     | `boolean`  | क्या वर्णनकर्ता लुकअप के बाद सेटअप को अब भी `setup-api` निष्पादन की आवश्यकता है।                      |

## uiHints संदर्भ

`uiHints` कॉन्फ़िग फ़ील्ड नामों से छोटे रेंडरिंग संकेतों तक का मैप है।

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

प्रत्येक फ़ील्ड संकेत में ये शामिल हो सकते हैं:

| फ़ील्ड        | प्रकार     | इसका अर्थ                         |
| ------------- | ---------- | --------------------------------------- |
| `label`       | `string`   | उपयोगकर्ता-दर्शित फ़ील्ड लेबल।          |
| `help`        | `string`   | संक्षिप्त सहायक पाठ।                    |
| `tags`        | `string[]` | वैकल्पिक UI टैग।                        |
| `advanced`    | `boolean`  | फ़ील्ड को उन्नत के रूप में चिह्नित करता है। |
| `sensitive`   | `boolean`  | फ़ील्ड को गुप्त या संवेदनशील के रूप में चिह्नित करता है। |
| `placeholder` | `string`   | फ़ॉर्म इनपुट के लिए प्लेसहोल्डर पाठ।     |

## contracts संदर्भ

`contracts` का उपयोग केवल स्थिर क्षमता स्वामित्व मेटाडेटा के लिए करें जिसे OpenClaw
Plugin रनटाइम आयात किए बिना पढ़ सकता है।

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["openclaw", "codex"],
    "trustedToolPolicies": ["workflow-budget"],
    "externalAuthProviders": ["acme-ai"],
    "embeddingProviders": ["openai-compatible"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

प्रत्येक सूची वैकल्पिक है:

| फ़ील्ड                           | प्रकार     | इसका अर्थ                                                                                                                        |
| -------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server extension factory ids, वर्तमान में `codex-app-server`।                                                                |
| `agentToolResultMiddleware`      | `string[]` | Runtime ids जिनके लिए यह Plugin tool-result middleware पंजीकृत कर सकता है।                                                                     |
| `trustedToolPolicies`            | `string[]` | Plugin-स्थानीय विश्वसनीय pre-tool policy ids जिन्हें इंस्टॉल किया गया Plugin पंजीकृत कर सकता है। बंडल किए गए Plugins इस फ़ील्ड के बिना policies पंजीकृत कर सकते हैं। |
| `externalAuthProviders`          | `string[]` | Provider ids जिनके external auth profile hook का स्वामी यह Plugin है।                                                                      |
| `embeddingProviders`             | `string[]` | सामान्य embedding provider ids जिनका स्वामी यह Plugin पुन: प्रयोज्य vector embedding उपयोग, memory सहित, के लिए है।                                 |
| `speechProviders`                | `string[]` | Speech provider ids जिनका स्वामी यह Plugin है।                                                                                                |
| `realtimeTranscriptionProviders` | `string[]` | Realtime-transcription provider ids जिनका स्वामी यह Plugin है।                                                                                |
| `realtimeVoiceProviders`         | `string[]` | Realtime-voice provider ids जिनका स्वामी यह Plugin है।                                                                                        |
| `memoryEmbeddingProviders`       | `string[]` | Deprecated memory-विशिष्ट embedding provider ids जिनका स्वामी यह Plugin है।                                                                  |
| `mediaUnderstandingProviders`    | `string[]` | Media-understanding provider ids जिनका स्वामी यह Plugin है।                                                                                   |
| `transcriptSourceProviders`      | `string[]` | Transcript source provider ids जिनका स्वामी यह Plugin है।                                                                                     |
| `imageGenerationProviders`       | `string[]` | Image-generation provider ids जिनका स्वामी यह Plugin है।                                                                                      |
| `videoGenerationProviders`       | `string[]` | Video-generation provider ids जिनका स्वामी यह Plugin है।                                                                                      |
| `webFetchProviders`              | `string[]` | Web-fetch provider ids जिनका स्वामी यह Plugin है।                                                                                             |
| `webSearchProviders`             | `string[]` | Web-search provider ids जिनका स्वामी यह Plugin है।                                                                                            |
| `migrationProviders`             | `string[]` | `openclaw migrate` के लिए import provider ids जिनका स्वामी यह Plugin है।                                                                         |
| `gatewayMethodDispatch`          | `string[]` | प्रमाणित Plugin HTTP routes के लिए आरक्षित entitlement, जो Gateway methods को process के भीतर dispatch करते हैं।                                  |
| `tools`                          | `string[]` | Agent tool names जिनका स्वामी यह Plugin है।                                                                                                   |

`contracts.embeddedExtensionFactories` को बंडल किए गए Codex
केवल app-server extension factories के लिए बनाए रखा गया है। बंडल किए गए tool-result transforms को
इसके बजाय `contracts.agentToolResultMiddleware` घोषित करना चाहिए और
`api.registerAgentToolResultMiddleware(...)` के साथ पंजीकृत करना चाहिए। इंस्टॉल किए गए Plugins
उसी middleware seam का उपयोग केवल तभी कर सकते हैं जब उसे स्पष्ट रूप से सक्षम किया गया हो और केवल उन runtimes के लिए
जिन्हें वे `contracts.agentToolResultMiddleware` में घोषित करते हैं।

जिन इंस्टॉल किए गए Plugins को host-trusted pre-tool policy tier की आवश्यकता है, उन्हें
`contracts.trustedToolPolicies` में प्रत्येक पंजीकृत local id घोषित करनी होगी और स्पष्ट रूप से
सक्षम होना होगा। बंडल किए गए Plugins मौजूदा trusted-policy path बनाए रखते हैं, लेकिन इंस्टॉल किए गए
Plugins जिनके policy ids घोषित नहीं हैं, पंजीकरण से पहले अस्वीकार कर दिए जाते हैं। Policy ids
पंजीकरण करने वाले Plugin के scope में होते हैं, इसलिए दो Plugins दोनों
`workflow-budget` घोषित और पंजीकृत कर सकते हैं; एक ही Plugin उसी local id को
दो बार पंजीकृत नहीं कर सकता।

Runtime `api.registerTool(...)` registrations को `contracts.tools` से मेल खाना चाहिए।
Tool discovery इस सूची का उपयोग केवल उन Plugin runtimes को लोड करने के लिए करती है जो
अनुरोधित tools के स्वामी हो सकते हैं।

Provider Plugins जो `resolveExternalAuthProfiles` लागू करते हैं, उन्हें
`contracts.externalAuthProviders` घोषित करना चाहिए; अघोषित external-auth hooks अनदेखे किए जाते हैं।

सामान्य embedding providers को `api.registerEmbeddingProvider(...)` के साथ पंजीकृत
प्रत्येक adapter के लिए `contracts.embeddingProviders` घोषित करना चाहिए। पुन: प्रयोज्य
vector generation के लिए सामान्य contract का उपयोग करें, जिसमें memory search द्वारा उपयोग किए गए providers शामिल हैं।
`contracts.memoryEmbeddingProviders` deprecated memory-विशिष्ट compatibility है और
केवल तब तक बनी रहती है जब तक मौजूदा providers generic embedding provider seam पर migrate नहीं हो जाते।

`contracts.gatewayMethodDispatch` वर्तमान में
`"authenticated-request"` स्वीकार करता है। यह native Plugin HTTP
routes के लिए एक API hygiene gate है, जो जानबूझकर Gateway control-plane methods को process के भीतर
dispatch करते हैं; यह malicious native Plugins के विरुद्ध sandbox नहीं है। इसे केवल कड़ाई से समीक्षा किए गए
बंडल किए गए/operator surfaces के लिए उपयोग करें जिन्हें पहले से Gateway HTTP auth की आवश्यकता होती है।

## mediaUnderstandingProviderMetadata संदर्भ

`mediaUnderstandingProviderMetadata` का उपयोग तब करें जब किसी media-understanding provider के पास
default models, auto-auth fallback priority, या native document support हो जिसकी
generic core helpers को runtime loads से पहले आवश्यकता होती है। Keys को
`contracts.mediaUnderstandingProviders` में भी घोषित किया जाना चाहिए।

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

प्रत्येक provider entry में ये शामिल हो सकते हैं:

| फ़ील्ड                 | प्रकार                              | इसका अर्थ                                                               |
| ---------------------- | ----------------------------------- | ---------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | इस provider द्वारा उजागर की गई media capabilities।                                 |
| `defaultModels`        | `Record<string, string>`            | जब config कोई model निर्दिष्ट नहीं करता, तब उपयोग किए जाने वाले capability-to-model defaults।      |
| `autoPriority`         | `Record<string, number>`            | automatic credential-based provider fallback के लिए कम संख्याएं पहले sort होती हैं। |
| `nativeDocumentInputs` | `"pdf"[]`                           | provider द्वारा समर्थित native document inputs।                            |

## channelConfigs संदर्भ

`channelConfigs` का उपयोग तब करें जब किसी channel Plugin को runtime loads से पहले
सस्ती config metadata की आवश्यकता हो। Read-only channel setup/status discovery इस metadata का
सीधे उपयोग configured external channels के लिए कर सकती है जब कोई setup entry उपलब्ध न हो, या
जब `setup.requiresRuntime: false` setup runtime को अनावश्यक घोषित करता है।

`channelConfigs` Plugin manifest metadata है, कोई नया top-level user config
section नहीं। Users अभी भी channel instances को `channels.<channel-id>` के अंतर्गत configure करते हैं।
OpenClaw manifest metadata पढ़ता है ताकि तय कर सके कि Plugin runtime code execute होने से पहले
उस configured channel का स्वामी कौन सा Plugin है।

किसी channel Plugin के लिए, `configSchema` और `channelConfigs` अलग
paths का वर्णन करते हैं:

- `configSchema` `plugins.entries.<plugin-id>.config` को validate करता है
- `channelConfigs.<channel-id>.schema` `channels.<channel-id>` को validate करता है

Non-bundled Plugins जो `channels[]` घोषित करते हैं, उन्हें matching
`channelConfigs` entries भी घोषित करनी चाहिए। इनके बिना, OpenClaw अभी भी Plugin load कर सकता है, लेकिन
cold-path config schema, setup, और Control UI surfaces Plugin runtime execute होने तक
channel-owned option shape नहीं जान सकते।

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` और
`nativeSkillsAutoEnabled` command config checks के लिए static `auto` defaults घोषित कर सकते हैं
जो channel runtime loads से पहले चलते हैं। बंडल किए गए channels भी
अपने अन्य package-owned channel catalog metadata के साथ
`package.json#openclaw.channel.commands` के माध्यम से वही defaults publish कर सकते हैं।

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix homeserver connection",
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

प्रत्येक channel entry में ये शामिल हो सकते हैं:

| फ़ील्ड        | प्रकार                   | इसका अर्थ                                                                            |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` के लिए JSON Schema। प्रत्येक घोषित channel config entry के लिए आवश्यक।         |
| `uiHints`     | `Record<string, object>` | उस channel config section के लिए वैकल्पिक UI labels/placeholders/sensitive hints।          |
| `label`       | `string`                 | जब runtime metadata तैयार नहीं होता, तब picker और inspect surfaces में merge किया गया channel label। |
| `description` | `string`                 | inspect और catalog surfaces के लिए संक्षिप्त channel description।                               |
| `commands`    | `object`                 | pre-runtime config checks के लिए static native command और native skill auto-defaults।       |
| `preferOver`  | `string[]`               | Legacy या lower-priority Plugin ids जिन्हें इस channel को selection surfaces में पीछे रखना चाहिए।    |

### किसी अन्य channel Plugin को बदलना

`preferOver` का उपयोग तब करें जब आपका Plugin किसी channel id के लिए preferred owner हो
जिसे कोई दूसरा Plugin भी provide कर सकता है। सामान्य cases हैं renamed Plugin id,
standalone Plugin जो किसी bundled Plugin को supersede करता है, या maintained fork जो
config compatibility के लिए वही channel id रखता है।

```json
{
  "id": "acme-chat",
  "channels": ["chat"],
  "channelConfigs": {
    "chat": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "webhookUrl": { "type": "string" }
        }
      },
      "preferOver": ["chat"]
    }
  }
}
```

जब `channels.chat` configured होता है, OpenClaw channel id और
preferred Plugin id दोनों पर विचार करता है। यदि lower-priority Plugin केवल इसलिए selected था क्योंकि
वह bundled है या default रूप से enabled है, तो OpenClaw उसे effective
runtime config में disabled कर देता है ताकि एक Plugin channel और उसके tools का स्वामी हो। Explicit user
selection अभी भी जीतता है: यदि user दोनों Plugins को स्पष्ट रूप से enable करता है, तो OpenClaw
उस choice को preserve करता है और requested Plugin set को silently बदलने के बजाय
duplicate channel/tool diagnostics report करता है।

`preferOver` को उन Plugin ids तक scoped रखें जो सच में वही channel provide कर सकते हैं।
यह कोई general priority field नहीं है और यह user config keys को rename नहीं करता।

## modelSupport संदर्भ

जब OpenClaw को plugin runtime लोड होने से पहले `gpt-5.5` या `claude-sonnet-4.6` जैसे
शॉर्टहैंड मॉडल id से आपके provider plugin का अनुमान लगाना हो, तब `modelSupport`
का उपयोग करें।

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw यह प्राथमिकता लागू करता है:

- स्पष्ट `provider/model` refs मालिकाना `providers` manifest metadata का उपयोग करते हैं
- `modelPatterns`, `modelPrefixes` से पहले लागू होते हैं
- अगर एक non-bundled plugin और एक bundled plugin, दोनों मेल खाते हैं, तो non-bundled
  plugin जीतता है
- बाकी अस्पष्टता को तब तक अनदेखा किया जाता है जब तक user या config कोई provider निर्दिष्ट नहीं करता

फ़ील्ड:

| फ़ील्ड           | प्रकार       | इसका अर्थ                                                                   |
| --------------- | ---------- | ------------------------------------------------------------------------------- |
| `modelPrefixes` | `string[]` | शॉर्टहैंड मॉडल ids के विरुद्ध `startsWith` से मिलाए जाने वाले prefix.                 |
| `modelPatterns` | `string[]` | profile suffix removal के बाद शॉर्टहैंड मॉडल ids के विरुद्ध मिलाए जाने वाले regex sources. |

`modelPatterns` entries को `compileSafeRegex` के माध्यम से compile किया जाता है, जो
nested repetition वाले patterns को अस्वीकार करता है (उदाहरण के लिए `(a+)+$`)। safety
check में असफल होने वाले patterns को चुपचाप छोड़ दिया जाता है, ठीक वैसे ही जैसे syntactically invalid regex।
patterns को सरल रखें और nested quantifiers से बचें।

## modelCatalog reference

जब OpenClaw को plugin runtime लोड करने से पहले provider model metadata जानना हो, तब
`modelCatalog` का उपयोग करें। यह fixed catalog rows, provider aliases, suppression rules,
और discovery mode के लिए manifest-owned source है। Runtime refresh अभी भी provider runtime
code में रहता है, लेकिन manifest core को बताता है कि runtime कब आवश्यक है।

```json
{
  "providers": ["openai"],
  "modelCatalog": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input": ["text", "image"],
            "reasoning": true,
            "contextWindow": 256000,
            "maxTokens": 128000,
            "cost": {
              "input": 1.25,
              "output": 10,
              "cacheRead": 0.125
            },
            "status": "available",
            "tags": ["default"]
          }
        ]
      }
    },
    "aliases": {
      "azure-openai-responses": {
        "provider": "openai",
        "api": "azure-openai-responses"
      }
    },
    "suppressions": [
      {
        "provider": "azure-openai-responses",
        "model": "gpt-5.3-codex-spark",
        "reason": "not available on Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

शीर्ष-स्तरीय फ़ील्ड:

| फ़ील्ड            | प्रकार                                                     | इसका अर्थ                                                                                               |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | इस plugin के स्वामित्व वाले provider ids के लिए catalog rows. keys शीर्ष-स्तरीय `providers` में भी दिखाई देनी चाहिए।       |
| `aliases`        | `Record<string, object>`                                 | Provider aliases जिन्हें catalog या suppression planning के लिए किसी owned provider में resolve होना चाहिए।              |
| `suppressions`   | `object[]`                                               | किसी दूसरे source से model rows जिन्हें यह plugin provider-specific कारण से suppress करता है।                  |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | क्या provider catalog को manifest metadata से पढ़ा जा सकता है, cache में refresh किया जा सकता है, या runtime की आवश्यकता है। |
| `runtimeAugment` | `boolean`                                                | केवल तब `true` पर set करें जब provider runtime को manifest/config planning के बाद catalog rows append करनी हों।       |

`aliases` model-catalog planning के लिए provider ownership lookup में भाग लेता है।
Alias targets उसी plugin के स्वामित्व वाले शीर्ष-स्तरीय providers होने चाहिए। जब कोई
provider-filtered list alias का उपयोग करती है, तो OpenClaw owning manifest पढ़ सकता है और
provider runtime लोड किए बिना alias API/base URL overrides लागू कर सकता है।
Aliases unfiltered catalog listings को expand नहीं करते; broad lists केवल owning
canonical provider rows emit करते हैं।

`suppressions` पुराने provider runtime `suppressBuiltInModel` hook को प्रतिस्थापित करता है।
Suppression entries को केवल तब माना जाता है जब provider plugin के स्वामित्व में हो या
`modelCatalog.aliases` key के रूप में घोषित हो जो किसी owned provider को target करती है। Runtime
suppression hooks को अब model resolution के दौरान call नहीं किया जाता।

Provider फ़ील्ड:

| फ़ील्ड     | प्रकार                     | इसका अर्थ                                                     |
| --------- | ------------------------ | ----------------------------------------------------------------- |
| `baseUrl` | `string`                 | इस provider catalog में models के लिए optional default base URL.    |
| `api`     | `ModelApi`               | इस provider catalog में models के लिए optional default API adapter. |
| `headers` | `Record<string, string>` | optional static headers जो इस provider catalog पर लागू होते हैं।      |
| `models`  | `object[]`               | आवश्यक model rows. `id` के बिना rows को ignored किया जाता है।            |

Model फ़ील्ड:

| फ़ील्ड           | प्रकार                                                           | इसका अर्थ                                                               |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Provider-local model id, `provider/` prefix के बिना।                    |
| `name`          | `string`                                                       | optional display name.                                                      |
| `api`           | `ModelApi`                                                     | optional per-model API override.                                            |
| `baseUrl`       | `string`                                                       | optional per-model base URL override.                                       |
| `headers`       | `Record<string, string>`                                       | optional per-model static headers.                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | model जिन modalities को स्वीकार करता है।                                               |
| `reasoning`     | `boolean`                                                      | क्या model reasoning behavior expose करता है।                               |
| `contextWindow` | `number`                                                       | native provider context window.                                             |
| `contextTokens` | `number`                                                       | optional effective runtime context cap, जब यह `contextWindow` से अलग हो। |
| `maxTokens`     | `number`                                                       | ज्ञात होने पर maximum output tokens.                                           |
| `cost`          | `object`                                                       | optional USD per million token pricing, जिसमें optional `tieredPricing` शामिल है। |
| `compat`        | `object`                                                       | OpenClaw model config compatibility से मेल खाने वाले optional compatibility flags.  |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | listing status. केवल तभी suppress करें जब row बिल्कुल दिखाई नहीं देनी चाहिए।          |
| `statusReason`  | `string`                                                       | non-available status के साथ दिखाया जाने वाला optional reason.                            |
| `replaces`      | `string[]`                                                     | पुराने provider-local model ids जिन्हें यह model supersede करता है।                       |
| `replacedBy`    | `string`                                                       | deprecated rows के लिए replacement provider-local model id.                    |
| `tags`          | `string[]`                                                     | pickers और filters द्वारा उपयोग किए जाने वाले stable tags.                                    |

Suppression फ़ील्ड:

| फ़ील्ड                      | प्रकार       | इसका अर्थ                                                                                             |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | suppress करने के लिए upstream row का provider id. यह इस plugin के स्वामित्व में होना चाहिए या owned alias के रूप में घोषित होना चाहिए। |
| `model`                    | `string`   | suppress करने के लिए provider-local model id.                                                                      |
| `reason`                   | `string`   | suppressed row को सीधे request किए जाने पर दिखाया जाने वाला optional message.                                     |
| `when.baseUrlHosts`        | `string[]` | suppression लागू होने से पहले आवश्यक effective provider base URL hosts की optional list.               |
| `when.providerConfigApiIn` | `string[]` | suppression लागू होने से पहले आवश्यक exact provider-config `api` values की optional list.              |

`modelCatalog` में runtime-only data न डालें। `static` का उपयोग केवल तब करें जब manifest
rows provider-filtered list और picker surfaces के लिए registry/runtime discovery छोड़ने हेतु
काफ़ी पूर्ण हों। `refreshable` का उपयोग तब करें जब manifest rows उपयोगी
listable seeds या supplements हों, लेकिन refresh/cache बाद में और rows जोड़ सके;
refreshable rows अपने आप में authoritative नहीं होते। `runtime` का उपयोग तब करें जब OpenClaw
को list जानने के लिए provider runtime लोड करना ही हो।

## modelIdNormalization reference

`modelIdNormalization` का उपयोग cheap provider-owned model-id cleanup के लिए करें जिसे
provider runtime लोड होने से पहले होना चाहिए। यह short model names, provider-local legacy ids,
और proxy prefix rules जैसे aliases को core model-selection tables के बजाय owning plugin
manifest में रखता है।

```json
{
  "providers": ["anthropic", "openrouter"],
  "modelIdNormalization": {
    "providers": {
      "anthropic": {
        "aliases": {
          "sonnet-4.6": "claude-sonnet-4-6"
        }
      },
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  }
}
```

Provider फ़ील्ड:

| फ़ील्ड                                | प्रकार                    | इसका अर्थ                                                                             |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | case-insensitive exact model-id aliases. values जैसे लिखे हैं वैसे ही लौटाए जाते हैं।                  |
| `stripPrefixes`                      | `string[]`              | alias lookup से पहले हटाए जाने वाले prefixes, legacy provider/model duplication के लिए उपयोगी।     |
| `prefixWhenBare`                     | `string`                | जब normalized model id में पहले से `/` न हो, तब जोड़ने वाला prefix.                  |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | alias lookup के बाद conditional bare-id prefix rules, `modelPrefix` और `prefix` द्वारा keyed. |

## providerEndpoints reference

generic request policy को provider runtime लोड होने से पहले जिस endpoint classification को जानना
हो, उसके लिए `providerEndpoints` का उपयोग करें। Core अभी भी प्रत्येक `endpointClass` का अर्थ own करता है;
plugin manifests host और base URL metadata own करते हैं।

एंडपॉइंट फ़ील्ड:

| फ़ील्ड                         | प्रकार     | इसका अर्थ                                                                                  |
| ------------------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `endpointClass`                | `string`   | ज्ञात कोर एंडपॉइंट वर्ग, जैसे `openrouter`, `moonshot-native`, या `google-vertex`।        |
| `hosts`                        | `string[]` | वे सटीक होस्टनाम जो एंडपॉइंट वर्ग से मैप होते हैं।                                                |
| `hostSuffixes`                 | `string[]` | वे होस्ट प्रत्यय जो एंडपॉइंट वर्ग से मैप होते हैं। केवल डोमेन-प्रत्यय मिलान के लिए `.` उपसर्ग लगाएँ। |
| `baseUrls`                     | `string[]` | वे सटीक सामान्यीकृत HTTP(S) आधार URL जो एंडपॉइंट वर्ग से मैप होते हैं।                             |
| `googleVertexRegion`           | `string`   | सटीक वैश्विक होस्ट के लिए स्थिर Google Vertex क्षेत्र।                                            |
| `googleVertexRegionHostSuffix` | `string`   | मिलान करने वाले होस्ट से हटाया जाने वाला प्रत्यय, ताकि Google Vertex क्षेत्र उपसर्ग उजागर हो सके।                 |

## `providerRequest` संदर्भ

सस्ते अनुरोध-संगतता मेटाडेटा के लिए `providerRequest` का उपयोग करें, जिसकी सामान्य
अनुरोध नीति को provider runtime लोड किए बिना आवश्यकता होती है। व्यवहार-विशिष्ट
payload rewriting को provider runtime hooks या साझा provider-family helpers में रखें।

```json
{
  "providers": ["vllm"],
  "providerRequest": {
    "providers": {
      "vllm": {
        "family": "vllm",
        "openAICompletions": {
          "supportsStreamingUsage": true
        }
      }
    }
  }
}
```

Provider फ़ील्ड:

| फ़ील्ड                | प्रकार       | इसका अर्थ                                                                          |
| --------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `family`              | `string`     | सामान्य अनुरोध-संगतता निर्णयों और निदान में उपयोग किया जाने वाला provider family लेबल। |
| `compatibilityFamily` | `"moonshot"` | साझा अनुरोध helpers के लिए वैकल्पिक provider-family संगतता bucket।              |
| `openAICompletions`   | `object`     | OpenAI-संगत completions अनुरोध flags, वर्तमान में `supportsStreamingUsage`।       |

## `secretProviderIntegrations` संदर्भ

जब कोई plugin पुन: उपयोग योग्य SecretRef exec provider preset प्रकाशित कर सकता है, तब
`secretProviderIntegrations` का उपयोग करें। OpenClaw plugin runtime लोड होने से पहले
यह मेटाडेटा पढ़ता है, `secrets.providers.<alias>.pluginIntegration` में plugin ownership
संग्रहीत करता है, और वास्तविक secret resolution को SecretRef runtime पर छोड़ता है।
Presets केवल bundled plugins और managed plugin install roots से खोजे गए installed plugins
के लिए उजागर होते हैं, जैसे git और ClawHub installs।

```json
{
  "secretProviderIntegrations": {
    "secret-store": {
      "providerAlias": "team-secrets",
      "displayName": "Team secrets",
      "source": "exec",
      "command": "${node}",
      "args": ["./bin/resolve-secrets.mjs"]
    }
  }
}
```

map key integration id है। यदि `providerAlias` छोड़ दिया गया है, तो OpenClaw
integration id को SecretRef provider alias के रूप में उपयोग करता है। Provider aliases को
सामान्य SecretRef provider alias pattern से मेल खाना चाहिए, उदाहरण के लिए `team-secrets` या
`onepassword-work`।

जब कोई operator preset चुनता है, तो OpenClaw इस तरह provider reference लिखता है:

```json
{
  "secrets": {
    "providers": {
      "team-secrets": {
        "source": "exec",
        "pluginIntegration": {
          "pluginId": "acme-secrets",
          "integrationId": "secret-store"
        }
      }
    }
  }
}
```

startup/reload पर, OpenClaw वर्तमान plugin manifest metadata लोड करके, owning plugin
installed और active है यह जाँचकर, और manifest से exec command materialize करके उस
provider को resolve करता है। plugin को disable या remove करने से active SecretRefs के लिए
provider revoked हो जाता है। जो operators standalone exec configuration चाहते हैं, वे अभी भी
manual `command`/`args` providers सीधे लिख सकते हैं।

वर्तमान में केवल `source: "exec"` presets समर्थित हैं। `command` को
`${node}` होना चाहिए, और `args[0]` को `./` plugin-root-relative resolver script होना चाहिए।
OpenClaw इसे startup/reload पर वर्तमान Node executable और absolute in-plugin script path
में materialize करता है। Node options जैसे `--require`, `--import`,
`--loader`, `--env-file`, `--eval`, और `--print` manifest
preset contract का हिस्सा नहीं हैं। जिन operators को non-Node commands चाहिए, वे standalone
manual exec providers सीधे configure कर सकते हैं।

OpenClaw manifest presets के लिए `trustedDirs` को plugin root से और,
`${node}` presets के लिए, वर्तमान Node executable directory से derive करता है। Manifest-authored
`trustedDirs` अनदेखे किए जाते हैं। अन्य exec provider options जैसे `timeoutMs`,
`maxOutputBytes`, `jsonOnly`, `env`, `passEnv`, और `allowInsecurePath` सामान्य
SecretRef exec provider config तक pass through होते हैं।

## `modelPricing` संदर्भ

जब किसी provider को runtime load होने से पहले control-plane pricing behavior की आवश्यकता हो,
तब `modelPricing` का उपयोग करें। Gateway pricing cache provider runtime code import किए बिना
यह metadata पढ़ता है।

```json
{
  "providers": ["ollama", "openrouter"],
  "modelPricing": {
    "providers": {
      "ollama": {
        "external": false
      },
      "openrouter": {
        "openRouter": {
          "passthroughProviderModel": true
        },
        "liteLLM": false
      }
    }
  }
}
```

Provider फ़ील्ड:

| फ़ील्ड       | प्रकार            | इसका अर्थ                                                                                      |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `external`   | `boolean`         | local/self-hosted providers के लिए `false` सेट करें, जिन्हें कभी OpenRouter या LiteLLM pricing fetch नहीं करनी चाहिए। |
| `openRouter` | `false \| object` | OpenRouter pricing lookup mapping। `false` इस provider के लिए OpenRouter lookup disable करता है।           |
| `liteLLM`    | `false \| object` | LiteLLM pricing lookup mapping। `false` इस provider के लिए LiteLLM lookup disable करता है।                 |

Source फ़ील्ड:

| फ़ील्ड                     | प्रकार              | इसका अर्थ                                                                                                        |
| -------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | External catalog provider id, जब यह OpenClaw provider id से अलग हो, उदाहरण के लिए `zai` provider के लिए `z-ai`। |
| `passthroughProviderModel` | `boolean`          | slash-containing model ids को nested provider/model refs की तरह मानें, जो OpenRouter जैसे proxy providers के लिए उपयोगी है।       |
| `modelIdTransforms`        | `"version-dots"[]` | अतिरिक्त external catalog model-id variants। `version-dots` `claude-opus-4.6` जैसे dotted version ids आज़माता है।            |

### OpenClaw Provider Index

OpenClaw Provider Index उन providers के लिए OpenClaw-owned preview metadata है
जिनके plugins अभी installed नहीं हो सकते। यह plugin manifest का हिस्सा नहीं है।
Plugin manifests installed-plugin authority बने रहते हैं। Provider Index वह
internal fallback contract है जिसका उपयोग भविष्य के installable-provider और pre-install
model picker surfaces तब करेंगे जब कोई provider plugin installed नहीं होगा।

Catalog authority order:

1. User config।
2. Installed plugin manifest `modelCatalog`।
3. Explicit refresh से model catalog cache।
4. OpenClaw Provider Index preview rows।

Provider Index में secrets, enabled state, runtime hooks, या
live account-specific model data नहीं होना चाहिए। इसके preview catalogs वही
`modelCatalog` provider row shape उपयोग करते हैं जो plugin manifests करते हैं, लेकिन इन्हें stable display metadata तक सीमित रहना चाहिए, जब तक runtime adapter fields जैसे `api`,
`baseUrl`, pricing, या compatibility flags को जानबूझकर installed plugin manifest के साथ aligned न रखा गया हो। Live `/models` discovery वाले providers को सामान्य listing या onboarding के दौरान provider APIs call करने के बजाय explicit model catalog cache path के जरिए refreshed rows लिखनी चाहिए।

Provider Index entries उन providers के लिए installable-plugin metadata भी रख सकती हैं
जिनका plugin core से बाहर चला गया है या अन्यथा अभी installed नहीं है। यह
metadata channel catalog pattern को mirror करता है: package name, npm install spec,
expected integrity, और cheap auth-choice labels किसी installable setup option को दिखाने के लिए पर्याप्त हैं। Plugin installed हो जाने पर, उसका manifest जीतता है और
उस provider के लिए Provider Index entry अनदेखी की जाती है।

Legacy top-level capability keys deprecated हैं। `speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`,
`webFetchProviders`, और `webSearchProviders` को `contracts` के अंतर्गत ले जाने के लिए
`openclaw doctor --fix` का उपयोग करें; सामान्य manifest loading अब उन top-level fields को capability
ownership के रूप में नहीं मानती।

## Manifest बनाम package.json

दोनों files अलग-अलग काम करती हैं:

| File                   | इसका उपयोग करें                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | Discovery, config validation, auth-choice metadata, और UI hints जो plugin code चलने से पहले मौजूद होने चाहिए                         |
| `package.json`         | npm metadata, dependency installation, और entrypoints, install gating, setup, या catalog metadata के लिए उपयोग किया गया `openclaw` block |

यदि आप निश्चित नहीं हैं कि metadata का कोई हिस्सा कहाँ होना चाहिए, तो यह नियम उपयोग करें:

- यदि OpenClaw को plugin code load करने से पहले इसे जानना आवश्यक है, तो इसे `openclaw.plugin.json` में रखें
- यदि यह packaging, entry files, या npm install behavior के बारे में है, तो इसे `package.json` में रखें

### package.json fields जो discovery को प्रभावित करते हैं

कुछ pre-runtime plugin metadata जानबूझकर `openclaw.plugin.json` के बजाय
`package.json` में `openclaw` block के अंतर्गत रहता है।
`openclaw.bundle` और `openclaw.bundle.json` OpenClaw plugin contracts नहीं हैं;
native plugins को `openclaw.plugin.json` और नीचे दिए गए समर्थित
`package.json#openclaw` fields का उपयोग करना चाहिए।

महत्वपूर्ण उदाहरण:

| फ़ील्ड                                                                                      | इसका अर्थ                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | नेटिव Plugin एंट्रीपॉइंट घोषित करता है। Plugin पैकेज डायरेक्टरी के अंदर ही रहना चाहिए।                                                                                                   |
| `openclaw.runtimeExtensions`                                                               | इंस्टॉल किए गए पैकेजों के लिए बिल्ट JavaScript runtime एंट्रीपॉइंट घोषित करता है। Plugin पैकेज डायरेक्टरी के अंदर ही रहना चाहिए।                                                                 |
| `openclaw.setupEntry`                                                                      | onboarding, स्थगित channel startup, और read-only channel status/SecretRef discovery के दौरान उपयोग किया जाने वाला हल्का setup-only एंट्रीपॉइंट। Plugin पैकेज डायरेक्टरी के अंदर ही रहना चाहिए। |
| `openclaw.runtimeSetupEntry`                                                               | इंस्टॉल किए गए पैकेजों के लिए बिल्ट JavaScript setup एंट्रीपॉइंट घोषित करता है। `setupEntry` आवश्यक है, मौजूद होना चाहिए, और Plugin पैकेज डायरेक्टरी के अंदर ही रहना चाहिए।                         |
| `openclaw.channel`                                                                         | labels, docs paths, aliases, और selection copy जैसे सस्ते channel catalog metadata।                                                                                                 |
| `openclaw.channel.commands`                                                                | channel runtime लोड होने से पहले config, audit, और command-list surfaces द्वारा उपयोग किया जाने वाला static native command और native skill auto-default metadata।                                          |
| `openclaw.channel.configuredState`                                                         | हल्का configured-state checker metadata जो पूरा channel runtime लोड किए बिना "क्या env-only setup पहले से मौजूद है?" का उत्तर दे सकता है।                                         |
| `openclaw.channel.persistedAuthState`                                                      | हल्का persisted-auth checker metadata जो पूरा channel runtime लोड किए बिना "क्या कुछ पहले से signed in है?" का उत्तर दे सकता है।                                               |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | bundled और externally published Plugins के लिए install/update संकेत।                                                                                                                   |
| `openclaw.install.defaultChoice`                                                           | जब कई install sources उपलब्ध हों, तब पसंदीदा install path।                                                                                                                  |
| `openclaw.install.minHostVersion`                                                          | न्यूनतम समर्थित OpenClaw host version, `>=2026.3.22` या `>=2026.5.1-beta.1` जैसे semver floor का उपयोग करते हुए।                                                                             |
| `openclaw.compat.pluginApi`                                                                | इस पैकेज के लिए आवश्यक न्यूनतम OpenClaw plugin API range, `>=2026.5.27` जैसे semver floor का उपयोग करते हुए।                                                                                 |
| `openclaw.install.expectedIntegrity`                                                       | अपेक्षित npm dist integrity string जैसे `sha512-...`; install और update flows fetched artifact को इसके विरुद्ध verify करते हैं।                                                            |
| `openclaw.install.allowInvalidConfigRecovery`                                              | config अमान्य होने पर एक संकीर्ण bundled-plugin reinstall recovery path की अनुमति देता है।                                                                                                       |
| `openclaw.install.requiredPlatformPackages`                                                | npm package aliases जिन्हें तब materialize होना चाहिए जब उनके lockfile platform constraints मौजूदा host से मेल खाते हों।                                                                           |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | setup-runtime channel surfaces को listen से पहले लोड होने देता है, फिर पूरे configured channel Plugin को post-listen activation तक defer करता है।                                                 |

Manifest metadata तय करता है कि runtime लोड होने से पहले onboarding में कौन-से provider/channel/setup विकल्प दिखते हैं। `package.json#openclaw.install` onboarding को बताता है कि जब user उन विकल्पों में से एक चुनता है तो उस Plugin को कैसे fetch या enable करना है। install hints को `openclaw.plugin.json` में न ले जाएं।

`openclaw.install.minHostVersion` non-bundled Plugin sources के लिए install और manifest registry loading के दौरान enforce किया जाता है। अमान्य values reject की जाती हैं; newer-but-valid values पुराने hosts पर external Plugins को skip करती हैं। Bundled source Plugins को host checkout के साथ co-versioned माना जाता है।

`openclaw.install.requiredPlatformPackages` उन npm packages के लिए है जो optional, platform-specific aliases के माध्यम से आवश्यक native binaries expose करते हैं। हर supported platform alias के लिए bare npm package name list करें। npm install के दौरान, OpenClaw केवल उस declared alias को verify करता है जिसके lockfile constraints मौजूदा host से मेल खाते हैं। यदि npm success report करता है लेकिन वह alias omit करता है, तो OpenClaw fresh cache के साथ एक बार retry करता है और alias फिर भी missing हो तो install को roll back करता है।

`openclaw.compat.pluginApi` non-bundled Plugin sources के लिए package install के दौरान enforce किया जाता है। इसे उस OpenClaw plugin SDK/runtime API floor के लिए उपयोग करें जिसके विरुद्ध package बनाया गया था। यह `minHostVersion` से stricter हो सकता है जब किसी Plugin package को newer API चाहिए लेकिन दूसरे flows के लिए lower install hint रखा जाता है। Official OpenClaw release sync default रूप से existing official Plugin API floors को OpenClaw release version तक bump करता है, लेकिन plugin-only releases lower floor रख सकते हैं जब package जानबूझकर older hosts को support करता हो। compatibility contract के रूप में केवल package version का उपयोग न करें। `peerDependencies.openclaw` npm package metadata बना रहता है; OpenClaw install compatibility decisions के लिए `openclaw.compat.pluginApi` contract का उपयोग करता है।

Official install-on-demand metadata को `clawhubSpec` का उपयोग करना चाहिए जब Plugin ClawHub पर published हो; onboarding उसे preferred remote source मानता है और install के बाद ClawHub artifact facts record करता है। `npmSpec` उन packages के लिए compatibility fallback बना रहता है जो अभी ClawHub पर move नहीं हुए हैं।

Exact npm version pinning पहले से `npmSpec` में रहती है, उदाहरण के लिए `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`। Official external catalog entries को exact specs के साथ `expectedIntegrity` pair करना चाहिए ताकि update flows fail closed हों यदि fetched npm artifact अब pinned release से मेल नहीं खाता। Interactive onboarding compatibility के लिए trusted registry npm specs अब भी offer करता है, जिनमें bare package names और dist-tags शामिल हैं। Catalog diagnostics exact, floating, integrity-pinned, missing-integrity, package-name mismatch, और invalid default-choice sources में अंतर कर सकते हैं। वे तब भी warn करते हैं जब `expectedIntegrity` मौजूद हो लेकिन कोई valid npm source नहीं हो जिसे वह pin कर सके। जब `expectedIntegrity` मौजूद हो, install/update flows उसे enforce करते हैं; जब वह omitted हो, registry resolution integrity pin के बिना record किया जाता है।

Channel Plugins को `openclaw.setupEntry` देना चाहिए जब status, channel list, या SecretRef scans को पूरा runtime लोड किए बिना configured accounts identify करने की जरूरत हो। setup entry को channel metadata के साथ setup-safe config, status, और secrets adapters expose करने चाहिए; network clients, gateway listeners, और transport runtimes को main extension entrypoint में रखें।

Runtime entrypoint fields source entrypoint fields के लिए package-boundary checks को override नहीं करते। उदाहरण के लिए, `openclaw.runtimeExtensions` किसी escaping `openclaw.extensions` path को loadable नहीं बना सकता।

`openclaw.install.allowInvalidConfigRecovery` जानबूझकर संकीर्ण है। यह arbitrary broken configs को installable नहीं बनाता। आज यह केवल install flows को specific stale bundled-plugin upgrade failures से recover करने देता है, जैसे missing bundled Plugin path या उसी bundled Plugin के लिए stale `channels.<id>` entry। Unrelated config errors अब भी install block करते हैं और operators को `openclaw doctor --fix` पर भेजते हैं।

`openclaw.channel.persistedAuthState` एक tiny checker module के लिए package metadata है:

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

इसे तब उपयोग करें जब setup, doctor, status, या read-only presence flows को पूरा channel Plugin लोड होने से पहले cheap yes/no auth probe चाहिए। Persisted auth state configured channel state नहीं है: इस metadata का उपयोग Plugins को auto-enable करने, runtime dependencies repair करने, या यह तय करने के लिए न करें कि channel runtime load होना चाहिए या नहीं। target export एक small function होना चाहिए जो केवल persisted state पढ़ता हो; इसे full channel runtime barrel के through route न करें।

`openclaw.channel.configuredState` cheap env-only configured checks के लिए वही shape follow करता है:

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

इसे तब उपयोग करें जब कोई channel env या अन्य tiny non-runtime inputs से configured-state का उत्तर दे सकता हो। यदि check को full config resolution या real channel runtime चाहिए, तो उस logic को Plugin `config.hasConfiguredState` hook में ही रखें।

## Discovery precedence (duplicate plugin ids)

OpenClaw कई roots से Plugins discover करता है। raw filesystem scan order के लिए, [Plugin scan
order](/hi/gateway/configuration-reference#plugin-scan-order) देखें। यदि दो discoveries का समान `id` है, तो केवल **highest-precedence** manifest रखा जाता है; lower-precedence duplicates को साथ में लोड करने के बजाय drop कर दिया जाता है।

Precedence, highest to lowest:

1. **Config-selected** — `plugins.entries.<id>` में स्पष्ट रूप से pinned path
2. **Bundled** — OpenClaw के साथ shipped Plugins
3. **Global install** — global OpenClaw Plugin root में installed Plugins
4. **Workspace** — मौजूदा workspace के relative discover किए गए Plugins

Implications:

- workspace में पड़ी bundled Plugin की forked या stale copy bundled build को shadow नहीं करेगी।
- bundled Plugin को local one से सच में override करने के लिए, उसे `plugins.entries.<id>` के जरिए pin करें ताकि वह workspace discovery पर निर्भर रहने के बजाय precedence से जीते।
- Duplicate drops log किए जाते हैं ताकि Doctor और startup diagnostics discarded copy की ओर point कर सकें।
- Config-selected duplicate overrides diagnostics में explicit overrides के रूप में word किए जाते हैं, लेकिन फिर भी warn करते हैं ताकि stale forks और accidental shadows visible रहें।

## JSON Schema requirements

- **हर Plugin को JSON Schema के साथ शिप होना चाहिए**, भले ही वह कोई कॉन्फ़िग स्वीकार न करता हो।
- खाली स्कीमा स्वीकार्य है (उदाहरण के लिए, `{ "type": "object", "additionalProperties": false }`)।
- स्कीमा रनटाइम पर नहीं, बल्कि कॉन्फ़िग पढ़ने/लिखने के समय सत्यापित किए जाते हैं।
- नए कॉन्फ़िग कुंजियों के साथ किसी बंडल किए गए Plugin को विस्तारित या फ़ोर्क करते समय, उसी समय उस Plugin के `openclaw.plugin.json` `configSchema` को अपडेट करें। बंडल किए गए Plugin स्कीमा सख्त होते हैं, इसलिए `configSchema.properties` में `myNewKey` जोड़े बिना उपयोगकर्ता कॉन्फ़िग में `plugins.entries.<id>.config.myNewKey` जोड़ना Plugin रनटाइम लोड होने से पहले अस्वीकार कर दिया जाएगा।

उदाहरण स्कीमा एक्सटेंशन:

```json
{
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "myNewKey": {
        "type": "string"
      }
    }
  }
}
```

## सत्यापन व्यवहार

- अज्ञात `channels.*` कुंजियाँ **त्रुटियाँ** हैं, जब तक चैनल id को
  किसी Plugin मेनिफ़ेस्ट द्वारा घोषित न किया गया हो।
- `plugins.entries.<id>`, `plugins.allow`, `plugins.deny`, और `plugins.slots.*`
  को **खोजे जा सकने वाले** Plugin ids का संदर्भ देना चाहिए। अज्ञात ids **त्रुटियाँ** हैं।
- यदि कोई Plugin इंस्टॉल है लेकिन उसका मेनिफ़ेस्ट या स्कीमा टूटा हुआ या अनुपस्थित है,
  तो सत्यापन विफल हो जाता है और Doctor Plugin त्रुटि रिपोर्ट करता है।
- यदि Plugin कॉन्फ़िग मौजूद है लेकिन Plugin **अक्षम** है, तो कॉन्फ़िग रखा जाता है और
  Doctor + लॉग में एक **चेतावनी** दिखाई जाती है।

पूर्ण `plugins.*` स्कीमा के लिए [कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration) देखें।

## नोट्स

- मेनिफ़ेस्ट **मूल OpenClaw Plugin** के लिए आवश्यक है, जिसमें स्थानीय फ़ाइल सिस्टम लोड भी शामिल हैं। रनटाइम फिर भी Plugin मॉड्यूल को अलग से लोड करता है; मेनिफ़ेस्ट केवल खोज + सत्यापन के लिए है।
- मूल मेनिफ़ेस्ट JSON5 के साथ पार्स किए जाते हैं, इसलिए टिप्पणियाँ, trailing commas, और unquoted keys तब तक स्वीकार किए जाते हैं जब तक अंतिम मान अभी भी एक ऑब्जेक्ट हो।
- मेनिफ़ेस्ट लोडर केवल दस्तावेज़ित मेनिफ़ेस्ट फ़ील्ड पढ़ता है। कस्टम शीर्ष-स्तरीय कुंजियों से बचें।
- जब किसी Plugin को उनकी आवश्यकता न हो, तो `channels`, `providers`, `cliBackends`, और `skills` सभी छोड़े जा सकते हैं।
- `providerCatalogEntry` हल्का रहना चाहिए और व्यापक रनटाइम कोड आयात नहीं करना चाहिए; इसे स्थिर provider catalog मेटाडेटा या संकीर्ण खोज डिस्क्रिप्टर के लिए उपयोग करें, request-time execution के लिए नहीं।
- विशिष्ट Plugin प्रकार `plugins.slots.*` के माध्यम से चुने जाते हैं: `plugins.slots.memory` के माध्यम से `kind: "memory"`, `plugins.slots.contextEngine` के माध्यम से `kind: "context-engine"` (डिफ़ॉल्ट `legacy`)।
- इस मेनिफ़ेस्ट में विशिष्ट Plugin प्रकार घोषित करें। Runtime-entry `OpenClawPluginDefinition.kind` deprecated है और पुराने Plugin के लिए केवल compatibility fallback के रूप में रहता है।
- Env-var मेटाडेटा (`setup.providers[].envVars`, deprecated `providerAuthEnvVars`, और `channelEnvVars`) केवल घोषणात्मक है। Status, audit, Cron delivery validation, और अन्य read-only surfaces अभी भी किसी env var को configured मानने से पहले Plugin trust और effective activation policy लागू करते हैं।
- provider code की आवश्यकता वाले runtime wizard metadata के लिए, [Provider runtime hooks](/hi/plugins/architecture-internals#provider-runtime-hooks) देखें।
- यदि आपका Plugin native modules पर निर्भर करता है, तो build steps और किसी भी package-manager allowlist आवश्यकताओं का दस्तावेज़ बनाएं (उदाहरण के लिए, pnpm `allow-build-scripts` + `pnpm rebuild <package>`)।

## संबंधित

<CardGroup cols={3}>
  <Card title="Building plugins" href="/hi/plugins/building-plugins" icon="rocket">
    Plugin के साथ शुरुआत करना।
  </Card>
  <Card title="Plugin architecture" href="/hi/plugins/architecture" icon="diagram-project">
    आंतरिक आर्किटेक्चर और capability model।
  </Card>
  <Card title="SDK overview" href="/hi/plugins/sdk-overview" icon="book">
    Plugin SDK संदर्भ और subpath imports।
  </Card>
</CardGroup>
