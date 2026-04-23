---
read_when:
    - Implementazione delle approvazioni di abbinamento dei Node senza interfaccia macOS
    - Aggiunta di flussi CLI per approvare Node remoti
    - Estensione del protocollo Gateway con gestione dei Node
summary: Abbinamento dei Node gestito dal Gateway (Opzione B) per iOS e altri Node remoti
title: Abbinamento gestito dal Gateway
x-i18n:
    generated_at: "2026-04-23T08:28:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: f644f2dd9a79140156646a78df2a83f0940e3db8160cb083453e43c108eacf3a
    source_path: gateway/pairing.md
    workflow: 15
---

# Abbinamento gestito dal Gateway (Opzione B)

Nell'abbinamento gestito dal Gateway, il **Gateway** è la fonte di verità per stabilire quali Node
sono autorizzati a unirsi. Le UI (app macOS, client futuri) sono solo frontend che
approvano o rifiutano le richieste in sospeso.

**Importante:** i Node WS usano il **device pairing** (ruolo `node`) durante `connect`.
`node.pair.*` è un archivio di abbinamento separato e **non** controlla l'handshake WS.
Solo i client che chiamano esplicitamente `node.pair.*` usano questo flusso.

## Concetti

- **Richiesta in sospeso**: un Node ha chiesto di unirsi; richiede approvazione.
- **Node abbinato**: Node approvato con un token auth emesso.
- **Transport**: l'endpoint WS del Gateway inoltra le richieste ma non decide
  l'appartenenza. (Il supporto legacy del bridge TCP è stato rimosso.)

## Come funziona l'abbinamento

1. Un Node si connette al Gateway WS e richiede l'abbinamento.
2. Il Gateway memorizza una **richiesta in sospeso** ed emette `node.pair.requested`.
3. Approvi o rifiuti la richiesta (CLI o UI).
4. In caso di approvazione, il Gateway emette un **nuovo token** (i token vengono ruotati al riabbinamento).
5. Il Node si riconnette usando il token e ora risulta “abbinato”.

Le richieste in sospeso scadono automaticamente dopo **5 minuti**.

## Workflow CLI (compatibile con modalità headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` mostra i Node abbinati/connessi e le loro capability.

## Surface API (protocollo gateway)

Eventi:

- `node.pair.requested` — emesso quando viene creata una nuova richiesta in sospeso.
- `node.pair.resolved` — emesso quando una richiesta viene approvata/rifiutata/scaduta.

Metodi:

- `node.pair.request` — crea o riutilizza una richiesta in sospeso.
- `node.pair.list` — elenca Node in sospeso + abbinati (`operator.pairing`).
- `node.pair.approve` — approva una richiesta in sospeso (emette il token).
- `node.pair.reject` — rifiuta una richiesta in sospeso.
- `node.pair.verify` — verifica `{ nodeId, token }`.

Note:

- `node.pair.request` è idempotente per Node: chiamate ripetute restituiscono la stessa
  richiesta in sospeso.
- Le richieste ripetute per lo stesso Node in sospeso aggiornano anche i metadati del Node
  memorizzati e l'ultimo snapshot dei comandi dichiarati in allowlist per visibilità dell'operatore.
- L'approvazione genera **sempre** un token nuovo; nessun token viene mai restituito da
  `node.pair.request`.
- Le richieste possono includere `silent: true` come suggerimento per flussi di auto-approvazione.
- `node.pair.approve` usa i comandi dichiarati della richiesta in sospeso per applicare
  scope di approvazione aggiuntivi:
  - richiesta senza comandi: `operator.pairing`
  - richiesta con comandi non-exec: `operator.pairing` + `operator.write`
  - richiesta `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Importante:

- L'abbinamento dei Node è un flusso di fiducia/identità più emissione di token.
- **Non** fissa la surface dei comandi live del Node per singolo Node.
- I comandi live del Node provengono da ciò che il Node dichiara alla connessione dopo
  l'applicazione della policy globale dei comandi Node del gateway (`gateway.nodes.allowCommands` /
  `denyCommands`).
- La policy allow/ask di `system.run` per singolo Node risiede sul Node in
  `exec.approvals.node.*`, non nel record di abbinamento.

## Gating dei comandi Node (2026.3.31+)

<Warning>
**Breaking change:** a partire da `2026.3.31`, i comandi Node sono disabilitati finché l'abbinamento del Node non viene approvato. Il solo device pairing non basta più a esporre i comandi Node dichiarati.
</Warning>

Quando un Node si connette per la prima volta, l'abbinamento viene richiesto automaticamente. Finché la richiesta di abbinamento non viene approvata, tutti i comandi Node in sospeso provenienti da quel Node vengono filtrati e non verranno eseguiti. Una volta stabilita la fiducia tramite approvazione dell'abbinamento, i comandi dichiarati del Node diventano disponibili in base alla normale policy dei comandi.

Questo significa:

- I Node che prima facevano affidamento solo sul device pairing per esporre i comandi ora devono completare anche l'abbinamento del Node.
- I comandi accodati prima dell'approvazione dell'abbinamento vengono scartati, non differiti.

## Confini di fiducia degli eventi Node (2026.3.31+)

<Warning>
**Breaking change:** le esecuzioni originate dai Node ora rimangono su una surface trusted ridotta.
</Warning>

I riepiloghi originati dai Node e i relativi eventi di sessione sono limitati alla surface trusted prevista. I flussi guidati da notifiche o attivati dai Node che prima si affidavano a un accesso più ampio agli strumenti host o di sessione potrebbero richiedere adeguamenti. Questo hardening garantisce che gli eventi Node non possano trasformarsi in accesso a strumenti a livello host oltre quanto consentito dal confine di fiducia del Node.

## Auto-approvazione (app macOS)

L'app macOS può facoltativamente tentare un'**approvazione silenziosa** quando:

- la richiesta è contrassegnata come `silent`, e
- l'app può verificare una connessione SSH all'host gateway usando lo stesso utente.

Se l'approvazione silenziosa fallisce, viene usato il fallback al normale prompt “Approva/Rifiuta”.

## Auto-approvazione degli aggiornamenti di metadati

Quando un dispositivo già abbinato si riconnette con sole modifiche di metadati non sensibili
(per esempio nome visualizzato o hint della piattaforma client), OpenClaw tratta
questo caso come `metadata-upgrade`. L'auto-approvazione silenziosa è limitata: si applica solo
a riconnessioni trusted di CLI/helper locali che hanno già dimostrato il possesso del
token condiviso o della password via loopback. I client browser/Control UI e i client
remoti continuano a usare il flusso esplicito di riapprovazione. Gli upgrade di scope
(da read a write/admin) e i cambiamenti di chiave pubblica **non** sono idonei
all'auto-approvazione degli aggiornamenti di metadati: restano richieste esplicite di riapprovazione.

## Helper di abbinamento QR

`/pair qr` renderizza il payload di abbinamento come media strutturati in modo che i client
mobili e browser possano scansionarlo direttamente.

L'eliminazione di un dispositivo rimuove anche eventuali richieste di abbinamento in sospeso obsolete per quell'id dispositivo, così `nodes pending` non mostra righe orfane dopo una revoca.

## Località e header inoltrati

L'abbinamento del Gateway tratta una connessione come loopback solo quando sia il socket raw
sia qualsiasi evidenza di proxy upstream concordano. Se una richiesta arriva su loopback ma
porta header `X-Forwarded-For` / `X-Forwarded-Host` / `X-Forwarded-Proto`
che puntano a un'origine non locale, tale evidenza degli header inoltrati invalida
l'affermazione di località loopback. Il percorso di abbinamento richiede quindi un'approvazione esplicita
invece di trattare silenziosamente la richiesta come una connessione dallo stesso host. Vedi
[Trusted Proxy Auth](/it/gateway/trusted-proxy-auth) per la regola equivalente su
operator auth.

## Archiviazione (locale, privata)

Lo stato dell'abbinamento è memorizzato nella directory di stato del Gateway (predefinita `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Se sovrascrivi `OPENCLAW_STATE_DIR`, anche la cartella `nodes/` viene spostata con essa.

Note di sicurezza:

- I token sono segreti; tratta `paired.json` come dato sensibile.
- La rotazione di un token richiede una nuova approvazione (o l'eliminazione della voce del Node).

## Comportamento del transport

- Il transport è **stateless**; non memorizza l'appartenenza.
- Se il Gateway è offline o l'abbinamento è disabilitato, i Node non possono abbinarsi.
- Se il Gateway è in modalità remota, l'abbinamento avviene comunque rispetto all'archivio del Gateway remoto.
