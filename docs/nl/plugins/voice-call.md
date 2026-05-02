---
read_when:
    - Je wilt vanuit OpenClaw een uitgaande spraakoproep starten
    - Je configureert of ontwikkelt de Plugin voor spraakoproepen
    - Je hebt realtime spraak of streamingtranscriptie via telefonie nodig
sidebarTitle: Voice call
summary: Voer uitgaande spraakoproepen uit en accepteer inkomende spraakoproepen via Twilio, Telnyx of Plivo, met optionele realtime-spraak en streamingtranscriptie
title: Plugin voor spraakoproepen
x-i18n:
    generated_at: "2026-05-02T11:24:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f04b14ad1aafcc6036aff2301d9d0210c0cde333051ed89d498c51b4e0c0353
    source_path: plugins/voice-call.md
    workflow: 16
---

Spraakoproepen voor OpenClaw via een plugin. Ondersteunt uitgaande meldingen,
gesprekken met meerdere beurten, full-duplex realtime spraak, streaming
transcriptie en inkomende oproepen met allowlist-beleid.

**Huidige providers:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML-overdracht + GetInput
spraak), `mock` (dev/geen netwerk).

<Note>
De Voice Call-plugin draait **binnen het Gateway-proces**. Als je een
externe Gateway gebruikt, installeer en configureer je de plugin op de machine
waarop de Gateway draait en start je daarna de Gateway opnieuw om deze te laden.
</Note>

## Snel starten

<Steps>
  <Step title="Installeer de plugin">
    <Tabs>
      <Tab title="Vanaf npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="Vanuit een lokale map (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Als npm meldt dat het OpenClaw-beheerde pakket is verouderd, komt die pakketversie
    uit een oudere externe pakketreeks; gebruik een huidige verpakte OpenClaw-
    build of het lokale mappad totdat een nieuwer npm-pakket is gepubliceerd.

    Start daarna de Gateway opnieuw zodat de plugin wordt geladen.

  </Step>
  <Step title="Configureer provider en Webhook">
    Stel configuratie in onder `plugins.entries.voice-call.config` (zie
    [Configuratie](#configuration) hieronder voor de volledige vorm). Minimaal:
    `provider`, providerreferenties, `fromNumber` en een publiek
    bereikbare Webhook-URL.
  </Step>
  <Step title="Controleer de installatie">
    ```bash
    openclaw voicecall setup
    ```

    De standaarduitvoer is leesbaar in chatlogs en terminals. Deze controleert
    of de plugin is ingeschakeld, providerreferenties, Webhook-blootstelling en dat
    slechts één audiomodus (`streaming` of `realtime`) actief is. Gebruik
    `--json` voor scripts.

  </Step>
  <Step title="Rooktest">
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
Als `publicUrl`, de tunnel-URL, de Tailscale-URL of de serve-terugval
uitkomt op loopback of privé-netwerkruimte, mislukt de installatie in plaats van
een provider te starten die geen carrier-Webhooks kan ontvangen.
</Warning>

## Configuratie

Als `enabled: true` is ingesteld maar de geselecteerde provider referenties mist,
loggen de Gateway-opstartlogs een waarschuwing dat de installatie onvolledig is met de ontbrekende sleutels en
wordt het starten van de runtime overgeslagen. Commando's, RPC-aanroepen en agenttools
geven bij gebruik nog steeds exact de ontbrekende providerconfiguratie terug.

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
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, how can I help?",
              responseSystemPrompt: "You are a concise baseball card specialist.",
              tts: {
                providers: {
                  openai: { voice: "alloy" },
                },
              },
            },
          },

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
    - `skipSignatureVerification` is alleen voor lokaal testen.
    - Stel op de gratis ngrok-laag `publicUrl` in op de exacte ngrok-URL; handtekeningverificatie wordt altijd afgedwongen.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` staat Twilio-Webhooks met ongeldige handtekeningen **alleen** toe wanneer `tunnel.provider="ngrok"` en `serve.bind` loopback is (lokale ngrok-agent). Alleen lokale dev.
    - Gratis ngrok-URL's kunnen wijzigen of tussenschermgedrag toevoegen; als `publicUrl` afwijkt, mislukken Twilio-handtekeningen. Productie: geef de voorkeur aan een stabiel domein of een Tailscale-funnel.

  </Accordion>
  <Accordion title="Streaming-verbindingslimieten">
    - `streaming.preStartTimeoutMs` sluit sockets die nooit een geldig `start`-frame verzenden.
    - `streaming.maxPendingConnections` beperkt het totale aantal niet-geauthenticeerde pre-start-sockets.
    - `streaming.maxPendingConnectionsPerIp` beperkt niet-geauthenticeerde pre-start-sockets per bron-IP.
    - `streaming.maxConnections` beperkt het totale aantal geopende mediastream-sockets (in behandeling + actief).

  </Accordion>
  <Accordion title="Migraties van legacy-configuratie">
    Oudere configuraties die `provider: "log"`, `twilio.from` of legacy
    `streaming.*` OpenAI-sleutels gebruiken, worden herschreven door `openclaw doctor --fix`.
    Runtime-terugval accepteert voorlopig nog de oude voice-call-sleutels, maar
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

## Sessiebereik

Standaard gebruikt Voice Call `sessionScope: "per-phone"`, zodat herhaalde oproepen van
dezelfde beller gespreksgeheugen behouden. Stel `sessionScope: "per-call"` in wanneer
elke carrier-oproep met nieuwe context moet starten, bijvoorbeeld receptie,
boeking, IVR- of Google Meet-bridgeflows waarbij hetzelfde telefoonnummer
verschillende vergaderingen kan vertegenwoordigen.

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
- Gebundelde realtime spraakproviders: Google Gemini Live (`google`) en OpenAI (`openai`), geregistreerd door hun providerplugins.
- Providerbeheerde ruwe configuratie staat onder `realtime.providers.<providerId>`.
- Voice Call stelt standaard de gedeelde realtime-tool `openclaw_agent_consult` beschikbaar. Het realtime-model kan deze aanroepen wanneer de beller vraagt om dieper redeneren, actuele informatie of normale OpenClaw-tools.
- `realtime.fastContext.enabled` is standaard uitgeschakeld. Wanneer ingeschakeld, doorzoekt Voice Call eerst geïndexeerd geheugen/sessiecontext voor de consultvraag en retourneert die fragmenten aan het realtime-model binnen `realtime.fastContext.timeoutMs`, voordat alleen wordt teruggevallen op de volledige consult-agent als `realtime.fastContext.fallbackToConsult` true is.
- Als `realtime.provider` naar een niet-geregistreerde provider wijst, of als er helemaal geen realtime spraakprovider is geregistreerd, logt Voice Call een waarschuwing en slaat realtime media over in plaats van de hele plugin te laten mislukken.
- Consult-sessiesleutels hergebruiken de opgeslagen oproepsessie wanneer beschikbaar en vallen daarna terug op de geconfigureerde `sessionScope` (`per-phone` standaard, of `per-call` voor geïsoleerde oproepen).

### Toolbeleid

`realtime.toolPolicy` beheert de consult-run:

| Beleid           | Gedrag                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Stel de consult-tool beschikbaar en beperk de reguliere agent tot `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` en `memory_get`. |
| `owner`          | Stel de consult-tool beschikbaar en laat de reguliere agent het normale agent-toolbeleid gebruiken.                                                      |
| `none`           | Stel de consult-tool niet beschikbaar. Aangepaste `realtime.tools` worden nog steeds doorgegeven aan de realtime-provider.                               |

### Voorbeelden van realtime-providers

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
[OpenAI-provider](/nl/providers/openai) voor providerspecifieke realtime spraakopties.

## Streaming transcriptie

`streaming` selecteert een realtime transcriptieprovider voor live oproepaudio.

Huidig runtimegedrag:

- `streaming.provider` is optioneel. Als dit niet is ingesteld, gebruikt Voice Call de eerste geregistreerde realtime-transcriptieprovider.
- Gebundelde realtime-transcriptieproviders: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) en xAI (`xai`), geregistreerd door hun provider-plugins.
- Ruwe configuratie die eigendom is van de provider staat onder `streaming.providers.<providerId>`.
- Nadat Twilio een geaccepteerd stream-`start`-bericht verstuurt, registreert Voice Call de stream onmiddellijk, zet het binnenkomende media in de wachtrij via de transcriptieprovider terwijl de provider verbinding maakt, en start het de eerste begroeting pas nadat realtime-transcriptie klaar is.
- Als `streaming.provider` naar een niet-geregistreerde provider verwijst, of als er geen provider is geregistreerd, logt Voice Call een waarschuwing en slaat het mediastreaming over in plaats van de hele Plugin te laten mislukken.

### Voorbeelden van streamingproviders

<Tabs>
  <Tab title="OpenAI">
    Standaardwaarden: API-sleutel `streaming.providers.openai.apiKey` of
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
    Standaardwaarden: API-sleutel `streaming.providers.xai.apiKey` of `XAI_API_KEY`;
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

## TTS voor oproepen

Voice Call gebruikt de kernconfiguratie `messages.tts` voor streaming
spraak tijdens oproepen. Je kunt deze overschrijven onder de Plugin-configuratie met
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
**Microsoft-spraak wordt genegeerd voor spraakoproepen.** Telefonieaudio vereist PCM;
het huidige Microsoft-transport stelt geen telefonie-PCM-uitvoer beschikbaar.
</Warning>

Gedragsnotities:

- Verouderde `tts.<provider>`-sleutels binnen Plugin-configuratie (`openai`, `elevenlabs`, `microsoft`, `edge`) worden gerepareerd door `openclaw doctor --fix`; vastgelegde configuratie moet `tts.providers.<provider>` gebruiken.
- Kern-TTS wordt gebruikt wanneer Twilio-mediastreaming is ingeschakeld; anders vallen oproepen terug op provider-native stemmen.
- Als een Twilio-mediastream al actief is, valt Voice Call niet terug op TwiML `<Say>`. Als telefonie-TTS in die toestand niet beschikbaar is, mislukt het afspeelverzoek in plaats van twee afspeelpaden te mengen.
- Wanneer telefonie-TTS terugvalt op een secundaire provider, logt Voice Call een waarschuwing met de providerketen (`from`, `to`, `attempts`) voor foutopsporing.
- Wanneer Twilio-barge-in of het afbreken van de stream de wachtende TTS-wachtrij wist, worden afspeelverzoeken in de wachtrij afgehandeld in plaats van bellers te laten wachten op voltooiing van het afspelen.

### TTS-voorbeelden

<Tabs>
  <Tab title="Core TTS only">
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
  <Tab title="Override to ElevenLabs (calls only)">
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
  <Tab title="OpenAI model override (deep-merge)">
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

## Inkomende oproepen

Het beleid voor inkomende oproepen staat standaard op `disabled`. Stel het volgende in om inkomende oproepen in te schakelen:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` is een beller-ID-filter met lage zekerheid. De
Plugin normaliseert de door de provider geleverde `From`-waarde en vergelijkt deze met
`allowFrom`. Webhook-verificatie verifieert providerlevering en
payloadintegriteit, maar bewijst **niet** het eigendom van een PSTN/VoIP-bellernummer.
Behandel `allowFrom` als beller-ID-filtering, niet als sterke belleridentiteit.
</Warning>

Automatische antwoorden gebruiken het agentsysteem. Stem af met `responseModel`,
`responseSystemPrompt` en `responseTimeoutMs`.

### Routing per nummer

Gebruik `numbers` wanneer één Voice Call-Plugin oproepen voor meerdere telefoon
nummers ontvangt en elk nummer zich als een andere lijn moet gedragen. Zo kan één
nummer een informele persoonlijke assistent gebruiken, terwijl een ander een zakelijke
persona, een andere antwoordagent en een andere TTS-stem gebruikt.

Routes worden geselecteerd op basis van het door de provider geleverde gekozen `To`-nummer. Sleutels moeten
E.164-nummers zijn. Wanneer een oproep binnenkomt, lost Voice Call de overeenkomende route één keer op,
slaat het de overeenkomende route op in het oproeprecord en hergebruikt die effectieve configuratie
voor de begroeting, het klassieke automatische-antwoordpad, het realtime-consultatiepad en TTS-
afspelen. Als er geen route overeenkomt, wordt de globale Voice Call-configuratie gebruikt.
Uitgaande oproepen gebruiken `numbers` niet; geef het uitgaande doel, bericht en
sessie expliciet door bij het starten van de oproep.

Route-overschrijvingen ondersteunen momenteel:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

De `tts`-routewaarde wordt diep samengevoegd bovenop de globale Voice Call-`tts`-configuratie, zodat
je meestal alleen de providerstem hoeft te overschrijven:

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { voice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

### Contract voor gesproken uitvoer

Voor automatische antwoorden voegt Voice Call een strikt contract voor gesproken uitvoer toe aan
de systeemprompt:

```text
{"spoken":"..."}
```

Voice Call extraheert spraaktekst defensief:

- Negeert payloads die zijn gemarkeerd als redeneer-/foutinhoud.
- Parseert directe JSON, omheinde JSON of inline `"spoken"`-sleutels.
- Valt terug op platte tekst en verwijdert waarschijnlijk inleidende alinea's met planning/meta-inhoud.

Dit houdt gesproken afspelen gericht op bellergerichte tekst en voorkomt
dat planningstekst in audio lekt.

### Opstartgedrag van gesprekken

Voor uitgaande `conversation`-oproepen is de verwerking van het eerste bericht gekoppeld aan de live
afspeelstatus:

- Het wissen van de barge-in-wachtrij en automatische antwoorden worden alleen onderdrukt terwijl de eerste begroeting actief wordt uitgesproken.
- Als het eerste afspelen mislukt, keert de oproep terug naar `listening` en blijft het eerste bericht in de wachtrij voor een nieuwe poging.
- Het eerste afspelen voor Twilio-streaming start bij streamverbinding zonder extra vertraging.
- Barge-in breekt actief afspelen af en wist Twilio TTS-items die in de wachtrij staan maar nog niet worden afgespeeld. Gewiste items worden afgehandeld als overgeslagen, zodat vervolglogica voor antwoorden kan doorgaan zonder te wachten op audio die nooit wordt afgespeeld.
- Realtime-spraakgesprekken gebruiken de eigen openingsbeurt van de realtime-stream. Voice Call plaatst **geen** verouderde `<Say>`-TwiML-update voor dat eerste bericht, zodat uitgaande `<Connect><Stream>`-sessies gekoppeld blijven.

### Respijt bij verbreking van Twilio-stream

Wanneer een Twilio-mediastream wordt verbroken, wacht Voice Call **2000 ms** voordat
de oproep automatisch wordt beëindigd:

- Als de stream tijdens dat venster opnieuw verbinding maakt, wordt automatisch beëindigen geannuleerd.
- Als er na de respijtperiode geen stream opnieuw wordt geregistreerd, wordt de oproep beëindigd om vastgelopen actieve oproepen te voorkomen.

## Reaper voor verlopen oproepen

Gebruik `staleCallReaperSeconds` om oproepen te beëindigen die nooit een terminale
Webhook ontvangen (bijvoorbeeld oproepen in meldingsmodus die nooit worden voltooid). De standaardwaarde
is `0` (uitgeschakeld).

Aanbevolen bereiken:

- **Productie:** `120`–`300` seconden voor melding-achtige flows.
- Houd deze waarde **hoger dan `maxDurationSeconds`**, zodat normale oproepen kunnen worden afgerond. Een goed startpunt is `maxDurationSeconds + 30–60` seconden.

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

Wanneer er een proxy of tunnel vóór de Gateway staat, reconstrueert de Plugin
de openbare URL voor handtekeningverificatie. Deze opties bepalen
welke doorgestuurde headers worden vertrouwd:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Sta hosts toe uit forwarding-headers.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Vertrouw doorgestuurde headers zonder allowlist.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Vertrouw doorgestuurde headers alleen wanneer het externe IP-adres van het verzoek overeenkomt met de lijst.
</ParamField>

Aanvullende beveiligingen:

- Webhook-**replaybescherming** is ingeschakeld voor Twilio en Plivo. Opnieuw afgespeelde geldige Webhook-verzoeken worden bevestigd maar overgeslagen voor bijwerkingen.
- Twilio-gespreksbeurten bevatten een token per beurt in `<Gather>`-callbacks, zodat verlopen/opnieuw afgespeelde spraakcallbacks niet kunnen voldoen aan een nieuwere wachtende transcriptiebeurt.
- Niet-geverifieerde Webhook-verzoeken worden geweigerd vóór body-reads wanneer de vereiste handtekeningheaders van de provider ontbreken.
- De voice-call-Webhook gebruikt het gedeelde pre-auth-bodyprofiel (64 KB / 5 seconden) plus een in-flight-limiet per IP vóór handtekeningverificatie.

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

Wanneer de Gateway al actief is, delegeren operationele `voicecall`-commando's
naar de voice-call-runtime die eigendom is van de Gateway, zodat de CLI geen tweede
Webhook-server bindt. Als er geen Gateway bereikbaar is, vallen de commando's terug op een
zelfstandige CLI-runtime.

`latency` leest `calls.jsonl` uit het standaardopslagpad voor spraakoproepen.
Gebruik `--file <path>` om naar een ander logbestand te verwijzen en `--last <n>` om de
analyse te beperken tot de laatste N records (standaard 200). De uitvoer bevat p50/p90/p99
voor beurtlatentie en luister-wachttijden.

## Agenttool

Toolnaam: `voice_call`.

| Actie           | Argumenten                                |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Deze repo bevat een bijbehorend Skill-document op `skills/voice-call/SKILL.md`.

## Gateway-RPC

| Methode              | Argumenten                                |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` is alleen geldig met `mode: "conversation"`. Oproepen in meldingsmodus
moeten `voicecall.dtmf` gebruiken nadat de oproep bestaat als ze cijfers na verbinding
nodig hebben.

## Probleemoplossing

### Setup mislukt bij Webhook-blootstelling

Voer setup uit vanuit dezelfde omgeving waarin de Gateway draait:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Voor `twilio`, `telnyx` en `plivo` moet `webhook-exposure` groen zijn. Een
geconfigureerde `publicUrl` mislukt nog steeds wanneer deze naar lokale of privénetwerkruimte
wijst, omdat de provider niet naar die adressen kan terugbellen. Gebruik
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` of `fd00::/8` niet als `publicUrl`.

Uitgaande Twilio-oproepen in meldingsmodus verzenden hun initiële `<Say>` TwiML rechtstreeks in
de aanvraag om de oproep te maken, dus het eerste gesproken bericht is niet afhankelijk van Twilio
dat Webhook-TwiML ophaalt. Een openbare Webhook is nog steeds vereist voor statuscallbacks,
gespreksoproepen, DTMF vóór verbinding, realtime streams en oproepbeheer na verbinding.

Gebruik één openbaar blootstellingspad:

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

Start of herlaad na het wijzigen van de configuratie de Gateway en voer daarna uit:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` is een proefrun tenzij je `--yes` meegeeft.

### Providerreferenties mislukken

Controleer de geselecteerde provider en de vereiste referentievelden:

- Twilio: `twilio.accountSid`, `twilio.authToken` en `fromNumber`, of
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` en `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` en
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` en `fromNumber`.

Referenties moeten op de Gateway-host bestaan. Het bewerken van een lokaal shellprofiel heeft
geen invloed op een al draaiende Gateway totdat deze opnieuw wordt gestart of zijn
omgeving opnieuw laadt.

### Oproepen starten, maar provider-Webhooks komen niet aan

Bevestig dat de providerconsole naar de exacte openbare Webhook-URL verwijst:

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
- Een proxy stuurt de aanvraag door maar verwijdert of herschrijft host-/proto-headers.
- Firewall of DNS routeert de openbare hostnaam naar iets anders dan de Gateway.
- De Gateway is opnieuw gestart zonder dat de Voice Call-Plugin is ingeschakeld.

Wanneer een reverse proxy of tunnel vóór de Gateway staat, stel je
`webhookSecurity.allowedHosts` in op de openbare hostnaam, of gebruik je
`webhookSecurity.trustedProxyIPs` voor een bekend proxyadres. Gebruik
`webhookSecurity.trustForwardingHeaders` alleen wanneer de proxygrens onder
jouw beheer valt.

### Handtekeningverificatie mislukt

Providerhandtekeningen worden gecontroleerd tegen de openbare URL die OpenClaw reconstrueert
uit de inkomende aanvraag. Als handtekeningen mislukken:

- Bevestig dat de provider-Webhook-URL exact overeenkomt met `publicUrl`, inclusief
  schema, host en pad.
- Werk bij ngrok-URL's op de gratis laag `publicUrl` bij wanneer de tunnelhostnaam verandert.
- Zorg dat de proxy de oorspronkelijke host- en proto-headers behoudt, of configureer
  `webhookSecurity.allowedHosts`.
- Schakel `skipSignatureVerification` niet in buiten lokale tests.

### Google Meet Twilio-deelnames mislukken

Google Meet gebruikt deze Plugin voor Twilio-inbeldeelnames. Verifieer eerst Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Verifieer daarna expliciet het Google Meet-transport:

```bash
openclaw googlemeet setup --transport twilio
```

Als Voice Call groen is maar de Meet-deelnemer nooit deelneemt, controleer dan het Meet-
inbelnummer, de pincode en `--dtmf-sequence`. De telefoongesprek kan gezond zijn terwijl
de vergadering een onjuiste DTMF-reeks weigert of negeert.

Google Meet geeft de Meet-DTMF-reeks en introtekst door aan `voicecall.start`.
Voor Twilio-oproepen serveert Voice Call eerst de DTMF-TwiML, leidt terug naar de
Webhook en opent daarna de realtime mediastream zodat de opgeslagen intro wordt gegenereerd
nadat de telefoondeelnemer aan de vergadering heeft deelgenomen.

Gebruik `openclaw logs --follow` voor de live fasetrace. Een gezonde Twilio Meet-
deelname logt deze volgorde:

- Google Meet delegeert de Twilio-deelname aan Voice Call.
- Voice Call slaat DTMF-TwiML vóór verbinding op.
- Initiële Twilio-TwiML wordt verbruikt en geserveerd vóór realtime verwerking.
- Voice Call serveert realtime TwiML voor de Twilio-oproep.
- De realtime bridge start met de initiële begroeting in de wachtrij.

`openclaw voicecall tail` toont nog steeds persistente oproeprecords; dit is nuttig voor
oproepstatus en transcripties, maar niet elke Webhook-/realtime overgang verschijnt
daar.

### Realtime oproep heeft geen spraak

Bevestig dat slechts één audiomodus is ingeschakeld. `realtime.enabled` en
`streaming.enabled` kunnen niet allebei true zijn.

Controleer voor realtime Twilio-oproepen ook:

- Een realtime provider-Plugin is geladen en geregistreerd.
- `realtime.provider` is niet ingesteld of noemt een geregistreerde provider.
- De provider-API-sleutel is beschikbaar voor het Gateway-proces.
- `openclaw logs --follow` toont dat realtime TwiML is geserveerd, de realtime bridge
  is gestart en de initiële begroeting in de wachtrij is geplaatst.

## Gerelateerd

- [Praatmodus](/nl/nodes/talk)
- [Tekst-naar-spraak](/nl/tools/tts)
- [Spraakactivering](/nl/nodes/voicewake)
