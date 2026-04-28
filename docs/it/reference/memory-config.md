---
read_when:
    - Vuoi configurare provider di ricerca nella memoria o modelli di embedding
    - Vuoi configurare il backend QMD
    - Vuoi regolare ricerca ibrida, MMR o decadimento temporale
    - Vuoi abilitare l'indicizzazione della memoria multimodale
sidebarTitle: Memory config
summary: Tutti i parametri di configurazione per la ricerca nella memoria, i provider di embedding, QMD, la ricerca ibrida e l'indicizzazione multimodale
title: Riferimento della configurazione della memoria
x-i18n:
    generated_at: "2026-04-26T11:37:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 15fd747abc6d0d43cfc869faa0b5e6c1618681ef3b02068207321d60d449a901
    source_path: reference/memory-config.md
    workflow: 15
---

Questa pagina elenca tutti i parametri di configurazione per la ricerca nella memoria di OpenClaw. Per panoramiche concettuali, vedi:

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
  <Card title="Ricerca nella memoria" href="/it/concepts/memory-search">
    Pipeline di ricerca e regolazione.
  </Card>
  <Card title="Active Memory" href="/it/concepts/active-memory">
    Sub-agent della memoria per sessioni interattive.
  </Card>
</CardGroup>

Tutte le impostazioni della ricerca nella memoria si trovano sotto `agents.defaults.memorySearch` in `openclaw.json`, salvo diversa indicazione.

<Note>
Se stai cercando il toggle della funzionalità **Active Memory** e la configurazione del sub-agent, si trovano sotto `plugins.entries.active-memory` invece che sotto `memorySearch`.

Active Memory usa un modello a due controlli:

1. il Plugin deve essere abilitato e puntare all'id dell'agente corrente
2. la richiesta deve essere una sessione di chat persistente interattiva idonea

Vedi [Active Memory](/it/concepts/active-memory) per il modello di attivazione, la configurazione posseduta dal Plugin, la persistenza del transcript e il modello di rollout sicuro.
</Note>

---

## Selezione del provider

| Chiave     | Tipo      | Predefinito      | Descrizione                                                                                                      |
| ---------- | --------- | ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | rilevato automaticamente | ID dell'adapter di embedding: `bedrock`, `gemini`, `github-copilot`, `local`, `mistral`, `ollama`, `openai`, `voyage` |
| `model`    | `string`  | predefinito del provider | Nome del modello di embedding                                                                                    |
| `fallback` | `string`  | `"none"`         | ID dell'adapter di fallback quando quello primario fallisce                                                     |
| `enabled`  | `boolean` | `true`           | Abilita o disabilita la ricerca nella memoria                                                                   |

### Ordine di rilevamento automatico

Quando `provider` non è impostato, OpenClaw seleziona il primo disponibile:

<Steps>
  <Step title="local">
    Selezionato se `memorySearch.local.modelPath` è configurato e il file esiste.
  </Step>
  <Step title="github-copilot">
    Selezionato se è possibile risolvere un token GitHub Copilot (variabile env o profilo auth).
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
  <Step title="bedrock">
    Selezionato se la catena di credenziali AWS SDK viene risolta (ruolo istanza, chiavi di accesso, profilo, SSO, web identity o configurazione condivisa).
  </Step>
</Steps>

`ollama` è supportato ma non viene rilevato automaticamente (impostalo esplicitamente).

### Risoluzione della chiave API

Gli embedding remoti richiedono una chiave API. Bedrock usa invece la catena di credenziali predefinita dell'AWS SDK (ruoli istanza, SSO, chiavi di accesso).

| Provider       | Variabile env                                       | Chiave di configurazione            |
| -------------- | --------------------------------------------------- | ----------------------------------- |
| Bedrock        | catena di credenziali AWS                           | Nessuna chiave API necessaria       |
| Gemini         | `GEMINI_API_KEY`                                    | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_TOKEN`  | Profilo auth tramite device login   |
| Mistral        | `MISTRAL_API_KEY`                                   | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY` (segnaposto)                       | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                    | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                    | `models.providers.voyage.apiKey`    |

<Note>
OAuth Codex copre solo chat/completions e non soddisfa le richieste di embedding.
</Note>

---

## Configurazione dell'endpoint remoto

Per endpoint personalizzati compatibili con OpenAI o per sovrascrivere i valori predefiniti del provider:

<ParamField path="remote.baseUrl" type="string">
  URL base API personalizzato.
</ParamField>
<ParamField path="remote.apiKey" type="string">
  Sovrascrive la chiave API.
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
    | Chiave                 | Tipo     | Predefinito            | Descrizione                                |
    | ---------------------- | -------- | ---------------------- | ------------------------------------------ |
    | `model`                | `string` | `gemini-embedding-001` | Supporta anche `gemini-embedding-2-preview` |
    | `outputDimensionality` | `number` | `3072`                 | Per Embedding 2: 768, 1536 o 3072          |

    <Warning>
    La modifica di `model` o `outputDimensionality` attiva una reindicizzazione completa automatica.
    </Warning>

  </Accordion>
  <Accordion title="Bedrock">
    Bedrock usa la catena di credenziali predefinita dell'AWS SDK — non servono chiavi API. Se OpenClaw gira su EC2 con un ruolo istanza abilitato per Bedrock, basta impostare provider e modello:

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

    | Chiave                 | Tipo     | Predefinito                    | Descrizione                    |
    | ---------------------- | -------- | ------------------------------ | ------------------------------ |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | Qualsiasi ID modello embedding Bedrock |
    | `outputDimensionality` | `number` | predefinito del modello        | Per Titan V2: 256, 512 o 1024  |

    **Modelli supportati** (con rilevamento della famiglia e dimensioni predefinite):

    | ID modello                                 | Provider   | Dim predefinite | Dim configurabili    |
    | ------------------------------------------ | ---------- | --------------- | -------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024            | 256, 512, 1024       |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536            | --                   |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536            | --                   |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024            | --                   |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024            | 256, 384, 1024, 3072 |
    | `cohere.embed-english-v3`                  | Cohere     | 1024            | --                   |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024            | --                   |
    | `cohere.embed-v4:0`                        | Cohere     | 1536            | 256-1536             |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512             | --                   |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024            | --                   |

    Le varianti con suffisso di throughput (ad esempio `amazon.titan-embed-text-v1:2:8k`) ereditano la configurazione del modello base.

    **Autenticazione:** l'auth Bedrock usa l'ordine standard di risoluzione delle credenziali dell'AWS SDK:

    1. Variabili d'ambiente (`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`)
    2. Cache token SSO
    3. Credenziali da web identity token
    4. File condivisi di credenziali e configurazione
    5. Credenziali metadata ECS o EC2

    La regione viene risolta da `AWS_REGION`, `AWS_DEFAULT_REGION`, dal `baseUrl` del provider `amazon-bedrock` oppure ricade su `us-east-1`.

    **Permessi IAM:** il ruolo o utente IAM deve avere:

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

  </Accordion>
  <Accordion title="Local (GGUF + node-llama-cpp)">
    | Chiave                | Tipo               | Predefinito              | Descrizione                                                                                                                                                                                                                                                                                                   |
    | --------------------- | ------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
    | `local.modelPath`     | `string`           | scaricato automaticamente | Percorso al file modello GGUF                                                                                                                                                                                                                                                                                 |
    | `local.modelCacheDir` | `string`           | predefinito di node-llama-cpp | Directory cache per i modelli scaricati                                                                                                                                                                                                                                                                   |
    | `local.contextSize`   | `number \| "auto"` | `4096`                   | Dimensione della finestra di contesto per il contesto di embedding. 4096 copre chunk tipici (128–512 token) limitando la VRAM non dedicata ai pesi. Riduci a 1024–2048 su host con risorse limitate. `"auto"` usa il massimo addestrato del modello — non consigliato per modelli 8B+ (Qwen3-Embedding-8B: 40 960 token → ~32 GB VRAM contro ~8,8 GB a 4096). |

    Modello predefinito: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, scaricato automaticamente). Richiede build nativa: `pnpm approve-builds` poi `pnpm rebuild node-llama-cpp`.

    Usa la CLI standalone per verificare lo stesso percorso provider usato dal Gateway:

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    Se `provider` è `auto`, `local` viene selezionato solo quando `local.modelPath` punta a un file locale esistente. I riferimenti a modelli `hf:` e HTTP(S) possono ancora essere usati esplicitamente con `provider: "local"`, ma non fanno sì che `auto` selezioni local prima che il modello sia disponibile su disco.

  </Accordion>
</AccordionGroup>

### Timeout inline degli embedding

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  Sovrascrive il timeout per i batch di embedding inline durante l'indicizzazione della memoria.

Se non impostato usa il valore predefinito del provider: 600 secondi per provider locali/self-hosted come `local`, `ollama` e `lmstudio`, e 120 secondi per i provider hosted. Aumentalo quando i batch di embedding locali, vincolati dalla CPU, sono sani ma lenti.
</ParamField>

---

## Configurazione della ricerca ibrida

Tutto sotto `memorySearch.query.hybrid`:

| Chiave                | Tipo      | Predefinito | Descrizione                        |
| --------------------- | --------- | ----------- | ---------------------------------- |
| `enabled`             | `boolean` | `true`      | Abilita la ricerca ibrida BM25 + vettoriale |
| `vectorWeight`        | `number`  | `0.7`       | Peso per i punteggi vettoriali (0-1) |
| `textWeight`          | `number`  | `0.3`       | Peso per i punteggi BM25 (0-1)     |
| `candidateMultiplier` | `number`  | `4`         | Moltiplicatore della dimensione del pool di candidati |

<Tabs>
  <Tab title="MMR (diversità)">
    | Chiave        | Tipo      | Predefinito | Descrizione                           |
    | ------------- | --------- | ----------- | ------------------------------------- |
    | `mmr.enabled` | `boolean` | `false`     | Abilita il riordinamento MMR          |
    | `mmr.lambda`  | `number`  | `0.7`       | 0 = massima diversità, 1 = massima rilevanza |
  </Tab>
  <Tab title="Decadimento temporale (recenza)">
    | Chiave                       | Tipo      | Predefinito | Descrizione                    |
    | ---------------------------- | --------- | ----------- | ------------------------------ |
    | `temporalDecay.enabled`      | `boolean` | `false`     | Abilita il boost per la recenza |
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

| Chiave       | Tipo       | Descrizione                                 |
| ------------ | ---------- | ------------------------------------------- |
| `extraPaths` | `string[]` | Directory o file aggiuntivi da indicizzare  |

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

I percorsi possono essere assoluti o relativi al workspace. Le directory vengono scansionate ricorsivamente per file `.md`. La gestione dei symlink dipende dal backend attivo: il motore integrato ignora i symlink, mentre QMD segue il comportamento dello scanner QMD sottostante.

Per la ricerca di transcript tra agenti con ambito agente, usa `agents.list[].memorySearch.qmd.extraCollections` invece di `memory.qmd.paths`. Quelle collezioni aggiuntive seguono la stessa forma `{ path, name, pattern? }`, ma vengono unite per agente e possono preservare nomi condivisi espliciti quando il percorso punta fuori dal workspace corrente. Se lo stesso percorso risolto compare sia in `memory.qmd.paths` sia in `memorySearch.qmd.extraCollections`, QMD mantiene la prima voce e salta il duplicato.

---

## Memoria multimodale (Gemini)

Indicizza immagini e audio insieme a Markdown usando Gemini Embedding 2:

| Chiave                    | Tipo       | Predefinito | Descrizione                              |
| ------------------------- | ---------- | ----------- | ---------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`     | Abilita l'indicizzazione multimodale     |
| `multimodal.modalities`   | `string[]` | --          | `["image"]`, `["audio"]` o `["all"]`     |
| `multimodal.maxFileBytes` | `number`   | `10000000`  | Dimensione massima del file per l'indicizzazione |

<Note>
Si applica solo ai file in `extraPaths`. Le root di memoria predefinite restano solo Markdown. Richiede `gemini-embedding-2-preview`. `fallback` deve essere `"none"`.
</Note>

Formati supportati: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif` (immagini); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Cache degli embedding

| Chiave             | Tipo      | Predefinito | Descrizione                         |
| ------------------ | --------- | ----------- | ----------------------------------- |
| `cache.enabled`    | `boolean` | `false`     | Memorizza nella cache SQLite gli embedding dei chunk |
| `cache.maxEntries` | `number`  | `50000`     | Numero massimo di embedding in cache |

Evita di ricalcolare gli embedding di testo invariato durante reindex o aggiornamenti del transcript.

---

## Indicizzazione batch

| Chiave                        | Tipo      | Predefinito | Descrizione                    |
| ----------------------------- | --------- | ----------- | ------------------------------ |
| `remote.batch.enabled`        | `boolean` | `false`     | Abilita l'API di embedding batch |
| `remote.batch.concurrency`    | `number`  | `2`         | Job batch paralleli            |
| `remote.batch.wait`           | `boolean` | `true`      | Attende il completamento del batch |
| `remote.batch.pollIntervalMs` | `number`  | --          | Intervallo di polling          |
| `remote.batch.timeoutMinutes` | `number`  | --          | Timeout del batch              |

Disponibile per `openai`, `gemini` e `voyage`. Il batch OpenAI è tipicamente il più rapido ed economico per grandi backfill.

Questo è separato da `sync.embeddingBatchTimeoutSeconds`, che controlla le chiamate di embedding inline usate dai provider locali/self-hosted e dai provider hosted quando le API batch del provider non sono attive.

---

## Ricerca nella memoria della sessione (sperimentale)

Indicizza i transcript delle sessioni ed esponili tramite `memory_search`:

| Chiave                        | Tipo       | Predefinito   | Descrizione                                |
| ----------------------------- | ---------- | ------------- | ------------------------------------------ |
| `experimental.sessionMemory`  | `boolean`  | `false`       | Abilita l'indicizzazione delle sessioni    |
| `sources`                     | `string[]` | `["memory"]`  | Aggiungi `"sessions"` per includere i transcript |
| `sync.sessions.deltaBytes`    | `number`   | `100000`      | Soglia in byte per il reindex              |
| `sync.sessions.deltaMessages` | `number`   | `50`          | Soglia in numero di messaggi per il reindex |

<Warning>
L'indicizzazione delle sessioni è opt-in e viene eseguita in modo asincrono. I risultati possono essere leggermente obsoleti. I log delle sessioni vivono su disco, quindi considera l'accesso al filesystem come il confine di fiducia.
</Warning>

---

## Accelerazione vettoriale SQLite (`sqlite-vec`)

| Chiave                       | Tipo      | Predefinito | Descrizione                             |
| ---------------------------- | --------- | ----------- | --------------------------------------- |
| `store.vector.enabled`       | `boolean` | `true`      | Usa sqlite-vec per le query vettoriali  |
| `store.vector.extensionPath` | `string`  | bundled     | Sovrascrive il percorso di sqlite-vec   |

Quando sqlite-vec non è disponibile, OpenClaw ricade automaticamente sulla similarità coseno in-process.

---

## Archiviazione dell'indice

| Chiave                | Tipo     | Predefinito                           | Descrizione                                     |
| --------------------- | -------- | ------------------------------------- | ----------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Posizione dell'indice (supporta il token `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | Tokenizer FTS5 (`unicode61` o `trigram`)        |

---

## Configurazione del backend QMD

Imposta `memory.backend = "qmd"` per abilitarlo. Tutte le impostazioni QMD si trovano sotto `memory.qmd`:

| Chiave                   | Tipo      | Predefinito | Descrizione                                     |
| ------------------------ | --------- | ----------- | ----------------------------------------------- |
| `command`                | `string`  | `qmd`       | Percorso dell'eseguibile QMD                    |
| `searchMode`             | `string`  | `search`    | Comando di ricerca: `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`      | Indicizza automaticamente `MEMORY.md` + `memory/**/*.md` |
| `paths[]`                | `array`   | --          | Percorsi aggiuntivi: `{ name, path, pattern? }` |
| `sessions.enabled`       | `boolean` | `false`     | Indicizza i transcript delle sessioni           |
| `sessions.retentionDays` | `number`  | --          | Retention dei transcript                        |
| `sessions.exportDir`     | `string`  | --          | Directory di esportazione                       |

OpenClaw preferisce le attuali forme di query MCP e collection di QMD, ma mantiene funzionanti le versioni meno recenti di QMD ricadendo sui flag legacy `--mask` delle collection e sui vecchi nomi degli strumenti MCP quando necessario.

<Note>
Gli override del modello QMD restano dal lato QMD, non nella configurazione OpenClaw. Se hai bisogno di sovrascrivere globalmente i modelli di QMD, imposta variabili d'ambiente come `QMD_EMBED_MODEL`, `QMD_RERANK_MODEL` e `QMD_GENERATE_MODEL` nell'ambiente runtime del gateway.
</Note>

<AccordionGroup>
  <Accordion title="Pianificazione degli aggiornamenti">
    | Chiave                    | Tipo      | Predefinito | Descrizione                                |
    | ------------------------- | --------- | ----------- | ------------------------------------------ |
    | `update.interval`         | `string`  | `5m`        | Intervallo di aggiornamento                |
    | `update.debounceMs`       | `number`  | `15000`     | Debounce delle modifiche ai file           |
    | `update.onBoot`           | `boolean` | `true`      | Aggiorna all'avvio                         |
    | `update.waitForBootSync`  | `boolean` | `false`     | Blocca l'avvio fino al completamento dell'aggiornamento |
    | `update.embedInterval`    | `string`  | --          | Cadenza separata per gli embedding         |
    | `update.commandTimeoutMs` | `number`  | --          | Timeout per i comandi QMD                  |
    | `update.updateTimeoutMs`  | `number`  | --          | Timeout per le operazioni di aggiornamento QMD |
    | `update.embedTimeoutMs`   | `number`  | --          | Timeout per le operazioni di embedding QMD |
  </Accordion>
  <Accordion title="Limiti">
    | Chiave                    | Tipo     | Predefinito | Descrizione                  |
    | ------------------------- | -------- | ----------- | ---------------------------- |
    | `limits.maxResults`       | `number` | `6`         | Numero massimo di risultati di ricerca |
    | `limits.maxSnippetChars`  | `number` | --          | Limita la lunghezza dello snippet |
    | `limits.maxInjectedChars` | `number` | --          | Limita il totale dei caratteri iniettati |
    | `limits.timeoutMs`        | `number` | `4000`      | Timeout della ricerca        |
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

    Il valore predefinito distribuito consente sessioni dirette e di canale, continuando però a negare i gruppi.

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

Dreaming è configurato sotto `plugins.entries.memory-core.config.dreaming`, non sotto `agents.defaults.memorySearch`.

Dreaming viene eseguito come una scansione pianificata singola e usa fasi interne light/deep/REM come dettaglio implementativo.

Per il comportamento concettuale e i comandi slash, vedi [Dreaming](/it/concepts/dreaming).

### Impostazioni utente

| Chiave      | Tipo      | Predefinito | Descrizione                                        |
| ----------- | --------- | ----------- | -------------------------------------------------- |
| `enabled`   | `boolean` | `false`     | Abilita o disabilita completamente Dreaming        |
| `frequency` | `string`  | `0 3 * * *` | Cadenza Cron facoltativa per la scansione completa di Dreaming |

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

<Note>
- Dreaming scrive lo stato macchina in `memory/.dreams/`.
- Dreaming scrive output narrativo leggibile da umani in `DREAMS.md` (o in `dreams.md` esistente).
- La policy di fase light/deep/REM e le soglie sono comportamento interno, non configurazione rivolta all'utente.

</Note>

## Correlati

- [Riferimento della configurazione](/it/gateway/configuration-reference)
- [Panoramica della memoria](/it/concepts/memory)
- [Ricerca nella memoria](/it/concepts/memory-search)
