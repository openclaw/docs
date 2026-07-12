---
read_when:
    - Vuoi comprendere il backend di memoria predefinito
    - Vuoi configurare i provider di embedding o la ricerca ibrida
summary: Il backend di memoria predefinito basato su SQLite con ricerca per parole chiave, vettoriale e ibrida
title: Motore di memoria integrato
x-i18n:
    generated_at: "2026-07-12T06:59:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e8cbe2bae73b1d393ac158edb67fc442e76d1e5ff93e5201dbb7e7216801aa85
    source_path: concepts/memory-builtin.md
    workflow: 16
---

Il motore integrato è il backend di memoria predefinito. Archivia l'indice della memoria
in un database SQLite per agente e non richiede dipendenze aggiuntive per
iniziare.

## Funzionalità offerte

- **Ricerca per parole chiave** tramite indicizzazione full-text FTS5 (punteggio BM25).
- **Ricerca vettoriale** tramite incorporamenti forniti da qualsiasi provider supportato.
- **Ricerca ibrida** che combina entrambe per ottenere i risultati migliori.
- **Supporto CJK** tramite tokenizzazione a trigrammi per cinese, giapponese e coreano.
- **Accelerazione sqlite-vec** per le query vettoriali nel database (facoltativa).

## Per iniziare

Per impostazione predefinita, il motore integrato utilizza gli incorporamenti di OpenAI. Se `OPENAI_API_KEY` o
`models.providers.openai.apiKey` è già configurato, la ricerca vettoriale funziona
senza configurazioni aggiuntive della memoria.

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

Senza un provider di incorporamenti è disponibile solo la ricerca per parole chiave.

Per imporre l'uso di incorporamenti GGUF locali, installa il Plugin provider ufficiale
llama.cpp, quindi imposta `local.modelPath` su un file GGUF:

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

## Provider di incorporamenti supportati

| Provider          | ID                  | Note                                      |
| ----------------- | ------------------- | ----------------------------------------- |
| Bedrock           | `bedrock`           | Utilizza la catena di credenziali AWS     |
| DeepInfra         | `deepinfra`         | Valore predefinito: `BAAI/bge-m3`         |
| Gemini            | `gemini`            | Supporta contenuti multimodali (immagini + audio) |
| GitHub Copilot    | `github-copilot`    | Utilizza il tuo abbonamento Copilot       |
| LM Studio         | `lmstudio`          | Locale/self-hosted                        |
| Locale            | `local`             | `@openclaw/llama-cpp-provider`            |
| Mistral           | `mistral`           |                                           |
| Ollama            | `ollama`            | Locale/self-hosted                        |
| OpenAI            | `openai`            | Valore predefinito: `text-embedding-3-small` |
| Compatibile con OpenAI | `openai-compatible` | Endpoint generico `/v1/embeddings`    |
| Voyage            | `voyage`            |                                           |

Imposta `memorySearch.provider` per non utilizzare OpenAI.

## Funzionamento dell'indicizzazione

OpenClaw indicizza `MEMORY.md` e `memory/*.md` in segmenti (400 token con
una sovrapposizione di 80 token per impostazione predefinita) e li archivia in un database SQLite per agente.

- **Posizione dell'indice:** il database dell'agente proprietario in
  `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Manutenzione dell'archiviazione:** i file collaterali WAL di SQLite sono mantenuti entro limiti definiti mediante checkpoint periodici e
  all'arresto.
- **Monitoraggio dei file:** le modifiche ai file di memoria attivano una reindicizzazione con debounce
  (valore predefinito: 1,5 s).
- **Reindicizzazione automatica:** l'indice viene ricostruito automaticamente quando cambiano il provider
  di incorporamenti, il modello, la configurazione della segmentazione, le sorgenti configurate o l'ambito.
- **Reindicizzazione su richiesta:** `openclaw memory index --force`

<Info>
Puoi indicizzare anche file Markdown esterni allo spazio di lavoro con
`memorySearch.extraPaths`. Consulta il
[riferimento della configurazione](/it/reference/memory-config#additional-memory-paths).
</Info>

## Quando utilizzarlo

Il motore integrato è la scelta giusta per la maggior parte degli utenti:

- Funziona immediatamente senza dipendenze aggiuntive.
- Gestisce bene la ricerca per parole chiave e quella vettoriale.
- Supporta tutti i provider di incorporamenti.
- La ricerca ibrida combina gli aspetti migliori di entrambi gli approcci di recupero.

Valuta il passaggio a [QMD](/it/concepts/memory-qmd) se ti servono il riordinamento dei risultati, l'espansione delle query
o se vuoi indicizzare directory esterne allo spazio di lavoro.

Valuta [Honcho](/it/concepts/memory-honcho) se desideri una memoria tra sessioni
con modellazione automatica dell'utente.

## Risoluzione dei problemi

**Ricerca nella memoria disabilitata?** Controlla `openclaw memory status`. Se non viene
rilevato alcun provider, impostane uno esplicitamente o aggiungi una chiave API.

**Provider locale non rilevato?** Verifica che il percorso locale esista ed esegui:

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

Sia i comandi CLI autonomi sia il Gateway utilizzano lo stesso ID provider `local`.
Imposta `memorySearch.provider: "local"` quando vuoi utilizzare incorporamenti locali.

**Risultati obsoleti?** Esegui `openclaw memory index --force` per ricostruire l'indice. Il sistema di monitoraggio
potrebbe non rilevare modifiche in rari casi limite.

**sqlite-vec non viene caricato?** OpenClaw ricorre automaticamente alla similarità del coseno
calcolata nel processo. `openclaw memory status --deep` segnala l'archivio vettoriale
locale separatamente dal provider di incorporamenti, quindi `Vector store:
unavailable` indica un problema di caricamento di sqlite-vec, mentre `Embeddings: unavailable`
indica un problema del provider o dell'autenticazione oppure che il modello non è pronto. Controlla i log per l'errore
di caricamento specifico.

## Configurazione

Per la configurazione del provider di incorporamenti, la regolazione della ricerca ibrida (pesi, MMR, decadimento
temporale), l'indicizzazione in batch, la memoria multimodale, sqlite-vec, i percorsi aggiuntivi e tutte
le altre opzioni di configurazione, consulta il
[riferimento della configurazione della memoria](/it/reference/memory-config).

## Contenuti correlati

- [Panoramica della memoria](/it/concepts/memory)
- [Ricerca nella memoria](/it/concepts/memory-search)
- [Active Memory](/it/concepts/active-memory)
