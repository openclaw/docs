---
read_when:
    - De iOS-Node koppelen of opnieuw verbinden
    - De iOS-app vanuit de broncode uitvoeren
    - Gateway-detectie of canvas-commando's debuggen
summary: 'iOS-Node-app: verbinden met de Gateway, koppelen, canvas en probleemoplossing'
title: iOS-app
x-i18n:
    generated_at: "2026-05-07T13:22:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 707f8b97156e800f89bc00265c1889c9cbade347fde35f037a302065956346f4
    source_path: platforms/ios.md
    workflow: 16
---

Beschikbaarheid: interne preview. De iOS-app wordt nog niet openbaar gedistribueerd.

## Wat het doet

- Maakt verbinding met een Gateway via WebSocket (LAN of tailnet).
- Biedt Node-mogelijkheden: Canvas, Schermsnapshot, Camera-opname, Locatie, Praatmodus, Stemactivering.
- Ontvangt `node.invoke`-opdrachten en rapporteert Node-statusgebeurtenissen.

## Vereisten

- Gateway die op een ander apparaat draait (macOS, Linux of Windows via WSL2).
- Netwerkpad:
  - Hetzelfde LAN via Bonjour, **of**
  - Tailnet via unicast DNS-SD (voorbeelddomein: `openclaw.internal.`), **of**
  - Handmatige host/poort (fallback).

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

Als de app het koppelen opnieuw probeert met gewijzigde authenticatiegegevens (rol/scopes/openbare sleutel),
wordt het vorige openstaande verzoek vervangen en wordt een nieuwe `requestId` aangemaakt.
Voer vóór goedkeuring opnieuw `openclaw devices list` uit.

Optioneel: als de iOS-Node altijd verbinding maakt vanaf een strak beheerd subnet, kun je
kiezen voor automatische goedkeuring van een eerste Node-koppeling met expliciete CIDR's of exacte IP's:

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

Dit is standaard uitgeschakeld. Het geldt alleen voor nieuwe `role: node`-koppelingen zonder
gevraagde scopes. Operator-/browserkoppeling en elke wijziging van rol, scope, metadata of
openbare sleutel vereist nog steeds handmatige goedkeuring.

4. Controleer de verbinding:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Relay-ondersteunde push voor officiële builds

Officieel gedistribueerde iOS-builds gebruiken de externe push-relay in plaats van het ruwe APNs-token
naar de gateway te publiceren.

Vereiste aan de Gateway-zijde:

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
- De relay retourneert een ondoorzichtige relay-handle plus een verzendgrant met registratiescope.
- De iOS-app haalt de gekoppelde Gateway-identiteit op en neemt die op in de relay-registratie, zodat de relay-ondersteunde registratie aan die specifieke Gateway wordt gedelegeerd.
- De app stuurt die relay-ondersteunde registratie door naar de gekoppelde Gateway met `push.apns.register`.
- De Gateway gebruikt die opgeslagen relay-handle voor `push.test`, achtergrond-wakes en wake-nudges.
- De relay-basis-URL van de Gateway moet overeenkomen met de relay-URL die in de officiële/TestFlight-iOS-build is ingebakken.
- Als de app later verbinding maakt met een andere Gateway of met een build met een andere relay-basis-URL, vernieuwt deze de relay-registratie in plaats van de oude binding opnieuw te gebruiken.

Wat de Gateway voor dit pad **niet** nodig heeft:

- Geen implementatiebreed relay-token.
- Geen directe APNs-sleutel voor officiële/TestFlight relay-ondersteunde verzendingen.

Verwachte operator-flow:

1. Installeer de officiële/TestFlight-iOS-build.
2. Stel `gateway.push.apns.relay.baseUrl` in op de Gateway.
3. Koppel de app aan de Gateway en laat deze volledig verbinding maken.
4. De app publiceert automatisch `push.apns.register` nadat deze een APNs-token heeft, de operatorsessie is verbonden en relay-registratie is geslaagd.
5. Daarna kunnen `push.test`, reconnect-wakes en wake-nudges de opgeslagen relay-ondersteunde registratie gebruiken.

## Achtergrond-alive-beacons

Wanneer iOS de app wekt voor een stille push, achtergrondverversing of significant-location-gebeurtenis, probeert de app
kort opnieuw als Node te verbinden en roept daarna `node.event` aan met `event: "node.presence.alive"`.
De Gateway registreert dit alleen als `lastSeenAtMs`/`lastSeenReason` op de gekoppelde Node-/apparaatmetadata
nadat de geauthenticeerde Node-apparaatidentiteit bekend is.

De app beschouwt een achtergrond-wake alleen als succesvol geregistreerd wanneer het Gateway-antwoord
`handled: true` bevat. Oudere Gateways kunnen `node.event` bevestigen met `{ "ok": true }`; dat antwoord is
compatibel, maar telt niet als een duurzame last-seen-update.

Compatibiliteitsopmerking:

- `OPENCLAW_APNS_RELAY_BASE_URL` werkt nog steeds als tijdelijke env-override voor de Gateway.

## Authenticatie- en vertrouwensflow

De relay bestaat om twee beperkingen af te dwingen die directe APNs-op-de-Gateway niet kan bieden voor
officiële iOS-builds:

- Alleen echte OpenClaw-iOS-builds die via Apple worden gedistribueerd, kunnen de gehoste relay gebruiken.
- Een Gateway kan alleen relay-ondersteunde pushes verzenden voor iOS-apparaten die met die specifieke
  Gateway zijn gekoppeld.

Stap voor stap:

1. `iOS app -> gateway`
   - De app koppelt eerst met de Gateway via de normale Gateway-authenticatieflow.
   - Dat geeft de app een geauthenticeerde Node-sessie plus een geauthenticeerde operatorsessie.
   - De operatorsessie wordt gebruikt om `gateway.identity.get` aan te roepen.

2. `iOS app -> relay`
   - De app roept de relay-registratie-eindpunten aan via HTTPS.
   - Registratie bevat App Attest-bewijs plus een StoreKit-apptransactie-JWS.
   - De relay valideert de bundle-ID, het App Attest-bewijs en het Apple-distributiebewijs, en vereist het
     officiële/productiedistributiepad.
   - Dit blokkeert lokale Xcode-/dev-builds van het gebruik van de gehoste relay. Een lokale build kan
     ondertekend zijn, maar voldoet niet aan het officiële Apple-distributiebewijs dat de relay verwacht.

3. `gateway identity delegation`
   - Vóór relay-registratie haalt de app de gekoppelde Gateway-identiteit op via
     `gateway.identity.get`.
   - De app neemt die Gateway-identiteit op in de relay-registratiepayload.
   - De relay retourneert een relay-handle en een verzendgrant met registratiescope die aan
     die Gateway-identiteit zijn gedelegeerd.

4. `gateway -> relay`
   - De Gateway slaat de relay-handle en verzendgrant op uit `push.apns.register`.
   - Bij `push.test`, reconnect-wakes en wake-nudges ondertekent de Gateway het verzendverzoek met zijn
     eigen apparaatidentiteit.
   - De relay verifieert zowel de opgeslagen verzendgrant als de Gateway-handtekening tegen de gedelegeerde
     Gateway-identiteit uit de registratie.
   - Een andere Gateway kan die opgeslagen registratie niet opnieuw gebruiken, zelfs niet als die de handle op de een of andere manier verkrijgt.

5. `relay -> APNs`
   - De relay beheert de productie-APNs-referenties en het ruwe APNs-token voor de officiële build.
   - De Gateway slaat nooit het ruwe APNs-token op voor relay-ondersteunde officiële builds.
   - De relay verzendt de uiteindelijke push naar APNs namens de gekoppelde Gateway.

Waarom dit ontwerp is gemaakt:

- Om productie-APNs-referenties buiten gebruikers-Gateways te houden.
- Om te voorkomen dat ruwe APNs-tokens van officiële builds op de Gateway worden opgeslagen.
- Om gebruik van de gehoste relay alleen toe te staan voor officiële/TestFlight-OpenClaw-builds.
- Om te voorkomen dat één Gateway wake-pushes verzendt naar iOS-apparaten die bij een andere Gateway horen.

Lokale/handmatige builds blijven directe APNs gebruiken. Als je die builds zonder relay test, heeft de
Gateway nog steeds directe APNs-referenties nodig:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Dit zijn runtime-env-vars voor de Gateway-host, geen Fastlane-instellingen. `apps/ios/fastlane/.env` slaat alleen
App Store Connect-/TestFlight-authenticatie op, zoals `ASC_KEY_ID` en `ASC_ISSUER_ID`; het configureert geen
directe APNs-bezorging voor lokale iOS-builds.

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
wide-area DNS-SD-ontdekkingsdomein. Gateways op hetzelfde LAN verschijnen automatisch vanuit `local.`;
ontdekking over netwerken heen kan het geconfigureerde wide-area-domein gebruiken zonder het beacon-type te wijzigen.

### Tailnet (cross-network)

Als mDNS is geblokkeerd, gebruik dan een unicast DNS-SD-zone (kies een domein; voorbeeld:
`openclaw.internal.`) en Tailscale split DNS.
Zie [Bonjour](/nl/gateway/bonjour) voor het CoreDNS-voorbeeld.

### Handmatige host/poort

Schakel in Instellingen **Handmatige host** in en voer de Gateway-host + poort in (standaard `18789`).

## Canvas + A2UI

De iOS-Node rendert een WKWebView-canvas. Gebruik `node.invoke` om het aan te sturen:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Opmerkingen:

- De Gateway-canvas-host serveert `/__openclaw__/canvas/` en `/__openclaw__/a2ui/`.
- Deze wordt geserveerd vanaf de Gateway-HTTP-server (dezelfde poort als `gateway.port`, standaard `18789`).
- De iOS-Node navigeert bij verbinden automatisch naar A2UI wanneer een canvas-host-URL wordt geadverteerd.
- Keer terug naar de ingebouwde scaffold met `canvas.navigate` en `{"url":""}`.

## Relatie met Computer Use

De iOS-app is een mobiel Node-oppervlak, geen Codex Computer Use-backend. Codex
Computer Use en `cua-driver mcp` besturen een lokale macOS-desktop via MCP-tools;
de iOS-app biedt iPhone-mogelijkheden via OpenClaw-Node-opdrachten
zoals `canvas.*`, `camera.*`, `screen.*`, `location.*` en `talk.*`.

Agents kunnen de iOS-app nog steeds via OpenClaw bedienen door Node-opdrachten
aan te roepen, maar die aanroepen lopen via het Gateway-Node-protocol en volgen de
voorgrond-/achtergrondlimieten van iOS. Gebruik [Codex Computer Use](/nl/plugins/codex-computer-use)
voor lokale desktopbediening en deze pagina voor iOS-Node-mogelijkheden.

### Canvas-eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Stemactivering + praatmodus

- Stemactivering en praatmodus zijn beschikbaar in Instellingen.
- iOS-Nodes met praatmogelijkheden adverteren de `talk`-mogelijkheid en kunnen
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` en `talk.ptt.once` declareren;
  de Gateway staat die push-to-talk-opdrachten standaard toe voor vertrouwde
  Nodes met Talk-mogelijkheden.
- iOS kan achtergrondaudio onderbreken; behandel spraakfuncties als best-effort wanneer de app niet actief is.

## Veelvoorkomende fouten

- `NODE_BACKGROUND_UNAVAILABLE`: breng de iOS-app naar de voorgrond (canvas-/camera-/schermopdrachten vereisen dit).
- `A2UI_HOST_NOT_CONFIGURED`: de Gateway heeft de Canvas Plugin-oppervlak-URL niet geadverteerd; controleer `plugins.entries.canvas.config.host` in [Gateway-configuratie](/nl/gateway/configuration).
- Koppelingsprompt verschijnt nooit: voer `openclaw devices list` uit en keur handmatig goed.
- Opnieuw verbinden mislukt na herinstallatie: het Keychain-koppelingstoken is gewist; koppel de Node opnieuw.

## Gerelateerde docs

- [Koppelen](/nl/channels/pairing)
- [Ontdekking](/nl/gateway/discovery)
- [Bonjour](/nl/gateway/bonjour)
