---
read_when:
    - Вам потрібен доступ до моделей, розміщених в OpenCode
    - Ви хочете вибрати між каталогами Zen і Go
summary: Використовуйте каталоги OpenCode Zen і Go з OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-06-28T20:45:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d777563b82aafbe83a5256c11f1a9cd330e782f08dd467583368a77ebca4fc4
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode надає два розміщені каталоги в OpenClaw:

| Каталог | Префікс           | Постачальник середовища виконання |
| ------- | ----------------- | --------------------------------- |
| **Zen** | `opencode/...`    | `opencode`                        |
| **Go**  | `opencode-go/...` | `opencode-go`                     |

Обидва каталоги використовують той самий API-ключ OpenCode. OpenClaw тримає ідентифікатори постачальників середовища виконання
розділеними, щоб upstream-маршрутизація для кожної моделі залишалася правильною, але onboarding і документація розглядають їх
як одне налаштування OpenCode.

## Початок роботи

<Tabs>
  <Tab title="Zen catalog">
    **Найкраще для:** кураторського багатомодельного проксі OpenCode (Claude, GPT, Gemini, GLM).

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Або передайте ключ напряму:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Set a Zen model as the default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Go catalog">
    **Найкраще для:** розміщеної в OpenCode лінійки Kimi, GLM і MiniMax.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Або передайте ключ напряму:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Set a Go model as the default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Verify models are available">
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

## Вбудовані каталоги

### Zen

| Властивість                         | Значення                                                                                      |
| ----------------------------------- | --------------------------------------------------------------------------------------------- |
| Постачальник середовища виконання   | `opencode`                                                                                    |
| Приклади моделей                    | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

### Go

| Властивість                         | Значення                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------ |
| Постачальник середовища виконання   | `opencode-go`                                                            |
| Приклади моделей                    | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="API key aliases">
    `OPENCODE_ZEN_API_KEY` також підтримується як псевдонім для `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Shared credentials">
    Введення одного ключа OpenCode під час налаштування зберігає облікові дані для обох постачальників середовища
    виконання. Не потрібно виконувати onboarding для кожного каталогу окремо.
  </Accordion>

  <Accordion title="Billing and dashboard">
    Ви входите в OpenCode, додаєте платіжні дані та копіюєте свій API-ключ. Виставлення рахунків
    і доступність каталогів керуються з панелі керування OpenCode.
  </Accordion>

  <Accordion title="Gemini replay behavior">
    Посилання OpenCode на базі Gemini залишаються на шляху проксі-Gemini, тому OpenClaw зберігає
    там очищення підписів міркувань Gemini, не вмикаючи нативну перевірку повторного відтворення Gemini
    або переписування bootstrap.
  </Accordion>

  <Accordion title="Non-Gemini replay behavior">
    Посилання OpenCode не на базі Gemini зберігають мінімальну політику повторного відтворення, сумісну з OpenAI.
  </Accordion>
</AccordionGroup>

<Tip>
Введення одного ключа OpenCode під час налаштування зберігає облікові дані для обох постачальників середовища виконання Zen і
Go, тому onboarding потрібно виконати лише один раз.
</Tip>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Model selection" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки аварійного перемикання.
  </Card>
  <Card title="Configuration reference" href="/uk/gateway/configuration-reference" icon="gear">
    Повна довідка з конфігурації для агентів, моделей і постачальників.
  </Card>
</CardGroup>
