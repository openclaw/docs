---
read_when:
    - Vuoi usare i modelli OpenAI in OpenClaw
    - Vuoi l'autenticazione con abbonamento Codex invece delle API key
summary: Usare OpenAI tramite API key o abbonamento Codex in OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-04-05T14:02:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 537119853503d398f9136170ac12ecfdbd9af8aef3c4c011f8ada4c664bdaf6d
    source_path: providers/openai.md
    workflow: 15
---

# OpenAI

OpenAI fornisce API per sviluppatori per i modelli GPT. Codex supporta il **login con ChatGPT** per l'accesso in abbonamento
oppure il login con **API key** per l'accesso basato sul consumo. Codex cloud richiede il login con ChatGPT.
OpenAI supporta esplicitamente l'uso di OAuth in abbonamento in strumenti/flussi di lavoro esterni come OpenClaw.

## Stile di interazione predefinito

OpenClaw aggiunge per impostazione predefinita un piccolo overlay di prompt specifico per OpenAI sia alle
esecuzioni `openai/*` sia a quelle `openai-codex/*`. L'overlay mantiene l'assistente pronto,
collaborativo, conciso e diretto senza sostituire il prompt di sistema di base di OpenClaw.

Chiave di configurazione:

`plugins.entries.openai.config.personalityOverlay`

Valori consentiti:

- `"friendly"`: predefinito; abilita l'overlay specifico per OpenAI.
- `"off"`: disabilita l'overlay e usa solo il prompt di base di OpenClaw.

Ambito:

- Si applica ai modelli `openai/*`.
- Si applica ai modelli `openai-codex/*`.
- Non influisce sugli altri provider.

Questo comportamento è abilitato per impostazione predefinita:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personalityOverlay: "friendly",
        },
      },
    },
  },
}
```

### Disabilitare l'overlay di prompt OpenAI

Se preferisci il prompt di base di OpenClaw non modificato, disattiva l'overlay:

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personalityOverlay: "off",
        },
      },
    },
  },
}
```

Puoi anche impostarlo direttamente con la CLI di configurazione:

```bash
openclaw config set plugins.entries.openai.config.personalityOverlay off
```

## Opzione A: API key OpenAI (OpenAI Platform)

**Ideale per:** accesso API diretto e fatturazione basata sull'utilizzo.
Ottieni la tua API key dalla dashboard OpenAI.

### Configurazione CLI

```bash
openclaw onboard --auth-choice openai-api-key
# oppure in modalità non interattiva
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
delle API OpenAI. OpenClaw inoltra entrambi attraverso il percorso `openai/*` Responses.
OpenClaw sopprime intenzionalmente la riga obsoleta `openai/gpt-5.3-codex-spark`,
perché le chiamate API OpenAI dirette la rifiutano nel traffico live.

OpenClaw **non** espone `openai/gpt-5.3-codex-spark` nel percorso API OpenAI diretto.
`pi-ai` include ancora una riga integrata per quel modello, ma le richieste API OpenAI live
attualmente la rifiutano. In OpenClaw Spark viene trattato come solo Codex.

## Opzione B: abbonamento OpenAI Code (Codex)

**Ideale per:** usare l'accesso in abbonamento ChatGPT/Codex invece di un'API key.
Codex cloud richiede il login con ChatGPT, mentre la CLI Codex supporta il login con ChatGPT o con API key.

### Configurazione CLI (Codex OAuth)

```bash
# Esegui Codex OAuth nella procedura guidata
openclaw onboard --auth-choice openai-codex

# Oppure esegui direttamente OAuth
openclaw models auth login --provider openai-codex
```

### Esempio di configurazione (abbonamento Codex)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

La documentazione attuale di OpenAI per Codex elenca `gpt-5.4` come modello Codex attuale. OpenClaw
lo mappa a `openai-codex/gpt-5.4` per l'uso con OAuth ChatGPT/Codex.

Se l'onboarding riutilizza un login Codex CLI esistente, tali credenziali restano
gestite da Codex CLI. Alla scadenza, OpenClaw rilegge prima la sorgente Codex esterna
e, quando il provider può aggiornarla, riscrive la credenziale aggiornata
nell'archiviazione Codex invece di prenderne possesso in una copia separata solo OpenClaw.

Se il tuo account Codex ha diritto a Codex Spark, OpenClaw supporta anche:

- `openai-codex/gpt-5.3-codex-spark`

OpenClaw tratta Codex Spark come solo Codex. Non espone un percorso diretto
`openai/gpt-5.3-codex-spark` con API key.

OpenClaw preserva anche `openai-codex/gpt-5.3-codex-spark` quando `pi-ai`
lo rileva. Consideralo dipendente dai diritti e sperimentale: Codex Spark è
separato da GPT-5.4 `/fast`, e la disponibilità dipende dall'account Codex /
ChatGPT connesso.

### Limite della finestra di contesto Codex

OpenClaw tratta i metadati del modello Codex e il limite di contesto runtime come
valori separati.

Per `openai-codex/gpt-5.4`:

- `contextWindow` nativo: `1050000`
- limite predefinito runtime `contextTokens`: `272000`

Questo mantiene veritieri i metadati del modello preservando al tempo stesso la
finestra runtime predefinita più piccola, che in pratica ha caratteristiche di latenza e qualità migliori.

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

Usa `contextWindow` solo quando stai dichiarando o sovrascrivendo metadati nativi del modello.
Usa `contextTokens` quando vuoi limitare il budget di contesto runtime.

### Trasporto predefinito

OpenClaw usa `pi-ai` per lo streaming del modello. Sia per `openai/*` sia per
`openai-codex/*`, il trasporto predefinito è `"auto"` (prima WebSocket, poi fallback
SSE).

In modalità `"auto"`, OpenClaw ritenta anche un errore WebSocket iniziale e ripetibile
prima di ripiegare su SSE. La modalità `"websocket"` forzata continua invece a mostrare direttamente
gli errori di trasporto invece di nasconderli dietro il fallback.

Dopo un errore WebSocket di connessione o inizio turno in modalità `"auto"`, OpenClaw contrassegna
il percorso WebSocket di quella sessione come degradato per circa 60 secondi e invia
i turni successivi tramite SSE durante il raffreddamento invece di oscillare
tra i trasporti.

Per gli endpoint nativi della famiglia OpenAI (`openai/*`, `openai-codex/*` e Azure
OpenAI Responses), OpenClaw allega anche uno stato stabile di identità di sessione e turno
alle richieste così retry, riconnessioni e fallback SSE restano allineati alla stessa
identità di conversazione. Sui percorsi nativi della famiglia OpenAI questo include header stabili di identità richiesta di sessione/turno più metadati di trasporto corrispondenti.

OpenClaw normalizza anche i contatori di utilizzo OpenAI tra le varianti di trasporto prima
che raggiungano le superfici di sessione/stato. Il traffico nativo OpenAI/Codex Responses può
riportare l'utilizzo come `input_tokens` / `output_tokens` oppure
`prompt_tokens` / `completion_tokens`; OpenClaw li tratta come gli stessi contatori
di input e output per `/status`, `/usage` e i log di sessione. Quando il traffico nativo
WebSocket omette `total_tokens` (o riporta `0`), OpenClaw usa come fallback il totale normalizzato input + output così le visualizzazioni session/status restano popolate.

Puoi impostare `agents.defaults.models.<provider/model>.params.transport`:

- `"sse"`: forza SSE
- `"websocket"`: forza WebSocket
- `"auto"`: prova WebSocket, poi ripiega su SSE

Per `openai/*` (API Responses), OpenClaw abilita per impostazione predefinita anche il warm-up WebSocket
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

### OpenAI e Codex priority processing

L'API OpenAI espone il priority processing tramite `service_tier=priority`. In
OpenClaw, imposta `agents.defaults.models["<provider>/<model>"].params.serviceTier`
per inoltrare quel campo agli endpoint nativi OpenAI/Codex Responses.

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

OpenClaw inoltra `params.serviceTier` sia alle richieste dirette `openai/*` Responses
sia alle richieste `openai-codex/*` Codex Responses quando tali modelli puntano
agli endpoint nativi OpenAI/Codex.

Comportamento importante:

- `openai/*` diretto deve puntare a `api.openai.com`
- `openai-codex/*` deve puntare a `chatgpt.com/backend-api`
- se instradi uno dei due provider tramite un altro `baseUrl` o proxy, OpenClaw lascia invariato `service_tier`

### Modalità veloce OpenAI

OpenClaw espone un interruttore condiviso della modalità veloce sia per le sessioni `openai/*` sia per
quelle `openai-codex/*`:

- Chat/UI: `/fast status|on|off`
- Configurazione: `agents.defaults.models["<provider>/<model>"].params.fastMode`

Quando la modalità veloce è abilitata, OpenClaw la mappa al priority processing OpenAI:

- le chiamate dirette `openai/*` Responses verso `api.openai.com` inviano `service_tier = "priority"`
- anche le chiamate `openai-codex/*` Responses verso `chatgpt.com/backend-api` inviano `service_tier = "priority"`
- i valori `service_tier` già presenti nel payload vengono preservati
- la modalità veloce non riscrive `reasoning` né `text.verbosity`

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

Gli override di sessione hanno la precedenza sulla configurazione. La cancellazione dell'override di sessione nella UI Sessions
riporta la sessione al valore predefinito configurato.

### Percorsi nativi OpenAI rispetto ai percorsi compatibili OpenAI

OpenClaw tratta gli endpoint diretti OpenAI, Codex e Azure OpenAI in modo diverso
dai proxy generici compatibili OpenAI `/v1`:

- i percorsi nativi `openai/*`, `openai-codex/*` e Azure OpenAI mantengono
  intatto `reasoning: { effort: "none" }` quando disabiliti esplicitamente il reasoning
- i percorsi nativi della famiglia OpenAI usano per impostazione predefinita gli schemi degli strumenti in modalità strict
- gli header nascosti di attribuzione OpenClaw (`originator`, `version` e
  `User-Agent`) vengono allegati solo agli host nativi OpenAI verificati
  (`api.openai.com`) e agli host nativi Codex (`chatgpt.com/backend-api`)
- i percorsi nativi OpenAI/Codex mantengono il request shaping solo OpenAI come
  `service_tier`, `store` di Responses, payload di compatibilità OpenAI per il reasoning e
  hint della prompt cache
- i percorsi compatibili OpenAI in stile proxy mantengono il comportamento di compatibilità più permissivo e
  non forzano schemi degli strumenti strict, request shaping solo nativo né header nascosti
  di attribuzione OpenAI/Codex

Azure OpenAI rimane nel gruppo di instradamento nativo per il comportamento di trasporto e compatibilità, ma non riceve gli header nascosti di attribuzione OpenAI/Codex.

Questo preserva l'attuale comportamento nativo di OpenAI Responses senza imporre vecchi
shim compatibili OpenAI ai backend `/v1` di terze parti.

### Compattazione lato server OpenAI Responses

Per i modelli OpenAI Responses diretti (`openai/*` che usano `api: "openai-responses"` con
`baseUrl` su `api.openai.com`), OpenClaw ora abilita automaticamente gli hint di payload
di compattazione lato server di OpenAI:

- forza `store: true` (a meno che la compatibilità del modello non imposti `supportsStore: false`)
- inietta `context_management: [{ type: "compaction", compact_threshold: ... }]`

Per impostazione predefinita, `compact_threshold` è il `70%` di `contextWindow` del modello (oppure `80000`
se non disponibile).

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
I modelli OpenAI Responses diretti continuano comunque a forzare `store: true` a meno che la compatibilità non imposti
`supportsStore: false`.

## Note

- I riferimenti ai modelli usano sempre `provider/model` (vedi [/concepts/models](/concepts/models)).
- I dettagli auth + le regole di riutilizzo sono in [/concepts/oauth](/concepts/oauth).
