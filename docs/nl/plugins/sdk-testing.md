---
read_when:
    - Je schrijft tests voor een Plugin
    - Je hebt testhulpprogramma's uit de Plugin-SDK nodig
    - Je wilt contracttests voor meegeleverde plugins begrijpen
sidebarTitle: Testing
summary: Testhulpmiddelen en patronen voor OpenClaw-plugins
title: Plugin testen
x-i18n:
    generated_at: "2026-04-29T23:06:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7edf81e7662784356fcb0f481dd3fcdde05cc59da2a6c1b38eae1008b3ead96c
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referentie voor testhulpprogramma's, patronen en lint-handhaving voor OpenClaw
plugins.

<Tip>
  **Op zoek naar testvoorbeelden?** De praktijkhandleidingen bevatten uitgewerkte testvoorbeelden:
  [Kanaalplugintests](/nl/plugins/sdk-channel-plugins#step-6-test) en
  [Provider-plugintests](/nl/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Testhulpprogramma's

**Plugin API-mockimport:** `openclaw/plugin-sdk/plugin-test-api`

**Import voor agent-runtimecontract:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Import voor kanaalcontract:** `openclaw/plugin-sdk/channel-contract-testing`

**Import voor kanaaltesthelper:** `openclaw/plugin-sdk/channel-test-helpers`

**Import voor kanaaldoeltest:** `openclaw/plugin-sdk/channel-target-testing`

**Import voor Plugin-contract:** `openclaw/plugin-sdk/plugin-test-contracts`

**Import voor Plugin-runtimetest:** `openclaw/plugin-sdk/plugin-test-runtime`

**Import voor providercontract:** `openclaw/plugin-sdk/provider-test-contracts`

**Import voor provider-HTTP-mock:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Import voor omgevings-/netwerktest:** `openclaw/plugin-sdk/test-env`

**Import voor generieke fixture:** `openclaw/plugin-sdk/test-fixtures`

**Import voor ingebouwde Node-mock:** `openclaw/plugin-sdk/test-node-mocks`

Geef voor nieuwe plugintests de voorkeur aan de gerichte subpaden hieronder. De brede
`openclaw/plugin-sdk/testing`-barrel is alleen voor legacy-compatibiliteit.
Repo-guardrails weigeren nieuwe echte imports uit `plugin-sdk/testing` en
`plugin-sdk/test-utils`; die namen blijven alleen bestaan als verouderde compatibiliteitsoppervlakken
voor externe plugins en compatibiliteitsrecordtests.

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

### Beschikbare exports

| Export                                               | Doel                                                                                                                                          |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Bouw een minimale Plugin-API-mock voor directe registratie-unittests. Importeer uit `plugin-sdk/plugin-test-api`                              |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Gedeelde auth-profile-contractfixture voor native agent-runtime-adapters. Importeer uit `plugin-sdk/agent-runtime-test-contracts`             |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Gedeelde contractfixture voor afleveringsonderdrukking voor native agent-runtime-adapters. Importeer uit `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Gedeelde contractfixture voor fallback-classificatie voor native agent-runtime-adapters. Importeer uit `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Bouw dynamic-tool-schemafixtures voor native runtime-contracttests. Importeer uit `plugin-sdk/agent-runtime-test-contracts`                   |
| `expectChannelInboundContextContract`                | Controleer de vorm van de inkomende kanaalcontext. Importeer uit `plugin-sdk/channel-contract-testing`                                        |
| `installChannelOutboundPayloadContractSuite`         | Installeer contractgevallen voor uitgaande kanaalpayloads. Importeer uit `plugin-sdk/channel-contract-testing`                                |
| `createStartAccountContext`                          | Bouw contexten voor de levenscyclus van kanaalaccounts. Importeer uit `plugin-sdk/channel-test-helpers`                                       |
| `installChannelActionsContractSuite`                 | Installeer generieke contractgevallen voor kanaalberichtacties. Importeer uit `plugin-sdk/channel-test-helpers`                              |
| `installChannelSetupContractSuite`                   | Installeer generieke contractgevallen voor kanaalconfiguratie. Importeer uit `plugin-sdk/channel-test-helpers`                               |
| `installChannelStatusContractSuite`                  | Installeer generieke contractgevallen voor kanaalstatus. Importeer uit `plugin-sdk/channel-test-helpers`                                      |
| `expectDirectoryIds`                                 | Controleer kanaaldirectory-id's uit een directory-list-functie. Importeer uit `plugin-sdk/channel-test-helpers`                              |
| `assertBundledChannelEntries`                        | Controleer of gebundelde kanaalentrypoints het verwachte publieke contract beschikbaar stellen. Importeer uit `plugin-sdk/channel-test-helpers` |
| `formatEnvelopeTimestamp`                            | Format deterministische enveloptijdstempels. Importeer uit `plugin-sdk/channel-test-helpers`                                                 |
| `expectPairingReplyText`                             | Controleer kanaalpairing-antwoordtekst en extraheer de code. Importeer uit `plugin-sdk/channel-test-helpers`                                 |
| `describePluginRegistrationContract`                 | Installeer contractcontroles voor Plugin-registratie. Importeer uit `plugin-sdk/plugin-test-contracts`                                       |
| `registerSingleProviderPlugin`                       | Registreer één provider-Plugin in loader-smoketests. Importeer uit `plugin-sdk/plugin-test-runtime`                                          |
| `registerProviderPlugin`                             | Leg alle providersoorten van één Plugin vast. Importeer uit `plugin-sdk/plugin-test-runtime`                                                  |
| `registerProviderPlugins`                            | Leg providerregistraties over meerdere Plugins vast. Importeer uit `plugin-sdk/plugin-test-runtime`                                          |
| `requireRegisteredProvider`                          | Controleer of een providerverzameling een id bevat. Importeer uit `plugin-sdk/plugin-test-runtime`                                           |
| `createRuntimeEnv`                                   | Bouw een gemockte CLI/Plugin-runtimeomgeving. Importeer uit `plugin-sdk/plugin-test-runtime`                                                 |
| `createPluginSetupWizardStatus`                      | Bouw helpers voor configuratiestatus voor kanaal-Plugins. Importeer uit `plugin-sdk/plugin-test-runtime`                                     |
| `describeOpenAIProviderRuntimeContract`              | Installeer runtime-contractcontroles voor providerfamilies. Importeer uit `plugin-sdk/provider-test-contracts`                               |
| `expectPassthroughReplayPolicy`                      | Controleer of provider-replaybeleid provider-eigen tools en metadata doorlaat. Importeer uit `plugin-sdk/provider-test-contracts`            |
| `runRealtimeSttLiveTest`                             | Voer een live realtime STT-providertest uit met gedeelde audiofixtures. Importeer uit `plugin-sdk/provider-test-contracts`                   |
| `normalizeTranscriptForMatch`                        | Normaliseer live transcriptuitvoer vóór fuzzy assertions. Importeer uit `plugin-sdk/provider-test-contracts`                                 |
| `expectExplicitVideoGenerationCapabilities`          | Controleer of videoproviders expliciete mogelijkheden voor generatiemodi declareren. Importeer uit `plugin-sdk/provider-test-contracts`       |
| `expectExplicitMusicGenerationCapabilities`          | Controleer of muziekproviders expliciete mogelijkheden voor genereren/bewerken declareren. Importeer uit `plugin-sdk/provider-test-contracts` |
| `mockSuccessfulDashscopeVideoTask`                   | Installeer een geslaagde DashScope-compatibele videotaakrespons. Importeer uit `plugin-sdk/provider-test-contracts`                          |
| `getProviderHttpMocks`                               | Krijg toegang tot opt-in provider-HTTP/auth-Vitest-mocks. Importeer uit `plugin-sdk/provider-http-test-mocks`                                |
| `installProviderHttpMockCleanup`                     | Reset provider-HTTP/auth-mocks na elke test. Importeer uit `plugin-sdk/provider-http-test-mocks`                                             |
| `installCommonResolveTargetErrorCases`               | Gedeelde testgevallen voor foutafhandeling bij doelresolutie. Importeer uit `plugin-sdk/channel-target-testing`                              |
| `shouldAckReaction`                                  | Controleer of een kanaal een ack-reactie moet toevoegen. Importeer uit `plugin-sdk/channel-feedback`                                         |
| `removeAckReactionAfterReply`                        | Verwijder ack-reactie na aflevering van het antwoord. Importeer uit `plugin-sdk/channel-feedback`                                            |
| `createTestRegistry`                                 | Bouw een kanaal-Plugin-registryfixture. Importeer uit `plugin-sdk/plugin-test-runtime` of `plugin-sdk/channel-test-helpers`                  |
| `createEmptyPluginRegistry`                          | Bouw een lege Plugin-registryfixture. Importeer uit `plugin-sdk/plugin-test-runtime` of `plugin-sdk/channel-test-helpers`                    |
| `setActivePluginRegistry`                            | Installeer een registryfixture voor Plugin-runtime-tests. Importeer uit `plugin-sdk/plugin-test-runtime` of `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                      | Leg JSON-fetch-aanvragen vast in mediahelpertests. Importeer uit `plugin-sdk/test-env`                                                       |
| `withServer`                                         | Voer tests uit tegen een wegwerpbare lokale HTTP-server. Importeer uit `plugin-sdk/test-env`                                                 |
| `createMockIncomingRequest`                          | Bouw een minimaal inkomend HTTP-aanvraagobject. Importeer uit `plugin-sdk/test-env`                                                          |
| `withFetchPreconnect`                                | Voer fetch-tests uit met geïnstalleerde preconnect-hooks. Importeer uit `plugin-sdk/test-env`                                                |
| `withEnv` / `withEnvAsync`                           | Patch omgevingsvariabelen tijdelijk. Importeer uit `plugin-sdk/test-env`                                                                     |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Maak geïsoleerde bestandssysteemtestfixtures. Importeer uit `plugin-sdk/test-env`                                                            |
| `createMockServerResponse`                           | Maak een minimale HTTP-serverresponsmock. Importeer uit `plugin-sdk/test-env`                                                                |
| `createCliRuntimeCapture`                            | Leg CLI-runtime-uitvoer vast in tests. Importeer uit `plugin-sdk/test-fixtures`                                                              |
| `importFreshModule`                                  | Importeer een ESM-module met een verse querytoken om de modulecache te omzeilen. Importeer uit `plugin-sdk/test-fixtures`                   |
| `bundledPluginRoot` / `bundledPluginFile`            | Los paden naar gebundelde Plugin-bron- of dist-fixtures op. Importeer uit `plugin-sdk/test-fixtures`                                        |
| `mockNodeBuiltinModule`                              | Installeer smalle Node-builtin-Vitest-mocks. Importeer uit `plugin-sdk/test-node-mocks`                                                     |
| `createSandboxTestContext`                           | Bouw sandbox-testcontexten. Importeer uit `plugin-sdk/test-fixtures`                                                                         |
| `writeSkill`                                         | Schrijf skill-fixtures. Importeer uit `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | Bouw berichtfixtures voor agenttranscripten. Importeer uit `plugin-sdk/test-fixtures`                                                       |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Inspecteer en reset systeemeventfixtures. Importeer uit `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | Sanitize terminaluitvoer voor assertions. Importeer uit `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | Controleer de vorm van chunking-uitvoer. Importeer uit `plugin-sdk/test-fixtures`                                                           |
| `runProviderCatalog`                                 | Voer een providercatalogus-hook uit met testafhankelijkheden                                                                                 |
| `resolveProviderWizardOptions`                       | Los keuzes van de providerconfiguratiewizard op in contracttests                                                                            |
| `resolveProviderModelPickerEntries`                  | Los provider-model-picker-items op in contracttests                                                                                         |
| `buildProviderPluginMethodChoice`                    | Bouw providerwizard-keuze-id's voor assertions                                                                                              |
| `setProviderWizardProvidersResolverForTest`          | Injecteer providerwizard-providers voor geïsoleerde tests                                                                                   |
| `createProviderUsageFetch`                           | Bouw fixtures voor het ophalen van providergebruik                                                                                       |
| `useFrozenTime` / `useRealTime`                      | Bevries en herstel timers voor tijdgevoelige tests. Importeer vanuit `plugin-sdk/test-env`                                               |
| `createTestWizardPrompter`                           | Bouw een gemockte prompter voor de installatiewizard                                                                                     |
| `createRuntimeTaskFlow`                              | Maak geisoleerde runtime-taakstroomstatus                                                                                                |
| `typedCases`                                         | Behoud letterlijke typen voor tabelgestuurde tests. Importeer vanuit `plugin-sdk/test-fixtures`                                          |

Gebundelde plugin-contractsuites gebruiken ook SDK-testsubpaden voor test-only
helpers voor registry, manifest, public-artifact en runtime fixtures. Core-only
suites die afhankelijk zijn van de gebundelde OpenClaw-inventaris blijven onder `src/plugins/contracts`.
Houd nieuwe extension-tests op een gedocumenteerd, gericht SDK-subpad zoals
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env` of `plugin-sdk/test-fixtures` in plaats van rechtstreeks de
brede compatibiliteitsbarrel `plugin-sdk/testing`, repo-bestanden `src/**` of repo-
`test/helpers/*`-bridges te importeren.

### Typen

Gerichte testsubpaden exporteren ook typen opnieuw die nuttig zijn in testbestanden:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Testdoelresolutie

Gebruik `installCommonResolveTargetErrorCases` om standaard foutgevallen toe te voegen voor
kanaaldoelresolutie:

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
de acceptatiegates van de OpenClaw-loader niet uit. Voeg ten minste één loader-gedekte smoke-test toe
voor elk registratieoppervlak waarvan je plugin afhankelijk is, vooral hooks en
exclusieve capabilities zoals geheugen.

De echte loader laat plugin-registratie mislukken wanneer vereiste metadata ontbreken of een
plugin een capability-API aanroept waarvan deze geen eigenaar is. Bijvoorbeeld:
`api.registerHook(...)` vereist een hooknaam, en
`api.registerMemoryCapability(...)` vereist dat het plugin-manifest of de geëxporteerde
entry `kind: "memory"` declareert.

### Runtime-configuratietoegang testen

Geef de voorkeur aan de gedeelde plugin-runtime-mock uit `openclaw/plugin-sdk/channel-test-helpers`
bij het testen van gebundelde kanaalplugins. De verouderde mocks `runtime.config.loadConfig()` en
`runtime.config.writeConfigFile(...)` gooien standaard een fout, zodat tests nieuw
gebruik van compatibiliteits-API's detecteren. Overschrijf die mocks alleen wanneer de test
expliciet legacy-compatibiliteitsgedrag behandelt.

### Een kanaalplugin unittesten

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

### Een providerplugin unittesten

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

### De plugin-runtime mocken

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

### Testen met stubs per instantie

Geef de voorkeur aan stubs per instantie boven prototype-mutatie:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Contracttests (plugins in repo)

Gebundelde plugins hebben contracttests die registratie-eigenaarschap verifiëren:

```bash
pnpm test -- src/plugins/contracts/
```

Deze tests controleren:

- Welke plugins welke providers registreren
- Welke plugins welke spraakproviders registreren
- Correctheid van registratiestructuur
- Naleving van runtime-contract

### Scoped tests uitvoeren

Voor een specifieke plugin:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Alleen voor contracttests:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Lint-afdwinging (plugins in repo)

Drie regels worden afgedwongen door `pnpm check` voor plugins in repo:

1. **Geen monolithische rootimports** -- de rootbarrel `openclaw/plugin-sdk` wordt geweigerd
2. **Geen directe `src/`-imports** -- plugins kunnen `../../src/` niet rechtstreeks importeren
3. **Geen zelfimports** -- plugins kunnen hun eigen `plugin-sdk/<name>`-subpad niet importeren

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
- [SDK-providerplugins](/nl/plugins/sdk-provider-plugins) -- hooks voor providerplugins
- [Plugins bouwen](/nl/plugins/building-plugins) -- handleiding om te beginnen
