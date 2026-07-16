---
read_when:
    - Je wilt de Control UI openen met je huidige token
    - Je wilt de URL weergeven zonder een browser te starten
summary: CLI-referentie voor `openclaw dashboard` (de Control UI openen)
title: Dashboard
x-i18n:
    generated_at: "2026-07-16T15:23:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 168605e1e58827020b4d247afd513880335273e489995549377bc2dc1f8a3b25
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

Open de Control UI met je huidige authenticatie.

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --json
openclaw dashboard --yes
```

- `--no-open`: toon de URL, maar open geen browser.
- `--json`: toon één machineleesbaar verbindingsobject zonder een browser te openen, het klembord te gebruiken, om invoer te vragen of de Gateway te starten.
- `--yes`: start/installeer de Gateway indien nodig zonder om bevestiging te vragen.

## Machineleesbare uitvoer

Gebruik `--json` voor desktopintegraties en scripts die de herleide URL van de Control UI nodig hebben:

```bash
openclaw dashboard --json
```

Het antwoord bevat `url`, `httpUrl`, `wsUrl`, `port` en `tokenIncluded`. Als de Gateway niet gereed is, retourneert de opdracht `{"ok":false,"reason":"..."}` en wordt deze afgesloten met een niet-nulstatus. Door SecretRef beheerde tokens worden nooit opgenomen in `url`.

Opmerkingen:

- Lost geconfigureerde `gateway.auth.token`-SecretRefs waar mogelijk op.
- Volgt `gateway.tls.enabled`: Gateways met TLS tonen/openen `https://`-URL's van de Control UI en maken verbinding via `wss://`.
- Bij een `lan`-binding of een jokertekenbinding voor `custom` gebruiken starts op dezelfde host altijd loopback, omdat een jokerteken geen browserbestemming is. Onversleutelde `tailnet`- en `custom`-bindingen gebruiken ook `127.0.0.1`, zodat de browser een beveiligde context heeft; specifieke hosts met TLS behouden het geconfigureerde adres, zodat de certificaatnamen overeenkomen.
- Voordat een geauthenticeerde loopback-URL voor een binding aan een specifieke interface wordt aangeleverd, controleert de opdracht de geconfigureerde interface en verifieert deze dat de interface en `127.0.0.1` eigendom zijn van hetzelfde Gateway-proces. Bij onduidelijk eigendom van de listener wordt de bewerking veilig geweigerd met statusinstructies.
- Bij door SecretRef beheerde tokens (opgelost of niet opgelost) bevat de getoonde/gekopieerde/geopende URL nooit het token, zodat externe geheimen niet uitlekken naar terminaluitvoer, klembordgeschiedenis of argumenten voor het starten van de browser.
- Als `gateway.auth.token` door SecretRef wordt beheerd maar niet kan worden opgelost, toont de opdracht een URL zonder token en instructies om het probleem te verhelpen in plaats van een ongeldige tokenplaceholder.
- Als levering via het klembord/de browser voor een met een token geauthenticeerde URL mislukt, registreert de opdracht een veilige tip voor handmatige authenticatie met de namen `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.token` en de URL-fragmentsleutel `token`, zonder de tokenwaarde te tonen.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Dashboard](/nl/web/dashboard)
