---
read_when:
    - Vuoi il rilevamento su rete geografica (DNS-SD) tramite Tailscale + CoreDNS
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Riferimento CLI per `openclaw dns` (helper di rilevamento su rete geografica)
title: DNS
x-i18n:
    generated_at: "2026-04-24T08:33:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 99dcf7c8c76833784a2b712b02f9e40c6c0548c37c9743a89b9d650fe503d385
    source_path: cli/dns.md
    workflow: 15
---

# `openclaw dns`

Helper DNS per il rilevamento su rete geografica (Tailscale + CoreDNS). Attualmente focalizzati su macOS + CoreDNS tramite Homebrew.

Correlati:

- Rilevamento del Gateway: [Discovery](/it/gateway/discovery)
- Configurazione del rilevamento su rete geografica: [Configuration](/it/gateway/configuration)

## Configurazione

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

Pianifica o applica la configurazione di CoreDNS per il rilevamento DNS-SD unicast.

Opzioni:

- `--domain <domain>`: dominio di rilevamento su rete geografica (ad esempio `openclaw.internal`)
- `--apply`: installa o aggiorna la configurazione di CoreDNS e riavvia il servizio (richiede sudo; solo macOS)

Cosa mostra:

- dominio di rilevamento risolto
- percorso del file di zona
- IP tailnet correnti
- configurazione di rilevamento `openclaw.json` consigliata
- valori nameserver/dominio di Tailscale Split DNS da impostare

Note:

- Senza `--apply`, il comando è solo un helper di pianificazione e stampa la configurazione consigliata.
- Se `--domain` viene omesso, OpenClaw usa `discovery.wideArea.domain` dalla configurazione.
- `--apply` attualmente supporta solo macOS e si aspetta CoreDNS tramite Homebrew.
- `--apply` inizializza il file di zona se necessario, assicura che l'istruzione import di CoreDNS esista e riavvia il servizio brew `coredns`.

## Correlati

- [Riferimento CLI](/it/cli)
- [Discovery](/it/gateway/discovery)
