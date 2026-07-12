---
read_when:
    - Vuoi il rilevamento su rete geografica (DNS-SD) tramite Tailscale + CoreDNS
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: Riferimento della CLI per `openclaw dns` (strumenti di supporto per il rilevamento su rete geografica)
title: DNS
x-i18n:
    generated_at: "2026-07-12T06:54:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb07353df03f9d169e1aede2da0b711ffb68e8c9d21d51359e93e92cc0818ca2
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

Strumenti DNS per il rilevamento su rete geografica (Tailscale + CoreDNS). Attualmente supporta solo macOS + CoreDNS installato tramite Homebrew.

Argomenti correlati:

- Rilevamento del Gateway: [Rilevamento](/it/gateway/discovery)
- Configurazione del rilevamento su rete geografica: [Configurazione](/it/gateway/configuration)

## `dns setup`

Pianifica o applica la configurazione di CoreDNS per il rilevamento DNS-SD unicast.

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

| Opzione             | Effetto                                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| `--domain <domain>` | Dominio di rilevamento su rete geografica (ad esempio `openclaw.internal`).                                     |
| `--apply`           | Installa/aggiorna la configurazione di CoreDNS e (ri)avvia il servizio. Richiede sudo, solo su macOS.           |

Senza `--domain`, OpenClaw usa `discovery.wideArea.domain` dalla configurazione.

Senza `--apply`, il comando mostra soltanto:

- Il dominio di rilevamento risolto e il percorso del file di zona
- Gli indirizzi IP attuali della tailnet
- La configurazione di rilevamento consigliata per `openclaw.json`
- I valori di server dei nomi/dominio per Split DNS di Tailscale da impostare nella console di amministrazione di Tailscale

Con `--apply` (solo macOS, richiede CoreDNS installato tramite Homebrew):

- Inizializza il file di zona se assente
- Aggiunge la direttiva di importazione di CoreDNS se assente
- Riavvia il servizio brew `coredns`

## Correlati

- [Riferimento della CLI](/it/cli)
- [Rilevamento](/it/gateway/discovery)
