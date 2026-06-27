---
read_when:
    - Je wilt één API-sleutel voor veel LLM's
    - Je hebt configuratie-instructies voor Baidu Qianfan nodig
summary: Gebruik Qianfan's uniforme API om toegang te krijgen tot veel modellen in OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-06-27T18:14:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a8bc31970dc7fbc43819ec6d51f4bd0047b1acc5a03b23b656e617e3abd97475
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan is Baidu's MaaS-platform, met een **uniforme API** die verzoeken naar veel modellen achter één
eindpunt en API-sleutel routeert. Het is OpenAI-compatibel, dus de meeste OpenAI-SDK's werken door de basis-URL te wijzigen.

| Eigenschap | Waarde                            |
| ---------- | --------------------------------- |
| Provider   | `qianfan`                         |
| Auth       | `QIANFAN_API_KEY`                 |
| API        | OpenAI-compatibel                 |
| Basis-URL  | `https://qianfan.baidubce.com/v2` |

## Plugin installeren

Installeer de officiële Plugin en start daarna Gateway opnieuw:

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## Aan de slag

<Steps>
  <Step title="Create a Baidu Cloud account">
    Registreer je of log in bij de [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) en zorg dat Qianfan API-toegang is ingeschakeld.
  </Step>
  <Step title="Generate an API key">
    Maak een nieuwe applicatie of selecteer een bestaande en genereer daarna een API-sleutel. De sleutelindeling is `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Ingebouwde catalogus

| Modelreferentie                     | Invoer      | Context | Max. uitvoer | Redenering | Opmerkingen    |
| ----------------------------------- | ----------- | ------- | ------------ | ---------- | -------------- |
| `qianfan/deepseek-v3.2`             | tekst       | 98,304  | 32,768       | Ja         | Standaardmodel |
| `qianfan/ernie-5.0-thinking-preview` | tekst, afbeelding | 119,000 | 64,000 | Ja | Multimodaal    |

<Tip>
De standaardmodelreferentie is `qianfan/deepseek-v3.2`. Je hoeft `models.providers.qianfan` alleen te overschrijven wanneer je een aangepaste basis-URL of modelmetadata nodig hebt.
</Tip>

## Configuratievoorbeeld

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Transport and compatibility">
    Qianfan draait via het OpenAI-compatibele transportpad, niet via native OpenAI-verzoekvorming. Dit betekent dat standaardfuncties van OpenAI-SDK's werken, maar providerspecifieke parameters mogelijk niet worden doorgestuurd.
  </Accordion>

  <Accordion title="Catalog and overrides">
    De statische catalogus bevat momenteel `deepseek-v3.2` en `ernie-5.0-thinking-preview`. Voeg `models.providers.qianfan` alleen toe of overschrijf het alleen wanneer je een aangepaste basis-URL of modelmetadata nodig hebt.

    <Note>
    Modelreferenties gebruiken het prefix `qianfan/` (bijvoorbeeld `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Troubleshooting">
    - Zorg dat je API-sleutel begint met `bce-v3/ALTAK-` en dat Qianfan API-toegang is ingeschakeld in de Baidu Cloud-console.
    - Als modellen niet worden weergegeven, controleer dan of de Qianfan-service voor je account is geactiveerd.
    - De standaardbasis-URL is `https://qianfan.baidubce.com/v2`. Wijzig deze alleen als je een aangepast eindpunt of een proxy gebruikt.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Model selection" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="Configuration reference" href="/nl/gateway/configuration-reference" icon="gear">
    Volledige OpenClaw-configuratiereferentie.
  </Card>
  <Card title="Agent setup" href="/nl/concepts/agent" icon="robot">
    Standaardinstellingen en modeltoewijzingen voor agents configureren.
  </Card>
  <Card title="Qianfan API docs" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Officiële Qianfan API-documentatie.
  </Card>
</CardGroup>
