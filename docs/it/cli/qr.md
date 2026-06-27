---
read_when:
    - Vuoi associare rapidamente un'app Node mobile a un Gateway
    - Ti serve l'output del codice di configurazione per la condivisione remota/manuale
summary: Riferimento CLI per `openclaw qr` (genera il QR di abbinamento mobile + codice di configurazione)
title: QR
x-i18n:
    generated_at: "2026-06-27T17:21:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d08bbeb69627dafea45c912af4e92c08cd5c79d4ae52bb3f0a6fba5e789acb51
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Genera un QR di abbinamento mobile e un codice di configurazione dalla tua configurazione Gateway corrente.

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
- `--token <token>`: sovrascrive il token del gateway con cui si autentica il flusso di bootstrap
- `--password <password>`: sovrascrive la password del gateway con cui si autentica il flusso di bootstrap
- `--setup-code-only`: stampa solo il codice di configurazione
- `--no-ascii`: salta la resa del QR ASCII
- `--json`: emette JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Note

- `--token` e `--password` si escludono a vicenda.
- Il codice di configurazione ora contiene un `bootstrapToken` opaco e di breve durata, non il token/password Gateway condiviso.
- Il bootstrap integrato del codice di configurazione restituisce un token primario `node` con `scopes: []` più un token di passaggio `operator` limitato per l'onboarding mobile attendibile.
- Il token operatore passato è limitato a `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`; `operator.admin` e `operator.pairing` richiedono un abbinamento operatore approvato separato o un flusso di token separato.
- L'abbinamento mobile fallisce in modo chiuso per gli URL Gateway Tailscale/pubblici `ws://`. Gli indirizzi LAN privati e gli host Bonjour `.local` restano supportati su `ws://`, ma le route mobili Tailscale/pubbliche devono usare Tailscale Serve/Funnel o un URL Gateway `wss://`.
- Con `--remote`, OpenClaw richiede `gateway.remote.url` oppure
  `gateway.tailscale.mode=serve|funnel`.
- Con `--remote`, se le credenziali remote effettivamente attive sono configurate come SecretRefs e non passi `--token` o `--password`, il comando le risolve dallo snapshot Gateway attivo. Se Gateway non è disponibile, il comando fallisce rapidamente.
- Senza `--remote`, le SecretRefs di autenticazione del gateway locale vengono risolte quando non viene passato alcun override di autenticazione CLI:
  - `gateway.auth.token` viene risolto quando l'autenticazione tramite token può prevalere (`gateway.auth.mode="token"` esplicito o modalità dedotta in cui non prevale alcuna fonte di password).
  - `gateway.auth.password` viene risolto quando l'autenticazione tramite password può prevalere (`gateway.auth.mode="password"` esplicito o modalità dedotta senza token prevalente da auth/env).
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` (incluse SecretRefs) e `gateway.auth.mode` non è impostato, la risoluzione del codice di configurazione fallisce finché la modalità non viene impostata esplicitamente.
- Nota sulla divergenza di versioni del Gateway: questo percorso di comando richiede un gateway che supporti `secrets.resolve`; i gateway meno recenti restituiscono un errore di metodo sconosciuto.
- Dopo la scansione, approva l'abbinamento del dispositivo con:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Correlati

- [Riferimento CLI](/it/cli)
- [Abbinamento](/it/cli/pairing)
