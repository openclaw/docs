---
read_when:
    - Entwicklung des Verhaltens für Erkennung, Fortsetzung oder Archivierung von Codex-Sitzungen
    - Ändern der nativen Sitzungskatalog-Benutzeroberfläche oder der Gateway-RPCs
    - Codex-Überwachung auf gekoppelte Nodes erweitern
summary: Architektur und Produktgrenze für die Überwachung nativer Codex-Sitzungen über OpenClaw.
title: Codex-Überwachung
x-i18n:
    generated_at: "2026-07-12T15:53:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 78528afd31c18fc84e0adb6479a688da7df6d0a5c04e539d253c84d3a17a5f53
    source_path: specs/codex-supervision.md
    workflow: 16
---

# Codex-Aufsicht

## Ziel

Die Codex-Aufsicht ermöglicht es einem OpenClaw-Betreiber, native Codex-Sitzungen zu erkennen und, sofern dies sicher ist, über die normale OpenClaw-Chat-Oberfläche einen lokalen Branch zu erstellen.
Codex App Server bleibt Eigentümer des Threads und des Modell-Loops. OpenClaw stellt den
Flottenkatalog, die authentifizierte Bedienoberfläche, die Sitzungsbindung und die Kanalauslieferung bereit.

Die Funktion gehört zum offiziellen `codex`-Plugin. Es gibt weder ein separates
Supervisor-Plugin noch eine zweite Implementierung des Codex-Protokolls.

## Produktgrenze

Der Katalog wird registriert, sobald das Codex-Plugin aktiv ist. Aktivieren Sie die
agentenseitigen Aufsichtstools mit:

```text
plugins.entries.codex.config.supervision.enabled = true
```

Das derzeit aktive Anfangsprodukt ist bewusst kleiner als der langfristige
Flottenplan:

- Nur nicht archivierte Codex-Threads auflisten.
- Lokale Zeilen und Zeilen von ausdrücklich einbezogenen gekoppelten Nodes nach stabiler Hostidentität gruppieren.
- Aus einem gespeicherten oder inaktiven Gateway-lokalen Thread einen normalen, modellgebundenen Chat-Branch erstellen, dessen vollständigen Codex-Harness-Thread beim ersten Durchlauf starten oder den für einen früheren Branch erstellten Chat öffnen.
- Einen gespeicherten oder inaktiven Gateway-lokalen Thread erst archivieren, nachdem ausdrücklich bestätigt wurde, dass kein anderer Runner vorhanden ist.
- Aktive lokale Quellen ohne Steuerelemente für neue Branches oder die Archivierung anzeigen und zugleich weiterhin das Öffnen eines vorhandenen beaufsichtigten Chats ermöglichen.
- Die neuesten Zeilen pro Host in der Hauptseitenleiste anzeigen, den vollständigen Katalog auf der Sitzungsseite bereithalten und begrenzte, Cursor-paginierte Transkriptabrufe für lokale Zeilen und Zeilen gekoppelter Nodes bereitstellen.
- Katalogfehler nach Host isolieren.

Der Katalog ist die nicht archivierte Sammlung. Eine Zeile darin kann dennoch den
Turn-Status inaktiv, aktiv, `notLoaded` oder Fehler aufweisen.

Die agentenseitige Aufsicht bleibt optional. Das geführte Onboarding versucht, sie zu installieren und zu aktivieren,
nachdem die Erkennung einer nativen Codex-Installation erfolgreich war und das ausgewählte Inferenz-
Backend seine Live-Prüfung bestanden hat, unabhängig davon, welches primäre Backend der Benutzer
auswählt. Die Aufsicht wird nur aktiviert, wenn diese opportunistische Plugin-Einrichtung
erfolgreich ist. Ein ausdrücklich deaktiviertes Plugin, eine Richtlinienblockierung oder
`supervision.enabled: false` bleibt für Aufsichtstools maßgeblich,
deaktiviert jedoch nicht den Sitzungskatalog für Betreiber.

## Zuständigkeit

Das `codex`-Plugin ist für das gesamte Verhalten von Codex App Server zuständig:

- Endpunkterkennung und Verbindungslebenszyklus
- Protokollinitialisierung und Versionsprüfungen
- Auflisten, Lesen, Fortsetzen und Archivieren von Threads sowie Ereignisverarbeitung
- Brücken für Genehmigungen und Benutzereingaben
- Bindungen nativer Threads an OpenClaw-Sitzungen
- Durchsetzung des ausschließlich für Codex vorgesehenen Modells und Harness nach der Fortsetzung

Die Control UI und das Gateway verwenden diesen Plugin-eigenen Dienst. Sie lesen
Codex-Rollout-Dateien nicht direkt und implementieren keinen weiteren App-Server-Client.

Die lokale Standardtopologie lautet:

```text
Codex Desktop -> privater stdio-App-Server -> Codex-Benutzerverzeichnis
                                             ^
OpenClaw-Codex-Plugin -> App-Server-Verbindung für die Aufsicht
  (standardmäßig verwaltetes stdio im Benutzerverzeichnis; explizite appServer-Einstellungen werden berücksichtigt)
  -> passiver Quellenkatalog und Lesezugriff
  -> Snapshot-Pin -> kanonischer Branch der appServer-Quelle
  -> Einfügung des sichtbaren Verlaufs und jeder spätere beaufsichtigte Chat-Turn

Gewöhnliche OpenClaw-Codex-Sitzungen -> standardmäßig verwaltetes stdio im Agentenverzeichnis
  -> gewöhnliche vollständige Harness-Threads -> OpenClaw Chat und Kanalauslieferung
```

Die Aktivierung der Aufsicht ändert den gewöhnlichen Codex-Harness nicht: Er bleibt
standardmäßig agentenspezifisch. Die separate Aufsichtsverbindung verwendet standardmäßig
verwaltetes stdio im Benutzerverzeichnis, sodass ihr Katalog und ihre Snapshot-Vorgänge native
gespeicherte Threads sehen. Explizite `appServer`-Verbindungseinstellungen werden berücksichtigt. Wenn
`homeScope` nicht festgelegt ist, löst die Aufsichtsverbindung ihn für stdio
oder Unix zu `"user"` und für WebSocket zu `"agent"` auf. Legen Sie `appServer.homeScope: "user"`
nur dann ausdrücklich fest, wenn auch der gewöhnliche Harness das native Codex-
Benutzerverzeichnis gemeinsam verwenden soll. Ein aus der Codex-Seitenleistengruppe übernommener Chat ist die Ausnahme: Seine private
Aufsichtsbindung hält Quellenabrufe, die Erstellung kanonischer Branches und spätere
Turns auf der Aufsichtsverbindung. Live-Status und Zuständigkeit bleiben
prozesslokal; ein Thread, der dem Aufsichtsprozess von OpenClaw unbekannt ist, hat den Status `notLoaded`,
selbst wenn Codex Desktop ihn aktiv ausführt.

Codex verfügt über einen experimentellen kanonischen lokalen Daemon mit einem separaten,
vom Installationsprogramm verwalteten Bootstrap-Vertrag. Diese Funktion darf diesen Daemon nicht implizit bootstrappen, beanspruchen
oder voraussetzen.

## Katalogablauf

Die generische Gateway-Methode `sessions.catalog.list` leitet an den `codex`-Katalog-Provider weiter, der stets `archived: false` und die interaktiven Quelltypen `cli` und `vscode` anfordert. Sie kombiniert:

1. Gateway-lokale `thread/list`-Ergebnisse vom überwachenden App Server,
   der standardmäßig verwaltetes stdio im Benutzer-Home verwendet.
2. `codex.appServer.threads.list.v1`-Ergebnisse von jedem verbundenen Node, für den diese Funktion aktiviert wurde.

Für die Transkriptauswahl wird lokal `thread/turns/list` mit `itemsView: "full"` oder auf dem ausgewählten Node der versionierte Befehl `codex.appServer.thread.turns.list.v1` verwendet. Jede Antwort enthält höchstens 20 persistierte Turns sowie opake Vorwärts-/Rückwärts-Cursor. Die Control UI fordert Seiten in der Reihenfolge neueste zuerst an, stellt jede Seite in chronologischer Reihenfolge dar und stellt ältere Seiten voran. Sie greift niemals auf ein unbegrenztes `thread/read` zurück. OpenClaw weist außerdem jede serialisierte Elementseite über 20 MiB zurück, bevor sie den Node- oder Gateway-Transport passieren kann.

Die native Implementierung des gekoppelten macOS-Nodes unterstützt nur einen nicht gesetzten/standardmäßigen oder expliziten Wert `appServer.transport: "stdio"` mit nicht gesetztem/standardmäßigem Überwachungsbereich oder explizitem `appServer.homeScope: "user"`. Sie übergibt die konfigurierten Werte `command` und `args` sowie das normalisierte `clearEnv` an den untergeordneten Prozess. Bei `"unix"`, `"websocket"` oder explizitem `homeScope: "agent"` kündigt sie weder die Katalogfunktion noch den Befehl an; auch ein direkter Aufruf schlägt nach dem Fail-Closed-Prinzip fehl. Sie darf niemals das Codex-Home des Benutzers für eine agentenbezogene Konfiguration offenlegen oder lokales stdio anstelle eines expliziten Endpunkts verwenden.

Die Katalogprojektion normalisiert Bezeichner, Titel, cwd, Status, aktive Warte-Flags, Zeitstempel, Quelle, Modell-Provider, Codex-Version und Git-Branch. Sie gibt keine Transkriptvorschauen, Turns, Rollout-Pfade, Codex-Home-Pfade, Git-Remotes, Commit-SHAs, unaufbereiteten Endpunkte oder unaufbereiteten App-Server-Fehler zurück. Transkriptantworten enthalten ausschließlich die explizit angeforderte Elementseite des App Servers und deren opake Cursor.

Hostfehler bleiben lokal auf das jeweilige Hostergebnis beschränkt. Eine Offline-Node oder ein nicht verfügbarer
lokaler App Server entfernt keine funktionsfähigen Hosts von der Seite. Konnektivität ist eine
Hosteigenschaft, kein Threadstatus: Ein fehlgeschlagenes Hostergebnis enthält keine aktuellen
Sitzungszeilen und projiziert `offline` nicht auf native Threads.

Die Katalogermittlung erfolgt passiv. Das Auflisten oder Lesen von Metadaten darf weder
`thread/resume` aufrufen noch den OpenClaw-Client für Live-Thread-Anfragen registrieren oder
eine Genehmigungsanfrage beantworten.

Die Suche erfolgt ausschließlich nach Titeln und beachtet keine Groß-/Kleinschreibung. Für jede zurückgegebene Katalogseite
durchsuchen der Gateway und der gekoppelte Mac eine begrenzte Anzahl nativer Seiten, ohne
die Abfrage an den App Server zu übergeben, da die native Suche auch Vorschauen von
Transkripten finden kann. Mit dem zurückgegebenen nativen Cursor können Aufrufer die Suche fortsetzen.

## Abgrenzung der Operator-CLI

Das Plugin registriert drei Gateway-gestützte Shell-Befehle:

```text
openclaw codex sessions [--search <text>] [--host <id>] [--limit <count>] [--cursor <cursor>] [--json] [gateway-options]
openclaw codex continue <thread-id> [--json] [gateway-options]
openclaw codex archive <thread-id> --confirm-no-other-runner [--json] [gateway-options]
```

`[gateway-options]` umfasst `--url <url>`, `--token <token>`, `--timeout <ms>` und
den geerbten Schalter `--expect-final`. Für die Sitzungsauflistung gilt standardmäßig ein Zeitlimit von 75.000 ms;
für continue und archive standardmäßig 30.000 ms;
`--expect-final` hat für diese unären RPCs keine zusätzliche Wirkung. Die Sitzungssuche
durchsucht nur Titel und unterscheidet nicht zwischen Groß- und Kleinschreibung; jede Antwort durchsucht eine begrenzte Kette nativer Seiten,
und `--cursor` setzt die Suche mit älteren Ergebnissen fort. Das Limit beträgt standardmäßig 50 pro Host
und akzeptiert Werte von 1 bis 100; ein Cursor erfordert ein festes `--host`-
Ziel. Kein Befehl akzeptiert
eine Option für archivierte oder einzuschließende archivierte Einträge. Nur `sessions` kann gekoppelte Hosts ansprechen;
`continue` und `archive` senden immer `hostId: "gateway:local"`, und archive
erfordert das ausdrückliche Bestätigungsflag.

Der Shell-Namensraum ist nicht der Laufzeit-Namensraum `/codex` im Chat. Insbesondere
listet `/codex sessions --host <node>` die Sitzungsdateien der Codex CLI auf einer
Node auf, `/codex threads` listet App-Server-Threads für die Verbindung der aktuellen Unterhaltung
auf, und `/codex resume` oder `/codex bind` ändert die Bindung dieser Unterhaltung.
Diese Befehle ersetzen `sessions.catalog.continue` nicht, und es gibt
keinen Laufzeitbefehl `/codex continue` oder `/codex archive`.

## Lokale Fortsetzung

Für einen gespeicherten oder inaktiven Gateway-lokalen Eintrag ruft die Benutzeroberfläche
`sessions.catalog.continue` mit `catalogId: "codex"` sowie den Host- und Thread-
IDs auf. Das Plugin:

1. Verwendet den vorhandenen überwachten Chat erneut, wenn die Quelle bereits über einen solchen verfügt.
2. Andernfalls wird ein begrenzter Verlauf von Benutzer und Assistent bis einschließlich des letzten dauerhaft gespeicherten abgeschlossenen Turns der Quelle (abgeschlossen, unterbrochen oder fehlgeschlagen) in einen neuen OpenClaw-Chat übertragen und ein ausstehender Harness-Zweig aufgezeichnet.
3. Speichert die ausstehende, ausschließlich für Codex geltende Richtlinie zur Modellsperre, nicht jedoch eine konkrete Modell- oder Provider-Auswahl, sowie den privaten Verbindungsbereich für die Überwachung und gibt den OpenClaw-`sessionKey` zurück.

Die Verlaufsprojektion wählt das neueste Ende der sichtbaren Benutzer- und Assistentennachrichten aus, mit festen Obergrenzen von 200 Nachrichten, insgesamt 512 KiB UTF-8-Text und 64 KiB pro Nachricht. Sie ersetzt Bild- und lokale Bildeingaben durch `[Image attachment]`, kopiert niemals Bildnutzdaten oder Pfade und lässt Schlussfolgerungen, Tool-Aufrufe und Tool-Ergebnisse aus.

Die Benutzeroberfläche navigiert mit diesem Sitzungsschlüssel zum normalen Chat. Es existiert noch kein kanonischer Harness-Thread. Beim ersten normalen Chat-Durchlauf installiert der Harness die echten Codex-Handler für Genehmigungen, Abfragen, Ereignisse und Zustellung und führt anschließend Folgendes aus:

1. Verwendet die Supervision-Verbindung, um das native `thread/fork` ohne Modell-
   oder Provider-Überschreibung aufzurufen und den persistierten Quell-Snapshot
   festzuschreiben. Der aktuelle Zustand des Codex-`ConfigManager` wählt Modell
   und Provider aus, und die Fork-Antwort meldet das tatsächlich verwendete Paar.
   Wenn sich das Modell vom zuletzt in der Quelle aufgezeichneten Modell
   unterscheidet, gibt Codex seine normale Warnung zu Modellabweichungen aus.
2. Startet über dieselbe Verbindung den kanonischen vollständigen
   Codex-Harness-Thread mit `threadSource: "appServer"`, dem Arbeitsverzeichnis,
   den Richtlinien, der Konfiguration und der Umgebung von OpenClaw, der
   vollständigen Tool-Oberfläche des OpenClaw-Harnesses sowie exakt dem Modell
   und Provider, die der Fork für diesen initialen Start zurückgegeben hat.
3. Speist den begrenzten sichtbaren Benutzer- und Assistentenverlauf über diese
   Verbindung ein, schreibt die kanonische Bindung fest, ohne ihren
   Supervision-Geltungsbereich zu verwerfen, führt den Turn aus und archiviert
   den temporären Fork.

Vor dem ersten Turn ist der Chat ein gesperrter, ausstehender Branch mit einem
sichtbaren Verlaufsspiegel; anschließend wird jeder Modell-Turn über den
kanonischen Codex-Harness-Thread auf der Supervision-Verbindung ausgeführt. Der
Branch ist kein vollständiger nativer Rollout-Klon: Schlussfolgerungen der
Quelle, Tool-Aufrufe und Tool-Ergebnisse werden bewusst ausgelassen. Wenn das
Festschreiben des Snapshots oder die Erstellung des kanonischen Threads
fehlschlägt, kann der ausstehende Branch erneut ausgeführt werden. Ein
Bindungs-Wettlauf, deaktivierte Supervision oder eine nicht verfügbare oder nicht
übereinstimmende Supervision-Verbindung führt vor der Ausführung des Turns zu
einem geschlossenen Fehler, statt auf den gewöhnlichen Agent-Home-Harness
zurückzufallen.

Dies garantiert eine Codex-eigene Auswahl, nicht die Beibehaltung des
historischen Modells der Quelle. Das vom Fork zurückgegebene Paar wird zum Start
des kanonischen Threads verwendet, und Codex persistiert das native Modell und
den Provider dieses Threads. Bei späteren Wiederaufnahmen werden Modell- und
Provider-Überschreibungen von OpenClaw ausgelassen, sodass Codex das persistierte
Paar wiederherstellt. Wenn eine separate native Codex-Steuerung den kanonischen
Thread ändert, akzeptiert OpenClaw diese native persistierte Auswahl. Das äußere
OpenClaw-Modell und die Fallback-Kette treten niemals an ihre Stelle.

Modelländerungen, das Löschen von Sitzungen sowie Vorgänge zum Zurücksetzen oder Neuerstellen von Sitzungen werden für den überwachten, modellgesperrten Chat nach dem Fail-Closed-Prinzip abgelehnt. Änderungen durch `/codex model <model>`, `/codex
bind`, `/codex resume` (einschließlich Node `--bind here`) und `/codex detach` oder
`/codex unbind` werden ebenfalls nach dem Fail-Closed-Prinzip abgelehnt, da sie die Bindung ersetzen oder löschen. Die Abfrage `/codex model` sowie `/codex fast`, `/codex permissions` und `/codex
threads` bleiben verfügbar. Das Agent-Tool `codex_threads` kann weder einen neuen Fork anhängen noch den gebundenen nativen Thread archivieren. Listen und reine Metadaten-Lesevorgänge bleiben verfügbar; Transkriptfelder erfordern `supervision.allowRawTranscripts`, während Umbenennen, Wiederherstellen aus dem Archiv, ein abgetrennter Fork und das Archivieren eines nicht zugehörigen Threads `supervision.allowWriteControls` erfordern. Keine der Optionen kann die gesperrte Bindung ersetzen. Das Löschen oder Zurücksetzen des OpenClaw-Eintrags würde andernfalls die native Bindung verwerfen und hinter einer wie eine Codex-Sitzung aussehenden Sitzung einen generischen Thread erstellen oder zulassen. Die Aufbewahrungswartung erhält daher modellgesperrte Einträge selbst dann, wenn sie die üblichen Alters-, Anzahl- oder Speicherbudgetgrenzen überschreiten. Auch beim Deaktivieren oder Deinstallieren des zuständigen Plugins bleiben die Sperre und die Plugin-Zuständigkeitsmarkierung erhalten. Der Chat bleibt nicht verfügbar und wird nach dem Fail-Closed-Prinzip abgelehnt, bis dasselbe Plugin wieder aktiviert wird; die Bereinigung wandelt ihn niemals in eine gewöhnliche Modellsitzung um.

Die Quelle wird durch diese Aktion niemals fortgesetzt oder verändert. Der temporäre Fork fixiert einen Snapshot; er ist nicht der dauerhafte Fortsetzungsthread. Das Starten eines separaten kanonischen Harness-Threads beim ersten Durchlauf verhindert, dass OpenClaw zu einem konkurrierenden Quellschreiber wird, nur weil der prozesslokale Status einen von Desktop verwalteten Durchlauf nicht erkannt hat. Die Spiegelung des sichtbaren Verlaufs und der fixierte Snapshot können Arbeit auslassen, die in einer aktiven Quelle noch nicht abgeschlossen wurde. Die ursprüngliche CLI- oder VS-Code-Quelle bleibt für den nativen Katalog und den OpenClaw-Katalog zugelassen. Der kanonische Branch bleibt im Überwachungsspeicher ein nativer Codex-Thread, native Clients können jedoch seine Quellenart `appServer` herausfiltern; die Sichtbarkeit in Codex Desktop ist daher kein garantierter Vertrag.

## Archivierungsverhalten

Für eine gespeicherte oder inaktive Gateway-lokale Zeile erfordert `sessions.catalog.archive` mit
`catalogId: "codex"` ein ausdrückliches `confirmNoOtherRunner: true`, liest den aktuellen prozesslokalen Status erneut ein, fährt nur bei `idle` oder `notLoaded` fort, ruft das native `thread/archive` auf und meldet erst Erfolg, nachdem Codex den Vorgang akzeptiert hat. Die Zeile wird anschließend aus dem nicht archivierten Katalog entfernt.

Ein aktiver Status oder Fehlerstatus aus der erneuten Abfrage lehnt die Archivierung ab. Dasselbe gilt für einen initialisierenden oder ausstehenden überwachten Branch der Quelle: Der erste Chat-Durchlauf muss seinen kanonischen Branch materialisieren, bevor die Quelle archiviert werden kann. Ein bekannter aktiver Eigentümer einer OpenClaw-Bindung für das exakte Ziel oder ein nicht archivierter erzeugter Nachfolger lehnt die Archivierung ebenfalls ab. OpenClaw paginiert die experimentelle Codex-Beziehung `thread/list ancestorThreadId` und bricht bei Anfrage- oder Antwortfehlern, Cursor- oder Thread-Zyklen sowie beim Ausschöpfen von Sicherheitsgrenzen nach dem Fail-Closed-Prinzip ab. Die native Archivierung kann geladene übergeordnete und nachfolgende Arbeit beenden; daher ist die Archivierung keine Abkürzung zum Unterbrechen. Die Lese-, Nachfolgeraufzählungs- und Archivierungsaufrufe sind nicht atomar. Ein unabhängiger Client kann weiterhin Arbeit an einer Zeile verwalten oder starten, die lokal als inaktiv oder `notLoaded` erscheint. Die Bestätigung, dass kein anderer Runner vorhanden ist, deckt unbekannte Clients und dieses Race ab, bis Codex eine bedingte Archivierung oder ein prozessübergreifendes Lease bereitstellt. Die Archivierung über gekoppelte Nodes ist verboten.

Im Codex-Katalog gibt es keine Ansicht für archivierte Einträge. Ein Thread, der über `thread/unarchive` in einer anderen, vom Eigentümer autorisierten Codex-Oberfläche wiederhergestellt wurde, ist anschließend erneut für den nicht archivierten Katalog zugelassen.

## Sicherheit aktiver Threads

Codex serialisiert Änderungen an einem Thread unter den Clients eines App Servers, stellt jedoch kein exklusives prozessübergreifendes Runner- oder Genehmigungseigentümer-Lease bereit. Unabhängige stdio App Servers können an denselben Rollout anhängen, während jeder nur seinen eigenen In-Memory-Status sieht. Genehmigungsanfragen können außerdem alle Abonnenten eines Servers erreichen, wobei die erste gültige Antwort die Anfrage abschließt.

Daher gilt:

- Passive Katalog-Clients abonnieren Genehmigungen nicht und lehnen sie nicht automatisch ab.
- Zeilen, die derzeit als aktiv gemeldet werden, bieten weder einen neuen Branch noch Archivieren an.
- Eine nicht zugeordnete Quelle wird zu einem Branch des sichtbaren Verlaufs, dessen kanonischer Harness-Thread die Quelle niemals fortsetzt.
- `notLoaded` wird als unbekannte Aktivität angezeigt und kann nur nach einer informierten Bestätigung archiviert werden, dass kein anderer Runner vorhanden ist.
- Die lokale Archivierung erfordert diese Bestätigung sowie eine erneute Abfrage mit dem Ergebnis `idle` oder `notLoaded`, wobei das Protokoll-Race zwischen Lesen und Archivieren anerkannt wird.

Unterbrechung und Übergabe zwischen mehreren Clients sind zukünftige Produktentscheidungen. Sie werden nicht dadurch impliziert, dass eine aktive Zeile angezeigt wird.

## Grenze gekoppelter Nodes

Node Invoke unterstützt derzeit nur Anfrage/Antwort. Es kann begrenzte Katalogmetadaten und Seiten mit Transkriptdurchläufen sicher zurückgeben, jedoch nicht den langlebigen Ereignisstrom, Genehmigungsanfragen, Tool-Aufrufe, Abbrüche und Assistenten-Deltas übertragen, die für einen Codex-Harness-Lauf erforderlich sind.

Der Node-Vertrag unterstützt daher Listen und Seiten mit Transkriptdurchläufen. Remote-Zeilen bleiben lesbar, aber **Fortsetzen** und **Archivieren** sind unabhängig vom Inaktivitätsstatus nicht verfügbar. Eine echte Remote-Fortsetzung erfordert einen Node-seitigen Runner und eine Streaming-Bridge, die dieselben Genehmigungs- und Bindungsinvarianten wie das lokale Harness wahrt.

## Berechtigungen

Jeder Computer stimmt lokal zu. Das Aktivieren des Gateways autorisiert keinen anderen Node zum Lesen seiner Codex-Metadaten. Die Node-Funktion muss die normale Kopplungs- und Befehlsrichtliniengenehmigung durchlaufen.

Flottenauflistung und Transkriptanzeige verwenden den Gateway-Bereich `operator.write`, da sie gekoppelte Nodes aufrufen. Lokale Fortsetzungen und Archivierungen sind authentifizierte Operator-Aktionen und unterliegen weiterhin Host- und Statusprüfungen.

Der autonome Agent- und eigenständige MCP-Zugriff ist separat geregelt. Die ausgelieferten Tool-Verträge `codex_endpoint_probe`, `codex_sessions_list`, `codex_session_read`,
`codex_session_send` und `codex_session_interrupt` verbleiben in der Zuständigkeit des `codex`-Plugins. Bei aktivierter Überwachung erfordern rohe Transkriptlesevorgänge über `codex_threads` und aus Transkripten abgeleitete Listenfelder ebenfalls `supervision.allowRawTranscripts`; jeder Fork sowie jedes Umbenennen, Archivieren oder Wiederherstellen aus dem Archiv über `codex_threads` erfordert `supervision.allowWriteControls`. Beide Richtlinien sind standardmäßig deaktiviert.

## Kompatibilität

`openclaw doctor --fix` migriert die ausgelieferte Konfiguration `plugins.entries.codex-supervisor`, einschließlich Endpunkten und Transkript-/Schreibrichtlinien sowie Plugin-Zulassungs-/Ablehnungsreferenzen, nach
`plugins.entries.codex.config.supervision`. Explizite kanonische Zielwerte haben bei Konflikten Vorrang. Der Laufzeitcode verwendet nach der Migration ausschließlich die kanonische Form des `codex`-Plugins.

Das offizielle Plugin behält genau fünf Kompatibilitätstools des Supervisors:
`codex_endpoint_probe`, `codex_sessions_list`, `codex_session_read`,
`codex_session_send` und `codex_session_interrupt`. Die Sitzungsliste enthält standardmäßig nur geladene Sitzungen; es gibt keinen Parameter `loaded_only`. `include_stored: true` fügt nicht archivierte Zeilen aus der Zustandsdatenbank hinzu, pro Endpunkt begrenzt durch `max_stored_sessions` (Standardwert 200, zulässiger Bereich 1 bis 1,000); geladene Zeilen werden durch diese Einstellung nicht begrenzt. Aus Transkripten abgeleitete Felder und Lesevorgänge bleiben durch `allowRawTranscripts` geschützt; Senden und Unterbrechen bleiben durch `allowWriteControls` geschützt.

Kompatibilitätssenden startet oder setzt niemals einen inaktiven Thread fort. `mode: "start"` wird immer abgelehnt; `"auto"` und `"steer"` steuern nur einen lesbaren aktiven Durchlauf. Ebenso erfordert das Unterbrechen einen aktiven lesbaren Durchlauf. Die Fortsetzung im inaktiven Zustand wird an den nativen Codex-Katalog weitergeleitet, damit das vollständige Harness Genehmigungen, Tools und die Bindung verwaltet. Der eigenständige Legacy-MCP-Adapter löst dieselben Tools aus dem offiziellen Plugin auf und ist der einzige Pfad, der die beibehaltenen Legacy-Umgebungsvariablen für Richtlinien berücksichtigt.

Die Katalog-Benutzeroberfläche vom Juli, die Gateway-Methode, die Node-Funktion und die CLI-Registrierung waren unter der alten Plugin-ID noch nicht ausgeliefert worden. Sie wechseln direkt in die Zuständigkeit von `codex`, ohne eine zweite Laufzeitfassade.

## Zukünftige Arbeiten

- Node-seitiger Streaming-Runner und Ereignis-Bridge für Remote-Fortsetzungen
- Explizite Runner- und Genehmigungseigentümer-Leases für die gleichzeitige Client-Übergabe
- Remote-Archivierung, sobald ein Lease für Runner-Eigentümerschaft oder eine gleichwertige Abschirmung vorhanden ist
- Unterbrechung und umfassendere Beobachtung aktiver Sitzungen
- Auditierte Übergabe zwischen Codex Desktop, CLI und OpenClaw

Das Durchsuchen archivierter Einträge ist nicht Teil der geplanten Überwachungsseitenleiste. Native Codex-Oberflächen bleiben der Wiederherstellungspfad für archivierte Threads.

## Akzeptanztests

- Das Aktivieren der Überwachung listet nicht archivierte lokale Sitzungen auf.
- Archivierte Sitzungen erscheinen niemals in der Katalogantwort oder Benutzeroberfläche.
- Funktionsfähige Hosts bleiben sichtbar, wenn ein anderer Host ausfällt; ein nicht verfügbarer Host gibt keine aktuellen Zeilen zurück, statt einen Offline-Sitzungsstatus zu erfinden.
- Eine gespeicherte oder inaktive lokale Zeile erstellt eine Chat-Spiegelung mit einer ausschließlich für Codex geltenden Modell-/Laufzeitsperre; der erste Durchlauf fixiert einen temporären Snapshot und startet den kanonischen vollständigen Harness-Thread, und erneutes Fortsetzen öffnet den vorhandenen Chat.
- Beim ersten Durchlauf werden Modell-/Provider-Überschreibungen im Snapshot-Fork ausgelassen und der kanonische Start auf exakt das von Codex zurückgegebene Paar fixiert, selbst wenn Codex warnt, dass sein aktuelles Modell vom zuletzt aufgezeichneten Modell der Quelle abweicht.
- Ausstehende und bestätigte überwachte Bindungen verwenden die Überwachungsverbindung für den Quellzugriff, die Erstellung des kanonischen Branches und jeden späteren Durchlauf; gewöhnliche Codex-Sitzungen bleiben Agent-bezogen.
- Spätere Fortsetzungen lassen OpenClaw-Modell-/Provider-Überschreibungen aus, bewahren die kanonische persistierte Codex-Auswahl, akzeptieren separate native Änderungen an diesem Thread und ersetzen sie niemals durch das äußere OpenClaw-Modell oder die Fallback-Kette.
- Das Deaktivieren der Überwachung oder der Verlust des Bindungs-/Verbindungslebenszyklus wird nach dem Fail-Closed-Prinzip abgelehnt, statt den Chat in das gewöhnliche Harness des Agent-Home zu verschieben.
- Ein überwachter, modellgesperrter Chat kann nicht gelöscht werden, solange er die native Bindung schützt.
- Der Chat spiegelt höchstens 200 Benutzer- und Assistentennachrichten, insgesamt 512 KiB und 64 KiB pro Nachricht. Bilder werden zu Platzhaltern; Schlussfolgerungen der Quelle, Tool-Aufrufe, Tool-Ergebnisse, Bildnutzdaten und lokale Pfade werden nicht geklont.
- Der Branch-Ablauf setzt den Quell-Thread niemals fort.
- Die ursprüngliche Quelle bleibt für beide Kataloge zugelassen. Der kanonische native Branch verwendet die Quellenart `appServer`, und sein Erscheinen in Codex Desktop wird nicht garantiert.
- Aktive lokale Quellen können weder einen Branch erstellen noch archiviert werden; ein vorhandener überwachter Chat kann weiterhin geöffnet werden.
- Zeilen mit unbekannter Aktivität können ohne Bestätigung verzweigen; die Archivierung erfordert eine ausdrückliche Bestätigung, dass kein anderer Runner vorhanden ist.
- Eine Quelle mit einem initialisierenden oder ausstehenden überwachten Branch kann erst archiviert werden, nachdem der erste Chat-Durchlauf den kanonischen Branch materialisiert hat.
- Ein bekannter aktiver Bindungseigentümer für das exakte Ziel oder ein nicht archivierter erzeugter Nachfolger blockiert die Archivierung; Fehler bei der Nachfolgeraufzählung werden nach dem Fail-Closed-Prinzip behandelt, und die ausdrückliche Bestätigung bleibt für unbekannte Clients und das Race zwischen Status und Archivierung verantwortlich.
- Die bestätigte Archivierung einer gespeicherten oder inaktiven lokalen Zeile entfernt die Zeile nach dem nativen Erfolg.
- Zeilen gekoppelter Nodes bleiben ohne Fortsetzen oder Archivieren sichtbar.
- Passive Auflistungen abonnieren oder beantworten niemals Thread-Genehmigungen.
- Die Legacy-Supervisor-Konfiguration wird in die kanonische Codex-Konfigurationsform migriert.
- Die Legacy-Liste enthält standardmäßig nur geladene Sitzungen, die Aufzählung gespeicherter Sitzungen hält ihre Obergrenze pro Endpunkt ein, und Kompatibilitätssenden startet oder setzt niemals einen inaktiven Thread fort.
