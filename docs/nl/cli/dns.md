---
read_when:
    - Je wilt ontdekking over een groot gebied (DNS-SD) via Tailscale + CoreDNS
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: CLI-referentie voor `openclaw dns` (hulpmiddelen voor wide-area discovery)
title: DNS
x-i18n:
    generated_at: "2026-05-06T09:05:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: 460bdcbaa2c0c0fc1a4f5bdd76b904d8ac35195a25324c66421abfdc2044bb07
    source_path: cli/dns.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw dns`

DNS-helpers voor wide-area-detectie (Tailscale + CoreDNS). Momenteel gericht op macOS + Homebrew CoreDNS.

Gerelateerd:

- Gateway-detectie: [Detectie](/nl/gateway/discovery)
- Configuratie voor wide-area-detectie: [Configuratie](/nl/gateway/configuration)

## Instellen

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

Plan de CoreDNS-installatie voor unicast DNS-SD-detectie of pas deze toe.

Opties:

- `--domain <domain>`: domein voor wide-area-detectie (bijvoorbeeld `openclaw.internal`)
- `--apply`: installeer of werk de CoreDNS-config bij en herstart de service (vereist sudo; alleen macOS)

Wat het toont:

- opgelost detectiedomein
- pad naar zonebestand
- huidige tailnet-IP's
- aanbevolen `openclaw.json`-detectieconfig
- de in te stellen waarden voor Tailscale Split DNS-naamserver/domein

Opmerkingen:

- Zonder `--apply` is de opdracht alleen een planningshelper en drukt deze de aanbevolen installatie af.
- Als `--domain` wordt weggelaten, gebruikt OpenClaw `discovery.wideArea.domain` uit de configuratie.
- `--apply` ondersteunt momenteel alleen macOS en verwacht Homebrew CoreDNS.
- `--apply` initialiseert het zonebestand indien nodig, zorgt dat de CoreDNS-importstanza bestaat en herstart de `coredns` brew-service.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Detectie](/nl/gateway/discovery)
