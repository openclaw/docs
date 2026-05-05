---
read_when:
    - Je wilt de Control UI openen met je huidige token
    - Je wilt de URL weergeven zonder een browser te starten
summary: CLI-referentie voor `openclaw dashboard` (de bedienings-UI openen)
title: Dashboard
x-i18n:
    generated_at: "2026-05-05T01:44:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51b3326b3884013ebcf570b417e66efe62ea89dcdedb5ab3173f39fb021de89f
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

Open de Control UI met je huidige authenticatie.

```bash
openclaw dashboard
openclaw dashboard --no-open
```

Opmerkingen:

- `dashboard` zet geconfigureerde `gateway.auth.token` SecretRefs om wanneer dat mogelijk is.
- `dashboard` volgt `gateway.tls.enabled`: gateways met TLS ingeschakeld tonen/openen
  `https://` Control UI-URL's en verbinden via `wss://`.
- Als levering via klembord/browser mislukt voor een dashboard-URL met tokenauthenticatie,
  logt `dashboard` een veilige hint voor handmatige authenticatie met de namen `OPENCLAW_GATEWAY_TOKEN`,
  `gateway.auth.token` en fragmentsleutel `token`, zonder de tokenwaarde
  te tonen.
- Voor door SecretRef beheerde tokens (opgelost of onopgelost) toont/kopieert/opent `dashboard` een URL zonder token om te voorkomen dat externe geheimen worden blootgesteld in terminaluitvoer, klembordgeschiedenis of browserstartargumenten.
- Als `gateway.auth.token` door SecretRef wordt beheerd maar in dit opdrachtpad niet kan worden opgelost, toont de opdracht een URL zonder token en expliciete herstelrichtlijnen in plaats van een ongeldige tokenplaceholder in te sluiten.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Dashboard](/nl/web/dashboard)
