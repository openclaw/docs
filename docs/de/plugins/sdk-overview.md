---
read_when:
    - Sie müssen wissen, aus welchem SDK-Unterpfad Sie importieren sollen
    - Sie möchten eine Referenz für alle Registrierungsmethoden von OpenClawPluginApi
    - Sie suchen einen bestimmten SDK-Export
sidebarTitle: Plugin SDK overview
summary: Import Map, Referenz zur Registrierungs-API und SDK-Architektur
title: Überblick über das Plugin SDK
x-i18n:
    generated_at: "2026-05-07T13:23:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce2d4480368a11f559da7c5116d51c0cd603dd38985ca744723ecdf134fa21f3
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Das Plugin-SDK ist die typisierte Schnittstelle zwischen Plugins und Core. Diese Seite ist die
Referenz dafür, **was Sie importieren sollen** und **was Sie registrieren können**.

<Note>
  Diese Seite richtet sich an Plugin-Autoren, die `openclaw/plugin-sdk/*` innerhalb von
  OpenClaw verwenden. Für externe Apps, Skripte, Dashboards, CI-Jobs und IDE-Erweiterungen,
  die Agenten über den Gateway ausführen möchten, verwenden Sie stattdessen das
  [OpenClaw App-SDK](/de/concepts/openclaw-sdk) und das Paket `@openclaw/sdk`.
</Note>

<Tip>
Suchen Sie stattdessen eine Anleitung? Beginnen Sie mit [Plugins erstellen](/de/plugins/building-plugins), verwenden Sie [Channel-Plugins](/de/plugins/sdk-channel-plugins) für Channel-Plugins, [Provider-Plugins](/de/plugins/sdk-provider-plugins) für Provider-Plugins, [CLI-Backend-Plugins](/de/plugins/cli-backend-plugins) für lokale KI-CLI-Backends und [Plugin-Hooks](/de/plugins/hooks) für Tool- oder Lifecycle-Hook-Plugins.
</Tip>

## Importkonvention

Importieren Sie immer aus einem spezifischen Unterpfad:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Jeder Unterpfad ist ein kleines, eigenständiges Modul. Das hält den Start schnell und
verhindert Probleme mit zirkulären Abhängigkeiten. Für channelspezifische Entry-/Build-Helfer
bevorzugen Sie `openclaw/plugin-sdk/channel-core`; verwenden Sie `openclaw/plugin-sdk/core` für
die breitere Dachoberfläche und gemeinsame Helfer wie
`buildChannelConfigSchema`.

Für Channel-Konfiguration veröffentlichen Sie das vom Channel verwaltete JSON-Schema über
`openclaw.plugin.json#channelConfigs`. Der Unterpfad `plugin-sdk/channel-config-schema`
ist für gemeinsame Schema-Primitiven und den generischen Builder vorgesehen. Die
gebündelten Plugins von OpenClaw verwenden `plugin-sdk/bundled-channel-config-schema` für beibehaltene
Schemas gebündelter Channels. Veraltete Kompatibilitätsexporte bleiben unter
`plugin-sdk/channel-config-schema-legacy`; keiner der gebündelten Schema-Unterpfade ist ein
Muster für neue Plugins.

<Warning>
  Importieren Sie keine provider- oder channel-spezifisch benannten Convenience-Schnittstellen (zum Beispiel
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Gebündelte Plugins kombinieren generische SDK-Unterpfade innerhalb ihrer eigenen `api.ts`- /
  `runtime-api.ts`-Barrels; Core-Consumer sollten entweder diese pluginlokalen
  Barrels verwenden oder einen eng gefassten generischen SDK-Vertrag hinzufügen, wenn ein Bedarf wirklich
  channelübergreifend ist.

Eine kleine Gruppe von Hilfsschnittstellen für gebündelte Plugins erscheint weiterhin in der generierten Export-Map,
wenn sie nachverfolgte Owner-Nutzung haben. Sie existieren nur für die Wartung gebündelter Plugins
und sind keine empfohlenen Importpfade für neue Drittanbieter-Plugins.

`openclaw/plugin-sdk/discord` und `openclaw/plugin-sdk/telegram-account` werden
ebenfalls als veraltete Kompatibilitäts-Fassaden für nachverfolgte Owner-Nutzung beibehalten. Kopieren Sie
diese Importpfade nicht in neue Plugins; verwenden Sie stattdessen injizierte Runtime-Helfer und
generische Channel-SDK-Unterpfade.
</Warning>

## Unterpfad-Referenz

Das Plugin-SDK wird als Satz enger Unterpfade bereitgestellt, gruppiert nach Bereich (Plugin-
Entry, Channel, Provider, Auth, Runtime, Capability, Memory und reservierte
Helfer für gebündelte Plugins). Den vollständigen Katalog, gruppiert und verlinkt, finden Sie unter
[Plugin-SDK-Unterpfade](/de/plugins/sdk-subpaths).

Die generierte Liste von über 200 Unterpfaden befindet sich in `scripts/lib/plugin-sdk-entrypoints.json`.

## Registrierungs-API

Der Callback `register(api)` erhält ein Objekt `OpenClawPluginApi` mit diesen
Methoden:

### Capability-Registrierung

| Methode                                          | Was registriert wird                         |
| ------------------------------------------------ | -------------------------------------------- |
| `api.registerProvider(...)`                      | Textinferenz (LLM)                           |
| `api.registerAgentHarness(...)`                  | Experimenteller Low-Level-Agent-Executor     |
| `api.registerCliBackend(...)`                    | Lokales CLI-Inferenz-Backend                 |
| `api.registerChannel(...)`                       | Messaging-Kanal                              |
| `api.registerSpeechProvider(...)`                | Text-to-Speech-/STT-Synthese                 |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming-Echtzeittranskription              |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex-Echtzeit-Sprachsitzungen              |
| `api.registerMediaUnderstandingProvider(...)`    | Bild-/Audio-/Videoanalyse                    |
| `api.registerImageGenerationProvider(...)`       | Bilderzeugung                                |
| `api.registerMusicGenerationProvider(...)`       | Musikerzeugung                               |
| `api.registerVideoGenerationProvider(...)`       | Videoerzeugung                               |
| `api.registerWebFetchProvider(...)`              | Web-Abruf-/Scrape-Provider                   |
| `api.registerWebSearchProvider(...)`             | Websuche                                     |

### Tools und Befehle

| Methode                         | Was registriert wird                              |
| ------------------------------- | ------------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent-Tool (erforderlich oder `{ optional: true }`) |
| `api.registerCommand(def)`      | Benutzerdefinierter Befehl (umgeht das LLM)       |

Plugin-Befehle können `agentPromptGuidance` setzen, wenn der Agent einen kurzen,
befehlseigenen Routing-Hinweis benötigt. Beschränken Sie diesen Text auf den
Befehl selbst; fügen Sie den zentralen Prompt-Buildern keine Provider- oder
Plugin-spezifischen Richtlinien hinzu.

### Infrastruktur

| Methode                                        | Was registriert wird                                |
| ---------------------------------------------- | --------------------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Ereignis-Hook                                       |
| `api.registerHttpRoute(params)`                | Gateway-HTTP-Endpunkt                               |
| `api.registerGatewayMethod(name, handler)`     | Gateway-RPC-Methode                                 |
| `api.registerGatewayDiscoveryService(service)` | Lokaler Gateway-Discovery-Advertiser                |
| `api.registerCli(registrar, opts?)`            | CLI-Unterbefehl                                     |
| `api.registerNodeCliFeature(registrar, opts?)` | Node-Funktions-CLI unter `openclaw nodes`           |
| `api.registerService(service)`                 | Hintergrunddienst                                   |
| `api.registerInteractiveHandler(registration)` | Interaktiver Handler                                |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime-Middleware für Tool-Ergebnisse              |
| `api.registerMemoryPromptSupplement(builder)`  | Additiver speichernaher Prompt-Abschnitt            |
| `api.registerMemoryCorpusSupplement(adapter)`  | Additiver Speicher-Such-/Lesekorpus                 |

### Host-Hooks für Workflow-Plugins

Host-Hooks sind die SDK-Schnittstellen für Plugins, die am Host-Lebenszyklus
teilnehmen müssen, statt nur einen Provider, Kanal oder ein Tool hinzuzufügen.
Sie sind generische Verträge; der Planmodus kann sie nutzen, ebenso aber auch
Genehmigungs-Workflows, Workspace-Richtlinien-Gates, Hintergrundmonitore,
Einrichtungsassistenten und begleitende UI-Plugins.

| Methode                                                                  | Zuständiger Vertrag                                                                                                                    |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Plugin-eigener, JSON-kompatibler Sitzungszustand, der über Gateway-Sitzungen projiziert wird                                           |
| `api.enqueueNextTurnInjection(...)`                                      | Dauerhafter, exakt einmal in die nächste Agent-Runde für eine Sitzung injizierter Kontext                                              |
| `api.registerTrustedToolPolicy(...)`                                     | Gebündelte/vertrauenswürdige Pre-Plugin-Tool-Richtlinie, die Tool-Parameter blockieren oder umschreiben kann                           |
| `api.registerToolMetadata(...)`                                          | Anzeigemetadaten für den Tool-Katalog, ohne die Tool-Implementierung zu ändern                                                         |
| `api.registerCommand(...)`                                               | Bereichsgebundene Plugin-Befehle; Befehlsergebnisse können `continueAgent: true` setzen; native Discord-Befehle unterstützen `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Control-UI-Beitragsdeskriptoren für Sitzungs-, Tool-, Lauf- oder Einstellungsoberflächen                                               |
| `api.registerRuntimeLifecycle(...)`                                      | Bereinigungs-Callbacks für Plugin-eigene Runtime-Ressourcen bei Zurücksetzungs-, Lösch- oder Neuladepfaden                             |
| `api.registerAgentEventSubscription(...)`                                | Bereinigte Ereignisabonnements für Workflow-Zustand und Monitore                                                                       |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Pro-Lauf-Plugin-Scratch-Zustand, der beim terminalen Lauf-Lebenszyklus gelöscht wird                                                   |
| `api.registerSessionSchedulerJob(...)`                                   | Plugin-eigene Sitzungs-Scheduler-Job-Datensätze mit deterministischer Bereinigung                                                      |

Die Verträge trennen Berechtigungen bewusst:

- Externe Plugins können Sitzungserweiterungen, UI-Deskriptoren, Befehle,
  Tool-Metadaten, Next-Turn-Injections und normale Hooks besitzen.
- Vertrauenswürdige Tool-Richtlinien laufen vor gewöhnlichen `before_tool_call`-Hooks und sind
  nur gebündelten Plugins vorbehalten, weil sie an der Host-Sicherheitsrichtlinie beteiligt sind.
- Reservierte Befehlseigentümerschaft ist nur gebündelten Plugins vorbehalten. Externe Plugins sollten ihre
  eigenen Befehlsnamen oder Aliase verwenden.
- `allowPromptInjection=false` deaktiviert Prompt-mutierende Hooks einschließlich
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  Prompt-Felder aus dem alten `before_agent_start` und
  `enqueueNextTurnInjection`.

Beispiele für Nicht-Plan-Verbraucher:

| Plugin-Archetyp             | Verwendete Hooks                                                                                                                       |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Genehmigungs-Workflow       | Sitzungserweiterung, Befehlsfortsetzung, Next-Turn-Injection, UI-Deskriptor                                                            |
| Budget-/Workspace-Richtlinien-Gate | Vertrauenswürdige Tool-Richtlinie, Tool-Metadaten, Sitzungsprojektion                                                          |
| Hintergrund-Lebenszyklusmonitor | Runtime-Lebenszyklusbereinigung, Agent-Ereignisabonnement, Sitzungs-Scheduler-Eigentümerschaft/-Bereinigung, Heartbeat-Prompt-Beitrag, UI-Deskriptor |
| Einrichtungs- oder Onboarding-Assistent | Sitzungserweiterung, bereichsgebundene Befehle, Control-UI-Deskriptor                                                      |

<Note>
  Reservierte zentrale Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) bleiben immer `operator.admin`, selbst wenn ein Plugin versucht,
  einen engeren Gateway-Methodenbereich zuzuweisen. Bevorzugen Sie Plugin-spezifische Präfixe für
  Plugin-eigene Methoden.
</Note>

<Accordion title="Wann Tool-Ergebnis-Middleware verwendet werden sollte">
  Gebündelte Plugins können `api.registerAgentToolResultMiddleware(...)` verwenden, wenn
  sie ein Tool-Ergebnis nach der Ausführung und bevor die Runtime
  dieses Ergebnis zurück in das Modell speist, umschreiben müssen. Dies ist die vertrauenswürdige, runtime-neutrale
  Schnittstelle für asynchrone Ausgabereduzierer wie tokenjuice.

Gebündelte Plugins müssen `contracts.agentToolResultMiddleware` für jede
zielgerichtete Runtime deklarieren, zum Beispiel `["pi", "codex"]`. Externe Plugins
können diese Middleware nicht registrieren; behalten Sie normale OpenClaw-Plugin-Hooks für Arbeiten bei,
die kein Tool-Ergebnis-Timing vor dem Modell benötigen. Der alte, nur für Pi bestimmte eingebettete
Registrierungspfad der Extension-Factory wurde entfernt.
</Accordion>

### Gateway-Discovery-Registrierung

`api.registerGatewayDiscoveryService(...)` ermöglicht einem Plugin, das aktive
Gateway über einen lokalen Discovery-Transport wie mDNS/Bonjour anzukündigen. OpenClaw ruft den
Dienst während des Gateway-Starts auf, wenn lokale Discovery aktiviert ist, übergibt die
aktuellen Gateway-Ports und nicht geheimen TXT-Hinweisdaten und ruft den zurückgegebenen
`stop`-Handler während des Gateway-Herunterfahrens auf.

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

Gateway-Discovery-Plugins dürfen angekündigte TXT-Werte nicht als Secrets oder
Authentifizierung behandeln. Discovery ist ein Routing-Hinweis; Gateway-Authentifizierung und TLS-Pinning
besitzen weiterhin das Vertrauen.

### CLI-Registrierungsmetadaten

`api.registerCli(registrar, opts?)` akzeptiert zwei Arten von Befehlsmetadaten:

- `commands`: explizite Befehlsnamen, die dem Registrar gehören
- `descriptors`: Parse-Zeit-Befehlsdeskriptoren, die für CLI-Hilfe,
  Routing und Lazy-CLI-Registrierung von Plugins verwendet werden
- `parentPath`: optionaler übergeordneter Befehlspfad für verschachtelte Befehlsgruppen, wie
  `["nodes"]`

Für Funktionen gekoppelter Nodes bevorzugen Sie
`api.registerNodeCliFeature(registrar, opts?)`. Es ist ein kleiner Wrapper um
`api.registerCli(..., { parentPath: ["nodes"] })` und macht Befehle wie
`openclaw nodes canvas` zu expliziten Plugin-eigenen Node-Funktionen.

Wenn ein Plugin-Befehl im normalen Root-CLI-Pfad lazy geladen bleiben soll,
stellen Sie `descriptors` bereit, die jede Top-Level-Befehlswurzel abdecken, die dieser
Registrar offenlegt.

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

Verschachtelte Befehle erhalten den aufgelösten übergeordneten Befehl als `program`:

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerNodesCanvasCommands } = await import("./src/cli.js");
    registerNodesCanvasCommands(program);
  },
  {
    parentPath: ["nodes"],
    descriptors: [
      {
        name: "canvas",
        description: "Capture or render canvas content from a paired node",
        hasSubcommands: true,
      },
    ],
  },
);
```

Verwenden Sie `commands` allein nur, wenn Sie keine Lazy-Root-CLI-Registrierung benötigen.
Dieser eifrige Kompatibilitätspfad wird weiterhin unterstützt, installiert jedoch keine
deskriptorbasierten Platzhalter für Lazy Loading zur Parse-Zeit.

### CLI-Backend-Registrierung

`api.registerCliBackend(...)` ermöglicht einem Plugin, die Standardkonfiguration für ein lokales
KI-CLI-Backend wie `codex-cli` zu besitzen.

- Die Backend-`id` wird zum Provider-Präfix in Modellreferenzen wie `codex-cli/gpt-5`.
- Die Backend-`config` verwendet dieselbe Form wie `agents.defaults.cliBackends.<id>`.
- Benutzerkonfiguration hat weiterhin Vorrang. OpenClaw führt `agents.defaults.cliBackends.<id>` über die
  Plugin-Standardkonfiguration zusammen, bevor die CLI ausgeführt wird.
- Verwenden Sie `normalizeConfig`, wenn ein Backend nach dem Zusammenführen Kompatibilitätsumschreibungen benötigt
  (zum Beispiel die Normalisierung alter Flag-Formen).
- Verwenden Sie `resolveExecutionArgs` für anfragebezogene argv-Umschreibungen, die zum
  CLI-Dialekt gehören, etwa das Mapping von OpenClaw-Denkstufen auf ein natives Effort-Flag.

Eine End-to-End-Anleitung zum Erstellen finden Sie unter
[CLI-Backend-Plugins](/de/plugins/cli-backend-plugins).

### Exklusive Slots

| Methode                                    | Was sie registriert                                                                                                                                             |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Kontext-Engine (jeweils eine aktiv). Der `assemble()`-Callback erhält `availableTools` und `citationsMode`, damit die Engine Prompt-Ergänzungen anpassen kann. |
| `api.registerMemoryCapability(capability)` | Vereinheitlichte Memory-Capability                                                                                                                             |
| `api.registerMemoryPromptSection(builder)` | Builder für Memory-Prompt-Abschnitte                                                                                                                           |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver für Memory-Flush-Pläne                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | Memory-Runtime-Adapter                                                                                                                                          |

### Memory-Embedding-Adapter

| Methode                                        | Was sie registriert                              |
| ---------------------------------------------- | ------------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Memory-Embedding-Adapter für das aktive Plugin   |

- `registerMemoryCapability` ist die bevorzugte exklusive Memory-Plugin-API.
- `registerMemoryCapability` kann außerdem `publicArtifacts.listArtifacts(...)`
  offenlegen, damit Companion-Plugins exportierte Memory-Artefakte über
  `openclaw/plugin-sdk/memory-host-core` nutzen können, anstatt auf das private Layout eines bestimmten
  Memory-Plugins zuzugreifen.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` und
  `registerMemoryRuntime` sind abwärtskompatible exklusive Memory-Plugin-APIs.
- `MemoryFlushPlan.model` kann den Flush-Turn auf eine exakte `provider/model`-
  Referenz wie `ollama/qwen3:8b` festlegen, ohne die aktive Fallback-
  Kette zu erben.
- `registerMemoryEmbeddingProvider` ermöglicht dem aktiven Memory-Plugin, eine
  oder mehrere Embedding-Adapter-IDs zu registrieren (zum Beispiel `openai`, `gemini` oder eine benutzerdefinierte,
  vom Plugin definierte ID).
- Benutzerkonfiguration wie `agents.defaults.memorySearch.provider` und
  `agents.defaults.memorySearch.fallback` wird gegen diese registrierten
  Adapter-IDs aufgelöst.

### Ereignisse und Lebenszyklus

| Methode                                      | Was sie tut                    |
| -------------------------------------------- | ------------------------------ |
| `api.on(hookName, handler, opts?)`           | Typisierter Lifecycle-Hook     |
| `api.onConversationBindingResolved(handler)` | Callback für Konversationsbindung |

Siehe [Plugin-Hooks](/de/plugins/hooks) für Beispiele, gängige Hook-Namen und Guard-
Semantik.

### Semantik von Hook-Entscheidungen

- `before_tool_call`: Die Rückgabe von `{ block: true }` ist terminal. Sobald ein Handler sie setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_tool_call`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (identisch mit dem Weglassen von `block`), nicht als Override.
- `before_install`: Die Rückgabe von `{ block: true }` ist terminal. Sobald ein Handler sie setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_install`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (identisch mit dem Weglassen von `block`), nicht als Override.
- `reply_dispatch`: Die Rückgabe von `{ handled: true, ... }` ist terminal. Sobald ein Handler den Versand beansprucht, werden Handler mit niedrigerer Priorität und der Standardpfad für den Modellversand übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: true }` ist terminal. Sobald ein Handler sie setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: false }` wird als keine Entscheidung behandelt (identisch mit dem Weglassen von `cancel`), nicht als Override.
- `message_received`: Verwenden Sie das typisierte Feld `threadId`, wenn Sie Routing für eingehende Threads/Themen benötigen. Behalten Sie `metadata` für kanalspezifische Extras bei.
- `message_sending`: Verwenden Sie typisierte Routing-Felder `replyToId` / `threadId`, bevor Sie auf kanalspezifische `metadata` zurückfallen.
- `gateway_start`: Verwenden Sie `ctx.config`, `ctx.workspaceDir` und `ctx.getCron?.()` für Gateway-eigenen Startzustand, anstatt sich auf interne `gateway:startup`-Hooks zu verlassen.
- `cron_changed`: Beobachten Sie Gateway-eigene Änderungen am Cron-Lebenszyklus. Verwenden Sie `event.job?.state?.nextRunAtMs` und `ctx.getCron?.()` beim Synchronisieren externer Wake-Scheduler, und behalten Sie OpenClaw als Source of Truth für Fälligkeitsprüfungen und Ausführung bei.

### Felder des API-Objekts

| Feld                     | Typ                       | Beschreibung                                                                                 |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-ID                                                                                    |
| `api.name`               | `string`                  | Anzeigename                                                                                  |
| `api.version`            | `string?`                 | Plugin-Version (optional)                                                                    |
| `api.description`        | `string?`                 | Plugin-Beschreibung (optional)                                                              |
| `api.source`             | `string`                  | Plugin-Quellpfad                                                                             |
| `api.rootDir`            | `string?`                 | Plugin-Stammverzeichnis (optional)                                                          |
| `api.config`             | `OpenClawConfig`          | Aktueller Konfigurations-Snapshot (aktiver speicherinterner Runtime-Snapshot, wenn verfügbar) |
| `api.pluginConfig`       | `Record<string, unknown>` | Plugin-spezifische Konfiguration aus `plugins.entries.<id>.config`                           |
| `api.runtime`            | `PluginRuntime`           | [Runtime-Helfer](/de/plugins/sdk-runtime)                                                       |
| `api.logger`             | `PluginLogger`            | Bereichsbezogener Logger (`debug`, `info`, `warn`, `error`)                                  |
| `api.registrationMode`   | `PluginRegistrationMode`  | Aktueller Lademodus; `"setup-runtime"` ist das schlanke Start-/Setup-Fenster vor dem vollständigen Entry |
| `api.resolvePath(input)` | `(string) => string`      | Pfad relativ zum Plugin-Stamm auflösen                                                       |

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
  Importieren Sie Ihr eigenes Plugin niemals aus Produktionscode über `openclaw/plugin-sdk/<your-plugin>`.
  Leiten Sie interne Importe über `./api.ts` oder
  `./runtime-api.ts`. Der SDK-Pfad ist ausschließlich der externe Vertrag.
</Warning>

Über Facades geladene öffentliche Oberflächen gebündelter Plugins (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` und ähnliche öffentliche Entry-Dateien) bevorzugen den
aktiven Runtime-Konfigurations-Snapshot, wenn OpenClaw bereits läuft. Wenn noch kein Runtime-
Snapshot existiert, fallen sie auf die aufgelöste Konfigurationsdatei auf dem Datenträger zurück.
Paketierte gebündelte Plugin-Facades sollten über die Plugin-
Facade-Loader von OpenClaw geladen werden; direkte Importe aus `dist/extensions/...` umgehen das Manifest
und die Runtime-Sidecar-Prüfungen, die paketierte Installationen für Plugin-eigenen Code verwenden.

Provider-Plugins können ein schmales Plugin-lokales Contract-Barrel bereitstellen, wenn ein
Helper bewusst Provider-spezifisch ist und noch nicht in einen generischen SDK-
Unterpfad gehört. Gebündelte Beispiele:

- **Anthropic**: öffentliche `api.ts`- / `contract-api.ts`-Schnittstelle für Claude-
  Beta-Header- und `service_tier`-Stream-Helper.
- **`@openclaw/openai-provider`**: `api.ts` exportiert Provider-Builder,
  Standardmodell-Helper und Realtime-Provider-Builder.
- **`@openclaw/openrouter-provider`**: `api.ts` exportiert den Provider-Builder
  sowie Onboarding-/Konfigurations-Helper.

<Warning>
  Produktionscode von Erweiterungen sollte auch Importe aus `openclaw/plugin-sdk/<other-plugin>`
  vermeiden. Wenn ein Helper wirklich gemeinsam genutzt wird, verschieben Sie ihn in einen neutralen SDK-Unterpfad
  wie `openclaw/plugin-sdk/speech`, `.../provider-model-shared` oder eine andere
  fähigkeitsorientierte Oberfläche, statt zwei Plugins miteinander zu koppeln.
</Warning>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/de/plugins/sdk-entrypoints">
    Optionen für `definePluginEntry` und `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/de/plugins/sdk-runtime">
    Vollständige Referenz des `api.runtime`-Namespaces.
  </Card>
  <Card title="Setup and config" icon="sliders" href="/de/plugins/sdk-setup">
    Paketierung, Manifeste und Konfigurationsschemas.
  </Card>
  <Card title="Testing" icon="vial" href="/de/plugins/sdk-testing">
    Test-Hilfsprogramme und Lint-Regeln.
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/de/plugins/sdk-migration">
    Migration von veralteten Oberflächen.
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/de/plugins/architecture">
    Tiefe Architektur und Capability-Modell.
  </Card>
</CardGroup>
