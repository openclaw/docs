---
read_when:
    - Implementare le approvazioni di abbinamento dei Node senza interfaccia utente macOS
    - Aggiunta di flussi CLI per approvare nodi remoti
    - Estensione del protocollo Gateway con la gestione dei Node
summary: Associazione dei nodi gestita dal Gateway (opzione B) per iOS e altri nodi remoti
title: Abbinamento gestito dal Gateway
x-i18n:
    generated_at: "2026-05-03T21:34:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0ce46d487990860ac572c27cc9dd83839e87329132e2624944660bafaf723de
    source_path: gateway/pairing.md
    workflow: 16
---

Nell'abbinamento gestito dal Gateway, il **Gateway** è la fonte di verità per stabilire quali nodi
sono autorizzati a unirsi. Le UI (app macOS, client futuri) sono solo frontend che
approvano o rifiutano le richieste in sospeso.

**Importante:** i nodi WS usano l'**abbinamento dei dispositivi** (ruolo `node`) durante `connect`.
`node.pair.*` è un archivio di abbinamento separato e **non** controlla l'handshake WS.
Solo i client che chiamano esplicitamente `node.pair.*` usano questo flusso.

## Concetti

- **Richiesta in sospeso**: un nodo ha chiesto di unirsi; richiede approvazione.
- **Nodo abbinato**: nodo approvato con un token di autenticazione emesso.
- **Trasporto**: l'endpoint WS del Gateway inoltra le richieste ma non decide
  l'appartenenza. (Il supporto legacy per il bridge TCP è stato rimosso.)

## Come funziona l'abbinamento

1. Un nodo si connette al WS del Gateway e richiede l'abbinamento.
2. Il Gateway archivia una **richiesta in sospeso** ed emette `node.pair.requested`.
3. Approvi o rifiuti la richiesta (CLI o UI).
4. All'approvazione, il Gateway emette un **nuovo token** (i token vengono ruotati al nuovo abbinamento).
5. Il nodo si riconnette usando il token e ora è “abbinato”.

Le richieste in sospeso scadono automaticamente dopo **5 minuti**.

## Flusso di lavoro CLI (adatto ad ambienti senza interfaccia)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` mostra i nodi abbinati/connessi e le loro capability.

## Superficie API (protocollo gateway)

Eventi:

- `node.pair.requested` — emesso quando viene creata una nuova richiesta in sospeso.
- `node.pair.resolved` — emesso quando una richiesta viene approvata/rifiutata/scaduta.

Metodi:

- `node.pair.request` — crea o riutilizza una richiesta in sospeso.
- `node.pair.list` — elenca nodi in sospeso + abbinati (`operator.pairing`).
- `node.pair.approve` — approva una richiesta in sospeso (emette un token).
- `node.pair.reject` — rifiuta una richiesta in sospeso.
- `node.pair.remove` — rimuove una voce obsoleta di nodo abbinato.
- `node.pair.verify` — verifica `{ nodeId, token }`.

Note:

- `node.pair.request` è idempotente per nodo: chiamate ripetute restituiscono la stessa
  richiesta in sospeso.
- Le richieste ripetute per lo stesso nodo in sospeso aggiornano anche i metadati
  archiviati del nodo e lo snapshot più recente dei comandi dichiarati consentiti per la visibilità dell'operatore.
- L'approvazione genera **sempre** un token nuovo; nessun token viene mai restituito da
  `node.pair.request`.
- I livelli degli ambiti operatore e i controlli al momento dell'approvazione sono riassunti in
  [Ambiti operatore](/it/gateway/operator-scopes).
- Le richieste possono includere `silent: true` come suggerimento per i flussi di approvazione automatica.
- `node.pair.approve` usa i comandi dichiarati della richiesta in sospeso per applicare
  ambiti di approvazione aggiuntivi:
  - richiesta senza comandi: `operator.pairing`
  - richiesta di comandi non-exec: `operator.pairing` + `operator.write`
  - richiesta `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
L'abbinamento dei nodi è un flusso di fiducia e identità più emissione di token. **Non** fissa la superficie dei comandi del nodo live per nodo.

- I comandi live del nodo provengono da ciò che il nodo dichiara alla connessione dopo l'applicazione della policy globale dei comandi dei nodi del gateway (`gateway.nodes.allowCommands` e `denyCommands`).
- La policy per consentire e chiedere `system.run` per nodo risiede sul nodo in `exec.approvals.node.*`, non nel record di abbinamento.

</Warning>

## Controllo dei comandi del nodo (2026.3.31+)

<Warning>
**Modifica incompatibile:** a partire da `2026.3.31`, i comandi del nodo sono disabilitati finché l'abbinamento del nodo non viene approvato. Il solo abbinamento del dispositivo non basta più per esporre i comandi dichiarati del nodo.
</Warning>

Quando un nodo si connette per la prima volta, l'abbinamento viene richiesto automaticamente. Finché la richiesta di abbinamento non viene approvata, tutti i comandi del nodo in sospeso da quel nodo vengono filtrati e non verranno eseguiti. Una volta stabilita la fiducia tramite approvazione dell'abbinamento, i comandi dichiarati del nodo diventano disponibili nel rispetto della normale policy dei comandi.

Questo significa:

- I nodi che in precedenza facevano affidamento solo sull'abbinamento del dispositivo per esporre comandi devono ora completare l'abbinamento del nodo.
- I comandi accodati prima dell'approvazione dell'abbinamento vengono scartati, non differiti.

## Confini di fiducia degli eventi del nodo (2026.3.31+)

<Warning>
**Modifica incompatibile:** le esecuzioni originate dal nodo ora restano su una superficie attendibile ridotta.
</Warning>

I riepiloghi originati dal nodo e gli eventi di sessione correlati sono limitati alla superficie attendibile prevista. I flussi guidati da notifiche o attivati dal nodo che in precedenza facevano affidamento su un accesso più ampio agli strumenti host o di sessione potrebbero richiedere adeguamenti. Questo rafforzamento assicura che gli eventi del nodo non possano escalationare verso l'accesso a strumenti a livello host oltre quanto consentito dal confine di fiducia del nodo.

Gli aggiornamenti durevoli della presenza del nodo seguono lo stesso confine di identità. L'evento `node.presence.alive` è
accettato solo da sessioni di dispositivi nodo autenticati e aggiorna i metadati di abbinamento solo quando
l'identità dispositivo/nodo è già abbinata. I valori `client.id` autodichiarati non bastano per scrivere
lo stato dell'ultima visualizzazione.

## Approvazione automatica (app macOS)

L'app macOS può facoltativamente tentare un'**approvazione silenziosa** quando:

- la richiesta è contrassegnata come `silent`, e
- l'app può verificare una connessione SSH all'host gateway usando lo stesso utente.

Se l'approvazione silenziosa fallisce, torna al normale prompt “Approva/Rifiuta”.

## Approvazione automatica dei dispositivi con CIDR attendibili

L'abbinamento dei dispositivi WS per `role: node` resta manuale per impostazione predefinita. Per reti
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
- Non esiste una modalità di approvazione automatica generale per LAN o reti private.
- Solo l'abbinamento fresco di dispositivi `role: node` senza ambiti richiesti è idoneo.
- I client operatore, browser, Control UI e WebChat restano manuali.
- Gli upgrade di ruolo, ambito, metadati e chiave pubblica restano manuali.
- I percorsi header proxy attendibili local loopback sullo stesso host non sono idonei perché quel
  percorso può essere falsificato da chiamanti locali.

## Approvazione automatica degli upgrade di metadati

Quando un dispositivo già abbinato si riconnette con sole modifiche non sensibili dei metadati
(per esempio, nome visualizzato o suggerimenti sulla piattaforma client), OpenClaw lo tratta
come un `metadata-upgrade`. L'approvazione automatica silenziosa è ristretta: si applica solo
a riconnessioni locali attendibili non browser che hanno già dimostrato il possesso di credenziali locali
o condivise, incluse le riconnessioni di app native sullo stesso host dopo modifiche ai metadati della
versione del sistema operativo. I client browser/Control UI e i client remoti continuano
a usare il flusso esplicito di nuova approvazione. Gli upgrade di ambito (da lettura a scrittura/admin) e
le modifiche della chiave pubblica **non** sono idonei per l'approvazione automatica del metadata-upgrade —
restano richieste esplicite di nuova approvazione.

## Helper di abbinamento QR

`/pair qr` rende il payload di abbinamento come media strutturato, così i client mobile e
browser possono scansionarlo direttamente.

L'eliminazione di un dispositivo ripulisce anche eventuali richieste di abbinamento in sospeso obsolete per quell'
id dispositivo, quindi `nodes pending` non mostra righe orfane dopo una revoca.

## Località e header inoltrati

L'abbinamento Gateway considera una connessione come loopback solo quando sia il socket grezzo
sia qualsiasi prova di proxy a monte concordano. Se una richiesta arriva su loopback ma
porta header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`
che puntano a un'origine non locale, quella prova di header inoltrato squalifica
l'affermazione di località loopback. Il percorso di abbinamento richiede quindi approvazione esplicita
invece di trattare silenziosamente la richiesta come una connessione dallo stesso host. Vedi
[Autenticazione proxy attendibile](/it/gateway/trusted-proxy-auth) per la regola equivalente sull'
autenticazione operatore.

## Archiviazione (locale, privata)

Lo stato di abbinamento è archiviato nella directory di stato del Gateway (predefinita `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Se sovrascrivi `OPENCLAW_STATE_DIR`, la cartella `nodes/` si sposta con essa.

Note di sicurezza:

- I token sono segreti; tratta `paired.json` come sensibile.
- La rotazione di un token richiede una nuova approvazione (o l'eliminazione della voce del nodo).

## Comportamento del trasporto

- Il trasporto è **stateless**; non archivia l'appartenenza.
- Se il Gateway è offline o l'abbinamento è disabilitato, i nodi non possono abbinarsi.
- Se il Gateway è in modalità remota, l'abbinamento avviene comunque sull'archivio del Gateway remoto.

## Correlati

- [Abbinamento canale](/it/channels/pairing)
- [Nodi](/it/nodes)
- [CLI dispositivi](/it/cli/devices)
