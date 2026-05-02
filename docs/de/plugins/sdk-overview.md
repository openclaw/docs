---
read_when:
    - Sie müssen wissen, welchen SDK-Unterpfad Sie für den Import verwenden müssen
    - Sie möchten eine Referenz für alle Registrierungsmethoden der OpenClawPluginApi
    - Sie suchen nach einem bestimmten SDK-Export
sidebarTitle: Plugin SDK overview
summary: Import-Map, API-Referenz zur Registrierung und SDK-Architektur
title: Plugin-SDK-Übersicht
x-i18n:
    generated_at: "2026-05-02T06:42:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: be5fa531e603fb6d87f84e3193ebd61be1431b57b8f284871ae15f34ca93fc69
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Das Plugin-SDK ist der typisierte Vertrag zwischen Plugins und Core. Diese Seite ist die
Referenz dafür, **was importiert werden soll** und **was Sie registrieren können**.

<Note>
  Diese Seite richtet sich an Plugin-Autoren, die `openclaw/plugin-sdk/*` innerhalb von
  OpenClaw verwenden. Für externe Apps, Skripte, Dashboards, CI-Jobs und IDE-Erweiterungen,
  die Agents über das Gateway ausführen möchten, verwenden Sie stattdessen das
  [OpenClaw App SDK](/de/concepts/openclaw-sdk) und das Paket `@openclaw/sdk`.
</Note>

<Tip>
Suchen Sie stattdessen eine Anleitung? Beginnen Sie mit [Plugins erstellen](/de/plugins/building-plugins), verwenden Sie [Channel-Plugins](/de/plugins/sdk-channel-plugins) für Channel-Plugins, [Provider-Plugins](/de/plugins/sdk-provider-plugins) für Provider-Plugins und [Plugin-Hooks](/de/plugins/hooks) für Tool- oder Lifecycle-Hook-Plugins.
</Tip>

## Importkonvention

Importieren Sie immer aus einem spezifischen Unterpfad:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Jeder Unterpfad ist ein kleines, eigenständiges Modul. Dadurch bleibt der Start schnell und
Probleme mit zirkulären Abhängigkeiten werden vermieden. Für channelspezifische Entry-/Build-Helfer
bevorzugen Sie `openclaw/plugin-sdk/channel-core`; behalten Sie `openclaw/plugin-sdk/core` für
die breitere Dachoberfläche und gemeinsam genutzte Helfer wie
`buildChannelConfigSchema`.

Für die Channel-Konfiguration veröffentlichen Sie das vom Channel verwaltete JSON Schema über
`openclaw.plugin.json#channelConfigs`. Der Unterpfad `plugin-sdk/channel-config-schema`
ist für gemeinsam genutzte Schema-Primitiven und den generischen Builder vorgesehen. Die
gebündelten Plugins von OpenClaw verwenden `plugin-sdk/bundled-channel-config-schema` für beibehaltene
Schemas gebündelter Channels. Veraltete Kompatibilitätsexporte bleiben auf
`plugin-sdk/channel-config-schema-legacy`; keiner der beiden Unterpfade für gebündelte Schemas ist ein
Muster für neue Plugins.

<Warning>
  Importieren Sie keine Provider- oder Channel-gebrandeten Convenience-Seams (zum Beispiel
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Gebündelte Plugins setzen generische SDK-Unterpfade innerhalb ihrer eigenen `api.ts`- /
  `runtime-api.ts`-Barrels zusammen; Core-Verbraucher sollten entweder diese Plugin-lokalen
  Barrels verwenden oder einen schmalen generischen SDK-Vertrag hinzufügen, wenn ein Bedarf wirklich
  channelübergreifend ist.

Eine kleine Gruppe von Hilfs-Seams für gebündelte Plugins erscheint weiterhin in der generierten Export-Map,
wenn sie nachverfolgte Owner-Nutzung haben. Sie existieren nur für die Wartung gebündelter Plugins
und werden nicht als Importpfade für neue Drittanbieter-Plugins empfohlen.

`openclaw/plugin-sdk/discord` und `openclaw/plugin-sdk/telegram-account` werden
ebenfalls als veraltete Kompatibilitäts-Fassaden für nachverfolgte Owner-Nutzung beibehalten. Kopieren Sie
diese Importpfade nicht in neue Plugins; verwenden Sie stattdessen injizierte Runtime-Helfer und
generische Channel-SDK-Unterpfade.
</Warning>

## Unterpfadreferenz

Das Plugin-SDK wird als Satz schmaler Unterpfade bereitgestellt, gruppiert nach Bereich (Plugin-
Entry, Channel, Provider, Auth, Runtime, Capability, Memory und reservierte
Helfer für gebündelte Plugins). Den vollständigen Katalog, gruppiert und verlinkt, finden Sie unter
[Plugin-SDK-Unterpfade](/de/plugins/sdk-subpaths).

Die generierte Liste von über 200 Unterpfaden befindet sich in `scripts/lib/plugin-sdk-entrypoints.json`.

## Registrierungs-API

Der `register(api)`-Callback erhält ein `OpenClawPluginApi`-Objekt mit diesen
Methoden:

### Capability-Registrierung

| Methode                                          | Was sie registriert                    |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Textinferenz (LLM)                     |
| `api.registerAgentHarness(...)`                  | Experimenteller Low-Level-Agent-Executor |
| `api.registerCliBackend(...)`                    | Lokales CLI-Inferenz-Backend           |
| `api.registerChannel(...)`                       | Messaging-Channel                      |
| `api.registerSpeechProvider(...)`                | Text-to-Speech- / STT-Synthese         |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming-Echtzeittranskription        |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex-Echtzeit-Sprachsessions         |
| `api.registerMediaUnderstandingProvider(...)`    | Bild-/Audio-/Videoanalyse              |
| `api.registerImageGenerationProvider(...)`       | Bilderzeugung                          |
| `api.registerMusicGenerationProvider(...)`       | Musikerzeugung                         |
| `api.registerVideoGenerationProvider(...)`       | Videoerzeugung                         |
| `api.registerWebFetchProvider(...)`              | Web-Fetch-/Scrape-Provider             |
| `api.registerWebSearchProvider(...)`             | Websuche                               |

### Tools und Befehle

| Methode                         | Was sie registriert                              |
| ------------------------------- | ------------------------------------------------ |
| `api.registerTool(tool, opts?)` | Agent-Tool (erforderlich oder `{ optional: true }`) |
| `api.registerCommand(def)`      | Benutzerdefinierter Befehl (umgeht das LLM)      |

Plugin-Befehle können `agentPromptGuidance` setzen, wenn der Agent einen kurzen,
befehlseigenen Routing-Hinweis benötigt. Beschränken Sie diesen Text auf den Befehl selbst; fügen Sie keine
Provider- oder Plugin-spezifische Policy zu Core-Prompt-Buildern hinzu.

### Infrastruktur

| Methode                                        | Was sie registriert                         |
| ---------------------------------------------- | ------------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Event-Hook                                  |
| `api.registerHttpRoute(params)`                | Gateway-HTTP-Endpunkt                       |
| `api.registerGatewayMethod(name, handler)`     | Gateway-RPC-Methode                         |
| `api.registerGatewayDiscoveryService(service)` | Lokaler Gateway-Discovery-Advertiser        |
| `api.registerCli(registrar, opts?)`            | CLI-Unterbefehl                             |
| `api.registerService(service)`                 | Hintergrunddienst                           |
| `api.registerInteractiveHandler(registration)` | Interaktiver Handler                        |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime-Tool-Result-Middleware              |
| `api.registerMemoryPromptSupplement(builder)`  | Additiver promptnaher Memory-Abschnitt      |
| `api.registerMemoryCorpusSupplement(adapter)`  | Additiver Memory-Such-/Lesekorpus           |

### Host-Hooks für Workflow-Plugins

Host-Hooks sind die SDK-Seams für Plugins, die am Host-
Lifecycle teilnehmen müssen, statt nur einen Provider, Channel oder ein Tool hinzuzufügen. Sie sind
generische Verträge; der Plan-Modus kann sie verwenden, aber ebenso Genehmigungs-Workflows,
Workspace-Policy-Gates, Hintergrundmonitore, Einrichtungsassistenten und UI-Begleit-
Plugins.

| Methode                                                                  | Vertrag, den sie besitzt                                                                                                          |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Plugin-eigener, JSON-kompatibler Session-State, der über Gateway-Sessions projiziert wird                                         |
| `api.enqueueNextTurnInjection(...)`                                      | Dauerhafter genau-einmal-Kontext, der für eine Session in den nächsten Agent-Turn injiziert wird                                  |
| `api.registerTrustedToolPolicy(...)`                                     | Gebündelte/vertrauenswürdige Pre-Plugin-Tool-Policy, die Tool-Parameter blockieren oder umschreiben kann                          |
| `api.registerToolMetadata(...)`                                          | Tool-Katalog-Anzeigemetadaten ohne Änderung der Tool-Implementierung                                                              |
| `api.registerCommand(...)`                                               | Bereichsgebundene Plugin-Befehle; Befehlsergebnisse können `continueAgent: true` setzen; native Discord-Befehle unterstützen `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Control-UI-Contribution-Deskriptoren für Session-, Tool-, Run- oder Settings-Oberflächen                                          |
| `api.registerRuntimeLifecycle(...)`                                      | Cleanup-Callbacks für Plugin-eigene Runtime-Ressourcen auf Reset-/Delete-/Reload-Pfaden                                          |
| `api.registerAgentEventSubscription(...)`                                | Bereinigte Event-Abonnements für Workflow-State und Monitore                                                                      |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Pro-Run-Plugin-Scratch-State, der beim terminalen Run-Lifecycle gelöscht wird                                                     |
| `api.registerSessionSchedulerJob(...)`                                   | Plugin-eigene Session-Scheduler-Job-Records mit deterministischem Cleanup                                                        |

Die Verträge trennen die Autorität bewusst:

- Externe Plugins können Session-Erweiterungen, UI-Deskriptoren, Befehle, Tool-
  Metadaten, Next-Turn-Injections und normale Hooks besitzen.
- Vertrauenswürdige Tool-Policies laufen vor gewöhnlichen `before_tool_call`-Hooks und sind
  nur gebündelten Plugins vorbehalten, weil sie an der Host-Sicherheits-Policy teilnehmen.
- Reservierter Befehlsbesitz ist nur gebündelten Plugins vorbehalten. Externe Plugins sollten ihre
  eigenen Befehlsnamen oder Aliase verwenden.
- `allowPromptInjection=false` deaktiviert promptverändernde Hooks einschließlich
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  Prompt-Felder aus dem Legacy-`before_agent_start` und
  `enqueueNextTurnInjection`.

Beispiele für Nicht-Plan-Verbraucher:

| Plugin-Archetyp             | Verwendete Hooks                                                                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Genehmigungs-Workflow       | Session-Erweiterung, Befehlsfortsetzung, Next-Turn-Injection, UI-Deskriptor                                                        |
| Budget-/Workspace-Policy-Gate | Vertrauenswürdige Tool-Policy, Tool-Metadaten, Session-Projektion                                                                 |
| Hintergrund-Lifecycle-Monitor | Runtime-Lifecycle-Cleanup, Agent-Event-Abonnement, Besitz/Cleanup des Session-Schedulers, Heartbeat-Prompt-Beitrag, UI-Deskriptor |
| Einrichtungs- oder Onboarding-Assistent | Session-Erweiterung, bereichsgebundene Befehle, Control-UI-Deskriptor                                                   |

<Note>
  Reservierte Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) bleiben immer `operator.admin`, selbst wenn ein Plugin versucht, einen
  schmaleren Gateway-Method-Scope zuzuweisen. Bevorzugen Sie Plugin-spezifische Präfixe für
  Plugin-eigene Methoden.
</Note>

<Accordion title="When to use tool-result middleware">
  Gebündelte Plugins können `api.registerAgentToolResultMiddleware(...)` verwenden, wenn
  sie ein Tool-Ergebnis nach der Ausführung und bevor die Runtime
  dieses Ergebnis zurück in das Modell einspeist, umschreiben müssen. Dies ist der vertrauenswürdige, runtime-neutrale
  Seam für asynchrone Output-Reducer wie tokenjuice.

Gebündelte Plugins müssen `contracts.agentToolResultMiddleware` für jede
zielgerichtete Runtime deklarieren, zum Beispiel `["pi", "codex"]`. Externe Plugins
können diese Middleware nicht registrieren; verwenden Sie normale OpenClaw-Plugin-Hooks für Arbeit,
die kein Pre-Model-Tool-Result-Timing benötigt. Der alte, nur für Pi geltende eingebettete
Registrierungspfad der Erweiterungs-Factory wurde entfernt.
</Accordion>

### Gateway-Discovery-Registrierung

`api.registerGatewayDiscoveryService(...)` ermöglicht es einem Plugin, den aktiven
Gateway über einen lokalen Discovery-Transport wie mDNS/Bonjour bekanntzugeben. OpenClaw ruft den
Dienst beim Start des Gateway auf, wenn lokale Discovery aktiviert ist, übergibt die
aktuellen Gateway-Ports und nicht geheime TXT-Hinweisdaten und ruft beim Herunterfahren des Gateway den zurückgegebenen
`stop`-Handler auf.

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

Gateway-Discovery-Plugins dürfen beworbene TXT-Werte nicht als Geheimnisse oder
Authentifizierung behandeln. Discovery ist ein Routing-Hinweis; Gateway-Authentifizierung und TLS-Pinning
bleiben für Vertrauen zuständig.

### CLI-Registrierungsmetadaten

`api.registerCli(registrar, opts?)` akzeptiert zwei Arten von Metadaten auf oberster Ebene:

- `commands`: explizite Befehlswurzeln, die dem Registrar gehören
- `descriptors`: Befehlsdeskriptoren zur Parse-Zeit, die für Root-CLI-Hilfe,
  Routing und verzögerte Plugin-CLI-Registrierung verwendet werden

Wenn ein Plugin-Befehl im normalen Root-CLI-Pfad verzögert geladen bleiben soll,
stellen Sie `descriptors` bereit, die jede von diesem Registrar offengelegte
Befehlswurzel auf oberster Ebene abdecken.

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

Verwenden Sie `commands` allein nur, wenn Sie keine verzögerte Root-CLI-Registrierung benötigen.
Dieser eifrige Kompatibilitätspfad wird weiterhin unterstützt, installiert aber keine
deskriptorbasierten Platzhalter für verzögertes Laden zur Parse-Zeit.

### CLI-Backend-Registrierung

`api.registerCliBackend(...)` ermöglicht es einem Plugin, die Standardkonfiguration für ein lokales
KI-CLI-Backend wie `codex-cli` zu besitzen.

- Die Backend-`id` wird zum Provider-Präfix in Modellreferenzen wie `codex-cli/gpt-5`.
- Die Backend-`config` verwendet dieselbe Form wie `agents.defaults.cliBackends.<id>`.
- Die Benutzerkonfiguration hat weiterhin Vorrang. OpenClaw führt `agents.defaults.cliBackends.<id>` über der
  Plugin-Standardkonfiguration zusammen, bevor die CLI ausgeführt wird.
- Verwenden Sie `normalizeConfig`, wenn ein Backend nach dem Zusammenführen Kompatibilitätsumschreibungen benötigt
  (zum Beispiel die Normalisierung alter Flag-Formen).

### Exklusive Slots

| Methode                                    | Was sie registriert                                                                                                                                             |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Kontext-Engine (jeweils eine aktiv). Der `assemble()`-Callback erhält `availableTools` und `citationsMode`, damit die Engine Prompt-Ergänzungen anpassen kann. |
| `api.registerMemoryCapability(capability)` | Einheitliche Speicherfähigkeit                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Builder für Speicher-Prompt-Abschnitte                                                                                                                         |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver für Speicher-Flush-Pläne                                                                                                                              |
| `api.registerMemoryRuntime(runtime)`       | Speicher-Runtime-Adapter                                                                                                                                        |

### Speicher-Embedding-Adapter

| Methode                                        | Was sie registriert                              |
| ---------------------------------------------- | ------------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Speicher-Embedding-Adapter für das aktive Plugin |

- `registerMemoryCapability` ist die bevorzugte exklusive Speicher-Plugin-API.
- `registerMemoryCapability` kann auch `publicArtifacts.listArtifacts(...)`
  offenlegen, damit Begleit-Plugins exportierte Speicherartefakte über
  `openclaw/plugin-sdk/memory-host-core` konsumieren können, statt in das private Layout eines bestimmten
  Speicher-Plugins zu greifen.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` und
  `registerMemoryRuntime` sind legacy-kompatible exklusive Speicher-Plugin-APIs.
- `MemoryFlushPlan.model` kann den Flush-Turn an eine exakte `provider/model`-Referenz
  wie `ollama/qwen3:8b` binden, ohne die aktive Fallback-Kette zu erben.
- `registerMemoryEmbeddingProvider` ermöglicht es dem aktiven Speicher-Plugin, eine
  oder mehrere Embedding-Adapter-IDs zu registrieren (zum Beispiel `openai`, `gemini` oder eine benutzerdefinierte
  vom Plugin definierte ID).
- Benutzerkonfigurationen wie `agents.defaults.memorySearch.provider` und
  `agents.defaults.memorySearch.fallback` werden gegen diese registrierten
  Adapter-IDs aufgelöst.

### Ereignisse und Lebenszyklus

| Methode                                      | Was sie bewirkt                  |
| -------------------------------------------- | -------------------------------- |
| `api.on(hookName, handler, opts?)`           | Typisierter Lebenszyklus-Hook    |
| `api.onConversationBindingResolved(handler)` | Conversation-Binding-Callback    |

Siehe [Plugin-Hooks](/de/plugins/hooks) für Beispiele, gängige Hook-Namen und Guard-Semantik.

### Hook-Entscheidungssemantik

- `before_tool_call`: Die Rückgabe von `{ block: true }` ist terminal. Sobald ein Handler sie setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_tool_call`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (genauso wie das Weglassen von `block`), nicht als Override.
- `before_install`: Die Rückgabe von `{ block: true }` ist terminal. Sobald ein Handler sie setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_install`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (genauso wie das Weglassen von `block`), nicht als Override.
- `reply_dispatch`: Die Rückgabe von `{ handled: true, ... }` ist terminal. Sobald ein Handler den Dispatch beansprucht, werden Handler mit niedrigerer Priorität und der standardmäßige Modell-Dispatch-Pfad übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: true }` ist terminal. Sobald ein Handler sie setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: false }` wird als keine Entscheidung behandelt (genauso wie das Weglassen von `cancel`), nicht als Override.
- `message_received`: Verwenden Sie das typisierte Feld `threadId`, wenn Sie eingehendes Thread-/Themen-Routing benötigen. Behalten Sie `metadata` für kanalspezifische Extras bei.
- `message_sending`: Verwenden Sie die typisierten Routing-Felder `replyToId` / `threadId`, bevor Sie auf kanalspezifische `metadata` zurückfallen.
- `gateway_start`: Verwenden Sie `ctx.config`, `ctx.workspaceDir` und `ctx.getCron?.()` für den Gateway-eigenen Startzustand, statt sich auf interne `gateway:startup`-Hooks zu verlassen.
- `cron_changed`: Beobachten Sie Gateway-eigene Änderungen am Cron-Lebenszyklus. Verwenden Sie `event.job?.state?.nextRunAtMs` und `ctx.getCron?.()`, wenn Sie externe Wake-Scheduler synchronisieren, und behalten Sie OpenClaw als Quelle der Wahrheit für Fälligkeitsprüfungen und Ausführung bei.

### API-Objektfelder

| Feld                     | Typ                       | Beschreibung                                                                                         |
| ------------------------ | ------------------------- | ---------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-ID                                                                                            |
| `api.name`               | `string`                  | Anzeigename                                                                                          |
| `api.version`            | `string?`                 | Plugin-Version (optional)                                                                            |
| `api.description`        | `string?`                 | Plugin-Beschreibung (optional)                                                                       |
| `api.source`             | `string`                  | Plugin-Quellpfad                                                                                     |
| `api.rootDir`            | `string?`                 | Plugin-Stammverzeichnis (optional)                                                                   |
| `api.config`             | `OpenClawConfig`          | Aktueller Konfigurations-Snapshot (aktiver In-Memory-Runtime-Snapshot, wenn verfügbar)               |
| `api.pluginConfig`       | `Record<string, unknown>` | Plugin-spezifische Konfiguration aus `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Runtime-Helfer](/de/plugins/sdk-runtime)                                                               |
| `api.logger`             | `PluginLogger`            | Bereichsbezogener Logger (`debug`, `info`, `warn`, `error`)                                          |
| `api.registrationMode`   | `PluginRegistrationMode`  | Aktueller Lademodus; `"setup-runtime"` ist das leichtgewichtige Start-/Setup-Fenster vor dem vollständigen Eintrag |
| `api.resolvePath(input)` | `(string) => string`      | Pfad relativ zum Plugin-Stamm auflösen                                                               |

## Interne Modulkonvention

Verwenden Sie innerhalb Ihres Plugins lokale Barrel-Dateien für interne Importe:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Importieren Sie Ihr eigenes Plugin niemals über `openclaw/plugin-sdk/<your-plugin>`
  aus Produktionscode. Leiten Sie interne Importe über `./api.ts` oder
  `./runtime-api.ts`. Der SDK-Pfad ist ausschließlich der externe Vertrag.
</Warning>

Öffentliche Oberflächen gebündelter Plugins, die über Facades geladen werden (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` und ähnliche öffentliche Einstiegdateien), bevorzugen den
aktiven Runtime-Konfigurations-Snapshot, wenn OpenClaw bereits ausgeführt wird. Wenn noch kein Runtime-
Snapshot existiert, fallen sie auf die aufgelöste Konfigurationsdatei auf dem Datenträger zurück.
Paketierte gebündelte Plugin-Facades sollten über die Plugin-
Facade-Loader von OpenClaw geladen werden; direkte Importe aus `dist/extensions/...` umgehen die Manifest-
und Runtime-Sidecar-Prüfungen, die paketierte Installationen für Plugin-eigenen Code verwenden.

Provider-Plugins können ein schmales Plugin-lokales Contract-Barrel offenlegen, wenn ein
Helfer absichtlich Provider-spezifisch ist und noch nicht in einen generischen SDK-
Unterpfad gehört. Gebündelte Beispiele:

- **Anthropic**: öffentliche `api.ts`- / `contract-api.ts`-Schnittstelle für Claude-
  Beta-Header- und `service_tier`-Stream-Helfer.
- **`@openclaw/openai-provider`**: `api.ts` exportiert Provider-Builder,
  Standardmodell-Helfer und Realtime-Provider-Builder.
- **`@openclaw/openrouter-provider`**: `api.ts` exportiert den Provider-Builder
  plus Onboarding-/Konfigurationshelfer.

<Warning>
  Produktionscode von Erweiterungen sollte auch Importe von `openclaw/plugin-sdk/<other-plugin>`
  vermeiden. Wenn ein Helfer wirklich geteilt wird, heben Sie ihn in einen neutralen SDK-Unterpfad
  wie `openclaw/plugin-sdk/speech`, `.../provider-model-shared` oder eine andere
  fähigkeitsorientierte Oberfläche, statt zwei Plugins miteinander zu koppeln.
</Warning>

## Verwandt

<CardGroup cols={2}>
  <Card title="Einstiegspunkte" icon="door-open" href="/de/plugins/sdk-entrypoints">
    Optionen für `definePluginEntry` und `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime-Hilfsfunktionen" icon="gears" href="/de/plugins/sdk-runtime">
    Vollständige Referenz des Namespace `api.runtime`.
  </Card>
  <Card title="Einrichtung und Konfiguration" icon="sliders" href="/de/plugins/sdk-setup">
    Paketierung, Manifeste und Konfigurationsschemas.
  </Card>
  <Card title="Testen" icon="vial" href="/de/plugins/sdk-testing">
    Test-Hilfsprogramme und Lint-Regeln.
  </Card>
  <Card title="SDK-Migration" icon="arrows-turn-right" href="/de/plugins/sdk-migration">
    Migration von veralteten Oberflächen.
  </Card>
  <Card title="Plugin-Interna" icon="diagram-project" href="/de/plugins/architecture">
    Detaillierte Architektur und Fähigkeitsmodell.
  </Card>
</CardGroup>
