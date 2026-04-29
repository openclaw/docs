---
read_when:
    - Je wilt vanuit OpenClaw een uitgaand spraakgesprek starten
    - Je configureert of ontwikkelt de voice-call-Plugin
    - Je hebt realtime spraak of streaming transcriptie voor telefonie nodig
sidebarTitle: Voice call
summary: Plaats uitgaande en accepteer inkomende spraakoproepen via Twilio, Telnyx of Plivo, met optionele realtime spraak en streamingtranscriptie
title: Plugin voor spraakoproepen
x-i18n:
    generated_at: "2026-04-29T23:07:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7976b84ce1ee6e29706e595a4a25337632b34a9bb8f7cecdee1d6f833a8ce932
    source_path: plugins/voice-call.md
    workflow: 16
---

Spraakoproepen voor OpenClaw via een plugin. Ondersteunt uitgaande meldingen,
gesprekken met meerdere beurten, full-duplex realtime spraak, streaming
transcriptie, en inkomende oproepen met allowlist-beleid.

**Huidige providers:** `twilio` (Programmable Voice + Media Streams),
`telnyx` (Call Control v2), `plivo` (Voice API + XML-overdracht + GetInput
spraak), `mock` (dev/geen netwerk).

<Note>
De Voice Call-plugin draait **binnen het Gateway-proces**. Als je een
externe Gateway gebruikt, installeer en configureer de plugin op de machine
waarop de Gateway draait, en herstart daarna de Gateway om deze te laden.
</Note>

## Snelstart

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

    Als npm het pakket van OpenClaw als verouderd meldt, komt die pakketversie
    uit een oudere externe pakketreeks; gebruik een actuele verpakte OpenClaw-
    build of het lokale mappad totdat een nieuwer npm-pakket is gepubliceerd.

    Herstart daarna de Gateway zodat de plugin wordt geladen.

  </Step>
  <Step title="Configure provider and webhook">
    Stel de configuratie in onder `plugins.entries.voice-call.config` (zie
    [Configuratie](#configuration) hieronder voor de volledige vorm). Minimaal:
    `provider`, providerreferenties, `fromNumber`, en een publiek bereikbare
    Webhook-URL.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    De standaarduitvoer is leesbaar in chatlogs en terminals. Deze controleert
    of de plugin is ingeschakeld, providerreferenties, Webhook-blootstelling en
    dat slechts één audiomodus (`streaming` of `realtime`) actief is. Gebruik
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
uitkomt op loopback of private netwerkruimte, mislukt setup in plaats van
een provider te starten die geen carrier-webhooks kan ontvangen.
</Warning>

## Configuratie

Als `enabled: true` is ingesteld maar de geselecteerde provider referenties mist,
loggen Gateway-startups een waarschuwing dat de setup onvolledig is met de
ontbrekende sleutels en wordt het starten van de runtime overgeslagen. Commands,
RPC-aanroepen en agent-tools blijven bij gebruik de exacte ontbrekende
providerconfiguratie teruggeven.

<Note>
Voice-call-referenties accepteren SecretRefs. `plugins.entries.voice-call.config.twilio.authToken` en `plugins.entries.voice-call.config.tts.providers.*.apiKey` worden opgelost via het standaard SecretRef-oppervlak; zie [SecretRef-referentieoppervlak](/nl/reference/secretref-credential-surface).
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
  <Accordion title="Provider exposure and security notes">
    - Twilio, Telnyx en Plivo vereisen allemaal een **publiek bereikbare** Webhook-URL.
    - `mock` is een lokale dev-provider (geen netwerkaanroepen).
    - Telnyx vereist `telnyx.publicKey` (of `TELNYX_PUBLIC_KEY`) tenzij `skipSignatureVerification` true is.
    - `skipSignatureVerification` is alleen voor lokale tests.
    - Stel op de gratis laag van ngrok `publicUrl` in op de exacte ngrok-URL; handtekeningverificatie wordt altijd afgedwongen.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` staat Twilio-webhooks met ongeldige handtekeningen **alleen** toe wanneer `tunnel.provider="ngrok"` is en `serve.bind` loopback is (lokale ngrok-agent). Alleen lokale dev.
    - URL's op de gratis ngrok-laag kunnen veranderen of interstitial-gedrag toevoegen; als `publicUrl` afwijkt, mislukken Twilio-handtekeningen. Productie: geef de voorkeur aan een stabiel domein of een Tailscale-funnel.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` sluit sockets die nooit een geldig `start`-frame verzenden.
    - `streaming.maxPendingConnections` begrenst het totale aantal niet-geverifieerde pre-start-sockets.
    - `streaming.maxPendingConnectionsPerIp` begrenst niet-geverifieerde pre-start-sockets per bron-IP.
    - `streaming.maxConnections` begrenst het totale aantal open mediastream-sockets (pending + actief).

  </Accordion>
  <Accordion title="Legacy config migrations">
    Oudere configuraties met `provider: "log"`, `twilio.from`, of verouderde
    `streaming.*` OpenAI-sleutels worden herschreven door `openclaw doctor --fix`.
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

## Realtime spraakgesprekken

`realtime` selecteert een full-duplex realtime spraakprovider voor live oproepaudio.
Dit staat los van `streaming`, dat audio alleen doorstuurt naar realtime
transcriptieproviders.

<Warning>
`realtime.enabled` kan niet worden gecombineerd met `streaming.enabled`. Kies één
audiomodus per oproep.
</Warning>

Huidig runtimegedrag:

- `realtime.enabled` wordt ondersteund voor Twilio Media Streams.
- `realtime.provider` is optioneel. Als dit niet is ingesteld, gebruikt Voice Call de eerste geregistreerde realtime spraakprovider.
- Gebundelde realtime spraakproviders: Google Gemini Live (`google`) en OpenAI (`openai`), geregistreerd door hun providerplugins.
- Ruwe configuratie die eigendom is van de provider staat onder `realtime.providers.<providerId>`.
- Voice Call stelt standaard de gedeelde realtime-tool `openclaw_agent_consult` beschikbaar. Het realtime model kan deze aanroepen wanneer de beller om dieper redeneren, actuele informatie of normale OpenClaw-tools vraagt.
- Als `realtime.provider` naar een niet-geregistreerde provider wijst, of als er helemaal geen realtime spraakprovider is geregistreerd, logt Voice Call een waarschuwing en slaat realtime media over in plaats van de hele plugin te laten mislukken.
- Consult-sessiesleutels hergebruiken de bestaande spraaksessie wanneer die beschikbaar is, en vallen daarna terug op het telefoonnummer van de beller/gebelde zodat vervolg-consultaanroepen context tijdens de oproep behouden.

### Toolbeleid

`realtime.toolPolicy` beheert de consult-run:

| Beleid           | Gedrag                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Stel de consult-tool beschikbaar en beperk de reguliere agent tot `read`, `web_search`, `web_fetch`, `x_search`, `memory_search`, en `memory_get`. |
| `owner`          | Stel de consult-tool beschikbaar en laat de reguliere agent het normale agent-toolbeleid gebruiken.                                                      |
| `none`           | Stel de consult-tool niet beschikbaar. Aangepaste `realtime.tools` worden nog steeds doorgegeven aan de realtime provider.                               |

### Voorbeelden van realtime providers

<Tabs>
  <Tab title="Google Gemini Live">
    Standaarden: API-sleutel uit `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY`, of `GOOGLE_GENERATIVE_AI_API_KEY`; model
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

- `streaming.provider` is optioneel. Als dit niet is ingesteld, gebruikt Voice Call de eerste geregistreerde realtime transcriptieprovider.
- Gebundelde realtime transcriptieproviders: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`), en xAI (`xai`), geregistreerd door hun providerplugins.
- Ruwe configuratie die eigendom is van de provider staat onder `streaming.providers.<providerId>`.
- Als `streaming.provider` naar een niet-geregistreerde provider wijst, of als er geen is geregistreerd, logt Voice Call een waarschuwing en slaat mediastreaming over in plaats van de hele plugin te laten mislukken.

### Voorbeelden van streaming providers

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
spraak in oproepen. Je kunt dit overschrijven onder de Plugin-configuratie met
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
het huidige Microsoft-transport biedt geen telefonie-PCM-uitvoer.
</Warning>

Gedragsnotities:

- Verouderde `tts.<provider>`-sleutels binnen Plugin-configuratie (`openai`, `elevenlabs`, `microsoft`, `edge`) worden hersteld door `openclaw doctor --fix`; vastgelegde configuratie moet `tts.providers.<provider>` gebruiken.
- Kern-TTS wordt gebruikt wanneer Twilio-mediastreaming is ingeschakeld; anders vallen oproepen terug op provider-native stemmen.
- Als er al een Twilio-mediastream actief is, valt Voice Call niet terug op TwiML `<Say>`. Als telefonie-TTS in die toestand niet beschikbaar is, mislukt het afspeelverzoek in plaats van twee afspeelpaden te mengen.
- Wanneer telefonie-TTS terugvalt op een secundaire provider, logt Voice Call een waarschuwing met de providerketen (`from`, `to`, `attempts`) voor foutopsporing.
- Wanneer Twilio-barge-in of streamafbraak de wachtende TTS-wachtrij wist, worden in de wachtrij geplaatste afspeelverzoeken afgehandeld in plaats van bellers te laten wachten op voltooiing van het afspelen.

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
`inboundPolicy: "allowlist"` is een beller-ID-filter met beperkte zekerheid. De
Plugin normaliseert de door de provider geleverde `From`-waarde en vergelijkt die met
`allowFrom`. Webhook-verificatie authenticeert providerlevering en
payloadintegriteit, maar bewijst **niet** het eigendom van PSTN-/VoIP-bellernummers.
Behandel `allowFrom` als filtering op beller-ID, niet als sterke
belleridentiteit.
</Warning>

Automatische antwoorden gebruiken het agentsysteem. Stem dit af met `responseModel`,
`responseSystemPrompt` en `responseTimeoutMs`.

### Contract voor gesproken uitvoer

Voor automatische antwoorden voegt Voice Call een strikt contract voor gesproken uitvoer toe aan
de systeemprompt:

```text
{"spoken":"..."}
```

Voice Call extraheert spraaktekst defensief:

- Negeert payloads die zijn gemarkeerd als redeneer-/foutinhoud.
- Parset directe JSON, omheinde JSON of inline `"spoken"`-sleutels.
- Valt terug op platte tekst en verwijdert waarschijnlijke inleidende alinea's met planning/meta-informatie.

Dit houdt gesproken afspelen gericht op tekst voor de beller en voorkomt
dat planningstekst in audio lekt.

### Gedrag bij gespreksstart

Voor uitgaande `conversation`-oproepen is de afhandeling van het eerste bericht gekoppeld aan de live
afspeelstatus:

- Het wissen van de barge-in-wachtrij en automatisch antwoord worden alleen onderdrukt terwijl de eerste begroeting actief wordt uitgesproken.
- Als het eerste afspelen mislukt, keert de oproep terug naar `listening` en blijft het eerste bericht in de wachtrij staan voor een nieuwe poging.
- Het eerste afspelen voor Twilio-streaming begint bij streamverbinding zonder extra vertraging.
- Barge-in breekt actief afspelen af en wist Twilio TTS-items die in de wachtrij staan maar nog niet worden afgespeeld. Gewiste items worden als overgeslagen afgehandeld, zodat de logica voor vervolgantwoorden kan doorgaan zonder te wachten op audio die nooit wordt afgespeeld.
- Realtime spraakgesprekken gebruiken de eigen openingsturn van de realtime-stream. Voice Call plaatst **geen** verouderde TwiML-update met `<Say>` voor dat eerste bericht, zodat uitgaande `<Connect><Stream>`-sessies gekoppeld blijven.

### Respijt bij verbreken van Twilio-stream

Wanneer een Twilio-mediastream wordt verbroken, wacht Voice Call **2000 ms** voordat
het gesprek automatisch wordt beëindigd:

- Als de stream binnen dat venster opnieuw verbinding maakt, wordt automatisch beëindigen geannuleerd.
- Als er na de respijtperiode geen stream opnieuw wordt geregistreerd, wordt het gesprek beëindigd om vastgelopen actieve gesprekken te voorkomen.

## Opruimer voor verlopen gesprekken

Gebruik `staleCallReaperSeconds` om gesprekken te beëindigen die nooit een terminale
Webhook ontvangen (bijvoorbeeld notify-modusgesprekken die nooit worden voltooid). De standaardwaarde
is `0` (uitgeschakeld).

Aanbevolen bereiken:

- **Productie:** `120`–`300` seconden voor notify-achtige flows.
- Houd deze waarde **hoger dan `maxDurationSeconds`** zodat normale gesprekken kunnen worden afgerond. Een goed startpunt is `maxDurationSeconds + 30–60` seconden.

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

Wanneer een proxy of tunnel voor de Gateway staat, reconstrueert de plugin
de openbare URL voor handtekeningverificatie. Deze opties bepalen welke
doorgestuurde headers worden vertrouwd:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Sta hosts uit forwarding-headers toe via een allowlist.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Vertrouw doorgestuurde headers zonder allowlist.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Vertrouw doorgestuurde headers alleen wanneer het externe IP-adres van het verzoek overeenkomt met de lijst.
</ParamField>

Aanvullende beschermingen:

- Webhook-**replaybeveiliging** is ingeschakeld voor Twilio en Plivo. Opnieuw afgespeelde geldige Webhook-verzoeken worden bevestigd, maar overgeslagen voor neveneffecten.
- Twilio-gespreksbeurten bevatten een token per beurt in `<Gather>`-callbacks, zodat verlopen/opnieuw afgespeelde spraakcallbacks geen nieuwere wachtende transcriptiebeurt kunnen vervullen.
- Niet-geverifieerde Webhook-verzoeken worden geweigerd voordat bodies worden gelezen wanneer de vereiste handtekeningheaders van de provider ontbreken.
- De voice-call-Webhook gebruikt het gedeelde pre-auth-bodyprofiel (64 KB / 5 seconden) plus een per-IP-limiet voor gelijktijdige lopende verzoeken vóór handtekeningverificatie.

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

`latency` leest `calls.jsonl` uit het standaardopslagpad voor voice-call.
Gebruik `--file <path>` om naar een ander log te verwijzen en `--last <n>` om de
analyse te beperken tot de laatste N records (standaard 200). De uitvoer bevat p50/p90/p99
voor beurtlatentie en luister-wachttijden.

## Agent-tool

Toolnaam: `voice_call`.

| Actie           | Argumenten                |
| --------------- | ------------------------- |
| `initiate_call` | `message`, `to?`, `mode?` |
| `continue_call` | `callId`, `message`       |
| `speak_to_user` | `callId`, `message`       |
| `send_dtmf`     | `callId`, `digits`        |
| `end_call`      | `callId`                  |
| `get_status`    | `callId`                  |

Deze repo levert een bijbehorend skill-document op `skills/voice-call/SKILL.md`.

## Gateway-RPC

| Methode              | Argumenten                |
| -------------------- | ------------------------- |
| `voicecall.initiate` | `to?`, `message`, `mode?` |
| `voicecall.continue` | `callId`, `message`       |
| `voicecall.speak`    | `callId`, `message`       |
| `voicecall.dtmf`     | `callId`, `digits`        |
| `voicecall.end`      | `callId`                  |
| `voicecall.status`   | `callId`                  |

## Gerelateerd

- [Praatmodus](/nl/nodes/talk)
- [Tekst-naar-spraak](/nl/tools/tts)
- [Spraakactivering](/nl/nodes/voicewake)
