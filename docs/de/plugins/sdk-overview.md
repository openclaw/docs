---
read_when:
    - Sie müssen wissen, aus welchem SDK-Unterpfad Sie importieren müssen
    - Sie möchten eine Referenz für alle Registrierungsmethoden von OpenClawPluginApi
    - Sie suchen nach einem bestimmten SDK-Export
sidebarTitle: Plugin SDK overview
summary: Import-Map-, Registrierungs-API-Referenz und SDK-Architektur
title: Überblick über das Plugin SDK
x-i18n:
    generated_at: "2026-07-01T18:10:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c7df77e34db9b780ee0747a0f2178861624f528d9f7aec8592d6954a96869e96
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Das Plugin-SDK ist der typisierte Vertrag zwischen Plugins und Core. Diese Seite ist die
Referenz dafür, **was Sie importieren** und **was Sie registrieren können**.

<Note>
  Diese Seite richtet sich an Plugin-Autoren, die `openclaw/plugin-sdk/*` innerhalb von
  OpenClaw verwenden. Für externe Apps, Skripte, Dashboards, CI-Jobs und IDE-Erweiterungen,
  die Agents über den Gateway ausführen möchten, verwenden Sie stattdessen
  [Gateway-Integrationen für externe Apps](/de/gateway/external-apps).
</Note>

<Tip>
Suchen Sie stattdessen eine Anleitung? Beginnen Sie mit [Plugins erstellen](/de/plugins/building-plugins), verwenden Sie [Channel-Plugins](/de/plugins/sdk-channel-plugins) für Channel-Plugins, [Provider-Plugins](/de/plugins/sdk-provider-plugins) für Provider-Plugins, [CLI-Backend-Plugins](/de/plugins/cli-backend-plugins) für lokale KI-CLI-Backends und [Plugin-Hooks](/de/plugins/hooks) für Tool- oder Lifecycle-Hook-Plugins.
</Tip>

## Importkonvention

Importieren Sie immer aus einem bestimmten Subpfad:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Jeder Subpfad ist ein kleines, eigenständiges Modul. Dadurch bleibt der Start schnell und
Probleme mit zirkulären Abhängigkeiten werden vermieden. Für channelspezifische Entry-/Build-Helper
bevorzugen Sie `openclaw/plugin-sdk/channel-core`; behalten Sie `openclaw/plugin-sdk/core` für
die breitere Umbrella-Oberfläche und gemeinsame Helper wie
`buildChannelConfigSchema`.

Für Channel-Konfiguration veröffentlichen Sie das channel-eigene JSON Schema über
`openclaw.plugin.json#channelConfigs`. Der Subpfad `plugin-sdk/channel-config-schema`
ist für gemeinsame Schema-Primitives und den generischen Builder vorgesehen. Die
gebündelten Plugins von OpenClaw verwenden `plugin-sdk/bundled-channel-config-schema` für beibehaltene
Schemas gebündelter Channels. Veraltete Kompatibilitätsexporte bleiben unter
`plugin-sdk/channel-config-schema-legacy`; keiner der gebündelten Schema-Subpfade ist ein
Muster für neue Plugins.

<Warning>
  Importieren Sie keine provider- oder channel-gebrandeten Convenience-Seams (zum Beispiel
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Gebündelte Plugins setzen generische SDK-Subpfade innerhalb ihrer eigenen `api.ts`- /
  `runtime-api.ts`-Barrels zusammen; Core-Consumer sollten entweder diese Plugin-lokalen
  Barrels verwenden oder einen schmalen generischen SDK-Vertrag hinzufügen, wenn ein Bedarf wirklich
  channelübergreifend ist.

Eine kleine Gruppe von Helper-Seams für gebündelte Plugins erscheint weiterhin in der generierten Export-Map,
wenn dafür nachverfolgte Owner-Nutzung existiert. Sie dienen nur der Wartung gebündelter Plugins
und sind keine empfohlenen Importpfade für neue Drittanbieter-Plugins.

`openclaw/plugin-sdk/discord` und `openclaw/plugin-sdk/telegram-account` bleiben
ebenfalls als veraltete Kompatibilitäts-Fassaden für nachverfolgte Owner-Nutzung erhalten. Kopieren Sie
diese Importpfade nicht in neue Plugins; verwenden Sie stattdessen injizierte Runtime-Helper und
generische Channel-SDK-Subpfade.
</Warning>

## Subpfad-Referenz

Das Plugin-SDK wird als Gruppe schmaler Subpfade bereitgestellt, gruppiert nach Bereichen (Plugin-
Entry, Channel, Provider, Auth, Runtime, Capability, Memory und reservierte
Helper für gebündelte Plugins). Den vollständigen Katalog, gruppiert und verlinkt, finden Sie unter
[Plugin-SDK-Subpfade](/de/plugins/sdk-subpaths).

Das Entrypoint-Inventar des Compilers befindet sich in
`scripts/lib/plugin-sdk-entrypoints.json`; Package-Exporte werden aus
der öffentlichen Teilmenge generiert, nachdem repo-lokale Test-/interne Subpfade abgezogen wurden, die in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` aufgeführt sind. Führen Sie
`pnpm plugin-sdk:surface` aus, um die Anzahl öffentlicher Exporte zu auditieren. Veraltete öffentliche
Subpfade, die alt genug sind und von Produktionscode gebündelter Extensions nicht genutzt werden, werden in
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` nachverfolgt; breite
veraltete Re-Export-Barrels werden in
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` nachverfolgt.

## Registrierungs-API

Der Callback `register(api)` erhält ein `OpenClawPluginApi`-Objekt mit diesen
Methoden:

### Capability-Registrierung

| Methode                                          | Was sie registriert                    |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Text-Inferenz (LLM)                   |
| `api.registerAgentHarness(...)`                  | Experimenteller Low-Level-Agent-Executor |
| `api.registerCliBackend(...)`                    | Lokales CLI-Inferenz-Backend          |
| `api.registerChannel(...)`                       | Messaging-Channel                     |
| `api.registerEmbeddingProvider(...)`             | Wiederverwendbarer Vektor-Embedding-Provider |
| `api.registerSpeechProvider(...)`                | Text-to-Speech- / STT-Synthese        |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming-Echtzeit-Transkription      |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex-Echtzeit-Sprachsitzungen       |
| `api.registerMediaUnderstandingProvider(...)`    | Bild-/Audio-/Videoanalyse             |
| `api.registerImageGenerationProvider(...)`       | Bilderzeugung                         |
| `api.registerMusicGenerationProvider(...)`       | Musikerzeugung                        |
| `api.registerVideoGenerationProvider(...)`       | Videoerzeugung                        |
| `api.registerWebFetchProvider(...)`              | Web-Fetch- / Scrape-Provider          |
| `api.registerWebSearchProvider(...)`             | Websuche                              |

Embedding-Provider, die mit `api.registerEmbeddingProvider(...)` registriert werden, müssen
auch in `contracts.embeddingProviders` im Plugin-Manifest aufgeführt sein. Dies
ist die generische Embedding-Oberfläche für wiederverwendbare Vektorerzeugung. Memory Search
kann diese generische Provider-Oberfläche nutzen. Die ältere
Seam `api.registerMemoryEmbeddingProvider(...)` und
`contracts.memoryEmbeddingProviders` ist veraltete Kompatibilität, während
bestehende memory-spezifische Provider migrieren.

Memory-spezifische Provider, die weiterhin zur Laufzeit ein `batchEmbed(...)` bereitstellen, bleiben beim
bestehenden per-file Batching-Vertrag, es sei denn, ihre Runtime setzt ausdrücklich
`sourceWideBatchEmbed: true`. Dieses Opt-in ermöglicht es dem Memory-Host, Chunks aus
mehreren geänderten Memory-Dateien und aktivierten Quellen in einem `batchEmbed(...)`-Aufruf bis zu
den Batch-Limits des Hosts zu übermitteln. Batch-Adapter, die JSONL-Anfragedateien hochladen, müssen
Provider-Jobs sowohl vor ihrer Upload-Größenobergrenze als auch vor ihrer Request-Count-
Obergrenze aufteilen. Der Provider muss ein Embedding pro Eingabe-Chunk in derselben Reihenfolge wie
`batch.chunks` zurückgeben; lassen Sie das Flag weg, wenn der Provider dateilokale Batches erwartet oder
die Eingabereihenfolge über einen größeren source-weiten Job hinweg nicht erhalten kann.

### Tools und Befehle

Verwenden Sie [`defineToolPlugin`](/de/plugins/tool-plugins) für einfache reine Tool-Plugins
mit festen Tool-Namen. Verwenden Sie `api.registerTool(...)` direkt für gemischte Plugins
oder vollständig dynamische Tool-Registrierung.

| Methode                         | Was sie registriert                          |
| ------------------------------- | -------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent-Tool (erforderlich oder `{ optional: true }`) |
| `api.registerCommand(def)`      | Benutzerdefinierter Befehl (umgeht das LLM)  |

Plugin-Befehle können `agentPromptGuidance` setzen, wenn der Agent einen kurzen,
befehlseigenen Routing-Hinweis benötigt. Halten Sie diesen Text auf den Befehl selbst bezogen; fügen Sie keine
provider- oder pluginspezifische Policy zu Core-Prompt-Buildern hinzu.

Guidance-Einträge können Legacy-Strings sein, die für jede Prompt-Oberfläche gelten, oder
strukturierte Einträge:

```ts
agentPromptGuidance: [
  "Global command hint.",
  { text: "Only show this in the main OpenClaw prompt.", surfaces: ["openclaw_main"] },
];
```

Strukturierte `surfaces` können `openclaw_main`, `codex_app_server`,
`cli_backend`, `acp_backend` oder `subagent` enthalten. `pi_main` bleibt ein veralteter Alias
für `openclaw_main`. Lassen Sie `surfaces` für absichtliche Guidance auf allen Oberflächen weg. Übergeben Sie
kein leeres `surfaces`-Array; es wird abgelehnt, damit versehentlicher Scope-Verlust nicht
zu globalem Prompt-Text wird.

Native Codex-App-Server-Developer-Instructions sind strenger als andere Prompt-
Oberflächen: Nur Guidance, die ausdrücklich auf `codex_app_server` beschränkt ist, wird in
diese höher priorisierte Lane befördert. Legacy-String-Guidance und unscoped strukturierte
Guidance bleiben aus Kompatibilitätsgründen für Nicht-Codex-Prompt-Oberflächen verfügbar.

### Infrastruktur

| Methode                                        | Was sie registriert                    |
| ---------------------------------------------- | -------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Event-Hook                             |
| `api.registerHttpRoute(params)`                | Gateway-HTTP-Endpunkt                  |
| `api.registerGatewayMethod(name, handler)`     | Gateway-RPC-Methode                    |
| `api.registerGatewayDiscoveryService(service)` | Lokaler Gateway-Discovery-Advertiser   |
| `api.registerCli(registrar, opts?)`            | CLI-Unterbefehl                        |
| `api.registerNodeCliFeature(registrar, opts?)` | Node-Feature-CLI unter `openclaw nodes` |
| `api.registerService(service)`                 | Hintergrunddienst                      |
| `api.registerInteractiveHandler(registration)` | Interaktiver Handler                   |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime-Tool-Result-Middleware         |
| `api.registerMemoryPromptSupplement(builder)`  | Additiver memory-naher Prompt-Abschnitt |
| `api.registerMemoryCorpusSupplement(adapter)`  | Additiver Memory-Search-/Read-Corpus   |

### Host-Hooks für Workflow-Plugins

Host-Hooks sind die SDK-Seams für Plugins, die am Host-
Lifecycle teilnehmen müssen, statt nur einen Provider, Channel oder ein Tool hinzuzufügen. Sie sind
generische Verträge; Plan Mode kann sie verwenden, aber ebenso Approval-Workflows,
Workspace-Policy-Gates, Hintergrundmonitore, Setup-Assistenten und UI-Companion-
Plugins.

| Methode                                                                              | Vertrag, den sie verantwortet                                                                                                                              |
| ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Plugin-eigener, JSON-kompatibler Sitzungszustand, der über Gateway-Sitzungen projiziert wird                                                              |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Dauerhafter Exactly-once-Kontext, der für eine Sitzung in den nächsten Agent-Durchlauf injiziert wird                                                      |
| `api.registerTrustedToolPolicy(...)`                                                 | Durch Manifest gesteuerte, vertrauenswürdige Pre-Plugin-Tool-Richtlinie, die Tool-Parameter blockieren oder umschreiben kann                               |
| `api.registerToolMetadata(...)`                                                      | Anzeigemetadaten für den Tool-Katalog, ohne die Tool-Implementierung zu ändern                                                                             |
| `api.registerCommand(...)`                                                           | Bereichsgebundene Plugin-Befehle; Befehlsergebnisse können `continueAgent: true` oder `suppressReply: true` setzen; native Discord-Befehle unterstützen `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Control-UI-Beitragsdeskriptoren für Sitzungs-, Tool-, Lauf- oder Einstellungsoberflächen                                                                  |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Bereinigungs-Callbacks für Plugin-eigene Laufzeitressourcen in Reset-/Lösch-/Reload-Pfaden                                                                |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Bereinigte Ereignisabonnements für Workflow-Zustand und Monitore                                                                                          |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Plugin-Arbeitszustand pro Lauf, der beim terminalen Lauflebenszyklus bereinigt wird                                                                       |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Bereinigungsmetadaten für Plugin-eigene Scheduler-Jobs; plant keine Arbeit und erstellt keine Task-Datensätze                                             |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Nur gebündelte, hostvermittelte Datei-Anhangszustellung an die aktive direkte ausgehende Sitzungsroute                                                    |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Nur gebündelte, Cron-gestützte geplante Sitzungsdurchläufe plus tagbasierte Bereinigung                                                                   |
| `api.session.controls.registerSessionAction(...)`                                    | Typisierte Sitzungsaktionen, die Clients über den Gateway auslösen können                                                                                 |

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
Cron-Scheduler. Cron verantwortet das Timing und erstellt den Hintergrund-Task-Datensatz, wenn der
Durchlauf ausgeführt wird; das Plugin SDK beschränkt nur die Zielsitzung, Plugin-eigene
Benennung und Bereinigung. Verwenden Sie `api.runtime.tasks.managedFlows` innerhalb des geplanten
Durchlaufs, wenn die Arbeit selbst dauerhaften mehrstufigen Task-Flow-Zustand benötigt.

Die Verträge trennen die Zuständigkeiten bewusst:

- Externe Plugins können Sitzungserweiterungen, UI-Deskriptoren, Befehle, Tool-
  Metadaten, Next-Turn-Injektionen und normale Hooks verantworten.
- Vertrauenswürdige Tool-Richtlinien werden vor gewöhnlichen `before_tool_call`-Hooks ausgeführt und sind
  host-vertrauenswürdig. Gebündelte Richtlinien laufen zuerst; Richtlinien installierter Plugins erfordern
  explizite Aktivierung plus ihre lokalen IDs in
  `contracts.trustedToolPolicies` und laufen anschließend in Plugin-Ladereihenfolge. Richtlinien-IDs
  sind auf das registrierende Plugin beschränkt.
- Reservierte Befehlszuständigkeit ist nur gebündelt verfügbar. Externe Plugins sollten ihre
  eigenen Befehlsnamen oder Aliase verwenden.
- `allowPromptInjection=false` deaktiviert Prompt-verändernde Hooks einschließlich
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  Prompt-Felder aus dem alten `before_agent_start` und
  `enqueueNextTurnInjection`.

Beispiele für Nicht-Plan-Verbraucher:

| Plugin-Archetyp             | Verwendete Hooks                                                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Genehmigungs-Workflow       | Sitzungserweiterung, Befehlsfortsetzung, Next-Turn-Injektion, UI-Deskriptor                                                        |
| Budget-/Workspace-Richtlinien-Gate | Vertrauenswürdige Tool-Richtlinie, Tool-Metadaten, Sitzungsprojektion                                                      |
| Hintergrund-Lebenszyklusmonitor | Laufzeit-Lebenszyklusbereinigung, Agent-Ereignisabonnement, Besitz/Bereinigung von Sitzungsscheduler, Heartbeat-Prompt-Beitrag, UI-Deskriptor |
| Setup- oder Onboarding-Assistent | Sitzungserweiterung, bereichsgebundene Befehle, Control-UI-Deskriptor                                                          |

<Note>
  Reservierte Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) bleiben immer `operator.admin`, selbst wenn ein Plugin versucht, einen
  engeren Gateway-Methodenbereich zuzuweisen. Bevorzugen Sie Plugin-spezifische Präfixe für
  Plugin-eigene Methoden.
</Note>

<Accordion title="Wann Tool-Ergebnis-Middleware verwendet wird">
  Gebündelte Plugins und explizit aktivierte installierte Plugins mit passenden
  Manifestverträgen können `api.registerAgentToolResultMiddleware(...)` verwenden, wenn
  sie ein Tool-Ergebnis nach der Ausführung und bevor die Laufzeit dieses Ergebnis
  zurück in das Modell einspeist, umschreiben müssen. Dies ist die vertrauenswürdige laufzeitneutrale
  Nahtstelle für asynchrone Ausgabereduzierer wie tokenjuice.

Plugins müssen `contracts.agentToolResultMiddleware` für jede Ziel-
Laufzeit deklarieren, zum Beispiel `["openclaw", "codex"]`. Installierte Plugins ohne diesen
Vertrag oder ohne explizite Aktivierung können diese Middleware nicht registrieren; behalten Sie
normale OpenClaw-Plugin-Hooks für Arbeit bei, die kein Pre-Model-Tool-Ergebnis-
Timing benötigt. Der alte
Registrierungspfad der Extension Factory nur für eingebettete Runner wurde entfernt.
</Accordion>

### Gateway-Discovery-Registrierung

`api.registerGatewayDiscoveryService(...)` lässt ein Plugin den aktiven
Gateway über einen lokalen Discovery-Transport wie mDNS/Bonjour bewerben. OpenClaw ruft den
Dienst während des Gateway-Starts auf, wenn lokale Discovery aktiviert ist, übergibt die
aktuellen Gateway-Ports und nicht geheimen TXT-Hinweisdaten und ruft den zurückgegebenen
`stop`-Handler beim Gateway-Herunterfahren auf.

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
Authentifizierung behandeln. Discovery ist ein Routing-Hinweis; Gateway-Auth und TLS-Pinning
verantworten weiterhin Vertrauen.

### CLI-Registrierungsmetadaten

`api.registerCli(registrar, opts?)` akzeptiert zwei Arten von Befehlsmetadaten:

- `commands`: explizite Befehlsnamen, die dem Registrar gehören
- `descriptors`: Parse-Time-Befehlsdeskriptoren, die für CLI-Hilfe,
  Routing und Lazy-Plugin-CLI-Registrierung verwendet werden
- `parentPath`: optionaler übergeordneter Befehlspfad für verschachtelte Befehlsgruppen, etwa
  `["nodes"]`

Für Paired-Node-Funktionen bevorzugen Sie
`api.registerNodeCliFeature(registrar, opts?)`. Dies ist ein kleiner Wrapper um
`api.registerCli(..., { parentPath: ["nodes"] })` und macht Befehle wie
`openclaw nodes canvas` zu explizit Plugin-eigenen Node-Funktionen.

Wenn Sie möchten, dass ein Plugin-Befehl im normalen Root-CLI-Pfad lazy-loaded bleibt,
stellen Sie `descriptors` bereit, die jede von diesem Registrar offengelegte
Top-Level-Befehlswurzel abdecken.

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
Dieser eager Kompatibilitätspfad bleibt unterstützt, installiert aber keine
deskriptorgestützten Platzhalter für Parse-Time-Lazy-Loading.

### CLI-Backend-Registrierung

`api.registerCliBackend(...)` lässt ein Plugin die Standardkonfiguration für ein lokales
AI-CLI-Backend wie `claude-cli` oder `my-cli` verantworten.

- Die Backend-`id` wird zum Provider-Präfix in Modellreferenzen wie `my-cli/gpt-5`.
- Die Backend-`config` verwendet dieselbe Form wie `agents.defaults.cliBackends.<id>`.
- Die Benutzerkonfiguration hat weiterhin Vorrang. OpenClaw führt `agents.defaults.cliBackends.<id>` mit dem
  Plugin-Standard zusammen, bevor die CLI ausgeführt wird.
- Verwenden Sie `normalizeConfig`, wenn ein Backend nach dem Zusammenführen Kompatibilitätsumschreibungen benötigt
  (zum Beispiel zum Normalisieren alter Flag-Formen).
- Verwenden Sie `resolveExecutionArgs` für anfragebezogene argv-Umschreibungen, die zum
  CLI-Dialekt gehören, etwa das Zuordnen von OpenClaw-Denkstufen zu einem nativen Effort-
  Flag. Der Hook erhält `ctx.executionMode`; verwenden Sie `"side-question"`, um
  backend-native Isolations-Flags für kurzlebige `/btw`-Aufrufe hinzuzufügen. Wenn diese Flags
  native Tools für eine sonst immer aktive CLI zuverlässig deaktivieren, deklarieren Sie
  zusätzlich `sideQuestionToolMode: "disabled"`.

Eine durchgängige Authoring-Anleitung finden Sie unter
[CLI-Backend-Plugins](/de/plugins/cli-backend-plugins).

### Exklusive Slots

| Methode                                    | Was sie registriert                                                                                                                                                                                                 |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context Engine (jeweils eine aktiv). Lifecycle-Callbacks erhalten `runtimeSettings`, wenn der Host Modell-/Provider-/Modusdiagnosen bereitstellen kann; ältere strikte Engines werden ohne diesen Schlüssel erneut versucht. |
| `api.registerMemoryCapability(capability)` | Vereinheitlichte Speicher-Capability                                                                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Builder für Speicher-Prompt-Abschnitte                                                                                                                                                                               |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver für Speicher-Flush-Pläne                                                                                                                                                                                    |
| `api.registerMemoryRuntime(runtime)`       | Speicher-Runtime-Adapter                                                                                                                                                                                             |

### Veraltete Speicher-Embedding-Adapter

| Methode                                        | Was sie registriert                                |
| ---------------------------------------------- | -------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Speicher-Embedding-Adapter für das aktive Plugin   |

- `registerMemoryCapability` ist die bevorzugte exklusive Speicher-Plugin-API.
- `registerMemoryCapability` kann außerdem `publicArtifacts.listArtifacts(...)`
  verfügbar machen, damit Begleit-Plugins exportierte Speicherartefakte über
  `openclaw/plugin-sdk/memory-host-core` nutzen können, statt in das private Layout
  eines bestimmten Speicher-Plugins zu greifen.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` und
  `registerMemoryRuntime` sind legacy-kompatible exklusive Speicher-Plugin-APIs.
- `MemoryFlushPlan.model` kann den Flush-Turn an eine exakte `provider/model`-
  Referenz wie `ollama/qwen3:8b` binden, ohne die aktive Fallback-
  Kette zu erben.
- `registerMemoryEmbeddingProvider` ist veraltet. Neue Embedding-Provider
  sollten `api.registerEmbeddingProvider(...)` und
  `contracts.embeddingProviders` verwenden.
- Bestehende speicherspezifische Provider funktionieren während des Migrationsfensters
  weiterhin, aber Plugin-Inspektionsberichte weisen dies bei nicht gebündelten
  Plugins als Kompatibilitätsschuld aus.

### Ereignisse und Lifecycle

| Methode                                      | Was sie tut                    |
| -------------------------------------------- | ------------------------------ |
| `api.on(hookName, handler, opts?)`           | Typisierter Lifecycle-Hook     |
| `api.onConversationBindingResolved(handler)` | Callback für Konversationsbindung |

Beispiele, gängige Hook-Namen und Guard-
Semantik finden Sie unter [Plugin-Hooks](/de/plugins/hooks).

### Semantik von Hook-Entscheidungen

`before_install` ist ein Lifecycle-Hook der Plugin-Runtime, nicht die
Installationsrichtlinien-Oberfläche für Operatoren. Verwenden Sie `security.installPolicy`, wenn eine Allow-/Block-Entscheidung
CLI- und Gateway-gestützte Installations- oder Aktualisierungspfade abdecken muss.

- `before_tool_call`: Die Rückgabe von `{ block: true }` ist terminal. Sobald ein Handler sie setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_tool_call`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (genauso wie das Weglassen von `block`), nicht als Überschreibung.
- `before_install`: Die Rückgabe von `{ block: true }` ist terminal. Sobald ein Handler sie setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_install`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (genauso wie das Weglassen von `block`), nicht als Überschreibung.
- `reply_dispatch`: Die Rückgabe von `{ handled: true, ... }` ist terminal. Sobald ein Handler den Dispatch beansprucht, werden Handler mit niedrigerer Priorität und der Standardpfad für Modell-Dispatch übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: true }` ist terminal. Sobald ein Handler sie setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: false }` wird als keine Entscheidung behandelt (genauso wie das Weglassen von `cancel`), nicht als Überschreibung.
- `message_received`: Verwenden Sie das typisierte Feld `threadId`, wenn Sie eingehendes Thread-/Themen-Routing benötigen. Behalten Sie `metadata` für kanalspezifische Extras bei.
- `message_sending`: Verwenden Sie die typisierten Routing-Felder `replyToId` / `threadId`, bevor Sie auf kanalspezifische `metadata` zurückfallen.
- `gateway_start`: Verwenden Sie `ctx.config`, `ctx.workspaceDir` und `ctx.getCron?.()` für Gateway-eigenen Startzustand, statt sich auf interne `gateway:startup`-Hooks zu verlassen.
- `cron_changed`: Beobachtet Änderungen am Gateway-eigenen Cron-Lifecycle. Verwenden Sie `event.job?.state?.nextRunAtMs` und `ctx.getCron?.()`, wenn Sie externe Wake-Scheduler synchronisieren, und behalten Sie OpenClaw als maßgebliche Quelle für Fälligkeitsprüfungen und Ausführung bei.

### API-Objektfelder

| Feld                     | Typ                       | Beschreibung                                                                                |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-ID                                                                                   |
| `api.name`               | `string`                  | Anzeigename                                                                                 |
| `api.version`            | `string?`                 | Plugin-Version (optional)                                                                   |
| `api.description`        | `string?`                 | Plugin-Beschreibung (optional)                                                              |
| `api.source`             | `string`                  | Plugin-Quellpfad                                                                            |
| `api.rootDir`            | `string?`                 | Plugin-Stammverzeichnis (optional)                                                          |
| `api.config`             | `OpenClawConfig`          | Aktueller Konfigurations-Snapshot (aktiver In-Memory-Runtime-Snapshot, wenn verfügbar)      |
| `api.pluginConfig`       | `Record<string, unknown>` | Plugin-spezifische Konfiguration aus `plugins.entries.<id>.config`                          |
| `api.runtime`            | `PluginRuntime`           | [Runtime-Helfer](/de/plugins/sdk-runtime)                                                       |
| `api.logger`             | `PluginLogger`            | Bereichsbezogener Logger (`debug`, `info`, `warn`, `error`)                                 |
| `api.registrationMode`   | `PluginRegistrationMode`  | Aktueller Lademodus; `"setup-runtime"` ist das schlanke Start-/Setup-Fenster vor dem vollständigen Entry |
| `api.resolvePath(input)` | `(string) => string`      | Pfad relativ zum Plugin-Stammverzeichnis auflösen                                           |

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
  Importieren Sie Ihr eigenes Plugin in Produktionscode niemals über
  `openclaw/plugin-sdk/<your-plugin>`. Leiten Sie interne Importe über `./api.ts` oder
  `./runtime-api.ts`. Der SDK-Pfad ist ausschließlich der externe Vertrag.
</Warning>

Öffentliche Oberflächen von per Facade geladenen gebündelten Plugins (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` und ähnliche öffentliche Entry-Dateien) bevorzugen den
aktiven Runtime-Konfigurations-Snapshot, wenn OpenClaw bereits läuft. Wenn noch kein Runtime-
Snapshot vorhanden ist, fallen sie auf die aufgelöste Konfigurationsdatei auf der Festplatte zurück.
Paketierte gebündelte Plugin-Facades sollten über die Plugin-
Facade-Loader von OpenClaw geladen werden; direkte Importe aus `dist/extensions/...` umgehen das Manifest
und die Runtime-Sidecar-Prüfungen, die paketierte Installationen für Plugin-eigenen Code verwenden.

Provider-Plugins können ein schmales Plugin-lokales Contract-Barrel bereitstellen, wenn ein
Helfer absichtlich Provider-spezifisch ist und noch nicht in einen generischen SDK-
Unterpfad gehört. Gebündelte Beispiele:

- **Anthropic**: öffentliche `api.ts`- / `contract-api.ts`-Nahtstelle für Claude-
  Beta-Header- und `service_tier`-Stream-Helfer.
- **`@openclaw/openai-provider`**: `api.ts` exportiert Provider-Builder,
  Standardmodell-Helfer und Realtime-Provider-Builder.
- **`@openclaw/openrouter-provider`**: `api.ts` exportiert den Provider-Builder
  plus Onboarding-/Konfigurationshelfer.

<Warning>
  Produktionscode von Extensions sollte außerdem Importe aus `openclaw/plugin-sdk/<other-plugin>`
  vermeiden. Wenn ein Helfer wirklich gemeinsam genutzt wird, heben Sie ihn in einen neutralen SDK-Unterpfad
  wie `openclaw/plugin-sdk/speech`, `.../provider-model-shared` oder eine andere
  capability-orientierte Oberfläche, statt zwei Plugins miteinander zu koppeln.
</Warning>

## Verwandt

<CardGroup cols={2}>
  <Card title="Entry-Points" icon="door-open" href="/de/plugins/sdk-entrypoints">
    Optionen für `definePluginEntry` und `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime-Helfer" icon="gears" href="/de/plugins/sdk-runtime">
    Vollständige Referenz des `api.runtime`-Namespace.
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
    Detaillierte Architektur und Capability-Modell.
  </Card>
</CardGroup>
