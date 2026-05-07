---
read_when:
    - Je wilt Arcee AI gebruiken met OpenClaw
    - Je hebt de API-sleutelomgevingsvariabele of de CLI-authenticatiekeuze nodig
summary: Arcee AI-configuratie (authenticatie + modelselectie)
title: Arcee AI
x-i18n:
    generated_at: "2026-05-07T15:08:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8c3775ac2783da0833988c68621bd81c73a3b3e8240c26b4c1b590c1e9df2a8f
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) biedt toegang tot de Trinity-familie van mixture-of-experts-modellen via een OpenAI-compatibele API. Alle Trinity-modellen hebben een Apache 2.0-licentie.

Arcee AI-modellen zijn rechtstreeks toegankelijk via het Arcee-platform of via [OpenRouter](/nl/providers/openrouter).

| Eigenschap | Waarde                                                                                |
| ---------- | ------------------------------------------------------------------------------------- |
| Provider   | `arcee`                                                                               |
| Auth       | `ARCEEAI_API_KEY` (direct) or `OPENROUTER_API_KEY` (via OpenRouter)                   |
| API        | OpenAI-compatibel                                                                     |
| Base-URL   | `https://api.arcee.ai/api/v1` (direct) or `https://openrouter.ai/api/v1` (OpenRouter) |

## Aan de slag

<Tabs>
  <Tab title="Direct (Arcee platform)">
    <Steps>
      <Step title="Get an API key">
        Maak een API-sleutel aan bij [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Get an API key">
        Maak een API-sleutel aan bij [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Set a default model">
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
  <Tab title="Direct (Arcee platform)">
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

OpenClaw wordt momenteel geleverd met deze gebundelde Arcee-catalogus:

| Modelverwijzing                | Naam                   | Invoer | Context | Kosten (in/uit per 1M) | Opmerkingen                               |
| ------------------------------ | ---------------------- | ------ | ------- | ---------------------- | ----------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | tekst  | 256K    | $0.25 / $0.90          | Standaardmodel; redeneren ingeschakeld    |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | tekst  | 128K    | $0.25 / $1.00          | Algemeen gebruik; 400B params, 13B actief |
| `arcee/trinity-mini`           | Trinity Mini 26B       | tekst  | 128K    | $0.045 / $0.15         | Snel en kostenefficient; function calling |

<Tip>
De onboardingpreset stelt `arcee/trinity-large-thinking` in als standaardmodel.
</Tip>

## Ondersteunde functies

| Functie                                           | Ondersteund                                  |
| ------------------------------------------------- | -------------------------------------------- |
| Streaming                                         | Ja                                           |
| Toolgebruik / function calling                    | Ja (Trinity Mini, Trinity Large Preview)     |
| Gestructureerde uitvoer (JSON-modus en JSON-schema) | Ja                                        |
| Uitgebreid denken                                 | Ja (Trinity Large Thinking; tools uitgeschakeld) |

<AccordionGroup>
  <Accordion title="Environment note">
    Als de Gateway als daemon draait (launchd/systemd), zorg er dan voor dat `ARCEEAI_API_KEY`
    (of `OPENROUTER_API_KEY`) beschikbaar is voor dat proces (bijvoorbeeld in
    `~/.openclaw/.env` of via `env.shellEnv`).
  </Accordion>

  <Accordion title="OpenRouter routing">
    Wanneer je Arcee-modellen via OpenRouter gebruikt, gelden dezelfde `arcee/*`-modelverwijzingen.
    OpenClaw handelt routering transparant af op basis van je auth-keuze. Zie de
    [OpenRouter-providerdocumentatie](/nl/providers/openrouter) voor OpenRouter-specifieke
    configuratiedetails.
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/nl/providers/openrouter" icon="shuffle">
    Krijg toegang tot Arcee-modellen en vele andere via een enkele API-sleutel.
  </Card>
  <Card title="Model selection" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelverwijzingen en failovergedrag kiezen.
  </Card>
</CardGroup>
