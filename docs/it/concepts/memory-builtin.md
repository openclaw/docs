---
read_when:
    - Vuoi capire il backend di memoria predefinito
    - Vuoi configurare provider di embedding o ricerca ibrida
summary: Il backend di memoria predefinito basato su SQLite con ricerca per parole chiave, vettoriale e ibrida
title: Motore di memoria integrato
x-i18n:
    generated_at: "2026-04-24T08:36:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: f82c1f4dc37b4fc6c075a7fcd2ec78bfcbfbebbcba7e48d366a1da3afcaff508
    source_path: concepts/memory-builtin.md
    workflow: 15
---

Il motore integrato è il backend di memoria predefinito. Memorizza il tuo indice di memoria in
un database SQLite per agente e non richiede dipendenze aggiuntive per iniziare.

## Cosa offre

- **Ricerca per parole chiave** tramite indicizzazione full-text FTS5 (punteggio BM25).
- **Ricerca vettoriale** tramite embedding da qualsiasi provider supportato.
- **Ricerca ibrida** che combina entrambe per ottenere i migliori risultati.
- **Supporto CJK** tramite tokenizzazione trigram per cinese, giapponese e coreano.
- **Accelerazione sqlite-vec** per query vettoriali nel database (opzionale).

## Per iniziare

Se hai una chiave API per OpenAI, Gemini, Voyage o Mistral, il motore integrato
la rileva automaticamente e abilita la ricerca vettoriale. Nessuna configurazione necessaria.

Per impostare esplicitamente un provider:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
      },
    },
  },
}
```

Senza un provider di embedding, è disponibile solo la ricerca per parole chiave.

Per forzare il provider di embedding locale integrato, fai puntare `local.modelPath` a un
file GGUF:

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        fallback: "none",
        local: {
          modelPath: "~/.node-llama-cpp/models/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

## Provider di embedding supportati

| Provider | ID        | Rilevato automaticamente | Note                                  |
| -------- | --------- | ------------------------ | ------------------------------------- |
| OpenAI   | `openai`  | Sì                       | Predefinito: `text-embedding-3-small` |
| Gemini   | `gemini`  | Sì                       | Supporta multimodale (immagine + audio) |
| Voyage   | `voyage`  | Sì                       |                                       |
| Mistral  | `mistral` | Sì                       |                                       |
| Ollama   | `ollama`  | No                       | Locale, da impostare esplicitamente   |
| Local    | `local`   | Sì (per primo)           | Modello GGUF, download di ~0,6 GB     |

Il rilevamento automatico sceglie il primo provider la cui chiave API può essere risolta, nell’
ordine mostrato. Imposta `memorySearch.provider` per sostituirlo.

## Come funziona l’indicizzazione

OpenClaw indicizza `MEMORY.md` e `memory/*.md` in blocchi (~400 token con
sovrapposizione di 80 token) e li memorizza in un database SQLite per agente.

- **Posizione dell’indice:** `~/.openclaw/memory/<agentId>.sqlite`
- **Monitoraggio dei file:** le modifiche ai file di memoria attivano una reindicizzazione con debounce (1,5 s).
- **Reindicizzazione automatica:** quando cambiano il provider di embedding, il modello o la configurazione di chunking,
  l’intero indice viene ricostruito automaticamente.
- **Reindicizzazione su richiesta:** `openclaw memory index --force`

<Info>
Puoi anche indicizzare file Markdown esterni al workspace con
`memorySearch.extraPaths`. Vedi il
[riferimento della configurazione](/it/reference/memory-config#additional-memory-paths).
</Info>

## Quando usarlo

Il motore integrato è la scelta giusta per la maggior parte degli utenti:

- Funziona subito senza dipendenze aggiuntive.
- Gestisce bene la ricerca per parole chiave e la ricerca vettoriale.
- Supporta tutti i provider di embedding.
- La ricerca ibrida combina il meglio di entrambi gli approcci di retrieval.

Valuta di passare a [QMD](/it/concepts/memory-qmd) se ti servono reranking, espansione
della query o vuoi indicizzare directory esterne al workspace.

Valuta [Honcho](/it/concepts/memory-honcho) se vuoi memoria tra sessioni con
modellazione automatica dell’utente.

## Risoluzione dei problemi

**Ricerca in memoria disabilitata?** Controlla `openclaw memory status`. Se non viene
rilevato alcun provider, impostane uno esplicitamente oppure aggiungi una chiave API.

**Provider locale non rilevato?** Conferma che il percorso locale esista ed esegui:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Sia i comandi CLI standalone sia il Gateway usano lo stesso ID provider `local`.
Se il provider è impostato su `auto`, gli embedding locali vengono considerati per primi solo
quando `memorySearch.local.modelPath` punta a un file locale esistente.

**Risultati obsoleti?** Esegui `openclaw memory index --force` per ricostruire. Il watcher
può non rilevare le modifiche in rari casi limite.

**sqlite-vec non si carica?** OpenClaw usa automaticamente come fallback la similarità coseno in-process.
Controlla i log per l’errore specifico di caricamento.

## Configurazione

Per configurazione del provider di embedding, ottimizzazione della ricerca ibrida (pesi, MMR, decadimento
temporale), indicizzazione batch, memoria multimodale, sqlite-vec, percorsi aggiuntivi e tutte
le altre opzioni di configurazione, vedi il
[Riferimento della configurazione della memoria](/it/reference/memory-config).

## Correlati

- [Panoramica della memoria](/it/concepts/memory)
- [Ricerca in memoria](/it/concepts/memory-search)
- [Active Memory](/it/concepts/active-memory)
