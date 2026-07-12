---
read_when:
    - Je wilt Arcee AI met OpenClaw gebruiken
    - Je hebt de omgevingsvariabele voor de API-sleutel of de CLI-authenticatiekeuze nodig
summary: Arcee AI instellen (authenticatie + modelselectie)
title: Arcee AI
x-i18n:
    generated_at: "2026-07-12T09:17:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fe519393db3cf39f1b14b8121603b6f667102ac8c122fb6560d9b73a6ee6b0a3
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) biedt de Trinity-familie van mixture-of-experts-modellen aan via een OpenAI-compatibele API. Alle Trinity-modellen vallen onder de Apache 2.0-licentie. Arcee is een officiële OpenClaw-Plugin die niet met de kern wordt meegeleverd. Daarom moet deze vóór de onboarding worden geïnstalleerd.

Gebruik Arcee-modellen rechtstreeks via het Arcee-platform of via [OpenRouter](/nl/providers/openrouter).

| Eigenschap | Waarde                                                                                |
| ---------- | ------------------------------------------------------------------------------------- |
| Provider   | `arcee`                                                                               |
| Auth       | `ARCEEAI_API_KEY` (rechtstreeks) of `OPENROUTER_API_KEY` (via OpenRouter)             |
| API        | OpenAI-compatibel                                                                     |
| Basis-URL  | `https://api.arcee.ai/api/v1` (rechtstreeks) of `https://openrouter.ai/api/v1` (OpenRouter) |

## Plugin installeren

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## Aan de slag

<Tabs>
  <Tab title="Rechtstreeks (Arcee-platform)">
    <Steps>
      <Step title="Een API-sleutel verkrijgen">
        Maak een API-sleutel aan bij [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Onboarding uitvoeren">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Een standaardmodel instellen">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Via OpenRouter">
    <Steps>
      <Step title="Een API-sleutel verkrijgen">
        Maak een API-sleutel aan bij [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="Onboarding uitvoeren">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Een standaardmodel instellen">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        Dezelfde modelreferenties werken voor zowel rechtstreekse configuraties als configuraties via OpenRouter.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Niet-interactieve configuratie

<Tabs>
  <Tab title="Rechtstreeks (Arcee-platform)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="Via OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## Ingebouwde catalogus

| Modelreferentie                | Naam                   | Invoer | Context | Maximale uitvoer | Kosten (in/uit per 1 mln.) | Hulpmiddelen | Opmerkingen                                    |
| ------------------------------ | ---------------------- | ------ | ------- | ---------------- | -------------------------- | ------------ | ---------------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | tekst  | 256K    | 80K              | $0.25 / $0.90              | Nee          | Standaardmodel; uitgebreid redeneervermogen    |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | tekst  | 128K    | 16K              | $0.25 / $1.00              | Ja           | Algemeen gebruik; 400 mld. parameters, 13 mld. actief |
| `arcee/trinity-mini`           | Trinity Mini 26B       | tekst  | 128K    | 80K              | $0.045 / $0.15             | Ja           | Snel en kostenefficiënt; functieaanroepen      |

<Tip>
De onboardingvoorinstelling stelt `arcee/trinity-large-thinking` in als standaardmodel.
</Tip>

## Ondersteunde functies

| Functie                                         | Ondersteund                                  |
| ----------------------------------------------- | -------------------------------------------- |
| Streaming                                       | Ja                                           |
| Hulpmiddelen gebruiken / functieaanroepen       | Ja (Trinity Mini, Trinity Large Preview)     |
| Gestructureerde uitvoer (JSON-modus en JSON-schema) | Ja                                       |
| Uitgebreid redeneervermogen                     | Ja (Trinity Large Thinking; hulpmiddelen uitgeschakeld) |

<AccordionGroup>
  <Accordion title="Opmerking over de omgeving">
    Als de Gateway als daemon wordt uitgevoerd (launchd/systemd), moet `ARCEEAI_API_KEY`
    (of `OPENROUTER_API_KEY`) beschikbaar zijn voor dat proces, bijvoorbeeld in
    `~/.openclaw/.env` of via `env.shellEnv`.
  </Accordion>

  <Accordion title="Routering via OpenRouter">
    Wanneer u Arcee-modellen via OpenRouter gebruikt, zijn dezelfde `arcee/*`-modelreferenties van toepassing.
    OpenClaw routeert transparant op basis van uw authenticatiekeuze. Raadpleeg de
    [documentatie voor de OpenRouter-provider](/nl/providers/openrouter) voor
    OpenRouter-specifieke configuratiedetails.
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/nl/providers/openrouter" icon="shuffle">
    Gebruik Arcee-modellen en vele andere modellen met één API-sleutel.
  </Card>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
</CardGroup>
