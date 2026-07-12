---
read_when:
    - Debug degli errori relativi all'ambito operatore mancante
    - Revisione delle approvazioni di associazione di dispositivi o Node
    - Aggiunta o classificazione dei metodi RPC del Gateway
summary: Ruoli degli operatori, ambiti e controlli al momento dell'approvazione per i client Gateway
title: Ambiti dell'operatore
x-i18n:
    generated_at: "2026-07-12T07:04:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cfda4486e8d31c01fb7ffff398dcc678d298194f0f0ce6308ae9e5388f5a2856
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Gli ambiti dell'operatore determinano ciò che un client Gateway può fare dopo l'autenticazione.
Costituiscono una protezione del piano di controllo all'interno di un singolo dominio operatore Gateway attendibile,
non un isolamento multi-tenant da soggetti ostili. Per una separazione rigorosa tra persone,
team o macchine, esegui Gateway distinti con utenti del sistema operativo o host distinti.

Correlati: [Sicurezza](/it/gateway/security), [Protocollo Gateway](/it/gateway/protocol),
[Associazione Gateway](/it/gateway/pairing), [CLI dei dispositivi](/it/cli/devices).

## Ruoli

Ogni client WebSocket del Gateway si connette con un ruolo:

- `operator`: client del piano di controllo come CLI, interfaccia di controllo, automazione e
  processi ausiliari attendibili.
- `node`: host di funzionalità (macOS, iOS, Android, senza interfaccia grafica) che espongono
  comandi tramite `node.invoke`.

I metodi RPC dell'operatore richiedono il ruolo `operator`; i metodi provenienti dai nodi
richiedono il ruolo `node`.

## Livelli di ambito

| Ambito                  | Significato                                                                                                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Stato, elenchi, catalogo, log, lettura delle sessioni e altre chiamate che non apportano modifiche, in sola lettura.                                                                 |
| `operator.write`        | Azioni dell'operatore che apportano modifiche: invio di messaggi, invocazione di strumenti, aggiornamento delle impostazioni di conversazione/voce, inoltro di comandi ai nodi. Soddisfa anche `operator.read`. |
| `operator.admin`        | Accesso amministrativo. Soddisfa ogni ambito `operator.*`. Necessario per modificare la configurazione, eseguire aggiornamenti, usare hook nativi e spazi dei nomi riservati e concedere approvazioni ad alto rischio. |
| `operator.pairing`      | Gestione dell'associazione di dispositivi e nodi: elencare, approvare, rifiutare, rimuovere, ruotare, revocare.                                                                       |
| `operator.approvals`    | API di approvazione dell'esecuzione e dei plugin.                                                                                                                                   |
| `operator.talk.secrets` | Lettura della configurazione di Talk con inclusione dei segreti.                                                                                                                     |

Gli ambiti `operator.*` futuri e sconosciuti richiedono una corrispondenza esatta, a meno che il chiamante
non disponga già di `operator.admin`.

## L'ambito del metodo è solo il primo controllo

Ogni RPC del Gateway dispone di un ambito del metodo con privilegi minimi che determina se una
richiesta può raggiungere il relativo gestore. Alcuni gestori applicano quindi controlli più rigorosi in base
all'elemento specifico da approvare o modificare:

- `device.pair.approve` è accessibile con `operator.pairing`, ma l'approvazione di un
  dispositivo operatore può generare o mantenere solo gli ambiti già posseduti dal chiamante.
- `node.pair.approve` è accessibile con `operator.pairing`, quindi ricava ulteriori
  ambiti di approvazione dall'elenco di comandi dichiarato dal nodo in attesa.
- `chat.send` è un metodo con ambito di scrittura, ma i comandi di chat `/config set` e
  `/config unset` richiedono in aggiunta `operator.admin`,
  indipendentemente dall'ambito del chiamante per l'invio di messaggi di chat.

Ciò consente agli operatori con ambiti inferiori di eseguire azioni di associazione a basso rischio senza
rendere tutte le approvazioni delle associazioni riservate agli amministratori.

## Approvazioni dell'associazione dei dispositivi

I record di associazione dei dispositivi sono la fonte persistente dei ruoli e degli ambiti approvati.
Un dispositivo già associato non ottiene implicitamente un accesso più ampio: una riconnessione
che richiede un ruolo o ambiti più ampi crea una nuova richiesta di aggiornamento in attesa.

Quando si approva una richiesta di un dispositivo:

- Una richiesta senza ruolo operatore non necessita dell'approvazione di un ambito operatore.
- Una richiesta per un ruolo dispositivo diverso da operatore (ad esempio `node`) richiede
  `operator.admin`, anche se `device.pair.approve` richiede soltanto
  `operator.pairing`.
- Una richiesta per `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` o `operator.talk.secrets` richiede che il chiamante disponga già
  di tale ambito oppure di `operator.admin`.
- Una richiesta per `operator.admin` richiede `operator.admin`.
- Una richiesta di riparazione senza ambiti espliciti può ereditare gli ambiti del token
  operatore esistente; se tale token ha ambito amministrativo, l'approvazione richiede comunque
  `operator.admin`.

Le sessioni non amministrative con segreto condiviso e proxy attendibile possono approvare
le richieste dei dispositivi operatore solo entro i propri ambiti operatore dichiarati; l'approvazione
di ruoli diversi da operatore è riservata agli amministratori, anche quando tali sessioni possono altrimenti usare
`operator.pairing`.

Per le sessioni con token di dispositivi associati, la gestione è limitata al dispositivo stesso, a meno che il chiamante
non disponga di `operator.admin`: un chiamante non amministrativo vede solo le proprie voci di associazione e
può approvare, rifiutare, ruotare, revocare o rimuovere solo la voce del proprio dispositivo.

## Approvazioni dell'associazione dei nodi

I metodi legacy `node.pair.*` usano un archivio separato per l'associazione dei nodi, gestito dal Gateway.
I nodi WS usano invece l'associazione dei dispositivi (`role: node`), ma si applica la stessa
terminologia di approvazione. Consulta [Associazione Gateway](/it/gateway/pairing) per informazioni sulla relazione tra i due
archivi.

`node.pair.approve` ricava gli ulteriori ambiti richiesti dall'elenco di comandi
della richiesta in attesa:

| Comandi dichiarati                                     | Ambiti richiesti                      |
| ------------------------------------------------------ | ------------------------------------- |
| nessuno                                                | `operator.pairing`                    |
| comandi dei nodi diversi dall'esecuzione               | `operator.pairing` + `operator.write` |
| `system.run`, `system.run.prepare` o `system.which`    | `operator.pairing` + `operator.admin` |

L'approvazione della dichiarazione di un nodo non abilita i comandi soggetti a un controllo distinto
dell'elenco di autorizzazioni in fase di esecuzione. Ad esempio, l'approvazione di un nodo che dichiara
`computer.act` richiede l'ambito di associazione e quello di scrittura, ma registra soltanto la funzionalità.
Un amministratore o proprietario deve comunque abilitare `computer.act`. Finché rimane
abilitato, la sua invocazione tramite il metodo `node.invoke` con ambito di scrittura non
richiede l'ambito amministrativo per ogni azione.

L'associazione dei nodi stabilisce identità e attendibilità; non sostituisce i criteri di approvazione
dell'esecuzione di `system.run` propri del nodo.

## Autenticazione con segreto condiviso

L'autenticazione tramite token/password condivisi del Gateway è considerata un accesso operatore attendibile per
quel Gateway. Le superfici HTTP compatibili con OpenAI, `/tools/invoke` e gli endpoint HTTP
della cronologia delle sessioni ripristinano l'intero insieme predefinito di ambiti operatore per
l'autenticazione bearer con segreto condiviso, anche se un chiamante invia ambiti dichiarati più limitati.

Le modalità associate a un'identità, come l'autenticazione tramite proxy attendibile o `none` per l'ingresso privato,
possono comunque rispettare gli ambiti dichiarati esplicitamente. Usa Gateway distinti per una reale separazione
dei confini di attendibilità.
