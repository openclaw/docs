---
read_when:
    - Sie müssen wissen, aus welchem SDK-Unterpfad importiert werden soll
    - Sie möchten eine Referenz für alle Registrierungsmethoden auf OpenClawPluginApi
    - Sie schlagen einen bestimmten SDK-Export nach
sidebarTitle: SDK overview
summary: Import-Map, Registrierungs-API-Referenz und SDK-Architektur
title: Plugin-SDK-Überblick
x-i18n:
    generated_at: "2026-04-24T08:59:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7f4209c245a3d3462c5d5f51ad3c6e4327240ed402fdbac3f01f8a761ba75233
    source_path: plugins/sdk-overview.md
    workflow: 15
---

Das Plugin-SDK ist der typisierte Vertrag zwischen Plugins und dem Kern. Diese Seite ist die
Referenz für **was importiert werden soll** und **was Sie registrieren können**.

<Tip>
  Suchen Sie stattdessen nach einer Schritt-für-Schritt-Anleitung?

- Erstes Plugin? Beginnen Sie mit [Building plugins](/de/plugins/building-plugins).
- Channel-Plugin? Siehe [Channel plugins](/de/plugins/sdk-channel-plugins).
- Provider-Plugin? Siehe [Provider plugins](/de/plugins/sdk-provider-plugins).
  </Tip>

## Importkonvention

Importieren Sie immer aus einem spezifischen Unterpfad:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

Jeder Unterpfad ist ein kleines, in sich geschlossenes Modul. Das hält den Start schnell und
verhindert Probleme mit zirkulären Abhängigkeiten. Für Channel-spezifische Entry-/Build-Helper
bevorzugen Sie `openclaw/plugin-sdk/channel-core`; verwenden Sie `openclaw/plugin-sdk/core` für
die breitere Dachoberfläche und gemeinsame Helper wie
`buildChannelConfigSchema`.

<Warning>
  Importieren Sie keine Provider- oder Channel-spezifisch benannten Komfort-Seams (zum Beispiel
  `openclaw/plugin-sdk/slack`, `.../discord`, `.../signal`, `.../whatsapp`).
  Gebündelte Plugins setzen generische SDK-Unterpfade innerhalb ihrer eigenen `api.ts`- /
  `runtime-api.ts`-Barrels zusammen; Kern-Consumer sollten entweder diese pluginlokalen
  Barrels verwenden oder einen schmalen generischen SDK-Vertrag hinzufügen, wenn der Bedarf
  wirklich kanalübergreifend ist.

Eine kleine Menge von Helper-Seams für gebündelte Plugins (`plugin-sdk/feishu`,
`plugin-sdk/zalo`, `plugin-sdk/matrix*` und ähnliche) erscheint weiterhin in der
generierten Export-Map. Sie existieren nur für die Wartung gebündelter Plugins und sind
keine empfohlenen Importpfade für neue Drittanbieter-Plugins.
</Warning>

## Unterpfad-Referenz

Das Plugin-SDK wird als Menge schmaler Unterpfade bereitgestellt, gruppiert nach Bereich (Plugin-Entry,
Channel, Provider, Auth, Runtime, Capability, Speicher und reservierte Helper für gebündelte
Plugins). Den vollständigen Katalog — gruppiert und verlinkt — finden Sie unter
[Plugin SDK subpaths](/de/plugins/sdk-subpaths).

Die generierte Liste von mehr als 200 Unterpfaden befindet sich in `scripts/lib/plugin-sdk-entrypoints.json`.

## Registrierungs-API

Der Callback `register(api)` erhält ein `OpenClawPluginApi`-Objekt mit diesen
Methoden:

### Capability-Registrierung

| Methode                                          | Was registriert wird                    |
| ------------------------------------------------ | --------------------------------------- |
| `api.registerProvider(...)`                      | Textinferenz (LLM)                      |
| `api.registerAgentHarness(...)`                  | Experimenteller Low-Level-Agent-Executor |
| `api.registerCliBackend(...)`                    | Lokales CLI-Inferenz-Backend            |
| `api.registerChannel(...)`                       | Messaging-Channel                       |
| `api.registerSpeechProvider(...)`                | Text-to-Speech- / STT-Synthese          |
| `api.registerRealtimeTranscriptionProvider(...)` | Streaming-Echtzeittranskription         |
| `api.registerRealtimeVoiceProvider(...)`         | Duplex-Echtzeit-Sprachsitzungen         |
| `api.registerMediaUnderstandingProvider(...)`    | Bild-/Audio-/Videoanalyse               |
| `api.registerImageGenerationProvider(...)`       | Bildgenerierung                         |
| `api.registerMusicGenerationProvider(...)`       | Musikgenerierung                        |
| `api.registerVideoGenerationProvider(...)`       | Videogenerierung                        |
| `api.registerWebFetchProvider(...)`              | Web-Fetch- / Scrape-Provider            |
| `api.registerWebSearchProvider(...)`             | Websuche                                |

### Tools und Befehle

| Methode                        | Was registriert wird                            |
| ----------------------------- | ------------------------------------------------ |
| `api.registerTool(tool, opts?)` | Agent-Tool (erforderlich oder `{ optional: true }`) |
| `api.registerCommand(def)`      | Benutzerdefinierter Befehl (umgeht das LLM)       |

### Infrastruktur

| Methode                                          | Was registriert wird                  |
| ----------------------------------------------- | ------------------------------------- |
| `api.registerHook(events, handler, opts?)`      | Event-Hook                            |
| `api.registerHttpRoute(params)`                 | Gateway-HTTP-Endpunkt                 |
| `api.registerGatewayMethod(name, handler)`      | Gateway-RPC-Methode                   |
| `api.registerGatewayDiscoveryService(service)`  | Lokaler Gateway-Discovery-Advertiser  |
| `api.registerCli(registrar, opts?)`             | CLI-Unterbefehl                       |
| `api.registerService(service)`                  | Hintergrunddienst                     |
| `api.registerInteractiveHandler(registration)`  | Interaktiver Handler                  |
| `api.registerEmbeddedExtensionFactory(factory)` | Pi-Embedded-Runner-Extension-Factory  |
| `api.registerMemoryPromptSupplement(builder)`   | Additiver speichernaher Prompt-Abschnitt |
| `api.registerMemoryCorpusSupplement(adapter)`   | Additiver Korpus für Speicher-Suche/-Lesen |

<Note>
  Reservierte Core-Admin-Namespaces (`config.*`, `exec.approvals.*`, `wizard.*`,
  `update.*`) bleiben immer `operator.admin`, auch wenn ein Plugin versucht, einen
  engeren Gateway-Methoden-Scope zuzuweisen. Bevorzugen Sie plugin-spezifische Präfixe für
  plugin-eigene Methoden.
</Note>

<Accordion title="Wann registerEmbeddedExtensionFactory verwendet werden sollte">
  Verwenden Sie `api.registerEmbeddedExtensionFactory(...)`, wenn ein Plugin Pi-native
  Event-Timings während eingebetteter OpenClaw-Ausführungen benötigt — zum Beispiel asynchrone
  Umschreibungen von `tool_result`, die erfolgen müssen, bevor die endgültige
  Tool-Ergebnisnachricht ausgegeben wird.

Dies ist derzeit ein Seam für gebündelte Plugins: Nur gebündelte Plugins dürfen eines registrieren,
und sie müssen `contracts.embeddedExtensionFactories: ["pi"]` in
`openclaw.plugin.json` deklarieren. Behalten Sie normale OpenClaw-Plugin-Hooks für alles,
was dieses Low-Level-Seam nicht benötigt.
</Accordion>

### Gateway-Discovery-Registrierung

Mit `api.registerGatewayDiscoveryService(...)` kann ein Plugin das aktive
Gateway auf einem lokalen Discovery-Transport wie mDNS/Bonjour ankündigen. OpenClaw ruft den
Service beim Start des Gateway auf, wenn lokale Discovery aktiviert ist, übergibt die
aktuellen Gateway-Ports und nicht geheime TXT-Hinweisdaten und ruft den zurückgegebenen
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

Gateway-Discovery-Plugins dürfen angekündigte TXT-Werte nicht als Secrets oder
Authentifizierung behandeln. Discovery ist ein Routing-Hinweis; Vertrauen bleibt weiterhin Sache
von Gateway-Auth und TLS-Pinning.

### CLI-Registrierungsmetadaten

`api.registerCli(registrar, opts?)` akzeptiert zwei Arten von Metadaten auf oberster Ebene:

- `commands`: explizite Befehlswurzeln, die dem Registrar gehören
- `descriptors`: Parse-Zeit-Befehlsdeskriptoren, die für Root-CLI-Hilfe,
  Routing und verzögerte Plugin-CLI-Registrierung verwendet werden

Wenn ein Plugin-Befehl im normalen Root-CLI-Pfad lazy geladen bleiben soll,
geben Sie `descriptors` an, die jede Befehlswurzel der obersten Ebene abdecken, die dieser
Registrar bereitstellt.

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
deskriptorbasierten Platzhalter für Parse-Zeit-Lazy-Loading.

### CLI-Backend-Registrierung

Mit `api.registerCliBackend(...)` kann ein Plugin die Standardkonfiguration für ein lokales
KI-CLI-Backend wie `codex-cli` besitzen.

- Die `id` des Backends wird zum Provider-Präfix in Modell-Referenzen wie `codex-cli/gpt-5`.
- Die `config` des Backends verwendet dieselbe Form wie `agents.defaults.cliBackends.<id>`.
- Die Benutzerkonfiguration hat weiterhin Vorrang. OpenClaw merged `agents.defaults.cliBackends.<id>` über den
  Plugin-Standardwert, bevor die CLI ausgeführt wird.
- Verwenden Sie `normalizeConfig`, wenn ein Backend nach dem Merge Kompatibilitäts-Umschreibungen benötigt
  (zum Beispiel zur Normalisierung älterer Flag-Formen).

### Exklusive Slots

| Methode                                     | Was registriert wird                                                                                                                                      |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | Context-Engine (immer nur eine aktiv). Der Callback `assemble()` erhält `availableTools` und `citationsMode`, damit die Engine Prompt-Ergänzungen anpassen kann. |
| `api.registerMemoryCapability(capability)` | Vereinheitlichte Speicher-Capability                                                                                                                      |
| `api.registerMemoryPromptSection(builder)` | Builder für Speicher-Prompt-Abschnitte                                                                                                                    |
| `api.registerMemoryFlushPlan(resolver)`    | Resolver für Speicher-Flush-Pläne                                                                                                                         |
| `api.registerMemoryRuntime(runtime)`       | Speicher-Runtime-Adapter                                                                                                                                  |

### Speicher-Embedding-Adapter

| Methode                                         | Was registriert wird                          |
| ---------------------------------------------- | --------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | Speicher-Embedding-Adapter für das aktive Plugin |

- `registerMemoryCapability` ist die bevorzugte exklusive API für Speicher-Plugins.
- `registerMemoryCapability` kann außerdem `publicArtifacts.listArtifacts(...)`
  bereitstellen, damit Begleit-Plugins exportierte Speicherartefakte über
  `openclaw/plugin-sdk/memory-host-core` nutzen können, statt in das private Layout
  eines bestimmten Speicher-Plugins zu greifen.
- `registerMemoryPromptSection`, `registerMemoryFlushPlan` und
  `registerMemoryRuntime` sind ältere, kompatible exklusive APIs für Speicher-Plugins.
- `registerMemoryEmbeddingProvider` erlaubt dem aktiven Speicher-Plugin, einen
  oder mehrere Embedding-Adapter-IDs zu registrieren (zum Beispiel `openai`, `gemini` oder eine
  benutzerdefinierte, plugindefinierte ID).
- Benutzerkonfigurationen wie `agents.defaults.memorySearch.provider` und
  `agents.defaults.memorySearch.fallback` werden gegen diese registrierten
  Adapter-IDs aufgelöst.

### Events und Lebenszyklus

| Methode                                       | Was sie tut                  |
| -------------------------------------------- | ---------------------------- |
| `api.on(hookName, handler, opts?)`           | Typisierter Lifecycle-Hook   |
| `api.onConversationBindingResolved(handler)` | Callback für Conversation-Binding |

### Semantik von Hook-Entscheidungen

- `before_tool_call`: das Zurückgeben von `{ block: true }` ist terminal. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_tool_call`: das Zurückgeben von `{ block: false }` wird als keine Entscheidung behandelt (genau wie das Weglassen von `block`), nicht als Override.
- `before_install`: das Zurückgeben von `{ block: true }` ist terminal. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `before_install`: das Zurückgeben von `{ block: false }` wird als keine Entscheidung behandelt (genau wie das Weglassen von `block`), nicht als Override.
- `reply_dispatch`: das Zurückgeben von `{ handled: true, ... }` ist terminal. Sobald ein Handler die Zustellung beansprucht, werden Handler mit niedrigerer Priorität und der Standardpfad für die Modellzustellung übersprungen.
- `message_sending`: das Zurückgeben von `{ cancel: true }` ist terminal. Sobald ein Handler dies setzt, werden Handler mit niedrigerer Priorität übersprungen.
- `message_sending`: das Zurückgeben von `{ cancel: false }` wird als keine Entscheidung behandelt (genau wie das Weglassen von `cancel`), nicht als Override.
- `message_received`: verwenden Sie das typisierte Feld `threadId`, wenn Sie eingehendes Thread-/Themen-Routing benötigen. Behalten Sie `metadata` für Channel-spezifische Extras.
- `message_sending`: verwenden Sie die typisierten Routing-Felder `replyToId` / `threadId`, bevor Sie auf Channel-spezifische `metadata` zurückfallen.
- `gateway_start`: verwenden Sie `ctx.config`, `ctx.workspaceDir` und `ctx.getCron?.()` für gatewayeigenen Startzustand statt sich auf interne `gateway:startup`-Hooks zu verlassen.

### API-Objektfelder

| Feld                     | Typ                       | Beschreibung                                                                                |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin-ID                                                                                   |
| `api.name`               | `string`                  | Anzeigename                                                                                 |
| `api.version`            | `string?`                 | Plugin-Version (optional)                                                                   |
| `api.description`        | `string?`                 | Plugin-Beschreibung (optional)                                                              |
| `api.source`             | `string`                  | Plugin-Quellpfad                                                                            |
| `api.rootDir`            | `string?`                 | Plugin-Wurzelverzeichnis (optional)                                                         |
| `api.config`             | `OpenClawConfig`          | Aktueller Konfigurations-Snapshot (aktive In-Memory-Laufzeitkopie, wenn verfügbar)         |
| `api.pluginConfig`       | `Record<string, unknown>` | Plugin-spezifische Konfiguration aus `plugins.entries.<id>.config`                          |
| `api.runtime`            | `PluginRuntime`           | [Runtime-Helper](/de/plugins/sdk-runtime)                                                      |
| `api.logger`             | `PluginLogger`            | Bereichsbezogener Logger (`debug`, `info`, `warn`, `error`)                                 |
| `api.registrationMode`   | `PluginRegistrationMode`  | Aktueller Lademodus; `"setup-runtime"` ist das leichtgewichtige Fenster vor vollständigem Entry-Start/Setup |
| `api.resolvePath(input)` | `(string) => string`      | Pfad relativ zur Plugin-Wurzel auflösen                                                     |

## Konvention für interne Module

Verwenden Sie innerhalb Ihres Plugins lokale Barrel-Dateien für interne Importe:

```
my-plugin/
  api.ts            # Öffentliche Exporte für externe Consumer
  runtime-api.ts    # Nur interne Runtime-Exporte
  index.ts          # Plugin-Entry-Point
  setup-entry.ts    # Leichtgewichtiger Entry nur für Setup (optional)
```

<Warning>
  Importieren Sie Ihr eigenes Plugin niemals über `openclaw/plugin-sdk/<your-plugin>`
  aus Produktionscode. Leiten Sie interne Importe über `./api.ts` oder
  `./runtime-api.ts`. Der SDK-Pfad ist nur der externe Vertrag.
</Warning>

Durch Fassade geladene öffentliche Oberflächen gebündelter Plugins (`api.ts`, `runtime-api.ts`,
`index.ts`, `setup-entry.ts` und ähnliche öffentliche Entry-Dateien) bevorzugen den
aktiven Laufzeit-Konfigurations-Snapshot, wenn OpenClaw bereits läuft. Wenn noch kein Laufzeit-
Snapshot existiert, fallen sie auf die aufgelöste Konfigurationsdatei auf der Festplatte zurück.

Provider-Plugins können ein schmales pluginlokales Vertrags-Barrel bereitstellen, wenn ein
Helper absichtlich providerspezifisch ist und noch nicht in einen generischen SDK-
Unterpfad gehört. Gebündelte Beispiele:

- **Anthropic**: öffentliche `api.ts`- / `contract-api.ts`-Seam für Claude-
  Beta-Header und `service_tier`-Streaming-Helper.
- **`@openclaw/openai-provider`**: `api.ts` exportiert Provider-Builder,
  Standardmodell-Helper und Echtzeit-Provider-Builder.
- **`@openclaw/openrouter-provider`**: `api.ts` exportiert den Provider-Builder
  plus Onboarding-/Konfigurations-Helper.

<Warning>
  Produktionscode von Extensions sollte auch Importe aus `openclaw/plugin-sdk/<other-plugin>`
  vermeiden. Wenn ein Helper wirklich geteilt ist, verschieben Sie ihn in einen neutralen SDK-Unterpfad
  wie `openclaw/plugin-sdk/speech`, `.../provider-model-shared` oder eine andere
  capability-orientierte Oberfläche, statt zwei Plugins miteinander zu koppeln.
</Warning>

## Verwandt

<CardGroup cols={2}>
  <Card title="Entry points" icon="door-open" href="/de/plugins/sdk-entrypoints">
    Optionen für `definePluginEntry` und `defineChannelPluginEntry`.
  </Card>
  <Card title="Runtime helpers" icon="gears" href="/de/plugins/sdk-runtime">
    Vollständige Referenz des Namespace `api.runtime`.
  </Card>
  <Card title="Setup and config" icon="sliders" href="/de/plugins/sdk-setup">
    Packaging, Manifeste und Konfigurationsschemata.
  </Card>
  <Card title="Testing" icon="vial" href="/de/plugins/sdk-testing">
    Test-Utilities und Lint-Regeln.
  </Card>
  <Card title="SDK migration" icon="arrows-turn-right" href="/de/plugins/sdk-migration">
    Migration von veralteten Oberflächen.
  </Card>
  <Card title="Plugin internals" icon="diagram-project" href="/de/plugins/architecture">
    Vertiefte Architektur und Capability-Modell.
  </Card>
</CardGroup>
