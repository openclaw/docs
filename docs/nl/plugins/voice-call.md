---
read_when:
    - Je wilt vanuit OpenClaw een uitgaand spraakgesprek voeren
    - Je configureert of ontwikkelt de voice-call-plugin
    - Je hebt realtime spraak of streamingtranscriptie via telefonie nodig
sidebarTitle: Voice call
summary: Plaats uitgaande en accepteer inkomende spraakoproepen via Twilio, Telnyx of Plivo, met optionele realtime spraak en streaming transcriptie
title: Plugin voor spraakoproepen
x-i18n:
    generated_at: "2026-06-27T18:08:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6eff6fe188644d6ac2f4868b28727783bd1859025e8745b1901e20637d68611c
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
waarop de Gateway draait en herstart je daarna de Gateway om deze te laden.
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

    Gebruik het kale pakket om de huidige officiële releasetag te volgen. Pin
    alleen een exacte versie wanneer je een reproduceerbare installatie nodig hebt.

    Herstart daarna de Gateway zodat de plugin wordt geladen.

  </Step>
  <Step title="Configure provider and webhook">
    Stel de configuratie in onder `plugins.entries.voice-call.config` (zie
    [Configuratie](#configuration) hieronder voor de volledige vorm). Minimaal:
    `provider`, providerreferenties, `fromNumber` en een publiek
    bereikbare webhook-URL.
  </Step>
  <Step title="Verify setup">
    ```bash
    openclaw voicecall setup
    ```

    De standaarduitvoer is leesbaar in chatlogs en terminals. Deze controleert
    of de plugin is ingeschakeld, providerreferenties, webhook-blootstelling en dat
    slechts één audiomodus (`streaming` of `realtime`) actief is. Gebruik
    `--json` voor scripts.

  </Step>
  <Step title="Smoke test">
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
Voor Twilio, Telnyx en Plivo moet setup uitkomen op een **publieke webhook-URL**.
Als `publicUrl`, de tunnel-URL, de Tailscale-URL of de serve-fallback
uitkomt op loopback- of privénetwerkruimte, mislukt setup in plaats van
een provider te starten die geen carrier-webhooks kan ontvangen.
</Warning>

## Configuratie

Als `enabled: true` is ingesteld maar de geselecteerde provider referenties mist,
logt Gateway-opstarten een waarschuwing dat setup onvolledig is met de ontbrekende sleutels en
wordt het starten van de runtime overgeslagen. Opdrachten, RPC-aanroepen en agenttools
retourneren nog steeds de exacte ontbrekende providerconfiguratie wanneer ze worden gebruikt.

<Note>
Voice-call-referenties accepteren SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` en `plugins.entries.voice-call.config.tts.providers.*.apiKey` worden via het standaard SecretRef-oppervlak opgelost; zie [SecretRef-referentieoppervlak](/nl/reference/secretref-credential-surface).
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
                  openai: { speakerVoice: "alloy" },
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
    - Twilio, Telnyx en Plivo vereisen allemaal een **publiek bereikbare** webhook-URL.
    - `mock` is een lokale dev-provider (geen netwerkoproepen).
    - Telnyx vereist `telnyx.publicKey` (of `TELNYX_PUBLIC_KEY`) tenzij `skipSignatureVerification` true is.
    - `skipSignatureVerification` is alleen voor lokaal testen.
    - Stel op de gratis ngrok-laag `publicUrl` in op de exacte ngrok-URL; handtekeningverificatie wordt altijd afgedwongen.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` staat Twilio-webhooks met ongeldige handtekeningen **alleen** toe wanneer `tunnel.provider="ngrok"` en `serve.bind` loopback is (lokale ngrok-agent). Alleen lokale dev.
    - Gratis ngrok-URL's kunnen veranderen of interstitial-gedrag toevoegen; als `publicUrl` afwijkt, mislukken Twilio-handtekeningen. Productie: geef de voorkeur aan een stabiel domein of een Tailscale-funnel.

  </Accordion>
  <Accordion title="Streaming connection caps">
    - `streaming.preStartTimeoutMs` sluit sockets die nooit een geldig `start`-frame verzenden.
    - `streaming.maxPendingConnections` begrenst het totale aantal niet-geverifieerde pre-start-sockets.
    - `streaming.maxPendingConnectionsPerIp` begrenst niet-geverifieerde pre-start-sockets per bron-IP.
    - `streaming.maxConnections` begrenst het totale aantal open mediastream-sockets (pending + actief).

  </Accordion>
  <Accordion title="Legacy config migrations">
    Oudere configuraties die `provider: "log"`, `twilio.from` of legacy
    `streaming.*` OpenAI-sleutels gebruiken, worden herschreven door `openclaw doctor --fix`.
    Runtime-fallback accepteert voorlopig nog de oude voice-call-sleutels, maar
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
dezelfde beller gespreksgeheugen behouden. Stel `sessionScope: "per-call"` in wanneer
elke carrier-oproep met nieuwe context moet starten, bijvoorbeeld receptie-,
boekings-, IVR- of Google Meet-bridge-flows waarbij hetzelfde telefoonnummer
verschillende vergaderingen kan vertegenwoordigen.

Voice Call slaat gegenereerde sessiesleutels op onder de geconfigureerde agent-namespace
(`agent:<agentId>:voice:*`), zodat oproepgeheugen Gateway-sessiesleutel-
canonicalisatie na herstarts overleeft. Ruwe expliciete integratiesleutels gebruiken dezelfde
agent-namespace. Een canonieke `agent:<configuredAgentId>:*`-sleutel behoudt die eigenaar,
en de hoofdaliases ervan respecteren core `session.mainKey` en globale scope. Vreemde of
misvormde `agent:*`-invoer wordt gescoped als een opaque sleutel onder de geconfigureerde agent;
`global` en `unknown` blijven globale sentinels. Gateway-opstarten promoveert oudere
ruwe sleutels in standaard of `{agentId}`-getemplate stores waar het pad één
eigenaar bewijst. In vaste custom stores blijven dubbelzinnige legacy-rijen onaangeroerd omdat
ze niet genoeg informatie bevatten om een eigenaar te kiezen; nieuwe oproepen gebruiken
canonieke agent-gescopete geschiedenis.

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
- Raw configuratie die eigendom is van providers staat onder `realtime.providers.<providerId>`.
- Voice Call stelt standaard de gedeelde realtime tool `openclaw_agent_consult` beschikbaar. Het realtime model kan deze aanroepen wanneer de beller om diepere redenering, actuele informatie of normale OpenClaw-tools vraagt.
- `realtime.consultPolicy` voegt optioneel richtlijnen toe voor wanneer het realtime model `openclaw_agent_consult` moet aanroepen.
- `realtime.agentContext.enabled` staat standaard uit. Wanneer ingeschakeld, injecteert Voice Call bij sessie-setup een begrensde agentidentiteit en geselecteerde workspace-bestandscapsule in de instructies voor de realtime provider.
- `realtime.fastContext.enabled` staat standaard uit. Wanneer ingeschakeld, zoekt Voice Call eerst in geïndexeerd geheugen/sessiecontext naar de consultvraag en retourneert die snippets aan het realtime model binnen `realtime.fastContext.timeoutMs` voordat alleen wordt teruggevallen op de volledige consultagent als `realtime.fastContext.fallbackToConsult` true is.
- Als `realtime.provider` naar een niet-geregistreerde provider wijst, of als er helemaal geen realtime spraakprovider is geregistreerd, logt Voice Call een waarschuwing en slaat realtime media over in plaats van de hele plugin te laten mislukken.
- Consult-sessiesleutels hergebruiken de opgeslagen oproepsessie wanneer beschikbaar en vallen daarna terug op de geconfigureerde `sessionScope` (standaard `per-phone`, of `per-call` voor geïsoleerde oproepen).

### Toolbeleid

`realtime.toolPolicy` beheert de consult-run:

| Beleid           | Gedrag                                                                                                                                 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Stelt de consulttool beschikbaar en beperkt de reguliere agent tot `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` en `memory_get`. |
| `owner`          | Stelt de consulttool beschikbaar en laat de reguliere agent het normale agenttoolbeleid gebruiken.                                                      |
| `none`           | Stelt de consulttool niet beschikbaar. Custom `realtime.tools` worden nog steeds doorgegeven aan de realtime provider.                               |

`realtime.consultPolicy` beheert alleen de instructies voor het realtime model:

| Beleid        | Richtlijn                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `auto`        | Behoud de standaardprompt en laat de provider beslissen wanneer de consulttool moet worden aangeroepen.              |
| `substantive` | Beantwoord eenvoudige gesprekslijm direct en consulteer vóór feiten, geheugen, tools of context. |
| `always`      | Consulteer vóór elk inhoudelijk antwoord.                                                        |

### Agent-spraakcontext

Schakel `realtime.agentContext` in wanneer de voice bridge moet klinken als de
geconfigureerde OpenClaw-agent zonder een volledige agent-consult-roundtrip te
betalen voor gewone beurten. De contextcapsule wordt eenmalig toegevoegd wanneer
de realtime sessie wordt aangemaakt, zodat er geen latentie per beurt bijkomt.
Aanroepen naar `openclaw_agent_consult` voeren nog steeds de volledige OpenClaw-agent uit en moeten worden gebruikt
voor toolwerk, actuele informatie, geheugenzoekopdrachten of werkruimtestatus.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          agentId: "main",
          realtime: {
            enabled: true,
            provider: "google",
            toolPolicy: "safe-read-only",
            consultPolicy: "substantive",
            agentContext: {
              enabled: true,
              maxChars: 6000,
              includeIdentity: true,
              includeWorkspaceFiles: true,
              files: ["SOUL.md", "IDENTITY.md", "USER.md"],
            },
          },
        },
      },
    },
  },
}
```

### Voorbeelden van realtime providers

<Tabs>
  <Tab title="Google Gemini Live">
    Standaarden: API-sleutel uit `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` of `GOOGLE_GENERATIVE_AI_API_KEY`; model
    `gemini-2.5-flash-native-audio-preview-12-2025`; stem `Kore`.
    `sessionResumption` en `contextWindowCompression` staan standaard aan voor langere,
    opnieuw te verbinden gesprekken. Gebruik `silenceDurationMs`, `startSensitivity` en
    `endSensitivity` om snellere beurtwisseling op telefonie-audio af te stemmen.

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
                consultPolicy: "substantive",
                consultThinkingLevel: "low",
                consultFastMode: true,
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    speakerVoice: "Kore",
                    silenceDurationMs: 500,
                    startSensitivity: "high",
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
[OpenAI-provider](/nl/providers/openai) voor provider-specifieke realtime spraakopties.

## Streaming-transcriptie

`streaming` selecteert een realtime transcriptieprovider voor live gespreksaudio.

Huidig runtimegedrag:

- `streaming.provider` is optioneel. Indien niet ingesteld, gebruikt Voice Call de eerste geregistreerde realtime transcriptieprovider.
- Gebundelde realtime transcriptieproviders: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) en xAI (`xai`), geregistreerd door hun provider-plugins.
- Provider-eigen ruwe configuratie staat onder `streaming.providers.<providerId>`.
- Nadat Twilio een geaccepteerd stream-`start`-bericht verzendt, registreert Voice Call de stream onmiddellijk, zet inkomende media in de wachtrij via de transcriptieprovider terwijl de provider verbinding maakt, en start de eerste begroeting pas nadat realtime transcriptie gereed is.
- Als `streaming.provider` naar een niet-geregistreerde provider wijst, of als er geen is geregistreerd, logt Voice Call een waarschuwing en slaat mediasteaming over in plaats van de hele Plugin te laten mislukken.

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
spraak tijdens gesprekken. Je kunt deze overschrijven onder de Plugin-configuratie met
**dezelfde vorm** — deze wordt diep samengevoegd met `messages.tts`.

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

<Warning>
**Microsoft-spraak wordt genegeerd voor spraakgesprekken.** Telefonie-audio vereist PCM;
het huidige Microsoft-transport stelt geen telefonie-PCM-uitvoer beschikbaar.
</Warning>

Gedragsnotities:

- Verouderde sleutels `tts.<provider>` binnen Plugin-configuratie (`openai`, `elevenlabs`, `microsoft`, `edge`) worden gerepareerd door `openclaw doctor --fix`; gecommitte configuratie moet `tts.providers.<provider>` gebruiken.
- Kern-TTS wordt gebruikt wanneer Twilio-mediastreaming is ingeschakeld; anders vallen gesprekken terug op provider-native stemmen.
- Als een Twilio-mediastream al actief is, valt Voice Call niet terug op TwiML `<Say>`. Als telefonie-TTS in die staat niet beschikbaar is, mislukt het afspeelverzoek in plaats van twee afspeelpaden te mengen.
- Wanneer telefonie-TTS terugvalt op een secundaire provider, logt Voice Call een waarschuwing met de providerketen (`from`, `to`, `attempts`) voor foutopsporing.
- Wanneer Twilio barge-in of het afbreken van de stream de wachtende TTS-wachtrij leegt, worden afspeelverzoeken in de wachtrij afgehandeld in plaats van bellers te laten hangen terwijl ze wachten tot het afspelen is voltooid.

### TTS-voorbeelden

<Tabs>
  <Tab title="Alleen kern-TTS">
```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { speakerVoice: "alloy" },
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
                speakerVoiceId: "pMsXgVXv3BLzUgSXRplE",
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
  <Tab title="OpenAI-modeloverschrijving (diepe samenvoeging)">
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
                speakerVoice: "marin",
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
`inboundPolicy: "allowlist"` is een beller-ID-scherm met lage zekerheid. De
Plugin normaliseert de door de provider geleverde waarde `From` en vergelijkt deze met
`allowFrom`. Webhook-verificatie authenticeert providerlevering en
payloadintegriteit, maar bewijst **niet** het eigendom van PSTN/VoIP-bellernummers.
Behandel `allowFrom` als filtering op beller-ID, niet als sterke belleridentiteit.
</Warning>

Automatische antwoorden gebruiken het agentsysteem. Stem af met `responseModel`,
`responseSystemPrompt` en `responseTimeoutMs`.

### Routing per nummer

Gebruik `numbers` wanneer één Voice Call-Plugin gesprekken voor meerdere telefoonnummers ontvangt
en elk nummer zich als een andere lijn moet gedragen. Zo kan één
nummer een informele persoonlijke assistent gebruiken terwijl een ander een zakelijke
persona, een andere antwoordagent en een andere TTS-stem gebruikt.

Routes worden geselecteerd op basis van het door de provider geleverde gekozen `To`-nummer. Sleutels moeten
E.164-nummers zijn. Wanneer een gesprek binnenkomt, lost Voice Call de overeenkomende route eenmaal op,
slaat de overeenkomende route op in het gespreksrecord en hergebruikt die effectieve configuratie
voor de begroeting, het klassieke pad voor automatische antwoorden, het realtime consultpad en TTS-
afspelen. Als geen route overeenkomt, wordt de globale Voice Call-configuratie gebruikt.
Uitgaande gesprekken gebruiken `numbers` niet; geef het uitgaande doel, bericht en
sessie expliciet door wanneer je het gesprek start.

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
      openai: { speakerVoice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { speakerVoice: "alloy" },
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
- Valt terug op platte tekst en verwijdert vermoedelijke plannings-/meta-inleidende alinea's.

Dit houdt gesproken afspelen gericht op tekst voor de beller en voorkomt
dat planningstekst in audio lekt.

### Opstartgedrag van gesprekken

Voor uitgaande `conversation`-gesprekken is de afhandeling van het eerste bericht gekoppeld aan de live
afspeelstatus:

- Het legen van de barge-in-wachtrij en automatische antwoorden worden alleen onderdrukt terwijl de eerste begroeting actief wordt uitgesproken.
- Als het eerste afspelen mislukt, keert het gesprek terug naar `listening` en blijft het eerste bericht in de wachtrij voor een nieuwe poging.
- Eerste afspelen voor Twilio-streaming start bij streamverbinding zonder extra vertraging.
- Barge-in breekt actief afspelen af en wist Twilio TTS-items die in de wachtrij staan maar nog niet worden afgespeeld. Gewiste items worden als overgeslagen afgehandeld, zodat vervolgresponslogica kan doorgaan zonder te wachten op audio die nooit zal worden afgespeeld.
- Realtime spraakgesprekken gebruiken de eigen openingsturn van de realtime stream. Voice Call plaatst **geen** verouderde `<Say>` TwiML-update voor dat eerste bericht, zodat uitgaande `<Connect><Stream>`-sessies gekoppeld blijven.

### Respijt bij verbreken van Twilio-stream

Wanneer een Twilio-mediastream de verbinding verbreekt, wacht Voice Call **2000 ms** voordat
de oproep automatisch wordt beëindigd:

- Als de stream binnen dat venster opnieuw verbinding maakt, wordt automatisch beëindigen geannuleerd.
- Als er na de respijtperiode geen stream opnieuw wordt geregistreerd, wordt de oproep beëindigd om vastgelopen actieve oproepen te voorkomen.

## Reaper voor verouderde oproepen

Gebruik `staleCallReaperSeconds` om oproepen te beëindigen die nooit een terminal
Webhook ontvangen (bijvoorbeeld oproepen in notify-modus die nooit worden voltooid). De standaardwaarde
is `0` (uitgeschakeld).

Aanbevolen bereiken:

- **Productie:** `120`–`300` seconden voor notify-achtige flows.
- Houd deze waarde **hoger dan `maxDurationSeconds`** zodat normale oproepen kunnen worden afgerond. Een goed startpunt is `maxDurationSeconds + 30–60` seconden.

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
de openbare URL voor handtekeningverificatie. Deze opties bepalen welke
doorgestuurde headers worden vertrouwd:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Hosts uit forwarding-headers toestaan via een allowlist.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Doorgestuurde headers vertrouwen zonder allowlist.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Doorgestuurde headers alleen vertrouwen wanneer het externe IP-adres van de aanvraag overeenkomt met de lijst.
</ParamField>

Aanvullende beveiligingen:

- Webhook-**replaybeveiliging** is ingeschakeld voor Twilio en Plivo. Herhaalde geldige Webhook-aanvragen worden bevestigd maar overgeslagen voor bijwerkingen.
- Twilio-gespreksbeurten bevatten een token per beurt in `<Gather>`-callbacks, zodat verouderde/herhaalde spraakcallbacks geen nieuwere wachtende transcriptiebeurt kunnen voldoen.
- Niet-geverifieerde Webhook-aanvragen worden geweigerd vóór body-reads wanneer de vereiste handtekeningheaders van de provider ontbreken.
- De voice-call-Webhook gebruikt het gedeelde pre-auth-bodyprofiel (64 KB / 5 seconden) plus een per-IP-limiet voor gelijktijdige aanvragen vóór handtekeningverificatie.

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
naar de voice-call-runtime die eigendom is van de Gateway, zodat de CLI geen tweede
Webhook-server bindt. Als er geen Gateway bereikbaar is, vallen de commando's terug op een
zelfstandige CLI-runtime.

`latency` leest `calls.jsonl` uit het standaardopslagpad voor voice-call.
Gebruik `--file <path>` om naar een ander logboek te verwijzen en `--last <n>` om de
analyse te beperken tot de laatste N records (standaard 200). Uitvoer bevat p50/p90/p99
voor beurtlatentie en luister-wachttijden.

## Agent-tool

Toolnaam: `voice_call`.

| Actie           | Argumenten                                 |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

De voice-call-Plugin levert een bijbehorende agent-Skill mee.

## Gateway-RPC

| Methode              | Argumenten                                 |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` is alleen geldig met `mode: "conversation"`. Oproepen in notify-modus
moeten `voicecall.dtmf` gebruiken nadat de oproep bestaat als ze cijfers na het verbinden
nodig hebben.

## Probleemoplossing

### Setup kan Webhook-blootstelling niet instellen

Voer setup uit vanuit dezelfde omgeving waarin de Gateway draait:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Voor `twilio`, `telnyx` en `plivo` moet `webhook-exposure` groen zijn. Een
geconfigureerde `publicUrl` faalt nog steeds wanneer deze naar lokale of privé-netwerkruimte
wijst, omdat de carrier niet naar die adressen kan terugbellen. Gebruik geen
`localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7` of `fd00::/8` als `publicUrl`.

Uitgaande Twilio-oproepen in notify-modus verzenden hun initiële `<Say>`-TwiML rechtstreeks in
de create-call-aanvraag, dus het eerste uitgesproken bericht is niet afhankelijk van Twilio
die Webhook-TwiML ophaalt. Een openbare Webhook blijft vereist voor statuscallbacks,
gespreksoproepen, DTMF vóór verbinden, realtime streams en oproepbeheer na verbinden.

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

Herstart of herlaad de Gateway na het wijzigen van de configuratie en voer daarna uit:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` is een dry run tenzij u `--yes` meegeeft.

### Providerreferenties falen

Controleer de geselecteerde provider en de vereiste referentievelden:

- Twilio: `twilio.accountSid`, `twilio.authToken` en `fromNumber`, of
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` en `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` en
  `fromNumber`.
- Plivo: `plivo.authId`, `plivo.authToken` en `fromNumber`.

Referenties moeten bestaan op de Gateway-host. Het bewerken van een lokaal shellprofiel heeft
geen invloed op een al draaiende Gateway totdat deze herstart of zijn
omgeving herlaadt.

### Oproepen starten maar provider-Webhooks komen niet aan

Controleer of de providerconsole naar de exacte openbare Webhook-URL verwijst:

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
- Een proxy stuurt de aanvraag door maar verwijdert of herschrijft host/proto-headers.
- Firewall of DNS routeert de openbare hostnaam naar een andere locatie dan de Gateway.
- De Gateway is opnieuw gestart zonder dat de Voice Call-Plugin is ingeschakeld.

Wanneer er een reverse proxy of tunnel vóór de Gateway staat, stelt u
`webhookSecurity.allowedHosts` in op de openbare hostnaam, of gebruikt u
`webhookSecurity.trustedProxyIPs` voor een bekend proxyadres. Gebruik
`webhookSecurity.trustForwardingHeaders` alleen wanneer de proxygrens onder
uw controle staat.

### Handtekeningverificatie faalt

Providerhandtekeningen worden gecontroleerd tegen de openbare URL die OpenClaw reconstrueert
op basis van de inkomende aanvraag. Als handtekeningen falen:

- Controleer of de provider-Webhook-URL exact overeenkomt met `publicUrl`, inclusief
  schema, host en pad.
- Werk voor gratis ngrok-URL's `publicUrl` bij wanneer de tunnelhostnaam verandert.
- Zorg dat de proxy de oorspronkelijke host- en proto-headers behoudt, of configureer
  `webhookSecurity.allowedHosts`.
- Schakel `skipSignatureVerification` niet in buiten lokale tests.

### Google Meet Twilio-deelnames falen

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
inbelnummer, de PIN en `--dtmf-sequence`. De telefoongesprek kan gezond zijn terwijl
de vergadering een onjuiste DTMF-reeks weigert of negeert.

Google Meet start de Twilio-telefoonleg via `voicecall.start` met een
DTMF-reeks vóór verbinden. Uit PIN afgeleide reeksen bevatten de
`voiceCall.dtmfDelayMs` van de Google Meet-Plugin als voorafgaande Twilio-wachtcijfers. De standaardwaarde is 12 seconden
omdat Meet-inbelprompts laat kunnen arriveren. Voice Call leidt daarna terug naar
realtime afhandeling voordat de introductiegroet wordt aangevraagd.

Gebruik `openclaw logs --follow` voor de live fasetrace. Een gezonde Twilio Meet-
deelname logt deze volgorde:

- Google Meet delegeert de Twilio-deelname aan Voice Call.
- Voice Call slaat DTMF-TwiML vóór verbinden op.
- Initiële Twilio-TwiML wordt geconsumeerd en geserveerd vóór realtime afhandeling.
- Voice Call serveert realtime TwiML voor de Twilio-oproep.
- Google Meet vraagt introductiespraak aan met `voicecall.speak` na de post-DTMF-vertraging.

`openclaw voicecall tail` toont nog steeds opgeslagen oproeprecords; het is nuttig voor
oproepstatus en transcripties, maar niet elke Webhook-/realtime-overgang verschijnt
daar.

### Realtime oproep heeft geen spraak

Controleer of slechts één audiomodus is ingeschakeld. `realtime.enabled` en
`streaming.enabled` kunnen niet allebei waar zijn.

Controleer voor realtime Twilio-oproepen ook:

- Er is een realtime provider-Plugin geladen en geregistreerd.
- `realtime.provider` is niet ingesteld of noemt een geregistreerde provider.
- De provider-API-sleutel is beschikbaar voor het Gateway-proces.
- `openclaw logs --follow` toont dat realtime TwiML is geserveerd, de realtime bridge
  is gestart en de initiële begroeting in de wachtrij is geplaatst.

## Gerelateerd

- [Praatmodus](/nl/nodes/talk)
- [Tekst-naar-spraak](/nl/tools/tts)
- [Voice wake](/nl/nodes/voicewake)
