---
read_when:
    - Sie schreiben Tests für ein Plugin
    - Sie benötigen Testhilfsprogramme aus dem Plugin-SDK
    - Sie möchten Vertragstests für gebündelte Plugins verstehen
sidebarTitle: Testing
summary: Testhilfsprogramme und -muster für OpenClaw-Plugins
title: Plugin-Tests
x-i18n:
    generated_at: "2026-07-12T02:01:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 666160b6eb0c2f3187e8f8b3efe417537c4c4404fe564c463da4d222bced3b8f
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referenz für Testhilfsprogramme, Muster und die Durchsetzung von Lint-Regeln für OpenClaw-
Plugins.

<Tip>
  **Suchen Sie nach Testbeispielen?** Die Anleitungen enthalten ausgearbeitete Testbeispiele:
  [Tests für Channel-Plugins](/de/plugins/sdk-channel-plugins#step-6-test) und
  [Tests für Provider-Plugins](/de/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Testhilfsprogramme

Diese Unterpfade sind Repository-lokale Quellcode-Einstiegspunkte für die mitgelieferten
Plugin-Tests von OpenClaw. Sie sind keine veröffentlichten `package.json`-Exporte für
Drittanbieter-Plugins und können Vitest oder andere ausschließlich im Repository verfügbare Testabhängigkeiten importieren.

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

Bevorzugen Sie diese gezielten Unterpfade für neue Tests mitgelieferter Plugins. Das umfassende
`openclaw/plugin-sdk/testing`-Barrel und der Alias `openclaw/plugin-sdk/test-utils`
dienen ausschließlich der Legacy-Kompatibilität: `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) weist neue Importe
beider Pfade aus Erweiterungstestdateien zurück, und beide bleiben ausschließlich für
Kompatibilitätsnachweistests bestehen.

### Verfügbare Exporte

| Export                                               | Zweck                                                                                                                                                    |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Erstellt einen minimalen Mock der Plugin-API für Unit-Tests zur direkten Registrierung. Aus `plugin-sdk/plugin-test-api` importieren                      |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Gemeinsame Vertrags-Fixture für Authentifizierungsprofile nativer Agent-Runtime-Adapter. Aus `plugin-sdk/agent-runtime-test-contracts` importieren        |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Gemeinsame Vertrags-Fixture zur Unterdrückung der Zustellung für native Agent-Runtime-Adapter. Aus `plugin-sdk/agent-runtime-test-contracts` importieren   |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Gemeinsame Vertrags-Fixture zur Fallback-Klassifizierung für native Agent-Runtime-Adapter. Aus `plugin-sdk/agent-runtime-test-contracts` importieren       |
| `createParameterFreeTool`                            | Erstellt Schemas-Fixtures für dynamische Tools in Vertragstests nativer Runtimes. Aus `plugin-sdk/agent-runtime-test-contracts` importieren               |
| `expectChannelInboundContextContract`                | Prüft die Struktur des eingehenden Kanal-Kontexts. Aus `plugin-sdk/channel-contract-testing` importieren                                                  |
| `installChannelOutboundPayloadContractSuite`         | Installiert Vertragsfälle für ausgehende Kanal-Payloads. Aus `plugin-sdk/channel-contract-testing` importieren                                            |
| `createStartAccountContext`                          | Erstellt Lebenszykluskontexte für Kanalkonten. Aus `plugin-sdk/channel-test-helpers` importieren                                                          |
| `installChannelActionsContractSuite`                 | Installiert generische Vertragsfälle für Kanalnachrichtenaktionen. Aus `plugin-sdk/channel-test-helpers` importieren                                      |
| `installChannelSetupContractSuite`                   | Installiert generische Vertragsfälle für die Kanaleinrichtung. Aus `plugin-sdk/channel-test-helpers` importieren                                          |
| `installChannelStatusContractSuite`                  | Installiert generische Vertragsfälle für den Kanalstatus. Aus `plugin-sdk/channel-test-helpers` importieren                                               |
| `expectDirectoryIds`                                 | Prüft Kanalverzeichnis-IDs aus einer Funktion zur Verzeichnisauflistung. Aus `plugin-sdk/channel-test-helpers` importieren                                 |
| `assertBundledChannelEntries`                        | Prüft, ob die Einstiegspunkte gebündelter Kanäle den erwarteten öffentlichen Vertrag bereitstellen. Aus `plugin-sdk/channel-test-helpers` importieren     |
| `formatEnvelopeTimestamp`                            | Formatiert deterministische Zeitstempel für Umschläge. Aus `plugin-sdk/channel-test-helpers` importieren                                                  |
| `expectPairingReplyText`                             | Prüft den Antworttext für die Kanalkopplung und extrahiert dessen Code. Aus `plugin-sdk/channel-test-helpers` importieren                                  |
| `describePluginRegistrationContract`                 | Installiert Vertragsprüfungen für die Plugin-Registrierung. Aus `plugin-sdk/plugin-test-contracts` importieren                                            |
| `registerSingleProviderPlugin`                       | Registriert ein Provider-Plugin in Loader-Smoke-Tests. Aus `plugin-sdk/plugin-test-runtime` importieren                                                   |
| `registerProviderPlugin`                             | Erfasst alle Provider-Typen eines Plugins. Aus `plugin-sdk/plugin-test-runtime` importieren                                                               |
| `registerProviderPlugins`                            | Erfasst Provider-Registrierungen über mehrere Plugins hinweg. Aus `plugin-sdk/plugin-test-runtime` importieren                                            |
| `requireRegisteredProvider`                          | Prüft, ob eine Provider-Sammlung eine ID enthält. Aus `plugin-sdk/plugin-test-runtime` importieren                                                        |
| `createRuntimeEnv`                                   | Erstellt eine simulierte CLI-/Plugin-Runtime-Umgebung. Aus `plugin-sdk/plugin-test-runtime` importieren                                                   |
| `createPluginRuntimeMock`                            | Erstellt einen Mock der Plugin-Runtime-Oberfläche. Aus `plugin-sdk/plugin-test-runtime` importieren                                                       |
| `createPluginSetupWizardStatus`                      | Erstellt Hilfsfunktionen für den Einrichtungsstatus von Kanal-Plugins. Aus `plugin-sdk/plugin-test-runtime` importieren                                    |
| `createTestWizardPrompter`                           | Erstellt einen Mock für die Eingabeaufforderungen des Einrichtungsassistenten. Aus `plugin-sdk/plugin-test-runtime` importieren                            |
| `createRuntimeTaskFlow`                              | Erstellt einen isolierten Runtime-TaskFlow-Zustand. Aus `plugin-sdk/plugin-test-runtime` importieren                                                      |
| `runProviderCatalog`                                 | Führt einen Provider-Katalog-Hook mit Testabhängigkeiten aus. Aus `plugin-sdk/plugin-test-runtime` importieren                                             |
| `resolveProviderWizardOptions`                       | Löst Auswahlmöglichkeiten des Provider-Einrichtungsassistenten in Vertragstests auf. Aus `plugin-sdk/plugin-test-runtime` importieren                     |
| `resolveProviderModelPickerEntries`                  | Löst Einträge der Provider-Modellauswahl in Vertragstests auf. Aus `plugin-sdk/plugin-test-runtime` importieren                                            |
| `buildProviderPluginMethodChoice`                    | Erstellt Auswahl-IDs des Provider-Assistenten für Prüfungen. Aus `plugin-sdk/plugin-test-runtime` importieren                                              |
| `setProviderWizardProvidersResolverForTest`          | Injiziert Provider des Provider-Assistenten für isolierte Tests. Aus `plugin-sdk/plugin-test-runtime` importieren                                          |
| `describeOpenAIProviderRuntimeContract`              | Installiert Runtime-Vertragsprüfungen für Provider-Familien. Aus `plugin-sdk/provider-test-contracts` importieren                                         |
| `expectPassthroughReplayPolicy`                      | Prüft, ob Provider-Wiedergaberichtlinien Provider-eigene Tools und Metadaten unverändert durchreichen. Aus `plugin-sdk/provider-test-contracts` importieren |
| `runRealtimeSttLiveTest`                             | Führt einen Live-Test eines Echtzeit-STT-Providers mit gemeinsamen Audio-Fixtures aus. Aus `plugin-sdk/provider-test-contracts` importieren               |
| `normalizeTranscriptForMatch`                        | Normalisiert die Ausgabe eines Live-Transkripts vor unscharfen Prüfungen. Aus `plugin-sdk/provider-test-contracts` importieren                             |
| `expectExplicitVideoGenerationCapabilities`          | Prüft, ob Video-Provider explizite Fähigkeiten für Generierungsmodi deklarieren. Aus `plugin-sdk/provider-test-contracts` importieren                      |
| `expectExplicitMusicGenerationCapabilities`          | Prüft, ob Musik-Provider explizite Generierungs- und Bearbeitungsfähigkeiten deklarieren. Aus `plugin-sdk/provider-test-contracts` importieren             |
| `mockSuccessfulDashscopeVideoTask`                   | Installiert eine erfolgreiche, mit DashScope kompatible Antwort für eine Videoaufgabe. Aus `plugin-sdk/provider-test-contracts` importieren               |
| `getProviderHttpMocks`                               | Greift auf optionale Vitest-Mocks für Provider-HTTP und -Authentifizierung zu. Aus `plugin-sdk/provider-http-test-mocks` importieren                       |
| `installProviderHttpMockCleanup`                     | Setzt Provider-HTTP- und -Authentifizierungs-Mocks nach jedem Test zurück. Aus `plugin-sdk/provider-http-test-mocks` importieren                           |
| `installCommonResolveTargetErrorCases`               | Gemeinsame Testfälle für die Fehlerbehandlung bei der Zielauflösung. Aus `plugin-sdk/channel-target-testing` importieren                                   |
| `shouldAckReaction`                                  | Prüft, ob ein Kanal eine Bestätigungsreaktion hinzufügen soll. Aus `plugin-sdk/channel-feedback` importieren                                               |
| `removeAckReactionAfterReply`                        | Entfernt die Bestätigungsreaktion nach der Zustellung der Antwort. Aus `plugin-sdk/channel-feedback` importieren                                           |
| `createTestRegistry`                                 | Erstellt eine Registry-Fixture für Kanal-Plugins. Aus `plugin-sdk/plugin-test-runtime` oder `plugin-sdk/channel-test-helpers` importieren                  |
| `createEmptyPluginRegistry`                          | Erstellt eine leere Plugin-Registry-Fixture. Aus `plugin-sdk/plugin-test-runtime` oder `plugin-sdk/channel-test-helpers` importieren                       |
| `setActivePluginRegistry`                            | Installiert eine Registry-Fixture für Plugin-Runtime-Tests. Aus `plugin-sdk/plugin-test-runtime` oder `plugin-sdk/channel-test-helpers` importieren        |
| `createRequestCaptureJsonFetch`                      | Erfasst JSON-Fetch-Anfragen in Tests für Medien-Hilfsfunktionen. Aus `plugin-sdk/test-env` importieren                                                     |
| `withServer`                                         | Führt Tests gegen einen temporären lokalen HTTP-Server aus. Aus `plugin-sdk/test-env` importieren                                                          |
| `createMockIncomingRequest`                          | Erstellt ein minimales Objekt für eingehende HTTP-Anfragen. Aus `plugin-sdk/test-env` importieren                                                         |
| `withFetchPreconnect`                                | Führt Fetch-Tests mit installierten Preconnect-Hooks aus. Aus `plugin-sdk/test-env` importieren                                                            |
| `withEnv` / `withEnvAsync`                           | Passt Umgebungsvariablen vorübergehend an. Aus `plugin-sdk/test-env` importieren                                                                          |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Erstellt isolierte Dateisystem-Test-Fixtures. Aus `plugin-sdk/test-env` importieren                                                                        |
| `createMockServerResponse`                           | Erstellt einen minimalen Mock für HTTP-Serverantworten. Aus `plugin-sdk/test-env` importieren                                                             |
| `createProviderUsageFetch`                           | Erstellt Fetch-Fixtures für die Provider-Nutzung. Aus `plugin-sdk/test-env` importieren                                                                   |
| `useFrozenTime` / `useRealTime`                      | Hält Timer für zeitkritische Tests an und stellt sie wieder her. Aus `plugin-sdk/test-env` importieren                                                     |
| `createCliRuntimeCapture`                            | Erfasst die CLI-Runtime-Ausgabe in Tests. Aus `plugin-sdk/test-fixtures` importieren                                                                      |
| `importFreshModule`                                  | Importiert ein ESM-Modul mit einem neuen Abfrage-Token, um den Modul-Cache zu umgehen. Aus `plugin-sdk/test-fixtures` importieren                          |
| `bundledPluginRoot` / `bundledPluginFile`            | Löst Fixture-Pfade zu Quellcode oder Distribution gebündelter Plugins auf. Aus `plugin-sdk/test-fixtures` importieren                                     |
| `mockNodeBuiltinModule`                              | Installiert eng begrenzte Vitest-Mocks für integrierte Node-Module. Aus `plugin-sdk/test-node-mocks` importieren                                          |
| `createSandboxTestContext`                           | Erstellt Sandbox-Testkontexte. Aus `plugin-sdk/test-fixtures` importieren                                                                                  |
| `writeSkill`                                         | Skill-Fixtures schreiben. Aus `plugin-sdk/test-fixtures` importieren                                                                     |
| `makeAgentAssistantMessage`                          | Fixtures für Nachrichten in Agent-Transkripten erstellen. Aus `plugin-sdk/test-fixtures` importieren                                     |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Fixtures für Systemereignisse prüfen und zurücksetzen. Aus `plugin-sdk/test-fixtures` importieren                                         |
| `sanitizeTerminalText`                               | Terminalausgabe für Assertions bereinigen. Aus `plugin-sdk/test-fixtures` importieren                                                     |
| `countLines` / `hasBalancedFences`                   | Struktur der Chunking-Ausgabe prüfen. Aus `plugin-sdk/test-fixtures` importieren                                                          |
| `typedCases`                                         | Literale Typen für tabellengesteuerte Tests beibehalten. Aus `plugin-sdk/test-fixtures` importieren                                       |

Gebündelte Plugin-Vertragstests verwenden diese SDK-Testunterpfade ebenfalls für
ausschließlich in Tests genutzte Hilfsfunktionen für Registry, Manifest, öffentliche Artefakte und Laufzeit-Fixtures.
Reine Core-Testreihen, die vom gebündelten OpenClaw-Bestand abhängen, verbleiben
stattdessen unter `src/plugins/contracts`.

### Typen

Spezialisierte Testunterpfade reexportieren außerdem Typen, die in Testdateien nützlich sind:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Auflösung von Testzielen

Verwenden Sie `installCommonResolveTargetErrorCases`, um Standardfehlerfälle für
die Auflösung von Kanalzielen hinzuzufügen:

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

## Testmuster

### Testen von Registrierungsverträgen

Unit-Tests, die einen manuell erstellten `api`-Mock an `register(api)` übergeben,
durchlaufen die Akzeptanzprüfungen des OpenClaw-Loaders nicht. Fügen Sie für jede
Registrierungsoberfläche, von der Ihr Plugin abhängt, mindestens einen Loader-gestützten
Smoke-Test hinzu, insbesondere für Hooks und exklusive Fähigkeiten wie Speicher.

Der echte Loader lässt die Plugin-Registrierung fehlschlagen, wenn erforderliche Metadaten fehlen oder
ein Plugin eine Fähigkeits-API aufruft, die ihm nicht gehört. Beispielsweise
erfordert `api.registerHook(...)` einen Hook-Namen, und
`api.registerMemoryCapability(...)` erfordert, dass das Plugin-Manifest oder der exportierte
Einstieg `kind: "memory"` deklariert.

### Testen des Zugriffs auf die Laufzeitkonfiguration

Bevorzugen Sie den gemeinsamen Plugin-Laufzeit-Mock aus `openclaw/plugin-sdk/plugin-test-runtime`.
Seine Mocks `runtime.config.loadConfig()` und `runtime.config.writeConfigFile(...)`
lösen standardmäßig Fehler aus, damit Tests neue Verwendungen veralteter Kompatibilitäts-APIs
erkennen. Überschreiben Sie diese Mocks nur, wenn der Test ausdrücklich
älteres Kompatibilitätsverhalten abdeckt.

### Unit-Test eines Kanal-Plugins

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

### Unit-Test eines Provider-Plugins

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

### Mocken der Plugin-Laufzeit

Mocken Sie für Code, der `createPluginRuntimeStore` verwendet, die Laufzeit in Tests:

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

### Testen mit instanzbezogenen Stubs

Bevorzugen Sie instanzbezogene Stubs gegenüber der Veränderung des Prototyps:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Vertragstests (Plugins im Repository)

Gebündelte Plugins verfügen über Vertragstests, die die Zuständigkeit für Registrierungen überprüfen:

```bash
pnpm test src/plugins/contracts/
```

Diese Tests prüfen:

- Welche Plugins welche Provider registrieren
- Welche Plugins welche Sprach-Provider registrieren
- Korrektheit der Registrierungsstruktur
- Einhaltung des Laufzeitvertrags

### Ausführen eingegrenzter Tests

Für ein bestimmtes Plugin:

```bash
pnpm test <bundled-plugin-root>/my-channel/
```

Nur für Vertragstests:

```bash
pnpm test src/plugins/contracts/shape.contract.test.ts
pnpm test src/plugins/contracts/auth-choice.contract.test.ts
pnpm test src/plugins/contracts/runtime-seams.contract.test.ts
```

## Lint-Durchsetzung (Plugins im Repository)

`scripts/run-additional-boundary-checks.mjs` führt in der CI eine Reihe von
`lint:plugins:*`-Prüfungen für Importgrenzen aus; jede kann außerdem lokal eigenständig ausgeführt werden:

| Befehl                                                        | Erzwingt                                                                                                                    |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Gebündelte Plugins dürfen das monolithische Root-Barrel `openclaw/plugin-sdk` nicht importieren.                                             |
| `pnpm run lint:plugins:no-extension-src-imports`               | Produktivdateien von Erweiterungen dürfen den Repository-Baum `src/**` nicht direkt importieren (`../../src/...`).                                 |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | Testdateien von Erweiterungen dürfen `openclaw/plugin-sdk/testing`, `plugin-sdk/test-utils` oder andere ausschließlich für den Core bestimmte Testhilfen nicht importieren. |

Externe Plugins unterliegen diesen Lint-Regeln nicht, es wird jedoch empfohlen,
dieselben Muster zu befolgen.

## Testkonfiguration

OpenClaw verwendet Vitest 4 mit informativer V8-Coverage-Berichterstattung. Für Plugin-Tests:

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

Wenn lokale Ausführungen zu hoher Speicherauslastung führen:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Verwandte Themen

- [SDK-Übersicht](/de/plugins/sdk-overview) -- Importkonventionen
- [SDK-Kanal-Plugins](/de/plugins/sdk-channel-plugins) -- Schnittstelle für Kanal-Plugins
- [SDK-Provider-Plugins](/de/plugins/sdk-provider-plugins) -- Hooks für Provider-Plugins
- [Plugins erstellen](/de/plugins/building-plugins) -- Leitfaden für den Einstieg
