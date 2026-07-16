---
read_when:
    - Serve una registrazione persistente delle operazioni eseguite dal Gateway senza memorizzare i contenuti
    - Si sta decidendo se abilitare il controllo del ciclo di vita dei messaggi
    - È necessario spiegare che cosa dimostrano e che cosa non dimostrano i record di audit
summary: Cronologia di audit contenente solo metadati per le esecuzioni degli agenti, le azioni degli strumenti e i cicli di vita dei messaggi con consenso esplicito
title: Cronologia degli audit
x-i18n:
    generated_at: "2026-07-16T14:22:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1005b214a674f0f888d759837bd627be458cefcf9ed61bda722499333361dc45
    source_path: gateway/audit.md
    workflow: 16
---

# Cronologia degli audit

Il Gateway conserva un registro di audit limitato e contenente solo metadati nel database di stato condiviso di OpenClaw. Consente di rispondere a domande operative come «quale agente è stato eseguito, quando e con quale esito», «quali azioni degli strumenti sono state eseguite durante un'esecuzione» e, quando l'audit dei messaggi è abilitato, «un messaggio in entrata accettato ha raggiunto l'inoltro» e «un messaggio in uscita ha raggiunto uno stato terminale di consegna».

Il registro memorizza identità, ordinamento, provenienza, azione, stato e codici di esito normalizzati. Non memorizza mai prompt, corpi dei messaggi, argomenti o risultati degli strumenti, allegati, nomi di file, URL, output dei comandi o testo non elaborato degli errori.

## Famiglie di record

Gli eventi delle esecuzioni e degli strumenti vengono registrati ogni volta che l'audit è abilitato (impostazione predefinita). Gli eventi del ciclo di vita dei messaggi sono facoltativi e disabilitati per impostazione predefinita.

| Famiglia           | Azioni                                                   | Valore predefinito |
| ------------------ | -------------------------------------------------------- | ------------------ |
| Esecuzioni agente  | `agent.run.started`, `agent.run.finished`                  | attivo             |
| Azioni strumenti   | `tool.action.started`, `tool.action.finished`                  | attivo             |
| Messaggi           | `message.inbound.processed`, `message.outbound.finished`                  | disattivo          |

Ogni record contiene un ID evento stabile, una sequenza monotona del registro, un timestamp del ciclo di vita, l'attore, l'azione, lo stato, `schemaVersion: 1` e `redaction: "metadata_only"`. Consultare [Record di audit](/cli/audit) per il riferimento completo dei campi e i filtri di query.

## Eventi del ciclo di vita dei messaggi

Impostare [`audit.messages`](/it/gateway/configuration-reference#audit) per scegliere cosa registrare, quindi riavviare il Gateway:

- `off` (impostazione predefinita): nessun record dei messaggi.
- `direct`: solo i messaggi nelle conversazioni dirette.
- `all`: messaggi diretti, di gruppo e di canale.

Due confini autorevoli producono record dei messaggi:

- Le righe **in entrata** vengono scritte quando un messaggio accettato raggiunge l'inoltro principale, inclusi i duplicati e gli esiti terminali dell'elaborazione.
- Le righe **in uscita** vengono scritte quando la consegna durevole condivisa raggiunge un esito terminale: inviato, soppresso, non riuscito oppure un `unknown` esplicito per gli invii ambigui a causa di un arresto anomalo. Sono inclusi gli esiti del ripristino della coda e della coda dei messaggi non recapitabili. Ogni payload di risposta logico originale riceve una riga terminale; la suddivisione in blocchi e la distribuzione verso più adattatori vengono aggregate in `resultCount`.

### Classificazione del tipo di conversazione

La modalità `direct` costituisce un confine di privacy, pertanto un messaggio viene classificato come conversazione diretta solo quando i dati della destinazione lo dimostrano: il percorso di invio ha dichiarato il tipo di conversazione di destinazione oppure la route della sessione di consegna indica esattamente il canale e il peer destinatari. Segnali più deboli, come lo stato dei criteri o la conversazione di origine, possono classificare un messaggio come `group` (escludendolo dalla raccolta `direct`), ma non possono mai dichiararlo `direct`. I messaggi per i quali non è possibile dimostrare che siano diretti vengono classificati come `unknown` e non sono registrati in modalità `direct`. I canali che non dichiarano i tipi di chat possono quindi registrare meno righe in modalità `direct` rispetto alla modalità `all`.

## Modello di privacy

Le righe dei messaggi non memorizzano mai identificatori non elaborati della piattaforma. Quando la correlazione è disponibile, gli identificatori di account, conversazione, messaggio e destinazione vengono esportati solo come pseudonimi con chiave locali all'installazione (`hmac-sha256:v1:<keyId>:<digest>`):

- La chiave HMAC viene generata al primo utilizzo, è separata per dominio in base al tipo di identificatore e risiede nello stesso database di stato del registro.
- Gli pseudonimi sono stabili all'interno di una singola installazione, quindi le righe relative alla stessa conversazione possono essere correlate senza rivelare l'identificatore della piattaforma.
- Si tratta di **correlazione, non anonimizzazione**: chiunque disponga dell'accesso in lettura al database di stato possiede anche la chiave e può confrontare potenziali identificatori non elaborati con gli pseudonimi. Le esportazioni RPC e CLI non includono mai la chiave.
- Se il materiale della chiave risulta mancante o danneggiato mentre vengono conservate righe dei messaggi, il Gateway applica un comportamento fail-closed e scarta i nuovi record dei messaggi anziché passare silenziosamente a una nuova chiave, operazione che interromperebbe la correlazione.

I record delle esecuzioni e degli strumenti conservano `sessionKey` e `sessionId` per la correlazione; le chiavi di sessione canoniche possono contenere a loro volta ID di account o peer della piattaforma. I record dei messaggi omettono intenzionalmente entrambi.

Le esportazioni degli audit rimangono metadati operativi sensibili anche senza contenuto: tempistiche, canali, esiti e pseudonimi stabili possono consentire di correlare le attività. Proteggere le esportazioni con gli stessi controlli di accesso e le stesse pratiche di conservazione applicati agli altri record operativi.

## Copertura e limiti probatori

Il registro opera secondo il principio del massimo impegno ed è deliberatamente limitato. Deve essere considerato una prova di ciò che è stato registrato, non di ciò che è accaduto:

- **L'assenza di una riga non dimostra nulla.** Gli scarti in entrata precedenti all'ammissione, gli invii da processi CLI senza un registratore Gateway in esecuzione e i percorsi locali dei Plugin o di invio diretto che ignorano la consegna durevole condivisa non lasciano alcun record.
- Le scritture passano attraverso un worker in background limitato; un errore del worker o la saturazione della coda causa lo scarto dei record e la registrazione di un singolo avviso operativo.
- Gli invii in uscita ambigui a causa di un arresto anomalo vengono registrati come `unknown` anziché con esiti inventati.

Questo registro supporta il debug e la revisione operativa. Non è un archivio di conformità senza perdite; se ne occorre uno, utilizzare un sistema esterno alimentato da [OpenTelemetry](/it/gateway/opentelemetry) o da strumenti a livello di canale.

## Archiviazione, conservazione e migrazione

I record risiedono nel database di stato condiviso (`state/openclaw.sqlite`) e vengono scritti al di fuori del percorso critico della consegna. Le query non restituiscono mai record più vecchi di 30 giorni e il registro è limitato a 100,000 righe; le righe scadute vengono eliminate durante l'avvio, la manutenzione oraria e le scritture successive. La manutenzione della conservazione continua a essere eseguita anche quando la raccolta è disabilitata.

L'aggiornamento da un Gateway con il precedente registro limitato a esecuzioni e strumenti migra automaticamente lo schema all'avvio (o tramite `openclaw doctor --fix`); le righe esistenti e le relative sequenze del registro vengono conservate.

## Esecuzione delle query

- CLI: [`openclaw audit`](/cli/audit) con filtri per agente, sessione, esecuzione, tipo, stato, direzione, canale, limiti temporali e paginazione tramite cursore.
- RPC del Gateway: `audit.activity.list` (richiede `operator.read`) restituisce l'unione degli eventi di attività V1 con versione; l'RPC `audit.list` distribuita rimane invariata per i client precedenti di esecuzioni e strumenti. Consultare [Protocollo del Gateway](/it/gateway/protocol#audit-ledger-rpc).

## Argomenti correlati

- [CLI dei record di audit](/cli/audit)
- [Riferimento di configurazione](/it/gateway/configuration-reference#audit)
- [Protocollo del Gateway](/it/gateway/protocol#audit-ledger-rpc)
- [OpenTelemetry](/it/gateway/opentelemetry)
