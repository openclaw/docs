---
read_when:
    - Sie schreiben Tests für ein Plugin
    - Sie benötigen Testhilfsprogramme aus dem Plugin-SDK
    - Sie möchten Contract-Tests für gebündelte Plugins verstehen
sidebarTitle: Testing
summary: Testhilfen und -muster für OpenClaw-Plugins
title: Plugin-Tests
x-i18n:
    generated_at: "2026-07-24T05:17:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9c6c050826dae3cd2c794d50b2dd95e20e6533d838161cce037742ee5fdf7e0e
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referenz für Testhilfsprogramme, Muster und Lint-Durchsetzung für OpenClaw-
Plugins.

<Tip>
  **Suchen Sie nach Testbeispielen?** Die Anleitungen enthalten ausgearbeitete Testbeispiele:
  [Tests für Channel-Plugins](/de/plugins/sdk-channel-plugins#step-6-test) und
  [Tests für Provider-Plugins](/de/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Testhilfsprogramme

Diese Unterpfade sind repo-lokale Quell-Einstiegspunkte für die Tests der in
OpenClaw gebündelten Plugins. Sie sind keine veröffentlichten `package.json`-Exporte für
Drittanbieter-Plugins und können Vitest oder andere ausschließlich im Repository
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
import { isLiveTestEnabled } from "openclaw/plugin-sdk/test-live";
import { createRequestCaptureJsonFetch } from "openclaw/plugin-sdk/test-media-understanding";
import {
  bundledPluginRoot,
  createCliRuntimeCapture,
  typedCases,
} from "openclaw/plugin-sdk/test-fixtures";
import { mockNodeBuiltinModule } from "openclaw/plugin-sdk/test-node-mocks";
```

Verwenden Sie diese gezielten Unterpfade für Tests gebündelter Plugins. Der frühere
`openclaw/plugin-sdk/testing`-Barrel war repo-lokal, von ausgelieferten
Paketen ausgeschlossen und wurde entfernt. Der frühere Alias `openclaw/plugin-sdk/test-utils`
wurde zusammen mit ihm entfernt. `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) belässt Erweiterungstests auf
den oben genannten gezielten Testunterpfaden.

### Verfügbare Exporte

| Export                                               | Zweck                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Erstellt einen minimalen Mock der Plugin-API für Unit-Tests der direkten Registrierung. Import aus `plugin-sdk/plugin-test-api`                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Gemeinsame Fixture für den Authentifizierungsprofil-Vertrag nativer Agent-Runtime-Adapter. Import aus `plugin-sdk/agent-runtime-test-contracts`            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Gemeinsame Fixture für den Vertrag zur Unterdrückung der Zustellung bei nativen Agent-Runtime-Adaptern. Import aus `plugin-sdk/agent-runtime-test-contracts`    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Gemeinsame Fixture für den Vertrag zur Fallback-Klassifizierung nativer Agent-Runtime-Adapter. Import aus `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Erstellt Fixtures für Schemas dynamischer Tools für Vertragstests nativer Runtimes. Import aus `plugin-sdk/agent-runtime-test-contracts`              |
| `expectChannelInboundContextContract`                | Prüft die Struktur des eingehenden Kanalkontexts. Import aus `plugin-sdk/channel-contract-testing`                                                  |
| `installChannelOutboundPayloadContractSuite`         | Installiert Vertragsfälle für ausgehende Kanal-Payloads. Import aus `plugin-sdk/channel-contract-testing`                                       |
| `createStartAccountContext`                          | Erstellt Kontexte für den Lebenszyklus von Kanalkonten. Import aus `plugin-sdk/channel-test-helpers`                                                  |
| `installChannelActionsContractSuite`                 | Installiert generische Vertragsfälle für Kanal-Nachrichtenaktionen. Import aus `plugin-sdk/channel-test-helpers`                                     |
| `installChannelSetupContractSuite`                   | Installiert generische Vertragsfälle für die Kanaleinrichtung. Import aus `plugin-sdk/channel-test-helpers`                                              |
| `installChannelStatusContractSuite`                  | Installiert generische Vertragsfälle für den Kanalstatus. Import aus `plugin-sdk/channel-test-helpers`                                             |
| `expectDirectoryIds`                                 | Prüft Kanalverzeichnis-IDs aus einer Verzeichnislistenfunktion. Import aus `plugin-sdk/channel-test-helpers`                               |
| `assertBundledChannelEntries`                        | Prüft, ob die Einstiegspunkte gebündelter Kanäle den erwarteten öffentlichen Vertrag bereitstellen. Import aus `plugin-sdk/channel-test-helpers`                    |
| `formatEnvelopeTimestamp`                            | Formatiert deterministische Umschlag-Zeitstempel. Import aus `plugin-sdk/channel-test-helpers`                                                  |
| `expectPairingReplyText`                             | Prüft den Antworttext zur Kanalkopplung und extrahiert dessen Code. Import aus `plugin-sdk/channel-test-helpers`                                    |
| `describePluginRegistrationContract`                 | Installiert Prüfungen des Plugin-Registrierungsvertrags. Import aus `plugin-sdk/plugin-test-contracts`                                              |
| `registerSingleProviderPlugin`                       | Registriert ein Provider-Plugin in Loader-Smoke-Tests. Import aus `plugin-sdk/plugin-test-runtime`                                         |
| `registerProviderPlugin`                             | Erfasst alle Provider-Arten eines Plugins. Import aus `plugin-sdk/plugin-test-runtime`                                                 |
| `registerProviderPlugins`                            | Erfasst Provider-Registrierungen über mehrere Plugins hinweg. Import aus `plugin-sdk/plugin-test-runtime`                                     |
| `requireRegisteredProvider`                          | Prüft, ob eine Provider-Sammlung eine ID enthält. Import aus `plugin-sdk/plugin-test-runtime`                                           |
| `createRuntimeEnv`                                   | Erstellt eine simulierte CLI-/Plugin-Runtime-Umgebung. Import aus `plugin-sdk/plugin-test-runtime`                                              |
| `createPluginRuntimeMock`                            | Erstellt eine simulierte Plugin-Runtime-Oberfläche. Import aus `plugin-sdk/plugin-test-runtime`                                                      |
| `createPluginSetupWizardStatus`                      | Erstellt Hilfsfunktionen für den Einrichtungsstatus von Kanal-Plugins. Import aus `plugin-sdk/plugin-test-runtime`                                             |
| `createTestWizardPrompter`                           | Erstellt eine simulierte Eingabeaufforderung für den Einrichtungsassistenten. Import aus `plugin-sdk/plugin-test-runtime`                                                       |
| `createRuntimeTaskFlow`                              | Erstellt einen isolierten Runtime-TaskFlow-Zustand. Import aus `plugin-sdk/plugin-test-runtime`                                                    |
| `runProviderCatalog`                                 | Führt einen Provider-Katalog-Hook mit Testabhängigkeiten aus. Import aus `plugin-sdk/plugin-test-runtime`                                     |
| `resolveProviderWizardOptions`                       | Löst die Auswahlmöglichkeiten des Provider-Einrichtungsassistenten in Vertragstests auf. Import aus `plugin-sdk/plugin-test-runtime`                                    |
| `resolveProviderModelPickerEntries`                  | Löst Einträge der Provider-Modellauswahl in Vertragstests auf. Import aus `plugin-sdk/plugin-test-runtime`                                    |
| `buildProviderPluginMethodChoice`                    | Erstellt IDs für Auswahlmöglichkeiten des Provider-Assistenten für Prüfungen. Import aus `plugin-sdk/plugin-test-runtime`                                            |
| `setProviderWizardProvidersResolverForTest`          | Injiziert Provider für den Provider-Assistenten in isolierte Tests. Import aus `plugin-sdk/plugin-test-runtime`                                        |
| `describeOpenAIProviderRuntimeContract`              | Installiert Runtime-Vertragsprüfungen für Provider-Familien. Import aus `plugin-sdk/provider-test-contracts`                                        |
| `expectPassthroughReplayPolicy`                      | Prüft, ob Provider-Wiedergaberichtlinien an Provider-eigene Tools und Metadaten weitergegeben werden. Import aus `plugin-sdk/provider-test-contracts`         |
| `runRealtimeSttLiveTest`                             | Führt einen Live-Test eines Echtzeit-STT-Providers mit gemeinsamen Audio-Fixtures aus. Import aus `plugin-sdk/provider-test-contracts`                       |
| `normalizeTranscriptForMatch`                        | Normalisiert die Ausgabe des Live-Transkripts vor unscharfen Prüfungen. Import aus `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitVideoGenerationCapabilities`          | Prüft, ob Video-Provider explizite Fähigkeiten für Generierungsmodi deklarieren. Import aus `plugin-sdk/provider-test-contracts`                   |
| `expectExplicitMusicGenerationCapabilities`          | Prüft, ob Musik-Provider explizite Fähigkeiten zur Generierung und Bearbeitung deklarieren. Import aus `plugin-sdk/provider-test-contracts`                   |
| `mockSuccessfulDashscopeVideoTask`                   | Installiert eine erfolgreiche DashScope-kompatible Antwort für eine Videoaufgabe. Import aus `plugin-sdk/provider-test-contracts`                          |
| `getProviderHttpMocks`                               | Greift auf optionale Vitest-Mocks für Provider-HTTP/-Authentifizierung zu. Import aus `plugin-sdk/provider-http-test-mocks`                                         |
| `installProviderHttpMockCleanup`                     | Setzt Provider-HTTP-/Authentifizierungs-Mocks nach jedem Test zurück. Import aus `plugin-sdk/provider-http-test-mocks`                                        |
| `installCommonResolveTargetErrorCases`               | Gemeinsame Testfälle für die Fehlerbehandlung bei der Zielauflösung. Import aus `plugin-sdk/channel-target-testing`                                  |
| `shouldAckReaction`                                  | Prüft, ob ein Kanal eine Bestätigungsreaktion hinzufügen soll. Import aus `plugin-sdk/channel-feedback`                                            |
| `removeAckReactionAfterReply`                        | Entfernt die Bestätigungsreaktion nach der Zustellung der Antwort. Import aus `plugin-sdk/channel-feedback`                                                      |
| `createTestRegistry`                                 | Erstellt eine Registry-Fixture für Kanal-Plugins. Import aus `plugin-sdk/plugin-test-runtime` oder `plugin-sdk/channel-test-helpers`               |
| `createEmptyPluginRegistry`                          | Erstellt eine leere Plugin-Registry-Fixture. Import aus `plugin-sdk/plugin-test-runtime` oder `plugin-sdk/channel-test-helpers`                |
| `setActivePluginRegistry`                            | Installiert eine Registry-Fixture für Plugin-Runtime-Tests. Import aus `plugin-sdk/plugin-test-runtime` oder `plugin-sdk/channel-test-helpers`   |
| `createRequestCaptureJsonFetch`                      | Erfasst JSON-Fetch-Anfragen in Tests von Medien-Hilfsfunktionen. Import aus `plugin-sdk/test-media-understanding`                                     |
| `isLiveTestEnabled`                                  | Steuert optionale Live-Provider-Tests. Import aus `plugin-sdk/test-live`                                                                      |
| `collectProviderApiKeys`                             | Ermittelt Zugangsdaten für Live-Provider-Tests. Import aus `plugin-sdk/test-live-auth`                                                    |
| `parseProviderModelMap`                              | Verarbeitet Modellüberschreibungen für Live-Tests von Musik und Video. Import aus `plugin-sdk/test-media-generation`                                              |
| `withServer`                                         | Führt Tests mit einem temporären lokalen HTTP-Server aus. Import aus `plugin-sdk/test-env`                                                      |
| `createMockIncomingRequest`                          | Erstellt ein minimales Objekt für eingehende HTTP-Anfragen. Import aus `plugin-sdk/test-env`                                                          |
| `withFetchPreconnect`                                | Führt Fetch-Tests mit installierten Preconnect-Hooks aus. Import aus `plugin-sdk/test-env`                                                       |
| `withEnv` / `withEnvAsync`                           | Ändert vorübergehend Umgebungsvariablen. Import aus `plugin-sdk/test-env`                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Erstellt isolierte Dateisystem-Test-Fixtures. Import aus `plugin-sdk/test-env`                                                              |
| `createMockServerResponse`                           | Erstellt einen minimalen Mock für eine HTTP-Serverantwort. Import aus `plugin-sdk/test-env`                                                            |
| `createProviderUsageFetch`                           | Erstellt Fetch-Fixtures für die Provider-Nutzung. Import aus `plugin-sdk/test-env`                                                                   |
| `useFrozenTime` / `useRealTime`                      | Friert Timer für zeitkritische Tests ein und stellt sie wieder her. Import aus `plugin-sdk/test-env`                                                    |
| `createCliRuntimeCapture`                            | Erfasst die Ausgabe der CLI-Runtime in Tests. Import aus `plugin-sdk/test-fixtures`                                                              |
| `importFreshModule`                                  | Importiert ein ESM-Modul mit einem neuen Abfrage-Token, um den Modulcache zu umgehen. Import aus `plugin-sdk/test-fixtures`                             |
| `bundledPluginRoot` / `bundledPluginFile`            | Löst Quell- oder Dist-Fixture-Pfade gebündelter Plugins auf. Import aus `plugin-sdk/test-fixtures`                                              |
| `mockNodeBuiltinModule`                              | Installiert eng begrenzte Vitest-Mocks für integrierte Node-Module. Import aus `plugin-sdk/test-node-mocks`                                                       |
| `createSandboxTestContext`                           | Erstellt Sandbox-Testkontexte. Import aus `plugin-sdk/test-fixtures`                                                                      |
| `writeSkill`                                         | Schreibt Skills-Fixtures. Import aus `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | Erstellt Nachrichten-Fixtures für Agent-Transkripte. Import aus `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Prüft Systemereignis-Fixtures und setzt sie zurück. Import aus `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | Bereinigt Terminalausgaben für Prüfungen. Import aus `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | Struktur der Chunking-Ausgabe prüfen. Aus `plugin-sdk/test-fixtures` importieren                                                        |
| `typedCases`                                         | Literaltypen für tabellengesteuerte Tests beibehalten. Aus `plugin-sdk/test-fixtures` importieren                                       |

Gebündelte Plugin-Vertragstests verwenden diese SDK-Testunterpfade ebenfalls für
ausschließlich in Tests verwendete Hilfsfunktionen für Registry, Manifest, öffentliche Artefakte und Laufzeit-Fixtures.
Nur den Core betreffende Tests, die vom gebündelten OpenClaw-Inventar abhängen, verbleiben
stattdessen unter `src/plugins/contracts`.

### Typen

Spezifische Testunterpfade reexportieren außerdem Typen, die in Testdateien nützlich sind:

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

Unit-Tests, die einen manuell erstellten `api`-Mock an `register(api)` übergeben,
durchlaufen nicht die Akzeptanzprüfungen des OpenClaw-Laders. Fügen Sie mindestens einen ladergestützten
Smoke-Test für jede Registrierungsoberfläche hinzu, von der Ihr Plugin abhängt, insbesondere
für Hooks und exklusive Fähigkeiten wie Speicher.

Der echte Lader lässt die Plugin-Registrierung fehlschlagen, wenn erforderliche Metadaten fehlen oder
ein Plugin eine Fähigkeiten-API aufruft, deren Eigentümer es nicht ist. Beispielsweise
erfordert `api.registerHook(...)` einen Hook-Namen und
`api.registerMemoryCapability(...)` erfordert, dass das Plugin-Manifest oder der exportierte
Einstieg `kind: "memory"` deklariert.

### Testen des Zugriffs auf die Laufzeitkonfiguration

Bevorzugen Sie den gemeinsamen Plugin-Laufzeit-Mock aus
`openclaw/plugin-sdk/plugin-test-runtime`. Seine Hilfsfunktionen für die Laufzeitkonfiguration bilden die
aktuellen Snapshot- und Mutations-APIs ab.

### Unit-Test eines Kanal-Plugins

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
    // Kein Token-Wert offengelegt
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Unit-Test eines Provider-Plugins

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

  it("sollte einen Katalog zurückgeben, wenn ein API-Schlüssel verfügbar ist", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... Kontext
    });

    expect(result?.provider?.models).toHaveLength(2);
  });
});
```

### Mocking der Plugin-Laufzeit

Erstellen Sie für Code, der `createPluginRuntimeStore` verwendet, in Tests einen Mock der Laufzeit:

```typescript
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

const store = createPluginRuntimeStore<PluginRuntime>({
  pluginId: "test-plugin",
  errorMessage: "Testlaufzeit nicht festgelegt",
});

// In der Testeinrichtung
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

Bevorzugen Sie instanzbezogene Stubs gegenüber der Mutation von Prototypen:

```typescript
// Bevorzugt: instanzbezogener Stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Vermeiden: Mutation des Prototyps
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Vertragstests (repo-interne Plugins)

Gebündelte Plugins verfügen über Vertragstests, die die Zuständigkeit für Registrierungen überprüfen:

```bash
pnpm test src/plugins/contracts/
```

Diese Tests prüfen:

- Welche Plugins welche Provider registrieren
- Welche Plugins welche Sprachanbieter registrieren
- Korrektheit der Registrierungsstruktur
- Einhaltung des Laufzeitvertrags

### Ausführen bereichsspezifischer Tests

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

## Lint-Durchsetzung (repo-interne Plugins)

`scripts/run-additional-boundary-checks.mjs` führt in der CI eine Reihe von `lint:plugins:*`-
Prüfungen für Importgrenzen aus; jede davon kann auch eigenständig lokal ausgeführt werden:

| Befehl                                                        | Erzwingt                                                                                     |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Gebündelte Plugins dürfen das monolithische Root-Barrel `openclaw/plugin-sdk` nicht importieren.              |
| `pnpm run lint:plugins:no-extension-src-imports`               | Produktionsdateien von Erweiterungen dürfen den `src/**`-Baum des Repositorys nicht direkt importieren (`../../src/...`).  |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | Testdateien von Erweiterungen dürfen keine entfernten SDK-Testaliase oder anderen ausschließlich den Core betreffenden Testhilfsfunktionen importieren. |

Externe Plugins unterliegen diesen Lint-Regeln nicht, es wird jedoch empfohlen,
dieselben Muster zu befolgen.

## Testkonfiguration

OpenClaw verwendet Vitest 4 mit informativen V8-Abdeckungsberichten. Für Plugin-Tests:

```bash
# Alle Tests ausführen
pnpm test

# Tests eines bestimmten Plugins ausführen
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# Mit einem bestimmten Testnamenfilter ausführen
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# Mit Abdeckungsbericht ausführen
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
- [Plugins erstellen](/de/plugins/building-plugins) -- Leitfaden für die ersten Schritte
