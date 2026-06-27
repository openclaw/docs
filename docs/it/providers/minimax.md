---
read_when:
    - Vuoi usare i modelli MiniMax in OpenClaw
    - Ti serve una guida alla configurazione di MiniMax
summary: Usare i modelli MiniMax in OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-06-27T18:08:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 37fe606178d7d15383e56c026b02ba7be751ead706adc097c776c0a6a92aa2a2
    source_path: providers/minimax.md
    workflow: 16
---

OpenClaw usa **MiniMax M3** come predefinito per il provider MiniMax.

MiniMax fornisce anche:

- Sintesi vocale integrata tramite T2A v2
- Comprensione delle immagini integrata tramite `MiniMax-VL-01`
- Generazione musicale integrata tramite `music-2.6`
- `web_search` integrato tramite l'API di ricerca MiniMax Token Plan

Suddivisione dei provider:

| ID provider      | Autenticazione | Funzionalità                                                                                              |
| ---------------- | -------------- | --------------------------------------------------------------------------------------------------------- |
| `minimax`        | Chiave API     | Testo, generazione di immagini, generazione musicale, generazione video, comprensione delle immagini, voce, ricerca web |
| `minimax-portal` | OAuth          | Testo, generazione di immagini, generazione musicale, generazione video, comprensione delle immagini, voce |

## Catalogo integrato

| Modello                  | Tipo                  | Descrizione                                |
| ------------------------ | --------------------- | ------------------------------------------ |
| `MiniMax-M3`             | Chat (ragionamento)   | Modello di ragionamento ospitato predefinito |
| `MiniMax-M2.7`           | Chat (ragionamento)   | Modello di ragionamento ospitato precedente |
| `MiniMax-M2.7-highspeed` | Chat (ragionamento)   | Livello di ragionamento M2.7 più veloce    |
| `MiniMax-VL-01`          | Visione               | Modello di comprensione delle immagini     |
| `image-01`               | Generazione immagini  | Modifica testo-immagine e immagine-immagine |
| `music-2.6`              | Generazione musicale  | Modello musicale predefinito               |
| `music-2.5`              | Generazione musicale  | Livello precedente di generazione musicale |
| `music-2.0`              | Generazione musicale  | Livello legacy di generazione musicale     |
| `MiniMax-Hailuo-2.3`     | Generazione video     | Flussi testo-video e con riferimento immagine |

## Per iniziare

Scegli il metodo di autenticazione preferito e segui i passaggi di configurazione.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Ideale per:** configurazione rapida con MiniMax Coding Plan tramite OAuth, senza chiave API richiesta.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Questo autentica verso `api.minimax.io`.
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

            Questo autentica verso `api.minimaxi.com`.
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
    Le configurazioni OAuth usano l'id provider `minimax-portal`. I riferimenti ai modelli seguono la forma `minimax-portal/MiniMax-M3`.
    </Note>

    <Tip>
    Link referral per MiniMax Coding Plan (10% di sconto): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API key">
    **Ideale per:** MiniMax ospitato con API compatibile con Anthropic.

    <Tabs>
      <Tab title="International">
        <Steps>
          <Step title="Run onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Questo configura `api.minimax.io` come URL di base.
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

            Questo configura `api.minimaxi.com` come URL di base.
          </Step>
          <Step title="Verify the model is available">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### Esempio di configurazione

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M3" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
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
    Nel percorso di streaming compatibile con Anthropic, OpenClaw disabilita per impostazione predefinita il thinking di MiniMax M2.x, a meno che tu non imposti esplicitamente `thinking`. L'endpoint di streaming M2.x emette `reasoning_content` in frammenti delta in stile OpenAI invece di blocchi thinking Anthropic nativi, il che può esporre il ragionamento interno nell'output visibile se lasciato abilitato implicitamente. MiniMax-M3 (e M3.x compatibile in avanti) è esente da questa impostazione predefinita: M3 emette blocchi thinking Anthropic corretti e richiede che il thinking sia attivo per produrre contenuto visibile, quindi OpenClaw mantiene M3 sul percorso thinking omesso/adattivo del provider.
    </Warning>

    <Note>
    Le configurazioni con chiave API usano l'id provider `minimax`. I riferimenti ai modelli seguono la forma `minimax/MiniMax-M3`.
    </Note>

  </Tab>
</Tabs>

## Configurare tramite `openclaw configure`

Usa la procedura guidata interattiva di configurazione per impostare MiniMax senza modificare JSON:

<Steps>
  <Step title="Launch the wizard">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Select Model/auth">
    Scegli **Model/auth** dal menu.
  </Step>
  <Step title="Choose a MiniMax auth option">
    Seleziona una delle opzioni MiniMax disponibili:

    | Scelta autenticazione | Descrizione |
    | --- | --- |
    | `minimax-global-oauth` | OAuth internazionale (Coding Plan) |
    | `minimax-cn-oauth` | OAuth Cina (Coding Plan) |
    | `minimax-global-api` | Chiave API internazionale |
    | `minimax-cn-api` | Chiave API Cina |

  </Step>
  <Step title="Pick your default model">
    Seleziona il modello predefinito quando richiesto.
  </Step>
</Steps>

## Funzionalità

### Generazione immagini

Il Plugin MiniMax registra il modello `image-01` per lo strumento `image_generate`. Supporta:

- **Generazione testo-immagine** con controllo del rapporto d'aspetto
- **Modifica immagine-immagine** (riferimento soggetto) con controllo del rapporto d'aspetto
- Fino a **9 immagini di output** per richiesta
- Fino a **1 immagine di riferimento** per richiesta di modifica
- Rapporti d'aspetto supportati: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

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
modello `image-01`. Le configurazioni con chiave API usano `MINIMAX_API_KEY`; le configurazioni OAuth possono invece usare
il percorso di autenticazione integrato `minimax-portal`.

La generazione di immagini usa sempre l'endpoint immagini dedicato di MiniMax
(`/v1/image_generation`) e ignora `models.providers.minimax.baseUrl`,
poiché quel campo configura l'URL di base chat/compatibile con Anthropic. Imposta
`MINIMAX_API_HOST=https://api.minimaxi.com` per instradare la generazione di immagini
tramite l'endpoint CN; l'endpoint globale predefinito è
`https://api.minimax.io`.

Quando l'onboarding o la configurazione con chiave API scrive voci esplicite
`models.providers.minimax`, OpenClaw materializza `MiniMax-M3`, `MiniMax-M2.7` e
`MiniMax-M2.7-highspeed` come modelli chat. M3 dichiara input di testo e immagini;
la comprensione delle immagini resta esposta separatamente tramite il provider multimediale
`MiniMax-VL-01` di proprietà del Plugin.

<Note>
Consulta [Generazione immagini](/it/tools/image-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

### Sintesi vocale

Il Plugin `minimax` integrato registra MiniMax T2A v2 come provider vocale per
`messages.tts`.

- Modello TTS predefinito: `speech-2.8-hd`
- Voce predefinita: `English_expressive_narrator`
- Gli id modello integrati supportati includono `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` e `speech-01-turbo`.
- La risoluzione dell'autenticazione è `messages.tts.providers.minimax.apiKey`, poi
  profili di autenticazione OAuth/token `minimax-portal`, poi chiavi di ambiente
  Token Plan (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), poi `MINIMAX_API_KEY`.
- Se non è configurato alcun host TTS, OpenClaw riusa l'host OAuth
  `minimax-portal` configurato e rimuove i suffissi di percorso compatibili con Anthropic
  come `/anthropic`.
- Gli allegati audio normali restano MP3.
- I target per messaggi vocali come Feishu e Telegram vengono transcodificati da MiniMax
  MP3 a Opus 48 kHz con `ffmpeg`, perché l'API file Feishu/Lark accetta solo
  `file_type: "opus"` per i messaggi audio nativi.
- MiniMax T2A accetta `speed` e `vol` frazionari, ma `pitch` viene inviato come
  intero; OpenClaw tronca i valori frazionari di `pitch` prima della richiesta API.

| Impostazione                                    | Variabile env          | Predefinito                   | Descrizione                              |
| ----------------------------------------------- | ---------------------- | ----------------------------- | ---------------------------------------- |
| `messages.tts.providers.minimax.baseUrl`        | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Host API MiniMax T2A.                    |
| `messages.tts.providers.minimax.model`          | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | Id modello TTS.                          |
| `messages.tts.providers.minimax.speakerVoiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | Id voce usato per l'output vocale.       |
| `messages.tts.providers.minimax.speed`          |                        | `1.0`                         | Velocità di riproduzione, `0.5..2.0`.    |
| `messages.tts.providers.minimax.vol`            |                        | `1.0`                         | Volume, `(0, 10]`.                       |
| `messages.tts.providers.minimax.pitch`          |                        | `0`                           | Spostamento intero dell'intonazione, `-12..12`. |

### Generazione musicale

Il Plugin MiniMax integrato registra la generazione musicale tramite lo strumento condiviso
`music_generate` sia per `minimax` sia per `minimax-portal`.

- Modello musicale predefinito: `minimax/music-2.6`
- Modello musicale OAuth: `minimax-portal/music-2.6`
- Supporta anche `minimax/music-2.5` e `minimax/music-2.0`
- Controlli del prompt: `lyrics`, `instrumental`
- Formato di output: `mp3`
- Le esecuzioni basate su sessione si staccano tramite il flusso condiviso di attività/stato, incluso `action: "status"`

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
Vedi [Generazione musicale](/it/tools/music-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

### Generazione video

Il Plugin MiniMax incluso registra la generazione video tramite lo strumento condiviso
`video_generate` sia per `minimax` sia per `minimax-portal`.

- Modello video predefinito: `minimax/MiniMax-Hailuo-2.3`
- Modello video OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- Modalità: flussi da testo a video e con riferimento a singola immagine
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
Vedi [Generazione video](/it/tools/video-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

### Comprensione delle immagini

Il Plugin MiniMax registra la comprensione delle immagini separatamente dal catalogo
di testo:

| ID provider      | Modello immagine predefinito |
| ---------------- | ------------------- |
| `minimax`        | `MiniMax-VL-01`     |
| `minimax-portal` | `MiniMax-VL-01`     |

Per questo il routing automatico dei media può usare la comprensione delle immagini di MiniMax anche
quando il catalogo del provider di testo incluso contiene anche riferimenti chat M3 compatibili con immagini.

### Ricerca web

Il Plugin MiniMax registra anche `web_search` tramite l'API di ricerca MiniMax Token Plan.

- ID provider: `minimax`
- Risultati strutturati: titoli, URL, snippet, query correlate
- Variabile d'ambiente preferita: `MINIMAX_CODE_PLAN_KEY`
- Alias d'ambiente accettati: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Fallback di compatibilità: `MINIMAX_API_KEY` quando punta già a una credenziale token-plan
- Riutilizzo della regione: `plugins.entries.minimax.config.webSearch.region`, poi `MINIMAX_API_HOST`, poi gli URL di base del provider MiniMax
- La ricerca resta sull'ID provider `minimax`; la configurazione OAuth CN/globale può indirizzare indirettamente la regione tramite `models.providers.minimax-portal.baseUrl` e può fornire l'autenticazione bearer tramite `MINIMAX_OAUTH_TOKEN`

La configurazione si trova sotto `plugins.entries.minimax.config.webSearch.*`.

<Note>
Vedi [Ricerca MiniMax](/it/tools/minimax-search) per la configurazione completa e l'uso della ricerca web.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Configuration options">
    | Opzione | Descrizione |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Preferisci `https://api.minimax.io/anthropic` (compatibile con Anthropic); `https://api.minimax.io/v1` è opzionale per payload compatibili con OpenAI |
    | `models.providers.minimax.api` | Preferisci `anthropic-messages`; `openai-completions` è opzionale per payload compatibili con OpenAI |
    | `models.providers.minimax.apiKey` | Chiave API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Definisci `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Assegna alias ai modelli che vuoi nella allowlist |
    | `models.mode` | Mantieni `merge` se vuoi aggiungere MiniMax accanto ai modelli integrati |
  </Accordion>

  <Accordion title="Thinking defaults">
    Con `api: "anthropic-messages"`, OpenClaw inietta `thinking: { type: "disabled" }` per i modelli MiniMax M2.x, a meno che thinking non sia già impostato esplicitamente in params/config.

    Questo impedisce all'endpoint di streaming di M2.x di emettere `reasoning_content` in chunk delta in stile OpenAI, che esporrebbero il reasoning interno nell'output visibile.

    MiniMax-M3 (e M3.x) è escluso: M3 emette blocchi thinking Anthropic corretti e restituisce un array `content` vuoto con `stop_reason: "end_turn"` quando thinking è disabilitato, quindi il wrapper mantiene M3 sul percorso thinking omesso/adattivo del provider.

  </Accordion>

  <Accordion title="Fast mode">
    `/fast on` o `params.fastMode: true` riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed` sul percorso di stream compatibile con Anthropic.
  </Accordion>

  <Accordion title="Fallback example">
    **Ideale per:** mantenere come primario il tuo modello più potente di ultima generazione e passare a MiniMax M2.7 in failover. L'esempio sotto usa Opus come primario concreto; sostituiscilo con il modello primario di ultima generazione che preferisci.

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

  <Accordion title="Coding Plan usage details">
    - API di utilizzo Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` o `https://api.minimax.io/v1/token_plan/remains` (richiede una chiave coding plan).
    - Il polling dell'utilizzo deriva l'host da `models.providers.minimax-portal.baseUrl` o `models.providers.minimax.baseUrl` quando configurati, quindi le configurazioni globali che usano `https://api.minimax.io/anthropic` interrogano `api.minimax.io`. URL di base mancanti o non validi mantengono il fallback CN per compatibilità.
    - OpenClaw normalizza l'utilizzo del coding-plan MiniMax nella stessa visualizzazione `% left` usata dagli altri provider. I campi grezzi MiniMax `usage_percent` / `usagePercent` indicano la quota rimanente, non la quota consumata, quindi OpenClaw li inverte. I campi basati su conteggio hanno la precedenza quando presenti.
    - Quando l'API restituisce `model_remains`, OpenClaw preferisce la voce del modello chat, deriva l'etichetta della finestra da `start_time` / `end_time` quando necessario e include il nome del modello selezionato nell'etichetta del piano, così le finestre coding-plan sono più facili da distinguere.
    - Gli snapshot di utilizzo trattano `minimax`, `minimax-cn` e `minimax-portal` come la stessa superficie di quota MiniMax e preferiscono l'OAuth MiniMax memorizzato prima di ripiegare sulle variabili d'ambiente della chiave Coding Plan.

  </Accordion>
</AccordionGroup>

## Note

- I riferimenti ai modelli seguono il percorso di autenticazione:
  - Configurazione con chiave API: `minimax/<model>`
  - Configurazione OAuth: `minimax-portal/<model>`
- Modello chat predefinito: `MiniMax-M3`
- Modelli chat alternativi: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- L'onboarding e la configurazione diretta con chiave API scrivono le definizioni dei modelli per M3 ed entrambe le varianti M2.7
- La comprensione delle immagini usa il provider media `MiniMax-VL-01` di proprietà del Plugin
- Aggiorna i valori di prezzo in `models.json` se hai bisogno di tracciamento esatto dei costi
- Usa `openclaw models list` per confermare l'ID provider corrente, poi passa a `openclaw models set minimax/MiniMax-M3` o `openclaw models set minimax-portal/MiniMax-M3`

<Tip>
Link referral per MiniMax Coding Plan (10% di sconto): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Vedi [Provider di modelli](/it/concepts/model-providers) per le regole dei provider.
</Note>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M3"'>
    Di solito significa che il **provider MiniMax non è configurato** (nessuna voce provider corrispondente e nessun profilo di autenticazione MiniMax/chiave env trovato). Una correzione per questo rilevamento è in **2026.1.12**. Risolvi così:

    - Aggiorna a **2026.1.12** (o esegui dal sorgente `main`), poi riavvia il Gateway.
    - Esegui `openclaw configure` e seleziona un'opzione di autenticazione **MiniMax**, oppure
    - Aggiungi manualmente il blocco `models.providers.minimax` o `models.providers.minimax-portal` corrispondente, oppure
    - Imposta `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` o un profilo di autenticazione MiniMax, così il provider corrispondente può essere iniettato.

    Assicurati che l'ID del modello sia **sensibile a maiuscole e minuscole**:

    - Percorso con chiave API: `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` o `minimax/MiniMax-M2.7-highspeed`
    - Percorso OAuth: `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` o `minimax-portal/MiniMax-M2.7-highspeed`

    Poi ricontrolla con:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Altro aiuto: [Risoluzione dei problemi](/it/help/troubleshooting) e [FAQ](/it/help/faq).
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Model selection" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="Image generation" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento immagine e selezione del provider.
  </Card>
  <Card title="Music generation" href="/it/tools/music-generation" icon="music">
    Parametri condivisi dello strumento musicale e selezione del provider.
  </Card>
  <Card title="Video generation" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="MiniMax Search" href="/it/tools/minimax-search" icon="magnifying-glass">
    Configurazione della ricerca web tramite MiniMax Token Plan.
  </Card>
  <Card title="Troubleshooting" href="/it/help/troubleshooting" icon="wrench">
    Risoluzione generale dei problemi e FAQ.
  </Card>
</CardGroup>
