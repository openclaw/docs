---
read_when:
    - Vuoi configurare i provider di ricerca della memoria o i modelli di embedding
    - Vuoi configurare il backend QMD
    - Vuoi ottimizzare la ricerca ibrida, MMR o il decadimento temporale
    - Vuoi abilitare l'indicizzazione della memoria multimodale
sidebarTitle: Memory config
summary: Tutti i parametri di configurazione per la ricerca nella memoria, i provider di embedding, QMD, la ricerca ibrida e l'indicizzazione multimodale
title: Riferimento alla configurazione della memoria
x-i18n:
    generated_at: "2026-04-30T09:11:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbb21d407f7ec9ef76e68c268138892b12568137735b723579703e535d34b195
    source_path: reference/memory-config.md
    workflow: 16
---

Questa pagina elenca ogni opzione di configurazione per la ricerca in memoria di OpenClaw. Per panoramiche concettuali, vedi:

<CardGroup cols={2}>
  <Card title="Memory overview" href="/it/concepts/memory">
    Come funziona la memoria.
  </Card>
  <Card title="Builtin engine" href="/it/concepts/memory-builtin">
    Backend SQLite predefinito.
  </Card>
  <Card title="QMD engine" href="/it/concepts/memory-qmd">
    Sidecar local-first.
  </Card>
  <Card title="Memory search" href="/it/concepts/memory-search">
    Pipeline di ricerca e ottimizzazione.
  </Card>
  <Card title="Active memory" href="/it/concepts/active-memory">
    Sub-agent di memoria per sessioni interattive.
  </Card>
</CardGroup>

Tutte le impostazioni di ricerca in memoria risiedono in `agents.defaults.memorySearch` in `openclaw.json`, salvo diversa indicazione.

<Note>
Se stai cercando l'interruttore della funzionalità **active memory** e la configurazione del sub-agent, si trova invece in `plugins.entries.active-memory`, non in `memorySearch`.

Active Memory usa un modello a due gate:

1. il Plugin deve essere abilitato e avere come target l'id dell'agent corrente
2. la richiesta deve essere una sessione di chat interattiva persistente idonea

Vedi [Active Memory](/it/concepts/active-memory) per il modello di attivazione, la configurazione di proprietà del Plugin, la persistenza delle trascrizioni e il modello di rollout sicuro.
</Note>

---

## Selezione del provider

| Chiave     | Tipo      | Predefinito                  | Descrizione                                                                                                                                                                                                                         |
| ---------- | --------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | rilevato automaticamente     | ID dell'adapter di embedding, come `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai` o `voyage`; può anche essere un `models.providers.<id>` configurato il cui `api` punta a uno di questi adapter |
| `model`    | `string`  | predefinito del provider     | Nome del modello di embedding                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`                     | ID dell'adapter di fallback quando quello primario fallisce                                                                                                                                                                          |
| `enabled`  | `boolean` | `true`                       | Abilita o disabilita la ricerca in memoria                                                                                                                                                                                           |

### Ordine di rilevamento automatico

Quando `provider` non è impostato, OpenClaw seleziona il primo disponibile:

<Steps>
  <Step title="local">
    Selezionato se `memorySearch.local.modelPath` è configurato e il file esiste.
  </Step>
  <Step title="github-copilot">
    Selezionato se è possibile risolvere un token GitHub Copilot (variabile di ambiente o profilo di autenticazione).
  </Step>
  <Step title="openai">
    Selezionato se è possibile risolvere una chiave OpenAI.
  </Step>
  <Step title="gemini">
    Selezionato se è possibile risolvere una chiave Gemini.
  </Step>
  <Step title="voyage">
    Selezionato se è possibile risolvere una chiave Voyage.
  </Step>
  <Step title="mistral">
    Selezionato se è possibile risolvere una chiave Mistral.
  </Step>
  <Step title="deepinfra">
    Selezionato se è possibile risolvere una chiave DeepInfra.
  </Step>
  <Step title="bedrock">
    Selezionato se la catena di credenziali dell'AWS SDK si risolve (ruolo dell'istanza, chiavi di accesso, profilo, SSO, identità web o configurazione condivisa).
  </Step>
</Steps>

`ollama` è supportato ma non viene rilevato automaticamente (impostalo esplicitamente).

### ID provider personalizzati

`memorySearch.provider` può puntare a una voce `models.providers.<id>` personalizzata. OpenClaw risolve il proprietario `api` di quel provider per l'adapter di embedding, preservando l'ID provider personalizzato per la gestione di endpoint, autenticazione e prefissi dei modelli. Questo consente a configurazioni multi-GPU o multi-host di dedicare gli embedding della memoria a uno specifico endpoint locale:

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

Gli embedding remoti richiedono una chiave API. Bedrock usa invece la catena di credenziali predefinita dell'AWS SDK (ruoli dell'istanza, SSO, chiavi di accesso).

| Provider       | Variabile di ambiente                           | Chiave di configurazione             |
| -------------- | ----------------------------------------------- | ------------------------------------ |
| Bedrock        | Catena di credenziali AWS                       | Nessuna chiave API necessaria        |
| DeepInfra      | `DEEPINFRA_API_KEY`                             | `models.providers.deepinfra.apiKey`  |
| Gemini         | `GEMINI_API_KEY`                                | `models.providers.google.apiKey`     |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN` | Profilo di autenticazione tramite login del dispositivo |
| Mistral        | `MISTRAL_API_KEY`                               | `models.providers.mistral.apiKey`    |
| Ollama         | `OLLAMA_API_KEY` (segnaposto)                   | --                                   |
| OpenAI         | `OPENAI_API_KEY`                                | `models.providers.openai.apiKey`     |
| Voyage         | `VOYAGE_API_KEY`                                | `models.providers.voyage.apiKey`     |

<Note>
Codex OAuth copre solo chat/completions e non soddisfa le richieste di embedding.
</Note>

---

## Configurazione endpoint remoto

Per endpoint personalizzati compatibili con OpenAI o per sovrascrivere i valori predefiniti del provider:

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

## Configurazione specifica del provider

<AccordionGroup>
  <Accordion title="Gemini">
    | Chiave                 | Tipo     | Predefinito           | Descrizione                                      |
    | ---------------------- | -------- | --------------------- | ------------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Supporta anche `gemini-embedding-2-preview`      |
    | `outputDimensionality` | `number` | `3072`                | Per Embedding 2: 768, 1536 o 3072                |

    <Warning>
    La modifica del modello o di `outputDimensionality` attiva una reindicizzazione completa automatica.
    </Warning>

  </Accordion>
  <Accordion title="OpenAI-compatible input types">
    Gli endpoint di embedding compatibili con OpenAI possono scegliere di usare campi di richiesta `input_type` specifici del provider. Questo è utile per modelli di embedding asimmetrici che richiedono etichette diverse per embedding di query e documenti.

    | Chiave              | Tipo     | Predefinito | Descrizione                                             |
    | ------------------- | -------- | ----------- | ------------------------------------------------------- |
    | `inputType`         | `string` | non impostato | `input_type` condiviso per embedding di query e documenti |
    | `queryInputType`    | `string` | non impostato | `input_type` in fase di query; sovrascrive `inputType`  |
    | `documentInputType` | `string` | non impostato | `input_type` di indice/documento; sovrascrive `inputType` |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "env:EMBEDDINGS_API_KEY",
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
    Bedrock usa la catena di credenziali predefinita dell'AWS SDK: non servono chiavi API. Se OpenClaw viene eseguito su EC2 con un ruolo dell'istanza abilitato per Bedrock, imposta semplicemente provider e modello:

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

    | Chiave                 | Tipo     | Predefinito                   | Descrizione                         |
    | ---------------------- | -------- | ----------------------------- | ----------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Qualsiasi ID modello di embedding Bedrock |
    | `outputDimensionality` | `number` | predefinito del modello       | Per Titan V2: 256, 512 o 1024       |

    **Modelli supportati** (con rilevamento della famiglia e dimensioni predefinite):

    | ID modello                                  | Provider   | Dimensioni predefinite | Dimensioni configurabili |
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

    Le varianti con suffisso di throughput (ad esempio `amazon.titan-embed-text-v1:2:8k`) ereditano la configurazione del modello base.

    **Autenticazione:** l'autenticazione Bedrock usa l'ordine standard di risoluzione delle credenziali dell'AWS SDK:

    1. Variabili di ambiente (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Cache token SSO
    3. Credenziali token di identità web
    4. Credenziali condivise e file di configurazione
    5. Credenziali metadati ECS o EC2

    La regione viene risolta da `AWS_REGION`, `AWS_DEFAULT_REGION`, dal `baseUrl` del provider `amazon-bedrock`, oppure usa come valore predefinito `us-east-1`.

    **Autorizzazioni IAM:** il ruolo o l'utente IAM necessita di:

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
  <Accordion title="Locale (GGUF + node-llama-cpp)">
    | Chiave                | Tipo               | Predefinito            | Descrizione                                                                                                                                                                                                                                                                                                          |
    | --------------------- | ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | scaricato automaticamente | Percorso del file del modello GGUF                                                                                                                                                                                                                                                                                   |
    | `local.modelCacheDir` | `string`           | predefinito di node-llama-cpp | Directory della cache per i modelli scaricati                                                                                                                                                                                                                                                                       |
    | `local.contextSize`   | `number \| "auto"` | `4096`                 | Dimensione della finestra di contesto per il contesto di embedding. 4096 copre i chunk tipici (128–512 token) limitando al contempo la VRAM non destinata ai pesi. Riduci a 1024–2048 su host con risorse limitate. `"auto"` usa il massimo addestrato del modello — non consigliato per modelli 8B+ (Qwen3-Embedding-8B: 40 960 token → ~32 GB di VRAM contro ~8,8 GB a 4096). |

    Modello predefinito: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, scaricato automaticamente). Richiede una build nativa: `pnpm approve-builds` poi `pnpm rebuild node-llama-cpp`.

    Usa la CLI autonoma per verificare lo stesso percorso del provider usato dal Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Se `provider` è `auto`, `local` viene selezionato solo quando `local.modelPath` punta a un file locale esistente. I riferimenti a modelli `hf:` e HTTP(S) possono comunque essere usati esplicitamente con `provider: "local"`, ma non fanno sì che `auto` selezioni local prima che il modello sia disponibile su disco.

  </Accordion>
</AccordionGroup>

### Timeout degli embedding inline

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Sovrascrive il timeout per i batch di embedding inline durante l'indicizzazione della memoria.

Se non impostato, usa il valore predefinito del provider: 600 secondi per provider locali/self-hosted come `local`, `ollama` e `lmstudio`, e 120 secondi per provider hosted. Aumenta questo valore quando i batch di embedding locali vincolati dalla CPU sono sani ma lenti.
</ParamField>

---

## Configurazione della ricerca ibrida

Tutto sotto `memorySearch.query.hybrid`:

| Chiave                | Tipo      | Predefinito | Descrizione                         |
| --------------------- | --------- | ----------- | ----------------------------------- |
| `enabled`             | `boolean` | `true`      | Abilita la ricerca ibrida BM25 + vettoriale |
| `vectorWeight`        | `number`  | `0.7`       | Peso per i punteggi vettoriali (0-1) |
| `textWeight`          | `number`  | `0.3`       | Peso per i punteggi BM25 (0-1)      |
| `candidateMultiplier` | `number`  | `4`         | Moltiplicatore della dimensione del pool di candidati |

<Tabs>
  <Tab title="MMR (diversità)">
    | Chiave        | Tipo      | Predefinito | Descrizione                          |
    | ------------- | --------- | ----------- | ------------------------------------ |
    | `mmr.enabled` | `boolean` | `false`     | Abilita il riordinamento MMR         |
    | `mmr.lambda`  | `number`  | `0.7`       | 0 = massima diversità, 1 = massima pertinenza |
  </Tab>
  <Tab title="Decadimento temporale (recenza)">
    | Chiave                       | Tipo      | Predefinito | Descrizione                |
    | ---------------------------- | --------- | ----------- | -------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`     | Abilita il boost di recenza |
    | `temporalDecay.halfLifeDays` | `number`  | `30`        | Il punteggio si dimezza ogni N giorni |

    I file evergreen (`MEMORY.md`, file non datati in `memory/`) non subiscono mai decadimento.

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

| Chiave       | Tipo       | Descrizione                                  |
| ------------ | ---------- | -------------------------------------------- |
| `extraPaths` | `string[]` | Directory o file aggiuntivi da indicizzare   |

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

I percorsi possono essere assoluti o relativi al workspace. Le directory vengono scansionate ricorsivamente alla ricerca di file `.md`. La gestione dei symlink dipende dal backend attivo: il motore integrato ignora i symlink, mentre QMD segue il comportamento dello scanner QMD sottostante.

Per la ricerca di trascrizioni cross-agent con ambito agente, usa `agents.list[].memorySearch.qmd.extraCollections` invece di `memory.qmd.paths`. Quelle raccolte extra seguono la stessa forma `{ path, name, pattern? }`, ma vengono unite per agente e possono preservare nomi condivisi espliciti quando il percorso punta all'esterno del workspace corrente. Se lo stesso percorso risolto compare sia in `memory.qmd.paths` sia in `memorySearch.qmd.extraCollections`, QMD mantiene la prima voce e salta il duplicato.

---

## Memoria multimodale (Gemini)

Indicizza immagini e audio insieme al Markdown usando Gemini Embedding 2:

| Chiave                    | Tipo       | Predefinito | Descrizione                            |
| ------------------------- | ---------- | ----------- | -------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`     | Abilita l'indicizzazione multimodale   |
| `multimodal.modalities`   | `string[]` | --          | `["image"]`, `["audio"]` o `["all"]` |
| `multimodal.maxFileBytes` | `number`   | `10000000`  | Dimensione massima del file per l'indicizzazione |

<Note>
Si applica solo ai file in `extraPaths`. Le radici di memoria predefinite restano solo Markdown. Richiede `gemini-embedding-2-preview`. `fallback` deve essere `"none"`.
</Note>

Formati supportati: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (immagini); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Cache degli embedding

| Chiave             | Tipo      | Predefinito | Descrizione                         |
| ------------------ | --------- | ----------- | ----------------------------------- |
| `cache.enabled`    | `boolean` | `false`     | Memorizza gli embedding dei chunk in SQLite |
| `cache.maxEntries` | `number`  | `50000`     | Numero massimo di embedding memorizzati nella cache |

Evita di rieseguire l'embedding del testo invariato durante la reindicizzazione o gli aggiornamenti delle trascrizioni.

---

## Indicizzazione in batch

| Chiave                        | Tipo      | Predefinito | Descrizione                  |
| ----------------------------- | --------- | ----------- | ---------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`         | Embedding inline paralleli   |
| `remote.batch.enabled`        | `boolean` | `false`     | Abilita l'API di embedding in batch |
| `remote.batch.concurrency`    | `number`  | `2`         | Job batch paralleli          |
| `remote.batch.wait`           | `boolean` | `true`      | Attendi il completamento del batch |
| `remote.batch.pollIntervalMs` | `number`  | --          | Intervallo di polling        |
| `remote.batch.timeoutMinutes` | `number`  | --          | Timeout del batch            |

Disponibile per `openai`, `gemini` e `voyage`. Il batch OpenAI è in genere il più veloce ed economico per backfill di grandi dimensioni.

`remote.nonBatchConcurrency` controlla le chiamate di embedding inline usate dai provider locali/self-hosted e dai provider hosted quando le API batch del provider non sono attive. Ollama usa come predefinito `1` per l'indicizzazione non batch per evitare di sovraccaricare host locali più piccoli; imposta un valore più alto su macchine più grandi.

Questo è separato da `sync.embeddingBatchTimeoutSeconds`, che controlla il timeout per le chiamate di embedding inline.

---

## Ricerca nella memoria di sessione (sperimentale)

Indicizza le trascrizioni delle sessioni e rendile disponibili tramite `memory_search`:

| Chiave                        | Tipo       | Predefinito | Descrizione                             |
| ----------------------------- | ---------- | ----------- | --------------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`     | Abilita l'indicizzazione delle sessioni |
| `sources`                     | `string[]` | `["memory"]` | Aggiungi `"sessions"` per includere le trascrizioni |
| `sync.sessions.deltaBytes`    | `number`   | `100000`    | Soglia in byte per la reindicizzazione  |
| `sync.sessions.deltaMessages` | `number`   | `50`        | Soglia di messaggi per la reindicizzazione |

<Warning>
L'indicizzazione delle sessioni è opt-in e viene eseguita in modo asincrono. I risultati possono essere leggermente obsoleti. I log delle sessioni risiedono su disco, quindi considera l'accesso al filesystem come il confine di fiducia.
</Warning>

---

## Accelerazione vettoriale SQLite (sqlite-vec)

| Chiave                       | Tipo      | Predefinito | Descrizione                              |
| ---------------------------- | --------- | ----------- | ---------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`      | Usa sqlite-vec per le query vettoriali   |
| `store.vector.extensionPath` | `string`  | bundled     | Sovrascrivi il percorso di sqlite-vec    |

Quando sqlite-vec non è disponibile, OpenClaw ripiega automaticamente sulla similarità coseno in-process.

---

## Archiviazione dell'indice

| Chiave                | Tipo     | Predefinito                          | Descrizione                                      |
| --------------------- | -------- | ------------------------------------ | ------------------------------------------------ |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Posizione dell'indice (supporta il token `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                          | Tokenizer FTS5 (`unicode61` o `trigram`)         |

---

## Configurazione del backend QMD

Imposta `memory.backend = "qmd"` per abilitarlo. Tutte le impostazioni QMD si trovano sotto `memory.qmd`:

| Chiave                   | Tipo      | Predefinito | Descrizione                                                                           |
| ------------------------ | --------- | ----------- | ------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`       | Percorso dell'eseguibile QMD; imposta un percorso assoluto quando il `PATH` del servizio differisce dalla tua shell |
| `searchMode`             | `string`  | `search`    | Comando di ricerca: `search`, `vsearch`, `query`                                      |
| `includeDefaultMemory`   | `boolean` | `true`      | Indicizza automaticamente `MEMORY.md` + `memory/**/*.md`                              |
| `paths[]`                | `array`   | --          | Percorsi extra: `{ name, path, pattern? }`                                            |
| `sessions.enabled`       | `boolean` | `false`     | Indicizza le trascrizioni delle sessioni                                              |
| `sessions.retentionDays` | `number`  | --          | Conservazione delle trascrizioni                                                      |
| `sessions.exportDir`     | `string`  | --          | Directory di esportazione                                                             |

`searchMode: "search"` è solo lessicale/BM25. OpenClaw non esegue probe di prontezza vettoriale semantica o manutenzione degli embedding QMD per quella modalità, anche durante `memory status --deep`; `vsearch` e `query` continuano a richiedere la prontezza dei vettori QMD e gli embedding.

OpenClaw preferisce la raccolta QMD corrente e le forme di query MCP correnti, ma mantiene il funzionamento delle versioni QMD precedenti provando flag di pattern di raccolta compatibili e nomi di strumenti MCP precedenti quando necessario. Quando QMD dichiara il supporto per più filtri di raccolta, le raccolte con la stessa fonte vengono cercate con un unico processo QMD; le build QMD precedenti mantengono il percorso di compatibilità per raccolta. Stessa fonte significa che le raccolte di memoria durevole vengono raggruppate insieme, mentre le raccolte di trascrizioni di sessione rimangono un gruppo separato, così la diversificazione delle fonti mantiene comunque entrambi gli input.

<Note>
Gli override dei modelli QMD rimangono sul lato QMD, non nella configurazione di OpenClaw. Se devi eseguire l'override globale dei modelli di QMD, imposta variabili d'ambiente come `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` e `QMD_GENERATE_MODEL` nell'ambiente di runtime del gateway.
</Note>

<AccordionGroup>
  <Accordion title="Pianificazione degli aggiornamenti">
    | Chiave                    | Tipo      | Predefinito | Descrizione                           |
    | ------------------------- | --------- | ----------- | ------------------------------------- |
    | `update.interval`         | `string`  | `5m`        | Intervallo di aggiornamento           |
    | `update.debounceMs`       | `number`  | `15000`     | Applica il debounce alle modifiche dei file |
    | `update.onBoot`           | `boolean` | `true`      | Aggiorna quando il gestore QMD persistente si apre; controlla anche l'aggiornamento di avvio opzionale |
    | `update.startup`          | `string`  | `off`       | Aggiornamento opzionale all'avvio del gateway: `off`, `idle` o `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000`    | Ritardo prima dell'esecuzione dell'aggiornamento `startup: "idle"` |
    | `update.waitForBootSync`  | `boolean` | `false`     | Blocca l'apertura del gestore finché il suo aggiornamento iniziale non è completato |
    | `update.embedInterval`    | `string`  | --          | Cadenza di embedding separata         |
    | `update.commandTimeoutMs` | `number`  | --          | Timeout per i comandi QMD             |
    | `update.updateTimeoutMs`  | `number`  | --          | Timeout per le operazioni di aggiornamento QMD |
    | `update.embedTimeoutMs`   | `number`  | --          | Timeout per le operazioni di embedding QMD |
  </Accordion>
  <Accordion title="Limiti">
    | Chiave                    | Tipo     | Predefinito | Descrizione                |
    | ------------------------- | -------- | ----------- | -------------------------- |
    | `limits.maxResults`       | `number` | `6`         | Numero massimo di risultati di ricerca |
    | `limits.maxSnippetChars`  | `number` | --          | Limita la lunghezza dello snippet |
    | `limits.maxInjectedChars` | `number` | --          | Limita il totale di caratteri iniettati |
    | `limits.timeoutMs`        | `number` | `4000`      | Timeout della ricerca      |
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

    Il valore predefinito distribuito consente le sessioni dirette e di canale, continuando a negare i gruppi.

    Il valore predefinito è solo DM. `match.keyPrefix` corrisponde alla chiave di sessione normalizzata; `match.rawKeyPrefix` corrisponde alla chiave grezza, incluso `agent:<id>:`.

  </Accordion>
  <Accordion title="Citazioni">
    `memory.citations` si applica a tutti i backend:

    | Valore           | Comportamento                                      |
    | ---------------- | ------------------------------------------------- |
    | `auto` (predefinito) | Include il footer `Source: <path#line>` negli snippet |
    | `on`             | Include sempre il footer                          |
    | `off`            | Omette il footer (il percorso viene comunque passato internamente all'agente) |

  </Accordion>
</AccordionGroup>

Gli aggiornamenti di avvio QMD usano un percorso subprocess una tantum durante l'avvio del gateway. Il gestore QMD persistente continua a possedere il normale file watcher e i timer di intervallo quando la ricerca in memoria viene aperta per l'uso interattivo.

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

Dreaming è configurato in `plugins.entries.memory-core.config.dreaming`, non in `agents.defaults.memorySearch`.

Dreaming viene eseguito come una singola scansione pianificata e usa fasi interne light/deep/REM come dettaglio di implementazione.

Per il comportamento concettuale e i comandi slash, consulta [Dreaming](/it/concepts/dreaming).

### Impostazioni utente

| Chiave      | Tipo      | Predefinito       | Descrizione                                       |
| ----------- | --------- | ----------------- | ------------------------------------------------- |
| `enabled`   | `boolean` | `false`           | Abilita o disabilita completamente dreaming       |
| `frequency` | `string`  | `0 3 * * *`       | Cadenza cron opzionale per la scansione completa di dreaming |
| `model`     | `string`  | modello predefinito | Override opzionale del modello del subagente Dream Diary |

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
- Dreaming scrive l'output narrativo leggibile dagli esseri umani in `DREAMS.md` (o nell'esistente `dreams.md`).
- `dreaming.model` usa il gate di attendibilità del subagente del Plugin esistente; imposta `plugins.entries.memory-core.subagent.allowModelOverride: true` prima di abilitarlo.
- Dream Diary riprova una volta con il modello predefinito della sessione quando il modello configurato non è disponibile. Gli errori di attendibilità o allowlist vengono registrati e non vengono riprovati silenziosamente.
- La policy e le soglie delle fasi light/deep/REM sono comportamento interno, non configurazione esposta all'utente.

</Note>

## Correlati

- [Riferimento di configurazione](/it/gateway/configuration-reference)
- [Panoramica della memoria](/it/concepts/memory)
- [Ricerca in memoria](/it/concepts/memory-search)
