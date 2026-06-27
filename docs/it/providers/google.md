---
read_when:
    - Vuoi usare i modelli Google Gemini con OpenClaw
    - Hai bisogno della chiave API o del flusso di autenticazione OAuth
summary: Configurazione di Google Gemini (chiave API + OAuth, generazione di immagini, comprensione dei media, TTS, ricerca web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-06-27T18:07:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eced20b11cc702d803992d96dcc5edb8f06640f6baffbc65dab504a6c91776bc
    source_path: providers/google.md
    workflow: 16
---

Il Plugin Google fornisce accesso ai modelli Gemini tramite Google AI Studio, oltre a
generazione di immagini, comprensione dei contenuti multimediali (immagine/audio/video), sintesi vocale e ricerca web tramite
Gemini Grounding.

- Fornitore: `google`
- Autenticazione: `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- API: Google Gemini API
- Opzione runtime: provider/model `agentRuntime.id: "google-gemini-cli"`
  riutilizza OAuth di Gemini CLI mantenendo canonici i riferimenti ai modelli come `google/*`.

## Per iniziare

Scegli il metodo di autenticazione preferito e segui i passaggi di configurazione.

<Tabs>
  <Tab title="API key">
    **Ideale per:** accesso standard a Gemini API tramite Google AI Studio.

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
    Le variabili d'ambiente `GEMINI_API_KEY` e `GOOGLE_API_KEY` sono entrambe accettate. Usa quella che hai gia configurato.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Ideale per:** riutilizzare un accesso Gemini CLI esistente tramite OAuth PKCE invece di una chiave API separata.

    <Warning>
    Il provider `google-gemini-cli` e un'integrazione non ufficiale. Alcuni utenti
    segnalano restrizioni sugli account quando usano OAuth in questo modo. Usalo a tuo rischio.
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
        i layout comuni di Windows/npm.
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

    L'id modello Gemini API di Gemini 3.1 Pro e `gemini-3.1-pro-preview`. OpenClaw accetta il piu breve `google/gemini-3.1-pro` come alias di comodita e lo normalizza prima delle chiamate al provider.

    **Variabili d'ambiente:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Oppure le varianti `GEMINI_CLI_*`.)

    <Note>
    Se le richieste OAuth di Gemini CLI non riescono dopo l'accesso, imposta `GOOGLE_CLOUD_PROJECT` o
    `GOOGLE_CLOUD_PROJECT_ID` sull'host del gateway e riprova.
    </Note>

    <Note>
    Se l'accesso non riesce prima dell'avvio del flusso del browser, assicurati che il comando locale `gemini`
    sia installato e in `PATH`.
    </Note>

    I riferimenti modello `google-gemini-cli/*` sono alias di compatibilita legacy. Le nuove
    configurazioni devono usare riferimenti modello `google/*` piu il runtime `google-gemini-cli`
    quando vogliono l'esecuzione locale di Gemini CLI.

  </Tab>
</Tabs>

## Capacita

| Capacita               | Supportata                    |
| ---------------------- | ----------------------------- |
| Completamenti chat     | Si                            |
| Generazione immagini   | Si                            |
| Generazione musica     | Si                            |
| Sintesi vocale         | Si                            |
| Voce in tempo reale    | Si (Google Live API)          |
| Comprensione immagini  | Si                            |
| Trascrizione audio     | Si                            |
| Comprensione video     | Si                            |
| Ricerca web (Grounding) | Si                           |
| Pensiero/ragionamento  | Si (Gemini 2.5+ / Gemini 3+)  |
| Modelli Gemma 4        | Si                            |

## Ricerca web

Il provider di ricerca web `gemini` incluso usa il grounding di Gemini Google Search.
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

La precedenza delle credenziali e `webSearch.apiKey` dedicata, poi `GEMINI_API_KEY`,
poi `models.providers.google.apiKey`. `webSearch.baseUrl` e facoltativo ed
esiste per proxy operatore o endpoint Gemini API compatibili; quando viene omesso,
la ricerca web Gemini riutilizza `models.providers.google.baseUrl`. Vedi
[Ricerca Gemini](/it/tools/gemini-search) per il comportamento dello strumento specifico del provider.

<Tip>
I modelli Gemini 3 usano `thinkingLevel` anziche `thinkingBudget`. OpenClaw mappa
i controlli di ragionamento degli alias Gemini 3, Gemini 3.1 e `gemini-*-latest` su
`thinkingLevel`, cosi le esecuzioni predefinite/a bassa latenza non inviano valori
`thinkingBudget` disabilitati.

`/think adaptive` mantiene la semantica di pensiero dinamico di Google invece di scegliere
un livello OpenClaw fisso. Gemini 3 e Gemini 3.1 omettono un `thinkingLevel` fisso cosi
Google puo scegliere il livello; Gemini 2.5 invia il sentinella dinamico di Google
`thinkingBudget: -1`.

I modelli Gemma 4 (per esempio `gemma-4-26b-a4b-it`) supportano la modalita di pensiero. OpenClaw
riscrive `thinkingBudget` in un `thinkingLevel` Google supportato per Gemma 4.
Impostare il pensiero su `off` mantiene il pensiero disabilitato invece di mapparlo su
`MINIMAL`.
</Tip>

## Generazione immagini

Il provider di generazione immagini `google` incluso usa per impostazione predefinita
`google/gemini-3.1-flash-image-preview`.

- Supporta anche `google/gemini-3-pro-image-preview`
- Generazione: fino a 4 immagini per richiesta
- Modalita modifica: abilitata, fino a 5 immagini di input
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
Vedi [Generazione immagini](/it/tools/image-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

## Generazione video

Il Plugin `google` incluso registra anche la generazione video tramite lo strumento condiviso
`video_generate`.

- Modello video predefinito: `google/veo-3.1-fast-generate-preview`
- Modalita: flussi testo-a-video, immagine-a-video e riferimento a video singolo
- Supporta `aspectRatio` (`16:9`, `9:16`) e `resolution` (`720P`, `1080P`); l'output audio non e supportato da Veo oggi
- Durate supportate: **4, 6 o 8 secondi** (gli altri valori vengono arrotondati al valore consentito piu vicino)

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
Vedi [Generazione video](/it/tools/video-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

## Generazione musica

Il Plugin `google` incluso registra anche la generazione musica tramite lo strumento condiviso
`music_generate`.

- Modello musicale predefinito: `google/lyria-3-clip-preview`
- Supporta anche `google/lyria-3-pro-preview`
- Controlli prompt: `lyrics` e `instrumental`
- Formato di output: `mp3` per impostazione predefinita, piu `wav` su `google/lyria-3-pro-preview`
- Input di riferimento: fino a 10 immagini
- Le esecuzioni basate su sessione si distaccano tramite il flusso condiviso task/stato, incluso `action: "status"`

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
Vedi [Generazione musica](/it/tools/music-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

## Sintesi vocale

Il provider vocale `google` incluso usa il percorso TTS di Gemini API con
`gemini-3.1-flash-tts-preview`.

- Voce predefinita: `Kore`
- Autenticazione: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- Output: WAV per allegati TTS regolari, Opus per destinazioni con note vocali, PCM per Talk/telefonia
- Output note vocali: PCM di Google viene avvolto come WAV e transcodificato in Opus a 48 kHz con `ffmpeg`

Il percorso TTS batch Gemini di Google restituisce l'audio generato nella risposta
`generateContent` completata. Per conversazioni parlate con la latenza piu bassa, usa il
provider voce in tempo reale di Google basato su Gemini Live API invece del TTS batch.

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

Gemini API TTS usa prompt in linguaggio naturale per il controllo dello stile. Imposta
`audioProfile` per anteporre un prompt di stile riutilizzabile prima del testo parlato. Imposta
`speakerName` quando il testo del prompt fa riferimento a un parlante nominato.

Gemini API TTS accetta anche tag audio espressivi tra parentesi quadre nel testo,
come `[whispers]` o `[laughs]`. Per tenere i tag fuori dalla risposta chat visibile
mentre li invii al TTS, mettili dentro un blocco `[[tts:text]]...[[/tts:text]]`:

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
Una chiave API di Google Cloud Console limitata a Gemini API e valida per questo
provider. Questo non e il percorso separato Cloud Text-to-Speech API.
</Note>

## Voce in tempo reale

Il Plugin `google` incluso registra un provider voce in tempo reale basato su
Gemini Live API per bridge audio backend come Voice Call e Google Meet.

| Impostazione                  | Percorso di configurazione                                          | Predefinito                                                                          |
| ----------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Modello                       | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                      |
| Voce                          | `...google.voice`                                                   | `Kore`                                                                               |
| Temperatura                   | `...google.temperature`                                             | (non impostato)                                                                      |
| Sensibilità di avvio VAD      | `...google.startSensitivity`                                        | (non impostato)                                                                      |
| Sensibilità di fine VAD       | `...google.endSensitivity`                                          | (non impostato)                                                                      |
| Durata del silenzio           | `...google.silenceDurationMs`                                       | (non impostato)                                                                      |
| Gestione attività             | `...google.activityHandling`                                        | Predefinito Google, `start-of-activity-interrupts`                                   |
| Copertura del turno           | `...google.turnCoverage`                                            | Predefinito Google, `only-activity`                                                  |
| Disabilita VAD automatico     | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                              |
| Ripresa della sessione        | `...google.sessionResumption`                                       | `true`                                                                               |
| Compressione del contesto     | `...google.contextWindowCompression`                                | `true`                                                                               |
| Chiave API                    | `...google.apiKey`                                                  | Ripiega su `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`     |

Esempio di configurazione realtime di Voice Call:

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
                speakerVoice: "Kore",
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
Google Live API usa audio bidirezionale e chiamata di funzioni tramite un WebSocket.
OpenClaw adatta l'audio del bridge telefonia/Meet allo stream PCM Live API di Gemini e
mantiene le chiamate agli strumenti sul contratto vocale realtime condiviso. Lascia `temperature`
non impostato, a meno che tu non debba modificare il campionamento; OpenClaw omette i valori non positivi
perché Google Live può restituire trascrizioni senza audio per `temperature: 0`.
La trascrizione Gemini API è abilitata senza `languageCodes`; l'attuale Google
SDK rifiuta i suggerimenti sui codici lingua in questo percorso API.
</Note>

<Note>
Control UI Talk supporta sessioni browser Google Live con token vincolati monouso.
I provider vocali realtime solo backend possono anche essere eseguiti tramite il trasporto relay
generico del Gateway, che mantiene le credenziali del provider sul Gateway.
</Note>

Per la verifica live dei maintainer, esegui
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`.
Lo smoke copre anche i percorsi backend/WebRTC di OpenAI; la parte Google genera la stessa
forma di token Live API vincolato usata da Control UI Talk, apre l'endpoint
WebSocket del browser, invia il payload di configurazione iniziale e attende
`setupComplete`.

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Direct Gemini cache reuse">
    Per esecuzioni dirette di Gemini API (`api: "google-generative-ai"`), OpenClaw
    passa un handle `cachedContent` configurato alle richieste Gemini.

    - Configura i parametri per modello o globali con
      `cachedContent` oppure con il legacy `cached_content`
    - Se sono presenti entrambi, prevale `cachedContent`
    - Valore di esempio: `cachedContents/prebuilt-context`
    - L'utilizzo degli hit della cache Gemini viene normalizzato in `cacheRead` di OpenClaw da
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

  <Accordion title="Gemini CLI usage notes">
    Quando si usa il provider OAuth `google-gemini-cli`, OpenClaw usa per impostazione predefinita
    l'output `stream-json` della CLI Gemini e normalizza l'utilizzo dal payload finale
    `stats`. Gli override legacy `--output-format json` usano ancora il
    parser JSON.

    - Il testo della risposta in streaming proviene dagli eventi `message` dell'assistente.
    - Per l'output JSON legacy, il testo della risposta proviene dal campo `response` del JSON della CLI.
    - L'utilizzo ripiega su `stats` quando la CLI lascia `usage` vuoto.
    - `stats.cached` viene normalizzato in `cacheRead` di OpenClaw.
    - Se `stats.input` manca, OpenClaw deriva i token di input da
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Environment and daemon setup">
    Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `GEMINI_API_KEY`
    sia disponibile per quel processo (ad esempio in `~/.openclaw/.env` o tramite
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
