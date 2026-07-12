---
read_when:
    - Native OpenClaw-Plugins entwickeln oder debuggen
    - Das Plugin-Fähigkeitsmodell oder die Zuständigkeitsgrenzen verstehen
    - Arbeiten an der Plugin-Ladepipeline oder -Registry
    - Runtime-Hooks für Provider oder Kanal-Plugins implementieren
sidebarTitle: Internals
summary: 'Plugin-Interna: Fähigkeitsmodell, Zuständigkeiten, Verträge, Ladepipeline und Laufzeit-Hilfsfunktionen'
title: Interne Plugin-Struktur
x-i18n:
    generated_at: "2026-07-12T01:52:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 07ab077080285b5b7a93f58f71cd00be62cfd79cdc2cfa40f0e64cc91cc5ac46
    source_path: plugins/architecture.md
    workflow: 16
---

Dies ist die **ausführliche Architekturreferenz** für das Plugin-System von OpenClaw. Für praxisorientierte Anleitungen beginnen Sie mit einer der nachstehenden Themenseiten.

<CardGroup cols={2}>
  <Card title="Plugins installieren und verwenden" icon="plug" href="/de/tools/plugin">
    Leitfaden für Endbenutzer zum Hinzufügen, Aktivieren und Beheben von Problemen bei Plugins.
  </Card>
  <Card title="Plugins entwickeln" icon="rocket" href="/de/plugins/building-plugins">
    Tutorial für das erste Plugin mit dem kleinstmöglichen funktionsfähigen Manifest.
  </Card>
  <Card title="Kanal-Plugins" icon="comments" href="/de/plugins/sdk-channel-plugins">
    Entwickeln Sie ein Plugin für einen Nachrichtenkanal.
  </Card>
  <Card title="Provider-Plugins" icon="microchip" href="/de/plugins/sdk-provider-plugins">
    Entwickeln Sie ein Plugin für einen Modell-Provider.
  </Card>
  <Card title="SDK-Übersicht" icon="book" href="/de/plugins/sdk-overview">
    Referenz für Importzuordnungen und die Registrierungs-API.
  </Card>
</CardGroup>

## Öffentliches Fähigkeitsmodell

Fähigkeiten bilden das öffentliche Modell für **native Plugins** innerhalb von OpenClaw. Jedes native OpenClaw-Plugin registriert sich für einen oder mehrere Fähigkeitstypen:

| Fähigkeit                 | Registrierungsmethode                          | Beispiel-Plugins                 |
| ------------------------- | ---------------------------------------------- | -------------------------------- |
| Textinferenz              | `api.registerProvider(...)`                    | `anthropic`, `openai`            |
| CLI-Inferenz-Backend      | `api.registerCliBackend(...)`                  | `anthropic`, `openai`            |
| Einbettungen              | `api.registerEmbeddingProvider(...)`           | Provider-eigene Vektor-Plugins    |
| Sprachausgabe             | `api.registerSpeechProvider(...)`              | `elevenlabs`, `microsoft`        |
| Echtzeittranskription     | `api.registerRealtimeTranscriptionProvider(...)` | `openai`                       |
| Echtzeitsprachübertragung | `api.registerRealtimeVoiceProvider(...)`       | `google`, `openai`               |
| Medienverständnis         | `api.registerMediaUnderstandingProvider(...)`  | `google`, `openai`               |
| Transkriptquelle          | `api.registerTranscriptSourceProvider(...)`    | `discord`                        |
| Bilderzeugung             | `api.registerImageGenerationProvider(...)`     | `fal`, `google`, `openai`        |
| Musikerzeugung            | `api.registerMusicGenerationProvider(...)`     | `fal`, `google`, `minimax`       |
| Videoerzeugung            | `api.registerVideoGenerationProvider(...)`     | `fal`, `google`, `qwen`          |
| Webabruf                  | `api.registerWebFetchProvider(...)`            | `firecrawl`                      |
| Websuche                  | `api.registerWebSearchProvider(...)`           | `brave`, `firecrawl`, `google`   |
| Kanal / Nachrichten       | `api.registerChannel(...)`                     | `matrix`, `msteams`              |
| Gateway-Erkennung         | `api.registerGatewayDiscoveryService(...)`     | `bonjour`                        |

<Note>
Ein Plugin, das keine Fähigkeiten registriert, aber Hooks, Werkzeuge, Erkennungsdienste oder Hintergrunddienste bereitstellt, ist ein **veraltetes reines Hook-Plugin**. Dieses Muster wird weiterhin vollständig unterstützt.
</Note>

### Haltung zur externen Kompatibilität

Das Fähigkeitsmodell ist im Kern implementiert und wird heute von gebündelten und nativen Plugins verwendet. Für die Kompatibilität externer Plugins gelten jedoch strengere Anforderungen als „es wird exportiert und ist daher unveränderlich“.

| Plugin-Situation                                  | Empfehlung                                                                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Bestehende externe Plugins                        | Hook-basierte Integrationen müssen weiterhin funktionieren; dies ist die Kompatibilitätsgrundlage.                        |
| Neue gebündelte/native Plugins                    | Bevorzugen Sie eine explizite Fähigkeitsregistrierung gegenüber anbieterspezifischen Zugriffen oder neuen reinen Hook-Konzepten. |
| Externe Plugins mit Fähigkeitsregistrierung       | Zulässig, behandeln Sie fähigkeitsspezifische Hilfsoberflächen jedoch als veränderlich, sofern die Dokumentation sie nicht als stabil kennzeichnet. |

Die Fähigkeitsregistrierung ist die vorgesehene Entwicklungsrichtung. Veraltete Hooks bleiben während des Übergangs für externe Plugins der sicherste Weg ohne Kompatibilitätsbrüche. Exportierte Hilfsunterpfade sind nicht alle gleichwertig – bevorzugen Sie eng gefasste, dokumentierte Verträge gegenüber beiläufig exportierten Hilfsfunktionen.

### Plugin-Formen

OpenClaw ordnet jedes geladene Plugin anhand seines tatsächlichen Registrierungsverhaltens einer Form zu, nicht nur anhand statischer Metadaten:

<AccordionGroup>
  <Accordion title="plain-capability">
    Registriert genau einen Fähigkeitstyp, beispielsweise ein reines Provider-Plugin wie `arcee` oder `chutes`.
  </Accordion>
  <Accordion title="hybrid-capability">
    Registriert mehrere Fähigkeitstypen; beispielsweise ist `openai` für Textinferenz, Sprachausgabe, Medienverständnis und Bilderzeugung zuständig.
  </Accordion>
  <Accordion title="hook-only">
    Registriert ausschließlich Hooks, typisierte oder benutzerdefinierte, jedoch keine Fähigkeiten, Werkzeuge, Befehle oder Dienste.
  </Accordion>
  <Accordion title="non-capability">
    Registriert Werkzeuge, Befehle, Dienste oder Routen, jedoch keine Fähigkeiten.
  </Accordion>
</AccordionGroup>

Verwenden Sie `openclaw plugins inspect <id>`, um die Form und die Aufschlüsselung der Fähigkeiten eines Plugins anzuzeigen. Einzelheiten finden Sie in der [CLI-Referenz](/de/cli/plugins#inspect).

### Veraltete Hooks

Der Hook `before_agent_start` wird weiterhin als Kompatibilitätspfad für reine Hook-Plugins unterstützt. Bestehende, in der Praxis eingesetzte Plugins sind weiterhin davon abhängig.

Entwicklungsrichtung:

- funktionsfähig halten
- als veraltet dokumentieren
- für das Überschreiben von Modellen oder Providern bevorzugt `before_model_resolve` verwenden
- für Änderungen am Prompt bevorzugt `before_prompt_build` verwenden
- erst entfernen, wenn die tatsächliche Nutzung zurückgegangen ist und die Abdeckung durch Test-Fixtures eine sichere Migration nachweist

### Kompatibilitätssignale

`openclaw doctor`, `openclaw plugins inspect <id>`, `openclaw status --all` und `openclaw plugins doctor` zeigen folgende Kompatibilitätshinweise an:

| Signal                                      | Bedeutung                                                                                                                        |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Konfiguration gültig**                    | Die Konfiguration wird fehlerfrei ausgewertet und die Plugins werden aufgelöst                                                   |
| **nur Hooks** (Information)                 | Das Plugin registriert ausschließlich Hooks; dies ist ein unterstützter Pfad, wurde jedoch noch nicht auf die Fähigkeitsregistrierung migriert |
| **veraltetes `before_agent_start`** (Warnung) | Das Plugin verwendet den veralteten Hook `before_agent_start` anstelle von `before_model_resolve`/`before_prompt_build`          |
| **veraltete Memory-Einbettungs-API** (Warnung) | Ein nicht gebündeltes Plugin verwendet die alte Memory-spezifische API für Einbettungs-Provider anstelle von `registerEmbeddingProvider` |
| **schwerwiegender Fehler**                  | Die Konfiguration ist ungültig oder das Plugin konnte nicht geladen werden                                                       |

Keines der Hinweis- oder Warnsignale beeinträchtigt Ihr Plugin derzeit. Diese Signale werden auch in `openclaw status --all` und `openclaw plugins doctor` angezeigt.

## Architekturübersicht

Das Plugin-System von OpenClaw besteht aus vier Schichten:

<Steps>
  <Step title="Manifest und Erkennung">
    OpenClaw sucht in konfigurierten Pfaden, Arbeitsbereichswurzeln, globalen Plugin-Wurzeln und unter den gebündelten Plugins nach möglichen Plugins. Bei der Erkennung werden zuerst native `openclaw.plugin.json`-Manifeste sowie unterstützte Paketmanifeste gelesen.
  </Step>
  <Step title="Aktivierung und Validierung">
    Der Kern entscheidet, ob ein erkanntes Plugin aktiviert, deaktiviert, blockiert oder für einen exklusiven Platz wie Memory ausgewählt wird.
  </Step>
  <Step title="Laden zur Laufzeit">
    Native OpenClaw-Plugins werden innerhalb des Prozesses geladen und registrieren Fähigkeiten in einer zentralen Registry. Paketiertes JavaScript wird über natives `require` geladen; lokaler TypeScript-Quellcode von Drittanbietern verwendet als Notfalllösung Jiti. Kompatible Pakete werden in Registry-Einträge normalisiert, ohne Laufzeitcode zu importieren.
  </Step>
  <Step title="Nutzung der Oberflächen">
    Die übrigen Teile von OpenClaw lesen die Registry aus, um Werkzeuge, Kanäle, Provider-Einrichtung, Hooks, HTTP-Routen, CLI-Befehle und Dienste bereitzustellen.
  </Step>
</Steps>

Speziell für die Plugin-CLI ist die Erkennung von Stammbefehlen in zwei Phasen unterteilt:

- Metadaten zur Auswertungszeit stammen aus `registerCli(..., { descriptors: [...] })`
- das eigentliche CLI-Modul des Plugins kann verzögert geladen und beim ersten Aufruf registriert werden

Dadurch verbleibt der Plugin-eigene CLI-Code im Plugin, während OpenClaw die Namen der Stammbefehle dennoch vor der Auswertung reservieren kann.

Die wichtige Entwurfsgrenze:

- die Manifest- und Konfigurationsvalidierung sollte anhand von **Manifest-/Schema-Metadaten** funktionieren, ohne Plugin-Code auszuführen
- die Erkennung nativer Fähigkeiten darf vertrauenswürdigen Plugin-Einstiegscode laden, um einen nicht aktivierenden Registry-Schnappschuss zu erstellen
- das native Laufzeitverhalten stammt aus dem Pfad `register(api)` des Plugin-Moduls, wobei `api.registrationMode === "full"` gilt

Diese Trennung ermöglicht OpenClaw, die Konfiguration zu validieren, fehlende oder deaktivierte Plugins zu erläutern und Hinweise für Benutzeroberfläche und Schema zu erstellen, bevor die vollständige Laufzeit aktiv ist.

### Schnappschuss der Plugin-Metadaten und Nachschlagetabelle

Beim Start des Gateway wird ein `PluginMetadataSnapshot` für den aktuellen Konfigurationsschnappschuss erstellt. Der Schnappschuss enthält ausschließlich Metadaten: Er speichert den Index der installierten Plugins, die Manifest-Registry, Manifestdiagnosen, Eigentümerzuordnungen, einen Normalisierer für Plugin-IDs und Manifesteinträge. Er enthält keine geladenen Plugin-Module, Provider-SDKs, Paketinhalte oder Laufzeitexporte.

Plugin-spezifische Konfigurationsvalidierung, automatische Aktivierung beim Start und das Bootstrapping von Gateway-Plugins verwenden diesen Schnappschuss, anstatt Manifest- und Indexmetadaten unabhängig voneinander neu zu erstellen. `PluginLookUpTable` wird aus demselben Schnappschuss abgeleitet und ergänzt den Plugin-Startplan für die aktuelle Laufzeitkonfiguration.

Nach dem Start behält das Gateway den aktuellen Metadatenschnappschuss als austauschbares Laufzeitprodukt bei. Wiederholte Erkennung von Providern zur Laufzeit kann diesen Schnappschuss verwenden, anstatt für jeden Durchlauf des Provider-Katalogs den installierten Index und die Manifest-Registry neu zu erstellen. Der Schnappschuss wird beim Herunterfahren des Gateway, bei Änderungen an der Konfiguration oder am Plugin-Bestand sowie beim Schreiben des installierten Index gelöscht oder ersetzt; Aufrufer greifen auf den kalten Manifest-/Indexpfad zurück, wenn kein kompatibler aktueller Schnappschuss vorhanden ist. Kompatibilitätsprüfungen müssen Plugin-Erkennungswurzeln wie `plugins.load.paths` und den standardmäßigen Agent-Arbeitsbereich einbeziehen, da Arbeitsbereichs-Plugins zum Umfang der Metadaten gehören.

Der Schnappschuss und die Nachschlagetabelle halten wiederholte Startentscheidungen auf dem schnellen Pfad:

- Kanalzuständigkeit
- verzögerter Kanalstart
- Plugin-IDs beim Start
- Zuständigkeit für Provider und CLI-Backends
- Zuständigkeit für Einrichtungs-Provider, Befehlsalias, Modellkatalog-Provider und Manifestvertrag
- Validierung des Plugin-Konfigurationsschemas und des Kanal-Konfigurationsschemas
- Entscheidungen zur automatischen Aktivierung beim Start

Die Sicherheitsgrenze besteht im Ersetzen des Schnappschusses, nicht in dessen Veränderung. Erstellen Sie den Schnappschuss neu, wenn sich die Konfiguration, der Plugin-Bestand, Installationsdatensätze oder die Richtlinie des persistenten Index ändern. Behandeln Sie ihn nicht als umfassende veränderliche globale Registry und bewahren Sie keine unbegrenzte Historie von Schnappschüssen auf. Das Laden von Plugins zur Laufzeit bleibt von Metadatenschnappschüssen getrennt, sodass veralteter Laufzeitzustand nicht hinter einem Metadaten-Cache verborgen werden kann.

Die Cache-Regel ist unter [Interna der Plugin-Architektur](/de/plugins/architecture-internals#plugin-cache-boundary) dokumentiert: Manifest- und Erkennungsmetadaten sind aktuell, sofern ein Aufrufer nicht ausdrücklich einen Schnappschuss, eine Nachschlagetabelle oder eine Manifest-Registry für den aktuellen Ablauf vorhält. Verborgene Metadaten-Caches und zeitbasierte TTLs sind nicht Bestandteil des Ladens von Plugins. Nur Caches des Laufzeitladers sowie Modul- und Abhängigkeitsartefakt-Caches dürfen bestehen bleiben, nachdem Code oder installierte Artefakte tatsächlich geladen wurden.

Einige Aufrufer auf kalten Pfaden erstellen Manifest-Registrys weiterhin direkt aus dem persistent gespeicherten Index installierter Plugins neu, anstatt eine `PluginLookUpTable` des Gateway zu erhalten. Dieser Pfad erstellt die Registry nun bei Bedarf neu. Bevorzugen Sie die Weitergabe der aktuellen Nachschlagetabelle oder einer ausdrücklichen Manifest-Registry durch Laufzeitabläufe, wenn ein Aufrufer bereits über eine solche verfügt.

### Aktivierungsplanung

Die Aktivierungsplanung ist Teil der Steuerungsebene. Aufrufer können vor dem Laden umfassenderer Laufzeitregistrierungen abfragen, welche Plugins für einen konkreten Befehl, Provider, Kanal, eine Route, eine Agent-Harness oder eine Fähigkeit relevant sind.

Der Planer bleibt mit dem aktuellen Manifestverhalten kompatibel:

- `activation.*`-Felder sind explizite Planungshinweise
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` und Hooks bleiben der auf Manifest-Eigentümerschaft basierende Rückfallmechanismus
- die Planer-API, die nur IDs zurückgibt, bleibt für bestehende Aufrufer verfügbar
- die Plan-API meldet Begründungsbezeichnungen, damit die Diagnose explizite Hinweise vom eigentümerschaftsbasierten Rückfallmechanismus unterscheiden kann

<Warning>
Behandeln Sie `activation` weder als Lebenszyklus-Hook noch als Ersatz für `register(...)`. Es handelt sich um Metadaten zur Eingrenzung des Ladevorgangs. Bevorzugen Sie Eigentümerschaftsfelder, wenn diese die Beziehung bereits beschreiben; verwenden Sie `activation` nur für zusätzliche Planungshinweise.
</Warning>

### Kanal-Plugins und das gemeinsame Nachrichtenwerkzeug

Kanal-Plugins müssen für gewöhnliche Chataktionen kein separates Werkzeug zum Senden, Bearbeiten oder Reagieren registrieren. OpenClaw stellt im Kern ein gemeinsames `message`-Werkzeug bereit, während Kanal-Plugins die dahinterliegende kanalspezifische Ermittlung und Ausführung übernehmen.

Die aktuelle Abgrenzung lautet:

- der Kern ist für den Host des gemeinsamen `message`-Werkzeugs, die Prompt-Anbindung, die Sitzungs- und Thread-Verwaltung sowie die Ausführungsverteilung zuständig
- Kanal-Plugins sind für die bereichsbezogene Ermittlung von Aktionen und Fähigkeiten sowie für alle kanalspezifischen Schemafragmente zuständig
- Kanal-Plugins sind für die providerspezifische Grammatik von Sitzungskonversationen zuständig, etwa dafür, wie Konversations-IDs Thread-IDs codieren oder von übergeordneten Konversationen erben
- Kanal-Plugins führen die endgültige Aktion über ihren Aktionsadapter aus

Für Kanal-Plugins ist `ChannelMessageActionAdapter.describeMessageTool(...)` die SDK-Oberfläche. Mit diesem einheitlichen Ermittlungsaufruf kann ein Plugin seine sichtbaren Aktionen, Fähigkeiten und Schemabeiträge gemeinsam zurückgeben, damit diese Bestandteile nicht auseinanderlaufen.

Wenn ein kanalspezifischer Parameter des Nachrichtenwerkzeugs eine Medienquelle wie einen lokalen Pfad oder eine Remote-Medien-URL enthält, sollte das Plugin außerdem `mediaSourceParams` aus `describeMessageTool(...)` zurückgeben. Der Kern verwendet diese explizite Liste, um die Normalisierung von Sandbox-Pfaden und Hinweise für den ausgehenden Medienzugriff anzuwenden, ohne Parameternamen fest einzucodieren, die dem Plugin gehören. Bevorzugen Sie dort aktionsbezogene Zuordnungen statt einer einzigen flachen, kanalweiten Liste, damit ein nur für Profile bestimmter Medienparameter nicht bei nicht zugehörigen Aktionen wie `send` normalisiert wird.

Der Kern übergibt den Laufzeitbereich an diesen Ermittlungsschritt. Wichtige Felder sind:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- die vertrauenswürdige eingehende `requesterSenderId`

Dies ist für kontextabhängige Plugins wichtig. Ein Kanal kann Nachrichtenaktionen anhand des aktiven Kontos, des aktuellen Raums, Threads oder der aktuellen Nachricht sowie der vertrauenswürdigen Identität des Anfragenden aus- oder einblenden, ohne kanalspezifische Verzweigungen im zentralen `message`-Werkzeug fest einzucodieren.

Deshalb bleiben Änderungen am Routing eingebetteter Runner weiterhin Plugin-Arbeit: Der Runner ist dafür verantwortlich, die aktuelle Chat- und Sitzungsidentität an die Ermittlungsgrenze des Plugins weiterzuleiten, damit das gemeinsame `message`-Werkzeug für den aktuellen Durchlauf die richtige, dem Kanal gehörende Oberfläche bereitstellt.

Bei kanaleigenen Ausführungshilfen sollten gebündelte Plugins die Ausführungslaufzeit in ihren eigenen Plugin-Modulen belassen. Der Kern ist nicht länger für die Laufzeiten der Nachrichtenaktionen von Discord, Slack, Telegram oder WhatsApp unter `src/agents/tools` zuständig. Wir veröffentlichen keine separaten Unterpfade vom Typ `plugin-sdk/*-action-runtime`, und gebündelte Plugins sollten ihren eigenen lokalen Laufzeitcode direkt aus ihren Plugin-eigenen Modulen importieren.

Dieselbe Abgrenzung gilt allgemein für nach Providern benannte SDK-Schnittstellen: Der Kern sollte keine kanalspezifischen Komfort-Barrels für Discord, Signal, Slack, WhatsApp oder ähnliche Plugins importieren. Benötigt der Kern ein Verhalten, sollte er entweder das eigene `api.ts`- oder `runtime-api.ts`-Barrel des gebündelten Plugins verwenden oder den Bedarf zu einer eng gefassten generischen Fähigkeit im gemeinsamen SDK erheben.

Für gebündelte Plugins gilt dieselbe Regel. Die Datei `runtime-api.ts` eines gebündelten Plugins sollte nicht dessen eigene markenspezifische Fassade `openclaw/plugin-sdk/<plugin-id>` erneut exportieren. Diese markenspezifischen Fassaden bleiben Kompatibilitätsschichten für externe Plugins und ältere Nutzer, gebündelte Plugins sollten jedoch lokale Exporte sowie eng gefasste generische SDK-Unterpfade wie `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` oder `openclaw/plugin-sdk/webhook-ingress` verwenden. Neuer Code sollte keine Plugin-ID-spezifischen SDK-Fassaden hinzufügen, es sei denn, die Kompatibilitätsgrenze eines bestehenden externen Ökosystems erfordert dies.

Speziell für Umfragen gibt es zwei Ausführungspfade:

- `outbound.sendPoll` ist die gemeinsame Grundlage für Kanäle, die dem allgemeinen Umfragemodell entsprechen
- `actions.handleAction("poll")` ist der bevorzugte Pfad für kanalspezifische Umfragesemantik oder zusätzliche Umfrageparameter

Der Kern verschiebt nun die gemeinsame Umfrageanalyse, bis die Plugin-Umfrageverteilung die Aktion abgelehnt hat. Dadurch können Plugin-eigene Umfrage-Handler kanalspezifische Umfragefelder akzeptieren, ohne zuvor vom generischen Umfrageparser blockiert zu werden.

Die vollständige Startsequenz finden Sie unter [Interne Plugin-Architektur](/de/plugins/architecture-internals).

## Eigentümerschaftsmodell für Fähigkeiten

OpenClaw behandelt ein natives Plugin als Eigentümerschaftsgrenze für ein **Unternehmen** oder eine **Funktion**, nicht als Sammelsurium nicht zusammengehöriger Integrationen.

Das bedeutet:

- ein Unternehmens-Plugin sollte normalerweise alle OpenClaw-seitigen Oberflächen dieses Unternehmens abdecken
- ein Funktions-Plugin sollte normalerweise die vollständige von ihm eingeführte Funktionsoberfläche abdecken
- Kanäle sollten gemeinsame Kernfähigkeiten verwenden, anstatt Providerverhalten ad hoc neu zu implementieren

<AccordionGroup>
  <Accordion title="Provider mit mehreren Fähigkeiten">
    `google` ist für Textinferenz, CLI-Backend, Einbettungen, Sprache, Echtzeit-Sprache, Medienverständnis, Bild-, Musik- und Videogenerierung sowie Websuche zuständig. `openai` ist für Textinferenz, Einbettungen, Sprache, Echtzeittranskription, Echtzeit-Sprache, Medienverständnis sowie Bild- und Videogenerierung zuständig. `minimax` ist für Textinferenz sowie Medienverständnis, Sprache, Bild-, Musik- und Videogenerierung und Websuche zuständig.
  </Accordion>
  <Accordion title="Provider mit einer einzelnen Fähigkeit">
    `arcee` und `chutes` sind nur für Textinferenz zuständig; `microsoft` ist nur für Sprache zuständig. Ein Provider-Plugin kann so eng gefasst bleiben, bis es einen größeren Teil der Oberfläche dieses Providers abdecken muss.
  </Accordion>
  <Accordion title="Funktions-Plugin">
    `voice-call` ist für Anruftransport, Werkzeuge, CLI, Routen und die Überbrückung von Twilio-Medienstreams zuständig, verwendet jedoch gemeinsame Fähigkeiten für Sprache, Echtzeittranskription und Echtzeit-Sprache, anstatt Provider-Plugins direkt zu importieren.
  </Accordion>
</AccordionGroup>

Der angestrebte Endzustand lautet:

- die OpenClaw-seitige Oberfläche eines Providers befindet sich in einem Plugin, auch wenn sie Textmodelle, Sprache, Bilder und Video umfasst
- andere Provider können dasselbe für ihren eigenen Oberflächenbereich tun
- Kanälen ist gleichgültig, welches Provider-Plugin für den Provider zuständig ist; sie verwenden den vom Kern bereitgestellten gemeinsamen Fähigkeitsvertrag

Dies ist der entscheidende Unterschied:

- **Plugin** = Eigentümerschaftsgrenze
- **Fähigkeit** = Kernvertrag, den mehrere Plugins implementieren oder verwenden können

Wenn OpenClaw also einen neuen Bereich wie Video hinzufügt, lautet die erste Frage nicht: „Welcher Provider sollte die Videoverarbeitung fest eincodieren?“ Die erste Frage lautet: „Wie sieht der Kernvertrag für die Videofähigkeit aus?“ Sobald dieser Vertrag vorhanden ist, können sich Provider-Plugins dafür registrieren und Kanal- sowie Funktions-Plugins ihn verwenden.

Wenn die Fähigkeit noch nicht vorhanden ist, ist normalerweise folgendes Vorgehen richtig:

<Steps>
  <Step title="Fähigkeit definieren">
    Definieren Sie die fehlende Fähigkeit im Kern.
  </Step>
  <Step title="Über das SDK bereitstellen">
    Stellen Sie sie typisiert über die Plugin-API beziehungsweise die Plugin-Laufzeit bereit.
  </Step>
  <Step title="Nutzer anbinden">
    Binden Sie Kanäle und Funktionen an diese Fähigkeit an.
  </Step>
  <Step title="Providerimplementierungen">
    Lassen Sie Provider-Plugins Implementierungen registrieren.
  </Step>
</Steps>

Dadurch bleibt die Eigentümerschaft explizit, während Kernverhalten vermieden wird, das von einem einzelnen Provider oder einem einmaligen Plugin-spezifischen Codepfad abhängt.

### Schichtung der Fähigkeiten

Verwenden Sie bei der Entscheidung, wohin Code gehört, folgendes Denkmodell:

<Tabs>
  <Tab title="Kernschicht für Fähigkeiten">
    Gemeinsame Orchestrierung, Richtlinien, Rückfallverhalten, Regeln für die Zusammenführung der Konfiguration, Zustellungssemantik und typisierte Verträge.
  </Tab>
  <Tab title="Provider-Plugin-Schicht">
    Providerspezifische APIs, Authentifizierung, Modellkataloge, Sprachsynthese, Bilderzeugung, Video-Backends und Nutzungsendpunkte.
  </Tab>
  <Tab title="Kanal-/Funktions-Plugin-Schicht">
    Discord-/Slack-/Sprachanruf-/usw.-Integration, die Kernfähigkeiten verwendet und sie auf einer Oberfläche bereitstellt.
  </Tab>
</Tabs>

TTS folgt beispielsweise diesem Aufbau:

- der Kern ist für die TTS-Richtlinie zur Antwortzeit, die Rückfallreihenfolge, Einstellungen und die Kanalzustellung zuständig
- `elevenlabs`, `google`, `microsoft` und `openai` sind für die Syntheseimplementierungen zuständig
- `voice-call` verwendet die TTS-Laufzeithilfe für Telefonie

Dasselbe Muster sollte für zukünftige Fähigkeiten bevorzugt werden.

### Beispiel für ein Unternehmens-Plugin mit mehreren Fähigkeiten

Ein Unternehmens-Plugin sollte sich von außen geschlossen anfühlen. Wenn OpenClaw gemeinsame Verträge für Modelle, Sprache, Echtzeittranskription, Echtzeit-Sprache, Medienverständnis, Bildgenerierung, Videogenerierung, Webabruf und Websuche besitzt, kann ein Provider alle seine Oberflächen an einer Stelle abdecken:

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";
import { createPluginBackedWebSearchProvider } from "openclaw/plugin-sdk/provider-web-search";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // Authentifizierungs-/Modellkatalog-/Laufzeit-Hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // Provider-Sprachkonfiguration — die SpeechProviderPlugin-Schnittstelle direkt implementieren
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          ...req,
          provider: "exampleai",
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          ...req,
          provider: "exampleai",
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // Anmeldedaten- und Abruflogik
      }),
    );
  },
};

export default plugin;
```

Entscheidend sind nicht die genauen Namen der Hilfsfunktionen, sondern der Aufbau:

- ein Plugin ist für die Provideroberfläche zuständig
- der Kern bleibt für die Fähigkeitsverträge zuständig
- Kanäle und Funktions-Plugins verwenden `api.runtime.*`-Hilfen statt Providercode
- Vertragstests können sicherstellen, dass das Plugin die Fähigkeiten registriert hat, für die es nach eigener Angabe zuständig ist

### Fähigkeitsbeispiel: Videoverständnis

OpenClaw behandelt Bild-, Audio- und Videoverständnis bereits als eine gemeinsame Fähigkeit. Dort gilt dasselbe Eigentümerschaftsmodell:

<Steps>
  <Step title="Der Kern definiert den Vertrag">
    Der Kern definiert den Vertrag für Medienverständnis.
  </Step>
  <Step title="Provider-Plugins registrieren sich">
    Provider-Plugins registrieren je nach Anwendbarkeit `describeImage`, `transcribeAudio` und `describeVideo`.
  </Step>
  <Step title="Nutzer verwenden das gemeinsame Verhalten">
    Kanäle und Funktions-Plugins verwenden das gemeinsame Kernverhalten, anstatt eine direkte Verbindung zu Providercode herzustellen.
  </Step>
</Steps>

Dadurch werden die Videoannahmen eines einzelnen Providers nicht fest in den Kern eingebaut. Das Plugin ist für die Provideroberfläche zuständig; der Kern ist für den Fähigkeitsvertrag und das Rückfallverhalten zuständig.

Die Videogenerierung verwendet bereits dieselbe Abfolge: Der Kern ist für den typisierten Fähigkeitsvertrag und die Laufzeithilfe zuständig, während Provider-Plugins Implementierungen mit `api.registerVideoGenerationProvider(...)` dafür registrieren.

Benötigen Sie eine konkrete Checkliste für die Einführung? Weitere Informationen finden Sie im [Fähigkeiten-Kochbuch](/de/plugins/adding-capabilities).

## Verträge und Durchsetzung

Die Plugin-API-Oberfläche ist bewusst typisiert und in `OpenClawPluginApi` zentralisiert. Dieser Vertrag definiert die unterstützten Registrierungspunkte und die Laufzeithilfen, auf die sich ein Plugin verlassen darf.

Warum dies wichtig ist:

- Plugin-Autoren erhalten einen einheitlichen, stabilen internen Standard
- der Kern kann doppelte Zuständigkeiten zurückweisen, etwa wenn zwei Plugins dieselbe Provider-ID registrieren
- beim Start können aussagekräftige Diagnosen für fehlerhafte Registrierungen ausgegeben werden
- Vertragstests können die Zuständigkeit gebündelter Plugins durchsetzen und unbemerkte Abweichungen verhindern

Die Durchsetzung erfolgt auf zwei Ebenen:

<AccordionGroup>
  <Accordion title="Durchsetzung bei der Laufzeitregistrierung">
    Die Plugin-Registry validiert Registrierungen beim Laden der Plugins. Beispiele: Doppelte Provider-IDs, doppelte IDs für Sprach-Provider und fehlerhafte Registrierungen erzeugen Plugin-Diagnosen anstelle von undefiniertem Verhalten.
  </Accordion>
  <Accordion title="Vertragstests">
    Gebündelte Plugins werden während der Testläufe in Vertrags-Registries erfasst, damit OpenClaw die Zuständigkeit ausdrücklich prüfen kann. Derzeit wird dies für Modell-Provider, Sprach-Provider, Websuch-Provider und die Zuständigkeit für gebündelte Registrierungen verwendet.
  </Accordion>
</AccordionGroup>

In der Praxis bedeutet dies, dass OpenClaw von Anfang an weiß, welches Plugin für welche Oberfläche zuständig ist. Dadurch können der Kern und die Kanäle nahtlos zusammenwirken, weil die Zuständigkeit deklariert, typisiert und testbar ist, statt nur implizit zu bestehen.

### Was in einen Vertrag gehört

<Tabs>
  <Tab title="Gute Verträge">
    - typisiert
    - klein
    - auf eine bestimmte Fähigkeit ausgerichtet
    - im Besitz des Kerns
    - von mehreren Plugins wiederverwendbar
    - von Kanälen und Funktionen ohne Kenntnis des jeweiligen Anbieters nutzbar

  </Tab>
  <Tab title="Schlechte Verträge">
    - im Kern verborgene anbieterspezifische Richtlinien
    - einmalige Plugin-Ausweichmechanismen, die die Registry umgehen
    - Kanalcode, der direkt auf eine Anbieterimplementierung zugreift
    - Ad-hoc-Laufzeitobjekte, die nicht Bestandteil von `OpenClawPluginApi` oder `api.runtime` sind

  </Tab>
</Tabs>

Erhöhen Sie im Zweifelsfall die Abstraktionsebene: Definieren Sie zuerst die Fähigkeit und lassen Sie anschließend Plugins daran anbinden.

## Ausführungsmodell

Native OpenClaw-Plugins werden **prozessintern** zusammen mit dem Gateway ausgeführt. Sie sind nicht durch eine Sandbox isoliert. Ein geladenes natives Plugin befindet sich auf derselben Vertrauensgrenze auf Prozessebene wie der Kerncode.

<Warning>
Auswirkungen nativer Plugins: Ein Plugin kann Tools, Netzwerk-Handler, Hooks und Dienste registrieren; ein Fehler in einem Plugin kann das Gateway zum Absturz bringen oder destabilisieren; und ein bösartiges natives Plugin entspricht der Ausführung beliebigen Codes innerhalb des OpenClaw-Prozesses.
</Warning>

Kompatible Bundles sind standardmäßig sicherer, da OpenClaw sie derzeit als Metadaten-/Inhaltspakete behandelt. In aktuellen Versionen bedeutet dies hauptsächlich gebündelte Skills.

Verwenden Sie für nicht gebündelte Plugins Positivlisten sowie explizite Installations- und Ladepfade. Behandeln Sie Workspace-Plugins als Code für die Entwicklungsphase und nicht als Produktionsstandard.

Bei Namen gebündelter Workspace-Pakete muss die Plugin-ID im npm-Namen verankert bleiben: standardmäßig `@openclaw/<id>` oder mit einem genehmigten typisierten Suffix wie `-provider`, `-plugin`, `-speech`, `-sandbox` oder `-media-understanding`, wenn das Paket absichtlich eine enger gefasste Plugin-Rolle bereitstellt.

<Note>
**Hinweis zum Vertrauen:** `plugins.allow` vertraut **Plugin-IDs**, nicht der Herkunft des Quellcodes. Ein Workspace-Plugin mit derselben ID wie ein gebündeltes Plugin überschreibt absichtlich die gebündelte Kopie, wenn dieses Workspace-Plugin aktiviert oder in die Positivliste aufgenommen wurde. Dies ist normal und nützlich für die lokale Entwicklung, das Testen von Patches und Hotfixes. Das Vertrauen in gebündelte Plugins wird anhand des Quellcode-Snapshots bestimmt – des Manifests und des Codes, die zum Ladezeitpunkt auf dem Datenträger vorhanden sind – und nicht anhand von Installationsmetadaten. Ein beschädigter oder ausgetauschter Installationseintrag kann die Vertrauensoberfläche eines gebündelten Plugins nicht unbemerkt über die Angaben der tatsächlichen Quelle hinaus erweitern.
</Note>

## Exportgrenze

OpenClaw exportiert Fähigkeiten und keine Hilfsfunktionen, die lediglich die Implementierung vereinfachen.

Halten Sie die Registrierung von Fähigkeiten öffentlich. Entfernen Sie Hilfsexporte, die nicht zum Vertrag gehören:

- Hilfs-Unterpfade, die nur für bestimmte gebündelte Plugins gelten
- Unterpfade der Laufzeitinfrastruktur, die nicht als öffentliche API vorgesehen sind
- anbieterspezifische Komfortfunktionen
- Hilfsfunktionen für Einrichtung und Onboarding, die Implementierungsdetails darstellen

Reservierte Hilfs-Unterpfade für gebündelte Plugins wurden aus der generierten SDK-Exportzuordnung entfernt. Belassen Sie zuständigkeitsspezifische Hilfsfunktionen innerhalb des jeweils zuständigen Plugin-Pakets; übernehmen Sie nur wiederverwendbares Host-Verhalten in generische SDK-Verträge wie `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` und `plugin-sdk/plugin-config-runtime`.

## Interna und Referenz

Informationen zur Lade-Pipeline, zum Registry-Modell, zu Laufzeit-Hooks für Provider, zu Gateway-HTTP-Routen, zu Schemas für Nachrichten-Tools, zur Auflösung von Kanalzielen, zu Provider-Katalogen, zu Plugins für Kontext-Engines sowie eine Anleitung zum Hinzufügen einer neuen Fähigkeit finden Sie unter [Interna der Plugin-Architektur](/de/plugins/architecture-internals).

## Verwandte Themen

- [Plugins erstellen](/de/plugins/building-plugins)
- [Plugin-Manifest](/de/plugins/manifest)
- [Plugin-SDK einrichten](/de/plugins/sdk-setup)
