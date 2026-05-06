---
read_when:
    - Vuoi il rilevamento su vasta area (DNS-SD) tramite Tailscale + CoreDNS
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Riferimento CLI per `openclaw dns` (helper per il rilevamento su ampia area)
title: DNS
x-i18n:
    generated_at: "2026-05-06T08:42:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 460bdcbaa2c0c0fc1a4f5bdd76b904d8ac35195a25324c66421abfdc2044bb07
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

Strumenti di supporto DNS per il rilevamento su rete geografica (Tailscale + CoreDNS). Attualmente incentrati su macOS + Homebrew CoreDNS.

Correlati:

- Rilevamento Gateway: [Rilevamento](/it/gateway/discovery)
- Configurazione del rilevamento su rete geografica: [Configurazione](/it/gateway/configuration)

## Configurazione

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

Pianifica o applica la configurazione di CoreDNS per il rilevamento DNS-SD unicast.

Opzioni:

- `--domain <domain>`: dominio di rilevamento su rete geografica (per esempio `openclaw.internal`)
- `--apply`: installa o aggiorna la configurazione di CoreDNS e riavvia il servizio (richiede sudo; solo macOS)

Cosa mostra:

- dominio di rilevamento risolto
- percorso del file di zona
- IP tailnet correnti
- configurazione di rilevamento consigliata per `openclaw.json`
- valori di nameserver/dominio Split DNS di Tailscale da impostare

Note:

- Senza `--apply`, il comando è solo uno strumento di pianificazione e stampa la configurazione consigliata.
- Se `--domain` è omesso, OpenClaw usa `discovery.wideArea.domain` dalla configurazione.
- `--apply` attualmente supporta solo macOS e richiede Homebrew CoreDNS.
- `--apply` inizializza il file di zona se necessario, assicura che la stanza di importazione di CoreDNS esista e riavvia il servizio brew `coredns`.

## Correlati

- [Riferimento CLI](/it/cli)
- [Rilevamento](/it/gateway/discovery)
