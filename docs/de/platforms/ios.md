---
read_when:
    - Koppeln oder erneutes Verbinden des iOS-Node
    - Die iOS-App aus dem Quellcode ausführen
    - Gateway-Erkennung oder Canvas-Befehle debuggen
summary: 'iOS-Node-App: Verbindung zum Gateway, Kopplung, Canvas und Fehlerbehebung'
title: iOS-App
x-i18n:
    generated_at: "2026-06-27T17:42:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a93381fd2b95316e05a555bee45b9aed5572679b4b1f10f7f9e40c1a69faf17
    source_path: platforms/ios.md
    workflow: 16
---

Verfügbarkeit: iPhone-App-Builds werden über Apple-Kanäle verteilt, wenn dies für ein Release aktiviert ist. Lokale Entwicklungs-Builds können auch aus dem Quellcode ausgeführt werden.

## Was sie tut

- Stellt über WebSocket eine Verbindung zu einem Gateway her (LAN oder Tailnet).
- Stellt Node-Funktionen bereit: Canvas, Bildschirm-Snapshot, Kameraaufnahme, Standort, Talk-Modus, Sprachaktivierung.
- Empfängt `node.invoke`-Befehle und meldet Node-Statusereignisse.

## Anforderungen

- Gateway, das auf einem anderen Gerät läuft (macOS, Linux oder Windows über WSL2).
- Netzwerkpfad:
  - Gleiches LAN über Bonjour, **oder**
  - Tailnet über Unicast-DNS-SD (Beispieldomain: `openclaw.internal.`), **oder**
  - Manueller Host/Port (Fallback).

## Schnellstart (koppeln + verbinden)

1. Starten Sie das Gateway:

```bash
openclaw gateway --port 18789
```

2. Öffnen Sie in der iOS-App die Einstellungen und wählen Sie ein gefundenes Gateway aus (oder aktivieren Sie Manueller Host und geben Sie Host/Port ein).

3. Genehmigen Sie die Kopplungsanfrage auf dem Gateway-Host:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Wenn die App die Kopplung mit geänderten Authentifizierungsdetails (Rolle/Scopes/öffentlicher Schlüssel) erneut versucht,
wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt.
Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Optional: Wenn sich der iOS-Node immer aus einem streng kontrollierten Subnetz verbindet, können Sie
die automatische erstmalige Node-Genehmigung mit expliziten CIDRs oder exakten IPs aktivieren:

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

Dies ist standardmäßig deaktiviert. Es gilt nur für neue `role: node`-Kopplungen ohne
angeforderte Scopes. Operator-/Browser-Kopplung sowie jede Änderung an Rolle, Scope, Metadaten oder
öffentlichem Schlüssel erfordern weiterhin eine manuelle Genehmigung.

4. Prüfen Sie die Verbindung:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Relay-gestützte Push-Benachrichtigungen für offizielle Builds

Offiziell verteilte iOS-Builds verwenden das externe Push-Relay, anstatt das rohe APNs-
Token am Gateway zu veröffentlichen.

Offizielle/TestFlight-Builds aus dem öffentlichen App-Store-Release-Pfad verwenden das gehostete Relay unter `https://ios-push-relay.openclaw.ai`.

Benutzerdefinierte Relay-Bereitstellungen erfordern einen bewusst separaten iOS-Build-/Deployment-Pfad, dessen Relay-URL mit der Gateway-Relay-URL übereinstimmt. Der öffentliche App-Store-Release-Pfad akzeptiert keine benutzerdefinierten Relay-URL-Overrides. Wenn Sie einen benutzerdefinierten Relay-Build verwenden, setzen Sie die passende Gateway-Relay-URL:

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

- Die iOS-App registriert sich beim Relay mit App Attest und einer StoreKit-App-Transaktions-JWS.
- Das Relay gibt ein opakes Relay-Handle sowie eine auf die Registrierung beschränkte Sendeberechtigung zurück.
- Die iOS-App ruft die Identität des gekoppelten Gateways ab und nimmt sie in die Relay-Registrierung auf, sodass die Relay-gestützte Registrierung an genau dieses Gateway delegiert wird.
- Die App leitet diese Relay-gestützte Registrierung mit `push.apns.register` an das gekoppelte Gateway weiter.
- Das Gateway verwendet dieses gespeicherte Relay-Handle für `push.test`, Hintergrund-Weckvorgänge und Wake-Nudges.
- Benutzerdefinierte Gateway-Relay-URLs müssen mit der in den iOS-Build eingebetteten Relay-URL übereinstimmen.
- Wenn sich die App später mit einem anderen Gateway oder einem Build mit einer anderen Relay-Basis-URL verbindet, aktualisiert sie die Relay-Registrierung, anstatt die alte Bindung wiederzuverwenden.

Was das Gateway für diesen Pfad **nicht** benötigt:

- Kein deploymentweites Relay-Token.
- Kein direkter APNs-Schlüssel für offizielle/TestFlight-Relay-gestützte Sends.

Erwarteter Ablauf für Operatoren:

1. Installieren Sie den offiziellen/TestFlight-iOS-Build.
2. Optional: Setzen Sie `gateway.push.apns.relay.baseUrl` am Gateway nur, wenn Sie einen bewusst separaten benutzerdefinierten Relay-Build verwenden.
3. Koppeln Sie die App mit dem Gateway und lassen Sie die Verbindung abschließen.
4. Die App veröffentlicht `push.apns.register` automatisch, nachdem sie ein APNs-Token hat, die Operator-Sitzung verbunden ist und die Relay-Registrierung erfolgreich war.
5. Danach können `push.test`, Wiederverbindungs-Weckvorgänge und Wake-Nudges die gespeicherte Relay-gestützte Registrierung verwenden.

## Hintergrund-Alive-Beacons

Wenn iOS die App für einen Silent Push, eine Hintergrundaktualisierung oder ein Significant-Location-Ereignis weckt, versucht die App
eine kurze Node-Wiederverbindung und ruft dann `node.event` mit `event: "node.presence.alive"` auf.
Das Gateway speichert dies nur dann als `lastSeenAtMs`/`lastSeenReason` in den Metadaten des gekoppelten Nodes/Geräts,
nachdem die authentifizierte Node-Geräteidentität bekannt ist.

Die App behandelt einen Hintergrund-Weckvorgang nur dann als erfolgreich aufgezeichnet, wenn die Gateway-Antwort
`handled: true` enthält. Ältere Gateways können `node.event` mit `{ "ok": true }` bestätigen; diese Antwort ist
kompatibel, zählt aber nicht als dauerhafte Last-Seen-Aktualisierung.

Kompatibilitätshinweis:

- `OPENCLAW_APNS_RELAY_BASE_URL` funktioniert weiterhin als temporärer Env-Override für das Gateway.
- Der öffentliche App-Store-Release-Pfad lehnt `OPENCLAW_PUSH_RELAY_BASE_URL` für iOS-Builds ab.

## Authentifizierungs- und Vertrauensfluss

Das Relay existiert, um zwei Einschränkungen durchzusetzen, die direktes APNs-am-Gateway für
offizielle iOS-Builds nicht bieten kann:

- Nur echte OpenClaw-iOS-Builds, die über Apple verteilt werden, können das gehostete Relay verwenden.
- Ein Gateway kann Relay-gestützte Push-Benachrichtigungen nur für iOS-Geräte senden, die mit genau diesem
  Gateway gekoppelt wurden.

Schritt für Schritt:

1. `iOS app -> gateway`
   - Die App koppelt sich zunächst über den normalen Gateway-Authentifizierungsfluss mit dem Gateway.
   - Dadurch erhält die App eine authentifizierte Node-Sitzung sowie eine authentifizierte Operator-Sitzung.
   - Die Operator-Sitzung wird verwendet, um `gateway.identity.get` aufzurufen.

2. `iOS app -> relay`
   - Die App ruft die Relay-Registrierungsendpunkte über HTTPS auf.
   - Die Registrierung enthält einen App-Attest-Nachweis sowie eine StoreKit-App-Transaktions-JWS.
   - Das Relay validiert die Bundle-ID, den App-Attest-Nachweis und den Apple-Distributionsnachweis und verlangt den
     offiziellen/Produktions-Distributionspfad.
   - Dadurch werden lokale Xcode-/Dev-Builds daran gehindert, das gehostete Relay zu verwenden. Ein lokaler Build kann
     signiert sein, erfüllt aber nicht den offiziellen Apple-Distributionsnachweis, den das Relay erwartet.

3. `gateway identity delegation`
   - Vor der Relay-Registrierung ruft die App die Identität des gekoppelten Gateways über
     `gateway.identity.get` ab.
   - Die App nimmt diese Gateway-Identität in die Relay-Registrierungs-Payload auf.
   - Das Relay gibt ein Relay-Handle und eine auf die Registrierung beschränkte Sendeberechtigung zurück, die an
     diese Gateway-Identität delegiert sind.

4. `gateway -> relay`
   - Das Gateway speichert das Relay-Handle und die Sendeberechtigung aus `push.apns.register`.
   - Bei `push.test`, Wiederverbindungs-Weckvorgängen und Wake-Nudges signiert das Gateway die Sendeanfrage mit seiner
     eigenen Geräteidentität.
   - Das Relay verifiziert sowohl die gespeicherte Sendeberechtigung als auch die Gateway-Signatur gegen die bei der Registrierung delegierte
     Gateway-Identität.
   - Ein anderes Gateway kann diese gespeicherte Registrierung nicht wiederverwenden, selbst wenn es irgendwie an das Handle gelangt.

5. `relay -> APNs`
   - Das Relay besitzt die Produktions-APNs-Anmeldedaten und das rohe APNs-Token für den offiziellen Build.
   - Das Gateway speichert bei Relay-gestützten offiziellen Builds niemals das rohe APNs-Token.
   - Das Relay sendet die endgültige Push-Benachrichtigung im Namen des gekoppelten Gateways an APNs.

Warum dieses Design erstellt wurde:

- Um Produktions-APNs-Anmeldedaten von Benutzer-Gateways fernzuhalten.
- Um das Speichern roher APNs-Token offizieller Builds auf dem Gateway zu vermeiden.
- Um die Nutzung des gehosteten Relays nur für offizielle/TestFlight-OpenClaw-Builds zu erlauben.
- Um zu verhindern, dass ein Gateway Wake-Push-Benachrichtigungen an iOS-Geräte sendet, die einem anderen Gateway gehören.

Lokale/manuelle Builds bleiben bei direktem APNs. Wenn Sie diese Builds ohne Relay testen, benötigt das
Gateway weiterhin direkte APNs-Anmeldedaten:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Dies sind Runtime-Env-Vars des Gateway-Hosts, keine Fastlane-Einstellungen. `apps/ios/fastlane/.env` speichert nur
App-Store-Connect-/TestFlight-Authentifizierung wie `APP_STORE_CONNECT_KEY_ID` und
`APP_STORE_CONNECT_ISSUER_ID`; es konfiguriert keine direkte APNs-Zustellung für lokale iOS-Builds.

Empfohlene Speicherung auf dem Gateway-Host:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Committen Sie die `.p8`-Datei nicht und legen Sie sie nicht im Repo-Checkout ab.

## Discovery-Pfade

### Bonjour (LAN)

Die iOS-App durchsucht `_openclaw-gw._tcp` auf `local.` und, wenn konfiguriert, dieselbe
Wide-Area-DNS-SD-Discovery-Domain. Gateways im selben LAN erscheinen automatisch aus `local.`;
netzwerkübergreifende Discovery kann die konfigurierte Wide-Area-Domain verwenden, ohne den Beacon-Typ zu ändern.

### Tailnet (netzwerkübergreifend)

Wenn mDNS blockiert ist, verwenden Sie eine Unicast-DNS-SD-Zone (wählen Sie eine Domain; Beispiel:
`openclaw.internal.`) und Tailscale Split-DNS.
Siehe [Bonjour](/de/gateway/bonjour) für das CoreDNS-Beispiel.

### Manueller Host/Port

Aktivieren Sie in den Einstellungen **Manueller Host** und geben Sie den Gateway-Host + Port ein (Standard `18789`).

## Canvas + A2UI

Der iOS-Node rendert eine WKWebView-Canvas. Verwenden Sie `node.invoke`, um sie zu steuern:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Hinweise:

- Der Gateway-Canvas-Host stellt `/__openclaw__/canvas/` und `/__openclaw__/a2ui/` bereit.
- Er wird vom Gateway-HTTP-Server ausgeliefert (derselbe Port wie `gateway.port`, Standard `18789`).
- Der iOS-Node behält das integrierte Gerüst als verbundene Standardansicht bei. `canvas.a2ui.push` und `canvas.a2ui.reset` verwenden die gebündelte app-eigene A2UI-Seite.
- Remote-Gateway-A2UI-Seiten sind unter iOS nur renderbar; native A2UI-Schaltflächenaktionen werden nur von gebündelten app-eigenen Seiten akzeptiert.
- Kehren Sie mit `canvas.navigate` und `{"url":""}` zum integrierten Gerüst zurück.

## Beziehung zu Computer Use

Die iOS-App ist eine mobile Node-Oberfläche, kein Codex-Computer-Use-Backend. Codex
Computer Use und `cua-driver mcp` steuern einen lokalen macOS-Desktop über MCP-
Tools; die iOS-App stellt iPhone-Funktionen über OpenClaw-Node-Befehle
wie `canvas.*`, `camera.*`, `screen.*`, `location.*` und `talk.*` bereit.

Agents können die iOS-App weiterhin über OpenClaw bedienen, indem sie Node-
Befehle ausführen, aber diese Aufrufe laufen über das Gateway-Node-Protokoll und folgen den
iOS-Vordergrund-/Hintergrundgrenzen. Verwenden Sie [Codex Computer Use](/de/plugins/codex-computer-use)
für lokale Desktop-Steuerung und diese Seite für iOS-Node-Funktionen.

### Canvas-Eval / Snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Sprachaktivierung + Talk-Modus

- Sprachaktivierung und Talk-Modus sind in den Einstellungen verfügbar.
- Talk-fähige iOS-Nodes melden die `talk`-Funktion und können
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` und `talk.ptt.once` deklarieren;
  das Gateway erlaubt diese Push-to-Talk-Befehle standardmäßig für vertrauenswürdige
  Talk-fähige Nodes.
- iOS kann Hintergrundaudio anhalten; behandeln Sie Sprachfunktionen als Best-Effort, wenn die App nicht aktiv ist.

## Häufige Fehler

- `NODE_BACKGROUND_UNAVAILABLE`: Bringen Sie die iOS-App in den Vordergrund (Canvas-/Kamera-/Bildschirmbefehle erfordern dies).
- `A2UI_HOST_UNAVAILABLE`: Die gebündelte A2UI-Seite war in der App-WebView nicht erreichbar; halten Sie die App im Vordergrund auf dem Bildschirm-Tab und versuchen Sie es erneut.
- Kopplungsaufforderung erscheint nie: Führen Sie `openclaw devices list` aus und genehmigen Sie manuell.
- Wiederverbindung schlägt nach Neuinstallation fehl: Das Keychain-Kopplungstoken wurde gelöscht; koppeln Sie den Node erneut.

## Verwandte Dokumentation

- [Kopplung](/de/channels/pairing)
- [Discovery](/de/gateway/discovery)
- [Bonjour](/de/gateway/bonjour)
