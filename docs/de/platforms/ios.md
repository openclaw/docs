---
read_when:
    - iOS-Node koppeln oder erneut verbinden
    - iOS-App aus dem Quellcode ausführen
    - Debugging der Gateway-Erkennung oder Canvas-Befehle
summary: 'iOS-Node-App: Verbindung zum Gateway, Kopplung, Canvas und Fehlerbehebung'
title: iOS-App
x-i18n:
    generated_at: "2026-07-02T22:27:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 150349a06488ecb36a4456d323738cca329c47d83ef6006e6f8de5e39ebb4902
    source_path: platforms/ios.md
    workflow: 16
---

Verfügbarkeit: iPhone-App-Builds werden über Apple-Kanäle verteilt, wenn dies für ein Release aktiviert ist. Lokale Entwicklungs-Builds können außerdem aus dem Quellcode ausgeführt werden.

## Funktionsweise

- Stellt über WebSocket eine Verbindung zu einem Gateway her (LAN oder Tailnet).
- Stellt Node-Funktionen bereit: Canvas, Bildschirm-Snapshot, Kameraaufnahme, Standort, Talk-Modus, Voice Wake.
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

2. Öffnen Sie in der iOS-App die Einstellungen und wählen Sie ein erkanntes Gateway aus (oder aktivieren Sie Manueller Host und geben Sie Host/Port ein).

3. Genehmigen Sie die Kopplungsanfrage auf dem Gateway-Host:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Wenn die App die Kopplung mit geänderten Authentifizierungsdetails (Rolle/Scopes/öffentlicher Schlüssel) erneut versucht,
wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt.
Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Optional: Wenn der iOS-Node immer aus einem streng kontrollierten Subnetz verbindet, können Sie
die automatische Erstgenehmigung von Nodes mit expliziten CIDRs oder exakten IPs aktivieren:

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

Dies ist standardmäßig deaktiviert. Es gilt nur für frische `role: node`-Kopplungen ohne
angeforderte Scopes. Operator-/Browser-Kopplung sowie jede Änderung an Rolle, Scope, Metadaten oder
öffentlichem Schlüssel erfordern weiterhin eine manuelle Genehmigung.

4. Verbindung prüfen:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Relay-gestützte Push-Benachrichtigungen für offizielle Builds

Offiziell verteilte iOS-Builds verwenden das externe Push-Relay, statt das rohe APNs-Token
am Gateway zu veröffentlichen.

Offizielle App-Store-Builds aus dem öffentlichen Release-Kanal verwenden das gehostete Relay unter `https://ios-push-relay.openclaw.ai`.

Benutzerdefinierte Relay-Deployments erfordern einen bewusst separaten iOS-Build-/Deployment-Pfad, dessen Relay-URL mit der Gateway-Relay-URL übereinstimmt. Der öffentliche App-Store-Release-Kanal akzeptiert keine benutzerdefinierten Relay-URL-Überschreibungen. Wenn Sie einen benutzerdefinierten Relay-Build verwenden, setzen Sie die passende Gateway-Relay-URL:

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

- Die iOS-App registriert sich beim Relay mit App Attest und einem StoreKit-App-Transaktions-JWS.
- Das Relay gibt ein opakes Relay-Handle plus eine registrierungsgebundene Sendeberechtigung zurück.
- Die iOS-App ruft die gekoppelte Gateway-Identität ab und bindet sie in die Relay-Registrierung ein, sodass die relay-gestützte Registrierung an genau dieses Gateway delegiert wird.
- Die App leitet diese relay-gestützte Registrierung mit `push.apns.register` an das gekoppelte Gateway weiter.
- Das Gateway verwendet dieses gespeicherte Relay-Handle für `push.test`, Hintergrund-Weckvorgänge und Wake Nudges.
- Benutzerdefinierte Gateway-Relay-URLs müssen mit der in den iOS-Build eingebetteten Relay-URL übereinstimmen.
- Wenn die App später eine Verbindung zu einem anderen Gateway oder einem Build mit einer anderen Relay-Basis-URL herstellt, aktualisiert sie die Relay-Registrierung, statt die alte Bindung wiederzuverwenden.

Was das Gateway für diesen Pfad **nicht** benötigt:

- Kein deploymentweites Relay-Token.
- Kein direkter APNs-Schlüssel für relay-gestützte Sends offizieller App-Store-Builds.

Erwarteter Operator-Ablauf:

1. Installieren Sie die offizielle iOS-App.
2. Optional: Setzen Sie `gateway.push.apns.relay.baseUrl` am Gateway nur dann, wenn Sie einen bewusst separaten benutzerdefinierten Relay-Build verwenden.
3. Koppeln Sie die App mit dem Gateway und lassen Sie sie die Verbindung abschließen.
4. Die App veröffentlicht `push.apns.register` automatisch, nachdem sie ein APNs-Token hat, die Operator-Sitzung verbunden ist und die Relay-Registrierung erfolgreich war.
5. Danach können `push.test`, Reconnect-Weckvorgänge und Wake Nudges die gespeicherte relay-gestützte Registrierung verwenden.

## Hintergrund-Alive-Beacons

Wenn iOS die App wegen eines stillen Push, einer Hintergrundaktualisierung oder eines Significant-Location-Ereignisses weckt, versucht die App
einen kurzen Node-Reconnect und ruft dann `node.event` mit `event: "node.presence.alive"` auf.
Das Gateway speichert dies als `lastSeenAtMs`/`lastSeenReason` in den Metadaten des gekoppelten Nodes/Geräts nur
nachdem die authentifizierte Node-Geräteidentität bekannt ist.

Die App behandelt einen Hintergrund-Weckvorgang nur dann als erfolgreich gespeichert, wenn die Gateway-Antwort
`handled: true` enthält. Ältere Gateways bestätigen `node.event` möglicherweise mit `{ "ok": true }`; diese Antwort ist
kompatibel, zählt aber nicht als dauerhafte Last-Seen-Aktualisierung.

Kompatibilitätshinweis:

- `OPENCLAW_APNS_RELAY_BASE_URL` funktioniert weiterhin als temporäre Env-Überschreibung für das Gateway.
- Der öffentliche App-Store-Release-Kanal lehnt `OPENCLAW_PUSH_RELAY_BASE_URL` für iOS-Builds ab.

## Authentifizierungs- und Vertrauensablauf

Das Relay existiert, um zwei Einschränkungen durchzusetzen, die direkte APNs auf dem Gateway für
offizielle iOS-Builds nicht bieten können:

- Nur echte OpenClaw-iOS-Builds, die über Apple verteilt werden, können das gehostete Relay verwenden.
- Ein Gateway kann relay-gestützte Push-Benachrichtigungen nur für iOS-Geräte senden, die mit genau diesem
  Gateway gekoppelt wurden.

Hop für Hop:

1. `iOS app -> gateway`
   - Die App koppelt sich zuerst über den normalen Gateway-Authentifizierungsablauf mit dem Gateway.
   - Dadurch erhält die App eine authentifizierte Node-Sitzung sowie eine authentifizierte Operator-Sitzung.
   - Die Operator-Sitzung wird verwendet, um `gateway.identity.get` aufzurufen.

2. `iOS app -> relay`
   - Die App ruft die Relay-Registrierungsendpunkte über HTTPS auf.
   - Die Registrierung enthält einen App-Attest-Nachweis plus ein StoreKit-App-Transaktions-JWS.
   - Das Relay validiert Bundle-ID, App-Attest-Nachweis und Apple-Distributionsnachweis und verlangt den
     offiziellen/Produktions-Distributionspfad.
   - Dies verhindert, dass lokale Xcode-/Dev-Builds das gehostete Relay verwenden. Ein lokaler Build kann
     signiert sein, erfüllt aber nicht den offiziellen Apple-Distributionsnachweis, den das Relay erwartet.

3. `gateway identity delegation`
   - Vor der Relay-Registrierung ruft die App die gekoppelte Gateway-Identität von
     `gateway.identity.get` ab.
   - Die App nimmt diese Gateway-Identität in die Relay-Registrierungsnutzlast auf.
   - Das Relay gibt ein Relay-Handle und eine registrierungsgebundene Sendeberechtigung zurück, die an
     diese Gateway-Identität delegiert sind.

4. `gateway -> relay`
   - Das Gateway speichert das Relay-Handle und die Sendeberechtigung aus `push.apns.register`.
   - Bei `push.test`, Reconnect-Weckvorgängen und Wake Nudges signiert das Gateway die Sendeanforderung mit seiner
     eigenen Geräteidentität.
   - Das Relay prüft sowohl die gespeicherte Sendeberechtigung als auch die Gateway-Signatur gegen die delegierte
     Gateway-Identität aus der Registrierung.
   - Ein anderes Gateway kann diese gespeicherte Registrierung nicht wiederverwenden, selbst wenn es irgendwie an das Handle gelangt.

5. `relay -> APNs`
   - Das Relay besitzt die Produktions-APNs-Anmeldedaten und das rohe APNs-Token für den offiziellen Build.
   - Das Gateway speichert das rohe APNs-Token für relay-gestützte offizielle Builds nie.
   - Das Relay sendet den finalen Push im Namen des gekoppelten Gateways an APNs.

Warum dieses Design erstellt wurde:

- Um Produktions-APNs-Anmeldedaten aus Benutzer-Gateways herauszuhalten.
- Um zu vermeiden, rohe APNs-Token offizieller Builds auf dem Gateway zu speichern.
- Um die Nutzung des gehosteten Relays nur für offizielle OpenClaw-iOS-Builds zu erlauben.
- Um zu verhindern, dass ein Gateway Wake-Push-Benachrichtigungen an iOS-Geräte sendet, die einem anderen Gateway gehören.

Lokale/manuelle Builds bleiben bei direktem APNs. Wenn Sie diese Builds ohne Relay testen, benötigt das
Gateway weiterhin direkte APNs-Anmeldedaten:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Dies sind Laufzeit-Env-Vars des Gateway-Hosts, keine Fastlane-Einstellungen. `apps/ios/fastlane/.env` speichert nur
App-Store-Connect-Authentifizierung wie `APP_STORE_CONNECT_KEY_ID` und
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

Die iOS-App durchsucht `_openclaw-gw._tcp` unter `local.` und, wenn konfiguriert, dieselbe
Wide-Area-DNS-SD-Discovery-Domain. Gateways im selben LAN erscheinen automatisch aus `local.`;
netzwerkübergreifende Discovery kann die konfigurierte Wide-Area-Domain verwenden, ohne den Beacon-Typ zu ändern.

### Tailnet (netzwerkübergreifend)

Wenn mDNS blockiert ist, verwenden Sie eine Unicast-DNS-SD-Zone (wählen Sie eine Domain; Beispiel:
`openclaw.internal.`) und Tailscale-Split-DNS.
Siehe [Bonjour](/de/gateway/bonjour) für das CoreDNS-Beispiel.

### Manueller Host/Port

Aktivieren Sie in den Einstellungen **Manueller Host** und geben Sie Gateway-Host + Port ein (Standard `18789`).

## Canvas + A2UI

Der iOS-Node rendert einen WKWebView-Canvas. Verwenden Sie `node.invoke`, um ihn zu steuern:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Hinweise:

- Der Gateway-Canvas-Host stellt `/__openclaw__/canvas/` und `/__openclaw__/a2ui/` bereit.
- Er wird vom Gateway-HTTP-Server bereitgestellt (derselbe Port wie `gateway.port`, Standard `18789`).
- Der iOS-Node behält das integrierte Gerüst als verbundene Standardansicht bei. `canvas.a2ui.push` und `canvas.a2ui.reset` verwenden die gebündelte app-eigene A2UI-Seite.
- Remote-Gateway-A2UI-Seiten sind auf iOS nur renderbar; native A2UI-Button-Aktionen werden nur von gebündelten app-eigenen Seiten akzeptiert.
- Kehren Sie mit `canvas.navigate` und `{"url":""}` zum integrierten Gerüst zurück.

## Beziehung zu Computer Use

Die iOS-App ist eine mobile Node-Oberfläche, kein Codex-Computer-Use-Backend. Codex
Computer Use und `cua-driver mcp` steuern einen lokalen macOS-Desktop über MCP-
Tools; die iOS-App stellt iPhone-Funktionen über OpenClaw-Node-Befehle
wie `canvas.*`, `camera.*`, `screen.*`, `location.*` und `talk.*` bereit.

Agenten können die iOS-App weiterhin über OpenClaw bedienen, indem sie Node-
Befehle aufrufen, aber diese Aufrufe laufen über das Gateway-Node-Protokoll und folgen den iOS-
Vordergrund-/Hintergrundgrenzen. Verwenden Sie [Codex Computer Use](/de/plugins/codex-computer-use)
für lokale Desktop-Steuerung und diese Seite für iOS-Node-Funktionen.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice Wake + Talk-Modus

- Voice Wake und Talk-Modus sind in den Einstellungen verfügbar.
- OpenAI-Realtime-Talk verwendet client-eigenes WebRTC, wenn `talk.realtime.transport` `webrtc` ist; eine explizite `gateway-relay`-Konfiguration bleibt Gateway-eigen. Siehe [Talk-Modus](/de/nodes/talk).
- Talk-fähige iOS-Nodes geben die `talk`-Funktion bekannt und können
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` und `talk.ptt.once` deklarieren;
  das Gateway erlaubt diese Push-to-Talk-Befehle standardmäßig für vertrauenswürdige
  Talk-fähige Nodes.
- iOS kann Hintergrundaudio anhalten; behandeln Sie Sprachfunktionen als Best-Effort, wenn die App nicht aktiv ist.

## Häufige Fehler

- `NODE_BACKGROUND_UNAVAILABLE`: Bringen Sie die iOS-App in den Vordergrund (Canvas-/Kamera-/Bildschirmbefehle erfordern dies).
- `A2UI_HOST_UNAVAILABLE`: Die gebündelte A2UI-Seite war im App-WebView nicht erreichbar; lassen Sie die App auf dem Bildschirm-Tab im Vordergrund und versuchen Sie es erneut.
- Kopplungsaufforderung erscheint nie: Führen Sie `openclaw devices list` aus und genehmigen Sie manuell.
- Reconnect schlägt nach Neuinstallation fehl: Das Keychain-Kopplungstoken wurde gelöscht; koppeln Sie den Node erneut.

## Verwandte Dokumentation

- [Kopplung](/de/channels/pairing)
- [Erkennung](/de/gateway/discovery)
- [Bonjour](/de/gateway/bonjour)
