---
read_when:
    - Je wilt een uitgaand spraakgesprek starten vanuit OpenClaw
    - Je configureert of ontwikkelt de Plugin voor spraakoproepen
    - Je hebt realtime spraak of streamingtranscriptie voor telefonie nodig
sidebarTitle: Voice call
summary: Voer uitgaande spraakoproepen uit en neem inkomende spraakoproepen aan via Twilio, Telnyx of Plivo, met optionele realtime-spraak en streamingtranscriptie
title: Plugin voor spraakoproepen
x-i18n:
    generated_at: "2026-05-01T11:21:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6334e5418e0fb530fc5d372ee1ada06ba987ce86bbf70746ee4ffe4c3ed4844e
    source_path: plugins/voice-call.md
    workflow: 16
---

Spraakoproepen voor OpenClaw via een Plugin. Ondersteunt uitgaande meldingen,
gesprekken met meerdere beurten, full-duplex realtime spraak, streaming
transcriptie en inkomende oproepen met allowlist-beleid.

**Huidige providers:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
spraak), `mock` (dev/geen netwerk).

<Note>
De Voice Call Plugin draait **binnen het Gateway-proces**. Als je een
externe Gateway gebruikt, installeer en configureer je de Plugin op de machine waarop
de Gateway draait en start je daarna de Gateway opnieuw om deze te laden.
</Note>

## Snel starten

<Steps>
  <Step title="Installeer de Plugin">
    <Tabs>
      <Tab title="Van npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="Van een lokale map (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Als npm meldt dat het OpenClaw-pakket is verouderd, komt die pakketversie
    uit een oudere externe pakketlijn; gebruik een huidige verpakte OpenClaw-
    build of het lokale mappad totdat een nieuwer npm-pakket is gepubliceerd.

    Start daarna de Gateway opnieuw zodat de Plugin wordt geladen.

  </Step>
  <Step title="Configureer provider en Webhook">
    Stel de configuratie in onder `plugins.entries.voice-call.config` (zie
    [Configuratie](#configuration) hieronder voor de volledige vorm). Minimaal:
    `provider`, providerreferenties, `fromNumber` en een publiek
    bereikbare Webhook-URL.
  </Step>
  <Step title="Verifieer de installatie">
    ```bash
    openclaw voicecall setup
    ```

    De standaarduitvoer is leesbaar in chatlogs en terminals. Deze controleert
    of de Plugin is ingeschakeld, providerreferenties, Webhook-blootstelling en dat
    slechts één audiomodus (`streaming` of `realtime`) actief is. Gebruik
    `--json` voor scripts.

  </Step>
  <Step title="Smoke-test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Beide zijn standaard dry runs. Voeg `--yes` toe om daadwerkelijk een korte
    uitgaande meldingsoproep te plaatsen:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Voor Twilio, Telnyx en Plivo moet de installatie uitkomen op een **publieke Webhook-URL**.
Als `publicUrl`, de tunnel-URL, de Tailscale-URL of de serve-fallback
uitkomt op loopback of privé-netwerkruimte, mislukt de installatie in plaats van
een provider te starten die geen carrier-Webhooks kan ontvangen.
</Warning>

## Configuratie

Als `enabled: true` is ingesteld maar de geselecteerde provider referenties mist,
logt het opstarten van de Gateway een waarschuwing dat de installatie onvolledig is met de ontbrekende sleutels en
wordt het starten van de runtime overgeslagen. Commando's, RPC-aanroepen en agenttools
retourneren bij gebruik nog steeds exact de ontbrekende providerconfiguratie.

<Note>
Voice-call-referenties accepteren SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` en `plugins.entries.voice-call.config.tts.providers.*.apiKey` worden opgelost via het standaard SecretRef-oppervlak; zie [SecretRef-referentieoppervlak](/nl/reference/secretref-credential-surface).
</Note>

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // or "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // or TWILIO_FROM_NUMBER for Twilio
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Telnyx webhook public key from the Mission Control Portal
            // (Base64; can also be set via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },
          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook server
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook security (recommended for tunnels/proxies)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Public exposure (pick one)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* see Streaming transcription */ },
          realtime: { enabled: false /* see Realtime voice */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Providerblootstelling en beveiligingsnotities">
    - Twilio, Telnyx en Plivo vereisen allemaal een **publiek bereikbare** Webhook-URL.
    - `mock` is een lokale dev-provider (geen netwerkaanroepen).
    - Telnyx vereist `telnyx.publicKey` (of `TELNYX_PUBLIC_KEY`), tenzij `skipSignatureVerification` true is.
    - `skipSignatureVerification` is alleen bedoeld voor lokaal testen.
    - Stel op de gratis ngrok-laag `publicUrl` in op de exacte ngrok-URL; handtekeningverificatie wordt altijd afgedwongen.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` staat Twilio-Webhooks met ongeldige handtekeningen **alleen** toe wanneer `tunnel.provider="ngrok"` is en `serve.bind` loopback is (lokale ngrok-agent). Alleen lokale ontwikkeling.
    - Gratis ngrok-URL's kunnen veranderen of interstitialgedrag toevoegen; als `publicUrl` afwijkt, mislukken Twilio-handtekeningen. Productie: geef de voorkeur aan een stabiel domein of een Tailscale-funnel.

  </Accordion>
  <Accordion title="Limieten voor streamingverbindingen">
    - `streaming.preStartTimeoutMs` sluit sockets die nooit een geldig `start`-frame verzenden.
    - `streaming.maxPendingConnections` beperkt het totale aantal niet-geverifieerde pre-start-sockets.
    - `streaming.maxPendingConnectionsPerIp` beperkt niet-geverifieerde pre-start-sockets per bron-IP.
    - `streaming.maxConnections` beperkt het totale aantal open mediastream-sockets (pending + actief).

  </Accordion>
  <Accordion title="Migraties van legacy-configuratie">
    Oudere configuraties die `provider: "log"`, `twilio.from` of legacy
    `streaming.*` OpenAI-sleutels gebruiken, worden herschreven door `openclaw doctor --fix`.
    Runtime-fallback accepteert voorlopig nog de oude voice-call-sleutels, maar
    het herschrijvingspad is `openclaw doctor --fix` en de compat-shim is
    tijdelijk.

    Automatisch gemigreerde streaming-sleutels:

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Realtime spraakgesprekken

`realtime` selecteert een full-duplex realtime spraakprovider voor live oproepaudio.
Dit staat los van `streaming`, dat audio alleen doorstuurt naar
realtime transcriptieproviders.

<Warning>
`realtime.enabled` kan niet worden gecombineerd met `streaming.enabled`. Kies één
audiomodus per oproep.
</Warning>

Huidig runtimegedrag:

- `realtime.enabled` wordt ondersteund voor Twilio Media Streams.
- `realtime.provider` is optioneel. Als dit niet is ingesteld, gebruikt Voice Call de eerste geregistreerde realtime spraakprovider.
- Gebundelde realtime spraakproviders: Google Gemini Live (`google`) en OpenAI (`openai`), geregistreerd door hun provider-Plugins.
- Provider-eigen ruwe configuratie staat onder `realtime.providers.<providerId>`.
- Voice Call stelt de gedeelde realtime tool `openclaw_agent_consult` standaard beschikbaar. Het realtime model kan deze aanroepen wanneer de beller vraagt om diepere redenering, actuele informatie of normale OpenClaw-tools.
- `realtime.fastContext.enabled` staat standaard uit. Indien ingeschakeld zoekt Voice Call eerst in geïndexeerd geheugen/sessiecontext naar de consultvraag en retourneert deze fragmenten naar het realtime model binnen `realtime.fastContext.timeoutMs`, voordat alleen wordt teruggevallen op de volledige consultagent als `realtime.fastContext.fallbackToConsult` true is.
- Als `realtime.provider` naar een niet-geregistreerde provider wijst, of als er helemaal geen realtime spraakprovider is geregistreerd, logt Voice Call een waarschuwing en slaat het realtime media over in plaats van de hele Plugin te laten mislukken.
- Consultsessiesleutels hergebruiken de bestaande spraaksessie wanneer beschikbaar en vallen daarna terug op het telefoonnummer van de beller/gebelde, zodat vervolgconsultaanroepen tijdens de oproep context behouden.

### Toolbeleid

`realtime.toolPolicy` beheert de consultrun:

| Beleid           | Gedrag                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Stelt de consulttool beschikbaar en beperkt de reguliere agent tot `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` en `memory_get`. |
| `owner`          | Stelt de consulttool beschikbaar en laat de reguliere agent het normale agenttoolbeleid gebruiken.                                                      |
| `none`           | Stelt de consulttool niet beschikbaar. Aangepaste `realtime.tools` worden nog steeds doorgegeven aan de realtime provider.                               |

### Voorbeelden van realtime providers

<Tabs>
  <Tab title="Google Gemini Live">
    Standaarden: API-sleutel van `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` of `GOOGLE_GENERATIVE_AI_API_KEY`; model
    `gemini-2.5-flash-native-audio-preview-12-2025`; stem `Kore`.

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              provider: "twilio",
              inboundPolicy: "allowlist",
              allowFrom: ["+15550005678"],
              realtime: {
                enabled: true,
                provider: "google",
                instructions: "Speak briefly. Call openclaw_agent_consult before using deeper tools.",
                toolPolicy: "safe-read-only",
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    voice: "Kore",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="OpenAI">
    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              realtime: {
                enabled: true,
                provider: "openai",
                providers: {
                  openai: { apiKey: "${OPENAI_API_KEY}" },
                },
              },
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

Zie [Google-provider](/nl/providers/google) en
[OpenAI-provider](/nl/providers/openai) voor providerspecifieke opties voor realtime spraak.

## Streaming transcriptie

`streaming` selecteert een realtime transcriptieprovider voor live oproepaudio.

Huidig runtimegedrag:

- `streaming.provider` is optioneel. Als dit niet is ingesteld, gebruikt Voice Call de eerste geregistreerde realtime-transcriptieprovider.
- Gebundelde realtime-transcriptieproviders: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) en xAI (`xai`), geregistreerd door hun provider-plugins.
- Ruwe configuratie die eigendom is van de provider staat onder `streaming.providers.<providerId>`.
- Nadat Twilio een geaccepteerd stream-`start`-bericht verzendt, registreert Voice Call de stream onmiddellijk, plaatst inkomende media in de wachtrij via de transcriptieprovider terwijl de provider verbinding maakt, en start de eerste begroeting pas nadat realtime-transcriptie gereed is.
- Als `streaming.provider` naar een niet-geregistreerde provider verwijst, of als er geen is geregistreerd, logt Voice Call een waarschuwing en slaat mediastreaming over in plaats van de hele plugin te laten mislukken.

### Voorbeelden van streamingproviders

<Tabs>
  <Tab title="OpenAI">
    Standaarden: API-sleutel `streaming.providers.openai.apiKey` of
    `OPENAI_API_KEY`; model `gpt-4o-transcribe`; `silenceDurationMs: 800`;
    `vadThreshold: 0.5`.

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "openai",
                streamPath: "/voice/stream",
                providers: {
                  openai: {
                    apiKey: "sk-...", // optional if OPENAI_API_KEY is set
                    model: "gpt-4o-transcribe",
                    silenceDurationMs: 800,
                    vadThreshold: 0.5,
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="xAI">
    Standaarden: API-sleutel `streaming.providers.xai.apiKey` of `XAI_API_KEY`;
    endpoint `wss://api.x.ai/v1/stt`; codering `mulaw`; samplefrequentie `8000`;
    `endpointingMs: 800`; `interimResults: true`.

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                streamPath: "/voice/stream",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}", // optional if XAI_API_KEY is set
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## TTS voor gesprekken

Voice Call gebruikt de kernconfiguratie `messages.tts` voor streaming
spraak tijdens gesprekken. Je kunt deze overschrijven onder de pluginconfiguratie met
**dezelfde vorm** — deze wordt diep samengevoegd met `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

<Warning>
**Microsoft-spraak wordt genegeerd voor spraakgesprekken.** Telefonieaudio vereist PCM;
het huidige Microsoft-transport stelt geen telefonie-PCM-uitvoer beschikbaar.
</Warning>

Gedragsnotities:

- Verouderde `tts.<provider>`-sleutels binnen pluginconfiguratie (`openai`, `elevenlabs`, `microsoft`, `edge`) worden hersteld door `openclaw doctor --fix`; vastgelegde configuratie moet `tts.providers.<provider>` gebruiken.
- Kern-TTS wordt gebruikt wanneer Twilio-mediastreaming is ingeschakeld; anders vallen gesprekken terug op providerspecifieke stemmen.
- Als een Twilio-mediastream al actief is, valt Voice Call niet terug op TwiML `<Say>`. Als telefonie-TTS in die toestand niet beschikbaar is, mislukt het afspeelverzoek in plaats van twee afspeelpaden te mengen.
- Wanneer telefonie-TTS terugvalt op een secundaire provider, logt Voice Call een waarschuwing met de providerketen (`from`, `to`, `attempts`) voor foutopsporing.
- Wanneer Twilio-barge-in of het afbreken van de stream de wachtende TTS-wachtrij wist, worden afspeelverzoeken in de wachtrij afgehandeld in plaats van bellers te laten wachten op voltooiing van het afspelen.

### TTS-voorbeelden

<Tabs>
  <Tab title="Alleen kern-TTS">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Overschrijven naar ElevenLabs (alleen gesprekken)">
```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenAI-modeloverschrijving (diep samenvoegen)">
```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

## Inkomende gesprekken

Inkomend beleid staat standaard op `disabled`. Stel het volgende in om inkomende gesprekken in te schakelen:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` is een beller-ID-filter met lage zekerheid. De
plugin normaliseert de door de provider geleverde `From`-waarde en vergelijkt die met
`allowFrom`. Webhook-verificatie authenticeert providerlevering en
payloadintegriteit, maar bewijst **niet** het eigenaarschap van een PSTN/VoIP-bellernummer.
Behandel `allowFrom` als beller-ID-filtering, niet als sterke belleridentiteit.
</Warning>

Automatische antwoorden gebruiken het agentsysteem. Stem af met `responseModel`,
`responseSystemPrompt` en `responseTimeoutMs`.

### Contract voor gesproken uitvoer

Voor automatische antwoorden voegt Voice Call een strikt contract voor gesproken uitvoer toe aan
de systeemprompt:

```text
{"spoken":"..."}
```

Voice Call extraheert spraaktekst defensief:

- Negeert payloads die zijn gemarkeerd als redeneer-/foutinhoud.
- Parseert directe JSON, omheinde JSON of inline `"spoken"`-sleutels.
- Valt terug op platte tekst en verwijdert waarschijnlijke inleidende alinea's voor planning/meta-inhoud.

Dit houdt gesproken afspelen gericht op tekst voor de beller en voorkomt
dat planningstekst in audio lekt.

### Opstartgedrag van gesprekken

Voor uitgaande `conversation`-gesprekken is de afhandeling van het eerste bericht gekoppeld aan de live
afspeelstatus:

- Het wissen van de barge-in-wachtrij en automatische antwoorden worden alleen onderdrukt terwijl de eerste begroeting actief wordt uitgesproken.
- Als het eerste afspelen mislukt, keert het gesprek terug naar `listening` en blijft het eerste bericht in de wachtrij voor een nieuwe poging.
- Eerste afspelen voor Twilio-streaming start bij streamverbinding zonder extra vertraging.
- Barge-in breekt actief afspelen af en wist Twilio TTS-items die in de wachtrij staan maar nog niet worden afgespeeld. Gewiste items worden opgelost als overgeslagen, zodat vervolgresponslogica kan doorgaan zonder te wachten op audio die nooit wordt afgespeeld.
- Realtime-spraakgesprekken gebruiken de eigen openingsturn van de realtime-stream. Voice Call plaatst **geen** verouderde `<Say>` TwiML-update voor dat eerste bericht, zodat uitgaande `<Connect><Stream>`-sessies gekoppeld blijven.

### Graceperiode voor Twilio-streamverbreking

Wanneer een Twilio-mediastream de verbinding verbreekt, wacht Voice Call **2000 ms** voordat
het gesprek automatisch wordt beëindigd:

- Als de stream binnen dat venster opnieuw verbinding maakt, wordt automatisch beëindigen geannuleerd.
- Als er na de graceperiode geen stream opnieuw wordt geregistreerd, wordt het gesprek beëindigd om vastgelopen actieve gesprekken te voorkomen.

## Opruimer voor verouderde gesprekken

Gebruik `staleCallReaperSeconds` om gesprekken te beëindigen die nooit een terminale
Webhook ontvangen (bijvoorbeeld notify-modusgesprekken die nooit worden voltooid). De standaardwaarde
is `0` (uitgeschakeld).

Aanbevolen bereiken:

- **Productie:** `120`–`300` seconden voor notify-achtige flows.
- Houd deze waarde **hoger dan `maxDurationSeconds`** zodat normale gesprekken kunnen eindigen. Een goed startpunt is `maxDurationSeconds + 30–60` seconden.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Webhook-beveiliging

Wanneer er een proxy of tunnel vóór de Gateway staat, reconstrueert de plugin
de openbare URL voor handtekeningverificatie. Deze opties bepalen
welke doorgestuurde headers worden vertrouwd:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Hosts uit forwarding-headers toestaan.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Doorgestuurde headers vertrouwen zonder allowlist.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Doorgestuurde headers alleen vertrouwen wanneer het externe IP-adres van het verzoek overeenkomt met de lijst.
</ParamField>

Aanvullende bescherming:

- Webhook-**replaybescherming** is ingeschakeld voor Twilio en Plivo. Opnieuw afgespeelde geldige Webhook-verzoeken worden bevestigd maar overgeslagen voor neveneffecten.
- Twilio-gespreksturns bevatten een token per turn in `<Gather>`-callbacks, zodat verouderde/opnieuw afgespeelde spraakcallbacks niet kunnen voldoen aan een nieuwere wachtende transcriptieturn.
- Niet-geauthenticeerde Webhook-verzoeken worden afgewezen voordat de body wordt gelezen wanneer de vereiste handtekeningheaders van de provider ontbreken.
- De voice-call-Webhook gebruikt het gedeelde pre-auth-bodyprofiel (64 KB / 5 seconden) plus een limiet per IP voor gelijktijdige verzoeken vóór handtekeningverificatie.

Voorbeeld met een stabiele openbare host:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # alias for call
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # summarize turn latency from logs
openclaw voicecall expose --mode funnel
```

Wanneer de Gateway al actief is, delegeren operationele `voicecall`-opdrachten
naar de voice-call-runtime die eigendom is van de Gateway, zodat de CLI geen tweede
Webhook-server bindt. Als er geen Gateway bereikbaar is, vallen de opdrachten terug op een
zelfstandige CLI-runtime.

`latency` leest `calls.jsonl` uit het standaardopslagpad voor voice-call.
Gebruik `--file <path>` om naar een ander logbestand te verwijzen en `--last <n>` om
de analyse te beperken tot de laatste N records (standaard 200). Uitvoer bevat p50/p90/p99
voor turnlatentie en luister-wachttijden.

## Agenttool

Toolnaam: `voice_call`.

| Actie           | Argumenten                                  |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Deze repo levert een bijbehorend skilldocument op `skills/voice-call/SKILL.md`.

## Gateway RPC

| Methode              | Argumenten                                  |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` is alleen geldig met `mode: "conversation"`. Gesprekken in notify-modus
moeten `voicecall.dtmf` gebruiken nadat het gesprek bestaat als ze na verbinding
cijfers nodig hebben.

## Probleemoplossing

### Configuratie mislukt bij Webhook-blootstelling

Voer setup uit vanuit dezelfde omgeving waarin de Gateway draait:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Voor `twilio`, `telnyx` en `plivo` moet `webhook-exposure` groen zijn. Een
geconfigureerde `publicUrl` faalt nog steeds wanneer deze naar lokale of
privénetwerkruimte wijst, omdat de carrier niet naar die adressen kan
terugbellen. Gebruik geen `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`,
`172.16.x`-`172.31.x`, `192.168.x`, `169.254.x`, `fc00::/7` of `fd00::/8` als
`publicUrl`.

Gebruik één openbaar exposurepad:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // or
          tunnel: { provider: "ngrok" },
          // or
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

Start na het wijzigen van de configuratie de Gateway opnieuw of laad deze
opnieuw, en voer vervolgens uit:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` is een proefrun tenzij je `--yes` meegeeft.

### Providerreferenties falen

Controleer de geselecteerde provider en de vereiste referentievelden:

- Twilio: `twilio.accountSid`, `twilio.authToken` en `fromNumber`, of
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` en `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` en
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` en `fromNumber`.

Referenties moeten aanwezig zijn op de Gateway-host. Het bewerken van een lokaal
shellprofiel heeft geen invloed op een al draaiende Gateway totdat deze opnieuw
start of zijn omgeving opnieuw laadt.

### Gesprekken starten maar providerwebhooks komen niet binnen

Controleer of de providerconsole naar de exacte openbare Webhook-URL wijst:

```text
https://voice.example.com/voice/webhook
```

Inspecteer daarna de runtimestatus:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Veelvoorkomende oorzaken:

- `publicUrl` wijst naar een ander pad dan `serve.path`.
- De tunnel-URL is gewijzigd nadat de Gateway is gestart.
- Een proxy stuurt de aanvraag door, maar verwijdert of herschrijft host/proto-headers.
- Firewall of DNS routeert de openbare hostnaam naar iets anders dan de Gateway.
- De Gateway is opnieuw gestart zonder dat de Voice Call Plugin is ingeschakeld.

Wanneer een reverse proxy of tunnel vóór de Gateway staat, stel je
`webhookSecurity.allowedHosts` in op de openbare hostnaam, of gebruik je
`webhookSecurity.trustedProxyIPs` voor een bekend proxyadres. Gebruik
`webhookSecurity.trustForwardingHeaders` alleen wanneer de proxygrens onder jouw
controle staat.

### Handtekeningverificatie faalt

Providerhandtekeningen worden gecontroleerd tegen de openbare URL die OpenClaw
reconstrueert uit de inkomende aanvraag. Als handtekeningen falen:

- Controleer of de provider-Webhook-URL exact overeenkomt met `publicUrl`, inclusief
  schema, host en pad.
- Werk voor ngrok-free-tier-URL’s `publicUrl` bij wanneer de tunnelhostnaam wijzigt.
- Zorg ervoor dat de proxy de oorspronkelijke host- en proto-headers behoudt, of configureer
  `webhookSecurity.allowedHosts`.
- Schakel `skipSignatureVerification` niet in buiten lokaal testen.

### Google Meet Twilio-joins falen

Google Meet gebruikt deze Plugin voor Twilio-inbeljoins. Controleer eerst Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Controleer daarna expliciet het Google Meet-transport:

```bash
openclaw googlemeet setup --transport twilio
```

Als Voice Call groen is maar de Meet-deelnemer nooit deelneemt, controleer dan het
Meet-inbelnummer, de PIN en `--dtmf-sequence`. Het telefoongesprek kan gezond zijn
terwijl de vergadering een onjuiste DTMF-reeks weigert of negeert.

Google Meet geeft de Meet-DTMF-reeks en introtekst door aan `voicecall.start`.
Voor Twilio-gesprekken serveert Voice Call eerst de DTMF TwiML, leidt terug naar de
Webhook en opent daarna de realtime mediastream zodat de opgeslagen intro wordt
gegenereerd nadat de telefoondeelnemer aan de vergadering heeft deelgenomen.

Gebruik `openclaw logs --follow` voor de live fasetrace. Een gezonde Twilio
Meet-join logt deze volgorde:

- Google Meet delegeert de Twilio-join aan Voice Call.
- Voice Call slaat pre-connect DTMF TwiML op.
- Twilio initiële TwiML wordt geconsumeerd en geserveerd vóór realtime afhandeling.
- Voice Call serveert realtime TwiML voor het Twilio-gesprek.
- De realtime bridge start met de initiële begroeting in de wachtrij.

`openclaw voicecall tail` toont nog steeds persistente gespreksrecords; het is
nuttig voor gespreksstatus en transcripties, maar niet elke Webhook-/realtime
overgang verschijnt daar.

### Realtime gesprek heeft geen spraak

Controleer of slechts één audiomodus is ingeschakeld. `realtime.enabled` en
`streaming.enabled` kunnen niet allebei true zijn.

Controleer voor realtime Twilio-gesprekken ook:

- Een realtime provider-Plugin is geladen en geregistreerd.
- `realtime.provider` is niet ingesteld of noemt een geregistreerde provider.
- De provider-API-sleutel is beschikbaar voor het Gateway-proces.
- `openclaw logs --follow` toont dat realtime TwiML is geserveerd, de realtime bridge
  is gestart en de initiële begroeting in de wachtrij is geplaatst.

## Gerelateerd

- [Praatmodus](/nl/nodes/talk)
- [Tekst-naar-spraak](/nl/tools/tts)
- [Voice wake](/nl/nodes/voicewake)
