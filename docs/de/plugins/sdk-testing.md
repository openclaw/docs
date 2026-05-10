---
read_when:
    - Sie schreiben Tests für ein Plugin
    - Sie benötigen Testhilfen aus dem Plugin-SDK
    - Sie möchten Contract-Tests für gebündelte Plugins verstehen
sidebarTitle: Testing
summary: Test-Hilfsprogramme und Muster für OpenClaw-Plugins
title: Plugin-Tests
x-i18n:
    generated_at: "2026-05-10T19:47:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7887b005792aa24958461b1db22d72701ab3a0419ff9d9cc0981df42893038e9
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referenz für Test-Hilfsprogramme, Muster und Lint-Durchsetzung für OpenClaw
Plugins.

<Tip>
  **Suchen Sie Testbeispiele?** Die How-to-Anleitungen enthalten ausgearbeitete Testbeispiele:
  [Channel-Plugin-Tests](/de/plugins/sdk-channel-plugins#step-6-test) und
  [Provider-Plugin-Tests](/de/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Test-Hilfsprogramme

Diese Test-Helfer-Unterpfade sind repo-lokale Quell-Entrypoints für OpenClaws eigene
mitgelieferte Plugin-Tests. Sie sind keine Paketexporte für Drittanbieter-Plugins.

**Plugin-API-Mock-Import:** `openclaw/plugin-sdk/plugin-test-api`

**Agent-Runtime-Contract-Import:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Channel-Contract-Import:** `openclaw/plugin-sdk/channel-contract-testing`

**Channel-Test-Helfer-Import:** `openclaw/plugin-sdk/channel-test-helpers`

**Channel-Target-Test-Import:** `openclaw/plugin-sdk/channel-target-testing`

**Plugin-Contract-Import:** `openclaw/plugin-sdk/plugin-test-contracts`

**Plugin-Runtime-Test-Import:** `openclaw/plugin-sdk/plugin-test-runtime`

**Provider-Contract-Import:** `openclaw/plugin-sdk/provider-test-contracts`

**Provider-HTTP-Mock-Import:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Umgebungs-/Netzwerk-Test-Import:** `openclaw/plugin-sdk/test-env`

**Generischer Fixture-Import:** `openclaw/plugin-sdk/test-fixtures`

**Node-Builtin-Mock-Import:** `openclaw/plugin-sdk/test-node-mocks`

Bevorzugen Sie für neue Plugin-Tests die fokussierten Unterpfade unten. Das breite
`openclaw/plugin-sdk/testing`-Barrel dient nur der Legacy-Kompatibilität.
Repo-Guardrails lehnen neue echte Importe aus `plugin-sdk/testing` und
`plugin-sdk/test-utils` ab; diese Namen bleiben nur als veraltete Kompatibilitätsoberflächen
für Kompatibilitäts-Record-Tests bestehen.

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

| Export                                               | Zweck                                                                                                                                     |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Erstellt einen minimalen Mock der Plugin-API für direkte Unit-Tests der Registrierung. Import aus `plugin-sdk/plugin-test-api`            |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Gemeinsames Fixture für den Auth-Profile-Contract für native Agent-Runtime-Adapter. Import aus `plugin-sdk/agent-runtime-test-contracts`  |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Gemeinsames Contract-Fixture für Unterdrückung der Zustellung für native Agent-Runtime-Adapter. Import aus `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Gemeinsames Contract-Fixture für Fallback-Klassifizierung für native Agent-Runtime-Adapter. Import aus `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Erstellt dynamische Tool-Schema-Fixtures für native Runtime-Contract-Tests. Import aus `plugin-sdk/agent-runtime-test-contracts`          |
| `expectChannelInboundContextContract`                | Prüft die Form des eingehenden Channel-Kontexts. Import aus `plugin-sdk/channel-contract-testing`                                         |
| `installChannelOutboundPayloadContractSuite`         | Installiert Contract-Fälle für ausgehende Channel-Payloads. Import aus `plugin-sdk/channel-contract-testing`                              |
| `createStartAccountContext`                          | Erstellt Kontexte für den Lebenszyklus von Channel-Konten. Import aus `plugin-sdk/channel-test-helpers`                                   |
| `installChannelActionsContractSuite`                 | Installiert generische Contract-Fälle für Channel-Nachrichtenaktionen. Import aus `plugin-sdk/channel-test-helpers`                      |
| `installChannelSetupContractSuite`                   | Installiert generische Contract-Fälle für die Channel-Einrichtung. Import aus `plugin-sdk/channel-test-helpers`                          |
| `installChannelStatusContractSuite`                  | Installiert generische Contract-Fälle für den Channel-Status. Import aus `plugin-sdk/channel-test-helpers`                                |
| `expectDirectoryIds`                                 | Prüft Channel-Verzeichnis-IDs aus einer Funktion zum Auflisten von Verzeichnissen. Import aus `plugin-sdk/channel-test-helpers`           |
| `assertBundledChannelEntries`                        | Prüft, dass gebündelte Channel-Einstiegspunkte den erwarteten öffentlichen Contract offenlegen. Import aus `plugin-sdk/channel-test-helpers` |
| `formatEnvelopeTimestamp`                            | Formatiert deterministische Envelope-Zeitstempel. Import aus `plugin-sdk/channel-test-helpers`                                           |
| `expectPairingReplyText`                             | Prüft Channel-Pairing-Antworttext und extrahiert dessen Code. Import aus `plugin-sdk/channel-test-helpers`                               |
| `describePluginRegistrationContract`                 | Installiert Prüfungen des Plugin-Registrierungs-Contracts. Import aus `plugin-sdk/plugin-test-contracts`                                 |
| `registerSingleProviderPlugin`                       | Registriert ein Provider-Plugin in Loader-Smoke-Tests. Import aus `plugin-sdk/plugin-test-runtime`                                       |
| `registerProviderPlugin`                             | Erfasst alle Provider-Arten aus einem Plugin. Import aus `plugin-sdk/plugin-test-runtime`                                                 |
| `registerProviderPlugins`                            | Erfasst Provider-Registrierungen über mehrere Plugins hinweg. Import aus `plugin-sdk/plugin-test-runtime`                                |
| `requireRegisteredProvider`                          | Prüft, dass eine Provider-Sammlung eine ID enthält. Import aus `plugin-sdk/plugin-test-runtime`                                          |
| `createRuntimeEnv`                                   | Erstellt eine gemockte CLI-/Plugin-Runtime-Umgebung. Import aus `plugin-sdk/plugin-test-runtime`                                         |
| `createPluginSetupWizardStatus`                      | Erstellt Einrichtungsstatus-Helfer für Channel-Plugins. Import aus `plugin-sdk/plugin-test-runtime`                                      |
| `describeOpenAIProviderRuntimeContract`              | Installiert Runtime-Contract-Prüfungen für Provider-Familien. Import aus `plugin-sdk/provider-test-contracts`                            |
| `expectPassthroughReplayPolicy`                      | Prüft, dass Provider-Replay-Policies Provider-eigene Tools und Metadaten durchreichen. Import aus `plugin-sdk/provider-test-contracts`   |
| `runRealtimeSttLiveTest`                             | Führt einen Live-Echtzeit-STT-Provider-Test mit gemeinsamen Audio-Fixtures aus. Import aus `plugin-sdk/provider-test-contracts`           |
| `normalizeTranscriptForMatch`                        | Normalisiert Live-Transkriptausgaben vor unscharfen Assertions. Import aus `plugin-sdk/provider-test-contracts`                          |
| `expectExplicitVideoGenerationCapabilities`          | Prüft, dass Video-Provider explizite Fähigkeiten für Generierungsmodi deklarieren. Import aus `plugin-sdk/provider-test-contracts`       |
| `expectExplicitMusicGenerationCapabilities`          | Prüft, dass Musik-Provider explizite Fähigkeiten für Generierung/Bearbeitung deklarieren. Import aus `plugin-sdk/provider-test-contracts` |
| `mockSuccessfulDashscopeVideoTask`                   | Installiert eine erfolgreiche DashScope-kompatible Antwort für eine Videoaufgabe. Import aus `plugin-sdk/provider-test-contracts`        |
| `getProviderHttpMocks`                               | Greift auf Opt-in-Provider-HTTP-/Auth-Vitest-Mocks zu. Import aus `plugin-sdk/provider-http-test-mocks`                                  |
| `installProviderHttpMockCleanup`                     | Setzt Provider-HTTP-/Auth-Mocks nach jedem Test zurück. Import aus `plugin-sdk/provider-http-test-mocks`                                 |
| `installCommonResolveTargetErrorCases`               | Gemeinsame Testfälle für Fehlerbehandlung bei Zielauflösung. Import aus `plugin-sdk/channel-target-testing`                              |
| `shouldAckReaction`                                  | Prüft, ob ein Channel eine Bestätigungsreaktion hinzufügen soll. Import aus `plugin-sdk/channel-feedback`                                |
| `removeAckReactionAfterReply`                        | Entfernt die Bestätigungsreaktion nach Zustellung der Antwort. Import aus `plugin-sdk/channel-feedback`                                  |
| `createTestRegistry`                                 | Erstellt ein Registry-Fixture für Channel-Plugins. Import aus `plugin-sdk/plugin-test-runtime` oder `plugin-sdk/channel-test-helpers`    |
| `createEmptyPluginRegistry`                          | Erstellt ein leeres Plugin-Registry-Fixture. Import aus `plugin-sdk/plugin-test-runtime` oder `plugin-sdk/channel-test-helpers`          |
| `setActivePluginRegistry`                            | Installiert ein Registry-Fixture für Plugin-Runtime-Tests. Import aus `plugin-sdk/plugin-test-runtime` oder `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                      | Erfasst JSON-Fetch-Anfragen in Tests für Medienhelfer. Import aus `plugin-sdk/test-env`                                                  |
| `withServer`                                         | Führt Tests gegen einen verwerfbaren lokalen HTTP-Server aus. Import aus `plugin-sdk/test-env`                                           |
| `createMockIncomingRequest`                          | Erstellt ein minimales Objekt für eingehende HTTP-Anfragen. Import aus `plugin-sdk/test-env`                                             |
| `withFetchPreconnect`                                | Führt Fetch-Tests mit installierten Preconnect-Hooks aus. Import aus `plugin-sdk/test-env`                                               |
| `withEnv` / `withEnvAsync`                           | Patcht Umgebungsvariablen vorübergehend. Import aus `plugin-sdk/test-env`                                                                |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Erstellt isolierte Dateisystem-Test-Fixtures. Import aus `plugin-sdk/test-env`                                                           |
| `createMockServerResponse`                           | Erstellt einen minimalen Mock für HTTP-Serverantworten. Import aus `plugin-sdk/test-env`                                                 |
| `createCliRuntimeCapture`                            | Erfasst CLI-Runtime-Ausgaben in Tests. Import aus `plugin-sdk/test-fixtures`                                                             |
| `importFreshModule`                                  | Importiert ein ESM-Modul mit einem frischen Query-Token, um den Modulcache zu umgehen. Import aus `plugin-sdk/test-fixtures`             |
| `bundledPluginRoot` / `bundledPluginFile`            | Löst Pfade zu gebündelten Plugin-Quell- oder Dist-Fixtures auf. Import aus `plugin-sdk/test-fixtures`                                    |
| `mockNodeBuiltinModule`                              | Installiert eng gefasste Vitest-Mocks für integrierte Node-Module. Import aus `plugin-sdk/test-node-mocks`                               |
| `createSandboxTestContext`                           | Erstellt Sandbox-Testkontexte. Import aus `plugin-sdk/test-fixtures`                                                                     |
| `writeSkill`                                         | Schreibt Skill-Fixtures. Import aus `plugin-sdk/test-fixtures`                                                                           |
| `makeAgentAssistantMessage`                          | Erstellt Fixtures für Agent-Transkriptnachrichten. Import aus `plugin-sdk/test-fixtures`                                                 |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Inspiziert Systemereignis-Fixtures und setzt sie zurück. Import aus `plugin-sdk/test-fixtures`                                           |
| `sanitizeTerminalText`                               | Bereinigt Terminalausgaben für Assertions. Import aus `plugin-sdk/test-fixtures`                                                         |
| `countLines` / `hasBalancedFences`                   | Prüft die Form der Chunking-Ausgabe. Import aus `plugin-sdk/test-fixtures`                                                               |
| `runProviderCatalog`                                 | Führt einen Provider-Katalog-Hook mit Testabhängigkeiten aus                                                                             |
| `resolveProviderWizardOptions`                       | Löst Provider-Einrichtungsassistent-Auswahlen in Contract-Tests auf                                                                      |
| `resolveProviderModelPickerEntries`                  | Löst Einträge der Provider-Modellauswahl in Contract-Tests auf                                                                           |
| `buildProviderPluginMethodChoice`                    | Erstellt Auswahl-IDs für den Provider-Assistenten für Assertions                                                                         |
| `setProviderWizardProvidersResolverForTest`          | Injiziert Provider des Provider-Assistenten für isolierte Tests                                                                          |
| `createProviderUsageFetch`                           | Fixtures für den Provider-Nutzungsabruf erstellen                                                                                                      |
| `useFrozenTime` / `useRealTime`                      | Timer für zeitabhängige Tests einfrieren und wiederherstellen. Aus `plugin-sdk/test-env` importieren                                                    |
| `createTestWizardPrompter`                           | Einen gemockten Prompter für den Einrichtungsassistenten erstellen                                                                                                     |
| `createRuntimeTaskFlow`                              | Isolierten Laufzeit-Task-Flow-Zustand erstellen                                                                                                  |
| `typedCases`                                         | Literale Typen für tabellengesteuerte Tests beibehalten. Aus `plugin-sdk/test-fixtures` importieren                                                    |

Test-Suites für gebündelte Plugins verwenden außerdem SDK-Testunterpfade für test-only
Registry-, Manifest-, Public-Artifact- und Runtime-Fixture-Helfer. Core-only
Suites, die vom gebündelten OpenClaw-Inventar abhängen, bleiben unter `src/plugins/contracts`.
Legen Sie neue Plugin-Tests auf einem dokumentierten, fokussierten SDK-Unterpfad wie
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env` oder `plugin-sdk/test-fixtures` ab, statt das breite
Kompatibilitäts-Barrel `plugin-sdk/testing`, Repo-`src/**`-Dateien oder Repo-
`test/helpers/*`-Bridges direkt zu importieren.

### Typen

Fokussierte Testunterpfade exportieren außerdem Typen erneut, die in Testdateien nützlich sind:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-contracts";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Testen der Zielauflösung

Verwenden Sie `installCommonResolveTargetErrorCases`, um Standardfehlerfälle für
die Kanalzielauflösung hinzuzufügen:

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

Unit-Tests, die einen handgeschriebenen `api`-Mock an `register(api)` übergeben, üben
die Akzeptanz-Gates des OpenClaw-Loaders nicht aus. Fügen Sie für jede Registrierungsoberfläche,
von der Ihr Plugin abhängt, mindestens einen loader-gestützten Smoke-Test hinzu,
insbesondere für Hooks und exklusive Fähigkeiten wie Memory.

Der echte Loader lässt die Plugin-Registrierung fehlschlagen, wenn erforderliche Metadaten fehlen oder ein
Plugin eine Capability-API aufruft, die ihm nicht gehört. Beispielsweise erfordert
`api.registerHook(...)` einen Hook-Namen, und
`api.registerMemoryCapability(...)` erfordert, dass das Plugin-Manifest oder der exportierte
Eintrag `kind: "memory"` deklariert.

### Testen des Zugriffs auf die Runtime-Konfiguration

Bevorzugen Sie den gemeinsamen Plugin-Runtime-Mock aus `openclaw/plugin-sdk/channel-test-helpers`,
wenn Sie gebündelte Kanal-Plugins testen. Seine veralteten Mocks `runtime.config.loadConfig()` und
`runtime.config.writeConfigFile(...)` werfen standardmäßig Fehler, damit Tests neue
Verwendungen von Kompatibilitäts-APIs erfassen. Überschreiben Sie diese Mocks nur, wenn der Test
explizit Legacy-Kompatibilitätsverhalten abdeckt.

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

### Mocking der Plugin-Runtime

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

### Testen mit Stubs pro Instanz

Bevorzugen Sie Stubs pro Instanz gegenüber Prototyp-Mutationen:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Vertragstests (repo-interne Plugins)

Gebündelte Plugins haben Vertragstests, die die Registrierungs-Ownership verifizieren:

```bash
pnpm test -- src/plugins/contracts/
```

Diese Tests prüfen:

- Welche Plugins welche Provider registrieren
- Welche Plugins welche Speech-Provider registrieren
- Korrektheit der Registrierungsform
- Einhaltung des Runtime-Vertrags

### Ausführen eingegrenzter Tests

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

## Lint-Durchsetzung (repo-interne Plugins)

Drei Regeln werden von `pnpm check` für repo-interne Plugins durchgesetzt:

1. **Keine monolithischen Root-Importe** -- das Root-Barrel `openclaw/plugin-sdk` wird abgelehnt
2. **Keine direkten `src/`-Importe** -- Plugins können `../../src/` nicht direkt importieren
3. **Keine Self-Imports** -- Plugins können ihren eigenen Unterpfad `plugin-sdk/<name>` nicht importieren

Externe Plugins unterliegen diesen Lint-Regeln nicht, es wird jedoch empfohlen, denselben
Mustern zu folgen.

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

Wenn lokale Läufe Speicherprobleme verursachen:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Verwandt

- [SDK-Übersicht](/de/plugins/sdk-overview) -- Importkonventionen
- [SDK-Kanal-Plugins](/de/plugins/sdk-channel-plugins) -- Kanal-Plugin-Schnittstelle
- [SDK-Provider-Plugins](/de/plugins/sdk-provider-plugins) -- Hooks für Provider-Plugins
- [Plugins erstellen](/de/plugins/building-plugins) -- Leitfaden für den Einstieg
