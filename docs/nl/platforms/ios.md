---
read_when:
    - De iOS-Node koppelen of opnieuw verbinden
    - De directe Apple Watch-Node inschakelen of problemen ermee oplossen
    - De iOS-app uitvoeren vanuit de broncode
    - Fouten opsporen in Gateway-detectie of canvas-opdrachten
summary: 'iOS-Node-app: verbinding maken met de Gateway, koppelen, canvas en probleemoplossing'
title: iOS-app
x-i18n:
    generated_at: "2026-07-16T16:06:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7db2f099602435837cc18fcd3e7670067d4b58b6cdb6f6502704a1565d1d1c61
    source_path: platforms/ios.md
    workflow: 16
---

Beschikbaarheid: iPhone-appbuilds worden via Apple-kanalen gedistribueerd wanneer dit voor een release is ingeschakeld. Lokale ontwikkelbuilds kunnen ook vanuit de broncode worden uitgevoerd.

## Wat het doet

- Maakt via WebSocket verbinding met een Gateway (LAN of tailnet).
- Stelt Node-mogelijkheden beschikbaar: Canvas, schermmomentopname, cameraopname, locatie, praatmodus, spraakactivering en optionele gezondheidssamenvattingen.
- Ontvangt `node.invoke`-opdrachten en rapporteert statusgebeurtenissen van de Node.
- Bladert alleen-lezen door de werkruimte van de geselecteerde agent via het Agents-oppervlak (Bestanden): door mappen navigeren, tekstvoorbeelden met syntaxismarkering, afbeeldingsvoorbeelden en export via het deelmenu. Geen schrijfbewerkingen; de Gateway beperkt de grootte van voorbeelden.
- Bewaart per gekoppelde Gateway een kleine, alleen-lezen offlinecache van recente chatsessies en transcripties: bij een koude start wordt de laatst bekende transcriptie onmiddellijk weergegeven en vernieuwd zodra de Gateway reageert, recente chats blijven doorzoekbaar wanneer de verbinding is verbroken en opnieuw instellen/vergeten wist de beveiligde lokale cache.
- Plaatst tekstberichten die zonder verbinding worden verzonden in een duurzame outbox per Gateway (maximaal 50): berichten in de wachtrij verschijnen in de transcriptie, worden bij opnieuw verbinden op volgorde verzonden met idempotente nieuwe pogingen, blijven bewaard totdat de canonieke geschiedenis de verzending bevestigt, worden met back-off opnieuw geprobeerd voordat een actie voor opnieuw proberen/verwijderen wordt weergegeven en verlopen in plaats van te worden verzonden na 48 uur offline; opnieuw instellen/vergeten wist de wachtrij samen met de cache.
- Spreekt assistentberichten op verzoek uit: houd een bericht in Chat lang ingedrukt en kies **Luisteren**. De app speelt ondersteunde Gateway-`tts.speak`-fragmenten af met de geconfigureerde TTS-provider en valt terug op spraak op het apparaat wanneer Gateway-audio niet beschikbaar of niet afspeelbaar is. Het afspelen stopt wanneer van sessie wordt gewisseld of de app naar de achtergrond gaat.

## Vereisten

- Gateway die op een ander apparaat draait (macOS, Linux of Windows via WSL2).
- Netwerkroute:
  - Hetzelfde LAN via Bonjour, **of**
  - Tailnet via unicast-DNS-SD (voorbeelddomein: `openclaw.internal.`), **of**
  - Handmatige host/poort (terugvaloptie).

## Snelstart (koppelen + verbinden)

Bij de eerste start doorloopt de app een korte uitleg over koppelen en een
machtigingenpagina (meldingen, camera, microfoon, foto's, contacten,
agenda, herinneringen, locatie). Elke toestemming is optioneel en kan later
worden gewijzigd via **Settings** -> **Permissions** of in de iOS-app Instellingen.

1. Start een geverifieerde Gateway met een route die je telefoon kan bereiken. Tailscale
   Serve is de aanbevolen externe route:

```bash
openclaw gateway --port 18789 --tailscale serve
```

Gebruik voor een vertrouwde configuratie op hetzelfde LAN in plaats daarvan een geverifieerde `gateway.bind: "lan"`.
De standaardbinding aan loopback is vanaf een telefoon niet bereikbaar. Als de
Gateway nog niet is geconfigureerd, voer dan eerst `openclaw onboard` uit, zodat het aanmaken van
een installatiecode een verificatieroute met token of wachtwoord heeft.

2. Open de [Control UI](/nl/web/control-ui), selecteer **Nodes** en klik op
   **Pair mobile device** op de pagina **Devices**. Volledige toegang wordt aanbevolen
   en is standaard geselecteerd; kies Limited access alleen wanneer je
   administratieve Gateway-besturingselementen wilt weglaten en klik vervolgens op **Create setup code**.

3. Open in de iOS-app **Settings** -> **Gateway**, scan de QR-code (of plak
   de installatiecode) en maak verbinding.

   Als de installatiecode zowel LAN- als Tailscale Serve-routes bevat, test de app
   deze op volgorde en slaat deze het eerste bereikbare eindpunt op.

4. De officiële app maakt automatisch verbinding. Als **Pending approval** een
   verzoek toont, controleer dan de rol en scopes voordat je het goedkeurt.

   **Settings → Gateway** toont of de opgeslagen operatorverbinding
   **Full**- of **Limited**-toegang heeft. Installatie via niet-versleutelde LAN-`ws://`
   wordt voor de veiligheid van bearer-tokens automatisch beperkt. Als de toegang beperkt is, configureer dan `wss://` of
   Tailscale Serve, scan een nieuwe code voor volledige toegang vanuit Control UI of `openclaw qr`
   en maak vervolgens opnieuw verbinding om instellingen en upgrades in te schakelen.

De knop in Control UI vereist een reeds gekoppelde sessie met `operator.admin`.
Kies als terminalterugvaloptie een gevonden Gateway in de iOS-app (of schakel
Manual Host in en voer host/poort in) en keur vervolgens het verzoek goed op de Gateway-host:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Als de app het koppelen opnieuw probeert met gewijzigde verificatiegegevens (rol/scopes/openbare sleutel), wordt het vorige wachtende verzoek vervangen en wordt een nieuwe `requestId` aangemaakt. Voer `openclaw devices list` opnieuw uit vóór goedkeuring.

Optioneel: als de iOS-Node altijd verbinding maakt vanuit een strikt beheerd subnet, kun je automatische goedkeuring bij de eerste Node-koppeling inschakelen met expliciete CIDR's of exacte IP-adressen:

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

Dit is standaard uitgeschakeld. Het is alleen van toepassing op een nieuwe `role: node`-koppeling zonder aangevraagde scopes. Koppeling van operator/browser en elke wijziging van rol, scope, metadata of openbare sleutel vereist nog steeds handmatige goedkeuring.

5. Controleer de verbinding:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## Gezondheidssamenvattingen

De iOS-Node kan een optioneel, alleen-lezen HealthKit-aggregaat voor de huidige
kalenderdag retourneren. Toestemming op de iPhone en expliciete autorisatie van Gateway-opdrachten zijn
onafhankelijke vereisten. Zie [HealthKit-samenvattingen](/platforms/ios-healthkit) voor
configuratie, aanroepen, payloadvelden, privacygedrag en probleemoplossing.

De Apple Watch-begeleidende app blijft standaard het bestaande iPhone-relais gebruiken en
heeft geen afzonderlijke Gateway-koppeling nodig. Koppel de Watch aan de iPhone in
de Watch-app van Apple, installeer OpenClaw via **Watch app -> My Watch -> Available
Apps** en open OpenClaw vervolgens eenmaal op beide apparaten.

## Goedkeuringen van opdrachten beoordelen

Een operatorverbinding met `operator.admin`, of een gekoppelde
`operator.approvals`-verbinding waarop de Gateway zich expliciet richt, kan wachtende
uitvoeringsverzoeken op de iPhone beoordelen. De goedkeuringskaart toont het door de Gateway
opgeschoonde opdrachtvoorbeeld, de waarschuwing, hostcontext, vervaltijd en alleen de
beslissingen die door dat verzoek worden aangeboden. De gekoppelde Apple Watch ontvangt dezelfde
voor beoordelaars veilige prompt via het bestaande iPhone-relais en biedt de compacte
subset met eenmalig toestaan/weigeren. De directe Gateway-modus van de Watch verzendt
geen goedkeuringsprompts.

De goedkeuringsstatus wordt gedeeld met Control UI en ondersteunde chatoppervlakken. Het
eerste vastgelegde antwoord wint. iPhone en Watch halen de canonieke
eindstatusrecord van de Gateway op nadat een ander oppervlak het verzoek heeft opgelost, na een externe
melding dat het is opgelost en telkens wanneer een bevestiging van de oplossing mogelijk
verloren is gegaan. Acties blijven niet beschikbaar totdat deze teruglezing bevestigt of het
verzoek nog wacht.

Het eigenaarschap van de goedkeuring is gebonden aan de geselecteerde Gateway. Door van Gateway te wisselen kan
een oude prompt niet op de vervangende verbinding worden toegepast. Gateways van vóór de
uniforme goedkeuringsmethoden vallen terug op de meegeleverde uitvoeringsspecifieke methoden;
bewaarde eindstatus en uitgebreidere resultaten over meerdere oppervlakken vereisen een bijgewerkte
Gateway.

## Optionele directe Apple Watch-Node

De directe modus geeft de Watch een eigen ondertekende Node-identiteit en Gateway-verbinding.
Ondersteunde Node-opdrachten blijven werken via wifi of mobiel netwerk van de Watch terwijl
OpenClaw actief is, zelfs wanneer de gekoppelde iPhone niet beschikbaar is.

Vereisten:

- De iPhone is met de Gateway verbonden met de scope `operator.admin`.
- De installatiecode kondigt een `wss://`-Gateway-eindpunt aan met een certificaat dat wordt vertrouwd
  door watchOS; de Watch pollt de bijbehorende `https://`-oorsprong. Niet-versleutelde HTTP en
  zelfondertekend vertrouwen of vertrouwen uitsluitend op basis van vingerafdrukken worden niet ondersteund. Zie [Door de Gateway beheerd
  koppelen](/nl/gateway/pairing) voor de eindpuntconfiguratie. Loopback-, alleen-iPhone-
  en alleen-tailnetroutes zijn niet zelfstandig bereikbaar voor de Watch.
- Gebruik via mobiel netwerk vereist een Apple Watch met mobiele ondersteuning en een actieve dienst.
- OpenClaw is actief op de Watch. Apple staat gewone watchOS-apps niet toe om
  algemene WebSocket-/TCP-verbindingen actief te houden, dus de directe Node gebruikt korte HTTPS-
  polls en maakt opnieuw verbinding wanneer de app terugkeert naar de voorgrond. Zie de
  [watchOS-richtlijnen voor netwerken op laag niveau](https://developer.apple.com/documentation/technotes/tn3135-low-level-networking-on-watchOS) van Apple.

Configuratie:

1. Open op de iPhone **Settings -> Apple Watch**.
2. Tik op **Enable Direct Gateway Connection**.
3. Open OpenClaw op de Watch voordat de kortlevende installatiecode verloopt.
4. Controleer de afzonderlijke Apple Watch-rij met `openclaw nodes status`.

De installatiecode bevat een kortlevende bootstrapreferentie die alleen voor de Node geldt; behandel deze
als een wachtwoord totdat deze verloopt. Deze bevat nooit het opgeslagen Gateway-
wachtwoord of token van de iPhone. Na het koppelen slaat de Watch zijn eigen apparaattoken op en
verwijdert deze de bootstrapreferentie. De directe modus omvat alleen de onderstaande opdrachten.
Chat, Talk, goedkeuringen en de bestaande `watch.*`-meldingsstroom blijven
functies van het iPhone-relais en vereisen nog steeds de gekoppelde iPhone.

Directe watchOS-Node-opdrachten:

| Oppervlak     | Opdrachten                     | Opmerkingen                                             |
| ------------- | ------------------------------ | ------------------------------------------------------- |
| Apparaat      | `device.info`, `device.status` | Watch-identiteit, batterij, temperatuur, opslag en netwerk. |
| Meldingen     | `system.notify`                | Terwijl de app actief is; vereist toestemming op de Watch. |

watchOS stelt WebKit niet beschikbaar aan apps van derden, waardoor de directe Watch-Node
geen Canvas-opdrachten aankondigt.

## Push via relais voor officiële builds

Officieel gedistribueerde iOS-builds gebruiken een extern pushrelais in plaats van het onbewerkte APNs-token aan de Gateway te publiceren. Officiële App Store-builds uit het openbare releasekanaal gebruiken het gehoste relais op `https://ios-push-relay.openclaw.ai`; deze basis-URL is vastgelegd voor distributie via de App Store en leest geen enkele overschrijving.

Aangepaste relaisimplementaties vereisen een bewust afzonderlijk iOS-build-/implementatiepad waarvan de relais-URL overeenkomt met de Gateway-relais-URL. Het App Store-releasekanaal accepteert nooit een aangepaste relais-URL. Als je een aangepaste relaisbuild gebruikt, stel dan de overeenkomende Gateway-relais-URL in:

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

- De iOS-app registreert zich bij het relais met App Attest en een StoreKit-apptransactie-JWS.
- Het relais retourneert een ondoorzichtige relaishandle plus een verzendmachtiging die aan de registratie is gebonden.
- De iOS-app haalt de identiteit van de gekoppelde Gateway op (`gateway.identity.get`) en neemt deze op in de relaisregistratie, zodat de door het relais ondersteunde registratie aan die specifieke Gateway wordt gedelegeerd.
- De app stuurt die door het relais ondersteunde registratie met `push.apns.register` door naar de gekoppelde Gateway.
- De Gateway gebruikt die opgeslagen relaishandle voor `push.test`, activeringen op de achtergrond en activeringssignalen.
- Als de app later verbinding maakt met een andere Gateway of een build met een andere basis-URL voor het relais, vernieuwt deze de relaisregistratie in plaats van de oude binding opnieuw te gebruiken.

Wat de Gateway voor dit pad **niet** nodig heeft: geen implementatiebreed relaistoken en geen directe APNs-sleutel voor officiële, door het App Store-relais ondersteunde verzendingen.

Verwachte operatorstroom:

1. Installeer de officiële iOS-app.
2. Optioneel: stel `gateway.push.apns.relay.baseUrl` alleen op de Gateway in wanneer je een bewust afzonderlijke aangepaste relaisbuild gebruikt.
3. Koppel de app aan de Gateway en laat deze de verbinding voltooien.
4. De app publiceert `push.apns.register` zodra deze een APNs-token heeft, de operatorsessie is verbonden en de relaisregistratie slaagt.
5. Daarna kunnen `push.test`, activeringen bij opnieuw verbinden en activeringssignalen de opgeslagen, door het relais ondersteunde registratie gebruiken.

## Bakens voor activiteit op de achtergrond

Wanneer iOS de app activeert voor een stille pushmelding, achtergrondverversing of belangrijke locatiewijziging, probeert de app kort opnieuw verbinding te maken met de Node en roept vervolgens `node.event` aan met `event: "node.presence.alive"`. De Gateway registreert dit pas als `lastSeenAtMs`/`lastSeenReason` in de metadata van de gekoppelde Node/het gekoppelde apparaat nadat de identiteit van het geauthenticeerde Node-apparaat bekend is.

De app beschouwt een activering op de achtergrond alleen als succesvol geregistreerd wanneer het antwoord van de Gateway `handled: true` bevat. Oudere Gateways kunnen `node.event` bevestigen met `{ "ok": true }`; dat antwoord is compatibel, maar geldt niet als een duurzame update van het tijdstip waarop het apparaat voor het laatst is gezien.

Compatibiliteitsopmerking:

- `OPENCLAW_APNS_RELAY_BASE_URL` werkt nog steeds als tijdelijke omgevingsoverschrijving voor de Gateway (`gateway.push.apns.relay.baseUrl` is het configuratie-eerst-pad).
- De pushmodus van de App Store-releasebuild legt de host van de gehoste relay vast in de code en leest nooit een overschrijving van de relay-URL — de omgevingsvariabele `OPENCLAW_PUSH_RELAY_BASE_URL` tijdens het bouwen is alleen van invloed op lokale/sandbox-iOS-buildmodi.

## Authenticatie- en vertrouwensstroom

De relay bestaat om twee beperkingen af te dwingen die rechtstreekse APNs op de Gateway niet kunnen bieden voor officiële iOS-builds:

- Alleen authentieke OpenClaw-iOS-builds die via Apple worden gedistribueerd, kunnen de gehoste relay gebruiken.
- Een Gateway kan alleen relay-ondersteunde pushmeldingen verzenden voor iOS-apparaten die met die specifieke Gateway zijn gekoppeld.

Stap voor stap:

1. `iOS app -> gateway`: de app wordt via de normale authenticatiestroom van de Gateway met de Gateway gekoppeld, waardoor de app een geauthenticeerde Node-sessie en een geauthenticeerde operatorsessie krijgt. De operatorsessie roept `gateway.identity.get` aan.
2. `iOS app -> relay`: de app roept via HTTPS de registratie-eindpunten van de relay aan met App Attest-bewijs en een StoreKit-apptransactie-JWS. De relay valideert de bundel-ID, het App Attest-bewijs en het Apple-distributiebewijs en vereist het officiële/productiedistributiepad — hierdoor kunnen lokale Xcode-/ontwikkelbuilds de gehoste relay niet gebruiken, omdat een lokale build niet aan het officiële Apple-distributiebewijs kan voldoen.
3. `gateway identity delegation`: vóór de relayregistratie haalt de app de identiteit van de gekoppelde Gateway op uit `gateway.identity.get` en neemt deze op in de registratiepayload voor de relay. De relay retourneert een relay-handle en een verzendmachtiging voor de registratie die aan die Gateway-identiteit is gedelegeerd.
4. `gateway -> relay`: de Gateway slaat de relay-handle en verzendmachtiging uit `push.apns.register` op. Bij `push.test`, activeringen voor opnieuw verbinden en activeringssignalen ondertekent de Gateway het verzendverzoek met zijn eigen apparaatidentiteit; de relay verifieert zowel de opgeslagen verzendmachtiging als de Gateway-handtekening aan de hand van de gedelegeerde Gateway-identiteit uit de registratie. Een andere Gateway kan die opgeslagen registratie niet hergebruiken, zelfs niet als deze op de een of andere manier de handle verkrijgt.
5. `relay -> APNs`: de relay beheert de productie-APNs-referenties en het onbewerkte APNs-token voor de officiële build. De Gateway slaat het onbewerkte APNs-token voor relay-ondersteunde officiële builds nooit op; de relay verzendt namens de gekoppelde Gateway de uiteindelijke pushmelding naar APNs.

Waarom dit ontwerp is gemaakt: om productie-APNs-referenties buiten Gateways van gebruikers te houden, te voorkomen dat onbewerkte APNs-tokens van officiële builds op de Gateway worden opgeslagen, gebruik van de gehoste relay alleen toe te staan voor officiële OpenClaw-iOS-builds en te voorkomen dat een Gateway activeringspushmeldingen verzendt naar iOS-apparaten die bij een andere Gateway horen.

Lokale/handmatige builds blijven rechtstreekse APNs gebruiken. Als je die builds zonder de relay test, heeft de Gateway nog steeds rechtstreekse APNs-referenties nodig:

```bash
export OPENCLAW_APNS_TEAM_ID="TEAMID"
export OPENCLAW_APNS_KEY_ID="KEYID"
export OPENCLAW_APNS_PRIVATE_KEY_P8="$(cat /path/to/AuthKey_KEYID.p8)"
```

Dit zijn runtime-omgevingsvariabelen van de Gateway-host, geen Fastlane-instellingen. `apps/ios/fastlane/.env` slaat alleen App Store Connect-authenticatie op, zoals `APP_STORE_CONNECT_KEY_ID` en `APP_STORE_CONNECT_ISSUER_ID`; hiermee wordt rechtstreekse APNs-bezorging voor lokale iOS-builds niet geconfigureerd.

Aanbevolen opslag op de Gateway-host, in overeenstemming met andere providerreferenties onder `~/.openclaw/credentials/`:

```bash
mkdir -p ~/.openclaw/credentials/apns
chmod 700 ~/.openclaw/credentials/apns
mv /path/to/AuthKey_KEYID.p8 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
chmod 600 ~/.openclaw/credentials/apns/AuthKey_KEYID.p8
export OPENCLAW_APNS_PRIVATE_KEY_PATH="$HOME/.openclaw/credentials/apns/AuthKey_KEYID.p8"
```

Commit het bestand `.p8` niet en plaats het niet in de uitgecheckte repo.

## Detectiepaden

### Bonjour (LAN)

De iOS-app zoekt naar `_openclaw-gw._tcp` op `local.` en, indien geconfigureerd, in hetzelfde wide-area DNS-SD-detectiedomein. Gateways op hetzelfde LAN verschijnen automatisch via `local.`; detectie tussen netwerken kan het geconfigureerde wide-area-domein gebruiken zonder het bakentype te wijzigen.

### Tailnet (tussen netwerken)

Als mDNS wordt geblokkeerd, gebruik je een unicast DNS-SD-zone (kies een domein; bijvoorbeeld: `openclaw.internal.`) en gesplitste DNS van Tailscale. Zie [Bonjour](/nl/gateway/bonjour) voor het CoreDNS-voorbeeld.

### Handmatige host/poort

Schakel in Settings **Manual Host** in en voer de host en poort van de Gateway in (standaard `18789`).

## Meerdere Gateways

De app houdt een register bij van elke Gateway waarmee deze is gekoppeld, zodat je ertussen kunt wisselen zonder opnieuw te koppelen:

- **Settings -> Gateway** toont een lijst **Paired Gateways** waarin de actieve Gateway is gemarkeerd. Tik op een vermelding om te wisselen; de app beëindigt de huidige sessies en maakt opnieuw verbinding met de geselecteerde Gateway. Naast de verbindingsrij verschijnt een snelwisselmenu wanneer meer dan één Gateway is gekoppeld.
- Referenties, beslissingen over TLS-vertrouwen, voorkeuren per Gateway en gecachte chatgeschiedenis worden per Gateway opgeslagen. Bij het wisselen wordt de status van verschillende Gateways nooit vermengd en de pushregistratie volgt de actieve Gateway.
- Veeg over een gekoppelde Gateway (of gebruik het contextmenu) om deze te **Forget**, waardoor de referenties, apparaattokens, TLS-pin en gecachte chats ervan worden verwijderd.
- Gedetecteerde Gateways moeten zichtbaar zijn op het netwerk om ernaar te kunnen wisselen; handmatige Gateways maken opnieuw verbinding via de opgeslagen host en poort.

## Canvas + A2UI

De iOS-Node geeft een WKWebView-canvas weer. Gebruik `node.invoke` om deze aan te sturen:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

Opmerkingen:

- De canvashost van de Gateway biedt `/__openclaw__/canvas/` en `/__openclaw__/a2ui/` aan vanaf de HTTP-server van de Gateway (dezelfde poort als `gateway.port`, standaard `18789`).
- De iOS-Node behoudt de ingebouwde basisstructuur als standaardweergave wanneer deze is verbonden. `canvas.a2ui.push` en `canvas.a2ui.reset` gebruiken de gebundelde A2UI-pagina die eigendom is van de app.
- Externe A2UI-pagina's van de Gateway zijn op iOS alleen bedoeld voor weergave; systeemeigen A2UI-knopacties worden alleen geaccepteerd vanaf gebundelde pagina's die eigendom zijn van de app.
- Keer terug naar de ingebouwde basisstructuur met `canvas.navigate` en `{"url":""}`.

## Relatie met Computer Use

De iOS-app is een mobiel Node-oppervlak, geen backend voor Codex Computer Use. Codex Computer Use en `cua-driver mcp` besturen een lokaal macOS-bureaublad via MCP-tools; de iOS-app stelt iPhone-mogelijkheden beschikbaar via OpenClaw-Node-opdrachten zoals `canvas.*`, `camera.*`, `screen.*`, `location.*` en `talk.*`.

Agents kunnen de iOS-app nog steeds via OpenClaw bedienen door Node-opdrachten aan te roepen, maar die aanroepen verlopen via het Gateway-Node-protocol en zijn onderhevig aan de iOS-beperkingen voor voorgrond en achtergrond. Gebruik [Codex Computer Use](/nl/plugins/codex-computer-use) voor lokale bureaubladbediening en deze pagina voor de mogelijkheden van de iOS-Node.

### Canvas-evaluatie/momentopname

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle=\"#ff2d55\"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return \"ok\"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## Spraakactivering + gespreksmodus

- Spraakactivering en gespreksmodus zijn beschikbaar in Settings.
- OpenAI realtime Talk gebruikt WebRTC dat door de client wordt beheerd wanneer `talk.realtime.transport` gelijk is aan `webrtc`; een expliciete `gateway-relay`-configuratie blijft door de Gateway beheerd. Zie [Gespreksmodus](/nl/nodes/talk).
- iOS-Nodes die Talk ondersteunen, maken de mogelijkheid `talk` bekend en kunnen `talk.ptt.start`, `talk.ptt.stop`, `talk.ptt.cancel` en `talk.ptt.once` declareren; de Gateway staat deze push-to-talk-opdrachten standaard toe voor vertrouwde Nodes die Talk ondersteunen.
- iOS kan achtergrondaudio onderbreken; beschouw spraakfuncties als een functie op basis van beschikbaarheid wanneer de app niet actief is.

## Veelvoorkomende fouten

- `NODE_BACKGROUND_UNAVAILABLE`: breng de iOS-app naar de voorgrond (opdrachten voor canvas/camera/scherm vereisen dit).
- `A2UI_HOST_UNAVAILABLE`: de gebundelde A2UI-pagina was niet bereikbaar in de WebView van de app; houd de app op de voorgrond op het tabblad Screen en probeer het opnieuw.
- Koppelingsprompt verschijnt nooit: voer `openclaw devices list` uit en keur deze handmatig goed.
- Watch toont geen iPhone-status: controleer of de iPhone `watchPaired: true`
  en `watchAppInstalled: true` meldt in `watch.status`. Als de koppeling onwaar is, koppel je de
  Watch in Apple's Watch-app. Als de installatie onwaar is, installeer je de bijbehorende app
  via **My Watch -> Available Apps**. Open na een van beide wijzigingen OpenClaw eenmaal op de
  Watch; voor onmiddellijke bereikbaarheid moeten beide apps nog steeds actief zijn,
  terwijl updates in de wachtrij later op de achtergrond kunnen aankomen.
- Opnieuw verbinden mislukt na herinstallatie: het Keychain-koppelingstoken is gewist; koppel de Node opnieuw.

## Gerelateerde documentatie

- [Koppelen](/nl/channels/pairing)
- [Detectie](/nl/gateway/discovery)
- [Bonjour](/nl/gateway/bonjour)
