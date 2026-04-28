---
read_when:
    - Vuoi i modelli MiniMax in OpenClaw
    - Hai bisogno di indicazioni per configurare MiniMax
summary: Usare i modelli MiniMax in OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-26T11:37:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b91f8c4c12c993457fb1535bbb2f3401474a3ec432b24189792a20041e756dc
    source_path: providers/minimax.md
    workflow: 15
---

Il provider MiniMax di OpenClaw usa per impostazione predefinita **MiniMax M2.7**.

MiniMax offre anche:

- Sintesi vocale integrata tramite T2A v2
- Comprensione delle immagini integrata tramite `MiniMax-VL-01`
- Generazione musicale integrata tramite `music-2.6`
- `web_search` integrata tramite l'API di ricerca del Coding Plan di MiniMax

Suddivisione dei provider:

| ID provider       | Auth    | Capacità                                                                                           |
| ----------------- | ------- | -------------------------------------------------------------------------------------------------- |
| `minimax`        | Chiave API | Testo, generazione di immagini, generazione musicale, generazione video, comprensione delle immagini, voce, ricerca web |
| `minimax-portal` | OAuth   | Testo, generazione di immagini, generazione musicale, generazione video, comprensione delle immagini, voce            |

## Catalogo integrato

| Modello                  | Tipo             | Descrizione                              |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | Chat (ragionamento) | Modello di ragionamento ospitato predefinito |
| `MiniMax-M2.7-highspeed` | Chat (ragionamento) | Livello di ragionamento M2.7 più veloce       |
| `MiniMax-VL-01`          | Visione          | Modello di comprensione delle immagini   |
| `image-01`               | Generazione di immagini | Da testo a immagine e modifica da immagine a immagine |
| `music-2.6`              | Generazione musicale | Modello musicale predefinito             |
| `music-2.5`              | Generazione musicale | Livello precedente di generazione musicale |
| `music-2.0`              | Generazione musicale | Livello legacy di generazione musicale   |
| `MiniMax-Hailuo-2.3`     | Generazione video | Flussi da testo a video e con immagine di riferimento |

## Per iniziare

Scegli il metodo di autenticazione che preferisci e segui i passaggi di configurazione.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Ideale per:** configurazione rapida con MiniMax Coding Plan tramite OAuth, senza chiave API.

    <Tabs>
      <Tab title="Internazionale">
        <Steps>
          <Step title="Esegui l'onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Questo esegue l'autenticazione su `api.minimax.io`.
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
          <Step title="Esegui l'onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            Questo esegue l'autenticazione su `api.minimaxi.com`.
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
    Le configurazioni OAuth usano l'ID provider `minimax-portal`. I riferimenti ai modelli seguono il formato `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Link referral per MiniMax Coding Plan (10% di sconto): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="Chiave API">
    **Ideale per:** MiniMax ospitato con API compatibile con Anthropic.

    <Tabs>
      <Tab title="Internazionale">
        <Steps>
          <Step title="Esegui l'onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Questo configura `api.minimax.io` come URL di base.
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
          <Step title="Esegui l'onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            Questo configura `api.minimaxi.com` come URL di base.
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
    Nel percorso di streaming compatibile con Anthropic, OpenClaw disattiva per impostazione predefinita il thinking di MiniMax a meno che tu non imposti esplicitamente `thinking`. L'endpoint di streaming di MiniMax emette `reasoning_content` in chunk delta in stile OpenAI invece che in blocchi di thinking nativi di Anthropic, il che può esporre il ragionamento interno nell'output visibile se lasciato implicitamente abilitato.
    </Warning>

    <Note>
    Le configurazioni con chiave API usano l'ID provider `minimax`. I riferimenti ai modelli seguono il formato `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Configurare tramite `openclaw configure`

Usa la procedura guidata di configurazione interattiva per impostare MiniMax senza modificare il JSON:

<Steps>
  <Step title="Avvia la procedura guidata">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Seleziona Modello/auth">
    Scegli **Model/auth** dal menu.
  </Step>
  <Step title="Scegli un'opzione di autenticazione MiniMax">
    Seleziona una delle opzioni MiniMax disponibili:

    | Auth choice | Description |
    | --- | --- |
    | `minimax-global-oauth` | OAuth internazionale (Coding Plan) |
    | `minimax-cn-oauth` | OAuth Cina (Coding Plan) |
    | `minimax-global-api` | Chiave API internazionale |
    | `minimax-cn-api` | Chiave API Cina |

  </Step>
  <Step title="Scegli il tuo modello predefinito">
    Seleziona il tuo modello predefinito quando richiesto.
  </Step>
</Steps>

## Capacità

### Generazione di immagini

Il Plugin MiniMax registra il modello `image-01` per lo strumento `image_generate`. Supporta:

- **Generazione da testo a immagine** con controllo del rapporto d'aspetto
- **Modifica da immagine a immagine** (immagine soggetto di riferimento) con controllo del rapporto d'aspetto
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

Il Plugin usa la stessa `MINIMAX_API_KEY` o la stessa autenticazione OAuth dei modelli di testo. Non è necessaria alcuna configurazione aggiuntiva se MiniMax è già configurato.

Sia `minimax` sia `minimax-portal` registrano `image_generate` con lo stesso
modello `image-01`. Le configurazioni con chiave API usano `MINIMAX_API_KEY`; le configurazioni OAuth possono invece usare
il percorso di autenticazione `minimax-portal` integrato.

La generazione di immagini usa sempre l'endpoint immagini dedicato di MiniMax
(`/v1/image_generation`) e ignora `models.providers.minimax.baseUrl`,
poiché quel campo configura l'URL di base della chat/API compatibile con Anthropic. Imposta
`MINIMAX_API_HOST=https://api.minimaxi.com` per instradare la generazione di immagini
tramite l'endpoint CN; l'endpoint globale predefinito è
`https://api.minimax.io`.

Quando l'onboarding o la configurazione con chiave API scrive voci esplicite in `models.providers.minimax`,
OpenClaw materializza `MiniMax-M2.7` e
`MiniMax-M2.7-highspeed` come modelli chat di solo testo. La comprensione delle immagini viene
esposta separatamente tramite il provider multimediale `MiniMax-VL-01` di proprietà del Plugin.

<Note>
Vedi [Generazione di immagini](/it/tools/image-generation) per i parametri condivisi dello strumento, la selezione del provider e il comportamento di failover.
</Note>

### Sintesi vocale

Il Plugin `minimax` integrato registra MiniMax T2A v2 come provider vocale per
`messages.tts`.

- Modello TTS predefinito: `speech-2.8-hd`
- Voce predefinita: `English_expressive_narrator`
- Gli ID modello integrati supportati includono `speech-2.8-hd`, `speech-2.8-turbo`,
  `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`,
  `speech-02-turbo`, `speech-01-hd` e `speech-01-turbo`.
- La risoluzione dell'autenticazione è `messages.tts.providers.minimax.apiKey`, poi
  i profili di autenticazione OAuth/token di `minimax-portal`, poi le chiavi ambiente del Token Plan
  (`MINIMAX_OAUTH_TOKEN`, `MINIMAX_CODE_PLAN_KEY`,
  `MINIMAX_CODING_API_KEY`), quindi `MINIMAX_API_KEY`.
- Se non è configurato alcun host TTS, OpenClaw riutilizza l'host OAuth `minimax-portal`
  configurato e rimuove i suffissi di percorso compatibili con Anthropic
  come `/anthropic`.
- I normali allegati audio restano in formato MP3.
- Le destinazioni per note vocali come Feishu e Telegram vengono trascodificate dall'MP3 di MiniMax
  a Opus 48 kHz con `ffmpeg`, perché l'API file di Feishu/Lark
  accetta solo `file_type: "opus"` per i messaggi audio nativi.
- MiniMax T2A accetta `speed` e `vol` frazionari, ma `pitch` viene inviato come
  intero; OpenClaw tronca i valori frazionari di `pitch` prima della richiesta API.

| Setting                                  | Env var                | Default                       | Description                           |
| ---------------------------------------- | ---------------------- | ----------------------------- | ------------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | Host API T2A di MiniMax.              |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | ID modello TTS.                       |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | ID voce usato per l'output vocale.    |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | Velocità di riproduzione, `0.5..2.0`. |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | Volume, `(0, 10]`.                    |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | Spostamento intero del tono, `-12..12`. |

### Generazione musicale

Il Plugin MiniMax integrato registra la generazione musicale tramite lo strumento condiviso
`music_generate` sia per `minimax` sia per `minimax-portal`.

- Modello musicale predefinito: `minimax/music-2.6`
- Modello musicale OAuth: `minimax-portal/music-2.6`
- Supporta anche `minimax/music-2.5` e `minimax/music-2.0`
- Controlli del prompt: `lyrics`, `instrumental`, `durationSeconds`
- Formato di output: `mp3`
- Le esecuzioni basate su sessione vengono sganciate tramite il flusso condiviso task/stato, incluso `action: "status"`

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

Il Plugin MiniMax integrato registra la generazione video tramite lo strumento condiviso
`video_generate` sia per `minimax` sia per `minimax-portal`.

- Modello video predefinito: `minimax/MiniMax-Hailuo-2.3`
- Modello video OAuth: `minimax-portal/MiniMax-Hailuo-2.3`
- Modalità: flussi da testo a video e con singola immagine di riferimento
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

| ID provider       | Modello immagine predefinito |
| ----------------- | ---------------------------- |
| `minimax`        | `MiniMax-VL-01`              |
| `minimax-portal` | `MiniMax-VL-01`              |

Per questo motivo l'instradamento automatico dei media può usare la comprensione immagini di MiniMax anche
quando il catalogo integrato del provider di testo mostra ancora riferimenti chat M2.7 solo testo.

### Ricerca web

Il Plugin MiniMax registra anche `web_search` tramite l'API di ricerca di MiniMax Coding Plan.

- ID provider: `minimax`
- Risultati strutturati: titoli, URL, snippet, query correlate
- Variabile d'ambiente preferita: `MINIMAX_CODE_PLAN_KEY`
- Alias env accettato: `MINIMAX_CODING_API_KEY`
- Fallback di compatibilità: `MINIMAX_API_KEY` quando punta già a un token coding-plan
- Riutilizzo della regione: `plugins.entries.minimax.config.webSearch.region`, poi `MINIMAX_API_HOST`, poi gli URL di base del provider MiniMax
- La ricerca resta sull'ID provider `minimax`; la configurazione OAuth CN/globale può comunque indirizzare indirettamente la regione tramite `models.providers.minimax-portal.baseUrl`

La configurazione si trova sotto `plugins.entries.minimax.config.webSearch.*`.

<Note>
Vedi [MiniMax Search](/it/tools/minimax-search) per la configurazione completa e l'utilizzo della ricerca web.
</Note>

## Configurazione avanzata

<AccordionGroup>
  <Accordion title="Opzioni di configurazione">
    | Option | Description |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | Preferisci `https://api.minimax.io/anthropic` (compatibile con Anthropic); `https://api.minimax.io/v1` è facoltativo per payload compatibili con OpenAI |
    | `models.providers.minimax.api` | Preferisci `anthropic-messages`; `openai-completions` è facoltativo per payload compatibili con OpenAI |
    | `models.providers.minimax.apiKey` | Chiave API MiniMax (`MINIMAX_API_KEY`) |
    | `models.providers.minimax.models` | Definisci `id`, `name`, `reasoning`, `contextWindow`, `maxTokens`, `cost` |
    | `agents.defaults.models` | Modelli alias che vuoi nella allowlist |
    | `models.mode` | Mantieni `merge` se vuoi aggiungere MiniMax accanto ai modelli integrati |
  </Accordion>

  <Accordion title="Impostazioni predefinite di thinking">
    Con `api: "anthropic-messages"`, OpenClaw inietta `thinking: { type: "disabled" }` a meno che il thinking non sia già impostato esplicitamente nei parametri/configurazione.

    Questo impedisce all'endpoint di streaming MiniMax di emettere `reasoning_content` in chunk delta in stile OpenAI, che esporrebbero il ragionamento interno nell'output visibile.

  </Accordion>

  <Accordion title="Modalità veloce">
    `/fast on` o `params.fastMode: true` riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed` sul percorso di streaming compatibile con Anthropic.
  </Accordion>

  <Accordion title="Esempio di fallback">
    **Ideale per:** mantenere come primaria il tuo modello latest-generation più potente, con fallback a MiniMax M2.7. L'esempio seguente usa Opus come primaria concreta; sostituiscilo con il tuo modello primario latest-gen preferito.

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
    - API di utilizzo del Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (richiede una chiave coding plan).
    - OpenClaw normalizza l'utilizzo del coding-plan MiniMax allo stesso formato di visualizzazione `% rimanente` usato dagli altri provider. I campi grezzi `usage_percent` / `usagePercent` di MiniMax rappresentano la quota rimanente, non quella consumata, quindi OpenClaw li inverte. I campi basati sul conteggio hanno priorità quando presenti.
    - Quando l'API restituisce `model_remains`, OpenClaw preferisce la voce del modello chat, ricava l'etichetta della finestra da `start_time` / `end_time` quando necessario e include il nome del modello selezionato nell'etichetta del piano, così le finestre coding-plan sono più facili da distinguere.
    - Le istantanee di utilizzo trattano `minimax`, `minimax-cn` e `minimax-portal` come la stessa superficie di quota MiniMax e preferiscono l'OAuth MiniMax memorizzato prima di ricorrere alle variabili d'ambiente della chiave Coding Plan.

  </Accordion>
</AccordionGroup>

## Note

- I riferimenti ai modelli seguono il percorso di autenticazione:
  - Configurazione con chiave API: `minimax/<model>`
  - Configurazione OAuth: `minimax-portal/<model>`
- Modello chat predefinito: `MiniMax-M2.7`
- Modello chat alternativo: `MiniMax-M2.7-highspeed`
- L'onboarding e la configurazione diretta con chiave API scrivono definizioni di modelli solo testo per entrambe le varianti M2.7
- La comprensione delle immagini usa il provider multimediale `MiniMax-VL-01` di proprietà del Plugin
- Aggiorna i valori di prezzo in `models.json` se ti serve un tracciamento dei costi preciso
- Usa `openclaw models list` per confermare l'ID provider corrente, quindi cambia con `openclaw models set minimax/MiniMax-M2.7` o `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Link referral per MiniMax Coding Plan (10% di sconto): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Vedi [Provider di modelli](/it/concepts/model-providers) per le regole dei provider.
</Note>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    Questo di solito significa che il **provider MiniMax non è configurato** (nessuna voce provider corrispondente e nessun profilo di autenticazione/chiave env MiniMax trovato). Una correzione per questo rilevamento è disponibile in **2026.1.12**. Correggi così:

    - Aggiorna a **2026.1.12** (oppure esegui dalla source `main`), quindi riavvia il Gateway.
    - Esegui `openclaw configure` e seleziona un'opzione di autenticazione **MiniMax**, oppure
    - Aggiungi manualmente il blocco `models.providers.minimax` o `models.providers.minimax-portal` corrispondente, oppure
    - Imposta `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` o un profilo di autenticazione MiniMax in modo che il provider corrispondente possa essere iniettato.

    Assicurati che l'ID modello sia **case-sensitive**:

    - Percorso con chiave API: `minimax/MiniMax-M2.7` o `minimax/MiniMax-M2.7-highspeed`
    - Percorso OAuth: `minimax-portal/MiniMax-M2.7` o `minimax-portal/MiniMax-M2.7-highspeed`

    Poi ricontrolla con:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Ulteriore aiuto: [Risoluzione dei problemi](/it/help/troubleshooting) e [FAQ](/it/help/faq).
</Note>

## Correlati

<CardGroup cols={2}>
  <Card title="Selezione del modello" href="/it/concepts/model-providers" icon="layers">
    Scegliere provider, riferimenti ai modelli e comportamento di failover.
  </Card>
  <Card title="Generazione di immagini" href="/it/tools/image-generation" icon="image">
    Parametri condivisi dello strumento immagini e selezione del provider.
  </Card>
  <Card title="Generazione musicale" href="/it/tools/music-generation" icon="music">
    Parametri condivisi dello strumento musicale e selezione del provider.
  </Card>
  <Card title="Generazione video" href="/it/tools/video-generation" icon="video">
    Parametri condivisi dello strumento video e selezione del provider.
  </Card>
  <Card title="MiniMax Search" href="/it/tools/minimax-search" icon="magnifying-glass">
    Configurazione della ricerca web tramite MiniMax Coding Plan.
  </Card>
  <Card title="Risoluzione dei problemi" href="/it/help/troubleshooting" icon="wrench">
    Risoluzione generale dei problemi e FAQ.
  </Card>
</CardGroup>
