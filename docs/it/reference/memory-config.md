---
read_when:
    - Vuoi configurare i provider di ricerca in memoria o i modelli di embedding
    - Vuoi configurare il backend QMD
    - Vuoi ottimizzare la ricerca ibrida, MMR o il decadimento temporale
    - Vuoi abilitare l'indicizzazione multimodale della memoria
sidebarTitle: Memory config
summary: Tutte le opzioni di configurazione per la ricerca in memoria, i provider di embedding, QMD, la ricerca ibrida e l’indicizzazione multimodale
title: Riferimento per la configurazione della memoria
x-i18n:
    generated_at: "2026-07-12T07:30:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 558995797a5e217e57245e1d5ff90124fca67b6eb4767d97a3ea26a4ca013d06
    source_path: reference/memory-config.md
    workflow: 16
---

Questa pagina elenca tutte le opzioni di configurazione per la ricerca nella memoria di OpenClaw. Per una panoramica concettuale, consulta:

<CardGroup cols={2}>
  <Card title="Panoramica della memoria" href="/it/concepts/memory">
    Come funziona la memoria.
  </Card>
  <Card title="Motore integrato" href="/it/concepts/memory-builtin">
    Backend SQLite predefinito.
  </Card>
  <Card title="Motore QMD" href="/it/concepts/memory-qmd">
    Processo ausiliario local-first.
  </Card>
  <Card title="Ricerca nella memoria" href="/it/concepts/memory-search">
    Pipeline di ricerca e ottimizzazione.
  </Card>
  <Card title="Active Memory" href="/it/concepts/active-memory">
    Sotto-agente della memoria per le sessioni interattive.
  </Card>
</CardGroup>

Tutte le impostazioni di ricerca nella memoria si trovano in `agents.defaults.memorySearch` nel file `openclaw.json` (oppure in una sostituzione specifica per agente `agents.list[].memorySearch`), salvo diversa indicazione.

<Note>
Se cerchi l'opzione di attivazione della funzionalità **Active Memory** e la configurazione del sotto-agente, queste si trovano in `plugins.entries.active-memory` anziché in `memorySearch`.

Active Memory utilizza un modello a due condizioni:

1. il Plugin deve essere abilitato e avere come destinazione l'ID dell'agente corrente
2. la richiesta deve appartenere a una sessione di chat persistente interattiva idonea

Consulta [Active Memory](/it/concepts/active-memory) per informazioni sul modello di attivazione, sulla configurazione gestita dal Plugin, sulla persistenza delle trascrizioni e sulla procedura di distribuzione sicura.
</Note>

---

## Selezione del provider

| Chiave    | Tipo      | Valore predefinito     | Descrizione                                                                                                                                                                                                                                                                                                                              |
| ---------- | --------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `true`                 | Abilita o disabilita la ricerca nella memoria                                                                                                                                                                                                                                                                                            |
| `provider` | `string`  | `"openai"`             | ID dell'adattatore di embedding, ad esempio `bedrock`, `deepinfra`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `openai-compatible` o `voyage`; può anche essere un `models.providers.<id>` configurato, il cui `api` punta a un adattatore di embedding della memoria o a un'API di modelli compatibile con OpenAI |
| `model`    | `string`  | predefinito del provider | Nome del modello di embedding                                                                                                                                                                                                                                                                                                            |
| `fallback` | `string`  | `"none"`               | ID dell'adattatore di ripiego quando quello principale non funziona                                                                                                                                                                                                                                                                      |

Quando `provider` non è impostato, OpenClaw utilizza gli embedding di OpenAI. Imposta
esplicitamente `provider` per utilizzare Bedrock, DeepInfra, Gemini, GitHub Copilot, Mistral, Ollama,
Voyage, un modello GGUF locale o un endpoint `/v1/embeddings` compatibile con OpenAI.
Le configurazioni precedenti che contengono ancora `provider: "auto"` vengono risolte in `openai`.

<Warning>
La modifica del provider di embedding, del modello, delle impostazioni del provider, delle origini, dell'ambito,
della suddivisione in blocchi o del tokenizzatore può rendere incompatibile l'indice vettoriale SQLite esistente.
OpenClaw sospende la ricerca vettoriale e segnala un avviso sull'identità dell'indice anziché
rigenerare automaticamente tutti gli embedding. Quando sei pronto, ricostruiscilo con
`openclaw memory status --index --agent <id>` oppure
`openclaw memory index --force --agent <id>`.
</Warning>

Quando `provider` non è impostato, è presente il valore precedente `provider: "auto"` oppure
`provider: "none"` seleziona intenzionalmente la modalità basata solo su FTS, il recupero dalla memoria può comunque
utilizzare l'ordinamento lessicale FTS quando gli embedding non sono disponibili.

I provider espliciti non locali adottano una strategia di chiusura in caso di errore. Se imposti `memorySearch.provider` su
un provider concreto basato su un servizio remoto, come Bedrock, DeepInfra, Gemini, GitHub
Copilot, LM Studio, Mistral, Ollama, OpenAI, Voyage o un provider personalizzato
compatibile con OpenAI, e tale provider non è disponibile durante l'esecuzione, `memory_search`
restituisce un risultato di indisponibilità anziché utilizzare silenziosamente il recupero basato solo su FTS. Correggi la
configurazione del provider o dell'autenticazione, passa a un provider raggiungibile oppure imposta
`provider: "none"` se desideri intenzionalmente un recupero basato solo su FTS.

### ID di provider personalizzati

`memorySearch.provider` può puntare a una voce personalizzata `models.providers.<id>` per adattatori di provider specifici per la memoria, come `ollama`, oppure per API di modelli compatibili con OpenAI, come `openai-responses` / `openai-completions`. OpenClaw risolve il proprietario di `api` di tale provider per l'adattatore di embedding, mantenendo al contempo l'ID del provider personalizzato per la gestione dell'endpoint, dell'autenticazione e del prefisso del modello. Ciò consente alle configurazioni con più GPU o più host di dedicare gli embedding della memoria a uno specifico endpoint locale:

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b", name: "Qwen3 Embedding 0.6B" }],
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

Gli embedding remoti richiedono una chiave API. Bedrock utilizza invece la catena di credenziali predefinita dell'AWS SDK (ruoli dell'istanza, SSO, chiavi di accesso o una chiave API Bedrock).

| Provider       | Variabile d'ambiente                                | Chiave di configurazione              |
| -------------- | --------------------------------------------------- | ------------------------------------- |
| Bedrock        | Catena di credenziali AWS o `AWS_BEARER_TOKEN_BEDROCK` | Non è necessaria alcuna chiave API |
| DeepInfra      | `DEEPINFRA_API_KEY`                                 | `models.providers.deepinfra.apiKey`   |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`      |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`  | Profilo di autenticazione tramite accesso dal dispositivo |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`     |
| Ollama         | `OLLAMA_API_KEY` (segnaposto)                       | --                                    |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`      |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`      |

<Note>
OAuth di Codex copre solo chat/completamenti e non soddisfa le richieste di embedding.
</Note>

---

## Configurazione dell'endpoint remoto

Utilizza `provider: "openai-compatible"` per un server `/v1/embeddings`
generico compatibile con OpenAI che non deve ereditare le credenziali globali della chat OpenAI.

<ParamField path="remote.baseUrl" type="string">
  URL di base personalizzato dell'API.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Sostituzione della chiave API.
</ParamField>
<ParamField path="remote.headers" type="object">
  Intestazioni HTTP aggiuntive (unite ai valori predefiniti del provider).
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
    | Chiave                 | Tipo     | Valore predefinito     | Descrizione                                      |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Supporta anche `gemini-embedding-2-preview`      |
    | `outputDimensionality` | `number` | `3072`                 | Per Embedding 2: 768, 1536 o 3072                |

    <Warning>
    La modifica del modello o di `outputDimensionality` cambia l'identità dell'indice. OpenClaw
    sospende la ricerca vettoriale finché non ricostruisci esplicitamente l'indice della memoria.
    </Warning>

  </Accordion>
  <Accordion title="Tipi di input compatibili con OpenAI">
    Gli endpoint di embedding compatibili con OpenAI possono abilitare campi di richiesta `input_type` specifici del provider. Questa opzione è utile per i modelli di embedding asimmetrici che richiedono etichette diverse per gli embedding delle query e dei documenti.

    | Chiave              | Tipo     | Valore predefinito | Descrizione                                                        |
    | ------------------- | -------- | ------------------ | ------------------------------------------------------------------ |
    | `inputType`         | `string` | non impostato      | `input_type` condiviso per gli embedding delle query e dei documenti |
    | `queryInputType`    | `string` | non impostato      | `input_type` durante le query; sostituisce `inputType`             |
    | `documentInputType` | `string` | non impostato      | `input_type` dell'indice/documento; sostituisce `inputType`        |

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

    La modifica di questi valori influisce sull'identità della cache degli embedding per l'indicizzazione in batch del provider e deve essere seguita da una nuova indicizzazione della memoria quando il modello a monte tratta le etichette in modo diverso.

  </Accordion>
  <Accordion title="Bedrock">
    ### Configurazione degli embedding di Bedrock

    Bedrock utilizza la catena di credenziali predefinita dell'AWS SDK insieme a un token bearer verificato da OpenClaw, pertanto nella configurazione non viene memorizzata alcuna chiave API. Se OpenClaw viene eseguito su EC2 con un ruolo dell'istanza abilitato per Bedrock, è sufficiente impostare il provider e il modello:

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

    | Chiave                 | Tipo     | Valore predefinito               | Descrizione                            |
    | ---------------------- | -------- | --------------------------------- | -------------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0`   | Qualsiasi ID di modello di embedding Bedrock |
    | `outputDimensionality` | `number` | predefinito del modello           | Per Titan V2: 256, 512 o 1024          |

    **Modelli supportati** (con rilevamento della famiglia e dimensioni predefinite):

    | ID modello                                  | Fornitore  | Dimensioni predefinite | Dimensioni configurabili        |
    | ------------------------------------------- | ---------- | ---------------------- | -------------------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024                   | 256, 512, 1024                   |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536                   | --                               |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536                   | --                               |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024                   | --                               |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024                   | 256, 384, 1024, 3072             |
    | `cohere.embed-english-v3`                  | Cohere     | 1024                   | --                               |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024                   | --                               |
    | `cohere.embed-v4:0`                        | Cohere     | 1536                   | 256, 384, 512, 768, 1024, 1536   |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512                    | --                               |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024                   | --                               |

    Le varianti con suffisso di velocità effettiva (ad esempio, `amazon.titan-embed-text-v1:2:8k`) e gli ID dei profili di inferenza con prefisso regionale (ad esempio, `us.amazon.titan-embed-text-v2:0`) ereditano la configurazione del modello di base.

    **Regione:** viene risolta in questo ordine: la sostituzione `memorySearch.remote.baseUrl`, la configurazione `models.providers.amazon-bedrock.baseUrl`, `AWS_REGION`, `AWS_DEFAULT_REGION`, quindi il valore predefinito `us-east-1`.

    **Autenticazione:** OpenClaw verifica prima la presenza di `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` o `AWS_BEARER_TOKEN_BEDROCK`, quindi passa alla catena standard di fornitori di credenziali predefinita dell'SDK AWS:

    1. Variabili di ambiente (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`), a meno che non sia impostato anche `AWS_PROFILE`
    2. SSO (solo quando sono configurati i campi SSO)
    3. File condivisi di credenziali e configurazione (`fromIni`, include `AWS_PROFILE`)
    4. Processo delle credenziali (`credential_process` nel file di configurazione AWS)
    5. Credenziali del token di identità Web
    6. Credenziali dei metadati delle istanze ECS o EC2

    **Autorizzazioni IAM:** il ruolo o l'utente IAM necessita di:

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    Per applicare il privilegio minimo, limita `InvokeModel` al modello specifico:

    ```text
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="Locale (GGUF + llama.cpp)">
    | Chiave                | Tipo               | Valore predefinito      | Descrizione                                                                                                                                                                                                                                                                                                                                 |
    | --------------------- | ------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | scaricato automaticamente | Percorso del file del modello GGUF                                                                                                                                                                                                                                                                                                         |
    | `local.modelCacheDir` | `string`           | predefinito di node-llama-cpp | Directory della cache per i modelli scaricati                                                                                                                                                                                                                                                                                         |
    | `local.contextSize`   | `number \| "auto"` | `4096`                  | Dimensione della finestra di contesto per il contesto di embedding. 4096 copre i segmenti tipici (128-512 token) limitando al contempo la VRAM non occupata dai pesi. Riducila a 1024-2048 sugli host con risorse limitate. `"auto"` usa il massimo previsto dall'addestramento del modello; non è consigliato per i modelli da 8B o più (Qwen3-Embedding-8B: fino a 40 960 token possono portare la VRAM a circa 32 GB). |

    Installa prima il fornitore ufficiale llama.cpp: `openclaw plugins install @openclaw/llama-cpp-provider`.
    Modello predefinito: `embeddinggemma-300m-qat-Q8_0.gguf` (circa 0,6 GB, scaricato automaticamente). I checkout del codice sorgente richiedono comunque l'approvazione della compilazione nativa: `pnpm approve-builds`, quindi `pnpm rebuild node-llama-cpp`.

    Usa la CLI autonoma per verificare lo stesso percorso del fornitore utilizzato dal Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    I valori numerici di `local.contextSize` guidano anche il posizionamento automatico dei livelli GPU di node-llama-cpp, in modo che i pesi del modello e il contesto di embedding richiesto vengano allocati insieme. Dopo il caricamento da parte del runtime, `openclaw memory status --deep` segnala l'ultimo backend llama.cpp noto, il dispositivo, l'offload, il contesto richiesto e i dati sulla memoria con indicazione temporale; lo stato passivo non carica alcun modello.

    Imposta esplicitamente `provider: "local"` per gli embedding GGUF locali. I riferimenti ai modelli `hf:` e HTTP(S) sono supportati per le configurazioni locali esplicite, tramite la risoluzione dei modelli di node-llama-cpp, ma non modificano il fornitore predefinito.

  </Accordion>
</AccordionGroup>

### Timeout degli embedding in linea

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Sostituisce il timeout per i batch di embedding in linea durante l'indicizzazione della memoria.

Se non è impostato, viene usato il valore predefinito del fornitore: 600 secondi per i fornitori locali o self-hosted, come `local`, `ollama` e `lmstudio`, e 120 secondi per i fornitori ospitati. Aumenta questo valore quando i batch di embedding locali vincolati dalla CPU funzionano correttamente ma sono lenti.
</ParamField>

---

## Comportamento dell'indicizzazione

Tutte le opzioni si trovano sotto `memorySearch.sync`, salvo diversa indicazione:

| Chiave                         | Tipo      | Valore predefinito | Descrizione                                                                                  |
| ------------------------------ | --------- | ------------------ | -------------------------------------------------------------------------------------------- |
| `onSessionStart`               | `boolean` | `true`             | Sincronizza l'indice della memoria all'avvio di una sessione                                 |
| `onSearch`                     | `boolean` | `true`             | Sincronizza in modo differito durante la ricerca dopo aver rilevato modifiche ai contenuti    |
| `watch`                        | `boolean` | `true`             | Monitora i file di memoria (chokidar) e pianifica la reindicizzazione in caso di modifiche    |
| `watchDebounceMs`              | `number`  | `1500`             | Finestra di debounce per accorpare eventi ravvicinati di monitoraggio dei file                |
| `intervalMinutes`              | `number`  | `0`                | Intervallo di reindicizzazione periodica in minuti (`0` la disabilita)                        |
| `sessions.postCompactionForce` | `boolean` | `true`             | Forza la reindicizzazione di una sessione dopo gli aggiornamenti della trascrizione attivati dalla Compaction |

<ParamField path="chunking.tokens" type="number">
  Dimensione in token dei segmenti usata per suddividere le fonti di memoria prima dell'embedding (valore predefinito: 400).
</ParamField>
<ParamField path="chunking.overlap" type="number">
  Sovrapposizione in token tra segmenti adiacenti per preservare il contesto in prossimità dei punti di suddivisione (valore predefinito: 80).
</ParamField>

<Note>
La modifica di `chunking.tokens` o `chunking.overlap` cambia i limiti dei segmenti e invalida l'identità dell'indice esistente (vedere l'avviso nella sezione Selezione del provider).
</Note>

---

## Configurazione della ricerca ibrida

Tutte le opzioni sotto `memorySearch.query`:

| Chiave       | Tipo     | Valore predefinito | Descrizione                                                     |
| ------------ | -------- | ------------------ | --------------------------------------------------------------- |
| `maxResults` | `number` | `6`                | Numero massimo di risultati della memoria restituiti prima dell'inserimento |
| `minScore`   | `number` | `0.35`             | Punteggio minimo di pertinenza per includere un risultato       |

E sotto `memorySearch.query.hybrid`:

| Chiave                | Tipo      | Valore predefinito | Descrizione                                      |
| --------------------- | --------- | ------------------ | ------------------------------------------------ |
| `enabled`             | `boolean` | `true`             | Abilita la ricerca ibrida BM25 + vettoriale      |
| `vectorWeight`        | `number`  | `0.7`              | Peso dei punteggi vettoriali (0-1)               |
| `textWeight`          | `number`  | `0.3`              | Peso dei punteggi BM25 (0-1)                     |
| `candidateMultiplier` | `number`  | `4`                | Moltiplicatore della dimensione del pool di candidati |

<Tabs>
  <Tab title="MMR (diversità)">
    | Chiave        | Tipo      | Valore predefinito | Descrizione                                      |
    | ------------- | --------- | ------------------ | ------------------------------------------------ |
    | `mmr.enabled` | `boolean` | `false`            | Abilita il riordinamento MMR                     |
    | `mmr.lambda`  | `number`  | `0.7`              | 0 = massima diversità, 1 = massima pertinenza    |
  </Tab>
  <Tab title="Decadimento temporale (recenza)">
    | Chiave                       | Tipo      | Valore predefinito | Descrizione                              |
    | ---------------------------- | --------- | ------------------ | ---------------------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false`            | Abilita l'incremento per recenza         |
    | `temporalDecay.halfLifeDays` | `number`  | `30`               | Il punteggio si dimezza ogni N giorni    |

    I file sempre attuali (`MEMORY.md` e i file senza data in `memory/`) non sono mai soggetti a decadimento.

  </Tab>
</Tabs>

### Esempio completo

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          maxResults: 6,
          minScore: 0.35,
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

I percorsi possono essere assoluti o relativi allo spazio di lavoro. Le directory vengono analizzate ricorsivamente alla ricerca di file `.md`. La gestione dei collegamenti simbolici dipende dal backend attivo: il motore integrato ignora i collegamenti simbolici, mentre QMD segue il comportamento dello scanner QMD sottostante.

Per la ricerca nelle trascrizioni tra agenti con ambito limitato all'agente, usare `agents.list[].memorySearch.qmd.extraCollections` anziché `memory.qmd.paths`. Queste raccolte aggiuntive seguono la stessa struttura `{ path, name, pattern? }`, ma vengono unite per ogni agente e possono mantenere nomi condivisi espliciti quando il percorso punta all'esterno dello spazio di lavoro corrente. Se lo stesso percorso risolto compare sia in `memory.qmd.paths` sia in `memorySearch.qmd.extraCollections`, QMD mantiene la prima voce e ignora il duplicato.

---

## Memoria multimodale (Gemini)

Indicizza immagini e audio insieme a Markdown usando Gemini Embedding 2:

| Chiave                    | Tipo       | Valore predefinito | Descrizione                                      |
| ------------------------- | ---------- | ------------------ | ------------------------------------------------ |
| `multimodal.enabled`      | `boolean`  | `false`            | Abilita l'indicizzazione multimodale             |
| `multimodal.modalities`   | `string[]` | --                 | `["image"]`, `["audio"]` o `["all"]`             |
| `multimodal.maxFileBytes` | `number`   | `10485760`         | Dimensione massima dei file da indicizzare (10 MiB) |

<Note>
Si applica solo ai file in `extraPaths`. Le radici di memoria predefinite rimangono limitate a Markdown. Richiede `gemini-embedding-2-preview`. `fallback` deve essere `"none"`.
</Note>

Formati supportati: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (immagini); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Cache degli embedding

| Chiave             | Tipo      | Valore predefinito | Descrizione                                       |
| ------------------ | --------- | ------------------ | ------------------------------------------------- |
| `cache.enabled`    | `boolean` | `true`             | Memorizza nella cache gli embedding dei blocchi in SQLite |
| `cache.maxEntries` | `number`  | non impostato      | Limite superiore indicativo degli embedding memorizzati nella cache |

Evita di generare nuovamente gli embedding del testo invariato durante la reindicizzazione o gli aggiornamenti delle trascrizioni. Lascia `maxEntries` non impostato per una cache senza limiti; impostalo quando la crescita dello spazio su disco è più importante della velocità massima di reindicizzazione. Quando è impostato, una volta superato il limite vengono eliminate per prime le voci meno recenti, in base all'ora dell'ultimo aggiornamento.

---

## Indicizzazione in batch

| Chiave                        | Tipo      | Valore predefinito | Descrizione                         |
| ----------------------------- | --------- | ------------------ | ----------------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`                | Embedding inline in parallelo       |
| `remote.batch.enabled`        | `boolean` | `false`            | Abilita l'API di embedding in batch |
| `remote.batch.concurrency`    | `number`  | `2`                | Processi batch in parallelo         |
| `remote.batch.wait`           | `boolean` | `true`             | Attende il completamento del batch  |
| `remote.batch.pollIntervalMs` | `number`  | `2000`             | Intervallo di polling               |
| `remote.batch.timeoutMinutes` | `number`  | `60`               | Timeout del batch                   |

Disponibile per `gemini`, `openai` e `voyage`. L'elaborazione in batch di OpenAI è generalmente la soluzione più rapida ed economica per i backfill di grandi dimensioni.

`remote.nonBatchConcurrency` controlla le chiamate di embedding inline utilizzate dai provider locali o self-hosted e dai provider in hosting quando le API batch del provider non sono attive. Per l'indicizzazione non batch, il valore predefinito di Ollama è `1`, per evitare di sovraccaricare gli host locali meno potenti; imposta un valore superiore sui computer più potenti.

Questa impostazione è distinta da `sync.embeddingBatchTimeoutSeconds`, che controlla il timeout delle chiamate di embedding inline.

---

## Ricerca nella memoria delle sessioni (sperimentale)

Indicizza le trascrizioni delle sessioni e rendile disponibili tramite `memory_search`:

| Chiave                        | Tipo       | Valore predefinito | Descrizione                                      |
| ----------------------------- | ---------- | ------------------ | ------------------------------------------------ |
| `experimental.sessionMemory`  | `boolean`  | `false`            | Abilita l'indicizzazione delle sessioni          |
| `sources`                     | `string[]` | `["memory"]`       | Aggiungi `"sessions"` per includere le trascrizioni |
| `sync.sessions.deltaBytes`    | `number`   | `100000`           | Soglia in byte per la reindicizzazione            |
| `sync.sessions.deltaMessages` | `number`   | `50`               | Soglia di messaggi per la reindicizzazione        |

<Warning>
L'indicizzazione delle sessioni è facoltativa e viene eseguita in modo asincrono. I risultati possono essere leggermente obsoleti. I registri delle sessioni risiedono sul disco, quindi considera l'accesso al file system come il confine di attendibilità.
</Warning>

Anche i risultati delle trascrizioni delle sessioni rispettano
[`tools.sessions.visibility`](/it/gateway/config-tools#toolssessions). La visibilità
predefinita `tree` espone solo la sessione corrente e le sessioni da essa avviate.
Per recuperare, da una sessione diversa come un messaggio diretto, una sessione
non correlata dello stesso agente distribuita dal Gateway, amplia intenzionalmente
la visibilità ad `agent` (oppure ad `all` solo quando è richiesto anche il recupero
tra agenti e i criteri di comunicazione tra agenti lo consentono).

Gli esempi seguenti collocano queste impostazioni sotto `agents.defaults`. Puoi
anche applicare impostazioni `memorySearch` equivalenti in una sostituzione per
singolo agente quando solo un agente deve indicizzare e cercare nelle trascrizioni
delle sessioni.

Per il recupero dal Gateway ai messaggi diretti dello stesso agente:

<Tabs>
  <Tab title="Backend integrato">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
  <Tab title="Backend QMD">
    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            experimental: { sessionMemory: true },
            sources: ["memory", "sessions"],
          },
        },
      },
      memory: {
        backend: "qmd",
        qmd: {
          sessions: { enabled: true },
        },
      },
      tools: {
        sessions: { visibility: "agent" },
      },
    }
    ```
  </Tab>
</Tabs>

Quando utilizzi QMD, `agents.defaults.memorySearch.experimental.sessionMemory` e
`sources: ["sessions"]` non esportano autonomamente le trascrizioni in QMD. Imposta
anche `memory.qmd.sessions.enabled: true`.

---

  ## Accelerazione vettoriale SQLite (sqlite-vec)

  | Chiave                       | Tipo      | Valore predefinito | Descrizione                                  |
  | ---------------------------- | --------- | ------------------ | -------------------------------------------- |
  | `store.vector.enabled`       | `boolean` | `true`             | Usa sqlite-vec per le query vettoriali       |
  | `store.vector.extensionPath` | `string`  | incluso             | Sovrascrive il percorso di sqlite-vec        |

  Quando sqlite-vec non è disponibile, OpenClaw passa automaticamente alla similarità del coseno calcolata all'interno del processo.

  ---

  ## Archiviazione degli indici

  Gli indici di memoria integrati si trovano nel database SQLite di OpenClaw di ciascun agente, in
  `agents/<agentId>/agent/openclaw-agent.sqlite`.

  | Chiave                | Tipo     | Valore predefinito | Descrizione                                  |
  | --------------------- | -------- | ------------------ | -------------------------------------------- |
  | `store.fts.tokenizer` | `string` | `unicode61`        | Tokenizzatore FTS5 (`unicode61` o `trigram`) |

  ---

  ## Configurazione del backend QMD

  Imposta `memory.backend = "qmd"` per abilitarlo. Tutte le impostazioni QMD si trovano sotto `memory.qmd`:

  | Chiave                   | Tipo      | Valore predefinito | Descrizione                                                                                                       |
  | ------------------------ | --------- | ------------------ | ----------------------------------------------------------------------------------------------------------------- |
  | `command`                | `string`  | `qmd`              | Percorso dell'eseguibile QMD; imposta un percorso assoluto quando il `PATH` del servizio differisce da quello della shell |
  | `searchMode`             | `string`  | `search`           | Comando di ricerca: `search`, `vsearch`, `query`                                                                  |
  | `rerank`                 | `boolean` | --                 | Imposta su `false` con `searchMode: "query"` e QMD 2.1+ per saltare il riordinamento QMD                          |
  | `includeDefaultMemory`   | `boolean` | `true`             | Indicizza automaticamente `MEMORY.md` + `memory/**/*.md`                                                          |
  | `paths[]`                | `array`   | --                 | Percorsi aggiuntivi: `{ name, path, pattern? }`                                                                   |
  | `sessions.enabled`       | `boolean` | `false`            | Esporta le trascrizioni delle sessioni in QMD                                                                     |
  | `sessions.retentionDays` | `number`  | --                 | Conservazione delle trascrizioni                                                                                  |
  | `sessions.exportDir`     | `string`  | --                 | Directory di esportazione                                                                                         |

  `searchMode: "search"` usa esclusivamente la ricerca lessicale/BM25. Per questa modalità, OpenClaw non esegue verifiche di disponibilità dei vettori semantici né la manutenzione degli embedding QMD, anche durante `memory status --deep`; `vsearch` e `query` continuano a richiedere la disponibilità dei vettori e degli embedding QMD.

  `rerank: false` modifica solo la modalità `query` di QMD e richiede QMD 2.1 o una versione successiva. In modalità CLI diretta, OpenClaw passa `--no-rerank`; nella modalità MCP basata su mcporter, passa `rerank: false` allo strumento di query unificato di QMD. Lascialo non impostato per usare il comportamento predefinito di riordinamento delle query di QMD.

  OpenClaw preferisce i formati correnti delle raccolte QMD e delle query MCP, ma mantiene la compatibilità con le versioni precedenti di QMD provando, quando necessario, flag compatibili per i pattern delle raccolte e i nomi meno recenti degli strumenti MCP. Quando QMD dichiara il supporto per più filtri di raccolta, le raccolte con la stessa origine vengono cercate tramite un unico processo QMD; le build meno recenti di QMD mantengono il percorso di compatibilità per singola raccolta. Per stessa origine si intende che le raccolte di memoria persistente (file di memoria predefiniti e percorsi personalizzati) vengono raggruppate, mentre le raccolte delle trascrizioni delle sessioni rimangono un gruppo separato, affinché la diversificazione delle origini continui a disporre di entrambi gli input.

  <Note>
  Le sostituzioni dei modelli QMD rimangono sul lato QMD, non nella configurazione di OpenClaw. Se devi sostituire globalmente i modelli di QMD, imposta variabili di ambiente come `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` e `QMD_GENERATE_MODEL` nell'ambiente di esecuzione del Gateway.
  </Note>

  ### Integrazione con mcporter

  Tutte le impostazioni si trovano sotto `memory.qmd.mcporter`. Instrada le ricerche QMD attraverso un demone MCP `mcporter` di lunga durata invece di avviare `qmd` per ogni query, riducendo il sovraccarico dell'avvio a freddo per i modelli più grandi.

  | Chiave        | Tipo      | Valore predefinito | Descrizione                                                                      |
  | ------------- | --------- | ------------------ | -------------------------------------------------------------------------------- |
  | `enabled`     | `boolean` | `false`            | Instrada le chiamate QMD tramite mcporter invece di avviare `qmd` per ogni richiesta |
  | `serverName`  | `string`  | `qmd`              | Nome del server mcporter che esegue `qmd mcp` con `lifecycle: keep-alive`         |
  | `startDaemon` | `boolean` | `true`             | Avvia automaticamente il demone mcporter quando `enabled` è `true`               |

  Richiede che `mcporter` sia installato e disponibile nel PATH, oltre a un server mcporter configurato che esegua `qmd mcp`. Mantienilo disabilitato per le configurazioni locali più semplici, nelle quali il costo dell'avvio di un processo per ogni query è accettabile.

  <AccordionGroup>
  <Accordion title="Pianificazione degli aggiornamenti">
    | Chiave                    | Tipo      | Valore predefinito | Descrizione                                                                                              |
    | ------------------------- | --------- | ------------------ | -------------------------------------------------------------------------------------------------------- |
    | `update.interval`         | `string`  | `5m`               | Intervallo di aggiornamento                                                                              |
    | `update.debounceMs`       | `number`  | `15000`            | Applica il debounce alle modifiche dei file                                                              |
    | `update.onBoot`           | `boolean` | `true`             | Aggiorna all'apertura del gestore QMD di lunga durata; imposta su false per saltare l'aggiornamento immediato all'avvio |
    | `update.startup`          | `string`  | `off`              | Inizializzazione QMD facoltativa all'avvio del Gateway: `off`, `idle` o `immediate`                      |
    | `update.startupDelayMs`   | `number`  | `120000`           | Ritardo prima dell'esecuzione dell'aggiornamento con `startup: "idle"`                                   |
    | `update.waitForBootSync`  | `boolean` | `false`            | Blocca l'apertura del gestore fino al completamento dell'aggiornamento iniziale                          |
    | `update.embedInterval`    | `string`  | `60m`              | Frequenza separata per gli embedding                                                                     |
    | `update.commandTimeoutMs` | `number`  | `30000`            | Timeout per i comandi di manutenzione QMD (elenco/aggiunta di raccolte)                                  |
    | `update.updateTimeoutMs`  | `number`  | `120000`           | Timeout per ogni ciclo `qmd update`                                                                      |
    | `update.embedTimeoutMs`   | `number`  | `120000`           | Timeout per ogni ciclo `qmd embed`                                                                       |
  </Accordion>
  <Accordion title="Limiti">
    | Chiave                    | Tipo     | Valore predefinito | Descrizione                                      |
    | ------------------------- | -------- | ------------------ | ------------------------------------------------ |
    | `limits.maxResults`       | `number` | `4`                | Numero massimo di risultati di ricerca           |
    | `limits.maxSnippetChars`  | `number` | `450`              | Limita la lunghezza dell'estratto                 |
    | `limits.maxInjectedChars` | `number` | `2200`             | Limita il numero totale di caratteri inseriti     |
    | `limits.timeoutMs`        | `number` | `4000`             | Timeout della ricerca                             |
  </Accordion>
  <Accordion title="Ambito">
    Controlla quali sessioni possono ricevere i risultati di ricerca QMD. Usa lo stesso schema di [`session.sendPolicy`](/it/gateway/config-agents#session):

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

    L'impostazione predefinita fornita consente solo i messaggi diretti e nega i gruppi e gli altri tipi di canale. `match.keyPrefix` confronta la chiave di sessione normalizzata; `match.rawKeyPrefix` confronta la chiave non elaborata, incluso `agent:<id>:`.

  </Accordion>
  <Accordion title="Citazioni">
    `memory.citations` si applica a tutti i backend:

    | Valore           | Comportamento                                                        |
    | ---------------- | -------------------------------------------------------------------- |
    | `auto` (predefinito) | Include il piè di pagina `Source: <path#line>` nei frammenti     |
    | `on`             | Include sempre il piè di pagina                                      |
    | `off`            | Omette il piè di pagina (il percorso viene comunque passato internamente all'agente) |

  </Accordion>
</AccordionGroup>

Quando è abilitata l'inizializzazione di QMD all'avvio del Gateway, OpenClaw avvia QMD solo per gli agenti idonei. Se `update.onBoot` è `true` e non è configurata alcuna manutenzione a intervalli o degli embedding, all'avvio viene usato un gestore monouso per l'aggiornamento iniziale, che viene poi chiuso. Se è configurato un intervallo di aggiornamento o degli embedding, all'avvio viene aperto il gestore QMD a lunga durata, affinché possa gestire il watcher e i timer degli intervalli; `update.onBoot: false` evita solo l'aggiornamento immediato all'avvio.

### Esempio QMD completo

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 4, timeoutMs: 4000 },
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

Dreaming si configura in `plugins.entries.memory-core.config.dreaming`, non in `agents.defaults.memorySearch`.

Dreaming viene eseguito come un'unica scansione pianificata e utilizza internamente le fasi leggera, profonda e REM come dettaglio implementativo.

Per il comportamento concettuale e i comandi slash, consulta [Dreaming](/it/concepts/dreaming).

### Impostazioni utente

| Chiave                                 | Tipo      | Valore predefinito | Descrizione                                                                                                                              |
| -------------------------------------- | --------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`                              | `boolean` | `false`            | Abilita o disabilita completamente Dreaming                                                                                              |
| `frequency`                            | `string`  | `0 3 * * *`        | Cadenza Cron facoltativa per la scansione completa di Dreaming                                                                           |
| `model`                                | `string`  | modello predefinito | Sostituzione facoltativa del modello del sottoagente Dream Diary                                                                          |
| `phases.deep.maxPromotedSnippetTokens` | `number`  | `160`              | Numero massimo stimato di token conservati da ciascun frammento di richiamo a breve termine promosso in `MEMORY.md`; i metadati di provenienza restano visibili |

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
- Dreaming scrive l'output narrativo leggibile in `DREAMS.md` (o nel file `dreams.md` esistente).
- `dreaming.model` utilizza il controllo di attendibilità esistente per i sottoagenti del Plugin; imposta `plugins.entries.memory-core.subagent.allowModelOverride: true` prima di abilitarlo.
- Dream Diary riprova una volta con il modello predefinito della sessione quando il modello configurato non è disponibile. Gli errori di attendibilità o dell'elenco consentito vengono registrati e non vengono ritentati in modo invisibile.
- I criteri e le soglie delle fasi leggera, profonda e REM costituiscono un comportamento interno, non una configurazione destinata all'utente.

</Note>

## Correlati

- [Riferimento della configurazione](/it/gateway/configuration-reference)
- [Panoramica della memoria](/it/concepts/memory)
- [Ricerca nella memoria](/it/concepts/memory-search)
