---
read_when:
    - Refactoring del comportamento di invio o ricezione del canale
    - Modifica dei messaggi in ingresso dei canali, dell'invio delle risposte, della coda in uscita, dello streaming delle anteprime o delle API dei messaggi dell'SDK dei plugin
    - Progettazione di un nuovo plugin di canale che richiede invii persistenti, conferme di ricezione, anteprime, modifiche o nuovi tentativi
summary: 'Stato del ciclo di vita durevole di ricezione/invio dei messaggi: cosa è stato rilasciato, cosa è cambiato rispetto al progetto originale e cosa resta da fare'
title: Refactoring del ciclo di vita dei messaggi
x-i18n:
    generated_at: "2026-07-12T07:01:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8d65412013880618f015fbe86b7acc27d70da9232784fbda164d68868a256f4d
    source_path: concepts/message-lifecycle-refactor.md
    workflow: 16
---

<Note>
Questa pagina è nata come proposta progettuale orientata al futuro. Il nucleo di tale
progetto è stato successivamente distribuito in `src/channels/message/*` e nei sottopercorsi pubblici
`openclaw/plugin-sdk/channel-outbound` / `channel-inbound`. Per l'API
corrente, consulta [API in uscita dei canali](/it/plugins/sdk-channel-outbound) e
[API in ingresso dei canali](/it/plugins/sdk-channel-inbound). Questa pagina descrive ciò che
è stato distribuito, dove l'implementazione si è discostata dalla bozza originale e cosa
rimane ancora da completare.
</Note>

## Perché è stato effettuato questo refactoring

Lo stack dei canali è cresciuto a partire da diverse correzioni locali: helper in ingresso separati per
livello di maturità (`runtime.channel.inbound.run` per gli adattatori semplici,
`runtime.channel.inbound.runPreparedReply` per quelli avanzati), helper legacy per l'inoltro delle risposte
(`dispatchInboundReplyWithBase`, `recordInboundSessionAndDispatchReply`),
streaming dell'anteprima specifico per canale e persistenza della consegna finale aggiunta
ai percorsi esistenti dei payload di risposta. Questa struttura ha prodotto troppi concetti pubblici e
troppi punti in cui la semantica di consegna poteva divergere.

La lacuna di affidabilità che ha imposto la riprogettazione:

```text
Aggiornamento del polling di Telegram confermato
  -> il testo finale dell'assistente esiste
  -> il processo si riavvia prima che sendMessage abbia esito positivo
  -> la risposta finale viene persa
```

Invariante obiettivo: quando il core stabilisce che debba esistere un messaggio in uscita visibile,
l'intento di invio deve essere persistente prima di tentare la chiamata alla piattaforma e la
ricevuta della piattaforma deve essere registrata dopo l'esito positivo. Ciò garantisce per impostazione predefinita
il ripristino con almeno una consegna. Il comportamento con una sola consegna esiste soltanto quando un adattatore dimostra
l'idempotenza nativa o riconcilia un tentativo dall'esito ignoto dopo l'invio con
lo stato della piattaforma prima della ripetizione.

## Cosa è stato distribuito

Il dominio interno si trova in `src/channels/message/*`:

| File                        | Responsabilità                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `types.ts`                  | Contratti dei tipi per adattatore, contesto di invio, ricevuta e intento persistente                               |
| `send.ts`                   | `withDurableMessageSendContext` / `sendDurableMessageBatch` — il contesto di invio persistente                     |
| `receive.ts`                | `createMessageReceiveContext` — macchina a stati dei criteri di conferma in ingresso                              |
| `live.ts`                   | Stato dell'anteprima in tempo reale e logica di finalizzazione sul posto o ripiego                                 |
| `state.ts`                  | `classifyDurableSendRecoveryState` — classificazione del ripristino dopo un'interruzione                           |
| `receipt.ts`                | Normalizza i risultati di invio della piattaforma in `MessageReceipt`                                               |
| `capabilities.ts`           | Deriva da un payload le funzionalità finali persistenti richieste                                                   |
| `contracts.ts`              | Verifica delle prove contrattuali per le funzionalità dichiarate dell'adattatore                                   |
| `adapter.ts`                | `defineChannelMessageAdapter`                                                                                       |
| `outbound-bridge.ts`        | `createChannelMessageAdapterFromOutbound` — racchiude le funzioni legacy `sendText`/`sendMedia`/`sendPayload`/`sendPoll` |
| `ingress-queue.ts`          | `createChannelIngressQueue` — coda persistente degli eventi in ingresso                                             |
| `durable-receive.ts`        | `createDurableInboundReceiveJournal` — registro di accettazione/in sospeso/completamento/rilascio per la deduplicazione in ingresso |
| `inbound-reply-dispatch.ts` | `dispatchChannelInboundReply` e wrapper con nomi legacy                                                             |
| `reply-pipeline.ts`         | `createChannelReplyPipeline`, helper per il prefisso di risposta e le callback di digitazione                      |

Superficie pubblica: `openclaw/plugin-sdk/channel-outbound` (helper per invio/ricevuta/persistenza/tempo reale/pipeline di risposta)
e `openclaw/plugin-sdk/channel-inbound` (contesto in ingresso, `runChannelInboundEvent`,
`dispatchChannelInboundReply`). Consulta tali pagine per esempi di adattatori, nomi dei tipi correnti
e note sulla migrazione: costituiscono la fonte autorevole per la struttura
dell'API, non le bozze riportate di seguito.

### Contesto di invio

`withDurableMessageSendContext` fornisce al codice del canale i passaggi `render`, `previewUpdate`,
`send`, `edit`, `delete`, `commit` e `fail` relativi a un singolo messaggio
in uscita. `sendDurableMessageBatch` è il wrapper per il caso comune: esegue il rendering, invia,
quindi registra per `sent`/`suppressed` o segnala un errore in caso di esito negativo.

`sendDurableMessageBatch` restituisce un unico risultato discriminato:

| Stato            | Significato                                                                      |
| ---------------- | -------------------------------------------------------------------------------- |
| `sent`           | È stato consegnato almeno un messaggio visibile sulla piattaforma                 |
| `suppressed`     | Nessun messaggio della piattaforma deve essere considerato mancante (annullato da un hook, esecuzione simulata ecc.) |
| `partial_failed` | Almeno un messaggio è stato consegnato prima dell'errore di un payload o effetto collaterale successivo |
| `failed`         | Non è stata prodotta alcuna ricevuta della piattaforma                            |

La persistenza può essere `required`, `best_effort` o `disabled`
(`MessageDurabilityPolicy` in `src/channels/message/types.ts`). `required`
si interrompe in modo sicuro quando non è possibile scrivere l'intento persistente; `best_effort` ricorre
a un invio diretto quando la persistenza non è disponibile; `disabled` mantiene il
comportamento di invio diretto precedente al refactoring. Gli helper di compatibilità legacy usano per impostazione predefinita
`disabled` e non deducono `required` semplicemente perché un canale dispone di un adattatore
in uscita generico.

Il limite che rimane pericoloso è quello successivo all'esito positivo della chiamata alla piattaforma e precedente
alla registrazione della ricevuta. Se il processo termina in quel momento, il core non può sapere se il
messaggio della piattaforma esista, a meno che l'adattatore non dichiari `reconcileUnknownSend`.
Questo hook classifica un invio interrotto come `sent`, `not_sent` o
`unresolved`; solo `not_sent` consente la ripetizione. I canali privi di riconciliazione
ricorrono allo stato `unknown_after_send` (`src/channels/message/state.ts`,
`src/infra/outbound/delivery-queue-recovery.ts`) e possono scegliere la
ripetizione con almeno una consegna soltanto se i messaggi visibili duplicati rappresentano un compromesso
accettabile e documentato per quel canale.

### Contesto di ricezione

`createMessageReceiveContext` tiene traccia dello stato di conferma/rifiuto per ogni evento in ingresso, con un
`ack()` idempotente e un `nack(error)` esplicito. Il criterio di conferma
(`ChannelMessageReceiveAckPolicy`) è uno dei seguenti:

| Criterio               | Quando viene confermato                                                                      |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `after_receive_record` | Il core ha persistito metadati in ingresso sufficienti per deduplicare/instradare una nuova consegna |
| `after_agent_dispatch` | L'esecuzione dell'agente è stata inoltrata                                                     |
| `after_durable_send`   | L'invio persistente in uscita per questo turno è stato registrato                              |
| `manual`               | Il chiamante controlla esplicitamente la tempistica della conferma (impostazione predefinita per gli adattatori che non dichiarano un criterio) |

Il polling di Telegram usa questo meccanismo per persistere una filigrana degli aggiornamenti completati in sicurezza
(`safeCompletedUpdateId` in `extensions/telegram/src/bot-update-tracker.ts`):
grammY continua a osservare ogni aggiornamento quando entra nella catena del middleware, ma
OpenClaw fa avanzare la filigrana di riavvio persistita soltanto oltre gli aggiornamenti che
hanno completato l'inoltro, così quelli non riusciti o ancora in sospeso vengono ripetuti dopo un riavvio.
L'offset `getUpdates` a monte di Telegram rimane sotto il controllo di grammY; non è stata realizzata
una sorgente di polling completamente persistente che controlli la riconsegna a livello di piattaforma oltre questa
filigrana (consulta le Domande aperte).

### Anteprima in tempo reale

`src/channels/message/live.ts` modella anteprima/modifica/finalizzazione come un unico ciclo di vita:
`createLiveMessageState`, `markLiveMessagePreviewUpdated`,
`markLiveMessageFinalized`, `markLiveMessageCancelled` e
`deliverFinalizableLivePreviewAdapter` (crea una modifica finale da una bozza, la applica
e ricorre a un invio normale quando la modifica non è possibile o non riesce).
`LiveMessageState.phase` è `idle | previewing | finalizing | finalized |
cancelled`; `canFinalizeInPlace` determina se un'anteprima possa diventare il messaggio
finale tramite modifica anziché mediante un nuovo invio.

### Ricevute persistenti

`MessageReceipt` (`src/channels/message/types.ts`) normalizza uno o più
identificatori dei messaggi della piattaforma provenienti da un singolo invio logico in `platformMessageIds`, insieme
alle `parts` per ciascuna parte (tipo, indice, identificatore del thread, identificatore del messaggio a cui si risponde). Viene mantenuto un identificatore primario
per i thread e le modifiche successive. Ciò rende le consegne composte da più parti (testo
più contenuti multimediali, testo suddiviso, ripiego della scheda) ripetibili e deduplicabili dopo
un riavvio.

### Riduzione dell'SDK pubblico

Il refactoring ha assorbito o deprecato: gli helper `reply-runtime`, `reply-dispatch-runtime`,
`reply-reference`, `reply-chunking` e `reply-payload` esposti come API pubblica,
`inbound-reply-dispatch`, `channel-reply-pipeline` e la maggior parte degli utilizzi pubblici
di `outbound-runtime`. `src/plugin-sdk/channel-message.ts` è ora un barrel di riesportazione
`@deprecated` che punta a `channel-outbound` /
`channel-inbound`; gli alias di runtime `channel.turn` sono stati rimossi e la vecchia
pagina della documentazione `/plugins/sdk-channel-turn` reindirizza a
[API in ingresso dei canali](/it/plugins/sdk-channel-inbound). Il nuovo codice dei Plugin deve
utilizzare direttamente `channel-outbound` e `channel-inbound`.

## Dove l'implementazione si è discostata dal progetto originale

La bozza progettuale riportata di seguito non è mai stata distribuita esattamente come descritta. Viene conservata per
accuratezza storica; non considerare questi nomi di tipi come API corrente.

- **Nessun `MessageOrigin` / `shouldDropOpenClawEcho`.** Il piano originale prevedeva
  un tag di origine `source: "openclaw"` sui messaggi di errore del Gateway, oltre a un
  predicato condiviso che scartasse nelle stanze condivise gli echi contrassegnati e creati dal bot
  prima dell'autorizzazione `allowBots`. Tale tipo e predicato non esistono nel
  codice sorgente. `allowBots` è una vera chiave di configurazione per canale (Slack,
  Discord, Google Chat e altri), ma il meccanismo di assegnazione dei tag di origine destinato
  a proteggerla non è mai stato realizzato. La soppressione degli echi degli errori del Gateway nelle
  stanze abilitate per i bot rimane una lacuna aperta, non una garanzia distribuita.
- **Nessuno spazio dei nomi unificato `core.messages.receive/send/live/state`.** Le
  funzioni distribuite si trovano direttamente in `src/channels/message/*`
  (`withDurableMessageSendContext`, `createMessageReceiveContext`,
  `createLiveMessageState`, `classifyDurableSendRecoveryState`) anziché
  dietro una facciata `core.messages.*`.
- **Nessun tipo di messaggio normalizzato generico `ChannelMessage` / `MessageTarget` / `MessageRelation`.**
  Il core continua a passare payload di risposta concreti
  (`ReplyPayload`) e contesti specifici del canale attraverso gli adattatori di invio,
  anziché una singola struttura di messaggio indipendente dalla piattaforma con una relazione `kind: "reply" |
"followup" | "broadcast" | "system"`.
- **I nomi dei criteri di conferma differiscono dalla bozza.** Distribuiti:
  `after_receive_record | after_agent_dispatch | after_durable_send | manual`.
  La bozza originale usava `immediate | after-record | after-durable-send |
manual` con un campo relativo al motivo del timeout del Webhook; tale struttura non è stata realizzata.
- **Le chiavi di funzionalità `DurableFinalDeliveryRequirementMap` hanno sostituito l'oggetto abbozzato
  `MessageCapabilities`.** Le funzionalità sono flag booleani piatti (`text`,
  `media`, `poll`, `payload`, `silent`, `replyTo`, `thread`, `nativeQuote`,
  `messageSendingHooks`, `batch`, `reconcileUnknownSend`, `afterSendSuccess`,
  `afterCommit`) verificati tramite `verifyDurableFinalCapabilityProofs` anziché
  una struttura annidata nello stile `text.chunking` / `attachments.voice`.

## Rischi concreti della migrazione (ancora rilevanti)

Questi effetti collaterali specifici dei canali precedono il refactoring e devono continuare a
funzionare attraverso i nuovi percorsi di invio. Non sono ipotetici: ciascuno è
attualmente implementato ed essenziale per il funzionamento.

- **iMessage** (`extensions/imessage/src/monitor/echo-cache.ts`,
  `persisted-echo-cache.ts`): il monitor registra i messaggi inviati in una cache
  degli echi dopo un invio riuscito. Gli invii finali durevoli devono continuare a popolare tale
  cache, altrimenti OpenClaw può acquisire nuovamente le proprie risposte come messaggi utente in entrata.
- **Tlon** (`extensions/tlon/src/monitor/index.ts`): aggiunge una firma facoltativa del modello
  e registra le discussioni a cui si è partecipato dopo le risposte di gruppo. La consegna durevole
  non deve aggirare questi effetti.
- **Discord e gli altri dispatcher preparati** gestiscono già la consegna diretta e il
  comportamento delle anteprime. Un canale non è durevole end-to-end finché il relativo dispatcher
  preparato non instrada esplicitamente gli invii finali attraverso il contesto di invio; non presumere
  che l'adattatore generico da solo garantisca la copertura.
- **La consegna di ripiego silenziosa di Telegram** deve consegnare l'intero array di payload
  proiettati, non soltanto il primo payload, dopo la suddivisione in blocchi/proiezione
  di ripiego.
- **LINE, Zalo, Nostr** e percorsi di supporto simili possono prevedere la gestione dei token
  di risposta, l'inoltro proxy dei contenuti multimediali, cache dei messaggi inviati o destinazioni accessibili
  soltanto tramite callback. La consegna rimane di competenza del canale finché tali semantiche non sono rappresentate
  dall'adattatore di invio e coperte dai test.
- **Gli helper per i messaggi diretti** possono avere una callback di risposta che costituisce l'unica
  destinazione di trasporto corretta. L'invio generico in uscita non deve dedurre una destinazione dai campi
  grezzi della piattaforma ignorando tale callback.

## Classificazione degli errori

Gli adattatori classificano gli errori di trasporto in categorie chiuse in stile
`DeliveryFailureKind` (transitorio, limite di frequenza, autenticazione, autorizzazione, non trovato, payload
non valido, conflitto, annullato, sconosciuto). Criteri del core:

- Riprovare in caso di errori transitori e di superamento del limite di frequenza.
- Non riprovare in caso di payload non valido, salvo che esista un ripiego di rendering.
- Non riprovare in caso di errori di autenticazione o autorizzazione finché la configurazione non cambia.
- In caso di risorsa non trovata, consentire alla finalizzazione in tempo reale di passare dalla modifica a un nuovo invio quando
  il canale dichiara che tale operazione è sicura.
- In caso di conflitto, utilizzare lo stato della ricevuta/idempotenza per determinare se il messaggio
  esiste già.
- Qualsiasi errore successivo alla chiamata alla piattaforma, che potrebbe essere riuscita, ma precedente al commit
  della ricevuta diventa `unknown_after_send`, a meno che l'adattatore non dimostri che l'operazione
  sulla piattaforma non è avvenuta.

## Questioni aperte

- Se Telegram debba infine sostituire l'esecutore di polling grammY (`1.43.0`)
  con una sorgente di polling completamente durevole che controlli la riconsegna a livello di
  piattaforma, non soltanto il watermark persistente di riavvio di OpenClaw
  (`safeCompletedUpdateId`).
- Se lo stato delle anteprime in tempo reale debba risiedere nello stesso record dell'intento di invio
  finale o in un archivio correlato dello stato in tempo reale.
- Se la soppressione degli echi in caso di errore del Gateway nelle stanze condivise con bot abilitati richieda
  il meccanismo di etichettatura dell'origine inizialmente previsto, un contratto più semplice
  per canale o non rientri nell'ambito.
- Quali canali dispongano di supporto nativo per origine/metadati per la soppressione degli echi
  tra bot e quali richiedano invece un registro persistente dei messaggi in uscita.

## Correlati

- [Messaggi](/it/concepts/messages)
- [Streaming e suddivisione in blocchi](/it/concepts/streaming)
- [Bozze di avanzamento](/it/concepts/progress-drafts)
- [Criteri per i nuovi tentativi](/it/concepts/retry)
- [API di uscita dei canali](/it/plugins/sdk-channel-outbound)
- [API di ingresso dei canali](/it/plugins/sdk-channel-inbound)
