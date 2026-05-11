---
read_when:
    - Abilitare la sintesi vocale per le risposte
    - Configurazione di un fornitore TTS, di una catena di riserva o di una persona
    - Uso di comandi o direttive /tts
sidebarTitle: Text to speech (TTS)
summary: Sintesi vocale per le risposte in uscita — provider, persona, comandi slash e output per canale
title: Sintesi vocale
x-i18n:
    generated_at: "2026-05-11T20:40:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: a9beda419aa5171c7907a238d008bcab7e67e63900a7cadbe289e58c5585a564
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw può convertire le risposte in uscita in audio tramite **14 provider vocali**
e inviare messaggi vocali nativi su Feishu, Matrix, Telegram e WhatsApp,
allegati audio ovunque altrove, e stream PCM/Ulaw per telefonia e Talk.

TTS è la metà di output vocale della modalità `stt-tts` di Talk. Le sessioni Talk
`realtime` native del provider sintetizzano la voce all'interno del provider realtime
invece di chiamare questo percorso TTS, mentre le sessioni `transcription` non sintetizzano
una risposta vocale dell'assistente.

## Avvio rapido

<Steps>
  <Step title="Pick a provider">
    OpenAI ed ElevenLabs sono le opzioni hosted più affidabili. Microsoft e
    Local CLI funzionano senza una chiave API. Consulta la [matrice dei provider](#supported-providers)
    per l'elenco completo.
  </Step>
  <Step title="Set the API key">
    Esporta la variabile d'ambiente per il tuo provider (ad esempio `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft e Local CLI non richiedono una chiave.
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
    `/tts status` mostra lo stato attuale. `/tts audio Hello from OpenClaw`
    invia una risposta audio una tantum.
  </Step>
</Steps>

<Note>
Auto-TTS è **disattivato** per impostazione predefinita. Quando `messages.tts.provider` non è impostato,
OpenClaw sceglie il primo provider configurato nell'ordine di selezione automatica del registry.
Lo strumento agente `tts` integrato richiede un intento esplicito: la chat ordinaria resta
testuale a meno che l'utente chieda l'audio, usi `/tts` o abiliti la voce
Auto-TTS/direttiva.
</Note>

## Provider supportati

| Provider          | Autenticazione                                                                                                   | Note                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (anche `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)         | Output nativo per note vocali Ogg/Opus e telefonia.                                         |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | TTS compatibile con OpenAI. Predefinito su `hexgrad/Kokoro-82M`.                            |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` o `XI_API_KEY`                                                                              | Clonazione vocale, multilingue, deterministico tramite `seed`; in streaming per la riproduzione vocale Discord. |
| **Google Gemini** | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                                                                              | TTS batch dell'API Gemini; sensibile alla persona tramite `promptTemplate: "audio-profile-v1"`. |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | Output per note vocali e telefonia.                                                         |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | API TTS in streaming. Nota vocale Opus nativa e telefonia PCM.                              |
| **Local CLI**     | nessuna                                                                                                          | Esegue un comando TTS locale configurato.                                                    |
| **Microsoft**     | nessuna                                                                                                          | TTS neurale pubblico di Edge tramite `node-edge-tts`. Best-effort, nessuno SLA.             |
| **MiniMax**       | `MINIMAX_API_KEY` (o Token Plan: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)       | API T2A v2. Predefinita su `speech-2.8-hd`.                                                 |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | Usato anche per il riepilogo automatico; supporta le `instructions` per la persona.         |
| **OpenRouter**    | `OPENROUTER_API_KEY` (può riutilizzare `models.providers.openrouter.apiKey`)                                     | Modello predefinito `hexgrad/kokoro-82m`.                                                   |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` o `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/token legacy: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | API HTTP BytePlus Seed Speech.                                                              |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | Provider condiviso per immagini, video e voce.                                              |
| **xAI**           | `XAI_API_KEY`                                                                                                    | TTS batch xAI. La nota vocale Opus nativa **non** è supportata.                             |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | TTS MiMo tramite completamenti chat Xiaomi.                                                 |

Se sono configurati più provider, quello selezionato viene usato per primo e gli
altri sono opzioni di fallback. Il riepilogo automatico usa `summaryModel` (o
`agents.defaults.model.primary`), quindi anche quel provider deve essere autenticato
se mantieni abilitati i riepiloghi.

<Warning>
Il provider **Microsoft** incluso usa il servizio TTS neurale online di Microsoft Edge
tramite `node-edge-tts`. È un servizio web pubblico senza SLA o quota
pubblicati: trattalo come best-effort. L'id provider legacy `edge` viene
normalizzato in `microsoft` e `openclaw doctor --fix` riscrive la configurazione
persistita; le nuove configurazioni devono sempre usare `microsoft`.
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

Usa `agents.list[].tts` quando un agente deve parlare con un provider,
una voce, un modello, una persona o una modalità Auto-TTS diversi. Il blocco dell'agente viene
unito ricorsivamente sopra `messages.tts`, quindi le credenziali del provider possono restare nella configurazione globale del provider:

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

Per fissare una persona per agente, imposta `agents.list[].tts.persona` accanto alla
configurazione del provider — sovrascrive `messages.tts.persona` globale solo per quell'agente.

Ordine di precedenza per le risposte automatiche, `/tts audio`, `/tts status` e lo
strumento agente `tts`:

1. `messages.tts`
2. `agents.list[].tts` attivo
3. override del canale, quando il canale supporta `channels.<channel>.tts`
4. override dell'account, quando il canale passa `channels.<channel>.accounts.<id>.tts`
5. preferenze locali `/tts` per questo host
6. direttive inline `[[tts:...]]` quando gli [override guidati dal modello](#model-driven-directives) sono abilitati

Gli override di canale e account usano la stessa forma di `messages.tts` ed eseguono
un deep merge sopra i livelli precedenti, così le credenziali condivise del provider possono restare in
`messages.tts` mentre un canale o account bot cambia solo voce, modello, persona
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

## Persone

Una **persona** è un'identità vocale stabile che può essere applicata in modo deterministico
tra provider. Può preferire un provider, definire l'intento del prompt indipendente dal provider
e contenere associazioni specifiche del provider per voci, modelli, template di prompt,
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

### Persona completa (prompt indipendente dal provider)

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

La selezione del provider procede dando precedenza alle impostazioni esplicite:

1. Override diretti (CLI, Gateway, Talk, direttive TTS consentite).
2. Preferenza locale `/tts provider <id>`.
3. `provider` della persona attiva.
4. `messages.tts.provider`.
5. Selezione automatica dal registro.

Per ogni tentativo del provider, OpenClaw unisce le configurazioni in quest'ordine:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Override attendibili della richiesta
4. Override consentiti delle direttive TTS emesse dal modello

### Come i provider usano i prompt delle persone

I campi prompt della persona (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) sono **indipendenti dal provider**. Ogni provider decide come
usarli:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Racchiude i campi prompt della persona in una struttura di prompt Gemini TTS **solo quando**
    la configurazione effettiva del provider Google imposta `promptTemplate: "audio-profile-v1"`
    o `personaPrompt`. I campi precedenti `audioProfile` e `speakerName` vengono
    ancora anteposti come testo di prompt specifico per Google. I tag audio inline come
    `[whispers]` o `[laughs]` all'interno di un blocco `[[tts:text]]` vengono preservati
    nella trascrizione Gemini; OpenClaw non genera questi tag.
  </Accordion>
  <Accordion title="OpenAI">
    Mappa i campi prompt della persona al campo `instructions` della richiesta **solo quando**
    non sono configurate `instructions` OpenAI esplicite. Le `instructions`
    esplicite hanno sempre la precedenza.
  </Accordion>
  <Accordion title="Altri provider">
    Usano solo le associazioni persona specifiche del provider sotto
    `personas.<id>.providers.<provider>`. I campi prompt della persona vengono ignorati
    a meno che il provider implementi una propria mappatura dei prompt persona.
  </Accordion>
</AccordionGroup>

### Criterio di fallback

`fallbackPolicy` controlla il comportamento quando una persona **non ha alcuna associazione** per il
provider tentato:

| Criterio            | Comportamento                                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **Predefinito.** I campi prompt indipendenti dal provider restano disponibili; il provider può usarli o ignorarli.                              |
| `provider-defaults` | La persona viene omessa dalla preparazione del prompt per quel tentativo; il provider usa i propri valori predefiniti neutrali mentre il fallback ad altri provider continua. |
| `fail`              | Salta quel tentativo del provider con `reasonCode: "not_configured"` e `personaBinding: "missing"`. I provider di fallback vengono comunque provati. |

L'intera richiesta TTS fallisce solo quando **ogni** provider tentato viene saltato
o fallisce.

La selezione del provider della sessione Talk è limitata alla sessione. Un client Talk dovrebbe scegliere
id provider, id modello, id voce e locale da `talk.catalog` e passarli
attraverso la sessione Talk o la richiesta di handoff. L'apertura di una sessione vocale non dovrebbe
modificare `messages.tts` o i valori predefiniti globali del provider Talk.

## Direttive guidate dal modello

Per impostazione predefinita, l'assistente **può** emettere direttive `[[tts:...]]` per sovrascrivere
voce, modello o velocità per una singola risposta, più un blocco facoltativo
`[[tts:text]]...[[/tts:text]]` per indicazioni espressive che dovrebbero apparire solo
nell'audio:

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Quando `messages.tts.auto` è `"tagged"`, le **direttive sono obbligatorie** per attivare
l'audio. La consegna dei blocchi in streaming rimuove le direttive dal testo visibile prima che il
canale le veda, anche quando sono divise tra blocchi adiacenti.

`provider=...` viene ignorato a meno che `modelOverrides.allowProvider: true`. Quando una
risposta dichiara `provider=...`, le altre chiavi in quella direttiva vengono analizzate
solo da quel provider; le chiavi non supportate vengono rimosse e segnalate come avvisi di
direttiva TTS.

**Chiavi di direttiva disponibili:**

- `provider` (id provider registrato; richiede `allowProvider: true`)
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume MiniMax, 0–10)
- `pitch` (pitch intero MiniMax, da −12 a 12; i valori frazionari vengono troncati)
- `emotion` (tag emozione Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Disabilita completamente gli override del modello:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Consenti il cambio di provider mantenendo configurabili le altre manopole:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Comandi slash

Singolo comando `/tts`. Su Discord, OpenClaw registra anche `/voice` perché
`/tts` è un comando integrato di Discord — il testo `/tts ...` funziona comunque.

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
I comandi richiedono un mittente autorizzato (si applicano le regole allowlist/proprietario) e che
`commands.text` oppure la registrazione nativa dei comandi sia abilitata.
</Note>

Note sul comportamento:

- `/tts on` scrive la preferenza TTS locale su `always`; `/tts off` la scrive su `off`.
- `/tts chat on|off|default` scrive un override auto-TTS limitato alla sessione per la chat corrente.
- `/tts persona <id>` scrive la preferenza locale della persona; `/tts persona off` la cancella.
- `/tts latest` legge l'ultima risposta dell'assistente dalla trascrizione della sessione corrente e la invia come audio una volta. Memorizza solo un hash di quella risposta nella voce della sessione per sopprimere invii vocali duplicati.
- `/tts audio` genera una risposta audio una tantum (non attiva TTS).
- `limit` e `summary` sono memorizzati nelle **preferenze locali**, non nella configurazione principale.
- `/tts status` include diagnostica di fallback per l'ultimo tentativo — `Fallback: <primary> -> <used>`, `Attempts: ...` e dettagli per tentativo (`provider:outcome(reasonCode) latency`).
- `/status` mostra la modalità TTS attiva più provider, modello, voce e metadati dell'endpoint personalizzato sanificati quando TTS è abilitato.

## Preferenze per utente

I comandi slash scrivono override locali in `prefsPath`. Il valore predefinito è
`~/.openclaw/settings/tts.json`; sovrascrivilo con la variabile di ambiente `OPENCLAW_TTS_PREFS`
o `messages.tts.prefsPath`.

| Campo memorizzato | Effetto                                      |
| ------------ | -------------------------------------------- |
| `auto`       | Override auto-TTS locale (`always`, `off`, …) |
| `provider`   | Override locale del provider primario        |
| `persona`    | Override locale della persona                |
| `maxLength`  | Soglia di riepilogo (`1500` caratteri predefinita) |
| `summarize`  | Attivazione riepilogo (`true` predefinito)   |

Questi sovrascrivono la configurazione effettiva da `messages.tts` più il blocco
`agents.list[].tts` attivo per quell'host.

## Formati di output (fissi)

La consegna vocale TTS è guidata dalle capacità del canale. I Plugin di canale dichiarano
se il TTS in stile vocale dovrebbe chiedere ai provider un target nativo `voice-note` oppure
mantenere la normale sintesi `audio-file` e contrassegnare solo l'output compatibile per la consegna
vocale.

- **Canali compatibili con note vocali**: le risposte con note vocali preferiscono Opus (`opus_48000_64` da ElevenLabs, `opus` da OpenAI).
  - 48kHz / 64kbps è un buon compromesso per i messaggi vocali.
- **Feishu / WhatsApp**: quando una risposta con nota vocale viene prodotta come MP3/WebM/WAV/M4A
  o un altro file probabilmente audio, il plugin del canale la transcodifica in Ogg/Opus
  a 48kHz con `ffmpeg` prima di inviare il messaggio vocale nativo. WhatsApp invia
  il risultato tramite il payload Baileys `audio` con `ptt: true` e
  `audio/ogg; codecs=opus`. Se la conversione non riesce, Feishu riceve il file originale
  come allegato; l'invio WhatsApp non riesce invece di pubblicare un payload PTT
  incompatibile.
- **Altri canali**: MP3 (`mp3_44100_128` da ElevenLabs, `mp3` da OpenAI).
  - 44,1kHz / 128kbps è il bilanciamento predefinito per la chiarezza del parlato.
- **MiniMax**: MP3 (modello `speech-2.8-hd`, frequenza di campionamento 32kHz) per gli allegati audio normali. Per le destinazioni di note vocali dichiarate dal canale, OpenClaw transcodifica l'MP3 MiniMax in Opus a 48kHz con `ffmpeg` prima della consegna quando il canale dichiara la transcodifica.
- **Xiaomi MiMo**: MP3 per impostazione predefinita, oppure WAV quando configurato. Per le destinazioni di note vocali dichiarate dal canale, OpenClaw transcodifica l'output Xiaomi in Opus a 48kHz con `ffmpeg` prima della consegna quando il canale dichiara la transcodifica.
- **CLI locale**: usa il `outputFormat` configurato. Le destinazioni di note vocali vengono
  convertite in Ogg/Opus e l'output per telefonia viene convertito in PCM mono
  grezzo a 16 kHz con `ffmpeg`.
- **Google Gemini**: Gemini API TTS restituisce PCM grezzo a 24kHz. OpenClaw lo incapsula come WAV per gli allegati audio, lo transcodifica in Opus a 48kHz per le destinazioni di note vocali e restituisce direttamente PCM per Talk/telefonia.
- **Gradium**: WAV per gli allegati audio, Opus per le destinazioni di note vocali e `ulaw_8000` a 8 kHz per la telefonia.
- **Inworld**: MP3 per gli allegati audio normali, `OGG_OPUS` nativo per le destinazioni di note vocali e `PCM` grezzo a 22050 Hz per Talk/telefonia.
- **xAI**: MP3 per impostazione predefinita; `responseFormat` può essere `mp3`, `wav`, `pcm`, `mulaw` o `alaw`. OpenClaw usa l'endpoint TTS REST batch di xAI e restituisce un allegato audio completo; il WebSocket TTS in streaming di xAI non viene usato da questo percorso provider. Il formato nativo Opus per note vocali non è supportato da questo percorso.
- **Microsoft**: usa `microsoft.outputFormat` (predefinito `audio-24khz-48kbitrate-mono-mp3`).
  - Il trasporto incluso accetta un `outputFormat`, ma non tutti i formati sono disponibili dal servizio.
  - I valori del formato di output seguono i formati di output Microsoft Speech (inclusi Ogg/WebM Opus).
  - Telegram `sendVoice` accetta OGG/MP3/M4A; usa OpenAI/ElevenLabs se ti servono
    messaggi vocali Opus garantiti.
  - Se il formato di output Microsoft configurato non riesce, OpenClaw riprova con MP3.

I formati di output OpenAI/ElevenLabs sono fissi per canale (vedi sopra).

## Comportamento Auto-TTS

Quando `messages.tts.auto` è abilitato, OpenClaw:

- Salta il TTS se la risposta contiene già media o una direttiva `MEDIA:`.
- Salta le risposte molto brevi (meno di 10 caratteri).
- Riassume le risposte lunghe quando i riepiloghi sono abilitati, usando
  `summaryModel` (o `agents.defaults.model.primary`).
- Allega l'audio generato alla risposta.
- In `mode: "final"`, invia comunque TTS solo audio per le risposte finali in streaming
  dopo il completamento dello stream di testo; il media generato passa attraverso la stessa
  normalizzazione dei media del canale degli allegati di risposta normali.

Se la risposta supera `maxLength` e il riepilogo è disattivato (o non c'è una chiave API per il
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
  | Feishu / Matrix / Telegram / WhatsApp | Le risposte con nota vocale preferiscono **Opus** (`opus_48000_64` da ElevenLabs, `opus` da OpenAI). 48 kHz / 64 kbps bilancia chiarezza e dimensione. |
  | Altri canali                          | **MP3** (`mp3_44100_128` da ElevenLabs, `mp3` da OpenAI). 44,1 kHz / 128 kbps predefinito per il parlato.                                 |
  | Talk / telefonia                      | **PCM** nativo del provider (Inworld 22050 Hz, Google 24 kHz), oppure `ulaw_8000` da Gradium per la telefonia.                                 |

  Note per provider:

  - **Transcodifica Feishu / WhatsApp:** quando una risposta con nota vocale arriva come MP3/WebM/WAV/M4A, il plugin del canale transcodifica in Ogg/Opus a 48 kHz con `ffmpeg`. WhatsApp invia tramite Baileys con `ptt: true` e `audio/ogg; codecs=opus`. Se la conversione non riesce: Feishu ripiega sull'allegare il file originale; l'invio WhatsApp fallisce invece di pubblicare un payload PTT incompatibile.
  - **MiniMax / Xiaomi MiMo:** MP3 predefinito (32 kHz per MiniMax `speech-2.8-hd`); transcodificato in Opus a 48 kHz per le destinazioni con nota vocale tramite `ffmpeg`.
  - **CLI locale:** usa `outputFormat` configurato. Le destinazioni con nota vocale vengono convertite in Ogg/Opus e l'output di telefonia in PCM mono grezzo a 16 kHz.
  - **Google Gemini:** restituisce PCM grezzo a 24 kHz. OpenClaw lo incapsula come WAV per gli allegati, lo transcodifica in Opus a 48 kHz per le destinazioni con nota vocale, restituisce direttamente PCM per Talk/telefonia.
  - **Inworld:** allegati MP3, nota vocale nativa `OGG_OPUS`, `PCM` grezzo a 22050 Hz per Talk/telefonia.
  - **xAI:** MP3 per impostazione predefinita; `responseFormat` può essere `mp3|wav|pcm|mulaw|alaw`. Usa l'endpoint REST batch di xAI: il TTS WebSocket in streaming **non** viene usato. Il formato nativo Opus per note vocali **non** è supportato.
  - **Microsoft:** usa `microsoft.outputFormat` (predefinito `audio-24khz-48kbitrate-mono-mp3`). Telegram `sendVoice` accetta OGG/MP3/M4A; usa OpenAI/ElevenLabs se ti servono messaggi vocali Opus garantiti. Se il formato Microsoft configurato fallisce, OpenClaw riprova con MP3.

  I formati di output di OpenAI e ElevenLabs sono fissi per canale come elencato sopra.

  ## Riferimento dei campi

  <AccordionGroup>
  <Accordion title="messages.tts.* di primo livello">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Modalità Auto-TTS. `inbound` invia audio solo dopo un messaggio vocale in ingresso; `tagged` invia audio solo quando la risposta include direttive `[[tts:...]]` o un blocco `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Interruttore legacy. `openclaw doctor --fix` migra questo valore a `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` include le risposte di strumenti/blocchi oltre alle risposte finali.
    </ParamField>
    <ParamField path="provider" type="string">
      ID del provider vocale. Quando non è impostato, OpenClaw usa il primo provider configurato nell'ordine di selezione automatica del registro. Il valore legacy `provider: "edge"` viene riscritto in `"microsoft"` da `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      ID della persona attiva da `personas`. Normalizzato in minuscolo.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Identità parlata stabile. Campi: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Vedi [Personas](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Modello economico per il riepilogo automatico; valore predefinito `agents.defaults.model.primary`. Accetta `provider/model` o un alias di modello configurato.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Consente al modello di emettere direttive TTS. `enabled` è predefinito a `true`; `allowProvider` è predefinito a `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Impostazioni di proprietà del provider indicizzate per ID del provider vocale. I blocchi diretti legacy (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) vengono riscritti da `openclaw doctor --fix`; esegui il commit solo di `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      Limite rigido per i caratteri di input TTS. `/tts audio` fallisce se viene superato.
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      Timeout della richiesta in millisecondi.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Sostituisce il percorso JSON delle preferenze locali (provider/limite/riepilogo). Predefinito `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` o `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Regione Azure Speech (es. `eastus`). Env: `AZURE_SPEECH_REGION` o `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Override opzionale dell'endpoint Azure Speech (alias `baseUrl`).</ParamField>
    <ParamField path="voice" type="string">ShortName della voce Azure. Predefinito `en-US-JennyNeural`.</ParamField>
    <ParamField path="lang" type="string">Codice lingua SSML. Predefinito `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">`X-Microsoft-OutputFormat` di Azure per audio standard. Predefinito `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">`X-Microsoft-OutputFormat` di Azure per output con nota vocale. Predefinito `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Ripiega su `ELEVENLABS_API_KEY` o `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">ID modello (es. `eleven_multilingual_v2`, `eleven_v3`).</ParamField>
    <ParamField path="voiceId" type="string">ID voce ElevenLabs.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (ciascuno `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = normale).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Modalità di normalizzazione del testo.</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 a 2 lettere (es. `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Intero `0..4294967295` per determinismo best-effort.</ParamField>
    <ParamField path="baseUrl" type="string">Sostituisce l'URL base dell'API ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Ripiega su `GEMINI_API_KEY` / `GOOGLE_API_KEY`. Se omesso, TTS può riutilizzare `models.providers.google.apiKey` prima del fallback env.</ParamField>
    <ParamField path="model" type="string">Modello TTS Gemini. Predefinito `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="voiceName" type="string">Nome voce predefinita Gemini. Predefinito `Kore`. Alias: `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Prompt di stile in linguaggio naturale anteposto al testo parlato.</ParamField>
    <ParamField path="speakerName" type="string">Etichetta opzionale del parlante anteposta al testo parlato quando il prompt usa un parlante nominato.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Imposta su `audio-profile-v1` per racchiudere i campi del prompt della persona attiva in una struttura deterministica di prompt TTS Gemini.</ParamField>
    <ParamField path="personaPrompt" type="string">Testo prompt della persona aggiuntivo specifico per Google, aggiunto alle note del direttore del template.</ParamField>
    <ParamField path="baseUrl" type="string">È accettato solo `https://generativelanguage.googleapis.com`.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Ambiente: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Predefinito `https://api.gradium.ai`.</ParamField>
    <ParamField path="voiceId" type="string">Predefinito Emma (`YTpq7expH9539ERJ`).</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Principale di Inworld

    <ParamField path="apiKey" type="string">Ambiente: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Predefinito `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Predefinito `inworld-tts-1.5-max`. Anche: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="voiceId" type="string">Predefinito `Sarah`.</ParamField>
    <ParamField path="temperature" type="number">Temperatura di campionamento `0..2`.</ParamField>

  </Accordion>

  <Accordion title="Local CLI (tts-local-cli)">
    <ParamField path="command" type="string">Eseguibile locale o stringa di comando per CLI TTS.</ParamField>
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
    <ParamField path="saveSubtitles" type="boolean">Scrive i sottotitoli JSON accanto al file audio.</ParamField>
    <ParamField path="proxy" type="string">URL proxy per le richieste di sintesi vocale Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Override del timeout della richiesta (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Alias legacy. Esegui `openclaw doctor --fix` per riscrivere la configurazione persistita in `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Ripiega su `MINIMAX_API_KEY`. Autenticazione Token Plan tramite `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` o `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Predefinito `https://api.minimax.io`. Ambiente: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Predefinito `speech-2.8-hd`. Ambiente: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="voiceId" type="string">Predefinito `English_expressive_narrator`. Ambiente: `MINIMAX_TTS_VOICE_ID`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Predefinito `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Predefinito `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Intero `-12..12`. Predefinito `0`. I valori frazionari vengono troncati prima della richiesta.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Ripiega su `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">ID del modello TTS OpenAI (ad es. `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="voice" type="string">Nome della voce (ad es. `alloy`, `cedar`).</ParamField>
    <ParamField path="instructions" type="string">Campo `instructions` esplicito di OpenAI. Quando impostato, i campi del prompt della persona **non** vengono mappati automaticamente.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">Campi JSON aggiuntivi uniti nei corpi delle richieste `/audio/speech` dopo i campi TTS OpenAI generati. Usalo per endpoint compatibili con OpenAI, come Kokoro, che richiedono chiavi specifiche del provider come `lang`; le chiavi di prototipo non sicure vengono ignorate.</ParamField>
    <ParamField path="baseUrl" type="string">
      Sostituisce l'endpoint TTS OpenAI. Ordine di risoluzione: configurazione → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. I valori non predefiniti vengono trattati come endpoint TTS compatibili con OpenAI, quindi sono accettati nomi di modello e di voce personalizzati.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Ambiente: `OPENROUTER_API_KEY`. Può riutilizzare `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">Predefinito `https://openrouter.ai/api/v1`. Il valore legacy `https://openrouter.ai/v1` viene normalizzato.</ParamField>
    <ParamField path="model" type="string">Predefinito `hexgrad/kokoro-82m`. Alias: `modelId`.</ParamField>
    <ParamField path="voice" type="string">Predefinito `af_alloy`. Alias: `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Predefinito `mp3`.</ParamField>
    <ParamField path="speed" type="number">Override della velocità nativa del provider.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Ambiente: `VOLCENGINE_TTS_API_KEY` o `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Predefinito `seed-tts-1.0`. Ambiente: `VOLCENGINE_TTS_RESOURCE_ID`. Usa `seed-tts-2.0` quando il tuo progetto dispone dell'abilitazione a TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">Intestazione della chiave app. Predefinito `aGjiRDfUWi`. Ambiente: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Sostituisce l'endpoint HTTP TTS Seed Speech. Ambiente: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="voice" type="string">Tipo di voce. Predefinito `en_female_anna_mars_bigtts`. Ambiente: `VOLCENGINE_TTS_VOICE`.</ParamField>
    <ParamField path="speedRatio" type="number">Rapporto di velocità nativo del provider.</ParamField>
    <ParamField path="emotion" type="string">Tag emozionale nativo del provider.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Campi legacy della Console Volcengine Speech. Ambiente: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (predefinito `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Ambiente: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Predefinito `https://api.x.ai/v1`. Ambiente: `XAI_BASE_URL`.</ParamField>
    <ParamField path="voiceId" type="string">Predefinito `eve`. Voci live: `ara`, `eve`, `leo`, `rex`, `sal`, `una`.</ParamField>
    <ParamField path="language" type="string">Codice lingua BCP-47 o `auto`. Predefinito `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Predefinito `mp3`.</ParamField>
    <ParamField path="speed" type="number">Override della velocità nativa del provider.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Ambiente: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Predefinito `https://api.xiaomimimo.com/v1`. Ambiente: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Predefinito `mimo-v2.5-tts`. Ambiente: `XIAOMI_TTS_MODEL`. Supporta anche `mimo-v2-tts`.</ParamField>
    <ParamField path="voice" type="string">Predefinito `mimo_default`. Ambiente: `XIAOMI_TTS_VOICE`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Predefinito `mp3`. Ambiente: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Istruzione di stile facoltativa in linguaggio naturale inviata come messaggio utente; non viene pronunciata.</ParamField>
  </Accordion>
</AccordionGroup>

## Strumento agente

Lo strumento `tts` converte il testo in parlato e restituisce un allegato audio per
la consegna della risposta. Su Feishu, Matrix, Telegram e WhatsApp, l'audio viene
consegnato come messaggio vocale invece che come allegato file. Feishu e
WhatsApp possono transcodificare l'output TTS non Opus in questo percorso quando `ffmpeg` è
disponibile.

WhatsApp invia l'audio tramite Baileys come nota vocale PTT (`audio` con
`ptt: true`) e invia il testo visibile **separatamente** dall'audio PTT perché
i client non renderizzano in modo coerente le didascalie sulle note vocali.

Lo strumento accetta i campi facoltativi `channel` e `timeoutMs`; `timeoutMs` è un
timeout della richiesta al provider per singola chiamata, in millisecondi.

## RPC Gateway

| Metodo            | Scopo                                      |
| ----------------- | ------------------------------------------ |
| `tts.status`      | Legge lo stato TTS corrente e l'ultimo tentativo. |
| `tts.enable`      | Imposta la preferenza automatica locale su `always`. |
| `tts.disable`     | Imposta la preferenza automatica locale su `off`. |
| `tts.convert`     | Conversione una tantum da testo → audio.   |
| `tts.setProvider` | Imposta la preferenza locale del provider. |
| `tts.setPersona`  | Imposta la preferenza locale della persona. |
| `tts.providers`   | Elenca provider configurati e stato.       |

## Link ai servizi

- [Guida OpenAI alla sintesi vocale](https://platform.openai.com/docs/guides/text-to-speech)
- [Riferimento API OpenAI Audio](https://platform.openai.com/docs/api-reference/audio)
- [Sintesi vocale REST Azure Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Provider Azure Speech](/it/providers/azure-speech)
- [Sintesi vocale ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Autenticazione ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/it/providers/gradium)
- [API TTS Inworld](https://docs.inworld.ai/tts/tts)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [API HTTP TTS Volcengine](/it/providers/volcengine#text-to-speech)
- [Sintesi vocale Xiaomi MiMo](/it/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formati di output Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [Sintesi vocale xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Correlati

- [Panoramica media](/it/tools/media-overview)
- [Generazione musicale](/it/tools/music-generation)
- [Generazione video](/it/tools/video-generation)
- [Comandi slash](/it/tools/slash-commands)
- [Plugin chiamate vocali](/it/plugins/voice-call)
