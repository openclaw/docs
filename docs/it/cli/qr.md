---
read_when:
    - Vuoi associare rapidamente un'app Node mobile a un Gateway
    - Hai bisogno dell'output del codice di configurazione per la condivisione remota/manuale
summary: Riferimento CLI per `openclaw qr` (genera il codice QR di associazione mobile e il codice di configurazione)
title: QR
x-i18n:
    generated_at: "2026-07-12T06:54:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 32641ff4e8035f6ca2eda849a59146125763af21c4105ae6cfa584da31ac070f
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Genera un codice QR per l'associazione di un dispositivo mobile e un codice di configurazione dalla configurazione corrente del Gateway.

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

Le app ufficiali OpenClaw per iOS e Android si connettono automaticamente quando i metadati del codice di configurazione corrispondono. Se una richiesta rimane in sospeso (ad esempio, per un client non ufficiale o metadati non corrispondenti), esaminala e approvala:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## Opzioni

- `--remote`: dà la priorità a `gateway.remote.url`; se tale URL non è impostato, usa come alternativa `gateway.tailscale.mode=serve|funnel`. Ignora `publicUrl` del Plugin `device-pair`.
- `--url <url>`: sostituisce l'URL del Gateway usato nel payload
- `--public-url <url>`: sostituisce l'URL pubblico usato nel payload
- `--token <token>`: sostituisce il token del Gateway rispetto al quale si autentica il flusso di bootstrap
- `--password <password>`: sostituisce la password del Gateway rispetto alla quale si autentica il flusso di bootstrap
- `--setup-code-only`: stampa solo il codice di configurazione
- `--no-ascii`: omette il rendering ASCII del codice QR
- `--json`: restituisce JSON (`setupCode`, `gatewayUrl`, `gatewayUrls` facoltativo, `auth`, `urlSource`)

`--token` e `--password` si escludono a vicenda.

## Contenuto del codice di configurazione

Il codice di configurazione contiene un `bootstrapToken` opaco e di breve durata, non il token o la password condivisi del Gateway. Il flusso di bootstrap integrato emette:

- un token `node` principale con `scopes: []`
- un token di passaggio `operator` con ambito limitato a `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`

Gli ambiti per le operazioni di modifica dell'associazione e `operator.admin` richiedono comunque un'associazione operatore approvata separatamente o un flusso di token.

## Risoluzione dell'URL del Gateway

L'associazione mobile si interrompe in modo sicuro per gli URL `ws://` pubblici o Tailscale del Gateway: per tali URL, usa Tailscale Serve/Funnel oppure un URL `wss://` del Gateway. Gli indirizzi LAN privati e gli host Bonjour `.local` rimangono supportati tramite `ws://` semplice.

Quando l'URL del Gateway selezionato proviene da `gateway.bind=lan`, OpenClaw verifica anche le route persistenti di `tailscale serve status --json`. Qualsiasi root HTTPS di Serve che inoltri le richieste alla porta local loopback del Gateway attivo viene inclusa come alternativa. Il comando QR aggiunge questa alternativa solo per `lan`; `custom` e `tailnet` mantengono le route pubblicizzate esplicitamente. I client iOS correnti verificano le route pubblicizzate nell'ordine indicato e salvano la prima raggiungibile; il campo `url` precedente rimane invariato per i client meno recenti.

Con `--remote`, è necessario specificare `gateway.remote.url` oppure `gateway.tailscale.mode=serve|funnel`.

## Risoluzione dell'autenticazione (senza `--remote`)

Quando non viene fornita alcuna sostituzione dell'autenticazione tramite CLI, i SecretRef dell'autenticazione del Gateway locale vengono risolti come segue:

| Condizione                                                                                                                   | Risultato                                 |
| ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `gateway.auth.mode="token"` oppure modalità dedotta senza una fonte password prevalente                                      | `gateway.auth.token`                      |
| `gateway.auth.mode="password"` oppure modalità dedotta senza un token prevalente proveniente dall'autenticazione o dall'ambiente | `gateway.auth.password`                   |
| Sia `gateway.auth.token` sia `gateway.auth.password` sono configurati (inclusi i SecretRef) e `gateway.auth.mode` non è impostato | operazione non riuscita; imposta esplicitamente `gateway.auth.mode` |

## Risoluzione dell'autenticazione (`--remote`)

Se le credenziali remote effettivamente attive sono configurate come SecretRef e non viene fornito né `--token` né `--password`, il comando le risolve dallo snapshot attivo del Gateway. Se il Gateway non è disponibile, il comando termina immediatamente con un errore.

<Note>
Questo percorso del comando richiede un Gateway che supporti il metodo RPC `secrets.resolve`. I Gateway meno recenti restituiscono un errore di metodo sconosciuto.
</Note>

## Contenuti correlati

- [Riferimento della CLI](/it/cli)
- [Dispositivi](/it/cli/devices)
- [Associazione](/it/cli/pairing)
