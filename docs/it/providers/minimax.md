---
read_when:
    - Vuoi i modelli MiniMax in OpenClaw
    - Hai bisogno di indicazioni per la configurazione di MiniMax
summary: Usare i modelli MiniMax in OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-07-12T07:28:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1172d2d2c92dc92858f15564eee9ffeb8eb9599ee70157116fd2e302556dd75a
    source_path: providers/minimax.md
    workflow: 16
---

  Il Plugin `minimax` incluso registra due provider e sette funzionalità: chat, generazione di immagini, generazione musicale, generazione video, comprensione delle immagini, sintesi vocale (T2A v2) e ricerca sul web.

  | ID provider      | Autenticazione | Funzionalità                                                                                                     |
  | ---------------- | -------------- | ---------------------------------------------------------------------------------------------------------------- |
  | `minimax`        | Chiave API     | Testo, generazione di immagini, generazione musicale, generazione video, comprensione delle immagini, sintesi vocale, ricerca sul web |
  | `minimax-portal` | OAuth          | Testo, generazione di immagini, generazione musicale, generazione video, comprensione delle immagini, sintesi vocale                 |

  <Tip>
  Link di segnalazione per MiniMax Coding Plan (sconto del 10%): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
  </Tip>

  ## Catalogo integrato

  | Modello                  | Tipo                    | Descrizione                                        |
  | ------------------------ | ----------------------- | -------------------------------------------------- |
  | `MiniMax-M3`             | Chat (ragionamento)     | Modello di ragionamento ospitato predefinito       |
  | `MiniMax-M2.7`           | Chat (ragionamento)     | Modello di ragionamento ospitato precedente        |
  | `MiniMax-M2.7-highspeed` | Chat (ragionamento)     | Livello di ragionamento M2.7 più veloce            |
  | `MiniMax-VL-01`          | Visione                 | Modello di comprensione delle immagini             |
  | `image-01`               | Generazione di immagini | Modifica da testo a immagine e da immagine a immagine |
  | `music-2.6`              | Generazione musicale    | Modello musicale predefinito                       |
  | `MiniMax-Hailuo-2.3`     | Generazione video       | Flussi da testo a video e da immagine a video      |

  I riferimenti ai modelli seguono il percorso di autenticazione: `minimax/<model>` per le configurazioni con chiave API, `minimax-portal/<model>` per le configurazioni OAuth.

  ## Per iniziare

  <Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Ideale per:** configurazione rapida con MiniMax Coding Plan tramite OAuth, senza necessità di una chiave API.

    <Tabs>
      <Tab title="Internazionale">
        <Steps>
          <Step title="Esegui la configurazione iniziale">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            URL di base del provider risultante: `api.minimax.io`.
          </Step>
          <Step title="Verifica che il modello sia disponibile">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Cina">
        <Steps>
          <Step title="Esegui la configurazione iniziale">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            URL di base del provider risultante: `api.minimaxi.com`.
          </Step>
          <Step title="Verifica che il modello sia disponibile">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    Le configurazioni OAuth utilizzano l'ID provider `minimax-portal`. I riferimenti ai modelli seguono il formato `minimax-portal/MiniMax-M3`.
    </Note>

  </Tab>

  <Tab title="Chiave API">
    **Ideale per:** MiniMax ospitato con API compatibile con Anthropic.

    <Tabs>
      <Tab title="Internazionale">
        <Steps>
          <Step title="Esegui la configurazione iniziale">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Questa operazione configura `api.minimax.io` come URL di base.
          </Step>
          <Step title="Verifica che il modello sia disponibile">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="Cina">
        <Steps>
          <Step title="Esegui la configurazione iniziale">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Questa operazione configura `api.minimaxi.com` come URL di base.
          </Step>
          <Step title="Verifica che il modello sia disponibile">
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
    L'endpoint di streaming compatibile con Anthropic di MiniMax-M2.x emette `reasoning_content` in blocchi delta in stile OpenAI anziché in blocchi di pensiero nativi di Anthropic; ciò espone il ragionamento interno nell'output visibile se il ragionamento rimane implicitamente abilitato. OpenClaw disabilita per impostazione predefinita il ragionamento di M2.x, a meno che non si imposti esplicitamente `thinking`. MiniMax-M3 (e le versioni M3.x compatibili con le versioni successive) fa eccezione: M3 emette correttamente i blocchi di pensiero di Anthropic e richiede che il ragionamento sia attivo per produrre contenuti visibili, quindi OpenClaw mantiene M3 nel percorso di ragionamento adattivo del provider. Consulta la sezione Impostazioni predefinite del ragionamento in Configurazione avanzata più avanti.
    </Warning>

    <Note>
    Le configurazioni con chiave API utilizzano l'ID provider `minimax`. I riferimenti ai modelli seguono il formato `minimax/MiniMax-M3`.
    </Note>

  </Tab>
</Tabs>

## Configurazione tramite `openclaw configure`

<Steps>
  <Step title="Avvia la procedura guidata">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Seleziona modello/autenticazione">
    Scegli **Modello/autenticazione** dal menu.
  </Step>
  <Step title="Scegli un'opzione di autenticazione MiniMax">
    | Opzione di autenticazione | Descrizione                         |
    | ------------------------- | ----------------------------------- |
    | `minimax-global-oauth`    | OAuth internazionale (piano Coding) |
    | `minimax-cn-oauth`        | OAuth Cina (piano Coding)           |
    | `minimax-global-api`      | Chiave API internazionale           |
    | `minimax-cn-api`          | Chiave API per la Cina              |
  </Step>
  <Step title="Scegli il modello predefinito">
    Quando richiesto, seleziona il modello predefinito.
  </Step>
</Steps>

## Funzionalità

### Generazione di immagini

Il plugin MiniMax registra il modello `image-01` per lo strumento `image_generate` sia su `minimax` sia su `minimax-portal`, riutilizzando la stessa `MINIMAX_API_KEY` o la stessa autenticazione OAuth dei modelli di testo.

- Generazione da testo a immagine e modifica da immagine a immagine (riferimento del soggetto), entrambe con controllo delle proporzioni
- Fino a 9 immagini di output per richiesta e 1 immagine di riferimento per ogni richiesta di modifica
- Proporzioni supportate: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

La generazione di immagini usa sempre l'endpoint dedicato alle immagini di MiniMax (`/v1/image_generation`) e ignora `models.providers.minimax.baseUrl`, poiché tale campo configura invece l'URL di base compatibile con chat/Anthropic. Imposta `MINIMAX_API_HOST=https://api.minimaxi.com` per instradare la generazione di immagini tramite l'endpoint cinese; l'endpoint globale predefinito è `https://api.minimax.io`.

<Note>
Consulta [Generazione di immagini](/it/tools/image-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

### Sintesi vocale

Il plugin `minimax` incluso registra MiniMax T2A v2 come provider vocale per `messages.tts`.

- Modello TTS predefinito: `speech-2.8-hd`
- Voce predefinita: `English_expressive_narrator`
- ID dei modelli inclusi: `speech-2.8-hd`, `speech-2.8-turbo`, `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`, `speech-02-turbo`, `speech-01-hd`, `speech-01-turbo`, `speech-01-240228`
- Ordine di risoluzione dell'autenticazione: `messages.tts.providers.minimax.apiKey`, quindi i profili di autenticazione OAuth/token di `minimax-portal`, poi le chiavi di ambiente del piano Token (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`, `MINIMAX_CODING_API_KEY`) e infine `MINIMAX_API_KEY`
- Se non è configurato alcun host TTS, OpenClaw riutilizza l'host OAuth configurato per `minimax-portal` e rimuove i suffissi di percorso compatibili con Anthropic, come `/anthropic`
- I normali allegati audio rimangono in formato MP3. Le destinazioni per note vocali (Feishu, Telegram e altri canali che richiedono un allegato compatibile con le note vocali) vengono transcodificate da MP3 MiniMax a Opus a 48 kHz con `ffmpeg`, poiché, ad esempio, l'API dei file di Feishu/Lark accetta solo `file_type: "opus"` per i messaggi audio nativi
- MiniMax T2A accetta valori frazionari per `speed` e `vol`, ma `pitch` viene inviato come numero intero; OpenClaw tronca i valori frazionari di `pitch` prima della richiesta API

| Impostazione                              | Variabile di ambiente  | Valore predefinito            | Descrizione                                      |
| ----------------------------------------- | ---------------------- | ----------------------------- | ------------------------------------------------ |
| `messages.tts.providers.minimax.baseUrl`  | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Host dell'API MiniMax T2A.                       |
| `messages.tts.providers.minimax.model`    | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | ID del modello TTS.                              |
| `messages.tts.providers.minimax.voiceId`  | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | ID della voce usata per l'output vocale.         |
| `messages.tts.providers.minimax.speed`    |                        | `1.0`                         | Velocità di riproduzione, `0.5..2.0`.            |
| `messages.tts.providers.minimax.vol`      |                        | `1.0`                         | Volume, `(0, 10]`.                               |
| `messages.tts.providers.minimax.pitch`    |                        | `0`                           | Variazione intera dell'intonazione, `-12..12`.   |

### Generazione musicale

Il plugin MiniMax incluso registra la generazione musicale tramite lo strumento condiviso `music_generate` sia per `minimax` sia per `minimax-portal`.

- Modello musicale predefinito: `minimax/music-2.6` (OAuth: `minimax-portal/music-2.6`)
- Supporta anche `music-2.6-free`, `music-cover` e `music-cover-free`
- Controlli del prompt: `lyrics`, `instrumental`
- Formato di output: `mp3`
- Le esecuzioni basate su sessione vengono separate tramite il flusso condiviso di attività/stato, incluso `action: "status"`

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: { primary: "minimax/music-2.6" },
    },
  },
}
```

<Note>
Consulta [Generazione musicale](/it/tools/music-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

### Generazione di video

Il plugin MiniMax incluso registra la generazione di video tramite lo strumento condiviso `video_generate` sia per `minimax` sia per `minimax-portal`.

- Modello video predefinito: `minimax/MiniMax-Hailuo-2.3` (OAuth: `minimax-portal/MiniMax-Hailuo-2.3`)
- Supporta anche `MiniMax-Hailuo-2.3-Fast`, `MiniMax-Hailuo-02`, `I2V-01-Director`, `I2V-01-live` e `I2V-01`
- Modalità: flussi da testo a video e con riferimento a una singola immagine
- Supporta `resolution` (`768P` o `1080P` sui modelli Hailuo 2.3/02); `aspectRatio` non è supportato e viene ignorato

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "minimax/MiniMax-Hailuo-2.3" },
    },
  },
}
```

<Note>
Consulta [Generazione video](/it/tools/video-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

### Comprensione delle immagini

Il plugin MiniMax registra la comprensione delle immagini separatamente dal catalogo testuale:

| ID provider      | Modello di immagini predefinito | Estrazione del testo dai PDF |
| ---------------- | ------------------------------- | ---------------------------- |
| `minimax`        | `MiniMax-VL-01`                 | `MiniMax-M2.7`               |
| `minimax-portal` | `MiniMax-VL-01`                 | `MiniMax-M2.7`               |

Per questo motivo, l'instradamento automatico dei contenuti multimediali può usare la comprensione delle immagini di MiniMax anche quando il catalogo incluso del provider testuale contiene anche riferimenti di chat M3 con capacità di elaborazione delle immagini. La comprensione dei PDF usa `MiniMax-M2.7` esclusivamente per l'estrazione del testo; MiniMax non registra un percorso di conversione da PDF a immagine.

### Ricerca web

Il plugin MiniMax registra anche `web_search` tramite l'API di ricerca MiniMax Token Plan (`/v1/coding_plan/search`).

- ID provider: `minimax`
- Risultati strutturati: titoli, URL, estratti, query correlate
- Variabile d'ambiente preferita: `MINIMAX_CODE_PLAN_KEY`
- Alias di variabili d'ambiente accettati: `MINIMAX_CODING_API_KEY`, `MINIMAX_OAUTH_TOKEN`
- Fallback di compatibilità: `MINIMAX_API_KEY` quando punta già a una credenziale del piano token
- Riutilizzo della regione: `plugins.entries.minimax.config.webSearch.region`, quindi `MINIMAX_API_HOST`, quindi gli URL di base del provider MiniMax
- La ricerca rimane sull'ID provider `minimax`; la configurazione OAuth CN/globale può determinare indirettamente la regione tramite `models.providers.minimax-portal.baseUrl` e può fornire l'autenticazione bearer tramite `MINIMAX_OAUTH_TOKEN`

La configurazione si trova in `plugins.entries.minimax.config.webSearch.*`.

<Note>
Consulta [Ricerca MiniMax](/it/tools/minimax-search) per la configurazione completa e l'utilizzo della ricerca web.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Opzioni di configurazione">
    | Opzione | Descrizione |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Preferisci `https://api.minimax.io/anthropic` (compatibile con Anthropic); `https://api.minimax.io/v1` è facoltativo per i payload compatibili con OpenAI |
    | `models.providers.minimax.api` | Preferisci `anthropic-messages`; `openai-completions` è facoltativo per i payload compatibili con OpenAI |
    | `models.providers.minimax.apiKey` | Chiave API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Definisci `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Assegna alias ai modelli che desideri inserire nell'elenco consentito |
    | `models.mode` | Mantieni `merge` se vuoi aggiungere MiniMax insieme ai modelli integrati |
  </Accordion>

  <Accordion title="Impostazioni predefinite del ragionamento">
    Con `api: "anthropic-messages"`, OpenClaw inserisce `thinking: { type: "disabled" }` per i modelli MiniMax M2.x, a meno che un wrapper precedente non abbia già impostato il campo `thinking` nel payload. Ciò impedisce all'endpoint di streaming di M2.x di emettere `reasoning_content` in frammenti delta in stile OpenAI, evitando che il ragionamento interno venga esposto nell'output visibile.

    MiniMax-M3 (e M3.x) è escluso: quando il ragionamento è disabilitato, M3 restituisce un array `content` vuoto con `stop_reason: "end_turn"`, quindi OpenClaw rimuove l'impostazione predefinita implicita di disabilitazione per M3 e, quando è impostato un livello di ragionamento, forza invece `thinking: { type: "adaptive" }`.

    Livelli di ragionamento disponibili per famiglia di modelli:

    | Famiglia di modelli | Livelli                                   | Predefinito |
    | ------------------- | ----------------------------------------- | ----------- |
    | `MiniMax-M3`        | `off`, `adaptive`                         | `adaptive`  |
    | `MiniMax-M2.x`      | `off`, `minimal`, `low`, `medium`, `high` | `off`       |

  </Accordion>

  <Accordion title="Modalità veloce">
    `/fast on` o `params.fastMode: true` sostituisce `MiniMax-M2.7` con `MiniMax-M2.7-highspeed` nel percorso di streaming compatibile con Anthropic (`api: "anthropic-messages"`, provider `minimax` o `minimax-portal`).
  </Accordion>

  <Accordion title="Esempio di fallback">
    **Ideale per:** mantenere come primario il modello più potente di ultima generazione ed eseguire il failover su MiniMax M2.7. L'esempio seguente usa Opus come modello primario concreto; sostituiscilo con il modello primario di ultima generazione che preferisci.

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

  <Accordion title="Dettagli sull'utilizzo del Coding Plan">
    - API di utilizzo del Coding Plan: `https://api.minimaxi.com/v1/token_plan/remains` o `https://api.minimax.io/v1/token_plan/remains` (richiede una chiave del Coding Plan).
    - Il polling dell'utilizzo ricava l'host da `models.providers.minimax-portal.baseUrl` o `models.providers.minimax.baseUrl`, se configurati; pertanto, le configurazioni globali che usano `https://api.minimax.io/anthropic` interrogano `api.minimax.io`. Gli URL di base mancanti o non validi mantengono il fallback CN per compatibilità.
    - OpenClaw normalizza l'utilizzo del Coding Plan MiniMax usando la stessa visualizzazione `% rimanente` impiegata dagli altri provider. I campi non elaborati `usage_percent` / `usagePercent` di MiniMax rappresentano la quota rimanente, non quella consumata, quindi OpenClaw li inverte. I campi basati sul conteggio hanno la precedenza quando presenti.
    - Quando l'API restituisce `model_remains`, OpenClaw preferisce la voce del modello di chat, ricava l'etichetta della finestra da `start_time` / `end_time` quando necessario e include il nome del modello selezionato nell'etichetta del piano, così da distinguere più facilmente le finestre del Coding Plan.
    - Le istantanee di utilizzo trattano `minimax`, `minimax-cn`, `minimax-portal` e `minimax-portal-cn` come la stessa superficie di quota MiniMax e preferiscono le credenziali OAuth MiniMax archiviate prima di ricorrere alle variabili d'ambiente della chiave del Coding Plan.

  </Accordion>
</AccordionGroup>

## Note

- Modello di chat predefinito: `MiniMax-M3`. Modelli di chat alternativi: `MiniMax-M2.7`, `MiniMax-M2.7-highspeed`
- L'onboarding e la configurazione diretta tramite chiave API scrivono le definizioni dei modelli per M3 e per entrambe le varianti M2.7
- La comprensione delle immagini usa il provider multimediale `MiniMax-VL-01` gestito dal plugin
- Aggiorna i valori dei prezzi in `models.json` se ti serve un monitoraggio preciso dei costi
- Usa `openclaw models list` per confermare l'ID provider corrente, quindi passa a un altro modello con `openclaw models set minimax/MiniMax-M3` o `openclaw models set minimax-portal/MiniMax-M3`

<Note>
Consulta [Provider di modelli](/it/concepts/model-providers) per le regole relative ai provider.
</Note>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title='"Modello sconosciuto: minimax/MiniMax-M3"'>
    In genere, questo significa che il **provider MiniMax non è configurato** (non sono stati trovati né una voce provider corrispondente né un profilo di autenticazione o una chiave d'ambiente MiniMax). Per risolvere:

    - Esegui `openclaw configure` e seleziona un'opzione di autenticazione **MiniMax**, oppure
    - Aggiungi manualmente il blocco `models.providers.minimax` o `models.providers.minimax-portal` corrispondente, oppure
    - Imposta `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` o un profilo di autenticazione MiniMax, affinché possa essere inserito il provider corrispondente.

    Assicurati che l'ID del modello **distingua tra maiuscole e minuscole**:

    - Percorso con chiave API: `minimax/MiniMax-M3`, `minimax/MiniMax-M2.7` o `minimax/MiniMax-M2.7-highspeed`
    - Percorso OAuth: `minimax-portal/MiniMax-M3`, `minimax-portal/MiniMax-M2.7` o `minimax-portal/MiniMax-M2.7-highspeed`

    Quindi verifica nuovamente con:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Ulteriore assistenza: [Risoluzione dei problemi](/it/help/troubleshooting) e [Domande frequenti](/it/help/faq).
</Note>

## Argomenti correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scelta dei provider, dei riferimenti ai modelli e del comportamento di failover.
  </Card>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento per le immagini e selezione del provider.
  </Card>
  <Card title="Generazione musicale" href="/it/tools/music-generation" icon="music">
    Parametri condivisi dello strumento per la musica e selezione del provider.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento per i video e selezione del provider.
  </Card>
  <Card title="Ricerca MiniMax" href="/it/tools/minimax-search" icon="magnifying-glass">
    Configurazione della ricerca web tramite MiniMax Token Plan.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Risoluzione generale dei problemi e domande frequenti.
  </Card>
</CardGroup>
