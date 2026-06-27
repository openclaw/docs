---
read_when:
    - De iOS-node koppelen of opnieuw verbinden
    - De iOS-app uitvoeren vanuit de broncode
    - Debuggen van Gateway-detectie of canvas-opdrachten
summary: 'iOS-node-app: verbinding maken met de Gateway, koppelen, canvas en probleemoplossing'
title: iOS-app
x-i18n:
    generated_at: "2026-06-27T17:47:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1a93381fd2b95316e05a555bee45b9aed5572679b4b1f10f7f9e40c1a69faf17
    source_path: platforms/ios.md
    workflow: 16
---

Beschikbaarheid: iPhone-appbuilds worden via Apple-kanalen gedistribueerd wanneer dit voor een release is ingeschakeld. Lokale ontwikkelbuilds kunnen ook vanuit de broncode worden uitgevoerd.

## Wat het doet

- Verbindt met een Gateway via WebSocket (LAN of tailnet).
- Biedt node-mogelijkheden: Canvas, schermsnapshot, camera-opname, locatie, praatmodus, Voice wake.
- Ontvangt `node.invoke`-commando's en rapporteert nodestatusgebeurtenissen.

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

2. Open in de iOS-app Instellingen en kies een ontdekte Gateway (of schakel Handmatige host in en voer host/poort in).

3. Keur het koppelingsverzoek goed op de Gateway-host:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Als de app opnieuw probeert te koppelen met gewijzigde auth-gegevens (rol/scopes/publieke sleutel),
wordt het vorige openstaande verzoek vervangen en wordt er een nieuwe `requestId` gemaakt.
Voer vóór goedkeuring opnieuw `openclaw devices list` uit.

Optioneel: als de iOS-node altijd verbinding maakt vanuit een strikt beheerd subnet, kun je
je expliciet aanmelden voor automatische goedkeuring van nodes bij eerste gebruik met expliciete CIDR's of exacte IP's:

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

Dit is standaard uitgeschakeld. Het geldt alleen voor nieuwe `role: node`-koppeling zonder
aangevraagde scopes. Operator-/browserkoppeling en elke wijziging in rol, scope, metadata of
publieke sleutel vereisen nog steeds handmatige goedkeuring.

4. Controleer de verbinding:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Push via relay voor officiële builds

Officieel gedistribueerde iOS-builds gebruiken de externe pushrelay in plaats van het ruwe APNs-token
naar de Gateway te publiceren.

Officiële/TestFlight-builds uit de publieke App Store-releaselane gebruiken de gehoste relay op `https://ios-push-relay.openclaw.ai`.

Aangepaste relay-implementaties vereisen een bewust gescheiden iOS-build-/implementatiepad waarvan de relay-URL overeenkomt met de Gateway-relay-URL. De publieke App Store-releaselane accepteert geen aangepaste relay-URL-overschrijvingen. Als je een aangepaste relaybuild gebruikt, stel dan de overeenkomende Gateway-relay-URL in:

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
- De relay retourneert een ondoorzichtige relay-handle plus een registratiegebonden verzendtoekenning.
- De iOS-app haalt de gekoppelde Gateway-identiteit op en neemt die op in de relayregistratie, zodat de door relay ondersteunde registratie wordt gedelegeerd aan die specifieke Gateway.
- De app stuurt die door relay ondersteunde registratie door naar de gekoppelde Gateway met `push.apns.register`.
- De Gateway gebruikt die opgeslagen relay-handle voor `push.test`, achtergrond-wakes en wake nudges.
- Aangepaste Gateway-relay-URL's moeten overeenkomen met de relay-URL die in de iOS-build is ingebakken.
- Als de app later verbinding maakt met een andere Gateway of een build met een andere relaybasis-URL, vernieuwt deze de relayregistratie in plaats van de oude binding opnieuw te gebruiken.

Wat de Gateway voor dit pad **niet** nodig heeft:

- Geen implementatiebrede relay-token.
- Geen directe APNs-sleutel voor officiële/TestFlight-verzendingen via relay.

Verwachte operatorflow:

1. Installeer de officiële/TestFlight-iOS-build.
2. Optioneel: stel `gateway.push.apns.relay.baseUrl` op de Gateway alleen in wanneer je een bewust gescheiden aangepaste relaybuild gebruikt.
3. Koppel de app aan de Gateway en laat deze het verbinden afronden.
4. De app publiceert `push.apns.register` automatisch nadat deze een APNs-token heeft, de operatorsessie is verbonden en relayregistratie is geslaagd.
5. Daarna kunnen `push.test`, reconnect-wakes en wake nudges de opgeslagen door relay ondersteunde registratie gebruiken.

## Achtergrond-alive-beacons

Wanneer iOS de app wekt voor een stille push, achtergrondverversing of significant-location-gebeurtenis, probeert de app
kort opnieuw als node te verbinden en roept daarna `node.event` aan met `event: "node.presence.alive"`.
De Gateway registreert dit alleen als `lastSeenAtMs`/`lastSeenReason` in de gekoppelde node-/apparaatmetadata
nadat de geauthenticeerde node-apparaatidentiteit bekend is.

De app beschouwt een achtergrond-wake alleen als succesvol geregistreerd wanneer de Gateway-respons
`handled: true` bevat. Oudere Gateways kunnen `node.event` bevestigen met `{ "ok": true }`; die respons is
compatibel, maar telt niet als duurzame last-seen-update.

Compatibiliteitsopmerking:

- `OPENCLAW_APNS_RELAY_BASE_URL` werkt nog steeds als tijdelijke env-overschrijving voor de Gateway.
- De publieke App Store-releaselane weigert `OPENCLAW_PUSH_RELAY_BASE_URL` voor iOS-builds.

## Authenticatie- en vertrouwensflow

De relay bestaat om twee beperkingen af te dwingen die directe APNs-op-Gateway niet kan bieden voor
officiële iOS-builds:

- Alleen echte OpenClaw-iOS-builds die via Apple zijn gedistribueerd, kunnen de gehoste relay gebruiken.
- Een Gateway kan door relay ondersteunde pushes alleen verzenden voor iOS-apparaten die met die specifieke
  Gateway zijn gekoppeld.

Stap voor stap:

1. `iOS app -> gateway`
   - De app koppelt eerst met de Gateway via de normale Gateway-auth-flow.
   - Dat geeft de app een geauthenticeerde nodesessie plus een geauthenticeerde operatorsessie.
   - De operatorsessie wordt gebruikt om `gateway.identity.get` aan te roepen.

2. `iOS app -> relay`
   - De app roept de relayregistratie-eindpunten aan via HTTPS.
   - Registratie bevat App Attest-bewijs plus een StoreKit-apptransactie-JWS.
   - De relay valideert de bundle-ID, het App Attest-bewijs en het Apple-distributiebewijs, en vereist het
     officiële/productiedistributiepad.
   - Dit blokkeert lokale Xcode-/dev-builds van het gebruik van de gehoste relay. Een lokale build kan
     ondertekend zijn, maar voldoet niet aan het officiële Apple-distributiebewijs dat de relay verwacht.

3. `gateway identity delegation`
   - Vóór relayregistratie haalt de app de gekoppelde Gateway-identiteit op uit
     `gateway.identity.get`.
   - De app neemt die Gateway-identiteit op in de relayregistratiepayload.
   - De relay retourneert een relay-handle en een registratiegebonden verzendtoekenning die zijn gedelegeerd aan
     die Gateway-identiteit.

4. `gateway -> relay`
   - De Gateway slaat de relay-handle en verzendtoekenning uit `push.apns.register` op.
   - Bij `push.test`, reconnect-wakes en wake nudges ondertekent de Gateway het verzendverzoek met zijn
     eigen apparaatidentiteit.
   - De relay verifieert zowel de opgeslagen verzendtoekenning als de Gateway-handtekening tegen de gedelegeerde
     Gateway-identiteit uit de registratie.
   - Een andere Gateway kan die opgeslagen registratie niet hergebruiken, zelfs niet als deze op de een of andere manier de handle verkrijgt.

5. `relay -> APNs`
   - De relay bezit de productie-APNs-referenties en het ruwe APNs-token voor de officiële build.
   - De Gateway slaat nooit het ruwe APNs-token op voor door relay ondersteunde officiële builds.
   - De relay verzendt de uiteindelijke push naar APNs namens de gekoppelde Gateway.

Waarom dit ontwerp is gemaakt:

- Om productie-APNs-referenties uit gebruikers-Gateways te houden.
- Om te voorkomen dat ruwe APNs-tokens van officiële builds op de Gateway worden opgeslagen.
- Om gebruik van de gehoste relay alleen toe te staan voor officiële/TestFlight OpenClaw-builds.
- Om te voorkomen dat één Gateway wake-pushes verzendt naar iOS-apparaten die bij een andere Gateway horen.

Lokale/handmatige builds blijven directe APNs gebruiken. Als je die builds zonder relay test, heeft de
Gateway nog steeds directe APNs-referenties nodig:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Dit zijn runtime-env-vars voor de Gateway-host, geen Fastlane-instellingen. `apps/ios/fastlane/.env` slaat alleen
App Store Connect-/TestFlight-auth op, zoals `APP_STORE_CONNECT_KEY_ID` en
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

## Discovery-paden

### Bonjour (LAN)

De iOS-app browset `_openclaw-gw._tcp` op `local.` en, wanneer geconfigureerd, hetzelfde
wide-area DNS-SD-discoverydomein. Gateways op hetzelfde LAN verschijnen automatisch via `local.`;
discovery over netwerken heen kan het geconfigureerde wide-area-domein gebruiken zonder het beacontype te wijzigen.

### Tailnet (over netwerken heen)

Als mDNS is geblokkeerd, gebruik dan een unicast DNS-SD-zone (kies een domein; voorbeeld:
`openclaw.internal.`) en Tailscale split DNS.
Zie [Bonjour](/nl/gateway/bonjour) voor het CoreDNS-voorbeeld.

### Handmatige host/poort

Schakel in Instellingen **Handmatige host** in en voer de Gateway-host + poort in (standaard `18789`).

## Canvas + A2UI

De iOS-node rendert een WKWebView-canvas. Gebruik `node.invoke` om dit aan te sturen:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Opmerkingen:

- De Gateway-canvashost serveert `/__openclaw__/canvas/` en `/__openclaw__/a2ui/`.
- Deze wordt geserveerd vanaf de Gateway-HTTP-server (dezelfde poort als `gateway.port`, standaard `18789`).
- De iOS-node houdt de ingebouwde scaffold als de verbonden standaardweergave. `canvas.a2ui.push` en `canvas.a2ui.reset` gebruiken de gebundelde app-eigen A2UI-pagina.
- Externe Gateway-A2UI-pagina's zijn op iOS alleen voor rendering; native A2UI-knopacties worden alleen geaccepteerd vanaf gebundelde app-eigen pagina's.
- Keer terug naar de ingebouwde scaffold met `canvas.navigate` en `{"url":""}`.

## Relatie met Computer Use

De iOS-app is een mobiel node-oppervlak, geen Codex Computer Use-backend. Codex
Computer Use en `cua-driver mcp` besturen een lokale macOS-desktop via MCP-
tools; de iOS-app biedt iPhone-mogelijkheden via OpenClaw-nodecommando's
zoals `canvas.*`, `camera.*`, `screen.*`, `location.*` en `talk.*`.

Agents kunnen de iOS-app nog steeds via OpenClaw bedienen door nodecommando's
aan te roepen, maar die aanroepen lopen via het Gateway-nodeprotocol en volgen de iOS-
voorgrond-/achtergrondlimieten. Gebruik [Codex Computer Use](/nl/plugins/codex-computer-use)
voor lokale desktopbesturing en deze pagina voor iOS-node-mogelijkheden.

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Voice wake + praatmodus

- Voice wake en praatmodus zijn beschikbaar in Instellingen.
- iOS-nodes met praatmogelijkheden adverteren de `talk`-mogelijkheid en kunnen
  `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` en `talk.ptt.once` declareren;
  de Gateway staat die push-to-talk-commando's standaard toe voor vertrouwde
  nodes met praatmogelijkheden.
- iOS kan achtergrondaudio onderbreken; beschouw spraakfuncties als best-effort wanneer de app niet actief is.

## Veelvoorkomende fouten

- `NODE_BACKGROUND_UNAVAILABLE`: breng de iOS-app naar de voorgrond (canvas-/camera-/schermcommando's vereisen dit).
- `A2UI_HOST_UNAVAILABLE`: de gebundelde A2UI-pagina was niet bereikbaar in de app-WebView; houd de app op de voorgrond op het tabblad Scherm en probeer het opnieuw.
- Koppelingsprompt verschijnt nooit: voer `openclaw devices list` uit en keur handmatig goed.
- Opnieuw verbinden mislukt na herinstallatie: het Keychain-koppelingstoken is gewist; koppel de node opnieuw.

## Gerelateerde docs

- [Koppelen](/nl/channels/pairing)
- [Discovery](/nl/gateway/discovery)
- [Bonjour](/nl/gateway/bonjour)
