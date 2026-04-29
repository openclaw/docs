---
read_when:
    - Je wilt inloggegevens, apparaten of standaardinstellingen voor agents interactief aanpassen
summary: CLI-referentie voor `openclaw configure` (interactieve configuratieprompts)
title: Configureren
x-i18n:
    generated_at: "2026-04-29T22:30:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bde13a139c299879ff13a85c17afdd55dce7ad758418266854428b059d8a05e
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Interactieve prompt om inloggegevens, apparaten en agentstandaarden in te stellen.

<Note>
De sectie **Model** bevat een multiselect voor de allowlist `agents.defaults.models` (wat wordt weergegeven in `/model` en de modelkiezer). Providerspecifieke setupkeuzes voegen hun geselecteerde modellen samen in de bestaande allowlist in plaats van niet-gerelateerde providers die al in de config staan te vervangen. Het opnieuw uitvoeren van providerauthenticatie vanuit configure behoudt een bestaande `agents.defaults.model.primary`. Gebruik `openclaw models auth login --provider <id> --set-default` of `openclaw models set <model>` wanneer je bewust het standaardmodel wilt wijzigen.
</Note>

Wanneer configure start vanuit een providerauthenticatiekeuze, geven de standaardmodel- en allowlist-kiezers automatisch de voorkeur aan die provider. Voor gekoppelde providers zoals Volcengine en BytePlus komt dezelfde voorkeur ook overeen met hun coding-plan-varianten (`volcengine-plan/*`, `byteplus-plan/*`). Als het voorkeursproviderfilter een lege lijst zou opleveren, valt configure terug op de ongefilterde catalogus in plaats van een lege kiezer te tonen.

<Tip>
`openclaw config` zonder subopdracht opent dezelfde wizard. Gebruik `openclaw config get|set|unset` voor niet-interactieve bewerkingen.
</Tip>

Voor webzoekopdrachten kun je met `openclaw configure --section web` een provider kiezen
en diens inloggegevens configureren. Sommige providers tonen ook providerspecifieke
vervolgprompts:

- **Grok** kan optionele `x_search`-setup aanbieden met dezelfde `XAI_API_KEY` en
  je een `x_search`-model laten kiezen.
- **Kimi** kan vragen naar de Moonshot API-regio (`api.moonshot.ai` versus
  `api.moonshot.cn`) en het standaard Kimi-webzoekmodel.

Gerelateerd:

- Referentie voor Gateway-configuratie: [Configuratie](/nl/gateway/configuration)
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
- Kanaalgerichte services (Slack/Discord/Matrix/Microsoft Teams) vragen tijdens de setup om allowlists voor kanalen/ruimten. Je kunt namen of ID's invoeren; de wizard zet namen waar mogelijk om naar ID's.
- Als je de daemon-installatiestap uitvoert, tokenauthenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert configure de SecretRef maar bewaart het geen opgeloste tokenwaarden in platte tekst in omgevingsmetadata van supervisorservices.
- Als tokenauthenticatie een token vereist en de geconfigureerde token-SecretRef niet kan worden opgelost, blokkeert configure daemon-installatie met bruikbare herstelrichtlijnen.
- Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, blokkeert configure daemon-installatie totdat de modus expliciet is ingesteld.

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
