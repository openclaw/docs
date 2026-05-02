---
read_when:
    - Je wilt dat een OpenClaw-agent deelneemt aan een Google Meet-gesprek
    - Je wilt dat een OpenClaw-agent een nieuw Google Meet-gesprek aanmaakt
    - Je configureert Chrome, Chrome-node of Twilio als Google Meet-transport
summary: 'Google Meet Plugin: deelnemen aan expliciete Meet-URL''s via Chrome of Twilio met standaardinstellingen voor realtime spraak'
title: Google Meet-Plugin
x-i18n:
    generated_at: "2026-05-02T11:22:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0dc515382d2cc7beacaf18a50b75cb0f4eda3038cfd8efe73ea3ce7b5007bc43
    source_path: plugins/google-meet.md
    workflow: 16
---

Google Meet-deelnemersondersteuning voor OpenClaw — de plugin is bewust expliciet ontworpen:

- De plugin neemt alleen deel via een expliciete `https://meet.google.com/...`-URL.
- De plugin kan een nieuwe Meet-ruimte maken via de Google Meet API en vervolgens deelnemen via de
  geretourneerde URL.
- `realtime`-spraak is de standaardmodus.
- Realtime-spraak kan terugroepen naar de volledige OpenClaw-agent wanneer diepere
  redenering of tools nodig zijn.
- Agents kiezen het deelnamegedrag met `mode`: gebruik `realtime` voor live
  luisteren/terugspreken, of `transcribe` om deel te nemen/de browser te bedienen zonder de
  realtime-spraakbrug.
- Authenticatie begint als persoonlijke Google OAuth of een Chrome-profiel dat al is aangemeld.
- Er is geen automatische toestemmingsaankondiging.
- De standaard Chrome-audiobackend is `BlackHole 2ch`.
- Chrome kan lokaal draaien of op een gekoppelde node-host.
- Twilio accepteert een inbelnummer plus optionele pincode of DTMF-reeks; het
  kan niet rechtstreeks een Meet-URL bellen.
- De CLI-opdracht is `googlemeet`; `meet` is gereserveerd voor bredere agent-
  teleconferentieworkflows.

## Snel starten

Installeer de lokale audioafhankelijkheden en configureer een backendprovider voor realtime-spraak.
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

De setup-uitvoer is bedoeld om leesbaar te zijn voor agents en rekening te houden met de modus. Deze rapporteert het Chrome-
profiel, node-pinning en, voor realtime Chrome-deelnames, de BlackHole/SoX-audio-
brug en vertraagde realtime-introcontroles. Voor alleen-observeren-deelnames controleer je hetzelfde
transport met `--mode transcribe`; die modus slaat realtime-audiovereisten over
omdat deze niet via de brug luistert of spreekt:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Wanneer Twilio-delegatie is geconfigureerd, rapporteert setup ook of de
`voice-call`-plugin, Twilio-referenties en publieke Webhook-blootstelling gereed zijn.
Behandel elke `ok: false`-controle als een blokkade voor het gecontroleerde transport en de gecontroleerde modus
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
Webhook-blootstelling op voordat de agent de vergadering probeert te bellen.

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

De agentgerichte `google_meet`-tool blijft beschikbaar op niet-macOS-hosts voor
artifact-, agenda-, setup-, transcribe-, Twilio- en `chrome-node`-flows. Lokale
realtime-acties in Chrome worden daar geblokkeerd omdat het meegeleverde realtime Chrome-
audiopad momenteel afhankelijk is van macOS `BlackHole 2ch`. Gebruik op Linux
`mode: "transcribe"`, Twilio-inbellen of een macOS `chrome-node`-host voor realtime
Chrome-deelname.

Maak een nieuwe vergadering en neem eraan deel:

```bash
openclaw googlemeet create --transport chrome-node --mode realtime
```

Gebruik voor via de API gemaakte kamers Google Meet `SpaceConfig.accessType` wanneer je wilt
dat het beleid zonder aankloppen van de kamer expliciet is in plaats van overgenomen uit de standaardinstellingen van het Google-
account:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode realtime
```

`OPEN` laat iedereen met de Meet-URL deelnemen zonder aan te kloppen. `TRUSTED` laat de
vertrouwde gebruikers van de organisatie van de host, uitgenodigde externe gebruikers en inbelgebruikers
deelnemen zonder aan te kloppen. `RESTRICTED` beperkt toegang zonder aankloppen tot genodigden. Deze
instellingen gelden alleen voor het officiële aanmaakpad van de Google Meet API, dus OAuth-
referenties moeten zijn geconfigureerd.

Als je Google Meet hebt geauthenticeerd voordat deze optie beschikbaar was, voer dan opnieuw
`openclaw googlemeet auth login --json` uit nadat je de
`meetings.space.settings`-scope hebt toegevoegd aan je Google OAuth-toestemmingsscherm.

Maak alleen de URL zonder deel te nemen:

```bash
openclaw googlemeet create --no-join
```

`googlemeet create` heeft twee paden:

- API-aanmaak: gebruikt wanneer Google Meet OAuth-referenties zijn geconfigureerd. Dit is
  het meest deterministische pad en is niet afhankelijk van de UI-status van de browser.
- Browserfallback: gebruikt wanneer OAuth-referenties ontbreken. OpenClaw gebruikt de
  gepinde Chrome-node, opent `https://meet.google.com/new`, wacht tot Google
  doorverwijst naar een echte URL met vergadercode en retourneert die URL vervolgens. Dit pad vereist
  dat het OpenClaw Chrome-profiel op de node al bij Google is aangemeld.
  Browserautomatisering handelt de eigen eerste microfoonprompt van Meet af; die prompt
  wordt niet behandeld als een mislukte Google-login.
  Deelname- en aanmaakflows proberen ook een bestaand Meet-tabblad te hergebruiken voordat een
  nieuw tabblad wordt geopend. Matching negeert onschuldige URL-querystrings zoals `authuser`, zodat een
  nieuwe poging van een agent de al geopende vergadering zou moeten focussen in plaats van een tweede
  Chrome-tabblad te maken.

De opdracht-/tooluitvoer bevat een `source`-veld (`api` of `browser`), zodat agents
kunnen uitleggen welk pad is gebruikt. `create` neemt standaard deel aan de nieuwe vergadering en
retourneert `joined: true` plus de deelnamesessie. Gebruik
`create --no-join` in de CLI of geef `"join": false` door aan de tool om alleen de URL aan te maken.

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

Stel voor deelname als alleen-observeren/browserbediening `"mode": "transcribe"` in. Dat start
niet de duplex realtime-modelbrug, vereist geen BlackHole of SoX,
en spreekt niet terug in de vergadering. Chrome-deelnames in deze modus vermijden ook
OpenClaw's toestemmingsverlening voor microfoon/camera en vermijden het Meet-pad **Microfoon gebruiken**.
Als Meet een tussenscherm voor audiokeuze toont, probeert automatisering
het pad zonder microfoon en rapporteert anders een handmatige actie in plaats van
de lokale microfoon te openen. In transcribe-modus installeren beheerde Chrome-transporten ook
een best-effort Meet-ondertitelingsobserver. `googlemeet status --json` en
`googlemeet doctor` tonen `captioning`, `captionsEnabledAttempted`,
`transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText`,
en een korte `recentTranscript`-staart zodat operators kunnen zien of de browser
aan de oproep heeft deelgenomen en of Meet-ondertitels tekst produceren.
Gebruik `openclaw googlemeet test-listen <meet-url> --transport chrome-node` wanneer
je een ja/nee-probe nodig hebt: deze neemt deel in transcribe-modus, wacht op verse ondertitel- of
transcriptbeweging en retourneert `listenVerified`, `listenTimedOut`, velden voor handmatige
actie en de nieuwste ondertitelingsstatus.

Tijdens realtime-sessies bevat `google_meet`-status browser- en audiobrug-
gezondheid zoals `inCall`, `manualActionRequired`, `providerConnected`,
`realtimeReady`, `audioInputActive`, `audioOutputActive`, laatste invoer-/uitvoer-
tijdstempels, byte-tellers en gesloten status van de brug. Als een veilige Meet-paginaprompt
verschijnt, handelt browserautomatisering deze af wanneer dat kan. Login, hosttoelating en
browser-/OS-toestemmingsprompts worden gerapporteerd als handmatige actie met een reden en
bericht dat de agent kan doorgeven. Beheerde Chrome-sessies sturen de intro of
testzin alleen uit nadat browsergezondheid `inCall: true` rapporteert; anders rapporteert status
`speechReady: false` en wordt de spraakpoging geblokkeerd in plaats van te doen alsof de
agent in de vergadering sprak.

Lokale Chrome-deelnames verlopen via het aangemelde OpenClaw-browserprofiel. Realtime-modus
vereist `BlackHole 2ch` voor het microfoon-/speakerpad dat door OpenClaw wordt gebruikt. Gebruik voor
schone duplexaudio afzonderlijke virtuele apparaten of een Loopback-achtige graph; een
enkel BlackHole-apparaat is genoeg voor een eerste smoke-test, maar kan echo veroorzaken.

### Lokale Gateway + Parallels Chrome

Je hebt **geen** volledige OpenClaw Gateway of model-API-sleutel in een macOS-VM
nodig alleen om de VM eigenaar van Chrome te laten zijn. Draai de Gateway en agent lokaal en draai vervolgens een
node-host in de VM. Schakel de meegeleverde plugin één keer in op de VM zodat de node
de Chrome-opdracht adverteert:

Wat waar draait:

- Gateway-host: OpenClaw Gateway, agentwerkruimte, model-/API-sleutels, realtime-
  provider en de Google Meet-pluginconfiguratie.
- Parallels macOS-VM: OpenClaw CLI/node-host, Google Chrome, SoX, BlackHole 2ch,
  en een Chrome-profiel dat is aangemeld bij Google.
- Niet nodig in de VM: Gateway-service, agentconfiguratie, OpenAI/GPT-sleutel of model-
  providerconfiguratie.

Installeer de VM-afhankelijkheden:

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

Installeer of werk OpenClaw bij in de VM en schakel daar vervolgens de meegeleverde plugin in:

```bash
openclaw plugins enable google-meet
```

Start de node-host in de VM:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Als `<gateway-host>` een LAN-IP is en je TLS niet gebruikt, weigert de node de
plaintext WebSocket tenzij je expliciet instemt voor dat vertrouwde privénetwerk:

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

`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` is een procesomgeving, geen
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

Tijdens realtime deelnemen vult OpenClaw-browserautomatisering de gastnaam in, klikt op
Deelnemen/Vragen om deel te nemen, en accepteert Meet's eerste-keer-keuze
"Microfoon gebruiken" wanneer die prompt verschijnt. Tijdens alleen-observeren
deelnemen of alleen-browser vergadering aanmaken gaat het voorbij dezelfde prompt
zonder microfoon wanneer die keuze beschikbaar is. Als het browserprofiel niet is
ingelogd, Meet wacht op toelating door de host, Chrome microfoon-/cameratoestemming
nodig heeft voor realtime deelnemen, of Meet vastzit op een prompt die de
automatisering niet kon oplossen, rapporteert het resultaat van deelnemen/testspraak
`manualActionRequired: true` met `manualActionReason` en
`manualActionMessage`. Agents moeten stoppen met opnieuw proberen deel te nemen,
dat exacte bericht plus de huidige `browserUrl`/`browserTitle` rapporteren, en pas
opnieuw proberen nadat de handmatige browseractie voltooid is.

Als `chromeNode.node` is weggelaten, selecteert OpenClaw alleen automatisch wanneer
precies één verbonden Node zowel `googlemeet.chrome` als browserbesturing aanbiedt.
Als meerdere geschikte Nodes verbonden zijn, stel `chromeNode.node` dan in op de
Node-id, weergavenaam of externe IP.

Algemene foutcontroles:

- `Configured Google Meet node ... is not usable: offline`: de vastgezette Node is
  bekend bij de Gateway maar niet beschikbaar. Agents moeten die Node behandelen
  als diagnostische status, niet als een bruikbare Chrome-host, en de
  installatieblokkade rapporteren in plaats van terug te vallen op een ander
  transport, tenzij de gebruiker daarom vroeg.
- `No connected Google Meet-capable node`: start `openclaw node run` in de VM,
  keur koppelen goed, en zorg dat `openclaw plugins enable google-meet` en
  `openclaw plugins enable browser` in de VM zijn uitgevoerd. Bevestig ook dat de
  Gateway-host beide Node-opdrachten toestaat met
  `gateway.nodes.allowCommands: ["googlemeet.chrome", "browser.proxy"]`.
- `BlackHole 2ch audio device not found`: installeer `blackhole-2ch` op de host
  die wordt gecontroleerd en herstart voordat je lokale Chrome-audio gebruikt.
- `BlackHole 2ch audio device not found on the node`: installeer `blackhole-2ch`
  in de VM en herstart de VM.
- Chrome opent maar kan niet deelnemen: log in op het browserprofiel binnen de VM,
  of houd `chrome.guestName` ingesteld voor deelnemen als gast. Automatisch
  deelnemen als gast gebruikt OpenClaw-browserautomatisering via de Node
  browserproxy; zorg dat de Node-browserconfiguratie verwijst naar het gewenste
  profiel, bijvoorbeeld `browser.defaultProfile: "user"` of een benoemd
  bestaand-sessieprofiel.
- Dubbele Meet-tabbladen: laat `chrome.reuseExistingTab: true` ingeschakeld.
  OpenClaw activeert een bestaand tabblad voor dezelfde Meet-URL voordat het een
  nieuw opent, en browsergebaseerd vergaderingen aanmaken hergebruikt een lopend
  `https://meet.google.com/new`- of Google-accountprompttabblad voordat het een
  ander opent.
- Geen audio: routeer in Meet microfoon-/luidsprekeraudio via het virtuele
  audioapparaatpad dat door OpenClaw wordt gebruikt; gebruik afzonderlijke
  virtuele apparaten of Loopback-achtige routering voor schone duplexaudio.

## Installatieopmerkingen

De Chrome-realtime-standaard gebruikt twee externe tools:

- `sox`: command-line audiohulpprogramma. De Plugin gebruikt expliciete
  CoreAudio-apparaatopdrachten voor de standaard 24 kHz PCM16-audiobrug.
- `blackhole-2ch`: virtuele macOS-audiodriver. Deze maakt het
  `BlackHole 2ch`-audioapparaat dat Chrome/Meet kan gebruiken voor routering.

OpenClaw bundelt of herdistribueert geen van beide pakketten. De documentatie
vraagt gebruikers ze als hostafhankelijkheden via Homebrew te installeren. SoX is
gelicentieerd als `LGPL-2.0-only AND GPL-2.0-only`; BlackHole is GPL-3.0. Als je
een installer of appliance bouwt die BlackHole met OpenClaw bundelt, controleer
dan de upstream licentievoorwaarden van BlackHole of verkrijg een aparte licentie
van Existential Audio.

## Transporten

### Chrome

Chrome-transport opent de Meet-URL via OpenClaw-browserbesturing en neemt deel
als het ingelogde OpenClaw-browserprofiel. Op macOS controleert de Plugin vóór
het starten op `BlackHole 2ch`. Indien geconfigureerd, voert het ook een
gezondheidsopdracht voor de audiobrug en een startopdracht uit voordat Chrome
wordt geopend. Gebruik `chrome` wanneer Chrome/audio op de Gateway-host draaien;
gebruik `chrome-node` wanneer Chrome/audio op een gekoppelde Node draaien, zoals
een Parallels macOS-VM. Kies voor lokale Chrome het profiel met
`browser.defaultProfile`; `chrome.browserProfile` wordt doorgegeven aan
`chrome-node`-hosts.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Routeer Chrome-microfoon- en luidsprekeraudio via de lokale OpenClaw-audiobrug.
Als `BlackHole 2ch` niet is geïnstalleerd, mislukt het deelnemen met een
installatiefout in plaats van stil deel te nemen zonder audiopad.

### Twilio

Twilio-transport is een strikt belplan dat wordt gedelegeerd aan de Voice Call
Plugin. Het parseert geen Meet-pagina's voor telefoonnummers.

Gebruik dit wanneer Chrome-deelname niet beschikbaar is of je een fallback voor
telefonisch inbellen wilt. Google Meet moet een telefonisch inbelnummer en PIN
voor de vergadering beschikbaar stellen; OpenClaw ontdekt deze niet vanaf de
Meet-pagina.

Schakel de Voice Call Plugin in op de Gateway-host, niet op de Chrome-Node:

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

Geef Twilio-referenties via omgeving of configuratie. Omgeving houdt geheimen uit
`openclaw.json`:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

Herstart of herlaad de Gateway na het inschakelen van `voice-call`; wijzigingen
in Plugin-configuratie verschijnen pas in een al draaiend Gateway-proces nadat
het is herladen.

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

Gebruik `--dtmf-sequence` wanneer de vergadering een aangepaste reeks vereist:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth en preflight

OAuth is optioneel voor het maken van een Meet-link, omdat `googlemeet create` kan
terugvallen op browserautomatisering. Configureer OAuth wanneer je officieel via
API wilt aanmaken, ruimtes wilt oplossen of Meet Media API-preflightcontroles
wilt uitvoeren.

Toegang tot de Google Meet API gebruikt gebruikers-OAuth: maak een Google Cloud
OAuth-client, vraag de vereiste scopes aan, autoriseer een Google-account en sla
daarna de resulterende refreshtoken op in de Google Meet Plugin-configuratie of
lever de `OPENCLAW_GOOGLE_MEET_*`-omgevingsvariabelen.

OAuth vervangt het Chrome-deelnamepad niet. Chrome- en Chrome-node-transporten
nemen nog steeds deel via een ingelogd Chrome-profiel, BlackHole/SoX en een
verbonden Node wanneer je browserdeelname gebruikt. OAuth is alleen voor het
officiële Google Meet API-pad: vergaderruimtes aanmaken, ruimtes oplossen en Meet
Media API-preflightcontroles uitvoeren.

### Google-referenties maken

In Google Cloud Console:

1. Maak of selecteer een Google Cloud-project.
2. Schakel **Google Meet REST API** in voor dat project.
3. Configureer het OAuth-toestemmingsscherm.
   - **Intern** is het eenvoudigst voor een Google Workspace-organisatie.
   - **Extern** werkt voor persoonlijke/testopstellingen; zolang de app in Testen
     staat, voeg je elk Google-account dat de app zal autoriseren toe als testgebruiker.
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
`meetings.space.readonly` laat OpenClaw Meet-URL's/codes naar ruimtes oplossen.
`meetings.space.settings` laat OpenClaw `SpaceConfig`-instellingen zoals
`accessType` doorgeven tijdens API-kameraanmaak.
`meetings.conference.media.readonly` is voor Meet Media API-preflight en
mediawerk; Google kan Developer Preview-inschrijving vereisen voor daadwerkelijk
Media API-gebruik. Als je alleen browsergebaseerde Chrome-deelnames nodig hebt,
sla OAuth dan volledig over.

### De refreshtoken aanmaken

Configureer `oauth.clientId` en eventueel `oauth.clientSecret`, of geef ze door
als omgevingsvariabelen, en voer dan uit:

```bash
openclaw googlemeet auth login --json
```

De opdracht drukt een `oauth`-configuratieblok met een refreshtoken af. Het
gebruikt PKCE, localhost-callback op `http://localhost:8085/oauth2callback`, en
een handmatige kopiëren/plakken-flow met `--manual`.

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

Gebruik bij voorkeur omgevingsvariabelen wanneer je de refreshtoken niet in de
configuratie wilt hebben. Als zowel configuratie- als omgevingswaarden aanwezig
zijn, lost de Plugin eerst configuratie op en daarna de omgevingsfallback.

De OAuth-toestemming omvat Meet-ruimteaanmaak, leestoegang tot Meet-ruimtes en
leestoegang tot Meet-conferentiemedia. Als je je hebt geauthenticeerd voordat
ondersteuning voor vergaderingen aanmaken bestond, voer dan
`openclaw googlemeet auth login --json` opnieuw uit zodat de refreshtoken de
`meetings.space.created`-scope heeft.

### OAuth verifiëren met doctor

Voer de OAuth-doctor uit wanneer je een snelle gezondheidscontrole zonder
geheimen wilt:

```bash
openclaw googlemeet doctor --oauth --json
```

Dit laadt de Chrome-runtime niet en vereist geen verbonden Chrome-Node. Het
controleert of OAuth-configuratie bestaat en of de refreshtoken een toegangstoken
kan aanmaken. Het JSON-rapport bevat alleen statusvelden zoals `ok`,
`configured`, `tokenSource`, `expiresAt` en controleberichten; het drukt de
toegangstoken, refreshtoken of clientgeheim niet af.

Veelvoorkomende resultaten:

| Controle             | Betekenis                                                                              |
| -------------------- | -------------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` plus `oauth.refreshToken`, of een gecachete toegangstoken, is aanwezig. |
| `oauth-token`        | De gecachete toegangstoken is nog geldig, of de refreshtoken heeft een nieuwe toegangstoken aangemaakt. |
| `meet-spaces-get`    | Optionele `--meeting`-controle heeft een bestaande Meet-ruimte opgelost.               |
| `meet-spaces-create` | Optionele `--create-space`-controle heeft een nieuwe Meet-ruimte aangemaakt.           |

Om ook inschakeling van de Google Meet API en de `spaces.create`-scope te bewijzen,
voer je de aanmaakcontrole met bijwerking uit:

```bash
openclaw googlemeet doctor --oauth --create-space --json
openclaw googlemeet create --no-join --json
```

`--create-space` maakt een tijdelijke Meet-URL aan. Gebruik dit wanneer je moet bevestigen
dat voor het Google Cloud-project de Meet API is ingeschakeld en dat het geautoriseerde
account de scope `meetings.space.created` heeft.

Om leestoegang voor een bestaande vergaderruimte aan te tonen:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

`doctor --oauth --meeting` en `resolve-space` tonen leestoegang aan tot een bestaande
ruimte waartoe het geautoriseerde Google-account toegang heeft. Een `403` van deze controles
betekent meestal dat de Google Meet REST API is uitgeschakeld, dat het toegestemde refresh-token
de vereiste scope mist, of dat het Google-account geen toegang heeft tot die Meet-
ruimte. Een refresh-tokenfout betekent dat je `openclaw googlemeet auth login
--json` opnieuw moet uitvoeren en het nieuwe `oauth`-blok moet opslaan.

Voor de browser-fallback zijn geen OAuth-referenties nodig. In die modus komt Google-
authenticatie uit het ingelogde Chrome-profiel op de geselecteerde Node, niet uit
OpenClaw-configuratie.

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

Toon vergaderartefacten en aanwezigheid nadat Meet conferentierecords heeft aangemaakt:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Met `--meeting` gebruiken `artifacts` en `attendance` standaard het nieuwste conferentierecord.
Geef `--all-conference-records` mee wanneer je elk bewaard record voor die vergadering wilt.

Calendar-opzoeking kan de vergader-URL uit Google Calendar oplossen voordat
Meet-artefacten worden gelezen:

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` doorzoekt de `primary`-agenda van vandaag naar een Calendar-gebeurtenis met een
Google Meet-link. Gebruik `--event <query>` om overeenkomende gebeurtenistekst te zoeken, en
`--calendar <id>` voor een niet-primaire agenda. Calendar-opzoeking vereist een nieuwe
OAuth-login die de alleen-lezen scope voor Calendar-gebeurtenissen bevat.
`calendar-events` toont een voorbeeld van de overeenkomende Meet-gebeurtenissen en markeert de gebeurtenis die
`latest`, `artifacts`, `attendance` of `export` zal kiezen.

Als je de id van het conferentierecord al weet, adresseer het dan rechtstreeks:

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
scope `meetings.space.created` voor een ruimte die het geautoriseerde account kan beheren.
OpenClaw accepteert een Meet-URL, vergadercode of `spaces/{id}` als invoer en lost die op
naar de API-ruimteresource voordat de actieve conferentie wordt beëindigd.
Dit staat los van `googlemeet leave`: `leave` stopt de lokale/sessie-
deelname van OpenClaw, terwijl `end-active-conference` Google Meet vraagt de actieve
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

`artifacts` retourneert metadata van het conferentierecord plus metadata van deelnemers,
opnames, transcripties, gestructureerde transcriptievermeldingen en smart-note-resources wanneer
Google die voor de vergadering beschikbaar maakt. Gebruik `--no-transcript-entries` om het
opzoeken van vermeldingen voor grote vergaderingen over te slaan. `attendance` breidt deelnemers uit naar
rijen met deelnemerssessies met eerste/laatste gezien-tijden, totale sessieduur,
te-laat-/vroeg-vertrek-vlaggen, en dubbele deelnemersresources samengevoegd op basis van ingelogde
gebruiker of weergavenaam. Geef `--no-merge-duplicates` mee om ruwe deelnemersresources
gescheiden te houden, `--late-after-minutes` om detectie van te laat komen af te stemmen, en
`--early-before-minutes` om detectie van vroeg vertrek af te stemmen.

`export` schrijft een map met `summary.md`, `attendance.csv`,
`transcript.md`, `artifacts.json`, `attendance.json` en `manifest.json`.
`manifest.json` registreert de gekozen invoer, exportopties, conferentierecords,
uitvoerbestanden, aantallen, tokenbron, Calendar-gebeurtenis wanneer die is gebruikt, en eventuele
waarschuwingen over gedeeltelijk ophalen. Geef `--zip` mee om ook een draagbaar archief naast
de map te schrijven. Geef `--include-doc-bodies` mee om gekoppelde transcriptie- en
smart-note-tekst uit Google Docs te exporteren via Google Drive `files.export`; dit vereist een
nieuwe OAuth-login die de alleen-lezen scope voor Drive Meet bevat. Zonder
`--include-doc-bodies` bevatten exports alleen Meet-metadata en gestructureerde transcriptie-
vermeldingen. Als Google een gedeeltelijke artefactfout retourneert, zoals een fout bij smart-note-
listing, transcriptievermelding of Drive-documentinhoud, behouden de samenvatting en
het manifest de waarschuwing in plaats van de hele export te laten mislukken.
Gebruik `--dry-run` om dezelfde artefact-/aanwezigheidsgegevens op te halen en de
manifest-JSON af te drukken zonder de map of ZIP te maken. Dat is nuttig voordat je
een grote export schrijft of wanneer een agent alleen aantallen, geselecteerde records en
waarschuwingen nodig heeft.

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

Stel `"dryRun": true` in om alleen het exportmanifest te retourneren en bestandswrites over te slaan.

Agents kunnen ook een door de API ondersteunde ruimte maken met een expliciet toegangsbeleid:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "realtime",
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

Voor luisteren-eerst-validatie moeten agents `test_listen` gebruiken voordat ze beweren dat de
vergadering nuttig is:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Voer de afgeschermde live-smoke uit tegen een echte bewaarde vergadering:

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

Voer de live browserprobe voor luisteren-eerst uit tegen een vergadering waarin iemand zal
spreken terwijl Meet-ondertiteling beschikbaar is:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

Live-smoke-omgeving:

- `OPENCLAW_LIVE_TEST=1` schakelt afgeschermde live-tests in.
- `OPENCLAW_GOOGLE_MEET_LIVE_MEETING` wijst naar een bewaarde Meet-URL, code of
  `spaces/{id}`.
- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` of `GOOGLE_MEET_CLIENT_ID` levert de OAuth-
  client-id.
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` of `GOOGLE_MEET_REFRESH_TOKEN` levert
  het refresh-token.
- Optioneel: `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`,
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` en
  `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` gebruiken dezelfde fallbacknamen
  zonder de prefix `OPENCLAW_`.

De live-smoke voor basisartefacten/aanwezigheid heeft
`https://www.googleapis.com/auth/meetings.space.readonly` en
`https://www.googleapis.com/auth/meetings.conference.media.readonly` nodig. Calendar-
opzoeking heeft `https://www.googleapis.com/auth/calendar.events.readonly` nodig. Export van
Drive-documentinhoud heeft
`https://www.googleapis.com/auth/drive.meet.readonly` nodig.

Maak een nieuwe Meet-ruimte:

```bash
openclaw googlemeet create
```

De opdracht drukt de nieuwe `meeting uri`, bron en deelnamesessie af. Met OAuth-
referenties gebruikt deze de officiële Google Meet API. Zonder OAuth-referenties gebruikt deze
het ingelogde browserprofiel van de vastgezette Chrome Node als fallback. Agents kunnen
de tool `google_meet` gebruiken met `action: "create"` om in één stap te maken en deel te nemen.
Voor aanmaken met alleen een URL geef je `"join": false` mee.

Voorbeeld-JSON-uitvoer van de browser-fallback:

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

Als de browser-fallback Google-login of een Meet-toestemmingsblokkade raakt voordat deze
de URL kan maken, retourneert de Gateway-methode een mislukte respons en retourneert de
tool `google_meet` gestructureerde details in plaats van een platte string:

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
`manualActionMessage` plus de browser-Node-/tabcontext rapporteren en stoppen met het openen van nieuwe
Meet-tabbladen totdat de operator de browserstap voltooit.

Voorbeeld-JSON-uitvoer van API-create:

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
browser-fallbackfout en vraagt het de operator om Google-login af te ronden voordat
opnieuw wordt geprobeerd.

Stel `preview.enrollmentAcknowledged: true` alleen in nadat je hebt bevestigd dat je Cloud-
project, OAuth-principal en vergaderdeelnemers zijn ingeschreven in het Google
Workspace Developer Preview Program voor Meet-media-API's.

## Configuratie

Het algemene Chrome-realtimepad heeft alleen de ingeschakelde Plugin, BlackHole, SoX
en een sleutel voor een backend realtime spraakprovider nodig. OpenAI is de standaard; stel
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

Standaardwaarden:

- `defaultTransport: "chrome"`
- `defaultMode: "realtime"`
- `chromeNode.node`: optionele node-id/naam/IP voor `chrome-node`
- `chrome.audioBackend: "blackhole-2ch"`
- `chrome.guestName: "OpenClaw Agent"`: naam die wordt gebruikt op het afgemelde Meet-gastscherm
- `chrome.autoJoin: true`: best-effort invullen van gastnaam en klikken op Nu deelnemen via OpenClaw-browserautomatisering op `chrome-node`
- `chrome.reuseExistingTab: true`: activeer een bestaand Meet-tabblad in plaats van duplicaten te openen
- `chrome.waitForInCallMs: 20000`: wacht tot het Meet-tabblad meldt dat het in gesprek is voordat de realtime-intro wordt geactiveerd
- `chrome.audioFormat: "pcm16-24khz"`: audioformaat voor commandoparen. Gebruik `"g711-ulaw-8khz"` alleen voor verouderde/aangepaste commandoparen die nog telefonie-audio uitzenden.
- `chrome.audioInputCommand`: SoX-opdracht die leest uit CoreAudio `BlackHole 2ch` en audio schrijft in `chrome.audioFormat`
- `chrome.audioOutputCommand`: SoX-opdracht die audio leest in `chrome.audioFormat` en schrijft naar CoreAudio `BlackHole 2ch`
- `chrome.bargeInInputCommand`: optionele lokale microfoonopdracht die signed 16-bit little-endian mono PCM schrijft voor detectie van menselijke onderbrekingen terwijl assistentweergave actief is. Dit geldt momenteel voor de door de Gateway gehoste `chrome`-commandopaarbridge.
- `chrome.bargeInRmsThreshold: 650`: RMS-niveau dat telt als een menselijke onderbreking op `chrome.bargeInInputCommand`
- `chrome.bargeInPeakThreshold: 2500`: piekniveau dat telt als een menselijke onderbreking op `chrome.bargeInInputCommand`
- `chrome.bargeInCooldownMs: 900`: minimale vertraging tussen herhaalde wisacties voor menselijke onderbrekingen
- `realtime.provider: "openai"`
- `realtime.toolPolicy: "safe-read-only"`
- `realtime.instructions`: korte gesproken antwoorden, met `openclaw_agent_consult` voor diepgaandere antwoorden
- `realtime.introMessage`: korte gesproken gereedheidscontrole wanneer de realtime-bridge verbinding maakt; stel dit in op `""` om stil deel te nemen
- `realtime.agentId`: optionele OpenClaw-agent-id voor `openclaw_agent_consult`; standaard `main`

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

`voiceCall.enabled` is standaard `true`; met Twilio-transport delegeert het de daadwerkelijke PSTN-oproep, DTMF en introbegroeting aan de Voice Call-Plugin. Voice Call speelt de DTMF-reeks af voordat de realtime-mediastream wordt geopend en gebruikt daarna de opgeslagen introtekst als de eerste realtime-begroeting. Als `voice-call` niet is ingeschakeld, kan Google Meet het belplan nog steeds valideren en vastleggen, maar kan het de Twilio-oproep niet plaatsen.

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

Gebruik `transport: "chrome"` wanneer Chrome op de Gateway-host draait. Gebruik `transport: "chrome-node"` wanneer Chrome draait op een gekoppelde node, zoals een Parallels-VM. In beide gevallen draaien het realtime-model en `openclaw_agent_consult` op de Gateway-host, zodat modelreferenties daar blijven.

Gebruik `action: "status"` om actieve sessies weer te geven of een sessie-id te inspecteren. Gebruik `action: "speak"` met `sessionId` en `message` om de realtime-agent onmiddellijk te laten spreken. Gebruik `action: "test_speech"` om de sessie te maken of opnieuw te gebruiken, een bekende zin te activeren en `inCall`-gezondheid terug te geven wanneer de Chrome-host dit kan rapporteren. `test_speech` forceert altijd `mode: "realtime"` en faalt als wordt gevraagd om in `mode: "transcribe"` te draaien, omdat observe-only sessies bewust geen spraak kunnen uitzenden. Het resultaat `speechOutputVerified` is gebaseerd op realtime-audio-uitvoerbytes die tijdens deze testoproep toenemen, zodat een hergebruikte sessie met oudere audio niet telt als een nieuwe succesvolle spraakcontrole. Gebruik `action: "leave"` om een sessie als beëindigd te markeren.

`status` bevat Chrome-gezondheid wanneer beschikbaar:

- `inCall`: Chrome lijkt zich in de Meet-oproep te bevinden
- `micMuted`: best-effort Meet-microfoonstatus
- `manualActionRequired` / `manualActionReason` / `manualActionMessage`: het browserprofiel heeft handmatige login, toelating door de Meet-host, machtigingen of herstel van browserbesturing nodig voordat spraak kan werken
- `speechReady` / `speechBlockedReason` / `speechBlockedMessage`: of beheerde Chrome-spraak nu is toegestaan. `speechReady: false` betekent dat OpenClaw de intro/testzin niet naar de audiobridge heeft gestuurd.
- `providerConnected` / `realtimeReady`: status van de realtime-spraakbridge
- `lastInputAt` / `lastOutputAt`: laatste audio gezien van of verzonden naar de bridge
- `lastSuppressedInputAt` / `suppressedInputBytes`: local loopback-invoer genegeerd terwijl assistentweergave actief is

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Say exactly: I'm here and listening."
}
```

## Realtime-agentconsult

Chrome-realtimemodus is geoptimaliseerd voor een live spraaklus. De realtime-spraakprovider hoort de vergaderaudio en spreekt via de geconfigureerde audiobridge. Wanneer het realtime-model diepgaander redeneren, actuele informatie of normale OpenClaw-tools nodig heeft, kan het `openclaw_agent_consult` aanroepen.

De consulttool draait de reguliere OpenClaw-agent achter de schermen met recente vergadertranscriptcontext en retourneert een beknopt gesproken antwoord aan de realtime-spraaksessie. Het spraakmodel kan dat antwoord vervolgens terug de vergadering in spreken. Het gebruikt dezelfde gedeelde realtime-consulttool als Voice Call.

Standaard worden consulten uitgevoerd tegen de `main`-agent. Stel `realtime.agentId` in wanneer een Meet-lane een toegewezen OpenClaw-agentwerkruimte, modelstandaarden, toolbeleid, geheugen en sessiegeschiedenis moet raadplegen.

`realtime.toolPolicy` beheert de consultuitvoering:

- `safe-read-only`: stel de consulttool beschikbaar en beperk de reguliere agent tot `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` en `memory_get`.
- `owner`: stel de consulttool beschikbaar en laat de reguliere agent het normale agenttoolbeleid gebruiken.
- `none`: stel de consulttool niet beschikbaar aan het realtime-spraakmodel.

De consultsessiesleutel is gescoped per Meet-sessie, zodat vervolgaanroepen voor consulten eerdere consultcontext tijdens dezelfde vergadering kunnen hergebruiken.

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

## Checklist voor live test

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
- `googlemeet setup` bevat `chrome-node-connected` wanneer Chrome-node het standaardtransport is of een node is vastgezet.
- `nodes status` toont dat de geselecteerde node verbonden is.
- De geselecteerde node adverteert zowel `googlemeet.chrome` als `browser.proxy`.
- Het Meet-tabblad neemt deel aan de oproep en `test-speech` retourneert Chrome-gezondheid met `inCall: true`.

Voor een externe Chrome-host zoals een Parallels macOS-VM is dit de kortste veilige controle na het bijwerken van de Gateway of de VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Dat bewijst dat de Gateway-Plugin is geladen, dat de VM-node verbonden is met het huidige token en dat de Meet-audiobridge beschikbaar is voordat een agent een echt vergadertabblad opent.

Gebruik voor een Twilio-smoke een vergadering die telefonische inbelgegevens beschikbaar stelt:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Verwachte Twilio-status:

- `googlemeet setup` bevat groene controles voor `twilio-voice-call-plugin`, `twilio-voice-call-credentials` en `twilio-voice-call-webhook`.
- `voicecall` is beschikbaar in de CLI na het herladen van de Gateway.
- De geretourneerde sessie heeft `transport: "twilio"` en een `twilio.voiceCallId`.
- `openclaw logs --follow` toont dat DTMF-TwiML wordt geserveerd vóór realtime-TwiML, gevolgd door een realtime-bridge met de eerste begroeting in de wachtrij.
- `googlemeet leave <sessionId>` beëindigt de gedelegeerde spraakoproep.

## Probleemoplossing

### Agent kan de Google Meet-tool niet zien

Bevestig dat de Plugin is ingeschakeld in de Gateway-configuratie en herlaad de Gateway:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Als je net `plugins.entries.google-meet` hebt bewerkt, herstart of herlaad dan de Gateway. De draaiende agent ziet alleen Plugin-tools die door het huidige Gateway-proces zijn geregistreerd.

Op niet-macOS Gateway-hosts blijft de agentgerichte `google_meet`-tool zichtbaar, maar lokale Chrome-realtimeacties worden geblokkeerd voordat ze de audiobridge bereiken. Lokale Chrome-realtimeaudio is momenteel afhankelijk van macOS `BlackHole 2ch`, dus Linux-agenten moeten `mode: "transcribe"`, Twilio-inbellen of een macOS-`chrome-node`-host gebruiken in plaats van het standaard lokale Chrome-realtimepad.

### Geen verbonden Google Meet-geschikte node

Voer op de node-host uit:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Keur op de Gateway-host de node goed en verifieer opdrachten:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

De node moet verbonden zijn en `googlemeet.chrome` plus `browser.proxy` tonen. De Gateway-configuratie moet die node-opdrachten toestaan:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Als `googlemeet setup` faalt op `chrome-node-connected` of het Gateway-log `gateway token mismatch` meldt, installeer of herstart de node dan opnieuw met het huidige Gateway-token. Voor een LAN-Gateway betekent dit meestal:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Herlaad daarna de node-service en voer opnieuw uit:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Browser opent maar agent kan niet deelnemen

Voer `googlemeet test-listen` uit voor observe-only deelnames of `googlemeet test-speech` voor realtime deelnames en inspecteer daarna de geretourneerde Chrome-gezondheid. Als een van beide probes `manualActionRequired: true` meldt, toon `manualActionMessage` aan de operator en stop met opnieuw proberen totdat de browseractie is voltooid.

Veelvoorkomende handmatige acties:

- Meld je aan bij het Chrome-profiel.
- Laat de gast toe vanuit het Meet-hostaccount.
- Verleen Chrome microfoon-/cameramachtigingen wanneer de native machtigingsprompt van Chrome verschijnt.
- Sluit of herstel een vastgelopen Meet-machtigingsdialoog.

Rapporteer niet "niet aangemeld" alleen omdat Meet "Wil je dat mensen je
horen in de vergadering?" toont. Dat is het audio-keuze-tussenscherm van Meet; OpenClaw
klikt via browserautomatisering op **Microfoon gebruiken** wanneer beschikbaar en blijft
wachten op de echte vergaderingsstatus. Voor create-only browserfallback kan OpenClaw
op **Doorgaan zonder microfoon** klikken, omdat het maken van de URL het
realtime audiopad niet nodig heeft.

### Vergadering maken mislukt

`googlemeet create` gebruikt eerst het Google Meet API-eindpunt `spaces.create`
wanneer OAuth-referenties zijn geconfigureerd. Zonder OAuth-referenties valt het terug
op de vastgepinde Chrome-nodebrowser. Controleer:

- Voor maken via API: `oauth.clientId` en `oauth.refreshToken` zijn geconfigureerd,
  of overeenkomende `OPENCLAW_GOOGLE_MEET_*`-omgevingsvariabelen zijn aanwezig.
- Voor maken via API: het refresh-token is aangemaakt nadat ondersteuning voor maken
  is toegevoegd. Oudere tokens missen mogelijk de scope `meetings.space.created`; voer
  `openclaw googlemeet auth login --json` opnieuw uit en werk de Plugin-configuratie bij.
- Voor browserfallback: `defaultTransport: "chrome-node"` en
  `chromeNode.node` wijzen naar een verbonden node met `browser.proxy` en
  `googlemeet.chrome`.
- Voor browserfallback: het OpenClaw Chrome-profiel op die node is aangemeld
  bij Google en kan `https://meet.google.com/new` openen.
- Voor browserfallback: nieuwe pogingen hergebruiken een bestaand tabblad
  `https://meet.google.com/new` of een Google-accountprompt voordat een nieuw tabblad
  wordt geopend. Als een agent een time-out krijgt, probeer de toolaanroep dan opnieuw
  in plaats van handmatig nog een Meet-tabblad te openen.
- Voor browserfallback: als de tool `manualActionRequired: true` retourneert, gebruik dan
  de geretourneerde `browser.nodeId`, `browser.targetId`, `browserUrl` en
  `manualActionMessage` om de operator te begeleiden. Probeer niet in een lus opnieuw
  voordat die actie is voltooid.
- Voor browserfallback: als Meet "Wil je dat mensen je horen in de
  vergadering?" toont, laat het tabblad open. OpenClaw moet via
  browserautomatisering op **Microfoon gebruiken** klikken of, voor
  create-only fallback, op **Doorgaan zonder microfoon**, en blijven wachten op de
  gegenereerde Meet-URL. Als dat niet lukt, moet de fout `meet-audio-choice-required`
  vermelden, niet `google-login-required`.

### Agent neemt deel maar praat niet

Controleer het realtime pad:

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Gebruik `mode: "realtime"` voor luisteren/terugpraten. `mode: "transcribe"` start
bewust niet de duplex realtime spraakbridge. Voor observe-only debugging,
voer `openclaw googlemeet status --json <session-id>` uit nadat deelnemers hebben gesproken
en controleer `captioning`, `transcriptLines` en `lastCaptionText`. Als `inCall`
true is maar `transcriptLines` op `0` blijft, zijn Meet-ondertitels mogelijk uitgeschakeld,
heeft niemand gesproken sinds de observer is geïnstalleerd, is de Meet-UI gewijzigd, of zijn live
ondertitels niet beschikbaar voor de vergadertaal/het account.

`googlemeet test-speech` controleert altijd het realtime pad en rapporteert of
bridge-uitvoerbytes zijn waargenomen voor die aanroep. Als `speechOutputVerified` false is en
`speechOutputTimedOut` true is, heeft de realtime provider de
uiting mogelijk geaccepteerd, maar heeft OpenClaw geen nieuwe uitvoerbytes de Chrome-audio
bridge zien bereiken.

Controleer ook:

- Een realtime providersleutel is beschikbaar op de Gateway-host, zoals
  `OPENAI_API_KEY` of `GEMINI_API_KEY`.
- `BlackHole 2ch` is zichtbaar op de Chrome-host.
- `sox` bestaat op de Chrome-host.
- Meet-microfoon en -speaker worden gerouteerd via het virtuele audiopad dat door
  OpenClaw wordt gebruikt.

`googlemeet doctor [session-id]` toont de sessie, node, in-call-status,
reden voor handmatige actie, realtime providerverbinding, `realtimeReady`, audio
input/output-activiteit, laatste audiotijdstempels, byte-tellers en browser-URL.
Gebruik `googlemeet status [session-id] --json` wanneer je de ruwe JSON nodig hebt. Gebruik
`googlemeet doctor --oauth` wanneer je Google Meet OAuth-refresh moet verifiëren
zonder tokens bloot te geven; voeg `--meeting` of `--create-space` toe wanneer je ook
Google Meet API-bewijs nodig hebt.

Als een agent een time-out kreeg en je ziet al een Meet-tabblad open, inspecteer dat tabblad
zonder er nog een te openen:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

De equivalente toolactie is `recover_current_tab`. Die focust en inspecteert een
bestaand Meet-tabblad voor de geselecteerde transport. Met `chrome` gebruikt die lokale
browserbesturing via de Gateway; met `chrome-node` gebruikt die de geconfigureerde
Chrome-node. Die opent geen nieuw tabblad en maakt geen nieuwe sessie; die rapporteert de
huidige blocker, zoals aanmelding, toelating, permissies of audio-keuzestatus.
De CLI-opdracht praat met de geconfigureerde Gateway, dus de Gateway moet draaien;
`chrome-node` vereist ook dat de Chrome-node verbonden is.

### Twilio setup-controles mislukken

`twilio-voice-call-plugin` mislukt wanneer `voice-call` niet is toegestaan of niet is ingeschakeld.
Voeg het toe aan `plugins.allow`, schakel `plugins.entries.voice-call` in en herlaad de
Gateway.

`twilio-voice-call-credentials` mislukt wanneer de Twilio-backend account
SID, auth-token of bellernummer mist. Stel deze in op de Gateway-host:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` mislukt wanneer `voice-call` geen publieke Webhook-
blootstelling heeft, of wanneer `publicUrl` naar loopback of private netwerkruimte wijst.
Stel `plugins.entries.voice-call.config.publicUrl` in op de publieke provider-URL of
configureer een `voice-call`-tunnel/Tailscale-blootstelling.

Loopback- en private URL's zijn niet geldig voor carrier-callbacks. Gebruik
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

Gebruik voor lokale ontwikkeling een tunnel of Tailscale-blootstelling in plaats van een private
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

`voicecall smoke` is standaard alleen een gereedheidscontrole. Voor een dry-run met een specifiek nummer:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Voeg `--yes` alleen toe wanneer je bewust een live uitgaande notificatieoproep
wilt plaatsen:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio-oproep start maar komt nooit in de vergadering

Controleer of de Meet-gebeurtenis telefooninbelgegevens beschikbaar stelt. Geef het exacte inbelnummer
en de PIN of een aangepaste DTMF-reeks door:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Gebruik een leidende `w` of komma's in `--dtmf-sequence` als de provider een pauze nodig heeft
voordat de PIN wordt ingevoerd.

Als de telefoonoproep is gemaakt maar de Meet-deelnemerslijst de inbeldeelnemer
nooit toont:

- Voer `openclaw googlemeet doctor <session-id>` uit om de gedelegeerde Twilio-
  oproep-ID te bevestigen, of DTMF in de wachtrij is gezet en of de introductiegroet is aangevraagd.
- Voer `openclaw voicecall status --call-id <id>` uit en bevestig dat de oproep nog
  actief is.
- Voer `openclaw voicecall tail` uit en controleer of Twilio-webhooks bij de
  Gateway aankomen.
- Voer `openclaw logs --follow` uit en zoek naar de Twilio Meet-reeks: Google
  Meet delegeert deelname, Voice Call start de telefoonleg, Google Meet wacht
  `voiceCall.dtmfDelayMs`, verzendt DTMF met `voicecall.dtmf`, wacht
  `voiceCall.postDtmfSpeechDelayMs` en vraagt daarna introductiespraak aan met
  `voicecall.speak`.
- Voer `openclaw googlemeet setup --transport twilio` opnieuw uit; een groene setupcontrole is
  vereist maar bewijst niet dat de vergadering-PIN-reeks correct is.
- Bevestig dat het inbelnummer hoort bij dezelfde Meet-uitnodiging en regio als
  de PIN.
- Verhoog `voiceCall.dtmfDelayMs` als Meet langzaam antwoordt of het oproeptranscript
  nog steeds de prompt toont die om een PIN vraagt nadat DTMF is verzonden.
- Als de deelnemer binnenkomt maar je de begroeting niet hoort, controleer dan
  `openclaw logs --follow` op de post-DTMF-aanvraag `voicecall.speak` en
  ofwel media-stream TTS-afspelen of de Twilio `<Say>`-fallback. Als het oproeptranscript
  nog steeds "voer de vergadering-PIN in" bevat, is de telefoonleg nog niet toegetreden
  tot de Meet-ruimte, dus zullen vergaderdeelnemers geen spraak horen.

Als webhooks niet aankomen, debug dan eerst de Voice Call Plugin: de provider moet
`plugins.entries.voice-call.config.publicUrl` of de geconfigureerde tunnel kunnen bereiken.
Zie [Probleemoplossing voor spraakoproepen](/nl/plugins/voice-call#troubleshooting).

## Opmerkingen

De officiële media-API van Google Meet is gericht op ontvangen, dus spreken in een Meet-
oproep heeft nog steeds een deelnemerspad nodig. Deze Plugin houdt die grens zichtbaar:
Chrome verwerkt browserdeelname en lokale audiorouting; Twilio verwerkt
deelname via telefonische inbelverbinding.

Chrome realtime-modus heeft `BlackHole 2ch` nodig plus een van deze opties:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw beheert de
  realtime modelbridge en pipet audio in `chrome.audioFormat` tussen die
  opdrachten en de geselecteerde realtime spraakprovider. Het standaard Chrome-pad is
  24 kHz PCM16; 8 kHz G.711 mu-law blijft beschikbaar voor legacy opdrachtparen.
- `chrome.audioBridgeCommand`: een externe bridgeopdracht beheert het volledige lokale
  audiopad en moet afsluiten na het starten of valideren van de daemon.

Voor schone duplexaudio routeer je Meet-uitvoer en Meet-microfoon via afzonderlijke
virtuele apparaten of een Loopback-achtige grafiek met virtuele apparaten. Een enkel gedeeld
BlackHole-apparaat kan andere deelnemers terug de oproep in echoën.

Met de Chrome-bridge met opdrachtenpaar kan `chrome.bargeInInputCommand` luisteren naar een
afzonderlijke lokale microfoon en assistant-afspelen wissen wanneer de mens begint
te praten. Dit houdt menselijke spraak vóór assistant-uitvoer, zelfs wanneer de gedeelde
BlackHole-loopbackinvoer tijdelijk wordt onderdrukt tijdens assistant-afspelen.
Net als `chrome.audioInputCommand` en `chrome.audioOutputCommand` is het een
door de operator geconfigureerde lokale opdracht. Gebruik een expliciet vertrouwd opdrachtpad of
argumentenlijst, en wijs het niet naar scripts vanaf niet-vertrouwde locaties.

`googlemeet speak` activeert de actieve realtime audiobridge voor een Chrome-
sessie. `googlemeet leave` stopt die bridge. Voor Twilio-sessies die
via de Voice Call Plugin zijn gedelegeerd, hangt `leave` ook de onderliggende spraakoproep op.
Gebruik `googlemeet end-active-conference` wanneer je ook de actieve
Google Meet-conferentie voor een API-beheerde space wilt sluiten.

## Gerelateerd

- [Voice Call Plugin](/nl/plugins/voice-call)
- [Praatmodus](/nl/nodes/talk)
- [Plugins bouwen](/nl/plugins/building-plugins)
