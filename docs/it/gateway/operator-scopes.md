---
read_when:
    - Debug degli errori di ambito dell'operatore mancante
    - Revisione delle approvazioni di associazione di dispositivi o Node
    - Aggiunta o classificazione dei metodi RPC del Gateway
summary: Ruoli degli operatori, ambiti e controlli al momento dell'approvazione per i client Gateway
title: Ambiti dell'operatore
x-i18n:
    generated_at: "2026-05-03T21:34:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 48f59f96b41333af9124ad4083ac5442eedb2d6cebdfff74e3ba256f06d36add
    source_path: gateway/operator-scopes.md
    workflow: 16
---

Gli ambiti operatore definiscono cosa un client Gateway può fare dopo essersi autenticato.
Sono una protezione del piano di controllo all'interno di un singolo dominio operatore Gateway attendibile,
non isolamento multi-tenant ostile. Se ti serve una separazione forte tra
persone, team o macchine, esegui Gateway separati con utenti del sistema operativo o
host separati.

Correlati: [Sicurezza](/it/gateway/security), [Protocollo Gateway](/it/gateway/protocol),
[Abbinamento Gateway](/it/gateway/pairing), [CLI dei dispositivi](/it/cli/devices).

## Ruoli

I client WebSocket Gateway si connettono con un ruolo:

- `operator`: client del piano di controllo come CLI, UI di controllo, automazione e
  processi helper attendibili.
- `node`: host di capacità come macOS, iOS, Android o nodi headless che
  espongono comandi tramite `node.invoke`.

I metodi RPC operatore richiedono il ruolo `operator`. I metodi originati dai nodi
richiedono il ruolo `node`.

## Livelli di ambito

| Ambito                  | Significato                                                                                                                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `operator.read`         | Stato in sola lettura, liste, catalogo, log, letture di sessione e altre chiamate del piano di controllo che non modificano dati.                                                              |
| `operator.write`        | Normali azioni operatore mutanti, come inviare messaggi, invocare strumenti, aggiornare le impostazioni talk/voice e inoltrare comandi ai nodi. Soddisfa anche `operator.read`.               |
| `operator.admin`        | Accesso amministrativo al piano di controllo. Soddisfa ogni ambito `operator.*`. Richiesto per mutazione della configurazione, aggiornamenti, hook nativi, namespace riservati sensibili e approvazioni ad alto rischio. |
| `operator.pairing`      | Gestione dell'abbinamento di dispositivi e nodi, inclusi elenco, approvazione, rifiuto, rimozione, rotazione e revoca di record di abbinamento o token dispositivo.                          |
| `operator.approvals`    | API di approvazione exec e Plugin.                                                                                                                                                            |
| `operator.talk.secrets` | Lettura della configurazione Talk con i segreti inclusi.                                                                                                                                       |

Ambiti futuri `operator.*` sconosciuti richiedono una corrispondenza esatta, a meno che il chiamante abbia
`operator.admin`.

## L'ambito del metodo è solo il primo filtro

Ogni RPC Gateway ha un ambito di metodo con privilegio minimo. Tale ambito di metodo decide
se la richiesta può raggiungere l'handler. Alcuni handler applicano poi controlli più rigorosi
al momento dell'approvazione in base all'elemento concreto che viene approvato o modificato.

Esempi:

- `device.pair.approve` è raggiungibile con `operator.pairing`, ma l'approvazione di un
  dispositivo operatore può solo creare o preservare ambiti che il chiamante possiede già.
- `node.pair.approve` è raggiungibile con `operator.pairing`, poi deriva ambiti di
  approvazione aggiuntivi dall'elenco di comandi del nodo in sospeso.
- `chat.send` è normalmente un metodo con ambito di scrittura, ma `/config set`
  e `/config unset` persistenti richiedono `operator.admin` a livello di comando.

Questo consente agli operatori con ambiti inferiori di eseguire azioni di abbinamento a basso rischio senza rendere
tutte le approvazioni di abbinamento riservate agli amministratori.

## Approvazioni di abbinamento dispositivo

I record di abbinamento dispositivo sono la fonte durevole dei ruoli e degli ambiti approvati.
I dispositivi già abbinati non ottengono silenziosamente un accesso più ampio: le riconnessioni che richiedono
un ruolo più ampio o ambiti più ampi creano una nuova richiesta di upgrade in sospeso.

Quando si approva una richiesta dispositivo:

- Una richiesta senza ruolo operatore non richiede approvazione dell'ambito del token operatore.
- Una richiesta per `operator.read`, `operator.write`, `operator.approvals`,
  `operator.pairing` o `operator.talk.secrets` richiede che il chiamante possieda
  quegli ambiti, oppure `operator.admin`.
- Una richiesta per `operator.admin` richiede `operator.admin`.
- Una richiesta di riparazione senza ambiti espliciti può ereditare gli ambiti del token
  operatore esistente. Se quel token esistente ha ambito admin, l'approvazione richiede comunque
  `operator.admin`.

Per le sessioni token di dispositivi abbinati, la gestione è limitata a se stessi, a meno che il chiamante
abbia anche `operator.admin`: i chiamanti non admin possono ruotare, revocare o rimuovere solo
la propria voce dispositivo.

## Approvazioni di abbinamento nodo

Il vecchio `node.pair.*` usa un archivio di abbinamento nodi separato di proprietà del Gateway. I nodi WS
usano l'abbinamento dispositivo con `role: node`, ma si applica lo stesso vocabolario del livello di approvazione.

`node.pair.approve` usa l'elenco di comandi della richiesta in sospeso per derivare ambiti
richiesti aggiuntivi:

- Richiesta senza comandi: `operator.pairing`
- Comandi nodo non exec: `operator.pairing` + `operator.write`
- `system.run`, `system.run.prepare` o `system.which`:
  `operator.pairing` + `operator.admin`

L'abbinamento nodo stabilisce identità e fiducia. Non sostituisce la policy di approvazione exec
`system.run` propria del nodo.

## Autenticazione con segreto condiviso

L'autenticazione con token/password Gateway condivisi è trattata come accesso operatore attendibile per
quel Gateway. Le superfici HTTP compatibili con OpenAI e `/tools/invoke` ripristinano il
normale set completo di ambiti operatore predefiniti per l'autenticazione bearer con segreto condiviso, anche se un
chiamante invia ambiti dichiarati più ristretti.

Le modalità con identità, come l'autenticazione proxy attendibile o `none` per ingress privato,
possono comunque rispettare ambiti dichiarati espliciti. Usa Gateway separati per una vera separazione dei
confini di fiducia.
