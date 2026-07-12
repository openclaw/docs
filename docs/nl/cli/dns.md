---
read_when:
    - Je wilt netwerkbrede detectie (DNS-SD) via Tailscale + CoreDNS
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: CLI-referentie voor `openclaw dns` (hulpprogramma's voor detectie via een WAN)
title: DNS
x-i18n:
    generated_at: "2026-07-12T08:41:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb07353df03f9d169e1aede2da0b711ffb68e8c9d21d51359e93e92cc0818ca2
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

DNS-hulpprogramma's voor wide-area-detectie (Tailscale + CoreDNS). Momenteel alleen macOS + Homebrew CoreDNS.

Gerelateerd:

- Gateway-detectie: [Detectie](/nl/gateway/discovery)
- Configuratie voor wide-area-detectie: [Configuratie](/nl/gateway/configuration)

## `dns setup`

Plan of pas de CoreDNS-configuratie toe voor unicast DNS-SD-detectie.

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

| Optie               | Effect                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `--domain <domain>` | Domein voor wide-area-detectie (bijvoorbeeld `openclaw.internal`).                                      |
| `--apply`           | Installeer/werk de CoreDNS-configuratie bij en (her)start de service. Vereist sudo, alleen voor macOS. |

Zonder `--domain` gebruikt OpenClaw `discovery.wideArea.domain` uit de configuratie.

Zonder `--apply` geeft de opdracht alleen het volgende weer:

- Opgelost detectiedomein en pad naar het zonebestand
- Huidige tailnet-IP-adressen
- Aanbevolen detectieconfiguratie voor `openclaw.json`
- Waarden voor de Tailscale Split DNS-naamserver en het domein die in de Tailscale-beheerconsole moeten worden ingesteld

Met `--apply` (alleen macOS, vereist Homebrew CoreDNS):

- Maakt het zonebestand aan als het ontbreekt
- Voegt de CoreDNS-importsectie toe als deze ontbreekt
- Herstart de `coredns`-brewservice

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Detectie](/nl/gateway/discovery)
