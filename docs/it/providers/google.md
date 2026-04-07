---
read_when:
    - Vuoi usare i modelli Google Gemini con OpenClaw
    - Hai bisogno del flusso di autenticazione con chiave API o OAuth
summary: Configurazione Google Gemini (chiave API + OAuth, generazione di immagini, comprensione dei media, ricerca sul web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-07T08:16:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 36cc7c7d8d19f6d4a3fb223af36c8402364fc309d14ffe922bd004203ceb1754
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

Il plugin Google fornisce accesso ai modelli Gemini tramite Google AI Studio, oltre a
generazione di immagini, comprensione dei media (immagine/audio/video) e ricerca sul web tramite
Gemini Grounding.

- Provider: `google`
- Auth: `GEMINI_API_KEY` oppure `GOOGLE_API_KEY`
- API: Google Gemini API
- Provider alternativo: `google-gemini-cli` (OAuth)

## Guida rapida

1. Imposta la chiave API:

```bash
openclaw onboard --auth-choice gemini-api-key
```

2. Imposta un modello predefinito:

```json5
{
  agents: {
    defaults: {
      model: { primary: "google/gemini-3.1-pro-preview" },
    },
  },
}
```

## Esempio non interattivo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice gemini-api-key \
  --gemini-api-key "$GEMINI_API_KEY"
```

## OAuth (Gemini CLI)

Un provider alternativo `google-gemini-cli` usa OAuth PKCE invece di una chiave
API. Si tratta di un'integrazione non ufficiale; alcuni utenti segnalano
limitazioni dell'account. Usala a tuo rischio.

- Modello predefinito: `google-gemini-cli/gemini-3.1-pro-preview`
- Alias: `gemini-cli`
- Prerequisito di installazione: Gemini CLI locale disponibile come `gemini`
  - Homebrew: `brew install gemini-cli`
  - npm: `npm install -g @google/gemini-cli`
- Login:

```bash
openclaw models auth login --provider google-gemini-cli --set-default
```

Variabili d'ambiente:

- `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
- `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

(Oppure le varianti `GEMINI_CLI_*`.)

Se le richieste OAuth di Gemini CLI falliscono dopo il login, imposta
`GOOGLE_CLOUD_PROJECT` oppure `GOOGLE_CLOUD_PROJECT_ID` sull'host gateway e
riprova.

Se il login fallisce prima che inizi il flusso nel browser, assicurati che il comando locale `gemini`
sia installato e presente in `PATH`. OpenClaw supporta sia le installazioni Homebrew
sia le installazioni npm globali, inclusi i layout comuni Windows/npm.

Note sull'uso del JSON di Gemini CLI:

- Il testo della risposta proviene dal campo JSON `response` della CLI.
- L'utilizzo usa `stats` come fallback quando la CLI lascia vuoto `usage`.
- `stats.cached` viene normalizzato in `cacheRead` di OpenClaw.
- Se `stats.input` è mancante, OpenClaw ricava i token di input da
  `stats.input_tokens - stats.cached`.

## Capacità

| Capability             | Supported         |
| ---------------------- | ----------------- |
| Completamenti chat     | Sì                |
| Generazione di immagini| Sì                |
| Generazione musicale   | Sì                |
| Comprensione immagini  | Sì                |
| Trascrizione audio     | Sì                |
| Comprensione video     | Sì                |
| Ricerca web (Grounding)| Sì                |
| Thinking/reasoning     | Sì (Gemini 3.1+)  |

## Riutilizzo diretto della cache Gemini

Per le esecuzioni dirette dell'API Gemini (`api: "google-generative-ai"`), OpenClaw ora
passa un handle `cachedContent` configurato alle richieste Gemini.

- Configura parametri per modello o globali usando
  `cachedContent` oppure il legacy `cached_content`
- Se sono presenti entrambi, `cachedContent` ha la precedenza
- Valore di esempio: `cachedContents/prebuilt-context`
- L'utilizzo dei cache hit Gemini viene normalizzato in `cacheRead` di OpenClaw a partire da
  `cachedContentTokenCount` upstream

Esempio:

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

## Generazione di immagini

Il provider di generazione immagini `google` incluso usa per impostazione predefinita
`google/gemini-3.1-flash-image-preview`.

- Supporta anche `google/gemini-3-pro-image-preview`
- Generazione: fino a 4 immagini per richiesta
- Modalità modifica: abilitata, fino a 5 immagini di input
- Controlli geometrici: `size`, `aspectRatio` e `resolution`

Il provider solo OAuth `google-gemini-cli` è una superficie separata di
inferenza testuale. La generazione di immagini, la comprensione dei media e Gemini Grounding restano sul
provider id `google`.

Per usare Google come provider predefinito per le immagini:

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

Vedi [Image Generation](/it/tools/image-generation) per i parametri condivisi dello
strumento, la selezione del provider e il comportamento di failover.

## Generazione video

Il plugin `google` incluso registra anche la generazione video tramite lo
strumento condiviso `video_generate`.

- Modello video predefinito: `google/veo-3.1-fast-generate-preview`
- Modalità: text-to-video, image-to-video e flussi con riferimento a singolo video
- Supporta `aspectRatio`, `resolution` e `audio`
- Limite attuale della durata: **da 4 a 8 secondi**

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

Vedi [Video Generation](/it/tools/video-generation) per i parametri condivisi dello
strumento, la selezione del provider e il comportamento di failover.

## Generazione musicale

Il plugin `google` incluso registra anche la generazione musicale tramite lo
strumento condiviso `music_generate`.

- Modello musicale predefinito: `google/lyria-3-clip-preview`
- Supporta anche `google/lyria-3-pro-preview`
- Controlli del prompt: `lyrics` e `instrumental`
- Formato di output: `mp3` per impostazione predefinita, più `wav` su `google/lyria-3-pro-preview`
- Input di riferimento: fino a 10 immagini
- Le esecuzioni supportate da sessione vengono scollegate tramite il flusso condiviso attività/stato, incluso `action: "status"`

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

Vedi [Music Generation](/it/tools/music-generation) per i parametri condivisi dello
strumento, la selezione del provider e il comportamento di failover.

## Nota sull'ambiente

Se il Gateway viene eseguito come demone (launchd/systemd), assicurati che `GEMINI_API_KEY`
sia disponibile per quel processo (ad esempio in `~/.openclaw/.env` o tramite
`env.shellEnv`).
