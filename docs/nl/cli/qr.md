---
read_when:
    - Je wilt snel een mobiele Node-app met een Gateway koppelen
    - Je hebt setupcode-uitvoer nodig voor delen op afstand/handmatig delen
summary: CLI-referentie voor `openclaw qr` (QR-code voor mobiele koppeling + installatiecode)
title: QR
x-i18n:
    generated_at: "2026-05-06T09:06:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2e8f86b860701dcd625b6573070e30ed26a2f3fda9e5e7998723c8058de498b
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Genereer een QR-code voor mobiele koppeling en setupcode vanuit je huidige Gateway-configuratie.

## Gebruik

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## Opties

- `--remote`: geef de voorkeur aan `gateway.remote.url`; als deze niet is ingesteld, kan `gateway.tailscale.mode=serve|funnel` nog steeds de openbare externe URL leveren
- `--url <url>`: overschrijf de Gateway-URL die in de payload wordt gebruikt
- `--public-url <url>`: overschrijf de openbare URL die in de payload wordt gebruikt
- `--token <token>`: overschrijf tegen welk Gateway-token de bootstrap-flow zich authenticeert
- `--password <password>`: overschrijf tegen welk Gateway-wachtwoord de bootstrap-flow zich authenticeert
- `--setup-code-only`: druk alleen de setupcode af
- `--no-ascii`: sla ASCII-QR-rendering over
- `--json`: geef JSON uit (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Opmerkingen

- `--token` en `--password` sluiten elkaar uit.
- De setupcode zelf bevat nu een ondoorzichtige kortlevende `bootstrapToken`, niet het gedeelde Gateway-token/-wachtwoord.
- In de ingebouwde bootstrap-flow voor Node/operator komt het primaire Node-token nog steeds terecht met `scopes: []`.
- Als bootstrap-overdracht ook een operatortoken uitgeeft, blijft dit beperkt tot de bootstrap-allowlist: `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`.
- Bootstrap-scopecontroles zijn rolgeprefixeerd. Die operator-allowlist voldoet alleen aan operatorverzoeken; niet-operatorrollen hebben nog steeds scopes onder hun eigen rolprefix nodig.
- Mobiele koppeling faalt gesloten voor Tailscale/openbare `ws://` Gateway-URL's. Privé-LAN-adressen en `.local` Bonjour-hosts blijven ondersteund via `ws://`, maar Tailscale/openbare mobiele routes moeten Tailscale Serve/Funnel of een `wss://` Gateway-URL gebruiken.
- Met `--remote` vereist OpenClaw `gateway.remote.url` of
  `gateway.tailscale.mode=serve|funnel`.
- Met `--remote`, als effectief actieve externe inloggegevens zijn geconfigureerd als SecretRefs en je geen `--token` of `--password` doorgeeft, haalt de opdracht ze op uit de actieve Gateway-snapshot. Als de Gateway niet beschikbaar is, faalt de opdracht onmiddellijk.
- Zonder `--remote` worden SecretRefs voor lokale Gateway-authenticatie opgehaald wanneer geen CLI-authenticatie-overschrijving wordt doorgegeven:
  - `gateway.auth.token` wordt opgehaald wanneer tokenauthenticatie kan winnen (expliciete `gateway.auth.mode="token"` of afgeleide modus waarin geen wachtwoordbron wint).
  - `gateway.auth.password` wordt opgehaald wanneer wachtwoordauthenticatie kan winnen (expliciete `gateway.auth.mode="password"` of afgeleide modus zonder winnend token uit auth/env).
- Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd (inclusief SecretRefs) en `gateway.auth.mode` niet is ingesteld, faalt het oplossen van de setupcode totdat de modus expliciet is ingesteld.
- Opmerking over Gateway-versiescheefstand: dit opdrachtpad vereist een Gateway die `secrets.resolve` ondersteunt; oudere Gateways geven een onbekende-methodefout terug.
- Keur apparaatkoppeling na het scannen goed met:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Koppeling](/nl/cli/pairing)
