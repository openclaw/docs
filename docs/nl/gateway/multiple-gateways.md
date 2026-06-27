---
read_when:
    - Meerdere Gateways op dezelfde machine uitvoeren
    - Je hebt geïsoleerde configuratie/status/poorten per Gateway nodig
summary: Voer meerdere OpenClaw Gateways uit op één host (isolatie, poorten en profielen)
title: Meerdere gateways
x-i18n:
    generated_at: "2026-06-27T17:34:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d6f6df481f6ba36749770199ef6eaf94eed33af2bed38d35a31f77b9dbba1913
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

De meeste installaties moeten één Gateway gebruiken, omdat één Gateway meerdere berichtverbindingen en agents kan afhandelen. Als je sterkere isolatie of redundantie nodig hebt (bijv. een reddingsbot), voer dan afzonderlijke Gateways uit met geïsoleerde profielen/poorten.

## Beste aanbevolen installatie

Voor de meeste gebruikers is de eenvoudigste installatie voor een reddingsbot:

- houd de hoofdbot op het standaardprofiel
- voer de reddingsbot uit op `--profile rescue`
- gebruik een volledig aparte Telegram-bot voor het reddingsaccount
- houd de reddingsbot op een andere basispoort, zoals `19789`

Dit houdt de reddingsbot geïsoleerd van de hoofdbot, zodat die configuratiewijzigingen kan debuggen of toepassen als de primaire bot offline is. Laat minstens 20 poorten tussen basispoorten, zodat de afgeleide browser-/canvas-/CDP-poorten nooit botsen.

## Snelstart voor reddingsbot

Gebruik dit als het standaardpad, tenzij je een sterke reden hebt om iets anders te doen:

```bash
# Rescue bot (separate Telegram bot, separate profile, port 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Als je hoofdbot al draait, is dat meestal alles wat je nodig hebt.

Tijdens `openclaw --profile rescue onboard`:

- gebruik de aparte Telegram-bottoken
- behoud het `rescue`-profiel
- gebruik een basispoort die minstens 20 hoger is dan die van de hoofdbot
- accepteer de standaardreddingswerkruimte, tenzij je er zelf al een beheert

Als onboarding de reddingsservice al voor je heeft geïnstalleerd, is de laatste `gateway install` niet nodig.

## Waarom dit werkt

De reddingsbot blijft onafhankelijk omdat die een eigen heeft:

- profiel/configuratie
- statusmap
- werkruimte
- basispoort (plus afgeleide poorten)
- Telegram-bottoken

Gebruik voor de meeste installaties een volledig aparte Telegram-bot voor het reddingsprofiel:

- eenvoudig operator-only te houden
- aparte bottoken en identiteit
- onafhankelijk van de kanaal-/appinstallatie van de hoofdbot
- eenvoudig herstelpad via DM wanneer de hoofdbot kapot is

## Wat `--profile rescue onboard` wijzigt

`openclaw --profile rescue onboard` gebruikt de normale onboardingflow, maar schrijft alles naar een apart profiel.

In de praktijk betekent dat dat de reddingsbot een eigen krijgt:

- configuratiebestand
- statusmap
- werkruimte (standaard `~/.openclaw/workspace-rescue`)
- beheerde servicenaam

De prompts zijn verder hetzelfde als bij normale onboarding.

## Algemene installatie met meerdere Gateways

De bovenstaande indeling voor de reddingsbot is de eenvoudigste standaard, maar hetzelfde isolatiepatroon werkt voor elk paar of elke groep Gateways op één host.

Voor een algemenere installatie geef je elke extra Gateway een eigen benoemd profiel en een eigen basispoort:

```bash
# main (default profile)
openclaw setup
openclaw gateway --port 18789

# extra gateway
openclaw --profile ops setup
openclaw --profile ops gateway --port 19789
```

Als je wilt dat beide Gateways benoemde profielen gebruiken, kan dat ook:

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

Gebruik de snelstart voor de reddingsbot wanneer je een fallback-operatorpad wilt. Gebruik het algemene profielpatroon wanneer je meerdere langlevende Gateways wilt voor verschillende kanalen, tenants, werkruimten of operationele rollen.

## Isolatiechecklist

Houd deze uniek per Gateway-instantie:

- `OPENCLAW_CONFIG_PATH` — configuratiebestand per instantie
- `OPENCLAW_STATE_DIR` — sessies, aanmeldgegevens en caches per instantie
- `agents.defaults.workspace` — hoofdmap van de werkruimte per instantie
- `gateway.port` (of `--port`) — uniek per instantie
- afgeleide browser-/canvas-/CDP-poorten

Als deze worden gedeeld, krijg je configuratieraces en poortconflicten.

## Poorttoewijzing (afgeleid)

Basispoort = `gateway.port` (of `OPENCLAW_GATEWAY_PORT` / `--port`).

- poort voor browserbesturingsservice = basis + 2 (alleen loopback)
- canvashost wordt aangeboden op de Gateway-HTTP-server (dezelfde poort als `gateway.port`)
- CDP-poorten voor browserprofielen worden automatisch toegewezen vanaf `browser.controlPort + 9 .. + 108`

Als je een van deze in configuratie of env overschrijft, moet je ze uniek houden per instantie.

## Browser-/CDP-opmerkingen (veelvoorkomende valkuil)

- Zet `browser.cdpUrl` **niet** vast op dezelfde waarden voor meerdere instanties.
- Elke instantie heeft een eigen browserbesturingspoort en CDP-bereik nodig (afgeleid van de Gateway-poort).
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

- `gateway status --deep` helpt verouderde launchd-/systemd-/schtasks-services van oudere installaties op te sporen.
- Waarschuwingstekst van `gateway probe`, zoals `multiple reachable gateway identities detected`, wordt alleen verwacht wanneer je bewust meer dan één geïsoleerde Gateway uitvoert, of wanneer OpenClaw niet kan bewijzen dat bereikbare probedoelen dezelfde Gateway zijn. Een SSH-tunnel, proxy-URL of geconfigureerde externe URL naar dezelfde Gateway is één Gateway met meerdere transports, zelfs wanneer transportpoorten verschillen.

## Gerelateerd

- [Gateway-runbook](/nl/gateway)
- [Gateway-lock](/nl/gateway/gateway-lock)
- [Configuratie](/nl/gateway/configuration)
