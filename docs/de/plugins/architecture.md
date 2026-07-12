---
read_when:
    - Native OpenClaw-Plugins entwickeln oder debuggen
    - Das Plugin-Fähigkeitsmodell oder die Zuständigkeitsgrenzen verstehen
    - Arbeiten an der Plugin-Ladepipeline oder -Registry
    - Implementierung von Provider-Runtime-Hooks oder Kanal-Plugins
sidebarTitle: Internals
summary: 'Plugin-Interna: Capability-Modell, Zuständigkeit, Verträge, Ladepipeline und Runtime-Hilfsfunktionen'
title: Interne Funktionsweise von Plugins
x-i18n:
    generated_at: "2026-07-12T15:31:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 07ab077080285b5b7a93f58f71cd00be62cfd79cdc2cfa40f0e64cc91cc5ac46
    source_path: plugins/architecture.md
    workflow: 16
---

Dies ist die **detaillierte Architekturreferenz** für das Plugin-System von OpenClaw. Für praktische Anleitungen beginnen Sie mit einer der unten aufgeführten themenspezifischen Seiten.

<CardGroup cols={2}>
  <Card title="Plugins installieren und verwenden" icon="plug" href="/de/tools/plugin">
    Benutzerhandbuch zum Hinzufügen, Aktivieren und Beheben von Problemen bei Plugins.
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
    Referenz für Importzuordnung und Registrierungs-API.
  </Card>
</CardGroup>

## Öffentliches Capability-Modell

Capabilities bilden das öffentliche Modell für **native Plugins** innerhalb von OpenClaw. Jedes native OpenClaw-Plugin registriert sich für einen oder mehrere Capability-Typen:

| Capability                  | Registrierungsmethode                             | Beispiel-Plugins                    |
| --------------------------- | ------------------------------------------------- | ----------------------------------- |
| Textinferenz                | `api.registerProvider(...)`                       | `anthropic`, `openai`               |
| CLI-Inferenz-Backend        | `api.registerCliBackend(...)`                     | `anthropic`, `openai`               |
| Embeddings                  | `api.registerEmbeddingProvider(...)`              | Provider-eigene Vektor-Plugins      |
| Sprache                     | `api.registerSpeechProvider(...)`                 | `elevenlabs`, `microsoft`           |
| Echtzeittranskription       | `api.registerRealtimeTranscriptionProvider(...)`  | `openai`                            |
| Echtzeitstimme              | `api.registerRealtimeVoiceProvider(...)`          | `google`, `openai`                  |
| Medienverständnis           | `api.registerMediaUnderstandingProvider(...)`     | `google`, `openai`                  |
| Transkriptquelle            | `api.registerTranscriptSourceProvider(...)`       | `discord`                           |
| Bilderzeugung               | `api.registerImageGenerationProvider(...)`        | `fal`, `google`, `openai`           |
| Musikerzeugung              | `api.registerMusicGenerationProvider(...)`        | `fal`, `google`, `minimax`          |
| Videoerzeugung              | `api.registerVideoGenerationProvider(...)`        | `fal`, `google`, `qwen`             |
| Webabruf                    | `api.registerWebFetchProvider(...)`               | `firecrawl`                         |
| Websuche                    | `api.registerWebSearchProvider(...)`              | `brave`, `firecrawl`, `google`      |
| Kanal / Nachrichten         | `api.registerChannel(...)`                        | `matrix`, `msteams`                 |
| Gateway-Erkennung           | `api.registerGatewayDiscoveryService(...)`        | `bonjour`                           |

<Note>
Ein Plugin, das keine Capabilities registriert, aber Hooks, Tools, Erkennungsdienste oder Hintergrunddienste bereitstellt, ist ein **reines Legacy-Hook-Plugin**. Dieses Muster wird weiterhin vollständig unterstützt.
</Note>

### Haltung zur externen Kompatibilität

Das Capability-Modell ist im Core implementiert und wird heute von gebündelten und nativen Plugins verwendet. Für die Kompatibilität externer Plugins gilt jedoch weiterhin ein strengerer Maßstab als „es wird exportiert, daher ist es unveränderlich“.

| Plugin-Situation                                  | Empfehlung                                                                                                                  |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Bestehende externe Plugins                        | Hook-basierte Integrationen funktionsfähig halten; dies ist die Kompatibilitätsbasis.                                       |
| Neue gebündelte/native Plugins                    | Explizite Capability-Registrierung gegenüber herstellerspezifischen Zugriffen oder neuen reinen Hook-Konzepten bevorzugen.  |
| Externe Plugins mit Capability-Registrierung      | Zulässig, aber Capability-spezifische Hilfsschnittstellen als veränderlich betrachten, sofern die Dokumentation sie nicht als stabil kennzeichnet. |

Die Capability-Registrierung ist die vorgesehene Entwicklungsrichtung. Legacy-Hooks bleiben während des Übergangs der sicherste Weg für externe Plugins, um Funktionsbrüche zu vermeiden. Exportierte Hilfsunterpfade sind nicht alle gleichwertig — bevorzugen Sie eng gefasste, dokumentierte Verträge gegenüber beiläufig exportierten Hilfsfunktionen.

### Plugin-Formen

OpenClaw klassifiziert jedes geladene Plugin anhand seines tatsächlichen Registrierungsverhaltens in eine Form, nicht nur anhand statischer Metadaten:

<AccordionGroup>
  <Accordion title="plain-capability">
    Registriert genau einen Capability-Typ, beispielsweise ein reines Provider-Plugin wie `arcee` oder `chutes`.
  </Accordion>
  <Accordion title="hybrid-capability">
    Registriert mehrere Capability-Typen, beispielsweise umfasst `openai` Textinferenz, Sprache, Medienverständnis und Bilderzeugung.
  </Accordion>
  <Accordion title="hook-only">
    Registriert ausschließlich typisierte oder benutzerdefinierte Hooks, jedoch keine Capabilities, Tools, Befehle oder Dienste.
  </Accordion>
  <Accordion title="non-capability">
    Registriert Tools, Befehle, Dienste oder Routen, jedoch keine Capabilities.
  </Accordion>
</AccordionGroup>

Verwenden Sie `openclaw plugins inspect <id>`, um die Form und Aufschlüsselung der Capabilities eines Plugins anzuzeigen. Weitere Informationen finden Sie in der [CLI-Referenz](/de/cli/plugins#inspect).

### Legacy-Hooks

Der Hook `before_agent_start` wird weiterhin als Kompatibilitätspfad für reine Hook-Plugins unterstützt. Bestehende Plugins aus der Praxis sind weiterhin davon abhängig.

Entwicklungsrichtung:

- funktionsfähig halten
- als Legacy dokumentieren
- für Überschreibungen von Modellen oder Providern `before_model_resolve` bevorzugen
- für Änderungen am Prompt `before_prompt_build` bevorzugen
- erst entfernen, wenn die tatsächliche Nutzung zurückgegangen ist und die Abdeckung durch Fixtures die Migrationssicherheit belegt

### Kompatibilitätssignale

`openclaw doctor`, `openclaw plugins inspect <id>`, `openclaw status --all` und `openclaw plugins doctor` zeigen folgende Kompatibilitätshinweise an:

| Signal                                      | Bedeutung                                                                                                                        |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Konfiguration gültig**                    | Die Konfiguration wird fehlerfrei geparst und die Plugins werden aufgelöst.                                                      |
| **nur Hooks** (Info)                        | Das Plugin registriert nur Hooks; dies ist ein unterstützter Pfad, wurde aber noch nicht auf die Capability-Registrierung migriert. |
| **Legacy-`before_agent_start`** (Warnung)   | Das Plugin verwendet den veralteten Hook `before_agent_start` anstelle von `before_model_resolve`/`before_prompt_build`.          |
| **veraltete Memory-Embedding-API** (Warnung) | Ein nicht gebündeltes Plugin verwendet die alte Memory-spezifische Embedding-Provider-API anstelle von `registerEmbeddingProvider`. |
| **schwerwiegender Fehler**                  | Die Konfiguration ist ungültig oder das Plugin konnte nicht geladen werden.                                                      |

Keines der Hinweis- oder Warnsignale beeinträchtigt derzeit die Funktion Ihres Plugins. Diese Signale werden auch in `openclaw status --all` und `openclaw plugins doctor` angezeigt.

## Architekturübersicht

Das Plugin-System von OpenClaw besteht aus vier Ebenen:

<Steps>
  <Step title="Manifest und Erkennung">
    OpenClaw sucht in konfigurierten Pfaden, Workspace-Stammverzeichnissen, globalen Plugin-Stammverzeichnissen und unter den gebündelten Plugins nach infrage kommenden Plugins. Bei der Erkennung werden zuerst native `openclaw.plugin.json`-Manifeste sowie unterstützte Bundle-Manifeste gelesen.
  </Step>
  <Step title="Aktivierung und Validierung">
    Der Core entscheidet, ob ein erkanntes Plugin aktiviert, deaktiviert, blockiert oder für einen exklusiven Slot wie Memory ausgewählt wird.
  </Step>
  <Step title="Laden zur Laufzeit">
    Native OpenClaw-Plugins werden innerhalb des Prozesses geladen und registrieren Capabilities in einer zentralen Registry. Paketiertes JavaScript wird über das native `require` geladen; lokaler TypeScript-Quellcode von Drittanbietern verwendet als Notfalllösung Jiti. Kompatible Bundles werden in Registry-Einträge normalisiert, ohne Laufzeitcode zu importieren.
  </Step>
  <Step title="Nutzung der Schnittstellen">
    Der übrige Teil von OpenClaw liest die Registry, um Tools, Kanäle, Provider-Einrichtung, Hooks, HTTP-Routen, CLI-Befehle und Dienste bereitzustellen.
  </Step>
</Steps>

Speziell für die Plugin-CLI ist die Erkennung von Stammbefehlen in zwei Phasen unterteilt:

- Metadaten zur Parse-Zeit stammen aus `registerCli(..., { descriptors: [...] })`
- das eigentliche CLI-Modul des Plugins kann weiterhin verzögert geladen und beim ersten Aufruf registriert werden

Dadurch verbleibt der Plugin-eigene CLI-Code im Plugin, während OpenClaw die Namen der Stammbefehle dennoch vor dem Parsen reservieren kann.

Die wichtige Designgrenze:

- die Manifest- und Konfigurationsvalidierung sollte anhand von **Manifest-/Schema-Metadaten** funktionieren, ohne Plugin-Code auszuführen
- die Erkennung nativer Capabilities darf vertrauenswürdigen Plugin-Einstiegscode laden, um einen nicht aktivierenden Registry-Snapshot zu erstellen
- das native Laufzeitverhalten stammt aus dem Pfad `register(api)` des Plugin-Moduls, wobei `api.registrationMode === "full"` gilt

Durch diese Trennung kann OpenClaw Konfigurationen validieren, fehlende oder deaktivierte Plugins erklären und Hinweise für Benutzeroberfläche und Schema erstellen, bevor die vollständige Laufzeit aktiv ist.

### Snapshot der Plugin-Metadaten und Nachschlagetabelle

Beim Start des Gateway wird ein `PluginMetadataSnapshot` für den aktuellen Konfigurations-Snapshot erstellt. Der Snapshot enthält ausschließlich Metadaten: Er speichert den Index der installierten Plugins, die Manifest-Registry, Manifestdiagnosen, Eigentümerzuordnungen, eine Normalisierungsfunktion für Plugin-IDs und Manifestdatensätze. Er enthält keine geladenen Plugin-Module, Provider-SDKs, Paketinhalte oder Laufzeitexporte.

Plugin-bezogene Konfigurationsvalidierung, automatische Aktivierung beim Start und Plugin-Bootstrap des Gateway verwenden diesen Snapshot, anstatt Manifest- und Indexmetadaten unabhängig voneinander neu zu erstellen. `PluginLookUpTable` wird aus demselben Snapshot abgeleitet und ergänzt den Plugin-Startplan für die aktuelle Laufzeitkonfiguration.

Nach dem Start behält das Gateway den aktuellen Metadaten-Snapshot als austauschbares Laufzeitprodukt bei. Wiederholte Provider-Erkennungen zur Laufzeit können diesen Snapshot verwenden, anstatt den installierten Index und die Manifest-Registry für jeden Durchlauf des Provider-Katalogs neu zu erstellen. Der Snapshot wird beim Herunterfahren des Gateway, bei Änderungen an der Konfiguration oder am Plugin-Bestand sowie beim Schreiben des installierten Index gelöscht oder ersetzt; Aufrufer greifen auf den kalten Manifest-/Indexpfad zurück, wenn kein kompatibler aktueller Snapshot vorhanden ist. Kompatibilitätsprüfungen müssen Plugin-Erkennungsstammverzeichnisse wie `plugins.load.paths` und den standardmäßigen Agent-Workspace einschließen, da Workspace-Plugins zum Metadatenumfang gehören.

Der Snapshot und die Nachschlagetabelle halten wiederholte Startentscheidungen auf dem schnellen Pfad:

- Kanalzuständigkeit
- verzögerter Kanalstart
- Plugin-IDs für den Start
- Zuständigkeit für Provider und CLI-Backends
- Zuständigkeit für Einrichtungs-Provider, Befehlsaliase, Modellkatalog-Provider und Manifestverträge
- Validierung des Plugin-Konfigurationsschemas und des Kanal-Konfigurationsschemas
- Entscheidungen zur automatischen Aktivierung beim Start

Die Sicherheitsgrenze liegt im Ersetzen des Snapshots, nicht in seiner Mutation. Erstellen Sie den Snapshot neu, wenn sich Konfiguration, Plugin-Bestand, Installationsdatensätze oder persistierte Indexrichtlinien ändern. Behandeln Sie ihn nicht als umfassende, veränderliche globale Registry und bewahren Sie keine unbegrenzte Anzahl historischer Snapshots auf. Das Laden von Plugins zur Laufzeit bleibt von Metadaten-Snapshots getrennt, sodass veralteter Laufzeitzustand nicht hinter einem Metadaten-Cache verborgen werden kann.

Die Cache-Regel ist unter [Interne Plugin-Architektur](/de/plugins/architecture-internals#plugin-cache-boundary) dokumentiert: Manifest- und Erkennungsmetadaten sind aktuell, sofern ein Aufrufer nicht einen expliziten Snapshot, eine Nachschlagetabelle oder eine Manifest-Registry für den aktuellen Ablauf hält. Verborgene Metadaten-Caches und zeitbasierte TTLs sind nicht Teil des Plugin-Ladevorgangs. Nur Caches für Laufzeit-Loader, Module und Abhängigkeitsartefakte dürfen bestehen bleiben, nachdem Code oder installierte Artefakte tatsächlich geladen wurden.

Einige Aufrufer auf kalten Pfaden erstellen Manifest-Registrys weiterhin direkt aus dem persistierten Index installierter Plugins neu, anstatt eine `PluginLookUpTable` des Gateway zu erhalten. Dieser Pfad erstellt die Registry nun bei Bedarf neu; bevorzugen Sie die Übergabe der aktuellen Nachschlagetabelle oder einer expliziten Manifest-Registry durch Laufzeitabläufe, wenn einem Aufrufer bereits eine solche vorliegt.

### Aktivierungsplanung

Die Aktivierungsplanung ist Teil der Steuerungsebene. Aufrufer können vor dem Laden umfassenderer Laufzeitregistries abfragen, welche Plugins für einen konkreten Befehl, Provider, Kanal, eine Route, ein Agent-Harness oder eine Fähigkeit relevant sind.

Der Planer bleibt mit dem aktuellen Manifestverhalten kompatibel:

- `activation.*`-Felder sind explizite Hinweise für den Planer
- `providers`, `channels`, `commandAliases`, `setup.providers`, `contracts.tools` und Hooks bleiben der Fallback für die Manifestzuständigkeit
- die Planer-API, die nur IDs zurückgibt, bleibt für bestehende Aufrufer verfügbar
- die Plan-API meldet Begründungskennzeichnungen, damit die Diagnose zwischen expliziten Hinweisen und dem Fallback auf die Zuständigkeit unterscheiden kann

<Warning>
Behandeln Sie `activation` nicht als Lebenszyklus-Hook oder als Ersatz für `register(...)`. Es handelt sich um Metadaten zur Eingrenzung des Ladevorgangs. Bevorzugen Sie Zuständigkeitsfelder, wenn sie die Beziehung bereits beschreiben; verwenden Sie `activation` nur für zusätzliche Planerhinweise.
</Warning>

### Kanal-Plugins und das gemeinsame Nachrichtentool

Kanal-Plugins müssen für normale Chataktionen kein separates Tool zum Senden, Bearbeiten oder Reagieren registrieren. OpenClaw verwaltet ein gemeinsames `message`-Tool im Kern, während Kanal-Plugins die dahinterliegende kanalspezifische Ermittlung und Ausführung übernehmen.

Die aktuelle Abgrenzung lautet:

- der Kern ist für den Host des gemeinsamen `message`-Tools, die Prompt-Anbindung, die Sitzungs-/Thread-Verwaltung und die Ausführungsverteilung zuständig
- Kanal-Plugins sind für die kontextbezogene Aktionsermittlung, die Fähigkeitsermittlung und alle kanalspezifischen Schemafragmente zuständig
- Kanal-Plugins sind für die providerspezifische Grammatik von Sitzungskonversationen zuständig, beispielsweise dafür, wie Konversations-IDs Thread-IDs codieren oder von übergeordneten Konversationen erben
- Kanal-Plugins führen die endgültige Aktion über ihren Aktionsadapter aus

Für Kanal-Plugins ist die SDK-Oberfläche `ChannelMessageActionAdapter.describeMessageTool(...)`. Mit diesem einheitlichen Ermittlungsaufruf kann ein Plugin seine sichtbaren Aktionen, Fähigkeiten und Schemabeiträge gemeinsam zurückgeben, damit diese Bestandteile nicht auseinanderlaufen.

Wenn ein kanalspezifischer Parameter des Nachrichtentools eine Medienquelle wie einen lokalen Pfad oder eine Remote-Medien-URL enthält, sollte das Plugin außerdem `mediaSourceParams` aus `describeMessageTool(...)` zurückgeben. Der Kern verwendet diese explizite Liste, um die Normalisierung von Sandbox-Pfaden und Hinweise für den ausgehenden Medienzugriff anzuwenden, ohne Parameternamen fest zu codieren, die dem Plugin gehören. Bevorzugen Sie dort aktionsbezogene Zuordnungen statt einer einzigen flachen, kanalweiten Liste, damit ein Medienparameter, der nur für Profile gilt, nicht bei unabhängigen Aktionen wie `send` normalisiert wird.

Der Kern übergibt den Laufzeitkontext an diesen Ermittlungsschritt. Wichtige Felder sind:

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- vertrauenswürdige eingehende `requesterSenderId`

Das ist für kontextsensitive Plugins relevant. Ein Kanal kann Nachrichtenaktionen abhängig vom aktiven Konto, aktuellen Raum/Thread/Nachricht oder der vertrauenswürdigen Identität des Anfragenden ausblenden oder einblenden, ohne kanalspezifische Verzweigungen im zentralen `message`-Tool fest zu codieren.

Aus diesem Grund bleiben Änderungen am Routing des eingebetteten Runners Plugin-Arbeit: Der Runner ist dafür verantwortlich, die aktuelle Chat-/Sitzungsidentität an die Ermittlungsgrenze des Plugins weiterzuleiten, damit das gemeinsame `message`-Tool für den aktuellen Durchlauf die richtige kanaleigene Oberfläche bereitstellt.

Bei kanaleigenen Ausführungshilfen sollten gebündelte Plugins die Ausführungslaufzeit in ihren eigenen Plugin-Modulen belassen. Der Kern ist nicht mehr für die Laufzeiten der Nachrichtenaktionen von Discord, Slack, Telegram oder WhatsApp unter `src/agents/tools` zuständig. Wir veröffentlichen keine separaten Unterpfade vom Typ `plugin-sdk/*-action-runtime`, und gebündelte Plugins sollten ihren eigenen lokalen Laufzeitcode direkt aus ihren Plugin-eigenen Modulen importieren.

Dieselbe Abgrenzung gilt allgemein für providernamenspezifische SDK-Schnittstellen: Der Kern sollte keine kanalspezifischen Komfort-Barrels für Discord, Signal, Slack, WhatsApp oder ähnliche Plugins importieren. Wenn der Kern ein Verhalten benötigt, sollte er entweder das eigene `api.ts`- bzw. `runtime-api.ts`-Barrel des gebündelten Plugins verwenden oder den Bedarf in eine eng gefasste generische Fähigkeit im gemeinsamen SDK überführen.

Für gebündelte Plugins gilt dieselbe Regel. Die Datei `runtime-api.ts` eines gebündelten Plugins sollte nicht die eigene markenspezifische `openclaw/plugin-sdk/<plugin-id>`-Fassade erneut exportieren. Diese markenspezifischen Fassaden bleiben Kompatibilitäts-Shims für externe Plugins und ältere Nutzer, gebündelte Plugins sollten jedoch lokale Exporte sowie eng gefasste generische SDK-Unterpfade wie `openclaw/plugin-sdk/channel-policy`, `openclaw/plugin-sdk/runtime-store` oder `openclaw/plugin-sdk/webhook-ingress` verwenden. Neuer Code sollte keine Plugin-ID-spezifischen SDK-Fassaden hinzufügen, sofern dies nicht aufgrund der Kompatibilitätsgrenze eines bestehenden externen Ökosystems erforderlich ist.

Speziell für Umfragen gibt es zwei Ausführungspfade:

- `outbound.sendPoll` ist die gemeinsame Basis für Kanäle, die dem allgemeinen Umfragemodell entsprechen
- `actions.handleAction("poll")` ist der bevorzugte Pfad für kanalspezifische Umfragesemantik oder zusätzliche Umfrageparameter

Der Kern verzögert nun die gemeinsame Umfrageanalyse, bis die Umfrageverteilung des Plugins die Aktion ablehnt. Dadurch können Plugin-eigene Umfragehandler kanalspezifische Umfragefelder akzeptieren, ohne zuvor vom generischen Umfrageparser blockiert zu werden.

Die vollständige Startsequenz finden Sie unter [Interna der Plugin-Architektur](/de/plugins/architecture-internals).

## Zuständigkeitsmodell für Fähigkeiten

OpenClaw behandelt ein natives Plugin als Zuständigkeitsgrenze für ein **Unternehmen** oder eine **Funktion**, nicht als Sammelsurium unabhängiger Integrationen.

Das bedeutet:

- ein Unternehmens-Plugin sollte normalerweise für alle OpenClaw-bezogenen Oberflächen dieses Unternehmens zuständig sein
- ein Funktions-Plugin sollte normalerweise für die gesamte von ihm eingeführte Funktionsoberfläche zuständig sein
- Kanäle sollten gemeinsame Kernfähigkeiten nutzen, statt Providerverhalten ad hoc neu zu implementieren

<AccordionGroup>
  <Accordion title="Anbieter mit mehreren Fähigkeiten">
    `google` ist für Textinferenz, CLI-Backend, Einbettungen, Sprache, Echtzeit-Sprache, Medienverständnis, Bild-/Musik-/Videogenerierung und Websuche zuständig. `openai` ist für Textinferenz, Einbettungen, Sprache, Echtzeittranskription, Echtzeit-Sprache, Medienverständnis sowie Bild-/Videogenerierung zuständig. `minimax` ist für Textinferenz sowie Medienverständnis, Sprache, Bild-/Musik-/Videogenerierung und Websuche zuständig.
  </Accordion>
  <Accordion title="Anbieter mit einer einzelnen Fähigkeit">
    `arcee` und `chutes` sind ausschließlich für Textinferenz zuständig; `microsoft` ausschließlich für Sprache. Ein Anbieter-Plugin kann so eng gefasst bleiben, bis es einen größeren Teil der Oberfläche dieses Anbieters abdecken muss.
  </Accordion>
  <Accordion title="Funktions-Plugin">
    `voice-call` ist für Anruftransport, Tools, CLI, Routen und die Überbrückung von Twilio-Medienstreams zuständig, nutzt jedoch gemeinsame Fähigkeiten für Sprache, Echtzeittranskription und Echtzeit-Sprache, statt Anbieter-Plugins direkt zu importieren.
  </Accordion>
</AccordionGroup>

Der angestrebte Endzustand ist:

- die OpenClaw-bezogene Oberfläche eines Anbieters befindet sich in einem Plugin, selbst wenn sie Textmodelle, Sprache, Bilder und Video umfasst
- andere Anbieter können dasselbe für ihren eigenen Oberflächenbereich tun
- Kanälen ist gleichgültig, welches Anbieter-Plugin für den Provider zuständig ist; sie nutzen den vom Kern bereitgestellten gemeinsamen Fähigkeitsvertrag

Dies ist der entscheidende Unterschied:

- **Plugin** = Zuständigkeitsgrenze
- **Fähigkeit** = Kernvertrag, den mehrere Plugins implementieren oder nutzen können

Wenn OpenClaw also eine neue Domäne wie Video hinzufügt, lautet die erste Frage nicht: „Welcher Provider sollte die Videoverarbeitung fest codieren?“ Die erste Frage lautet: „Wie sieht der zentrale Fähigkeitsvertrag für Video aus?“ Sobald dieser Vertrag vorhanden ist, können sich Anbieter-Plugins dafür registrieren und Kanal-/Funktions-Plugins ihn nutzen.

Wenn die Fähigkeit noch nicht vorhanden ist, ist normalerweise folgendes Vorgehen richtig:

<Steps>
  <Step title="Fähigkeit definieren">
    Definieren Sie die fehlende Fähigkeit im Kern.
  </Step>
  <Step title="Über das SDK bereitstellen">
    Stellen Sie sie typisiert über die Plugin-API/Laufzeit bereit.
  </Step>
  <Step title="Nutzer anbinden">
    Binden Sie Kanäle/Funktionen an diese Fähigkeit an.
  </Step>
  <Step title="Anbieterimplementierungen">
    Lassen Sie Anbieter-Plugins Implementierungen registrieren.
  </Step>
</Steps>

Dadurch bleibt die Zuständigkeit explizit, während ein Kernverhalten vermieden wird, das von einem einzelnen Anbieter oder einem einmaligen Plugin-spezifischen Codepfad abhängt.

### Schichtung der Fähigkeiten

Verwenden Sie dieses Denkmodell, wenn Sie entscheiden, wohin Code gehört:

<Tabs>
  <Tab title="Kernschicht für Fähigkeiten">
    Gemeinsame Orchestrierung, Richtlinien, Fallback, Regeln für die Konfigurationszusammenführung, Zustellungssemantik und typisierte Verträge.
  </Tab>
  <Tab title="Anbieter-Plugin-Schicht">
    Anbieterspezifische APIs, Authentifizierung, Modellkataloge, Sprachsynthese, Bildgenerierung, Video-Backends und Nutzungsendpunkte.
  </Tab>
  <Tab title="Kanal-/Funktions-Plugin-Schicht">
    Integration von Discord/Slack/voice-call usw., die Kernfähigkeiten nutzt und sie auf einer Oberfläche bereitstellt.
  </Tab>
</Tabs>

TTS folgt beispielsweise diesem Muster:

- der Kern ist für TTS-Richtlinien zum Antwortzeitpunkt, die Fallback-Reihenfolge, Einstellungen und die Kanalzustellung zuständig
- `elevenlabs`, `google`, `microsoft` und `openai` sind für Syntheseimplementierungen zuständig
- `voice-call` nutzt die TTS-Laufzeithilfe für Telefonie

Dasselbe Muster sollte für zukünftige Fähigkeiten bevorzugt werden.

### Beispiel für ein Unternehmens-Plugin mit mehreren Fähigkeiten

Ein Unternehmens-Plugin sollte von außen zusammenhängend wirken. Wenn OpenClaw gemeinsame Verträge für Modelle, Sprache, Echtzeittranskription, Echtzeit-Sprache, Medienverständnis, Bildgenerierung, Videogenerierung, Webabruf und Websuche bereitstellt, kann ein Anbieter alle seine Oberflächen an einer Stelle verwalten:

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
      // Authentifizierung/Modellkatalog/Laufzeit-Hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // Anbietersprachkonfiguration — die SpeechProviderPlugin-Schnittstelle direkt implementieren
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

Entscheidend sind nicht die exakten Namen der Hilfsfunktionen. Entscheidend ist die Struktur:

- ein Plugin ist für die Anbieteroberfläche zuständig
- der Kern bleibt für die Fähigkeitsverträge zuständig
- Kanäle und Funktions-Plugins nutzen `api.runtime.*`-Hilfen, nicht Anbietercode
- Vertragstests können sicherstellen, dass das Plugin die Fähigkeiten registriert hat, für die es laut eigener Angabe zuständig ist

### Fähigkeitsbeispiel: Videoverständnis

OpenClaw behandelt das Verständnis von Bildern, Audio und Video bereits als eine gemeinsame Fähigkeit. Dafür gilt dasselbe Zuständigkeitsmodell:

<Steps>
  <Step title="Der Kern definiert den Vertrag">
    Der Kern definiert den Vertrag für das Medienverständnis.
  </Step>
  <Step title="Anbieter-Plugins registrieren sich">
    Anbieter-Plugins registrieren je nach Anwendbarkeit `describeImage`, `transcribeAudio` und `describeVideo`.
  </Step>
  <Step title="Nutzer verwenden das gemeinsame Verhalten">
    Kanäle und Funktions-Plugins nutzen das gemeinsame Kernverhalten, statt direkt Anbietercode anzubinden.
  </Step>
</Steps>

Dadurch werden die Videoannahmen eines einzelnen Providers nicht fest in den Kern eingebaut. Das Plugin ist für die Anbieteroberfläche zuständig; der Kern ist für den Fähigkeitsvertrag und das Fallback-Verhalten zuständig.

Die Videogenerierung verwendet bereits dieselbe Abfolge: Der Kern ist für den typisierten Fähigkeitsvertrag und die Laufzeithilfe zuständig, während Anbieter-Plugins entsprechende Implementierungen mit `api.registerVideoGenerationProvider(...)` registrieren.

Benötigen Sie eine konkrete Checkliste für die Einführung? Weitere Informationen finden Sie im [Fähigkeiten-Kochbuch](/de/plugins/adding-capabilities).

## Verträge und Durchsetzung

Die Plugin-API-Oberfläche ist bewusst typisiert und in `OpenClawPluginApi` zentralisiert. Dieser Vertrag definiert die unterstützten Registrierungspunkte und die Laufzeithilfen, auf die sich ein Plugin verlassen darf.

Warum dies wichtig ist:

- Plugin-Autoren erhalten einen einheitlichen, stabilen internen Standard
- der Core kann doppelte Zuständigkeiten ablehnen, etwa wenn zwei Plugins dieselbe Provider-ID registrieren
- beim Start können aussagekräftige Diagnosen für fehlerhafte Registrierungen ausgegeben werden
- Vertragstests können die Zuständigkeit gebündelter Plugins durchsetzen und unbemerkte Abweichungen verhindern

Die Durchsetzung erfolgt auf zwei Ebenen:

<AccordionGroup>
  <Accordion title="Durchsetzung der Laufzeitregistrierung">
    Die Plugin-Registry validiert Registrierungen beim Laden der Plugins. Beispiele: Doppelte Provider-IDs, doppelte Sprach-Provider-IDs und fehlerhafte Registrierungen erzeugen Plugin-Diagnosen statt undefinierten Verhaltens.
  </Accordion>
  <Accordion title="Vertragstests">
    Gebündelte Plugins werden während der Testläufe in Vertrags-Registrys erfasst, damit OpenClaw Zuständigkeiten ausdrücklich überprüfen kann. Derzeit wird dies für Modell-Provider, Sprach-Provider, Websuch-Provider und die Zuständigkeit für gebündelte Registrierungen verwendet.
  </Accordion>
</AccordionGroup>

In der Praxis weiß OpenClaw dadurch von Anfang an, welches Plugin für welche Oberfläche zuständig ist. So können Core und Kanäle nahtlos zusammenwirken, da die Zuständigkeit deklariert, typisiert und testbar ist, statt nur implizit zu bestehen.

### Was in einen Vertrag gehört

<Tabs>
  <Tab title="Gute Verträge">
    - typisiert
    - klein
    - funktionsspezifisch
    - im Besitz des Core
    - von mehreren Plugins wiederverwendbar
    - von Kanälen und Funktionen ohne herstellerspezifisches Wissen nutzbar

  </Tab>
  <Tab title="Schlechte Verträge">
    - im Core verborgene herstellerspezifische Richtlinien
    - einmalige Plugin-Auswege, die die Registry umgehen
    - Kanalcode, der direkt auf eine Herstellerimplementierung zugreift
    - ad hoc erstellte Laufzeitobjekte, die nicht Teil von `OpenClawPluginApi` oder `api.runtime` sind

  </Tab>
</Tabs>

Heben Sie im Zweifelsfall die Abstraktionsebene an: Definieren Sie zuerst die Funktion und lassen Sie Plugins sich anschließend darin einklinken.

## Ausführungsmodell

Native OpenClaw-Plugins werden **prozessintern** zusammen mit dem Gateway ausgeführt. Sie sind nicht sandboxisoliert. Ein geladenes natives Plugin hat dieselbe Vertrauensgrenze auf Prozessebene wie der Core-Code.

<Warning>
Auswirkungen nativer Plugins: Ein Plugin kann Tools, Netzwerk-Handler, Hooks und Dienste registrieren; ein Plugin-Fehler kann das Gateway zum Absturz bringen oder destabilisieren; und ein bösartiges natives Plugin entspricht der Ausführung beliebigen Codes innerhalb des OpenClaw-Prozesses.
</Warning>

Kompatible Bundles sind standardmäßig sicherer, da OpenClaw sie derzeit als Metadaten- beziehungsweise Inhaltspakete behandelt. In aktuellen Releases sind damit hauptsächlich gebündelte Skills gemeint.

Verwenden Sie für nicht gebündelte Plugins Positivlisten und explizite Installations- und Ladepfade. Behandeln Sie Workspace-Plugins als Code für die Entwicklungsphase und nicht als Produktionsstandard.

Verankern Sie bei gebündelten Workspace-Paketnamen die Plugin-ID standardmäßig im npm-Namen `@openclaw/<id>` oder verwenden Sie ein genehmigtes typisiertes Suffix wie `-provider`, `-plugin`, `-speech`, `-sandbox` oder `-media-understanding`, wenn das Paket absichtlich eine enger gefasste Plugin-Rolle bereitstellt.

<Note>
**Vertrauenshinweis:** `plugins.allow` vertraut **Plugin-IDs**, nicht der Herkunft des Quellcodes. Ein Workspace-Plugin mit derselben ID wie ein gebündeltes Plugin überschreibt absichtlich die gebündelte Kopie, wenn dieses Workspace-Plugin aktiviert oder in die Positivliste aufgenommen wurde. Dies ist normal und hilfreich für die lokale Entwicklung, Patch-Tests und Hotfixes. Das Vertrauen in gebündelte Plugins wird anhand des Quellcode-Snapshots bestimmt – des Manifests und des Codes, die zum Ladezeitpunkt auf dem Datenträger vorliegen – und nicht anhand von Installationsmetadaten. Ein beschädigter oder ausgetauschter Installationsdatensatz kann den Vertrauensbereich eines gebündelten Plugins nicht unbemerkt über das hinaus erweitern, was der tatsächliche Quellcode beansprucht.
</Note>

## Exportgrenze

OpenClaw exportiert Funktionen und keine Implementierungsannehmlichkeiten.

Halten Sie die Funktionsregistrierung öffentlich. Reduzieren Sie Exporte von Hilfsfunktionen, die nicht Teil des Vertrags sind:

- für gebündelte Plugins spezifische Hilfsunterpfade
- Unterpfade für Laufzeitinfrastruktur, die nicht als öffentliche API vorgesehen sind
- herstellerspezifische Komfortfunktionen
- Einrichtungs- und Onboarding-Hilfen, die Implementierungsdetails darstellen

Reservierte Hilfsunterpfade für gebündelte Plugins wurden aus der generierten SDK-Exportzuordnung entfernt. Belassen Sie zuständigkeitsspezifische Hilfen im jeweiligen Plugin-Paket; übernehmen Sie nur wiederverwendbares Host-Verhalten in generische SDK-Verträge wie `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` und `plugin-sdk/plugin-config-runtime`.

## Interna und Referenz

Informationen zur Ladepipeline, zum Registry-Modell, zu Laufzeit-Hooks für Provider, zu Gateway-HTTP-Routen, zu Schemas für Nachrichtentools, zur Auflösung von Kanalzielen, zu Provider-Katalogen, zu Plugins für die Kontext-Engine und zur Anleitung zum Hinzufügen einer neuen Funktion finden Sie unter [Interna der Plugin-Architektur](/de/plugins/architecture-internals).

## Verwandte Themen

- [Plugins erstellen](/de/plugins/building-plugins)
- [Plugin-Manifest](/de/plugins/manifest)
- [Einrichtung des Plugin-SDK](/de/plugins/sdk-setup)
