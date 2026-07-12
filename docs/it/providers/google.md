---
read_when:
    - Vuoi utilizzare i modelli Google Gemini con OpenClaw
    - È necessaria la chiave API o il flusso di autenticazione OAuth
summary: Configurazione di Google Gemini (chiave API + OAuth, generazione di immagini, comprensione dei contenuti multimediali, TTS, ricerca web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-07-12T07:27:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 423f9b048a705815e886690fa13f5b02f7e67707195b7b461f6b4765528a4756
    source_path: providers/google.md
    workflow: 16
---

Il plugin Google fornisce accesso ai modelli Gemini tramite Google AI Studio, oltre a generazione di immagini, comprensione di contenuti multimediali (immagini/audio/video), sintesi vocale e ricerca web tramite Gemini Grounding.

- Provider: `google`
- Autenticazione: `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- API: API Google Gemini
- Opzione di runtime: `agentRuntime.id: "google-gemini-cli"` riutilizza OAuth della CLI Gemini mantenendo canonici i riferimenti ai modelli come `google/*`.

## Per iniziare

Scegli il metodo di autenticazione preferito e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Chiave API">
    **Ideale per:** accesso standard all'API Gemini tramite Google AI Studio.

    <Steps>
      <Step title="Esegui la configurazione iniziale">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        In alternativa, passa direttamente la chiave:

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="Imposta un modello predefinito">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Sono accettate sia `GEMINI_API_KEY` sia `GOOGLE_API_KEY`. Usa quella che hai già configurato.
    </Tip>

  </Tab>

  <Tab title="CLI Gemini (OAuth)">
    **Ideale per:** riutilizzare un accesso esistente alla CLI Gemini tramite OAuth PKCE anziché una chiave API separata.

    <Warning>
    Il provider `google-gemini-cli` è un'integrazione non ufficiale. Alcuni utenti
    segnalano restrizioni dell'account quando utilizzano OAuth in questo modo. Usalo a tuo rischio.
    </Warning>

    <Steps>
      <Step title="Installa la CLI Gemini">
        Il comando locale `gemini` deve essere disponibile in `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # oppure npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw supporta sia le installazioni tramite Homebrew sia quelle globali tramite npm, incluse
        le comuni strutture Windows/npm.
      </Step>
      <Step title="Accedi tramite OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Modello predefinito: `google/gemini-3.1-pro-preview`
    - Runtime: `google-gemini-cli`
    - Alias: `gemini-cli`

    L'ID del modello Gemini API di Gemini 3.1 Pro è `gemini-3.1-pro-preview`. OpenClaw accetta la forma abbreviata `google/gemini-3.1-pro` come alias pratico e la normalizza prima delle chiamate al provider.

    **Variabili d'ambiente:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID` / `GEMINI_CLI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET` / `GEMINI_CLI_OAUTH_CLIENT_SECRET`

    <Note>
    Se le richieste OAuth della CLI Gemini non riescono dopo l'accesso, imposta `GOOGLE_CLOUD_PROJECT` o
    `GOOGLE_CLOUD_PROJECT_ID` sull'host del Gateway e riprova.
    </Note>

    <Note>
    Se l'accesso non riesce prima dell'avvio del flusso nel browser, assicurati che il comando locale `gemini`
    sia installato e presente in `PATH`.
    </Note>

    I riferimenti ai modelli `google-gemini-cli/*` sono alias di compatibilità legacy. Le nuove
    configurazioni devono usare riferimenti ai modelli `google/*` insieme al runtime
    `google-gemini-cli` quando si desidera l'esecuzione locale tramite la CLI Gemini.

  </Tab>
</Tabs>

<Note>
`google/gemini-3-pro-preview` è stato ritirato il 09-03-2026; usa invece `google/gemini-3.1-pro-preview`. Ripetendo la configurazione della chiave API Gemini (`openclaw onboard --auth-choice gemini-api-key` oppure `openclaw models auth login --provider google`), un modello predefinito configurato obsoleto viene sostituito con quello attuale.
</Note>

## Funzionalità

| Funzionalità                    | Supportata                    |
| ------------------------------- | ----------------------------- |
| Completamenti di chat           | Sì                            |
| Generazione di immagini         | Sì                            |
| Generazione musicale            | Sì                            |
| Sintesi vocale                  | Sì                            |
| Voce in tempo reale             | Sì (Google Live API)          |
| Comprensione delle immagini     | Sì                            |
| Trascrizione audio              | Sì                            |
| Comprensione dei video          | Sì                            |
| Ricerca web (Grounding)         | Sì                            |
| Pensiero/ragionamento           | Sì (Gemini 2.5+ / Gemini 3+)  |
| Modelli Gemma 4                 | Sì                            |

## Ricerca web

Il provider di ricerca web `gemini` incluso usa il Grounding con Google Search di Gemini.
Configura una chiave di ricerca dedicata in `plugins.entries.google.config.webSearch`,
oppure consentigli di riutilizzare `models.providers.google.apiKey` dopo `GEMINI_API_KEY`:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // facoltativo se è impostato GEMINI_API_KEY o models.providers.google.apiKey
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // usa come ripiego models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

L'ordine di precedenza delle credenziali è: `webSearch.apiKey` dedicata, quindi `GEMINI_API_KEY`,
infine `models.providers.google.apiKey`. `webSearch.baseUrl` è facoltativo ed
è destinato ai proxy degli operatori o agli endpoint compatibili con l'API Gemini; se omesso,
la ricerca web di Gemini riutilizza `models.providers.google.baseUrl`. Consulta
[Ricerca Gemini](/it/tools/gemini-search) per il comportamento dello strumento specifico del provider.

<Tip>
I modelli Gemini 3 usano `thinkingLevel` anziché `thinkingBudget`. OpenClaw associa
i controlli di ragionamento di Gemini 3, Gemini 3.1 e degli alias `gemini-*-latest` a
`thinkingLevel`, in modo che le esecuzioni predefinite/a bassa latenza non inviino valori
`thinkingBudget` disabilitati.

`/think adaptive` mantiene la semantica di pensiero dinamico di Google anziché scegliere
un livello OpenClaw fisso. Gemini 3 e Gemini 3.1 omettono un `thinkingLevel` fisso affinché
Google possa scegliere il livello; Gemini 2.5 invia il valore sentinella dinamico di Google
`thinkingBudget: -1`.

I modelli Gemma 4 (ad esempio `gemma-4-26b-a4b-it`) supportano la modalità di pensiero. OpenClaw
converte `thinkingBudget` in un valore Google `thinkingLevel` supportato per Gemma 4.
Impostando il pensiero su `off`, questo rimane disabilitato anziché essere associato a
`MINIMAL`.

Gemini 2.5 Pro funziona solo in modalità di pensiero e rifiuta un valore esplicito
`thinkingBudget: 0`; OpenClaw rimuove tale valore dalle richieste per Gemini 2.5 Pro
anziché inviarlo.
</Tip>

## Generazione di immagini

Il provider `google` incluso per la generazione di immagini usa come valore predefinito
`google/gemini-3.1-flash-image-preview`.

- Supporta anche `google/gemini-3-pro-image-preview`
- Generazione: fino a 4 immagini per richiesta
- Modalità di modifica: abilitata, fino a 5 immagini di input
- Controlli geometrici: `size`, `aspectRatio` e `resolution`

Per usare Google come provider di immagini predefinito:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
Consulta [Generazione di immagini](/it/tools/image-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

## Generazione di video

Il plugin `google` incluso registra anche la generazione di video tramite lo strumento condiviso
`video_generate`.

- Modello video predefinito: `google/veo-3.1-fast-generate-preview`
- Modalità: da testo a video, da immagine a video e flussi con un singolo video di riferimento
- Supporta `aspectRatio` (`16:9`, `9:16`) e `resolution` (`720P`, `1080P`); attualmente Veo non supporta l'output audio
- Durate supportate: **4, 6 o 8 secondi** (gli altri valori vengono arrotondati al valore consentito più vicino)

Per usare Google come provider video predefinito:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
Consulta [Generazione di video](/it/tools/video-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

## Generazione musicale

Il plugin `google` incluso registra anche la generazione musicale tramite lo strumento condiviso
`music_generate`.

- Modello musicale predefinito: `google/lyria-3-clip-preview`
- Supporta anche `google/lyria-3-pro-preview`
- Controlli del prompt: `lyrics` e `instrumental`
- Formato di output: `mp3` per impostazione predefinita, oltre a `wav` su `google/lyria-3-pro-preview`
- Input di riferimento: fino a 10 immagini
- Le esecuzioni basate su sessione vengono scollegate tramite il flusso condiviso di attività/stato, incluso `action: "status"`

Per usare Google come provider musicale predefinito:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
Consulta [Generazione musicale](/it/tools/music-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

## Sintesi vocale

Il provider vocale `google` incluso usa il percorso TTS dell'API Gemini con
`gemini-3.1-flash-tts-preview`.

- Voce predefinita: `Kore`
- Autenticazione: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- Output: WAV per i normali allegati TTS, Opus per le destinazioni di note vocali, PCM per conversazioni/telefonia
- Output delle note vocali: il PCM di Google viene incapsulato come WAV e transcodificato in Opus a 48 kHz con `ffmpeg`

Il percorso TTS Gemini in batch di Google restituisce l'audio generato nella risposta
`generateContent` completata. Per conversazioni vocali con la latenza più bassa, usa il
provider vocale Google in tempo reale basato sull'API Gemini Live anziché il TTS
in batch.

Per usare Google come provider TTS predefinito:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          speakerVoice: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Il TTS dell'API Gemini usa prompt in linguaggio naturale per controllare lo stile. Imposta
`audioProfile` per anteporre al testo pronunciato un prompt di stile riutilizzabile. Imposta
`speakerName` quando il testo del prompt fa riferimento a un interlocutore specifico.

Il TTS dell'API Gemini accetta anche tag audio espressivi tra parentesi quadre nel testo,
come `[whispers]` o `[laughs]`. Per escludere i tag dalla risposta visibile della chat
pur inviandoli al TTS, inseriscili in un blocco `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Una chiave API di Google Cloud Console limitata all'API Gemini è valida per questo
provider. Non si tratta del percorso separato dell'API Cloud Text-to-Speech.
</Note>

## Voce in tempo reale

Il plugin `google` incluso registra un provider vocale in tempo reale basato sull'API
Gemini Live per bridge audio backend come Voice Call e Google Meet.

| Impostazione                   | Percorso di configurazione                                           | Valore predefinito                                                                    |
| ----------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Modello                       | `plugins.entries.voice-call.config.realtime.providers.google.model`  | `gemini-3.1-flash-live-preview`                                                       |
| Voce                          | `...google.voice`                                                    | `Kore`                                                                                |
| Temperatura                   | `...google.temperature`                                              | (non impostato)                                                                       |
| Sensibilità iniziale VAD      | `...google.startSensitivity`                                         | (non impostato)                                                                       |
| Sensibilità finale VAD        | `...google.endSensitivity`                                           | (non impostato)                                                                       |
| Durata del silenzio           | `...google.silenceDurationMs`                                        | (non impostato)                                                                       |
| Gestione dell'attività        | `...google.activityHandling`                                         | Valore predefinito di Google, `start-of-activity-interrupts`                          |
| Copertura del turno           | `...google.turnCoverage`                                             | Valore predefinito di Google, `audio-activity-and-all-video`                          |
| Disabilita VAD automatico     | `...google.automaticActivityDetectionDisabled`                       | `false`                                                                               |
| Ripresa della sessione        | `...google.sessionResumption`                                        | `true`                                                                                |
| Compressione del contesto     | `...google.contextWindowCompression`                                 | `true`                                                                                |
| Chiave API                    | `...google.apiKey`                                                   | Usa in alternativa `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY` |

Esempio di configurazione in tempo reale per Voice Call:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-3.1-flash-live-preview",
                speakerVoice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "audio-activity-and-all-video",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Google Live API usa audio bidirezionale e chiamate di funzione tramite WebSocket.
OpenClaw adatta l'audio del bridge di telefonia/Meet al flusso PCM della Live API di Gemini e
mantiene le chiamate agli strumenti nel contratto vocale condiviso in tempo reale. Lascia `temperature`
non impostato, a meno che non siano necessarie modifiche al campionamento; OpenClaw omette i valori non positivi
perché Google Live può restituire trascrizioni senza audio con `temperature: 0`.
La trascrizione dell'API Gemini viene abilitata senza `languageCodes`; l'attuale SDK di Google
rifiuta i suggerimenti sul codice della lingua in questo percorso API.
</Note>

<Note>
Gemini 3.1 Live accetta testo conversazionale tramite input in tempo reale e usa
chiamate di funzione sequenziali. OpenClaw omette i precedenti campi `NON_BLOCKING`, di pianificazione
delle risposte delle funzioni e di dialogo affettivo per questo modello. È preferibile
`thinkingLevel`; i valori positivi configurati per `thinkingBudget` vengono associati al
livello supportato più vicino, mentre `-1` mantiene il valore predefinito di Google. Consulta il
[confronto delle funzionalità di Gemini Live](https://ai.google.dev/gemini-api/docs/live-api/capabilities).
</Note>

<Note>
Talk dell'interfaccia di controllo supporta le sessioni browser di Google Live con token vincolati
monouso. I provider vocali in tempo reale utilizzabili solo dal backend possono funzionare anche tramite il
trasporto relay generico del Gateway, che mantiene le credenziali del provider sul Gateway.
</Note>

Per la verifica live da parte dei manutentori, esegui
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Lo smoke test copre anche i percorsi backend/WebRTC di OpenAI; il passaggio Google genera lo stesso
formato di token vincolato della Live API usato da Talk dell'interfaccia di controllo, apre l'endpoint
WebSocket del browser, invia il payload di configurazione iniziale e attende
`setupComplete`.

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Riutilizzo diretto della cache di Gemini">
    Per le esecuzioni dirette dell'API Gemini (`api: "google-generative-ai"`), OpenClaw
    passa alle richieste Gemini un handle `cachedContent` configurato.

    - Configura i parametri per modello o globali con
      `cachedContent` oppure con il precedente `cached_content`
    - I parametri di un ambito più specifico (livello del modello rispetto a quello globale) hanno sempre la precedenza.
      Nello stesso ambito, se entrambe le chiavi sono impostate, prevale `cached_content`.
      Usa una sola chiave per ambito per evitare risultati imprevisti.
    - Valore di esempio: `cachedContents/prebuilt-context`
    - L'utilizzo della cache di Gemini in caso di corrispondenza viene normalizzato nel campo `cacheRead` di OpenClaw a partire da
      `cachedContentTokenCount` del sistema a monte

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Note sull'utilizzo della CLI di Gemini">
    Quando si usa il provider OAuth `google-gemini-cli`, OpenClaw utilizza per impostazione predefinita
    l'output `stream-json` della CLI di Gemini e normalizza l'utilizzo dal payload finale
    `stats`. Le sostituzioni precedenti con `--output-format json` continuano a usare il
    parser JSON.

    - Il testo della risposta trasmessa in streaming proviene dagli eventi `message` dell'assistente.
    - Per l'output JSON precedente, il testo della risposta proviene dal campo `response` del JSON della CLI.
    - Se la CLI lascia vuoto `usage`, l'utilizzo viene ricavato in alternativa da `stats`.
    - `stats.cached` viene normalizzato nel campo `cacheRead` di OpenClaw.
    - Se `stats.input` non è presente, OpenClaw ricava i token di input da
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Configurazione dell'ambiente e del daemon">
    Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `GEMINI_API_KEY`
    sia disponibile per tale processo (ad esempio in `~/.openclaw/.env` oppure tramite
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Contenuti correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento per le immagini e selezione del provider.
  </Card>
  <Card title="Generazione di video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento per i video e selezione del provider.
  </Card>
  <Card title="Generazione di musica" href="/it/tools/music-generation" icon="music">
    Parametri condivisi dello strumento per la musica e selezione del provider.
  </Card>
</CardGroup>
