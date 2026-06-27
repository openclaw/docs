---
read_when:
    - Je wilt dat een OpenClaw-agent deelneemt aan een Google Meet-gesprek
    - Je wilt dat een OpenClaw-agent een nieuwe Google Meet-oproep maakt
    - Je configureert Chrome, Chrome-node of Twilio als Google Meet-transport
summary: 'Google Meet-Plugin: neem deel aan expliciete Meet-URL’s via Chrome of Twilio met standaardinstellingen voor agent-terugspraak'
title: Google Meet-Plugin
x-i18n:
    generated_at: "2026-06-27T17:53:51Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e85d531897e3aeadf0ac718f82a7aac5ce73715e182e96ceba77cb76eff094c4
    source_path: plugins/google-meet.md
    workflow: 16
---

Ondersteuning voor Google Meet-deelnemers voor OpenClaw — de Plugin is expliciet van opzet:

- Deze neemt alleen deel aan een expliciete `https://meet.google.com/...`-URL.
- Deze kan via de Google Meet API een nieuwe Meet-ruimte maken en vervolgens deelnemen aan de
  geretourneerde URL.
- `agent` is de standaard terugspreekmodus: realtime transcriptie luistert, de
  geconfigureerde OpenClaw-agent antwoordt, en reguliere OpenClaw-TTS spreekt in Meet.
- `bidi` blijft beschikbaar als fallbackmodus voor een direct realtime-spraakmodel.
- Agents kiezen het deelnamegedrag met `mode`: gebruik `agent` voor live
  luisteren/terugspreken, `bidi` als fallback voor directe realtime spraak, of `transcribe`
  om de browser te openen/besturen zonder de terugspreekbrug.
- Auth start als persoonlijke Google OAuth of een al ingelogd Chrome-profiel.
- Er is geen automatische toestemmingsaankondiging.
- De standaard Chrome-audiobackend is `BlackHole 2ch`.
- Chrome kan lokaal draaien of op een gekoppelde Node-host.
- Twilio accepteert een inbelnummer plus optionele PIN of DTMF-reeks; het
  kan niet rechtstreeks naar een Meet-URL bellen.
- De CLI-opdracht is `googlemeet`; `meet` is gereserveerd voor bredere
  teleconference-workflows van agents.

## Snelstart

Installeer de lokale audio-afhankelijkheden en configureer een realtime-transcriptieprovider
plus reguliere OpenClaw-TTS. OpenAI is de standaard transcriptieprovider;
Google Gemini Live werkt ook als een afzonderlijke `bidi`-spraakfallback met
`realtime.voiceProvider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
export GEMINI_API_KEY=...
```

`blackhole-2ch` installeert het virtuele audioapparaat `BlackHole 2ch`. Het
installatieprogramma van Homebrew vereist een herstart voordat macOS het apparaat toont:

```bash
sudo reboot
```

Controleer na de herstart beide onderdelen:

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

Controleer de installatie:

```bash
openclaw googlemeet setup
```

De setup-uitvoer is bedoeld om door agents leesbaar en modusbewust te zijn. Deze rapporteert het Chrome-profiel,
Node-pinning en, voor realtime Chrome-deelnames, de BlackHole/SoX-audiobrug
en vertraagde realtime-introcontroles. Controleer voor alleen-observeren-deelnames hetzelfde
transport met `--mode transcribe`; die modus slaat realtime audiovereisten over
omdat deze niet via de brug luistert of spreekt:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Wanneer Twilio-delegatie is geconfigureerd, rapporteert setup ook of de
`voice-call`-Plugin, Twilio-referenties en openbare Webhook-blootstelling klaar zijn.
Behandel elke `ok: false`-controle als een blokkade voor het gecontroleerde transport en de modus
voordat je een agent vraagt deel te nemen. Gebruik `openclaw googlemeet setup --json` voor
scripts of machineleesbare uitvoer. Gebruik `--transport chrome`,
`--transport chrome-node` of `--transport twilio` om een specifiek
transport vooraf te controleren voordat een agent het probeert.

Voor Twilio moet je het transport altijd expliciet vooraf controleren wanneer het standaardtransport
Chrome is:

```bash
openclaw googlemeet setup --transport twilio
```

Dat vangt ontbrekende `voice-call`-bedrading, Twilio-referenties of onbereikbare
Webhook-blootstelling op voordat de agent probeert in te bellen bij de vergadering.

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
artifact-, agenda-, setup-, transcriptie-, Twilio- en `chrome-node`-flows. Lokale
Chrome-terugspreekacties worden daar geblokkeerd omdat het gebundelde Chrome-audiopad
momenteel afhankelijk is van macOS `BlackHole 2ch`. Gebruik op Linux `mode: "transcribe"`,
Twilio-inbellen of een macOS `chrome-node`-host voor Chrome-terugspreekdeelname.

Maak een nieuwe vergadering en neem eraan deel:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

Gebruik voor via de API gemaakte ruimtes Google Meet `SpaceConfig.accessType` wanneer je wilt
dat het geen-aanklopbeleid van de ruimte expliciet is in plaats van overgenomen uit de standaardinstellingen
van het Google-account:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` laat iedereen met de Meet-URL deelnemen zonder aan te kloppen. `TRUSTED` laat de
vertrouwde gebruikers van de hostorganisatie, uitgenodigde externe gebruikers en inbelgebruikers
deelnemen zonder aan te kloppen. `RESTRICTED` beperkt toegang zonder aankloppen tot genodigden. Deze
instellingen zijn alleen van toepassing op het officiële aanmaakpad van de Google Meet API, dus OAuth-
referenties moeten zijn geconfigureerd.

Als je Google Meet hebt geauthenticeerd voordat deze optie beschikbaar was, voer dan opnieuw
`openclaw googlemeet auth login --json` uit nadat je het
`meetings.space.settings`-bereik aan je Google OAuth-toestemmingsscherm hebt toegevoegd.

Maak alleen de URL zonder deel te nemen:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` heeft twee paden:

- API-aanmaak: gebruikt wanneer Google Meet OAuth-referenties zijn geconfigureerd. Dit is
  het meest deterministische pad en is niet afhankelijk van de browser-UI-status.
- Browserfallback: gebruikt wanneer OAuth-referenties ontbreken. OpenClaw gebruikt de
  gepinde Chrome-Node, opent `https://meet.google.com/new`, wacht tot Google
  omleidt naar een echte URL met vergadercode en retourneert vervolgens die URL. Dit pad vereist
  dat het OpenClaw Chrome-profiel op de Node al bij Google is ingelogd.
  Browserautomatisering verwerkt de eigen eerste microfoonprompt van Meet; die prompt
  wordt niet behandeld als een Google-inlogfout.
  Deelname- en aanmaakflows proberen ook een bestaande Meet-tab te hergebruiken voordat ze een
  nieuwe openen. Matching negeert onschuldige URL-querystrings zoals `authuser`, zodat een
  nieuwe poging van een agent de al geopende vergadering zou moeten focussen in plaats van een tweede
  Chrome-tab te maken.

De opdracht-/tooluitvoer bevat een `source`-veld (`api` of `browser`), zodat agents
kunnen uitleggen welk pad is gebruikt. `create` neemt standaard deel aan de nieuwe vergadering en
retourneert `joined: true` plus de deelnamesessie. Gebruik
`create --no-join` in de CLI, of geef `"join": false` door aan de tool, om alleen de URL te maken.

Of zeg tegen een agent: "Maak een Google Meet, neem eraan deel met de terugspreekmodus van de agent,
en stuur mij de link." De agent moet `google_meet` aanroepen met
`action: "create"` en vervolgens de geretourneerde `meetingUri` delen.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Stel voor een alleen-observeren/browserbesturingsdeelname `"mode": "transcribe"` in. Dat start
niet de duplex realtime-spraakbrug, vereist geen BlackHole of SoX,
en zal niet terugspreken in de vergadering. Chrome-deelnames in deze modus vermijden ook
OpenClaw's toestemmingsverlening voor microfoon/camera en vermijden het Meet-pad **Use
microphone**. Als Meet een interstitial voor audiokeuze toont, probeert automatisering
het pad zonder microfoon en rapporteert anders een handmatige actie in plaats van
de lokale microfoon te openen. In transcriptiemodus installeren beheerde Chrome-transporten ook
een best-effort Meet-ondertitelingsobserver. `googlemeet status --json` en
`googlemeet doctor` tonen `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`,
en een korte `recentTranscript`-staart, zodat operators kunnen zien of de browser
aan het gesprek heeft deelgenomen en of Meet-ondertitels tekst produceren.
Gebruik `openclaw googlemeet test-listen <meet-url> --transport chrome-node` wanneer
je een ja/nee-probe nodig hebt: deze neemt deel in transcriptiemodus, wacht op nieuwe beweging in ondertitels of
transcriptie, en retourneert `listenVerified`, `listenTimedOut`, velden voor handmatige
actie en de nieuwste ondertitelingsstatus.

Tijdens realtime sessies bevat de `google_meet`-status browser- en audiobrugstatus,
zoals `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, laatste invoer-/uitvoer-
tijdstempels, bytetellers en gesloten status van de brug. Als een veilige Meet-paginaprompt
verschijnt, verwerkt browserautomatisering deze wanneer dat kan. Inlog-, hosttoelatings- en
browser-/OS-toestemmingsprompts worden gerapporteerd als handmatige actie met een reden en
bericht dat de agent kan doorgeven. Beheerde Chrome-sessies geven de intro- of
testzin alleen weer nadat browserstatus `inCall: true` rapporteert; anders rapporteert status
`speechReady: false` en wordt de spreekpoging geblokkeerd in plaats van te doen alsof de
agent in de vergadering heeft gesproken.

Lokale Chrome-deelnames verlopen via het ingelogde OpenClaw-browserprofiel. Realtime modus
vereist `BlackHole 2ch` voor het microfoon-/speakerpad dat door OpenClaw wordt gebruikt. Gebruik voor
schone duplexaudio afzonderlijke virtuele apparaten of een Loopback-achtige grafiek; een
enkel BlackHole-apparaat is genoeg voor een eerste rooktest, maar kan echo veroorzaken.

### Lokale Gateway + Parallels Chrome

Je hebt **geen** volledige OpenClaw Gateway of model-API-sleutel binnen een macOS-VM
nodig alleen om de VM eigenaar van Chrome te maken. Draai de Gateway en agent lokaal en draai vervolgens een
Node-host in de VM. Schakel de gebundelde Plugin eenmaal in op de VM, zodat de Node
de Chrome-opdracht adverteert:

Wat waar draait:

- Gateway-host: OpenClaw Gateway, agent-werkruimte, model-/API-sleutels, realtime
  provider en de Google Meet-Pluginconfiguratie.
- Parallels macOS-VM: OpenClaw CLI/Node-host, Google Chrome, SoX, BlackHole 2ch,
  en een Chrome-profiel dat bij Google is ingelogd.
- Niet nodig in de VM: Gateway-service, agent-configuratie, OpenAI/GPT-sleutel of model-
  providerinstelling.

Installeer de VM-afhankelijkheden:

```bash
brew install blackhole-2ch sox
```

Herstart de VM na het installeren van BlackHole, zodat macOS `BlackHole 2ch` toont:

```bash
sudo reboot
```

Controleer na de herstart of de VM het audioapparaat en de SoX-opdrachten kan zien:

```bash
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Installeer of werk OpenClaw bij in de VM en schakel daar vervolgens de gebundelde Plugin in:

```bash
openclaw plugins enable google-meet
```

Start de Node-host in de VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Als `<gateway-host>` een LAN-IP is en je geen TLS gebruikt, weigert de Node de
plaintext WebSocket tenzij je daar expliciet voor kiest voor dat vertrouwde privénetwerk:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gebruik dezelfde omgevingsvariabele bij het installeren van de Node als LaunchAgent:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` is een procesomgeving, geen
`openclaw.json`-instelling. `openclaw node install` slaat deze op in de LaunchAgent-
omgeving wanneer deze aanwezig is op de installatieopdracht.

Keur de Node goed vanaf de Gateway-host:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

Bevestig dat de Gateway de Node ziet en dat deze zowel `googlemeet.chrome`
als browsercapaciteit/`browser.proxy` adverteert:

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

of vraag de agent de `google_meet`-tool te gebruiken met `transport: "chrome-node"`.

Voor een rooktest met één opdracht die een sessie maakt of hergebruikt, een bekende
zin uitspreekt en sessiestatus afdrukt:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Tijdens realtime deelnemen vult de browserautomatisering van OpenClaw de gastnaam in, klikt op
Deelnemen/Vragen om deel te nemen, en accepteert Meet's eerste-keer-keuze "Microfoon gebruiken" wanneer die
prompt verschijnt. Tijdens alleen-observeren deelnemen of alleen-browser vergaderingen maken, gaat het
door voorbij dezelfde prompt zonder microfoon wanneer die keuze beschikbaar is.
Als het browserprofiel niet is ingelogd, Meet wacht op toelating door de host,
Chrome microfoon-/cameratoestemming nodig heeft voor realtime deelnemen, of Meet vastzit
op een prompt die automatisering niet kon oplossen, rapporteert het join/test-speech-resultaat
`manualActionRequired: true` met `manualActionReason` en
`manualActionMessage`. Agents moeten stoppen met opnieuw proberen deel te nemen, precies dat
bericht plus de huidige `browserUrl`/`browserTitle` rapporteren, en pas opnieuw proberen nadat de
handmatige browseractie is voltooid.

Als `chromeNode.node` is weggelaten, selecteert OpenClaw automatisch alleen wanneer precies één
verbonden node zowel `googlemeet.chrome` als browserbesturing adverteert. Als
meerdere geschikte nodes zijn verbonden, stel `chromeNode.node` dan in op de node-id,
weergavenaam of externe IP.

Veelvoorkomende foutcontroles:

- `Configured Google Meet node ... is not usable: offline`: de vastgezette node is
  bekend bij de Gateway maar niet beschikbaar. Agents moeten die node behandelen als
  diagnostische staat, niet als een bruikbare Chrome-host, en de setup-blokkade rapporteren
  in plaats van terug te vallen op een ander transport, tenzij de gebruiker daarom vroeg.
- `No connected Google Meet-capable node`: start `openclaw node run` in de VM,
  keur koppeling goed, en zorg dat `openclaw plugins enable google-meet` en
  `openclaw plugins enable browser` in de VM zijn uitgevoerd. Controleer ook dat de
  Gateway-host beide node-commando's toestaat met
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: installeer `blackhole-2ch` op de host
  die wordt gecontroleerd en herstart voordat je lokale Chrome-audio gebruikt.
- `BlackHole 2ch audio device not found on the node`: installeer `blackhole-2ch`
  in de VM en herstart de VM.
- Chrome opent maar kan niet deelnemen: log in op het browserprofiel binnen de VM, of
  houd `chrome.guestName` ingesteld voor deelnemen als gast. Automatisch deelnemen als gast gebruikt OpenClaw
  browserautomatisering via de node-browserproxy; zorg dat de node-browserconfiguratie
  verwijst naar het gewenste profiel, bijvoorbeeld
  `browser.defaultProfile: "user"` of een benoemd profiel met bestaande sessie.
- Dubbele Meet-tabbladen: laat `chrome.reuseExistingTab: true` ingeschakeld. OpenClaw
  activeert een bestaand tabblad voor dezelfde Meet-URL voordat een nieuw wordt geopend, en
  het maken van vergaderingen in de browser hergebruikt een lopend `https://meet.google.com/new`
  of Google-accountprompttabblad voordat nog een wordt geopend.
- Geen audio: routeer in Meet microfoon-/luidsprekeraudio via het virtuele audioapparaatpad
  dat OpenClaw gebruikt; gebruik afzonderlijke virtuele apparaten of Loopback-achtige routering
  voor schone duplexaudio.

## Installatieopmerkingen

De standaard Chrome-terugspraak gebruikt twee externe tools:

- `sox`: opdrachtregel-audiohulpprogramma. De Plugin gebruikt expliciete CoreAudio
  apparaatcommando's voor de standaard 24 kHz PCM16-audiobridge.
- `blackhole-2ch`: virtuele audiodriver voor macOS. Deze maakt het `BlackHole 2ch`
  audioapparaat dat Chrome/Meet kan gebruiken voor routering.

OpenClaw bundelt of herdistribueert geen van beide pakketten. De docs vragen gebruikers ze
als hostafhankelijkheden via Homebrew te installeren. SoX is gelicentieerd als
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole is GPL-3.0. Als je een
installatieprogramma of appliance bouwt die BlackHole met OpenClaw bundelt, controleer dan de
upstream licentievoorwaarden van BlackHole of verkrijg een aparte licentie van Existential Audio.

## Transporten

### Chrome

Chrome-transport opent de Meet-URL via OpenClaw-browserbesturing en neemt deel
als het ingelogde OpenClaw-browserprofiel. Op macOS controleert de Plugin op
`BlackHole 2ch` voor het starten. Indien geconfigureerd, voert deze ook een gezondheidscommando
voor de audiobridge en een opstartcommando uit voordat Chrome wordt geopend. Gebruik `chrome` wanneer
Chrome/audio op de Gateway-host draaien; gebruik `chrome-node` wanneer Chrome/audio draaien
op een gekoppelde node zoals een Parallels macOS-VM. Kies voor lokale Chrome het
profiel met `browser.defaultProfile`; `chrome.browserProfile` wordt doorgegeven aan
`chrome-node`-hosts.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Routeer Chrome-microfoon- en luidsprekeraudio via de lokale OpenClaw-audiobridge.
Als `BlackHole 2ch` niet is geïnstalleerd, mislukt het deelnemen met een setupfout
in plaats van stilzwijgend deel te nemen zonder audiopad.

### Twilio

Twilio-transport is een strikt belplan dat wordt gedelegeerd aan de Voice Call Plugin. Het
parseert geen Meet-pagina's voor telefoonnummers.

Gebruik dit wanneer Chrome-deelname niet beschikbaar is of wanneer je een terugvaloptie voor telefonisch inbellen
wilt. Google Meet moet een telefonisch inbelnummer en pincode voor de
vergadering beschikbaar maken; OpenClaw ontdekt die niet vanaf de Meet-pagina.

Schakel de Voice Call Plugin in op de Gateway-host, niet op de Chrome-node:

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

Geef Twilio-referenties op via omgeving of configuratie. De omgeving houdt
geheimen buiten `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Gebruik in plaats daarvan `realtime.provider: "openai"` met de OpenAI provider-Plugin en
`OPENAI_API_KEY` als dat je realtime spraakprovider is.

Herstart of herlaad de Gateway na het inschakelen van `voice-call`; Plugin-configuratiewijzigingen
verschijnen pas in een al draaiend Gateway-proces nadat het opnieuw laadt.

Verifieer daarna:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Wanneer Twilio-delegatie is aangesloten, bevat `googlemeet setup` geslaagde
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

OAuth is optioneel voor het maken van een Meet-link omdat `googlemeet create` kan
terugvallen op browserautomatisering. Configureer OAuth wanneer je officiële API-aanmaak,
space-resolutie of Meet Media API-preflightcontroles wilt.

Google Meet API-toegang gebruikt gebruikers-OAuth: maak een Google Cloud OAuth-client,
vraag de vereiste scopes aan, autoriseer een Google-account, en sla vervolgens het
resulterende refresh-token op in de Google Meet Plugin-configuratie of geef de
`OPENCLAW_GOOGLE_MEET_*`-omgevingsvariabelen op.

OAuth vervangt het Chrome-deelnamepad niet. Chrome- en Chrome-node-transporten
nemen nog steeds deel via een ingelogd Chrome-profiel, BlackHole/SoX, en een verbonden
node wanneer je browserdeelname gebruikt. OAuth is alleen voor het officiële Google
Meet API-pad: vergaderruimtes maken, ruimtes oplossen en Meet Media API
preflightcontroles uitvoeren.

### Google-referenties maken

In Google Cloud Console:

1. Maak of selecteer een Google Cloud-project.
2. Schakel **Google Meet REST API** in voor dat project.
3. Configureer het OAuth-toestemmingsscherm.
   - **Intern** is het eenvoudigst voor een Google Workspace-organisatie.
   - **Extern** werkt voor persoonlijke/testsetups; zolang de app in Testing staat,
     voeg je elk Google-account dat de app zal autoriseren toe als testgebruiker.
4. Voeg de scopes toe die OpenClaw aanvraagt:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Maak een OAuth-client-ID.
   - Applicatietype: **Webapplicatie**.
   - Geautoriseerde redirect-URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Kopieer de client-ID en het clientgeheim.

`meetings.space.created` is vereist door Google Meet `spaces.create`.
`meetings.space.readonly` laat OpenClaw Meet-URL's/codes oplossen naar ruimtes.
`meetings.space.settings` laat OpenClaw `SpaceConfig`-instellingen doorgeven zoals
`accessType` tijdens het maken van API-ruimtes.
`meetings.conference.media.readonly` is voor Meet Media API-preflight en mediawerk;
Google kan Developer Preview-inschrijving vereisen voor daadwerkelijk Media API-gebruik.
Als je alleen browsergebaseerde Chrome-deelnames nodig hebt, sla OAuth dan volledig over.

### Het refresh-token aanmaken

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

Geef de voorkeur aan omgevingsvariabelen wanneer je het refresh-token niet in configuratie wilt.
Als zowel configuratie- als omgevingswaarden aanwezig zijn, lost de Plugin eerst
configuratie op en daarna de omgeving als terugval.

De OAuth-toestemming omvat het maken van Meet-ruimtes, leestoegang tot Meet-ruimtes, en
leestoegang tot Meet-conferentiemedia. Als je je hebt geauthenticeerd voordat ondersteuning
voor het maken van vergaderingen bestond, voer `openclaw googlemeet auth login --json` opnieuw uit zodat het refresh-token
de scope `meetings.space.created` heeft.

### OAuth verifiëren met doctor

Voer de OAuth-doctor uit wanneer je een snelle gezondheidscontrole zonder geheimen wilt:

```bash
openclaw googlemeet doctor --oauth --json
```

Dit laadt de Chrome-runtime niet en vereist geen verbonden Chrome-node. Het
controleert dat OAuth-configuratie bestaat en dat het refresh-token een access-token kan
aanmaken. Het JSON-rapport bevat alleen statusvelden zoals `ok`, `configured`,
`tokenSource`, `expiresAt`, en controleberichten; het print niet het access-token,
refresh-token of clientgeheim.

Veelvoorkomende resultaten:

| Controle             | Betekenis                                                                               |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` plus `oauth.refreshToken`, of een gecachte toegangstoken, is aanwezig. |
| `oauth-token`        | De gecachte toegangstoken is nog geldig, of de vernieuwingstoken heeft een nieuwe toegangstoken uitgegeven. |
| `meet-spaces-get`    | Optionele `--meeting`-controle heeft een bestaande Meet-ruimte opgelost.                |
| `meet-spaces-create` | Optionele `--create-space`-controle heeft een nieuwe Meet-ruimte gemaakt.               |

Voer de create-controle met neveneffecten uit om ook de inschakeling van de Google Meet API en het `spaces.create`-bereik te bewijzen:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` maakt een tijdelijke Meet-URL. Gebruik dit wanneer je moet bevestigen dat de Google Cloud-project de Meet API heeft ingeschakeld en dat het geautoriseerde account het `meetings.space.created`-bereik heeft.

Om leestoegang voor een bestaande vergaderruimte te bewijzen:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` en `resolve-space` bewijzen leestoegang tot een bestaande ruimte waartoe het geautoriseerde Google-account toegang heeft. Een `403` van deze controles betekent meestal dat de Google Meet REST API is uitgeschakeld, dat de ingestemde vernieuwingstoken het vereiste bereik mist, of dat het Google-account geen toegang heeft tot die Meet-ruimte. Een vernieuwingstokenfout betekent dat je `openclaw googlemeet auth login
--json` opnieuw moet uitvoeren en het nieuwe `oauth`-blok moet opslaan.

Er zijn geen OAuth-referenties nodig voor de browserfallback. In die modus komt Google-authenticatie van het aangemelde Chrome-profiel op de geselecteerde Node, niet uit de OpenClaw-configuratie.

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

Geef vergaderartefacten en aanwezigheid weer nadat Meet conferentierecords heeft gemaakt:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Met `--meeting` gebruiken `artifacts` en `attendance` standaard het nieuwste conferentierecord. Geef `--all-conference-records` mee wanneer je elk bewaard record voor die vergadering wilt.

Agenda-opzoeking kan de vergader-URL uit Google Calendar oplossen voordat Meet-artefacten worden gelezen:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` doorzoekt de `primary`-agenda van vandaag naar een Calendar-afspraak met een Google Meet-link. Gebruik `--event <query>` om overeenkomende afspraaktekst te zoeken, en `--calendar <id>` voor een niet-primaire agenda. Agenda-opzoeking vereist een nieuwe OAuth-login die het alleen-lezenbereik voor Calendar-afspraken bevat.
`calendar-events` toont een voorbeeld van de overeenkomende Meet-afspraken en markeert de afspraak die `latest`, `artifacts`, `attendance` of `export` zal kiezen.

Als je de conferentierecord-id al weet, adresseer die dan direct:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Beëindig een actieve conferentie voor een via de API gemaakte ruimte wanneer je de ruimte na het gesprek wilt sluiten:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Dit roept Google Meet `spaces.endActiveConference` aan en vereist OAuth met het `meetings.space.created`-bereik voor een ruimte die het geautoriseerde account kan beheren.
OpenClaw accepteert een Meet-URL, vergadercode of `spaces/{id}`-invoer en lost die op naar de API-ruimteresource voordat de actieve conferentie wordt beëindigd.
Dit staat los van `googlemeet leave`: `leave` stopt OpenClaw's lokale/sessie-deelname, terwijl `end-active-conference` Google Meet vraagt de actieve conferentie voor de ruimte te beëindigen.

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

`artifacts` retourneert metadata van conferentierecords plus metadata van deelnemer-, opname-, transcript-, gestructureerde transcriptvermelding- en smart-note-resources wanneer Google die voor de vergadering beschikbaar stelt. Gebruik `--no-transcript-entries` om het opzoeken van vermeldingen voor grote vergaderingen over te slaan. `attendance` breidt deelnemers uit naar deelnemer-sessierijen met eerste/laatste gezien-tijden, totale sessieduur, te-laat-/vroeg-vertrek-vlaggen, en dubbele deelnemerresources samengevoegd op basis van aangemelde gebruiker of weergavenaam. Geef `--no-merge-duplicates` mee om ruwe deelnemerresources gescheiden te houden, `--late-after-minutes` om te-laatdetectie af te stemmen, en `--early-before-minutes` om vroeg-vertrekdetectie af te stemmen.

`export` schrijft een map met `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` en `manifest.json`.
`manifest.json` registreert de gekozen invoer, exportopties, conferentierecords, uitvoerbestanden, aantallen, tokenbron, Calendar-afspraak wanneer die is gebruikt, en eventuele waarschuwingen over gedeeltelijke ophaling. Geef `--zip` mee om ook een draagbaar archief naast de map te schrijven. Geef `--include-doc-bodies` mee om gekoppelde transcript- en smart-note-Google Docs-tekst te exporteren via Google Drive `files.export`; dit vereist een nieuwe OAuth-login die het alleen-lezenbereik voor Drive Meet bevat. Zonder `--include-doc-bodies` bevatten exports alleen Meet-metadata en gestructureerde transcriptvermeldingen. Als Google een gedeeltelijke artefactfout retourneert, zoals een smart-note-lijst-, transcriptvermelding- of Drive-documenttekstfout, bewaren de samenvatting en manifest de waarschuwing in plaats van de hele export te laten mislukken.
Gebruik `--dry-run` om dezelfde artefact-/aanwezigheidsgegevens op te halen en de manifest-JSON af te drukken zonder de map of ZIP te maken. Dat is nuttig voordat je een grote export schrijft of wanneer een agent alleen aantallen, geselecteerde records en waarschuwingen nodig heeft.

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

Stel `"dryRun": true` in om alleen het exportmanifest te retourneren en bestandswrites over te slaan.

Agenten kunnen ook een API-ondersteunde ruimte maken met een expliciet toegangsbeleid:

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

Voor listen-first-validatie moeten agenten `test_listen` gebruiken voordat ze claimen dat de vergadering nuttig is:

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

Voer de live listen-first-browserprobe uit tegen een vergadering waarin iemand zal spreken en Meet-ondertiteling beschikbaar is:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Live smoke-omgeving:

- `OPENCLAW_LIVE_TEST=1` schakelt bewaakte live tests in.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` wijst naar een bewaarde Meet-URL, code of
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` of `GOOGLE_MEET_CLIENT_ID` levert de OAuth-client-id.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` of `GOOGLE_MEET_REFRESH_TOKEN` levert de vernieuwingstoken.
- Optioneel: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` en
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` gebruiken dezelfde fallbacknamen
  zonder het `OPENCLAW_`-voorvoegsel.

De live smoke voor basisartefacten/aanwezigheid heeft
`https://www.googleapis.com/auth/meetings.space.readonly` en
`https://www.googleapis.com/auth/meetings.conference.media.readonly` nodig. Agenda-opzoeking heeft `https://www.googleapis.com/auth/calendar.events.readonly` nodig. Export van documenttekst uit Drive heeft
`https://www.googleapis.com/auth/drive.meet.readonly` nodig.

Maak een nieuwe Meet-ruimte:

```bash
openclaw googlemeet create
```

De opdracht drukt de nieuwe `meeting uri`, bron en joinsessie af. Met OAuth-referenties gebruikt deze de officiële Google Meet API. Zonder OAuth-referenties gebruikt deze als fallback het aangemelde browserprofiel van de vastgezette Chrome-Node. Agenten kunnen de `google_meet`-tool gebruiken met `action: "create"` om in één stap te maken en deel te nemen. Geef `"join": false` mee voor alleen-URL-creatie.

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

Als de browserfallback Google-login of een Meet-machtigingsblokkade tegenkomt voordat deze de URL kan maken, retourneert de Gateway-methode een mislukte respons en retourneert de `google_meet`-tool gestructureerde details in plaats van een platte string:

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

Wanneer een agent `manualActionRequired: true` ziet, moet deze de `manualActionMessage` plus de browser-Node-/tabcontext rapporteren en stoppen met het openen van nieuwe Meet-tabbladen totdat de operator de browserstap voltooit.

Voorbeeld van JSON-uitvoer van API-create:

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

Een Meet maken neemt standaard deel. Het Chrome- of Chrome-node-transport heeft nog steeds
een aangemeld Google Chrome-profiel nodig om via de browser deel te nemen. Als het
profiel is afgemeld, meldt OpenClaw `manualActionRequired: true` of een
browserfallbackfout en vraagt het de operator om de Google-login af te ronden voordat
opnieuw wordt geprobeerd.

Stel `preview.enrollmentAcknowledged: true` alleen in nadat je hebt bevestigd dat je Cloud-
project, OAuth-principal en vergaderdeelnemers zijn ingeschreven in het Google
Workspace Developer Preview Program voor Meet-media-API's.

## Configuratie

Het algemene Chrome-agentpad heeft alleen de ingeschakelde Plugin, BlackHole, SoX, een
providersleutel voor realtime transcriptie en een geconfigureerde OpenClaw TTS-provider nodig.
OpenAI is de standaardprovider voor transcriptie; stel `realtime.voiceProvider` in op
`"google"` en `realtime.model` om Google Gemini Live te gebruiken voor de `bidi`-modus
zonder de standaard transcriptieprovider voor agentmodus te wijzigen:

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
- `defaultMode: "agent"` (`"realtime"` wordt alleen geaccepteerd als verouderde
  compatibiliteitsalias voor `"agent"`; nieuwe toolaanroepen moeten `"agent"` zeggen)
- `chromeNode.node`: optionele Node-id/naam/IP voor `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: naam die wordt gebruikt op het afgemelde Meet-gastscherm
- `chrome.autoJoin: true`: best-effort invullen van gastnaam en klikken op Nu deelnemen
  via OpenClaw-browserautomatisering op `chrome-node`
- `chrome.reuseExistingTab: true`: activeer een bestaand Meet-tabblad in plaats van
  duplicaten te openen
- `chrome.waitForInCallMs: 20000`: wacht tot het Meet-tabblad meldt dat het in gesprek is
  voordat de terugspreekintro wordt geactiveerd
- `chrome.audioFormat: "pcm16-24khz"`: audioformaat voor opdrachtparen. Gebruik
  `"g711-ulaw-8khz"` alleen voor verouderde/aangepaste opdrachtparen die nog
  telefonieaudio uitzenden.
- `chrome.audioBufferBytes: 4096`: SoX-verwerkingsbuffer voor gegenereerde Chrome-
  audio-opdrachten met opdrachtparen. Dit is de helft van SoX' standaardbuffer van 8192 bytes,
  waardoor de standaardpijplijnlatentie wordt verlaagd en er ruimte blijft om deze op drukke hosts te verhogen.
  Waarden onder het minimum van SoX worden vastgezet op 17 bytes.
- `chrome.audioInputCommand`: SoX-opdracht die leest uit CoreAudio `BlackHole 2ch`
  en audio schrijft in `chrome.audioFormat`
- `chrome.audioOutputCommand`: SoX-opdracht die audio leest in `chrome.audioFormat`
  en schrijft naar CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: optionele lokale microfoonopdracht die
  gesigneerde 16-bits little-endian mono-PCM schrijft voor detectie van menselijke interrupties terwijl
  assistentweergave actief is. Dit is momenteel van toepassing op de door Gateway gehoste
  `chrome`-brug met opdrachtparen.
- `chrome.bargeInRmsThreshold: 650`: RMS-niveau dat telt als een menselijke
  interruptie op `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: piekniveau dat telt als een menselijke
  interruptie op `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: minimale vertraging tussen herhaalde
  resets door menselijke interrupties
- `mode: "agent"`: standaard terugspreekmodus. Spraak van deelnemers wordt getranscribeerd door
  de geconfigureerde realtime transcriptieprovider, naar de geconfigureerde
  OpenClaw-agent gestuurd in een subagentsessie per vergadering, en terug uitgesproken via de
  normale OpenClaw TTS-runtime.
- `mode: "bidi"`: fallbackmodus voor een direct bidirectioneel realtime model. De
  realtime spraakprovider beantwoordt spraak van deelnemers direct en kan
  `openclaw_agent_consult` aanroepen voor diepere, door tools ondersteunde antwoorden.
- `mode: "transcribe"`: alleen-observerenmodus zonder de terugspreekbrug.
- `realtime.provider: "openai"`: compatibiliteitsfallback die wordt gebruikt wanneer de hieronder gescopete
  providervelden niet zijn ingesteld.
- `realtime.transcriptionProvider: "openai"`: provider-id die door de `agent`-modus
  wordt gebruikt voor realtime transcriptie.
- `realtime.voiceProvider`: provider-id die door de `bidi`-modus wordt gebruikt voor directe realtime
  spraak. Stel dit in op `"google"` om Gemini Live te gebruiken terwijl transcriptie in agentmodus
  op OpenAI blijft.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: korte gesproken antwoorden, met
  `openclaw_agent_consult` voor diepere antwoorden
- `realtime.introMessage`: korte gesproken gereedheidscontrole wanneer de realtime brug
  verbinding maakt; stel dit in op `""` om stil deel te nemen
- `realtime.agentId`: optionele OpenClaw-agent-id voor
  `openclaw_agent_consult`; standaard is `main`

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
        speakerVoice: "Kore",
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
          speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
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

De persistente Meet-stem komt uit
`messages.tts.providers.elevenlabs.speakerVoiceId`. Antwoorden van agents kunnen ook
per antwoord `[[tts:speakerVoiceId=... model=eleven_v3]]`-directieven gebruiken wanneer overschrijvingen van het TTS-model
zijn ingeschakeld, maar configuratie is de deterministische standaard voor vergaderingen.
Bij deelname moeten de logs `transcriptionProvider=elevenlabs` tonen en elk
gesproken antwoord moet `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>` loggen.

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
daadwerkelijke PSTN-oproep, DTMF en introductiebegroeting aan de Voice Call-Plugin. Voice Call
speelt de DTMF-reeks af voordat de realtime mediastream wordt geopend, en gebruikt daarna de
opgeslagen introductietekst als de initiële realtime begroeting. Als `voice-call` niet is
ingeschakeld, kan Google Meet het belplan nog steeds valideren en registreren, maar kan het de
Twilio-oproep niet plaatsen.

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
`transport: "chrome-node"` wanneer Chrome op een gekoppelde Node draait, zoals een Parallels-
VM. In beide gevallen draaien de modelproviders en `openclaw_agent_consult` op de
Gateway-host, zodat modelreferenties daar blijven. Met de standaard `mode: "agent"`
handelt de realtime transcriptieprovider het luisteren af, produceert de geconfigureerde OpenClaw-
agent het antwoord, en spreekt reguliere OpenClaw TTS dit uit in Meet. Gebruik
`mode: "bidi"` wanneer je wilt dat het realtime spraakmodel direct antwoordt.
Ruwe `mode: "realtime"` blijft geaccepteerd als verouderde compatibiliteitsalias voor
`mode: "agent"`, maar wordt niet langer geadverteerd in het agenttoolschema.
Logs in agentmodus bevatten de opgeloste transcriptieprovider/het model bij het opstarten van de brug
en de TTS-provider, het model, de stem, het uitvoerformaat en de samplefrequentie na
elk gesynthetiseerd antwoord.

Gebruik `action: "status"` om actieve sessies weer te geven of een sessie-id te inspecteren. Gebruik
`action: "speak"` met `sessionId` en `message` om de realtime agent
direct te laten spreken. Gebruik `action: "test_speech"` om de sessie te maken of te hergebruiken,
een bekende zin te activeren en `inCall`-gezondheid terug te geven wanneer de Chrome-host dit kan
rapporteren. `test_speech` forceert altijd `mode: "agent"` en faalt als gevraagd wordt om
in `mode: "transcribe"` te draaien, omdat alleen-observerensessies bewust geen
spraak kunnen uitzenden. Het resultaat `speechOutputVerified` is gebaseerd op toenemende realtime audio-uitvoerbytes
tijdens deze testaanroep, dus een hergebruikte sessie met oudere audio
telt niet als een nieuwe succesvolle spraakcontrole. Gebruik `action: "leave"` om
een sessie als beëindigd te markeren.

`status` bevat Chrome-gezondheid wanneer beschikbaar:

- `inCall`: Chrome lijkt zich binnen de Meet-oproep te bevinden
- `micMuted`: best-effort Meet-microfoonstatus
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: het
  browserprofiel vereist handmatige login, toelating door de Meet-host, machtigingen of
  browserbesturingsherstel voordat spraak kan werken
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: of
  beheerde Chrome-spraak nu is toegestaan. `speechReady: false` betekent dat OpenClaw
  de intro-/testzin niet naar de audiobrug heeft gestuurd.
- `providerConnected` / `realtimeReady`: status van de realtime spraakbrug
- `lastInputAt` / `lastOutputAt`: laatste audio gezien van of gestuurd naar de brug
- `audioOutputRouted` / `audioOutputDeviceLabel`: of de media-uitvoer van het Meet-tabblad
  actief werd gerouteerd naar het BlackHole-apparaat dat door de brug wordt gebruikt
- `lastSuppressedInputAt` / `suppressedInputBytes`: loopbackinvoer genegeerd terwijl
  assistentweergave actief is

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Agent- en bidi-modi

Chrome `agent`-modus is geoptimaliseerd voor gedrag waarbij "mijn agent in de vergadering is". De
realtime transcriptieprovider hoort de vergaderaudio, definitieve deelnemertranscripten
worden via de geconfigureerde OpenClaw-agent gerouteerd, en het antwoord wordt
uitgesproken via de normale OpenClaw TTS-runtime. Stel `mode: "bidi"` in wanneer je wilt
dat het realtime spraakmodel direct antwoordt.
Nabije definitieve transcriptfragmenten worden samengevoegd vóór de consultatie, zodat één gesproken
beurt niet meerdere verouderde gedeeltelijke antwoorden oplevert. Realtime invoer wordt ook
onderdrukt terwijl audio van de assistent in de wachtrij nog wordt afgespeeld,
en recente assistentachtige transcriptecho's worden genegeerd vóór de agentconsultatie,
zodat BlackHole-loopback de agent niet zijn eigen spraak laat beantwoorden.

| Modus   | Wie bepaalt het antwoord      | Pad voor spraakuitvoer                 | Gebruik wanneer                                         |
| ------- | ----------------------------- | -------------------------------------- | ------------------------------------------------------ |
| `agent` | De geconfigureerde OpenClaw-agent | Normale OpenClaw TTS-runtime           | Je gedrag wilt waarbij "mijn agent in de vergadering is" |
| `bidi`  | Het realtime spraakmodel      | Audioreactie van realtime spraakprovider | Je de gesprekslus met de laagste latentie wilt          |

In `bidi`-modus kan het realtime model, wanneer het diepere redenatie, actuele
informatie of normale OpenClaw-tools nodig heeft, `openclaw_agent_consult` aanroepen.

De consult-tool voert achter de schermen de reguliere OpenClaw-agent uit met recente
context uit het vergadertranscript en retourneert een beknopt gesproken antwoord. In `agent`-modus
stuurt OpenClaw dat antwoord rechtstreeks naar de TTS-runtime; in `bidi`-modus kan het
realtime spraakmodel het consultresultaat terug de vergadering in uitspreken. Het gebruikt
dezelfde gedeelde consultmechaniek als Voice Call.

Standaard worden consults uitgevoerd tegen de `main`-agent. Stel `realtime.agentId` in wanneer een
Meet-lane een specifieke OpenClaw-agentworkspace, modelstandaarden,
toolbeleid, geheugen en sessiegeschiedenis moet raadplegen.

Consults in agentmodus gebruiken per vergadering een sessiesleutel
`agent:<id>:subagent:google-meet:<session>`, zodat vervolgvragen de vergadercontext behouden
terwijl ze het normale agentbeleid van de geconfigureerde agent erven.

`realtime.toolPolicy` regelt de consult-run:

- `safe-read-only`: stel de consult-tool beschikbaar en beperk de reguliere agent tot
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` en
  `memory_get`.
- `owner`: stel de consult-tool beschikbaar en laat de reguliere agent het normale
  agent-toolbeleid gebruiken.
- `none`: stel de consult-tool niet beschikbaar aan het realtime spraakmodel.

De consultsessiesleutel is per Meet-sessie afgebakend, zodat vervolgconsultaanroepen
eerdere consultcontext tijdens dezelfde vergadering kunnen hergebruiken.

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

## Live testchecklist

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
  standaardtransport is of een node is vastgezet.
- `nodes status` toont dat de geselecteerde node verbonden is.
- De geselecteerde node adverteert zowel `googlemeet.chrome` als `browser.proxy`.
- Het Meet-tabblad neemt deel aan het gesprek en `test-speech` retourneert Chrome-gezondheid met
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

Dat bewijst dat de Gateway-plugin is geladen, de VM-node verbonden is met het
huidige token en de Meet-audiobridge beschikbaar is voordat een agent een
echt vergadertabblad opent.

Gebruik voor een Twilio-smoke een vergadering die telefooninbelgegevens beschikbaar maakt:

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
  realtime bridge met de eerste begroeting in de wachtrij.
- `googlemeet leave <sessionId>` hangt het gedelegeerde voice-callgesprek op.

## Probleemoplossing

### Agent kan de Google Meet-tool niet zien

Controleer of de plugin is ingeschakeld in de Gateway-configuratie en herlaad de Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Als je net `plugins.entries.google-meet` hebt bewerkt, herstart of herlaad dan de Gateway.
De actieve agent ziet alleen plugintools die door het huidige Gateway-proces
zijn geregistreerd.

Op niet-macOS Gateway-hosts blijft de agentgerichte `google_meet`-tool zichtbaar,
maar lokale Chrome-talk-back-acties worden geblokkeerd voordat ze de audiobridge bereiken.
Lokale Chrome-talk-back-audio is momenteel afhankelijk van macOS `BlackHole 2ch`, dus
Linux-agents moeten `mode: "transcribe"`, Twilio-inbellen of een macOS
`chrome-node`-host gebruiken in plaats van het standaardpad voor lokale Chrome-agents.

### Geen verbonden node met Google Meet-mogelijkheden

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

De node moet verbonden zijn en `googlemeet.chrome` plus `browser.proxy` vermelden.
De Gateway-configuratie moet die node-opdrachten toestaan:

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
`gateway token mismatch` meldt, installeer of herstart de node dan opnieuw met het huidige Gateway-token.
Voor een LAN-Gateway betekent dit meestal:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Herlaad daarna de nodeservice en voer opnieuw uit:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Browser opent, maar agent kan niet deelnemen

Voer `googlemeet test-listen` uit voor observer-only deelname of `googlemeet test-speech`
voor realtime deelname en inspecteer daarna de geretourneerde Chrome-gezondheid. Als een van beide probes
`manualActionRequired: true` meldt, toon `manualActionMessage` aan de operator
en stop met opnieuw proberen totdat de browseractie is voltooid.

Veelvoorkomende handmatige acties:

- Meld je aan bij het Chrome-profiel.
- Laat de gast toe vanuit het Meet-hostaccount.
- Verleen Chrome-microfoon-/cameramachtigingen wanneer de native machtigingsprompt van Chrome verschijnt.
- Sluit of herstel een vastgelopen Meet-machtigingsdialoog.

Meld niet "not signed in" alleen omdat Meet "Do you want people to
hear you in the meeting?" toont. Dat is het audio-keuzescherm van Meet; OpenClaw
klikt via browserautomatisering op **Use microphone** wanneer dat beschikbaar is en blijft
wachten op de echte vergaderstatus. Voor create-only browserfallback kan OpenClaw
op **Continue without microphone** klikken, omdat het aanmaken van de URL het
realtime audiopad niet nodig heeft.

### Vergadering aanmaken mislukt

`googlemeet create` gebruikt eerst het Google Meet API-eindpunt `spaces.create`
wanneer OAuth-referenties zijn geconfigureerd. Zonder OAuth-referenties valt het terug
op de browser van de vastgezette Chrome-node. Controleer:

- Voor API-aanmaak: `oauth.clientId` en `oauth.refreshToken` zijn geconfigureerd,
  of overeenkomende `OPENCLAW_GOOGLE_MEET_*`-omgevingsvariabelen zijn aanwezig.
- Voor API-aanmaak: het refresh-token is uitgegeven nadat aanmaakondersteuning is
  toegevoegd. Oudere tokens kunnen de scope `meetings.space.created` missen; voer
  `openclaw googlemeet auth login --json` opnieuw uit en werk de pluginconfiguratie bij.
- Voor browserfallback: `defaultTransport: "chrome-node"` en
  `chromeNode.node` wijzen naar een verbonden node met `browser.proxy` en
  `googlemeet.chrome`.
- Voor browserfallback: het OpenClaw Chrome-profiel op die node is aangemeld
  bij Google en kan `https://meet.google.com/new` openen.
- Voor browserfallback: nieuwe pogingen hergebruiken een bestaand tabblad
  `https://meet.google.com/new` of een Google-accountprompttabblad voordat een nieuw tabblad wordt geopend. Als een agent een time-out krijgt,
  probeer de toolaanroep opnieuw in plaats van handmatig een ander Meet-tabblad te openen.
- Voor browserfallback: als de tool `manualActionRequired: true` retourneert, gebruik dan
  de geretourneerde `browser.nodeId`, `browser.targetId`, `browserUrl` en
  `manualActionMessage` om de operator te begeleiden. Probeer niet in een lus opnieuw totdat die
  actie is voltooid.
- Voor browserfallback: als Meet "Do you want people to hear you in the
  meeting?" toont, laat het tabblad open. OpenClaw zou via browserautomatisering
  op **Use microphone** moeten klikken of, voor create-only fallback, op **Continue without microphone**
  en verder wachten op de gegenereerde Meet-URL. Als dat niet lukt, moet de
  fout `meet-audio-choice-required` vermelden, niet `google-login-required`.

### Agent neemt deel, maar praat niet

Controleer het realtime pad:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Gebruik `mode: "agent"` voor het normale STT -> OpenClaw-agent -> TTS-talk-backpad,
of `mode: "bidi"` voor de directe realtime spraakfallback. `mode: "transcribe"`
start bewust geen talk-backbridge. Voer voor observer-only foutopsporing
`openclaw googlemeet status --json <session-id>` uit nadat deelnemers hebben gesproken
en controleer `captioning`, `transcriptLines` en `lastCaptionText`. Als `inCall`
true is maar `transcriptLines` op `0` blijft, zijn Meet-ondertitels mogelijk uitgeschakeld, heeft niemand
gesproken sinds de observer is geïnstalleerd, is de Meet-UI gewijzigd of zijn live
ondertitels niet beschikbaar voor de vergadertaal/het account.

`googlemeet test-speech` controleert altijd het realtime pad en meldt of
bridge-uitvoerbytes voor die aanroep zijn waargenomen. Als `speechOutputVerified` false is en
`speechOutputTimedOut` true is, heeft de realtime provider de uiting mogelijk geaccepteerd,
maar zag OpenClaw geen nieuwe uitvoerbytes de Chrome-audiobridge bereiken.

Controleer ook:

- Er is een realtime providersleutel beschikbaar op de Gateway-host, zoals
  `OPENAI_API_KEY` of `GEMINI_API_KEY`.
- `BlackHole 2ch` is zichtbaar op de Chrome-host.
- `sox` bestaat op de Chrome-host.
- Meet-microfoon en -speaker zijn gerouteerd via het virtuele audiopad dat door
  OpenClaw wordt gebruikt. `doctor` moet `meet output routed: yes` tonen voor lokale Chrome
  realtime deelname.

`googlemeet doctor [session-id]` print de sessie, node, in-callstatus,
reden voor handmatige actie, realtime providerverbinding, `realtimeReady`, audio-
invoer-/uitvoeractiviteit, laatste audiotijdstempels, byte-tellers en browser-URL.
Gebruik `googlemeet status [session-id] --json` wanneer je de ruwe JSON nodig hebt. Gebruik
`googlemeet doctor --oauth` wanneer je Google Meet OAuth-refresh moet verifiëren
zonder tokens bloot te leggen; voeg `--meeting` of `--create-space` toe wanneer je ook
Google Meet API-bewijs nodig hebt.

Als een agent een time-out heeft gekregen en je al een Meet-tabblad open ziet, inspecteer dat tabblad
zonder een ander te openen:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

De equivalente toolactie is `recover_current_tab`. Deze focust en inspecteert een
bestaand Meet-tabblad voor het geselecteerde transport. Met `chrome` gebruikt het lokale
browserbesturing via de Gateway; met `chrome-node` gebruikt het de geconfigureerde
Chrome-node. Het opent geen nieuw tabblad en maakt geen nieuwe sessie aan; het meldt de
huidige blokkade, zoals login, toelating, machtigingen of audio-keuzestatus.
De CLI-opdracht communiceert met de geconfigureerde Gateway, dus de Gateway moet actief zijn;
`chrome-node` vereist ook dat de Chrome-node verbonden is.

### Twilio-setupcontroles mislukken

`twilio-voice-call-plugin` faalt wanneer `voice-call` niet is toegestaan of niet is ingeschakeld.
Voeg het toe aan `plugins.allow`, schakel `plugins.entries.voice-call` in en herlaad de
Gateway.

`twilio-voice-call-credentials` faalt wanneer de Twilio-backend account-SID,
auth-token of bellernummer mist. Stel deze in op de Gateway-host:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` faalt wanneer `voice-call` geen publieke Webhook-blootstelling
heeft, of wanneer `publicUrl` naar loopback- of privénetwerkruimte wijst.
Stel `plugins.entries.voice-call.config.publicUrl` in op de publieke provider-URL of
configureer een `voice-call`-tunnel/Tailscale-blootstelling.

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

`voicecall smoke` controleert standaard alleen de gereedheid. Om een proefuitvoering voor een specifiek nummer te doen:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Voeg `--yes` alleen toe wanneer je bewust een live uitgaande meldingsoproep wilt
plaatsen:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio-oproep start maar komt nooit in de vergadering

Controleer of het Meet-evenement telefonische inbelgegevens beschikbaar stelt. Geef het exacte inbelnummer
en de PIN of een aangepaste DTMF-reeks door:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Gebruik een voorafgaande `w` of komma's in `--dtmf-sequence` als de provider een pauze nodig heeft
voordat de PIN wordt ingevoerd.

Als de telefoongesprek wordt aangemaakt maar de Meet-deelnemerslijst nooit de ingebelde
deelnemer toont:

- Voer `openclaw googlemeet doctor <session-id>` uit om de gedelegeerde Twilio
  oproep-ID te bevestigen, of DTMF in de wachtrij is gezet en of de introductiebegroeting is aangevraagd.
- Voer `openclaw voicecall status --call-id <id>` uit en controleer of de oproep nog
  actief is.
- Voer `openclaw voicecall tail` uit en controleer of Twilio-webhooks bij de
  Gateway aankomen.
- Voer `openclaw logs --follow` uit en zoek naar de Twilio Meet-reeks: Google
  Meet delegeert het deelnemen, Voice Call slaat pre-connect DTMF TwiML op en serveert deze,
  Voice Call serveert realtime TwiML voor de Twilio-oproep, waarna Google Meet
  introductiespraak aanvraagt met `voicecall.speak`.
- Voer `openclaw googlemeet setup --transport twilio` opnieuw uit; een groene setupcontrole is
  vereist, maar bewijst niet dat de PIN-reeks voor de vergadering klopt.
- Controleer of het inbelnummer bij dezelfde Meet-uitnodiging en regio hoort als
  de PIN.
- Verhoog `voiceCall.dtmfDelayMs` vanaf de standaardwaarde van 12 seconden als Meet traag
  opneemt of als het oproeptranscript nog steeds de prompt toont waarin om een PIN wordt gevraagd nadat
  pre-connect DTMF is verzonden.
- Als de deelnemer wel toetreedt maar je de begroeting niet hoort, controleer dan
  `openclaw logs --follow` op het post-DTMF `voicecall.speak`-verzoek en
  ofwel media-stream TTS-weergave of de Twilio `<Say>`-fallback. Als het oproeptranscript
  nog steeds "enter the meeting PIN" bevat, is de telefoonverbinding nog niet toegetreden
  tot de Meet-ruimte, dus vergaderdeelnemers zullen geen spraak horen.

Als webhooks niet aankomen, debug dan eerst de Voice Call-Plugin: de provider moet
`plugins.entries.voice-call.config.publicUrl` of de geconfigureerde tunnel kunnen bereiken.
Zie [Probleemoplossing voor spraakoproepen](/nl/plugins/voice-call#troubleshooting).

## Notities

De officiële media-API van Google Meet is gericht op ontvangen, dus spreken in een Meet-
oproep heeft nog steeds een deelnemerspad nodig. Deze Plugin houdt die grens zichtbaar:
Chrome verwerkt browserdeelname en lokale audioroutering; Twilio verwerkt
telefonische inbeldeelname.

Chrome-terugspraakmodi hebben `BlackHole 2ch` nodig plus een van beide:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw beheert de
  bridge en pipe't audio in `chrome.audioFormat` tussen die commando's en de
  geselecteerde provider. Agentmodus gebruikt realtime transcriptie plus reguliere TTS;
  bidi-modus gebruikt de realtime spraakprovider. Het standaard Chrome-pad is 24 kHz
  PCM16 met `chrome.audioBufferBytes: 4096`; 8 kHz G.711 mu-law blijft
  beschikbaar voor verouderde commandoparen.
- `chrome.audioBridgeCommand`: een extern bridgecommando beheert het volledige lokale
  audiopad en moet afsluiten nadat het zijn daemon heeft gestart of gevalideerd. Dit is alleen
  geldig voor `bidi`, omdat `agent`-modus directe toegang tot commandoparen nodig heeft voor TTS.

Wanneer een agent de `google_meet`-tool in agentmodus aanroept, forkt de vergaderconsultant-
sessie het huidige transcript van de aanroeper voordat er op deelnemersspraak wordt geantwoord.
De Meet-sessie blijft nog steeds afzonderlijk (`agent:<agentId>:subagent:google-meet:<sessionId>`)
zodat vervolgacties voor de vergadering het aanroepertranscript niet direct wijzigen.

Voor schone duplexaudio routeer je Meet-uitvoer en de Meet-microfoon via afzonderlijke
virtuele apparaten of een virtuele apparaatgrafiek in Loopback-stijl. Een enkel gedeeld
BlackHole-apparaat kan andere deelnemers terug de oproep in echoën.

Met de Chrome-bridge met commandoparen kan `chrome.bargeInInputCommand` naar een
afzonderlijke lokale microfoon luisteren en assistentweergave wissen wanneer de mens begint
te praten. Hierdoor blijft menselijke spraak vóór de assistentuitvoer, zelfs wanneer de gedeelde
BlackHole-loopback-invoer tijdelijk wordt onderdrukt tijdens assistentweergave.
Net als `chrome.audioInputCommand` en `chrome.audioOutputCommand` is dit een
door de operator geconfigureerd lokaal commando. Gebruik een expliciet vertrouwd commandopad of
argumentenlijst, en wijs het niet naar scripts uit onvertrouwde locaties.

`googlemeet speak` activeert de actieve terugspraak-audiobridge voor een Chrome-
sessie. `googlemeet leave` stopt die bridge. Voor Twilio-sessies die via de
Voice Call-Plugin zijn gedelegeerd, hangt `leave` ook de onderliggende spraakoproep op.
Gebruik `googlemeet end-active-conference` wanneer je ook de actieve
Google Meet-conferentie voor een door de API beheerde ruimte wilt sluiten.

## Gerelateerd

- [Voice Call-Plugin](/nl/plugins/voice-call)
- [Praatmodus](/nl/nodes/talk)
- [Plugins bouwen](/nl/plugins/building-plugins)
