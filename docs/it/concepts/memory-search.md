---
read_when:
    - Vuoi capire come funziona memory_search
    - Vuoi scegliere un provider di embedding
    - Vuoi ottimizzare la qualità della ricerca
summary: Come la ricerca nella memoria trova note pertinenti usando rappresentazioni vettoriali e recupero ibrido
title: Ricerca nella memoria
x-i18n:
    generated_at: "2026-05-02T08:20:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2a71fb0809d5c70689e8046f854e4b4b4e79f45769ac2964e40a762ebb4e91a8
    source_path: concepts/memory-search.md
    workflow: 16
---

`memory_search` trova note pertinenti nei tuoi file di memoria, anche quando la
formulazione differisce dal testo originale. Funziona indicizzando la memoria in
piccoli blocchi e cercandoli tramite embedding, parole chiave o entrambi.

## Avvio rapido

Se hai un abbonamento GitHub Copilot, oppure una chiave API OpenAI, Gemini,
Voyage o Mistral configurata, la ricerca nella memoria funziona automaticamente.
Per impostare esplicitamente un provider:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai", // or "gemini", "local", "ollama", etc.
      },
    },
  },
}
```

Per configurazioni multi-endpoint, `provider` può anche essere una voce
personalizzata `models.providers.<id>`, come `ollama-5080`, quando quel provider
imposta `api: "ollama"` o un altro proprietario dell'adapter di embedding.

Per embedding locali senza chiave API, imposta `provider: "local"`. I checkout
del sorgente potrebbero comunque richiedere l'approvazione della build nativa:
`pnpm approve-builds` e poi `pnpm rebuild node-llama-cpp`.

Alcuni endpoint di embedding compatibili con OpenAI richiedono etichette
asimmetriche come `input_type: "query"` per le ricerche e
`input_type: "document"` o `"passage"` per i blocchi indicizzati. Configurale con
`memorySearch.queryInputType` e `memorySearch.documentInputType`; consulta il
[Riferimento alla configurazione della memoria](/it/reference/memory-config#provider-specific-config).

## Provider supportati

| Provider       | ID               | Richiede chiave API | Note                                                     |
| -------------- | ---------------- | ------------------- | -------------------------------------------------------- |
| Bedrock        | `bedrock`        | No                  | Rilevato automaticamente quando la catena di credenziali AWS si risolve |
| Gemini         | `gemini`         | Sì                  | Supporta l'indicizzazione di immagini/audio              |
| GitHub Copilot | `github-copilot` | No                  | Rilevato automaticamente, usa l'abbonamento Copilot      |
| Local          | `local`          | No                  | Modello GGUF, download di ~0,6 GB                        |
| Mistral        | `mistral`        | Sì                  | Rilevato automaticamente                                 |
| Ollama         | `ollama`         | No                  | Locale, deve essere impostato esplicitamente             |
| OpenAI         | `openai`         | Sì                  | Rilevato automaticamente, veloce                         |
| Voyage         | `voyage`         | Sì                  | Rilevato automaticamente                                 |

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
- **Ricerca per parole chiave BM25** trova corrispondenze esatte (ID, stringhe di
  errore, chiavi di configurazione).

Se è disponibile un solo percorso (nessun embedding o nessun FTS), l'altro viene
eseguito da solo.

Quando gli embedding non sono disponibili, OpenClaw usa comunque il ranking
lessicale sui risultati FTS invece di tornare solo all'ordinamento grezzo per
corrispondenza esatta. Questa modalità degradata potenzia i blocchi con una
copertura più forte dei termini della query e percorsi di file pertinenti,
mantenendo utile il richiamo anche senza `sqlite-vec` o un provider di embedding.

## Migliorare la qualità della ricerca

Due funzionalità opzionali aiutano quando hai una cronologia di note ampia:

### Decadimento temporale

Le note vecchie perdono gradualmente peso nel ranking, così le informazioni
recenti emergono per prime. Con il tempo di dimezzamento predefinito di 30
giorni, una nota del mese scorso ottiene il 50% del suo peso originale. I file
sempre validi come `MEMORY.md` non subiscono mai decadimento.

<Tip>
Abilita il decadimento temporale se il tuo agent ha mesi di note giornaliere e
le informazioni obsolete continuano a superare il contesto recente nel ranking.
</Tip>

### MMR (diversità)

Riduce i risultati ridondanti. Se cinque note menzionano tutte la stessa
configurazione del router, MMR assicura che i risultati principali coprano
argomenti diversi invece di ripetersi.

<Tip>
Abilita MMR se `memory_search` continua a restituire snippet quasi duplicati da
note giornaliere diverse.
</Tip>

### Abilitare entrambe

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
contenuti visivi e audio. Consulta il [Riferimento alla configurazione della memoria](/it/reference/memory-config)
per la configurazione.

## Ricerca nella memoria di sessione

Puoi indicizzare facoltativamente le trascrizioni delle sessioni, così
`memory_search` può ricordare conversazioni precedenti. È opt-in tramite
`memorySearch.experimental.sessionMemory`. Consulta il
[riferimento alla configurazione](/it/reference/memory-config) per i dettagli.

## Risoluzione dei problemi

**Nessun risultato?** Esegui `openclaw memory status` per controllare l'indice.
Se è vuoto, esegui `openclaw memory index --force`.

**Solo corrispondenze per parole chiave?** Il tuo provider di embedding potrebbe
non essere configurato. Controlla `openclaw memory status --deep`.

**Gli embedding locali scadono per timeout?** `ollama`, `lmstudio` e `local`
usano per impostazione predefinita un timeout batch inline più lungo. Se l'host
è semplicemente lento, imposta
`agents.defaults.memorySearch.sync.embeddingBatchTimeoutSeconds` e riesegui
`openclaw memory index --force`.

**Testo CJK non trovato?** Ricostruisci l'indice FTS con
`openclaw memory index --force`.

## Approfondimenti

- [Active Memory](/it/concepts/active-memory) -- memoria dei sub-agent per sessioni di chat interattive
- [Memoria](/it/concepts/memory) -- layout dei file, backend, strumenti
- [Riferimento alla configurazione della memoria](/it/reference/memory-config) -- tutte le opzioni di configurazione

## Correlati

- [Panoramica della memoria](/it/concepts/memory)
- [Active Memory](/it/concepts/active-memory)
- [Motore di memoria integrato](/it/concepts/memory-builtin)
