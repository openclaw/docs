---
read_when:
    - Koppeln oder erneutes Verbinden des iOS-Node
    - Direkten Apple-Watch-Node aktivieren oder Fehler beheben
    - Ausführen der iOS-App aus dem Quellcode
    - Fehlerbehebung bei der Gateway-Erkennung oder bei Canvas-Befehlen
summary: 'iOS-Node-App: Verbindung mit dem Gateway, Kopplung, Canvas und Fehlerbehebung'
title: iOS-App
x-i18n:
    generated_at: "2026-07-12T21:39:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bf3c90d9b9be2fdfd1e4b85eebe9b79fe17a8f4aeaf05b60d4911c781e87c075
    source_path: platforms/ios.md
    workflow: 16
---

Verfügbarkeit: iPhone-App-Builds werden über Apple-Kanäle verteilt, wenn dies für ein Release aktiviert ist. Lokale Entwicklungs-Builds können auch aus dem Quellcode ausgeführt werden.

## Funktionsumfang

- Stellt über WebSocket eine Verbindung zu einem Gateway her (LAN oder Tailnet).
- Stellt Node-Funktionen bereit: Canvas, Bildschirmaufnahme, Kameraaufnahme, Standort, Gesprächsmodus, Sprachaktivierung und optional aktivierte Gesundheitszusammenfassungen.
- Empfängt `node.invoke`-Befehle und meldet Node-Statusereignisse.
- Ermöglicht auf der Agents-Oberfläche (Dateien) schreibgeschützten Zugriff auf den Arbeitsbereich des ausgewählten Agenten: Navigation durch Verzeichnisse, Textvorschauen mit Syntaxhervorhebung, Bildvorschauen und Export über das Teilen-Menü. Keine Schreibvorgänge; die Größe der Vorschauen wird vom Gateway begrenzt.
- Verwaltet pro gekoppeltem Gateway einen kleinen schreibgeschützten Offline-Cache der letzten Chatsitzungen und Transkripte: Bei einem Kaltstart wird sofort das zuletzt bekannte Transkript angezeigt und aktualisiert, sobald das Gateway antwortet. Kürzlich verwendete Chats bleiben auch ohne Verbindung durchsuchbar, und Zurücksetzen/Vergessen löscht den geschützten lokalen Cache.
- Reiht Textnachrichten, die bei getrennter Verbindung gesendet werden, in eine dauerhafte Ausgangswarteschlange pro Gateway ein (bis zu 50): Eingereihte Nachrichtenblasen werden im Transkript angezeigt, beim erneuten Verbinden in der richtigen Reihenfolge mit idempotenten Wiederholungsversuchen gesendet und bleiben erhalten, bis der kanonische Verlauf den Versand bestätigt. Vor dem Anzeigen einer Aktion zum erneuten Versuchen/Löschen erfolgen Wiederholungsversuche mit zunehmenden Wartezeiten. Nach 48 Stunden ohne Verbindung verfallen sie, statt gesendet zu werden; Zurücksetzen/Vergessen löscht die Warteschlange zusammen mit dem Cache.
- Liest Nachrichten des Assistenten auf Anforderung vor: Halten Sie eine Nachricht im Chat gedrückt und wählen Sie **Anhören**. Die App spielt unterstützte `tts.speak`-Clips des Gateways mit dem konfigurierten TTS-Provider ab und greift auf die Sprachausgabe des Geräts zurück, wenn Gateway-Audio nicht verfügbar oder nicht abspielbar ist. Die Wiedergabe wird beim Wechsel der Sitzung oder beim Verschieben in den Hintergrund beendet.

## Anforderungen

- Ein Gateway, das auf einem anderen Gerät ausgeführt wird (macOS, Linux oder Windows über WSL2).
- Netzwerkpfad:
  - Dasselbe LAN über Bonjour, **oder**
  - Tailnet über Unicast-DNS-SD (Beispieldomäne: `openclaw.internal.`), **oder**
  - Manueller Host/Port (Fallback).

## Schnellstart (koppeln und verbinden)

1. Starten Sie ein authentifiziertes Gateway mit einer Route, die Ihr Telefon erreichen kann. Tailscale
   Serve ist der empfohlene Remote-Pfad:

```bash
openclaw gateway --port 18789 --tailscale serve
```

Verwenden Sie für eine vertrauenswürdige Einrichtung im selben LAN stattdessen ein authentifiziertes `gateway.bind: "lan"`.
Die standardmäßige Loopback-Bindung ist von einem Telefon aus nicht erreichbar. Wenn das
Gateway noch nicht konfiguriert wurde, führen Sie zuerst `openclaw onboard` aus, damit für die
Erstellung des Einrichtungscodes ein Authentifizierungspfad mit Token oder Passwort verfügbar ist.

2. Öffnen Sie die [Control UI](/de/web/control-ui), wählen Sie **Nodes** und klicken Sie
   auf der Seite **Devices** auf **Pair mobile device**.

3. Öffnen Sie in der iOS-App **Settings** -> **Gateway**, scannen Sie den QR-Code (oder fügen Sie
   den Einrichtungscode ein) und stellen Sie die Verbindung her.

   Wenn der Einrichtungscode sowohl LAN- als auch Tailscale-Serve-Routen enthält, prüft die App
   diese der Reihe nach und speichert den ersten erreichbaren Endpunkt.

4. Die offizielle App stellt automatisch eine Verbindung her. Wenn **Pending approval** eine
   Anfrage anzeigt, prüfen Sie deren Rolle und Bereiche, bevor Sie sie genehmigen.

Die Schaltfläche der Control UI erfordert eine bereits gekoppelte Sitzung mit `operator.admin`.
Wählen Sie als Terminal-Fallback ein erkanntes Gateway in der iOS-App aus (oder aktivieren Sie
Manual Host und geben Sie Host/Port ein) und genehmigen Sie dann die Anfrage auf dem Gateway-Host:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Wenn die App die Kopplung mit geänderten Authentifizierungsdaten (Rolle/Bereiche/öffentlicher Schlüssel) erneut versucht, wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt. Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Optional: Wenn sich der iOS-Node immer aus einem streng kontrollierten Subnetz verbindet, können Sie die automatische Genehmigung bei der erstmaligen Node-Kopplung mit expliziten CIDRs oder genauen IP-Adressen aktivieren:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Dies ist standardmäßig deaktiviert. Es gilt nur für eine neue Kopplung mit `role: node` ohne angeforderte Bereiche. Die Kopplung von Operatoren/Browsern sowie jede Änderung an Rolle, Bereich, Metadaten oder öffentlichem Schlüssel erfordert weiterhin eine manuelle Genehmigung.

5. Überprüfen Sie die Verbindung:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Gesundheitszusammenfassungen

Der iOS-Node kann für `today` eine schreibgeschützte, auf dem Gerät erstellte Zusammenfassung zurückgeben. Die feste
Zusammenfassung enthält Schritte, Schlafdauer, durchschnittliche Ruheherzfrequenz sowie Anzahl und Dauer
der Trainingseinheiten. Sie gibt niemals einzelne HealthKit-
Messwerte, Quellen, Metadaten, klinische Aufzeichnungen oder Schreibzugriff zurück.

Diese Oberfläche verfügt über zwei unabhängige Einwilligungen:

1. Öffnen Sie in der iOS-App **Settings -> Permissions -> Privacy & Access -> Health Summaries** und
   tippen Sie auf **Enable & Share Summaries**. Der Hinweis erläutert, dass die angeforderte
   Zusammenfassung das Telefon über Ihr Gateway verlässt, Ihren konfigurierten KI-
   Provider erreicht und möglicherweise im Chatverlauf verbleibt.
2. Fügen Sie `health.summary` zu `gateway.nodes.allowCommands` hinzu, lehnen Sie anschließend die
   geänderte iPhone-Node-Befehlsoberfläche ab und genehmigen Sie sie erneut. Betreiben Sie Ihr Gateway
   nur lokal oder im Tailnet; die Sicherheitsprüfung meldet diesen sensiblen Befehl, wenn er
   aktiviert ist.

Modelle verwenden das vorhandene `nodes`-Tool mit `action: "invoke"`,
`invokeCommand: "health.summary"` und einem auf
`{"period":"today"}` gesetzten `invokeParamsJson`.

HealthKit legt bewusst nicht offen, ob der Lesezugriff verweigert wurde. Fehlende
Messwerte bedeuten daher lediglich, dass kein lesbarer Wert zurückgegeben wurde; sie
beweisen weder eine Verweigerung noch das Fehlen von Gesundheitsdaten. OpenClaw beschränkt Zusammenfassungen auf den
aktuellen Kalendertag, damit ein begrenztes Zeitfenster für den historischen Zugriff keine
mehrtägige Gesamtsumme vollständig erscheinen lässt. OpenClaw erfasst Gesundheitsdaten nicht im
Hintergrund und verwendet Zusammenfassungen nicht für Diagnosen oder medizinische Beratung.

Standardmäßig verwendet die Apple-Watch-Begleit-App weiterhin die bestehende iPhone-Weiterleitung und
benötigt keine separate Gateway-Kopplung. Koppeln Sie die Watch in Apples Watch-App mit dem iPhone,
installieren Sie OpenClaw über **Watch app -> My Watch -> Available
Apps** und öffnen Sie OpenClaw anschließend einmal auf beiden Geräten.

## Befehlsgenehmigungen prüfen

Eine Operator-Verbindung mit `operator.admin` oder eine gekoppelte,
vom Gateway ausdrücklich ausgewählte Verbindung mit `operator.approvals` kann
ausstehende Ausführungsanfragen auf dem iPhone prüfen. Die Genehmigungskarte zeigt die vom Gateway
bereinigte Befehlsvorschau, Warnung, den Host-Kontext, den Ablaufzeitpunkt und nur die
von dieser Anfrage angebotenen Entscheidungen. Die gekoppelte Apple Watch erhält dieselbe
für Prüfer geeignete Aufforderung über die bestehende iPhone-Weiterleitung und bietet die kompakte
Teilmenge der Entscheidungen „einmalig erlauben/ablehnen“. Im direkten Watch-Gateway-Modus werden keine
Genehmigungsaufforderungen übertragen.

Der Genehmigungsstatus wird mit der Control UI und unterstützten Chat-Oberflächen geteilt. Die
erste verbindlich übermittelte Antwort gilt. iPhone und Watch rufen den kanonischen
Terminaldatensatz des Gateways ab, nachdem eine andere Oberfläche die Anfrage bearbeitet hat, nach einer
Remote-Benachrichtigung über die Bearbeitung und immer dann, wenn eine Bestätigung der Bearbeitung möglicherweise
verloren gegangen ist. Aktionen bleiben nicht verfügbar, bis dieses erneute Lesen bestätigt, ob die
Anfrage weiterhin aussteht.

Die Genehmigungszuständigkeit ist an das ausgewählte Gateway gebunden. Beim Wechsel des Gateways kann
eine alte Aufforderung nicht auf die neue Verbindung angewendet werden. Gateways, die älter als die
vereinheitlichten Genehmigungsmethoden sind, greifen auf die ausgelieferten ausführungsbezogenen Methoden zurück;
für beibehaltenen Terminalstatus und umfassendere oberflächenübergreifende Ergebnisse ist ein aktualisiertes
Gateway erforderlich.

## Optionaler direkter Apple-Watch-Node

Im direkten Modus erhält die Watch eine eigene signierte Node-Identität und Gateway-Verbindung.
Unterstützte Node-Befehle funktionieren weiterhin über Watch-WLAN oder Mobilfunk, solange
OpenClaw aktiv ist, selbst wenn das gekoppelte iPhone nicht verfügbar ist.

Anforderungen:

- Das iPhone ist mit dem Bereich `operator.admin` mit dem Gateway verbunden.
- Der Einrichtungscode gibt einen `wss://`-Gateway-Endpunkt mit einem von watchOS als vertrauenswürdig eingestuften Zertifikat an;
  die Watch fragt den entsprechenden `https://`-Ursprung ab. Einfaches HTTP und
  selbstsigniertes oder ausschließlich auf Fingerabdrücken basierendes Vertrauen werden nicht unterstützt. Informationen zur Endpunktkonfiguration finden Sie unter [Gateway-eigene
  Kopplung](/de/gateway/pairing). Loopback-, ausschließlich iPhone- und ausschließlich Tailnet-
  Routen sind von der Watch nicht eigenständig erreichbar.
- Für die Mobilfunknutzung ist eine mobilfunkfähige Apple Watch mit aktivem Tarif erforderlich.
- OpenClaw ist auf der Watch aktiv. Apple gestattet gewöhnlichen watchOS-Apps nicht,
  generische WebSocket-/TCP-Verbindungen aufrechtzuerhalten. Daher verwendet der direkte Node kurze HTTPS-
  Abfragen und stellt die Verbindung erneut her, wenn die App in den Vordergrund zurückkehrt. Weitere Informationen finden Sie in Apples
  [Hinweisen zur Low-Level-Netzwerkkommunikation unter watchOS](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS).

Einrichtung:

1. Öffnen Sie auf dem iPhone **Settings -> Apple Watch**.
2. Tippen Sie auf **Enable Direct Gateway Connection**.
3. Öffnen Sie OpenClaw auf der Watch, bevor der kurzlebige Einrichtungscode abläuft.
4. Überprüfen Sie die separate Apple-Watch-Zeile mit `openclaw nodes status`.

Der Einrichtungscode enthält kurzlebige Zugangsdaten ausschließlich für den Node; behandeln Sie diese
bis zum Ablauf wie ein Passwort. Er enthält niemals das auf dem iPhone gespeicherte Gateway-
Passwort oder -Token. Nach der Kopplung speichert die Watch ihr eigenes Geräte-Token und
löscht die Bootstrap-Zugangsdaten. Der direkte Modus umfasst nur die nachstehenden Befehle.
Chat, Gesprächsmodus, Genehmigungen und der bestehende `watch.*`-Benachrichtigungsablauf bleiben
Funktionen der iPhone-Weiterleitung und erfordern weiterhin das gekoppelte iPhone.

Direkte watchOS-Node-Befehle:

| Oberfläche     | Befehle                        | Hinweise                                                        |
| -------------- | ------------------------------ | --------------------------------------------------------------- |
| Gerät          | `device.info`, `device.status` | Watch-Identität, Akku, Temperatur, Speicher und Netzwerk.        |
| Benachrichtigungen | `system.notify`             | Während die App aktiv ist; erfordert eine Berechtigung der Watch. |

watchOS stellt Drittanbieter-Apps kein WebKit zur Verfügung, daher
kündigt der direkte Watch-Node keine Canvas-Befehle an.

## Relay-gestützte Push-Benachrichtigungen für offizielle Builds

Offiziell verteilte iOS-Builds verwenden ein externes Push-Relay, anstatt das unverarbeitete APNs-Token am Gateway zu veröffentlichen. Offizielle App-Store-Builds aus dem öffentlichen Release-Kanal verwenden das gehostete Relay unter `https://ios-push-relay.openclaw.ai`; diese Basis-URL ist für die App-Store-Verteilung fest codiert und liest keine Überschreibung.

Benutzerdefinierte Relay-Bereitstellungen erfordern einen bewusst separaten iOS-Build-/Bereitstellungspfad, dessen Relay-URL mit der Gateway-Relay-URL übereinstimmt. Der App-Store-Release-Kanal akzeptiert niemals eine benutzerdefinierte Relay-URL. Wenn Sie einen benutzerdefinierten Relay-Build verwenden, legen Sie die entsprechende Gateway-Relay-URL fest:

```json5
{
  gateway: {
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
        },
      },
    },
  },
}
```

Funktionsweise des Ablaufs:

- Die iOS-App registriert sich beim Relay mithilfe von App Attest und einer JWS für eine StoreKit-App-Transaktion.
- Das Relay gibt ein opakes Relay-Handle sowie eine auf die Registrierung beschränkte Sendeberechtigung zurück.
- Die iOS-App ruft die Identität des gekoppelten Gateways (`gateway.identity.get`) ab und schließt sie in die Relay-Registrierung ein, sodass die Relay-gestützte Registrierung an dieses bestimmte Gateway delegiert wird.
- Die App leitet diese Relay-gestützte Registrierung mit `push.apns.register` an das gekoppelte Gateway weiter.
- Das Gateway verwendet das gespeicherte Relay-Handle für `push.test`, Hintergrundaktivierungen und Aktivierungsimpulse.
- Wenn die App später eine Verbindung zu einem anderen Gateway oder zu einem Build mit einer anderen Relay-Basis-URL herstellt, aktualisiert sie die Relay-Registrierung, anstatt die alte Bindung wiederzuverwenden.

Was das Gateway für diesen Pfad **nicht** benötigt: kein bereitstellungsweites Relay-Token und keinen direkten APNs-Schlüssel für Relay-gestützte Sendungen offizieller App-Store-Builds.

Erwarteter Ablauf für Operatoren:

1. Installieren Sie die offizielle iOS-App.
2. Optional: Legen Sie `gateway.push.apns.relay.baseUrl` auf dem Gateway nur fest, wenn Sie einen bewusst separaten benutzerdefinierten Relay-Build verwenden.
3. Koppeln Sie die App mit dem Gateway und warten Sie, bis die Verbindung vollständig hergestellt ist.
4. Die App veröffentlicht `push.apns.register`, sobald sie über ein APNs-Token verfügt, die Operator-Sitzung verbunden ist und die Relay-Registrierung erfolgreich abgeschlossen wurde.
5. Danach können `push.test`, Aktivierungen zur Wiederherstellung der Verbindung und Aktivierungsimpulse die gespeicherte Relay-gestützte Registrierung verwenden.

## Hintergrundaktivitäts-Beacons

Wenn iOS die App für eine stille Push-Benachrichtigung, eine Hintergrundaktualisierung oder ein Ereignis aufgrund einer signifikanten Standortänderung aktiviert, versucht die App, kurzzeitig erneut eine Verbindung zum Node herzustellen, und ruft dann `node.event` mit `event: "node.presence.alive"` auf. Das Gateway zeichnet dies erst dann als `lastSeenAtMs`/`lastSeenReason` in den Metadaten des gekoppelten Nodes/Geräts auf, nachdem die authentifizierte Geräteidentität des Nodes bekannt ist.

Die App betrachtet eine Aktivierung im Hintergrund nur dann als erfolgreich aufgezeichnet, wenn die Gateway-Antwort `handled: true` enthält. Ältere Gateways bestätigen `node.event` möglicherweise mit `{ "ok": true }`; diese Antwort ist kompatibel, zählt jedoch nicht als dauerhafte Aktualisierung des Zeitpunkts der letzten Aktivität.

Kompatibilitätshinweis:

- `OPENCLAW_APNS_RELAY_BASE_URL` funktioniert weiterhin als vorübergehende Umgebungsvariablen-Überschreibung für das Gateway (`gateway.push.apns.relay.baseUrl` ist der vorrangige Konfigurationspfad).
- Der Push-Modus des App-Store-Release-Builds enthält den Host des gehosteten Relays fest codiert und liest niemals eine Überschreibung der Relay-URL ein – die Buildzeit-Umgebungsvariable `OPENCLAW_PUSH_RELAY_BASE_URL` wirkt sich nur auf lokale/Sandbox-iOS-Build-Modi aus.

## Authentifizierungs- und Vertrauensablauf

Das Relay dient dazu, zwei Einschränkungen durchzusetzen, die direkte APNs auf dem Gateway für offizielle iOS-Builds nicht gewährleisten können:

- Nur echte OpenClaw-iOS-Builds, die über Apple verteilt werden, können das gehostete Relay verwenden.
- Ein Gateway kann Relay-gestützte Push-Benachrichtigungen nur für iOS-Geräte senden, die mit diesem spezifischen Gateway gekoppelt wurden.

Schritt für Schritt:

1. `iOS app -> gateway`: Die App wird über den normalen Gateway-Authentifizierungsablauf mit dem Gateway gekoppelt. Dadurch erhält sie eine authentifizierte Node-Sitzung sowie eine authentifizierte Operator-Sitzung. Die Operator-Sitzung ruft `gateway.identity.get` auf.
2. `iOS app -> relay`: Die App ruft die Relay-Registrierungsendpunkte über HTTPS mit einem App-Attest-Nachweis sowie einer JWS der StoreKit-App-Transaktion auf. Das Relay validiert die Bundle-ID, den App-Attest-Nachweis und den Apple-Verteilungsnachweis und setzt den offiziellen/produktiven Verteilungsweg voraus. Dadurch wird verhindert, dass lokale Xcode-/Entwicklungs-Builds das gehostete Relay verwenden, da ein lokaler Build den offiziellen Apple-Verteilungsnachweis nicht erbringen kann.
3. `gateway identity delegation`: Vor der Relay-Registrierung ruft die App die Identität des gekoppelten Gateways über `gateway.identity.get` ab und nimmt sie in die Relay-Registrierungsnutzlast auf. Das Relay gibt ein Relay-Handle und eine auf die Registrierung beschränkte Sendeberechtigung zurück, die an diese Gateway-Identität delegiert ist.
4. `gateway -> relay`: Das Gateway speichert das Relay-Handle und die Sendeberechtigung aus `push.apns.register`. Bei `push.test`, Aktivierungen zur Wiederherstellung der Verbindung und Aktivierungsimpulsen signiert das Gateway die Sendeanfrage mit seiner eigenen Geräteidentität. Das Relay prüft sowohl die gespeicherte Sendeberechtigung als auch die Gateway-Signatur anhand der bei der Registrierung delegierten Gateway-Identität. Ein anderes Gateway kann diese gespeicherte Registrierung nicht wiederverwenden, selbst wenn es auf irgendeine Weise an das Handle gelangt.
5. `relay -> APNs`: Das Relay verwaltet die produktiven APNs-Anmeldedaten und das unverarbeitete APNs-Token für den offiziellen Build. Das Gateway speichert für Relay-gestützte offizielle Builds niemals das unverarbeitete APNs-Token. Das Relay sendet die endgültige Push-Benachrichtigung im Namen des gekoppelten Gateways an APNs.

Grund für dieses Design: Die produktiven APNs-Anmeldedaten sollen von den Gateways der Benutzer ferngehalten, die Speicherung unverarbeiteter APNs-Token offizieller Builds auf dem Gateway vermieden, die Nutzung des gehosteten Relays auf offizielle OpenClaw-iOS-Builds beschränkt und verhindert werden, dass ein Gateway Aktivierungs-Push-Benachrichtigungen an iOS-Geräte sendet, die zu einem anderen Gateway gehören.

Lokale/manuelle Builds verwenden weiterhin direkte APNs. Wenn Sie diese Builds ohne das Relay testen, benötigt das Gateway weiterhin direkte APNs-Anmeldedaten:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Dies sind Laufzeit-Umgebungsvariablen des Gateway-Hosts und keine Fastlane-Einstellungen. `apps/ios/fastlane/.env` speichert nur die App-Store-Connect-Authentifizierung wie `APP_STORE_CONNECT_KEY_ID` und `APP_STORE_CONNECT_ISSUER_ID`; die direkte APNs-Zustellung für lokale iOS-Builds wird dadurch nicht konfiguriert.

Empfohlener Speicherort auf dem Gateway-Host, entsprechend den Anmeldedaten anderer Provider unter `~/.openclaw/credentials/`:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Committen Sie die `.p8`-Datei nicht und legen Sie sie nicht im ausgecheckten Repository ab.

## Erkennungspfade

### Bonjour (LAN)

Die iOS-App sucht nach `_openclaw-gw._tcp` unter `local.` und, sofern konfiguriert, in derselben Wide-Area-DNS-SD-Erkennungsdomäne. Gateways im selben LAN werden automatisch über `local.` angezeigt; für die netzwerkübergreifende Erkennung kann die konfigurierte Wide-Area-Domäne verwendet werden, ohne den Beacon-Typ zu ändern.

### Tailnet (netzwerkübergreifend)

Wenn mDNS blockiert ist, verwenden Sie eine Unicast-DNS-SD-Zone (wählen Sie eine Domäne aus; Beispiel: `openclaw.internal.`) und Tailscale Split DNS. Ein CoreDNS-Beispiel finden Sie unter [Bonjour](/de/gateway/bonjour).

### Manueller Host/Port

Aktivieren Sie in den Einstellungen **Manual Host** und geben Sie den Gateway-Host und den Port ein (Standard: `18789`).

## Mehrere Gateways

Die App führt eine Registrierung aller Gateways, mit denen sie gekoppelt wurde, sodass Sie zwischen ihnen wechseln können, ohne sie erneut zu koppeln:

- Unter **Settings -> Gateway** wird eine Liste **Paired Gateways** angezeigt, in der das aktive Gateway markiert ist. Tippen Sie auf einen Eintrag, um zu wechseln. Die App beendet die aktuellen Sitzungen und stellt eine neue Verbindung zum ausgewählten Gateway her. Wenn mehrere Gateways gekoppelt sind, wird neben der Verbindungszeile ein Schnellwechselmenü angezeigt.
- Anmeldedaten, TLS-Vertrauensentscheidungen, Gateway-spezifische Einstellungen und der zwischengespeicherte Chatverlauf werden für jedes Gateway separat gespeichert. Beim Wechsel werden Zustände verschiedener Gateways niemals vermischt, und die Push-Registrierung folgt dem aktiven Gateway.
- Wischen Sie über ein gekoppeltes Gateway (oder verwenden Sie dessen Kontextmenü), um es mit **Forget** zu entfernen. Dadurch werden seine Anmeldedaten, Gerätetoken, der TLS-Pin und zwischengespeicherte Chats gelöscht.
- Erkannte Gateways müssen im Netzwerk sichtbar sein, damit zu ihnen gewechselt werden kann; manuell konfigurierte Gateways stellen die Verbindung über den gespeicherten Host und Port wieder her.

## Canvas + A2UI

Der iOS-Node rendert ein WKWebView-Canvas. Steuern Sie es mit `node.invoke`:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Hinweise:

- Der Canvas-Host des Gateways stellt `/__openclaw__/canvas/` und `/__openclaw__/a2ui/` über den HTTP-Server des Gateways bereit (derselbe Port wie `gateway.port`, standardmäßig `18789`).
- Der iOS-Node behält das integrierte Grundgerüst als verbundene Standardansicht bei. `canvas.a2ui.push` und `canvas.a2ui.reset` verwenden die gebündelte, App-eigene A2UI-Seite.
- Entfernte Gateway-A2UI-Seiten werden unter iOS nur gerendert; native A2UI-Schaltflächenaktionen werden ausschließlich von gebündelten, App-eigenen Seiten akzeptiert.
- Kehren Sie mit `canvas.navigate` und `{"url":""}` zum integrierten Grundgerüst zurück.

## Beziehung zu Computer Use

Die iOS-App ist eine mobile Node-Oberfläche und kein Backend für Codex Computer Use. Codex Computer Use und `cua-driver mcp` steuern einen lokalen macOS-Desktop über MCP-Tools; die iOS-App stellt iPhone-Funktionen über OpenClaw-Node-Befehle wie `canvas.*`, `camera.*`, `screen.*`, `location.*` und `talk.*` bereit.

Agenten können die iOS-App weiterhin über OpenClaw bedienen, indem sie Node-Befehle aufrufen. Diese Aufrufe erfolgen jedoch über das Gateway-Node-Protokoll und unterliegen den Einschränkungen von iOS für Vorder- und Hintergrundausführung. Verwenden Sie [Codex Computer Use](/de/plugins/codex-computer-use) für die lokale Desktop-Steuerung und diese Seite für die Funktionen des iOS-Nodes.

### Canvas-Auswertung/Snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Sprachaktivierung und Sprechmodus

- Sprachaktivierung und Sprechmodus sind in den Einstellungen verfügbar.
- OpenAI-Echtzeitkommunikation im Sprechmodus verwendet clientseitiges WebRTC, wenn `talk.realtime.transport` auf `webrtc` gesetzt ist; eine explizite `gateway-relay`-Konfiguration wird weiterhin vom Gateway verwaltet. Siehe [Sprechmodus](/de/nodes/talk).
- Sprechfähige iOS-Nodes geben die Funktion `talk` bekannt und können `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` und `talk.ptt.once` deklarieren. Das Gateway erlaubt diese Push-to-Talk-Befehle standardmäßig für vertrauenswürdige, sprechfähige Nodes.
- iOS kann Audio im Hintergrund aussetzen. Betrachten Sie Sprachfunktionen daher als Best-Effort-Funktionen, wenn die App nicht aktiv ist.

## Häufige Fehler

- `NODE_BACKGROUND_UNAVAILABLE`: Bringen Sie die iOS-App in den Vordergrund (Canvas-/Kamera-/Bildschirmbefehle setzen dies voraus).
- `A2UI_HOST_UNAVAILABLE`: Die gebündelte A2UI-Seite war in der WebView der App nicht erreichbar. Lassen Sie die App im Vordergrund auf dem Tab Screen geöffnet und versuchen Sie es erneut.
- Die Kopplungsaufforderung erscheint nicht: Führen Sie `openclaw devices list` aus und genehmigen Sie die Kopplung manuell.
- Die Watch zeigt keinen iPhone-Status an: Stellen Sie sicher, dass das iPhone in `watch.status` `watchPaired: true`
  und `watchAppInstalled: true` meldet. Wenn die Kopplung auf „false“ gesetzt ist, koppeln Sie die
  Watch in Apples Watch-App. Wenn die Installation auf „false“ gesetzt ist, installieren Sie die Begleit-App
  über **My Watch -> Available Apps**. Öffnen Sie nach beiden Arten von Änderungen OpenClaw einmal auf der
  Watch. Für die sofortige Erreichbarkeit müssen weiterhin beide Apps ausgeführt werden,
  während Aktualisierungen in der Warteschlange später im Hintergrund eintreffen können.
- Die Wiederherstellung der Verbindung schlägt nach der Neuinstallation fehl: Das Kopplungstoken im Schlüsselbund wurde gelöscht; koppeln Sie den Node erneut.

## Zugehörige Dokumentation

- [Kopplung](/de/channels/pairing)
- [Erkennung](/de/gateway/discovery)
- [Bonjour](/de/gateway/bonjour)
