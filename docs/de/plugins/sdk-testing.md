---
read_when:
    - Sie schreiben Tests für ein Plugin
    - Sie benötigen Testhilfsprogramme aus dem Plugin-SDK
    - Sie möchten Contract-Tests für gebündelte Plugins verstehen
sidebarTitle: Testing
summary: Testhilfen und Muster für OpenClaw-Plugins
title: Plugin-Tests
x-i18n:
    generated_at: "2026-05-02T22:20:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67092d71302d566ee9ed3f3f1e32b5aa6f4eabf522a9656ad13cad812550f1e8
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referenz für Testhilfen, Muster und Lint-Durchsetzung für OpenClaw-Plugins.

<Tip>
  **Suchen Sie nach Testbeispielen?** Die Anleitungen enthalten ausgearbeitete Testbeispiele:
  [Channel-Plugin-Tests](/de/plugins/sdk-channel-plugins#step-6-test) und
  [Provider-Plugin-Tests](/de/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Testhilfen

**Plugin-API-Mock-Import:** `openclaw/plugin-sdk/plugin-test-api`

**Agent-Runtime-Vertragsimport:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Channel-Vertragsimport:** `openclaw/plugin-sdk/channel-contract-testing`

**Channel-Testhilfen-Import:** `openclaw/plugin-sdk/channel-test-helpers`

**Channel-Zieltest-Import:** `openclaw/plugin-sdk/channel-target-testing`

**Plugin-Vertragsimport:** `openclaw/plugin-sdk/plugin-test-contracts`

**Plugin-Runtime-Testimport:** `openclaw/plugin-sdk/plugin-test-runtime`

**Provider-Vertragsimport:** `openclaw/plugin-sdk/provider-test-contracts`

**Provider-HTTP-Mock-Import:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Umgebungs-/Netzwerktest-Import:** `openclaw/plugin-sdk/test-env`

**Generischer Fixture-Import:** `openclaw/plugin-sdk/test-fixtures`

**Node-Builtin-Mock-Import:** `openclaw/plugin-sdk/test-node-mocks`

Bevorzugen Sie für neue Plugin-Tests die fokussierten Unterpfade unten. Das breite
`openclaw/plugin-sdk/testing`-Barrel dient nur der Legacy-Kompatibilität.
Repo-Guardrails lehnen neue echte Importe aus `plugin-sdk/testing` und
`plugin-sdk/test-utils` ab; diese Namen bleiben nur als veraltete Kompatibilitätsflächen
für externe Plugins und Kompatibilitätsdatensatz-Tests erhalten.

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

| Export                                               | Zweck                                                                                                                                   |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Erstellt einen minimalen Plugin-API-Mock für direkte Registrierungs-Unit-Tests. Importieren aus `plugin-sdk/plugin-test-api`            |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Gemeinsame Auth-Profile-Contract-Fixture für native Agent-Runtime-Adapter. Importieren aus `plugin-sdk/agent-runtime-test-contracts`    |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Gemeinsame Contract-Fixture für Zustellungsunterdrückung für native Agent-Runtime-Adapter. Importieren aus `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Gemeinsame Contract-Fixture für Fallback-Klassifizierung für native Agent-Runtime-Adapter. Importieren aus `plugin-sdk/agent-runtime-test-contracts` |
| `createParameterFreeTool`                            | Erstellt Dynamic-Tool-Schema-Fixtures für native Runtime-Contract-Tests. Importieren aus `plugin-sdk/agent-runtime-test-contracts`       |
| `expectChannelInboundContextContract`                | Prüft die Form des eingehenden Channel-Kontexts. Importieren aus `plugin-sdk/channel-contract-testing`                                   |
| `installChannelOutboundPayloadContractSuite`         | Installiert Contract-Fälle für ausgehende Channel-Payloads. Importieren aus `plugin-sdk/channel-contract-testing`                        |
| `createStartAccountContext`                          | Erstellt Channel-Account-Lifecycle-Kontexte. Importieren aus `plugin-sdk/channel-test-helpers`                                          |
| `installChannelActionsContractSuite`                 | Installiert generische Contract-Fälle für Channel-Nachrichtenaktionen. Importieren aus `plugin-sdk/channel-test-helpers`                 |
| `installChannelSetupContractSuite`                   | Installiert generische Contract-Fälle für die Channel-Einrichtung. Importieren aus `plugin-sdk/channel-test-helpers`                    |
| `installChannelStatusContractSuite`                  | Installiert generische Contract-Fälle für den Channel-Status. Importieren aus `plugin-sdk/channel-test-helpers`                         |
| `expectDirectoryIds`                                 | Prüft Channel-Verzeichnis-IDs aus einer Verzeichnislistenfunktion. Importieren aus `plugin-sdk/channel-test-helpers`                    |
| `assertBundledChannelEntries`                        | Prüft, dass gebündelte Channel-Einstiegspunkte den erwarteten öffentlichen Contract bereitstellen. Importieren aus `plugin-sdk/channel-test-helpers` |
| `formatEnvelopeTimestamp`                            | Formatiert deterministische Envelope-Zeitstempel. Importieren aus `plugin-sdk/channel-test-helpers`                                     |
| `expectPairingReplyText`                             | Prüft den Channel-Pairing-Antworttext und extrahiert seinen Code. Importieren aus `plugin-sdk/channel-test-helpers`                    |
| `describePluginRegistrationContract`                 | Installiert Prüfungen für den Plugin-Registrierungs-Contract. Importieren aus `plugin-sdk/plugin-test-contracts`                        |
| `registerSingleProviderPlugin`                       | Registriert ein Provider-Plugin in Loader-Smoke-Tests. Importieren aus `plugin-sdk/plugin-test-runtime`                                 |
| `registerProviderPlugin`                             | Erfasst alle Provider-Arten aus einem Plugin. Importieren aus `plugin-sdk/plugin-test-runtime`                                          |
| `registerProviderPlugins`                            | Erfasst Provider-Registrierungen über mehrere Plugins hinweg. Importieren aus `plugin-sdk/plugin-test-runtime`                          |
| `requireRegisteredProvider`                          | Prüft, dass eine Provider-Sammlung eine ID enthält. Importieren aus `plugin-sdk/plugin-test-runtime`                                     |
| `createRuntimeEnv`                                   | Erstellt eine gemockte CLI-/Plugin-Runtime-Umgebung. Importieren aus `plugin-sdk/plugin-test-runtime`                                   |
| `createPluginSetupWizardStatus`                      | Erstellt Setup-Status-Helper für Channel-Plugins. Importieren aus `plugin-sdk/plugin-test-runtime`                                      |
| `describeOpenAIProviderRuntimeContract`              | Installiert Runtime-Contract-Prüfungen für Provider-Familien. Importieren aus `plugin-sdk/provider-test-contracts`                      |
| `expectPassthroughReplayPolicy`                      | Prüft, dass Provider-Replay-Richtlinien Provider-eigene Tools und Metadaten unverändert durchreichen. Importieren aus `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | Führt einen Live-Test für Realtime-STT-Provider mit gemeinsamen Audio-Fixtures aus. Importieren aus `plugin-sdk/provider-test-contracts` |
| `normalizeTranscriptForMatch`                        | Normalisiert Live-Transkriptausgaben vor Fuzzy-Assertions. Importieren aus `plugin-sdk/provider-test-contracts`                         |
| `expectExplicitVideoGenerationCapabilities`          | Prüft, dass Video-Provider explizite Fähigkeiten für Generierungsmodi deklarieren. Importieren aus `plugin-sdk/provider-test-contracts`  |
| `expectExplicitMusicGenerationCapabilities`          | Prüft, dass Musik-Provider explizite Fähigkeiten für Generierung/Bearbeitung deklarieren. Importieren aus `plugin-sdk/provider-test-contracts` |
| `mockSuccessfulDashscopeVideoTask`                   | Installiert eine erfolgreiche DashScope-kompatible Video-Task-Antwort. Importieren aus `plugin-sdk/provider-test-contracts`             |
| `getProviderHttpMocks`                               | Greift auf optionale Provider-HTTP-/Auth-Vitest-Mocks zu. Importieren aus `plugin-sdk/provider-http-test-mocks`                         |
| `installProviderHttpMockCleanup`                     | Setzt Provider-HTTP-/Auth-Mocks nach jedem Test zurück. Importieren aus `plugin-sdk/provider-http-test-mocks`                           |
| `installCommonResolveTargetErrorCases`               | Gemeinsame Testfälle für Fehlerbehandlung bei Zielauflösung. Importieren aus `plugin-sdk/channel-target-testing`                        |
| `shouldAckReaction`                                  | Prüft, ob ein Channel eine Bestätigungsreaktion hinzufügen soll. Importieren aus `plugin-sdk/channel-feedback`                          |
| `removeAckReactionAfterReply`                        | Entfernt die Bestätigungsreaktion nach der Antwortzustellung. Importieren aus `plugin-sdk/channel-feedback`                             |
| `createTestRegistry`                                 | Erstellt eine Channel-Plugin-Registry-Fixture. Importieren aus `plugin-sdk/plugin-test-runtime` oder `plugin-sdk/channel-test-helpers`  |
| `createEmptyPluginRegistry`                          | Erstellt eine leere Plugin-Registry-Fixture. Importieren aus `plugin-sdk/plugin-test-runtime` oder `plugin-sdk/channel-test-helpers`    |
| `setActivePluginRegistry`                            | Installiert eine Registry-Fixture für Plugin-Runtime-Tests. Importieren aus `plugin-sdk/plugin-test-runtime` oder `plugin-sdk/channel-test-helpers` |
| `createRequestCaptureJsonFetch`                      | Erfasst JSON-Fetch-Anfragen in Media-Helper-Tests. Importieren aus `plugin-sdk/test-env`                                                |
| `withServer`                                         | Führt Tests gegen einen entsorgbaren lokalen HTTP-Server aus. Importieren aus `plugin-sdk/test-env`                                     |
| `createMockIncomingRequest`                          | Erstellt ein minimales eingehendes HTTP-Request-Objekt. Importieren aus `plugin-sdk/test-env`                                           |
| `withFetchPreconnect`                                | Führt Fetch-Tests mit installierten Preconnect-Hooks aus. Importieren aus `plugin-sdk/test-env`                                         |
| `withEnv` / `withEnvAsync`                           | Patcht Umgebungsvariablen vorübergehend. Importieren aus `plugin-sdk/test-env`                                                          |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Erstellt isolierte Dateisystem-Test-Fixtures. Importieren aus `plugin-sdk/test-env`                                                     |
| `createMockServerResponse`                           | Erstellt einen minimalen HTTP-Server-Response-Mock. Importieren aus `plugin-sdk/test-env`                                               |
| `createCliRuntimeCapture`                            | Erfasst CLI-Runtime-Ausgaben in Tests. Importieren aus `plugin-sdk/test-fixtures`                                                       |
| `importFreshModule`                                  | Importiert ein ESM-Modul mit einem frischen Query-Token, um den Modul-Cache zu umgehen. Importieren aus `plugin-sdk/test-fixtures`      |
| `bundledPluginRoot` / `bundledPluginFile`            | Löst Pfade zu gebündelten Plugin-Quell- oder Dist-Fixtures auf. Importieren aus `plugin-sdk/test-fixtures`                              |
| `mockNodeBuiltinModule`                              | Installiert enge Vitest-Mocks für integrierte Node-Module. Importieren aus `plugin-sdk/test-node-mocks`                                 |
| `createSandboxTestContext`                           | Erstellt Sandbox-Testkontexte. Importieren aus `plugin-sdk/test-fixtures`                                                               |
| `writeSkill`                                         | Schreibt Skill-Fixtures. Importieren aus `plugin-sdk/test-fixtures`                                                                     |
| `makeAgentAssistantMessage`                          | Erstellt Agent-Transkript-Nachrichten-Fixtures. Importieren aus `plugin-sdk/test-fixtures`                                              |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Inspiziert Systemereignis-Fixtures und setzt sie zurück. Importieren aus `plugin-sdk/test-fixtures`                                     |
| `sanitizeTerminalText`                               | Bereinigt Terminalausgaben für Assertions. Importieren aus `plugin-sdk/test-fixtures`                                                   |
| `countLines` / `hasBalancedFences`                   | Prüft die Form von Chunking-Ausgaben. Importieren aus `plugin-sdk/test-fixtures`                                                        |
| `runProviderCatalog`                                 | Führt einen Provider-Catalog-Hook mit Testabhängigkeiten aus                                                                           |
| `resolveProviderWizardOptions`                       | Löst Provider-Setup-Wizard-Auswahlen in Contract-Tests auf                                                                              |
| `resolveProviderModelPickerEntries`                  | Löst Provider-Model-Picker-Einträge in Contract-Tests auf                                                                               |
| `buildProviderPluginMethodChoice`                    | Erstellt Provider-Wizard-Auswahl-IDs für Assertions                                                                                     |
| `setProviderWizardProvidersResolverForTest`          | Injiziert Provider-Wizard-Provider für isolierte Tests                                                                                  |
| `createProviderUsageFetch`                           | Fixtures für Provider-Nutzungsabrufe erstellen                                                                                          |
| `useFrozenTime` / `useRealTime`                      | Timer für zeitabhängige Tests einfrieren und wiederherstellen. Aus `plugin-sdk/test-env` importieren                                    |
| `createTestWizardPrompter`                           | Einen gemockten Prompter für den Einrichtungsassistenten erstellen                                                                       |
| `createRuntimeTaskFlow`                              | Isolierten TaskFlow-Zustand zur Laufzeit erstellen                                                                                       |
| `typedCases`                                         | Literaltypen für tabellengesteuerte Tests erhalten. Aus `plugin-sdk/test-fixtures` importieren                                           |

Contract-Suites für gebündelte Plugins verwenden ebenfalls SDK-Test-Unterpfade für testbezogene Hilfsfunktionen für Registry, Manifest, öffentliche Artefakte und Runtime-Fixtures. Nur-Core-Suites, die vom gebündelten OpenClaw-Inventar abhängen, bleiben unter `src/plugins/contracts`.
Legen Sie neue Erweiterungstests auf einem dokumentierten, fokussierten SDK-Unterpfad wie `plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`, `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`, `plugin-sdk/test-env` oder `plugin-sdk/test-fixtures` ab, anstatt den breiten Kompatibilitäts-Barrel `plugin-sdk/testing`, Repo-Dateien unter `src/**` oder Repo-Bridges unter `test/helpers/*` direkt zu importieren.

### Typen

Fokussierte Test-Unterpfade re-exportieren außerdem Typen, die in Testdateien nützlich sind:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Testen der Zielauflösung

Verwenden Sie `installCommonResolveTargetErrorCases`, um Standardfehlerfälle für die Zielauflösung von Channels hinzuzufügen:

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

Unit-Tests, die einen von Hand geschriebenen `api`-Mock an `register(api)` übergeben, üben die Akzeptanz-Gates des OpenClaw-Loaders nicht aus. Fügen Sie für jede Registrierungsoberfläche, von der Ihr Plugin abhängt, mindestens einen loadergestützten Smoke-Test hinzu, insbesondere für Hooks und exklusive Capabilities wie Memory.

Der echte Loader lässt die Plugin-Registrierung fehlschlagen, wenn erforderliche Metadaten fehlen oder ein Plugin eine Capability-API aufruft, die ihm nicht gehört. Beispielsweise erfordert `api.registerHook(...)` einen Hook-Namen, und `api.registerMemoryCapability(...)` erfordert, dass das Plugin-Manifest oder der exportierte Einstieg `kind: "memory"` deklariert.

### Testen des Zugriffs auf Runtime-Konfiguration

Bevorzugen Sie den gemeinsamen Plugin-Runtime-Mock aus `openclaw/plugin-sdk/channel-test-helpers`, wenn Sie gebündelte Channel-Plugins testen. Seine veralteten Mocks `runtime.config.loadConfig()` und `runtime.config.writeConfigFile(...)` werfen standardmäßig Fehler, damit Tests neue Nutzung von Kompatibilitäts-APIs erkennen. Überschreiben Sie diese Mocks nur, wenn der Test ausdrücklich Legacy-Kompatibilitätsverhalten abdeckt.

### Unit-Testen eines Channel-Plugins

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

### Unit-Testen eines Provider-Plugins

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

### Mocken der Plugin-Runtime

Mocken Sie für Code, der `createPluginRuntimeStore` verwendet, die Runtime in Tests:

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

Bevorzugen Sie Stubs pro Instanz gegenüber Prototype-Mutation:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Contract-Tests (Plugins im Repo)

Gebündelte Plugins haben Contract-Tests, die die Registrierungszuständigkeit überprüfen:

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

Nur für Contract-Tests:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth-choice.contract.test.ts
pnpm test -- src/plugins/contracts/runtime-seams.contract.test.ts
```

## Lint-Durchsetzung (Plugins im Repo)

Drei Regeln werden von `pnpm check` für Plugins im Repo durchgesetzt:

1. **Keine monolithischen Root-Importe** -- der Root-Barrel `openclaw/plugin-sdk` wird abgelehnt
2. **Keine direkten `src/`-Importe** -- Plugins können `../../src/` nicht direkt importieren
3. **Keine Selbstimporte** -- Plugins können ihren eigenen Unterpfad `plugin-sdk/<name>` nicht importieren

Externe Plugins unterliegen diesen Lint-Regeln nicht, es wird jedoch empfohlen, denselben Mustern zu folgen.

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

- [SDK-Überblick](/de/plugins/sdk-overview) -- Importkonventionen
- [SDK-Channel-Plugins](/de/plugins/sdk-channel-plugins) -- Schnittstelle für Channel-Plugins
- [SDK-Provider-Plugins](/de/plugins/sdk-provider-plugins) -- Hooks für Provider-Plugins
- [Plugins erstellen](/de/plugins/building-plugins) -- Leitfaden für den Einstieg
