---
read_when:
    - Vuoi indicizzare o cercare nella memoria semantica
    - Stai eseguendo il debug della disponibilità di memoria o dell'indicizzazione
    - Vuoi promuovere la memoria a breve termine richiamata in `MEMORY.md`
summary: Riferimento CLI per `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Memoria
x-i18n:
    generated_at: "2026-05-03T21:29:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: a33b848272c8853dd1a83e942124f0df30e096312e58a395c0ea08058e41f8fe
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Gestisci l'indicizzazione e la ricerca della memoria semantica.
Fornito dal Plugin active memory (predefinito: `memory-core`; imposta `plugins.slots.memory = "none"` per disabilitarlo).

Correlati:

- Concetto di memoria: [Memoria](/it/concepts/memory)
- Wiki della memoria: [Wiki della memoria](/it/plugins/memory-wiki)
- CLI della wiki: [wiki](/it/cli/wiki)
- Plugin: [Plugin](/it/tools/plugin)

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

- `--agent <id>`: limita l'ambito a un singolo agente. Senza questa opzione, questi comandi vengono eseguiti per ogni agente configurato; se non è configurato alcun elenco di agenti, ricorrono all'agente predefinito.
- `--verbose`: emette log dettagliati durante i controlli e l'indicizzazione.

`memory status`:

- `--deep`: controlla la disponibilità del vector store locale, del provider di embedding e della ricerca vettoriale semantica. Il semplice `memory status` resta rapido e non esegue embedding live né attività di individuazione dei provider; uno stato vector store o vettore semantico sconosciuto significa che non è stato verificato in quel comando. Il `searchMode: "search"` lessicale QMD salta i controlli vettoriali semantici e la manutenzione degli embedding anche con `--deep`.
- `--index`: esegue una reindicizzazione se lo store è sporco (implica `--deep`).
- `--fix`: ripara i lock di richiamo obsoleti e normalizza i metadati di promozione.
- `--json`: stampa l'output JSON.

Se `memory status` mostra `Dreaming status: blocked`, il cron gestito di Dreaming è abilitato ma l'Heartbeat che lo guida non viene attivato per l'agente predefinito. Vedi [Dreaming non viene mai eseguito](/it/concepts/dreaming#dreaming-never-runs-status-shows-blocked) per le due cause comuni.

`memory index`:

- `--force`: forza una reindicizzazione completa.

`memory search`:

- Input della query: passa `[query]` posizionale oppure `--query <text>`.
- Se sono forniti entrambi, `--query` ha la precedenza.
- Se non ne viene fornito nessuno, il comando termina con un errore.
- `--agent <id>`: limita l'ambito a un singolo agente (predefinito: l'agente predefinito).
- `--max-results <n>`: limita il numero di risultati restituiti.
- `--min-score <n>`: filtra le corrispondenze con punteggio basso.
- `--json`: stampa i risultati JSON.

`memory promote`:

Visualizza in anteprima e applica promozioni dalla memoria a breve termine.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- scrive le promozioni in `MEMORY.md` (predefinito: solo anteprima).
- `--limit <n>` -- limita il numero di candidati mostrati.
- `--include-promoted` -- include le voci già promosse nei cicli precedenti.

Opzioni complete:

- Classifica i candidati a breve termine da `memory/YYYY-MM-DD.md` usando segnali di promozione ponderati (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Usa segnali a breve termine sia dai richiami di memoria sia dai passaggi di ingestione giornaliera, più segnali di rafforzamento delle fasi light/REM.
- Quando Dreaming è abilitato, `memory-core` gestisce automaticamente un job cron che esegue una scansione completa (`light -> REM -> deep`) in background (non è necessario `openclaw cron add` manuale).
- `--agent <id>`: limita l'ambito a un singolo agente (predefinito: l'agente predefinito).
- `--limit <n>`: numero massimo di candidati da restituire/applicare.
- `--min-score <n>`: punteggio minimo ponderato di promozione.
- `--min-recall-count <n>`: numero minimo di richiami richiesto per un candidato.
- `--min-unique-queries <n>`: numero minimo di query distinte richiesto per un candidato.
- `--apply`: aggiunge i candidati selezionati a `MEMORY.md` e li contrassegna come promossi.
- `--include-promoted`: include nell'output i candidati già promossi.
- `--json`: stampa l'output JSON.

`memory promote-explain`:

Spiega un candidato alla promozione specifico e la scomposizione del suo punteggio.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: chiave del candidato, frammento di percorso o frammento di snippet da cercare.
- `--agent <id>`: limita l'ambito a un singolo agente (predefinito: l'agente predefinito).
- `--include-promoted`: include i candidati già promossi.
- `--json`: stampa l'output JSON.

`memory rem-harness`:

Visualizza in anteprima riflessioni REM, verità candidate e output di promozione profonda senza scrivere nulla.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: limita l'ambito a un singolo agente (predefinito: l'agente predefinito).
- `--include-promoted`: include i candidati profondi già promossi.
- `--json`: stampa l'output JSON.

## Dreaming

Dreaming è il sistema in background di consolidamento della memoria con tre fasi
cooperative: **light** (ordina/prepara il materiale a breve termine), **deep** (promuove fatti durevoli
in `MEMORY.md`) e **REM** (riflette e fa emergere temi).

- Abilita con `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Attiva o disattiva dalla chat con `/dreaming on|off` (o ispeziona con `/dreaming status`).
- Dreaming viene eseguito secondo una pianificazione di scansione gestita (`dreaming.frequency`) ed esegue le fasi in ordine: light, REM, deep.
- Solo la fase deep scrive memoria durevole in `MEMORY.md`.
- L'output delle fasi leggibile da persone e le voci di diario vengono scritti in `DREAMS.md` (o nell'esistente `dreams.md`), con report opzionali per fase in `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- La classificazione usa segnali ponderati: frequenza di richiamo, pertinenza del recupero, diversità delle query, recenza temporale, consolidamento tra giorni e ricchezza concettuale derivata.
- La promozione rilegge la nota giornaliera live prima di scrivere in `MEMORY.md`, quindi gli snippet a breve termine modificati o eliminati non vengono promossi da snapshot obsoleti dello store di richiamo.
- Le esecuzioni pianificate e manuali di `memory promote` condividono gli stessi valori predefiniti della fase deep, a meno che tu non passi override delle soglie da CLI.
- Le esecuzioni automatiche si diramano tra gli spazi di lavoro di memoria configurati.

Pianificazione predefinita:

- **Cadenza della scansione**: `dreaming.frequency = 0 3 * * *`
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

- `memory index --verbose` stampa dettagli per fase (provider, modello, fonti, attività batch).
- `memory status` include eventuali percorsi aggiuntivi configurati tramite `memorySearch.extraPaths`.
- Se i campi della chiave API remota della memoria effettivamente attiva sono configurati come SecretRefs, il comando risolve quei valori dallo snapshot del Gateway attivo. Se il Gateway non è disponibile, il comando fallisce rapidamente.
- Nota sul disallineamento di versione del Gateway: questo percorso di comando richiede un Gateway che supporti `secrets.resolve`; i Gateway più vecchi restituiscono un errore di metodo sconosciuto.
- Regola la cadenza della scansione pianificata con `dreaming.frequency`. La policy di promozione deep è altrimenti interna; usa i flag CLI su `memory promote` quando ti servono override manuali una tantum.
- `memory rem-harness --path <file-or-dir> --grounded` visualizza in anteprima `What Happened`, `Reflections` e `Possible Lasting Updates` fondati da note giornaliere storiche senza scrivere nulla.
- `memory rem-backfill --path <file-or-dir>` scrive voci di diario fondate e reversibili in `DREAMS.md` per la revisione nell'interfaccia utente.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` inizializza anche candidati durevoli fondati nello store live delle promozioni a breve termine, così la normale fase deep può classificarli.
- `memory rem-backfill --rollback` rimuove le voci di diario fondate scritte in precedenza, e `memory rem-backfill --rollback-short-term` rimuove i candidati a breve termine fondati messi in stage in precedenza.
- Vedi [Dreaming](/it/concepts/dreaming) per descrizioni complete delle fasi e riferimento di configurazione.

## Correlati

- [Riferimento CLI](/it/cli)
- [Panoramica della memoria](/it/concepts/memory)
