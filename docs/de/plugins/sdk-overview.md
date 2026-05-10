---
read_when:
    - Sie müssen wissen, aus welchem SDK-Unterpfad Sie importieren müssen
    - Sie möchten eine Referenz für alle Registrierungsmethoden von OpenClawPluginApi
    - Sie suchen einen bestimmten SDK-Export
sidebarTitle: Plugin SDK overview
summary: Import-Map, Referenz zur Registrierungs-API und SDK-Architektur
title: Übersicht über das Plugin-SDK
x-i18n:
    generated_at: "2026-05-10T19:46:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ca09b142accc03d8ae897c5da62eab6c25793354e0175742ce1a63d700e64dd
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Das Plugin-SDK ist der typisierte Vertrag zwischen Plugins und Kern. Diese Seite ist die
Referenz dafür, **was Sie importieren** und **was Sie registrieren können**.

<Note>
  Diese Seite richtet sich an Plugin-Autoren, die `openclaw/plugin-sdk/*`
  innerhalb von OpenClaw verwenden. Für externe Apps, Skripte, Dashboards,
  CI-Jobs und IDE-Erweiterungen, die Agents über den Gateway ausführen möchten,
  verwenden Sie stattdessen das
  [OpenClaw App-SDK](/de/concepts/openclaw-sdk) und das Paket `@openclaw/sdk`.
</Note>

<Tip>
Suchen Sie stattdessen eine Anleitung? Beginnen Sie mit [Plugins erstellen](/de/plugins/building-plugins), verwenden Sie [Kanal-Plugins](/de/plugins/sdk-channel-plugins) für Kanal-Plugins, [Provider-Plugins](/de/plugins/sdk-provider-plugins) für Provider-Plugins, [CLI-Backend-Plugins](/de/plugins/cli-backend-plugins) für lokale KI-CLI-Backends und [Plugin-Hooks](/de/plugins/hooks) für Tool- oder Lifecycle-Hook-Plugins.
</Tip>

## Import-Konvention

Importieren Sie immer aus einem spezifischen Unterpfad:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Jeder Unterpfad ist ein kleines, in sich geschlossenes Modul. Das hält den Start
schnell und verhindert Probleme mit zirkulären Abhängigkeiten. Für kanalspezifische
Entry-/Build-Helfer bevorzugen Sie `openclaw/plugin-sdk/channel-core`; behalten
Sie `openclaw/plugin-sdk/core` für die breitere Oberfläche und gemeinsam genutzte
Helfer wie `buildChannelConfigSchema`.

Für die Kanalkonfiguration veröffentlichen Sie das kanaleigene JSON Schema über
`openclaw.plugin.json#channelConfigs`. Der Unterpfad `plugin-sdk/channel-config-schema`
ist für gemeinsam genutzte Schema-Primitiven und den generischen Builder vorgesehen.
Die gebündelten Plugins von OpenClaw verwenden `plugin-sdk/bundled-channel-config-schema`
für beibehaltene Schemas gebündelter Kanäle. Veraltete Kompatibilitätsexporte
bleiben unter `plugin-sdk/channel-config-schema-legacy` erhalten; keiner der
gebündelten Schema-Unterpfade ist ein Muster für neue Plugins.

<Warning>
  Importieren Sie keine Provider- oder kanalmarkengebundenen Komfortschnittstellen
  (zum Beispiel `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`,
  `.../whatsapp`). Gebündelte Plugins setzen generische SDK-Unterpfade innerhalb
  ihrer eigenen `api.ts`- / `runtime-api.ts`-Barrels zusammen; Core-Consumer
  sollten entweder diese Plugin-lokalen Barrels verwenden oder einen schmalen
  generischen SDK-Vertrag hinzufügen, wenn ein Bedarf wirklich kanalübergreifend
  ist.

Eine kleine Menge von Hilfsschnittstellen für gebündelte Plugins erscheint weiterhin
in der generierten Export-Map, wenn dafür nachverfolgte Owner-Nutzung besteht.
Sie existieren nur für die Wartung gebündelter Plugins und werden nicht als
Importpfade für neue Drittanbieter-Plugins empfohlen.

`openclaw/plugin-sdk/discord` und `openclaw/plugin-sdk/telegram-account` werden
außerdem als veraltete Kompatibilitätsfassaden für nachverfolgte Owner-Nutzung
beibehalten. Übernehmen Sie diese Importpfade nicht in neue Plugins; verwenden
Sie stattdessen injizierte Runtime-Helfer und generische Unterpfade des Kanal-SDK.
</Warning>

## Unterpfad-Referenz

Das Plugin-SDK wird als Menge schmaler Unterpfade bereitgestellt, gruppiert nach
Bereichen (Plugin-Entry, Kanal, Provider, Auth, Runtime, Capability, Memory und
reservierte Helfer für gebündelte Plugins). Den vollständigen Katalog, gruppiert
und verlinkt, finden Sie unter [Plugin-SDK-Unterpfade](/de/plugins/sdk-subpaths).

Das Inventar der Compiler-Entrypoints liegt in
`scripts/lib/plugin-sdk-entrypoints.json`; Paketexporte werden aus der öffentlichen
Teilmenge generiert, nachdem repo-lokale Test-/interne Unterpfade abgezogen wurden,
die in `scripts/lib/plugin-sdk-private-local-only-subpaths.json` aufgeführt sind.
Führen Sie `pnpm plugin-sdk:surface` aus, um die Anzahl der öffentlichen Exporte
zu prüfen. Veraltete öffentliche Unterpfade, die alt genug sind und nicht von
Produktionscode gebündelter Erweiterungen genutzt werden, werden in
`scripts/lib/plugin-sdk-deprecated-public-subpaths.json` nachverfolgt; breite
veraltete Re-Export-Barrels werden in
`scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` nachverfolgt.

## Registrierungs-API

Der Callback `register(api)` erhält ein `OpenClawPluginApi`-Objekt mit diesen
Methoden:

### Capability-Registrierung

| Methode                                          | Was sie registriert                  |
| ------------------------------------------------ | ------------------------------------ |
| `api.registerProvider(...)`                      | Text-Inferenz (LLM)                  |
| `api.registerAgentHarness(...)`                  | Experimenteller Low-Level-Agent-Executor |
| `api.registerCliBackend(...)`                    | Lokales CLI-Inferenz-Backend         |
| `api.registerChannel(...)`                       | Messaging-Kanal                      |
| `api.registerSpeechProvider(...)`                | Text-to-Speech- / STT-Synthese       |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming-Echtzeittranskription      |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex-Echtzeit-Sprachsitzungen      |
| `api.registerMediaUnderstandingProvider(...)`    | Bild-/Audio-/Videoanalyse            |
| `api.registerImageGenerationProvider(...)`       | Bildgenerierung                      |
| `api.registerMusicGenerationProvider(...)`       | Musikgenerierung                     |
| `api.registerVideoGenerationProvider(...)`       | Videogenerierung                     |
| `api.registerWebFetchProvider(...)`              | Web-Fetch- / Scrape-Provider         |
| `api.registerWebSearchProvider(...)`             | Websuche                             |

### Tools und Befehle

| Methode                         | Was sie registriert                              |
| ------------------------------- | ------------------------------------------------ |
| `api.registerTool(tool, opts?)` | Agent-Tool (erforderlich oder `{ optional: true }`) |
| `api.registerCommand(def)`      | Benutzerdefinierter Befehl (umgeht das LLM)      |

Plugin-Befehle können `agentPromptGuidance` setzen, wenn der Agent einen kurzen,
befehlseigenen Routing-Hinweis benötigt. Halten Sie diesen Text auf den Befehl
selbst bezogen; fügen Sie keine Provider- oder Plugin-spezifische Policy zu
Core-Prompt-Buildern hinzu.

### Infrastruktur

| Methode                                        | Was sie registriert                       |
| ---------------------------------------------- | ----------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Event-Hook                                |
| `api.registerHttpRoute(params)`                | Gateway-HTTP-Endpunkt                     |
| `api.registerGatewayMethod(name, handler)`     | Gateway-RPC-Methode                       |
| `api.registerGatewayDiscoveryService(service)` | Lokaler Gateway-Discovery-Advertiser      |
| `api.registerCli(registrar, opts?)`            | CLI-Unterbefehl                           |
| `api.registerNodeCliFeature(registrar, opts?)` | Node-Feature-CLI unter `openclaw nodes`   |
| `api.registerService(service)`                 | Hintergrunddienst                         |
| `api.registerInteractiveHandler(registration)` | Interaktiver Handler                      |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime-Tool-Ergebnis-Middleware          |
| `api.registerMemoryPromptSupplement(builder)`  | Additiver, Memory-naher Prompt-Abschnitt  |
| `api.registerMemoryCorpusSupplement(adapter)`  | Additiver Memory-Such-/Lese-Korpus        |

### Host-Hooks für Workflow-Plugins

Host-Hooks sind die SDK-Schnittstellen für Plugins, die am Host-Lifecycle
teilnehmen müssen, anstatt nur einen Provider, Kanal oder ein Tool hinzuzufügen.
Es sind generische Verträge; Plan Mode kann sie verwenden, aber ebenso
Genehmigungsworkflows, Workspace-Policy-Gates, Hintergrundmonitore,
Einrichtungsassistenten und UI-Begleit-Plugins.

| Methode                                                                  | Vertrag, den sie besitzt                                                                                                       |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerSessionExtension(...)`                                      | Plugin-eigener, JSON-kompatibler Sitzungszustand, der über Gateway-Sitzungen projiziert wird                                   |
| `api.enqueueNextTurnInjection(...)`                                      | Dauerhafter Exactly-once-Kontext, der für eine Sitzung in den nächsten Agent-Turn injiziert wird                                |
| `api.registerTrustedToolPolicy(...)`                                     | Gebündelte/vertrauenswürdige Pre-Plugin-Tool-Policy, die Tool-Parameter blockieren oder umschreiben kann                        |
| `api.registerToolMetadata(...)`                                          | Anzeige-Metadaten für den Tool-Katalog, ohne die Tool-Implementierung zu ändern                                                 |
| `api.registerCommand(...)`                                               | Bereichsgebundene Plugin-Befehle; Befehlsergebnisse können `continueAgent: true` setzen; native Discord-Befehle unterstützen `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Control-UI-Beitragsdeskriptoren für Sitzungs-, Tool-, Run- oder Einstellungsoberflächen                                        |
| `api.registerRuntimeLifecycle(...)`                                      | Cleanup-Callbacks für Plugin-eigene Runtime-Ressourcen auf Reset-/Delete-/Reload-Pfaden                                        |
| `api.registerAgentEventSubscription(...)`                                | Bereinigte Event-Abonnements für Workflow-Zustand und Monitore                                                                 |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Plugin-Scratch-State pro Run, der beim terminalen Run-Lifecycle gelöscht wird                                                   |
| `api.registerSessionSchedulerJob(...)`                                   | Plugin-eigene Session-Scheduler-Job-Datensätze mit deterministischem Cleanup                                                   |

Die Verträge trennen die Autorität bewusst:

- Externe Plugins können Sitzungserweiterungen, UI-Deskriptoren, Befehle,
  Tool-Metadaten, Next-Turn-Injections und normale Hooks besitzen.
- Vertrauenswürdige Tool-Policies laufen vor gewöhnlichen `before_tool_call`-Hooks
  und sind nur gebündelt verfügbar, weil sie an der Host-Sicherheits-Policy
  teilnehmen.
- Reservierter Befehlsbesitz ist nur gebündelt verfügbar. Externe Plugins sollten
  ihre eigenen Befehlsnamen oder Aliase verwenden.
- `allowPromptInjection=false` deaktiviert Prompt-mutierende Hooks einschließlich
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  Prompt-Felder aus dem Legacy-`before_agent_start` und
  `enqueueNextTurnInjection`.

Beispiele für Nicht-Plan-Consumer:

| Plugin-Archetyp             | Verwendete Hooks                                                                                                                   |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Genehmigungsworkflow        | Sitzungserweiterung, Befehlsfortsetzung, Next-Turn-Injection, UI-Deskriptor                                                        |
| Budget-/Workspace-Policy-Gate | Vertrauenswürdige Tool-Policy, Tool-Metadaten, Sitzungsprojektion                                                                 |
| Hintergrund-Lifecycle-Monitor | Runtime-Lifecycle-Cleanup, Agent-Event-Abonnement, Besitz/Cleanup des Session-Schedulers, Heartbeat-Prompt-Beitrag, UI-Deskriptor |
| Einrichtungs- oder Onboarding-Assistent | Sitzungserweiterung, bereichsgebundene Befehle, Control-UI-Deskriptor                                                   |

<Note>
  Reservierte Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) bleiben immer `operator.admin`, selbst wenn ein Plugin versucht,
  einen engeren Scope für eine Gateway-Methode zuzuweisen. Bevorzugen Sie
  Plugin-spezifische Präfixe für Plugin-eigene Methoden.
</Note>

<Accordion title="When to use tool-result middleware">
  Gebündelte Plugins können `api.registerAgentToolResultMiddleware(...)` verwenden, wenn
  sie ein Tool-Ergebnis nach der Ausführung und bevor die Runtime
  dieses Ergebnis zurück in das Modell einspeist, umschreiben müssen. Dies ist die vertrauenswürdige runtime-neutrale
  Schnittstelle für asynchrone Ausgabe-Reduzierer wie tokenjuice.

Gebündelte Plugins müssen `contracts.agentToolResultMiddleware` für jede
zielgerichtete Runtime deklarieren, zum Beispiel `["pi", "codex"]`. Externe Plugins
können diese Middleware nicht registrieren; verwenden Sie normale OpenClaw Plugin-Hooks für Arbeit,
die kein Tool-Ergebnis-Timing vor dem Modell benötigt. Der alte, nur für Pi bestimmte eingebettete
Registrierungspfad für Extension-Factorys wurde entfernt.
</Accordion>

### Gateway-Discovery-Registrierung

`api.registerGatewayDiscoveryService(...)` ermöglicht einem Plugin, den aktiven
Gateway über einen lokalen Discovery-Transport wie mDNS/Bonjour bekannt zu machen. OpenClaw ruft den
Service während des Gateway-Starts auf, wenn lokale Discovery aktiviert ist, übergibt die
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

Gateway-Discovery-Plugins dürfen angekündigte TXT-Werte nicht als Geheimnisse oder
Authentifizierung behandeln. Discovery ist ein Routing-Hinweis; Gateway-Auth und TLS-Pinning
bleiben für Vertrauen zuständig.

### CLI-Registrierungsmetadaten

`api.registerCli(registrar, opts?)` akzeptiert zwei Arten von Befehlsmetadaten:

- `commands`: explizite Befehlsnamen, die dem Registrar gehören
- `descriptors`: Parsezeit-Befehlsdeskriptoren für CLI-Hilfe,
  Routing und verzögerte Plugin-CLI-Registrierung
- `parentPath`: optionaler übergeordneter Befehlspfad für verschachtelte Befehlsgruppen, wie
  `["nodes"]`

Für Paired-Node-Funktionen sollten Sie
`api.registerNodeCliFeature(registrar, opts?)` bevorzugen. Dies ist ein kleiner Wrapper um
`api.registerCli(..., { parentPath: ["nodes"] })` und macht Befehle wie
`openclaw nodes canvas` zu expliziten, Plugin-eigenen Node-Funktionen.

Wenn ein Plugin-Befehl im normalen Root-CLI-Pfad verzögert geladen bleiben soll,
stellen Sie `descriptors` bereit, die jede von diesem Registrar bereitgestellte
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

Verwenden Sie `commands` allein nur, wenn Sie keine verzögerte Root-CLI-Registrierung benötigen.
Dieser eifrige Kompatibilitätspfad bleibt unterstützt, installiert jedoch keine
deskriptorbasierten Platzhalter für verzögertes Laden zur Parsezeit.

### CLI-Backend-Registrierung

`api.registerCliBackend(...)` ermöglicht einem Plugin, die Standardkonfiguration für ein lokales
AI-CLI-Backend wie `codex-cli` zu besitzen.

- Die Backend-`id` wird zum Provider-Präfix in Modellreferenzen wie `codex-cli/gpt-5`.
- Die Backend-`config` verwendet dieselbe Form wie `agents.defaults.cliBackends.<id>`.
- Benutzerkonfiguration hat weiterhin Vorrang. OpenClaw führt `agents.defaults.cliBackends.<id>` vor dem
  Ausführen der CLI über den Plugin-Standard zusammen.
- Verwenden Sie `normalizeConfig`, wenn ein Backend nach dem Zusammenführen Kompatibilitätsumschreibungen benötigt
  (zum Beispiel die Normalisierung alter Flag-Formen).
- Verwenden Sie `resolveExecutionArgs` für anfragebezogene argv-Umschreibungen, die zum
  CLI-Dialekt gehören, etwa das Zuordnen von OpenClaw Denkstufen zu einem nativen Effort-
  Flag.

Eine End-to-End-Anleitung zum Authoring finden Sie unter
[CLI-Backend-Plugins](/de/plugins/cli-backend-plugins).

### Exklusive Slots

| Methode                                    | Was sie registriert                                                                                                                                              |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Kontext-Engine (jeweils eine aktiv). Der `assemble()`-Callback erhält `availableTools` und `citationsMode`, damit die Engine Prompt-Ergänzungen anpassen kann. |
| `api.registerMemoryCapability(capability)` | Vereinheitlichte Speicher-Capability                                                                                                                            |
| `api.registerMemoryPromptSection(builder)` | Builder für Speicher-Prompt-Abschnitte                                                                                                                          |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver für Speicher-Flush-Pläne                                                                                                                               |
| `api.registerMemoryRuntime(runtime)`       | Runtime-Adapter für Speicher                                                                                                                                     |

### Speicher-Embedding-Adapter

| Methode                                        | Was sie registriert                                  |
| ---------------------------------------------- | ---------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Speicher-Embedding-Adapter für das aktive Plugin     |

- `registerMemoryCapability` ist die bevorzugte exklusive Speicher-Plugin-API.
- `registerMemoryCapability` kann außerdem `publicArtifacts.listArtifacts(...)`
  bereitstellen, damit Companion-Plugins exportierte Speicherartefakte über
  `openclaw/plugin-sdk/memory-host-core` konsumieren können, statt in das private
  Layout eines bestimmten Speicher-Plugins zu greifen.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` und
  `registerMemoryRuntime` sind legacy-kompatible exklusive Speicher-Plugin-APIs.
- `MemoryFlushPlan.model` kann den Flush-Turn auf eine exakte `provider/model`-
  Referenz festlegen, wie `ollama/qwen3:8b`, ohne die aktive Fallback-
  Kette zu erben.
- `registerMemoryEmbeddingProvider` ermöglicht dem aktiven Speicher-Plugin, eine
  oder mehrere Embedding-Adapter-IDs zu registrieren (zum Beispiel `openai`, `gemini` oder eine benutzerdefinierte,
  vom Plugin definierte ID).
- Benutzerkonfiguration wie `agents.defaults.memorySearch.provider` und
  `agents.defaults.memorySearch.fallback` wird gegen diese registrierten
  Adapter-IDs aufgelöst.

### Ereignisse und Lebenszyklus

| Methode                                      | Was sie tut                  |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Typisierter Lifecycle-Hook   |
| `api.onConversationBindingResolved(handler)` | Callback für Konversationsbindung |

Beispiele, gängige Hook-Namen und Guard-Semantik finden Sie unter [Plugin-Hooks](/de/plugins/hooks).

### Hook-Entscheidungssemantik

- `before_tool_call`: Das Zurückgeben von `{ block: true }` ist terminal. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_tool_call`: Das Zurückgeben von `{ block: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `block`), nicht als Überschreibung.
- `before_install`: Das Zurückgeben von `{ block: true }` ist terminal. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_install`: Das Zurückgeben von `{ block: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `block`), nicht als Überschreibung.
- `reply_dispatch`: Das Zurückgeben von `{ handled: true, ... }` ist terminal. Sobald ein Handler den Versand beansprucht, werden Handler mit niedrigerer Priorität und der Standardpfad für Modellversand übersprungen.
- `message_sending`: Das Zurückgeben von `{ cancel: true }` ist terminal. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `message_sending`: Das Zurückgeben von `{ cancel: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `cancel`), nicht als Überschreibung.
- `message_received`: Verwenden Sie das typisierte Feld `threadId`, wenn Sie Routing für eingehende Threads/Themen benötigen. Behalten Sie `metadata` für kanalspezifische Extras bei.
- `message_sending`: Verwenden Sie typisierte Routing-Felder `replyToId` / `threadId`, bevor Sie auf kanalspezifische `metadata` zurückfallen.
- `gateway_start`: Verwenden Sie `ctx.config`, `ctx.workspaceDir` und `ctx.getCron?.()` für den vom Gateway verwalteten Startzustand, statt sich auf interne `gateway:startup`-Hooks zu verlassen.
- `cron_changed`: Beobachten Sie vom Gateway verwaltete Cron-Lifecycle-Änderungen. Verwenden Sie `event.job?.state?.nextRunAtMs` und `ctx.getCron?.()`, wenn Sie externe Wake-Scheduler synchronisieren, und behalten Sie OpenClaw als Source of Truth für Fälligkeitsprüfungen und Ausführung bei.

### API-Objektfelder

| Feld                     | Typ                       | Beschreibung                                                                                         |
| ------------------------ | ------------------------- | ---------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-ID                                                                                            |
| `api.name`               | `string`                  | Anzeigename                                                                                          |
| `api.version`            | `string?`                 | Plugin-Version (optional)                                                                            |
| `api.description`        | `string?`                 | Plugin-Beschreibung (optional)                                                                       |
| `api.source`             | `string`                  | Plugin-Quellpfad                                                                                     |
| `api.rootDir`            | `string?`                 | Plugin-Stammverzeichnis (optional)                                                                   |
| `api.config`             | `OpenClawConfig`          | Aktueller Konfigurations-Snapshot (aktiver In-Memory-Runtime-Snapshot, sofern verfügbar)             |
| `api.pluginConfig`       | `Record<string, unknown>` | Plugin-spezifische Konfiguration aus `plugins.entries.<id>.config`                                   |
| `api.runtime`            | `PluginRuntime`           | [Runtime-Hilfsfunktionen](/de/plugins/sdk-runtime)                                                       |
| `api.logger`             | `PluginLogger`            | Bereichsgebundener Logger (`debug`, `info`, `warn`, `error`)                                         |
| `api.registrationMode`   | `PluginRegistrationMode`  | Aktueller Lademodus; `"setup-runtime"` ist das schlanke Start-/Setup-Fenster vor dem vollständigen Entry |
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
  Importieren Sie Ihr eigenes Plugin niemals aus Produktionscode über `openclaw/plugin-sdk/<your-plugin>`.
  Leiten Sie interne Importe über `./api.ts` oder
  `./runtime-api.ts`. Der SDK-Pfad ist ausschließlich der externe Vertrag.
</Warning>

Öffentliche Oberflächen von über Facades geladenen gebündelten Plugins (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` und ähnliche öffentliche Einstiegspunktdateien) bevorzugen den
aktiven Runtime-Konfigurations-Snapshot, wenn OpenClaw bereits läuft. Wenn noch kein Runtime-
Snapshot vorhanden ist, greifen sie auf die aufgelöste Konfigurationsdatei auf dem Datenträger zurück.
Paketierte gebündelte Plugin-Facades sollten über die Plugin-Facade-Loader von OpenClaw
geladen werden; direkte Importe aus `dist/extensions/...` umgehen das Manifest
und die Runtime-Sidecar-Prüfungen, die paketierte Installationen für Plugin-eigenen Code verwenden.

Provider-Plugins können ein schmales Plugin-lokales Contract-Barrel bereitstellen, wenn ein
Helper absichtlich Provider-spezifisch ist und noch nicht in einen generischen SDK-
Unterpfad gehört. Gebündelte Beispiele:

- **Anthropic**: öffentliche Nahtstelle `api.ts` / `contract-api.ts` für Claude-
  Beta-Header und `service_tier`-Stream-Helper.
- **`@openclaw/openai-provider`**: `api.ts` exportiert Provider-Builder,
  Standardmodell-Helper und Realtime-Provider-Builder.
- **`@openclaw/openrouter-provider`**: `api.ts` exportiert den Provider-Builder
  sowie Onboarding-/Konfigurations-Helper.

<Warning>
  Produktionscode von Erweiterungen sollte außerdem Importe aus `openclaw/plugin-sdk/<other-plugin>`
  vermeiden. Wenn ein Helper wirklich gemeinsam genutzt wird, verschieben Sie ihn in einen neutralen SDK-Unterpfad
  wie `openclaw/plugin-sdk/speech`, `.../provider-model-shared` oder eine andere
  fähigkeitsorientierte Oberfläche, statt zwei Plugins miteinander zu koppeln.
</Warning>

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Einstiegspunkte" icon="door-open" href="/de/plugins/sdk-entrypoints">
    Optionen für `definePluginEntry` und `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime-Helper" icon="gears" href="/de/plugins/sdk-runtime">
    Vollständige Referenz für den Namespace `api.runtime`.
  </Card>
  <Card title="Einrichtung und Konfiguration" icon="sliders" href="/de/plugins/sdk-setup">
    Paketierung, Manifeste und Konfigurationsschemas.
  </Card>
  <Card title="Testen" icon="vial" href="/de/plugins/sdk-testing">
    Testhilfsprogramme und Lint-Regeln.
  </Card>
  <Card title="SDK-Migration" icon="arrows-turn-right" href="/de/plugins/sdk-migration">
    Migration von veralteten Oberflächen.
  </Card>
  <Card title="Plugin-Interna" icon="diagram-project" href="/de/plugins/architecture">
    Tiefgehende Architektur und Fähigkeitsmodell.
  </Card>
</CardGroup>
