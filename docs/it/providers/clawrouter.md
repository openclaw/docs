---
read_when:
    - Vuoi una sola chiave gestita per più provider di modelli
    - Ti serve il rilevamento dei modelli di ClawRouter o la segnalazione delle quote in OpenClaw
summary: Instrada i modelli con ambito credenziali attraverso ClawRouter e mostra le quote gestite
title: ClawRouter
x-i18n:
    generated_at: "2026-07-04T03:50:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 363426cc68e74f6a910f6fa956c323449ab827aee43db4320e98620245e593d2
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter offre a OpenClaw una chiave con ambito di policy per più fornitori
di modelli upstream. Il Plugin incluso rileva solo i modelli consentiti per
quella chiave, instrada ogni modello tramite il protocollo dichiarato e riporta
il budget della chiave e l'utilizzo aggregato nelle superfici di utilizzo di
OpenClaw.

Non devi installare o autenticare ogni Plugin del fornitore upstream sull'host
OpenClaw. Le credenziali upstream e l'inoltro specifico del fornitore restano in
ClawRouter. OpenClaw richiede solo il Plugin `@openclaw/clawrouter` incluso e una
credenziale ClawRouter emessa.

| Proprietà     | Valore                                   |
| ------------- | ---------------------------------------- |
| Fornitore     | `clawrouter`                             |
| Pacchetto     | `@openclaw/clawrouter`                   |
| Autenticazione | `CLAWROUTER_API_KEY`                    |
| URL predefinito | `https://clawrouter.openclaw.ai`       |
| Catalogo modelli | Con ambito credenziale tramite `/v1/catalog` |
| Quote         | Budget mensile e utilizzo tramite `/v1/usage` |

## Guida introduttiva

<Steps>
  <Step title="Ottieni una credenziale con ambito">
    Chiedi al tuo amministratore ClawRouter una credenziale la cui policy includa
    i fornitori, i modelli e il budget mensile che devi usare. Le credenziali
    vengono mostrate una sola volta quando vengono emesse.
  </Step>
  <Step title="Configura OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    Il Plugin è incluso con OpenClaw. Se la tua configurazione imposta
    `plugins.allow`, aggiungi `clawrouter` a quell'elenco prima di abilitarlo.
    Per una distribuzione personalizzata, imposta
    `models.providers.clawrouter.baseUrl` sull'origine ClawRouter; il valore
    predefinito è `https://clawrouter.openclaw.ai`.

  </Step>
  <Step title="Elenca i modelli concessi">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    Usa i riferimenti dei modelli restituiti esattamente come mostrati. Mantengono
    lo spazio dei nomi upstream, come `clawrouter/openai/...`,
    `clawrouter/anthropic/...` o `clawrouter/google/...`. Se
    `agents.defaults.models` è un elenco consentito nella tua configurazione,
    aggiungi ciascun riferimento ClawRouter selezionato.

  </Step>
  <Step title="Seleziona un modello">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    Puoi anche selezionare un modello restituito per una singola esecuzione con
    `openclaw agent --model clawrouter/<provider>/<model> --message "..."`.

  </Step>
</Steps>

## Rilevamento dei modelli

`GET /v1/catalog` è la fonte di riferimento. OpenClaw non distribuisce un secondo
elenco fisso di modelli ClawRouter. Un modello configurato in ClawRouter appare quando:

- la policy della credenziale concede il suo fornitore;
- la connessione del fornitore è abilitata e pronta;
- il modello del catalogo dichiara una funzionalità LLM supportata; e
- il catalogo espone un contratto di trasporto supportato dal Plugin.

Aggiungere un altro modello a un fornitore ClawRouter supportato quindi non
richiede una release di OpenClaw né un altro Plugin del fornitore. Il successivo
aggiornamento del catalogo lo rileva. Un modello che richiede un nuovo protocollo
wire richiede supporto nel Plugin ClawRouter prima che OpenClaw lo mostri.

## Protocollo e Plugin dei fornitori

Non devi installare il Plugin di autenticazione di ogni azienda upstream.
ClawRouter gestisce le credenziali upstream; il suo catalogo indica a OpenClaw
quale trasporto usare. Il Plugin supporta:

| Rotta del catalogo              | Trasporto OpenClaw     |
| ------------------------------- | ---------------------- |
| Chat compatibile con OpenAI     | `openai-completions`   |
| Responses compatibile con OpenAI | `openai-responses`    |
| Messages Anthropic nativo       | `anthropic-messages`   |
| Streaming Google Gemini nativo  | `google-generative-ai` |

Il Plugin applica anche le policy di replay e tool-schema corrispondenti per
quelle famiglie. Le righe del catalogo che usano un altro formato di
richiesta/stream non vengono intenzionalmente pubblicizzate come modelli di testo
OpenClaw. Normalizza quei fornitori su uno dei contratti supportati in ClawRouter
invece di inviare un payload incompatibile.

## Quote e utilizzo

La risposta `/v1/usage` di ClawRouter alimenta le normali superfici di utilizzo
dei fornitori di OpenClaw. `/status` e lo stato della dashboard correlato mostrano
la finestra del budget mensile quando la chiave ha un limite, oltre ai totali di
richieste, token e spesa. Le chiavi senza misurazione mostrano comunque
l'utilizzo aggregato senza una finestra percentuale.

La ricerca delle quote usa la stessa chiave con ambito del rilevamento dei
modelli. Un errore nella ricerca delle quote non blocca l'esecuzione del modello.

Controlla lo snapshot live con:

```bash
openclaw status --usage
openclaw models status
```

Lo stesso snapshot del fornitore è disponibile per `/status` in chat e nella UI
di utilizzo di OpenClaw. Il budget è esteso all'intera policy, quindi le richieste
effettuate da un altro client con la stessa policy ClawRouter possono modificare
la percentuale residua.

## Risoluzione dei problemi

| Sintomo                                  | Verifica                                                                                                                                       |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Nessun modello ClawRouter                | Conferma che il Plugin sia abilitato e consentito da `plugins.allow`, poi controlla che la credenziale sia attiva e conceda almeno un fornitore pronto. |
| Manca un modello ClawRouter configurato  | Ispeziona la sua funzionalità `/v1/catalog` e il formato della rotta. I contratti di trasporto non supportati vengono filtrati intenzionalmente. |
| `Unknown model: clawrouter/...`          | Aggiungi il riferimento esatto del catalogo a `agents.defaults.models` quando quella mappa di configurazione viene usata come elenco consentito. |
| `401` o `403` dal catalogo o dall'utilizzo | Emetti nuovamente o ridefinisci l'ambito della credenziale ClawRouter; OpenClaw non ripiega sulle chiavi dei fornitori upstream.                |
| La chiamata al modello fallisce dopo il rilevamento | Controlla la connessione del fornitore e lo stato upstream in ClawRouter, poi riprova dopo il ripristino del suo stato di prontezza.      |
| L'utilizzo ha totali ma nessuna percentuale | La policy non ha misurazione; aggiungi un budget mensile in ClawRouter per esporre una finestra percentuale.                                  |

## Comportamento di sicurezza

- Il rilevamento del catalogo ha l'ambito della chiave proxy configurata e viene memorizzato nella cache per chiave.
- La chiave proxy viene allegata solo al momento dell'invio della richiesta; non viene archiviata nei metadati del modello.
- Gli ID dei modelli Anthropic e Gemini nativi vengono riscritti nei rispettivi ID upstream solo al momento dell'invio.
- Le righe del catalogo non supportate o non concesse falliscono in modo chiuso e non sono selezionabili.

## Correlati

<CardGroup cols={2}>
  <Card title="Fornitori di modelli" href="/it/concepts/model-providers" icon="layers">
    Configurazione dei fornitori e selezione dei modelli.
  </Card>
  <Card title="Tracciamento dell'utilizzo" href="/it/concepts/usage-tracking" icon="chart-line">
    Superfici di utilizzo e stato di OpenClaw.
  </Card>
</CardGroup>
