---
read_when:
    - Vuoi usare i modelli Google Gemini con OpenClaw
    - Ti serve il flusso di autenticazione con API key o OAuth
summary: Configurazione di Google Gemini (API key + OAuth, generazione di immagini, comprensione dei media, TTS, web search)
title: Google (Gemini)
x-i18n:
    generated_at: "2026-04-24T08:56:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: b43d7171f56ecdfb49a25256783433e64f99a02760b3bc6f0e1055195f556f5d
    source_path: providers/google.md
    workflow: 15
---

Il Plugin Google fornisce accesso ai modelli Gemini tramite Google AI Studio, oltre a
generazione di immagini, comprensione dei media (immagine/audio/video), sintesi vocale e web search tramite
Gemini Grounding.

- Provider: `google`
- Auth: `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- API: Google Gemini API
- Provider alternativo: `google-gemini-cli` (OAuth)

## Per iniziare

Scegli il tuo metodo di autenticazione preferito e segui i passaggi di configurazione.

<Tabs>
  <Tab title="API key">
    **Ideale per:** accesso Gemini API standard tramite Google AI Studio.

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
    Le variabili d'ambiente `GEMINI_API_KEY` e `GOOGLE_API_KEY` sono entrambe accettate. Usa quella che hai già configurato.
    </Tip>

  </Tab>

  <Tab title="Gemini CLI (OAuth)">
    **Ideale per:** riusare un login Gemini CLI esistente tramite PKCE OAuth invece di una API key separata.

    <Warning>
    Il provider `google-gemini-cli` è un'integrazione non ufficiale. Alcuni utenti
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

        OpenClaw supporta sia installazioni Homebrew sia installazioni npm globali, inclusi
        i layout comuni Windows/npm.
      </Step>
      <Step title="Accedi tramite OAuth">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="Verifica che il modello sia disponibile">
        ```bash
        openclaw models list --provider google-gemini-cli
        ```
      </Step>
    </Steps>

    - Modello predefinito: `google-gemini-cli/gemini-3-flash-preview`
    - Alias: `gemini-cli`

    **Variabili d'ambiente:**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    (Oppure le varianti `GEMINI_CLI_*`.)

    <Note>
    Se le richieste OAuth Gemini CLI falliscono dopo l'accesso, imposta `GOOGLE_CLOUD_PROJECT` o
    `GOOGLE_CLOUD_PROJECT_ID` sull'host gateway e riprova.
    </Note>

    <Note>
    Se l'accesso fallisce prima dell'avvio del flusso nel browser, assicurati che il comando locale `gemini`
    sia installato e presente in `PATH`.
    </Note>

    Il provider `google-gemini-cli` solo OAuth è una superficie separata per l'inferenza testuale. La generazione di immagini, la comprensione dei media e Gemini Grounding restano sul
    provider con id `google`.

  </Tab>
</Tabs>

## Capability

| Capability             | Supportata                    |
| ---------------------- | ----------------------------- |
| Completamenti chat     | Sì                            |
| Generazione di immagini | Sì                           |
| Generazione musicale   | Sì                            |
| Sintesi vocale         | Sì                            |
| Comprensione delle immagini | Sì                       |
| Trascrizione audio     | Sì                            |
| Comprensione video     | Sì                            |
| Web search (Grounding) | Sì                           |
| Thinking/reasoning     | Sì (Gemini 2.5+ / Gemini 3+) |
| Modelli Gemma 4        | Sì                            |

<Tip>
I modelli Gemini 3 usano `thinkingLevel` invece di `thinkingBudget`. OpenClaw mappa
i controlli di reasoning di Gemini 3, Gemini 3.1 e degli alias `gemini-*-latest` a
`thinkingLevel` così le esecuzioni predefinite/a bassa latenza non inviano
valori `thinkingBudget` disabilitati.

I modelli Gemma 4 (ad esempio `gemma-4-26b-a4b-it`) supportano la modalità thinking. OpenClaw
riscrive `thinkingBudget` in un `thinkingLevel` Google supportato per Gemma 4.
Impostare thinking su `off` mantiene il thinking disabilitato invece di mapparlo a
`MINIMAL`.
</Tip>

## Generazione di immagini

Il provider integrato di generazione immagini `google` usa come predefinito
`google/gemini-3.1-flash-image-preview`.

- Supporta anche `google/gemini-3-pro-image-preview`
- Generate: fino a 4 immagini per richiesta
- Modalità edit: abilitata, fino a 5 immagini in ingresso
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
Vedi [Image Generation](/it/tools/image-generation) per parametri condivisi dello strumento, selezione del provider e comportamento di failover.
</Note>

## Generazione video

Il Plugin integrato `google` registra anche la generazione video tramite lo strumento condiviso
`video_generate`.

- Modello video predefinito: `google/veo-3.1-fast-generate-preview`
- Modalità: text-to-video, image-to-video e flussi reference a video singolo
- Supporta `aspectRatio`, `resolution` e `audio`
- Limite attuale di durata: **da 4 a 8 secondi**

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
Vedi [Video Generation](/it/tools/video-generation) per parametri condivisi dello strumento, selezione del provider e comportamento di failover.
</Note>

## Generazione musicale

Il Plugin integrato `google` registra anche la generazione musicale tramite lo strumento condiviso
`music_generate`.

- Modello musicale predefinito: `google/lyria-3-clip-preview`
- Supporta anche `google/lyria-3-pro-preview`
- Controlli del prompt: `lyrics` e `instrumental`
- Formato di output: `mp3` per impostazione predefinita, più `wav` su `google/lyria-3-pro-preview`
- Input di riferimento: fino a 10 immagini
- Le esecuzioni supportate da sessione si sganciano tramite il flusso condiviso task/status, incluso `action: "status"`

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
Vedi [Music Generation](/it/tools/music-generation) per parametri condivisi dello strumento, selezione del provider e comportamento di failover.
</Note>

## Sintesi vocale

Il provider vocale integrato `google` usa il percorso TTS della Gemini API con
`gemini-3.1-flash-tts-preview`.

- Voce predefinita: `Kore`
- Auth: `messages.tts.providers.google.apiKey`, `models.providers.google.apiKey`, `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- Output: WAV per allegati TTS normali, PCM per Talk/telefonia
- Output nativo come nota vocale: non supportato su questo percorso Gemini API perché la API restituisce PCM invece di Opus

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
        },
      },
    },
  },
}
```

La Gemini API TTS accetta tag audio espressivi tra parentesi quadre nel testo, come
`[whispers]` o `[laughs]`. Per tenere i tag fuori dalla risposta chat visibile ma
inviarli al TTS, inseriscili in un blocco `[[tts:text]]...[[/tts:text]]`:

```text
Qui c'è il testo pulito della risposta.

[[tts:text]][whispers] Qui c'è la versione parlata.[[/tts:text]]
```

<Note>
Una API key di Google Cloud Console limitata alla Gemini API è valida per questo
provider. Non è il percorso separato della Cloud Text-to-Speech API.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Riuso diretto della cache Gemini">
    Per esecuzioni Gemini API dirette (`api: "google-generative-ai"`), OpenClaw
    passa un handle `cachedContent` configurato direttamente alle richieste Gemini.

    - Configura parametri per modello o globali con
      `cachedContent` o il legacy `cached_content`
    - Se sono presenti entrambi, prevale `cachedContent`
    - Valore di esempio: `cachedContents/prebuilt-context`
    - L'utilizzo dei cache-hit Gemini viene normalizzato in `cacheRead` OpenClaw da
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

  <Accordion title="Note di utilizzo JSON Gemini CLI">
    Quando usi il provider OAuth `google-gemini-cli`, OpenClaw normalizza
    l'output JSON della CLI come segue:

    - Il testo della risposta proviene dal campo JSON `response` della CLI.
    - L'utilizzo usa come fallback `stats` quando la CLI lascia `usage` vuoto.
    - `stats.cached` viene normalizzato in `cacheRead` OpenClaw.
    - Se `stats.input` manca, OpenClaw ricava i token in ingresso da
      `stats.input_tokens - stats.cached`.

  </Accordion>

  <Accordion title="Ambiente e configurazione del demone">
    Se il Gateway viene eseguito come demone (launchd/systemd), assicurati che `GEMINI_API_KEY`
    sia disponibile per quel processo (ad esempio in `~/.openclaw/.env` o tramite
    `env.shellEnv`).
  </Accordion>
</AccordionGroup>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti del modello e comportamento di failover.
  </Card>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento immagine e selezione del provider.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="Generazione musicale" href="/it/tools/music-generation" icon="music">
    Parametri condivisi dello strumento musicale e selezione del provider.
  </Card>
</CardGroup>
