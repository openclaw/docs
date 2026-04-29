---
read_when:
    - Je wilt Arcee AI gebruiken met OpenClaw
    - Je hebt de omgevingsvariabele voor de API-sleutel of de CLI-authenticatiekeuze nodig
summary: Arcee AI instellen (authenticatie + modelselectie)
title: Arcee AI
x-i18n:
    generated_at: "2026-04-29T23:08:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 54989e1706901fedc8a0c816ca7ee7f877fa4b973697540dd90cb9182420043f
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) biedt toegang tot de Trinity-familie van modellen met mixture-of-experts-architectuur via een OpenAI-compatibele API. Alle Trinity-modellen zijn gelicentieerd onder Apache 2.0.

Arcee AI-modellen zijn rechtstreeks toegankelijk via het Arcee-platform of via [OpenRouter](/nl/providers/openrouter).

| Eigenschap | Waarde                                                                                |
| ---------- | ------------------------------------------------------------------------------------- |
| Aanbieder  | `arcee`                                                                               |
| Auth       | `ARCEEAI_API_KEY` (direct) or `OPENROUTER_API_KEY` (via OpenRouter)                   |
| API        | OpenAI-compatibel                                                                     |
| Basis-URL  | `https://api.arcee.ai/api/v1` (direct) or `https://openrouter.ai/api/v1` (OpenRouter) |

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

        Dezelfde modelrefs werken voor zowel directe configuraties als OpenRouter-configuraties (bijvoorbeeld `arcee/trinity-large-thinking`).
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

| Modelref                       | Naam                   | Invoer | Context | Kosten (in/uit per 1M) | Opmerkingen                              |
| ------------------------------ | ---------------------- | ------ | ------- | ---------------------- | ---------------------------------------- |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text   | 256K    | $0.25 / $0.90          | Standaardmodel; redeneren ingeschakeld   |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text   | 128K    | $0.25 / $1.00          | Algemeen inzetbaar; 400B params, 13B actief |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text   | 128K    | $0.045 / $0.15         | Snel en kostenefficiënt; functieaanroepen |

<Tip>
De onboarding-preset stelt `arcee/trinity-large-thinking` in als het standaardmodel.
</Tip>

## Ondersteunde functies

| Functie                                      | Ondersteund                  |
| -------------------------------------------- | ---------------------------- |
| Streaming                                    | Ja                           |
| Toolgebruik / functieaanroepen              | Ja                           |
| Gestructureerde uitvoer (JSON-modus en JSON-schema) | Ja                   |
| Uitgebreid denken                           | Ja (Trinity Large Thinking)  |

<AccordionGroup>
  <Accordion title="Environment note">
    Als de Gateway als daemon draait (launchd/systemd), zorg er dan voor dat `ARCEEAI_API_KEY`
    (of `OPENROUTER_API_KEY`) beschikbaar is voor dat proces (bijvoorbeeld in
    `~/.openclaw/.env` of via `env.shellEnv`).
  </Accordion>

  <Accordion title="OpenRouter routing">
    Wanneer je Arcee-modellen via OpenRouter gebruikt, gelden dezelfde `arcee/*`-modelrefs.
    OpenClaw handelt de routering transparant af op basis van je auth-keuze. Zie de
    [OpenRouter-providerdocumentatie](/nl/providers/openrouter) voor OpenRouter-specifieke
    configuratiedetails.
  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/nl/providers/openrouter" icon="shuffle">
    Krijg toegang tot Arcee-modellen en vele andere via één API-sleutel.
  </Card>
  <Card title="Model selection" href="/nl/concepts/model-providers" icon="layers">
    Aanbieders, modelrefs en failovergedrag kiezen.
  </Card>
</CardGroup>
