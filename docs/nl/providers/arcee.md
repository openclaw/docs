---
read_when:
    - Je wilt Arcee AI gebruiken met OpenClaw
    - Je hebt de omgevingsvariabele voor de API-sleutel of de CLI-authenticatiekeuze nodig
summary: Arcee AI configureren (authenticatie + modelselectie)
title: Arcee AI
x-i18n:
    generated_at: "2026-05-03T11:16:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54989e1706901fedc8a0c816ca7ee7f877fa4b973697540dd90cb9182420043f
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) biedt toegang tot de Trinity-familie van mixture-of-experts-modellen via een OpenAI-compatibele API. Alle Trinity-modellen hebben een Apache 2.0-licentie.

Arcee AI-modellen zijn direct toegankelijk via het Arcee-platform of via [OpenRouter](/nl/providers/openrouter).

| Eigenschap | Waarde                                                                                |
| ---------- | ------------------------------------------------------------------------------------- |
| Provider   | `arcee`                                                                               |
| Authenticatie | `ARCEEAI_API_KEY` (direct) of `OPENROUTER_API_KEY` (via OpenRouter)                |
| API        | OpenAI-compatibel                                                                     |
| Basis-URL  | `https://api.arcee.ai/api/v1` (direct) of `https://openrouter.ai/api/v1` (OpenRouter) |

## Aan de slag

<Tabs>
  <Tab title="Direct (Arcee-platform)">
    <Steps>
      <Step title="Een API-sleutel ophalen">
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
      <Step title="Een API-sleutel ophalen">
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

        Dezelfde modelverwijzingen werken voor zowel directe configuraties als OpenRouter-configuraties (bijvoorbeeld `arcee/trinity-large-thinking`).
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Niet-interactieve configuratie

<Tabs>
  <Tab title="Direct (Arcee-platform)">
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

OpenClaw levert momenteel deze gebundelde Arcee-catalogus mee:

| Modelverwijzing                | Naam                   | Invoer | Context | Kosten (in/uit per 1 mln.) | Opmerkingen                              |
| ------------------------------ | ---------------------- | ------ | ------- | --------------------------- | ---------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | tekst  | 256K    | $0.25 / $0.90               | Standaardmodel; redeneren ingeschakeld   |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | tekst  | 128K    | $0.25 / $1.00               | Algemeen gebruik; 400B parameters, 13B actief |
| `arcee/trinity-mini`           | Trinity Mini 26B       | tekst  | 128K    | $0.045 / $0.15              | Snel en kostenefficient; functieaanroepen |

<Tip>
De onboarding-preset stelt `arcee/trinity-large-thinking` in als standaardmodel.
</Tip>

## Ondersteunde functies

| Functie                                        | Ondersteund                  |
| ---------------------------------------------- | ---------------------------- |
| Streaming                                      | Ja                           |
| Toolgebruik / functieaanroepen                 | Ja                           |
| Gestructureerde uitvoer (JSON-modus en JSON-schema) | Ja                    |
| Uitgebreid denken                              | Ja (Trinity Large Thinking)  |

<AccordionGroup>
  <Accordion title="Omgevingsopmerking">
    Als de Gateway als daemon draait (launchd/systemd), zorg er dan voor dat `ARCEEAI_API_KEY`
    (of `OPENROUTER_API_KEY`) beschikbaar is voor dat proces (bijvoorbeeld in
    `~/.openclaw/.env` of via `env.shellEnv`).
  </Accordion>

  <Accordion title="OpenRouter-routering">
    Wanneer u Arcee-modellen via OpenRouter gebruikt, gelden dezelfde `arcee/*`-modelverwijzingen.
    OpenClaw verwerkt de routering transparant op basis van uw authenticatiekeuze. Zie de
    [OpenRouter-providerdocumentatie](/nl/providers/openrouter) voor OpenRouter-specifieke
    configuratiedetails.
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/nl/providers/openrouter" icon="shuffle">
    Krijg toegang tot Arcee-modellen en vele andere via een enkele API-sleutel.
  </Card>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failovergedrag kiezen.
  </Card>
</CardGroup>
