---
read_when:
    - Native OpenClaw-Plugins erstellen oder debuggen
    - Das Plugin-Fähigkeitsmodell oder Zuständigkeitsgrenzen verstehen
    - Arbeiten an der Plugin-Ladepipeline oder Registry
    - Provider-Runtime-Hooks oder Kanal-Plugins implementieren
sidebarTitle: Internals
summary: 'Plugin-Interna: Fähigkeitsmodell, Zuständigkeiten, Kontrakte, Lade-Pipeline und Runtime-Hilfsfunktionen'
title: Plugin-Interna
x-i18n:
    generated_at: "2026-05-02T06:39:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 138fb962c98f71e29e8b2621ce318336c38a317636d090eb315fed806fc6abda
    source_path: plugins/architecture.md
    workflow: 16
---

Dies ist die **umfassende Architekturreferenz** für das OpenClaw-Plugin-System. Für praktische Anleitungen beginnen Sie mit einer der fokussierten Seiten unten.

<CardGroup cols={2}>
  <Card title="Install and use plugins" icon="plug" href="/de/tools/plugin">
    Leitfaden für Endbenutzer zum Hinzufügen, Aktivieren und Beheben von Problemen mit Plugins.
  </Card>
  <Card title="Building plugins" icon="rocket" href="/de/plugins/building-plugins">
    Tutorial für das erste Plugin mit dem kleinsten funktionsfähigen Manifest.
  </Card>
  <Card title="Channel plugins" icon="comments" href="/de/plugins/sdk-channel-plugins">
    Erstellen Sie ein Messaging-Kanal-Plugin.
  </Card>
  <Card title="Provider plugins" icon="microchip" href="/de/plugins/sdk-provider-plugins">
    Erstellen Sie ein Modell-Provider-Plugin.
  </Card>
  <Card title="SDK overview" icon="book" href="/de/plugins/sdk-overview">
    Import-Map und Referenz zur Registrierungs-API.
  </Card>
</CardGroup>

## Öffentliches Fähigkeitsmodell

Fähigkeiten sind das öffentliche **native Plugin**-Modell innerhalb von OpenClaw. Jedes native OpenClaw-Plugin registriert sich für einen oder mehrere Fähigkeitstypen:

| Fähigkeit              | Registrierungsmethode                           | Beispiel-Plugins                    |
| ---------------------- | ------------------------------------------------ | ------------------------------------ |
| Textinferenz           | `api.registerProvider(...)`                      | `openai`, `anthropic`                |
| CLI-Inferenz-Backend   | `api.registerCliBackend(...)`                    | `openai`, `anthropic`                |
| Sprache                | `api.registerSpeechProvider(...)`                | `elevenlabs`, `microsoft`            |
| Echtzeit-Transkription | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Echtzeit-Sprache       | `api.registerRealtimeVoiceProvider(...)`         | `openai`                             |
| Medienverständnis      | `api.registerMediaUnderstandingProvider(...)`    | `openai`, `google`                   |
| Bildgenerierung        | `api.registerImageGenerationProvider(...)`       | `openai`, `google`, `fal`, `minimax` |
| Musikgenerierung       | `api.registerMusicGenerationProvider(...)`       | `google`, `minimax`                  |
| Videogenerierung       | `api.registerVideoGenerationProvider(...)`       | `qwen`                               |
| Web-Abruf              | `api.registerWebFetchProvider(...)`              | `firecrawl`                          |
| Websuche               | `api.registerWebSearchProvider(...)`             | `google`                             |
| Kanal / Messaging      | `api.registerChannel(...)`                       | `msteams`, `matrix`                  |
| Gateway-Erkennung      | `api.registerGatewayDiscoveryService(...)`       | `bonjour`                            |

<Note>
Ein Plugin, das keine Fähigkeiten registriert, aber Hooks, Tools, Erkennungsdienste oder Hintergrunddienste bereitstellt, ist ein **Legacy-Plugin nur mit Hooks**. Dieses Muster wird weiterhin vollständig unterstützt.
</Note>

### Haltung zur externen Kompatibilität

Das Fähigkeitsmodell ist im Core gelandet und wird heute von mitgelieferten/nativen Plugins verwendet, aber externe Plugin-Kompatibilität braucht weiterhin einen strengeren Maßstab als „es ist exportiert, also ist es eingefroren“.

| Plugin-Situation                                  | Empfehlung                                                                                         |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Bestehende externe Plugins                        | Hook-basierte Integrationen funktionsfähig halten; dies ist die Kompatibilitätsbasis.              |
| Neue mitgelieferte/native Plugins                 | Explizite Fähigkeitsregistrierung gegenüber anbieterspezifischen Zugriffen oder neuen Hook-only-Designs bevorzugen. |
| Externe Plugins mit Fähigkeitsregistrierung       | Erlaubt, aber behandeln Sie fähigkeitsspezifische Hilfsoberflächen als in Entwicklung, sofern die Dokumentation sie nicht als stabil markiert. |

Fähigkeitsregistrierung ist die vorgesehene Richtung. Legacy-Hooks bleiben während der Übergangsphase der sicherste Pfad ohne Breaking Changes für externe Plugins. Exportierte Hilfs-Subpfade sind nicht alle gleichwertig — bevorzugen Sie eng gefasste dokumentierte Verträge gegenüber beiläufigen Hilfsexporten.

### Plugin-Formen

OpenClaw klassifiziert jedes geladene Plugin anhand seines tatsächlichen Registrierungsverhaltens in eine Form (nicht nur anhand statischer Metadaten):

<AccordionGroup>
  <Accordion title="plain-capability">
    Registriert genau einen Fähigkeitstyp (zum Beispiel ein reines Provider-Plugin wie `mistral`).
  </Accordion>
  <Accordion title="hybrid-capability">
    Registriert mehrere Fähigkeitstypen (zum Beispiel besitzt `openai` Textinferenz, Sprache, Medienverständnis und Bildgenerierung).
  </Accordion>
  <Accordion title="hook-only">
    Registriert nur Hooks (typisiert oder benutzerdefiniert), keine Fähigkeiten, Tools, Befehle oder Dienste.
  </Accordion>
  <Accordion title="non-capability">
    Registriert Tools, Befehle, Dienste oder Routen, aber keine Fähigkeiten.
  </Accordion>
</AccordionGroup>

Verwenden Sie `openclaw plugins inspect <id>`, um die Form und Fähigkeitsaufschlüsselung eines Plugins zu sehen. Details finden Sie in der [CLI-Referenz](/de/cli/plugins#inspect).

### Legacy-Hooks

Der Hook `before_agent_start` bleibt als Kompatibilitätspfad für Hook-only-Plugins unterstützt. Ältere reale Plugins hängen weiterhin davon ab.

Richtung:

- funktionsfähig halten
- als Legacy dokumentieren
- `before_model_resolve` für Arbeiten an Modell-/Provider-Overrides bevorzugen
- `before_prompt_build` für Arbeiten an Prompt-Änderungen bevorzugen
- erst entfernen, nachdem die reale Nutzung zurückgegangen ist und Fixture-Abdeckung die Migrationssicherheit belegt

### Kompatibilitätssignale

Wenn Sie `openclaw doctor` oder `openclaw plugins inspect <id>` ausführen, sehen Sie möglicherweise eines dieser Labels:

| Signal                     | Bedeutung                                                    |
| -------------------------- | ------------------------------------------------------------ |
| **config valid**           | Die Konfiguration wird korrekt geparst und Plugins werden aufgelöst |
| **compatibility advisory** | Plugin verwendet ein unterstütztes, aber älteres Muster (z. B. `hook-only`) |
| **legacy warning**         | Plugin verwendet `before_agent_start`, das veraltet ist      |
| **hard error**             | Die Konfiguration ist ungültig oder das Plugin konnte nicht geladen werden |

Weder `hook-only` noch `before_agent_start` machen Ihr Plugin heute kaputt: `hook-only` ist ein Hinweis, und `before_agent_start` löst nur eine Warnung aus. Diese Signale erscheinen auch in `openclaw status --all` und `openclaw plugins doctor`.

## Architekturübersicht

Das Plugin-System von OpenClaw hat vier Schichten:

<Steps>
  <Step title="Manifest + discovery">
    OpenClaw findet Plugin-Kandidaten aus konfigurierten Pfaden, Workspace-Roots, globalen Plugin-Roots und mitgelieferten Plugins. Die Erkennung liest zuerst native `openclaw.plugin.json`-Manifeste sowie unterstützte Bundle-Manifeste.
  </Step>
  <Step title="Enablement + validation">
    Der Core entscheidet, ob ein erkanntes Plugin aktiviert, deaktiviert, blockiert oder für einen exklusiven Slot wie Speicher ausgewählt ist.
  </Step>
  <Step title="Runtime loading">
    Native OpenClaw-Plugins werden im Prozess geladen und registrieren Fähigkeiten in einer zentralen Registry. Paketiertes JavaScript wird über natives `require` geladen; lokale TypeScript-Quellen von Drittanbietern sind der Notfall-Fallback über Jiti. Kompatible Bundles werden ohne Import von Laufzeitcode in Registry-Datensätze normalisiert.
  </Step>
  <Step title="Surface consumption">
    Der Rest von OpenClaw liest die Registry, um Tools, Kanäle, Provider-Einrichtung, Hooks, HTTP-Routen, CLI-Befehle und Dienste bereitzustellen.
  </Step>
</Steps>

Speziell für die Plugin-CLI ist die Root-Befehlserkennung in zwei Phasen aufgeteilt:

- Metadaten zur Parse-Zeit kommen aus `registerCli(..., { descriptors: [...] })`
- das eigentliche Plugin-CLI-Modul kann lazy bleiben und sich beim ersten Aufruf registrieren

Dadurch bleibt plugin-eigener CLI-Code innerhalb des Plugins, während OpenClaw weiterhin Root-Befehlsnamen vor dem Parsen reservieren kann.

Die wichtige Designgrenze:

- Manifest-/Konfigurationsvalidierung sollte anhand von **Manifest-/Schema-Metadaten** funktionieren, ohne Plugin-Code auszuführen
- native Fähigkeitserkennung kann vertrauenswürdigen Plugin-Einstiegscode laden, um einen nicht aktivierenden Registry-Snapshot zu erstellen
- natives Laufzeitverhalten kommt aus dem Pfad `register(api)` des Plugin-Moduls mit `api.registrationMode === "full"`

Diese Aufteilung ermöglicht OpenClaw, die Konfiguration zu validieren, fehlende/deaktivierte Plugins zu erklären und UI-/Schema-Hinweise zu erstellen, bevor die vollständige Laufzeit aktiv ist.

### Snapshot der Plugin-Metadaten und Lookup-Tabelle

Der Gateway-Start erstellt einen `PluginMetadataSnapshot` für den aktuellen Konfigurations-Snapshot. Der Snapshot enthält nur Metadaten: Er speichert den Index installierter Plugins, die Manifest-Registry, Manifest-Diagnosen, Owner-Maps, einen Plugin-ID-Normalizer und Manifest-Datensätze. Er enthält keine geladenen Plugin-Module, Provider-SDKs, Paketinhalte oder Laufzeitexporte.

Plugin-bewusste Konfigurationsvalidierung, automatisches Aktivieren beim Start und Plugin-Bootstrap des Gateway verwenden diesen Snapshot, statt Manifest-/Index-Metadaten unabhängig neu aufzubauen. `PluginLookUpTable` wird aus demselben Snapshot abgeleitet und fügt den Start-Plugin-Plan für die aktuelle Laufzeitkonfiguration hinzu.

Nach dem Start behält Gateway den aktuellen Metadaten-Snapshot als ersetzbares Laufzeitprodukt. Wiederholte Laufzeit-Provider-Erkennung kann diesen Snapshot verwenden, statt den installierten Index und die Manifest-Registry für jeden Provider-Katalogdurchlauf neu zu rekonstruieren. Der Snapshot wird beim Herunterfahren des Gateway, bei Änderungen an Konfiguration/Plugin-Inventar und bei Schreibvorgängen am installierten Index gelöscht oder ersetzt; Aufrufer fallen auf den kalten Manifest-/Index-Pfad zurück, wenn kein kompatibler aktueller Snapshot vorhanden ist. Kompatibilitätsprüfungen müssen Plugin-Erkennungs-Roots wie `plugins.load.paths` und den Standard-Agent-Workspace einschließen, weil Workspace-Plugins Teil des Metadatenumfangs sind.

Der Snapshot und die Lookup-Tabelle halten wiederholte Startentscheidungen auf dem schnellen Pfad:

- Kanal-Ownership
- verzögerter Kanalstart
- Start-Plugin-IDs
- Ownership für Provider und CLI-Backend
- Ownership für Einrichtungs-Provider, Befehlsalias, Modellkatalog-Provider und Manifest-Vertrag
- Validierung von Plugin-Konfigurationsschema und Kanal-Konfigurationsschema
- Entscheidungen zum automatischen Aktivieren beim Start

Die Sicherheitsgrenze ist Snapshot-Ersetzung, nicht Mutation. Erstellen Sie den Snapshot neu, wenn sich Konfiguration, Plugin-Inventar, Installationsdatensätze oder persistierte Indexrichtlinien ändern. Behandeln Sie ihn nicht als breit gefasste veränderbare globale Registry, und halten Sie keine unbegrenzten historischen Snapshots vor. Das Laden von Laufzeit-Plugins bleibt von Metadaten-Snapshots getrennt, damit veralteter Laufzeitstatus nicht hinter einem Metadaten-Cache verborgen werden kann.

Die Cache-Regel ist in [Interne Plugin-Architektur](/de/plugins/architecture-internals#plugin-cache-boundary) dokumentiert: Manifest- und Erkennungsmetadaten sind frisch, sofern ein Aufrufer keinen expliziten Snapshot, keine Lookup-Tabelle oder keine Manifest-Registry für den aktuellen Ablauf hält. Versteckte Metadaten-Caches und wall-clock-TTLs sind nicht Teil des Plugin-Ladens. Nur Laufzeit-Loader-, Modul- und Abhängigkeitsartefakt-Caches dürfen bestehen bleiben, nachdem Code oder installierte Artefakte tatsächlich geladen wurden.

Einige Cold-Path-Aufrufer rekonstruieren Manifest-Registries weiterhin direkt aus dem persistierten installierten Plugin-Index, statt eine Gateway-`PluginLookUpTable` zu erhalten. Dieser Pfad rekonstruiert die Registry jetzt bei Bedarf; bevorzugen Sie die Übergabe der aktuellen Lookup-Tabelle oder einer expliziten Manifest-Registry durch Laufzeitabläufe, wenn ein Aufrufer bereits eine hat.

### Aktivierungsplanung

Aktivierungsplanung ist Teil der Control Plane. Aufrufer können abfragen, welche Plugins für einen konkreten Befehl, Provider, Kanal, eine Route, ein Agent-Harness oder eine Fähigkeit relevant sind, bevor breitere Laufzeit-Registries geladen werden.

Der Planner hält das aktuelle Manifest-Verhalten kompatibel:

- `activation.*`-Felder sind explizite Planner-Hinweise
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` und Hooks bleiben Fallback für Manifest-Ownership
- die API des ids-only Planners bleibt für bestehende Aufrufer verfügbar
- die Plan-API meldet Begründungslabels, damit Diagnosen explizite Hinweise von Ownership-Fallback unterscheiden können

<Warning>
Behandeln Sie `activation` nicht als Lebenszyklus-Hook oder als Ersatz für `register(...)`. Es handelt sich um Metadaten, die dazu dienen, das Laden einzugrenzen. Bevorzugen Sie Ownership-Felder, wenn diese die Beziehung bereits beschreiben; verwenden Sie `activation` nur für zusätzliche Planner-Hinweise.
</Warning>

### Channel-Plugins und das gemeinsame Nachrichtentool

Channel-Plugins müssen für normale Chat-Aktionen kein separates Tool zum Senden, Bearbeiten oder Reagieren registrieren. OpenClaw hält ein gemeinsames `message`-Tool im Kern vor, und Channel-Plugins besitzen die channelspezifische Erkennung und Ausführung dahinter.

Die aktuelle Grenze ist:

- der Kern besitzt den gemeinsamen `message`-Tool-Host, die Prompt-Verkabelung, die Sitzungs-/Thread-Buchführung und die Ausführungsweiterleitung
- Channel-Plugins besitzen die bereichsbezogene Aktionserkennung, Capability-Erkennung und alle channelspezifischen Schemafragmente
- Channel-Plugins besitzen die providerspezifische Konversationsgrammatik für Sitzungen, etwa wie Konversations-IDs Thread-IDs kodieren oder von übergeordneten Konversationen erben
- Channel-Plugins führen die finale Aktion über ihren Aktionsadapter aus

Für Channel-Plugins ist die SDK-Oberfläche `ChannelMessageActionAdapter.describeMessageTool(...)`. Dieser einheitliche Erkennungsaufruf ermöglicht es einem Plugin, seine sichtbaren Aktionen, Capabilities und Schemabeiträge gemeinsam zurückzugeben, damit diese Teile nicht auseinanderlaufen.

Wenn ein channelspezifischer Parameter des Nachrichtentools eine Medienquelle wie einen lokalen Pfad oder eine entfernte Medien-URL enthält, sollte das Plugin außerdem `mediaSourceParams` aus `describeMessageTool(...)` zurückgeben. Der Kern verwendet diese explizite Liste, um Sandbox-Pfadnormalisierung und Hinweise zum ausgehenden Medienzugriff anzuwenden, ohne plugin-eigene Parameternamen fest zu codieren. Bevorzugen Sie dort aktionsbezogene Maps statt einer channelweiten flachen Liste, damit ein nur für Profile bestimmter Medienparameter nicht bei nicht verwandten Aktionen wie `send` normalisiert wird.

Der Kern übergibt den Laufzeitbereich in diesen Erkennungsschritt. Wichtige Felder sind:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- vertrauenswürdige eingehende `requesterSenderId`

Das ist für kontextsensitive Plugins wichtig. Ein Channel kann Nachrichtenaktionen basierend auf aktivem Konto, aktuellem Raum/Thread/aktueller Nachricht oder vertrauenswürdiger Requester-Identität ausblenden oder anzeigen, ohne channelspezifische Verzweigungen im zentralen `message`-Tool fest zu codieren.

Deshalb sind Routing-Änderungen am eingebetteten Runner weiterhin Plugin-Arbeit: Der Runner ist dafür verantwortlich, die aktuelle Chat-/Sitzungsidentität an die Plugin-Erkennungsgrenze weiterzuleiten, damit das gemeinsame `message`-Tool die richtige channel-eigene Oberfläche für den aktuellen Turn bereitstellt.

Für channel-eigene Ausführungshelfer sollten gebündelte Plugins die Ausführungslaufzeit in ihren eigenen Erweiterungsmodulen halten. Der Kern besitzt die Laufzeiten für Discord-, Slack-, Telegram- oder WhatsApp-Nachrichtenaktionen unter `src/agents/tools` nicht mehr. Wir veröffentlichen keine separaten `plugin-sdk/*-action-runtime`-Unterpfade, und gebündelte Plugins sollten ihren eigenen lokalen Laufzeitcode direkt aus ihren erweiterungseigenen Modulen importieren.

Dieselbe Grenze gilt allgemein für provider-benannte SDK-Schnittstellen: Der Kern sollte keine channelspezifischen Convenience-Barrels für Slack, Discord, Signal, WhatsApp oder ähnliche Erweiterungen importieren. Wenn der Kern ein Verhalten benötigt, sollte er entweder das eigene `api.ts`- / `runtime-api.ts`-Barrel des gebündelten Plugins konsumieren oder den Bedarf in eine enge generische Capability im gemeinsamen SDK überführen.

Gebündelte Plugins folgen derselben Regel. Das `runtime-api.ts` eines gebündelten Plugins sollte seine eigene markenspezifische `openclaw/plugin-sdk/<plugin-id>`-Fassade nicht erneut exportieren. Diese markenspezifischen Fassaden bleiben Kompatibilitäts-Shims für externe Plugins und ältere Verbraucher, aber gebündelte Plugins sollten lokale Exporte plus enge generische SDK-Unterpfade wie `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` oder `openclaw/plugin-sdk/webhook-ingress` verwenden. Neuer Code sollte keine plugin-id-spezifischen SDK-Fassaden hinzufügen, außer die Kompatibilitätsgrenze für ein bestehendes externes Ökosystem erfordert es.

Speziell für Umfragen gibt es zwei Ausführungspfade:

- `outbound.sendPoll` ist die gemeinsame Basis für Channels, die zum üblichen Umfragemodell passen
- `actions.handleAction("poll")` ist der bevorzugte Pfad für channelspezifische Umfragesemantik oder zusätzliche Umfrageparameter

Der Kern verschiebt das gemeinsame Parsen von Umfragen jetzt, bis die Plugin-Umfrageweiterleitung die Aktion ablehnt, damit plugin-eigene Umfrage-Handler channelspezifische Umfragefelder akzeptieren können, ohne zuerst vom generischen Umfrageparser blockiert zu werden.

Siehe [Plugin-Architektur-Interna](/de/plugins/architecture-internals) für die vollständige Startsequenz.

## Capability-Ownership-Modell

OpenClaw behandelt ein natives Plugin als Ownership-Grenze für ein **Unternehmen** oder ein **Feature**, nicht als Sammelbecken nicht zusammenhängender Integrationen.

Das bedeutet:

- ein Unternehmens-Plugin sollte in der Regel alle OpenClaw-bezogenen Oberflächen dieses Unternehmens besitzen
- ein Feature-Plugin sollte in der Regel die vollständige Feature-Oberfläche besitzen, die es einführt
- Channels sollten gemeinsame Kern-Capabilities konsumieren, statt Provider-Verhalten ad hoc neu zu implementieren

<AccordionGroup>
  <Accordion title="Mehrere Vendor-Capabilities">
    `openai` besitzt Textinferenz, Sprache, Echtzeit-Sprache, Medienverständnis und Bilderzeugung. `google` besitzt Textinferenz plus Medienverständnis, Bilderzeugung und Websuche. `qwen` besitzt Textinferenz plus Medienverständnis und Videogenerierung.
  </Accordion>
  <Accordion title="Eine Vendor-Capability">
    `elevenlabs` und `microsoft` besitzen Sprache; `firecrawl` besitzt Web-Abruf; `minimax` / `mistral` / `moonshot` / `zai` besitzen Backends für Medienverständnis.
  </Accordion>
  <Accordion title="Feature-Plugin">
    `voice-call` besitzt Anruftransport, Tools, CLI, Routen und Twilio-Media-Stream-Bridging, konsumiert aber gemeinsame Capabilities für Sprache, Echtzeit-Transkription und Echtzeit-Sprache, statt Vendor-Plugins direkt zu importieren.
  </Accordion>
</AccordionGroup>

Der angestrebte Endzustand ist:

- OpenAI lebt in einem Plugin, auch wenn es Textmodelle, Sprache, Bilder und künftige Videos umfasst
- ein anderer Vendor kann dasselbe für seine eigene Oberfläche tun
- Channels ist es egal, welches Vendor-Plugin den Provider besitzt; sie konsumieren den gemeinsamen Capability-Vertrag, den der Kern bereitstellt

Das ist die zentrale Unterscheidung:

- **Plugin** = Ownership-Grenze
- **Capability** = Kernvertrag, den mehrere Plugins implementieren oder konsumieren können

Wenn OpenClaw also eine neue Domäne wie Video hinzufügt, lautet die erste Frage nicht: „Welcher Provider sollte die Videoverarbeitung fest codieren?“ Die erste Frage lautet: „Was ist der Kernvertrag für die Video-Capability?“ Sobald dieser Vertrag existiert, können Vendor-Plugins sich dagegen registrieren, und Channel-/Feature-Plugins können ihn konsumieren.

Wenn die Capability noch nicht existiert, ist der richtige Schritt normalerweise:

<Steps>
  <Step title="Capability definieren">
    Definieren Sie die fehlende Capability im Kern.
  </Step>
  <Step title="Über das SDK bereitstellen">
    Stellen Sie sie typisiert über die Plugin-API/-Laufzeit bereit.
  </Step>
  <Step title="Verbraucher verdrahten">
    Verdrahten Sie Channels/Features gegen diese Capability.
  </Step>
  <Step title="Vendor-Implementierungen">
    Lassen Sie Vendor-Plugins Implementierungen registrieren.
  </Step>
</Steps>

So bleibt Ownership explizit, während Kernverhalten vermieden wird, das von einem einzelnen Vendor oder einem einmaligen plugin-spezifischen Codepfad abhängt.

### Capability-Schichtung

Verwenden Sie dieses mentale Modell, wenn Sie entscheiden, wohin Code gehört:

<Tabs>
  <Tab title="Kern-Capability-Schicht">
    Gemeinsame Orchestrierung, Policy, Fallback, Regeln zum Zusammenführen von Konfiguration, Auslieferungssemantik und typisierte Verträge.
  </Tab>
  <Tab title="Vendor-Plugin-Schicht">
    Vendorspezifische APIs, Authentifizierung, Modellkataloge, Sprachsynthese, Bilderzeugung, künftige Video-Backends, Nutzungsendpunkte.
  </Tab>
  <Tab title="Channel-/Feature-Plugin-Schicht">
    Slack-/Discord-/voice-call-/usw.-Integration, die Kern-Capabilities konsumiert und sie auf einer Oberfläche präsentiert.
  </Tab>
</Tabs>

TTS folgt zum Beispiel dieser Form:

- der Kern besitzt die TTS-Policy zur Antwortzeit, Fallback-Reihenfolge, Einstellungen und Channel-Auslieferung
- `openai`, `elevenlabs` und `microsoft` besitzen Syntheseimplementierungen
- `voice-call` konsumiert den TTS-Laufzeithelfer für Telefonie

Dasselbe Muster sollte für künftige Capabilities bevorzugt werden.

### Beispiel für ein Unternehmens-Plugin mit mehreren Capabilities

Ein Unternehmens-Plugin sollte sich von außen kohärent anfühlen. Wenn OpenClaw gemeinsame Verträge für Modelle, Sprache, Echtzeit-Transkription, Echtzeit-Sprache, Medienverständnis, Bilderzeugung, Videogenerierung, Web-Abruf und Websuche hat, kann ein Vendor alle seine Oberflächen an einem Ort besitzen:

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

Wichtig sind nicht die exakten Namen der Helfer. Wichtig ist die Form:

- ein Plugin besitzt die Vendor-Oberfläche
- der Kern besitzt weiterhin die Capability-Verträge
- Channels und Feature-Plugins konsumieren `api.runtime.*`-Helfer, keinen Vendor-Code
- Vertragstests können sicherstellen, dass das Plugin die Capabilities registriert hat, die es zu besitzen beansprucht

### Capability-Beispiel: Videoverständnis

OpenClaw behandelt Bild-/Audio-/Videoverständnis bereits als eine gemeinsame Capability. Dasselbe Ownership-Modell gilt dort:

<Steps>
  <Step title="Der Kern definiert den Vertrag">
    Der Kern definiert den Vertrag für Medienverständnis.
  </Step>
  <Step title="Vendor-Plugins registrieren">
    Vendor-Plugins registrieren `describeImage`, `transcribeAudio` und `describeVideo`, sofern zutreffend.
  </Step>
  <Step title="Verbraucher verwenden das gemeinsame Verhalten">
    Channels und Feature-Plugins konsumieren das gemeinsame Kernverhalten, statt direkt mit Vendor-Code zu verdrahten.
  </Step>
</Steps>

Das verhindert, dass die Videoannahmen eines einzelnen Providers in den Kern eingebettet werden. Das Plugin besitzt die Vendor-Oberfläche; der Kern besitzt den Capability-Vertrag und das Fallback-Verhalten.

Videogenerierung verwendet bereits dieselbe Sequenz: Der Kern besitzt den typisierten Capability-Vertrag und den Laufzeithelfer, und Vendor-Plugins registrieren `api.registerVideoGenerationProvider(...)`-Implementierungen dagegen.

Benötigen Sie eine konkrete Rollout-Checkliste? Siehe [Capability Cookbook](/de/plugins/architecture).

## Verträge und Durchsetzung

Die Plugin-API-Oberfläche ist absichtlich typisiert und in `OpenClawPluginApi` zentralisiert. Dieser Vertrag definiert die unterstützten Registrierungspunkte und die Laufzeithelfer, auf die sich ein Plugin verlassen darf.

Warum das wichtig ist:

- Plugin-Autoren erhalten einen stabilen internen Standard
- der Kern kann doppelte Ownership ablehnen, etwa wenn zwei Plugins dieselbe Provider-ID registrieren
- der Start kann umsetzbare Diagnosen für fehlerhafte Registrierung anzeigen
- Vertragstests können Ownership gebündelter Plugins durchsetzen und stille Abweichungen verhindern

Es gibt zwei Ebenen der Durchsetzung:

<AccordionGroup>
  <Accordion title="Durchsetzung der Runtime-Registrierung">
    Die Plugin-Registry validiert Registrierungen, während Plugins geladen werden. Beispiele: doppelte Provider-IDs, doppelte Speech-Provider-IDs und fehlerhafte Registrierungen erzeugen Plugin-Diagnosen statt undefiniertem Verhalten.
  </Accordion>
  <Accordion title="Contract-Tests">
    Gebündelte Plugins werden während Testläufen in Contract-Registries erfasst, damit OpenClaw die Ownership explizit prüfen kann. Derzeit wird dies für Modell-Provider, Speech-Provider, Websuche-Provider und die Ownership gebündelter Registrierungen verwendet.
  </Accordion>
</AccordionGroup>

Der praktische Effekt ist, dass OpenClaw im Voraus weiß, welches Plugin welche Oberfläche besitzt. Dadurch können Core und Channels nahtlos zusammenspielen, weil Ownership deklariert, typisiert und testbar ist, statt implizit zu sein.

### Was in einen Contract gehört

<Tabs>
  <Tab title="Gute Contracts">
    - typisiert
    - klein
    - capability-spezifisch
    - im Besitz des Core
    - von mehreren Plugins wiederverwendbar
    - von Channels/Funktionen ohne Vendor-Wissen nutzbar

  </Tab>
  <Tab title="Schlechte Contracts">
    - Vendor-spezifische Policy, die im Core verborgen ist
    - einmalige Plugin-Fluchtwege, die die Registry umgehen
    - Channel-Code, der direkt in eine Vendor-Implementierung greift
    - Ad-hoc-Runtime-Objekte, die nicht Teil von `OpenClawPluginApi` oder `api.runtime` sind

  </Tab>
</Tabs>

Im Zweifel erhöhen Sie die Abstraktionsebene: Definieren Sie zuerst die Capability, und lassen Sie Plugins sich dann daran anbinden.

## Ausführungsmodell

Native OpenClaw-Plugins laufen **in-process** mit dem Gateway. Sie sind nicht sandboxed. Ein geladenes natives Plugin hat dieselbe Vertrauensgrenze auf Prozessebene wie Core-Code.

<Warning>
Auswirkungen nativer Plugins: Ein Plugin kann Tools, Netzwerk-Handler, Hooks und Services registrieren; ein Plugin-Fehler kann das Gateway zum Absturz bringen oder destabilisieren; und ein bösartiges natives Plugin entspricht beliebiger Codeausführung innerhalb des OpenClaw-Prozesses.
</Warning>

Compatible Bundles sind standardmäßig sicherer, weil OpenClaw sie derzeit als Metadaten-/Inhaltspakete behandelt. In aktuellen Releases bedeutet das hauptsächlich gebündelte Skills.

Verwenden Sie Allowlists und explizite Installations-/Ladepfade für nicht gebündelte Plugins. Behandeln Sie Workspace-Plugins als Code für die Entwicklungszeit, nicht als Produktionsstandard.

Halten Sie bei gebündelten Workspace-Paketnamen die Plugin-ID standardmäßig im npm-Namen verankert: `@openclaw/<id>`, oder verwenden Sie ein genehmigtes typisiertes Suffix wie `-provider`, `-plugin`, `-speech`, `-sandbox` oder `-media-understanding`, wenn das Paket absichtlich eine engere Plugin-Rolle bereitstellt.

<Note>
**Vertrauenshinweis:** `plugins.allow` vertraut **Plugin-IDs**, nicht der Herkunft der Quelle. Ein Workspace-Plugin mit derselben ID wie ein gebündeltes Plugin überschattet die gebündelte Kopie absichtlich, wenn dieses Workspace-Plugin aktiviert/allowlisted ist. Das ist normal und nützlich für lokale Entwicklung, Patch-Tests und Hotfixes. Das Vertrauen in gebündelte Plugins wird aus dem Quell-Snapshot aufgelöst — dem Manifest und dem Code auf dem Datenträger zum Ladezeitpunkt — und nicht aus Installationsmetadaten. Ein beschädigter oder ersetzter Installationsdatensatz kann die Vertrauensoberfläche eines gebündelten Plugins nicht stillschweigend über das hinaus erweitern, was die tatsächliche Quelle beansprucht.
</Note>

## Exportgrenze

OpenClaw exportiert Capabilities, nicht Implementierungskomfort.

Halten Sie Capability-Registrierung öffentlich. Entfernen Sie Nicht-Contract-Hilfsexporte:

- Hilfs-Subpfade, die spezifisch für gebündelte Plugins sind
- Runtime-Plumbing-Subpfade, die nicht als öffentliche API gedacht sind
- Vendor-spezifische Komfort-Helper
- Setup-/Onboarding-Helper, die Implementierungsdetails sind

Reservierte Hilfs-Subpfade für gebündelte Plugins wurden aus der generierten SDK-Export-Map entfernt. Halten Sie owner-spezifische Helper innerhalb des besitzenden Plugin-Pakets; heben Sie nur wiederverwendbares Host-Verhalten in generische SDK-Contracts wie `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` und `plugin-sdk/plugin-config-runtime`.

## Interna und Referenz

Informationen zur Ladepipeline, zum Registry-Modell, zu Provider-Runtime-Hooks, Gateway-HTTP-Routen, Message-Tool-Schemata, Channel-Zielauflösung, Provider-Katalogen, Context-Engine-Plugins und zur Anleitung zum Hinzufügen einer neuen Capability finden Sie unter [Interna der Plugin-Architektur](/de/plugins/architecture-internals).

## Verwandt

- [Plugins erstellen](/de/plugins/building-plugins)
- [Plugin-Manifest](/de/plugins/manifest)
- [Plugin-SDK einrichten](/de/plugins/sdk-setup)
