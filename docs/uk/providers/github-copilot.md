---
read_when:
    - Ви хочете використовувати GitHub Copilot як постачальника моделі
    - Вам потрібен потік `openclaw models auth login-github-copilot`
summary: Увійдіть у GitHub Copilot з OpenClaw за допомогою потоку авторизації через пристрій або неінтерактивного імпорту токена
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-27T04:01:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2ebcee41d4a3fffff8f20072e99e6dbb57baa2d9ec7eddad1d426ee37805597c
    source_path: providers/github-copilot.md
    workflow: 15
---

GitHub Copilot — це ШІ-помічник GitHub для програмування. Він надає доступ до моделей Copilot для вашого облікового запису GitHub і тарифного плану. OpenClaw може використовувати Copilot як постачальника моделі двома різними способами.

## Два способи використання Copilot в OpenClaw

<Tabs>
  <Tab title="Built-in provider (github-copilot)">
    Використовуйте нативний потік входу через пристрій, щоб отримати токен GitHub, а потім обмінювати його на токени API Copilot під час роботи OpenClaw. Це **типовий** і найпростіший шлях, оскільки він не потребує VS Code.

    <Steps>
      <Step title="Виконайте команду входу">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Вам буде запропоновано перейти за URL-адресою та ввести одноразовий код. Тримайте
        термінал відкритим, доки процес не завершиться.
      </Step>
      <Step title="Установіть типову модель">
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
    Використовуйте розширення VS Code **Copilot Proxy** як локальний міст. OpenClaw взаємодіє з
    кінцевою точкою `/v1` проксі та використовує список моделей, який ви там налаштуєте.

    <Note>
    Вибирайте цей варіант, якщо ви вже запускаєте Copilot Proxy у VS Code або вам потрібно маршрутизувати
    через нього. Ви повинні ввімкнути Plugin і підтримувати роботу розширення VS Code.
    </Note>

  </Tab>
</Tabs>

## Необов’язкові прапорці

| Flag            | Description                                         |
| --------------- | --------------------------------------------------- |
| `--yes`         | Пропустити запит на підтвердження                   |
| `--set-default` | Також застосувати рекомендовану типову модель постачальника |

```bash
# Пропустити підтвердження
openclaw models auth login-github-copilot --yes

# Увійти та встановити типову модель за один крок
openclaw models auth login --provider github-copilot --method device --set-default
```

## Неінтерактивне налаштування

Якщо у вас уже є токен доступу GitHub OAuth для Copilot, імпортуйте його під час
налаштування без інтерфейсу за допомогою `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

Ви також можете не вказувати `--auth-choice`; передавання `--github-copilot-token` визначає
вибір автентифікації постачальника GitHub Copilot. Якщо прапорець не вказано, налаштування
повертається до `COPILOT_GITHUB_TOKEN`, потім `GH_TOKEN`, а далі `GITHUB_TOKEN`. Використовуйте
`--secret-input-mode ref` із заданим `COPILOT_GITHUB_TOKEN`, щоб зберегти env-backed
`tokenRef` замість відкритого тексту в `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="Потрібен інтерактивний TTY">
    Потік входу через пристрій вимагає інтерактивного TTY. Запускайте його безпосередньо в
    терміналі, а не в неінтерактивному скрипті чи конвеєрі CI.
  </Accordion>

  <Accordion title="Доступність моделей залежить від вашого тарифного плану">
    Доступність моделей Copilot залежить від вашого тарифного плану GitHub. Якщо модель
    відхиляється, спробуйте інший ID (наприклад, `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Вибір транспорту">
    Ідентифікатори моделей Claude автоматично використовують транспорт Anthropic Messages. Моделі GPT,
    o-series і Gemini зберігають транспорт OpenAI Responses. OpenClaw
    вибирає правильний транспорт на основі посилання на модель.
  </Accordion>

  <Accordion title="Сумісність запитів">
    OpenClaw надсилає заголовки запитів у стилі Copilot IDE на транспортах Copilot,
    зокрема для вбудованої Compaction, результатів інструментів і наступних ходів із зображеннями. Він
    не вмикає продовження Responses на рівні постачальника для Copilot, якщо
    таку поведінку не було перевірено на API Copilot.
  </Accordion>

  <Accordion title="Порядок визначення змінних середовища">
    OpenClaw визначає автентифікацію Copilot зі змінних середовища в такому
    порядку пріоритету:

    | Priority | Variable              | Notes                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | Найвищий пріоритет, специфічно для Copilot |
    | 2        | `GH_TOKEN`            | Токен GitHub CLI (резервний варіант)      |
    | 3        | `GITHUB_TOKEN`        | Стандартний токен GitHub (найнижчий пріоритет)   |

    Коли встановлено кілька змінних, OpenClaw використовує ту, що має найвищий пріоритет.
    Потік входу через пристрій (`openclaw models auth login-github-copilot`) зберігає
    свій токен у сховищі профілів автентифікації та має пріоритет над усіма змінними
    середовища.

  </Accordion>

  <Accordion title="Зберігання токена">
    Вхід зберігає токен GitHub у сховищі профілів автентифікації та обмінює його
    на токен API Copilot під час роботи OpenClaw. Вам не потрібно керувати
    токеном вручну.
  </Accordion>
</AccordionGroup>

<Warning>
Команда входу через пристрій вимагає інтерактивного TTY. Використовуйте неінтерактивне
налаштування, коли вам потрібне налаштування без інтерфейсу.
</Warning>

## Вбудовування для пошуку в пам’яті

GitHub Copilot також може слугувати постачальником вбудовувань для
[пошуку в пам’яті](/uk/concepts/memory-search). Якщо у вас є передплата Copilot і
ви ввійшли в систему, OpenClaw може використовувати його для вбудовувань без окремого ключа API.

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
        // Необов’язково: перевизначити автоматично виявлену модель
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Як це працює

1. OpenClaw визначає ваш токен GitHub (зі змінних середовища або профілю автентифікації).
2. Обмінює його на короткоживучий токен API Copilot.
3. Виконує запит до кінцевої точки Copilot `/models`, щоб виявити доступні моделі вбудовувань.
4. Вибирає найкращу модель (надає перевагу `text-embedding-3-small`).
5. Надсилає запити на вбудовування до кінцевої точки Copilot `/embeddings`.

Доступність моделей залежить від вашого тарифного плану GitHub. Якщо жодні моделі вбудовувань недоступні,
OpenClaw пропускає Copilot і переходить до наступного постачальника.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки перемикання при відмові.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Докладно про автентифікацію та правила повторного використання облікових даних.
  </Card>
</CardGroup>
