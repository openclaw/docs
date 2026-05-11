---
read_when:
    - Sie müssen wissen, aus welchem SDK-Unterpfad Sie importieren sollen
    - Sie möchten eine Referenz für alle Registrierungsmethoden von OpenClawPluginApi
    - Sie suchen nach einem bestimmten SDK-Export
sidebarTitle: Plugin SDK overview
summary: Import-Map, Referenz zur Registrierungs-API und SDK-Architektur
title: Plugin-SDK-Übersicht
x-i18n:
    generated_at: "2026-05-11T20:34:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 633fcffa4256c84c40e8c61e692521583370a368d3058b44d10922279a096b06
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Das Plugin-SDK ist der typisierte Vertrag zwischen Plugins und Core. Diese Seite ist die
Referenz dafür, **was Sie importieren** und **was Sie registrieren können**.

<Note>
  Diese Seite richtet sich an Plugin-Autoren, die `openclaw/plugin-sdk/*` innerhalb
  von OpenClaw verwenden. Für externe Apps, Skripte, Dashboards, CI-Jobs und IDE-Erweiterungen,
  die Agenten über den Gateway ausführen möchten, verwenden Sie stattdessen das
  [OpenClaw App SDK](/de/concepts/openclaw-sdk) und das Paket `@openclaw/sdk`.
</Note>

<Tip>
Suchen Sie stattdessen eine praktische Anleitung? Beginnen Sie mit [Plugins erstellen](/de/plugins/building-plugins), verwenden Sie [Channel-Plugins](/de/plugins/sdk-channel-plugins) für Channel-Plugins, [Provider-Plugins](/de/plugins/sdk-provider-plugins) für Provider-Plugins, [CLI-Backend-Plugins](/de/plugins/cli-backend-plugins) für lokale KI-CLI-Backends und [Plugin-Hooks](/de/plugins/hooks) für Tool- oder Lifecycle-Hook-Plugins.
</Tip>

## Importkonvention

Importieren Sie immer aus einem bestimmten Unterpfad:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Jeder Unterpfad ist ein kleines, eigenständiges Modul. Das hält den Start schnell und
verhindert Probleme mit zirkulären Abhängigkeiten. Für channelspezifische Entry-/Build-Helfer
bevorzugen Sie `openclaw/plugin-sdk/channel-core`; behalten Sie `openclaw/plugin-sdk/core` für
die breitere Sammeloberfläche und gemeinsame Helfer wie
`buildChannelConfigSchema`.

Für die Channel-Konfiguration veröffentlichen Sie das vom Channel verwaltete JSON Schema über
`openclaw.plugin.json#channelConfigs`. Der Unterpfad `plugin-sdk/channel-config-schema`
ist für gemeinsame Schema-Primitiven und den generischen Builder vorgesehen. Die
gebündelten Plugins von OpenClaw verwenden `plugin-sdk/bundled-channel-config-schema` für beibehaltene
Schemas gebündelter Channels. Veraltete Kompatibilitätsexporte bleiben unter
`plugin-sdk/channel-config-schema-legacy`; keiner der beiden gebündelten Schema-Unterpfade ist ein
Muster für neue Plugins.

<Warning>
  Importieren Sie keine provider- oder channel-gebrandeten Convenience-Seams (zum Beispiel
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Gebündelte Plugins setzen generische SDK-Unterpfade innerhalb ihrer eigenen `api.ts`- /
  `runtime-api.ts`-Barrels zusammen; Core-Verbraucher sollten entweder diese pluginlokalen
  Barrels verwenden oder einen schmalen generischen SDK-Vertrag hinzufügen, wenn ein Bedarf wirklich
  channelübergreifend ist.

Eine kleine Gruppe von Helfer-Seams für gebündelte Plugins erscheint weiterhin in der generierten Export-Map,
wenn dafür nachverfolgte Owner-Nutzung vorliegt. Sie existieren nur für die Wartung gebündelter Plugins
und sind keine empfohlenen Importpfade für neue Drittanbieter-Plugins.

`openclaw/plugin-sdk/discord` und `openclaw/plugin-sdk/telegram-account` werden
ebenfalls als veraltete Kompatibilitäts-Fassaden für nachverfolgte Owner-Nutzung beibehalten. Übernehmen Sie
diese Importpfade nicht in neue Plugins; verwenden Sie stattdessen injizierte Laufzeithelfer und
generische Channel-SDK-Unterpfade.
</Warning>

## Unterpfadreferenz

Das Plugin-SDK wird als Satz schmaler Unterpfade bereitgestellt, gruppiert nach Bereich (Plugin
Entry, Channel, Provider, Auth, Laufzeit, Capability, Memory und reservierte
Helfer für gebündelte Plugins). Den vollständigen Katalog, gruppiert und verlinkt, finden Sie unter
[Plugin-SDK-Unterpfade](/de/plugins/sdk-subpaths).

Das Inventar der Compiler-Einstiegspunkte befindet sich in
`scripts/lib/plugin-sdk-entrypoints.json`; Paketexporte werden aus
der öffentlichen Teilmenge generiert, nachdem repo-lokale Test-/interne Unterpfade abgezogen wurden, die in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` aufgeführt sind. Führen Sie
`pnpm plugin-sdk:surface` aus, um die Anzahl öffentlicher Exporte zu prüfen. Veraltete öffentliche
Unterpfade, die alt genug sind und nicht von Produktionscode gebündelter Erweiterungen verwendet werden, werden
in `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` nachverfolgt; breite
veraltete Re-Export-Barrels werden in
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` nachverfolgt.

## Registrierungs-API

Der Callback `register(api)` erhält ein Objekt `OpenClawPluginApi` mit diesen
Methoden:

### Capability-Registrierung

| Methode                                          | Was sie registriert                    |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Textinferenz (LLM)                     |
| `api.registerAgentHarness(...)`                  | Experimenteller Low-Level-Agent-Executor |
| `api.registerCliBackend(...)`                    | Lokales CLI-Inferenz-Backend           |
| `api.registerChannel(...)`                       | Messaging-Channel                      |
| `api.registerSpeechProvider(...)`                | Text-to-Speech-/STT-Synthese           |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming-Echtzeittranskription        |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex-Echtzeit-Sprachsitzungen        |
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
befehlseigenen Routing-Hinweis benötigt. Halten Sie diesen Text auf den Befehl selbst bezogen; fügen Sie keine
provider- oder pluginspezifische Policy zu Core-Prompt-Buildern hinzu.

### Infrastruktur

| Methode                                        | Was sie registriert                      |
| ---------------------------------------------- | ---------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Event-Hook                               |
| `api.registerHttpRoute(params)`                | Gateway-HTTP-Endpunkt                    |
| `api.registerGatewayMethod(name, handler)`     | Gateway-RPC-Methode                      |
| `api.registerGatewayDiscoveryService(service)` | Lokaler Gateway-Discovery-Advertiser     |
| `api.registerCli(registrar, opts?)`            | CLI-Unterbefehl                          |
| `api.registerNodeCliFeature(registrar, opts?)` | Node-Feature-CLI unter `openclaw nodes`  |
| `api.registerService(service)`                 | Hintergrunddienst                        |
| `api.registerInteractiveHandler(registration)` | Interaktiver Handler                     |
| `api.registerAgentToolResultMiddleware(...)`   | Laufzeit-Middleware für Tool-Ergebnisse  |
| `api.registerMemoryPromptSupplement(builder)`  | Additiver promptnaher Memory-Abschnitt   |
| `api.registerMemoryCorpusSupplement(adapter)`  | Additiver Memory-Such-/Lesekorpus        |

### Host-Hooks für Workflow-Plugins

Host-Hooks sind die SDK-Seams für Plugins, die am Host-Lifecycle teilnehmen müssen,
statt nur einen Provider, Channel oder ein Tool hinzuzufügen. Es sind
generische Verträge; der Plan Mode kann sie verwenden, aber ebenso Genehmigungsworkflows,
Workspace-Policy-Gates, Hintergrundmonitore, Einrichtungsassistenten und UI-Begleit-Plugins.

| Methode                                                                              | Vertrag, den sie verwaltet                                                                                                       |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Plugin-eigener, JSON-kompatibler Sitzungszustand, der über Gateway-Sitzungen projiziert wird                                      |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Dauerhafter Exactly-once-Kontext, der für eine Sitzung in den nächsten Agent-Turn injiziert wird                                  |
| `api.registerTrustedToolPolicy(...)`                                                 | Gebündelte/vertrauenswürdige Pre-Plugin-Tool-Policy, die Tool-Parameter blockieren oder umschreiben kann                          |
| `api.registerToolMetadata(...)`                                                      | Anzeige-Metadaten des Tool-Katalogs, ohne die Tool-Implementierung zu ändern                                                     |
| `api.registerCommand(...)`                                                           | Bereichsgebundene Plugin-Befehle; Befehlsergebnisse können `continueAgent: true` setzen; native Discord-Befehle unterstützen `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Control-UI-Beitragsdeskriptoren für Sitzungs-, Tool-, Run- oder Einstellungsoberflächen                                           |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Cleanup-Callbacks für plugin-eigene Laufzeitressourcen bei Reset-/Delete-/Reload-Pfaden                                          |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Bereinigte Event-Subscriptions für Workflow-Zustand und Monitore                                                                 |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Pro-Run-Plugin-Scratch-State, der beim terminalen Run-Lifecycle geleert wird                                                     |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Cleanup-Metadaten für plugin-eigene Scheduler-Jobs; plant keine Arbeit und erstellt keine Task-Datensätze                         |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Nur gebündelt: vom Host vermittelte Dateianhangszustellung an die aktive direkte Outbound-Sitzungsroute                           |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Nur gebündelt: Cron-gestützte geplante Session-Turns plus tagbasierter Cleanup                                                    |
| `api.session.controls.registerSessionAction(...)`                                    | Typisierte Sitzungsaktionen, die Clients über den Gateway dispatchen können                                                       |

Verwenden Sie die gruppierten Namespaces für neuen Plugin-Code:

- `api.session.state.registerSessionExtension(...)`
- `api.session.workflow.enqueueNextTurnInjection(...)`
- `api.session.workflow.registerSessionSchedulerJob(...)`
- `api.session.workflow.sendSessionAttachment(...)`
- `api.session.workflow.scheduleSessionTurn(...)`
- `api.session.workflow.unscheduleSessionTurnsByTag(...)`
- `api.session.controls.registerSessionAction(...)`
- `api.session.controls.registerControlUiDescriptor(...)`
- `api.agent.events.registerAgentEventSubscription(...)`
- `api.agent.events.emitAgentEvent(...)`
- `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`
- `api.lifecycle.registerRuntimeLifecycle(...)`

Die entsprechenden flachen Methoden bleiben als veraltete Kompatibilitätsaliase
für vorhandene Plugins verfügbar. Fügen Sie keinen neuen Plugin-Code hinzu, der
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` oder
`api.unscheduleSessionTurnsByTag` direkt aufruft.

`scheduleSessionTurn(...)` ist eine sitzungsbezogene Komfortfunktion über dem Gateway-
Cron-Scheduler. Cron besitzt das Timing und erstellt den Hintergrundaufgaben-Datensatz, wenn der
Turn ausgeführt wird; das Plugin SDK beschränkt nur die Zielsitzung, Plugin-eigene
Benennung und Bereinigung. Verwenden Sie `api.runtime.tasks.managedFlows` innerhalb des geplanten
Turns, wenn die Arbeit selbst dauerhaften mehrstufigen Task-Flow-Zustand benötigt.

Die Verträge trennen die Zuständigkeiten bewusst:

- Externe Plugins können Sitzungserweiterungen, UI-Deskriptoren, Befehle, Tool-
  Metadaten, Next-Turn-Injektionen und normale Hooks besitzen.
- Vertrauenswürdige Tool-Richtlinien werden vor gewöhnlichen `before_tool_call`-Hooks ausgeführt und sind
  nur gebündelten Plugins vorbehalten, weil sie an der Host-Sicherheitsrichtlinie beteiligt sind.
- Reservierte Befehlszuständigkeit ist nur gebündelten Plugins vorbehalten. Externe Plugins sollten ihre
  eigenen Befehlsnamen oder Aliasse verwenden.
- `allowPromptInjection=false` deaktiviert Prompt-verändernde Hooks einschließlich
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  Prompt-Felder aus dem alten `before_agent_start` und
  `enqueueNextTurnInjection`.

Beispiele für Nicht-Plan-Verbraucher:

| Plugin-Archetyp             | Verwendete Hooks                                                                                                                             |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Genehmigungsworkflow            | Sitzungserweiterung, Befehlsfortsetzung, Next-Turn-Injektion, UI-Deskriptor                                                            |
| Budget-/Workspace-Richtlinien-Gate | Vertrauenswürdige Tool-Richtlinie, Tool-Metadaten, Sitzungsprojektion                                                                                 |
| Hintergrund-Lifecycle-Monitor | Runtime-Lifecycle-Bereinigung, Agent-Ereignisabonnement, Zuständigkeit/Bereinigung des Sitzungsschedulers, Heartbeat-Prompt-Beitrag, UI-Deskriptor |
| Einrichtungs- oder Onboarding-Assistent   | Sitzungserweiterung, bereichsgebundene Befehle, Control-UI-Deskriptor                                                                              |

<Note>
  Reservierte zentrale Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) bleiben immer `operator.admin`, selbst wenn ein Plugin versucht, einen
  engeren Gateway-Methoden-Scope zuzuweisen. Bevorzugen Sie Plugin-spezifische Präfixe für
  Plugin-eigene Methoden.
</Note>

<Accordion title="Wann Tool-Ergebnis-Middleware verwendet werden sollte">
  Gebündelte Plugins können `api.registerAgentToolResultMiddleware(...)` verwenden, wenn
  sie ein Tool-Ergebnis nach der Ausführung und bevor die Runtime
  dieses Ergebnis an das Modell zurückgibt, umschreiben müssen. Dies ist die vertrauenswürdige runtime-neutrale
  Nahtstelle für asynchrone Ausgabereduzierer wie tokenjuice.

Gebündelte Plugins müssen `contracts.agentToolResultMiddleware` für jede
Ziel-Runtime deklarieren, zum Beispiel `["pi", "codex"]`. Externe Plugins
können diese Middleware nicht registrieren; verwenden Sie normale OpenClaw-Plugin-Hooks für Arbeit,
die kein Tool-Ergebnis-Timing vor dem Modell benötigt. Der alte, nur in Pi eingebettete
Registrierungspfad für Extension-Factorys wurde entfernt.
</Accordion>

### Gateway-Discovery-Registrierung

`api.registerGatewayDiscoveryService(...)` lässt ein Plugin den aktiven
Gateway auf einem lokalen Discovery-Transport wie mDNS/Bonjour bekanntgeben. OpenClaw ruft den
Dienst während des Gateway-Starts auf, wenn lokale Discovery aktiviert ist, übergibt die
aktuellen Gateway-Ports und nicht geheimen TXT-Hinweisdaten und ruft den zurückgegebenen
`stop`-Handler beim Herunterfahren des Gateway auf.

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
Authentifizierung behandeln. Discovery ist ein Routing-Hinweis; Gateway-Authentifizierung und TLS-Pinning besitzen weiterhin
das Vertrauen.

### CLI-Registrierungsmetadaten

`api.registerCli(registrar, opts?)` akzeptiert zwei Arten von Befehlsmetadaten:

- `commands`: explizite Befehlsnamen, die dem Registrar gehören
- `descriptors`: Parse-Zeit-Befehlsdeskriptoren, die für CLI-Hilfe,
  Routing und verzögerte Plugin-CLI-Registrierung verwendet werden
- `parentPath`: optionaler übergeordneter Befehlspfad für verschachtelte Befehlsgruppen, zum Beispiel
  `["nodes"]`

Für Paired-Node-Funktionen bevorzugen Sie
`api.registerNodeCliFeature(registrar, opts?)`. Es ist ein kleiner Wrapper um
`api.registerCli(..., { parentPath: ["nodes"] })` und macht Befehle wie
`openclaw nodes canvas` zu expliziten Plugin-eigenen Node-Funktionen.

Wenn ein Plugin-Befehl im normalen Root-CLI-Pfad verzögert geladen bleiben soll,
geben Sie `descriptors` an, die jeden von diesem Registrar offengelegten Top-Level-Befehls-Root
abdecken.

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

Verwenden Sie `commands` allein nur, wenn Sie keine verzögerte Root-CLI-Registrierung benötigen.
Dieser eifrige Kompatibilitätspfad bleibt unterstützt, installiert aber keine
deskriptorbasierten Platzhalter für verzögertes Laden zur Parse-Zeit.

### CLI-Backend-Registrierung

`api.registerCliBackend(...)` lässt ein Plugin die Standardkonfiguration für ein lokales
KI-CLI-Backend wie `codex-cli` besitzen.

- Die Backend-`id` wird zum Provider-Präfix in Modellreferenzen wie `codex-cli/gpt-5`.
- Die Backend-`config` verwendet dieselbe Form wie `agents.defaults.cliBackends.<id>`.
- Benutzerkonfiguration gewinnt weiterhin. OpenClaw führt `agents.defaults.cliBackends.<id>` über der
  Plugin-Standardeinstellung zusammen, bevor die CLI ausgeführt wird.
- Verwenden Sie `normalizeConfig`, wenn ein Backend nach dem Zusammenführen Kompatibilitätsumschreibungen benötigt
  (zum Beispiel das Normalisieren alter Flag-Formen).
- Verwenden Sie `resolveExecutionArgs` für anfragebezogene argv-Umschreibungen, die zum
  CLI-Dialekt gehören, zum Beispiel das Abbilden von OpenClaw-Denkstufen auf ein natives Effort-
  Flag.

Eine durchgehende Anleitung zum Erstellen finden Sie unter
[CLI-Backend-Plugins](/de/plugins/cli-backend-plugins).

### Exklusive Slots

| Methode                                     | Was sie registriert                                                                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Kontext-Engine (jeweils eine aktiv). Der `assemble()`-Callback erhält `availableTools` und `citationsMode`, damit die Engine Prompt-Ergänzungen anpassen kann. |
| `api.registerMemoryCapability(capability)` | Einheitliche Speicherfähigkeit                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Builder für Speicher-Prompt-Abschnitt                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver für Speicher-Flush-Plan                                                                                                                                |
| `api.registerMemoryRuntime(runtime)`       | Speicher-Runtime-Adapter                                                                                                                                    |

### Speicher-Embedding-Adapter

| Methode                                         | Was sie registriert                              |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Speicher-Embedding-Adapter für das aktive Plugin |

- `registerMemoryCapability` ist die bevorzugte exklusive Speicher-Plugin-API.
- `registerMemoryCapability` kann auch `publicArtifacts.listArtifacts(...)`
  offenlegen, damit Companion-Plugins exportierte Speicherartefakte über
  `openclaw/plugin-sdk/memory-host-core` konsumieren können, anstatt in das private Layout eines bestimmten
  Speicher-Plugins zu greifen.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` und
  `registerMemoryRuntime` sind Legacy-kompatible exklusive Speicher-Plugin-APIs.
- `MemoryFlushPlan.model` kann den Flush-Turn an eine exakte `provider/model`-
  Referenz binden, zum Beispiel `ollama/qwen3:8b`, ohne die aktive Fallback-
  Kette zu erben.
- `registerMemoryEmbeddingProvider` lässt das aktive Speicher-Plugin eine
  oder mehrere Embedding-Adapter-IDs registrieren (zum Beispiel `openai`, `gemini` oder eine benutzerdefinierte,
  Plugin-definierte ID).
- Benutzerkonfiguration wie `agents.defaults.memorySearch.provider` und
  `agents.defaults.memorySearch.fallback` wird gegen diese registrierten
  Adapter-IDs aufgelöst.

### Ereignisse und Lifecycle

| Methode                                       | Was sie tut                  |
| -------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`           | Typisierter Lifecycle-Hook          |
| `api.onConversationBindingResolved(handler)` | Callback für Konversationsbindung |

Siehe [Plugin-Hooks](/de/plugins/hooks) für Beispiele, gängige Hook-Namen und Guard-
Semantik.

### Hook-Entscheidungssemantik

- `before_tool_call`: Die Rückgabe von `{ block: true }` ist terminal. Sobald ein Handler sie setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_tool_call`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `block`), nicht als Überschreibung.
- `before_install`: Die Rückgabe von `{ block: true }` ist terminal. Sobald ein Handler sie setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_install`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `block`), nicht als Überschreibung.
- `reply_dispatch`: Die Rückgabe von `{ handled: true, ... }` ist terminal. Sobald ein Handler den Versand beansprucht, werden Handler mit niedrigerer Priorität und der Standardpfad für Modellversand übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: true }` ist terminal. Sobald ein Handler sie setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `cancel`), nicht als Überschreibung.
- `message_received`: Verwenden Sie das typisierte Feld `threadId`, wenn Sie Routing eingehender Threads/Themen benötigen. Behalten Sie `metadata` für kanalspezifische Extras bei.
- `message_sending`: Verwenden Sie die typisierten Routing-Felder `replyToId` / `threadId`, bevor Sie auf kanalspezifische `metadata` zurückfallen.
- `gateway_start`: Verwenden Sie `ctx.config`, `ctx.workspaceDir` und `ctx.getCron?.()` für Gateway-eigenen Startzustand, anstatt sich auf interne `gateway:startup`-Hooks zu verlassen.
- `cron_changed`: Beobachten Sie Gateway-eigene Cron-Lifecycle-Änderungen. Verwenden Sie `event.job?.state?.nextRunAtMs` und `ctx.getCron?.()`, wenn Sie externe Wake-Scheduler synchronisieren, und behalten Sie OpenClaw als Source of Truth für Fälligkeitsprüfungen und Ausführung bei.

### API-Objektfelder

| Feld                     | Typ                       | Beschreibung                                                                                         |
| ------------------------ | ------------------------- | ---------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-ID                                                                                            |
| `api.name`               | `string`                  | Anzeigename                                                                                          |
| `api.version`            | `string?`                 | Plugin-Version (optional)                                                                            |
| `api.description`        | `string?`                 | Plugin-Beschreibung (optional)                                                                       |
| `api.source`             | `string`                  | Plugin-Quellpfad                                                                                     |
| `api.rootDir`            | `string?`                 | Plugin-Stammverzeichnis (optional)                                                                   |
| `api.config`             | `OpenClawConfig`          | Aktueller Konfigurations-Snapshot (aktiver In-Memory-Laufzeit-Snapshot, wenn verfügbar)              |
| `api.pluginConfig`       | `Record<string, unknown>` | Plugin-spezifische Konfiguration aus `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Laufzeit-Helfer](/de/plugins/sdk-runtime)                                                              |
| `api.logger`             | `PluginLogger`            | Bereichsgebundener Logger (`debug`, `info`, `warn`, `error`)                                         |
| `api.registrationMode`   | `PluginRegistrationMode`  | Aktueller Lademodus; `"setup-runtime"` ist das leichtgewichtige Start-/Setup-Fenster vor dem Vollzugriff |
| `api.resolvePath(input)` | `(string) => string`      | Pfad relativ zum Plugin-Stammverzeichnis auflösen                                                    |

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
  Importieren Sie Ihr eigenes Plugin niemals aus Produktionscode über
  `openclaw/plugin-sdk/<your-plugin>`. Leiten Sie interne Importe über
  `./api.ts` oder `./runtime-api.ts`. Der SDK-Pfad ist ausschließlich der
  externe Vertrag.
</Warning>

Öffentliche Oberflächen von per Facade geladenen gebündelten Plugins (`api.ts`,
`runtime-api.ts`, `index.ts`, `setup-entry.ts` und ähnliche öffentliche
Einstiegsdateien) bevorzugen den aktiven Laufzeit-Konfigurations-Snapshot,
wenn OpenClaw bereits ausgeführt wird. Wenn noch kein Laufzeit-Snapshot
vorhanden ist, fallen sie auf die aufgelöste Konfigurationsdatei auf dem
Datenträger zurück. Facades paketierter gebündelter Plugins sollten über die
Plugin-Facade-Loader von OpenClaw geladen werden; direkte Importe aus
`dist/extensions/...` umgehen die Manifest- und Laufzeit-Sidecar-Prüfungen,
die paketierte Installationen für Plugin-eigenen Code verwenden.

Provider-Plugins können ein schmales Plugin-lokales Vertrags-Barrel
bereitstellen, wenn ein Helfer absichtlich Provider-spezifisch ist und noch
nicht in einen generischen SDK-Unterpfad gehört. Gebündelte Beispiele:

- **Anthropic**: öffentliche `api.ts`-/`contract-api.ts`-Nahtstelle für Claude
  Beta-Header- und `service_tier`-Stream-Helfer.
- **`@openclaw/openai-provider`**: `api.ts` exportiert Provider-Builder,
  Standardmodell-Helfer und Echtzeit-Provider-Builder.
- **`@openclaw/openrouter-provider`**: `api.ts` exportiert den Provider-Builder
  sowie Onboarding-/Konfigurations-Helfer.

<Warning>
  Produktionscode von Plugins sollte ebenfalls Importe aus
  `openclaw/plugin-sdk/<other-plugin>` vermeiden. Wenn ein Helfer wirklich
  gemeinsam genutzt wird, heben Sie ihn in einen neutralen SDK-Unterpfad wie
  `openclaw/plugin-sdk/speech`, `.../provider-model-shared` oder eine andere
  fähigkeitsorientierte Oberfläche an, statt zwei Plugins miteinander zu koppeln.
</Warning>

## Verwandt

<CardGroup cols={2}>
  <Card title="Einstiegspunkte" icon="door-open" href="/de/plugins/sdk-entrypoints">
    Optionen für `definePluginEntry` und `defineChannelPluginEntry`.
  </Card>
  <Card title="Laufzeit-Helfer" icon="gears" href="/de/plugins/sdk-runtime">
    Vollständige Referenz zum Namespace `api.runtime`.
  </Card>
  <Card title="Setup und Konfiguration" icon="sliders" href="/de/plugins/sdk-setup">
    Paketierung, Manifeste und Konfigurationsschemata.
  </Card>
  <Card title="Tests" icon="vial" href="/de/plugins/sdk-testing">
    Test-Hilfsprogramme und Lint-Regeln.
  </Card>
  <Card title="SDK-Migration" icon="arrows-turn-right" href="/de/plugins/sdk-migration">
    Migration von veralteten Oberflächen.
  </Card>
  <Card title="Plugin-Interna" icon="diagram-project" href="/de/plugins/architecture">
    Tiefgehende Architektur und Fähigkeitsmodell.
  </Card>
</CardGroup>
