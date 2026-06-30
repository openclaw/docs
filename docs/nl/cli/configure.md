---
read_when:
    - Je wilt credentials, apparaten of standaardwaarden voor agents interactief aanpassen
summary: CLI-referentie voor `openclaw configure` (interactieve configuratieprompts)
title: Configureren
x-i18n:
    generated_at: "2026-06-30T22:22:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96241eddd8bc0eaf936d0bb7555a217858d71dcc8009dc5608cecbc55d292bce
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Interactieve prompt voor gerichte wijzigingen aan een bestaande installatie: referenties, apparaten, agentstandaarden, Gateway, kanalen, plugins, Skills en gezondheidscontroles.

Gebruik `openclaw onboard` of `openclaw setup` voor de volledige begeleide eerste configuratie, `openclaw setup --baseline` alleen voor de basisconfiguratie/werkruimte, en `openclaw channels add` wanneer je alleen een kanaalaccount hoeft in te stellen.

<Note>
De sectie **Model** bevat een meervoudige selectie voor de toegestane lijst `agents.defaults.models` (wat wordt weergegeven in `/model` en de modelkiezer). Provider-specifieke installatiekeuzes voegen hun geselecteerde modellen samen met de bestaande toegestane lijst, in plaats van niet-gerelateerde providers die al in de configuratie staan te vervangen.

Als je providerverificatie opnieuw uitvoert vanuit configure, blijft een bestaande `agents.defaults.model.primary` behouden, zelfs wanneer de verificatiestap van de provider een configuratiepatch retourneert met een eigen aanbevolen standaardmodel. Dat betekent dat het toevoegen of opnieuw verifiëren van xAI, OpenRouter of een andere provider het nieuwe model beschikbaar moet maken zonder je huidige primaire model over te nemen. Gebruik `openclaw models auth login --provider <id> --set-default` of `openclaw models set <model>` wanneer je bewust het standaardmodel wilt wijzigen.
</Note>

Wanneer configure start vanuit een keuze voor providerverificatie, geven de standaardmodel- en toegestane-lijstkiezers automatisch de voorkeur aan die provider. Voor gekoppelde providers zoals Volcengine en BytePlus komt dezelfde voorkeur ook overeen met hun varianten voor coderingsplannen (`volcengine-plan/*`, `byteplus-plan/*`). Als het filter voor de voorkeursprovider een lege lijst zou opleveren, valt configure terug op de ongefilterde catalogus in plaats van een lege kiezer te tonen.

<Tip>
`openclaw config` zonder subopdracht opent dezelfde wizard. Gebruik `openclaw config get|set|unset` voor niet-interactieve bewerkingen.
</Tip>

Voor zoeken op het web laat `openclaw configure --section web` je een provider kiezen
en de referenties ervan configureren. Sommige providers tonen ook providerspecifieke
vervolgprompts:

- **Grok** kan optionele `x_search`-instelling aanbieden met hetzelfde xAI OAuth-profiel
  of dezelfde API-sleutel en je een `x_search`-model laten kiezen.
- **Kimi** kan vragen om de Moonshot API-regio (`api.moonshot.ai` versus
  `api.moonshot.cn`) en het standaard Kimi-model voor zoeken op het web.

Gerelateerd:

- Gateway-configuratiereferentie: [Configuratie](/nl/gateway/configuration)
- Configuratie-CLI: [Configuratie](/nl/cli/config)

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

- De volledige wizard en Gateway-gerelateerde secties vragen waar de Gateway draait en werken `gateway.mode` bij. Sectiefilters die geen `gateway`, `daemon` of `health` bevatten, gaan direct naar de gevraagde instelling.
- Na lokale configuratieschrijfacties installeert configure geselecteerde downloadbare plugins wanneer het gekozen installatiepad ze vereist. Externe Gateway-configuratie installeert geen lokale pluginpakketten.
- Kanaalgerichte services (Slack/Discord/Matrix/Microsoft Teams) vragen tijdens de installatie om toegestane lijsten voor kanalen/ruimtes. Je kunt namen of ID's invoeren; de wizard zet namen waar mogelijk om naar ID's.
- Als je de daemon-installatiestap uitvoert, tokenverificatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert configure de SecretRef maar slaat geen opgeloste platteteksttokenwaarden op in de omgevingsmetadata van de supervisorservice.
- Als tokenverificatie een token vereist en de geconfigureerde token-SecretRef niet is opgelost, blokkeert configure de daemon-installatie met uitvoerbare herstelrichtlijnen.
- Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, blokkeert configure de daemon-installatie totdat de modus expliciet is ingesteld.

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
