---
read_when:
    - Koppelen of opnieuw verbinden van de iOS-Node
    - De iOS-app vanuit de broncode uitvoeren
    - Gateway-detectie of canvas-opdrachten debuggen
summary: 'iOS Node-app: verbinding maken met de Gateway, koppelen, canvas en probleemoplossing'
title: iOS-app
x-i18n:
    generated_at: "2026-04-29T22:58:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fdbe578f15d2641d1bcb147fee7626486210cceae0cc355a92b3b2dd6291c35
    source_path: platforms/ios.md
    workflow: 16
---

Beschikbaarheid: interne preview. De iOS-app wordt nog niet publiek gedistribueerd.

## Wat het doet

- Maakt verbinding met een Gateway via WebSocket (LAN of tailnet).
- Biedt node-mogelijkheden: Canvas, schermsnapshot, camera-opname, locatie, praatmodus, spraakwekfunctie.
- Ontvangt `node.invoke`-opdrachten en rapporteert node-statusgebeurtenissen.

## Vereisten

- Gateway actief op een ander apparaat (macOS, Linux of Windows via WSL2).
- Netwerkpad:
  - Zelfde LAN via Bonjour, **of**
  - Tailnet via unicast DNS-SD (voorbeelddomein: `openclaw.internal.`), **of**
  - Handmatige host/poort (fallback).

## Snelstart (koppelen + verbinden)

1. Start de Gateway:

```bash
openclaw gateway --port 18789
```

2. Open in de iOS-app Instellingen en kies een ontdekte gateway (of schakel Handmatige host in en voer host/poort in).

3. Keur het koppelingsverzoek goed op de gateway-host:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Als de app opnieuw probeert te koppelen met gewijzigde auth-gegevens (rol/scopes/publieke sleutel),
wordt het vorige wachtende verzoek vervangen en wordt een nieuwe `requestId` aangemaakt.
Voer vóór goedkeuring opnieuw `openclaw devices list` uit.

Optioneel: als de iOS-node altijd verbinding maakt vanaf een strak gecontroleerd subnet, kun je
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
zonder aangevraagde scopes. Operator-/browserkoppeling en elke wijziging in rol, scope, metadata of
publieke sleutel vereisen nog steeds handmatige goedkeuring.

4. Controleer de verbinding:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Relay-ondersteunde push voor officiële builds

Officieel gedistribueerde iOS-builds gebruiken de externe push-relay in plaats van het raw APNs-token
naar de gateway te publiceren.

Vereiste aan Gateway-zijde:

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

Hoe de flow werkt:

- De iOS-app registreert zich bij de relay met App Attest en een StoreKit-apptransactie-JWS.
- De relay retourneert een ondoorzichtige relay-handle plus een verzendmachtiging die aan de registratie is gekoppeld.
- De iOS-app haalt de gekoppelde gateway-identiteit op en neemt die op in de relay-registratie, zodat de relay-ondersteunde registratie aan die specifieke gateway wordt gedelegeerd.
- De app stuurt die relay-ondersteunde registratie door naar de gekoppelde gateway met `push.apns.register`.
- De gateway gebruikt die opgeslagen relay-handle voor `push.test`, achtergrondwekkingen en wekprikkels.
- De relay-basis-URL van de gateway moet overeenkomen met de relay-URL die in de officiële/TestFlight iOS-build is ingebakken.
- Als de app later verbinding maakt met een andere gateway of een build met een andere relay-basis-URL, vernieuwt deze de relay-registratie in plaats van de oude binding opnieuw te gebruiken.

Wat de gateway voor dit pad **niet** nodig heeft:

- Geen relay-token voor de hele deployment.
- Geen directe APNs-sleutel voor officiële/TestFlight relay-ondersteunde verzendingen.

Verwachte operatorflow:

1. Installeer de officiële/TestFlight iOS-build.
2. Stel `gateway.push.apns.relay.baseUrl` in op de gateway.
3. Koppel de app aan de gateway en laat deze volledig verbinden.
4. De app publiceert `push.apns.register` automatisch nadat deze een APNs-token heeft, de operatorsessie is verbonden en de relay-registratie slaagt.
5. Daarna kunnen `push.test`, reconnect-wakes en wekprikkels de opgeslagen relay-ondersteunde registratie gebruiken.

## Achtergrond-alive-beacons

Wanneer iOS de app wekt voor een stille push, achtergrondverversing of significante-locatiegebeurtenis, probeert de app
kort opnieuw als node te verbinden en roept daarna `node.event` aan met `event: "node.presence.alive"`.
De gateway registreert dit als `lastSeenAtMs`/`lastSeenReason` in de gekoppelde node-/apparaatmetadata, maar alleen
nadat de geauthenticeerde node-apparaatidentiteit bekend is.

De app beschouwt een achtergrondwekking alleen als succesvol geregistreerd wanneer de gatewayrespons
`handled: true` bevat. Oudere gateways kunnen `node.event` bevestigen met `{ "ok": true }`; die respons is
compatibel, maar telt niet als duurzame last-seen-update.

Compatibiliteitsopmerking:

- `OPENCLAW_APNS_RELAY_BASE_URL` werkt nog steeds als tijdelijke env-override voor de gateway.

## Authenticatie- en vertrouwensflow

De relay bestaat om twee beperkingen af te dwingen die directe APNs-op-gateway niet kan bieden voor
officiële iOS-builds:

- Alleen echte OpenClaw iOS-builds die via Apple worden gedistribueerd, kunnen de gehoste relay gebruiken.
- Een gateway kan alleen relay-ondersteunde pushes sturen voor iOS-apparaten die met die specifieke
  gateway zijn gekoppeld.

Hop voor hop:

1. `iOS app -> gateway`
   - De app koppelt eerst met de gateway via de normale Gateway-auth-flow.
   - Dat geeft de app een geauthenticeerde nodesessie plus een geauthenticeerde operatorsessie.
   - De operatorsessie wordt gebruikt om `gateway.identity.get` aan te roepen.

2. `iOS app -> relay`
   - De app roept de relay-registratie-endpoints aan via HTTPS.
   - Registratie bevat App Attest-bewijs plus een StoreKit-apptransactie-JWS.
   - De relay valideert de bundel-ID, het App Attest-bewijs en het Apple-distributiebewijs, en vereist het
     officiële/productiedistributiepad.
   - Dit blokkeert lokale Xcode-/dev-builds om de gehoste relay te gebruiken. Een lokale build kan
     ondertekend zijn, maar voldoet niet aan het officiële Apple-distributiebewijs dat de relay verwacht.

3. `gateway identity delegation`
   - Vóór relay-registratie haalt de app de gekoppelde gateway-identiteit op via
     `gateway.identity.get`.
   - De app neemt die gateway-identiteit op in de relay-registratiepayload.
   - De relay retourneert een relay-handle en een verzendmachtiging die aan de registratie is gekoppeld en gedelegeerd is aan
     die gateway-identiteit.

4. `gateway -> relay`
   - De gateway slaat de relay-handle en verzendmachtiging uit `push.apns.register` op.
   - Bij `push.test`, reconnect-wakes en wekprikkels ondertekent de gateway het verzendverzoek met zijn
     eigen apparaatidentiteit.
   - De relay verifieert zowel de opgeslagen verzendmachtiging als de gateway-handtekening tegen de gedelegeerde
     gateway-identiteit uit de registratie.
   - Een andere gateway kan die opgeslagen registratie niet hergebruiken, zelfs niet als deze op een of andere manier de handle verkrijgt.

5. `relay -> APNs`
   - De relay bezit de productie-APNs-referenties en het raw APNs-token voor de officiële build.
   - De gateway slaat het raw APNs-token nooit op voor relay-ondersteunde officiële builds.
   - De relay stuurt de uiteindelijke push naar APNs namens de gekoppelde gateway.

Waarom dit ontwerp is gemaakt:

- Om productie-APNs-referenties uit gebruikersgateways te houden.
- Om te voorkomen dat raw APNs-tokens van officiële builds op de gateway worden opgeslagen.
- Om gehost relay-gebruik alleen toe te staan voor officiële/TestFlight OpenClaw-builds.
- Om te voorkomen dat één gateway wekpushes stuurt naar iOS-apparaten die bij een andere gateway horen.

Lokale/handmatige builds blijven directe APNs gebruiken. Als je die builds zonder de relay test, heeft de
gateway nog steeds directe APNs-referenties nodig:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Dit zijn runtime-env-vars voor de gateway-host, geen Fastlane-instellingen. `apps/ios/fastlane/.env` bewaart alleen
App Store Connect-/TestFlight-auth zoals `ASC_KEY_ID` en `ASC_ISSUER_ID`; het configureert geen
directe APNs-levering voor lokale iOS-builds.

Aanbevolen opslag op de gateway-host:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Commit het `.p8`-bestand niet en plaats het niet onder de repo-checkout.

## Discovery-paden

### Bonjour (LAN)

De iOS-app bladert door `_openclaw-gw._tcp` op `local.` en, wanneer geconfigureerd, hetzelfde
wide-area DNS-SD-discoverydomein. Gateways op hetzelfde LAN verschijnen automatisch vanuit `local.`;
cross-network discovery kan het geconfigureerde wide-area-domein gebruiken zonder het beacontype te wijzigen.

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
- De iOS-node navigeert automatisch naar A2UI bij verbinding wanneer een canvas-host-URL wordt geadverteerd.
- Keer terug naar het ingebouwde scaffold met `canvas.navigate` en `{"url":""}`.

## Relatie met Computer Use

De iOS-app is een mobiel node-oppervlak, geen Codex Computer Use-backend. Codex
Computer Use en `cua-driver mcp` besturen een lokaal macOS-bureaublad via MCP-
tools; de iOS-app biedt iPhone-mogelijkheden via OpenClaw-nodeopdrachten
zoals `canvas.*`, `camera.*`, `screen.*`, `location.*` en `talk.*`.

Agents kunnen de iOS-app nog steeds via OpenClaw bedienen door node-
opdrachten aan te roepen, maar die aanroepen lopen via het gateway-nodeprotocol en volgen de iOS-
voorgrond-/achtergrondlimieten. Gebruik [Codex Computer Use](/nl/plugins/codex-computer-use)
voor lokale bureaubladbesturing en deze pagina voor iOS-node-mogelijkheden.

### Canvas-eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Spraakwekfunctie + praatmodus

- Spraakwekfunctie en praatmodus zijn beschikbaar in Instellingen.
- iOS kan achtergrondaudio onderbreken; behandel spraakfuncties als best-effort wanneer de app niet actief is.

## Veelvoorkomende fouten

- `NODE_BACKGROUND_UNAVAILABLE`: breng de iOS-app naar de voorgrond (canvas-/camera-/schermopdrachten vereisen dit).
- `A2UI_HOST_NOT_CONFIGURED`: de Gateway heeft geen canvas-host-URL geadverteerd; controleer `canvasHost` in [Gateway-configuratie](/nl/gateway/configuration).
- Koppelingsprompt verschijnt nooit: voer `openclaw devices list` uit en keur handmatig goed.
- Reconnect mislukt na herinstallatie: het Keychain-koppelingstoken is gewist; koppel de node opnieuw.

## Gerelateerde documentatie

- [Koppeling](/nl/channels/pairing)
- [Discovery](/nl/gateway/discovery)
- [Bonjour](/nl/gateway/bonjour)
