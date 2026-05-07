---
read_when:
    - Abilitare la sintesi vocale per le risposte
    - Configurazione di un provider TTS, di una catena di fallback o di una persona
    - Uso dei comandi o delle direttive /tts
sidebarTitle: Text to speech (TTS)
summary: Sintesi vocale per le risposte in uscita — fornitori, personalità, comandi slash e output per canale
title: Sintesi vocale
x-i18n:
    generated_at: "2026-05-07T13:27:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96a09005d4b8d2c40af81ccb363109333faaed80e3bb87e53d8b5d50a5358f95
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw può convertire le risposte in uscita in audio tramite **14 provider vocali**
e consegnare messaggi vocali nativi su Feishu, Matrix, Telegram e WhatsApp,
allegati audio ovunque altrove e stream PCM/Ulaw per telefonia e Talk.

TTS è la metà di output vocale della modalità `stt-tts` di Talk. Le sessioni Talk
`realtime` native del provider sintetizzano la voce all'interno del provider realtime
invece di chiamare questo percorso TTS, mentre le sessioni `transcription` non sintetizzano
una risposta vocale dell'assistente.

## Avvio rapido

<Steps>
  <Step title="Pick a provider">
    OpenAI ed ElevenLabs sono le opzioni hosted più affidabili. Microsoft e
    Local CLI funzionano senza una chiave API. Vedi la [matrice dei provider](#supported-providers)
    per l'elenco completo.
  </Step>
  <Step title="Set the API key">
    Esporta la variabile d'ambiente per il tuo provider (per esempio `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft e Local CLI non richiedono alcuna chiave.
  </Step>
  <Step title="Enable in config">
    Imposta `messages.tts.auto: "always"` e `messages.tts.provider`:

    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "elevenlabs",
        },
      },
    }
    ```

  </Step>
  <Step title="Try it in chat">
    `/tts status` mostra lo stato corrente. `/tts audio Hello from OpenClaw`
    invia una risposta audio una tantum.
  </Step>
</Steps>

<Note>
Auto-TTS è **disattivato** per impostazione predefinita. Quando `messages.tts.provider` non è impostato,
OpenClaw sceglie il primo provider configurato nell'ordine di selezione automatica del registro.
Lo strumento agente integrato `tts` è solo per intenzioni esplicite: la chat ordinaria rimane
testuale a meno che l'utente non chieda audio, usi `/tts` o abiliti Auto-TTS/voce tramite direttiva.
</Note>

## Provider supportati

| Provider          | Autenticazione                                                                                                  | Note                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (anche `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)         | Output nativo di note vocali Ogg/Opus e telefonia.                                          |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | TTS compatibile con OpenAI. Predefinito: `hexgrad/Kokoro-82M`.                              |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` o `XI_API_KEY`                                                                              | Clonazione vocale, multilingue, deterministico tramite `seed`; in streaming per la riproduzione vocale Discord. |
| **Google Gemini** | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                                                                              | TTS batch API Gemini; consapevole della persona tramite `promptTemplate: "audio-profile-v1"`. |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | Output per note vocali e telefonia.                                                         |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | API TTS in streaming. Note vocali Opus native e telefonia PCM.                              |
| **Local CLI**     | nessuna                                                                                                          | Esegue un comando TTS locale configurato.                                                    |
| **Microsoft**     | nessuna                                                                                                          | TTS neurale Edge pubblico tramite `node-edge-tts`. Best-effort, senza SLA.                  |
| **MiniMax**       | `MINIMAX_API_KEY` (o Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)       | API T2A v2. Predefinito: `speech-2.8-hd`.                                                   |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | Usato anche per il riepilogo automatico; supporta `instructions` per la persona.            |
| **OpenRouter**    | `OPENROUTER_API_KEY` (può riutilizzare `models.providers.openrouter.apiKey`)                                     | Modello predefinito `hexgrad/kokoro-82m`.                                                    |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` o `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/token legacy: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | API HTTP BytePlus Seed Speech.                                                              |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | Provider condiviso per immagini, video e voce.                                               |
| **xAI**           | `XAI_API_KEY`                                                                                                    | TTS batch xAI. Le note vocali Opus native **non** sono supportate.                          |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | TTS MiMo tramite completamenti chat Xiaomi.                                                  |

Se sono configurati più provider, quello selezionato viene usato per primo e gli
altri sono opzioni di fallback. Il riepilogo automatico usa `summaryModel` (o
`agents.defaults.model.primary`), quindi anche quel provider deve essere autenticato
se mantieni abilitati i riepiloghi.

<Warning>
Il provider **Microsoft** incluso usa il servizio TTS neurale online di Microsoft Edge
tramite `node-edge-tts`. È un servizio web pubblico senza SLA o quota pubblicati:
consideralo best-effort. L'id provider legacy `edge` viene normalizzato in
`microsoft` e `openclaw doctor --fix` riscrive la configurazione persistita;
le nuove configurazioni dovrebbero sempre usare `microsoft`.
</Warning>

## Configurazione

La configurazione TTS si trova sotto `messages.tts` in `~/.openclaw/openclaw.json`. Scegli un
preset e adatta il blocco del provider:

<Tabs>
  <Tab title="Azure Speech">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "azure-speech",
      providers: {
        "azure-speech": {
          apiKey: "${AZURE_SPEECH_KEY}",
          region: "eastus",
          voice: "en-US-JennyNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          voiceNoteOutputFormat: "ogg-24khz-16bit-mono-opus",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Google Gemini">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "${GEMINI_API_KEY}",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          // Optional natural-language style prompts:
          // audioProfile: "Speak in a calm, podcast-host tone.",
          // speakerName: "Alex",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Gradium">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "${GRADIUM_API_KEY}",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Inworld">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "inworld",
      providers: {
        inworld: {
          apiKey: "${INWORLD_API_KEY}",
          modelId: "inworld-tts-1.5-max",
          voiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Local CLI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "tts-local-cli",
      providers: {
        "tts-local-cli": {
          command: "say",
          args: ["-o", "{{OutputPath}}", "{{Text}}"],
          outputFormat: "wav",
          timeoutMs: 120000,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Microsoft (no key)">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          voice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+0%",
          pitch: "+0%",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="MiniMax">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "${MINIMAX_API_KEY}",
          model: "speech-2.8-hd",
          voiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenAI + ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      providers: {
        openai: {
          apiKey: "${OPENAI_API_KEY}",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
          voiceSettings: { stability: 0.5, similarityBoost: 0.75, style: 0.0, useSpeakerBoost: true, speed: 1.0 },
          applyTextNormalization: "auto",
          languageCode: "en",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenRouter">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "${OPENROUTER_API_KEY}",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Volcengine">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "${VOLCENGINE_TTS_API_KEY}",
          resourceId: "seed-tts-1.0",
          voice: "en_female_anna_mars_bigtts",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="xAI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "${XAI_API_KEY}",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Xiaomi MiMo">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "${XIAOMI_API_KEY}",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

### Override vocali per agente

Usa `agents.list[].tts` quando un agente deve parlare con un provider, una voce,
un modello, una persona o una modalità Auto-TTS diversi. Il blocco agente viene unito in profondità sopra
`messages.tts`, quindi le credenziali del provider possono restare nella configurazione globale del provider:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: { apiKey: "${ELEVENLABS_API_KEY}", model: "eleven_multilingual_v2" },
      },
    },
  },
  agents: {
    list: [
      {
        id: "reader",
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

Per fissare una persona per agente, imposta `agents.list[].tts.persona` insieme alla
configurazione del provider: sovrascrive il valore globale `messages.tts.persona` solo per quell'agente.

Ordine di precedenza per risposte automatiche, `/tts audio`, `/tts status` e lo
strumento agente `tts`:

1. `messages.tts`
2. `agents.list[].tts` attivo
3. sovrascrittura del canale, quando il canale supporta `channels.<channel>.tts`
4. sovrascrittura dell'account, quando il canale passa `channels.<channel>.accounts.<id>.tts`
5. preferenze `/tts` locali per questo host
6. direttive inline `[[tts:...]]` quando le [sovrascritture del modello](#model-driven-directives) sono abilitate

Le sovrascritture di canale e account usano la stessa forma di `messages.tts` e
vengono unite in profondità sopra i livelli precedenti, quindi le credenziali condivise del provider possono restare in
`messages.tts` mentre un canale o un account bot cambia solo voce, modello, persona
o modalità automatica:

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { apiKey: "${OPENAI_API_KEY}", model: "gpt-4o-mini-tts" },
      },
    },
  },
  channels: {
    feishu: {
      accounts: {
        english: {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

## Persona

Una **persona** è un'identità vocale stabile che può essere applicata in modo deterministico
tra provider. Può preferire un provider, definire un intento di prompt neutro rispetto al provider
e contenere associazioni specifiche per provider per voci, modelli, template di prompt,
seed e impostazioni vocali.

### Persona minima

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "Narrator",
          provider: "elevenlabs",
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL", modelId: "eleven_multilingual_v2" },
          },
        },
      },
    },
  },
}
```

### Persona completa (prompt neutro rispetto al provider)

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Dry, warm British butler narrator.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "A brilliant British butler. Dry, witty, warm, charming, emotionally expressive, never generic.",
            scene: "A quiet late-night study. Close-mic narration for a trusted operator.",
            sampleContext: "The speaker is answering a private technical request with concise confidence and dry warmth.",
            style: "Refined, understated, lightly amused.",
            accent: "British English.",
            pacing: "Measured, with short dramatic pauses.",
            constraints: ["Do not read configuration values aloud.", "Do not explain the persona."],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              voiceName: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", voice: "cedar" },
            elevenlabs: {
              voiceId: "voice_id",
              modelId: "eleven_multilingual_v2",
              seed: 42,
              voiceSettings: {
                stability: 0.65,
                similarityBoost: 0.8,
                style: 0.25,
                useSpeakerBoost: true,
                speed: 0.95,
              },
            },
          },
        },
      },
    },
  },
}
```

### Risoluzione della persona

La persona attiva viene selezionata in modo deterministico:

1. preferenza locale `/tts persona <id>`, se impostata.
2. `messages.tts.persona`, se impostata.
3. Nessuna persona.

La selezione del provider applica prima i valori espliciti:

1. Sovrascritture dirette (CLI, Gateway, Talk, direttive TTS consentite).
2. Preferenza locale `/tts provider <id>`.
3. `provider` della persona attiva.
4. `messages.tts.provider`.
5. Selezione automatica dal registro.

Per ogni tentativo di provider, OpenClaw unisce le configurazioni in questo ordine:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Sovrascritture della richiesta attendibile
4. Sovrascritture da direttiva TTS emessa dal modello consentita

### Come i provider usano i prompt della persona

I campi del prompt della persona (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) sono **neutri rispetto al provider**. Ogni provider decide come
usarli:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Incapsula i campi del prompt della persona in una struttura di prompt Gemini TTS **solo quando**
    la configurazione effettiva del provider Google imposta `promptTemplate: "audio-profile-v1"`
    o `personaPrompt`. I campi precedenti `audioProfile` e `speakerName` vengono
    ancora anteposti come testo di prompt specifico di Google. I tag audio inline come
    `[whispers]` o `[laughs]` dentro un blocco `[[tts:text]]` vengono preservati
    nella trascrizione Gemini; OpenClaw non genera questi tag.
  </Accordion>
  <Accordion title="OpenAI">
    Mappa i campi del prompt della persona al campo `instructions` della richiesta **solo quando**
    non sono configurate `instructions` OpenAI esplicite. Le `instructions`
    esplicite hanno sempre la precedenza.
  </Accordion>
  <Accordion title="Altri provider">
    Usano solo le associazioni della persona specifiche del provider sotto
    `personas.<id>.providers.<provider>`. I campi del prompt della persona vengono ignorati
    a meno che il provider implementi una propria mappatura dei prompt della persona.
  </Accordion>
</AccordionGroup>

### Criterio di ripiego

`fallbackPolicy` controlla il comportamento quando una persona **non ha associazioni** per il
provider tentato:

| Criterio            | Comportamento                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **Predefinito.** I campi di prompt neutri rispetto al provider restano disponibili; il provider può usarli o ignorarli.                         |
| `provider-defaults` | La persona viene omessa dalla preparazione del prompt per quel tentativo; il provider usa i propri valori predefiniti neutri mentre il ripiego verso altri provider continua. |
| `fail`              | Salta quel tentativo di provider con `reasonCode: "not_configured"` e `personaBinding: "missing"`. I provider di ripiego vengono ancora provati. |

L'intera richiesta TTS fallisce solo quando **ogni** provider tentato viene saltato
o fallisce.

La selezione del provider della sessione Talk ha ambito di sessione. Un client Talk deve scegliere
id provider, id modello, id voce e impostazioni locali da `talk.catalog` e passarli
tramite la sessione Talk o la richiesta di passaggio. L'apertura di una sessione vocale non deve
mutare `messages.tts` o i valori predefiniti globali del provider Talk.

## Direttive guidate dal modello

Per impostazione predefinita, l'assistente **può** emettere direttive `[[tts:...]]` per sovrascrivere
voce, modello o velocità per una singola risposta, più un blocco opzionale
`[[tts:text]]...[[/tts:text]]` per indicazioni espressive che devono apparire solo
nell'audio:

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Quando `messages.tts.auto` è `"tagged"`, le **direttive sono obbligatorie** per attivare
l'audio. La consegna a blocchi in streaming rimuove le direttive dal testo visibile prima che il
canale le veda, anche quando sono divise tra blocchi adiacenti.

`provider=...` viene ignorato a meno che `modelOverrides.allowProvider: true`. Quando una
risposta dichiara `provider=...`, le altre chiavi in quella direttiva vengono analizzate
solo da quel provider; le chiavi non supportate vengono rimosse e riportate come avvisi di
direttiva TTS.

**Chiavi di direttiva disponibili:**

- `provider` (id provider registrato; richiede `allowProvider: true`)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume MiniMax, 0-10)
- `pitch` (intonazione intera MiniMax, -12 a 12; i valori frazionari vengono troncati)
- `emotion` (tag emozione Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Disabilita completamente le sovrascritture del modello:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Consenti il cambio di provider mantenendo configurabili le altre manopole:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Comandi slash

Comando singolo `/tts`. Su Discord, OpenClaw registra anche `/voice` perché
`/tts` è un comando integrato di Discord: il testo `/tts ...` funziona comunque.

```text
/tts off | on | status
/tts chat on | off | default
/tts latest
/tts provider <id>
/tts persona <id> | off
/tts limit <chars>
/tts summary off
/tts audio <text>
```

<Note>
I comandi richiedono un mittente autorizzato (si applicano le regole allowlist/proprietario) e
`commands.text` deve essere abilitato oppure la registrazione nativa dei comandi deve essere abilitata.
</Note>

Note sul comportamento:

- `/tts on` scrive la preferenza TTS locale su `always`; `/tts off` la scrive su `off`.
- `/tts chat on|off|default` scrive una sovrascrittura TTS automatica con ambito di sessione per la chat corrente.
- `/tts persona <id>` scrive la preferenza locale della persona; `/tts persona off` la cancella.
- `/tts latest` legge l'ultima risposta dell'assistente dalla trascrizione della sessione corrente e la invia una volta come audio. Memorizza solo un hash di quella risposta nella voce di sessione per evitare invii vocali duplicati.
- `/tts audio` genera una risposta audio una tantum (non attiva TTS).
- `limit` e `summary` vengono memorizzati nelle **preferenze locali**, non nella configurazione principale.
- `/tts status` include diagnostica di ripiego per l'ultimo tentativo: `Fallback: <primary> -> <used>`, `Attempts: ...` e dettagli per tentativo (`provider:outcome(reasonCode) latency`).
- `/status` mostra la modalità TTS attiva più provider, modello, voce e metadati dell'endpoint personalizzato sanificati configurati quando TTS è abilitato.

## Preferenze per utente

I comandi slash scrivono sovrascritture locali in `prefsPath`. Il valore predefinito è
`~/.openclaw/settings/tts.json`; sovrascrivilo con la variabile env `OPENCLAW_TTS_PREFS`
o `messages.tts.prefsPath`.

| Campo memorizzato | Effetto                                      |
| ----------------- | ------------------------------------------- |
| `auto`            | Sovrascrittura TTS automatica locale (`always`, `off`, …) |
| `provider`        | Sovrascrittura locale del provider primario |
| `persona`         | Sovrascrittura locale della persona         |
| `maxLength`       | Soglia di riepilogo (predefinita `1500` caratteri) |
| `summarize`       | Interruttore del riepilogo (predefinito `true`) |

Queste sovrascrivono la configurazione effettiva da `messages.tts` più il blocco
`agents.list[].tts` attivo per quell'host.

## Formati di output (fissi)

La consegna vocale TTS è guidata dalle capacità del canale. I plugin di canale dichiarano
se TTS in stile vocale debba chiedere ai provider un target nativo `voice-note` oppure
mantenere la normale sintesi `audio-file` e limitarsi a contrassegnare l'output compatibile per la consegna vocale.

- **Canali compatibili con le note vocali**: le risposte con note vocali preferiscono Opus (`opus_48000_64` da ElevenLabs, `opus` da OpenAI).
  - 48kHz / 64kbps è un buon compromesso per i messaggi vocali.
- **Feishu / WhatsApp**: quando una risposta con nota vocale viene prodotta come MP3/WebM/WAV/M4A
  o un altro probabile file audio, il plugin del canale la transcodifica in Ogg/Opus
  a 48kHz con `ffmpeg` prima di inviare il messaggio vocale nativo. WhatsApp invia
  il risultato tramite il payload Baileys `audio` con `ptt: true` e
  `audio/ogg; codecs=opus`. Se la conversione non riesce, Feishu riceve il file
  originale come allegato; l'invio WhatsApp non riesce invece di pubblicare un
  payload PTT incompatibile.
- **BlueBubbles**: mantiene la sintesi del provider nel normale percorso dei file audio; gli output MP3
  e CAF vengono contrassegnati per la consegna come memo vocale iMessage.
- **Altri canali**: MP3 (`mp3_44100_128` da ElevenLabs, `mp3` da OpenAI).
  - 44,1kHz / 128kbps è il bilanciamento predefinito per la chiarezza del parlato.
- **MiniMax**: MP3 (modello `speech-2.8-hd`, frequenza di campionamento 32kHz) per gli allegati audio normali. Per i target di note vocali dichiarati dal canale, OpenClaw transcodifica l'MP3 MiniMax in Opus a 48kHz con `ffmpeg` prima della consegna quando il canale dichiara la transcodifica.
- **Xiaomi MiMo**: MP3 per impostazione predefinita, o WAV quando configurato. Per i target di note vocali dichiarati dal canale, OpenClaw transcodifica l'output Xiaomi in Opus a 48kHz con `ffmpeg` prima della consegna quando il canale dichiara la transcodifica.
- **CLI locale**: usa il `outputFormat` configurato. I target di note vocali vengono
  convertiti in Ogg/Opus e l'output telefonico viene convertito in PCM mono grezzo
  a 16 kHz con `ffmpeg`.
- **Google Gemini**: Gemini API TTS restituisce PCM grezzo a 24kHz. OpenClaw lo incapsula come WAV per gli allegati audio, lo transcodifica in Opus a 48kHz per i target di note vocali e restituisce direttamente PCM per Talk/telefonia.
- **Gradium**: WAV per gli allegati audio, Opus per i target di note vocali e `ulaw_8000` a 8 kHz per la telefonia.
- **Inworld**: MP3 per gli allegati audio normali, `OGG_OPUS` nativo per i target di note vocali e `PCM` grezzo a 22050 Hz per Talk/telefonia.
- **xAI**: MP3 per impostazione predefinita; `responseFormat` può essere `mp3`, `wav`, `pcm`, `mulaw` o `alaw`. OpenClaw usa l'endpoint REST TTS batch di xAI e restituisce un allegato audio completo; il WebSocket TTS in streaming di xAI non viene usato da questo percorso del provider. Il formato Opus nativo per note vocali non è supportato da questo percorso.
- **Microsoft**: usa `microsoft.outputFormat` (predefinito `audio-24khz-48kbitrate-mono-mp3`).
  - Il trasporto incluso accetta un `outputFormat`, ma non tutti i formati sono disponibili dal servizio.
  - I valori del formato di output seguono i formati di output Microsoft Speech (inclusi Ogg/WebM Opus).
  - Telegram `sendVoice` accetta OGG/MP3/M4A; usa OpenAI/ElevenLabs se ti servono
    messaggi vocali Opus garantiti.
  - Se il formato di output Microsoft configurato non riesce, OpenClaw riprova con MP3.

I formati di output OpenAI/ElevenLabs sono fissi per canale (vedi sopra).

## Comportamento Auto-TTS

Quando `messages.tts.auto` è abilitato, OpenClaw:

- Salta TTS se la risposta contiene già media o una direttiva `MEDIA:`.
- Salta le risposte molto brevi (sotto 10 caratteri).
- Riassume le risposte lunghe quando i riepiloghi sono abilitati, usando
  `summaryModel` (o `agents.defaults.model.primary`).
- Allega l'audio generato alla risposta.
- In `mode: "final"`, invia comunque TTS solo audio per le risposte finali in streaming
  dopo il completamento dello stream di testo; il media generato passa attraverso la stessa
  normalizzazione media del canale degli allegati di risposta normali.

Se la risposta supera `maxLength` e il riepilogo è disattivato (o non è presente alcuna chiave API per il
modello di riepilogo), l'audio viene saltato e viene inviata la normale risposta di testo.

```text
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / MEDIA: / short?
          yes -> send text
          no  -> length > limit?
                   no  -> TTS -> attach audio
                   yes -> summary enabled?
                            no  -> send text
                            yes -> summarize -> TTS -> attach audio
```

## Formati di output per canale

  | Destinazione                         | Formato                                                                                                                               |
  | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
  | Feishu / Matrix / Telegram / WhatsApp | Le risposte con note vocali preferiscono **Opus** (`opus_48000_64` da ElevenLabs, `opus` da OpenAI). 48 kHz / 64 kbps bilanciano chiarezza e dimensione. |
  | Altri canali                          | **MP3** (`mp3_44100_128` da ElevenLabs, `mp3` da OpenAI). 44,1 kHz / 128 kbps predefiniti per il parlato.                             |
  | Talk / telefonia                      | **PCM** nativo del provider (Inworld 22050 Hz, Google 24 kHz), oppure `ulaw_8000` da Gradium per la telefonia.                        |

  Note per provider:

  - **Transcodifica Feishu / WhatsApp:** Quando una risposta con nota vocale arriva come MP3/WebM/WAV/M4A, il Plugin del canale la transcodifica in Ogg/Opus a 48 kHz con `ffmpeg`. WhatsApp invia tramite Baileys con `ptt: true` e `audio/ogg; codecs=opus`. Se la conversione non riesce: Feishu ripiega allegando il file originale; l'invio di WhatsApp fallisce invece di pubblicare un payload PTT incompatibile.
  - **MiniMax / Xiaomi MiMo:** MP3 predefinito (32 kHz per MiniMax `speech-2.8-hd`); transcodificato in Opus a 48 kHz per le destinazioni con note vocali tramite `ffmpeg`.
  - **CLI locale:** Usa `outputFormat` configurato. Le destinazioni con note vocali vengono convertite in Ogg/Opus e l'output per telefonia in PCM mono grezzo a 16 kHz.
  - **Google Gemini:** Restituisce PCM grezzo a 24 kHz. OpenClaw lo incapsula come WAV per gli allegati, lo transcodifica in Opus a 48 kHz per le destinazioni con note vocali, restituisce direttamente PCM per Talk/telefonia.
  - **Inworld:** Allegati MP3, nota vocale nativa `OGG_OPUS`, `PCM` grezzo a 22050 Hz per Talk/telefonia.
  - **xAI:** MP3 per impostazione predefinita; `responseFormat` può essere `mp3|wav|pcm|mulaw|alaw`. Usa l'endpoint REST batch di xAI: il TTS WebSocket in streaming **non** viene usato. Il formato nativo Opus per note vocali **non** è supportato.
  - **Microsoft:** Usa `microsoft.outputFormat` (predefinito `audio-24khz-48kbitrate-mono-mp3`). Telegram `sendVoice` accetta OGG/MP3/M4A; usa OpenAI/ElevenLabs se ti servono messaggi vocali Opus garantiti. Se il formato Microsoft configurato fallisce, OpenClaw riprova con MP3.

  I formati di output di OpenAI ed ElevenLabs sono fissi per canale come elencato sopra.

  ## Riferimento dei campi

  <AccordionGroup>
  <Accordion title="Top-level messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Modalità Auto-TTS. `inbound` invia audio solo dopo un messaggio vocale in ingresso; `tagged` invia audio solo quando la risposta include direttive `[[tts:...]]` o un blocco `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Interruttore legacy. `openclaw doctor --fix` lo migra a `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` include le risposte di strumenti/blocchi oltre alle risposte finali.
    </ParamField>
    <ParamField path="provider" type="string">
      ID del provider vocale. Quando non impostato, OpenClaw usa il primo provider configurato nell'ordine di selezione automatica del registro. Il valore legacy `provider: "edge"` viene riscritto in `"microsoft"` da `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      ID della persona attiva da `personas`. Normalizzato in minuscolo.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Identità parlata stabile. Campi: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Consulta [Personas](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Modello economico per il riepilogo automatico; predefinito a `agents.defaults.model.primary`. Accetta `provider/model` o un alias di modello configurato.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Consenti al modello di emettere direttive TTS. `enabled` è predefinito a `true`; `allowProvider` è predefinito a `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Impostazioni di proprietà del provider indicizzate per ID del provider vocale. I blocchi diretti legacy (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) vengono riscritti da `openclaw doctor --fix`; committa solo `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      Limite rigido per i caratteri di input TTS. `/tts audio` fallisce se viene superato.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      Timeout della richiesta in millisecondi.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Sovrascrive il percorso JSON locale delle preferenze (provider/limite/riepilogo). Predefinito `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY`, oppure `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Regione Azure Speech (ad es. `eastus`). Env: `AZURE_SPEECH_REGION` oppure `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Sovrascrittura opzionale dell'endpoint Azure Speech (alias `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">ShortName della voce Azure. Predefinito `en-US-JennyNeural`.</ParamField>
    <ParamField path="lang" type="string">Codice lingua SSML. Predefinito `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">`X-Microsoft-OutputFormat` di Azure per audio standard. Predefinito `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">`X-Microsoft-OutputFormat` di Azure per output con note vocali. Predefinito `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Ripiega su `ELEVENLABS_API_KEY` o `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">ID modello (ad es. `eleven_multilingual_v2`, `eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">ID voce ElevenLabs.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (ciascuno `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = normale).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Modalità di normalizzazione del testo.</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 a 2 lettere (ad es. `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Intero `0..4294967295` per determinismo best-effort.</ParamField>
    <ParamField path="baseUrl" type="string">Sovrascrive l'URL base dell'API ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Ripiega su `GEMINI_API_KEY` / `GOOGLE_API_KEY`. Se omesso, TTS può riutilizzare `models.providers.google.apiKey` prima del fallback env.</ParamField>
    <ParamField path="model" type="string">Modello TTS Gemini. Predefinito `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="voiceName" type="string">Nome della voce predefinita Gemini. Predefinito `Kore`. Alias: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Prompt di stile in linguaggio naturale anteposto al testo parlato.</ParamField>
    <ParamField path="speakerName" type="string">Etichetta opzionale del parlante anteposta al testo parlato quando il prompt usa un parlante nominato.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Imposta a `audio-profile-v1` per avvolgere i campi del prompt della persona attiva in una struttura di prompt TTS Gemini deterministica.</ParamField>
    <ParamField path="personaPrompt" type="string">Testo prompt extra specifico per Google sulla persona, aggiunto alle note del regista del template.</ParamField>
    <ParamField path="baseUrl" type="string">È accettato solo `https://generativelanguage.googleapis.com`.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Env: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Predefinito `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">Predefinito Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Primario Inworld

    <ParamField path="apiKey" type="string">Env: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Predefinito `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Predefinito `inworld-tts-1.5-max`. Anche: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">Predefinito `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">Temperatura di campionamento `0..2`.</ParamField>

  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">Eseguibile locale o stringa di comando per TTS CLI.</ParamField>
    <ParamField path="args" type="string[]">Argomenti del comando. Supporta i segnaposto `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Formato di output CLI previsto. Predefinito `mp3` per gli allegati audio.</ParamField>
    <ParamField path="timeoutMs" type="number">Timeout del comando in millisecondi. Predefinito `120000`.</ParamField>
    <ParamField path="cwd" type="string">Directory di lavoro facoltativa del comando.</ParamField>
    <ParamField path="env" type="Record<string, string>">Override facoltativi dell'ambiente per il comando.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (no API key)">
    <ParamField path="enabled" type="boolean" default="true">Consenti l'uso della sintesi vocale Microsoft.</ParamField>
    <ParamField path="voice" type="string">Nome della voce neurale Microsoft (ad es. `en-US-MichelleNeural`).</ParamField>
    <ParamField path="lang" type="string">Codice lingua (ad es. `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Formato di output Microsoft. Predefinito `audio-24khz-48kbitrate-mono-mp3`. Non tutti i formati sono supportati dal trasporto incluso basato su Edge.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Stringhe percentuali (ad es. `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Scrivi i sottotitoli JSON accanto al file audio.</ParamField>
    <ParamField path="proxy" type="string">URL del proxy per le richieste di sintesi vocale Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Override del timeout della richiesta (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Alias legacy. Esegui `openclaw doctor --fix` per riscrivere la configurazione persistente in `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Ripiega su `MINIMAX_API_KEY`. Autenticazione Token Plan tramite `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` o `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Predefinito `https://api.minimax.io`. Env: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Predefinito `speech-2.8-hd`. Env: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">Predefinito `English_expressive_narrator`. Env: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Predefinito `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Predefinito `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Intero `-12..12`. Predefinito `0`. I valori frazionari vengono troncati prima della richiesta.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Ripiega su `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">ID modello TTS OpenAI (ad es. `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">Nome della voce (ad es. `alloy`, `cedar`).</ParamField>
    <ParamField path="instructions" type="string">Campo OpenAI `instructions` esplicito. Quando impostato, i campi del prompt persona **non** vengono mappati automaticamente.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">Campi JSON aggiuntivi uniti nei corpi delle richieste `/audio/speech` dopo i campi TTS OpenAI generati. Usalo per endpoint compatibili con OpenAI come Kokoro, che richiedono chiavi specifiche del provider come `lang`; le chiavi prototype non sicure vengono ignorate.</ParamField>
    <ParamField path="baseUrl" type="string">
      Esegui l'override dell'endpoint TTS OpenAI. Ordine di risoluzione: configurazione → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. I valori non predefiniti sono trattati come endpoint TTS compatibili con OpenAI, quindi sono accettati nomi di modelli e voci personalizzati.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Env: `OPENROUTER_API_KEY`. Può riutilizzare `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">Predefinito `https://openrouter.ai/api/v1`. Il legacy `https://openrouter.ai/v1` viene normalizzato.</ParamField>
    <ParamField path="model" type="string">Predefinito `hexgrad/kokoro-82m`. Alias: `modelId`.</ParamField>
    <ParamField path="voice" type="string">Predefinito `af_alloy`. Alias: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Predefinito `mp3`.</ParamField>
    <ParamField path="speed" type="number">Override della velocità nativa del provider.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Env: `VOLCENGINE_TTS_API_KEY` o `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Predefinito `seed-tts-1.0`. Env: `VOLCENGINE_TTS_RESOURCE_ID`. Usa `seed-tts-2.0` quando il tuo progetto dispone dell'abilitazione TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">Intestazione della chiave app. Predefinito `aGjiRDfUWi`. Env: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Esegui l'override dell'endpoint HTTP Seed Speech TTS. Env: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">Tipo di voce. Predefinito `en_female_anna_mars_bigtts`. Env: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">Rapporto di velocità nativo del provider.</ParamField>
    <ParamField path="emotion" type="string">Tag emozione nativo del provider.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Campi legacy di Volcengine Speech Console. Env: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (predefinito `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Env: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Predefinito `https://api.x.ai/v1`. Env: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">Predefinito `eve`. Voci live: `ara`, `eve`, `leo`, `rex`, `sal`, `una`.</ParamField>
    <ParamField path="language" type="string">Codice lingua BCP-47 o `auto`. Predefinito `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Predefinito `mp3`.</ParamField>
    <ParamField path="speed" type="number">Override della velocità nativa del provider.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Env: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Predefinito `https://api.xiaomimimo.com/v1`. Env: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Predefinito `mimo-v2.5-tts`. Env: `XIAOMI_TTS_MODEL`. Supporta anche `mimo-v2-tts`.</ParamField>
    <ParamField path="voice" type="string">Predefinito `mimo_default`. Env: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Predefinito `mp3`. Env: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Istruzione di stile facoltativa in linguaggio naturale inviata come messaggio dell'utente; non viene pronunciata.</ParamField>
  </Accordion>
</AccordionGroup>

## Strumento agente

Lo strumento `tts` converte il testo in parlato e restituisce un allegato audio per
la consegna della risposta. Su Feishu, Matrix, Telegram e WhatsApp, l'audio viene
consegnato come messaggio vocale anziché come allegato file. Feishu e
WhatsApp possono transcodificare l'output TTS non Opus su questo percorso quando `ffmpeg` è
disponibile.

WhatsApp invia l'audio tramite Baileys come nota vocale PTT (`audio` con
`ptt: true`) e invia il testo visibile **separatamente** dall'audio PTT perché
i client non visualizzano in modo coerente le didascalie sulle note vocali.

Lo strumento accetta i campi facoltativi `channel` e `timeoutMs`; `timeoutMs` è un
timeout della richiesta al provider per chiamata, in millisecondi.

## RPC Gateway

| Metodo            | Scopo                                      |
| ----------------- | ------------------------------------------ |
| `tts.status`      | Leggi lo stato TTS corrente e l'ultimo tentativo. |
| `tts.enable`      | Imposta la preferenza automatica locale su `always`. |
| `tts.disable`     | Imposta la preferenza automatica locale su `off`. |
| `tts.convert`     | Testo una tantum → audio.                  |
| `tts.setProvider` | Imposta la preferenza locale del provider. |
| `tts.setPersona`  | Imposta la preferenza locale della persona. |
| `tts.providers`   | Elenca i provider configurati e lo stato.  |

## Link ai servizi

- [Guida text-to-speech OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [Riferimento API Audio OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Provider Azure Speech](/it/providers/azure-speech)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Autenticazione ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/it/providers/gradium)
- [API TTS Inworld](https://docs.inworld.ai/tts/tts)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [API HTTP TTS Volcengine](/it/providers/volcengine#text-to-speech)
- [Sintesi vocale Xiaomi MiMo](/it/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formati di output Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [Text to speech xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Correlati

- [Panoramica media](/it/tools/media-overview)
- [Generazione musicale](/it/tools/music-generation)
- [Generazione video](/it/tools/video-generation)
- [Comandi slash](/it/tools/slash-commands)
- [Plugin chiamata vocale](/it/plugins/voice-call)
