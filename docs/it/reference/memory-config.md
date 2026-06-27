---
read_when:
    - Vuoi configurare provider di ricerca della memoria o modelli di embedding
    - Vuoi configurare il backend QMD
    - Vuoi configurare la ricerca ibrida, MMR o il decadimento temporale
    - Vuoi abilitare l’indicizzazione della memoria multimodale
sidebarTitle: Memory config
summary: Tutte le opzioni di configurazione per la ricerca in memoria, i provider di embedding, QMD, la ricerca ibrida e l'indicizzazione multimodale
title: Riferimento alla configurazione della memoria
x-i18n:
    generated_at: "2026-06-27T18:13:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d8f5880fef3fbdf81e546b0309a0e53459bae47e16efd787f87e34050d8c7b1e
    source_path: reference/memory-config.md
    workflow: 16
---

Questa pagina elenca ogni parametro di configurazione per la ricerca in memoria di OpenClaw. Per panoramiche concettuali, consulta:

<CardGroup cols={2}>
  <Card title="Panoramica della memoria" href="/it/concepts/memory">
    Come funziona la memoria.
  </Card>
  <Card title="Motore integrato" href="/it/concepts/memory-builtin">
    Backend SQLite predefinito.
  </Card>
  <Card title="Motore QMD" href="/it/concepts/memory-qmd">
    Sidecar local-first.
  </Card>
  <Card title="Ricerca in memoria" href="/it/concepts/memory-search">
    Pipeline di ricerca e ottimizzazione.
  </Card>
  <Card title="Active Memory" href="/it/concepts/active-memory">
    Sub-agent di memoria per sessioni interattive.
  </Card>
</CardGroup>

Tutte le impostazioni della ricerca in memoria si trovano sotto `agents.defaults.memorySearch` in `openclaw.json`, salvo diversa indicazione.

<Note>
Se cerchi l'interruttore della funzionalità **Active Memory** e la configurazione del sub-agent, si trova invece sotto `plugins.entries.active-memory`, non sotto `memorySearch`.

Active Memory usa un modello a due gate:

1. il plugin deve essere abilitato e puntare all'id dell'agente corrente
2. la richiesta deve essere una sessione di chat persistente interattiva idonea

Consulta [Active Memory](/it/concepts/active-memory) per il modello di attivazione, la configurazione di proprietà del plugin, la persistenza della trascrizione e il modello di rollout sicuro.
</Note>

---

## Selezione del provider

| Chiave     | Tipo      | Predefinito         | Descrizione                                                                                                                                                                                                                                                                                 |
| ---------- | --------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | `"openai"`          | ID dell'adattatore di embedding, come `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` o `voyage`; può anche essere un `models.providers.<id>` configurato il cui `api` punta a un adattatore di embedding di memoria o a un'API modello compatibile con OpenAI |
| `model`    | `string`  | default del provider | Nome del modello di embedding                                                                                                                                                                                                                                                               |
| `fallback` | `string`  | `"none"`            | ID dell'adattatore di fallback quando quello primario non riesce                                                                                                                                                                                                                            |
| `enabled`  | `boolean` | `true`              | Abilita o disabilita la ricerca in memoria                                                                                                                                                                                                                                                  |

Quando `provider` non è impostato, OpenClaw usa gli embedding OpenAI. Imposta `provider`
esplicitamente per usare Gemini, Voyage, Mistral, DeepInfra, Bedrock, GitHub Copilot,
Ollama, un modello GGUF locale o un endpoint `/v1/embeddings` compatibile con OpenAI.
Le configurazioni legacy che indicano ancora `provider: "auto"` si risolvono in `openai`.

<Warning>
Modificare il provider di embedding, il modello, le impostazioni del provider, le sorgenti, l'ambito,
il chunking o il tokenizer può rendere incompatibile l'indice vettoriale SQLite esistente.
OpenClaw mette in pausa la ricerca vettoriale e segnala un avviso di identità dell'indice invece di
rieseguire automaticamente gli embedding di tutto. Ricostruisci quando sei pronto con
`openclaw memory status --index --agent <id>` o
`openclaw memory index --force --agent <id>`.
</Warning>

Quando `provider` non è impostato, è presente il valore legacy `provider: "auto"` oppure
`provider: "none"` seleziona intenzionalmente la modalità solo FTS, il richiamo della memoria può comunque
usare il ranking lessicale FTS quando gli embedding non sono disponibili.

I provider espliciti non locali falliscono in modo chiuso. Se imposti `memorySearch.provider` su
un provider concreto basato su remoto, come OpenAI, Gemini, Voyage, Mistral,
Bedrock, GitHub Copilot, DeepInfra, Ollama, LM Studio o un provider personalizzato
compatibile con OpenAI, e quel provider non è disponibile a runtime, `memory_search`
restituisce un risultato non disponibile invece di usare silenziosamente il richiamo solo FTS. Correggi la
configurazione del provider/auth, passa a un provider raggiungibile oppure imposta
`provider: "none"` se desideri intenzionalmente il richiamo solo FTS.

### ID provider personalizzati

`memorySearch.provider` può puntare a una voce personalizzata `models.providers.<id>` per adattatori provider specifici della memoria, come `ollama`, o per API modello compatibili con OpenAI, come `openai-responses` / `openai-completions`. OpenClaw risolve il proprietario `api` di quel provider per l'adattatore di embedding preservando l'id provider personalizzato per la gestione di endpoint, auth e prefissi dei modelli. Questo consente a configurazioni multi-GPU o multi-host di dedicare gli embedding di memoria a uno specifico endpoint locale:

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b" }],
      },
    },
  },
  agents: {
    defaults: {
      memorySearch: {
        provider: "ollama-5080",
        model: "qwen3-embedding:0.6b",
      },
    },
  },
}
```

### Risoluzione della chiave API

Gli embedding remoti richiedono una chiave API. Bedrock usa invece la catena di credenziali predefinita dell'AWS SDK (ruoli istanza, SSO, chiavi di accesso).

| Provider       | Variabile env                                      | Chiave di configurazione            |
| -------------- | -------------------------------------------------- | ----------------------------------- |
| Bedrock        | Catena di credenziali AWS                          | Nessuna chiave API necessaria       |
| DeepInfra      | `DEEPINFRA_API_KEY`                                | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                   | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Profilo auth tramite login dispositivo |
| Mistral        | `MISTRAL_API_KEY`                                  | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (segnaposto)                      | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                   | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                   | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth copre solo chat/completions e non soddisfa le richieste di embedding.
</Note>

---

## Configurazione endpoint remoto

Usa `provider: "openai-compatible"` per un server generico `/v1/embeddings`
compatibile con OpenAI che non deve ereditare le credenziali di chat OpenAI globali.

<ParamField path="remote.baseUrl" type="string">
  URL base API personalizzato.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Sovrascrivi la chiave API.
</ParamField>
<ParamField path="remote.headers" type="object">
  Header HTTP aggiuntivi (uniti ai valori predefiniti del provider).
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai-compatible",
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

## Configurazione specifica del provider

<AccordionGroup>
  <Accordion title="Gemini">
    | Chiave                 | Tipo     | Predefinito            | Descrizione                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Supporta anche `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Per Embedding 2: 768, 1536 o 3072          |

    <Warning>
    Modificare il modello o `outputDimensionality` cambia l'identità dell'indice. OpenClaw
    mette in pausa la ricerca vettoriale finché non ricostruisci esplicitamente l'indice della memoria.
    </Warning>

  </Accordion>
  <Accordion title="Tipi di input compatibili con OpenAI">
    Gli endpoint di embedding compatibili con OpenAI possono scegliere di usare campi di richiesta `input_type` specifici del provider. Questo è utile per modelli di embedding asimmetrici che richiedono etichette diverse per embedding di query e documenti.

    | Chiave              | Tipo     | Predefinito | Descrizione                                           |
    | ------------------- | -------- | ----------- | ----------------------------------------------------- |
    | `inputType`         | `string` | non impostato | `input_type` condiviso per embedding di query e documenti |
    | `queryInputType`    | `string` | non impostato | `input_type` in fase di query; sovrascrive `inputType` |
    | `documentInputType` | `string` | non impostato | `input_type` di indice/documento; sovrascrive `inputType` |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai-compatible",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "${EMBEDDINGS_API_KEY}",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    La modifica di questi valori influisce sull'identità della cache degli embedding per l'indicizzazione batch del provider e dovrebbe essere seguita da una reindicizzazione della memoria quando il modello upstream tratta le etichette in modo diverso.

  </Accordion>
  <Accordion title="Bedrock">
    ### Configurazione embedding Bedrock

    Bedrock usa la catena di credenziali predefinita dell'AWS SDK: nessuna chiave API necessaria. Se OpenClaw viene eseguito su EC2 con un ruolo istanza abilitato per Bedrock, basta impostare provider e modello:

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

    | Chiave                 | Tipo     | Predefinito                   | Descrizione                       |
    | ---------------------- | -------- | ----------------------------- | --------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Qualsiasi ID modello di embedding Bedrock |
    | `outputDimensionality` | `number` | default del modello           | Per Titan V2: 256, 512 o 1024     |

    **Modelli supportati** (con rilevamento della famiglia e valori predefiniti delle dimensioni):

    | ID modello                                 | Provider   | Dimensioni predefinite | Dimensioni configurabili |
    | ------------------------------------------ | ---------- | ---------------------- | ------------------------ |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024                   | 256, 512, 1024           |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536                   | --                       |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536                   | --                       |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024                   | --                       |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024                   | 256, 384, 1024, 3072     |
    | `cohere.embed-english-v3`                  | Cohere     | 1024                   | --                       |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024                   | --                       |
    | `cohere.embed-v4:0`                        | Cohere     | 1536                   | 256-1536                 |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512                    | --                       |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024                   | --                       |

    Le varianti con suffisso di throughput (ad esempio, `amazon.titan-embed-text-v1:2:8k`) ereditano la configurazione del modello di base.

    **Autenticazione:** l'autenticazione Bedrock usa l'ordine standard di risoluzione delle credenziali dell'AWS SDK:

    1. Variabili di ambiente (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Cache dei token SSO
    3. Credenziali con token di identità Web
    4. File condivisi di credenziali e configurazione
    5. Credenziali dai metadati ECS o EC2

    La regione viene risolta da `AWS_REGION`, `AWS_DEFAULT_REGION`, dal `baseUrl` del provider `amazon-bedrock` oppure usa come valore predefinito `us-east-1`.

    **Autorizzazioni IAM:** il ruolo o l'utente IAM richiede:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Per il privilegio minimo, limita l'ambito di `InvokeModel` al modello specifico:

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Locale (GGUF + llama.cpp)">
    | Chiave                | Tipo               | Predefinito                   | Descrizione                                                                                                                                                                                                                                                                                                               |
    | --------------------- | ------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | scaricato automaticamente     | Percorso del file del modello GGUF                                                                                                                                                                                                                                                                                        |
    | `local.modelCacheDir` | `string`           | predefinito di node-llama-cpp | Directory cache per i modelli scaricati                                                                                                                                                                                                                                                                                   |
    | `local.contextSize`   | `number \| "auto"` | `4096`                        | Dimensione della finestra di contesto per il contesto di embedding. 4096 copre i chunk tipici (128–512 token) limitando al tempo stesso la VRAM non relativa ai pesi. Abbassa a 1024–2048 su host con risorse limitate. `"auto"` usa il massimo addestrato del modello — non consigliato per modelli 8B+ (Qwen3-Embedding-8B: 40 960 token → ~32 GB di VRAM contro ~8,8 GB a 4096). |

    Installa prima il provider llama.cpp ufficiale: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Modello predefinito: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, scaricato automaticamente). I checkout sorgente richiedono ancora l'approvazione della build nativa: `pnpm approve-builds`, quindi `pnpm rebuild node-llama-cpp`.

    Usa la CLI autonoma per verificare lo stesso percorso del provider usato dal Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Imposta esplicitamente `provider: "local"` per gli embedding GGUF locali. I riferimenti a modelli `hf:` e HTTP(S) sono supportati per configurazioni locali esplicite, ma non modificano il provider predefinito.

  </Accordion>
</AccordionGroup>

### Timeout degli embedding inline

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Sovrascrive il timeout per i batch di embedding inline durante l'indicizzazione della memoria.

Se non impostato, usa il valore predefinito del provider: 600 secondi per provider locali/autogestiti come `local`, `ollama` e `lmstudio`, e 120 secondi per provider ospitati. Aumentalo quando i batch di embedding locali vincolati dalla CPU sono sani ma lenti.
</ParamField>

---

## Configurazione della ricerca ibrida

Tutto sotto `memorySearch.query.hybrid`:

| Chiave                | Tipo      | Predefinito | Descrizione                                  |
| --------------------- | --------- | ----------- | -------------------------------------------- |
| `enabled`             | `boolean` | `true`      | Abilita la ricerca ibrida BM25 + vettoriale  |
| `vectorWeight`        | `number`  | `0.7`       | Peso per i punteggi vettoriali (0-1)         |
| `textWeight`          | `number`  | `0.3`       | Peso per i punteggi BM25 (0-1)               |
| `candidateMultiplier` | `number`  | `4`         | Moltiplicatore della dimensione del pool di candidati |

<Tabs>
  <Tab title="MMR (diversità)">
    | Chiave        | Tipo      | Predefinito | Descrizione                              |
    | ------------- | --------- | ----------- | ---------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`     | Abilita il riordinamento MMR             |
    | `mmr.lambda`  | `number`  | `0.7`       | 0 = massima diversità, 1 = massima rilevanza |
  </Tab>
  <Tab title="Decadimento temporale (recenza)">
    | Chiave                       | Tipo      | Predefinito | Descrizione                        |
    | ---------------------------- | --------- | ----------- | ---------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`     | Abilita il boost di recenza        |
    | `temporalDecay.halfLifeDays` | `number`  | `30`        | Il punteggio si dimezza ogni N giorni |

    I file evergreen (`MEMORY.md`, file senza data in `memory/`) non vengono mai sottoposti a decadimento.

  </Tab>
</Tabs>

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

| Chiave       | Tipo       | Descrizione                                |
| ------------ | ---------- | ------------------------------------------ |
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

I percorsi possono essere assoluti o relativi all'area di lavoro. Le directory vengono scansionate ricorsivamente alla ricerca di file `.md`. La gestione dei symlink dipende dal backend attivo: il motore integrato ignora i symlink, mentre QMD segue il comportamento dello scanner QMD sottostante.

Per la ricerca nelle trascrizioni tra agenti con ambito agente, usa `agents.list[].memorySearch.qmd.extraCollections` invece di `memory.qmd.paths`. Queste raccolte aggiuntive seguono la stessa forma `{ path, name, pattern? }`, ma vengono unite per agente e possono preservare nomi condivisi espliciti quando il percorso punta all'esterno dell'area di lavoro corrente. Se lo stesso percorso risolto compare sia in `memory.qmd.paths` sia in `memorySearch.qmd.extraCollections`, QMD mantiene la prima voce e salta il duplicato.

---

## Memoria multimodale (Gemini)

Indicizza immagini e audio insieme a Markdown usando Gemini Embedding 2:

| Chiave                    | Tipo       | Predefinito | Descrizione                            |
| ------------------------- | ---------- | ----------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`     | Abilita l'indicizzazione multimodale   |
| `multimodal.modalities`   | `string[]` | --          | `["image"]`, `["audio"]` o `["all"]`   |
| `multimodal.maxFileBytes` | `number`   | `10000000`  | Dimensione massima del file da indicizzare |

<Note>
Si applica solo ai file in `extraPaths`. Le radici di memoria predefinite restano solo Markdown. Richiede `gemini-embedding-2-preview`. `fallback` deve essere `"none"`.
</Note>

Formati supportati: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (immagini); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Cache degli embedding

| Chiave            | Tipo      | Predefinito | Descrizione                         |
| ----------------- | --------- | ----------- | ----------------------------------- |
| `cache.enabled`   | `boolean` | `true`      | Memorizza nella cache gli embedding dei chunk in SQLite |
| `cache.maxEntries` | `number` | `50000`     | Numero massimo di embedding nella cache |

Evita di ricalcolare gli embedding per testo invariato durante la reindicizzazione o gli aggiornamenti delle trascrizioni.

---

## Indicizzazione batch

| Chiave                        | Tipo      | Predefinito | Descrizione                         |
| ----------------------------- | --------- | ----------- | ----------------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`         | Embedding inline paralleli          |
| `remote.batch.enabled`        | `boolean` | `false`     | Abilita l'API di embedding batch    |
| `remote.batch.concurrency`    | `number`  | `2`         | Job batch paralleli                 |
| `remote.batch.wait`           | `boolean` | `true`      | Attendi il completamento del batch  |
| `remote.batch.pollIntervalMs` | `number`  | --          | Intervallo di polling               |
| `remote.batch.timeoutMinutes` | `number`  | --          | Timeout del batch                   |

Disponibile per `openai`, `gemini` e `voyage`. Il batch OpenAI è in genere il più veloce e conveniente per grandi backfill.

`remote.nonBatchConcurrency` controlla le chiamate di embedding inline usate dai provider locali/self-hosted e dai provider ospitati quando le API batch del provider non sono attive. Ollama usa per impostazione predefinita `1` per l'indicizzazione non batch, per evitare di sovraccaricare host locali più piccoli; imposta un valore più alto su macchine più grandi.

Questo è separato da `sync.embeddingBatchTimeoutSeconds`, che controlla il timeout per le chiamate di embedding inline.

---

## Ricerca nella memoria della sessione (sperimentale)

Indicizza le trascrizioni delle sessioni e le espone tramite `memory_search`:

| Chiave                        | Tipo       | Predefinito | Descrizione                              |
| ----------------------------- | ---------- | ----------- | ---------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`     | Abilita l'indicizzazione delle sessioni  |
| `sources`                     | `string[]` | `["memory"]` | Aggiungi `"sessions"` per includere le trascrizioni |
| `sync.sessions.deltaBytes`    | `number`   | `100000`    | Soglia in byte per la reindicizzazione   |
| `sync.sessions.deltaMessages` | `number`   | `50`        | Soglia di messaggi per la reindicizzazione |

<Warning>
L'indicizzazione delle sessioni è opzionale e viene eseguita in modo asincrono. I risultati possono essere leggermente obsoleti. I log delle sessioni risiedono su disco, quindi considera l'accesso al filesystem come il confine di fiducia.
</Warning>

---

## Accelerazione vettoriale SQLite (sqlite-vec)

| Chiave                       | Tipo      | Predefinito | Descrizione                         |
| ---------------------------- | --------- | ----------- | ----------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`      | Usa sqlite-vec per le query vettoriali |
| `store.vector.extensionPath` | `string`  | incluso     | Sovrascrive il percorso di sqlite-vec |

Quando sqlite-vec non è disponibile, OpenClaw ripiega automaticamente sulla similarità coseno in-process.

---

## Archiviazione degli indici

Gli indici di memoria integrati risiedono nel database OpenClaw SQLite di ciascun agente in
`agents/<agentId>/agent/openclaw-agent.sqlite`.

| Chiave                | Tipo     | Predefinito | Descrizione                               |
| --------------------- | -------- | ----------- | ----------------------------------------- |
| `store.fts.tokenizer` | `string` | `unicode61` | Tokenizer FTS5 (`unicode61` o `trigram`) |

---

## Configurazione del backend QMD

Imposta `memory.backend = "qmd"` per abilitarlo. Tutte le impostazioni QMD risiedono sotto `memory.qmd`:

| Chiave                   | Tipo      | Predefinito | Descrizione                                                                                 |
| ------------------------ | --------- | ----------- | ------------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`       | Percorso dell'eseguibile QMD; imposta un percorso assoluto quando il `PATH` del servizio differisce dalla tua shell |
| `searchMode`             | `string`  | `search`    | Comando di ricerca: `search`, `vsearch`, `query`                                            |
| `rerank`                 | `boolean` | --          | Imposta su `false` con `searchMode: "query"` e QMD 2.1+ per saltare il reranking QMD         |
| `includeDefaultMemory`   | `boolean` | `true`      | Indicizza automaticamente `MEMORY.md` + `memory/**/*.md`                                    |
| `paths[]`                | `array`   | --          | Percorsi aggiuntivi: `{ name, path, pattern? }`                                             |
| `sessions.enabled`       | `boolean` | `false`     | Indicizza le trascrizioni delle sessioni                                                    |
| `sessions.retentionDays` | `number`  | --          | Conservazione delle trascrizioni                                                            |
| `sessions.exportDir`     | `string`  | --          | Directory di esportazione                                                                   |

`searchMode: "search"` è solo lessicale/BM25. OpenClaw non esegue sonde di prontezza vettoriale semantica né manutenzione degli embedding QMD per quella modalità, anche durante `memory status --deep`; `vsearch` e `query` continuano a richiedere la prontezza vettoriale QMD e gli embedding.

`rerank: false` modifica solo la modalità `query` di QMD e richiede QMD 2.1 o versione successiva. In modalità CLI diretta OpenClaw passa `--no-rerank`; in modalità MCP basata su mcporter passa `rerank: false` allo strumento di query unificato di QMD. Lascialo non impostato per usare il comportamento predefinito di reranking delle query di QMD.

OpenClaw preferisce le forme correnti di raccolta QMD e query MCP, ma mantiene funzionanti le versioni QMD precedenti provando, quando necessario, flag di pattern di raccolta compatibili e nomi di strumenti MCP precedenti. Quando QMD dichiara il supporto per più filtri di raccolta, le raccolte della stessa origine vengono cercate con un unico processo QMD; le build QMD precedenti mantengono il percorso di compatibilità per raccolta. Stessa origine significa che le raccolte di memoria persistente sono raggruppate insieme, mentre le raccolte di trascrizioni delle sessioni restano un gruppo separato, così la diversificazione delle fonti conserva comunque entrambi gli input.

<Note>
Gli override dei modelli QMD restano sul lato QMD, non nella configurazione di OpenClaw. Se devi sovrascrivere globalmente i modelli di QMD, imposta variabili d'ambiente come `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` e `QMD_GENERATE_MODEL` nell'ambiente di runtime del Gateway.
</Note>

<AccordionGroup>
  <Accordion title="Programma di aggiornamento">
    | Chiave                    | Tipo      | Predefinito | Descrizione                           |
    | ------------------------- | --------- | ----------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`        | Intervallo di aggiornamento           |
    | `update.debounceMs`       | `number`  | `15000`     | Applica debounce alle modifiche dei file |
    | `update.onBoot`           | `boolean` | `true`      | Aggiorna quando il manager QMD long-lived si apre; imposta false per saltare l'aggiornamento immediato all'avvio |
    | `update.startup`          | `string`  | `off`       | Inizializzazione QMD opzionale all'avvio del Gateway: `off`, `idle` o `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000`    | Ritardo prima dell'esecuzione dell'aggiornamento `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false`     | Blocca l'apertura del manager finché il suo aggiornamento iniziale non è completato |
    | `update.embedInterval`    | `string`  | --          | Cadenza separata per gli embedding    |
    | `update.commandTimeoutMs` | `number`  | --          | Timeout per i comandi QMD             |
    | `update.updateTimeoutMs`  | `number`  | --          | Timeout per le operazioni di aggiornamento QMD |
    | `update.embedTimeoutMs`   | `number`  | --          | Timeout per le operazioni di embedding QMD |
  </Accordion>
  <Accordion title="Limiti">
    | Chiave                    | Tipo     | Predefinito | Descrizione                    |
    | ------------------------- | -------- | ----------- | ------------------------------ |
    | `limits.maxResults`       | `number` | `6`         | Numero massimo di risultati di ricerca |
    | `limits.maxSnippetChars`  | `number` | --          | Limita la lunghezza dello snippet |
    | `limits.maxInjectedChars` | `number` | --          | Limita i caratteri iniettati totali |
    | `limits.timeoutMs`        | `number` | `4000`      | Timeout della ricerca          |
  </Accordion>
  <Accordion title="Ambito">
    Controlla quali sessioni possono ricevere risultati di ricerca QMD. Stesso schema di [`session.sendPolicy`](/it/gateway/config-agents#session):

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

    Il valore predefinito distribuito consente sessioni dirette e di canale, continuando a negare i gruppi.

    Il valore predefinito è solo DM. `match.keyPrefix` corrisponde alla chiave di sessione normalizzata; `match.rawKeyPrefix` corrisponde alla chiave grezza inclusa `agent:<id>:`.

  </Accordion>
  <Accordion title="Citazioni">
    `memory.citations` si applica a tutti i backend:

    | Valore           | Comportamento                                      |
    | ---------------- | -------------------------------------------------- |
    | `auto` (predefinito) | Include il footer `Source: <path#line>` negli snippet |
    | `on`             | Include sempre il footer                           |
    | `off`            | Omette il footer (il percorso viene comunque passato internamente all'agente) |

  </Accordion>
</AccordionGroup>

Quando l'inizializzazione QMD all'avvio del Gateway è abilitata, OpenClaw avvia QMD solo per gli agenti idonei. Se `update.onBoot` è true e non è configurata alcuna manutenzione a intervalli/embed, l'avvio usa un manager one-shot per l'aggiornamento di avvio e poi lo chiude. Se è configurato un intervallo di aggiornamento o embed, l'avvio apre il manager QMD long-lived così può possedere il watcher e i timer di intervallo; `update.onBoot: false` salta solo l'aggiornamento immediato all'avvio.

### Esempio QMD completo

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

Dreaming è configurato sotto `plugins.entries.memory-core.config.dreaming`, non sotto `agents.defaults.memorySearch`.

Dreaming viene eseguito come una singola scansione programmata e usa fasi interne leggere/profonde/REM come dettaglio implementativo.

Per il comportamento concettuale e i comandi slash, consulta [Dreaming](/it/concepts/dreaming).

### Impostazioni utente

| Chiave                                 | Tipo      | Predefinito       | Descrizione                                                                                                                      |
| -------------------------------------- | --------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`           | Abilita o disabilita completamente dreaming                                                                                      |
| `frequency`                            | `string`  | `0 3 * * *`       | Cadenza Cron opzionale per la scansione completa di dreaming                                                                     |
| `model`                                | `string`  | modello predefinito | Override opzionale del modello del sottoagente Dream Diary                                                                       |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`             | Token stimati massimi mantenuti da ogni snippet di richiamo a breve termine promosso in `MEMORY.md`; i metadati di provenienza restano visibili |

### Esempio

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        subagent: {
          allowModelOverride: true,
          allowedModels: ["anthropic/claude-sonnet-4-6"],
        },
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
            model: "anthropic/claude-sonnet-4-6",
          },
        },
      },
    },
  },
}
```

<Note>
- Dreaming scrive lo stato macchina in `memory/.dreams/`.
- Dreaming scrive l'output narrativo leggibile da persone in `DREAMS.md` (o nell'esistente `dreams.md`).
- `dreaming.model` usa il gate di fiducia esistente per i sottoagenti del Plugin; imposta `plugins.entries.memory-core.subagent.allowModelOverride: true` prima di abilitarlo.
- Dream Diary riprova una volta con il modello predefinito della sessione quando il modello configurato non è disponibile. Gli errori di fiducia o allowlist vengono registrati e non vengono ritentati silenziosamente.
- La policy e le soglie delle fasi leggere/profonde/REM sono comportamento interno, non configurazione rivolta all'utente.

</Note>

## Correlati

- [Riferimento di configurazione](/it/gateway/configuration-reference)
- [Panoramica della memoria](/it/concepts/memory)
- [Ricerca nella memoria](/it/concepts/memory-search)
