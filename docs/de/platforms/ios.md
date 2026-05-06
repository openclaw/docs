---
read_when:
    - iOS-Node koppeln oder erneut verbinden
    - iOS-App aus dem Quellcode ausführen
    - Debuggen der Gateway-Erkennung oder von Canvas-Befehlen
summary: 'iOS-Node-App: Verbindung mit dem Gateway, Pairing, Canvas und Fehlerbehebung'
title: iOS-App
x-i18n:
    generated_at: "2026-05-06T06:55:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: aaa8c11d9fda32c743d2ff0d1c6fd5574bcd396aef43aa2e4e9b0cc7b55e5d21
    source_path: platforms/ios.md
    workflow: 16
---

Verfügbarkeit: interne Vorschau. Die iOS-App wird noch nicht öffentlich verteilt.

## Was sie tut

- Stellt über WebSocket eine Verbindung zu einem Gateway her (LAN oder Tailnet).
- Stellt Node-Fähigkeiten bereit: Canvas, Screen-Snapshot, Kameraaufnahme, Standort, Talk-Modus, Voice Wake.
- Empfängt `node.invoke`-Befehle und meldet Node-Statusereignisse.

## Anforderungen

- Gateway, das auf einem anderen Gerät ausgeführt wird (macOS, Linux oder Windows über WSL2).
- Netzwerkpfad:
  - Gleiches LAN über Bonjour, **oder**
  - Tailnet über Unicast-DNS-SD (Beispieldomäne: `openclaw.internal.`), **oder**
  - Manueller Host/Port (Fallback).

## Schnellstart (koppeln + verbinden)

1. Starten Sie das Gateway:

```bash
openclaw gateway --port 18789
```

2. Öffnen Sie in der iOS-App die Einstellungen und wählen Sie ein gefundenes Gateway aus (oder aktivieren Sie Manual Host und geben Sie Host/Port ein).

3. Genehmigen Sie die Kopplungsanfrage auf dem Gateway-Host:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Wenn die App die Kopplung mit geänderten Authentifizierungsdetails (Rolle/Scopes/öffentlicher Schlüssel)
erneut versucht, wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt.
Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Optional: Wenn der iOS-Node immer aus einem eng kontrollierten Subnetz verbindet, können Sie
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

Dies ist standardmäßig deaktiviert. Es gilt nur für neue `role: node`-Kopplungen ohne
angeforderte Scopes. Operator-/Browser-Kopplung sowie jede Änderung an Rolle, Scope, Metadaten oder
öffentlichem Schlüssel erfordern weiterhin eine manuelle Genehmigung.

4. Überprüfen Sie die Verbindung:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Relay-gestützter Push für offizielle Builds

Offiziell verteilte iOS-Builds verwenden das externe Push-Relay, anstatt das rohe APNs-Token
im Gateway zu veröffentlichen.

Gateway-seitige Anforderung:

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
- Das Relay gibt einen opaken Relay-Handle plus eine registrierungsgebundene Sendeberechtigung zurück.
- Die iOS-App ruft die gekoppelte Gateway-Identität ab und schließt sie in die Relay-Registrierung ein, sodass die Relay-gestützte Registrierung an dieses spezifische Gateway delegiert wird.
- Die App leitet diese Relay-gestützte Registrierung mit `push.apns.register` an das gekoppelte Gateway weiter.
- Das Gateway verwendet diesen gespeicherten Relay-Handle für `push.test`, Hintergrund-Wakes und Wake-Anstöße.
- Die Gateway-Relay-Basis-URL muss mit der Relay-URL übereinstimmen, die in den offiziellen/TestFlight-iOS-Build eingebettet ist.
- Wenn sich die App später mit einem anderen Gateway oder einem Build mit einer anderen Relay-Basis-URL verbindet, aktualisiert sie die Relay-Registrierung, anstatt die alte Bindung wiederzuverwenden.

Was das Gateway für diesen Pfad **nicht** benötigt:

- Kein bereitstellungsweites Relay-Token.
- Kein direkter APNs-Schlüssel für offizielle/TestFlight-Relay-gestützte Sends.

Erwarteter Operator-Ablauf:

1. Installieren Sie den offiziellen/TestFlight-iOS-Build.
2. Setzen Sie `gateway.push.apns.relay.baseUrl` auf dem Gateway.
3. Koppeln Sie die App mit dem Gateway und lassen Sie sie die Verbindung abschließen.
4. Die App veröffentlicht `push.apns.register` automatisch, nachdem sie ein APNs-Token hat, die Operator-Sitzung verbunden ist und die Relay-Registrierung erfolgreich war.
5. Danach können `push.test`, Reconnect-Wakes und Wake-Anstöße die gespeicherte Relay-gestützte Registrierung verwenden.

## Hintergrund-Alive-Beacons

Wenn iOS die App für einen stillen Push, eine Hintergrundaktualisierung oder ein Significant-Location-Ereignis aufweckt, versucht die App
eine kurze Node-Wiederverbindung und ruft dann `node.event` mit `event: "node.presence.alive"` auf.
Das Gateway zeichnet dies nur dann als `lastSeenAtMs`/`lastSeenReason` in den Metadaten des gekoppelten Nodes/Geräts auf,
nachdem die authentifizierte Node-Geräteidentität bekannt ist.

Die App behandelt einen Hintergrund-Wake nur dann als erfolgreich aufgezeichnet, wenn die Gateway-Antwort
`handled: true` enthält. Ältere Gateways bestätigen `node.event` möglicherweise mit `{ "ok": true }`; diese Antwort ist
kompatibel, zählt aber nicht als dauerhafte Last-Seen-Aktualisierung.

Kompatibilitätshinweis:

- `OPENCLAW_APNS_RELAY_BASE_URL` funktioniert weiterhin als temporärer Env-Override für das Gateway.

## Authentifizierungs- und Vertrauensablauf

Das Relay dient dazu, zwei Einschränkungen durchzusetzen, die direktes APNs-auf-dem-Gateway für
offizielle iOS-Builds nicht bieten kann:

- Nur echte OpenClaw-iOS-Builds, die über Apple verteilt werden, können das gehostete Relay verwenden.
- Ein Gateway kann Relay-gestützte Pushes nur für iOS-Geräte senden, die mit genau diesem
  Gateway gekoppelt wurden.

Hop für Hop:

1. `iOS app -> gateway`
   - Die App koppelt sich zuerst über den normalen Gateway-Authentifizierungsablauf mit dem Gateway.
   - Dadurch erhält die App eine authentifizierte Node-Sitzung plus eine authentifizierte Operator-Sitzung.
   - Die Operator-Sitzung wird verwendet, um `gateway.identity.get` aufzurufen.

2. `iOS app -> relay`
   - Die App ruft die Relay-Registrierungsendpunkte über HTTPS auf.
   - Die Registrierung enthält einen App-Attest-Nachweis plus eine StoreKit-App-Transaktions-JWS.
   - Das Relay validiert die Bundle-ID, den App-Attest-Nachweis und den Apple-Verteilungsnachweis und verlangt den
     offiziellen/Produktions-Verteilungspfad.
   - Dadurch werden lokale Xcode-/Dev-Builds von der Nutzung des gehosteten Relays ausgeschlossen. Ein lokaler Build kann
     signiert sein, erfüllt aber nicht den offiziellen Apple-Verteilungsnachweis, den das Relay erwartet.

3. `gateway identity delegation`
   - Vor der Relay-Registrierung ruft die App die gekoppelte Gateway-Identität über
     `gateway.identity.get` ab.
   - Die App schließt diese Gateway-Identität in die Relay-Registrierungsnutzlast ein.
   - Das Relay gibt einen Relay-Handle und eine registrierungsgebundene Sendeberechtigung zurück, die an
     diese Gateway-Identität delegiert sind.

4. `gateway -> relay`
   - Das Gateway speichert den Relay-Handle und die Sendeberechtigung aus `push.apns.register`.
   - Bei `push.test`, Reconnect-Wakes und Wake-Anstößen signiert das Gateway die Sendeanfrage mit seiner
     eigenen Geräteidentität.
   - Das Relay verifiziert sowohl die gespeicherte Sendeberechtigung als auch die Gateway-Signatur gegen die delegierte
     Gateway-Identität aus der Registrierung.
   - Ein anderes Gateway kann diese gespeicherte Registrierung nicht wiederverwenden, selbst wenn es den Handle irgendwie erhält.

5. `relay -> APNs`
   - Das Relay besitzt die Produktions-APNs-Anmeldedaten und das rohe APNs-Token für den offiziellen Build.
   - Das Gateway speichert für Relay-gestützte offizielle Builds niemals das rohe APNs-Token.
   - Das Relay sendet den finalen Push im Namen des gekoppelten Gateways an APNs.

Warum dieses Design erstellt wurde:

- Um Produktions-APNs-Anmeldedaten aus Benutzer-Gateways herauszuhalten.
- Um zu vermeiden, rohe APNs-Token offizieller Builds auf dem Gateway zu speichern.
- Um die Nutzung des gehosteten Relays nur für offizielle/TestFlight-OpenClaw-Builds zu erlauben.
- Um zu verhindern, dass ein Gateway Wake-Pushes an iOS-Geräte sendet, die einem anderen Gateway gehören.

Lokale/manuelle Builds bleiben bei direktem APNs. Wenn Sie diese Builds ohne das Relay testen, benötigt das
Gateway weiterhin direkte APNs-Anmeldedaten:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Dies sind Runtime-Env-Vars des Gateway-Hosts, keine Fastlane-Einstellungen. `apps/ios/fastlane/.env` speichert nur
App-Store-Connect-/TestFlight-Authentifizierung wie `ASC_KEY_ID` und `ASC_ISSUER_ID`; es konfiguriert
keine direkte APNs-Zustellung für lokale iOS-Builds.

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

Die iOS-App sucht nach `_openclaw-gw._tcp` auf `local.` und, wenn konfiguriert, in derselben
Wide-Area-DNS-SD-Discovery-Domäne. Gateways im selben LAN erscheinen automatisch aus `local.`;
netzwerkübergreifende Discovery kann die konfigurierte Wide-Area-Domäne verwenden, ohne den Beacon-Typ zu ändern.

### Tailnet (netzwerkübergreifend)

Wenn mDNS blockiert ist, verwenden Sie eine Unicast-DNS-SD-Zone (wählen Sie eine Domäne; Beispiel:
`openclaw.internal.`) und Tailscale-Split-DNS.
Siehe [Bonjour](/de/gateway/bonjour) für das CoreDNS-Beispiel.

### Manueller Host/Port

Aktivieren Sie in den Einstellungen **Manual Host** und geben Sie den Gateway-Host + Port ein (Standard `18789`).

## Canvas + A2UI

Der iOS-Node rendert ein WKWebView-Canvas. Verwenden Sie `node.invoke`, um es zu steuern:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Hinweise:

- Der Gateway-Canvas-Host stellt `/__openclaw__/canvas/` und `/__openclaw__/a2ui/` bereit.
- Er wird vom Gateway-HTTP-Server bereitgestellt (derselbe Port wie `gateway.port`, Standard `18789`).
- Der iOS-Node navigiert beim Verbinden automatisch zu A2UI, wenn eine Canvas-Host-URL angekündigt wird.
- Kehren Sie mit `canvas.navigate` und `{"url":""}` zum integrierten Scaffold zurück.

## Beziehung zu Computer Use

Die iOS-App ist eine mobile Node-Oberfläche, kein Codex-Computer-Use-Backend. Codex
Computer Use und `cua-driver mcp` steuern einen lokalen macOS-Desktop über MCP-
Tools; die iOS-App stellt iPhone-Fähigkeiten über OpenClaw-Node-Befehle
wie `canvas.*`, `camera.*`, `screen.*`, `location.*` und `talk.*` bereit.

Agenten können die iOS-App weiterhin über OpenClaw bedienen, indem sie Node-
Befehle ausführen, aber diese Aufrufe laufen über das Gateway-Node-Protokoll und folgen den iOS-
Vordergrund-/Hintergrundbeschränkungen. Verwenden Sie [Codex Computer Use](/de/plugins/codex-computer-use)
für lokale Desktopsteuerung und diese Seite für iOS-Node-Fähigkeiten.

### Canvas-Eval / Snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice Wake + Talk-Modus

- Voice Wake und Talk-Modus sind in den Einstellungen verfügbar.
- Talk-fähige iOS-Nodes kündigen die `talk`-Fähigkeit an und können
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` und `talk.ptt.once` deklarieren;
  das Gateway erlaubt diese Push-to-Talk-Befehle standardmäßig für vertrauenswürdige
  Talk-fähige Nodes.
- iOS kann Hintergrundaudio aussetzen; behandeln Sie Voice-Funktionen als Best-Effort, wenn die App nicht aktiv ist.

## Häufige Fehler

- `NODE_BACKGROUND_UNAVAILABLE`: Bringen Sie die iOS-App in den Vordergrund (Canvas-/Kamera-/Screen-Befehle erfordern dies).
- `A2UI_HOST_NOT_CONFIGURED`: Das Gateway hat keine Canvas-Host-URL angekündigt; prüfen Sie `canvasHost` in der [Gateway-Konfiguration](/de/gateway/configuration).
- Kopplungsaufforderung erscheint nie: Führen Sie `openclaw devices list` aus und genehmigen Sie manuell.
- Reconnect schlägt nach Neuinstallation fehl: Das Keychain-Kopplungstoken wurde gelöscht; koppeln Sie den Node erneut.

## Zugehörige Dokumentation

- [Kopplung](/de/channels/pairing)
- [Discovery](/de/gateway/discovery)
- [Bonjour](/de/gateway/bonjour)
