---
read_when:
    - आप एक Plugin के लिए परीक्षण लिख रहे हैं
    - आपको Plugin SDK से परीक्षण उपयोगिताओं की आवश्यकता है
    - आप बंडल किए गए Plugins के लिए कॉन्ट्रैक्ट परीक्षणों को समझना चाहते हैं
sidebarTitle: Testing
summary: OpenClaw plugins के लिए परीक्षण उपयोगिताएँ और पैटर्न
title: Plugin परीक्षण
x-i18n:
    generated_at: "2026-07-16T16:21:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f82f32a61e1ba8049f410a6a1c3651055efb8c048eaa6d1ac0c1442c34726e6
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw plugins के लिए परीक्षण उपयोगिताओं, पैटर्न और लिंट प्रवर्तन का संदर्भ।

<Tip>
  **परीक्षण के उदाहरण खोज रहे हैं?** कैसे-करें मार्गदर्शिकाओं में व्यावहारिक परीक्षण उदाहरण शामिल हैं:
  [चैनल Plugin परीक्षण](/hi/plugins/sdk-channel-plugins#step-6-test) और
  [प्रदाता Plugin परीक्षण](/hi/plugins/sdk-provider-plugins#step-6-test)।
</Tip>

## परीक्षण उपयोगिताएँ

ये उपपथ OpenClaw के अपने बंडल किए गए Plugin परीक्षणों के लिए रिपॉज़िटरी-स्थानीय स्रोत प्रवेश-बिंदु हैं। ये तृतीय-पक्ष
plugins के लिए प्रकाशित `package.json` एक्सपोर्ट नहीं हैं और ये Vitest या केवल रिपॉज़िटरी में उपलब्ध अन्य परीक्षण निर्भरताएँ इम्पोर्ट कर सकते हैं।

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
import {
  bundledPluginRoot,
  createCliRuntimeCapture,
  typedCases,
} from "openclaw/plugin-sdk/test-fixtures";
import { mockNodeBuiltinModule } from "openclaw/plugin-sdk/test-node-mocks";
```

बंडल किए गए Plugin परीक्षणों के लिए इन केंद्रित उपपथों का उपयोग करें। पूर्व
`openclaw/plugin-sdk/testing` बैरल रिपॉज़िटरी-स्थानीय था, वितरित
पैकेजों से बाहर रखा गया था और अब हटा दिया गया है। विरासती `openclaw/plugin-sdk/test-utils`
उपनाम रिपॉज़िटरी-स्थानीय बना हुआ है; `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) उस उपनाम के नए एक्सटेंशन-परीक्षण
इम्पोर्ट को अस्वीकार करता है।

### उपलब्ध एक्सपोर्ट

| निर्यात                                               | उद्देश्य                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | प्रत्यक्ष पंजीकरण यूनिट परीक्षणों के लिए न्यूनतम Plugin API मॉक बनाएँ। `plugin-sdk/plugin-test-api` से आयात करें                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | नेटिव एजेंट रनटाइम अडैप्टरों के लिए साझा प्रमाणीकरण-प्रोफ़ाइल अनुबंध फ़िक्स्चर। `plugin-sdk/agent-runtime-test-contracts` से आयात करें            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | नेटिव एजेंट रनटाइम अडैप्टरों के लिए साझा डिलीवरी-दमन अनुबंध फ़िक्स्चर। `plugin-sdk/agent-runtime-test-contracts` से आयात करें    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | नेटिव एजेंट रनटाइम अडैप्टरों के लिए साझा फ़ॉलबैक-वर्गीकरण अनुबंध फ़िक्स्चर। `plugin-sdk/agent-runtime-test-contracts` से आयात करें |
| `createParameterFreeTool`                            | नेटिव रनटाइम अनुबंध परीक्षणों के लिए डायनेमिक-टूल स्कीमा फ़िक्स्चर बनाएँ। `plugin-sdk/agent-runtime-test-contracts` से आयात करें              |
| `expectChannelInboundContextContract`                | चैनल के इनबाउंड संदर्भ की संरचना का अभिकथन करें। `plugin-sdk/channel-contract-testing` से आयात करें                                                  |
| `installChannelOutboundPayloadContractSuite`         | चैनल के आउटबाउंड पेलोड अनुबंध मामले इंस्टॉल करें। `plugin-sdk/channel-contract-testing` से आयात करें                                       |
| `createStartAccountContext`                          | चैनल खाते के जीवनचक्र संदर्भ बनाएँ। `plugin-sdk/channel-test-helpers` से आयात करें                                                  |
| `installChannelActionsContractSuite`                 | सामान्य चैनल संदेश-कार्रवाई अनुबंध मामले इंस्टॉल करें। `plugin-sdk/channel-test-helpers` से आयात करें                                     |
| `installChannelSetupContractSuite`                   | सामान्य चैनल सेटअप अनुबंध मामले इंस्टॉल करें। `plugin-sdk/channel-test-helpers` से आयात करें                                              |
| `installChannelStatusContractSuite`                  | सामान्य चैनल स्थिति अनुबंध मामले इंस्टॉल करें। `plugin-sdk/channel-test-helpers` से आयात करें                                             |
| `expectDirectoryIds`                                 | डायरेक्टरी-सूची फ़ंक्शन से चैनल डायरेक्टरी आईडी का अभिकथन करें। `plugin-sdk/channel-test-helpers` से आयात करें                               |
| `assertBundledChannelEntries`                        | अभिकथन करें कि बंडल किए गए चैनल एंट्रीपॉइंट अपेक्षित सार्वजनिक अनुबंध उजागर करते हैं। `plugin-sdk/channel-test-helpers` से आयात करें                    |
| `formatEnvelopeTimestamp`                            | नियतात्मक एनवलप टाइमस्टैम्प फ़ॉर्मैट करें। `plugin-sdk/channel-test-helpers` से आयात करें                                                  |
| `expectPairingReplyText`                             | चैनल पेयरिंग के उत्तर-पाठ का अभिकथन करें और उसका कोड निकालें। `plugin-sdk/channel-test-helpers` से आयात करें                                    |
| `describePluginRegistrationContract`                 | Plugin पंजीकरण अनुबंध जाँचें इंस्टॉल करें। `plugin-sdk/plugin-test-contracts` से आयात करें                                              |
| `registerSingleProviderPlugin`                       | लोडर स्मोक परीक्षणों में एक प्रोवाइडर Plugin पंजीकृत करें। `plugin-sdk/plugin-test-runtime` से आयात करें                                         |
| `registerProviderPlugin`                             | एक Plugin से सभी प्रोवाइडर प्रकार कैप्चर करें। `plugin-sdk/plugin-test-runtime` से आयात करें                                                 |
| `registerProviderPlugins`                            | एकाधिक Plugins में प्रोवाइडर पंजीकरण कैप्चर करें। `plugin-sdk/plugin-test-runtime` से आयात करें                                     |
| `requireRegisteredProvider`                          | अभिकथन करें कि प्रोवाइडर संग्रह में कोई आईडी मौजूद है। `plugin-sdk/plugin-test-runtime` से आयात करें                                           |
| `createRuntimeEnv`                                   | मॉक किया हुआ CLI/Plugin रनटाइम परिवेश बनाएँ। `plugin-sdk/plugin-test-runtime` से आयात करें                                              |
| `createPluginRuntimeMock`                            | मॉक की हुई Plugin रनटाइम सतह बनाएँ। `plugin-sdk/plugin-test-runtime` से आयात करें                                                      |
| `createPluginSetupWizardStatus`                      | चैनल Plugins के लिए सेटअप स्थिति सहायक बनाएँ। `plugin-sdk/plugin-test-runtime` से आयात करें                                             |
| `createTestWizardPrompter`                           | मॉक किया हुआ सेटअप विज़ार्ड प्रॉम्प्टर बनाएँ। `plugin-sdk/plugin-test-runtime` से आयात करें                                                       |
| `createRuntimeTaskFlow`                              | पृथक रनटाइम टास्क-फ़्लो स्थिति बनाएँ। `plugin-sdk/plugin-test-runtime` से आयात करें                                                    |
| `runProviderCatalog`                                 | परीक्षण निर्भरताओं के साथ प्रोवाइडर कैटलॉग हुक निष्पादित करें। `plugin-sdk/plugin-test-runtime` से आयात करें                                     |
| `resolveProviderWizardOptions`                       | अनुबंध परीक्षणों में प्रोवाइडर सेटअप विज़ार्ड विकल्पों का समाधान करें। `plugin-sdk/plugin-test-runtime` से आयात करें                                    |
| `resolveProviderModelPickerEntries`                  | अनुबंध परीक्षणों में प्रोवाइडर मॉडल-पिकर प्रविष्टियों का समाधान करें। `plugin-sdk/plugin-test-runtime` से आयात करें                                    |
| `buildProviderPluginMethodChoice`                    | अभिकथनों के लिए प्रोवाइडर विज़ार्ड विकल्प आईडी बनाएँ। `plugin-sdk/plugin-test-runtime` से आयात करें                                            |
| `setProviderWizardProvidersResolverForTest`          | पृथक परीक्षणों के लिए प्रोवाइडर विज़ार्ड प्रोवाइडर इंजेक्ट करें। `plugin-sdk/plugin-test-runtime` से आयात करें                                        |
| `describeOpenAIProviderRuntimeContract`              | प्रोवाइडर-फ़ैमिली रनटाइम अनुबंध जाँचें इंस्टॉल करें। `plugin-sdk/provider-test-contracts` से आयात करें                                        |
| `expectPassthroughReplayPolicy`                      | अभिकथन करें कि प्रोवाइडर रीप्ले नीतियाँ प्रोवाइडर-स्वामित्व वाले टूल और मेटाडेटा को यथावत आगे भेजती हैं। `plugin-sdk/provider-test-contracts` से आयात करें         |
| `runRealtimeSttLiveTest`                             | साझा ऑडियो फ़िक्स्चर के साथ लाइव रियलटाइम STT प्रोवाइडर परीक्षण चलाएँ। `plugin-sdk/provider-test-contracts` से आयात करें                       |
| `normalizeTranscriptForMatch`                        | फ़ज़ी अभिकथनों से पहले लाइव ट्रांसक्रिप्ट आउटपुट को सामान्यीकृत करें। `plugin-sdk/provider-test-contracts` से आयात करें                               |
| `expectExplicitVideoGenerationCapabilities`          | अभिकथन करें कि वीडियो प्रोवाइडर स्पष्ट जनरेशन मोड क्षमताएँ घोषित करते हैं। `plugin-sdk/provider-test-contracts` से आयात करें                   |
| `expectExplicitMusicGenerationCapabilities`          | अभिकथन करें कि संगीत प्रोवाइडर स्पष्ट जनरेशन/संपादन क्षमताएँ घोषित करते हैं। `plugin-sdk/provider-test-contracts` से आयात करें                   |
| `mockSuccessfulDashscopeVideoTask`                   | सफल DashScope-संगत वीडियो कार्य प्रतिक्रिया इंस्टॉल करें। `plugin-sdk/provider-test-contracts` से आयात करें                          |
| `getProviderHttpMocks`                               | स्वैच्छिक प्रोवाइडर HTTP/प्रमाणीकरण Vitest मॉक तक पहुँचें। `plugin-sdk/provider-http-test-mocks` से आयात करें                                         |
| `installProviderHttpMockCleanup`                     | प्रत्येक परीक्षण के बाद प्रोवाइडर HTTP/प्रमाणीकरण मॉक रीसेट करें। `plugin-sdk/provider-http-test-mocks` से आयात करें                                        |
| `installCommonResolveTargetErrorCases`               | लक्ष्य समाधान त्रुटि प्रबंधन के लिए साझा परीक्षण मामले। `plugin-sdk/channel-target-testing` से आयात करें                                  |
| `shouldAckReaction`                                  | जाँचें कि क्या किसी चैनल को अभिस्वीकृति प्रतिक्रिया जोड़नी चाहिए। `plugin-sdk/channel-feedback` से आयात करें                                            |
| `removeAckReactionAfterReply`                        | उत्तर डिलीवरी के बाद अभिस्वीकृति प्रतिक्रिया हटाएँ। `plugin-sdk/channel-feedback` से आयात करें                                                      |
| `createTestRegistry`                                 | चैनल Plugin रजिस्ट्री फ़िक्स्चर बनाएँ। `plugin-sdk/plugin-test-runtime` या `plugin-sdk/channel-test-helpers` से आयात करें               |
| `createEmptyPluginRegistry`                          | खाली Plugin रजिस्ट्री फ़िक्स्चर बनाएँ। `plugin-sdk/plugin-test-runtime` या `plugin-sdk/channel-test-helpers` से आयात करें                |
| `setActivePluginRegistry`                            | Plugin रनटाइम परीक्षणों के लिए रजिस्ट्री फ़िक्स्चर इंस्टॉल करें। `plugin-sdk/plugin-test-runtime` या `plugin-sdk/channel-test-helpers` से आयात करें   |
| `createRequestCaptureJsonFetch`                      | मीडिया सहायक परीक्षणों में JSON फ़ेच अनुरोध कैप्चर करें। `plugin-sdk/test-env` से आयात करें                                                     |
| `withServer`                                         | अस्थायी स्थानीय HTTP सर्वर के विरुद्ध परीक्षण चलाएँ। `plugin-sdk/test-env` से आयात करें                                                      |
| `createMockIncomingRequest`                          | न्यूनतम इनकमिंग HTTP अनुरोध ऑब्जेक्ट बनाएँ। `plugin-sdk/test-env` से आयात करें                                                          |
| `withFetchPreconnect`                                | प्रीकनेक्ट हुक इंस्टॉल करके फ़ेच परीक्षण चलाएँ। `plugin-sdk/test-env` से आयात करें                                                       |
| `withEnv` / `withEnvAsync`                           | परिवेश चर अस्थायी रूप से पैच करें। `plugin-sdk/test-env` से आयात करें                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | पृथक फ़ाइल-सिस्टम परीक्षण फ़िक्स्चर बनाएँ। `plugin-sdk/test-env` से आयात करें                                                              |
| `createMockServerResponse`                           | न्यूनतम HTTP सर्वर प्रतिक्रिया मॉक बनाएँ। `plugin-sdk/test-env` से आयात करें                                                            |
| `createProviderUsageFetch`                           | प्रोवाइडर उपयोग फ़ेच फ़िक्स्चर बनाएँ। `plugin-sdk/test-env` से आयात करें                                                                   |
| `useFrozenTime` / `useRealTime`                      | समय-संवेदी परीक्षणों के लिए टाइमर फ़्रीज़ और पुनर्स्थापित करें। `plugin-sdk/test-env` से आयात करें                                                    |
| `createCliRuntimeCapture`                            | परीक्षणों में CLI रनटाइम आउटपुट कैप्चर करें। `plugin-sdk/test-fixtures` से आयात करें                                                              |
| `importFreshModule`                                  | मॉड्यूल कैश को बायपास करने के लिए नए क्वेरी टोकन के साथ ESM मॉड्यूल आयात करें। `plugin-sdk/test-fixtures` से आयात करें                             |
| `bundledPluginRoot` / `bundledPluginFile`            | बंडल किए गए Plugin स्रोत या dist फ़िक्स्चर पथों का समाधान करें। `plugin-sdk/test-fixtures` से आयात करें                                              |
| `mockNodeBuiltinModule`                              | सीमित Node बिल्ट-इन Vitest मॉक इंस्टॉल करें। `plugin-sdk/test-node-mocks` से आयात करें                                                       |
| `createSandboxTestContext`                           | सैंडबॉक्स परीक्षण संदर्भ बनाएँ। `plugin-sdk/test-fixtures` से आयात करें                                                                      |
| `writeSkill`                                         | स्किल फ़िक्स्चर लिखें। `plugin-sdk/test-fixtures` से आयात करें                                                                             |
| `makeAgentAssistantMessage`                          | एजेंट ट्रांसक्रिप्ट संदेश फ़िक्स्चर बनाएँ। `plugin-sdk/test-fixtures` से आयात करें                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | सिस्टम ईवेंट फ़िक्स्चर का निरीक्षण और रीसेट करें। `plugin-sdk/test-fixtures` से आयात करें                                                          |
| `sanitizeTerminalText`                               | अभिकथनों के लिए टर्मिनल आउटपुट सैनिटाइज़ करें। `plugin-sdk/test-fixtures` से आयात करें                                                          |
| `countLines` / `hasBalancedFences`                   | चंकिंग आउटपुट संरचना का अभिकथन करें। `plugin-sdk/test-fixtures` से आयात करें                                                                     |
| `typedCases`                                         | टेबल-संचालित परीक्षणों के लिए लिटरल प्रकार संरक्षित रखें। `plugin-sdk/test-fixtures` से आयात करें                                                    |

बंडल किए गए Plugin की अनुबंध सुइट केवल-परीक्षण रजिस्ट्री, मैनिफ़ेस्ट,
सार्वजनिक आर्टिफ़ैक्ट और रनटाइम फ़िक्स्चर सहायकों के लिए इन SDK परीक्षण उपपथों का भी उपयोग करती हैं।
बंडल की गई OpenClaw इन्वेंट्री पर निर्भर केवल-कोर सुइट इसके बजाय
`src/plugins/contracts` के अंतर्गत रहती हैं।

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

चैनल लक्ष्य समाधान के लिए मानक त्रुटि मामले जोड़ने हेतु `installCommonResolveTargetErrorCases` का उपयोग करें:

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

  // चैनल-विशिष्ट परीक्षण मामले जोड़ें
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## परीक्षण पैटर्न

### पंजीकरण अनुबंधों का परीक्षण

`register(api)` को हस्तलिखित `api` मॉक देने वाले यूनिट परीक्षण OpenClaw के लोडर स्वीकृति गेट का परीक्षण नहीं करते। आपका Plugin जिस प्रत्येक पंजीकरण सतह पर निर्भर करता है, उसके लिए कम-से-कम एक लोडर-समर्थित स्मोक परीक्षण जोड़ें, विशेषकर हुक और मेमोरी जैसी विशिष्ट क्षमताओं के लिए।

आवश्यक मेटाडेटा अनुपस्थित होने पर या जब कोई Plugin ऐसी क्षमता API को कॉल करता है जिसका वह स्वामी नहीं है, तो वास्तविक लोडर Plugin पंजीकरण को विफल कर देता है। उदाहरण के लिए, `api.registerHook(...)` को हुक नाम की आवश्यकता होती है, और `api.registerMemoryCapability(...)` के लिए Plugin मैनिफ़ेस्ट या निर्यातित प्रविष्टि में `kind: "memory"` घोषित होना आवश्यक है।

### रनटाइम कॉन्फ़िगरेशन पहुँच का परीक्षण

`openclaw/plugin-sdk/plugin-test-runtime` से साझा Plugin रनटाइम मॉक को प्राथमिकता दें। इसके `runtime.config.loadConfig()` और `runtime.config.writeConfigFile(...)` मॉक डिफ़ॉल्ट रूप से त्रुटि उत्पन्न करते हैं, ताकि परीक्षण बहिष्कृत संगतता API के नए उपयोग का पता लगा सकें। इन मॉक को केवल तभी ओवरराइड करें, जब परीक्षण स्पष्ट रूप से लेगेसी संगतता व्यवहार को जाँच रहा हो।

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

### Plugin रनटाइम को मॉक करना

`createPluginRuntimeStore` का उपयोग करने वाले कोड के लिए, परीक्षणों में रनटाइम को मॉक करें:

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

## अनुबंध परीक्षण (रेपो के अंतर्गत Plugin)

बंडल किए गए Plugin में पंजीकरण स्वामित्व सत्यापित करने वाले अनुबंध परीक्षण होते हैं:

```bash
pnpm test src/plugins/contracts/
```

ये परीक्षण निम्नलिखित की पुष्टि करते हैं:

- कौन-से Plugin किन प्रदाताओं को पंजीकृत करते हैं
- कौन-से Plugin किन वाक् प्रदाताओं को पंजीकृत करते हैं
- पंजीकरण संरचना की शुद्धता
- रनटाइम अनुबंध का अनुपालन

### सीमित-दायरे वाले परीक्षण चलाना

किसी विशिष्ट Plugin के लिए:

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

केवल अनुबंध परीक्षणों के लिए:

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## लिंट प्रवर्तन (रेपो के अंतर्गत Plugin)

`scripts/run-additional-boundary-checks.mjs` CI में `lint:plugins:*` आयात-सीमा जाँचों का एक समूह चलाता है; प्रत्येक को स्थानीय रूप से स्वतंत्र रूप में भी चलाया जा सकता है:

| कमांड                                                        | लागू करता है                                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | बंडल किए गए Plugin अखंड `openclaw/plugin-sdk` रूट बैरल को आयात नहीं कर सकते।             |
| `pnpm run lint:plugins:no-extension-src-imports`               | उत्पादन एक्सटेंशन फ़ाइलें रेपो की `src/**` ट्री को सीधे आयात नहीं कर सकतीं (`../../src/...`)। |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | एक्सटेंशन परीक्षण फ़ाइलें `plugin-sdk/test-utils` या केवल-कोर वाले अन्य परीक्षण सहायक आयात नहीं कर सकतीं। |

बाहरी Plugin पर ये लिंट नियम लागू नहीं होते, लेकिन समान पैटर्न का पालन करने की अनुशंसा की जाती है।

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

यदि स्थानीय रूप से चलाने से मेमोरी पर दबाव पड़ता है:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## संबंधित

- [SDK अवलोकन](/hi/plugins/sdk-overview) -- आयात परिपाटियाँ
- [SDK चैनल Plugin](/hi/plugins/sdk-channel-plugins) -- चैनल Plugin इंटरफ़ेस
- [SDK प्रदाता Plugin](/hi/plugins/sdk-provider-plugins) -- प्रदाता Plugin हुक
- [Plugin बनाना](/hi/plugins/building-plugins) -- आरंभिक मार्गदर्शिका
