---
read_when:
    - Je wilt inloggegevens, apparaten of standaardinstellingen voor agents interactief aanpassen
summary: CLI-referentie voor `openclaw configure` (interactieve configuratieprompts)
title: Configureren
x-i18n:
    generated_at: "2026-05-02T11:10:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 16e45fdead5e8026e8d359a09c799fb1248226a9425fcd9ff956d165b880663d
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Interactieve prompt om referenties, apparaten en standaardinstellingen voor agents in te stellen.

<Note>
De sectie **Model** bevat een meerkeuzeselectie voor de allowlist `agents.defaults.models` (wat wordt weergegeven in `/model` en de modelkiezer). Providergebonden setupkeuzes voegen hun geselecteerde modellen samen met de bestaande allowlist in plaats van niet-gerelateerde providers die al in de configuratie staan te vervangen.

Provider-auth opnieuw uitvoeren vanuit configure behoudt een bestaande `agents.defaults.model.primary`, zelfs wanneer de auth-stap van de provider een configuratiepatch met een eigen aanbevolen standaardmodel teruggeeft. Dat betekent dat het toevoegen of opnieuw authenticeren van xAI, OpenRouter of een andere provider het nieuwe model beschikbaar moet maken zonder je huidige primaire model over te nemen. Gebruik `openclaw models auth login --provider <id> --set-default` of `openclaw models set <model>` wanneer je bewust het standaardmodel wilt wijzigen.
</Note>

Wanneer configure start vanuit een provider-authkeuze, geven de standaardmodel- en allowlist-kiezers automatisch de voorkeur aan die provider. Voor gekoppelde providers zoals Volcengine en BytePlus matcht dezelfde voorkeur ook hun coding-plan-varianten (`volcengine-plan/*`, `byteplus-plan/*`). Als het voorkeursproviderfilter een lege lijst zou opleveren, valt configure terug op de ongefilterde catalogus in plaats van een lege kiezer te tonen.

<Tip>
`openclaw config` zonder subopdracht opent dezelfde wizard. Gebruik `openclaw config get|set|unset` voor niet-interactieve bewerkingen.
</Tip>

Voor webzoekopdrachten kun je met `openclaw configure --section web` een provider kiezen
en de referenties configureren. Sommige providers tonen ook providerspecifieke
vervolgprompts:

- **Grok** kan optionele `x_search`-setup aanbieden met dezelfde `XAI_API_KEY` en
  je een `x_search`-model laten kiezen.
- **Kimi** kan vragen naar de Moonshot API-regio (`api.moonshot.ai` vs
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

Notities:

- Kiezen waar de Gateway draait, werkt altijd `gateway.mode` bij. Je kunt "Doorgaan" selecteren zonder andere secties als dat alles is wat je nodig hebt.
- Na lokale configuratieschrijfacties installeert configure geselecteerde downloadbare plugins wanneer het gekozen setuppad ze vereist. Configuratie van een externe Gateway installeert geen lokale pluginpakketten.
- Kanaalgerichte services (Slack/Discord/Matrix/Microsoft Teams) vragen tijdens de setup om allowlists voor kanalen/ruimten. Je kunt namen of ID's invoeren; de wizard zet namen waar mogelijk om naar ID's.
- Als je de installatiestap voor de daemon uitvoert, token-authenticatie een token vereist en `gateway.auth.token` door SecretRef wordt beheerd, valideert configure de SecretRef maar bewaart het opgeloste platteteksttoken niet in de omgevingsmetadata van de supervisor-service.
- Als token-authenticatie een token vereist en de geconfigureerde token-SecretRef niet is opgelost, blokkeert configure de daemoninstallatie met bruikbare herstelrichtlijnen.
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
