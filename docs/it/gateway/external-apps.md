---
read_when:
    - Stai creando un'app esterna, uno script, una dashboard, un processo CI o un'estensione per IDE che comunica con OpenClaw
    - Stai scegliendo tra l'RPC del Gateway e l'SDK dei Plugin
    - Stai eseguendo l'integrazione con le esecuzioni degli agenti del Gateway, le sessioni, gli eventi, le approvazioni, i modelli o gli strumenti
    - Stai associando un controller di hosting a uno scheduler di riattivazione esterno
sidebarTitle: External apps
summary: Percorso di integrazione attuale per app esterne, script, dashboard, processi CI ed estensioni IDE
title: Integrazioni del Gateway per app esterne
x-i18n:
    generated_at: "2026-07-12T07:02:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0034db64dea64f8c5c400cf2adc69c6e046d0cd574914fe7497099018cb28745
    source_path: gateway/external-apps.md
    workflow: 16
---

Le app esterne comunicano con OpenClaw tramite il protocollo Gateway: trasporto
WebSocket e metodi RPC. Usalo quando uno script, una dashboard, un processo CI,
un'estensione IDE o un altro processo deve avviare esecuzioni di agenti,
ricevere eventi in streaming, attendere risultati, annullare attività o
ispezionare le risorse del Gateway.

<Warning>
  Non esiste ancora un pacchetto client npm pubblico. Non aggiungere nomi di
  pacchetti client OpenClaw come dipendenze dell'applicazione finché le note di
  rilascio non annunciano un pacchetto pubblicato e questa pagina non include
  le istruzioni di installazione.
</Warning>

<Note>
  Questa pagina riguarda il codice esterno al processo OpenClaw. Il codice dei
  Plugin eseguito all'interno di OpenClaw deve invece utilizzare i sottopercorsi
  documentati `openclaw/plugin-sdk/*`.
</Note>

## Cosa è disponibile oggi

| Interfaccia                             | Stato  | Utilizzo                                                                                               |
| --------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------ |
| [Protocollo Gateway](/it/gateway/protocol) | Pronto | Trasporto WebSocket, handshake di connessione, ambiti di autenticazione, versionamento del protocollo ed eventi. |
| [Riferimento RPC del Gateway](/it/reference/rpc) | Pronto | Metodi Gateway attuali per agenti, sessioni, attività, modelli, strumenti, artefatti e approvazioni. |
| [`openclaw agent`](/it/cli/agent)          | Pronto | Integrazione di script a esecuzione singola quando è sufficiente richiamare la CLI tramite shell. |
| [`openclaw message`](/it/cli/message)      | Pronto | Invio di messaggi o azioni di canale dagli script. |

Un futuro pacchetto della libreria client è in fase di sviluppo interno, ma non
è ancora disponibile pubblicamente per l'installazione. Consideralo un
dettaglio implementativo in anteprima finché una versione non annuncia un
pacchetto pubblicato e dotato di versione.

## Percorso consigliato

1. Avvia o individua un Gateway.
2. Connettiti tramite il [protocollo Gateway](/it/gateway/protocol).
3. Chiama i metodi RPC documentati nel [riferimento RPC del Gateway](/it/reference/rpc).
4. Fissa la versione di OpenClaw con cui esegui i test.
5. Ricontrolla il riferimento RPC quando aggiorni OpenClaw.

Per le esecuzioni degli agenti, inizia con l'RPC `agent` e abbinalo a
`agent.wait` per ottenere un risultato terminale. Per uno stato persistente
della conversazione, usa i metodi `sessions.*`. Per le integrazioni
dell'interfaccia utente, sottoscriviti agli eventi del Gateway e visualizza
solo le famiglie di eventi comprese dalla tua app.

## Sospensione cooperativa dell'host

I controller di hosting che bloccano o acquisiscono uno snapshot di un processo
in esecuzione possono utilizzare l'handshake di sospensione indipendente
dall'host:

1. Interrompi l'accettazione del traffico esterno in ingresso controllato dall'host.
2. Chiama `gateway.suspend.prepare` con un `requestId` stabile e univoco.
3. Se la risposta è `busy`, lascia il processo in esecuzione e riprova in seguito.
4. Se è `ready`, salva il `suspensionId` restituito, quindi blocca il processo o
   acquisiscine uno snapshot prima di `expiresAtMs`.
5. Dopo il ripristino, oppure se la sospensione viene abbandonata, chiama
   `gateway.suspend.resume` con quel `suspensionId` tramite la connessione
   WebSocket esistente o il percorso di controllo HTTP amministrativo.

Un Gateway preparato rifiuta i nuovi handshake WebSocket. Un controller
WebSocket deve mantenere aperta la propria connessione autenticata durante
l'operazione dell'host. Se ciò non può essere garantito, abilita e utilizza il
[Plugin RPC HTTP amministrativo](/it/plugins/admin-http-rpc) prima della
preparazione. Se il percorso di controllo viene perso, attendi la scadenza del
lease di due minuti prima di riconnetterti; alla scadenza, l'accettazione viene
riaperta automaticamente.

Il contratto RPC è:

- `gateway.suspend.prepare` — `operator.admin`; parametri
  `{ "requestId": "stable-host-operation-id" }`
- `gateway.suspend.status` — `operator.read`; parametri
  `{ "suspensionId": "id-from-prepare" }`
- `gateway.suspend.resume` — `operator.admin`; parametri
  `{ "suspensionId": "id-from-prepare" }`

Gli ID vengono privati degli spazi alle estremità, devono contenere un carattere
diverso da uno spazio e sono limitati a 128 caratteri. Un risultato di
preparazione occupato contiene `status: "busy"`, `reason`, `retryAfterMs`,
`activeCount` e `blockers`. Un risultato pronto ha questa struttura:

```json
{
  "status": "ready",
  "suspensionId": "2c3f...",
  "expiresAtMs": 1770000000000,
  "activeCount": 0,
  "blockers": []
}
```

Lo stato restituisce `{"status":"running"}` oppure un risultato pronto con
`expiresAtMs`. La ripresa restituisce
`{"ok":true,"status":"running","resumed":true}`; ripeterla dopo una ripresa
riuscita restituisce `resumed: false`.

Un ID richiesta concorrente o un errore temporaneo nella ripresa dello
scheduler restituisce l'errore ripetibile `UNAVAILABLE` con `retryAfterMs`.
Durante il ripristino dello scheduler, preparazione, stato e ripresa
restituiscono tutti tale errore, il Gateway rimane non pronto e con chiusura in
caso di errore, e l'host non deve bloccarlo né acquisirne uno snapshot. OpenClaw
riprova automaticamente lo scheduler e riapre l'accettazione solo dopo il
completamento del ripristino. Un ID di ripresa non corrispondente restituisce
`INVALID_REQUEST`. La preparazione condivide il limite di scrittura del piano
di controllo del Gateway, pari a tre tentativi al minuto; rispetta il ritardo
restituito prima di riprovare. I client WebSocket sono raggruppati per
dispositivo e IP. I controller HTTP amministrativi sono raggruppati in base
all'IP client risolto, quindi i controller dietro lo stesso proxy possono
condividere un limite.

La preparazione si limita al rifiuto: OpenClaw chiude l'accettazione di nuove
radici, sessioni e comandi, sospende i tick Cron automatici e ispeziona le
attività in modo sincrono. Se qualcosa è attivo, riprende lo scheduler e riapre
l'accettazione prima di restituire `busy`; non interrompe né completa
forzatamente tali attività. Un lease pronto dura due minuti. La ripetizione di
`prepare` con lo stesso `requestId` lo rinnova; alla scadenza, lo scheduler
viene ripreso prima della riapertura dell'accettazione.
Un'emissione di riavvio che diventa necessaria durante un lease pronto attende
la ripresa del lease; un riavvio in corso fa sì che la preparazione restituisca
`busy`.

Durante lo stato pronto, `/healthz` rimane attivo e `/readyz` restituisce `503`.
Le risposte di disponibilità locali o autenticate includono
`gateway-draining`; le sonde remote non autenticate ricevono solo
`{ "ready": false }`. Rimangono disponibili la sonda di integrità HTTP, i
metodi di sospensione sulle connessioni WebSocket esistenti e una route RPC
HTTP amministrativa già abilitata. Gli altri RPC restituiscono l'errore
ripetibile `UNAVAILABLE`. Le route HTTP integrate per le attività utente e le
normali route HTTP dei Plugin, incluse le API compatibili con OpenAI, le
operazioni su strumenti e sessioni, le osservazioni dei Node e gli hook
configurati, restituiscono `503` con
`error.code: "gateway_unavailable"`. Anche i nuovi aggiornamenti WebSocket di
proprietà dei Plugin restituiscono `503`; ciò riguarda la proprietà
dell'aggiornamento, non il lavoro eseguito successivamente tramite un socket
del Plugin già stabilito.

Questo handshake non rende persistenti i messaggi in ingresso, non arresta i
trasporti dei canali di terze parti e non controlla la piattaforma di hosting.
L'host deve isolare il proprio traffico in ingresso prima della preparazione e
rimane responsabile del risveglio, dello snapshot o blocco e dell'arresto.
`activeCount` è il conteggio aggregato delle attività monitorate, mentre
`blockers` contiene i conteggi non nulli per categoria e dettagli limitati
sulle attività. Non si tratta di una barriera generale di quiescenza del
processo. Un blocco `background-exec` è solo aggregato: il testo dei comandi,
gli ID dei processi, l'output e gli identificatori di sessione o ambito non
attraversano mai il protocollo. L'integrità dei canali, la manutenzione,
l'aggiornamento della cache, le sessioni WebSocket dei Plugin già stabilite e
le attività in background non registrate di proprietà dei Plugin possono
rimanere attivi.
La piattaforma di hosting deve bloccare o acquisire uno snapshot dell'intero
albero dei processi e del relativo file system in modo coerente; con questo
primo contratto non è possibile dimostrare che le attività non registrate siano
inattive.

<Tip>
  Per la pianificazione del risveglio dell'host, mantieni la parte rivolta a
  OpenClaw in un Plugin interno al processo e proietta snapshot completi
  idempotenti verso l'adattatore host esterno. Il controller di hosting non
  deve importare il Plugin SDK né ricostruire lo stato Cron dai delta degli
  eventi. Consulta [Proiezione sicura del Cron
  esterno](/it/plugins/hooks#safe-external-cron-projection).
</Tip>

## Codice dell'app e codice dei Plugin

Usa l'RPC del Gateway quando il codice risiede all'esterno di OpenClaw:

- Script Node che avviano o osservano le esecuzioni degli agenti
- Processi CI che chiamano un Gateway
- dashboard e pannelli di amministrazione
- estensioni IDE
- bridge esterni che non devono diventare Plugin di canale
- test di integrazione con trasporti Gateway simulati o reali

Usa il Plugin SDK quando il codice viene eseguito all'interno di OpenClaw:

- Plugin di provider
- Plugin di canale
- hook degli strumenti o del ciclo di vita
- Plugin dell'infrastruttura degli agenti
- utilità affidabili di runtime

Le app esterne non devono importare `openclaw/plugin-sdk/*`; tali sottopercorsi
sono destinati ai Plugin caricati da OpenClaw.

## Contenuti correlati

- [Protocollo Gateway](/it/gateway/protocol)
- [Riferimento RPC del Gateway](/it/reference/rpc)
- [Comando CLI per gli agenti](/it/cli/agent)
- [Comando CLI per i messaggi](/it/cli/message)
- [Ciclo dell'agente](/it/concepts/agent-loop)
- [Runtime degli agenti](/it/concepts/agent-runtimes)
- [Sessioni](/it/concepts/session)
- [Attività in background](/it/automation/tasks)
- [Agenti ACP](/it/tools/acp-agents)
- [Panoramica del Plugin SDK](/it/plugins/sdk-overview)
