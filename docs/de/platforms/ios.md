---
read_when:
    - iOS-Node pairen oder erneut verbinden
    - Die iOS-App aus dem Quellcode ausführen
    - Gateway-Erkennung oder Canvas-Befehle debuggen
summary: 'iOS-Node-App: Verbindung zum Gateway, Pairing, Canvas und Fehlerbehebung'
title: iOS-App
x-i18n:
    generated_at: "2026-04-25T13:50:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad0088cd135168248cfad10c24715f74117a66efaa52a572579c04f96a806538
    source_path: platforms/ios.md
    workflow: 15
---

Verfügbarkeit: interne Vorschau. Die iOS-App wird noch nicht öffentlich verteilt.

## Was sie macht

- Verbindet sich über WebSocket mit einem Gateway (LAN oder Tailnet).
- Stellt Node-Capabilities bereit: Canvas, Screen-Snapshot, Kameraaufnahme, Standort, Talk-Modus, Voice wake.
- Empfängt `node.invoke`-Befehle und meldet Node-Statusereignisse.

## Anforderungen

- Gateway läuft auf einem anderen Gerät (macOS, Linux oder Windows über WSL2).
- Netzwerkpfad:
  - Gleiches LAN über Bonjour, **oder**
  - Tailnet über Unicast-DNS-SD (Beispieldomain: `openclaw.internal.`), **oder**
  - Manueller Host/Port (Fallback).

## Schnellstart (pairen + verbinden)

1. Gateway starten:

```bash
openclaw gateway --port 18789
```

2. Öffnen Sie in der iOS-App die Einstellungen und wählen Sie ein erkanntes Gateway aus (oder aktivieren Sie Manual Host und geben Sie Host/Port ein).

3. Genehmigen Sie die Pairing-Anfrage auf dem Gateway-Host:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Wenn die App das Pairing mit geänderten Auth-Details (Rolle/Scopes/öffentlicher Schlüssel) erneut versucht,
wird die vorherige ausstehende Anfrage ersetzt und eine neue `requestId` erstellt.
Führen Sie vor der Genehmigung erneut `openclaw devices list` aus.

Optional: Wenn sich der iOS-Node immer aus einem eng kontrollierten Subnetz verbindet, können Sie
die automatische Erstgenehmigung für Nodes mit expliziten CIDRs oder exakten IPs aktivieren:

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

Dies ist standardmäßig deaktiviert. Es gilt nur für frisches `role: node`-Pairing ohne
angeforderte Scopes. Pairing für Operator/Browser und jede Änderung an Rolle, Scope, Metadaten oder
öffentlichem Schlüssel erfordern weiterhin eine manuelle Genehmigung.

4. Verbindung prüfen:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Relay-gestützter Push für offizielle Builds

Offizielle verteilte iOS-Builds verwenden das externe Push-Relay, statt das rohe APNs-
Token an das Gateway zu veröffentlichen.

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

- Die iOS-App registriert sich beim Relay mit App Attest und dem App-Receipt.
- Das Relay gibt einen undurchsichtigen Relay-Handle plus eine registrierungsbezogene Sendeberechtigung zurück.
- Die iOS-App ruft die Identität des gekoppelten Gateway ab und schließt sie in die Relay-Registrierung ein, sodass die Relay-gestützte Registrierung an genau dieses Gateway delegiert wird.
- Die App leitet diese Relay-gestützte Registrierung mit `push.apns.register` an das gekoppelte Gateway weiter.
- Das Gateway verwendet den gespeicherten Relay-Handle für `push.test`, Background-Wakes und Wake-Nudges.
- Die Basis-URL des Gateway-Relays muss mit der Relay-URL übereinstimmen, die in den offiziellen/TestFlight-iOS-Build eingebettet ist.
- Wenn sich die App später mit einem anderen Gateway oder einem Build mit einer anderen Relay-Basis-URL verbindet, aktualisiert sie die Relay-Registrierung, statt die alte Bindung wiederzuverwenden.

Was das Gateway für diesen Pfad **nicht** benötigt:

- Kein deploymentsweites Relay-Token.
- Kein direkter APNs-Schlüssel für offizielle/TestFlight-Relay-gestützte Sendungen.

Erwarteter Ablauf für Operatoren:

1. Installieren Sie den offiziellen/TestFlight-iOS-Build.
2. Setzen Sie `gateway.push.apns.relay.baseUrl` auf dem Gateway.
3. Pairen Sie die App mit dem Gateway und lassen Sie sie die Verbindung vollständig aufbauen.
4. Die App veröffentlicht `push.apns.register` automatisch, nachdem sie ein APNs-Token hat, die Operator-Session verbunden ist und die Relay-Registrierung erfolgreich war.
5. Danach können `push.test`, Reconnect-Wakes und Wake-Nudges die gespeicherte Relay-gestützte Registrierung verwenden.

Kompatibilitätshinweis:

- `OPENCLAW_APNS_RELAY_BASE_URL` funktioniert weiterhin als temporäre env-Überschreibung für das Gateway.

## Authentifizierungs- und Vertrauensablauf

Das Relay existiert, um zwei Einschränkungen durchzusetzen, die direktes APNs-am-Gateway für
offizielle iOS-Builds nicht bieten kann:

- Nur echte OpenClaw-iOS-Builds, die über Apple verteilt wurden, können das gehostete Relay verwenden.
- Ein Gateway kann Relay-gestützte Pushes nur für iOS-Geräte senden, die mit genau diesem
  Gateway gepairt wurden.

Hop für Hop:

1. `iOS app -> gateway`
   - Die App pairt sich zuerst über den normalen Gateway-Auth-Ablauf mit dem Gateway.
   - Dadurch erhält die App eine authentifizierte Node-Session plus eine authentifizierte Operator-Session.
   - Die Operator-Session wird verwendet, um `gateway.identity.get` aufzurufen.

2. `iOS app -> relay`
   - Die App ruft die Registrierungsendpunkte des Relay über HTTPS auf.
   - Die Registrierung enthält App-Attest-Nachweis plus das App-Receipt.
   - Das Relay validiert die Bundle-ID, den App-Attest-Nachweis und das Apple-Receipt und erfordert den
     offiziellen/produktiven Verteilungspfad.
   - Dadurch wird verhindert, dass lokale Xcode-/Dev-Builds das gehostete Relay verwenden. Ein lokaler Build kann
     signiert sein, erfüllt aber nicht den Nachweis der offiziellen Apple-Verteilung, den das Relay erwartet.

3. `gateway identity delegation`
   - Vor der Relay-Registrierung ruft die App die Identität des gekoppelten Gateway über
     `gateway.identity.get` ab.
   - Die App schließt diese Gateway-Identität in die Payload der Relay-Registrierung ein.
   - Das Relay gibt einen Relay-Handle und eine registrierungsbezogene Sendeberechtigung zurück, die an
     diese Gateway-Identität delegiert sind.

4. `gateway -> relay`
   - Das Gateway speichert den Relay-Handle und die Sendeberechtigung aus `push.apns.register`.
   - Bei `push.test`, Reconnect-Wakes und Wake-Nudges signiert das Gateway die Sendungsanfrage mit seiner
     eigenen Geräteidentität.
   - Das Relay prüft sowohl die gespeicherte Sendeberechtigung als auch die Gateway-Signatur gegen die delegierte
     Gateway-Identität aus der Registrierung.
   - Ein anderes Gateway kann diese gespeicherte Registrierung nicht wiederverwenden, selbst wenn es irgendwie den Handle erhält.

5. `relay -> APNs`
   - Das Relay besitzt die produktiven APNs-Anmeldedaten und das rohe APNs-Token für den offiziellen Build.
   - Das Gateway speichert für Relay-gestützte offizielle Builds niemals das rohe APNs-Token.
   - Das Relay sendet den finalen Push im Namen des gekoppelten Gateway an APNs.

Warum dieses Design geschaffen wurde:

- Um produktive APNs-Anmeldedaten von Benutzer-Gateways fernzuhalten.
- Um zu vermeiden, dass rohe APNs-Tokens offizieller Builds auf dem Gateway gespeichert werden.
- Um die Nutzung des gehosteten Relay nur für offizielle/TestFlight-OpenClaw-Builds zu erlauben.
- Um zu verhindern, dass ein Gateway Wake-Pushes an iOS-Geräte sendet, die einem anderen Gateway gehören.

Lokale/manuelle Builds bleiben bei direktem APNs. Wenn Sie diese Builds ohne das Relay testen, benötigt das
Gateway weiterhin direkte APNs-Anmeldedaten:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Dies sind Runtime-env-Variablen des Gateway-Hosts, keine Fastlane-Einstellungen. `apps/ios/fastlane/.env` speichert nur
App Store Connect / TestFlight-Authentifizierung wie `ASC_KEY_ID` und `ASC_ISSUER_ID`; es konfiguriert nicht die
direkte APNs-Zustellung für lokale iOS-Builds.

Empfohlene Speicherung auf dem Gateway-Host:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Committen Sie die Datei `.p8` nicht und legen Sie sie nicht unter dem Repo-Checkout ab.

## Erkennungspfade

### Bonjour (LAN)

Die iOS-App durchsucht `_openclaw-gw._tcp` auf `local.` und, falls konfiguriert, dieselbe
Wide-Area-DNS-SD-Discovery-Domain. Gateways im selben LAN erscheinen automatisch über `local.`;
netzwerkübergreifende Erkennung kann die konfigurierte Wide-Area-Domain verwenden, ohne den Beacon-Typ zu ändern.

### Tailnet (netzwerkübergreifend)

Wenn mDNS blockiert ist, verwenden Sie eine Unicast-DNS-SD-Zone (wählen Sie eine Domain; Beispiel:
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

- Der Canvas-Host des Gateway stellt `/__openclaw__/canvas/` und `/__openclaw__/a2ui/` bereit.
- Er wird vom HTTP-Server des Gateway bereitgestellt (derselbe Port wie `gateway.port`, Standard `18789`).
- Der iOS-Node navigiert bei der Verbindung automatisch zu A2UI, wenn eine Canvas-Host-URL angekündigt wird.
- Kehren Sie mit `canvas.navigate` und `{"url":""}` zum integrierten Scaffold zurück.

### Canvas-Eval / Snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + Talk-Modus

- Voice wake und Talk-Modus sind in den Einstellungen verfügbar.
- iOS kann Background-Audio anhalten; behandeln Sie Sprachfunktionen als Best Effort, wenn die App nicht aktiv ist.

## Häufige Fehler

- `NODE_BACKGROUND_UNAVAILABLE`: Holen Sie die iOS-App in den Vordergrund (Canvas-/Kamera-/Screen-Befehle erfordern dies).
- `A2UI_HOST_NOT_CONFIGURED`: Das Gateway hat keine Canvas-Host-URL angekündigt; prüfen Sie `canvasHost` in der [Gateway-Konfiguration](/de/gateway/configuration).
- Pairing-Prompt erscheint nie: Führen Sie `openclaw devices list` aus und genehmigen Sie manuell.
- Reconnect schlägt nach einer Neuinstallation fehl: Das Pairing-Token im Keychain wurde gelöscht; pairen Sie den Node erneut.

## Verwandte Dokumentation

- [Pairing](/de/channels/pairing)
- [Discovery](/de/gateway/discovery)
- [Bonjour](/de/gateway/bonjour)
