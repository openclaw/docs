---
read_when:
    - Native OpenClaw-Plugins erstellen oder debuggen
    - Das Plugin-Fähigkeitsmodell oder Zuständigkeitsgrenzen verstehen
    - Arbeiten an der Plugin-Ladepipeline oder Registry
    - Implementieren von Provider-Runtime-Hooks oder Channel-Plugins
sidebarTitle: Internals
summary: 'Plugin-Interna: Fähigkeitsmodell, Zuständigkeit, Kontrakte, Ladepipeline und Laufzeit-Hilfsfunktionen'
title: Plugin-Interna
x-i18n:
    generated_at: "2026-04-30T07:04:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1516e0784a005af87a6c081d8027a1e2dc10445e47b6824488e9d9987bb96975
    source_path: plugins/architecture.md
    workflow: 16
---

Dies ist die **ausführliche Architekturreferenz** für das OpenClaw-Plugin-System. Für praktische Anleitungen beginnen Sie mit einer der fokussierten Seiten unten.

<CardGroup cols={2}>
  <Card title="Plugins installieren und verwenden" icon="plug" href="/de/tools/plugin">
    Anleitung für Endbenutzer zum Hinzufügen, Aktivieren und Beheben von Problemen mit Plugins.
  </Card>
  <Card title="Plugins erstellen" icon="rocket" href="/de/plugins/building-plugins">
    Erstes-Plugin-Tutorial mit dem kleinsten funktionsfähigen Manifest.
  </Card>
  <Card title="Channel-Plugins" icon="comments" href="/de/plugins/sdk-channel-plugins">
    Erstellen Sie ein Plugin für einen Messaging-Channel.
  </Card>
  <Card title="Provider-Plugins" icon="microchip" href="/de/plugins/sdk-provider-plugins">
    Erstellen Sie ein Plugin für einen Modell-Provider.
  </Card>
  <Card title="SDK-Überblick" icon="book" href="/de/plugins/sdk-overview">
    Referenz zu Import-Map und Registrierungs-API.
  </Card>
</CardGroup>

## Öffentliches Capability-Modell

Capabilities sind das öffentliche **native Plugin**-Modell innerhalb von OpenClaw. Jedes native OpenClaw-Plugin registriert sich für einen oder mehrere Capability-Typen:

| Capability             | Registrierungsmethode                           | Beispiel-Plugins                    |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Textinferenz           | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI-Inferenz-Backend   | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Sprache                | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Echtzeit-Transkription | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Echtzeitstimme         | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Medienverständnis      | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Bildgenerierung        | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Musikgenerierung       | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Videogenerierung       | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web-Abruf              | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Websuche               | `api.registerWebSearchProvider(...)`             | `google`                             |
| Channel / Messaging    | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Gateway-Erkennung      | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
Ein Plugin, das keine Capabilities registriert, aber Hooks, Tools, Erkennungsdienste oder Hintergrunddienste bereitstellt, ist ein **Legacy-Hook-only**-Plugin. Dieses Muster wird weiterhin vollständig unterstützt.
</Note>

### Haltung zur externen Kompatibilität

Das Capability-Modell ist im Core gelandet und wird heute von gebündelten/nativen Plugins verwendet, aber externe Plugin-Kompatibilität braucht weiterhin einen strengeren Maßstab als „es ist exportiert, also ist es eingefroren“.

| Plugin-Situation                                | Leitlinie                                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Bestehende externe Plugins                       | Hook-basierte Integrationen funktionsfähig halten; dies ist die Kompatibilitätsbasis.            |
| Neue gebündelte/native Plugins                   | Explizite Capability-Registrierung gegenüber herstellerspezifischen Zugriffen oder neuen Hook-only-Designs bevorzugen. |
| Externe Plugins, die Capability-Registrierung übernehmen | Erlaubt, aber Capability-spezifische Hilfsoberflächen als in Entwicklung behandeln, sofern die Dokumentation sie nicht als stabil kennzeichnet. |

Capability-Registrierung ist die beabsichtigte Richtung. Legacy-Hooks bleiben während der Übergangsphase der sicherste Pfad ohne Breaking Changes für externe Plugins. Exportierte Hilfs-Subpfade sind nicht alle gleichwertig — bevorzugen Sie enge dokumentierte Verträge gegenüber zufälligen Hilfsexporten.

### Plugin-Formen

OpenClaw klassifiziert jedes geladene Plugin anhand seines tatsächlichen Registrierungsverhaltens in eine Form (nicht nur anhand statischer Metadaten):

<AccordionGroup>
  <Accordion title="plain-capability">
    Registriert genau einen Capability-Typ (zum Beispiel ein reines Provider-Plugin wie `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Registriert mehrere Capability-Typen (zum Beispiel besitzt `openai` Textinferenz, Sprache, Medienverständnis und Bildgenerierung).
  </Accordion>
  <Accordion title="hook-only">
    Registriert nur Hooks (typisiert oder benutzerdefiniert), keine Capabilities, Tools, Befehle oder Dienste.
  </Accordion>
  <Accordion title="non-capability">
    Registriert Tools, Befehle, Dienste oder Routen, aber keine Capabilities.
  </Accordion>
</AccordionGroup>

Verwenden Sie `openclaw plugins inspect <id>`, um die Form und Capability-Aufschlüsselung eines Plugins anzuzeigen. Details finden Sie in der [CLI-Referenz](/de/cli/plugins#inspect).

### Legacy-Hooks

Der Hook `before_agent_start` bleibt als Kompatibilitätspfad für Hook-only-Plugins unterstützt. Legacy-Plugins aus der Praxis hängen weiterhin davon ab.

Richtung:

- funktionsfähig halten
- als Legacy dokumentieren
- `before_model_resolve` für Arbeiten an Modell-/Provider-Overrides bevorzugen
- `before_prompt_build` für Arbeiten an Prompt-Mutationen bevorzugen
- erst entfernen, nachdem die reale Nutzung zurückgegangen ist und Fixture-Abdeckung die Migrationssicherheit belegt

### Kompatibilitätssignale

Wenn Sie `openclaw doctor` oder `openclaw plugins inspect <id>` ausführen, sehen Sie möglicherweise eines dieser Labels:

| Signal                     | Bedeutung                                                   |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Konfiguration wird korrekt geparst und Plugins werden aufgelöst |
| **compatibility advisory** | Plugin verwendet ein unterstütztes, aber älteres Muster (z. B. `hook-only`) |
| **legacy warning**         | Plugin verwendet `before_agent_start`, das veraltet ist      |
| **hard error**             | Konfiguration ist ungültig oder Plugin konnte nicht geladen werden |

Weder `hook-only` noch `before_agent_start` werden Ihr Plugin heute beschädigen: `hook-only` ist ein Hinweis, und `before_agent_start` löst nur eine Warnung aus. Diese Signale erscheinen auch in `openclaw status --all` und `openclaw plugins doctor`.

## Architekturüberblick

Das Plugin-System von OpenClaw hat vier Schichten:

<Steps>
  <Step title="Manifest + Erkennung">
    OpenClaw findet Plugin-Kandidaten aus konfigurierten Pfaden, Workspace-Roots, globalen Plugin-Roots und gebündelten Plugins. Die Erkennung liest zuerst native `openclaw.plugin.json`-Manifeste sowie unterstützte Bundle-Manifeste.
  </Step>
  <Step title="Aktivierung + Validierung">
    Der Core entscheidet, ob ein erkanntes Plugin aktiviert, deaktiviert, blockiert oder für einen exklusiven Slot wie Memory ausgewählt wird.
  </Step>
  <Step title="Runtime-Laden">
    Native OpenClaw-Plugins werden prozessintern über jiti geladen und registrieren Capabilities in einer zentralen Registry. Kompatible Bundles werden in Registry-Einträge normalisiert, ohne Runtime-Code zu importieren.
  </Step>
  <Step title="Oberflächennutzung">
    Der Rest von OpenClaw liest die Registry, um Tools, Channels, Provider-Einrichtung, Hooks, HTTP-Routen, CLI-Befehle und Dienste bereitzustellen.
  </Step>
</Steps>

Speziell für die Plugin-CLI ist die Erkennung von Root-Befehlen in zwei Phasen aufgeteilt:

- Metadaten zur Parse-Zeit kommen aus `registerCli(..., { descriptors: [...] })`
- das echte Plugin-CLI-Modul kann lazy bleiben und sich beim ersten Aufruf registrieren

So bleibt Plugin-eigener CLI-Code im Plugin, während OpenClaw weiterhin Root-Befehlsnamen vor dem Parsen reservieren kann.

Die wichtige Designgrenze:

- Manifest-/Konfigurationsvalidierung sollte anhand von **Manifest-/Schema-Metadaten** funktionieren, ohne Plugin-Code auszuführen
- native Capability-Erkennung darf vertrauenswürdigen Plugin-Einstiegscode laden, um einen nicht aktivierenden Registry-Snapshot zu erstellen
- natives Runtime-Verhalten kommt aus dem `register(api)`-Pfad des Plugin-Moduls mit `api.registrationMode === "full"`

Diese Aufteilung ermöglicht es OpenClaw, Konfiguration zu validieren, fehlende/deaktivierte Plugins zu erklären und UI-/Schema-Hinweise zu erstellen, bevor die vollständige Runtime aktiv ist.

### Plugin-Metadaten-Snapshot und Lookup-Tabelle

Beim Gateway-Start wird ein `PluginMetadataSnapshot` für den aktuellen Konfigurations-Snapshot erstellt. Der Snapshot enthält nur Metadaten: Er speichert den installierten Plugin-Index, die Manifest-Registry, Manifest-Diagnosen, Owner-Maps, einen Plugin-ID-Normalizer und Manifest-Einträge. Er enthält keine geladenen Plugin-Module, Provider-SDKs, Paket-Inhalte oder Runtime-Exporte.

Plugin-bewusste Konfigurationsvalidierung, automatische Aktivierung beim Start und Gateway-Plugin-Bootstrap verwenden diesen Snapshot, statt Manifest-/Index-Metadaten unabhängig neu aufzubauen. `PluginLookUpTable` wird aus demselben Snapshot abgeleitet und fügt den Startup-Plugin-Plan für die aktuelle Runtime-Konfiguration hinzu.

Nach dem Start behält Gateway den aktuellen Metadaten-Snapshot als ersetzbares Runtime-Produkt. Wiederholte Runtime-Provider-Erkennung kann diesen Snapshot verwenden, statt den installierten Index und die Manifest-Registry für jeden Provider-Katalog-Durchlauf neu zu rekonstruieren. Der Snapshot wird beim Herunterfahren des Gateway, bei Änderungen an Konfiguration/Plugin-Inventar und bei Schreibvorgängen in den installierten Index gelöscht oder ersetzt; Aufrufer fallen auf den kalten Manifest-/Index-Pfad zurück, wenn kein kompatibler aktueller Snapshot vorhanden ist. Kompatibilitätsprüfungen müssen Plugin-Erkennungs-Roots wie `plugins.load.paths` und den Standard-Agent-Workspace einschließen, da Workspace-Plugins Teil des Metadatenumfangs sind.

Snapshot und Lookup-Tabelle halten wiederholte Startentscheidungen auf dem schnellen Pfad:

- Channel-Ownership
- verzögerter Channel-Start
- Startup-Plugin-IDs
- Provider- und CLI-Backend-Ownership
- Ownership für Setup-Provider, Befehlsalias, Modellkatalog-Provider und Manifest-Vertrag
- Validierung von Plugin-Konfigurationsschema und Channel-Konfigurationsschema
- Entscheidungen zur automatischen Aktivierung beim Start

Die Sicherheitsgrenze ist Snapshot-Ersetzung, nicht Mutation. Bauen Sie den Snapshot neu auf, wenn sich Konfiguration, Plugin-Inventar, Installationsdatensätze oder persistierte Indexrichtlinien ändern. Behandeln Sie ihn nicht als breite veränderliche globale Registry, und behalten Sie keine unbegrenzten historischen Snapshots. Runtime-Plugin-Laden bleibt von Metadaten-Snapshots getrennt, damit veralteter Runtime-Zustand nicht hinter einem Metadaten-Cache verborgen werden kann.

Die Cache-Regel ist in [Interne Plugin-Architektur](/de/plugins/architecture-internals#plugin-cache-boundary) dokumentiert: Manifest- und Erkennungsmetadaten sind aktuell, sofern ein Aufrufer keinen expliziten Snapshot, keine Lookup-Tabelle oder keine Manifest-Registry für den aktuellen Ablauf hält. Versteckte Metadaten-Caches und Wall-Clock-TTLs sind nicht Teil des Plugin-Ladens. Nur Runtime-Loader-, Modul- und Dependency-Artefakt-Caches dürfen bestehen bleiben, nachdem Code oder installierte Artefakte tatsächlich geladen wurden.

Einige Cold-Path-Aufrufer rekonstruieren Manifest-Registries weiterhin direkt aus dem persistierten installierten Plugin-Index, statt eine Gateway-`PluginLookUpTable` zu erhalten. Dieser Pfad rekonstruiert die Registry nun bei Bedarf; bevorzugen Sie das Weiterreichen der aktuellen Lookup-Tabelle oder einer expliziten Manifest-Registry durch Runtime-Abläufe, wenn ein Aufrufer bereits eine hat.

### Aktivierungsplanung

Aktivierungsplanung ist Teil der Control Plane. Aufrufer können fragen, welche Plugins für einen konkreten Befehl, Provider, Channel, eine Route, ein Agent-Harness oder eine Capability relevant sind, bevor breitere Runtime-Registries geladen werden.

Der Planner hält aktuelles Manifest-Verhalten kompatibel:

- `activation.*`-Felder sind explizite Planner-Hinweise
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` und Hooks bleiben Manifest-Ownership-Fallback
- die reine ID-Planner-API bleibt für bestehende Aufrufer verfügbar
- die Plan-API meldet Begründungs-Labels, damit Diagnosen explizite Hinweise von Ownership-Fallback unterscheiden können

<Warning>
Behandeln Sie `activation` nicht als Lebenszyklus-Hook oder als Ersatz für `register(...)`. Es sind Metadaten, die zum Eingrenzen des Ladens verwendet werden. Bevorzugen Sie Ownership-Felder, wenn diese die Beziehung bereits beschreiben; verwenden Sie `activation` nur für zusätzliche Planner-Hinweise.
</Warning>

### Channel-Plugins und das gemeinsame Nachrichtentool

Channel-Plugins müssen kein separates Sende-/Bearbeitungs-/Reaktionstool für normale Chat-Aktionen registrieren. OpenClaw hält ein gemeinsames `message`-Tool im Core vor, und Channel-Plugins besitzen die channelspezifische Erkennung und Ausführung dahinter.

Die aktuelle Grenze ist:

- Core besitzt den Host des gemeinsamen `message`-Tools, Prompt-Verkabelung, Sitzungs-/Thread-Buchhaltung und Ausführungsdispatch
- Channel-Plugins besitzen die scoped Aktionserkennung, Fähigkeitserkennung und alle channelspezifischen Schemafragmente
- Channel-Plugins besitzen die providerspezifische Sitzungs-Konversationsgrammatik, etwa wie Konversations-IDs Thread-IDs codieren oder von übergeordneten Konversationen erben
- Channel-Plugins führen die finale Aktion über ihren Action-Adapter aus

Für Channel-Plugins ist die SDK-Oberfläche `ChannelMessageActionAdapter.describeMessageTool(...)`. Dieser vereinheitlichte Erkennungsaufruf ermöglicht es einem Plugin, seine sichtbaren Aktionen, Fähigkeiten und Schema-Beiträge gemeinsam zurückzugeben, damit diese Teile nicht auseinanderdriften.

Wenn ein channelspezifischer Message-Tool-Parameter eine Medienquelle wie einen lokalen Pfad oder eine Remote-Medien-URL enthält, sollte das Plugin außerdem `mediaSourceParams` aus `describeMessageTool(...)` zurückgeben. Core nutzt diese explizite Liste, um Sandbox-Pfadnormalisierung und Hinweise für ausgehenden Medienzugriff anzuwenden, ohne plugin-eigene Parameternamen fest zu codieren. Bevorzugen Sie dort aktionsbezogene Maps, nicht eine channelweite flache Liste, damit ein nur für Profile gedachter Medienparameter nicht bei nicht verwandten Aktionen wie `send` normalisiert wird.

Core übergibt den Laufzeit-Scope in diesen Erkennungsschritt. Wichtige Felder sind:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- vertrauenswürdige eingehende `requesterSenderId`

Das ist für kontextsensitive Plugins wichtig. Ein Channel kann Nachrichtenaktionen basierend auf dem aktiven Konto, dem aktuellen Raum/Thread/der aktuellen Nachricht oder der vertrauenswürdigen Identität des Anfragenden ausblenden oder anzeigen, ohne channelspezifische Branches im Core-`message`-Tool fest zu codieren.

Deshalb bleiben Routing-Änderungen für Embedded-Runner weiterhin Plugin-Arbeit: Der Runner ist dafür verantwortlich, die aktuelle Chat-/Sitzungsidentität an die Plugin-Erkennungsgrenze weiterzuleiten, damit das gemeinsame `message`-Tool für den aktuellen Turn die richtige channel-eigene Oberfläche freigibt.

Für channel-eigene Ausführungshelfer sollten gebündelte Plugins die Ausführungs-Laufzeit in ihren eigenen Erweiterungsmodulen halten. Core besitzt die Discord-, Slack-, Telegram- oder WhatsApp-Message-Action-Laufzeiten unter `src/agents/tools` nicht mehr. Wir veröffentlichen keine separaten `plugin-sdk/*-action-runtime`-Subpfade, und gebündelte Plugins sollten ihren eigenen lokalen Laufzeitcode direkt aus ihren extension-eigenen Modulen importieren.

Dieselbe Grenze gilt allgemein für provider-benannte SDK-Seams: Core sollte keine channelspezifischen Convenience-Barrels für Slack, Discord, Signal, WhatsApp oder ähnliche Erweiterungen importieren. Wenn Core ein Verhalten benötigt, sollte er entweder das eigene `api.ts`- / `runtime-api.ts`-Barrel des gebündelten Plugins verwenden oder den Bedarf in eine schmale generische Fähigkeit im gemeinsamen SDK überführen.

Gebündelte Plugins folgen derselben Regel. Die `runtime-api.ts` eines gebündelten Plugins sollte nicht seine eigene gebrandete `openclaw/plugin-sdk/<plugin-id>`-Fassade erneut exportieren. Diese gebrandeten Fassaden bleiben Kompatibilitäts-Shims für externe Plugins und ältere Verbraucher, aber gebündelte Plugins sollten lokale Exporte plus schmale generische SDK-Subpfade wie `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` oder `openclaw/plugin-sdk/webhook-ingress` verwenden. Neuer Code sollte keine plugin-id-spezifischen SDK-Fassaden hinzufügen, es sei denn, die Kompatibilitätsgrenze für ein bestehendes externes Ökosystem erfordert dies.

Speziell für Umfragen gibt es zwei Ausführungspfade:

- `outbound.sendPoll` ist die gemeinsame Basis für Channels, die in das gemeinsame Umfragemodell passen
- `actions.handleAction("poll")` ist der bevorzugte Pfad für channelspezifische Umfragesemantik oder zusätzliche Umfrageparameter

Core verschiebt das gemeinsame Parsen von Umfragen jetzt, bis der Plugin-Umfragedispatch die Aktion ablehnt, damit plugin-eigene Umfrage-Handler channelspezifische Umfragefelder akzeptieren können, ohne zuerst vom generischen Umfrageparser blockiert zu werden.

Siehe [Plugin-Architektur-Interna](/de/plugins/architecture-internals) für die vollständige Startsequenz.

## Modell für Fähigkeiten-Ownership

OpenClaw behandelt ein natives Plugin als Ownership-Grenze für ein **Unternehmen** oder ein **Feature**, nicht als Sammelbecken unzusammenhängender Integrationen.

Das bedeutet:

- ein Unternehmens-Plugin sollte in der Regel alle OpenClaw-zugewandten Oberflächen dieses Unternehmens besitzen
- ein Feature-Plugin sollte in der Regel die vollständige Feature-Oberfläche besitzen, die es einführt
- Channels sollten gemeinsame Core-Fähigkeiten nutzen, statt Provider-Verhalten ad hoc erneut zu implementieren

<AccordionGroup>
  <Accordion title="Vendor mit mehreren Fähigkeiten">
    `openai` besitzt Text-Inferenz, Sprache, Realtime-Voice, Medienverständnis und Bildgenerierung. `google` besitzt Text-Inferenz plus Medienverständnis, Bildgenerierung und Websuche. `qwen` besitzt Text-Inferenz plus Medienverständnis und Videogenerierung.
  </Accordion>
  <Accordion title="Vendor mit einzelner Fähigkeit">
    `elevenlabs` und `microsoft` besitzen Sprache; `firecrawl` besitzt Web-Fetch; `minimax` / `mistral` / `moonshot` / `zai` besitzen Backends für Medienverständnis.
  </Accordion>
  <Accordion title="Feature-Plugin">
    `voice-call` besitzt Call-Transport, Tools, CLI, Routen und Twilio-Media-Stream-Bridging, nutzt aber gemeinsame Fähigkeiten für Sprache, Realtime-Transkription und Realtime-Voice, statt Vendor-Plugins direkt zu importieren.
  </Accordion>
</AccordionGroup>

Der angestrebte Endzustand ist:

- OpenAI lebt in einem Plugin, selbst wenn es Textmodelle, Sprache, Bilder und künftiges Video umfasst
- ein anderer Vendor kann dasselbe für seine eigene Oberfläche tun
- Channels ist es egal, welches Vendor-Plugin den Provider besitzt; sie nutzen den gemeinsamen Fähigkeitsvertrag, den Core bereitstellt

Dies ist die zentrale Unterscheidung:

- **plugin** = Ownership-Grenze
- **capability** = Core-Vertrag, den mehrere Plugins implementieren oder nutzen können

Wenn OpenClaw also eine neue Domäne wie Video hinzufügt, lautet die erste Frage nicht: „Welcher Provider sollte Video-Handling fest codieren?“ Die erste Frage lautet: „Was ist der Core-Vertrag für die Videofähigkeit?“ Sobald dieser Vertrag existiert, können Vendor-Plugins sich dafür registrieren und Channel-/Feature-Plugins ihn nutzen.

Wenn die Fähigkeit noch nicht existiert, ist der richtige Schritt in der Regel:

<Steps>
  <Step title="Fähigkeit definieren">
    Definieren Sie die fehlende Fähigkeit im Core.
  </Step>
  <Step title="Über das SDK bereitstellen">
    Stellen Sie sie typisiert über die Plugin-API/-Laufzeit bereit.
  </Step>
  <Step title="Verbraucher verkabeln">
    Verkabeln Sie Channels/Features mit dieser Fähigkeit.
  </Step>
  <Step title="Vendor-Implementierungen">
    Lassen Sie Vendor-Plugins Implementierungen registrieren.
  </Step>
</Steps>

So bleibt Ownership explizit, während Core-Verhalten vermieden wird, das von einem einzelnen Vendor oder einem einmaligen plugin-spezifischen Codepfad abhängt.

### Fähigkeitenschichtung

Verwenden Sie dieses Denkmodell, wenn Sie entscheiden, wohin Code gehört:

<Tabs>
  <Tab title="Core-Fähigkeitsschicht">
    Gemeinsame Orchestrierung, Policy, Fallback, Regeln zum Zusammenführen von Konfigurationen, Auslieferungssemantik und typisierte Verträge.
  </Tab>
  <Tab title="Vendor-Plugin-Schicht">
    Vendor-spezifische APIs, Auth, Modellkataloge, Sprachsynthese, Bildgenerierung, künftige Video-Backends, Nutzungsendpunkte.
  </Tab>
  <Tab title="Channel-/Feature-Plugin-Schicht">
    Slack-/Discord-/voice-call-/usw.-Integration, die Core-Fähigkeiten nutzt und sie auf einer Oberfläche präsentiert.
  </Tab>
</Tabs>

TTS folgt zum Beispiel dieser Struktur:

- Core besitzt die TTS-Policy zur Antwortzeit, Fallback-Reihenfolge, Einstellungen und Channel-Auslieferung
- `openai`, `elevenlabs` und `microsoft` besitzen Synthese-Implementierungen
- `voice-call` nutzt den Laufzeithelfer für Telefonie-TTS

Dasselbe Muster sollte für künftige Fähigkeiten bevorzugt werden.

### Beispiel für ein Unternehmens-Plugin mit mehreren Fähigkeiten

Ein Unternehmens-Plugin sollte von außen kohärent wirken. Wenn OpenClaw gemeinsame Verträge für Modelle, Sprache, Realtime-Transkription, Realtime-Voice, Medienverständnis, Bildgenerierung, Videogenerierung, Web-Fetch und Websuche hat, kann ein Vendor alle seine Oberflächen an einer Stelle besitzen:

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
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
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
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

Entscheidend sind nicht die exakten Helfernamen. Entscheidend ist die Struktur:

- ein Plugin besitzt die Vendor-Oberfläche
- Core besitzt weiterhin die Fähigkeitsverträge
- Channels und Feature-Plugins nutzen `api.runtime.*`-Helfer, nicht Vendor-Code
- Vertragstests können prüfen, dass das Plugin die Fähigkeiten registriert hat, die es zu besitzen angibt

### Fähigkeitsbeispiel: Videoverständnis

OpenClaw behandelt Bild-/Audio-/Videoverständnis bereits als eine gemeinsame Fähigkeit. Dasselbe Ownership-Modell gilt dort:

<Steps>
  <Step title="Core definiert den Vertrag">
    Core definiert den Vertrag für Medienverständnis.
  </Step>
  <Step title="Vendor-Plugins registrieren sich">
    Vendor-Plugins registrieren `describeImage`, `transcribeAudio` und `describeVideo`, soweit zutreffend.
  </Step>
  <Step title="Verbraucher nutzen das gemeinsame Verhalten">
    Channels und Feature-Plugins nutzen das gemeinsame Core-Verhalten, statt direkt mit Vendor-Code zu verdrahten.
  </Step>
</Steps>

So wird vermieden, die Videoannahmen eines einzelnen Providers in Core einzubauen. Das Plugin besitzt die Vendor-Oberfläche; Core besitzt den Fähigkeitsvertrag und das Fallback-Verhalten.

Videogenerierung verwendet bereits dieselbe Sequenz: Core besitzt den typisierten Fähigkeitsvertrag und den Laufzeithelfer, und Vendor-Plugins registrieren `api.registerVideoGenerationProvider(...)`-Implementierungen dafür.

Benötigen Sie eine konkrete Rollout-Checkliste? Siehe [Capability Cookbook](/de/plugins/architecture).

## Verträge und Durchsetzung

Die Plugin-API-Oberfläche ist absichtlich typisiert und in `OpenClawPluginApi` zentralisiert. Dieser Vertrag definiert die unterstützten Registrierungspunkte und die Laufzeithelfer, auf die ein Plugin sich verlassen darf.

Warum das wichtig ist:

- Plugin-Autoren erhalten einen stabilen internen Standard
- Core kann doppelte Ownership ablehnen, etwa wenn zwei Plugins dieselbe Provider-ID registrieren
- der Start kann umsetzbare Diagnosen für fehlerhafte Registrierung anzeigen
- Vertragstests können Ownership gebündelter Plugins durchsetzen und stilles Auseinanderdriften verhindern

Es gibt zwei Durchsetzungsebenen:

<AccordionGroup>
  <Accordion title="Durchsetzung der Laufzeitregistrierung">
    Die Plugin-Registry validiert Registrierungen, während Plugins geladen werden. Beispiele: doppelte Provider-IDs, doppelte Sprach-Provider-IDs und fehlerhafte Registrierungen erzeugen Plugin-Diagnosen statt undefiniertem Verhalten.
  </Accordion>
  <Accordion title="Vertragstests">
    Gebündelte Plugins werden während Testläufen in Vertrags-Registries erfasst, damit OpenClaw die Zuständigkeit explizit prüfen kann. Heute wird dies für Modell-Provider, Sprach-Provider, Websuch-Provider und die Zuständigkeit für gebündelte Registrierungen verwendet.
  </Accordion>
</AccordionGroup>

Der praktische Effekt ist, dass OpenClaw im Voraus weiß, welches Plugin welche Oberfläche besitzt. Dadurch können Core und Kanäle nahtlos zusammengesetzt werden, weil die Zuständigkeit deklariert, typisiert und testbar ist, statt implizit zu sein.

### Was in einen Vertrag gehört

<Tabs>
  <Tab title="Gute Verträge">
    - typisiert
    - klein
    - capability-spezifisch
    - im Besitz des Cores
    - von mehreren Plugins wiederverwendbar
    - von Kanälen/Funktionen ohne Vendor-Wissen nutzbar

  </Tab>
  <Tab title="Schlechte Verträge">
    - Vendor-spezifische Policy, die im Core verborgen ist
    - einmalige Plugin-Ausweichpfade, die die Registry umgehen
    - Kanalcode, der direkt in eine Vendor-Implementierung greift
    - Ad-hoc-Laufzeitobjekte, die nicht Teil von `OpenClawPluginApi` oder `api.runtime` sind

  </Tab>
</Tabs>

Wenn Sie unsicher sind, heben Sie die Abstraktionsebene an: Definieren Sie zuerst die Capability, und lassen Sie Plugins sich dann darin einklinken.

## Ausführungsmodell

Native OpenClaw-Plugins laufen **im Prozess** mit dem Gateway. Sie sind nicht sandboxed. Ein geladenes natives Plugin hat dieselbe Vertrauensgrenze auf Prozessebene wie Core-Code.

<Warning>
Auswirkungen nativer Plugins: Ein Plugin kann Tools, Netzwerk-Handler, Hooks und Dienste registrieren; ein Plugin-Fehler kann das Gateway zum Absturz bringen oder destabilisieren; und ein bösartiges natives Plugin ist gleichbedeutend mit beliebiger Codeausführung innerhalb des OpenClaw-Prozesses.
</Warning>

Kompatible Bundles sind standardmäßig sicherer, weil OpenClaw sie derzeit als Metadaten-/Content-Pakete behandelt. In aktuellen Releases bedeutet das hauptsächlich gebündelte Skills.

Verwenden Sie Allowlists und explizite Installations-/Ladepfade für nicht gebündelte Plugins. Behandeln Sie Workspace-Plugins als Code zur Entwicklungszeit, nicht als Produktionsstandard.

Bei Namen gebündelter Workspace-Pakete sollte die Plugin-ID standardmäßig im npm-Namen verankert bleiben: `@openclaw/<id>` oder mit einem genehmigten typisierten Suffix wie `-provider`, `-plugin`, `-speech`, `-sandbox` oder `-media-understanding`, wenn das Paket absichtlich eine engere Plugin-Rolle bereitstellt.

<Note>
**Vertrauenshinweis:** `plugins.allow` vertraut **Plugin-IDs**, nicht der Herkunft des Quellcodes. Ein Workspace-Plugin mit derselben ID wie ein gebündeltes Plugin überschattet absichtlich die gebündelte Kopie, wenn dieses Workspace-Plugin aktiviert/allowlisted ist. Das ist normal und nützlich für lokale Entwicklung, Patch-Tests und Hotfixes. Das Vertrauen in gebündelte Plugins wird aus dem Quell-Snapshot aufgelöst - dem Manifest und Code auf der Festplatte zum Ladezeitpunkt - statt aus Installationsmetadaten. Ein beschädigter oder ausgetauschter Installationseintrag kann die Vertrauensoberfläche eines gebündelten Plugins nicht stillschweigend über das hinaus erweitern, was der tatsächliche Quellcode beansprucht.
</Note>

## Exportgrenze

OpenClaw exportiert Capabilities, nicht Implementierungsbequemlichkeit.

Halten Sie Capability-Registrierung öffentlich. Kürzen Sie Helper-Exporte, die keine Verträge sind:

- Helper-Unterpfade, die spezifisch für gebündelte Plugins sind
- Laufzeit-Plumbing-Unterpfade, die nicht als öffentliche API gedacht sind
- Vendor-spezifische Komfort-Helper
- Setup-/Onboarding-Helper, die Implementierungsdetails sind

Reservierte Helper-Unterpfade für gebündelte Plugins wurden aus der generierten SDK-Export-Map entfernt. Belassen Sie owner-spezifische Helper im besitzenden Plugin-Paket; heben Sie nur wiederverwendbares Host-Verhalten in generische SDK-Verträge wie `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` und `plugin-sdk/plugin-config-runtime`.

## Interna und Referenz

Informationen zur Lade-Pipeline, zum Registry-Modell, zu Provider-Laufzeit-Hooks, Gateway-HTTP-Routen, Message-Tool-Schemas, zur Auflösung von Kanalzielen, zu Provider-Katalogen, Context-Engine-Plugins und zum Leitfaden für das Hinzufügen einer neuen Capability finden Sie unter [Interna der Plugin-Architektur](/de/plugins/architecture-internals).

## Verwandt

- [Plugins erstellen](/de/plugins/building-plugins)
- [Plugin-Manifest](/de/plugins/manifest)
- [Plugin-SDK einrichten](/de/plugins/sdk-setup)
