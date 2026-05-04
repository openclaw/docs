---
read_when:
    - Debug degli errori relativi all'ambito operatore mancante
    - Revisione delle approvazioni di associazione di dispositivi o Node
    - Aggiunta o classificazione dei metodi RPC del Gateway
summary: Ruoli, ambiti e controlli al momento dell'approvazione degli operatori per i client Gateway
title: Ambiti dell'operatore
x-i18n:
    generated_at: "2026-05-04T07:06:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: f05d6bdbf9bdad2aef1c9664bb7ebb4b6241334b8aefac7993104e9977e40450
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Gli ambiti operatore definiscono ciò che un client Gateway può fare dopo essersi autenticato.
Sono una protezione del control plane all'interno di un singolo dominio attendibile dell'operatore Gateway,
non un isolamento multi-tenant ostile. Se hai bisogno di una separazione forte tra
persone, team o macchine, esegui Gateway separati con utenti del sistema operativo o
host separati.

Correlati: [Sicurezza](/it/gateway/security), [protocollo Gateway](/it/gateway/protocol),
[associazione Gateway](/it/gateway/pairing), [CLI dei dispositivi](/it/cli/devices).

## Ruoli

I client WebSocket del Gateway si connettono con un ruolo:

- `operator`: client del control plane come CLI, Control UI, automazione e
  processi di supporto attendibili.
- `node`: host di funzionalità come macOS, iOS, Android o nodi headless che
  espongono comandi tramite `node.invoke`.

I metodi RPC dell'operatore richiedono il ruolo `operator`. I metodi originati
dal nodo richiedono il ruolo `node`.

## Livelli di ambito

| Ambito                  | Significato                                                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `operator.read`         | Stato in sola lettura, elenchi, catalogo, log, letture di sessione e altre chiamate del control plane non mutanti.                                                                         |
| `operator.write`        | Normali azioni mutanti dell'operatore, come inviare messaggi, invocare strumenti, aggiornare le impostazioni di conversazione/voce e inoltrare comandi ai nodi. Soddisfa anche `operator.read`. |
| `operator.admin`        | Accesso amministrativo al control plane. Soddisfa ogni ambito `operator.*`. Richiesto per mutazioni della configurazione, aggiornamenti, hook nativi, namespace riservati sensibili e approvazioni ad alto rischio. |
| `operator.pairing`      | Gestione dell'associazione di dispositivi e nodi, incluse le operazioni di elenco, approvazione, rifiuto, rimozione, rotazione e revoca di record di associazione o token dispositivo.     |
| `operator.approvals`    | API di approvazione per exec e plugin.                                                                                                                                                     |
| `operator.talk.secrets` | Lettura della configurazione di Talk con i segreti inclusi.                                                                                                                                |

Gli ambiti futuri sconosciuti `operator.*` richiedono una corrispondenza esatta, a meno che il chiamante non abbia
`operator.admin`.

## L'ambito del metodo è solo il primo controllo

Ogni RPC Gateway ha un ambito di metodo con privilegi minimi. Tale ambito di metodo decide
se la richiesta può raggiungere l'handler. Alcuni handler applicano poi controlli
più severi al momento dell'approvazione, in base all'elemento concreto che viene approvato o modificato.

Esempi:

- `device.pair.approve` è raggiungibile con `operator.pairing`, ma l'approvazione di un
  dispositivo operatore può emettere o preservare solo ambiti già detenuti dal chiamante.
- `node.pair.approve` è raggiungibile con `operator.pairing`, quindi deriva ambiti di
  approvazione aggiuntivi dall'elenco di comandi del nodo in sospeso.
- `chat.send` normalmente è un metodo con ambito di scrittura, ma `/config set`
  e `/config unset` persistenti richiedono `operator.admin` a livello di comando.

Questo consente agli operatori con ambiti inferiori di eseguire azioni di associazione a basso rischio senza rendere
tutte le approvazioni di associazione riservate agli amministratori.

## Approvazioni di associazione dei dispositivi

I record di associazione dei dispositivi sono la fonte durevole dei ruoli e degli ambiti approvati.
I dispositivi già associati non ottengono silenziosamente un accesso più ampio: le riconnessioni che chiedono
un ruolo più ampio o ambiti più ampi creano una nuova richiesta di upgrade in sospeso.

Quando approvi una richiesta di dispositivo:

- Una richiesta senza ruolo operatore non richiede l'approvazione dell'ambito del token operatore.
- Una richiesta per `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` o `operator.talk.secrets` richiede che il chiamante abbia
  tali ambiti, oppure `operator.admin`.
- Una richiesta per `operator.admin` richiede `operator.admin`.
- Una richiesta di riparazione senza ambiti espliciti può ereditare gli ambiti esistenti del token operatore.
  Se quel token esistente ha ambito admin, l'approvazione richiede comunque
  `operator.admin`.

Per le sessioni con token di dispositivi associati, la gestione è auto-limitata a meno che il chiamante
non abbia anche `operator.admin`: i chiamanti non admin vedono solo le proprie voci di associazione,
possono approvare o rifiutare solo la propria richiesta in sospeso e possono ruotare, revocare o
rimuovere solo la propria voce dispositivo.

## Approvazioni di associazione dei nodi

Il legacy `node.pair.*` usa uno store separato di associazione nodi di proprietà del Gateway. I nodi WS
usano l'associazione dei dispositivi con `role: node`, ma si applica lo stesso vocabolario
a livello di approvazione.

`node.pair.approve` usa l'elenco di comandi della richiesta in sospeso per derivare ambiti
richiesti aggiuntivi:

- Richiesta senza comandi: `operator.pairing`
- Comandi nodo non exec: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

L'associazione dei nodi stabilisce identità e attendibilità. Non sostituisce la policy di approvazione exec
`system.run` propria del nodo.

## Autenticazione con segreto condiviso

L'autenticazione con token/password condivisi del gateway viene trattata come accesso operatore attendibile per
quel Gateway. Le superfici HTTP compatibili con OpenAI e `/tools/invoke` ripristinano il
normale set completo di ambiti predefiniti dell'operatore per l'autenticazione bearer con segreto condiviso, anche se un
chiamante invia ambiti dichiarati più ristretti.

Le modalità con identità, come l'autenticazione tramite proxy attendibile o `none` con private ingress,
possono comunque rispettare gli ambiti dichiarati espliciti. Usa Gateway separati per una reale separazione
dei confini di fiducia.
