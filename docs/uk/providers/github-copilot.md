---
read_when:
    - Ви хочете використовувати GitHub Copilot як постачальника моделей
    - Вам потрібен потік `openclaw models auth login-github-copilot`
summary: Увійдіть до GitHub Copilot з OpenClaw за допомогою потоку пристрою
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-21T19:20:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: b5169839322f64b24b194302b61c5bad67c6cb6595989f9a1ef65867d8b68659
    source_path: providers/github-copilot.md
    workflow: 15
---

# GitHub Copilot

GitHub Copilot — це ШІ-помічник GitHub для написання коду. Він надає доступ до моделей Copilot для вашого облікового запису GitHub і тарифного плану. OpenClaw може використовувати Copilot як постачальника моделей двома різними способами.

## Два способи використовувати Copilot в OpenClaw

<Tabs>
  <Tab title="Built-in provider (github-copilot)">
    Використовуйте нативний потік входу через пристрій, щоб отримати токен GitHub, а потім обмінювати його на токени API Copilot під час роботи OpenClaw. Це **типовий** і найпростіший шлях, оскільки він не потребує VS Code.

    <Steps>
      <Step title="Run the login command">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Вам буде запропоновано перейти за URL-адресою та ввести одноразовий код. Тримайте термінал відкритим, доки процес не завершиться.
      </Step>
      <Step title="Set a default model">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        Або в конфігурації:

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Copilot Proxy plugin (copilot-proxy)">
    Використовуйте розширення VS Code **Copilot Proxy** як локальний міст. OpenClaw звертається до кінцевої точки `/v1` проксі та використовує список моделей, який ви там налаштуєте.

    <Note>
    Виберіть цей варіант, якщо ви вже запускаєте Copilot Proxy у VS Code або вам потрібно маршрутизувати трафік через нього. Ви маєте ввімкнути Plugin і підтримувати роботу розширення VS Code.
    </Note>

  </Tab>
</Tabs>

## Необов’язкові прапорці

| Flag            | Description                                         |
| --------------- | --------------------------------------------------- |
| `--yes`         | Пропустити запит підтвердження                      |
| `--set-default` | Також застосувати рекомендовану типову модель постачальника |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="Interactive TTY required">
    Потік входу через пристрій потребує інтерактивного TTY. Запускайте його безпосередньо в терміналі, а не в неінтерактивному скрипті чи конвеєрі CI.
  </Accordion>

  <Accordion title="Model availability depends on your plan">
    Доступність моделей Copilot залежить від вашого тарифного плану GitHub. Якщо модель відхиляється, спробуйте інший ID (наприклад, `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Transport selection">
    Ідентифікатори моделей Claude автоматично використовують транспорт Anthropic Messages. Моделі GPT, o-series і Gemini зберігають транспорт OpenAI Responses. OpenClaw вибирає правильний транспорт на основі посилання на модель.
  </Accordion>

  <Accordion title="Environment variable resolution order">
    OpenClaw визначає автентифікацію Copilot зі змінних середовища в такому порядку пріоритету:

    | Priority | Variable              | Notes                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | Найвищий пріоритет, спеціально для Copilot |
    | 2        | `GH_TOKEN`            | Токен GitHub CLI (резервний варіант)      |
    | 3        | `GITHUB_TOKEN`        | Стандартний токен GitHub (найнижчий пріоритет)   |

    Коли встановлено кілька змінних, OpenClaw використовує ту, що має найвищий пріоритет.
    Потік входу через пристрій (`openclaw models auth login-github-copilot`) зберігає
    свій токен у сховищі профілів автентифікації та має пріоритет над усіма змінними
    середовища.

  </Accordion>

  <Accordion title="Token storage">
    Під час входу токен GitHub зберігається у сховищі профілів автентифікації та обмінюється
    на токен API Copilot під час роботи OpenClaw. Вам не потрібно керувати
    токеном вручну.
  </Accordion>
</AccordionGroup>

<Warning>
Потрібен інтерактивний TTY. Запускайте команду входу безпосередньо в терміналі, а не
всередині безголового скрипта чи завдання CI.
</Warning>

## Вбудовування для пошуку в пам’яті

GitHub Copilot також може працювати як постачальник вбудовувань для
[пошуку в пам’яті](/uk/concepts/memory-search). Якщо у вас є підписка Copilot і
ви виконали вхід, OpenClaw може використовувати його для вбудовувань без окремого ключа API.

### Автовиявлення

Коли `memorySearch.provider` має значення `"auto"` (типове значення), GitHub Copilot перевіряється
з пріоритетом 15 — після локальних вбудовувань, але перед OpenAI та іншими платними
постачальниками. Якщо токен GitHub доступний, OpenClaw виявляє доступні
моделі вбудовувань через API Copilot і автоматично вибирає найкращу.

### Явна конфігурація

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Optional: override the auto-discovered model
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Як це працює

1. OpenClaw визначає ваш токен GitHub (зі змінних середовища або профілю автентифікації).
2. Обмінює його на короткочасний токен API Copilot.
3. Виконує запит до кінцевої точки Copilot `/models`, щоб виявити доступні моделі вбудовувань.
4. Вибирає найкращу модель (надає перевагу `text-embedding-3-small`).
5. Надсилає запити на вбудовування до кінцевої точки Copilot `/embeddings`.

Доступність моделей залежить від вашого тарифного плану GitHub. Якщо моделі вбудовувань
недоступні, OpenClaw пропускає Copilot і переходить до наступного постачальника.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Model selection" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="OAuth and auth" href="/uk/gateway/authentication" icon="key">
    Відомості про автентифікацію та правила повторного використання облікових даних.
  </Card>
</CardGroup>
