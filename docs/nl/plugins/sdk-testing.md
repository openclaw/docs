---
read_when:
    - Je schrijft tests voor een Plugin
    - Je hebt testhulpprogramma's uit de plugin-SDK nodig
    - Je wilt contracttests voor gebundelde plugins begrijpen
sidebarTitle: Testing
summary: Testhulpmiddelen en patronen voor OpenClaw-plugins
title: Plugin testen
x-i18n:
    generated_at: "2026-06-28T07:42:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e5f77e9c54a56c9af293061e2cff0ee6112f2b9b4bea3f9604d48b0f05049ef
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referentie voor testhulpprogramma's, patronen en lint-handhaving voor OpenClaw-
plugins.

<Tip>
  **Op zoek naar testvoorbeelden?** De handleidingen bevatten uitgewerkte testvoorbeelden:
  [Channel-plugintests](/nl/plugins/sdk-channel-plugins#step-6-test) en
  [Provider-plugintests](/nl/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Testhulpprogramma's

Deze subpaden voor testhelpers zijn repo-lokale brontoegangspunten voor OpenClaw's eigen
meegeleverde plugintests. Het zijn geen pakketexporten voor plugins van derden, en
ze kunnen Vitest of andere testafhankelijkheden importeren die alleen in de repo bestaan.

**Mockimport voor Plugin-API:** `openclaw/plugin-sdk/plugin-test-api`

**Import voor agent-runtimecontract:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Import voor channelcontract:** `openclaw/plugin-sdk/channel-contract-testing`

**Import voor channel-testhelper:** `openclaw/plugin-sdk/channel-test-helpers`

**Import voor channel-doeltest:** `openclaw/plugin-sdk/channel-target-testing`

**Import voor Plugin-contract:** `openclaw/plugin-sdk/plugin-test-contracts`

**Import voor Plugin-runtimetest:** `openclaw/plugin-sdk/plugin-test-runtime`

**Import voor providercontract:** `openclaw/plugin-sdk/provider-test-contracts`

**Import voor provider-HTTP-mock:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Import voor omgevings-/netwerktest:** `openclaw/plugin-sdk/test-env`

**Import voor generieke fixture:** `openclaw/plugin-sdk/test-fixtures`

**Import voor ingebouwde Node-mock:** `openclaw/plugin-sdk/test-node-mocks`

Gebruik binnen de OpenClaw-repo bij voorkeur de gerichte subpaden hieronder voor nieuwe meegeleverde
plugintests. De brede
`openclaw/plugin-sdk/testing`-verzamelmodule is alleen voor verouderde compatibiliteit.
Repo-beschermingsregels weigeren nieuwe echte imports uit `plugin-sdk/testing` en
`plugin-sdk/test-utils`; die namen blijven alleen bestaan als verouderde compatibiliteitsoppervlakken
voor tests met compatibiliteitsrecords.

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

### Beschikbare exporten

| Export                                               | Doel                                                                                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `createTestPluginApi`                                | Bouw een minimale mock voor de Plugin-API voor unit tests met directe registratie. Importeer uit `plugin-sdk/plugin-test-api`              |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Gedeelde auth-profiel-contractfixture voor native agent-runtimeadapters. Importeer uit `plugin-sdk/agent-runtime-test-contracts`           |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Gedeelde contractfixture voor afleveringsonderdrukking voor native agent-runtimeadapters. Importeer uit `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Gedeelde contractfixture voor fallback-classificatie voor native agent-runtimeadapters. Importeer uit `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Bouw dynamic-tool-schemafixtures voor native runtime-contracttests. Importeer uit `plugin-sdk/agent-runtime-test-contracts`                |
| `expectChannelInboundContextContract`                | Controleer de vorm van de inbound-context van het kanaal. Importeer uit `plugin-sdk/channel-contract-testing`                              |
| `installChannelOutboundPayloadContractSuite`         | Installeer contractcases voor outbound-payloads van kanalen. Importeer uit `plugin-sdk/channel-contract-testing`                           |
| `createStartAccountContext`                          | Bouw kanaalaccount-lifecyclecontexten. Importeer uit `plugin-sdk/channel-test-helpers`                                                     |
| `installChannelActionsContractSuite`                 | Installeer generieke contractcases voor berichtacties van kanalen. Importeer uit `plugin-sdk/channel-test-helpers`                        |
| `installChannelSetupContractSuite`                   | Installeer generieke contractcases voor kanaalsetup. Importeer uit `plugin-sdk/channel-test-helpers`                                      |
| `installChannelStatusContractSuite`                  | Installeer generieke contractcases voor kanaalstatus. Importeer uit `plugin-sdk/channel-test-helpers`                                     |
| `expectDirectoryIds`                                 | Controleer kanaaldirectory-id's uit een directory-list-functie. Importeer uit `plugin-sdk/channel-test-helpers`                           |
| `assertBundledChannelEntries`                        | Controleer of gebundelde kanaalentrypoints het verwachte publieke contract blootstellen. Importeer uit `plugin-sdk/channel-test-helpers`   |
| `formatEnvelopeTimestamp`                            | Formatteer deterministische enveloptijdstempels. Importeer uit `plugin-sdk/channel-test-helpers`                                          |
| `expectPairingReplyText`                             | Controleer de antwoordtekst voor kanaalkoppeling en extraheer de code. Importeer uit `plugin-sdk/channel-test-helpers`                    |
| `describePluginRegistrationContract`                 | Installeer contractcontroles voor Plugin-registratie. Importeer uit `plugin-sdk/plugin-test-contracts`                                    |
| `registerSingleProviderPlugin`                       | Registreer één provider-Plugin in loader-smoketests. Importeer uit `plugin-sdk/plugin-test-runtime`                                       |
| `registerProviderPlugin`                             | Leg alle providertypen uit één Plugin vast. Importeer uit `plugin-sdk/plugin-test-runtime`                                                |
| `registerProviderPlugins`                            | Leg providerregistraties over meerdere Plugins vast. Importeer uit `plugin-sdk/plugin-test-runtime`                                       |
| `requireRegisteredProvider`                          | Controleer of een providercollectie een id bevat. Importeer uit `plugin-sdk/plugin-test-runtime`                                         |
| `createRuntimeEnv`                                   | Bouw een gemockte CLI-/Plugin-runtimeomgeving. Importeer uit `plugin-sdk/plugin-test-runtime`                                             |
| `createPluginRuntimeMock`                            | Bouw een gemockt Plugin-runtimeoppervlak. Importeer uit `plugin-sdk/plugin-test-runtime`                                                  |
| `createPluginSetupWizardStatus`                      | Bouw setupstatushelpers voor kanaal-Plugins. Importeer uit `plugin-sdk/plugin-test-runtime`                                               |
| `describeOpenAIProviderRuntimeContract`              | Installeer runtime-contractcontroles voor providerfamilies. Importeer uit `plugin-sdk/provider-test-contracts`                            |
| `expectPassthroughReplayPolicy`                      | Controleer of provider-replaybeleid provider-eigen tools en metadata doorgeeft. Importeer uit `plugin-sdk/provider-test-contracts`        |
| `runRealtimeSttLiveTest`                             | Voer een live realtime-STT-providertest uit met gedeelde audiofixtures. Importeer uit `plugin-sdk/provider-test-contracts`                |
| `normalizeTranscriptForMatch`                        | Normaliseer live transcriptuitvoer vóór fuzzy assertions. Importeer uit `plugin-sdk/provider-test-contracts`                              |
| `expectExplicitVideoGenerationCapabilities`          | Controleer of videoproviders expliciete mogelijkheden voor generatiemodi declareren. Importeer uit `plugin-sdk/provider-test-contracts`   |
| `expectExplicitMusicGenerationCapabilities`          | Controleer of muziekproviders expliciete mogelijkheden voor generatie/bewerking declareren. Importeer uit `plugin-sdk/provider-test-contracts` |
| `mockSuccessfulDashscopeVideoTask`                   | Installeer een succesvolle DashScope-compatibele videotaakrespons. Importeer uit `plugin-sdk/provider-test-contracts`                    |
| `getProviderHttpMocks`                               | Gebruik opt-in HTTP-/auth-Vitest-mocks voor providers. Importeer uit `plugin-sdk/provider-http-test-mocks`                                |
| `installProviderHttpMockCleanup`                     | Reset HTTP-/auth-mocks voor providers na elke test. Importeer uit `plugin-sdk/provider-http-test-mocks`                                  |
| `installCommonResolveTargetErrorCases`               | Gedeelde testcases voor foutafhandeling bij targetresolutie. Importeer uit `plugin-sdk/channel-target-testing`                            |
| `shouldAckReaction`                                  | Controleer of een kanaal een ack-reactie moet toevoegen. Importeer uit `plugin-sdk/channel-feedback`                                     |
| `removeAckReactionAfterReply`                        | Verwijder de ack-reactie na aflevering van het antwoord. Importeer uit `plugin-sdk/channel-feedback`                                      |
| `createTestRegistry`                                 | Bouw een registry-fixture voor kanaal-Plugins. Importeer uit `plugin-sdk/plugin-test-runtime` of `plugin-sdk/channel-test-helpers`        |
| `createEmptyPluginRegistry`                          | Bouw een lege Plugin-registry-fixture. Importeer uit `plugin-sdk/plugin-test-runtime` of `plugin-sdk/channel-test-helpers`                |
| `setActivePluginRegistry`                            | Installeer een registry-fixture voor Plugin-runtimetests. Importeer uit `plugin-sdk/plugin-test-runtime` of `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                      | Leg JSON-fetchverzoeken vast in tests voor mediahelpers. Importeer uit `plugin-sdk/test-env`                                             |
| `withServer`                                         | Voer tests uit tegen een wegwerpbare lokale HTTP-server. Importeer uit `plugin-sdk/test-env`                                             |
| `createMockIncomingRequest`                          | Bouw een minimaal inkomend HTTP-requestobject. Importeer uit `plugin-sdk/test-env`                                                        |
| `withFetchPreconnect`                                | Voer fetchtests uit met geïnstalleerde preconnect-hooks. Importeer uit `plugin-sdk/test-env`                                             |
| `withEnv` / `withEnvAsync`                           | Pas omgevingsvariabelen tijdelijk aan. Importeer uit `plugin-sdk/test-env`                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Maak geïsoleerde filesystem-testfixtures. Importeer uit `plugin-sdk/test-env`                                                            |
| `createMockServerResponse`                           | Maak een minimale mock voor HTTP-serverresponses. Importeer uit `plugin-sdk/test-env`                                                    |
| `createCliRuntimeCapture`                            | Leg CLI-runtime-uitvoer vast in tests. Importeer uit `plugin-sdk/test-fixtures`                                                          |
| `importFreshModule`                                  | Importeer een ESM-module met een nieuwe querytoken om de modulecache te omzeilen. Importeer uit `plugin-sdk/test-fixtures`               |
| `bundledPluginRoot` / `bundledPluginFile`            | Los paden op naar gebundelde Plugin-source- of dist-fixtures. Importeer uit `plugin-sdk/test-fixtures`                                   |
| `mockNodeBuiltinModule`                              | Installeer smalle Vitest-mocks voor ingebouwde Node-modules. Importeer uit `plugin-sdk/test-node-mocks`                                  |
| `createSandboxTestContext`                           | Bouw sandbox-testcontexten. Importeer uit `plugin-sdk/test-fixtures`                                                                     |
| `writeSkill`                                         | Schrijf skill-fixtures. Importeer uit `plugin-sdk/test-fixtures`                                                                         |
| `makeAgentAssistantMessage`                          | Bouw berichtfixtures voor agenttranscripten. Importeer uit `plugin-sdk/test-fixtures`                                                    |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Inspecteer en reset systeemevent-fixtures. Importeer uit `plugin-sdk/test-fixtures`                                                      |
| `sanitizeTerminalText`                               | Saniteer terminaluitvoer voor assertions. Importeer uit `plugin-sdk/test-fixtures`                                                       |
| `countLines` / `hasBalancedFences`                   | Controleer de vorm van chunking-uitvoer. Importeer uit `plugin-sdk/test-fixtures`                                                        |
| `runProviderCatalog`                                 | Voer een provider-catalog-hook uit met testafhankelijkheden                                                                              |
| `resolveProviderWizardOptions`                       | Los provider-setupwizardkeuzes op in contracttests                                                                                       |
| `resolveProviderModelPickerEntries`                  | Los provider-modelpicker-items op in contracttests                                                                                       |
| `buildProviderPluginMethodChoice`                    | Bouw keuze-id's voor de providerwizard voor assertions                                                                                    |
| `setProviderWizardProvidersResolverForTest`          | Injecteer providerwizard-providers voor geïsoleerde tests                                                                                      |
| `createProviderUsageFetch`                           | Bouw providergebruiks-fetch-fixtures                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | Bevries en herstel timers voor tijdgevoelige tests. Importeer uit `plugin-sdk/test-env`                                                    |
| `createTestWizardPrompter`                           | Bouw een gemockte setupwizard-prompter                                                                                                     |
| `createRuntimeTaskFlow`                              | Maak geïsoleerde runtime-task-flowstatus aan                                                                                                  |
| `typedCases`                                         | Behoud letterlijke typen voor tabelgestuurde tests. Importeer uit `plugin-sdk/test-fixtures`                                                    |

Contracttestsuites voor gebundelde plugins gebruiken ook SDK-testsubpaden voor test-only
helpers voor registry, manifest, publieke artefacten en runtime-fixtures. Core-only
suites die afhankelijk zijn van de gebundelde OpenClaw-inventaris blijven onder `src/plugins/contracts`.
Houd nieuwe extensietests op een gedocumenteerd, gericht SDK-subpad zoals
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env` of `plugin-sdk/test-fixtures` in plaats van rechtstreeks de
brede `plugin-sdk/testing`-compatibility barrel, repo-`src/**`-bestanden of repo-
`test/helpers/*`-bridges te importeren.

### Typen

Gerichte testsubpaden exporteren ook typen opnieuw die nuttig zijn in testbestanden:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Doelresolutie testen

Gebruik `installCommonResolveTargetErrorCases` om standaardfoutgevallen toe te voegen voor
resolutie van kanaaldoelen:

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

## Testpatronen

### Registratiecontracten testen

Unittests die een handgeschreven `api`-mock doorgeven aan `register(api)` oefenen
de acceptatiegates van de OpenClaw-loader niet uit. Voeg ten minste één loader-backed smoke-test
toe voor elk registratieoppervlak waarvan je plugin afhankelijk is, vooral hooks en
exclusieve capabilities zoals memory.

De echte loader laat pluginregistratie mislukken wanneer vereiste metadata ontbreekt of een
plugin een capability-API aanroept die hij niet bezit. Bijvoorbeeld:
`api.registerHook(...)` vereist een hooknaam, en
`api.registerMemoryCapability(...)` vereist dat het pluginmanifest of de geëxporteerde
entry `kind: "memory"` declareert.

### Runtimeconfiguratietoegang testen

Geef de voorkeur aan de gedeelde plugin-runtimemock uit `openclaw/plugin-sdk/plugin-test-runtime`.
De verouderde `runtime.config.loadConfig()`- en `runtime.config.writeConfigFile(...)`-
mocks geven standaard een fout, zodat tests nieuw gebruik van compatibiliteits-API's opvangen. Overschrijf
die mocks alleen wanneer de test expliciet legacy-compatibiliteitsgedrag behandelt.

### Een kanaalplugin unit-testen

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

### Een providerplugin unit-testen

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

### De pluginruntime mocken

Voor code die `createPluginRuntimeStore` gebruikt, mock je de runtime in tests:

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

### Testen met per-instance stubs

Geef de voorkeur aan per-instance stubs boven prototypemutatie:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Contracttests (in-repo plugins)

Gebundelde plugins hebben contracttests die registratie-eigenaarschap verifiëren:

```bash
pnpm test -- src/plugins/contracts/
```

Deze tests controleren:

- Welke plugins welke providers registreren
- Welke plugins welke spraakproviders registreren
- Correctheid van de registratievorm
- Naleving van het runtimecontract

### Gescope tests uitvoeren

Voor een specifieke plugin:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Alleen voor contracttests:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Lintafdwinging (in-repo plugins)

Drie regels worden door `pnpm check` afgedwongen voor in-repo plugins:

1. **Geen monolithische root-imports** -- de `openclaw/plugin-sdk` root barrel wordt geweigerd
2. **Geen directe `src/`-imports** -- plugins kunnen `../../src/` niet rechtstreeks importeren
3. **Geen self-imports** -- plugins kunnen hun eigen `plugin-sdk/<name>`-subpad niet importeren

Externe plugins vallen niet onder deze lintregels, maar het volgen van dezelfde
patronen wordt aanbevolen.

## Testconfiguratie

OpenClaw gebruikt Vitest met V8-coveragedrempels. Voor plugintests:

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

Als lokale runs geheugendruk veroorzaken:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Gerelateerd

- [SDK-overzicht](/nl/plugins/sdk-overview) -- importconventies
- [SDK-kanaalplugins](/nl/plugins/sdk-channel-plugins) -- interface voor kanaalplugins
- [SDK-providerplugins](/nl/plugins/sdk-provider-plugins) -- providerplugin-hooks
- [Plugins bouwen](/nl/plugins/building-plugins) -- startgids
