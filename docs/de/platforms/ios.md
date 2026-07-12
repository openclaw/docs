---
read_when:
    - Koppeln oder erneutes Verbinden des iOS-Node
    - Den direkten Apple-Watch-Node aktivieren oder Fehler beheben
    - Ausführen der iOS-App aus dem Quellcode
    - Fehlerbehebung bei der Gateway-Erkennung oder bei Canvas-Befehlen
summary: 'iOS-Node-App: Verbindung mit dem Gateway, Kopplung, Canvas und Fehlerbehebung'
title: iOS-App
x-i18n:
    generated_at: "2026-07-12T15:29:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 30d70f6df7fa1226bbcc79da4e7ece29f8531d5ea1fcf23b742e78d36fb9fc02
    source_path: platforms/ios.md
    workflow: 16
---

Verfügbarkeit: iPhone-App-Builds werden über Apple-Kanäle verteilt, wenn dies für ein Release aktiviert ist. Lokale Entwicklungs-Builds können auch aus dem Quellcode ausgeführt werden.

## Funktionsweise

- Stellt über WebSocket eine Verbindung zu einem Gateway her (LAN oder Tailnet).
- Stellt Node-Funktionen bereit: Canvas, Bildschirmaufnahme, Kameraaufnahme, Standort, Gesprächsmodus, Sprachaktivierung.
- Empfängt `node.invoke`-Befehle und meldet Node-Statusereignisse.
- Ermöglicht auf der Agents-Oberfläche (Dateien) schreibgeschützten Zugriff auf den Arbeitsbereich des ausgewählten Agenten: Navigation durch Verzeichnisse, Textvorschauen mit Syntaxhervorhebung, Bildvorschauen und Export über das Teilen-Menü. Keine Schreibvorgänge; die Größe der Vorschauen wird durch das Gateway begrenzt.
- Verwaltet pro gekoppeltem Gateway einen kleinen schreibgeschützten Offline-Cache der letzten Chatsitzungen und Transkripte: Bei einem Kaltstart wird sofort das zuletzt bekannte Transkript angezeigt und aktualisiert, sobald das Gateway antwortet; letzte Chats bleiben auch ohne Verbindung durchsuchbar; Zurücksetzen/Entfernen löscht den geschützten lokalen Cache.
- Stellt Textnachrichten, die ohne Verbindung gesendet werden, in eine dauerhafte Gateway-spezifische Ausgangswarteschlange (bis zu 50): Nachrichten in der Warteschlange werden im Transkript angezeigt, bei der erneuten Verbindung der Reihe nach mit idempotenten Wiederholungsversuchen gesendet, bleiben dauerhaft erhalten, bis der kanonische Verlauf den Versand bestätigt, werden mit zunehmender Verzögerung erneut versucht, bevor eine Aktion zum Wiederholen/Löschen angezeigt wird, und verfallen nach 48 Stunden ohne Verbindung, statt gesendet zu werden; Zurücksetzen/Entfernen löscht die Warteschlange zusammen mit dem Cache.
- Gibt Assistentennachrichten auf Anforderung sprachlich wieder: Drücken Sie im Chat lange auf eine Nachricht und wählen Sie **Anhören**. Die App spielt unterstützte `tts.speak`-Clips des Gateways mit dem konfigurierten TTS-Provider ab und greift auf die Sprachausgabe des Geräts zurück, wenn Gateway-Audio nicht verfügbar oder nicht abspielbar ist. Die Wiedergabe wird beim Wechsel der Sitzung oder beim Wechsel in den Hintergrund beendet.

## Voraussetzungen

- Ein Gateway, das auf einem anderen Gerät ausgeführt wird (macOS, Linux oder Windows über WSL2).
- Netzwerkpfad:
  - Dasselbe LAN über Bonjour, **oder**
  - Tailnet über Unicast-DNS-SD (Beispieldomain: `openclaw.internal.`), **oder**
  - Manueller Host/Port (Fallback).

## Schnellstart (koppeln + verbinden)

1. Starten Sie ein authentifiziertes Gateway mit einer Route, die Ihr Telefon erreichen kann. Tailscale
   Serve ist der empfohlene Pfad für Remotezugriff:

```bash
openclaw gateway --port 18789 --tailscale serve
```

Verwenden Sie für eine vertrauenswürdige Konfiguration im selben LAN stattdessen ein authentifiziertes `gateway.bind: "lan"`.
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
   Anfrage anzeigt, prüfen Sie deren Rolle und Geltungsbereiche, bevor Sie sie genehmigen.

Die Schaltfläche der Control UI erfordert eine bereits gekoppelte Sitzung mit `operator.admin`.
Wählen Sie als Terminal-Fallback in der iOS-App ein erkanntes Gateway aus (oder aktivieren Sie
Manual Host und geben Sie Host/Port ein) und genehmigen Sie anschließend die Anfrage auf dem Gateway-Host:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Wenn die App die Kopplung mit geänderten Authentifizierungsdetails (Rolle/Geltungsbereiche/öffentlicher Schlüssel) erneut versucht, wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt. Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Optional: Wenn der iOS-Node immer aus einem streng kontrollierten Subnetz eine Verbindung herstellt, können Sie die automatische Genehmigung der erstmaligen Node-Kopplung mit expliziten CIDRs oder exakten IP-Adressen aktivieren:

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

Dies ist standardmäßig deaktiviert. Es gilt nur für eine neue Kopplung mit `role: node` ohne angeforderte Geltungsbereiche. Operator-/Browser-Kopplungen sowie jede Änderung an Rolle, Geltungsbereich, Metadaten oder öffentlichem Schlüssel erfordern weiterhin eine manuelle Genehmigung.

5. Überprüfen Sie die Verbindung:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

Standardmäßig verwendet die begleitende Apple-Watch-App weiterhin das vorhandene iPhone-Relay und
benötigt keine separate Kopplung mit dem Gateway. Koppeln Sie die Watch in
Apples Watch-App mit dem iPhone, installieren Sie OpenClaw über **Watch app -> My Watch -> Available
Apps** und öffnen Sie OpenClaw anschließend einmal auf beiden Geräten.

## Befehlsfreigaben prüfen

Eine Operator-Verbindung mit `operator.admin` oder eine gekoppelte,
vom Gateway explizit ausgewählte `operator.approvals`-Verbindung kann
ausstehende Ausführungsanfragen auf dem iPhone prüfen. Die Freigabekarte zeigt die
bereinigte Befehlsvorschau, Warnung, den Hostkontext und die Ablaufzeit des Gateways sowie ausschließlich die
von dieser Anfrage angebotenen Entscheidungen. Die gekoppelte Apple Watch erhält dieselbe
für Prüfer geeignete Eingabeaufforderung über das vorhandene iPhone-Relay und bietet die kompakte
Auswahl „einmalig erlauben/ablehnen“. Im direkten Watch-Gateway-Modus werden
keine Freigabeaufforderungen übertragen.

Der Freigabestatus wird mit der Control UI und unterstützten Chat-Oberflächen geteilt. Die
erste verbindlich übermittelte Antwort gilt. iPhone und Watch rufen den kanonischen
Abschlussdatensatz des Gateways ab, nachdem eine andere Oberfläche die Anfrage bearbeitet hat, nach einer
Remote-Benachrichtigung über die Bearbeitung und immer dann, wenn eine Bestätigung der Bearbeitung
verloren gegangen sein könnte. Aktionen bleiben nicht verfügbar, bis dieses erneute Auslesen bestätigt, ob die
Anfrage weiterhin aussteht.

Die Zuständigkeit für Freigaben ist an das ausgewählte Gateway gebunden. Beim Wechseln des Gateways kann
eine alte Eingabeaufforderung nicht auf die neue Verbindung angewendet werden. Gateways, die älter als die
vereinheitlichten Freigabemethoden sind, greifen auf die ausgelieferten ausführungsbezogenen Methoden zurück;
gespeicherter Abschlussstatus und umfangreichere oberflächenübergreifende Ergebnisse erfordern ein aktualisiertes
Gateway.

## Optionaler direkter Apple-Watch-Node

Im direkten Modus erhält die Watch eine eigene signierte Node-Identität und Gateway-Verbindung.
Unterstützte Node-Befehle funktionieren weiterhin über Watch-WLAN oder Mobilfunk, solange
OpenClaw aktiv ist, selbst wenn das gekoppelte iPhone nicht verfügbar ist.

Voraussetzungen:

- Das iPhone ist mit dem Geltungsbereich `operator.admin` mit dem Gateway verbunden.
- Der Einrichtungscode gibt einen `wss://`-Gateway-Endpunkt mit einem von watchOS als vertrauenswürdig eingestuften Zertifikat an;
  die Watch fragt den entsprechenden `https://`-Ursprung ab. Unverschlüsseltes HTTP sowie
  selbstsigniertes oder ausschließlich per Fingerabdruck vertrauenswürdiges TLS werden nicht unterstützt. Informationen zur Endpunktkonfiguration finden Sie unter [Gateway-eigene
  Kopplung](/de/gateway/pairing). Loopback-, reine iPhone- und reine Tailnet-Routen
  sind für die Watch nicht eigenständig erreichbar.
- Die Mobilfunknutzung erfordert eine mobilfunkfähige Apple Watch mit aktivem Dienst.
- OpenClaw ist auf der Watch aktiv. Apple erlaubt gewöhnlichen watchOS-Apps nicht,
  generische WebSocket-/TCP-Verbindungen aufrechtzuerhalten. Daher verwendet der direkte Node kurze HTTPS-
  Abfragen und stellt die Verbindung wieder her, wenn die App in den Vordergrund zurückkehrt. Siehe Apples
  [Hinweise zur Low-Level-Netzwerknutzung unter watchOS](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS).

Einrichtung:

1. Öffnen Sie auf dem iPhone **Settings -> Apple Watch**.
2. Tippen Sie auf **Enable Direct Gateway Connection**.
3. Öffnen Sie OpenClaw auf der Watch, bevor der kurzlebige Einrichtungscode abläuft.
4. Überprüfen Sie die separate Apple-Watch-Zeile mit `openclaw nodes status`.

Der Einrichtungscode enthält einen kurzlebigen, ausschließlich für Nodes bestimmten Bootstrap-Zugangsnachweis; behandeln Sie ihn
bis zu seinem Ablauf wie ein Passwort. Er enthält niemals das auf dem iPhone gespeicherte Gateway-
Passwort oder -Token. Nach der Kopplung speichert die Watch ihr eigenes Geräte-Token und
löscht den Bootstrap-Zugangsnachweis. Der direkte Modus deckt nur die unten aufgeführten Befehle ab.
Chat, Gesprächsmodus, Freigaben und der vorhandene `watch.*`-Benachrichtigungsablauf bleiben
Funktionen des iPhone-Relays und erfordern weiterhin das gekoppelte iPhone.

Direkte watchOS-Node-Befehle:

| Oberfläche     | Befehle                        | Hinweise                                                    |
| -------------- | ------------------------------ | ----------------------------------------------------------- |
| Gerät          | `device.info`, `device.status` | Watch-Identität, Akku, Temperatur, Speicher und Netzwerk.   |
| Benachrichtigungen | `system.notify`            | Während die App aktiv ist; erfordert eine Watch-Berechtigung. |

watchOS stellt Drittanbieter-Apps kein WebKit bereit. Daher
gibt der direkte Watch-Node keine Canvas-Befehle an.

## Relay-gestützte Push-Benachrichtigungen für offizielle Builds

Offiziell verteilte iOS-Builds verwenden ein externes Push-Relay, anstatt das unverschlüsselte APNs-Token für das Gateway zu veröffentlichen. Offizielle App-Store-Builds aus dem öffentlichen Release-Kanal verwenden das gehostete Relay unter `https://ios-push-relay.openclaw.ai`; diese Basis-URL ist für die App-Store-Verteilung fest einprogrammiert und liest keine Überschreibung.

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

So funktioniert der Ablauf:

- Die iOS-App registriert sich beim Relay mithilfe von App Attest und einer StoreKit-App-Transaktions-JWS.
- Das Relay gibt eine nicht transparente Relay-Kennung sowie eine auf die Registrierung beschränkte Sendeberechtigung zurück.
- Die iOS-App ruft die Identität des gekoppelten Gateways (`gateway.identity.get`) ab und nimmt sie in die Relay-Registrierung auf, sodass die Relay-gestützte Registrierung an dieses bestimmte Gateway delegiert wird.
- Die App leitet diese Relay-gestützte Registrierung mit `push.apns.register` an das gekoppelte Gateway weiter.
- Das Gateway verwendet die gespeicherte Relay-Kennung für `push.test`, Aktivierungen im Hintergrund und Aktivierungsimpulse.
- Wenn die App später eine Verbindung zu einem anderen Gateway oder zu einem Build mit einer anderen Relay-Basis-URL herstellt, aktualisiert sie die Relay-Registrierung, statt die alte Bindung wiederzuverwenden.

Was das Gateway für diesen Pfad **nicht** benötigt: kein bereitstellungsweites Relay-Token und keinen direkten APNs-Schlüssel für Relay-gestützte Sendungen offizieller App-Store-Builds.

Erwarteter Ablauf für Operatoren:

1. Installieren Sie die offizielle iOS-App.
2. Optional: Legen Sie `gateway.push.apns.relay.baseUrl` auf dem Gateway nur fest, wenn Sie einen bewusst separaten benutzerdefinierten Relay-Build verwenden.
3. Koppeln Sie die App mit dem Gateway und lassen Sie den Verbindungsaufbau abschließen.
4. Die App veröffentlicht `push.apns.register`, sobald sie über ein APNs-Token verfügt, die Operator-Sitzung verbunden ist und die Relay-Registrierung erfolgreich war.
5. Danach können `push.test`, Aktivierungen zur Wiederverbindung und Aktivierungsimpulse die gespeicherte Relay-gestützte Registrierung verwenden.

## Alive-Beacons im Hintergrund

Wenn iOS die App aufgrund einer stillen Push-Benachrichtigung, einer Hintergrundaktualisierung oder eines signifikanten Standortereignisses aktiviert, versucht die App, kurzzeitig eine Node-Verbindung wiederherzustellen, und ruft anschließend `node.event` mit `event: "node.presence.alive"` auf. Das Gateway zeichnet dies nur dann als `lastSeenAtMs`/`lastSeenReason` in den Metadaten des gekoppelten Nodes/Geräts auf, nachdem die authentifizierte Node-Geräteidentität bekannt ist.

Die App betrachtet eine Hintergrundaktivierung nur dann als erfolgreich aufgezeichnet, wenn die Gateway-Antwort `handled: true` enthält. Ältere Gateways bestätigen `node.event` möglicherweise mit `{ "ok": true }`; diese Antwort ist kompatibel, gilt jedoch nicht als dauerhafte Aktualisierung des letzten Kontakts.

Kompatibilitätshinweis:

- `OPENCLAW_APNS_RELAY_BASE_URL` funktioniert weiterhin als vorübergehende Umgebungsüberschreibung für das Gateway (`gateway.push.apns.relay.baseUrl` ist der bevorzugte Konfigurationspfad).
- Der Push-Modus des App-Store-Release-Builds enthält den gehosteten Relay-Host fest einprogrammiert und liest niemals eine Relay-URL-Überschreibung – die Buildzeit-Umgebungsvariable `OPENCLAW_PUSH_RELAY_BASE_URL` wirkt sich nur auf lokale/Sandbox-iOS-Build-Modi aus.

## Authentifizierungs- und Vertrauensablauf

Das Relay dient dazu, zwei Einschränkungen durchzusetzen, die direktes APNs auf dem Gateway für offizielle iOS-Builds nicht gewährleisten kann:

- Nur echte, über Apple verteilte OpenClaw-iOS-Builds können das gehostete Relay verwenden.
- Ein Gateway kann Relay-gestützte Push-Benachrichtigungen nur für iOS-Geräte senden, die mit genau diesem Gateway gekoppelt wurden.

Schritt für Schritt:

1. `iOS app -> gateway`: Die App koppelt sich über den normalen Gateway-Authentifizierungsablauf mit dem Gateway und erhält dadurch eine authentifizierte Node-Sitzung sowie eine authentifizierte Operatorsitzung. Die Operatorsitzung ruft `gateway.identity.get` auf.
2. `iOS app -> relay`: Die App ruft die Relay-Registrierungsendpunkte über HTTPS mit einem App-Attest-Nachweis sowie einer StoreKit-App-Transaktions-JWS auf. Das Relay validiert die Bundle-ID, den App-Attest-Nachweis und den Apple-Distributionsnachweis und erfordert den offiziellen Produktionsdistributionspfad – dadurch werden lokale Xcode-/Entwicklungs-Builds von der Nutzung des gehosteten Relays ausgeschlossen, da ein lokaler Build den offiziellen Apple-Distributionsnachweis nicht erbringen kann.
3. `gateway identity delegation`: Vor der Relay-Registrierung ruft die App die Identität des gekoppelten Gateways über `gateway.identity.get` ab und nimmt sie in die Relay-Registrierungsnutzlast auf. Das Relay gibt ein Relay-Handle und eine auf die Registrierung beschränkte Sendeberechtigung zurück, die an diese Gateway-Identität delegiert ist.
4. `gateway -> relay`: Das Gateway speichert das Relay-Handle und die Sendeberechtigung aus `push.apns.register`. Bei `push.test`, durch erneute Verbindungen ausgelösten Aktivierungen und Aktivierungsimpulsen signiert das Gateway die Sendeanforderung mit seiner eigenen Geräteidentität; das Relay prüft sowohl die gespeicherte Sendeberechtigung als auch die Gateway-Signatur anhand der bei der Registrierung delegierten Gateway-Identität. Ein anderes Gateway kann diese gespeicherte Registrierung nicht wiederverwenden, selbst wenn es irgendwie an das Handle gelangt.
5. `relay -> APNs`: Das Relay verwaltet die produktiven APNs-Anmeldedaten und das unverarbeitete APNs-Token für den offiziellen Build. Das Gateway speichert das unverarbeitete APNs-Token für Relay-gestützte offizielle Builds niemals; das Relay sendet die endgültige Push-Benachrichtigung im Namen des gekoppelten Gateways an APNs.

Warum dieses Design entwickelt wurde: um produktive APNs-Anmeldedaten von Benutzer-Gateways fernzuhalten, die Speicherung unverarbeiteter APNs-Token offizieller Builds auf dem Gateway zu vermeiden, die Nutzung des gehosteten Relays ausschließlich offiziellen OpenClaw-iOS-Builds zu ermöglichen und zu verhindern, dass ein Gateway Aktivierungs-Push-Benachrichtigungen an iOS-Geräte sendet, die einem anderen Gateway zugeordnet sind.

Lokale/manuelle Builds verwenden weiterhin direkte APNs. Wenn Sie diese Builds ohne das Relay testen, benötigt das Gateway weiterhin direkte APNs-Anmeldedaten:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Dies sind Laufzeitumgebungsvariablen des Gateway-Hosts, keine Fastlane-Einstellungen. `apps/ios/fastlane/.env` speichert nur die App-Store-Connect-Authentifizierung wie `APP_STORE_CONNECT_KEY_ID` und `APP_STORE_CONNECT_ISSUER_ID`; sie konfiguriert keine direkte APNs-Zustellung für lokale iOS-Builds.

Empfohlene Speicherung auf dem Gateway-Host, entsprechend anderen Provider-Anmeldedaten unter `~/.openclaw/credentials/`:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Committen Sie die `.p8`-Datei nicht und legen Sie sie nicht im Repository-Checkout ab.

## Erkennungspfade

### Bonjour (LAN)

Die iOS-App sucht nach `_openclaw-gw._tcp` unter `local.` und, sofern konfiguriert, in derselben Wide-Area-DNS-SD-Erkennungsdomäne. Gateways im selben LAN werden automatisch über `local.` angezeigt; für die netzwerkübergreifende Erkennung kann die konfigurierte Wide-Area-Domäne verwendet werden, ohne den Beacon-Typ zu ändern.

### Tailnet (netzwerkübergreifend)

Wenn mDNS blockiert ist, verwenden Sie eine Unicast-DNS-SD-Zone (wählen Sie eine Domäne; Beispiel: `openclaw.internal.`) und Tailscale Split DNS. Ein CoreDNS-Beispiel finden Sie unter [Bonjour](/de/gateway/bonjour).

### Manueller Host/Port

Aktivieren Sie in den Einstellungen **Manual Host** und geben Sie Host und Port des Gateways ein (Standard: `18789`).

## Mehrere Gateways

Die App führt eine Registrierung aller Gateways, mit denen sie gekoppelt wurde, sodass Sie zwischen ihnen wechseln können, ohne sie erneut zu koppeln:

- Unter **Settings -> Gateway** wird eine Liste **Paired Gateways** angezeigt, in der das aktive Gateway markiert ist. Tippen Sie auf einen Eintrag, um zu wechseln; die App beendet die aktuellen Sitzungen und stellt die Verbindung zum ausgewählten Gateway erneut her. Wenn mehr als ein Gateway gekoppelt ist, erscheint neben der Verbindungszeile ein Schnellwechselmenü.
- Anmeldedaten, TLS-Vertrauensentscheidungen, Gateway-spezifische Einstellungen und der zwischengespeicherte Chatverlauf werden für jedes Gateway separat gespeichert. Beim Wechsel werden Zustände verschiedener Gateways niemals vermischt, und die Push-Registrierung folgt dem aktiven Gateway.
- Wischen Sie über ein gekoppeltes Gateway (oder verwenden Sie dessen Kontextmenü), um es mit **Forget** zu entfernen. Dadurch werden seine Anmeldedaten, Gerätetoken, der TLS-Pin und zwischengespeicherte Chats gelöscht.
- Erkannte Gateways müssen im Netzwerk sichtbar sein, damit Sie zu ihnen wechseln können; manuell konfigurierte Gateways stellen die Verbindung über den gespeicherten Host und Port wieder her.

## Canvas + A2UI

Die iOS-Node rendert eine WKWebView-Canvas. Steuern Sie sie mit `node.invoke`:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Hinweise:

- Der Canvas-Host des Gateways stellt `/__openclaw__/canvas/` und `/__openclaw__/a2ui/` über den HTTP-Server des Gateways bereit (derselbe Port wie `gateway.port`, Standard: `18789`).
- Die iOS-Node verwendet das integrierte Grundgerüst als verbundene Standardansicht. `canvas.a2ui.push` und `canvas.a2ui.reset` verwenden die gebündelte, der App zugehörige A2UI-Seite.
- Entfernte Gateway-A2UI-Seiten können unter iOS nur gerendert werden; native A2UI-Schaltflächenaktionen werden nur von gebündelten, der App zugehörigen Seiten akzeptiert.
- Kehren Sie mit `canvas.navigate` und `{"url":""}` zum integrierten Grundgerüst zurück.

## Beziehung zu Computer Use

Die iOS-App ist eine mobile Node-Oberfläche und kein Backend für Codex Computer Use. Codex Computer Use und `cua-driver mcp` steuern einen lokalen macOS-Desktop über MCP-Tools; die iOS-App stellt iPhone-Funktionen über OpenClaw-Node-Befehle wie `canvas.*`, `camera.*`, `screen.*`, `location.*` und `talk.*` bereit.

Agenten können die iOS-App weiterhin über OpenClaw bedienen, indem sie Node-Befehle aufrufen. Diese Aufrufe erfolgen jedoch über das Gateway-Node-Protokoll und unterliegen den Vordergrund-/Hintergrundbeschränkungen von iOS. Verwenden Sie [Codex Computer Use](/de/plugins/codex-computer-use) für die lokale Desktopsteuerung und diese Seite für die Funktionen der iOS-Node.

### Canvas-Auswertung/Snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Sprachaktivierung + Gesprächsmodus

- Sprachaktivierung und Gesprächsmodus sind in den Einstellungen verfügbar.
- OpenAI Realtime Talk verwendet vom Client verwaltetes WebRTC, wenn `talk.realtime.transport` auf `webrtc` gesetzt ist; eine explizite `gateway-relay`-Konfiguration bleibt vom Gateway verwaltet. Siehe [Gesprächsmodus](/de/nodes/talk).
- Gesprächsfähige iOS-Nodes kündigen die Funktion `talk` an und können `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` und `talk.ptt.once` deklarieren; das Gateway erlaubt diese Push-to-Talk-Befehle standardmäßig für vertrauenswürdige, gesprächsfähige Nodes.
- iOS kann Hintergrundaudio aussetzen; betrachten Sie Sprachfunktionen als Best-Effort-Funktionen, wenn die App nicht aktiv ist.

## Häufige Fehler

- `NODE_BACKGROUND_UNAVAILABLE`: Bringen Sie die iOS-App in den Vordergrund (Canvas-/Kamera-/Bildschirmbefehle erfordern dies).
- `A2UI_HOST_UNAVAILABLE`: Die gebündelte A2UI-Seite war in der WebView der App nicht erreichbar; lassen Sie die App im Vordergrund auf der Registerkarte Screen geöffnet und versuchen Sie es erneut.
- Die Kopplungsaufforderung erscheint nicht: Führen Sie `openclaw devices list` aus und genehmigen Sie die Kopplung manuell.
- Die Watch zeigt keinen iPhone-Status: Vergewissern Sie sich, dass das iPhone in `watch.status` sowohl `watchPaired: true`
  als auch `watchAppInstalled: true` meldet. Wenn die Kopplung auf „false“ steht, koppeln Sie die
  Watch in Apples Watch-App. Wenn die Installation auf „false“ steht, installieren Sie die Begleit-App
  über **My Watch -> Available Apps**. Öffnen Sie OpenClaw nach jeder dieser Änderungen einmal auf der
  Watch; für die sofortige Erreichbarkeit müssen weiterhin beide Apps ausgeführt werden,
  während Aktualisierungen in der Warteschlange später im Hintergrund eintreffen können.
- Die erneute Verbindung schlägt nach einer Neuinstallation fehl: Das Kopplungstoken im Schlüsselbund wurde gelöscht; koppeln Sie die Node erneut.

## Zugehörige Dokumentation

- [Kopplung](/de/channels/pairing)
- [Erkennung](/de/gateway/discovery)
- [Bonjour](/de/gateway/bonjour)
