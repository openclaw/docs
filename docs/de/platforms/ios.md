---
read_when:
    - Koppeln oder erneutes Verbinden des iOS-Nodes
    - OpenClaw veröffentlichen
    - Gateway-Erkennung oder Canvas-Befehle debuggen
summary: 'iOS-Node-App: Verbindung mit dem Gateway, Kopplung, Canvas und Fehlerbehebung'
title: iOS-App
x-i18n:
    generated_at: "2026-07-02T08:11:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f58f5a3a4c6f918ddca493367554c2df5a34292deeb112296103dce2203743
    source_path: platforms/ios.md
    workflow: 16
---

Verfügbarkeit: iPhone-App-Builds werden über Apple-Kanäle verteilt, wenn sie für ein Release aktiviert sind. Lokale Entwicklungs-Builds können auch aus dem Quellcode ausgeführt werden.

## Was es tut

- Verbindet sich über WebSocket mit einem Gateway (LAN oder Tailnet).
- Stellt Node-Funktionen bereit: Canvas, Bildschirm-Snapshot, Kameraaufnahme, Standort, Sprechmodus, Sprachaktivierung.
- Empfängt `node.invoke`-Befehle und meldet Node-Statusereignisse.

## Anforderungen

- Gateway, das auf einem anderen Gerät läuft (macOS, Linux oder Windows über WSL2).
- Netzwerkpfad:
  - Dasselbe LAN über Bonjour, **oder**
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
die automatische Genehmigung von Nodes bei der ersten Verbindung mit expliziten CIDRs oder exakten IPs aktivieren:

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

Dies ist standardmäßig deaktiviert. Es gilt nur für neue Kopplungen mit `role: node`
ohne angeforderte Scopes. Operator-/Browser-Kopplung sowie jede Änderung an Rolle, Scope, Metadaten oder
öffentlichem Schlüssel erfordern weiterhin eine manuelle Genehmigung.

4. Prüfen Sie die Verbindung:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Relay-gestützter Push für offizielle Builds

Offiziell verteilte iOS-Builds verwenden das externe Push-Relay, anstatt das rohe APNs-
Token an das Gateway zu veröffentlichen.

Offizielle App-Store-Builds aus dem öffentlichen Release-Kanal verwenden das gehostete Relay unter `https://ios-push-relay.openclaw.ai`.

Benutzerdefinierte Relay-Bereitstellungen erfordern einen bewusst separaten iOS-Build-/Bereitstellungspfad, dessen Relay-URL mit der Gateway-Relay-URL übereinstimmt. Der öffentliche App-Store-Release-Kanal akzeptiert keine Überschreibungen für benutzerdefinierte Relay-URLs. Wenn Sie einen benutzerdefinierten Relay-Build verwenden, legen Sie die passende Gateway-Relay-URL fest:

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
- Das Relay gibt ein opakes Relay-Handle plus eine registrierungsbezogene Sendeberechtigung zurück.
- Die iOS-App ruft die Identität des gekoppelten Gateways ab und bindet sie in die Relay-Registrierung ein, sodass die Relay-gestützte Registrierung an dieses spezifische Gateway delegiert wird.
- Die App leitet diese Relay-gestützte Registrierung mit `push.apns.register` an das gekoppelte Gateway weiter.
- Das Gateway verwendet dieses gespeicherte Relay-Handle für `push.test`, Hintergrund-Wakes und Wake-Anstöße.
- Benutzerdefinierte Gateway-Relay-URLs müssen mit der in den iOS-Build eingebetteten Relay-URL übereinstimmen.
- Wenn sich die App später mit einem anderen Gateway oder einem Build mit einer anderen Relay-Basis-URL verbindet, aktualisiert sie die Relay-Registrierung, anstatt die alte Bindung wiederzuverwenden.

Was das Gateway für diesen Pfad **nicht** benötigt:

- Kein bereitstellungsweites Relay-Token.
- Kein direkter APNs-Schlüssel für Relay-gestützte Sends offizieller App-Store-Builds.

Erwarteter Operator-Ablauf:

1. Installieren Sie die offizielle iOS-App.
2. Optional: Legen Sie `gateway.push.apns.relay.baseUrl` auf dem Gateway nur fest, wenn Sie einen bewusst separaten benutzerdefinierten Relay-Build verwenden.
3. Koppeln Sie die App mit dem Gateway und lassen Sie die Verbindung vollständig herstellen.
4. Die App veröffentlicht `push.apns.register` automatisch, nachdem sie ein APNs-Token hat, die Operator-Sitzung verbunden ist und die Relay-Registrierung erfolgreich war.
5. Danach können `push.test`, Reconnect-Wakes und Wake-Anstöße die gespeicherte Relay-gestützte Registrierung verwenden.

## Alive-Beacons im Hintergrund

Wenn iOS die App für einen stillen Push, eine Hintergrundaktualisierung oder ein Significant-Location-Ereignis weckt, versucht die App
einen kurzen Node-Reconnect und ruft dann `node.event` mit `event: "node.presence.alive"` auf.
Das Gateway speichert dies nur als `lastSeenAtMs`/`lastSeenReason` in den Metadaten des gekoppelten Nodes/Geräts,
nachdem die authentifizierte Identität des Node-Geräts bekannt ist.

Die App behandelt einen Hintergrund-Wake nur dann als erfolgreich gespeichert, wenn die Gateway-Antwort
`handled: true` enthält. Ältere Gateways können `node.event` mit `{ "ok": true }` bestätigen; diese Antwort ist
kompatibel, zählt aber nicht als dauerhafte Last-Seen-Aktualisierung.

Kompatibilitätshinweis:

- `OPENCLAW_APNS_RELAY_BASE_URL` funktioniert weiterhin als temporäre Env-Überschreibung für das Gateway.
- Der öffentliche App-Store-Release-Kanal weist `OPENCLAW_PUSH_RELAY_BASE_URL` für iOS-Builds zurück.

## Authentifizierungs- und Vertrauensablauf

Das Relay existiert, um zwei Einschränkungen durchzusetzen, die direktes APNs-auf-Gateway für
offizielle iOS-Builds nicht bereitstellen kann:

- Nur echte OpenClaw-iOS-Builds, die über Apple verteilt werden, können das gehostete Relay verwenden.
- Ein Gateway kann Relay-gestützte Pushes nur für iOS-Geräte senden, die mit diesem spezifischen
  Gateway gekoppelt wurden.

Schritt für Schritt:

1. `iOS app -> gateway`
   - Die App koppelt sich zuerst über den normalen Gateway-Authentifizierungsablauf mit dem Gateway.
   - Dadurch erhält die App eine authentifizierte Node-Sitzung plus eine authentifizierte Operator-Sitzung.
   - Die Operator-Sitzung wird verwendet, um `gateway.identity.get` aufzurufen.

2. `iOS app -> relay`
   - Die App ruft die Relay-Registrierungsendpunkte über HTTPS auf.
   - Die Registrierung enthält einen App-Attest-Nachweis plus ein StoreKit-App-Transaktions-JWS.
   - Das Relay validiert die Bundle-ID, den App-Attest-Nachweis und den Apple-Verteilungsnachweis und verlangt den
     offiziellen/Produktions-Verteilungspfad.
   - Das blockiert lokale Xcode-/Dev-Builds daran, das gehostete Relay zu verwenden. Ein lokaler Build kann
     signiert sein, erfüllt aber nicht den offiziellen Apple-Verteilungsnachweis, den das Relay erwartet.

3. `gateway identity delegation`
   - Vor der Relay-Registrierung ruft die App die Identität des gekoppelten Gateways über
     `gateway.identity.get` ab.
   - Die App nimmt diese Gateway-Identität in die Relay-Registrierungsnutzlast auf.
   - Das Relay gibt ein Relay-Handle und eine registrierungsbezogene Sendeberechtigung zurück, die an
     diese Gateway-Identität delegiert sind.

4. `gateway -> relay`
   - Das Gateway speichert das Relay-Handle und die Sendeberechtigung aus `push.apns.register`.
   - Bei `push.test`, Reconnect-Wakes und Wake-Anstößen signiert das Gateway die Sendeanforderung mit seiner
     eigenen Geräteidentität.
   - Das Relay prüft sowohl die gespeicherte Sendeberechtigung als auch die Gateway-Signatur gegen die delegierte
     Gateway-Identität aus der Registrierung.
   - Ein anderes Gateway kann diese gespeicherte Registrierung nicht wiederverwenden, selbst wenn es irgendwie das Handle erhält.

5. `relay -> APNs`
   - Das Relay besitzt die produktiven APNs-Anmeldedaten und das rohe APNs-Token für den offiziellen Build.
   - Das Gateway speichert das rohe APNs-Token für Relay-gestützte offizielle Builds nie.
   - Das Relay sendet den finalen Push im Auftrag des gekoppelten Gateways an APNs.

Warum dieses Design erstellt wurde:

- Um produktive APNs-Anmeldedaten aus Benutzer-Gateways herauszuhalten.
- Um das Speichern roher APNs-Tokens offizieller Builds auf dem Gateway zu vermeiden.
- Um die Nutzung des gehosteten Relays nur für offizielle OpenClaw-iOS-Builds zu erlauben.
- Um zu verhindern, dass ein Gateway Wake-Pushes an iOS-Geräte sendet, die zu einem anderen Gateway gehören.

Lokale/manuelle Builds bleiben bei direktem APNs. Wenn Sie diese Builds ohne Relay testen, benötigt das
Gateway weiterhin direkte APNs-Anmeldedaten:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Dies sind Runtime-Env-Vars des Gateway-Hosts, keine Fastlane-Einstellungen. `apps/ios/fastlane/.env` speichert nur
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
- Er wird vom Gateway-HTTP-Server bereitgestellt (derselbe Port wie `gateway.port`, Standard `18789`).
- Der iOS-Node behält das integrierte Gerüst als verbundene Standardansicht bei. `canvas.a2ui.push` und `canvas.a2ui.reset` verwenden die gebündelte app-eigene A2UI-Seite.
- Remote-Gateway-A2UI-Seiten sind unter iOS nur zum Rendern; native A2UI-Button-Aktionen werden nur von gebündelten app-eigenen Seiten akzeptiert.
- Kehren Sie mit `canvas.navigate` und `{"url":""}` zum integrierten Gerüst zurück.

## Beziehung zu Computer Use

Die iOS-App ist eine mobile Node-Oberfläche, kein Codex-Computer-Use-Backend. Codex
Computer Use und `cua-driver mcp` steuern einen lokalen macOS-Desktop über MCP-
Tools; die iOS-App stellt iPhone-Funktionen über OpenClaw-Node-Befehle
wie `canvas.*`, `camera.*`, `screen.*`, `location.*` und `talk.*` bereit.

Agenten können die iOS-App weiterhin über OpenClaw bedienen, indem sie Node-
Befehle aufrufen, aber diese Aufrufe laufen über das Gateway-Node-Protokoll und folgen den
Vordergrund-/Hintergrundgrenzen von iOS. Verwenden Sie [Codex Computer Use](/de/plugins/codex-computer-use)
für lokale Desktop-Steuerung und diese Seite für iOS-Node-Funktionen.

### Canvas eval / Snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Sprachaktivierung + Sprechmodus

- Sprachaktivierung und Sprechmodus sind in den Einstellungen verfügbar.
- Talk-fähige iOS-Nodes kündigen die `talk`-Capability an und können
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` und `talk.ptt.once` deklarieren;
  das Gateway erlaubt diese Push-to-Talk-Befehle standardmäßig für vertrauenswürdige
  Talk-fähige Nodes.
- iOS kann Hintergrundaudio aussetzen; behandeln Sie Sprachfunktionen als Best-Effort, wenn die App nicht aktiv ist.

## Häufige Fehler

- `NODE_BACKGROUND_UNAVAILABLE`: Bringen Sie die iOS-App in den Vordergrund (Canvas-/Kamera-/Bildschirmbefehle erfordern dies).
- `A2UI_HOST_UNAVAILABLE`: Die gebündelte A2UI-Seite war in der App-WebView nicht erreichbar; lassen Sie die App im Vordergrund auf dem Bildschirm-Tab und versuchen Sie es erneut.
- Kopplungsaufforderung erscheint nie: Führen Sie `openclaw devices list` aus und genehmigen Sie manuell.
- Reconnect schlägt nach Neuinstallation fehl: Das Keychain-Kopplungstoken wurde gelöscht; koppeln Sie den Node erneut.

## Verwandte Dokumentation

- [Kopplung](/de/channels/pairing)
- [Discovery](/de/gateway/discovery)
- [Bonjour](/de/gateway/bonjour)
