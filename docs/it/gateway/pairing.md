---
read_when:
    - Implementazione delle approvazioni di associazione dei nodi senza UI macOS
    - Aggiunta di flussi CLI per approvare nodi remoti
    - Estensione del protocollo Gateway con la gestione dei nodi
summary: Associazione dei nodi gestita dal Gateway (opzione B) per iOS e altri nodi remoti
title: Abbinamento gestito dal Gateway
x-i18n:
    generated_at: "2026-06-27T17:34:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aefddafaef419fc59b04ee17dae8ef21685b4f514f4286530bf07362663a8996
    source_path: gateway/pairing.md
    workflow: 16
---

Nell'associazione di proprietà del Gateway, il **Gateway** è la fonte di verità per stabilire quali nodi
sono autorizzati a unirsi. Le UI (app macOS, client futuri) sono solo frontend che
approvano o rifiutano le richieste in sospeso.

**Importante:** i nodi WS usano l'**associazione del dispositivo** (ruolo `node`) durante `connect`.
`node.pair.*` è un archivio di associazione separato e **non** controlla l'handshake WS.
Solo i client che chiamano esplicitamente `node.pair.*` usano questo flusso.

## Concetti

- **Richiesta in sospeso**: un nodo ha chiesto di unirsi; richiede approvazione.
- **Nodo associato**: nodo approvato con un token di autenticazione emesso.
- **Trasporto**: l'endpoint WS del Gateway inoltra le richieste ma non decide
  l'appartenenza. (Il supporto al bridge TCP legacy è stato rimosso.)

## Come funziona l'associazione

1. Un nodo si connette al WS del Gateway e richiede l'associazione.
2. Il Gateway archivia una **richiesta in sospeso** ed emette `node.pair.requested`.
3. Approvi o rifiuti la richiesta (CLI o UI).
4. All'approvazione, il Gateway emette un **nuovo token** (i token vengono ruotati alla riassociazione).
5. Il nodo si riconnette usando il token e ora è "associato".

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

## Superficie API (protocollo Gateway)

Eventi:

- `node.pair.requested` - emesso quando viene creata una nuova richiesta in sospeso.
- `node.pair.resolved` - emesso quando una richiesta viene approvata/rifiutata/scaduta.

Metodi:

- `node.pair.request` - crea o riutilizza una richiesta in sospeso.
- `node.pair.list` - elenca nodi in sospeso + associati (`operator.pairing`).
- `node.pair.approve` - approva una richiesta in sospeso (emette token).
- `node.pair.reject` - rifiuta una richiesta in sospeso.
- `node.pair.remove` - rimuove un nodo associato. Per le associazioni basate su dispositivo,
  revoca il ruolo `node` del dispositivo: modifica `devices/paired.json` e
  invalida/disconnette le sessioni con ruolo nodo di quel dispositivo. Un dispositivo a **ruoli misti**
  (ad es. contiene anche `operator`) mantiene la sua riga e perde solo il ruolo `node`;
  una riga di dispositivo solo nodo viene eliminata. Rimuove anche ogni voce di associazione nodo legacy
  di proprietà del gateway corrispondente. Authz: `operator.pairing` può rimuovere
  righe nodo non operatore; un chiamante con token dispositivo che revoca il proprio ruolo nodo su
  un dispositivo a ruoli misti richiede inoltre `operator.admin`.
- `node.pair.verify` - verifica `{ nodeId, token }`.

Note:

- `node.pair.request` è idempotente per nodo: chiamate ripetute restituiscono la stessa
  richiesta in sospeso.
- Le richieste ripetute per lo stesso nodo in sospeso aggiornano anche i metadati del nodo archiviati
  e l'ultimo snapshot dei comandi dichiarati in allowlist per la visibilità dell'operatore.
- L'approvazione genera **sempre** un token nuovo; nessun token viene mai restituito da
  `node.pair.request`.
- I livelli di ambito dell'operatore e i controlli al momento dell'approvazione sono riassunti in
  [Ambiti operatore](/it/gateway/operator-scopes).
- Le richieste possono includere `silent: true` come suggerimento per i flussi di approvazione automatica.
- `node.pair.approve` usa i comandi dichiarati della richiesta in sospeso per applicare
  ambiti di approvazione extra:
  - richiesta senza comandi: `operator.pairing`
  - richiesta di comando non exec: `operator.pairing` + `operator.write`
  - richiesta `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
L'associazione dei nodi è un flusso di fiducia e identità più emissione di token. **Non** vincola la superficie di comandi live del nodo per nodo.

- I comandi live del nodo provengono da ciò che il nodo dichiara alla connessione dopo l'applicazione della policy globale dei comandi nodo del gateway (`gateway.nodes.allowCommands` e `denyCommands`).
- La policy per consentire e chiedere `system.run` per nodo risiede sul nodo in `exec.approvals.node.*`, non nel record di associazione.

</Warning>

## Controllo dei comandi nodo (2026.3.31+)

<Warning>
**Modifica incompatibile:** a partire da `2026.3.31`, i comandi nodo sono disabilitati finché l'associazione del nodo non viene approvata. La sola associazione del dispositivo non è più sufficiente per esporre i comandi nodo dichiarati.
</Warning>

Quando un nodo si connette per la prima volta, l'associazione viene richiesta automaticamente. Finché la richiesta di associazione non viene approvata, tutti i comandi nodo in sospeso provenienti da quel nodo vengono filtrati e non verranno eseguiti. Una volta stabilita la fiducia tramite l'approvazione dell'associazione, i comandi dichiarati del nodo diventano disponibili soggetti alla normale policy dei comandi.

Questo significa:

- I nodi che in precedenza si basavano solo sull'associazione del dispositivo per esporre i comandi ora devono completare l'associazione del nodo.
- I comandi accodati prima dell'approvazione dell'associazione vengono scartati, non posticipati.

## Confini di fiducia degli eventi nodo (2026.3.31+)

<Warning>
**Modifica incompatibile:** le esecuzioni originate dai nodi ora restano su una superficie fidata ridotta.
</Warning>

I riepiloghi originati dai nodi e gli eventi di sessione correlati sono limitati alla superficie fidata prevista. I flussi guidati da notifiche o attivati da nodi che in precedenza si basavano su un accesso più ampio agli strumenti dell'host o della sessione potrebbero richiedere modifiche. Questo rafforzamento garantisce che gli eventi nodo non possano scalare verso accessi agli strumenti a livello host oltre quanto consentito dal confine di fiducia del nodo.

Gli aggiornamenti durevoli della presenza dei nodi seguono lo stesso confine di identità. L'evento `node.presence.alive` è
accettato solo da sessioni di dispositivi nodo autenticati e aggiorna i metadati di associazione solo quando
l'identità dispositivo/nodo è già associata. I valori `client.id` autodichiarati non sono sufficienti per scrivere
lo stato dell'ultimo accesso.

## Approvazione automatica (app macOS)

L'app macOS può facoltativamente tentare un'**approvazione silenziosa** quando:

- la richiesta è contrassegnata come `silent`, e
- l'app può verificare una connessione SSH all'host gateway usando lo stesso utente.

Se l'approvazione silenziosa fallisce, torna al normale prompt "Approva/Rifiuta".

## Approvazione automatica dei dispositivi tramite CIDR fidati

L'associazione dei dispositivi WS per `role: node` resta manuale per impostazione predefinita. Per reti
di nodi private in cui il Gateway considera già fidato il percorso di rete, gli operatori possono
attivarla con CIDR espliciti o IP esatti:

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

- Disabilitata quando `gateway.nodes.pairing.autoApproveCidrs` non è impostato.
- Non esiste alcuna modalità di approvazione automatica generale per LAN o reti private.
- È idonea solo una nuova associazione di dispositivo `role: node` senza ambiti richiesti.
- I client operatore, browser, Control UI e WebChat restano manuali.
- Aggiornamenti di ruolo, ambito, metadati e chiave pubblica restano manuali.
- I percorsi con header trusted-proxy di local loopback sullo stesso host non sono idonei perché quel
  percorso può essere falsificato da chiamanti locali.

## Approvazione automatica degli aggiornamenti dei metadati

Quando un dispositivo già associato si riconnette con sole modifiche a metadati non sensibili
(ad esempio, nome visualizzato o suggerimenti sulla piattaforma client), OpenClaw lo tratta
come un `metadata-upgrade`. L'approvazione automatica silenziosa è ristretta: si applica solo
alle riconnessioni locali fidate non browser che hanno già dimostrato il possesso di credenziali locali
o condivise, incluse le riconnessioni di app native sullo stesso host dopo modifiche ai metadati della
versione del sistema operativo. I client browser/Control UI e i client remoti usano ancora
il flusso esplicito di riapprovazione. Gli upgrade di ambito (da lettura a scrittura/admin) e
le modifiche alla chiave pubblica **non** sono idonei per l'approvazione automatica del metadata-upgrade -
restano richieste esplicite di riapprovazione.

## Helper per associazione QR

`/pair qr` rende il payload di associazione come media strutturato affinché i client mobili e
browser possano scansionarlo direttamente.

L'eliminazione di un dispositivo ripulisce anche eventuali richieste di associazione in sospeso obsolete per quell'
ID dispositivo, quindi `nodes pending` non mostra righe orfane dopo una revoca.

## Località e header inoltrati

L'associazione del Gateway considera una connessione come loopback solo quando sia il socket grezzo
sia qualsiasi prova del proxy upstream concordano. Se una richiesta arriva su loopback ma
trasporta evidenze negli header `Forwarded`, qualsiasi `X-Forwarded-*` o `X-Real-IP`, tali
evidenze degli header inoltrati squalificano la dichiarazione di località loopback. Il percorso di associazione
richiede quindi approvazione esplicita invece di trattare silenziosamente la richiesta come
una connessione dallo stesso host. Consulta [Trusted Proxy Auth](/it/gateway/trusted-proxy-auth) per
la regola equivalente sull'autenticazione operatore.

## Archiviazione (locale, privata)

Lo stato di associazione è archiviato nella directory di stato del Gateway (predefinita `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Se sovrascrivi `OPENCLAW_STATE_DIR`, la cartella `nodes/` si sposta con essa.

Note di sicurezza:

- I token sono segreti; tratta `paired.json` come sensibile.
- La rotazione di un token richiede riapprovazione (o l'eliminazione della voce del nodo).

## Comportamento del trasporto

- Il trasporto è **stateless**; non archivia l'appartenenza.
- Se il Gateway è offline o l'associazione è disabilitata, i nodi non possono associarsi.
- Se il Gateway è in modalità remota, l'associazione avviene comunque rispetto all'archivio del Gateway remoto.

## Correlati

- [Associazione canale](/it/channels/pairing)
- [Nodi](/it/nodes)
- [CLI dispositivi](/it/cli/devices)
