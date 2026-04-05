---
read_when:
    - Vuoi associare rapidamente un'app nodo mobile a un gateway
    - Hai bisogno dell'output del codice di configurazione per condivisione remota/manuale
summary: Riferimento CLI per `openclaw qr` (genera QR di pairing mobile + codice di configurazione)
title: qr
x-i18n:
    generated_at: "2026-04-05T13:48:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee6469334ad09037318f938c7ac609b7d5e3385c0988562501bb02a1bfa411ff
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
- `--token <token>`: sovrascrive quale token del gateway viene usato per autenticare il flusso bootstrap
- `--password <password>`: sovrascrive quale password del gateway viene usata per autenticare il flusso bootstrap
- `--setup-code-only`: stampa solo il codice di configurazione
- `--no-ascii`: salta il rendering ASCII del QR
- `--json`: emette JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Note

- `--token` e `--password` si escludono a vicenda.
- Il codice di configurazione stesso ora contiene un `bootstrapToken` opaco a breve durata, non il token/password condiviso del gateway.
- Nel flusso bootstrap integrato nodo/operatore, il token primario del nodo viene comunque emesso con `scopes: []`.
- Se il passaggio bootstrap emette anche un token operatore, questo resta limitato alla allowlist bootstrap: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- I controlli degli ambiti bootstrap hanno prefisso di ruolo. Quella allowlist operatore soddisfa solo le richieste operatore; i ruoli non operatore richiedono comunque ambiti sotto il proprio prefisso di ruolo.
- Il pairing mobile fallisce in modo chiuso per URL gateway `ws://` Tailscale/pubblici. `ws://` LAN privato resta supportato, ma per le route mobili Tailscale/pubbliche si dovrebbero usare Tailscale Serve/Funnel o un URL gateway `wss://`.
- Con `--remote`, OpenClaw richiede `gateway.remote.url` oppure
  `gateway.tailscale.mode=serve|funnel`.
- Con `--remote`, se le credenziali remote effettivamente attive sono configurate come SecretRef e non passi `--token` o `--password`, il comando le risolve dallo snapshot attivo del gateway. Se il gateway non è disponibile, il comando fallisce rapidamente.
- Senza `--remote`, i SecretRef di autenticazione del gateway locale vengono risolti quando non viene passato alcun override di autenticazione CLI:
  - `gateway.auth.token` viene risolto quando l'autenticazione tramite token può prevalere (esplicito `gateway.auth.mode="token"` oppure modalità dedotta in cui nessuna sorgente password prevale).
  - `gateway.auth.password` viene risolto quando l'autenticazione tramite password può prevalere (esplicito `gateway.auth.mode="password"` oppure modalità dedotta senza un token vincente da auth/env).
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` (inclusi SecretRef) e `gateway.auth.mode` non è impostato, la risoluzione del codice di configurazione fallisce finché la modalità non viene impostata esplicitamente.
- Nota sul disallineamento di versione del gateway: questo percorso di comando richiede un gateway che supporti `secrets.resolve`; i gateway più vecchi restituiscono un errore di metodo sconosciuto.
- Dopo la scansione, approva il pairing del dispositivo con:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`
