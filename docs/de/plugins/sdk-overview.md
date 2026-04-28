---
read_when:
    - Sie müssen wissen, aus welchem SDK-Subpfad importiert werden soll.
    - Sie möchten eine Referenz für alle Registrierungsmethoden in `OpenClawPluginApi`.
    - Sie suchen nach einem bestimmten SDK-Export.
sidebarTitle: SDK overview
summary: Import-Map, Referenz der Registrierungs-API und SDK-Architektur
title: Überblick über das Plugin SDK
x-i18n:
    generated_at: "2026-04-25T13:53:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 825efe8d9b2283734730348f9803e40cabaaa6399993648f4bb5822b20e588ee
    source_path: plugins/sdk-overview.md
    workflow: 15
---

Das Plugin SDK ist der typisierte Vertrag zwischen Plugins und dem Core. Diese Seite ist die
Referenz dafür, **was importiert werden soll** und **was Sie registrieren können**.

<Tip>
  Suchen Sie stattdessen nach einer How-to-Anleitung?

- Erstes Plugin? Beginnen Sie mit [Building plugins](/de/plugins/building-plugins).
- Channel-Plugin? Siehe [Channel plugins](/de/plugins/sdk-channel-plugins).
- Provider-Plugin? Siehe [Provider plugins](/de/plugins/sdk-provider-plugins).
- Tool- oder Lifecycle-Hook-Plugin? Siehe [Plugin hooks](/de/plugins/hooks).

</Tip>

## Import-Konvention

Importieren Sie immer aus einem spezifischen Subpfad:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Jeder Subpfad ist ein kleines, in sich geschlossenes Modul. Das hält den Start schnell und
verhindert Probleme mit zirkulären Abhängigkeiten. Für channel-spezifische Entry-/Build-Helfer
bevorzugen Sie `openclaw/plugin-sdk/channel-core`; behalten Sie `openclaw/plugin-sdk/core` für
die breitere Dachoberfläche und gemeinsame Helfer wie
`buildChannelConfigSchema`.

Für die Channel-Konfiguration veröffentlichen Sie das channel-eigene JSON-Schema über
`openclaw.plugin.json#channelConfigs`. Der Subpfad `plugin-sdk/channel-config-schema`
ist für gemeinsame Schema-Primitiven und den generischen Builder gedacht. Benannte Schema-Exporte
für gebündelte Channels auf diesem Subpfad sind alte Kompatibilitätsexporte, kein Muster für neue Plugins.

<Warning>
  Importieren Sie keine provider- oder channel-gebrandeten Convenience-Seams (zum Beispiel
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Gebündelte Plugins setzen generische SDK-Subpfade innerhalb ihrer eigenen `api.ts`- /
  `runtime-api.ts`-Barrels zusammen; Core-Konsumenten sollten entweder diese pluginlokalen
  Barrels verwenden oder einen schmalen generischen SDK-Vertrag hinzufügen, wenn ein Bedarf
  wirklich kanalübergreifend ist.

Eine kleine Gruppe von Hilfs-Seams für gebündelte Plugins (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` und ähnliche) erscheint weiterhin in der
generierten Export-Map. Sie existieren nur für die Pflege gebündelter Plugins und sind
keine empfohlenen Importpfade für neue Drittanbieter-Plugins.
</Warning>

## Referenz der Subpfade

Das Plugin SDK wird als Satz schmaler Subpfade bereitgestellt, gruppiert nach Bereichen (Plugin-
Entry, Channel, Provider, Auth, Runtime, Capability, Memory und reservierte
Hilfen für gebündelte Plugins). Den vollständigen Katalog — gruppiert und verlinkt — finden Sie unter
[Plugin SDK subpaths](/de/plugins/sdk-subpaths).

Die generierte Liste von über 200 Subpfaden befindet sich in `scripts/lib/plugin-sdk-entrypoints.json`.

## Registrierungs-API

Der Callback `register(api)` erhält ein Objekt `OpenClawPluginApi` mit diesen
Methoden:

### Registrierung von Capabilities

| Methode                                          | Was sie registriert                    |
| ------------------------------------------------ | -------------------------------------- |
| `api.registerProvider(...)`                      | Textinferenz (LLM)                     |
| `api.registerAgentHarness(...)`                  | Experimenteller Low-Level-Agent-Executor |
| `api.registerCliBackend(...)`                    | Lokales CLI-Inferenz-Backend           |
| `api.registerChannel(...)`                       | Messaging-Channel                      |
| `api.registerSpeechProvider(...)`                | Text-to-Speech / STT-Synthese          |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming-Echtzeittranskription        |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex-Echtzeit-Sprachsessions         |
| `api.registerMediaUnderstandingProvider(...)`    | Bild-/Audio-/Videoanalyse              |
| `api.registerImageGenerationProvider(...)`       | Bilderzeugung                          |
| `api.registerMusicGenerationProvider(...)`       | Musikgenerierung                       |
| `api.registerVideoGenerationProvider(...)`       | Videogenerierung                       |
| `api.registerWebFetchProvider(...)`              | Web-Fetch-/Scrape-Anbieter             |
| `api.registerWebSearchProvider(...)`             | Websuche                               |

### Tools und Befehle

| Methode                         | Was sie registriert                            |
| ------------------------------ | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent-Tool (erforderlich oder `{ optional: true }`) |
| `api.registerCommand(def)`      | Benutzerdefinierter Befehl (umgeht das LLM)    |

### Infrastruktur

| Methode                                        | Was sie registriert                     |
| --------------------------------------------- | --------------------------------------- |
| `api.registerHook(events, handler, opts?)`    | Ereignis-Hook                           |
| `api.registerHttpRoute(params)`               | Gateway-HTTP-Endpunkt                   |
| `api.registerGatewayMethod(name, handler)`    | Gateway-RPC-Methode                     |
| `api.registerGatewayDiscoveryService(service)` | Lokalen Discovery-Advertiser für das Gateway |
| `api.registerCli(registrar, opts?)`           | CLI-Unterbefehl                         |
| `api.registerService(service)`                | Hintergrunddienst                       |
| `api.registerInteractiveHandler(registration)` | Interaktiven Handler                    |
| `api.registerAgentToolResultMiddleware(...)`  | Laufzeit-Middleware für Tool-Ergebnisse |
| `api.registerMemoryPromptSupplement(builder)` | Additiver Prompt-Abschnitt nahe Memory  |
| `api.registerMemoryCorpusSupplement(adapter)` | Additiver Such-/Lese-Korpus für Memory  |

<Note>
  Reservierte Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) bleiben immer `operator.admin`, selbst wenn ein Plugin versucht, einer Gateway-Methode einen
  engeren Scope zuzuweisen. Bevorzugen Sie plugin-spezifische Präfixe für
  plugin-eigene Methoden.
</Note>

<Accordion title="Wann Tool-Result-Middleware verwendet werden sollte">
  Gebündelte Plugins können `api.registerAgentToolResultMiddleware(...)` verwenden, wenn
  sie ein Tool-Ergebnis nach der Ausführung und bevor die Laufzeit
  dieses Ergebnis zurück an das Modell gibt, umschreiben müssen. Dies ist der vertrauenswürdige,
  laufzeitneutrale Seam für asynchrone Output-Reducer wie tokenjuice.

Gebündelte Plugins müssen `contracts.agentToolResultMiddleware` für jede
zielgerichtete Laufzeit deklarieren, zum Beispiel `["pi", "codex"]`. Externe Plugins
können diese Middleware nicht registrieren; behalten Sie normale OpenClaw-Plugin-Hooks für Arbeit bei,
die kein Timing für Tool-Ergebnisse vor dem Modell benötigt. Der alte eingebettete
Pi-only-Registrierungspfad für Extension-Factories wurde entfernt.
</Accordion>

### Registrierung für Gateway-Discovery

`api.registerGatewayDiscoveryService(...)` ermöglicht es einem Plugin, das aktive
Gateway auf einem lokalen Discovery-Transport wie mDNS/Bonjour zu veröffentlichen. OpenClaw ruft den
Dienst beim Start des Gateway auf, wenn lokale Discovery aktiviert ist, übergibt die
aktuellen Ports des Gateway und nicht geheime TXT-Hinweisdaten und ruft den zurückgegebenen
Handler `stop` beim Herunterfahren des Gateway auf.

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

Plugins für Gateway-Discovery dürfen veröffentlichte TXT-Werte nicht als Secrets oder
Authentifizierung behandeln. Discovery ist ein Routing-Hinweis; Vertrauen liegt weiterhin bei Gateway-Auth und TLS-Pinning.

### CLI-Registrierungsmetadaten

`api.registerCli(registrar, opts?)` akzeptiert zwei Arten von Metadaten auf oberster Ebene:

- `commands`: explizite Befehlswurzeln, die dem Registrar gehören
- `descriptors`: Parse-Time-Befehlsdeskriptoren für Root-CLI-Hilfe,
  Routing und lazy CLI-Registrierung von Plugins

Wenn ein Plugin-Befehl im normalen Root-CLI-Pfad lazy geladen bleiben soll,
geben Sie `descriptors` an, die jede Befehlswurzel oberster Ebene abdecken, die von diesem
Registrar bereitgestellt wird.

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

Verwenden Sie `commands` allein nur dann, wenn Sie keine lazy Root-CLI-Registrierung benötigen.
Dieser eager Kompatibilitätspfad wird weiterhin unterstützt, installiert aber keine
deskriptorbasierten Platzhalter für lazy Laden zur Parse-Zeit.

### Registrierung von CLI-Backends

`api.registerCliBackend(...)` ermöglicht es einem Plugin, die Standardkonfiguration für ein lokales
KI-CLI-Backend wie `codex-cli` zu besitzen.

- Die Backend-`id` wird zum Anbieterpräfix in Modellreferenzen wie `codex-cli/gpt-5`.
- Die Backend-`config` verwendet dieselbe Form wie `agents.defaults.cliBackends.<id>`.
- Benutzerkonfiguration hat weiterhin Vorrang. OpenClaw merged `agents.defaults.cliBackends.<id>` über den
  Plugin-Standard, bevor die CLI ausgeführt wird.
- Verwenden Sie `normalizeConfig`, wenn ein Backend nach dem Merge Kompatibilitätsumschreibungen benötigt
  (zum Beispiel zur Normalisierung alter Flag-Formen).

### Exklusive Slots

| Methode                                    | Was sie registriert                                                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`   | Context Engine (jeweils nur eine aktiv). Der Callback `assemble()` erhält `availableTools` und `citationsMode`, damit die Engine Prompt-Ergänzungen anpassen kann. |
| `api.registerMemoryCapability(capability)` | Einheitliche Memory-Capability                                                                                                                                 |
| `api.registerMemoryPromptSection(builder)` | Builder für Memory-Prompt-Abschnitte                                                                                                                          |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver für Memory-Flush-Pläne                                                                                                                               |
| `api.registerMemoryRuntime(runtime)`       | Adapter für die Memory-Laufzeit                                                                                                                               |

### Memory-Embedding-Adapter

| Methode                                        | Was sie registriert                                  |
| --------------------------------------------- | ---------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Memory-Embedding-Adapter für das aktive Plugin       |

- `registerMemoryCapability` ist die bevorzugte exklusive API für Memory-Plugins.
- `registerMemoryCapability` kann auch `publicArtifacts.listArtifacts(...)` bereitstellen,
  sodass Begleit-Plugins exportierte Memory-Artefakte über
  `openclaw/plugin-sdk/memory-host-core` konsumieren können, statt in das private Layout eines bestimmten
  Memory-Plugins einzugreifen.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` und
  `registerMemoryRuntime` sind exklusive, Legacy-kompatible APIs für Memory-Plugins.
- `registerMemoryEmbeddingProvider` ermöglicht es dem aktiven Memory-Plugin, einen
  oder mehrere Adapter-IDs für Embeddings zu registrieren (zum Beispiel `openai`, `gemini` oder eine
  benutzerdefinierte, durch ein Plugin definierte ID).
- Benutzerkonfigurationen wie `agents.defaults.memorySearch.provider` und
  `agents.defaults.memorySearch.fallback` werden gegen diese registrierten
  Adapter-IDs aufgelöst.

### Ereignisse und Lebenszyklus

| Methode                                      | Was sie tut                   |
| ------------------------------------------- | ----------------------------- |
| `api.on(hookName, handler, opts?)`          | Typisierter Lifecycle-Hook    |
| `api.onConversationBindingResolved(handler)` | Callback für Conversation-Bindung |

Siehe [Plugin hooks](/de/plugins/hooks) für Beispiele, häufige Hook-Namen und Guard-
Semantik.

### Hook-Entscheidungssemantik

- `before_tool_call`: Die Rückgabe von `{ block: true }` ist final. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_tool_call`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (genau wie das Weglassen von `block`), nicht als Überschreibung.
- `before_install`: Die Rückgabe von `{ block: true }` ist final. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_install`: Die Rückgabe von `{ block: false }` wird als keine Entscheidung behandelt (genau wie das Weglassen von `block`), nicht als Überschreibung.
- `reply_dispatch`: Die Rückgabe von `{ handled: true, ... }` ist final. Sobald ein Handler die Zustellung beansprucht, werden Handler mit niedrigerer Priorität und der standardmäßige Modell-Zustellungspfad übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: true }` ist final. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `message_sending`: Die Rückgabe von `{ cancel: false }` wird als keine Entscheidung behandelt (genau wie das Weglassen von `cancel`), nicht als Überschreibung.
- `message_received`: Verwenden Sie das typisierte Feld `threadId`, wenn Sie Routing für eingehende Threads/Themen benötigen. Behalten Sie `metadata` für channel-spezifische Extras.
- `message_sending`: Verwenden Sie die typisierten Routing-Felder `replyToId` / `threadId`, bevor Sie auf channel-spezifische `metadata` zurückgreifen.
- `gateway_start`: Verwenden Sie `ctx.config`, `ctx.workspaceDir` und `ctx.getCron?.()` für Gateway-eigenen Startstatus, statt sich auf interne Hooks `gateway:startup` zu verlassen.

### Felder des API-Objekts

| Feld                     | Typ                       | Beschreibung                                                                                |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-ID                                                                                   |
| `api.name`               | `string`                  | Anzeigename                                                                                 |
| `api.version`            | `string?`                 | Plugin-Version (optional)                                                                   |
| `api.description`        | `string?`                 | Plugin-Beschreibung (optional)                                                              |
| `api.source`             | `string`                  | Pfad zur Plugin-Quelle                                                                      |
| `api.rootDir`            | `string?`                 | Root-Verzeichnis des Plugins (optional)                                                     |
| `api.config`             | `OpenClawConfig`          | Aktueller Konfigurations-Snapshot (aktiver In-Memory-Laufzeit-Snapshot, wenn verfügbar)    |
| `api.pluginConfig`       | `Record<string, unknown>` | Plugin-spezifische Konfiguration aus `plugins.entries.<id>.config`                          |
| `api.runtime`            | `PluginRuntime`           | [Runtime-Helfer](/de/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | Bereichsbezogener Logger (`debug`, `info`, `warn`, `error`)                                 |
| `api.registrationMode`   | `PluginRegistrationMode`  | Aktueller Lademodus; `"setup-runtime"` ist das leichte Vorstart-/Setup-Fenster vor dem vollständigen Entry |
| `api.resolvePath(input)` | `(string) => string`      | Pfad relativ zur Plugin-Root auflösen                                                       |

## Interne Modulkonvention

Verwenden Sie innerhalb Ihres Plugins lokale Barrel-Dateien für interne Importe:

```
my-plugin/
  api.ts            # Öffentliche Exporte für externe Konsumenten
  runtime-api.ts    # Nur intern verwendete Runtime-Exporte
  index.ts          # Entry-Point des Plugins
  setup-entry.ts    # Leichter Entry nur für Setup (optional)
```

<Warning>
  Importieren Sie Ihr eigenes Plugin in Produktionscode niemals über `openclaw/plugin-sdk/<your-plugin>`.
  Leiten Sie interne Importe über `./api.ts` oder
  `./runtime-api.ts`. Der SDK-Pfad ist nur der externe Vertrag.
</Warning>

Öffentliche Oberflächen von per Facade geladenen gebündelten Plugins (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` und ähnliche öffentliche Entry-Dateien) bevorzugen den
aktiven Laufzeit-Konfigurations-Snapshot, wenn OpenClaw bereits läuft. Wenn noch kein Laufzeit-
Snapshot existiert, greifen sie auf die auf der Festplatte aufgelöste Konfigurationsdatei zurück.

Provider-Plugins können eine schmale pluginlokale Vertrags-Barrel-Datei bereitstellen, wenn ein
Helper absichtlich anbieterspezifisch ist und noch nicht in einen generischen SDK-
Subpfad gehört. Gebündelte Beispiele:

- **Anthropic**: öffentlicher `api.ts`- / `contract-api.ts`-Seam für Claude-
  Beta-Header und Stream-Helfer für `service_tier`.
- **`@openclaw/openai-provider`**: `api.ts` exportiert Provider-Builder,
  Helfer für Standardmodelle und Builder für Echtzeit-Provider.
- **`@openclaw/openrouter-provider`**: `api.ts` exportiert den Provider-Builder
  plus Helfer für Onboarding/Konfiguration.

<Warning>
  Produktionscode von Extensions sollte außerdem Importe aus `openclaw/plugin-sdk/<other-plugin>`
  vermeiden. Wenn ein Helper wirklich gemeinsam genutzt wird, verschieben Sie ihn in einen neutralen SDK-Subpfad
  wie `openclaw/plugin-sdk/speech`, `.../provider-model-shared` oder eine andere
  fähigkeitsorientierte Oberfläche, statt zwei Plugins miteinander zu koppeln.
</Warning>

## Verwandt

<CardGroup cols={2}>
  <Card title="Entry-Points" icon="door-open" href="/de/plugins/sdk-entrypoints">
    Optionen für `definePluginEntry` und `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime-Helfer" icon="gears" href="/de/plugins/sdk-runtime">
    Vollständige Referenz des Namespace `api.runtime`.
  </Card>
  <Card title="Setup und Konfiguration" icon="sliders" href="/de/plugins/sdk-setup">
    Packaging, Manifeste und Konfigurationsschemas.
  </Card>
  <Card title="Testing" icon="vial" href="/de/plugins/sdk-testing">
    Test-Utilities und Lint-Regeln.
  </Card>
  <Card title="SDK-Migration" icon="arrows-turn-right" href="/de/plugins/sdk-migration">
    Migration von veralteten Oberflächen.
  </Card>
  <Card title="Plugin-Interna" icon="diagram-project" href="/de/plugins/architecture">
    Tiefgehende Architektur und Fähigkeitsmodell.
  </Card>
</CardGroup>
