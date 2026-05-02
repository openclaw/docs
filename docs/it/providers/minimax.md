---
read_when:
    - Vuoi usare i modelli MiniMax in OpenClaw
    - Hai bisogno della guida alla configurazione di MiniMax
summary: Usare i modelli MiniMax in OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-05-02T08:32:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7c7aea4d9656d6ffddab7c43b06940e58bdd119a03b62000e689a3348f7df5a2
    source_path: providers/minimax.md
    workflow: 16
---

OpenClaw's MiniMax provider defaults to **MiniMax M2.7**.

MiniMax also provides:

- Bundled speech synthesis via T2A v2
- Bundled image understanding via `MiniMax-VL-01`
- Bundled music generation via `music-2.6`
- Bundled `web_search` through the MiniMax Token Plan search API

Provider split:

| Provider ID      | Auth    | Capabilities                                                                                        |
| ---------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `minimax`        | API key | Text, image generation, music generation, video generation, image understanding, speech, web search |
| `minimax-portal` | OAuth   | Text, image generation, music generation, video generation, image understanding, speech             |

## Built-in catalog

| Model                    | Type             | Description                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | Chat (reasoning) | Default hosted reasoning model           |
| `MiniMax-M2.7-highspeed` | Chat (reasoning) | Faster M2.7 reasoning tier               |
| `MiniMax-VL-01`          | Vision           | Image understanding model                |
| `image-01`               | Image generation | Text-to-image and image-to-image editing |
| `music-2.6`              | Music generation | Default music model                      |
| `music-2.5`              | Music generation | Previous music generation tier           |
| `music-2.0`              | Music generation | Legacy music generation tier             |
| `MiniMax-Hailuo-2.3`     | Video generation | Text-to-video and image reference flows  |

## Getting started

Choose your preferred auth method and follow the setup steps.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Best for:** quick setup with MiniMax Coding Plan via OAuth, no API key required.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            This authenticates against `api.minimax.io`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            This authenticates against `api.minimaxi.com`.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuth setups use the `minimax-portal` provider id. Model refs follow the form `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Referral link for MiniMax Coding Plan (10% off): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Best for:** hosted MiniMax with Anthropic-compatible API.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            This configures `api.minimax.io` as the base URL.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="China">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            This configures `api.minimaxi.com` as the base URL.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Config example

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    On the Anthropic-compatible streaming path, OpenClaw disables MiniMax thinking by default unless you explicitly set `thinking` yourself. MiniMax's streaming endpoint emits `reasoning_content` in OpenAI-style delta chunks instead of native Anthropic thinking blocks, which can leak internal reasoning into visible output if left enabled implicitly.
    </Warning>

    <Note>
    API-key setups use the `minimax` provider id. Model refs follow the form `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Configure via `openclaw configure`

Use the interactive config wizard to set MiniMax without editing JSON:

<Steps>
  <Step title="Avvia la procedura guidata">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Seleziona Modello/autenticazione">
    Scegli **Modello/autenticazione** dal menu.
  </Step>
  <Step title="Scegli un'opzione di autenticazione MiniMax">
    Seleziona una delle opzioni MiniMax disponibili:

    | Scelta autenticazione | Descrizione |
    | --- | --- |
    | `minimax-global-oauth` | OAuth internazionale (Coding Plan) |
    | `minimax-cn-oauth` | OAuth Cina (Coding Plan) |
    | `minimax-global-api` | Chiave API internazionale |
    | `minimax-cn-api` | Chiave API Cina |

  </Step>
  <Step title="Scegli il modello predefinito">
    Seleziona il modello predefinito quando richiesto.
  </Step>
</Steps>

## Funzionalità

### Generazione di immagini

Il Plugin MiniMax registra il modello `image-01` per lo strumento `image_generate`. Supporta:

- **Generazione da testo a immagine** con controllo delle proporzioni
- **Modifica da immagine a immagine** (riferimento del soggetto) con controllo delle proporzioni
- Fino a **9 immagini di output** per richiesta
- Fino a **1 immagine di riferimento** per richiesta di modifica
- Proporzioni supportate: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

Per usare MiniMax per la generazione di immagini, impostalo come provider di generazione immagini:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

Il Plugin usa la stessa autenticazione `MINIMAX_API_KEY` o OAuth dei modelli di testo. Non è necessaria alcuna configurazione aggiuntiva se MiniMax è già configurato.

Sia `minimax` sia `minimax-portal` registrano `image_generate` con lo stesso
modello `image-01`. Le configurazioni con chiave API usano `MINIMAX_API_KEY`; le configurazioni OAuth possono usare
invece il percorso di autenticazione `minimax-portal` incluso.

La generazione di immagini usa sempre l'endpoint immagine dedicato di MiniMax
(`/v1/image_generation`) e ignora `models.providers.minimax.baseUrl`,
poiché quel campo configura l'URL di base compatibile con chat/Anthropic. Imposta
`MINIMAX_API_HOST=https://api.minimaxi.com` per instradare la generazione di immagini
attraverso l'endpoint CN; l'endpoint globale predefinito è
`https://api.minimax.io`.

Quando l'onboarding o la configurazione con chiave API scrive voci esplicite
`models.providers.minimax`, OpenClaw materializza `MiniMax-M2.7` e
`MiniMax-M2.7-highspeed` come modelli chat solo testo. La comprensione delle immagini è
esposta separatamente tramite il provider multimediale `MiniMax-VL-01` di proprietà del Plugin.

<Note>
Vedi [Generazione di immagini](/it/tools/image-generation) per parametri condivisi dello strumento, selezione del provider e comportamento di failover.
</Note>

### Sintesi vocale

Il Plugin `minimax` incluso registra MiniMax T2A v2 come provider vocale per
`messages.tts`.

- Modello TTS predefinito: `speech-2.8-hd`
- Voce predefinita: `English_expressive_narrator`
- Gli ID modello inclusi supportati comprendono `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` e `speech-01-turbo`.
- La risoluzione dell'autenticazione è `messages.tts.providers.minimax.apiKey`, poi
  i profili di autenticazione OAuth/token `minimax-portal`, poi le chiavi ambiente
  Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), poi `MINIMAX_API_KEY`.
- Se non è configurato alcun host TTS, OpenClaw riusa l'host OAuth
  `minimax-portal` configurato e rimuove i suffissi di percorso compatibili con Anthropic,
  come `/anthropic`.
- Gli allegati audio normali restano MP3.
- Le destinazioni per note vocali come Feishu e Telegram vengono transcodificate da MP3
  MiniMax a Opus 48 kHz con `ffmpeg`, perché l'API file di Feishu/Lark accetta solo
  `file_type: "opus"` per i messaggi audio nativi.
- MiniMax T2A accetta `speed` e `vol` frazionari, ma `pitch` viene inviato come
  intero; OpenClaw tronca i valori frazionari di `pitch` prima della richiesta API.

| Impostazione                            | Variabile env          | Predefinito                   | Descrizione                    |
| ---------------------------------------- | ---------------------- | ----------------------------- | ------------------------------ |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Host API MiniMax T2A.          |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | ID modello TTS.                |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | ID voce usato per l'output vocale. |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Velocità di riproduzione, `0.5..2.0`. |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Volume, `(0, 10]`.             |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Variazione intera dell'intonazione, `-12..12`. |

### Generazione di musica

Il Plugin MiniMax incluso registra la generazione di musica tramite lo strumento condiviso
`music_generate` sia per `minimax` sia per `minimax-portal`.

- Modello musicale predefinito: `minimax/music-2.6`
- Modello musicale OAuth: `minimax-portal/music-2.6`
- Supporta anche `minimax/music-2.5` e `minimax/music-2.0`
- Controlli del prompt: `lyrics`, `instrumental`, `durationSeconds`
- Formato di output: `mp3`
- Le esecuzioni basate su sessione si scollegano tramite il flusso condiviso di attività/stato, incluso `action: "status"`

Per usare MiniMax come provider musicale predefinito:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.6",
      },
    },
  },
}
```

<Note>
Vedi [Generazione di musica](/it/tools/music-generation) per parametri condivisi dello strumento, selezione del provider e comportamento di failover.
</Note>

### Generazione di video

Il Plugin MiniMax incluso registra la generazione di video tramite lo strumento condiviso
`video_generate` sia per `minimax` sia per `minimax-portal`.

- Modello video predefinito: `minimax/MiniMax-Hailuo-2.3`
- Modello video OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- Modalità: flussi da testo a video e con riferimento da singola immagine
- Supporta `aspectRatio` e `resolution`

Per usare MiniMax come provider video predefinito:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
Consulta [Generazione video](/it/tools/video-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di trasferimento in caso di errore.
</Note>

### Comprensione delle immagini

Il Plugin MiniMax registra la comprensione delle immagini separatamente dal catalogo
di testo:

| ID provider      | Modello immagine predefinito |
| ---------------- | ---------------------------- |
| `minimax`        | `MiniMax-VL-01`              |
| `minimax-portal` | `MiniMax-VL-01`              |

Per questo il routing automatico dei media può usare la comprensione delle immagini di MiniMax anche
quando il catalogo del provider di testo incluso mostra ancora riferimenti chat M2.7 solo testo.

### Ricerca web

Il Plugin MiniMax registra anche `web_search` tramite l'API di ricerca MiniMax Token Plan.

- ID provider: `minimax`
- Risultati strutturati: titoli, URL, estratti, query correlate
- Variabile env preferita: `MINIMAX_CODE_PLAN_KEY`
- Alias env accettati: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Ripiego di compatibilità: `MINIMAX_API_KEY` quando punta già a una credenziale token-plan
- Riuso della regione: `plugins.entries.minimax.config.webSearch.region`, poi `MINIMAX_API_HOST`, poi gli URL di base del provider MiniMax
- La ricerca resta sull'ID provider `minimax`; la configurazione OAuth CN/globale può indirizzare indirettamente la regione tramite `models.providers.minimax-portal.baseUrl` e può fornire l'autenticazione bearer tramite `MINIMAX_OAUTH_TOKEN`

La configurazione si trova sotto `plugins.entries.minimax.config.webSearch.*`.

<Note>
Consulta [Ricerca MiniMax](/it/tools/minimax-search) per la configurazione e l'uso completi della ricerca web.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Opzioni di configurazione">
    | Opzione | Descrizione |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Preferisci `https://api.minimax.io/anthropic` (compatibile con Anthropic); `https://api.minimax.io/v1` è facoltativo per payload compatibili con OpenAI |
    | `models.providers.minimax.api` | Preferisci `anthropic-messages`; `openai-completions` è facoltativo per payload compatibili con OpenAI |
    | `models.providers.minimax.apiKey` | Chiave API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Definisci `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Assegna alias ai modelli che vuoi nell'elenco consentito |
    | `models.mode` | Mantieni `merge` se vuoi aggiungere MiniMax insieme a quelli integrati |
  </Accordion>

  <Accordion title="Impostazioni predefinite di ragionamento">
    Con `api: "anthropic-messages"`, OpenClaw inserisce `thinking: { type: "disabled" }` a meno che il ragionamento non sia già impostato esplicitamente in parametri/configurazione.

    Questo impedisce all'endpoint di streaming di MiniMax di emettere `reasoning_content` in chunk delta in stile OpenAI, che esporrebbero il ragionamento interno nell'output visibile.

  </Accordion>

  <Accordion title="Modalità veloce">
    `/fast on` o `params.fastMode: true` riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed` nel percorso stream compatibile con Anthropic.
  </Accordion>

  <Accordion title="Esempio di ripiego">
    **Ideale per:** mantenere come primario il tuo modello di ultima generazione più potente e passare a MiniMax M2.7 in caso di errore. L'esempio sotto usa Opus come primario concreto; sostituiscilo con il tuo modello primario di ultima generazione preferito.

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Dettagli d'uso del Coding Plan">
    - API di utilizzo del Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` o `https://api.minimax.io/v1/token_plan/remains` (richiede una chiave del piano di programmazione).
    - Il sondaggio dell'utilizzo ricava l'host da `models.providers.minimax-portal.baseUrl` o `models.providers.minimax.baseUrl` quando configurato, quindi le configurazioni globali che usano `https://api.minimax.io/anthropic` interrogano `api.minimax.io`. URL di base mancanti o malformati mantengono il ripiego CN per compatibilità.
    - OpenClaw normalizza l'utilizzo del piano di programmazione MiniMax nella stessa visualizzazione `% rimanente` usata dagli altri provider. I campi grezzi `usage_percent` / `usagePercent` di MiniMax indicano la quota rimanente, non quella consumata, quindi OpenClaw li inverte. I campi basati sul conteggio prevalgono quando presenti.
    - Quando l'API restituisce `model_remains`, OpenClaw preferisce la voce del modello chat, ricava l'etichetta della finestra da `start_time` / `end_time` quando necessario e include il nome del modello selezionato nell'etichetta del piano, così le finestre del piano di programmazione sono più facili da distinguere.
    - Gli snapshot di utilizzo trattano `minimax`, `minimax-cn` e `minimax-portal` come la stessa superficie di quota MiniMax e preferiscono l'OAuth MiniMax memorizzato prima di ripiegare sulle variabili env della chiave Coding Plan.

  </Accordion>
</AccordionGroup>

## Note

- I riferimenti modello seguono il percorso di autenticazione:
  - Configurazione con chiave API: `minimax/<model>`
  - Configurazione OAuth: `minimax-portal/<model>`
- Modello chat predefinito: `MiniMax-M2.7`
- Modello chat alternativo: `MiniMax-M2.7-highspeed`
- L'onboarding e la configurazione diretta con chiave API scrivono definizioni di modelli solo testo per entrambe le varianti M2.7
- La comprensione delle immagini usa il provider media `MiniMax-VL-01` di proprietà del Plugin
- Aggiorna i valori dei prezzi in `models.json` se hai bisogno di un tracciamento esatto dei costi
- Usa `openclaw models list` per confermare l'ID provider corrente, poi passa a un altro modello con `openclaw models set minimax/MiniMax-M2.7` o `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Link referral per MiniMax Coding Plan (10% di sconto): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Consulta [Provider dei modelli](/it/concepts/model-providers) per le regole dei provider.
</Note>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title='"Modello sconosciuto: minimax/MiniMax-M2.7"'>
    Di solito significa che il **provider MiniMax non è configurato** (nessuna voce provider corrispondente e nessun profilo di autenticazione/chiave env MiniMax trovato). Una correzione per questo rilevamento è in **2026.1.12**. Risolvi così:

    - Aggiorna a **2026.1.12** (o esegui dal sorgente `main`), poi riavvia il Gateway.
    - Esegui `openclaw configure` e seleziona un'opzione di autenticazione **MiniMax**, oppure
    - Aggiungi manualmente il blocco `models.providers.minimax` o `models.providers.minimax-portal` corrispondente, oppure
    - Imposta `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` o un profilo di autenticazione MiniMax così il provider corrispondente può essere inserito.

    Assicurati che l'ID modello distingua tra maiuscole e minuscole:

    - Percorso con chiave API: `minimax/MiniMax-M2.7` o `minimax/MiniMax-M2.7-highspeed`
    - Percorso OAuth: `minimax-portal/MiniMax-M2.7` o `minimax-portal/MiniMax-M2.7-highspeed`

    Poi ricontrolla con:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Altra assistenza: [Risoluzione dei problemi](/it/help/troubleshooting) e [FAQ](/it/help/faq).
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti modello e comportamento di trasferimento in caso di errore.
  </Card>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento immagini e selezione del provider.
  </Card>
  <Card title="Generazione musicale" href="/it/tools/music-generation" icon="music">
    Parametri condivisi dello strumento musica e selezione del provider.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="Ricerca MiniMax" href="/it/tools/minimax-search" icon="magnifying-glass">
    Configurazione della ricerca web tramite MiniMax Token Plan.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Risoluzione generale dei problemi e FAQ.
  </Card>
</CardGroup>
