---
read_when:
    - De Mac-app integreren met de levenscyclus van de Gateway
summary: Gateway-levenscyclus op macOS (launchd)
title: Gateway-levenscyclus op macOS
x-i18n:
    generated_at: "2026-07-12T08:59:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89a27334afcecb322feb2732cf6282b4c286ef27828a1b57157f9d4fc161aed6
    source_path: platforms/mac/child-process.md
    workflow: 16
---

De macOS-app beheert de Gateway standaard via **launchd** en start de Gateway niet als onderliggend proces. De app probeert eerst verbinding te maken met een Gateway die al op de geconfigureerde poort draait. Als er geen bereikbaar is, schakelt de app de launchd-service in via de externe `openclaw`-CLI (zonder ingebouwde runtime). Dit zorgt voor betrouwbaar automatisch starten bij het aanmelden en herstarten na crashes.

De modus voor onderliggende processen (waarbij de Gateway rechtstreeks door de app wordt gestart) wordt momenteel **niet gebruikt**. Als je een nauwere koppeling met de gebruikersinterface nodig hebt, voer je de Gateway handmatig uit in een terminal.

## Standaardgedrag (launchd)

- De app installeert een LaunchAgent per gebruiker met het label `ai.openclaw.gateway` (of
  `ai.openclaw.<profile>` bij gebruik van `--profile`/`OPENCLAW_PROFILE`).
- Wanneer de lokale modus is ingeschakeld, zorgt de app ervoor dat de LaunchAgent is geladen en
  start deze zo nodig de Gateway.
- Logboeken worden naar het pad voor het launchd-Gateway-logboek geschreven (zichtbaar in de foutopsporingsinstellingen).

Veelgebruikte opdrachten:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Vervang bij gebruik van een benoemd profiel het label door `ai.openclaw.<profile>`.

## Niet-ondertekende ontwikkelbuilds

`scripts/restart-mac.sh --no-sign` is bedoeld voor snelle lokale builds zonder ondertekeningssleutels. Om te voorkomen dat launchd naar een niet-ondertekend relay-binair bestand verwijst, schrijft het script
`~/.openclaw/disable-launchagent`.

Ondertekende uitvoeringen van `scripts/restart-mac.sh` wissen deze overschrijving als de markering aanwezig is. Handmatig herstellen:

```bash
rm ~/.openclaw/disable-launchagent
```

## Modus voor alleen verbinding maken

Om af te dwingen dat de macOS-app launchd nooit installeert of beheert, start je de app met
`--attach-only` (of `--no-launchd`). Hiermee wordt
`~/.openclaw/disable-launchagent` ingesteld, zodat de app alleen verbinding maakt met een Gateway die al actief is. Schakel hetzelfde gedrag in of uit via de foutopsporingsinstellingen.

## Externe modus

De externe modus start nooit een lokale Gateway. De app gebruikt een SSH-tunnel naar de externe host en maakt via die tunnel verbinding.

## Waarom we de voorkeur geven aan launchd

- Automatisch starten bij het aanmelden.
- Ingebouwde semantiek voor herstarten en KeepAlive.
- Voorspelbare logboeken en procesbewaking.

Als er ooit weer een echte modus voor onderliggende processen nodig is, moet die worden gedocumenteerd als een afzonderlijke, expliciete modus die uitsluitend voor ontwikkeling is bedoeld.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [Gateway-draaiboek](/nl/gateway)
