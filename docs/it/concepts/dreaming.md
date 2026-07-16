---
read_when:
    - Si desidera che la promozione della memoria venga eseguita automaticamente
    - Si desidera capire cosa fa ciascuna fase di Dreaming
    - Si desidera ottimizzare il consolidamento senza sovraccaricare MEMORY.md
sidebarTitle: Dreaming
summary: Consolidamento della memoria in background con fasi leggera, profonda e REM, oltre a un diario dei sogni
title: Dreaming
x-i18n:
    generated_at: "2026-07-16T14:14:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 501ab42cfdfa0216c308896aa8c1719b06b49d64a62afdb004e097102a376eac
    source_path: concepts/dreaming.md
    workflow: 16
---

Dreaming è il sistema di consolidamento della memoria in background in `memory-core`. Trasferisce i segnali forti dalla memoria a breve termine a quella persistente, mantenendo il processo spiegabile e verificabile.

<Note>
Dreaming è **facoltativo** e disabilitato per impostazione predefinita.
</Note>

## Cosa scrive Dreaming

- **Stato della macchina** in `memory/.dreams/` (archivio di richiamo, segnali delle fasi, checkpoint di acquisizione, blocchi).
- **Output leggibile dall'utente** in `DREAMS.md` (o in un `dreams.md` esistente) e file facoltativi dei report delle fasi in `memory/dreaming/<phase>/YYYY-MM-DD.md`.

La promozione a lungo termine continua a scrivere solo in `MEMORY.md`.

## Modello delle fasi

Dreaming esegue tre fasi cooperative per ogni ciclo, nell'ordine: leggera -> REM -> profonda. Si tratta di fasi di implementazione interne, non di modalità distinte configurate dall'utente.

| Fase     | Scopo                                           | Scrittura persistente |
| -------- | ----------------------------------------------- | --------------------- |
| Leggera  | Ordina e prepara il materiale recente a breve termine | No              |
| REM      | Riflette sui temi e sulle idee ricorrenti       | No                    |
| Profonda | Valuta e promuove i candidati persistenti       | Sì (`MEMORY.md`) |

<AccordionGroup>
  <Accordion title="Fase leggera">
    - Legge lo stato recente del richiamo a breve termine, i file di memoria giornalieri e le trascrizioni delle sessioni oscurate, quando disponibili.
    - Deduplica i segnali e prepara le righe candidate.
    - Scrive un blocco `## Light Sleep` gestito quando l'archiviazione include l'output incorporato.
    - Registra i segnali di rafforzamento per la successiva classificazione profonda.
    - Non scrive mai in `MEMORY.md`.

  </Accordion>
  <Accordion title="Fase REM">
    - Genera riepiloghi dei temi e delle riflessioni dalle tracce recenti a breve termine.
    - Scrive un blocco `## REM Sleep` gestito quando l'archiviazione include l'output incorporato.
    - Registra i segnali di rafforzamento REM utilizzati dalla classificazione profonda.
    - Non scrive mai in `MEMORY.md`.

  </Accordion>
  <Accordion title="Fase profonda">
    - Classifica i candidati mediante punteggi ponderati e soglie di ammissione (`minScore`, `minRecallCount` e `minUniqueQueries` devono essere tutti superati).
    - Ricostruisce gli estratti dai file giornalieri attivi prima della scrittura, ignorando così quelli obsoleti o eliminati.
    - Aggiunge le voci promosse a `MEMORY.md`.
    - Scrive un riepilogo `## Deep Sleep` in `DREAMS.md` e, facoltativamente, in `memory/dreaming/deep/YYYY-MM-DD.md`.

  </Accordion>
</AccordionGroup>

## Acquisizione delle trascrizioni delle sessioni

Dreaming può acquisire trascrizioni oscurate delle sessioni nel proprio corpus. Quando disponibili, le trascrizioni alimentano la fase leggera insieme ai segnali della memoria giornaliera e alle tracce di richiamo. I contenuti personali e sensibili vengono oscurati prima dell'acquisizione.

## Diario dei sogni

Dreaming conserva un **Diario dei sogni** narrativo in `DREAMS.md`. Quando ogni fase dispone di materiale sufficiente, `memory-core` esegue in background, secondo il principio del massimo impegno, un turno di un subagente e aggiunge una breve voce al diario, utilizzando il modello di runtime predefinito, a meno che non sia configurato `dreaming.model`. Se il modello configurato non è disponibile, l'esecuzione del diario viene ritentata una volta con il modello predefinito della sessione; gli errori relativi all'attendibilità o all'elenco di autorizzazione non vengono ritentati e restano visibili nei log, anziché attivare silenziosamente una voce di diario generica.

<Note>
Il diario è destinato alla lettura da parte degli utenti nell'interfaccia Sogni, non è una fonte di promozione. Gli artefatti di diario e report sono esclusi dalla promozione a breve termine; solo gli estratti di memoria basati su dati concreti possono essere promossi in `MEMORY.md`.
</Note>

È inoltre disponibile un percorso di recupero storico basato su dati concreti per le attività di revisione e ripristino:

<AccordionGroup>
  <Accordion title="Comandi di recupero">
    - `memory rem-harness --path ... --grounded` mostra un'anteprima dell'output del diario basato su dati concreti ricavato dalle note storiche `YYYY-MM-DD.md`.
    - `memory rem-backfill --path ...` scrive voci di diario reversibili e basate su dati concreti in `DREAMS.md`.
    - `memory rem-backfill --path ... --stage-short-term` prepara candidati persistenti basati su dati concreti nello stesso archivio di prove a breve termine utilizzato dalla normale fase profonda.
    - `memory rem-backfill --rollback` e `--rollback-short-term` rimuovono gli artefatti di recupero preparati senza modificare le normali voci del diario o il richiamo attivo a breve termine.

  </Accordion>
</AccordionGroup>

L'interfaccia di controllo rende disponibile lo stesso flusso di recupero e reimpostazione del diario nella scheda Memoria dell'agente (pagina Agenti), consentendo di esaminare i risultati nella scena dei sogni prima di decidere se i candidati basati su dati concreti meritino la promozione. Un percorso Scena distinto per i dati concreti mostra quali voci a breve termine preparate provengono dalla riproduzione storica e quali elementi promossi sono stati determinati da dati concreti, consentendo inoltre di eliminare soltanto le voci preparate esclusivamente sulla base di dati concreti senza modificare lo stato attivo a breve termine.

## Segnali della classificazione profonda

La classificazione profonda utilizza sei segnali di base ponderati, oltre al rafforzamento delle fasi:

| Segnale              | Peso | Descrizione                                               |
| -------------------- | ---- | --------------------------------------------------------- |
| Pertinenza           | 0.30 | Qualità media del recupero per la voce                     |
| Frequenza            | 0.24 | Numero di segnali a breve termine accumulati dalla voce    |
| Diversità delle query | 0.15 | Contesti distinti di query/giorno in cui è emersa          |
| Attualità            | 0.15 | Punteggio di freschezza con decadimento temporale          |
| Consolidamento       | 0.10 | Intensità della ricorrenza su più giorni                   |
| Ricchezza concettuale | 0.06 | Densità dei tag concettuali ricavati dall'estratto/percorso |

Le corrispondenze delle fasi leggera e REM aggiungono un piccolo incremento con decadimento temporale da `memory/.dreams/phase-signals.json`.

I risultati delle prove shadow possono sovrapporsi al punteggio di base come segnale di revisione prima di qualsiasi scrittura persistente: una prova utile assegna al candidato un piccolo incremento limitato, una prova neutra ne mantiene il rinvio e una prova dannosa lo contrassegna come rifiutato per quella valutazione. Questo segnale è destinato esclusivamente ai report: può modificare l'ordine dei candidati o i metadati di revisione, ma non scrive mai in `MEMORY.md` né promuove autonomamente un candidato.

### Copertura del report delle prove shadow di QA

QA Lab include uno scenario destinato esclusivamente ai report per esplorare in che modo una futura prova shadow di Dreaming potrebbe esaminare una memoria candidata prima della promozione: un agente confronta una risposta di riferimento con una risposta che può utilizzare la memoria candidata, quindi scrive un report locale contenente un verdetto, una motivazione e indicatori di rischio. Questa copertura è limitata alla QA: verifica che l'artefatto del report rimanga separato da `MEMORY.md` e che l'agente non affermi mai che il candidato sia stato promosso. Non aggiunge il comportamento delle prove shadow alla produzione né modifica il motore di promozione della fase profonda.

L'esecutore delle prove shadow `memory-core` mantiene lo stesso contratto destinato esclusivamente ai report per i percorsi di codice che richiedono un artefatto stabile. Accetta il candidato, il prompt della prova, l'esito di riferimento, l'esito del candidato, il verdetto, la motivazione, gli indicatori di rischio e i riferimenti alle prove, quindi scrive un report con `promotion action: report-only`. I verdetti utili corrispondono a una raccomandazione `promote`, quelli neutri a `defer` e quelli dannosi a `reject`: nessuna di queste operazioni scrive in `MEMORY.md` o applica la promozione della fase profonda.

## Pianificazione

Quando è abilitato, `memory-core` gestisce automaticamente un processo Cron per un ciclo completo di Dreaming, deduplicato tra lo spazio di lavoro principale del runtime e gli eventuali spazi di lavoro degli agenti configurati, in modo che la distribuzione tra gli spazi di lavoro dei subagenti non escluda `DREAMS.md` e lo stato della memoria dell'agente principale.

| Impostazione          | Valore predefinito |
| --------------------- | ------------------ |
| `dreaming.frequency` | `0 3 * * *`   |
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

```text
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

`/dreaming on` e `/dreaming off` richiedono lo stato di proprietario per i chiamanti del canale oppure `operator.admin` per i client Gateway. `/dreaming status` e `/dreaming help` sono di sola lettura.

## Flusso di lavoro CLI

<Tabs>
  <Tab title="Anteprima/applicazione della promozione">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    Per impostazione predefinita, il comando manuale `memory promote` utilizza le soglie della fase profonda, salvo sostituzione mediante flag della CLI.

  </Tab>
  <Tab title="Spiegazione della promozione">
    Spiega perché uno specifico candidato verrebbe o non verrebbe promosso:

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="Anteprima dell'harness REM">
    Mostra un'anteprima delle riflessioni REM, delle verità candidate e dell'output della promozione profonda senza scrivere nulla:

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## Valori predefiniti principali

Tutte le impostazioni si trovano in `plugins.entries.memory-core.config.dreaming`.

<ParamField path="enabled" type="boolean" default="false">
  Abilita o disabilita il ciclo di Dreaming.
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  Cadenza Cron per il ciclo completo di Dreaming.
</ParamField>
<ParamField path="model" type="string">
  Sostituzione facoltativa del modello del subagente del Diario dei sogni. Utilizzare un valore `provider/model` canonico quando si imposta anche un elenco di autorizzazione `allowedModels` per i subagenti.
</ParamField>
<ParamField path="phases.deep.maxPromotedSnippetTokens" type="number" default="160">
  Numero massimo stimato di token conservati da ciascun estratto di richiamo a breve termine promosso in `MEMORY.md`. La provenienza della classificazione rimane visibile.
</ParamField>

<Warning>
`dreaming.model` richiede `plugins.entries.memory-core.subagent.allowModelOverride: true`. Per limitarlo, impostare anche `plugins.entries.memory-core.subagent.allowedModels`. Il nuovo tentativo automatico riguarda soltanto gli errori di indisponibilità del modello; gli errori relativi all'attendibilità o all'elenco di autorizzazione rimangono visibili nei log anziché attivare silenziosamente un comportamento alternativo.
</Warning>

<Note>
La maggior parte dei criteri delle fasi, delle soglie e del comportamento di archiviazione costituisce un dettaglio di implementazione interno. Consultare il [riferimento per la configurazione della memoria](/it/reference/memory-config#dreaming) per l'elenco completo delle chiavi.
</Note>

## Interfaccia Sogni

Quando è abilitata, la scheda **Sogni** del Gateway mostra:

- stato corrente di abilitazione di Dreaming
- stato a livello di fase e presenza del ciclo gestito
- conteggi a breve termine, basati su dati concreti, dei segnali e degli elementi promossi oggi
- tempistica della prossima esecuzione pianificata
- un percorso Scena distinto per le voci preparate della riproduzione storica basate su dati concreti
- un lettore espandibile del Diario dei sogni basato su `doctor.memory.dreamDiary`

## Correlati

- [Memoria](/it/concepts/memory)
- [CLI della memoria](/it/cli/memory)
- [Riferimento per la configurazione della memoria](/it/reference/memory-config)
- [Ricerca nella memoria](/it/concepts/memory-search)
