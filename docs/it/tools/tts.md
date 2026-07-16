---
read_when:
    - Abilitazione della sintesi vocale per le risposte
    - Configurazione di un provider TTS, una catena di fallback o una persona
    - Utilizzo di comandi o direttive /tts
sidebarTitle: Text to speech (TTS)
summary: Sintesi vocale per le risposte in uscita — provider, voci personalizzate, comandi slash e output per canale
title: Sintesi vocale
x-i18n:
    generated_at: "2026-07-16T15:10:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4ba17f56927507a73b5b116f5f13bb7b612b4ba7669f5ad240d5c96a6620c611
    source_path: tools/tts.md
    workflow: 16
---

OpenClaw converte le risposte in uscita in audio tramite **14 provider vocali**:
messaggi vocali nativi su Feishu, Matrix, Telegram e WhatsApp; allegati
audio ovunque altrove; e flussi PCM/Ulaw per la telefonia e Talk.

La sintesi vocale (TTS) costituisce la componente di output vocale della modalità `stt-tts` di Talk (`talk.speak` utilizza questo
stesso percorso di sintesi). Le sessioni Talk `realtime` native del provider sintetizzano
la voce all'interno del provider in tempo reale; le sessioni `transcription` non
sintetizzano mai una risposta vocale dell'assistente.

## Avvio rapido

<Steps>
  <Step title="Scegliere un provider">
    OpenAI ed ElevenLabs sono le opzioni in hosting più affidabili. Microsoft e
    la CLI locale funzionano senza una chiave API. Consultare la [matrice dei provider](#supported-providers)
    per l'elenco completo.
  </Step>
  <Step title="Impostare la chiave API">
    Esportare la variabile di ambiente del provider (ad esempio `OPENAI_API_KEY`,
    `ELEVENLABS_API_KEY`). Microsoft e la CLI locale non richiedono una chiave.
  </Step>
  <Step title="Abilitare nella configurazione">
    Impostare `messages.tts.auto: "always"` e `messages.tts.provider`:

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
  <Step title="Provare nella chat">
    `/tts status` mostra lo stato attuale. `/tts audio Hello from OpenClaw`
    invia una singola risposta audio.
  </Step>
</Steps>

<Note>
La sintesi vocale automatica è **disattivata** per impostazione predefinita. Quando `messages.tts.provider` non è impostato,
OpenClaw seleziona il primo provider configurato secondo l'ordine di selezione automatica del registro.
Lo strumento agente integrato `tts` viene utilizzato solo su richiesta esplicita: la normale chat rimane
testuale, a meno che l'utente non richieda l'audio, utilizzi `/tts` oppure abiliti la sintesi
vocale automatica o tramite direttiva.
</Note>

## Provider supportati

| Provider          | Autenticazione                                                                                                  | Note                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (anche `AZURE_SPEECH_API_KEY`, `SPEECH_KEY`, `SPEECH_REGION`)       | Output nativo di note vocali Ogg/Opus e telefonia.                                                    |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | Sintesi vocale compatibile con OpenAI. Il valore predefinito è `hexgrad/Kokoro-82M`.                    |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` o `XI_API_KEY`                                                                         | Clonazione vocale, multilingue, deterministica tramite `seed`; streaming per la riproduzione vocale su Discord. |
| **Google Gemini** | `GEMINI_API_KEY` o `GOOGLE_API_KEY`                                                                         | Sintesi vocale in batch tramite API Gemini; sensibile alla persona tramite `promptTemplate: "audio-profile-v1"`.        |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                              | Output di note vocali e telefonia.                                                                    |
| **Inworld**       | `INWORLD_API_KEY`                                                                                              | API di sintesi vocale in streaming. Note vocali Opus native e telefonia PCM.                          |
| **CLI locale**    | nessuna                                                                                                         | Esegue un comando TTS locale configurato.                                                             |
| **Microsoft**     | nessuna                                                                                                         | Sintesi vocale neurale pubblica di Edge tramite `node-edge-tts`. Senza garanzia di servizio.       |
| **MiniMax**       | `MINIMAX_API_KEY` (o Piano token: `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`)                   | API T2A v2. Il valore predefinito è `speech-2.8-hd`.                                               |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                              | Utilizzato anche per il riepilogo automatico; supporta la persona `instructions`.                 |
| **OpenRouter**    | `OPENROUTER_API_KEY` (può riutilizzare `models.providers.openrouter.apiKey`)                                                        | Modello predefinito `hexgrad/kokoro-82m`.                                                               |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` o `BYTEPLUS_SEED_SPEECH_API_KEY` (AppID/token legacy: `VOLCENGINE_TTS_APPID`/`_TOKEN`)             | API HTTP BytePlus Seed Speech.                                                                        |
| **Vydra**         | `VYDRA_API_KEY`                                                                                              | Provider condiviso di immagini, video e voce.                                                         |
| **xAI**           | `XAI_API_KEY`                                                                                              | Sintesi vocale in batch di xAI. Le note vocali Opus native **non** sono supportate.                    |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                              | Sintesi vocale MiMo tramite i completamenti chat di Xiaomi.                                           |

Se sono configurati più provider, viene utilizzato prima quello selezionato e gli
altri fungono da opzioni di ripiego. Il riepilogo automatico utilizza `summaryModel` (o
`agents.defaults.model.primary`), pertanto anche tale provider deve essere autenticato
se i riepiloghi rimangono abilitati.

<Warning>
Il provider **Microsoft** incluso utilizza il servizio di sintesi vocale neurale
online di Microsoft Edge tramite `node-edge-tts`. Si tratta di un servizio web pubblico privo di
SLA o quote pubblicati; considerarlo un servizio senza garanzia. L'ID provider legacy `edge` viene
normalizzato in `microsoft` e `openclaw doctor --fix` riscrive la configurazione
persistente; le nuove configurazioni devono sempre utilizzare `microsoft`.
</Warning>

## Configurazione

La configurazione TTS si trova in `messages.tts` all'interno di `~/.openclaw/openclaw.json`. Scegliere una
preimpostazione e adattare il blocco del provider. I campi `speakerVoice`/`speakerVoiceId`
mostrati di seguito sono quelli canonici; i nomi dei campi `voice`/`voiceId`/
`voiceName` specifici di ciascun provider continuano a funzionare come alias legacy.

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
          // Prompt di stile facoltativi in linguaggio naturale:
          // audioProfile: "Parla con un tono calmo da conduttore di podcast.",
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
  <Tab title="CLI locale">
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
  <Tab title="Microsoft (senza chiave)">
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

Per Xiaomi `mimo-v2.5-tts-voicedesign`, omettere `speakerVoice` e impostare `style` sul
prompt di progettazione vocale. OpenClaw invia tale prompt come messaggio TTS `user`
e non invia `audio.voice` per il modello voicedesign.

### Override vocali per agente

Usare `agents.list[].tts` quando un agente deve parlare con un provider,
una voce, un modello, una persona o una modalità TTS automatica diversi. Il blocco dell'agente viene unito in profondità sopra
`messages.tts`, quindi le credenziali del provider possono rimanere nella configurazione globale del provider:

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

Per fissare una persona per agente, impostare `agents.list[].tts.persona` insieme alla configurazione
del provider: sostituisce il valore globale `messages.tts.persona` solo per quell'agente.

Ordine di precedenza per le risposte automatiche, `/tts audio`, `/tts status` e lo
strumento agente `tts`:

1. `messages.tts`
2. `agents.list[].tts` attivo
3. override del canale, quando il canale supporta `channels.<channel>.tts`
4. override dell'account, quando il canale passa `channels.<channel>.accounts.<id>.tts`
5. preferenze `/tts` locali per questo host
6. direttive `[[tts:...]]` inline quando gli [override determinati dal modello](#model-driven-directives) sono abilitati

Gli override di canale e account usano la stessa struttura di `messages.tts` e
vengono uniti in profondità sopra i livelli precedenti, quindi le credenziali condivise del provider possono rimanere in
`messages.tts`, mentre un canale o un account bot modifica solo la voce del parlante, il modello, la persona
o la modalità automatica:

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
tra diversi provider. Può preferire un provider, definire l'intento del prompt indipendentemente dal provider
e contenere associazioni specifiche del provider per voci, modelli, modelli di prompt,
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
          label: "Narratore",
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
          description: "Narratore maggiordomo britannico, asciutto e cordiale.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "Un brillante maggiordomo britannico. Asciutto, arguto, cordiale, affascinante, emotivamente espressivo, mai generico.",
            scene: "Uno studio silenzioso a tarda notte. Narrazione ravvicinata al microfono per un operatore fidato.",
            sampleContext: "Il parlante risponde a una richiesta tecnica privata con sicurezza concisa e asciutta cordialità.",
            style: "Raffinato, misurato, lievemente divertito.",
            accent: "Inglese britannico.",
            pacing: "Misurato, con brevi pause drammatiche.",
            constraints: ["Non leggere ad alta voce i valori di configurazione.", "Non spiegare la persona."],
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

1. Preferenza locale `/tts persona <id>`, se impostata.
2. `messages.tts.persona`, se impostata.
3. Nessuna persona.

La selezione del provider dà precedenza alle impostazioni esplicite:

1. Override diretti (CLI, Gateway, Talk, direttive TTS consentite).
2. Preferenza locale `/tts provider <id>`.
3. `provider` della persona attiva.
4. `messages.tts.provider`.
5. Selezione automatica dal registro.

Per ogni tentativo del provider, OpenClaw unisce le configurazioni nel seguente ordine:

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. Override della richiesta attendibile
4. Override consentiti delle direttive TTS emesse dal modello

### Come i provider usano i prompt delle persone

I campi del prompt della persona (`profile`, `scene`, `sampleContext`, `style`, `accent`,
`pacing`, `constraints`) sono **indipendenti dal provider**. Ogni provider decide come
usarli:

<AccordionGroup>
  <Accordion title="Google Gemini">
    Racchiude i campi del prompt della persona in una struttura di prompt TTS di Gemini **solo quando**
    la configurazione effettiva del provider Google imposta `promptTemplate: "audio-profile-v1"`
    o `personaPrompt`. I campi precedenti `audioProfile` e `speakerName` vengono
    comunque anteposti come testo del prompt specifico di Google. I tag audio inline come
    `[whispers]` o `[laughs]` all'interno di un blocco `[[tts:text]]` vengono mantenuti
    nella trascrizione di Gemini; OpenClaw non genera questi tag.
  </Accordion>
  <Accordion title="OpenAI">
    Associa i campi del prompt della persona al campo `instructions` della richiesta **solo quando**
    non è configurato alcun `instructions` esplicito di OpenAI. Un `instructions` esplicito
    ha sempre la precedenza.
  </Accordion>
  <Accordion title="Altri provider">
    Usano solo le associazioni della persona specifiche del provider in
    `personas.<id>.providers.<provider>`. I campi del prompt della persona vengono ignorati,
    a meno che il provider non implementi una propria associazione dei prompt della persona.
  </Accordion>
</AccordionGroup>

### Criterio di fallback

`fallbackPolicy` controlla il comportamento quando una persona **non dispone di alcuna associazione** per il
provider su cui viene effettuato il tentativo:

| Criterio            | Comportamento                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preserve-persona`  | **Predefinito.** I campi del prompt indipendenti dal provider rimangono disponibili; il provider può usarli o ignorarli.                         |
| `provider-defaults` | La persona viene omessa dalla preparazione del prompt per quel tentativo; il provider usa i propri valori predefiniti neutrali mentre prosegue il fallback verso altri provider. |
| `fail`              | Salta il tentativo con quel provider usando `reasonCode: "not_configured"` e `personaBinding: "missing"`. Vengono comunque provati i provider di fallback.              |

L'intera richiesta TTS non riesce solo quando **tutti** i provider tentati vengono saltati
o non riescono.

La selezione del provider per una sessione Talk è limitata alla sessione. Un client Talk deve scegliere
gli ID dei provider, dei modelli e delle voci e le impostazioni locali da `talk.catalog` e passarli
tramite la sessione Talk o la richiesta di passaggio. L'apertura di una sessione vocale non deve
modificare `messages.tts` né i valori predefiniti globali dei provider Talk.

## Direttive determinate dal modello

Per impostazione predefinita, l'assistente **può** emettere direttive `[[tts:...]]` per sostituire
voce, modello o velocità per una singola risposta, oltre a un blocco facoltativo
`[[tts:text]]...[[/tts:text]]` per indicazioni espressive che devono comparire
solo nell'audio:

```text
Ecco fatto.

[[tts:speakerVoiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](ride) Leggi la canzone ancora una volta.[[/tts:text]]
```

Quando `messages.tts.auto` è `"tagged"`, le **direttive sono obbligatorie** per attivare
l'audio. La consegna dei blocchi in streaming rimuove le direttive dal testo visibile prima che
il canale le riceva, anche quando sono suddivise tra blocchi adiacenti.

`provider=...` viene ignorato a meno che `modelOverrides.allowProvider: true`. Quando una
risposta dichiara `provider=...`, le altre chiavi della direttiva vengono analizzate
solo da quel provider; le chiavi non supportate vengono rimosse e segnalate come avvisi relativi alle direttive TTS.

**Chiavi di direttiva disponibili:**

- `provider` (ID del provider registrato; richiede `allowProvider: true`)
- `speakerVoice` / `speakerVoiceId` (alias precedenti: `voice`, `voiceName`, `voice_name`, `google_voice`, `voiceId`)
- `model` / `google_model`
- `stability`, `similarityBoost`, `style`, `speed`, `useSpeakerBoost`
- `vol` / `volume` (volume MiniMax, `(0, 10]`)
- `pitch` (intonazione MiniMax intera, da −12 a 12; i valori frazionari vengono troncati)
- `emotion` (tag emotivo Volcengine)
- `applyTextNormalization` (`auto|on|off`)
- `languageCode` (ISO 639-1)
- `seed`

**Disabilitare completamente gli override del modello:**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**Consentire il cambio di provider mantenendo configurabili gli altri parametri:**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## Comandi slash

Comando singolo `/tts`. Su Discord, OpenClaw registra anche `/voice` perché
`/tts` è un comando integrato di Discord; il testo `/tts ...` continua a funzionare.

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
I comandi richiedono un mittente autorizzato (si applicano le regole della lista consentita/del proprietario) e
deve essere abilitato `commands.text` oppure la registrazione nativa dei comandi.
</Note>

Note sul comportamento:

- `/tts on` scrive la preferenza TTS locale in `always`; `/tts off` la scrive in `off`.
- `/tts chat on|off|default` scrive un override TTS automatico limitato alla sessione per la chat corrente.
- `/tts persona <id>` scrive la preferenza locale della persona; `/tts persona off` la cancella.
- `/tts latest` legge l'ultima risposta dell'assistente dalla trascrizione della sessione corrente e la invia una volta come audio. Memorizza solo un hash di tale risposta nella voce della sessione per impedire invii vocali duplicati.
- `/tts audio` genera una risposta audio una tantum (**non** attiva o disattiva TTS).
- `/tts limit <chars>` accetta **100–4096** (4096 è il massimo per didascalie/messaggi di Telegram); i valori al di fuori di questo intervallo vengono rifiutati.
- `limit` e `summary` vengono memorizzati nelle **preferenze locali**, non nella configurazione principale.
- `/tts status` include la diagnostica di fallback per l'ultimo tentativo: `Fallback: <primary> -> <used>`, `Attempts: ...` e i dettagli di ciascun tentativo (`provider:outcome(reasonCode) latency`).
- `/status` mostra la modalità TTS attiva insieme al provider, al modello, alla voce e ai metadati sanitizzati dell'endpoint personalizzato configurati quando TTS è abilitato.

## Preferenze per utente

I comandi slash scrivono gli override locali in `prefsPath`. Il valore predefinito è
`~/.openclaw/settings/tts.json`; è possibile sostituirlo con la variabile d'ambiente `OPENCLAW_TTS_PREFS`
o `messages.tts.prefsPath`.

| Campo memorizzato | Effetto                                                                           |
| ------------ | -------------------------------------------------------------------------------- |
| `auto`       | Override locale del TTS automatico (`always`, `off`, …)                                     |
| `provider`   | Override locale del provider principale                                                  |
| `persona`    | Override locale della persona                                                           |
| `maxLength`  | Soglia di riepilogo/troncamento (valore predefinito: `1500` caratteri, intervallo `/tts limit`: 100–4096) |
| `summarize`  | Attivazione/disattivazione del riepilogo (valore predefinito: `true`)                                                  |

Questi valori sostituiscono la configurazione effettiva derivata da `messages.tts` più il blocco
`agents.list[].tts` attivo per quell'host.

## Formati di output

La distribuzione vocale TTS dipende dalle funzionalità del canale. I Plugin dei canali indicano
se il TTS in stile vocale deve richiedere ai provider una destinazione `voice-note` nativa o
mantenere la normale sintesi `audio-file`, e se il canale transcodifica
l'output non nativo prima dell'invio.

| Destinazione                          | Formato                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | Le risposte con messaggi vocali preferiscono **Opus** (`opus_48000_64` da ElevenLabs, `opus` da OpenAI). 48 kHz / 64 kbps offre un buon equilibrio tra chiarezza e dimensioni. |
| Altri canali                          | **MP3** (`mp3_44100_128` da ElevenLabs, `mp3` da OpenAI). 44.1 kHz / 128 kbps è il compromesso predefinito per il parlato.                  |
| Conversazione / telefonia             | **PCM** nativo del provider (Inworld 22050 Hz, Google 24 kHz) oppure `ulaw_8000` da Gradium per la telefonia.                                 |

Note specifiche per provider:

- **Transcodifica per Feishu / WhatsApp:** quando una risposta con messaggio vocale arriva come MP3/WebM/WAV/M4A o come un altro probabile file audio, il Plugin del canale la transcodifica in Ogg/Opus a 48 kHz con `ffmpeg` (`libopus`, 64 kbps) prima di inviare il messaggio vocale nativo. WhatsApp invia il risultato tramite il payload Baileys `audio` con `ptt: true` e `audio/ogg; codecs=opus`. In caso di errore di transcodifica: Feishu intercetta l'errore e ripiega sull'invio del file originale come semplice allegato; WhatsApp non dispone di un ripiego, quindi l'invio stesso non riesce anziché pubblicare un payload PTT incompatibile.
- **MiniMax:** MP3 (modello `speech-2.8-hd`, frequenza di campionamento di 32 kHz) per i normali allegati audio; transcodificato in Opus a 48 kHz con `ffmpeg` per le destinazioni di messaggi vocali indicate dal canale.
- **Xiaomi MiMo:** MP3 per impostazione predefinita oppure WAV quando configurato; transcodificato in Opus a 48 kHz con `ffmpeg` per le destinazioni di messaggi vocali indicate dal canale.
- **CLI locale:** usa il valore `outputFormat` configurato. Le destinazioni di messaggi vocali vengono convertite in Ogg/Opus e l'output telefonico viene convertito in PCM mono raw a 16 kHz con `ffmpeg`.
- **Google Gemini:** restituisce PCM raw a 24 kHz. OpenClaw lo incapsula come WAV per gli allegati audio, lo transcodifica in Opus a 48 kHz per le destinazioni di messaggi vocali e restituisce direttamente PCM per Conversazione/telefonia.
- **Gradium:** WAV per gli allegati audio, Opus per le destinazioni di messaggi vocali e `ulaw_8000` a 8 kHz per la telefonia.
- **Inworld:** MP3 per i normali allegati audio, `OGG_OPUS` nativo per le destinazioni di messaggi vocali e `PCM` raw a 22050 Hz per Conversazione/telefonia.
- **xAI:** MP3 per impostazione predefinita; la sintesi di file audio può usare `mp3`, `wav`, `pcm`, `mulaw` o `alaw` sia per l'output con buffering sia per quello in streaming. Le destinazioni di messaggi vocali usano MP3 per lo streaming e come ripiego con buffering, perché gli output `pcm`, `mulaw` e `alaw` di xAI sono audio raw senza intestazione. La sintesi con buffering usa l'endpoint REST batch `/v1/tts` di xAI; `textToSpeechStream` usa `wss://api.x.ai/v1/tts` nativo. Questo non è il contratto vocale in tempo reale. Il formato vocale Opus nativo non è supportato.
- **Microsoft:** usa `microsoft.outputFormat` (valore predefinito: `audio-24khz-48kbitrate-mono-mp3`).
  - Il trasporto incluso accetta un valore `outputFormat`, ma il servizio non rende disponibili tutti i formati.
  - I valori del formato di output seguono i formati di output di Microsoft Speech (incluso Ogg/WebM Opus).
  - Il valore `sendVoice` di Telegram accetta OGG/MP3/M4A; usare OpenAI/ElevenLabs se sono necessari messaggi vocali Opus garantiti.
  - Se il formato di output Microsoft configurato non riesce, OpenClaw riprova con MP3.
  - Quando non è impostato alcun override esplicito della voce e viene usata la voce inglese predefinita, OpenClaw passa automaticamente a una voce neurale cinese (`zh-CN-XiaoxiaoNeural`, impostazioni locali `zh-CN`) se il testo della risposta è prevalentemente CJK.

I formati di output di OpenAI ed ElevenLabs sono fissi per ciascun canale, come indicato sopra.

## Comportamento del TTS automatico

Quando `messages.tts.auto` è abilitato, OpenClaw:

- Ignora la sintesi vocale se la risposta contiene già contenuti multimediali strutturati.
- Ignora le risposte molto brevi (meno di 10 caratteri).
- Riassume le risposte lunghe quando i riepiloghi sono abilitati, utilizzando
  `summaryModel` (o `agents.defaults.model.primary`).
- Allega l'audio generato alla risposta.
- In `mode: "final"`, invia comunque solo l'audio della sintesi vocale per le risposte finali trasmesse in streaming
  al termine del flusso di testo; i contenuti multimediali generati vengono sottoposti alla stessa
  normalizzazione dei contenuti multimediali del canale applicata ai normali allegati delle risposte.

Se la risposta supera `maxLength`, OpenClaw non omette mai completamente l'audio:

- **Riepilogo attivo** (impostazione predefinita) e disponibilità di un modello di riepilogo: riassume il
  testo fino a circa `maxLength` caratteri, quindi sintetizza il riepilogo.
- **Riepilogo disattivato**, errore del riepilogo o nessuna chiave API disponibile per il
  modello di riepilogo: tronca il testo a `maxLength` caratteri e sintetizza il
  testo troncato.

```text
Risposta -> sintesi vocale abilitata?
  no  -> invia testo
  sì  -> contiene contenuti multimediali / è breve?
          sì -> invia testo
          no  -> lunghezza > limite?
                   no  -> sintesi vocale -> allega audio
                   sì  -> riepilogo abilitato e disponibile?
                            no  -> tronca -> sintesi vocale -> allega audio
                            sì  -> riassumi -> sintesi vocale -> allega audio
```

## Riferimento dei campi

<AccordionGroup>
  <Accordion title="messages.tts.* di primo livello">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      Modalità di sintesi vocale automatica. `inbound` invia l'audio solo dopo un messaggio vocale in ingresso; `tagged` invia l'audio solo quando la risposta include direttive `[[tts:...]]` o un blocco `[[tts:text]]`.
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      Opzione legacy. `openclaw doctor --fix` la migra a `auto`.
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` include le risposte di strumenti/blocchi oltre alle risposte finali.
    </ParamField>
    <ParamField path="provider" type="string">
      ID del provider vocale. Se non impostato, OpenClaw utilizza il primo provider configurato nell'ordine di selezione automatica del registro. Il valore legacy `provider: "edge"` viene riscritto come `"microsoft"` da `openclaw doctor --fix`.
    </ParamField>
    <ParamField path="persona" type="string">
      ID della persona attiva da `personas`. Normalizzato in minuscolo.
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      Identità vocale stabile. Campi: `label`, `description`, `provider`, `fallbackPolicy`, `prompt`, `providers.<provider>`. Consultare [Profili vocali](#personas).
    </ParamField>
    <ParamField path="summaryModel" type="string">
      Modello economico per il riepilogo automatico; valore predefinito: `agents.defaults.model.primary`. Accetta `provider/model` o un alias di modello configurato.
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      Consente al modello di emettere direttive di sintesi vocale. Il valore predefinito di `enabled` è `true`; il valore predefinito di `allowProvider` è `false`.
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      Impostazioni gestite dal provider e indicizzate per ID del provider vocale. I blocchi diretti legacy (`messages.tts.openai`, `.elevenlabs`, `.microsoft`, `.edge`) vengono riscritti da `openclaw doctor --fix`; salvare solo `messages.tts.providers.<id>`.
    </ParamField>
    <ParamField path="maxTextLength" type="number" default="4096">
      Limite massimo assoluto di caratteri per l'input della sintesi vocale. `/tts audio`, `tts.convert` e `tts.speak` generano un errore se viene superato.
    </ParamField>
    <ParamField path="timeoutMs" type="number" default="30000">
      Timeout della richiesta in millisecondi. Un valore `timeoutMs` per chiamata (strumento dell'agente, Gateway) ha la precedenza quando impostato; in caso contrario, un valore `messages.tts.timeoutMs` configurato esplicitamente ha la precedenza su qualsiasi valore predefinito del provider definito dal Plugin.
    </ParamField>
    <ParamField path="prefsPath" type="string">
      Sostituisce il percorso JSON locale delle preferenze (provider/limite/riepilogo). Valore predefinito: `~/.openclaw/settings/tts.json`.
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">Variabile di ambiente: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_API_KEY` o `SPEECH_KEY`.</ParamField>
    <ParamField path="region" type="string">Area di Azure Speech (ad es. `eastus`). Variabile di ambiente: `AZURE_SPEECH_REGION` o `SPEECH_REGION`.</ParamField>
    <ParamField path="endpoint" type="string">Sostituzione facoltativa dell'endpoint di Azure Speech (alias `baseUrl`).</ParamField>
    <ParamField path="speakerVoice" type="string">ShortName della voce Azure. Valore predefinito: `en-US-JennyNeural`. Alias legacy: `voice`.</ParamField>
    <ParamField path="lang" type="string">Codice lingua SSML. Valore predefinito: `en-US`.</ParamField>
    <ParamField path="outputFormat" type="string">Valore `X-Microsoft-OutputFormat` di Azure per l'audio standard. Valore predefinito: `audio-24khz-48kbitrate-mono-mp3`.</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">Valore `X-Microsoft-OutputFormat` di Azure per l'output delle note vocali. Valore predefinito: `ogg-24khz-16bit-mono-opus`.</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">In alternativa utilizza `ELEVENLABS_API_KEY` o `XI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">ID del modello. Valore predefinito: `eleven_multilingual_v2`. Gli ID legacy `eleven_turbo_v2_5`/`eleven_turbo_v2` vengono normalizzati nel modello `flash` corrispondente.</ParamField>
    <ParamField path="speakerVoiceId" type="string">ID della voce ElevenLabs. Valore predefinito: `pMsXgVXv3BLzUgSXRplE`. Alias legacy: `voiceId`.</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`, `similarityBoost`, `style` (ciascuno `0..1`, valori predefiniti `0.5`/`0.75`/`0`), `useSpeakerBoost` (`true|false`, valore predefinito `true`), `speed` (`0.5..2.0`, valore predefinito `1.0`).
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>Modalità di normalizzazione del testo.</ParamField>
    <ParamField path="languageCode" type="string">Codice ISO 639-1 di 2 lettere (ad es. `en`, `de`).</ParamField>
    <ParamField path="seed" type="number">Valore intero `0..4294967295` per ottenere il miglior determinismo possibile.</ParamField>
    <ParamField path="baseUrl" type="string">Sostituisce l'URL di base dell'API ElevenLabs.</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">Utilizza in alternativa `GEMINI_API_KEY` / `GOOGLE_API_KEY`. Se omesso, TTS può riutilizzare `models.providers.google.apiKey` prima di ricorrere alla variabile di ambiente.</ParamField>
    <ParamField path="model" type="string">Modello TTS di Gemini. Valore predefinito: `gemini-3.1-flash-tts-preview`.</ParamField>
    <ParamField path="speakerVoice" type="string">Nome della voce predefinita di Gemini. Valore predefinito: `Kore`. Alias precedenti: `voiceName`, `voice`.</ParamField>
    <ParamField path="audioProfile" type="string">Prompt di stile in linguaggio naturale anteposto al testo pronunciato.</ParamField>
    <ParamField path="speakerName" type="string">Etichetta facoltativa del parlante anteposta al testo pronunciato quando il prompt utilizza un parlante con nome.</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>Impostare su `audio-profile-v1` per racchiudere i campi del prompt della persona attiva in una struttura di prompt TTS Gemini deterministica.</ParamField>
    <ParamField path="personaPrompt" type="string">Testo aggiuntivo del prompt della persona specifico per Google, aggiunto alle note del regista del modello.</ParamField>
    <ParamField path="baseUrl" type="string">È accettato solo `https://generativelanguage.googleapis.com`.</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">Variabile di ambiente: `GRADIUM_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">URL HTTPS dell'API Gradium su `api.gradium.ai`. Valore predefinito: `https://api.gradium.ai`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Valore predefinito: Emma (`YTpq7expH9539ERJ`). Alias precedente: `voiceId`.</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    ### Inworld principale

    <ParamField path="apiKey" type="string">Variabile di ambiente: `INWORLD_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Valore predefinito: `https://api.inworld.ai`.</ParamField>
    <ParamField path="modelId" type="string">Valore predefinito: `inworld-tts-1.5-max`. Altri valori: `inworld-tts-1.5-mini`, `inworld-tts-1-max`, `inworld-tts-1`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Valore predefinito: `Sarah`. Alias precedente: `voiceId`.</ParamField>
    <ParamField path="temperature" type="number">Temperatura di campionamento `0..2` (0 escluso).</ParamField>

  </Accordion>

  <Accordion title="CLI locale (tts-local-cli)">
    <ParamField path="command" type="string">Eseguibile locale o stringa di comando per la sintesi vocale tramite CLI.</ParamField>
    <ParamField path="args" type="string[]">Argomenti del comando. Supporta i segnaposto `{{Text}}`, `{{OutputPath}}`, `{{OutputDir}}`, `{{OutputBase}}`.</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>Formato di output previsto della CLI. Valore predefinito: `mp3` per gli allegati audio.</ParamField>
    <ParamField path="timeoutMs" type="number">Timeout del comando in millisecondi. Valore predefinito: `120000`.</ParamField>
    <ParamField path="cwd" type="string">Directory di lavoro facoltativa del comando.</ParamField>
    <ParamField path="env" type="Record<string, string>">Sostituzioni facoltative delle variabili di ambiente per il comando.</ParamField>

    Lo stdout del comando e l'audio generato o convertito sono limitati a 50 MiB. Lo stderr diagnostico è limitato a 1 MiB. OpenClaw termina il comando e interrompe la sintesi con un errore quando uno dei due limiti viene superato.

  </Accordion>

  <Accordion title="Microsoft (nessuna chiave API)">
    <ParamField path="enabled" type="boolean" default="true">Consente l'utilizzo della sintesi vocale Microsoft.</ParamField>
    <ParamField path="speakerVoice" type="string">Nome della voce neurale Microsoft (ad es. `en-US-MichelleNeural`). Alias precedente: `voice`. Se è attiva la voce inglese predefinita e il testo della risposta è prevalentemente CJK, OpenClaw passa automaticamente a `zh-CN-XiaoxiaoNeural`.</ParamField>
    <ParamField path="lang" type="string">Codice della lingua (ad es. `en-US`).</ParamField>
    <ParamField path="outputFormat" type="string">Formato di output Microsoft. Valore predefinito: `audio-24khz-48kbitrate-mono-mp3`. Il trasporto incluso basato su Edge non supporta tutti i formati.</ParamField>
    <ParamField path="rate / pitch / volume" type="string">Stringhe percentuali (ad es. `+10%`, `-5%`).</ParamField>
    <ParamField path="saveSubtitles" type="boolean">Scrive i sottotitoli JSON accanto al file audio.</ParamField>
    <ParamField path="proxy" type="string">URL del proxy per le richieste di sintesi vocale Microsoft.</ParamField>
    <ParamField path="timeoutMs" type="number">Sostituzione del timeout della richiesta (ms).</ParamField>
    <ParamField path="edge.*" type="object" deprecated>Alias precedente. Eseguire `openclaw doctor --fix` per riscrivere la configurazione persistente in `providers.microsoft`.</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">Utilizza in alternativa `MINIMAX_API_KEY`. Autenticazione Token Plan tramite `MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY` o `MINIMAX_CODING_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Valore predefinito: `https://api.minimax.io`. Variabile di ambiente: `MINIMAX_API_HOST`.</ParamField>
    <ParamField path="model" type="string">Valore predefinito: `speech-2.8-hd`. Variabile di ambiente: `MINIMAX_TTS_MODEL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Valore predefinito: `English_expressive_narrator`. Variabile di ambiente: `MINIMAX_TTS_VOICE_ID`. Alias precedente: `voiceId`.</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`. Valore predefinito: `1.0`.</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`. Valore predefinito: `1.0`.</ParamField>
    <ParamField path="pitch" type="number">Numero intero `-12..12`. Valore predefinito: `0`. I valori frazionari vengono troncati prima della richiesta.</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">Utilizza in alternativa `OPENAI_API_KEY`.</ParamField>
    <ParamField path="model" type="string">ID del modello TTS di OpenAI. Valore predefinito: `gpt-4o-mini-tts`.</ParamField>
    <ParamField path="speakerVoice" type="string">Nome della voce (ad es. `alloy`, `cedar`). Valore predefinito: `coral`. Alias precedente: `voice`.</ParamField>
    <ParamField path="instructions" type="string">Campo OpenAI `instructions` esplicito. Quando è impostato, i campi del prompt della persona **non** vengono mappati automaticamente.</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">Campi JSON aggiuntivi uniti ai corpi delle richieste `/audio/speech` dopo i campi TTS di OpenAI generati. Utilizzare questa opzione per endpoint compatibili con OpenAI, come Kokoro, che richiedono chiavi specifiche del provider come `lang`; le chiavi di prototipo non sicure vengono ignorate.</ParamField>
    <ParamField path="baseUrl" type="string">
      Sostituisce l'endpoint TTS di OpenAI. Ordine di risoluzione: configurazione → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`. I valori non predefiniti vengono trattati come endpoint TTS compatibili con OpenAI; sono quindi accettati nomi personalizzati per modelli e voci e `speed` non è più soggetto al controllo dell'intervallo `0.25..4.0`.
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">Variabile di ambiente: `OPENROUTER_API_KEY`. Può riutilizzare `models.providers.openrouter.apiKey`.</ParamField>
    <ParamField path="baseUrl" type="string">Valore predefinito: `https://openrouter.ai/api/v1`. Il valore precedente `https://openrouter.ai/v1` viene normalizzato.</ParamField>
    <ParamField path="model" type="string">Valore predefinito: `hexgrad/kokoro-82m`. Alias: `modelId`.</ParamField>
    <ParamField path="speakerVoice" type="string">Valore predefinito: `af_alloy`. Alias precedenti: `voice`, `voiceId`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>Valore predefinito: `mp3`.</ParamField>
    <ParamField path="speed" type="number">Sostituzione della velocità nativa del provider.</ParamField>
  </Accordion>

  <Accordion title="Volcengine (BytePlus Seed Speech)">
    <ParamField path="apiKey" type="string">Variabile di ambiente: `VOLCENGINE_TTS_API_KEY` o `BYTEPLUS_SEED_SPEECH_API_KEY`.</ParamField>
    <ParamField path="resourceId" type="string">Valore predefinito: `seed-tts-1.0`. Variabile di ambiente: `VOLCENGINE_TTS_RESOURCE_ID`. Utilizzare `seed-tts-2.0` quando il progetto dispone dell'abilitazione TTS 2.0.</ParamField>
    <ParamField path="appKey" type="string">Intestazione della chiave dell'app. Valore predefinito: `aGjiRDfUWi`. Variabile di ambiente: `VOLCENGINE_TTS_APP_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Sostituisce l'endpoint HTTP TTS di Seed Speech. Variabile di ambiente: `VOLCENGINE_TTS_BASE_URL`.</ParamField>
    <ParamField path="speakerVoice" type="string">Tipo di voce. Valore predefinito: `en_female_anna_mars_bigtts`. Variabile di ambiente: `VOLCENGINE_TTS_VOICE`. Alias precedente: `voice`.</ParamField>
    <ParamField path="speedRatio" type="number">Rapporto di velocità nativo del provider, `0.2..3`.</ParamField>
    <ParamField path="emotion" type="string">Tag dell'emozione nativo del provider.</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>Campi precedenti della console Volcengine Speech. Variabili di ambiente: `VOLCENGINE_TTS_APPID`, `VOLCENGINE_TTS_TOKEN`, `VOLCENGINE_TTS_CLUSTER` (valore predefinito: `volcano_tts`).</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">Variabile di ambiente: `XAI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Valore predefinito: `https://api.x.ai/v1`. Variabile di ambiente: `XAI_BASE_URL`.</ParamField>
    <ParamField path="speakerVoiceId" type="string">Valore predefinito: `eve`. Con l'autenticazione, `openclaw infer tts voices --provider xai` recupera il catalogo integrato corrente; senza autenticazione elenca le alternative offline `ara`, `eve`, `leo`, `rex` e `sal`. Gli ID delle voci personalizzate dell'account vengono inoltrati anche quando non sono presenti nell'elenco integrato. Alias precedente: `voiceId`.</ParamField>
    <ParamField path="language" type="string">Codice della lingua BCP-47 o `auto`. Valore predefinito: `en`.</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>Valore predefinito: `mp3`.</ParamField>
    <ParamField path="speed" type="number">Sostituzione della velocità nativa del provider, `0.7..1.5`.</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">Variabile di ambiente: `XIAOMI_API_KEY`.</ParamField>
    <ParamField path="baseUrl" type="string">Valore predefinito: `https://api.xiaomimimo.com/v1`. Variabile di ambiente: `XIAOMI_BASE_URL`.</ParamField>
    <ParamField path="model" type="string">Valore predefinito: `mimo-v2.5-tts`. Variabile di ambiente: `XIAOMI_TTS_MODEL`. Supporta anche `mimo-v2-tts` e `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="speakerVoice" type="string">Valore predefinito: `mimo_default` per i modelli con voce preimpostata. Variabile di ambiente: `XIAOMI_TTS_VOICE`. Alias precedente: `voice`. Non viene inviato per `mimo-v2.5-tts-voicedesign`.</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>Valore predefinito: `mp3`. Variabile di ambiente: `XIAOMI_TTS_FORMAT`.</ParamField>
    <ParamField path="style" type="string">Istruzione di stile facoltativa in linguaggio naturale, inviata come messaggio dell'utente e non pronunciata. Per `mimo-v2.5-tts-voicedesign`, costituisce il prompt di progettazione della voce; OpenClaw fornisce un valore predefinito quando viene omessa.</ParamField>
  </Accordion>
</AccordionGroup>

## Strumento dell'agente

Lo strumento `tts` converte il testo in voce e restituisce un allegato audio per
la consegna della risposta. Su Feishu, Matrix, Telegram e WhatsApp, l'audio viene
consegnato come messaggio vocale anziché come allegato file. Feishu e
WhatsApp possono transcodificare l'output TTS non Opus in questo percorso quando `ffmpeg` è
disponibile.

WhatsApp invia l'audio tramite Baileys come nota vocale PTT (`audio` con
`ptt: true`) e invia il testo visibile **separatamente** dall'audio PTT, poiché
i client non visualizzano in modo uniforme le didascalie delle note vocali.

Lo strumento accetta i campi facoltativi `channel` e `timeoutMs`; `timeoutMs` è un
timeout della richiesta al provider per singola chiamata, espresso in millisecondi. I valori per singola chiamata sostituiscono
`messages.tts.timeoutMs`; i timeout TTS configurati sostituiscono qualsiasi valore predefinito
del provider definito dal Plugin.

## RPC del Gateway

| Metodo            | Scopo                                      |
| ----------------- | -------------------------------------------- |
| `tts.status`      | Legge lo stato TTS corrente e l'ultimo tentativo.     |
| `tts.enable`      | Imposta la preferenza automatica locale su `always`.       |
| `tts.disable`     | Imposta la preferenza automatica locale su `off`.          |
| `tts.convert`     | Converte una tantum il testo in audio.                        |
| `tts.setProvider` | Imposta la preferenza locale per il provider.               |
| `tts.personas`    | Elenca le personas configurate e quella attiva. |
| `tts.setPersona`  | Imposta la preferenza locale per la persona.                |
| `tts.providers`   | Elenca i provider configurati e il relativo stato.        |

## Link ai servizi

- [Guida alla sintesi vocale di OpenAI](https://platform.openai.com/docs/guides/text-to-speech)
- [Riferimento dell'API Audio di OpenAI](https://platform.openai.com/docs/api-reference/audio)
- [Sintesi vocale tramite REST di Azure Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Provider Azure Speech](/it/providers/azure-speech)
- [Sintesi vocale di ElevenLabs](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [Autenticazione di ElevenLabs](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/it/providers/gradium)
- [API TTS di Inworld](https://docs.inworld.ai/tts/tts)
- [API MiniMax T2A v2](https://platform.minimaxi.com/document/T2A%20V2)
- [API HTTP TTS di Volcengine](/it/providers/volcengine#text-to-speech)
- [Sintesi vocale Xiaomi MiMo](/it/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Formati di output di Microsoft Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [Sintesi vocale di xAI](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## Argomenti correlati

- [Panoramica dei contenuti multimediali](/it/tools/media-overview)
- [Generazione musicale](/it/tools/music-generation)
- [Generazione video](/it/tools/video-generation)
- [Comandi slash](/it/tools/slash-commands)
- [Plugin per chiamate vocali](/it/plugins/voice-call)
