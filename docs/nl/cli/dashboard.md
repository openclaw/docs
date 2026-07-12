---
read_when:
    - Je wilt de Control UI openen met je huidige token
    - U wilt de URL afdrukken zonder een browser te starten
summary: CLI-referentie voor `openclaw dashboard` (de bedieningsinterface openen)
title: Dashboard
x-i18n:
    generated_at: "2026-07-12T08:40:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 349dff4bad7fc6aa622067ed502d7d6800b93ebcfe26d2594e602e06e564993f
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

Open de Control UI met uw huidige authenticatie.

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --yes
```

- `--no-open`: druk de URL af, maar open geen browser.
- `--yes`: start/installeer de Gateway zo nodig zonder om bevestiging te vragen.

Opmerkingen:

- Lost geconfigureerde `gateway.auth.token`-SecretRefs waar mogelijk op.
- Volgt `gateway.tls.enabled`: Gateways met TLS drukken Control UI-URL's met `https://` af/openen deze en maken verbinding via `wss://`.
- Bij een `lan`-binding of een `custom`-binding met een jokerteken gebruiken starts op dezelfde host altijd local loopback, omdat een jokerteken geen browserbestemming is. Onversleutelde `tailnet`- en `custom`-bindingen gebruiken ook `127.0.0.1`, zodat de browser een beveiligde context heeft; specifieke hosts met TLS behouden het geconfigureerde adres, zodat certificaatnamen overeenkomen.
- Voordat een geauthenticeerde local loopback-URL voor een binding aan een specifieke interface wordt verstrekt, controleert de opdracht de geconfigureerde interface en verifieert deze dat de interface en `127.0.0.1` eigendom zijn van hetzelfde Gateway-proces. Bij onduidelijk eigenaarschap van de listener wordt de bewerking veilig geweigerd met statusinstructies.
- Voor door SecretRef beheerde tokens (opgelost of niet opgelost) bevat de afgedrukte/gekopieerde/geopende URL nooit het token, zodat externe geheimen niet uitlekken naar terminaluitvoer, klembordgeschiedenis of argumenten voor het starten van de browser.
- Als `gateway.auth.token` door SecretRef wordt beheerd maar niet kan worden opgelost, drukt de opdracht een URL zonder token en instructies voor herstel af in plaats van een ongeldige tijdelijke tokenwaarde.
- Als levering via het klembord of de browser mislukt voor een met een token geauthenticeerde URL, registreert de opdracht een veilige hint voor handmatige authenticatie waarin `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.token` en de URL-fragmentsleutel `token` worden genoemd, zonder de tokenwaarde af te drukken.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Dashboard](/nl/web/dashboard)
