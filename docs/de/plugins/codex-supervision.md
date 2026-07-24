---
read_when:
    - Sie möchten, dass Codex-Desktop- oder CLI-Sitzungen in OpenClaw angezeigt werden
    - Sie müssen von einer gespeicherten oder inaktiven lokalen Codex-Sitzung abzweigen oder diese archivieren.
    - Sie stellen Codex-Sitzungen und den Transkriptverlauf von gekoppelten Nodes bereit
sidebarTitle: Codex supervision
summary: Nicht archivierte native Codex-Sitzungen und paginierte Transkripte über OpenClaw-Nodes hinweg durchsuchen
title: Codex-Sitzungen überwachen
x-i18n:
    generated_at: "2026-07-24T04:31:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f365e3207dff092c3dfd8f7588d60d70a16f0cce484991eb4ab3fc0bd15f8051
    source_path: plugins/codex-supervision.md
    workflow: 16
---

Die Codex-Überwachung ist eine optionale Funktion des offiziellen `codex`-Plugins. Sie
zeigt nicht archivierte Quellsitzungen von Codex CLI, VS Code, Atlas und ChatGPT vom
Gateway-Computer sowie von gekoppelten Computern mit aktivierter Funktion in der normalen
Sitzungsseitenleiste und im Chat-Bereich an.

Die erste Version beschränkt die Zuständigkeit bewusst:

- Eine gespeicherte oder inaktive lokale Sitzung kann aus ihrem begrenzten,
  dauerhaft gespeicherten Verlauf von Benutzer und Assistent einen modellgebundenen
  OpenClaw-Chat erstellen. Die erste Nachricht startet einen nativen Snapshot-Fork
  und anschließend den vollständigen Codex-Harness-Thread mit exakt dem Modell und
  Provider, die Codex App Server für diesen Fork ausgewählt hat. Bei späteren
  Interaktionen wird das dauerhaft gespeicherte Paar des kanonischen nativen Threads
  wiederhergestellt, während die überwachte Bindung verhindert, dass OpenClaw eine
  andere Runtime, ein anderes Modell oder einen anderen Fallback einsetzt. Eine
  separate native Codex-Steuerung kann dieses dauerhaft gespeicherte Paar weiterhin
  ändern. Ein bereits erstellter Branch öffnet seinen vorhandenen Chat.
- Bei einer gespeicherten Sitzung, die von einem anderen Codex-Prozess erkannt
  wurde, ist die aktuelle Live-Aktivität unbekannt. Sie kann verzweigt oder erst
  archiviert werden, nachdem der Bediener bestätigt hat, dass sie von keinem anderen
  Codex-Client verwendet wird.
- Eine aktive Quelle bleibt sichtbar, kann jedoch weder einen Branch erstellen
  noch archiviert werden, bis ihre aktuelle Interaktion abgeschlossen ist. Wenn sie
  bereits über einen überwachten Chat verfügt, bleibt **Chat öffnen** verfügbar.
- Eine Sitzung auf einem gekoppelten Node stellt ihr dauerhaft gespeichertes
  Transkript über begrenzte, cursorpaginierte Lesezugriffe von App Server bereit.
  Die Remote-Fortsetzung erfordert künftig eine Streaming-Node-Bridge; für die
  Remote-Archivierung ist zusätzlich eine Lease für die Runner-Zuständigkeit oder
  eine gleichwertige Absicherung erforderlich.
- Archivierte Sitzungen werden nicht aufgeführt. Eine gespeicherte oder
  inaktive lokale Sitzung kann erst archiviert werden, nachdem der Bediener bestätigt
  hat, dass sie von keinem anderen Codex-Client verwendet wird.

## Vorbereitungen

- Installieren Sie das offizielle `@openclaw/codex`-Plugin auf dem Gateway. Die
  OpenClaw-macOS-App kann es installieren, wenn Sie Codex-Funktionen aktivieren;
  CLI-Installationen können `openclaw plugins install @openclaw/codex` ausführen.
- Installieren Sie Codex Desktop oder Codex CLI auf jedem Computer, dessen
  Sitzungen Sie auflisten möchten, und melden Sie sich dort an.
- Koppeln Sie Remote-Computer als OpenClaw-Nodes. Die Funktion muss auf jedem
  Computer lokal aktiviert werden; wenn die Überwachung nur auf dem Gateway aktiviert
  wird, autorisiert dies keinen anderen Node.
- Verwenden Sie ein vom Eigentümer kontrolliertes Gateway. Sitzungstitel,
  Arbeitsverzeichnisse und Git-Branches können vertrauliche Projektinformationen
  offenlegen.

## Überwachung aktivieren

Die geführte `openclaw onboard`-Einrichtung und die erstmalige macOS-Einrichtung versuchen,
die Codex-Überwachung zu installieren und zu aktivieren, nachdem sie eine native
Codex-Installation erkannt und das ausgewählte Inferenz-Backend erfolgreich
aktiviert haben. Codex muss nicht das primäre Backend sein. Die Überwachung wird
verfügbar, wenn diese opportunistische Plugin-Aktivierung erfolgreich ist. Die
Verfügbarkeit von App Server wird geprüft, wenn die Überwachung zum ersten Mal
eine Verbindung herstellt. Eine explizite Deaktivierung des Codex-Plugins oder
eine Richtliniensperre verhindert die opportunistische Aktivierung, und ein
vorhandenes explizites `supervision.enabled: false` deaktiviert die Überwachungswerkzeuge für
Agenten; der Bedienerkatalog bleibt registriert, solange das Codex-Plugin aktiv
ist, sofern `sessionCatalog.enabled: false` ihn nicht deaktiviert. Dieser separate Schalter lässt
den Codex-Provider, den Harness und die agentenbezogene Überwachungsrichtlinie
unverändert und entfernt zugleich die Befehle zum Auflisten und Lesen des Katalogs
gekoppelter Nodes von diesem Host. Bei vorhandenen Installationen kann dieselbe
Funktion manuell aktiviert werden:

Aktivieren Sie das `codex`-Plugin und seine Überwachungsfunktion in `openclaw.json`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          supervision: {
            enabled: true,
          },
        },
      },
    },
  },
}
```

Wenn `plugins.allow` vorhanden ist, fügen Sie `codex` hinzu. Starten Sie das Gateway
nach einer Änderung der Plugin-Aktivierung neu.

Ohne explizite `appServer`-Verbindungseinstellungen verwendet die Überwachung eine
separate verwaltete stdio-Überwachungsverbindung zum nativen Codex-Benutzerverzeichnis.
Der gewöhnliche Codex-Harness bleibt standardmäßig agentenspezifisch. Dadurch
werden native Sitzungen in beiden Apps sichtbar, ohne dass gewöhnliche
OpenClaw-Interaktionen den nativen Codex-Zustand gemeinsam nutzen. Legen Sie
`appServer.homeScope: "user"` explizit fest, wenn auch der Harness diesen Zustand gemeinsam nutzen
soll. Die Überwachung berücksichtigt explizite `appServer`-Verbindungseinstellungen,
statt sie durch ihren lokalen Standard für das Benutzerverzeichnis zu ersetzen.

Ein aus der Seitenleistengruppe **Codex** übernommener Chat ist keine gewöhnliche
Harness-Sitzung. Seine private Überwachungsbindung verwendet die
Überwachungsverbindung für das Lesen der Quelle, die Erstellung des kanonischen
Branches, die Verlaufseinspeisung und jede spätere Interaktion. Mit der lokalen
Standardverbindung bleiben dadurch das native Codex-Benutzerverzeichnis, die
Authentifizierung und die Provider-Konfiguration erhalten, ohne den Standard für
andere Sitzungen zu ändern. Überwachte übernommene Chats nehmen außerdem an der
[Sitzungszustandserkennung](/de/concepts/session-state) teil.

Bei der lokalen Standard-Überwachungsverbindung wird der Speicher gemeinsam mit
nativen Codex-Clients verwendet. OpenClaw setzt nicht voraus, dass ein anderer
Client denselben laufenden App-Server-Prozess verwendet, und die Zuständigkeit
für den nativen Status ist prozesslokal. Ein Thread, den sein Überwachungs-App-Server
als `notLoaded` meldet, wird daher als **Gespeichert / Aktivität unbekannt**
und nicht als inaktiv behandelt.

Aktivieren Sie dieselbe optionale Funktion auf jedem Headless-Node-Host, dessen
Sitzungen angezeigt werden sollen. Die native OpenClaw-macOS-App liest dieselbe
lokale Einstellung, wenn sie dem gekoppelten Gateway ihren Codex-Katalog
bekannt gibt. Dieser gekoppelte native Mac-Katalog unterstützt nur den Standard
oder ein explizites `appServer.transport: "stdio"` mit einem nicht gesetzten oder expliziten
`appServer.homeScope: "user"`. `command`, `args` und `clearEnv` werden für diesen
stdio-Prozess berücksichtigt. Wenn die Mac-Konfiguration `"unix"`,
`"websocket"` oder `homeScope: "agent"` auswählt, gibt die App die Katalogfunktion und
den Katalogbefehl nicht bekannt; ein veralteter direkter Aufruf schlägt fehl,
statt das Codex-Benutzerverzeichnis offenzulegen oder einen anderen lokalen
stdio-App-Server zu starten.

Ein neu bekannt gegebener Node-Befehl ändert die genehmigte Befehlsoberfläche des
Nodes. Genehmigen Sie die Aktualisierung vom Gateway-Host aus:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

Nicht archivierte Codex-Sitzungen werden außerdem nach Host gruppiert in der
Hauptseitenleiste der Control UI angezeigt. Wählen Sie eine Sitzung aus, um ihr
dauerhaft gespeichertes Transkript zu lesen. Der Betrachter verwendet die neueste
Codex-API `thread/turns/list` mit `itemsView: "full"` und lädt höchstens 20 Interaktionen
pro Anfrage; **Ältere Transkripteinträge laden** folgt dem opaken App-Server-Cursor
der neuesten Seite. Geladene Seiten werden in chronologischer Reihenfolge
dargestellt. Der Betrachter lädt niemals einen unbegrenzten
`thread/read`-Verlauf. Eine Seite oberhalb der Transportsicherheitsgrenze von
20 MiB schlägt sicher fehl, statt die Node- oder Gateway-Verbindung zu gefährden.

Öffnen Sie die Gruppe **Codex** in der normalen Sitzungsseitenleiste. Sie führt
dieselben Sitzungen nach Host gruppiert auf. **Weitere Sitzungen laden** fügt von
jedem Host mit älteren Zeilen die nächste Seite an; diese angefügten Zeilen bleiben
bei der regelmäßigen Aktualisierung der Seitenleiste erhalten. Jeder Host wird
angezeigt, sobald seine eigene native Auflistung abgeschlossen ist. Die sichtbare
Seite wird nach Änderungen der Node-Konnektivität, beim erneuten Erhalt des Fokus
und mindestens alle 30 Sekunden abgeglichen; bei einem geänderten Ergebnis folgt
schneller ein weiterer Durchlauf. In Codex Desktop, der CLI oder einem anderen
nativen Client erstellte Sitzungen erscheinen daher ohne vollständiges Neuladen
der Seite. Die erste Seite folgt der Codex-eigenen Sortierung nach der letzten
Aktualisierung, sodass eine neu erstellte native Sitzung sofort berücksichtigt
werden kann.
Jede zurückgegebene Suchseite durchsucht pro Host eine begrenzte Anzahl nativer
Seiten, statt die Abfrage an App Server zu senden, da die native Suche auch
Transkriptvorschauen abgleichen kann.

Hostverfügbarkeit und Thread-Status sind voneinander getrennt. **Offline** oder
**Nicht verfügbar** beschreibt die Aktualisierung eines Hosts; ein nicht verfügbarer
Host gibt keine aktuellen Sitzungszeilen zurück und ändert den nativen Status
eines Threads nicht in `offline`. Sitzungszeilen verwenden Codex-Status wie
`idle`, `active`, `notLoaded` oder Fehler. Ein ausgefallener Host
blendet Ergebnisse fehlerfrei arbeitender Hosts nicht aus.

Die Warnung in der Seitenleiste enthält den Katalogfehlercode und den sicheren
zugrunde liegenden Gateway-Fehler. Öffnen Sie **Settings > Automation > Plugins > Codex > Native Session
Discovery**, um die Erkennung zu deaktivieren, ohne Codex zu deaktivieren. Vergleichen
Sie bei `NODE_LIST_FAILED` `openclaw nodes list` mit **Settings > Devices**; die detaillierte
Ursache gibt an, welcher Fehler im Kopplungsspeicher, in der Node-Registrierung,
bei den Berechtigungen oder im Gateway-Lebenszyklus behoben werden muss.

## Bediener-CLI verwenden

Die Terminal-CLI stellt denselben nicht archivierten Katalog sowie die
Gateway-lokalen Branch- und Archivierungsaktionen bereit:

```bash
openclaw codex sessions [--search <text>] [--host <id>] [--limit <count>] [--cursor <cursor>] [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
openclaw codex continue <thread-id> [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
openclaw codex archive <thread-id> --confirm-no-other-runner [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
```

Optionen für `openclaw codex sessions`:

- `--search <text>` durchsucht Sitzungstitel ohne Beachtung der Groß-/Kleinschreibung.
- `--host <id>` beschränkt die Antwort auf einen stabilen Katalog-Host wie
  `gateway:local` oder `node:<node-id>`.
- `--limit <count>` legt 1 bis 100 Zeilen pro Host fest; der Standardwert ist 50.
- `--cursor <cursor>` setzt eine Hostseite fort und erfordert daher `--host`.
- `--json` gibt die strukturierte Gateway-Antwort aus.

Alle drei Befehle übernehmen `--url`, `--token` und `--timeout <ms>` vom
Gateway-Client. Die Sitzungsauflistung verwendet standardmäßig 75.000 ms, damit
kalte Kataloge gekoppelter Nodes abgeschlossen werden können; für Fortsetzung
und Archivierung beträgt der Standardwert 30.000 ms. Sie stellen außerdem den
gemeinsamen Schalter `--expect-final` bereit, der diese unären Überwachungs-RPCs nicht
ändert. Jeder Befehl erfordert den Gateway-Scope `operator.write`.
Die Standardausgabe `-h, --help` ist für jeden Unterbefehl verfügbar.
Es gibt keine Option für archivierte Sitzungen oder zum Einbeziehen archivierter
Sitzungen. `sessions` kann gekoppelte Hosts auflisten, aber `continue` und
`archive` zielen immer auf `gateway:local`; gekoppelte Zeilen können nur
aufgelistet werden. Für die Archivierung ist immer `--confirm-no-other-runner` erforderlich.

Diese Shell-Befehle unterscheiden sich von den Runtime-Befehlen `/codex`
innerhalb des Chats. `/codex threads [filter]` listet App-Server-Threads auf, die für die
aktuelle Gesprächsverbindung verfügbar sind. `/codex sessions --host <node>` listet fortsetzbare
Codex-CLI-Sitzungsdateien auf einem Node auf, nicht den Katalog der gesamten
Überwachungsflotte. `/codex
resume` und `/codex bind` binden das aktuelle Gespräch
an, statt einen sicheren überwachten Branch zu erstellen; ein modellgebundener
überwachter Chat lehnt solche Bindungsänderungen ab. Es gibt keinen
Runtime-Befehl `/codex continue` oder `/codex archive`.

## Branch aus einer lokalen Sitzung erstellen

Wählen Sie bei einer gespeicherten oder inaktiven Zeile vom Gateway-Computer
**Als Branch fortsetzen** aus. OpenClaw erstellt einen normalen Chat-Eintrag,
spiegelt den begrenzten Verlauf von Benutzer und Assistent bis einschließlich
der letzten terminalen, dauerhaft gespeicherten Interaktion der Quelle
(abgeschlossen, unterbrochen oder fehlgeschlagen), zeichnet einen ausstehenden
Harness-Branch auf und öffnet den Chat. Die allgemeine Modellauswahl ist gesperrt,
aber es wurde noch kein konkretes Modell und kein konkreter Provider ausgewählt.
Die Quelle wird nicht fortgesetzt und der kanonische Harness-Thread noch nicht
gestartet. Bei einer Wiederholung der Aktion wird der vorhandene Chat geöffnet,
statt einen weiteren Branch zu erstellen.

Die Spiegelung behält das neueste sichtbare Ende bei, das alle drei Grenzwerte
einhält: höchstens 200 Benutzer- oder Assistentennachrichten, insgesamt 512 KiB
UTF-8-Text und 64 KiB pro Nachricht. Zu große Nachrichten werden mit einer
Markierung gekürzt, und ältere Nachrichten werden ausgelassen, sobald ein
Grenzwert erreicht ist. Eine Bild- oder lokale Bildeingabe wird zum wörtlichen
Platzhalter `[Image attachment]`; Bilddaten und lokale Pfade werden nicht kopiert.

Senden Sie die erste normale Chat-Nachricht, um mit der Arbeit zu beginnen. Das Codex-Harness installiert die
echten Handler für Genehmigungen, Rückfragen, Ereignisse und Zustellung. Es verwendet einen temporären
nativen Fork über die Überwachungsverbindung, um den Quell-Snapshot zu fixieren, ohne
ein Modell oder einen Provider zu überschreiben. Codex App Server wählt beides aus seiner
aktuellen nativen Konfiguration aus und gibt die tatsächliche Auswahl zurück. Über dieselbe
Verbindung startet OpenClaw den kanonischen vollständigen Harness-Thread aus der Quelle `appServer`
unter dessen Arbeitsverzeichnis und Laufzeitrichtlinie mit genau diesem zurückgegebenen Paar, fügt den
begrenzten sichtbaren Verlauf ein und archiviert den temporären Fork. Der kanonische Thread
verfügt über die vollständige Tool-Oberfläche des OpenClaw-Harness. Dies ist ein Zweig des sichtbaren Verlaufs und
kein vollständiger Klon des nativen Rollouts: Schlussfolgerungen der Quelle, Tool-Aufrufe und Tool-Ergebnisse
werden ausgelassen. Dieser und jeder spätere Turn verbleibt auf der überwachten Codex-Verbindung,
statt eine andere OpenClaw-Modelllaufzeit oder das gewöhnliche Harness im Agent-Home zu verwenden.

Die zurückgegebene Auswahl ist kein Nachweis für das historische Modell der Quelle. Wenn die
aktuelle native Konfiguration von dem Modell abweicht, das für den letzten Turn der Quelle
aufgezeichnet wurde, gibt Codex seine normale Warnung zur Modellabweichung aus. OpenClaw verwendet das
zurückgegebene Paar zum Start des kanonischen Threads. Codex speichert das native
Modell und den Provider dieses kanonischen Threads; bei späteren Fortsetzungen bleiben beide erhalten, da
OpenClaw keine Überschreibungen für Modell und Provider angibt. Wenn der kanonische Thread
über eine separate native Codex-Steuerung geändert wird, übernimmt OpenClaw die von Codex gespeicherte
Auswahl. OpenClaw ersetzt sie niemals durch sein äußeres Modell oder seine Fallback-Kette.

Der überwachte, modellgebundene Chat kann weder gelöscht werden noch das Modell wechseln, `/new`
oder `/reset` verwenden, die Gateway-Aktion zum Zurücksetzen der Sitzung aufrufen oder die allgemeine
Aktion **Sitzung forken** verwenden. Änderungen an `/codex model <model>`, `/codex
bind`, `/codex resume` (einschließlich einer Node-Sitzung mit `--bind here`) sowie
`/codex detach` oder `/codex unbind` werden ebenfalls abgelehnt, da sie die
gesperrte native Bindung ersetzen oder löschen würden. Die Abfrage `/codex model` sowie `/codex fast`,
`/codex permissions` und `/codex threads` bleiben verfügbar. Starten Sie eine andere
gewöhnliche Sitzung, wenn Sie ein anderes Modell oder einen neuen Thread verwenden möchten.

Lassen Sie die Überwachung für diesen Chat aktiviert. Wenn die Überwachung deaktiviert wird oder ihre
gespeicherte Verbindungsbindung nicht mehr verfügbar oder inkonsistent ist, schlägt der Turn
geschlossen fehl, statt zu einer gewöhnlichen Sitzung im Agent-Home zu wechseln.

Durch Deaktivieren oder Deinstallieren des Plugins `codex` wird diese Zuständigkeit nicht aufgehoben und
der Chat nicht für ein anderes Modell freigegeben. Der gesperrte Chat bleibt erhalten, ist jedoch
nicht verfügbar. Installieren oder aktivieren Sie dasselbe Plugin erneut und starten Sie das Gateway neu, um
ihn fortzusetzen. Dieses bewusste Fail-Closed-Verhalten verhindert, dass eine Aufbewahrungsbereinigung oder ein
vorübergehender Plugin-Ausfall die native Bindung unbemerkt verwaist.

Das Agent-Tool `codex_threads` folgt derselben Grenze. Es kann weder einen
anderen Fork anhängen noch den gebundenen nativen Thread des Chats archivieren. Listen- und rein metadatenbezogene
Lesevorgänge bleiben verfügbar. Das Lesen unverarbeiteter Transkripte erfordert `allowRawTranscripts`.
Wenn der Rohzugriff deaktiviert ist, lehnt `codex_threads` auch die Listensuche ab, da
die native Suche Transkriptvorschauen enthält; die Control UI und die Operator-CLI
bieten weiterhin eine begrenzte Suche ausschließlich nach Titeln. Umbenennen, Dearchivieren, ein abgetrennter Fork und
das Archivieren eines nicht zugehörigen Threads ohne Besitzer erfordern
`allowWriteControls`. Keine der Optionen umgeht die gesperrte Bindung.

OpenClaw abonniert oder beantwortet keine Genehmigungsanfragen, solange lediglich
der Quell-Thread aufgelistet oder der ausstehende Chat angezeigt wird. Durch das Starten eines separaten kanonischen
Harness-Threads beim ersten Turn kann ein anderer Codex-Prozess weiterhin Eigentümer der
Quelle bleiben, ohne konkurrierende Rollout-Schreiber zu erzeugen.

Die ursprüngliche Quelle aus CLI, VS Code, Atlas oder ChatGPT bleibt für native
Clients und den OpenClaw-Katalog sichtbar. Der kanonische Zweig wird als nativer
Codex-Thread gespeichert, seine Quellart lautet jedoch `appServer`. Codex Desktop oder ein anderer
nativer Client kann diese Quellart herausfiltern, daher wird nicht garantiert,
dass der Zweig selbst in jeder nativen Verlaufsansicht erscheint.

Für eine aktive Zeile, die vom App Server von OpenClaw gemeldet wird, kann kein neuer Zweig gestartet werden. Warten Sie,
bis der aktuelle Turn abgeschlossen ist, und aktualisieren Sie den Katalog. Codex App Server
serialisiert Änderungen innerhalb eines Prozesses, stellt jedoch keinen exklusiven
prozessübergreifenden Runner oder eine Lease für den Genehmigungseigentümer bereit.

Bei einer Zeile mit **Gespeichert / Aktivität unbekannt** verwenden die Chat-Spiegelung und die Fixierung des Snapshots
beim ersten Turn den Codex-Zustand bis einschließlich des letzten dauerhaft gespeicherten abgeschlossenen Turns. Der Quell-
Thread wird weder fortgesetzt noch unterbrochen oder archiviert. Wenn in einem anderen Prozess ein
Turn ausgeführt wird, sind dessen neueste laufende Arbeiten möglicherweise nicht im Zweig enthalten.

## Eine lokale Sitzung archivieren

Wählen Sie **Archivieren** bei einer gespeicherten oder inaktiven Gateway-lokalen Zeile und bestätigen Sie anschließend, dass kein
anderer Codex-Client oder OpenClaw-Runner diesen Thread oder seine erzeugten
Nachkommen verwendet. OpenClaw liest den prozesslokalen Status erneut, fährt nur bei
`idle` oder `notLoaded` fort, ruft die native Archivierungsoperation von Codex auf und entfernt die
Sitzung aus der Liste der nicht archivierten Sitzungen. Native Codex versucht außerdem, die
erzeugten Nachkommen des Threads zu archivieren.

Die Archivierung ist nicht verfügbar, wenn die erneute Abfrage die Sitzung als aktiv oder in einem
Fehlerzustand meldet, wenn sie zu einer gekoppelten Node gehört oder solange für einen neu erstellten
überwachten Chat noch ein Zweig aus dieser Quelle aussteht. Senden Sie die erste Nachricht des Chats,
um seinen kanonischen Zweig zu materialisieren, bevor Sie die Quelle archivieren.
Die Archivierung ist ebenfalls gesperrt, wenn OpenClaw weiß, dass eine aktive Bindung Eigentümer des
genauen Ziel-Threads oder eines nicht archivierten erzeugten Nachkommen ist. OpenClaw folgt der
experimentellen Codex-Abfrage nach Nachkommen über alle Seiten hinweg; eine ungültige Antwort,
ein fehlgeschlagener Request, ein wiederholter Cursor oder Thread oder das Erreichen des Sicherheitslimits führt zur Ablehnung
der Archivierung.

Die Lese-, Nachkommen-Aufzählungs- und Archivierungs-Requests bilden keine einzelne bedingte
Operation, sodass zwischen ihnen dennoch ein Turn beginnen kann. Der App-Server-Status wird außerdem
nicht zwischen unabhängigen Prozessen geteilt. Die Bestätigung bildet daher die
Sicherheitsgrenze für unbekannte Clients und dieses Race: Beenden oder überprüfen Sie anderweitig
jeden anderen Client, bevor Sie bestätigen. Stellen Sie einen archivierten Thread mit Codex
Desktop, der Codex CLI oder einem vom Eigentümer autorisierten nativen Thread-Verwaltungsablauf wieder her;
nach dem Dearchivieren erscheint er erneut.

```bash
codex unarchive <thread-id>
```

## Einschränkungen gekoppelter Nodes verstehen

Gekoppelte Nodes stellen die versionierten schreibgeschützten Befehle
`codex.appServer.threads.list.v1` und
`codex.appServer.thread.turns.list.v1` bereit. Native Node-Hosts, auf denen die
Codex CLI verfügbar ist, stellen außerdem den in der Positivliste enthaltenen Befehl `codex.terminal.resume.v1`
bereit. Das Gateway empfängt normalisierte
Metadaten und ausdrücklich angeforderte begrenzte Transkriptseiten, niemals unverarbeitete App-Server-
Endpunkte. Beim Öffnen einer Zeile im Operator-Terminal wird `codex resume <thread-id>`
auf dem zuständigen Host ausgeführt und das PTY dieses Befehls weitergeleitet; dadurch werden weder eine allgemeine
Shell noch vom Gateway bereitgestellte argv-Argumente offengelegt.

Die Terminal-Weiterleitung stellt die Verträge für die Harness-Fortsetzung oder die Archivierungszuständigkeit
nicht bereit. Entfernte Zeilen bleiben daher sichtbar, bieten jedoch weder **Fortsetzen** noch
**Archivieren** an, selbst wenn der entfernte Thread inaktiv ist. Verwenden Sie Codex auf diesem Computer
über **Im Terminal öffnen** oder nutzen Sie einen zukünftigen Fortsetzungsablauf mit einer sicheren
Grenze für die Runner-Zuständigkeit.

## Metadaten und Berechtigungen

Katalogzeilen können Folgendes enthalten:

- Thread- und Sitzungskennungen
- Titel und Arbeitsverzeichnis
- aktueller Status und aktive Warte-Flags
- Zeitstempel für Erstellung, Aktualisierung und Aktivität
- Quelle, Modell-Provider, Version der Codex CLI und Git-Branch

Die Katalogprojektion schließt Transkriptvorschauen, Turns, Rollout-Pfade,
den Codex-Home-Pfad, Git-Remotes, Commit-SHAs und unverarbeitete App-Server-Fehler aus. Der Katalogzugriff
und das Lesen von Transkripten in der Control UI erfordern den Gateway-Scope `operator.write`,
da die Flottenaggregation den Standardpfad `node.invoke` verwendet, obwohl
beide Node-Befehle schreibgeschützt sind.

`supervision.allowRawTranscripts` und `supervision.allowWriteControls` steuern
autonome Agent- und eigenständige MCP-Tools. Beide haben standardmäßig den Wert `false`. Bei
aktivierter Überwachung entfernt `codex_threads` Transkriptvorschauen und Turns aus
Listen- und rein metadatenbezogenen Leseergebnissen, sofern keine Rohtranskripte zulässig sind; ein
Lesevorgang einschließlich Turns schlägt geschlossen fehl. Jeder Fork sowie jedes Umbenennen, Archivieren und Dearchivieren
erfordert Schreibkontrollen. Diese Optionen beschränken weder die authentifizierte Transkriptanzeige der Control UI
noch umgehen sie Prüfungen von Bindung, Host, Status oder Bestätigung.

### Kompatibilitäts-Tools

Das offizielle Plugin `codex` behält die fünf veröffentlichten Supervisor-Tool-Namen für
bestehende Agent- und eigenständige MCP-Clients bei:

- `codex_endpoint_probe`
- `codex_sessions_list`
- `codex_session_read`
- `codex_session_send`
- `codex_session_interrupt`

`codex_sessions_list` umfasst standardmäßig nur geladene Einträge; es gibt keinen Parameter `loaded_only`.
Setzen Sie `include_stored: true`, um zusätzlich nicht archivierte gespeicherte Zeilen aus
der Zustandsdatenbank von Codex zu lesen. Die optionale Obergrenze `max_stored_sessions` ist standardmäßig 200
und akzeptiert 1 bis 1.000 Zeilen pro Endpunkt. Geladene Zeilen werden dadurch nicht begrenzt.
Ohne Berechtigung für Rohtranskripte lassen Listenergebnisse aus Transkripten abgeleitete Namen,
Vorschauen und detaillierte Endpunktfehler aus.
`codex_session_read` erfordert `allowRawTranscripts`; `include_turns: true`
fordert von Codex zusätzlich Turns an.

`codex_session_send` und `codex_session_interrupt` erfordern
`allowWriteControls`. „Senden“ akzeptiert `mode: "auto" | "start" | "steer"`, aber
`"start"` wird immer abgelehnt, und sowohl `"auto"` als auch `"steer"` können nur einen
lesbaren aktiven Turn steuern. Ein inaktiver Thread wird mit dem Hinweis abgelehnt, **Codex-
Sitzungen** zu verwenden, wo das vollständige Harness vor der
Fortsetzung Genehmigungs- und Tool-Handler installiert. Auch das Unterbrechen erfordert einen aktiven lesbaren Turn. Diese Tools
setzen keinen inaktiven Quell-Thread fort und starten ihn auch nicht.

`openclaw doctor --fix` verschiebt einen eingestellten Eintrag `codex-supervisor`, dessen Endpunkt-
und Berechtigungsfelder sowie Plugin-Verweise auf Positiv- und Negativlistenrichtlinien in das offizielle
Plugin `codex`, ohne explizite kanonische Einstellungen zu überschreiben. Der eigenständige
MCP-Kompatibilitätsadapter lädt weiterhin dieselben fünf Tools aus diesem
Plugin; ältere Richtlinien-Umgebungsvariablen gelten nur innerhalb dieses vertrauenswürdigen
Adapters.

Alle Konfigurationsfelder der Überwachung finden Sie in der
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference#supervision).

## Fehlerbehebung

**Es werden keine Sitzungen angezeigt:** Überprüfen Sie, ob `@openclaw/codex` installiert ist, sowohl das
Plugin als auch `supervision.enabled` auf „true“ gesetzt sind, die aktuelle Plugin-Positivliste
`codex` zulässt und die Sitzungen nicht archiviert sind. Starten Sie nach
Änderungen an der Aktivierung das Gateway oder die Node neu.

**Fortsetzen ist deaktiviert:** Eine nicht zugeordnete Zeile ist aktiv, gehört zu einer gekoppelten Node,
ihr Host ist offline oder eine andere Aktion steht aus. Gateway-lokale gespeicherte und inaktive
Zeilen bieten **Als Zweig fortsetzen** statt einer unsicheren Übernahme des exakten Threads an. Eine Zeile,
die bereits einen überwachten Chat besitzt, bietet **Chat öffnen** an.

**Archivieren ist deaktiviert:** Die Archivierung ist für Gateway-lokale Zeilen im Zustand „gespeichert/Aktivität unbekannt“ und
„inaktiv“ verfügbar, nachdem bestätigt wurde, dass kein anderer Runner aktiv ist. Aktive Zeilen, Fehlerzeilen,
Offline-Zeilen, Zeilen gekoppelter Nodes, Zeilen mit ausstehendem Zweig und Zeilen mit bekanntem Eigentümer einer exakten Bindung bleiben
für die Archivierung schreibgeschützt.

**Eine archivierte Sitzung ist verschwunden:** Dies ist erwartetes Verhalten. Die Überwachungsseite bietet
keine Archivansicht. Führen Sie `codex unarchive <thread-id>` aus oder verwenden Sie Codex Desktop, um
sie wieder anzuzeigen.

**Die alte Konfiguration `codex-supervisor` ist noch vorhanden:** Führen Sie `openclaw doctor --fix` aus. Doctor
verschiebt den eingestellten Plugin-Eintrag und die zugehörigen Verweise auf Plugin-Richtlinien nach
`plugins.entries.codex.config.supervision`, ohne explizite Codex-
Einstellungen zu überschreiben.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Referenz](/de/plugins/codex-harness-reference)
- [Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime)
- [Architektur der Codex-Überwachung](/de/specs/codex-supervision)
- [Nodes](/de/nodes)
- [Gateway-Sicherheit](/de/gateway/security)
