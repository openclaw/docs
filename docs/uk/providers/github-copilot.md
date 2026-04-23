---
read_when:
    - Ви хочете використовувати GitHub Copilot як провайдера models
    - Вам потрібен потік `openclaw models auth login-github-copilot`
summary: Увійти до GitHub Copilot з OpenClaw за допомогою device flow
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-23T21:06:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b54a063e30e9202c6b9de35a1a3736ef8c36020296215491fb719afe73a0c3e
    source_path: providers/github-copilot.md
    workflow: 15
---

GitHub Copilot — це AI-помічник для кодування від GitHub. Він надає доступ до
моделей Copilot для вашого облікового запису та плану GitHub. OpenClaw може
використовувати Copilot як провайдера models двома різними способами.

## Два способи використовувати Copilot в OpenClaw

<Tabs>
  <Tab title="Вбудований провайдер (github-copilot)">
    Використовуйте нативний device-login flow, щоб отримати токен GitHub, а потім обмінювати його на
    API-токени Copilot під час роботи OpenClaw. Це **типовий** і найпростіший шлях,
    оскільки він не потребує VS Code.

    <Steps>
      <Step title="Запустіть команду входу">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Вам буде запропоновано перейти за URL і ввести одноразовий код. Не закривайте
        термінал до завершення процесу.
      </Step>
      <Step title="Задайте типову модель">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        Або в config:

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

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Використовуйте розширення **Copilot Proxy** для VS Code як локальний bridge. OpenClaw звертається до
    ендпоінта `/v1` цього proxy і використовує список моделей, який ви там налаштуєте.

    <Note>
    Обирайте це, якщо ви вже використовуєте Copilot Proxy у VS Code або вам потрібно маршрутизувати
    через нього. Ви маєте ввімкнути plugin і підтримувати роботу розширення VS Code.
    </Note>

  </Tab>
</Tabs>

## Необов’язкові прапорці

| Прапорець      | Опис                                                |
| -------------- | --------------------------------------------------- |
| `--yes`        | Пропустити запит підтвердження                      |
| `--set-default` | Також застосувати рекомендовану типову модель провайдера |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="Потрібен інтерактивний TTY">
    Device-login flow потребує інтерактивного TTY. Запускайте його безпосередньо в
    терміналі, а не в неінтерактивному скрипті чи CI pipeline.
  </Accordion>

  <Accordion title="Доступність моделей залежить від вашого плану">
    Доступність моделей Copilot залежить від вашого плану GitHub. Якщо модель
    відхиляється, спробуйте інший ID (наприклад, `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Вибір transport">
    ID моделей Claude автоматично використовують transport Anthropic Messages. Моделі GPT,
    o-series і Gemini залишають OpenAI Responses transport. OpenClaw
    вибирає правильний transport на основі model ref.
  </Accordion>

  <Accordion title="Порядок розв’язання змінних середовища">
    OpenClaw розв’язує auth Copilot зі змінних середовища в такому
    порядку пріоритету:

    | Пріоритет | Змінна               | Примітки                         |
    | --------- | -------------------- | -------------------------------- |
    | 1         | `COPILOT_GITHUB_TOKEN` | Найвищий пріоритет, специфічний для Copilot |
    | 2         | `GH_TOKEN`           | Токен GitHub CLI (резервний варіант) |
    | 3         | `GITHUB_TOKEN`       | Стандартний токен GitHub (найнижчий) |

    Коли задано кілька змінних, OpenClaw використовує ту, що має найвищий пріоритет.
    Device-login flow (`openclaw models auth login-github-copilot`) зберігає
    свій токен у сховищі auth profile і має пріоритет над усіма змінними
    середовища.

  </Accordion>

  <Accordion title="Зберігання токена">
    Під час входу токен GitHub зберігається в сховищі auth profile, а вже під час запуску OpenClaw він обмінюється
    на API-токен Copilot. Вам не потрібно керувати токеном вручну.
  </Accordion>
</AccordionGroup>

<Warning>
Потрібен інтерактивний TTY. Запускайте команду входу безпосередньо в терміналі, а не
в headless-скрипті чи CI job.
</Warning>

## Embeddings для пошуку пам’яті

GitHub Copilot також може слугувати провайдером embeddings для
[пошуку пам’яті](/uk/concepts/memory-search). Якщо у вас є підписка Copilot і
ви вже увійшли в систему, OpenClaw може використовувати його для embeddings без окремого API-ключа.

### Автовизначення

Коли `memorySearch.provider` має значення `"auto"` (типове), GitHub Copilot пробується
з пріоритетом 15 — після локальних embeddings, але до OpenAI та інших платних
провайдерів. Якщо доступний токен GitHub, OpenClaw виявляє доступні
embedding-моделі через API Copilot і автоматично вибирає найкращу.

### Явна config

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

1. OpenClaw розв’язує ваш токен GitHub (зі змінних env або auth profile).
2. Обмінює його на короткоживучий API-токен Copilot.
3. Опитує ендпоінт Copilot `/models`, щоб виявити доступні embedding-моделі.
4. Вибирає найкращу модель (надає перевагу `text-embedding-3-small`).
5. Надсилає запити на embeddings до ендпоінта Copilot `/embeddings`.

Доступність моделей залежить від вашого плану GitHub. Якщо embedding-моделей
немає, OpenClaw пропускає Copilot і пробує наступного провайдера.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="OAuth і auth" href="/uk/gateway/authentication" icon="key">
    Деталі auth і правила повторного використання credentials.
  </Card>
</CardGroup>
