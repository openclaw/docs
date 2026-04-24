---
read_when:
    - Vuoi indicizzare o cercare nella memoria semantica
    - Stai eseguendo il debug della disponibilità o dell'indicizzazione della memoria semantica
    - Vuoi promuovere la memoria a breve termine richiamata in `MEMORY.md`
summary: Riferimento CLI per `openclaw memory` (stato/indice/ricerca/promuovi/spiegazione-promozione/rem-harness)
title: Memoria
x-i18n:
    generated_at: "2026-04-24T08:34:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4bcb1af05ecddceef7cd1d3244c8f0e4fc740d6d41fc5e9daa37177d1bfe3674
    source_path: cli/memory.md
    workflow: 15
---

# `openclaw memory`

Gestisci l'indicizzazione e la ricerca della memoria semantica.
Fornito dal Plugin di memoria attivo (predefinito: `memory-core`; imposta `plugins.slots.memory = "none"` per disabilitarlo).

Correlati:

- Concetto di memoria: [Memory](/it/concepts/memory)
- Wiki della memoria: [Memory Wiki](/it/plugins/memory-wiki)
- CLI wiki: [wiki](/it/cli/wiki)
- Plugins: [Plugins](/it/tools/plugin)

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

- `--agent <id>`: limita a un singolo agente. Senza questo, questi comandi vengono eseguiti per ogni agente configurato; se non è configurato alcun elenco di agenti, usano come fallback l'agente predefinito.
- `--verbose`: emette log dettagliati durante probe e indicizzazione.

`memory status`:

- `--deep`: verifica la disponibilità di vettori + embedding.
- `--index`: esegue una nuova indicizzazione se l'archivio è dirty (implica `--deep`).
- `--fix`: ripara lock di richiamo obsoleti e normalizza i metadati di promozione.
- `--json`: stampa output JSON.

Se `memory status` mostra `Dreaming status: blocked`, il Cron gestito di Dreaming è abilitato ma l'Heartbeat che lo guida non si attiva per l'agente predefinito. Vedi [Dreaming never runs](/it/concepts/dreaming#dreaming-never-runs-status-shows-blocked) per le due cause più comuni.

`memory index`:

- `--force`: forza una reindicizzazione completa.

`memory search`:

- Input della query: passa `[query]` posizionale oppure `--query <text>`.
- Se vengono forniti entrambi, prevale `--query`.
- Se non viene fornito nessuno dei due, il comando termina con un errore.
- `--agent <id>`: limita a un singolo agente (predefinito: l'agente predefinito).
- `--max-results <n>`: limita il numero di risultati restituiti.
- `--min-score <n>`: filtra le corrispondenze con punteggio basso.
- `--json`: stampa risultati JSON.

`memory promote`:

Anteprima e applicazione delle promozioni della memoria a breve termine.

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` -- scrive le promozioni in `MEMORY.md` (predefinito: solo anteprima).
- `--limit <n>` -- limita il numero di candidati mostrati.
- `--include-promoted` -- include le voci già promosse nei cicli precedenti.

Opzioni complete:

- Classifica i candidati a breve termine da `memory/YYYY-MM-DD.md` usando segnali di promozione pesati (`frequency`, `relevance`, `query diversity`, `recency`, `consolidation`, `conceptual richness`).
- Usa segnali a breve termine sia dai richiami della memoria sia dai passaggi di ingestione giornaliera, oltre a segnali di rinforzo della fase light/REM.
- Quando Dreaming è abilitato, `memory-core` gestisce automaticamente un processo Cron che esegue uno sweep completo (`light -> REM -> deep`) in background (non è necessario `openclaw cron add` manuale).
- `--agent <id>`: limita a un singolo agente (predefinito: l'agente predefinito).
- `--limit <n>`: numero massimo di candidati da restituire/applicare.
- `--min-score <n>`: punteggio minimo pesato di promozione.
- `--min-recall-count <n>`: numero minimo di richiami richiesto per un candidato.
- `--min-unique-queries <n>`: numero minimo di query distinte richiesto per un candidato.
- `--apply`: aggiunge i candidati selezionati a `MEMORY.md` e li contrassegna come promossi.
- `--include-promoted`: include in output i candidati già promossi.
- `--json`: stampa output JSON.

`memory promote-explain`:

Spiega un candidato specifico alla promozione e la scomposizione del suo punteggio.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`: chiave del candidato, frammento di percorso o frammento di snippet da cercare.
- `--agent <id>`: limita a un singolo agente (predefinito: l'agente predefinito).
- `--include-promoted`: include i candidati già promossi.
- `--json`: stampa output JSON.

`memory rem-harness`:

Mostra in anteprima riflessioni REM, verità candidate e output di promozione deep senza scrivere nulla.

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`: limita a un singolo agente (predefinito: l'agente predefinito).
- `--include-promoted`: include i candidati deep già promossi.
- `--json`: stampa output JSON.

## Dreaming

Dreaming è il sistema di consolidamento della memoria in background con tre fasi
cooperative: **light** (ordina/prepara il materiale a breve termine), **deep** (promuove
i fatti durevoli in `MEMORY.md`) e **REM** (riflette ed evidenzia i temi).

- Abilita con `plugins.entries.memory-core.config.dreaming.enabled: true`.
- Attiva/disattiva dalla chat con `/dreaming on|off` (oppure controlla con `/dreaming status`).
- Dreaming viene eseguito con una pianificazione di sweep gestita (`dreaming.frequency`) ed esegue le fasi in ordine: light, REM, deep.
- Solo la fase deep scrive memoria durevole in `MEMORY.md`.
- L'output delle fasi leggibile da esseri umani e le voci di diario vengono scritti in `DREAMS.md` (o `dreams.md` esistente), con report facoltativi per fase in `memory/dreaming/<phase>/YYYY-MM-DD.md`.
- La classificazione usa segnali pesati: frequenza di richiamo, rilevanza del recupero, diversità delle query, recenza temporale, consolidamento tra giorni e ricchezza concettuale derivata.
- La promozione rilegge la nota giornaliera live prima di scrivere in `MEMORY.md`, così snippet a breve termine modificati o eliminati non vengono promossi da snapshot obsoleti dell'archivio di richiamo.
- Le esecuzioni pianificate e quelle manuali di `memory promote` condividono gli stessi valori predefiniti della fase deep, a meno che tu non passi override di soglia tramite CLI.
- Le esecuzioni automatiche si distribuiscono tra gli spazi di lavoro memoria configurati.

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
- Se i campi della chiave API remota della memoria effettivamente attiva sono configurati come SecretRef, il comando risolve quei valori dallo snapshot del gateway attivo. Se il gateway non è disponibile, il comando fallisce rapidamente.
- Nota sulla differenza di versione del gateway: questo percorso di comando richiede un gateway che supporti `secrets.resolve`; i gateway meno recenti restituiscono un errore di metodo sconosciuto.
- Regola la cadenza degli sweep pianificati con `dreaming.frequency`. La policy di promozione deep è altrimenti interna; usa i flag CLI su `memory promote` quando ti servono override manuali una tantum.
- `memory rem-harness --path <file-or-dir> --grounded` mostra in anteprima `What Happened`, `Reflections` e `Possible Lasting Updates` basati su note giornaliere storiche senza scrivere nulla.
- `memory rem-backfill --path <file-or-dir>` scrive voci di diario basate e reversibili in `DREAMS.md` per la revisione UI.
- `memory rem-backfill --path <file-or-dir> --stage-short-term` inserisce anche candidati durevoli basati nell'archivio live di promozione a breve termine, così la normale fase deep può classificarli.
- `memory rem-backfill --rollback` rimuove le voci di diario basate scritte in precedenza, e `memory rem-backfill --rollback-short-term` rimuove i candidati a breve termine basati inseriti in precedenza.
- Vedi [Dreaming](/it/concepts/dreaming) per descrizioni complete delle fasi e riferimento della configurazione.

## Correlati

- [Riferimento CLI](/it/cli)
- [Panoramica della memoria](/it/concepts/memory)
