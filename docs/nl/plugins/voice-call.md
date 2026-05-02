---
read_when:
    - Je wilt vanuit OpenClaw een uitgaand spraakgesprek starten
    - Je configureert of ontwikkelt de voice-call-plugin
    - Je hebt realtime spraak of streamingtranscriptie via telefonie nodig
sidebarTitle: Voice call
summary: Voer uitgaande spraakoproepen en neem inkomende spraakoproepen aan via Twilio, Telnyx of Plivo, met optionele realtime spraak en streamingtranscriptie
title: Plugin voor spraakoproepen
x-i18n:
    generated_at: "2026-05-02T22:22:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 18a9a0d7095ec92036b516cc26c69219a0a2fd9bb8e0cb2e7509123bb4f3f65a
    source_path: plugins/voice-call.md
    workflow: 16
---

Spraakoproepen voor OpenClaw via een Plugin. Ondersteunt uitgaande meldingen,
gesprekken over meerdere beurten, realtime full-duplex-spraak, streaming
transcriptie en inkomende oproepen met allowlist-beleid.

**Huidige providers:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML transfer + GetInput
speech), `mock` (dev/geen netwerk).

<Note>
De Voice Call-Plugin draait **binnen het Gateway-proces**. Als je een
externe Gateway gebruikt, installeer en configureer je de Plugin op de machine waarop
de Gateway draait en herstart je daarna de Gateway om deze te laden.
</Note>

## Snel starten

<Steps>
  <Step title="Install the plugin">
    <Tabs>
      <Tab title="From npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="From a local folder (dev)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Gebruik het kale pakket om de huidige officiële release-tag te volgen. Pin een
    exacte versie alleen wanneer je een reproduceerbare installatie nodig hebt.

    Herstart daarna de Gateway zodat de Plugin wordt geladen.

  </Step>
  <Step title="Configure provider and webhook">
    Stel de configuratie in onder `plugins.entries.voice-call.config` (zie
    [Configuratie](#configuration) hieronder voor de volledige structuur). Minimaal:
    `provider`, providerreferenties, `fromNumber` en een publiek
    bereikbare Webhook-URL.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    De standaarduitvoer is leesbaar in chatlogs en terminals. Deze controleert
    of de Plugin is ingeschakeld, providerreferenties, Webhook-blootstelling en of
    slechts één audiomodus (`streaming` of `realtime`) actief is. Gebruik
    `--json` voor scripts.

  </Step>
  <Step title="Smoke test">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Beide zijn standaard dry-runs. Voeg `--yes` toe om daadwerkelijk een korte
    uitgaande meldingsoproep te plaatsen:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Voor Twilio, Telnyx en Plivo moet setup uitkomen op een **publieke Webhook-URL**.
Als `publicUrl`, de tunnel-URL, de Tailscale-URL of de serve-fallback
uitkomt op loopback- of privénetwerkruimte, mislukt setup in plaats van
een provider te starten die geen carrier-webhooks kan ontvangen.
</Warning>

## Configuratie

Als `enabled: true` is maar de geselecteerde provider referenties mist,
logt het starten van de Gateway een waarschuwing dat de setup onvolledig is met de ontbrekende sleutels en
wordt het starten van de runtime overgeslagen. Commando's, RPC-calls en agenttools
geven nog steeds exact de ontbrekende providerconfiguratie terug wanneer ze worden gebruikt.

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
  <Accordion title="Provider exposure and security notes">
    - Twilio, Telnyx en Plivo vereisen allemaal een **publiek bereikbare** Webhook-URL.
    - `mock` is een lokale dev-provider (geen netwerkoproepen).
    - Telnyx vereist `telnyx.publicKey` (of `TELNYX_PUBLIC_KEY`), tenzij `skipSignatureVerification` true is.
    - `skipSignatureVerification` is alleen voor lokaal testen.
    - Stel op de gratis ngrok-laag `publicUrl` in op de exacte ngrok-URL; handtekeningverificatie wordt altijd afgedwongen.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` staat Twilio-webhooks met ongeldige handtekeningen **alleen** toe wanneer `tunnel.provider="ngrok"` en `serve.bind` loopback is (lokale ngrok-agent). Alleen lokale dev.
    - Gratis ngrok-URL's kunnen wijzigen of interstitial-gedrag toevoegen; als `publicUrl` afwijkt, mislukken Twilio-handtekeningen. Productie: geef de voorkeur aan een stabiel domein of een Tailscale-funnel.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` sluit sockets die nooit een geldig `start`-frame verzenden.
    - `streaming.maxPendingConnections` beperkt het totale aantal ongeauthenticeerde pre-start-sockets.
    - `streaming.maxPendingConnectionsPerIp` beperkt ongeauthenticeerde pre-start-sockets per bron-IP.
    - `streaming.maxConnections` beperkt het totale aantal open mediastream-sockets (pending + actief).

  </Accordion>
  <Accordion title="Legacy config migrations">
    Oudere configuraties die `provider: "log"`, `twilio.from` of legacy
    `streaming.*` OpenAI-sleutels gebruiken, worden herschreven door `openclaw doctor --fix`.
    Runtime-fallback accepteert de oude voice-call-sleutels voorlopig nog, maar
    het herschrijfpad is `openclaw doctor --fix` en de compat-shim is
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
dezelfde beller het gespreksgeheugen behouden. Stel `sessionScope: "per-call"` in wanneer
elke carrier-oproep met nieuwe context moet beginnen, bijvoorbeeld voor receptie,
boekingen, IVR of Google Meet-bridgeflows waarbij hetzelfde telefoonnummer
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
- Gebundelde realtime spraakproviders: Google Gemini Live (`google`) en OpenAI (`openai`), geregistreerd door hun provider-Plugins.
- Provider-eigen raw-configuratie staat onder `realtime.providers.<providerId>`.
- Voice Call stelt standaard de gedeelde realtime tool `openclaw_agent_consult` beschikbaar. Het realtime model kan deze aanroepen wanneer de beller vraagt om diepere redenering, actuele informatie of normale OpenClaw-tools.
- `realtime.fastContext.enabled` staat standaard uit. Wanneer ingeschakeld, zoekt Voice Call eerst in geïndexeerd geheugen/sessiecontext naar de consultvraag en geeft die fragmenten binnen `realtime.fastContext.timeoutMs` terug aan het realtime model, voordat alleen wordt teruggevallen op de volledige consultagent als `realtime.fastContext.fallbackToConsult` true is.
- Als `realtime.provider` naar een niet-geregistreerde provider verwijst, of als er helemaal geen realtime spraakprovider is geregistreerd, logt Voice Call een waarschuwing en slaat realtime media over in plaats van de hele Plugin te laten falen.
- Consultsessiesleutels hergebruiken de opgeslagen oproepsessie wanneer die beschikbaar is, en vallen daarna terug op de geconfigureerde `sessionScope` (standaard `per-phone`, of `per-call` voor geïsoleerde oproepen).

### Toolbeleid

`realtime.toolPolicy` beheert de consult-run:

| Beleid           | Gedrag                                                                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Stel de consulttool beschikbaar en beperk de reguliere agent tot `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` en `memory_get`. |
| `owner`          | Stel de consulttool beschikbaar en laat de reguliere agent het normale agenttoolbeleid gebruiken.                                        |
| `none`           | Stel de consulttool niet beschikbaar. Aangepaste `realtime.tools` worden nog steeds doorgegeven aan de realtime provider.                |

### Voorbeelden van realtime providers

<Tabs>
  <Tab title="Google Gemini Live">
    Standaarden: API-sleutel uit `realtime.providers.google.apiKey`,
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
- Gebundelde realtime-transcriptieproviders: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) en xAI (`xai`), geregistreerd door hun providerplugins.
- Raw configuratie die eigendom is van de provider staat onder `streaming.providers.<providerId>`.
- Nadat Twilio een geaccepteerd stream-`start`-bericht verzendt, registreert Voice Call de stream onmiddellijk, zet inkomende media in de wachtrij via de transcriptieprovider terwijl de provider verbinding maakt, en start de eerste begroeting pas nadat realtime transcriptie gereed is.
- Als `streaming.provider` naar een niet-geregistreerde provider verwijst, of als er geen provider is geregistreerd, logt Voice Call een waarschuwing en slaat mediastreaming over in plaats van de hele Plugin te laten mislukken.

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

## TTS voor oproepen

Voice Call gebruikt de kernconfiguratie `messages.tts` voor streaming
spraak tijdens oproepen. Je kunt deze overschrijven in de Plugin-configuratie met
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
**Microsoft-spraak wordt genegeerd voor spraakoproepen.** Telefonie-audio heeft PCM nodig;
het huidige Microsoft-transport stelt geen telefonie-PCM-uitvoer beschikbaar.
</Warning>

Gedragsnotities:

- Verouderde `tts.<provider>`-sleutels binnen de Plugin-configuratie (`openai`, `elevenlabs`, `microsoft`, `edge`) worden gerepareerd door `openclaw doctor --fix`; vastgelegde configuratie moet `tts.providers.<provider>` gebruiken.
- Core TTS wordt gebruikt wanneer Twilio-mediastreaming is ingeschakeld; anders vallen oproepen terug op providereigen stemmen.
- Als er al een Twilio-mediastream actief is, valt Voice Call niet terug op TwiML `<Say>`. Als telefonie-TTS in die status niet beschikbaar is, mislukt de afspeelaanvraag in plaats van twee afspeelpaden te mengen.
- Wanneer telefonie-TTS terugvalt op een secundaire provider, logt Voice Call een waarschuwing met de providerketen (`from`, `to`, `attempts`) voor foutopsporing.
- Wanneer Twilio barge-in of het afbreken van een stream de wachtende TTS-wachtrij leegt, worden afspeelaanvragen in de wachtrij afgehandeld in plaats van dat bellers blijven hangen in afwachting van voltooiing van het afspelen.

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

Inkomend beleid staat standaard op `disabled`. Stel het volgende in om inkomende oproepen in te schakelen:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` is een caller-ID-filter met lage betrouwbaarheid. De
Plugin normaliseert de door de provider geleverde `From`-waarde en vergelijkt deze met
`allowFrom`. Webhook-verificatie verifieert providerlevering en
payloadintegriteit, maar bewijst **niet** het eigendom van het PSTN/VoIP-bellernummer.
Behandel `allowFrom` als caller-ID-filtering, niet als sterke
belleridentiteit.
</Warning>

Automatische antwoorden gebruiken het agentsysteem. Stem af met `responseModel`,
`responseSystemPrompt` en `responseTimeoutMs`.

### Routering per nummer

Gebruik `numbers` wanneer één Voice Call-Plugin oproepen ontvangt voor meerdere telefoon
nummers en elk nummer zich als een andere lijn moet gedragen. Eén
nummer kan bijvoorbeeld een informele persoonlijke assistent gebruiken, terwijl een ander een zakelijke
persona, een andere antwoordagent en een andere TTS-stem gebruikt.

Routes worden geselecteerd op basis van het door de provider geleverde gekozen `To`-nummer. Sleutels moeten
E.164-nummers zijn. Wanneer een oproep binnenkomt, bepaalt Voice Call de overeenkomende route één keer,
slaat de overeenkomende route op in het oproeprecord, en hergebruikt die effectieve configuratie
voor de begroeting, het klassieke pad voor automatische antwoorden, het realtime consultpad en TTS-
afspelen. Als er geen route overeenkomt, wordt de globale Voice Call-configuratie gebruikt.
Uitgaande oproepen gebruiken `numbers` niet; geef het uitgaande doel, bericht en
de sessie expliciet door bij het starten van de oproep.

Route-overschrijvingen ondersteunen momenteel:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

De routewaarde `tts` wordt diep samengevoegd over de globale Voice Call-`tts`-configuratie, zodat
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
- Parset directe JSON, omheinde JSON of inline `"spoken"`-sleutels.
- Valt terug op platte tekst en verwijdert waarschijnlijke inleidende plannings-/metaparagrafen.

Dit houdt gesproken afspelen gericht op tekst voor de beller en voorkomt
dat planningstekst in audio terechtkomt.

### Opstartgedrag van gesprekken

Voor uitgaande `conversation`-oproepen is afhandeling van het eerste bericht gekoppeld aan de live
afspeelstatus:

- Het legen van de barge-in-wachtrij en automatisch antwoorden worden alleen onderdrukt zolang de eerste begroeting actief wordt uitgesproken.
- Als het eerste afspelen mislukt, keert de oproep terug naar `listening` en blijft het eerste bericht in de wachtrij voor een nieuwe poging.
- Eerste afspelen voor Twilio-streaming start bij streamverbinding zonder extra vertraging.
- Barge-in breekt actief afspelen af en leegt Twilio TTS-items die in de wachtrij staan maar nog niet worden afgespeeld. Geleegde items worden als overgeslagen afgehandeld, zodat vervolglogica voor antwoorden kan doorgaan zonder te wachten op audio die nooit zal worden afgespeeld.
- Realtime spraakgesprekken gebruiken de eigen openingsturn van de realtime stream. Voice Call plaatst **geen** verouderde `<Say>` TwiML-update voor dat eerste bericht, zodat uitgaande `<Connect><Stream>`-sessies gekoppeld blijven.

### Respijt bij verbreking van Twilio-stream

Wanneer een Twilio-mediastream wordt verbroken, wacht Voice Call **2000 ms** voordat
de oproep automatisch wordt beëindigd:

- Als de stream binnen dat venster opnieuw verbinding maakt, wordt automatisch beëindigen geannuleerd.
- Als er na de respijtperiode geen stream opnieuw wordt geregistreerd, wordt de oproep beëindigd om vastgelopen actieve oproepen te voorkomen.

## Verouderde oproepreaper

Gebruik `staleCallReaperSeconds` om oproepen te beëindigen die nooit een terminale
Webhook ontvangen (bijvoorbeeld oproepen in meldmodus die nooit worden voltooid). De standaardwaarde
is `0` (uitgeschakeld).

Aanbevolen bereiken:

- **Productie:** `120`–`300` seconden voor meldingsachtige flows.
- Houd deze waarde **hoger dan `maxDurationSeconds`** zodat normale oproepen kunnen eindigen. Een goed startpunt is `maxDurationSeconds + 30–60` seconden.

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
de openbare URL voor handtekeningverificatie. Deze opties
bepalen welke doorgestuurde headers worden vertrouwd:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Sta hosts toe uit forwarding-headers.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Vertrouw doorgestuurde headers zonder allowlist.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Vertrouw doorgestuurde headers alleen wanneer het externe IP-adres van de aanvraag overeenkomt met de lijst.
</ParamField>

Aanvullende beveiligingen:

- Webhook-**replaybescherming** is ingeschakeld voor Twilio en Plivo. Opnieuw afgespeelde geldige Webhook-aanvragen worden bevestigd maar overgeslagen voor bijwerkingen.
- Twilio-gespreksturns bevatten een token per turn in `<Gather>`-callbacks, zodat verouderde/opnieuw afgespeelde spraakcallbacks niet aan een nieuwere wachtende transcriptturn kunnen voldoen.
- Niet-geverifieerde Webhook-aanvragen worden geweigerd vóór body-reads wanneer de vereiste handtekeningheaders van de provider ontbreken.
- De voice-call-Webhook gebruikt het gedeelde pre-auth body-profiel (64 KB / 5 seconden) plus een per-IP-limiet voor gelijktijdige aanvragen vóór handtekeningverificatie.

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

Wanneer de Gateway al draait, delegeren operationele `voicecall`-commando's
naar de door de Gateway beheerde voice-call-runtime, zodat de CLI geen tweede
Webhook-server bindt. Als er geen Gateway bereikbaar is, vallen de commando's terug op een
zelfstandige CLI-runtime.

`latency` leest `calls.jsonl` vanaf het standaard opslagpad voor spraakoproepen.
Gebruik `--file <path>` om naar een ander logboek te wijzen en `--last <n>` om
de analyse te beperken tot de laatste N records (standaard 200). De uitvoer bevat p50/p90/p99
voor beurtlatentie en luister-wachttijden.

## Agent-tool

Toolnaam: `voice_call`.

| Actie           | Argumenten                                |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

Deze repository levert een bijbehorend Skills-document op `skills/voice-call/SKILL.md`.

## Gateway RPC

| Methode              | Argumenten                                |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` is alleen geldig met `mode: "conversation"`. Oproepen in
meldingsmodus moeten `voicecall.dtmf` gebruiken nadat de oproep bestaat als ze
cijfers nodig hebben na het verbinden.

## Probleemoplossing

### Installatie mislukt bij Webhook-blootstelling

Voer de installatie uit vanuit dezelfde omgeving waarin de Gateway draait:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Voor `twilio`, `telnyx` en `plivo` moet `webhook-exposure` groen zijn. Een
geconfigureerde `publicUrl` mislukt nog steeds wanneer die naar lokale of private
netwerkruimte wijst, omdat de provider niet kan terugbellen naar die adressen.
Gebruik geen `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` of `fd00::/8` als `publicUrl`.

Uitgaande Twilio-oproepen in meldingsmodus sturen hun eerste `<Say>` TwiML direct
in de aanvraag om de oproep te maken, dus het eerste uitgesproken bericht is niet
afhankelijk van Twilio die Webhook-TwiML ophaalt. Een openbare Webhook is nog
steeds vereist voor statuscallbacks, gespreksoproepen, DTMF vóór verbinding,
realtime streams en oproepbeheer na verbinding.

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

Herstart of herlaad na het wijzigen van de configuratie de Gateway en voer daarna uit:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` is een droge run tenzij je `--yes` meegeeft.

### Provider-inloggegevens mislukken

Controleer de geselecteerde provider en de vereiste velden voor inloggegevens:

- Twilio: `twilio.accountSid`, `twilio.authToken` en `fromNumber`, of
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` en `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` en
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` en `fromNumber`.

Inloggegevens moeten op de Gateway-host aanwezig zijn. Het bewerken van een
lokaal shellprofiel heeft geen invloed op een al draaiende Gateway totdat die
opnieuw start of zijn omgeving herlaadt.

### Oproepen starten, maar provider-Webhooks komen niet aan

Bevestig dat de providerconsole naar de exacte openbare Webhook-URL wijst:

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
- Een proxy stuurt de aanvraag door, maar verwijdert of herschrijft host-/proto-headers.
- Firewall of DNS routeert de openbare hostnaam naar iets anders dan de Gateway.
- De Gateway is opnieuw gestart zonder dat de Voice Call-Plugin is ingeschakeld.

Wanneer er een reverse proxy of tunnel vóór de Gateway staat, stel je
`webhookSecurity.allowedHosts` in op de openbare hostnaam, of gebruik je
`webhookSecurity.trustedProxyIPs` voor een bekend proxyadres. Gebruik
`webhookSecurity.trustForwardingHeaders` alleen wanneer de proxygrens onder
jouw controle staat.

### Handtekeningverificatie mislukt

Providerhandtekeningen worden gecontroleerd aan de hand van de openbare URL die
OpenClaw reconstrueert uit de binnenkomende aanvraag. Als handtekeningen mislukken:

- Bevestig dat de provider-Webhook-URL exact overeenkomt met `publicUrl`, inclusief
  schema, host en pad.
- Werk voor ngrok-URL's uit de gratis laag `publicUrl` bij wanneer de tunnelhostnaam verandert.
- Zorg dat de proxy de oorspronkelijke host- en proto-headers behoudt, of configureer
  `webhookSecurity.allowedHosts`.
- Schakel `skipSignatureVerification` niet in buiten lokaal testen.

### Google Meet Twilio-deelnames mislukken

Google Meet gebruikt deze Plugin voor Twilio-inbeldeelnames. Controleer eerst Voice Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Controleer daarna expliciet het Google Meet-transport:

```bash
openclaw googlemeet setup --transport twilio
```

Als Voice Call groen is maar de Meet-deelnemer nooit deelneemt, controleer dan het
Meet-inbelnummer, de pincode en `--dtmf-sequence`. De telefoonoproep kan gezond
zijn terwijl de vergadering een onjuiste DTMF-reeks weigert of negeert.

Google Meet geeft de Meet-DTMF-reeks en introtekst door aan `voicecall.start`.
Voor Twilio-oproepen serveert Voice Call eerst de DTMF-TwiML, leidt terug naar de
Webhook en opent daarna de realtime mediastream zodat de opgeslagen intro wordt
gegenereerd nadat de telefoondeelnemer aan de vergadering heeft deelgenomen.

Gebruik `openclaw logs --follow` voor de livefasetrace. Een gezonde Twilio Meet-
deelname logt deze volgorde:

- Google Meet delegeert de Twilio-deelname aan Voice Call.
- Voice Call slaat DTMF-TwiML vóór verbinding op.
- De initiële Twilio-TwiML wordt verbruikt en geserveerd vóór realtime verwerking.
- Voice Call serveert realtime TwiML voor de Twilio-oproep.
- De realtime bridge start met de initiële begroeting in de wachtrij.

`openclaw voicecall tail` toont nog steeds blijvend opgeslagen oproeprecords; het is nuttig voor
oproepstatus en transcripties, maar niet elke Webhook-/realtime overgang verschijnt
daar.

### Realtime oproep heeft geen spraak

Bevestig dat slechts één audiomodus is ingeschakeld. `realtime.enabled` en
`streaming.enabled` kunnen niet allebei waar zijn.

Controleer voor realtime Twilio-oproepen ook:

- Er is een realtime provider-Plugin geladen en geregistreerd.
- `realtime.provider` is niet ingesteld of noemt een geregistreerde provider.
- De provider-API-sleutel is beschikbaar voor het Gateway-proces.
- `openclaw logs --follow` toont dat realtime TwiML is geserveerd, de realtime bridge
  is gestart en de initiële begroeting in de wachtrij is gezet.

## Gerelateerd

- [Praatmodus](/nl/nodes/talk)
- [Tekst-naar-spraak](/nl/tools/tts)
- [Spraakwekker](/nl/nodes/voicewake)
