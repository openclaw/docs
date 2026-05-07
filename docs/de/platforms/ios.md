---
read_when:
    - iOS-Node koppeln oder erneut verbinden
    - iOS-App aus dem Quellcode ausführen
    - Debugging der Gateway-Erkennung oder von Canvas-Befehlen
summary: 'iOS-Node-App: Verbindung zum Gateway, Pairing, Canvas und Fehlerbehebung'
title: iOS-App
x-i18n:
    generated_at: "2026-05-07T13:21:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 707f8b97156e800f89bc00265c1889c9cbade347fde35f037a302065956346f4
    source_path: platforms/ios.md
    workflow: 16
---

Verfügbarkeit: interne Vorschau. Die iOS-App wird noch nicht öffentlich verteilt.

## Was sie leistet

- Stellt über WebSocket eine Verbindung zu einem Gateway her (LAN oder Tailnet).
- Stellt Node-Fähigkeiten bereit: Canvas, Bildschirm-Snapshot, Kameraaufnahme, Standort, Sprechmodus, Voice Wake.
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

Wenn die App die Kopplung mit geänderten Authentifizierungsdetails (Rolle/Scopes/öffentlicher Schlüssel)
erneut versucht, wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt.
Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Optional: Wenn sich der iOS-Node immer aus einem streng kontrollierten Subnetz verbindet, können Sie
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
angeforderte Scopes. Operator-/Browser-Kopplungen sowie Änderungen an Rolle, Scope, Metadaten oder
öffentlichem Schlüssel erfordern weiterhin eine manuelle Genehmigung.

4. Prüfen Sie die Verbindung:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Relay-gestützte Push-Benachrichtigungen für offizielle Builds

Offiziell verteilte iOS-Builds verwenden das externe Push-Relay, statt das rohe APNs-Token
beim Gateway zu veröffentlichen.

Anforderung auf Gateway-Seite:

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

- Die iOS-App registriert sich beim Relay mit App Attest und einem StoreKit-App-Transaction-JWS.
- Das Relay gibt ein undurchsichtiges Relay-Handle plus eine registrierungsbezogene Sendeberechtigung zurück.
- Die iOS-App ruft die Identität des gekoppelten Gateways ab und nimmt sie in die Relay-Registrierung auf, sodass die relay-gestützte Registrierung an dieses konkrete Gateway delegiert wird.
- Die App leitet diese relay-gestützte Registrierung mit `push.apns.register` an das gekoppelte Gateway weiter.
- Das Gateway verwendet dieses gespeicherte Relay-Handle für `push.test`, Hintergrund-Wakes und Wake-Anstöße.
- Die Relay-Basis-URL des Gateways muss mit der Relay-URL übereinstimmen, die in den offiziellen/TestFlight-iOS-Build eingebettet ist.
- Wenn sich die App später mit einem anderen Gateway oder einem Build mit einer anderen Relay-Basis-URL verbindet, aktualisiert sie die Relay-Registrierung, statt die alte Bindung wiederzuverwenden.

Was das Gateway für diesen Pfad **nicht** benötigt:

- Kein deploymentweites Relay-Token.
- Kein direkter APNs-Schlüssel für offizielle/TestFlight-relay-gestützte Sendungen.

Erwarteter Operator-Ablauf:

1. Installieren Sie den offiziellen/TestFlight-iOS-Build.
2. Setzen Sie `gateway.push.apns.relay.baseUrl` auf dem Gateway.
3. Koppeln Sie die App mit dem Gateway und warten Sie, bis die Verbindung abgeschlossen ist.
4. Die App veröffentlicht `push.apns.register` automatisch, nachdem sie ein APNs-Token hat, die Operator-Sitzung verbunden ist und die Relay-Registrierung erfolgreich war.
5. Danach können `push.test`, Wiederverbindungs-Wakes und Wake-Anstöße die gespeicherte relay-gestützte Registrierung verwenden.

## Alive-Beacons im Hintergrund

Wenn iOS die App wegen eines Silent Push, einer Hintergrundaktualisierung oder eines bedeutenden Standortereignisses weckt, versucht die App
eine kurze Node-Wiederverbindung und ruft dann `node.event` mit `event: "node.presence.alive"` auf.
Das Gateway zeichnet dies nur dann als `lastSeenAtMs`/`lastSeenReason` in den Metadaten des gekoppelten Nodes/Geräts auf,
nachdem die authentifizierte Node-Geräteidentität bekannt ist.

Die App behandelt ein Hintergrund-Wake nur dann als erfolgreich aufgezeichnet, wenn die Gateway-Antwort
`handled: true` enthält. Ältere Gateways können `node.event` mit `{ "ok": true }` bestätigen; diese Antwort ist
kompatibel, zählt aber nicht als dauerhafte Last-Seen-Aktualisierung.

Kompatibilitätshinweis:

- `OPENCLAW_APNS_RELAY_BASE_URL` funktioniert weiterhin als temporärer Env-Override für das Gateway.

## Authentifizierungs- und Vertrauensablauf

Das Relay existiert, um zwei Einschränkungen durchzusetzen, die direktes APNs auf dem Gateway für
offizielle iOS-Builds nicht bereitstellen kann:

- Nur echte OpenClaw-iOS-Builds, die über Apple verteilt werden, können das gehostete Relay verwenden.
- Ein Gateway kann relay-gestützte Push-Benachrichtigungen nur für iOS-Geräte senden, die mit diesem konkreten
  Gateway gekoppelt wurden.

Schritt für Schritt:

1. `iOS app -> gateway`
   - Die App koppelt sich zuerst über den normalen Gateway-Authentifizierungsablauf mit dem Gateway.
   - Dadurch erhält die App eine authentifizierte Node-Sitzung plus eine authentifizierte Operator-Sitzung.
   - Die Operator-Sitzung wird verwendet, um `gateway.identity.get` aufzurufen.

2. `iOS app -> relay`
   - Die App ruft die Relay-Registrierungsendpunkte über HTTPS auf.
   - Die Registrierung enthält einen App-Attest-Nachweis plus ein StoreKit-App-Transaction-JWS.
   - Das Relay validiert die Bundle-ID, den App-Attest-Nachweis und den Apple-Verteilungsnachweis und verlangt den
     offiziellen/produktiven Verteilungspfad.
   - Dadurch werden lokale Xcode-/Dev-Builds daran gehindert, das gehostete Relay zu verwenden. Ein lokaler Build kann
     signiert sein, erfüllt aber nicht den offiziellen Apple-Verteilungsnachweis, den das Relay erwartet.

3. `gateway identity delegation`
   - Vor der Relay-Registrierung ruft die App die Identität des gekoppelten Gateways von
     `gateway.identity.get` ab.
   - Die App nimmt diese Gateway-Identität in die Relay-Registrierungs-Payload auf.
   - Das Relay gibt ein Relay-Handle und eine registrierungsbezogene Sendeberechtigung zurück, die an
     diese Gateway-Identität delegiert sind.

4. `gateway -> relay`
   - Das Gateway speichert das Relay-Handle und die Sendeberechtigung aus `push.apns.register`.
   - Bei `push.test`, Wiederverbindungs-Wakes und Wake-Anstößen signiert das Gateway die Sendeanfrage mit seiner
     eigenen Geräteidentität.
   - Das Relay prüft sowohl die gespeicherte Sendeberechtigung als auch die Gateway-Signatur gegen die delegierte
     Gateway-Identität aus der Registrierung.
   - Ein anderes Gateway kann diese gespeicherte Registrierung nicht wiederverwenden, selbst wenn es irgendwie an das Handle gelangt.

5. `relay -> APNs`
   - Das Relay besitzt die Produktions-APNs-Anmeldedaten und das rohe APNs-Token für den offiziellen Build.
   - Das Gateway speichert das rohe APNs-Token für relay-gestützte offizielle Builds niemals.
   - Das Relay sendet die finale Push-Benachrichtigung im Auftrag des gekoppelten Gateways an APNs.

Warum dieses Design erstellt wurde:

- Um Produktions-APNs-Anmeldedaten aus Benutzer-Gateways herauszuhalten.
- Um zu vermeiden, rohe APNs-Token offizieller Builds auf dem Gateway zu speichern.
- Um die Nutzung des gehosteten Relays nur für offizielle/TestFlight-OpenClaw-Builds zu erlauben.
- Um zu verhindern, dass ein Gateway Wake-Push-Benachrichtigungen an iOS-Geräte sendet, die zu einem anderen Gateway gehören.

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

Die iOS-App durchsucht `_openclaw-gw._tcp` auf `local.` und, wenn konfiguriert, dieselbe
Wide-Area-DNS-SD-Discovery-Domain. Gateways im selben LAN erscheinen automatisch von `local.`;
netzwerkübergreifende Discovery kann die konfigurierte Wide-Area-Domain verwenden, ohne den Beacon-Typ zu ändern.

### Tailnet (netzwerkübergreifend)

Wenn mDNS blockiert ist, verwenden Sie eine Unicast-DNS-SD-Zone (wählen Sie eine Domain; Beispiel:
`openclaw.internal.`) und Tailscale Split-DNS.
Siehe [Bonjour](/de/gateway/bonjour) für das CoreDNS-Beispiel.

### Manueller Host/Port

Aktivieren Sie in den Einstellungen **Manueller Host** und geben Sie den Gateway-Host plus Port ein (Standard `18789`).

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

## Verhältnis zu Computer Use

Die iOS-App ist eine mobile Node-Oberfläche, kein Codex-Computer-Use-Backend. Codex
Computer Use und `cua-driver mcp` steuern einen lokalen macOS-Desktop über MCP-
Tools; die iOS-App stellt iPhone-Fähigkeiten über OpenClaw-Node-Befehle
wie `canvas.*`, `camera.*`, `screen.*`, `location.*` und `talk.*` bereit.

Agents können die iOS-App weiterhin über OpenClaw bedienen, indem sie Node-
Befehle aufrufen, aber diese Aufrufe laufen über das Gateway-Node-Protokoll und folgen den iOS-
Vordergrund-/Hintergrundgrenzen. Verwenden Sie [Codex Computer Use](/de/plugins/codex-computer-use)
für lokale Desktop-Steuerung und diese Seite für iOS-Node-Fähigkeiten.

### Canvas-Evaluierung / Snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice Wake + Sprechmodus

- Voice Wake und Sprechmodus sind in den Einstellungen verfügbar.
- Sprechfähige iOS-Nodes kündigen die `talk`-Fähigkeit an und können
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` und `talk.ptt.once` deklarieren;
  das Gateway erlaubt diese Push-to-Talk-Befehle standardmäßig für vertrauenswürdige
  sprechfähige Nodes.
- iOS kann Hintergrundaudio aussetzen; behandeln Sie Sprachfunktionen als Best-Effort, wenn die App nicht aktiv ist.

## Häufige Fehler

- `NODE_BACKGROUND_UNAVAILABLE`: Bringen Sie die iOS-App in den Vordergrund (Canvas-/Kamera-/Bildschirmbefehle erfordern dies).
- `A2UI_HOST_NOT_CONFIGURED`: Das Gateway hat die Oberflächen-URL des Canvas-Plugins nicht angekündigt; prüfen Sie `plugins.entries.canvas.config.host` in der [Gateway-Konfiguration](/de/gateway/configuration).
- Kopplungsaufforderung erscheint nie: Führen Sie `openclaw devices list` aus und genehmigen Sie manuell.
- Wiederverbindung schlägt nach Neuinstallation fehl: Das Keychain-Kopplungstoken wurde gelöscht; koppeln Sie den Node erneut.

## Verwandte Dokumentation

- [Kopplung](/de/channels/pairing)
- [Discovery](/de/gateway/discovery)
- [Bonjour](/de/gateway/bonjour)
