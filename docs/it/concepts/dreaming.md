---
read_when:
    - Vuoi che la promozione della memoria venga eseguita automaticamente
    - Vuoi capire cosa fa ogni fase di Dreaming
    - Vuoi regolare la consolidazione senza contaminare MEMORY.md
sidebarTitle: Dreaming
summary: Consolidamento della memoria in background con fasi di sonno leggero, profondo e REM più un Diario dei sogni
title: Dreaming
x-i18n:
    generated_at: "2026-06-27T17:24:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 257e8095114e05f18e0ba7a6870765a6b88c80e1eedaccfa891faa231f68f01b
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming è il sistema di consolidamento della memoria in background in `memory-core`. Aiuta OpenClaw a spostare segnali forti a breve termine nella memoria duratura, mantenendo il processo spiegabile e revisionabile.

<Note>
Dreaming è **opt-in** e disabilitato per impostazione predefinita.
</Note>

## Cosa scrive Dreaming

Dreaming mantiene due tipi di output:

- **Stato macchina** in `memory/.dreams/` (archivio di richiamo, segnali di fase, checkpoint di ingestione, lock).
- **Output leggibile da persone** in `DREAMS.md` (o nel file `dreams.md` esistente) e file facoltativi di report di fase sotto `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promozione a lungo termine scrive ancora solo in `MEMORY.md`.

## Modello a fasi

Dreaming usa tre fasi cooperative:

| Fase  | Scopo                                      | Scrittura duratura |
| ----- | ------------------------------------------ | ------------------ |
| Light | Ordina e prepara materiale recente a breve termine | No                 |
| Deep  | Valuta e promuove candidati duraturi       | Sì (`MEMORY.md`)   |
| REM   | Riflette su temi e idee ricorrenti         | No                 |

Queste fasi sono dettagli interni di implementazione, non "modalità" separate configurate dall'utente.

<AccordionGroup>
  <Accordion title="Fase Light">
    La fase Light ingerisce segnali recenti di memoria giornaliera e tracce di richiamo, li deduplica e prepara righe candidate.

    - Legge dallo stato di richiamo a breve termine, dai file recenti di memoria giornaliera e dalle trascrizioni di sessione redatte quando disponibili.
    - Scrive un blocco `## Light Sleep` gestito quando l'archiviazione include output inline.
    - Registra segnali di rinforzo per il successivo ranking Deep.
    - Non scrive mai in `MEMORY.md`.

  </Accordion>
  <Accordion title="Fase Deep">
    La fase Deep decide cosa diventa memoria a lungo termine.

    - Ordina i candidati usando punteggi ponderati e soglie di accesso.
    - Richiede che `minScore`, `minRecallCount` e `minUniqueQueries` vengano superati.
    - Reidrata gli snippet dai file giornalieri live prima di scrivere, quindi gli snippet obsoleti/eliminati vengono ignorati.
    - Aggiunge le voci promosse a `MEMORY.md`.
    - Scrive un riepilogo `## Deep Sleep` in `DREAMS.md` e, facoltativamente, scrive `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
  <Accordion title="Fase REM">
    La fase REM estrae pattern e segnali riflessivi.

    - Crea riepiloghi di temi e riflessioni dalle tracce recenti a breve termine.
    - Scrive un blocco `## REM Sleep` gestito quando l'archiviazione include output inline.
    - Registra segnali di rinforzo REM usati dal ranking Deep.
    - Non scrive mai in `MEMORY.md`.

  </Accordion>
</AccordionGroup>

## Ingestione delle trascrizioni di sessione

Dreaming può ingerire trascrizioni di sessione redatte nel corpus di Dreaming. Quando le trascrizioni sono disponibili, vengono fornite alla fase Light insieme ai segnali di memoria giornaliera e alle tracce di richiamo. I contenuti personali e sensibili vengono redatti prima dell'ingestione.

## Diario dei sogni

Dreaming mantiene anche un **Diario dei sogni** narrativo in `DREAMS.md`. Dopo che ogni fase ha abbastanza materiale, `memory-core` esegue un turno di subagent in background best-effort e aggiunge una breve voce di diario. Usa il modello runtime predefinito a meno che `dreaming.model` non sia configurato. Se il modello configurato non è disponibile, il Diario dei sogni riprova una volta con il modello predefinito della sessione.

<Note>
Questo diario è destinato alla lettura umana nell'interfaccia Dreams, non è una fonte di promozione. Gli artefatti di diario/report generati da Dreaming sono esclusi dalla promozione a breve termine. Solo gli snippet di memoria fondati sono idonei alla promozione in `MEMORY.md`.
</Note>

Esiste anche una corsia di backfill storico fondato per lavori di revisione e ripristino:

<AccordionGroup>
  <Accordion title="Comandi di backfill">
    - `memory rem-harness --path ... --grounded` mostra in anteprima l'output di diario fondato da note storiche `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` scrive voci di diario fondate e reversibili in `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` prepara candidati duraturi fondati nello stesso archivio di evidenze a breve termine già usato dalla normale fase Deep.
    - `memory rem-backfill --rollback` e `--rollback-short-term` rimuovono questi artefatti di backfill preparati senza toccare le voci di diario ordinarie o il richiamo live a breve termine.

  </Accordion>
</AccordionGroup>

La Control UI espone lo stesso flusso di backfill/reset del diario, così puoi ispezionare i risultati nella scena Dreams prima di decidere se i candidati fondati meritano la promozione. La scena mostra anche una corsia fondata distinta, così puoi vedere quali voci a breve termine preparate provengono dal replay storico, quali elementi promossi sono stati guidati da contenuti fondati e cancellare solo le voci preparate esclusivamente fondate senza toccare lo stato ordinario live a breve termine.

## Segnali di ranking Deep

Il ranking Deep usa sei segnali di base ponderati più il rinforzo di fase:

| Segnale             | Peso | Descrizione                                      |
| ------------------- | ---- | ------------------------------------------------ |
| Frequenza           | 0.24 | Quanti segnali a breve termine ha accumulato la voce |
| Rilevanza           | 0.30 | Qualità media di recupero per la voce            |
| Diversità query     | 0.15 | Contesti distinti di query/giorno che l'hanno fatta emergere |
| Recenza             | 0.15 | Punteggio di freschezza con decadimento temporale |
| Consolidamento      | 0.10 | Forza della ricorrenza su più giorni             |
| Ricchezza concettuale | 0.06 | Densità di tag concettuali da snippet/percorso   |

Gli hit delle fasi Light e REM aggiungono un piccolo boost con decadimento di recenza da `memory/.dreams/phase-signals.json`.

I risultati di shadow trial possono essere sovrapposti a quel punteggio di base come segnale di revisione prima di qualsiasi scrittura duratura. Un trial utile assegna al candidato un piccolo boost limitato, un trial neutro lo mantiene differito e un trial dannoso lo marca come rifiutato per quel passaggio di scoring. Questo segnale resta solo di report: può cambiare l'ordinamento dei candidati o i metadati di revisione, ma non scrive in `MEMORY.md` né promuove il candidato da solo.

## Copertura del report di shadow trial QA

QA Lab include uno scenario solo di report per esplorare come un futuro shadow trial di Dreaming potrebbe revisionare una memoria candidata prima della promozione. Lo scenario chiede a un agent di confrontare una risposta baseline con una risposta che può usare la memoria candidata, quindi scrivere un report locale con verdetto, motivo e flag di rischio.

Questa copertura è intenzionalmente limitata alla QA. Verifica che l'artefatto di report resti separato da `MEMORY.md` e che l'agent non affermi che il candidato sia stato promosso. Non aggiunge comportamento di shadow trial in produzione né modifica il motore di promozione della fase Deep.

Il runner di shadow trial di `memory-core` mantiene lo stesso contratto solo di report per i percorsi di codice che richiedono un artefatto stabile. Accetta candidato, prompt del trial, risultato baseline, risultato candidato, verdetto, motivo, flag di rischio e riferimenti alle evidenze, quindi scrive un report con `promotion action: report-only`. I verdetti utili corrispondono a una raccomandazione `promote`, i verdetti neutri a `defer` e i verdetti dannosi a `reject`; nessuna di queste raccomandazioni scrive in `MEMORY.md` o applica la promozione della fase Deep.

## Pianificazione

Quando abilitato, `memory-core` gestisce automaticamente un job Cron per una scansione completa di Dreaming. Ogni scansione esegue le fasi in ordine: Light → REM → Deep.

La scansione include il workspace runtime primario e tutti i workspace agent configurati, deduplicati per percorso, quindi il fan-out del workspace dei subagent non esclude il `DREAMS.md` e lo stato di memoria dell'agent principale.

Comportamento della cadenza predefinita:

| Impostazione         | Predefinito      |
| -------------------- | ---------------- |
| `dreaming.frequency` | `0 3 * * *`      |
| `dreaming.model`     | modello predefinito |

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
  <Tab title="Cadenza personalizzata della scansione">
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
  <Tab title="Anteprima / applicazione della promozione">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    `memory promote` manuale usa per impostazione predefinita le soglie della fase Deep, a meno che non vengano sovrascritte con flag CLI.

  </Tab>
  <Tab title="Spiega la promozione">
    Spiega perché uno specifico candidato verrebbe o non verrebbe promosso:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Anteprima harness REM">
    Mostra in anteprima riflessioni REM, verità candidate e output di promozione Deep senza scrivere nulla:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Impostazioni predefinite principali

Tutte le impostazioni si trovano sotto `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Abilita o disabilita la scansione Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cadenza Cron per la scansione completa di Dreaming.
</ParamField>
<ParamField path="model" type="string">
  Override facoltativo del modello subagent del Diario dei sogni. Usa un valore canonico `provider/model` quando imposti anche una allowlist `allowedModels` del subagent.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  Numero massimo stimato di token mantenuti da ogni snippet di richiamo a breve termine promosso in `MEMORY.md`. La provenienza del ranking resta visibile.
</ParamField>

<Warning>
`dreaming.model` richiede `plugins.entries.memory-core.subagent.allowModelOverride: true`. Per limitarlo, imposta anche `plugins.entries.memory-core.subagent.allowedModels`. Errori di trust o allowlist restano visibili invece di ripiegare silenziosamente; il retry copre solo errori di modello non disponibile.
</Warning>

<Note>
La maggior parte delle policy di fase, delle soglie e del comportamento di archiviazione sono dettagli interni di implementazione. Consulta [Riferimento configurazione memoria](/it/reference/memory-config#dreaming) per l'elenco completo delle chiavi.
</Note>

## Interfaccia Dreams

Quando abilitata, la scheda **Dreams** del Gateway mostra:

- stato corrente di abilitazione di Dreaming
- stato a livello di fase e presenza della scansione gestita
- conteggi di breve termine, fondati, segnali e promossi oggi
- tempistica della prossima esecuzione pianificata
- una corsia Scene fondata distinta per le voci di replay storico preparate
- un lettore espandibile del Diario dei sogni basato su `doctor.memory.dreamDiary`

## Dreaming non viene mai eseguito: lo stato mostra bloccato

Se `openclaw memory status` riporta `Dreaming status: blocked`, il cron gestito esiste ma l'heartbeat dell'agent predefinito non si sta attivando. Controlla che heartbeat sia abilitato per l'agent predefinito e che il suo target non sia `none`, quindi esegui di nuovo `openclaw memory status --deep` dopo il successivo intervallo di heartbeat.

## Correlati

- [Memoria](/it/concepts/memory)
- [CLI memoria](/it/cli/memory)
- [Riferimento configurazione memoria](/it/reference/memory-config)
- [Ricerca memoria](/it/concepts/memory-search)
