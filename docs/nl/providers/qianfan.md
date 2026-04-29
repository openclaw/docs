---
read_when:
    - Je wilt één API-sleutel voor veel LLM's
    - Je hebt begeleiding nodig bij het instellen van Baidu Qianfan
summary: Gebruik de uniforme API van Qianfan om toegang te krijgen tot veel modellen in OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-04-29T23:12:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6adfbad6c18bf2bcf93d9c56c51591c862ebb751ffd8183015fa2fc9566ce0af
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan is Baidu's MaaS-platform, dat een **uniforme API** biedt die aanvragen naar veel modellen achter één
endpoint en API-sleutel routeert. Het is OpenAI-compatibel, dus de meeste OpenAI-SDK's werken door de basis-URL te wijzigen.

| Eigenschap | Waarde                            |
| -------- | --------------------------------- |
| Provider | `qianfan`                         |
| Auth     | `QIANFAN_API_KEY`                 |
| API      | OpenAI-compatibel                 |
| Basis-URL | `https://qianfan.baidubce.com/v2` |

## Aan de slag

<Steps>
  <Step title="Maak een Baidu Cloud-account aan">
    Registreer je of log in bij de [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) en zorg dat je Qianfan API-toegang is ingeschakeld.
  </Step>
  <Step title="Genereer een API-sleutel">
    Maak een nieuwe applicatie aan of selecteer een bestaande, en genereer vervolgens een API-sleutel. De sleutelindeling is `bce-v3/ALTAK-...`.
  </Step>
  <Step title="Voer onboarding uit">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="Controleer of het model beschikbaar is">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Ingebouwde catalogus

| Modelreferentie                     | Invoer      | Context | Maximale uitvoer | Redeneren | Opmerkingen      |
| ------------------------------------ | ----------- | ------- | ---------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`              | tekst       | 98,304  | 32,768     | Ja        | Standaardmodel |
| `qianfan/ernie-5.0-thinking-preview` | tekst, afbeelding | 119,000 | 64,000     | Ja        | Multimodaal    |

<Tip>
De standaard meegeleverde modelreferentie is `qianfan/deepseek-v3.2`. Je hoeft `models.providers.qianfan` alleen te overschrijven wanneer je een aangepaste basis-URL of modelmetadata nodig hebt.
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
  <Accordion title="Transport en compatibiliteit">
    Qianfan gebruikt het OpenAI-compatibele transportpad, niet native OpenAI-aanvraagvorming. Dit betekent dat standaardfuncties van OpenAI-SDK's werken, maar providerspecifieke parameters mogelijk niet worden doorgestuurd.
  </Accordion>

  <Accordion title="Catalogus en overschrijvingen">
    De meegeleverde catalogus bevat momenteel `deepseek-v3.2` en `ernie-5.0-thinking-preview`. Voeg `models.providers.qianfan` alleen toe of overschrijf het alleen wanneer je een aangepaste basis-URL of modelmetadata nodig hebt.

    <Note>
    Modelreferenties gebruiken het voorvoegsel `qianfan/` (bijvoorbeeld `qianfan/deepseek-v3.2`).
    </Note>

  </Accordion>

  <Accordion title="Probleemoplossing">
    - Zorg dat je API-sleutel begint met `bce-v3/ALTAK-` en dat Qianfan API-toegang is ingeschakeld in de Baidu Cloud-console.
    - Als modellen niet worden weergegeven, controleer dan of de Qianfan-service voor je account is geactiveerd.
    - De standaard basis-URL is `https://qianfan.baidubce.com/v2`. Wijzig deze alleen als je een aangepast endpoint of een proxy gebruikt.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledige OpenClaw-configuratiereferentie.
  </Card>
  <Card title="Agentconfiguratie" href="/nl/concepts/agent" icon="robot">
    Agentstandaarden en modeltoewijzingen configureren.
  </Card>
  <Card title="Qianfan API-documentatie" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Officiële Qianfan API-documentatie.
  </Card>
</CardGroup>
