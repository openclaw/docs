---
read_when:
    - Vuoi che la promozione della memoria venga eseguita automaticamente
    - Vuoi capire che cosa fa ogni fase di dreaming
    - Vuoi regolare il consolidamento senza contaminare MEMORY.md
sidebarTitle: Dreaming
summary: Consolidamento della memoria in background con fasi leggere, profonde e REM più un Dream Diary
title: Dreaming
x-i18n:
    generated_at: "2026-06-30T14:08:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1b636df63cdc5b60758f9600af695b3b6453122a03b0cc6fdc69d3c9259d1e61
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming è il sistema di consolidamento della memoria in background in `memory-core`. Aiuta OpenClaw a spostare i segnali forti a breve termine nella memoria durevole mantenendo il processo spiegabile e revisionabile.

<Note>
Dreaming è **opt-in** ed è disabilitato per impostazione predefinita.
</Note>

## Cosa scrive Dreaming

Dreaming mantiene due tipi di output:

- **Stato macchina** in `memory/.dreams/` (archivio di richiamo, segnali di fase, checkpoint di ingestion, lock).
- **Output leggibile dalle persone** in `DREAMS.md` (o `dreams.md` esistente) e file opzionali di report di fase sotto `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promozione a lungo termine continua a scrivere solo in `MEMORY.md`.

## Modello delle fasi

Dreaming usa tre fasi cooperative:

| Fase  | Scopo                                           | Scrittura durevole |
| ----- | ----------------------------------------------- | ------------------ |
| Light | Ordinare e preparare materiale recente a breve termine | No                 |
| Deep  | Valutare e promuovere candidati durevoli        | Sì (`MEMORY.md`)   |
| REM   | Riflettere su temi e idee ricorrenti            | No                 |

Queste fasi sono dettagli interni di implementazione, non "modalità" separate configurate dall'utente.

<AccordionGroup>
  <Accordion title="Fase Light">
    La fase Light acquisisce segnali recenti di memoria giornaliera e tracce di richiamo, li deduplica e prepara righe candidate.

    - Legge dallo stato di richiamo a breve termine, dai file recenti di memoria giornaliera e dalle trascrizioni di sessione redatte quando disponibili.
    - Scrive un blocco gestito `## Light Sleep` quando lo storage include output inline.
    - Registra segnali di rinforzo per il ranking deep successivo.
    - Non scrive mai in `MEMORY.md`.

  </Accordion>
  <Accordion title="Fase Deep">
    La fase Deep decide cosa diventa memoria a lungo termine.

    - Classifica i candidati usando scoring ponderato e gate di soglia.
    - Richiede che `minScore`, `minRecallCount` e `minUniqueQueries` siano superati.
    - Reidrata gli snippet dai file giornalieri live prima di scrivere, quindi gli snippet obsoleti/eliminati vengono saltati.
    - Accoda le voci promosse a `MEMORY.md`.
    - Scrive un riepilogo `## Deep Sleep` in `DREAMS.md` e facoltativamente scrive `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="Fase REM">
    La fase REM estrae pattern e segnali riflessivi.

    - Costruisce riepiloghi di temi e riflessioni da tracce recenti a breve termine.
    - Scrive un blocco gestito `## REM Sleep` quando lo storage include output inline.
    - Registra segnali di rinforzo REM usati dal ranking deep.
    - Non scrive mai in `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestion delle trascrizioni di sessione

Dreaming può acquisire trascrizioni di sessione redatte nel corpus di Dreaming. Quando le trascrizioni sono disponibili, vengono fornite alla fase Light insieme ai segnali di memoria giornaliera e alle tracce di richiamo. I contenuti personali e sensibili vengono redatti prima dell'ingestion.

## Diario dei sogni

Dreaming mantiene anche un **Diario dei sogni** narrativo in `DREAMS.md`. Dopo che ogni fase ha materiale sufficiente, `memory-core` esegue in background un turno subagent best-effort e accoda una breve voce di diario. Usa il modello runtime predefinito a meno che `dreaming.model` non sia configurato. Se il modello configurato non è disponibile, il Diario dei sogni riprova una volta con il modello predefinito della sessione.

<Note>
Questo diario è destinato alla lettura umana nella UI Sogni, non è una fonte di promozione. Gli artefatti di diario/report generati da Dreaming sono esclusi dalla promozione a breve termine. Solo gli snippet di memoria fondati sono idonei alla promozione in `MEMORY.md`.
</Note>

Esiste anche un percorso di backfill storico fondato per attività di revisione e recupero:

<AccordionGroup>
  <Accordion title="Comandi di backfill">
    - `memory rem-harness --path ... --grounded` visualizza in anteprima output di diario fondato da note storiche `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` scrive voci di diario fondate e reversibili in `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` prepara candidati durevoli fondati nello stesso archivio di evidenze a breve termine che la normale fase Deep usa già.
    - `memory rem-backfill --rollback` e `--rollback-short-term` rimuovono quegli artefatti di backfill preparati senza toccare le voci ordinarie del diario o il richiamo live a breve termine.

  </Accordion>
</AccordionGroup>

La Control UI espone lo stesso flusso di backfill/reset del diario, così puoi ispezionare i risultati nella scena Sogni prima di decidere se i candidati fondati meritano la promozione. La Scena mostra anche un percorso fondato distinto, così puoi vedere quali voci a breve termine preparate provenivano dal replay storico, quali elementi promossi erano guidati da contenuti fondati, e cancellare solo le voci preparate esclusivamente fondate senza toccare lo stato ordinario live a breve termine.

## Segnali di ranking Deep

Il ranking Deep usa sei segnali base ponderati più il rinforzo di fase:

| Segnale              | Peso | Descrizione                                       |
| -------------------- | ---- | ------------------------------------------------- |
| Frequenza            | 0.24 | Quanti segnali a breve termine ha accumulato la voce |
| Rilevanza            | 0.30 | Qualità media del recupero per la voce            |
| Diversità delle query | 0.15 | Contesti distinti di query/giorno che l'hanno fatta emergere |
| Recenza              | 0.15 | Punteggio di freschezza con decadimento temporale |
| Consolidamento       | 0.10 | Forza della ricorrenza su più giorni              |
| Ricchezza concettuale | 0.06 | Densità di tag concettuali da snippet/percorso    |

Gli hit delle fasi Light e REM aggiungono un piccolo boost con decadimento della recenza da `memory/.dreams/phase-signals.json`.

I risultati delle prove shadow possono essere stratificati sopra quel punteggio base come
segnale di revisione prima di qualsiasi scrittura durevole. Una prova utile dà al candidato un piccolo
boost limitato, una prova neutra lo mantiene rinviato, e una prova dannosa lo contrassegna
come rifiutato per quel passaggio di scoring. Questo segnale resta comunque solo di report: può
modificare l'ordinamento dei candidati o i metadati di revisione, ma non scrive in
`MEMORY.md` né promuove il candidato autonomamente.

## Copertura del report di prova shadow QA

QA Lab include uno scenario solo di report per esplorare come una futura prova shadow di Dreaming
potrebbe revisionare una memoria candidata prima della promozione. Lo scenario chiede
a un agent di confrontare una risposta baseline con una risposta che può usare la memoria candidata,
quindi scrivere un report locale con verdetto, motivazione e flag di rischio.

Questa copertura è intenzionalmente limitata alla QA. Verifica che l'artefatto di report
rimanga separato da `MEMORY.md` e che l'agent non affermi che il candidato
sia stato promosso. Non aggiunge comportamento di prova shadow in produzione né modifica il
motore di promozione della fase Deep.

Il runner di prova shadow di `memory-core` mantiene lo stesso contratto solo di report per
i percorsi di codice che richiedono un artefatto stabile. Accetta candidato, prompt della prova,
risultato baseline, risultato del candidato, verdetto, motivazione, flag di rischio e riferimenti
alle evidenze, quindi scrive un report con `promotion action: report-only`. I verdetti
utili mappano a una raccomandazione `promote`, i verdetti neutrali mappano a `defer`, e
i verdetti dannosi mappano a `reject`; nessuna di queste raccomandazioni scrive in
`MEMORY.md` né applica la promozione della fase Deep.

## Pianificazione

Quando abilitato, `memory-core` gestisce automaticamente un job cron per una sweep completa di Dreaming. Ogni sweep esegue le fasi in ordine: light → REM → deep.

La sweep include il workspace runtime primario e tutti i workspace agent configurati, deduplicati per percorso, così il fan-out dei workspace subagent non esclude `DREAMS.md` e lo stato della memoria dell'agent principale.

Comportamento della cadenza predefinita:

| Impostazione         | Predefinito      |
| -------------------- | ---------------- |
| `dreaming.frequency` | `0 3 * * *`      |
| `dreaming.model`     | modello predefinito |

## Avvio rapido

<Tabs>
  <Tab title="Abilitare Dreaming">
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
  <Tab title="Cadenza sweep personalizzata">
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

`/dreaming on` e `/dreaming off` modificano la configurazione a livello di Gateway. I chiamanti
di canale devono essere proprietari, e i client Gateway devono avere `operator.admin`.
`/dreaming status` e `/dreaming help` restano in sola lettura.

## Flusso di lavoro CLI

<Tabs>
  <Tab title="Anteprima / applicazione della promozione">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    Il comando manuale `memory promote` usa per impostazione predefinita le soglie della fase Deep, salvo override con flag CLI.

  </Tab>
  <Tab title="Spiegare la promozione">
    Spiega perché uno specifico candidato verrebbe o non verrebbe promosso:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Anteprima harness REM">
    Visualizza in anteprima riflessioni REM, verità candidate e output di promozione Deep senza scrivere nulla:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Impostazioni predefinite principali

Tutte le impostazioni si trovano sotto `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Abilita o disabilita la sweep di Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cadenza Cron per la sweep completa di Dreaming.
</ParamField>
<ParamField path="model" type="string">
  Override opzionale del modello subagent per il Diario dei sogni. Usa un valore canonico `provider/model` quando imposti anche una allowlist `allowedModels` per subagent.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  Numero massimo stimato di token mantenuto da ogni snippet di richiamo a breve termine promosso in `MEMORY.md`. La provenienza del ranking resta visibile.
</ParamField>

<Warning>
`dreaming.model` richiede `plugins.entries.memory-core.subagent.allowModelOverride: true`. Per limitarlo, imposta anche `plugins.entries.memory-core.subagent.allowedModels`. I fallimenti di attendibilità o allowlist restano visibili invece di ricadere silenziosamente su altro; il retry copre solo gli errori di modello non disponibile.
</Warning>

<Note>
La maggior parte delle policy di fase, delle soglie e del comportamento di storage sono dettagli interni di implementazione. Consulta il [riferimento di configurazione della memoria](/it/reference/memory-config#dreaming) per l'elenco completo delle chiavi.
</Note>

## UI Sogni

Quando abilitata, la scheda **Sogni** del Gateway mostra:

- stato corrente di abilitazione di Dreaming
- stato a livello di fase e presenza della sweep gestita
- conteggi a breve termine, fondati, di segnale e promossi oggi
- tempistica della prossima esecuzione pianificata
- un percorso Scena fondato distinto per voci di replay storico preparate
- un lettore espandibile del Diario dei sogni supportato da `doctor.memory.dreamDiary`

## Dreaming non viene mai eseguito: lo stato mostra blocked

Se `openclaw memory status` riporta `Dreaming status: blocked`, il cron gestito esiste ma l'heartbeat dell'agent predefinito non sta scattando. Verifica che heartbeat sia abilitato per l'agent predefinito e che il suo target non sia `none`, quindi esegui di nuovo `openclaw memory status --deep` dopo il successivo intervallo heartbeat.

## Correlati

- [Memoria](/it/concepts/memory)
- [CLI memoria](/it/cli/memory)
- [Riferimento di configurazione della memoria](/it/reference/memory-config)
- [Ricerca in memoria](/it/concepts/memory-search)
