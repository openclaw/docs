---
read_when:
    - Vuoi che la promozione della memoria venga eseguita automaticamente
    - Vuoi capire cosa fa ogni fase di Dreaming
    - Vuoi ottimizzare il consolidamento senza inquinare MEMORY.md
sidebarTitle: Dreaming
summary: Consolidamento della memoria in background con fasi light, deep e REM più un Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-04-26T11:26:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: cba9593c5f697d49dbb20a3c908bf43ad37989f8cb029443b44523f2acab0e1d
    source_path: concepts/dreaming.md
    workflow: 15
---

Dreaming è il sistema di consolidamento della memoria in background in `memory-core`. Aiuta OpenClaw a spostare segnali forti a breve termine nella memoria durevole mantenendo il processo spiegabile e verificabile.

<Note>
Dreaming è **opt-in** ed è disabilitato per impostazione predefinita.
</Note>

## Cosa scrive Dreaming

Dreaming mantiene due tipi di output:

- **Stato macchina** in `memory/.dreams/` (archivio di richiamo, segnali di fase, checkpoint di ingestione, lock).
- **Output leggibile dagli esseri umani** in `DREAMS.md` (o `dreams.md` esistente) e file di report facoltativi per fase sotto `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promozione a lungo termine continua a scrivere solo in `MEMORY.md`.

## Modello a fasi

Dreaming usa tre fasi cooperative:

| Fase | Scopo                                     | Scrittura durevole |
| ----- | ----------------------------------------- | ------------------ |
| Light | Ordina e prepara il materiale recente a breve termine | No         |
| Deep  | Valuta e promuove i candidati durevoli    | Sì (`MEMORY.md`)   |
| REM   | Riflette su temi e idee ricorrenti        | No                 |

Queste fasi sono dettagli interni di implementazione, non "modalità" separate configurate dall'utente.

<AccordionGroup>
  <Accordion title="Fase Light">
    La fase Light acquisisce i segnali recenti della memoria quotidiana e le tracce di richiamo, li deduplica e prepara le righe candidate.

    - Legge dallo stato di richiamo a breve termine, dai file recenti della memoria quotidiana e dai transcript di sessione redatti quando disponibili.
    - Scrive un blocco gestito `## Light Sleep` quando l'archiviazione include output inline.
    - Registra segnali di rinforzo per il ranking deep successivo.
    - Non scrive mai in `MEMORY.md`.

  </Accordion>
  <Accordion title="Fase Deep">
    La fase Deep decide cosa diventa memoria a lungo termine.

    - Classifica i candidati usando punteggi ponderati e soglie di controllo.
    - Richiede il superamento di `minScore`, `minRecallCount` e `minUniqueQueries`.
    - Reidrata gli snippet dai file quotidiani live prima della scrittura, quindi gli snippet obsoleti/eliminati vengono saltati.
    - Aggiunge le voci promosse a `MEMORY.md`.
    - Scrive un riepilogo `## Deep Sleep` in `DREAMS.md` e facoltativamente scrive `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="Fase REM">
    La fase REM estrae pattern e segnali riflessivi.

    - Costruisce riepiloghi di temi e riflessioni dalle recenti tracce a breve termine.
    - Scrive un blocco gestito `## REM Sleep` quando l'archiviazione include output inline.
    - Registra segnali di rinforzo REM usati dal ranking deep.
    - Non scrive mai in `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestione dei transcript di sessione

Dreaming può acquisire transcript di sessione redatti nel corpus di dreaming. Quando i transcript sono disponibili, vengono alimentati nella fase light insieme ai segnali della memoria quotidiana e alle tracce di richiamo. Il contenuto personale e sensibile viene redatto prima dell'ingestione.

## Dream Diary

Dreaming mantiene anche un **Dream Diary** narrativo in `DREAMS.md`. Dopo che ogni fase ha raccolto materiale sufficiente, `memory-core` esegue un turno subagent in background nei limiti del possibile (usando il modello runtime predefinito) e aggiunge una breve voce di diario.

<Note>
Questo diario è pensato per la lettura umana nell'interfaccia Dreams, non è una fonte di promozione. Gli artefatti di diario/report generati da Dreaming sono esclusi dalla promozione a breve termine. Solo gli snippet di memoria fondati possono essere promossi in `MEMORY.md`.
</Note>

Esiste anche un percorso di backfill storico fondato per lavoro di revisione e recupero:

<AccordionGroup>
  <Accordion title="Comandi di backfill">
    - `memory rem-harness --path ... --grounded` mostra in anteprima l'output del diario fondato da note storiche `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` scrive voci di diario fondate e reversibili in `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` prepara candidati durevoli fondati nello stesso archivio di evidenze a breve termine già usato dalla normale fase deep.
    - `memory rem-backfill --rollback` e `--rollback-short-term` rimuovono quegli artefatti di backfill preparati senza toccare le normali voci di diario o il richiamo live a breve termine.

  </Accordion>
</AccordionGroup>

La Control UI espone lo stesso flusso di backfill/reset del diario così puoi ispezionare i risultati nella scena Dreams prima di decidere se i candidati fondati meritano la promozione. La scena mostra anche un percorso fondato distinto così puoi vedere quali voci a breve termine preparate provengono dalla riproduzione storica, quali elementi promossi erano guidati dal fondamento e cancellare solo le voci preparate esclusivamente fondate senza toccare il normale stato live a breve termine.

## Segnali di ranking deep

Il ranking deep usa sei segnali base ponderati più il rinforzo di fase:

| Segnale            | Peso   | Descrizione                                       |
| ------------------ | ------ | ------------------------------------------------- |
| Frequenza          | 0.24   | Quanti segnali a breve termine ha accumulato la voce |
| Rilevanza          | 0.30   | Qualità media di recupero per la voce             |
| Diversità delle query | 0.15 | Contesti distinti di query/giorno che l'hanno fatta emergere |
| Recenza            | 0.15   | Punteggio di freschezza con decadimento temporale |
| Consolidamento     | 0.10   | Forza di ricorrenza su più giorni                 |
| Ricchezza concettuale | 0.06 | Densità dei tag concettuali da snippet/percorso   |

I risultati delle fasi Light e REM aggiungono un piccolo incremento con decadimento della recenza da `memory/.dreams/phase-signals.json`.

## Pianificazione

Quando abilitato, `memory-core` gestisce automaticamente un processo Cron per un ciclo completo di dreaming. Ogni ciclo esegue le fasi in ordine: light → REM → deep.

Comportamento predefinito della cadenza:

| Impostazione         | Predefinito |
| -------------------- | ----------- |
| `dreaming.frequency` | `0 3 * * *` |

## Avvio rapido

<Tabs>
  <Tab title="Abilita Dreaming">
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
  </Tab>
  <Tab title="Cadenza personalizzata del ciclo">
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
  </Tab>
</Tabs>

## Comando slash

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## Workflow CLI

<Tabs>
  <Tab title="Anteprima / applicazione della promozione">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    Il comando manuale `memory promote` usa per impostazione predefinita le soglie della fase deep, salvo override con flag CLI.

  </Tab>
  <Tab title="Spiegare la promozione">
    Spiega perché un candidato specifico verrebbe o non verrebbe promosso:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Anteprima harness REM">
    Mostra in anteprima riflessioni REM, verità candidate e output di promozione deep senza scrivere nulla:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Valori predefiniti principali

Tutte le impostazioni si trovano sotto `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Abilita o disabilita il ciclo di dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cadenza Cron per il ciclo completo di dreaming.
</ParamField>

<Note>
Il criterio di fase, le soglie e il comportamento di archiviazione sono dettagli interni di implementazione (non configurazione esposta all'utente). Vedi [Riferimento configurazione memoria](/it/reference/memory-config#dreaming) per l'elenco completo delle chiavi.
</Note>

## UI Dreams

Quando abilitata, la scheda **Dreams** del Gateway mostra:

- stato corrente di abilitazione di dreaming
- stato a livello di fase e presenza del ciclo gestito
- conteggi di breve termine, fondati, segnali e promossi oggi
- orario della prossima esecuzione pianificata
- un percorso scena fondato distinto per le voci preparate dalla riproduzione storica
- un lettore espandibile del Dream Diary basato su `doctor.memory.dreamDiary`

## Correlati

- [Memoria](/it/concepts/memory)
- [CLI della memoria](/it/cli/memory)
- [Riferimento configurazione memoria](/it/reference/memory-config)
- [Ricerca nella memoria](/it/concepts/memory-search)
