---
read_when:
    - Meer dan één Gateway op dezelfde machine uitvoeren
    - Je hebt per Gateway geïsoleerde configuratie, status en poorten nodig
summary: Meerdere OpenClaw Gateways op één host uitvoeren (isolatie, poorten en profielen)
title: Meerdere gateways
x-i18n:
    generated_at: "2026-07-16T15:38:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 655fa865a98064d7c017a7c2eb08ea9a9683002d96a3dbe45a8c16cbd3c86ba1
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

Voor de meeste configuraties is één Gateway nodig: één Gateway verwerkt meerdere berichtenverbindingen en agents. Voer afzonderlijke Gateways met geïsoleerde profielen/poorten alleen uit wanneer je sterkere isolatie of redundantie nodig hebt (bijvoorbeeld een reddingsbot).

## Snelstart voor reddingsbot

De eenvoudigste configuratie voor een reddingsbot:

- Laat de hoofdbot het standaardprofiel gebruiken.
- Voer de reddingsbot uit op `--profile rescue`, met een eigen Telegram-bottoken.
- Gebruik voor de reddingsbot een andere basispoort, bijvoorbeeld `19789`.

Zo kan de reddingsbot fouten opsporen of configuratiewijzigingen toepassen als de primaire bot niet beschikbaar is. Houd minstens 20 poorten vrij tussen basispoorten, zodat afgeleide browser-/CDP-poorten nooit conflicteren.

```bash
# Reddingsbot (afzonderlijke Telegram-bot, afzonderlijk profiel, poort 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Als je hoofdbot al actief is, is dit doorgaans alles wat je nodig hebt. Als tijdens de onboarding de reddingsservice al is geïnstalleerd, sla je de laatste `gateway install` over.

Tijdens `openclaw --profile rescue onboard`:

- Gebruik een afzonderlijk Telegram-bottoken dat specifiek voor het reddingsaccount is bedoeld (eenvoudig exclusief voor operators te houden, onafhankelijk van de kanaal-/appinstallatie van de hoofdbot en een eenvoudig herstelpad via DM).
- Behoud de profielnaam `rescue`.
- Gebruik een basispoort die minstens 20 hoger is dan die van de hoofdbot.
- Accepteer de standaardwerkruimte voor redding, tenzij je er zelf al een beheert.

### Wat `--profile rescue onboard` wijzigt

`--profile rescue onboard` voert de normale onboardingprocedure uit, maar schrijft alles naar een afzonderlijk profiel, zodat de reddingsbot het volgende voor zichzelf krijgt:

- Profiel-/configuratiebestand
- Statusmap
- Werkruimte (standaard: `~/.openclaw/workspace-rescue`)
- Naam van beheerde service
- Basispoort (plus afgeleide poorten)
- Telegram-bottoken

De prompts zijn verder identiek aan die van de normale onboarding.

## Algemene configuratie met meerdere Gateways

Hetzelfde isolatiepatroon werkt voor elk paar of elke groep Gateways op één host: geef elke extra Gateway een eigen benoemd profiel en een eigen basispoort:

```bash
# hoofdinstantie (standaardprofiel)
openclaw setup
openclaw gateway --port 18789

# extra Gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Benoemde profielen aan beide kanten werken ook:

```bash
openclaw --profile main setup
openclaw --profile main gateway --port 18789

openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Services volgen hetzelfde patroon:

```bash
openclaw gateway install
openclaw --profile ops gateway install --port 19789
```

Gebruik de snelstart voor de reddingsbot voor een terugvalroute voor operators; gebruik het algemene profielpatroon voor meerdere langdurig actieve Gateways voor verschillende kanalen, tenants, werkruimten of operationele rollen.

## Isolatiechecklist

Houd deze instellingen uniek per Gateway-instantie:

| Instelling                      | Doel                                 |
| ------------------------------- | ------------------------------------ |
| `OPENCLAW_CONFIG_PATH`       | Configuratiebestand per instantie    |
| `OPENCLAW_STATE_DIR`         | Sessies, inloggegevens en caches per instantie |
| `agents.defaults.workspace`  | Hoofdmap van werkruimte per instantie |
| `gateway.port` (of `--port`) | Uniek per instantie                  |
| Afgeleide browser-/CDP-poorten  | Zie hieronder                        |

Het delen van een van deze onderdelen veroorzaakt conflicten met configuratie, status of poorten. Bij het starten van de Gateway
wordt uniek eigendom van de statusmap afgedwongen, zelfs wanneer
`OPENCLAW_ALLOW_MULTI_GATEWAY=1` de singleton per configuratie overslaat.

## Poorttoewijzing (afgeleid)

Basispoort = `gateway.port` (of `OPENCLAW_GATEWAY_PORT` / `--port`).

- Poort van de browserbesturingsservice = basis + 2 (alleen loopback).
- De Canvas-host wordt aangeboden op de HTTP-server van de Gateway zelf (dezelfde poort als `gateway.port`).
- CDP-poorten voor browserprofielen worden automatisch toegewezen van `browser control port + 9` tot en met `+ 108`.

Als je een van deze waarden in de configuratie of omgeving overschrijft, moet je ze uniek houden per instantie.

## Opmerkingen over browser/CDP (veelvoorkomende valkuil)

- Stel `browser.cdpUrl` **niet** vast op dezelfde waarde voor meerdere instanties.
- Elke instantie heeft een eigen browserbesturingspoort en CDP-bereik nodig (afgeleid van de Gateway-poort).
- Stel voor expliciete CDP-poorten `browser.profiles.<name>.cdpPort` per instantie in.
- Gebruik voor Chrome op afstand `browser.profiles.<name>.cdpUrl` (per profiel, per instantie).

## Handmatig omgevingsvoorbeeld

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/main.json \
OPENCLAW_STATE_DIR=~/.openclaw \
openclaw gateway --port 18789

OPENCLAW_CONFIG_PATH=~/.openclaw/rescue.json \
OPENCLAW_STATE_DIR=~/.openclaw-rescue \
openclaw gateway --port 19789
```

## Snelle controles

```bash
openclaw gateway status --deep
openclaw --profile rescue gateway status --deep
openclaw --profile rescue gateway probe
openclaw status
openclaw --profile rescue status
openclaw --profile rescue browser status
```

- `gateway status --deep` detecteert verouderde launchd-/systemd-/schtasks-services van oudere installaties.
- Waarschuwingstekst van `gateway probe`, zoals `multiple reachable gateway identities detected`, wordt alleen verwacht wanneer je opzettelijk meer dan één geïsoleerde Gateway uitvoert, of wanneer OpenClaw niet kan vaststellen dat bereikbare probedoelen dezelfde Gateway zijn. Een SSH-tunnel, proxy-URL of geconfigureerde externe URL naar dezelfde Gateway is één Gateway met meerdere transporten, zelfs wanneer de transportpoorten verschillen.

## Gerelateerd

- [Gateway-runbook](/nl/gateway)
- [Gateway-vergrendeling](/nl/gateway/gateway-lock)
- [Configuratie](/nl/gateway/configuration)
