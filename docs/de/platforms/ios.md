---
read_when:
    - Koppeln oder erneutes Verbinden des iOS-Node
    - Direkten Apple-Watch-Node aktivieren oder Fehler beheben
    - Ausführen der iOS-App aus dem Quellcode
    - Fehlerbehebung bei der Gateway-Erkennung oder bei Canvas-Befehlen
summary: 'iOS-Node-App: Verbindung mit dem Gateway, Kopplung, Canvas und Fehlerbehebung'
title: iOS-App
x-i18n:
    generated_at: "2026-07-16T13:04:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7db2f099602435837cc18fcd3e7670067d4b58b6cdb6f6502704a1565d1d1c61
    source_path: platforms/ios.md
    workflow: 16
---

Verfügbarkeit: iPhone-App-Builds werden über Apple-Kanäle verteilt, wenn dies für ein Release aktiviert ist. Lokale Entwicklungs-Builds können auch aus dem Quellcode ausgeführt werden.

## Funktionsweise

- Stellt über WebSocket (LAN oder Tailnet) eine Verbindung zu einem Gateway her.
- Stellt Node-Funktionen bereit: Canvas, Bildschirmaufnahme, Kameraaufnahme, Standort, Gesprächsmodus, Sprachaktivierung und optionale Gesundheitszusammenfassungen.
- Empfängt `node.invoke`-Befehle und meldet Node-Statusereignisse.
- Ermöglicht über die Agents-Oberfläche (Dateien) schreibgeschützten Zugriff auf den Arbeitsbereich des ausgewählten Agenten: Navigation durch Verzeichnisse, Textvorschauen mit Syntaxhervorhebung, Bildvorschauen und Export über das Teilen-Menü. Keine Schreibvorgänge; die Größe von Vorschauen wird durch das Gateway begrenzt.
- Hält pro gekoppeltem Gateway einen kleinen, schreibgeschützten Offline-Cache der letzten Chatsitzungen und Transkripte vor: Bei einem Kaltstart wird sofort das zuletzt bekannte Transkript angezeigt und aktualisiert, sobald das Gateway antwortet; kürzlich verwendete Chats bleiben auch ohne Verbindung durchsuchbar; Zurücksetzen bzw. Vergessen löscht den geschützten lokalen Cache.
- Stellt Textnachrichten, die ohne Verbindung gesendet werden, in eine dauerhafte, Gateway-spezifische Ausgangswarteschlange (bis zu 50): Nachrichtenblasen in der Warteschlange werden im Transkript angezeigt und bei erneuter Verbindung der Reihe nach mit idempotenten Wiederholungsversuchen gesendet. Sie bleiben erhalten, bis der kanonische Verlauf das Senden bestätigt, werden mit zunehmender Verzögerung erneut versucht, bevor eine Aktion zum Wiederholen oder Löschen angezeigt wird, und verfallen nach 48 Stunden ohne Verbindung, anstatt gesendet zu werden. Zurücksetzen bzw. Vergessen löscht die Warteschlange zusammen mit dem Cache.
- Gibt Nachrichten des Assistenten auf Anforderung per Sprache aus: Drücken Sie im Chat lange auf eine Nachricht und wählen Sie **Listen**. Die App spielt unterstützte `tts.speak`-Clips des Gateways mit dem konfigurierten TTS-Provider ab und greift auf die Sprachausgabe des Geräts zurück, wenn Gateway-Audio nicht verfügbar oder nicht abspielbar ist. Die Wiedergabe endet beim Wechsel der Sitzung oder wenn die App in den Hintergrund wechselt.

## Voraussetzungen

- Ein Gateway, das auf einem anderen Gerät ausgeführt wird (macOS, Linux oder Windows über WSL2).
- Netzwerkpfad:
  - Dasselbe LAN über Bonjour, **oder**
  - Tailnet über Unicast-DNS-SD (Beispieldomain: `openclaw.internal.`), **oder**
  - Manuell angegebener Host/Port (Fallback).

## Schnellstart (koppeln und verbinden)

Beim ersten Start führt die App durch eine kurze Erläuterung der Kopplung und eine
Berechtigungsseite (Mitteilungen, Kamera, Mikrofon, Fotos, Kontakte,
Kalender, Erinnerungen, Standort). Jede Freigabe ist optional und kann später
unter **Settings** -> **Permissions** oder in der iOS-Einstellungs-App geändert werden.

1. Starten Sie ein authentifiziertes Gateway mit einer Route, die Ihr Telefon erreichen kann. Tailscale
   Serve ist der empfohlene Pfad für den Fernzugriff:

```bash
openclaw gateway --port 18789 --tailscale serve
```

Verwenden Sie für eine vertrauenswürdige Einrichtung im selben LAN stattdessen ein authentifiziertes `gateway.bind: "lan"`.
Die standardmäßige Loopback-Bindung ist von einem Telefon aus nicht erreichbar. Falls das
Gateway noch nicht konfiguriert wurde, führen Sie zuerst `openclaw onboard` aus, damit für die Erstellung
des Einrichtungscodes ein Authentifizierungspfad mit Token oder Passwort verfügbar ist.

2. Öffnen Sie die [Control UI](/de/web/control-ui), wählen Sie **Nodes** und klicken Sie
   auf der Seite **Devices** auf **Pair mobile device**. Vollzugriff wird empfohlen
   und ist standardmäßig ausgewählt. Wählen Sie Limited access nur, wenn Sie
   administrative Gateway-Steuerelemente weglassen möchten, und klicken Sie anschließend auf **Create setup code**.

3. Öffnen Sie in der iOS-App **Settings** -> **Gateway**, scannen Sie den QR-Code (oder fügen Sie
   den Einrichtungscode ein) und stellen Sie die Verbindung her.

   Wenn der Einrichtungscode sowohl LAN- als auch Tailscale-Serve-Routen enthält, prüft die App
   diese der Reihe nach und speichert den ersten erreichbaren Endpunkt.

4. Die offizielle App stellt die Verbindung automatisch her. Falls **Pending approval** eine
   Anfrage anzeigt, prüfen Sie deren Rolle und Geltungsbereiche, bevor Sie sie genehmigen.

   Unter **Settings → Gateway** wird angezeigt, ob die gespeicherte Operator-Verbindung über
   **Full**- oder **Limited**-Zugriff verfügt. Die Einrichtung über unverschlüsseltes LAN-`ws://` wird aus
   Sicherheitsgründen bei Bearer-Token automatisch eingeschränkt. Wenn der Zugriff eingeschränkt ist, konfigurieren Sie `wss://` oder
   Tailscale Serve, scannen Sie in der Control UI oder mit `openclaw qr` einen neuen Code für Vollzugriff
   und stellen Sie erneut eine Verbindung her, um Einstellungen und Upgrades zu aktivieren.

Die Schaltfläche in der Control UI erfordert eine bereits gekoppelte Sitzung mit `operator.admin`.
Wählen Sie als Terminal-Fallback ein erkanntes Gateway in der iOS-App aus (oder aktivieren Sie
Manual Host und geben Sie Host/Port ein) und genehmigen Sie die Anfrage anschließend auf dem Gateway-Host:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Wenn die App die Kopplung mit geänderten Authentifizierungsdetails (Rolle/Geltungsbereiche/öffentlicher Schlüssel) erneut versucht, wird die vorherige ausstehende Anfrage ersetzt und ein neues `requestId` erstellt. Führen Sie `openclaw devices list` vor der Genehmigung erneut aus.

Optional: Wenn der iOS-Node stets aus einem streng kontrollierten Subnetz eine Verbindung herstellt, können Sie die automatische Genehmigung bei der erstmaligen Node-Kopplung mit expliziten CIDRs oder exakten IP-Adressen aktivieren:

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

Diese Funktion ist standardmäßig deaktiviert. Sie gilt nur für eine neue `role: node`-Kopplung ohne angeforderte Geltungsbereiche. Die Kopplung von Operatoren bzw. Browsern sowie jede Änderung an Rolle, Geltungsbereich, Metadaten oder öffentlichem Schlüssel erfordert weiterhin eine manuelle Genehmigung.

5. Überprüfen Sie die Verbindung:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Gesundheitszusammenfassungen

Der iOS-Node kann für den aktuellen Kalendertag ein optionales, schreibgeschütztes
HealthKit-Aggregat zurückgeben. Die Zustimmung auf dem iPhone und die ausdrückliche Autorisierung
von Gateway-Befehlen sind unabhängige Voraussetzungen. Informationen zu Einrichtung,
Aufruf, Nutzdatenfeldern, Datenschutzverhalten und Fehlerbehebung finden Sie unter
[HealthKit-Zusammenfassungen](/platforms/ios-healthkit).

Standardmäßig verwendet die Apple-Watch-Begleit-App weiterhin das vorhandene iPhone-Relay und
benötigt keine separate Gateway-Kopplung. Koppeln Sie die Watch in Apples Watch-App mit dem iPhone,
installieren Sie OpenClaw über **Watch app -> My Watch -> Available
Apps** und öffnen Sie OpenClaw anschließend einmal auf beiden Geräten.

## Befehlsfreigaben prüfen

Eine Operator-Verbindung mit `operator.admin` oder eine gekoppelte,
vom Gateway ausdrücklich ausgewählte `operator.approvals`-Verbindung kann
ausstehende Ausführungsanfragen auf dem iPhone prüfen. Die Freigabekarte zeigt die
bereinigte Befehlsvorschau des Gateways, Warnung, Hostkontext, Ablaufzeit und ausschließlich die
von dieser Anfrage angebotenen Entscheidungen. Die gekoppelte Apple Watch empfängt dieselbe
für Prüfer sichere Aufforderung über das vorhandene iPhone-Relay und bietet die kompakte
Auswahl aus einmaligem Zulassen und Ablehnen. Der direkte Watch-Gateway-Modus übermittelt keine
Freigabeaufforderungen.

Der Freigabestatus wird mit der Control UI und den unterstützten Chat-Oberflächen geteilt. Die
erste verbindlich übermittelte Antwort gewinnt. iPhone und Watch rufen den kanonischen
Enddatensatz des Gateways ab, nachdem eine andere Oberfläche die Anfrage verarbeitet hat, nach einer
Remote-Benachrichtigung über die Verarbeitung und immer dann, wenn eine Bestätigung der Verarbeitung
verloren gegangen sein könnte. Aktionen bleiben nicht verfügbar, bis dieses erneute Auslesen bestätigt,
ob die Anfrage weiterhin aussteht.

Die Zuständigkeit für Freigaben ist an das ausgewählte Gateway gebunden. Beim Wechsel des Gateways kann
eine alte Aufforderung nicht auf die neue Verbindung angewendet werden. Gateways, die älter als die
vereinheitlichten Freigabemethoden sind, greifen auf die ausgelieferten ausführungsbezogenen Methoden zurück;
beibehaltener Endstatus und umfangreichere oberflächenübergreifende Ergebnisse erfordern ein aktualisiertes
Gateway.

## Optionaler direkter Apple-Watch-Node

Im direkten Modus erhält die Watch eine eigene signierte Node-Identität und Gateway-Verbindung.
Unterstützte Node-Befehle funktionieren weiterhin über WLAN oder Mobilfunk der Watch, solange
OpenClaw aktiv ist, selbst wenn das gekoppelte iPhone nicht verfügbar ist.

Voraussetzungen:

- Das iPhone ist mit dem Gateway verbunden und verfügt über den Geltungsbereich `operator.admin`.
- Der Einrichtungscode weist einen `wss://`-Gateway-Endpunkt mit einem von watchOS
  als vertrauenswürdig eingestuften Zertifikat aus; die Watch fragt den entsprechenden `https://`-Ursprung ab. Unverschlüsseltes HTTP sowie
  selbstsigniertes oder ausschließlich auf Fingerabdrücken basierendes Vertrauen werden nicht unterstützt. Informationen zur Endpunktkonfiguration finden Sie unter
  [Gateway-eigene Kopplung](/de/gateway/pairing). Loopback-, reine iPhone-
  und reine Tailnet-Routen sind für die Watch nicht unabhängig erreichbar.
- Für die Mobilfunknutzung ist eine mobilfunkfähige Apple Watch mit aktivem Dienst erforderlich.
- OpenClaw ist auf der Watch aktiv. Apple erlaubt gewöhnlichen watchOS-Apps nicht,
  generische WebSocket-/TCP-Verbindungen aufrechtzuerhalten. Daher verwendet der direkte Node kurze HTTPS-
  Abfragen und stellt die Verbindung wieder her, wenn die App in den Vordergrund zurückkehrt. Siehe Apples
  [Hinweise zur Low-Level-Netzwerknutzung unter watchOS](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS).

Einrichtung:

1. Öffnen Sie auf dem iPhone **Settings -> Apple Watch**.
2. Tippen Sie auf **Enable Direct Gateway Connection**.
3. Öffnen Sie OpenClaw auf der Watch, bevor der kurzlebige Einrichtungscode abläuft.
4. Überprüfen Sie die separate Apple-Watch-Zeile mit `openclaw nodes status`.

Der Einrichtungscode enthält kurzlebige, ausschließlich für den Node bestimmte Bootstrap-Zugangsdaten. Behandeln Sie diese
bis zum Ablauf wie ein Passwort. Er enthält niemals das auf dem iPhone gespeicherte Gateway-
Passwort oder -Token. Nach der Kopplung speichert die Watch ihr eigenes Geräte-Token und
löscht die Bootstrap-Zugangsdaten. Der direkte Modus umfasst nur die nachfolgenden Befehle.
Chat, Gesprächsmodus, Freigaben und der vorhandene `watch.*`-Mitteilungsablauf bleiben
Funktionen des iPhone-Relays und erfordern weiterhin das gekoppelte iPhone.

Direkte watchOS-Node-Befehle:

| Oberfläche    | Befehle                        | Hinweise                                                   |
| ------------- | ------------------------------ | ---------------------------------------------------------- |
| Gerät         | `device.info`, `device.status` | Watch-Identität, Akku, Temperatur, Speicher und Netzwerk. |
| Mitteilungen  | `system.notify`                | Solange die App aktiv ist; erfordert die Watch-Berechtigung. |

watchOS stellt Drittanbieter-Apps kein WebKit zur Verfügung. Daher kündigt der direkte Watch-Node
keine Canvas-Befehle an.

## Relay-gestützte Push-Mitteilungen für offizielle Builds

Offiziell verteilte iOS-Builds verwenden ein externes Push-Relay, anstatt das unverarbeitete APNs-Token an das Gateway zu veröffentlichen. Offizielle App-Store-Builds aus dem öffentlichen Release-Kanal verwenden das gehostete Relay unter `https://ios-push-relay.openclaw.ai`. Diese Basis-URL ist für die App-Store-Verteilung fest codiert und liest keine Überschreibung ein.

Benutzerdefinierte Relay-Bereitstellungen erfordern einen bewusst getrennten iOS-Build-/Bereitstellungspfad, dessen Relay-URL mit der Relay-URL des Gateways übereinstimmt. Der App-Store-Release-Kanal akzeptiert niemals eine benutzerdefinierte Relay-URL. Wenn Sie einen benutzerdefinierten Relay-Build verwenden, legen Sie die entsprechende Gateway-Relay-URL fest:

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
- Das Relay gibt ein undurchsichtiges Relay-Handle sowie eine auf die Registrierung beschränkte Sendeberechtigung zurück.
- Die iOS-App ruft die Identität des gekoppelten Gateways (`gateway.identity.get`) ab und nimmt sie in die Relay-Registrierung auf, sodass die Relay-gestützte Registrierung an genau dieses Gateway delegiert wird.
- Die App leitet diese Relay-gestützte Registrierung mit `push.apns.register` an das gekoppelte Gateway weiter.
- Das Gateway verwendet das gespeicherte Relay-Handle für `push.test`, Hintergrundaktivierungen und Aktivierungsimpulse.
- Wenn die App später eine Verbindung zu einem anderen Gateway oder zu einem Build mit einer anderen Relay-Basis-URL herstellt, aktualisiert sie die Relay-Registrierung, anstatt die alte Bindung wiederzuverwenden.

Was das Gateway für diesen Pfad **nicht** benötigt: kein bereitstellungsweites Relay-Token und keinen direkten APNs-Schlüssel für offizielle Relay-gestützte Sendungen aus dem App Store.

Erwarteter Ablauf für Operatoren:

1. Installieren Sie die offizielle iOS-App.
2. Optional: Legen Sie `gateway.push.apns.relay.baseUrl` auf dem Gateway nur fest, wenn Sie einen bewusst getrennten benutzerdefinierten Relay-Build verwenden.
3. Koppeln Sie die App mit dem Gateway und warten Sie, bis die Verbindung vollständig hergestellt ist.
4. Die App veröffentlicht `push.apns.register`, sobald sie über ein APNs-Token verfügt, die Operator-Sitzung verbunden ist und die Relay-Registrierung erfolgreich war.
5. Anschließend können `push.test`, Aktivierungen zur Wiederherstellung der Verbindung und Aktivierungsimpulse die gespeicherte Relay-gestützte Registrierung verwenden.

## Hintergrund-Aktivitätssignale

Wenn iOS die App für eine stille Push-Benachrichtigung, eine Hintergrundaktualisierung oder ein Ereignis mit signifikanter Standortänderung aktiviert, versucht die App eine kurze erneute Node-Verbindung und ruft anschließend `node.event` mit `event: "node.presence.alive"` auf. Der Gateway zeichnet dies erst dann als `lastSeenAtMs`/`lastSeenReason` in den Metadaten der gekoppelten Node bzw. des gekoppelten Geräts auf, wenn die authentifizierte Geräteidentität der Node bekannt ist.

Die App betrachtet eine Hintergrundaktivierung nur dann als erfolgreich aufgezeichnet, wenn die Gateway-Antwort `handled: true` enthält. Ältere Gateways bestätigen `node.event` möglicherweise mit `{ "ok": true }`; diese Antwort ist kompatibel, zählt jedoch nicht als dauerhafte Aktualisierung des Zeitpunkts der letzten Aktivität.

Kompatibilitätshinweis:

- `OPENCLAW_APNS_RELAY_BASE_URL` funktioniert weiterhin als temporäre Umgebungsvariablen-Überschreibung für den Gateway (`gateway.push.apns.relay.baseUrl` ist der primäre konfigurationsbasierte Pfad).
- Der Push-Modus des App-Store-Release-Builds verwendet einen fest codierten Host des gehosteten Relays und liest niemals eine Relay-URL-Überschreibung – die Buildzeit-Umgebungsvariable `OPENCLAW_PUSH_RELAY_BASE_URL` wirkt sich nur auf lokale bzw. Sandbox-iOS-Buildmodi aus.

## Authentifizierungs- und Vertrauensablauf

Das Relay dient dazu, zwei Einschränkungen durchzusetzen, die direkte APNs auf dem Gateway für offizielle iOS-Builds nicht gewährleisten können:

- Nur echte, über Apple vertriebene OpenClaw-iOS-Builds können das gehostete Relay verwenden.
- Ein Gateway kann Relay-gestützte Push-Benachrichtigungen nur an iOS-Geräte senden, die mit diesem bestimmten Gateway gekoppelt wurden.

Schritt für Schritt:

1. `iOS app -> gateway`: Die App koppelt sich über den normalen Gateway-Authentifizierungsablauf mit dem Gateway und erhält dadurch sowohl eine authentifizierte Node-Sitzung als auch eine authentifizierte Operator-Sitzung. Die Operator-Sitzung ruft `gateway.identity.get` auf.
2. `iOS app -> relay`: Die App ruft die Relay-Registrierungsendpunkte über HTTPS mit einem App-Attest-Nachweis sowie einem JWS für eine StoreKit-App-Transaktion auf. Das Relay validiert die Bundle-ID, den App-Attest-Nachweis und den Apple-Verteilungsnachweis und verlangt den offiziellen bzw. produktiven Verteilungspfad – dadurch werden lokale Xcode-/Entwicklungs-Builds von der Verwendung des gehosteten Relays ausgeschlossen, da ein lokaler Build den offiziellen Apple-Verteilungsnachweis nicht erbringen kann.
3. `gateway identity delegation`: Vor der Relay-Registrierung ruft die App die Identität des gekoppelten Gateways über `gateway.identity.get` ab und nimmt sie in die Relay-Registrierungsnutzlast auf. Das Relay gibt ein Relay-Handle und eine auf die Registrierung beschränkte Sendeberechtigung zurück, die an diese Gateway-Identität delegiert ist.
4. `gateway -> relay`: Der Gateway speichert das Relay-Handle und die Sendeberechtigung aus `push.apns.register`. Bei `push.test`, erneuten Verbindungsaktivierungen und Aktivierungsimpulsen signiert der Gateway die Sendeanfrage mit seiner eigenen Geräteidentität; das Relay verifiziert sowohl die gespeicherte Sendeberechtigung als auch die Gateway-Signatur anhand der bei der Registrierung delegierten Gateway-Identität. Ein anderer Gateway kann diese gespeicherte Registrierung nicht wiederverwenden, selbst wenn er irgendwie in den Besitz des Handles gelangt.
5. `relay -> APNs`: Das Relay verwaltet die produktiven APNs-Anmeldedaten und das unformatierte APNs-Token für den offiziellen Build. Der Gateway speichert niemals das unformatierte APNs-Token für Relay-gestützte offizielle Builds; das Relay sendet die abschließende Push-Benachrichtigung im Namen des gekoppelten Gateways an APNs.

Grund für dieses Design: Die produktiven APNs-Anmeldedaten sollen aus den Gateways der Benutzer herausgehalten, das Speichern unformatierter APNs-Token offizieller Builds auf dem Gateway vermieden, die Nutzung des gehosteten Relays ausschließlich offiziellen OpenClaw-iOS-Builds ermöglicht und verhindert werden, dass ein Gateway Aktivierungs-Push-Benachrichtigungen an iOS-Geräte sendet, die einem anderen Gateway zugeordnet sind.

Lokale bzw. manuelle Builds verwenden weiterhin direkte APNs. Wenn Sie diese Builds ohne das Relay testen, benötigt der Gateway weiterhin direkte APNs-Anmeldedaten:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Dies sind Laufzeit-Umgebungsvariablen des Gateway-Hosts und keine Fastlane-Einstellungen. `apps/ios/fastlane/.env` speichert nur die App-Store-Connect-Authentifizierung, beispielsweise `APP_STORE_CONNECT_KEY_ID` und `APP_STORE_CONNECT_ISSUER_ID`; die direkte APNs-Zustellung für lokale iOS-Builds wird damit nicht konfiguriert.

Empfohlene Speicherung auf dem Gateway-Host, entsprechend anderen Provider-Anmeldedaten unter `~/.openclaw/credentials/`:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Committen Sie die Datei `.p8` nicht und legen Sie sie nicht im Repository-Checkout ab.

## Erkennungspfade

### Bonjour (LAN)

Die iOS-App durchsucht `_openclaw-gw._tcp` unter `local.` und, sofern konfiguriert, dieselbe domänenweite DNS-SD-Erkennungsdomain. Gateways im selben LAN werden automatisch über `local.` angezeigt; für die netzwerkübergreifende Erkennung kann die konfigurierte domänenweite Domain verwendet werden, ohne den Beacon-Typ zu ändern.

### Tailnet (netzwerkübergreifend)

Wenn mDNS blockiert ist, verwenden Sie eine Unicast-DNS-SD-Zone (wählen Sie eine Domain; Beispiel: `openclaw.internal.`) und Split DNS von Tailscale. Ein CoreDNS-Beispiel finden Sie unter [Bonjour](/de/gateway/bonjour).

### Manueller Host/Port

Aktivieren Sie in den Einstellungen **Manual Host** und geben Sie den Gateway-Host und den Port ein (Standard: `18789`).

## Mehrere Gateways

Die App führt eine Registrierung aller Gateways, mit denen sie gekoppelt wurde, sodass Sie zwischen ihnen wechseln können, ohne eine erneute Kopplung durchzuführen:

- Unter **Settings -> Gateway** wird eine Liste **Paired Gateways** angezeigt, in der der aktive Gateway markiert ist. Tippen Sie auf einen Eintrag, um zu wechseln; die App beendet die aktuellen Sitzungen und verbindet sich erneut mit dem ausgewählten Gateway. Neben der Verbindungszeile wird ein Schnellwechselmenü angezeigt, wenn mehr als ein Gateway gekoppelt ist.
- Anmeldedaten, TLS-Vertrauensentscheidungen, Gateway-spezifische Einstellungen und der zwischengespeicherte Chatverlauf werden für jeden Gateway separat gespeichert. Beim Wechsel werden Zustände verschiedener Gateways niemals vermischt, und die Push-Registrierung folgt dem aktiven Gateway.
- Wischen Sie über einen gekoppelten Gateway (oder verwenden Sie dessen Kontextmenü), um ihn mit **Forget** zu entfernen. Dadurch werden seine Anmeldedaten, Gerätetoken, TLS-PIN und zwischengespeicherten Chats gelöscht.
- Erkannte Gateways müssen im Netzwerk sichtbar sein, damit zu ihnen gewechselt werden kann; manuelle Gateways stellen anhand des gespeicherten Hosts und Ports erneut eine Verbindung her.

## Canvas + A2UI

Die iOS-Node stellt eine WKWebView-Canvas dar. Steuern Sie sie mit `node.invoke`:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Hinweise:

- Der Canvas-Host des Gateways stellt `/__openclaw__/canvas/` und `/__openclaw__/a2ui/` über den HTTP-Server des Gateways bereit (derselbe Port wie `gateway.port`, Standard: `18789`).
- Die iOS-Node behält das integrierte Grundgerüst als standardmäßig verbundene Ansicht bei. `canvas.a2ui.push` und `canvas.a2ui.reset` verwenden die gebündelte, app-eigene A2UI-Seite.
- A2UI-Seiten eines entfernten Gateways können unter iOS nur dargestellt werden; native A2UI-Schaltflächenaktionen werden ausschließlich von gebündelten, app-eigenen Seiten akzeptiert.
- Kehren Sie mit `canvas.navigate` und `{"url":""}` zum integrierten Grundgerüst zurück.

## Beziehung zu Computer Use

Die iOS-App ist eine mobile Node-Oberfläche und kein Backend für Codex Computer Use. Codex Computer Use und `cua-driver mcp` steuern über MCP-Tools einen lokalen macOS-Desktop; die iOS-App stellt iPhone-Funktionen über OpenClaw-Node-Befehle wie `canvas.*`, `camera.*`, `screen.*`, `location.*` und `talk.*` bereit.

Agenten können die iOS-App weiterhin über OpenClaw bedienen, indem sie Node-Befehle aufrufen. Diese Aufrufe durchlaufen jedoch das Gateway-Node-Protokoll und unterliegen den Beschränkungen von iOS für Vorder- und Hintergrundausführung. Verwenden Sie [Codex Computer Use](/de/plugins/codex-computer-use) für die lokale Desktop-Steuerung und diese Seite für die Funktionen der iOS-Node.

### Canvas-Auswertung/-Momentaufnahme

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Sprachaktivierung + Gesprächsmodus

- Sprachaktivierung und Gesprächsmodus sind in den Einstellungen verfügbar.
- Die OpenAI-Echtzeitkommunikation im Gesprächsmodus verwendet clientseitiges WebRTC, wenn `talk.realtime.transport` den Wert `webrtc` hat; eine explizite Konfiguration von `gateway-relay` verbleibt in der Zuständigkeit des Gateways. Siehe [Gesprächsmodus](/de/nodes/talk).
- Gesprächsfähige iOS-Nodes geben die Fähigkeit `talk` bekannt und können `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` und `talk.ptt.once` deklarieren; der Gateway erlaubt diese Push-to-Talk-Befehle standardmäßig für vertrauenswürdige, gesprächsfähige Nodes.
- iOS kann Hintergrund-Audio anhalten; betrachten Sie Sprachfunktionen als Best-Effort-Funktionen, wenn die App nicht aktiv ist.

## Häufige Fehler

- `NODE_BACKGROUND_UNAVAILABLE`: Bringen Sie die iOS-App in den Vordergrund (Canvas-, Kamera- und Bildschirmbefehle setzen dies voraus).
- `A2UI_HOST_UNAVAILABLE`: Die gebündelte A2UI-Seite war in der WebView der App nicht erreichbar; lassen Sie die App im Vordergrund auf dem Tab Screen geöffnet und versuchen Sie es erneut.
- Die Kopplungsaufforderung wird nie angezeigt: Führen Sie `openclaw devices list` aus und genehmigen Sie die Kopplung manuell.
- Die Watch zeigt keinen iPhone-Status an: Vergewissern Sie sich, dass das iPhone `watchPaired: true`
  und `watchAppInstalled: true` in `watch.status` meldet. Wenn die Kopplung auf „false“ gesetzt ist, koppeln Sie die
  Watch in Apples Watch-App. Wenn die Installation auf „false“ gesetzt ist, installieren Sie die Begleit-App
  unter **My Watch -> Available Apps**. Öffnen Sie OpenClaw nach jeder dieser Änderungen einmal auf der
  Watch; unmittelbare Erreichbarkeit setzt weiterhin voraus, dass beide Apps ausgeführt werden,
  während Aktualisierungen in der Warteschlange später im Hintergrund eintreffen können.
- Die erneute Verbindung schlägt nach der Neuinstallation fehl: Das Kopplungstoken im Schlüsselbund wurde gelöscht; koppeln Sie die Node erneut.

## Verwandte Dokumentation

- [Kopplung](/de/channels/pairing)
- [Erkennung](/de/gateway/discovery)
- [Bonjour](/de/gateway/bonjour)
