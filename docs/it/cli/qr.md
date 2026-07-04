---
read_when:
    - Vuoi associare rapidamente un'app nodo mobile a un gateway
    - Hai bisogno dell'output del codice di configurazione per la condivisione remota/manuale
summary: Riferimento CLI per `openclaw qr` (genera QR di abbinamento mobile + codice di configurazione)
title: QR
x-i18n:
    generated_at: "2026-07-04T18:04:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81d15c9d551960c6f5677649b481e447ecda55a395957746959b4ecf81712bdb
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Genera un QR di associazione mobile e un codice di configurazione dalla configurazione corrente del Gateway.

## Utilizzo

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Opzioni

- `--remote`: preferisce `gateway.remote.url`; se non è impostato, `gateway.tailscale.mode=serve|funnel` può comunque fornire l'URL pubblico remoto
- `--url <url>`: sostituisce l'URL del gateway usato nel payload
- `--public-url <url>`: sostituisce l'URL pubblico usato nel payload
- `--token <token>`: sostituisce il token del gateway con cui il flusso di bootstrap si autentica
- `--password <password>`: sostituisce la password del gateway con cui il flusso di bootstrap si autentica
- `--setup-code-only`: stampa solo il codice di configurazione
- `--no-ascii`: salta il rendering del QR ASCII
- `--json`: emette JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Note

- `--token` e `--password` si escludono a vicenda.
- Il codice di configurazione ora contiene un `bootstrapToken` opaco e di breve durata, non il token/la password condivisi del gateway.
- Il bootstrap integrato tramite codice di configurazione restituisce un token primario `node` con `scopes: []` più un token di passaggio `operator` limitato per l'onboarding mobile attendibile.
- Il token operatore trasferito è limitato a `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`; gli ambiti di mutazione dell'associazione e `operator.admin` richiedono comunque un'associazione operatore approvata separata o un flusso di token.
- L'associazione mobile fallisce in modo chiuso per gli URL Gateway Tailscale/pubblici `ws://`. Gli indirizzi LAN privati e gli host Bonjour `.local` restano supportati su `ws://`, ma le rotte mobili Tailscale/pubbliche dovrebbero usare Tailscale Serve/Funnel o un URL Gateway `wss://`.
- Con `--remote`, OpenClaw richiede `gateway.remote.url` oppure
  `gateway.tailscale.mode=serve|funnel`.
- Con `--remote`, se le credenziali remote effettivamente attive sono configurate come SecretRefs e non passi `--token` o `--password`, il comando le risolve dallo snapshot del gateway attivo. Se il gateway non è disponibile, il comando fallisce rapidamente.
- Senza `--remote`, le SecretRefs di autenticazione del gateway locale vengono risolte quando non viene passato alcun override di autenticazione CLI:
  - `gateway.auth.token` viene risolto quando l'autenticazione tramite token può prevalere (`gateway.auth.mode="token"` esplicito o modalità dedotta in cui nessuna sorgente password prevale).
  - `gateway.auth.password` viene risolto quando l'autenticazione tramite password può prevalere (`gateway.auth.mode="password"` esplicito o modalità dedotta senza un token prevalente da autenticazione/env).
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` (incluse SecretRefs) e `gateway.auth.mode` non è impostato, la risoluzione del codice di configurazione fallisce finché la modalità non viene impostata esplicitamente.
- Nota sul disallineamento di versione del Gateway: questo percorso di comando richiede un gateway che supporti `secrets.resolve`; i gateway meno recenti restituiscono un errore di metodo sconosciuto.
- Le app ufficiali OpenClaw per iOS e Android si connettono automaticamente quando i metadati del loro
  codice di configurazione corrispondono. Se una richiesta rimane in sospeso (ad esempio, per un
  client non ufficiale o metadati non corrispondenti), esaminala e approvala con:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Correlati

- [Riferimento CLI](/it/cli)
- [Associazione](/it/cli/pairing)
