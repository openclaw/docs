---
read_when:
    - Vuoi indicizzare o cercare nella memoria semantica
    - Stai eseguendo il debug della disponibilità o dell'indicizzazione della memoria
    - Vuoi promuovere la memoria a breve termine richiamata in `MEMORY.md`
summary: Riferimento della CLI per `openclaw memory` (stato/indice/ricerca/promozione/spiegazione della promozione/harness REM/backfill REM)
title: Memoria
x-i18n:
    generated_at: "2026-07-12T06:55:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f0002c48044455520f32a5a3e111415a746fbafba2a27a655ded90abdc94623b
    source_path: cli/memory.md
    workflow: 16
---

# `openclaw memory`

Gestisce l'indicizzazione della memoria semantica, la ricerca e la promozione in `MEMORY.md`.
È fornito dal plugin integrato `memory-core` ed è disponibile quando
`plugins.slots.memory` seleziona `memory-core` (impostazione predefinita). Gli altri plugin di memoria
espongono i propri namespace CLI.

Vedi anche: concetto di [memoria](/it/concepts/memory), [Dreaming](/it/concepts/dreaming),
[riferimento per la configurazione della memoria](/it/reference/memory-config), [wiki della memoria](/it/plugins/memory-wiki),
[wiki](/it/cli/wiki), [plugin](/it/tools/plugin).

## `memory status`

```bash
openclaw memory status [--agent <id>] [--deep] [--index] [--fix] [--json] [--verbose]
```

Senza `--agent`, viene eseguito per ogni agente in `agents.list`; se non è configurato
alcun elenco di agenti, usa come ripiego l'agente predefinito.

| Flag        | Effetto                                                                                                                                                                                                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--deep`    | Verifica la disponibilità dell'archivio vettoriale, del fornitore di incorporamenti e della ricerca semantica (comporta chiamate aggiuntive al fornitore). Il semplice `memory status` rimane rapido e ignora questa verifica; uno stato vettoriale/semantico sconosciuto indica che non è stato verificato. La modalità lessicale QMD `searchMode: "search"` ignora sempre le verifiche vettoriali semantiche, anche con `--deep`. |
| `--index`   | Reindicizza se l'archivio presenta modifiche non indicizzate. Implica `--deep`.                                                                                                                                                                                                                                                          |
| `--fix`     | Ripara i blocchi di recupero obsoleti e normalizza i metadati di promozione.                                                                                                                                                                                                                                               |
| `--json`    | Stampa JSON.                                                                                                                                                                                                                                                                                               |
| `--verbose` | Emette log dettagliati per ciascuna fase.                                                                                                                                                                                                                                                                             |

Se la riga `Dreaming` rimane `off` anche con `dreaming.enabled: true`, oppure
le scansioni pianificate sembrano non essere mai eseguite, il Cron gestito di Dreaming dipende
dall'attivazione dell'Heartbeat dell'agente predefinito per avviare la riconciliazione. Consulta
[Dreaming](/it/concepts/dreaming) per i dettagli sulla pianificazione.

Lo stato elenca anche gli eventuali percorsi di ricerca aggiuntivi definiti in `agents.defaults.memorySearch.extraPaths`.

## `memory index`

```bash
openclaw memory index [--agent <id>] [--force] [--verbose]
```

Usa lo stesso ambito per agente di `status`. `--force` esegue una reindicizzazione completa anziché
incrementale. `--verbose` stampa il fornitore, il modello, le origini e
i dettagli dei percorsi aggiuntivi per ciascun agente prima di mostrare l'avanzamento dell'indicizzazione.

## `memory search`

```bash
openclaw memory search [query] [--query <text>] [--agent <id>] [--max-results <n>] [--min-score <n>] [--json]
```

- Query: argomento posizionale `[query]` oppure `--query <text>`. Se sono impostati entrambi, prevale `--query`.
  Se non è impostato nessuno dei due, il comando restituisce un errore.
- `--agent <id>`: usa per impostazione predefinita l'agente predefinito (non l'intero elenco di agenti).
- `--max-results <n>`: limita il numero di risultati (numero intero positivo).
- `--min-score <n>`: esclude le corrispondenze con un punteggio inferiore a questo valore.

## `memory promote`

Classifica i candidati a breve termine da `memory/YYYY-MM-DD.md` e, facoltativamente, aggiunge
le voci migliori a `MEMORY.md`.

```bash
openclaw memory promote [--agent <id>] [--limit <n>] [--min-score <n>] \
  [--min-recall-count <n>] [--min-unique-queries <n>] [--apply] [--include-promoted] [--json]
```

| Flag                       | Valore predefinito | Effetto                                                                  |
| -------------------------- | ------------------ | ----------------------------------------------------------------------- |
| `--limit <n>`              |                    | Numero massimo di candidati da restituire/applicare.                     |
| `--min-score <n>`          | `0.75`             | Punteggio ponderato minimo per la promozione.                            |
| `--min-recall-count <n>`   | `3`                | Numero minimo di recuperi richiesto.                                     |
| `--min-unique-queries <n>` | `2`                | Numero minimo richiesto di query distinte.                               |
| `--apply`                  | solo anteprima     | Aggiunge i candidati selezionati a `MEMORY.md` e li contrassegna come promossi. |
| `--include-promoted`       |                    | Include i candidati già promossi nei cicli precedenti.                   |
| `--json`                   |                    | Stampa JSON.                                                             |

Questi valori predefiniti della CLI differiscono dalle soglie della fase profonda
della scansione pianificata di Dreaming (vedi [Dreaming](#dreaming) di seguito); specifica i flag
esplicitamente per riprodurre il comportamento della scansione in un'esecuzione manuale occasionale.

Segnali di classificazione: frequenza di recupero, pertinenza del reperimento, diversità delle query,
recenza temporale, consolidamento tra giorni e ricchezza dei concetti derivati, ottenuti
sia dai recuperi della memoria sia dalle elaborazioni di acquisizione giornaliera, oltre a un leggero
incremento di rinforzo delle fasi leggera/REM per le visite ripetute durante Dreaming. Prima della scrittura, la promozione
rilegge la nota giornaliera attuale, quindi le modifiche o eliminazioni apportate ai frammenti a breve termine
dopo la classificazione vengono rispettate, anziché promuovere dati da un'istantanea obsoleta.

## `memory promote-explain`

Spiega la composizione del punteggio di un candidato alla promozione.

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

`<selector>` corrisponde alla chiave di un candidato (esatta o come sottostringa), al percorso o al testo
del frammento.

## `memory rem-harness`

Mostra un'anteprima delle riflessioni REM, delle verità candidate e dell'output di promozione della fase profonda
senza scrivere nulla.

```bash
openclaw memory rem-harness [--agent <id>] [--path <file-or-dir>] [--grounded] [--include-promoted] [--json]
```

- `--path <file-or-dir>`: inizializza l'ambiente di prova dai file giornalieri storici `YYYY-MM-DD.md`
  anziché dall'area di lavoro attuale.
- `--grounded`: genera anche un'anteprima fondata sui fatti con le sezioni `Cosa è successo` / `Riflessioni` /
  `Possibili aggiornamenti duraturi`, a partire dalle note storiche.

## `memory rem-backfill`

Scrive riepiloghi REM storici fondati sui fatti in `DREAMS.md` per la revisione nell'interfaccia utente.
L'operazione è reversibile.

```bash
openclaw memory rem-backfill --path <file-or-dir> [--agent <id>] [--stage-short-term] [--json]
openclaw memory rem-backfill --rollback [--rollback-short-term] [--json]
```

- `--path <file-or-dir>`: obbligatorio a meno che non sia impostato `--rollback`/`--rollback-short-term`.
  Specifica i file di memoria giornalieri storici o la directory da cui eseguire il recupero retroattivo.
- `--stage-short-term`: inserisce anche candidati duraturi fondati sui fatti nell'archivio attuale
  delle promozioni a breve termine, in modo che la normale fase profonda possa classificarli.
- `--rollback`: rimuove da `DREAMS.md` le voci di diario fondate sui fatti scritte in precedenza.
- `--rollback-short-term`: rimuove i candidati fondati sui fatti a breve termine inseriti in precedenza.

## Dreaming

Dreaming è il sistema in background per il consolidamento della memoria, composto da tre fasi cooperative
eseguite in ordine secondo un'unica pianificazione: **leggera** (ordina/inserisce il materiale a breve termine),
**REM** (riflette e mette in evidenza i temi), **profonda** (promuove i fatti duraturi
in `MEMORY.md`). Solo la fase profonda scrive in `MEMORY.md`.

- Abilitalo con `plugins.entries.memory-core.config.dreaming.enabled: true`
  (valore predefinito `false`); `memory-core` gestisce automaticamente il processo Cron di scansione, senza richiedere
  l'esecuzione manuale di `openclaw cron add`.
- Attivalo o disattivalo dalla chat con `/dreaming on|off`; controllane lo stato con `/dreaming status`
  (oppure `/dreaming`/`/dreaming help`). `on`/`off` richiede lo stato di proprietario del canale
  oppure `operator.admin` del Gateway; lo stato e la guida restano disponibili a chiunque
  possa richiamare il comando.
- L'output leggibile delle fasi viene scritto in `DREAMS.md` (o in un file `dreams.md` esistente).
  Per impostazione predefinita (`dreaming.storage.mode: "separate"`), ciascuna fase scrive anche un
  rapporto autonomo in `memory/dreaming/<phase>/YYYY-MM-DD.md`; imposta `mode:
"inline"` per incorporare invece i rapporti nel file di memoria giornaliero, oppure `"both"`
  per entrambe le modalità.
- Le esecuzioni pianificate e quelle manuali di `memory promote` condividono gli stessi segnali di classificazione
  della fase profonda; differiscono solo le soglie predefinite (vedi la tabella precedente e
  i valori predefiniti pianificati riportati di seguito).
- Le esecuzioni pianificate vengono distribuite nell'area di lavoro della memoria di ogni agente configurato.

Valori predefiniti pianificati (`plugins.entries.memory-core.config.dreaming`):

| Chiave                                 | Valore predefinito |
| -------------------------------------- | ------------------ |
| `frequency`                            | `0 3 * * *`        |
| `phases.deep.minScore`                 | `0.8`              |
| `phases.deep.minRecallCount`           | `3`                |
| `phases.deep.minUniqueQueries`         | `3`                |
| `phases.deep.recencyHalfLifeDays`      | `14`               |
| `phases.deep.maxAgeDays`               | `30`               |
| `phases.deep.maxPromotedSnippetTokens` | `160`              |

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

Elenco completo delle chiavi e dettagli delle fasi: [Dreaming](/it/concepts/dreaming),
[riferimento per la configurazione della memoria](/it/reference/memory-config#dreaming).

## Dipendenza dal Gateway per SecretRef

Se i campi della chiave API remota di Active Memory sono configurati come SecretRef, i comandi `memory`
li risolvono dall'istantanea attiva del Gateway; se il Gateway non è
disponibile, il comando termina immediatamente con un errore. Ciò richiede un Gateway che supporti il
metodo `secrets.resolve`; i Gateway meno recenti restituiscono un errore di metodo sconosciuto.

## Contenuti correlati

- [Riferimento della CLI](/it/cli)
- [Panoramica della memoria](/it/concepts/memory)
