---
read_when:
    - Je schrijft tests voor een Plugin
    - Je hebt testhulpprogramma's uit de Plugin-SDK nodig
    - Je wilt contracttests voor gebundelde plugins begrijpen
sidebarTitle: Testing
summary: Testhulpmiddelen en patronen voor OpenClaw-plugins
title: Plugin testen
x-i18n:
    generated_at: "2026-06-27T18:08:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 515722102296373fb3b4bba8720e3ee784702adcd576fbf5b67003183c492967
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referentie voor testhulpprogramma's, patronen en lint-handhaving voor OpenClaw
plugins.

<Tip>
  **Op zoek naar testvoorbeelden?** De how-to-gidsen bevatten uitgewerkte testvoorbeelden:
  [Channel-plugin-tests](/nl/plugins/sdk-channel-plugins#step-6-test) en
  [Provider-plugin-tests](/nl/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Testhulpprogramma's

Deze subpaden voor testhelpers zijn repo-lokale bron-entrypoints voor OpenClaw's eigen
gebundelde plugintests. Het zijn geen pakketexports voor plugins van derden, en
ze kunnen Vitest of andere testafhankelijkheden importeren die alleen voor de repo zijn.

**Plugin-API-mockimport:** `openclaw/plugin-sdk/plugin-test-api`

**Importroute voor runtimecontract van agent:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Importroute voor channelcontract:** `openclaw/plugin-sdk/channel-contract-testing`

**Importroute voor channel-testhelper:** `openclaw/plugin-sdk/channel-test-helpers`

**Importroute voor channeldoeltest:** `openclaw/plugin-sdk/channel-target-testing`

**Importroute voor Plugin-contract:** `openclaw/plugin-sdk/plugin-test-contracts`

**Importroute voor Plugin-runtimetest:** `openclaw/plugin-sdk/plugin-test-runtime`

**Importroute voor providercontract:** `openclaw/plugin-sdk/provider-test-contracts`

**Importroute voor provider-HTTP-mock:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Importroute voor omgevings-/netwerktest:** `openclaw/plugin-sdk/test-env`

**Importroute voor generieke fixture:** `openclaw/plugin-sdk/test-fixtures`

**Importroute voor ingebouwde Node-mock:** `openclaw/plugin-sdk/test-node-mocks`

Binnen de OpenClaw-repo hebben de gerichte subpaden hieronder de voorkeur voor nieuwe gebundelde
plugintests. De brede
`openclaw/plugin-sdk/testing` barrel is alleen bedoeld voor verouderde compatibiliteit.
Repo-guardrails wijzen nieuwe echte imports uit `plugin-sdk/testing` en
`plugin-sdk/test-utils` af; die namen blijven alleen bestaan als verouderde compatibiliteitsoppervlakken
voor compatibility-record-tests.

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

| Export                                               | Doel                                                                                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Bouw een minimale mock voor de plugin-API voor unit tests met directe registratie. Importeer vanuit `plugin-sdk/plugin-test-api`         |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Gedeelde auth-profielcontractfixture voor native runtime-adapters voor agenten. Importeer vanuit `plugin-sdk/agent-runtime-test-contracts` |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Gedeelde contractfixture voor leveringsonderdrukking voor native runtime-adapters voor agenten. Importeer vanuit `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Gedeelde contractfixture voor fallback-classificatie voor native runtime-adapters voor agenten. Importeer vanuit `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Bouw schemafixtures voor dynamische tools voor native runtime-contracttests. Importeer vanuit `plugin-sdk/agent-runtime-test-contracts`  |
| `expectChannelInboundContextContract`                | Controleer de vorm van de inkomende context van een kanaal. Importeer vanuit `plugin-sdk/channel-contract-testing`                       |
| `installChannelOutboundPayloadContractSuite`         | Installeer contractcases voor uitgaande payloads van kanalen. Importeer vanuit `plugin-sdk/channel-contract-testing`                     |
| `createStartAccountContext`                          | Bouw contexten voor de accountlevenscyclus van kanalen. Importeer vanuit `plugin-sdk/channel-test-helpers`                              |
| `installChannelActionsContractSuite`                 | Installeer generieke contractcases voor berichtacties van kanalen. Importeer vanuit `plugin-sdk/channel-test-helpers`                   |
| `installChannelSetupContractSuite`                   | Installeer generieke contractcases voor kanaalinstellingen. Importeer vanuit `plugin-sdk/channel-test-helpers`                          |
| `installChannelStatusContractSuite`                  | Installeer generieke contractcases voor kanaalstatus. Importeer vanuit `plugin-sdk/channel-test-helpers`                                |
| `expectDirectoryIds`                                 | Controleer kanaalmap-id's uit een directory-list-functie. Importeer vanuit `plugin-sdk/channel-test-helpers`                            |
| `assertBundledChannelEntries`                        | Controleer of gebundelde kanaal-entrypoints het verwachte openbare contract blootstellen. Importeer vanuit `plugin-sdk/channel-test-helpers` |
| `formatEnvelopeTimestamp`                            | Format deterministische envelop-tijdstempels. Importeer vanuit `plugin-sdk/channel-test-helpers`                                        |
| `expectPairingReplyText`                             | Controleer antwoordtekst voor kanaalkoppeling en extraheer de code. Importeer vanuit `plugin-sdk/channel-test-helpers`                  |
| `describePluginRegistrationContract`                 | Installeer contractcontroles voor pluginregistratie. Importeer vanuit `plugin-sdk/plugin-test-contracts`                                |
| `registerSingleProviderPlugin`                       | Registreer één provider-Plugin in loader-smoketests. Importeer vanuit `plugin-sdk/plugin-test-runtime`                                  |
| `registerProviderPlugin`                             | Leg alle providersoorten uit één Plugin vast. Importeer vanuit `plugin-sdk/plugin-test-runtime`                                         |
| `registerProviderPlugins`                            | Leg providerregistraties over meerdere Plugins vast. Importeer vanuit `plugin-sdk/plugin-test-runtime`                                  |
| `requireRegisteredProvider`                          | Controleer of een providerverzameling een id bevat. Importeer vanuit `plugin-sdk/plugin-test-runtime`                                   |
| `createRuntimeEnv`                                   | Bouw een gemockte CLI-/plugin-runtimeomgeving. Importeer vanuit `plugin-sdk/plugin-test-runtime`                                        |
| `createPluginSetupWizardStatus`                      | Bouw statushulpen voor instellingen van kanaal-Plugins. Importeer vanuit `plugin-sdk/plugin-test-runtime`                               |
| `describeOpenAIProviderRuntimeContract`              | Installeer runtime-contractcontroles voor providerfamilies. Importeer vanuit `plugin-sdk/provider-test-contracts`                       |
| `expectPassthroughReplayPolicy`                      | Controleer of provider-replaybeleid provider-eigen tools en metadata doorgeeft. Importeer vanuit `plugin-sdk/provider-test-contracts`   |
| `runRealtimeSttLiveTest`                             | Voer een live realtime-STT-providertest uit met gedeelde audiofixtures. Importeer vanuit `plugin-sdk/provider-test-contracts`           |
| `normalizeTranscriptForMatch`                        | Normaliseer live transcriptuitvoer vóór fuzzy assertions. Importeer vanuit `plugin-sdk/provider-test-contracts`                         |
| `expectExplicitVideoGenerationCapabilities`          | Controleer of videoproviders expliciete mogelijkheden voor generatiemodi declareren. Importeer vanuit `plugin-sdk/provider-test-contracts` |
| `expectExplicitMusicGenerationCapabilities`          | Controleer of muziekproviders expliciete mogelijkheden voor genereren/bewerken declareren. Importeer vanuit `plugin-sdk/provider-test-contracts` |
| `mockSuccessfulDashscopeVideoTask`                   | Installeer een succesvolle DashScope-compatibele videotaakrespons. Importeer vanuit `plugin-sdk/provider-test-contracts`                |
| `getProviderHttpMocks`                               | Benader opt-in provider-HTTP-/auth-Vitest-mocks. Importeer vanuit `plugin-sdk/provider-http-test-mocks`                                 |
| `installProviderHttpMockCleanup`                     | Reset provider-HTTP-/auth-mocks na elke test. Importeer vanuit `plugin-sdk/provider-http-test-mocks`                                    |
| `installCommonResolveTargetErrorCases`               | Gedeelde testcases voor foutafhandeling bij doelresolutie. Importeer vanuit `plugin-sdk/channel-target-testing`                         |
| `shouldAckReaction`                                  | Controleer of een kanaal een ack-reactie moet toevoegen. Importeer vanuit `plugin-sdk/channel-feedback`                                 |
| `removeAckReactionAfterReply`                        | Verwijder ack-reactie na antwoordlevering. Importeer vanuit `plugin-sdk/channel-feedback`                                                |
| `createTestRegistry`                                 | Bouw een registryfixture voor kanaal-Plugins. Importeer vanuit `plugin-sdk/plugin-test-runtime` of `plugin-sdk/channel-test-helpers`     |
| `createEmptyPluginRegistry`                          | Bouw een lege pluginregistryfixture. Importeer vanuit `plugin-sdk/plugin-test-runtime` of `plugin-sdk/channel-test-helpers`             |
| `setActivePluginRegistry`                            | Installeer een registryfixture voor plugin-runtimetests. Importeer vanuit `plugin-sdk/plugin-test-runtime` of `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                      | Leg JSON-fetchverzoeken vast in media-helpertests. Importeer vanuit `plugin-sdk/test-env`                                                |
| `withServer`                                         | Voer tests uit tegen een wegwerpbare lokale HTTP-server. Importeer vanuit `plugin-sdk/test-env`                                         |
| `createMockIncomingRequest`                          | Bouw een minimaal object voor inkomende HTTP-verzoeken. Importeer vanuit `plugin-sdk/test-env`                                          |
| `withFetchPreconnect`                                | Voer fetchtests uit met geïnstalleerde preconnect-hooks. Importeer vanuit `plugin-sdk/test-env`                                         |
| `withEnv` / `withEnvAsync`                           | Patch omgevingsvariabelen tijdelijk. Importeer vanuit `plugin-sdk/test-env`                                                             |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Maak geïsoleerde testfixtures voor het bestandssysteem. Importeer vanuit `plugin-sdk/test-env`                                          |
| `createMockServerResponse`                           | Maak een minimale mock voor HTTP-serverresponsen. Importeer vanuit `plugin-sdk/test-env`                                                |
| `createCliRuntimeCapture`                            | Leg CLI-runtimeuitvoer vast in tests. Importeer vanuit `plugin-sdk/test-fixtures`                                                       |
| `importFreshModule`                                  | Importeer een ESM-module met een verse querytoken om de modulecache te omzeilen. Importeer vanuit `plugin-sdk/test-fixtures`            |
| `bundledPluginRoot` / `bundledPluginFile`            | Los bron- of dist-fixturepaden voor gebundelde Plugins op. Importeer vanuit `plugin-sdk/test-fixtures`                                  |
| `mockNodeBuiltinModule`                              | Installeer beperkte Vitest-mocks voor ingebouwde Node-modules. Importeer vanuit `plugin-sdk/test-node-mocks`                            |
| `createSandboxTestContext`                           | Bouw sandboxtestcontexten. Importeer vanuit `plugin-sdk/test-fixtures`                                                                  |
| `writeSkill`                                         | Schrijf skillfixtures. Importeer vanuit `plugin-sdk/test-fixtures`                                                                      |
| `makeAgentAssistantMessage`                          | Bouw berichtfixtures voor agenttranscripten. Importeer vanuit `plugin-sdk/test-fixtures`                                                |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Inspecteer en reset systeemeventfixtures. Importeer vanuit `plugin-sdk/test-fixtures`                                                   |
| `sanitizeTerminalText`                               | Saniteer terminaluitvoer voor assertions. Importeer vanuit `plugin-sdk/test-fixtures`                                                   |
| `countLines` / `hasBalancedFences`                   | Controleer de vorm van chunkinguitvoer. Importeer vanuit `plugin-sdk/test-fixtures`                                                     |
| `runProviderCatalog`                                 | Voer een provider-cataloghook uit met testafhankelijkheden                                                                               |
| `resolveProviderWizardOptions`                       | Los keuzes voor de providerinstallatiewizard op in contracttests                                                                        |
| `resolveProviderModelPickerEntries`                  | Los provider-modelpicker-items op in contracttests                                                                                       |
| `buildProviderPluginMethodChoice`                    | Bouw keuze-id's voor de providerwizard voor assertions                                                                                   |
| `setProviderWizardProvidersResolverForTest`          | Injecteer wizardproviders voor geïsoleerde tests                                                                                         |
| `createProviderUsageFetch`                           | Bouw fixtures voor providergebruiksfetches                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | Bevries en herstel timers voor tijdgevoelige tests. Importeer vanuit `plugin-sdk/test-env`                                                    |
| `createTestWizardPrompter`                           | Bouw een gemockte prompter voor de installatiewizard                                                                                                     |
| `createRuntimeTaskFlow`                              | Maak geïsoleerde runtime-status voor task-flows                                                                                                  |
| `typedCases`                                         | Behoud letterlijke typen voor tabelgestuurde tests. Importeer vanuit `plugin-sdk/test-fixtures`                                                    |

Suites voor gebundelde Plugin-contracten gebruiken ook SDK-testsubpaden voor test-only
helpers voor registry, manifest, public-artifact en runtime fixtures. Core-only
suites die afhankelijk zijn van de gebundelde OpenClaw-inventaris blijven onder `src/plugins/contracts`.
Houd nieuwe extensietests op een gedocumenteerd, gericht SDK-subpad zoals
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env` of `plugin-sdk/test-fixtures` in plaats van direct de
brede compatibiliteitsbarrel `plugin-sdk/testing`, repo-bestanden `src/**` of repo-
bridges `test/helpers/*` te importeren.

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

## Oplossing van testdoelen

Gebruik `installCommonResolveTargetErrorCases` om standaardfoutgevallen toe te voegen voor
het oplossen van channel-doelen:

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
de acceptatiepoorten van de OpenClaw-loader niet uit. Voeg ten minste één door de loader ondersteunde smoketest toe
voor elk registratieoppervlak waarvan je Plugin afhankelijk is, vooral hooks en
exclusieve capabilities zoals geheugen.

De echte loader laat Plugin-registratie mislukken wanneer verplichte metadata ontbreekt of een
Plugin een capability-API aanroept waarvan deze geen eigenaar is. Bijvoorbeeld:
`api.registerHook(...)` vereist een hooknaam, en
`api.registerMemoryCapability(...)` vereist dat het Plugin-manifest of de geëxporteerde
entry `kind: "memory"` declareert.

### Runtime-configuratietoegang testen

Geef de voorkeur aan de gedeelde Plugin-runtime-mock uit `openclaw/plugin-sdk/channel-test-helpers`
bij het testen van gebundelde channel-Plugins. De verouderde mocks `runtime.config.loadConfig()` en
`runtime.config.writeConfigFile(...)` gooien standaard een fout, zodat tests nieuw
gebruik van compatibiliteits-API's opvangen. Overschrijf die mocks alleen wanneer de test
expliciet legacy-compatibiliteitsgedrag behandelt.

### Een channel-Plugin unit-testen

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

### Een provider-Plugin unit-testen

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

Mock de runtime in tests voor code die `createPluginRuntimeStore` gebruikt:

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

Geef de voorkeur aan stubs per instantie boven prototypemutatie:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Contracttests (in-repo Plugins)

Gebundelde Plugins hebben contracttests die registratie-eigenaarschap verifiëren:

```bash
pnpm test -- src/plugins/contracts/
```

Deze tests controleren:

- Welke Plugins welke providers registreren
- Welke Plugins welke spraakproviders registreren
- Correctheid van de registratiestructuur
- Naleving van runtimecontracten

### Gescopeerde tests uitvoeren

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

## Lint-handhaving (in-repo Plugins)

Drie regels worden door `pnpm check` afgedwongen voor in-repo Plugins:

1. **Geen monolithische root-imports** -- de root-barrel `openclaw/plugin-sdk` wordt geweigerd
2. **Geen directe `src/`-imports** -- Plugins mogen `../../src/` niet direct importeren
3. **Geen self-imports** -- Plugins mogen hun eigen subpad `plugin-sdk/<name>` niet importeren

Externe Plugins vallen niet onder deze lintregels, maar het volgen van dezelfde
patronen wordt aanbevolen.

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
- [SDK Channel-Plugins](/nl/plugins/sdk-channel-plugins) -- interface voor channel-Plugins
- [SDK Provider-Plugins](/nl/plugins/sdk-provider-plugins) -- hooks voor provider-Plugins
- [Plugins bouwen](/nl/plugins/building-plugins) -- gids om aan de slag te gaan
