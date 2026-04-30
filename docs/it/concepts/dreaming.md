---
read_when:
    - Vuoi che la promozione della memoria venga eseguita automaticamente
    - Vuoi capire cosa fa ogni fase di Dreaming
    - Vuoi ottimizzare il consolidamento senza sporcare MEMORY.md
sidebarTitle: Dreaming
summary: Consolidamento della memoria in background con fasi leggere, profonde e REM più un diario dei sogni
title: Dreaming
x-i18n:
    generated_at: "2026-04-30T08:46:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85c323c073fc786069835aad25ee68781af49bb031e63b9601674461f385cc2a
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming è il sistema di consolidamento della memoria in background in `memory-core`. Aiuta OpenClaw a spostare i segnali forti a breve termine nella memoria durevole mantenendo il processo spiegabile e revisionabile.

<Note>
Dreaming è **opt-in** e disabilitato per impostazione predefinita.
</Note>

## Cosa scrive Dreaming

Dreaming mantiene due tipi di output:

- **Stato macchina** in `memory/.dreams/` (archivio di richiamo, segnali di fase, checkpoint di ingestione, lock).
- **Output leggibile dalle persone** in `DREAMS.md` (o `dreams.md` esistente) e file opzionali di report di fase sotto `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promozione a lungo termine scrive ancora solo in `MEMORY.md`.

## Modello a fasi

Dreaming usa tre fasi cooperative:

| Fase  | Scopo                                      | Scrittura durevole |
| ----- | ------------------------------------------ | ------------------ |
| Light | Ordinare e preparare materiale recente a breve termine | No                 |
| Deep  | Valutare e promuovere candidati durevoli   | Sì (`MEMORY.md`)   |
| REM   | Riflettere su temi e idee ricorrenti       | No                 |

Queste fasi sono dettagli di implementazione interni, non "modalità" separate configurate dall'utente.

<AccordionGroup>
  <Accordion title="Light phase">
    La fase Light ingerisce segnali recenti di memoria giornaliera e tracce di richiamo, li deduplica e prepara righe candidate.

    - Legge dallo stato di richiamo a breve termine, dai file recenti di memoria giornaliera e dalle trascrizioni di sessione oscurate quando disponibili.
    - Scrive un blocco gestito `## Light Sleep` quando l'archiviazione include output inline.
    - Registra segnali di rinforzo per la successiva classificazione deep.
    - Non scrive mai in `MEMORY.md`.

  </Accordion>
  <Accordion title="Deep phase">
    La fase Deep decide cosa diventa memoria a lungo termine.

    - Classifica i candidati usando punteggio ponderato e soglie di sbarramento.
    - Richiede che `minScore`, `minRecallCount` e `minUniqueQueries` vengano superati.
    - Reidrata gli snippet dai file giornalieri live prima di scrivere, quindi gli snippet obsoleti/eliminati vengono saltati.
    - Aggiunge le voci promosse a `MEMORY.md`.
    - Scrive un riepilogo `## Deep Sleep` in `DREAMS.md` e opzionalmente scrive `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="REM phase">
    La fase REM estrae pattern e segnali riflessivi.

    - Costruisce riepiloghi di temi e riflessioni dalle tracce recenti a breve termine.
    - Scrive un blocco gestito `## REM Sleep` quando l'archiviazione include output inline.
    - Registra segnali di rinforzo REM usati dalla classificazione deep.
    - Non scrive mai in `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestione delle trascrizioni di sessione

Dreaming può ingerire trascrizioni di sessione oscurate nel corpus di Dreaming. Quando le trascrizioni sono disponibili, vengono fornite alla fase Light insieme ai segnali di memoria giornaliera e alle tracce di richiamo. I contenuti personali e sensibili vengono oscurati prima dell'ingestione.

## Diario dei sogni

Dreaming mantiene anche un **Diario dei sogni** narrativo in `DREAMS.md`. Dopo che ogni fase ha materiale sufficiente, `memory-core` esegue un turno subagent in background best-effort e aggiunge una breve voce di diario. Usa il modello runtime predefinito salvo che `dreaming.model` sia configurato. Se il modello configurato non è disponibile, Diario dei sogni riprova una volta con il modello predefinito della sessione.

<Note>
Questo diario è destinato alla lettura umana nell'interfaccia Dreams, non è una fonte di promozione. Gli artefatti di diario/report generati da Dreaming sono esclusi dalla promozione a breve termine. Solo gli snippet di memoria fondati su evidenze sono idonei alla promozione in `MEMORY.md`.
</Note>

Esiste anche una corsia di backfill storico fondata su evidenze per lavori di revisione e recupero:

<AccordionGroup>
  <Accordion title="Backfill commands">
    - `memory rem-harness --path ... --grounded` visualizza in anteprima output di diario fondato su evidenze da note storiche `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` scrive voci di diario reversibili e fondate su evidenze in `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` prepara candidati durevoli fondati su evidenze nello stesso archivio di evidenze a breve termine che la normale fase deep usa già.
    - `memory rem-backfill --rollback` e `--rollback-short-term` rimuovono tali artefatti di backfill preparati senza toccare le normali voci di diario o il richiamo live a breve termine.

  </Accordion>
</AccordionGroup>

La Control UI espone lo stesso flusso di backfill/reset del diario, così puoi ispezionare i risultati nella scena Dreams prima di decidere se i candidati fondati su evidenze meritano la promozione. La Scena mostra anche una corsia distinta fondata su evidenze, così puoi vedere quali voci a breve termine preparate provengono dal replay storico, quali elementi promossi sono stati guidati da evidenze e cancellare solo le voci preparate esclusivamente fondate su evidenze senza toccare il normale stato live a breve termine.

## Segnali di classificazione Deep

La classificazione Deep usa sei segnali di base ponderati più il rinforzo di fase:

| Segnale             | Peso | Descrizione                                      |
| ------------------- | ---- | ------------------------------------------------ |
| Frequenza           | 0.24 | Quanti segnali a breve termine ha accumulato la voce |
| Rilevanza           | 0.30 | Qualità media di recupero per la voce            |
| Diversità query     | 0.15 | Contesti distinti di query/giorno che l'hanno fatta emergere |
| Recenza             | 0.15 | Punteggio di freschezza con decadimento temporale |
| Consolidamento      | 0.10 | Forza della ricorrenza su più giorni             |
| Ricchezza concettuale | 0.06 | Densità dei tag concettuali da snippet/percorso  |

Gli hit delle fasi Light e REM aggiungono un piccolo boost con decadimento di recenza da `memory/.dreams/phase-signals.json`.

## Pianificazione

Quando abilitato, `memory-core` gestisce automaticamente un job cron per una scansione completa di Dreaming. Ogni scansione esegue le fasi in ordine: light → REM → deep.

Comportamento della cadenza predefinita:

| Impostazione         | Predefinito     |
| -------------------- | --------------- |
| `dreaming.frequency` | `0 3 * * *`     |
| `dreaming.model`     | modello predefinito |

## Avvio rapido

<Tabs>
  <Tab title="Enable dreaming">
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
  <Tab title="Custom sweep cadence">
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

## Flusso di lavoro CLI

<Tabs>
  <Tab title="Promotion preview / apply">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    `memory promote` manuale usa per impostazione predefinita le soglie della fase deep, salvo override con flag CLI.

  </Tab>
  <Tab title="Explain promotion">
    Spiega perché un candidato specifico verrebbe o non verrebbe promosso:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness preview">
    Visualizza in anteprima riflessioni REM, verità candidate e output di promozione deep senza scrivere nulla:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Valori predefiniti chiave

Tutte le impostazioni si trovano sotto `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Abilita o disabilita la scansione di Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cadenza Cron per la scansione completa di Dreaming.
</ParamField>
<ParamField path="model" type="string">
  Override opzionale del modello subagent di Diario dei sogni. Usa un valore canonico `provider/model` quando imposti anche una allowlist subagent `allowedModels`.
</ParamField>

<Warning>
`dreaming.model` richiede `plugins.entries.memory-core.subagent.allowModelOverride: true`. Per limitarlo, imposta anche `plugins.entries.memory-core.subagent.allowedModels`. I fallimenti di trust o allowlist rimangono visibili invece di ricadere silenziosamente su un fallback; il retry copre solo errori di modello non disponibile.
</Warning>

<Note>
La policy di fase, le soglie e il comportamento di archiviazione sono dettagli di implementazione interni (non configurazione esposta all'utente). Consulta [riferimento alla configurazione della memoria](/it/reference/memory-config#dreaming) per l'elenco completo delle chiavi.
</Note>

## Interfaccia Dreams

Quando abilitata, la scheda **Dreams** del Gateway mostra:

- stato corrente di abilitazione di Dreaming
- stato a livello di fase e presenza della scansione gestita
- conteggi a breve termine, fondati su evidenze, di segnali e promossi oggi
- tempistica della prossima esecuzione pianificata
- una corsia Scene distinta fondata su evidenze per le voci di replay storico preparate
- un lettore espandibile del Diario dei sogni basato su `doctor.memory.dreamDiary`

## Correlati

- [Memoria](/it/concepts/memory)
- [CLI della memoria](/it/cli/memory)
- [Riferimento alla configurazione della memoria](/it/reference/memory-config)
- [Ricerca nella memoria](/it/concepts/memory-search)
