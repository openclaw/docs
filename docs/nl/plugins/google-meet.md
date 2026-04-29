---
read_when:
    - Je wilt dat een OpenClaw-agent deelneemt aan een Google Meet-gesprek
    - Je wilt dat een OpenClaw-agent een nieuw Google Meet-gesprek aanmaakt
    - Je configureert Chrome, Chrome-node of Twilio als Google Meet-transport
summary: 'Google Meet Plugin: neem deel aan expliciete Meet-URL''s via Chrome of Twilio met standaardinstellingen voor realtime spraak'
title: Google Meet-Plugin
x-i18n:
    generated_at: "2026-04-29T23:02:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 09779496b4aad3c854937dfeb69966372dd1a61eaafcf9da06831fa4bad8f34d
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet-deelnemersondersteuning voor OpenClaw — de Plugin is expliciet ontworpen:

- Hij neemt alleen deel via een expliciete `https://meet.google.com/...`-URL.
- Hij kan via de Google Meet API een nieuwe Meet-ruimte maken en vervolgens deelnemen aan de
  geretourneerde URL.
- `realtime`-spraak is de standaardmodus.
- Realtime-spraak kan terugkoppelen naar de volledige OpenClaw-agent wanneer diepere
  redenering of tools nodig zijn.
- Agents kiezen het deelneemgedrag met `mode`: gebruik `realtime` voor live
  luisteren/terugpraten, of `transcribe` om deel te nemen/de browser te bedienen zonder de
  realtime-spraakbrug.
- Auth begint als persoonlijke Google OAuth of een al aangemeld Chrome-profiel.
- Er is geen automatische toestemmingsaankondiging.
- De standaard Chrome-audio-backend is `BlackHole 2ch`.
- Chrome kan lokaal draaien of op een gekoppelde Node-host.
- Twilio accepteert een inbelnummer plus optionele pincode of DTMF-reeks.
- De CLI-opdracht is `googlemeet`; `meet` is gereserveerd voor bredere
  teleconferentieworkflows van agents.

## Snel aan de slag

Installeer de lokale audio-afhankelijkheden en configureer een realtime-spraakprovider
voor de backend. OpenAI is de standaard; Google Gemini Live werkt ook met
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` installeert het virtuele audioapparaat `BlackHole 2ch`. Het
installatieprogramma van Homebrew vereist een herstart voordat macOS het apparaat beschikbaar maakt:

```bash
sudo reboot
```

Controleer na het opnieuw opstarten beide onderdelen:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Schakel de Plugin in:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Controleer de setup:

```bash
openclaw googlemeet setup
```

De setup-uitvoer is bedoeld om leesbaar te zijn voor agents en rekening te houden met de modus. Deze rapporteert het Chrome-profiel, Node-pinning en, voor realtime Chrome-deelnames, de BlackHole/SoX-audiobrug en vertraagde realtime-introcontroles. Controleer voor alleen-observeren-deelnames hetzelfde transport met `--mode transcribe`; die modus slaat realtime-audiovereisten over omdat hij niet via de brug luistert of spreekt:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Wanneer Twilio-delegatie is geconfigureerd, rapporteert setup ook of de
`voice-call`-Plugin en Twilio-referenties gereed zijn. Behandel elke `ok: false`-controle als een blokkade voor het gecontroleerde transport en de gecontroleerde modus voordat je een agent vraagt deel te nemen. Gebruik `openclaw googlemeet setup --json` voor scripts of machineleesbare uitvoer. Gebruik `--transport chrome`, `--transport chrome-node` of `--transport twilio`
om een specifiek transport vooraf te controleren voordat een agent het probeert.

Neem deel aan een vergadering:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Of laat een agent deelnemen via de `google_meet`-tool:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Maak een nieuwe vergadering en neem eraan deel:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Maak alleen de URL zonder deel te nemen:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` heeft twee paden:

- API-aanmaak: gebruikt wanneer Google Meet OAuth-referenties zijn geconfigureerd. Dit is
  het meest deterministische pad en is niet afhankelijk van de browser-UI-status.
- Browserfallback: gebruikt wanneer OAuth-referenties ontbreken. OpenClaw gebruikt de
  gepinde Chrome-Node, opent `https://meet.google.com/new`, wacht tot Google
  doorverwijst naar een echte URL met vergadercode en retourneert vervolgens die URL. Dit pad vereist
  dat het OpenClaw Chrome-profiel op de Node al bij Google is aangemeld.
  Browserautomatisering handelt Meets eigen eerste microfoonprompt af; die prompt
  wordt niet behandeld als een Google-aanmeldingsfout.
  Deelname- en aanmaakflows proberen ook een bestaand Meet-tabblad te hergebruiken voordat ze een
  nieuw tabblad openen. Matching negeert onschuldige URL-querystrings zoals `authuser`, zodat een
  agent-retry de al geopende vergadering zou moeten focussen in plaats van een tweede
  Chrome-tabblad te maken.

De opdracht-/tooluitvoer bevat een `source`-veld (`api` of `browser`) zodat agents
kunnen uitleggen welk pad is gebruikt. `create` neemt standaard deel aan de nieuwe vergadering en
retourneert `joined: true` plus de deelnamesessie. Gebruik
`create --no-join` op de CLI of geef `"join": false` door aan de tool om alleen de URL aan te maken.

Of zeg tegen een agent: "Maak een Google Meet, neem eraan deel met realtime-spraak en stuur
mij de link." De agent zou `google_meet` moeten aanroepen met `action: "create"` en
vervolgens de geretourneerde `meetingUri` delen.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Stel voor een alleen-observeren-/browserbedieningsdeelname `"mode": "transcribe"` in. Dat start
de duplex realtime-modelbrug niet, vereist geen BlackHole of SoX,
en praat niet terug in de vergadering. Chrome-deelnames in deze modus vermijden ook
OpenClaw's microfoon-/cameratoestemmingsverlening en vermijden het Meet-pad **Use
microphone**. Als Meet een audio-keuzescherm toont, probeert automatisering
het pad zonder microfoon en rapporteert anders een handmatige actie in plaats van
de lokale microfoon te openen.

Tijdens realtime-sessies bevat de `google_meet`-status de gezondheid van browser en audiobrug,
zoals `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, laatste invoer-/uitvoertijdstempels,
bytetellers en gesloten brugstatus. Als er een veilige Meet-paginaprompt
verschijnt, handelt browserautomatisering die af wanneer dat kan. Aanmelding, toelating door host en
browser-/OS-toestemmingsprompts worden gerapporteerd als handmatige actie met een reden en
bericht dat de agent kan doorgeven.

Lokale Chrome-deelnames gebruiken het aangemelde OpenClaw-browserprofiel. Realtime-modus
vereist `BlackHole 2ch` voor het microfoon-/speakerpad dat door OpenClaw wordt gebruikt. Gebruik
voor schone duplexaudio afzonderlijke virtuele apparaten of een Loopback-achtige grafiek; een
enkel BlackHole-apparaat is genoeg voor een eerste rooktest, maar kan echo veroorzaken.

### Lokale Gateway + Parallels Chrome

Je hebt **geen** volledige OpenClaw Gateway of model-API-sleutel nodig in een macOS-VM
alleen om de VM eigenaar van Chrome te maken. Draai de Gateway en agent lokaal en draai vervolgens een
Node-host in de VM. Schakel de gebundelde Plugin eenmaal in op de VM zodat de Node
de Chrome-opdracht adverteert:

Wat waar draait:

- Gateway-host: OpenClaw Gateway, agentwerkruimte, model-/API-sleutels, realtime
  provider en de Google Meet-Pluginconfiguratie.
- Parallels macOS-VM: OpenClaw CLI/Node-host, Google Chrome, SoX, BlackHole 2ch,
  en een Chrome-profiel dat is aangemeld bij Google.
- Niet nodig in de VM: Gateway-service, agentconfiguratie, OpenAI/GPT-sleutel of modelprovider-setup.

Installeer de VM-afhankelijkheden:

```bash
brew install blackhole-2ch sox
```

Start de VM opnieuw op na het installeren van BlackHole zodat macOS `BlackHole 2ch` beschikbaar maakt:

```bash
sudo reboot
```

Controleer na het opnieuw opstarten of de VM het audioapparaat en de SoX-opdrachten kan zien:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Installeer of update OpenClaw in de VM en schakel vervolgens daar de gebundelde Plugin in:

```bash
openclaw plugins enable google-meet
```

Start de Node-host in de VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Als `<gateway-host>` een LAN-IP is en je geen TLS gebruikt, weigert de Node de
plaintext WebSocket tenzij je expliciet instemt voor dat vertrouwde privénetwerk:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gebruik dezelfde omgevingsvariabele wanneer je de Node als LaunchAgent installeert:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` is procesomgeving, geen
`openclaw.json`-instelling. `openclaw node install` slaat deze op in de LaunchAgent-omgeving
wanneer hij aanwezig is op de installatieopdracht.

Keur de Node goed vanaf de Gateway-host:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Bevestig dat de Gateway de Node ziet en dat deze zowel `googlemeet.chrome`
als browsercapability/`browser.proxy` adverteert:

```bash
openclaw nodes status
```

Route Meet via die Node op de Gateway-host:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["googlemeet.chrome", "browser.proxy"],
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          chrome: {
            guestName: "OpenClaw Agent",
            autoJoin: true,
            reuseExistingTab: true,
          },
          chromeNode: {
            node: "parallels-macos",
          },
        },
      },
    },
  },
}
```

Neem nu normaal deel vanaf de Gateway-host:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

of vraag de agent om de `google_meet`-tool te gebruiken met `transport: "chrome-node"`.

Voor een rooktest met één opdracht die een sessie maakt of hergebruikt, een bekende
zin uitspreekt en sessiegezondheid print:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Tijdens realtime-deelname vult OpenClaw-browserautomatisering de gastnaam in, klikt op
Join/Ask to join en accepteert Meets eerste "Use microphone"-keuze wanneer die
prompt verschijnt. Tijdens alleen-observeren-deelname of alleen-browservergaderingsaanmaak gaat het
langs dezelfde prompt zonder microfoon wanneer die keuze beschikbaar is.
Als het browserprofiel niet is aangemeld, Meet wacht op toelating door de host,
Chrome microfoon-/cameratoestemming nodig heeft voor een realtime-deelname, of Meet vastzit
op een prompt die automatisering niet kon oplossen, rapporteert het join/test-speech-resultaat
`manualActionRequired: true` met `manualActionReason` en
`manualActionMessage`. Agents moeten stoppen met opnieuw proberen deel te nemen, dat exacte
bericht plus de huidige `browserUrl`/`browserTitle` rapporteren, en pas opnieuw proberen nadat de
handmatige browseractie is voltooid.

Als `chromeNode.node` is weggelaten, selecteert OpenClaw alleen automatisch wanneer precies één
verbonden Node zowel `googlemeet.chrome` als browserbediening adverteert. Als
meerdere geschikte Nodes zijn verbonden, stel dan `chromeNode.node` in op de Node-id,
weergavenaam of externe IP.

Veelvoorkomende foutcontroles:

- `Configured Google Meet node ... is not usable: offline`: de gepinde Node is
  bekend bij de Gateway maar niet beschikbaar. Agents moeten die Node behandelen als
  diagnostische status, niet als bruikbare Chrome-host, en de setupblokkade
  rapporteren in plaats van terug te vallen op een ander transport, tenzij de gebruiker daarom vroeg.
- `No connected Google Meet-capable node`: start `openclaw node run` in de VM,
  keur pairing goed en zorg ervoor dat `openclaw plugins enable google-meet` en
  `openclaw plugins enable browser` in de VM zijn uitgevoerd. Bevestig ook dat de
  Gateway-host beide Node-opdrachten toestaat met
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: installeer `blackhole-2ch` op de host
  die wordt gecontroleerd en start opnieuw op voordat je lokale Chrome-audio gebruikt.
- `BlackHole 2ch audio device not found on the node`: installeer `blackhole-2ch`
  in de VM en start de VM opnieuw op.
- Chrome opent maar kan niet deelnemen: meld je aan bij het browserprofiel binnen de VM, of
  houd `chrome.guestName` ingesteld voor deelname als gast. Automatisch deelnemen als gast gebruikt OpenClaw-
  browserautomatisering via de Node-browserproxy; zorg dat de Node-browserconfiguratie
  wijst naar het profiel dat je wilt, bijvoorbeeld
  `browser.defaultProfile: "user"` of een benoemd bestaand-sessieprofiel.
- Dubbele Meet-tabbladen: laat `chrome.reuseExistingTab: true` ingeschakeld. OpenClaw
  activeert een bestaand tabblad voor dezelfde Meet-URL voordat het een nieuw tabblad opent, en
  browservergaderingsaanmaak hergebruikt een lopend `https://meet.google.com/new`
  of Google-accountprompttabblad voordat het een ander opent.
- Geen audio: routeer in Meet microfoon/speaker via het virtuele audioapparaatpad
  dat door OpenClaw wordt gebruikt; gebruik afzonderlijke virtuele apparaten of Loopback-achtige routering
  voor schone duplexaudio.

## Installatie-opmerkingen

De Chrome-realtime-standaard gebruikt twee externe tools:

- `sox`: audiohulpprogramma voor de opdrachtregel. De Plugin gebruikt expliciete CoreAudio
  apparaatopdrachten voor de standaard 24 kHz PCM16-audiobridge.
- `blackhole-2ch`: virtueel macOS-audiostuurprogramma. Het maakt het `BlackHole 2ch`
  audioapparaat aan waar Chrome/Meet doorheen kan routeren.

OpenClaw bundelt of herdistribueert geen van beide pakketten. De documentatie vraagt gebruikers om
ze als hostafhankelijkheden via Homebrew te installeren. SoX heeft de licentie
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole is GPL-3.0. Als je een
installatieprogramma of appliance bouwt die BlackHole met OpenClaw bundelt, controleer dan de
upstream licentievoorwaarden van BlackHole of verkrijg een afzonderlijke licentie van Existential Audio.

## Transporten

### Chrome

Chrome-transport opent de Meet-URL via OpenClaw-browserbesturing en neemt deel
als het aangemelde OpenClaw-browserprofiel. Op macOS controleert de Plugin vóór
het starten op `BlackHole 2ch`. Indien geconfigureerd voert deze ook een health-opdracht
voor de audiobridge en een opstartopdracht uit voordat Chrome wordt geopend. Gebruik `chrome` wanneer
Chrome/audio op de Gateway-host draait; gebruik `chrome-node` wanneer Chrome/audio draait
op een gekoppelde node, zoals een Parallels macOS-VM. Kies voor lokale Chrome het
profiel met `browser.defaultProfile`; `chrome.browserProfile` wordt doorgegeven aan
`chrome-node`-hosts.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Routeer Chrome-microfoon- en speakeraudio via de lokale OpenClaw-audiobridge.
Als `BlackHole 2ch` niet is geïnstalleerd, mislukt deelname met een setupfout
in plaats van stilzwijgend deel te nemen zonder audiopad.

### Twilio

Twilio-transport is een strikt belplan dat is gedelegeerd aan de Voice Call Plugin. Het
parseert geen Meet-pagina's voor telefoonnummers.

Gebruik dit wanneer deelname via Chrome niet beschikbaar is of wanneer je een telefonische inbelfallback
wilt. Google Meet moet een telefonisch inbelnummer en pincode voor de
vergadering tonen; OpenClaw ontdekt die niet via de Meet-pagina.

Schakel de Voice Call Plugin in op de Gateway-host, niet op de Chrome-node:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // or set "twilio" if Twilio should be the default
        },
      },
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
        },
      },
    },
  },
}
```

Geef Twilio-referenties op via de omgeving of configuratie. De omgeving houdt
geheimen buiten `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Herstart of herlaad de Gateway nadat je `voice-call` hebt ingeschakeld; wijzigingen in Plugin-configuratie
verschijnen pas in een al lopend Gateway-proces nadat het opnieuw is geladen.

Controleer daarna:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Wanneer Twilio-delegatie is aangesloten, bevat `googlemeet setup` geslaagde
controles voor `twilio-voice-call-plugin` en `twilio-voice-call-credentials`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Gebruik `--dtmf-sequence` wanneer de vergadering een aangepaste reeks nodig heeft:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth en voorcontrole

OAuth is optioneel voor het maken van een Meet-link, omdat `googlemeet create` kan terugvallen
op browserautomatisering. Configureer OAuth wanneer je officiële API-creatie,
space-resolutie of Meet Media API-voorcontroles wilt.

Google Meet API-toegang gebruikt gebruikers-OAuth: maak een Google Cloud OAuth-client,
vraag de vereiste scopes aan, autoriseer een Google-account en sla vervolgens het
resulterende vernieuwingstoken op in de Google Meet Plugin-configuratie of geef de
`OPENCLAW_GOOGLE_MEET_*`-omgevingsvariabelen op.

OAuth vervangt het Chrome-deelnamepad niet. Chrome- en Chrome-node-transporten
nemen nog steeds deel via een aangemeld Chrome-profiel, BlackHole/SoX en een verbonden
node wanneer je browserdeelname gebruikt. OAuth is alleen voor het officiële Google
Meet API-pad: vergaderruimtes maken, ruimtes oplossen en Meet Media API-
voorcontroles uitvoeren.

### Google-referenties maken

In Google Cloud Console:

1. Maak of selecteer een Google Cloud-project.
2. Schakel **Google Meet REST API** in voor dat project.
3. Configureer het OAuth-toestemmingsscherm.
   - **Intern** is het eenvoudigst voor een Google Workspace-organisatie.
   - **Extern** werkt voor persoonlijke/testopstellingen; terwijl de app in Testing staat,
     voeg je elk Google-account dat de app zal autoriseren toe als testgebruiker.
4. Voeg de scopes toe die OpenClaw aanvraagt:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Maak een OAuth-client-ID.
   - Applicatietype: **Webtoepassing**.
   - Geautoriseerde omleidings-URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Kopieer de client-ID en het clientgeheim.

`meetings.space.created` is vereist door Google Meet `spaces.create`.
Met `meetings.space.readonly` kan OpenClaw Meet-URL's/codes naar ruimtes oplossen.
`meetings.conference.media.readonly` is voor Meet Media API-voorcontrole en mediawerk;
Google kan Developer Preview-inschrijving vereisen voor daadwerkelijk Media API-gebruik.
Als je alleen browsergebaseerde Chrome-deelname nodig hebt, sla OAuth dan volledig over.

### Het vernieuwingstoken aanmaken

Configureer `oauth.clientId` en optioneel `oauth.clientSecret`, of geef ze door als
omgevingsvariabelen, en voer vervolgens uit:

```bash
openclaw googlemeet auth login --json
```

De opdracht drukt een `oauth`-configuratieblok af met een vernieuwingstoken. Deze gebruikt PKCE,
localhost-callback op `http://localhost:8085/oauth2callback` en een handmatige
kopieer/plak-flow met `--manual`.

Voorbeelden:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json
```

Gebruik handmatige modus wanneer de browser de lokale callback niet kan bereiken:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

De JSON-uitvoer bevat:

```json
{
  "oauth": {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret",
    "refreshToken": "refresh-token",
    "accessToken": "access-token",
    "expiresAt": 1770000000000
  },
  "scope": "..."
}
```

Sla het `oauth`-object op onder de Google Meet Plugin-configuratie:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          oauth: {
            clientId: "your-client-id",
            clientSecret: "your-client-secret",
            refreshToken: "refresh-token",
          },
        },
      },
    },
  },
}
```

Geef de voorkeur aan omgevingsvariabelen wanneer je het vernieuwingstoken niet in de configuratie wilt.
Als zowel configuratie- als omgevingswaarden aanwezig zijn, gebruikt de Plugin eerst
de configuratie en daarna de omgevingsfallback.

De OAuth-toestemming omvat het maken van Meet-ruimtes, leestoegang tot Meet-ruimtes en
leestoegang tot Meet-conferentiemedia. Als je je hebt geauthenticeerd voordat ondersteuning
voor het maken van vergaderingen bestond, voer dan `openclaw googlemeet auth login --json` opnieuw uit zodat het vernieuwingstoken de scope `meetings.space.created` heeft.

### OAuth controleren met doctor

Voer de OAuth-doctor uit wanneer je een snelle gezondheidscontrole zonder geheimen wilt:

```bash
openclaw googlemeet doctor --oauth --json
```

Dit laadt de Chrome-runtime niet en vereist geen verbonden Chrome-node. Het
controleert of OAuth-configuratie bestaat en of het vernieuwingstoken een toegangstoken kan
aanmaken. Het JSON-rapport bevat alleen statusvelden zoals `ok`, `configured`,
`tokenSource`, `expiresAt` en controlemeldingen; het drukt het toegangstoken,
vernieuwingstoken of clientgeheim niet af.

Veelvoorkomende resultaten:

| Controle             | Betekenis                                                                               |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` plus `oauth.refreshToken`, of een gecachet toegangstoken, is aanwezig. |
| `oauth-token`        | Het gecachete toegangstoken is nog geldig, of het vernieuwingstoken heeft een nieuw toegangstoken aangemaakt. |
| `meet-spaces-get`    | Optionele `--meeting`-controle heeft een bestaande Meet-ruimte opgelost.                |
| `meet-spaces-create` | Optionele `--create-space`-controle heeft een nieuwe Meet-ruimte gemaakt.               |

Om ook Google Meet API-inschakeling en de scope `spaces.create` aan te tonen, voer je de
controle met bijwerking voor maken uit:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` maakt een wegwerp-Meet-URL. Gebruik dit wanneer je moet bevestigen
dat het Google Cloud-project de Meet API heeft ingeschakeld en dat het geautoriseerde
account de scope `meetings.space.created` heeft.

Om leestoegang voor een bestaande vergaderruimte aan te tonen:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` en `resolve-space` tonen leestoegang aan tot een bestaande
ruimte waartoe het geautoriseerde Google-account toegang heeft. Een `403` van deze controles
betekent meestal dat de Google Meet REST API is uitgeschakeld, dat het toegestemde vernieuwingstoken
de vereiste scope mist, of dat het Google-account geen toegang heeft tot die Meet-
ruimte. Een vernieuwingstokenfout betekent dat je `openclaw googlemeet auth login
--json` opnieuw moet uitvoeren en het nieuwe `oauth`-blok moet opslaan.

Er zijn geen OAuth-referenties nodig voor de browserfallback. In die modus komt Google-
authenticatie van het aangemelde Chrome-profiel op de geselecteerde node, niet uit
OpenClaw-configuratie.

Deze omgevingsvariabelen worden als fallbacks geaccepteerd:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` of `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` of `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` of `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` of `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` of
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` of `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` of `GOOGLE_MEET_PREVIEW_ACK`

Los een Meet-URL, code of `spaces/{id}` op via `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Voer voorcontrole uit vóór mediawerk:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Maak een lijst van vergaderartefacten en aanwezigheid nadat Meet conferentierecords heeft gemaakt:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Met `--meeting` gebruiken `artifacts` en `attendance` standaard het nieuwste conferentierecord.
Geef `--all-conference-records` door wanneer je elk bewaard record voor die vergadering wilt.

Agenda-opzoeken kan de vergader-URL uit Google Calendar oplossen voordat
Meet-artefacten worden gelezen:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` doorzoekt de `primary` agenda van vandaag naar een Calendar-afspraak met een
Google Meet-link. Gebruik `--event <query>` om te zoeken naar overeenkomende afspraaktekst, en
`--calendar <id>` voor een niet-primaire agenda. Agenda-opzoeking vereist een nieuwe
OAuth-login met de alleen-lezen-scope voor Calendar-afspraken.
`calendar-events` toont een voorbeeld van de overeenkomende Meet-afspraken en markeert de afspraak die
`latest`, `artifacts`, `attendance` of `export` zal kiezen.

Als je de id van het conferentierecord al weet, adresseer die dan direct:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Schrijf een leesbaar rapport:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-attendance.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` retourneert metadata van conferentierecords plus metadata van deelnemers,
opnamen, transcripties, gestructureerde transcriptievermeldingen en smart-note-resources wanneer
Google die voor de vergadering beschikbaar stelt. Gebruik `--no-transcript-entries` om
het opzoeken van vermeldingen voor grote vergaderingen over te slaan. `attendance` werkt deelnemers uit naar
rijen met deelnemersessies, met tijden voor eerste/laatste waarneming, totale sessieduur,
vlaggen voor te laat/vroeg vertrek, en dubbele deelnemerresources samengevoegd op basis van aangemelde
gebruiker of weergavenaam. Geef `--no-merge-duplicates` door om onbewerkte deelnemerresources
gescheiden te houden, `--late-after-minutes` om detectie van te laat komen af te stemmen, en
`--early-before-minutes` om detectie van vroeg vertrek af te stemmen.

`export` schrijft een map met `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` en `manifest.json`.
`manifest.json` registreert de gekozen invoer, exportopties, conferentierecords,
uitvoerbestanden, aantallen, tokenbron, Calendar-afspraak wanneer die is gebruikt, en eventuele
waarschuwingen over gedeeltelijke ophaling. Geef `--zip` door om ook een draagbaar archief naast
de map te schrijven. Geef `--include-doc-bodies` door om gekoppelde transcript- en
smart-note-Google Docs-tekst via Google Drive `files.export` te exporteren; hiervoor is een
nieuwe OAuth-login nodig met de alleen-lezen-scope voor Drive Meet. Zonder
`--include-doc-bodies` bevatten exports alleen Meet-metadata en gestructureerde transcriptievermeldingen.
Als Google een gedeeltelijke artifactfout retourneert, zoals een fout bij het vermelden van smart-notes,
transcriptievermeldingen of Drive-documentinhoud, bewaren de samenvatting en
het manifest de waarschuwing in plaats van de hele export te laten mislukken.
Gebruik `--dry-run` om dezelfde artifact-/aanwezigheidsgegevens op te halen en de
manifest-JSON af te drukken zonder de map of ZIP te maken. Dat is nuttig voordat je
een grote export schrijft of wanneer een agent alleen aantallen, geselecteerde records en
waarschuwingen nodig heeft.

Agents kunnen dezelfde bundel ook maken via de `google_meet`-tool:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Stel `"dryRun": true` in om alleen het exportmanifest te retourneren en bestandswrites over te slaan.

Voer de afgeschermde live smoke uit tegen een echte bewaarde vergadering:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Live-smoke-omgeving:

- `OPENCLAW_LIVE_TEST=1` schakelt afgeschermde livetests in.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` verwijst naar een bewaarde Meet-URL, code of
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` of `GOOGLE_MEET_CLIENT_ID` levert de OAuth
  client-id.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` of `GOOGLE_MEET_REFRESH_TOKEN` levert
  het vernieuwingstoken.
- Optioneel: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` en
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` gebruiken dezelfde fallbacknamen
  zonder de prefix `OPENCLAW_`.

De basis-live-smoke voor artifacts/aanwezigheid heeft
`https://www.googleapis.com/auth/meetings.space.readonly` en
`https://www.googleapis.com/auth/meetings.conference.media.readonly` nodig. Agenda-opzoeking
heeft `https://www.googleapis.com/auth/calendar.events.readonly` nodig. Export van
documentinhoud via Drive heeft
`https://www.googleapis.com/auth/drive.meet.readonly` nodig.

Maak een nieuwe Meet-ruimte:

```bash
openclaw googlemeet create
```

De opdracht drukt de nieuwe `meeting uri`, bron en deelsessie af. Met OAuth
credentials gebruikt deze de officiële Google Meet-API. Zonder OAuth credentials
gebruikt deze het aangemelde browserprofiel van de vastgezette Chrome-node als fallback. Agents kunnen
de `google_meet`-tool gebruiken met `action: "create"` om in één stap te maken en deel te nemen.
Voor alleen URL-aanmaak geef je `"join": false` door.

Voorbeeld van JSON-uitvoer van de browserfallback:

```json
{
  "source": "browser",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Als de browserfallback Google-login of een Meet-permissieblokkade raakt voordat deze
de URL kan maken, retourneert de Gateway-methode een mislukte respons en retourneert de
`google_meet`-tool gestructureerde details in plaats van een platte tekenreeks:

```json
{
  "source": "browser",
  "error": "google-login-required: Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "manualActionRequired": true,
  "manualActionReason": "google-login-required",
  "manualActionMessage": "Sign in to Google in the OpenClaw browser profile, then retry meeting creation.",
  "browser": {
    "nodeId": "ba0f4e4bc...",
    "targetId": "tab-1",
    "browserUrl": "https://accounts.google.com/signin",
    "browserTitle": "Sign in - Google Accounts"
  }
}
```

Wanneer een agent `manualActionRequired: true` ziet, moet die de
`manualActionMessage` plus de browsernode-/tabcontext rapporteren en stoppen met het openen van nieuwe
Meet-tabs totdat de operator de browserstap voltooit.

Voorbeeld van JSON-uitvoer van API-aanmaak:

```json
{
  "source": "api",
  "meetingUri": "https://meet.google.com/abc-defg-hij",
  "joined": true,
  "space": {
    "name": "spaces/abc-defg-hij",
    "meetingCode": "abc-defg-hij",
    "meetingUri": "https://meet.google.com/abc-defg-hij"
  },
  "join": {
    "session": {
      "id": "meet_...",
      "url": "https://meet.google.com/abc-defg-hij"
    }
  }
}
```

Bij het maken van een Meet wordt standaard deelgenomen. Het Chrome- of Chrome-node-transport heeft nog steeds
een aangemeld Google Chrome-profiel nodig om via de browser deel te nemen. Als het
profiel is afgemeld, rapporteert OpenClaw `manualActionRequired: true` of een
browserfallbackfout en vraagt het de operator de Google-login te voltooien voordat
opnieuw wordt geprobeerd.

Stel `preview.enrollmentAcknowledged: true` alleen in nadat je hebt bevestigd dat je Cloud
project, OAuth-principal en vergaderdeelnemers zijn ingeschreven voor het Google
Workspace Developer Preview Program voor Meet-media-API's.

## Config

Het gemeenschappelijke realtimepad via Chrome heeft alleen de Plugin ingeschakeld, BlackHole, SoX
en een backend-realtime-spraakproviderkey nodig. OpenAI is de standaard; stel
`realtime.provider: "google"` in om Google Gemini Live te gebruiken:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Stel de Plugin-config in onder `plugins.entries.google-meet.config`:

```json5
{
  plugins: {
    entries: {
      "google-meet": {
        enabled: true,
        config: {},
      },
    },
  },
}
```

Standaarden:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: optionele node-id/naam/IP voor `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: naam die wordt gebruikt op het Meet-gastscherm
  wanneer niet aangemeld
- `chrome.autoJoin: true`: best-effort invullen van gastnaam en klik op Nu deelnemen
  via OpenClaw-browserautomatisering op `chrome-node`
- `chrome.reuseExistingTab: true`: activeer een bestaande Meet-tab in plaats van
  duplicaten te openen
- `chrome.waitForInCallMs: 20000`: wacht tot de Meet-tab meldt dat deze in een gesprek is
  voordat de realtime-intro wordt geactiveerd
- `chrome.audioFormat: "pcm16-24khz"`: audioformaat voor opdrachtparen. Gebruik
  `"g711-ulaw-8khz"` alleen voor legacy/aangepaste opdrachtparen die nog steeds
  telefonieaudio uitsturen.
- `chrome.audioInputCommand`: SoX-opdracht die leest uit CoreAudio `BlackHole 2ch`
  en audio schrijft in `chrome.audioFormat`
- `chrome.audioOutputCommand`: SoX-opdracht die audio leest in `chrome.audioFormat`
  en schrijft naar CoreAudio `BlackHole 2ch`
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: korte gesproken antwoorden, met
  `openclaw_agent_consult` voor diepgaandere antwoorden
- `realtime.introMessage`: korte gesproken gereedheidscontrole wanneer de realtimebridge
  verbindt; stel dit in op `""` om stil deel te nemen
- `realtime.agentId`: optionele OpenClaw-agent-id voor
  `openclaw_agent_consult`; standaard is `main`

Optionele overrides:

```json5
{
  defaults: {
    meeting: "https://meet.google.com/abc-defg-hij",
  },
  browser: {
    defaultProfile: "openclaw",
  },
  chrome: {
    guestName: "OpenClaw Agent",
    waitForInCallMs: 30000,
  },
  chromeNode: {
    node: "parallels-macos",
  },
  realtime: {
    provider: "google",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        voice: "Kore",
      },
    },
  },
}
```

Configuratie alleen voor Twilio:

```json5
{
  defaultTransport: "twilio",
  twilio: {
    defaultDialInNumber: "+15551234567",
    defaultPin: "123456",
  },
  voiceCall: {
    gatewayUrl: "ws://127.0.0.1:18789",
  },
}
```

`voiceCall.enabled` is standaard `true`; met Twilio-transport delegeert het
het daadwerkelijke PSTN-gesprek en DTMF aan de Voice Call-Plugin. Als `voice-call` niet
is ingeschakeld, kan Google Meet het belplan nog steeds valideren en opnemen, maar kan het
het Twilio-gesprek niet plaatsen.

## Tool

Agents kunnen de `google_meet`-tool gebruiken:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Gebruik `transport: "chrome"` wanneer Chrome op de Gateway-host draait. Gebruik
`transport: "chrome-node"` wanneer Chrome draait op een gekoppelde node, zoals een Parallels
VM. In beide gevallen draaien het realtime model en `openclaw_agent_consult` op de
Gateway-host, zodat modelcredentials daar blijven.

Gebruik `action: "status"` om actieve sessies te tonen of een sessie-ID te inspecteren. Gebruik
`action: "speak"` met `sessionId` en `message` om de realtime agent
direct te laten spreken. Gebruik `action: "test_speech"` om de sessie te maken of te hergebruiken,
een bekende zin te activeren, en `inCall`-gezondheid te retourneren wanneer de Chrome-host dat kan
rapporteren. `test_speech` forceert altijd `mode: "realtime"` en faalt als wordt gevraagd
om in `mode: "transcribe"` te draaien, omdat sessies die alleen observeren bewust geen
spraak kunnen uitsturen. Het resultaat `speechOutputVerified` is gebaseerd op realtime audio-uitvoerbytes
die tijdens deze testaanroep toenemen, dus een hergebruikte sessie met oudere audio
telt niet als een nieuwe geslaagde spraakcontrole. Gebruik `action: "leave"` om
een sessie als beëindigd te markeren.

`status` bevat Chrome-gezondheid wanneer beschikbaar:

- `inCall`: Chrome lijkt zich in het Meet-gesprek te bevinden
- `micMuted`: best-effort Meet-microfoonstatus
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: het
  browserprofiel heeft handmatige login, toelating door Meet-host, permissies of
  herstel van browserbesturing nodig voordat spraak kan werken
- `providerConnected` / `realtimeReady`: status van realtime-spraakbridge
- `lastInputAt` / `lastOutputAt`: laatste audio die is gezien vanuit of verzonden naar de bridge

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Realtime agentconsult

De realtime modus van Chrome is geoptimaliseerd voor een live spraaklus. De realtime spraakprovider hoort de vergaderaudio en spreekt via de geconfigureerde audiobrug. Wanneer het realtime model diepere redenering, actuele informatie of normale OpenClaw tools nodig heeft, kan het `openclaw_agent_consult` aanroepen.

De consulttool voert achter de schermen de reguliere OpenClaw agent uit met recente transcriptcontext van de vergadering en retourneert een beknopt gesproken antwoord aan de realtime spraaksessie. Het spraakmodel kan dat antwoord vervolgens terugspreken in de vergadering. Het gebruikt dezelfde gedeelde realtime consulttool als Voice Call.

Standaard worden consults uitgevoerd tegen de `main` agent. Stel `realtime.agentId` in wanneer een Meet-lane een toegewezen OpenClaw agentwerkruimte, modelstandaarden, toolbeleid, geheugen en sessiegeschiedenis moet consulteren.

`realtime.toolPolicy` beheert de consultuitvoering:

- `safe-read-only`: stel de consulttool beschikbaar en beperk de reguliere agent tot `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` en `memory_get`.
- `owner`: stel de consulttool beschikbaar en laat de reguliere agent het normale agenttoolbeleid gebruiken.
- `none`: stel de consulttool niet beschikbaar aan het realtime spraakmodel.

De consultsessiesleutel is per Meet-sessie begrensd, zodat vervolgconsultaanroepen eerdere consultcontext tijdens dezelfde vergadering kunnen hergebruiken.

Om een gesproken gereedheidscontrole af te dwingen nadat Chrome volledig aan het gesprek heeft deelgenomen:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Voor de volledige rooktest voor deelnemen en spreken:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Checklist voor livetests

Gebruik deze volgorde voordat je een vergadering overdraagt aan een onbeheerde agent:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Verwachte Chrome-node-status:

- `googlemeet setup` is volledig groen.
- `googlemeet setup` bevat `chrome-node-connected` wanneer Chrome-node het standaardtransport is of een node is vastgezet.
- `nodes status` toont dat de geselecteerde node verbonden is.
- De geselecteerde node adverteert zowel `googlemeet.chrome` als `browser.proxy`.
- Het Meet-tabblad neemt deel aan het gesprek en `test-speech` retourneert Chrome-gezondheid met `inCall: true`.

Voor een externe Chrome-host zoals een Parallels macOS-VM is dit de kortste veilige controle na het bijwerken van de Gateway of de VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Dat bewijst dat de Gateway Plugin is geladen, de VM-node is verbonden met het huidige token en de Meet-audiobrug beschikbaar is voordat een agent een echt vergaderingstabblad opent.

Gebruik voor een Twilio-rooktest een vergadering die telefoongegevens voor inbellen beschikbaar maakt:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Verwachte Twilio-status:

- `googlemeet setup` bevat groene controles voor `twilio-voice-call-plugin` en `twilio-voice-call-credentials`.
- `voicecall` is beschikbaar in de CLI nadat de Gateway opnieuw is geladen.
- De geretourneerde sessie heeft `transport: "twilio"` en een `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` hangt het gedelegeerde spraakgesprek op.

## Probleemoplossing

### Agent kan de Google Meet-tool niet zien

Controleer of de Plugin is ingeschakeld in de Gateway-configuratie en laad de Gateway opnieuw:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Als je zojuist `plugins.entries.google-meet` hebt bewerkt, herstart of herlaad de Gateway. De actieve agent ziet alleen Plugin-tools die door het huidige Gateway-proces zijn geregistreerd.

### Geen verbonden node met Google Meet-ondersteuning

Voer op de node-host uit:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Keur op de Gateway-host de node goed en verifieer de opdrachten:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

De node moet verbonden zijn en `googlemeet.chrome` plus `browser.proxy` vermelden. De Gateway-configuratie moet die node-opdrachten toestaan:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Als `googlemeet setup` faalt op `chrome-node-connected` of het Gateway-log `gateway token mismatch` meldt, installeer de node dan opnieuw of herstart deze met het huidige Gateway-token. Voor een LAN-Gateway betekent dit meestal:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Laad daarna de nodeservice opnieuw en voer opnieuw uit:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Browser opent, maar agent kan niet deelnemen

Voer `googlemeet test-speech` uit en inspecteer de geretourneerde Chrome-gezondheid. Als deze `manualActionRequired: true` meldt, toon `manualActionMessage` aan de operator en stop met opnieuw proberen totdat de browseractie voltooid is.

Veelvoorkomende handmatige acties:

- Meld je aan bij het Chrome-profiel.
- Laat de gast toe vanuit het Meet-hostaccount.
- Geef Chrome microfoon-/camerarechten wanneer de native toestemmingsprompt van Chrome verschijnt.
- Sluit of herstel een vastgelopen Meet-machtigingsdialoog.

Meld niet "not signed in" alleen omdat Meet "Do you want people to hear you in the meeting?" toont. Dat is het audio-keuzescherm van Meet; OpenClaw klikt via browserautomatisering op **Microfoon gebruiken** wanneer beschikbaar en blijft wachten op de echte vergaderstatus. Voor de browserfallback alleen voor aanmaken kan OpenClaw op **Doorgaan zonder microfoon** klikken omdat het aanmaken van de URL het realtime audiopad niet nodig heeft.

### Vergadering aanmaken mislukt

`googlemeet create` gebruikt eerst het Google Meet API-eindpunt `spaces.create` wanneer OAuth-referenties zijn geconfigureerd. Zonder OAuth-referenties valt het terug op de vastgezette Chrome-nodebrowser. Controleer:

- Voor aanmaken via API: `oauth.clientId` en `oauth.refreshToken` zijn geconfigureerd, of overeenkomende `OPENCLAW_GOOGLE_MEET_*` omgevingsvariabelen zijn aanwezig.
- Voor aanmaken via API: het vernieuwingstoken is uitgegeven nadat ondersteuning voor aanmaken is toegevoegd. Oudere tokens missen mogelijk de scope `meetings.space.created`; voer `openclaw googlemeet auth login --json` opnieuw uit en werk de Plugin-configuratie bij.
- Voor browserfallback: `defaultTransport: "chrome-node"` en `chromeNode.node` wijzen naar een verbonden node met `browser.proxy` en `googlemeet.chrome`.
- Voor browserfallback: het OpenClaw Chrome-profiel op die node is aangemeld bij Google en kan `https://meet.google.com/new` openen.
- Voor browserfallback: nieuwe pogingen hergebruiken een bestaand `https://meet.google.com/new` of een tabblad met Google-accountprompt voordat een nieuw tabblad wordt geopend. Als een agent een time-out krijgt, probeer de toolaanroep opnieuw in plaats van handmatig nog een Meet-tabblad te openen.
- Voor browserfallback: als de tool `manualActionRequired: true` retourneert, gebruik dan de geretourneerde `browser.nodeId`, `browser.targetId`, `browserUrl` en `manualActionMessage` om de operator te begeleiden. Probeer niet in een lus opnieuw totdat die actie voltooid is.
- Voor browserfallback: als Meet "Do you want people to hear you in the meeting?" toont, laat het tabblad open. OpenClaw zou via browserautomatisering op **Microfoon gebruiken** moeten klikken of, voor fallback alleen voor aanmaken, op **Doorgaan zonder microfoon**, en blijven wachten op de gegenereerde Meet-URL. Als dat niet kan, moet de fout `meet-audio-choice-required` vermelden, niet `google-login-required`.

### Agent neemt deel, maar praat niet

Controleer het realtime pad:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Gebruik `mode: "realtime"` voor luisteren/terugspreken. `mode: "transcribe"` start opzettelijk niet de duplex realtime spraakbrug. `googlemeet test-speech` controleert altijd het realtime pad en meldt of bridge-uitvoerbytes voor die aanroep zijn waargenomen. Als `speechOutputVerified` false is en `speechOutputTimedOut` true is, heeft de realtime provider de uiting mogelijk geaccepteerd, maar zag OpenClaw geen nieuwe uitvoerbytes de Chrome-audiobrug bereiken.

Controleer ook:

- Er is een realtime providersleutel beschikbaar op de Gateway-host, zoals `OPENAI_API_KEY` of `GEMINI_API_KEY`.
- `BlackHole 2ch` is zichtbaar op de Chrome-host.
- `sox` bestaat op de Chrome-host.
- Meet-microfoon en -speaker worden gerouteerd via het virtuele audiopad dat OpenClaw gebruikt.

`googlemeet doctor [session-id]` print de sessie, node, in-call-status, reden voor handmatige actie, realtime providerverbinding, `realtimeReady`, audio-invoer-/uitvoeractiviteit, laatste audiotijdstempels, byte-tellers en browser-URL. Gebruik `googlemeet status [session-id]` wanneer je de ruwe JSON nodig hebt. Gebruik `googlemeet doctor --oauth` wanneer je Google Meet OAuth-vernieuwing moet verifiëren zonder tokens bloot te leggen; voeg `--meeting` of `--create-space` toe wanneer je ook een Google Meet API-bewijs nodig hebt.

Als een agent een time-out kreeg en je ziet dat er al een Meet-tabblad openstaat, inspecteer dat tabblad dan zonder een nieuw tabblad te openen:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

De equivalente toolactie is `recover_current_tab`. Deze focust en inspecteert een bestaand Meet-tabblad voor het geselecteerde transport. Met `chrome` gebruikt deze lokale browserbesturing via de Gateway; met `chrome-node` gebruikt deze de geconfigureerde Chrome-node. Deze opent geen nieuw tabblad en maakt geen nieuwe sessie aan; deze rapporteert de huidige blokkade, zoals login, toelating, machtigingen of audio-keuzestatus. De CLI-opdracht praat met de geconfigureerde Gateway, dus de Gateway moet actief zijn; `chrome-node` vereist ook dat de Chrome-node verbonden is.

### Twilio-setupcontroles falen

`twilio-voice-call-plugin` faalt wanneer `voice-call` niet is toegestaan of niet is ingeschakeld. Voeg het toe aan `plugins.allow`, schakel `plugins.entries.voice-call` in en herlaad de Gateway.

`twilio-voice-call-credentials` faalt wanneer in de Twilio-backend account-SID, auth-token of bellernummer ontbreekt. Stel deze in op de Gateway-host:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Herstart of herlaad daarna de Gateway en voer uit:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` controleert standaard alleen gereedheid. Voor een proefrun met een specifiek nummer:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Voeg `--yes` alleen toe wanneer je bewust een live uitgaand meldingsgesprek wilt plaatsen:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio-gesprek start, maar komt nooit in de vergadering

Controleer of de Meet-gebeurtenis telefoongegevens voor inbellen beschikbaar maakt. Geef het exacte inbelnummer en de PIN of een aangepaste DTMF-reeks door:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Gebruik voorloop-`w` of komma's in `--dtmf-sequence` als de provider een pauze nodig heeft voordat de PIN wordt ingevoerd.

## Notities

De officiële media-API van Google Meet is gericht op ontvangen, dus spreken in een Meet-gesprek heeft nog steeds een deelnemerspad nodig. Deze Plugin houdt die grens zichtbaar: Chrome verwerkt browserdeelname en lokale audioroutering; Twilio verwerkt deelname via telefonisch inbellen.

De realtime modus van Chrome heeft `BlackHole 2ch` nodig plus een van beide:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw beheert de realtime-modelbrug en leidt audio in `chrome.audioFormat` tussen die opdrachten en de geselecteerde realtime-spraakprovider. Het standaard Chrome-pad is 24 kHz PCM16; 8 kHz G.711 mu-law blijft beschikbaar voor verouderde opdrachtparen.
- `chrome.audioBridgeCommand`: een externe brugopdracht beheert het volledige lokale audiopad en moet afsluiten nadat de daemon is gestart of gevalideerd.

Voor nette duplexaudio routeer je Meet-uitvoer en de Meet-microfoon via afzonderlijke virtuele apparaten of een Loopback-achtige virtuele-apparatengrafiek. Een enkel gedeeld BlackHole-apparaat kan andere deelnemers terug de oproep in laten echoën.

`googlemeet speak` activeert de actieve realtime-audiobrug voor een Chrome-sessie. `googlemeet leave` stopt die brug. Voor Twilio-sessies die via de Voice Call-Plugin zijn gedelegeerd, hangt `leave` ook de onderliggende spraakoproep op.

## Gerelateerd

- [Voice Call-Plugin](/nl/plugins/voice-call)
- [Praatmodus](/nl/nodes/talk)
- [Plugins bouwen](/nl/plugins/building-plugins)
