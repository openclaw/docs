---
read_when:
    - Sie schreiben Tests für ein Plugin
    - Sie benötigen Testhilfsprogramme aus dem Plugin-SDK
    - Sie möchten Vertragstests für gebündelte Plugins verstehen
sidebarTitle: Testing
summary: Testhilfen und Muster für OpenClaw-Plugins
title: Plugin-Tests
x-i18n:
    generated_at: "2026-06-27T18:00:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 515722102296373fb3b4bba8720e3ee784702adcd576fbf5b67003183c492967
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

Diese Test-Helper-Unterpfade sind repo-lokale Quellcode-Einstiegspunkte für OpenClaws eigene
gebündelte Plugin-Tests. Sie sind keine Paket-Exporte für Drittanbieter-Plugins und
können Vitest oder andere nur im Repo verwendete Testabhängigkeiten importieren.

**Plugin-API-Mock-Import:** `openclaw/plugin-sdk/plugin-test-api`

**Agent-Runtime-Contract-Import:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Channel-Contract-Import:** `openclaw/plugin-sdk/channel-contract-testing`

**Channel-Test-Helper-Import:** `openclaw/plugin-sdk/channel-test-helpers`

**Channel-Target-Test-Import:** `openclaw/plugin-sdk/channel-target-testing`

**Plugin-Contract-Import:** `openclaw/plugin-sdk/plugin-test-contracts`

**Plugin-Runtime-Test-Import:** `openclaw/plugin-sdk/plugin-test-runtime`

**Provider-Contract-Import:** `openclaw/plugin-sdk/provider-test-contracts`

**Provider-HTTP-Mock-Import:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Umgebungs-/Netzwerk-Test-Import:** `openclaw/plugin-sdk/test-env`

**Generischer Fixture-Import:** `openclaw/plugin-sdk/test-fixtures`

**Node-Builtin-Mock-Import:** `openclaw/plugin-sdk/test-node-mocks`

Innerhalb des OpenClaw-Repos sollten Sie für neue gebündelte
Plugin-Tests die unten aufgeführten fokussierten Unterpfade bevorzugen. Das breite
`openclaw/plugin-sdk/testing`-Barrel dient nur der Legacy-Kompatibilität.
Repo-Schutzregeln weisen neue echte Importe aus `plugin-sdk/testing` und
`plugin-sdk/test-utils` zurück; diese Namen bleiben nur als veraltete Kompatibilitätsoberflächen
für Compatibility-Record-Tests bestehen.

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

| Export                                               | Zweck                                                                                                                                                |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Erstellt ein minimales Plugin-API-Mock für direkte Registrierungs-Unit-Tests. Import aus `plugin-sdk/plugin-test-api`                                |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Gemeinsame Authentifizierungsprofil-Contract-Fixture für native Agent-Laufzeitadapter. Import aus `plugin-sdk/agent-runtime-test-contracts`          |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Gemeinsame Contract-Fixture für Unterdrückung von Zustellungen für native Agent-Laufzeitadapter. Import aus `plugin-sdk/agent-runtime-test-contracts` |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Gemeinsame Contract-Fixture für Fallback-Klassifizierung für native Agent-Laufzeitadapter. Import aus `plugin-sdk/agent-runtime-test-contracts`       |
| `createParameterFreeTool`                            | Erstellt Dynamic-Tool-Schema-Fixtures für native Laufzeit-Contract-Tests. Import aus `plugin-sdk/agent-runtime-test-contracts`                       |
| `expectChannelInboundContextContract`                | Prüft die Form des eingehenden Channel-Kontexts. Import aus `plugin-sdk/channel-contract-testing`                                                     |
| `installChannelOutboundPayloadContractSuite`         | Installiert Contract-Fälle für ausgehende Channel-Payloads. Import aus `plugin-sdk/channel-contract-testing`                                          |
| `createStartAccountContext`                          | Erstellt Kontexte für den Channel-Konto-Lebenszyklus. Import aus `plugin-sdk/channel-test-helpers`                                                   |
| `installChannelActionsContractSuite`                 | Installiert generische Contract-Fälle für Channel-Nachrichtenaktionen. Import aus `plugin-sdk/channel-test-helpers`                                  |
| `installChannelSetupContractSuite`                   | Installiert generische Contract-Fälle für die Channel-Einrichtung. Import aus `plugin-sdk/channel-test-helpers`                                      |
| `installChannelStatusContractSuite`                  | Installiert generische Contract-Fälle für den Channel-Status. Import aus `plugin-sdk/channel-test-helpers`                                           |
| `expectDirectoryIds`                                 | Prüft Channel-Verzeichnis-IDs aus einer Verzeichnislistenfunktion. Import aus `plugin-sdk/channel-test-helpers`                                      |
| `assertBundledChannelEntries`                        | Prüft, dass gebündelte Channel-Einstiegspunkte den erwarteten öffentlichen Contract bereitstellen. Import aus `plugin-sdk/channel-test-helpers`       |
| `formatEnvelopeTimestamp`                            | Formatiert deterministische Envelope-Zeitstempel. Import aus `plugin-sdk/channel-test-helpers`                                                       |
| `expectPairingReplyText`                             | Prüft den Channel-Pairing-Antworttext und extrahiert dessen Code. Import aus `plugin-sdk/channel-test-helpers`                                       |
| `describePluginRegistrationContract`                 | Installiert Prüfungen für den Plugin-Registrierungs-Contract. Import aus `plugin-sdk/plugin-test-contracts`                                          |
| `registerSingleProviderPlugin`                       | Registriert ein Provider-Plugin in Loader-Smoke-Tests. Import aus `plugin-sdk/plugin-test-runtime`                                                   |
| `registerProviderPlugin`                             | Erfasst alle Provider-Arten aus einem Plugin. Import aus `plugin-sdk/plugin-test-runtime`                                                            |
| `registerProviderPlugins`                            | Erfasst Provider-Registrierungen über mehrere Plugins hinweg. Import aus `plugin-sdk/plugin-test-runtime`                                            |
| `requireRegisteredProvider`                          | Prüft, dass eine Provider-Sammlung eine ID enthält. Import aus `plugin-sdk/plugin-test-runtime`                                                      |
| `createRuntimeEnv`                                   | Erstellt eine gemockte CLI/Plugin-Laufzeitumgebung. Import aus `plugin-sdk/plugin-test-runtime`                                                      |
| `createPluginSetupWizardStatus`                      | Erstellt Einrichtungsstatus-Helfer für Channel-Plugins. Import aus `plugin-sdk/plugin-test-runtime`                                                  |
| `describeOpenAIProviderRuntimeContract`              | Installiert Laufzeit-Contract-Prüfungen für Provider-Familien. Import aus `plugin-sdk/provider-test-contracts`                                       |
| `expectPassthroughReplayPolicy`                      | Prüft, dass Provider-Replay-Richtlinien Provider-eigene Tools und Metadaten durchreichen. Import aus `plugin-sdk/provider-test-contracts`            |
| `runRealtimeSttLiveTest`                             | Führt einen Live-Realtime-STT-Provider-Test mit gemeinsamen Audio-Fixtures aus. Import aus `plugin-sdk/provider-test-contracts`                       |
| `normalizeTranscriptForMatch`                        | Normalisiert die Live-Transkriptausgabe vor unscharfen Assertions. Import aus `plugin-sdk/provider-test-contracts`                                   |
| `expectExplicitVideoGenerationCapabilities`          | Prüft, dass Video-Provider explizite Fähigkeiten für Generierungsmodi deklarieren. Import aus `plugin-sdk/provider-test-contracts`                   |
| `expectExplicitMusicGenerationCapabilities`          | Prüft, dass Musik-Provider explizite Fähigkeiten für Generierung/Bearbeitung deklarieren. Import aus `plugin-sdk/provider-test-contracts`            |
| `mockSuccessfulDashscopeVideoTask`                   | Installiert eine erfolgreiche DashScope-kompatible Antwort für eine Videoaufgabe. Import aus `plugin-sdk/provider-test-contracts`                    |
| `getProviderHttpMocks`                               | Greift auf Opt-in-Vitest-Mocks für Provider-HTTP/Auth zu. Import aus `plugin-sdk/provider-http-test-mocks`                                           |
| `installProviderHttpMockCleanup`                     | Setzt Provider-HTTP/Auth-Mocks nach jedem Test zurück. Import aus `plugin-sdk/provider-http-test-mocks`                                              |
| `installCommonResolveTargetErrorCases`               | Gemeinsame Testfälle für die Fehlerbehandlung bei Zielauflösung. Import aus `plugin-sdk/channel-target-testing`                                      |
| `shouldAckReaction`                                  | Prüft, ob ein Channel eine Bestätigungsreaktion hinzufügen soll. Import aus `plugin-sdk/channel-feedback`                                            |
| `removeAckReactionAfterReply`                        | Entfernt die Bestätigungsreaktion nach Zustellung der Antwort. Import aus `plugin-sdk/channel-feedback`                                              |
| `createTestRegistry`                                 | Erstellt eine Channel-Plugin-Registry-Fixture. Import aus `plugin-sdk/plugin-test-runtime` oder `plugin-sdk/channel-test-helpers`                    |
| `createEmptyPluginRegistry`                          | Erstellt eine leere Plugin-Registry-Fixture. Import aus `plugin-sdk/plugin-test-runtime` oder `plugin-sdk/channel-test-helpers`                      |
| `setActivePluginRegistry`                            | Installiert eine Registry-Fixture für Plugin-Laufzeittests. Import aus `plugin-sdk/plugin-test-runtime` oder `plugin-sdk/channel-test-helpers`       |
| `createRequestCaptureJsonFetch`                      | Erfasst JSON-Fetch-Anfragen in Media-Helfertests. Import aus `plugin-sdk/test-env`                                                                   |
| `withServer`                                         | Führt Tests gegen einen verwerfbaren lokalen HTTP-Server aus. Import aus `plugin-sdk/test-env`                                                       |
| `createMockIncomingRequest`                          | Erstellt ein minimales eingehendes HTTP-Anforderungsobjekt. Import aus `plugin-sdk/test-env`                                                         |
| `withFetchPreconnect`                                | Führt Fetch-Tests mit installierten Preconnect-Hooks aus. Import aus `plugin-sdk/test-env`                                                           |
| `withEnv` / `withEnvAsync`                           | Patcht Umgebungsvariablen vorübergehend. Import aus `plugin-sdk/test-env`                                                                            |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Erstellt isolierte Dateisystem-Test-Fixtures. Import aus `plugin-sdk/test-env`                                                                       |
| `createMockServerResponse`                           | Erstellt ein minimales Mock für HTTP-Serverantworten. Import aus `plugin-sdk/test-env`                                                               |
| `createCliRuntimeCapture`                            | Erfasst CLI-Laufzeitausgabe in Tests. Import aus `plugin-sdk/test-fixtures`                                                                          |
| `importFreshModule`                                  | Importiert ein ESM-Modul mit einem frischen Query-Token, um den Modulcache zu umgehen. Import aus `plugin-sdk/test-fixtures`                         |
| `bundledPluginRoot` / `bundledPluginFile`            | Löst Pfade für gebündelte Plugin-Quell- oder Dist-Fixtures auf. Import aus `plugin-sdk/test-fixtures`                                                |
| `mockNodeBuiltinModule`                              | Installiert schmale Vitest-Mocks für integrierte Node-Module. Import aus `plugin-sdk/test-node-mocks`                                                |
| `createSandboxTestContext`                           | Erstellt Sandbox-Testkontexte. Import aus `plugin-sdk/test-fixtures`                                                                                 |
| `writeSkill`                                         | Schreibt Skill-Fixtures. Import aus `plugin-sdk/test-fixtures`                                                                                       |
| `makeAgentAssistantMessage`                          | Erstellt Nachrichten-Fixtures für Agent-Transkripte. Import aus `plugin-sdk/test-fixtures`                                                           |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Inspiziert Systemereignis-Fixtures und setzt sie zurück. Import aus `plugin-sdk/test-fixtures`                                                       |
| `sanitizeTerminalText`                               | Bereinigt Terminalausgabe für Assertions. Import aus `plugin-sdk/test-fixtures`                                                                      |
| `countLines` / `hasBalancedFences`                   | Prüft die Form der Chunking-Ausgabe. Import aus `plugin-sdk/test-fixtures`                                                                           |
| `runProviderCatalog`                                 | Führt einen Provider-Katalog-Hook mit Testabhängigkeiten aus                                                                                         |
| `resolveProviderWizardOptions`                       | Löst Auswahlmöglichkeiten des Provider-Einrichtungsassistenten in Contract-Tests auf                                                                 |
| `resolveProviderModelPickerEntries`                  | Löst Einträge der Provider-Modellauswahl in Contract-Tests auf                                                                                       |
| `buildProviderPluginMethodChoice`                    | Erstellt Auswahl-IDs des Provider-Assistenten für Assertions                                                                                         |
| `setProviderWizardProvidersResolverForTest`          | Injiziert Provider des Provider-Assistenten für isolierte Tests                                                                                      |
| `createProviderUsageFetch`                           | Provider-Nutzungs-Fetch-Fixtures erstellen                                                                                               |
| `useFrozenTime` / `useRealTime`                      | Timer für zeitabhängige Tests einfrieren und wiederherstellen. Aus `plugin-sdk/test-env` importieren                                     |
| `createTestWizardPrompter`                           | Einen gemockten Setup-Wizard-Prompter erstellen                                                                                          |
| `createRuntimeTaskFlow`                              | Isolierten Runtime-TaskFlow-Zustand erstellen                                                                                            |
| `typedCases`                                         | Literaltypen für tabellengesteuerte Tests beibehalten. Aus `plugin-sdk/test-fixtures` importieren                                        |

Vertragssuiten für gebündelte Plugins verwenden außerdem SDK-Test-Unterpfade für testexklusive
Registry-, Manifest-, Public-Artifact- und Runtime-Fixture-Helfer. Reine Core-
Suiten, die vom gebündelten OpenClaw-Inventar abhängen, bleiben unter `src/plugins/contracts`.
Legen Sie neue Erweiterungstests auf einem dokumentierten, fokussierten SDK-Unterpfad ab, etwa
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env` oder `plugin-sdk/test-fixtures`, anstatt den breiten
Kompatibilitäts-Barrel `plugin-sdk/testing`, Repo-Dateien unter `src/**` oder Repo-
Brücken unter `test/helpers/*` direkt zu importieren.

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
Auflösung von Kanalzielen hinzuzufügen:

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

### Registrierungsverträge testen

Unit-Tests, die ein handgeschriebenes `api`-Mock an `register(api)` übergeben, prüfen nicht
die Akzeptanzprüfungen des OpenClaw-Loaders. Fügen Sie für jede Registrierungsoberfläche,
von der Ihr Plugin abhängt, mindestens einen Loader-gestützten Smoke-Test hinzu, insbesondere für Hooks und
exklusive Capabilities wie Speicher.

Der echte Loader lässt die Plugin-Registrierung fehlschlagen, wenn erforderliche Metadaten fehlen oder ein
Plugin eine Capability-API aufruft, die ihm nicht gehört. Beispielsweise erfordert
`api.registerHook(...)` einen Hook-Namen, und
`api.registerMemoryCapability(...)` erfordert, dass das Plugin-Manifest oder der exportierte
Einstieg `kind: "memory"` deklariert.

### Runtime-Konfigurationszugriff testen

Bevorzugen Sie das gemeinsame Plugin-Runtime-Mock aus `openclaw/plugin-sdk/channel-test-helpers`,
wenn Sie gebündelte Kanal-Plugins testen. Seine veralteten Mocks `runtime.config.loadConfig()` und
`runtime.config.writeConfigFile(...)` werfen standardmäßig Fehler, damit Tests neue
Nutzung von Kompatibilitäts-APIs erkennen. Überschreiben Sie diese Mocks nur, wenn der Test
explizit Legacy-Kompatibilitätsverhalten abdeckt.

### Ein Kanal-Plugin per Unit-Test testen

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

### Ein Provider-Plugin per Unit-Test testen

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

### Testen mit Stubs pro Instanz

Bevorzugen Sie Stubs pro Instanz gegenüber Prototyp-Mutationen:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Vertragstests (Plugins im Repo)

Gebündelte Plugins haben Vertragstests, die die Registrierungszuordnung verifizieren:

```bash
pnpm test -- src/plugins/contracts/
```

Diese Tests prüfen:

- Welche Plugins welche Provider registrieren
- Welche Plugins welche Sprach-Provider registrieren
- Korrektheit der Registrierungsform
- Einhaltung des Runtime-Vertrags

### Bereichsspezifische Tests ausführen

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

## Lint-Durchsetzung (Plugins im Repo)

Drei Regeln werden von `pnpm check` für Plugins im Repo durchgesetzt:

1. **Keine monolithischen Root-Importe** -- der Root-Barrel `openclaw/plugin-sdk` wird abgelehnt
2. **Keine direkten `src/`-Importe** -- Plugins können nicht direkt `../../src/` importieren
3. **Keine Selbstimporte** -- Plugins können ihren eigenen Unterpfad `plugin-sdk/<name>` nicht importieren

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

Wenn lokale Ausführungen Speicherdruck verursachen:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Verwandt

- [SDK-Überblick](/de/plugins/sdk-overview) -- Importkonventionen
- [SDK-Kanal-Plugins](/de/plugins/sdk-channel-plugins) -- Schnittstelle für Kanal-Plugins
- [SDK-Provider-Plugins](/de/plugins/sdk-provider-plugins) -- Provider-Plugin-Hooks
- [Plugins erstellen](/de/plugins/building-plugins) -- Einstiegshandbuch
