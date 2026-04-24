---
read_when:
    - Vuoi configurare provider di ricerca in memoria o modelli di embedding
    - Vuoi configurare il backend QMD
    - Vuoi regolare la ricerca ibrida, MMR o il decadimento temporale
    - Vuoi abilitare l'indicizzazione multimodale della memoria
summary: Tutte le opzioni di configurazione per ricerca in memoria, provider di embedding, QMD, ricerca ibrida e indicizzazione multimodale
title: Riferimento della configurazione della memoria
x-i18n:
    generated_at: "2026-04-24T09:00:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: b9152d6cdf3959319c2ba000fae06c72b27b9b8c90ee08ce57b80d1c0670f850
    source_path: reference/memory-config.md
    workflow: 15
---

Questa pagina elenca tutte le opzioni di configurazione per la ricerca in memoria di OpenClaw. Per
le panoramiche concettuali, vedi:

- [Panoramica Memory](/it/concepts/memory) -- come funziona la memoria
- [Builtin Engine](/it/concepts/memory-builtin) -- backend SQLite predefinito
- [QMD Engine](/it/concepts/memory-qmd) -- sidecar local-first
- [Ricerca in memoria](/it/concepts/memory-search) -- pipeline di ricerca e regolazione
- [Active Memory](/it/concepts/active-memory) -- abilitazione del sottoagente della memoria per sessioni interattive

Tutte le impostazioni di ricerca in memoria si trovano sotto `agents.defaults.memorySearch` in
`openclaw.json`, salvo diversa indicazione.

Se stai cercando il toggle della funzionalità **active memory** e la configurazione del sottoagente,
questo si trova sotto `plugins.entries.active-memory` invece di `memorySearch`.

Active memory usa un modello a due gate:

1. il plugin deve essere abilitato e puntare all'id dell'agente corrente
2. la richiesta deve essere una sessione di chat interattiva persistente idonea

Vedi [Active Memory](/it/concepts/active-memory) per il modello di attivazione,
la configurazione posseduta dal plugin, la persistenza delle trascrizioni e il modello di rollout sicuro.

---

## Selezione del provider

| Chiave     | Tipo      | Predefinito      | Descrizione                                                                                                    |
| ---------- | --------- | ---------------- | -------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | rilevato automaticamente | ID dell'adapter di embedding: `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model`    | `string`  | predefinito del provider | Nome del modello di embedding                                                                                 |
| `fallback` | `string`  | `"none"`         | ID dell'adapter di fallback quando il primario fallisce                                                       |
| `enabled`  | `boolean` | `true`           | Abilita o disabilita la ricerca in memoria                                                                    |

### Ordine di rilevamento automatico

Quando `provider` non è impostato, OpenClaw seleziona il primo disponibile:

1. `local` -- se `memorySearch.local.modelPath` è configurato e il file esiste.
2. `github-copilot` -- se un token GitHub Copilot può essere risolto (variabile env o profilo auth).
3. `openai` -- se una chiave OpenAI può essere risolta.
4. `gemini` -- se una chiave Gemini può essere risolta.
5. `voyage` -- se una chiave Voyage può essere risolta.
6. `mistral` -- se una chiave Mistral può essere risolta.
7. `bedrock` -- se la catena di credenziali predefinita AWS SDK si risolve (instance role, access key, profile, SSO, web identity o config condivisa).

`ollama` è supportato ma non viene rilevato automaticamente (impostalo esplicitamente).

### Risoluzione della chiave API

Gli embedding remoti richiedono una chiave API. Bedrock usa invece la catena di
credenziali predefinita di AWS SDK (instance role, SSO, access key).

| Provider       | Variabile env                                      | Chiave di configurazione            |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | Catena di credenziali AWS                          | Nessuna chiave API necessaria       |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Profilo auth tramite login del dispositivo |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (placeholder)                     | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

Codex OAuth copre solo chat/completions e non soddisfa le
richieste di embedding.

---

## Configurazione dell'endpoint remoto

Per endpoint personalizzati compatibili con OpenAI o per sovrascrivere i valori predefiniti del provider:

| Chiave           | Tipo     | Descrizione                                 |
| ---------------- | -------- | ------------------------------------------- |
| `remote.baseUrl` | `string` | URL base API personalizzato                 |
| `remote.apiKey`  | `string` | Sovrascrive la chiave API                   |
| `remote.headers` | `object` | Header HTTP aggiuntivi (uniti ai valori predefiniti del provider) |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "YOUR_KEY",
        },
      },
    },
  },
}
```

---

## Configurazione specifica Gemini

| Chiave                 | Tipo     | Predefinito            | Descrizione                                |
| ---------------------- | -------- | ---------------------- | ------------------------------------------ |
| `model`                | `string` | `gemini-embedding-001` | Supporta anche `gemini-embedding-2-preview` |
| `outputDimensionality` | `number` | `3072`                 | Per Embedding 2: 768, 1536 o 3072          |

<Warning>
Cambiare modello o `outputDimensionality` attiva una reindicizzazione completa automatica.
</Warning>

---

## Configurazione embedding Bedrock

Bedrock usa la catena di credenziali predefinita AWS SDK -- non servono chiavi API.
Se OpenClaw gira su EC2 con un instance role abilitato a Bedrock, basta impostare il
provider e il modello:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "bedrock",
        model: "amazon.titan-embed-text-v2:0",
      },
    },
  },
}
```

| Chiave                 | Tipo     | Predefinito                    | Descrizione                     |
| ---------------------- | -------- | ------------------------------ | ------------------------------- |
| `model`                | `string` | `amazon.titan-embed-text-v2:0` | Qualsiasi ID modello di embedding Bedrock |
| `outputDimensionality` | `number` | predefinito del modello        | Per Titan V2: 256, 512 o 1024   |

### Modelli supportati

I seguenti modelli sono supportati (con rilevamento della famiglia e valori
predefiniti delle dimensioni):

| ID modello                                 | Provider   | Dims predefinite | Dims configurabili     |
| ------------------------------------------ | ---------- | ---------------- | ---------------------- |
| `amazon.titan-embed-text-v2:0`             | Amazon     | 1024             | 256, 512, 1024         |
| `amazon.titan-embed-text-v1`               | Amazon     | 1536             | --                     |
| `amazon.titan-embed-g1-text-02`            | Amazon     | 1536             | --                     |
| `amazon.titan-embed-image-v1`              | Amazon     | 1024             | --                     |
| `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024             | 256, 384, 1024, 3072   |
| `cohere.embed-english-v3`                  | Cohere     | 1024             | --                     |
| `cohere.embed-multilingual-v3`             | Cohere     | 1024             | --                     |
| `cohere.embed-v4:0`                        | Cohere     | 1536             | 256-1536               |
| `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512              | --                     |
| `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024             | --                     |

Le varianti con suffisso di throughput (ad esempio `amazon.titan-embed-text-v1:2:8k`) ereditano
la configurazione del modello base.

### Autenticazione

L'auth Bedrock usa il normale ordine di risoluzione delle credenziali AWS SDK:

1. Variabili di ambiente (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
2. Cache token SSO
3. Credenziali del token web identity
4. File condivisi di credenziali e configurazione
5. Credenziali dei metadata ECS o EC2

La regione viene risolta da `AWS_REGION`, `AWS_DEFAULT_REGION`, dalla
`baseUrl` del provider `amazon-bedrock` oppure usa come predefinito `us-east-1`.

### Permessi IAM

Il ruolo o utente IAM richiede:

```json
{
  "Effect": "Allow",
  "Action": "bedrock:InvokeModel",
  "Resource": "*"
}
```

Per il principio del privilegio minimo, limita `InvokeModel` al modello specifico:

```
arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
```

---

## Configurazione embedding locale

| Chiave                | Tipo               | Predefinito            | Descrizione                                                                                                                                                                                                                                                                                                           |
| --------------------- | ------------------ | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `local.modelPath`     | `string`           | scaricato automaticamente | Percorso al file modello GGUF                                                                                                                                                                                                                                                                                      |
| `local.modelCacheDir` | `string`           | predefinito node-llama-cpp | Directory cache per i modelli scaricati                                                                                                                                                                                                                                                                           |
| `local.contextSize`   | `number \| "auto"` | `4096`                 | Dimensione della finestra di contesto per il contesto di embedding. 4096 copre chunk tipici (128–512 token) limitando al contempo la VRAM non ponderata. Riducilo a 1024–2048 su host con risorse limitate. `"auto"` usa il massimo addestrato del modello — non consigliato per modelli 8B+ (Qwen3-Embedding-8B: 40 960 token → ~32 GB VRAM rispetto a ~8.8 GB con 4096). |

Modello predefinito: `embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB, scaricato automaticamente).
Richiede build nativa: `pnpm approve-builds` poi `pnpm rebuild node-llama-cpp`.

Usa la CLI standalone per verificare lo stesso percorso del provider usato dal Gateway:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Se `provider` è `auto`, `local` viene selezionato solo quando `local.modelPath` punta
a un file locale esistente. I riferimenti modello `hf:` e HTTP(S) possono ancora essere usati
esplicitamente con `provider: "local"`, ma non fanno sì che `auto` selezioni local
prima che il modello sia disponibile su disco.

---

## Configurazione della ricerca ibrida

Tutto sotto `memorySearch.query.hybrid`:

| Chiave                | Tipo      | Predefinito | Descrizione                      |
| --------------------- | --------- | ----------- | -------------------------------- |
| `enabled`             | `boolean` | `true`      | Abilita la ricerca ibrida BM25 + vettoriale |
| `vectorWeight`        | `number`  | `0.7`       | Peso per i punteggi vettoriali (0-1) |
| `textWeight`          | `number`  | `0.3`       | Peso per i punteggi BM25 (0-1)   |
| `candidateMultiplier` | `number`  | `4`         | Moltiplicatore della dimensione del pool di candidati |

### MMR (diversità)

| Chiave        | Tipo      | Predefinito | Descrizione                        |
| ------------- | --------- | ----------- | ---------------------------------- |
| `mmr.enabled` | `boolean` | `false`     | Abilita il re-ranking MMR          |
| `mmr.lambda`  | `number`  | `0.7`       | 0 = massima diversità, 1 = massima rilevanza |

### Decadimento temporale (recenza)

| Chiave                       | Tipo      | Predefinito | Descrizione                     |
| ---------------------------- | --------- | ----------- | ------------------------------- |
| `temporalDecay.enabled`      | `boolean` | `false`     | Abilita il boost di recenza     |
| `temporalDecay.halfLifeDays` | `number`  | `30`        | Il punteggio si dimezza ogni N giorni |

I file evergreen (`MEMORY.md`, file non datati in `memory/`) non subiscono mai decadimento.

### Esempio completo

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            vectorWeight: 0.7,
            textWeight: 0.3,
            mmr: { enabled: true, lambda: 0.7 },
            temporalDecay: { enabled: true, halfLifeDays: 30 },
          },
        },
      },
    },
  },
}
```

---

## Percorsi di memoria aggiuntivi

| Chiave       | Tipo       | Descrizione                              |
| ------------ | ---------- | ---------------------------------------- |
| `extraPaths` | `string[]` | Directory o file aggiuntivi da indicizzare |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
    },
  },
}
```

I percorsi possono essere assoluti o relativi allo spazio di lavoro. Le directory vengono scandite
ricorsivamente per i file `.md`. La gestione dei symlink dipende dal backend attivo:
il motore builtin ignora i symlink, mentre QMD segue il comportamento dello scanner
QMD sottostante.

Per la ricerca di trascrizioni cross-agent con ambito agente, usa
`agents.list[].memorySearch.qmd.extraCollections` invece di `memory.qmd.paths`.
Queste collezioni aggiuntive seguono la stessa forma `{ path, name, pattern? }`, ma
vengono unite per agente e possono preservare nomi condivisi espliciti quando il percorso
punta fuori dallo spazio di lavoro corrente.
Se lo stesso percorso risolto appare sia in `memory.qmd.paths` sia in
`memorySearch.qmd.extraCollections`, QMD mantiene la prima voce e salta il
duplicato.

---

## Memoria multimodale (Gemini)

Indicizza immagini e audio insieme al Markdown usando Gemini Embedding 2:

| Chiave                    | Tipo       | Predefinito | Descrizione                               |
| ------------------------- | ---------- | ----------- | ----------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`     | Abilita l'indicizzazione multimodale      |
| `multimodal.modalities`   | `string[]` | --          | `["image"]`, `["audio"]` oppure `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000`  | Dimensione massima del file per l'indicizzazione |

Si applica solo ai file in `extraPaths`. Le root di memoria predefinite restano solo Markdown.
Richiede `gemini-embedding-2-preview`. `fallback` deve essere `"none"`.

Formati supportati: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(immagini); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Cache degli embedding

| Chiave             | Tipo      | Predefinito | Descrizione                          |
| ------------------ | --------- | ----------- | ------------------------------------ |
| `cache.enabled`    | `boolean` | `false`     | Memorizza in cache gli embedding dei chunk in SQLite |
| `cache.maxEntries` | `number`  | `50000`     | Numero massimo di embedding in cache |

Evita di ricalcolare gli embedding di testo invariato durante reindex o aggiornamenti delle trascrizioni.

---

## Indicizzazione batch

| Chiave                        | Tipo      | Predefinito | Descrizione                  |
| ----------------------------- | --------- | ----------- | ---------------------------- |
| `remote.batch.enabled`        | `boolean` | `false`     | Abilita l'API di embedding batch |
| `remote.batch.concurrency`    | `number`  | `2`         | Job batch paralleli          |
| `remote.batch.wait`           | `boolean` | `true`      | Attende il completamento del batch |
| `remote.batch.pollIntervalMs` | `number`  | --          | Intervallo di polling        |
| `remote.batch.timeoutMinutes` | `number`  | --          | Timeout del batch            |

Disponibile per `openai`, `gemini` e `voyage`. Il batch OpenAI è in genere
il più veloce ed economico per grandi backfill.

---

## Ricerca nella memoria di sessione (sperimentale)

Indicizza le trascrizioni delle sessioni ed esponile tramite `memory_search`:

| Chiave                      | Tipo       | Predefinito  | Descrizione                               |
| --------------------------- | ---------- | ------------ | ----------------------------------------- |
| `experimental.sessionMemory`| `boolean`  | `false`      | Abilita l'indicizzazione delle sessioni   |
| `sources`                   | `string[]` | `["memory"]` | Aggiungi `"sessions"` per includere le trascrizioni |
| `sync.sessions.deltaBytes`  | `number`   | `100000`     | Soglia di byte per il reindex             |
| `sync.sessions.deltaMessages` | `number` | `50`         | Soglia di messaggi per il reindex         |

L'indicizzazione delle sessioni è opt-in e viene eseguita in modo asincrono. I risultati possono essere leggermente
obsoleti. I log delle sessioni vivono su disco, quindi considera l'accesso al file system come confine di trust.

---

## Accelerazione vettoriale SQLite (sqlite-vec)

| Chiave                     | Tipo      | Predefinito | Descrizione                          |
| -------------------------- | --------- | ----------- | ------------------------------------ |
| `store.vector.enabled`     | `boolean` | `true`      | Usa sqlite-vec per query vettoriali  |
| `store.vector.extensionPath` | `string`| bundled     | Sovrascrive il percorso sqlite-vec   |

Quando sqlite-vec non è disponibile, OpenClaw usa automaticamente il fallback alla
similarità coseno in-process.

---

## Archiviazione dell'indice

| Chiave                | Tipo     | Predefinito                           | Descrizione                                |
| --------------------- | -------- | ------------------------------------- | ------------------------------------------ |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Posizione dell'indice (supporta il token `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | Tokenizer FTS5 (`unicode61` oppure `trigram`) |

---

## Configurazione backend QMD

Imposta `memory.backend = "qmd"` per abilitarlo. Tutte le impostazioni QMD si trovano sotto
`memory.qmd`:

| Chiave                   | Tipo      | Predefinito | Descrizione                                 |
| ------------------------ | --------- | ----------- | ------------------------------------------- |
| `command`                | `string`  | `qmd`       | Percorso dell'eseguibile QMD                |
| `searchMode`             | `string`  | `search`    | Comando di ricerca: `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`      | Indicizza automaticamente `MEMORY.md` + `memory/**/*.md` |
| `paths[]`                | `array`   | --          | Percorsi aggiuntivi: `{ name, path, pattern? }` |
| `sessions.enabled`       | `boolean` | `false`     | Indicizza le trascrizioni delle sessioni    |
| `sessions.retentionDays` | `number`  | --          | Conservazione delle trascrizioni            |
| `sessions.exportDir`     | `string`  | --          | Directory di esportazione                   |

OpenClaw preferisce le forme correnti di collection e query MCP di QMD, ma mantiene
compatibili le release QMD più vecchie usando come fallback i flag di collection legacy `--mask`
e i nomi più vecchi degli strumenti MCP quando necessario.

Gli override del modello QMD restano sul lato QMD, non nella configurazione OpenClaw. Se hai bisogno di
sovrascrivere globalmente i modelli QMD, imposta variabili di ambiente come
`QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` e `QMD_GENERATE_MODEL` nell'ambiente
runtime del gateway.

### Pianificazione degli aggiornamenti

| Chiave                    | Tipo      | Predefinito | Descrizione                               |
| ------------------------- | --------- | ----------- | ----------------------------------------- |
| `update.interval`         | `string`  | `5m`        | Intervallo di aggiornamento               |
| `update.debounceMs`       | `number`  | `15000`     | Debounce delle modifiche ai file          |
| `update.onBoot`           | `boolean` | `true`      | Aggiorna all'avvio                        |
| `update.waitForBootSync`  | `boolean` | `false`     | Blocca l'avvio finché l'aggiornamento non è completato |
| `update.embedInterval`    | `string`  | --          | Cadenza separata per l'embed              |
| `update.commandTimeoutMs` | `number`  | --          | Timeout per i comandi QMD                 |
| `update.updateTimeoutMs`  | `number`  | --          | Timeout per le operazioni di aggiornamento QMD |
| `update.embedTimeoutMs`   | `number`  | --          | Timeout per le operazioni di embedding QMD |

### Limiti

| Chiave                    | Tipo     | Predefinito | Descrizione                    |
| ------------------------- | -------- | ----------- | ------------------------------ |
| `limits.maxResults`       | `number` | `6`         | Numero massimo di risultati di ricerca |
| `limits.maxSnippetChars`  | `number` | --          | Limita la lunghezza degli snippet |
| `limits.maxInjectedChars` | `number` | --          | Limita il totale dei caratteri iniettati |
| `limits.timeoutMs`        | `number` | `4000`      | Timeout della ricerca          |

### Ambito

Controlla quali sessioni possono ricevere risultati di ricerca QMD. Stesso schema di
[`session.sendPolicy`](/it/gateway/config-agents#session):

```json5
{
  memory: {
    qmd: {
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
    },
  },
}
```

Il valore predefinito distribuito consente sessioni dirette e di canale, continuando però a negare
i gruppi.

Il valore predefinito è solo DM. `match.keyPrefix` corrisponde alla chiave di sessione normalizzata;
`match.rawKeyPrefix` corrisponde alla chiave grezza inclusa `agent:<id>:`.

### Citazioni

`memory.citations` si applica a tutti i backend:

| Valore           | Comportamento                                         |
| ---------------- | ----------------------------------------------------- |
| `auto` (predefinito) | Include il footer `Source: <path#line>` negli snippet |
| `on`             | Include sempre il footer                              |
| `off`            | Omette il footer (il percorso viene comunque passato internamente all'agente) |

### Esempio completo QMD

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 6, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## Dreaming

Dreaming si configura sotto `plugins.entries.memory-core.config.dreaming`,
non sotto `agents.defaults.memorySearch`.

Dreaming viene eseguito come un unico sweep pianificato e usa fasi interne light/deep/REM come
dettaglio di implementazione.

Per il comportamento concettuale e i comandi slash, vedi [Dreaming](/it/concepts/dreaming).

### Impostazioni utente

| Chiave      | Tipo      | Predefinito | Descrizione                                      |
| ----------- | --------- | ----------- | ------------------------------------------------ |
| `enabled`   | `boolean` | `false`     | Abilita o disabilita completamente Dreaming      |
| `frequency` | `string`  | `0 3 * * *` | Cadenza Cron facoltativa per lo sweep completo di Dreaming |

### Esempio

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
          },
        },
      },
    },
  },
}
```

Note:

- Dreaming scrive lo stato macchina in `memory/.dreams/`.
- Dreaming scrive output narrativo leggibile da umani in `DREAMS.md` (o nell'esistente `dreams.md`).
- Il criterio di fase light/deep/REM e le soglie sono comportamento interno, non configurazione esposta all'utente.

## Correlati

- [Panoramica Memory](/it/concepts/memory)
- [Ricerca in memoria](/it/concepts/memory-search)
- [Riferimento della configurazione](/it/gateway/configuration-reference)
