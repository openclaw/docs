---
read_when:
    - Vuoi usare i modelli Google Gemini con OpenClaw
    - Hai bisogno del flusso di autenticazione con chiave API o OAuth
summary: Configurazione di Google Gemini (chiave API + OAuth, generazione di immagini, comprensione dei media, ricerca web)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-05T14:01:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: fa3c4326e83fad277ae4c2cb9501b6e89457afcfa7e3e1d57ae01c9c0c6846e2
    source_path: providers/google.md
    workflow: 15
---

# Google (Gemini)

Il plugin Google fornisce accesso ai modelli Gemini tramite Google AI Studio, oltre a
generazione di immagini, comprensione dei media (immagini/audio/video) e ricerca web tramite
Gemini Grounding.

- Provider: `google`
- Auth: `GEMINI_API_KEY` o `GOOGLE_API_KEY`
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

Un provider alternativo `google-gemini-cli` usa PKCE OAuth invece di una chiave API.
Si tratta di un'integrazione non ufficiale; alcuni utenti segnalano
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

(O le varianti `GEMINI_CLI_*`.)

Se le richieste OAuth di Gemini CLI falliscono dopo il login, imposta
`GOOGLE_CLOUD_PROJECT` o `GOOGLE_CLOUD_PROJECT_ID` sull'host del gateway e
riprova.

Se il login fallisce prima dell'avvio del flusso nel browser, assicurati che il comando locale `gemini`
sia installato e presente in `PATH`. OpenClaw supporta sia le installazioni Homebrew
sia le installazioni npm globali, inclusi i layout comuni Windows/npm.

Note sull'utilizzo JSON di Gemini CLI:

- Il testo della risposta proviene dal campo JSON `response` della CLI.
- L'utilizzo usa `stats` come fallback quando la CLI lascia `usage` vuoto.
- `stats.cached` viene normalizzato in OpenClaw `cacheRead`.
- Se `stats.input` manca, OpenClaw ricava i token di input da
  `stats.input_tokens - stats.cached`.

## Capacità

| Capacità               | Supportato        |
| ---------------------- | ----------------- |
| Completamenti chat     | Sì                |
| Generazione di immagini | Sì               |
| Comprensione delle immagini | Sì           |
| Trascrizione audio     | Sì                |
| Comprensione video     | Sì                |
| Ricerca web (Grounding) | Sì               |
| Thinking/reasoning     | Sì (Gemini 3.1+)  |

## Riutilizzo diretto della cache Gemini

Per le esecuzioni dirette dell'API Gemini (`api: "google-generative-ai"`), OpenClaw ora
passa alle richieste Gemini un handle `cachedContent` configurato.

- Configura parametri per modello o globali usando
  `cachedContent` oppure il legacy `cached_content`
- Se entrambi sono presenti, `cachedContent` ha la precedenza
- Valore di esempio: `cachedContents/prebuilt-context`
- L'utilizzo dei cache hit di Gemini viene normalizzato in OpenClaw `cacheRead` da
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

Il provider di image generation `google` incluso usa come predefinito
`google/gemini-3.1-flash-image-preview`.

- Supporta anche `google/gemini-3-pro-image-preview`
- Generazione: fino a 4 immagini per richiesta
- Modalità modifica: abilitata, fino a 5 immagini di input
- Controlli geometrici: `size`, `aspectRatio` e `resolution`

Il provider `google-gemini-cli`, solo OAuth, è una superficie separata
di inferenza testuale. La generazione di immagini, la comprensione dei media e Gemini Grounding restano sul
provider id `google`.

## Nota sull'ambiente

Se il Gateway viene eseguito come daemon (launchd/systemd), assicurati che `GEMINI_API_KEY`
sia disponibile a quel processo (ad esempio in `~/.openclaw/.env` oppure tramite
`env.shellEnv`).
