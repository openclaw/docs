---
read_when:
    - Sie schreiben Tests für ein Plugin
    - Sie benötigen Test-Hilfsprogramme aus dem Plugin-SDK
    - Sie möchten die Vertragstests für gebündelte Plugins verstehen
sidebarTitle: Testing
summary: Testwerkzeuge und Muster für OpenClaw-Plugins
title: Plugin-Tests
x-i18n:
    generated_at: "2026-06-28T07:42:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e5f77e9c54a56c9af293061e2cff0ee6112f2b9b4bea3f9604d48b0f05049ef
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referenz für Test-Hilfsprogramme, Muster und Lint-Durchsetzung für OpenClaw
Plugins.

<Tip>
  **Suchen Sie Testbeispiele?** Die How-to-Anleitungen enthalten ausgearbeitete Testbeispiele:
  [Tests für Channel-Plugins](/de/plugins/sdk-channel-plugins#step-6-test) und
  [Tests für Provider-Plugins](/de/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Test-Hilfsprogramme

Diese test-helper-Unterpfade sind repo-lokale Quellcode-Einstiegspunkte für die eigenen
gebündelten Plugin-Tests von OpenClaw. Sie sind keine Package-Exporte für Drittanbieter-Plugins und
können Vitest oder andere nur im Repo verwendete Testabhängigkeiten importieren.

**Plugin-API-Mock-Import:** `openclaw/plugin-sdk/plugin-test-api`

**Import für Agent-Runtime-Vertrag:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Import für Channel-Vertrag:** `openclaw/plugin-sdk/channel-contract-testing`

**Import für Channel-Test-Helper:** `openclaw/plugin-sdk/channel-test-helpers`

**Import für Channel-Target-Test:** `openclaw/plugin-sdk/channel-target-testing`

**Import für Plugin-Vertrag:** `openclaw/plugin-sdk/plugin-test-contracts`

**Import für Plugin-Runtime-Test:** `openclaw/plugin-sdk/plugin-test-runtime`

**Import für Provider-Vertrag:** `openclaw/plugin-sdk/provider-test-contracts`

**Import für Provider-HTTP-Mock:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Import für Umgebungs-/Netzwerktest:** `openclaw/plugin-sdk/test-env`

**Import für generische Fixture:** `openclaw/plugin-sdk/test-fixtures`

**Import für Node-Builtin-Mock:** `openclaw/plugin-sdk/test-node-mocks`

Bevorzugen Sie innerhalb des OpenClaw-Repos die folgenden fokussierten Unterpfade für neue gebündelte
Plugin-Tests. Das breite
`openclaw/plugin-sdk/testing`-Barrel dient nur der Legacy-Kompatibilität.
Repo-Guardrails lehnen neue echte Importe aus `plugin-sdk/testing` und
`plugin-sdk/test-utils` ab; diese Namen bleiben nur als veraltete Kompatibilitätsoberflächen
für Kompatibilitätsdatensatz-Tests bestehen.

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

### Verfügbare Exporte

| Export                                               | Zweck                                                                                                                                               |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Erstellt einen minimalen Plugin-API-Mock für direkte Registrierungs-Unit-Tests. Importieren aus `plugin-sdk/plugin-test-api`                        |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Gemeinsame Auth-Profil-Vertrags-Fixture für native Agent-Runtime-Adapter. Importieren aus `plugin-sdk/agent-runtime-test-contracts`                 |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Gemeinsame Vertrags-Fixture für Zustellungsunterdrückung bei nativen Agent-Runtime-Adaptern. Importieren aus `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Gemeinsame Vertrags-Fixture für Fallback-Klassifizierung bei nativen Agent-Runtime-Adaptern. Importieren aus `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Erstellt Schema-Fixtures für dynamische Tools für native Runtime-Vertragstests. Importieren aus `plugin-sdk/agent-runtime-test-contracts`            |
| `expectChannelInboundContextContract`                | Prüft die Form des eingehenden Channel-Kontexts. Importieren aus `plugin-sdk/channel-contract-testing`                                               |
| `installChannelOutboundPayloadContractSuite`         | Installiert Vertragsfälle für ausgehende Channel-Payloads. Importieren aus `plugin-sdk/channel-contract-testing`                                    |
| `createStartAccountContext`                          | Erstellt Channel-Konto-Lifecycle-Kontexte. Importieren aus `plugin-sdk/channel-test-helpers`                                                        |
| `installChannelActionsContractSuite`                 | Installiert generische Vertragsfälle für Channel-Nachrichtenaktionen. Importieren aus `plugin-sdk/channel-test-helpers`                             |
| `installChannelSetupContractSuite`                   | Installiert generische Vertragsfälle für die Channel-Einrichtung. Importieren aus `plugin-sdk/channel-test-helpers`                                 |
| `installChannelStatusContractSuite`                  | Installiert generische Vertragsfälle für den Channel-Status. Importieren aus `plugin-sdk/channel-test-helpers`                                      |
| `expectDirectoryIds`                                 | Prüft Channel-Verzeichnis-IDs aus einer Verzeichnislistenfunktion. Importieren aus `plugin-sdk/channel-test-helpers`                                |
| `assertBundledChannelEntries`                        | Prüft, dass gebündelte Channel-Einstiegspunkte den erwarteten öffentlichen Vertrag offenlegen. Importieren aus `plugin-sdk/channel-test-helpers`     |
| `formatEnvelopeTimestamp`                            | Formatiert deterministische Envelope-Zeitstempel. Importieren aus `plugin-sdk/channel-test-helpers`                                                 |
| `expectPairingReplyText`                             | Prüft den Channel-Pairing-Antworttext und extrahiert dessen Code. Importieren aus `plugin-sdk/channel-test-helpers`                                 |
| `describePluginRegistrationContract`                 | Installiert Prüfungen für den Plugin-Registrierungsvertrag. Importieren aus `plugin-sdk/plugin-test-contracts`                                      |
| `registerSingleProviderPlugin`                       | Registriert ein Provider-Plugin in Loader-Smoke-Tests. Importieren aus `plugin-sdk/plugin-test-runtime`                                             |
| `registerProviderPlugin`                             | Erfasst alle Provider-Arten aus einem Plugin. Importieren aus `plugin-sdk/plugin-test-runtime`                                                      |
| `registerProviderPlugins`                            | Erfasst Provider-Registrierungen über mehrere Plugins hinweg. Importieren aus `plugin-sdk/plugin-test-runtime`                                      |
| `requireRegisteredProvider`                          | Prüft, dass eine Provider-Sammlung eine ID enthält. Importieren aus `plugin-sdk/plugin-test-runtime`                                                |
| `createRuntimeEnv`                                   | Erstellt eine gemockte CLI-/Plugin-Runtime-Umgebung. Importieren aus `plugin-sdk/plugin-test-runtime`                                               |
| `createPluginRuntimeMock`                            | Erstellt eine gemockte Plugin-Runtime-Oberfläche. Importieren aus `plugin-sdk/plugin-test-runtime`                                                  |
| `createPluginSetupWizardStatus`                      | Erstellt Setup-Status-Helfer für Channel-Plugins. Importieren aus `plugin-sdk/plugin-test-runtime`                                                  |
| `describeOpenAIProviderRuntimeContract`              | Installiert Runtime-Vertragsprüfungen für Provider-Familien. Importieren aus `plugin-sdk/provider-test-contracts`                                   |
| `expectPassthroughReplayPolicy`                      | Prüft, dass Provider-Replay-Richtlinien provider-eigene Tools und Metadaten durchreichen. Importieren aus `plugin-sdk/provider-test-contracts`       |
| `runRealtimeSttLiveTest`                             | Führt einen Live-Test eines Echtzeit-STT-Providers mit gemeinsamen Audio-Fixtures aus. Importieren aus `plugin-sdk/provider-test-contracts`          |
| `normalizeTranscriptForMatch`                        | Normalisiert Live-Transkriptausgaben vor unscharfen Assertions. Importieren aus `plugin-sdk/provider-test-contracts`                                |
| `expectExplicitVideoGenerationCapabilities`          | Prüft, dass Video-Provider explizite Fähigkeiten für Generierungsmodi deklarieren. Importieren aus `plugin-sdk/provider-test-contracts`              |
| `expectExplicitMusicGenerationCapabilities`          | Prüft, dass Musik-Provider explizite Fähigkeiten für Generierung/Bearbeitung deklarieren. Importieren aus `plugin-sdk/provider-test-contracts`       |
| `mockSuccessfulDashscopeVideoTask`                   | Installiert eine erfolgreiche DashScope-kompatible Video-Task-Antwort. Importieren aus `plugin-sdk/provider-test-contracts`                         |
| `getProviderHttpMocks`                               | Greift auf Opt-in-Vitest-Mocks für Provider-HTTP/Auth zu. Importieren aus `plugin-sdk/provider-http-test-mocks`                                     |
| `installProviderHttpMockCleanup`                     | Setzt Provider-HTTP/Auth-Mocks nach jedem Test zurück. Importieren aus `plugin-sdk/provider-http-test-mocks`                                        |
| `installCommonResolveTargetErrorCases`               | Gemeinsame Testfälle für die Fehlerbehandlung bei der Zielauflösung. Importieren aus `plugin-sdk/channel-target-testing`                            |
| `shouldAckReaction`                                  | Prüft, ob ein Channel eine Ack-Reaktion hinzufügen soll. Importieren aus `plugin-sdk/channel-feedback`                                              |
| `removeAckReactionAfterReply`                        | Entfernt die Ack-Reaktion nach der Antwortzustellung. Importieren aus `plugin-sdk/channel-feedback`                                                 |
| `createTestRegistry`                                 | Erstellt eine Channel-Plugin-Registry-Fixture. Importieren aus `plugin-sdk/plugin-test-runtime` oder `plugin-sdk/channel-test-helpers`              |
| `createEmptyPluginRegistry`                          | Erstellt eine leere Plugin-Registry-Fixture. Importieren aus `plugin-sdk/plugin-test-runtime` oder `plugin-sdk/channel-test-helpers`                |
| `setActivePluginRegistry`                            | Installiert eine Registry-Fixture für Plugin-Runtime-Tests. Importieren aus `plugin-sdk/plugin-test-runtime` oder `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                      | Erfasst JSON-Fetch-Anfragen in Tests für Medienhelfer. Importieren aus `plugin-sdk/test-env`                                                        |
| `withServer`                                         | Führt Tests gegen einen verwerfbaren lokalen HTTP-Server aus. Importieren aus `plugin-sdk/test-env`                                                 |
| `createMockIncomingRequest`                          | Erstellt ein minimales eingehendes HTTP-Anfrageobjekt. Importieren aus `plugin-sdk/test-env`                                                        |
| `withFetchPreconnect`                                | Führt Fetch-Tests mit installierten Preconnect-Hooks aus. Importieren aus `plugin-sdk/test-env`                                                     |
| `withEnv` / `withEnvAsync`                           | Patcht Umgebungsvariablen vorübergehend. Importieren aus `plugin-sdk/test-env`                                                                      |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Erstellt isolierte Dateisystem-Test-Fixtures. Importieren aus `plugin-sdk/test-env`                                                                 |
| `createMockServerResponse`                           | Erstellt einen minimalen HTTP-Server-Antwort-Mock. Importieren aus `plugin-sdk/test-env`                                                            |
| `createCliRuntimeCapture`                            | Erfasst CLI-Runtime-Ausgabe in Tests. Importieren aus `plugin-sdk/test-fixtures`                                                                    |
| `importFreshModule`                                  | Importiert ein ESM-Modul mit einem frischen Query-Token, um den Modulcache zu umgehen. Importieren aus `plugin-sdk/test-fixtures`                   |
| `bundledPluginRoot` / `bundledPluginFile`            | Löst Quell- oder Dist-Fixture-Pfade für gebündelte Plugins auf. Importieren aus `plugin-sdk/test-fixtures`                                          |
| `mockNodeBuiltinModule`                              | Installiert eng begrenzte Vitest-Mocks für integrierte Node-Module. Importieren aus `plugin-sdk/test-node-mocks`                                   |
| `createSandboxTestContext`                           | Erstellt Sandbox-Testkontexte. Importieren aus `plugin-sdk/test-fixtures`                                                                           |
| `writeSkill`                                         | Schreibt Skill-Fixtures. Importieren aus `plugin-sdk/test-fixtures`                                                                                 |
| `makeAgentAssistantMessage`                          | Erstellt Agent-Transkript-Nachrichten-Fixtures. Importieren aus `plugin-sdk/test-fixtures`                                                          |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Prüft Systemereignis-Fixtures und setzt sie zurück. Importieren aus `plugin-sdk/test-fixtures`                                                      |
| `sanitizeTerminalText`                               | Bereinigt Terminalausgabe für Assertions. Importieren aus `plugin-sdk/test-fixtures`                                                                |
| `countLines` / `hasBalancedFences`                   | Prüft die Form der Chunking-Ausgabe. Importieren aus `plugin-sdk/test-fixtures`                                                                     |
| `runProviderCatalog`                                 | Führt einen Provider-Katalog-Hook mit Testabhängigkeiten aus                                                                                        |
| `resolveProviderWizardOptions`                       | Löst Provider-Setup-Wizard-Auswahlen in Vertragstests auf                                                                                           |
| `resolveProviderModelPickerEntries`                  | Löst Provider-Modellauswahl-Einträge in Vertragstests auf                                                                                           |
| `buildProviderPluginMethodChoice`                    | Erstellt Provider-Wizard-Methodenauswahl-IDs für Assertions                                                                                         |
| `setProviderWizardProvidersResolverForTest`          | Provider-Assistenten-Provider für isolierte Tests injizieren                                                                                      |
| `createProviderUsageFetch`                           | Provider-Nutzungs-Fetch-Fixtures erstellen                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | Timer für zeitabhängige Tests einfrieren und wiederherstellen. Aus `plugin-sdk/test-env` importieren                                                    |
| `createTestWizardPrompter`                           | Einen gemockten Setup-Assistenten-Prompter erstellen                                                                                                     |
| `createRuntimeTaskFlow`                              | Isolierten Laufzeit-TaskFlow-Zustand erstellen                                                                                                  |
| `typedCases`                                         | Literaltypen für tabellengesteuerte Tests beibehalten. Aus `plugin-sdk/test-fixtures` importieren                                                    |

Gebündelte Plugin-Vertragssuiten verwenden außerdem SDK-Test-Unterpfade für reine Test-Helfer für Registry, Manifest, öffentliche Artefakte und Runtime-Fixtures. Core-only-Suiten, die vom gebündelten OpenClaw-Inventar abhängen, bleiben unter `src/plugins/contracts`. Legen Sie neue Extension-Tests auf einem dokumentierten, fokussierten SDK-Unterpfad wie `plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`, `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`, `plugin-sdk/test-env` oder `plugin-sdk/test-fixtures` ab, statt direkt den breiten Kompatibilitäts-Barrel `plugin-sdk/testing`, Repo-Dateien unter `src/**` oder Bridges unter `test/helpers/*` zu importieren.

### Typen

Fokussierte Test-Unterpfade re-exportieren außerdem Typen, die in Testdateien nützlich sind:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Auflösung von Testzielen

Verwenden Sie `installCommonResolveTargetErrorCases`, um Standardfehlerfälle für die Auflösung von Channel-Zielen hinzuzufügen:

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

### Registrierungskontrakte testen

Unit-Tests, die einen handgeschriebenen `api`-Mock an `register(api)` übergeben, üben die Akzeptanz-Gates des OpenClaw-Loaders nicht aus. Fügen Sie für jede Registrierungsoberfläche, von der Ihr Plugin abhängt, mindestens einen loadergestützten Smoke-Test hinzu, insbesondere für Hooks und exklusive Fähigkeiten wie Speicher.

Der echte Loader lässt die Plugin-Registrierung fehlschlagen, wenn erforderliche Metadaten fehlen oder ein Plugin eine Capability-API aufruft, die es nicht besitzt. Beispielsweise erfordert `api.registerHook(...)` einen Hook-Namen, und `api.registerMemoryCapability(...)` erfordert, dass das Plugin-Manifest oder der exportierte Einstieg `kind: "memory"` deklariert.

### Runtime-Konfigurationszugriff testen

Bevorzugen Sie den gemeinsamen Plugin-Runtime-Mock aus `openclaw/plugin-sdk/plugin-test-runtime`. Seine veralteten Mocks `runtime.config.loadConfig()` und `runtime.config.writeConfigFile(...)` werfen standardmäßig Fehler, damit Tests neue Nutzung von Kompatibilitäts-APIs erkennen. Überschreiben Sie diese Mocks nur, wenn der Test ausdrücklich Legacy-Kompatibilitätsverhalten abdeckt.

### Unit-Tests für ein Channel-Plugin

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

### Unit-Tests für ein Provider-Plugin

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

### Plugin-Runtime mocken

Für Code, der `createPluginRuntimeStore` verwendet, mocken Sie die Runtime in Tests:

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

### Testen mit instanzspezifischen Stubs

Bevorzugen Sie instanzspezifische Stubs statt Prototyp-Mutation:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Vertragstests (In-Repo-Plugins)

Gebündelte Plugins haben Vertragstests, die Registrierungsbesitz verifizieren:

```bash
pnpm test -- src/plugins/contracts/
```

Diese Tests stellen sicher:

- Welche Plugins welche Provider registrieren
- Welche Plugins welche Sprach-Provider registrieren
- Korrektheit der Registrierungsform
- Einhaltung des Runtime-Vertrags

### Bereichsbezogene Tests ausführen

Für ein bestimmtes Plugin:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Nur für Vertragstests:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Lint-Durchsetzung (In-Repo-Plugins)

Drei Regeln werden von `pnpm check` für In-Repo-Plugins durchgesetzt:

1. **Keine monolithischen Root-Importe** -- der Root-Barrel `openclaw/plugin-sdk` wird abgelehnt
2. **Keine direkten `src/`-Importe** -- Plugins können `../../src/` nicht direkt importieren
3. **Keine Selbstimporte** -- Plugins können ihren eigenen Unterpfad `plugin-sdk/<name>` nicht importieren

Externe Plugins unterliegen diesen Lint-Regeln nicht, aber es wird empfohlen, denselben Mustern zu folgen.

## Testkonfiguration

OpenClaw verwendet Vitest mit V8-Coverage-Schwellenwerten. Für Plugin-Tests:

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

Wenn lokale Läufe Speicherdruck verursachen:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Verwandte Themen

- [SDK-Übersicht](/de/plugins/sdk-overview) -- Importkonventionen
- [SDK-Channel-Plugins](/de/plugins/sdk-channel-plugins) -- Channel-Plugin-Schnittstelle
- [SDK-Provider-Plugins](/de/plugins/sdk-provider-plugins) -- Provider-Plugin-Hooks
- [Plugins erstellen](/de/plugins/building-plugins) -- Leitfaden für den Einstieg
