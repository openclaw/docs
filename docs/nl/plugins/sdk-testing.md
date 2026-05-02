---
read_when:
    - Je schrijft tests voor een Plugin
    - Je hebt testhulpprogramma's uit de Plugin SDK nodig
    - Je wilt contracttests voor gebundelde Plugins begrijpen
sidebarTitle: Testing
summary: Testhulpprogramma's en patronen voor OpenClaw-plugins
title: Plugin testen
x-i18n:
    generated_at: "2026-05-02T22:22:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67092d71302d566ee9ed3f3f1e32b5aa6f4eabf522a9656ad13cad812550f1e8
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referentie voor testhulpprogramma's, patronen en lint-handhaving voor OpenClaw-plugins.

<Tip>
  **Op zoek naar testvoorbeelden?** De how-to-gidsen bevatten uitgewerkte testvoorbeelden:
  [Tests voor channel-plugins](/nl/plugins/sdk-channel-plugins#step-6-test) en
  [Tests voor provider-plugins](/nl/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Testhulpprogramma's

**Import voor Plugin API-mock:** `openclaw/plugin-sdk/plugin-test-api`

**Import voor runtimecontract van agent:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Import voor channel-contract:** `openclaw/plugin-sdk/channel-contract-testing`

**Import voor channel-testhelper:** `openclaw/plugin-sdk/channel-test-helpers`

**Import voor channel target-test:** `openclaw/plugin-sdk/channel-target-testing`

**Import voor Plugin-contract:** `openclaw/plugin-sdk/plugin-test-contracts`

**Import voor Plugin-runtime-test:** `openclaw/plugin-sdk/plugin-test-runtime`

**Import voor provider-contract:** `openclaw/plugin-sdk/provider-test-contracts`

**Import voor provider-HTTP-mock:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Import voor omgevings-/netwerktest:** `openclaw/plugin-sdk/test-env`

**Import voor generieke fixture:** `openclaw/plugin-sdk/test-fixtures`

**Import voor Node ingebouwde mock:** `openclaw/plugin-sdk/test-node-mocks`

Geef voor nieuwe plugintests de voorkeur aan de gerichte subpaden hieronder. De brede
`openclaw/plugin-sdk/testing` barrel is alleen bedoeld voor legacy-compatibiliteit.
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

| Export                                               | Doel                                                                                                                                                       |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Bouw een minimale Plugin-API-mock voor unit-tests voor directe registratie. Importeer vanuit `plugin-sdk/plugin-test-api`                                  |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Gedeelde auth-profiel-contract-fixture voor native agent-runtime-adapters. Importeer vanuit `plugin-sdk/agent-runtime-test-contracts`                      |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Gedeelde contract-fixture voor leveringsonderdrukking voor native agent-runtime-adapters. Importeer vanuit `plugin-sdk/agent-runtime-test-contracts`       |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Gedeelde fallback-classificatie-contract-fixture voor native agent-runtime-adapters. Importeer vanuit `plugin-sdk/agent-runtime-test-contracts`            |
| `createParameterFreeTool`                            | Bouw dynamic-tool-schemafixtures voor native runtime-contracttests. Importeer vanuit `plugin-sdk/agent-runtime-test-contracts`                              |
| `expectChannelInboundContextContract`                | Controleer de vorm van de inkomende kanaalcontext. Importeer vanuit `plugin-sdk/channel-contract-testing`                                                  |
| `installChannelOutboundPayloadContractSuite`         | Installeer contractcases voor uitgaande kanaalpayloads. Importeer vanuit `plugin-sdk/channel-contract-testing`                                             |
| `createStartAccountContext`                          | Bouw contexten voor de levenscyclus van kanaalaccounts. Importeer vanuit `plugin-sdk/channel-test-helpers`                                                 |
| `installChannelActionsContractSuite`                 | Installeer generieke contractcases voor kanaalberichtacties. Importeer vanuit `plugin-sdk/channel-test-helpers`                                           |
| `installChannelSetupContractSuite`                   | Installeer generieke contractcases voor kanaalconfiguratie. Importeer vanuit `plugin-sdk/channel-test-helpers`                                            |
| `installChannelStatusContractSuite`                  | Installeer generieke contractcases voor kanaalstatus. Importeer vanuit `plugin-sdk/channel-test-helpers`                                                  |
| `expectDirectoryIds`                                 | Controleer kanaaldirectory-id's vanuit een directory-list-functie. Importeer vanuit `plugin-sdk/channel-test-helpers`                                     |
| `assertBundledChannelEntries`                        | Controleer dat gebundelde kanaalentrypoints het verwachte publieke contract blootstellen. Importeer vanuit `plugin-sdk/channel-test-helpers`               |
| `formatEnvelopeTimestamp`                            | Format deterministische enveloptijdstempels. Importeer vanuit `plugin-sdk/channel-test-helpers`                                                           |
| `expectPairingReplyText`                             | Controleer antwoordtekst voor kanaalkoppeling en extraheer de code ervan. Importeer vanuit `plugin-sdk/channel-test-helpers`                              |
| `describePluginRegistrationContract`                 | Installeer contractcontroles voor Plugin-registratie. Importeer vanuit `plugin-sdk/plugin-test-contracts`                                                  |
| `registerSingleProviderPlugin`                       | Registreer een provider-Plugin in loader-smoketests. Importeer vanuit `plugin-sdk/plugin-test-runtime`                                                     |
| `registerProviderPlugin`                             | Leg alle providersoorten vast vanuit een Plugin. Importeer vanuit `plugin-sdk/plugin-test-runtime`                                                         |
| `registerProviderPlugins`                            | Leg providerregistraties vast over meerdere Plugins. Importeer vanuit `plugin-sdk/plugin-test-runtime`                                                     |
| `requireRegisteredProvider`                          | Controleer dat een providercollectie een id bevat. Importeer vanuit `plugin-sdk/plugin-test-runtime`                                                       |
| `createRuntimeEnv`                                   | Bouw een gemockte CLI/Plugin-runtimeomgeving. Importeer vanuit `plugin-sdk/plugin-test-runtime`                                                            |
| `createPluginSetupWizardStatus`                      | Bouw helpers voor configuratiestatus voor kanaal-Plugins. Importeer vanuit `plugin-sdk/plugin-test-runtime`                                                |
| `describeOpenAIProviderRuntimeContract`              | Installeer runtime-contractcontroles voor providerfamilies. Importeer vanuit `plugin-sdk/provider-test-contracts`                                         |
| `expectPassthroughReplayPolicy`                      | Controleer dat provider-replaybeleid provider-eigen tools en metadata doorgeeft. Importeer vanuit `plugin-sdk/provider-test-contracts`                    |
| `runRealtimeSttLiveTest`                             | Voer een live realtime STT-providertest uit met gedeelde audiofixtures. Importeer vanuit `plugin-sdk/provider-test-contracts`                              |
| `normalizeTranscriptForMatch`                        | Normaliseer live transcriptuitvoer vóór fuzzy assertions. Importeer vanuit `plugin-sdk/provider-test-contracts`                                            |
| `expectExplicitVideoGenerationCapabilities`          | Controleer dat videoproviders expliciete mogelijkheden voor generatiemodi declareren. Importeer vanuit `plugin-sdk/provider-test-contracts`                |
| `expectExplicitMusicGenerationCapabilities`          | Controleer dat muziekproviders expliciete mogelijkheden voor generatie/bewerking declareren. Importeer vanuit `plugin-sdk/provider-test-contracts`         |
| `mockSuccessfulDashscopeVideoTask`                   | Installeer een geslaagde DashScope-compatibele videotaakrespons. Importeer vanuit `plugin-sdk/provider-test-contracts`                                    |
| `getProviderHttpMocks`                               | Krijg toegang tot opt-in provider-HTTP/auth-Vitest-mocks. Importeer vanuit `plugin-sdk/provider-http-test-mocks`                                           |
| `installProviderHttpMockCleanup`                     | Reset provider-HTTP/auth-mocks na elke test. Importeer vanuit `plugin-sdk/provider-http-test-mocks`                                                        |
| `installCommonResolveTargetErrorCases`               | Gedeelde testcases voor foutafhandeling bij doelresolutie. Importeer vanuit `plugin-sdk/channel-target-testing`                                           |
| `shouldAckReaction`                                  | Controleer of een kanaal een ack-reactie moet toevoegen. Importeer vanuit `plugin-sdk/channel-feedback`                                                    |
| `removeAckReactionAfterReply`                        | Verwijder ack-reactie na antwoordlevering. Importeer vanuit `plugin-sdk/channel-feedback`                                                                  |
| `createTestRegistry`                                 | Bouw een kanaal-Plugin-register-fixture. Importeer vanuit `plugin-sdk/plugin-test-runtime` of `plugin-sdk/channel-test-helpers`                            |
| `createEmptyPluginRegistry`                          | Bouw een lege Plugin-register-fixture. Importeer vanuit `plugin-sdk/plugin-test-runtime` of `plugin-sdk/channel-test-helpers`                              |
| `setActivePluginRegistry`                            | Installeer een register-fixture voor Plugin-runtimetests. Importeer vanuit `plugin-sdk/plugin-test-runtime` of `plugin-sdk/channel-test-helpers`          |
| `createRequestCaptureJsonFetch`                      | Leg JSON-fetchverzoeken vast in mediahelpertests. Importeer vanuit `plugin-sdk/test-env`                                                                   |
| `withServer`                                         | Voer tests uit tegen een wegwerpbare lokale HTTP-server. Importeer vanuit `plugin-sdk/test-env`                                                            |
| `createMockIncomingRequest`                          | Bouw een minimaal inkomend HTTP-verzoekobject. Importeer vanuit `plugin-sdk/test-env`                                                                      |
| `withFetchPreconnect`                                | Voer fetch-tests uit met geïnstalleerde preconnect-hooks. Importeer vanuit `plugin-sdk/test-env`                                                           |
| `withEnv` / `withEnvAsync`                           | Patch omgevingsvariabelen tijdelijk. Importeer vanuit `plugin-sdk/test-env`                                                                                |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Maak geïsoleerde bestandssysteemtestfixtures. Importeer vanuit `plugin-sdk/test-env`                                                                       |
| `createMockServerResponse`                           | Maak een minimale mock voor HTTP-serverresponsen. Importeer vanuit `plugin-sdk/test-env`                                                                   |
| `createCliRuntimeCapture`                            | Leg CLI-runtime-uitvoer vast in tests. Importeer vanuit `plugin-sdk/test-fixtures`                                                                         |
| `importFreshModule`                                  | Importeer een ESM-module met een vers querytoken om de modulecache te omzeilen. Importeer vanuit `plugin-sdk/test-fixtures`                               |
| `bundledPluginRoot` / `bundledPluginFile`            | Los paden naar gebundelde Plugin-bron- of dist-fixtures op. Importeer vanuit `plugin-sdk/test-fixtures`                                                    |
| `mockNodeBuiltinModule`                              | Installeer smalle Node-builtin-Vitest-mocks. Importeer vanuit `plugin-sdk/test-node-mocks`                                                                |
| `createSandboxTestContext`                           | Bouw sandbox-testcontexten. Importeer vanuit `plugin-sdk/test-fixtures`                                                                                    |
| `writeSkill`                                         | Schrijf skill-fixtures. Importeer vanuit `plugin-sdk/test-fixtures`                                                                                        |
| `makeAgentAssistantMessage`                          | Bouw fixtures voor agent-transcriptberichten. Importeer vanuit `plugin-sdk/test-fixtures`                                                                 |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Inspecteer en reset systeemevent-fixtures. Importeer vanuit `plugin-sdk/test-fixtures`                                                                    |
| `sanitizeTerminalText`                               | Saniteer terminaluitvoer voor assertions. Importeer vanuit `plugin-sdk/test-fixtures`                                                                      |
| `countLines` / `hasBalancedFences`                   | Controleer de vorm van chunking-uitvoer. Importeer vanuit `plugin-sdk/test-fixtures`                                                                      |
| `runProviderCatalog`                                 | Voer een providercatalogushook uit met testafhankelijkheden                                                                                                |
| `resolveProviderWizardOptions`                       | Los keuzes van de providerconfiguratiewizard op in contracttests                                                                                           |
| `resolveProviderModelPickerEntries`                  | Los items van de provider-modelkiezer op in contracttests                                                                                                  |
| `buildProviderPluginMethodChoice`                    | Bouw keuze-id's voor de providerwizard voor assertions                                                                                                     |
| `setProviderWizardProvidersResolverForTest`          | Injecteer providerwizardproviders voor geïsoleerde tests                                                                                                   |
| `createProviderUsageFetch`                           | Bouw fixtures voor het ophalen van providergebruik                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | Bevries en herstel timers voor tijdgevoelige tests. Importeer vanuit `plugin-sdk/test-env`                                                    |
| `createTestWizardPrompter`                           | Bouw een gemockte setupwizard-prompter                                                                                                     |
| `createRuntimeTaskFlow`                              | Maak geïsoleerde runtime-taskflowstatus aan                                                                                                  |
| `typedCases`                                         | Behoud letterlijke typen voor tabelgestuurde tests. Importeer vanuit `plugin-sdk/test-fixtures`                                                    |

Gebundelde Plugin-contractsuites gebruiken ook SDK-testsubpaden voor helpers voor test-only registry-, manifest-, public-artifact- en runtime-fixtures. Suites die alleen op core zijn gericht en afhankelijk zijn van de gebundelde OpenClaw-inventory blijven onder `src/plugins/contracts`. Houd nieuwe extensietests op een gedocumenteerd, gericht SDK-subpad zoals `plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`, `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`, `plugin-sdk/test-env` of `plugin-sdk/test-fixtures`, in plaats van de brede compatibiliteitsbarrel `plugin-sdk/testing`, repo-`src/**`-bestanden of repo-`test/helpers/*`-bridges rechtstreeks te importeren.

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

## Resolutie van testdoelen

Gebruik `installCommonResolveTargetErrorCases` om standaardfoutgevallen toe te voegen voor resolutie van kanaaldoelen:

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

Unittests die een handgeschreven `api`-mock doorgeven aan `register(api)` oefenen de acceptatiegates van OpenClaw's loader niet uit. Voeg ten minste één loader-ondersteunde smoke-test toe voor elk registratieoppervlak waarvan je Plugin afhankelijk is, vooral hooks en exclusieve capabilities zoals memory.

De echte loader laat Plugin-registratie mislukken wanneer vereiste metadata ontbreekt of een Plugin een capability-API aanroept waarvan die geen eigenaar is. Bijvoorbeeld: `api.registerHook(...)` vereist een hooknaam, en `api.registerMemoryCapability(...)` vereist dat het Plugin-manifest of de geëxporteerde entry `kind: "memory"` declareert.

### Runtime-configuratietoegang testen

Geef de voorkeur aan de gedeelde Plugin-runtime-mock uit `openclaw/plugin-sdk/channel-test-helpers` bij het testen van gebundelde kanaal-Plugins. De verouderde mocks `runtime.config.loadConfig()` en `runtime.config.writeConfigFile(...)` gooien standaard een fout, zodat tests nieuw gebruik van compatibiliteits-API's opvangen. Overschrijf die mocks alleen wanneer de test expliciet legacy-compatibiliteitsgedrag afdekt.

### Een kanaal-Plugin unittesten

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

### Een provider-Plugin unittesten

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

### De Plugin-runtime mocken

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

## Contracttests (Plugins in de repo)

Gebundelde Plugins hebben contracttests die registratie-eigendom verifiëren:

```bash
pnpm test -- src/plugins/contracts/
```

Deze tests controleren:

- Welke Plugins welke providers registreren
- Welke Plugins welke spraakproviders registreren
- Correctheid van de registratievorm
- Naleving van runtime-contracten

### Scoped tests uitvoeren

Voor een specifieke Plugin:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Alleen voor contracttests:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Lint-afdwinging (Plugins in de repo)

Drie regels worden door `pnpm check` afgedwongen voor Plugins in de repo:

1. **Geen monolithische root-imports** -- de root-barrel `openclaw/plugin-sdk` wordt geweigerd
2. **Geen directe `src/`-imports** -- Plugins mogen `../../src/` niet rechtstreeks importeren
3. **Geen self-imports** -- Plugins mogen hun eigen `plugin-sdk/<name>`-subpad niet importeren

Externe Plugins vallen niet onder deze lintregels, maar het volgen van dezelfde patronen wordt aanbevolen.

## Testconfiguratie

OpenClaw gebruikt Vitest met V8-coveragedrempels. Voor Plugin-tests:

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
- [SDK-kanaal-Plugins](/nl/plugins/sdk-channel-plugins) -- Plugin-interface voor kanalen
- [SDK-provider-Plugins](/nl/plugins/sdk-provider-plugins) -- Plugin-hooks voor providers
- [Plugins bouwen](/nl/plugins/building-plugins) -- gids om aan de slag te gaan
