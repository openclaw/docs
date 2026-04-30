---
read_when:
    - Vuoi utilizzare i modelli Google Gemini con OpenClaw
    - È necessaria la chiave API o il flusso di autenticazione OAuth
summary: Configurazione di Google Gemini (chiave API + OAuth, generazione di immagini, comprensione dei media, TTS, ricerca web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-30T09:08:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: ea4b53dcea10fef67920da3baca4c85325ee4d4da780fbf708b67bc618e064a6
    source_path: providers/google.md
    workflow: 16
---

Il Plugin Google fornisce accesso ai modelli Gemini tramite Google AI Studio, oltre a
generazione di immagini, comprensione dei media (immagini/audio/video), text-to-speech e ricerca web tramite
Gemini Grounding.

- Provider: `google`
- Auth: `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- API: Google Gemini API
- Opzione runtime: `agents.defaults.agentRuntime.id: "google-gemini-cli"`
  riutilizza l'OAuth della Gemini CLI mantenendo i riferimenti ai modelli canonici come `google/*`.

## Primi passi

Scegli il metodo di autenticazione preferito e segui i passaggi di configurazione.

<Tabs>
  <Tab title="Chiave API">
    **Ideale per:** accesso standard alla Gemini API tramite Google AI Studio.

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
    **Ideale per:** riutilizzare un accesso Gemini CLI esistente tramite PKCE OAuth invece di una chiave API separata.

    <Warning>
    Il provider `google-gemini-cli` e un'integrazione non ufficiale. Alcuni utenti
    segnalano restrizioni dell'account quando usano OAuth in questo modo. Usalo a tuo rischio.
    </Warning>

    <Steps>
      <Step title="Installa la Gemini CLI">
        Il comando locale `gemini` deve essere disponibile in `PATH`.

        ```bash
        # Homebrew
        brew install gemini-cli

        # or npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw supporta sia le installazioni Homebrew sia le installazioni npm globali, inclusi
        i layout comuni di Windows/npm.
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

    L'id modello Gemini API di Gemini 3.1 Pro e `gemini-3.1-pro-preview`. OpenClaw accetta il piu breve `google/gemini-3.1-pro` come alias pratico e lo normalizza prima delle chiamate al provider.

    **Variabili di ambiente:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Oppure le varianti `GEMINI_CLI_*`.)

    <Note>
    Se le richieste OAuth della Gemini CLI non riescono dopo l'accesso, imposta `GOOGLE_CLOUD_PROJECT` o
    `GOOGLE_CLOUD_PROJECT_ID` sull'host del gateway e riprova.
    </Note>

    <Note>
    Se l'accesso non riesce prima dell'avvio del flusso nel browser, assicurati che il comando locale `gemini`
    sia installato e presente in `PATH`.
    </Note>

    I riferimenti ai modelli `google-gemini-cli/*` sono alias di compatibilita legacy. Le nuove
    configurazioni dovrebbero usare riferimenti ai modelli `google/*` piu il runtime `google-gemini-cli`
    quando vogliono l'esecuzione locale della Gemini CLI.

  </Tab>
</Tabs>

## Funzionalita

| Funzionalita           | Supportata                    |
| ---------------------- | ----------------------------- |
| Completamenti chat     | Si                            |
| Generazione immagini   | Si                            |
| Generazione musica     | Si                            |
| Text-to-speech         | Si                            |
| Voce in tempo reale    | Si (Google Live API)          |
| Comprensione immagini  | Si                            |
| Trascrizione audio     | Si                            |
| Comprensione video     | Si                            |
| Ricerca web (Grounding) | Si                           |
| Pensiero/ragionamento  | Si (Gemini 2.5+ / Gemini 3+)  |
| Modelli Gemma 4        | Si                            |

<Tip>
I modelli Gemini 3 usano `thinkingLevel` invece di `thinkingBudget`. OpenClaw mappa
i controlli di ragionamento degli alias Gemini 3, Gemini 3.1 e `gemini-*-latest` su
`thinkingLevel` in modo che le esecuzioni predefinite/a bassa latenza non inviino valori
`thinkingBudget` disabilitati.

`/think adaptive` mantiene la semantica di pensiero dinamico di Google invece di scegliere
un livello OpenClaw fisso. Gemini 3 e Gemini 3.1 omettono un `thinkingLevel` fisso cosi
Google puo scegliere il livello; Gemini 2.5 invia il sentinel dinamico di Google
`thinkingBudget: -1`.

I modelli Gemma 4 (per esempio `gemma-4-26b-a4b-it`) supportano la modalita pensiero. OpenClaw
riscrive `thinkingBudget` in un `thinkingLevel` Google supportato per Gemma 4.
Impostare il pensiero su `off` mantiene il pensiero disabilitato invece di mapparlo a
`MINIMAL`.
</Tip>

## Generazione immagini

Il provider di generazione immagini `google` incluso usa come valore predefinito
`google/gemini-3.1-flash-image-preview`.

- Supporta anche `google/gemini-3-pro-image-preview`
- Generazione: fino a 4 immagini per richiesta
- Modalita modifica: abilitata, fino a 5 immagini di input
- Controlli geometria: `size`, `aspectRatio` e `resolution`

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
Vedi [Generazione immagini](/it/tools/image-generation) per parametri condivisi dello strumento, selezione del provider e comportamento di failover.
</Note>

## Generazione video

Il Plugin `google` incluso registra anche la generazione video tramite lo strumento condiviso
`video_generate`.

- Modello video predefinito: `google/veo-3.1-fast-generate-preview`
- Modalita: flussi text-to-video, image-to-video e riferimento a video singolo
- Supporta `aspectRatio`, `resolution` e `audio`
- Limite durata attuale: **da 4 a 8 secondi**

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
Vedi [Generazione video](/it/tools/video-generation) per parametri condivisi dello strumento, selezione del provider e comportamento di failover.
</Note>

## Generazione musica

Il Plugin `google` incluso registra anche la generazione musicale tramite lo strumento condiviso
`music_generate`.

- Modello musicale predefinito: `google/lyria-3-clip-preview`
- Supporta anche `google/lyria-3-pro-preview`
- Controlli prompt: `lyrics` e `instrumental`
- Formato di output: `mp3` per impostazione predefinita, piu `wav` su `google/lyria-3-pro-preview`
- Input di riferimento: fino a 10 immagini
- Le esecuzioni basate su sessione si sganciano tramite il flusso condiviso task/stato, incluso `action: "status"`

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
Vedi [Generazione musica](/it/tools/music-generation) per parametri condivisi dello strumento, selezione del provider e comportamento di failover.
</Note>

## Text-to-speech

Il provider vocale `google` incluso usa il percorso TTS della Gemini API con
`gemini-3.1-flash-tts-preview`.

- Voce predefinita: `Kore`
- Auth: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- Output: WAV per allegati TTS regolari, Opus per destinazioni nota vocale, PCM per Talk/telefonia
- Output nota vocale: il PCM Google viene incapsulato come WAV e transcodificato in Opus a 48 kHz con `ffmpeg`

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
          voiceName: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS usa prompt in linguaggio naturale per il controllo dello stile. Imposta
`audioProfile` per anteporre un prompt di stile riutilizzabile al testo parlato. Imposta
`speakerName` quando il testo del prompt fa riferimento a un parlante con nome.

Gemini API TTS accetta anche tag audio espressivi tra parentesi quadre nel testo,
come `[whispers]` o `[laughs]`. Per tenere i tag fuori dalla risposta chat visibile
mentre li invii al TTS, inseriscili in un blocco `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Una chiave API di Google Cloud Console limitata alla Gemini API e valida per questo
provider. Questo non e il percorso separato della Cloud Text-to-Speech API.
</Note>

## Voce in tempo reale

Il Plugin `google` incluso registra un provider voce in tempo reale basato sulla
Gemini Live API per bridge audio backend come Voice Call e Google Meet.

| Impostazione          | Percorso configurazione                                            | Predefinito                                                                          |
| --------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Modello               | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| Voce                  | `...google.voice`                                                   | `Kore`                                                                                |
| Temperatura           | `...google.temperature`                                             | (non impostato)                                                                       |
| Sensibilita avvio VAD | `...google.startSensitivity`                                        | (non impostato)                                                                       |
| Sensibilita fine VAD  | `...google.endSensitivity`                                          | (non impostato)                                                                       |
| Durata silenzio       | `...google.silenceDurationMs`                                       | (non impostato)                                                                       |
| Gestione attivita     | `...google.activityHandling`                                        | Predefinito Google, `start-of-activity-interrupts`                                    |
| Copertura turno       | `...google.turnCoverage`                                            | Predefinito Google, `only-activity`                                                   |
| Disabilita VAD automatico | `...google.automaticActivityDetectionDisabled`                  | `false`                                                                               |
| Chiave API            | `...google.apiKey`                                                  | Ripiega su `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`      |

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
Google Live API usa audio bidirezionale e chiamata di funzioni tramite WebSocket.
OpenClaw adatta l'audio del bridge telefonia/Meet allo stream PCM Live API di Gemini e
mantiene le chiamate agli strumenti sul contratto vocale realtime condiviso. Lascia `temperature`
non impostato, a meno che non siano necessarie modifiche al sampling; OpenClaw omette i valori non positivi
perché Google Live può restituire trascrizioni senza audio per `temperature: 0`.
La trascrizione Gemini API è abilitata senza `languageCodes`; l'attuale Google
SDK rifiuta i suggerimenti di codice lingua in questo percorso API.
</Note>

<Note>
Control UI Talk supporta sessioni browser Google Live con token monouso vincolati.
Anche i provider vocali realtime solo backend possono essere eseguiti tramite il trasporto relay generico
del Gateway, che mantiene le credenziali del provider sul Gateway.
</Note>

Per la verifica live dei maintainer, esegui
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Il percorso Google crea la stessa forma di token Live API vincolato usata da Control
UI Talk, apre l'endpoint WebSocket del browser, invia il payload di setup iniziale
e attende `setupComplete`.

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Riutilizzo diretto della cache Gemini">
    Per le esecuzioni dirette di Gemini API (`api: "google-generative-ai"`), OpenClaw
    passa un handle `cachedContent` configurato alle richieste Gemini.

    - Configura i parametri per modello o globali con
      `cachedContent` oppure il legacy `cached_content`
    - Se sono presenti entrambi, `cachedContent` ha la precedenza
    - Valore di esempio: `cachedContents/prebuilt-context`
    - L'utilizzo degli hit della cache Gemini viene normalizzato in OpenClaw `cacheRead` da
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

  <Accordion title="Note sull'utilizzo JSON di Gemini CLI">
    Quando si usa il provider OAuth `google-gemini-cli`, OpenClaw normalizza
    l'output JSON della CLI come segue:

    - Il testo della risposta proviene dal campo `response` del JSON della CLI.
    - L'utilizzo ripiega su `stats` quando la CLI lascia `usage` vuoto.
    - `stats.cached` viene normalizzato in OpenClaw `cacheRead`.
    - Se `stats.input` manca, OpenClaw ricava i token di input da
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Configurazione dell'ambiente e del daemon">
    Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `GEMINI_API_KEY`
    sia disponibile per quel processo (per esempio, in `~/.openclaw/.env` o tramite
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta di provider, riferimenti dei modelli e comportamento di failover.
  </Card>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi degli strumenti per immagini e selezione del provider.
  </Card>
  <Card title="Generazione di video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi degli strumenti per video e selezione del provider.
  </Card>
  <Card title="Generazione di musica" href="/it/tools/music-generation" icon="music">
    Parametri condivisi degli strumenti per musica e selezione del provider.
  </Card>
</CardGroup>
