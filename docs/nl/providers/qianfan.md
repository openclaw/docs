---
read_when:
    - Je wilt één API-sleutel voor veel LLM's
    - Je hebt installatie-instructies voor Baidu Qianfan nodig
summary: Gebruik de uniforme API van Qianfan om toegang te krijgen tot diverse modellen in OpenClaw
title: Qianfan
x-i18n:
    generated_at: "2026-07-12T09:20:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31387a53ee4472e2d20ae939ea75cea0d6f6367501becd56a8654fd97fdf0804
    source_path: providers/qianfan.md
    workflow: 16
---

Qianfan is Baidu's MaaS-platform: een uniforme, OpenAI-compatibele API die aanvragen via één endpoint en API-sleutel naar verschillende modellen doorstuurt. OpenClaw levert deze als de officiële externe Plugin `@openclaw/qianfan-provider`.

| Eigenschap     | Waarde                                   |
| -------------- | ---------------------------------------- |
| Provider       | `qianfan`                                |
| Authenticatie  | `QIANFAN_API_KEY`                        |
| API            | OpenAI-compatibel (`openai-completions`) |
| Basis-URL      | `https://qianfan.baidubce.com/v2`        |
| Standaardmodel | `qianfan/deepseek-v3.2`                  |

## Plugin installeren

Installeer de officiële Plugin en start daarna de Gateway opnieuw:

```bash
openclaw plugins install @openclaw/qianfan-provider
openclaw gateway restart
```

## Aan de slag

<Steps>
  <Step title="Een Baidu Cloud-account aanmaken">
    Registreer u of meld u aan bij de [Qianfan Console](https://console.bce.baidu.com/qianfan/ais/console/apiKey) en zorg dat API-toegang tot Qianfan is ingeschakeld.
  </Step>
  <Step title="Een API-sleutel genereren">
    Maak een nieuwe toepassing aan of selecteer een bestaande toepassing en genereer vervolgens een API-sleutel. Sleutels van Baidu Cloud gebruiken de indeling `bce-v3/ALTAK-...`.
  </Step>
  <Step title="De onboarding uitvoeren">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```

    Niet-interactieve uitvoeringen lezen de sleutel uit `--qianfan-api-key <key>` of
    `QIANFAN_API_KEY`. De onboarding schrijft de providerconfiguratie, voegt de
    alias `QIANFAN` voor het standaardmodel toe en stelt `qianfan/deepseek-v3.2`
    in als standaardmodel wanneer er geen model is geconfigureerd.

  </Step>
  <Step title="Controleren of het model beschikbaar is">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## Ingebouwde catalogus

| Modelreferentie                      | Invoer      | Context | Maximale uitvoer | Redeneren | Opmerkingen   |
| ------------------------------------ | ----------- | ------- | ---------------- | --------- | ------------- |
| `qianfan/deepseek-v3.2`              | tekst       | 98,304  | 32,768           | Ja        | Standaardmodel |
| `qianfan/ernie-5.0-thinking-preview` | tekst, beeld | 119,000 | 64,000           | Ja        | Multimodaal   |

De catalogus is statisch; modellen worden niet live gedetecteerd.

<Tip>
U hoeft `models.providers.qianfan` alleen te overschrijven wanneer u een aangepaste basis-URL of aangepaste modelmetadata nodig hebt.
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

<Note>
Modelreferenties gebruiken het voorvoegsel `qianfan/` (bijvoorbeeld `qianfan/deepseek-v3.2`).
</Note>

<AccordionGroup>
  <Accordion title="Transport en compatibiliteit">
    Qianfan gebruikt het OpenAI-compatibele transportpad en niet de systeemeigen vormgeving van OpenAI-aanvragen. Standaardfuncties van de OpenAI SDK werken, maar providerspecifieke parameters worden mogelijk niet doorgestuurd.
  </Accordion>

  <Accordion title="Problemen oplossen">
    - Zorg dat uw API-sleutel begint met `bce-v3/ALTAK-` en dat API-toegang tot Qianfan is ingeschakeld in de Baidu Cloud-console.
    - Als modellen niet worden weergegeven, controleert u of de Qianfan-service voor uw account is geactiveerd.
    - Wijzig de basis-URL alleen als u een aangepast endpoint of een aangepaste proxy gebruikt.

  </Accordion>
</AccordionGroup>

## Gerelateerd

<CardGroup cols={2}>
  <Card title="Modelselectie" href="/nl/concepts/model-providers" icon="layers">
    Providers, modelreferenties en failovergedrag kiezen.
  </Card>
  <Card title="Configuratiereferentie" href="/nl/gateway/configuration-reference" icon="gear">
    Volledige configuratiereferentie voor OpenClaw.
  </Card>
  <Card title="Agentconfiguratie" href="/nl/concepts/agent" icon="robot">
    Standaardwaarden en modeltoewijzingen voor agents configureren.
  </Card>
  <Card title="Qianfan API-documentatie" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    Officiële documentatie voor de Qianfan API.
  </Card>
</CardGroup>
