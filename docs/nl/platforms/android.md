---
read_when:
    - De Android-Node koppelen of opnieuw verbinden
    - Problemen met Android Gateway-detectie of -authenticatie oplossen
    - Een Android-apparaat spiegelen of bedienen vanaf een Mac op afstand
    - Pariteit van de chatgeschiedenis tussen clients verifiëren
summary: 'Android-app (node): draaiboek voor verbinding + opdrachtoppervlak voor Verbinden/Chat/Spraak/Canvas'
title: Android-app
x-i18n:
    generated_at: "2026-07-16T16:03:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8ac11a1d0eb0c601048843ec80c9c76a4ebf76f2c80680ae2a43cb84fc6ec263
    source_path: platforms/android.md
    workflow: 16
---

<Note>
De officiële Android-app is beschikbaar op [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) en als ondertekende zelfstandige APK in ondersteunde [GitHub-releases](https://github.com/openclaw/openclaw/releases). Het is een begeleidende Node en vereist een actieve OpenClaw Gateway. Bron: [apps/android](https://github.com/openclaw/openclaw/tree/main/apps/android) ([bouwinstructies](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)).
</Note>

## Ondersteuningsoverzicht

- Rol: begeleidende Node-app (Android host de Gateway niet).
- Gateway vereist: ja (voer deze uit op macOS, Linux of Windows via WSL2).
- Installatie: [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) of `OpenClaw-Android.apk` uit een ondersteunde [GitHub-release](https://github.com/openclaw/openclaw/releases), [Aan de slag](/nl/start/getting-started) voor de Gateway en vervolgens [Koppelen](/nl/channels/pairing).
- Gateway: [Draaiboek](/nl/gateway) + [Configuratie](/nl/gateway/configuration).
  - Protocollen: [Gateway-protocol](/nl/gateway/protocol) (Nodes + besturingslaag).

Systeembesturing (launchd/systemd) bevindt zich op de Gateway-host — zie [Gateway](/nl/gateway).

## Buiten Google Play installeren

Reguliere definitieve en correctie-GitHub-releases bevatten een universele `OpenClaw-Android.apk` en `OpenClaw-Android-SHA256SUMS.txt`. De APK wordt gebouwd op basis van de releasetag, ondertekend met de OpenClaw Android-releasesleutel en bevat GitHub Actions-herkomstinformatie.

Kies een [release](https://github.com/openclaw/openclaw/releases) waarin beide assets worden vermeld en download en verifieer vervolgens exact die tag voordat je de APK sideloadt:

```bash
release_tag=vYYYY.M.PATCH
gh release download "$release_tag" \
  --repo openclaw/openclaw \
  --pattern OpenClaw-Android.apk \
  --pattern OpenClaw-Android-SHA256SUMS.txt
sha256sum --check OpenClaw-Android-SHA256SUMS.txt
gh attestation verify OpenClaw-Android.apk \
  --repo openclaw/openclaw \
  --signer-workflow openclaw/openclaw/.github/workflows/android-release.yml \
  --source-ref "refs/tags/${release_tag}" \
  --deny-self-hosted-runners
```

<Warning>
Installaties via Google Play en een zelfstandige APK gebruiken verschillende updatekanalen en kunnen verschillende ondertekeningsidentiteiten hebben. Android kan vereisen dat de bestaande app wordt verwijderd voordat je van kanaal wisselt, waardoor de lokale appgegevens worden verwijderd. Blijf voor normale updates bij één kanaal.
</Warning>

## Android vanaf een externe Mac spiegelen en besturen

[scrcpy](https://github.com/Genymobile/scrcpy) spiegelt een Android-scherm in een macOS-venster en
stuurt toetsenbord- en aanwijzerinvoer door via Android Debug Bridge (ADB). Dit is een workflow aan
de kant van de beheerder, los van de OpenClaw-Node-verbinding. Dit is handig wanneer het Android-apparaat
en de Mac zich op verschillende locaties bevinden, maar een privé-Tailscale-netwerk delen.

### Voordat je begint

- Installeer Tailscale op het Android-apparaat en de Mac en verbind beide met hetzelfde tailnet.
- Schakel op Android **Developer options** en **USB debugging** in. In Android 16 staat **Wireless
  debugging** onder **Settings > System > Developer options**. Zie [Ontwikkelaarsopties voor
  Android](https://developer.android.com/studio/debug/dev-options).
- Installeer scrcpy en ADB op de Mac:

  ```bash
  brew install scrcpy
  brew install --cask android-platform-tools
  ```

- Houd het Android-apparaat beschikbaar voor de eerste verbinding. Android moet de ADB-sleutel
  van elke Mac goedkeuren voordat die Mac het apparaat kan besturen.

### ADB via TCP inschakelen

Sluit voor de eerste configuratie het Android-apparaat via USB aan op een vertrouwde computer en keur
de foutopsporingsprompt goed. Voer vervolgens het volgende uit:

```bash
adb devices
adb tcpip 5555
```

Je kunt USB nu loskoppelen. Als poort 5555 niet meer luistert nadat het apparaat opnieuw is opgestart of foutopsporing opnieuw is ingesteld,
herhaal je deze lokale configuratiestap. Android 11 en nieuwer kunnen het initiële vertrouwen ook tot stand brengen met
**Wireless debugging > Pair device with pairing code** en `adb pair`.

### Alleen de besturende Mac toestaan

Tailnets met beperkende toekenningen moeten de besturende Mac expliciet toestaan TCP-poort 5555
op het Android-apparaat te bereiken. Voeg een beperkte regel toe aan het tailnetbeleid en vervang de voorbeeldadressen
door de stabiele Tailscale-IP-adressen van de twee apparaten:

```json5
{
  grants: [
    {
      src: ["<remote-mac-tailnet-ip>"],
      dst: ["<android-tailnet-ip>"],
      ip: ["tcp:5555"],
    },
  ],
}
```

Zie [Tailscale-toekenningen](https://tailscale.com/docs/reference/syntax/grants) voor hostaliassen en andere
selectoren. Sta deze poort niet toe vanaf het openbare internet en stel deze niet beschikbaar via Funnel: een geautoriseerde ADB-
client heeft verregaande controle over het apparaat.

### Verbinden en spiegelen starten

Op de externe Mac:

```bash
adb connect <android-tailnet-ip>:5555
adb devices
scrcpy --serial <android-tailnet-ip>:5555
```

De eerste `adb connect` vanaf deze Mac toont een autorisatiedialoogvenster op Android. Ontgrendel het apparaat,
bevestig de sleutelvingerafdruk en selecteer **Always allow from this computer** alleen als de Mac
vertrouwd is. Een geslaagde `adb devices`-vermelding eindigt op `device`; `unauthorized` betekent dat de prompt op het apparaat
niet is goedgekeurd.

Zodra het scrcpy-venster wordt geopend, gebruik je het rechtstreeks of richt je er een macOS-tool voor schermautomatisering op,
zoals [Peekaboo](https://peekaboo.sh/). scrcpy transporteert het beeld en de invoer; Tailscale levert alleen het
privénetwerkpad.

### Problemen oplossen

- `Connection timed out`: controleer de tailnettoekenning voor TCP 5555. Een geslaagde `tailscale ping` bewijst
  dat de peer bereikbaar is, niet dat het beleid deze TCP-poort toestaat. Test vanaf de Mac met
  `nc -vz <android-tailnet-ip> 5555`.
- `unauthorized`: ontgrendel Android en keur de ADB-sleutel van de externe Mac goed, of verwijder het verouderde werkstation
  onder **Wireless debugging > Paired devices** en koppel het opnieuw.
- `Connection refused`: maak lokaal opnieuw verbinding en voer `adb tcpip 5555` opnieuw uit.
- Meer dan één apparaat vermeld: behoud het expliciete argument `--serial <android-tailnet-ip>:5555`.

Sluit scrcpy wanneer je klaar bent en verbreek de ADB-verbinding:

```bash
adb disconnect <android-tailnet-ip>:5555
```

## Verbindingsdraaiboek

Android-Node-app ⇄ (mDNS/NSD + WebSocket) ⇄ **Gateway**

Android maakt rechtstreeks verbinding met de Gateway-WebSocket en gebruikt apparaatkoppeling (`role: node`).

Voor Tailscale- of openbare hosts vereist Android een beveiligd eindpunt:

- Voorkeur: Tailscale Serve / Funnel met `https://<magicdns>` / `wss://<magicdns>`
- Ook ondersteund: elke andere `wss://`-Gateway-URL met een echt TLS-eindpunt
- Onversleutelde `ws://` blijft ondersteund op privé-LAN-adressen / `.local`-hosts, plus `localhost`, `127.0.0.1` en de Android-emulatorbridge (`10.0.2.2`); configuratie buiten de loopback gebruikt automatisch beperkte beheerderstoegang

### Vereisten

- Gateway actief op een andere machine (of bereikbaar via SSH).
- Het Android-apparaat/de emulator kan de Gateway-WebSocket bereiken:
  - Hetzelfde LAN met mDNS/NSD, **of**
  - Hetzelfde Tailscale-tailnet met Wide-Area Bonjour / unicast DNS-SD (zie hieronder), **of**
  - Handmatige Gateway-host/-poort (terugvaloptie)
- Koppelen via een mobiel tailnet/openbaar netwerk gebruikt **geen** onbewerkte tailnet-IP-`ws://`-eindpunten. Gebruik in plaats daarvan Tailscale Serve of een andere `wss://`-URL.
- De CLI `openclaw` is beschikbaar op de Gateway-machine (of via SSH) om koppelingsverzoeken goed te keuren.

### 1. Start de Gateway

```bash
openclaw gateway --port 18789 --verbose
```

Controleer of je in de logboeken iets ziet als:

- `listening on ws://0.0.0.0:18789`

Geef voor externe Android-toegang via Tailscale de voorkeur aan Serve/Funnel boven een rechtstreekse tailnetbinding:

```bash
openclaw gateway --tailscale serve
```

Hiermee krijgt Android een beveiligd `wss://`- / `https://`-eindpunt. Een gewone `gateway.bind: "tailnet"`-configuratie is niet voldoende om Android voor het eerst extern te koppelen, tenzij je TLS ook afzonderlijk beëindigt.

### 2. Detectie verifiëren (optioneel)

Vanaf de Gateway-machine:

```bash
dns-sd -B _openclaw-gw._tcp local.
```

Meer opmerkingen over foutopsporing: [Bonjour](/nl/gateway/bonjour).

Als je ook een Wide-Area-detectiedomein hebt geconfigureerd, vergelijk je dit met:

```bash
openclaw gateway discover --json
```

Dit toont `local.` plus het geconfigureerde Wide-Area-domein in één doorgang, waarbij het opgeloste service-eindpunt wordt gebruikt in plaats van uitsluitend TXT-hints.

#### Netwerkoverschrijdende detectie via unicast DNS-SD

Android NSD/mDNS-detectie werkt niet tussen netwerken. Als de Android-Node en de Gateway zich op verschillende netwerken bevinden maar via Tailscale zijn verbonden, gebruik je in plaats daarvan Wide-Area Bonjour / unicast DNS-SD. Alleen detectie is niet voldoende voor het koppelen van Android via een tailnet/openbaar netwerk — de gedetecteerde route heeft nog steeds een beveiligd eindpunt nodig (`wss://` of Tailscale Serve):

1. Stel een DNS-SD-zone in (bijvoorbeeld `openclaw.internal.`) op de Gateway-host en publiceer `_openclaw-gw._tcp`-records.
2. Configureer gesplitste DNS van Tailscale voor het gekozen domein en laat dit naar die DNS-server verwijzen.

Details en een voorbeeldconfiguratie voor CoreDNS: [Bonjour](/nl/gateway/bonjour).

### 3. Verbinding maken vanuit Android

In de Android-app:

- De app houdt de Gateway-verbinding actief via een **foreground service** (permanente melding).
- Open het tabblad **Connect**.
- Gebruik de modus **Setup Code** of **Manual**.
- Als detectie wordt geblokkeerd, gebruik je de handmatige host/poort in **Advanced controls**. Voor privé-LAN-hosts werkt `ws://` nog steeds. Schakel voor Tailscale-/openbare hosts TLS in en gebruik een `wss://`- / Tailscale Serve-eindpunt.

Na de eerste geslaagde koppeling maakt Android bij het starten automatisch opnieuw verbinding met de actieve gekoppelde Gateway (naar beste vermogen voor gedetecteerde Gateways, die zichtbaar moeten zijn op het netwerk).

Officiële configuratiecodes verbinden Android als een Node en verlenen standaard volledige
Gateway-beheerderstoegang via `wss://`. Onversleutelde `ws://`-configuratie
buiten de loopback gebruikt automatisch beperkte toegang voor de veiligheid van bearer-tokens. **Settings → Gateway**
toont **Full** of **Limited** access. Configureer voor een beperkte verbinding
`wss://` of Tailscale Serve, genereer een nieuwe code voor volledige toegang in de Control UI of
met `openclaw qr`, scan of plak deze vervolgens op die pagina en maak opnieuw verbinding. Beheerders
die het beperkte profiel willen, kunnen **Limited access** selecteren in de Control UI of
`openclaw qr --limited` uitvoeren.

### Meerdere Gateways

De app houdt een register bij van elke Gateway waarmee deze is gekoppeld, zodat je ertussen kunt wisselen zonder opnieuw te koppelen:

- **Settings -> Gateways** vermeldt gekoppelde Gateways en markeert de actieve. Tik op een vermelding om te wisselen; de app beëindigt de huidige sessies en maakt opnieuw verbinding met de geselecteerde Gateway.
- Het tabblad **Connect** toont een snelle wisselaar wanneer meer dan één Gateway is gekoppeld.
- Inloggegevens, apparaattokens, TLS-vertrouwen, chatgeschiedenis en offline in de wachtrij geplaatste berichten worden per Gateway opgeslagen. Bij het wisselen wordt de status van Gateways nooit vermengd en berichten die offline in de wachtrij zijn geplaatst, worden alleen afgeleverd bij de Gateway waarvoor ze zijn geschreven.
- **Forget** verwijdert de registervermelding van een Gateway, samen met de inloggegevens, apparaattokens, TLS-pin en gecachte chats.

### Beacons voor actieve aanwezigheid

Nadat de geauthenticeerde Node-sessie verbinding heeft gemaakt, en wanneer de app naar de achtergrond gaat terwijl de foreground service nog verbonden is, roept Android `node.event` aan met `event: "node.presence.alive"`. De Gateway registreert dit als `lastSeenAtMs`/`lastSeenReason` in de metadata van alleen de gekoppelde Node/het gekoppelde apparaat nadat de identiteit van het geauthenticeerde Node-apparaat bekend is.

De app beschouwt de beacon alleen als geslaagd geregistreerd wanneer het Gateway-antwoord `handled: true` bevat. Oudere Gateways kunnen `node.event` bevestigen met `{ "ok": true }`; dat antwoord is compatibel, maar telt niet als een duurzame update van het tijdstip waarop het apparaat voor het laatst is gezien.

### 4. Koppeling goedkeuren (CLI)

Op de Gateway-machine:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Details over koppelen: [Koppelen](/nl/channels/pairing).

Optioneel: als de Android-Node altijd verbinding maakt vanaf een streng gecontroleerd subnet, kun je automatische goedkeuring bij de eerste koppeling van de Node inschakelen met expliciete CIDR's of exacte IP-adressen:

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

Dit is standaard uitgeschakeld. Het geldt alleen voor een nieuwe `role: node`-koppeling zonder aangevraagde scopes. Voor het koppelen van een operator/browser en elke wijziging van rol, scope, metadata of openbare sleutel blijft handmatige goedkeuring vereist.

### 5. Controleren of de Node verbonden is

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

### 6. Chat en geschiedenis

Het tabblad Chat van Android ondersteunt sessieselectie (standaard `main`, plus andere bestaande sessies):

- Geschiedenis: `chat.history` (genormaliseerd voor weergave — inline directivetags, XML-payloads van toolaanroepen in platte tekst (`<tool_call>`, `<function_call>`, `<tool_calls>`, `<function_calls>` en ingekorte varianten) en gelekte ASCII-/volledige-breedtebesturingstokens van het model worden verwijderd; assistentrijen met stille tokens, zoals exact `NO_REPLY` / `no_reply`, worden weggelaten; te grote rijen kunnen door tijdelijke aanduidingen worden vervangen)
- Verzenden: `chat.send`
- Duurzaam verzenden: elke verzending (tekst, gekozen afbeeldingen en spraaknotities) wordt vóór elke netwerkpoging vastgelegd in een uitgaand logboek op het apparaat per Gateway, zodat ingezonden invoer niet verloren kan gaan als de app wordt beëindigd. Verzendingen die offline in de wachtrij zijn geplaatst, worden bij het opnieuw verbinden op volgorde afgeleverd met stabiele idempotentiesleutels. Een verzending wordt pas verwijderd wanneer de beurt zichtbaar is in de canonieke `chat.history`; alleen een ontvangstbevestiging geldt niet als bewijs van aflevering. Onduidelijke uitkomsten (verloren ontvangstbevestiging, app beëindigd tijdens het verzenden, herstart van de Gateway voordat het transcript is geschreven) worden weergegeven als zichtbare rijen met expliciete opties **Opnieuw proberen**/**Verwijderen**, in plaats van automatisch opnieuw te verzenden. Slash-opdrachten worden na opnieuw verbinden nooit automatisch herhaald; ze wachten op een expliciete nieuwe poging. De wachtrij is begrensd (50 berichten en 48 MB aan bijlagebytes per Gateway) en niet-verzonden rijen verlopen na 48 uur. Concepten in het opstelveld die nooit zijn ingezonden, blijven niet behouden wanneer het proces eindigt.
- Push-updates (naar beste vermogen): `chat.subscribe` -> `event:"chat"`
- Beluisteren: houd een assistentbericht ingedrukt en kies **Beluisteren** om het te horen; audio wordt via Gateway-`tts.speak` gegenereerd met de geconfigureerde keten van TTS-providers. TTS van het apparaatsysteem wordt gebruikt wanneer de Gateway geen audio kan genereren. Het afspelen stopt bij een sessiewissel, een nieuwe chat, wanneer de app naar de achtergrond gaat of wanneer de chat wordt gesloten.

### 7. Canvas en camera

#### Gateway Canvas Host (aanbevolen voor webinhoud)

Als je wilt dat de Node echte HTML/CSS/JS weergeeft die de agent op schijf kan bewerken, laat je de Node naar de Canvas-host van de Gateway verwijzen.

<Note>
Nodes laden het Canvas vanaf de HTTP-server van de Gateway (dezelfde poort als `gateway.port`, standaard `18789`).
</Note>

1. Maak `~/.openclaw/workspace/canvas/index.html` op de Gateway-host.
2. Navigeer de Node ernaartoe (LAN):

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet (optioneel): als beide apparaten Tailscale gebruiken, gebruik je een MagicDNS-naam of tailnet-IP in plaats van `.local`, bijvoorbeeld `http://<gateway-magicdns>:18789/__openclaw__/canvas/`.

Deze server injecteert een client voor live herladen in HTML en herlaadt bij bestandswijzigingen. De Gateway biedt ook `/__openclaw__/a2ui/` aan, maar de Android-app behandelt externe A2UI-pagina's als alleen-weergeven. A2UI-opdrachten met acties gebruiken de gebundelde A2UI-pagina die eigendom is van de app.

Canvas-opdrachten (alleen op de voorgrond):

- `canvas.eval`, `canvas.snapshot`, `canvas.navigate` (gebruik `{"url":""}` of `{"url":"/"}` om terug te keren naar de standaardbasis). `canvas.snapshot` retourneert `{ format, base64 }` (standaard `format="jpeg"`).
- A2UI: `canvas.a2ui.push`, `canvas.a2ui.reset` (`canvas.a2ui.pushJSONL` verouderde alias). Deze gebruiken de gebundelde A2UI-pagina die eigendom is van de app voor weergave met acties.

Cameraopdrachten (alleen op de voorgrond; afhankelijk van toestemming): `camera.snap` (jpg), `camera.clip` (mp4). Zie [Camera-Node](/nl/nodes/camera) voor parameters en CLI-hulpprogramma's.

### 8. Spraak en uitgebreid Android-opdrachtoppervlak

- Tabblad Spraak: Android heeft twee expliciete opnamemodi. **Microfoon** is een handmatige sessie op het tabblad Spraak die elke pauze als chatbeurt verzendt en stopt wanneer de app de voorgrond verlaat of de gebruiker het tabblad Spraak verlaat. **Praten** is de doorlopende Praatmodus en blijft luisteren totdat deze wordt uitgeschakeld of de Node de verbinding verbreekt.
- De Praatmodus promoveert de bestaande voorgrondservice van `connectedDevice` naar `connectedDevice|microphone` voordat de opname begint en degradeert deze weer wanneer de Praatmodus stopt. De Node-service declareert `FOREGROUND_SERVICE_CONNECTED_DEVICE` met `CHANGE_NETWORK_STATE`; Android 14+ vereist daarnaast de declaratie `FOREGROUND_SERVICE_MICROPHONE`, de runtimetoekenning `RECORD_AUDIO` en het microfoonservicetype tijdens runtime.
- Android Praten gebruikt standaard native spraakherkenning, Gateway-chat en `talk.speak` via de geconfigureerde Praatprovider van de Gateway. Lokale systeem-TTS wordt alleen gebruikt wanneer `talk.speak` niet beschikbaar is.
- Android Praten gebruikt alleen realtime Gateway-relay wanneer `talk.realtime.mode` `realtime` is en `talk.realtime.transport` `gateway-relay` is.
- Android adverteert de mogelijkheid `voiceWake` niet. Gebruik **Microfoon** of **Praten** voor spraakinvoer.
- Aanvullende Android-opdrachtfamilies (beschikbaarheid is afhankelijk van apparaat, toestemmingen en gebruikersinstellingen):
  - `device.status`, `device.info`, `device.permissions`, `device.health`
  - `device.apps` alleen wanneer **Settings > Phone Capabilities > Installed Apps** is ingeschakeld; standaard worden apps weergegeven die in het startprogramma zichtbaar zijn (geef `includeNonLaunchable` door voor de volledige lijst).
  - `notifications.list`, `notifications.actions` (zie [Meldingen doorsturen](#notification-forwarding) hieronder)
  - `photos.latest`
  - `contacts.search`, `contacts.add`
  - `calendar.events`, `calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`, `motion.pedometer`

### 9. Werkruimtebestanden (alleen-lezen)

Het Home-overzicht bevat een kaart **Bestanden** waarmee via de alleen-lezen Gateway-RPC's `agents.workspace.list` / `agents.workspace.get` door de werkruimte van de actieve agent kan worden gebladerd: navigeren door mappen, voorbeelden van tekst en afbeeldingen en exporteren via het Android-deelvenster. Er zijn geen schrijfbewerkingen en de grootte van voorbeelden wordt door de Gateway begrensd.

## Goedkeuringen van opdrachten beoordelen

Een operatorverbinding met `operator.admin`, of een gekoppelde
`operator.approvals`-verbinding waarop de Gateway expliciet is gericht, kan
openstaande uitvoeringsverzoeken beoordelen onder **Settings -> Approvals**. De app laadt de
opgeschoonde goedkeuringsregistratie van de Gateway voordat de knoppen worden ingeschakeld, toont eventuele
beveiligingswaarschuwingen en de exacte beslissingen die het verzoek aanbiedt, en stuurt
de goedkeurings-ID en het eigenaartype terug naar de Gateway.

De goedkeuringsstatus wordt gedeeld met de Control UI en ondersteunde chatoppervlakken. Het
eerste vastgelegde antwoord wint; Android toont dat canonieke resultaat, zelfs wanneer
een ander oppervlak als eerste antwoordde. Als een antwoord op het oplossen verloren gaat of de Gateway
de verbinding verbreekt, houdt de app de actie vergrendeld en leest deze de goedkeuring opnieuw
voordat een nieuwe beslissing wordt aangeboden.

Gateways van vóór de uniforme goedkeuringsmethoden vallen terug op de meegeleverde
uitvoeringsspecifieke methoden. Beoordeling van openstaande verzoeken blijft werken, maar voor bewaarde terminalstatus
en het uitgebreidere resultaat over verschillende oppervlakken is een bijgewerkte Gateway vereist.

## Assistentingangen

Android ondersteunt het starten van OpenClaw via de systeemassistenttrigger (Google Assistant). Als je de startknop ingedrukt houdt (of een andere `ACTION_ASSIST`-trigger gebruikt), wordt de app geopend; door "Hey Google, ask OpenClaw `<prompt>`" te zeggen, wordt het gedeclareerde App Actions-querypatroon van de app herkend en wordt de prompt in het chatopstelveld geplaatst zonder deze automatisch te verzenden.

Hiervoor worden Android **App Actions** (mogelijkheid `shortcuts.xml`) gebruikt, die in het appmanifest zijn gedeclareerd. Er is geen configuratie aan de Gateway-zijde nodig — de assistentintentie wordt volledig door de Android-app afgehandeld.

<Note>
De beschikbaarheid van App Actions is afhankelijk van het apparaat, de versie van Google Play Services en of de gebruiker OpenClaw als standaardassistent-app heeft ingesteld.
</Note>

## Meldingen doorsturen

Android kan apparaatmeldingen als `node.event`-items naar de Gateway doorsturen. Dit wordt **op het apparaat** geconfigureerd, in het instellingenvenster van de app — niet in de Gateway-/`openclaw.json`-configuratie.

| Instelling                  | Beschrijving                                                                                                                                                                                                         |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Forward Notification Events | Hoofdschakelaar. Standaard uitgeschakeld; vereist dat eerst toegang tot Notification Listener wordt verleend.                                                                                                        |
| Package Filter              | **Allowlist** (alleen vermelde pakket-ID's worden doorgestuurd) of **Blocklist** (standaard: alle pakketten behalve vermelde ID's). Het eigen pakket van OpenClaw wordt in de Blocklist-modus altijd uitgesloten om doorstuurlussen te voorkomen. |
| Quiet Hours                 | Lokaal begin-/eindtijdvenster in HH:mm waarin doorsturen wordt onderdrukt. Standaard uitgeschakeld; na inschakeling is de standaardwaarde `22:00`-`07:00`.                                    |
| Max Events / Minute         | Limiet per apparaat voor het aantal doorgestuurde meldingen. Standaard 20.                                                                                                                                           |
| Route Session Key           | Optioneel. Zet doorgestuurde meldingsgebeurtenissen vast op een specifieke sessie in plaats van de standaardmeldingsroute van het apparaat.                                                                          |

<Note>
Voor het doorsturen van meldingen is de Android-toestemming Notification Listener vereist. De app vraagt hier tijdens de installatie om.
</Note>

Meldingen van WhatsApp, WhatsApp Business, Telegram, Telegram X, Discord en Signal worden altijd uitgesloten. Hun berichten vallen al onder native OpenClaw-kanaalsessies; als de Android-melding als afzonderlijke Node-gebeurtenis wordt doorgestuurd, kan een antwoord naar het verkeerde gesprek worden geleid.

## Gerelateerd

- [iOS-app](/nl/platforms/ios)
- [Nodes](/nl/nodes)
- [Problemen met Android-Nodes oplossen](/nl/nodes/troubleshooting)
