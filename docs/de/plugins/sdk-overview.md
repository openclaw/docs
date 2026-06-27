---
read_when:
    - Sie müssen wissen, aus welchem SDK-Unterpfad Sie importieren müssen
    - Sie möchten eine Referenz für alle Registrierungsmethoden auf OpenClawPluginApi
    - Sie suchen einen bestimmten SDK-Export
sidebarTitle: Plugin SDK overview
summary: Import-Map, Registrierungs-API-Referenz und SDK-Architektur
title: Plugin-SDK-Überblick
x-i18n:
    generated_at: "2026-06-27T17:58:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 69321b569f7609c6ee9312f0234ce94f274bf03822df61988f34e1effb55339e
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

Importieren Sie immer aus einem bestimmten Unterpfad:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Jeder Unterpfad ist ein kleines, eigenständiges Modul. Dadurch bleibt der Start schnell und
Probleme mit zirkulären Abhängigkeiten werden vermieden. Für channelspezifische Entry-/Build-Helfer
bevorzugen Sie `openclaw/plugin-sdk/channel-core`; behalten Sie `openclaw/plugin-sdk/core` für
die breitere Sammeloberfläche und gemeinsame Helfer wie
`buildChannelConfigSchema` bei.

Für Channel-Konfiguration veröffentlichen Sie das channel-eigene JSON Schema über
`openclaw.plugin.json#channelConfigs`. Der Unterpfad `plugin-sdk/channel-config-schema`
ist für gemeinsame Schema-Primitiven und den generischen Builder vorgesehen. Die
gebündelten Plugins von OpenClaw verwenden `plugin-sdk/bundled-channel-config-schema` für beibehaltene
Schemas gebündelter Channels. Veraltete Kompatibilitätsexporte bleiben unter
`plugin-sdk/channel-config-schema-legacy`; keiner der gebündelten Schema-Unterpfade ist ein
Muster für neue Plugins.

<Warning>
  Importieren Sie keine Provider- oder Channel-gebrandeten Convenience-Seams (zum Beispiel
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Gebündelte Plugins kombinieren generische SDK-Unterpfade in ihren eigenen `api.ts`- /
  `runtime-api.ts`-Barrels; Core-Consumer sollten entweder diese plugin-lokalen
  Barrels verwenden oder einen eng gefassten generischen SDK-Vertrag hinzufügen, wenn ein Bedarf wirklich
  channelübergreifend ist.

Eine kleine Reihe von Helfer-Seams für gebündelte Plugins erscheint weiterhin in der generierten Export
Map, wenn sie nachverfolgte Owner-Nutzung haben. Sie existieren nur für die Wartung gebündelter Plugins
und sind keine empfohlenen Importpfade für neue Drittanbieter-Plugins.

`openclaw/plugin-sdk/discord` und `openclaw/plugin-sdk/telegram-account` werden
außerdem als veraltete Kompatibilitäts-Fassaden für nachverfolgte Owner-Nutzung beibehalten. Kopieren Sie
diese Importpfade nicht in neue Plugins; verwenden Sie stattdessen injizierte Runtime-Helfer und
generische Channel-SDK-Unterpfade.
</Warning>

## Unterpfadreferenz

Das Plugin-SDK wird als Satz eng gefasster Unterpfade bereitgestellt, gruppiert nach Bereich (Plugin
Entry, Channel, Provider, Auth, Runtime, Capability, Memory und reservierte
Helfer für gebündelte Plugins). Den vollständigen Katalog, gruppiert und verlinkt, finden Sie unter
[Plugin-SDK-Unterpfade](/de/plugins/sdk-subpaths).

Das Inventar der Compiler-Einstiegspunkte liegt in
`scripts/lib/plugin-sdk-entrypoints.json`; Paketexporte werden aus
der öffentlichen Teilmenge generiert, nachdem repo-lokale Test-/interne Unterpfade abgezogen wurden, die in
`scripts/lib/plugin-sdk-private-local-only-subpaths.json` aufgeführt sind. Führen Sie
`pnpm plugin-sdk:surface` aus, um die Anzahl der öffentlichen Exporte zu prüfen. Veraltete öffentliche
Unterpfade, die alt genug sind und von Produktionscode gebündelter Erweiterungen nicht genutzt werden, werden in
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
ist die generische Embedding-Oberfläche für wiederverwendbare Vektorgenerierung. Memory Search
kann diese generische Provider-Oberfläche nutzen. Der ältere
`api.registerMemoryEmbeddingProvider(...)`- und
`contracts.memoryEmbeddingProviders`-Seam ist veraltete Kompatibilität, während
bestehende memoryspezifische Provider migrieren.

Memoryspezifische Provider, die weiterhin ein Runtime-`batchEmbed(...)` bereitstellen, bleiben beim
bestehenden per-Datei-Batching-Vertrag, es sei denn, ihre Runtime setzt ausdrücklich
`sourceWideBatchEmbed: true`. Dieses Opt-in ermöglicht es dem Memory Host, Chunks aus
mehreren dirty Memory-Dateien und aktivierten Quellen in einem `batchEmbed(...)`-Aufruf zu senden,
bis zu den Batch-Grenzen des Hosts. Batch-Adapter, die JSONL-Anfragedateien hochladen, müssen
Provider-Jobs sowohl vor ihrer Upload-Größenobergrenze als auch vor ihrer Request-Anzahl-Obergrenze
aufteilen. Der Provider muss ein Embedding pro Eingabe-Chunk in derselben Reihenfolge wie
`batch.chunks` zurückgeben; lassen Sie das Flag weg, wenn der Provider dateilokale Batches erwartet oder
die Eingabereihenfolge über einen größeren quellübergreifenden Job hinweg nicht erhalten kann.

### Tools und Befehle

Verwenden Sie [`defineToolPlugin`](/de/plugins/tool-plugins) für einfache reine Tool-Plugins
mit festen Tool-Namen. Verwenden Sie `api.registerTool(...)` direkt für gemischte Plugins
oder vollständig dynamische Tool-Registrierung.

| Methode                         | Was sie registriert                           |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent-Tool (erforderlich oder `{ optional: true }`) |
| `api.registerCommand(def)`      | Benutzerdefinierter Befehl (umgeht das LLM)   |

Plugin-Befehle können `agentPromptGuidance` setzen, wenn der Agent einen kurzen,
befehlseigenen Routing-Hinweis benötigt. Beschränken Sie diesen Text auf den Befehl selbst; fügen Sie keine
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
für `openclaw_main`. Lassen Sie `surfaces` weg, wenn die Guidance absichtlich für alle Oberflächen gelten soll. Übergeben Sie
kein leeres `surfaces`-Array; es wird abgelehnt, damit versehentlicher Scope-Verlust
nicht zu globalem Prompt-Text wird.

Native Entwickleranweisungen des Codex-App-Servers sind strenger als andere Prompt-
Oberflächen: Nur Guidance, die ausdrücklich auf `codex_app_server` begrenzt ist, wird in
diese höher priorisierte Lane hochgestuft. Legacy-String-Guidance und nicht gescoppte strukturierte
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
| `api.registerAgentToolResultMiddleware(...)`   | Runtime-Middleware für Tool-Ergebnisse |
| `api.registerMemoryPromptSupplement(builder)`  | Additiver memorynaher Prompt-Abschnitt |
| `api.registerMemoryCorpusSupplement(adapter)`  | Additiver Memory-Search-/Read-Korpus   |

### Host-Hooks für Workflow-Plugins

Host-Hooks sind die SDK-Seams für Plugins, die am Host-
Lifecycle teilnehmen müssen, statt nur einen Provider, Channel oder ein Tool hinzuzufügen. Sie sind
generische Verträge; Plan Mode kann sie verwenden, aber ebenso Approval-Workflows,
Workspace-Policy-Gates, Hintergrundmonitore, Setup-Assistenten und UI-Companion-
Plugins.

| Methode                                                                              | Zuständiger Vertrag                                                                                                                 |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Plugin-eigener, JSON-kompatibler Sitzungszustand, der über Gateway-Sitzungen projiziert wird                                        |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | Dauerhafter Exactly-once-Kontext, der für eine Sitzung in den nächsten Agent-Turn eingefügt wird                                    |
| `api.registerTrustedToolPolicy(...)`                                                 | Manifest-geschützte, vertrauenswürdige Pre-Plugin-Tool-Policy, die Tool-Parameter blockieren oder umschreiben kann                  |
| `api.registerToolMetadata(...)`                                                      | Anzeigemetadaten für den Tool-Katalog, ohne die Tool-Implementierung zu ändern                                                      |
| `api.registerCommand(...)`                                                           | Bereichsgebundene Plugin-Befehle; Befehlsergebnisse können `continueAgent: true` setzen; native Discord-Befehle unterstützen `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Beitragsdeskriptoren für die Control UI für Sitzungs-, Tool-, Run- oder Einstellungsoberflächen                                     |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Cleanup-Callbacks für Plugin-eigene Runtime-Ressourcen auf Reset-/Delete-/Reload-Pfaden                                            |
| `api.agent.events.registerAgentEventSubscription(...)`                               | Bereinigte Ereignisabonnements für Workflow-Zustand und Monitore                                                                    |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | Plugin-Scratch-Zustand pro Run, der beim terminalen Run-Lebenszyklus gelöscht wird                                                  |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Cleanup-Metadaten für Plugin-eigene Scheduler-Jobs; plant keine Arbeit ein und erstellt keine Task-Datensätze                       |
| `api.session.workflow.sendSessionAttachment(...)`                                    | Nur gebündelte, hostvermittelte Zustellung von Dateianhängen an die aktive direkte Outbound-Sitzungsroute                           |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | Nur gebündelte, Cron-gestützte geplante Sitzungs-Turns plus tagbasierter Cleanup                                                    |
| `api.session.controls.registerSessionAction(...)`                                    | Typisierte Sitzungsaktionen, die Clients über den Gateway dispatchen können                                                         |

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
für bestehende Plugins verfügbar. Fügen Sie keinen neuen Plugin-Code hinzu, der
`api.registerSessionExtension`, `api.enqueueNextTurnInjection`,
`api.registerControlUiDescriptor`, `api.registerRuntimeLifecycle`,
`api.registerAgentEventSubscription`, `api.emitAgentEvent`,
`api.setRunContext`, `api.getRunContext`, `api.clearRunContext`,
`api.registerSessionSchedulerJob`, `api.registerSessionAction`,
`api.sendSessionAttachment`, `api.scheduleSessionTurn` oder
`api.unscheduleSessionTurnsByTag` direkt aufruft.

`scheduleSessionTurn(...)` ist eine sitzungsbezogene Convenience-Funktion über
den Cron-Scheduler des Gateway. Cron ist für das Timing zuständig und erstellt
den Hintergrund-Task-Datensatz, wenn der Turn ausgeführt wird; das Plugin SDK
beschränkt nur die Zielsitzung, Plugin-eigene Benennung und Cleanup. Verwenden
Sie `api.runtime.tasks.managedFlows` innerhalb des geplanten Turns, wenn die
Arbeit selbst dauerhaften mehrstufigen Task-Flow-Zustand benötigt.

Die Verträge trennen die Zuständigkeiten bewusst:

- Externe Plugins können Sitzungserweiterungen, UI-Deskriptoren, Befehle,
  Tool-Metadaten, Next-Turn-Injections und normale Hooks besitzen.
- Vertrauenswürdige Tool-Policies laufen vor gewöhnlichen `before_tool_call`-Hooks
  und sind vom Host vertrauenswürdig. Gebündelte Policies laufen zuerst;
  Policies installierter Plugins benötigen eine explizite Aktivierung plus ihre
  lokalen IDs in `contracts.trustedToolPolicies` und laufen danach in
  Plugin-Ladereihenfolge. Policy-IDs sind auf das registrierende Plugin
  beschränkt.
- Reservierte Befehlszuständigkeit ist nur gebündelten Plugins vorbehalten.
  Externe Plugins sollten ihre eigenen Befehlsnamen oder Aliase verwenden.
- `allowPromptInjection=false` deaktiviert Prompt-mutierende Hooks einschließlich
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  Prompt-Feldern aus dem veralteten `before_agent_start` und
  `enqueueNextTurnInjection`.

Beispiele für Nicht-Plan-Consumer:

| Plugin-Archetyp             | Verwendete Hooks                                                                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Genehmigungs-Workflow       | Sitzungserweiterung, Befehlsfortsetzung, Next-Turn-Injection, UI-Deskriptor                                                         |
| Budget-/Workspace-Policy-Gate | Vertrauenswürdige Tool-Policy, Tool-Metadaten, Sitzungsprojektion                                                                 |
| Hintergrund-Lebenszyklusmonitor | Runtime-Lifecycle-Cleanup, Agent-Ereignisabonnement, Zuständigkeit/Cleanup für Sitzungsscheduler, Heartbeat-Prompt-Beitrag, UI-Deskriptor |
| Setup- oder Onboarding-Assistent | Sitzungserweiterung, bereichsgebundene Befehle, Control-UI-Deskriptor                                                          |

<Note>
  Reservierte Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) bleiben immer `operator.admin`, selbst wenn ein Plugin versucht,
  einen engeren Gateway-Methodenbereich zuzuweisen. Bevorzugen Sie
  Plugin-spezifische Präfixe für Plugin-eigene Methoden.
</Note>

<Accordion title="Wann Tool-Result-Middleware verwendet werden sollte">
  Gebündelte Plugins und explizit aktivierte installierte Plugins mit passenden
  Manifest-Verträgen können `api.registerAgentToolResultMiddleware(...)`
  verwenden, wenn sie ein Tool-Ergebnis nach der Ausführung und bevor die
  Runtime dieses Ergebnis zurück in das Modell einspeist umschreiben müssen.
  Dies ist der vertrauenswürdige, runtime-neutrale Übergang für asynchrone
  Ausgabereduzierer wie tokenjuice.

Plugins müssen `contracts.agentToolResultMiddleware` für jede Ziel-Runtime
deklarieren, zum Beispiel `["openclaw", "codex"]`. Installierte Plugins ohne
diesen Vertrag oder ohne explizite Aktivierung können diese Middleware nicht
registrieren; verwenden Sie normale OpenClaw-Plugin-Hooks für Arbeiten, die kein
Pre-Model-Tool-Result-Timing benötigen. Der alte, nur für Embedded Runner
geltende Registrierungspfad der Extension Factory wurde entfernt.
</Accordion>

### Gateway-Discovery-Registrierung

`api.registerGatewayDiscoveryService(...)` ermöglicht einem Plugin, den aktiven
Gateway über einen lokalen Discovery-Transport wie mDNS/Bonjour anzukündigen.
OpenClaw ruft den Dienst während des Gateway-Starts auf, wenn lokale Discovery
aktiviert ist, übergibt die aktuellen Gateway-Ports und nicht geheimen
TXT-Hinweisdaten und ruft den zurückgegebenen `stop`-Handler während des
Gateway-Shutdowns auf.

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
Authentifizierung behandeln. Discovery ist ein Routing-Hinweis; Gateway-Auth und
TLS-Pinning bleiben für Vertrauen zuständig.

### CLI-Registrierungsmetadaten

`api.registerCli(registrar, opts?)` akzeptiert zwei Arten von Befehlsmetadaten:

- `commands`: explizite Befehlsnamen, die dem Registrar gehören
- `descriptors`: Parse-Zeit-Befehlsdeskriptoren, die für CLI-Hilfe,
  Routing und Lazy-Plugin-CLI-Registrierung verwendet werden
- `parentPath`: optionaler übergeordneter Befehlspfad für verschachtelte
  Befehlsgruppen, zum Beispiel `["nodes"]`

Für Paired-Node-Features bevorzugen Sie
`api.registerNodeCliFeature(registrar, opts?)`. Es ist ein kleiner Wrapper um
`api.registerCli(..., { parentPath: ["nodes"] })` und macht Befehle wie
`openclaw nodes canvas` zu explizit Plugin-eigenen Node-Features.

Wenn ein Plugin-Befehl im normalen Root-CLI-Pfad lazy-loaded bleiben soll,
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

Verschachtelte Befehle erhalten den aufgelösten übergeordneten Befehl als
`program`:

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

Verwenden Sie `commands` allein nur dann, wenn Sie keine Lazy-Root-CLI-Registrierung
benötigen. Dieser eifrige Kompatibilitätspfad bleibt unterstützt, installiert
aber keine descriptor-gestützten Platzhalter für Lazy Loading zur Parse-Zeit.

### CLI-Backend-Registrierung

`api.registerCliBackend(...)` ermöglicht einem Plugin, die Standardkonfiguration
für ein lokales AI-CLI-Backend wie `claude-cli` oder `my-cli` zu besitzen.

- Die Backend-`id` wird zum Provider-Präfix in Modellreferenzen wie `my-cli/gpt-5`.
- Die Backend-`config` verwendet dieselbe Form wie `agents.defaults.cliBackends.<id>`.
- Benutzerkonfiguration hat weiterhin Vorrang. OpenClaw führt
  `agents.defaults.cliBackends.<id>` mit dem Plugin-Standard zusammen, bevor die
  CLI ausgeführt wird.
- Verwenden Sie `normalizeConfig`, wenn ein Backend nach dem Zusammenführen
  Kompatibilitätsumschreibungen benötigt, zum Beispiel das Normalisieren alter
  Flag-Formen.
- Verwenden Sie `resolveExecutionArgs` für request-bezogene argv-Umschreibungen,
  die zum CLI-Dialekt gehören, zum Beispiel das Mapping von
  OpenClaw-Thinking-Levels auf ein natives Effort-Flag. Der Hook erhält
  `ctx.executionMode`; verwenden Sie `"side-question"`, um backend-native
  Isolations-Flags für flüchtige `/btw`-Aufrufe hinzuzufügen. Wenn diese Flags
  native Tools für eine ansonsten immer aktive CLI zuverlässig deaktivieren,
  deklarieren Sie zusätzlich `sideQuestionToolMode: "disabled"`.

Eine End-to-End-Anleitung zur Erstellung finden Sie unter
[CLI-Backend-Plugins](/de/plugins/cli-backend-plugins).

### Exklusive Slots

| Methode                                    | Was registriert wird                                                                                                                                                                                                 |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Kontext-Engine (jeweils eine aktiv). Lebenszyklus-Callbacks erhalten `runtimeSettings`, wenn der Host Modell-/Provider-/Modusdiagnosen bereitstellen kann; ältere strikte Engines werden ohne diesen Schlüssel erneut versucht. |
| `api.registerMemoryCapability(capability)` | Einheitliche Memory-Capability                                                                                                                                                                                       |
| `api.registerMemoryPromptSection(builder)` | Builder für Memory-Prompt-Abschnitte                                                                                                                                                                                  |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver für Memory-Flush-Pläne                                                                                                                                                                                       |
| `api.registerMemoryRuntime(runtime)`       | Memory-Runtime-Adapter                                                                                                                                                                                                |

### Veraltete Memory-Embedding-Adapter

| Methode                                        | Was registriert wird                          |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Memory-Embedding-Adapter für das aktive Plugin |

- `registerMemoryCapability` ist die bevorzugte exklusive Memory-Plugin-API.
- `registerMemoryCapability` kann außerdem `publicArtifacts.listArtifacts(...)`
  bereitstellen, damit Companion-Plugins exportierte Memory-Artefakte über
  `openclaw/plugin-sdk/memory-host-core` nutzen können, statt auf das private
  Layout eines bestimmten Memory-Plugins zuzugreifen.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` und
  `registerMemoryRuntime` sind Legacy-kompatible exklusive Memory-Plugin-APIs.
- `MemoryFlushPlan.model` kann den Flush-Turn auf eine exakte `provider/model`-
  Referenz wie `ollama/qwen3:8b` festlegen, ohne die aktive Fallback-Kette zu
  übernehmen.
- `registerMemoryEmbeddingProvider` ist veraltet. Neue Embedding-Provider
  sollten `api.registerEmbeddingProvider(...)` und
  `contracts.embeddingProviders` verwenden.
- Bestehende memory-spezifische Provider funktionieren während des
  Migrationsfensters weiter, aber die Plugin-Inspektion meldet dies als
  Kompatibilitätsschuld für nicht gebündelte Plugins.

### Ereignisse und Lebenszyklus

| Methode                                      | Was sie tut                       |
| -------------------------------------------- | --------------------------------- |
| `api.on(hookName, handler, opts?)`           | Typisierter Lebenszyklus-Hook     |
| `api.onConversationBindingResolved(handler)` | Callback für Conversation-Binding |

Siehe [Plugin-Hooks](/de/plugins/hooks) für Beispiele, gängige Hook-Namen und
Guard-Semantik.

### Semantik von Hook-Entscheidungen

`before_install` ist ein Plugin-Runtime-Lebenszyklus-Hook, nicht die
Operator-Installationsrichtlinien-Oberfläche. Verwenden Sie
`security.installPolicy`, wenn eine Allow-/Block-Entscheidung CLI- und
Gateway-gestützte Installations- oder Aktualisierungspfade abdecken muss.

- `before_tool_call`: Die Rückgabe von `{ block: true }` ist terminal. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_tool_call`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `block`), nicht als Überschreibung.
- `before_install`: Die Rückgabe von `{ block: true }` ist terminal. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_install`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `block`), nicht als Überschreibung.
- `reply_dispatch`: Die Rückgabe von `{ handled: true, ... }` ist terminal. Sobald ein Handler den Dispatch beansprucht, werden Handler mit niedrigerer Priorität und der Standardpfad für den Model-Dispatch übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: true }` ist terminal. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `cancel`), nicht als Überschreibung.
- `message_received`: Verwenden Sie das typisierte Feld `threadId`, wenn Sie Routing für eingehende Threads/Themen benötigen. Behalten Sie `metadata` für channelspezifische Extras bei.
- `message_sending`: Verwenden Sie die typisierten Routing-Felder `replyToId` / `threadId`, bevor Sie auf channelspezifische `metadata` zurückfallen.
- `gateway_start`: Verwenden Sie `ctx.config`, `ctx.workspaceDir` und `ctx.getCron?.()` für Gateway-eigenen Startzustand, statt sich auf interne `gateway:startup`-Hooks zu verlassen.
- `cron_changed`: Beobachten Sie Gateway-eigene Änderungen am Cron-Lebenszyklus. Verwenden Sie `event.job?.state?.nextRunAtMs` und `ctx.getCron?.()`, wenn Sie externe Wake-Scheduler synchronisieren, und behalten Sie OpenClaw als Source of Truth für Fälligkeitsprüfungen und Ausführung bei.

### Felder des API-Objekts

| Feld                     | Typ                       | Beschreibung                                                                                       |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-ID                                                                                          |
| `api.name`               | `string`                  | Anzeigename                                                                                        |
| `api.version`            | `string?`                 | Plugin-Version (optional)                                                                          |
| `api.description`        | `string?`                 | Plugin-Beschreibung (optional)                                                                     |
| `api.source`             | `string`                  | Plugin-Quellpfad                                                                                   |
| `api.rootDir`            | `string?`                 | Plugin-Stammverzeichnis (optional)                                                                 |
| `api.config`             | `OpenClawConfig`          | Aktueller Config-Snapshot (aktiver In-Memory-Runtime-Snapshot, wenn verfügbar)                     |
| `api.pluginConfig`       | `Record<string, unknown>` | Plugin-spezifische Config aus `plugins.entries.<id>.config`                                        |
| `api.runtime`            | `PluginRuntime`           | [Runtime-Helfer](/de/plugins/sdk-runtime)                                                             |
| `api.logger`             | `PluginLogger`            | Bereichsgebundener Logger (`debug`, `info`, `warn`, `error`)                                       |
| `api.registrationMode`   | `PluginRegistrationMode`  | Aktueller Lademodus; `"setup-runtime"` ist das leichtgewichtige Startup-/Setup-Fenster vor dem vollständigen Entry |
| `api.resolvePath(input)` | `(string) => string`      | Pfad relativ zum Plugin-Stammverzeichnis auflösen                                                  |

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
  `openclaw/plugin-sdk/<your-plugin>`. Leiten Sie interne Importe über
  `./api.ts` oder `./runtime-api.ts`. Der SDK-Pfad ist ausschließlich der
  externe Vertrag.
</Warning>

Öffentliche Oberflächen von per Facade geladenen gebündelten Plugins (`api.ts`,
`runtime-api.ts`, `index.ts`, `setup-entry.ts` und ähnliche öffentliche
Entry-Dateien) bevorzugen den aktiven Runtime-Config-Snapshot, wenn OpenClaw
bereits läuft. Wenn noch kein Runtime-Snapshot vorhanden ist, greifen sie auf
die aufgelöste Config-Datei auf der Festplatte zurück. Packaged gebündelte
Plugin-Facades sollten über die Plugin-Facade-Loader von OpenClaw geladen
werden; direkte Importe aus `dist/extensions/...` umgehen die Manifest- und
Runtime-Sidecar-Prüfungen, die Packaged-Installationen für Plugin-eigenen Code
verwenden.

Provider-Plugins können ein schmales pluginlokales Vertrags-Barrel
bereitstellen, wenn ein Helfer bewusst providerspezifisch ist und noch nicht in
einen generischen SDK-Unterpfad gehört. Gebündelte Beispiele:

- **Anthropic**: öffentliche `api.ts` / `contract-api.ts`-Schnittstelle für
  Claude-Beta-Header- und `service_tier`-Stream-Helfer.
- **`@openclaw/openai-provider`**: `api.ts` exportiert Provider-Builder,
  Helfer für Standardmodelle und Realtime-Provider-Builder.
- **`@openclaw/openrouter-provider`**: `api.ts` exportiert den Provider-Builder
  sowie Onboarding-/Config-Helfer.

<Warning>
  Produktionscode von Erweiterungen sollte auch Importe aus
  `openclaw/plugin-sdk/<other-plugin>` vermeiden. Wenn ein Helfer wirklich
  gemeinsam genutzt wird, heben Sie ihn auf einen neutralen SDK-Unterpfad wie
  `openclaw/plugin-sdk/speech`, `.../provider-model-shared` oder eine andere
  capability-orientierte Oberfläche, statt zwei Plugins miteinander zu koppeln.
</Warning>

## Verwandt

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/de/plugins/sdk-entrypoints">
    Optionen für `definePluginEntry` und `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/de/plugins/sdk-runtime">
    Vollständige Referenz für den Namespace `api.runtime`.
  </Card>
  <Card title="Setup and config" icon="sliders" href="/de/plugins/sdk-setup">
    Packaging, Manifeste und Config-Schemas.
  </Card>
  <Card title="Testing" icon="vial" href="/de/plugins/sdk-testing">
    Testwerkzeuge und Lint-Regeln.
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/de/plugins/sdk-migration">
    Migration von veralteten Oberflächen.
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/de/plugins/architecture">
    Tiefe Architektur und Capability-Modell.
  </Card>
</CardGroup>
