---
read_when:
    - आप एक Plugin के लिए परीक्षण लिख रहे हैं
    - आपको Plugin SDK से परीक्षण उपयोगिताओं की आवश्यकता है
    - आप बंडल किए गए Plugins के लिए कॉन्ट्रैक्ट परीक्षणों को समझना चाहते हैं
sidebarTitle: Testing
summary: OpenClaw plugins के लिए परीक्षण उपयोगिताएँ और पैटर्न
title: Plugin परीक्षण
x-i18n:
    generated_at: "2026-07-19T09:38:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 83c5e3948c02ce973f901b67ff0a8a253b04e25442c65f8fe3f5bec755d81a5d
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw के plugins के लिए परीक्षण उपयोगिताओं, पैटर्न और लिंट प्रवर्तन का संदर्भ।

<Tip>
  **परीक्षण उदाहरण खोज रहे हैं?** कार्य-विधि गाइड में व्यावहारिक परीक्षण उदाहरण शामिल हैं:
  [चैनल Plugin परीक्षण](/hi/plugins/sdk-channel-plugins#step-6-test) और
  [प्रदाता Plugin परीक्षण](/hi/plugins/sdk-provider-plugins#step-6-test)।
</Tip>

## परीक्षण उपयोगिताएँ

ये उपपथ OpenClaw के स्वयं के बंडल किए गए plugin परीक्षणों के लिए रिपॉज़िटरी-स्थानीय स्रोत प्रवेश-बिंदु हैं। इन्हें तृतीय-पक्ष
plugins के लिए `package.json` exports के रूप में प्रकाशित नहीं किया जाता,
और ये Vitest या केवल रिपॉज़िटरी में उपलब्ध अन्य परीक्षण निर्भरताएँ आयात कर सकते हैं।

```typescript
import {
  shouldAckReaction,
  removeAckReactionAfterReply,
} from "openclaw/plugin-sdk/channel-feedback";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";
import { AUTH_PROFILE_RUNTIME_CONTRACT } from "openclaw/plugin-sdk/agent-runtime-test-contracts";
import { createTestPluginApi } from "openclaw/plugin-sdk/plugin-test-api";
import { expectChannelInboundContextContract } from "openclaw/plugin-sdk/channel-contract-testing";
import { createStartAccountContext } from "openclaw/plugin-sdk/channel-test-helpers";
import { describePluginRegistrationContract } from "openclaw/plugin-sdk/plugin-test-contracts";
import { registerSingleProviderPlugin } from "openclaw/plugin-sdk/plugin-test-runtime";
import { describeOpenAIProviderRuntimeContract } from "openclaw/plugin-sdk/provider-test-contracts";
import { getProviderHttpMocks } from "openclaw/plugin-sdk/provider-http-test-mocks";
import { withEnv, withFetchPreconnect, withServer } from "openclaw/plugin-sdk/test-env";
import { isLiveTestEnabled } from "openclaw/plugin-sdk/test-live";
import { createRequestCaptureJsonFetch } from "openclaw/plugin-sdk/test-media-understanding";
import {
  bundledPluginRoot,
  createCliRuntimeCapture,
  typedCases,
} from "openclaw/plugin-sdk/test-fixtures";
import { mockNodeBuiltinModule } from "openclaw/plugin-sdk/test-node-mocks";
```

बंडल किए गए plugin परीक्षणों के लिए इन केंद्रित उपपथों का उपयोग करें। पूर्व
`openclaw/plugin-sdk/testing` बैरल रिपॉज़िटरी-स्थानीय था, शिप किए गए
पैकेजों से बाहर रखा गया था और अब हटा दिया गया है। पुराना `openclaw/plugin-sdk/test-utils`
उपनाम रिपॉज़िटरी-स्थानीय बना हुआ है; `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) उस उपनाम के नए extension-test
आयातों को अस्वीकार करता है।

### उपलब्ध exports

| निर्यात                                               | उद्देश्य                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | प्रत्यक्ष पंजीकरण यूनिट परीक्षणों के लिए न्यूनतम Plugin API मॉक बनाएँ। `plugin-sdk/plugin-test-api` से आयात करें                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | मूल एजेंट रनटाइम अडैप्टरों के लिए साझा प्रमाणीकरण-प्रोफ़ाइल अनुबंध फ़िक्स्चर। `plugin-sdk/agent-runtime-test-contracts` से आयात करें            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | मूल एजेंट रनटाइम अडैप्टरों के लिए साझा डिलीवरी-दमन अनुबंध फ़िक्स्चर। `plugin-sdk/agent-runtime-test-contracts` से आयात करें    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | मूल एजेंट रनटाइम अडैप्टरों के लिए साझा फ़ॉलबैक-वर्गीकरण अनुबंध फ़िक्स्चर। `plugin-sdk/agent-runtime-test-contracts` से आयात करें |
| `createParameterFreeTool`                            | मूल रनटाइम अनुबंध परीक्षणों के लिए डायनेमिक-टूल स्कीमा फ़िक्स्चर बनाएँ। `plugin-sdk/agent-runtime-test-contracts` से आयात करें              |
| `expectChannelInboundContextContract`                | चैनल के इनबाउंड संदर्भ के आकार की पुष्टि करें। `plugin-sdk/channel-contract-testing` से आयात करें                                                  |
| `installChannelOutboundPayloadContractSuite`         | चैनल के आउटबाउंड पेलोड अनुबंध मामले स्थापित करें। `plugin-sdk/channel-contract-testing` से आयात करें                                       |
| `createStartAccountContext`                          | चैनल खाते के जीवनचक्र संदर्भ बनाएँ। `plugin-sdk/channel-test-helpers` से आयात करें                                                  |
| `installChannelActionsContractSuite`                 | सामान्य चैनल संदेश-कार्रवाई अनुबंध मामले स्थापित करें। `plugin-sdk/channel-test-helpers` से आयात करें                                     |
| `installChannelSetupContractSuite`                   | सामान्य चैनल सेटअप अनुबंध मामले स्थापित करें। `plugin-sdk/channel-test-helpers` से आयात करें                                              |
| `installChannelStatusContractSuite`                  | सामान्य चैनल स्थिति अनुबंध मामले स्थापित करें। `plugin-sdk/channel-test-helpers` से आयात करें                                             |
| `expectDirectoryIds`                                 | डायरेक्टरी-सूची फ़ंक्शन से प्राप्त चैनल डायरेक्टरी आईडी की पुष्टि करें। `plugin-sdk/channel-test-helpers` से आयात करें                               |
| `assertBundledChannelEntries`                        | पुष्टि करें कि बंडल किए गए चैनल एंट्रीपॉइंट अपेक्षित सार्वजनिक अनुबंध उजागर करते हैं। `plugin-sdk/channel-test-helpers` से आयात करें                    |
| `formatEnvelopeTimestamp`                            | नियतात्मक एनवेलप टाइमस्टैम्प प्रारूपित करें। `plugin-sdk/channel-test-helpers` से आयात करें                                                  |
| `expectPairingReplyText`                             | चैनल पेयरिंग उत्तर टेक्स्ट की पुष्टि करें और उसका कोड निकालें। `plugin-sdk/channel-test-helpers` से आयात करें                                    |
| `describePluginRegistrationContract`                 | Plugin पंजीकरण अनुबंध जाँचें स्थापित करें। `plugin-sdk/plugin-test-contracts` से आयात करें                                              |
| `registerSingleProviderPlugin`                       | लोडर स्मोक परीक्षणों में एक प्रोवाइडर Plugin पंजीकृत करें। `plugin-sdk/plugin-test-runtime` से आयात करें                                         |
| `registerProviderPlugin`                             | एक Plugin से सभी प्रोवाइडर प्रकार कैप्चर करें। `plugin-sdk/plugin-test-runtime` से आयात करें                                                 |
| `registerProviderPlugins`                            | अनेक Plugins में प्रोवाइडर पंजीकरण कैप्चर करें। `plugin-sdk/plugin-test-runtime` से आयात करें                                     |
| `requireRegisteredProvider`                          | पुष्टि करें कि प्रोवाइडर संग्रह में कोई आईडी शामिल है। `plugin-sdk/plugin-test-runtime` से आयात करें                                           |
| `createRuntimeEnv`                                   | मॉक किया गया CLI/Plugin रनटाइम परिवेश बनाएँ। `plugin-sdk/plugin-test-runtime` से आयात करें                                              |
| `createPluginRuntimeMock`                            | मॉक की गई Plugin रनटाइम सतह बनाएँ। `plugin-sdk/plugin-test-runtime` से आयात करें                                                      |
| `createPluginSetupWizardStatus`                      | चैनल Plugins के लिए सेटअप स्थिति सहायक बनाएँ। `plugin-sdk/plugin-test-runtime` से आयात करें                                             |
| `createTestWizardPrompter`                           | मॉक किया गया सेटअप विज़ार्ड प्रॉम्प्टर बनाएँ। `plugin-sdk/plugin-test-runtime` से आयात करें                                                       |
| `createRuntimeTaskFlow`                              | पृथक रनटाइम कार्य-प्रवाह स्थिति बनाएँ। `plugin-sdk/plugin-test-runtime` से आयात करें                                                    |
| `runProviderCatalog`                                 | परीक्षण निर्भरताओं के साथ प्रोवाइडर कैटलॉग हुक निष्पादित करें। `plugin-sdk/plugin-test-runtime` से आयात करें                                     |
| `resolveProviderWizardOptions`                       | अनुबंध परीक्षणों में प्रोवाइडर सेटअप विज़ार्ड विकल्पों का समाधान करें। `plugin-sdk/plugin-test-runtime` से आयात करें                                    |
| `resolveProviderModelPickerEntries`                  | अनुबंध परीक्षणों में प्रोवाइडर मॉडल-पिकर प्रविष्टियों का समाधान करें। `plugin-sdk/plugin-test-runtime` से आयात करें                                    |
| `buildProviderPluginMethodChoice`                    | पुष्टियों के लिए प्रोवाइडर विज़ार्ड विकल्प आईडी बनाएँ। `plugin-sdk/plugin-test-runtime` से आयात करें                                            |
| `setProviderWizardProvidersResolverForTest`          | पृथक परीक्षणों के लिए प्रोवाइडर विज़ार्ड प्रोवाइडर इंजेक्ट करें। `plugin-sdk/plugin-test-runtime` से आयात करें                                        |
| `describeOpenAIProviderRuntimeContract`              | प्रोवाइडर-परिवार रनटाइम अनुबंध जाँचें स्थापित करें। `plugin-sdk/provider-test-contracts` से आयात करें                                        |
| `expectPassthroughReplayPolicy`                      | पुष्टि करें कि प्रोवाइडर रीप्ले नीतियाँ प्रोवाइडर-स्वामित्व वाले टूल और मेटाडेटा तक अपरिवर्तित पहुँचती हैं। `plugin-sdk/provider-test-contracts` से आयात करें         |
| `runRealtimeSttLiveTest`                             | साझा ऑडियो फ़िक्स्चर के साथ लाइव रियलटाइम STT प्रोवाइडर परीक्षण चलाएँ। `plugin-sdk/provider-test-contracts` से आयात करें                       |
| `normalizeTranscriptForMatch`                        | फ़ज़ी पुष्टियों से पहले लाइव ट्रांसक्रिप्ट आउटपुट सामान्यीकृत करें। `plugin-sdk/provider-test-contracts` से आयात करें                               |
| `expectExplicitVideoGenerationCapabilities`          | पुष्टि करें कि वीडियो प्रोवाइडर स्पष्ट जनरेशन मोड क्षमताएँ घोषित करते हैं। `plugin-sdk/provider-test-contracts` से आयात करें                   |
| `expectExplicitMusicGenerationCapabilities`          | पुष्टि करें कि संगीत प्रोवाइडर स्पष्ट जनरेशन/संपादन क्षमताएँ घोषित करते हैं। `plugin-sdk/provider-test-contracts` से आयात करें                   |
| `mockSuccessfulDashscopeVideoTask`                   | सफल DashScope-संगत वीडियो कार्य प्रतिक्रिया स्थापित करें। `plugin-sdk/provider-test-contracts` से आयात करें                          |
| `getProviderHttpMocks`                               | ऑप्ट-इन प्रोवाइडर HTTP/प्रमाणीकरण Vitest मॉक तक पहुँचें। `plugin-sdk/provider-http-test-mocks` से आयात करें                                         |
| `installProviderHttpMockCleanup`                     | प्रत्येक परीक्षण के बाद प्रोवाइडर HTTP/प्रमाणीकरण मॉक रीसेट करें। `plugin-sdk/provider-http-test-mocks` से आयात करें                                        |
| `installCommonResolveTargetErrorCases`               | लक्ष्य समाधान त्रुटि प्रबंधन के लिए साझा परीक्षण मामले। `plugin-sdk/channel-target-testing` से आयात करें                                  |
| `shouldAckReaction`                                  | जाँचें कि किसी चैनल को पावती प्रतिक्रिया जोड़नी चाहिए या नहीं। `plugin-sdk/channel-feedback` से आयात करें                                            |
| `removeAckReactionAfterReply`                        | उत्तर डिलीवरी के बाद पावती प्रतिक्रिया हटाएँ। `plugin-sdk/channel-feedback` से आयात करें                                                      |
| `createTestRegistry`                                 | चैनल Plugin रजिस्ट्री फ़िक्स्चर बनाएँ। `plugin-sdk/plugin-test-runtime` या `plugin-sdk/channel-test-helpers` से आयात करें               |
| `createEmptyPluginRegistry`                          | खाली Plugin रजिस्ट्री फ़िक्स्चर बनाएँ। `plugin-sdk/plugin-test-runtime` या `plugin-sdk/channel-test-helpers` से आयात करें                |
| `setActivePluginRegistry`                            | Plugin रनटाइम परीक्षणों के लिए रजिस्ट्री फ़िक्स्चर स्थापित करें। `plugin-sdk/plugin-test-runtime` या `plugin-sdk/channel-test-helpers` से आयात करें   |
| `createRequestCaptureJsonFetch`                      | मीडिया सहायक परीक्षणों में JSON फ़ेच अनुरोध कैप्चर करें। `plugin-sdk/test-media-understanding` से आयात करें                                     |
| `isLiveTestEnabled`                                  | ऑप्ट-इन लाइव प्रोवाइडर परीक्षणों को नियंत्रित करें। `plugin-sdk/test-live` से आयात करें                                                                      |
| `collectProviderApiKeys`                             | लाइव प्रोवाइडर परीक्षणों के लिए क्रेडेंशियल खोजें। `plugin-sdk/test-live-auth` से आयात करें                                                    |
| `parseProviderModelMap`                              | संगीत/वीडियो लाइव-परीक्षण मॉडल ओवरराइड पार्स करें। `plugin-sdk/test-media-generation` से आयात करें                                              |
| `withServer`                                         | अस्थायी स्थानीय HTTP सर्वर के विरुद्ध परीक्षण चलाएँ। `plugin-sdk/test-env` से आयात करें                                                      |
| `createMockIncomingRequest`                          | न्यूनतम इनकमिंग HTTP अनुरोध ऑब्जेक्ट बनाएँ। `plugin-sdk/test-env` से आयात करें                                                          |
| `withFetchPreconnect`                                | प्रीकनेक्ट हुक स्थापित करके फ़ेच परीक्षण चलाएँ। `plugin-sdk/test-env` से आयात करें                                                       |
| `withEnv` / `withEnvAsync`                           | परिवेश चर अस्थायी रूप से पैच करें। `plugin-sdk/test-env` से आयात करें                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | पृथक फ़ाइल-सिस्टम परीक्षण फ़िक्स्चर बनाएँ। `plugin-sdk/test-env` से आयात करें                                                              |
| `createMockServerResponse`                           | न्यूनतम HTTP सर्वर प्रतिक्रिया मॉक बनाएँ। `plugin-sdk/test-env` से आयात करें                                                            |
| `createProviderUsageFetch`                           | प्रोवाइडर उपयोग फ़ेच फ़िक्स्चर बनाएँ। `plugin-sdk/test-env` से आयात करें                                                                   |
| `useFrozenTime` / `useRealTime`                      | समय-संवेदी परीक्षणों के लिए टाइमर फ़्रीज़ और पुनर्स्थापित करें। `plugin-sdk/test-env` से आयात करें                                                    |
| `createCliRuntimeCapture`                            | परीक्षणों में CLI रनटाइम आउटपुट कैप्चर करें। `plugin-sdk/test-fixtures` से आयात करें                                                              |
| `importFreshModule`                                  | मॉड्यूल कैश को बायपास करने के लिए नए क्वेरी टोकन के साथ ESM मॉड्यूल आयात करें। `plugin-sdk/test-fixtures` से आयात करें                             |
| `bundledPluginRoot` / `bundledPluginFile`            | बंडल किए गए Plugin स्रोत या dist फ़िक्स्चर पथों का समाधान करें। `plugin-sdk/test-fixtures` से आयात करें                                              |
| `mockNodeBuiltinModule`                              | सीमित Node बिल्ट-इन Vitest मॉक स्थापित करें। `plugin-sdk/test-node-mocks` से आयात करें                                                       |
| `createSandboxTestContext`                           | सैंडबॉक्स परीक्षण संदर्भ बनाएँ। `plugin-sdk/test-fixtures` से आयात करें                                                                      |
| `writeSkill`                                         | स्किल फ़िक्स्चर लिखें। `plugin-sdk/test-fixtures` से आयात करें                                                                             |
| `makeAgentAssistantMessage`                          | एजेंट ट्रांसक्रिप्ट संदेश फ़िक्स्चर बनाएँ। `plugin-sdk/test-fixtures` से आयात करें                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | सिस्टम इवेंट फ़िक्स्चर का निरीक्षण और रीसेट करें। `plugin-sdk/test-fixtures` से आयात करें                                                          |
| `sanitizeTerminalText`                               | पुष्टियों के लिए टर्मिनल आउटपुट स्वच्छ करें। `plugin-sdk/test-fixtures` से आयात करें                                                          |
| `countLines` / `hasBalancedFences`                   | चंकिंग आउटपुट के आकार को सत्यापित करें। `plugin-sdk/test-fixtures` से इम्पोर्ट करें                                                                     |
| `typedCases`                                         | तालिका-संचालित परीक्षणों के लिए लिटरल प्रकारों को बनाए रखें। `plugin-sdk/test-fixtures` से इम्पोर्ट करें                                                    |

बंडल किए गए Plugin कॉन्ट्रैक्ट सुइट भी केवल परीक्षण वाली रजिस्ट्री, मैनिफ़ेस्ट, सार्वजनिक आर्टिफ़ैक्ट और रनटाइम फ़िक्स्चर सहायकों के लिए इन SDK परीक्षण उपपथों का उपयोग करते हैं।
बंडल की गई OpenClaw इन्वेंट्री पर निर्भर केवल-कोर सुइट इसके बजाय
`src/plugins/contracts` के अंतर्गत रहते हैं।

### प्रकार

केंद्रित परीक्षण उपपथ परीक्षण फ़ाइलों में उपयोगी प्रकारों को भी पुनः निर्यात करते हैं:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## परीक्षण लक्ष्य समाधान

चैनल लक्ष्य समाधान के लिए मानक त्रुटि स्थितियाँ जोड़ने हेतु `installCommonResolveTargetErrorCases` का उपयोग करें:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // आपके चैनल का लक्ष्य समाधान तर्क
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // चैनल-विशिष्ट परीक्षण स्थितियाँ जोड़ें
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## परीक्षण प्रतिरूप

### पंजीकरण कॉन्ट्रैक्ट का परीक्षण

`register(api)` को हाथ से लिखा हुआ `api` मॉक देने वाले यूनिट परीक्षण OpenClaw के लोडर स्वीकृति गेट का परीक्षण नहीं करते।
आपका Plugin जिस प्रत्येक पंजीकरण सतह पर निर्भर करता है, उसके लिए कम-से-कम एक लोडर-समर्थित स्मोक परीक्षण जोड़ें, विशेष रूप से हुक और मेमोरी जैसी विशिष्ट क्षमताओं के लिए।

आवश्यक मेटाडेटा अनुपस्थित होने या किसी Plugin द्वारा ऐसी क्षमता API को कॉल करने पर, जिसका वह स्वामी नहीं है, वास्तविक लोडर Plugin पंजीकरण को विफल कर देता है। उदाहरण के लिए,
`api.registerHook(...)` के लिए हुक नाम आवश्यक है और
`api.registerMemoryCapability(...)` के लिए आवश्यक है कि Plugin मैनिफ़ेस्ट या निर्यात की गई
एंट्री `kind: "memory"` को घोषित करे।

### रनटाइम कॉन्फ़िगरेशन एक्सेस का परीक्षण

`openclaw/plugin-sdk/plugin-test-runtime` से साझा Plugin रनटाइम मॉक को प्राथमिकता दें।
इसके `runtime.config.loadConfig()` और `runtime.config.writeConfigFile(...)`
मॉक डिफ़ॉल्ट रूप से त्रुटि देते हैं, ताकि परीक्षण बहिष्कृत संगतता
API के नए उपयोग को पकड़ सकें। इन मॉक को केवल तभी ओवरराइड करें, जब परीक्षण स्पष्ट रूप से विरासती
संगतता व्यवहार को कवर कर रहा हो।

### चैनल Plugin का यूनिट परीक्षण

```typescript
import { describe, it, expect, vi } from "vitest";

describe("my-channel plugin", () => {
  it("should resolve account from config", () => {
    const cfg = {
      channels: {
        "my-channel": {
          token: "test-token",
          allowFrom: ["user1"],
        },
      },
    };

    const account = myPlugin.setup.resolveAccount(cfg, undefined);
    expect(account.token).toBe("test-token");
  });

  it("should inspect account without materializing secrets", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // कोई टोकन मान उजागर नहीं किया गया
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### प्रदाता Plugin का यूनिट परीक्षण

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider plugin", () => {
  it("should resolve dynamic models", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... संदर्भ
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... संदर्भ
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Plugin रनटाइम का मॉक बनाना

`createPluginRuntimeStore` का उपयोग करने वाले कोड के लिए, परीक्षणों में रनटाइम का मॉक बनाएँ:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// परीक्षण सेटअप में
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... अन्य मॉक
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... अन्य नेमस्पेस
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// परीक्षणों के बाद
store.clearRuntime();
```

### प्रति-इंस्टेंस स्टब के साथ परीक्षण

प्रोटोटाइप परिवर्तन के बजाय प्रति-इंस्टेंस स्टब को प्राथमिकता दें:

```typescript
// अनुशंसित: प्रति-इंस्टेंस स्टब
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// इससे बचें: प्रोटोटाइप परिवर्तन
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## कॉन्ट्रैक्ट परीक्षण (रिपॉज़िटरी के भीतर के Plugin)

बंडल किए गए Plugin में कॉन्ट्रैक्ट परीक्षण होते हैं, जो पंजीकरण स्वामित्व सत्यापित करते हैं:

```bash
pnpm test src/plugins/contracts/
```

ये परीक्षण निम्नलिखित सुनिश्चित करते हैं:

- कौन-से Plugin किन प्रदाताओं को पंजीकृत करते हैं
- कौन-से Plugin किन वाक् प्रदाताओं को पंजीकृत करते हैं
- पंजीकरण संरचना की शुद्धता
- रनटाइम कॉन्ट्रैक्ट अनुपालन

### सीमित-दायरे वाले परीक्षण चलाना

किसी विशिष्ट Plugin के लिए:

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

केवल कॉन्ट्रैक्ट परीक्षणों के लिए:

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## लिंट प्रवर्तन (रिपॉज़िटरी के भीतर के Plugin)

`scripts/run-additional-boundary-checks.mjs` CI में `lint:plugins:*`
इंपोर्ट-सीमा जाँचों का एक समूह चलाता है; प्रत्येक को स्थानीय रूप से अलग भी चलाया जा सकता है:

| कमांड                                                        | लागू करता है                                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | बंडल किए गए Plugin अखंड `openclaw/plugin-sdk` रूट बैरल को इंपोर्ट नहीं कर सकते।             |
| `pnpm run lint:plugins:no-extension-src-imports`               | उत्पादन एक्सटेंशन फ़ाइलें रिपॉज़िटरी के `src/**` ट्री को सीधे इंपोर्ट नहीं कर सकतीं (`../../src/...`)। |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | एक्सटेंशन परीक्षण फ़ाइलें `plugin-sdk/test-utils` या केवल-कोर परीक्षण सहायकों को इंपोर्ट नहीं कर सकतीं। |

बाहरी Plugin पर ये लिंट नियम लागू नहीं होते, लेकिन समान
प्रतिरूपों का पालन करने की अनुशंसा की जाती है।

## परीक्षण कॉन्फ़िगरेशन

OpenClaw सूचनात्मक V8 कवरेज रिपोर्टिंग के साथ Vitest 4 का उपयोग करता है। Plugin परीक्षणों के लिए:

```bash
# सभी परीक्षण चलाएँ
pnpm test

# विशिष्ट Plugin परीक्षण चलाएँ
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# किसी विशिष्ट परीक्षण नाम फ़िल्टर के साथ चलाएँ
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# कवरेज के साथ चलाएँ
pnpm test:coverage
```

यदि स्थानीय रन से मेमोरी पर दबाव पड़ता है:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## संबंधित

- [SDK अवलोकन](/hi/plugins/sdk-overview) -- इंपोर्ट परंपराएँ
- [SDK चैनल Plugin](/hi/plugins/sdk-channel-plugins) -- चैनल Plugin इंटरफ़ेस
- [SDK प्रदाता Plugin](/hi/plugins/sdk-provider-plugins) -- प्रदाता Plugin हुक
- [Plugin बनाना](/hi/plugins/building-plugins) -- आरंभ करने की मार्गदर्शिका
