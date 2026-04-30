---
read_when:
    - Implementazione delle approvazioni di abbinamento Node senza interfaccia utente macOS
    - Aggiunta di flussi CLI per approvare nodi remoti
    - Estensione del protocollo Gateway con la gestione dei nodi
summary: Associazione dei Node gestita dal Gateway (Opzione B) per iOS e altri Node remoti
title: Abbinamento gestito dal Gateway
x-i18n:
    generated_at: "2026-04-30T08:54:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c662b8f5c1bb44cfc306d42ae19ba1c8bc36e0d96130d730b322ee07e02cad8
    source_path: gateway/pairing.md
    workflow: 16
---

Nell'abbinamento gestito dal Gateway, il **Gateway** è la fonte di verità per stabilire quali nodi
sono autorizzati a unirsi. Le interfacce utente (app macOS, client futuri) sono solo frontend che
approvano o rifiutano le richieste in sospeso.

**Importante:** i nodi WS usano l'**abbinamento del dispositivo** (ruolo `node`) durante `connect`.
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
3. Approvi o rifiuti la richiesta (CLI o interfaccia utente).
4. Dopo l'approvazione, il Gateway emette un **nuovo token** (i token vengono ruotati al riabbinamento).
5. Il nodo si riconnette usando il token ed è ora “abbinato”.

Le richieste in sospeso scadono automaticamente dopo **5 minuti**.

## Flusso CLI (adatto ad ambienti headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` mostra i nodi abbinati/connessi e le loro capacità.

## Superficie API (protocollo Gateway)

Eventi:

- `node.pair.requested` — emesso quando viene creata una nuova richiesta in sospeso.
- `node.pair.resolved` — emesso quando una richiesta viene approvata/rifiutata/scaduta.

Metodi:

- `node.pair.request` — crea o riusa una richiesta in sospeso.
- `node.pair.list` — elenca nodi in sospeso + abbinati (`operator.pairing`).
- `node.pair.approve` — approva una richiesta in sospeso (emette token).
- `node.pair.reject` — rifiuta una richiesta in sospeso.
- `node.pair.remove` — rimuove una voce obsoleta di nodo abbinato.
- `node.pair.verify` — verifica `{ nodeId, token }`.

Note:

- `node.pair.request` è idempotente per nodo: chiamate ripetute restituiscono la stessa
  richiesta in sospeso.
- Le richieste ripetute per lo stesso nodo in sospeso aggiornano anche i metadati del nodo
  archiviati e l'ultimo snapshot consentito dei comandi dichiarati per la visibilità dell'operatore.
- L'approvazione genera **sempre** un token nuovo; nessun token viene mai restituito da
  `node.pair.request`.
- Le richieste possono includere `silent: true` come suggerimento per i flussi di approvazione automatica.
- `node.pair.approve` usa i comandi dichiarati della richiesta in sospeso per imporre
  ambiti di approvazione aggiuntivi:
  - richiesta senza comandi: `operator.pairing`
  - richiesta di comando non exec: `operator.pairing` + `operator.write`
  - richiesta `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
L'abbinamento del Node è un flusso di fiducia e identità, più emissione di token. **Non** fissa la superficie dei comandi live del nodo per singolo nodo.

- I comandi live del nodo provengono da ciò che il nodo dichiara alla connessione dopo l'applicazione della policy globale dei comandi dei nodi del gateway (`gateway.nodes.allowCommands` e `denyCommands`).
- La policy di autorizzazione e richiesta per `system.run` per singolo nodo risiede sul nodo in `exec.approvals.node.*`, non nel record di abbinamento.

</Warning>

## Controllo dei comandi del Node (2026.3.31+)

<Warning>
**Modifica incompatibile:** a partire da `2026.3.31`, i comandi dei nodi sono disabilitati finché l'abbinamento del nodo non viene approvato. Il solo abbinamento del dispositivo non è più sufficiente per esporre i comandi dichiarati del nodo.
</Warning>

Quando un nodo si connette per la prima volta, l'abbinamento viene richiesto automaticamente. Finché la richiesta di abbinamento non viene approvata, tutti i comandi in sospeso provenienti da quel nodo vengono filtrati e non saranno eseguiti. Una volta stabilita la fiducia tramite l'approvazione dell'abbinamento, i comandi dichiarati dal nodo diventano disponibili in base alla normale policy dei comandi.

Questo significa:

- I nodi che in precedenza si affidavano al solo abbinamento del dispositivo per esporre i comandi devono ora completare l'abbinamento del nodo.
- I comandi accodati prima dell'approvazione dell'abbinamento vengono eliminati, non differiti.

## Confini di fiducia degli eventi del Node (2026.3.31+)

<Warning>
**Modifica incompatibile:** le esecuzioni originate dal Node ora restano su una superficie fidata ridotta.
</Warning>

I riepiloghi originati dal nodo e gli eventi di sessione correlati sono limitati alla superficie fidata prevista. I flussi guidati da notifiche o attivatiati dal nodo che in precedenza si basavano su un accesso più ampio agli strumenti dell'host o della sessione potrebbero richiedere modifiche. Questo rafforzamento garantisce che gli eventi del nodo non possano aumentare i privilegi fino ad accedere agli strumenti a livello host oltre quanto consentito dal confine di fiducia del nodo.

Gli aggiornamenti durevoli di presenza del nodo seguono lo stesso confine di identità. L'evento `node.presence.alive` è
accettato solo da sessioni di dispositivo nodo autenticate e aggiorna i metadati di abbinamento solo quando
l'identità dispositivo/nodo è già abbinata. I valori `client.id` autodichiarati non sono sufficienti per scrivere
lo stato dell'ultima visualizzazione.

## Approvazione automatica (app macOS)

L'app macOS può opzionalmente tentare un'**approvazione silenziosa** quando:

- la richiesta è contrassegnata come `silent`, e
- l'app può verificare una connessione SSH all'host gateway usando lo stesso utente.

Se l'approvazione silenziosa non riesce, viene ripristinato il normale prompt “Approva/Rifiuta”.

## Approvazione automatica dei dispositivi tramite CIDR fidati

L'abbinamento dei dispositivi WS per `role: node` resta manuale per impostazione predefinita. Per reti
private di nodi in cui il Gateway considera già fidato il percorso di rete, gli operatori possono
abilitarlo esplicitamente con CIDR o IP esatti:

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
- Non esiste una modalità di approvazione automatica generica per LAN o reti private.
- È idoneo solo l'abbinamento fresco di dispositivi con `role: node` senza ambiti richiesti.
- I client operatore, browser, Control UI e WebChat restano manuali.
- Gli aggiornamenti di ruolo, ambito, metadati e chiave pubblica restano manuali.
- I percorsi di header trusted-proxy su local loopback dello stesso host non sono idonei perché quel
  percorso può essere falsificato da chiamanti locali.

## Approvazione automatica dell'aggiornamento dei metadati

Quando un dispositivo già abbinato si riconnette con sole modifiche non sensibili ai metadati
(ad esempio, nome visualizzato o suggerimenti sulla piattaforma del client), OpenClaw lo tratta
come un `metadata-upgrade`. L'approvazione automatica silenziosa è limitata: si applica solo
a riconnessioni locali fidate non browser che hanno già dimostrato il possesso di credenziali locali
o condivise, incluse le riconnessioni di app native sullo stesso host dopo modifiche ai metadati della
versione del sistema operativo. I client browser/Control UI e i client remoti continuano
a usare il flusso esplicito di riapprovazione. Gli aggiornamenti di ambito (da lettura a scrittura/admin) e
le modifiche della chiave pubblica **non** sono idonei all'approvazione automatica per metadata-upgrade —
restano richieste esplicite di riapprovazione.

## Helper per l'abbinamento QR

`/pair qr` renderizza il payload di abbinamento come media strutturato affinché i client mobile e
browser possano scansionarlo direttamente.

L'eliminazione di un dispositivo rimuove anche eventuali richieste di abbinamento in sospeso obsolete per quell'
id dispositivo, quindi `nodes pending` non mostra righe orfane dopo una revoca.

## Località e header inoltrati

L'abbinamento del Gateway considera una connessione come loopback solo quando sia il socket grezzo
sia qualsiasi prova di proxy a monte concordano. Se una richiesta arriva su loopback ma
porta header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`
che puntano a un'origine non locale, quella prova degli header inoltrati squalifica
l'affermazione di località loopback. Il percorso di abbinamento richiede quindi approvazione esplicita
invece di trattare silenziosamente la richiesta come una connessione dallo stesso host. Vedi
[Autenticazione proxy fidato](/it/gateway/trusted-proxy-auth) per la regola equivalente
sull'autenticazione dell'operatore.

## Archiviazione (locale, privata)

Lo stato dell'abbinamento viene archiviato nella directory di stato del Gateway (predefinita `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Se sovrascrivi `OPENCLAW_STATE_DIR`, la cartella `nodes/` si sposta con essa.

Note di sicurezza:

- I token sono segreti; tratta `paired.json` come sensibile.
- La rotazione di un token richiede riapprovazione (o l'eliminazione della voce del nodo).

## Comportamento del trasporto

- Il trasporto è **stateless**; non archivia l'appartenenza.
- Se il Gateway è offline o l'abbinamento è disabilitato, i nodi non possono abbinarsi.
- Se il Gateway è in modalità remota, l'abbinamento avviene comunque rispetto all'archivio del Gateway remoto.

## Correlati

- [Abbinamento dei canali](/it/channels/pairing)
- [Nodi](/it/nodes)
- [CLI dei dispositivi](/it/cli/devices)
