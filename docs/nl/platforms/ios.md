---
read_when:
    - De iOS-Node koppelen of opnieuw verbinden
    - De iOS-app vanuit de broncode uitvoeren
    - Gateway-detectie of canvasopdrachten debuggen
summary: 'iOS Node-app: verbinden met de Gateway, koppelen, canvas en probleemoplossing'
title: iOS-app
x-i18n:
    generated_at: "2026-07-02T22:40:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 150349a06488ecb36a4456d323738cca329c47d83ef6006e6f8de5e39ebb4902
    source_path: platforms/ios.md
    workflow: 16
---

Beschikbaarheid: iPhone-appbuilds worden via Apple-kanalen gedistribueerd wanneer dit voor een release is ingeschakeld. Lokale ontwikkelbuilds kunnen ook vanuit broncode worden uitgevoerd.

## Wat het doet

- Maakt verbinding met een Gateway via WebSocket (LAN of tailnet).
- Biedt node-mogelijkheden: Canvas, schermsnapshot, cameravastlegging, locatie, praatmodus, spraakactivatie.
- Ontvangt `node.invoke`-opdrachten en rapporteert node-statusgebeurtenissen.

## Vereisten

- Gateway draait op een ander apparaat (macOS, Linux of Windows via WSL2).
- Netwerkpad:
  - Zelfde LAN via Bonjour, **of**
  - Tailnet via unicast DNS-SD (voorbeelddomein: `openclaw.internal.`), **of**
  - Handmatige host/poort (terugval).

## Snelstart (koppelen + verbinden)

1. Start de Gateway:

```bash
openclaw gateway --port 18789
```

2. Open Instellingen in de iOS-app en kies een gevonden gateway (of schakel Handmatige host in en voer host/poort in).

3. Keur het koppelingsverzoek goed op de gateway-host:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Als de app opnieuw probeert te koppelen met gewijzigde authgegevens (rol/scopes/publieke sleutel),
wordt het vorige openstaande verzoek vervangen en wordt een nieuwe `requestId` aangemaakt.
Voer vóór goedkeuring opnieuw `openclaw devices list` uit.

Optioneel: als de iOS-node altijd verbinding maakt vanaf een strikt gecontroleerd subnet, kun je
je expliciet aanmelden voor automatische goedkeuring van nodes bij de eerste keer met expliciete CIDR's of exacte IP's:

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

Dit is standaard uitgeschakeld. Het is alleen van toepassing op nieuwe `role: node`-koppeling zonder
aangevraagde scopes. Operator-/browserkoppeling en elke wijziging in rol, scope, metadata of
publieke sleutel vereisen nog steeds handmatige goedkeuring.

4. Verifieer de verbinding:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Relay-ondersteunde push voor officiële builds

Officieel gedistribueerde iOS-builds gebruiken de externe pushrelay in plaats van het ruwe APNs-
token naar de gateway te publiceren.

Officiële App Store-builds uit de publieke releasebaan gebruiken de gehoste relay op `https://ios-push-relay.openclaw.ai`.

Aangepaste relay-implementaties vereisen een bewust gescheiden iOS-build-/implementatiepad waarvan de relay-URL overeenkomt met de gateway-relay-URL. De publieke App Store-releasebaan accepteert geen aangepaste relay-URL-overschrijvingen. Als je een aangepaste relay-build gebruikt, stel dan de overeenkomende gateway-relay-URL in:

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

Zo werkt de stroom:

- De iOS-app registreert zich bij de relay met App Attest en een StoreKit-apptransactie-JWS.
- De relay retourneert een ondoorzichtige relay-handle plus een verzendtoekenning met registratiescope.
- De iOS-app haalt de gekoppelde gateway-identiteit op en neemt die op in de relayregistratie, zodat de relay-ondersteunde registratie aan die specifieke gateway wordt gedelegeerd.
- De app stuurt die relay-ondersteunde registratie door naar de gekoppelde gateway met `push.apns.register`.
- De gateway gebruikt die opgeslagen relay-handle voor `push.test`, achtergrondwekkingen en wake-nudges.
- Aangepaste gateway-relay-URL's moeten overeenkomen met de relay-URL die in de iOS-build is ingebakken.
- Als de app later verbinding maakt met een andere gateway of een build met een andere relay-basis-URL, ververst de app de relayregistratie in plaats van de oude binding opnieuw te gebruiken.

Wat de gateway voor dit pad **niet** nodig heeft:

- Geen implementatiebrede relay-token.
- Geen directe APNs-sleutel voor officiële App Store-relay-ondersteunde verzendingen.

Verwachte operatorstroom:

1. Installeer de officiële iOS-app.
2. Optioneel: stel `gateway.push.apns.relay.baseUrl` op de gateway alleen in wanneer je een bewust gescheiden aangepaste relay-build gebruikt.
3. Koppel de app aan de gateway en laat deze de verbinding voltooien.
4. De app publiceert `push.apns.register` automatisch nadat deze een APNs-token heeft, de operatorsessie verbonden is en de relayregistratie slaagt.
5. Daarna kunnen `push.test`, reconnect-wakes en wake-nudges de opgeslagen relay-ondersteunde registratie gebruiken.

## Achtergrond-alive-beacons

Wanneer iOS de app wekt voor een stille push, achtergrondverversing of belangrijke locatiegebeurtenis, probeert de app
kort opnieuw verbinding te maken als node en roept daarna `node.event` aan met `event: "node.presence.alive"`.
De gateway registreert dit als `lastSeenAtMs`/`lastSeenReason` op de metadata van de gekoppelde node/het gekoppelde apparaat, maar alleen
nadat de geauthenticeerde node-apparaatidentiteit bekend is.

De app behandelt een achtergrondwake alleen als succesvol geregistreerd wanneer het gateway-antwoord
`handled: true` bevat. Oudere gateways kunnen `node.event` bevestigen met `{ "ok": true }`; dat antwoord is
compatibel maar telt niet als duurzame last-seen-update.

Compatibiliteitsopmerking:

- `OPENCLAW_APNS_RELAY_BASE_URL` werkt nog steeds als tijdelijke env-overschrijving voor de gateway.
- De publieke App Store-releasebaan weigert `OPENCLAW_PUSH_RELAY_BASE_URL` voor iOS-builds.

## Authenticatie- en vertrouwensstroom

De relay bestaat om twee beperkingen af te dwingen die directe APNs-op-gateway niet kan bieden voor
officiële iOS-builds:

- Alleen echte OpenClaw iOS-builds die via Apple worden gedistribueerd, kunnen de gehoste relay gebruiken.
- Een gateway kan relay-ondersteunde pushes alleen verzenden voor iOS-apparaten die met die specifieke
  gateway zijn gekoppeld.

Stap voor stap:

1. `iOS app -> gateway`
   - De app koppelt eerst met de gateway via de normale Gateway-authstroom.
   - Dat geeft de app een geauthenticeerde nodesessie plus een geauthenticeerde operatorsessie.
   - De operatorsessie wordt gebruikt om `gateway.identity.get` aan te roepen.

2. `iOS app -> relay`
   - De app roept de relayregistratie-eindpunten aan via HTTPS.
   - Registratie bevat App Attest-bewijs plus een StoreKit-apptransactie-JWS.
   - De relay valideert de bundel-ID, het App Attest-bewijs en het Apple-distributiebewijs, en vereist het
     officiële/productiedistributiepad.
   - Dit blokkeert lokale Xcode-/ontwikkelbuilds van het gebruik van de gehoste relay. Een lokale build kan
     ondertekend zijn, maar voldoet niet aan het officiële Apple-distributiebewijs dat de relay verwacht.

3. `gateway identity delegation`
   - Vóór relayregistratie haalt de app de gekoppelde gateway-identiteit op uit
     `gateway.identity.get`.
   - De app neemt die gateway-identiteit op in de relayregistratiepayload.
   - De relay retourneert een relay-handle en een verzendtoekenning met registratiescope die aan
     die gateway-identiteit zijn gedelegeerd.

4. `gateway -> relay`
   - De gateway bewaart de relay-handle en verzendtoekenning uit `push.apns.register`.
   - Bij `push.test`, reconnect-wakes en wake-nudges ondertekent de gateway het verzendverzoek met zijn
     eigen apparaatidentiteit.
   - De relay verifieert zowel de opgeslagen verzendtoekenning als de gateway-handtekening tegen de gedelegeerde
     gateway-identiteit uit de registratie.
   - Een andere gateway kan die opgeslagen registratie niet opnieuw gebruiken, zelfs niet als die op een of andere manier de handle verkrijgt.

5. `relay -> APNs`
   - De relay bezit de productie-APNs-referenties en het ruwe APNs-token voor de officiële build.
   - De gateway slaat nooit het ruwe APNs-token op voor relay-ondersteunde officiële builds.
   - De relay stuurt de uiteindelijke push naar APNs namens de gekoppelde gateway.

Waarom dit ontwerp is gemaakt:

- Om productie-APNs-referenties buiten gebruikersgateways te houden.
- Om te voorkomen dat ruwe APNs-tokens van officiële builds op de gateway worden opgeslagen.
- Om gehost relaygebruik alleen toe te staan voor officiële OpenClaw iOS-builds.
- Om te voorkomen dat één gateway wake-pushes verzendt naar iOS-apparaten die bij een andere gateway horen.

Lokale/handmatige builds blijven directe APNs gebruiken. Als je die builds zonder de relay test, heeft de
gateway nog steeds directe APNs-referenties nodig:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Dit zijn runtime-env-vars voor de gateway-host, geen Fastlane-instellingen. `apps/ios/fastlane/.env` bewaart alleen
App Store Connect-auth zoals `APP_STORE_CONNECT_KEY_ID` en
`APP_STORE_CONNECT_ISSUER_ID`; het configureert geen directe APNs-aflevering voor lokale iOS-builds.

Aanbevolen opslag op de gateway-host:

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

De iOS-app bladert door `_openclaw-gw._tcp` op `local.` en, wanneer geconfigureerd, hetzelfde
wide-area DNS-SD-ontdekkingsdomein. Gateways op hetzelfde LAN verschijnen automatisch vanuit `local.`;
cross-network-ontdekking kan het geconfigureerde wide-area-domein gebruiken zonder het beacon-type te wijzigen.

### Tailnet (cross-network)

Als mDNS is geblokkeerd, gebruik dan een unicast DNS-SD-zone (kies een domein; voorbeeld:
`openclaw.internal.`) en Tailscale split DNS.
Zie [Bonjour](/nl/gateway/bonjour) voor het CoreDNS-voorbeeld.

### Handmatige host/poort

Schakel in Instellingen **Handmatige host** in en voer de gateway-host + poort in (standaard `18789`).

## Canvas + A2UI

De iOS-node rendert een WKWebView-canvas. Gebruik `node.invoke` om het aan te sturen:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Opmerkingen:

- De Gateway-canvas-host serveert `/__openclaw__/canvas/` en `/__openclaw__/a2ui/`.
- Deze wordt geserveerd vanaf de Gateway-HTTP-server (dezelfde poort als `gateway.port`, standaard `18789`).
- De iOS-node behoudt de ingebouwde scaffold als de verbonden standaardweergave. `canvas.a2ui.push` en `canvas.a2ui.reset` gebruiken de gebundelde app-eigen A2UI-pagina.
- Remote Gateway A2UI-pagina's zijn alleen-renderen op iOS; native A2UI-knopacties worden alleen geaccepteerd vanaf gebundelde app-eigen pagina's.
- Keer terug naar de ingebouwde scaffold met `canvas.navigate` en `{"url":""}`.

## Relatie met Computer Use

De iOS-app is een mobiel node-oppervlak, geen Codex Computer Use-backend. Codex
Computer Use en `cua-driver mcp` besturen een lokaal macOS-bureaublad via MCP-
tools; de iOS-app biedt iPhone-mogelijkheden via OpenClaw-nodeopdrachten
zoals `canvas.*`, `camera.*`, `screen.*`, `location.*` en `talk.*`.

Agents kunnen de iOS-app nog steeds bedienen via OpenClaw door node-
opdrachten aan te roepen, maar die aanroepen gaan via het gateway-nodeprotocol en volgen de iOS-
voorgrond-/achtergrondlimieten. Gebruik [Codex Computer Use](/nl/plugins/codex-computer-use)
voor lokale desktopbesturing en deze pagina voor iOS-node-mogelijkheden.

### Canvas-evaluatie / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Spraakactivatie + praatmodus

- Spraakactivatie en praatmodus zijn beschikbaar in Instellingen.
- OpenAI realtime Talk gebruikt client-eigen WebRTC wanneer `talk.realtime.transport` `webrtc` is; een expliciete `gateway-relay`-configuratie blijft Gateway-eigendom. Zie [Praatmodus](/nl/nodes/talk).
- Talk-geschikte iOS-nodes adverteren de `talk`-mogelijkheid en kunnen
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` en `talk.ptt.once` declareren;
  de Gateway staat deze push-to-talk-opdrachten standaard toe voor vertrouwde
  Talk-geschikte nodes.
- iOS kan achtergrondaudio onderbreken; behandel spraakfuncties als best-effort wanneer de app niet actief is.

## Veelvoorkomende fouten

- `NODE_BACKGROUND_UNAVAILABLE`: breng de iOS-app naar de voorgrond (canvas-/camera-/schermopdrachten vereisen dit).
- `A2UI_HOST_UNAVAILABLE`: de gebundelde A2UI-pagina was niet bereikbaar in de app-WebView; houd de app op de voorgrond op het tabblad Scherm en probeer het opnieuw.
- Koppelingsprompt verschijnt nooit: voer `openclaw devices list` uit en keur handmatig goed.
- Opnieuw verbinden mislukt na herinstallatie: de Keychain-koppelingstoken is gewist; koppel de node opnieuw.

## Gerelateerde docs

- [Koppelen](/nl/channels/pairing)
- [Ontdekking](/nl/gateway/discovery)
- [Bonjour](/nl/gateway/bonjour)
