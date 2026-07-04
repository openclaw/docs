---
read_when:
    - De iOS-node koppelen of opnieuw verbinden
    - De iOS-app uitvoeren vanuit de broncode
    - Debuggen van Gateway-discovery of canvas-opdrachten
summary: 'iOS-node-app: verbinden met de Gateway, koppelen, canvas en probleemoplossing'
title: iOS-app
x-i18n:
    generated_at: "2026-07-04T18:08:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ad6d272518b36564562256f55ffc320c0c4d2b954914ac73c23e450fa7acee0b
    source_path: platforms/ios.md
    workflow: 16
---

Beschikbaarheid: iPhone-appbuilds worden via Apple-kanalen verspreid wanneer dit voor een release is ingeschakeld. Lokale ontwikkelbuilds kunnen ook vanuit de broncode draaien.

## Wat het doet

- Maakt verbinding met een Gateway via WebSocket (LAN of tailnet).
- Biedt node-mogelijkheden: Canvas, schermsnapshot, camera-opname, locatie, praatmodus, spraakwekfunctie.
- Ontvangt `node.invoke`-opdrachten en rapporteert nodestatusevents.

## Vereisten

- Gateway die op een ander apparaat draait (macOS, Linux of Windows via WSL2).
- Netwerkpad:
  - Zelfde LAN via Bonjour, **of**
  - Tailnet via unicast DNS-SD (voorbeelddomein: `openclaw.internal.`), **of**
  - Handmatige host/poort (fallback).

## Snel starten (koppelen + verbinden)

1. Start een geauthenticeerde Gateway met een route die je telefoon kan bereiken. Tailscale
   Serve is het aanbevolen externe pad:

```bash
openclaw gateway --port 18789 --tailscale serve
```

Gebruik voor een vertrouwde installatie op hetzelfde LAN in plaats daarvan een geauthenticeerde `gateway.bind: "lan"`.
De standaard loopback-bind is niet bereikbaar vanaf een telefoon. Als de
Gateway nog niet is geconfigureerd, voer dan eerst `openclaw onboard` uit zodat het aanmaken van de setup-code
een token- of wachtwoordauthenticatiepad heeft.

2. Open de [Control UI](/nl/web/control-ui), selecteer **Nodes** en klik op
   **Mobiel apparaat koppelen** in de kaart **Apparaten**.

3. Open in de iOS-app **Instellingen** → **Gateway**, scan de QR-code (of plak
   de setup-code) en maak verbinding.

4. De officiële app maakt automatisch verbinding. Als **Apparaten** een wachtend
   verzoek toont, controleer dan de rol en scopes voordat je het goedkeurt.

De knop in de Control UI vereist een al gekoppelde sessie met `operator.admin`.
Als terminalfallback kies je een ontdekte Gateway in de iOS-app (of schakel je
Handmatige host in en voer je host/poort in), en keur je daarna het verzoek goed op de Gateway-host:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Als de app opnieuw probeert te koppelen met gewijzigde authdetails (rol/scopes/openbare sleutel),
wordt het vorige wachtende verzoek vervangen en wordt een nieuwe `requestId` aangemaakt.
Voer `openclaw devices list` opnieuw uit vóór goedkeuring.

Optioneel: als de iOS-node altijd verbinding maakt vanaf een strikt beheerd subnet, kun je
je aanmelden voor automatische goedkeuring van nodes bij de eerste keer met expliciete CIDR's of exacte IP's:

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

Dit is standaard uitgeschakeld. Het geldt alleen voor nieuwe `role: node`-koppelingen
zonder aangevraagde scopes. Koppelingen voor operator/browser en elke wijziging in rol, scope, metadata of
openbare sleutel vereisen nog steeds handmatige goedkeuring.

5. Controleer de verbinding:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push met relay-backend voor officiële builds

Officieel verspreide iOS-builds gebruiken de externe pushrelay in plaats van het ruwe APNs-
token naar de Gateway te publiceren.

Officiële App Store-builds uit de openbare releasebaan gebruiken de gehoste relay op `https://ios-push-relay.openclaw.ai`.

Aangepaste relay-deployments vereisen een bewust apart iOS-build-/deploymentpad waarvan de relay-URL overeenkomt met de Gateway-relay-URL. De openbare App Store-releasebaan accepteert geen aangepaste relay-URL-overschrijvingen. Als je een aangepaste relaybuild gebruikt, stel dan de bijpassende Gateway-relay-URL in:

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

Zo werkt de flow:

- De iOS-app registreert zich bij de relay met App Attest en een StoreKit-apptransactie-JWS.
- De relay retourneert een ondoorzichtige relayhandle plus een verzendtoekenning met registratiescope.
- De iOS-app haalt de gekoppelde Gateway-identiteit op en neemt die op in de relayregistratie, zodat de relay-backed registratie aan die specifieke Gateway wordt gedelegeerd.
- De app stuurt die relay-backed registratie door naar de gekoppelde Gateway met `push.apns.register`.
- De Gateway gebruikt die opgeslagen relayhandle voor `push.test`, achtergrondwekacties en wake-nudges.
- Aangepaste Gateway-relay-URL's moeten overeenkomen met de relay-URL die in de iOS-build is ingebakken.
- Als de app later verbinding maakt met een andere Gateway of een build met een andere relaybasis-URL, vernieuwt hij de relayregistratie in plaats van de oude binding opnieuw te gebruiken.

Wat de Gateway voor dit pad **niet** nodig heeft:

- Geen deploymentbreed relaytoken.
- Geen directe APNs-sleutel voor officiële relay-backed verzendingen uit de App Store.

Verwachte operatorflow:

1. Installeer de officiële iOS-app.
2. Optioneel: stel `gateway.push.apns.relay.baseUrl` op de Gateway alleen in wanneer je een bewust aparte aangepaste relaybuild gebruikt.
3. Koppel de app aan de Gateway en laat deze de verbinding afronden.
4. De app publiceert `push.apns.register` automatisch nadat hij een APNs-token heeft, de operatorsessie verbonden is en de relayregistratie slaagt.
5. Daarna kunnen `push.test`, reconnect-wakes en wake-nudges de opgeslagen relay-backed registratie gebruiken.

## Achtergrond-alive-beacons

Wanneer iOS de app wekt voor een stille push, achtergrondverversing of significant-location-event, probeert de app
kort opnieuw verbinding te maken als node en roept daarna `node.event` aan met `event: "node.presence.alive"`.
De Gateway legt dit alleen vast als `lastSeenAtMs`/`lastSeenReason` op de metadata van de gekoppelde node/het gekoppelde apparaat
nadat de geauthenticeerde identiteit van het nodeapparaat bekend is.

De app beschouwt een achtergrondwekactie alleen als succesvol vastgelegd wanneer de Gateway-response
`handled: true` bevat. Oudere Gateways kunnen `node.event` bevestigen met `{ "ok": true }`; die response is
compatibel maar telt niet als een duurzame last-seen-update.

Compatibiliteitsopmerking:

- `OPENCLAW_APNS_RELAY_BASE_URL` werkt nog steeds als tijdelijke env-overschrijving voor de Gateway.
- De openbare App Store-releasebaan weigert `OPENCLAW_PUSH_RELAY_BASE_URL` voor iOS-builds.

## Authenticatie- en vertrouwensflow

De relay bestaat om twee beperkingen af te dwingen die directe APNs-op-de-Gateway niet kan bieden voor
officiële iOS-builds:

- Alleen echte OpenClaw iOS-builds die via Apple worden verspreid, kunnen de gehoste relay gebruiken.
- Een Gateway kan relay-backed pushes alleen verzenden voor iOS-apparaten die met die specifieke
  Gateway zijn gekoppeld.

Hop voor hop:

1. `iOS app -> gateway`
   - De app koppelt eerst met de Gateway via de normale Gateway-authflow.
   - Dat geeft de app een geauthenticeerde nodesessie plus een geauthenticeerde operatorsessie.
   - De operatorsessie wordt gebruikt om `gateway.identity.get` aan te roepen.

2. `iOS app -> relay`
   - De app roept de relayregistratie-eindpunten aan via HTTPS.
   - De registratie bevat App Attest-bewijs plus een StoreKit-apptransactie-JWS.
   - De relay valideert de bundel-ID, het App Attest-bewijs en het Apple-distributiebewijs, en vereist het
     officiële/productiedistributiepad.
   - Dit blokkeert lokale Xcode-/dev-builds van het gebruik van de gehoste relay. Een lokale build kan
     ondertekend zijn, maar voldoet niet aan het officiële Apple-distributiebewijs dat de relay verwacht.

3. `gateway identity delegation`
   - Vóór relayregistratie haalt de app de gekoppelde Gateway-identiteit op via
     `gateway.identity.get`.
   - De app neemt die Gateway-identiteit op in de payload voor relayregistratie.
   - De relay retourneert een relayhandle en een verzendtoekenning met registratiescope die zijn gedelegeerd aan
     die Gateway-identiteit.

4. `gateway -> relay`
   - De Gateway slaat de relayhandle en verzendtoekenning uit `push.apns.register` op.
   - Bij `push.test`, reconnect-wakes en wake-nudges ondertekent de Gateway het verzendverzoek met zijn
     eigen apparaatidentiteit.
   - De relay verifieert zowel de opgeslagen verzendtoekenning als de Gateway-handtekening tegen de gedelegeerde
     Gateway-identiteit uit de registratie.
   - Een andere Gateway kan die opgeslagen registratie niet opnieuw gebruiken, zelfs niet als die op een of andere manier de handle verkrijgt.

5. `relay -> APNs`
   - De relay bezit de productie-APNs-referenties en het ruwe APNs-token voor de officiële build.
   - De Gateway slaat het ruwe APNs-token nooit op voor relay-backed officiële builds.
   - De relay verzendt de uiteindelijke push naar APNs namens de gekoppelde Gateway.

Waarom dit ontwerp is gemaakt:

- Om productie-APNs-referenties buiten gebruikers-Gateways te houden.
- Om het opslaan van ruwe APNs-tokens van officiële builds op de Gateway te vermijden.
- Om gebruik van de gehoste relay alleen toe te staan voor officiële OpenClaw iOS-builds.
- Om te voorkomen dat één Gateway wake-pushes verzendt naar iOS-apparaten die bij een andere Gateway horen.

Lokale/handmatige builds blijven directe APNs gebruiken. Als je die builds zonder de relay test, heeft de
Gateway nog steeds directe APNs-referenties nodig:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Dit zijn runtime-env-vars voor de Gateway-host, geen Fastlane-instellingen. `apps/ios/fastlane/.env` slaat alleen
App Store Connect-auth op, zoals `APP_STORE_CONNECT_KEY_ID` en
`APP_STORE_CONNECT_ISSUER_ID`; het configureert geen directe APNs-levering voor lokale iOS-builds.

Aanbevolen opslag op de Gateway-host:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Commit het `.p8`-bestand niet en plaats het niet onder de repo-checkout.

## Ontdekkingspaden

### Bonjour (LAN)

De iOS-app browset `_openclaw-gw._tcp` op `local.` en, wanneer geconfigureerd, hetzelfde
wide-area DNS-SD-ontdekkingsdomein. Gateways op hetzelfde LAN verschijnen automatisch via `local.`;
cross-network-ontdekking kan het geconfigureerde wide-area-domein gebruiken zonder het beacontype te wijzigen.

### Tailnet (cross-network)

Als mDNS wordt geblokkeerd, gebruik dan een unicast DNS-SD-zone (kies een domein; voorbeeld:
`openclaw.internal.`) en Tailscale split DNS.
Zie [Bonjour](/nl/gateway/bonjour) voor het CoreDNS-voorbeeld.

### Handmatige host/poort

Schakel in Instellingen **Handmatige host** in en voer de Gateway-host + poort in (standaard `18789`).

## Canvas + A2UI

De iOS-node rendert een WKWebView-canvas. Gebruik `node.invoke` om het aan te sturen:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Opmerkingen:

- De Gateway-canvas-host serveert `/__openclaw__/canvas/` en `/__openclaw__/a2ui/`.
- Het wordt geserveerd vanaf de Gateway-HTTP-server (dezelfde poort als `gateway.port`, standaard `18789`).
- De iOS-node houdt de ingebouwde scaffold als de verbonden standaardweergave. `canvas.a2ui.push` en `canvas.a2ui.reset` gebruiken de gebundelde app-eigen A2UI-pagina.
- Externe Gateway-A2UI-pagina's zijn render-only op iOS; native A2UI-knopacties worden alleen geaccepteerd vanuit gebundelde app-eigen pagina's.
- Keer terug naar de ingebouwde scaffold met `canvas.navigate` en `{"url":""}`.

## Relatie met Computer Use

De iOS-app is een mobiele node-surface, geen Codex Computer Use-backend. Codex
Computer Use en `cua-driver mcp` besturen een lokale macOS-desktop via MCP-
tools; de iOS-app biedt iPhone-mogelijkheden via OpenClaw-nodeopdrachten
zoals `canvas.*`, `camera.*`, `screen.*`, `location.*` en `talk.*`.

Agents kunnen de iOS-app nog steeds via OpenClaw bedienen door node-
opdrachten aan te roepen, maar die calls verlopen via het Gateway-nodeprotocol en volgen de
foreground-/background-limieten van iOS. Gebruik [Codex Computer Use](/nl/plugins/codex-computer-use)
voor lokale desktopbesturing en deze pagina voor iOS-node-mogelijkheden.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Spraakwekfunctie + praatmodus

- Spraakactivering en Talk-modus zijn beschikbaar in Instellingen.
- OpenAI realtime Talk gebruikt clientbeheerde WebRTC wanneer `talk.realtime.transport` `webrtc` is; een expliciete `gateway-relay`-configuratie blijft Gateway-beheerd. Zie [Talk-modus](/nl/nodes/talk).
- iOS-nodes met Talk-ondersteuning adverteren de `talk`-capability en kunnen
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` en `talk.ptt.once` declareren;
  de Gateway staat die push-to-talk-opdrachten standaard toe voor vertrouwde
  Talk-geschikte nodes.
- iOS kan achtergrondaudio onderbreken; beschouw spraakfuncties als best-effort wanneer de app niet actief is.

## Veelvoorkomende fouten

- `NODE_BACKGROUND_UNAVAILABLE`: breng de iOS-app naar de voorgrond (canvas-/camera-/schermopdrachten vereisen dit).
- `A2UI_HOST_UNAVAILABLE`: de gebundelde A2UI-pagina was niet bereikbaar in de app-WebView; houd de app op de voorgrond op het tabblad Scherm en probeer het opnieuw.
- Koppelingsprompt verschijnt nooit: voer `openclaw devices list` uit en keur handmatig goed.
- Opnieuw verbinden mislukt na herinstallatie: het Keychain-koppelingstoken is gewist; koppel de node opnieuw.

## Gerelateerde documentatie

- [Koppelen](/nl/channels/pairing)
- [Detectie](/nl/gateway/discovery)
- [Bonjour](/nl/gateway/bonjour)
