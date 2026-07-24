---
read_when:
    - Native OpenClaw-Plugins entwickeln oder debuggen
    - Das Plugin-Fähigkeitsmodell oder die Zuständigkeitsgrenzen verstehen
    - Arbeiten an der Plugin-Ladepipeline oder Registry
    - Implementierung von Provider-Runtime-Hooks oder Kanal-Plugins
sidebarTitle: Internals
summary: 'Plugin-Interna: Fähigkeitsmodell, Zuständigkeit, Verträge, Lade-Pipeline und Laufzeit-Hilfsfunktionen'
title: Plugin-Interna
x-i18n:
    generated_at: "2026-07-24T03:57:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d47551b1bc2f71ce2ade3dfdd14bff8ee187616c3807f8101c1a3236e1443cc1
    source_path: plugins/architecture.md
    workflow: 16
---

Dies ist die **ausführliche Architekturreferenz** für das OpenClaw-Plugin-System. Praktische Anleitungen finden Sie auf einer der nachstehenden themenspezifischen Seiten.

<CardGroup cols={2}>
  <Card title="Plugins installieren und verwenden" icon="plug" href="/de/tools/plugin">
    Anleitung für Endbenutzer zum Hinzufügen, Aktivieren und Beheben von Problemen mit Plugins.
  </Card>
  <Card title="Plugins entwickeln" icon="rocket" href="/de/plugins/building-plugins">
    Tutorial für das erste Plugin mit dem kleinsten funktionsfähigen Manifest.
  </Card>
  <Card title="Kanal-Plugins" icon="comments" href="/de/plugins/sdk-channel-plugins">
    Entwickeln Sie ein Plugin für einen Nachrichtenkanal.
  </Card>
  <Card title="Provider-Plugins" icon="microchip" href="/de/plugins/sdk-provider-plugins">
    Entwickeln Sie ein Plugin für einen Modell-Provider.
  </Card>
  <Card title="SDK-Übersicht" icon="book" href="/de/plugins/sdk-overview">
    Referenz zur Importzuordnung und Registrierungs-API.
  </Card>
</CardGroup>

## Öffentliches Funktionsmodell

Funktionen bilden das öffentliche Modell für **native Plugins** innerhalb von OpenClaw. Jedes native OpenClaw-Plugin registriert sich für einen oder mehrere Funktionstypen:

| Funktion                  | Registrierungsmethode                              | Beispiel-Plugins                                             |
| ------------------------- | -------------------------------------------------- | ------------------------------------------------------------ |
| Textinferenz              | `api.registerProvider(...)`                                 | `anthropic`, `openai`                       |
| CLI-Inferenz-Backend      | `api.registerCliBackend(...)`                                 | `anthropic`, `openai`                       |
| Einbettungen              | `api.registerEmbeddingProvider(...)`                                 | Provider-eigene Vektor-Plugins                               |
| Sprache                   | `api.registerSpeechProvider(...)`                                 | `elevenlabs`, `microsoft`                       |
| Echtzeittranskription     | `api.registerRealtimeTranscriptionProvider(...)`                                 | `openai`                                           |
| Echtzeitsprache           | `api.registerRealtimeVoiceProvider(...)`                                 | `google`, `openai`                       |
| Medienverständnis         | `api.registerMediaUnderstandingProvider(...)`                                 | `google`, `openai`                       |
| Transkriptquelle          | `api.registerTranscriptSourceProvider(...)`                                 | `discord`, `google-meet`, `teams-meetings`, `zoom-meetings` |
| Bilderzeugung             | `api.registerImageGenerationProvider(...)`                                 | `fal`, `google`, `openai`   |
| Musikerzeugung            | `api.registerMusicGenerationProvider(...)`                                 | `fal`, `google`, `minimax`   |
| Videoerzeugung            | `api.registerVideoGenerationProvider(...)`                                 | `fal`, `google`, `qwen`   |
| Webabruf                  | `api.registerWebFetchProvider(...)`                                 | `firecrawl`                                           |
| Websuche                  | `api.registerWebSearchProvider(...)`                                 | `brave`, `firecrawl`, `google`   |
| Kanal / Nachrichten       | `api.registerChannel(...)`                                 | `matrix`, `msteams`                       |
| Gateway-Erkennung         | `api.registerGatewayDiscoveryService(...)`                                 | `bonjour`                                           |

<Note>
Ein Plugin, das keine Funktionen registriert, aber Hooks, Werkzeuge, Erkennungsdienste oder Hintergrunddienste bereitstellt, ist ein **Legacy-Plugin ausschließlich mit Hooks**. Dieses Muster wird weiterhin vollständig unterstützt.
</Note>

### Haltung zur externen Kompatibilität

Das Funktionsmodell ist im Core implementiert und wird heute von gebündelten beziehungsweise nativen Plugins verwendet. Für die Kompatibilität externer Plugins ist jedoch ein strengerer Maßstab erforderlich als „es wird exportiert und ist daher unveränderlich“.

| Plugin-Situation                                  | Empfehlung                                                                                                     |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Bestehende externe Plugins                        | Hook-basierte Integrationen müssen weiterhin funktionieren; dies ist die Kompatibilitätsgrundlage.             |
| Neue gebündelte/native Plugins                    | Bevorzugen Sie die explizite Funktionsregistrierung gegenüber anbieterspezifischen Zugriffen oder neuen Designs ausschließlich mit Hooks. |
| Externe Plugins mit Funktionsregistrierung        | Zulässig; betrachten Sie funktionsspezifische Hilfsoberflächen jedoch als veränderlich, sofern die Dokumentation sie nicht als stabil kennzeichnet. |

Die Funktionsregistrierung ist die vorgesehene Entwicklungsrichtung. Legacy-Hooks bleiben während des Übergangs für externe Plugins der sicherste Weg, um Inkompatibilitäten zu vermeiden. Exportierte Hilfsunterpfade sind nicht alle gleichwertig — bevorzugen Sie eng gefasste, dokumentierte Verträge gegenüber beiläufig exportierten Hilfsfunktionen.

### Plugin-Formen

OpenClaw ordnet jedes geladene Plugin anhand seines tatsächlichen Registrierungsverhaltens einer Form zu, nicht nur anhand statischer Metadaten:

<AccordionGroup>
  <Accordion title="einfache Funktion">
    Registriert genau einen Funktionstyp (beispielsweise ein reines Provider-Plugin wie `arcee` oder `chutes`).
  </Accordion>
  <Accordion title="hybride Funktion">
    Registriert mehrere Funktionstypen (beispielsweise ist `openai` für Textinferenz, Sprache, Medienverständnis und Bilderzeugung zuständig).
  </Accordion>
  <Accordion title="nur Hooks">
    Registriert ausschließlich Hooks (typisiert oder benutzerdefiniert), jedoch keine Funktionen, Werkzeuge, Befehle oder Dienste.
  </Accordion>
  <Accordion title="keine Funktion">
    Registriert Werkzeuge, Befehle, Dienste oder Routen, jedoch keine Funktionen.
  </Accordion>
</AccordionGroup>

Mit `openclaw plugins inspect <id>` können Sie die Form und Funktionsaufschlüsselung eines Plugins anzeigen. Einzelheiten finden Sie in der [CLI-Referenz](/de/cli/plugins#inspect).

### Kompatibilitätssignale

`openclaw doctor`, `openclaw plugins inspect <id>`, `openclaw status --all` und `openclaw plugins doctor` zeigen die folgenden Kompatibilitätshinweise an:

| Signal                                     | Bedeutung                                                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Konfiguration gültig**                   | Die Konfiguration wird fehlerfrei geparst und die Plugins werden aufgelöst                                    |
| **nur Hooks** (Information)                | Das Plugin registriert ausschließlich Hooks; dies ist ein unterstützter Pfad, wurde jedoch noch nicht auf die Funktionsregistrierung migriert |
| **veraltete API für Speichereinbettungen** (Warnung) | Ein nicht gebündeltes Plugin verwendet anstelle von `registerEmbeddingProvider` die alte speicherspezifische API für Einbettungs-Provider |
| **schwerwiegender Fehler**                 | Die Konfiguration ist ungültig oder das Plugin konnte nicht geladen werden                                    |

Keines der Hinweis- oder Warnsignale führt heute zu einem Ausfall Ihres Plugins. Diese Signale werden außerdem in `openclaw status --all` und `openclaw plugins doctor` angezeigt.

## Architekturübersicht

Das Plugin-System von OpenClaw besteht aus vier Schichten:

<Steps>
  <Step title="Manifest und Erkennung">
    OpenClaw sucht in konfigurierten Pfaden, Workspace-Stammverzeichnissen, globalen Plugin-Stammverzeichnissen und gebündelten Plugins nach möglichen Plugins. Bei der Erkennung werden zuerst native `openclaw.plugin.json`-Manifeste und anschließend unterstützte Bundle-Manifeste gelesen.
  </Step>
  <Step title="Aktivierung und Validierung">
    Der Core entscheidet, ob ein erkanntes Plugin aktiviert, deaktiviert, blockiert oder für einen exklusiven Slot wie den Speicher ausgewählt wird.
  </Step>
  <Step title="Laden zur Laufzeit">
    Native OpenClaw-Plugins werden prozessintern geladen und registrieren Funktionen in einer zentralen Registry. Paketiertes JavaScript wird über das native `require` geladen; lokaler TypeScript-Quellcode von Drittanbietern verwendet Jiti als Notfall-Fallback. Kompatible Bundles werden in Registry-Einträge normalisiert, ohne Laufzeitcode zu importieren.
  </Step>
  <Step title="Nutzung der Oberflächen">
    Der übrige Teil von OpenClaw liest die Registry, um Werkzeuge, Kanäle, die Provider-Einrichtung, Hooks, HTTP-Routen, CLI-Befehle und Dienste bereitzustellen.
  </Step>
</Steps>

Speziell für die Plugin-CLI ist die Erkennung von Stammbefehlen in zwei Phasen aufgeteilt:

- Metadaten zur Parse-Zeit stammen aus `registerCli(..., { descriptors: [...] })`
- das eigentliche CLI-Modul des Plugins kann verzögert geladen und beim ersten Aufruf registriert werden

Dadurch verbleibt der Plugin-eigene CLI-Code im Plugin, während OpenClaw die Namen der Stammbefehle dennoch vor dem Parsen reservieren kann.

Die wichtige Designgrenze:

- die Manifest-/Konfigurationsvalidierung sollte anhand von **Manifest-/Schemametadaten** funktionieren, ohne Plugin-Code auszuführen
- die Erkennung nativer Funktionen darf vertrauenswürdigen Plugin-Einstiegscode laden, um einen nicht aktivierenden Registry-Snapshot zu erstellen
- das native Laufzeitverhalten stammt aus dem `register(api)`-Pfad des Plugin-Moduls mit `api.registrationMode === "full"`

Durch diese Trennung kann OpenClaw Konfigurationen validieren, fehlende oder deaktivierte Plugins erklären sowie Hinweise für Benutzeroberfläche und Schema erstellen, bevor die vollständige Laufzeit aktiv ist.

### Snapshot der Plugin-Metadaten und Nachschlagetabelle

Beim Start des Gateways wird ein `PluginMetadataSnapshot` für den aktuellen Konfigurations-Snapshot erstellt. Der Snapshot enthält ausschließlich Metadaten: Er speichert den Index installierter Plugins, die Manifest-Registry, Manifestdiagnosen, Zuordnungen der Zuständigkeiten, eine Normalisierung für Plugin-IDs und Manifesteinträge. Er enthält weder geladene Plugin-Module noch Provider-SDKs, Paketinhalte oder Laufzeitexporte.

Plugin-bezogene Konfigurationsvalidierung, automatische Aktivierung beim Start und Plugin-Bootstrap des Gateways verwenden diesen Snapshot, anstatt Manifest- und Indexmetadaten jeweils unabhängig neu zu erstellen. `PluginLookUpTable` wird aus demselben Snapshot abgeleitet und ergänzt den Plugin-Startplan für die aktuelle Laufzeitkonfiguration.

Nach dem Start behält das Gateway den aktuellen Metadaten-Snapshot als austauschbares Laufzeitprodukt bei. Bei wiederholter Provider-Erkennung zur Laufzeit kann dieser Snapshot verwendet werden, anstatt den installierten Index und die Manifest-Registry für jeden Durchlauf des Provider-Katalogs neu zu erstellen. Der Snapshot wird beim Herunterfahren des Gateways, bei Änderungen an der Konfiguration oder am Plugin-Bestand sowie beim Schreiben des installierten Index gelöscht oder ersetzt; Aufrufer greifen auf den nicht zwischengespeicherten Manifest-/Indexpfad zurück, wenn kein kompatibler aktueller Snapshot vorhanden ist. Kompatibilitätsprüfungen müssen Plugin-Erkennungsstammverzeichnisse wie `plugins.load.paths` und den standardmäßigen Agent-Workspace einbeziehen, da Workspace-Plugins zum Umfang der Metadaten gehören.

Der Snapshot und die Nachschlagetabelle halten wiederholte Startentscheidungen auf dem schnellen Pfad:

- Kanalzuständigkeit
- verzögerter Kanalstart
- Plugin-IDs beim Start
- Zuständigkeit für Provider und CLI-Backends
- Zuständigkeit für Einrichtungs-Provider, Befehlsalias, Modellkatalog-Provider und Manifestvertrag
- Validierung des Plugin-Konfigurationsschemas und des Kanal-Konfigurationsschemas
- Entscheidungen zur automatischen Aktivierung beim Start

Die Sicherheitsgrenze besteht im Ersetzen des Snapshots, nicht in seiner Mutation. Erstellen Sie den Snapshot neu, wenn sich die Konfiguration, der Plugin-Bestand, Installationsdatensätze oder persistierte Indexrichtlinien ändern. Behandeln Sie ihn nicht als umfassende, veränderliche globale Registry und bewahren Sie keine unbegrenzte Anzahl historischer Snapshots auf. Das Laden von Plugins zur Laufzeit bleibt von Metadaten-Snapshots getrennt, damit veralteter Laufzeitzustand nicht hinter einem Metadaten-Cache verborgen werden kann.

Die Cache-Regel ist unter [Interna der Plugin-Architektur](/de/plugins/architecture-internals#plugin-cache-boundary) dokumentiert: Manifest- und Erkennungsmetadaten sind aktuell, sofern ein Aufrufer nicht ausdrücklich einen Snapshot, eine Nachschlagetabelle oder eine Manifest-Registry für den aktuellen Ablauf vorhält. Verborgene Metadaten-Caches und auf der Systemzeit basierende TTLs sind nicht Bestandteil des Ladens von Plugins. Nur Caches für Laufzeit-Loader, Module und Abhängigkeitsartefakte dürfen bestehen bleiben, nachdem Code oder installierte Artefakte tatsächlich geladen wurden.

Einige Cold-Path-Aufrufer rekonstruieren Manifest-Registrys weiterhin direkt aus dem persistent gespeicherten Index installierter Plugins, anstatt eine Gateway-`PluginLookUpTable` zu erhalten. Dieser Pfad rekonstruiert die Registry nun bei Bedarf; wenn einem Aufrufer bereits eine aktuelle Lookup-Tabelle oder eine explizite Manifest-Registry vorliegt, sollte diese vorzugsweise durch die Runtime-Abläufe weitergereicht werden.

### Aktivierungsplanung

Die Aktivierungsplanung ist Teil der Steuerungsebene. Aufrufer können vor dem Laden umfassenderer Runtime-Registrys ermitteln, welche Plugins für einen konkreten Befehl, Provider, Channel, eine Route, ein Agent-Harness oder eine Capability relevant sind.

Der Planer bleibt mit dem aktuellen Manifestverhalten kompatibel:

- `activation.*`-Felder sind explizite Planungshinweise
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` und Hooks bleiben der Fallback für die Manifestzuständigkeit
- die ausschließlich IDs zurückgebende Planer-API bleibt für bestehende Aufrufer verfügbar
- die Plan-API meldet Bezeichner für die Gründe, damit die Diagnose zwischen expliziten Hinweisen und dem Fallback anhand der Zuständigkeit unterscheiden kann

<Warning>
Behandeln Sie `activation` weder als Lifecycle-Hook noch als Ersatz für `register(...)`. Es handelt sich um Metadaten zur Eingrenzung des Ladevorgangs. Verwenden Sie vorzugsweise Zuständigkeitsfelder, wenn sie die Beziehung bereits beschreiben; nutzen Sie `activation` nur für zusätzliche Planungshinweise.
</Warning>

### Channel-Plugins und das gemeinsame Nachrichtenwerkzeug

Channel-Plugins müssen für normale Chataktionen kein separates Werkzeug zum Senden, Bearbeiten oder Reagieren registrieren. OpenClaw verwaltet ein gemeinsames `message`-Werkzeug im Core, während Channel-Plugins die channelspezifische Erkennung und Ausführung dahinter verantworten.

Die aktuelle Abgrenzung lautet:

- der Core verantwortet den Host des gemeinsamen `message`-Werkzeugs, die Prompt-Einbindung, die Sitzungs-/Thread-Verwaltung und die Ausführungsweiterleitung
- Channel-Plugins verantworten die bereichsbezogene Aktionserkennung, Capability-Erkennung und alle channelspezifischen Schemafragmente
- Channel-Plugins verantworten die providerspezifische Grammatik für Sitzungskonversationen, etwa wie Konversations-IDs Thread-IDs codieren oder von übergeordneten Konversationen erben
- Channel-Plugins führen die abschließende Aktion über ihren Aktionsadapter aus

Für Channel-Plugins ist die SDK-Oberfläche `ChannelMessageActionAdapter.describeMessageTool(...)`. Mit diesem einheitlichen Erkennungsaufruf kann ein Plugin seine sichtbaren Aktionen, Capabilities und Schemabeiträge gemeinsam zurückgeben, damit diese Bestandteile nicht auseinanderdriften.

Namen von Nachrichtenaktionen verwenden bewusst ein geschlossenes, vom Core verwaltetes Vokabular, damit jeder Transport jede Aktion darstellen kann. Plugins fügen Aktionsnamen über einen Core-PR hinzu; eine Runtime-Registrierung wird absichtlich nicht unterstützt.

Wenn ein channelspezifischer Parameter des Nachrichtenwerkzeugs eine Medienquelle wie einen lokalen Pfad oder eine Remote-Medien-URL enthält, sollte das Plugin außerdem `mediaSourceParams` aus `describeMessageTool(...)` zurückgeben. Der Core verwendet diese explizite Liste, um die Normalisierung von Sandbox-Pfaden und Hinweise für den ausgehenden Medienzugriff anzuwenden, ohne Plugin-eigene Parameternamen fest zu codieren. Verwenden Sie dort vorzugsweise aktionsbezogene Zuordnungen statt einer einzigen flachen Liste für den gesamten Channel, damit ein ausschließlich für Profile verwendeter Medienparameter nicht bei unabhängigen Aktionen wie `send` normalisiert wird.

Der Core übergibt den Runtime-Kontext an diesen Erkennungsschritt. Wichtige Felder sind:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- vertrauenswürdige eingehende `requesterSenderId`

Dies ist für kontextsensitive Plugins wichtig. Ein Channel kann Nachrichtenaktionen abhängig vom aktiven Konto, aktuellen Raum, Thread oder der aktuellen Nachricht sowie von der vertrauenswürdigen Identität des Anfragenden ausblenden oder anzeigen, ohne channelspezifische Verzweigungen im zentralen `message`-Werkzeug fest zu codieren.

Deshalb bleiben Routing-Änderungen für eingebettete Runner Plugin-Arbeit: Der Runner ist dafür verantwortlich, die aktuelle Chat-/Sitzungsidentität an die Plugin-Erkennungsgrenze weiterzuleiten, damit das gemeinsame `message`-Werkzeug für den aktuellen Durchlauf die richtige, vom Channel verwaltete Oberfläche bereitstellt.

Bei Ausführungshilfen in Channel-Zuständigkeit sollten Channel-Plugins die Ausführungs-Runtime in ihren eigenen Plugin-Modulen belassen. Der Core verwaltet die Runtimes für Nachrichtenaktionen von Discord, Slack, Telegram oder WhatsApp nicht mehr unter `src/agents/tools`. Wir veröffentlichen keine separaten `plugin-sdk/*-action-runtime`-Unterpfade, und diese Plugins sollten ihren eigenen lokalen Runtime-Code direkt aus ihren Plugin-eigenen Modulen importieren.

Dieselbe Abgrenzung gilt allgemein für nach Providern benannte SDK-Schnittstellen: Der Core sollte keine channelspezifischen Convenience-Barrels für Discord, Signal, Slack, WhatsApp oder ähnliche Plugins importieren. Wenn der Core ein Verhalten benötigt, sollte er entweder das eigene `api.ts`- / `runtime-api.ts`-Barrel des gebündelten Plugins nutzen oder den Bedarf als eng gefasste generische Capability in das gemeinsame SDK überführen.

Gebündelte Plugins folgen derselben Regel. Das `runtime-api.ts` eines gebündelten Plugins sollte nicht seine eigene markenspezifische `openclaw/plugin-sdk/<plugin-id>`-Fassade erneut exportieren. Diese markenspezifischen Fassaden bleiben Kompatibilitäts-Shims für externe Plugins und ältere Nutzer, gebündelte Plugins sollten jedoch lokale Exporte sowie eng gefasste generische SDK-Unterpfade wie `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` oder `openclaw/plugin-sdk/webhook-ingress` verwenden. Neuer Code sollte keine Plugin-ID-spezifischen SDK-Fassaden hinzufügen, sofern dies nicht durch die Kompatibilitätsgrenze eines bestehenden externen Ökosystems erforderlich ist.

Speziell für Umfragen gibt es zwei Ausführungspfade:

- `outbound.sendPoll` ist die gemeinsame Basis für Channels, die dem gemeinsamen Umfragemodell entsprechen
- `actions.handleAction("poll")` ist der bevorzugte Pfad für channelspezifische Umfragesemantik oder zusätzliche Umfrageparameter

Der Core verschiebt nun das gemeinsame Parsen von Umfragen, bis die Plugin-Umfrageweiterleitung die Aktion abgelehnt hat, sodass Plugin-eigene Umfrage-Handler channelspezifische Umfragefelder akzeptieren können, ohne zuvor vom generischen Umfrageparser blockiert zu werden.

Den vollständigen Startablauf finden Sie unter [Interna der Plugin-Architektur](/de/plugins/architecture-internals).

## Zuständigkeitsmodell für Capabilities

OpenClaw behandelt ein natives Plugin als Zuständigkeitsgrenze für ein **Unternehmen** oder eine **Funktion**, nicht als Sammelsurium unabhängiger Integrationen.

Das bedeutet:

- ein Unternehmens-Plugin sollte üblicherweise alle OpenClaw-bezogenen Oberflächen dieses Unternehmens verantworten
- ein Funktions-Plugin sollte üblicherweise die vollständige von ihm eingeführte Funktionsoberfläche verantworten
- Channels sollten gemeinsame Core-Capabilities nutzen, statt Providerverhalten ad hoc neu zu implementieren

<AccordionGroup>
  <Accordion title="Provider mit mehreren Capabilities">
    `google` verantwortet Textinferenz, CLI-Backend, Embeddings, Sprache, Echtzeitsprachkommunikation, Medienverständnis, Bild-/Musik-/Videogenerierung und Websuche. `openai` verantwortet Textinferenz, Embeddings, Sprache, Echtzeittranskription, Echtzeitsprachkommunikation, Medienverständnis sowie Bild-/Videogenerierung. `minimax` verantwortet Textinferenz sowie Medienverständnis, Sprache, Bild-/Musik-/Videogenerierung und Websuche.
  </Accordion>
  <Accordion title="Provider mit einer einzelnen Capability">
    `arcee` und `chutes` verantworten ausschließlich Textinferenz; `microsoft` verantwortet ausschließlich Sprache. Ein Provider-Plugin kann so eng gefasst bleiben, bis es weitere Oberflächen dieses Providers abdecken muss.
  </Accordion>
  <Accordion title="Funktions-Plugin">
    `voice-call` verantwortet Anruftransport, Werkzeuge, CLI, Routen und die Überbrückung von Twilio-Medienstreams, nutzt jedoch gemeinsame Capabilities für Sprache, Echtzeittranskription und Echtzeitsprachkommunikation, statt Provider-Plugins direkt zu importieren.
  </Accordion>
</AccordionGroup>

Der angestrebte Endzustand lautet:

- die OpenClaw-bezogene Oberfläche eines Providers befindet sich in einem Plugin, auch wenn sie Textmodelle, Sprache, Bilder und Video umfasst
- andere Provider können ihre eigenen Oberflächen ebenso bündeln
- Channels müssen nicht wissen, welches Provider-Plugin den Provider verantwortet; sie nutzen den vom Core bereitgestellten gemeinsamen Capability-Vertrag

Dies ist der entscheidende Unterschied:

- **Plugin** = Zuständigkeitsgrenze
- **Capability** = Core-Vertrag, den mehrere Plugins implementieren oder nutzen können

Wenn OpenClaw also einen neuen Bereich wie Video hinzufügt, lautet die erste Frage nicht: „Welcher Provider sollte die Videoverarbeitung fest codieren?“ Die erste Frage lautet: „Wie sieht der Core-Vertrag für die Video-Capability aus?“ Sobald dieser Vertrag besteht, können sich Provider-Plugins dafür registrieren und Channel-/Funktions-Plugins ihn nutzen.

Wenn die Capability noch nicht vorhanden ist, ist üblicherweise dieses Vorgehen richtig:

<Steps>
  <Step title="Capability definieren">
    Definieren Sie die fehlende Capability im Core.
  </Step>
  <Step title="Über das SDK bereitstellen">
    Stellen Sie sie typisiert über die Plugin-API/-Runtime bereit.
  </Step>
  <Step title="Nutzer anbinden">
    Binden Sie Channels/Funktionen an diese Capability an.
  </Step>
  <Step title="Providerimplementierungen">
    Ermöglichen Sie Provider-Plugins, Implementierungen zu registrieren.
  </Step>
</Steps>

Dadurch bleibt die Zuständigkeit explizit, während Core-Verhalten vermieden wird, das von einem einzelnen Provider oder einem einmaligen Plugin-spezifischen Codepfad abhängt.

### Capability-Schichten

Verwenden Sie bei der Entscheidung, wo Code hingehört, dieses Denkmodell:

<Tabs>
  <Tab title="Core-Capability-Schicht">
    Gemeinsame Orchestrierung, Richtlinien, Fallback, Regeln für das Zusammenführen der Konfiguration, Zustellungssemantik und typisierte Verträge.
  </Tab>
  <Tab title="Provider-Plugin-Schicht">
    Providerspezifische APIs, Authentifizierung, Modellkataloge, Sprachsynthese, Bildgenerierung, Video-Backends und Nutzungsendpunkte.
  </Tab>
  <Tab title="Channel-/Funktions-Plugin-Schicht">
    Integration für Discord/Slack/Sprachanrufe usw., die Core-Capabilities nutzt und sie auf einer Oberfläche bereitstellt.
  </Tab>
</Tabs>

TTS folgt beispielsweise diesem Muster:

- der Core verantwortet die TTS-Richtlinie zum Antwortzeitpunkt, die Fallback-Reihenfolge, Einstellungen und die Channel-Zustellung
- `elevenlabs`, `google`, `microsoft` und `openai` verantworten Syntheseimplementierungen
- `voice-call` nutzt die Runtime-Hilfe für Telefonie-TTS

Dasselbe Muster sollte für zukünftige Capabilities bevorzugt werden.

### Beispiel für ein Unternehmens-Plugin mit mehreren Capabilities

Ein Unternehmens-Plugin sollte von außen zusammenhängend wirken. Wenn OpenClaw gemeinsame Verträge für Modelle, Sprache, Echtzeittranskription, Echtzeitsprachkommunikation, Medienverständnis, Bildgenerierung, Videogenerierung, Webabruf und Websuche bereitstellt, kann ein Provider alle seine Oberflächen an einem Ort verantworten:

```ts
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { exampleAiMedia } from "./exampleai-media.js";

export default definePluginEntry({
  id: "exampleai",
  name: "ExampleAI",
  description: "ExampleAI-Modelle und Medien-Capabilities.",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // Hooks für Authentifizierung, Modellkatalog und Runtime
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // Sprachkonfiguration des Providers — die SpeechProviderPlugin-Schnittstelle direkt implementieren
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      describeImage: (req) => exampleAiMedia.describeImage(req),
      transcribeAudio: (req) => exampleAiMedia.transcribeAudio(req),
      describeVideo: (req) => exampleAiMedia.describeVideo(req),
    });

    api.registerWebSearchProvider({
      id: "exampleai-search",
      createTool() {
        // Das vom Provider verwaltete Websuchwerkzeug zurückgeben.
      },
    });
  },
});
```

Entscheidend sind nicht die genauen Namen der Hilfsfunktionen. Entscheidend ist die Struktur:

- ein Plugin verantwortet die Provideroberfläche
- der Core verantwortet weiterhin die Capability-Verträge
- die Übersetzung von Provideranfragen und HTTP-Hilfsfunktionen verbleiben im Provider-Plugin
- Channels und Funktions-Plugins nutzen `api.runtime.*`-Hilfsfunktionen, nicht Providercode
- Vertragstests können sicherstellen, dass das Plugin die Capabilities registriert hat, für die es die Zuständigkeit beansprucht

### Capability-Beispiel: Videoverständnis

OpenClaw behandelt das Verständnis von Bildern, Audio und Video bereits als eine gemeinsame Capability. Dort gilt dasselbe Zuständigkeitsmodell:

<Steps>
  <Step title="Core definiert den Vertrag">
    Core definiert den Vertrag für das Medienverständnis.
  </Step>
  <Step title="Hersteller-Plugins registrieren sich">
    Hersteller-Plugins registrieren je nach Anwendungsfall `describeImage`, `transcribeAudio` und `describeVideo`.
  </Step>
  <Step title="Nutzer verwenden das gemeinsame Verhalten">
    Kanäle und Funktions-Plugins nutzen das gemeinsame Core-Verhalten, statt sich direkt mit Herstellercode zu verbinden.
  </Step>
</Steps>

Dadurch werden die Videoannahmen eines einzelnen Providers nicht fest in Core verankert. Das Plugin ist für die Herstelleroberfläche zuständig; Core ist für den Funktionsvertrag und das Fallback-Verhalten zuständig.

Die Videogenerierung verwendet bereits dieselbe Abfolge: Core ist für den typisierten Funktionsvertrag und die Runtime-Hilfsfunktion zuständig, und Hersteller-Plugins registrieren dafür Implementierungen von `api.registerVideoGenerationProvider(...)`.

Benötigen Sie eine konkrete Rollout-Checkliste? Siehe [Funktions-Cookbook](/de/plugins/adding-capabilities).

## Verträge und Durchsetzung

Die Plugin-API-Oberfläche ist in `OpenClawPluginApi` bewusst typisiert und zentralisiert. Dieser Vertrag definiert die unterstützten Registrierungspunkte und die Runtime-Hilfsfunktionen, auf die sich ein Plugin verlassen kann.

Warum dies wichtig ist:

- Plugin-Autoren erhalten einen einheitlichen stabilen internen Standard
- Core kann doppelte Zuständigkeiten ablehnen, etwa wenn zwei Plugins dieselbe Provider-ID registrieren
- beim Start können aussagekräftige Diagnosen für fehlerhafte Registrierungen angezeigt werden
- Vertragstests können die Zuständigkeit gebündelter Plugins durchsetzen und unbemerkte Abweichungen verhindern

Die Durchsetzung erfolgt auf zwei Ebenen:

<AccordionGroup>
  <Accordion title="Durchsetzung bei der Runtime-Registrierung">
    Die Plugin-Registry validiert Registrierungen beim Laden der Plugins. Beispiele: Doppelte Provider-IDs, doppelte Sprach-Provider-IDs und fehlerhafte Registrierungen erzeugen Plugin-Diagnosen statt undefinierten Verhaltens.
  </Accordion>
  <Accordion title="Vertragstests">
    Gebündelte Plugins werden während Testläufen in Vertrags-Registries erfasst, damit OpenClaw die Zuständigkeit explizit prüfen kann. Derzeit wird dies für Modell-Provider, Sprach-Provider, Websuch-Provider und die Zuständigkeit für gebündelte Registrierungen verwendet.
  </Accordion>
</AccordionGroup>

In der Praxis bedeutet dies, dass OpenClaw von Anfang an weiß, welches Plugin für welche Oberfläche zuständig ist. Dadurch können Core und Kanäle nahtlos zusammenwirken, da die Zuständigkeit deklariert, typisiert und testbar ist, statt nur implizit zu bestehen.

### Was in einen Vertrag gehört

<Tabs>
  <Tab title="Gute Verträge">
    - typisiert
    - klein
    - funktionsspezifisch
    - in der Zuständigkeit von Core
    - durch mehrere Plugins wiederverwendbar
    - durch Kanäle/Funktionen ohne Herstellerkenntnisse nutzbar

  </Tab>
  <Tab title="Schlechte Verträge">
    - herstellerspezifische Richtlinien, die in Core verborgen sind
    - einmalige Plugin-Auswege, welche die Registry umgehen
    - Kanalcode, der direkt auf eine Herstellerimplementierung zugreift
    - Ad-hoc-Runtime-Objekte, die nicht Teil von `OpenClawPluginApi` oder `api.runtime` sind

  </Tab>
</Tabs>

Heben Sie im Zweifelsfall die Abstraktionsebene an: Definieren Sie zuerst die Funktion und lassen Sie Plugins sich anschließend darin einbinden.

## Ausführungsmodell

Native OpenClaw-Plugins werden **prozessintern** mit dem Gateway ausgeführt. Sie befinden sich nicht in einer Sandbox. Ein geladenes natives Plugin hat dieselbe Vertrauensgrenze auf Prozessebene wie Core-Code.

<Warning>
Auswirkungen nativer Plugins: Ein Plugin kann Tools, Netzwerk-Handler, Hooks und Dienste registrieren; ein Plugin-Fehler kann den Gateway zum Absturz bringen oder destabilisieren; und ein bösartiges natives Plugin entspricht der Ausführung beliebigen Codes innerhalb des OpenClaw-Prozesses.
</Warning>

Kompatible Bundles sind standardmäßig sicherer, da OpenClaw sie derzeit als Metadaten-/Inhaltspakete behandelt. In aktuellen Versionen sind dies hauptsächlich gebündelte Skills.

Verwenden Sie für nicht gebündelte Plugins Positivlisten und explizite Installations-/Ladepfade. Behandeln Sie Workspace-Plugins als Code für die Entwicklungsphase, nicht als Produktionsstandard.

Bei gebündelten Workspace-Paketnamen bleibt die Plugin-ID standardmäßig im npm-Namen verankert: `@openclaw/<id>`. Alternativ kann ein genehmigtes typisiertes Suffix wie `-provider`, `-plugin`, `-speech`, `-sandbox` oder `-media-understanding` verwendet werden, wenn das Paket absichtlich eine enger gefasste Plugin-Rolle bereitstellt.

<Note>
**Hinweis zum Vertrauen:** `plugins.allow` vertraut **Plugin-IDs**, nicht der Herkunft des Quellcodes. Ein Workspace-Plugin mit derselben ID wie ein gebündeltes Plugin überschreibt absichtlich die gebündelte Kopie, wenn dieses Workspace-Plugin aktiviert oder in die Positivliste aufgenommen wurde. Dies ist normal und nützlich für lokale Entwicklung, Patch-Tests und Hotfixes. Das Vertrauen in gebündelte Plugins wird anhand des Quellcode-Snapshots bestimmt – dem Manifest und dem Code, die zum Ladezeitpunkt auf dem Datenträger vorliegen – und nicht anhand von Installationsmetadaten. Ein beschädigter oder ausgetauschter Installationsdatensatz kann die Vertrauensoberfläche eines gebündelten Plugins nicht unbemerkt über das hinaus erweitern, was die tatsächliche Quelle beansprucht.
</Note>

## Exportgrenze

OpenClaw exportiert Funktionen, keine Implementierungsbequemlichkeiten.

Halten Sie die Funktionsregistrierung öffentlich. Reduzieren Sie Hilfsexporte, die nicht zum Vertrag gehören:

- Hilfsunterpfade für bestimmte gebündelte Plugins
- Unterpfade für Runtime-Verkabelung, die nicht als öffentliche API vorgesehen sind
- herstellerspezifische Komfort-Hilfsfunktionen
- Hilfsfunktionen für Einrichtung/Onboarding, die Implementierungsdetails darstellen

Reservierte Hilfsunterpfade für gebündelte Plugins wurden aus der generierten SDK-Exportzuordnung entfernt. Bewahren Sie zuständigkeitsspezifische Hilfsfunktionen innerhalb des jeweils zuständigen Plugin-Pakets auf; überführen Sie nur wiederverwendbares Host-Verhalten in generische SDK-Verträge wie `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` und injizierte Plugin-API-Funktionen.

## Interna und Referenz

Informationen zur Lade-Pipeline, zum Registry-Modell, zu Provider-Runtime-Hooks, Gateway-HTTP-Routen, Schemas für Nachrichten-Tools, zur Auflösung von Kanalzielen, zu Provider-Katalogen, Kontext-Engine-Plugins und zur Anleitung zum Hinzufügen einer neuen Funktion finden Sie unter [Interna der Plugin-Architektur](/de/plugins/architecture-internals).

## Verwandte Themen

- [Plugins erstellen](/de/plugins/building-plugins)
- [Plugin-Manifest](/de/plugins/manifest)
- [Plugin-SDK-Einrichtung](/de/plugins/sdk-setup)
