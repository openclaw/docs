---
read_when:
    - Je wilt snel een mobiele node-app koppelen aan een Gateway
    - Je hebt setup-code-uitvoer nodig voor extern/handmatig delen
summary: CLI-referentie voor `openclaw qr` (mobiele koppelings-QR + setupcode genereren)
title: QR
x-i18n:
    generated_at: "2026-07-03T13:39:06Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2a0d71fb7be0734a015084bfb5edef74953310d384964eab9cccbabf7c497e3
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Genereer een mobiele koppelings-QR en installatiecode vanuit je huidige Gateway-configuratie.

## Gebruik

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Opties

- `--remote`: geef de voorkeur aan `gateway.remote.url`; als die niet is ingesteld, kan `gateway.tailscale.mode=serve|funnel` nog steeds de externe openbare URL leveren
- `--url <url>`: overschrijf de gateway-URL die in de payload wordt gebruikt
- `--public-url <url>`: overschrijf de openbare URL die in de payload wordt gebruikt
- `--token <token>`: overschrijf tegen welk gateway-token de bootstrap-flow zich verifieert
- `--password <password>`: overschrijf tegen welk gateway-wachtwoord de bootstrap-flow zich verifieert
- `--setup-code-only`: druk alleen de installatiecode af
- `--no-ascii`: sla ASCII-QR-rendering over
- `--json`: geef JSON uit (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Opmerkingen

- `--token` en `--password` sluiten elkaar uit.
- De installatiecode zelf bevat nu een ondoorzichtig kortlevend `bootstrapToken`, niet het gedeelde gateway-token/wachtwoord.
- Ingebouwde bootstrap met installatiecode retourneert een primair `node`-token met `scopes: []` plus een begrensd `operator`-overdrachtstoken voor vertrouwde mobiele onboarding.
- Het overgedragen operator-token is beperkt tot `operator.approvals`, `operator.read`, `operator.talk.secrets` en `operator.write`; scopes voor koppelingsmutaties en `operator.admin` vereisen nog steeds een aparte goedgekeurde operator-koppeling of token-flow.
- Mobiel koppelen faalt gesloten voor Tailscale/openbare `ws://`-gateway-URL's. Privé-LAN-adressen en `.local` Bonjour-hosts blijven ondersteund via `ws://`, maar mobiele Tailscale/openbare routes moeten Tailscale Serve/Funnel of een `wss://`-gateway-URL gebruiken.
- Met `--remote` vereist OpenClaw `gateway.remote.url` of
  `gateway.tailscale.mode=serve|funnel`.
- Met `--remote`, als effectief actieve externe referenties zijn geconfigureerd als SecretRefs en je geen `--token` of `--password` doorgeeft, lost de opdracht ze op vanuit de actieve gateway-snapshot. Als Gateway niet beschikbaar is, faalt de opdracht snel.
- Zonder `--remote` worden SecretRefs voor lokale gateway-authenticatie opgelost wanneer er geen CLI-authenticatie-override wordt doorgegeven:
  - `gateway.auth.token` wordt opgelost wanneer token-authenticatie kan winnen (expliciete `gateway.auth.mode="token"` of afgeleide modus waarin geen wachtwoordbron wint).
  - `gateway.auth.password` wordt opgelost wanneer wachtwoord-authenticatie kan winnen (expliciete `gateway.auth.mode="password"` of afgeleide modus zonder winnend token uit auth/env).
- Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd (inclusief SecretRefs) en `gateway.auth.mode` niet is ingesteld, faalt de resolutie van de installatiecode totdat de modus expliciet is ingesteld.
- Opmerking over Gateway-versieverschil: dit opdrachtpad vereist een gateway die `secrets.resolve` ondersteunt; oudere gateways retourneren een onbekende-methodefout.
- Keur na het scannen apparaatkoppeling goed met:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Koppelen](/nl/cli/pairing)
