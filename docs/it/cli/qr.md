---
read_when:
    - Si desidera associare rapidamente un'app Node per dispositivi mobili a un Gateway
    - È necessario l'output del codice di configurazione per la condivisione remota/manuale
summary: Riferimento CLI per `openclaw qr` (genera il codice QR di associazione per dispositivi mobili e il codice di configurazione)
title: QR
x-i18n:
    generated_at: "2026-07-16T14:15:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f9d60a58126eae7eec5979f28bb511a09fa52b68cdd73727fca0b2de74efa84a
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Genera un codice QR di associazione per dispositivi mobili e un codice di configurazione dalla configurazione corrente del Gateway.

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --limited
openclaw qr --url wss://gateway.example/ws
```

Le app ufficiali OpenClaw per iOS e Android si connettono automaticamente quando i relativi
metadati del codice di configurazione corrispondono. Se una richiesta rimane in sospeso (ad esempio, per un
client non ufficiale o metadati non corrispondenti), esaminarla e approvarla:

```bash
openclaw devices list
openclaw devices approve <requestId>
```

## Opzioni

- `--remote`: preferisce `gateway.remote.url`; ripiega su `gateway.tailscale.mode=serve|funnel` se tale URL non è impostato. Ignora il Plugin `device-pair` `publicUrl`.
- `--url <url>`: sostituisce l'URL del gateway utilizzato nel payload
- `--public-url <url>`: sostituisce l'URL pubblico utilizzato nel payload
- `--token <token>`: sostituisce il token del gateway rispetto al quale si autentica il flusso di bootstrap
- `--password <password>`: sostituisce la password del gateway rispetto alla quale si autentica il flusso di bootstrap
- `--limited`: omette l'accesso amministrativo al Gateway dal token dell'operatore trasferito
- `--setup-code-only`: stampa solo il codice di configurazione
- `--no-ascii`: ignora il rendering ASCII del codice QR
- `--json`: emette JSON (`setupCode`, `gatewayUrl`, `gatewayUrls` facoltativo, `auth`, `access`, `accessDowngraded` facoltativo, `urlSource`)

`--token` e `--password` si escludono a vicenda.

## Contenuto del codice di configurazione

Il codice di configurazione contiene un `bootstrapToken` opaco e di breve durata, non il token o la password condivisi del gateway. Per un endpoint `wss://` (o un loopback sullo stesso host), il flusso di bootstrap predefinito emette:

- un token `node` principale con `scopes: []`
- un token di trasferimento `operator` completo per dispositivi mobili nativi con `operator.admin`, `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`

Utilizzare `--limited` per mantenere lo stesso token del nodo omettendo `operator.admin` dal trasferimento all'operatore. L'ambito di modifica dell'associazione non viene mai trasferito tramite un codice di configurazione.

La configurazione `ws://` in testo non crittografato sulla LAN rimane disponibile, ma OpenClaw utilizza automaticamente
il profilo limitato perché un osservatore della rete potrebbe acquisire il token
bearer di bootstrap e anticiparne l'uso. Configurare `wss://` o Tailscale Serve, quindi generare un nuovo codice
per ottenere l'accesso completo.

## Risoluzione dell'URL del Gateway

L'associazione per dispositivi mobili si interrompe in modo sicuro per gli URL del gateway `ws://` Tailscale/pubblici: per tali URL, utilizzare Tailscale Serve/Funnel o un URL del gateway `wss://`. Gli indirizzi LAN privati e gli host Bonjour `.local` rimangono supportati tramite `ws://` non crittografato, con accesso limitato per l'operatore come descritto sopra.

Quando l'URL del Gateway selezionato proviene da `gateway.bind=lan`, OpenClaw verifica anche le route `tailscale serve status --json` persistenti. Qualsiasi root HTTPS Serve che inoltri tramite proxy la porta di loopback del Gateway attivo viene inclusa come fallback. Il comando QR aggiunge questo fallback solo per `lan`; `custom` e `tailnet` mantengono le route pubblicizzate esplicitamente. I client iOS correnti verificano le route pubblicizzate nell'ordine indicato e salvano la prima raggiungibile; il campo legacy `url` rimane invariato per i client meno recenti.

Con `--remote`, è richiesto uno tra `gateway.remote.url` e `gateway.tailscale.mode=serve|funnel`.

## Risoluzione dell'autenticazione (senza `--remote`)

Quando non viene specificata alcuna sostituzione dell'autenticazione tramite CLI, i SecretRef dell'autenticazione del gateway locale vengono risolti come segue:

| Condizione                                                                                                                   | Risoluzione                                |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `gateway.auth.mode="token"` oppure modalità dedotta senza alcuna origine della password prevalente                                    | `gateway.auth.token`                         |
| `gateway.auth.mode="password"` oppure modalità dedotta senza alcun token prevalente dall'autenticazione o dall'ambiente                   | `gateway.auth.password`                         |
| Sono configurati sia `gateway.auth.token` sia `gateway.auth.password` (inclusi i SecretRef) e `gateway.auth.mode` non è impostato     | non riesce; impostare esplicitamente `gateway.auth.mode` |

## Risoluzione dell'autenticazione (`--remote`)

Se le credenziali remote effettivamente attive sono configurate come SecretRef e non viene specificato né `--token` né `--password`, il comando le risolve dallo snapshot del gateway attivo. Se il gateway non è disponibile, il comando termina immediatamente con un errore.

<Note>
Questo percorso del comando richiede un gateway che supporti il metodo RPC `secrets.resolve`. I gateway meno recenti restituiscono un errore di metodo sconosciuto.
</Note>

## Correlati

- [Riferimento della CLI](/it/cli)
- [Dispositivi](/it/cli/devices)
- [Associazione](/it/cli/pairing)
