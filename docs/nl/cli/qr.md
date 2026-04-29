---
read_when:
    - Je wilt snel een mobiele node-app koppelen aan een Gateway
    - U hebt setup-code-uitvoer nodig voor delen op afstand/handmatig
summary: CLI-referentie voor `openclaw qr` (QR-code voor mobiele koppeling + instelcode genereren)
title: QR
x-i18n:
    generated_at: "2026-04-29T22:34:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 05e25f5cf4116adcd0630b148b6799e90304058c51c998293ebbed995f0a0533
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Genereer een QR-code voor mobiel koppelen en een instelcode vanuit je huidige Gateway-configuratie.

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
- `--token <token>`: overschrijf met welk gateway-token de bootstrapflow zich authenticeert
- `--password <password>`: overschrijf met welk gateway-wachtwoord de bootstrapflow zich authenticeert
- `--setup-code-only`: druk alleen de instelcode af
- `--no-ascii`: sla ASCII-QR-weergave over
- `--json`: geef JSON uit (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Opmerkingen

- `--token` en `--password` sluiten elkaar uit.
- De instelcode zelf bevat nu een ondoorzichtig, kortlevend `bootstrapToken`, niet het gedeelde gateway-token/-wachtwoord.
- In de ingebouwde Node/operator-bootstrapflow komt het primaire Node-token nog steeds terecht met `scopes: []`.
- Als bootstrapoverdracht ook een operator-token uitgeeft, blijft dit beperkt tot de bootstrap-toelatingslijst: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- Bootstrap-scopecontroles zijn rolgeprefixt. Die operator-toelatingslijst voldoet alleen aan operator-verzoeken; niet-operatorrollen hebben nog steeds scopes nodig onder hun eigen rolprefix.
- Mobiel koppelen faalt gesloten voor Tailscale/openbare `ws://` gateway-URL's. Privé-LAN `ws://` blijft ondersteund, maar Tailscale/openbare mobiele routes moeten Tailscale Serve/Funnel of een `wss://` gateway-URL gebruiken.
- Met `--remote` vereist OpenClaw ofwel `gateway.remote.url` of
  `gateway.tailscale.mode=serve|funnel`.
- Met `--remote`, als effectief actieve externe referenties zijn geconfigureerd als SecretRefs en je geen `--token` of `--password` meegeeft, lost de opdracht ze op vanuit de actieve gateway-snapshot. Als de gateway niet beschikbaar is, faalt de opdracht direct.
- Zonder `--remote` worden lokale gateway-authenticatie-SecretRefs opgelost wanneer er geen CLI-authenticatieoverschrijving wordt meegegeven:
  - `gateway.auth.token` wordt opgelost wanneer tokenauthenticatie kan winnen (expliciete `gateway.auth.mode="token"` of afgeleide modus waarbij geen wachtwoordbron wint).
  - `gateway.auth.password` wordt opgelost wanneer wachtwoordauthenticatie kan winnen (expliciete `gateway.auth.mode="password"` of afgeleide modus zonder winnend token uit auth/env).
- Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd (inclusief SecretRefs) en `gateway.auth.mode` niet is ingesteld, faalt het oplossen van de instelcode totdat de modus expliciet is ingesteld.
- Opmerking over Gateway-versieverschillen: dit opdrachtpad vereist een gateway die `secrets.resolve` ondersteunt; oudere gateways retourneren een onbekende-methodefout.
- Keur na het scannen apparaatkoppeling goed met:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Verwant

- [CLI-referentie](/nl/cli)
- [Koppelen](/nl/cli/pairing)
