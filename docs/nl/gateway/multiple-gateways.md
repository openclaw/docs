---
read_when:
    - Meer dan één Gateway op dezelfde machine uitvoeren
    - Je hebt geïsoleerde configuratie/toestand/poorten per Gateway nodig
summary: Meerdere OpenClaw Gateways op één host uitvoeren (isolatie, poorten en profielen)
title: Meerdere Gateways
x-i18n:
    generated_at: "2026-04-29T22:46:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 655f9ea5100813d5836f24eb47a5646443f83d70953efa64122633a5a1341002
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

De meeste setups zouden één Gateway moeten gebruiken, omdat één Gateway meerdere messaging-verbindingen en agents kan afhandelen. Als je sterkere isolatie of redundantie nodig hebt (bijv. een reddingsbot), draai dan afzonderlijke Gateways met geïsoleerde profielen/poorten.

## Beste aanbevolen setup

Voor de meeste gebruikers is de eenvoudigste setup voor een reddingsbot:

- houd de hoofdbot op het standaardprofiel
- draai de reddingsbot op `--profile rescue`
- gebruik een volledig aparte Telegram-bot voor het reddingsaccount
- houd de reddingsbot op een andere basispoort, zoals `19789`

Zo blijft de reddingsbot geïsoleerd van de hoofdbot, zodat hij configuratiewijzigingen kan debuggen of toepassen als de primaire bot uitvalt. Laat minstens 20 poorten tussen basispoorten zodat de afgeleide browser/canvas/CDP-poorten nooit conflicteren.

## Snelstart voor reddingsbot

Gebruik dit als standaardpad, tenzij je een sterke reden hebt om iets anders te doen:

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Als je hoofdbot al draait, is dat meestal alles wat je nodig hebt.

Tijdens `openclaw --profile rescue onboard`:

- gebruik het aparte Telegram-bottoken
- behoud het `rescue`-profiel
- gebruik een basispoort die minstens 20 hoger is dan die van de hoofdbot
- accepteer de standaardwerkruimte voor redding, tenzij je er zelf al een beheert

Als onboarding de reddingsservice al voor je heeft geïnstalleerd, is de laatste `gateway install` niet nodig.

## Waarom dit werkt

De reddingsbot blijft onafhankelijk omdat hij zijn eigen zaken heeft:

- profiel/configuratie
- statusmap
- werkruimte
- basispoort (plus afgeleide poorten)
- Telegram-bottoken

Gebruik voor de meeste setups een volledig aparte Telegram-bot voor het reddingsprofiel:

- eenvoudig operator-only te houden
- afzonderlijk bottoken en identiteit
- onafhankelijk van de kanaal-/appinstallatie van de hoofdbot
- eenvoudig herstelpad via DM wanneer de hoofdbot defect is

## Wat `--profile rescue onboard` wijzigt

`openclaw --profile rescue onboard` gebruikt de normale onboardingflow, maar schrijft alles naar een afzonderlijk profiel.

In de praktijk betekent dit dat de reddingsbot zijn eigen zaken krijgt:

- configuratiebestand
- statusmap
- werkruimte (standaard `~/.openclaw/workspace-rescue`)
- naam van beheerde service

De prompts zijn verder hetzelfde als bij normale onboarding.

## Algemene setup met meerdere Gateways

De bovenstaande indeling voor een reddingsbot is de eenvoudigste standaard, maar hetzelfde isolatiepatroon werkt voor elk paar of elke groep Gateways op één host.

Geef voor een algemenere setup elke extra Gateway zijn eigen benoemde profiel en zijn eigen basispoort:

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Als je wilt dat beide Gateways benoemde profielen gebruiken, werkt dat ook:

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

Gebruik de snelstart voor de reddingsbot wanneer je een uitwijkpad voor operators wilt. Gebruik het algemene profielpatroon wanneer je meerdere langlevende Gateways wilt voor verschillende kanalen, tenants, werkruimten of operationele rollen.

## Isolatiechecklist

Houd deze uniek per Gateway-instantie:

- `OPENCLAW_CONFIG_PATH` — configuratiebestand per instantie
- `OPENCLAW_STATE_DIR` — sessies, inloggegevens en caches per instantie
- `agents.defaults.workspace` — werkruimte-root per instantie
- `gateway.port` (of `--port`) — uniek per instantie
- afgeleide browser/canvas/CDP-poorten

Als deze worden gedeeld, krijg je configuratieraces en poortconflicten.

## Poorttoewijzing (afgeleid)

Basispoort = `gateway.port` (of `OPENCLAW_GATEWAY_PORT` / `--port`).

- poort voor browserbesturingsservice = basis + 2 (alleen loopback)
- canvas-host wordt aangeboden op de Gateway HTTP-server (dezelfde poort als `gateway.port`)
- CDP-poorten voor browserprofielen worden automatisch toegewezen uit `browser.controlPort + 9 .. + 108`

Als je een van deze overschrijft in configuratie of env, moet je ze uniek houden per instantie.

## Browser/CDP-opmerkingen (veelvoorkomende valkuil)

- Pin `browser.cdpUrl` **niet** op dezelfde waarden voor meerdere instanties.
- Elke instantie heeft zijn eigen browserbesturingspoort en CDP-bereik nodig (afgeleid van de Gateway-poort).
- Als je expliciete CDP-poorten nodig hebt, stel dan `browser.profiles.<name>.cdpPort` per instantie in.
- Externe Chrome: gebruik `browser.profiles.<name>.cdpUrl` (per profiel, per instantie).

## Handmatig env-voorbeeld

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

Interpretatie:

- `gateway status --deep` helpt verouderde launchd/systemd/schtasks-services van oudere installaties te detecteren.
- Waarschuwingstekst van `gateway probe`, zoals `multiple reachable gateways detected`, wordt alleen verwacht wanneer je bewust meer dan één geïsoleerde Gateway draait.

## Gerelateerd

- [Gateway-runbook](/nl/gateway)
- [Gateway-lock](/nl/gateway/gateway-lock)
- [Configuratie](/nl/gateway/configuration)
