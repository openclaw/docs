---
read_when:
    - Sie schreiben Tests für ein Plugin
    - Sie benötigen Testhilfsprogramme aus dem Plugin-SDK
    - Sie möchten Contract-Tests für gebündelte Plugins verstehen
sidebarTitle: Testing
summary: Testhilfen und Testmuster für OpenClaw-Plugins
title: Plugin-Tests
x-i18n:
    generated_at: "2026-07-16T13:08:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8f82f32a61e1ba8049f410a6a1c3651055efb8c048eaa6d1ac0c1442c34726e6
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referenz für Testhilfsprogramme, Muster und Lint-Durchsetzung für OpenClaw-
Plugins.

<Tip>
  **Suchen Sie nach Testbeispielen?** Die Anleitungen enthalten ausgearbeitete Testbeispiele:
  [Tests für Kanal-Plugins](/de/plugins/sdk-channel-plugins#step-6-test) und
  [Tests für Provider-Plugins](/de/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Testhilfsprogramme

Diese Unterpfade sind repo-lokale Quellcode-Einstiegspunkte für die mitgelieferten
Plugin-Tests von OpenClaw. Sie sind keine veröffentlichten `package.json`-Exporte für Drittanbieter-
Plugins und können Vitest oder andere ausschließlich im Repository verwendete Testabhängigkeiten importieren.

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

Verwenden Sie diese gezielten Unterpfade für Tests mitgelieferter Plugins. Das frühere
`openclaw/plugin-sdk/testing`-Barrel war repo-lokal, von ausgelieferten
Paketen ausgeschlossen und wurde entfernt. Der veraltete Alias `openclaw/plugin-sdk/test-utils`
bleibt repo-lokal; `pnpm run lint:plugins:no-extension-test-core-imports`
(`scripts/check-no-extension-test-core-imports.ts`) lehnt neue Testimporte für
Erweiterungen dieses Alias ab.

### Verfügbare Exporte

| Export                                               | Zweck                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Erstellt einen minimalen Plugin-API-Mock für Unit-Tests der direkten Registrierung. Import aus `plugin-sdk/plugin-test-api`                             |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Gemeinsame Vertrags-Fixture für Authentifizierungsprofile nativer Agent-Runtime-Adapter. Import aus `plugin-sdk/agent-runtime-test-contracts`            |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Gemeinsame Vertrags-Fixture für die Unterdrückung der Zustellung bei nativen Agent-Runtime-Adaptern. Import aus `plugin-sdk/agent-runtime-test-contracts`    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Gemeinsame Vertrags-Fixture für die Fallback-Klassifizierung nativer Agent-Runtime-Adapter. Import aus `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Erstellt Schemakonfigurationen für dynamische Tools für Vertragstests nativer Runtimes. Import aus `plugin-sdk/agent-runtime-test-contracts`              |
| `expectChannelInboundContextContract`                | Prüft die Form des eingehenden Kanalkontexts. Import aus `plugin-sdk/channel-contract-testing`                                                  |
| `installChannelOutboundPayloadContractSuite`         | Installiert Vertragsfälle für ausgehende Kanalnutzdaten. Import aus `plugin-sdk/channel-contract-testing`                                       |
| `createStartAccountContext`                          | Erstellt Kontexte für den Lebenszyklus von Kanalkonten. Import aus `plugin-sdk/channel-test-helpers`                                                  |
| `installChannelActionsContractSuite`                 | Installiert generische Vertragsfälle für Kanalnachrichtenaktionen. Import aus `plugin-sdk/channel-test-helpers`                                     |
| `installChannelSetupContractSuite`                   | Installiert generische Vertragsfälle für die Kanaleinrichtung. Import aus `plugin-sdk/channel-test-helpers`                                              |
| `installChannelStatusContractSuite`                  | Installiert generische Vertragsfälle für den Kanalstatus. Import aus `plugin-sdk/channel-test-helpers`                                             |
| `expectDirectoryIds`                                 | Prüft Kanalverzeichnis-IDs aus einer Funktion zur Verzeichnisauflistung. Import aus `plugin-sdk/channel-test-helpers`                               |
| `assertBundledChannelEntries`                        | Prüft, ob die Einstiegspunkte gebündelter Kanäle den erwarteten öffentlichen Vertrag bereitstellen. Import aus `plugin-sdk/channel-test-helpers`                    |
| `formatEnvelopeTimestamp`                            | Formatiert deterministische Umschlag-Zeitstempel. Import aus `plugin-sdk/channel-test-helpers`                                                  |
| `expectPairingReplyText`                             | Prüft den Antworttext der Kanalkopplung und extrahiert dessen Code. Import aus `plugin-sdk/channel-test-helpers`                                    |
| `describePluginRegistrationContract`                 | Installiert Vertragsprüfungen für die Plugin-Registrierung. Import aus `plugin-sdk/plugin-test-contracts`                                              |
| `registerSingleProviderPlugin`                       | Registriert ein Provider-Plugin in Smoke-Tests des Loaders. Import aus `plugin-sdk/plugin-test-runtime`                                         |
| `registerProviderPlugin`                             | Erfasst alle Provider-Arten aus einem Plugin. Import aus `plugin-sdk/plugin-test-runtime`                                                 |
| `registerProviderPlugins`                            | Erfasst Provider-Registrierungen über mehrere Plugins hinweg. Import aus `plugin-sdk/plugin-test-runtime`                                     |
| `requireRegisteredProvider`                          | Prüft, ob eine Provider-Sammlung eine ID enthält. Import aus `plugin-sdk/plugin-test-runtime`                                           |
| `createRuntimeEnv`                                   | Erstellt eine simulierte CLI-/Plugin-Runtime-Umgebung. Import aus `plugin-sdk/plugin-test-runtime`                                              |
| `createPluginRuntimeMock`                            | Erstellt eine simulierte Plugin-Runtime-Oberfläche. Import aus `plugin-sdk/plugin-test-runtime`                                                      |
| `createPluginSetupWizardStatus`                      | Erstellt Hilfsfunktionen für den Einrichtungsstatus von Kanal-Plugins. Import aus `plugin-sdk/plugin-test-runtime`                                             |
| `createTestWizardPrompter`                           | Erstellt einen simulierten Promptgeber für den Einrichtungsassistenten. Import aus `plugin-sdk/plugin-test-runtime`                                                       |
| `createRuntimeTaskFlow`                              | Erstellt einen isolierten TaskFlow-Zustand der Runtime. Import aus `plugin-sdk/plugin-test-runtime`                                                    |
| `runProviderCatalog`                                 | Führt einen Provider-Katalog-Hook mit Testabhängigkeiten aus. Import aus `plugin-sdk/plugin-test-runtime`                                     |
| `resolveProviderWizardOptions`                       | Löst Auswahlmöglichkeiten des Provider-Einrichtungsassistenten in Vertragstests auf. Import aus `plugin-sdk/plugin-test-runtime`                                    |
| `resolveProviderModelPickerEntries`                  | Löst Einträge der Provider-Modellauswahl in Vertragstests auf. Import aus `plugin-sdk/plugin-test-runtime`                                    |
| `buildProviderPluginMethodChoice`                    | Erstellt Auswahl-IDs des Provider-Assistenten für Prüfungen. Import aus `plugin-sdk/plugin-test-runtime`                                            |
| `setProviderWizardProvidersResolverForTest`          | Injiziert Provider des Provider-Assistenten für isolierte Tests. Import aus `plugin-sdk/plugin-test-runtime`                                        |
| `describeOpenAIProviderRuntimeContract`              | Installiert Runtime-Vertragsprüfungen für Provider-Familien. Import aus `plugin-sdk/provider-test-contracts`                                        |
| `expectPassthroughReplayPolicy`                      | Prüft, ob Provider-Wiedergaberichtlinien Provider-eigene Tools und Metadaten unverändert durchreichen. Import aus `plugin-sdk/provider-test-contracts`         |
| `runRealtimeSttLiveTest`                             | Führt einen Live-Echtzeit-STT-Provider-Test mit gemeinsamen Audio-Fixtures aus. Import aus `plugin-sdk/provider-test-contracts`                       |
| `normalizeTranscriptForMatch`                        | Normalisiert die Ausgabe des Live-Transkripts vor unscharfen Prüfungen. Import aus `plugin-sdk/provider-test-contracts`                               |
| `expectExplicitVideoGenerationCapabilities`          | Prüft, ob Video-Provider explizite Fähigkeiten für Generierungsmodi deklarieren. Import aus `plugin-sdk/provider-test-contracts`                   |
| `expectExplicitMusicGenerationCapabilities`          | Prüft, ob Musik-Provider explizite Fähigkeiten zur Generierung und Bearbeitung deklarieren. Import aus `plugin-sdk/provider-test-contracts`                   |
| `mockSuccessfulDashscopeVideoTask`                   | Installiert eine erfolgreiche DashScope-kompatible Antwort auf eine Videoaufgabe. Import aus `plugin-sdk/provider-test-contracts`                          |
| `getProviderHttpMocks`                               | Greift auf Opt-in-Vitest-Mocks für Provider-HTTP und -Authentifizierung zu. Import aus `plugin-sdk/provider-http-test-mocks`                                         |
| `installProviderHttpMockCleanup`                     | Setzt Provider-HTTP-/Authentifizierungs-Mocks nach jedem Test zurück. Import aus `plugin-sdk/provider-http-test-mocks`                                        |
| `installCommonResolveTargetErrorCases`               | Gemeinsame Testfälle für die Fehlerbehandlung bei der Zielauflösung. Import aus `plugin-sdk/channel-target-testing`                                  |
| `shouldAckReaction`                                  | Prüft, ob ein Kanal eine Bestätigungsreaktion hinzufügen soll. Import aus `plugin-sdk/channel-feedback`                                            |
| `removeAckReactionAfterReply`                        | Entfernt die Bestätigungsreaktion nach der Antwortzustellung. Import aus `plugin-sdk/channel-feedback`                                                      |
| `createTestRegistry`                                 | Erstellt eine Registry-Fixture für Kanal-Plugins. Import aus `plugin-sdk/plugin-test-runtime` oder `plugin-sdk/channel-test-helpers`               |
| `createEmptyPluginRegistry`                          | Erstellt eine leere Plugin-Registry-Fixture. Import aus `plugin-sdk/plugin-test-runtime` oder `plugin-sdk/channel-test-helpers`                |
| `setActivePluginRegistry`                            | Installiert eine Registry-Fixture für Plugin-Runtime-Tests. Import aus `plugin-sdk/plugin-test-runtime` oder `plugin-sdk/channel-test-helpers`   |
| `createRequestCaptureJsonFetch`                      | Erfasst JSON-Abrufanfragen in Tests von Medienhilfsfunktionen. Import aus `plugin-sdk/test-env`                                                     |
| `withServer`                                         | Führt Tests mit einem temporären lokalen HTTP-Server aus. Import aus `plugin-sdk/test-env`                                                      |
| `createMockIncomingRequest`                          | Erstellt ein minimales Objekt für eingehende HTTP-Anfragen. Import aus `plugin-sdk/test-env`                                                          |
| `withFetchPreconnect`                                | Führt Abruf-Tests mit installierten Preconnect-Hooks aus. Import aus `plugin-sdk/test-env`                                                       |
| `withEnv` / `withEnvAsync`                           | Ändert vorübergehend Umgebungsvariablen. Import aus `plugin-sdk/test-env`                                                               |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Erstellt isolierte Dateisystem-Test-Fixtures. Import aus `plugin-sdk/test-env`                                                              |
| `createMockServerResponse`                           | Erstellt einen minimalen Mock für HTTP-Serverantworten. Import aus `plugin-sdk/test-env`                                                            |
| `createProviderUsageFetch`                           | Erstellt Fixtures zum Abrufen der Provider-Nutzung. Import aus `plugin-sdk/test-env`                                                                   |
| `useFrozenTime` / `useRealTime`                      | Friert Timer für zeitkritische Tests ein und stellt sie wieder her. Import aus `plugin-sdk/test-env`                                                    |
| `createCliRuntimeCapture`                            | Erfasst die CLI-Runtime-Ausgabe in Tests. Import aus `plugin-sdk/test-fixtures`                                                              |
| `importFreshModule`                                  | Importiert ein ESM-Modul mit einem neuen Abfrage-Token, um den Modul-Cache zu umgehen. Import aus `plugin-sdk/test-fixtures`                             |
| `bundledPluginRoot` / `bundledPluginFile`            | Löst Fixture-Pfade zum Quellcode oder zur Distribution gebündelter Plugins auf. Import aus `plugin-sdk/test-fixtures`                                              |
| `mockNodeBuiltinModule`                              | Installiert eng begrenzte Vitest-Mocks für integrierte Node-Module. Import aus `plugin-sdk/test-node-mocks`                                                       |
| `createSandboxTestContext`                           | Erstellt Sandbox-Testkontexte. Import aus `plugin-sdk/test-fixtures`                                                                      |
| `writeSkill`                                         | Schreibt Skill-Fixtures. Import aus `plugin-sdk/test-fixtures`                                                                             |
| `makeAgentAssistantMessage`                          | Erstellt Nachrichten-Fixtures für Agent-Transkripte. Import aus `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Untersucht Systemereignis-Fixtures und setzt sie zurück. Import aus `plugin-sdk/test-fixtures`                                                          |
| `sanitizeTerminalText`                               | Bereinigt die Terminalausgabe für Prüfungen. Import aus `plugin-sdk/test-fixtures`                                                          |
| `countLines` / `hasBalancedFences`                   | Prüft die Form der Chunking-Ausgabe. Import aus `plugin-sdk/test-fixtures`                                                                     |
| `typedCases`                                         | Bewahrt literale Typen für tabellengesteuerte Tests. Import aus `plugin-sdk/test-fixtures`                                                    |

Vertragssammlungen für gebündelte Plugins verwenden diese SDK-Testunterpfade ebenfalls für
reine Testhilfen zu Registry, Manifest, öffentlichen Artefakten und Runtime-Fixtures.
Nur für den Kern bestimmte Sammlungen, die vom gebündelten OpenClaw-Bestand abhängen, verbleiben stattdessen unter
`src/plugins/contracts`.

### Typen

Fokussierte Test-Unterpfade reexportieren außerdem Typen, die in Testdateien nützlich sind:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Testen der Zielauflösung

Verwenden Sie `installCommonResolveTargetErrorCases`, um Standardfehlerfälle für die
Zielauflösung von Kanälen hinzuzufügen:

```typescript
import { describe } from "vitest";
import { installCommonResolveTargetErrorCases } from "openclaw/plugin-sdk/channel-target-testing";

describe("my-channel target resolution", () => {
  installCommonResolveTargetErrorCases({
    resolveTarget: ({ to, mode, allowFrom }) => {
      // Zielauflösungslogik Ihres Kanals
      return myChannelResolveTarget({ to, mode, allowFrom });
    },
    implicitAllowFrom: ["user1", "user2"],
  });

  // Kanalspezifische Testfälle hinzufügen
  it("should resolve @username targets", () => {
    // ...
  });
});
```

## Testmuster

### Testen von Registrierungsverträgen

Komponententests, die einen manuell erstellten `api`-Mock an `register(api)` übergeben,
prüfen die Akzeptanzprüfungen des OpenClaw-Laders nicht. Fügen Sie mindestens einen ladergestützten
Smoke-Test für jede Registrierungsoberfläche hinzu, von der Ihr Plugin abhängt, insbesondere
für Hooks und exklusive Fähigkeiten wie Speicher.

Der tatsächliche Lader lässt die Plugin-Registrierung fehlschlagen, wenn erforderliche Metadaten fehlen oder
ein Plugin eine Fähigkeits-API aufruft, deren Eigentümer es nicht ist. Beispielsweise
erfordert `api.registerHook(...)` einen Hook-Namen, und
`api.registerMemoryCapability(...)` erfordert, dass das Plugin-Manifest oder der exportierte
Einstieg `kind: "memory"` deklariert.

### Testen des Zugriffs auf die Laufzeitkonfiguration

Bevorzugen Sie den gemeinsamen Plugin-Laufzeit-Mock aus `openclaw/plugin-sdk/plugin-test-runtime`.
Seine `runtime.config.loadConfig()`- und `runtime.config.writeConfigFile(...)`-
Mocks lösen standardmäßig Fehler aus, damit Tests eine neue Verwendung veralteter Kompatibilitäts-
APIs erkennen. Überschreiben Sie diese Mocks nur, wenn der Test ausdrücklich veraltetes
Kompatibilitätsverhalten abdeckt.

### Komponententest eines Kanal-Plugins

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
    // Kein Token-Wert offengelegt
    expect(inspection).not.toHaveProperty("token");
  });
});
```

### Komponententest eines Provider-Plugins

```typescript
import { describe, it, expect } from "vitest";

describe("my-provider plugin", () => {
  it("should resolve dynamic models", () => {
    const model = myProvider.resolveDynamicModel({
      modelId: "custom-model-v2",
      // ... Kontext
    });

    expect(model.id).toBe("custom-model-v2");
    expect(model.provider).toBe("my-provider");
    expect(model.api).toBe("openai-completions");
  });

  it("should return catalog when API key is available", async () => {
    const result = await myProvider.catalog.run({
      resolveProviderApiKey: () => ({ apiKey: "test-key" }),
      // ... Kontext
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

Bevorzugen Sie instanzbezogene Stubs gegenüber der Mutation von Prototypen:

```typescript
// Bevorzugt: instanzbezogener Stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Vermeiden: Mutation des Prototyps
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Vertragstests (repo-interne Plugins)

Gebündelte Plugins verfügen über Vertragstests, die die Eigentümerschaft von Registrierungen überprüfen:

```bash
pnpm test src/plugins/contracts/
```

Diese Tests prüfen:

- Welche Plugins welche Provider registrieren
- Welche Plugins welche Sprachanbieter registrieren
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

## Lint-Durchsetzung (repo-interne Plugins)

`scripts/run-additional-boundary-checks.mjs` führt in CI eine Reihe von `lint:plugins:*`-
Prüfungen der Importgrenzen aus; jede davon kann auch eigenständig lokal ausgeführt werden:

| Befehl                                                        | Erzwingt                                                                                    |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm run lint:plugins:no-monolithic-plugin-sdk-entry-imports` | Gebündelte Plugins dürfen nicht das monolithische `openclaw/plugin-sdk`-Root-Barrel importieren.             |
| `pnpm run lint:plugins:no-extension-src-imports`               | Produktionsdateien von Erweiterungen dürfen den `src/**`-Baum des Repositorys nicht direkt importieren (`../../src/...`). |
| `pnpm run lint:plugins:no-extension-test-core-imports`         | Testdateien von Erweiterungen dürfen weder `plugin-sdk/test-utils` noch andere ausschließlich für den Kern bestimmte Testhelfer importieren. |

Externe Plugins unterliegen diesen Lint-Regeln nicht, die Befolgung derselben
Muster wird jedoch empfohlen.

## Testkonfiguration

OpenClaw verwendet Vitest 4 mit informativer V8-Coverage-Berichterstattung. Für Plugin-Tests:

```bash
# Alle Tests ausführen
pnpm test

# Tests eines bestimmten Plugins ausführen
pnpm test <bundled-plugin-root>/my-channel/src/channel.test.ts

# Mit einem bestimmten Testnamenfilter ausführen
pnpm test <bundled-plugin-root>/my-channel/ -t "resolves account"

# Mit Coverage ausführen
pnpm test:coverage
```

Falls lokale Ausführungen zu Speicherdruck führen:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Verwandte Themen

- [SDK-Übersicht](/de/plugins/sdk-overview) -- Importkonventionen
- [SDK-Kanal-Plugins](/de/plugins/sdk-channel-plugins) -- Schnittstelle für Kanal-Plugins
- [SDK-Provider-Plugins](/de/plugins/sdk-provider-plugins) -- Hooks für Provider-Plugins
- [Plugins erstellen](/de/plugins/building-plugins) -- Leitfaden für den Einstieg
