---
read_when:
    - Vuoi comprendere il backend di memoria predefinito
    - Vuoi configurare i provider di embedding o la ricerca ibrida
summary: Il backend di memoria predefinito basato su SQLite con ricerca per parole chiave, vettoriale e ibrida
title: Motore di memoria integrato
x-i18n:
    generated_at: "2026-04-30T08:46:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: aa1597a9a49a6f1124cedf49f6f5a4c336f76dd5998ced246affb9c2e8171f05
    source_path: concepts/memory-builtin.md
    workflow: 16
---

Il motore integrato è il backend di memoria predefinito. Archivia l'indice della memoria in
un database SQLite per agente e non richiede dipendenze aggiuntive per iniziare.

## Cosa offre

- **Ricerca per parole chiave** tramite indicizzazione full-text FTS5 (punteggio BM25).
- **Ricerca vettoriale** tramite embedding da qualsiasi fornitore supportato.
- **Ricerca ibrida** che combina entrambe per ottenere i migliori risultati.
- **Supporto CJK** tramite tokenizzazione a trigrammi per cinese, giapponese e coreano.
- **Accelerazione sqlite-vec** per query vettoriali nel database (opzionale).

## Per iniziare

Se hai una chiave API per OpenAI, Gemini, Voyage, Mistral o DeepInfra, il motore
integrato la rileva automaticamente e abilita la ricerca vettoriale. Non è necessaria alcuna configurazione.

Per impostare esplicitamente un fornitore:

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

Senza un fornitore di embedding, è disponibile solo la ricerca per parole chiave.

Per forzare il fornitore di embedding locale integrato, installa il pacchetto runtime
opzionale `node-llama-cpp` accanto a OpenClaw, quindi punta `local.modelPath`
a un file GGUF:

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

## Fornitori di embedding supportati

| Fornitore | ID          | Rilevato automaticamente | Note                                  |
| --------- | ----------- | ------------------------ | ------------------------------------- |
| OpenAI    | `openai`    | Sì                       | Predefinito: `text-embedding-3-small` |
| Gemini    | `gemini`    | Sì                       | Supporta multimodale (immagine + audio) |
| Voyage    | `voyage`    | Sì                       |                                       |
| Mistral   | `mistral`   | Sì                       |                                       |
| DeepInfra | `deepinfra` | Sì                       | Predefinito: `BAAI/bge-m3`            |
| Ollama    | `ollama`    | No                       | Locale, impostare esplicitamente      |
| Locale    | `local`     | Sì (primo)               | Runtime opzionale `node-llama-cpp`    |

Il rilevamento automatico sceglie il primo fornitore la cui chiave API può essere risolta, nell'
ordine mostrato. Imposta `memorySearch.provider` per sovrascriverlo.

## Come funziona l'indicizzazione

OpenClaw indicizza `MEMORY.md` e `memory/*.md` in blocchi (~400 token con
sovrapposizione di 80 token) e li archivia in un database SQLite per agente.

- **Posizione dell'indice:** `~/.openclaw/memory/<agentId>.sqlite`
- **Manutenzione dell'archiviazione:** i sidecar WAL di SQLite sono limitati con checkpoint periodici e
  all'arresto.
- **Monitoraggio dei file:** le modifiche ai file di memoria attivano una reindicizzazione con debounce (1,5 s).
- **Reindicizzazione automatica:** quando il fornitore di embedding, il modello o la configurazione di suddivisione in blocchi
  cambia, l'intero indice viene ricostruito automaticamente.
- **Reindicizzazione su richiesta:** `openclaw memory index --force`

<Info>
Puoi anche indicizzare file Markdown esterni all'area di lavoro con
`memorySearch.extraPaths`. Consulta il
[riferimento di configurazione](/it/reference/memory-config#additional-memory-paths).
</Info>

## Quando usarlo

Il motore integrato è la scelta giusta per la maggior parte degli utenti:

- Funziona subito senza dipendenze aggiuntive.
- Gestisce bene la ricerca per parole chiave e vettoriale.
- Supporta tutti i fornitori di embedding.
- La ricerca ibrida combina il meglio di entrambi gli approcci di recupero.

Valuta il passaggio a [QMD](/it/concepts/memory-qmd) se hai bisogno di reranking, espansione delle query
o vuoi indicizzare directory esterne all'area di lavoro.

Valuta [Honcho](/it/concepts/memory-honcho) se vuoi memoria tra sessioni con
modellazione automatica dell'utente.

## Risoluzione dei problemi

**Ricerca nella memoria disabilitata?** Controlla `openclaw memory status`. Se non viene
rilevato alcun fornitore, impostane uno esplicitamente o aggiungi una chiave API.

**Fornitore locale non rilevato?** Verifica che il percorso locale esista ed esegui:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Sia i comandi CLI autonomi sia il Gateway usano lo stesso ID fornitore `local`.
Se il fornitore è impostato su `auto`, gli embedding locali vengono considerati per primi solo
quando `memorySearch.local.modelPath` punta a un file locale esistente.

**Risultati obsoleti?** Esegui `openclaw memory index --force` per ricostruire. Il watcher
può non rilevare modifiche in rari casi limite.

**sqlite-vec non si carica?** OpenClaw ripiega automaticamente sulla similarità coseno
in-process. Controlla i log per l'errore di caricamento specifico.

## Configurazione

Per la configurazione del fornitore di embedding, la regolazione della ricerca ibrida (pesi, MMR, decadimento
temporale), l'indicizzazione in batch, la memoria multimodale, sqlite-vec, i percorsi extra e tutte
le altre opzioni di configurazione, consulta il
[riferimento di configurazione della memoria](/it/reference/memory-config).

## Correlati

- [Panoramica della memoria](/it/concepts/memory)
- [Ricerca nella memoria](/it/concepts/memory-search)
- [Active Memory](/it/concepts/active-memory)
