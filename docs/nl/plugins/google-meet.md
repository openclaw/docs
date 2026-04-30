---
read_when:
    - Je wilt dat een OpenClaw-agent deelneemt aan een Google Meet-gesprek.
    - Je wilt dat een OpenClaw-agent een nieuwe Google Meet-oproep aanmaakt
    - Je configureert Chrome, Chrome-node of Twilio als Google Meet-transport
summary: 'Google Meet-Plugin: neem deel aan expliciete Meet-URL''s via Chrome of Twilio met standaardinstellingen voor realtime spraak'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-04-30T09:38:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7b989c872fee0dca31680f67559cd26b715303f7c6f4eeda51fc63889bb0383c
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet-deelnemerondersteuning voor OpenClaw — de plugin is expliciet ontworpen:

- Deze neemt alleen deel aan een expliciete `https://meet.google.com/...`-URL.
- Deze kan een nieuwe Meet-ruimte maken via de Google Meet API en daarna deelnemen aan de
  geretourneerde URL.
- `realtime`-spraak is de standaardmodus.
- Realtime-spraak kan terugroepen naar de volledige OpenClaw-agent wanneer diepere
  redenering of tools nodig zijn.
- Agents kiezen het deelnamegedrag met `mode`: gebruik `realtime` voor live
  luisteren/terugspreken, of `transcribe` om deel te nemen/de browser te besturen zonder de
  realtime-spraakbridge.
- Authenticatie begint als persoonlijke Google OAuth of een al aangemeld Chrome-profiel.
- Er is geen automatische toestemmingsaankondiging.
- De standaard Chrome-audiobackend is `BlackHole 2ch`.
- Chrome kan lokaal of op een gekoppelde node-host draaien.
- Twilio accepteert een inbelnummer plus optionele pincode of DTMF-reeks.
- De CLI-opdracht is `googlemeet`; `meet` is gereserveerd voor bredere agent-
  teleconferentieworkflows.

## Snelstart

Installeer de lokale audio-afhankelijkheden en configureer een backendprovider voor realtime-spraak.
OpenAI is de standaard; Google Gemini Live werkt ook met
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

Controleer na het herstarten beide onderdelen:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Schakel de plugin in:

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

Controleer de installatie:

```bash
openclaw googlemeet setup
```

De uitvoer van de installatie is bedoeld om door agents gelezen te worden en is modusbewust. Deze rapporteert het Chrome-
profiel, node-pinning en, voor realtime Chrome-deelnames, de BlackHole/SoX-audio-
bridge en vertraagde controles voor de realtime-intro. Controleer voor observe-only deelnames hetzelfde
transport met `--mode transcribe`; die modus slaat realtime-audiovoorwaarden over
omdat deze niet via de bridge luistert of spreekt:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Wanneer Twilio-delegatie is geconfigureerd, rapporteert de installatie ook of de
`voice-call`-plugin en Twilio-referenties gereed zijn. Behandel elke `ok: false`-
controle als een blokkade voor het gecontroleerde transport en de gecontroleerde modus voordat je een agent vraagt om
deel te nemen. Gebruik `openclaw googlemeet setup --json` voor scripts of machineleesbare
uitvoer. Gebruik `--transport chrome`, `--transport chrome-node` of `--transport twilio`
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

- Aanmaken via API: gebruikt wanneer Google Meet OAuth-referenties zijn geconfigureerd. Dit is
  het meest deterministische pad en is niet afhankelijk van de UI-status van de browser.
- Browserfallback: gebruikt wanneer OAuth-referenties ontbreken. OpenClaw gebruikt de
  gepinde Chrome-node, opent `https://meet.google.com/new`, wacht tot Google
  doorverwijst naar een echte URL met vergadercode en retourneert daarna die URL. Dit pad vereist
  dat het OpenClaw Chrome-profiel op de node al bij Google is aangemeld.
  Browserautomatisering verwerkt Meet's eigen eerste-run-microfoonprompt; die prompt
  wordt niet behandeld als een Google-aanmeldfout.
  Deelname- en aanmaakflows proberen ook een bestaand Meet-tabblad te hergebruiken voordat een
  nieuw wordt geopend. Matching negeert onschuldige URL-querystrings zoals `authuser`, zodat een
  agent die het opnieuw probeert de al geopende vergadering zou moeten focussen in plaats van een tweede
  Chrome-tabblad te maken.

De opdracht-/tooluitvoer bevat een `source`-veld (`api` of `browser`) zodat agents
kunnen uitleggen welk pad is gebruikt. `create` neemt standaard deel aan de nieuwe vergadering en
retourneert `joined: true` plus de deelnamesessie. Gebruik
`create --no-join` in de CLI of geef `"join": false` door aan de tool om alleen de URL aan te maken.

Of zeg tegen een agent: "Maak een Google Meet, neem deel met realtime-spraak en stuur
me de link." De agent zou `google_meet` moeten aanroepen met `action: "create"` en
daarna de geretourneerde `meetingUri` moeten delen.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Stel voor een observe-only/browser-control deelname `"mode": "transcribe"` in. Dat start
de duplex realtime-modelbridge niet, vereist geen BlackHole of SoX,
en spreekt niet terug in de vergadering. Chrome-deelnames in deze modus vermijden ook
OpenClaw's machtigingstoekenning voor microfoon/camera en vermijden het Meet-pad **Use
microphone**. Als Meet een interstitial voor audiokeuze toont, probeert automatisering
het pad zonder microfoon en rapporteert anders een handmatige actie in plaats van
de lokale microfoon te openen.

Tijdens realtime-sessies bevat de `google_meet`-status de status van de browser en audiobridge,
zoals `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, laatste invoer-/uitvoer-
tijdstempels, bytetellers en de gesloten status van de bridge. Als een veilige Meet-paginaprompt
verschijnt, handelt browserautomatisering deze af wanneer dat kan. Aanmelding, toelating door de host en
browser-/OS-machtigingsprompts worden gerapporteerd als handmatige actie met een reden en
bericht dat de agent kan doorgeven. Beheerde Chrome-sessies geven de intro of
testzin pas weer nadat de browserstatus `inCall: true` rapporteert; anders rapporteert de status
`speechReady: false` en wordt de spraakpoging geblokkeerd in plaats van te doen alsof de
agent in de vergadering heeft gesproken.

Lokale Chrome-deelnames gebruiken het aangemelde OpenClaw-browserprofiel. Realtime-modus
vereist `BlackHole 2ch` voor het microfoon-/speakerpad dat door OpenClaw wordt gebruikt. Gebruik voor
schone duplexaudio aparte virtuele apparaten of een Loopback-achtige grafiek; een
enkel BlackHole-apparaat is genoeg voor een eerste smoke-test, maar kan echo veroorzaken.

### Lokale Gateway + Parallels Chrome

Je hebt geen volledige OpenClaw Gateway of model-API-sleutel in een macOS-VM nodig
alleen om de VM eigenaar van Chrome te laten zijn. Voer de Gateway en agent lokaal uit en voer daarna een
node-host in de VM uit. Schakel de gebundelde plugin eenmaal in op de VM, zodat de node
de Chrome-opdracht adverteert:

Wat waar draait:

- Gateway-host: OpenClaw Gateway, agentwerkruimte, model-/API-sleutels, realtime-
  provider en de Google Meet-pluginconfiguratie.
- Parallels macOS-VM: OpenClaw CLI/node-host, Google Chrome, SoX, BlackHole 2ch,
  en een Chrome-profiel dat bij Google is aangemeld.
- Niet nodig in de VM: Gateway-service, agentconfiguratie, OpenAI/GPT-sleutel of model-
  providerconfiguratie.

Installeer de VM-afhankelijkheden:

```bash
brew install blackhole-2ch sox
```

Herstart de VM na het installeren van BlackHole, zodat macOS `BlackHole 2ch` beschikbaar maakt:

```bash
sudo reboot
```

Controleer na het herstarten of de VM het audioapparaat en de SoX-opdrachten kan zien:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Installeer of update OpenClaw in de VM en schakel daarna de gebundelde plugin daar in:

```bash
openclaw plugins enable google-meet
```

Start de node-host in de VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Als `<gateway-host>` een LAN-IP is en je geen TLS gebruikt, weigert de node de
plaintext WebSocket tenzij je je aanmeldt voor dat vertrouwde privénetwerk:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gebruik dezelfde omgevingsvariabele wanneer je de node als LaunchAgent installeert:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` is procesomgeving, geen
`openclaw.json`-instelling. `openclaw node install` slaat deze op in de LaunchAgent-
omgeving wanneer deze aanwezig is op de installatieopdracht.

Keur de node goed vanaf de Gateway-host:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Bevestig dat de Gateway de node ziet en dat deze zowel `googlemeet.chrome`
als browsercapability/`browser.proxy` adverteert:

```bash
openclaw nodes status
```

Route Meet via die node op de Gateway-host:

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

Voor een smoke-test met één opdracht die een sessie maakt of hergebruikt, een bekende
zin uitspreekt en sessiestatus afdrukt:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Tijdens realtime-deelname vult OpenClaw-browserautomatisering de gastnaam in, klikt op
Join/Ask to join en accepteert Meet's eerste-run-keuze "Use microphone" wanneer die
prompt verschijnt. Tijdens observe-only deelname of browser-only vergaderaanmaak gaat deze
voorbij dezelfde prompt zonder microfoon wanneer die keuze beschikbaar is.
Als het browserprofiel niet is aangemeld, Meet wacht op toelating door de host,
Chrome microfoon-/cameramachtiging nodig heeft voor een realtime-deelname, of Meet vastzit
op een prompt die automatisering niet kon oplossen, rapporteert het join/test-speech-resultaat
`manualActionRequired: true` met `manualActionReason` en
`manualActionMessage`. Agents moeten stoppen met opnieuw proberen deel te nemen, exact dat
bericht plus de huidige `browserUrl`/`browserTitle` rapporteren en pas opnieuw proberen nadat de
handmatige browseractie is voltooid.

Als `chromeNode.node` is weggelaten, selecteert OpenClaw alleen automatisch wanneer precies één
verbonden node zowel `googlemeet.chrome` als browserbesturing adverteert. Als
meerdere geschikte nodes zijn verbonden, stel `chromeNode.node` dan in op de node-id,
weergavenaam of remote IP.

Veelvoorkomende foutcontroles:

- `Configured Google Meet node ... is not usable: offline`: de vastgepinde node is
  bekend bij de Gateway, maar niet beschikbaar. Agents moeten die node behandelen
  als diagnostische toestand, niet als een bruikbare Chrome-host, en de
  installatieblokkade melden in plaats van terug te vallen op een ander
  transport, tenzij de gebruiker daarom heeft gevraagd.
- `No connected Google Meet-capable node`: start `openclaw node run` in de VM,
  keur de koppeling goed, en zorg dat `openclaw plugins enable google-meet` en
  `openclaw plugins enable browser` in de VM zijn uitgevoerd. Bevestig ook dat de
  Gateway-host beide node-opdrachten toestaat met
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: installeer `blackhole-2ch` op de host
  die wordt gecontroleerd en herstart voordat je lokale Chrome-audio gebruikt.
- `BlackHole 2ch audio device not found on the node`: installeer `blackhole-2ch`
  in de VM en herstart de VM.
- Chrome wordt geopend maar kan niet deelnemen: meld je aan bij het
  browserprofiel binnen de VM, of houd `chrome.guestName` ingesteld voor
  deelnemen als gast. Automatisch deelnemen als gast gebruikt OpenClaw
  browserautomatisering via de node-browserproxy; zorg dat de node-browserconfig
  wijst naar het gewenste profiel, bijvoorbeeld
  `browser.defaultProfile: "user"` of een genoemd profiel met bestaande sessie.
- Dubbele Meet-tabbladen: laat `chrome.reuseExistingTab: true` ingeschakeld.
  OpenClaw activeert een bestaand tabblad voor dezelfde Meet-URL voordat een
  nieuw tabblad wordt geopend, en het aanmaken van vergaderingen via de browser
  hergebruikt een lopend `https://meet.google.com/new`-tabblad of een tabblad
  met Google-accountprompt voordat er nog een wordt geopend.
- Geen audio: routeer in Meet microfoon-/luidsprekeraudio via het pad van het
  virtuele audioapparaat dat door OpenClaw wordt gebruikt; gebruik afzonderlijke
  virtuele apparaten of routering in Loopback-stijl voor schone duplexaudio.

## Installatieopmerkingen

De Chrome-realtime-standaard gebruikt twee externe tools:

- `sox`: opdrachtregelhulpprogramma voor audio. De Plugin gebruikt expliciete
  CoreAudio-apparaatopdrachten voor de standaard 24 kHz PCM16-audiobridge.
- `blackhole-2ch`: virtuele audiodriver voor macOS. Deze maakt het
  audioapparaat `BlackHole 2ch` aan waar Chrome/Meet doorheen kan routeren.

OpenClaw bundelt of verspreidt geen van beide pakketten. De documentatie vraagt
gebruikers ze als hostafhankelijkheden via Homebrew te installeren. SoX heeft de
licentie `LGPL-2.0-only AND GPL-2.0-only`; BlackHole is GPL-3.0. Als je een
installer of appliance bouwt die BlackHole met OpenClaw bundelt, controleer dan
de upstream licentievoorwaarden van BlackHole of verkrijg een afzonderlijke
licentie van Existential Audio.

## Transporten

### Chrome

Chrome-transport opent de Meet-URL via OpenClaw browserbesturing en neemt deel
als het aangemelde OpenClaw browserprofiel. Op macOS controleert de Plugin vóór
het starten op `BlackHole 2ch`. Indien geconfigureerd voert deze ook een
gezondheidsopdracht voor de audiobridge en een opstartopdracht uit voordat
Chrome wordt geopend. Gebruik `chrome` wanneer Chrome/audio op de Gateway-host
draaien; gebruik `chrome-node` wanneer Chrome/audio op een gekoppelde node staan,
zoals een Parallels macOS-VM. Kies voor lokale Chrome het profiel met
`browser.defaultProfile`; `chrome.browserProfile` wordt doorgegeven aan
`chrome-node`-hosts.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Routeer Chrome-microfoon- en luidsprekeraudio via de lokale OpenClaw
audiobridge. Als `BlackHole 2ch` niet is geïnstalleerd, mislukt deelname met een
installatiefout in plaats van stilzwijgend deel te nemen zonder audiopad.

### Twilio

Twilio-transport is een strikt belplan dat is gedelegeerd aan de Voice Call
Plugin. Het parseert geen Meet-pagina's voor telefoonnummers.

Gebruik dit wanneer deelname via Chrome niet beschikbaar is of wanneer je een
telefonische fallback wilt. Google Meet moet een telefoonnummer en pincode voor
inbellen voor de vergadering beschikbaar stellen; OpenClaw ontdekt die niet via
de Meet-pagina.

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

Geef Twilio-referenties op via de omgeving of config. De omgeving houdt geheimen
uit `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Herstart of herlaad de Gateway na het inschakelen van `voice-call`;
Plugin-configwijzigingen verschijnen pas in een al draaiend Gateway-proces nadat
het opnieuw is geladen.

Verifieer daarna:

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

Gebruik `--dtmf-sequence` wanneer de vergadering een aangepaste reeks nodig
heeft:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth en preflight

OAuth is optioneel voor het aanmaken van een Meet-link, omdat
`googlemeet create` kan terugvallen op browserautomatisering. Configureer OAuth
wanneer je officiële API-aanmaak, space-resolutie of Meet Media API
preflight-controles wilt.

Google Meet API-toegang gebruikt gebruikers-OAuth: maak een Google Cloud
OAuth-client aan, vraag de vereiste scopes aan, autoriseer een Google-account en
sla daarna het resulterende vernieuwingstoken op in de Google Meet
Plugin-config of geef de omgevingsvariabelen `OPENCLAW_GOOGLE_MEET_*` op.

OAuth vervangt het Chrome-deelnamepad niet. Chrome- en Chrome-node-transporten
nemen nog steeds deel via een aangemeld Chrome-profiel, BlackHole/SoX en een
verbonden node wanneer je browserdeelname gebruikt. OAuth is alleen voor het
officiële Google Meet API-pad: vergaderruimten aanmaken, ruimten oplossen en
Meet Media API preflight-controles uitvoeren.

### Google-referenties aanmaken

In Google Cloud Console:

1. Maak of selecteer een Google Cloud-project.
2. Schakel **Google Meet REST API** in voor dat project.
3. Configureer het OAuth-toestemmingsscherm.
   - **Internal** is het eenvoudigst voor een Google Workspace-organisatie.
   - **External** werkt voor persoonlijke/testopstellingen; voeg, terwijl de app
     in Testing staat, elk Google-account dat de app zal autoriseren toe als
     testgebruiker.
4. Voeg de scopes toe die OpenClaw aanvraagt:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Maak een OAuth-client-ID.
   - Applicatietype: **Web application**.
   - Geautoriseerde omleidings-URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Kopieer de client-ID en het clientgeheim.

`meetings.space.created` is vereist door Google Meet `spaces.create`.
`meetings.space.readonly` laat OpenClaw Meet-URL's/-codes naar ruimten oplossen.
`meetings.conference.media.readonly` is voor Meet Media API preflight en
mediawerk; Google kan Developer Preview-inschrijving vereisen voor daadwerkelijk
Media API-gebruik. Als je alleen browsergebaseerde Chrome-deelname nodig hebt,
sla OAuth dan volledig over.

### Het vernieuwingstoken minten

Configureer `oauth.clientId` en optioneel `oauth.clientSecret`, of geef ze door
als omgevingsvariabelen, en voer daarna uit:

```bash
openclaw googlemeet auth login --json
```

De opdracht print een `oauth`-configblok met een vernieuwingstoken. Deze gebruikt
PKCE, een localhost-callback op `http://localhost:8085/oauth2callback`, en een
handmatige kopieer/plak-flow met `--manual`.

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

Sla het `oauth`-object op onder de Google Meet Plugin-config:

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

Geef de voorkeur aan omgevingsvariabelen wanneer je het vernieuwingstoken niet
in config wilt hebben. Als zowel config- als omgevingswaarden aanwezig zijn,
lost de Plugin eerst config op en gebruikt daarna omgeving als fallback.

De OAuth-toestemming omvat het aanmaken van Meet-ruimten, leestoegang tot
Meet-ruimten en leestoegang tot Meet-conferentiemedia. Als je je hebt
geauthenticeerd voordat ondersteuning voor het aanmaken van vergaderingen
bestond, voer dan `openclaw googlemeet auth login --json` opnieuw uit zodat het
vernieuwingstoken de scope `meetings.space.created` heeft.

### OAuth verifiëren met doctor

Voer de OAuth-doctor uit wanneer je een snelle gezondheidscontrole zonder
geheimen wilt:

```bash
openclaw googlemeet doctor --oauth --json
```

Dit laadt de Chrome-runtime niet en vereist geen verbonden Chrome-node. Het
controleert of OAuth-config bestaat en of het vernieuwingstoken een
toegangstoken kan minten. Het JSON-rapport bevat alleen statusvelden zoals
`ok`, `configured`, `tokenSource`, `expiresAt` en controleberichten; het print
het toegangstoken, vernieuwingstoken of clientgeheim niet.

Veelvoorkomende resultaten:

| Controle             | Betekenis                                                                              |
| -------------------- | -------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` plus `oauth.refreshToken`, of een gecachet toegangstoken, is aanwezig. |
| `oauth-token`        | Het gecachte toegangstoken is nog geldig, of het vernieuwingstoken heeft een nieuw toegangstoken gemint. |
| `meet-spaces-get`    | Optionele `--meeting`-controle heeft een bestaande Meet-ruimte opgelost.                |
| `meet-spaces-create` | Optionele `--create-space`-controle heeft een nieuwe Meet-ruimte aangemaakt.            |

Om ook inschakeling van Google Meet API en de scope `spaces.create` te bewijzen,
voer je de aanmaakcontrole met neveneffect uit:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` maakt een tijdelijke Meet-URL aan. Gebruik dit wanneer je moet
bevestigen dat het Google Cloud-project de Meet API heeft ingeschakeld en dat
het geautoriseerde account de scope `meetings.space.created` heeft.

Om leestoegang voor een bestaande vergaderruimte te bewijzen:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` en `resolve-space` bewijzen leestoegang tot een
bestaande ruimte waartoe het geautoriseerde Google-account toegang heeft. Een
`403` van deze controles betekent meestal dat de Google Meet REST API is
uitgeschakeld, dat het toegestemde vernieuwingstoken de vereiste scope mist, of
dat het Google-account geen toegang heeft tot die Meet-ruimte. Een fout met het
vernieuwingstoken betekent dat je `openclaw googlemeet auth login --json`
opnieuw moet uitvoeren en het nieuwe `oauth`-blok moet opslaan.

Er zijn geen OAuth-referenties nodig voor de browserfallback. In die modus komt
Google-auth van het aangemelde Chrome-profiel op de geselecteerde node, niet uit
OpenClaw-config.

Deze omgevingsvariabelen worden geaccepteerd als fallbacks:

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

Voer preflight uit vóór mediawerk:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Geef vergaderartefacten en aanwezigheid weer nadat Meet conferentierecords heeft aangemaakt:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Met `--meeting` gebruiken `artifacts` en `attendance` standaard het nieuwste
conferentierecord. Geef `--all-conference-records` door wanneer je elk bewaard
record voor die vergadering wilt.

Kalenderopzoeking kan de vergader-URL vanuit Google Calendar oplossen voordat
Meet-artefacten worden gelezen:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` doorzoekt de `primary` kalender van vandaag naar een Calendar-afspraak
met een Google Meet-link. Gebruik `--event <query>` om overeenkomende afspraaktekst
te doorzoeken, en `--calendar <id>` voor een niet-primaire kalender. Kalenderopzoeking
vereist een nieuwe OAuth-login die de alleen-lezen scope voor Calendar-afspraken
bevat. `calendar-events` toont een voorbeeld van de overeenkomende Meet-afspraken
en markeert de afspraak die `latest`, `artifacts`, `attendance` of `export` zal kiezen.

Als je de conferentierecord-id al weet, adresseer die dan rechtstreeks:

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

`artifacts` retourneert metadata van conferentierecords plus metadata van
deelnemers-, opname-, transcript-, gestructureerde transcript-item- en
smart-note-resources wanneer Google die voor de vergadering beschikbaar maakt.
Gebruik `--no-transcript-entries` om itemopzoeking voor grote vergaderingen over
te slaan. `attendance` breidt deelnemers uit naar rijen met deelnemerssessies,
met eerste/laatste gezien-tijden, totale sessieduur, vlaggen voor laat aankomen
en vroeg vertrekken, en dubbele deelnemerresources samengevoegd op basis van
ingelogde gebruiker of weergavenaam. Geef `--no-merge-duplicates` door om ruwe
deelnemerresources gescheiden te houden, `--late-after-minutes` om laatdetectie
af te stemmen, en `--early-before-minutes` om detectie van vroeg vertrek af te
stemmen.

`export` schrijft een map met `summary.md`, `attendance.csv`, `transcript.md`,
`artifacts.json`, `attendance.json` en `manifest.json`. `manifest.json` registreert
de gekozen invoer, exportopties, conferentierecords, uitvoerbestanden, aantallen,
tokenbron, Calendar-afspraak wanneer er een is gebruikt, en eventuele waarschuwingen
over gedeeltelijk ophalen. Geef `--zip` door om ook een draagbaar archief naast
de map te schrijven. Geef `--include-doc-bodies` door om gekoppelde transcript-
en smart-note-Google Docs-tekst te exporteren via Google Drive `files.export`;
dit vereist een nieuwe OAuth-login die de alleen-lezen scope voor Drive Meet bevat.
Zonder `--include-doc-bodies` bevatten exports alleen Meet-metadata en
gestructureerde transcript-items. Als Google een gedeeltelijke artefactfout
retourneert, zoals een fout bij smart-note-vermelding, transcript-item of
Drive-documentinhoud, bewaren de samenvatting en het manifest de waarschuwing
in plaats van de volledige export te laten mislukken. Gebruik `--dry-run` om
dezelfde artefact-/aanwezigheidsgegevens op te halen en de manifest-JSON af te
drukken zonder de map of ZIP te maken. Dat is handig voordat je een grote export
schrijft of wanneer een agent alleen aantallen, geselecteerde records en
waarschuwingen nodig heeft.

Agenten kunnen dezelfde bundel ook maken via de `google_meet`-tool:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Stel `"dryRun": true` in om alleen het exportmanifest te retourneren en
bestandsschrijfacties over te slaan.

Voer de bewaakte live-smoke uit tegen een echte bewaarde vergadering:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Live-smoke-omgeving:

- `OPENCLAW_LIVE_TEST=1` schakelt bewaakte live-tests in.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` verwijst naar een bewaarde Meet-URL, code of
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` of `GOOGLE_MEET_CLIENT_ID` levert de OAuth
  client-id.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` of `GOOGLE_MEET_REFRESH_TOKEN` levert
  de refresh-token.
- Optioneel: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` en
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` gebruiken dezelfde fallbacknamen
  zonder het `OPENCLAW_`-voorvoegsel.

De basis-live-smoke voor artefacten/aanwezigheid heeft
`https://www.googleapis.com/auth/meetings.space.readonly` en
`https://www.googleapis.com/auth/meetings.conference.media.readonly` nodig.
Kalenderopzoeking heeft `https://www.googleapis.com/auth/calendar.events.readonly`
nodig. Drive-export van documentinhoud heeft
`https://www.googleapis.com/auth/drive.meet.readonly` nodig.

Maak een nieuwe Meet-ruimte:

```bash
openclaw googlemeet create
```

De opdracht drukt de nieuwe `meeting uri`, bron en joinsessie af. Met OAuth-
referenties gebruikt deze de officiële Google Meet-API. Zonder OAuth-referenties
gebruikt deze als fallback het ingelogde browserprofiel van de vastgepinde
Chrome-node. Agenten kunnen de `google_meet`-tool gebruiken met `action: "create"`
om in één stap te maken en te joinen. Geef voor alleen URL-aanmaak `"join": false`
door.

Voorbeeld van JSON-uitvoer vanuit de browserfallback:

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

Als de browserfallback een Google-login of Meet-machtigingsblokkade tegenkomt
voordat de URL kan worden gemaakt, retourneert de Gateway-methode een mislukte
respons en retourneert de `google_meet`-tool gestructureerde details in plaats
van een platte tekenreeks:

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
`manualActionMessage` plus de browser-node-/tabcontext melden en stoppen met
het openen van nieuwe Meet-tabs totdat de operator de browserstap voltooit.

Voorbeeld van JSON-uitvoer vanuit API-aanmaak:

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

Een Meet maken joint standaard. Het Chrome- of Chrome-node-transport heeft nog
steeds een ingelogd Google Chrome-profiel nodig om via de browser te joinen.
Als het profiel is uitgelogd, meldt OpenClaw `manualActionRequired: true` of
een browserfallbackfout en vraagt de operator om Google-login te voltooien
voordat opnieuw wordt geprobeerd.

Stel `preview.enrollmentAcknowledged: true` alleen in nadat je hebt bevestigd
dat je Cloud-project, OAuth-principal en vergaderdeelnemers zijn ingeschreven
voor het Google Workspace Developer Preview Program voor Meet-media-API's.

## Configuratie

Het algemene realtime-pad van Chrome heeft alleen de ingeschakelde Plugin,
BlackHole, SoX en een backend-sleutel voor een realtime-spraakprovider nodig.
OpenAI is de standaard; stel `realtime.provider: "google"` in om Google Gemini Live
te gebruiken:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Stel de Plugin-configuratie in onder `plugins.entries.google-meet.config`:

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

Standaardwaarden:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: optionele node-id/naam/IP voor `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: naam gebruikt op het Meet-gastscherm
  voor uitgelogde gebruikers
- `chrome.autoJoin: true`: best-effort invullen van gastnaam en klikken op Join Now
  via OpenClaw-browserautomatisering op `chrome-node`
- `chrome.reuseExistingTab: true`: activeer een bestaande Meet-tab in plaats van
  duplicaten te openen
- `chrome.waitForInCallMs: 20000`: wacht tot de Meet-tab meldt dat deze in-call is
  voordat de realtime-intro wordt geactiveerd
- `chrome.audioFormat: "pcm16-24khz"`: audioformaat voor opdrachtparen. Gebruik
  `"g711-ulaw-8khz"` alleen voor legacy/aangepaste opdrachtparen die nog steeds
  telefonie-audio uitsturen.
- `chrome.audioInputCommand`: SoX-opdracht die leest uit CoreAudio `BlackHole 2ch`
  en audio schrijft in `chrome.audioFormat`
- `chrome.audioOutputCommand`: SoX-opdracht die audio leest in `chrome.audioFormat`
  en schrijft naar CoreAudio `BlackHole 2ch`
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: korte gesproken antwoorden, met
  `openclaw_agent_consult` voor diepere antwoorden
- `realtime.introMessage`: korte gesproken gereedheidscontrole wanneer de realtime-bridge
  verbindt; stel dit in op `""` om stil te joinen
- `realtime.agentId`: optionele OpenClaw-agent-id voor
  `openclaw_agent_consult`; standaard `main`

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

`voiceCall.enabled` is standaard `true`; met Twilio-transport delegeert dit
de daadwerkelijke PSTN-oproep en DTMF aan de Voice Call-Plugin. Als `voice-call`
niet is ingeschakeld, kan Google Meet het belplan nog steeds valideren en
vastleggen, maar kan het de Twilio-oproep niet plaatsen.

## Tool

Agenten kunnen de `google_meet`-tool gebruiken:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Gebruik `transport: "chrome"` wanneer Chrome op de Gateway-host draait. Gebruik
`transport: "chrome-node"` wanneer Chrome op een gekoppelde Node draait, zoals een Parallels
VM. In beide gevallen draaien het realtime-model en `openclaw_agent_consult` op de
Gateway-host, zodat modelreferenties daar blijven.

Gebruik `action: "status"` om actieve sessies weer te geven of een sessie-ID te inspecteren. Gebruik
`action: "speak"` met `sessionId` en `message` om de realtime-agent
direct te laten spreken. Gebruik `action: "test_speech"` om de sessie te maken of opnieuw te gebruiken,
een bekende zin te activeren en `inCall`-status terug te geven wanneer de Chrome-host die kan
rapporteren. `test_speech` forceert altijd `mode: "realtime"` en mislukt als wordt gevraagd om
te draaien in `mode: "transcribe"` omdat observe-only-sessies bewust geen
spraak kunnen uitsturen. Het resultaat `speechOutputVerified` is gebaseerd op realtime-audio-uitvoerbytes
die tijdens deze testaanroep toenemen, dus een hergebruikte sessie met oudere audio
telt niet als een nieuwe geslaagde spraakcontrole. Gebruik `action: "leave"` om
een sessie als beëindigd te markeren.

`status` bevat Chrome-status wanneer beschikbaar:

- `inCall`: Chrome lijkt zich in het Meet-gesprek te bevinden
- `micMuted`: best-effort Meet-microfoonstatus
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: het
  browserprofiel heeft handmatige aanmelding, toelating door de Meet-host, machtigingen of
  herstel van browserbesturing nodig voordat spraak kan werken
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: of
  beheerde Chrome-spraak nu is toegestaan. `speechReady: false` betekent dat OpenClaw
  de intro-/testzin niet naar de audiobrug heeft gestuurd.
- `providerConnected` / `realtimeReady`: status van de realtime-spraakbrug
- `lastInputAt` / `lastOutputAt`: laatste audio die van of naar de brug is gezien

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Realtime-agentconsult

De realtime-modus van Chrome is geoptimaliseerd voor een live spraaklus. De realtime-spraak
provider hoort de vergaderaudio en spreekt via de geconfigureerde audiobrug.
Wanneer het realtime-model diepere redenering, actuele informatie of normale
OpenClaw-tools nodig heeft, kan het `openclaw_agent_consult` aanroepen.

De consulttool draait de reguliere OpenClaw-agent op de achtergrond met recente
context uit het vergaderingstranscript en geeft een beknopt gesproken antwoord terug aan de realtime-
spraaksessie. Het spraakmodel kan dat antwoord vervolgens terugspreken in de vergadering.
Het gebruikt dezelfde gedeelde realtime-consulttool als Voice Call.

Standaard draaien consults tegen de `main`-agent. Stel `realtime.agentId` in wanneer een
Meet-lane een speciale OpenClaw-agentwerkruimte, modelstandaarden,
toolbeleid, geheugen en sessiegeschiedenis moet raadplegen.

`realtime.toolPolicy` beheert de consult-run:

- `safe-read-only`: stel de consulttool beschikbaar en beperk de reguliere agent tot
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` en
  `memory_get`.
- `owner`: stel de consulttool beschikbaar en laat de reguliere agent het normale
  agenttoolbeleid gebruiken.
- `none`: stel de consulttool niet beschikbaar aan het realtime-spraakmodel.

De consultsessiesleutel is per Meet-sessie afgebakend, zodat vervolgconsultaanroepen
eerdere consultcontext tijdens dezelfde vergadering kunnen hergebruiken.

Om een gesproken gereedheidscontrole te forceren nadat Chrome volledig aan het gesprek heeft deelgenomen:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Voor de volledige join-and-speak-smoke:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Checklist voor livetests

Gebruik deze reeks voordat je een vergadering overdraagt aan een onbeheerde agent:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Verwachte Chrome-node-status:

- `googlemeet setup` is volledig groen.
- `googlemeet setup` bevat `chrome-node-connected` wanneer Chrome-node het
  standaardtransport is of een Node is vastgepind.
- `nodes status` toont dat de geselecteerde Node verbonden is.
- De geselecteerde Node adverteert zowel `googlemeet.chrome` als `browser.proxy`.
- Het Meet-tabblad neemt deel aan het gesprek en `test-speech` retourneert Chrome-status met
  `inCall: true`.

Voor een externe Chrome-host zoals een Parallels macOS-VM is dit de kortste
veilige controle na het bijwerken van de Gateway of de VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Dat bewijst dat de Gateway-Plugin is geladen, de VM-Node verbonden is met het
huidige token en de Meet-audiobrug beschikbaar is voordat een agent een
echt vergaderingstabblad opent.

Voor een Twilio-smoke gebruik je een vergadering die telefonische inbelgegevens toont:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Verwachte Twilio-status:

- `googlemeet setup` bevat groene controles voor `twilio-voice-call-plugin` en
  `twilio-voice-call-credentials`.
- `voicecall` is beschikbaar in de CLI na het herladen van de Gateway.
- De geretourneerde sessie heeft `transport: "twilio"` en een `twilio.voiceCallId`.
- `googlemeet leave <sessionId>` hangt het gedelegeerde spraakgesprek op.

## Probleemoplossing

### Agent kan de Google Meet-tool niet zien

Controleer of de Plugin is ingeschakeld in de Gateway-configuratie en herlaad de Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Als je zojuist `plugins.entries.google-meet` hebt bewerkt, herstart of herlaad dan de Gateway.
De actieve agent ziet alleen Plugintools die door het huidige Gateway-
proces zijn geregistreerd.

### Geen verbonden Google Meet-geschikte Node

Voer op de Node-host uit:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Keur op de Gateway-host de Node goed en verifieer opdrachten:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

De Node moet verbonden zijn en `googlemeet.chrome` plus `browser.proxy` tonen.
De Gateway-configuratie moet die Node-opdrachten toestaan:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Als `googlemeet setup` faalt op `chrome-node-connected` of het Gateway-log
`gateway token mismatch` meldt, installeer of herstart de Node dan met het huidige Gateway-
token. Voor een LAN-Gateway betekent dit meestal:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Herlaad daarna de Node-service en voer opnieuw uit:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Browser opent maar agent kan niet deelnemen

Voer `googlemeet test-speech` uit en inspecteer de geretourneerde Chrome-status. Als die
`manualActionRequired: true` meldt, toon dan `manualActionMessage` aan de operator
en stop met opnieuw proberen totdat de browseractie is voltooid.

Veelvoorkomende handmatige acties:

- Meld je aan bij het Chrome-profiel.
- Laat de gast toe vanuit het Meet-hostaccount.
- Verleen Chrome-microfoon-/cameramachtigingen wanneer de native machtigingsprompt van Chrome
  verschijnt.
- Sluit of herstel een vastgelopen Meet-machtigingsdialoog.

Meld niet "not signed in" alleen omdat Meet "Do you want people to
hear you in the meeting?" toont. Dat is het audio-keuzescherm van Meet; OpenClaw
klikt **Use microphone** via browserautomatisering wanneer beschikbaar en blijft
wachten op de echte vergaderingstatus. Voor de create-only-browserfallback kan OpenClaw
**Continue without microphone** klikken omdat het maken van de URL het
realtime-audiopad niet nodig heeft.

### Vergadering maken mislukt

`googlemeet create` gebruikt eerst het Google Meet API-eindpunt `spaces.create`
wanneer OAuth-referenties zijn geconfigureerd. Zonder OAuth-referenties valt het terug
op de vastgepinde Chrome-Node-browser. Controleer:

- Voor API-aanmaak: `oauth.clientId` en `oauth.refreshToken` zijn geconfigureerd,
  of overeenkomende omgevingsvariabelen `OPENCLAW_GOOGLE_MEET_*` zijn aanwezig.
- Voor API-aanmaak: het vernieuwingstoken is uitgegeven nadat ondersteuning voor aanmaken is
  toegevoegd. Oudere tokens kunnen de scope `meetings.space.created` missen; voer
  `openclaw googlemeet auth login --json` opnieuw uit en werk de Pluginconfiguratie bij.
- Voor browserfallback: `defaultTransport: "chrome-node"` en
  `chromeNode.node` wijzen naar een verbonden Node met `browser.proxy` en
  `googlemeet.chrome`.
- Voor browserfallback: het OpenClaw Chrome-profiel op die Node is aangemeld
  bij Google en kan `https://meet.google.com/new` openen.
- Voor browserfallback: nieuwe pogingen hergebruiken een bestaand tabblad met `https://meet.google.com/new`
  of een Google-accountprompt voordat een nieuw tabblad wordt geopend. Als een agent een timeout krijgt,
  probeer de toolaanroep opnieuw in plaats van handmatig een ander Meet-tabblad te openen.
- Voor browserfallback: als de tool `manualActionRequired: true` retourneert, gebruik dan
  de geretourneerde `browser.nodeId`, `browser.targetId`, `browserUrl` en
  `manualActionMessage` om de operator te begeleiden. Probeer niet in een lus opnieuw totdat die
  actie is voltooid.
- Voor browserfallback: als Meet "Do you want people to hear you in the
  meeting?" toont, laat het tabblad open. OpenClaw zou **Use microphone** moeten klikken of, voor
  create-only-fallback, **Continue without microphone** via browser-
  automatisering en blijven wachten op de gegenereerde Meet-URL. Als dat niet kan, moet de
  fout `meet-audio-choice-required` vermelden, niet `google-login-required`.

### Agent neemt deel maar praat niet

Controleer het realtime-pad:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Gebruik `mode: "realtime"` voor luisteren/terugspreken. `mode: "transcribe"` start bewust
niet de duplex realtime-spraakbrug. `googlemeet test-speech`
controleert altijd het realtime-pad en rapporteert of bruguitvoerbytes voor die
aanroep zijn waargenomen. Als `speechOutputVerified` false is en
`speechOutputTimedOut` true is, heeft de realtime-provider de
uiting mogelijk geaccepteerd, maar heeft OpenClaw geen nieuwe uitvoerbytes de Chrome-audio
brug zien bereiken.

Verifieer ook:

- Een realtime-providersleutel is beschikbaar op de Gateway-host, zoals
  `OPENAI_API_KEY` of `GEMINI_API_KEY`.
- `BlackHole 2ch` is zichtbaar op de Chrome-host.
- `sox` bestaat op de Chrome-host.
- Meet-microfoon en -speaker worden gerouteerd via het virtuele audiopad dat door
  OpenClaw wordt gebruikt.

`googlemeet doctor [session-id]` print de sessie, Node, in-call-status,
reden voor handmatige actie, realtime-providerverbinding, `realtimeReady`, audio-
input-/outputactiviteit, laatste audiotijdstempels, byte-tellers en browser-URL.
Gebruik `googlemeet status [session-id]` wanneer je de ruwe JSON nodig hebt. Gebruik
`googlemeet doctor --oauth` wanneer je Google Meet OAuth-vernieuwing moet verifiëren
zonder tokens bloot te stellen; voeg `--meeting` of `--create-space` toe wanneer je ook een
Google Meet API-bewijs nodig hebt.

Als een agent een timeout heeft gekregen en je ziet al een Meet-tabblad openstaan, inspecteer dat tabblad
zonder een ander te openen:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

De equivalente toolactie is `recover_current_tab`. Deze focust en inspecteert een
bestaand Meet-tabblad voor het geselecteerde transport. Met `chrome` gebruikt deze lokale
browserbesturing via de Gateway; met `chrome-node` gebruikt deze de geconfigureerde
Chrome-Node. De actie opent geen nieuw tabblad en maakt geen nieuwe sessie; ze rapporteert de
huidige blokkade, zoals aanmelding, toelating, machtigingen of audio-keuzestatus.
De CLI-opdracht praat met de geconfigureerde Gateway, dus de Gateway moet actief zijn;
`chrome-node` vereist ook dat de Chrome-Node verbonden is.

### Twilio-setupcontroles mislukken

`twilio-voice-call-plugin` faalt wanneer `voice-call` niet is toegestaan of niet is ingeschakeld.
Voeg dit toe aan `plugins.allow`, schakel `plugins.entries.voice-call` in en laad de
Gateway opnieuw.

`twilio-voice-call-credentials` faalt wanneer de Twilio-backend geen account-
SID, auth-token of afzendernummer heeft. Stel deze in op de Gateway-host:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Start of laad daarna de Gateway opnieuw en voer uit:

```bash
openclaw googlemeet setup
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` controleert standaard alleen de gereedheid. Om een specifiek nummer als dry-run te testen:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Voeg `--yes` alleen toe wanneer je bewust een live uitgaande meldingsoproep
wilt plaatsen:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio-oproep start maar komt nooit in de vergadering

Controleer of de Meet-gebeurtenis telefonische inbelgegevens aanbiedt. Geef het exacte inbel-
nummer en de PIN of een aangepaste DTMF-reeks door:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Gebruik een voorafgaande `w` of komma's in `--dtmf-sequence` als de provider een pauze nodig heeft
voordat de PIN wordt ingevoerd.

## Notities

De officiële media-API van Google Meet is gericht op ontvangst, dus spreken in een Meet-
oproep heeft nog steeds een deelnemerspad nodig. Deze Plugin houdt die grens zichtbaar:
Chrome verzorgt browserdeelname en lokale audioroutering; Twilio verzorgt
deelname via telefonische inbelverbinding.

De realtime modus van Chrome heeft `BlackHole 2ch` nodig plus een van beide:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw beheert de
  realtime modelbrug en sluist audio in `chrome.audioFormat` tussen die
  opdrachten en de geselecteerde realtime spraakprovider. Het standaardpad van Chrome is
  24 kHz PCM16; 8 kHz G.711 mu-law blijft beschikbaar voor verouderde opdrachtparen.
- `chrome.audioBridgeCommand`: een externe brugopdracht beheert het volledige lokale
  audiopad en moet afsluiten nadat de daemon is gestart of gevalideerd.

Voor zuivere duplexaudio routeer je Meet-uitvoer en de Meet-microfoon via afzonderlijke
virtuele apparaten of een virtuele apparaatgrafiek in Loopback-stijl. Een enkel gedeeld
BlackHole-apparaat kan andere deelnemers terug de oproep in laten echoën.

`googlemeet speak` activeert de actieve realtime audiobrug voor een Chrome-
sessie. `googlemeet leave` stopt die brug. Voor Twilio-sessies die via de Voice Call Plugin zijn
gedelegeerd, hangt `leave` ook de onderliggende spraakoproep op.

## Gerelateerd

- [Voice Call Plugin](/nl/plugins/voice-call)
- [Praatmodus](/nl/nodes/talk)
- [Plugins bouwen](/nl/plugins/building-plugins)
