---
read_when:
    - Vuoi indicizzare o cercare nella memoria semantica
    - Stai eseguendo il debug della disponibilità o dell'indicizzazione della memoria
    - Vuoi promuovere la memoria a breve termine richiamata in `MEMORY.md`
summary: Riferimento CLI per `openclaw memory` (status/index/search/promote)
title: memory
x-i18n:
    generated_at: "2026-04-05T13:48:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: a89e3a819737bb63521128ae63d9e25b5cd9db35c3ea4606d087a8ad48b41eab
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Gestisci l'indicizzazione e la ricerca della memoria semantica.
Fornito dal plugin di memoria attivo (predefinito: `memory-core`; imposta `plugins.slots.memory = "none"` per disabilitarlo).

Correlati:

- Concetto di memoria: [Memory](/concepts/memory)
- Plugins: [Plugins](/tools/plugin)

## Esempi

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## Opzioni

`memory status` e `memory index`:

- `--agent <id>`: limita a un singolo agente. Senza questo flag, questi comandi vengono eseguiti per ogni agente configurato; se non è configurato alcun elenco di agenti, viene usato l'agente predefinito.
- `--verbose`: emette log dettagliati durante probe e indicizzazione.

`memory status`:

- `--deep`: verifica la disponibilità di vettori ed embedding.
- `--index`: esegue una reindicizzazione se lo store è dirty (implica `--deep`).
- `--fix`: ripara lock di richiamo obsoleti e normalizza i metadati di promozione.
- `--json`: stampa output JSON.

`memory index`:

- `--force`: forza una reindicizzazione completa.

`memory search`:

- Input della query: passa `[query]` posizionale oppure `--query <text>`.
- Se entrambi sono forniti, vince `--query`.
- Se non viene fornito nessuno dei due, il comando termina con un errore.
- `--agent <id>`: limita a un singolo agente (predefinito: l'agente predefinito).
- `--max-results <n>`: limita il numero di risultati restituiti.
- `--min-score <n>`: filtra le corrispondenze con punteggio basso.
- `--json`: stampa i risultati in JSON.

`memory promote`:

Anteprima e applicazione delle promozioni della memoria a breve termine.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- scrive le promozioni in `MEMORY.md` (predefinito: solo anteprima).
- `--limit <n>` -- limita il numero di candidati mostrati.
- `--include-promoted` -- include le voci già promosse nei cicli precedenti.

Opzioni complete:

- Classifica i candidati a breve termine da `memory/YYYY-MM-DD.md` usando segnali di richiamo pesati (`frequency`, `relevance`, `query diversity`, `recency`).
- Usa gli eventi di richiamo acquisiti quando `memory_search` restituisce hit della memoria giornaliera.
- Modalità auto-dreaming facoltativa: quando `plugins.entries.memory-core.config.dreaming.mode` è `core`, `deep` o `rem`, `memory-core` gestisce automaticamente un cron job che attiva la promozione in background (non è richiesto alcun `openclaw cron add` manuale).
- `--agent <id>`: limita a un singolo agente (predefinito: l'agente predefinito).
- `--limit <n>`: numero massimo di candidati da restituire/applicare.
- `--min-score <n>`: punteggio minimo pesato per la promozione.
- `--min-recall-count <n>`: numero minimo di richiami richiesto per un candidato.
- `--min-unique-queries <n>`: numero minimo di query distinte richiesto per un candidato.
- `--apply`: aggiunge i candidati selezionati a `MEMORY.md` e li contrassegna come promossi.
- `--include-promoted`: include nell'output i candidati già promossi.
- `--json`: stampa output JSON.

## Dreaming (sperimentale)

Il dreaming è il passaggio di riflessione notturna per la memoria. Si chiama "dreaming" perché il sistema rivede ciò che è stato richiamato durante il giorno e decide cosa valga la pena conservare a lungo termine.

- È opt-in ed è disabilitato per impostazione predefinita.
- Abilitalo con `plugins.entries.memory-core.config.dreaming.mode`.
- Puoi cambiare modalità dalla chat con `/dreaming off|core|rem|deep`. Esegui `/dreaming` (oppure `/dreaming options`) per vedere cosa fa ogni modalità.
- Quando è abilitato, `memory-core` crea e mantiene automaticamente un cron job gestito.
- Imposta `dreaming.limit` su `0` se vuoi il dreaming abilitato ma la promozione automatica effettivamente in pausa.
- La classificazione usa segnali pesati: frequenza di richiamo, rilevanza del recupero, diversità delle query e recenza temporale (i richiami recenti decadono nel tempo).
- La promozione in `MEMORY.md` avviene solo quando vengono soddisfatte le soglie di qualità, così la memoria a lungo termine mantiene un segnale elevato invece di accumulare dettagli occasionali.

Preset predefiniti delle modalità:

- `core`: ogni giorno alle `0 3 * * *`, `minScore=0.75`, `minRecallCount=3`, `minUniqueQueries=2`
- `deep`: ogni 12 ore (`0 */12 * * *`), `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`
- `rem`: ogni 6 ore (`0 */6 * * *`), `minScore=0.85`, `minRecallCount=4`, `minUniqueQueries=3`

Esempio:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "mode": "core"
          }
        }
      }
    }
  }
}
```

Note:

- `memory index --verbose` stampa dettagli per fase (provider, modello, sorgenti, attività dei batch).
- `memory status` include eventuali percorsi aggiuntivi configurati tramite `memorySearch.extraPaths`.
- Se i campi della chiave API remota della memoria attiva sono configurati effettivamente come SecretRef, il comando risolve quei valori dallo snapshot attivo del gateway. Se il gateway non è disponibile, il comando fallisce rapidamente.
- Nota sul disallineamento di versione del gateway: questo percorso di comando richiede un gateway che supporti `secrets.resolve`; i gateway più vecchi restituiscono un errore di metodo sconosciuto.
- La frequenza del dreaming usa per impostazione predefinita il programma preset di ogni modalità. Sovrascrivi la frequenza con `plugins.entries.memory-core.config.dreaming.frequency` come espressione cron (ad esempio `0 3 * * *`) e perfeziona con `timezone`, `limit`, `minScore`, `minRecallCount` e `minUniqueQueries`.
