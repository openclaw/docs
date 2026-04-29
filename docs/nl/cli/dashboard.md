---
read_when:
    - Je wilt de bedieningsinterface openen met je huidige token
    - Je wilt de URL weergeven zonder een browser te starten
summary: CLI-referentie voor `openclaw dashboard` (open de Control UI)
title: Dashboard
x-i18n:
    generated_at: "2026-04-29T22:31:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce485388465fb93551be8ccf0aa01ea52e4feb949ef0d48c96b4f8ea65a6551c
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

Open de bedienings-UI met je huidige authenticatie.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Opmerkingen:

- `dashboard` lost geconfigureerde `gateway.auth.token` SecretRefs op wanneer mogelijk.
- `dashboard` volgt `gateway.tls.enabled`: gateways met TLS ingeschakeld tonen/openen
  `https://`-URL's voor de bedienings-UI en maken verbinding via `wss://`.
- Voor door SecretRef beheerde tokens (opgelost of niet opgelost) toont/kopieert/opent `dashboard` een URL zonder token om te voorkomen dat externe geheimen worden blootgesteld in terminaluitvoer, klembordgeschiedenis of browserstartargumenten.
- Als `gateway.auth.token` door SecretRef wordt beheerd maar in dit opdrachtpad niet is opgelost, toont de opdracht een URL zonder token en expliciete herstelrichtlijnen in plaats van een ongeldige token-placeholder in te sluiten.

## Gerelateerd

- [CLI-naslag](/nl/cli)
- [Dashboard](/nl/web/dashboard)
