---
read_when:
    - Modifica del ciclo di vita delle approvazioni di exec o dei Plugin, dell'archiviazione, del protocollo o dell'autorizzazione
    - Aggiunta di link di approvazione o controlli di approvazione nativi a un canale
    - Proiezione delle approvazioni delle sessioni figlie nelle viste padre o dell'orchestratore
summary: Progettazione di approvazioni persistenti e accessibili tramite deep link nella Control UI, nelle app native, nei canali e nelle sessioni principali
title: Approvazioni dell'operatore su più interfacce
x-i18n:
    generated_at: "2026-07-16T14:53:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9defdaada1911df1184f64429e1787c4881e735c433d6dbc30a5946e11cc7cce
    source_path: refactor/operator-approvals.md
    workflow: 16
---

# Approvazioni dell'operatore su più superfici

Questo progetto tiene traccia di [#103505](https://github.com/openclaw/openclaw/issues/103505). Sostituisce l'autorità di approvazione locale al processo con un unico ciclo di vita di proprietà del Gateway e supportato da SQLite. Ogni approvazione di esecuzione o di plugin/strumento di proprietà del Gateway riceve un ID stabile, un'unica route autenticata della Control UI, una risoluzione atomica in cui prevale la prima risposta e proiezioni riservate agli operatori verso i flussi della sessione di origine e delle sessioni antenate.

Le azioni inline e i deep link coesistono. Non è presente alcun selettore della modalità di approvazione.

## Obiettivi

- Un unico oggetto di approvazione persistente per i gate di esecuzione e di plugin/strumenti.
- Route `${controlUiBasePath}/approve/{approvalId}` stabile.
- Risoluzione da qualsiasi Control UI, app nativa o superficie di canale autorizzata.
- Comportamento atomico in cui prevale la prima risposta tra superfici concorrenti.
- Tentativi identici idempotenti; risposte tardive in conflitto non possono sovrascrivere quella vincente.
- Timeout, verdetti attendibili non validi, route mancanti, annullamento e riavvio causano una chiusura in sicurezza.
- Gli eventi di richiesta e terminali raggiungono la sessione di origine e tutti i proprietari padre/orchestratore pertinenti.
- I canali ricevono azioni tipizzate di approvazione e navigazione; i dati di callback del trasporto restano privati del canale.
- I metodi Gateway esistenti per esecuzione/plugin restano compatibili mentre la loro implementazione converge su un unico servizio.

## Non obiettivi

- Persistenza o ripresa dell'esecuzione bloccata dello strumento dopo il riavvio del Gateway.
- Trasformazione di un ID o URL di approvazione in una credenziale bearer.
- Aggiunta delle richieste di approvazione alle trascrizioni visibili al modello o riattivazione degli agenti padre.
- Spostamento della policy di approvazione, dei comandi del prodotto o dell'autorizzazione dei revisori nei plugin di canale.
- Clonazione dello stato di approvazione per canale, dispositivo o antenato.
- Riprogettazione delle allowlist di esecuzione, della composizione delle policy dei plugin o della persistenza di `allow-always`, salvo quanto necessario per rendere inequivocabili gli esiti terminali.
- Rendere raggiungibile da remoto, nel primo incremento, una TUI incorporata senza Gateway. Resta solo locale e deve chiudersi in sicurezza quando non è disponibile alcun revisore.

## Baseline precedente al rollout e mappa delle evidenze

Questa tabella registra lo stato dell'implementazione al momento dell'apertura di #103505. Le sezioni sul rollout riportate di seguito descrivono il registro persistente, le azioni tipizzate, la pagina dei deep link e gli incrementi dei client nativi costruiti su tale baseline.

| Superficie           | Punto di ingresso e proprietario nella baseline                                                                                                                                  | Comportamento e lacuna nella baseline                                                                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Esecuzione dell'agente        | `src/agents/bash-tools.exec-approval-request.ts`, `src/agents/bash-tools.exec-host-shared.ts`                                                                   | La registrazione in due fasi `exec.approval.*` impedisce una race condition anticipata di `/approve`, ma il timeout può ancora diventare un'autorizzazione tramite `askFallback`.                                                        |
| Gate dello strumento del plugin  | `src/agents/agent-tools.before-tool-call.ts`                                                                                                                    | Richiede `plugin.approval.*`; `timeoutBehavior: "allow"` può approvare un gate scaduto. La modalità incorporata dispone di un'autorità separata locale al processo in `src/infra/embedded-plugin-approval-broker.ts`. |
| Gate del Node del plugin  | `src/gateway/node-invoke-plugin-policy.ts`                                                                                                                      | Crea e trasmette direttamente tramite il gestore dei plugin, duplicando parte del ciclo di vita del metodo del server.                                                                                 |
| Autorità del Gateway | `src/gateway/server-aux-handlers.ts`, `src/gateway/exec-approval-manager.ts`, `src/gateway/server-methods/approval-shared.ts`                                   | Gestori separati per esecuzione e plugin utilizzano mappe locali al processo. Le voci terminali persistono per 15 secondi. La regola secondo cui prevale la prima risposta vale solo all'interno di un singolo processo.                                          |
| Protocollo del Gateway  | `packages/gateway-protocol/src/schema/exec-approvals.ts`, `packages/gateway-protocol/src/schema/plugin-approvals.ts`, `src/gateway/methods/core-descriptors.ts` | L'esecuzione dispone di `get` solo per gli elementi in sospeso; il plugin non dispone di `get`; non esiste una ricerca terminale indipendente dal tipo per un deep link.                                                                                   |
| Recapito          | `src/infra/exec-approval-channel-runtime.ts`, `src/infra/approval-native-runtime.ts`, `src/infra/approval-handler-runtime.ts`                                   | Supporta l'instradamento all'origine, i messaggi diretti agli approvatori, la riproduzione degli elementi in sospeso, i gestori nativi e la pulizia terminale nel processo. Un intervento successivo separato aggiunge la riconciliazione terminale persistente.                          |
| Azioni portabili  | `src/interactive/payload.ts`, `src/plugin-sdk/interactive-runtime.ts`, `src/plugin-sdk/approval-reply-runtime.ts`                                               | I pulsanti di approvazione sono azioni di comando contenenti `/approve ...`; le destinazioni URL e Web App sono campi dei pulsanti non tipizzati.                                                                           |
| Telegram          | `extensions/telegram/src/approval-handler.runtime.ts`, `extensions/telegram/src/button-types.ts`                                                                | Il renderer analizza il testo del comando per riconoscere la semantica dell'approvazione prima di produrre dati di callback privati.                                                                                     |
| Control UI        | `ui/src/app/exec-approval.ts`, `ui/src/app/overlays.ts`, `ui/src/components/exec-approval.ts`                                                                   | L'interfaccia di approvazione è una finestra modale globale. `ui/src/app-route-paths.ts` e `ui/src/app-routes.ts` utilizzano route esatte e riscrivono i percorsi sconosciuti in Chat.                                                    |
| Proprietà della sessione | `src/agents/subagent-registry.types.ts`, `src/agents/subagent-registry-read.ts`, `src/config/sessions/types.ts`                                                 | Esistono la proprietà del controller, del richiedente, del padre esplicito e della generazione legacy, ma gli eventi di approvazione non vengono proiettati nei flussi di tali sessioni.                                                    |
| Stato condiviso      | `src/state/openclaw-state-schema.sql`, `src/state/openclaw-state-db.ts`                                                                                         | Le transazioni immediate esistenti e gli aggiornamenti condizionali di Kysely supportano un'operazione compare-and-set persistente in `state/openclaw.sqlite`.                                                                   |

I test attuali rappresentativi includono `src/gateway/exec-approval-manager.test.ts`, `src/gateway/server-methods/approval-shared.test.ts`, `src/agents/bash-tools.exec-gateway-approval.e2e.test.ts`, `extensions/telegram/src/approval-handler.runtime.test.ts` e `ui/src/e2e/approval-flow.e2e.test.ts`.

L'SDK dei plugin resta l'unico confine per canali/plugin. Le modifiche al runtime e alla presentazione delle approvazioni devono essere esportate tramite i sottopercorsi esistenti `src/plugin-sdk/approval-*.ts` e `src/plugin-sdk/interactive-runtime.ts`; il codice di produzione dei plugin non deve importare componenti interni del Gateway.

## Soluzioni precedenti

Omnigent offre semantiche utili per l'esperienza utente e gli errori:

- [`approval.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/runtime/policies/approval.py) mette ASK in attesa, applica timeout per policy e considera approvazione solo un'accettazione esatta.
- [`sessions.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/routes/sessions.py) contiene il gate dell'harness nativo lato server e la proiezione di richieste/risoluzioni sugli antenati.
- [`ApprovePage.tsx`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/web/src/pages/ApprovePage.tsx) fornisce la pagina autonoma di approvazione per dispositivi mobili.

Non copiarne acriticamente l'affermazione sull'archiviazione. Lo stato attivo attualmente in sospeso è locale al processo in [`_elicitation_registry.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/_elicitation_registry.py) e la tabella degli elementi in sospeso inutilizzata viene rimossa da [`e3b1f2a4c9d7_drop_pending_tool_calls_table.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/db/migrations/versions/e3b1f2a4c9d7_drop_pending_tool_calls_table.py). OpenClaw va deliberatamente oltre: SQLite è autorevole e ogni transizione terminale è un'operazione compare-and-set sul database.

## Architettura e proprietà

Il Gateway possiede il ciclo di vita:

1. Un agente, un hook del plugin o una policy del Node fornisce una richiesta specifica del tipo e un'associazione dell'esecuzione locale al processo.
2. Il Gateway la convalida e crea una proiezione sanitizzata per il revisore.
3. Il servizio di approvazione calcola il pubblico di origine/proprietari, inserisce la riga canonica e quindi registra l'attesa nel processo.
4. Dopo l'inserimento persistente, il Gateway pubblica gli eventi di approvazione esistenti, le proiezioni delle sessioni, le notifiche dei canali e le notifiche push native.
5. Ogni superficie esegue la risoluzione tramite lo stesso servizio.
6. Il servizio esegue il commit di una transizione terminale, riattiva l'attesa del runtime e pubblica le proiezioni terminali.
7. Un errore nel recapito degli eventi non annulla mai la decisione di cui è stato eseguito il commit; i client eseguono il recupero tramite `approval.get` o la riproduzione dell'elenco.

Confini di proprietà:

- `src/gateway/`: servizio di approvazione, autorizzazione, adattatori RPC, costruzione degli URL, ciclo di vita dell'attesa e pubblicazione degli eventi.
- `src/state/`: schema condiviso e tipi Kysely generati.
- `src/infra/`: modelli di visualizzazione sanitizzati delle approvazioni e costruzione della presentazione portabile.
- `src/agents/`: richiede, attende e applica il verdetto restituito; nessuna persistenza.
- `src/channels/` e `extensions/*`: eseguono il rendering delle azioni tipizzate, autorizzano gli utenti dei canali, codificano i callback privati e aggiornano i controlli recapitati.
- `src/plugin-sdk/`: solo contratti pubblici di approvazione e presentazione.
- `ui/`: pagina autonoma e client esistenti per coda/finestra modale.

L'attesa nel processo è un meccanismo di notifica, non un'autorità. La registrazione inserisce la riga e installa l'attesa in modo sincrono prima di pubblicare la richiesta, pertanto un risolutore non può inserirsi tra questi passaggi. Ogni risolutore successivo esegue il commit tramite SQLite prima di completare tale attesa.

## Record persistente

Aggiungere una tabella `operator_approvals` al database dello stato condiviso.

| Colonna                                             | Scopo                                                                                                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval_id`                                      | ID canonico univoco a livello globale. Mantenere gli ID exec esistenti e gli ID `plugin:` per la compatibilità del protocollo, ma non dedurre mai il tipo dal prefisso.      |
| `resolution_ref`                                   | Localizzatore base64url SHA-256 completo e univoco per i callback di trasporto che non possono contenere l'ID canonico. Non costituisce un'autorizzazione né un ID URL pubblico. |
| `kind`                                             | Discriminatore `exec \| plugin` chiuso.                                                                                                        |
| `status`                                           | Stato `pending \| allowed \| denied \| expired \| cancelled` chiuso.                                                                          |
| `presentation_json`                                | Proiezione per il revisore convalidata e contrassegnata per tipo. Le richieste di runtime non elaborate, le associazioni dei comandi e i payload dei callback rimangono locali al processo.               |
| `source_agent_id`, `source_session_key`            | Identità di origine e ancoraggio della proiezione della sessione. La chiave di sessione è persistente; l'UUID di sessione a rotazione non lo è.                                          |
| `audience_session_keys_json`                       | Array JSON ordinato e privo di duplicati, prodotto dall'esplorazione limitata in ampiezza della proprietà. Gli eventi richiesti e terminali utilizzano la stessa istantanea. |
| `requested_by_device_id`, `requested_by_client_id` | Metadati persistenti del richiedente e di audit. L'ID connessione rimane in memoria e non è un principal valido tra superfici diverse.                                         |
| `reviewer_device_ids_json`                         | Dispositivi facoltativi del revisore, esplicitamente selezionati e forniti esclusivamente dal runtime di approvazione attendibile.                                                  |
| `runtime_epoch`                                    | Epoca del processo proprietario dell'esecuzione sospesa; utilizzata per annullare le righe orfane dopo il riavvio.                                                     |
| `created_at_ms`, `expires_at_ms`, `updated_at_ms`  | Temporizzazione autorevole.                                                                                                                         |
| `decision`                                         | Decisione esplicita dell'utente, se presente.                                                                                                       |
| `terminal_reason`                                  | Motivo chiuso, ad esempio `user`, `timeout`, `malformed-verdict`, `no-route`, `run-aborted` o `gateway-restart`.                                |
| `resolved_at_ms`, `resolver_kind`, `resolver_id`   | Identità del vincitore e di audit conservata sul server. Le proiezioni del revisore omettono gli identificatori non elaborati del risolutore.                                           |
| `consumed_at_ms`, `consumed_by`                    | Protezione separata dalla ripetizione per `allow-once`; il consumo non deve cancellare la decisione registrata.                                                       |

Indici richiesti:

| Indice                                      | Scopo                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| unique `(resolution_ref)`                  | Rifiuta durante l'inserimento l'ambiguità tra colonne `approval_id`/`resolution_ref`. |
| `(status, expires_at_ms)`                  | Trova le approvazioni in sospeso e riconcilia le scadenze autorevoli.               |
| `(source_session_key, created_at_ms DESC)` | Riproduce le approvazioni recenti per una sessione di origine.                             |
| `(resolved_at_ms)`                         | Elimina le approvazioni terminali conservate in base alla politica di conservazione fissa.  |

Gli array dei destinatari sono piccoli e limitati. La riproduzione filtrata per sessione seleziona prima tramite Kysely le righe in sospeso visibili, quindi decodifica e filtra gli array limitati dei destinatari nel codice dell'applicazione; non utilizza la corrispondenza di stringhe né query JSON SQL non elaborate.

Conservare le righe terminali per 30 giorni, in linea con la conservazione dei metadati di audit in `src/audit/audit-event-store.ts`. L'eliminazione è una politica di manutenzione fissa, non una nuova superficie di configurazione. Il database è uno stato privato locale del piano di controllo, ma le API del revisore non devono mai esporre l'intera richiesta memorizzata o l'associazione di runtime.

## Macchina a stati e confronto e impostazione

Sono valide solo le seguenti transizioni:

- `pending -> allowed`: `allow-once` o `allow-always` esplicito.
- `pending -> denied`: rifiuto esplicito, verdetto terminale attendibile ma non valido oppure assenza di un percorso di consegna.
- `pending -> expired`: raggiungimento della scadenza autorevole.
- `pending -> cancelled`: interruzione dell'esecuzione, arresto controllato o recupero degli elementi orfani dopo il riavvio.

Ogni stato terminale non consentito ha come verdetto effettivo il rifiuto.

La risoluzione utilizza una singola transazione SQLite immediata e un aggiornamento condizionale Kysely equivalente a:

```sql
UPDATE operator_approvals
SET status = ?, decision = ?, terminal_reason = ?, resolved_at_ms = ?
WHERE approval_id = ?
  AND status = 'pending'
  AND expires_at_ms > ?;
```

Se l'aggiornamento non interessa alcuna riga, la stessa transazione legge il record:

- Mancante o non autorizzato: restituisce non trovato; non ne rivela l'esistenza.
- Ancora in sospeso, ma la scadenza è stata raggiunta: lo imposta tramite confronto e impostazione su `expired`, quindi restituisce tale riga terminale.
- Stessa decisione registrata: restituisce un esito positivo idempotente con il vincitore registrato.
- Decisione diversa: l'API unificata restituisce `applied: false` con il vincitore registrato; gli adattatori legacy mantengono `APPROVAL_ALREADY_RESOLVED` ove richiesto dal contratto distribuito.
- Qualsiasi stato terminale: non lo modifica mai.

`now == expires_at_ms` è scaduto. L'ora del Gateway è autorevole.

L'esecuzione di `allow-once` utilizza un secondo confronto e impostazione su `consumed_at_ms IS NULL`, associato al contesto esatto esistente del comando o dell'esecuzione di sistema. La riga di approvazione rimane un record di audit dopo il consumo.

L'input HTTP/RPC non valido che non può essere autenticato o identificare un'approvazione viene rifiutato senza modifiche e non può mai approvare. Un verdetto terminale non valido ricevuto da un harness/waiter attendibile per un'approvazione nota determina la transizione a `denied`.

## API del Gateway

Aggiungere metodi per il revisore indipendenti dal tipo:

| Metodo                                    | Contratto                                                                                                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval.get { id }`                     | Restituisce una proiezione visibile in sospeso o terminale conservata.                                                                                                                                                          |
| `approval.resolve { id, kind, decision }` | Accetta l'ID canonico o il riferimento di trasporto di dimensione fissa, quindi esegue l'autorizzazione, la convalida del tipo e delle decisioni consentite, la riconciliazione della scadenza e il confronto e impostazione terminale. La risposta contiene sempre l'ID canonico. |

Dopo un confronto e impostazione riuscito, restituire immediatamente la proiezione confermata. Gli eventi legacy, gli inoltratori dei canali e i finalizzatori push sono operazioni successive di tipo best-effort; una superficie lenta o non riuscita non deve ritardare né annullare la risposta vincente.

La convalida delle richieste specifica per tipo rimane in `exec.approval.request` e `plugin.approval.request`. Gli esistenti `exec.approval.get/list/waitDecision/resolve` e `plugin.approval.list/waitDecision/resolve` diventano adattatori al confine del protocollo verso il servizio canonico, poiché fanno parte dell'API Gateway distribuita. I chiamanti interni migrano al servizio nella stessa modifica.

La proiezione per il revisore è un'unione discriminata:

```ts
type OperatorApproval = {
  id: string;
  status: OperatorApprovalStatus;
  presentation:
    | { kind: "exec"; commandText: string /* anteprima exec sicura */ }
    | { kind: "plugin"; title: string; description: string /* anteprima sicura del plugin */ };
  // campi comuni del ciclo di vita
};
```

Il percorso stabile è derivato, non persistente. `approval.get` restituisce `urlPath`; le superfici che conoscono un'origine pubblica approvata possono anche ricevere un `url` assoluto. Le istantanee del revisore omettono le chiavi di sessione dell'origine e dei destinatari. Il Gateway conserva tali chiavi di instradamento sul server per la proiezione separata `session.approval`.

## Eventi e azioni portabili

La PR 1 conserva i nomi degli eventi, i payload e i filtri dei destinatari a livello di record già distribuiti:

- `exec.approval.requested`
- `exec.approval.resolved`
- `plugin.approval.requested`
- `plugin.approval.resolved`

Questi eventi legacy possono contenere l'intera richiesta di runtime, quindi non devono essere distribuiti a ogni client con ambito di approvazione. La PR 5 aggiunge campi del ciclo di vita discriminati (`status`, `sourceSessionKey`, `urlPath`, metadati terminali e un `kind` a livello di presentazione) tramite la proiezione sanificata del ciclo di vita, anziché ampliare la distribuzione degli eventi legacy.

Aggiungere un evento di proiezione `session.approval` con ambito di approvazione. Pubblicare una sola volta l'evento canonico con le chiavi persistenti dei destinatari; gli abbonati alla sessione esatta ricevono lo stesso evento per ogni chiave corrispondente:

- `sessionKey`: flusso che riceve la proiezione.
- `sourceSessionKey`: elemento figlio/origine che ha attivato il controllo.
- `phase`: `pending \| terminal`, discriminato in base allo stato dell'approvazione.
- una proiezione `OperatorApproval` sicura.

I client aderiscono tramite `sessions.messages.subscribe { key, agentId?, includeApprovals: true }`. La risposta positiva aggiunge un `approvalReplay` contenente fino a 1.000 approvazioni attualmente in sospeso per quella chiave di flusso esatta, per le quali il client abbonato è inoltre autorizzato alla revisione a livello di record. `truncated: false` rende autorevole la riproduzione filtrata e i client che si riconnettono sostituiscono con essa il proprio insieme locale di elementi in sospeso; `truncated: true` è un segnale di sovraccarico e i client devono conservare le voci locali non ancora visualizzate finché la ricerca canonica o eventi successivi del ciclo di vita non le risolvono. Un timeout persistente rilevato successivamente durante la riproduzione emette marcatori terminali di eliminazione solo verso destinatari abbonati e autorizzati a livello di record, prima che venga restituita la nuova istantanea. `operator.admin` può aderire direttamente; i client con ambito più ristretto richiedono sia un'identità di dispositivo associata sia `operator.approvals`. Il solo abbonamento alla sessione non concede mai la visibilità delle approvazioni.

Registrare l'evento sotto `operator.approvals` in `src/gateway/server-broadcast.ts`. La proiezione è osservativa: non aggiunge mai righe alla trascrizione, non emette `sessions.changed` e non riattiva un agente.

Estendere `MessagePresentationAction` in `src/interactive/payload.ts`:

```ts
type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string }
  | {
      type: "approval";
      approvalId: string;
      approvalKind: "exec" | "plugin";
      decision: ExecApprovalDecision;
    }
  | { type: "url"; url: string }
  | { type: "web-app"; url: string };
```

Il core crea azioni decisionali tipizzate e un collegamento separato per la revisione quando è disponibile un’origine assoluta approvata della Control UI. I canali codificano un’azione di approvazione nel proprio formato di callback e inviano la risoluzione al servizio canonico. Una callback usa l’ID canonico esatto quando vi rientra; altrimenti usa il digest completo univoco della riga `resolution_ref`. Il riferimento è soltanto una chiave di ricerca compatta: continuano ad applicarsi la normale autenticazione del Gateway, l’autorizzazione del record, il tipo esplicito, la convalida delle decisioni consentite, la riconciliazione della scadenza e la CAS della prima risposta. I canali non devono troncare gli ID, risolvere prefissi hash, analizzare il testo `/approve` né dedurre il tipo da un prefisso dell’ID.

Mantenere `button.url`, `button.webApp` e i controlli di approvazione basati su comandi come input di compatibilità deprecati dell’SDK dei plugin. Normalizzarli al confine dell’SDK; migrare ogni chiamante interno incluso nello stesso PR. `/approve {id} {decision}` rimane un ripiego testuale e un comando CLI/chat, non il contratto semantico del pulsante.

## Control UI

La route è `${basePath}/approve/{approvalId}`. L’ID è l’unico parametro del percorso; l’identità della sessione di origine proviene dal record.

Poiché il router attuale dispone di route statiche esatte e riscrive i percorsi sconosciuti verso la chat, rilevare questo deep link in `ui/src/app/bootstrap.ts` prima della normale normalizzazione delle route. Riutilizzare la normale configurazione di Gateway/autenticazione, ma visualizzare una pagina di approvazione autonoma al di fuori della shell della barra laterale e della finestra modale globale.

Il documento appartiene al Gateway che ne ha fornito l’URL. La connessione iniziale ignora la selezione persistente del Gateway remoto dell’applicazione completa senza modificare né copiare le impostazioni di tale selezione; soltanto l’autenticazione rimane limitata alla sessione del Gateway che fornisce il documento. L’autenticazione nativa attendibile o un override `gatewayUrl` confermato separatamente può reindirizzarla. Il core riserva lo spazio dei nomi a segmento singolo `/approve` prima delle route HTTP dei plugin e del rilevamento delle estensioni statiche, inclusi gli ID che terminano con `.json` o `.js`; quando la pubblicazione della Control UI è disabilitata, la route riservata nega l’accesso in modo sicuro con `404`. Mantenere la pagina nel bundle principale della Control UI, affinché il mancato caricamento di un chunk differito non lasci una decisione di sicurezza bloccata su un indicatore di caricamento.

Stati della pagina:

- caricamento
- autenticazione richiesta
- in attesa
- risoluzione in corso
- approvata o negata qui
- risolta altrove
- scaduta
- annullata
- operazione vietata/non trovata
- errore di connessione con nuovo tentativo

La pagina chiama l’RPC del Gateway, non una seconda API REST non autenticata. Un aggiornamento del browser rilegge lo stato persistente. Non inserisce mai le credenziali del Gateway nell’URL, nella query o nel frammento.

## Autorizzazione e privacy

L’URL è un localizzatore, non un’autorità. La risoluzione richiede:

1. connessione autenticata al Gateway;
2. `operator.approvals` o `operator.admin`;
3. autorizzazione del revisore a livello di record.

Regole a livello di record:

- `operator.admin` può eseguire la revisione.
- `reviewer_device_ids` è vincolante quando presente. Soltanto un dispositivo
  `operator.approvals` associato e incluso nell’elenco può eseguire la revisione; il dispositivo richiedente non dispone di alcun accesso
  implicito, a meno che non sia anch’esso incluso nell’elenco.
- In assenza di un elenco esplicito di revisori, il dispositivo
  `operator.approvals` associato e richiedente può eseguire la revisione del proprio record.
- I record realmente legacy privi di associazione al richiedente o al revisore mantengono un’ampia
  visibilità per i dispositivi associati, affinché gli aggiornamenti non lascino bloccato il lavoro già in attesa.
- I runtime interni senza dispositivo possono risolvere, ma non leggere, tramite la connessione
  del runtime di approvazione con ambito limitato. Tale autorità proviene esclusivamente dal token del runtime
  autenticato dal server; i campi pubblici `approval.resolve` non possono
  generarla.
- La titolarità della connessione attiva del richiedente rimane valida per gli adattatori legacy; non viene
  mai dedotta dalla corrispondenza del nome del client.
- L’appartenenza al pubblico modifica soltanto la presentazione. Non amplia mai l’autorizzazione.

`approval.get` espone soltanto la proiezione sanificata per il revisore e omette le chiavi interne di instradamento dell’origine e del pubblico. L’evento `session.approval` del PR 5 contiene la propria destinazione univoca `sessionKey` più `sourceSessionKey` dopo che il Gateway ha applicato lato server lo snapshot persistente del pubblico. Gli eventi exec/plugin esistenti mantengono il payload storico e i destinatari limitati finché i consumatori non vengono migrati. La richiesta eseguibile, l’associazione del comando e la continuazione rimangono soltanto nell’attesa locale al processo. La riga persistente contiene la presentazione sicura insieme ai metadati del ciclo di vita, di instradamento e di audit; non memorizza mai valori di ambiente grezzi, credenziali, intestazioni di autenticazione o dati di callback del canale.

## Proiezione del pubblico

Calcolare il pubblico una sola volta prima dell’inserimento e rendere persistente lo snapshot ordinato. La titolarità è un grafo, non sempre una singola catena gerarchica: un elemento figlio può avere sia un controller corrente sia un richiedente originale e tali titolari possono condurre a radici differenti.

Usare un attraversamento deterministico in ampiezza:

1. Inizializzare la coda con la chiave della sessione di origine.
2. Per ogni chiave estratta dalla coda, leggere la riga più recente del registro dei subagenti e accodare entrambi gli archi di titolarità distinti in ordine fisso: `controllerSessionKey`, quindi `requesterSessionKey`.
3. Quando esiste una riga di registro utilizzabile, non seguire anche la discendenza della voce di sessione, che potrebbe essere obsoleta dopo il reindirizzamento. Altrimenti accodare il singolo arco di ripiego corrente `parentSessionKey ?? spawnedBy`.
4. Normalizzare e rimuovere i duplicati durante l’accodamento, affinché prevalga il primo percorso, cioè quello più breve.
5. Arrestarsi a 64 chiavi univoche; questo limite alle dimensioni del pubblico limita anche la profondità dell’attraversamento.

L’origine del registro è `src/agents/subagent-registry-read.ts`; i campi di titolarità sono definiti in `src/agents/subagent-registry.types.ts`. I campi di ripiego della sessione sono definiti in `src/config/sessions/types.ts`.

Le proiezioni della richiesta e dello stato terminale usano lo stesso pubblico persistente, anche se il focus o la titolarità del controller cambiano mentre l’approvazione è in attesa. Ciò garantisce la pulizia terminale per ogni flusso di sessione del pubblico che ha ricevuto la proiezione della richiesta. La risoluzione fa sempre riferimento all’ID di approvazione di origine; le sessioni del pubblico non ricevono mai uno stato di approvazione clonato. La pulizia dei messaggi di canale inoltrati rimane l’attività successiva separata basata sul localizzatore di consegna descritta di seguito.

Non scrivere messaggi nella trascrizione, inserire prompt di sistema, avviare turni del titolare o emettere `sessions.changed` esclusivamente per un’approvazione.

## Convergenza delle superfici di consegna

I gestori nativi delle approvazioni conservano già le voci dei messaggi consegnati abbastanza a lungo da sostituire o ritirare i controlli attivi. Attualmente i messaggi di approvazione generici inoltrati eliminano `MessageReceipt`, pertanto una decisione presa su un’altra superficie può lasciare i vecchi controlli apparentemente in attesa. Un’attività successiva separata colma questa lacuna mediante una tabella figlia `operator_approval_deliveries` nel database di stato condiviso.

Ogni riga memorizza l’ID dell’approvazione, un ID di consegna univoco, il canale/account/percorso esatto, un localizzatore privato del canale per il messaggio, limitato e convalidato come JSON, i timestamp di consegna e lo stato di finalizzazione. Non memorizza mai dati di callback, token decisionali o richieste di approvazione grezze. Il canale gestisce la codifica del localizzatore e la modifica del messaggio; il core gestisce lo stato canonico, la selezione della destinazione, la politica dei nuovi tentativi e il testo terminale di ripiego.

La registrazione della consegna e la risoluzione terminale gestiscono correttamente le condizioni di competizione:

1. Dopo che l’invio in attesa restituisce la propria ricevuta, inserire il localizzatore di consegna e leggere lo stato dell’approvazione padre in un’unica transazione.
2. Se l’elemento padre è già terminale, pianificare la finalizzazione immediata anziché lasciare in attesa la consegna tardiva.
3. Ogni transizione terminale confermata pianifica separatamente tutte le righe di consegna non finalizzate; i broadcast eliminabili non costituiscono il trigger.
4. Un finalizzatore terminale del canale restituisce `replaced`, `retired` o `unsupported`. Lo stato di sostituzione evita un messaggio terminale duplicato; lo stato di ritiro invia il follow-up terminale esistente; la mancata compatibilità o un errore attivano il ripiego senza annullare la CAS dell’approvazione.
5. All’avvio vengono ritentate le approvazioni terminali con consegne incomplete, rendendo la pulizia resiliente al riavvio del Gateway.

Questo ciclo di vita del trasporto è un hook facoltativo dell’adattatore di consegna, non un renderer né un’azione di messaggistica destinata al modello. Attualmente i messaggi QQ C2C/di gruppo non dispongono di API per la modifica, l’eliminazione o la cancellazione della tastiera; tale adattatore rimane non supportato e può mostrare lo stato canonico soltanto dopo un clic successivo, finché il trasporto non disporrà di un’API di modifica.

## Semantica di riavvio, timeout e route

La persistenza SQLite non implica la ripresa dell’esecuzione. Le associazioni di comandi/strumenti rimangono in memoria perché possono contenere informazioni di runtime sensibili per la sicurezza e non costituiscono un contratto per attività ripristinabili.

All’avvio del Gateway:

- generare una nuova epoca del runtime;
- portare atomicamente le righe in attesa appartenenti a epoche precedenti allo stato `cancelled` con motivo `gateway-restart`;
- conservare le righe affinché i relativi URL spieghino l’accaduto;
- non eseguire mai un’approvazione successiva in assenza dell’associazione del runtime.

I timer sono ottimizzazioni del risveglio. L’autorità sulla scadenza è memorizzata in `expires_at_ms`; letture, attese e risoluzioni eseguono tutte la riconciliazione della scadenza.

Comportamento rigoroso finale:

- timeout -> `expired`, negare;
- nessuna route -> `denied`, negare;
- interruzione dell’esecuzione -> `cancelled`, negare;
- verdetto attendibile non valido -> `denied`, negare;
- soltanto una decisione esplicita di autorizzazione consentita -> `allowed`.

Il comportamento exec attualmente distribuito è ancora in conflitto con questo contratto:

- `src/agents/bash-tools.exec-host-shared.ts` può applicare `askFallback`.
- `docs/tools/exec-approvals.md` e `docs/cli/approvals.md` documentano tale superficie.

Le approvazioni dei plugin ora negano l’accesso in modo sicuro in caso di timeout e verdetti non validi; il campo legacy
`timeoutBehavior` rimane accettato ma viene ignorato. L’attività successiva relativa alla semantica rigorosa di exec
deve aggiornare insieme codice, tipi, documentazione, test e changelog, con
una revisione esplicita del titolare e della sicurezza. `askFallback` può continuare a descrivere
la selezione della politica precedente al gate durante la migrazione, ma non deve trasformare in approvazione
il timeout di un record in attesa già creato.

## Piano di compatibilità

- Protocollo Gateway additivo; nessun incremento della versione del protocollo.
- Mantenere i metodi e gli eventi exec/plugin esistenti al confine esterno.
- Mantenere gli ID esistenti, inclusi i prefissi `plugin:`, ma smettere di usare i prefissi come informazioni sul tipo.
- Mantenere il comportamento del comando testuale `/approve`.
- Mantenere i campi URL/Web App dei pulsanti legacy e le azioni dei comandi come input di compatibilità dell’SDK dei plugin; il nuovo output del core è tipizzato.
- Migrare tutti i canali inclusi e i chiamanti interni nella stessa modifica delle azioni tipizzate.
- Aggiungere una voce al changelog per il nuovo URL/la nuova pagina e per la successiva modifica del comportamento di timeout.
- Non aggiungere un’impostazione per la modalità di sollecitazione.

## Distribuzione

### PR 1: ciclo di vita persistente

- Questa nota di progettazione.
- Schema SQLite condiviso, generazione Kysely, archivio e pulizia dopo 30 giorni.
- Servizio di approvazione del Gateway, bridge dell’attesa del runtime e gestione degli elementi orfani dopo il riavvio.
- `approval.get/resolve` unificato.
- Adattatori dei metodi exec/plugin.
- Test per la prevalenza della prima risposta, l’idempotenza, la scadenza, l’autorizzazione e il consumo.
- Nessuna modifica ancora al comportamento dell’interfaccia utente o dei canali.

### PR 2: azioni tipizzate e callback dei canali

- Azioni tipizzate di approvazione, URL e Web App.
- Builder di presentazione principali ed esportazioni dell'SDK dei plugin.
- Codifica dei callback privata del trasporto con tipo di proprietario esplicito.
- Riferimenti di callback persistenti a dimensione fissa per ID canonici che superano i limiti del trasporto.
- Migrazione dei canali inclusi per eliminare l'inferenza dal testo dei comandi e dagli ID di approvazione.
- Verità canonica della prima risposta sulla superficie selezionata e aggiornamenti terminali nativi attivi secondo il principio del massimo sforzo; la terminalizzazione persistente dei messaggi del canale rimane un intervento successivo.
- Test dell'SDK e dei canali inclusi.

### PR 3: deep link della Control UI

- Pagina di approvazione autonoma autenticata e routing di avvio che tiene conto del percorso di base.
- Associazione al Gateway che fornisce il servizio senza modificare la selezione remota salvata dall'operatore.
- Spazio dei nomi HTTP per le approvazioni di proprietà del core, inclusi gli ID simili a risorse.
- Payload URL generato dal Gateway e polling dello stato in sospeso fino alla disponibilità degli eventi del ciclo di vita.
- Prove per larghezza mobile, riconnessione, risposte concorrenti, ricaricamento e percorso montato.

### PR 4: client nativi

- Le superfici di revisione iOS e Android usano `approval.get/resolve` in base al tipo; watchOS inoltra richieste e decisioni sicure per il revisore tramite l'iPhone associato.
- Watch offre le decisioni di esecuzione supportate dal suo contratto di inoltro compatto: consenti una volta e nega.
- La verità terminale canonica della prima risposta sostituisce lo stato locale del tentativo di decisione.
- Conferme di risoluzione perse o ambigue bloccano i controlli fino alla rilettura canonica.
- Le istanze Gateway v4 distribuite in precedenza mantengono la revisione dell'esecuzione tramite un fallback ristretto al metodo legacy; lo stato terminale conservato tra le superfici richiede i metodi unificati.
- Gli avvisi per il revisore e il contesto del proprietario rimangono visibili su iPhone, Watch e Android.
- Prove native di unità, build e piattaforma.

### PR 5: propagazione del ciclo di vita agli antenati

- Recapito dello stato in sospeso/terminale di `session.approval` dall'istantanea del pubblico persistita nella PR 1.
- Sottoscrizione alla sessione esatta, riproduzione alla riconnessione e marcatori di eliminazione terminali senza modificare la trascrizione né riattivare l'agente.
- I callback del ciclo di vita vengono eseguiti dopo l'inserimento/CAS persistente e non diventano mai autorità di approvazione.
- Prove per subagenti annidati e riconnessione.

### PR 6: comportamento fail-closed

- Migrare `node-invoke-plugin-policy.ts` e il broker dei plugin incorporato per eliminare la duplicazione dell'autorità.
- Semantica rigorosa per timeout, dati non validi, assenza di route, associazione e consumo dell'autorizzazione una tantum.
- Deprecare le impostazioni permissive di timeout distribuite senza rispettarle dopo che una richiesta è in sospeso.
- Prove di contesa tra più superfici e iniezione degli errori.

### Intervento successivo: pulizia persistente dei messaggi remoti

- Persistenza dei localizzatori dei recapiti inoltrati e terminalizzazione di ogni messaggio del canale recapitato dopo il riavvio.
- Mantenere questo ciclo di vita del trasporto separato dall'autorità di approvazione canonica e dalle azioni di presentazione tipizzate.

## Test

Copertura mirata richiesta:

- La riapertura di SQLite conserva le proiezioni in sospeso e terminali.
- Due risolutori simultanei producono esattamente un vincitore CAS.
- La ripetizione della stessa decisione riesce in modo idempotente; una ripetizione in conflitto restituisce il vincitore registrato.
- La risoluzione alla scadenza o dopo di essa non può approvare.
- `allow-once` è utilizzabile esattamente una volta senza cancellare lo stato di audit terminale.
- L'avvio annulla le epoche di runtime precedenti.
- La ricerca e la risoluzione non autorizzate non rivelano l'esistenza del record.
- Comportamento della lista esplicita dei revisori consentiti e del `operator.approvals` associato generale.
- I metodi legacy di esecuzione e dei plugin condividono lo stesso archivio.
- Schemi Gateway di richiesta/elenco/recupero/risoluzione e payload degli eventi additivi.
- Normalizzazione delle azioni tipizzate, rendering di fallback, esportazioni dell'SDK e commutazioni dei canali inclusi.
- La codifica dei callback di Telegram contiene dati privati del trasporto e non esegue inferenze dalle stringhe di comando.
- Figlio diretto, proprietari ramificati del controller/richiedente, proprietari annidati, riassegnazione, fallback del campo di sessione, ciclo e limite delle dimensioni del pubblico.
- Gli array del pubblico richiesto e terminale sono identici.
- Le proiezioni del proprietario non causano modifiche alla trascrizione né riattivazioni dell'agente.
- La route della Control UI funziona in `/` e con un percorso di base configurato; l'aggiornamento mostra la verità in sospeso o terminale.
- Le risposte simultanee da Control UI e Telegram mostrano un vincitore e «risolto altrove» per il perdente.
- Gli identificatori di approvazione nativi e gli identificatori del proprietario del Gateway conservano esattamente i byte UTF-8 durante il routing e la riconciliazione.
- La negoziazione della famiglia RPC nativa fissa una sola famiglia canonica o legacy per ogni route Gateway ammessa e non esegue mai un downgrade implicito dopo l'uso.
- Le conferme di risoluzione native perse bloccano le azioni fino alla rilettura canonica; una rilettura non riuscita non può inventare un vincitore né confermare un aggiornamento di Watch.
- La correlazione delle richieste di istantanea di Watch viene accettata solo per l'esatto proprietario Gateway associato e dopo una rilettura canonica completata dall'iPhone.
- Prova del percorso utente tramite Testbox/Crabbox, inclusi una pagina di approvazione a larghezza mobile, la pulizia delle azioni Telegram e un ciclo completo in sospeso/risoluzione/perdente tardivo tra Android, iPhone e Watch.

## Osservabilità

Emettere log strutturati delle transizioni, privi di contenuto, con ID di approvazione, tipo, chiave della sessione di origine, stato, motivo e latenza. Non registrare mai l'anteprima o l'associazione non elaborata.

Monitorare:

- conteggio delle richieste per tipo;
- conteggio degli stati terminali per tipo/stato/motivo;
- indicatore degli elementi in sospeso;
- latenza dalla richiesta allo stato terminale;
- esiti delle corse di risoluzione: vincitore, ripetizione idempotente, conflitto, scaduto;
- conteggio delle route di recapito e dei rifiuti per assenza di route;
- annullamenti degli elementi orfani all'avvio;
- dimensione del pubblico.

Una transizione sottoposta a commit costituisce un successo anche se il successivo recapito dell'evento non riesce. I sottoscrittori del ciclo di vita recuperano tramite la riproduzione della PR 5 e la ricerca canonica. La terminalizzazione persistente dei messaggi del canale rimane l'intervento successivo separato descritto sopra.

## Decisioni aperte

1. **Origine della Control UI raggiungibile dall'esterno.** Ogni istantanea contiene il valore relativo stabile `urlPath`. Un URL assoluto può essere pubblicizzato solo da una posizione Tailscale Serve/Funnel memorizzata nella cache dopo che l'esposizione del Gateway è riuscita; `allowedOrigins`, le intestazioni Host delle richieste, `gateway.remote.url` e i candidati loopback/LAN destinati alla sola visualizzazione non sono origini canoniche. Telegram può usare il proprio wrapper Mini App autenticato per conservare il percorso di approvazione durante il bootstrap. I reverse proxy arbitrari rimangono limitati ai percorsi relativi finché non esiste un contratto esplicito per l'URL pubblico sottoposto a revisione separata. Un canale non deve mai dedurre l'origine.
2. **Transizione di compatibilità al timeout rigoroso dell'esecuzione.** I timeout di approvazione dei plugin ora adottano il comportamento fail-closed e `timeoutBehavior` è deprecato. Il restante contratto distribuito `askFallback` richiede una revisione esplicita del proprietario e della sicurezza, un changelog, documentazione e una decisione di migrazione/deprecazione prima che smetta di autorizzare l'esecuzione dopo il timeout di una richiesta in sospeso.
3. **Modalità incorporata senza Gateway.** Raccomandazione: mantenerla inizialmente solo locale, quindi renderla client del servizio canonico quando è presente un Gateway. Non pubblicizzare un deep link che nessun server può risolvere.
