---
read_when:
    - Je wilt dat een OpenClaw-agent deelneemt aan een Google Meet-gesprek
    - Je wilt dat een OpenClaw-agent een nieuw Google Meet-gesprek aanmaakt
    - Je configureert Chrome, Chrome node of Twilio als transport voor Google Meet
summary: 'Google Meet-plugin: neem via Chrome of Twilio deel aan expliciete Meet-URL''s met standaardinstellingen waarmee de agent kan terugpraten'
title: Google Meet-plugin
x-i18n:
    generated_at: "2026-07-16T16:05:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5a3a0d2675bdfaeaa869652593fd1931c3afdefe0ed95f13935dade976ff038c
    source_path: plugins/google-meet.md
    workflow: 16
---

De Plugin `google-meet` neemt namens een OpenClaw-agent deel via expliciete Meet-URL's. De functionaliteit is bewust beperkt:

- De Plugin neemt alleen deel via `https://meet.google.com/...`-URL's; de Plugin belt nooit in bij een vergadering via een telefoonnummer dat deze zelf vindt.
- `googlemeet create` kan via de Google Meet API (of een browserfallback) een nieuwe Meet-URL genereren en neemt er standaard aan deel.
- Deelname via Chrome gebruikt een aangemeld Chrome-profiel, eventueel op een gekoppelde Node. Deelname via Twilio belt via de [Plugin voor spraakoproepen](/nl/plugins/voice-call) een telefoonnummer plus pincode/DTMF; hiermee kan niet rechtstreeks naar een Meet-URL worden gebeld.
- `mode: "agent"` (standaard) transcribeert spraak van deelnemers met een realtimeprovider, stuurt deze naar de geconfigureerde OpenClaw-agent en spreekt het antwoord uit met reguliere OpenClaw-TTS. Met `mode: "bidi"` kan een realtime spraakmodel rechtstreeks antwoorden. `mode: "transcribe"` neemt alleen als waarnemer deel, zonder terug te praten.
- Er wordt niet automatisch een toestemmingsmelding afgespeeld wanneer de Plugin aan een gesprek deelneemt.
- De CLI-opdracht is `googlemeet`; `meet` is gereserveerd voor bredere workflows voor telefonische vergaderingen met agents.

## Snel aan de slag

Installeer de lokale audioafhankelijkheden en stel vervolgens een sleutel voor een realtimeprovider in. OpenAI is de standaardprovider voor transcriptie in de modus `agent`; Google Gemini Live is beschikbaar als spraakprovider voor de modus `bidi`:

```bash
brew install blackhole-2ch sox
export OPENAI_API_KEY=sk-...
# alleen nodig wanneer realtime.voiceProvider voor de bidi-modus "google" is
export GEMINI_API_KEY=...
```

`blackhole-2ch` installeert het virtuele audioapparaat `BlackHole 2ch` waarlangs Chrome routeert. Het Homebrew-installatieprogramma vereist dat macOS opnieuw wordt opgestart voordat het apparaat beschikbaar is:

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

Controleer de installatie en neem vervolgens deel:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

De uitvoer van `setup` is leesbaar voor agents en houdt rekening met modus en transport: deze rapporteert het Chrome-profiel, de vastgezette Node en, voor realtime deelname via Chrome, de BlackHole/SoX-audiobrug en de controle voor de vertraagde introductie. Deelname alleen als waarnemer slaat realtimevereisten over:

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
```

Wanneer delegatie via Twilio is geconfigureerd, rapporteert `setup` ook of `voice-call`, Twilio-inloggegevens en openbare Webhook-beschikbaarheid gereed zijn. Beschouw elke `ok: false`-controle als een blokkade voor die combinatie van transport en modus voordat een agent deelneemt. Gebruik `--json` voor machineleesbare uitvoer en `--transport chrome|chrome-node|twilio` om een specifiek transport vooraf te controleren:

```bash
openclaw googlemeet setup --transport twilio
```

Of laat een agent deelnemen via de tool `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

Op Gateway-hosts zonder macOS blijft `google_meet` zichtbaar voor artefact-, agenda-, installatie-, transcriptie- en Twilio-acties en voor `chrome-node`-acties, maar lokaal terugpraten via Chrome (`transport: "chrome"` met `mode: "agent"` of `"bidi"`) wordt geblokkeerd voordat de audiobrug wordt bereikt, omdat dit pad momenteel afhankelijk is van `BlackHole 2ch` in macOS. Gebruik in plaats daarvan `mode: "transcribe"`, inbellen via Twilio of een macOS-host voor `chrome-node`.

### Een vergadering maken

```bash
openclaw googlemeet create --transport chrome-node --mode agent
openclaw googlemeet create --no-join
```

`create` heeft twee paden, die in het veld `source` van het resultaat worden vermeld:

- **`api`**: wordt gebruikt wanneer OAuth-inloggegevens voor Google Meet zijn geconfigureerd. Deterministisch; niet afhankelijk van de status van de browserinterface.
- **`browser`**: wordt gebruikt zonder OAuth-inloggegevens. OpenClaw opent `https://meet.google.com/new` op de vastgezette Chrome-Node en wacht tot Google omleidt naar een echte URL met een vergaderingscode; het OpenClaw-Chrome-profiel op die Node moet al bij Google zijn aangemeld. Zowel deelnemen als maken hergebruikt een bestaand Meet-tabblad (of een tabblad met een actieve `.../new`- of Google-accountprompt) voordat een nieuw tabblad wordt geopend; bij het vergelijken van tabbladen worden onschadelijke queryreeksen zoals `authuser` genegeerd.

`create` neemt standaard deel en retourneert `joined: true` plus de deelnamesessie. Geef `--no-join` (CLI) of `"join": false` (tool) door om alleen de URL te genereren.

Stel voor via de API gemaakte ruimten een expliciet toegangsbeleid in in plaats van de standaardinstelling van het Google-account over te nemen:

```bash
openclaw googlemeet create --access-type OPEN --transport chrome-node --mode agent
```

| `--access-type` | Wie zonder aankloppen kan deelnemen                                  |
| --------------- | ------------------------------------------------------------------- |
| `OPEN`          | Iedereen met de Meet-URL                                             |
| `TRUSTED`       | Vertrouwde gebruikers van de organisatie van de host, uitgenodigde externe gebruikers en inbellers |
| `RESTRICTED`    | Alleen genodigden                                                    |

Dit geldt alleen voor via de API gemaakte ruimten, dus OAuth moet zijn geconfigureerd. Als je je hebt geauthenticeerd voordat deze optie bestond, voer je `openclaw googlemeet auth login --json` opnieuw uit nadat je het bereik `meetings.space.settings` aan je OAuth-toestemmingsscherm hebt toegevoegd.

Als de browserfallback wordt geblokkeerd door een Google-aanmelding of een Meet-machtiging, retourneert de tool `manualActionRequired: true` met `manualActionReason`, `manualActionMessage` en de `browser.nodeId`/`browser.targetId`/`browserUrl`. Meld dat bericht en open geen nieuwe Meet-tabbladen totdat de operator de browserstap heeft voltooid.

### Alleen als waarnemer deelnemen

Stel `"mode": "transcribe"` in om de duplex-realtimebrug over te slaan (geen BlackHole/SoX vereist, niet terugpraten). Deelname via Chrome in de transcriptiemodus slaat ook de toekenning van microfoon-/cameramachtigingen door OpenClaw en het Meet-pad **Use microphone** over; als Meet het tussenscherm voor audiokeuze toont, probeert de automatisering eerst **Continue without microphone**. Beheerde Chrome-transporten installeren in deze modus zo goed mogelijk een waarnemer voor Meet-ondertiteling. `googlemeet status --json` en `googlemeet doctor` rapporteren `captioning`, `captionsEnabledAttempted`, `transcriptLines`, `lastCaptionAt`, `lastCaptionSpeaker`, `lastCaptionText` en een `recentTranscript`-staart.

Lees voor het begrensde sessietranscript exact het bijgehouden Meet-tabblad:

```bash
openclaw googlemeet transcript <session-id>
openclaw googlemeet transcript <session-id> --since <next-index> --json
```

De waarnemer bewaart maximaal 2,000 voltooide ondertitelregels op de Meet-pagina. Zichtbare voortschrijdende tekst blijft in de gezondheidsstaart van de status staan totdat de ondertitelregel is voltooid, zodat het opslaan van `nextIndex` een latere tekstuitbreiding niet kan overslaan; bij het verlaten worden zichtbare regels vóór de momentopname voltooid. `droppedLines` rapporteert regels die aan het begin verloren zijn gegaan wanneer de limiet wordt overschreden. De vier meest recent beëindigde sessietranscripten blijven leesbaar totdat de Gateway opnieuw wordt gestart. Oudere beëindigde transcripten retourneren `evicted: true`. Dit is bewust runtimegeheugen en geen duurzame opslag voor vergadergeschiedenis: door de Gateway opnieuw te starten, het tabblad vóór een momentopname te sluiten of de gedocumenteerde limieten te overschrijden, kunnen ondertitels verloren gaan.

Voor een ja/nee-luistertest:

```bash
openclaw googlemeet test-listen <meet-url> --transport chrome-node
```

Deze neemt deel in de transcriptiemodus, wacht op nieuwe beweging in ondertitels/transcript en retourneert `listenVerified`, `listenTimedOut`, velden voor handmatige acties en de huidige status van de ondertiteling.

### Status van de realtimesessie

Tijdens sessies waarin wordt teruggepraat, rapporteert de status `google_meet` de status van Chrome/de audiobrug: `inCall`, `manualActionRequired`, `providerConnected`, `realtimeReady`, `audioInputActive`, `audioOutputActive`, tijdstempels van de laatste invoer/uitvoer, bytetellers en de gesloten status van de brug. Beheerde Chrome-sessies spreken de introductie-/testzin alleen uit nadat de status `inCall: true` rapporteert; anders wordt `speechReady: false` gerapporteerd en wordt de spraakpoging geblokkeerd in plaats van stilzwijgend niets te doen.

Lokale deelname via Chrome gebruikt het aangemelde OpenClaw-browserprofiel en vereist `BlackHole 2ch` voor het microfoon-/luidsprekerpad. Eén BlackHole-apparaat is voldoende voor een eerste rooktest, maar kan echo veroorzaken; gebruik afzonderlijke virtuele apparaten of een Loopback-achtige graaf voor zuivere duplexaudio.

## Lokale Gateway + Chrome in Parallels

Een volledige Gateway of API-sleutel voor een model is niet vereist in een macOS-VM wanneer deze alleen Chrome beschikbaar hoeft te stellen. Voer de Gateway en agent lokaal uit; voer een Node-host uit in de VM.

| Wordt uitgevoerd op  | Wat                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| Gateway-host         | OpenClaw Gateway, agentwerkruimte, model-/API-sleutels, realtimeprovider, configuratie van de Google Meet-Plugin |
| Parallels-macOS-VM   | OpenClaw CLI/Node-host, Chrome, SoX, BlackHole 2ch, een bij Google aangemeld Chrome-profiel     |
| Niet nodig in de VM  | Gateway-service, agentconfiguratie, configuratie van modelprovider                              |

Installeer de VM-afhankelijkheden, start opnieuw op en controleer:

```bash
brew install blackhole-2ch sox
sudo reboot
system_profiler SPAudioDataType | grep -i BlackHole
command -v sox
```

Schakel de Plugin in de VM in en start de Node-host:

```bash
openclaw plugins enable google-meet
openclaw node run --host <gateway-host> --port 18789 --display-name parallels-macos
```

Als `<gateway-host>` een LAN-IP zonder TLS is, sta dit dan toe voor dat vertrouwde privénetwerk:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Gebruik dezelfde vlag bij de installatie als LaunchAgent (het is een procesomgevingsvariabele die, wanneer deze aanwezig is in de installatieopdracht, in de LaunchAgent-omgeving wordt opgeslagen; het is geen instelling voor `openclaw.json`):

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install --host <gateway-lan-ip> --port 18789 --display-name parallels-macos --force
openclaw node restart
```

Keur de Node goed vanaf de Gateway-host en controleer vervolgens of deze zowel `googlemeet.chrome` als browserfunctionaliteit/`browser.proxy` aanbiedt:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

Routeer Meet via die Node:

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

Neem nu op de gebruikelijke manier deel vanaf de Gateway-host:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij
```

Voor een rooktest met één opdracht die een sessie maakt of hergebruikt, een bekende zin uitspreekt en de sessiestatus afdrukt:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij
```

Tijdens realtime deelname vult de browserautomatisering de gastnaam in, klikt op Join/Ask to join en accepteert de prompt "Use microphone" van Meet bij het eerste gebruik wanneer deze verschijnt (of "Continue without microphone" bij deelname alleen als waarnemer en het uitsluitend via de browser maken van vergaderingen). Als het profiel is afgemeld, Meet wacht op toelating door de host, Chrome microfoon-/cameramachtiging nodig heeft of Meet vastzit op een onopgeloste prompt, rapporteert het resultaat `manualActionRequired: true` met `manualActionReason` en `manualActionMessage`. Stop met opnieuw proberen, meld dat bericht plus `browserUrl`/`browserTitle` en probeer het pas opnieuw nadat de handmatige actie is voltooid.

Als `chromeNode.node` wordt weggelaten, selecteert OpenClaw alleen automatisch wanneer precies één verbonden Node zowel `googlemeet.chrome` als browserbesturing aanbiedt; zet `chromeNode.node` vast (Node-id, weergavenaam of extern IP-adres) wanneer meerdere geschikte Nodes zijn verbonden.

### Controles bij veelvoorkomende fouten

| Symptoom                                                  | Oplossing                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Configured Google Meet node ... is not usable: offline` | De vastgezette Node is bekend, maar niet beschikbaar. Meld de blokkade in de configuratie; val niet stilzwijgend terug op een ander transport, tenzij daarom wordt gevraagd.                                                                                                                                    |
| `No connected Google Meet-capable node`                  | Voer `openclaw node run` uit in de VM, keur de koppeling goed en voer daar `openclaw plugins enable google-meet` en `openclaw plugins enable browser` uit. Controleer of `gateway.nodes.allowCommands` `googlemeet.chrome` en `browser.proxy` bevat.                              |
| `BlackHole 2ch audio device not found`                   | Installeer `blackhole-2ch` op de host die wordt gecontroleerd en start deze opnieuw op.                                                                                                                                                                                                       |
| `BlackHole 2ch audio device not found on the node`       | Installeer `blackhole-2ch` in de VM en start de VM opnieuw op.                                                                                                                                                                                                                |
| Chrome wordt geopend, maar kan niet deelnemen                             | Meld je aan bij het browserprofiel in de VM of laat `chrome.guestName` ingesteld. Automatisch deelnemen als gast gebruikt OpenClaw-browserautomatisering via de browserproxy van de Node; richt `browser.defaultProfile` van de Node (of een benoemd profiel met een bestaande sessie) op het gewenste profiel. |
| Dubbele Meet-tabbladen                                      | Laat `chrome.reuseExistingTab: true` staan. OpenClaw activeert een bestaand tabblad voor dezelfde URL en hergebruikt tijdens het maken eerst een lopend `.../new`-tabblad of een tabblad met een Google-accountprompt, voordat een ander tabblad wordt geopend.                                                                      |
| Geen audio                                                 | Leid de microfoon/luidspreker van Meet via het virtuele audiopad dat OpenClaw gebruikt; gebruik afzonderlijke virtuele apparaten of routering zoals Loopback voor heldere duplexaudio.                                                                                                              |

## Installatieopmerkingen

De standaardconfiguratie voor terugspreken via Chrome gebruikt twee externe hulpprogramma's die OpenClaw niet bundelt of herdistribueert; installeer ze als hostafhankelijkheden via Homebrew:

- `sox`: audiohulpprogramma voor de opdrachtregel. De Plugin geeft expliciete CoreAudio-apparaatopdrachten voor de standaard PCM16-audiobrug van 24 kHz.
- `blackhole-2ch`: virtueel audiostuurprogramma voor macOS dat het `BlackHole 2ch`-apparaat levert waar Chrome/Meet via wordt gerouteerd.

SoX heeft de licentie `LGPL-2.0-only AND GPL-2.0-only`; BlackHole heeft de GPL-3.0-licentie. Als je een installatieprogramma of apparaat bouwt dat BlackHole met OpenClaw bundelt, controleer dan de upstreamlicentie van BlackHole of verkrijg een afzonderlijke licentie van Existential Audio.

## Transporten

| Transport     | Gebruiken wanneer                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `chrome`      | Chrome/audio actief zijn op de Gateway-host                                                        |
| `chrome-node` | Chrome/audio actief zijn op een gekoppelde Node (bijvoorbeeld een Parallels-VM met macOS)                        |
| `twilio`      | Terugval op telefonisch inbellen via de Voice Call-Plugin, wanneer deelname via Chrome niet beschikbaar is |

### Chrome

Opent de Meet-URL via OpenClaw-browserbesturing en neemt deel als het aangemelde OpenClaw-browserprofiel. Op macOS controleert de Plugin vóór het starten op `BlackHole 2ch` en voert deze, indien geconfigureerd, een opdracht voor statuscontrole/het starten van de audiobrug uit voordat Chrome wordt geopend. Kies voor lokale Chrome het profiel met `browser.defaultProfile`; `chrome.browserProfile` wordt in plaats daarvan doorgegeven aan `chrome-node`-hosts.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome
openclaw googlemeet join https://meet.google.com/abc-defg-hij --transport chrome-node
```

Audio van de microfoon/luidspreker van Chrome wordt via de lokale OpenClaw-audiobrug geleid. Als `BlackHole 2ch` niet is geïnstalleerd, mislukt het deelnemen met een configuratiefout in plaats van zonder audiopad deel te nemen.

### Twilio

Een strikt belplan dat is gedelegeerd aan de [Voice Call-Plugin](/nl/plugins/voice-call). Meet-pagina's worden niet geparseerd op telefoonnummers; Google Meet moet een telefoonnummer en pincode voor telefonisch inbellen voor de vergadering beschikbaar stellen.

Schakel Voice Call in op de Gateway-host, niet op de Chrome-Node:

```json5
{
  plugins: {
    allow: ["google-meet", "voice-call", "google"],
    entries: {
      "google-meet": {
        enabled: true,
        config: {
          defaultTransport: "chrome-node",
          // of stel "twilio" in als Twilio de standaard moet zijn
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
            instructions: "Neem als OpenClaw-agent deel aan deze Google Meet. Houd het kort.",
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

Geef Twilio-inloggegevens via de omgeving door om geheimen buiten `openclaw.json` te houden:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
export GEMINI_API_KEY=...
```

Gebruik in plaats daarvan `realtime.provider: "openai"` met `OPENAI_API_KEY` als OpenAI de realtime spraakprovider is.

Start de Gateway opnieuw of laad deze opnieuw nadat `voice-call` is ingeschakeld; wijzigingen in de Plugin-configuratie worden pas na opnieuw laden van kracht. Controleer:

```bash
openclaw config validate
openclaw plugins list | grep -E 'google-meet|voice-call'
openclaw googlemeet setup
```

Wanneer Twilio-delegatie is aangesloten, bevat `googlemeet setup` controles voor `twilio-voice-call-plugin`, `twilio-voice-call-credentials` en `twilio-voice-call-webhook`.

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Gebruik `--dtmf-sequence` voor een aangepaste reeks, met voorafgaande `w` of komma's voor een pauze vóór de pincode:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

## OAuth en voorbereidende controle

OAuth is optioneel voor het maken van een Meet-link, omdat `googlemeet create` kan terugvallen op browserautomatisering. Configureer OAuth voor het maken via de officiële API, het omzetten naar een ruimte of de voorbereidende controle van de Meet Media API. Deelnemen via Chrome/Chrome-Node is nooit afhankelijk van OAuth; hiervoor worden hoe dan ook een aangemeld Chrome-profiel, BlackHole/SoX en (voor `chrome-node`) een verbonden Node gebruikt.

### Google-inloggegevens maken

In Google Cloud Console:

<Steps>
<Step title="Een project maken of selecteren">
</Step>
<Step title="De Google Meet REST API inschakelen">
</Step>
<Step title="Het OAuth-toestemmingsscherm configureren">
Internal is het eenvoudigst voor een Google Workspace-organisatie. External werkt voor persoonlijke/testconfiguraties; voeg, zolang de app de status Testing heeft, elk Google-account dat de app zal autoriseren toe als testgebruiker.
</Step>
<Step title="De gevraagde bereiken toevoegen">
- `https://www.googleapis.com/auth/meetings.space.created`
- `https://www.googleapis.com/auth/meetings.space.readonly`
- `https://www.googleapis.com/auth/meetings.space.settings`
- `https://www.googleapis.com/auth/meetings.conference.media.readonly`
- `https://www.googleapis.com/auth/calendar.events.readonly` (agenda opzoeken)
- `https://www.googleapis.com/auth/drive.meet.readonly` (export van de documenttekst van transcript/slimme notitie)

</Step>
<Step title="Een OAuth-client-ID maken">
Applicatietype **Web application**. Geautoriseerde omleidings-URI:

```text
http://localhost:8085/oauth2callback
```

</Step>
<Step title="De client-ID en het clientgeheim kopiëren">
</Step>
</Steps>

`meetings.space.created` is vereist door `spaces.create`. `meetings.space.readonly` zet Meet-URL's/-codes om naar ruimten. Met `meetings.space.settings` kan OpenClaw `SpaceConfig`-instellingen zoals `accessType` doorgeven tijdens het maken van een ruimte via de API. `meetings.conference.media.readonly` is bedoeld voor de voorbereidende controle van de Meet Media API en mediawerk; Google kan inschrijving voor Developer Preview vereisen voor daadwerkelijk gebruik van de Media API. `calendar.events.readonly` is alleen nodig voor het opzoeken in de agenda via `--today`/`--event`. `drive.meet.readonly` is alleen nodig voor de export via `--include-doc-bodies`. Als je alleen via de browser aan Chrome-sessies wilt deelnemen, kun je OAuth volledig overslaan.

### Het vernieuwingstoken genereren

Configureer `oauth.clientId` en optioneel `oauth.clientSecret` (of geef ze door als omgevingsvariabelen) en voer vervolgens het volgende uit:

```bash
openclaw googlemeet auth login --json
```

Dit voert een PKCE-stroom uit met een localhost-callback op `http://localhost:8085/oauth2callback` en drukt een `oauth`-configuratieblok met een vernieuwingstoken af. Voeg `--manual` toe voor een kopieer-en-plakstroom wanneer de browser de lokale callback niet kan bereiken:

```bash
OPENCLAW_GOOGLE_MEET_CLIENT_ID="your-client-id" \
OPENCLAW_GOOGLE_MEET_CLIENT_SECRET="your-client-secret" \
openclaw googlemeet auth login --json --manual
```

JSON-uitvoer:

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

Sla het `oauth`-object op onder de Plugin-configuratie:

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

Gebruik bij voorkeur omgevingsvariabelen als je het vernieuwingstoken niet in de configuratie wilt opnemen; eerst wordt de configuratie verwerkt en daarna de omgeving als terugval. Als je je hebt geverifieerd voordat ondersteuning bestond voor het maken van vergaderingen, het opzoeken in de agenda of het exporteren van documenttekst, voer `openclaw googlemeet auth login --json` dan opnieuw uit zodat het vernieuwingstoken de huidige verzameling bereiken dekt.

### OAuth controleren met doctor

```bash
openclaw googlemeet doctor --oauth --json
```

Dit controleert of de OAuth-configuratie bestaat en of het vernieuwingstoken een toegangstoken kan genereren, zonder de Chrome-runtime te laden of een verbonden Node te vereisen. Het rapport bevat alleen statusvelden (`ok`, `configured`, `tokenSource`, `expiresAt`, controlemeldingen) en drukt nooit het toegangstoken, vernieuwingstoken of clientgeheim af.

| Controle                | Betekenis                                                                          |
| -------------------- | -------------------------------------------------------------------------------- |
| `oauth-config`       | `oauth.clientId` plus `oauth.refreshToken`, of een toegangstoken in de cache, is aanwezig |
| `oauth-token`        | Het toegangstoken in de cache is nog geldig of het vernieuwingstoken heeft een nieuw token gegenereerd    |
| `meet-spaces-get`    | De optionele controle van `--meeting` heeft een bestaande Meet-ruimte gevonden                       |
| `meet-spaces-create` | De optionele controle van `--create-space` heeft een nieuwe Meet-ruimte gemaakt                         |

Bewijs dat de Meet API is ingeschakeld en dat het bereik `spaces.create` beschikbaar is met de aanmaakcontrole die bijwerkingen heeft:

```bash
openclaw googlemeet doctor --oauth --create-space --json
```

Bewijs leestoegang tot een bestaande ruimte:

```bash
openclaw googlemeet doctor --oauth --meeting https://meet.google.com/abc-defg-hij --json
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
```

Een `403` bij deze controles betekent meestal dat de Meet REST API is uitgeschakeld, dat het vereiste bereik ontbreekt in het vernieuwingstoken of dat het Google-account geen toegang heeft tot die ruimte. Een fout met het vernieuwingstoken betekent dat je `openclaw googlemeet auth login --json` opnieuw moet uitvoeren en het nieuwe `oauth`-blok moet opslaan.

Voor de browserterugval is geen OAuth nodig; Google-verificatie is daar afkomstig van het aangemelde Chrome-profiel op de geselecteerde Node, niet van de OpenClaw-configuratie.

Deze omgevingsvariabelen worden als terugvalopties geaccepteerd:

- `OPENCLAW_GOOGLE_MEET_CLIENT_ID` of `GOOGLE_MEET_CLIENT_ID`
- `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET` of `GOOGLE_MEET_CLIENT_SECRET`
- `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` of `GOOGLE_MEET_REFRESH_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN` of `GOOGLE_MEET_ACCESS_TOKEN`
- `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` of `GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT`
- `OPENCLAW_GOOGLE_MEET_DEFAULT_MEETING` of `GOOGLE_MEET_DEFAULT_MEETING`
- `OPENCLAW_GOOGLE_MEET_PREVIEW_ACK` of `GOOGLE_MEET_PREVIEW_ACK`

### Artefacten herleiden, vooraf controleren en lezen

```bash
openclaw googlemeet resolve-space --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet preflight --meeting https://meet.google.com/abc-defg-hij
```

Nadat Meet conferentierecords heeft aangemaakt:

```bash
openclaw googlemeet artifacts --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet attendance --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet export --meeting https://meet.google.com/abc-defg-hij --output ./meet-export
```

Met `--meeting` gebruiken `artifacts` en `attendance` standaard het nieuwste conferentierecord; geef `--all-conference-records` door voor elk bewaard record.

Bij het opzoeken in de agenda wordt de vergader-URL vanuit Google Calendar herleid voordat artefacten worden gelezen (hiervoor is een vernieuwingstoken vereist met het alleen-lezenbereik voor Calendar-gebeurtenissen):

```bash
openclaw googlemeet latest --today
openclaw googlemeet calendar-events --today --json
openclaw googlemeet artifacts --event "Weekly sync"
openclaw googlemeet attendance --today --format csv --output attendance.csv
```

`--today` doorzoekt de `primary`-agenda van vandaag naar een gebeurtenis met een Meet-link; `--event <query>` zoekt naar overeenkomende gebeurtenistekst; `--calendar <id>` richt zich op een niet-primaire agenda. `calendar-events` toont een voorbeeld van overeenkomende gebeurtenissen en markeert welke `latest`/`artifacts`/`attendance`/`export` zal kiezen.

Als je de id van het conferentierecord al kent, kun je het rechtstreeks adresseren:

```bash
openclaw googlemeet latest --meeting https://meet.google.com/abc-defg-hij
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 --json
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 --json
```

Sluit de ruimte voor een via de API aangemaakte ruimte:

```bash
openclaw googlemeet end-active-conference https://meet.google.com/abc-defg-hij
```

Roept `spaces.endActiveConference` aan en vereist OAuth met het bereik `meetings.space.created` voor een ruimte die het geautoriseerde account kan beheren. Accepteert een Meet-URL, vergadercode of `spaces/{id}` en herleidt deze eerst tot de API-ruimtebron. Dit staat los van `googlemeet leave`: `leave` stopt de lokale/sessiedeelname van OpenClaw; `end-active-conference` vraagt Google Meet de actieve conferentie voor de ruimte te beëindigen.

Schrijf een leesbaar rapport:

```bash
openclaw googlemeet artifacts --conference-record conferenceRecords/abc123 \
  --format markdown --output meet-artifacts.md
openclaw googlemeet attendance --conference-record conferenceRecords/abc123 \
  --format csv --output meet-attendance.csv
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --zip --output meet-export
openclaw googlemeet export --conference-record conferenceRecords/abc123 \
  --include-doc-bodies --dry-run
```

`artifacts` retourneert metadata van conferentierecords plus bronmetadata voor deelnemers, opnamen, transcripties, gestructureerde transcriptvermeldingen en slimme notities wanneer Google deze beschikbaar stelt. `--no-transcript-entries` slaat het opzoeken van vermeldingen over voor grote vergaderingen. `attendance` breidt deelnemers uit naar deelnemerssessierijen met tijdstippen waarop ze voor het eerst en laatst zijn gezien, de totale sessieduur, markeringen voor te laat komen/vroeg vertrekken en dubbele deelnemersbronnen die zijn samengevoegd op basis van de aangemelde gebruiker of weergavenaam; `--no-merge-duplicates` houdt onbewerkte bronnen gescheiden, `--late-after-minutes`/`--early-before-minutes` passen de drempelwaarden aan.

`export` schrijft een map met `summary.md`, `attendance.csv`, `transcript.md`, `artifacts.json`, `attendance.json` en `manifest.json`. `manifest.json` registreert de gekozen invoer, exportopties, conferentierecords, uitvoerbestanden, aantallen, tokenbron, eventueel gebruikte Calendar-gebeurtenissen en waarschuwingen voor gedeeltelijk ophalen. `--zip` schrijft ook een overdraagbaar archief naast de map. `--include-doc-bodies` exporteert de tekst van gekoppelde Google Docs met transcripties/slimme notities via Drive `files.export` (vereist het alleen-lezenbereik van Drive voor Meet); zonder dit bereik bevatten exports alleen Meet-metadata en gestructureerde transcriptvermeldingen. Bij een gedeeltelijke artefactfout (fout bij het weergeven van slimme notities, transcriptvermeldingen of documentinhoud) blijft de waarschuwing in de samenvatting/het manifest staan in plaats van dat de hele export mislukt. `--dry-run` haalt dezelfde gegevens op en drukt de manifest-JSON af zonder de map of het ZIP-bestand aan te maken.

Agents gebruiken dezelfde acties via de tool `google_meet` (`export`, `create` met `accessType`, `end_active_conference`, `test_listen`); zie [Tool](#tool).

### Live-rooktest

```bash
OPENCLAW_LIVE_TEST=1 \
OPENCLAW_GOOGLE_MEET_LIVE_MEETING=https://meet.google.com/abc-defg-hij \
pnpm test:live -- extensions/google-meet/google-meet.live.test.ts
```

```bash
openclaw googlemeet setup --transport chrome-node --mode transcribe
openclaw googlemeet test-listen https://meet.google.com/abc-defg-hij --transport chrome-node --timeout-ms 30000
```

| Variabele                                                                                                                 | Doel                                                                   |
| ------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `OPENCLAW_LIVE_TEST=1`                                                                                                    | Schakelt afgeschermde live-tests in                                    |
| `OPENCLAW_GOOGLE_MEET_LIVE_MEETING`                                                                                       | Bewaarde Meet-URL, code of `spaces/{id}`                               |
| `OPENCLAW_GOOGLE_MEET_CLIENT_ID` / `GOOGLE_MEET_CLIENT_ID`                                                                | OAuth-client-id                                                        |
| `OPENCLAW_GOOGLE_MEET_REFRESH_TOKEN` / `GOOGLE_MEET_REFRESH_TOKEN`                                                        | Vernieuwingstoken                                                      |
| `OPENCLAW_GOOGLE_MEET_CLIENT_SECRET`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN`, `OPENCLAW_GOOGLE_MEET_ACCESS_TOKEN_EXPIRES_AT` | Optioneel; dezelfde terugvalnamen zonder het voorvoegsel `OPENCLAW_` werken ook |

De basisrooktest voor artefacten/aanwezigheid vereist `meetings.space.readonly` en `meetings.conference.media.readonly`. Opzoeken in de agenda vereist `calendar.events.readonly`. Voor het exporteren van documentinhoud uit Drive is `drive.meet.readonly` vereist.

### Aanmaakvoorbeelden

```bash
openclaw googlemeet create
```

Drukt de nieuwe vergader-URI, bron en deelnamesessie af. Met OAuth gebruikt dit de Meet API; zonder OAuth het aangemelde profiel van de vastgezette Chrome-Node. JSON van de browserterugval:

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

Als de browserterugval eerst op de Google-aanmelding of een blokkering van Meet-machtigingen stuit, retourneert `google_meet` gestructureerde details in plaats van een gewone tekenreeks:

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

JSON bij aanmaken via de API:

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

Bij het aanmaken wordt standaard deelgenomen, maar Chrome/Chrome-Node heeft nog steeds een aangemeld Google-profiel nodig om via de browser deel te nemen; als het profiel is afgemeld, meldt OpenClaw `manualActionRequired: true` of een browserterugvalfout en wordt de beheerder gevraagd de Google-aanmelding te voltooien voordat die het opnieuw probeert.

Stel `preview.enrollmentAcknowledged: true` pas in nadat je hebt bevestigd dat je Cloud-project, OAuth-principal en vergaderdeelnemers zijn ingeschreven voor het Google Workspace Developer Preview Program voor Meet-media-API's.

## Configuratie

Voor het algemene Chrome-Agent-pad hoeven alleen de Plugin, BlackHole en SoX te zijn ingeschakeld en moeten een sleutel voor een realtimeprovider en een OpenClaw TTS-provider zijn geconfigureerd:

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

### Standaardwaarden

| Sleutel                           | Standaard                                | Opmerkingen                                                                                                                                                                                                       |
| --------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defaultTransport`                | `"chrome"`                               |                                                                                                                                                                                                                   |
| `defaultMode`                     | `"agent"`                                | `"realtime"` wordt geaccepteerd als verouderde alias voor `"agent"`; nieuwe aanroepers moeten `"agent"` gebruiken                                                                                                                        |
| `chromeNode.node`                 | niet ingesteld                          | Node-id/-naam/-IP voor `chrome-node`; vereist wanneer meer dan één geschikte Node verbonden kan zijn                                                                                                                      |
| `chrome.launch`                   | `true`                                   | Start Chrome om deel te nemen; stel `false` alleen in wanneer je een reeds geopende sessie hergebruikt                                                                                                                                 |
| `chrome.audioBackend`             | `"blackhole-2ch"`                        |                                                                                                                                                                                                                   |
| `chrome.guestName`                | `"OpenClaw Agent"`                       | Wordt weergegeven op het Meet-gastscherm wanneer je niet bent ingelogd                                                                                                                                                                         |
| `chrome.autoJoin`                 | `true`                                   | Best-effort invullen van de gastnaam en klikken op Join Now voor `chrome-node`                                                                                                                                                   |
| `chrome.reuseExistingTab`         | `true`                                   | Activeert een bestaand Meet-tabblad in plaats van duplicaten te openen                                                                                                                                                      |
| `chrome.waitForInCallMs`          | `20000`                                  | Wacht tot het Meet-tabblad meldt dat het gesprek actief is voordat de terugspreekintro wordt gestart                                                                                                                                          |
| `chrome.audioFormat`              | `"pcm16-24khz"`                          | Audio-indeling voor opdrachtparen; `"g711-ulaw-8khz"` is alleen bedoeld voor verouderde/aangepaste opdrachtparen die telefonieaudio uitvoeren                                                                                                   |
| `chrome.audioBufferBytes`         | `4096`                                   | SoX-verwerkingsbuffer voor gegenereerde audio-opdrachten van opdrachtparen (de helft van SoX' standaardbuffer van 8192 bytes, waardoor de pijplijnlatentie afneemt); waarden worden begrensd op minimaal 17 bytes                                         |
| `chrome.audioInputCommand`        | gegenereerde SoX-opdracht                | Leest van CoreAudio `BlackHole 2ch` en schrijft audio in `chrome.audioFormat`                                                                                                                                        |
| `chrome.audioOutputCommand`       | gegenereerde SoX-opdracht                | Leest audio in `chrome.audioFormat` en schrijft naar CoreAudio `BlackHole 2ch`                                                                                                                                          |
| `chrome.bargeInInputCommand`      | niet ingesteld                          | Optionele lokale microfoonopdracht die ondertekende 16-bits little-endian mono-PCM schrijft voor detectie van menselijke onderbrekingen tijdens het afspelen van de assistent; van toepassing op de door de Gateway gehoste opdrachtpaarbridge                          |
| `chrome.bargeInRmsThreshold`      | `650`                                    | RMS-niveau dat als menselijke onderbreking wordt beschouwd                                                                                                                                                                           |
| `chrome.bargeInPeakThreshold`     | `2500`                                   | Piekniveau dat als menselijke onderbreking wordt beschouwd                                                                                                                                                                          |
| `chrome.bargeInCooldownMs`        | `900`                                    | Minimale vertraging tussen herhaalde wisacties voor onderbrekingen                                                                                                                                                                |
| `mode` (per verzoek)              | `"agent"`                                | Terugspreekmodus; zie de tabel [Agent- en bidi-modi](#agent-and-bidi-modes)                                                                                                                                       |
| `realtime.provider`               | `"openai"`                               | Compatibiliteitsterugval die wordt gebruikt wanneer de onderstaande velden binnen het bereik niet zijn ingesteld                                                                                                                                                |
| `realtime.transcriptionProvider`  | `"openai"`                               | Provider-id die door de modus `agent` wordt gebruikt voor realtime transcriptie                                                                                                                                                       |
| `realtime.voiceProvider`          | niet ingesteld                          | Provider-id die door de modus `bidi` wordt gebruikt voor directe realtime spraak; stel in op `"google"` voor Gemini Live terwijl transcriptie in agentmodus OpenAI blijft gebruiken. Combineer met `realtime.model` om het specifieke Gemini Live-model te kiezen. |
| `realtime.toolPolicy`             | `"safe-read-only"`                       | Zie [Agent- en bidi-modi](#agent-and-bidi-modes)                                                                                                                                                                 |
| `realtime.instructions`           | korte instructies voor gesproken antwoorden | Instrueert het model om kort te spreken en `openclaw_agent_consult` te gebruiken voor uitgebreidere antwoorden                                                                                                                              |
| `realtime.introMessage`           | `"Say exactly: I'm here and listening."` | Wordt eenmaal uitgesproken wanneer de realtime bridge verbinding maakt; stel in op `""` om geruisloos deel te nemen                                                                                                                                       |
| `realtime.agentId`                | `"main"`                                 | OpenClaw-agent-id die wordt gebruikt voor `openclaw_agent_consult`                                                                                                                                                               |
| `voiceCall.enabled`               | `true`                                   | Delegeert de Twilio PSTN-oproep, DTMF en introductiebegroeting aan de Voice Call-plugin                                                                                                                                 |
| `voiceCall.dtmfDelayMs`           | `12000`                                  | Wachttijd voorafgaand aan het afspelen van een van een pincode afgeleide DTMF-reeks via Twilio                                                                                                                                               |
| `voiceCall.postDtmfSpeechDelayMs` | `5000`                                   | Vertraging voordat de realtime introductiebegroeting wordt aangevraagd nadat Voice Call het Twilio-deel heeft gestart                                                                                                                        |

Met `chrome.audioBridgeCommand` en `chrome.audioBridgeHealthCommand` kan een externe bridge het volledige lokale audiopad beheren in plaats van `chrome.audioInputCommand`/`chrome.audioOutputCommand`; zie [Opmerkingen](#notes) voor de beperking van welke modus deze kan gebruiken.

Er bestaat een `openclaw doctor --fix`-migratie voor de verouderde `realtime.provider: "google"`-structuur: deze verplaatst die intentie naar `realtime.voiceProvider: "google"` plus `realtime.transcriptionProvider: "openai"` wanneer die velden nog niet zijn ingesteld.

### Optionele overschrijvingen

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
    model: "gemini-3.1-flash-live-preview",
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

De permanente Meet-stem komt uit `messages.tts.providers.elevenlabs.speakerVoiceId`. Agentantwoorden kunnen ook `[[tts:speakerVoiceId=... model=eleven_v3]]`-richtlijnen per antwoord gebruiken wanneer overschrijvingen van het TTS-model zijn ingeschakeld, maar de configuratie is de deterministische standaard voor vergaderingen. Bij deelname tonen de logboeken `transcriptionProvider=elevenlabs`, en elk gesproken antwoord registreert `provider=elevenlabs model=eleven_v3 speakerVoiceId=<voiceId>`.

Configuratie uitsluitend voor Twilio:

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

Met `voiceCall.enabled: true` (de standaard) en Twilio-transport plaatst Voice Call de DTMF-reeks voordat de realtime mediastream wordt geopend en gebruikt vervolgens de opgeslagen introductietekst als eerste realtime begroeting. Als `voice-call` niet is ingeschakeld, kan Google Meet het belplan nog steeds valideren en vastleggen, maar de Twilio-oproep niet plaatsen.

Laat `voiceCall.gatewayUrl` uitgeschakeld om de lokale vertrouwde Gateway-runtime te gebruiken, waarmee de
aanroepende agent gedurende de volledige aanroep behouden blijft. Een geconfigureerde Gateway-URL blijft een expliciet WebSocket-doel en
kan de herkomst van plugins niet verifiëren; deelnames door niet-standaardagents worden standaard geweigerd in plaats van stilzwijgend
een andere agent te gebruiken. Voer Google Meet en Voice Call in hetzelfde Gateway-proces uit wanneer routering
per agent vereist is.

## Tool

Agents gebruiken de tool `google_meet`:

```json
{
  "action": "join",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "mode": "agent"
}
```

| `action`                | Doel                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `join`                  | Deelnemen via een expliciete Meet-URL                                                              |
| `create`                | Een ruimte maken (en standaard deelnemen); ondersteunt `accessType`/`entryPointAccess`          |
| `status`                | Actieve sessies weergeven of er één inspecteren via `sessionId`                                  |
| `setup_status`          | Dezelfde controles uitvoeren als `googlemeet setup`                                               |
| `resolve_space`         | Een URL/code/`spaces/{id}` omzetten via `spaces.get`                                           |
| `preflight`             | Vereisten voor OAuth en het omzetten van vergaderingen valideren                                   |
| `latest`                | De nieuwste conferentierecord voor een vergadering zoeken                                          |
| `calendar_events`       | Een voorbeeld weergeven van Agenda-afspraken met Meet-links                                        |
| `artifacts`             | Conferentierecords en metadata van deelnemers/opnamen/transcripties/slimme notities weergeven       |
| `attendance`            | Deelnemers en deelnemerssessies weergeven                                                          |
| `export`                | De bundel met artefacten/aanwezigheid/transcript/manifest schrijven; stel `"dryRun": true` in voor alleen het manifest |
| `recover_current_tab`   | Een bestaand Meet-tabblad activeren/inspecteren zonder een nieuw tabblad te openen                  |
| `transcript`            | Het begrensde ondertitelingstranscript lezen; `sinceIndex` gaat verder vanaf de vorige `nextIndex` |
| `leave`                 | Een sessie beëindigen (Chrome klikt op Verlaten; sluit alleen zelf geopende tabbladen; Twilio verbreekt de verbinding) |
| `end_active_conference` | De actieve Google Meet-conferentie beëindigen voor een via de API beheerde ruimte                   |
| `speak`                 | De realtime-agent onmiddellijk laten spreken met `sessionId` en `message`                  |
| `test_speech`           | Een sessie maken/hergebruiken, een bekende zin activeren en de Chrome-status retourneren           |
| `test_listen`           | Een alleen-observeren-sessie maken/hergebruiken en wachten op beweging in ondertiteling/transcript |

`test_speech` dwingt altijd `mode: "agent"` of `"bidi"` af en mislukt bij een verzoek om in `mode: "transcribe"` te worden uitgevoerd, omdat alleen-observeren-sessies geen spraak kunnen voortbrengen. Het resultaat `speechOutputVerified` is gebaseerd op een toename van realtime-audio-uitvoerbytes tijdens die aanroep, zodat een hergebruikte sessie met oudere audio niet als een nieuwe controle telt.

Voor Chrome-transports houdt `leave` een hergebruikt tabblad van de gebruiker open nadat op de knop Verlaten van Meet is geklikt. Door OpenClaw geopende tabbladen worden na vertrek gesloten.

Gebruik `transport: "chrome"` wanneer Chrome op de Gateway-host draait en `transport: "chrome-node"` wanneer Chrome op een gekoppelde Node draait. In beide gevallen draaien de modelproviders en `openclaw_agent_consult` op de Gateway-host, zodat modelreferenties daar blijven. Logboeken in agentmodus bevatten bij het starten van de bridge de gekozen transcriptieprovider/het gekozen transcriptiemodel en na elk gesynthetiseerd antwoord de TTS-provider/het TTS-model/de stem/de uitvoerindeling/de samplefrequentie. Onbewerkte `mode: "realtime"` wordt nog geaccepteerd als verouderde compatibiliteitsalias voor `mode: "agent"`, maar wordt niet meer vermeld in de `mode`-enum van de tool.

`create` met een door een API ondersteunde ruimte en een expliciet toegangsbeleid:

```json
{
  "action": "create",
  "transport": "chrome-node",
  "mode": "agent",
  "accessType": "OPEN"
}
```

De actieve conferentie van een bekende ruimte beëindigen:

```json
{
  "action": "end_active_conference",
  "meeting": "https://meet.google.com/abc-defg-hij"
}
```

Validatie waarbij eerst wordt geluisterd voordat wordt beweerd dat een vergadering bruikbaar is:

```json
{
  "action": "test_listen",
  "url": "https://meet.google.com/abc-defg-hij",
  "transport": "chrome-node",
  "timeoutMs": 30000
}
```

Op verzoek spreken:

```json
{
  "action": "speak",
  "sessionId": "meet_...",
  "message": "Zeg precies: Ik ben er en luister."
}
```

`status` bevat indien beschikbaar de Chrome-status:

| Veld                                                                  | Betekenis                                                                                                              |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inCall`                                                              | Chrome lijkt zich in het Meet-gesprek te bevinden                                                                      |
| `micMuted`                                                            | Meet-microfoonstatus op basis van beste inspanning                                                                     |
| `manualActionRequired` / `manualActionReason` / `manualActionMessage` | Het browserprofiel vereist handmatig aanmelden, toelating door de Meet-host, machtigingen of herstel van browserbesturing voordat spraak kan werken |
| `speechReady` / `speechBlockedReason` / `speechBlockedMessage`        | Of beheerde Chrome-spraak nu is toegestaan; `speechReady: false` betekent dat OpenClaw de introductie-/testzin niet heeft verzonden |
| `providerConnected` / `realtimeReady`                                 | Status van de realtime-spraakbridge                                                                                    |
| `lastInputAt` / `lastOutputAt`                                        | Laatste audio die van/naar de bridge is waargenomen/verzonden                                                          |
| `audioOutputRouted` / `audioOutputDeviceLabel`                        | Of de media-uitvoer van het Meet-tabblad actief naar het BlackHole-apparaat van de bridge werd gerouteerd              |
| `lastSuppressedInputAt` / `suppressedInputBytes`                      | Loopback-invoer genegeerd terwijl het afspelen van de assistent actief is                                               |

## Agent- en bidi-modi

| Modus   | Wie het antwoord bepaalt          | Pad voor spraakuitvoer                  | Gebruiken wanneer                                      |
| ------- | ------------------------------- | --------------------------------------- | ------------------------------------------------------ |
| `agent` | De geconfigureerde OpenClaw-agent | Normale OpenClaw TTS-runtime            | Je gedrag wilt waarbij je agent in de vergadering zit  |
| `bidi`  | Het realtime-spraakmodel           | Audiorespons van de realtime-spraakprovider | Je een conversatiespraaklus met de laagste latentie wilt |

`agent`-modus: de realtime-transcriptieprovider hoort de vergaderaudio, definitieve deelnemerstranscripties worden via de geconfigureerde OpenClaw-agent gerouteerd en het antwoord wordt uitgesproken via de reguliere OpenClaw TTS. Nabijgelegen definitieve transcriptfragmenten worden vóór de raadpleging samengevoegd, zodat één gesproken beurt niet meerdere verouderde gedeeltelijke antwoorden oplevert; realtime-invoer wordt onderdrukt terwijl in de wachtrij geplaatste assistentaudio nog wordt afgespeeld en recente transcriptie-echo's die op de assistent lijken, worden vóór de raadpleging genegeerd, zodat BlackHole-loopback er niet voor zorgt dat de agent zijn eigen spraak beantwoordt.

`bidi`-modus: het realtime-spraakmodel antwoordt rechtstreeks en kan `openclaw_agent_consult` aanroepen voor diepere redenering, actuele informatie of normale OpenClaw-tools. De raadpleegtool voert achter de schermen de reguliere OpenClaw-agent uit met recente context uit het vergaderingstranscript en retourneert een beknopt gesproken antwoord; in de `agent`-modus stuurt OpenClaw dat antwoord rechtstreeks naar TTS, in de `bidi`-modus kan het realtime-spraakmodel het uitspreken. Deze modus gebruikt hetzelfde gedeelde raadpleegmechanisme als Voice Call.

Standaard worden raadplegingen uitgevoerd voor de agent `main`; stel `realtime.agentId` in om een Meet-route te koppelen aan een speciale agentwerkruimte, standaardmodellen, toolbeleid, geheugen en sessiegeschiedenis. Raadplegingen in agentmodus gebruiken per vergadering een sessiesleutel `agent:<id>:subagent:google-meet:<session>`, zodat vervolgvragen de vergadercontext behouden en tegelijkertijd het normale agentbeleid overnemen. Wanneer een agent in agentmodus `google_meet` aanroept, maakt de consultantsessie een fork van het huidige transcript van de aanroeper voordat spraak van deelnemers wordt beantwoord; de Meet-sessie blijft gescheiden, zodat vervolgvragen in de vergadering het transcript van de aanroeper niet rechtstreeks wijzigen.

`realtime.toolPolicy` bepaalt de raadplegingsuitvoering:

| Beleid           | Gedrag                                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | De raadpleegtool beschikbaar stellen; de reguliere agent beperken tot `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, `memory_get` |
| `owner`          | De raadpleegtool beschikbaar stellen; de reguliere agent het normale toolbeleid laten gebruiken                                  |
| `none`           | De raadpleegtool niet beschikbaar stellen aan het realtime-spraakmodel                                                           |

De sessiesleutel voor raadplegingen heeft een bereik per Meet-sessie, zodat volgende raadplegingsaanroepen tijdens dezelfde vergadering eerdere raadplegingscontext hergebruiken.

Dwing een gesproken gereedheidscontrole af nadat Chrome volledig heeft deelgenomen:

```bash
openclaw googlemeet speak meet_... "Say exactly: I'm here and listening."
```

Volledige rooktest voor deelnemen en spreken:

```bash
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: I'm here and listening."
```

## Checklist voor livetests

Voordat je een vergadering overdraagt aan een onbeheerde agent:

```bash
openclaw googlemeet setup
openclaw nodes status
openclaw googlemeet test-speech https://meet.google.com/abc-defg-hij \
  --transport chrome-node \
  --message "Say exactly: Google Meet speech test complete."
```

Verwachte Chrome-node-status:

- `googlemeet setup` is volledig groen en bevat `chrome-node-connected` wanneer Chrome-node het standaardtransport is of een Node is vastgezet.
- `nodes status` geeft aan dat de geselecteerde Node verbonden is en zowel `googlemeet.chrome` als `browser.proxy` aanbiedt.
- Het Meet-tabblad neemt deel en `test-speech` retourneert de Chrome-status met `inCall: true`.

Voor een externe Chrome-host, zoals een Parallels macOS-VM, is dit de kortste veilige controle na het bijwerken van de Gateway of de VM:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
openclaw nodes invoke \
  --node parallels-macos \
  --command googlemeet.chrome \
  --params '{"action":"setup"}'
```

Dit bewijst dat de Gateway-plugin is geladen, de VM-Node is verbonden met het huidige token en de Meet-audiobridge beschikbaar is voordat een agent een echt vergaderingstabblad opent.

Gebruik voor een Twilio-rooktest een vergadering die telefonische inbelgegevens beschikbaar stelt:

```bash
openclaw googlemeet setup
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --pin 123456
```

Verwachte Twilio-status:

- `googlemeet setup` bevat groene controles voor `twilio-voice-call-plugin`, `twilio-voice-call-credentials` en `twilio-voice-call-webhook`.
- `voicecall` is beschikbaar in de CLI nadat de Gateway opnieuw is geladen.
- De geretourneerde sessie heeft `transport: "twilio"` en een `twilio.voiceCallId`.
- `openclaw logs --follow` toont DTMF-TwiML die vóór realtime-TwiML wordt aangeboden, gevolgd door een realtime-bridge waarbij de eerste begroeting in de wachtrij staat.
- `googlemeet leave <sessionId>` beëindigt de gedelegeerde spraakoproep.

## Problemen oplossen

### Agent kan de Google Meet-tool niet zien

Controleer of de plugin is ingeschakeld en laad de Gateway opnieuw; de actieve agent ziet alleen plugintools die door het huidige Gateway-proces zijn geregistreerd:

```bash
openclaw plugins list | grep google-meet
openclaw googlemeet setup
```

Op Gateway-hosts zonder macOS blijft `google_meet` zichtbaar, maar lokale Chrome-acties voor terugspreken worden geblokkeerd voordat ze de audiobridge bereiken. Gebruik `mode: "transcribe"`, inbellen via Twilio of een macOS-host met `chrome-node` in plaats van het standaardpad voor de lokale Chrome-agent.

### Geen verbonden Node met ondersteuning voor Google Meet

Op de Node-host:

```bash
openclaw plugins enable google-meet
openclaw plugins enable browser
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node run --host <gateway-lan-ip> --port 18789 --display-name parallels-macos
```

Op de Gateway-host:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

De Node moet verbonden zijn en `googlemeet.chrome` plus `browser.proxy` vermelden; de Gateway-configuratie moet beide toestaan:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["browser.proxy", "googlemeet.chrome"],
    },
  },
}
```

Als `googlemeet setup` niet slaagt voor `chrome-node-connected`, of het Gateway-logboek `gateway token mismatch` meldt, installeer of herstart je de Node met het huidige Gateway-token:

```bash
OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1 \
  openclaw node install \
  --host <gateway-lan-ip> \
  --port 18789 \
  --display-name parallels-macos \
  --force
```

Laad daarna de Node-service opnieuw en voer dit nogmaals uit:

```bash
openclaw googlemeet setup
openclaw nodes status --connected
```

### Browser wordt geopend, maar agent kan niet deelnemen

Voer `googlemeet test-listen` uit voor deelnames waarbij alleen wordt geobserveerd, of `googlemeet test-speech` voor realtime-deelnames, en controleer vervolgens de geretourneerde Chrome-status. Als een van beide `manualActionRequired: true` meldt, toon je `manualActionMessage` aan de beheerder en probeer je het niet opnieuw totdat de browseractie is voltooid.

Veelvoorkomende handmatige acties: meld je aan bij het Chrome-profiel; laat de gast toe vanuit het Meet-hostaccount; verleen Chrome toestemming voor de microfoon en camera wanneer de systeemeigen prompt verschijnt; sluit of herstel een vastgelopen dialoogvenster voor Meet-machtigingen.

Meld niet dat de gebruiker "niet is aangemeld" alleen omdat Meet vraagt "Do you want people to hear you in the meeting?"; dit is het tussenscherm van Meet voor de audiokeuze. OpenClaw klikt indien beschikbaar via browserautomatisering op **Use microphone** en blijft wachten op de werkelijke vergaderstatus; bij een browserfallback die alleen een vergadering aanmaakt, kan het in plaats daarvan op **Continue without microphone** klikken, omdat voor het genereren van de URL geen realtime-audiopad nodig is.

### Vergadering aanmaken mislukt

`googlemeet create` gebruikt de Meet-API `spaces.create` wanneer OAuth is geconfigureerd, en anders de browser van de vastgezette Chrome-Node. Controleer het volgende:

- **Aanmaken via API**: `oauth.clientId` en `oauth.refreshToken` (of overeenkomende `OPENCLAW_GOOGLE_MEET_*`-omgevingsvariabelen) zijn aanwezig en het vernieuwingstoken is aangemaakt nadat ondersteuning voor aanmaken werd toegevoegd; oudere tokens hebben mogelijk geen `meetings.space.created`, dus voer `openclaw googlemeet auth login --json` opnieuw uit.
- **Browserfallback**: `defaultTransport: "chrome-node"` en `chromeNode.node` verwijzen naar een verbonden Node met `browser.proxy` en `googlemeet.chrome`; het OpenClaw Chrome-profiel op die Node is aangemeld en kan `https://meet.google.com/new` openen.
- **Nieuwe pogingen met browserfallback**: hergebruik een bestaand tabblad met `.../new` of een Google-accountprompt voordat je een nieuw tabblad opent; probeer de toolaanroep opnieuw in plaats van handmatig nog een tabblad te openen.
- **Handmatige actie**: als de tool `manualActionRequired: true` retourneert, gebruik je `browser.nodeId`, `browser.targetId`, `browserUrl` en `manualActionMessage` om de beheerder te begeleiden; probeer het niet herhaaldelijk opnieuw.
- **Tussenscherm voor audiokeuze**: als Meet "Do you want people to hear you in the meeting?" toont, laat je het tabblad open. OpenClaw hoort op **Use microphone** of (alleen bij aanmaken) **Continue without microphone** te klikken en te blijven wachten op de gegenereerde URL; als dat niet lukt, hoort de fout `meet-audio-choice-required` te vermelden, niet `google-login-required`.

### Agent neemt deel, maar spreekt niet

```bash
openclaw googlemeet setup
openclaw googlemeet doctor
```

Gebruik `mode: "agent"` voor het pad STT -> OpenClaw-agent -> TTS en `mode: "bidi"` voor de directe realtime-spraakfallback. `mode: "transcribe"` start opzettelijk geen bridge voor terugspreken. Voer voor foutopsporing waarbij alleen wordt geobserveerd `openclaw googlemeet status --json <session-id>` uit nadat deelnemers hebben gesproken en controleer `captioning`, `transcriptLines` en `lastCaptionText`. Als `inCall` waar is maar `transcriptLines` `0` blijft, zijn Meet-ondertitels mogelijk uitgeschakeld, heeft niemand gesproken sinds de observator werd geïnstalleerd, is de Meet-interface gewijzigd of zijn live-ondertitels niet beschikbaar voor de taal of het account van de vergadering.

`googlemeet test-speech` controleert altijd het realtime-pad en meldt of tijdens die aanroep uitvoerbytes van de bridge zijn waargenomen. Als `speechOutputVerified` onwaar is en `speechOutputTimedOut` waar is, heeft de realtime-provider de uiting mogelijk geaccepteerd, maar heeft OpenClaw geen nieuwe uitvoerbytes de Chrome-audiobridge zien bereiken.

Controleer ook het volgende: er is een sleutel voor een realtime-provider (`OPENAI_API_KEY` of `GEMINI_API_KEY`) beschikbaar op de Gateway-host; `BlackHole 2ch` is zichtbaar op de Chrome-host; `sox` bestaat daar; de microfoon en luidspreker van Meet worden via het virtuele audiopad geleid (`doctor` hoort `meet output routed: yes` te tonen voor lokale realtime-deelnames via Chrome).

`googlemeet doctor [session-id]` toont de sessie, Node, status tijdens het gesprek, reden voor handmatige actie, verbinding met de realtime-provider, `realtimeReady`, activiteit van audio-invoer en -uitvoer, tijdstempels van de laatste audio, bytetellers en browser-URL. Gebruik `googlemeet status [session-id] --json` voor onbewerkte JSON en `googlemeet doctor --oauth` (voeg `--meeting` of `--create-space` toe) om OAuth-vernieuwing te controleren zonder tokens prijs te geven.

Als een agent een time-out heeft bereikt en er al een Meet-tabblad is geopend, controleer je dit zonder nog een tabblad te openen:

```bash
openclaw googlemeet recover-tab
openclaw googlemeet recover-tab https://meet.google.com/abc-defg-hij
```

De equivalente toolactie is `recover_current_tab`: deze stelt een bestaand Meet-tabblad voor het geselecteerde transport scherp en controleert het (lokale browserbesturing voor `chrome`, de geconfigureerde Node voor `chrome-node`) zonder een nieuw tabblad of een nieuwe sessie te openen, en meldt de huidige blokkade (aanmelding, toelating, machtigingen, status van audiokeuze). De CLI-opdracht communiceert met de geconfigureerde Gateway, die actief moet zijn; voor `chrome-node` moet de Node bovendien verbonden zijn.

### Twilio-installatiecontroles mislukken

`twilio-voice-call-plugin` mislukt wanneer `voice-call` niet is toegestaan of niet is ingeschakeld: voeg deze toe aan `plugins.allow`, schakel `plugins.entries.voice-call` in en laad de Gateway opnieuw.

`twilio-voice-call-credentials` mislukt wanneer de account-SID, het authenticatietoken of het nummer van de beller ontbreekt in de Twilio-backend:

```bash
export TWILIO_ACCOUNT_SID=AC...
export TWILIO_AUTH_TOKEN=...
export TWILIO_FROM_NUMBER=+15550001234
```

`twilio-voice-call-webhook` mislukt wanneer `voice-call` geen openbare Webhook-blootstelling heeft of `publicUrl` naar loopback- of privé-netwerkruimte verwijst. Gebruik `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` of `fd00::/8` niet als `publicUrl`; terugbelverzoeken van de provider kunnen deze niet bereiken. Stel `plugins.entries.voice-call.config.publicUrl` in op een openbare URL of configureer blootstelling via een tunnel of Tailscale:

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

Gebruik voor lokale ontwikkeling blootstelling via een tunnel of Tailscale in plaats van een URL van een privéhost:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tunnel: { provider: "ngrok" },
          // of
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Herstart of herlaad de Gateway en voer vervolgens dit uit:

```bash
openclaw googlemeet setup --transport twilio
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` controleert standaard alleen of het systeem gereed is. Voer een test zonder uitvoering uit voor een specifiek nummer:

```bash
openclaw voicecall smoke --to "+15555550123"
```

Voeg `--yes` alleen toe om bewust een echte uitgaande oproep te plaatsen:

```bash
openclaw voicecall smoke --to "+15555550123" --yes
```

### Twilio-oproep start, maar komt nooit in de vergadering

Controleer of de Meet-gebeurtenis telefonische inbelgegevens bevat en geef het exacte inbelnummer plus de pincode of een aangepaste DTMF-reeks door:

```bash
openclaw googlemeet join https://meet.google.com/abc-defg-hij \
  --transport twilio \
  --dial-in-number +15551234567 \
  --dtmf-sequence ww123456#
```

Gebruik vooraan `w` of komma's in `--dtmf-sequence` voor een pauze vóór de pincode.

Als de oproep is aangemaakt, maar de deelnemerslijst van Meet de inbellende deelnemer nooit toont:

- `openclaw googlemeet doctor <session-id>`: controleer de gedelegeerde Twilio-oproep-ID, of DTMF in de wachtrij is geplaatst en of om de inleidende begroeting is gevraagd.
- `openclaw voicecall status --call-id <id>`: controleer of de oproep nog actief is.
- `openclaw voicecall tail`: controleer of Twilio-webhooks bij de Gateway aankomen.
- `openclaw logs --follow`: zoek naar de Twilio Meet-reeks: Google Meet delegeert de deelname, Voice Call slaat TwiML voor DTMF vóór de verbinding op en biedt dit aan, Voice Call biedt realtime-TwiML voor de Twilio-oproep aan en vervolgens vraagt Google Meet met `voicecall.speak` om de inleidende spraak.
- Voer `openclaw googlemeet setup --transport twilio` opnieuw uit; een groene installatiecontrole is vereist, maar bewijst niet dat de pincodereeks van de vergadering correct is.
- Controleer of het inbelnummer bij dezelfde Meet-uitnodiging en regio hoort als de pincode.
- Verhoog `voiceCall.dtmfDelayMs` vanaf de standaardwaarde van 12 seconden als Meet langzaam opneemt of het oproeptranscript de vraag om de pincode nog steeds toont nadat DTMF vóór de verbinding is verzonden.
- Als de deelnemer binnenkomt maar je de begroeting niet hoort, controleer je `openclaw logs --follow` op het `voicecall.speak`-verzoek na DTMF en op TTS-weergave via de mediastream of de Twilio-fallback `<Say>`. Als het transcript nog steeds "enter the meeting PIN" toont, is het telefoongedeelte nog niet toegetreden tot de Meet-ruimte en zullen deelnemers dus geen spraak horen.

Als webhooks niet aankomen, spoor je eerst problemen in de Voice Call-plugin op: de provider moet `plugins.entries.voice-call.config.publicUrl` of de geconfigureerde tunnel kunnen bereiken. Zie [Problemen met spraakoproepen oplossen](/nl/plugins/voice-call#troubleshooting).

## Opmerkingen

De officiële media-API van Google Meet is gericht op ontvangen, dus om in een oproep te spreken is nog steeds een deelnemerspad nodig. Deze plugin houdt die grens zichtbaar: Chrome verwerkt browserdeelname en lokale audioroutering; Twilio verwerkt deelname via telefonisch inbellen.

Chrome-modi voor terugspreken hebben `BlackHole 2ch` plus een van de volgende nodig:

- `chrome.audioInputCommand` plus `chrome.audioOutputCommand`: OpenClaw beheert de bridge en stuurt audio in `chrome.audioFormat` tussen deze commando's en de geselecteerde provider. De modus `agent` gebruikt realtime transcriptie plus reguliere TTS; de modus `bidi` gebruikt de realtime spraakprovider. Het standaardpad is 24 kHz PCM16 met `chrome.audioBufferBytes: 4096`; 8 kHz G.711 mu-law blijft beschikbaar voor verouderde commandoparen.
- `chrome.audioBridgeCommand`: een extern bridge-commando beheert het volledige lokale audiopad en moet afsluiten nadat de daemon is gestart of gevalideerd. Alleen geldig voor `bidi`, omdat de modus `agent` directe toegang tot het commandopaar nodig heeft voor TTS.

Met de Chrome-bridge met commandopaar kan `chrome.bargeInInputCommand` naar een afzonderlijke lokale microfoon luisteren en het afspelen van de assistent onderbreken wanneer een persoon begint te praten, zodat menselijke spraak voorrang houdt op de uitvoer van de assistent, zelfs wanneer de gedeelde BlackHole-loopbackinvoer tijdelijk wordt onderdrukt tijdens het afspelen van de assistent. Net als `chrome.audioInputCommand`/`chrome.audioOutputCommand` is dit een door de operator geconfigureerd lokaal commando: gebruik een expliciet vertrouwd commandopad of een expliciete argumentenlijst, nooit een script uit een niet-vertrouwde locatie.

Voor zuivere duplexaudio stuur je de Meet-uitvoer en de Meet-microfoon via afzonderlijke virtuele apparaten of een virtuele apparaatgraaf in Loopback-stijl; één gedeeld BlackHole-apparaat kan andere deelnemers terug de oproep in laten echoën.

`googlemeet speak` activeert de actieve audiobridge voor terugspreken voor een Chrome-sessie; `googlemeet leave` stopt deze (en beëindigt bij Twilio-sessies die via Voice Call zijn gedelegeerd de onderliggende oproep). Gebruik `googlemeet end-active-conference` om ook de actieve Google Meet-conferentie voor een via de API beheerde ruimte te sluiten.

## Gerelateerd

- [Plugin voor spraakoproepen](/nl/plugins/voice-call)
- [Gespreksmodus](/nl/nodes/talk)
- [Plugins bouwen](/nl/plugins/building-plugins)
