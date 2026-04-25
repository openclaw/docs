---
read_when:
    - Entwickeln oder Debuggen nativer OpenClaw-Plugins
    - Verstehen des Plugin-Fähigkeitsmodells oder der Ownership-Grenzen
    - Arbeiten an der Plugin-Ladepipeline oder der Registry
    - Implementieren von Provider-Runtime-Hooks oder Kanal-Plugins
sidebarTitle: Internals
summary: 'Plugin-Interna: Fähigkeitsmodell, Ownership, Verträge, Ladepipeline und Runtime-Helper'
title: Plugin-Interna
x-i18n:
    generated_at: "2026-04-25T13:51:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1fd7d9192c8c06aceeb6e8054a740bba27c94770e17eabf064627adda884e77
    source_path: plugins/architecture.md
    workflow: 15
---

Dies ist die **Architektur-Referenz auf tiefer Ebene** für das Plugin-System von OpenClaw. Für
praktische Anleitungen beginnen Sie mit einer der fokussierten Seiten unten.

<CardGroup cols={2}>
  <Card title="Plugins installieren und verwenden" icon="plug" href="/de/tools/plugin">
    Endbenutzer-Anleitung zum Hinzufügen, Aktivieren und zur Fehlerbehebung von Plugins.
  </Card>
  <Card title="Plugins entwickeln" icon="rocket" href="/de/plugins/building-plugins">
    Tutorial für das erste Plugin mit dem kleinsten funktionierenden Manifest.
  </Card>
  <Card title="Kanal-Plugins" icon="comments" href="/de/plugins/sdk-channel-plugins">
    Ein Messaging-Kanal-Plugin entwickeln.
  </Card>
  <Card title="Provider-Plugins" icon="microchip" href="/de/plugins/sdk-provider-plugins">
    Ein Modell-Provider-Plugin entwickeln.
  </Card>
  <Card title="SDK-Überblick" icon="book" href="/de/plugins/sdk-overview">
    Referenz für Import-Map und Registrierungs-API.
  </Card>
</CardGroup>

## Öffentliches Fähigkeitsmodell

Fähigkeiten sind das öffentliche Modell für **native Plugins** innerhalb von OpenClaw. Jedes
native OpenClaw-Plugin registriert sich für einen oder mehrere Fähigkeitstypen:

| Fähigkeit              | Registrierungsmethode                           | Beispiel-Plugins                    |
| ---------------------- | ----------------------------------------------- | ----------------------------------- |
| Textinferenz           | `api.registerProvider(...)`                     | `openai`, `anthropic`               |
| CLI-Inferenz-Backend   | `api.registerCliBackend(...)`                   | `openai`, `anthropic`               |
| Sprache                | `api.registerSpeechProvider(...)`               | `elevenlabs`, `microsoft`           |
| Realtime-Transkription | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                           |
| Realtime-Stimme        | `api.registerRealtimeVoiceProvider(...)`        | `openai`                            |
| Medienverständnis      | `api.registerMediaUnderstandingProvider(...)`   | `openai`, `google`                  |
| Bildgenerierung        | `api.registerImageGenerationProvider(...)`      | `openai`, `google`, `fal`, `minimax` |
| Musikgenerierung       | `api.registerMusicGenerationProvider(...)`      | `google`, `minimax`                 |
| Videogenerierung       | `api.registerVideoGenerationProvider(...)`      | `qwen`                              |
| Web-Fetch              | `api.registerWebFetchProvider(...)`             | `firecrawl`                         |
| Web-Suche              | `api.registerWebSearchProvider(...)`            | `google`                            |
| Kanal / Messaging      | `api.registerChannel(...)`                      | `msteams`, `matrix`                 |
| Gateway-Discovery      | `api.registerGatewayDiscoveryService(...)`      | `bonjour`                           |

Ein Plugin, das null Fähigkeiten registriert, aber Hooks, Tools, Discovery-
Services oder Hintergrunddienste bereitstellt, ist ein **altes Hook-only-Plugin**. Dieses Muster
wird weiterhin vollständig unterstützt.

### Standpunkt zur externen Kompatibilität

Das Fähigkeitsmodell ist im Core gelandet und wird heute von gebündelten/nativen Plugins
verwendet, aber externe Plugin-Kompatibilität braucht weiterhin eine höhere Hürde als „es ist exportiert, also ist es eingefroren“.

| Pluginsituation                                  | Empfehlung                                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Bestehende externe Plugins                       | Hook-basierte Integrationen funktionsfähig halten; das ist die Kompatibilitäts-Baseline.        |
| Neue gebündelte/native Plugins                   | Explizite Fähigkeitsregistrierung gegenüber providerspezifischen Reach-ins oder neuen Hook-only-Designs bevorzugen. |
| Externe Plugins, die Fähigkeitsregistrierung übernehmen | Erlaubt, aber Fähigkeit-spezifische Helper-Oberflächen als in Entwicklung betrachten, solange die Dokumentation sie nicht als stabil kennzeichnet. |

Die Fähigkeitsregistrierung ist die beabsichtigte Richtung. Alte Hooks bleiben während des
Übergangs der sicherste Weg ohne Bruch für externe Plugins. Exportierte Helper-Subpfade sind nicht alle gleich — bevorzugen Sie schmale dokumentierte Verträge gegenüber zufällig exportierten Helpern.

### Plugin-Formen

OpenClaw klassifiziert jedes geladene Plugin anhand seines tatsächlichen
Registrierungsverhaltens in eine Form (nicht nur anhand statischer Metadaten):

- **plain-capability**: registriert genau einen Fähigkeitstyp (zum Beispiel ein
  reines Provider-Plugin wie `mistral`).
- **hybrid-capability**: registriert mehrere Fähigkeitstypen (zum Beispiel
  besitzt `openai` Textinferenz, Sprache, Medienverständnis und Bild-
  generierung).
- **hook-only**: registriert nur Hooks (typisiert oder benutzerdefiniert), keine Fähigkeiten,
  Tools, Befehle oder Services.
- **non-capability**: registriert Tools, Befehle, Services oder Routen, aber keine
  Fähigkeiten.

Verwenden Sie `openclaw plugins inspect <id>`, um die Form und Aufschlüsselung der Fähigkeiten
eines Plugins zu sehen. Details finden Sie unter [CLI reference](/de/cli/plugins#inspect).

### Alte Hooks

Der Hook `before_agent_start` wird weiterhin als Kompatibilitätspfad für
Hook-only-Plugins unterstützt. Legacy-Plugins aus der Praxis hängen noch immer davon ab.

Richtung:

- funktionsfähig halten
- als alt dokumentieren
- `before_model_resolve` für Arbeit an Modell-/Provider-Overrides bevorzugen
- `before_prompt_build` für Prompt-Mutationen bevorzugen
- erst entfernen, wenn die reale Nutzung sinkt und die Abdeckung durch Fixtures sichere Migration beweist

### Kompatibilitätssignale

Wenn Sie `openclaw doctor` oder `openclaw plugins inspect <id>` ausführen, sehen Sie möglicherweise
eine dieser Bezeichnungen:

| Signal                     | Bedeutung                                                     |
| -------------------------- | ------------------------------------------------------------- |
| **config valid**           | Konfiguration wird korrekt geparst und Plugins werden aufgelöst |
| **compatibility advisory** | Plugin verwendet ein unterstütztes, aber älteres Muster (z. B. `hook-only`) |
| **legacy warning**         | Plugin verwendet `before_agent_start`, was veraltet ist       |
| **hard error**             | Konfiguration ist ungültig oder Plugin konnte nicht geladen werden |

Weder `hook-only` noch `before_agent_start` machen Ihr Plugin heute kaputt:
`hook-only` ist ein Hinweis, und `before_agent_start` löst nur eine Warnung aus. Diese
Signale erscheinen auch in `openclaw status --all` und `openclaw plugins doctor`.

## Architekturüberblick

Das Plugin-System von OpenClaw hat vier Schichten:

1. **Manifest + Discovery**
   OpenClaw findet Kandidaten für Plugins aus konfigurierten Pfaden, Workspace-Roots,
   globalen Plugin-Roots und gebündelten Plugins. Discovery liest zuerst native
   Manifeste `openclaw.plugin.json` sowie unterstützte Bundle-Manifeste.
2. **Aktivierung + Validierung**
   Der Core entscheidet, ob ein erkanntes Plugin aktiviert, deaktiviert, blockiert oder
   für einen exklusiven Slot wie Memory ausgewählt wird.
3. **Runtime-Laden**
   Native OpenClaw-Plugins werden in-process über jiti geladen und registrieren
   Fähigkeiten in einer zentralen Registry. Kompatible Bundles werden in
   Registry-Einträge normalisiert, ohne Runtime-Code zu importieren.
4. **Nutzung der Oberflächen**
   Der Rest von OpenClaw liest die Registry, um Tools, Kanäle, Provider-
   Einrichtung, Hooks, HTTP-Routen, CLI-Befehle und Services bereitzustellen.

Speziell für die Plugin-CLI ist die Discovery von Root-Befehlen in zwei Phasen aufgeteilt:

- Parse-Time-Metadaten kommen aus `registerCli(..., { descriptors: [...] })`
- das eigentliche Plugin-CLI-Modul kann lazy bleiben und sich beim ersten Aufruf registrieren

Dadurch bleibt der CLI-Code im Besitz des Plugins, während OpenClaw weiterhin
Root-Befehlsnamen vor dem Parsen reservieren kann.

Die wichtige Designgrenze:

- Manifest-/Konfigurationsvalidierung sollte anhand von **Manifest-/Schema-Metadaten**
  funktionieren, ohne Plugin-Code auszuführen
- native Discovery von Fähigkeiten darf vertrauenswürdigen Plugin-Einstiegscode laden, um einen
  nicht aktivierenden Registry-Snapshot aufzubauen
- natives Runtime-Verhalten kommt aus dem Pfad `register(api)` des Plugin-Moduls
  mit `api.registrationMode === "full"`

Diese Aufteilung ermöglicht es OpenClaw, Konfigurationen zu validieren, fehlende/deaktivierte Plugins zu erklären und
UI-/Schema-Hinweise aufzubauen, bevor die vollständige Runtime aktiv ist.

### Aktivierungsplanung

Die Aktivierungsplanung ist Teil der Control Plane. Aufrufer können abfragen, welche Plugins
für einen konkreten Befehl, Provider, Kanal, eine Route, ein Agent-Harness oder eine Fähigkeit relevant sind, bevor breitere Runtime-Registries geladen werden.

Der Planner hält das aktuelle Manifest-Verhalten kompatibel:

- `activation.*`-Felder sind explizite Hinweise für den Planner
- `providers`, `channels`, `commandAliases`, `setup.providers`,
  `contracts.tools` und Hooks bleiben der Fallback des Manifests für Ownership
- die IDs-only-Planner-API bleibt für bestehende Aufrufer verfügbar
- die Plan-API meldet Reason-Labels, sodass Diagnosen explizite
  Hinweise von Ownership-Fallback unterscheiden können

Behandeln Sie `activation` nicht als Lifecycle-Hook oder als Ersatz für
`register(...)`. Es sind Metadaten, um das Laden einzugrenzen. Bevorzugen Sie Ownership-Felder,
wenn sie die Beziehung bereits beschreiben; verwenden Sie `activation` nur für zusätzliche
Hinweise an den Planner.

### Kanal-Plugins und das gemeinsame Message-Tool

Kanal-Plugins müssen für normale Chat-Aktionen kein separates Send/Edit/React-Tool registrieren. OpenClaw hält ein gemeinsames `message`-Tool im Core, und
Kanal-Plugins besitzen die kanalspezifische Discovery und Ausführung dahinter.

Die aktuelle Grenze ist:

- der Core besitzt den gemeinsamen Host des `message`-Tools, Prompt-Verkabelung, Sitzung-/Thread-
  Bookkeeping und Ausführungs-Dispatch
- Kanal-Plugins besitzen Discovery mit begrenztem Scope für Aktionen, Capability-Discovery und alle
  kanalspezifischen Schema-Fragmente
- Kanal-Plugins besitzen kanalspezifische Gesprächsgrammatik pro Provider, z. B.
  wie Gesprächs-IDs Thread-IDs kodieren oder von Elternunterhaltungen erben
- Kanal-Plugins führen die finale Aktion über ihren Action-Adapter aus

Für Kanal-Plugins ist die SDK-Oberfläche
`ChannelMessageActionAdapter.describeMessageTool(...)`. Dieser einheitliche Discovery-
Aufruf ermöglicht es einem Plugin, sichtbare Aktionen, Fähigkeiten und Schema-
Beiträge gemeinsam zurückzugeben, sodass diese Teile nicht auseinanderdriften.

Wenn ein kanalspezifischer Parameter des Message-Tools eine Medienquelle wie einen
lokalen Pfad oder eine entfernte Medien-URL enthält, sollte das Plugin außerdem
`mediaSourceParams` aus `describeMessageTool(...)` zurückgeben. Der Core verwendet diese explizite
Liste, um Normalisierung von Sandbox-Pfaden und Hinweise zum Zugriff auf ausgehende Medien anzuwenden,
ohne Plugin-eigene Parameternamen hart zu codieren.
Bevorzugen Sie dort aktionsbezogene Maps und keine flache kanalweite Liste, damit ein
nur profilbezogener Medienparameter nicht bei nicht verwandten Aktionen wie
`send` normalisiert wird.

Der Core übergibt Runtime-Scope an diesen Discovery-Schritt. Wichtige Felder sind:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- vertrauenswürdige eingehende `requesterSenderId`

Das ist wichtig für kontextsensitive Plugins. Ein Kanal kann Message-Aktionen basierend auf
aktivem Konto, aktuellem Raum/Thread/Nachricht oder
vertrauenswürdiger Absenderidentität ausblenden oder sichtbar machen, ohne kanalspezifische Zweige im
gemeinsamen `message`-Tool des Core hart zu codieren.

Deshalb bleiben Routing-Änderungen im eingebetteten Runner weiterhin Plugin-Arbeit: Der Runner ist
dafür verantwortlich, die aktuelle Chat-/Sitzungsidentität in die Discovery-Grenze des Plugins weiterzuleiten, damit das gemeinsame `message`-Tool die richtige plugin-eigene Oberfläche für den aktuellen Turn bereitstellt.

Für plugin-eigene Ausführungs-Helper sollten gebündelte Plugins die Ausführungs-
Runtime innerhalb ihrer eigenen Erweiterungsmodule behalten. Der Core besitzt die Runtimes für Message-Aktionen von Discord,
Slack, Telegram oder WhatsApp nicht mehr unter `src/agents/tools`.
Wir veröffentlichen keine separaten Subpfade `plugin-sdk/*-action-runtime`, und gebündelte
Plugins sollten ihren eigenen lokalen Runtime-Code direkt aus ihren
erweiterungseigenen Modulen importieren.

Dieselbe Grenze gilt allgemein für Provider-benannte SDK-Seams: Der Core sollte
keine kanalspezifischen Convenience-Barrels für Slack, Discord, Signal,
WhatsApp oder ähnliche Erweiterungen importieren. Wenn der Core ein Verhalten benötigt, sollte er entweder das eigene Barrel `api.ts` / `runtime-api.ts` des gebündelten Plugins verwenden oder den Bedarf in eine schmale generische Fähigkeit im gemeinsamen SDK überführen.

Speziell für Polls gibt es zwei Ausführungspfade:

- `outbound.sendPoll` ist die gemeinsame Basis für Kanäle, die zum gemeinsamen
  Poll-Modell passen
- `actions.handleAction("poll")` ist der bevorzugte Pfad für kanalspezifische
  Poll-Semantik oder zusätzliche Poll-Parameter

Der Core verschiebt das gemeinsame Poll-Parsing jetzt, bis der plugin-eigene Poll-Dispatch
die Aktion ablehnt, sodass plugin-eigene Poll-Handler kanalspezifische Poll-Felder akzeptieren können,
ohne zuvor vom generischen Poll-Parser blockiert zu werden.

Siehe [Plugin architecture internals](/de/plugins/architecture-internals) für die vollständige Startsequenz.

## Ownership-Modell für Fähigkeiten

OpenClaw behandelt ein natives Plugin als Ownership-Grenze für ein **Unternehmen** oder ein
**Feature**, nicht als Sammelsurium nicht zusammenhängender Integrationen.

Das bedeutet:

- ein Unternehmens-Plugin sollte in der Regel alle OpenClaw-seitigen Oberflächen dieses Unternehmens besitzen
- ein Feature-Plugin sollte in der Regel die vollständige Oberfläche des von ihm eingeführten Features besitzen
- Kanäle sollten gemeinsame Core-Fähigkeiten nutzen, statt Provider-Verhalten ad hoc neu zu implementieren

<Accordion title="Beispiel für Ownership-Muster über gebündelte Plugins hinweg">
  - **Vendor mit mehreren Fähigkeiten**: `openai` besitzt Textinferenz, Sprache, Realtime-
    Stimme, Medienverständnis und Bildgenerierung. `google` besitzt Text-
    inferenz sowie Medienverständnis, Bildgenerierung und Web-Suche.
    `qwen` besitzt Textinferenz sowie Medienverständnis und Videogenerierung.
  - **Vendor mit einer Fähigkeit**: `elevenlabs` und `microsoft` besitzen Sprache;
    `firecrawl` besitzt Web-Fetch; `minimax` / `mistral` / `moonshot` / `zai` besitzen
    Backends für Medienverständnis.
  - **Feature-Plugin**: `voice-call` besitzt Call-Transport, Tools, CLI, Routen
    und Twilio-Medienstream-Bridge, nutzt aber gemeinsame Fähigkeiten für Sprache, Realtime-
    Transkription und Realtime-Stimme, statt Vendor-Plugins direkt zu importieren.
</Accordion>

Der beabsichtigte Endzustand ist:

- OpenAI lebt in einem Plugin, selbst wenn es Textmodelle, Sprache, Bilder und
  künftig Video umfasst
- ein anderer Vendor kann dasselbe für seine eigene Oberflächenfläche tun
- Kanäle kümmern sich nicht darum, welches Vendor-Plugin den Provider besitzt; sie nutzen
  den gemeinsamen Fähigkeitsvertrag, den der Core bereitstellt

Das ist der entscheidende Unterschied:

- **Plugin** = Ownership-Grenze
- **Fähigkeit** = Core-Vertrag, den mehrere Plugins implementieren oder nutzen können

Wenn OpenClaw also eine neue Domäne wie Video hinzufügt, lautet die erste Frage nicht
„welcher Provider sollte die Videoverarbeitung hart codieren?“ Die erste Frage lautet
„wie sieht der Core-Fähigkeitsvertrag für Video aus?“ Sobald dieser Vertrag existiert, können Vendor-Plugins
sich dafür registrieren und Kanal-/Feature-Plugins ihn nutzen.

Wenn die Fähigkeit noch nicht existiert, ist in der Regel der richtige Schritt:

1. die fehlende Fähigkeit im Core definieren
2. sie typisiert über die Plugin-API/Runtime bereitstellen
3. Kanäle/Features gegen diese Fähigkeit verdrahten
4. Vendor-Plugins Implementierungen registrieren lassen

Dadurch bleibt Ownership explizit und zugleich wird vermieden, dass Core-Verhalten von
einem einzelnen Vendor oder einem einmaligen pluginspezifischen Codepfad abhängt.

### Schichtung von Fähigkeiten

Verwenden Sie dieses mentale Modell, um zu entscheiden, wohin Code gehört:

- **Core-Fähigkeitsschicht**: gemeinsame Orchestrierung, Richtlinien, Fallback, Regeln zum Zusammenführen der Konfiguration,
  Zustellungssemantik und typisierte Verträge
- **Vendor-Plugin-Schicht**: vendorspezifische APIs, Auth, Modellkataloge, Sprach-
  synthese, Bildgenerierung, künftige Video-Backends, Usage-Endpunkte
- **Kanal-/Feature-Plugin-Schicht**: Integration für Slack/Discord/voice-call/usw.,
  die gemeinsame Core-Fähigkeiten nutzt und auf einer Oberfläche darstellt

Zum Beispiel folgt TTS diesem Muster:

- der Core besitzt TTS-Richtlinie zur Antwortzeit, Fallback-Reihenfolge, Präferenzen und Kanalzustellung
- `openai`, `elevenlabs` und `microsoft` besitzen die Implementierungen der Synthese
- `voice-call` nutzt den Runtime-Helper für TTS in der Telefonie

Dasselbe Muster sollte für zukünftige Fähigkeiten bevorzugt werden.

### Beispiel für ein Unternehmens-Plugin mit mehreren Fähigkeiten

Ein Unternehmens-Plugin sollte sich von außen kohärent anfühlen. Wenn OpenClaw gemeinsame
Verträge für Modelle, Sprache, Realtime-Transkription, Realtime-Stimme, Medien-
verständnis, Bildgenerierung, Videogenerierung, Web-Fetch und Web-Suche hat,
kann ein Vendor alle seine Oberflächen an einer Stelle besitzen:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // Auth-/Modellkatalog-/Runtime-Hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // Vendor-Sprachkonfiguration — das Interface SpeechProviderPlugin direkt implementieren
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // Logik für Anmeldedaten + Fetch
      }),
    );
  },
};

export default plugin;
```

Entscheidend sind nicht die exakten Namen der Helper. Entscheidend ist die Form:

- ein Plugin besitzt die Oberfläche des Vendors
- der Core besitzt weiterhin die Fähigkeitsverträge
- Kanäle und Feature-Plugins nutzen `api.runtime.*`-Helper, nicht Vendor-Code
- Vertragstests können validieren, dass das Plugin die Fähigkeiten registriert hat, die
  es zu besitzen beansprucht

### Beispiel für eine Fähigkeit: Video-Verständnis

OpenClaw behandelt Bild-/Audio-/Video-Verständnis bereits als eine gemeinsame
Fähigkeit. Dasselbe Ownership-Modell gilt auch dort:

1. der Core definiert den Vertrag für Medienverständnis
2. Vendor-Plugins registrieren je nach Bedarf `describeImage`, `transcribeAudio` und
   `describeVideo`
3. Kanal- und Feature-Plugins nutzen das gemeinsame Verhalten des Core, statt
   direkt Vendor-Code zu verdrahten

Dadurch wird vermieden, dass Video-Annahmen eines einzelnen Providers in den Core eingebrannt werden. Das Plugin besitzt
die Oberfläche des Vendors; der Core besitzt den Fähigkeitsvertrag und das Fallback-Verhalten.

Die Videogenerierung verwendet bereits dieselbe Abfolge: Der Core besitzt den typisierten
Fähigkeitsvertrag und den Runtime-Helper, und Vendor-Plugins registrieren
Implementierungen `api.registerVideoGenerationProvider(...)` dagegen.

Benötigen Sie eine konkrete Checkliste für die Einführung? Siehe
[Capability Cookbook](/de/plugins/architecture).

## Verträge und Durchsetzung

Die Oberfläche der Plugin-API ist absichtlich typisiert und in
`OpenClawPluginApi` zentralisiert. Dieser Vertrag definiert die unterstützten Registrierungspunkte und
die Runtime-Helper, auf die sich ein Plugin verlassen darf.

Warum das wichtig ist:

- Plugin-Autoren erhalten einen stabilen internen Standard
- der Core kann doppelte Ownership ablehnen, etwa wenn zwei Plugins dieselbe
  Provider-ID registrieren
- der Start kann umsetzbare Diagnosen für fehlerhafte Registrierungen liefern
- Vertragstests können Ownership gebündelter Plugins durchsetzen und stille Drift verhindern

Es gibt zwei Ebenen der Durchsetzung:

1. **Durchsetzung bei der Runtime-Registrierung**
   Die Plugin-Registry validiert Registrierungen während des Ladens von Plugins. Beispiele:
   doppelte Provider-IDs, doppelte IDs von Sprach-Providern und fehlerhafte
   Registrierungen erzeugen Plugin-Diagnosen statt undefiniertem Verhalten.
2. **Vertragstests**
   Gebündelte Plugins werden während Testläufen in Vertrags-Registries erfasst, sodass
   OpenClaw Ownership explizit validieren kann. Heute wird dies für Modell-
   provider, Sprach-Provider, Provider für Web-Suche und die Ownership gebündelter Registrierungen verwendet.

Die praktische Wirkung ist, dass OpenClaw von Anfang an weiß, welches Plugin welche
Oberfläche besitzt. Dadurch können Core und Kanäle nahtlos zusammenwirken, weil Ownership
deklariert, typisiert und testbar ist, statt implizit zu bleiben.

### Was in einen Vertrag gehört

Gute Plugin-Verträge sind:

- typisiert
- klein
- fähigkeitsspezifisch
- im Besitz des Core
- von mehreren Plugins wiederverwendbar
- von Kanälen/Features ohne Wissen über den Vendor nutzbar

Schlechte Plugin-Verträge sind:

- vendorspezifische Richtlinien, die im Core verborgen sind
- einmalige Escape-Hatches für Plugins, die die Registry umgehen
- Kanalcode, der direkt in eine Vendor-Implementierung greift
- ad hoc Runtime-Objekte, die nicht Teil von `OpenClawPluginApi` oder
  `api.runtime` sind

Wenn Sie unsicher sind, erhöhen Sie die Abstraktionsebene: Definieren Sie zuerst die Fähigkeit und lassen Sie dann Plugins daran andocken.

## Ausführungsmodell

Native OpenClaw-Plugins laufen **in-process** mit dem Gateway. Sie sind nicht
sandboxed. Ein geladenes natives Plugin hat dieselbe vertrauensbezogene Prozessgrenze wie
Core-Code.

Auswirkungen:

- ein natives Plugin kann Tools, Netzwerk-Handler, Hooks und Services registrieren
- ein Bug in einem nativen Plugin kann das Gateway zum Absturz bringen oder destabilisieren
- ein bösartiges natives Plugin entspricht willkürlicher Codeausführung innerhalb des OpenClaw-Prozesses

Kompatible Bundles sind standardmäßig sicherer, weil OpenClaw sie derzeit
als Metadaten-/Inhaltspakete behandelt. In aktuellen Releases bedeutet das überwiegend
gebündelte Skills.

Verwenden Sie Allowlists und explizite Installations-/Ladepfade für nicht gebündelte Plugins. Behandeln Sie
Workspace-Plugins als Code für Entwicklungszeit, nicht als Produktionsstandard.

Bei gebündelten Workspace-Paketnamen sollte die Plugin-ID im npm-
Namen verankert bleiben: standardmäßig `@openclaw/<id>` oder ein genehmigtes typisiertes Suffix wie
`-provider`, `-plugin`, `-speech`, `-sandbox` oder `-media-understanding`, wenn
das Paket absichtlich eine engere Plugin-Rolle bereitstellt.

Wichtiger Hinweis zum Vertrauen:

- `plugins.allow` vertraut **Plugin-IDs**, nicht der Herkunft der Quelle.
- Ein Workspace-Plugin mit derselben ID wie ein gebündeltes Plugin überschattet absichtlich
  die gebündelte Kopie, wenn dieses Workspace-Plugin aktiviert/auf der Allowlist ist.
- Das ist normal und nützlich für lokale Entwicklung, Patch-Tests und Hotfixes.
- Das Vertrauen in gebündelte Plugins wird aus dem Quell-Snapshot aufgelöst — dem Manifest und
  Code auf dem Datenträger zum Ladezeitpunkt — und nicht aus Installationsmetadaten. Ein beschädigter
  oder ersetzter Installationsdatensatz kann die Vertrauensoberfläche eines gebündelten Plugins nicht stillschweigend
  über das hinaus erweitern, was der tatsächliche Quellcode behauptet.

## Export-Grenze

OpenClaw exportiert Fähigkeiten, keine Convenience für Implementierungen.

Halten Sie die Registrierung von Fähigkeiten öffentlich. Beschneiden Sie nicht-vertragliche Helper-Exporte:

- gebündelte pluginspezifische Helper-Subpfade
- Runtime-Plumbing-Subpfade, die nicht als öffentliche API gedacht sind
- vendorspezifische Convenience-Helper
- Setup-/Onboarding-Helper, die Implementierungsdetails sind

Einige Helper-Subpfade gebündelter Plugins verbleiben aus Kompatibilitätsgründen und für die Pflege gebündelter Plugins weiterhin in der generierten SDK-Export-
Map. Aktuelle Beispiele sind
`plugin-sdk/feishu`, `plugin-sdk/feishu-setup`, `plugin-sdk/zalo`,
`plugin-sdk/zalo-setup` und mehrere `plugin-sdk/matrix*`-Seams. Behandeln Sie diese als
reservierte Implementierungsdetail-Exporte, nicht als empfohlenes SDK-Muster für
neue Drittanbieter-Plugins.

## Interna und Referenz

Zur Ladepipeline, zum Registry-Modell, zu Provider-Runtime-Hooks, Gateway-HTTP-
Routen, Message-Tool-Schemas, zur Auflösung von Kanalzielen, Provider-Katalogen,
Context-Engine-Plugins und zur Anleitung zum Hinzufügen einer neuen Fähigkeit siehe
[Plugin architecture internals](/de/plugins/architecture-internals).

## Verwandt

- [Plugins entwickeln](/de/plugins/building-plugins)
- [Einrichtung des Plugin-SDK](/de/plugins/sdk-setup)
- [Plugin-Manifest](/de/plugins/manifest)
