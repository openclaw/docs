---
read_when:
    - Ви хочете доступ до моделей, розміщених в OpenCode
    - Ви хочете вибрати між каталогами Zen і Go
summary: Використання каталогів OpenCode Zen і Go з OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-23T21:07:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: d017d3a3c9ffa1cefe66823e822080fde8c69429ba945c4e5883723e8bfe9c22
    source_path: providers/opencode.md
    workflow: 15
---

OpenCode відкриває в OpenClaw два розміщені каталоги:

| Catalog | Prefix            | Runtime provider |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

Обидва каталоги використовують той самий API key OpenCode. OpenClaw зберігає runtime provider id окремими,
щоб маршрутизація per-model на боці upstream залишалася правильною, але onboarding і документація трактують їх
як одне налаштування OpenCode.

## Початок роботи

<Tabs>
  <Tab title="Каталог Zen">
    **Найкраще для:** curated multi-model proxy OpenCode (Claude, GPT, Gemini).

    <Steps>
      <Step title="Запустіть onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Або передайте ключ напряму:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Задайте модель Zen як типову">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Переконайтеся, що моделі доступні">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Каталог Go">
    **Найкраще для:** лінійки Kimi, GLM і MiniMax, розміщених в OpenCode.

    <Steps>
      <Step title="Запустіть onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Або передайте ключ напряму:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Задайте модель Go як типову">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="Переконайтеся, що моделі доступні">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Приклад конфігурації

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Каталоги

### Zen

| Property         | Value                                                                   |
| ---------------- | ----------------------------------------------------------------------- |
| Runtime provider | `opencode`                                                              |
| Example models   | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| Property         | Value                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| Runtime provider | `opencode-go`                                                            |
| Example models   | `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Розширене налаштування

<AccordionGroup>
  <Accordion title="Alias-и API key">
    `OPENCODE_ZEN_API_KEY` також підтримується як alias для `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Спільні облікові дані">
    Введення одного ключа OpenCode під час setup зберігає облікові дані для обох runtime
    provider-ів. Вам не потрібно окремо проходити onboarding для кожного каталогу.
  </Accordion>

  <Accordion title="Billing і dashboard">
    Ви входите в OpenCode, додаєте billing details і копіюєте свій API key. Billing
    і доступність каталогів керуються з dashboard OpenCode.
  </Accordion>

  <Accordion title="Поведінка Gemini replay">
    Посилання OpenCode на базі Gemini залишаються на шляху proxy-Gemini, тому OpenClaw зберігає
    там очищення thought-signature Gemini без увімкнення native
    replay validation Gemini або bootstrap-переписувань.
  </Accordion>

  <Accordion title="Поведінка non-Gemini replay">
    Посилання OpenCode, які не є Gemini, зберігають мінімальну OpenAI-compatible політику replay.
  </Accordion>
</AccordionGroup>

<Tip>
Введення одного ключа OpenCode під час setup зберігає облікові дані і для Zen, і
для runtime provider-ів Go, тож onboarding потрібно пройти лише один раз.
</Tip>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, model ref і поведінки failover.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник конфігурації для агентів, моделей і провайдерів.
  </Card>
</CardGroup>
