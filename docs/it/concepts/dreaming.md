---
read_when:
    - Vuoi che la promozione della memoria venga eseguita automaticamente
    - Vuoi capire cosa fa ogni fase di Dreaming
    - Vuoi regolare il consolidamento senza inquinare MEMORY.md
summary: Consolidamento della memoria in background con fasi light, deep e REM più un Diario dei sogni
title: Dreaming
x-i18n:
    generated_at: "2026-04-24T08:36:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: a3c0f6ff18ac78980be07452859ec79e9a5b2ebb513c69e38eb09eff66291395
    source_path: concepts/dreaming.md
    workflow: 15
---

Dreaming è il sistema di consolidamento della memoria in background in `memory-core`.
Aiuta OpenClaw a spostare segnali forti della memoria a breve termine nella memoria durevole mantenendo
il processo spiegabile e verificabile.

Dreaming è **opt-in** ed è disabilitato per impostazione predefinita.

## Cosa scrive Dreaming

Dreaming conserva due tipi di output:

- **Stato macchina** in `memory/.dreams/` (store di richiamo, segnali di fase, checkpoint di ingestione, lock).
- **Output leggibile da umani** in `DREAMS.md` (o nell'esistente `dreams.md`) e file di report di fase facoltativi in `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promozione a lungo termine continua a scrivere solo in `MEMORY.md`.

## Modello di fase

Dreaming usa tre fasi cooperative:

| Fase | Scopo                                      | Scrittura durevole |
| ----- | ------------------------------------------ | ------------------ |
| Light | Ordinare e preparare il materiale recente a breve termine | No                 |
| Deep  | Valutare e promuovere i candidati durevoli | Sì (`MEMORY.md`)   |
| REM   | Riflettere su temi e idee ricorrenti       | No                 |

Queste fasi sono dettagli di implementazione interni, non "modalità" separate configurate dall'utente.

### Fase Light

La fase Light acquisisce segnali recenti della memoria quotidiana e tracce di richiamo, li deduplica
e prepara righe candidate.

- Legge dallo stato di richiamo a breve termine, dai file recenti della memoria quotidiana e dalle trascrizioni di sessione redatte quando disponibili.
- Scrive un blocco gestito `## Light Sleep` quando lo storage include output inline.
- Registra segnali di rinforzo per la successiva classificazione deep.
- Non scrive mai in `MEMORY.md`.

### Fase Deep

La fase Deep decide cosa diventa memoria a lungo termine.

- Classifica i candidati usando punteggi ponderati e soglie di accesso.
- Richiede il superamento di `minScore`, `minRecallCount` e `minUniqueQueries`.
- Reidrata gli snippet dai file quotidiani live prima di scrivere, quindi gli snippet obsoleti/eliminati vengono saltati.
- Aggiunge le voci promosse a `MEMORY.md`.
- Scrive un riepilogo `## Deep Sleep` in `DREAMS.md` e facoltativamente scrive `memory/dreaming/deep/YYYY-MM-DD.md`.

### Fase REM

La fase REM estrae pattern e segnali riflessivi.

- Costruisce riepiloghi di temi e riflessioni dalle recenti tracce a breve termine.
- Scrive un blocco gestito `## REM Sleep` quando lo storage include output inline.
- Registra segnali di rinforzo REM usati dalla classificazione deep.
- Non scrive mai in `MEMORY.md`.

## Ingestione delle trascrizioni di sessione

Dreaming può acquisire trascrizioni di sessione redatte nel corpus di Dreaming. Quando
le trascrizioni sono disponibili, vengono inviate alla fase Light insieme ai segnali
della memoria quotidiana e alle tracce di richiamo. I contenuti personali e sensibili vengono redatti
prima dell'ingestione.

## Dream Diary

Dreaming mantiene anche un **Dream Diary** narrativo in `DREAMS.md`.
Dopo che ogni fase ha materiale sufficiente, `memory-core` esegue un turno best-effort in background di
sottoagente (usando il modello runtime predefinito) e aggiunge una breve voce del diario.

Questo diario è pensato per la lettura umana nella UI Dreams, non come fonte di promozione.
Gli artefatti di diario/report generati da Dreaming sono esclusi dalla promozione a breve termine. Solo gli snippet
di memoria fondati possono essere promossi in `MEMORY.md`.

Esiste anche una corsia di backfill storico fondato per lavoro di revisione e ripristino:

- `memory rem-harness --path ... --grounded` mostra in anteprima l'output del diario fondato dalle note storiche `YYYY-MM-DD.md`.
- `memory rem-backfill --path ...` scrive voci reversibili del diario fondato in `DREAMS.md`.
- `memory rem-backfill --path ... --stage-short-term` prepara candidati durevoli fondati nello stesso store di evidenze a breve termine già usato dalla normale fase deep.
- `memory rem-backfill --rollback` e `--rollback-short-term` rimuovono quegli artefatti di backfill preparati senza toccare le normali voci del diario o il richiamo live a breve termine.

La UI Control espone lo stesso flusso di backfill/reset del diario così puoi ispezionare
i risultati nella scena Dreams prima di decidere se i candidati fondati
meritano la promozione. La scena mostra anche una corsia fondata distinta così puoi vedere
quali voci a breve termine preparate provengono dal replay storico, quali elementi promossi sono stati guidati da elementi fondati e cancellare solo le voci preparate solo-fondate senza
toccare il normale stato live a breve termine.

## Segnali di classificazione Deep

La classificazione Deep usa sei segnali base ponderati più il rinforzo di fase:

| Segnale            | Peso   | Descrizione                                       |
| ------------------ | ------ | ------------------------------------------------- |
| Frequenza          | 0.24   | Quanti segnali a breve termine ha accumulato la voce |
| Rilevanza          | 0.30   | Qualità media di recupero della voce              |
| Diversità delle query | 0.15 | Contesti distinti di query/giorno che l'hanno fatta emergere |
| Recenza            | 0.15   | Punteggio di freschezza con decadimento temporale |
| Consolidamento     | 0.10   | Forza di ricorrenza multi-giorno                  |
| Ricchezza concettuale | 0.06 | Densità di tag concettuali da snippet/percorso    |

I riscontri della fase Light e REM aggiungono un piccolo incremento con decadimento di recenza da
`memory/.dreams/phase-signals.json`.

## Pianificazione

Quando abilitato, `memory-core` gestisce automaticamente un job Cron per uno sweep completo di Dreaming. Ogni sweep esegue le fasi in ordine: light -> REM -> deep.

Comportamento predefinito della cadenza:

| Impostazione         | Predefinito |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## Avvio rapido

Abilita Dreaming:

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

Abilita Dreaming con una cadenza sweep personalizzata:

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "timezone": "America/Los_Angeles",
            "frequency": "0 */6 * * *"
          }
        }
      }
    }
  }
}
```

## Comando slash

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Flusso CLI

Usa la promozione CLI per anteprima o applicazione manuale:

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

Il comando manuale `memory promote` usa per impostazione predefinita le soglie della fase deep, a meno che non vengano sovrascritte
con flag CLI.

Spiega perché un candidato specifico verrebbe o non verrebbe promosso:

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

Mostra in anteprima riflessioni REM, verità candidate e output di promozione deep senza
scrivere nulla:

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## Valori predefiniti chiave

Tutte le impostazioni si trovano sotto `plugins.entries.memory-core.config.dreaming`.

| Chiave      | Predefinito |
| ----------- | ----------- |
| `enabled`   | `false`     |
| `frequency` | `0 3 * * *` |

Il criterio di fase, le soglie e il comportamento dello storage sono dettagli di implementazione
interni (non configurazione esposta all'utente).

Vedi [Riferimento configurazione della memoria](/it/reference/memory-config#dreaming)
per l'elenco completo delle chiavi.

## UI Dreams

Quando abilitata, la scheda **Dreams** del Gateway mostra:

- stato attuale di abilitazione di Dreaming
- stato a livello di fase e presenza dello sweep gestito
- conteggi di elementi a breve termine, fondati, segnali e promossi oggi
- orario della successiva esecuzione pianificata
- una corsia Scena fondata distinta per le voci preparate dal replay storico
- un lettore espandibile del Dream Diary supportato da `doctor.memory.dreamDiary`

## Correlati

- [Memory](/it/concepts/memory)
- [Ricerca in memoria](/it/concepts/memory-search)
- [CLI memory](/it/cli/memory)
- [Riferimento configurazione della memoria](/it/reference/memory-config)
