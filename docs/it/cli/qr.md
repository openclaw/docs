---
read_when:
    - Vuoi associare rapidamente un'app Node mobile a un Gateway
    - È necessario l'output di setup-code per la condivisione remota/manuale
summary: Riferimento CLI per `openclaw qr` (genera il QR di associazione mobile + codice di configurazione)
title: QR
x-i18n:
    generated_at: "2026-05-06T08:43:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2e8f86b860701dcd625b6573070e30ed26a2f3fda9e5e7998723c8058de498b
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Genera un QR di abbinamento mobile e un codice di configurazione dalla configurazione corrente del Gateway.

## Utilizzo

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Opzioni

- `--remote`: preferisci `gateway.remote.url`; se non è impostato, `gateway.tailscale.mode=serve|funnel` può comunque fornire l'URL pubblico remoto
- `--url <url>`: sostituisce l'URL del gateway usato nel payload
- `--public-url <url>`: sostituisce l'URL pubblico usato nel payload
- `--token <token>`: sostituisce il token del gateway rispetto al quale si autentica il flusso di bootstrap
- `--password <password>`: sostituisce la password del gateway rispetto alla quale si autentica il flusso di bootstrap
- `--setup-code-only`: stampa solo il codice di configurazione
- `--no-ascii`: salta il rendering del QR ASCII
- `--json`: emette JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Note

- `--token` e `--password` si escludono a vicenda.
- Il codice di configurazione ora contiene un `bootstrapToken` opaco e di breve durata, non il token/password condiviso del gateway.
- Nel flusso di bootstrap integrato del nodo/operatore, il token primario del nodo arriva comunque con `scopes: []`.
- Se il passaggio di consegne del bootstrap emette anche un token operatore, resta limitato alla allowlist del bootstrap: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- I controlli degli ambiti del bootstrap sono prefissati dal ruolo. Quella allowlist dell'operatore soddisfa solo le richieste dell'operatore; i ruoli non operatore richiedono comunque ambiti sotto il proprio prefisso di ruolo.
- L'abbinamento mobile fallisce in modo chiuso per gli URL del gateway `ws://` Tailscale/pubblici. Gli indirizzi LAN privati e gli host Bonjour `.local` restano supportati tramite `ws://`, ma le route mobili Tailscale/pubbliche dovrebbero usare Tailscale Serve/Funnel o un URL del gateway `wss://`.
- Con `--remote`, OpenClaw richiede `gateway.remote.url` oppure
  `gateway.tailscale.mode=serve|funnel`.
- Con `--remote`, se le credenziali remote effettivamente attive sono configurate come SecretRefs e non passi `--token` o `--password`, il comando le risolve dallo snapshot del gateway attivo. Se il gateway non è disponibile, il comando fallisce immediatamente.
- Senza `--remote`, le SecretRefs di autenticazione del gateway locale vengono risolte quando non viene passato alcun override di autenticazione CLI:
  - `gateway.auth.token` viene risolto quando l'autenticazione tramite token può prevalere (`gateway.auth.mode="token"` esplicito o modalità dedotta in cui nessuna sorgente password prevale).
  - `gateway.auth.password` viene risolto quando l'autenticazione tramite password può prevalere (`gateway.auth.mode="password"` esplicito o modalità dedotta senza un token prevalente da auth/env).
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` (incluse le SecretRefs) e `gateway.auth.mode` non è impostato, la risoluzione del codice di configurazione fallisce finché la modalità non viene impostata esplicitamente.
- Nota sul disallineamento di versione del Gateway: questo percorso di comando richiede un gateway che supporti `secrets.resolve`; i gateway meno recenti restituiscono un errore di metodo sconosciuto.
- Dopo la scansione, approva l'abbinamento del dispositivo con:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Correlati

- [Riferimento CLI](/it/cli)
- [Abbinamento](/it/cli/pairing)
