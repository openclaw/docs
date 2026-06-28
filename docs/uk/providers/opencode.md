---
read_when:
    - Вам потрібен доступ до моделей, розміщених в OpenCode
    - Ви хочете вибрати між каталогами Zen і Go
summary: Використовуйте каталоги OpenCode Zen і Go з OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-25T04:07:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb0521b038e519f139c66f98ddef4919d8c43ce64018ef8af8f7b42ac00114a4
    source_path: providers/opencode.md
    workflow: 15
    postprocess_version: locale-links-v1
---

OpenCode надає два розміщені каталоги в OpenClaw:

| Каталог | Префікс          | Постачальник середовища виконання |
| ------- | ---------------- | --------------------------------- |
| **Zen** | `opencode/...`   | `opencode`                        |
| **Go**  | `opencode-go/...` | `opencode-go`                    |

Обидва каталоги використовують той самий API-ключ OpenCode. OpenClaw зберігає ідентифікатори постачальників середовища виконання
розділеними, щоб маршрутизація для кожної моделі на рівні upstream залишалася коректною, але онбординг і документація розглядають їх
як єдине налаштування OpenCode.

## Початок роботи

<Tabs>
  <Tab title="Каталог Zen">
    **Найкраще підходить для:** курованого багатомодельного проксі OpenCode (Claude, GPT, Gemini).

    <Steps>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Або передайте ключ напряму:

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Установіть модель Zen як стандартну">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Перевірте, що моделі доступні">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Каталог Go">
    **Найкраще підходить для:** лінійки Kimi, GLM і MiniMax, розміщеної в OpenCode.

    <Steps>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Або передайте ключ напряму:

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Установіть модель Go як стандартну">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Перевірте, що моделі доступні">
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

| Властивість      | Значення                                                               |
| ---------------- | ---------------------------------------------------------------------- |
| Постачальник середовища виконання | `opencode`                                           |
| Приклади моделей | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| Властивість      | Значення                                                                |
| ---------------- | ----------------------------------------------------------------------- |
| Постачальник середовища виконання | `opencode-go`                                         |
| Приклади моделей | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Псевдоніми API-ключа">
    `OPENCODE_ZEN_API_KEY` також підтримується як псевдонім для `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Спільні облікові дані">
    Введення одного ключа OpenCode під час налаштування зберігає облікові дані для обох постачальників
    середовища виконання. Вам не потрібно окремо проходити онбординг для кожного каталогу.
  </Accordion>

  <Accordion title="Білінг і панель керування">
    Ви входите в OpenCode, додаєте платіжні дані та копіюєте свій API-ключ. Білінг
    і доступність каталогів керуються з панелі керування OpenCode.
  </Accordion>

  <Accordion title="Поведінка повторного відтворення Gemini">
    Посилання OpenCode на базі Gemini залишаються на шляху proxy-Gemini, тому OpenClaw зберігає
    там очищення thought-signature Gemini без увімкнення власної перевірки повторного
    відтворення Gemini або переписування bootstrap.
  </Accordion>

  <Accordion title="Поведінка повторного відтворення не-Gemini">
    Посилання OpenCode не-Gemini зберігають мінімальну політику повторного відтворення, сумісну з OpenAI.
  </Accordion>
</AccordionGroup>

<Tip>
Введення одного ключа OpenCode під час налаштування зберігає облікові дані для обох постачальників середовища виконання,
Zen і Go, тому вам потрібно пройти онбординг лише один раз.
</Tip>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Довідник із конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повний довідник із конфігурації для агентів, моделей і постачальників.
  </Card>
</CardGroup>
