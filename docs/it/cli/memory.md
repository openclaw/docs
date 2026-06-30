---
read_when:
    - Vuoi indicizzare o cercare nella memoria semantica
    - Stai eseguendo il debug della disponibilità di memoria o dell'indicizzazione
    - Vuoi promuovere la memoria a breve termine richiamata in `MEMORY.md`
summary: Riferimento CLI per `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Memoria
x-i18n:
    generated_at: "2026-06-30T14:05:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 74b85d7299cc12e6133a10678f7c8fe17ee704e029993aebea417727ba94e629
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Gestisci l'indicizzazione e la ricerca della memoria semantica.
Fornito dal Plugin incluso `memory-core`. Il comando è disponibile quando
`plugins.slots.memory` seleziona `memory-core` (impostazione predefinita); altri Plugin di memoria
espongono i propri namespace CLI.

Correlati:

- Concetto di memoria: [Memoria](/it/concepts/memory)
- Wiki della memoria: [Wiki della memoria](/it/plugins/memory-wiki)
- CLI wiki: [wiki](/it/cli/wiki)
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

- `--agent <id>`: limita l'ambito a un singolo agente. Senza questa opzione, questi comandi vengono eseguiti per ogni agente configurato; se non è configurato alcun elenco di agenti, ripiegano sull'agente predefinito.
- `--verbose`: emette log dettagliati durante i controlli e l'indicizzazione.

`memory status`:

- `--deep`: verifica la prontezza del vector store locale, la prontezza del provider di embedding e la prontezza della ricerca vettoriale semantica. Il semplice `memory status` resta veloce e non esegue lavori live di embedding o di individuazione dei provider; uno stato sconosciuto del vector store o del vettore semantico significa che non è stato verificato in quel comando. La ricerca lessicale QMD `searchMode: "search"` salta i controlli vettoriali semantici e la manutenzione degli embedding anche con `--deep`.
- `--index`: esegue una reindicizzazione se lo store è dirty (implica `--deep`).
- `--fix`: ripara lock di richiamo obsoleti e normalizza i metadati di promozione.
- `--json`: stampa output JSON.

Se `memory status` mostra `Dreaming status: blocked`, il Cron di dreaming gestito è abilitato ma l'Heartbeat che lo guida non viene eseguito per l'agente predefinito. Vedi [Dreaming non viene mai eseguito](/it/concepts/dreaming#dreaming-never-runs-status-shows-blocked) per le due cause comuni.

`memory index`:

- `--force`: forza una reindicizzazione completa.

`memory search`:

- Input della query: passa `[query]` posizionale oppure `--query <text>`.
- Se sono forniti entrambi, `--query` ha la precedenza.
- Se nessuno dei due è fornito, il comando termina con un errore.
- `--agent <id>`: limita l'ambito a un singolo agente (predefinito: l'agente predefinito).
- `--max-results <n>`: limita il numero di risultati restituiti.
- `--min-score <n>`: filtra le corrispondenze con punteggio basso.
- `--json`: stampa risultati JSON.

`memory promote`:

Visualizza in anteprima e applica promozioni della memoria a breve termine.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- scrive le promozioni in `MEMORY.md` (predefinito: solo anteprima).
- `--limit <n>` -- limita il numero di candidati mostrati.
- `--include-promoted` -- include voci già promosse nei cicli precedenti.

Opzioni complete:

- Classifica i candidati a breve termine da `memory/YYYY-MM-DD.md` usando segnali di promozione ponderati (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Usa segnali a breve termine sia dai richiami di memoria sia dai passaggi di ingestione giornaliera, oltre ai segnali di rinforzo delle fasi light/REM.
- Quando Dreaming è abilitato, `memory-core` gestisce automaticamente un job Cron che esegue una scansione completa (`light -> REM -> deep`) in background (non è richiesto alcun `openclaw cron add` manuale).
- `--agent <id>`: limita l'ambito a un singolo agente (predefinito: l'agente predefinito).
- `--limit <n>`: numero massimo di candidati da restituire/applicare.
- `--min-score <n>`: punteggio minimo ponderato di promozione.
- `--min-recall-count <n>`: conteggio minimo di richiami richiesto per un candidato.
- `--min-unique-queries <n>`: conteggio minimo di query distinte richiesto per un candidato.
- `--apply`: aggiunge i candidati selezionati a `MEMORY.md` e li contrassegna come promossi.
- `--include-promoted`: include nell'output i candidati già promossi.
- `--json`: stampa output JSON.

`memory promote-explain`:

Spiega uno specifico candidato alla promozione e la scomposizione del suo punteggio.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: chiave del candidato, frammento di percorso o frammento di snippet da cercare.
- `--agent <id>`: limita l'ambito a un singolo agente (predefinito: l'agente predefinito).
- `--include-promoted`: include candidati già promossi.
- `--json`: stampa output JSON.

`memory rem-harness`:

Visualizza in anteprima riflessioni REM, verità candidate e output di promozione profonda senza scrivere nulla.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: limita l'ambito a un singolo agente (predefinito: l'agente predefinito).
- `--include-promoted`: include candidati profondi già promossi.
- `--json`: stampa output JSON.

## Dreaming

Dreaming è il sistema di consolidamento della memoria in background con tre fasi cooperative:
**light** (ordina/prepara il materiale a breve termine), **deep** (promuove fatti durevoli
in `MEMORY.md`) e **REM** (riflette e fa emergere temi).

- Abilita con `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Attiva/disattiva dalla chat con `/dreaming on|off` (oppure ispeziona con `/dreaming status`).
  I chiamanti del canale devono essere proprietari per modificare l'impostazione; i client Gateway richiedono
  `operator.admin`. Lo stato e l'aiuto in sola lettura restano disponibili ai mittenti di comandi autorizzati.
- Dreaming viene eseguito su una pianificazione di scansione gestita (`dreaming.frequency`) ed esegue le fasi in ordine: light, REM, deep.
- Solo la fase deep scrive memoria durevole in `MEMORY.md`.
- L'output delle fasi leggibile da persone e le voci di diario vengono scritti in `DREAMS.md` (o in un `dreams.md` esistente), con report opzionali per fase in `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- La classificazione usa segnali ponderati: frequenza di richiamo, rilevanza del recupero, diversità delle query, recenza temporale, consolidamento tra giorni e ricchezza concettuale derivata.
- La promozione rilegge la nota giornaliera live prima di scrivere in `MEMORY.md`, quindi snippet a breve termine modificati o eliminati non vengono promossi da snapshot obsoleti dello store di richiamo.
- Le esecuzioni pianificate e manuali di `memory promote` condividono gli stessi valori predefiniti della fase deep, a meno che non passi override CLI delle soglie.
- Le esecuzioni automatiche si distribuiscono su tutti i workspace di memoria configurati.

Pianificazione predefinita:

- **Cadenza di scansione**: `dreaming.frequency = 0 3 * * *`
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
- `memory status` include eventuali percorsi extra configurati tramite `memorySearch.extraPaths`.
- Se i campi della chiave API remota della memoria effettivamente attiva sono configurati come SecretRefs, il comando risolve quei valori dallo snapshot Gateway attivo. Se Gateway non è disponibile, il comando fallisce rapidamente.
- Nota sul disallineamento di versione del Gateway: questo percorso di comando richiede un gateway che supporti `secrets.resolve`; gateway più vecchi restituiscono un errore di metodo sconosciuto.
- Regola la cadenza della scansione pianificata con `dreaming.frequency`. La policy di promozione deep è altrimenti interna, tranne per `dreaming.phases.deep.maxPromotedSnippetTokens`, che limita la lunghezza degli snippet promossi mantenendo visibile la provenienza. Usa i flag CLI su `memory promote` quando ti servono override manuali una tantum delle soglie.
- `memory rem-harness --path <file-or-dir> --grounded` visualizza in anteprima `What Happened`, `Reflections` e `Possible Lasting Updates` fondati su note giornaliere storiche senza scrivere nulla.
- `memory rem-backfill --path <file-or-dir>` scrive voci di diario fondate e reversibili in `DREAMS.md` per la revisione nell'interfaccia utente.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` inserisce anche candidati durevoli fondati nello store live di promozione a breve termine, così la normale fase deep può classificarli.
- `memory rem-backfill --rollback` rimuove le voci di diario fondate scritte in precedenza, e `memory rem-backfill --rollback-short-term` rimuove i candidati a breve termine fondati preparati in precedenza.
- Vedi [Dreaming](/it/concepts/dreaming) per descrizioni complete delle fasi e riferimento di configurazione.

## Correlati

- [Riferimento CLI](/it/cli)
- [Panoramica della memoria](/it/concepts/memory)
