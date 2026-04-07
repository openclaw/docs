---
read_when:
    - Vuoi usare i modelli OpenAI in OpenClaw
    - Vuoi usare l'autenticazione con abbonamento Codex invece delle chiavi API
summary: Usa OpenAI tramite chiavi API o abbonamento Codex in OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-07T08:17:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6a2ce1ce5f085fe55ec50b8d20359180b9002c9730820cd5b0e011c3bf807b64
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI fornisce API per sviluppatori per i modelli GPT. Codex supporta l'**accesso con ChatGPT** per l'accesso in abbonamento
oppure l'accesso con **chiave API** per l'accesso basato sul consumo. Codex cloud richiede l'accesso con ChatGPT.
OpenAI supporta esplicitamente l'uso di OAuth dell'abbonamento in strumenti/workflow esterni come OpenClaw.

## Stile di interazione predefinito

OpenClaw può aggiungere una piccola sovrapposizione di prompt specifica per OpenAI sia per le esecuzioni `openai/*` sia per quelle
`openai-codex/*`. Per impostazione predefinita, la sovrapposizione mantiene l'assistente disponibile,
collaborativo, conciso, diretto e un po' più espressivo dal punto di vista emotivo
senza sostituire il prompt di sistema base di OpenClaw. La sovrapposizione amichevole
consente anche l'uso occasionale di emoji quando si adattano in modo naturale, mantenendo comunque
l'output complessivamente conciso.

Chiave di configurazione:

`plugins.entries.openai.config.personality`

Valori consentiti:

- `"friendly"`: predefinito; abilita la sovrapposizione specifica per OpenAI.
- `"on"`: alias di `"friendly"`.
- `"off"`: disabilita la sovrapposizione e usa solo il prompt base di OpenClaw.

Ambito:

- Si applica ai modelli `openai/*`.
- Si applica ai modelli `openai-codex/*`.
- Non influisce sugli altri provider.

Questo comportamento è attivo per impostazione predefinita. Mantieni `"friendly"` esplicitamente se vuoi che
sopravviva a future modifiche locali della configurazione:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "friendly",
        },
      },
    },
  },
}
```

### Disabilitare la sovrapposizione di prompt OpenAI

Se vuoi il prompt base di OpenClaw non modificato, imposta la sovrapposizione su `"off"`:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "off",
        },
      },
    },
  },
}
```

Puoi anche impostarlo direttamente con la CLI di configurazione:

```bash
openclaw config set plugins.entries.openai.config.personality off
```

OpenClaw normalizza questa impostazione senza distinzione tra maiuscole e minuscole a runtime, quindi valori come
`"Off"` disabilitano comunque la sovrapposizione amichevole.

## Opzione A: chiave API OpenAI (OpenAI Platform)

**Ideale per:** accesso diretto alle API e fatturazione basata sull'utilizzo.
Ottieni la tua chiave API dalla dashboard OpenAI.

Riepilogo del routing:

- `openai/gpt-5.4` = route API diretta di OpenAI Platform
- Richiede `OPENAI_API_KEY` (o configurazione equivalente del provider OpenAI)
- In OpenClaw, l'accesso ChatGPT/Codex viene instradato tramite `openai-codex/*`, non `openai/*`

### Configurazione CLI

```bash
openclaw onboard --auth-choice openai-api-key
# oppure non interattivo
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

### Esempio di configurazione

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

La documentazione attuale dei modelli API di OpenAI elenca `gpt-5.4` e `gpt-5.4-pro` per l'uso diretto
delle API OpenAI. OpenClaw inoltra entrambi tramite il percorso `openai/*` Responses.
OpenClaw sopprime intenzionalmente la riga obsoleta `openai/gpt-5.3-codex-spark`,
perché le chiamate API dirette a OpenAI la rifiutano nel traffico live.

OpenClaw **non** espone `openai/gpt-5.3-codex-spark` sul percorso API diretto di OpenAI.
`pi-ai` include ancora una riga integrata per quel modello, ma le richieste API OpenAI live
la rifiutano attualmente. In OpenClaw Spark è trattato come solo Codex.

## Generazione di immagini

Il plugin `openai` incluso registra anche la generazione di immagini tramite lo
strumento condiviso `image_generate`.

- Modello immagine predefinito: `openai/gpt-image-1`
- Generazione: fino a 4 immagini per richiesta
- Modalità modifica: abilitata, fino a 5 immagini di riferimento
- Supporta `size`
- Limitazione attuale specifica di OpenAI: OpenClaw oggi non inoltra le sostituzioni `aspectRatio` o
  `resolution` alla OpenAI Images API

Per usare OpenAI come provider immagine predefinito:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
      },
    },
  },
}
```

Vedi [Generazione di immagini](/it/tools/image-generation) per i parametri condivisi
dello strumento, la selezione del provider e il comportamento di failover.

## Generazione video

Il plugin `openai` incluso registra anche la generazione video tramite lo strumento condiviso
`video_generate`.

- Modello video predefinito: `openai/sora-2`
- Modalità: text-to-video, image-to-video e flussi di riferimento/modifica a video singolo
- Limiti attuali: 1 immagine o 1 input video di riferimento
- Limitazione attuale specifica di OpenAI: OpenClaw attualmente inoltra solo le sostituzioni `size`
  per la generazione video nativa di OpenAI. Le sostituzioni opzionali non supportate
  come `aspectRatio`, `resolution`, `audio` e `watermark` vengono ignorate
  e restituite come avviso dello strumento.

Per usare OpenAI come provider video predefinito:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openai/sora-2",
      },
    },
  },
}
```

Vedi [Generazione video](/it/tools/video-generation) per i parametri condivisi
dello strumento, la selezione del provider e il comportamento di failover.

## Opzione B: abbonamento OpenAI Code (Codex)

**Ideale per:** usare l'accesso in abbonamento ChatGPT/Codex invece di una chiave API.
Codex cloud richiede l'accesso con ChatGPT, mentre la CLI Codex supporta l'accesso con ChatGPT o con chiave API.

Riepilogo del routing:

- `openai-codex/gpt-5.4` = route OAuth ChatGPT/Codex
- Usa l'accesso ChatGPT/Codex, non una chiave API diretta di OpenAI Platform
- I limiti lato provider per `openai-codex/*` possono differire dall'esperienza web/app di ChatGPT

### Configurazione CLI (Codex OAuth)

```bash
# Esegui Codex OAuth nella procedura guidata
openclaw onboard --auth-choice openai-codex

# Oppure esegui OAuth direttamente
openclaw models auth login --provider openai-codex
```

### Esempio di configurazione (abbonamento Codex)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

La documentazione attuale di Codex di OpenAI elenca `gpt-5.4` come attuale modello Codex. OpenClaw
lo mappa a `openai-codex/gpt-5.4` per l'uso con OAuth ChatGPT/Codex.

Questa route è intenzionalmente separata da `openai/gpt-5.4`. Se vuoi il
percorso API diretto di OpenAI Platform, usa `openai/*` con una chiave API. Se vuoi
l'accesso ChatGPT/Codex, usa `openai-codex/*`.

Se l'onboarding riutilizza un accesso CLI Codex esistente, quelle credenziali restano
gestite dalla CLI Codex. Alla scadenza, OpenClaw rilegge prima l'origine Codex esterna
e, quando il provider può aggiornarla, riscrive la credenziale aggiornata
nell'archiviazione Codex invece di assumerne il controllo in una copia separata solo OpenClaw.

Se il tuo account Codex ha diritto a Codex Spark, OpenClaw supporta anche:

- `openai-codex/gpt-5.3-codex-spark`

OpenClaw tratta Codex Spark come solo Codex. Non espone un percorso diretto
`openai/gpt-5.3-codex-spark` con chiave API.

OpenClaw preserva anche `openai-codex/gpt-5.3-codex-spark` quando `pi-ai`
lo rileva. Trattalo come dipendente dai diritti e sperimentale: Codex Spark è
separato da GPT-5.4 `/fast`, e la disponibilità dipende dall'account Codex /
ChatGPT connesso.

### Limite della finestra di contesto di Codex

OpenClaw tratta i metadati del modello Codex e il limite del contesto runtime come
valori separati.

Per `openai-codex/gpt-5.4`:

- `contextWindow` nativo: `1050000`
- limite predefinito runtime `contextTokens`: `272000`

Questo mantiene veritieri i metadati del modello, preservando allo stesso tempo la finestra runtime
predefinita più piccola che in pratica ha caratteristiche migliori di latenza e qualità.

Se vuoi un limite effettivo diverso, imposta `models.providers.<provider>.models[].contextTokens`:

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [
          {
            id: "gpt-5.4",
            contextTokens: 160000,
          },
        ],
      },
    },
  },
}
```

Usa `contextWindow` solo quando dichiari o sovrascrivi metadati nativi del modello.
Usa `contextTokens` quando vuoi limitare il budget del contesto runtime.

### Trasporto predefinito

OpenClaw usa `pi-ai` per lo streaming dei modelli. Sia per `openai/*` sia per
`openai-codex/*`, il trasporto predefinito è `"auto"` (prima WebSocket, poi fallback
SSE).

In modalità `"auto"`, OpenClaw riprova anche un errore WebSocket iniziale e riprovabile
prima di passare a SSE. La modalità `"websocket"` forzata espone comunque gli errori di trasporto
direttamente invece di nasconderli dietro al fallback.

Dopo un errore WebSocket di connessione o nelle prime fasi del turno in modalità `"auto"`, OpenClaw contrassegna
il percorso WebSocket di quella sessione come degradato per circa 60 secondi e invia
i turni successivi tramite SSE durante il cooldown invece di oscillare continuamente tra
i trasporti.

Per gli endpoint nativi della famiglia OpenAI (`openai/*`, `openai-codex/*` e Azure
OpenAI Responses), OpenClaw allega anche uno stato stabile di identità di sessione e turno
alle richieste, così retry, riconnessioni e fallback SSE restano allineati alla stessa
identità di conversazione. Sulle route native della famiglia OpenAI questo include header stabili di identità
di richiesta di sessione/turno più metadati di trasporto corrispondenti.

OpenClaw normalizza anche i contatori di utilizzo OpenAI tra le varianti di trasporto prima
che raggiungano le superfici session/status. Il traffico nativo OpenAI/Codex Responses può
riportare l'utilizzo come `input_tokens` / `output_tokens` oppure
`prompt_tokens` / `completion_tokens`; OpenClaw li tratta come gli stessi contatori di input
e output per `/status`, `/usage` e i log di sessione. Quando il traffico nativo
WebSocket omette `total_tokens` (o riporta `0`), OpenClaw ripiega sul totale normalizzato input + output
così le viste session/status restano popolate.

Puoi impostare `agents.defaults.models.<provider/model>.params.transport`:

- `"sse"`: forza SSE
- `"websocket"`: forza WebSocket
- `"auto"`: prova WebSocket, poi passa a SSE

Per `openai/*` (Responses API), OpenClaw abilita anche per impostazione predefinita il warm-up WebSocket
(`openaiWsWarmup: true`) quando viene usato il trasporto WebSocket.

Documentazione OpenAI correlata:

- [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
- [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

```json5
{
  agents: {
    defaults: {
      model: { primary: "openai-codex/gpt-5.4" },
      models: {
        "openai-codex/gpt-5.4": {
          params: {
            transport: "auto",
          },
        },
      },
    },
  },
}
```

### Warm-up WebSocket OpenAI

La documentazione OpenAI descrive il warm-up come facoltativo. OpenClaw lo abilita per impostazione predefinita per
`openai/*` per ridurre la latenza del primo turno quando si usa il trasporto WebSocket.

### Disabilitare il warm-up

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: false,
          },
        },
      },
    },
  },
}
```

### Abilitare esplicitamente il warm-up

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: true,
          },
        },
      },
    },
  },
}
```

### Elaborazione prioritaria OpenAI e Codex

L'API di OpenAI espone l'elaborazione prioritaria tramite `service_tier=priority`. In
OpenClaw, imposta `agents.defaults.models["<provider>/<model>"].params.serviceTier`
per inoltrare quel campo sugli endpoint nativi OpenAI/Codex Responses.

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

I valori supportati sono `auto`, `default`, `flex` e `priority`.

OpenClaw inoltra `params.serviceTier` sia alle richieste Responses dirette `openai/*`
sia alle richieste Codex Responses `openai-codex/*` quando quei modelli puntano
agli endpoint nativi OpenAI/Codex.

Comportamento importante:

- `openai/*` diretto deve puntare a `api.openai.com`
- `openai-codex/*` deve puntare a `chatgpt.com/backend-api`
- se instradi uno dei due provider tramite un'altra base URL o proxy, OpenClaw lascia `service_tier` invariato

### Modalità veloce OpenAI

OpenClaw espone un interruttore condiviso di modalità veloce sia per le sessioni `openai/*` sia per quelle
`openai-codex/*`:

- Chat/UI: `/fast status|on|off`
- Config: `agents.defaults.models["<provider>/<model>"].params.fastMode`

Quando la modalità veloce è abilitata, OpenClaw la mappa all'elaborazione prioritaria OpenAI:

- le chiamate Responses dirette `openai/*` a `api.openai.com` inviano `service_tier = "priority"`
- anche le chiamate Responses `openai-codex/*` a `chatgpt.com/backend-api` inviano `service_tier = "priority"`
- i valori `service_tier` già presenti nel payload vengono preservati
- la modalità veloce non riscrive `reasoning` o `text.verbosity`

Per GPT 5.4 in particolare, la configurazione più comune è:

- inviare `/fast on` in una sessione che usa `openai/gpt-5.4` o `openai-codex/gpt-5.4`
- oppure impostare `agents.defaults.models["openai/gpt-5.4"].params.fastMode = true`
- se usi anche Codex OAuth, imposta anche `agents.defaults.models["openai-codex/gpt-5.4"].params.fastMode = true`

Esempio:

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            fastMode: true,
          },
        },
      },
    },
  },
}
```

Le sostituzioni di sessione hanno la precedenza sulla configurazione. La cancellazione della sostituzione di sessione nell'interfaccia Sessions UI
riporta la sessione al valore predefinito configurato.

### Route OpenAI native rispetto a route compatibili con OpenAI

OpenClaw tratta gli endpoint diretti OpenAI, Codex e Azure OpenAI in modo diverso
dai proxy generici compatibili con OpenAI `/v1`:

- le route native `openai/*`, `openai-codex/*` e Azure OpenAI mantengono
  intatto `reasoning: { effort: "none" }` quando disabiliti esplicitamente il reasoning
- le route native della famiglia OpenAI usano per impostazione predefinita schemi degli strumenti in modalità strict
- gli header nascosti di attribuzione OpenClaw (`originator`, `version` e
  `User-Agent`) vengono allegati solo sugli host nativi OpenAI verificati
  (`api.openai.com`) e sugli host Codex nativi (`chatgpt.com/backend-api`)
- le route native OpenAI/Codex mantengono il request shaping specifico di OpenAI come
  `service_tier`, `store` di Responses, payload di compatibilità del reasoning OpenAI e
  suggerimenti per la prompt cache
- le route in stile proxy compatibili con OpenAI mantengono il comportamento compatibile più permissivo e non
  forzano schemi degli strumenti strict, request shaping solo nativo o header nascosti
  di attribuzione OpenAI/Codex

Azure OpenAI resta nel gruppo di routing nativo per il comportamento di trasporto e compatibilità, ma non riceve gli header nascosti di attribuzione OpenAI/Codex.

Questo preserva l'attuale comportamento nativo di OpenAI Responses senza imporre
vecchi shim compatibili con OpenAI ai backend `/v1` di terze parti.

### Compattazione lato server di OpenAI Responses

Per i modelli diretti OpenAI Responses (`openai/*` che usano `api: "openai-responses"` con
`baseUrl` su `api.openai.com`), OpenClaw ora abilita automaticamente i suggerimenti di payload
per la compattazione lato server di OpenAI:

- Forza `store: true` (a meno che la compatibilità del modello imposti `supportsStore: false`)
- Inietta `context_management: [{ type: "compaction", compact_threshold: ... }]`

Per impostazione predefinita, `compact_threshold` è `70%` di `contextWindow` del modello (oppure `80000`
quando non disponibile).

### Abilitare esplicitamente la compattazione lato server

Usa questa opzione quando vuoi forzare l'iniezione di `context_management` su modelli
Responses compatibili (ad esempio Azure OpenAI Responses):

```json5
{
  agents: {
    defaults: {
      models: {
        "azure-openai-responses/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
          },
        },
      },
    },
  },
}
```

### Abilitare con una soglia personalizzata

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: true,
            responsesCompactThreshold: 120000,
          },
        },
      },
    },
  },
}
```

### Disabilitare la compattazione lato server

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            responsesServerCompaction: false,
          },
        },
      },
    },
  },
}
```

`responsesServerCompaction` controlla solo l'iniezione di `context_management`.
I modelli diretti OpenAI Responses continuano a forzare `store: true` a meno che la compatibilità non imposti
`supportsStore: false`.

## Note

- I riferimenti ai modelli usano sempre `provider/model` (vedi [/concepts/models](/it/concepts/models)).
- I dettagli di autenticazione + le regole di riutilizzo si trovano in [/concepts/oauth](/it/concepts/oauth).
