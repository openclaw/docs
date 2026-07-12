---
read_when:
    - Je wilt vanuit OpenClaw een uitgaand spraakgesprek voeren
    - U configureert of ontwikkelt de spraakoproepplugin
    - Je hebt realtime spraak of streamingtranscriptie voor telefonie nodig
sidebarTitle: Voice call
summary: Plaats uitgaande en accepteer inkomende spraakoproepen via Twilio, Telnyx of Plivo, met optionele realtime spraak en streamingtranscriptie
title: Plugin voor spraakoproepen
x-i18n:
    generated_at: "2026-07-12T09:16:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ed6fb5c7e08666e14a0280115eb8f501543ec0bb48cbe5169278b273791ebc8b
    source_path: plugins/voice-call.md
    workflow: 16
---

Spraakoproepen voor OpenClaw via een Plugin: uitgaande meldingen, gesprekken
met meerdere beurten, full-duplex realtime spraak, streaming transcriptie en
inkomende oproepen met beleid op basis van een toelatingslijst.

**Providers:** `mock` (ontwikkeling, geen netwerk), `plivo` (Voice API + XML-overdracht +
GetInput-spraak), `telnyx` (Call Control v2), `twilio` (Programmable Voice +
Media Streams).

<Note>
De Voice Call-Plugin draait **binnen het Gateway-proces**. Als u een externe
Gateway gebruikt, installeert en configureert u de Plugin op de machine waarop de
Gateway draait en start u vervolgens de Gateway opnieuw om de Plugin te laden.
</Note>

## Snel aan de slag

<Steps>
  <Step title="De Plugin installeren">
    <Tabs>
      <Tab title="Van npm">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="Uit een lokale map (ontwikkeling)">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    Gebruik het pakket zonder versienummer om de huidige releasetag te volgen. Zet alleen
    een exacte versie vast wanneer u een reproduceerbare installatie nodig hebt. Start de Gateway
    daarna opnieuw zodat de Plugin wordt geladen.

  </Step>
  <Step title="Provider en Webhook configureren">
    Stel de configuratie in onder `plugins.entries.voice-call.config` (zie
    [Configuratie](#configuration) hieronder). Minimaal vereist: `provider`, de
    aanmeldgegevens van de provider, `fromNumber` en een openbaar bereikbare Webhook-URL.
  </Step>
  <Step title="Configuratie verifiëren">
    ```bash
    openclaw voicecall setup
    openclaw voicecall setup --json
    ```

    Controleert of de Plugin is ingeschakeld, de aanmeldgegevens van de provider, de
    bereikbaarheid van de Webhook en of slechts één audiomodus (`streaming` of `realtime`) actief is.

  </Step>
  <Step title="Rooktest">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    Beide zijn standaard proefuitvoeringen. Voeg `--yes` toe om een korte uitgaande
    meldingsoproep te plaatsen:

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
Voor Twilio, Telnyx en Plivo moet de configuratie resulteren in een **openbare Webhook-URL**.
Als `publicUrl`, de tunnel-URL, de Tailscale-URL of het terugvaladres van `serve`
naar local loopback of privé-netwerkruimte verwijst, mislukt de configuratie in plaats van
een provider te starten die geen Webhooks van de telecomprovider kan ontvangen.
</Warning>

## Configuratie

Als `enabled: true` is ingesteld maar de geselecteerde provider geen aanmeldgegevens heeft, registreert
het opstarten van de Gateway een waarschuwing dat de configuratie onvolledig is, met de ontbrekende sleutels,
en wordt de runtime niet gestart. Opdrachten, RPC-aanroepen en agenthulpmiddelen geven bij gebruik
nog steeds exact aan welke configuratie ontbreekt.

<Note>
Aanmeldgegevens voor spraakoproepen ondersteunen SecretRefs. `plugins.entries.voice-call.config.twilio.authToken`, `plugins.entries.voice-call.config.realtime.providers.*.apiKey`, `plugins.entries.voice-call.config.streaming.providers.*.apiKey` en `plugins.entries.voice-call.config.tts.providers.*.apiKey` worden opgelost via het standaard SecretRef-oppervlak; zie [SecretRef-oppervlak voor aanmeldgegevens](/nl/reference/secretref-credential-surface).
</Note>

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // of "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // of TWILIO_FROM_NUMBER voor Twilio
          toNumber: "+15550005678",
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, waarmee kan ik u helpen?",
              responseSystemPrompt: "U bent een beknopte specialist in honkbalkaarten.",
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
            // region: "ie1", // optioneel: us1 | ie1 | au1; standaard us1
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // Openbare sleutel voor de Telnyx-Webhook uit het Mission Control Portal
            // (Base64; kan ook worden ingesteld via TELNYX_PUBLIC_KEY).
            publicKey: "...",
          },
          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhookserver
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhookbeveiliging (aanbevolen voor tunnels/proxy's)
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // Openbare bereikbaarheid (kies er één)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* zie Streaming transcriptie */ },
          realtime: { enabled: false /* zie Realtime spraakgesprekken */ },
        },
      },
    },
  },
}
```

### Configuratiereferentie

Sleutels op het hoogste niveau onder `plugins.entries.voice-call.config` die hierboven niet worden weergegeven:

| Sleutel                         | Standaard    | Opmerkingen                                                                            |
| ------------------------------- | ------------ | -------------------------------------------------------------------------------------- |
| `enabled`                       | `false`      | Hoofdschakelaar voor aan/uit.                                                          |
| `inboundPolicy`                 | `"disabled"` | `disabled` \| `allowlist` \| `pairing` \| `open`. Zie [Inkomende oproepen](#inbound-calls). |
| `allowFrom`                     | `[]`         | E.164-toelatingslijst voor `inboundPolicy: "allowlist"`.                               |
| `maxDurationSeconds`            | `300`        | Harde maximale duur per oproep, ongeacht of de oproep is beantwoord.                   |
| `staleCallReaperSeconds`        | `120`        | Zie [Opschoner voor verouderde oproepen](#stale-call-reaper). `0` schakelt deze uit.    |
| `silenceTimeoutMs`              | `800`        | Stiltedetectie aan het einde van spraak voor de klassieke (niet-realtime) stroom.      |
| `transcriptTimeoutMs`           | `180000`     | Maximale wachttijd op een transcript van de beller voordat een beurt wordt opgegeven.  |
| `ringTimeoutMs`                 | `30000`      | Beltime-out voor uitgaande oproepen.                                                    |
| `maxConcurrentCalls`            | `1`          | Uitgaande oproepen boven deze limiet worden geweigerd.                                 |
| `outbound.notifyHangupDelaySec` | `3`          | Aantal seconden wachten na TTS voordat automatisch wordt opgehangen in meldingsmodus.  |
| `skipSignatureVerification`     | `false`      | Alleen voor lokaal testen; nooit inschakelen in productie.                             |
| `store`                         | niet ingesteld | Overschrijft het standaardpad `~/.openclaw/voice-calls` voor oproeplogboeken.         |
| `agentId`                       | `"main"`     | Agent die wordt gebruikt voor het genereren van antwoorden en de opslag van sessies.   |
| `responseModel`                 | niet ingesteld | Overschrijft het standaardmodel voor klassieke (niet-realtime) antwoorden.           |
| `responseSystemPrompt`          | gegenereerd  | Aangepaste systeemprompt voor klassieke antwoorden.                                    |
| `responseTimeoutMs`             | `30000`      | Time-out voor het genereren van klassieke antwoorden (ms).                             |

Twilio gebruikt standaard het US1 REST-eindpunt. Om oproepen in een ondersteunde
regio buiten de VS te verwerken, stelt u `twilio.region` in op `ie1` of `au1` en gebruikt u aanmeldgegevens uit
die regio. Zie
[Twilio's handleiding voor de REST API in een regio buiten de VS](https://www.twilio.com/docs/global-infrastructure/using-the-twilio-rest-api-in-a-non-us-region).

<AccordionGroup>
  <Accordion title="Opmerkingen over bereikbaarheid en beveiliging van providers">
    - Twilio, Telnyx en Plivo vereisen allemaal een **openbaar bereikbare** Webhook-URL.
    - `mock` is een lokale ontwikkelprovider (geen netwerkaanroepen).
    - Telnyx vereist `telnyx.publicKey` (of `TELNYX_PUBLIC_KEY`), tenzij `skipSignatureVerification` waar is.
    - `skipSignatureVerification` is alleen bedoeld voor lokaal testen.
    - Stel bij het gratis ngrok-abonnement `publicUrl` in op de exacte ngrok-URL; handtekeningverificatie wordt altijd afgedwongen.
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` staat Twilio-Webhooks met ongeldige handtekeningen **alleen** toe wanneer `tunnel.provider="ngrok"` en `serve.bind` local loopback is (lokale ngrok-agent). Alleen voor lokale ontwikkeling.
    - URL's van het gratis ngrok-abonnement kunnen veranderen of tussenschermen toevoegen; als `publicUrl` afwijkt, mislukt de Twilio-handtekeningverificatie. Voor productie: geef de voorkeur aan een stabiel domein of een Tailscale-funnel.

  </Accordion>
  <Accordion title="Limieten voor streamingverbindingen">
    - `streaming.preStartTimeoutMs` (standaard `5000`) sluit sockets die nooit een geldig `start`-frame verzenden.
    - `streaming.maxPendingConnections` (standaard `32`) begrenst het totale aantal niet-geverifieerde sockets vóór de start.
    - `streaming.maxPendingConnectionsPerIp` (standaard `4`) begrenst niet-geverifieerde sockets vóór de start per bron-IP.
    - `streaming.maxConnections` (standaard `128`) begrenst alle open sockets voor mediastreams (in afwachting + actief).

  </Accordion>
  <Accordion title="Migraties van verouderde configuratie">
    Bij het parseren van de configuratie worden deze verouderde sleutels automatisch genormaliseerd en wordt een
    waarschuwing geregistreerd waarin het vervangende pad wordt genoemd; de compatibiliteitslaag wordt in een toekomstige
    release (`2026.6.0`) verwijderd. Voer daarom `openclaw doctor --fix` uit om vastgelegde
    configuratie naar de canonieke vorm te herschrijven:

    - `provider: "log"` → `provider: "mock"`
    - `twilio.from` → `fromNumber`
    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`
    - `realtime.agentContext.includeSystemPrompt` is verwijderd (realtime-context gebruikt nu de gegenereerde agentprompt)

  </Accordion>
</AccordionGroup>

## Sessiebereik

Voice Call gebruikt standaard `sessionScope: "per-phone"`, zodat herhaalde oproepen van
dezelfde beller het gespreksgeheugen behouden. Stel `sessionScope: "per-call"` in wanneer
elke oproep via de telecomprovider met nieuwe context moet beginnen, bijvoorbeeld voor receptie-,
boekings-, IVR- of Google Meet-bridge-stromen waarbij hetzelfde telefoonnummer
verschillende vergaderingen kan vertegenwoordigen.

Voice Call slaat gegenereerde sessiesleutels op onder de geconfigureerde agentnaamruimte
(`agent:<agentId>:voice:*`). Expliciete onbewerkte integratiesleutels worden naar dezelfde
naamruimte omgezet: een canonieke sleutel `agent:<configuredAgentId>:*` behoudt die
eigenaar en respecteert aliasing via `session.mainKey`/globaal bereik in de kern; invoer van
vreemde of onjuist gevormde `agent:*` wordt als een ondoorzichtige sleutel onder de geconfigureerde
agent geplaatst; `global` en `unknown` blijven globale sentinelwaarden.

## Realtime spraakgesprekken

`realtime` selecteert een full-duplex realtime spraakprovider voor live oproepaudio.
Dit staat los van `streaming`, dat audio alleen doorstuurt naar providers voor realtime
transcriptie.

<Warning>
`realtime.enabled` kan niet worden gecombineerd met `streaming.enabled`. Kies één
audiomodus per oproep.
</Warning>

Huidig runtimegedrag:

- `realtime.enabled` wordt ondersteund voor Twilio en Telnyx.
- `realtime.provider` is optioneel. Als deze niet is ingesteld, gebruikt Voice Call de eerste geregistreerde realtime-spraakprovider.
- Meegeleverde realtime-spraakproviders: Google Gemini Live (`google`) en OpenAI (`openai`), geregistreerd door hun providerplugins.
- De onbewerkte configuratie die eigendom is van de provider, bevindt zich onder `realtime.providers.<providerId>`.
- Voice Call stelt standaard de gedeelde realtime-tool `openclaw_agent_consult` beschikbaar. Het realtimemodel kan deze aanroepen wanneer de beller om diepgaandere redenering, actuele informatie of normale OpenClaw-tools vraagt.
- `realtime.consultPolicy` voegt optioneel richtlijnen toe voor wanneer het realtimemodel `openclaw_agent_consult` moet aanroepen.
- `realtime.agentContext.enabled` is standaard uitgeschakeld. Wanneer deze optie is ingeschakeld, voegt Voice Call bij het instellen van de sessie een begrensde agentidentiteit en een capsule met geselecteerde werkruimtebestanden toe aan de instructies voor de realtimeprovider.
- `realtime.fastContext.enabled` is standaard uitgeschakeld. Wanneer deze optie is ingeschakeld, doorzoekt Voice Call eerst de geïndexeerde geheugen-/sessiecontext voor de consultatievraag en retourneert het die fragmenten binnen `realtime.fastContext.timeoutMs` aan het realtimemodel, voordat het alleen op de volledige consultatieagent terugvalt als `realtime.fastContext.fallbackToConsult` waar is.
- Als `realtime.provider` naar een niet-geregistreerde provider verwijst, of als er helemaal geen realtime-spraakprovider is geregistreerd, registreert Voice Call een waarschuwing en slaat het realtime-media over in plaats van de volledige plugin te laten mislukken.
- `inboundPolicy` mag niet `"disabled"` zijn wanneer `realtime.enabled` waar is; `validateProviderConfig` wijst die combinatie af.
- Consultatiesessiesleutels hergebruiken de opgeslagen oproepsessie wanneer die beschikbaar is en vallen vervolgens terug op het geconfigureerde `sessionScope` (standaard `per-phone`, of `per-call` voor geïsoleerde oproepen).

### Toolbeleid

`realtime.toolPolicy` beheert de consultatie-uitvoering:

| Beleid           | Gedrag                                                                                                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | Stelt de consultatietool beschikbaar en beperkt de normale agent tot `read`, `web_search`, `web_fetch`, `x_search`, `memory_search` en `memory_get`.                  |
| `owner`          | Stelt de consultatietool beschikbaar en laat de normale agent het normale agenttoolbeleid gebruiken.                                                                 |
| `none`           | Stelt de consultatietool niet beschikbaar. Aangepaste `realtime.tools` worden nog steeds doorgegeven aan de realtimeprovider.                                         |

`realtime.consultPolicy` beheert alleen de instructies voor het realtimemodel:

| Beleid        | Richtlijn                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------- |
| `auto`        | Behoud de standaardprompt en laat de provider bepalen wanneer de consultatietool wordt aangeroepen.            |
| `substantive` | Beantwoord eenvoudige verbindende gesprekszinnen rechtstreeks en consulteer vóór feiten, geheugen, tools of context. |
| `always`      | Consulteer vóór elk inhoudelijk antwoord.                                                                      |

### Spraakcontext van de agent

Schakel `realtime.agentContext` in wanneer de spraakbrug moet klinken als de
geconfigureerde OpenClaw-agent zonder voor gewone beurten de volledige
heen-en-terugreis van een agentconsultatie te doorlopen. De contextcapsule
wordt eenmaal toegevoegd wanneer de realtimesessie wordt aangemaakt en voegt
dus geen latentie per beurt toe. Aanroepen van `openclaw_agent_consult` voeren
nog steeds de volledige OpenClaw-agent uit en moeten worden gebruikt voor
toolwerk, actuele informatie, geheugenzoekacties of de toestand van de
werkruimte.

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

### Voorbeelden van realtimeproviders

<Tabs>
  <Tab title="Google Gemini Live">
    Standaardwaarden: API-sleutel uit `realtime.providers.google.apiKey`,
    `GEMINI_API_KEY` of `GOOGLE_API_KEY`; model
    `gemini-3.1-flash-live-preview`; stem `Kore`. `sessionResumption` en
    `contextWindowCompression` zijn standaard ingeschakeld voor langere
    oproepen waarbij opnieuw verbinding kan worden gemaakt. Gebruik
    `silenceDurationMs`, `startSensitivity` en `endSensitivity` om snellere
    beurtwisseling voor telefonieaudio af te stellen.

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
                instructions: "Spreek beknopt. Roep openclaw_agent_consult aan voordat je diepgaandere tools gebruikt.",
                toolPolicy: "safe-read-only",
                consultPolicy: "substantive",
                consultThinkingLevel: "low",
                consultFastMode: true,
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-3.1-flash-live-preview",
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
[OpenAI-provider](/nl/providers/openai) voor providerspecifieke opties voor
realtime-spraak.

## Streamingtranscriptie

`streaming` selecteert een realtime-transcriptieprovider voor live-oproepaudio.

Huidig runtimegedrag:

- `streaming.provider` is optioneel. Als deze niet is ingesteld, gebruikt Voice Call de eerste geregistreerde realtime-transcriptieprovider.
- Meegeleverde realtime-transcriptieproviders: Deepgram (`deepgram`), ElevenLabs (`elevenlabs`), Mistral (`mistral`), OpenAI (`openai`) en xAI (`xai`), geregistreerd door hun providerplugins.
- De onbewerkte configuratie die eigendom is van de provider, bevindt zich onder `streaming.providers.<providerId>`.
- Nadat Twilio een geaccepteerd `start`-bericht voor een stream heeft verzonden, registreert Voice Call de stream onmiddellijk, plaatst het binnenkomende media via de transcriptieprovider in de wachtrij terwijl de provider verbinding maakt en start het de eerste begroeting pas wanneer realtime-transcriptie gereed is.
- Als `streaming.provider` naar een niet-geregistreerde provider verwijst, of als er geen provider is geregistreerd, registreert Voice Call een waarschuwing en slaat het mediastreaming over in plaats van de volledige plugin te laten mislukken.

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
                    apiKey: "sk-...", // optioneel als OPENAI_API_KEY is ingesteld
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
    Standaardwaarden: API-sleutel `streaming.providers.xai.apiKey` of
    `XAI_API_KEY` (valt terug op een xAI OAuth-authenticatieprofiel als geen
    van beide is ingesteld); eindpunt `wss://api.x.ai/v1/stt`; codering
    `mulaw`; samplefrequentie `8000`; `endpointingMs: 800`;
    `interimResults: true`.

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
                    apiKey: "${XAI_API_KEY}", // optioneel als XAI_API_KEY is ingesteld
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

Voice Call gebruikt de kernconfiguratie `messages.tts` voor gestreamde spraak
tijdens oproepen. Je kunt deze onder de pluginconfiguratie overschrijven met
**dezelfde structuur** — deze wordt diep samengevoegd met `messages.tts`.

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
**Microsoft-spraak wordt genegeerd voor spraakoproepen.** Telefoniesynthese
vereist een provider die uitvoer voor telefoniedoelen implementeert; de
Microsoft-spraakprovider doet dat niet. Daarom wordt deze voor oproepen
overgeslagen en worden in plaats daarvan andere providers in de
terugvalketen geprobeerd.
</Warning>

Gedragsnotities:

- Verouderde sleutels `tts.<provider>` binnen de pluginconfiguratie (`openai`, `elevenlabs`, `microsoft`, `edge`) worden door `openclaw doctor --fix` hersteld; vastgelegde configuratie moet `tts.providers.<provider>` gebruiken.
- Kern-TTS wordt gebruikt wanneer Twilio-mediastreaming is ingeschakeld; anders vallen oproepen terug op de ingebouwde stemmen van de provider.
- Als een Twilio-mediastream al actief is, valt Voice Call niet terug op TwiML `<Say>`. Als telefonie-TTS in die toestand niet beschikbaar is, mislukt het afspeelverzoek in plaats van twee afspeelpaden te combineren.
- Wanneer telefonie-TTS terugvalt op een secundaire provider, registreert Voice Call voor foutopsporing een waarschuwing met de providerketen (`from`, `to`, `attempts`).
- Wanneer Twilio-onderbreking door de beller of het beëindigen van de stream de wachtende TTS-wachtrij wist, worden afspeelverzoeken in de wachtrij afgehandeld in plaats van bellers die op voltooiing van het afspelen wachten te laten vastlopen.

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
  <Tab title="Overschrijven met ElevenLabs (alleen oproepen)">
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

## Inkomende oproepen

Het beleid voor inkomende oproepen is standaard `disabled`. Stel het volgende
in om inkomende oproepen in te schakelen:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hallo! Hoe kan ik helpen?",
}
```

<Warning>
`inboundPolicy: "allowlist"` is een controle met lage zekerheid op basis van de beller-ID. De plugin
normaliseert de door de provider aangeleverde waarde `From` en vergelijkt deze met `allowFrom`.
Webhookverificatie verifieert de levering door de provider en de integriteit van de payload,
maar bewijst **niet** wie eigenaar is van het PSTN-/VoIP-nummer van de beller. Beschouw
`allowFrom` als filtering op beller-ID, niet als sterke verificatie van de identiteit van de beller.
</Warning>

Automatische antwoorden gebruiken het agentsysteem. Stem dit af met `responseModel`,
`responseSystemPrompt` en `responseTimeoutMs`.

### Routering per nummer

Gebruik `numbers` wanneer één Voice Call-plugin oproepen voor meerdere telefoon-
nummers ontvangt en elk nummer zich als een afzonderlijke lijn moet gedragen. Zo kan
het ene nummer bijvoorbeeld een informele persoonlijke assistent gebruiken, terwijl een ander een zakelijke
persona, een andere antwoordagent en een andere TTS-stem gebruikt.

Routes worden geselecteerd op basis van het door de provider aangeleverde gebelde `To`-nummer. Sleutels moeten
E.164-nummers zijn. Wanneer een oproep binnenkomt, bepaalt Voice Call eenmaal de overeenkomende
route, slaat de gevonden route op in de oproeprecord en hergebruikt die
effectieve configuratie voor de begroeting, het klassieke pad voor automatische antwoorden, het realtime
consultatiepad en TTS-weergave. Als geen route overeenkomt, wordt de algemene Voice Call-
configuratie gebruikt. Uitgaande oproepen gebruiken `numbers` niet; geef bij het starten
van de oproep expliciet het uitgaande doel, het bericht en de sessie door.

Route-overschrijvingen ondersteunen momenteel:

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

De routewaarde `tts` wordt diep samengevoegd met de algemene `tts`-configuratie van Voice Call, zodat
je doorgaans alleen de providerstem hoeft te overschrijven:

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
de systeemprompt, dat een JSON-antwoord in de vorm `{"spoken":"..."}` vereist. Voice Call
extraheert de spraaktekst defensief:

- Negeert payloads die als redeneer- of foutinhoud zijn gemarkeerd.
- Parseert rechtstreekse JSON, JSON in een codeblok of inline `"spoken"`-sleutels.
- Valt terug op platte tekst en verwijdert vermoedelijke inleidende alinea's met planning of metatekst.

Hierdoor blijft de gesproken weergave gericht op tekst voor de beller en wordt voorkomen dat
planningstekst in de audio terechtkomt.

### Gedrag bij het starten van een gesprek

Voor uitgaande `conversation`-oproepen is de verwerking van het eerste bericht gekoppeld aan de actieve
weergavestatus:

- Het wissen van de wachtrij bij onderbreking en automatische antwoorden worden alleen onderdrukt zolang de eerste begroeting actief wordt uitgesproken.
- Als de eerste weergave mislukt, keert de oproep terug naar `listening` en blijft het eerste bericht in de wachtrij staan voor een nieuwe poging.
- De eerste weergave voor Twilio-streaming begint bij het verbinden van de stream, zonder extra vertraging.
- Een onderbreking breekt de actieve weergave af en wist Twilio TTS-items die in de wachtrij staan maar nog niet worden afgespeeld. Gewiste items worden als overgeslagen afgehandeld, zodat de vervolglogica voor antwoorden kan doorgaan zonder te wachten op audio die nooit zal worden afgespeeld.
- Realtime spraakgesprekken gebruiken de eigen openingsbeurt van de realtime stream. Voice Call plaatst voor dat eerste bericht **geen** verouderde `<Say>`-TwiML-update, zodat uitgaande `<Connect><Stream>`-sessies verbonden blijven.

### Respijtperiode bij verbreking van een Twilio-stream

Wanneer een Twilio-mediastream wordt verbroken, wacht Voice Call **2000 ms** voordat
de oproep automatisch wordt beëindigd:

- Als de stream binnen dat tijdsvenster opnieuw verbinding maakt, wordt de automatische beëindiging geannuleerd.
- Als na de respijtperiode geen stream opnieuw wordt geregistreerd, wordt de oproep beëindigd om vastgelopen actieve oproepen te voorkomen.

## Opruimer voor verouderde oproepen

Gebruik `staleCallReaperSeconds` (standaard **120**) om oproepen te beëindigen die nooit
worden beantwoord en nooit een actieve gespreksstatus bereiken, bijvoorbeeld oproepen in de
meldingsmodus waarbij de provider nooit een afsluitende Webhook levert. Stel dit in op `0` om
de functie uit te schakelen.

De opruimer wordt elke 30 seconden uitgevoerd en beëindigt alleen oproepen zonder
`answeredAt`-tijdstempel die nog niet in een afsluitende of actieve
status (`speaking`/`listening`) verkeren. Beantwoorde gesprekken worden dus nooit door
deze timer opgeruimd; `maxDurationSeconds` (standaard 300) is de afzonderlijke limiet die
beantwoorde oproepen beëindigt wanneer ze te lang duren.

Verhoog voor meldingsstromen waarbij providers bel-/antwoord-
webhooks mogelijk langzaam leveren `staleCallReaperSeconds` tot boven de standaardwaarde, zodat trage maar normale
oproepen niet voortijdig worden opgeruimd; `120`-`300` seconden is een redelijk bereik voor
productieomgevingen.

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 120,
        },
      },
    },
  },
}
```

## Webhookbeveiliging

Wanneer er een proxy of tunnel vóór de Gateway staat, reconstrueert de plugin
de openbare URL voor handtekeningverificatie. Deze opties bepalen welke
doorgestuurde headers worden vertrouwd:

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  Hosts uit doorgestuurde headers die zijn toegestaan.
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  Vertrouw doorgestuurde headers zonder een lijst met toegestane waarden.
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  Vertrouw doorgestuurde headers alleen wanneer het externe IP-adres van het verzoek in de lijst voorkomt.
</ParamField>

Aanvullende beveiligingen:

- Webhook-**beveiliging tegen herhaling** is ingeschakeld voor Twilio, Telnyx en Plivo. Herhaalde geldige Webhookverzoeken worden bevestigd, maar de neveneffecten worden overgeslagen.
- Twilio-gespreksbeurten bevatten een token per beurt in `<Gather>`-callbacks, zodat verouderde of herhaalde spraakcallbacks niet kunnen voldoen aan een nieuwere openstaande transcriptiebeurt.
- Niet-geverifieerde Webhookverzoeken worden afgewezen voordat de body wordt gelezen wanneer de vereiste handtekeningheaders van de provider ontbreken.
- De Webhook van voice-call gebruikt het gedeelde profiel voor het lezen van de body vóór verificatie (maximale bodygrootte van 64 KB en een leestime-out van 5 seconden), plus een limiet per sleutel voor gelijktijdige lopende verzoeken (standaard 8 gelijktijdige verzoeken per sleutel) vóór handtekeningverificatie.

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
naar de door de Gateway beheerde voice-call-runtime, zodat de CLI geen tweede
Webhookserver bindt. Als geen Gateway bereikbaar is, vallen de opdrachten terug op
een zelfstandige CLI-runtime.

`latency` leest `calls.jsonl` uit het standaardopslagpad voor voice-call. Gebruik
`--file <path>` om een ander logbestand aan te wijzen en `--last <n>` om
de analyse te beperken tot de laatste N records (standaard 200). De uitvoer bevat minimum/maximum/gemiddelde,
p50 en p95 voor de latentie per beurt en de wachttijden voor luisteren.

## Agenttool

Toolnaam: `voice_call`.

| Actie           | Argumenten                                 |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

De voice-call-plugin wordt geleverd met een bijbehorende agentskill.

## Gateway-RPC

| Methode                     | Argumenten                                                        | Opmerkingen                                                                 |
| --------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `voicecall.initiate`        | `to?`, `message`, `mode?`, `sessionKey?`, `requesterSessionKey?`  | Valt terug op de configuratie `toNumber` wanneer `to` is weggelaten.        |
| `voicecall.start`           | `to`, `message?`, `mode?`, `dtmfSequence?`, `sessionKey?`         | Hetzelfde als `initiate`, maar accepteert ook `dtmfSequence` vóór verbinding. |
| `voicecall.continue`        | `callId`, `message`                                               | Blokkeert totdat de beurt is afgerond en retourneert het transcript.         |
| `voicecall.continue.start`  | `callId`, `message`                                               | Asynchrone variant: retourneert onmiddellijk een `operationId`.              |
| `voicecall.continue.result` | `operationId`                                                     | Vraagt het resultaat van een openstaande `voicecall.continue.start`-bewerking op. |
| `voicecall.speak`           | `callId`, `message`                                               | Spreekt zonder te wachten; gebruikt de realtimebrug wanneer `realtime.enabled`. |
| `voicecall.dtmf`            | `callId`, `digits`                                                |                                                                             |
| `voicecall.end`             | `callId`                                                          |                                                                             |
| `voicecall.status`          | `callId?`                                                         | Laat `callId` weg om alle actieve oproepen weer te geven.                    |

`dtmfSequence` is alleen geldig met `mode: "conversation"`; oproepen in de
meldingsmodus moeten nadat de oproep bestaat `voicecall.dtmf` gebruiken als ze cijfers na de verbinding
nodig hebben.

## Probleemoplossing

### Instellen van Webhooktoegang mislukt

Voer de configuratie uit vanuit dezelfde omgeving waarin de Gateway draait:

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

Voor `twilio`, `telnyx` en `plivo` moet `webhook-exposure` groen zijn. Een
geconfigureerde `publicUrl` mislukt nog steeds wanneer deze naar lokale of particuliere
netwerkruimte verwijst, omdat de provider die adressen niet kan terugbellen.
Gebruik `localhost`, `127.0.0.1`, `0.0.0.0`, `10.x`, `172.16.x`-`172.31.x`,
`192.168.x`, `169.254.x`, `fc00::/7`, `fd00::/8` of andere NAT-
bereiken voor providers niet als `publicUrl`.

Uitgaande Twilio-oproepen in de meldingsmodus sturen hun eerste `<Say>`-TwiML rechtstreeks
mee in het verzoek om de oproep aan te maken, zodat het eerste gesproken bericht niet afhankelijk is van
het ophalen van Webhook-TwiML door Twilio. Een openbare Webhook blijft vereist voor status-
callbacks, gespreksoproepen, DTMF vóór verbinding, realtime streams en
oproepbesturing na verbinding.

Gebruik één openbaar toegangspad:

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

Start of herlaad de Gateway na het wijzigen van de configuratie en voer vervolgens uit:

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` is een proefuitvoering, tenzij je `--yes` meegeeft.

### Providerreferenties mislukken

Controleer de geselecteerde provider en de vereiste referentievelden:

- Twilio: `twilio.accountSid`, `twilio.authToken` en `fromNumber`, of
  `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` en `TWILIO_FROM_NUMBER`.
- Telnyx: `telnyx.apiKey`, `telnyx.connectionId`, `telnyx.publicKey` en
  `fromNumber`, of `TELNYX_API_KEY`, `TELNYX_CONNECTION_ID` en
  `TELNYX_PUBLIC_KEY`.
- Plivo: `plivo.authId`, `plivo.authToken` en `fromNumber`, of
  `PLIVO_AUTH_ID` en `PLIVO_AUTH_TOKEN`.

De aanmeldgegevens moeten op de Gateway-host aanwezig zijn. Het bewerken van een lokaal shellprofiel
heeft geen invloed op een Gateway die al actief is, totdat deze opnieuw wordt gestart of zijn
omgeving opnieuw laadt.

### Gesprekken starten, maar Webhooks van de provider komen niet aan

Controleer of de providerconsole naar de exacte openbare Webhook-URL verwijst:

```text
https://voice.example.com/voice/webhook
```

Inspecteer vervolgens de runtimestatus:

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

Veelvoorkomende oorzaken:

- `publicUrl` verwijst naar een ander pad dan `serve.path`.
- De tunnel-URL is gewijzigd nadat de Gateway is gestart.
- Een proxy stuurt het verzoek door, maar verwijdert of herschrijft de host-/protoheaders.
- De firewall of DNS routeert de openbare hostnaam naar een andere locatie dan de Gateway.
- De Gateway is opnieuw gestart zonder dat de Voice Call-Plugin is ingeschakeld.

Wanneer een reverse proxy of tunnel vóór de Gateway staat, stelt u
`webhookSecurity.allowedHosts` in op de openbare hostnaam, of gebruikt u
`webhookSecurity.trustedProxyIPs` voor een bekend proxyadres. Gebruik
`webhookSecurity.trustForwardingHeaders` alleen wanneer u de
proxygrens beheert.

### Handtekeningverificatie mislukt

Providerhandtekeningen worden gecontroleerd aan de hand van de openbare URL die OpenClaw
reconstrueert uit het inkomende verzoek. Als handtekeningen niet kunnen worden geverifieerd:

- Controleer of de Webhook-URL van de provider exact overeenkomt met `publicUrl`, inclusief schema, host en pad.
- Werk bij gratis ngrok-URL's `publicUrl` bij wanneer de hostnaam van de tunnel verandert.
- Zorg dat de proxy de oorspronkelijke host- en protoheaders behoudt, of configureer `webhookSecurity.allowedHosts`.
- Schakel `skipSignatureVerification` niet in buiten lokale tests.

### Twilio-deelnames aan Google Meet mislukken

Google Meet gebruikt deze Plugin voor deelname via inbellen met Twilio. Controleer eerst Voice
Call:

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

Controleer vervolgens expliciet het Google Meet-transport:

```bash
openclaw googlemeet setup --transport twilio
```

Als Voice Call correct werkt, maar de Meet-deelnemer nooit deelneemt, controleert u het
inbelnummer en de pincode van Meet, en `--dtmf-sequence`. Het telefoongesprek kan correct werken
terwijl de vergadering een onjuiste DTMF-reeks weigert of negeert.

Google Meet start via `voicecall.start` het Twilio-telefoongedeelte met een
DTMF-reeks vóór de verbinding. Reeksen die van een pincode zijn afgeleid, bevatten de
`voiceCall.dtmfDelayMs` van de Google Meet-Plugin (standaard **12000 ms**) als voorafgaande
Twilio-wachttekens, omdat de inbelprompts van Meet vertraagd kunnen binnenkomen. Voice Call
leidt vervolgens terug naar realtimeverwerking voordat om de introductiebegroeting wordt verzocht.

Gebruik `openclaw logs --follow` voor het live faseverloop. Bij een correct werkende Twilio-deelname aan Meet
wordt deze volgorde vastgelegd:

- Google Meet delegeert de Twilio-deelname aan Voice Call.
- Voice Call slaat DTMF-TwiML voor de verbinding op.
- De initiële TwiML van Twilio wordt verwerkt en aangeboden vóór de realtimeverwerking.
- Voice Call biedt realtime-TwiML aan voor het Twilio-gesprek.
- Google Meet vraagt na de vertraging na DTMF introductiespraak aan met `voicecall.speak`.

`openclaw voicecall tail` toont nog steeds opgeslagen gespreksrecords; dit is nuttig voor
de gespreksstatus en transcripties, maar niet elke Webhook-/realtimeovergang
verschijnt daar.

### Realtimegesprek heeft geen spraak

Controleer of slechts één audiomodus is ingeschakeld: `realtime.enabled` en
`streaming.enabled` kunnen niet beide `true` zijn.

Controleer voor realtime Twilio-/Telnyx-gesprekken ook het volgende:

- Een realtimeprovider-Plugin is geladen en geregistreerd.
- `realtime.provider` is niet ingesteld of bevat de naam van een geregistreerde provider.
- De API-sleutel van de provider is beschikbaar voor het Gateway-proces.
- `openclaw logs --follow` toont dat realtime-TwiML is aangeboden, de realtimebridge is gestart en de initiële begroeting in de wachtrij is geplaatst.

## Gerelateerd

- [Gespreksmodus](/nl/nodes/talk)
- [Tekst-naar-spraak](/nl/tools/tts)
- [Spraakactivering](/nl/nodes/voicewake)
