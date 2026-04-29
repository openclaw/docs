---
read_when:
    - Je wilt detectie over een breed netwerk (DNS-SD) via Tailscale + CoreDNS
    - You’re setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: CLI-referentie voor `openclaw dns` (hulpfuncties voor brede netwerkdetectie)
title: DNS
x-i18n:
    generated_at: "2026-04-29T22:32:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 99dcf7c8c76833784a2b712b02f9e40c6c0548c37c9743a89b9d650fe503d385
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

DNS-helpers voor ontdekking over een groot netwerkgebied (Tailscale + CoreDNS). Momenteel gericht op macOS + Homebrew CoreDNS.

Gerelateerd:

- Gateway-ontdekking: [Ontdekking](/nl/gateway/discovery)
- Configuratie voor ontdekking over een groot netwerkgebied: [Configuratie](/nl/gateway/configuration)

## Instellen

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

Plan of pas CoreDNS-instelling toe voor unicast DNS-SD-ontdekking.

Opties:

- `--domain <domain>`: domein voor ontdekking over een groot netwerkgebied (bijvoorbeeld `openclaw.internal`)
- `--apply`: installeer of werk de CoreDNS-configuratie bij en herstart de service (vereist sudo; alleen macOS)

Wat het toont:

- opgelost ontdekkingsdomein
- pad naar zonebestand
- huidige tailnet-IP's
- aanbevolen `openclaw.json`-ontdekkingsconfiguratie
- de Tailscale Split DNS-nameserver-/domeinwaarden om in te stellen

Opmerkingen:

- Zonder `--apply` is de opdracht alleen een planningshelper en drukt deze de aanbevolen instelling af.
- Als `--domain` wordt weggelaten, gebruikt OpenClaw `discovery.wideArea.domain` uit de configuratie.
- `--apply` ondersteunt momenteel alleen macOS en verwacht Homebrew CoreDNS.
- `--apply` initialiseert het zonebestand indien nodig, zorgt dat het CoreDNS-importblok bestaat en herstart de `coredns` brew-service.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Ontdekking](/nl/gateway/discovery)
