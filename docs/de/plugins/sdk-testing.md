---
read_when:
    - Sie schreiben Tests für ein Plugin
    - Sie benötigen Test-Hilfsfunktionen aus dem Plugin-SDK
    - Sie möchten Contract-Tests für gebündelte Plugins verstehen
sidebarTitle: Testing
summary: Testhilfen und Muster für OpenClaw-Plugins
title: Plugin-Tests
x-i18n:
    generated_at: "2026-04-30T07:08:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7edf81e7662784356fcb0f481dd3fcdde05cc59da2a6c1b38eae1008b3ead96c
    source_path: plugins/sdk-testing.md
    workflow: 16
---

Referenz für Testhilfsfunktionen, Muster und Lint-Durchsetzung für OpenClaw-Plugins.

<Tip>
  **Suchen Sie nach Testbeispielen?** Die Anleitungen enthalten ausgearbeitete Testbeispiele:
  [Channel-Plugin-Tests](/de/plugins/sdk-channel-plugins#step-6-test) und
  [Provider-Plugin-Tests](/de/plugins/sdk-provider-plugins#step-6-test).
</Tip>

## Testhilfsfunktionen

**Plugin-API-Mock-Import:** `openclaw/plugin-sdk/plugin-test-api`

**Import des Agent-Laufzeitvertrags:** `openclaw/plugin-sdk/agent-runtime-test-contracts`

**Import des Channel-Vertrags:** `openclaw/plugin-sdk/channel-contract-testing`

**Import der Channel-Testhilfe:** `openclaw/plugin-sdk/channel-test-helpers`

**Import des Channel-Zieltests:** `openclaw/plugin-sdk/channel-target-testing`

**Import des Plugin-Vertrags:** `openclaw/plugin-sdk/plugin-test-contracts`

**Import des Plugin-Laufzeittests:** `openclaw/plugin-sdk/plugin-test-runtime`

**Import des Provider-Vertrags:** `openclaw/plugin-sdk/provider-test-contracts`

**Import des Provider-HTTP-Mocks:** `openclaw/plugin-sdk/provider-http-test-mocks`

**Import für Umgebungs-/Netzwerktests:** `openclaw/plugin-sdk/test-env`

**Import generischer Fixtures:** `openclaw/plugin-sdk/test-fixtures`

**Import des integrierten Node-Mocks:** `openclaw/plugin-sdk/test-node-mocks`

Bevorzugen Sie für neue Plugin-Tests die fokussierten Unterpfade unten. Der breite
Barrel-Export `openclaw/plugin-sdk/testing` dient nur der Legacy-Kompatibilität.
Repo-Leitplanken lehnen neue echte Importe aus `plugin-sdk/testing` und
`plugin-sdk/test-utils` ab; diese Namen bleiben nur als veraltete Kompatibilitätsoberflächen
für externe Plugins und Kompatibilitätsdatensatz-Tests bestehen.

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

| Export                                               | Zweck                                                                                                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createTestPluginApi`                                | Erstellt einen minimalen Plugin-API-Mock für direkte Registrierungs-Unit-Tests. Importieren aus `plugin-sdk/plugin-test-api`                            |
| `AUTH_PROFILE_RUNTIME_CONTRACT`                      | Gemeinsame Auth-Profil-Vertrags-Fixture für native Agent-Laufzeitadapter. Importieren aus `plugin-sdk/agent-runtime-test-contracts`                     |
| `DELIVERY_NO_REPLY_RUNTIME_CONTRACT`                 | Gemeinsame Vertrags-Fixture für Zustellungsunterdrückung für native Agent-Laufzeitadapter. Importieren aus `plugin-sdk/agent-runtime-test-contracts`    |
| `OUTCOME_FALLBACK_RUNTIME_CONTRACT`                  | Gemeinsame Vertrags-Fixture für Fallback-Klassifizierung für native Agent-Laufzeitadapter. Importieren aus `plugin-sdk/agent-runtime-test-contracts`    |
| `createParameterFreeTool`                            | Erstellt dynamische Tool-Schema-Fixtures für native Laufzeit-Vertragstests. Importieren aus `plugin-sdk/agent-runtime-test-contracts`                   |
| `expectChannelInboundContextContract`                | Prüft die Form des eingehenden Kanalkontexts. Importieren aus `plugin-sdk/channel-contract-testing`                                                     |
| `installChannelOutboundPayloadContractSuite`         | Installiert Vertragsfälle für ausgehende Kanal-Payloads. Importieren aus `plugin-sdk/channel-contract-testing`                                          |
| `createStartAccountContext`                          | Erstellt Kontexte für den Lebenszyklus von Kanalkonten. Importieren aus `plugin-sdk/channel-test-helpers`                                               |
| `installChannelActionsContractSuite`                 | Installiert generische Vertragsfälle für Kanalnachrichtenaktionen. Importieren aus `plugin-sdk/channel-test-helpers`                                    |
| `installChannelSetupContractSuite`                   | Installiert generische Vertragsfälle für die Kanaleinrichtung. Importieren aus `plugin-sdk/channel-test-helpers`                                        |
| `installChannelStatusContractSuite`                  | Installiert generische Vertragsfälle für den Kanalstatus. Importieren aus `plugin-sdk/channel-test-helpers`                                             |
| `expectDirectoryIds`                                 | Prüft Kanalverzeichnis-IDs aus einer Verzeichnislistenfunktion. Importieren aus `plugin-sdk/channel-test-helpers`                                       |
| `assertBundledChannelEntries`                        | Prüft, dass gebündelte Kanal-Einstiegspunkte den erwarteten öffentlichen Vertrag offenlegen. Importieren aus `plugin-sdk/channel-test-helpers`          |
| `formatEnvelopeTimestamp`                            | Formatiert deterministische Umschlag-Zeitstempel. Importieren aus `plugin-sdk/channel-test-helpers`                                                    |
| `expectPairingReplyText`                             | Prüft den Antworttext zur Kanalkopplung und extrahiert dessen Code. Importieren aus `plugin-sdk/channel-test-helpers`                                  |
| `describePluginRegistrationContract`                 | Installiert Prüfungen für den Plugin-Registrierungsvertrag. Importieren aus `plugin-sdk/plugin-test-contracts`                                          |
| `registerSingleProviderPlugin`                       | Registriert ein Provider-Plugin in Loader-Smoke-Tests. Importieren aus `plugin-sdk/plugin-test-runtime`                                                 |
| `registerProviderPlugin`                             | Erfasst alle Provider-Arten aus einem Plugin. Importieren aus `plugin-sdk/plugin-test-runtime`                                                          |
| `registerProviderPlugins`                            | Erfasst Provider-Registrierungen über mehrere Plugins hinweg. Importieren aus `plugin-sdk/plugin-test-runtime`                                          |
| `requireRegisteredProvider`                          | Prüft, dass eine Provider-Sammlung eine ID enthält. Importieren aus `plugin-sdk/plugin-test-runtime`                                                    |
| `createRuntimeEnv`                                   | Erstellt eine gemockte CLI-/Plugin-Laufzeitumgebung. Importieren aus `plugin-sdk/plugin-test-runtime`                                                   |
| `createPluginSetupWizardStatus`                      | Erstellt Einrichtungsstatus-Helfer für Kanal-Plugins. Importieren aus `plugin-sdk/plugin-test-runtime`                                                  |
| `describeOpenAIProviderRuntimeContract`              | Installiert Prüfungen für Provider-Familien-Laufzeitverträge. Importieren aus `plugin-sdk/provider-test-contracts`                                      |
| `expectPassthroughReplayPolicy`                      | Prüft, dass Provider-Replay-Richtlinien Provider-eigene Tools und Metadaten unverändert durchreichen. Importieren aus `plugin-sdk/provider-test-contracts` |
| `runRealtimeSttLiveTest`                             | Führt einen Live-Echtzeit-STT-Provider-Test mit gemeinsamen Audio-Fixtures aus. Importieren aus `plugin-sdk/provider-test-contracts`                    |
| `normalizeTranscriptForMatch`                        | Normalisiert die Live-Transkriptausgabe vor unscharfen Assertions. Importieren aus `plugin-sdk/provider-test-contracts`                                 |
| `expectExplicitVideoGenerationCapabilities`          | Prüft, dass Video-Provider explizite Fähigkeiten für Generierungsmodi deklarieren. Importieren aus `plugin-sdk/provider-test-contracts`                 |
| `expectExplicitMusicGenerationCapabilities`          | Prüft, dass Musik-Provider explizite Fähigkeiten für Generierung/Bearbeitung deklarieren. Importieren aus `plugin-sdk/provider-test-contracts`          |
| `mockSuccessfulDashscopeVideoTask`                   | Installiert eine erfolgreiche DashScope-kompatible Videoaufgaben-Antwort. Importieren aus `plugin-sdk/provider-test-contracts`                          |
| `getProviderHttpMocks`                               | Greift auf Opt-in-Provider-HTTP-/Auth-Vitest-Mocks zu. Importieren aus `plugin-sdk/provider-http-test-mocks`                                            |
| `installProviderHttpMockCleanup`                     | Setzt Provider-HTTP-/Auth-Mocks nach jedem Test zurück. Importieren aus `plugin-sdk/provider-http-test-mocks`                                           |
| `installCommonResolveTargetErrorCases`               | Gemeinsame Testfälle für die Fehlerbehandlung bei der Zielauflösung. Importieren aus `plugin-sdk/channel-target-testing`                                |
| `shouldAckReaction`                                  | Prüft, ob ein Kanal eine Bestätigungsreaktion hinzufügen soll. Importieren aus `plugin-sdk/channel-feedback`                                            |
| `removeAckReactionAfterReply`                        | Entfernt die Bestätigungsreaktion nach der Antwortzustellung. Importieren aus `plugin-sdk/channel-feedback`                                             |
| `createTestRegistry`                                 | Erstellt eine Registry-Fixture für Kanal-Plugins. Importieren aus `plugin-sdk/plugin-test-runtime` oder `plugin-sdk/channel-test-helpers`               |
| `createEmptyPluginRegistry`                          | Erstellt eine leere Plugin-Registry-Fixture. Importieren aus `plugin-sdk/plugin-test-runtime` oder `plugin-sdk/channel-test-helpers`                    |
| `setActivePluginRegistry`                            | Installiert eine Registry-Fixture für Plugin-Laufzeittests. Importieren aus `plugin-sdk/plugin-test-runtime` oder `plugin-sdk/channel-test-helpers`     |
| `createRequestCaptureJsonFetch`                      | Erfasst JSON-Fetch-Anfragen in Medienhelfer-Tests. Importieren aus `plugin-sdk/test-env`                                                                |
| `withServer`                                         | Führt Tests gegen einen kurzlebigen lokalen HTTP-Server aus. Importieren aus `plugin-sdk/test-env`                                                      |
| `createMockIncomingRequest`                          | Erstellt ein minimales eingehendes HTTP-Anfrageobjekt. Importieren aus `plugin-sdk/test-env`                                                           |
| `withFetchPreconnect`                                | Führt Fetch-Tests mit installierten Preconnect-Hooks aus. Importieren aus `plugin-sdk/test-env`                                                         |
| `withEnv` / `withEnvAsync`                           | Patcht Umgebungsvariablen vorübergehend. Importieren aus `plugin-sdk/test-env`                                                                          |
| `createTempHomeEnv` / `withTempHome` / `withTempDir` | Erstellt isolierte Dateisystem-Test-Fixtures. Importieren aus `plugin-sdk/test-env`                                                                     |
| `createMockServerResponse`                           | Erstellt einen minimalen HTTP-Server-Antwortmock. Importieren aus `plugin-sdk/test-env`                                                                 |
| `createCliRuntimeCapture`                            | Erfasst CLI-Laufzeitausgabe in Tests. Importieren aus `plugin-sdk/test-fixtures`                                                                       |
| `importFreshModule`                                  | Importiert ein ESM-Modul mit einem frischen Query-Token, um den Modulcache zu umgehen. Importieren aus `plugin-sdk/test-fixtures`                      |
| `bundledPluginRoot` / `bundledPluginFile`            | Löst gebündelte Plugin-Quell- oder Dist-Fixture-Pfade auf. Importieren aus `plugin-sdk/test-fixtures`                                                  |
| `mockNodeBuiltinModule`                              | Installiert eng begrenzte Vitest-Mocks für integrierte Node-Module. Importieren aus `plugin-sdk/test-node-mocks`                                       |
| `createSandboxTestContext`                           | Erstellt Sandbox-Testkontexte. Importieren aus `plugin-sdk/test-fixtures`                                                                              |
| `writeSkill`                                         | Schreibt Skill-Fixtures. Importieren aus `plugin-sdk/test-fixtures`                                                                                    |
| `makeAgentAssistantMessage`                          | Erstellt Agent-Transkript-Nachrichten-Fixtures. Importieren aus `plugin-sdk/test-fixtures`                                                             |
| `peekSystemEvents` / `resetSystemEventsForTest`      | Prüft Systemereignis-Fixtures und setzt sie zurück. Importieren aus `plugin-sdk/test-fixtures`                                                         |
| `sanitizeTerminalText`                               | Bereinigt Terminalausgabe für Assertions. Importieren aus `plugin-sdk/test-fixtures`                                                                   |
| `countLines` / `hasBalancedFences`                   | Prüft die Form der Chunking-Ausgabe. Importieren aus `plugin-sdk/test-fixtures`                                                                        |
| `runProviderCatalog`                                 | Führt einen Provider-Katalog-Hook mit Testabhängigkeiten aus                                                                                           |
| `resolveProviderWizardOptions`                       | Löst Provider-Einrichtungsassistent-Auswahlen in Vertragstests auf                                                                                     |
| `resolveProviderModelPickerEntries`                  | Löst Provider-Modellauswahl-Einträge in Vertragstests auf                                                                                              |
| `buildProviderPluginMethodChoice`                    | Erstellt Provider-Assistent-Auswahl-IDs für Assertions                                                                                                  |
| `setProviderWizardProvidersResolverForTest`          | Injiziert Provider-Assistent-Provider für isolierte Tests                                                                                              |
| `createProviderUsageFetch`                           | Fixtures für das Abrufen der Provider-Nutzung erstellen                                                                                   |
| `useFrozenTime` / `useRealTime`                      | Timer für zeitkritische Tests einfrieren und wiederherstellen. Aus `plugin-sdk/test-env` importieren                                      |
| `createTestWizardPrompter`                           | Einen gemockten Setup-Wizard-Prompter erstellen                                                                                           |
| `createRuntimeTaskFlow`                              | Isolierten Runtime-TaskFlow-Zustand erstellen                                                                                             |
| `typedCases`                                         | Literale Typen für tabellengesteuerte Tests beibehalten. Aus `plugin-sdk/test-fixtures` importieren                                       |

Contract-Suites für gebündelte Plugins verwenden außerdem SDK-Test-Unterpfade für test-only
Registry-, Manifest-, public-artifact- und Runtime-Fixture-Helfer. Nur-Core-
Suites, die vom gebündelten OpenClaw-Inventar abhängen, bleiben unter `src/plugins/contracts`.
Legen Sie neue Plugin-Tests auf einem dokumentierten, fokussierten SDK-Unterpfad ab, etwa
`plugin-sdk/plugin-test-api`, `plugin-sdk/channel-contract-testing`,
`plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/channel-test-helpers`,
`plugin-sdk/plugin-test-contracts`, `plugin-sdk/plugin-test-runtime`,
`plugin-sdk/provider-test-contracts`, `plugin-sdk/provider-http-test-mocks`,
`plugin-sdk/test-env` oder `plugin-sdk/test-fixtures`, statt das breite
Kompatibilitäts-Barrel `plugin-sdk/testing`, Repository-`src/**`-Dateien oder Repository-
`test/helpers/*`-Bridges direkt zu importieren.

### Typen

Fokussierte Testing-Unterpfade exportieren außerdem Typen erneut, die in Testdateien nützlich sind:

```typescript
import type {
  ChannelAccountSnapshot,
  ChannelGatewayContext,
} from "openclaw/plugin-sdk/channel-contract";
import type { OpenClawConfig } from "openclaw/plugin-sdk/config-types";
import type { MockFn, PluginRuntime, RuntimeEnv } from "openclaw/plugin-sdk/plugin-test-runtime";
```

## Testing-Zielauflösung

Verwenden Sie `installCommonResolveTargetErrorCases`, um Standardfehlerfälle für die
Channel-Zielauflösung hinzuzufügen:

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

## Testing-Muster

### Registrierungskontrakte testen

Unit-Tests, die ein handgeschriebenes `api`-Mock an `register(api)` übergeben, üben
die Akzeptanz-Gates des OpenClaw-Loaders nicht aus. Fügen Sie mindestens einen loader-gestützten Smoke-Test
für jede Registrierungsoberfläche hinzu, von der Ihr Plugin abhängt, insbesondere Hooks und
exklusive Capabilities wie Memory.

Der echte Loader lässt die Plugin-Registrierung fehlschlagen, wenn erforderliche Metadaten fehlen oder ein
Plugin eine Capability-API aufruft, die es nicht besitzt. Zum Beispiel erfordert
`api.registerHook(...)` einen Hook-Namen, und
`api.registerMemoryCapability(...)` erfordert, dass das Plugin-Manifest oder der exportierte
Eintrag `kind: "memory"` deklariert.

### Runtime-Konfigurationszugriff testen

Bevorzugen Sie das gemeinsam genutzte Plugin-Runtime-Mock aus `openclaw/plugin-sdk/channel-test-helpers`,
wenn Sie gebündelte Channel-Plugins testen. Seine veralteten Mocks `runtime.config.loadConfig()` und
`runtime.config.writeConfigFile(...)` werfen standardmäßig Fehler, damit Tests neue
Nutzung von Kompatibilitäts-APIs erkennen. Überschreiben Sie diese Mocks nur, wenn der Test
ausdrücklich Legacy-Kompatibilitätsverhalten abdeckt.

### Unit-Test eines Channel-Plugins

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

### Plugin-Runtime mocken

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

### Mit Stubs pro Instanz testen

Bevorzugen Sie Stubs pro Instanz gegenüber Prototyp-Mutation:

```typescript
// Preferred: per-instance stub
const client = new MyChannelClient();
client.sendMessage = vi.fn().mockResolvedValue({ id: "msg-1" });

// Avoid: prototype mutation
// MyChannelClient.prototype.sendMessage = vi.fn();
```

## Kontrakttests (repo-interne Plugins)

Gebündelte Plugins haben Kontrakttests, die Registrierungs-Ownership verifizieren:

```bash
pnpm test -- src/plugins/contracts/
```

Diese Tests prüfen:

- Welche Plugins welche Provider registrieren
- Welche Plugins welche Speech-Provider registrieren
- Korrektheit der Registrierungsform
- Einhaltung des Runtime-Kontrakts

### Tests mit begrenztem Scope ausführen

Für ein bestimmtes Plugin:

```bash
pnpm test -- <bundled-plugin-root>/my-channel/
```

Nur für Kontrakttests:

```bash
pnpm test -- src/plugins/contracts/shape.contract.test.ts
pnpm test -- src/plugins/contracts/auth.contract.test.ts
pnpm test -- src/plugins/contracts/runtime.contract.test.ts
```

## Lint-Durchsetzung (repo-interne Plugins)

Drei Regeln werden von `pnpm check` für repo-interne Plugins durchgesetzt:

1. **Keine monolithischen Root-Importe** -- das Root-Barrel `openclaw/plugin-sdk` wird abgelehnt
2. **Keine direkten `src/`-Importe** -- Plugins können `../../src/` nicht direkt importieren
3. **Keine Self-Imports** -- Plugins können ihren eigenen `plugin-sdk/<name>`-Unterpfad nicht importieren

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

Wenn lokale Läufe Speicherdruck verursachen:

```bash
OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test
```

## Verwandte Themen

- [SDK-Überblick](/de/plugins/sdk-overview) -- Importkonventionen
- [SDK-Channel-Plugins](/de/plugins/sdk-channel-plugins) -- Channel-Plugin-Schnittstelle
- [SDK-Provider-Plugins](/de/plugins/sdk-provider-plugins) -- Provider-Plugin-Hooks
- [Plugins erstellen](/de/plugins/building-plugins) -- Einstiegshandbuch
