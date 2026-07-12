---
read_when: Connecting the macOS app to a remote gateway over SSH
summary: Configurazione del tunnel SSH per connettere OpenClaw.app a un Gateway remoto
title: Configurazione del Gateway remoto
x-i18n:
    generated_at: "2026-07-12T07:05:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 842578eb74e99d115b04abff5e9673a6454fa6d2cf7905d056999469e1c6b66d
    source_path: gateway/remote-gateway-readme.md
    workflow: 16
---

<Note>
Questo contenuto si trova ora in [Accesso remoto](/it/gateway/remote#macos-persistent-ssh-tunnel-via-launchagent). Usa quella pagina per la guida aggiornata; questa pagina rimane come destinazione di reindirizzamento.
</Note>

# Esecuzione di OpenClaw.app con un Gateway remoto

OpenClaw.app raggiunge un Gateway remoto tramite un tunnel SSH: un `LocalForward` SSH associa una porta locale alla porta WebSocket del Gateway sull'host remoto.

```mermaid
flowchart TB
    subgraph Client["Macchina client"]
        direction TB
        A["OpenClaw.app"]
        B["ws://127.0.0.1:18789\n(porta locale)"]
        T["Tunnel SSH"]

        A --> B
        B --> T
    end
    subgraph Remote["Macchina remota"]
        direction TB
        C["WebSocket del Gateway"]
        D["ws://127.0.0.1:18789"]

        C --> D
    end
    T --> C
```

## Configurazione

1. Aggiungi una voce alla configurazione SSH con `LocalForward 18789 127.0.0.1:18789` (consulta [Accesso remoto](/it/gateway/remote#macos-persistent-ssh-tunnel-via-launchagent) per il blocco di configurazione completo).
2. Copia la tua chiave SSH sull'host remoto con `ssh-copy-id`.
3. Imposta `gateway.remote.token` (o `gateway.remote.password`) tramite `openclaw config set gateway.remote.token "<your-token>"`.
4. Avvia il tunnel: `ssh -N remote-gateway &`.
5. Chiudi e riapri OpenClaw.app.

Per un tunnel che rimanga attivo dopo i riavvii e si riconnetta automaticamente, usa la configurazione LaunchAgent nella pagina [Accesso remoto](/it/gateway/remote#macos-persistent-ssh-tunnel-via-launchagent) anziché eseguire manualmente `ssh -N`.

## Come funziona

| Componente                           | Funzione                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Inoltra la porta locale 18789 alla porta remota 18789                          |
| `ssh -N`                             | Connessione SSH senza eseguire comandi remoti (solo inoltro delle porte)       |
| `KeepAlive`                          | Riavvia automaticamente il tunnel in caso di arresto anomalo (LaunchAgent)     |
| `RunAtLoad`                          | Avvia il tunnel quando viene caricato il LaunchAgent (LaunchAgent)             |

OpenClaw.app si connette a `ws://127.0.0.1:18789` sul client. Il tunnel inoltra tale connessione alla porta 18789 dell'host remoto su cui è in esecuzione il Gateway.

## Contenuti correlati

- [Accesso remoto](/it/gateway/remote)
- [Tailscale](/it/gateway/tailscale)
