---
read_when:
    - Vuoi comprendere il backend di memoria predefinito
    - Vuoi configurare provider di embedding o la ricerca ibrida
summary: Il backend di memoria predefinito basato su SQLite con ricerca per parole chiave, vettoriale e ibrida
title: Builtin Memory Engine
x-i18n:
    generated_at: "2026-04-05T13:49:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 181c40a43332315bf915ff6f395d9d5fd766c889e1a8d1aa525f9ba0198d3367
    source_path: concepts/memory-builtin.md
    workflow: 15
---

# Builtin Memory Engine

Il motore integrato è il backend di memoria predefinito. Memorizza il tuo indice di memoria in
un database SQLite per agente e non richiede dipendenze aggiuntive per iniziare.

## Cosa offre

- **Ricerca per parole chiave** tramite indicizzazione full-text FTS5 (punteggio BM25).
- **Ricerca vettoriale** tramite embedding da qualsiasi provider supportato.
- **Ricerca ibrida** che combina entrambe per ottenere i migliori risultati.
- **Supporto CJK** tramite tokenizzazione trigram per cinese, giapponese e coreano.
- **Accelerazione `sqlite-vec`** per query vettoriali nel database (facoltativa).

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

## Provider di embedding supportati

| Provider | ID        | Rilevato automaticamente | Note                                |
| -------- | --------- | ------------------------ | ----------------------------------- |
| OpenAI   | `openai`  | Sì                       | Predefinito: `text-embedding-3-small` |
| Gemini   | `gemini`  | Sì                       | Supporta multimodale (immagine + audio) |
| Voyage   | `voyage`  | Sì                       |                                     |
| Mistral  | `mistral` | Sì                       |                                     |
| Ollama   | `ollama`  | No                       | Locale, da impostare esplicitamente |
| Local    | `local`   | Sì (per primo)           | Modello GGUF, download di ~0.6 GB   |

Il rilevamento automatico seleziona il primo provider la cui chiave API può essere risolta, nell'ordine
mostrato. Imposta `memorySearch.provider` per sovrascriverlo.

## Come funziona l'indicizzazione

OpenClaw indicizza `MEMORY.md` e `memory/*.md` in blocchi (~400 token con
sovrapposizione di 80 token) e li memorizza in un database SQLite per agente.

- **Posizione dell'indice:** `~/.openclaw/memory/<agentId>.sqlite`
- **Monitoraggio file:** le modifiche ai file di memoria attivano una reindicizzazione con debounce (1.5s).
- **Reindicizzazione automatica:** quando il provider di embedding, il modello o la configurazione di chunking
  cambiano, l'intero indice viene ricostruito automaticamente.
- **Reindicizzazione su richiesta:** `openclaw memory index --force`

<Info>
Puoi anche indicizzare file Markdown esterni al workspace con
`memorySearch.extraPaths`. Vedi il
[riferimento configurazione](/reference/memory-config#additional-memory-paths).
</Info>

## Quando usarlo

Il motore integrato è la scelta giusta per la maggior parte degli utenti:

- Funziona subito senza dipendenze aggiuntive.
- Gestisce bene la ricerca per parole chiave e quella vettoriale.
- Supporta tutti i provider di embedding.
- La ricerca ibrida combina il meglio di entrambi gli approcci di recupero.

Valuta di passare a [QMD](/concepts/memory-qmd) se hai bisogno di reranking, espansione
della query o vuoi indicizzare directory esterne al workspace.

Valuta [Honcho](/concepts/memory-honcho) se vuoi memoria cross-sessione con
modellazione automatica dell'utente.

## Risoluzione dei problemi

**Ricerca in memoria disabilitata?** Controlla `openclaw memory status`. Se non viene
rilevato alcun provider, impostane uno esplicitamente o aggiungi una chiave API.

**Risultati obsoleti?** Esegui `openclaw memory index --force` per ricostruire. Il watcher
può perdere modifiche in rari casi limite.

**`sqlite-vec` non si carica?** OpenClaw usa automaticamente come fallback la similarità coseno
in-process. Controlla i log per lo specifico errore di caricamento.

## Configurazione

Per la configurazione del provider di embedding, la regolazione della ricerca ibrida (pesi, MMR, decadimento
temporale), indicizzazione batch, memoria multimodale, `sqlite-vec`, percorsi aggiuntivi e tutte
le altre opzioni di configurazione, vedi il
[Riferimento configurazione memoria](/reference/memory-config).
