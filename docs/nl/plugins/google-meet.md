---
read_when:
    - Je wilt dat een OpenClaw-agent deelneemt aan een Google Meet-gesprek
    - Je wilt dat een OpenClaw-agent een nieuw Google Meet-gesprek aanmaakt
    - Je configureert Chrome, Chrome Node of Twilio als Google Meet-transport
summary: 'Google Meet Plugin: neem deel aan expliciete Meet-URL''s via Chrome of Twilio met standaardinstellingen voor realtime spraak'
title: Google Meet-Plugin
x-i18n:
    generated_at: "2026-05-01T11:21:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9d0d195fc709e487ef1bf5603fdb32fade1b6a0a13aa9bed5110979490f92ff
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet-deelnemersondersteuning voor OpenClaw — de plugin is bewust expliciet ontworpen:

- Deze sluit alleen aan bij een expliciete `https://meet.google.com/...`-URL.
- Deze kan via de Google Meet API een nieuwe Meet-ruimte maken en daarna aansluiten bij de
  geretourneerde URL.
- `realtime`-spraak is de standaardmodus.
- Realtime-spraak kan terugroepen naar de volledige OpenClaw-agent wanneer diepere
  redenering of tools nodig zijn.
- Agents kiezen het aansluitgedrag met `mode`: gebruik `realtime` voor live
  luisteren/terugpraten, of `transcribe` om aan te sluiten/de browser te bedienen zonder de
  realtime-spraakbrug.
- Auth begint als persoonlijke Google OAuth of een Chrome-profiel dat al is aangemeld.
- Er is geen automatische toestemmingsaankondiging.
- De standaard Chrome-audiobackend is `BlackHole 2ch`.
- Chrome kan lokaal of op een gekoppelde node-host draaien.
- Twilio accepteert een inbelnummer plus optionele pincode of DTMF-reeks.
- De CLI-opdracht is `googlemeet`; `meet` is gereserveerd voor bredere
  teleconferentieworkflows van agents.

## Snelstart

Installeer de lokale audioafhankelijkheden en configureer een backendprovider voor realtime-spraak.
OpenAI is de standaard; Google Gemini Live werkt ook met
`realtime.provider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

`blackhole-2ch` installeert het virtuele audioapparaat `BlackHole 2ch`. De installer van Homebrew
vereist een herstart voordat macOS het apparaat beschikbaar maakt:

```bash
sudo reboot
```

Controleer na de herstart beide onderdelen:

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

Controleer de setup:

```bash
openclaw googlemeet setup
```

De setup-uitvoer is bedoeld om leesbaar te zijn voor agents en bewust te zijn van de modus. Deze rapporteert het Chrome-
profiel, node-pinning en, voor realtime Chrome-aansluitingen, de BlackHole/SoX-audio-
brug en vertraagde realtime-introcontroles. Controleer voor alleen observerende aansluitingen hetzelfde
transport met `--mode transcribe`; die modus slaat realtime-audiovoorwaarden over
omdat deze niet via de brug luistert of spreekt:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Wanneer Twilio-delegatie is geconfigureerd, rapporteert setup ook of de
`voice-call`-plugin, Twilio-referenties en publieke Webhook-blootstelling gereed zijn.
Behandel elke `ok: false`-controle als een blokkade voor het gecontroleerde transport en de gecontroleerde modus
voordat je een agent vraagt aan te sluiten. Gebruik `openclaw googlemeet setup --json` voor
scripts of machineleesbare uitvoer. Gebruik `--transport chrome`,
`--transport chrome-node` of `--transport twilio` om een specifiek
transport vooraf te controleren voordat een agent het probeert.

Voor Twilio moet je het transport altijd expliciet vooraf controleren wanneer het standaardtransport
Chrome is:

```bash
openclaw googlemeet setup --transport twilio
```

Dat vangt ontbrekende `voice-call`-bedrading, Twilio-referenties of onbereikbare
Webhook-blootstelling op voordat de agent de vergadering probeert te bellen.

Sluit aan bij een vergadering:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Of laat een agent aansluiten via de `google_meet`-tool:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Maak een nieuwe vergadering en sluit erbij aan:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Maak alleen de URL zonder aan te sluiten:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` heeft twee paden:

- API-aanmaak: gebruikt wanneer Google Meet OAuth-referenties zijn geconfigureerd. Dit is
  het meest deterministische pad en is niet afhankelijk van de UI-status van de browser.
- Browser-fallback: gebruikt wanneer OAuth-referenties ontbreken. OpenClaw gebruikt de
  vastgezette Chrome-node, opent `https://meet.google.com/new`, wacht tot Google
  omleidt naar een echte URL met vergadercode en retourneert daarna die URL. Dit pad vereist
  dat het OpenClaw Chrome-profiel op de node al is aangemeld bij Google.
  Browserautomatisering handelt Meets eigen eerste microfoonprompt af; die prompt
  wordt niet behandeld als een mislukte Google-login.
  Aansluit- en aanmaakflows proberen ook een bestaand Meet-tabblad opnieuw te gebruiken voordat er een
  nieuw wordt geopend. Matching negeert onschuldige querystrings in URL's zoals `authuser`, zodat een
  nieuwe poging van een agent de al geopende vergadering zou moeten focussen in plaats van een tweede
  Chrome-tabblad te maken.

De opdracht-/tooluitvoer bevat een `source`-veld (`api` of `browser`), zodat agents
kunnen uitleggen welk pad is gebruikt. `create` sluit standaard aan bij de nieuwe vergadering en
retourneert `joined: true` plus de aansluitsessie. Gebruik
`create --no-join` in de CLI of geef `"join": false` door aan de tool om alleen de URL te maken.

Of vertel een agent: "Maak een Google Meet, sluit erbij aan met realtime-spraak en stuur
mij de link." De agent moet `google_meet` aanroepen met `action: "create"` en
daarna de geretourneerde `meetingUri` delen.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime"
}
```

Voor een alleen observerende/browserbedieningsaansluiting stel je `"mode": "transcribe"` in. Dat start
de duplex realtime-modelbrug niet, vereist geen BlackHole of SoX,
en praat niet terug in de vergadering. Chrome-aansluitingen in deze modus vermijden ook
OpenClaw's toekenning van microfoon-/cameratoestemming en vermijden het Meet-pad **Microfoon gebruiken**.
Als Meet een tussenvenster voor audiokeuze toont, probeert de automatisering
het pad zonder microfoon en rapporteert anders een handmatige actie in plaats van
de lokale microfoon te openen.

Tijdens realtime-sessies bevat de `google_meet`-status de gezondheid van de browser en audiobrug,
zoals `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, laatste invoer-/uitvoer-
tijdstempels, byte-tellers en gesloten status van de brug. Als er een veilige Meet-paginaprompt
verschijnt, handelt browserautomatisering die af wanneer dat kan. Login, hosttoelating en
browser-/OS-toestemmingsprompts worden gerapporteerd als handmatige actie met een reden en
bericht dat de agent kan doorgeven. Beheerde Chrome-sessies geven de intro of
testzin pas uit nadat browsergezondheid `inCall: true` rapporteert; anders rapporteert de status
`speechReady: false` en wordt de spreekpoging geblokkeerd in plaats van te doen alsof de
agent in de vergadering heeft gesproken.

Lokale Chrome-aansluitingen verlopen via het aangemelde OpenClaw-browserprofiel. Realtime-modus
vereist `BlackHole 2ch` voor het microfoon-/speakerpad dat door OpenClaw wordt gebruikt. Gebruik voor
schone duplex-audio afzonderlijke virtuele apparaten of een Loopback-achtige grafiek; een
enkel BlackHole-apparaat is genoeg voor een eerste smoketest, maar kan echo veroorzaken.

### Lokale Gateway + Parallels Chrome

Je hebt **geen** volledige OpenClaw Gateway of model-API-sleutel nodig in een macOS-VM
alleen om de VM eigenaar van Chrome te maken. Draai de Gateway en agent lokaal en draai daarna een
node-host in de VM. Schakel de gebundelde plugin één keer in op de VM, zodat de node
de Chrome-opdracht adverteert:

Wat waar draait:

- Gateway-host: OpenClaw Gateway, agentwerkruimte, model-/API-sleutels, realtime-
  provider en de Google Meet-pluginconfiguratie.
- Parallels macOS-VM: OpenClaw CLI/node-host, Google Chrome, SoX, BlackHole 2ch,
  en een Chrome-profiel dat bij Google is aangemeld.
- Niet nodig in de VM: Gateway-service, agentconfiguratie, OpenAI/GPT-sleutel of setup van de
  modelprovider.

Installeer de VM-afhankelijkheden:

```bash
brew install blackhole-2ch sox
```

Herstart de VM na het installeren van BlackHole, zodat macOS `BlackHole 2ch` beschikbaar maakt:

```bash
sudo reboot
```

Controleer na de herstart of de VM het audioapparaat en de SoX-opdrachten kan zien:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Installeer of werk OpenClaw bij in de VM en schakel daarna de gebundelde plugin daar in:

```bash
openclaw plugins enable google-meet
```

Start de node-host in de VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Als `<gateway-host>` een LAN-IP is en je geen TLS gebruikt, weigert de node de
platte WebSocket tenzij je daar expliciet voor kiest voor dat vertrouwde privénetwerk:

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
als browsermogelijkheid/`browser.proxy` adverteert:

```bash
openclaw nodes status
```

Routeer Meet via die node op de Gateway-host:

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

Sluit nu normaal aan vanaf de Gateway-host:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

of vraag de agent om de `google_meet`-tool te gebruiken met `transport: "chrome-node"`.

Voor een smoketest met één opdracht die een sessie maakt of hergebruikt, een bekende
zin uitspreekt en sessiegezondheid afdrukt:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Tijdens realtime-aansluiting vult OpenClaw-browserautomatisering de gastnaam in, klikt op
Deelnemen/Vragen om deel te nemen en accepteert Meets eerste keuze "Microfoon gebruiken" wanneer die
prompt verschijnt. Tijdens alleen observerend aansluiten of alleen-browser-vergaderaanmaak gaat deze
voorbij dezelfde prompt zonder microfoon wanneer die keuze beschikbaar is.
Als het browserprofiel niet is aangemeld, Meet wacht op hosttoelating,
Chrome microfoon-/cameratoestemming nodig heeft voor een realtime-aansluiting, of Meet vastzit
op een prompt die automatisering niet kon oplossen, rapporteert het join-/test-speech-resultaat
`manualActionRequired: true` met `manualActionReason` en
`manualActionMessage`. Agents moeten stoppen met opnieuw proberen aan te sluiten, dat exacte
bericht plus de huidige `browserUrl`/`browserTitle` rapporteren, en pas opnieuw proberen nadat de
handmatige browseractie is voltooid.

Als `chromeNode.node` is weggelaten, selecteert OpenClaw alleen automatisch wanneer precies één
verbonden node zowel `googlemeet.chrome` als browserbediening adverteert. Als
er meerdere geschikte nodes zijn verbonden, stel dan `chromeNode.node` in op de node-id,
weergavenaam of externe IP.

Veelvoorkomende foutcontroles:

- `Configured Google Meet node ... is not usable: offline`: de vastgezette node is
  bekend bij de Gateway maar niet beschikbaar. Agents moeten die node behandelen
  als diagnostische status, niet als een bruikbare Chrome-host, en de
  installatieblokkade melden in plaats van terug te vallen op een ander transport,
  tenzij de gebruiker daarom heeft gevraagd.
- `No connected Google Meet-capable node`: start `openclaw node run` in de VM,
  keur het koppelen goed en zorg dat `openclaw plugins enable google-meet` en
  `openclaw plugins enable browser` in de VM zijn uitgevoerd. Bevestig ook dat de
  Gateway-host beide node-opdrachten toestaat met
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: installeer `blackhole-2ch` op de host
  die wordt gecontroleerd en herstart voordat je lokale Chrome-audio gebruikt.
- `BlackHole 2ch audio device not found on the node`: installeer `blackhole-2ch`
  in de VM en herstart de VM.
- Chrome opent maar kan niet deelnemen: log in op het browserprofiel binnen de VM,
  of laat `chrome.guestName` ingesteld voor deelnemen als gast. Automatisch
  deelnemen als gast gebruikt OpenClaw-browserautomatisering via de node-browserproxy;
  zorg dat de node-browserconfiguratie verwijst naar het gewenste profiel, bijvoorbeeld
  `browser.defaultProfile: "user"` of een benoemd profiel voor een bestaande sessie.
- Dubbele Meet-tabbladen: laat `chrome.reuseExistingTab: true` ingeschakeld. OpenClaw
  activeert een bestaand tabblad voor dezelfde Meet-URL voordat een nieuw wordt geopend, en
  het maken van browservergaderingen hergebruikt een lopend `https://meet.google.com/new`
  of Google-accountprompttabblad voordat een ander wordt geopend.
- Geen audio: routeer in Meet microfoon-/luidsprekeraudio via het virtuele audioapparaatpad
  dat OpenClaw gebruikt; gebruik afzonderlijke virtuele apparaten of Loopback-achtige routing
  voor schone duplexaudio.

## Installatieopmerkingen

De realtime-standaard voor Chrome gebruikt twee externe tools:

- `sox`: opdrachtregel-audiohulpprogramma. De Plugin gebruikt expliciete CoreAudio-
  apparaatopdrachten voor de standaard 24 kHz PCM16-audiobrug.
- `blackhole-2ch`: virtuele audiodriver voor macOS. Deze maakt het `BlackHole 2ch`-
  audioapparaat dat Chrome/Meet kan routeren.

OpenClaw bundelt of herdistribueert geen van beide pakketten. De documentatie vraagt gebruikers
om ze via Homebrew als hostafhankelijkheden te installeren. SoX heeft de licentie
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole is GPL-3.0. Als je een
installatieprogramma of appliance bouwt die BlackHole met OpenClaw bundelt, controleer dan de
upstream licentievoorwaarden van BlackHole of verkrijg een afzonderlijke licentie van Existential Audio.

## Transporten

### Chrome

Chrome-transport opent de Meet-URL via OpenClaw-browserbesturing en neemt deel
als het ingelogde OpenClaw-browserprofiel. Op macOS controleert de Plugin voor
het starten op `BlackHole 2ch`. Indien geconfigureerd, voert deze ook een audiobrug-
gezondheidsopdracht en opstartopdracht uit voordat Chrome wordt geopend. Gebruik `chrome` wanneer
Chrome/audio op de Gateway-host draaien; gebruik `chrome-node` wanneer Chrome/audio draaien
op een gekoppelde node zoals een Parallels macOS-VM. Kies voor lokale Chrome het
profiel met `browser.defaultProfile`; `chrome.browserProfile` wordt doorgegeven aan
`chrome-node`-hosts.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Routeer Chrome-microfoon- en luidsprekeraudio via de lokale OpenClaw-audiobrug.
Als `BlackHole 2ch` niet is geïnstalleerd, mislukt het deelnemen met een installatiefout
in plaats van stilzwijgend deel te nemen zonder audiopad.

### Twilio

Twilio-transport is een strikt belplan dat is gedelegeerd aan de Voice Call-plugin. Het
parseert Meet-pagina's niet voor telefoonnummers.

Gebruik dit wanneer Chrome-deelname niet beschikbaar is of wanneer je een fallback voor
telefonisch inbellen wilt. Google Meet moet een telefoonnummer en pincode voor
inbellen beschikbaar maken voor de vergadering; OpenClaw ontdekt die niet via de Meet-pagina.

Schakel de Voice Call-plugin in op de Gateway-host, niet op de Chrome-node:

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

Geef Twilio-referenties op via omgeving of configuratie. De omgeving houdt
geheimen buiten `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Herstart of herlaad de Gateway nadat `voice-call` is ingeschakeld; wijzigingen in Plugin-configuratie
verschijnen niet in een al draaiend Gateway-proces totdat dit herlaadt.

Controleer daarna:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Wanneer Twilio-delegatie is gekoppeld, bevat `googlemeet setup` geslaagde
controles voor `twilio-voice-call-plugin`, `twilio-voice-call-credentials` en
`twilio-voice-call-webhook`.

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

## OAuth en preflight

OAuth is optioneel voor het maken van een Meet-link, omdat `googlemeet create` kan terugvallen
op browserautomatisering. Configureer OAuth wanneer je officiële API-creatie,
space-resolutie of Meet Media API-preflightcontroles wilt.

Google Meet API-toegang gebruikt gebruikers-OAuth: maak een Google Cloud OAuth-client,
vraag de vereiste scopes aan, autoriseer een Google-account en sla daarna de
resulterende refresh token op in de Google Meet-pluginconfiguratie of geef de
`OPENCLAW_GOOGLE_MEET_*`-omgevingsvariabelen op.

OAuth vervangt het Chrome-deelnamepad niet. Chrome- en Chrome-node-transporten
nemen nog steeds deel via een ingelogd Chrome-profiel, BlackHole/SoX en een verbonden
node wanneer je browserdeelname gebruikt. OAuth is alleen voor het officiële Google
Meet API-pad: vergaderruimten maken, spaces oplossen en Meet Media API-
preflightcontroles uitvoeren.

### Google-referenties maken

In Google Cloud Console:

1. Maak of selecteer een Google Cloud-project.
2. Schakel **Google Meet REST API** in voor dat project.
3. Configureer het OAuth-toestemmingsscherm.
   - **Internal** is het eenvoudigst voor een Google Workspace-organisatie.
   - **External** werkt voor persoonlijke/testopstellingen; terwijl de app in Testing is,
     voeg je elk Google-account dat de app zal autoriseren toe als testgebruiker.
4. Voeg de scopes toe die OpenClaw aanvraagt:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Maak een OAuth-client-ID.
   - Applicatietype: **Web application**.
   - Geautoriseerde redirect-URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Kopieer de client-ID en het clientgeheim.

`meetings.space.created` is vereist door Google Meet `spaces.create`.
`meetings.space.readonly` laat OpenClaw Meet-URL's/codes omzetten naar spaces.
`meetings.conference.media.readonly` is voor Meet Media API-preflight en mediawerk;
Google kan Developer Preview-inschrijving vereisen voor daadwerkelijk gebruik van de Media API.
Als je alleen browsergebaseerde Chrome-deelname nodig hebt, sla OAuth dan volledig over.

### De refresh token aanmaken

Configureer `oauth.clientId` en optioneel `oauth.clientSecret`, of geef ze door als
omgevingsvariabelen, en voer daarna uit:

```bash
openclaw googlemeet auth login --json
```

De opdracht drukt een `oauth`-configuratieblok af met een refresh token. Deze gebruikt PKCE,
localhost-callback op `http://localhost:8085/oauth2callback` en een handmatige
kopieer-/plakstroom met `--manual`.

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

Sla het `oauth`-object op onder de Google Meet-pluginconfiguratie:

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

Geef de voorkeur aan omgevingsvariabelen wanneer je de refresh token niet in configuratie wilt.
Als zowel configuratie- als omgevingswaarden aanwezig zijn, gebruikt de Plugin eerst de configuratie
en daarna de omgevingsfallback.

De OAuth-toestemming omvat het maken van Meet-spaces, leestoegang tot Meet-spaces en
leestoegang tot Meet-conferentiemedia. Als je bent geauthenticeerd voordat ondersteuning
voor het maken van vergaderingen bestond, voer dan `openclaw googlemeet auth login --json`
opnieuw uit zodat de refresh token de scope `meetings.space.created` heeft.

### OAuth verifiëren met doctor

Voer de OAuth-doctor uit wanneer je een snelle gezondheidscontrole zonder geheimen wilt:

```bash
openclaw googlemeet doctor --oauth --json
```

Dit laadt de Chrome-runtime niet en vereist geen verbonden Chrome-node. Het
controleert of OAuth-configuratie bestaat en of de refresh token een access token kan
aanmaken. Het JSON-rapport bevat alleen statusvelden zoals `ok`, `configured`,
`tokenSource`, `expiresAt` en controleberichten; het drukt de access token,
refresh token of clientgeheim niet af.

Veelvoorkomende resultaten:

| Controle             | Betekenis                                                                               |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` plus `oauth.refreshToken`, of een gecachte access token, is aanwezig.  |
| `oauth-token`        | De gecachte access token is nog geldig, of de refresh token heeft een nieuwe access token aangemaakt. |
| `meet-spaces-get`    | Optionele `--meeting`-controle heeft een bestaande Meet-space opgelost.                 |
| `meet-spaces-create` | Optionele `--create-space`-controle heeft een nieuwe Meet-space gemaakt.                |

Om ook Google Meet API-inschakeling en de `spaces.create`-scope te bewijzen, voer je de
controle met bijwerking voor maken uit:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` maakt een wegwerp-Meet-URL. Gebruik dit wanneer je moet bevestigen
dat het Google Cloud-project de Meet API heeft ingeschakeld en dat het geautoriseerde
account de scope `meetings.space.created` heeft.

Om leestoegang voor een bestaande vergaderruimte te bewijzen:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` en `resolve-space` bewijzen leestoegang tot een bestaande
space waartoe het geautoriseerde Google-account toegang heeft. Een `403` van deze controles
betekent meestal dat de Google Meet REST API is uitgeschakeld, dat de goedgekeurde refresh token
de vereiste scope mist, of dat het Google-account geen toegang heeft tot die Meet-
space. Een refresh-tokenfout betekent dat je `openclaw googlemeet auth login
--json` opnieuw moet uitvoeren en het nieuwe `oauth`-blok moet opslaan.

Er zijn geen OAuth-referenties nodig voor de browserfallback. In die modus komt Google-
authenticatie van het ingelogde Chrome-profiel op de geselecteerde node, niet van
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

Voer preflight uit vóór mediawerk:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Geef vergaderingsartefacten en aanwezigheid weer nadat Meet conferentierecords heeft gemaakt:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Met `--meeting` gebruiken `artifacts` en `attendance` standaard het nieuwste
conferentierecord. Geef `--all-conference-records` door wanneer je elk bewaard
record voor die vergadering wilt.

Agendaopzoeking kan de vergaderings-URL uit Google Calendar oplossen voordat
Meet-artefacten worden gelezen:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` doorzoekt de `primary`-agenda van vandaag naar een Calendar-gebeurtenis met een
Google Meet-link. Gebruik `--event <query>` om overeenkomende gebeurtenistekst te zoeken, en
`--calendar <id>` voor een niet-primaire agenda. Agendaopzoeking vereist een nieuwe
OAuth-login die het alleen-lezen bereik voor Calendar-gebeurtenissen bevat.
`calendar-events` toont een voorbeeld van de overeenkomende Meet-gebeurtenissen en markeert de gebeurtenis die
`latest`, `artifacts`, `attendance` of `export` kiest.

Als je de conferentierecord-id al kent, spreek die dan direct aan:

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

`artifacts` retourneert metagegevens van conferentierecords plus metagegevens van deelnemers,
opnamen, transcripties, gestructureerde transcriptie-items en smart-note-resources wanneer
Google die voor de vergadering beschikbaar stelt. Gebruik `--no-transcript-entries` om
itemopzoeking voor grote vergaderingen over te slaan. `attendance` breidt deelnemers uit naar
deelnemer-sessierijen met tijden voor eerste/laatste waarneming, totale sessieduur,
markeringen voor te laat/vroeg verlaten, en dubbele deelnemerresources samengevoegd op basis van ingelogde
gebruiker of weergavenaam. Geef `--no-merge-duplicates` door om ruwe deelnemerresources
gescheiden te houden, `--late-after-minutes` om te-laat-detectie af te stemmen, en
`--early-before-minutes` om detectie van vroeg verlaten af te stemmen.

`export` schrijft een map met `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` en `manifest.json`.
`manifest.json` registreert de gekozen invoer, exportopties, conferentierecords,
uitvoerbestanden, aantallen, tokenbron, Calendar-gebeurtenis wanneer die is gebruikt, en eventuele
waarschuwingen over gedeeltelijke ophaling. Geef `--zip` door om ook een draagbaar archief naast
de map te schrijven. Geef `--include-doc-bodies` door om gekoppelde transcriptie- en
smart-note-Google Docs-tekst te exporteren via Google Drive `files.export`; hiervoor is een
nieuwe OAuth-login vereist die het alleen-lezen bereik voor Drive Meet bevat. Zonder
`--include-doc-bodies` bevatten exports alleen Meet-metagegevens en gestructureerde transcriptie-items.
Als Google een gedeeltelijke artefactfout retourneert, zoals een smart-note-
listing, transcriptie-item- of Drive-documenttekstfout, bewaren de samenvatting en
het manifest de waarschuwing in plaats van de hele export te laten mislukken.
Gebruik `--dry-run` om dezelfde artefact-/aanwezigheidsgegevens op te halen en de
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

Voer de bewaakte live smoke uit tegen een echte bewaarde vergadering:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Live smoke-omgeving:

- `OPENCLAW_LIVE_TEST=1` schakelt bewaakte live tests in.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` wijst naar een bewaarde Meet-URL, code of
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` of `GOOGLE_MEET_CLIENT_ID` levert de OAuth-
  client-id.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` of `GOOGLE_MEET_REFRESH_TOKEN` levert
  het refresh-token.
- Optioneel: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` en
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` gebruiken dezelfde fallbacknamen
  zonder het voorvoegsel `OPENCLAW_`.

De basis-live smoke voor artefacten/aanwezigheid heeft
`https://www.googleapis.com/auth/meetings.space.readonly` en
`https://www.googleapis.com/auth/meetings.conference.media.readonly` nodig. Agendaopzoeking
heeft `https://www.googleapis.com/auth/calendar.events.readonly` nodig. Drive-
export van documenttekst heeft
`https://www.googleapis.com/auth/drive.meet.readonly` nodig.

Maak een nieuwe Meet-ruimte:

```bash
openclaw googlemeet create
```

De opdracht drukt de nieuwe `meeting uri`, bron en deelsessie af. Met OAuth-
referenties gebruikt deze de officiële Google Meet-API. Zonder OAuth-referenties
gebruikt deze als fallback het ingelogde browserprofiel van de vastgepinde Chrome-Node. Agents kunnen
de `google_meet`-tool gebruiken met `action: "create"` om in één stap te maken en deel te nemen.
Geef voor alleen URL-aanmaak `"join": false` door.

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

Als de browserfallback een Google-login of Meet-machtigingsblokkade tegenkomt voordat deze
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
`manualActionMessage` plus de browser-Node-/tabcontext melden en stoppen met het openen van nieuwe
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

Een Meet maken neemt standaard deel aan de vergadering. Het Chrome- of Chrome-Node-transport heeft nog steeds
een ingelogd Google Chrome-profiel nodig om via de browser deel te nemen. Als het
profiel is uitgelogd, meldt OpenClaw `manualActionRequired: true` of een
browserfallbackfout en vraagt het de operator om de Google-login te voltooien voordat
opnieuw wordt geprobeerd.

Stel `preview.enrollmentAcknowledged: true` alleen in nadat je hebt bevestigd dat je Cloud-
project, OAuth-principal en vergaderingsdeelnemers zijn ingeschreven in het Google
Workspace Developer Preview Program voor Meet-media-API's.

## Configuratie

Het algemene realtime Chrome-pad heeft alleen de ingeschakelde Plugin, BlackHole, SoX
en een realtime spraakproviderkey voor de backend nodig. OpenAI is de standaard; stel
`realtime.provider: "google"` in om Google Gemini Live te gebruiken:

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

Standaarden:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: optionele Node-id/naam/IP voor `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: naam die wordt gebruikt op het Meet-gastscherm
  wanneer niet is ingelogd
- `chrome.autoJoin: true`: best-effort invullen van gastnaam en klikken op Nu deelnemen
  via OpenClaw-browserautomatisering op `chrome-node`
- `chrome.reuseExistingTab: true`: activeer een bestaande Meet-tab in plaats van
  duplicaten te openen
- `chrome.waitForInCallMs: 20000`: wacht tot de Meet-tab meldt dat deze in gesprek is
  voordat de realtime intro wordt geactiveerd
- `chrome.audioFormat: "pcm16-24khz"`: audioformaat voor opdrachtparen. Gebruik
  `"g711-ulaw-8khz"` alleen voor verouderde/aangepaste opdrachtparen die nog steeds
  telefonieaudio uitsturen.
- `chrome.audioInputCommand`: SoX-opdracht die leest uit CoreAudio `BlackHole 2ch`
  en audio schrijft in `chrome.audioFormat`
- `chrome.audioOutputCommand`: SoX-opdracht die audio leest in `chrome.audioFormat`
  en schrijft naar CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: optionele lokale microfoonopdracht die
  signed 16-bit little-endian mono PCM schrijft voor detectie van menselijke onderbreking terwijl
  afspelen door de assistent actief is. Dit geldt momenteel voor de door Gateway gehoste
  `chrome`-opdrachtpaarbridge.
- `chrome.bargeInRmsThreshold: 650`: RMS-niveau dat telt als een menselijke
  onderbreking op `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: piekniveau dat telt als een menselijke
  onderbreking op `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: minimale vertraging tussen herhaalde resets van
  menselijke onderbrekingen
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: korte gesproken antwoorden, met
  `openclaw_agent_consult` voor diepere antwoorden
- `realtime.introMessage`: korte gesproken gereedheidscontrole wanneer de realtime bridge
  verbinding maakt; stel deze in op `""` om stil deel te nemen
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
    bargeInInputCommand: [
      "sox",
      "-q",
      "-t",
      "coreaudio",
      "External Microphone",
      "-r",
      "24000",
      "-c",
      "1",
      "-b",
      "16",
      "-e",
      "signed-integer",
      "-t",
      "raw",
      "-",
    ],
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

`voiceCall.enabled` is standaard `true`; met Twilio-transport delegeert het de
daadwerkelijke PSTN-oproep, DTMF en introductiebegroeting aan de Voice Call Plugin. Voice Call
speelt de DTMF-reeks af voordat de realtime-mediastream wordt geopend en gebruikt daarna de
opgeslagen introductietekst als de eerste realtime-begroeting. Als `voice-call` niet is
ingeschakeld, kan Google Meet het kiesplan nog steeds valideren en vastleggen, maar het kan
de Twilio-oproep niet plaatsen.

## Hulpmiddel

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
`transport: "chrome-node"` wanneer Chrome op een gekoppelde Node draait, zoals een Parallels
VM. In beide gevallen draaien het realtime-model en `openclaw_agent_consult` op de
Gateway-host, zodat modelreferenties daar blijven.

Gebruik `action: "status"` om actieve sessies te tonen of een sessie-ID te inspecteren. Gebruik
`action: "speak"` met `sessionId` en `message` om de realtime-agent onmiddellijk te laten
spreken. Gebruik `action: "test_speech"` om de sessie te maken of opnieuw te gebruiken,
een bekende zin te triggeren en `inCall`-gezondheid terug te geven wanneer de Chrome-host die kan
rapporteren. `test_speech` forceert altijd `mode: "realtime"` en mislukt als gevraagd wordt om
in `mode: "transcribe"` te draaien, omdat observe-only-sessies bewust geen spraak kunnen
uitzenden. Het resultaat `speechOutputVerified` is gebaseerd op realtime-audio-uitvoerbytes
die tijdens deze testoproep toenemen, dus een hergebruikte sessie met oudere audio telt niet
als een nieuwe geslaagde spraakcontrole. Gebruik `action: "leave"` om een sessie als beëindigd
te markeren.

`status` bevat Chrome-gezondheid wanneer beschikbaar:

- `inCall`: Chrome lijkt zich in de Meet-oproep te bevinden
- `micMuted`: best-effort Meet-microfoonstatus
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: het
  browserprofiel heeft handmatige login, toelating door de Meet-host, machtigingen of
  herstel van browserbesturing nodig voordat spraak kan werken
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: of
  beheerde Chrome-spraak nu is toegestaan. `speechReady: false` betekent dat OpenClaw de
  introductie-/testzin niet naar de audiobrug heeft gestuurd.
- `providerConnected` / `realtimeReady`: status van de realtime-spraakbrug
- `lastInputAt` / `lastOutputAt`: laatste audio die van de brug is gezien of naar de brug is gestuurd
- `lastSuppressedInputAt` / `suppressedInputBytes`: loopback-invoer genegeerd terwijl
  afspelen door de assistent actief is

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Realtime-agentconsult

Chrome realtime-modus is geoptimaliseerd voor een live spraaklus. De realtime-spraakprovider
hoort de audio van de vergadering en spreekt via de geconfigureerde audiobrug.
Wanneer het realtime-model diepere redenering, actuele informatie of normale
OpenClaw-tools nodig heeft, kan het `openclaw_agent_consult` aanroepen.

De consulttool draait de reguliere OpenClaw-agent achter de schermen met recente
vergaderingstranscriptcontext en geeft een beknopt gesproken antwoord terug aan de realtime-
spraaksessie. Het spraakmodel kan dat antwoord daarna terug de vergadering in spreken.
Het gebruikt dezelfde gedeelde realtime-consulttool als Voice Call.

Standaard draaien consults tegen de `main`-agent. Stel `realtime.agentId` in wanneer een
Meet-lane een dedicated OpenClaw-agentworkspace, modelstandaarden,
toolbeleid, geheugen en sessiegeschiedenis moet raadplegen.

`realtime.toolPolicy` bepaalt de consult-run:

- `safe-read-only`: stel de consulttool beschikbaar en beperk de reguliere agent tot
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` en
  `memory_get`.
- `owner`: stel de consulttool beschikbaar en laat de reguliere agent het normale
  agenttoolbeleid gebruiken.
- `none`: stel de consulttool niet beschikbaar aan het realtime-spraakmodel.

De consultsessiesleutel is per Meet-sessie gescoped, zodat vervolgconsultaanroepen
eerdere consultcontext tijdens dezelfde vergadering kunnen hergebruiken.

Om een gesproken gereedheidscontrole te forceren nadat Chrome volledig aan de oproep heeft deelgenomen:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Voor de volledige join-and-speak-smoke:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Live-testchecklist

Gebruik deze reeks voordat je een vergadering aan een onbeheerde agent overdraagt:

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
  standaardtransport is of een Node is vastgezet.
- `nodes status` toont dat de geselecteerde Node is verbonden.
- De geselecteerde Node adverteert zowel `googlemeet.chrome` als `browser.proxy`.
- Het Meet-tabblad neemt deel aan de oproep en `test-speech` geeft Chrome-gezondheid terug met
  `inCall: true`.

Voor een externe Chrome-host zoals een Parallels macOS VM is dit de kortste
veilige controle na het bijwerken van de Gateway of de VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Dat bewijst dat de Gateway-Plugin is geladen, dat de VM-Node is verbonden met het
huidige token en dat de Meet-audiobrug beschikbaar is voordat een agent een
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

- `googlemeet setup` bevat groene controles voor `twilio-voice-call-plugin`,
  `twilio-voice-call-credentials` en `twilio-voice-call-webhook`.
- `voicecall` is beschikbaar in de CLI na het herladen van de Gateway.
- De geretourneerde sessie heeft `transport: "twilio"` en een `twilio.voiceCallId`.
- `openclaw logs --follow` toont dat DTMF TwiML wordt geserveerd vóór realtime TwiML, daarna een
  realtime-brug met de initiële begroeting in de wachtrij.
- `googlemeet leave <sessionId>` hangt de gedelegeerde spraakoproep op.

## Probleemoplossing

### Agent kan de Google Meet-tool niet zien

Controleer of de Plugin is ingeschakeld in de Gateway-configuratie en herlaad de Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Als je net `plugins.entries.google-meet` hebt bewerkt, herstart of herlaad dan de Gateway.
De draaiende agent ziet alleen Plugin-tools die door het huidige Gateway-proces
zijn geregistreerd.

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
`gateway token mismatch` rapporteert, installeer of herstart de Node dan opnieuw met het huidige Gateway-
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

Voer `googlemeet test-speech` uit en inspecteer de geretourneerde Chrome-gezondheid. Als die
`manualActionRequired: true` rapporteert, toon dan `manualActionMessage` aan de operator
en stop met opnieuw proberen totdat de browseractie is voltooid.

Veelvoorkomende handmatige acties:

- Log in op het Chrome-profiel.
- Laat de gast toe vanuit het Meet-hostaccount.
- Verleen Chrome-microfoon-/cameramachtigingen wanneer de native toestemmingsprompt van Chrome
  verschijnt.
- Sluit of herstel een vastgelopen Meet-machtigingsdialoog.

Rapporteer niet "not signed in" alleen omdat Meet "Do you want people to
hear you in the meeting?" toont. Dat is Meet's audio-keuze-interstitial; OpenClaw
klikt **Use microphone** via browserautomatisering wanneer beschikbaar en blijft
wachten op de echte vergaderingstatus. Voor create-only browserfallback kan OpenClaw
**Continue without microphone** klikken omdat het maken van de URL het
realtime-audiopad niet nodig heeft.

### Vergadering maken mislukt

`googlemeet create` gebruikt eerst het Google Meet API-eindpunt `spaces.create`
wanneer OAuth-referenties zijn geconfigureerd. Zonder OAuth-referenties valt het terug
op de vastgezette Chrome-node-browser. Controleer:

- Voor API-aanmaak: `oauth.clientId` en `oauth.refreshToken` zijn geconfigureerd,
  of overeenkomende `OPENCLAW_GOOGLE_MEET_*`-omgevingsvariabelen zijn aanwezig.
- Voor API-aanmaak: het refresh-token is uitgegeven nadat ondersteuning voor maken is
  toegevoegd. Oudere tokens kunnen de scope `meetings.space.created` missen; voer
  `openclaw googlemeet auth login --json` opnieuw uit en werk de Plugin-configuratie bij.
- Voor browserfallback: `defaultTransport: "chrome-node"` en
  `chromeNode.node` wijzen naar een verbonden Node met `browser.proxy` en
  `googlemeet.chrome`.
- Voor browserfallback: het OpenClaw Chrome-profiel op die Node is aangemeld
  bij Google en kan `https://meet.google.com/new` openen.
- Voor browserfallback: nieuwe pogingen hergebruiken een bestaand tabblad voor `https://meet.google.com/new`
  of een Google-accountprompt voordat een nieuw tabblad wordt geopend. Als een agent time-out,
  probeer de toolaanroep opnieuw in plaats van handmatig een ander Meet-tabblad te openen.
- Voor browserfallback: als de tool `manualActionRequired: true` retourneert, gebruik dan
  de geretourneerde `browser.nodeId`, `browser.targetId`, `browserUrl` en
  `manualActionMessage` om de operator te begeleiden. Probeer niet in een lus opnieuw totdat die
  actie is voltooid.
- Voor browserfallback: als Meet "Do you want people to hear you in the
  meeting?" toont, laat het tabblad open. OpenClaw moet **Use microphone** klikken of, voor
  create-only fallback, **Continue without microphone** via browser-
  automatisering en blijven wachten op de gegenereerde Meet-URL. Als dat niet lukt, moet de
  fout `meet-audio-choice-required` noemen, niet `google-login-required`.

### Agent neemt deel maar praat niet

Controleer het realtime-pad:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Gebruik `mode: "realtime"` voor luisteren/terugpraten. `mode: "transcribe"` start bewust niet de duplex realtime-spraakbridge. `googlemeet test-speech` controleert altijd het realtime-pad en meldt of er bij die aanroep bridge-uitvoerbytes zijn waargenomen. Als `speechOutputVerified` false is en `speechOutputTimedOut` true is, heeft de realtime-provider de uiting mogelijk geaccepteerd, maar zag OpenClaw geen nieuwe uitvoerbytes de Chrome-audiobridge bereiken.

Controleer ook:

- Er is een realtime-providerkey beschikbaar op de Gateway-host, zoals
  `OPENAI_API_KEY` of `GEMINI_API_KEY`.
- `BlackHole 2ch` is zichtbaar op de Chrome-host.
- `sox` bestaat op de Chrome-host.
- De Meet-microfoon en -speaker worden gerouteerd via het virtuele audiopad dat door
  OpenClaw wordt gebruikt.

`googlemeet doctor [session-id]` toont de sessie, node, gespreksstatus,
reden voor handmatige actie, realtime-providerverbinding, `realtimeReady`, audio-
invoer-/uitvoeractiviteit, laatste audiotijdstempels, bytetellers en browser-URL.
Gebruik `googlemeet status [session-id] --json` wanneer je de onbewerkte JSON nodig hebt. Gebruik
`googlemeet doctor --oauth` wanneer je Google Meet OAuth-verversing wilt verifiëren
zonder tokens bloot te leggen; voeg `--meeting` of `--create-space` toe wanneer je ook
Google Meet API-bewijs nodig hebt.

Als een agent een time-out kreeg en je ziet dat er al een Meet-tabblad open is, inspecteer dat tabblad
zonder een ander tabblad te openen:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

De equivalente toolactie is `recover_current_tab`. Deze focust en inspecteert een
bestaand Meet-tabblad voor het geselecteerde transport. Met `chrome` gebruikt deze lokale
browserbesturing via de Gateway; met `chrome-node` gebruikt deze de geconfigureerde
Chrome-node. Deze opent geen nieuw tabblad en maakt geen nieuwe sessie aan; hij meldt de
huidige blokkade, zoals login, toelating, machtigingen of audio-keuzestatus.
De CLI-opdracht praat met de geconfigureerde Gateway, dus de Gateway moet actief zijn;
`chrome-node` vereist ook dat de Chrome-node verbonden is.

### Twilio-installatiecontroles mislukken

`twilio-voice-call-plugin` mislukt wanneer `voice-call` niet is toegestaan of niet is ingeschakeld.
Voeg dit toe aan `plugins.allow`, schakel `plugins.entries.voice-call` in en herlaad de
Gateway.

`twilio-voice-call-credentials` mislukt wanneer de Twilio-backend account-
SID, auth-token of beller-nummer mist. Stel deze in op de Gateway-host:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` mislukt wanneer `voice-call` geen publieke Webhook-
blootstelling heeft, of wanneer `publicUrl` naar loopback- of privénetwerkruimte wijst.
Stel `plugins.entries.voice-call.config.publicUrl` in op de publieke provider-URL of
configureer een `voice-call`-tunnel-/Tailscale-blootstelling.

Loopback- en privé-URL's zijn niet geldig voor carrier-callbacks. Gebruik
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` of `fd00::/8` niet als `publicUrl`.

Voor een stabiele publieke URL:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          fromNumber: "+15550001234",
          publicUrl: "https://voice.example.com/voice/webhook",
        },
      },
    },
  },
}
```

Gebruik voor lokale ontwikkeling een tunnel- of Tailscale-blootstelling in plaats van een privé
host-URL:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Herstart of herlaad daarna de Gateway en voer uit:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` controleert standaard alleen gereedheid. Om een specifiek nummer proef te draaien:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Voeg `--yes` alleen toe wanneer je bewust een live uitgaand meldingsgesprek wilt plaatsen:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio-gesprek start maar komt nooit de vergadering binnen

Bevestig dat de Meet-gebeurtenis telefonische inbelgegevens blootlegt. Geef het exacte inbel-
nummer en de pincode of een aangepaste DTMF-reeks door:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Gebruik voorafgaande `w` of komma's in `--dtmf-sequence` als de provider een pauze nodig heeft
voordat de pincode wordt ingevoerd.

Als het telefoongesprek wordt aangemaakt maar de Meet-deelnemerslijst de inbel-
deelnemer nooit toont:

- Voer `openclaw voicecall status --call-id <id>` uit en bevestig dat het gesprek nog
  actief is.
- Voer `openclaw voicecall tail` uit en controleer of Twilio-webhooks bij de
  Gateway aankomen.
- Voer `openclaw logs --follow` uit en zoek naar de Twilio Meet-reeks: Google
  Meet delegeert het deelnemen, Voice Call slaat pre-connect DTMF TwiML op, serveert
  die initiële TwiML, serveert daarna realtime TwiML en start de realtime-bridge
  met `initialGreeting=queued`.
- Voer `openclaw googlemeet setup --transport twilio` opnieuw uit; een groene installatiecontrole is
  vereist, maar bewijst niet dat de pincode-reeks voor de vergadering correct is.
- Bevestig dat het inbelnummer bij dezelfde Meet-uitnodiging en regio hoort als
  de pincode.
- Vergroot de voorafgaande pauzes in `--dtmf-sequence` als Meet langzaam opneemt, bijvoorbeeld
  `wwww123456#`.
- Als de deelnemer binnenkomt maar je de begroeting niet hoort, controleer
  `openclaw logs --follow` op realtime TwiML, start van de realtime-bridge en
  `initialGreeting=queued`. De begroeting wordt gegenereerd uit het initiële
  `voicecall.start`-bericht nadat de realtime-bridge verbinding maakt.

Als Webhooks niet aankomen, debug dan eerst de Voice Call-plugin: de provider moet
`plugins.entries.voice-call.config.publicUrl` of de geconfigureerde tunnel kunnen bereiken.
Zie [Probleemoplossing voor spraakoproepen](/nl/plugins/voice-call#troubleshooting).

## Opmerkingen

De officiële media-API van Google Meet is gericht op ontvangen, dus spreken in een Meet-
gesprek vereist nog steeds een deelnemerspad. Deze Plugin houdt die grens zichtbaar:
Chrome behandelt browserdeelname en lokale audiorouting; Twilio behandelt
telefonische inbeldeelname.

Chrome-realtime-modus heeft `BlackHole 2ch` nodig plus een van de volgende opties:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw beheert de
  realtime-modelbridge en pipet audio in `chrome.audioFormat` tussen die
  opdrachten en de geselecteerde realtime-spraakprovider. Het standaard Chrome-pad is
  24 kHz PCM16; 8 kHz G.711 mu-law blijft beschikbaar voor verouderde opdrachtparen.
- `chrome.audioBridgeCommand`: een externe bridge-opdracht beheert het volledige lokale
  audiopad en moet afsluiten nadat de daemon is gestart of gevalideerd.

Routeer voor schone duplex-audio Meet-uitvoer en Meet-microfoon via afzonderlijke
virtuele apparaten of een Loopback-achtige grafiek van virtuele apparaten. Een enkel gedeeld
BlackHole-apparaat kan andere deelnemers terug het gesprek in echoën.

Met de Chrome-bridge met opdrachtpaar kan `chrome.bargeInInputCommand` luisteren naar een
afzonderlijke lokale microfoon en de assistentweergave wissen wanneer de mens begint
te praten. Dit houdt menselijke spraak vóór assistentuitvoer, zelfs wanneer de gedeelde
BlackHole-loopbackinvoer tijdelijk wordt onderdrukt tijdens assistentweergave.
Net als `chrome.audioInputCommand` en `chrome.audioOutputCommand` is het een
door de operator geconfigureerde lokale opdracht. Gebruik een expliciet vertrouwd opdrachtpad of
argumentenlijst, en wijs deze niet naar scripts op niet-vertrouwde locaties.

`googlemeet speak` activeert de actieve realtime-audiobridge voor een Chrome-
sessie. `googlemeet leave` stopt die bridge. Voor Twilio-sessies die via de
Voice Call-plugin zijn gedelegeerd, beëindigt `leave` ook het onderliggende spraakgesprek.

## Gerelateerd

- [Voice Call-plugin](/nl/plugins/voice-call)
- [Praatmodus](/nl/nodes/talk)
- [Plugins bouwen](/nl/plugins/building-plugins)
