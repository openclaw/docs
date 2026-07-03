---
read_when:
    - Vuoi associare rapidamente un'app Node mobile a un Gateway
    - Serve l'output del codice di configurazione per la condivisione remota/manuale
summary: Riferimento CLI per `openclaw qr` (genera il QR di abbinamento mobile + codice di configurazione)
title: QR
x-i18n:
    generated_at: "2026-07-03T13:32:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2a0d71fb7be0734a015084bfb5edef74953310d384964eab9cccbabf7c497e3
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Genera un QR di abbinamento mobile e un codice di configurazione dalla configurazione Gateway corrente.

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
- `--token <token>`: sovrascrive il token gateway rispetto al quale il flusso di bootstrap si autentica
- `--password <password>`: sovrascrive la password gateway rispetto alla quale il flusso di bootstrap si autentica
- `--setup-code-only`: stampa solo il codice di configurazione
- `--no-ascii`: salta il rendering del QR ASCII
- `--json`: emette JSON (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Note

- `--token` e `--password` sono mutuamente esclusivi.
- Il codice di configurazione ora contiene un `bootstrapToken` opaco e di breve durata, non il token/la password gateway condivisi.
- Il bootstrap integrato tramite codice di configurazione restituisce un token primario `node` con `scopes: []` più un token di passaggio `operator` limitato per l'onboarding mobile attendibile.
- Il token operatore passato è limitato a `operator.approvals`, `operator.read`, `operator.talk.secrets` e `operator.write`; gli scope di mutazione dell'abbinamento e `operator.admin` richiedono comunque un abbinamento operatore approvato separato o un flusso token separato.
- L'abbinamento mobile fallisce in modo chiuso per gli URL gateway Tailscale/pubblici `ws://`. Gli indirizzi LAN privati e gli host Bonjour `.local` restano supportati tramite `ws://`, ma le route mobili Tailscale/pubbliche dovrebbero usare Tailscale Serve/Funnel o un URL gateway `wss://`.
- Con `--remote`, OpenClaw richiede `gateway.remote.url` oppure
  `gateway.tailscale.mode=serve|funnel`.
- Con `--remote`, se le credenziali remote effettivamente attive sono configurate come SecretRefs e non passi `--token` o `--password`, il comando le risolve dallo snapshot del gateway attivo. Se il gateway non è disponibile, il comando fallisce rapidamente.
- Senza `--remote`, le SecretRefs dell'autenticazione gateway locale vengono risolte quando non viene passato alcun override di autenticazione CLI:
  - `gateway.auth.token` viene risolto quando l'autenticazione tramite token può prevalere (`gateway.auth.mode="token"` esplicito o modalità dedotta in cui nessuna sorgente password prevale).
  - `gateway.auth.password` viene risolto quando l'autenticazione tramite password può prevalere (`gateway.auth.mode="password"` esplicito o modalità dedotta senza token prevalente da auth/env).
- Se sono configurati sia `gateway.auth.token` sia `gateway.auth.password` (incluse SecretRefs) e `gateway.auth.mode` non è impostato, la risoluzione del codice di configurazione fallisce finché la modalità non viene impostata esplicitamente.
- Nota sul disallineamento della versione del Gateway: questo percorso di comando richiede un gateway che supporti `secrets.resolve`; i gateway meno recenti restituiscono un errore di metodo sconosciuto.
- Dopo la scansione, approva l'abbinamento del dispositivo con:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Correlati

- [Riferimento CLI](/it/cli)
- [Abbinamento](/it/cli/pairing)
