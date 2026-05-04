---
read_when:
    - Sie müssen wissen, aus welchem SDK-Unterpfad Sie importieren müssen
    - Sie möchten eine Referenz für alle Registrierungsmethoden von OpenClawPluginApi
    - Sie suchen nach einem bestimmten SDK-Export
sidebarTitle: Plugin SDK overview
summary: Import-Map, Referenz zur Registrierungs-API und SDK-Architektur
title: Übersicht zum Plugin SDK
x-i18n:
    generated_at: "2026-05-04T18:24:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8187e7d4cfb9d6fb19bbdebfbaea0bb4d98fa5cea4742d0f82a765ae5bc60127
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Das Plugin-SDK ist die typisierte Schnittstelle zwischen Plugins und Core. Diese Seite ist die
Referenz dafür, **was importiert werden soll** und **was Sie registrieren können**.

<Note>
  Diese Seite richtet sich an Plugin-Autoren, die `openclaw/plugin-sdk/*` innerhalb von
  OpenClaw verwenden. Für externe Apps, Skripte, Dashboards, CI-Jobs und IDE-Erweiterungen,
  die Agents über den Gateway ausführen möchten, verwenden Sie stattdessen das
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
Probleme mit zirkulären Abhängigkeiten werden vermieden. Für Channel-spezifische Entry-/Build-Helfer
bevorzugen Sie `openclaw/plugin-sdk/channel-core`; behalten Sie `openclaw/plugin-sdk/core` für
die breitere Sammeloberfläche und gemeinsam genutzte Helfer wie
`buildChannelConfigSchema` bei.

Für die Channel-Konfiguration veröffentlichen Sie das Channel-eigene JSON Schema über
`openclaw.plugin.json#channelConfigs`. Der Unterpfad `plugin-sdk/channel-config-schema`
ist für gemeinsam genutzte Schema-Primitiven und den generischen Builder vorgesehen. Die
gebündelten Plugins von OpenClaw verwenden `plugin-sdk/bundled-channel-config-schema` für beibehaltene
Schemas gebündelter Channels. Veraltete Kompatibilitätsexporte verbleiben unter
`plugin-sdk/channel-config-schema-legacy`; keiner der beiden gebündelten Schema-Unterpfade ist ein
Muster für neue Plugins.

<Warning>
  Importieren Sie keine Provider- oder Channel-gebrandeten Convenience-Schnittstellen (zum Beispiel
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Gebündelte Plugins setzen generische SDK-Unterpfade innerhalb ihrer eigenen `api.ts`-/
  `runtime-api.ts`-Barrels zusammen; Core-Consumer sollten entweder diese Plugin-lokalen
  Barrels verwenden oder einen engen generischen SDK-Vertrag hinzufügen, wenn ein Bedarf wirklich
  Channel-übergreifend ist.

Eine kleine Gruppe von Helfer-Schnittstellen für gebündelte Plugins erscheint weiterhin in der generierten Export-Map,
wenn sie nachverfolgte Owner-Nutzung haben. Sie existieren nur für die Wartung gebündelter Plugins
und werden nicht als Importpfade für neue Drittanbieter-Plugins empfohlen.

`openclaw/plugin-sdk/discord` und `openclaw/plugin-sdk/telegram-account` werden
ebenfalls als veraltete Kompatibilitäts-Fassaden für nachverfolgte Owner-Nutzung beibehalten. Kopieren Sie
diese Importpfade nicht in neue Plugins; verwenden Sie stattdessen injizierte Runtime-Helfer und
generische Channel-SDK-Unterpfade.
</Warning>

## Unterpfadreferenz

Das Plugin-SDK wird als Sammlung enger Unterpfade bereitgestellt, gruppiert nach Bereich (Plugin-
Entry, Channel, Provider, Authentifizierung, Runtime, Capability, Memory und reservierte
Helfer für gebündelte Plugins). Den vollständigen Katalog, gruppiert und verlinkt, finden Sie unter
[Plugin-SDK-Unterpfade](/de/plugins/sdk-subpaths).

Die generierte Liste mit über 200 Unterpfaden befindet sich in `scripts/lib/plugin-sdk-entrypoints.json`.

## Registrierungs-API

Der Callback `register(api)` erhält ein `OpenClawPluginApi`-Objekt mit diesen
Methoden:

### Capability-Registrierung

| Methode                                          | Was registriert wird                  |
| ------------------------------------------------ | ------------------------------------- |
| `api.registerProvider(...)`                      | Textinferenz (LLM)                    |
| `api.registerAgentHarness(...)`                  | Experimenteller Low-Level-Agent-Executor |
| `api.registerCliBackend(...)`                    | Lokales CLI-Inferenz-Backend          |
| `api.registerChannel(...)`                       | Messaging-Channel                     |
| `api.registerSpeechProvider(...)`                | Text-to-Speech-/STT-Synthese          |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming-Echtzeittranskription       |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex-Echtzeit-Sprachsitzungen       |
| `api.registerMediaUnderstandingProvider(...)`    | Bild-/Audio-/Videoanalyse             |
| `api.registerImageGenerationProvider(...)`       | Bilderzeugung                         |
| `api.registerMusicGenerationProvider(...)`       | Musikerzeugung                        |
| `api.registerVideoGenerationProvider(...)`       | Videoerzeugung                        |
| `api.registerWebFetchProvider(...)`              | Web-Fetch-/Scrape-Provider            |
| `api.registerWebSearchProvider(...)`             | Websuche                              |

### Tools und Befehle

| Methode                         | Was registriert wird                         |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent-Tool (erforderlich oder `{ optional: true }`) |
| `api.registerCommand(def)`      | Benutzerdefinierter Befehl (umgeht das LLM)   |

Plugin-Befehle können `agentPromptGuidance` setzen, wenn der Agent einen kurzen,
befehlsseitigen Routing-Hinweis benötigt. Beschränken Sie diesen Text auf den Befehl selbst; fügen Sie keine
Provider- oder Plugin-spezifische Policy zu Core-Prompt-Buildern hinzu.

### Infrastruktur

| Methode                                        | Was registriert wird                        |
| ---------------------------------------------- | ------------------------------------------ |
| `api.registerHook(events, handler, opts?)`     | Event-Hook                                 |
| `api.registerHttpRoute(params)`                | Gateway-HTTP-Endpunkt                      |
| `api.registerGatewayMethod(name, handler)`     | Gateway-RPC-Methode                        |
| `api.registerGatewayDiscoveryService(service)` | Lokaler Gateway-Discovery-Advertiser       |
| `api.registerCli(registrar, opts?)`            | CLI-Unterbefehl                            |
| `api.registerService(service)`                 | Hintergrunddienst                          |
| `api.registerInteractiveHandler(registration)` | Interaktiver Handler                       |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime-Middleware für Tool-Ergebnisse     |
| `api.registerMemoryPromptSupplement(builder)`  | Additiver Prompt-Abschnitt nahe Memory     |
| `api.registerMemoryCorpusSupplement(adapter)`  | Additiver Memory-Such-/Lese-Korpus         |

### Host-Hooks für Workflow-Plugins

Host-Hooks sind die SDK-Schnittstellen für Plugins, die am Host-
Lifecycle teilnehmen müssen, statt nur einen Provider, Channel oder ein Tool hinzuzufügen. Sie sind
generische Verträge; Plan Mode kann sie verwenden, ebenso aber Approval-Workflows,
Workspace-Policy-Gates, Hintergrundmonitore, Einrichtungsassistenten und UI-Begleit-
Plugins.

| Methode                                                                  | Vertrag, den sie besitzt                                                                                                           |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Plugin-eigener, JSON-kompatibler Sitzungszustand, der über Gateway-Sitzungen projiziert wird                                      |
| `api.enqueueNextTurnInjection(...)`                                      | Dauerhafter Exactly-once-Kontext, der in den nächsten Agent-Turn für eine Sitzung injiziert wird                                  |
| `api.registerTrustedToolPolicy(...)`                                     | Gebündelte/vertrauenswürdige Pre-Plugin-Tool-Policy, die Tool-Parameter blockieren oder umschreiben kann                         |
| `api.registerToolMetadata(...)`                                          | Anzeige-Metadaten des Tool-Katalogs, ohne die Tool-Implementierung zu ändern                                                      |
| `api.registerCommand(...)`                                               | Scoped Plugin-Befehle; Befehlsergebnisse können `continueAgent: true` setzen; native Discord-Befehle unterstützen `descriptionLocalizations` |
| `api.registerControlUiDescriptor(...)`                                   | Control-UI-Beitragsdeskriptoren für Sitzungs-, Tool-, Lauf- oder Einstellungsoberflächen                                          |
| `api.registerRuntimeLifecycle(...)`                                      | Cleanup-Callbacks für Plugin-eigene Runtime-Ressourcen auf Reset-/Delete-/Reload-Pfaden                                          |
| `api.registerAgentEventSubscription(...)`                                | Bereinigte Event-Abonnements für Workflow-Zustand und Monitore                                                                    |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Plugin-Scratch-State pro Lauf, der beim terminalen Lauf-Lifecycle gelöscht wird                                                   |
| `api.registerSessionSchedulerJob(...)`                                   | Plugin-eigene Session-Scheduler-Job-Records mit deterministischem Cleanup                                                         |

Die Verträge teilen Autorität bewusst auf:

- Externe Plugins können Session-Erweiterungen, UI-Deskriptoren, Befehle, Tool-
  Metadaten, Next-Turn-Injections und normale Hooks besitzen.
- Vertrauenswürdige Tool-Policies laufen vor gewöhnlichen `before_tool_call`-Hooks und sind
  nur gebündelt, weil sie an der Host-Sicherheits-Policy teilnehmen.
- Reservierter Befehlsbesitz ist nur gebündelt. Externe Plugins sollten ihre
  eigenen Befehlsnamen oder Aliase verwenden.
- `allowPromptInjection=false` deaktiviert prompt-verändernde Hooks einschließlich
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  Prompt-Felder aus dem Legacy-`before_agent_start` und
  `enqueueNextTurnInjection`.

Beispiele für Nicht-Plan-Consumer:

| Plugin-Archetyp             | Verwendete Hooks                                                                                                                    |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Approval-Workflow            | Session-Erweiterung, Befehlsfortsetzung, Next-Turn-Injection, UI-Deskriptor                                                        |
| Budget-/Workspace-Policy-Gate | Vertrauenswürdige Tool-Policy, Tool-Metadaten, Sitzungsprojektion                                                                  |
| Hintergrund-Lifecycle-Monitor | Runtime-Lifecycle-Cleanup, Agent-Event-Abonnement, Session-Scheduler-Besitz/-Cleanup, Heartbeat-Prompt-Beitrag, UI-Deskriptor      |
| Einrichtungs- oder Onboarding-Assistent | Session-Erweiterung, scoped Befehle, Control-UI-Deskriptor                                                               |

<Note>
  Reservierte Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) bleiben immer `operator.admin`, selbst wenn ein Plugin versucht, einen
  engeren Gateway-Methoden-Scope zuzuweisen. Bevorzugen Sie Plugin-spezifische Präfixe für
  Plugin-eigene Methoden.
</Note>

<Accordion title="When to use tool-result middleware">
  Gebündelte Plugins können `api.registerAgentToolResultMiddleware(...)` verwenden, wenn
  sie ein Tool-Ergebnis nach der Ausführung und bevor die Runtime
  dieses Ergebnis zurück in das Modell einspeist, umschreiben müssen. Dies ist die vertrauenswürdige Runtime-neutrale
  Schnittstelle für asynchrone Output-Reducer wie tokenjuice.

Gebündelte Plugins müssen `contracts.agentToolResultMiddleware` für jede
Ziel-Runtime deklarieren, zum Beispiel `["pi", "codex"]`. Externe Plugins
können diese Middleware nicht registrieren; verwenden Sie normale OpenClaw-Plugin-Hooks für Arbeit,
die kein Timing für Tool-Ergebnisse vor dem Modell benötigt. Der alte, nur für Pi bestimmte eingebettete
Registrierungspfad der Extension-Factory wurde entfernt.
</Accordion>

### Gateway-Discovery-Registrierung

`api.registerGatewayDiscoveryService(...)` ermöglicht einem Plugin, den aktiven
Gateway über einen lokalen Erkennungstransport wie mDNS/Bonjour anzukündigen. OpenClaw ruft den
Dienst während des Gateway-Starts auf, wenn lokale Erkennung aktiviert ist, übergibt die
aktuellen Gateway-Ports und nicht geheimen TXT-Hinweisdaten und ruft beim
Herunterfahren des Gateways den zurückgegebenen `stop`-Handler auf.

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

Gateway-Erkennungs-Plugins dürfen angekündigte TXT-Werte nicht als Geheimnisse oder
Authentifizierung behandeln. Erkennung ist ein Routing-Hinweis; Gateway-Authentifizierung und TLS-Pinning
bleiben für die Vertrauensstellung zuständig.

### CLI-Registrierungsmetadaten

`api.registerCli(registrar, opts?)` akzeptiert zwei Arten von Metadaten auf oberster Ebene:

- `commands`: explizite Befehlswurzeln im Besitz des Registrars
- `descriptors`: Deskriptoren für Befehle zur Parse-Zeit, die für die Root-CLI-Hilfe,
  das Routing und die verzögerte CLI-Registrierung von Plugins verwendet werden

Wenn ein Plugin-Befehl im normalen Root-CLI-Pfad verzögert geladen bleiben soll,
stellen Sie `descriptors` bereit, die jede von diesem Registrar bereitgestellte
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
Dieser eifrige Kompatibilitätspfad wird weiterhin unterstützt, installiert jedoch keine
deskriptorbasierten Platzhalter für verzögertes Laden zur Parse-Zeit.

### CLI-Backend-Registrierung

`api.registerCliBackend(...)` ermöglicht einem Plugin, die Standardkonfiguration für ein lokales
KI-CLI-Backend wie `codex-cli` zu besitzen.

- Die Backend-`id` wird zum Provider-Präfix in Modellreferenzen wie `codex-cli/gpt-5`.
- Die Backend-`config` verwendet dieselbe Form wie `agents.defaults.cliBackends.<id>`.
- Die Benutzerkonfiguration hat weiterhin Vorrang. OpenClaw führt `agents.defaults.cliBackends.<id>` mit dem
  Plugin-Standard zusammen, bevor die CLI ausgeführt wird.
- Verwenden Sie `normalizeConfig`, wenn ein Backend nach dem Zusammenführen Kompatibilitätsumschreibungen benötigt
  (zum Beispiel die Normalisierung alter Flag-Formen).
- Verwenden Sie `resolveExecutionArgs` für anfragebezogene argv-Umschreibungen, die zum
  CLI-Dialekt gehören, etwa das Zuordnen von OpenClaw-Denkstufen zu einem nativen Effort-Flag.

### Exklusive Slots

| Methode                                    | Was sie registriert                                                                                                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Kontext-Engine (jeweils eine aktiv). Der `assemble()`-Callback erhält `availableTools` und `citationsMode`, damit die Engine Prompt-Ergänzungen anpassen kann. |
| `api.registerMemoryCapability(capability)` | Einheitliche Memory-Funktion                                                                                                                                             |
| `api.registerMemoryPromptSection(builder)` | Builder für Memory-Prompt-Abschnitte                                                                                                                                     |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver für Memory-Flush-Pläne                                                                                                                                          |
| `api.registerMemoryRuntime(runtime)`       | Memory-Runtime-Adapter                                                                                                                                                   |

### Memory-Embedding-Adapter

| Methode                                        | Was sie registriert                                  |
| ---------------------------------------------- | ---------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Memory-Embedding-Adapter für das aktive Plugin       |

- `registerMemoryCapability` ist die bevorzugte exklusive Memory-Plugin-API.
- `registerMemoryCapability` kann außerdem `publicArtifacts.listArtifacts(...)`
  bereitstellen, damit Begleit-Plugins exportierte Memory-Artefakte über
  `openclaw/plugin-sdk/memory-host-core` nutzen können, statt auf das private Layout eines bestimmten
  Memory-Plugins zuzugreifen.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` und
  `registerMemoryRuntime` sind abwärtskompatible exklusive Memory-Plugin-APIs.
- `MemoryFlushPlan.model` kann den Flush-Turn an eine exakte `provider/model`-
  Referenz wie `ollama/qwen3:8b` binden, ohne die aktive Fallback-
  Kette zu übernehmen.
- `registerMemoryEmbeddingProvider` ermöglicht dem aktiven Memory-Plugin, eine
  oder mehrere Embedding-Adapter-IDs zu registrieren (zum Beispiel `openai`, `gemini` oder eine benutzerdefinierte
  vom Plugin definierte ID).
- Benutzerkonfiguration wie `agents.defaults.memorySearch.provider` und
  `agents.defaults.memorySearch.fallback` wird gegen diese registrierten
  Adapter-IDs aufgelöst.

### Ereignisse und Lebenszyklus

| Methode                                      | Was sie bewirkt                    |
| -------------------------------------------- | ---------------------------------- |
| `api.on(hookName, handler, opts?)`           | Typisierter Lebenszyklus-Hook      |
| `api.onConversationBindingResolved(handler)` | Callback für Konversationsbindung  |

Siehe [Plugin-Hooks](/de/plugins/hooks) für Beispiele, gängige Hook-Namen und Guard-
Semantik.

### Semantik von Hook-Entscheidungen

- `before_tool_call`: Die Rückgabe von `{ block: true }` ist terminal. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_tool_call`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (genauso wie das Weglassen von `block`), nicht als Überschreibung.
- `before_install`: Die Rückgabe von `{ block: true }` ist terminal. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_install`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (genauso wie das Weglassen von `block`), nicht als Überschreibung.
- `reply_dispatch`: Die Rückgabe von `{ handled: true, ... }` ist terminal. Sobald ein Handler den Versand beansprucht, werden Handler mit niedrigerer Priorität und der Standardpfad für den Modellversand übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: true }` ist terminal. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: false }` wird als keine Entscheidung behandelt (genauso wie das Weglassen von `cancel`), nicht als Überschreibung.
- `message_received`: Verwenden Sie das typisierte Feld `threadId`, wenn Sie eingehendes Thread-/Topic-Routing benötigen. Behalten Sie `metadata` für kanalspezifische Extras bei.
- `message_sending`: Verwenden Sie die typisierten Routing-Felder `replyToId` / `threadId`, bevor Sie auf kanalspezifische `metadata` zurückfallen.
- `gateway_start`: Verwenden Sie `ctx.config`, `ctx.workspaceDir` und `ctx.getCron?.()` für gatewayeigenen Startzustand, statt sich auf interne `gateway:startup`-Hooks zu verlassen.
- `cron_changed`: Beobachten Sie gatewayeigene Cron-Lebenszyklusänderungen. Verwenden Sie `event.job?.state?.nextRunAtMs` und `ctx.getCron?.()`, wenn Sie externe Wake-Scheduler synchronisieren, und behalten Sie OpenClaw als Quelle der Wahrheit für Fälligkeitsprüfungen und Ausführung bei.

### API-Objektfelder

| Feld                     | Typ                       | Beschreibung                                                                                       |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-ID                                                                                          |
| `api.name`               | `string`                  | Anzeigename                                                                                        |
| `api.version`            | `string?`                 | Plugin-Version (optional)                                                                          |
| `api.description`        | `string?`                 | Plugin-Beschreibung (optional)                                                                     |
| `api.source`             | `string`                  | Plugin-Quellpfad                                                                                   |
| `api.rootDir`            | `string?`                 | Plugin-Stammverzeichnis (optional)                                                                 |
| `api.config`             | `OpenClawConfig`          | Aktueller Konfigurations-Snapshot (aktiver In-Memory-Runtime-Snapshot, wenn verfügbar)             |
| `api.pluginConfig`       | `Record<string, unknown>` | Plugin-spezifische Konfiguration aus `plugins.entries.<id>.config`                                 |
| `api.runtime`            | `PluginRuntime`           | [Runtime-Hilfsfunktionen](/de/plugins/sdk-runtime)                                                     |
| `api.logger`             | `PluginLogger`            | Bereichsgebundener Logger (`debug`, `info`, `warn`, `error`)                                       |
| `api.registrationMode`   | `PluginRegistrationMode`  | Aktueller Lademodus; `"setup-runtime"` ist das schlanke Start-/Einrichtungsfenster vor dem vollständigen Einstieg |
| `api.resolvePath(input)` | `(string) => string`      | Pfad relativ zum Plugin-Stamm auflösen                                                             |

## Konvention für interne Module

Verwenden Sie innerhalb Ihres Plugins lokale Barrel-Dateien für interne Importe:

```
my-plugin/
  api.ts            # Public exports for external consumers
  runtime-api.ts    # Internal-only runtime exports
  index.ts          # Plugin entry point
  setup-entry.ts    # Lightweight setup-only entry (optional)
```

<Warning>
  Importieren Sie Ihr eigenes Plugin in Produktionscode niemals über `openclaw/plugin-sdk/<your-plugin>`.
  Leiten Sie interne Importe über `./api.ts` oder
  `./runtime-api.ts`. Der SDK-Pfad ist ausschließlich der externe Vertrag.
</Warning>

Über Facades geladene öffentliche Oberflächen gebündelter Plugins (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` und ähnliche öffentliche Einstiegdateien) bevorzugen den
aktiven Runtime-Konfigurations-Snapshot, wenn OpenClaw bereits ausgeführt wird. Wenn noch kein Runtime-
Snapshot vorhanden ist, fallen sie auf die aufgelöste Konfigurationsdatei auf der Festplatte zurück.
Paketierte Facades gebündelter Plugins sollten über die Plugin-
Facade-Loader von OpenClaw geladen werden; direkte Importe aus `dist/extensions/...` umgehen die Manifest-
und Runtime-Sidecar-Prüfungen, die paketierte Installationen für Plugin-eigenen Code verwenden.

Provider-Plugins können ein schmales pluginlokales Vertrags-Barrel bereitstellen, wenn ein
Hilfsprogramm absichtlich providerspezifisch ist und noch nicht in einen generischen SDK-
Unterpfad gehört. Gebündelte Beispiele:

- **Anthropic**: öffentliche `api.ts`- / `contract-api.ts`-Nahtstelle für Claude-
  Beta-Header- und `service_tier`-Stream-Hilfsfunktionen.
- **`@openclaw/openai-provider`**: `api.ts` exportiert Provider-Builder,
  Hilfsfunktionen für Standardmodelle und Realtime-Provider-Builder.
- **`@openclaw/openrouter-provider`**: `api.ts` exportiert den Provider-Builder
  sowie Hilfsfunktionen für Onboarding/Konfiguration.

<Warning>
  Produktionscode von Plugins sollte ebenfalls Importe aus `openclaw/plugin-sdk/<other-plugin>`
  vermeiden. Wenn ein Hilfsprogramm wirklich gemeinsam genutzt wird, heben Sie es auf einen neutralen SDK-Unterpfad
  wie `openclaw/plugin-sdk/speech`, `.../provider-model-shared` oder eine andere
  funktionsorientierte Oberfläche, statt zwei Plugins miteinander zu koppeln.
</Warning>

## Verwandte

<CardGroup cols={2}>
  <Card title="Einstiegspunkte" icon="door-open" href="/de/plugins/sdk-entrypoints">
    Optionen für `definePluginEntry` und `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime-Hilfsfunktionen" icon="gears" href="/de/plugins/sdk-runtime">
    Vollständige Referenz für den Namespace `api.runtime`.
  </Card>
  <Card title="Einrichtung und Konfiguration" icon="sliders" href="/de/plugins/sdk-setup">
    Paketierung, Manifeste und Konfigurationsschemas.
  </Card>
  <Card title="Tests" icon="vial" href="/de/plugins/sdk-testing">
    Testhilfen und Lint-Regeln.
  </Card>
  <Card title="SDK-Migration" icon="arrows-turn-right" href="/de/plugins/sdk-migration">
    Migration von veralteten Oberflächen.
  </Card>
  <Card title="Interne Plugin-Details" icon="diagram-project" href="/de/plugins/architecture">
    Tiefgehende Architektur und Capability-Modell.
  </Card>
</CardGroup>
