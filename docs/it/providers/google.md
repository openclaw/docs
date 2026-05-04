---
read_when:
    - Vuoi usare i modelli Google Gemini con OpenClaw
    - È necessaria la chiave API o il flusso di autenticazione OAuth
summary: Configurazione di Google Gemini (chiave API + OAuth, generazione di immagini, comprensione dei contenuti multimediali, TTS, ricerca web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-04T07:07:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3e45627f5d5cd57e858c7590a90435b7fc0e9381509f3312a16fc9e9a4cbd908
    source_path: providers/google.md
    workflow: 16
---

Il plugin Google fornisce accesso ai modelli Gemini tramite Google AI Studio, oltre a generazione di immagini, comprensione dei media (immagini/audio/video), sintesi vocale e ricerca web tramite Gemini Grounding.

- Fornitore: `google`
- Autenticazione: `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- API: API Google Gemini
- Opzione di runtime: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  riutilizza l'OAuth della Gemini CLI mantenendo i riferimenti ai modelli canonici come `google/*`.

## Per iniziare

Scegli il metodo di autenticazione preferito e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Chiave API">
    **Ideale per:** accesso standard all'API Gemini tramite Google AI Studio.

    <Steps>
      <Step title="Esegui l'onboarding">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        Oppure passa direttamente la chiave:

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
    Le variabili di ambiente `GEMINI_API_KEY` e `GOOGLE_API_KEY` sono entrambe accettate. Usa quella che hai gia configurato.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Ideale per:** riutilizzare un accesso Gemini CLI esistente tramite OAuth PKCE invece di una chiave API separata.

    <Warning>
    Il fornitore `google-gemini-cli` e un'integrazione non ufficiale. Alcuni utenti
    segnalano restrizioni dell'account quando usano OAuth in questo modo. Usalo a tuo rischio.
    </Warning>

    <Steps>
      <Step title="Installa Gemini CLI">
        Il comando locale `gemini` deve essere disponibile in `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw supporta sia le installazioni Homebrew sia le installazioni npm globali, inclusi
        i layout Windows/npm comuni.
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

    L'ID modello dell'API Gemini per Gemini 3.1 Pro e `gemini-3.1-pro-preview`. OpenClaw accetta il piu breve `google/gemini-3.1-pro` come alias di comodita e lo normalizza prima delle chiamate al fornitore.

    **Variabili di ambiente:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Oppure le varianti `GEMINI_CLI_*`.)

    <Note>
    Se le richieste OAuth di Gemini CLI falliscono dopo l'accesso, imposta `GOOGLE_CLOUD_PROJECT` o
    `GOOGLE_CLOUD_PROJECT_ID` sull'host del gateway e riprova.
    </Note>

    <Note>
    Se l'accesso fallisce prima dell'avvio del flusso del browser, assicurati che il comando locale `gemini`
    sia installato e presente in `PATH`.
    </Note>

    I riferimenti ai modelli `google-gemini-cli/*` sono alias di compatibilita legacy. Le nuove
    configurazioni dovrebbero usare riferimenti ai modelli `google/*` piu il runtime `google-gemini-cli`
    quando vogliono l'esecuzione locale tramite Gemini CLI.

  </Tab>
</Tabs>

## Capacita

| Capacita               | Supportata                    |
| ---------------------- | ----------------------------- |
| Completamenti chat     | Si                            |
| Generazione immagini   | Si                            |
| Generazione musicale   | Si                            |
| Sintesi vocale         | Si                            |
| Voce in tempo reale    | Si (Google Live API)          |
| Comprensione immagini  | Si                            |
| Trascrizione audio     | Si                            |
| Comprensione video     | Si                            |
| Ricerca web (Grounding)| Si                            |
| Pensiero/ragionamento  | Si (Gemini 2.5+ / Gemini 3+) |
| Modelli Gemma 4        | Si                            |

## Ricerca web

Il fornitore di ricerca web `gemini` incluso usa il grounding di Gemini Google Search.
Configura una chiave di ricerca dedicata in `plugins.entries.google.config.webSearch`,
oppure lascia che riutilizzi `models.providers.google.apiKey` dopo `GEMINI_API_KEY`:

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // optional if GEMINI_API_KEY or models.providers.google.apiKey is set
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // falls back to models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

La precedenza delle credenziali e `webSearch.apiKey` dedicato, poi `GEMINI_API_KEY`,
poi `models.providers.google.apiKey`. `webSearch.baseUrl` e facoltativo ed
esiste per proxy degli operatori o endpoint API Gemini compatibili; quando omesso,
la ricerca web Gemini riutilizza `models.providers.google.baseUrl`. Vedi
[Ricerca Gemini](/it/tools/gemini-search) per il comportamento dello strumento specifico del fornitore.

<Tip>
I modelli Gemini 3 usano `thinkingLevel` invece di `thinkingBudget`. OpenClaw mappa
i controlli di ragionamento degli alias Gemini 3, Gemini 3.1 e `gemini-*-latest` a
`thinkingLevel` cosi le esecuzioni predefinite/a bassa latenza non inviano valori
`thinkingBudget` disabilitati.

`/think adaptive` mantiene la semantica di pensiero dinamico di Google invece di scegliere
un livello OpenClaw fisso. Gemini 3 e Gemini 3.1 omettono un `thinkingLevel` fisso cosi
Google puo scegliere il livello; Gemini 2.5 invia il sentinel dinamico di Google
`thinkingBudget: -1`.

I modelli Gemma 4 (per esempio `gemma-4-26b-a4b-it`) supportano la modalita di pensiero. OpenClaw
riscrive `thinkingBudget` in un `thinkingLevel` Google supportato per Gemma 4.
Impostare il pensiero su `off` conserva il pensiero disabilitato invece di mapparlo a
`MINIMAL`.
</Tip>

## Generazione immagini

Il fornitore di generazione immagini `google` incluso usa per impostazione predefinita
`google/gemini-3.1-flash-image-preview`.

- Supporta anche `google/gemini-3-pro-image-preview`
- Generazione: fino a 4 immagini per richiesta
- Modalita di modifica: abilitata, fino a 5 immagini di input
- Controlli geometrici: `size`, `aspectRatio` e `resolution`

Per usare Google come fornitore di immagini predefinito:

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
Vedi [Generazione immagini](/it/tools/image-generation) per parametri condivisi dello strumento, selezione del fornitore e comportamento di failover.
</Note>

## Generazione video

Il plugin `google` incluso registra anche la generazione video tramite lo strumento condiviso
`video_generate`.

- Modello video predefinito: `google/veo-3.1-fast-generate-preview`
- Modalita: flussi da testo a video, da immagine a video e con riferimento a singolo video
- Supporta `aspectRatio`, `resolution` e `audio`
- Limite di durata attuale: **da 4 a 8 secondi**

Per usare Google come fornitore video predefinito:

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
Vedi [Generazione video](/it/tools/video-generation) per parametri condivisi dello strumento, selezione del fornitore e comportamento di failover.
</Note>

## Generazione musicale

Il plugin `google` incluso registra anche la generazione musicale tramite lo strumento condiviso
`music_generate`.

- Modello musicale predefinito: `google/lyria-3-clip-preview`
- Supporta anche `google/lyria-3-pro-preview`
- Controlli del prompt: `lyrics` e `instrumental`
- Formato di output: `mp3` per impostazione predefinita, piu `wav` su `google/lyria-3-pro-preview`
- Input di riferimento: fino a 10 immagini
- Le esecuzioni con sessione si scollegano tramite il flusso condiviso di attivita/stato, incluso `action: "status"`

Per usare Google come fornitore musicale predefinito:

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
Vedi [Generazione musicale](/it/tools/music-generation) per parametri condivisi dello strumento, selezione del fornitore e comportamento di failover.
</Note>

## Sintesi vocale

Il fornitore vocale `google` incluso usa il percorso TTS dell'API Gemini con
`gemini-3.1-flash-tts-preview`.

- Voce predefinita: `Kore`
- Autenticazione: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- Output: WAV per allegati TTS normali, Opus per destinazioni con nota vocale, PCM per Talk/telefonia
- Output nota vocale: il PCM di Google viene incapsulato come WAV e transcodificato in Opus a 48 kHz con `ffmpeg`

Per usare Google come fornitore TTS predefinito:

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Il TTS dell'API Gemini usa prompt in linguaggio naturale per il controllo dello stile. Imposta
`audioProfile` per anteporre un prompt di stile riutilizzabile prima del testo parlato. Imposta
`speakerName` quando il testo del prompt fa riferimento a un parlante con nome.

Il TTS dell'API Gemini accetta anche tag audio espressivi tra parentesi quadre nel testo,
come `[whispers]` o `[laughs]`. Per tenere i tag fuori dalla risposta chat visibile
pur inviandoli al TTS, inseriscili in un blocco `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Una chiave API di Google Cloud Console limitata all'API Gemini e valida per questo
fornitore. Questo non e il percorso separato dell'API Cloud Text-to-Speech.
</Note>

## Voce in tempo reale

Il plugin `google` incluso registra un fornitore di voce in tempo reale basato sulla
Gemini Live API per bridge audio backend come Voice Call e Google Meet.

| Impostazione          | Percorso di configurazione                                          | Predefinito                                                                           |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Modello               | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Voce                  | `...google.voice`                                                   | `Kore`                                                                                |
| Temperatura           | `...google.temperature`                                             | (non impostata)                                                                       |
| Sensibilità inizio VAD | `...google.startSensitivity`                                        | (non impostata)                                                                       |
| Sensibilità fine VAD  | `...google.endSensitivity`                                          | (non impostata)                                                                       |
| Durata del silenzio   | `...google.silenceDurationMs`                                       | (non impostata)                                                                       |
| Gestione dell'attività | `...google.activityHandling`                                        | Predefinito di Google, `start-of-activity-interrupts`                                 |
| Copertura del turno   | `...google.turnCoverage`                                            | Predefinito di Google, `only-activity`                                                |
| Disabilita VAD automatico | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| Ripresa della sessione | `...google.sessionResumption`                                       | `true`                                                                                |
| Compressione del contesto | `...google.contextWindowCompression`                                | `true`                                                                                |
| Chiave API            | `...google.apiKey`                                                  | Ripiega su `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY` |

Esempio di configurazione realtime Voice Call:

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
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "only-activity",
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
Google Live API usa audio bidirezionale e chiamate di funzioni tramite WebSocket.
OpenClaw adatta l'audio del bridge telefonia/Meet allo stream PCM Live API di Gemini e
mantiene le chiamate agli strumenti sul contratto vocale realtime condiviso. Lascia `temperature`
non impostata a meno che non ti servano modifiche al campionamento; OpenClaw omette i valori non positivi
perché Google Live può restituire trascrizioni senza audio per `temperature: 0`.
La trascrizione Gemini API è abilitata senza `languageCodes`; l'SDK Google attuale
rifiuta i suggerimenti sui codici lingua in questo percorso API.
</Note>

<Note>
Control UI Talk supporta sessioni Google Live nel browser con token monouso
vincolati. Anche i provider vocali realtime solo backend possono essere eseguiti tramite il trasporto
relay generico del Gateway, che mantiene le credenziali del provider sul Gateway.
</Note>

Per la verifica live da maintainer, esegui
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Il ramo Google crea la stessa forma di token Live API vincolato usata da Control
UI Talk, apre l'endpoint WebSocket del browser, invia il payload di configurazione iniziale
e attende `setupComplete`.

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Riutilizzo diretto della cache Gemini">
    Per le esecuzioni dirette Gemini API (`api: "google-generative-ai"`), OpenClaw
    passa un handle `cachedContent` configurato alle richieste Gemini.

    - Configura parametri per modello o globali con
      `cachedContent` o il legacy `cached_content`
    - Se sono presenti entrambi, prevale `cachedContent`
    - Valore di esempio: `cachedContents/prebuilt-context`
    - L'uso dei cache hit di Gemini viene normalizzato in `cacheRead` di OpenClaw da
      `cachedContentTokenCount` upstream

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

  <Accordion title="Note sull'uso JSON di Gemini CLI">
    Quando usi il provider OAuth `google-gemini-cli`, OpenClaw normalizza
    l'output JSON della CLI come segue:

    - Il testo della risposta proviene dal campo `response` del JSON della CLI.
    - L'utilizzo ripiega su `stats` quando la CLI lascia `usage` vuoto.
    - `stats.cached` viene normalizzato in `cacheRead` di OpenClaw.
    - Se `stats.input` manca, OpenClaw deriva i token di input da
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Ambiente e configurazione del daemon">
    Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `GEMINI_API_KEY`
    sia disponibile per quel processo (ad esempio in `~/.openclaw/.env` o tramite
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento immagini e selezione del provider.
  </Card>
  <Card title="Generazione di video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="Generazione di musica" href="/it/tools/music-generation" icon="music">
    Parametri condivisi dello strumento musica e selezione del provider.
  </Card>
</CardGroup>
