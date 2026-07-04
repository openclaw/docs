---
read_when:
    - Je wilt snel een mobiele Node-app koppelen aan een Gateway
    - Je hebt uitvoer van de installatiecode nodig voor delen op afstand/handmatig delen
summary: CLI-referentie voor `openclaw qr` (genereer QR-code voor mobiele koppeling + installatiecode)
title: QR
x-i18n:
    generated_at: "2026-07-04T18:08:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 81d15c9d551960c6f5677649b481e447ecda55a395957746959b4ecf81712bdb
    source_path: cli/qr.md
    workflow: 16
---

# `openclaw qr`

Genereer een QR-code voor mobiele koppeling en een installatiecode op basis van je huidige Gateway-configuratie.

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
- `--token <token>`: overschrijf tegen welk gateway-token de bootstrap-flow authenticeert
- `--password <password>`: overschrijf tegen welk gateway-wachtwoord de bootstrap-flow authenticeert
- `--setup-code-only`: druk alleen de installatiecode af
- `--no-ascii`: sla ASCII-QR-weergave over
- `--json`: geef JSON uit (`setupCode`, `gatewayUrl`, `auth`, `urlSource`)

## Opmerkingen

- `--token` en `--password` sluiten elkaar uit.
- De installatiecode zelf bevat nu een ondoorzichtig kortlevend `bootstrapToken`, niet het gedeelde gateway-token/wachtwoord.
- Ingebouwde bootstrap met installatiecode retourneert een primair `node`-token met `scopes: []` plus een begrensd `operator`-overdrachtstoken voor vertrouwde mobiele onboarding.
- Het overgedragen operator-token is beperkt tot `operator.approvals`, `operator.read`, `operator.talk.secrets` en `operator.write`; scopes voor koppelingsmutaties en `operator.admin` vereisen nog steeds een afzonderlijk goedgekeurde operatorkoppeling of token-flow.
- Mobiele koppeling faalt gesloten voor Tailscale/openbare `ws://`-gateway-URL's. Privé-LAN-adressen en `.local` Bonjour-hosts blijven ondersteund via `ws://`, maar Tailscale/openbare mobiele routes moeten Tailscale Serve/Funnel of een `wss://`-gateway-URL gebruiken.
- Met `--remote` vereist OpenClaw ofwel `gateway.remote.url` of
  `gateway.tailscale.mode=serve|funnel`.
- Met `--remote`, als effectief actieve externe referenties zijn geconfigureerd als SecretRefs en je geen `--token` of `--password` doorgeeft, lost de opdracht ze op uit de actieve gateway-snapshot. Als Gateway niet beschikbaar is, faalt de opdracht direct.
- Zonder `--remote` worden SecretRefs voor lokale gateway-authenticatie opgelost wanneer er geen CLI-authenticatie-override wordt doorgegeven:
  - `gateway.auth.token` wordt opgelost wanneer tokenauthenticatie kan winnen (expliciete `gateway.auth.mode="token"` of afgeleide modus waarbij geen wachtwoordbron wint).
  - `gateway.auth.password` wordt opgelost wanneer wachtwoordauthenticatie kan winnen (expliciete `gateway.auth.mode="password"` of afgeleide modus zonder winnend token uit auth/env).
- Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd (inclusief SecretRefs) en `gateway.auth.mode` niet is ingesteld, faalt het oplossen van de installatiecode totdat de modus expliciet is ingesteld.
- Opmerking over Gateway-versieverschil: dit opdrachtpad vereist een gateway die `secrets.resolve` ondersteunt; oudere gateways retourneren een fout voor een onbekende methode.
- Officiële OpenClaw iOS- en Android-apps maken automatisch verbinding wanneer hun
  metadata voor installatiecode overeenkomen. Als een verzoek in behandeling blijft (bijvoorbeeld voor een
  niet-officiële client of niet-overeenkomende metadata), bekijk en keur het goed met:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Koppeling](/nl/cli/pairing)
