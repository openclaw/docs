---
read_when:
    - Vuoi usare i modelli Google Gemini con OpenClaw
    - È necessaria la chiave API o il flusso di autenticazione OAuth
summary: Configurazione di Google Gemini (chiave API + OAuth, generazione di immagini, comprensione dei contenuti multimediali, TTS, ricerca web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-05-02T08:31:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 14605b88f0d1d7e01796d429113a73b2b52a48fde6443565dcb3db47653be5e7
    source_path: providers/google.md
    workflow: 16
---

Il plugin Google fornisce accesso ai modelli Gemini tramite Google AI Studio, oltre a
generazione di immagini, comprensione dei media (immagine/audio/video), sintesi vocale e ricerca web tramite
Gemini Grounding.

- Fornitore: `google`
- Autenticazione: `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- API: Google Gemini API
- Opzione di runtime: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  riutilizza OAuth di Gemini CLI mantenendo i riferimenti ai modelli canonici come `google/*`.

## Per iniziare

Scegli il metodo di autenticazione preferito e segui i passaggi di configurazione.

<Tabs>
  <Tab title="API key">
    **Ideale per:** accesso standard alla Gemini API tramite Google AI Studio.

    <Steps>
      <Step title="Run onboarding">
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
      <Step title="Set a default model">
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
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    Le variabili d'ambiente `GEMINI_API_KEY` e `GOOGLE_API_KEY` sono entrambe accettate. Usa quella che hai già configurato.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Ideale per:** riutilizzare un accesso Gemini CLI esistente tramite PKCE OAuth invece di una chiave API separata.

    <Warning>
    Il fornitore `google-gemini-cli` è un'integrazione non ufficiale. Alcuni utenti
    segnalano restrizioni dell'account quando usano OAuth in questo modo. Usalo a tuo rischio.
    </Warning>

    <Steps>
      <Step title="Install the Gemini CLI">
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
      <Step title="Log in via OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - Modello predefinito: `google/gemini-3.1-pro-preview`
    - Runtime: `google-gemini-cli`
    - Alias: `gemini-cli`

    L'ID modello Gemini API di Gemini 3.1 Pro è `gemini-3.1-pro-preview`. OpenClaw accetta il più breve `google/gemini-3.1-pro` come alias di praticità e lo normalizza prima delle chiamate al fornitore.

    **Variabili d'ambiente:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Oppure le varianti `GEMINI_CLI_*`.)

    <Note>
    Se le richieste OAuth di Gemini CLI falliscono dopo l'accesso, imposta `GOOGLE_CLOUD_PROJECT` o
    `GOOGLE_CLOUD_PROJECT_ID` sull'host gateway e riprova.
    </Note>

    <Note>
    Se l'accesso fallisce prima dell'avvio del flusso del browser, assicurati che il comando locale `gemini`
    sia installato e in `PATH`.
    </Note>

    I riferimenti ai modelli `google-gemini-cli/*` sono alias di compatibilità legacy. Le nuove
    configurazioni dovrebbero usare riferimenti ai modelli `google/*` più il runtime `google-gemini-cli`
    quando vogliono l'esecuzione locale di Gemini CLI.

  </Tab>
</Tabs>

## Funzionalità

| Funzionalità                  | Supportata                    |
| ----------------------------- | ----------------------------- |
| Completamenti chat            | Sì                            |
| Generazione di immagini       | Sì                            |
| Generazione di musica         | Sì                            |
| Sintesi vocale                | Sì                            |
| Voce in tempo reale           | Sì (Google Live API)          |
| Comprensione delle immagini   | Sì                            |
| Trascrizione audio            | Sì                            |
| Comprensione dei video        | Sì                            |
| Ricerca web (Grounding)       | Sì                            |
| Pensiero/ragionamento         | Sì (Gemini 2.5+ / Gemini 3+)  |
| Modelli Gemma 4               | Sì                            |

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

La precedenza delle credenziali è `webSearch.apiKey` dedicata, poi `GEMINI_API_KEY`,
poi `models.providers.google.apiKey`. `webSearch.baseUrl` è facoltativo ed
esiste per proxy dell'operatore o endpoint Gemini API compatibili; quando è omesso,
la ricerca web Gemini riutilizza `models.providers.google.baseUrl`. Vedi
[Ricerca Gemini](/it/tools/gemini-search) per il comportamento dello strumento specifico del fornitore.

<Tip>
I modelli Gemini 3 usano `thinkingLevel` invece di `thinkingBudget`. OpenClaw mappa
i controlli di ragionamento degli alias Gemini 3, Gemini 3.1 e `gemini-*-latest` a
`thinkingLevel` così le esecuzioni predefinite/a bassa latenza non inviano valori
`thinkingBudget` disabilitati.

`/think adaptive` mantiene la semantica di pensiero dinamico di Google invece di scegliere
un livello OpenClaw fisso. Gemini 3 e Gemini 3.1 omettono un `thinkingLevel` fisso così
Google può scegliere il livello; Gemini 2.5 invia il sentinel dinamico di Google
`thinkingBudget: -1`.

I modelli Gemma 4 (per esempio `gemma-4-26b-a4b-it`) supportano la modalità di pensiero. OpenClaw
riscrive `thinkingBudget` in un `thinkingLevel` Google supportato per Gemma 4.
Impostare il pensiero su `off` preserva il pensiero disabilitato invece di mapparlo a
`MINIMAL`.
</Tip>

## Generazione di immagini

Il fornitore di generazione di immagini `google` incluso usa per impostazione predefinita
`google/gemini-3.1-flash-image-preview`.

- Supporta anche `google/gemini-3-pro-image-preview`
- Generazione: fino a 4 immagini per richiesta
- Modalità modifica: abilitata, fino a 5 immagini di input
- Controlli di geometria: `size`, `aspectRatio` e `resolution`

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
Vedi [Generazione di immagini](/it/tools/image-generation) per parametri condivisi dello strumento, selezione del fornitore e comportamento di failover.
</Note>

## Generazione video

Il plugin `google` incluso registra anche la generazione video tramite lo strumento condiviso
`video_generate`.

- Modello video predefinito: `google/veo-3.1-fast-generate-preview`
- Modalità: flussi da testo a video, da immagine a video e riferimento a singolo video
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

## Generazione di musica

Il plugin `google` incluso registra anche la generazione di musica tramite lo strumento condiviso
`music_generate`.

- Modello musicale predefinito: `google/lyria-3-clip-preview`
- Supporta anche `google/lyria-3-pro-preview`
- Controlli del prompt: `lyrics` e `instrumental`
- Formato di output: `mp3` per impostazione predefinita, più `wav` su `google/lyria-3-pro-preview`
- Input di riferimento: fino a 10 immagini
- Le esecuzioni supportate da sessione si sganciano tramite il flusso condiviso attività/stato, incluso `action: "status"`

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
Vedi [Generazione di musica](/it/tools/music-generation) per parametri condivisi dello strumento, selezione del fornitore e comportamento di failover.
</Note>

## Sintesi vocale

Il fornitore vocale `google` incluso usa il percorso TTS della Gemini API con
`gemini-3.1-flash-tts-preview`.

- Voce predefinita: `Kore`
- Autenticazione: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- Output: WAV per allegati TTS regolari, Opus per destinazioni nota vocale, PCM per Talk/telefonia
- Output nota vocale: Google PCM viene incapsulato come WAV e transcodificato in Opus a 48 kHz con `ffmpeg`

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

Gemini API TTS usa prompt in linguaggio naturale per il controllo dello stile. Imposta
`audioProfile` per anteporre un prompt di stile riutilizzabile prima del testo parlato. Imposta
`speakerName` quando il testo del prompt fa riferimento a un parlante nominato.

Gemini API TTS accetta anche tag audio espressivi tra parentesi quadre nel testo,
come `[whispers]` o `[laughs]`. Per tenere i tag fuori dalla risposta chat visibile
mentre li invii a TTS, inseriscili dentro un blocco `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Una chiave API di Google Cloud Console limitata alla Gemini API è valida per questo
fornitore. Questo non è il percorso separato Cloud Text-to-Speech API.
</Note>

## Voce in tempo reale

Il plugin `google` incluso registra un fornitore voce in tempo reale basato sulla
Gemini Live API per bridge audio backend come Voice Call e Google Meet.

| Impostazione          | Percorso config                                                     | Predefinito                                                                           |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Modello               | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Voce                  | `...google.voice`                                                   | `Kore`                                                                                |
| Temperatura           | `...google.temperature`                                             | (non impostato)                                                                       |
| Sensibilità inizio VAD | `...google.startSensitivity`                                        | (non impostato)                                                                       |
| Sensibilità fine VAD  | `...google.endSensitivity`                                          | (non impostato)                                                                       |
| Durata silenzio       | `...google.silenceDurationMs`                                       | (non impostato)                                                                       |
| Gestione attività     | `...google.activityHandling`                                        | Predefinito di Google, `start-of-activity-interrupts`                                 |
| Copertura turno       | `...google.turnCoverage`                                            | Predefinito di Google, `only-activity`                                                |
| Disabilita VAD automatico | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| Chiave API            | `...google.apiKey`                                                  | Ripiega su `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY` |

Esempio di configurazione in tempo reale di Voice Call:

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
Google Live API usa audio bidirezionale e chiamate di funzione tramite un WebSocket.
OpenClaw adatta l'audio del bridge telefonico/Meet al flusso PCM Live API di Gemini e
mantiene le chiamate agli strumenti sul contratto vocale in tempo reale condiviso. Lascia `temperature`
non impostato a meno che non ti servano modifiche al campionamento; OpenClaw omette i valori non positivi
perché Google Live può restituire trascrizioni senza audio per `temperature: 0`.
La trascrizione Gemini API è abilitata senza `languageCodes`; l'attuale SDK Google
rifiuta gli hint di codice lingua su questo percorso API.
</Note>

<Note>
Control UI Talk supporta sessioni browser Google Live con token monouso vincolati.
I provider vocali in tempo reale solo backend possono anche essere eseguiti tramite il trasporto relay generico
del Gateway, che mantiene le credenziali del provider sul Gateway.
</Note>

Per la verifica live dei maintainer, esegui
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
La parte Google conia la stessa forma di token Live API vincolato usata da Control
UI Talk, apre l'endpoint WebSocket del browser, invia il payload di configurazione iniziale
e attende `setupComplete`.

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Direct Gemini cache reuse">
    Per le esecuzioni dirette della Gemini API (`api: "google-generative-ai"`), OpenClaw
    passa un handle `cachedContent` configurato alle richieste Gemini.

    - Configura parametri per modello o globali con
      `cachedContent` o il legacy `cached_content`
    - Se entrambi sono presenti, prevale `cachedContent`
    - Valore di esempio: `cachedContents/prebuilt-context`
    - L'utilizzo da cache hit di Gemini viene normalizzato in `cacheRead` di OpenClaw da
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

  <Accordion title="Gemini CLI JSON usage notes">
    Quando usi il provider OAuth `google-gemini-cli`, OpenClaw normalizza
    l'output JSON della CLI come segue:

    - Il testo della risposta proviene dal campo `response` del JSON della CLI.
    - L'utilizzo ripiega su `stats` quando la CLI lascia `usage` vuoto.
    - `stats.cached` viene normalizzato in `cacheRead` di OpenClaw.
    - Se `stats.input` manca, OpenClaw deriva i token di input da
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Environment and daemon setup">
    Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `GEMINI_API_KEY`
    sia disponibile per quel processo (per esempio in `~/.openclaw/.env` o tramite
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Model selection" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, riferimenti modello e comportamento di failover.
  </Card>
  <Card title="Image generation" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento immagine e selezione del provider.
  </Card>
  <Card title="Video generation" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="Music generation" href="/it/tools/music-generation" icon="music">
    Parametri condivisi dello strumento musica e selezione del provider.
  </Card>
</CardGroup>
