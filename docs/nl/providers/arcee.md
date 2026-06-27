---
read_when:
    - Je wilt Arcee AI gebruiken met OpenClaw
    - Je hebt de API-sleutel-env-var of CLI-authenticatiekeuze nodig
summary: Arcee AI instellen (authenticatie + modelselectie)
title: Arcee AI
x-i18n:
    generated_at: "2026-06-27T18:09:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15570c1d018104377a473fe5f9b556d9a6ffd2dea6db5d55d46ca3702e237101
    source_path: providers/arcee.md
    workflow: 16
---

[Arcee AI](https://arcee.ai) biedt toegang tot de Trinity-familie van mixture-of-experts-modellen via een OpenAI-compatibele API. Alle Trinity-modellen hebben een Apache 2.0-licentie.

Arcee AI-modellen zijn rechtstreeks toegankelijk via het Arcee-platform of via [OpenRouter](/nl/providers/openrouter).

| Eigenschap | Waarde                                                                                |
| ---------- | ------------------------------------------------------------------------------------- |
| Provider   | `arcee`                                                                               |
| Auth       | `ARCEEAI_API_KEY` (rechtstreeks) of `OPENROUTER_API_KEY` (via OpenRouter)             |
| API        | OpenAI-compatibel                                                                     |
| Basis-URL  | `https://api.arcee.ai/api/v1` (rechtstreeks) of `https://openrouter.ai/api/v1` (OpenRouter) |

## Plugin installeren

Installeer de officiële plugin en herstart daarna Gateway:

```bash
openclaw plugins install @openclaw/arcee-provider
openclaw gateway restart
```

## Aan de slag

<Tabs>
  <Tab title="Rechtstreeks (Arcee-platform)">
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

        Dezelfde modelrefs werken voor zowel rechtstreekse als OpenRouter-configuraties (bijvoorbeeld `arcee/trinity-large-thinking`).
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

OpenClaw levert momenteel deze statische Arcee-catalogus mee:

| Modelref                       | Naam                   | Invoer | Context | Kosten (in/uit per 1M) | Opmerkingen                                |
| ------------------------------ | ---------------------- | ------ | ------- | ---------------------- | ------------------------------------------ |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | tekst  | 256K    | $0.25 / $0.90          | Standaardmodel; redeneren ingeschakeld     |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | tekst  | 128K    | $0.25 / $1.00          | Algemeen gebruik; 400B parameters, 13B actief |
| `arcee/trinity-mini`           | Trinity Mini 26B       | tekst  | 128K    | $0.045 / $0.15         | Snel en kostenefficiënt; function calling  |

<Tip>
De onboarding-preset stelt `arcee/trinity-large-thinking` in als standaardmodel.
</Tip>

## Ondersteunde functies

| Functie                                       | Ondersteund                                  |
| --------------------------------------------- | -------------------------------------------- |
| Streaming                                     | Ja                                           |
| Toolgebruik / function calling                | Ja (Trinity Mini, Trinity Large Preview)     |
| Gestructureerde uitvoer (JSON-modus en JSON-schema) | Ja                                    |
| Uitgebreid redeneren                          | Ja (Trinity Large Thinking; tools uitgeschakeld) |

<AccordionGroup>
  <Accordion title="Omgevingsnotitie">
    Als de Gateway als daemon draait (launchd/systemd), zorg er dan voor dat `ARCEEAI_API_KEY`
    (of `OPENROUTER_API_KEY`) beschikbaar is voor dat proces (bijvoorbeeld in
    `~/.openclaw/.env` of via `env.shellEnv`).
  </Accordion>

  <Accordion title="OpenRouter-routering">
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
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelrefs en failovergedrag kiezen.
  </Card>
</CardGroup>
