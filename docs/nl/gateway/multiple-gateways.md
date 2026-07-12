---
read_when:
    - Meer dan één Gateway op dezelfde machine uitvoeren
    - U hebt per Gateway afzonderlijke configuratie, status en poorten nodig
summary: Meerdere OpenClaw-Gateways uitvoeren op één host (isolatie, poorten en profielen)
title: Meerdere gateways
x-i18n:
    generated_at: "2026-07-12T08:54:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d5088d9bcfae6800217079365dcaec828a18ca19ac80c7ad7b4245d9059a986
    source_path: gateway/multiple-gateways.md
    workflow: 16
---

Voor de meeste configuraties is één Gateway nodig: één Gateway verwerkt meerdere berichtenverbindingen en agents. Voer afzonderlijke Gateways met geïsoleerde profielen/poorten alleen uit wanneer u sterkere isolatie of redundantie nodig hebt (bijvoorbeeld een reddingsbot).

## Snelstart voor een reddingsbot

De eenvoudigste configuratie voor een reddingsbot:

- Houd de hoofdbot op het standaardprofiel.
- Voer de reddingsbot uit met `--profile rescue` en een eigen Telegram-bottoken.
- Gebruik voor de reddingsbot een andere basispoort, bijvoorbeeld `19789`.

Zo kan de reddingsbot problemen opsporen of configuratiewijzigingen toepassen als de primaire bot niet beschikbaar is. Laat ten minste 20 poorten vrij tussen basispoorten, zodat afgeleide browser-/CDP-poorten nooit conflicteren.

```bash
# Reddingsbot (afzonderlijke Telegram-bot, afzonderlijk profiel, poort 19789)
openclaw --profile rescue onboard
openclaw --profile rescue gateway install --port 19789
```

Als uw hoofdbot al actief is, is dit doorgaans alles wat u nodig hebt. Als de onboarding de reddingsservice al heeft geïnstalleerd, slaat u de laatste `gateway install` over.

Tijdens `openclaw --profile rescue onboard`:

- Gebruik een afzonderlijk Telegram-bottoken dat uitsluitend voor het reddingsaccount bestemd is (eenvoudig te beperken tot operators, onafhankelijk van de kanaal-/appinstallatie van de hoofdbot en een eenvoudig herstelpad via privéberichten).
- Behoud de profielnaam `rescue`.
- Gebruik een basispoort die ten minste 20 hoger is dan die van de hoofdbot.
- Accepteer de standaardwerkruimte voor de reddingsbot, tenzij u er zelf al een beheert.

### Wat `--profile rescue onboard` wijzigt

`--profile rescue onboard` voert de normale onboarding uit, maar schrijft alles naar een afzonderlijk profiel. Daardoor krijgt de reddingsbot een eigen:

- Profiel-/configuratiebestand
- Statusmap
- Werkruimte (standaard: `~/.openclaw/workspace-rescue`)
- Naam van de beheerde service
- Basispoort (plus afgeleide poorten)
- Telegram-bottoken

De prompts zijn verder hetzelfde als bij de normale onboarding.

## Algemene configuratie met meerdere Gateways

Hetzelfde isolatiepatroon werkt voor elk paar of elke groep Gateways op één host: geef elke extra Gateway een eigen benoemd profiel en een eigen basispoort:

```bash
# hoofd-Gateway (standaardprofiel)
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

Gebruik de snelstart voor een reddingsbot als terugvalkanaal voor operators; gebruik het algemene profielpatroon voor meerdere langdurig actieve Gateways voor verschillende kanalen, tenants, werkruimten of operationele rollen.

## Controlelijst voor isolatie

Houd deze instellingen uniek per Gateway-instantie:

| Instelling                    | Doel                                          |
| ---------------------------- | --------------------------------------------- |
| `OPENCLAW_CONFIG_PATH`       | Configuratiebestand per instantie             |
| `OPENCLAW_STATE_DIR`         | Sessies, referenties en caches per instantie  |
| `agents.defaults.workspace`  | Hoofdmap van de werkruimte per instantie      |
| `gateway.port` (of `--port`) | Uniek per instantie                           |
| Afgeleide browser-/CDP-poorten | Zie hieronder                               |

Het delen van een van deze instellingen veroorzaakt configuratieraces en poortconflicten.

## Poorttoewijzing (afgeleid)

Basispoort = `gateway.port` (of `OPENCLAW_GATEWAY_PORT` / `--port`).

- Poort van de browserbesturingsservice = basispoort + 2 (alleen local loopback).
- De Canvas-host wordt aangeboden via de HTTP-server van de Gateway zelf (dezelfde poort als `gateway.port`).
- CDP-poorten voor browserprofielen worden automatisch toegewezen vanaf `browser control port + 9` tot en met `+ 108`.

Als u een van deze instellingen in de configuratie of via omgevingsvariabelen overschrijft, moet u ervoor zorgen dat deze per instantie uniek blijven.

## Opmerkingen over browser/CDP (veelvoorkomende valkuil)

- Stel `browser.cdpUrl` **niet** voor meerdere instanties in op dezelfde vaste waarde.
- Elke instantie heeft een eigen browserbesturingspoort en CDP-bereik nodig (afgeleid van de Gateway-poort).
- Stel voor expliciete CDP-poorten `browser.profiles.<name>.cdpPort` per instantie in.
- Gebruik voor Chrome op afstand `browser.profiles.<name>.cdpUrl` (per profiel, per instantie).

## Handmatig voorbeeld met omgevingsvariabelen

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
- Waarschuwingstekst van `gateway probe`, zoals `multiple reachable gateway identities detected`, wordt alleen verwacht wanneer u opzettelijk meer dan één geïsoleerde Gateway uitvoert, of wanneer OpenClaw niet kan bewijzen dat bereikbare probedoelen dezelfde Gateway zijn. Een SSH-tunnel, proxy-URL of geconfigureerde externe URL naar dezelfde Gateway betreft één Gateway met meerdere transportmethoden, zelfs wanneer de transportpoorten verschillen.

## Gerelateerd

- [Gateway-draaiboek](/nl/gateway)
- [Gateway-vergrendeling](/nl/gateway/gateway-lock)
- [Configuratie](/nl/gateway/configuration)
