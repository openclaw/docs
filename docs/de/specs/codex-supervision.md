---
read_when:
    - Entwicklung des Verhaltens für Erkennung, Fortsetzung oder Archivierung von Codex-Sitzungen
    - Ändern der nativen Sitzungskatalog-Benutzeroberfläche oder der Gateway-RPCs
    - Codex-Überwachung auf gekoppelte Nodes erweitern
summary: Architektur und Produktgrenze für die Überwachung nativer Codex-Sitzungen über OpenClaw.
title: Codex-Überwachung
x-i18n:
    generated_at: "2026-07-24T04:57:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5e259badc8f7fdec6fa093785a1dd04394e12287ae61f00474bcd45e7b95352d
    source_path: specs/codex-supervision.md
    workflow: 16
---

# Codex-Überwachung

## Ziel

Die Codex-Überwachung ermöglicht es einem OpenClaw-Operator, native Codex-Sitzungen zu erkennen und,
sofern dies sicher ist, über die normale OpenClaw-Chat-Oberfläche einen lokalen Branch zu erstellen.
Codex App Server bleibt Eigentümer des Threads und des Modell-Loops. OpenClaw stellt den
Flottenkatalog, die authentifizierte Operator-Benutzeroberfläche, die Sitzungsbindung und die Kanalauslieferung bereit.

Die Funktion gehört zum offiziellen `codex` Plugin. Es gibt kein separates
Supervisor-Plugin und keine zweite Implementierung des Codex-Protokolls.

## Produktgrenze

Der Katalog wird registriert, sobald das Codex-Plugin aktiv ist, sofern die Erkennung nativer Sitzungen
nicht ausdrücklich mit folgender Einstellung deaktiviert wurde:

```text
plugins.entries.codex.config.sessionCatalog.enabled = false
```

Aktivieren Sie die Überwachungswerkzeuge für Agenten mit:

```text
plugins.entries.codex.config.supervision.enabled = true
```

Das derzeit aktive Ausgangsprodukt ist bewusst kleiner als der langfristige
Flottenplan:

- Nur nicht archivierte Codex-Threads auflisten.
- Lokale Zeilen und Zeilen angemeldeter gekoppelter Nodes nach stabiler Hostidentität gruppieren.
- Aus einem gespeicherten oder inaktiven Gateway-lokalen
  Thread einen normalen, modellgebundenen Chat-Branch erstellen, dessen vollständigen Codex-Harness-Thread beim ersten Turn starten oder den für einen früheren Branch
  erstellten Chat öffnen.
- Einen gespeicherten oder inaktiven Gateway-lokalen Thread erst nach ausdrücklicher
  Bestätigung archivieren, dass kein anderer Runner vorhanden ist.
- Aktive lokale Quellen ohne Steuerelemente für neue Branches oder die Archivierung anzeigen und dabei weiterhin
  das Öffnen eines bestehenden überwachten Chats ermöglichen.
- Die neuesten Zeilen pro Host in der Hauptseitenleiste anzeigen, den vollständigen Katalog auf
  der Sitzungsseite beibehalten und begrenzte, cursorpaginierte Transkriptabrufe für
  lokale Zeilen und Zeilen gekoppelter Nodes bereitstellen.
- Katalogfehler nach Host isolieren.

Der Katalog ist die nicht archivierte Sammlung. Eine darin enthaltene Zeile kann dennoch den
Turn-Status inaktiv, aktiv, `notLoaded` oder Fehler haben.

Die agentenseitige Überwachung bleibt eine Opt-in-Funktion. Das geführte Onboarding versucht, sie zu installieren und zu aktivieren,
nachdem die Erkennung einer nativen Codex-Installation erfolgreich war und das ausgewählte Inferenz-Backend
seine Live-Prüfung bestanden hat, unabhängig davon, welches primäre Backend der Benutzer
auswählt. Die Überwachung wird nur aktiviert, wenn diese opportunistische Plugin-Einrichtung
erfolgreich ist. Ein ausdrücklich deaktiviertes Plugin, eine Richtlinienblockierung oder
`supervision.enabled: false` bleibt für Überwachungswerkzeuge maßgeblich, deaktiviert
jedoch nicht den Operator-Sitzungskatalog. `sessionCatalog.enabled: false`
deaktiviert die Operator-Erkennung und die Katalogbefehle für gekoppelte Nodes; der Codex-
Provider und der Harness bleiben aktiv.

## Zuständigkeit

Das `codex` Plugin ist für das gesamte Verhalten von Codex App Server zuständig:

- Endpunkterkennung und Verbindungslebenszyklus
- Protokollinitialisierung und Versionsprüfungen
- Auflisten, Lesen, Fortsetzen und Archivieren von Threads sowie Ereignisverarbeitung
- Bridges für Genehmigungen und Benutzereingaben
- Bindungen nativer Threads an OpenClaw-Sitzungen
- Durchsetzung ausschließlich für Codex vorgesehener Modelle und Harnesses nach der Fortsetzung

Die Control UI und das Gateway verwenden diesen Plugin-eigenen Dienst. Sie lesen
Codex-Rollout-Dateien nicht direkt und implementieren keinen weiteren App-Server-Client.

Die lokale Standardtopologie lautet:

```text
Codex Desktop -> privater stdio-App-Server -> Codex-Benutzer-Home
                                             ^
OpenClaw-Codex-Plugin -> Überwachungsverbindung zum App-Server
  (standardmäßig verwaltetes stdio im Benutzer-Home; explizite appServer-Einstellungen werden berücksichtigt)
  -> passiver Quellkatalog und Lesezugriff
  -> Snapshot-Anheftung -> kanonischer Branch aus der appServer-Quelle
  -> Einfügen des sichtbaren Verlaufs und jeder spätere überwachte Chat-Turn

Gewöhnliche OpenClaw-Codex-Sitzungen -> standardmäßig verwaltetes stdio im Agenten-Home
  -> gewöhnliche vollständige Harness-Threads -> OpenClaw-Chat und Kanalauslieferung
```

Das Aktivieren der Überwachung ändert den gewöhnlichen Codex-Harness nicht: Er bleibt
standardmäßig agentenspezifisch. Die separate Überwachungsverbindung verwendet standardmäßig
verwaltetes stdio im Benutzer-Home, sodass ihre Katalog- und Snapshot-Vorgänge native
gespeicherte Threads sehen. Explizite `appServer` Verbindungseinstellungen werden berücksichtigt. Wenn
`homeScope` nicht gesetzt ist, löst die Überwachungsverbindung dies für stdio
oder Unix in `"user"` und für WebSocket in `"agent"` auf. Setzen Sie `appServer.homeScope: "user"`
nur dann ausdrücklich, wenn auch der gewöhnliche Harness das native Codex-
Home gemeinsam verwenden soll. Ein aus der Codex-Seitenleistengruppe übernommener Chat ist die Ausnahme: Seine private
Überwachungsbindung belässt Quellabrufe, die Erstellung des kanonischen Branches und spätere
Turns auf der Überwachungsverbindung. Live-Status und Zuständigkeit bleiben
prozesslokal; ein Thread, der dem Überwachungsprozess von OpenClaw unbekannt ist, ist `notLoaded`,
selbst wenn Codex Desktop ihn aktiv ausführt.

Codex verfügt über einen experimentellen kanonischen lokalen Daemon mit einem separaten,
vom Installationsprogramm verwalteten Bootstrap-Vertrag. Diese Funktion darf diesen Daemon nicht implizit bootstrappen, beanspruchen
oder voraussetzen.

## Katalogablauf

Die generische Gateway-Methode `sessions.catalog.list` leitet an den Katalog-Provider `codex`
weiter, der stets `archived: false` anfordert und App Server dessen Standard für interaktive Quellen
anwenden lässt: `cli`, `vscode`, Atlas und ChatGPT. Sie
kombiniert:

1. Gateway-lokale `thread/list`-Ergebnisse vom Überwachungs-App-Server,
   der standardmäßig verwaltetes stdio im Benutzer-Home verwendet.
2. `codex.appServer.threads.list.v1`-Ergebnisse von jedem verbundenen, angemeldeten Node.

Die Transkriptauswahl verwendet lokal `thread/turns/list` mit `itemsView: "full"` oder
den versionierten Befehl `codex.appServer.thread.turns.list.v1` auf dem ausgewählten
Node. Jede Antwort enthält höchstens 20 persistierte Turns sowie opake
Vorwärts-/Rückwärts-Cursor. Die Control UI fordert die Seiten mit den neuesten Einträgen zuerst an, stellt jede Seite in
chronologischer Reihenfolge dar und stellt ältere Seiten voran. Sie greift niemals auf ein
unbegrenztes `thread/read` zurück. OpenClaw weist außerdem jede serialisierte Elementseite über
20 MiB zurück, bevor sie den Node- oder Gateway-Transport durchlaufen kann.

Die native Implementierung für gekoppelte macOS-Nodes unterstützt nur einen nicht gesetzten/standardmäßigen oder
expliziten `appServer.transport: "stdio"` mit nicht gesetztem/standardmäßigem Überwachungsbereich oder
explizitem `appServer.homeScope: "user"`. Sie überträgt konfigurierte `command`, `args`
und normalisierte `clearEnv` in den Kindprozess. Bei `"unix"`, `"websocket"`
oder explizitem `homeScope: "agent"` kündigt sie weder die Katalogfunktion
noch den Befehl an; auch der direkte Aufruf schlägt sicher geschlossen fehl. Sie darf niemals das Codex-
Benutzer-Home für eine agentenspezifische Konfiguration offenlegen oder lokales stdio anstelle eines
expliziten Endpunkts verwenden.

Die Katalogprojektion normalisiert Bezeichner, Titel, cwd, Status, aktive Warte-
Flags, Zeitstempel, Quelle, Modell-Provider, Codex-Version und Git-Branch. Sie
gibt keine Transkriptvorschauen, Turns, Rollout-Pfade, Codex-Home-Pfade,
Git-Remotes, Commit-SHAs, rohen Endpunkte oder rohen App-Server-Fehler zurück. Transkriptantworten
enthalten nur die ausdrücklich angeforderte App-Server-Elementseite und ihre
opaken Cursor.

Hostfehler bleiben auf das jeweilige Hostergebnis beschränkt. Ein offline befindlicher Node oder ein nicht verfügbarer
lokaler App Server entfernt keine funktionierenden Hosts von der Seite. Konnektivität ist eine
Hosteigenschaft und kein Thread-Status: Ein fehlgeschlagenes Hostergebnis enthält keine aktuellen
Sitzungszeilen und projiziert `offline` nicht auf native Threads.

Die Control UI fordert progressive Katalogaktualisierungen an. Jeder lokale oder gekoppelte Host
erscheint, sobald seine eigene App-Server-Auflistung abgeschlossen ist; die aggregierte Antwort bleibt
der Kompatibilitäts- und Wiederherstellungs-Snapshot. Die sichtbare Seite wird nach
Konnektivitätsänderungen, beim Fokussieren und spätestens alle 30 Sekunden abgeglichen, mit einem schnelleren Durchlauf
nach Änderungen. Native Codex-Sitzungen, die in einem anderen Client erstellt wurden, werden daher
letztlich erkannt, ohne sie in den OpenClaw-Speicher zu importieren.

Die Katalogerkennung ist passiv. Beim Auflisten oder Lesen von Metadaten darf weder
`thread/resume` aufgerufen noch der OpenClaw-Client für Live-Thread-Anfragen registriert oder
eine Genehmigung beantwortet werden.

Die Suche erfolgt ausschließlich im Titel und unterscheidet nicht zwischen Groß- und Kleinschreibung. Für jede zurückgegebene Katalogseite durchsuchen
das Gateway und der gekoppelte Mac eine begrenzte Anzahl nativer Seiten, ohne
die Abfrage an App Server weiterzugeben, da die native Suche auch Transkriptvorschauen
finden kann. Mit dem zurückgegebenen nativen Cursor können Aufrufer die Suche fortsetzen.

## Grenze der Operator-CLI

Das Plugin registriert drei Gateway-gestützte Shell-Befehle:

```text
openclaw codex sessions [--search <text>] [--host <id>] [--limit <count>] [--cursor <cursor>] [--json] [gateway-options]
openclaw codex continue <thread-id> [--json] [gateway-options]
openclaw codex archive <thread-id> --confirm-no-other-runner [--json] [gateway-options]
```

`[gateway-options]` ist `--url <url>`, `--token <token>`, `--timeout <ms>` und
der geerbte Schalter `--expect-final`. Für die Sitzungsauflistung gilt standardmäßig ein Zeitlimit von 75,000 ms;
für Fortsetzung und Archivierung standardmäßig 30,000 ms;
`--expect-final` hat für diese unären RPCs keine zusätzliche Wirkung. Die Sitzungssuche
erfolgt ausschließlich im Titel und unterscheidet nicht zwischen Groß- und Kleinschreibung; jede Antwort durchsucht eine begrenzte native Seitenkette,
und `--cursor` setzt ältere Ergebnisse fort. Das Limit beträgt standardmäßig 50 pro Host
und akzeptiert Werte von 1 bis 100; ein Cursor erfordert ein stabiles `--host`-
Ziel. Kein Befehl akzeptiert eine Option für archivierte/einzuschließende archivierte Sitzungen. Nur `sessions` kann gekoppelte Hosts ansprechen;
`continue` und `archive` senden immer `hostId: "gateway:local"`, und die Archivierung
erfordert das explizite Bestätigungs-Flag.

Der Shell-Namensraum ist nicht der In-Chat-Laufzeitnamensraum `/codex`. Insbesondere
listet `/codex sessions --host <node>` Codex-CLI-Sitzungsdateien auf einem
Node auf, `/codex threads` listet App-Server-Threads für die aktuelle Gesprächsverbindung auf,
und `/codex resume` oder `/codex bind` verändert die Bindung dieses Gesprächs.
Diese Befehle ersetzen `sessions.catalog.continue` nicht, und es gibt
keinen Laufzeitbefehl `/codex continue` oder `/codex archive`.

## Lokale Fortsetzung

Für eine gespeicherte oder inaktive Gateway-lokale Zeile ruft die Benutzeroberfläche
`sessions.catalog.continue` mit `catalogId: "codex"` sowie den Host- und Thread-
IDs auf. Das Plugin:

1. Verwendet den bestehenden überwachten Chat erneut, wenn die Quelle bereits einen besitzt.
2. Andernfalls projiziert es den begrenzten Benutzer- und Assistentenverlauf bis einschließlich des letzten
   terminalen persistierten Turns der Quelle (abgeschlossen, unterbrochen oder fehlgeschlagen) in einen neuen
   OpenClaw-Chat und zeichnet einen ausstehenden Harness-Branch auf.
3. Speichert die ausstehende, ausschließlich für Codex geltende Modellbindung, nicht eine konkrete Modell- oder
   Provider-Auswahl, zusammen mit dem privaten Überwachungsverbindungsbereich und
   gibt den OpenClaw-`sessionKey` zurück.

Die Verlaufsprojektion wählt den neuesten Abschnitt sichtbarer Benutzer- und Assistenten-
Nachrichten mit festen Grenzwerten von 200 Nachrichten, insgesamt 512 KiB UTF-8-Text und
64 KiB pro Nachricht aus. Sie ersetzt Bild- und lokale Bildeingaben durch
`[Image attachment]`, kopiert niemals Bildnutzdaten oder -pfade und lässt Schlussfolgerungen,
Werkzeugaufrufe und Werkzeugergebnisse aus.

Die Benutzeroberfläche navigiert mit diesem Sitzungsschlüssel zum normalen Chat. Es ist noch kein kanonischer Harness-
Thread vorhanden. Beim ersten normalen Chat-Turn installiert der Harness die tatsächlichen
Codex-Handler für Genehmigung, Ermittlung, Ereignisse und Auslieferung und führt dann Folgendes aus:

1. Verwendet die Überwachungsverbindung, um das native `thread/fork` ohne Modell-
   oder Provider-Überschreibung aufzurufen und den persistierten Quell-Snapshot anzuheften. Der aktuelle
   Zustand `ConfigManager` von Codex wählt Modell und Provider aus, und die Fork-Antwort
   meldet das tatsächliche Paar. Wenn sich das Modell von dem zuletzt in der Quelle erfassten Modell
   unterscheidet, gibt Codex seine normale Warnung wegen eines Modellunterschieds aus.
2. Startet auf derselben Verbindung den kanonischen vollständigen Codex-Harness-Thread mit
   `threadSource: "appServer"`, dem cwd von OpenClaw, Richtlinie, Konfiguration, Umgebung, der
   vollständigen OpenClaw-Harness-Werkzeugoberfläche und genau dem vom Fork
   für diesen ersten Start zurückgegebenen Modell und Provider.
3. Fügt den begrenzten sichtbaren Benutzer- und Assistentenverlauf über diese
   Verbindung ein, schreibt die kanonische Bindung fest, ohne ihren Überwachungsbereich zu verwerfen,
   führt den Turn aus und archiviert den temporären Fork.

Vor dem ersten Turn ist der Chat ein gesperrter, ausstehender Branch mit einer sichtbaren
Verlaufsspiegelung; danach wird jeder Modell-Turn über den kanonischen Codex-
Harness-Thread auf der Supervision-Verbindung ausgeführt. Der Branch ist kein vollständiger nativer
Rollout-Klon: Quell-Reasoning, Tool-Aufrufe und Tool-Ergebnisse werden bewusst
ausgelassen. Wenn das Fixieren des Snapshots oder das Erstellen des kanonischen Threads fehlschlägt, bleibt der ausstehende
Branch erneut ausführbar. Ein Binding-Wettlauf, deaktivierte Supervision oder eine nicht verfügbare
beziehungsweise nicht übereinstimmende Supervision-Verbindung führt vor der Ausführung des Turns zu einem geschlossenen Fehlerzustand,
statt auf den gewöhnlichen Harness im Agent-Home zurückzufallen.

Dies garantiert eine Codex-eigene Auswahl, nicht die Beibehaltung des historischen
Modells der Quelle. Das vom Fork zurückgegebene Paar wird zum Starten des kanonischen Threads
verwendet, und Codex speichert das native Modell und den Provider dieses Threads dauerhaft. Bei späteren Wiederaufnahmen
werden Modell- und Provider-Overrides von OpenClaw ausgelassen, sodass Codex das gespeicherte Paar wiederherstellt.
Wenn eine separate native Codex-Steuerung den kanonischen Thread ändert, akzeptiert OpenClaw
diese nativ gespeicherte Auswahl. Das äußere OpenClaw-Modell und die Fallback-Kette
ersetzen sie niemals.

Modelländerungen, das Löschen von Sitzungen sowie das Zurücksetzen beziehungsweise Neuerstellen von Sitzungen führen
für den überwachten, modellgesperrten Chat zu einem geschlossenen Fehlerzustand. Das Ändern von `/codex model <model>`, `/codex
bind`, `/codex resume` (einschließlich Node `--bind here`) und `/codex detach` oder
`/codex unbind` führt ebenfalls zu einem geschlossenen Fehlerzustand, da dadurch das Binding ersetzt oder gelöscht wird. Die
Abfrage `/codex model` sowie `/codex fast`, `/codex permissions` und `/codex
threads` bleiben verfügbar. Das Agent-Tool `codex_threads` kann keinen neuen
Fork anhängen oder den gebundenen nativen Thread archivieren. Listen- und reine Metadaten-Lesevorgänge bleiben
verfügbar; Transkriptfelder erfordern `supervision.allowRawTranscripts`, während
Umbenennen, Wiederherstellen aus dem Archiv, ein losgelöster Fork und das Archivieren eines nicht zugehörigen Threads
`supervision.allowWriteControls` erfordern. Keine der beiden Optionen kann das gesperrte Binding ersetzen.
Das Löschen oder Zurücksetzen des OpenClaw-Eintrags würde andernfalls das native
Binding verwerfen und hinter einer wie Codex aussehenden Sitzung einen generischen Thread erstellen oder ermöglichen.
Die Aufbewahrungswartung erhält daher modellgesperrte Einträge selbst dann, wenn sie
die üblichen Grenzwerte für Alter, Anzahl oder Speicherplatzbudget überschreiten. Auch beim Deaktivieren oder Deinstallieren des
besitzenden Plugins bleiben die Sperre und die Markierung der Plugin-Zuständigkeit erhalten. Der Chat bleibt
nicht verfügbar und im geschlossenen Fehlerzustand, bis dasselbe Plugin wieder aktiviert wird; die Bereinigung
wandelt ihn niemals in eine gewöhnliche Modellsitzung um.

Die Quelle wird durch diese Aktion niemals wiederaufgenommen oder verändert. Der temporäre Fork fixiert einen
Snapshot; er ist nicht der dauerhafte Fortsetzungs-Thread. Das Starten eines separaten
kanonischen Harness-Threads beim ersten Turn verhindert, dass OpenClaw zu einem
konkurrierenden Schreiber der Quelle wird, nur weil der prozesslokale Status einen
von Desktop verwalteten Turn nicht erkannt hat. Die sichtbare Verlaufsspiegelung und der fixierte Snapshot können Arbeit
auslassen, die in einer aktiven Quelle noch nicht abgeschlossen ist. Die ursprüngliche CLI-, VS Code-,
Atlas- oder ChatGPT-Quelle bleibt sowohl für native als auch für OpenClaw-Kataloge geeignet.
Der kanonische Branch bleibt ein nativer Codex-Thread im Supervision-Speicher,
native Clients können jedoch seine Quellart `appServer` herausfiltern, sodass die Sichtbarkeit in Codex Desktop
kein vertraglich zugesichertes Verhalten ist.

## Archivierungsverhalten

Für eine gespeicherte oder inaktive Gateway-lokale Zeile erfordert `sessions.catalog.archive` mit
`catalogId: "codex"`
eine ausdrückliche Angabe von `confirmNoOtherRunner: true`, liest den aktuellen prozesslokalen
Status erneut und fährt nur bei `idle` oder `notLoaded` fort, ruft das native `thread/archive` auf
und meldet erst dann Erfolg, wenn Codex den Vorgang akzeptiert hat. Die Zeile verlässt anschließend
den nicht archivierten Katalog.

Ein aktiver oder fehlerhafter Status aus dem erneuten Lesevorgang weist die Archivierung zurück. Dasselbe gilt für einen
initialisierenden oder ausstehenden überwachten Branch aus der Quelle: Der erste Chat-Turn
muss seinen kanonischen Branch materialisieren, bevor die Quelle archiviert werden kann. Ein
bekannter aktiver Besitzer eines OpenClaw-Bindings für das exakte Ziel oder ein nicht archivierter
erzeugter Nachkomme weist die Archivierung ebenfalls zurück. OpenClaw paginiert Codex' experimentelle
Relation `thread/list ancestorThreadId` und geht bei Anfrage- oder Antwortfehlern,
Cursor- oder Thread-Zyklen sowie beim Ausschöpfen von Sicherheitsgrenzen in einen geschlossenen Fehlerzustand über. Die native Archivierung kann
geladene übergeordnete Arbeit und Nachkommenarbeit beenden, daher ist die Archivierung keine Abkürzung
für eine Unterbrechung. Die Lese-, Nachkommen-Aufzählungs- und Archivierungsaufrufe sind nicht atomar.
Ein unabhängiger Client kann weiterhin Arbeit an einer Zeile besitzen oder starten, die lokal als inaktiv oder
`notLoaded` erscheint. Die Bestätigung, dass kein anderer Runner vorhanden ist, deckt unbekannte Clients und
diesen Wettlauf ab, bis Codex eine bedingte Archivierung oder eine prozessübergreifende Lease bereitstellt.
Die Archivierung über gekoppelte Nodes ist verboten.

Im Codex-Katalog gibt es keine Ansicht für archivierte Elemente. Ein Thread, der mit
`thread/unarchive` in einer anderen vom Besitzer autorisierten Codex-Oberfläche wiederhergestellt wurde, kommt
wieder für den nicht archivierten Katalog infrage.

## Sicherheit aktiver Threads

Codex serialisiert Änderungen an einem Thread unter den Clients eines App Servers, stellt jedoch
keine exklusive prozessübergreifende Runner- oder Genehmigungsbesitzer-Lease bereit.
Unabhängige stdio-App-Server können demselben Rollout Daten hinzufügen, während jeder
nur seinen eigenen In-Memory-Status sieht. Genehmigungsanfragen können zudem jeden Abonnenten
eines Servers erreichen, wobei die erste gültige Antwort die Anfrage abschließt.

Daher gilt:

- Passive Katalog-Clients abonnieren Genehmigungen nicht und lehnen sie nicht automatisch ab
- Für Zeilen, die derzeit als aktiv gemeldet werden, werden weder ein neuer Branch noch Archive angeboten
- Eine nicht zugeordnete Quelle wird zu einem Branch mit sichtbarem Verlauf, dessen kanonischer Harness-
  Thread die Quelle niemals wiederaufnimmt
- `notLoaded` wird als unbekannte Aktivität angezeigt und kann erst nach einer
  informierten Bestätigung, dass kein anderer Runner vorhanden ist, archiviert werden
- Eine lokale Archivierung erfordert diese Bestätigung sowie einen erneuten Lesevorgang von `idle` oder `notLoaded`,
  wobei der Protokoll-Wettlauf zwischen Lesen und Archivieren anerkannt wird

Unterbrechung und Übergabe zwischen mehreren Clients sind zukünftige Produktentscheidungen. Sie werden nicht
dadurch impliziert, dass eine aktive Zeile angezeigt wird.

## Grenze gekoppelter Nodes

Node Invoke unterstützt derzeit nur Anfrage/Antwort. Es kann sicher begrenzte
Katalogmetadaten und Seiten mit Transkript-Turns zurückgeben, aber nicht den langlebigen Ereignisstrom, Genehmigungs-
anfragen, Tool-Aufrufe, Abbrüche und Assistenten-Deltas übertragen, die für einen Codex-
Harness-Lauf erforderlich sind.

Der Node-Vertrag unterstützt daher Listen und Seiten mit Transkript-Turns. Entfernte
Zeilen bleiben lesbar, aber **Fortsetzen** und **Archivieren** sind unabhängig vom Inaktivitätsstatus nicht verfügbar. Eine
echte entfernte Fortsetzung erfordert einen Node-seitigen Runner und eine Streaming-Bridge, die
dieselben Genehmigungs- und Binding-Invarianten wie der lokale Harness wahrt.

## Berechtigungen

Jeder Computer stimmt lokal zu. Das Aktivieren des Gateways autorisiert keinen anderen
Node, seine Codex-Metadaten zu lesen. Die Node-Fähigkeit muss die normale Kopplung
und Genehmigung gemäß Befehlsrichtlinie durchlaufen.

Flottenauflistung und Transkriptanzeige verwenden den Gateway-Bereich `operator.write`,
da sie gekoppelte Nodes aufrufen. Lokale Fortsetzung und Archivierung sind
authentifizierte Operatoraktionen und unterliegen weiterhin Host- und Statusprüfungen.

Der Zugriff autonomer Agenten und eigenständiger MCPs ist davon getrennt. Die ausgelieferten
Tool-Verträge `codex_endpoint_probe`, `codex_sessions_list`, `codex_session_read`,
`codex_session_send` und `codex_session_interrupt` bleiben im Besitz
des Plugins `codex`. Bei aktivierter Supervision erfordern rohe Transkript-
Lesevorgänge über `codex_threads` und aus Transkripten abgeleitete Listenfelder ebenfalls
`supervision.allowRawTranscripts`; jeder `codex_threads`-Fork sowie jedes Umbenennen, Archivieren
oder Wiederherstellen aus dem Archiv erfordert `supervision.allowWriteControls`. Beide Richtlinien sind standardmäßig
deaktiviert.

## Kompatibilität

`openclaw doctor --fix` migriert die ausgelieferte Konfiguration `plugins.entries.codex-supervisor`,
einschließlich Endpunkten und Transkript-/Schreibrichtlinien, sowie Plugin-
Zulassungs-/Ablehnungsreferenzen nach
`plugins.entries.codex.config.supervision`. Explizite kanonische Zielwerte
haben bei Konflikten Vorrang. Laufzeitcode verwendet nach der Migration nur die kanonische Form des Plugins
`codex`.

Das offizielle Plugin behält exakt fünf Supervisor-Kompatibilitätstools:
`codex_endpoint_probe`, `codex_sessions_list`, `codex_session_read`,
`codex_session_send` und `codex_session_interrupt`. Die Sitzungsliste enthält standardmäßig nur geladene
Sitzungen; es gibt keinen Parameter `loaded_only`. `include_stored: true` fügt
nicht archivierte Zeilen der Zustandsdatenbank hinzu, pro Endpunkt begrenzt durch `max_stored_sessions`
(Standardwert 200, zulässiger Bereich 1 bis 1.000); geladene Zeilen werden durch diese
Einstellung nicht begrenzt. Aus Transkripten abgeleitete Felder und Lesevorgänge bleiben durch
`allowRawTranscripts` beschränkt; Senden und Unterbrechen bleiben durch `allowWriteControls` beschränkt.

Kompatibilitätssenden startet einen inaktiven Thread niemals und nimmt ihn auch nicht wieder auf. `mode: "start"` wird
immer abgelehnt; `"auto"` und `"steer"` steuern nur einen lesbaren aktiven Turn.
Auch eine Unterbrechung erfordert einen aktiven lesbaren Turn. Die Fortsetzung eines inaktiven Threads wird
an den nativen Codex-Katalog weitergeleitet, sodass der vollständige Harness Genehmigungen, Tools und das Binding verwaltet.
Der eigenständige Legacy-MCP-Adapter löst dieselben Tools aus dem offiziellen
Plugin auf und ist der einzige Pfad, der die beibehaltenen Legacy-Richtlinien-Umgebungsvariablen
berücksichtigt.

Die Katalog-UI vom Juli, die Gateway-Methode, die Node-Fähigkeit und die CLI-Registrierung waren
unter der alten Plugin-ID nicht ausgeliefert worden. Sie wechseln direkt in die Zuständigkeit von `codex`,
ohne eine zweite Laufzeitfassade.

## Zukünftige Arbeiten

- Node-seitiger Streaming-Runner und Ereignis-Bridge für entfernte Fortsetzung
- Explizite Runner- und Genehmigungsbesitzer-Leases für die gleichzeitige Client-Übergabe
- Entfernte Archivierung, sobald eine Runner-Besitz-Lease oder eine gleichwertige Abgrenzung vorhanden ist
- Unterbrechung und umfassendere Beobachtung aktiver Sitzungen
- Auditierte Übergabe zwischen Codex Desktop, CLI und OpenClaw

Das Durchsuchen archivierter Elemente ist nicht Bestandteil der geplanten Supervision-Seitenleiste. Native Codex-
Oberflächen bleiben der Wiederherstellungspfad für archivierte Threads.

## Akzeptanztests

- Durch Aktivieren der Überwachung werden nicht archivierte lokale Sitzungen aufgelistet.
- Archivierte Sitzungen erscheinen weder in der Katalogantwort noch in der Benutzeroberfläche.
- Funktionsfähige Hosts bleiben sichtbar, wenn ein anderer Host ausfällt; ein nicht verfügbarer Host
  gibt keine aktuellen Zeilen zurück, statt einen Offline-Sitzungsstatus zu erfinden.
- Eine gespeicherte oder inaktive lokale Zeile erstellt eine Chat-Spiegelung mit einer ausschließlich
  für Codex geltenden Modell-/Runtime-Sperre; der erste Dialogschritt fixiert einen temporären Snapshot und startet den
  kanonischen vollständigen Harness-Thread, und ein erneutes Ausführen von Continue öffnet den vorhandenen Chat.
- Beim ersten Dialogschritt werden Modell-/Provider-Überschreibungen im Snapshot-Fork ausgelassen und
  der kanonische Start auf genau das von Codex zurückgegebene Paar fixiert, selbst wenn Codex warnt,
  dass sich sein aktuelles Modell vom zuletzt aufgezeichneten Modell der Quelle unterscheidet.
- Ausstehende und bestätigte überwachte Bindungen verwenden die Überwachungsverbindung für den
  Quellzugriff, die Erstellung des kanonischen Branches und jeden späteren Dialogschritt; gewöhnliche
  Codex-Sitzungen bleiben auf den Agenten beschränkt.
- Bei späteren Fortsetzungen werden OpenClaw-Modell-/Provider-Überschreibungen ausgelassen, die
  kanonische persistierte Auswahl von Codex beibehalten, separate native Änderungen an diesem Thread akzeptiert
  und niemals das äußere OpenClaw-Modell oder die Fallback-Kette eingesetzt.
- Das Deaktivieren der Überwachung oder der Verlust des Bindungs-/Verbindungslebenszyklus führt zu einem
  geschlossenen Fehlerzustand, statt den Chat in den gewöhnlichen Agent-Home-Harness zu verschieben.
- Ein überwachter, modellgesperrter Chat kann nicht gelöscht werden, solange er die native
  Bindung schützt.
- Der Chat spiegelt höchstens 200 Benutzer- und Assistentennachrichten, insgesamt 512 KiB und
  64 KiB pro Nachricht. Bilder werden zu Platzhaltern; Reasoning der Quelle, Tool-Aufrufe,
  Tool-Ergebnisse, Bildnutzdaten und lokale Pfade werden nicht geklont.
- Der Branch-Ablauf setzt den Quell-Thread niemals fort.
- Die ursprüngliche Quelle bleibt für beide Kataloge verfügbar. Der kanonische native
  Branch verwendet den Quelltyp `appServer` und erscheint nicht garantiert in
  Codex Desktop.
- Aktive lokale Quellen können weder einen Branch erstellen noch archiviert werden; ein vorhandener
  überwachter Chat kann weiterhin geöffnet werden.
- Zeilen mit unbekannter Aktivität können ohne Bestätigung einen Branch erstellen; die Archivierung erfordert
  eine ausdrückliche Bestätigung, dass kein anderer Runner aktiv ist.
- Eine Quelle mit einem initialisierenden oder ausstehenden überwachten Branch kann nicht archiviert werden,
  bis der erste Chat-Dialogschritt den kanonischen Branch materialisiert.
- Ein bekannter aktiver Bindungseigentümer für das genaue Ziel oder einen nicht archivierten erzeugten
  Nachfahren blockiert die Archivierung; Fehler bei der Aufzählung von Nachfahren führen zu einem geschlossenen Fehlerzustand, und
  die ausdrückliche Bestätigung bleibt für unbekannte Clients und den Wettlauf zwischen
  Statusprüfung und Archivierung verantwortlich.
- Die bestätigte lokale Archivierung einer gespeicherten oder inaktiven Sitzung entfernt die Zeile nach nativem Erfolg.
- Zeilen gekoppelter Nodes bleiben ohne Continue oder Archive sichtbar.
- Die passive Auflistung abonniert oder beantwortet niemals Thread-Genehmigungen.
- Die veraltete Supervisor-Konfiguration wird in die kanonische Codex-Konfigurationsform migriert.
- Die veraltete Liste wird standardmäßig nur geladen, die Aufzählung gespeicherter Elemente hält ihre Obergrenze
  pro Endpunkt ein, und der Kompatibilitätsversand startet oder setzt niemals einen inaktiven Thread fort.
