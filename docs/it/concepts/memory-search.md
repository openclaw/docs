---
read_when:
    - Vuoi capire come funziona memory_search
    - Vuoi scegliere un provider di embedding
    - Vuoi ottimizzare la qualità della ricerca
summary: Come la ricerca in memoria trova note rilevanti usando embedding e recupero ibrido
title: Ricerca nella memoria
x-i18n:
    generated_at: "2026-06-28T22:33:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32ffb9d996851566eb92b7812c5425f545ecbb5387a0a445686df35a6c8ae143
    source_path: concepts/memory-search.md
    workflow: 16
---

`memory_search` trova note pertinenti dai tuoi file di memoria, anche quando la
formulazione differisce dal testo originale. Funziona indicizzando la memoria in
piccoli frammenti e cercandoli con embedding, parole chiave o entrambi.

## Avvio rapido

La ricerca in memoria usa gli embedding OpenAI per impostazione predefinita. Per
usare un altro backend di embedding, imposta esplicitamente un provider:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai", // or "gemini", "local", "ollama", "openai-compatible", etc.
      },
    },
  },
}
```

Per configurazioni multi-endpoint con provider specifici per la memoria,
`provider` può anche essere una voce personalizzata `models.providers.<id>`, ad
esempio `ollama-5080`, quando quel provider imposta `api: "ollama"` o un altro
proprietario di adattatore per embedding di memoria.

Per embedding locali senza chiave API, installa
`@openclaw/llama-cpp-provider` e imposta `provider: "local"`. I checkout sorgente
potrebbero comunque richiedere l'approvazione della build nativa:
`pnpm approve-builds` e poi `pnpm rebuild node-llama-cpp`.

Alcuni endpoint di embedding compatibili con OpenAI richiedono etichette
asimmetriche come `input_type: "query"` per le ricerche e
`input_type: "document"` o `"passage"` per i frammenti indicizzati. Configurale
con `memorySearch.queryInputType` e `memorySearch.documentInputType`; consulta il
[Riferimento alla configurazione della memoria](/it/reference/memory-config#provider-specific-config).

## Provider supportati

| Provider          | ID                  | Richiede chiave API | Note                          |
| ----------------- | ------------------- | ------------------- | ----------------------------- |
| Bedrock           | `bedrock`           | No                  | Usa la catena di credenziali AWS |
| DeepInfra         | `deepinfra`         | Sì                  | Predefinito: `BAAI/bge-m3`    |
| Gemini            | `gemini`            | Sì                  | Supporta l'indicizzazione di immagini/audio |
| GitHub Copilot    | `github-copilot`    | No                  | Usa l'abbonamento Copilot     |
| Local             | `local`             | No                  | Modello GGUF, download da ~0,6 GB |
| Mistral           | `mistral`           | Sì                  |                               |
| Ollama            | `ollama`            | No                  | Locale/autogestito            |
| OpenAI            | `openai`            | Sì                  | Predefinito                   |
| OpenAI-compatible | `openai-compatible` | Di solito           | `/v1/embeddings` generico     |
| Voyage            | `voyage`            | Sì                  |                               |

## Come funziona la ricerca

OpenClaw esegue due percorsi di recupero in parallelo e unisce i risultati:

```mermaid
flowchart LR
    Q["Query"] --> E["Embedding"]
    Q --> T["Tokenize"]
    E --> VS["Vector Search"]
    T --> BM["BM25 Search"]
    VS --> M["Weighted Merge"]
    BM --> M
    M --> R["Top Results"]
```

- **Ricerca vettoriale** trova note con significato simile ("gateway host"
  corrisponde a "the machine running OpenClaw").
- **Ricerca per parole chiave BM25** trova corrispondenze esatte (ID, stringhe
  di errore, chiavi di configurazione).

Se è disponibile un solo percorso, l'altro viene eseguito da solo. La modalità
intenzionale solo FTS (`provider: "none"`) e la selezione automatica/predefinita
del provider possono comunque usare il ranking lessicale quando gli embedding non
sono disponibili.

I provider di embedding espliciti non locali sono diversi. Se imposti
`memorySearch.provider` su un provider concreto con backend remoto e quel provider
non è disponibile in runtime, `memory_search` segnala la memoria come non
disponibile invece di usare silenziosamente risultati solo FTS. Questo mantiene
visibile un provider semantico configurato ma non funzionante. Imposta
`provider: "none"` per un richiamo deliberatamente solo FTS, oppure correggi la
configurazione del provider/autenticazione per ripristinare il ranking semantico.

## Migliorare la qualità della ricerca

Due funzionalità opzionali aiutano quando hai una cronologia di note ampia:

### Decadimento temporale

Le note vecchie perdono gradualmente peso nel ranking, così le informazioni
recenti emergono per prime. Con l'emivita predefinita di 30 giorni, una nota del
mese scorso ottiene il 50% del suo peso originale. I file sempre attuali come
`MEMORY.md` non subiscono mai decadimento.

<Tip>
Abilita il decadimento temporale se il tuo agente ha mesi di note quotidiane e
le informazioni obsolete continuano a superare il contesto recente.
</Tip>

### MMR (diversità)

Riduce i risultati ridondanti. Se cinque note menzionano tutte la stessa
configurazione del router, MMR garantisce che i risultati principali coprano
argomenti diversi invece di ripetersi.

<Tip>
Abilita MMR se `memory_search` continua a restituire frammenti quasi duplicati da
note giornaliere diverse.
</Tip>

### Abilitarli entrambi

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            mmr: { enabled: true },
            temporalDecay: { enabled: true },
          },
        },
      },
    },
  },
}
```

## Memoria multimodale

Con Gemini Embedding 2, puoi indicizzare immagini e file audio insieme al
Markdown. Le query di ricerca restano testuali, ma trovano corrispondenze nei
contenuti visivi e audio. Consulta il
[Riferimento alla configurazione della memoria](/it/reference/memory-config) per la
configurazione.

## Ricerca nella memoria di sessione

Puoi opzionalmente indicizzare le trascrizioni delle sessioni così
`memory_search` può richiamare conversazioni precedenti. È una scelta esplicita
tramite `memorySearch.experimental.sessionMemory` e `sources: ["sessions"]`;
l'elenco di origini predefinito è solo memoria. Il flag sperimentale abilita
l'indicizzazione delle trascrizioni di sessione, mentre `sources` controlla se i
frammenti di sessione vengono cercati.

I risultati delle sessioni rispettano `tools.sessions.visibility`: l'impostazione
predefinita `tree` espone solo la sessione corrente e le sessioni che ha generato.
Per richiamare una sessione non correlata dello stesso agente inviata dal Gateway
da una sessione DM separata, amplia intenzionalmente la visibilità a `agent`.

Quando usi QMD, imposta anche `memory.qmd.sessions.enabled: true` così le
trascrizioni vengono esportate in una raccolta QMD. Consulta il
[riferimento alla configurazione](/it/reference/memory-config) per i dettagli.

## Risoluzione dei problemi

**Nessun risultato?** Esegui `openclaw memory status` per controllare l'indice. Se
è vuoto, esegui `openclaw memory index --force`.

**Solo corrispondenze per parole chiave?** Il tuo provider di embedding potrebbe
non essere configurato. Controlla `openclaw memory status --deep`.

**Gli embedding locali vanno in timeout?** `ollama`, `lmstudio` e `local` usano
per impostazione predefinita un timeout batch inline più lungo. Se l'host è
semplicemente lento, imposta
`agents.defaults.memorySearch.sync.embeddingBatchTimeoutSeconds` e riesegui
`openclaw memory index --force`.

**Testo CJK non trovato?** Ricostruisci l'indice FTS con
`openclaw memory index --force`.

## Ulteriori letture

- [Active Memory](/it/concepts/active-memory) -- memoria dei sotto-agenti per sessioni di chat interattive
- [Memoria](/it/concepts/memory) -- layout dei file, backend, strumenti
- [Riferimento alla configurazione della memoria](/it/reference/memory-config) -- tutte le opzioni di configurazione

## Correlati

- [Panoramica della memoria](/it/concepts/memory)
- [Active Memory](/it/concepts/active-memory)
- [Motore di memoria integrato](/it/concepts/memory-builtin)
