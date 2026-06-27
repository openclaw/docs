---
read_when:
    - Vuoi comprendere il backend di memoria predefinito
    - Vuoi configurare provider di embedding o la ricerca ibrida
summary: Il backend di memoria predefinito basato su SQLite con ricerca per parole chiave, vettoriale e ibrida
title: Motore di memoria integrato
x-i18n:
    generated_at: "2026-06-27T17:25:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a867bd295778f81109b258a63a35a1683d652d4564e44335053af4d86f90584e
    source_path: concepts/memory-builtin.md
    workflow: 16
---

Il motore integrato è il backend di memoria predefinito. Archivia l'indice della memoria in
un database SQLite per agente e non richiede dipendenze aggiuntive per iniziare.

## Cosa offre

- **Ricerca per parola chiave** tramite indicizzazione full-text FTS5 (punteggio BM25).
- **Ricerca vettoriale** tramite embeddings da qualsiasi provider supportato.
- **Ricerca ibrida** che combina entrambe per risultati migliori.
- **Supporto CJK** tramite tokenizzazione trigram per cinese, giapponese e coreano.
- **Accelerazione sqlite-vec** per query vettoriali nel database (opzionale).

## Per iniziare

Per impostazione predefinita, il motore integrato usa gli embeddings OpenAI. Se hai già
`OPENAI_API_KEY` o `models.providers.openai.apiKey` configurati, la ricerca vettoriale
funziona senza configurazione di memoria aggiuntiva.

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

Senza un provider di embedding, è disponibile solo la ricerca per parola chiave.

Per forzare embeddings GGUF locali, installa il plugin provider ufficiale llama.cpp,
poi fai puntare `local.modelPath` a un file GGUF:

```bash
openclaw plugins install @openclaw/llama-cpp-provider
```

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

| Provider          | ID                  | Note                                |
| ----------------- | ------------------- | ----------------------------------- |
| Bedrock           | `bedrock`           | Usa la catena di credenziali AWS    |
| DeepInfra         | `deepinfra`         | Predefinito: `BAAI/bge-m3`          |
| Gemini            | `gemini`            | Supporta multimodale (immagine + audio) |
| GitHub Copilot    | `github-copilot`    | Usa l'abbonamento Copilot           |
| Local             | `local`             | `@openclaw/llama-cpp-provider`      |
| Mistral           | `mistral`           |                                     |
| Ollama            | `ollama`            | Locale/self-hosted                  |
| OpenAI            | `openai`            | Predefinito: `text-embedding-3-small` |
| OpenAI-compatible | `openai-compatible` | Endpoint generico `/v1/embeddings`  |
| Voyage            | `voyage`            |                                     |

Imposta `memorySearch.provider` per passare da OpenAI a un altro provider.

## Come funziona l'indicizzazione

OpenClaw indicizza `MEMORY.md` e `memory/*.md` in chunk (~400 token con
sovrapposizione di 80 token) e li archivia in un database SQLite per agente.

- **Posizione dell'indice:** il database dell'agente proprietario in
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Manutenzione dell'archiviazione:** i sidecar WAL SQLite sono limitati con checkpoint periodici e
  all'arresto.
- **Monitoraggio dei file:** le modifiche ai file di memoria attivano una reindicizzazione con debounce (1,5 s).
- **Reindicizzazione automatica:** quando cambiano il provider di embedding, il modello o la configurazione di chunking,
  l'intero indice viene ricostruito automaticamente.
- **Reindicizzazione su richiesta:** `openclaw memory index --force`

<Info>
Puoi anche indicizzare file Markdown fuori dallo spazio di lavoro con
`memorySearch.extraPaths`. Consulta il
[riferimento di configurazione](/it/reference/memory-config#additional-memory-paths).
</Info>

## Quando usarlo

Il motore integrato è la scelta giusta per la maggior parte degli utenti:

- Funziona subito senza dipendenze aggiuntive.
- Gestisce bene la ricerca per parola chiave e vettoriale.
- Supporta tutti i provider di embedding.
- La ricerca ibrida combina il meglio di entrambi gli approcci di recupero.

Valuta il passaggio a [QMD](/it/concepts/memory-qmd) se ti servono reranking, espansione delle query
o vuoi indicizzare directory fuori dallo spazio di lavoro.

Valuta [Honcho](/it/concepts/memory-honcho) se vuoi memoria tra sessioni con
modellazione automatica dell'utente.

## Risoluzione dei problemi

**Ricerca in memoria disabilitata?** Controlla `openclaw memory status`. Se non viene
rilevato alcun provider, impostane uno esplicitamente o aggiungi una chiave API.

**Provider locale non rilevato?** Verifica che il percorso locale esista ed esegui:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Sia i comandi CLI autonomi sia il Gateway usano lo stesso id provider `local`.
Imposta `memorySearch.provider: "local"` quando vuoi embeddings locali.

**Risultati obsoleti?** Esegui `openclaw memory index --force` per ricostruire. Il watcher
può non rilevare modifiche in rari casi limite.

**sqlite-vec non viene caricato?** OpenClaw ripiega automaticamente sulla similarità coseno
in-process. `openclaw memory status --deep` segnala l'archivio vettoriale locale
separatamente dal provider di embedding, quindi `Vector store: unavailable` indica
il caricamento di sqlite-vec mentre `Embeddings: unavailable` indica provider/autenticazione
o prontezza del modello. Controlla i log per l'errore di caricamento specifico.

## Configurazione

Per la configurazione del provider di embedding, l'ottimizzazione della ricerca ibrida (pesi, MMR, decadimento temporale),
l'indicizzazione batch, la memoria multimodale, sqlite-vec, percorsi aggiuntivi e tutte
le altre opzioni di configurazione, consulta il
[riferimento di configurazione della memoria](/it/reference/memory-config).

## Correlati

- [Panoramica della memoria](/it/concepts/memory)
- [Ricerca in memoria](/it/concepts/memory-search)
- [Active Memory](/it/concepts/active-memory)
