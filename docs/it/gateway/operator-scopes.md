---
read_when:
    - Debug degli errori relativi all'ambito operatore mancante
    - Revisione delle approvazioni di associazione di dispositivi o Node
    - Aggiunta o classificazione dei metodi RPC del Gateway
summary: Ruoli degli operatori, ambiti e controlli al momento dell'approvazione per i client Gateway
title: Ambiti dell'operatore
x-i18n:
    generated_at: "2026-07-16T14:26:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 5e74cdd87d21a9e0eafea6b7e4b18ab2e5b74e6c570603b1d4ad4dff83c65619
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Gli ambiti dell'operatore determinano ciò che un client Gateway può fare dopo l'autenticazione.
Costituiscono una protezione del piano di controllo all'interno di un singolo dominio di operatori Gateway attendibile,
non un isolamento multi-tenant da soggetti ostili. Per una separazione rigorosa tra persone,
team o macchine, eseguire Gateway separati con utenti del sistema operativo o host distinti.

Vedere anche: [Sicurezza](/it/gateway/security), [Protocollo Gateway](/it/gateway/protocol),
[Associazione del Gateway](/it/gateway/pairing), [CLI dei dispositivi](/it/cli/devices).

## Ruoli

Ogni client WebSocket del Gateway si connette con un ruolo:

- `operator`: client del piano di controllo quali CLI, interfaccia di controllo, automazione e
  processi ausiliari attendibili.
- `node`: host di funzionalità (macOS, iOS, Android, headless) che espongono
  comandi tramite `node.invoke`.

I metodi RPC dell'operatore richiedono il ruolo `operator`; i metodi originati dai nodi
richiedono il ruolo `node`.

## Livelli degli ambiti

| Ambito                  | Significato                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Stato, elenchi, catalogo, log, lettura delle sessioni e altre chiamate non modificanti in sola lettura.                                                         |
| `operator.write`        | Azioni modificanti dell'operatore: invio di messaggi, invocazione di strumenti, aggiornamento delle impostazioni vocali e di conversazione, inoltro dei comandi ai nodi. Soddisfa anche `operator.read`. |
| `operator.admin`        | Accesso amministrativo. Soddisfa ogni ambito `operator.*`. Necessario per modificare la configurazione, eseguire aggiornamenti, usare hook nativi e spazi dei nomi riservati e concedere approvazioni ad alto rischio. |
| `operator.pairing`      | Gestione dell'associazione di dispositivi e nodi: elencare, approvare, rifiutare, rimuovere, ruotare, revocare.                                                 |
| `operator.approvals`    | API di approvazione per esecuzioni e Plugin.                                                                                                                    |
| `operator.talk.secrets` | Lettura della configurazione di conversazione con inclusione dei segreti.                                                                                        |

Gli ambiti `operator.*` futuri e sconosciuti richiedono una corrispondenza esatta, a meno che il chiamante
non disponga già di `operator.admin`.

## L'ambito del metodo è solo il primo controllo

Ogni RPC del Gateway dispone di un ambito del metodo basato sul privilegio minimo, che determina se una
richiesta raggiunge il relativo gestore. Alcuni gestori applicano quindi controlli più rigorosi in base
all'elemento concreto da approvare o modificare:

- `device.pair.approve` è accessibile con `operator.pairing`, ma l'approvazione di un
  dispositivo dell'operatore può generare o mantenere solo gli ambiti già posseduti dal chiamante.
- `node.pair.approve` è accessibile con `operator.pairing`, quindi ricava ulteriori
  ambiti di approvazione dall'elenco di comandi dichiarato dal nodo in sospeso.
- `chat.send` è un metodo con ambito di scrittura, ma i comandi di chat `/config set` e
  `/config unset` richiedono inoltre `operator.admin`,
  indipendentemente dall'ambito del chiamante per l'invio di messaggi di chat.

Ciò consente agli operatori con ambiti inferiori di eseguire azioni di associazione a basso rischio senza
rendere tutte le approvazioni delle associazioni riservate agli amministratori.

## Approvazioni delle associazioni dei dispositivi

I record di associazione dei dispositivi sono la fonte persistente dei ruoli e degli ambiti approvati.
Un dispositivo già associato non ottiene implicitamente un accesso più ampio: una riconnessione
che richiede un ruolo o ambiti più ampi crea una nuova richiesta di elevazione in sospeso.

Quando si approva una richiesta di un dispositivo:

- Una richiesta priva del ruolo di operatore non necessita dell'approvazione dell'ambito dell'operatore.
- Una richiesta per un ruolo del dispositivo diverso dall'operatore (ad esempio `node`) richiede
  `operator.admin`, anche se `device.pair.approve` necessita soltanto di
  `operator.pairing`.
- Una richiesta per `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` o `operator.talk.secrets` richiede che il chiamante
  disponga già di tale ambito oppure di `operator.admin`.
- Una richiesta per `operator.admin` richiede `operator.admin`.
- Una richiesta di riparazione priva di ambiti espliciti può ereditare gli ambiti del token
  dell'operatore esistente; se tale token dispone dell'ambito amministrativo, l'approvazione richiede comunque
  `operator.admin`.

Le sessioni non amministrative basate su segreto condiviso e proxy attendibile possono approvare
le richieste dei dispositivi dell'operatore solo entro i propri ambiti dell'operatore dichiarati; l'approvazione
di ruoli diversi dall'operatore è riservata agli amministratori, anche quando tali sessioni possono altrimenti usare
`operator.pairing`.

Per le sessioni basate su token di dispositivi associati, la gestione è limitata al proprio dispositivo, a meno che il chiamante
non disponga di `operator.admin`: un chiamante non amministrativo vede solo le proprie voci di associazione e
può approvare, rifiutare, ruotare, revocare o rimuovere esclusivamente la voce del proprio dispositivo.

## Approvazioni delle associazioni dei nodi

I metodi legacy `node.pair.*` usano un archivio separato delle associazioni dei nodi, gestito dal Gateway.
I nodi WS usano invece l'associazione dei dispositivi (`role: node`), ma si applica la stessa
terminologia di approvazione. Consultare [Associazione del Gateway](/it/gateway/pairing) per informazioni sulla relazione tra i due
archivi.

`node.pair.approve` ricava gli ulteriori ambiti richiesti dall'elenco di comandi della richiesta
in sospeso:

| Comandi dichiarati                                                                                                    | Ambiti richiesti                       |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| nessuno                                                                                                              | `operator.pairing`                    |
| comandi ordinari dei nodi                                                                                            | `operator.pairing` + `operator.write` |
| `system.run`, `system.run.prepare`, `system.which`, `browser.proxy`, `fs.listDir` o `system.execApprovals.get/set` | `operator.pairing` + `operator.admin` |

L'approvazione della dichiarazione di un nodo non abilita i comandi soggetti a un controllo separato
tramite elenco consentito durante l'esecuzione. Ad esempio, l'approvazione di un nodo che dichiara
`computer.act` richiede l'associazione e l'ambito di scrittura, ma registra soltanto la funzionalità.
Un amministratore o un proprietario deve comunque abilitare `computer.act`. Finché rimane
abilitato, la sua invocazione tramite il metodo `node.invoke` con ambito di scrittura non
richiede l'ambito amministrativo per ogni azione.

L'associazione dei nodi stabilisce identità e attendibilità; non sostituisce i criteri di approvazione
dell'esecuzione `system.run` propri di un nodo.

## Autenticazione con segreto condiviso

L'autenticazione tramite token/password condivisi del Gateway viene considerata un accesso attendibile dell'operatore per
quel Gateway. Le interfacce HTTP compatibili con OpenAI, `/tools/invoke` e gli endpoint HTTP
della cronologia delle sessioni ripristinano l'intero insieme predefinito degli ambiti dell'operatore per
l'autenticazione bearer con segreto condiviso, anche se un chiamante invia ambiti dichiarati più ristretti.

Le modalità associate a un'identità, come l'autenticazione tramite proxy attendibile o `none` con ingresso privato,
possono comunque rispettare gli ambiti dichiarati esplicitamente. Usare Gateway separati per una reale separazione
dei confini di attendibilità.
