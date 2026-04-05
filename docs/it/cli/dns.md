---
read_when:
    - Vuoi il rilevamento wide-area (DNS-SD) tramite Tailscale + CoreDNS
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Riferimento CLI per `openclaw dns` (helper per il rilevamento wide-area)
title: dns
x-i18n:
    generated_at: "2026-04-05T13:47:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4831fbb7791adfed5195bc4ba36bb248d2bc8830958334211d3c96f824617927
    source_path: cli/dns.md
    workflow: 15
---

# `openclaw dns`

Helper DNS per il rilevamento wide-area (Tailscale + CoreDNS). Attualmente focalizzati su macOS + Homebrew CoreDNS.

Correlati:

- Rilevamento del Gateway: [Discovery](/gateway/discovery)
- Configurazione del rilevamento wide-area: [Configuration](/gateway/configuration)

## Configurazione

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

Pianifica o applica la configurazione di CoreDNS per il rilevamento DNS-SD unicast.

Opzioni:

- `--domain <domain>`: dominio di rilevamento wide-area (ad esempio `openclaw.internal`)
- `--apply`: installa o aggiorna la configurazione di CoreDNS e riavvia il servizio (richiede sudo; solo macOS)

Cosa mostra:

- dominio di rilevamento risolto
- percorso del file di zona
- IP tailnet correnti
- configurazione di rilevamento `openclaw.json` consigliata
- i valori nameserver/domain di Tailscale Split DNS da impostare

Note:

- Senza `--apply`, il comando è solo un helper di pianificazione e stampa la configurazione consigliata.
- Se `--domain` viene omesso, OpenClaw usa `discovery.wideArea.domain` dalla config.
- `--apply` attualmente supporta solo macOS e presuppone Homebrew CoreDNS.
- `--apply` inizializza il file di zona se necessario, garantisce che l'import stanza di CoreDNS esista e riavvia il servizio brew `coredns`.
