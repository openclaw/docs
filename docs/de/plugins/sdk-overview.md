---
read_when:
    - Sie müssen wissen, aus welchem SDK-Unterpfad Sie importieren müssen
    - Sie möchten eine Referenz für alle Registrierungsmethoden der OpenClawPluginApi
    - Sie suchen nach einem bestimmten SDK-Export
sidebarTitle: Plugin SDK overview
summary: Import-Map, Referenz zur Registrierungs-API und SDK-Architektur
title: Übersicht über das Plugin SDK
x-i18n:
    generated_at: "2026-04-30T07:07:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1749ad99c55ffd14624b817aba963bd93ebe7976937138693177523bbe3aa88c
    source_path: plugins/sdk-overview.md
    workflow: 16
---

Das Plugin-SDK ist der typisierte Vertrag zwischen Plugins und Core. Diese Seite ist die
Referenz dafür, **was Sie importieren** und **was Sie registrieren können**.

<Note>
  Diese Seite richtet sich an Plugin-Autoren, die `openclaw/plugin-sdk/*` innerhalb von
  OpenClaw verwenden. Für externe Apps, Skripte, Dashboards, CI-Jobs und IDE-Erweiterungen,
  die Agenten über den Gateway ausführen möchten, verwenden Sie stattdessen das
  [OpenClaw App SDK](/de/concepts/openclaw-sdk) und das Paket `@openclaw/sdk`.
</Note>

<Tip>
Suchen Sie stattdessen eine Anleitung? Beginnen Sie mit [Plugins erstellen](/de/plugins/building-plugins), verwenden Sie [Channel-Plugins](/de/plugins/sdk-channel-plugins) für Channel-Plugins, [Provider-Plugins](/de/plugins/sdk-provider-plugins) für Provider-Plugins und [Plugin-Hooks](/de/plugins/hooks) für Tool- oder Lifecycle-Hook-Plugins.
</Tip>

## Importkonvention

Importieren Sie immer aus einem spezifischen Subpath:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Jeder Subpath ist ein kleines, eigenständiges Modul. Das hält den Start schnell und
verhindert Probleme mit zirkulären Abhängigkeiten. Für channel-spezifische Entry-/Build-Hilfsfunktionen
bevorzugen Sie `openclaw/plugin-sdk/channel-core`; verwenden Sie `openclaw/plugin-sdk/core` für
die breitere Oberfläche und gemeinsame Hilfsfunktionen wie
`buildChannelConfigSchema`.

Für Channel-Konfigurationen veröffentlichen Sie das vom Channel verwaltete JSON-Schema über
`openclaw.plugin.json#channelConfigs`. Der Subpath `plugin-sdk/channel-config-schema`
ist für gemeinsame Schema-Primitiven und den generischen Builder vorgesehen. Die mit OpenClaw
gebündelten Plugins verwenden `plugin-sdk/bundled-channel-config-schema` für beibehaltene
Schemas gebündelter Channels. Veraltete Kompatibilitätsexporte bleiben in
`plugin-sdk/channel-config-schema-legacy`; keiner der gebündelten Schema-Subpaths ist ein
Muster für neue Plugins.

<Warning>
  Importieren Sie keine Provider- oder Channel-benannten Convenience-Seams (zum Beispiel
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Gebündelte Plugins kombinieren generische SDK-Subpaths innerhalb ihrer eigenen `api.ts`- /
  `runtime-api.ts`-Barrels; Core-Consumer sollten entweder diese plugin-lokalen
  Barrels verwenden oder einen schmalen generischen SDK-Vertrag hinzufügen, wenn ein Bedarf wirklich
  channel-übergreifend ist.

Ein kleiner Satz von Hilfs-Seams für gebündelte Plugins erscheint weiterhin in der generierten Export-Map,
wenn dafür Owner-Nutzung nachverfolgt wird. Sie existieren nur für die Wartung gebündelter Plugins
und sind keine empfohlenen Importpfade für neue Drittanbieter-Plugins.

`openclaw/plugin-sdk/discord` und `openclaw/plugin-sdk/telegram-account` werden
ebenfalls als veraltete Kompatibilitäts-Fassaden für nachverfolgte Owner-Nutzung beibehalten. Kopieren Sie
diese Importpfade nicht in neue Plugins; verwenden Sie stattdessen injizierte Runtime-Hilfsfunktionen und
generische Channel-SDK-Subpaths.
</Warning>

## Subpath-Referenz

Das Plugin-SDK wird als Satz schmaler Subpaths bereitgestellt, gruppiert nach Bereich (Plugin-
Entry, Channel, Provider, Auth, Runtime, Capability, Memory und reservierte
Hilfsfunktionen für gebündelte Plugins). Den vollständigen Katalog — gruppiert und verlinkt — finden Sie unter
[Plugin-SDK-Subpaths](/de/plugins/sdk-subpaths).

Die generierte Liste mit mehr als 200 Subpaths befindet sich in `scripts/lib/plugin-sdk-entrypoints.json`.

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

| Methode                         | Was registriert wird                           |
| ------------------------------- | --------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent-Tool (erforderlich oder `{ optional: true }`) |
| `api.registerCommand(def)`      | Benutzerdefinierter Befehl (umgeht das LLM)   |

Plugin-Befehle können `agentPromptGuidance` setzen, wenn der Agent einen kurzen,
vom Befehl verwalteten Routing-Hinweis benötigt. Halten Sie diesen Text auf den Befehl selbst bezogen; fügen Sie
keine Provider- oder Plugin-spezifischen Richtlinien zu Core-Prompt-Buildern hinzu.

### Infrastruktur

| Methode                                        | Was registriert wird                         |
| ---------------------------------------------- | ------------------------------------------- |
| `api.registerHook(events, handler, opts?)`     | Event-Hook                                  |
| `api.registerHttpRoute(params)`                | Gateway-HTTP-Endpunkt                       |
| `api.registerGatewayMethod(name, handler)`     | Gateway-RPC-Methode                         |
| `api.registerGatewayDiscoveryService(service)` | Lokaler Gateway-Discovery-Advertiser        |
| `api.registerCli(registrar, opts?)`            | CLI-Unterbefehl                             |
| `api.registerService(service)`                 | Hintergrunddienst                           |
| `api.registerInteractiveHandler(registration)` | Interaktiver Handler                        |
| `api.registerAgentToolResultMiddleware(...)`   | Runtime-Tool-Result-Middleware              |
| `api.registerMemoryPromptSupplement(builder)`  | Additiver Memory-naher Prompt-Abschnitt     |
| `api.registerMemoryCorpusSupplement(adapter)`  | Additiver Memory-Such-/Lese-Corpus          |

### Host-Hooks für Workflow-Plugins

Host-Hooks sind die SDK-Seams für Plugins, die am Host-Lifecycle teilnehmen müssen,
statt nur einen Provider, Channel oder ein Tool hinzuzufügen. Sie sind
generische Verträge; Plan Mode kann sie verwenden, aber ebenso Approval-Workflows,
Workspace-Policy-Gates, Hintergrundmonitore, Setup-Assistenten und UI-Companion-
Plugins.

| Methode                                                                  | Verwalteter Vertrag                                                               |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `api.registerSessionExtension(...)`                                      | Plugin-verwalteter, JSON-kompatibler Session-State, der über Gateway-Sitzungen projiziert wird |
| `api.enqueueNextTurnInjection(...)`                                      | Dauerhafter Exactly-once-Kontext, der in den nächsten Agent-Turn für eine Sitzung injiziert wird |
| `api.registerTrustedToolPolicy(...)`                                     | Gebündelte/vertrauenswürdige Pre-Plugin-Tool-Policy, die Tool-Parameter blockieren oder umschreiben kann |
| `api.registerToolMetadata(...)`                                          | Tool-Katalog-Anzeigemetadaten, ohne die Tool-Implementierung zu ändern            |
| `api.registerCommand(...)`                                               | Gescopte Plugin-Befehle; Befehlsergebnisse können `continueAgent: true` setzen    |
| `api.registerControlUiDescriptor(...)`                                   | Control-UI-Beitragsdeskriptoren für Session-, Tool-, Run- oder Einstellungsoberflächen |
| `api.registerRuntimeLifecycle(...)`                                      | Cleanup-Callbacks für Plugin-verwaltete Runtime-Ressourcen auf Reset-/Delete-/Reload-Pfaden |
| `api.registerAgentEventSubscription(...)`                                | Bereinigte Event-Abonnements für Workflow-State und Monitore                      |
| `api.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)` | Plugin-Scratch-State pro Run, der im terminalen Run-Lifecycle gelöscht wird       |
| `api.registerSessionSchedulerJob(...)`                                   | Plugin-verwaltete Session-Scheduler-Job-Datensätze mit deterministischem Cleanup  |

Die Verträge trennen Befugnisse bewusst:

- Externe Plugins können Session-Erweiterungen, UI-Deskriptoren, Befehle, Tool-
  Metadaten, Next-Turn-Injections und normale Hooks verwalten.
- Trusted-Tool-Policies werden vor gewöhnlichen `before_tool_call`-Hooks ausgeführt und sind
  nur gebündelt, weil sie an der Host-Sicherheitsrichtlinie teilnehmen.
- Reservierte Befehls-Ownership ist nur gebündelt. Externe Plugins sollten ihre
  eigenen Befehlsnamen oder Aliase verwenden.
- `allowPromptInjection=false` deaktiviert Prompt-mutierende Hooks einschließlich
  `agent_turn_prepare`, `before_prompt_build`, `heartbeat_prompt_contribution`,
  Prompt-Feldern aus dem alten `before_agent_start` und
  `enqueueNextTurnInjection`.

Beispiele für Nicht-Plan-Consumer:

| Plugin-Archetyp             | Verwendete Hooks                                                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Approval-Workflow            | Session-Erweiterung, Befehlsfortsetzung, Next-Turn-Injection, UI-Deskriptor                                                            |
| Budget-/Workspace-Policy-Gate | Trusted-Tool-Policy, Tool-Metadaten, Session-Projektion                                                                                |
| Hintergrund-Lifecycle-Monitor | Runtime-Lifecycle-Cleanup, Agent-Event-Abonnement, Session-Scheduler-Ownership/Cleanup, Heartbeat-Prompt-Beitrag, UI-Deskriptor       |
| Setup- oder Onboarding-Assistent | Session-Erweiterung, gescopte Befehle, Control-UI-Deskriptor                                                                       |

<Note>
  Reservierte Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) bleiben immer `operator.admin`, selbst wenn ein Plugin versucht, einen
  schmaleren Gateway-Methoden-Scope zuzuweisen. Bevorzugen Sie plugin-spezifische Präfixe für
  plugin-verwaltete Methoden.
</Note>

<Accordion title="Wann Tool-Result-Middleware verwendet werden sollte">
  Gebündelte Plugins können `api.registerAgentToolResultMiddleware(...)` verwenden, wenn
  sie ein Tool-Ergebnis nach der Ausführung und bevor die Runtime
  dieses Ergebnis zurück ins Modell einspeist, umschreiben müssen. Dies ist der vertrauenswürdige Runtime-neutrale
  Seam für asynchrone Output-Reducer wie tokenjuice.

Gebündelte Plugins müssen `contracts.agentToolResultMiddleware` für jede
zielgerichtete Runtime deklarieren, zum Beispiel `["pi", "codex"]`. Externe Plugins
können diese Middleware nicht registrieren; behalten Sie normale OpenClaw-Plugin-Hooks für Arbeit bei,
die kein Pre-Model-Tool-Result-Timing benötigt. Der alte Pi-only eingebettete
Extension-Factory-Registrierungspfad wurde entfernt.
</Accordion>

### Gateway-Discovery-Registrierung

`api.registerGatewayDiscoveryService(...)` ermöglicht einem Plugin, den aktiven
Gateway über einen lokalen Discovery-Transport wie mDNS/Bonjour bekannt zu machen. OpenClaw ruft den
Dienst während des Gateway-Starts auf, wenn lokale Discovery aktiviert ist, übergibt die
aktuellen Gateway-Ports und nicht geheime TXT-Hinweisdaten und ruft den zurückgegebenen
`stop`-Handler während des Gateway-Shutdowns auf.

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

Gateway-Discovery-Plugins dürfen veröffentlichte TXT-Werte nicht als Secrets oder
Authentifizierung behandeln. Discovery ist ein Routing-Hinweis; Gateway-Authentifizierung und TLS-Pinning
sind weiterhin für Vertrauen zuständig.

### CLI-Registrierungsmetadaten

`api.registerCli(registrar, opts?)` akzeptiert zwei Arten von Metadaten auf oberster Ebene:

- `commands`: explizite Befehlswurzeln, die dem Registrar gehören
- `descriptors`: Befehlsdeskriptoren zur Parse-Zeit, die für die Root-CLI-Hilfe,
  Routing und Lazy-Registrierung der Plugin-CLI verwendet werden

Wenn ein Plugin-Befehl im normalen Root-CLI-Pfad lazy-loaded bleiben soll,
stellen Sie `descriptors` bereit, die jede Befehlswurzel auf oberster Ebene abdecken,
die dieser Registrar verfügbar macht.

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

Verwenden Sie `commands` allein nur, wenn Sie keine Lazy-Root-CLI-Registrierung benötigen.
Dieser Eager-Kompatibilitätspfad bleibt unterstützt, installiert aber keine
deskriptorbasierten Platzhalter für Lazy Loading zur Parse-Zeit.

### CLI-Backend-Registrierung

`api.registerCliBackend(...)` ermöglicht es einem Plugin, die Standardkonfiguration für ein lokales
KI-CLI-Backend wie `codex-cli` zu besitzen.

- Die Backend-`id` wird zum Provider-Präfix in Modellreferenzen wie `codex-cli/gpt-5`.
- Die Backend-`config` verwendet dieselbe Struktur wie `agents.defaults.cliBackends.<id>`.
- Die Benutzerkonfiguration hat weiterhin Vorrang. OpenClaw führt `agents.defaults.cliBackends.<id>` über dem
  Plugin-Standard zusammen, bevor die CLI ausgeführt wird.
- Verwenden Sie `normalizeConfig`, wenn ein Backend nach dem Zusammenführen Kompatibilitätsumschreibungen benötigt
  (zum Beispiel das Normalisieren alter Flag-Strukturen).

### Exklusive Slots

| Methode                                    | Was sie registriert                                                                                                                                              |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context-Engine (jeweils eine aktiv). Der `assemble()`-Callback erhält `availableTools` und `citationsMode`, damit die Engine Prompt-Ergänzungen anpassen kann. |
| `api.registerMemoryCapability(capability)` | Einheitliche Memory-Capability                                                                                                                                   |
| `api.registerMemoryPromptSection(builder)` | Builder für Memory-Prompt-Abschnitte                                                                                                                             |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver für Memory-Flush-Pläne                                                                                                                                  |
| `api.registerMemoryRuntime(runtime)`       | Memory-Runtime-Adapter                                                                                                                                           |

### Memory-Embedding-Adapter

| Methode                                        | Was sie registriert                              |
| ---------------------------------------------- | ------------------------------------------------ |
| `api.registerMemoryEmbeddingProvider(adapter)` | Memory-Embedding-Adapter für das aktive Plugin   |

- `registerMemoryCapability` ist die bevorzugte exklusive API für Memory-Plugins.
- `registerMemoryCapability` kann außerdem `publicArtifacts.listArtifacts(...)`
  verfügbar machen, damit begleitende Plugins exportierte Memory-Artefakte über
  `openclaw/plugin-sdk/memory-host-core` konsumieren können, statt auf das private Layout eines bestimmten
  Memory-Plugins zuzugreifen.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` und
  `registerMemoryRuntime` sind Legacy-kompatible exklusive APIs für Memory-Plugins.
- `MemoryFlushPlan.model` kann den Flush-Turn auf eine exakte `provider/model`-
  Referenz wie `ollama/qwen3:8b` pinnen, ohne die aktive Fallback-
  Kette zu erben.
- `registerMemoryEmbeddingProvider` ermöglicht dem aktiven Memory-Plugin, eine
  oder mehrere Embedding-Adapter-IDs zu registrieren (zum Beispiel `openai`, `gemini` oder eine benutzerdefinierte,
  vom Plugin definierte ID).
- Benutzerkonfigurationen wie `agents.defaults.memorySearch.provider` und
  `agents.defaults.memorySearch.fallback` werden gegen diese registrierten
  Adapter-IDs aufgelöst.

### Events und Lebenszyklus

| Methode                                      | Was sie tut                       |
| -------------------------------------------- | --------------------------------- |
| `api.on(hookName, handler, opts?)`           | Typisierter Lebenszyklus-Hook     |
| `api.onConversationBindingResolved(handler)` | Callback für Konversationsbindung |

Siehe [Plugin-Hooks](/de/plugins/hooks) für Beispiele, gängige Hook-Namen und Guard-
Semantik.

### Semantik von Hook-Entscheidungen

- `before_tool_call`: Das Zurückgeben von `{ block: true }` ist terminal. Sobald ein Handler es setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_tool_call`: Das Zurückgeben von `{ block: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `block`), nicht als Überschreibung.
- `before_install`: Das Zurückgeben von `{ block: true }` ist terminal. Sobald ein Handler es setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_install`: Das Zurückgeben von `{ block: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `block`), nicht als Überschreibung.
- `reply_dispatch`: Das Zurückgeben von `{ handled: true, ... }` ist terminal. Sobald ein Handler den Dispatch übernimmt, werden Handler mit niedrigerer Priorität und der Standardpfad für den Modell-Dispatch übersprungen.
- `message_sending`: Das Zurückgeben von `{ cancel: true }` ist terminal. Sobald ein Handler es setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `message_sending`: Das Zurückgeben von `{ cancel: false }` wird als keine Entscheidung behandelt (wie das Weglassen von `cancel`), nicht als Überschreibung.
- `message_received`: Verwenden Sie das typisierte Feld `threadId`, wenn Sie eingehendes Thread-/Topic-Routing benötigen. Behalten Sie `metadata` für kanalspezifische Extras bei.
- `message_sending`: Verwenden Sie die typisierten Routing-Felder `replyToId` / `threadId`, bevor Sie auf kanalspezifische `metadata` zurückfallen.
- `gateway_start`: Verwenden Sie `ctx.config`, `ctx.workspaceDir` und `ctx.getCron?.()` für Gateway-eigenen Startzustand, statt sich auf interne `gateway:startup`-Hooks zu verlassen.
- `cron_changed`: Beobachten Sie Änderungen am Gateway-eigenen Cron-Lebenszyklus. Verwenden Sie `event.job?.state?.nextRunAtMs` und `ctx.getCron?.()`, wenn Sie externe Wake-Scheduler synchronisieren, und behalten Sie OpenClaw als Source of Truth für Fälligkeitsprüfungen und Ausführung bei.

### API-Objektfelder

| Feld                     | Typ                       | Beschreibung                                                                                                   |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-ID                                                                                                      |
| `api.name`               | `string`                  | Anzeigename                                                                                                    |
| `api.version`            | `string?`                 | Plugin-Version (optional)                                                                                      |
| `api.description`        | `string?`                 | Plugin-Beschreibung (optional)                                                                                 |
| `api.source`             | `string`                  | Plugin-Quellpfad                                                                                               |
| `api.rootDir`            | `string?`                 | Plugin-Stammverzeichnis (optional)                                                                             |
| `api.config`             | `OpenClawConfig`          | Aktueller Konfigurations-Snapshot (aktiver In-Memory-Runtime-Snapshot, wenn verfügbar)                         |
| `api.pluginConfig`       | `Record<string, unknown>` | Plugin-spezifische Konfiguration aus `plugins.entries.<id>.config`                                             |
| `api.runtime`            | `PluginRuntime`           | [Runtime-Helper](/de/plugins/sdk-runtime)                                                                         |
| `api.logger`             | `PluginLogger`            | Bereichsbezogener Logger (`debug`, `info`, `warn`, `error`)                                                    |
| `api.registrationMode`   | `PluginRegistrationMode`  | Aktueller Lademodus; `"setup-runtime"` ist das schlanke Start-/Setup-Fenster vor dem vollständigen Entry       |
| `api.resolvePath(input)` | `(string) => string`      | Pfad relativ zur Plugin-Wurzel auflösen                                                                        |

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
  Importieren Sie Ihr eigenes Plugin in Produktionscode niemals über `openclaw/plugin-sdk/<your-plugin>`.
  Leiten Sie interne Importe über `./api.ts` oder
  `./runtime-api.ts`. Der SDK-Pfad ist nur der externe Vertrag.
</Warning>

Facade-geladene öffentliche Oberflächen gebündelter Plugins (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` und ähnliche öffentliche Entry-Dateien) bevorzugen den
aktiven Runtime-Konfigurations-Snapshot, wenn OpenClaw bereits läuft. Wenn noch kein Runtime-
Snapshot existiert, fallen sie auf die aufgelöste Konfigurationsdatei auf der Festplatte zurück.
Paketierte Facades gebündelter Plugins sollten über OpenClaws Plugin-
Facade-Loader geladen werden; direkte Importe aus `dist/extensions/...` umgehen gestufte Runtime-
Abhängigkeitsspiegel, die paketierte Installationen für Plugin-eigene Abhängigkeiten verwenden.

Provider-Plugins können ein schmales Plugin-lokales Vertrags-Barrel verfügbar machen, wenn ein
Helper absichtlich Provider-spezifisch ist und noch nicht in einen generischen SDK-
Unterpfad gehört. Gebündelte Beispiele:

- **Anthropic**: öffentliche `api.ts`- / `contract-api.ts`-Schnittstelle für Claude-
  Beta-Header und `service_tier`-Stream-Helper.
- **`@openclaw/openai-provider`**: `api.ts` exportiert Provider-Builder,
  Standardmodell-Helper und Realtime-Provider-Builder.
- **`@openclaw/openrouter-provider`**: `api.ts` exportiert den Provider-Builder
  sowie Onboarding-/Konfigurations-Helper.

<Warning>
  Produktionscode von Plugins sollte ebenfalls Importe aus `openclaw/plugin-sdk/<other-plugin>`
  vermeiden. Wenn ein Helper wirklich geteilt wird, heben Sie ihn in einen neutralen SDK-Unterpfad
  wie `openclaw/plugin-sdk/speech`, `.../provider-model-shared` oder eine andere
  capability-orientierte Oberfläche, statt zwei Plugins miteinander zu koppeln.
</Warning>

## Verwandt

<CardGroup cols={2}>
  <Card title="Entry Points" icon="door-open" href="/de/plugins/sdk-entrypoints">
    Optionen für `definePluginEntry` und `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime-Helper" icon="gears" href="/de/plugins/sdk-runtime">
    Vollständige Referenz des `api.runtime`-Namespace.
  </Card>
  <Card title="Setup und Konfiguration" icon="sliders" href="/de/plugins/sdk-setup">
    Paketierung, Manifeste und Konfigurationsschemas.
  </Card>
  <Card title="Tests" icon="vial" href="/de/plugins/sdk-testing">
    Test-Utilities und Lint-Regeln.
  </Card>
  <Card title="SDK-Migration" icon="arrows-turn-right" href="/de/plugins/sdk-migration">
    Migration von veralteten Oberflächen.
  </Card>
  <Card title="Plugin-Interna" icon="diagram-project" href="/de/plugins/architecture">
    Tiefgehende Architektur und Capability-Modell.
  </Card>
</CardGroup>
