---
read_when:
    - Vuoi associare rapidamente un'app Node mobile a un gateway
    - Ti serve l'output del codice di configurazione per condivisione remota/manuale
summary: Riferimento CLI per `openclaw qr` (genera QR di pairing mobile + codice di configurazione)
title: QR
x-i18n:
    generated_at: "2026-04-24T08:35:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05e25f5cf4116adcd0630b148b6799e90304058c51c998293ebbed995f0a0533
    source_path: cli/qr.md
    workflow: 15
---

# `openclaw qr`

Genera un QR di pairing mobile e un codice di configurazione dalla configurazione Gateway corrente.

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
- `--url <url>`: sovrascrive l'URL del gateway usato nel payload
- `--public-url <url>`: sovrascrive l'URL pubblico usato nel payload
- `--token <token>`: sovrascrive il token gateway contro cui si autentica il flusso bootstrap
- `--password <password>`: sovrascrive la password gateway contro cui si autentica il flusso bootstrap
- `--setup-code-only`: stampa solo il codice di configurazione
- `--no-ascii`: salta il rendering QR ASCII
- `--json`: emette JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Note

- `--token` e `--password` si escludono a vicenda.
- Il codice di configurazione stesso ora contiene un `bootstrapToken` opaco e di breve durata, non il token/password gateway condiviso.
- Nel flusso bootstrap integrato Node/operator, il token Node primario arriva ancora con `scopes: []`.
- Se il passaggio bootstrap emette anche un token operatore, questo resta limitato all'allowlist bootstrap: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- I controlli dell'ambito bootstrap hanno un prefisso di ruolo. Quell'allowlist dell'operatore soddisfa solo richieste dell'operatore; i ruoli non operatore necessitano comunque di scope sotto il proprio prefisso di ruolo.
- Il pairing mobile fallisce in modalità chiusa per URL gateway `ws://` Tailscale/pubblici. `ws://` LAN privata continua a essere supportato, ma i percorsi mobili Tailscale/pubblici dovrebbero usare Tailscale Serve/Funnel o un URL gateway `wss://`.
- Con `--remote`, OpenClaw richiede `gateway.remote.url` oppure
  `gateway.tailscale.mode=serve|funnel`.
- Con `--remote`, se le credenziali remote effettivamente attive sono configurate come SecretRef e non passi `--token` o `--password`, il comando le risolve dallo snapshot del gateway attivo. Se il gateway non è disponibile, il comando fallisce rapidamente.
- Senza `--remote`, i SecretRef di autenticazione del gateway locale vengono risolti quando non viene passato alcun override di autenticazione CLI:
  - `gateway.auth.token` viene risolto quando può prevalere l'autenticazione token (`gateway.auth.mode="token"` esplicito o modalità dedotta in cui nessuna sorgente password prevale).
  - `gateway.auth.password` viene risolto quando può prevalere l'autenticazione password (`gateway.auth.mode="password"` esplicito o modalità dedotta senza un token vincente da auth/env).
- Se sia `gateway.auth.token` sia `gateway.auth.password` sono configurati (inclusi SecretRef) e `gateway.auth.mode` non è impostato, la risoluzione del codice di configurazione fallisce finché la modalità non viene impostata esplicitamente.
- Nota sulla differenza di versione del gateway: questo percorso di comando richiede un gateway che supporti `secrets.resolve`; i gateway meno recenti restituiscono un errore di metodo sconosciuto.
- Dopo la scansione, approva il pairing del dispositivo con:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Correlati

- [Riferimento CLI](/it/cli)
- [Pairing](/it/cli/pairing)
