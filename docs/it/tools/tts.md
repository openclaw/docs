---
read_when:
    - Abilitare la sintesi vocale per le risposte
    - Configurazione di un provider TTS, di una catena di fallback o di una persona
    - Uso di comandi o direttive /tts
sidebarTitle: Text to speech (TTS)
summary: Sintesi vocale per le risposte in uscita — provider, personas, comandi slash e output per canale
title: Sintesi vocale
x-i18n:
    generated_at: "2026-06-27T18:25:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 94835daf766286e937c57828818a4ee0a20e6d5894b7d51d6f98fc7ebdaffe35
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw può convertire le risposte in uscita in audio tramite **14 fornitori di sintesi vocale**
e recapitare messaggi vocali nativi su Feishu, Matrix, Telegram e WhatsApp,
allegati audio ovunque altrove, e flussi PCM/Ulaw per telefonia e Talk.

TTS è la metà di output vocale della modalità `stt-tts` di Talk. Le sessioni Talk
`realtime` native del fornitore sintetizzano la voce all'interno del fornitore in tempo reale
invece di chiamare questo percorso TTS, mentre le sessioni `transcription` non sintetizzano
una risposta vocale dell'assistente.

## Avvio rapido

<Steps>
  <Step title="Pick a provider">
    OpenAI ed ElevenLabs sono le opzioni ospitate più affidabili. Microsoft e
    CLI locale funzionano senza chiave API. Vedi la [matrice dei fornitori](#supported-providers)
    per l'elenco completo.
  </Step>
  <Step title="Set the API key">
    Esporta la variabile d'ambiente per il tuo fornitore (ad esempio `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft e CLI locale non richiedono alcuna chiave.
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
OpenClaw sceglie il primo fornitore configurato nell'ordine di selezione automatica del registro.
Lo strumento agente `tts` integrato è solo per intenzione esplicita: la chat ordinaria resta
testuale a meno che l'utente non chieda l'audio, usi `/tts`, o abiliti la voce
Auto-TTS/direttiva.
</Note>

## Fornitori supportati

| Fornitore         | Autenticazione                                                                                                  | Note                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (anche `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)         | Output nativo di nota vocale Ogg/Opus e telefonia.                                          |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | TTS compatibile con OpenAI. Predefinito: `hexgrad/Kokoro-82M`.                              |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` o `XI_API_KEY`                                                                              | Clonazione vocale, multilingue, deterministico tramite `seed`; in streaming per la riproduzione vocale Discord. |
| **Google Gemini** | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                                                                              | TTS batch API Gemini; consapevole della persona tramite `promptTemplate: "audio-profile-v1"`. |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | Output di nota vocale e telefonia.                                                          |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | API TTS in streaming. Nota vocale Opus nativa e telefonia PCM.                              |
| **Local CLI**     | nessuna                                                                                                          | Esegue un comando TTS locale configurato.                                                    |
| **Microsoft**     | nessuna                                                                                                          | TTS neurale pubblico Edge tramite `node-edge-tts`. Miglior tentativo, nessuno SLA.          |
| **MiniMax**       | `MINIMAX_API_KEY` (o piano Token: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)      | API T2A v2. Predefinito: `speech-2.8-hd`.                                                    |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | Usato anche per il riepilogo automatico; supporta `instructions` per la persona.             |
| **OpenRouter**    | `OPENROUTER_API_KEY` (può riutilizzare `models.providers.openrouter.apiKey`)                                     | Modello predefinito `hexgrad/kokoro-82m`.                                                    |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` o `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/token legacy: `VOLCENGINE_TTS_APPID`/`_TOKEN`) | API HTTP BytePlus Seed Speech.                                                              |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | Fornitore condiviso di immagini, video e sintesi vocale.                                    |
| **xAI**           | `XAI_API_KEY`                                                                                                    | TTS batch xAI. La nota vocale Opus nativa **non** è supportata.                             |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | MiMo TTS tramite completamenti chat Xiaomi.                                                  |

Se sono configurati più fornitori, quello selezionato viene usato per primo e gli
altri sono opzioni di fallback. Il riepilogo automatico usa `summaryModel` (o
`agents.defaults.model.primary`), quindi anche quel fornitore deve essere autenticato
se mantieni abilitati i riepiloghi.

<Warning>
Il fornitore **Microsoft** in bundle usa il servizio TTS neurale online di Microsoft Edge
tramite `node-edge-tts`. È un servizio web pubblico senza uno
SLA o una quota pubblicati: trattalo come miglior tentativo. L'id fornitore legacy `edge` viene
normalizzato in `microsoft` e `openclaw doctor --fix` riscrive la configurazione
persistente; le nuove configurazioni dovrebbero sempre usare `microsoft`.
</Warning>

## Configurazione

La configurazione TTS si trova sotto `messages.tts` in `~/.openclaw/openclaw.json`. Scegli un
preset e adatta il blocco del fornitore:

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
          speakerVoice: "en-US-JennyNeural",
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
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
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
          speakerVoice: "Kore",
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
          speakerVoiceId: "YTpq7expH9539ERJ",
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
          speakerVoiceId: "Sarah",
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
          speakerVoice: "en-US-MichelleNeural",
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
          speakerVoiceId: "English_expressive_narrator",
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
          speakerVoice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
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
          speakerVoice: "af_alloy",
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
          speakerVoice: "en_female_anna_mars_bigtts",
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
          speakerVoiceId: "eve",
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
          speakerVoice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

Per Xiaomi `mimo-v2.5-tts-voicedesign`, ometti `speakerVoice` e imposta `style` sul
prompt di progettazione vocale. OpenClaw invia quel prompt come messaggio `user` TTS
e non invia `audio.voice` per il modello voicedesign.

### Sostituzioni vocali per agente

Usa `agents.list[].tts` quando un agente deve parlare con un provider,
voce, modello, persona o modalità TTS automatica diversi. Il blocco dell'agente esegue un deep merge sopra
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
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

Per fissare una persona per agente, imposta `agents.list[].tts.persona` insieme alla configurazione del provider:
sovrascrive `messages.tts.persona` globale solo per quell'agente.

Ordine di precedenza per risposte automatiche, `/tts audio`, `/tts status` e lo
strumento agente `tts`:

1. `messages.tts`
2. `agents.list[].tts` attivo
3. override del canale, quando il canale supporta `channels.<channel>.tts`
4. override dell'account, quando il canale passa `channels.<channel>.accounts.<id>.tts`
5. preferenze locali `/tts` per questo host
6. direttive inline `[[tts:...]]` quando gli [override del modello](#model-driven-directives) sono abilitati

Gli override di canale e account usano la stessa forma di `messages.tts` ed eseguono
un deep merge sopra i livelli precedenti, quindi le credenziali condivise del provider possono restare in
`messages.tts` mentre un canale o account bot cambia solo voce del parlante, modello, persona
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
              openai: { speakerVoice: "shimmer" },
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
            elevenlabs: {
              speakerVoiceId: "EXAVITQu4vr4xnSDxMaL",
              modelId: "eleven_multilingual_v2",
            },
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
              speakerVoice: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "cedar" },
            elevenlabs: {
              speakerVoiceId: "voice_id",
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

La selezione del provider procede dando priorità agli elementi espliciti:

1. Override diretti (CLI, Gateway, Talk, direttive TTS consentite).
2. preferenza locale `/tts provider <id>`.
3. `provider` della persona attiva.
4. `messages.tts.provider`.
5. Selezione automatica del registro.

Per ogni tentativo di provider, OpenClaw unisce le configurazioni in questo ordine:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Override attendibili della richiesta
4. Override consentiti delle direttive TTS emesse dal modello

### Come i provider usano i prompt della persona

I campi del prompt della persona (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) sono **indipendenti dal provider**. Ogni provider decide come
usarli:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Incapsula i campi del prompt della persona in una struttura di prompt TTS Gemini **solo quando**
    la configurazione effettiva del provider Google imposta `promptTemplate: "audio-profile-v1"`
    o `personaPrompt`. I campi precedenti `audioProfile` e `speakerName` vengono
    ancora anteposti come testo di prompt specifico di Google. I tag audio inline come
    `[whispers]` o `[laughs]` dentro un blocco `[[tts:text]]` vengono preservati
    dentro la trascrizione Gemini; OpenClaw non genera questi tag.
  </Accordion>
  <Accordion title="OpenAI">
    Mappa i campi del prompt della persona al campo `instructions` della richiesta **solo quando**
    non sono configurate `instructions` OpenAI esplicite. Le `instructions` esplicite
    hanno sempre la precedenza.
  </Accordion>
  <Accordion title="Other providers">
    Usano solo le associazioni della persona specifiche del provider sotto
    `personas.<id>.providers.<provider>`. I campi del prompt della persona vengono ignorati
    a meno che il provider non implementi una propria mappatura dei prompt della persona.
  </Accordion>
</AccordionGroup>

### Criterio di fallback

`fallbackPolicy` controlla il comportamento quando una persona non ha **nessuna associazione** per il
provider tentato:

| Criterio            | Comportamento                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **Predefinito.** I campi del prompt indipendenti dal provider restano disponibili; il provider può usarli o ignorarli.                          |
| `provider-defaults` | La persona viene omessa dalla preparazione del prompt per quel tentativo; il provider usa i suoi valori predefiniti neutrali mentre il fallback verso altri provider continua. |
| `fail`              | Salta quel tentativo di provider con `reasonCode: "not_configured"` e `personaBinding: "missing"`. I provider di fallback vengono comunque provati. |

L'intera richiesta TTS fallisce solo quando **ogni** provider tentato viene saltato
o fallisce.

La selezione del provider della sessione Talk ha ambito di sessione. Un client Talk dovrebbe scegliere
ID provider, ID modello, ID voce e impostazioni locali da `talk.catalog` e passarli
attraverso la sessione Talk o la richiesta di handoff. L'apertura di una sessione vocale non dovrebbe
modificare `messages.tts` o i valori predefiniti globali del provider Talk.

## Direttive guidate dal modello

Per impostazione predefinita, l'assistente **può** emettere direttive `[[tts:...]]` per sovrascrivere
voce, modello o velocità per una singola risposta, più un blocco facoltativo
`[[tts:text]]...[[/tts:text]]` per segnali espressivi che devono comparire solo
nell'audio:

```text
Here you go.

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

Quando `messages.tts.auto` è `"tagged"`, le **direttive sono obbligatorie** per attivare
l'audio. La consegna dei blocchi in streaming rimuove le direttive dal testo visibile prima che il
canale le veda, anche quando sono divise tra blocchi adiacenti.

`provider=...` viene ignorato a meno che `modelOverrides.allowProvider: true`. Quando una
risposta dichiara `provider=...`, le altre chiavi in quella direttiva vengono analizzate
solo da quel provider; le chiavi non supportate vengono rimosse e segnalate come avvisi
di direttiva TTS.

**Chiavi di direttiva disponibili:**

- `provider` (ID provider registrato; richiede `allowProvider: true`)
- `speakerVoice` / `speakerVoiceId` (alias legacy: `voice`, `voiceName`, `voice_name`, `google_voice`, `voiceId`)
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume MiniMax, 0–10)
- `pitch` (intonazione intera MiniMax, da −12 a 12; i valori frazionari vengono troncati)
- `emotion` (tag emozione Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Disabilita completamente gli override del modello:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Consenti il cambio di provider mantenendo configurabili le altre impostazioni:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Comandi slash

Comando singolo `/tts`. Su Discord, OpenClaw registra anche `/voice` perché
`/tts` è un comando integrato di Discord: il testo `/tts ...` continua a funzionare.

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
I comandi richiedono un mittente autorizzato (si applicano regole di allowlist/proprietario) e
`commands.text` oppure la registrazione dei comandi nativi deve essere abilitata.
</Note>

Note sul comportamento:

- `/tts on` scrive la preferenza TTS locale su `always`; `/tts off` la scrive su `off`.
- `/tts chat on|off|default` scrive un override TTS automatico con ambito di sessione per la chat corrente.
- `/tts persona <id>` scrive la preferenza locale della persona; `/tts persona off` la cancella.
- `/tts latest` legge l'ultima risposta dell'assistente dalla trascrizione della sessione corrente e la invia una sola volta come audio. Memorizza solo un hash di quella risposta nella voce di sessione per evitare invii vocali duplicati.
- `/tts audio` genera una risposta audio una tantum (non attiva TTS).
- `limit` e `summary` sono memorizzati nelle **preferenze locali**, non nella configurazione principale.
- `/tts status` include diagnostica di fallback per l'ultimo tentativo: `Fallback: <primary> -> <used>`, `Attempts: ...` e dettagli per tentativo (`provider:outcome(reasonCode) latency`).
- `/status` mostra la modalità TTS attiva più provider, modello, voce e metadati sanificati dell'endpoint personalizzato configurati quando TTS è abilitato.

## Preferenze per utente

I comandi slash scrivono override locali in `prefsPath`. Il valore predefinito è
`~/.openclaw/settings/tts.json`; sovrascrivilo con la variabile d'ambiente `OPENCLAW_TTS_PREFS`
o `messages.tts.prefsPath`.

| Campo memorizzato | Effetto                                      |
| ----------------- | ------------------------------------------- |
| `auto`            | Override TTS automatico locale (`always`, `off`, …) |
| `provider`        | Override del provider primario locale       |
| `persona`         | Override locale della persona               |
| `maxLength`       | Soglia di riepilogo (predefinita `1500` caratteri) |
| `summarize`       | Interruttore di riepilogo (predefinito `true`) |

Questi sovrascrivono la configurazione effettiva da `messages.tts` più il blocco
`agents.list[].tts` attivo per quell'host.

## Formati di output (fissi)

La consegna vocale TTS è guidata dalle capacità del canale. I Plugin di canale dichiarano
se il TTS in stile vocale deve chiedere ai provider un target nativo `voice-note` o
mantenere la normale sintesi `audio-file` e contrassegnare solo l'output compatibile per la consegna
vocale.

- **Canali compatibili con le note vocali**: le risposte con note vocali preferiscono Opus (`opus_48000_64` da ElevenLabs, `opus` da OpenAI).
  - 48 kHz / 64 kbps è un buon compromesso per i messaggi vocali.
- **Feishu / WhatsApp**: quando una risposta con nota vocale viene prodotta come MP3/WebM/WAV/M4A
  o come un altro probabile file audio, il Plugin del canale la transcodifica a 48 kHz
  Ogg/Opus con `ffmpeg` prima di inviare il messaggio vocale nativo. WhatsApp invia
  il risultato tramite il payload `audio` di Baileys con `ptt: true` e
  `audio/ogg; codecs=opus`. Se la conversione non riesce, Feishu riceve il file originale
  come allegato; l'invio di WhatsApp non riesce invece di pubblicare un payload PTT
  incompatibile.
- **Altri canali**: MP3 (`mp3_44100_128` da ElevenLabs, `mp3` da OpenAI).
  - 44,1 kHz / 128 kbps è il bilanciamento predefinito per la chiarezza del parlato.
- **MiniMax**: MP3 (modello `speech-2.8-hd`, frequenza di campionamento 32 kHz) per i normali allegati audio. Per le destinazioni di note vocali dichiarate dal canale, OpenClaw transcodifica l'MP3 di MiniMax in Opus a 48 kHz con `ffmpeg` prima della consegna quando il canale dichiara la transcodifica.
- **Xiaomi MiMo**: MP3 per impostazione predefinita, oppure WAV quando configurato. Per le destinazioni di note vocali dichiarate dal canale, OpenClaw transcodifica l'output Xiaomi in Opus a 48 kHz con `ffmpeg` prima della consegna quando il canale dichiara la transcodifica.
- **CLI locale**: usa il `outputFormat` configurato. Le destinazioni di note vocali vengono
  convertite in Ogg/Opus e l'output di telefonia viene convertito in PCM mono grezzo a 16 kHz
  con `ffmpeg`.
- **Google Gemini**: il TTS dell'API Gemini restituisce PCM grezzo a 24 kHz. OpenClaw lo racchiude come WAV per gli allegati audio, lo transcodifica in Opus a 48 kHz per le destinazioni di note vocali e restituisce direttamente PCM per Talk/telefonia.
- **Gradium**: WAV per gli allegati audio, Opus per le destinazioni di note vocali e `ulaw_8000` a 8 kHz per la telefonia.
- **Inworld**: MP3 per i normali allegati audio, `OGG_OPUS` nativo per le destinazioni di note vocali e `PCM` grezzo a 22050 Hz per Talk/telefonia.
- **xAI**: MP3 per impostazione predefinita; `responseFormat` può essere `mp3`, `wav`, `pcm`, `mulaw` o `alaw`. OpenClaw usa l'endpoint TTS REST batch di xAI e restituisce un allegato audio completo; il WebSocket TTS in streaming di xAI non viene usato da questo percorso del provider. Il formato nativo Opus per note vocali non è supportato da questo percorso.
- **Microsoft**: usa `microsoft.outputFormat` (predefinito `audio-24khz-48kbitrate-mono-mp3`).
  - Il trasporto incluso accetta un `outputFormat`, ma non tutti i formati sono disponibili dal servizio.
  - I valori del formato di output seguono i formati di output di Microsoft Speech (inclusi Ogg/WebM Opus).
  - Telegram `sendVoice` accetta OGG/MP3/M4A; usa OpenAI/ElevenLabs se hai bisogno
    di messaggi vocali Opus garantiti.
  - Se il formato di output Microsoft configurato non riesce, OpenClaw ritenta con MP3.

I formati di output OpenAI/ElevenLabs sono fissi per canale (vedi sopra).

## Comportamento Auto-TTS

Quando `messages.tts.auto` è abilitato, OpenClaw:

- Salta il TTS se la risposta contiene già contenuti multimediali strutturati.
- Salta le risposte molto brevi (meno di 10 caratteri).
- Riassume le risposte lunghe quando i riassunti sono abilitati, usando
  `summaryModel` (o `agents.defaults.model.primary`).
- Allega l'audio generato alla risposta.
- In `mode: "final"`, invia comunque il TTS solo audio per le risposte finali in streaming
  dopo il completamento dello stream di testo; il contenuto multimediale generato passa attraverso la stessa
  normalizzazione multimediale del canale degli allegati di risposta normali.

Se la risposta supera `maxLength` e il riassunto è disattivato (o manca una chiave API per il
modello di riassunto), l'audio viene saltato e viene inviata la normale risposta testuale.

```text
Reply -> TTS enabled?
  no  -> send text
  yes -> has media / short?
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

  - **Transcodifica Feishu / WhatsApp:** Quando una risposta con nota vocale arriva come MP3/WebM/WAV/M4A, il Plugin del canale la transcodifica in Ogg/Opus a 48 kHz con `ffmpeg`. WhatsApp invia tramite Baileys con `ptt: true` e `audio/ogg; codecs=opus`. Se la conversione non riesce: Feishu ripiega sull'allegare il file originale; l'invio WhatsApp fallisce invece di pubblicare un payload PTT incompatibile.
  - **MiniMax / Xiaomi MiMo:** MP3 predefinito (32 kHz per MiniMax `speech-2.8-hd`); transcodificato in Opus a 48 kHz per le destinazioni con nota vocale tramite `ffmpeg`.
  - **CLI locale:** Usa `outputFormat` configurato. Le destinazioni con nota vocale sono convertite in Ogg/Opus e l'output di telefonia in PCM mono grezzo a 16 kHz.
  - **Google Gemini:** Restituisce PCM grezzo a 24 kHz. OpenClaw lo incapsula come WAV per gli allegati, lo transcodifica in Opus a 48 kHz per le destinazioni con nota vocale, restituisce direttamente PCM per Talk/telefonia.
  - **Inworld:** Allegati MP3, nota vocale nativa `OGG_OPUS`, `PCM` grezzo a 22050 Hz per Talk/telefonia.
  - **xAI:** MP3 per impostazione predefinita; `responseFormat` può essere `mp3|wav|pcm|mulaw|alaw`. Usa l'endpoint REST batch di xAI: lo streaming WebSocket TTS **non** viene usato. Il formato nativo Opus per note vocali **non** è supportato.
  - **Microsoft:** Usa `microsoft.outputFormat` (predefinito `audio-24khz-48kbitrate-mono-mp3`). Telegram `sendVoice` accetta OGG/MP3/M4A; usa OpenAI/ElevenLabs se hai bisogno di messaggi vocali Opus garantiti. Se il formato Microsoft configurato fallisce, OpenClaw riprova con MP3.

  I formati di output OpenAI ed ElevenLabs sono fissati per canale come elencato sopra.

  ## Riferimento dei campi

  <AccordionGroup>
  <Accordion title="messages.tts.* di primo livello">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Modalità Auto-TTS. `inbound` invia audio solo dopo un messaggio vocale in ingresso; `tagged` invia audio solo quando la risposta include direttive `[[tts:...]]` o un blocco `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Interruttore legacy. `openclaw doctor --fix` lo migra in `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` include le risposte di strumenti/blocchi oltre alle risposte finali.
    </ParamField>
    <ParamField path="provider" type="string">
      ID del provider vocale. Quando non è impostato, OpenClaw usa il primo provider configurato nell'ordine di selezione automatica del registro. Il legacy `provider: "edge"` viene riscritto in `"microsoft"` da `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      ID della persona attiva da `personas`. Normalizzato in minuscolo.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Identità parlata stabile. Campi: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Vedi [Personas](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Modello economico per il riepilogo automatico; predefinito a `agents.defaults.model.primary`. Accetta `provider/model` o un alias di modello configurato.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Consente al modello di emettere direttive TTS. `enabled` è predefinito a `true`; `allowProvider` è predefinito a `false`.
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
      Sovrascrive il percorso JSON delle preferenze locali (provider/limite/riepilogo). Predefinito `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Env: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` o `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Regione Azure Speech (ad es. `eastus`). Env: `AZURE_SPEECH_REGION` o `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Override opzionale dell'endpoint Azure Speech (alias `baseUrl`).</ParamField>
    <ParamField path="speakerVoice" type="string">ShortName della voce Azure. Predefinito `en-US-JennyNeural`. Alias legacy: `voice`.</ParamField>
    <ParamField path="lang" type="string">Codice lingua SSML. Predefinito `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">Azure `X-Microsoft-OutputFormat` per audio standard. Predefinito `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Azure `X-Microsoft-OutputFormat` per output con nota vocale. Predefinito `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">Ripiega su `ELEVENLABS_API_KEY` o `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">ID del modello (ad es. `eleven_multilingual_v2`, `eleven_v3`).</ParamField>
    <ParamField path="speakerVoiceId" type="string">ID della voce ElevenLabs. Alias legacy: `voiceId`.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (ciascuno `0..1`), `useSpeakerBoost` (`true|false`), `speed` (`0.5..2.0`, `1.0` = normale).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Modalità di normalizzazione del testo.</ParamField>
    <ParamField path="languageCode" type="string">ISO 639-1 a 2 lettere (ad es. `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Intero `0..4294967295` per determinismo al meglio possibile.</ParamField>
    <ParamField path="baseUrl" type="string">Sovrascrive l'URL base dell'API ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Ripiega su `GEMINI_API_KEY` / `GOOGLE_API_KEY`. Se omesso, TTS può riusare `models.providers.google.apiKey` prima del fallback env.</ParamField>
    <ParamField path="model" type="string">Modello TTS Gemini. Predefinito `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="speakerVoice" type="string">Nome voce Gemini predefinita. Predefinito `Kore`. Alias legacy: `voiceName`, `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Prompt di stile in linguaggio naturale anteposto prima del testo parlato.</ParamField>
    <ParamField path="speakerName" type="string">Etichetta opzionale del parlante anteposta prima del testo parlato quando il prompt usa un parlante nominato.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Imposta su `audio-profile-v1` per racchiudere i campi del prompt della persona attiva in una struttura deterministica di prompt TTS Gemini.</ParamField>
    <ParamField path="personaPrompt" type="string">Testo aggiuntivo del prompt della persona specifico per Google aggiunto alle Note del direttore del template.</ParamField>
    <ParamField path="baseUrl" type="string">È accettato solo `https://generativelanguage.googleapis.com`.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Env: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Predefinito `https://api.gradium.ai`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Predefinito Emma (`YTpq7expH9539ERJ`). Alias legacy: `voiceId`.</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Primario Inworld

    <ParamField path="apiKey" type="string">Env: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Predefinito `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Predefinito `inworld-tts-1.5-max`. Anche: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Predefinito `Sarah`. Alias legacy: `voiceId`.</ParamField>
    <ParamField path="temperature" type="number">Temperatura di campionamento `0..2`.</ParamField>

  </Accordion>

  <Accordion title="CLI locale (tts-local-cli)">
    <ParamField path="command" type="string">Eseguibile locale o stringa di comando per CLI TTS.</ParamField>
    <ParamField path="args" type="string[]">Argomenti del comando. Supporta i placeholder `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Formato di output CLI previsto. Predefinito `mp3` per gli allegati audio.</ParamField>
    <ParamField path="timeoutMs" type="number">Timeout del comando in millisecondi. Predefinito `120000`.</ParamField>
    <ParamField path="cwd" type="string">Directory di lavoro opzionale del comando.</ParamField>
    <ParamField path="env" type="Record<string, string>">Override opzionali dell'ambiente per il comando.</ParamField>
  </Accordion>

  <Accordion title="Microsoft (nessuna chiave API)">
    <ParamField path="enabled" type="boolean" default="true">Consenti l'uso della sintesi vocale Microsoft.</ParamField>
    <ParamField path="speakerVoice" type="string">Nome della voce neurale Microsoft (es. `en-US-MichelleNeural`). Alias legacy: `voice`.</ParamField>
    <ParamField path="lang" type="string">Codice lingua (es. `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Formato di output Microsoft. Predefinito `audio-24khz-48kbitrate-mono-mp3`. Non tutti i formati sono supportati dal trasporto incluso basato su Edge.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Stringhe percentuali (es. `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Scrivi sottotitoli JSON accanto al file audio.</ParamField>
    <ParamField path="proxy" type="string">URL proxy per le richieste di sintesi vocale Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Override del timeout della richiesta (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Alias legacy. Esegui `openclaw doctor --fix` per riscrivere la configurazione persistita in `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Ricorre a `MINIMAX_API_KEY`. Autenticazione Token Plan tramite `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` o `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Predefinito `https://api.minimax.io`. Env: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Predefinito `speech-2.8-hd`. Env: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Predefinito `English_expressive_narrator`. Env: `MINIMAX_TTS_VOICE_ID`. Alias legacy: `voiceId`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Predefinito `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Predefinito `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Intero `-12..12`. Predefinito `0`. I valori frazionari vengono troncati prima della richiesta.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Ricorre a `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">ID modello OpenAI TTS (es. `gpt-4o-mini-tts`).</ParamField>
    <ParamField path="speakerVoice" type="string">Nome della voce (es. `alloy`, `cedar`). Alias legacy: `voice`.</ParamField>
    <ParamField path="instructions" type="string">Campo OpenAI `instructions` esplicito. Quando impostato, i campi del prompt della persona **non** vengono mappati automaticamente.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">Campi JSON aggiuntivi uniti ai corpi delle richieste `/audio/speech` dopo i campi OpenAI TTS generati. Usa questo per endpoint compatibili con OpenAI come Kokoro che richiedono chiavi specifiche del provider come `lang`; le chiavi di prototipo non sicure vengono ignorate.</ParamField>
    <ParamField path="baseUrl" type="string">
      Esegui l'override dell'endpoint OpenAI TTS. Ordine di risoluzione: configurazione → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. I valori non predefiniti sono trattati come endpoint TTS compatibili con OpenAI, quindi sono accettati nomi di modelli e voci personalizzati.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Env: `OPENROUTER_API_KEY`. Può riutilizzare `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">Predefinito `https://openrouter.ai/api/v1`. Il legacy `https://openrouter.ai/v1` viene normalizzato.</ParamField>
    <ParamField path="model" type="string">Predefinito `hexgrad/kokoro-82m`. Alias: `modelId`.</ParamField>
    <ParamField path="speakerVoice" type="string">Predefinito `af_alloy`. Alias legacy: `voice`, `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Predefinito `mp3`.</ParamField>
    <ParamField path="speed" type="number">Override della velocità nativo del provider.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Env: `VOLCENGINE_TTS_API_KEY` o `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Predefinito `seed-tts-1.0`. Env: `VOLCENGINE_TTS_RESOURCE_ID`. Usa `seed-tts-2.0` quando il tuo progetto ha diritto a TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">Header della chiave app. Predefinito `aGjiRDfUWi`. Env: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Esegui l'override dell'endpoint HTTP Seed Speech TTS. Env: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="speakerVoice" type="string">Tipo di voce. Predefinito `en_female_anna_mars_bigtts`. Env: `VOLCENGINE_TTS_VOICE`. Alias legacy: `voice`.</ParamField>
    <ParamField path="speedRatio" type="number">Rapporto di velocità nativo del provider.</ParamField>
    <ParamField path="emotion" type="string">Tag di emozione nativo del provider.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Campi legacy della console Volcengine Speech. Env: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (predefinito `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Env: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Predefinito `https://api.x.ai/v1`. Env: `XAI_BASE_URL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Predefinito `eve`. Voci disponibili: `ara`, `eve`, `leo`, `rex`, `sal`, `una`. Alias legacy: `voiceId`.</ParamField>
    <ParamField path="language" type="string">Codice lingua BCP-47 o `auto`. Predefinito `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Predefinito `mp3`.</ParamField>
    <ParamField path="speed" type="number">Override della velocità nativo del provider.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Env: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Predefinito `https://api.xiaomimimo.com/v1`. Env: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Predefinito `mimo-v2.5-tts`. Env: `XIAOMI_TTS_MODEL`. Supporta anche `mimo-v2-tts` e `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="speakerVoice" type="string">Predefinito `mimo_default` per i modelli con voce preimpostata. Env: `XIAOMI_TTS_VOICE`. Alias legacy: `voice`. Non inviato per `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Predefinito `mp3`. Env: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Istruzione di stile opzionale in linguaggio naturale inviata come messaggio utente; non viene pronunciata. Per `mimo-v2.5-tts-voicedesign`, questo è il prompt di progettazione vocale; OpenClaw fornisce un valore predefinito quando viene omesso.</ParamField>
  </Accordion>
</AccordionGroup>

## Strumento agente

Lo strumento `tts` converte il testo in sintesi vocale e restituisce un allegato audio per
la consegna della risposta. Su Feishu, Matrix, Telegram e WhatsApp, l'audio viene
consegnato come messaggio vocale anziché come allegato file. Feishu e
WhatsApp possono transcodificare l'output TTS non Opus in questo percorso quando `ffmpeg` è
disponibile.

WhatsApp invia l'audio tramite Baileys come nota vocale PTT (`audio` con
`ptt: true`) e invia il testo visibile **separatamente** dall'audio PTT perché
i client non renderizzano in modo coerente le didascalie sulle note vocali.

Lo strumento accetta i campi opzionali `channel` e `timeoutMs`; `timeoutMs` è un
timeout di richiesta del provider per chiamata in millisecondi. I valori per chiamata eseguono l'override di
`messages.tts.timeoutMs`; i timeout TTS configurati eseguono l'override di qualsiasi valore predefinito
del provider definito dal Plugin.

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

## Collegamenti ai servizi

- [Guida OpenAI text-to-speech](https://platform.openai.com/docs/guides/text-to-speech)
- [Riferimento API OpenAI Audio](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Provider Azure Speech](/it/providers/azure-speech)
- [ElevenLabs Text to Speech](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Autenticazione ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/it/providers/gradium)
- [API Inworld TTS](https://docs.inworld.ai/tts/tts)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [API HTTP Volcengine TTS](/it/providers/volcengine#text-to-speech)
- [Sintesi vocale Xiaomi MiMo](/it/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formati di output Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [Sintesi vocale xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Correlati

- [Panoramica media](/it/tools/media-overview)
- [Generazione musicale](/it/tools/music-generation)
- [Generazione video](/it/tools/video-generation)
- [Comandi slash](/it/tools/slash-commands)
- [Plugin per chiamate vocali](/it/plugins/voice-call)
