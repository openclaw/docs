---
read_when:
    - Je schrijft tests voor een plugin
    - Je hebt testhulpprogramma's uit de plugin-SDK nodig
    - Je wilt contracttests voor gebundelde plugins begrijpen
sidebarTitle: Testing
summary: Testhulpmiddelen en -patronen voor OpenClaw-plugins
title: Plugins testen
x-i18n:
    generated_at: "2026-07-12T09:16:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 666160b6eb0c2f3187e8f8b3efe417537c4c4404fe564c463da4d222bced3b8f
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referentie voor testhulpmiddelen, patronen en lintafdwinging voor OpenClaw-
plugins.

<Tip>
  **Op zoek naar testvoorbeelden?** De praktische handleidingen bevatten uitgewerkte testvoorbeelden:
  [Tests voor kanaalplugins](/nl/plugins/sdk-channel-plugins#step-6-test) en
  [Tests voor providerplugins](/nl/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Testhulpmiddelen

Deze subpaden zijn broncode-ingangspunten binnen de repository voor de eigen meegeleverde
plugintests van OpenClaw. Ze worden niet gepubliceerd als `package.json`-exports voor
plugins van derden en kunnen Vitest of andere testafhankelijkheden importeren die alleen
binnen de repository beschikbaar zijn.

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

Gebruik bij voorkeur deze gerichte subpaden voor nieuwe tests van meegeleverde plugins. De brede
`openclaw/plugin-sdk/testing`-barrel en de alias `openclaw/plugin-sdk/test-utils`
zijn uitsluitend bedoeld voor verouderde compatibiliteit: `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) weigert nieuwe imports van
beide in extensietestbestanden, en beide blijven uitsluitend bestaan voor
compatibiliteitsregistratietests.

### Beschikbare exports

| Export                                               | Doel                                                                                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Bouw een minimale mock van de Plugin-API voor unittests van directe registratie. Importeer uit `plugin-sdk/plugin-test-api`               |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Gedeelde contractfixture voor authenticatieprofielen voor systeemeigen agentruntime-adapters. Importeer uit `plugin-sdk/agent-runtime-test-contracts` |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Gedeelde contractfixture voor leveringsonderdrukking voor systeemeigen agentruntime-adapters. Importeer uit `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Gedeelde contractfixture voor fallbackclassificatie voor systeemeigen agentruntime-adapters. Importeer uit `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Bouw schemafixtures voor dynamische tools voor systeemeigen runtimecontracttests. Importeer uit `plugin-sdk/agent-runtime-test-contracts` |
| `expectChannelInboundContextContract`                | Controleer de vorm van de inkomende kanaalcontext. Importeer uit `plugin-sdk/channel-contract-testing`                                   |
| `installChannelOutboundPayloadContractSuite`         | Installeer contracttestgevallen voor uitgaande kanaalpayloads. Importeer uit `plugin-sdk/channel-contract-testing`                        |
| `createStartAccountContext`                          | Bouw levenscycluscontexten voor kanaalaccounts. Importeer uit `plugin-sdk/channel-test-helpers`                                           |
| `installChannelActionsContractSuite`                 | Installeer algemene contracttestgevallen voor kanaalberichtacties. Importeer uit `plugin-sdk/channel-test-helpers`                        |
| `installChannelSetupContractSuite`                   | Installeer algemene contracttestgevallen voor kanaalconfiguratie. Importeer uit `plugin-sdk/channel-test-helpers`                         |
| `installChannelStatusContractSuite`                  | Installeer algemene contracttestgevallen voor kanaalstatus. Importeer uit `plugin-sdk/channel-test-helpers`                              |
| `expectDirectoryIds`                                 | Controleer kanaalmap-id's van een functie die een mappenlijst retourneert. Importeer uit `plugin-sdk/channel-test-helpers`                |
| `assertBundledChannelEntries`                        | Controleer of gebundelde kanaalingangspunten het verwachte openbare contract beschikbaar stellen. Importeer uit `plugin-sdk/channel-test-helpers` |
| `formatEnvelopeTimestamp`                            | Formatteer deterministische enveloptijdstempels. Importeer uit `plugin-sdk/channel-test-helpers`                                         |
| `expectPairingReplyText`                             | Controleer de antwoordtekst voor kanaalkoppeling en extraheer de code. Importeer uit `plugin-sdk/channel-test-helpers`                    |
| `describePluginRegistrationContract`                 | Installeer contractcontroles voor Plugin-registratie. Importeer uit `plugin-sdk/plugin-test-contracts`                                   |
| `registerSingleProviderPlugin`                       | Registreer één provider-Plugin in loaderrooktests. Importeer uit `plugin-sdk/plugin-test-runtime`                                        |
| `registerProviderPlugin`                             | Leg alle providertypen van één Plugin vast. Importeer uit `plugin-sdk/plugin-test-runtime`                                               |
| `registerProviderPlugins`                            | Leg providerregistraties van meerdere Plugins vast. Importeer uit `plugin-sdk/plugin-test-runtime`                                       |
| `requireRegisteredProvider`                          | Controleer of een providerverzameling een id bevat. Importeer uit `plugin-sdk/plugin-test-runtime`                                       |
| `createRuntimeEnv`                                   | Bouw een mockomgeving voor de CLI-/Plugin-runtime. Importeer uit `plugin-sdk/plugin-test-runtime`                                        |
| `createPluginRuntimeMock`                            | Bouw een mock van het Plugin-runtimeoppervlak. Importeer uit `plugin-sdk/plugin-test-runtime`                                            |
| `createPluginSetupWizardStatus`                      | Bouw helpers voor configuratiestatus voor kanaal-Plugins. Importeer uit `plugin-sdk/plugin-test-runtime`                                 |
| `createTestWizardPrompter`                           | Bouw een mock van de prompter van de configuratiewizard. Importeer uit `plugin-sdk/plugin-test-runtime`                                  |
| `createRuntimeTaskFlow`                              | Maak geïsoleerde TaskFlow-status voor de runtime. Importeer uit `plugin-sdk/plugin-test-runtime`                                         |
| `runProviderCatalog`                                 | Voer een providercatalogushaak uit met testafhankelijkheden. Importeer uit `plugin-sdk/plugin-test-runtime`                              |
| `resolveProviderWizardOptions`                       | Bepaal keuzes van de providerconfiguratiewizard in contracttests. Importeer uit `plugin-sdk/plugin-test-runtime`                          |
| `resolveProviderModelPickerEntries`                  | Bepaal provideritems voor de modelkiezer in contracttests. Importeer uit `plugin-sdk/plugin-test-runtime`                                |
| `buildProviderPluginMethodChoice`                    | Bouw keuze-id's voor providermethoden in de wizard voor controles. Importeer uit `plugin-sdk/plugin-test-runtime`                         |
| `setProviderWizardProvidersResolverForTest`          | Injecteer providers voor de providerwizard voor geïsoleerde tests. Importeer uit `plugin-sdk/plugin-test-runtime`                         |
| `describeOpenAIProviderRuntimeContract`              | Installeer runtimecontractcontroles voor providerfamilies. Importeer uit `plugin-sdk/provider-test-contracts`                            |
| `expectPassthroughReplayPolicy`                      | Controleer of het replaybeleid van providers tools en metagegevens in eigendom van de provider ongewijzigd doorgeeft. Importeer uit `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | Voer een live realtime-STT-providertest uit met gedeelde audiofixtures. Importeer uit `plugin-sdk/provider-test-contracts`                |
| `normalizeTranscriptForMatch`                        | Normaliseer live transcriptuitvoer vóór benaderende controles. Importeer uit `plugin-sdk/provider-test-contracts`                        |
| `expectExplicitVideoGenerationCapabilities`          | Controleer of videoproviders expliciete mogelijkheden voor generatiemodi declareren. Importeer uit `plugin-sdk/provider-test-contracts`  |
| `expectExplicitMusicGenerationCapabilities`          | Controleer of muziekproviders expliciete mogelijkheden voor genereren en bewerken declareren. Importeer uit `plugin-sdk/provider-test-contracts` |
| `mockSuccessfulDashscopeVideoTask`                   | Installeer een geslaagd antwoord op een DashScope-compatibele videotaak. Importeer uit `plugin-sdk/provider-test-contracts`               |
| `getProviderHttpMocks`                               | Verkrijg toegang tot expliciet ingeschakelde Vitest-mocks voor HTTP/authenticatie van providers. Importeer uit `plugin-sdk/provider-http-test-mocks` |
| `installProviderHttpMockCleanup`                     | Stel mocks voor HTTP/authenticatie van providers na elke test opnieuw in. Importeer uit `plugin-sdk/provider-http-test-mocks`             |
| `installCommonResolveTargetErrorCases`               | Gedeelde testgevallen voor foutafhandeling bij doelbepaling. Importeer uit `plugin-sdk/channel-target-testing`                            |
| `shouldAckReaction`                                  | Controleer of een kanaal een bevestigingsreactie moet toevoegen. Importeer uit `plugin-sdk/channel-feedback`                             |
| `removeAckReactionAfterReply`                        | Verwijder de bevestigingsreactie nadat het antwoord is afgeleverd. Importeer uit `plugin-sdk/channel-feedback`                            |
| `createTestRegistry`                                 | Bouw een registerfixture voor kanaal-Plugins. Importeer uit `plugin-sdk/plugin-test-runtime` of `plugin-sdk/channel-test-helpers`         |
| `createEmptyPluginRegistry`                          | Bouw een lege Plugin-registerfixture. Importeer uit `plugin-sdk/plugin-test-runtime` of `plugin-sdk/channel-test-helpers`                 |
| `setActivePluginRegistry`                            | Installeer een registerfixture voor Plugin-runtimetests. Importeer uit `plugin-sdk/plugin-test-runtime` of `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                      | Leg JSON-fetchverzoeken vast in tests voor mediahelpers. Importeer uit `plugin-sdk/test-env`                                             |
| `withServer`                                         | Voer tests uit tegen een tijdelijke lokale HTTP-server. Importeer uit `plugin-sdk/test-env`                                              |
| `createMockIncomingRequest`                          | Bouw een minimaal object voor een inkomend HTTP-verzoek. Importeer uit `plugin-sdk/test-env`                                             |
| `withFetchPreconnect`                                | Voer fetchtests uit met geïnstalleerde preconnect-hooks. Importeer uit `plugin-sdk/test-env`                                             |
| `withEnv` / `withEnvAsync`                           | Pas omgevingsvariabelen tijdelijk aan. Importeer uit `plugin-sdk/test-env`                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Maak geïsoleerde testfixtures voor het bestandssysteem. Importeer uit `plugin-sdk/test-env`                                              |
| `createMockServerResponse`                           | Maak een minimale mock van een HTTP-serverrespons. Importeer uit `plugin-sdk/test-env`                                                   |
| `createProviderUsageFetch`                           | Bouw fetchfixtures voor providergebruik. Importeer uit `plugin-sdk/test-env`                                                             |
| `useFrozenTime` / `useRealTime`                      | Bevries en herstel timers voor tijdgevoelige tests. Importeer uit `plugin-sdk/test-env`                                                  |
| `createCliRuntimeCapture`                            | Leg CLI-runtime-uitvoer vast in tests. Importeer uit `plugin-sdk/test-fixtures`                                                          |
| `importFreshModule`                                  | Importeer een ESM-module met een nieuw querytoken om de modulecache te omzeilen. Importeer uit `plugin-sdk/test-fixtures`                 |
| `bundledPluginRoot` / `bundledPluginFile`            | Bepaal fixturepaden naar de bron of distributie van gebundelde Plugins. Importeer uit `plugin-sdk/test-fixtures`                          |
| `mockNodeBuiltinModule`                              | Installeer gerichte Vitest-mocks voor ingebouwde Node-modules. Importeer uit `plugin-sdk/test-node-mocks`                                |
| `createSandboxTestContext`                           | Bouw sandboxtestcontexten. Importeer uit `plugin-sdk/test-fixtures`                                                                      |
| `writeSkill`                                         | Schrijf Skills-fixtures. Importeer uit `plugin-sdk/test-fixtures`                                                                        |
| `makeAgentAssistantMessage`                          | Bouw fixtures voor transcriptberichten van agents. Importeer uit `plugin-sdk/test-fixtures`                                              |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Inspecteer en reset fixtures voor systeemgebeurtenissen. Importeer uit `plugin-sdk/test-fixtures`                                        |
| `sanitizeTerminalText`                               | Saniteer terminaluitvoer voor assertions. Importeer uit `plugin-sdk/test-fixtures`                                                       |
| `countLines` / `hasBalancedFences`                   | Controleer de vorm van de uitvoer van de opdeling in segmenten. Importeer uit `plugin-sdk/test-fixtures`                                 |
| `typedCases`                                         | Behoud letterlijke typen voor tabelgestuurde tests. Importeer uit `plugin-sdk/test-fixtures`                                             |

Contracttestsuites voor gebundelde plugins gebruiken deze SDK-testsubpaden ook voor
helpers voor uitsluitend in tests gebruikte registers, manifesten, openbare artefacten en runtimefixtures.
Suites die uitsluitend voor de kern zijn en afhankelijk zijn van de gebundelde OpenClaw-inventaris, blijven in plaats daarvan onder
`src/plugins/contracts`.

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
het oplossen van kanaaldoelen:

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

Unittests die een handgeschreven `api`-mock aan `register(api)` doorgeven,
testen de acceptatiecontroles van de OpenClaw-lader niet. Voeg voor elk registratieoppervlak
waarvan je plugin afhankelijk is minstens één door de lader ondersteunde rooktest toe, vooral
voor hooks en exclusieve mogelijkheden zoals geheugen.

De echte lader laat pluginregistratie mislukken wanneer vereiste metadata ontbreekt of
een plugin een mogelijkheden-API aanroept waarvan deze geen eigenaar is. Zo vereist
`api.registerHook(...)` bijvoorbeeld een hooknaam en vereist
`api.registerMemoryCapability(...)` dat het pluginmanifest of het geëxporteerde
ingangspunt `kind: "memory"` declareert.

### Toegang tot runtimeconfiguratie testen

Geef de voorkeur aan de gedeelde mock voor de pluginruntime uit `openclaw/plugin-sdk/plugin-test-runtime`.
De mocks `runtime.config.loadConfig()` en `runtime.config.writeConfigFile(...)`
werpen standaard een fout op, zodat tests nieuw gebruik van verouderde compatibiliteits-API's
detecteren. Overschrijf die mocks alleen wanneer de test expliciet verouderd
compatibiliteitsgedrag behandelt.

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

Mock voor code die `createPluginRuntimeStore` gebruikt de runtime in tests:

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

## Contracttests (plugins in de repository)

Gebundelde plugins hebben contracttests die het eigenaarschap van registraties verifiëren:

```bash
pnpm test src/plugins/contracts/
```

Deze tests controleren:

- Welke plugins welke providers registreren
- Welke plugins welke spraakproviders registreren
- De correctheid van de registratiestructuur
- Naleving van het runtimecontract

### Afgebakende tests uitvoeren

Voor een specifieke plugin:

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

Alleen voor contracttests:

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## Lintafdwinging (plugins in de repository)

`scripts/run-additional-boundary-checks.mjs` voert in CI een reeks `lint:plugins:*`-controles
voor importgrenzen uit; elke controle kan lokaal ook afzonderlijk worden uitgevoerd:

| Opdracht                                                        | Dwingt af                                                                                                                    |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Gebundelde plugins mogen het monolithische root-barrel `openclaw/plugin-sdk` niet importeren.                                             |
| `pnpm run lint:plugins:no-extension-src-imports`               | Productie-extensiebestanden mogen de `src/**`-structuur van de repository niet rechtstreeks importeren (`../../src/...`).                                 |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | Extensietestbestanden mogen `openclaw/plugin-sdk/testing`, `plugin-sdk/test-utils` of andere testhelpers die uitsluitend voor de kern zijn niet importeren. |

Externe plugins vallen niet onder deze lintregels, maar het wordt aanbevolen
dezelfde patronen te volgen.

## Testconfiguratie

OpenClaw gebruikt Vitest 4 met informatieve V8-dekkingsrapportage. Voor plugintests:

```bash
# Run all tests
pnpm test

# Run specific plugin tests
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# Run with a specific test name filter
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# Run with coverage
pnpm test:coverage
```

Als lokale uitvoeringen geheugendruk veroorzaken:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Gerelateerd

- [SDK-overzicht](/nl/plugins/sdk-overview) -- importconventies
- [SDK-kanaalplugins](/nl/plugins/sdk-channel-plugins) -- interface voor kanaalplugins
- [SDK-providerplugins](/nl/plugins/sdk-provider-plugins) -- hooks voor providerplugins
- [Plugins bouwen](/nl/plugins/building-plugins) -- introductiehandleiding
