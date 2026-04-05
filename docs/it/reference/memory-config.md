---
read_when:
    - Vuoi configurare provider di ricerca nella memoria o modelli di embedding
    - Vuoi configurare il backend QMD
    - Vuoi regolare ricerca ibrida, MMR o decadimento temporale
    - Vuoi abilitare l'indicizzazione multimodale della memoria
summary: Tutte le opzioni di configurazione per ricerca nella memoria, provider di embedding, QMD, ricerca ibrida e indicizzazione multimodale
title: Riferimento della configurazione della memoria
x-i18n:
    generated_at: "2026-04-05T14:03:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 89e4c9740f71f5a47fc5e163742339362d6b95cb4757650c0c8a095cf3078caa
    source_path: reference/memory-config.md
    workflow: 15
---

# Riferimento della configurazione della memoria

Questa pagina elenca ogni opzione di configurazione per la ricerca nella memoria di OpenClaw. Per
panoramiche concettuali, vedi:

- [Panoramica della memoria](/concepts/memory) -- come funziona la memoria
- [Motore integrato](/concepts/memory-builtin) -- backend SQLite predefinito
- [Motore QMD](/concepts/memory-qmd) -- sidecar locale-first
- [Ricerca nella memoria](/concepts/memory-search) -- pipeline di ricerca e regolazione

Tutte le impostazioni della ricerca nella memoria si trovano sotto `agents.defaults.memorySearch` in
`openclaw.json`, salvo diversa indicazione.

---

## Selezione del provider

| Chiave     | Tipo      | Predefinito      | Descrizione                                                                      |
| ---------- | --------- | ---------------- | -------------------------------------------------------------------------------- |
| `provider` | `string`  | rilevato automaticamente | ID adattatore embedding: `openai`, `gemini`, `voyage`, `mistral`, `ollama`, `local` |
| `model`    | `string`  | predefinito del provider | Nome del modello di embedding                                                |
| `fallback` | `string`  | `"none"`         | ID dell'adattatore di fallback quando quello primario fallisce                 |
| `enabled`  | `boolean` | `true`           | Abilita o disabilita la ricerca nella memoria                                  |

### Ordine di rilevamento automatico

Quando `provider` non è impostato, OpenClaw seleziona il primo disponibile:

1. `local` -- se `memorySearch.local.modelPath` è configurato e il file esiste.
2. `openai` -- se una chiave OpenAI può essere risolta.
3. `gemini` -- se una chiave Gemini può essere risolta.
4. `voyage` -- se una chiave Voyage può essere risolta.
5. `mistral` -- se una chiave Mistral può essere risolta.

`ollama` è supportato ma non viene rilevato automaticamente (impostalo esplicitamente).

### Risoluzione della chiave API

Gli embedding remoti richiedono una chiave API. OpenClaw la risolve da:
profili di autenticazione, `models.providers.*.apiKey` oppure variabili d'ambiente.

| Provider | Variabile env                 | Chiave config                      |
| -------- | ----------------------------- | ---------------------------------- |
| OpenAI   | `OPENAI_API_KEY`              | `models.providers.openai.apiKey`   |
| Gemini   | `GEMINI_API_KEY`              | `models.providers.google.apiKey`   |
| Voyage   | `VOYAGE_API_KEY`              | `models.providers.voyage.apiKey`   |
| Mistral  | `MISTRAL_API_KEY`             | `models.providers.mistral.apiKey`  |
| Ollama   | `OLLAMA_API_KEY` (segnaposto) | --                                 |

Codex OAuth copre solo chat/completions e non soddisfa le richieste di embedding.

---

## Configurazione dell'endpoint remoto

Per endpoint personalizzati compatibili OpenAI o per sovrascrivere i valori predefiniti del provider:

| Chiave           | Tipo     | Descrizione                                        |
| ---------------- | -------- | -------------------------------------------------- |
| `remote.baseUrl` | `string` | URL base API personalizzato                        |
| `remote.apiKey`  | `string` | Sovrascrive la chiave API                          |
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

## Configurazione specifica di Gemini

| Chiave                 | Tipo     | Predefinito           | Descrizione                                |
| ---------------------- | -------- | --------------------- | ------------------------------------------ |
| `model`                | `string` | `gemini-embedding-001` | Supporta anche `gemini-embedding-2-preview` |
| `outputDimensionality` | `number` | `3072`                | Per Embedding 2: 768, 1536 o 3072          |

<Warning>
La modifica del modello o di `outputDimensionality` attiva un reindex completo automatico.
</Warning>

---

## Configurazione degli embedding locali

| Chiave                | Tipo     | Predefinito               | Descrizione                     |
| --------------------- | -------- | ------------------------- | ------------------------------- |
| `local.modelPath`     | `string` | scaricato automaticamente | Percorso del file modello GGUF  |
| `local.modelCacheDir` | `string` | predefinito node-llama-cpp | Directory cache per i modelli scaricati |

Modello predefinito: `embeddinggemma-300m-qat-Q8_0.gguf` (~0,6 GB, scaricato automaticamente).
Richiede build nativa: `pnpm approve-builds` poi `pnpm rebuild node-llama-cpp`.

---

## Configurazione della ricerca ibrida

Tutto sotto `memorySearch.query.hybrid`:

| Chiave                | Tipo      | Predefinito | Descrizione                          |
| --------------------- | --------- | ----------- | ------------------------------------ |
| `enabled`             | `boolean` | `true`      | Abilita la ricerca ibrida BM25 + vettoriale |
| `vectorWeight`        | `number`  | `0.7`       | Peso per i punteggi vettoriali (0-1) |
| `textWeight`          | `number`  | `0.3`       | Peso per i punteggi BM25 (0-1)       |
| `candidateMultiplier` | `number`  | `4`         | Moltiplicatore della dimensione del pool di candidati |

### MMR (diversità)

| Chiave        | Tipo      | Predefinito | Descrizione                             |
| ------------- | --------- | ----------- | --------------------------------------- |
| `mmr.enabled` | `boolean` | `false`     | Abilita il riordinamento MMR            |
| `mmr.lambda`  | `number`  | `0.7`       | 0 = massima diversità, 1 = massima rilevanza |

### Decadimento temporale (recenza)

| Chiave                       | Tipo      | Predefinito | Descrizione                     |
| ---------------------------- | --------- | ----------- | ------------------------------- |
| `temporalDecay.enabled`      | `boolean` | `false`     | Abilita il boost per la recenza |
| `temporalDecay.halfLifeDays` | `number`  | `30`        | Il punteggio si dimezza ogni N giorni |

I file evergreen (`MEMORY.md`, file senza data in `memory/`) non subiscono mai decadimento.

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

I percorsi possono essere assoluti o relativi al workspace. Le directory vengono scandite
ricorsivamente alla ricerca di file `.md`. La gestione dei symlink dipende dal backend attivo:
il motore integrato ignora i symlink, mentre QMD segue il comportamento dello scanner QMD sottostante.

Per la ricerca tra agenti nelle trascrizioni con ambito agente, usa
`agents.list[].memorySearch.qmd.extraCollections` invece di `memory.qmd.paths`.
Queste raccolte aggiuntive seguono la stessa forma `{ path, name, pattern? }`, ma
vengono unite per agente e possono preservare nomi condivisi espliciti quando il percorso
punta all'esterno del workspace corrente.
Se lo stesso percorso risolto compare sia in `memory.qmd.paths` sia in
`memorySearch.qmd.extraCollections`, QMD mantiene la prima voce e salta il duplicato.

---

## Memoria multimodale (Gemini)

Indicizza immagini e audio insieme a Markdown usando Gemini Embedding 2:

| Chiave                    | Tipo       | Predefinito | Descrizione                              |
| ------------------------- | ---------- | ----------- | ---------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`     | Abilita l'indicizzazione multimodale     |
| `multimodal.modalities`   | `string[]` | --          | `["image"]`, `["audio"]` o `["all"]`     |
| `multimodal.maxFileBytes` | `number`   | `10000000`  | Dimensione massima del file per l'indicizzazione |

Si applica solo ai file in `extraPaths`. Le radici di memoria predefinite restano solo Markdown.
Richiede `gemini-embedding-2-preview`. `fallback` deve essere `"none"`.

Formati supportati: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
(immagini); `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac` (audio).

---

## Cache degli embedding

| Chiave             | Tipo      | Predefinito | Descrizione                              |
| ------------------ | --------- | ----------- | ---------------------------------------- |
| `cache.enabled`    | `boolean` | `false`     | Memorizza nella cache gli embedding dei chunk in SQLite |
| `cache.maxEntries` | `number`  | `50000`     | Numero massimo di embedding in cache     |

Impedisce di ricalcolare gli embedding di testo invariato durante reindex o aggiornamenti delle trascrizioni.

---

## Indicizzazione batch

| Chiave                        | Tipo      | Predefinito | Descrizione                    |
| ----------------------------- | --------- | ----------- | ------------------------------ |
| `remote.batch.enabled`        | `boolean` | `false`     | Abilita l'API di embedding batch |
| `remote.batch.concurrency`    | `number`  | `2`         | Job batch paralleli            |
| `remote.batch.wait`           | `boolean` | `true`      | Attende il completamento del batch |
| `remote.batch.pollIntervalMs` | `number`  | --          | Intervallo di polling          |
| `remote.batch.timeoutMinutes` | `number`  | --          | Timeout del batch              |

Disponibile per `openai`, `gemini` e `voyage`. Il batch OpenAI è in genere
più veloce ed economico per grandi backfill.

---

## Ricerca nella memoria di sessione (sperimentale)

Indicizza le trascrizioni delle sessioni e le espone tramite `memory_search`:

| Chiave                      | Tipo       | Predefinito   | Descrizione                                 |
| --------------------------- | ---------- | ------------- | ------------------------------------------- |
| `experimental.sessionMemory` | `boolean` | `false`       | Abilita l'indicizzazione delle sessioni     |
| `sources`                   | `string[]` | `["memory"]`  | Aggiungi `"sessions"` per includere le trascrizioni |
| `sync.sessions.deltaBytes`    | `number` | `100000`      | Soglia in byte per il reindex               |
| `sync.sessions.deltaMessages` | `number` | `50`          | Soglia in messaggi per il reindex           |

L'indicizzazione delle sessioni è opt-in e viene eseguita in modo asincrono. I risultati possono essere leggermente
obsoleti. I log delle sessioni vivono su disco, quindi considera l'accesso al filesystem come il confine di attendibilità.

---

## Accelerazione vettoriale SQLite (sqlite-vec)

| Chiave                     | Tipo      | Predefinito | Descrizione                            |
| -------------------------- | --------- | ----------- | -------------------------------------- |
| `store.vector.enabled`     | `boolean` | `true`      | Usa sqlite-vec per le query vettoriali |
| `store.vector.extensionPath` | `string` | incluso    | Sovrascrive il percorso di sqlite-vec  |

Quando sqlite-vec non è disponibile, OpenClaw ripiega automaticamente sulla
similarità coseno in-process.

---

## Archiviazione dell'indice

| Chiave                | Tipo     | Predefinito                           | Descrizione                                  |
| --------------------- | -------- | ------------------------------------- | -------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | Posizione dell'indice (supporta il token `{agentId}`) |
| `store.fts.tokenizer` | `string` | `unicode61`                           | Tokenizer FTS5 (`unicode61` o `trigram`)     |

---

## Configurazione del backend QMD

Imposta `memory.backend = "qmd"` per abilitarlo. Tutte le impostazioni QMD si trovano sotto
`memory.qmd`:

| Chiave                   | Tipo      | Predefinito | Descrizione                                   |
| ------------------------ | --------- | ----------- | --------------------------------------------- |
| `command`                | `string`  | `qmd`       | Percorso dell'eseguibile QMD                  |
| `searchMode`             | `string`  | `search`    | Comando di ricerca: `search`, `vsearch`, `query` |
| `includeDefaultMemory`   | `boolean` | `true`      | Indicizza automaticamente `MEMORY.md` + `memory/**/*.md` |
| `paths[]`                | `array`   | --          | Percorsi aggiuntivi: `{ name, path, pattern? }` |
| `sessions.enabled`       | `boolean` | `false`     | Indicizza le trascrizioni delle sessioni      |
| `sessions.retentionDays` | `number`  | --          | Conservazione delle trascrizioni              |
| `sessions.exportDir`     | `string`  | --          | Directory di esportazione                     |

### Pianificazione degli aggiornamenti

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

### Limiti

| Chiave                    | Tipo     | Predefinito | Descrizione                      |
| ------------------------- | -------- | ----------- | -------------------------------- |
| `limits.maxResults`       | `number` | `6`         | Numero massimo di risultati di ricerca |
| `limits.maxSnippetChars`  | `number` | --          | Limita la lunghezza degli snippet |
| `limits.maxInjectedChars` | `number` | --          | Limita il totale dei caratteri iniettati |
| `limits.timeoutMs`        | `number` | `4000`      | Timeout della ricerca            |

### Ambito

Controlla quali sessioni possono ricevere risultati di ricerca QMD. Stesso schema di
[`session.sendPolicy`](/gateway/configuration-reference#session):

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

Il valore predefinito è solo DM. `match.keyPrefix` corrisponde alla chiave di sessione normalizzata;
`match.rawKeyPrefix` corrisponde alla chiave grezza inclusa `agent:<id>:`.

### Citazioni

`memory.citations` si applica a tutti i backend:

| Valore           | Comportamento                                          |
| ---------------- | ------------------------------------------------------ |
| `auto` (predefinito) | Include il footer `Source: <path#line>` negli snippet |
| `on`             | Include sempre il footer                               |
| `off`            | Omette il footer (il percorso viene comunque passato internamente all'agente) |

### Esempio completo di QMD

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

## Dreaming (sperimentale)

Dreaming viene configurato sotto `plugins.entries.memory-core.config.dreaming`,
non sotto `agents.defaults.memorySearch`. Per i dettagli concettuali e i
comandi chat, vedi [Dreaming](/concepts/memory-dreaming).

| Chiave             | Tipo     | Predefinito      | Descrizione                                    |
| ------------------ | -------- | ---------------- | ---------------------------------------------- |
| `mode`             | `string` | `"off"`          | Preset: `off`, `core`, `rem` o `deep`          |
| `cron`             | `string` | predefinito del preset | Sovrascrive l'espressione cron della pianificazione |
| `timezone`         | `string` | fuso orario utente | Fuso orario per la valutazione della pianificazione |
| `limit`            | `number` | predefinito del preset | Numero massimo di candidati da promuovere per ciclo |
| `minScore`         | `number` | predefinito del preset | Punteggio ponderato minimo per la promozione |
| `minRecallCount`   | `number` | predefinito del preset | Soglia minima del conteggio dei richiami     |
| `minUniqueQueries` | `number` | predefinito del preset | Soglia minima del conteggio di query distinte |

### Valori predefiniti dei preset

| Modalità | Cadenza        | minScore | minRecallCount | minUniqueQueries |
| -------- | -------------- | -------- | -------------- | ---------------- |
| `off`    | Disabilitato   | --       | --             | --               |
| `core`   | Ogni giorno alle 3 AM | 0.75 | 3          | 2                |
| `rem`    | Ogni 6 ore     | 0.85     | 4              | 3                |
| `deep`   | Ogni 12 ore    | 0.80     | 3              | 3                |

### Esempio

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        config: {
          dreaming: {
            mode: "core",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```
