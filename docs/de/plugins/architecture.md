---
read_when:
    - Native OpenClaw-Plugins erstellen oder debuggen
    - Das Plugin-Fähigkeitsmodell oder die Eigentumsgrenzen verstehen
    - Arbeiten an der Plugin-Ladepipeline oder Registry
    - Provider-Runtime-Hooks oder Channel-Plugins implementieren
sidebarTitle: Internals
summary: 'Plugin-Interna: Capability-Modell, Zuständigkeiten, Schnittstellenverträge, Ladepipeline und Runtime-Hilfsfunktionen'
title: Plugin-Interna
x-i18n:
    generated_at: "2026-06-27T17:44:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0e36f77594f16d7f03e31be81a241a15fb15c0b160f22a4dce863f6da184dfe3
    source_path: plugins/architecture.md
    workflow: 16
---

Dies ist die **detaillierte Architekturreferenz** für das OpenClaw-Plugin-System. Für praktische Anleitungen beginnen Sie mit einer der fokussierten Seiten unten.

<CardGroup cols={2}>
  <Card title="Plugins installieren und verwenden" icon="plug" href="/de/tools/plugin">
    Endbenutzeranleitung zum Hinzufügen, Aktivieren und Beheben von Problemen mit Plugins.
  </Card>
  <Card title="Plugins erstellen" icon="rocket" href="/de/plugins/building-plugins">
    Tutorial für das erste Plugin mit dem kleinsten funktionsfähigen Manifest.
  </Card>
  <Card title="Channel-Plugins" icon="comments" href="/de/plugins/sdk-channel-plugins">
    Erstellen Sie ein Messaging-Channel-Plugin.
  </Card>
  <Card title="Provider-Plugins" icon="microchip" href="/de/plugins/sdk-provider-plugins">
    Erstellen Sie ein Modell-Provider-Plugin.
  </Card>
  <Card title="SDK-Überblick" icon="book" href="/de/plugins/sdk-overview">
    Import-Map und Referenz zur Registrierungs-API.
  </Card>
</CardGroup>

## Öffentliches Capability-Modell

Capabilities sind das öffentliche **native Plugin**-Modell innerhalb von OpenClaw. Jedes native OpenClaw-Plugin registriert sich für einen oder mehrere Capability-Typen:

| Capability             | Registrierungsmethode                          | Beispiel-Plugins                     |
| ---------------------- | ---------------------------------------------- | ------------------------------------ |
| Textinferenz           | `api.registerProvider(...)`                    | `openai`, `anthropic`                |
| CLI-Inferenz-Backend   | `api.registerCliBackend(...)`                  | `openai`, `anthropic`                |
| Embeddings             | `api.registerEmbeddingProvider(...)`           | Provider-eigene Vektor-Plugins       |
| Sprache                | `api.registerSpeechProvider(...)`              | `elevenlabs`, `microsoft`            |
| Echtzeit-Transkription | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                             |
| Echtzeit-Sprache       | `api.registerRealtimeVoiceProvider(...)`       | `openai`                             |
| Medienverständnis      | `api.registerMediaUnderstandingProvider(...)`  | `openai`, `google`                   |
| Transkriptquelle       | `api.registerTranscriptSourceProvider(...)`    | `discord`                            |
| Bildgenerierung        | `api.registerImageGenerationProvider(...)`     | `openai`, `google`, `fal`, `minimax` |
| Musikgenerierung       | `api.registerMusicGenerationProvider(...)`     | `google`, `minimax`                  |
| Videogenerierung       | `api.registerVideoGenerationProvider(...)`     | `qwen`                               |
| Web-Abruf              | `api.registerWebFetchProvider(...)`            | `firecrawl`                          |
| Websuche               | `api.registerWebSearchProvider(...)`           | `google`                             |
| Channel / Messaging    | `api.registerChannel(...)`                     | `msteams`, `matrix`                  |
| Gateway-Erkennung      | `api.registerGatewayDiscoveryService(...)`     | `bonjour`                            |

<Note>
Ein Plugin, das keine Capabilities registriert, aber Hooks, Tools, Erkennungsdienste oder Hintergrunddienste bereitstellt, ist ein **älteres reines Hook-Plugin**. Dieses Muster wird weiterhin vollständig unterstützt.
</Note>

### Haltung zur externen Kompatibilität

Das Capability-Modell ist im Kern gelandet und wird heute von gebündelten/nativen Plugins verwendet, aber externe Plugin-Kompatibilität benötigt weiterhin eine strengere Messlatte als „es ist exportiert, also ist es eingefroren“.

| Plugin-Situation                                | Leitlinie                                                                                         |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Bestehende externe Plugins                      | Hook-basierte Integrationen funktionsfähig halten; dies ist die Kompatibilitätsbasis.             |
| Neue gebündelte/native Plugins                  | Explizite Capability-Registrierung gegenüber anbieterspezifischen Zugriffen oder neuen reinen Hook-Designs bevorzugen. |
| Externe Plugins mit Capability-Registrierung    | Erlaubt, aber Capability-spezifische Hilfsoberflächen als in Entwicklung behandeln, sofern die Dokumentation sie nicht als stabil markiert. |

Capability-Registrierung ist die vorgesehene Richtung. Legacy-Hooks bleiben während der Umstellung der sicherste Pfad ohne Brüche für externe Plugins. Exportierte Hilfs-Subpfade sind nicht alle gleichwertig — bevorzugen Sie enge dokumentierte Verträge gegenüber beiläufigen Hilfsexporten.

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
    Registriert nur Hooks (typisierte oder benutzerdefinierte), keine Capabilities, Tools, Befehle oder Dienste.
  </Accordion>
  <Accordion title="non-capability">
    Registriert Tools, Befehle, Dienste oder Routen, aber keine Capabilities.
  </Accordion>
</AccordionGroup>

Verwenden Sie `openclaw plugins inspect <id>`, um die Form und Capability-Aufschlüsselung eines Plugins zu sehen. Details finden Sie in der [CLI-Referenz](/de/cli/plugins#inspect).

### Legacy-Hooks

Der Hook `before_agent_start` bleibt als Kompatibilitätspfad für reine Hook-Plugins unterstützt. Reale Legacy-Plugins hängen weiterhin davon ab.

Richtung:

- funktionsfähig halten
- als Legacy dokumentieren
- `before_model_resolve` für Arbeiten zum Überschreiben von Modell/Provider bevorzugen
- `before_prompt_build` für Arbeiten an Prompt-Mutationen bevorzugen
- erst entfernen, nachdem die reale Nutzung zurückgegangen ist und Fixture-Abdeckung die Migrationssicherheit belegt

### Kompatibilitätssignale

Wenn Sie `openclaw doctor` oder `openclaw plugins inspect <id>` ausführen, sehen Sie möglicherweise eines dieser Labels:

| Signal                         | Bedeutung                                                            |
| ------------------------------ | -------------------------------------------------------------------- |
| **config valid**               | Konfiguration lässt sich korrekt parsen und Plugins werden aufgelöst |
| **compatibility advisory**     | Plugin verwendet ein unterstütztes, aber älteres Muster (z. B. `hook-only`) |
| **legacy warning**             | Plugin verwendet `before_agent_start`, das veraltet ist              |
| **hard error**                 | Konfiguration ist ungültig oder Plugin konnte nicht geladen werden   |

Weder `hook-only` noch `before_agent_start` brechen Ihr Plugin heute: `hook-only` ist ein Hinweis, und `before_agent_start` löst nur eine Warnung aus. Diese Signale erscheinen auch in `openclaw status --all` und `openclaw plugins doctor`.

## Architekturüberblick

Das Plugin-System von OpenClaw hat vier Schichten:

<Steps>
  <Step title="Manifest + Erkennung">
    OpenClaw findet Plugin-Kandidaten aus konfigurierten Pfaden, Workspace-Roots, globalen Plugin-Roots und gebündelten Plugins. Die Erkennung liest zuerst native `openclaw.plugin.json`-Manifeste sowie unterstützte Bundle-Manifeste.
  </Step>
  <Step title="Aktivierung + Validierung">
    Core entscheidet, ob ein erkanntes Plugin aktiviert, deaktiviert, blockiert oder für einen exklusiven Slot wie Speicher ausgewählt ist.
  </Step>
  <Step title="Runtime-Laden">
    Native OpenClaw-Plugins werden im Prozess geladen und registrieren Capabilities in einer zentralen Registry. Paketiertes JavaScript wird über natives `require` geladen; TypeScript aus Drittanbieter-Quellcode ist der Notfall-Fallback über Jiti. Kompatible Bundles werden in Registry-Einträge normalisiert, ohne Runtime-Code zu importieren.
  </Step>
  <Step title="Oberflächennutzung">
    Der Rest von OpenClaw liest die Registry, um Tools, Channels, Provider-Einrichtung, Hooks, HTTP-Routen, CLI-Befehle und Dienste bereitzustellen.
  </Step>
</Steps>

Speziell für die Plugin-CLI ist die Erkennung von Root-Befehlen in zwei Phasen aufgeteilt:

- Parse-Zeit-Metadaten stammen aus `registerCli(..., { descriptors: [...] })`
- das eigentliche Plugin-CLI-Modul kann lazy bleiben und sich erst beim ersten Aufruf registrieren

Dadurch bleibt Plugin-eigener CLI-Code im Plugin, während OpenClaw Root-Befehlsnamen weiterhin vor dem Parsen reservieren kann.

Die wichtige Designgrenze:

- Manifest-/Konfigurationsvalidierung sollte aus **Manifest-/Schema-Metadaten** funktionieren, ohne Plugin-Code auszuführen
- native Capability-Erkennung darf vertrauenswürdigen Plugin-Einstiegscode laden, um einen nicht aktivierenden Registry-Snapshot zu erstellen
- natives Runtime-Verhalten stammt aus dem `register(api)`-Pfad des Plugin-Moduls mit `api.registrationMode === "full"`

Diese Aufteilung ermöglicht es OpenClaw, Konfiguration zu validieren, fehlende/deaktivierte Plugins zu erklären und UI-/Schema-Hinweise zu erstellen, bevor die vollständige Runtime aktiv ist.

### Plugin-Metadaten-Snapshot und Lookup-Tabelle

Der Gateway-Start erstellt einen `PluginMetadataSnapshot` für den aktuellen Konfigurations-Snapshot. Der Snapshot enthält nur Metadaten: Er speichert den installierten Plugin-Index, die Manifest-Registry, Manifestdiagnosen, Owner-Maps, einen Plugin-ID-Normalisierer und Manifestdatensätze. Er enthält keine geladenen Plugin-Module, Provider-SDKs, Paket-Inhalte oder Runtime-Exporte.

Plugin-bewusste Konfigurationsvalidierung, automatisches Aktivieren beim Start und Gateway-Plugin-Bootstrap verwenden diesen Snapshot, anstatt Manifest-/Index-Metadaten unabhängig neu aufzubauen. `PluginLookUpTable` wird aus demselben Snapshot abgeleitet und ergänzt den Start-Plugin-Plan für die aktuelle Runtime-Konfiguration.

Nach dem Start hält Gateway den aktuellen Metadaten-Snapshot als ersetzbares Runtime-Produkt. Wiederholte Runtime-Provider-Erkennung kann diesen Snapshot verwenden, statt für jeden Provider-Katalog-Durchlauf den installierten Index und die Manifest-Registry neu zu rekonstruieren. Der Snapshot wird beim Herunterfahren des Gateway, bei Änderungen an Konfiguration/Plugin-Inventar und bei Schreibvorgängen am installierten Index gelöscht oder ersetzt; Aufrufer fallen auf den kalten Manifest-/Index-Pfad zurück, wenn kein kompatibler aktueller Snapshot vorhanden ist. Kompatibilitätsprüfungen müssen Plugin-Erkennungs-Roots wie `plugins.load.paths` und den Standard-Agent-Workspace einschließen, weil Workspace-Plugins Teil des Metadatenumfangs sind.

Der Snapshot und die Lookup-Tabelle halten wiederholte Startentscheidungen auf dem schnellen Pfad:

- Channel-Ownership
- verzögerter Channel-Start
- Start-Plugin-IDs
- Provider- und CLI-Backend-Ownership
- Ownership von Einrichtungs-Provider, Befehlsalias, Modellkatalog-Provider und Manifestvertrag
- Validierung des Plugin-Konfigurationsschemas und Channel-Konfigurationsschemas
- Entscheidungen zum automatischen Aktivieren beim Start

Die Sicherheitsgrenze ist Snapshot-Ersetzung, nicht Mutation. Erstellen Sie den Snapshot neu, wenn sich Konfiguration, Plugin-Inventar, Installationsdatensätze oder persistierte Index-Policy ändern. Behandeln Sie ihn nicht als breite veränderliche globale Registry und halten Sie keine unbegrenzten historischen Snapshots. Runtime-Plugin-Laden bleibt von Metadaten-Snapshots getrennt, damit veralteter Runtime-Zustand nicht hinter einem Metadaten-Cache verborgen werden kann.

Die Cache-Regel ist in [Plugin-Architektur-Interna](/de/plugins/architecture-internals#plugin-cache-boundary) dokumentiert: Manifest- und Erkennungsmetadaten sind frisch, sofern ein Aufrufer nicht einen expliziten Snapshot, eine Lookup-Tabelle oder eine Manifest-Registry für den aktuellen Ablauf hält. Verborgene Metadaten-Caches und Wall-Clock-TTLs sind nicht Teil des Plugin-Ladens. Nur Runtime-Loader-, Modul- und Abhängigkeitsartefakt-Caches dürfen bestehen bleiben, nachdem Code oder installierte Artefakte tatsächlich geladen wurden.

Einige Cold-Path-Aufrufer rekonstruieren Manifest-Registries weiterhin direkt aus dem persistierten installierten Plugin-Index, statt eine Gateway-`PluginLookUpTable` zu erhalten. Dieser Pfad rekonstruiert die Registry nun bei Bedarf; bevorzugen Sie es, die aktuelle Lookup-Tabelle oder eine explizite Manifest-Registry durch Runtime-Abläufe zu reichen, wenn ein Aufrufer bereits eine hat.

### Aktivierungsplanung

Aktivierungsplanung ist Teil der Control Plane. Aufrufer können abfragen, welche Plugins für einen konkreten Befehl, Provider, Channel, eine Route, ein Agent-Harness oder eine Capability relevant sind, bevor sie breitere Runtime-Registries laden.

Der Planer hält aktuelles Manifestverhalten kompatibel:

- `activation.*`-Felder sind explizite Planner-Hinweise
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` und Hooks bleiben der Fallback für Manifest-Verantwortung
- die reine IDs-Planner-API bleibt für bestehende Aufrufer verfügbar
- die Plan-API meldet Begründungslabels, damit Diagnosen explizite Hinweise von Verantwortungs-Fallback unterscheiden können

<Warning>
Behandeln Sie `activation` nicht als Lifecycle-Hook oder als Ersatz für `register(...)`. Es handelt sich um Metadaten, die das Laden eingrenzen. Bevorzugen Sie Verantwortungsfelder, wenn sie die Beziehung bereits beschreiben; verwenden Sie `activation` nur für zusätzliche Planner-Hinweise.
</Warning>

### Channel-Plugins und das gemeinsame Nachrichtentool

Channel-Plugins müssen für normale Chat-Aktionen kein separates Sende-/Bearbeitungs-/Reaktionstool registrieren. OpenClaw hält ein gemeinsames `message`-Tool im Kern vor, und Channel-Plugins verantworten die kanalspezifische Erkennung und Ausführung dahinter.

Die aktuelle Grenze ist:

- der Kern verantwortet den gemeinsamen `message`-Tool-Host, Prompt-Verkabelung, Sitzungs-/Thread-Buchhaltung und Ausführungsdispatch
- Channel-Plugins verantworten bereichsbezogene Aktionserkennung, Capability-Erkennung und alle kanalspezifischen Schemafragmente
- Channel-Plugins verantworten Provider-spezifische Sitzungs-Konversationsgrammatik, etwa wie Konversations-IDs Thread-IDs codieren oder von übergeordneten Konversationen erben
- Channel-Plugins führen die finale Aktion über ihren Aktionsadapter aus

Für Channel-Plugins ist die SDK-Oberfläche `ChannelMessageActionAdapter.describeMessageTool(...)`. Dieser vereinheitlichte Erkennungsaufruf lässt ein Plugin seine sichtbaren Aktionen, Capabilities und Schemabeiträge zusammen zurückgeben, damit diese Teile nicht auseinanderlaufen.

Wenn ein kanalspezifischer Message-Tool-Parameter eine Medienquelle wie einen lokalen Pfad oder eine Remote-Medien-URL enthält, sollte das Plugin außerdem `mediaSourceParams` aus `describeMessageTool(...)` zurückgeben. Der Kern verwendet diese explizite Liste, um Sandbox-Pfadnormalisierung und Hinweise für ausgehenden Medienzugriff anzuwenden, ohne Plugin-eigene Parameternamen fest zu codieren. Bevorzugen Sie dort aktionsbezogene Maps, keine kanalweite flache Liste, damit ein nur für Profile bestimmter Medienparameter nicht bei nicht verwandten Aktionen wie `send` normalisiert wird.

Der Kern übergibt den Laufzeitbereich in diesen Erkennungsschritt. Wichtige Felder sind:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- vertrauenswürdige eingehende `requesterSenderId`

Das ist für kontextsensitive Plugins wichtig. Ein Kanal kann Nachrichtenaktionen basierend auf dem aktiven Konto, dem aktuellen Raum/Thread/der aktuellen Nachricht oder der vertrauenswürdigen Identität des Anfragenden ausblenden oder anzeigen, ohne kanalspezifische Verzweigungen im Kern-`message`-Tool fest zu codieren.

Deshalb bleiben Routing-Änderungen für eingebettete Runner weiterhin Plugin-Arbeit: Der Runner ist dafür verantwortlich, die aktuelle Chat-/Sitzungsidentität an die Plugin-Erkennungsgrenze weiterzugeben, damit das gemeinsame `message`-Tool die passende kanalverantwortete Oberfläche für den aktuellen Turn verfügbar macht.

Für kanalverantwortete Ausführungshelfer sollten gebündelte Plugins die Ausführungslaufzeit in ihren eigenen Erweiterungsmodulen halten. Der Kern verantwortet die Discord-, Slack-, Telegram- oder WhatsApp-Nachrichtenaktions-Laufzeiten unter `src/agents/tools` nicht mehr. Wir veröffentlichen keine separaten `plugin-sdk/*-action-runtime`-Unterpfade, und gebündelte Plugins sollten ihren eigenen lokalen Laufzeitcode direkt aus ihren erweiterungseigenen Modulen importieren.

Dieselbe Grenze gilt allgemein für Provider-benannte SDK-Nähte: Der Kern sollte keine kanalspezifischen Convenience-Barrels für Slack, Discord, Signal, WhatsApp oder ähnliche Erweiterungen importieren. Wenn der Kern ein Verhalten benötigt, soll er entweder das eigene `api.ts`- / `runtime-api.ts`-Barrel des gebündelten Plugins verwenden oder den Bedarf in eine schmale generische Capability im gemeinsamen SDK heben.

Gebündelte Plugins folgen derselben Regel. Das `runtime-api.ts` eines gebündelten Plugins sollte seine eigene gebrandete `openclaw/plugin-sdk/<plugin-id>`-Fassade nicht erneut exportieren. Diese gebrandeten Fassaden bleiben Kompatibilitäts-Shims für externe Plugins und ältere Konsumenten, aber gebündelte Plugins sollten lokale Exporte plus schmale generische SDK-Unterpfade wie `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` oder `openclaw/plugin-sdk/webhook-ingress` verwenden. Neuer Code sollte keine Plugin-ID-spezifischen SDK-Fassaden hinzufügen, sofern die Kompatibilitätsgrenze für ein bestehendes externes Ökosystem dies nicht erfordert.

Speziell für Umfragen gibt es zwei Ausführungspfade:

- `outbound.sendPoll` ist die gemeinsame Basis für Kanäle, die zum gemeinsamen Umfragemodell passen
- `actions.handleAction("poll")` ist der bevorzugte Pfad für kanalspezifische Umfragesemantik oder zusätzliche Umfrageparameter

Der Kern verschiebt das gemeinsame Parsen von Umfragen jetzt, bis der Plugin-Umfrage-Dispatch die Aktion ablehnt, sodass Plugin-eigene Umfrage-Handler kanalspezifische Umfragefelder akzeptieren können, ohne zuerst vom generischen Umfrageparser blockiert zu werden.

Siehe [Interne Plugin-Architektur](/de/plugins/architecture-internals) für die vollständige Startsequenz.

## Verantwortungsmodell für Capabilities

OpenClaw behandelt ein natives Plugin als Verantwortungsgrenze für ein **Unternehmen** oder ein **Feature**, nicht als Sammelbecken unzusammenhängender Integrationen.

Das bedeutet:

- ein Unternehmens-Plugin sollte normalerweise alle OpenClaw-bezogenen Oberflächen dieses Unternehmens verantworten
- ein Feature-Plugin sollte normalerweise die vollständige Feature-Oberfläche verantworten, die es einführt
- Kanäle sollten gemeinsame Kern-Capabilities nutzen, statt Provider-Verhalten ad hoc neu zu implementieren

<AccordionGroup>
  <Accordion title="Mehrfach-Capability eines Anbieters">
    `openai` verantwortet Textinferenz, Sprache, Echtzeit-Sprache, Medienverständnis und Bilderzeugung. `google` verantwortet Textinferenz plus Medienverständnis, Bilderzeugung und Websuche. `qwen` verantwortet Textinferenz plus Medienverständnis und Videogenerierung.
  </Accordion>
  <Accordion title="Einzel-Capability eines Anbieters">
    `elevenlabs` und `microsoft` verantworten Sprache; `firecrawl` verantwortet Web-Fetch; `minimax` / `mistral` / `moonshot` / `zai` verantworten Backends für Medienverständnis.
  </Accordion>
  <Accordion title="Feature-Plugin">
    `voice-call` verantwortet Anruftransport, Tools, CLI, Routen und Twilio-Medienstream-Bridging, nutzt aber gemeinsame Capabilities für Sprache, Echtzeit-Transkription und Echtzeit-Sprache, statt Vendor-Plugins direkt zu importieren.
  </Accordion>
</AccordionGroup>

Der beabsichtigte Endzustand ist:

- OpenAI lebt in einem Plugin, selbst wenn es Textmodelle, Sprache, Bilder und zukünftige Videos umfasst
- ein anderer Anbieter kann dasselbe für seine eigene Oberfläche tun
- Kanäle müssen nicht wissen, welches Vendor-Plugin den Provider verantwortet; sie nutzen den vom Kern bereitgestellten gemeinsamen Capability-Vertrag

Das ist die entscheidende Unterscheidung:

- **Plugin** = Verantwortungsgrenze
- **Capability** = Kernvertrag, den mehrere Plugins implementieren oder nutzen können

Wenn OpenClaw also eine neue Domäne wie Video hinzufügt, lautet die erste Frage nicht: „Welcher Provider sollte die Videoverarbeitung fest codieren?“ Die erste Frage lautet: „Was ist der Kernvertrag für die Video-Capability?“ Sobald dieser Vertrag existiert, können Vendor-Plugins sich dafür registrieren, und Kanal-/Feature-Plugins können ihn nutzen.

Wenn die Capability noch nicht existiert, ist der richtige Schritt normalerweise:

<Steps>
  <Step title="Capability definieren">
    Definieren Sie die fehlende Capability im Kern.
  </Step>
  <Step title="Über das SDK bereitstellen">
    Stellen Sie sie typisiert über die Plugin-API/Laufzeit bereit.
  </Step>
  <Step title="Konsumenten verkabeln">
    Verkabeln Sie Kanäle/Features mit dieser Capability.
  </Step>
  <Step title="Vendor-Implementierungen">
    Lassen Sie Vendor-Plugins Implementierungen registrieren.
  </Step>
</Steps>

Das hält Verantwortung explizit und vermeidet gleichzeitig Kernverhalten, das von einem einzelnen Anbieter oder einem einmaligen Plugin-spezifischen Codepfad abhängt.

### Capability-Schichtung

Verwenden Sie dieses mentale Modell, wenn Sie entscheiden, wohin Code gehört:

<Tabs>
  <Tab title="Kern-Capability-Schicht">
    Gemeinsame Orchestrierung, Policy, Fallback, Regeln für Konfigurationszusammenführung, Auslieferungssemantik und typisierte Verträge.
  </Tab>
  <Tab title="Vendor-Plugin-Schicht">
    Anbieterspezifische APIs, Auth, Modellkataloge, Sprachsynthese, Bilderzeugung, zukünftige Video-Backends, Usage-Endpunkte.
  </Tab>
  <Tab title="Kanal-/Feature-Plugin-Schicht">
    Slack-/Discord-/voice-call-/usw.-Integration, die Kern-Capabilities nutzt und sie auf einer Oberfläche präsentiert.
  </Tab>
</Tabs>

Zum Beispiel folgt TTS dieser Form:

- der Kern verantwortet TTS-Policy zur Antwortzeit, Fallback-Reihenfolge, Einstellungen und Kanalauslieferung
- `openai`, `elevenlabs` und `microsoft` verantworten Syntheseimplementierungen
- `voice-call` nutzt den Laufzeithelfer für Telefonie-TTS

Dasselbe Muster sollte für zukünftige Capabilities bevorzugt werden.

### Beispiel für ein Unternehmens-Plugin mit mehreren Capabilities

Ein Unternehmens-Plugin sollte von außen kohärent wirken. Wenn OpenClaw gemeinsame Verträge für Modelle, Sprache, Echtzeit-Transkription, Echtzeit-Sprache, Medienverständnis, Bilderzeugung, Videogenerierung, Web-Fetch und Websuche hat, kann ein Anbieter alle seine Oberflächen an einer Stelle verantworten:

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

Wichtig sind nicht die exakten Helper-Namen. Wichtig ist die Form:

- ein Plugin verantwortet die Anbieteroberfläche
- der Kern verantwortet weiterhin die Capability-Verträge
- Kanäle und Feature-Plugins nutzen `api.runtime.*`-Helper, nicht Vendor-Code
- Vertragstests können sicherstellen, dass das Plugin die Capabilities registriert hat, deren Verantwortung es beansprucht

### Capability-Beispiel: Videoverständnis

OpenClaw behandelt Bild-/Audio-/Videoverständnis bereits als eine gemeinsame Capability. Dasselbe Verantwortungsmodell gilt dort:

<Steps>
  <Step title="Der Kern definiert den Vertrag">
    Der Kern definiert den Vertrag für Medienverständnis.
  </Step>
  <Step title="Vendor-Plugins registrieren sich">
    Vendor-Plugins registrieren `describeImage`, `transcribeAudio` und `describeVideo`, soweit zutreffend.
  </Step>
  <Step title="Konsumenten nutzen das gemeinsame Verhalten">
    Kanäle und Feature-Plugins nutzen das gemeinsame Kernverhalten, statt direkt mit Vendor-Code zu verkabeln.
  </Step>
</Steps>

Das verhindert, dass die Videoannahmen eines Providers in den Kern eingebaut werden. Das Plugin verantwortet die Anbieteroberfläche; der Kern verantwortet den Capability-Vertrag und das Fallback-Verhalten.

Videogenerierung verwendet bereits dieselbe Sequenz: Der Kern verantwortet den typisierten Capability-Vertrag und den Laufzeithelfer, und Vendor-Plugins registrieren `api.registerVideoGenerationProvider(...)`-Implementierungen dagegen.

Benötigen Sie eine konkrete Rollout-Checkliste? Siehe [Capability-Kochbuch](/de/plugins/adding-capabilities).

## Verträge und Durchsetzung

Die Plugin-API-Oberfläche ist absichtlich typisiert und in `OpenClawPluginApi` zentralisiert. Dieser Vertrag definiert die unterstützten Registrierungspunkte und die Laufzeithelfer, auf die sich ein Plugin verlassen darf.

Warum das wichtig ist:

- Plugin-Autoren erhalten einen stabilen internen Standard
- der Kern kann doppelte Verantwortung ablehnen, etwa wenn zwei Plugins dieselbe Provider-ID registrieren
- der Start kann umsetzbare Diagnosen für fehlerhafte Registrierung anzeigen
- Vertragstests können die Verantwortung gebündelter Plugins durchsetzen und stilles Auseinanderdriften verhindern

Es gibt zwei Durchsetzungsebenen:

<AccordionGroup>
  <Accordion title="Durchsetzung der Runtime-Registrierung">
    Die Plugin-Registry validiert Registrierungen beim Laden von Plugins. Beispiele: doppelte Provider-IDs, doppelte Sprach-Provider-IDs und fehlerhafte Registrierungen erzeugen Plugin-Diagnosen statt undefiniertem Verhalten.
  </Accordion>
  <Accordion title="Contract-Tests">
    Gebündelte Plugins werden während Testläufen in Contract-Registries erfasst, damit OpenClaw Ownership explizit prüfen kann. Heute wird dies für Modell-Provider, Sprach-Provider, Websuche-Provider und Ownership gebündelter Registrierungen verwendet.
  </Accordion>
</AccordionGroup>

Der praktische Effekt ist, dass OpenClaw im Voraus weiß, welches Plugin welche Oberfläche besitzt. Dadurch können Core und Channels nahtlos zusammengesetzt werden, weil Ownership deklariert, typisiert und testbar ist statt implizit.

### Was in einen Contract gehört

<Tabs>
  <Tab title="Gute Contracts">
    - typisiert
    - klein
    - capability-spezifisch
    - im Besitz des Core
    - von mehreren Plugins wiederverwendbar
    - von Channels/Features ohne Vendor-Wissen nutzbar

  </Tab>
  <Tab title="Schlechte Contracts">
    - Vendor-spezifische Policy, die im Core verborgen ist
    - einmalige Plugin-Ausweichpfade, die die Registry umgehen
    - Channel-Code, der direkt in eine Vendor-Implementierung greift
    - Ad-hoc-Runtime-Objekte, die nicht Teil von `OpenClawPluginApi` oder `api.runtime` sind

  </Tab>
</Tabs>

Im Zweifel heben Sie die Abstraktionsebene an: Definieren Sie zuerst die Capability, und lassen Sie Plugins sich dann daran anschließen.

## Ausführungsmodell

Native OpenClaw-Plugins laufen **im Prozess** mit dem Gateway. Sie sind nicht sandboxed. Ein geladenes natives Plugin hat dieselbe Vertrauensgrenze auf Prozessebene wie Core-Code.

<Warning>
Auswirkungen nativer Plugins: Ein Plugin kann Tools, Netzwerk-Handler, Hooks und Services registrieren; ein Plugin-Fehler kann das Gateway abstürzen lassen oder destabilisieren; und ein bösartiges natives Plugin entspricht der Ausführung beliebigen Codes innerhalb des OpenClaw-Prozesses.
</Warning>

Kompatible Bundles sind standardmäßig sicherer, weil OpenClaw sie derzeit als Metadaten-/Inhaltspakete behandelt. In aktuellen Releases bedeutet das hauptsächlich gebündelte Skills.

Verwenden Sie Allowlisten und explizite Installations-/Ladepfade für nicht gebündelte Plugins. Behandeln Sie Workspace-Plugins als Code für die Entwicklungszeit, nicht als Produktions-Defaults.

Für gebündelte Workspace-Paketnamen behalten Sie die Plugin-ID standardmäßig im npm-Namen verankert: `@openclaw/<id>` oder ein genehmigtes typisiertes Suffix wie `-provider`, `-plugin`, `-speech`, `-sandbox` oder `-media-understanding`, wenn das Paket absichtlich eine enger gefasste Plugin-Rolle bereitstellt.

<Note>
**Vertrauenshinweis:** `plugins.allow` vertraut **Plugin-IDs**, nicht der Herkunft des Quellcodes. Ein Workspace-Plugin mit derselben ID wie ein gebündeltes Plugin überschattet absichtlich die gebündelte Kopie, wenn dieses Workspace-Plugin aktiviert bzw. in die Allowlist aufgenommen ist. Das ist normal und nützlich für lokale Entwicklung, Patch-Tests und Hotfixes. Das Vertrauen in gebündelte Plugins wird aus dem Quell-Snapshot aufgelöst, also aus Manifest und Code auf der Festplatte zum Ladezeitpunkt, nicht aus Installationsmetadaten. Ein beschädigter oder ersetzter Installationseintrag kann die Vertrauensoberfläche eines gebündelten Plugins nicht stillschweigend über das hinaus erweitern, was der tatsächliche Quellcode angibt.
</Note>

## Export-Grenze

OpenClaw exportiert Capabilities, nicht Implementierungsbequemlichkeit.

Halten Sie die Capability-Registrierung öffentlich. Entfernen Sie Nicht-Contract-Helper-Exporte:

- gebündelte-Plugin-spezifische Helper-Unterpfade
- Runtime-Plumbing-Unterpfade, die nicht als öffentliche API vorgesehen sind
- Vendor-spezifische Convenience-Helper
- Setup-/Onboarding-Helper, die Implementierungsdetails sind

Reservierte Helper-Unterpfade für gebündelte Plugins wurden aus der generierten SDK-Export-Map entfernt. Behalten Sie owner-spezifische Helper im besitzenden Plugin-Paket; befördern Sie nur wiederverwendbares Host-Verhalten zu generischen SDK-Contracts wie `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` und `plugin-sdk/plugin-config-runtime`.

## Interna und Referenz

Für die Lade-Pipeline, das Registry-Modell, Provider-Runtime-Hooks, Gateway-HTTP-Routen, Message-Tool-Schemas, Channel-Zielauflösung, Provider-Kataloge, Context-Engine-Plugins und die Anleitung zum Hinzufügen einer neuen Capability siehe [Interna der Plugin-Architektur](/de/plugins/architecture-internals).

## Verwandt

- [Plugins erstellen](/de/plugins/building-plugins)
- [Plugin-Manifest](/de/plugins/manifest)
- [Plugin-SDK-Einrichtung](/de/plugins/sdk-setup)
