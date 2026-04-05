---
read_when:
    - Implementazione delle approvazioni di pairing dei nodi senza UI macOS
    - Aggiunta di flussi CLI per approvare nodi remoti
    - Estensione del protocollo gateway con la gestione dei nodi
summary: Pairing dei nodi gestito dal Gateway (Opzione B) per iOS e altri nodi remoti
title: Pairing gestito dal Gateway
x-i18n:
    generated_at: "2026-04-05T13:52:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f90818c84daeb190f27df7413e23362372806f2c4250e4954295fbf6df70233
    source_path: gateway/pairing.md
    workflow: 15
---

# Pairing gestito dal Gateway (Opzione B)

Nel pairing gestito dal Gateway, il **Gateway** è la fonte di verità per stabilire quali nodi
sono autorizzati a unirsi. Le UI (app macOS, futuri client) sono solo frontend che
approvano o rifiutano le richieste in sospeso.

**Importante:** i nodi WS usano il **pairing del dispositivo** (ruolo `node`) durante `connect`.
`node.pair.*` è un archivio di pairing separato e **non** controlla l'handshake WS.
Solo i client che chiamano esplicitamente `node.pair.*` usano questo flusso.

## Concetti

- **Richiesta in sospeso**: un nodo ha chiesto di unirsi; richiede approvazione.
- **Nodo associato**: nodo approvato con un token auth emesso.
- **Trasporto**: l'endpoint Gateway WS inoltra le richieste ma non decide
  l'appartenenza. (Il supporto al bridge TCP legacy è stato rimosso.)

## Come funziona il pairing

1. Un nodo si connette al Gateway WS e richiede il pairing.
2. Il Gateway memorizza una **richiesta in sospeso** ed emette `node.pair.requested`.
3. Tu approvi o rifiuti la richiesta (CLI o UI).
4. In caso di approvazione, il Gateway emette un **nuovo token** (i token vengono ruotati al re‑pair).
5. Il nodo si riconnette usando il token e ora risulta “associato”.

Le richieste in sospeso scadono automaticamente dopo **5 minuti**.

## Workflow CLI (adatto ad ambienti headless)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` mostra i nodi associati/connessi e le loro funzionalità.

## Superficie API (protocollo gateway)

Eventi:

- `node.pair.requested` — emesso quando viene creata una nuova richiesta in sospeso.
- `node.pair.resolved` — emesso quando una richiesta viene approvata/rifiutata/scaduta.

Metodi:

- `node.pair.request` — crea o riutilizza una richiesta in sospeso.
- `node.pair.list` — elenca richieste in sospeso + nodi associati (`operator.pairing`).
- `node.pair.approve` — approva una richiesta in sospeso (emette un token).
- `node.pair.reject` — rifiuta una richiesta in sospeso.
- `node.pair.verify` — verifica `{ nodeId, token }`.

Note:

- `node.pair.request` è idempotente per nodo: chiamate ripetute restituiscono la stessa
  richiesta in sospeso.
- Le richieste ripetute per lo stesso nodo in sospeso aggiornano anche i metadati del nodo
  memorizzati e l'ultimo snapshot dichiarato dei comandi consentiti per la visibilità dell'operatore.
- L'approvazione genera **sempre** un token nuovo; nessun token viene mai restituito da
  `node.pair.request`.
- Le richieste possono includere `silent: true` come hint per flussi di auto-approvazione.
- `node.pair.approve` usa i comandi dichiarati della richiesta in sospeso per applicare
  ambiti di approvazione aggiuntivi:
  - richiesta senza comandi: `operator.pairing`
  - richiesta con comandi non-exec: `operator.pairing` + `operator.write`
  - richiesta `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

Importante:

- Il pairing dei nodi è un flusso di fiducia/identità più emissione di token.
- **Non** fissa la superficie dei comandi live del nodo per nodo.
- I comandi live del nodo provengono da ciò che il nodo dichiara su connect dopo
  l'applicazione della policy globale dei comandi del nodo del gateway (`gateway.nodes.allowCommands` /
  `denyCommands`).
- La policy allow/ask per `system.run` per nodo vive sul nodo in
  `exec.approvals.node.*`, non nel record di pairing.

## Gating dei comandi del nodo (2026.3.31+)

<Warning>
**Modifica incompatibile:** a partire da `2026.3.31`, i comandi dei nodi sono disabilitati finché il pairing del nodo non viene approvato. Il solo pairing del dispositivo non è più sufficiente per esporre i comandi dichiarati del nodo.
</Warning>

Quando un nodo si connette per la prima volta, il pairing viene richiesto automaticamente. Finché la richiesta di pairing non viene approvata, tutti i comandi del nodo in sospeso provenienti da quel nodo vengono filtrati e non verranno eseguiti. Una volta stabilita la fiducia tramite l'approvazione del pairing, i comandi dichiarati del nodo diventano disponibili in base alla normale policy dei comandi.

Ciò significa che:

- I nodi che in precedenza si affidavano al solo pairing del dispositivo per esporre comandi devono ora completare il pairing del nodo.
- I comandi accodati prima dell'approvazione del pairing vengono eliminati, non rimandati.

## Confini di fiducia degli eventi del nodo (2026.3.31+)

<Warning>
**Modifica incompatibile:** le esecuzioni originate dal nodo ora restano su una superficie trusted ridotta.
</Warning>

I riepiloghi originati dal nodo e i relativi eventi di sessione sono limitati alla superficie trusted prevista. I flussi guidati da notifiche o attivati dal nodo che in precedenza si affidavano a un accesso più ampio agli strumenti host o di sessione potrebbero richiedere adattamenti. Questo hardening garantisce che gli eventi del nodo non possano trasformarsi in accesso agli strumenti a livello host oltre quanto consentito dal confine di fiducia del nodo.

## Auto-approvazione (app macOS)

L'app macOS può tentare facoltativamente un'**approvazione silenziosa** quando:

- la richiesta è contrassegnata come `silent`, e
- l'app può verificare una connessione SSH all'host gateway usando lo stesso utente.

Se l'approvazione silenziosa fallisce, viene usato come fallback il normale prompt “Approva/Rifiuta”.

## Archiviazione (locale, privata)

Lo stato del pairing viene archiviato nella directory di stato del Gateway (predefinita `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

Se sovrascrivi `OPENCLAW_STATE_DIR`, anche la cartella `nodes/` si sposta con essa.

Note di sicurezza:

- I token sono segreti; tratta `paired.json` come sensibile.
- La rotazione di un token richiede una nuova approvazione (oppure l'eliminazione della voce del nodo).

## Comportamento del trasporto

- Il trasporto è **senza stato**; non memorizza l'appartenenza.
- Se il Gateway è offline o il pairing è disabilitato, i nodi non possono eseguire il pairing.
- Se il Gateway è in modalità remota, il pairing avviene comunque rispetto all'archivio del Gateway remoto.
