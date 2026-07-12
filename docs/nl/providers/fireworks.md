---
read_when:
    - U wilt Fireworks gebruiken met OpenClaw
    - Je hebt de omgevingsvariabele voor de Fireworks-API-sleutel of de standaardmodel-ID nodig
    - Je debugt het gedrag van Kimi met uitgeschakelde denkmodus op Fireworks
summary: Fireworks-configuratie (authenticatie + modelselectie)
title: Vuurwerk
x-i18n:
    generated_at: "2026-07-12T09:18:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15feed0730ec65d943f103824468490be6616478ece80bedfeb9ad8137506180
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) biedt open-weight- en gerouteerde modellen aan via een OpenAI-compatibele API. Installeer de officiële Fireworks-providerplugin om tijdens runtime twee vooraf gecatalogiseerde Kimi-modellen en elk Fireworks-model of elke router-id te gebruiken.

| Eigenschap              | Waarde                                                 |
| ----------------------- | ------------------------------------------------------ |
| Provider-id             | `fireworks` (alias: `fireworks-ai`)                    |
| Pakket                  | `@openclaw/fireworks-provider`                         |
| Omgevingsvariabele voor authenticatie | `FIREWORKS_API_KEY`                       |
| Onboardingvlag          | `--auth-choice fireworks-api-key`                      |
| Rechtstreekse CLI-vlag  | `--fireworks-api-key <key>`                            |
| API                     | OpenAI-compatibel (`openai-completions`)               |
| Basis-URL               | `https://api.fireworks.ai/inference/v1`                |
| Standaardmodel          | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Standaardalias          | `Kimi K2.5 Turbo`                                      |

## Aan de slag

<Steps>
  <Step title="Installeer de plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Stel de Fireworks-API-sleutel in">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice fireworks-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Env only
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    Tijdens de onboarding wordt de sleutel voor de provider `fireworks` in uw authenticatieprofielen opgeslagen en wordt de **Fire Pass** Kimi K2.5 Turbo-router als standaardmodel ingesteld.

  </Step>
  <Step title="Controleer of het model beschikbaar is">
    ```bash
    openclaw models list --provider fireworks
    ```

    De lijst moet `Kimi K2.6` en `Kimi K2.5 Turbo (Fire Pass)` bevatten. Als `FIREWORKS_API_KEY` niet kan worden opgelost, meldt `openclaw models status --json` de ontbrekende referentie onder `auth.unusableProfiles`.

  </Step>
</Steps>

## Niet-interactieve configuratie

Geef voor installaties via scripts of CI alles mee op de opdrachtregel:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Ingebouwde catalogus

| Modelreferentie                                        | Naam                        | Invoer            | Context | Maximale uitvoer | Denkmodus                    |
| ------------------------------------------------------ | --------------------------- | ----------------- | ------- | ---------------- | ---------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | tekst + afbeelding | 262,144 | 262,144          | Verplicht uit                 |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | tekst + afbeelding | 256,000 | 256,000          | Verplicht uit (standaard)     |

<Note>
  OpenClaw zet alle Fireworks Kimi-modellen vast op `thinking: off`, omdat Kimi op Fireworks de redeneerketen in het zichtbare antwoord kan laten uitlekken, tenzij het verzoek de denkmodus expliciet uitschakelt. Als hetzelfde model rechtstreeks via [Moonshot](/nl/providers/moonshot) wordt gerouteerd, blijft de redeneeruitvoer van Kimi behouden. Zie [denkmodi](/nl/tools/thinking) voor het wisselen tussen providers.
</Note>

## Aangepaste Fireworks-model-id's

OpenClaw accepteert tijdens runtime elke Fireworks-model- of router-id. Gebruik de exacte id die Fireworks toont en zet er `fireworks/` voor. Dynamische omzetting kloont de Fire Pass-sjabloon (tekst- en afbeeldingsinvoer, OpenAI-compatibele API, standaardkosten nul) en schakelt de denkmodus automatisch uit wanneer de id overeenkomt met het Kimi-patroon. Dynamische GLM-id's worden gemarkeerd als uitsluitend geschikt voor tekst, tenzij u een aangepaste modelvermelding met afbeeldingsinvoer configureert.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/models/<your-model-id>",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Hoe voorvoeging van model-id's werkt">
    Elke Fireworks-modelreferentie in OpenClaw begint met `fireworks/`, gevolgd door de exacte id of het routerpad van het Fireworks-platform. Bijvoorbeeld:

    - Routermodel: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Rechtstreeks model: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw verwijdert het voorvoegsel `fireworks/` bij het opstellen van het API-verzoek en verzendt het resterende pad als het OpenAI-compatibele veld `model` naar het Fireworks-eindpunt.

  </Accordion>

  <Accordion title="Waarom de denkmodus voor Kimi verplicht is uitgeschakeld">
    Fireworks biedt Kimi aan zonder afzonderlijk redeneerkanaal, waardoor de redeneerketen zichtbaar kan worden in de `content`-stream. Bij elk Fireworks Kimi-verzoek verzendt OpenClaw `thinking: { type: "disabled" }` en verwijdert het `reasoning`, `reasoning_effort` en `reasoningEffort` uit de payload (`extensions/fireworks/stream.ts`). Het providerbeleid (`extensions/fireworks/thinking-policy.ts`) maakt voor Kimi-model-id's alleen het denkniveau `off` beschikbaar, zodat handmatige `/think`-wisselingen en providerbeleidsonderdelen in overeenstemming blijven met het runtimecontract.

    Als u de redeneermogelijkheden van Kimi van begin tot eind wilt gebruiken, configureert u de [Moonshot-provider](/nl/providers/moonshot) en routeert u hetzelfde model via deze provider.

  </Accordion>

  <Accordion title="Beschikbaarheid van de omgeving voor de daemon">
    Als de Gateway als beheerde service wordt uitgevoerd (launchd, systemd, Docker), moet de Fireworks-sleutel zichtbaar zijn voor dat proces, niet alleen voor uw interactieve shell.

    <Warning>
      Een sleutel die alleen in een interactieve shell is geëxporteerd, helpt een launchd- of systemd-daemon niet, tenzij die omgeving daar ook wordt geïmporteerd. Stel de sleutel in `~/.openclaw/.env` of via `env.shellEnv` in om deze leesbaar te maken voor het Gateway-proces.
    </Warning>

    OpenClaw laadt `~/.openclaw/.env` bij het laden van de configuratie, zodat sleutels die daar zijn opgeslagen op elk platform beschikbaar zijn voor beheerde Gateway-services. Start de Gateway opnieuw (of voer `openclaw doctor --fix` opnieuw uit) nadat u de sleutel hebt vervangen.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelproviders" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="Denkmodi" href="/nl/tools/thinking" icon="brain">
    `/think`-niveaus, providerbeleid en het routeren van modellen met redeneermogelijkheden.
  </Card>
  <Card title="Moonshot" href="/nl/providers/moonshot" icon="moon">
    Voer Kimi met native denkuitvoer uit via de eigen API van Moonshot.
  </Card>
  <Card title="Problemen oplossen" href="/nl/help/troubleshooting" icon="wrench">
    Algemene probleemoplossing en veelgestelde vragen.
  </Card>
</CardGroup>
