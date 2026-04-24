---
read_when:
    - Implementazione delle approvazioni di associazione del Node senza UI macOS
    - Aggiunta di flussi CLI per approvare Node remoti
    - Estensione del protocollo Gateway con gestione dei Node
summary: Associazione di Node gestita dal Gateway (Opzione B) per iOS e altri Node remoti
title: Associazione gestita dal Gateway
x-i18n:
    generated_at: "2026-04-24T08:41:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42e1e927db9dd28c8a37881c5b014809e6286ffc00efe6f1a86dd2d55d360c09
    source_path: gateway/pairing.md
    workflow: 15
---

# Associazione gestita dal Gateway (Opzione B)

Nell'associazione gestita dal Gateway, il **Gateway** è la fonte di verità su quali Node
sono autorizzati a unirsi. Le UI (app macOS, futuri client) sono solo frontend che
approvano o rifiutano le richieste in sospeso.

**Importante:** i Node WS usano l'**associazione dei dispositivi** (ruolo `node`) durante `connect`.
`node.pair.*` è un archivio di associazione separato e **non** controlla l'handshake WS.
Solo i client che chiamano esplicitamente `node.pair.*` usano questo flusso.

## Concetti

- **Richiesta in sospeso**: un Node ha chiesto di unirsi; richiede approvazione.
- **Node associato**: Node approvato con un token auth emesso.
- **Trasporto**: l'endpoint WS del Gateway inoltra le richieste ma non decide
  l'appartenenza. (Il supporto legacy per il bridge TCP è stato rimosso.)

## Come funziona l'associazione

1. Un Node si connette al Gateway WS e richiede l'associazione.
2. Il Gateway memorizza una **richiesta in sospeso** ed emette `node.pair.requested`.
3. Approvi o rifiuti la richiesta (CLI o UI).
4. All'approvazione, il Gateway emette un **nuovo token** (i token vengono ruotati in caso di re‑pair).
5. Il Node si riconnette usando il token ed è ora “associato”.

Le richieste in sospeso scadono automaticamente dopo **5 minuti**.

## Workflow CLI (adatto a headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` mostra i Node associati/connessi e le loro capacità.

## Superficie API (protocollo Gateway)

Eventi:

- `node.pair.requested` — emesso quando viene creata una nuova richiesta in sospeso.
- `node.pair.resolved` — emesso quando una richiesta viene approvata/rifiutata/scaduta.

Metodi:

- `node.pair.request` — crea o riutilizza una richiesta in sospeso.
- `node.pair.list` — elenca Node in sospeso + associati (`operator.pairing`).
- `node.pair.approve` — approva una richiesta in sospeso (emette un token).
- `node.pair.reject` — rifiuta una richiesta in sospeso.
- `node.pair.verify` — verifica `{ nodeId, token }`.

Note:

- `node.pair.request` è idempotente per Node: chiamate ripetute restituiscono la stessa
  richiesta in sospeso.
- Le richieste ripetute per lo stesso Node in sospeso aggiornano anche i metadati del Node memorizzati
  e l'ultimo snapshot dichiarato dei comandi in allowlist per la visibilità dell'operatore.
- L'approvazione genera **sempre** un token nuovo; nessun token viene mai restituito da
  `node.pair.request`.
- Le richieste possono includere `silent: true` come suggerimento per flussi di auto-approvazione.
- `node.pair.approve` usa i comandi dichiarati della richiesta in sospeso per applicare
  ambiti di approvazione aggiuntivi:
  - richiesta senza comandi: `operator.pairing`
  - richiesta di comandi non exec: `operator.pairing` + `operator.write`
  - richiesta `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Importante:

- L'associazione del Node è un flusso di trust/identità più emissione del token.
- **Non** fissa la superficie dei comandi live del Node per singolo Node.
- I comandi live del Node provengono da ciò che il Node dichiara in fase di connessione dopo l'applicazione
  della policy globale dei comandi del Node del Gateway (`gateway.nodes.allowCommands` /
  `denyCommands`).
- La policy allow/ask di `system.run` per singolo Node vive sul Node in
  `exec.approvals.node.*`, non nel record di associazione.

## Gate dei comandi del Node (2026.3.31+)

<Warning>
**Breaking change:** a partire da `2026.3.31`, i comandi del Node sono disabilitati finché l'associazione del Node non viene approvata. La sola associazione del dispositivo non è più sufficiente per esporre i comandi dichiarati del Node.
</Warning>

Quando un Node si connette per la prima volta, l'associazione viene richiesta automaticamente. Finché la richiesta di associazione non viene approvata, tutti i comandi in sospeso del Node provenienti da quel Node vengono filtrati e non verranno eseguiti. Una volta stabilita la fiducia tramite l'approvazione dell'associazione, i comandi dichiarati del Node diventano disponibili secondo la normale policy dei comandi.

Questo significa:

- I Node che prima si affidavano solo all'associazione del dispositivo per esporre i comandi ora devono completare l'associazione del Node.
- I comandi accodati prima dell'approvazione dell'associazione vengono eliminati, non rinviati.

## Confini di trust degli eventi del Node (2026.3.31+)

<Warning>
**Breaking change:** le esecuzioni originate dal Node ora restano su una superficie attendibile ridotta.
</Warning>

I riepiloghi originati dal Node e i relativi eventi di sessione sono limitati alla superficie attendibile prevista. I flussi guidati da notifiche o attivati dal Node che prima si affidavano a un accesso più ampio agli strumenti dell'host o della sessione potrebbero richiedere modifiche. Questo hardening garantisce che gli eventi del Node non possano degenerare in accesso agli strumenti a livello host oltre ciò che il confine di trust del Node consente.

## Auto-approvazione (app macOS)

L'app macOS può facoltativamente tentare una **approvazione silenziosa** quando:

- la richiesta è contrassegnata come `silent`, e
- l'app può verificare una connessione SSH all'host Gateway usando lo stesso utente.

Se l'approvazione silenziosa fallisce, si torna al normale prompt “Approve/Reject”.

## Auto-approvazione dell'aggiornamento dei metadati

Quando un dispositivo già associato si riconnette con soli cambiamenti non sensibili dei
metadati (per esempio nome visualizzato o suggerimenti sulla piattaforma client), OpenClaw lo tratta
come `metadata-upgrade`. L'auto-approvazione silenziosa è limitata: si applica solo a riconnessioni
CLI/helper locali attendibili che hanno già dimostrato il possesso del token o della password
condivisi tramite loopback. I client browser/Control UI e i client remoti usano ancora
il flusso esplicito di riapprovazione. Gli upgrade di ambito (da read a
write/admin) e i cambiamenti di chiave pubblica **non** sono idonei all'auto-approvazione degli aggiornamenti dei metadati: restano richieste esplicite di riapprovazione.

## Helper di associazione QR

`/pair qr` esegue il rendering del payload di associazione come media strutturati così i client
mobili e browser possono scansionarlo direttamente.

L'eliminazione di un dispositivo rimuove anche eventuali richieste di associazione in sospeso obsolete per quell'id
del dispositivo, così `nodes pending` non mostra righe orfane dopo una revoca.

## Località e header inoltrati

L'associazione del Gateway tratta una connessione come loopback solo quando sia il socket raw
sia qualsiasi evidenza di proxy upstream concordano. Se una richiesta arriva su loopback ma
trasporta header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto` che
puntano a un'origine non locale, quell'evidenza degli header inoltrati invalida la rivendicazione di località loopback. Il percorso di associazione richiede quindi un'approvazione esplicita invece di trattare silenziosamente la richiesta come una connessione dallo stesso host. Vedi
[Autenticazione con proxy attendibile](/it/gateway/trusted-proxy-auth) per la regola equivalente sull'autenticazione dell'operator.

## Archiviazione (locale, privata)

Lo stato dell'associazione è archiviato nella directory di stato del Gateway (predefinita `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Se sovrascrivi `OPENCLAW_STATE_DIR`, la cartella `nodes/` si sposta con essa.

Note di sicurezza:

- I token sono segreti; tratta `paired.json` come sensibile.
- La rotazione di un token richiede una nuova approvazione (o l'eliminazione della voce del Node).

## Comportamento del trasporto

- Il trasporto è **senza stato**; non memorizza l'appartenenza.
- Se il Gateway è offline o l'associazione è disabilitata, i Node non possono associarsi.
- Se il Gateway è in modalità remota, l'associazione avviene comunque rispetto all'archivio del Gateway remoto.

## Correlati

- [Associazione del canale](/it/channels/pairing)
- [Node](/it/nodes)
- [CLI Devices](/it/cli/devices)
