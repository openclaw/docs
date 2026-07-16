---
read_when:
    - Je schrijft tests voor een plugin
    - Je hebt testhulpprogramma's uit de Plugin-SDK nodig
    - Je wilt contracttests voor gebundelde plugins begrijpen
sidebarTitle: Testing
summary: Testhulpmiddelen en -patronen voor OpenClaw-plugins
title: Plugin testen
x-i18n:
    generated_at: "2026-07-16T16:08:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f82f32a61e1ba8049f410a6a1c3651055efb8c048eaa6d1ac0c1442c34726e6
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referentie voor testhulpprogramma's, patronen en lint-handhaving voor OpenClaw-
plugins.

<Tip>
  **Op zoek naar testvoorbeelden?** De handleidingen bevatten uitgewerkte testvoorbeelden:
  [Tests voor kanaalplugins](/nl/plugins/sdk-channel-plugins#step-6-test) en
  [Tests voor providerplugins](/nl/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Testhulpprogramma's

Deze subpaden zijn repo-lokale bron-entrypoints voor de eigen gebundelde
plugintests van OpenClaw. Het zijn geen gepubliceerde `package.json`-exports voor plugins
van derden en ze kunnen Vitest of andere testafhankelijkheden importeren die alleen in de repo beschikbaar zijn.

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

Gebruik deze gerichte subpaden voor tests van gebundelde plugins. De voormalige
`openclaw/plugin-sdk/testing`-barrel was repo-lokaal, uitgesloten van uitgebrachte
pakketten en is verwijderd. De verouderde alias `openclaw/plugin-sdk/test-utils`
blijft repo-lokaal; `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) weigert nieuwe imports voor extensietests
van die alias.

### Beschikbare exports

| Export                                               | Doel                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Bouw een minimale mock van de Plugin-API voor unit-tests van directe registratie. Importeer uit `plugin-sdk/plugin-test-api`                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Gedeelde contractfixture voor authenticatieprofielen voor systeemeigen agentruntime-adapters. Importeer uit `plugin-sdk/agent-runtime-test-contracts`            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Gedeelde contractfixture voor onderdrukking van aflevering voor systeemeigen agentruntime-adapters. Importeer uit `plugin-sdk/agent-runtime-test-contracts`    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Gedeelde contractfixture voor fallbackclassificatie voor systeemeigen agentruntime-adapters. Importeer uit `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Bouw fixtures voor schema's van dynamische tools voor contracttests van systeemeigen runtimes. Importeer uit `plugin-sdk/agent-runtime-test-contracts`              |
| `expectChannelInboundContextContract`                | Controleer de vorm van de inkomende kanaalcontext. Importeer uit `plugin-sdk/channel-contract-testing`                                                  |
| `installChannelOutboundPayloadContractSuite`         | Installeer contracttestgevallen voor uitgaande kanaalpayloads. Importeer uit `plugin-sdk/channel-contract-testing`                                       |
| `createStartAccountContext`                          | Bouw contexten voor de levenscyclus van kanaalaccounts. Importeer uit `plugin-sdk/channel-test-helpers`                                                  |
| `installChannelActionsContractSuite`                 | Installeer generieke contracttestgevallen voor kanaalberichtacties. Importeer uit `plugin-sdk/channel-test-helpers`                                     |
| `installChannelSetupContractSuite`                   | Installeer generieke contracttestgevallen voor kanaalconfiguratie. Importeer uit `plugin-sdk/channel-test-helpers`                                              |
| `installChannelStatusContractSuite`                  | Installeer generieke contracttestgevallen voor kanaalstatus. Importeer uit `plugin-sdk/channel-test-helpers`                                             |
| `expectDirectoryIds`                                 | Controleer kanaalmap-id's uit een functie die een mappenlijst retourneert. Importeer uit `plugin-sdk/channel-test-helpers`                               |
| `assertBundledChannelEntries`                        | Controleer of toegangspunten van gebundelde kanalen het verwachte openbare contract beschikbaar stellen. Importeer uit `plugin-sdk/channel-test-helpers`                    |
| `formatEnvelopeTimestamp`                            | Formatteer deterministische tijdstempels voor enveloppen. Importeer uit `plugin-sdk/channel-test-helpers`                                                  |
| `expectPairingReplyText`                             | Controleer de antwoordtekst voor kanaalkoppeling en extraheer de code. Importeer uit `plugin-sdk/channel-test-helpers`                                    |
| `describePluginRegistrationContract`                 | Installeer contractcontroles voor Plugin-registratie. Importeer uit `plugin-sdk/plugin-test-contracts`                                              |
| `registerSingleProviderPlugin`                       | Registreer één provider-Plugin in rooktests voor de lader. Importeer uit `plugin-sdk/plugin-test-runtime`                                         |
| `registerProviderPlugin`                             | Leg alle providertypen van één Plugin vast. Importeer uit `plugin-sdk/plugin-test-runtime`                                                 |
| `registerProviderPlugins`                            | Leg providerregistraties van meerdere plugins vast. Importeer uit `plugin-sdk/plugin-test-runtime`                                     |
| `requireRegisteredProvider`                          | Controleer of een providerverzameling een id bevat. Importeer uit `plugin-sdk/plugin-test-runtime`                                           |
| `createRuntimeEnv`                                   | Bouw een gemockte CLI-/Plugin-runtimeomgeving. Importeer uit `plugin-sdk/plugin-test-runtime`                                              |
| `createPluginRuntimeMock`                            | Bouw een gemockt Plugin-runtimeoppervlak. Importeer uit `plugin-sdk/plugin-test-runtime`                                                      |
| `createPluginSetupWizardStatus`                      | Bouw helpers voor de configuratiestatus van kanaalplugins. Importeer uit `plugin-sdk/plugin-test-runtime`                                             |
| `createTestWizardPrompter`                           | Bouw een gemockte promptfunctie voor de configuratiewizard. Importeer uit `plugin-sdk/plugin-test-runtime`                                                       |
| `createRuntimeTaskFlow`                              | Maak geïsoleerde runtime-status voor taakstromen. Importeer uit `plugin-sdk/plugin-test-runtime`                                                    |
| `runProviderCatalog`                                 | Voer een hook voor de providercatalogus uit met testafhankelijkheden. Importeer uit `plugin-sdk/plugin-test-runtime`                                     |
| `resolveProviderWizardOptions`                       | Los keuzes van de providerconfiguratiewizard op in contracttests. Importeer uit `plugin-sdk/plugin-test-runtime`                                    |
| `resolveProviderModelPickerEntries`                  | Los items van de providermodelkiezer op in contracttests. Importeer uit `plugin-sdk/plugin-test-runtime`                                    |
| `buildProviderPluginMethodChoice`                    | Bouw keuze-id's voor de providerwizard voor controles. Importeer uit `plugin-sdk/plugin-test-runtime`                                            |
| `setProviderWizardProvidersResolverForTest`          | Injecteer providers voor de providerwizard voor geïsoleerde tests. Importeer uit `plugin-sdk/plugin-test-runtime`                                        |
| `describeOpenAIProviderRuntimeContract`              | Installeer runtimecontractcontroles voor providerfamilies. Importeer uit `plugin-sdk/provider-test-contracts`                                        |
| `expectPassthroughReplayPolicy`                      | Controleer of beleid voor het opnieuw afspelen van providers wordt doorgegeven via tools en metadata die eigendom zijn van de provider. Importeer uit `plugin-sdk/provider-test-contracts`         |
| `runRealtimeSttLiveTest`                             | Voer een live test van een realtime STT-provider uit met gedeelde audiofixtures. Importeer uit `plugin-sdk/provider-test-contracts`                       |
| `normalizeTranscriptForMatch`                        | Normaliseer live transcriptuitvoer vóór fuzzy controles. Importeer uit `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitVideoGenerationCapabilities`          | Controleer of videoproviders expliciete mogelijkheden voor generatiemodi declareren. Importeer uit `plugin-sdk/provider-test-contracts`                   |
| `expectExplicitMusicGenerationCapabilities`          | Controleer of muziekproviders expliciete mogelijkheden voor genereren/bewerken declareren. Importeer uit `plugin-sdk/provider-test-contracts`                   |
| `mockSuccessfulDashscopeVideoTask`                   | Installeer een geslaagd DashScope-compatibel antwoord op een videotaak. Importeer uit `plugin-sdk/provider-test-contracts`                          |
| `getProviderHttpMocks`                               | Gebruik optionele Vitest-mocks voor HTTP/authenticatie van providers. Importeer uit `plugin-sdk/provider-http-test-mocks`                                         |
| `installProviderHttpMockCleanup`                     | Stel de mocks voor HTTP/authenticatie van providers na elke test opnieuw in. Importeer uit `plugin-sdk/provider-http-test-mocks`                                        |
| `installCommonResolveTargetErrorCases`               | Gedeelde testgevallen voor foutafhandeling bij doelresolutie. Importeer uit `plugin-sdk/channel-target-testing`                                  |
| `shouldAckReaction`                                  | Controleer of een kanaal een bevestigingsreactie moet toevoegen. Importeer uit `plugin-sdk/channel-feedback`                                            |
| `removeAckReactionAfterReply`                        | Verwijder de bevestigingsreactie nadat het antwoord is afgeleverd. Importeer uit `plugin-sdk/channel-feedback`                                                      |
| `createTestRegistry`                                 | Bouw een registerfixture voor kanaalplugins. Importeer uit `plugin-sdk/plugin-test-runtime` of `plugin-sdk/channel-test-helpers`               |
| `createEmptyPluginRegistry`                          | Bouw een lege registerfixture voor plugins. Importeer uit `plugin-sdk/plugin-test-runtime` of `plugin-sdk/channel-test-helpers`                |
| `setActivePluginRegistry`                            | Installeer een registerfixture voor Plugin-runtimetests. Importeer uit `plugin-sdk/plugin-test-runtime` of `plugin-sdk/channel-test-helpers`   |
| `createRequestCaptureJsonFetch`                      | Leg JSON-fetchverzoeken vast in tests van mediahelpers. Importeer uit `plugin-sdk/test-env`                                                     |
| `withServer`                                         | Voer tests uit tegen een tijdelijke lokale HTTP-server. Importeer uit `plugin-sdk/test-env`                                                      |
| `createMockIncomingRequest`                          | Bouw een minimaal object voor inkomende HTTP-verzoeken. Importeer uit `plugin-sdk/test-env`                                                          |
| `withFetchPreconnect`                                | Voer fetchtests uit met geïnstalleerde preconnect-hooks. Importeer uit `plugin-sdk/test-env`                                                       |
| `withEnv` / `withEnvAsync`                           | Pas omgevingsvariabelen tijdelijk aan. Importeer uit `plugin-sdk/test-env`                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Maak geïsoleerde bestandssysteemfixtures voor tests. Importeer uit `plugin-sdk/test-env`                                                              |
| `createMockServerResponse`                           | Maak een minimale mock voor een HTTP-serverantwoord. Importeer uit `plugin-sdk/test-env`                                                            |
| `createProviderUsageFetch`                           | Bouw fetchfixtures voor providergebruik. Importeer uit `plugin-sdk/test-env`                                                                   |
| `useFrozenTime` / `useRealTime`                      | Bevries en herstel timers voor tijdgevoelige tests. Importeer uit `plugin-sdk/test-env`                                                    |
| `createCliRuntimeCapture`                            | Leg CLI-runtime-uitvoer vast in tests. Importeer uit `plugin-sdk/test-fixtures`                                                              |
| `importFreshModule`                                  | Importeer een ESM-module met een nieuw querytoken om de modulecache te omzeilen. Importeer uit `plugin-sdk/test-fixtures`                             |
| `bundledPluginRoot` / `bundledPluginFile`            | Los fixturepaden naar broncode of dist van gebundelde plugins op. Importeer uit `plugin-sdk/test-fixtures`                                              |
| `mockNodeBuiltinModule`                              | Installeer beperkte Vitest-mocks voor ingebouwde Node-modules. Importeer uit `plugin-sdk/test-node-mocks`                                                       |
| `createSandboxTestContext`                           | Bouw sandboxtestcontexten. Importeer uit `plugin-sdk/test-fixtures`                                                                      |
| `writeSkill`                                         | Schrijf Skills-fixtures. Importeer uit `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | Bouw berichtfixtures voor agenttranscripten. Importeer uit `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Inspecteer systeemgebeurtenisfixtures en stel ze opnieuw in. Importeer uit `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | Sanitizeer terminaluitvoer voor controles. Importeer uit `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | Controleer de vorm van de uitvoer van opdelen in segmenten. Importeer uit `plugin-sdk/test-fixtures`                                                                     |
| `typedCases`                                         | Behoud letterlijke typen voor tabelgestuurde tests. Importeer uit `plugin-sdk/test-fixtures`                                                    |

Contractsuites voor gebundelde plugins gebruiken deze SDK-testsubpaden ook voor
register-, manifest-, openbaar-artifact- en runtimefixturehelpers die uitsluitend voor tests zijn bedoeld.
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

## Resolutie van testdoelen

Gebruik `installCommonResolveTargetErrorCases` om standaardfoutgevallen toe te voegen voor de
resolutie van kanaaldoelen:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("doelresolutie van my-channel", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // De logica voor doelresolutie van je kanaal
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Voeg kanaalspecifieke testgevallen toe
  it("moet @username-doelen oplossen", () => {
    // ...
  });
});
```

## Testpatronen

### Registratiecontracten testen

Unittests die een handgeschreven mock van `api` doorgeven aan `register(api)`, testen
de acceptatiecontroles van de OpenClaw-loader niet. Voeg ten minste één door de loader ondersteunde
rooktest toe voor elk registratieoppervlak waarvan je Plugin afhankelijk is, met name
hooks en exclusieve mogelijkheden zoals geheugen.

De echte loader laat Plugin-registratie mislukken wanneer vereiste metadata ontbreekt of
een Plugin een capability-API aanroept waarvan deze geen eigenaar is. Zo vereist
`api.registerHook(...)` bijvoorbeeld een hooknaam, en vereist
`api.registerMemoryCapability(...)` dat het Plugin-manifest of de geëxporteerde
ingang `kind: "memory"` declareert.

### Toegang tot runtimeconfiguratie testen

Geef de voorkeur aan de gedeelde mock voor de Plugin-runtime uit `openclaw/plugin-sdk/plugin-test-runtime`.
De mocks `runtime.config.loadConfig()` en `runtime.config.writeConfigFile(...)`
werpen standaard een fout op, zodat tests nieuw gebruik van verouderde compatibiliteits-
API's detecteren. Overschrijf deze mocks alleen wanneer de test expliciet verouderd
compatibiliteitsgedrag behandelt.

### Een kanaal-Plugin unit-testen

```typescript
import { describe, it, expect, vi } from "vitest";

describe("my-channel-Plugin", () => {
  it("moet een account uit de configuratie oplossen", () => {
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

  it("moet een account inspecteren zonder geheimen te materialiseren", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // Geen tokenwaarde blootgesteld
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Een provider-Plugin unit-testen

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider-Plugin", () => {
  it("moet dynamische modellen oplossen", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... context
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("moet een catalogus retourneren wanneer een API-sleutel beschikbaar is", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... context
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### De Plugin-runtime nabootsen

Voor code die `createPluginRuntimeStore` gebruikt, bootst je de runtime na in tests:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "testruntime niet ingesteld",
});

// In de testconfiguratie
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... andere mocks
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... andere naamruimten
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// Na de tests
store.clearRuntime();
```

### Testen met stubs per instantie

Geef de voorkeur aan stubs per instantie boven het wijzigen van het prototype:

```typescript
// Aanbevolen: stub per instantie
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Vermijd: het prototype wijzigen
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Contracttests (Plugins in de repository)

Gebundelde Plugins hebben contracttests die het eigenaarschap van registraties verifiëren:

```bash
pnpm test src/plugins/contracts/
```

Deze tests controleren:

- Welke Plugins welke providers registreren
- Welke Plugins welke spraakproviders registreren
- Correctheid van de registratiestructuur
- Naleving van het runtimecontract

### Afgebakende tests uitvoeren

Voor een specifieke Plugin:

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

Alleen voor contracttests:

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## Lintafdwinging (Plugins in de repository)

`scripts/run-additional-boundary-checks.mjs` voert in CI een reeks `lint:plugins:*`-controles
op importgrenzen uit; elke controle kan ook afzonderlijk lokaal worden uitgevoerd:

| Opdracht                                                        | Dwingt af                                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Gebundelde Plugins mogen de monolithische rootbarrel `openclaw/plugin-sdk` niet importeren.             |
| `pnpm run lint:plugins:no-extension-src-imports`               | Productie-extensiebestanden mogen de `src/**`-structuur van de repository niet rechtstreeks importeren (`../../src/...`). |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | Extensietestbestanden mogen `plugin-sdk/test-utils` of andere uitsluitend voor de kern bestemde testhelpers niet importeren. |

Externe Plugins vallen niet onder deze lintregels, maar het wordt aanbevolen
dezelfde patronen te volgen.

## Testconfiguratie

OpenClaw gebruikt Vitest 4 met informatieve V8-dekkingsrapportage. Voor Plugin-tests:

```bash
# Voer alle tests uit
pnpm test

# Voer tests voor een specifieke Plugin uit
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# Voer uit met een filter voor een specifieke testnaam
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# Voer uit met dekkingsrapportage
pnpm test:coverage
```

Als lokale uitvoeringen geheugendruk veroorzaken:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Gerelateerd

- [SDK-overzicht](/nl/plugins/sdk-overview) -- importconventies
- [SDK-kanaal-Plugins](/nl/plugins/sdk-channel-plugins) -- interface voor kanaal-Plugins
- [SDK-provider-Plugins](/nl/plugins/sdk-provider-plugins) -- hooks voor provider-Plugins
- [Plugins bouwen](/nl/plugins/building-plugins) -- handleiding om aan de slag te gaan
