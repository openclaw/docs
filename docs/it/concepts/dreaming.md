---
read_when:
    - Vuoi che la promozione della memoria venga eseguita automaticamente
    - Vuoi capire cosa fa ogni fase di Dreaming
    - Vuoi regolare il consolidamento senza contaminare MEMORY.md
sidebarTitle: Dreaming
summary: Consolidamento della memoria in background con fasi leggere, profonde e REM, più un diario Dreaming
title: Dreaming
x-i18n:
    generated_at: "2026-05-02T22:18:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: b56f93c68f53178e0998b9809ff358910956260f72ff7213b7d0dd92300f5d24
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming è il sistema di consolidamento della memoria in background in `memory-core`. Aiuta OpenClaw a spostare segnali forti a breve termine nella memoria durevole mantenendo il processo spiegabile e revisionabile.

<Note>
Dreaming è **opt-in** ed è disabilitato per impostazione predefinita.
</Note>

## Cosa scrive Dreaming

Dreaming mantiene due tipi di output:

- **Stato macchina** in `memory/.dreams/` (archivio di recall, segnali di fase, checkpoint di ingestione, lock).
- **Output leggibile dall’uomo** in `DREAMS.md` (o nel file esistente `dreams.md`) e file opzionali di report di fase sotto `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promozione a lungo termine scrive ancora solo in `MEMORY.md`.

## Modello a fasi

Dreaming usa tre fasi cooperative:

| Fase | Scopo                                     | Scrittura durevole |
| ---- | ----------------------------------------- | ------------------ |
| Light | Ordinare e predisporre materiale recente a breve termine | No |
| Deep  | Valutare e promuovere candidati durevoli | Sì (`MEMORY.md`) |
| REM   | Riflettere su temi e idee ricorrenti     | No |

Queste fasi sono dettagli interni di implementazione, non "modalità" separate configurate dall’utente.

<AccordionGroup>
  <Accordion title="Light phase">
    La fase Light ingerisce segnali recenti di memoria giornaliera e tracce di recall, li deduplica e predispone righe candidate.

    - Legge dallo stato di recall a breve termine, dai file recenti di memoria giornaliera e dalle trascrizioni di sessione redatte quando disponibili.
    - Scrive un blocco gestito `## Light Sleep` quando l’archiviazione include output inline.
    - Registra segnali di rinforzo per il successivo ranking Deep.
    - Non scrive mai in `MEMORY.md`.

  </Accordion>
  <Accordion title="Deep phase">
    La fase Deep decide cosa diventa memoria a lungo termine.

    - Classifica i candidati usando punteggi ponderati e soglie di accesso.
    - Richiede il superamento di `minScore`, `minRecallCount` e `minUniqueQueries`.
    - Reidrata gli snippet dai file giornalieri live prima di scrivere, quindi gli snippet obsoleti/eliminati vengono saltati.
    - Aggiunge le voci promosse a `MEMORY.md`.
    - Scrive un riepilogo `## Deep Sleep` in `DREAMS.md` e, opzionalmente, scrive `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="REM phase">
    La fase REM estrae pattern e segnali riflessivi.

    - Crea riepiloghi di temi e riflessioni dalle tracce recenti a breve termine.
    - Scrive un blocco gestito `## REM Sleep` quando l’archiviazione include output inline.
    - Registra segnali di rinforzo REM usati dal ranking Deep.
    - Non scrive mai in `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestione delle trascrizioni di sessione

Dreaming può ingerire trascrizioni di sessione redatte nel corpus di Dreaming. Quando le trascrizioni sono disponibili, vengono passate alla fase Light insieme ai segnali di memoria giornaliera e alle tracce di recall. I contenuti personali e sensibili vengono redatti prima dell’ingestione.

## Diario dei sogni

Dreaming mantiene anche un **Diario dei sogni** narrativo in `DREAMS.md`. Dopo che ogni fase ha abbastanza materiale, `memory-core` esegue in background un turno subagent best-effort e aggiunge una breve voce di diario. Usa il modello runtime predefinito a meno che `dreaming.model` non sia configurato. Se il modello configurato non è disponibile, il Diario dei sogni riprova una volta con il modello predefinito della sessione.

<Note>
Questo diario è destinato alla lettura umana nell’interfaccia Dreams, non è una fonte di promozione. Gli artefatti di diario/report generati da Dreaming sono esclusi dalla promozione a breve termine. Solo gli snippet di memoria fondati su evidenze sono idonei alla promozione in `MEMORY.md`.
</Note>

Esiste anche una corsia di backfill storico fondata su evidenze per attività di revisione e recupero:

<AccordionGroup>
  <Accordion title="Backfill commands">
    - `memory rem-harness --path ... --grounded` mostra in anteprima l’output di diario fondato su evidenze da note storiche `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` scrive voci di diario reversibili fondate su evidenze in `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` predispone candidati durevoli fondati su evidenze nello stesso archivio di evidenze a breve termine già usato dalla normale fase Deep.
    - `memory rem-backfill --rollback` e `--rollback-short-term` rimuovono quegli artefatti di backfill predisposti senza toccare le normali voci di diario o il recall live a breve termine.

  </Accordion>
</AccordionGroup>

La Control UI espone lo stesso flusso di backfill/reset del diario, così puoi ispezionare i risultati nella scena Dreams prima di decidere se i candidati fondati su evidenze meritano la promozione. La Scene mostra anche una corsia distinta per contenuti fondati su evidenze, così puoi vedere quali voci a breve termine predisposte provengono dalla riesecuzione storica, quali elementi promossi sono stati guidati da evidenze, e cancellare solo le voci predisposte esclusivamente fondate su evidenze senza toccare il normale stato live a breve termine.

## Segnali del ranking Deep

Il ranking Deep usa sei segnali di base ponderati più il rinforzo di fase:

| Segnale             | Peso | Descrizione                                      |
| ------------------- | ---- | ------------------------------------------------ |
| Frequenza           | 0.24 | Quanti segnali a breve termine ha accumulato la voce |
| Rilevanza           | 0.30 | Qualità media del recupero per la voce           |
| Diversità delle query | 0.15 | Contesti distinti di query/giorno che l’hanno fatta emergere |
| Recenza             | 0.15 | Punteggio di freschezza con decadimento temporale |
| Consolidamento      | 0.10 | Forza della ricorrenza su più giorni             |
| Ricchezza concettuale | 0.06 | Densità dei tag concettuali da snippet/percorso |

Le occorrenze delle fasi Light e REM aggiungono un piccolo boost con decadimento di recenza da `memory/.dreams/phase-signals.json`.

## Pianificazione

Quando abilitato, `memory-core` gestisce automaticamente un job cron per una sweep completa di Dreaming. Ogni sweep esegue le fasi in ordine: Light → REM → Deep.

La sweep include il workspace runtime primario e tutti i workspace agente configurati, deduplicati per percorso, così il fan-out dei workspace subagent non esclude il `DREAMS.md` e lo stato di memoria dell’agente principale.

Comportamento della cadenza predefinita:

| Impostazione         | Predefinito    |
| -------------------- | -------------- |
| `dreaming.frequency` | `0 3 * * *`    |
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

    `memory promote` manuale usa per impostazione predefinita le soglie della fase Deep, a meno che non vengano sovrascritte con flag CLI.

  </Tab>
  <Tab title="Explain promotion">
    Spiega perché uno specifico candidato verrebbe o non verrebbe promosso:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM harness preview">
    Visualizza in anteprima riflessioni REM, verità candidate e output di promozione Deep senza scrivere nulla:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Valori predefiniti principali

Tutte le impostazioni si trovano sotto `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Abilita o disabilita la sweep di Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cadenza Cron per la sweep completa di Dreaming.
</ParamField>
<ParamField path="model" type="string">
  Override opzionale del modello subagent del Diario dei sogni. Usa un valore canonico `provider/model` quando imposti anche una allowlist subagent `allowedModels`.
</ParamField>

<Warning>
`dreaming.model` richiede `plugins.entries.memory-core.subagent.allowModelOverride: true`. Per limitarlo, imposta anche `plugins.entries.memory-core.subagent.allowedModels`. Gli errori di trust o allowlist restano visibili invece di ripiegare silenziosamente; il retry copre solo gli errori di modello non disponibile.
</Warning>

<Note>
La policy di fase, le soglie e il comportamento di archiviazione sono dettagli interni di implementazione (non configurazione rivolta all’utente). Consulta il [riferimento alla configurazione della memoria](/it/reference/memory-config#dreaming) per l’elenco completo delle chiavi.
</Note>

## Interfaccia Dreams

Quando abilitata, la scheda **Dreams** del Gateway mostra:

- stato attuale di abilitazione di Dreaming
- stato a livello di fase e presenza della sweep gestita
- conteggi a breve termine, fondati su evidenze, di segnali e promossi oggi
- tempi della prossima esecuzione pianificata
- una corsia Scene distinta per le voci di riesecuzione storica predisposte
- un lettore espandibile del Diario dei sogni supportato da `doctor.memory.dreamDiary`

## Dreaming non viene mai eseguito: lo stato mostra bloccato

Se `openclaw memory status` riporta `Dreaming status: blocked`, il Cron gestito esiste ma l’Heartbeat dell’agente predefinito non sta scattando. Verifica che Heartbeat sia abilitato per l’agente predefinito e che la sua destinazione non sia `none`, quindi esegui di nuovo `openclaw memory status --deep` dopo il successivo intervallo di Heartbeat.

## Correlati

- [Memoria](/it/concepts/memory)
- [CLI della memoria](/it/cli/memory)
- [Riferimento alla configurazione della memoria](/it/reference/memory-config)
- [Ricerca nella memoria](/it/concepts/memory-search)
