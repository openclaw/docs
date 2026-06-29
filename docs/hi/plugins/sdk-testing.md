---
read_when:
    - आप किसी Plugin के लिए परीक्षण लिख रहे हैं
    - आपको Plugin SDK से परीक्षण उपयोगिताओं की आवश्यकता है
    - आप bundled plugins के लिए contract tests को समझना चाहते हैं
sidebarTitle: Testing
summary: OpenClaw plugins के लिए परीक्षण उपयोगिताएँ और पैटर्न
title: Plugin परीक्षण
x-i18n:
    generated_at: "2026-06-28T23:53:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e5f77e9c54a56c9af293061e2cff0ee6112f2b9b4bea3f9604d48b0f05049ef
    source_path: plugins/sdk-testing.md
    workflow: 16
---

OpenClaw
plugins के लिए test utilities, patterns, और lint enforcement का संदर्भ।

<Tip>
  **test examples खोज रहे हैं?** how-to guides में worked test examples शामिल हैं:
  [Channel plugin tests](/hi/plugins/sdk-channel-plugins#step-6-test) और
  [Provider plugin tests](/hi/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Test utilities

ये test-helper subpaths OpenClaw के अपने bundled plugin tests के लिए repo-local source entrypoints हैं। वे third-party plugins के लिए package exports नहीं हैं, और
वे Vitest या अन्य repo-only test dependencies import कर सकते हैं।

**Plugin API mock import:** `openclaw/plugin-sdk/plugin-test-api`

**Agent runtime contract import:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Channel contract import:** `openclaw/plugin-sdk/channel-contract-testing`

**Channel test helper import:** `openclaw/plugin-sdk/channel-test-helpers`

**Channel target test import:** `openclaw/plugin-sdk/channel-target-testing`

**Plugin contract import:** `openclaw/plugin-sdk/plugin-test-contracts`

**Plugin runtime test import:** `openclaw/plugin-sdk/plugin-test-runtime`

**Provider contract import:** `openclaw/plugin-sdk/provider-test-contracts`

**Provider HTTP mock import:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Environment/network test import:** `openclaw/plugin-sdk/test-env`

**Generic fixture import:** `openclaw/plugin-sdk/test-fixtures`

**Node builtin mock import:** `openclaw/plugin-sdk/test-node-mocks`

OpenClaw repo के अंदर, नए bundled
plugin tests के लिए नीचे दिए गए focused subpaths को प्राथमिकता दें। विस्तृत
`openclaw/plugin-sdk/testing` barrel केवल legacy compatibility के लिए है।
Repo guardrails `plugin-sdk/testing` और
`plugin-sdk/test-utils` से नए वास्तविक imports को अस्वीकार करते हैं; ये नाम compatibility-record tests के लिए केवल deprecated compatibility
surfaces के रूप में रहते हैं।

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

### उपलब्ध exports

| निर्यात                                               | उद्देश्य                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | सीधे रजिस्ट्रेशन यूनिट टेस्ट के लिए न्यूनतम Plugin API मॉक बनाएं। `plugin-sdk/plugin-test-api` से आयात करें                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | नेटिव एजेंट रनटाइम अडैप्टर के लिए साझा auth-profile अनुबंध फिक्स्चर। `plugin-sdk/agent-runtime-test-contracts` से आयात करें            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | नेटिव एजेंट रनटाइम अडैप्टर के लिए साझा डिलीवरी सप्रेशन अनुबंध फिक्स्चर। `plugin-sdk/agent-runtime-test-contracts` से आयात करें    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | नेटिव एजेंट रनटाइम अडैप्टर के लिए साझा fallback-classification अनुबंध फिक्स्चर। `plugin-sdk/agent-runtime-test-contracts` से आयात करें |
| `createParameterFreeTool`                            | नेटिव रनटाइम अनुबंध टेस्ट के लिए dynamic-tool स्कीमा फिक्स्चर बनाएं। `plugin-sdk/agent-runtime-test-contracts` से आयात करें              |
| `expectChannelInboundContextContract`                | चैनल इनबाउंड कॉन्टेक्स्ट आकार सत्यापित करें। `plugin-sdk/channel-contract-testing` से आयात करें                                                  |
| `installChannelOutboundPayloadContractSuite`         | चैनल आउटबाउंड पेलोड अनुबंध केस स्थापित करें। `plugin-sdk/channel-contract-testing` से आयात करें                                       |
| `createStartAccountContext`                          | चैनल अकाउंट lifecycle कॉन्टेक्स्ट बनाएं। `plugin-sdk/channel-test-helpers` से आयात करें                                                  |
| `installChannelActionsContractSuite`                 | सामान्य चैनल message-action अनुबंध केस स्थापित करें। `plugin-sdk/channel-test-helpers` से आयात करें                                     |
| `installChannelSetupContractSuite`                   | सामान्य चैनल setup अनुबंध केस स्थापित करें। `plugin-sdk/channel-test-helpers` से आयात करें                                              |
| `installChannelStatusContractSuite`                  | सामान्य चैनल status अनुबंध केस स्थापित करें। `plugin-sdk/channel-test-helpers` से आयात करें                                             |
| `expectDirectoryIds`                                 | directory-list फ़ंक्शन से चैनल डायरेक्टरी ids सत्यापित करें। `plugin-sdk/channel-test-helpers` से आयात करें                               |
| `assertBundledChannelEntries`                        | सत्यापित करें कि बंडल किए गए चैनल entrypoints अपेक्षित सार्वजनिक अनुबंध उजागर करते हैं। `plugin-sdk/channel-test-helpers` से आयात करें                    |
| `formatEnvelopeTimestamp`                            | नियतात्मक envelope timestamps फ़ॉर्मैट करें। `plugin-sdk/channel-test-helpers` से आयात करें                                                  |
| `expectPairingReplyText`                             | चैनल pairing reply text सत्यापित करें और उसका कोड निकालें। `plugin-sdk/channel-test-helpers` से आयात करें                                    |
| `describePluginRegistrationContract`                 | Plugin रजिस्ट्रेशन अनुबंध जांच स्थापित करें। `plugin-sdk/plugin-test-contracts` से आयात करें                                              |
| `registerSingleProviderPlugin`                       | लोडर स्मोक टेस्ट में एक प्रदाता Plugin रजिस्टर करें। `plugin-sdk/plugin-test-runtime` से आयात करें                                         |
| `registerProviderPlugin`                             | एक Plugin से सभी प्रदाता प्रकार कैप्चर करें। `plugin-sdk/plugin-test-runtime` से आयात करें                                                 |
| `registerProviderPlugins`                            | कई Plugins में प्रदाता रजिस्ट्रेशन कैप्चर करें। `plugin-sdk/plugin-test-runtime` से आयात करें                                     |
| `requireRegisteredProvider`                          | सत्यापित करें कि प्रदाता संग्रह में एक id शामिल है। `plugin-sdk/plugin-test-runtime` से आयात करें                                           |
| `createRuntimeEnv`                                   | मॉक किया गया CLI/Plugin रनटाइम वातावरण बनाएं। `plugin-sdk/plugin-test-runtime` से आयात करें                                              |
| `createPluginRuntimeMock`                            | मॉक किया गया Plugin रनटाइम सतह बनाएं। `plugin-sdk/plugin-test-runtime` से आयात करें                                                      |
| `createPluginSetupWizardStatus`                      | चैनल Plugins के लिए setup status helpers बनाएं। `plugin-sdk/plugin-test-runtime` से आयात करें                                             |
| `describeOpenAIProviderRuntimeContract`              | provider-family रनटाइम अनुबंध जांच स्थापित करें। `plugin-sdk/provider-test-contracts` से आयात करें                                        |
| `expectPassthroughReplayPolicy`                      | सत्यापित करें कि प्रदाता replay policies, provider-owned tools और metadata को पास थ्रू करती हैं। `plugin-sdk/provider-test-contracts` से आयात करें         |
| `runRealtimeSttLiveTest`                             | साझा audio fixtures के साथ लाइव realtime STT प्रदाता टेस्ट चलाएं। `plugin-sdk/provider-test-contracts` से आयात करें                       |
| `normalizeTranscriptForMatch`                        | fuzzy assertions से पहले लाइव transcript आउटपुट सामान्यीकृत करें। `plugin-sdk/provider-test-contracts` से आयात करें                               |
| `expectExplicitVideoGenerationCapabilities`          | सत्यापित करें कि वीडियो प्रदाता स्पष्ट generation mode capabilities घोषित करते हैं। `plugin-sdk/provider-test-contracts` से आयात करें                   |
| `expectExplicitMusicGenerationCapabilities`          | सत्यापित करें कि संगीत प्रदाता स्पष्ट generation/edit capabilities घोषित करते हैं। `plugin-sdk/provider-test-contracts` से आयात करें                   |
| `mockSuccessfulDashscopeVideoTask`                   | सफल DashScope-संगत वीडियो task response स्थापित करें। `plugin-sdk/provider-test-contracts` से आयात करें                          |
| `getProviderHttpMocks`                               | opt-in प्रदाता HTTP/auth Vitest mocks तक पहुंचें। `plugin-sdk/provider-http-test-mocks` से आयात करें                                         |
| `installProviderHttpMockCleanup`                     | प्रत्येक टेस्ट के बाद प्रदाता HTTP/auth mocks रीसेट करें। `plugin-sdk/provider-http-test-mocks` से आयात करें                                        |
| `installCommonResolveTargetErrorCases`               | target resolution error handling के लिए साझा टेस्ट केस। `plugin-sdk/channel-target-testing` से आयात करें                                  |
| `shouldAckReaction`                                  | जांचें कि चैनल को ack reaction जोड़ना चाहिए या नहीं। `plugin-sdk/channel-feedback` से आयात करें                                            |
| `removeAckReactionAfterReply`                        | reply delivery के बाद ack reaction हटाएं। `plugin-sdk/channel-feedback` से आयात करें                                                      |
| `createTestRegistry`                                 | चैनल Plugin registry फिक्स्चर बनाएं। `plugin-sdk/plugin-test-runtime` या `plugin-sdk/channel-test-helpers` से आयात करें               |
| `createEmptyPluginRegistry`                          | खाली Plugin registry फिक्स्चर बनाएं। `plugin-sdk/plugin-test-runtime` या `plugin-sdk/channel-test-helpers` से आयात करें                |
| `setActivePluginRegistry`                            | Plugin रनटाइम टेस्ट के लिए registry फिक्स्चर स्थापित करें। `plugin-sdk/plugin-test-runtime` या `plugin-sdk/channel-test-helpers` से आयात करें   |
| `createRequestCaptureJsonFetch`                      | media helper टेस्ट में JSON fetch requests कैप्चर करें। `plugin-sdk/test-env` से आयात करें                                                     |
| `withServer`                                         | अस्थायी local HTTP server के विरुद्ध टेस्ट चलाएं। `plugin-sdk/test-env` से आयात करें                                                      |
| `createMockIncomingRequest`                          | न्यूनतम incoming HTTP request object बनाएं। `plugin-sdk/test-env` से आयात करें                                                          |
| `withFetchPreconnect`                                | preconnect hooks इंस्टॉल किए हुए fetch टेस्ट चलाएं। `plugin-sdk/test-env` से आयात करें                                                       |
| `withEnv` / `withEnvAsync`                           | environment variables को अस्थायी रूप से पैच करें। `plugin-sdk/test-env` से आयात करें                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | अलग-थलग filesystem test fixtures बनाएं। `plugin-sdk/test-env` से आयात करें                                                              |
| `createMockServerResponse`                           | न्यूनतम HTTP server response mock बनाएं। `plugin-sdk/test-env` से आयात करें                                                            |
| `createCliRuntimeCapture`                            | टेस्ट में CLI रनटाइम आउटपुट कैप्चर करें। `plugin-sdk/test-fixtures` से आयात करें                                                              |
| `importFreshModule`                                  | module cache को बायपास करने के लिए fresh query token के साथ ESM module आयात करें। `plugin-sdk/test-fixtures` से आयात करें                             |
| `bundledPluginRoot` / `bundledPluginFile`            | बंडल किए गए Plugin source या dist fixture paths resolve करें। `plugin-sdk/test-fixtures` से आयात करें                                              |
| `mockNodeBuiltinModule`                              | narrow Node builtin Vitest mocks स्थापित करें। `plugin-sdk/test-node-mocks` से आयात करें                                                       |
| `createSandboxTestContext`                           | sandbox test contexts बनाएं। `plugin-sdk/test-fixtures` से आयात करें                                                                      |
| `writeSkill`                                         | skill fixtures लिखें। `plugin-sdk/test-fixtures` से आयात करें                                                                             |
| `makeAgentAssistantMessage`                          | एजेंट transcript message fixtures बनाएं। `plugin-sdk/test-fixtures` से आयात करें                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | system event fixtures का निरीक्षण करें और उन्हें रीसेट करें। `plugin-sdk/test-fixtures` से आयात करें                                                          |
| `sanitizeTerminalText`                               | assertions के लिए terminal output साफ करें। `plugin-sdk/test-fixtures` से आयात करें                                                          |
| `countLines` / `hasBalancedFences`                   | chunking output shape सत्यापित करें। `plugin-sdk/test-fixtures` से आयात करें                                                                     |
| `runProviderCatalog`                                 | टेस्ट dependencies के साथ provider catalog hook निष्पादित करें                                                                                   |
| `resolveProviderWizardOptions`                       | अनुबंध टेस्ट में provider setup wizard choices resolve करें                                                                                  |
| `resolveProviderModelPickerEntries`                  | अनुबंध टेस्ट में provider model-picker entries resolve करें                                                                                  |
| `buildProviderPluginMethodChoice`                    | assertions के लिए provider wizard choice ids बनाएं                                                                                          |
| `setProviderWizardProvidersResolverForTest`          | अलग-थलग परीक्षणों के लिए प्रदाता विज़ार्ड प्रदाता इंजेक्ट करें                                                                                      |
| `createProviderUsageFetch`                           | प्रदाता उपयोग fetch fixtures बनाएँ                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | समय-संवेदनशील परीक्षणों के लिए timers को freeze और restore करें। `plugin-sdk/test-env` से import करें                                                    |
| `createTestWizardPrompter`                           | mocked setup wizard prompter बनाएँ                                                                                                     |
| `createRuntimeTaskFlow`                              | अलग-थलग runtime task-flow स्थिति बनाएँ                                                                                                  |
| `typedCases`                                         | table-driven परीक्षणों के लिए literal types सुरक्षित रखें। `plugin-sdk/test-fixtures` से import करें                                                    |

बंडल किए गए Plugin की कॉन्ट्रैक्ट suites भी केवल-टेस्ट
रजिस्ट्री, मैनिफेस्ट, सार्वजनिक-आर्टिफैक्ट, और runtime fixture helpers के लिए SDK testing subpaths का उपयोग करती हैं। केवल-कोर
suites जो बंडल किए गए OpenClaw inventory पर निर्भर हैं, `src/plugins/contracts` के अंतर्गत रहती हैं।
नए extension tests को सीधे broad `plugin-sdk/testing` compatibility barrel, repo `src/**` files, या repo
`test/helpers/*` bridges import करने के बजाय किसी documented focused SDK subpath जैसे
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env`, या `plugin-sdk/test-fixtures` पर रखें।

### प्रकार

Focused testing subpaths test files में उपयोगी types को भी फिर से export करते हैं:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Testing target resolution

Channel target resolution के लिए standard error cases जोड़ने हेतु `installCommonResolveTargetErrorCases` का उपयोग करें:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Your channel's target resolution logic
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Add channel-specific test cases
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## Testing patterns

### Registration contracts की testing

Unit tests जो `register(api)` को हाथ से लिखा हुआ `api` mock पास करते हैं, OpenClaw के loader acceptance gates को exercise नहीं करते।
आपके Plugin जिस प्रत्येक registration surface पर निर्भर करता है, उसके लिए कम से कम एक loader-backed smoke test जोड़ें, खासकर hooks और
memory जैसी exclusive capabilities के लिए।

जब required metadata missing हो या कोई Plugin ऐसी capability API call करे जिसकी ownership उसके पास नहीं है, तो real loader Plugin registration fail कर देता है। उदाहरण के लिए,
`api.registerHook(...)` को hook name चाहिए, और
`api.registerMemoryCapability(...)` के लिए Plugin manifest या exported
entry में `kind: "memory"` declare होना चाहिए।

### Runtime config access की testing

`openclaw/plugin-sdk/plugin-test-runtime` से shared Plugin runtime mock को प्राथमिकता दें।
इसके deprecated `runtime.config.loadConfig()` और `runtime.config.writeConfigFile(...)`
mocks default रूप से throw करते हैं ताकि tests compatibility APIs के नए usage पकड़ सकें। उन mocks को केवल तब override करें
जब test स्पष्ट रूप से legacy compatibility behavior cover कर रहा हो।

### Channel Plugin की unit testing

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
    // No token value exposed
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Provider Plugin की unit testing

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider plugin", () => {
  it("should resolve dynamic models", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... context
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... context
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Plugin runtime को mock करना

`createPluginRuntimeStore` का उपयोग करने वाले code के लिए, tests में runtime को mock करें:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "test runtime not set",
});

// In test setup
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... other mocks
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... other namespaces
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// After tests
store.clearRuntime();
```

### Per-instance stubs के साथ testing

Prototype mutation के बजाय per-instance stubs को प्राथमिकता दें:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Contract tests (repo के भीतर Plugin)

बंडल किए गए Plugin में contract tests होते हैं जो registration ownership verify करते हैं:

```bash
pnpm test -- src/plugins/contracts/
```

ये tests assert करते हैं:

- कौन-से Plugin कौन-से providers register करते हैं
- कौन-से Plugin कौन-से speech providers register करते हैं
- Registration shape correctness
- Runtime contract compliance

### Scoped tests चलाना

किसी specific Plugin के लिए:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

केवल contract tests के लिए:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Lint enforcement (repo के भीतर Plugin)

Repo के भीतर Plugin के लिए `pnpm check` द्वारा तीन rules enforce किए जाते हैं:

1. **Monolithic root imports नहीं** -- `openclaw/plugin-sdk` root barrel reject किया जाता है
2. **Direct `src/` imports नहीं** -- Plugin सीधे `../../src/` import नहीं कर सकते
3. **Self-imports नहीं** -- Plugin अपना ही `plugin-sdk/<name>` subpath import नहीं कर सकते

बाहरी Plugin इन lint rules के अधीन नहीं हैं, लेकिन वही
patterns follow करने की सलाह दी जाती है।

## Test configuration

OpenClaw V8 coverage thresholds के साथ Vitest का उपयोग करता है। Plugin tests के लिए:

```bash
# Run all tests
pnpm test

# Run specific plugin tests
pnpm test -- <bundled-plugin-root>/my-channel/src/channel.test.ts

# Run with a specific test name filter
pnpm test -- <bundled-plugin-root>/my-channel/ -t "resolves account"

# Run with coverage
pnpm test:coverage
```

यदि local runs memory pressure पैदा करते हैं:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## संबंधित

- [SDK अवलोकन](/hi/plugins/sdk-overview) -- import conventions
- [SDK Channel Plugins](/hi/plugins/sdk-channel-plugins) -- channel Plugin interface
- [SDK Provider Plugins](/hi/plugins/sdk-provider-plugins) -- provider Plugin hooks
- [Plugins बनाना](/hi/plugins/building-plugins) -- getting started guide
