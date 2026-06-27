---
read_when:
    - Je wilt inloggegevens, apparaten of standaardinstellingen voor agents interactief aanpassen
summary: CLI-referentie voor `openclaw configure` (interactieve configuratieprompts)
title: Configureren
x-i18n:
    generated_at: "2026-06-27T17:18:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 55178b3d772297686aeead9799b97dd5d836b908baabde1fce7918d38446fcff
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Interactieve prompt voor gerichte wijzigingen aan een bestaande setup: inloggegevens, apparaten, agentstandaarden, Gateway, kanalen, plugins, Skills en gezondheidscontroles.

Gebruik `openclaw onboard` voor het volledige begeleide eerste gebruik, `openclaw setup` alleen voor de basisconfiguratie/werkruimte en `openclaw channels add` wanneer je alleen een kanaalaccount hoeft in te stellen.

<Note>
De sectie **Model** bevat een multiselect voor de allowlist `agents.defaults.models` (wat wordt weergegeven in `/model` en de modelkiezer). Provider-specifieke setupkeuzes voegen hun geselecteerde modellen samen met de bestaande allowlist in plaats van niet-gerelateerde providers te vervangen die al in de configuratie staan.

Het opnieuw uitvoeren van providerauthenticatie vanuit configure behoudt een bestaande `agents.defaults.model.primary`, zelfs wanneer de authenticatiestap van de provider een configuratiepatch retourneert met een eigen aanbevolen standaardmodel. Dat betekent dat het toevoegen of opnieuw authenticeren van xAI, OpenRouter of een andere provider het nieuwe model beschikbaar zou moeten maken zonder je huidige primaire model over te nemen. Gebruik `openclaw models auth login --provider <id> --set-default` of `openclaw models set <model>` wanneer je bewust het standaardmodel wilt wijzigen.
</Note>

Wanneer configure start vanuit een providerauthenticatiekeuze, geven de standaardmodel- en allowlist-kiezers automatisch de voorkeur aan die provider. Voor gekoppelde providers zoals Volcengine en BytePlus komt dezelfde voorkeur ook overeen met hun coding-plan-varianten (`volcengine-plan/*`, `byteplus-plan/*`). Als het voorkeursproviderfilter een lege lijst zou opleveren, valt configure terug op de ongefilterde catalogus in plaats van een lege kiezer te tonen.

<Tip>
`openclaw config` zonder subopdracht opent dezelfde wizard. Gebruik `openclaw config get|set|unset` voor niet-interactieve bewerkingen.
</Tip>

Voor webzoekopdrachten laat `openclaw configure --section web` je een provider kiezen
en de inloggegevens configureren. Sommige providers tonen ook providerspecifieke
vervolgprompts:

- **Grok** kan optionele `x_search`-setup aanbieden met hetzelfde xAI OAuth-profiel
  of dezelfde API-sleutel en je een `x_search`-model laten kiezen.
- **Kimi** kan vragen naar de Moonshot API-regio (`api.moonshot.ai` versus
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

- De volledige wizard en Gateway-gerelateerde secties vragen waar de Gateway draait en werken `gateway.mode` bij. Sectiefilters die geen `gateway`, `daemon` of `health` bevatten, gaan direct naar de gevraagde setup.
- Na lokale configuratieschrijfacties installeert configure geselecteerde downloadbare plugins wanneer het gekozen setuppad die vereist. Externe Gateway-configuratie installeert geen lokale pluginpakketten.
- Kanaalgerichte services (Slack/Discord/Matrix/Microsoft Teams) vragen tijdens de setup om kanaal-/kamer-allowlists. Je kunt namen of ID's invoeren; de wizard zet namen waar mogelijk om naar ID's.
- Als je de daemon-installatiestap uitvoert, tokenauthenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert configure de SecretRef maar slaat het geen opgeloste platte-tekst-tokenwaarden op in omgevingsmetadata van de supervisorservice.
- Als tokenauthenticatie een token vereist en de geconfigureerde token-SecretRef niet is opgelost, blokkeert configure daemoninstallatie met uitvoerbare herstelrichtlijnen.
- Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, blokkeert configure daemoninstallatie totdat de modus expliciet is ingesteld.

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
