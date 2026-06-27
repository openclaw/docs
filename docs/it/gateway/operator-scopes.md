---
read_when:
    - Debug degli errori di ambito operatore mancante
    - Revisione delle approvazioni di associazione di dispositivi o nodi
    - Aggiungere o classificare metodi RPC Gateway
summary: Ruoli, ambiti e controlli al momento dell'approvazione per i client Gateway
title: Ambiti dell'operatore
x-i18n:
    generated_at: "2026-06-27T17:34:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dc59453ae1a73b52276185de2cedd1ed4da027111168eda8107d6ba0b74aec2f
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Gli ambiti operatore definiscono cosa può fare un client Gateway dopo l'autenticazione.
Sono una protezione del piano di controllo all'interno di un dominio operatore Gateway attendibile,
non un isolamento multi-tenant ostile. Se serve una separazione forte tra
persone, team o macchine, esegui Gateway separati con utenti OS o
host separati.

Correlati: [Sicurezza](/it/gateway/security), [protocollo Gateway](/it/gateway/protocol),
[pairing Gateway](/it/gateway/pairing), [CLI dispositivi](/it/cli/devices).

## Ruoli

I client WebSocket Gateway si connettono con un ruolo:

- `operator`: client del piano di controllo come CLI, Control UI, automazione e
  processi helper attendibili.
- `node`: host di capability come macOS, iOS, Android o nodi headless che
  espongono comandi tramite `node.invoke`.

I metodi RPC dell'operatore richiedono il ruolo `operator`. I metodi originati
dal nodo richiedono il ruolo `node`.

## Livelli di ambito

| Ambito                  | Significato                                                                                                                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Stato in sola lettura, elenchi, catalogo, log, letture di sessione e altre chiamate del piano di controllo non mutanti.                                                                            |
| `operator.write`        | Azioni operatore mutanti normali, come inviare messaggi, invocare strumenti, aggiornare impostazioni talk/voice e relay dei comandi del nodo. Soddisfa anche `operator.read`.                     |
| `operator.admin`        | Accesso amministrativo al piano di controllo. Soddisfa ogni ambito `operator.*`. Richiesto per mutazioni della configurazione, aggiornamenti, hook nativi, namespace riservati sensibili e approvazioni ad alto rischio. |
| `operator.pairing`      | Gestione del pairing di dispositivi e nodi, inclusi elenco, approvazione, rifiuto, rimozione, rotazione e revoca di record di pairing o token dispositivo.                                        |
| `operator.approvals`    | API di approvazione exec e plugin.                                                                                                                                                                 |
| `operator.talk.secrets` | Lettura della configurazione Talk con i segreti inclusi.                                                                                                                                           |

Gli ambiti futuri sconosciuti `operator.*` richiedono una corrispondenza esatta, a meno che il chiamante non abbia
`operator.admin`.

## L'ambito del metodo è solo il primo controllo

Ogni RPC Gateway ha un ambito di metodo con privilegio minimo. Tale ambito di metodo decide
se la richiesta può raggiungere l'handler. Alcuni handler applicano poi controlli
più restrittivi al momento dell'approvazione in base all'elemento concreto che viene approvato o mutato.

Esempi:

- `device.pair.approve` è raggiungibile con `operator.pairing`, ma l'approvazione di un
  dispositivo operatore può solo creare o preservare ambiti che il chiamante possiede già.
- `node.pair.approve` è raggiungibile con `operator.pairing`, poi deriva ambiti
  di approvazione extra dall'elenco dei comandi del nodo in sospeso.
- `chat.send` è normalmente un metodo con ambito di scrittura, ma `/config set`
  e `/config unset` persistenti richiedono `operator.admin` a livello di comando.

Questo consente agli operatori con ambiti inferiori di eseguire azioni di pairing a basso rischio senza rendere
tutte le approvazioni di pairing riservate agli amministratori.

## Approvazioni di pairing dei dispositivi

I record di pairing dei dispositivi sono la fonte durevole dei ruoli e degli ambiti approvati.
I dispositivi già associati non ottengono silenziosamente un accesso più ampio: le riconnessioni che richiedono
un ruolo più ampio o ambiti più ampi creano una nuova richiesta di upgrade in sospeso.

Quando si approva una richiesta di dispositivo:

- Una richiesta senza ruolo operatore non richiede l'approvazione dell'ambito del token operatore.
- Una richiesta per un ruolo dispositivo non operatore, come `node`, richiede
  `operator.admin`, anche quando `device.pair.approve` è raggiungibile con
  `operator.pairing`.
- Una richiesta per `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` o `operator.talk.secrets` richiede che il chiamante possieda
  tali ambiti, oppure `operator.admin`.
- Una richiesta per `operator.admin` richiede `operator.admin`.
- Una richiesta di riparazione senza ambiti espliciti può ereditare gli ambiti
  del token operatore esistente. Se quel token esistente ha ambito admin, l'approvazione richiede comunque
  `operator.admin`.

Le sessioni non admin con segreto condiviso e proxy attendibile possono approvare richieste di dispositivi operatore
solo entro i propri ambiti operatore dichiarati. L'approvazione di ruoli non operatore
è riservata agli admin anche quando tali sessioni possono altrimenti usare
`operator.pairing`.

Per le sessioni con token di dispositivi associati, anche la gestione è limitata a sé stesse a meno che il
chiamante non abbia `operator.admin`: i chiamanti non admin vedono solo le proprie voci di pairing,
possono approvare o rifiutare solo la propria richiesta in sospeso e possono ruotare,
revocare o rimuovere solo la propria voce dispositivo.

## Approvazioni di pairing Node

Il vecchio `node.pair.*` usa un archivio di pairing dei nodi separato e di proprietà del Gateway. I nodi WS
usano il pairing dei dispositivi con `role: node`, ma si applica lo stesso vocabolario
a livello di approvazione.

`node.pair.approve` usa l'elenco dei comandi della richiesta in sospeso per derivare ulteriori
ambiti richiesti:

- Richiesta senza comandi: `operator.pairing`
- Comandi del nodo non exec: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

Il pairing dei nodi stabilisce identità e fiducia. Non sostituisce la policy di approvazione exec
`system.run` propria del nodo.

## Autenticazione con segreto condiviso

L'autenticazione con token/password Gateway condivisi è trattata come accesso operatore attendibile per
quel Gateway. Le superfici HTTP compatibili con OpenAI, `/tools/invoke` e gli endpoint HTTP della cronologia
sessione ripristinano il normale set completo predefinito di ambiti operatore per
l'autenticazione bearer con segreto condiviso, anche se un chiamante invia ambiti dichiarati più ristretti.

Le modalità con identità, come l'autenticazione proxy attendibile o `none` per ingress privato,
possono comunque rispettare ambiti dichiarati espliciti. Usa Gateway separati per una vera
separazione dei confini di fiducia.
