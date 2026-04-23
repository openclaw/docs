---
read_when:
    - Vuoi indicizzare o cercare la memoria semantica
    - Stai eseguendo il debug della disponibilità o dell’indicizzazione della memoria
    - Vuoi promuovere la memoria a breve termine richiamata in `MEMORY.md`
summary: Riferimento CLI per `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: memoria
x-i18n:
    generated_at: "2026-04-23T08:26:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a6207037e1097aa793ccb8fbdb8cbf8708ceb7910e31bc286ebb7a5bccb30a2
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Gestisci l’indicizzazione e la ricerca della memoria semantica.
Fornito dal plugin di memoria attivo (predefinito: `memory-core`; imposta `plugins.slots.memory = "none"` per disabilitarlo).

Correlati:

- Concetto di memoria: [Memory](/it/concepts/memory)
- Wiki della memoria: [Memory Wiki](/it/plugins/memory-wiki)
- CLI wiki: [wiki](/it/cli/wiki)
- Plugin: [Plugins](/it/tools/plugin)

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
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
openclaw memory rem-harness
openclaw memory rem-harness --json
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## Opzioni

`memory status` e `memory index`:

- `--agent <id>`: limita l’ambito a un singolo agente. Senza questa opzione, questi comandi vengono eseguiti per ogni agente configurato; se non è configurato alcun elenco di agenti, usano come fallback l’agente predefinito.
- `--verbose`: emette log dettagliati durante probe e indicizzazione.

`memory status`:

- `--deep`: verifica la disponibilità di vettori + embedding.
- `--index`: esegue una reindicizzazione se lo store è sporco (implica `--deep`).
- `--fix`: ripara lock di richiamo obsoleti e normalizza i metadati di promozione.
- `--json`: stampa output JSON.

Se `memory status` mostra `Dreaming status: blocked`, il Cron gestito di Dreaming è abilitato ma l’Heartbeat che lo pilota non viene eseguito per l’agente predefinito. Vedi [Dreaming never runs](/it/concepts/dreaming#dreaming-never-runs-status-shows-blocked) per le due cause più comuni.

`memory index`:

- `--force`: forza una reindicizzazione completa.

`memory search`:

- Input della query: passa o `[query]` posizionale oppure `--query <text>`.
- Se vengono forniti entrambi, `--query` ha la precedenza.
- Se non viene fornito nessuno dei due, il comando termina con un errore.
- `--agent <id>`: limita l’ambito a un singolo agente (predefinito: l’agente predefinito).
- `--max-results <n>`: limita il numero di risultati restituiti.
- `--min-score <n>`: filtra le corrispondenze con punteggio basso.
- `--json`: stampa risultati JSON.

`memory promote`:

Mostra in anteprima e applica promozioni della memoria a breve termine.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- scrive le promozioni in `MEMORY.md` (predefinito: solo anteprima).
- `--limit <n>` -- limita il numero di candidati mostrati.
- `--include-promoted` -- include voci già promosse in cicli precedenti.

Opzioni complete:

- Classifica i candidati a breve termine da `memory/YYYY-MM-DD.md` usando segnali di promozione pesati (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Usa segnali a breve termine sia dai richiami di memoria sia dai passaggi di ingestione giornaliera, oltre a segnali di rinforzo delle fasi light/REM.
- Quando Dreaming è abilitato, `memory-core` gestisce automaticamente un job Cron che esegue uno sweep completo (`light -> REM -> deep`) in background (non è richiesto `openclaw cron add` manuale).
- `--agent <id>`: limita l’ambito a un singolo agente (predefinito: l’agente predefinito).
- `--limit <n>`: massimo numero di candidati da restituire/applicare.
- `--min-score <n>`: punteggio minimo pesato di promozione.
- `--min-recall-count <n>`: numero minimo di richiami richiesto per un candidato.
- `--min-unique-queries <n>`: numero minimo di query distinte richiesto per un candidato.
- `--apply`: aggiunge i candidati selezionati in `MEMORY.md` e li marca come promossi.
- `--include-promoted`: include candidati già promossi nell’output.
- `--json`: stampa output JSON.

`memory promote-explain`:

Spiega un candidato specifico alla promozione e il dettaglio del suo punteggio.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: chiave del candidato, frammento di percorso o frammento di snippet da cercare.
- `--agent <id>`: limita l’ambito a un singolo agente (predefinito: l’agente predefinito).
- `--include-promoted`: include candidati già promossi.
- `--json`: stampa output JSON.

`memory rem-harness`:

Mostra in anteprima riflessioni REM, verità candidate e output di promozione deep senza scrivere nulla.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: limita l’ambito a un singolo agente (predefinito: l’agente predefinito).
- `--include-promoted`: include candidati deep già promossi.
- `--json`: stampa output JSON.

## Dreaming

Dreaming è il sistema in background di consolidamento della memoria con tre fasi
cooperative: **light** (ordina/prepara materiale a breve termine), **deep** (promuove
fatti durevoli in `MEMORY.md`) e **REM** (riflette e fa emergere temi).

- Abilitalo con `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Attivalo/disattivalo dalla chat con `/dreaming on|off` (o ispezionalo con `/dreaming status`).
- Dreaming viene eseguito con una pianificazione gestita di sweep (`dreaming.frequency`) ed esegue le fasi in ordine: light, REM, deep.
- Solo la fase deep scrive memoria durevole in `MEMORY.md`.
- L’output leggibile delle fasi e le voci di diario vengono scritti in `DREAMS.md` (o nell’esistente `dreams.md`), con report facoltativi per fase in `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- La classifica usa segnali pesati: frequenza di richiamo, rilevanza del recupero, diversità delle query, recenza temporale, consolidamento cross-day e ricchezza concettuale derivata.
- La promozione rilegge la nota giornaliera live prima di scrivere in `MEMORY.md`, quindi snippet a breve termine modificati o eliminati non vengono promossi da snapshot obsoleti del recall-store.
- Le esecuzioni pianificate e quelle manuali di `memory promote` condividono gli stessi valori predefiniti della fase deep, a meno che tu non passi override di soglia tramite CLI.
- Le esecuzioni automatiche si distribuiscono tra i workspace di memoria configurati.

Pianificazione predefinita:

- **Cadenza sweep**: `dreaming.frequency = 0 3 * * *`
- **Soglie deep**: `minScore=0.8`, `minRecallCount=3`, `minUniqueQueries=3`, `recencyHalfLifeDays=14`, `maxAgeDays=30`

Esempio:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

Note:

- `memory index --verbose` stampa dettagli per fase (provider, modello, sorgenti, attività batch).
- `memory status` include eventuali percorsi aggiuntivi configurati tramite `memorySearch.extraPaths`.
- Se i campi della chiave API remota di Active Memory effettivamente attivi sono configurati come SecretRef, il comando risolve quei valori dallo snapshot attivo del Gateway. Se il Gateway non è disponibile, il comando fallisce rapidamente.
- Nota sul disallineamento di versione del Gateway: questo percorso di comando richiede un Gateway che supporti `secrets.resolve`; i Gateway più vecchi restituiscono un errore di metodo sconosciuto.
- Regola la cadenza pianificata degli sweep con `dreaming.frequency`. La policy di promozione deep è altrimenti interna; usa i flag CLI su `memory promote` quando hai bisogno di override manuali una tantum.
- `memory rem-harness --path <file-or-dir> --grounded` mostra in anteprima `What Happened`, `Reflections` e `Possible Lasting Updates` fondati da note giornaliere storiche senza scrivere nulla.
- `memory rem-backfill --path <file-or-dir>` scrive voci di diario fondate e reversibili in `DREAMS.md` per revisione nell’interfaccia.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` alimenta anche candidati durevoli fondati nello store live di promozione a breve termine, così la normale fase deep può classificarli.
- `memory rem-backfill --rollback` rimuove voci di diario fondate scritte in precedenza e `memory rem-backfill --rollback-short-term` rimuove candidati a breve termine fondati precedentemente preparati.
- Vedi [Dreaming](/it/concepts/dreaming) per descrizioni complete delle fasi e il riferimento di configurazione.
