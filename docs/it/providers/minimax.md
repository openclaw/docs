---
read_when:
    - Vuoi usare i modelli MiniMax in OpenClaw
    - Ti serve una guida di configurazione per MiniMax
summary: Usa i modelli MiniMax in OpenClaw
title: MiniMax
x-i18n:
    generated_at: "2026-04-24T08:57:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: f2729e9e9f866e66a6587d6c58f6116abae2fc09a1f50e5038e1c25bed0a82f2
    source_path: providers/minimax.md
    workflow: 15
---

Il provider MiniMax di OpenClaw usa come predefinito **MiniMax M2.7**.

MiniMax fornisce anche:

- Sintesi vocale inclusa tramite T2A v2
- Comprensione delle immagini inclusa tramite `MiniMax-VL-01`
- Generazione musicale inclusa tramite `music-2.5+`
- `web_search` incluso tramite l'API di ricerca MiniMax Coding Plan

Suddivisione del provider:

| ID provider | Auth | Capacità |
| ---------------- | ------- | --------------------------------------------------------------- |
| `minimax` | Chiave API | Testo, generazione immagini, comprensione immagini, speech, ricerca web |
| `minimax-portal` | OAuth | Testo, generazione immagini, comprensione immagini |

## Catalogo integrato

| Modello | Tipo | Descrizione |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7` | Chat (reasoning) | Modello hosted di reasoning predefinito |
| `MiniMax-M2.7-highspeed` | Chat (reasoning) | Tier di reasoning M2.7 più veloce |
| `MiniMax-VL-01` | Vision | Modello di comprensione immagini |
| `image-01` | Generazione immagini | Text-to-image e modifica image-to-image |
| `music-2.5+` | Generazione musicale | Modello musicale predefinito |
| `music-2.5` | Generazione musicale | Tier precedente di generazione musicale |
| `music-2.0` | Generazione musicale | Tier legacy di generazione musicale |
| `MiniMax-Hailuo-2.3` | Generazione video | Flussi text-to-video e con immagine di riferimento |

## Per iniziare

Scegli il metodo auth preferito e segui i passaggi di configurazione.

<Tabs>
  <Tab title="OAuth (Coding Plan)">
    **Ideale per:** configurazione rapida con MiniMax Coding Plan via OAuth, senza chiave API.

    <Tabs>
      <Tab title="Internazionale">
        <Steps>
          <Step title="Esegui l'onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            Questo autentica contro `api.minimax.io`.
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

            Questo autentica contro `api.minimaxi.com`.
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
    Le configurazioni OAuth usano l'id provider `minimax-portal`. I riferimenti dei modelli seguono la forma `minimax-portal/MiniMax-M2.7`.
    </Note>

    <Tip>
    Link referral per MiniMax Coding Plan (10% di sconto): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="Chiave API">
    **Ideale per:** MiniMax hosted con API compatibile con Anthropic.

    <Tabs>
      <Tab title="Internazionale">
        <Steps>
          <Step title="Esegui l'onboarding">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            Questo configura `api.minimax.io` come base URL.
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

            Questo configura `api.minimaxi.com` come base URL.
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
                input: ["text", "image"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text", "image"],
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
    Nel percorso streaming compatibile con Anthropic, OpenClaw disattiva per impostazione predefinita il thinking di MiniMax a meno che tu non imposti esplicitamente `thinking`. L'endpoint streaming di MiniMax emette `reasoning_content` in chunk delta in stile OpenAI invece che in blocchi di thinking nativi Anthropic, il che può far trapelare reasoning interno nell'output visibile se lasciato implicitamente abilitato.
    </Warning>

    <Note>
    Le configurazioni con chiave API usano l'id provider `minimax`. I riferimenti dei modelli seguono la forma `minimax/MiniMax-M2.7`.
    </Note>

  </Tab>
</Tabs>

## Configurare tramite `openclaw configure`

Usa la procedura guidata interattiva di configurazione per impostare MiniMax senza modificare JSON:

<Steps>
  <Step title="Avvia la procedura guidata">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="Seleziona Model/auth">
    Scegli **Model/auth** dal menu.
  </Step>
  <Step title="Scegli un'opzione auth MiniMax">
    Seleziona una delle opzioni MiniMax disponibili:

    | Scelta auth | Descrizione |
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

### Generazione immagini

Il Plugin MiniMax registra il modello `image-01` per lo strumento `image_generate`. Supporta:

- **Generazione text-to-image** con controllo dell'aspect ratio
- **Modifica image-to-image** (immagine di riferimento) con controllo dell'aspect ratio
- Fino a **9 immagini in uscita** per richiesta
- Fino a **1 immagine di riferimento** per richiesta di modifica
- Aspect ratio supportati: `1:1`, `16:9`, `4:3`, `3:2`, `2:3`, `3:4`, `9:16`, `21:9`

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
invece il percorso auth incluso `minimax-portal`.

Quando l'onboarding o la configurazione con chiave API scrivono voci esplicite `models.providers.minimax`,
OpenClaw materializza `MiniMax-M2.7` e
`MiniMax-M2.7-highspeed` con `input: ["text", "image"]`.

Il catalogo testuale MiniMax integrato e incluso rimane metadato solo testo finché
non esiste quella configurazione esplicita del provider. La comprensione delle immagini è esposta separatamente
tramite il provider media `MiniMax-VL-01` posseduto dal Plugin.

<Note>
Vedi [Image Generation](/it/tools/image-generation) per parametri condivisi dello strumento, selezione del provider e comportamento di failover.
</Note>

### Generazione musicale

Il Plugin `minimax` incluso registra anche la generazione musicale tramite lo strumento condiviso
`music_generate`.

- Modello musicale predefinito: `minimax/music-2.5+`
- Supporta anche `minimax/music-2.5` e `minimax/music-2.0`
- Controlli del prompt: `lyrics`, `instrumental`, `durationSeconds`
- Formato di output: `mp3`
- Le esecuzioni supportate da sessione vengono staccate tramite il flusso condiviso task/status, incluso `action: "status"`

Per usare MiniMax come provider musicale predefinito:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.5+",
      },
    },
  },
}
```

<Note>
Vedi [Music Generation](/it/tools/music-generation) per parametri condivisi dello strumento, selezione del provider e comportamento di failover.
</Note>

### Generazione video

Il Plugin `minimax` incluso registra anche la generazione video tramite lo strumento condiviso
`video_generate`.

- Modello video predefinito: `minimax/MiniMax-Hailuo-2.3`
- Modalità: text-to-video e flussi con immagine singola di riferimento
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
Vedi [Video Generation](/it/tools/video-generation) per parametri condivisi dello strumento, selezione del provider e comportamento di failover.
</Note>

### Comprensione delle immagini

Il Plugin MiniMax registra la comprensione delle immagini separatamente dal catalogo
testuale:

| ID provider | Modello immagine predefinito |
| ---------------- | ------------------- |
| `minimax` | `MiniMax-VL-01` |
| `minimax-portal` | `MiniMax-VL-01` |

Ecco perché l'instradamento automatico dei media può usare la comprensione immagini di MiniMax anche
quando il catalogo incluso del provider testuale mostra ancora solo riferimenti chat M2.7 di testo.

### Ricerca web

Il Plugin MiniMax registra anche `web_search` tramite l'API di ricerca MiniMax Coding Plan.

- Id provider: `minimax`
- Risultati strutturati: titoli, URL, snippet, query correlate
- Variabile env preferita: `MINIMAX_CODE_PLAN_KEY`
- Alias env accettato: `MINIMAX_CODING_API_KEY`
- Fallback di compatibilità: `MINIMAX_API_KEY` quando punta già a un token coding-plan
- Riutilizzo della regione: `plugins.entries.minimax.config.webSearch.region`, poi `MINIMAX_API_HOST`, quindi i base URL del provider MiniMax
- La ricerca resta sull'id provider `minimax`; la configurazione OAuth CN/global può comunque orientare indirettamente la regione tramite `models.providers.minimax-portal.baseUrl`

La configurazione si trova in `plugins.entries.minimax.config.webSearch.*`.

<Note>
Vedi [MiniMax Search](/it/tools/minimax-search) per la configurazione completa e l'uso della ricerca web.
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
    | `agents.defaults.models` | Alias dei modelli che vuoi nella allowlist |
    | `models.mode` | Mantieni `merge` se vuoi aggiungere MiniMax accanto agli elementi integrati |
  </Accordion>

  <Accordion title="Valori predefiniti del thinking">
    Su `api: "anthropic-messages"`, OpenClaw inserisce `thinking: { type: "disabled" }` a meno che il thinking non sia già impostato esplicitamente in params/config.

    Questo impedisce all'endpoint streaming di MiniMax di emettere `reasoning_content` in chunk delta in stile OpenAI, che farebbero trapelare reasoning interno nell'output visibile.

  </Accordion>

  <Accordion title="Modalità veloce">
    `/fast on` oppure `params.fastMode: true` riscrive `MiniMax-M2.7` in `MiniMax-M2.7-highspeed` sul percorso di streaming compatibile con Anthropic.
  </Accordion>

  <Accordion title="Esempio di fallback">
    **Ideale per:** mantenere come primario il tuo miglior modello di ultima generazione, con failover su MiniMax M2.7. L'esempio sotto usa Opus come primario concreto; sostituiscilo con il modello primario di ultima generazione che preferisci.

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

  <Accordion title="Dettagli d'uso di Coding Plan">
    - API di utilizzo Coding Plan: `https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains` (richiede una chiave coding plan).
    - OpenClaw normalizza l'utilizzo del coding plan MiniMax nello stesso formato `% left` usato dagli altri provider. I campi grezzi `usage_percent` / `usagePercent` di MiniMax rappresentano la quota residua, non la quota consumata, quindi OpenClaw li inverte. I campi basati sul conteggio hanno la precedenza quando presenti.
    - Quando l'API restituisce `model_remains`, OpenClaw preferisce la voce del modello chat, ricava l'etichetta della finestra da `start_time` / `end_time` quando necessario e include il nome del modello selezionato nell'etichetta del piano in modo che le finestre di coding plan siano più facili da distinguere.
    - Le istantanee di utilizzo trattano `minimax`, `minimax-cn` e `minimax-portal` come la stessa superficie di quota MiniMax e preferiscono il MiniMax OAuth memorizzato prima di usare come fallback le variabili env della chiave Coding Plan.
  </Accordion>
</AccordionGroup>

## Note

- I riferimenti dei modelli seguono il percorso auth:
  - Configurazione con chiave API: `minimax/<model>`
  - Configurazione OAuth: `minimax-portal/<model>`
- Modello chat predefinito: `MiniMax-M2.7`
- Modello chat alternativo: `MiniMax-M2.7-highspeed`
- L'onboarding e la configurazione diretta con chiave API scrivono definizioni esplicite del modello con `input: ["text", "image"]` per entrambe le varianti M2.7
- Il catalogo del provider incluso attualmente espone i riferimenti chat come metadati solo testo finché non esiste una configurazione esplicita del provider MiniMax
- Aggiorna i valori di prezzo in `models.json` se ti serve un tracciamento preciso dei costi
- Usa `openclaw models list` per confermare l'id provider corrente, poi cambia con `openclaw models set minimax/MiniMax-M2.7` oppure `openclaw models set minimax-portal/MiniMax-M2.7`

<Tip>
Link referral per MiniMax Coding Plan (10% di sconto): [MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
Vedi [Model providers](/it/concepts/model-providers) per le regole dei provider.
</Note>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title='"Unknown model: minimax/MiniMax-M2.7"'>
    Di solito significa che il **provider MiniMax non è configurato** (nessuna voce provider corrispondente e nessun profilo auth/chiave env MiniMax trovato). Una correzione per questo rilevamento è disponibile in **2026.1.12**. Correggi in uno di questi modi:

    - Aggiorna a **2026.1.12** (oppure esegui da sorgente `main`), poi riavvia il gateway.
    - Esegui `openclaw configure` e seleziona un'opzione auth **MiniMax**, oppure
    - Aggiungi manualmente il blocco corrispondente `models.providers.minimax` o `models.providers.minimax-portal`, oppure
    - Imposta `MINIMAX_API_KEY`, `MINIMAX_OAUTH_TOKEN` o un profilo auth MiniMax in modo che il provider corrispondente possa essere inserito.

    Assicurati che l'id del modello sia **case-sensitive**:

    - Percorso con chiave API: `minimax/MiniMax-M2.7` oppure `minimax/MiniMax-M2.7-highspeed`
    - Percorso OAuth: `minimax-portal/MiniMax-M2.7` oppure `minimax-portal/MiniMax-M2.7-highspeed`

    Poi ricontrolla con:

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
Altro aiuto: [Troubleshooting](/it/help/troubleshooting) e [FAQ](/it/help/faq).
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
    Configurazione della ricerca web tramite MiniMax Coding Plan.
  </Card>
  <Card title="Troubleshooting" href="/it/help/troubleshooting" icon="wrench">
    Risoluzione generale dei problemi e FAQ.
  </Card>
</CardGroup>
