---
read_when:
    - Je wilt dat een OpenClaw-agent deelneemt aan een Google Meet-gesprek
    - Je wilt dat een OpenClaw-agent een nieuw Google Meet-gesprek aanmaakt
    - Je configureert Chrome, Chrome Node of Twilio als Google Meet-transport
summary: 'Google Meet-Plugin: neem deel aan expliciete Meet-URL''s via Chrome of Twilio met standaardinstellingen voor agent-terugspraak'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-05-06T09:25:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c1de7528ddabe6411598eea362d4a21c6f95f374700046c18294b215a1333d3
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet-deelnemersondersteuning voor OpenClaw — de plugin is bewust expliciet ontworpen:

- Hij neemt alleen deel via een expliciete `https://meet.google.com/...`-URL.
- Hij kan via de Google Meet API een nieuwe Meet-ruimte maken en vervolgens deelnemen via de
  geretourneerde URL.
- `agent` is de standaard talk-backmodus: realtime transcriptie luistert, de
  geconfigureerde OpenClaw-agent antwoordt, en reguliere OpenClaw TTS spreekt in Meet.
- `bidi` blijft beschikbaar als fallbackmodus voor het directe realtime spraakmodel.
- Agents kiezen het deelnamegedrag met `mode`: gebruik `agent` voor live
  luisteren/talk-back, `bidi` als directe realtime spraakfallback, of `transcribe`
  om deel te nemen/de browser te besturen zonder de talk-backbrug.
- Authenticatie begint als persoonlijke Google OAuth of een Chrome-profiel dat al is aangemeld.
- Er is geen automatische toestemmingsaankondiging.
- De standaard Chrome-audiobackend is `BlackHole 2ch`.
- Chrome kan lokaal draaien of op een gekoppelde node-host.
- Twilio accepteert een inbelnummer plus optionele PIN of DTMF-reeks; het
  kan niet rechtstreeks een Meet-URL bellen.
- De CLI-opdracht is `googlemeet`; `meet` is gereserveerd voor bredere agent-
  teleconference-workflows.

## Snel starten

Installeer de lokale audio-afhankelijkheden en configureer een realtime transcriptie-
provider plus reguliere OpenClaw TTS. OpenAI is de standaard transcriptie-
provider; Google Gemini Live werkt ook als aparte `bidi`-spraakfallback met
`realtime.voiceProvider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# alleen nodig wanneer realtime.voiceProvider "google" is voor bidi-modus
export GEMINI_API_KEY=...
```

`blackhole-2ch` installeert het virtuele audioapparaat `BlackHole 2ch`. Het
installatieprogramma van Homebrew vereist een herstart voordat macOS het apparaat beschikbaar maakt:

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

Controleer de installatie:

```bash
openclaw googlemeet setup
```

De setup-uitvoer is bedoeld om leesbaar te zijn voor agents en rekening te houden met de modus. Deze rapporteert Chrome-
profiel, node-pinning en, voor realtime Chrome-deelnames, de BlackHole/SoX-audio-
brug en vertraagde realtime introcontroles. Controleer voor alleen-observeren-deelnames hetzelfde
transport met `--mode transcribe`; die modus slaat realtime audiovereisten over
omdat hij niet via de brug luistert of spreekt:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Wanneer Twilio-delegatie is geconfigureerd, rapporteert setup ook of de
`voice-call`-plugin, Twilio-referenties en publieke webhook-blootstelling gereed zijn.
Behandel elke `ok: false`-controle als een blokkade voor het gecontroleerde transport en de modus
voordat je een agent vraagt deel te nemen. Gebruik `openclaw googlemeet setup --json` voor
scripts of machineleesbare uitvoer. Gebruik `--transport chrome`,
`--transport chrome-node` of `--transport twilio` om een specifiek
transport vooraf te controleren voordat een agent het probeert.

Controleer voor Twilio het transport altijd expliciet vooraf wanneer het standaardtransport
Chrome is:

```bash
openclaw googlemeet setup --transport twilio
```

Dat detecteert ontbrekende `voice-call`-bedrading, Twilio-referenties of onbereikbare
Webhook-blootstelling voordat de agent de vergadering probeert te bellen.

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
  "mode": "agent"
}
```

De agentgerichte `google_meet`-tool blijft beschikbaar op niet-macOS-hosts voor
artifact-, calendar-, setup-, transcribe-, Twilio- en `chrome-node`-flows. Lokale
Chrome-talk-backacties worden daar geblokkeerd omdat het gebundelde Chrome-audiopad
momenteel afhankelijk is van macOS `BlackHole 2ch`. Gebruik op Linux `mode: "transcribe"`,
Twilio-inbellen, of een macOS `chrome-node`-host voor Chrome-talk-back-
deelname.

Maak een nieuwe vergadering en neem eraan deel:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

Gebruik voor via de API gemaakte ruimten Google Meet `SpaceConfig.accessType` wanneer je wilt
dat het niet-aanklopbeleid van de ruimte expliciet is in plaats van overgenomen uit de standaardinstellingen van het Google-
account:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` laat iedereen met de Meet-URL zonder aankloppen deelnemen. `TRUSTED` laat de
vertrouwde gebruikers van de hostorganisatie, uitgenodigde externe gebruikers en inbelgebruikers
zonder aankloppen deelnemen. `RESTRICTED` beperkt toegang zonder aankloppen tot genodigden. Deze
instellingen gelden alleen voor het officiële Google Meet API-creatiepad, dus OAuth-
referenties moeten zijn geconfigureerd.

Als je Google Meet hebt geauthenticeerd voordat deze optie beschikbaar was, voer dan opnieuw
`openclaw googlemeet auth login --json` uit nadat je de
`meetings.space.settings`-scope hebt toegevoegd aan je Google OAuth-toestemmingsscherm.

Maak alleen de URL zonder deel te nemen:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` heeft twee paden:

- API maken: gebruikt wanneer Google Meet OAuth-referenties zijn geconfigureerd. Dit is
  het meest deterministische pad en is niet afhankelijk van de status van de browser-UI.
- Browserfallback: gebruikt wanneer OAuth-referenties ontbreken. OpenClaw gebruikt de
  gepinde Chrome-node, opent `https://meet.google.com/new`, wacht tot Google
  doorverwijst naar een echte URL met vergadercode en retourneert vervolgens die URL. Dit pad vereist
  dat het OpenClaw Chrome-profiel op de node al is aangemeld bij Google.
  Browserautomatisering verwerkt Meet's eigen eerste microfoonprompt; die prompt
  wordt niet behandeld als een Google-loginfout.
  Deelname- en creatieflows proberen ook een bestaand Meet-tabblad te hergebruiken voordat ze een
  nieuw openen. Matching negeert onschuldige URL-querystrings zoals `authuser`, zodat een
  agent-retry de al geopende vergadering zou moeten focussen in plaats van een tweede
  Chrome-tabblad te maken.

De opdracht-/tooluitvoer bevat een `source`-veld (`api` of `browser`) zodat agents
kunnen uitleggen welk pad is gebruikt. `create` neemt standaard deel aan de nieuwe vergadering en
retourneert `joined: true` plus de deelnamesessie. Gebruik
`create --no-join` op de CLI of geef `"join": false` door aan de tool om alleen de URL te maken.

Of zeg tegen een agent: "Maak een Google Meet, neem eraan deel met de agent-talk-backmodus,
en stuur mij de link." De agent zou `google_meet` moeten aanroepen met
`action: "create"` en vervolgens de geretourneerde `meetingUri` delen.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Stel voor een alleen-observeren/browserbesturingsdeelname `"mode": "transcribe"` in. Dat start
de duplex realtime spraakbrug niet, vereist geen BlackHole of SoX,
en praat niet terug in de vergadering. Chrome-deelnames in deze modus vermijden ook
OpenClaw's toestemmingstoekenning voor microfoon/camera en vermijden het Meet-pad **Microfoon gebruiken**. Als Meet een tussenstap voor audiokeuze toont, probeert automatisering
het pad zonder microfoon en rapporteert anders een handmatige actie in plaats van
de lokale microfoon te openen. In transcribe-modus installeren beheerde Chrome-transporten ook
een best-effort Meet-ondertitelobserver. `googlemeet status --json` en
`googlemeet doctor` tonen `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`,
en een korte `recentTranscript`-staart zodat operators kunnen zien of de browser
aan de oproep heeft deelgenomen en of Meet-ondertitels tekst produceren.
Gebruik `openclaw googlemeet test-listen <meet-url> --transport chrome-node` wanneer
je een ja/nee-probe nodig hebt: deze neemt deel in transcribe-modus, wacht op verse ondertitel- of
transcriptiebeweging, en retourneert `listenVerified`, `listenTimedOut`, velden voor handmatige
actie en de nieuwste ondertitelgezondheid.

Tijdens realtime sessies bevat `google_meet`-status browser- en audiobrug-
gezondheid zoals `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, laatste invoer-/uitvoer-
tijdstempels, byte-tellers en gesloten brugstatus. Als een veilige Meet-paginaprompt
verschijnt, verwerkt browserautomatisering die wanneer dat kan. Login, hosttoelating en
browser-/OS-toestemmingsprompts worden gerapporteerd als handmatige actie met een reden en
bericht dat de agent kan doorgeven. Beheerde Chrome-sessies zenden de intro- of
testzin pas uit nadat browsergezondheid `inCall: true` rapporteert; anders rapporteert status
`speechReady: false` en wordt de spreekpoging geblokkeerd in plaats van te doen alsof de
agent in de vergadering heeft gesproken.

Lokale Chrome-deelnames gebruiken het aangemelde OpenClaw-browserprofiel. Realtime modus
vereist `BlackHole 2ch` voor het microfoon-/speakerpad dat door OpenClaw wordt gebruikt. Gebruik voor
schone duplexaudio aparte virtuele apparaten of een Loopback-achtige grafiek; een
enkel BlackHole-apparaat is genoeg voor een eerste smoke-test, maar kan echo veroorzaken.

### Lokale Gateway + Parallels Chrome

Je hebt **geen** volledige OpenClaw Gateway of model-API-sleutel nodig in een macOS-VM
alleen om de VM eigenaar van Chrome te maken. Draai de Gateway en agent lokaal en draai vervolgens een
node-host in de VM. Schakel de gebundelde plugin eenmaal in op de VM zodat de node
de Chrome-opdracht adverteert:

Wat draait waar:

- Gateway-host: OpenClaw Gateway, agentworkspace, model-/API-sleutels, realtime
  provider en de Google Meet-pluginconfiguratie.
- Parallels macOS-VM: OpenClaw CLI/node-host, Google Chrome, SoX, BlackHole 2ch,
  en een Chrome-profiel dat bij Google is aangemeld.
- Niet nodig in de VM: Gateway-service, agentconfiguratie, OpenAI/GPT-sleutel of model-
  providerinstelling.

Installeer de VM-afhankelijkheden:

```bash
brew install blackhole-2ch sox
```

Herstart de VM na installatie van BlackHole zodat macOS `BlackHole 2ch` beschikbaar maakt:

```bash
sudo reboot
```

Controleer na de herstart of de VM het audioapparaat en de SoX-opdrachten kan zien:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Installeer of update OpenClaw in de VM en schakel vervolgens daar de gebundelde plugin in:

```bash
openclaw plugins enable google-meet
```

Start de node-host in de VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Als `<gateway-host>` een LAN-IP is en je geen TLS gebruikt, weigert de node de
plaintext WebSocket tenzij je je expliciet aanmeldt voor dat vertrouwde privénetwerk:

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
als browsercapaciteit/`browser.proxy` adverteert:

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

Neem nu normaal deel vanaf de Gateway-host:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

of vraag de agent de `google_meet`-tool te gebruiken met `transport: "chrome-node"`.

Voor een smoke-test met één opdracht die een sessie maakt of hergebruikt, een bekende
zin uitspreekt en sessiegezondheid afdrukt:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Tijdens realtime deelnemen vult OpenClaw-browserautomatisering de gastnaam in, klikt op
Deelnemen/Vragen om deel te nemen, en accepteert Meet's eerste-keer-keuze "Microfoon gebruiken" wanneer die
prompt verschijnt. Tijdens observeren-alleen deelnemen of browser-alleen vergadering aanmaken gaat het
door voorbij dezelfde prompt zonder microfoon wanneer die keuze beschikbaar is.
Als het browserprofiel niet is ingelogd, Meet wacht op toelating door de host,
Chrome microfoon-/cameratoestemming nodig heeft voor realtime deelnemen, of Meet vastzit
op een prompt die automatisering niet kon oplossen, rapporteert het join/test-speech-resultaat
`manualActionRequired: true` met `manualActionReason` en
`manualActionMessage`. Agents moeten stoppen met het opnieuw proberen van deelnemen, dat exacte
bericht plus de huidige `browserUrl`/`browserTitle` rapporteren, en pas opnieuw proberen nadat de
handmatige browseractie is voltooid.

Als `chromeNode.node` is weggelaten, selecteert OpenClaw alleen automatisch wanneer precies één
verbonden Node zowel `googlemeet.chrome` als browserbesturing adverteert. Als
meerdere geschikte Nodes verbonden zijn, stel dan `chromeNode.node` in op de Node-id,
weergavenaam, of externe IP.

Veelvoorkomende foutcontroles:

- `Configured Google Meet node ... is not usable: offline`: de vastgepinde Node is
  bekend bij de Gateway maar niet beschikbaar. Agents moeten die Node behandelen als
  diagnostische status, niet als een bruikbare Chrome-host, en de setup-blokkade
  rapporteren in plaats van terug te vallen op een ander transport, tenzij de gebruiker daarom vroeg.
- `No connected Google Meet-capable node`: start `openclaw node run` in de VM,
  keur pairing goed, en zorg ervoor dat `openclaw plugins enable google-meet` en
  `openclaw plugins enable browser` in de VM zijn uitgevoerd. Controleer ook dat de
  Gateway-host beide Node-commando's toestaat met
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: installeer `blackhole-2ch` op de host
  die wordt gecontroleerd en herstart voordat je lokale Chrome-audio gebruikt.
- `BlackHole 2ch audio device not found on the node`: installeer `blackhole-2ch`
  in de VM en herstart de VM.
- Chrome opent maar kan niet deelnemen: log in op het browserprofiel binnen de VM, of
  houd `chrome.guestName` ingesteld voor deelnemen als gast. Automatisch deelnemen als gast gebruikt OpenClaw-
  browserautomatisering via de Node-browserproxy; zorg dat de Node-browser-
  configuratie verwijst naar het profiel dat je wilt, bijvoorbeeld
  `browser.defaultProfile: "user"` of een benoemd bestaand-sessieprofiel.
- Dubbele Meet-tabbladen: laat `chrome.reuseExistingTab: true` ingeschakeld. OpenClaw
  activeert een bestaand tabblad voor dezelfde Meet-URL voordat een nieuw tabblad wordt geopend, en
  het aanmaken van browservergaderingen hergebruikt een lopend `https://meet.google.com/new`-
  of Google-accountprompttabblad voordat een ander wordt geopend.
- Geen audio: routeer in Meet microfoon-/luidsprekeraudio via het virtuele audioapparaatpad
  dat OpenClaw gebruikt; gebruik aparte virtuele apparaten of Loopback-achtige routing
  voor schone duplexaudio.

## Installatieopmerkingen

De Chrome-talk-back-standaard gebruikt twee externe tools:

- `sox`: opdrachtregel-audiohulpprogramma. De Plugin gebruikt expliciete CoreAudio-
  apparaatcommando's voor de standaard 24 kHz PCM16-audiobrug.
- `blackhole-2ch`: macOS virtueel audiostuurprogramma. Het maakt het `BlackHole 2ch`-
  audioapparaat dat Chrome/Meet kan routeren.

OpenClaw bundelt of verspreidt geen van beide pakketten. De documentatie vraagt gebruikers om
ze als hostafhankelijkheden via Homebrew te installeren. SoX is gelicentieerd als
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole is GPL-3.0. Als je een
installer of appliance bouwt die BlackHole met OpenClaw bundelt, controleer dan BlackHole's
upstreamlicentievoorwaarden of verkrijg een aparte licentie van Existential Audio.

## Transporten

### Chrome

Chrome-transport opent de Meet-URL via OpenClaw-browserbesturing en neemt deel
als het ingelogde OpenClaw-browserprofiel. Op macOS controleert de Plugin vóór
het starten op `BlackHole 2ch`. Indien geconfigureerd voert het ook een health-commando
voor de audiobrug en een opstartcommando uit voordat Chrome wordt geopend. Gebruik `chrome` wanneer
Chrome/audio op de Gateway-host draaien; gebruik `chrome-node` wanneer Chrome/audio draaien
op een gekoppelde Node zoals een Parallels macOS-VM. Kies voor lokale Chrome het
profiel met `browser.defaultProfile`; `chrome.browserProfile` wordt doorgegeven aan
`chrome-node`-hosts.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Routeer Chrome-microfoon- en luidsprekeraudio via de lokale OpenClaw-audio-
brug. Als `BlackHole 2ch` niet is geïnstalleerd, mislukt deelnemen met een setupfout
in plaats van stil deel te nemen zonder audiopad.

### Twilio

Twilio-transport is een strikt belplan dat wordt gedelegeerd aan de Voice Call-Plugin. Het
parseert geen Meet-pagina's voor telefoonnummers.

Gebruik dit wanneer Chrome-deelname niet beschikbaar is of wanneer je een telefonische inbel-
fallback wilt. Google Meet moet een telefonisch inbelnummer en pincode voor de
vergadering tonen; OpenClaw ontdekt die niet vanaf de Meet-pagina.

Schakel de Voice Call-Plugin in op de Gateway-host, niet op de Chrome-Node:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
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
          inboundPolicy: "allowlist",
          realtime: {
            enabled: true,
            provider: "google",
            instructions: "Join this Google Meet as an OpenClaw agent. Be brief.",
            toolPolicy: "safe-read-only",
            providers: {
              google: {
                silenceDurationMs: 500,
                startSensitivity: "high",
              },
            },
          },
        },
      },
      google: {
        enabled: true,
      },
    },
  },
}
```

Geef Twilio-referenties op via omgeving of configuratie. Omgeving houdt
geheimen buiten `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Gebruik in plaats daarvan `realtime.provider: "openai"` met de OpenAI-provider-Plugin en
`OPENAI_API_KEY` als dat je realtime-spraakprovider is.

Herstart of herlaad de Gateway na het inschakelen van `voice-call`; Pluginconfiguratiewijzigingen
verschijnen pas in een al draaiend Gateway-proces nadat het opnieuw laadt.

Controleer daarna:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Wanneer Twilio-delegatie is aangesloten, bevat `googlemeet setup` succesvolle
`twilio-voice-call-plugin`-, `twilio-voice-call-credentials`- en
`twilio-voice-call-webhook`-controles.

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

OAuth is optioneel voor het aanmaken van een Meet-link omdat `googlemeet create` kan terugvallen
op browserautomatisering. Configureer OAuth wanneer je officieel API-aanmaken,
space-resolutie, of Meet Media API-preflightcontroles wilt.

Google Meet API-toegang gebruikt gebruikers-OAuth: maak een Google Cloud OAuth-client aan,
vraag de vereiste scopes aan, autoriseer een Google-account, en sla daarna het
resulterende refresh-token op in de Google Meet-Pluginconfiguratie of geef de
`OPENCLAW_GOOGLE_MEET_*`-omgevingsvariabelen op.

OAuth vervangt het Chrome-deelnamepad niet. Chrome- en Chrome-node-transporten
nemen nog steeds deel via een ingelogd Chrome-profiel, BlackHole/SoX, en een verbonden
Node wanneer je browserdeelname gebruikt. OAuth is alleen voor het officiële Google
Meet API-pad: vergaderruimtes aanmaken, spaces oplossen, en Meet Media API-
preflightcontroles uitvoeren.

### Google-referenties aanmaken

In Google Cloud Console:

1. Maak een Google Cloud-project aan of selecteer er een.
2. Schakel **Google Meet REST API** in voor dat project.
3. Configureer het OAuth-toestemmingsscherm.
   - **Intern** is het eenvoudigst voor een Google Workspace-organisatie.
   - **Extern** werkt voor persoonlijke/testopstellingen; voeg, zolang de app in Testing is,
     elk Google-account dat de app zal autoriseren toe als testgebruiker.
4. Voeg de scopes toe die OpenClaw aanvraagt:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Maak een OAuth-client-ID aan.
   - Applicatietype: **Webapplicatie**.
   - Geautoriseerde redirect-URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Kopieer de client-ID en het clientgeheim.

`meetings.space.created` is vereist door Google Meet `spaces.create`.
`meetings.space.readonly` laat OpenClaw Meet-URL's/-codes naar spaces omzetten.
`meetings.space.settings` laat OpenClaw `SpaceConfig`-instellingen doorgeven, zoals
`accessType`, tijdens het aanmaken van API-ruimtes.
`meetings.conference.media.readonly` is voor Meet Media API-preflight en media-
werk; Google kan Developer Preview-inschrijving vereisen voor daadwerkelijk Media API-gebruik.
Als je alleen browsergebaseerde Chrome-deelnames nodig hebt, sla OAuth volledig over.

### Het refresh-token uitgeven

Configureer `oauth.clientId` en optioneel `oauth.clientSecret`, of geef ze door als
omgevingsvariabelen, en voer daarna uit:

```bash
openclaw googlemeet auth login --json
```

Het commando print een `oauth`-configuratieblok met een refresh-token. Het gebruikt PKCE,
localhost-callback op `http://localhost:8085/oauth2callback`, en een handmatige
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

Sla het `oauth`-object op onder de Google Meet-Pluginconfiguratie:

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

Geef de voorkeur aan omgevingsvariabelen wanneer je het refresh-token niet in configuratie wilt.
Als zowel configuratie- als omgevingswaarden aanwezig zijn, gebruikt de Plugin eerst
configuratie en daarna omgevingsfallback.

De OAuth-toestemming omvat het aanmaken van Meet-spaces, leestoegang tot Meet-spaces, en lees-
toegang tot Meet-conferentiemedia. Als je je hebt geauthenticeerd voordat ondersteuning voor het aanmaken van
vergaderingen bestond, voer `openclaw googlemeet auth login --json` opnieuw uit zodat het refresh-
token de scope `meetings.space.created` heeft.

### OAuth verifiëren met doctor

Voer de OAuth-doctor uit wanneer je een snelle, niet-geheime healthcheck wilt:

```bash
openclaw googlemeet doctor --oauth --json
```

Dit laadt de Chrome-runtime niet en vereist geen verbonden Chrome-Node. Het
controleert dat OAuth-configuratie bestaat en dat het refresh-token een access-
token kan uitgeven. Het JSON-rapport bevat alleen statusvelden zoals `ok`, `configured`,
`tokenSource`, `expiresAt`, en controleberichten; het print het access-
token, refresh-token of clientgeheim niet.

Veelvoorkomende resultaten:

| Controle            | Betekenis                                                                              |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` plus `oauth.refreshToken`, of een gecachte toegangstoken, is aanwezig. |
| `oauth-token`        | De gecachte toegangstoken is nog geldig, of de vernieuwingstoken heeft een nieuwe toegangstoken uitgegeven. |
| `meet-spaces-get`    | Optionele `--meeting`-controle heeft een bestaande Meet-ruimte gevonden.                |
| `meet-spaces-create` | Optionele `--create-space`-controle heeft een nieuwe Meet-ruimte gemaakt.               |

Voer ook de create-controle met neveneffect uit om de inschakeling van de Google Meet API en de `spaces.create`-scope te bewijzen:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` maakt een wegwerp-Meet-URL. Gebruik dit wanneer je moet bevestigen dat de Google Cloud-project de Meet API heeft ingeschakeld en dat het geautoriseerde account de `meetings.space.created`-scope heeft.

Om leestoegang voor een bestaande vergaderruimte te bewijzen:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` en `resolve-space` bewijzen leestoegang tot een bestaande ruimte waartoe het geautoriseerde Google-account toegang heeft. Een `403` uit deze controles betekent meestal dat de Google Meet REST API is uitgeschakeld, dat de toegestemde vernieuwingstoken de vereiste scope mist, of dat het Google-account geen toegang heeft tot die Meet-ruimte. Een vernieuwingstokenfout betekent dat je `openclaw googlemeet auth login
--json` opnieuw moet uitvoeren en het nieuwe `oauth`-blok moet opslaan.

Er zijn geen OAuth-referenties nodig voor de browserfallback. In die modus komt Google-authenticatie uit het ingelogde Chrome-profiel op de geselecteerde node, niet uit de OpenClaw-configuratie.

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

Geef vergaderartefacten en aanwezigheid weer nadat Meet conferentierecords heeft gemaakt:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Met `--meeting` gebruiken `artifacts` en `attendance` standaard het nieuwste conferentierecord. Geef `--all-conference-records` door wanneer je elk bewaard record voor die vergadering wilt.

Calendar-opzoeking kan de vergader-URL uit Google Calendar oplossen voordat Meet-artefacten worden gelezen:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` doorzoekt de `primary`-agenda van vandaag naar een Calendar-event met een Google Meet-link. Gebruik `--event <query>` om overeenkomende eventtekst te zoeken, en `--calendar <id>` voor een niet-primaire agenda. Calendar-opzoeking vereist een nieuwe OAuth-login die de alleen-lezen scope voor Calendar-events bevat.
`calendar-events` toont een preview van de overeenkomende Meet-events en markeert het event dat `latest`, `artifacts`, `attendance` of `export` zal kiezen.

Als je de conferentierecord-id al weet, adresseer deze dan direct:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Beëindig een actieve conferentie voor een via de API gemaakte ruimte wanneer je de ruimte na het gesprek wilt sluiten:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Dit roept Google Meet `spaces.endActiveConference` aan en vereist OAuth met de `meetings.space.created`-scope voor een ruimte die het geautoriseerde account kan beheren.
OpenClaw accepteert invoer als Meet-URL, vergadercode of `spaces/{id}` en lost die op naar de API-ruimteresource voordat de actieve conferentie wordt beëindigd.
Dit staat los van `googlemeet leave`: `leave` stopt de lokale/sessie-deelname van OpenClaw, terwijl `end-active-conference` Google Meet vraagt de actieve conferentie voor de ruimte te beëindigen.

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

`artifacts` retourneert metagegevens van conferentierecords plus metagegevens van deelnemer-, opname-, transcript-, gestructureerde transcript-entry- en smart-note-resources wanneer Google deze voor de vergadering beschikbaar stelt. Gebruik `--no-transcript-entries` om het opzoeken van entries voor grote vergaderingen over te slaan. `attendance` breidt deelnemers uit naar deelnemer-sessierijen met tijden van eerste/laatste waarneming, totale sessieduur, vlaggen voor te laat/vroeg vertrekken en dubbele deelnemerresources samengevoegd op basis van ingelogde gebruiker of weergavenaam. Geef `--no-merge-duplicates` door om ruwe deelnemerresources gescheiden te houden, `--late-after-minutes` om detectie van te laat komen af te stemmen en `--early-before-minutes` om detectie van vroeg vertrekken af te stemmen.

`export` schrijft een map met `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` en `manifest.json`.
`manifest.json` registreert de gekozen invoer, exportopties, conferentierecords, uitvoerbestanden, aantallen, tokenbron, Calendar-event wanneer er een is gebruikt, en eventuele waarschuwingen voor gedeeltelijke ophaling. Geef `--zip` door om daarnaast een draagbaar archief naast de map te schrijven. Geef `--include-doc-bodies` door om gekoppelde transcript- en smart-note-Google Docs-tekst te exporteren via Google Drive `files.export`; hiervoor is een nieuwe OAuth-login vereist die de alleen-lezen Drive Meet-scope bevat. Zonder `--include-doc-bodies` bevatten exports alleen Meet-metagegevens en gestructureerde transcriptentries. Als Google een gedeeltelijke artefactfout retourneert, zoals een smart-note-listing-, transcript-entry- of Drive document-body-fout, behouden de samenvatting en het manifest de waarschuwing in plaats van de hele export te laten mislukken.
Gebruik `--dry-run` om dezelfde artefact-/aanwezigheidsgegevens op te halen en de manifest-JSON af te drukken zonder de map of ZIP te maken. Dat is nuttig voordat je een grote export schrijft of wanneer een agent alleen aantallen, geselecteerde records en waarschuwingen nodig heeft.

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

Stel `"dryRun": true` in om alleen het exportmanifest te retourneren en het schrijven van bestanden over te slaan.

Agents kunnen ook een API-ondersteunde ruimte maken met een expliciet toegangsbeleid:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

En ze kunnen de actieve conferentie voor een bekende ruimte beëindigen:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Voor luister-eerst-validatie moeten agents `test_listen` gebruiken voordat ze beweren dat de vergadering nuttig is:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Voer de bewaakte live smoke uit tegen een echte bewaarde vergadering:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Voer de live luister-eerst-browserprobe uit tegen een vergadering waarin iemand zal spreken met beschikbare Meet-ondertiteling:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Live smoke-omgeving:

- `OPENCLAW_LIVE_TEST=1` schakelt bewaakte live tests in.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` wijst naar een bewaarde Meet-URL, code of
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` of `GOOGLE_MEET_CLIENT_ID` levert de OAuth-client-id.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` of `GOOGLE_MEET_REFRESH_TOKEN` levert
  de vernieuwingstoken.
- Optioneel: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` en
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` gebruiken dezelfde fallbacknamen
  zonder het voorvoegsel `OPENCLAW_`.

De basis-live-smoke voor artefacten/aanwezigheid heeft `https://www.googleapis.com/auth/meetings.space.readonly` en `https://www.googleapis.com/auth/meetings.conference.media.readonly` nodig. Calendar-opzoeking heeft `https://www.googleapis.com/auth/calendar.events.readonly` nodig. Drive document-body-export heeft `https://www.googleapis.com/auth/drive.meet.readonly` nodig.

Maak een nieuwe Meet-ruimte:

```bash
openclaw googlemeet create
```

De opdracht drukt de nieuwe `meeting uri`, bron en joinsessie af. Met OAuth-referenties gebruikt deze de officiële Google Meet API. Zonder OAuth-referenties gebruikt deze als fallback het ingelogde browserprofiel van de vastgezette Chrome-node. Agents kunnen de `google_meet`-tool met `action: "create"` gebruiken om in één stap te maken en deel te nemen. Geef `"join": false` door voor alleen-URL-aanmaak.

Voorbeeld-JSON-uitvoer van de browserfallback:

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

Als de browserfallback Google-login of een Meet-machtigingsblokkade tegenkomt voordat deze de URL kan maken, retourneert de Gateway-methode een mislukte respons en retourneert de `google_meet`-tool gestructureerde details in plaats van een platte tekenreeks:

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

Wanneer een agent `manualActionRequired: true` ziet, moet deze de `manualActionMessage` plus de browser-node-/tabcontext rapporteren en stoppen met het openen van nieuwe Meet-tabs totdat de operator de browserstap voltooit.

Voorbeeld-JSON-uitvoer van API-aanmaak:

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

Het maken van een Meet neemt standaard deel. Het Chrome- of Chrome-node-transport heeft nog steeds
een ingelogd Google Chrome-profiel nodig om via de browser deel te nemen. Als het
profiel is uitgelogd, meldt OpenClaw `manualActionRequired: true` of een
browserfallbackfout en vraagt de operator om de Google-login te voltooien voordat
opnieuw wordt geprobeerd.

Stel `preview.enrollmentAcknowledged: true` alleen in nadat je hebt bevestigd dat je Cloud-
project, OAuth-principal en vergaderdeelnemers zijn ingeschreven in het Google
Workspace Developer Preview Program voor Meet-media-API's.

## Configuratie

Het algemene Chrome-agentpad heeft alleen nodig dat de plugin is ingeschakeld, BlackHole, SoX, een
sleutel voor een realtime transcriptieprovider en een geconfigureerde OpenClaw TTS-provider.
OpenAI is de standaard transcriptieprovider; stel `realtime.voiceProvider` in op
`"google"` en `realtime.model` om Google Gemini Live te gebruiken voor de `bidi`-modus
zonder de standaard transcriptieprovider voor agentmodus te wijzigen:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# or
export GEMINI_API_KEY=...
```

Stel de pluginconfiguratie in onder `plugins.entries.google-meet.config`:

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
- `defaultMode: "agent"` (`"realtime"` wordt alleen geaccepteerd als legacy
  compatibiliteitsalias voor `"agent"`; nieuwe toolaanroepen moeten `"agent"` zeggen)
- `chromeNode.node`: optionele node-id/naam/IP voor `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: naam die wordt gebruikt op het Meet-gastscherm
  wanneer uitgelogd
- `chrome.autoJoin: true`: best-effort invullen van gastnaam en klikken op Nu deelnemen
  via OpenClaw-browserautomatisering op `chrome-node`
- `chrome.reuseExistingTab: true`: activeer een bestaand Meet-tabblad in plaats van
  duplicaten te openen
- `chrome.waitForInCallMs: 20000`: wacht tot het Meet-tabblad meldt dat het in de oproep zit
  voordat de talk-backintro wordt geactiveerd
- `chrome.audioFormat: "pcm16-24khz"`: audioformaat voor opdrachtparen. Gebruik
  `"g711-ulaw-8khz"` alleen voor legacy/aangepaste opdrachtparen die nog steeds
  telefonie-audio uitsturen.
- `chrome.audioBufferBytes: 4096`: SoX-verwerkingsbuffer voor gegenereerde Chrome-
  audio-opdrachten met opdrachtparen. Dit is de helft van SoX's standaardbuffer van 8192 bytes,
  waardoor de standaard pijplatentie wordt verminderd terwijl er ruimte blijft om deze op drukke hosts te verhogen.
  Waarden onder het minimum van SoX worden vastgezet op 17 bytes.
- `chrome.audioInputCommand`: SoX-opdracht die leest uit CoreAudio `BlackHole 2ch`
  en audio schrijft in `chrome.audioFormat`
- `chrome.audioOutputCommand`: SoX-opdracht die audio leest in `chrome.audioFormat`
  en schrijft naar CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: optionele lokale microfoonopdracht die
  signed 16-bit little-endian mono PCM schrijft voor detectie van menselijke onderbreking terwijl
  het afspelen door de assistent actief is. Dit is momenteel van toepassing op de door Gateway gehoste
  `chrome`-opdrachtpaarbridge.
- `chrome.bargeInRmsThreshold: 650`: RMS-niveau dat telt als een menselijke
  onderbreking op `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: piekniveau dat telt als een menselijke
  onderbreking op `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: minimale vertraging tussen herhaalde resets
  van menselijke onderbrekingen
- `mode: "agent"`: standaard talk-backmodus. Spraak van deelnemers wordt getranscribeerd door
  de geconfigureerde realtime transcriptieprovider, naar de geconfigureerde
  OpenClaw-agent gestuurd in een subagentsessie per vergadering, en teruggesproken via de
  normale OpenClaw TTS-runtime.
- `mode: "bidi"`: fallbackmodus met direct bidirectioneel realtime model. De
  realtime spraakprovider beantwoordt spraak van deelnemers rechtstreeks en kan
  `openclaw_agent_consult` aanroepen voor diepgaandere/door tools ondersteunde antwoorden.
- `mode: "transcribe"`: alleen-observerenmodus zonder de talk-backbridge.
- `realtime.provider: "openai"`: compatibiliteitsfallback die wordt gebruikt wanneer de gescopeerde
  providervelden hieronder niet zijn ingesteld.
- `realtime.transcriptionProvider: "openai"`: provider-id die door `agent`-modus wordt gebruikt
  voor realtime transcriptie.
- `realtime.voiceProvider`: provider-id die door `bidi`-modus wordt gebruikt voor directe realtime
  spraak. Stel dit in op `"google"` om Gemini Live te gebruiken terwijl transcriptie in agentmodus
  op OpenAI blijft.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: korte gesproken antwoorden, met
  `openclaw_agent_consult` voor diepgaandere antwoorden
- `realtime.introMessage`: korte gesproken gereedheidscontrole wanneer de realtime bridge
  verbinding maakt; stel dit in op `""` om stil deel te nemen
- `realtime.agentId`: optionele OpenClaw-agent-id voor
  `openclaw_agent_consult`; standaard `main`

Optionele overschrijvingen:

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
  defaultMode: "agent",
  realtime: {
    provider: "openai",
    transcriptionProvider: "openai",
    voiceProvider: "google",
    model: "gemini-2.5-flash-native-audio-preview-12-2025",
    agentId: "jay",
    toolPolicy: "owner",
    introMessage: "Say exactly: I'm here.",
    providers: {
      google: {
        voice: "Kore",
      },
    },
  },
}
```

ElevenLabs voor zowel luisteren als spreken in agentmodus:

```json5
{
  messages: {
    tts: {
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          modelId: "eleven_v3",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
        },
      },
    },
  },
  plugins: {
    entries: {
      "google-meet": {
        config: {
          realtime: {
            transcriptionProvider: "elevenlabs",
            providers: {
              elevenlabs: {
                modelId: "scribe_v2_realtime",
                audioFormat: "ulaw_8000",
                sampleRate: 8000,
                commitStrategy: "vad",
              },
            },
          },
        },
      },
    },
  },
}
```

De permanente Meet-stem komt van
`messages.tts.providers.elevenlabs.voiceId`. Agentantwoorden kunnen ook
per-antwoord `[[tts:voiceId=... model=eleven_v3]]`-richtlijnen gebruiken wanneer overschrijvingen
van het TTS-model zijn ingeschakeld, maar configuratie is de deterministische standaard voor vergaderingen.
Bij deelname moeten de logs `transcriptionProvider=elevenlabs` tonen en elk
gesproken antwoord moet `provider=elevenlabs model=eleven_v3 voice=<voiceId>` loggen.

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
feitelijke PSTN-oproep, DTMF en introductiebegroeting aan de Voice Call-plugin. Voice Call
speelt de DTMF-reeks af voordat de realtime mediastream wordt geopend, en gebruikt daarna de
opgeslagen introductietekst als de eerste realtime begroeting. Als `voice-call` niet
is ingeschakeld, kan Google Meet het belplan nog steeds valideren en opnemen, maar het kan
de Twilio-oproep niet plaatsen.

## Tool

Agents kunnen de tool `google_meet` gebruiken:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Gebruik `transport: "chrome"` wanneer Chrome op de Gateway-host draait. Gebruik
`transport: "chrome-node"` wanneer Chrome op een gekoppelde node draait, zoals een Parallels-
VM. In beide gevallen draaien de modelproviders en `openclaw_agent_consult` op de
Gateway-host, zodat modelreferenties daar blijven. Met de standaard `mode: "agent"`
verwerkt de realtime transcriptieprovider het luisteren, produceert de geconfigureerde OpenClaw-
agent het antwoord en spreekt reguliere OpenClaw TTS het in Meet uit. Gebruik
`mode: "bidi"` wanneer je wilt dat het realtime spraakmodel rechtstreeks antwoordt.
Ruwe `mode: "realtime"` blijft geaccepteerd als legacy compatibiliteitsalias voor
`mode: "agent"`, maar wordt niet langer geadverteerd in het agenttoolschema.
Logs in agentmodus bevatten de opgeloste transcriptieprovider/het opgeloste model bij het opstarten
van de bridge en de TTS-provider, het model, de stem, de uitvoerindeling en de samplefrequentie na
elk gesynthetiseerd antwoord.

Gebruik `action: "status"` om actieve sessies te tonen of een sessie-id te inspecteren. Gebruik
`action: "speak"` met `sessionId` en `message` om de realtime agent
onmiddellijk te laten spreken. Gebruik `action: "test_speech"` om de sessie te maken of te hergebruiken,
een bekende zin te activeren en `inCall`-gezondheid terug te geven wanneer de Chrome-host dit kan
rapporteren. `test_speech` forceert altijd `mode: "agent"` en faalt als wordt gevraagd om
te draaien in `mode: "transcribe"`, omdat alleen-observerensessies bewust geen
spraak kunnen uitsturen. Het resultaat `speechOutputVerified` is gebaseerd op het toenemen van realtime audio-
uitvoerbytes tijdens deze testaanroep, dus een hergebruikte sessie met oudere audio
telt niet als een nieuwe succesvolle spraakcontrole. Gebruik `action: "leave"` om
een sessie als beëindigd te markeren.

`status` bevat Chrome-gezondheid wanneer beschikbaar:

- `inCall`: Chrome lijkt zich in de Meet-oproep te bevinden
- `micMuted`: best-effort Meet-microfoonstatus
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: het
  browserprofiel heeft handmatige login, toelating door de Meet-host, machtigingen of
  herstel van browserbesturing nodig voordat spraak kan werken
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: of
  beheerde Chrome-spraak nu is toegestaan. `speechReady: false` betekent dat OpenClaw
  de intro-/testzin niet naar de audiobridge heeft gestuurd.
- `providerConnected` / `realtimeReady`: status van realtime spraakbridge
- `lastInputAt` / `lastOutputAt`: laatste audio gezien vanuit of verzonden naar de bridge
- `audioOutputRouted` / `audioOutputDeviceLabel`: of de media-
  uitvoer van het Meet-tabblad actief naar het BlackHole-apparaat is gerouteerd dat door de bridge wordt gebruikt
- `lastSuppressedInputAt` / `suppressedInputBytes`: loopback-invoer genegeerd terwijl
  assistentafspelen actief is

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Agent- en Bidi-modi

Chrome `agent`-modus is geoptimaliseerd voor gedrag waarbij "mijn agent in de vergadering zit". De
realtime transcriptieprovider hoort de vergaderaudio, definitieve deelnemers-
transcripten worden doorgeleid via de geconfigureerde OpenClaw-agent, en het antwoord wordt
uitgesproken via de normale OpenClaw TTS-runtime. Stel `mode: "bidi"` in wanneer je wilt
dat het realtime spraakmodel rechtstreeks antwoordt.
Nabije definitieve transcriptfragmenten worden samengevoegd vóór de consultatie, zodat één gesproken
beurt niet meerdere verouderde gedeeltelijke antwoorden produceert. Realtime invoer wordt ook
onderdrukt terwijl audio van de assistent in de wachtrij nog wordt afgespeeld,
en recente transcript-echo's die op de assistent lijken, worden genegeerd vóór de agentconsultatie
zodat BlackHole-loopback de agent niet zijn eigen spraak laat beantwoorden.

| Modus   | Wie bepaalt het antwoord       | Pad voor spraakuitvoer                | Gebruik wanneer                                       |
| ------- | ------------------------------ | ------------------------------------- | ----------------------------------------------------- |
| `agent` | De geconfigureerde OpenClaw-agent | Normale OpenClaw TTS-runtime          | Je wilt gedrag waarbij "mijn agent in de vergadering zit" |
| `bidi`  | Het realtime spraakmodel       | Audioreactie van realtime spraakprovider | Je wilt de conversatiespraaklus met de laagste latentie |

In `bidi`-modus kan het realtime model, wanneer het diepgaander redeneren, actuele
informatie of normale OpenClaw-tools nodig heeft, `openclaw_agent_consult` aanroepen.

De consult-tool voert achter de schermen de gewone OpenClaw-agent uit met recente
context uit het vergadertranscript en retourneert een beknopt gesproken antwoord. In `agent`-modus
stuurt OpenClaw dat antwoord rechtstreeks naar de TTS-runtime; in `bidi`-modus kan het
realtime spraakmodel het consultresultaat terug de vergadering in spreken. Het gebruikt
dezelfde gedeelde consult-mechaniek als Voice Call.

Standaard worden consults uitgevoerd tegen de `main`-agent. Stel `realtime.agentId` in wanneer een
Meet-lane een speciale OpenClaw-agentwerkruimte, modelstandaarden,
toolbeleid, geheugen en sessiegeschiedenis moet raadplegen.

Consults in agentmodus gebruiken een per vergadering unieke sessiesleutel `agent:<id>:subagent:google-meet:<session>`,
zodat vervolgvragen de vergadercontext behouden terwijl ze het normale
agentbeleid erven van de geconfigureerde agent.

`realtime.toolPolicy` beheert de consultuitvoering:

- `safe-read-only`: stel de consult-tool beschikbaar en beperk de gewone agent tot
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` en
  `memory_get`.
- `owner`: stel de consult-tool beschikbaar en laat de gewone agent het normale
  agenttoolbeleid gebruiken.
- `none`: stel de consult-tool niet beschikbaar aan het realtime spraakmodel.

De consult-sessiesleutel is per Meet-sessie afgebakend, zodat vervolgconsultaanroepen
eerdere consultcontext binnen dezelfde vergadering kunnen hergebruiken.

Om een gesproken gereedheidscontrole af te dwingen nadat Chrome volledig aan het gesprek heeft deelgenomen:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Voor de volledige join-and-speak-smoke:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Checklist voor live test

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
- `googlemeet setup` bevat `chrome-node-connected` wanneer Chrome-node het
  standaardtransport is of een Node is vastgezet.
- `nodes status` toont dat de geselecteerde Node verbonden is.
- De geselecteerde Node adverteert zowel `googlemeet.chrome` als `browser.proxy`.
- Het Meet-tabblad neemt deel aan het gesprek en `test-speech` retourneert Chrome-gezondheid met
  `inCall: true`.

Voor een externe Chrome-host, zoals een Parallels macOS-VM, is dit de kortste
veilige controle na het bijwerken van de Gateway of de VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Dat bewijst dat de Gateway-plugin is geladen, de VM-Node verbonden is met het
huidige token, en de Meet-audiobrug beschikbaar is voordat een agent een
echt vergaderingstabblad opent.

Voor een Twilio-smoke gebruik je een vergadering die telefonische inbelgegevens beschikbaar stelt:

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
- `voicecall` is beschikbaar in de CLI nadat de Gateway opnieuw is geladen.
- De geretourneerde sessie heeft `transport: "twilio"` en een `twilio.voiceCallId`.
- `openclaw logs --follow` toont dat DTMF TwiML is geserveerd vóór realtime TwiML, en vervolgens een
  realtimebrug met de initiële begroeting in de wachtrij.
- `googlemeet leave <sessionId>` verbreekt het gedelegeerde spraakgesprek.

## Probleemoplossing

### Agent ziet de Google Meet-tool niet

Bevestig dat de plugin is ingeschakeld in de Gateway-configuratie en laad de Gateway opnieuw:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Als je net `plugins.entries.google-meet` hebt bewerkt, herstart of herlaad dan de Gateway.
De actieve agent ziet alleen plugintools die door het huidige Gateway-proces
zijn geregistreerd.

Op niet-macOS Gateway-hosts blijft de agentgerichte `google_meet`-tool zichtbaar,
maar lokale Chrome-terugspraakacties worden geblokkeerd voordat ze de audiobrug bereiken.
Lokale Chrome-terugspraakaudio is momenteel afhankelijk van macOS `BlackHole 2ch`, dus
Linux-agents moeten `mode: "transcribe"`, Twilio-inbellen of een macOS
`chrome-node`-host gebruiken in plaats van het standaard lokale Chrome-agentpad.

### Geen verbonden Google Meet-geschikte Node

Voer op de Node-host uit:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Keur op de Gateway-host de Node goed en verifieer de opdrachten:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

De Node moet verbonden zijn en `googlemeet.chrome` plus `browser.proxy` vermelden.
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
`gateway token mismatch` meldt, installeer of herstart de Node dan opnieuw met het huidige Gateway-token.
Voor een LAN-Gateway betekent dit meestal:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Laad daarna de Node-service opnieuw en voer opnieuw uit:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Browser opent, maar agent kan niet deelnemen

Voer `googlemeet test-listen` uit voor observe-only-deelnames of `googlemeet test-speech`
voor realtime-deelnames, en inspecteer daarna de geretourneerde Chrome-gezondheid. Als een van beide probes
`manualActionRequired: true` meldt, toon dan `manualActionMessage` aan de operator
en stop met opnieuw proberen totdat de browseractie is voltooid.

Veelvoorkomende handmatige acties:

- Log in bij het Chrome-profiel.
- Laat de gast toe vanuit het Meet-hostaccount.
- Geef Chrome microfoon-/cameramachtigingen wanneer de native machtigingsprompt van Chrome
  verschijnt.
- Sluit of herstel een vastgelopen Meet-machtigingsdialoog.

Rapporteer niet "not signed in" alleen omdat Meet "Do you want people to
hear you in the meeting?" toont. Dat is het audio-keuzetussenscherm van Meet; OpenClaw
klikt via browserautomatisering op **Use microphone** wanneer beschikbaar en blijft
wachten op de echte vergaderstatus. Voor create-only browser-fallback kan OpenClaw
op **Continue without microphone** klikken, omdat voor het maken van de URL het
realtime audiopad niet nodig is.

### Vergadering maken mislukt

`googlemeet create` gebruikt eerst het Google Meet API-eindpunt `spaces.create`
wanneer OAuth-inloggegevens zijn geconfigureerd. Zonder OAuth-inloggegevens valt het terug
op de vastgezette Chrome-nodebrowser. Bevestig:

- Voor API-aanmaak: `oauth.clientId` en `oauth.refreshToken` zijn geconfigureerd,
  of overeenkomende omgevingsvariabelen `OPENCLAW_GOOGLE_MEET_*` zijn aanwezig.
- Voor API-aanmaak: het refreshtoken is aangemaakt nadat ondersteuning voor aanmaken is
  toegevoegd. Oudere tokens missen mogelijk de scope `meetings.space.created`; voer
  `openclaw googlemeet auth login --json` opnieuw uit en werk de pluginconfiguratie bij.
- Voor browser-fallback: `defaultTransport: "chrome-node"` en
  `chromeNode.node` wijzen naar een verbonden Node met `browser.proxy` en
  `googlemeet.chrome`.
- Voor browser-fallback: het OpenClaw Chrome-profiel op die Node is ingelogd
  bij Google en kan `https://meet.google.com/new` openen.
- Voor browser-fallback: nieuwe pogingen hergebruiken een bestaand `https://meet.google.com/new`
  of Google-accountprompttabblad voordat een nieuw tabblad wordt geopend. Als een agent een time-out krijgt,
  probeer de toolaanroep opnieuw in plaats van handmatig nog een Meet-tabblad te openen.
- Voor browser-fallback: als de tool `manualActionRequired: true` retourneert, gebruik dan
  de geretourneerde `browser.nodeId`, `browser.targetId`, `browserUrl` en
  `manualActionMessage` om de operator te begeleiden. Probeer niet in een lus opnieuw totdat die
  actie is voltooid.
- Voor browser-fallback: als Meet "Do you want people to hear you in the
  meeting?" toont, laat het tabblad open. OpenClaw moet via browserautomatisering op **Use microphone** klikken of, voor
  create-only fallback, op **Continue without microphone**, en blijven wachten op de gegenereerde Meet-URL. Als dat niet lukt, moet de
  fout `meet-audio-choice-required` vermelden, niet `google-login-required`.

### Agent neemt deel maar praat niet

Controleer het realtimepad:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Gebruik `mode: "agent"` voor het normale STT -> OpenClaw-agent -> TTS-terugspraakpad,
of `mode: "bidi"` voor de directe realtime spraakfallback. `mode: "transcribe"`
start bewust de terugspraakbrug niet. Voer voor observe-only debugging
`openclaw googlemeet status --json <session-id>` uit nadat deelnemers hebben gesproken
en controleer `captioning`, `transcriptLines` en `lastCaptionText`. Als `inCall`
true is maar `transcriptLines` op `0` blijft, zijn Meet-ondertitels mogelijk uitgeschakeld, heeft niemand
gesproken sinds de observer is geïnstalleerd, is de Meet-UI gewijzigd, of zijn live
ondertitels niet beschikbaar voor de vergadertaal/het account.

`googlemeet test-speech` controleert altijd het realtimepad en meldt of
bruguitvoerbytes zijn waargenomen voor die aanroep. Als `speechOutputVerified` false is en
`speechOutputTimedOut` true is, heeft de realtimeprovider de
uiting mogelijk geaccepteerd, maar zag OpenClaw geen nieuwe uitvoerbytes de Chrome-audiobrug
bereiken.

Controleer ook:

- Er is een realtimeprovider-sleutel beschikbaar op de Gateway-host, zoals
  `OPENAI_API_KEY` of `GEMINI_API_KEY`.
- `BlackHole 2ch` is zichtbaar op de Chrome-host.
- `sox` bestaat op de Chrome-host.
- Meet-microfoon en -luidspreker zijn gerouteerd via het virtuele audiopad dat door
  OpenClaw wordt gebruikt. `doctor` moet `meet output routed: yes` tonen voor lokale Chrome
  realtime-deelnames.

`googlemeet doctor [session-id]` toont de sessie, Node, in-call-status,
reden voor handmatige actie, realtimeproviderverbinding, `realtimeReady`, audio
invoer-/uitvoeractiviteit, laatste audiotijdstempels, bytetellers en browser-URL.
Gebruik `googlemeet status [session-id] --json` wanneer je de ruwe JSON nodig hebt. Gebruik
`googlemeet doctor --oauth` wanneer je Google Meet OAuth-refresh moet verifiëren
zonder tokens bloot te leggen; voeg `--meeting` of `--create-space` toe wanneer je ook
Google Meet API-bewijs nodig hebt.

Als een agent een time-out kreeg en je ziet dat er al een Meet-tabblad open is, inspecteer dat tabblad
zonder een nieuw tabblad te openen:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

De equivalente toolactie is `recover_current_tab`. Deze focust en inspecteert een
bestaand Meet-tabblad voor het geselecteerde transport. Met `chrome` gebruikt deze lokale
browserbesturing via de Gateway; met `chrome-node` gebruikt deze de geconfigureerde
Chrome-Node. Deze opent geen nieuw tabblad en maakt geen nieuwe sessie aan; hij meldt de
huidige blokkade, zoals login, toelating, machtigingen of audio-keuzestatus.
De CLI-opdracht praat met de geconfigureerde Gateway, dus de Gateway moet actief zijn;
`chrome-node` vereist ook dat de Chrome-Node verbonden is.

### Twilio-setupcontroles mislukken

`twilio-voice-call-plugin` mislukt wanneer `voice-call` niet is toegestaan of niet is ingeschakeld.
Voeg deze toe aan `plugins.allow`, schakel `plugins.entries.voice-call` in en laad de
Gateway opnieuw.

`twilio-voice-call-credentials` mislukt wanneer de Twilio-backend account-SID,
auth-token of bellernummer mist. Stel deze in op de Gateway-host:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` mislukt wanneer `voice-call` geen publieke Webhook-blootstelling heeft,
of wanneer `publicUrl` naar loopback- of privé-netwerkruimte wijst.
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

Gebruik voor lokale ontwikkeling een tunnel of Tailscale-blootstelling in plaats van een privé
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

`voicecall smoke` controleert standaard alleen de gereedheid. Om een specifiek nummer als dry-run te testen:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Voeg `--yes` alleen toe wanneer je bewust een live uitgaande meldingsoproep wilt
plaatsen:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio-oproep start maar komt nooit in de vergadering

Controleer of de Meet-gebeurtenis telefonische inbelgegevens beschikbaar maakt. Geef het exacte inbelnummer
en de pincode of een aangepaste DTMF-reeks door:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Gebruik voorloop-`w` of komma's in `--dtmf-sequence` als de provider een pauze nodig heeft
voordat de pincode wordt ingevoerd.

Als de telefoongesprek wordt aangemaakt maar de Meet-deelnemerslijst de inbeldeelnemer
nooit toont:

- Voer `openclaw googlemeet doctor <session-id>` uit om de gedelegeerde Twilio
  oproep-ID te controleren, of DTMF in de wachtrij is gezet en of de introductiebegroeting is aangevraagd.
- Voer `openclaw voicecall status --call-id <id>` uit en controleer of de oproep nog
  actief is.
- Voer `openclaw voicecall tail` uit en controleer of Twilio-webhooks bij de
  Gateway aankomen.
- Voer `openclaw logs --follow` uit en zoek naar de Twilio Meet-reeks: Google
  Meet delegeert het deelnemen, Voice Call slaat pre-connect DTMF TwiML op en serveert die,
  Voice Call serveert realtime TwiML voor de Twilio-oproep, en daarna vraagt Google Meet
  introductiespraak aan met `voicecall.speak`.
- Voer `openclaw googlemeet setup --transport twilio` opnieuw uit; een groene setupcontrole is
  vereist maar bewijst niet dat de pincodevolgorde voor de vergadering correct is.
- Controleer of het inbelnummer hoort bij dezelfde Meet-uitnodiging en regio als
  de pincode.
- Verhoog `voiceCall.dtmfDelayMs` vanaf de standaardwaarde van 12 seconden als Meet traag
  opneemt of het oproeptranscript nog steeds de prompt toont waarin om een pincode wordt gevraagd nadat
  pre-connect DTMF is verzonden.
- Als de deelnemer binnenkomt maar je de begroeting niet hoort, controleer
  `openclaw logs --follow` op het post-DTMF `voicecall.speak`-verzoek en
  ofwel TTS-weergave via mediastream of de Twilio `<Say>`-fallback. Als het oproeptranscript
  nog steeds "enter the meeting PIN" bevat, is de telefoonverbinding nog niet
  toegetreden tot de Meet-ruimte, dus deelnemers aan de vergadering zullen geen spraak horen.

Als webhooks niet aankomen, debug dan eerst de Voice Call-plugin: de provider moet
`plugins.entries.voice-call.config.publicUrl` of de geconfigureerde tunnel kunnen
bereiken. Zie [Problemen met spraakoproepen oplossen](/nl/plugins/voice-call#troubleshooting).

## Opmerkingen

De officiële media-API van Google Meet is gericht op ontvangen, dus spreken in een Meet-
gesprek heeft nog steeds een deelnemerspad nodig. Deze plugin houdt die grens zichtbaar:
Chrome verzorgt browserdeelname en lokale audioroutering; Twilio verzorgt
telefonische inbeldeelname.

Chrome-talk-backmodi hebben `BlackHole 2ch` nodig plus een van de volgende opties:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw beheert de
  bridge en leidt audio in `chrome.audioFormat` tussen die commando's en de
  geselecteerde provider. Agentmodus gebruikt realtime transcriptie plus reguliere TTS;
  bidi-modus gebruikt de realtime spraakprovider. Het standaard Chrome-pad is 24 kHz
  PCM16 met `chrome.audioBufferBytes: 4096`; 8 kHz G.711 mu-law blijft
  beschikbaar voor verouderde commandoparen.
- `chrome.audioBridgeCommand`: een extern bridge-commando beheert het volledige lokale
  audiopad en moet afsluiten nadat het de daemon heeft gestart of gevalideerd. Dit is alleen
  geldig voor `bidi`, omdat `agent`-modus directe toegang tot commandoparen nodig heeft voor TTS.

Wanneer een agent de tool `google_meet` in agentmodus aanroept, forkt de vergaderingconsultant-
sessie het huidige transcript van de aanroeper voordat deelnemersspraak wordt beantwoord.
De Meet-sessie blijft nog steeds apart (`agent:<agentId>:subagent:google-meet:<sessionId>`),
zodat vervolgstappen in de vergadering het transcript van de aanroeper niet rechtstreeks wijzigen.

Routeer voor heldere duplexaudio Meet-uitvoer en de Meet-microfoon via afzonderlijke
virtuele apparaten of een Loopback-achtige grafiek van virtuele apparaten. Een enkel gedeeld
BlackHole-apparaat kan andere deelnemers terug laten echoën in het gesprek.

Met de commandopaar-Chrome-bridge kan `chrome.bargeInInputCommand` naar een
afzonderlijke lokale microfoon luisteren en assistentweergave wissen wanneer de mens begint
te praten. Hierdoor blijft menselijke spraak voor op assistentuitvoer, zelfs wanneer de gedeelde
BlackHole-loopbackinvoer tijdelijk wordt onderdrukt tijdens assistentweergave.
Net als `chrome.audioInputCommand` en `chrome.audioOutputCommand` is dit een
door de operator geconfigureerd lokaal commando. Gebruik een expliciet vertrouwd commandopad of
argumentenlijst en wijs het niet naar scripts uit niet-vertrouwde locaties.

`googlemeet speak` activeert de actieve talk-back-audiobridge voor een Chrome-
sessie. `googlemeet leave` stopt die bridge. Voor Twilio-sessies die via de
Voice Call-plugin zijn gedelegeerd, beëindigt `leave` ook de onderliggende spraakoproep.
Gebruik `googlemeet end-active-conference` wanneer je ook de actieve
Google Meet-conferentie voor een door de API beheerde ruimte wilt sluiten.

## Gerelateerd

- [Voice Call-plugin](/nl/plugins/voice-call)
- [Praatmodus](/nl/nodes/talk)
- [Plugins bouwen](/nl/plugins/building-plugins)
