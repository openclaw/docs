---
read_when:
    - Sie schreiben Tests für ein Plugin
    - Sie benötigen Testhilfsprogramme aus dem Plugin-SDK
    - Sie möchten Vertragstests für gebündelte Plugins verstehen
sidebarTitle: Testing
summary: Testhilfen und -muster für OpenClaw-Plugins
title: Plugin-Tests
x-i18n:
    generated_at: "2026-07-12T15:39:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 666160b6eb0c2f3187e8f8b3efe417537c4c4404fe564c463da4d222bced3b8f
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referenz für Testhilfsfunktionen, Muster und die Durchsetzung von Lint-Regeln für OpenClaw-
Plugins.

<Tip>
  **Suchen Sie nach Testbeispielen?** Die Anleitungen enthalten ausgearbeitete Testbeispiele:
  [Tests für Channel-Plugins](/de/plugins/sdk-channel-plugins#step-6-test) und
  [Tests für Provider-Plugins](/de/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Testhilfsfunktionen

Diese Unterpfade sind Repository-lokale Quellcode-Einstiegspunkte für die mitgelieferten
Plugin-Tests von OpenClaw. Sie werden nicht als `package.json`-Exporte für Plugins
von Drittanbietern veröffentlicht und können Vitest oder andere ausschließlich im Repository
verwendete Testabhängigkeiten importieren.

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

Verwenden Sie für neue Tests mitgelieferter Plugins bevorzugt diese gezielten Unterpfade. Der umfassende
`openclaw/plugin-sdk/testing`-Barrel und der Alias `openclaw/plugin-sdk/test-utils`
dienen ausschließlich der Legacy-Kompatibilität: `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) lehnt neue Importe
aus Erweiterungstestdateien ab, und beide bleiben ausschließlich für
Kompatibilitätsnachweis-Tests erhalten.

### Verfügbare Exporte

| Export                                               | Zweck                                                                                                                                                                        |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Erstellt einen minimalen Mock der Plugin-API für Unit-Tests der direkten Registrierung. Aus `plugin-sdk/plugin-test-api` importieren                                         |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Gemeinsame Vertrags-Fixture für Authentifizierungsprofile nativer Agent-Runtime-Adapter. Aus `plugin-sdk/agent-runtime-test-contracts` importieren                            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Gemeinsame Vertrags-Fixture für die Unterdrückung der Zustellung bei nativen Agent-Runtime-Adaptern. Aus `plugin-sdk/agent-runtime-test-contracts` importieren                 |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Gemeinsame Vertrags-Fixture für die Fallback-Klassifizierung nativer Agent-Runtime-Adapter. Aus `plugin-sdk/agent-runtime-test-contracts` importieren                         |
| `createParameterFreeTool`                            | Erstellt Schemakonstrukte für dynamische Tools für Vertragstests nativer Runtimes. Aus `plugin-sdk/agent-runtime-test-contracts` importieren                                  |
| `expectChannelInboundContextContract`                | Prüft die Struktur des eingehenden Kanalkontexts. Aus `plugin-sdk/channel-contract-testing` importieren                                                                       |
| `installChannelOutboundPayloadContractSuite`         | Installiert Vertragsfälle für ausgehende Kanal-Payloads. Aus `plugin-sdk/channel-contract-testing` importieren                                                                |
| `createStartAccountContext`                          | Erstellt Lebenszykluskontexte für Kanalkonten. Aus `plugin-sdk/channel-test-helpers` importieren                                                                               |
| `installChannelActionsContractSuite`                 | Installiert generische Vertragsfälle für Kanalnachrichtenaktionen. Aus `plugin-sdk/channel-test-helpers` importieren                                                          |
| `installChannelSetupContractSuite`                   | Installiert generische Vertragsfälle für die Kanaleinrichtung. Aus `plugin-sdk/channel-test-helpers` importieren                                                              |
| `installChannelStatusContractSuite`                  | Installiert generische Vertragsfälle für den Kanalstatus. Aus `plugin-sdk/channel-test-helpers` importieren                                                                   |
| `expectDirectoryIds`                                 | Prüft Kanalverzeichnis-IDs aus einer Funktion zur Verzeichnisauflistung. Aus `plugin-sdk/channel-test-helpers` importieren                                                     |
| `assertBundledChannelEntries`                        | Prüft, ob die Einstiegspunkte gebündelter Kanäle den erwarteten öffentlichen Vertrag bereitstellen. Aus `plugin-sdk/channel-test-helpers` importieren                         |
| `formatEnvelopeTimestamp`                            | Formatiert deterministische Zeitstempel für Umschläge. Aus `plugin-sdk/channel-test-helpers` importieren                                                                      |
| `expectPairingReplyText`                             | Prüft den Antworttext zur Kanalkopplung und extrahiert dessen Code. Aus `plugin-sdk/channel-test-helpers` importieren                                                         |
| `describePluginRegistrationContract`                 | Installiert Vertragsprüfungen für die Plugin-Registrierung. Aus `plugin-sdk/plugin-test-contracts` importieren                                                                |
| `registerSingleProviderPlugin`                       | Registriert ein Provider-Plugin in Loader-Smoke-Tests. Aus `plugin-sdk/plugin-test-runtime` importieren                                                                       |
| `registerProviderPlugin`                             | Erfasst alle Provider-Arten eines Plugins. Aus `plugin-sdk/plugin-test-runtime` importieren                                                                                   |
| `registerProviderPlugins`                            | Erfasst Provider-Registrierungen über mehrere Plugins hinweg. Aus `plugin-sdk/plugin-test-runtime` importieren                                                                |
| `requireRegisteredProvider`                          | Prüft, ob eine Provider-Sammlung eine ID enthält. Aus `plugin-sdk/plugin-test-runtime` importieren                                                                            |
| `createRuntimeEnv`                                   | Erstellt eine gemockte CLI-/Plugin-Runtime-Umgebung. Aus `plugin-sdk/plugin-test-runtime` importieren                                                                         |
| `createPluginRuntimeMock`                            | Erstellt einen Mock der Plugin-Runtime-Oberfläche. Aus `plugin-sdk/plugin-test-runtime` importieren                                                                           |
| `createPluginSetupWizardStatus`                      | Erstellt Hilfsfunktionen für den Einrichtungsstatus von Kanal-Plugins. Aus `plugin-sdk/plugin-test-runtime` importieren                                                       |
| `createTestWizardPrompter`                           | Erstellt einen Mock für die Eingabeaufforderungen des Einrichtungsassistenten. Aus `plugin-sdk/plugin-test-runtime` importieren                                               |
| `createRuntimeTaskFlow`                              | Erstellt einen isolierten Runtime-TaskFlow-Zustand. Aus `plugin-sdk/plugin-test-runtime` importieren                                                                          |
| `runProviderCatalog`                                 | Führt einen Provider-Katalog-Hook mit Testabhängigkeiten aus. Aus `plugin-sdk/plugin-test-runtime` importieren                                                                |
| `resolveProviderWizardOptions`                       | Löst die Auswahloptionen des Provider-Einrichtungsassistenten in Vertragstests auf. Aus `plugin-sdk/plugin-test-runtime` importieren                                          |
| `resolveProviderModelPickerEntries`                  | Löst Einträge der Provider-Modellauswahl in Vertragstests auf. Aus `plugin-sdk/plugin-test-runtime` importieren                                                               |
| `buildProviderPluginMethodChoice`                    | Erstellt Auswahl-IDs des Provider-Assistenten für Prüfungen. Aus `plugin-sdk/plugin-test-runtime` importieren                                                                 |
| `setProviderWizardProvidersResolverForTest`          | Injiziert Provider des Provider-Assistenten für isolierte Tests. Aus `plugin-sdk/plugin-test-runtime` importieren                                                             |
| `describeOpenAIProviderRuntimeContract`              | Installiert Runtime-Vertragsprüfungen für Provider-Familien. Aus `plugin-sdk/provider-test-contracts` importieren                                                             |
| `expectPassthroughReplayPolicy`                      | Prüft, ob Provider-Wiedergaberichtlinien Provider-eigene Tools und Metadaten unverändert durchreichen. Aus `plugin-sdk/provider-test-contracts` importieren                    |
| `runRealtimeSttLiveTest`                             | Führt einen Live-Test eines Echtzeit-STT-Providers mit gemeinsamen Audio-Fixtures aus. Aus `plugin-sdk/provider-test-contracts` importieren                                   |
| `normalizeTranscriptForMatch`                        | Normalisiert die Ausgabe eines Live-Transkripts vor unscharfen Prüfungen. Aus `plugin-sdk/provider-test-contracts` importieren                                                |
| `expectExplicitVideoGenerationCapabilities`          | Prüft, ob Video-Provider explizite Fähigkeiten für den Generierungsmodus deklarieren. Aus `plugin-sdk/provider-test-contracts` importieren                                    |
| `expectExplicitMusicGenerationCapabilities`          | Prüft, ob Musik-Provider explizite Fähigkeiten für Generierung und Bearbeitung deklarieren. Aus `plugin-sdk/provider-test-contracts` importieren                               |
| `mockSuccessfulDashscopeVideoTask`                   | Installiert eine erfolgreiche DashScope-kompatible Antwort für eine Videoaufgabe. Aus `plugin-sdk/provider-test-contracts` importieren                                       |
| `getProviderHttpMocks`                               | Greift auf explizit aktivierte Vitest-Mocks für Provider-HTTP/-Authentifizierung zu. Aus `plugin-sdk/provider-http-test-mocks` importieren                                    |
| `installProviderHttpMockCleanup`                     | Setzt Provider-HTTP-/Authentifizierungs-Mocks nach jedem Test zurück. Aus `plugin-sdk/provider-http-test-mocks` importieren                                                   |
| `installCommonResolveTargetErrorCases`               | Gemeinsame Testfälle für die Fehlerbehandlung bei der Zielauflösung. Aus `plugin-sdk/channel-target-testing` importieren                                                      |
| `shouldAckReaction`                                  | Prüft, ob ein Kanal eine Bestätigungsreaktion hinzufügen soll. Aus `plugin-sdk/channel-feedback` importieren                                                                 |
| `removeAckReactionAfterReply`                        | Entfernt die Bestätigungsreaktion nach der Zustellung der Antwort. Aus `plugin-sdk/channel-feedback` importieren                                                              |
| `createTestRegistry`                                 | Erstellt eine Registry-Fixture für Kanal-Plugins. Aus `plugin-sdk/plugin-test-runtime` oder `plugin-sdk/channel-test-helpers` importieren                                    |
| `createEmptyPluginRegistry`                          | Erstellt eine leere Plugin-Registry-Fixture. Aus `plugin-sdk/plugin-test-runtime` oder `plugin-sdk/channel-test-helpers` importieren                                         |
| `setActivePluginRegistry`                            | Installiert eine Registry-Fixture für Plugin-Runtime-Tests. Aus `plugin-sdk/plugin-test-runtime` oder `plugin-sdk/channel-test-helpers` importieren                           |
| `createRequestCaptureJsonFetch`                      | Erfasst JSON-Fetch-Anfragen in Tests von Medien-Hilfsfunktionen. Aus `plugin-sdk/test-env` importieren                                                                        |
| `withServer`                                         | Führt Tests gegen einen temporären lokalen HTTP-Server aus. Aus `plugin-sdk/test-env` importieren                                                                             |
| `createMockIncomingRequest`                          | Erstellt ein minimales Objekt für eine eingehende HTTP-Anfrage. Aus `plugin-sdk/test-env` importieren                                                                         |
| `withFetchPreconnect`                                | Führt Fetch-Tests mit installierten Preconnect-Hooks aus. Aus `plugin-sdk/test-env` importieren                                                                               |
| `withEnv` / `withEnvAsync`                           | Ändert Umgebungsvariablen vorübergehend. Aus `plugin-sdk/test-env` importieren                                                                                                |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Erstellt isolierte Dateisystem-Test-Fixtures. Aus `plugin-sdk/test-env` importieren                                                                                            |
| `createMockServerResponse`                           | Erstellt einen minimalen Mock für eine HTTP-Serverantwort. Aus `plugin-sdk/test-env` importieren                                                                              |
| `createProviderUsageFetch`                           | Erstellt Fetch-Fixtures für die Provider-Nutzung. Aus `plugin-sdk/test-env` importieren                                                                                       |
| `useFrozenTime` / `useRealTime`                      | Friert Timer für zeitkritische Tests ein und stellt sie wieder her. Aus `plugin-sdk/test-env` importieren                                                                     |
| `createCliRuntimeCapture`                            | Erfasst die Ausgabe der CLI-Runtime in Tests. Aus `plugin-sdk/test-fixtures` importieren                                                                                      |
| `importFreshModule`                                  | Importiert ein ESM-Modul mit einem neuen Abfrage-Token, um den Modul-Cache zu umgehen. Aus `plugin-sdk/test-fixtures` importieren                                             |
| `bundledPluginRoot` / `bundledPluginFile`            | Löst Fixture-Pfade für den Quellcode oder die Distribution gebündelter Plugins auf. Aus `plugin-sdk/test-fixtures` importieren                                                |
| `mockNodeBuiltinModule`                              | Installiert eng begrenzte Vitest-Mocks für integrierte Node-Module. Aus `plugin-sdk/test-node-mocks` importieren                                                              |
| `createSandboxTestContext`                           | Erstellt Sandbox-Testkontexte. Aus `plugin-sdk/test-fixtures` importieren                                                                                                    |
| `writeSkill`                                         | Skill-Fixtures schreiben. Aus `plugin-sdk/test-fixtures` importieren                                                                     |
| `makeAgentAssistantMessage`                          | Fixtures für Agent-Transkriptnachrichten erstellen. Aus `plugin-sdk/test-fixtures` importieren                                           |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Fixtures für Systemereignisse prüfen und zurücksetzen. Aus `plugin-sdk/test-fixtures` importieren                                         |
| `sanitizeTerminalText`                               | Terminalausgabe für Assertions bereinigen. Aus `plugin-sdk/test-fixtures` importieren                                                     |
| `countLines` / `hasBalancedFences`                   | Struktur der Chunking-Ausgabe prüfen. Aus `plugin-sdk/test-fixtures` importieren                                                          |
| `typedCases`                                         | Literale Typen für tabellengesteuerte Tests beibehalten. Aus `plugin-sdk/test-fixtures` importieren                                       |

Auch die Vertragstestsuiten für gebündelte Plugins verwenden diese SDK-Test-Unterpfade für
testexklusive Hilfsfunktionen für Registry, Manifest, öffentliche Artefakte und Runtime-Fixtures.
Reine Core-Testsuiten, die vom gebündelten OpenClaw-Inventar abhängen, verbleiben dagegen unter
`src/plugins/contracts`.

### Typen

Spezialisierte Test-Unterpfade re-exportieren außerdem Typen, die in Testdateien nützlich sind:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Auflösung von Testzielen

Verwenden Sie `installCommonResolveTargetErrorCases`, um Standardfehlerfälle für die
Auflösung von Kanalzielen hinzuzufügen:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("Zielauflösung für my-channel", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Logik zur Zielauflösung Ihres Kanals
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Kanalspezifische Testfälle hinzufügen
  it("sollte @username-Ziele auflösen", () => {
    // ...
  });
});
```

## Testmuster

### Testen von Registrierungsverträgen

Komponententests, die einen manuell erstellten `api`-Mock an `register(api)` übergeben,
prüfen die Akzeptanzprüfungen des OpenClaw-Laders nicht. Fügen Sie für jede
Registrierungsoberfläche, von der Ihr Plugin abhängt, mindestens einen loadergestützten
Smoke-Test hinzu, insbesondere für Hooks und exklusive Fähigkeiten wie Memory.

Der tatsächliche Loader lässt die Plugin-Registrierung fehlschlagen, wenn erforderliche
Metadaten fehlen oder ein Plugin eine Fähigkeits-API aufruft, deren Eigentümer es nicht ist.
Beispielsweise erfordert `api.registerHook(...)` einen Hook-Namen, und
`api.registerMemoryCapability(...)` setzt voraus, dass das Plugin-Manifest oder der
exportierte Einstieg `kind: "memory"` deklariert.

### Testen des Zugriffs auf die Runtime-Konfiguration

Bevorzugen Sie den gemeinsamen Plugin-Runtime-Mock aus `openclaw/plugin-sdk/plugin-test-runtime`.
Seine Mocks `runtime.config.loadConfig()` und `runtime.config.writeConfigFile(...)`
lösen standardmäßig Fehler aus, damit Tests eine neue Verwendung veralteter
Kompatibilitäts-APIs erkennen. Überschreiben Sie diese Mocks nur, wenn der Test ausdrücklich
veraltetes Kompatibilitätsverhalten abdeckt.

### Komponententest eines Kanal-Plugins

```typescript
import { describe, it, expect, vi } from "vitest";

describe("Plugin my-channel", () => {
  it("sollte das Konto aus der Konfiguration auflösen", () => {
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

  it("sollte das Konto prüfen, ohne Geheimnisse zu materialisieren", () => {
    const cfg = {
      channels: {
        "my-channel": { token: "test-token" },
      },
    };

    const inspection = myPlugin.setup.inspectAccount(cfg, undefined);
    expect(inspection.configured).toBe(true);
    expect(inspection.tokenStatus).toBe("available");
    // Kein Tokenwert offengelegt
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Komponententest eines Provider-Plugins

```typescript
import { describe, it, expect } from "vitest";

describe("Plugin my-provider", () => {
  it("sollte dynamische Modelle auflösen", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... Kontext
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("sollte den Katalog zurückgeben, wenn ein API-Schlüssel verfügbar ist", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... Kontext
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Mocking der Plugin-Runtime

Mocken Sie bei Code, der `createPluginRuntimeStore` verwendet, die Runtime in Tests:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "Test-Runtime nicht festgelegt",
});

// Bei der Testeinrichtung
const mockRuntime = {
  agent: {
    resolveAgentDir: vi.fn().mockReturnValue("/tmp/agent"),
    // ... weitere Mocks
  },
  config: {
    current: vi.fn(() => ({}) as const),
    mutateConfigFile: vi.fn(),
    replaceConfigFile: vi.fn(),
  },
  // ... weitere Namespaces
} as unknown as PluginRuntime;

store.setRuntime(mockRuntime);

// Nach den Tests
store.clearRuntime();
```

### Testen mit instanzbezogenen Stubs

Bevorzugen Sie instanzbezogene Stubs gegenüber der Veränderung des Prototyps:

```typescript
// Bevorzugt: instanzbezogener Stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Vermeiden: Veränderung des Prototyps
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Vertragstests (repository-interne Plugins)

Gebündelte Plugins verfügen über Vertragstests, welche die Zuständigkeit für Registrierungen überprüfen:

```bash
pnpm test src/plugins/contracts/
```

Diese Tests prüfen:

- Welche Plugins welche Provider registrieren
- Welche Plugins welche Sprachanbieter registrieren
- Korrektheit der Registrierungsstruktur
- Einhaltung des Runtime-Vertrags

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

## Lint-Durchsetzung (repository-interne Plugins)

`scripts/run-additional-boundary-checks.mjs` führt in CI eine Reihe von
`lint:plugins:*`-Prüfungen für Importgrenzen aus; jede kann auch eigenständig lokal ausgeführt werden:

| Befehl                                                        | Erzwingt                                                                                                                    |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Gebündelte Plugins dürfen nicht das monolithische Root-Barrel `openclaw/plugin-sdk` importieren.                                             |
| `pnpm run lint:plugins:no-extension-src-imports`               | Produktionsdateien von Erweiterungen dürfen den Repository-Baum `src/**` nicht direkt importieren (`../../src/...`).                                 |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | Testdateien von Erweiterungen dürfen `openclaw/plugin-sdk/testing`, `plugin-sdk/test-utils` oder andere reine Core-Testhilfen nicht importieren. |

Externe Plugins unterliegen diesen Lint-Regeln nicht, es wird jedoch empfohlen,
dieselben Muster zu befolgen.

## Testkonfiguration

OpenClaw verwendet Vitest 4 mit informativer V8-Coverage-Berichterstattung. Für Plugin-Tests:

```bash
# Alle Tests ausführen
pnpm test

# Tests für ein bestimmtes Plugin ausführen
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# Mit einem bestimmten Testnamenfilter ausführen
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# Mit Coverage ausführen
pnpm test:coverage
```

Wenn lokale Ausführungen zu hohem Speicherdruck führen:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Verwandte Themen

- [SDK-Übersicht](/de/plugins/sdk-overview) -- Importkonventionen
- [SDK-Kanal-Plugins](/de/plugins/sdk-channel-plugins) -- Schnittstelle für Kanal-Plugins
- [SDK-Provider-Plugins](/de/plugins/sdk-provider-plugins) -- Hooks für Provider-Plugins
- [Plugins erstellen](/de/plugins/building-plugins) -- Leitfaden für den Einstieg
