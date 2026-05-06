---
read_when:
    - U wilt dat een OpenClaw-agent deelneemt aan een Google Meet-gesprek
    - Je wilt dat een OpenClaw-agent een nieuw Google Meet-gesprek aanmaakt
    - Je configureert Chrome, Chrome node of Twilio als Google Meet-transport
summary: 'Google Meet Plugin: deelnemen aan expliciete Meet-URL''s via Chrome of Twilio met standaardinstellingen voor spraakreacties van de agent'
title: Google Meet Plugin
x-i18n:
    generated_at: "2026-05-06T17:58:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b154e9cbce560dbc8327a140b27c17d2614d13d7011032a48b110314772ab0c
    source_path: plugins/google-meet.md
    workflow: 16
---

Ondersteuning voor Google Meet-deelnemers voor OpenClaw — de Plugin is bewust expliciet:

- Deze neemt alleen deel aan een expliciete `https://meet.google.com/...`-URL.
- Deze kan via de Google Meet API een nieuwe Meet-ruimte maken en vervolgens deelnemen aan de
  geretourneerde URL.
- `agent` is de standaard terugspreekmodus: realtime transcriptie luistert, de
  geconfigureerde OpenClaw-agent antwoordt, en reguliere OpenClaw TTS spreekt in Meet.
- `bidi` blijft beschikbaar als fallbackmodus voor een direct realtime spraakmodel.
- Agents kiezen het deelnemergedrag met `mode`: gebruik `agent` voor live
  luisteren/terugspreken, `bidi` als directe realtime spraakfallback, of `transcribe`
  om deel te nemen/de browser te besturen zonder de terugspreekbrug.
- Authenticatie begint als persoonlijke Google OAuth of een al aangemeld Chrome-profiel.
- Er is geen automatische toestemmingsaankondiging.
- De standaard Chrome-audiobackend is `BlackHole 2ch`.
- Chrome kan lokaal draaien of op een gekoppelde Node-host.
- Twilio accepteert een inbelnummer plus optionele pincode of DTMF-reeks; het
  kan geen Meet-URL rechtstreeks bellen.
- De CLI-opdracht is `googlemeet`; `meet` is gereserveerd voor bredere
  teleconferentieworkflows voor agents.

## Snelstart

Installeer de lokale audio-afhankelijkheden en configureer een realtime
transcriptieprovider plus reguliere OpenClaw TTS. OpenAI is de standaard
transcriptieprovider; Google Gemini Live werkt ook als aparte `bidi`-spraakfallback met
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

De setup-uitvoer is bedoeld om agentleesbaar en modusbewust te zijn. Deze rapporteert het Chrome-
profiel, Node-pinning en, voor realtime Chrome-deelnames, de BlackHole/SoX-audio-
brug en vertraagde realtime introcontroles. Controleer voor alleen-observeren-deelnames hetzelfde
transport met `--mode transcribe`; die modus slaat realtime audiovereisten over
omdat deze niet via de brug luistert of spreekt:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Wanneer Twilio-delegatie is geconfigureerd, rapporteert setup ook of de
`voice-call`-Plugin, Twilio-credentials en publieke Webhook-blootstelling gereed zijn.
Behandel elke `ok: false`-controle als een blocker voor het gecontroleerde transport en de modus
voordat je een agent vraagt deel te nemen. Gebruik `openclaw googlemeet setup --json` voor
scripts of machineleesbare uitvoer. Gebruik `--transport chrome`,
`--transport chrome-node`, of `--transport twilio` om een specifiek
transport vooraf te controleren voordat een agent het probeert.

Controleer voor Twilio het transport altijd expliciet vooraf wanneer het standaardtransport
Chrome is:

```bash
openclaw googlemeet setup --transport twilio
```

Dat detecteert ontbrekende `voice-call`-bedrading, Twilio-credentials of onbereikbare
Webhook-blootstelling voordat de agent probeert de vergadering te bellen.

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
artifact-, agenda-, setup-, transcribe-, Twilio- en `chrome-node`-flows. Lokale
Chrome-terugspreekacties worden daar geblokkeerd omdat het gebundelde Chrome-audiopad
momenteel afhankelijk is van macOS `BlackHole 2ch`. Gebruik op Linux `mode: "transcribe"`,
Twilio-inbellen, of een macOS `chrome-node`-host voor Chrome-terugspreekdeelname.

Maak een nieuwe vergadering en neem eraan deel:

```bash
openclaw googlemeet create --transport chrome-node --mode agent
```

Gebruik voor via API aangemaakte kamers Google Meet `SpaceConfig.accessType` wanneer je wilt
dat het beleid voor deelnemen zonder aankloppen van de kamer expliciet is in plaats van overgenomen
uit de standaardwaarden van het Google-account:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

`OPEN` laat iedereen met de Meet-URL deelnemen zonder aan te kloppen. `TRUSTED` laat de
vertrouwde gebruikers van de hostorganisatie, uitgenodigde externe gebruikers en inbelgebruikers
deelnemen zonder aan te kloppen. `RESTRICTED` beperkt toegang zonder aankloppen tot genodigden. Deze
instellingen gelden alleen voor het officiële Google Meet API-aanmaakpad, dus OAuth-
credentials moeten geconfigureerd zijn.

Als je Google Meet hebt geauthenticeerd voordat deze optie beschikbaar was, voer dan opnieuw
`openclaw googlemeet auth login --json` uit nadat je de
`meetings.space.settings`-scope hebt toegevoegd aan je Google OAuth-toestemmingsscherm.

Maak alleen de URL zonder deel te nemen:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` heeft twee paden:

- API-aanmaak: gebruikt wanneer Google Meet OAuth-credentials zijn geconfigureerd. Dit is
  het meest deterministische pad en is niet afhankelijk van de browser-UI-status.
- Browserfallback: gebruikt wanneer OAuth-credentials ontbreken. OpenClaw gebruikt de
  vastgepinde Chrome-Node, opent `https://meet.google.com/new`, wacht tot Google
  doorstuurt naar een echte vergaderingcode-URL en retourneert daarna die URL. Dit pad vereist
  dat het OpenClaw Chrome-profiel op de Node al bij Google is aangemeld.
  Browserautomatisering handelt Meets eigen eerste microfoonprompt af; die prompt
  wordt niet behandeld als een Google-aanmeldfout.
  Deelname- en aanmaakflows proberen ook een bestaande Meet-tab te hergebruiken voordat ze een
  nieuwe openen. Matching negeert onschuldige URL-querystrings zoals `authuser`, zodat een
  agentretry de al geopende vergadering zou moeten focussen in plaats van een tweede
  Chrome-tab te maken.

De opdracht-/tooluitvoer bevat een `source`-veld (`api` of `browser`) zodat agents
kunnen uitleggen welk pad is gebruikt. `create` neemt standaard deel aan de nieuwe vergadering en
retourneert `joined: true` plus de deelnamesessie. Gebruik om alleen de URL te maken
`create --no-join` op de CLI of geef `"join": false` door aan de tool.

Of vertel een agent: "Maak een Google Meet, neem eraan deel met de agent-terugspreekmodus,
en stuur me de link." De agent moet `google_meet` aanroepen met
`action: "create"` en daarna de geretourneerde `meetingUri` delen.

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Stel voor alleen observeren/browserbesturing-deelname `"mode": "transcribe"` in. Dat start
niet de duplex realtime spraakbrug, vereist geen BlackHole of SoX,
en spreekt niet terug in de vergadering. Chrome-deelnames in deze modus vermijden ook
OpenClaws microfoon-/cameratoestemmingsgrant en vermijden het Meet-pad **Microfoon gebruiken**.
Als Meet een tussenscherm voor audiokeuze toont, probeert automatisering
het pad zonder microfoon en rapporteert anders een handmatige actie in plaats van
de lokale microfoon te openen. In transcribe-modus installeren beheerde Chrome-transporten ook
een best-effort Meet-ondertitelobserver. `googlemeet status --json` en
`googlemeet doctor` tonen `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`,
en een korte `recentTranscript`-staart zodat operators kunnen zien of de browser
aan het gesprek heeft deelgenomen en of Meet-ondertitels tekst produceren.
Gebruik `openclaw googlemeet test-listen <meet-url> --transport chrome-node` wanneer
je een ja/nee-probe nodig hebt: deze neemt deel in transcribe-modus, wacht op verse ondertitel- of
transcriptiebeweging en retourneert `listenVerified`, `listenTimedOut`, handmatige
actievelden en de nieuwste ondertitelgezondheid.

Tijdens realtime sessies bevat `google_meet`-status browser- en audiobrug-
gezondheid zoals `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, laatste input-/output-
tijdstempels, bytetellers en gesloten brugstatus. Als er een veilige Meet-paginaprompt
verschijnt, handelt browserautomatisering die af wanneer dat kan. Aanmelding, hosttoelating en
browser-/OS-toestemmingsprompts worden gerapporteerd als handmatige actie met een reden en
bericht dat de agent kan doorgeven. Beheerde Chrome-sessies zenden de intro- of
testzin pas uit nadat browsergezondheid `inCall: true` rapporteert; anders rapporteert status
`speechReady: false` en wordt de spraakpoging geblokkeerd in plaats van te doen alsof de
agent in de vergadering heeft gesproken.

Lokale Chrome-deelnames lopen via het aangemelde OpenClaw-browserprofiel. Realtime modus
vereist `BlackHole 2ch` voor het microfoon-/speakerpad dat door OpenClaw wordt gebruikt. Gebruik voor
schone duplexaudio aparte virtuele apparaten of een Loopback-achtige grafiek; één
BlackHole-apparaat is genoeg voor een eerste smoke-test maar kan echo veroorzaken.

### Lokale Gateway + Parallels Chrome

Je hebt **geen** volledige OpenClaw Gateway of model-API-sleutel nodig binnen een macOS-VM
alleen om de VM Chrome te laten bezitten. Draai de Gateway en agent lokaal en draai daarna een
Node-host in de VM. Schakel de gebundelde Plugin één keer in op de VM zodat de Node
de Chrome-opdracht adverteert:

Wat draait waar:

- Gateway-host: OpenClaw Gateway, agentwerkruimte, model-/API-sleutels, realtime
  provider en de Google Meet Plugin-config.
- Parallels macOS-VM: OpenClaw CLI/Node-host, Google Chrome, SoX, BlackHole 2ch,
  en een Chrome-profiel dat bij Google is aangemeld.
- Niet nodig in de VM: Gateway-service, agentconfig, OpenAI/GPT-sleutel of model-
  providersetup.

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

Installeer of update OpenClaw in de VM en schakel daarna de gebundelde Plugin daar in:

```bash
openclaw plugins enable google-meet
```

Start de Node-host in de VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Als `<gateway-host>` een LAN-IP is en je geen TLS gebruikt, weigert de Node de
plaintext WebSocket tenzij je je expliciet aanmeldt voor dat vertrouwde privénetwerk:

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

of vraag de agent om de `google_meet`-tool te gebruiken met `transport: "chrome-node"`.

Voor een smoke-test met één opdracht die een sessie maakt of hergebruikt, een bekende
zin uitspreekt en sessiegezondheid afdrukt:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Tijdens realtime deelnemen vult OpenClaw-browserautomatisering de gastnaam in, klikt op
Deelnemen/Vragen om deel te nemen en accepteert Meet's eerste-keerkeuze "Microfoon gebruiken" wanneer die
prompt verschijnt. Tijdens deelnemen voor alleen observeren of browser-only vergaderingen maken gaat het
voorbij dezelfde prompt zonder microfoon wanneer die keuze beschikbaar is.
Als het browserprofiel niet is aangemeld, Meet wacht op toelating door de host,
Chrome microfoon-/cameratoestemming nodig heeft voor realtime deelnemen, of Meet vastzit
op een prompt die automatisering niet kon oplossen, rapporteert het resultaat van
de deelnemen/test-spraak `manualActionRequired: true` met `manualActionReason` en
`manualActionMessage`. Agents moeten stoppen met opnieuw proberen deel te nemen, dat exacte
bericht plus de huidige `browserUrl`/`browserTitle` rapporteren, en pas opnieuw proberen nadat de
handmatige browseractie is voltooid.

Als `chromeNode.node` is weggelaten, selecteert OpenClaw automatisch alleen wanneer precies één
verbonden Node zowel `googlemeet.chrome` als browserbesturing adverteert. Als
meerdere geschikte Nodes verbonden zijn, stel dan `chromeNode.node` in op de Node-id,
weergavenaam of externe IP.

Veelvoorkomende foutcontroles:

- `Configured Google Meet node ... is not usable: offline`: de vastgezette Node is
  bekend bij de Gateway maar niet beschikbaar. Agents moeten die Node behandelen als
  diagnostische status, niet als bruikbare Chrome-host, en de setupblokkade rapporteren
  in plaats van terug te vallen op een ander transport, tenzij de gebruiker daarom heeft gevraagd.
- `No connected Google Meet-capable node`: start `openclaw node run` in de VM,
  keur koppeling goed en zorg dat `openclaw plugins enable google-meet` en
  `openclaw plugins enable browser` in de VM zijn uitgevoerd. Bevestig ook dat de
  Gateway-host beide Node-opdrachten toestaat met
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: installeer `blackhole-2ch` op de host
  die wordt gecontroleerd en herstart voordat je lokale Chrome-audio gebruikt.
- `BlackHole 2ch audio device not found on the node`: installeer `blackhole-2ch`
  in de VM en herstart de VM.
- Chrome opent maar kan niet deelnemen: meld je aan bij het browserprofiel in de VM, of
  houd `chrome.guestName` ingesteld voor deelnemen als gast. Automatisch deelnemen als gast gebruikt OpenClaw-
  browserautomatisering via de Node-browserproxy; zorg dat de Node-browserconfiguratie
  verwijst naar het profiel dat je wilt, bijvoorbeeld
  `browser.defaultProfile: "user"` of een benoemd profiel voor een bestaande sessie.
- Dubbele Meet-tabbladen: laat `chrome.reuseExistingTab: true` ingeschakeld. OpenClaw
  activeert een bestaand tabblad voor dezelfde Meet-URL voordat er een nieuw wordt geopend, en
  browsergebaseerde vergaderingen maken hergebruikt een lopend `https://meet.google.com/new`-
  of Google-accountprompttabblad voordat er nog een wordt geopend.
- Geen audio: routeer in Meet microfoon-/luidsprekeraudio via het virtuele audioapparaatpad
  dat OpenClaw gebruikt; gebruik aparte virtuele apparaten of Loopback-achtige routering
  voor zuivere duplexaudio.

## Installatieopmerkingen

De standaardinstelling voor Chrome-talk-back gebruikt twee externe tools:

- `sox`: opdrachtregel-audiohulpprogramma. De plugin gebruikt expliciete CoreAudio-
  apparaatopdrachten voor de standaard 24 kHz PCM16-audiobridge.
- `blackhole-2ch`: virtuele audiodriver voor macOS. Deze maakt het audioapparaat
  `BlackHole 2ch` aan waar Chrome/Meet doorheen kan routeren.

OpenClaw bundelt of herdistribueert geen van beide pakketten. De docs vragen gebruikers om
ze als hostafhankelijkheden via Homebrew te installeren. SoX heeft een licentie als
`LGPL-2.0-only AND GPL-2.0-only`; BlackHole is GPL-3.0. Als je een
installer of appliance bouwt die BlackHole met OpenClaw bundelt, controleer dan de
upstreamlicentievoorwaarden van BlackHole of verkrijg een aparte licentie van Existential Audio.

## Transporten

### Chrome

Chrome-transport opent de Meet-URL via OpenClaw-browserbesturing en neemt deel
als het aangemelde OpenClaw-browserprofiel. Op macOS controleert de plugin vóór
het starten op `BlackHole 2ch`. Indien geconfigureerd voert deze ook een audiobridge-
gezondheidsopdracht en startopdracht uit voordat Chrome wordt geopend. Gebruik `chrome` wanneer
Chrome/audio op de Gateway-host draaien; gebruik `chrome-node` wanneer Chrome/audio
op een gekoppelde Node draaien, zoals een Parallels macOS-VM. Kies voor lokale Chrome het
profiel met `browser.defaultProfile`; `chrome.browserProfile` wordt doorgegeven aan
`chrome-node`-hosts.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Routeer Chrome-microfoon- en luidsprekeraudio via de lokale OpenClaw-audiobridge.
Als `BlackHole 2ch` niet is geïnstalleerd, mislukt deelnemen met een setupfout
in plaats van stilzwijgend zonder audiopad deel te nemen.

### Twilio

Twilio-transport is een strikt belplan dat wordt gedelegeerd aan de Voice Call-plugin. Het
parseert Meet-pagina's niet op telefoonnummers.

Gebruik dit wanneer Chrome-deelname niet beschikbaar is of je een telefonische inbel-
fallback wilt. Google Meet moet een telefonisch inbelnummer en pincode voor de
vergadering aanbieden; OpenClaw ontdekt die niet vanaf de Meet-pagina.

Schakel de Voice Call-plugin in op de Gateway-host, niet op de Chrome-Node:

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

Gebruik in plaats daarvan `realtime.provider: "openai"` met de OpenAI-providerplugin en
`OPENAI_API_KEY` als dat je realtime spraakprovider is.

Herstart of herlaad de Gateway nadat je `voice-call` hebt ingeschakeld; pluginconfiguratiewijzigingen
verschijnen niet in een al draaiend Gateway-proces totdat het herlaadt.

Verifieer daarna:

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

Gebruik `--dtmf-sequence` wanneer de vergadering een aangepaste reeks nodig heeft:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth en preflight

OAuth is optioneel voor het maken van een Meet-link, omdat `googlemeet create` kan
terugvallen op browserautomatisering. Configureer OAuth wanneer je officiële API-aanmaak,
ruimte-resolutie of Meet Media API-preflightcontroles wilt.

Google Meet API-toegang gebruikt gebruikers-OAuth: maak een Google Cloud OAuth-client,
vraag de vereiste scopes aan, autoriseer een Google-account en sla vervolgens het
resulterende refresh-token op in de Google Meet-pluginconfiguratie of geef de
`OPENCLAW_GOOGLE_MEET_*`-omgevingsvariabelen op.

OAuth vervangt het Chrome-deelnamepad niet. Chrome- en Chrome-node-transporten
nemen nog steeds deel via een aangemeld Chrome-profiel, BlackHole/SoX en een verbonden
Node wanneer je browserdeelname gebruikt. OAuth is alleen voor het officiële Google
Meet API-pad: vergaderruimtes maken, ruimtes oplossen en Meet Media API-
preflightcontroles uitvoeren.

### Google-referenties maken

In Google Cloud Console:

1. Maak of selecteer een Google Cloud-project.
2. Schakel **Google Meet REST API** in voor dat project.
3. Configureer het OAuth-toestemmingsscherm.
   - **Intern** is het eenvoudigst voor een Google Workspace-organisatie.
   - **Extern** werkt voor persoonlijke/testsetups; zolang de app in Testen staat,
     voeg je elk Google-account dat de app zal autoriseren toe als testgebruiker.
4. Voeg de scopes toe die OpenClaw aanvraagt:
   - `https://www.googleapis.com/auth/meetings.space.created`
   - `https://www.googleapis.com/auth/meetings.space.readonly`
   - `https://www.googleapis.com/auth/meetings.space.settings`
   - `https://www.googleapis.com/auth/meetings.conference.media.readonly`
5. Maak een OAuth-client-ID.
   - Applicatietype: **Webapplicatie**.
   - Geautoriseerde omleidings-URI:

     ```text
     http://localhost:8085/oauth2callback
     ```

6. Kopieer de client-ID en het clientgeheim.

`meetings.space.created` is vereist door Google Meet `spaces.create`.
Met `meetings.space.readonly` kan OpenClaw Meet-URL's/codes naar ruimtes oplossen.
Met `meetings.space.settings` kan OpenClaw `SpaceConfig`-instellingen zoals
`accessType` doorgeven tijdens API-kameraanmaak.
`meetings.conference.media.readonly` is voor Meet Media API-preflight en mediawerk;
Google kan Developer Preview-inschrijving vereisen voor daadwerkelijk gebruik van de Media API.
Als je alleen browsergebaseerde Chrome-deelnames nodig hebt, sla OAuth dan volledig over.

### Het refresh-token aanmaken

Configureer `oauth.clientId` en eventueel `oauth.clientSecret`, of geef ze door als
omgevingsvariabelen, en voer daarna uit:

```bash
openclaw googlemeet auth login --json
```

De opdracht print een `oauth`-configuratieblok met een refresh-token. Deze gebruikt PKCE,
localhost-callback op `http://localhost:8085/oauth2callback` en een handmatige
kopieer/plakstroom met `--manual`.

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

Geef de voorkeur aan omgevingsvariabelen wanneer je het refresh-token niet in configuratie wilt.
Als zowel configuratie- als omgevingswaarden aanwezig zijn, gebruikt de plugin eerst
configuratie en daarna omgeving als fallback.

De OAuth-toestemming omvat het maken van Meet-ruimtes, leestoegang tot Meet-ruimtes en
leestoegang tot Meet-conferentiemedia. Als je hebt geauthenticeerd voordat ondersteuning voor
het maken van vergaderingen bestond, voer dan `openclaw googlemeet auth login --json` opnieuw uit zodat het refresh-
token de scope `meetings.space.created` heeft.

### OAuth verifiëren met doctor

Voer de OAuth-doctor uit wanneer je een snelle gezondheidscontrole zonder geheimen wilt:

```bash
openclaw googlemeet doctor --oauth --json
```

Dit laadt de Chrome-runtime niet en vereist geen verbonden Chrome-Node. Het
controleert dat OAuth-configuratie bestaat en dat het refresh-token een access-token
kan aanmaken. Het JSON-rapport bevat alleen statusvelden zoals `ok`, `configured`,
`tokenSource`, `expiresAt` en controleberichten; het print het access-token,
refresh-token of clientgeheim niet.

Veelvoorkomende resultaten:

| Controle             | Betekenis                                                                               |
| -------------------- | --------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` plus `oauth.refreshToken`, of een gecachete toegangstoken, is aanwezig. |
| `oauth-token`        | De gecachete toegangstoken is nog geldig, of de refreshtoken heeft een nieuwe toegangstoken aangemaakt. |
| `meet-spaces-get`    | Optionele `--meeting`-controle heeft een bestaande Meet-ruimte gevonden.                |
| `meet-spaces-create` | Optionele `--create-space`-controle heeft een nieuwe Meet-ruimte aangemaakt.            |

Om ook te bewijzen dat de Google Meet API is ingeschakeld en dat de scope
`spaces.create` werkt, voer je de aanmaakcontrole met neveneffecten uit:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` maakt een wegwerp-Meet-URL aan. Gebruik dit wanneer je moet
bevestigen dat de Google Cloud-project de Meet API heeft ingeschakeld en dat het
geautoriseerde account de scope `meetings.space.created` heeft.

Om leestoegang voor een bestaande vergaderruimte te bewijzen:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` en `resolve-space` bewijzen leestoegang tot een
bestaande ruimte waartoe het geautoriseerde Google-account toegang heeft. Een
`403` van deze controles betekent meestal dat de Google Meet REST API is
uitgeschakeld, dat de refreshtoken waarvoor toestemming is verleend de vereiste
scope mist, of dat het Google-account geen toegang heeft tot die Meet-ruimte.
Een refreshtokenfout betekent dat je `openclaw googlemeet auth login
--json` opnieuw moet uitvoeren en het nieuwe `oauth`-blok moet opslaan.

Er zijn geen OAuth-referenties nodig voor de browserfallback. In die modus komt
Google-authenticatie uit het aangemelde Chrome-profiel op de geselecteerde node,
niet uit de OpenClaw-configuratie.

Deze omgevingsvariabelen worden als fallbacks geaccepteerd:

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

Toon vergaderartefacten en aanwezigheid nadat Meet conferentierecords heeft
aangemaakt:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Met `--meeting` gebruiken `artifacts` en `attendance` standaard het nieuwste
conferentierecord. Geef `--all-conference-records` mee wanneer je elk bewaard
record voor die vergadering wilt.

Agenda-opzoeken kan de vergader-URL uit Google Calendar oplossen voordat
Meet-artefacten worden gelezen:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` doorzoekt de `primary`-agenda van vandaag naar een Calendar-event met
een Google Meet-link. Gebruik `--event <query>` om overeenkomende eventtekst te
zoeken, en `--calendar <id>` voor een niet-primaire agenda. Agenda-opzoeken
vereist een nieuwe OAuth-login die de alleen-lezen scope voor Calendar-events
bevat. `calendar-events` toont een voorvertoning van de overeenkomende
Meet-events en markeert het event dat `latest`, `artifacts`, `attendance` of
`export` zal kiezen.

Als je de id van het conferentierecord al weet, adresseer het dan rechtstreeks:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Beëindig een actieve conferentie voor een via de API aangemaakte ruimte wanneer
je de ruimte na het gesprek wilt sluiten:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Dit roept Google Meet `spaces.endActiveConference` aan en vereist OAuth met de
scope `meetings.space.created` voor een ruimte die het geautoriseerde account kan
beheren. OpenClaw accepteert een Meet-URL, vergadercode of `spaces/{id}` als
invoer en lost die op naar de API-ruimteresource voordat de actieve conferentie
wordt beëindigd. Dit staat los van `googlemeet leave`: `leave` stopt de lokale
of sessiedeelname van OpenClaw, terwijl `end-active-conference` Google Meet
vraagt de actieve conferentie voor de ruimte te beëindigen.

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

`artifacts` retourneert metadata van het conferentierecord plus metadata van
deelnemer-, opname-, transcript-, gestructureerde transcriptregel- en
smart-note-resources wanneer Google die voor de vergadering beschikbaar stelt.
Gebruik `--no-transcript-entries` om het ophalen van regels voor grote
vergaderingen over te slaan. `attendance` breidt deelnemers uit naar
deelnemerssessierijen met tijden voor het eerst/laatst gezien, totale
sessieduur, markeringen voor laat en vroeg vertrek, en dubbele
deelnemersresources samengevoegd op aangemelde gebruiker of weergavenaam. Geef
`--no-merge-duplicates` mee om ruwe deelnemersresources gescheiden te houden,
`--late-after-minutes` om laattijdigheidsdetectie af te stemmen, en
`--early-before-minutes` om detectie van vroeg vertrek af te stemmen.

`export` schrijft een map met `summary.md`, `attendance.csv`, `transcript.md`,
`artifacts.json`, `attendance.json` en `manifest.json`. `manifest.json` legt de
gekozen invoer, exportopties, conferentierecords, uitvoerbestanden, aantallen,
tokenbron, Calendar-event wanneer er een is gebruikt, en eventuele
waarschuwingen over gedeeltelijk ophalen vast. Geef `--zip` mee om ook een
draagbaar archief naast de map te schrijven. Geef `--include-doc-bodies` mee om
gekoppelde transcript- en smart-note-Google Docs-tekst te exporteren via Google
Drive `files.export`; dit vereist een nieuwe OAuth-login die de alleen-lezen
scope voor Drive Meet bevat. Zonder `--include-doc-bodies` bevatten exports
alleen Meet-metadata en gestructureerde transcriptregels. Als Google een
gedeeltelijke artefactfout retourneert, zoals een fout bij het tonen van
smart-notes, transcriptregels of Drive-documentinhoud, bewaren de samenvatting
en het manifest de waarschuwing in plaats van de hele export te laten mislukken.
Gebruik `--dry-run` om dezelfde artefact- en aanwezigheidsgegevens op te halen
en de manifest-JSON af te drukken zonder de map of ZIP te maken. Dat is handig
voordat je een grote export schrijft of wanneer een agent alleen aantallen,
geselecteerde records en waarschuwingen nodig heeft.

Agents kunnen dezelfde bundel ook maken via de tool `google_meet`:

```json
{
  "action": "export",
  "conferenceRecord": "conferenceRecords/abc123",
  "includeDocumentBodies": true,
  "outputDir": "meet-export",
  "zip": true
}
```

Stel `"dryRun": true` in om alleen het exportmanifest te retourneren en het
schrijven van bestanden over te slaan.

Agents kunnen ook een door de API ondersteunde ruimte maken met een expliciet
toegangsbeleid:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

En zij kunnen de actieve conferentie voor een bekende ruimte beëindigen:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Voor validatie met eerst luisteren moeten agents `test_listen` gebruiken voordat
ze stellen dat de vergadering bruikbaar is:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Voer de beveiligde live smoke uit tegen een echte bewaarde vergadering:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Voer de live browserprobe met eerst luisteren uit tegen een vergadering waarin
iemand zal spreken en Meet-ondertiteling beschikbaar is:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Live smoke-omgeving:

- `OPENCLAW_LIVE_TEST=1` schakelt beveiligde livetests in.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` verwijst naar een bewaarde Meet-URL, code
  of `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` or `GOOGLE_MEET_CLIENT_ID` levert de OAuth
  client-id.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` or `GOOGLE_MEET_REFRESH_TOKEN` levert de
  refreshtoken.
- Optioneel: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` en
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` gebruiken dezelfde fallbacknamen
  zonder het voorvoegsel `OPENCLAW_`.

De live smoke voor basisartefacten en aanwezigheid heeft
`https://www.googleapis.com/auth/meetings.space.readonly` en
`https://www.googleapis.com/auth/meetings.conference.media.readonly` nodig.
Agenda-opzoeken heeft `https://www.googleapis.com/auth/calendar.events.readonly`
nodig. Export van documentinhoud via Drive heeft
`https://www.googleapis.com/auth/drive.meet.readonly` nodig.

Maak een nieuwe Meet-ruimte:

```bash
openclaw googlemeet create
```

De opdracht drukt de nieuwe `meeting uri`, bron en joinsessie af. Met
OAuth-referenties gebruikt deze de officiële Google Meet API. Zonder
OAuth-referenties gebruikt deze als fallback het aangemelde browserprofiel van de
vastgepinde Chrome-node. Agents kunnen de tool `google_meet` met
`action: "create"` gebruiken om in één stap te maken en deel te nemen. Geef
voor alleen-URL-aanmaak `"join": false` mee.

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

Als de browserfallback Google-login of een Meet-toestemmingsblokkade tegenkomt
voordat de URL kan worden aangemaakt, retourneert de Gateway-methode een
mislukte respons en retourneert de tool `google_meet` gestructureerde details in
plaats van een gewone tekenreeks:

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
`manualActionMessage` plus de context van de browser-node/tab rapporteren en
stoppen met het openen van nieuwe Meet-tabs totdat de operator de browserstap
heeft voltooid.

Voorbeeld van JSON-uitvoer van aanmaak via de API:

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

Bij het maken van een Meet wordt standaard deelgenomen. Het Chrome- of Chrome-node-transport heeft nog steeds een aangemeld Google Chrome-profiel nodig om via de browser deel te nemen. Als het profiel is afgemeld, meldt OpenClaw `manualActionRequired: true` of een browserfallbackfout en vraagt de operator om de Google-login te voltooien voordat opnieuw wordt geprobeerd.

Stel `preview.enrollmentAcknowledged: true` pas in nadat je hebt bevestigd dat je Cloud-project, OAuth-principal en vergaderdeelnemers zijn ingeschreven in het Google Workspace Developer Preview Program voor Meet-media-API's.

## Configuratie

Het algemene Chrome-agentpad heeft alleen de ingeschakelde Plugin, BlackHole, SoX, een sleutel voor een realtime transcriptieprovider en een geconfigureerde OpenClaw TTS-provider nodig. OpenAI is de standaardtranscriptieprovider; stel `realtime.voiceProvider` in op `"google"` en `realtime.model` om Google Gemini Live te gebruiken voor `bidi`-modus zonder de standaardtranscriptieprovider voor agent-modus te wijzigen:

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
- `defaultMode: "agent"` (`"realtime"` wordt alleen geaccepteerd als verouderde compatibiliteitsalias voor `"agent"`; nieuwe toolaanroepen moeten `"agent"` zeggen)
- `chromeNode.node`: optionele node-id/naam/IP voor `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: naam die wordt gebruikt op het Meet-gastscherm wanneer niet aangemeld
- `chrome.autoJoin: true`: beste poging om de gastnaam in te vullen en op Join Now te klikken via OpenClaw-browserautomatisering op `chrome-node`
- `chrome.reuseExistingTab: true`: activeer een bestaande Meet-tab in plaats van duplicaten te openen
- `chrome.waitForInCallMs: 20000`: wacht tot de Meet-tab meldt dat deze in de oproep zit voordat de talk-back-intro wordt geactiveerd
- `chrome.audioFormat: "pcm16-24khz"`: audioformaat voor opdrachtparen. Gebruik `"g711-ulaw-8khz"` alleen voor verouderde/aangepaste opdrachtparen die nog telefonieaudio uitsturen.
- `chrome.audioBufferBytes: 4096`: SoX-verwerkingsbuffer voor gegenereerde Chrome-audio-opdrachten met opdrachtparen. Dit is de helft van de standaardbuffer van SoX van 8192 bytes, waardoor de standaard pipe-latentie wordt verlaagd terwijl er ruimte blijft om deze op drukke hosts te verhogen. Waarden onder het minimum van SoX worden begrensd op 17 bytes.
- `chrome.audioInputCommand`: SoX-opdracht die leest uit CoreAudio `BlackHole 2ch` en audio schrijft in `chrome.audioFormat`
- `chrome.audioOutputCommand`: SoX-opdracht die audio leest in `chrome.audioFormat` en schrijft naar CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: optionele lokale microfoonopdracht die signed 16-bit little-endian mono PCM schrijft voor detectie van menselijke onderbreking terwijl assistentweergave actief is. Dit geldt momenteel voor de door de Gateway gehoste `chrome`-opdrachtpaarbrug.
- `chrome.bargeInRmsThreshold: 650`: RMS-niveau dat telt als een menselijke onderbreking op `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: piekniveau dat telt als een menselijke onderbreking op `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: minimale vertraging tussen herhaalde resets van menselijke onderbrekingen
- `mode: "agent"`: standaard talk-back-modus. Spraak van deelnemers wordt getranscribeerd door de geconfigureerde realtime transcriptieprovider, verzonden naar de geconfigureerde OpenClaw-agent in een subagentsessie per vergadering en teruggesproken via de normale OpenClaw TTS-runtime.
- `mode: "bidi"`: fallbackmodus voor direct bidirectioneel realtime model. De realtime spraakprovider beantwoordt spraak van deelnemers direct en kan `openclaw_agent_consult` aanroepen voor diepere/tool-ondersteunde antwoorden.
- `mode: "transcribe"`: alleen-observeren-modus zonder de talk-back-brug.
- `realtime.provider: "openai"`: compatibiliteitsfallback die wordt gebruikt wanneer de gescopete providervelden hieronder niet zijn ingesteld.
- `realtime.transcriptionProvider: "openai"`: provider-id die door `agent`-modus wordt gebruikt voor realtime transcriptie.
- `realtime.voiceProvider`: provider-id die door `bidi`-modus wordt gebruikt voor directe realtime spraak. Stel dit in op `"google"` om Gemini Live te gebruiken terwijl transcriptie in agent-modus op OpenAI blijft.
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: korte gesproken antwoorden, met `openclaw_agent_consult` voor diepere antwoorden
- `realtime.introMessage`: korte gesproken gereedheidscontrole wanneer de realtime brug verbinding maakt; stel dit in op `""` om stil deel te nemen
- `realtime.agentId`: optionele OpenClaw-agent-id voor `openclaw_agent_consult`; standaard is `main`

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

ElevenLabs voor zowel luisteren als spreken in agent-modus:

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

De blijvende Meet-stem komt van `messages.tts.providers.elevenlabs.voiceId`. Agentantwoorden kunnen ook per antwoord `[[tts:voiceId=... model=eleven_v3]]`-directieven gebruiken wanneer TTS-modeloverschrijvingen zijn ingeschakeld, maar configuratie is de deterministische standaard voor vergaderingen. Bij deelname moeten de logs `transcriptionProvider=elevenlabs` tonen en elk gesproken antwoord moet `provider=elevenlabs model=eleven_v3 voice=<voiceId>` loggen.

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

`voiceCall.enabled` is standaard `true`; met Twilio-transport delegeert het de daadwerkelijke PSTN-oproep, DTMF en introductiebegroeting aan de Voice Call Plugin. Voice Call speelt de DTMF-reeks af voordat de realtime mediastream wordt geopend en gebruikt daarna de opgeslagen introtekst als de eerste realtime begroeting. Als `voice-call` niet is ingeschakeld, kan Google Meet het belplan nog steeds valideren en vastleggen, maar kan het de Twilio-oproep niet plaatsen.

## Tool

Agenten kunnen de `google_meet`-tool gebruiken:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Gebruik `transport: "chrome"` wanneer Chrome op de Gateway-host draait. Gebruik `transport: "chrome-node"` wanneer Chrome op een gekoppelde node draait, zoals een Parallels-VM. In beide gevallen draaien de modelproviders en `openclaw_agent_consult` op de Gateway-host, zodat modelreferenties daar blijven. Met de standaard `mode: "agent"` verzorgt de realtime transcriptieprovider het luisteren, produceert de geconfigureerde OpenClaw-agent het antwoord en spreekt reguliere OpenClaw TTS dit uit in Meet. Gebruik `mode: "bidi"` wanneer je wilt dat het realtime spraakmodel direct antwoordt. Ruwe `mode: "realtime"` blijft geaccepteerd als verouderde compatibiliteitsalias voor `mode: "agent"`, maar wordt niet langer geadverteerd in het agentschema voor tools. Logs in agent-modus bevatten de opgeloste transcriptieprovider/het opgeloste transcriptiemodel bij het starten van de brug en de TTS-provider, het model, de stem, de uitvoerindeling en de sample rate na elk gesynthetiseerd antwoord.

Gebruik `action: "status"` om actieve sessies te tonen of een sessie-ID te inspecteren. Gebruik `action: "speak"` met `sessionId` en `message` om de realtime agent onmiddellijk te laten spreken. Gebruik `action: "test_speech"` om de sessie te maken of opnieuw te gebruiken, een bekende zin te activeren en `inCall`-status terug te geven wanneer de Chrome-host dit kan melden. `test_speech` forceert altijd `mode: "agent"` en faalt als wordt gevraagd om te draaien in `mode: "transcribe"`, omdat sessies die alleen observeren bewust geen spraak kunnen uitsturen. Het resultaat `speechOutputVerified` is gebaseerd op realtime audio-uitvoerbytes die toenemen tijdens deze testaanroep, dus een hergebruikte sessie met oudere audio telt niet als een nieuwe geslaagde spraakcontrole. Gebruik `action: "leave"` om een sessie als beëindigd te markeren.

`status` bevat Chrome-status wanneer beschikbaar:

- `inCall`: Chrome lijkt zich binnen de Meet-oproep te bevinden
- `micMuted`: beste-poging Meet-microfoonstatus
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: het browserprofiel heeft handmatige login, toelating door de Meet-host, machtigingen of herstel van browserbediening nodig voordat spraak kan werken
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: of beheerde Chrome-spraak nu is toegestaan. `speechReady: false` betekent dat OpenClaw de intro-/testzin niet naar de audiobrug heeft gestuurd.
- `providerConnected` / `realtimeReady`: status van de realtime spraakbrug
- `lastInputAt` / `lastOutputAt`: laatste audio die door de brug is gezien of naar de brug is verzonden
- `audioOutputRouted` / `audioOutputDeviceLabel`: of de media-uitvoer van de Meet-tab actief was gerouteerd naar het BlackHole-apparaat dat door de brug wordt gebruikt
- `lastSuppressedInputAt` / `suppressedInputBytes`: local loopback-invoer genegeerd terwijl assistentweergave actief is

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Agent- en bidi-modi

Chrome `agent`-modus is geoptimaliseerd voor gedrag waarbij "mijn agent in de vergadering zit". De realtime transcriptieprovider hoort de vergaderaudio, definitieve deelnemertranscripten worden doorgestuurd via de geconfigureerde OpenClaw-agent en het antwoord wordt gesproken via de normale OpenClaw TTS-runtime. Stel `mode: "bidi"` in wanneer je wilt dat het realtime spraakmodel direct antwoordt. Nabijgelegen definitieve transcriptfragmenten worden samengevoegd vóór de consultatie, zodat één gesproken beurt niet meerdere verouderde gedeeltelijke antwoorden produceert. Realtime invoer wordt ook onderdrukt terwijl wachtrij-audio van de assistent nog wordt afgespeeld, en recente assistentachtige transcriptecho's worden genegeerd vóór de agentconsultatie, zodat BlackHole-local loopback de agent niet op zijn eigen spraak laat antwoorden.

| Modus   | Wie bepaalt het antwoord       | Pad voor spraakuitvoer                 | Gebruik wanneer                                         |
| ------- | ------------------------------ | -------------------------------------- | ------------------------------------------------------- |
| `agent` | De geconfigureerde OpenClaw-agent | Normale OpenClaw TTS-runtime           | Je gedrag wilt waarbij "mijn agent in de vergadering zit" |
| `bidi`  | Het realtime spraakmodel       | Audioreactie van realtime spraakprovider | Je de gesprekslus met de laagste latentie wilt          |

In `bidi`-modus kan het realtime model `openclaw_agent_consult` aanroepen wanneer het diepere redenering, actuele informatie of normale OpenClaw-tools nodig heeft.

De consulttool voert op de achtergrond de reguliere OpenClaw-agent uit met recente
vergaderingstranscriptcontext en retourneert een beknopt gesproken antwoord. In `agent`-modus
stuurt OpenClaw dat antwoord rechtstreeks naar de TTS-runtime; in `bidi`-modus kan het
realtime spraakmodel het consultresultaat terugspreken in de vergadering. Het gebruikt
dezelfde gedeelde consultmechaniek als Voice Call.

Standaard worden consults uitgevoerd tegen de `main`-agent. Stel `realtime.agentId` in wanneer een
Meet-lane een toegewezen OpenClaw-agentwerkruimte, modelstandaarden,
toolbeleid, geheugen en sessiegeschiedenis moet raadplegen.

Consults in agentmodus gebruiken een per-vergadering `agent:<id>:subagent:google-meet:<session>`
sessiesleutel, zodat vervolgvragen de vergadercontext behouden terwijl ze het normale
agentbeleid overnemen van de geconfigureerde agent.

`realtime.toolPolicy` beheert de consultuitvoering:

- `safe-read-only`: stel de consulttool beschikbaar en beperk de reguliere agent tot
  `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` en
  `memory_get`.
- `owner`: stel de consulttool beschikbaar en laat de reguliere agent het normale
  agenttoolbeleid gebruiken.
- `none`: stel de consulttool niet beschikbaar aan het realtime spraakmodel.

De consultsessiesleutel is per Meet-sessie afgebakend, zodat vervolgconsultaanroepen
eerdere consultcontext tijdens dezelfde vergadering kunnen hergebruiken.

Om een gesproken gereedheidscontrole af te dwingen nadat Chrome volledig aan het gesprek heeft deelgenomen:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Voor de volledige join-and-speak smoke:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Live testchecklist

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
  standaardtransport is of een Node is vastgezet.
- `nodes status` toont dat de geselecteerde Node is verbonden.
- De geselecteerde Node adverteert zowel `googlemeet.chrome` als `browser.proxy`.
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

Dat bewijst dat de Gateway-plugin is geladen, dat de VM-Node verbonden is met het
huidige token en dat de Meet-audiobridge beschikbaar is voordat een agent een
echt vergaderingstabblad opent.

Gebruik voor een Twilio-smoke een vergadering die telefoongegevens voor inbellen toont:

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
- `googlemeet leave <sessionId>` hangt het gedelegeerde spraakgesprek op.

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

Op niet-macOS-Gateway-hosts blijft de agentgerichte `google_meet`-tool zichtbaar,
maar lokale Chrome-talkbackacties worden geblokkeerd voordat ze de audiobridge bereiken.
Lokale Chrome-talkbackaudio is momenteel afhankelijk van macOS `BlackHole 2ch`, dus
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
De Gateway-configuratie moet deze Node-opdrachten toestaan:

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
`gateway token mismatch` meldt, installeer de Node dan opnieuw of herstart deze met het huidige Gateway-token. Voor een LAN-Gateway betekent dit meestal:

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

### Browser opent, maar agent kan niet deelnemen

Voer `googlemeet test-listen` uit voor observe-only deelname of `googlemeet test-speech`
voor realtime deelname, en inspecteer daarna de geretourneerde Chrome-status. Als een van beide probes
`manualActionRequired: true` rapporteert, toon `manualActionMessage` aan de operator
en stop met opnieuw proberen totdat de browseractie is voltooid.

Veelvoorkomende handmatige acties:

- Log in op het Chrome-profiel.
- Laat de gast toe vanuit het Meet-hostaccount.
- Geef Chrome microfoon-/cameramachtigingen wanneer Chrome's native machtigingsprompt
  verschijnt.
- Sluit of herstel een vastgelopen Meet-machtigingsdialoog.

Rapporteer niet "not signed in" alleen omdat Meet toont "Do you want people to
hear you in the meeting?" Dat is Meet's tussenstap voor audiokeuze; OpenClaw
klikt via browserautomatisering op **Use microphone** wanneer beschikbaar en blijft
wachten op de echte vergaderstatus. Voor de browserfallback voor alleen aanmaken kan OpenClaw
op **Continue without microphone** klikken, omdat het aanmaken van de URL het
realtime audiopad niet nodig heeft.

### Vergadering aanmaken mislukt

`googlemeet create` gebruikt eerst het Google Meet API-`spaces.create`-endpoint
wanneer OAuth-referenties zijn geconfigureerd. Zonder OAuth-referenties valt het terug
op de vastgezette Chrome-Node-browser. Controleer:

- Voor aanmaken via de API: `oauth.clientId` en `oauth.refreshToken` zijn geconfigureerd,
  of overeenkomende `OPENCLAW_GOOGLE_MEET_*`-omgevingsvariabelen zijn aanwezig.
- Voor aanmaken via de API: het refresh-token is uitgegeven nadat ondersteuning voor aanmaken is
  toegevoegd. Oudere tokens missen mogelijk de `meetings.space.created`-scope; voer
  `openclaw googlemeet auth login --json` opnieuw uit en werk de pluginconfiguratie bij.
- Voor browserfallback: `defaultTransport: "chrome-node"` en
  `chromeNode.node` wijzen naar een verbonden Node met `browser.proxy` en
  `googlemeet.chrome`.
- Voor browserfallback: het OpenClaw Chrome-profiel op die Node is ingelogd
  bij Google en kan `https://meet.google.com/new` openen.
- Voor browserfallback: nieuwe pogingen hergebruiken een bestaand `https://meet.google.com/new`
  of Google-accountprompttabblad voordat een nieuw tabblad wordt geopend. Als een agent een time-out krijgt,
  probeer de toolaanroep opnieuw in plaats van handmatig nog een Meet-tabblad te openen.
- Voor browserfallback: als de tool `manualActionRequired: true` retourneert, gebruik dan
  de geretourneerde `browser.nodeId`, `browser.targetId`, `browserUrl` en
  `manualActionMessage` om de operator te begeleiden. Probeer niet in een lus opnieuw totdat die
  actie is voltooid.
- Voor browserfallback: als Meet toont "Do you want people to hear you in the
  meeting?", laat het tabblad open. OpenClaw moet via browserautomatisering klikken op **Use microphone** of, voor
  fallback voor alleen aanmaken, **Continue without microphone** en blijven wachten op de gegenereerde Meet-URL. Als dat niet lukt, moet de
  fout `meet-audio-choice-required` noemen, niet `google-login-required`.

### Agent neemt deel maar praat niet

Controleer het realtime pad:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Gebruik `mode: "agent"` voor het normale STT -> OpenClaw-agent -> TTS-talkbackpad,
of `mode: "bidi"` voor de directe realtime spraakfallback. `mode: "transcribe"`
start bewust geen talkbackbridge. Voer voor observe-only debugging
`openclaw googlemeet status --json <session-id>` uit nadat deelnemers hebben gesproken
en controleer `captioning`, `transcriptLines` en `lastCaptionText`. Als `inCall`
true is maar `transcriptLines` op `0` blijft, zijn Meet-ondertitels mogelijk uitgeschakeld, heeft niemand
gesproken sinds de observer is geïnstalleerd, is de Meet-UI gewijzigd of zijn live
ondertitels niet beschikbaar voor de vergadertaal/het account.

`googlemeet test-speech` controleert altijd het realtime pad en rapporteert of
bridge-uitvoerbytes zijn waargenomen voor die aanroep. Als `speechOutputVerified` false is en
`speechOutputTimedOut` true is, heeft de realtime provider de
uiting mogelijk geaccepteerd, maar heeft OpenClaw geen nieuwe uitvoerbytes de Chrome-audiobridge
zien bereiken.

Controleer ook:

- Er is een realtime providersleutel beschikbaar op de Gateway-host, zoals
  `OPENAI_API_KEY` of `GEMINI_API_KEY`.
- `BlackHole 2ch` is zichtbaar op de Chrome-host.
- `sox` bestaat op de Chrome-host.
- Meet-microfoon en -speaker zijn gerouteerd via het virtuele audiopad dat door
  OpenClaw wordt gebruikt. `doctor` moet `meet output routed: yes` tonen voor lokale Chrome
  realtime deelnames.

`googlemeet doctor [session-id]` print de sessie, Node, in-gesprek-status,
reden voor handmatige actie, realtime providerverbinding, `realtimeReady`, audio-
invoer-/uitvoeractiviteit, laatste audiotijdstempels, bytecounters en browser-URL.
Gebruik `googlemeet status [session-id] --json` wanneer je de ruwe JSON nodig hebt. Gebruik
`googlemeet doctor --oauth` wanneer je Google Meet OAuth-refresh moet verifiëren
zonder tokens bloot te stellen; voeg `--meeting` of `--create-space` toe wanneer je ook
Google Meet API-bewijs nodig hebt.

Als een agent een time-out kreeg en je ziet dat er al een Meet-tabblad open is, inspecteer dat tabblad
zonder er nog een te openen:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

De equivalente toolactie is `recover_current_tab`. Deze focust en inspecteert een
bestaand Meet-tabblad voor het geselecteerde transport. Met `chrome` gebruikt het lokale
browserbesturing via de Gateway; met `chrome-node` gebruikt het de geconfigureerde
Chrome-Node. Het opent geen nieuw tabblad en maakt geen nieuwe sessie aan; het rapporteert de
huidige blokkade, zoals login, toelating, machtigingen of audiokeuzestatus.
De CLI-opdracht praat met de geconfigureerde Gateway, dus de Gateway moet actief zijn;
`chrome-node` vereist ook dat de Chrome-Node verbonden is.

### Twilio-setupcontroles falen

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

`twilio-voice-call-webhook` faalt wanneer `voice-call` geen publieke Webhook-
blootstelling heeft, of wanneer `publicUrl` naar loopback of privénetwerkruimte wijst.
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

Start of herlaad daarna de Gateway en voer uit:

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

Controleer of de Meet-gebeurtenis details voor telefonisch inbellen bevat. Geef het exacte inbelnummer
en de PIN of een aangepaste DTMF-reeks door:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Gebruik een voorafgaande `w` of komma's in `--dtmf-sequence` als de provider een pauze nodig heeft
voordat de PIN wordt ingevoerd.

Als de telefoongesprek is aangemaakt maar de Meet-deelnemerslijst de inbeldeelnemer nooit toont:

- Voer `openclaw googlemeet doctor <session-id>` uit om de gedelegeerde Twilio-
  oproep-ID te controleren, of DTMF in de wachtrij is gezet, en of de introbegroeting is aangevraagd.
- Voer `openclaw voicecall status --call-id <id>` uit en controleer of het gesprek nog steeds
  actief is.
- Voer `openclaw voicecall tail` uit en controleer of Twilio-Webhooks bij de
  Gateway aankomen.
- Voer `openclaw logs --follow` uit en zoek naar de Twilio Meet-reeks: Google
  Meet delegeert het deelnemen, Voice Call slaat pre-connect DTMF TwiML op en serveert die,
  Voice Call serveert realtime TwiML voor de Twilio-oproep, waarna Google Meet
  introspeech aanvraagt met `voicecall.speak`.
- Voer `openclaw googlemeet setup --transport twilio` opnieuw uit; een groene setupcontrole is
  vereist maar bewijst niet dat de PIN-reeks voor de vergadering correct is.
- Controleer of het inbelnummer hoort bij dezelfde Meet-uitnodiging en regio als
  de PIN.
- Verhoog `voiceCall.dtmfDelayMs` ten opzichte van de standaardwaarde van 12 seconden als Meet traag
  opneemt of het gesprekstranscript nog steeds de prompt toont die om een PIN vraagt nadat
  pre-connect DTMF is verzonden.
- Als de deelnemer deelneemt maar je de begroeting niet hoort, controleer dan
  `openclaw logs --follow` op de post-DTMF-aanvraag `voicecall.speak` en
  ofwel media-stream-TTS-weergave of de Twilio `<Say>`-fallback. Als het gesprekstranscript
  nog steeds "enter the meeting PIN" bevat, is de telefoonlijn nog niet toegetreden
  tot de Meet-ruimte, dus vergaderdeelnemers horen geen spraak.

Als Webhooks niet aankomen, debug dan eerst de Voice Call-plugin: de provider moet
`plugins.entries.voice-call.config.publicUrl` of de geconfigureerde tunnel kunnen bereiken.
Zie [Probleemoplossing voor spraakoproepen](/nl/plugins/voice-call#troubleshooting).

## Opmerkingen

De officiële media-API van Google Meet is gericht op ontvangen, dus spreken in een Meet-
gesprek heeft nog steeds een deelnemerspad nodig. Deze plugin houdt die grens zichtbaar:
Chrome verzorgt deelname via de browser en lokale audioroutering; Twilio verzorgt
deelname via telefonisch inbellen.

Chrome-terugspraakmodi hebben `BlackHole 2ch` nodig plus een van de volgende opties:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw beheert de
  bridge en stuurt audio in `chrome.audioFormat` tussen die opdrachten en de
  geselecteerde provider. Agentmodus gebruikt realtime transcriptie plus normale TTS;
  bidi-modus gebruikt de realtime spraakprovider. Het standaard Chrome-pad is 24 kHz
  PCM16 met `chrome.audioBufferBytes: 4096`; 8 kHz G.711 mu-law blijft
  beschikbaar voor verouderde opdrachtparen.
- `chrome.audioBridgeCommand`: een externe bridge-opdracht beheert het volledige lokale
  audiopad en moet afsluiten nadat de daemon is gestart of gevalideerd. Dit is alleen
  geldig voor `bidi`, omdat `agent`-modus directe toegang tot opdrachtparen nodig heeft voor TTS.

Wanneer een agent de tool `google_meet` aanroept in agentmodus, forkt de vergaderingconsultant-
sessie het huidige transcript van de aanroeper voordat deze antwoordt op deelnemersspraak.
De Meet-sessie blijft nog steeds afzonderlijk (`agent:<agentId>:subagent:google-meet:<sessionId>`)
zodat vervolgacties in de vergadering het transcript van de aanroeper niet direct wijzigen.

Voor schone duplexaudio routeer je Meet-uitvoer en Meet-microfoon via afzonderlijke
virtuele apparaten of een Loopback-achtige grafiek met virtuele apparaten. Een enkel gedeeld
BlackHole-apparaat kan andere deelnemers terug de oproep in laten echoën.

Met de opdrachtpaar-Chrome-bridge kan `chrome.bargeInInputCommand` luisteren naar een
afzonderlijke lokale microfoon en assistentweergave wissen wanneer de mens begint
te praten. Zo blijft menselijke spraak vóór assistentuitvoer, zelfs wanneer de gedeelde
BlackHole-loopbackinvoer tijdelijk wordt onderdrukt tijdens assistentweergave.
Net als `chrome.audioInputCommand` en `chrome.audioOutputCommand` is dit een
lokaal commando dat door de operator wordt geconfigureerd. Gebruik een expliciet vertrouwd commandopad of
argumentenlijst, en verwijs niet naar scripts op niet-vertrouwde locaties.

`googlemeet speak` activeert de actieve terugspraak-audiobridge voor een Chrome-
sessie. `googlemeet leave` stopt die bridge. Voor Twilio-sessies die via de Voice Call-plugin zijn
gedelegeerd, hangt `leave` ook het onderliggende spraakgesprek op.
Gebruik `googlemeet end-active-conference` wanneer je ook de actieve
Google Meet-conferentie voor een API-beheerde ruimte wilt sluiten.

## Gerelateerd

- [Voice Call-plugin](/nl/plugins/voice-call)
- [Spreekmodus](/nl/nodes/talk)
- [Plugins bouwen](/nl/plugins/building-plugins)
