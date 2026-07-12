---
read_when:
    - Sie möchten, dass Codex-Desktop- oder CLI-Sitzungen in OpenClaw angezeigt werden
    - Sie müssen von einer gespeicherten oder inaktiven lokalen Codex-Sitzung einen Branch erstellen oder sie archivieren
    - Sie machen Codex-Sitzungen und den Transkriptverlauf von gekoppelten Nodes zugänglich.
sidebarTitle: Codex supervision
summary: Durchsuchen Sie nicht archivierte native Codex-Sitzungen und paginierte Transkripte über OpenClaw-Nodes hinweg
title: Codex-Sitzungen überwachen
x-i18n:
    generated_at: "2026-07-12T15:40:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e9378214df3f400b793b4a2c7bd91fb607a73910d4046f69d26debe308869df6
    source_path: plugins/codex-supervision.md
    workflow: 16
---

Die Codex-Überwachung ist eine optionale Funktion des offiziellen `codex`-Plugins. Sie
zeigt nicht archivierte Codex-Desktop- und CLI-Quellsitzungen vom Gateway-
Computer und von angemeldeten gekoppelten Computern in der normalen Sitzungsseitenleiste und im Chat-Bereich an.

Die erste Version hält den Zuständigkeitsbereich bewusst eng:

- Eine gespeicherte oder inaktive lokale Sitzung kann aus ihrem begrenzten
  persistenten Benutzer- und Assistentenverlauf einen modellgebundenen OpenClaw-Chat erstellen.
  Die erste Nachricht startet zunächst einen nativen Snapshot-Fork und dann den
  vollständigen Codex-Harness-Thread mit genau dem Modell und Provider, die Codex App Server
  für diesen Fork ausgewählt hat. Bei späteren Interaktionen wird das persistente Paar des
  kanonischen nativen Threads wiederhergestellt, während die überwachte Bindung verhindert,
  dass OpenClaw eine andere Runtime, ein anderes Modell oder einen Fallback einsetzt. Ein
  separates natives Codex-Steuerelement kann dieses persistente Paar weiterhin ändern. Ein
  bereits erstellter Branch öffnet seinen vorhandenen Chat.
- Bei einer gespeicherten Sitzung, die von einem anderen Codex-Prozess erkannt wurde, ist die
  aktuelle Aktivität unbekannt. Sie kann verzweigt oder erst dann archiviert werden, nachdem
  der Operator bestätigt hat, dass kein anderer Codex-Client sie verwendet.
- Eine aktive Quelle bleibt sichtbar, kann jedoch weder einen Branch erstellen noch archiviert
  werden, bis ihre aktuelle Interaktion abgeschlossen ist. Wenn sie bereits über einen
  überwachten Chat verfügt, bleibt **Chat öffnen** verfügbar.
- Eine Sitzung auf einem gekoppelten Node stellt ihr persistentes Transkript über begrenzte,
  per Cursor paginierte App-Server-Lesevorgänge bereit. Die Fortsetzung aus der Ferne
  erfordert eine zukünftige Streaming-Node-Bridge; die Remote-Archivierung erfordert zusätzlich
  einen Lease für die Runner-Zuständigkeit oder eine gleichwertige Absicherung.
- Archivierte Sitzungen werden nicht aufgeführt. Eine gespeicherte oder inaktive lokale Sitzung
  kann erst archiviert werden, nachdem der Operator bestätigt hat, dass kein anderer
  Codex-Client sie verwendet.

## Bevor Sie beginnen

- Installieren Sie das offizielle `@openclaw/codex`-Plugin auf dem Gateway. Die OpenClaw-
  macOS-App kann es installieren, wenn Sie Codex-Funktionen aktivieren; bei CLI-Installationen
  können Sie `openclaw plugins install @openclaw/codex` ausführen.
- Installieren Sie Codex Desktop oder die Codex CLI auf jedem Computer, dessen Sitzungen
  Sie auflisten möchten, und melden Sie sich dort an.
- Koppeln Sie Remote-Computer als OpenClaw-Nodes. Jeder Computer muss sich lokal anmelden;
  die alleinige Aktivierung der Überwachung auf dem Gateway autorisiert keinen anderen Node.
- Verwenden Sie ein vom Eigentümer kontrolliertes Gateway. Sitzungstitel, Arbeitsverzeichnisse
  und Git-Branches können vertrauliche Projektinformationen offenlegen.

## Überwachung aktivieren

Die geführte Einrichtung mit `openclaw onboard` und die Ersteinrichtung unter macOS versuchen,
die Codex-Überwachung zu installieren und zu aktivieren, nachdem eine native Codex-Installation
erkannt und das ausgewählte Inferenz-Backend erfolgreich aktiviert wurde. Codex muss nicht das
primäre Backend sein. Die Überwachung wird verfügbar, wenn diese opportunistische
Plugin-Aktivierung erfolgreich ist. Die Verfügbarkeit von App Server wird geprüft, wenn die
Überwachung erstmals eine Verbindung herstellt. Eine ausdrückliche Deaktivierung des Codex-Plugins
oder eine Richtliniensperre verhindert die opportunistische Aktivierung, und eine vorhandene
explizite Einstellung `supervision.enabled: false` deaktiviert die agentenseitigen
Überwachungswerkzeuge; der Operator-Katalog bleibt registriert, solange das Codex-Plugin aktiv ist.
Bei bestehenden Installationen kann dieselbe Funktion manuell aktiviert werden:

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

Falls `plugins.allow` vorhanden ist, nehmen Sie `codex` auf. Starten Sie das Gateway nach
Änderungen an der Plugin-Aktivierung neu.

Ohne explizite `appServer`-Verbindungseinstellungen verwendet die Überwachung eine separate,
verwaltete stdio-Überwachungsverbindung zum nativen Codex-Benutzerverzeichnis. Der gewöhnliche
Codex-Harness bleibt standardmäßig agentenspezifisch. Dadurch werden native Sitzungen in beiden
Apps sichtbar, ohne dass gewöhnliche OpenClaw-Interaktionen den nativen Codex-Zustand gemeinsam
nutzen. Legen Sie `appServer.homeScope: "user"` explizit fest, wenn auch der Harness diesen Zustand
gemeinsam nutzen soll. Die Überwachung berücksichtigt explizite `appServer`-Verbindungseinstellungen,
anstatt sie durch ihre lokale Standardeinstellung für das Benutzerverzeichnis zu ersetzen.

Ein aus der Seitenleistengruppe **Codex** übernommener Chat ist keine gewöhnliche Harness-Sitzung.
Seine private Überwachungsbindung verwendet die Überwachungsverbindung für das Lesen der Quelle,
die Erstellung des kanonischen Branches, die Einspeisung des Verlaufs und jede spätere Interaktion.
Mit der lokalen Standardverbindung bleiben dadurch das native Codex-Benutzerverzeichnis, die
Authentifizierung und die Provider-Konfiguration erhalten, ohne den Standard für andere Sitzungen
zu ändern.

Bei der lokalen Standardüberwachungsverbindung wird der Speicher mit nativen Codex-Clients geteilt.
OpenClaw geht nicht davon aus, dass ein anderer Client denselben laufenden App-Server-Prozess nutzt,
und die native Statuszuständigkeit ist prozesslokal. Daher behandelt OpenClaw einen Thread, den sein
Überwachungs-App-Server als `notLoaded` meldet, als **Gespeichert / Aktivität unbekannt** und nicht
als inaktiv.

Wenden Sie dieselbe Anmeldung auf jedem Headless-Node-Host an, dessen Sitzungen angezeigt werden
sollen. Die native OpenClaw-macOS-App liest dieselbe lokale Einstellung, wenn sie ihren
Codex-Katalog am gekoppelten Gateway bekannt gibt. Dieser gekoppelte native Mac-Katalog unterstützt
nur die standardmäßige oder explizite Einstellung `appServer.transport: "stdio"` mit einer nicht
gesetzten oder expliziten Einstellung `appServer.homeScope: "user"`. `command`, `args` und
`clearEnv` werden für diesen stdio-Prozess berücksichtigt. Wenn die Mac-Konfiguration `"unix"`,
`"websocket"` oder `homeScope: "agent"` auswählt, gibt die App weder die Katalogfunktion noch den
Befehl bekannt, und ein veralteter direkter Aufruf schlägt fehl, anstatt das Codex-Benutzerverzeichnis
freizugeben oder einen anderen lokalen stdio-App-Server zu starten.

Ein neu bekannt gegebener Node-Befehl ändert die genehmigte Befehlsoberfläche des Nodes.
Genehmigen Sie die Aktualisierung vom Gateway-Host aus:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

Nicht archivierte Codex-Sitzungen werden auch in der Seitenleiste der Haupt-Control-UI angezeigt,
nach Host gruppiert. Wählen Sie eine aus, um ihr persistentes Transkript zu lesen. Der Betrachter
verwendet die neueste Codex-API `thread/turns/list` mit `itemsView: "full"` und lädt höchstens
20 Interaktionen pro Anfrage; **Ältere Transkriptelemente laden** folgt dem undurchsichtigen
App-Server-Cursor der neuesten Seite. Geladene Seiten werden in chronologischer Reihenfolge
dargestellt. Der Betrachter lädt niemals einen unbegrenzten `thread/read`-Verlauf. Eine Seite
oberhalb der Transportsicherheitsgrenze von 20 MiB schlägt sicher fehl, anstatt die Node- oder
Gateway-Verbindung zu gefährden.

Öffnen Sie die Gruppe **Codex** in der normalen Sitzungsseitenleiste. Sie führt dieselben Sitzungen
nach Host gruppiert auf. **Weitere Sitzungen laden** hängt die nächste Seite jedes Hosts an, der
ältere Zeilen besitzt, und diese angehängten Zeilen bleiben bei der regelmäßigen Aktualisierung der
Seitenleiste erhalten. Jede zurückgegebene Suchseite durchsucht eine begrenzte Anzahl nativer Seiten
pro Host, anstatt die Anfrage an App Server zu senden, da die native Suche auch mit
Transkriptvorschauen übereinstimmen kann.

Hostverfügbarkeit und Threadstatus sind voneinander getrennt. **Offline** oder **Nicht verfügbar**
beschreibt eine Host-Aktualisierung; ein nicht verfügbarer Host gibt keine neuen Sitzungszeilen
zurück und ändert den nativen Status eines Threads nicht in `offline`. Sitzungszeilen verwenden
Codex-Statuswerte wie `idle`, `active`, `notLoaded` oder Fehler. Ein ausgefallener Host blendet
Ergebnisse funktionsfähiger Hosts nicht aus.

## Operator-CLI verwenden

Die Terminal-CLI stellt denselben nicht archivierten Katalog sowie lokale Branch- und
Archivierungsaktionen des Gateways bereit:

```bash
openclaw codex sessions [--search <text>] [--host <id>] [--limit <count>] [--cursor <cursor>] [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
openclaw codex continue <thread-id> [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
openclaw codex archive <thread-id> --confirm-no-other-runner [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
```

Optionen für `openclaw codex sessions`:

- `--search <text>` durchsucht Sitzungstitel ohne Beachtung der Groß-/Kleinschreibung.
- `--host <id>` beschränkt die Antwort auf einen stabilen Katalog-Host, beispielsweise
  `gateway:local` oder `node:<node-id>`.
- `--limit <count>` legt 1 bis 100 Zeilen pro Host fest; der Standardwert ist 50.
- `--cursor <cursor>` setzt eine Hostseite fort und erfordert daher `--host`.
- `--json` gibt die strukturierte Gateway-Antwort aus.

Alle drei Befehle übernehmen `--url`, `--token` und `--timeout <ms>` vom Gateway-Client.
Die Sitzungsauflistung verwendet standardmäßig 75,000 ms, damit kalte Kataloge gekoppelter Nodes
abgeschlossen werden können; für Fortsetzung und Archivierung gilt standardmäßig 30,000 ms.
Sie stellen außerdem den gemeinsamen Schalter `--expect-final` bereit, der diese unären
Überwachungs-RPCs nicht verändert. Jeder Befehl erfordert den Gateway-Bereich `operator.write`.
Die Standardausgabe von `-h, --help` ist für jeden Unterbefehl verfügbar.
Es gibt keine Option für archivierte oder einschließlich archivierter Sitzungen. `sessions` kann
gekoppelte Hosts auflisten, aber `continue` und `archive` beziehen sich immer auf `gateway:local`;
gekoppelte Zeilen können nur aufgelistet werden. Für die Archivierung ist immer
`--confirm-no-other-runner` erforderlich.

Diese Shell-Befehle unterscheiden sich von den `/codex`-Runtime-Befehlen im Chat.
`/codex threads [filter]` listet App-Server-Threads auf, die für die aktuelle
Konversationsverbindung verfügbar sind. `/codex sessions --host <node>` listet fortsetzbare
Codex-CLI-Sitzungsdateien auf einem Node auf, nicht den Flottenkatalog der Überwachung. `/codex
resume` und `/codex bind` binden die aktuelle Konversation an, anstatt einen sicheren überwachten
Branch zu erstellen, und ein modellgebundener überwachter Chat lehnt diese Bindungsänderungen ab.
Es gibt keinen Runtime-Befehl `/codex continue` oder `/codex archive`.

## Branch aus einer lokalen Sitzung erstellen

Wählen Sie **Als Branch fortsetzen** in einer gespeicherten oder inaktiven Zeile des
Gateway-Computers. OpenClaw erstellt einen normalen Chat-Eintrag, spiegelt den begrenzten Benutzer-
und Assistentenverlauf bis einschließlich der letzten persistenten terminalen Interaktion der Quelle
(abgeschlossen, unterbrochen oder fehlgeschlagen), zeichnet einen ausstehenden Harness-Branch auf
und öffnet den Chat. Die generische Modellauswahl ist gesperrt, aber es wurde noch kein konkretes
Modell und kein Provider ausgewählt. Die Quelle wird nicht fortgesetzt, und der kanonische
Harness-Thread wurde noch nicht gestartet. Bei Wiederholung der Aktion wird der vorhandene Chat
geöffnet, anstatt einen weiteren Branch zu erstellen.

Die Spiegelung behält den neuesten sichtbaren Abschnitt bei, der alle drei Grenzwerte einhält:
höchstens 200 Benutzer- oder Assistentennachrichten, insgesamt 512 KiB UTF-8-Text und 64 KiB pro
Nachricht. Zu große Nachrichten werden mit einer Markierung gekürzt, und ältere Nachrichten werden
weggelassen, wenn ein Grenzwert erreicht wird. Eine Bild- oder lokales-Bild-Eingabe wird zum
wörtlichen Platzhalter `[Image attachment]`; Bilddaten und lokale Pfade werden nicht kopiert.

Senden Sie die erste normale Chat-Nachricht, um mit der Arbeit zu beginnen. Der Codex-Harness
installiert die echten Handler für Genehmigungen, Abfragen, Ereignisse und Zustellung. Er verwendet
einen temporären nativen Fork über die Überwachungsverbindung, um den Quell-Snapshot zu fixieren,
ohne eine Modell- oder Provider-Überschreibung anzugeben. Codex App Server wählt beide aus seiner
aktuellen nativen Konfiguration aus und gibt die tatsächliche Auswahl zurück. Über dieselbe
Verbindung startet OpenClaw den kanonischen vollständigen Harness-Thread mit `appServer` als Quelle
unter dessen cwd- und Runtime-Richtlinie mit genau diesem zurückgegebenen Paar, speist den begrenzten
sichtbaren Verlauf ein und archiviert den temporären Fork. Der kanonische Thread verfügt über die
vollständige OpenClaw-Harness-Werkzeugoberfläche. Dies ist ein Branch des sichtbaren Verlaufs und
kein vollständiger Klon des nativen Rollouts: Schlussfolgerungen, Werkzeugaufrufe und
Werkzeugergebnisse der Quelle werden weggelassen. Diese und jede spätere Interaktion verbleibt auf
der überwachten Codex-Verbindung und wechselt weder zu einer anderen OpenClaw-Modell-Runtime noch
zum gewöhnlichen Harness im Agentenverzeichnis.

Die zurückgegebene Auswahl ist kein Nachweis für das historische Modell der Quelle. Wenn sich die
aktuelle native Konfiguration von dem für die letzte Interaktion der Quelle aufgezeichneten Modell
unterscheidet, gibt Codex seine normale Warnung über die Modellabweichung aus. OpenClaw verwendet
das zurückgegebene Paar für den Start des kanonischen Threads. Codex speichert das native Modell und
den Provider dieses kanonischen Threads dauerhaft, und spätere Fortsetzungen behalten beide bei,
da OpenClaw Überschreibungen für Modell und Provider auslässt. Wenn der kanonische Thread über ein
separates natives Codex-Steuerelement geändert wird, übernimmt OpenClaw die von Codex persistierte
Auswahl. OpenClaw setzt niemals sein äußeres Modell oder seine Fallback-Kette ein.

Der überwachte, modellgebundene Chat kann nicht gelöscht werden, das Modell nicht wechseln, `/new`
oder `/reset` nicht verwenden, die Aktion zum Zurücksetzen der Gateway-Sitzung nicht aufrufen und die allgemeine
Aktion **Sitzung forken** nicht verwenden. Verändernde Aufrufe von `/codex model <model>`, `/codex
bind`, `/codex resume` (einschließlich einer Node-Sitzung mit `--bind here`) sowie
`/codex detach` oder `/codex unbind` werden ebenfalls abgelehnt, da sie die gesperrte
native Bindung ersetzen oder löschen würden. Die Abfrage `/codex model` sowie `/codex fast`,
`/codex permissions` und `/codex threads` bleiben verfügbar. Starten Sie eine weitere
gewöhnliche Sitzung, wenn Sie ein anderes Modell oder einen neuen Thread verwenden möchten.

Lassen Sie die Überwachung für diesen Chat aktiviert. Wenn die Überwachung deaktiviert wird oder die
gespeicherte Verbindungsbindung nicht mehr verfügbar oder inkonsistent ist, schlägt der Turn
geschlossen fehl, statt zu einer gewöhnlichen Sitzung im Agent-Home zu wechseln.

Das Deaktivieren oder Deinstallieren des Plugins `codex` gibt diese Eigentümerschaft nicht frei und
macht den Chat nicht für ein anderes Modell verfügbar. Der gesperrte Chat bleibt erhalten, ist jedoch
nicht verfügbar. Installieren Sie dasselbe Plugin erneut oder aktivieren Sie es wieder und starten Sie den Gateway neu,
um den Chat fortzusetzen. Dieses absichtliche Fail-Closed-Verhalten verhindert, dass eine Aufbewahrungsbereinigung oder ein
vorübergehender Plugin-Ausfall die native Bindung unbemerkt verwaist.

Das Agent-Tool `codex_threads` folgt derselben Grenze. Es kann weder einen
anderen Fork anhängen noch den gebundenen nativen Thread des Chats archivieren. Listen- und reine Metadaten-
Lesevorgänge bleiben verfügbar. Das Lesen von Rohtranskripten erfordert `allowRawTranscripts`.
Wenn der Rohzugriff deaktiviert ist, lehnt `codex_threads` auch die Listensuche ab, da
die native Suche Transkriptvorschauen enthält. Die Control UI und die Operator-CLI
bieten weiterhin eine begrenzte Suche ausschließlich nach Titeln. Umbenennen, Dearchivieren, ein abgetrennter Fork und
das Archivieren eines fremden Threads ohne Eigentümerbindung erfordern
`allowWriteControls`. Keine der beiden Optionen umgeht die gesperrte Bindung.

OpenClaw abonniert oder beantwortet keine Genehmigungsanfragen, während lediglich
der Quell-Thread aufgelistet oder der ausstehende Chat angezeigt wird. Wenn beim ersten Turn ein separater kanonischer
Harness-Thread gestartet wird, kann ein anderer Codex-Prozess weiterhin Eigentümer der
Quelle bleiben, ohne konkurrierende Rollout-Schreiber zu erzeugen.

Die ursprüngliche CLI- oder VS-Code-Quelle bleibt für native Clients und den
OpenClaw-Katalog sichtbar. Der kanonische Branch wird als nativer Codex-Thread gespeichert, aber
seine Quellart ist `appServer`. Codex Desktop oder ein anderer nativer Client kann
diese Quellart herausfiltern, sodass nicht garantiert ist, dass der Branch selbst in jeder
nativen Verlaufsansicht erscheint.

Eine aktive Zeile, die vom App Server von OpenClaw gemeldet wird, kann keinen neuen Branch starten. Warten Sie,
bis der aktuelle Turn abgeschlossen ist, und aktualisieren Sie den Katalog. Der Codex App Server
serialisiert Änderungen innerhalb eines Prozesses, stellt jedoch weder einen exklusiven
prozessübergreifenden Runner noch eine Lease für den Eigentümer von Genehmigungen bereit.

Bei einer Zeile mit **Gespeichert / Aktivität unbekannt** verwenden die Chat-Spiegelung und der Snapshot-Pin
des ersten Turns den Zustand von Codex bis zum letzten abschließend persistierten Turn. Der Quell-
Thread wird weder fortgesetzt noch unterbrochen oder archiviert. Wenn ein anderer Prozess einen
laufenden Turn hat, sind dessen neueste noch laufende Arbeiten möglicherweise nicht im Branch enthalten.

## Eine lokale Sitzung archivieren

Wählen Sie **Archivieren** für eine gespeicherte oder inaktive Gateway-lokale Zeile und bestätigen Sie anschließend, dass kein
anderer Codex-Client oder OpenClaw-Runner diesen Thread oder seine erzeugten
Nachfolger verwendet. OpenClaw liest den prozesslokalen Status neu ein, fährt nur bei
`idle` oder `notLoaded` fort, ruft die native Codex-Archivierungsoperation auf und entfernt die
Sitzung aus der Liste der nicht archivierten Sitzungen. Native Codex versucht außerdem, die
erzeugten Nachfolger des Threads zu archivieren.

Die Archivierung ist nicht verfügbar, wenn die neue Abfrage die Sitzung als aktiv oder in einem
Fehlerzustand meldet, wenn sie zu einer gekoppelten Node gehört oder solange ein neu erstellter
überwachter Chat noch einen ausstehenden Branch aus dieser Quelle besitzt. Senden Sie die erste
Nachricht des Chats, um seinen kanonischen Branch zu materialisieren, bevor Sie die Quelle archivieren.
Die Archivierung wird außerdem blockiert, wenn OpenClaw weiß, dass eine aktive Bindung Eigentümerin des
exakten Ziel-Threads oder eines nicht archivierten erzeugten Nachfolgers ist. OpenClaw folgt der
experimentellen Codex-Nachfolgerabfrage über alle Seiten hinweg. Eine ungültige Antwort,
ein Anfragefehler, ein wiederholter Cursor oder Thread oder das Ausschöpfen des Sicherheitslimits führt zur Ablehnung
der Archivierung.

Die Lese-, Nachfolgeraufzählungs- und Archivierungsanfragen bilden keine einzelne bedingte
Operation, sodass zwischen ihnen weiterhin ein Turn starten kann. Der App-Server-Status wird außerdem
nicht zwischen unabhängigen Prozessen geteilt. Die Bestätigung bildet daher die
Sicherheitsgrenze für unbekannte Clients und dieses Race: Beenden Sie alle anderen Clients oder
überprüfen Sie sie anderweitig, bevor Sie bestätigen. Stellen Sie einen archivierten Thread mit Codex
Desktop, der Codex CLI oder einem vom Eigentümer autorisierten nativen Thread-Verwaltungsablauf wieder her.
Nach dem Dearchivieren erscheint er erneut.

```bash
codex unarchive <thread-id>
```

## Grenzen gekoppelter Nodes verstehen

Gekoppelte Nodes stellen die versionierten schreibgeschützten Befehle
`codex.appServer.threads.list.v1` und
`codex.appServer.thread.turns.list.v1` bereit. Der Gateway empfängt normalisierte
Metadaten und ausdrücklich angeforderte begrenzte Transkriptseiten, niemals rohe App-Server-
Endpunkte. Der aktuelle Node-Aufruftransport unterstützt nur Anfrage und Antwort und kann daher den langlebigen Ereignis-,
Genehmigungs- und Streaming-Lebenszyklus nicht übertragen, den das Codex-Harness benötigt.

Aus diesem Grund bleiben entfernte Zeilen sichtbar, bieten jedoch weder **Fortsetzen** noch
**Archivieren** an, selbst wenn der entfernte Thread inaktiv ist. Verwenden Sie Codex auf diesem Computer,
bis eine Node-seitige Streaming-Runner-Bridge für die Fortsetzung und eine sichere
Grenze für die Runner-Eigentümerschaft bei der Archivierung vorhanden sind.

## Metadaten und Berechtigungen

Katalogzeilen können Folgendes enthalten:

- Thread- und Sitzungskennungen
- Titel und Arbeitsverzeichnis
- aktueller Status und aktive Warte-Flags
- Zeitstempel für Erstellung, Aktualisierung und Aktivität
- Quelle, Modell-Provider, Codex-CLI-Version und Git-Branch

Die Katalogprojektion schließt Transkriptvorschauen, Durchläufe, Rollout-Pfade,
den Codex-Home-Pfad, Git-Remotes, Commit-SHAs und unbearbeitete App-Server-Fehler aus. Für den Katalogzugriff
und das Lesen von Transkripten in der Control UI ist der Gateway-Berechtigungsumfang `operator.write`
erforderlich, da die Flottenaggregation den standardmäßigen `node.invoke`-Pfad verwendet, obwohl
beide Node-Befehle schreibgeschützt sind.

`supervision.allowRawTranscripts` und `supervision.allowWriteControls` steuern
autonome Agenten und eigenständige MCP-Tools. Beide sind standardmäßig auf `false` gesetzt. Bei
aktivierter Überwachung entfernt `codex_threads` Transkriptvorschauen und Durchläufe aus
Listen- und reinen Metadaten-Leseergebnissen, sofern unbearbeitete Transkripte nicht zulässig sind; ein
Lesevorgang einschließlich Durchläufen schlägt sicher geschlossen fehl. Für jedes Forken, Umbenennen, Archivieren und Wiederherstellen
sind Schreibsteuerungen erforderlich. Diese Optionen beschränken nicht die authentifizierte Anzeige von Transkripten in der Control UI
und umgehen keine Prüfungen von Bindung, Host, Status oder Bestätigung.

### Kompatibilitätstools

Das offizielle `codex`-Plugin behält die fünf ausgelieferten Supervisor-Toolnamen für
bestehende Agenten- und eigenständige MCP-Clients bei:

- `codex_endpoint_probe`
- `codex_sessions_list`
- `codex_session_read`
- `codex_session_send`
- `codex_session_interrupt`

`codex_sessions_list` umfasst standardmäßig nur geladene Sitzungen; es gibt keinen Parameter `loaded_only`.
Setzen Sie `include_stored: true`, um zusätzlich nicht archivierte, gespeicherte Zeilen aus
der Zustandsdatenbank von Codex zu lesen. Die optionale Obergrenze `max_stored_sessions` beträgt standardmäßig 200
und akzeptiert 1 bis 1.000 Zeilen pro Endpunkt. Sie begrenzt geladene Zeilen nicht.
Ohne Berechtigung für unbearbeitete Transkripte enthalten Listenergebnisse keine aus Transkripten abgeleiteten Namen,
Vorschauen und detaillierten Endpunktfehler.
`codex_session_read` erfordert `allowRawTranscripts`; `include_turns: true`
fordert von Codex zusätzlich Durchläufe an.

`codex_session_send` und `codex_session_interrupt` erfordern
`allowWriteControls`. Beim Senden wird `mode: "auto" | "start" | "steer"` akzeptiert, aber
`"start"` wird immer abgelehnt, und sowohl `"auto"` als auch `"steer"` können nur einen
lesbaren aktiven Durchlauf steuern. Ein inaktiver Thread wird mit dem Hinweis abgelehnt, **Codex
Sessions** zu verwenden, wo das vollständige Harness vor der Fortsetzung Handler für Genehmigungen und Tools
installiert. Eine Unterbrechung erfordert ebenfalls einen aktiven lesbaren Durchlauf. Diese Tools
setzen einen inaktiven Quell-Thread weder fort noch starten sie ihn.

`openclaw doctor --fix` verschiebt einen eingestellten `codex-supervisor`-Eintrag, dessen Endpunkt-
und Berechtigungsfelder sowie Verweise auf die Plugin-Zulassungs-/Ablehnungsrichtlinie in das offizielle
`codex`-Plugin, ohne explizite kanonische Einstellungen zu überschreiben. Der eigenständige
Kompatibilitäts-MCP-Adapter lädt weiterhin dieselben fünf Tools aus diesem
Plugin; veraltete Richtlinien-Umgebungsvariablen gelten nur innerhalb dieses vertrauenswürdigen
Adapters.

Alle Konfigurationsfelder für die Überwachung finden Sie in der
[Codex-Harness-Referenz](/de/plugins/codex-harness-reference#supervision).

## Fehlerbehebung

**Es werden keine Sitzungen angezeigt:** Vergewissern Sie sich, dass `@openclaw/codex` installiert ist, sowohl das
Plugin als auch `supervision.enabled` aktiviert sind, die aktuelle Plugin-Zulassungsliste
`codex` zulässt und die Sitzungen nicht archiviert sind. Starten Sie den Gateway oder Node neu,
nachdem Sie die Aktivierung geändert haben.

**„Fortsetzen“ ist deaktiviert:** Eine nicht zugeordnete Zeile ist aktiv, gehört zu einem gekoppelten Node,
ihr Host ist offline oder eine andere Aktion steht aus. Im Gateway lokal gespeicherte und inaktive
Zeilen bieten **Als Branch fortsetzen** anstelle einer unsicheren Übernahme des exakten Threads. Eine Zeile,
für die bereits ein überwachter Chat vorhanden ist, bietet **Chat öffnen**.

**„Archivieren“ ist deaktiviert:** Die Archivierung ist für gespeicherte Zeilen bzw. Zeilen mit unbekannter Aktivität und
inaktive, Gateway-lokale Zeilen verfügbar, nachdem bestätigt wurde, dass kein anderer Runner vorhanden ist. Aktive Zeilen sowie Zeilen mit Fehlern,
offline befindliche Zeilen, Zeilen eines gekoppelten Nodes, Zeilen mit ausstehendem Branch und Zeilen mit bekanntem Besitzer der exakten Bindung bleiben
für die Archivierung schreibgeschützt.

**Eine archivierte Sitzung ist verschwunden:** Dies ist zu erwarten. Die Überwachungsseite bietet
keine Archivansicht. Führen Sie `codex unarchive <thread-id>` aus oder verwenden Sie Codex Desktop, um
sie wieder anzuzeigen.

**Die alte `codex-supervisor`-Konfiguration ist noch vorhanden:** Führen Sie `openclaw doctor --fix` aus. Doctor
verschiebt den veralteten Plugin-Eintrag und die zugehörigen Plugin-Richtlinienreferenzen nach
`plugins.entries.codex.config.supervision`, ohne explizite Codex-Einstellungen
zu überschreiben.

## Verwandte Themen

- [Codex-Harness](/de/plugins/codex-harness)
- [Codex-Harness-Referenz](/de/plugins/codex-harness-reference)
- [Codex-Harness-Laufzeit](/de/plugins/codex-harness-runtime)
- [Architektur der Codex-Überwachung](/de/specs/codex-supervision)
- [Nodes](/de/nodes)
- [Gateway-Sicherheit](/de/gateway/security)
