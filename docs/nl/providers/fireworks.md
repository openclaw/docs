---
read_when:
    - Je wilt Fireworks gebruiken met OpenClaw
    - Je hebt de env-var voor de Fireworks-API-sleutel of de standaardmodel-id nodig
    - Je debugt Kimi-gedrag met denken uitgeschakeld op Fireworks
summary: Fireworks-installatie (authenticatie + modelselectie)
title: Vuurwerk
x-i18n:
    generated_at: "2026-06-27T18:11:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7413ec9ea192921ce9b9ec51da5b0b9ff1030feeef192afbefc938ed200e192e
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) biedt open-weight en gerouteerde modellen aan via een OpenAI-compatibele API. Installeer de officiële Fireworks-providerplugin om twee vooraf gecatalogiseerde Kimi-modellen en elke Fireworks-model- of router-id tijdens runtime te gebruiken.

| Eigenschap      | Waarde                                                 |
| --------------- | ------------------------------------------------------ |
| Provider-id     | `fireworks` (alias: `fireworks-ai`)                    |
| Pakket          | `@openclaw/fireworks-provider`                         |
| Auth-env-var    | `FIREWORKS_API_KEY`                                    |
| Onboarding-flag | `--auth-choice fireworks-api-key`                      |
| Directe CLI-flag | `--fireworks-api-key <key>`                           |
| API             | OpenAI-compatibel (`openai-completions`)               |
| Basis-URL       | `https://api.fireworks.ai/inference/v1`                |
| Standaardmodel  | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Standaardalias  | `Kimi K2.5 Turbo`                                      |

## Aan de slag

<Steps>
  <Step title="Installeer de plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Stel de Fireworks API-sleutel in">
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

    Onboarding slaat de sleutel op voor de `fireworks`-provider in je auth-profielen en stelt de **Fire Pass** Kimi K2.5 Turbo-router in als standaardmodel.

  </Step>
  <Step title="Controleer of het model beschikbaar is">
    ```bash
    openclaw models list --provider fireworks
    ```

    De lijst moet `Kimi K2.6` en `Kimi K2.5 Turbo (Fire Pass)` bevatten. Als `FIREWORKS_API_KEY` niet kan worden opgelost, rapporteert `openclaw models status --json` de ontbrekende referentie onder `auth.unusableProfiles`.

  </Step>
</Steps>

## Niet-interactieve setup

Geef voor scripted of CI-installaties alles op de opdrachtregel door:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Ingebouwde catalogus

| Model-ref                                              | Naam                        | Invoer       | Context | Max. uitvoer | Thinking             |
| ------------------------------------------------------ | --------------------------- | ------------ | ------- | ------------ | -------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | tekst + afbeelding | 262,144 | 262,144      | Gedwongen uit        |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | tekst + afbeelding | 256,000 | 256,000      | Gedwongen uit (standaard) |

<Note>
  OpenClaw zet alle Fireworks Kimi-modellen vast op `thinking: off`, omdat Fireworks Kimi-thinkingparameters in productie weigert. Hetzelfde model rechtstreeks via [Moonshot](/nl/providers/moonshot) routeren behoudt Kimi-redeneeruitvoer. Zie [thinking-modi](/nl/tools/thinking) om tussen providers te wisselen.
</Note>

## Aangepaste Fireworks-model-id's

OpenClaw accepteert elke Fireworks-model- of router-id tijdens runtime. Gebruik de exacte id die Fireworks toont en voeg er het voorvoegsel `fireworks/` aan toe. Dynamische resolutie kloont de Fire Pass-template (tekst + afbeeldingsinvoer, OpenAI-compatibele API, standaardkosten nul) en schakelt thinking automatisch uit wanneer de id overeenkomt met het Kimi-patroon. Dynamische GLM-id's worden gemarkeerd als alleen tekst, tenzij je een aangepaste modelvermelding met afbeeldingsinvoer configureert.

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
  <Accordion title="Hoe model-id-voorvoegsels werken">
    Elke Fireworks-model-ref in OpenClaw begint met `fireworks/`, gevolgd door de exacte id of het routerpad van het Fireworks-platform. Bijvoorbeeld:

    - Routermodel: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Direct model: `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw verwijdert het voorvoegsel `fireworks/` bij het construeren van de API-aanvraag en stuurt het resterende pad naar het Fireworks-eindpunt als het OpenAI-compatibele `model`-veld.

  </Accordion>

  <Accordion title="Waarom thinking voor Kimi gedwongen uit staat">
    Fireworks K2.6 retourneert een 400 als de aanvraag `reasoning_*`-parameters bevat, ook al ondersteunt Kimi thinking via Moonshots eigen API. Het providerbeleid (`extensions/fireworks/thinking-policy.ts`) adverteert alleen het `off`-thinkingniveau voor Kimi-model-id's, zodat handmatige `/think`-schakelingen en providerbeleidoppervlakken afgestemd blijven op het runtimecontract.

    Configureer de [Moonshot-provider](/nl/providers/moonshot) en routeer hetzelfde model via die provider om Kimi-reasoning end-to-end te gebruiken.

  </Accordion>

  <Accordion title="Omgevingsbeschikbaarheid voor de daemon">
    Als de Gateway als beheerde service draait (launchd, systemd, Docker), moet de Fireworks-sleutel zichtbaar zijn voor dat proces, niet alleen voor je interactieve shell.

    <Warning>
      Een sleutel die alleen in een interactieve shell is geëxporteerd, helpt een launchd- of systemd-daemon niet, tenzij die omgeving daar ook wordt geïmporteerd. Stel de sleutel in `~/.openclaw/.env` in of via `env.shellEnv` om hem leesbaar te maken vanuit het gatewayproces.
    </Warning>

    Op macOS koppelt `openclaw gateway install` `~/.openclaw/.env` al aan het LaunchAgent-omgevingsbestand. Voer install opnieuw uit (of `openclaw doctor --fix`) nadat je de sleutel hebt geroteerd.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelproviders" href="/nl/concepts/model-providers" icon="layers">
    Providers, model-refs en failovergedrag kiezen.
  </Card>
  <Card title="Thinking-modi" href="/nl/tools/thinking" icon="brain">
    `/think`-niveaus, providerbeleid en routering van reasoning-geschikte modellen.
  </Card>
  <Card title="Moonshot" href="/nl/providers/moonshot" icon="moon">
    Voer Kimi uit met native thinking-uitvoer via Moonshots eigen API.
  </Card>
  <Card title="Probleemoplossing" href="/nl/help/troubleshooting" icon="wrench">
    Algemene probleemoplossing en veelgestelde vragen.
  </Card>
</CardGroup>
