---
read_when:
    - Je wilt referenties, apparaten of standaardinstellingen voor agents interactief aanpassen
summary: CLI-referentie voor `openclaw configure` (interactieve configuratieprompts)
title: Configureren
x-i18n:
    generated_at: "2026-05-01T11:14:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 437a6ec43a48611bf08bdeb0a6e692581c488fac283f0104b172088db37949bb
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Interactieve prompt om referenties, apparaten en agentstandaarden in te stellen.

<Note>
De sectie **Model** bevat een meervoudige selectie voor de allowlist `agents.defaults.models` (wat verschijnt in `/model` en de modelkiezer). Providerspecifieke instelkeuzes voegen hun geselecteerde modellen samen met de bestaande allowlist in plaats van niet-gerelateerde providers die al in de configuratie staan te vervangen. Het opnieuw uitvoeren van providerauthenticatie vanuit configure behoudt een bestaande `agents.defaults.model.primary`. Gebruik `openclaw models auth login --provider <id> --set-default` of `openclaw models set <model>` wanneer je bewust het standaardmodel wilt wijzigen.
</Note>

Wanneer configure start vanuit een providerauthenticatiekeuze, geven de standaardmodel- en allowlist-kiezers automatisch de voorkeur aan die provider. Voor gekoppelde providers zoals Volcengine en BytePlus geldt dezelfde voorkeur ook voor hun coding-plan-varianten (`volcengine-plan/*`, `byteplus-plan/*`). Als het filter voor de voorkeursprovider een lege lijst zou opleveren, valt configure terug op de ongefilterde catalogus in plaats van een lege kiezer te tonen.

<Tip>
`openclaw config` zonder subcommando opent dezelfde wizard. Gebruik `openclaw config get|set|unset` voor niet-interactieve bewerkingen.
</Tip>

Voor webzoeken kun je met `openclaw configure --section web` een provider kiezen
en de referenties daarvan configureren. Sommige providers tonen ook providerspecifieke
vervolgprompts:

- **Grok** kan optionele `x_search`-instelling aanbieden met dezelfde `XAI_API_KEY` en
  je een `x_search`-model laten kiezen.
- **Kimi** kan vragen naar de Moonshot API-regio (`api.moonshot.ai` versus
  `api.moonshot.cn`) en het standaard Kimi-webzoekmodel.

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

- Kiezen waar de Gateway draait werkt altijd `gateway.mode` bij. Je kunt "Doorgaan" selecteren zonder andere secties als dat alles is wat je nodig hebt.
- Na lokale configuratieschrijfacties materialiseert configure nieuw vereiste runtimeafhankelijkheden van gebundelde Plugins. Dit is een beperkte herstelstap van de pakketbeheerder, geen volledige `openclaw doctor`-run. Configuratie van een externe Gateway installeert geen lokale Plugin-afhankelijkheden.
- Kanaalgerichte services (Slack/Discord/Matrix/Microsoft Teams) vragen tijdens de installatie om allowlists voor kanalen/ruimtes. Je kunt namen of ID's invoeren; de wizard zet namen waar mogelijk om naar ID's.
- Als je de daemon-installatiestap uitvoert, tokenauthenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert configure de SecretRef maar bewaart het opgeloste platteteksttoken niet in de omgevingsmetadata van de supervisorservice.
- Als tokenauthenticatie een token vereist en de geconfigureerde token-SecretRef niet is opgelost, blokkeert configure de daemon-installatie met bruikbare herstelinstructies.
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
