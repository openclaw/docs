---
read_when:
    - De Mac-app integreren met de Gateway-levenscyclus
summary: Gateway-levenscyclus op macOS (launchd)
title: Gateway-levenscyclus
x-i18n:
    generated_at: "2026-04-29T22:59:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: a110d8f4384301987f7748cb9591f8899aa845fcf635035407a7aa401b132fc4
    source_path: platforms/mac/child-process.md
    workflow: 16
---

# Gateway-levenscyclus op macOS

De macOS-app **beheert de Gateway standaard via launchd** en start de Gateway
niet als childproces. De app probeert eerst verbinding te maken met een al
actieve Gateway op de geconfigureerde poort; als er geen bereikbaar is, schakelt
de app de launchd-service in via de externe `openclaw` CLI (geen ingesloten
runtime). Dit biedt betrouwbare automatische start bij inloggen en herstarten na
crashes.

Childprocesmodus (Gateway rechtstreeks door de app gestart) is vandaag **niet in gebruik**.
Als je nauwere koppeling met de gebruikersinterface nodig hebt, voer de Gateway
handmatig uit in een terminal.

## Standaardgedrag (launchd)

- De app installeert een LaunchAgent per gebruiker met het label `ai.openclaw.gateway`
  (of `ai.openclaw.<profile>` bij gebruik van `--profile`/`OPENCLAW_PROFILE`; verouderde `com.openclaw.*` wordt ondersteund).
- Wanneer de lokale modus is ingeschakeld, zorgt de app ervoor dat de LaunchAgent is geladen en
  start de Gateway indien nodig.
- Logs worden geschreven naar het launchd-gatewaylogpad (zichtbaar in Debuginstellingen).

Veelgebruikte opdrachten:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Vervang het label door `ai.openclaw.<profile>` wanneer je een benoemd profiel uitvoert.

## Niet-ondertekende ontwikkelbuilds

`scripts/restart-mac.sh --no-sign` is bedoeld voor snelle lokale builds wanneer je geen
ondertekeningssleutels hebt. Om te voorkomen dat launchd naar een niet-ondertekend relay-binair bestand verwijst, wordt het volgende gedaan:

- Schrijft `~/.openclaw/disable-launchagent`.

Ondertekende uitvoeringen van `scripts/restart-mac.sh` wissen deze overschrijving als de markering
aanwezig is. Handmatig resetten:

```bash
rm ~/.openclaw/disable-launchagent
```

## Modus Alleen koppelen

Om af te dwingen dat de macOS-app **launchd nooit installeert of beheert**, start je deze met
`--attach-only` (of `--no-launchd`). Dit stelt `~/.openclaw/disable-launchagent` in,
zodat de app alleen koppelt met een al actieve Gateway. Je kunt hetzelfde
gedrag in- en uitschakelen in Debuginstellingen.

## Externe modus

Externe modus start nooit een lokale Gateway. De app gebruikt een SSH-tunnel naar de
externe host en maakt via die tunnel verbinding.

## Waarom we launchd verkiezen

- Automatisch starten bij inloggen.
- Ingebouwde herstart-/KeepAlive-semantiek.
- Voorspelbare logs en toezicht.

Als een echte childprocesmodus ooit weer nodig is, moet die worden gedocumenteerd als een
afzonderlijke, expliciete modus alleen voor ontwikkeling.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [Gateway-runbook](/nl/gateway)
