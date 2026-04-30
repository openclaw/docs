---
read_when:
    - Vuoi indicizzare o cercare nella memoria semantica
    - Stai eseguendo il debug della disponibilità di memoria o dell'indicizzazione
    - Vuoi promuovere la memoria a breve termine richiamata in `MEMORY.md`
summary: Riferimento CLI per `openclaw memory` (status/index/search/promote/promote-explain/rem-harness)
title: Memoria
x-i18n:
    generated_at: "2026-04-30T08:43:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 53301e82d4ebe72b161b3a58078e7b75b9e499bc55cbceec5032c7e410619bd4
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Gestisci l'indicizzazione e la ricerca della memoria semantica.
Fornito dal Plugin Active Memory (predefinito: `memory-core`; imposta `plugins.slots.memory = "none"` per disabilitarlo).

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

- `--agent <id>`: limita l'ambito a un singolo agente. Senza questa opzione, questi comandi vengono eseguiti per ogni agente configurato; se non è configurato alcun elenco di agenti, usano l'agente predefinito.
- `--verbose`: emette log dettagliati durante i probe e l'indicizzazione.

`memory status`:

- `--deep`: verifica la disponibilità di vettori ed embedding. Il semplice `memory status` resta rapido e non esegue un ping di embedding live. La ricerca lessicale QMD `searchMode: "search"` salta i probe dei vettori semantici e la manutenzione degli embedding anche con `--deep`.
- `--index`: esegue una reindicizzazione se lo store è dirty (implica `--deep`).
- `--fix`: ripara i lock di recall obsoleti e normalizza i metadati di promozione.
- `--json`: stampa output JSON.

Se `memory status` mostra `Dreaming status: blocked`, il Cron Dreaming gestito è abilitato ma l'Heartbeat che lo alimenta non viene eseguito per l'agente predefinito. Vedi [Dreaming non viene mai eseguito](/it/concepts/dreaming#dreaming-never-runs-status-shows-blocked) per le due cause comuni.

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

Visualizza in anteprima e applica le promozioni della memoria a breve termine.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- scrive le promozioni in `MEMORY.md` (predefinito: solo anteprima).
- `--limit <n>` -- limita il numero di candidati mostrati.
- `--include-promoted` -- include le voci già promosse nei cicli precedenti.

Opzioni complete:

- Classifica i candidati a breve termine da `memory/YYYY-MM-DD.md` usando segnali di promozione ponderati (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Usa segnali a breve termine sia dai recall di memoria sia dai passaggi di ingestione giornaliera, più segnali di rinforzo delle fasi light/REM.
- Quando Dreaming è abilitato, `memory-core` gestisce automaticamente un solo job Cron che esegue uno sweep completo (`light -> REM -> deep`) in background (non è richiesto alcun `openclaw cron add` manuale).
- `--agent <id>`: limita l'ambito a un singolo agente (predefinito: l'agente predefinito).
- `--limit <n>`: numero massimo di candidati da restituire/applicare.
- `--min-score <n>`: punteggio minimo ponderato di promozione.
- `--min-recall-count <n>`: conteggio minimo di recall richiesto per un candidato.
- `--min-unique-queries <n>`: conteggio minimo di query distinte richiesto per un candidato.
- `--apply`: aggiunge i candidati selezionati a `MEMORY.md` e li contrassegna come promossi.
- `--include-promoted`: include nell'output i candidati già promossi.
- `--json`: stampa output JSON.

`memory promote-explain`:

Spiega un candidato di promozione specifico e la scomposizione del suo punteggio.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: chiave del candidato, frammento di percorso o frammento di snippet da cercare.
- `--agent <id>`: limita l'ambito a un singolo agente (predefinito: l'agente predefinito).
- `--include-promoted`: include i candidati già promossi.
- `--json`: stampa output JSON.

`memory rem-harness`:

Visualizza in anteprima riflessioni REM, verità candidate e output di promozione deep senza scrivere nulla.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: limita l'ambito a un singolo agente (predefinito: l'agente predefinito).
- `--include-promoted`: include i candidati deep già promossi.
- `--json`: stampa output JSON.

## Dreaming

Dreaming è il sistema di consolidamento della memoria in background con tre fasi
cooperative: **light** (ordina/prepara il materiale a breve termine), **deep** (promuove fatti durevoli
in `MEMORY.md`) e **REM** (riflette e fa emergere temi).

- Abilita con `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Attiva o disattiva dalla chat con `/dreaming on|off` (oppure ispeziona con `/dreaming status`).
- Dreaming viene eseguito su una pianificazione di sweep gestita (`dreaming.frequency`) ed esegue le fasi in ordine: light, REM, deep.
- Solo la fase deep scrive memoria durevole in `MEMORY.md`.
- L'output di fase leggibile dalle persone e le voci di diario vengono scritti in `DREAMS.md` (o nell'esistente `dreams.md`), con report opzionali per fase in `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- La classificazione usa segnali ponderati: frequenza di recall, pertinenza del recupero, diversità delle query, recenza temporale, consolidamento tra giorni e ricchezza concettuale derivata.
- La promozione rilegge la nota giornaliera live prima di scrivere in `MEMORY.md`, quindi gli snippet a breve termine modificati o eliminati non vengono promossi da snapshot obsoleti del recall store.
- Le esecuzioni pianificate e manuali di `memory promote` condividono gli stessi valori predefiniti della fase deep, a meno che non passi override delle soglie tramite CLI.
- Le esecuzioni automatiche si distribuiscono su tutti i workspace di memoria configurati.

Pianificazione predefinita:

- **Cadenza dello sweep**: `dreaming.frequency = 0 3 * * *`
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
- Se i campi chiave API remota di Active Memory effettivamente attiva sono configurati come SecretRefs, il comando risolve quei valori dallo snapshot del Gateway attivo. Se il Gateway non è disponibile, il comando fallisce rapidamente.
- Nota sul disallineamento di versione del Gateway: questo percorso di comando richiede un Gateway che supporti `secrets.resolve`; i Gateway più vecchi restituiscono un errore di metodo sconosciuto.
- Regola la cadenza dello sweep pianificato con `dreaming.frequency`. La policy di promozione deep è altrimenti interna; usa i flag CLI su `memory promote` quando ti servono override manuali una tantum.
- `memory rem-harness --path <file-or-dir> --grounded` visualizza in anteprima `What Happened`, `Reflections` e `Possible Lasting Updates` fondati da note giornaliere storiche senza scrivere nulla.
- `memory rem-backfill --path <file-or-dir>` scrive voci di diario fondate e reversibili in `DREAMS.md` per la revisione nell'interfaccia utente.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` inserisce anche candidati durevoli fondati nello store di promozione a breve termine live, così la normale fase deep può classificarli.
- `memory rem-backfill --rollback` rimuove le voci di diario fondate scritte in precedenza, e `memory rem-backfill --rollback-short-term` rimuove i candidati a breve termine fondati inseriti in precedenza.
- Vedi [Dreaming](/it/concepts/dreaming) per le descrizioni complete delle fasi e il riferimento di configurazione.

## Correlati

- [Riferimento CLI](/it/cli)
- [Panoramica della memoria](/it/concepts/memory)
