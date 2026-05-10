---
read_when:
    - Je wilt inloggegevens, apparaten of standaardinstellingen voor agents interactief aanpassen
summary: CLI-referentie voor `openclaw configure` (interactieve configuratieprompts)
title: Configureren
x-i18n:
    generated_at: "2026-05-10T19:27:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: aba5320fefb856c208405511619fc1a4314e3f5e3990f221e987a03d692189fb
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Interactieve prompt voor gerichte wijzigingen aan een bestaande setup: inloggegevens, apparaten, standaardinstellingen voor agents, Gateway, kanalen, plugins, Skills en statuscontroles.

Gebruik `openclaw onboard` voor het volledige begeleide eerste gebruik, `openclaw setup` alleen voor de basisconfiguratie/werkruimte, en `openclaw channels add` wanneer je alleen kanaalaccountsetup nodig hebt.

<Note>
De sectie **Model** bevat een multi-select voor de allowlist `agents.defaults.models` (wat verschijnt in `/model` en de modelkiezer). Providerspecifieke setupkeuzes voegen hun geselecteerde modellen samen met de bestaande allowlist in plaats van niet-gerelateerde providers die al in de configuratie staan te vervangen.

Provider-authenticatie opnieuw uitvoeren vanuit configure behoudt een bestaande `agents.defaults.model.primary`, zelfs wanneer de authenticatiestap van de provider een configuratiepatch met een eigen aanbevolen standaardmodel retourneert. Dat betekent dat het toevoegen of opnieuw authenticeren van xAI, OpenRouter of een andere provider het nieuwe model beschikbaar zou moeten maken zonder je huidige primaire model over te nemen. Gebruik `openclaw models auth login --provider <id> --set-default` of `openclaw models set <model>` wanneer je het standaardmodel bewust wilt wijzigen.
</Note>

Wanneer configure start vanuit een provider-authenticatiekeuze, geven de standaardmodel- en allowlistkiezers automatisch de voorkeur aan die provider. Voor gekoppelde providers zoals Volcengine en BytePlus komt dezelfde voorkeur ook overeen met hun coding-planvarianten (`volcengine-plan/*`, `byteplus-plan/*`). Als het voorkeur-providerfilter een lege lijst zou opleveren, valt configure terug op de ongefilterde catalogus in plaats van een lege kiezer te tonen.

<Tip>
`openclaw config` zonder subopdracht opent dezelfde wizard. Gebruik `openclaw config get|set|unset` voor niet-interactieve bewerkingen.
</Tip>

Voor webzoekopdrachten kun je met `openclaw configure --section web` een provider kiezen
en de inloggegevens ervan configureren. Sommige providers tonen ook providerspecifieke
vervolgprompts:

- **Grok** kan optionele `x_search`-setup aanbieden met dezelfde `XAI_API_KEY` en
  je een `x_search`-model laten kiezen.
- **Kimi** kan vragen om de Moonshot API-regio (`api.moonshot.ai` versus
  `api.moonshot.cn`) en het standaard Kimi-webzoekmodel.

Gerelateerd:

- Gateway-configuratiereferentie: [Configuratie](/nl/gateway/configuration)
- Config-CLI: [Config](/nl/cli/config)

## Opties

- `--section <section>`: herhaalbaar sectiefilter

Beschikbare secties:

- `workspace`
- `model`
- `web`
- `gateway`
- `daemon`
- `channels`
- `plugins`
- `skills`
- `health`

Opmerkingen:

- Kiezen waar de Gateway draait werkt altijd `gateway.mode` bij. Je kunt "Doorgaan" selecteren zonder andere secties als dat alles is wat je nodig hebt.
- Na lokale configuratieschrijfacties installeert configure geselecteerde downloadbare plugins wanneer het gekozen setuppad ze vereist. Externe Gateway-configuratie installeert geen lokale pluginpakketten.
- Kanaalgerichte services (Slack/Discord/Matrix/Microsoft Teams) vragen tijdens de setup om allowlists voor kanalen/ruimtes. Je kunt namen of ID's invoeren; de wizard zet namen waar mogelijk om naar ID's.
- Als je de installatiestap voor de daemon uitvoert, tokenauthenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert configure de SecretRef maar slaat het geen opgeloste plattetekst-tokenwaarden op in metadata van de supervisorserviceomgeving.
- Als tokenauthenticatie een token vereist en de geconfigureerde token-SecretRef niet is opgelost, blokkeert configure de daemoninstallatie met uitvoerbare herstelrichtlijnen.
- Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, blokkeert configure de daemoninstallatie totdat de modus expliciet is ingesteld.

## Voorbeelden

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Configuratie](/nl/gateway/configuration)
