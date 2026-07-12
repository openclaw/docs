---
read_when:
    - Je wilt referenties, apparaten of standaardinstellingen voor agents interactief aanpassen
summary: CLI-naslag voor `openclaw configure` (interactieve configuratieprompts)
title: Configureren
x-i18n:
    generated_at: "2026-07-12T08:43:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6001ea712ee4db3f7bdc2db784a9df2e3f15a8360890b69aec2ea67694c3514b
    source_path: cli/configure.md
    workflow: 16
---

# `openclaw configure`

Interactieve vragen voor gerichte wijzigingen aan een bestaande configuratie: aanmeldgegevens, apparaten, standaardinstellingen voor agents, Gateway, kanalen, plugins, Skills en statuscontroles.

Gebruik `openclaw onboard` of `openclaw setup` voor het volledige begeleide traject bij de eerste uitvoering, `openclaw setup --baseline` alleen voor de basisconfiguratie/-werkruimte en `openclaw channels add` wanneer je alleen een kanaalaccount hoeft in te stellen.

<Tip>
`openclaw config` zonder subopdracht opent dezelfde wizard. Gebruik `openclaw config get|set|unset` voor niet-interactieve wijzigingen.
</Tip>

## Opties

`--section <section>`: herhaalbaar sectiefilter. Beschikbare secties:

`workspace`, `model`, `web`, `gateway`, `daemon`, `channels`, `plugins`, `skills`, `health`

```bash
openclaw configure
openclaw configure --section web
openclaw configure --section model --section channels
openclaw configure --section gateway --section daemon
```

Als je `gateway`, `daemon` of `health` selecteert (of de volledige wizard zonder `--section` uitvoert), wordt gevraagd waar de Gateway draait en wordt `gateway.mode` bijgewerkt. Sectiefilters die alle drie overslaan, gaan rechtstreeks naar de gevraagde configuratie zonder vraag over de Gateway-modus. Als je de externe Gateway-modus kiest, wordt de externe configuratie weggeschreven en wordt het programma onmiddellijk afgesloten; uitsluitend lokale stappen, zoals de installatie van plugins, worden niet uitgevoerd.

<Note>
`openclaw configure` vereist een interactieve terminal (zowel stdin als stdout moeten TTY's zijn). Zonder interactieve terminal worden de equivalente niet-interactieve opdrachten `openclaw config get|set|patch|validate` weergegeven en wordt het programma met een fout afgesloten in plaats van slechts gedeeltelijk te worden uitgevoerd.
</Note>

## Modelsectie

<Note>
**Model** bevat een meervoudige selectie voor de toelatingslijst `agents.defaults.models` (wat in `/model` en de modelkiezer wordt weergegeven). Providerspecifieke configuratiekeuzes voegen de geselecteerde modellen samen met de bestaande toelatingslijst in plaats van niet-gerelateerde providers die al in de configuratie staan te vervangen.

Als je providerauthenticatie opnieuw uitvoert vanuit configure, blijft een bestaande `agents.defaults.model.primary` behouden, zelfs wanneer de authenticatiestap van de provider een configuratiepatch met een eigen aanbevolen standaardmodel retourneert. Door een provider toe te voegen of opnieuw te authenticeren, worden de modellen ervan beschikbaar zonder dat je huidige primaire model wordt overgenomen. Gebruik `openclaw models auth login --provider <id> --set-default` of `openclaw models set <model>` om het standaardmodel bewust te wijzigen.
</Note>

Wanneer configure wordt gestart vanuit een keuze voor providerauthenticatie, geven de kiezer voor het standaardmodel en die voor de toelatingslijst automatisch de voorkeur aan die provider. Voor gekoppelde providers zoals Volcengine en BytePlus komt dezelfde voorkeur ook overeen met hun varianten voor programmeerabonnementen (`volcengine-plan/*`, `byteplus-plan/*`). Als het filter voor de voorkeursprovider een lege lijst zou opleveren, valt configure terug op de ongefilterde catalogus in plaats van een lege kiezer weer te geven.

## Websectie

`openclaw configure --section web` kiest een provider voor zoeken op internet en configureert de bijbehorende aanmeldgegevens. Sommige providers tonen providerspecifieke vervolgvragen:

- **Grok** kan een optionele configuratie van `x_search` aanbieden met hetzelfde xAI OAuth-profiel of dezelfde API-sleutel, en je een `x_search`-model laten kiezen.
- **Kimi** kan vragen naar de Moonshot API-regio (`api.moonshot.ai` tegenover `api.moonshot.cn`) en het standaardmodel van Kimi voor zoeken op internet.

## Overige opmerkingen

- Nadat de lokale configuratie is weggeschreven, installeert configure de geselecteerde downloadbare plugins wanneer het gekozen configuratiepad deze vereist. Bij configuratie van een externe Gateway worden geen lokale pluginpakketten geïnstalleerd.
- Kanaalgerichte diensten (Slack/Discord/Matrix/Microsoft Teams) vragen tijdens de configuratie om toelatingslijsten voor kanalen/ruimten. Je kunt namen of ID's invoeren; de wizard zet namen waar mogelijk om in ID's.
- Als je de installatiestap voor de daemon uitvoert, vereist tokenauthenticatie een token. Als `gateway.auth.token` door SecretRef wordt beheerd, valideert configure de SecretRef, maar worden de herleide tokenwaarden in platte tekst niet opgeslagen in de omgevingsmetadata van de supervisorservice. Als de SecretRef niet kan worden herleid, blokkeert configure de installatie van de daemon en geeft het uitvoerbare instructies om dit te verhelpen.
- Als zowel `gateway.auth.token` als `gateway.auth.password` zijn geconfigureerd en `gateway.auth.mode` niet is ingesteld, blokkeert configure de installatie van de daemon totdat je de modus expliciet instelt.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Configuratie](/nl/gateway/configuration)
- Configuratie-CLI: [Configuratie](/nl/cli/config)
