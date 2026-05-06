---
read_when:
    - Implementare le approvazioni per l'associazione dei Node senza interfaccia utente macOS
    - Aggiunta di flussi CLI per l'approvazione dei nodi remoti
    - Estensione del protocollo Gateway con la gestione dei Node
summary: Abbinamento dei Node di proprietà del Gateway (Opzione B) per iOS e altri Node remoti
title: Abbinamento gestito dal Gateway
x-i18n:
    generated_at: "2026-05-06T08:52:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75713e04e37dcbae151d170e2eb459d0e9b9a799c64a10db731b61d7b53998b4
    source_path: gateway/pairing.md
    workflow: 16
---

Nel pairing gestito dal Gateway, il **Gateway** è la fonte di verità per stabilire quali nodi
sono autorizzati a unirsi. Le UI (app macOS, client futuri) sono solo frontend che
approvano o rifiutano le richieste in sospeso.

**Importante:** i nodi WS usano il **pairing del dispositivo** (ruolo `node`) durante `connect`.
`node.pair.*` è un archivio di pairing separato e **non** controlla l'handshake WS.
Solo i client che chiamano esplicitamente `node.pair.*` usano questo flusso.

## Concetti

- **Richiesta in sospeso**: un nodo ha chiesto di unirsi; richiede approvazione.
- **Nodo associato**: nodo approvato con un token di autenticazione emesso.
- **Trasporto**: l'endpoint WS del Gateway inoltra le richieste ma non decide
  l'appartenenza. (Il supporto legacy del bridge TCP è stato rimosso.)

## Come funziona il pairing

1. Un nodo si connette al WS del Gateway e richiede il pairing.
2. Il Gateway archivia una **richiesta in sospeso** ed emette `node.pair.requested`.
3. Approvi o rifiuti la richiesta (CLI o UI).
4. All'approvazione, il Gateway emette un **nuovo token** (i token vengono ruotati al nuovo pairing).
5. Il nodo si riconnette usando il token ed è ora "associato".

Le richieste in sospeso scadono automaticamente dopo **5 minuti**.

## Flusso di lavoro CLI (adatto ad ambienti headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` mostra i nodi associati/connessi e le loro capacità.

## Superficie API (protocollo del Gateway)

Eventi:

- `node.pair.requested` - emesso quando viene creata una nuova richiesta in sospeso.
- `node.pair.resolved` - emesso quando una richiesta viene approvata/rifiutata/scaduta.

Metodi:

- `node.pair.request` - crea o riusa una richiesta in sospeso.
- `node.pair.list` - elenca nodi in sospeso + associati (`operator.pairing`).
- `node.pair.approve` - approva una richiesta in sospeso (emette token).
- `node.pair.reject` - rifiuta una richiesta in sospeso.
- `node.pair.remove` - rimuove una voce obsoleta di nodo associato.
- `node.pair.verify` - verifica `{ nodeId, token }`.

Note:

- `node.pair.request` è idempotente per nodo: le chiamate ripetute restituiscono la stessa
  richiesta in sospeso.
- Le richieste ripetute per lo stesso nodo in sospeso aggiornano anche i metadati del nodo
  archiviati e l'ultima istantanea dichiarata dei comandi in allowlist per la visibilità dell'operatore.
- L'approvazione genera **sempre** un token nuovo; nessun token viene mai restituito da
  `node.pair.request`.
- I livelli degli ambiti operatore e i controlli al momento dell'approvazione sono riassunti in
  [Ambiti operatore](/it/gateway/operator-scopes).
- Le richieste possono includere `silent: true` come suggerimento per flussi di approvazione automatica.
- `node.pair.approve` usa i comandi dichiarati della richiesta in sospeso per applicare
  ambiti di approvazione aggiuntivi:
  - richiesta senza comandi: `operator.pairing`
  - richiesta di comando non exec: `operator.pairing` + `operator.write`
  - richiesta `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
Il pairing dei nodi è un flusso di fiducia e identità più emissione di token. **Non** vincola la superficie live dei comandi del nodo per nodo.

- I comandi live del nodo derivano da ciò che il nodo dichiara alla connessione dopo l'applicazione della policy globale del Gateway per i comandi del nodo (`gateway.nodes.allowCommands` e `denyCommands`).
- La policy per consentire e chiedere `system.run` per singolo nodo vive sul nodo in `exec.approvals.node.*`, non nel record di pairing.

</Warning>

## Controllo dei comandi Node (2026.3.31+)

<Warning>
**Modifica incompatibile:** a partire da `2026.3.31`, i comandi del nodo sono disabilitati finché il pairing del nodo non viene approvato. Il solo pairing del dispositivo non è più sufficiente per esporre i comandi del nodo dichiarati.
</Warning>

Quando un nodo si connette per la prima volta, il pairing viene richiesto automaticamente. Finché la richiesta di pairing non viene approvata, tutti i comandi del nodo in sospeso provenienti da quel nodo vengono filtrati e non verranno eseguiti. Una volta stabilita la fiducia tramite approvazione del pairing, i comandi dichiarati del nodo diventano disponibili in base alla normale policy dei comandi.

Questo significa:

- I nodi che in precedenza si affidavano al solo pairing del dispositivo per esporre comandi devono ora completare il pairing del nodo.
- I comandi accodati prima dell'approvazione del pairing vengono eliminati, non rinviati.

## Confini di fiducia degli eventi Node (2026.3.31+)

<Warning>
**Modifica incompatibile:** le esecuzioni originate dal nodo ora restano su una superficie attendibile ridotta.
</Warning>

I riepiloghi originati dal nodo e gli eventi di sessione correlati sono limitati alla superficie attendibile prevista. I flussi guidati da notifiche o attivati dal nodo che in precedenza dipendevano da un accesso più ampio agli strumenti dell'host o della sessione potrebbero richiedere adeguamenti. Questo rafforzamento garantisce che gli eventi del nodo non possano scalare ad accesso agli strumenti a livello host oltre quanto consentito dal confine di fiducia del nodo.

Gli aggiornamenti durevoli della presenza del nodo seguono lo stesso confine di identità. L'evento `node.presence.alive` viene
accettato solo da sessioni di dispositivi nodo autenticati e aggiorna i metadati di pairing solo quando
l'identità dispositivo/nodo è già associata. I valori `client.id` autodichiarati non sono sufficienti per scrivere
lo stato dell'ultima visualizzazione.

## Approvazione automatica (app macOS)

L'app macOS può facoltativamente tentare una **approvazione silenziosa** quando:

- la richiesta è contrassegnata con `silent`, e
- l'app può verificare una connessione SSH all'host gateway usando lo stesso utente.

Se l'approvazione silenziosa non riesce, torna al normale prompt "Approva/Rifiuta".

## Approvazione automatica dei dispositivi con CIDR attendibili

Il pairing dei dispositivi WS per `role: node` resta manuale per impostazione predefinita. Per le reti
di nodi private in cui il Gateway considera già attendibile il percorso di rete, gli operatori possono
aderire con CIDR espliciti o IP esatti:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Confine di sicurezza:

- Disabilitato quando `gateway.nodes.pairing.autoApproveCidrs` non è impostato.
- Non esiste una modalità di approvazione automatica indiscriminata per LAN o rete privata.
- È idoneo solo il pairing di un dispositivo `role: node` nuovo senza ambiti richiesti.
- I client operatore, browser, Control UI e WebChat restano manuali.
- Gli upgrade di ruolo, ambito, metadati e chiave pubblica restano manuali.
- I percorsi con intestazione trusted-proxy su local loopback dello stesso host non sono idonei perché quel
  percorso può essere falsificato da chiamanti locali.

## Approvazione automatica degli upgrade dei metadati

Quando un dispositivo già associato si riconnette con sole modifiche ai metadati non sensibili
(per esempio, nome visualizzato o suggerimenti sulla piattaforma client), OpenClaw tratta
questo come un `metadata-upgrade`. L'approvazione automatica silenziosa è ristretta: si applica solo
alle riconnessioni locali attendibili non browser che hanno già dimostrato il possesso di credenziali locali
o condivise, incluse le riconnessioni di app native sullo stesso host dopo modifiche dei metadati della
versione del sistema operativo. I client browser/Control UI e i client remoti continuano a
usare il flusso esplicito di nuova approvazione. Gli upgrade di ambito (da lettura a scrittura/admin) e
le modifiche della chiave pubblica **non** sono idonei per l'approvazione automatica dei metadata-upgrade -
restano richieste esplicite di nuova approvazione.

## Helper per pairing QR

`/pair qr` rende il payload di pairing come contenuto multimediale strutturato affinché i client mobili e
browser possano scansionarlo direttamente.

L'eliminazione di un dispositivo elimina anche eventuali richieste di pairing in sospeso obsolete per quell'
ID dispositivo, quindi `nodes pending` non mostra righe orfane dopo una revoca.

## Località e intestazioni inoltrate

Il pairing del Gateway tratta una connessione come loopback solo quando sia il socket grezzo
sia qualsiasi evidenza di proxy upstream concordano. Se una richiesta arriva su loopback ma
contiene intestazioni `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`
che puntano a un'origine non locale, tale evidenza da intestazioni inoltrate invalida
l'affermazione di località loopback. Il percorso di pairing richiede quindi approvazione esplicita
invece di trattare silenziosamente la richiesta come una connessione dallo stesso host. Vedi
[Autenticazione proxy attendibile](/it/gateway/trusted-proxy-auth) per la regola equivalente sull'
autenticazione operatore.

## Archiviazione (locale, privata)

Lo stato di pairing è archiviato sotto la directory di stato del Gateway (predefinita `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Se sovrascrivi `OPENCLAW_STATE_DIR`, la cartella `nodes/` si sposta con essa.

Note di sicurezza:

- I token sono segreti; tratta `paired.json` come sensibile.
- La rotazione di un token richiede una nuova approvazione (o l'eliminazione della voce del nodo).

## Comportamento del trasporto

- Il trasporto è **stateless**; non archivia l'appartenenza.
- Se il Gateway è offline o il pairing è disabilitato, i nodi non possono associarsi.
- Se il Gateway è in modalità remota, il pairing avviene comunque nell'archivio del Gateway remoto.

## Correlati

- [Pairing dei canali](/it/channels/pairing)
- [Nodi](/it/nodes)
- [CLI dispositivi](/it/cli/devices)
