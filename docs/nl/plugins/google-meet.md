---
read_when:
    - Je wilt dat een OpenClaw-agent deelneemt aan een Google Meet-gesprek
    - Je wilt dat een OpenClaw-agent een nieuw Google Meet-gesprek aanmaakt
    - Je configureert Chrome, Chrome Node of Twilio als Google Meet-transport
summary: 'Google Meet-plugin: deelnemen aan expliciete Meet-URL''s via Chrome of Twilio met standaardinstellingen voor agent-terugspraak'
title: Google Meet-Plugin
x-i18n:
    generated_at: "2026-05-04T07:07:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4268ad895bbf83d649b9571c0888c27eb982ad9710dfb408f22f7818cdc5dbcb
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet-deelnemersondersteuning voor OpenClaw — de plugin is bewust expliciet ontworpen:

- De plugin neemt alleen deel via een expliciete `https://meet.google.com/...`-URL.
- De plugin kan via de Google Meet API een nieuwe Meet-ruimte maken en daarna deelnemen aan de
  geretourneerde URL.
- `agent` is de standaard talk-back-modus: realtime transcriptie luistert, de
  geconfigureerde OpenClaw-agent antwoordt, en reguliere OpenClaw TTS spreekt in Meet.
- `bidi` blijft beschikbaar als fallbackmodus voor het directe realtime spraakmodel.
- Agents kiezen het deelnamegedrag met `mode`: gebruik `agent` voor live
  luisteren/talk-back, `bidi` voor directe realtime spraakfallback, of `transcribe`
  om deel te nemen/de browser te bedienen zonder de talk-back-brug.
- Auth begint als persoonlijke Google OAuth of een al aangemeld Chrome-profiel.
- Er is geen automatische toestemmingsaankondiging.
- De standaard Chrome-audiobackend is `BlackHole 2ch`.
- Chrome kan lokaal of op een gekoppelde node-host draaien.
- Twilio accepteert een inbelnummer plus optionele PIN of DTMF-reeks; het
  kan niet rechtstreeks een Meet-URL bellen.
- De CLI-opdracht is `googlemeet`; `meet` is gereserveerd voor bredere agent-
  teleconferentieworkflows.

## Snel starten

Installeer de lokale audiodependencies en configureer een realtime transcriptieprovider
plus reguliere OpenClaw TTS. OpenAI is de standaard transcriptieprovider;
Google Gemini Live werkt ook als afzonderlijke `bidi`-spraakfallback met
`realtime.voiceProvider: "google"`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# only needed when realtime.voiceProvider is "google" for bidi mode
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

Controleer de configuratie:

```bash
openclaw googlemeet setup
```

De setup-uitvoer is bedoeld om agent-leesbaar en modusbewust te zijn. Die rapporteert het Chrome-
profiel, node-pinning, en, voor realtime Chrome-deelnames, de BlackHole/SoX-audio-
brug en vertraagde realtime introcontroles. Controleer voor observe-only-deelnames hetzelfde
transport met `--mode transcribe`; die modus slaat realtime audiovereisten over
omdat die niet via de brug luistert of spreekt:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Wanneer Twilio-delegatie is geconfigureerd, rapporteert setup ook of de
`voice-call`-plugin, Twilio-referenties en publieke webhookblootstelling gereed zijn.
Behandel elke `ok: false`-controle als een blokkade voor het gecontroleerde transport en de modus
voordat je een agent vraagt deel te nemen. Gebruik `openclaw googlemeet setup --json` voor
scripts of machineleesbare uitvoer. Gebruik `--transport chrome`,
`--transport chrome-node` of `--transport twilio` om een specifiek
transport vooraf te controleren voordat een agent het probeert.

Voer voor Twilio altijd expliciet een voorafcontrole van het transport uit wanneer het standaardtransport
Chrome is:

```bash
openclaw googlemeet setup --transport twilio
```

Daarmee worden ontbrekende `voice-call`-koppelingen, Twilio-referenties of onbereikbare
webhookblootstelling gevonden voordat de agent de vergadering probeert te bellen.

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
Chrome-talk-back-acties worden daar geblokkeerd omdat het gebundelde Chrome-audiopad
momenteel afhankelijk is van macOS `BlackHole 2ch`. Gebruik op Linux `mode: "transcribe"`,
Twilio-inbellen, of een macOS `chrome-node`-host voor Chrome-talk-back-
deelname.

Maak een nieuwe vergadering en neem eraan deel:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

Gebruik voor via de API gemaakte kamers Google Meet `SpaceConfig.accessType` wanneer je wilt
dat het no-knock-beleid van de kamer expliciet is in plaats van overgenomen uit de Google-
accountstandaarden:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` laat iedereen met de Meet-URL deelnemen zonder te kloppen. `TRUSTED` laat de
vertrouwde gebruikers van de hostorganisatie, uitgenodigde externe gebruikers en inbelgebruikers
deelnemen zonder te kloppen. `RESTRICTED` beperkt no-knock-toegang tot genodigden. Deze
instellingen gelden alleen voor het officiële Google Meet API-aanmaakpad, dus OAuth-
referenties moeten zijn geconfigureerd.

Als je Google Meet hebt geauthenticeerd voordat deze optie beschikbaar was, voer dan
`openclaw googlemeet auth login --json` opnieuw uit nadat je de
`meetings.space.settings`-scope aan je Google OAuth-toestemmingsscherm hebt toegevoegd.

Maak alleen de URL zonder deel te nemen:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` heeft twee paden:

- API-aanmaak: gebruikt wanneer Google Meet OAuth-referenties zijn geconfigureerd. Dit is
  het meest deterministische pad en is niet afhankelijk van de browser-UI-status.
- Browserfallback: gebruikt wanneer OAuth-referenties ontbreken. OpenClaw gebruikt de
  vastgepinde Chrome-node, opent `https://meet.google.com/new`, wacht tot Google
  omleidt naar een echte vergaderingcode-URL, en retourneert daarna die URL. Dit pad vereist
  dat het OpenClaw Chrome-profiel op de node al bij Google is aangemeld.
  Browserautomatisering handelt Meets eigen eerste-run-microfoonprompt af; die prompt
  wordt niet behandeld als een Google-inlogfout.
  Deelname- en aanmaakflows proberen ook een bestaande Meet-tab te hergebruiken voordat een
  nieuwe wordt geopend. Matching negeert onschuldige URL-querystrings zoals `authuser`, zodat een
  agent-herhaling zich op de al geopende vergadering zou moeten richten in plaats van een tweede
  Chrome-tab te maken.

De opdracht-/tooluitvoer bevat een `source`-veld (`api` of `browser`) zodat agents
kunnen uitleggen welk pad is gebruikt. `create` neemt standaard deel aan de nieuwe vergadering en
retourneert `joined: true` plus de deelnamesessie. Gebruik
`create --no-join` op de CLI of geef `"join": false` door aan de tool om alleen de URL aan te maken.

Of zeg tegen een agent: "Maak een Google Meet, neem eraan deel met de agent-talk-backmodus
en stuur mij de link." De agent zou `google_meet` moeten aanroepen met
`action: "create"` en daarna de geretourneerde `meetingUri` delen.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Stel voor een observe-only/browser-control-deelname `"mode": "transcribe"` in. Dat start
de duplex realtime spraakbrug niet, vereist geen BlackHole of SoX,
en praat niet terug in de vergadering. Chrome-deelnames in deze modus vermijden ook
OpenClaw's microfoon-/cameratoestemmingsgrant en vermijden het Meet-pad **Microfoon gebruiken**.
Als Meet een tussenscherm voor audiokeuze toont, probeert automatisering
het pad zonder microfoon en rapporteert anders een handmatige actie in plaats van
de lokale microfoon te openen. In transcriptiemodus installeren beheerde Chrome-transporten ook
een best-effort Meet-ondertitelingsobserver. `googlemeet status --json` en
`googlemeet doctor` tonen `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`,
en een korte `recentTranscript`-staart zodat operators kunnen zien of de browser
aan de call heeft deelgenomen en of Meet-ondertitels tekst produceren.
Gebruik `openclaw googlemeet test-listen <meet-url> --transport chrome-node` wanneer
je een ja/nee-probe nodig hebt: deze neemt deel in transcriptiemodus, wacht op nieuwe ondertitel- of
transcriptbeweging, en retourneert `listenVerified`, `listenTimedOut`, handmatige
actievelden en de nieuwste ondertitelingsgezondheid.

Tijdens realtime sessies bevat de `google_meet`-status browser- en audiobrug-
gezondheid zoals `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, laatste invoer-/uitvoer-
tijdstempels, bytetellers en gesloten brugstatus. Als een veilige Meet-paginaprompt
verschijnt, handelt browserautomatisering die af wanneer dat kan. Inloggen, toelating door host en
browser-/OS-toestemmingsprompts worden gerapporteerd als handmatige actie met een reden en
bericht dat de agent kan doorgeven. Beheerde Chrome-sessies sturen de intro of
testzin pas uit nadat de browsergezondheid `inCall: true` rapporteert; anders rapporteert status
`speechReady: false` en wordt de spraakpoging geblokkeerd in plaats van te doen alsof de
agent in de vergadering heeft gesproken.

Lokale Chrome-deelnames verlopen via het aangemelde OpenClaw-browserprofiel. Realtime modus
vereist `BlackHole 2ch` voor het microfoon-/speakerpad dat door OpenClaw wordt gebruikt. Gebruik voor
schone duplexaudio afzonderlijke virtuele apparaten of een Loopback-achtige grafiek; één
BlackHole-apparaat is voldoende voor een eerste smoke-test, maar kan echo veroorzaken.

### Lokale Gateway + Parallels Chrome

Je hebt **geen** volledige OpenClaw Gateway of model-API-sleutel binnen een macOS-VM
nodig alleen om de VM eigenaar van Chrome te maken. Draai de Gateway en agent lokaal, en draai daarna een
node-host in de VM. Schakel de gebundelde plugin eenmaal in op de VM zodat de node
de Chrome-opdracht adverteert:

Wat draait waar:

- Gateway-host: OpenClaw Gateway, agentworkspace, model-/API-sleutels, realtime
  provider en de Google Meet-pluginconfiguratie.
- Parallels macOS-VM: OpenClaw CLI/node-host, Google Chrome, SoX, BlackHole 2ch,
  en een Chrome-profiel dat bij Google is aangemeld.
- Niet nodig in de VM: Gateway-service, agentconfiguratie, OpenAI/GPT-sleutel of model-
  providerconfiguratie.

Installeer de VM-dependencies:

```bash
brew install blackhole-2ch sox
```

Herstart de VM na het installeren van BlackHole zodat macOS `BlackHole 2ch` beschikbaar maakt:

```bash
sudo reboot
```

Controleer na de herstart of de VM het audioapparaat en de SoX-opdrachten kan zien:

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
plaintext WebSocket tenzij je voor dat vertrouwde privénetwerk opt-in doet:

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
`openclaw.json`-instelling. `openclaw node install` slaat die op in de LaunchAgent-
omgeving wanneer die aanwezig is op de installatieopdracht.

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
zin uitspreekt en sessiegezondheid afdrukt:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Tijdens realtime deelnemen vult OpenClaw-browserautomatisering de gastnaam in, klikt
op Deelnemen/Vragen om deel te nemen en accepteert Meet's eerste-keer-keuze
"Microfoon gebruiken" wanneer die prompt verschijnt. Tijdens observe-only
deelnemen of het aanmaken van een browser-only vergadering gaat het voorbij
dezelfde prompt zonder microfoon wanneer die keuze beschikbaar is.
Als het browserprofiel niet is aangemeld, Meet wacht op toelating door de host,
Chrome microfoon-/cameratoestemming nodig heeft voor realtime deelnemen, of Meet
vastzit op een prompt die automatisering niet kon oplossen, rapporteert het
join/test-speech-resultaat `manualActionRequired: true` met
`manualActionReason` en `manualActionMessage`. Agents moeten stoppen met opnieuw
proberen deel te nemen, exact dat bericht plus de huidige `browserUrl`/
`browserTitle` rapporteren, en pas opnieuw proberen nadat de handmatige
browseractie is voltooid.

Als `chromeNode.node` is weggelaten, selecteert OpenClaw alleen automatisch
wanneer precies één verbonden node zowel `googlemeet.chrome` als
browserbesturing adverteert. Als meerdere geschikte nodes verbonden zijn, stel
`chromeNode.node` dan in op de node-id, weergavenaam of remote-IP.

Veelvoorkomende foutcontroles:

- `Configured Google Meet node ... is not usable: offline`: de vastgepinde node
  is bekend bij de Gateway maar niet beschikbaar. Agents moeten die node
  behandelen als diagnostische status, niet als bruikbare Chrome-host, en de
  installatieblokkade rapporteren in plaats van terug te vallen op een ander
  transport, tenzij de gebruiker daarom heeft gevraagd.
- `No connected Google Meet-capable node`: start `openclaw node run` in de VM,
  keur pairing goed en zorg dat `openclaw plugins enable google-meet` en
  `openclaw plugins enable browser` in de VM zijn uitgevoerd. Bevestig ook dat de
  Gateway-host beide node-opdrachten toestaat met
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: installeer `blackhole-2ch` op de host
  die wordt gecontroleerd en herstart voordat je lokale Chrome-audio gebruikt.
- `BlackHole 2ch audio device not found on the node`: installeer
  `blackhole-2ch` in de VM en herstart de VM.
- Chrome opent maar kan niet deelnemen: meld je aan bij het browserprofiel in de
  VM, of houd `chrome.guestName` ingesteld voor deelnemen als gast. Automatisch
  deelnemen als gast gebruikt OpenClaw-browserautomatisering via de
  node-browserproxy; zorg dat de node-browserconfiguratie naar het gewenste
  profiel wijst, bijvoorbeeld `browser.defaultProfile: "user"` of een benoemd
  bestaand-sessieprofiel.
- Dubbele Meet-tabbladen: laat `chrome.reuseExistingTab: true` ingeschakeld.
  OpenClaw activeert een bestaand tabblad voor dezelfde Meet-URL voordat een
  nieuw wordt geopend, en het aanmaken van een browservergadering hergebruikt een
  lopend `https://meet.google.com/new`- of Google-accountprompt-tabblad voordat
  er nog een wordt geopend.
- Geen audio: routeer in Meet de microfoon-/speakeraudio via het virtuele
  audioapparaatpad dat OpenClaw gebruikt; gebruik afzonderlijke virtuele
  apparaten of Loopback-achtige routing voor heldere duplexaudio.

## Installatie-opmerkingen

De standaard voor Chrome talk-back gebruikt twee externe tools:

- `sox`: command-line audiohulpprogramma. De plugin gebruikt expliciete
  CoreAudio-apparaatopdrachten voor de standaard 24 kHz PCM16-audiobridge.
- `blackhole-2ch`: virtuele macOS-audiodriver. Deze maakt het
  `BlackHole 2ch`-audioapparaat aan waar Chrome/Meet doorheen kan routeren.

OpenClaw bundelt of distribueert geen van beide pakketten. De documentatie vraagt
gebruikers ze als hostafhankelijkheden via Homebrew te installeren. SoX is
gelicentieerd als `LGPL-2.0-only AND GPL-2.0-only`; BlackHole is GPL-3.0. Als je
een installer of appliance bouwt die BlackHole met OpenClaw bundelt, controleer
dan BlackHole's upstream licentievoorwaarden of verkrijg een afzonderlijke
licentie van Existential Audio.

## Transporten

### Chrome

Chrome-transport opent de Meet-URL via OpenClaw-browserbesturing en neemt deel
als het aangemelde OpenClaw-browserprofiel. Op macOS controleert de plugin vóór
het starten op `BlackHole 2ch`. Indien geconfigureerd, voert deze ook een
health-opdracht en startopdracht voor de audiobridge uit voordat Chrome wordt
geopend. Gebruik `chrome` wanneer Chrome/audio op de Gateway-host draait; gebruik
`chrome-node` wanneer Chrome/audio op een gepairde node draait, zoals een
Parallels macOS-VM. Kies voor lokale Chrome het profiel met
`browser.defaultProfile`; `chrome.browserProfile` wordt doorgegeven aan
`chrome-node`-hosts.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Routeer Chrome-microfoon- en speakeraudio via de lokale OpenClaw-audiobridge. Als
`BlackHole 2ch` niet is geïnstalleerd, mislukt het deelnemen met een
installatiefout in plaats van stilzwijgend deel te nemen zonder audiopad.

### Twilio

Twilio-transport is een strikt belplan dat is gedelegeerd aan de Voice Call
plugin. Het parseert Meet-pagina's niet op telefoonnummers.

Gebruik dit wanneer Chrome-deelname niet beschikbaar is of je een
telefoon-inbelfallback wilt. Google Meet moet een telefooninbelnummer en PIN voor
de vergadering tonen; OpenClaw ontdekt die niet vanaf de Meet-pagina.

Schakel de Voice Call plugin in op de Gateway-host, niet op de Chrome-node:

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

Geef Twilio-referenties door via omgeving of configuratie. Omgeving houdt
geheimen buiten `openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Gebruik in plaats daarvan `realtime.provider: "openai"` met de OpenAI-provider
plugin en `OPENAI_API_KEY` als dat je realtime spraakprovider is.

Herstart of herlaad de Gateway na het inschakelen van `voice-call`;
pluginconfiguratiewijzigingen verschijnen pas in een al draaiend
Gateway-proces nadat het is herladen.

Controleer daarna:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Wanneer Twilio-delegatie is aangesloten, bevat `googlemeet setup` succesvolle
controles voor `twilio-voice-call-plugin`, `twilio-voice-call-credentials` en
`twilio-voice-call-webhook`.

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

OAuth is optioneel voor het aanmaken van een Meet-link, omdat `googlemeet create`
kan terugvallen op browserautomatisering. Configureer OAuth wanneer je officiële
API-aanmaak, space-resolutie of Meet Media API-preflightcontroles wilt.

Google Meet API-toegang gebruikt gebruikers-OAuth: maak een Google Cloud
OAuth-client aan, vraag de vereiste scopes aan, autoriseer een Google-account en
sla daarna het resulterende refresh-token op in de Google Meet
pluginconfiguratie of geef de `OPENCLAW_GOOGLE_MEET_*`-omgevingsvariabelen door.

OAuth vervangt het Chrome-deelnamepad niet. Chrome- en Chrome-node-transporten
nemen nog steeds deel via een aangemeld Chrome-profiel, BlackHole/SoX en een
verbonden node wanneer je browserdeelname gebruikt. OAuth is alleen voor het
officiële Google Meet API-pad: vergaderruimtes aanmaken, spaces oplossen en Meet
Media API-preflightcontroles uitvoeren.

### Google-referenties aanmaken

In Google Cloud Console:

1. Maak een Google Cloud-project aan of selecteer er een.
2. Schakel **Google Meet REST API** in voor dat project.
3. Configureer het OAuth-toestemmingsscherm.
   - **Intern** is het eenvoudigst voor een Google Workspace-organisatie.
   - **Extern** werkt voor persoonlijke/testopstellingen; voeg, zolang de app in
     Testing staat, elk Google-account dat de app zal autoriseren toe als
     testgebruiker.
4. Voeg de scopes toe die OpenClaw aanvraagt:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Maak een OAuth-client-ID aan.
   - Applicatietype: **Web application**.
   - Geautoriseerde redirect-URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Kopieer de client-ID en het client secret.

`meetings.space.created` is vereist door Google Meet `spaces.create`.
`meetings.space.readonly` laat OpenClaw Meet-URL's/codes omzetten naar spaces.
`meetings.space.settings` laat OpenClaw `SpaceConfig`-instellingen zoals
`accessType` doorgeven tijdens het aanmaken van een ruimte via de API.
`meetings.conference.media.readonly` is voor Meet Media API-preflight en
mediawerk; Google kan Developer Preview-inschrijving vereisen voor daadwerkelijk
Media API-gebruik. Als je alleen browsergebaseerde Chrome-deelname nodig hebt,
sla OAuth dan volledig over.

### Het refresh-token maken

Configureer `oauth.clientId` en optioneel `oauth.clientSecret`, of geef ze door
als omgevingsvariabelen, en voer daarna uit:

```bash
openclaw googlemeet auth login --json
```

De opdracht print een `oauth`-configuratieblok met een refresh-token. Het gebruikt
PKCE, localhost-callback op `http://localhost:8085/oauth2callback` en een
handmatige kopieer-/plakflow met `--manual`.

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

Sla het `oauth`-object op onder de Google Meet pluginconfiguratie:

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

Geef de voorkeur aan omgevingsvariabelen wanneer je het refresh-token niet in de
configuratie wilt hebben. Als zowel configuratie- als omgevingswaarden aanwezig
zijn, gebruikt de plugin eerst configuratie en daarna de omgevingsfallback.

De OAuth-toestemming omvat het aanmaken van Meet-spaces, leestoegang tot
Meet-spaces en leestoegang tot Meet-conferentiemedia. Als je je hebt
geauthenticeerd voordat ondersteuning voor het aanmaken van vergaderingen
bestond, voer `openclaw googlemeet auth login --json` dan opnieuw uit zodat het
refresh-token de scope `meetings.space.created` heeft.

### OAuth controleren met doctor

Voer de OAuth-doctor uit wanneer je een snelle, niet-geheime healthcheck wilt:

```bash
openclaw googlemeet doctor --oauth --json
```

Dit laadt de Chrome-runtime niet en vereist geen verbonden Chrome-node. Het
controleert dat OAuth-configuratie bestaat en dat het refresh-token een
access-token kan maken. Het JSON-rapport bevat alleen statusvelden zoals `ok`,
`configured`, `tokenSource`, `expiresAt` en controleberichten; het print het
access-token, refresh-token of client secret niet.

Veelvoorkomende resultaten:

| Controle             | Betekenis                                                                               |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` plus `oauth.refreshToken`, of een gecachet toegangstoken, is aanwezig. |
| `oauth-token`        | Het gecachete toegangstoken is nog geldig, of het refreshtoken heeft een nieuw toegangstoken uitgegeven. |
| `meet-spaces-get`    | Optionele `--meeting`-controle heeft een bestaande Meet-ruimte opgelost.                |
| `meet-spaces-create` | Optionele `--create-space`-controle heeft een nieuwe Meet-ruimte gemaakt.               |

Om ook de inschakeling van de Google Meet API en de `spaces.create`-scope te bewijzen, voer je de
create-controle met neveneffecten uit:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` maakt een tijdelijke Meet-URL. Gebruik dit wanneer je moet bevestigen
dat de Google Cloud-project de Meet API heeft ingeschakeld en dat het geautoriseerde
account de `meetings.space.created`-scope heeft.

Om leestoegang voor een bestaande vergaderruimte te bewijzen:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` en `resolve-space` bewijzen leestoegang tot een bestaande
ruimte waartoe het geautoriseerde Google-account toegang heeft. Een `403` van deze controles
betekent meestal dat de Google Meet REST API is uitgeschakeld, dat het toegestemde refreshtoken
de vereiste scope mist, of dat het Google-account geen toegang heeft tot die Meet-
ruimte. Een refreshtoken-fout betekent dat je `openclaw googlemeet auth login
--json` opnieuw moet uitvoeren en het nieuwe `oauth`-blok moet opslaan.

Er zijn geen OAuth-referenties nodig voor de browserfallback. In die modus komt Google-
authenticatie uit het aangemelde Chrome-profiel op het geselecteerde Node, niet uit
OpenClaw-configuratie.

Deze omgevingsvariabelen worden geaccepteerd als fallbacks:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` or `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` or `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` or `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` or `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` or
  `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` or `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` or `GOOGLE_MEET_PREVIEW_ACK`

Los een Meet-URL, code of `spaces/{id}` op via `spaces.get`:

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Voer preflight uit vóór mediawerk:

```bash
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Toon vergaderartefacten en aanwezigheid nadat Meet conferentierecords heeft gemaakt:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Met `--meeting` gebruiken `artifacts` en `attendance` standaard het nieuwste conferentierecord.
Geef `--all-conference-records` door wanneer je elk bewaard record
voor die vergadering wilt.

Calendar-lookup kan de vergader-URL uit Google Calendar oplossen voordat
Meet-artefacten worden gelezen:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` doorzoekt de `primary`-agenda van vandaag naar een Calendar-gebeurtenis met een
Google Meet-link. Gebruik `--event <query>` om overeenkomende gebeurtenistekst te zoeken, en
`--calendar <id>` voor een niet-primaire agenda. Calendar-lookup vereist een nieuwe
OAuth-login die de Calendar events readonly-scope bevat.
`calendar-events` toont een voorbeeld van de overeenkomende Meet-gebeurtenissen en markeert de gebeurtenis die
`latest`, `artifacts`, `attendance` of `export` zal kiezen.

Als je de conferentierecord-id al weet, adresseer die dan direct:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Beëindig een actieve conferentie voor een via de API gemaakte ruimte wanneer je de
ruimte na het gesprek wilt sluiten:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Dit roept Google Meet `spaces.endActiveConference` aan en vereist OAuth met de
`meetings.space.created`-scope voor een ruimte die het geautoriseerde account kan beheren.
OpenClaw accepteert een Meet-URL, vergadercode of `spaces/{id}`-invoer en lost die op
naar de API-ruimteresource voordat de actieve conferentie wordt beëindigd.
Dit staat los van `googlemeet leave`: `leave` stopt OpenClaw's lokale/sessie-
deelname, terwijl `end-active-conference` Google Meet vraagt de actieve
conferentie voor de ruimte te beëindigen.

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

`artifacts` retourneert metadata van conferentierecords plus deelnemer-, opname-,
transcript-, gestructureerde transcript-entry- en smart-note-resourcemetadata wanneer
Google die voor de vergadering beschikbaar stelt. Gebruik `--no-transcript-entries` om
entry-lookup voor grote vergaderingen over te slaan. `attendance` breidt deelnemers uit naar
participant-session-rijen met eerste/laatste gezien-tijden, totale sessieduur,
laat-/vroeg-vertrek-vlaggen en dubbele deelnemerresources samengevoegd op basis van aangemelde
gebruiker of weergavenaam. Geef `--no-merge-duplicates` door om ruwe deelnemer-
resources apart te houden, `--late-after-minutes` om laatdetectie af te stemmen, en
`--early-before-minutes` om vroeg-vertrek-detectie af te stemmen.

`export` schrijft een map met `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` en `manifest.json`.
`manifest.json` legt de gekozen invoer, exportopties, conferentierecords,
uitvoerbestanden, aantallen, tokenbron, Calendar-gebeurtenis wanneer die is gebruikt, en eventuele
waarschuwingen over gedeeltelijke ophaling vast. Geef `--zip` door om ook een draagbaar archief
naast de map te schrijven. Geef `--include-doc-bodies` door om gekoppelde transcript- en
smart-note-Google Docs-tekst via Google Drive `files.export` te exporteren; dit vereist een
nieuwe OAuth-login die de Drive Meet readonly-scope bevat. Zonder
`--include-doc-bodies` bevatten exports alleen Meet-metadata en gestructureerde transcript-
entries. Als Google een gedeeltelijke artefactfout retourneert, zoals een smart-note-
listing-, transcript-entry- of Drive document-body-fout, bewaren de samenvatting en
manifest de waarschuwing in plaats van de volledige export te laten mislukken.
Gebruik `--dry-run` om dezelfde artefact-/aanwezigheidsgegevens op te halen en het
manifest-JSON af te drukken zonder de map of ZIP te maken. Dat is nuttig vóór het schrijven
van een grote export of wanneer een agent alleen aantallen, geselecteerde records en
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

Stel `"dryRun": true` in om alleen het exportmanifest te retourneren en bestandsschrijven over te slaan.

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

Voor listen-first-validatie moeten agents `test_listen` gebruiken voordat ze beweren dat de
vergadering nuttig is:

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

Voer de live listen-first-browserprobe uit tegen een vergadering waarin iemand zal
spreken terwijl Meet-bijschriften beschikbaar zijn:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Live smoke-omgeving:

- `OPENCLAW_LIVE_TEST=1` schakelt bewaakte livetests in.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` verwijst naar een bewaarde Meet-URL, code of
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` or `GOOGLE_MEET_CLIENT_ID` levert de OAuth-
  client-id.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` or `GOOGLE_MEET_REFRESH_TOKEN` levert
  het refreshtoken.
- Optioneel: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, and
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` gebruiken dezelfde fallbacknamen
  zonder het `OPENCLAW_`-voorvoegsel.

De basis live smoke voor artefacten/aanwezigheid heeft
`https://www.googleapis.com/auth/meetings.space.readonly` en
`https://www.googleapis.com/auth/meetings.conference.media.readonly` nodig. Calendar-
lookup heeft `https://www.googleapis.com/auth/calendar.events.readonly` nodig. Drive
document-body-export heeft
`https://www.googleapis.com/auth/drive.meet.readonly` nodig.

Maak een nieuwe Meet-ruimte:

```bash
openclaw googlemeet create
```

De opdracht drukt de nieuwe `meeting uri`, bron en deelname-sessie af. Met OAuth-
referenties gebruikt deze de officiële Google Meet API. Zonder OAuth-referenties
gebruikt deze als fallback het aangemelde browserprofiel van het vastgepinde Chrome-Node. Agents kunnen
de `google_meet`-tool gebruiken met `action: "create"` om in één stap te maken en deel te nemen.
Geef voor alleen-URL-aanmaak `"join": false` door.

Voorbeeld van JSON-uitvoer uit de browserfallback:

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

Als de browserfallback een Google-login- of Meet-machtigingsblokkade tegenkomt voordat deze
de URL kan maken, retourneert de Gateway-methode een mislukte respons en retourneert de
`google_meet`-tool gestructureerde details in plaats van een gewone tekenreeks:

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

Wanneer een agent `manualActionRequired: true` ziet, moet deze de
`manualActionMessage` plus de browser-Node/tab-context rapporteren en stoppen met het openen van nieuwe
Meet-tabbladen totdat de operator de browserstap voltooit.

Voorbeeld van JSON-uitvoer uit API-create:

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

Een Meet maken neemt standaard deel. De Chrome- of Chrome-node-transport heeft nog steeds
een aangemeld Google Chrome-profiel nodig om via de browser deel te nemen. Als het
profiel is afgemeld, rapporteert OpenClaw `manualActionRequired: true` of een
browserfallbackfout en vraagt het de operator om de Google-login te voltooien voordat
opnieuw wordt geprobeerd.

Stel `preview.enrollmentAcknowledged: true` alleen in nadat je hebt bevestigd dat je Cloud-
project, OAuth-principal en vergaderdeelnemers zijn ingeschreven voor het Google
Workspace Developer Preview Program voor Meet-media-API's.

## Configuratie

Het algemene Chrome-agentpad heeft alleen een ingeschakelde plugin, BlackHole, SoX, een
providersleutel voor realtime transcriptie en een geconfigureerde OpenClaw TTS-provider
nodig. OpenAI is de standaardtranscriptieprovider; stel `realtime.voiceProvider` in op
`"google"` en `realtime.model` om Google Gemini Live te gebruiken voor `bidi`-modus
zonder de standaardtranscriptieprovider voor agentmodus te wijzigen:

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
- `chrome.guestName: "OpenClaw Agent"`: naam die wordt gebruikt op het afgemelde Meet-gastscherm
- `chrome.autoJoin: true`: best-effort invullen van de gastnaam en klikken op Join Now
  via OpenClaw-browserautomatisering op `chrome-node`
- `chrome.reuseExistingTab: true`: activeer een bestaand Meet-tabblad in plaats van
  duplicaten te openen
- `chrome.waitForInCallMs: 20000`: wacht tot het Meet-tabblad meldt dat het in gesprek is
  voordat de talk-back-intro wordt geactiveerd
- `chrome.audioFormat: "pcm16-24khz"`: audioformaat voor opdrachtparen. Gebruik
  `"g711-ulaw-8khz"` alleen voor legacy/aangepaste opdrachtparen die nog steeds
  telefonieaudio uitsturen.
- `chrome.audioBufferBytes: 4096`: SoX-verwerkingsbuffer voor gegenereerde Chrome-
  audio-opdrachten met opdrachtparen. Dit is de helft van SoX's standaardbuffer van
  8192 bytes, waardoor de standaardpijplijnlatentie wordt verlaagd terwijl er ruimte
  blijft om deze op drukke hosts te verhogen. Waarden onder het minimum van SoX worden
  vastgezet op 17 bytes.
- `chrome.audioInputCommand`: SoX-opdracht die leest van CoreAudio `BlackHole 2ch`
  en audio schrijft in `chrome.audioFormat`
- `chrome.audioOutputCommand`: SoX-opdracht die audio leest in `chrome.audioFormat`
  en schrijft naar CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: optionele lokale microfoonopdracht die ondertekende
  16-bits little-endian mono-PCM schrijft voor detectie van menselijke onderbreking
  terwijl assistentweergave actief is. Dit is momenteel van toepassing op de door de
  Gateway gehoste `chrome`-opdrachtpaarbrug.
- `chrome.bargeInRmsThreshold: 650`: RMS-niveau dat telt als een menselijke
  onderbreking op `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: piekniveau dat telt als een menselijke
  onderbreking op `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: minimale vertraging tussen herhaalde wisacties voor
  menselijke onderbrekingen
- `mode: "agent"`: standaard talk-backmodus. Spraak van deelnemers wordt getranscribeerd
  door de geconfigureerde realtime transcriptieprovider, verzonden naar de geconfigureerde
  OpenClaw-agent in een subagentsessie per vergadering, en teruggesproken via de normale
  OpenClaw TTS-runtime.
- `mode: "bidi"`: fallbackmodus voor direct bidirectioneel realtime model. De realtime
  stemprovider beantwoordt spraak van deelnemers direct en kan `openclaw_agent_consult`
  aanroepen voor diepere/toolondersteunde antwoorden.
- `mode: "transcribe"`: alleen-observerenmodus zonder de talk-backbrug.
- `realtime.provider: "openai"`: compatibiliteitsfallback die wordt gebruikt wanneer de
  gescopete providervelden hieronder niet zijn ingesteld.
- `realtime.transcriptionProvider: "openai"`: provider-id die door `agent`-modus wordt
  gebruikt voor realtime transcriptie.
- `realtime.voiceProvider`: provider-id die door `bidi`-modus wordt gebruikt voor directe
  realtime stem. Stel dit in op `"google"` om Gemini Live te gebruiken terwijl transcriptie
  in agentmodus op OpenAI blijft.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: korte gesproken antwoorden, met
  `openclaw_agent_consult` voor diepere antwoorden
- `realtime.introMessage`: korte gesproken gereedheidscontrole wanneer de realtime brug
  verbinding maakt; stel dit in op `""` om stil deel te nemen
- `realtime.agentId`: optionele OpenClaw-agent-id voor
  `openclaw_agent_consult`; standaardwaarde is `main`

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

De persistente Meet-stem komt van
`messages.tts.providers.elevenlabs.voiceId`. Agentantwoorden kunnen ook per-antwoord
`[[tts:voiceId=... model=eleven_v3]]`-directieven gebruiken wanneer overschrijvingen
van TTS-modellen zijn ingeschakeld, maar configuratie is de deterministische standaard
voor vergaderingen. Bij deelname moeten de logs `transcriptionProvider=elevenlabs` tonen
en elk gesproken antwoord moet `provider=elevenlabs model=eleven_v3 voice=<voiceId>` loggen.

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
daadwerkelijke PSTN-oproep, DTMF en introbegroeting aan de Voice Call-plugin. Voice Call
speelt de DTMF-reeks af voordat de realtime mediastream wordt geopend en gebruikt daarna
de opgeslagen introtekst als de eerste realtime begroeting. Als `voice-call` niet is
ingeschakeld, kan Google Meet het belplan nog steeds valideren en opnemen, maar kan het
de Twilio-oproep niet plaatsen.

## Tool

Agents kunnen de `google_meet`-tool gebruiken:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Gebruik `transport: "chrome"` wanneer Chrome op de Gateway-host draait. Gebruik
`transport: "chrome-node"` wanneer Chrome op een gekoppelde node draait, zoals een
Parallels-VM. In beide gevallen draaien de modelproviders en `openclaw_agent_consult` op
de Gateway-host, zodat modelreferenties daar blijven. Met de standaard `mode: "agent"`
handelt de realtime transcriptieprovider het luisteren af, produceert de geconfigureerde
OpenClaw-agent het antwoord en spreekt reguliere OpenClaw TTS dit uit in Meet. Gebruik
`mode: "bidi"` wanneer je wilt dat het realtime stemmodel direct antwoordt.
Ruwe `mode: "realtime"` blijft geaccepteerd als legacy compatibiliteitsalias voor
`mode: "agent"`, maar wordt niet langer geadverteerd in het agenttoolschema.
Logs in agentmodus bevatten de opgeloste transcriptieprovider/het opgeloste transcriptiemodel
bij het starten van de brug en de TTS-provider, het model, de stem, het uitvoerformaat en
de samplefrequentie na elk gesynthetiseerd antwoord.

Gebruik `action: "status"` om actieve sessies te tonen of een sessie-id te inspecteren.
Gebruik `action: "speak"` met `sessionId` en `message` om de realtime agent onmiddellijk
te laten spreken. Gebruik `action: "test_speech"` om de sessie te maken of opnieuw te
gebruiken, een bekende zin te activeren en `inCall`-gezondheid terug te geven wanneer de
Chrome-host dit kan rapporteren. `test_speech` forceert altijd `mode: "agent"` en faalt
als wordt gevraagd om in `mode: "transcribe"` te draaien, omdat sessies die alleen
observeren bewust geen spraak kunnen uitsturen. Het resultaat `speechOutputVerified` is
gebaseerd op realtime audio-uitvoerbytes die toenemen tijdens deze testaanroep, dus een
hergebruikte sessie met oudere audio telt niet als een nieuwe geslaagde spraakcontrole.
Gebruik `action: "leave"` om een sessie als beëindigd te markeren.

`status` bevat Chrome-gezondheid wanneer beschikbaar:

- `inCall`: Chrome lijkt zich binnen de Meet-oproep te bevinden
- `micMuted`: best-effort Meet-microfoonstatus
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: het
  browserprofiel heeft handmatige login, toelating door de Meet-host, machtigingen of
  reparatie van browserbesturing nodig voordat spraak kan werken
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: of beheerde
  Chrome-spraak nu is toegestaan. `speechReady: false` betekent dat OpenClaw de intro/testzin
  niet naar de audiobrug heeft gestuurd.
- `providerConnected` / `realtimeReady`: status van de realtime stembrug
- `lastInputAt` / `lastOutputAt`: laatste audio gezien van of verzonden naar de brug
- `audioOutputRouted` / `audioOutputDeviceLabel`: of de media-uitvoer van het Meet-tabblad
  actief werd gerouteerd naar het BlackHole-apparaat dat door de brug wordt gebruikt
- `lastSuppressedInputAt` / `suppressedInputBytes`: loopbackinvoer die is genegeerd terwijl
  assistentweergave actief is

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Agent- en bidi-modi

Chrome `agent`-modus is geoptimaliseerd voor gedrag waarbij "mijn agent in de vergadering is".
De realtime transcriptieprovider hoort de vergaderaudio, definitieve transcripties van
deelnemers worden doorgeleid via de geconfigureerde OpenClaw-agent, en het antwoord wordt
uitgesproken via de normale OpenClaw TTS-runtime. Stel `mode: "bidi"` in wanneer je wilt
dat het realtime stemmodel direct antwoordt.
Nabijgelegen definitieve transcriptfragmenten worden samengevoegd vóór het consult, zodat
één gesproken beurt niet meerdere verouderde deelantwoorden produceert. Realtime invoer wordt
ook onderdrukt terwijl audio van de assistent in de wachtrij nog wordt afgespeeld,
en recente assistentachtige transcriptie-echo's worden genegeerd vóór het agentconsult,
zodat BlackHole-loopback de agent niet op zijn eigen spraak laat antwoorden.

| Modus   | Wie bepaalt het antwoord       | Pad voor spraakuitvoer                 | Gebruik wanneer                                        |
| ------- | ----------------------------- | -------------------------------------- | ----------------------------------------------------- |
| `agent` | De geconfigureerde OpenClaw-agent | Normale OpenClaw TTS-runtime           | Je gedrag wilt waarbij "mijn agent in de vergadering is" |
| `bidi`  | Het realtime stemmodel        | Audioreactie van realtime stemprovider | Je de conversatielus met de laagste latentie wilt     |

In `bidi`-modus kan het realtime model, wanneer het diepere redenering, actuele
informatie of normale OpenClaw-tools nodig heeft, `openclaw_agent_consult` aanroepen.

De consult-tool draait achter de schermen de gewone OpenClaw-agent met recente
context uit het vergadertranscript en retourneert een beknopt gesproken antwoord. In `agent`-modus
stuurt OpenClaw dat antwoord rechtstreeks naar de TTS-runtime; in `bidi`-modus kan het
realtime spraakmodel het consultresultaat terugspreken in de vergadering. Het gebruikt
dezelfde gedeelde consultmachinerie als Voice Call.

Standaard worden consults uitgevoerd met de `main`-agent. Stel `realtime.agentId` in wanneer een
Meet-lane een toegewezen OpenClaw-agentwerkruimte, modelstandaarden,
toolbeleid, geheugen en sessiegeschiedenis moet raadplegen.

Consults in agentmodus gebruiken een per vergadering geldende sessiesleutel `agent:<id>:subagent:google-meet:<session>`,
zodat vervolgvragen de vergadercontext behouden terwijl ze het normale
agentbeleid van de geconfigureerde agent overnemen.

`realtime.toolPolicy` beheert de consult-run:

- `safe-read-only`: stel de consult-tool beschikbaar en beperk de gewone agent tot
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` en
  `memory_get`.
- `owner`: stel de consult-tool beschikbaar en laat de gewone agent het normale
  agenttoolbeleid gebruiken.
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

## Live-testchecklist

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
  standaardtransport is of een node is vastgezet.
- `nodes status` toont dat de geselecteerde node verbonden is.
- De geselecteerde node adverteert zowel `googlemeet.chrome` als `browser.proxy`.
- Het Meet-tabblad neemt deel aan het gesprek en `test-speech` retourneert Chrome-status met
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

Dat bewijst dat de Gateway-plugin is geladen, de VM-node is verbonden met het
huidige token en de Meet-audiobridge beschikbaar is voordat een agent een
echt vergadertabblad opent.

Gebruik voor een Twilio-smoke een vergadering die telefooninbelgegevens beschikbaar stelt:

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
- `openclaw logs --follow` toont dat DTMF TwiML wordt geserveerd vóór realtime TwiML, gevolgd door een
  realtime bridge met de eerste begroeting in de wachtrij.
- `googlemeet leave <sessionId>` hangt de gedelegeerde spraakoproep op.

## Problemen oplossen

### Agent kan de Google Meet-tool niet zien

Controleer of de plugin is ingeschakeld in de Gateway-configuratie en herlaad de Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Als je zojuist `plugins.entries.google-meet` hebt bewerkt, herstart of herlaad dan de Gateway.
De draaiende agent ziet alleen plugintools die door het huidige Gateway-proces
zijn geregistreerd.

Op niet-macOS Gateway-hosts blijft de agentgerichte `google_meet`-tool zichtbaar,
maar lokale Chrome-talk-back-acties worden geblokkeerd voordat ze de audiobridge bereiken.
Lokale Chrome-talk-back-audio is momenteel afhankelijk van macOS `BlackHole 2ch`, dus
Linux-agents moeten `mode: "transcribe"`, Twilio-inbellen of een macOS
`chrome-node`-host gebruiken in plaats van het standaard lokale Chrome-agentpad.

### Geen verbonden Google Meet-compatibele node

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
De Gateway-configuratie moet deze node-opdrachten toestaan:

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

Voer `googlemeet test-listen` uit voor observe-only-deelnames of `googlemeet test-speech`
voor realtime-deelnames en inspecteer daarna de geretourneerde Chrome-status. Als een van beide probes
`manualActionRequired: true` meldt, toon `manualActionMessage` aan de operator
en stop met opnieuw proberen totdat de browseractie is voltooid.

Veelvoorkomende handmatige acties:

- Meld je aan bij het Chrome-profiel.
- Laat de gast toe vanuit het Meet-hostaccount.
- Verleen Chrome microfoon-/cameramachtigingen wanneer de native machtigingsprompt
  van Chrome verschijnt.
- Sluit of herstel een vastgelopen Meet-machtigingsdialoog.

Meld niet "not signed in" alleen omdat Meet "Do you want people to
hear you in the meeting?" toont. Dat is Meet's audio-choice-tussenscherm; OpenClaw
klikt **Use microphone** via browserautomatisering wanneer beschikbaar en blijft
wachten op de echte vergaderstatus. Voor create-only browserfallback kan OpenClaw
op **Continue without microphone** klikken, omdat het maken van de URL het
realtime audiopad niet nodig heeft.

### Vergadering maken mislukt

`googlemeet create` gebruikt eerst het Google Meet API-eindpunt `spaces.create`
wanneer OAuth-inloggegevens zijn geconfigureerd. Zonder OAuth-inloggegevens valt het terug
op de vastgezette Chrome-nodebrowser. Controleer:

- Voor API-aanmaak: `oauth.clientId` en `oauth.refreshToken` zijn geconfigureerd,
  of overeenkomende `OPENCLAW_GOOGLE_MEET_*`-omgevingsvariabelen zijn aanwezig.
- Voor API-aanmaak: het refresh-token is aangemaakt nadat aanmaakondersteuning is
  toegevoegd. Oudere tokens kunnen de scope `meetings.space.created` missen; voer
  `openclaw googlemeet auth login --json` opnieuw uit en werk de pluginconfiguratie bij.
- Voor browserfallback: `defaultTransport: "chrome-node"` en
  `chromeNode.node` wijzen naar een verbonden node met `browser.proxy` en
  `googlemeet.chrome`.
- Voor browserfallback: het OpenClaw Chrome-profiel op die node is aangemeld
  bij Google en kan `https://meet.google.com/new` openen.
- Voor browserfallback: nieuwe pogingen hergebruiken een bestaand `https://meet.google.com/new`-
  of Google-accountprompttabblad voordat een nieuw tabblad wordt geopend. Als een agent een time-out krijgt,
  probeer de toolaanroep opnieuw in plaats van handmatig nog een Meet-tabblad te openen.
- Voor browserfallback: als de tool `manualActionRequired: true` retourneert, gebruik dan
  de geretourneerde `browser.nodeId`, `browser.targetId`, `browserUrl` en
  `manualActionMessage` om de operator te begeleiden. Probeer niet in een lus opnieuw totdat die
  actie is voltooid.
- Voor browserfallback: als Meet "Do you want people to hear you in the
  meeting?" toont, laat het tabblad open. OpenClaw moet via browserautomatisering op **Use microphone** klikken of, voor
  create-only fallback, op **Continue without microphone**, en blijven wachten op de gegenereerde Meet-URL. Als dat niet lukt, moet de
  fout `meet-audio-choice-required` noemen, niet `google-login-required`.

### Agent neemt deel, maar praat niet

Controleer het realtime pad:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Gebruik `mode: "agent"` voor het normale STT -> OpenClaw-agent -> TTS-talk-back-pad,
of `mode: "bidi"` voor de directe realtime spraakfallback. `mode: "transcribe"`
start bewust geen talk-back-bridge. Voer voor observe-only-foutopsporing
`openclaw googlemeet status --json <session-id>` uit nadat deelnemers spreken
en controleer `captioning`, `transcriptLines` en `lastCaptionText`. Als `inCall`
true is maar `transcriptLines` op `0` blijft, zijn Meet-ondertitels mogelijk uitgeschakeld, heeft niemand
gesproken sinds de observer is geïnstalleerd, is de Meet-UI gewijzigd of zijn live
ondertitels niet beschikbaar voor de vergadertaal/het account.

`googlemeet test-speech` controleert altijd het realtime pad en meldt of
bridge-uitvoerbytes voor die aanroep zijn waargenomen. Als `speechOutputVerified` false is en
`speechOutputTimedOut` true is, heeft de realtime provider de
uiting mogelijk geaccepteerd, maar heeft OpenClaw niet gezien dat nieuwe uitvoerbytes de Chrome-audiobridge
bereikten.

Controleer ook:

- Er is een realtime providersleutel beschikbaar op de Gateway-host, zoals
  `OPENAI_API_KEY` of `GEMINI_API_KEY`.
- `BlackHole 2ch` is zichtbaar op de Chrome-host.
- `sox` bestaat op de Chrome-host.
- Meet-microfoon en -speaker worden gerouteerd via het virtuele audiopad dat door
  OpenClaw wordt gebruikt. `doctor` moet `meet output routed: yes` tonen voor lokale Chrome
  realtime-deelnames.

`googlemeet doctor [session-id]` toont de sessie, node, in-call-status,
reden voor handmatige actie, realtime providerverbinding, `realtimeReady`, audio-
invoer-/uitvoeractiviteit, laatste audiotijdstempels, bytetellers en browser-URL.
Gebruik `googlemeet status [session-id] --json` wanneer je de ruwe JSON nodig hebt. Gebruik
`googlemeet doctor --oauth` wanneer je Google Meet OAuth-refresh moet verifiëren
zonder tokens bloot te geven; voeg `--meeting` of `--create-space` toe wanneer je ook
Google Meet API-bewijs nodig hebt.

Als een agent een time-out kreeg en je een Meet-tabblad al open ziet, inspecteer dat tabblad
zonder er nog een te openen:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

De equivalente toolactie is `recover_current_tab`. Die focust en inspecteert een
bestaand Meet-tabblad voor het geselecteerde transport. Met `chrome` gebruikt die lokale
browserbesturing via de Gateway; met `chrome-node` gebruikt die de geconfigureerde
Chrome-node. Er wordt geen nieuw tabblad geopend of nieuwe sessie gemaakt; de huidige
blokkade wordt gerapporteerd, zoals login, toelating, machtigingen of audio-choice-status.
De CLI-opdracht praat met de geconfigureerde Gateway, dus de Gateway moet draaien;
`chrome-node` vereist ook dat de Chrome-node verbonden is.

### Twilio-installatiecontroles falen

`twilio-voice-call-plugin` faalt wanneer `voice-call` niet is toegestaan of niet is ingeschakeld.
Voeg deze toe aan `plugins.allow`, schakel `plugins.entries.voice-call` in en herlaad de
Gateway.

`twilio-voice-call-credentials` faalt wanneer in de Twilio-backend account-SID,
auth-token of bellernummer ontbreekt. Stel deze in op de Gateway-host:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` faalt wanneer `voice-call` geen openbare Webhook-
blootstelling heeft, of wanneer `publicUrl` naar loopback- of privénetwerkruimte wijst.
Stel `plugins.entries.voice-call.config.publicUrl` in op de openbare provider-URL of
configureer een `voice-call`-tunnel-/Tailscale-blootstelling.

Loopback- en privé-URL's zijn niet geldig voor providercallbacks. Gebruik
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` of `fd00::/8` niet als `publicUrl`.

Voor een stabiele openbare URL:

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

Gebruik voor lokale ontwikkeling een tunnel of Tailscale-blootstelling in plaats van een privéhost-URL:

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

`voicecall smoke` controleert standaard alleen gereedheid. Voor een proefrun met een specifiek nummer:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Voeg `--yes` alleen toe wanneer je bewust een live uitgaande meldingsoproep wilt plaatsen:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio-oproep start maar komt nooit in de vergadering

Controleer of de Meet-gebeurtenis telefonische inbelgegevens beschikbaar stelt. Geef het exacte inbelnummer en de pincode of een aangepaste DTMF-reeks door:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Gebruik een voorafgaande `w` of komma's in `--dtmf-sequence` als de provider een pauze nodig heeft voordat de pincode wordt ingevoerd.

Als de telefoonoproep wordt aangemaakt maar de Meet-deelnemerslijst de ingebelde deelnemer nooit toont:

- Voer `openclaw googlemeet doctor <session-id>` uit om de gedelegeerde Twilio-oproep-ID te controleren, of DTMF in de wachtrij is gezet en of de welkomstgroet is aangevraagd.
- Voer `openclaw voicecall status --call-id <id>` uit en controleer of de oproep nog actief is.
- Voer `openclaw voicecall tail` uit en controleer of Twilio-webhooks bij de Gateway aankomen.
- Voer `openclaw logs --follow` uit en zoek naar de Twilio Meet-reeks: Google Meet delegeert het deelnemen, Voice Call start het telefoongedeelte, Google Meet wacht `voiceCall.dtmfDelayMs`, verzendt DTMF met `voicecall.dtmf`, wacht `voiceCall.postDtmfSpeechDelayMs` en vraagt daarna introspraak aan met `voicecall.speak`.
- Voer `openclaw googlemeet setup --transport twilio` opnieuw uit; een groene setupcontrole is vereist, maar bewijst niet dat de pincodevolgorde voor de vergadering correct is.
- Controleer of het inbelnummer hoort bij dezelfde Meet-uitnodiging en regio als de pincode.
- Verhoog `voiceCall.dtmfDelayMs` als Meet langzaam opneemt of als het oproeptranscript nog steeds de prompt toont die om een pincode vraagt nadat DTMF is verzonden.
- Als de deelnemer deelneemt maar je de begroeting niet hoort, controleer dan `openclaw logs --follow` op de post-DTMF-aanvraag `voicecall.speak` en op TTS-weergave via mediastream of de Twilio-terugval `<Say>`. Als het oproeptranscript nog steeds "enter the meeting PIN" bevat, is het telefoongedeelte nog niet toegetreden tot de Meet-ruimte, zodat deelnemers aan de vergadering geen spraak zullen horen.

Als webhooks niet aankomen, debug dan eerst de Voice Call Plugin: de provider moet `plugins.entries.voice-call.config.publicUrl` of de geconfigureerde tunnel kunnen bereiken. Zie [Probleemoplossing voor spraakoproepen](/nl/plugins/voice-call#troubleshooting).

## Opmerkingen

De officiële media-API van Google Meet is gericht op ontvangen, dus spreken in een Meet-oproep heeft nog steeds een deelnemerspad nodig. Deze Plugin houdt die grens zichtbaar: Chrome verwerkt deelname via de browser en lokale audioroutering; Twilio verwerkt telefonische inbeldeelname.

Chrome-terugspraakmodi hebben `BlackHole 2ch` nodig plus een van de volgende opties:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw beheert de bridge en leidt audio in `chrome.audioFormat` tussen die opdrachten en de geselecteerde provider. Agentmodus gebruikt realtime transcriptie plus reguliere TTS; bidi-modus gebruikt de realtime spraakprovider. Het standaard Chrome-pad is 24 kHz PCM16 met `chrome.audioBufferBytes: 4096`; 8 kHz G.711 mu-law blijft beschikbaar voor verouderde opdrachtparen.
- `chrome.audioBridgeCommand`: een externe bridge-opdracht beheert het volledige lokale audiopad en moet afsluiten nadat de daemon is gestart of gevalideerd. Dit is alleen geldig voor `bidi`, omdat `agent`-modus directe toegang tot opdrachtparen nodig heeft voor TTS.

Wanneer een agent de tool `google_meet` aanroept in agentmodus, forkt de vergaderconsultantsessie het huidige transcript van de aanroeper voordat deze spraak van deelnemers beantwoordt. De Meet-sessie blijft nog steeds gescheiden (`agent:<agentId>:subagent:google-meet:<sessionId>`), zodat opvolgingen in de vergadering het transcript van de aanroeper niet direct wijzigen.

Voor schone duplexaudio routeer je Meet-uitvoer en de Meet-microfoon via afzonderlijke virtuele apparaten of een Loopback-achtige grafiek van virtuele apparaten. Een enkel gedeeld BlackHole-apparaat kan andere deelnemers terug de oproep in laten echoën.

Met de Chrome-bridge met opdrachtparen kan `chrome.bargeInInputCommand` naar een afzonderlijke lokale microfoon luisteren en assistentweergave wissen wanneer de mens begint te praten. Dit houdt menselijke spraak vóór assistentuitvoer, zelfs wanneer de gedeelde BlackHole-loopbackinvoer tijdelijk wordt onderdrukt tijdens assistentweergave. Net als `chrome.audioInputCommand` en `chrome.audioOutputCommand` is het een lokaal, door de operator geconfigureerd commando. Gebruik een expliciet vertrouwd commandopad of een expliciete argumentenlijst, en wijs het niet naar scripts vanaf niet-vertrouwde locaties.

`googlemeet speak` activeert de actieve terugspraak-audiobridge voor een Chrome-sessie. `googlemeet leave` stopt die bridge. Voor Twilio-sessies die via de Voice Call Plugin zijn gedelegeerd, hangt `leave` ook de onderliggende spraakoproep op. Gebruik `googlemeet end-active-conference` wanneer je ook de actieve Google Meet-conferentie voor een via de API beheerde ruimte wilt sluiten.

## Gerelateerd

- [Voice Call Plugin](/nl/plugins/voice-call)
- [Praatmodus](/nl/nodes/talk)
- [Plugins bouwen](/nl/plugins/building-plugins)
