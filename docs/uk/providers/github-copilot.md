---
read_when:
    - Ви хочете використовувати GitHub Copilot як постачальника моделей
    - Вам потрібен потік `openclaw models auth login-github-copilot`
summary: Увійдіть у GitHub Copilot з OpenClaw за допомогою потоку пристрою або неінтерактивного імпорту токена
title: GitHub Copilot
x-i18n:
    generated_at: "2026-05-11T20:54:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 32268f86bc3e9d4f4d09d105c78c0fc9527aaebd8251865899711e86b25391e5
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot — це AI-асистент GitHub для кодування. Він надає доступ до моделей Copilot
для вашого облікового запису й плану GitHub. OpenClaw може використовувати Copilot як постачальника
моделей двома різними способами.

## Два способи використовувати Copilot в OpenClaw

<Tabs>
  <Tab title="Вбудований постачальник (github-copilot)">
    Використовуйте нативний потік входу з пристрою, щоб отримати токен GitHub, а потім обмінюйте його на
    токени Copilot API під час запуску OpenClaw. Це **типовий** і найпростіший шлях,
    оскільки він не потребує VS Code.

    <Steps>
      <Step title="Запустіть команду входу">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Вам буде запропоновано відвідати URL і ввести одноразовий код. Тримайте
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

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Використовуйте розширення VS Code **Copilot Proxy** як локальний міст. OpenClaw звертається до
    кінцевої точки `/v1` проксі й використовує список моделей, який ви налаштували там.

    <Note>
    Виберіть це, якщо ви вже запускаєте Copilot Proxy у VS Code або вам потрібно маршрутизувати
    через нього. Ви маєте ввімкнути Plugin і тримати розширення VS Code запущеним.
    </Note>

  </Tab>
</Tabs>

## Необов’язкові прапорці

| Прапорець       | Опис                                                |
| --------------- | --------------------------------------------------- |
| `--yes`         | Пропустити запит підтвердження                      |
| `--set-default` | Також застосувати рекомендовану типову модель постачальника |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## Неінтерактивне початкове налаштування

Якщо у вас уже є токен доступу GitHub OAuth для Copilot, імпортуйте його під час
налаштування без інтерфейсу за допомогою `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

Ви також можете опустити `--auth-choice`; передавання `--github-copilot-token` визначає
вибір автентифікації постачальника GitHub Copilot. Якщо прапорець опущено, початкове налаштування
повертається до `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, а потім `GITHUB_TOKEN`. Використовуйте
`--secret-input-mode ref` з установленим `COPILOT_GITHUB_TOKEN`, щоб зберігати підкріплений змінною середовища
`tokenRef` замість відкритого тексту в `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="Потрібен інтерактивний TTY">
    Потік входу з пристрою потребує інтерактивного TTY. Запускайте його безпосередньо в
    терміналі, а не в неінтерактивному скрипті чи CI-конвеєрі.
  </Accordion>

  <Accordion title="Доступність моделей залежить від вашого плану">
    Доступність моделей Copilot залежить від вашого плану GitHub. Якщо модель
    відхилено, спробуйте інший ID (наприклад `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Оновлення живого каталогу з Copilot API">
    Щойно шлях автентифікації через вхід із пристрою (або змінну середовища) отримав токен GitHub,
    OpenClaw оновлює каталог моделей на вимогу з `${baseUrl}/models`
    (тієї самої кінцевої точки, яку використовує VS Code Copilot), щоб середовище виконання відстежувало
    права доступу для окремого облікового запису й точні вікна контексту без змін
    маніфесту. Новоопубліковані моделі Copilot стають видимими без оновлення OpenClaw,
    а вікна контексту відображають реальні обмеження для кожної моделі
    (наприклад 400k для серії gpt-5.x, 1M для внутрішніх
    варіантів `claude-opus-*-1m`).

    Вбудований статичний каталог залишається видимим резервним варіантом, коли виявлення
    вимкнено, у користувача немає профілю автентифікації GitHub, обмін токена
    не вдається або HTTPS-виклик `/models` завершується помилкою. Щоб відмовитися й повністю покладатися
    на статичний каталог маніфесту (офлайн-сценарії або ізольовані середовища):

    ```json5
    {
      plugins: {
        entries: {
          "github-copilot": {
            config: { discovery: { enabled: false } },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Вибір транспорту">
    ID моделей Claude автоматично використовують транспорт Anthropic Messages. Моделі GPT,
    o-series і Gemini зберігають транспорт OpenAI Responses. OpenClaw
    вибирає правильний транспорт на основі посилання на модель.
  </Accordion>

  <Accordion title="Сумісність запитів">
    OpenClaw надсилає заголовки запитів у стилі Copilot IDE на транспортах Copilot,
    зокрема вбудовані ходи Compaction, результатів інструментів і подальших звернень із зображеннями. Він
    не вмикає продовження Responses на рівні постачальника для Copilot, якщо
    цю поведінку не було перевірено з API Copilot.
  </Accordion>

  <Accordion title="Порядок розв’язання змінних середовища">
    OpenClaw розв’язує автентифікацію Copilot зі змінних середовища в такому
    порядку пріоритету:

    | Пріоритет | Змінна               | Примітки                         |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | Найвищий пріоритет, специфічно для Copilot |
    | 2        | `GH_TOKEN`            | Токен GitHub CLI (резервний)     |
    | 3        | `GITHUB_TOKEN`        | Стандартний токен GitHub (найнижчий) |

    Коли встановлено кілька змінних, OpenClaw використовує змінну з найвищим пріоритетом.
    Потік входу з пристрою (`openclaw models auth login-github-copilot`) зберігає
    свій токен у сховищі профілів автентифікації та має пріоритет над усіма змінними
    середовища.

  </Accordion>

  <Accordion title="Зберігання токена">
    Вхід зберігає токен GitHub у сховищі профілів автентифікації та обмінює його
    на токен Copilot API під час запуску OpenClaw. Вам не потрібно керувати
    токеном вручну.
  </Accordion>
</AccordionGroup>

<Warning>
Команда входу з пристрою потребує інтерактивного TTY. Використовуйте неінтерактивне
початкове налаштування, коли потрібне налаштування без інтерфейсу.
</Warning>

## Ембеддинги пошуку пам’яті

GitHub Copilot також може працювати як постачальник ембеддингів для
[пошуку пам’яті](/uk/concepts/memory-search). Якщо у вас є підписка Copilot і
ви ввійшли в систему, OpenClaw може використовувати його для ембеддингів без окремого ключа API.

### Автовиявлення

Коли `memorySearch.provider` має значення `"auto"` (типово), GitHub Copilot перевіряється
з пріоритетом 15 -- після локальних ембеддингів, але перед OpenAI та іншими платними
постачальниками. Якщо токен GitHub доступний, OpenClaw виявляє доступні
моделі ембеддингів з Copilot API й автоматично вибирає найкращу.

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

1. OpenClaw розв’язує ваш токен GitHub (зі змінних середовища або профілю автентифікації).
2. Обмінює його на короткочасний токен Copilot API.
3. Запитує кінцеву точку Copilot `/models`, щоб виявити доступні моделі ембеддингів.
4. Вибирає найкращу модель (надає перевагу `text-embedding-3-small`).
5. Надсилає запити ембеддингів до кінцевої точки Copilot `/embeddings`.

Доступність моделей залежить від вашого плану GitHub. Якщо жодні моделі ембеддингів
недоступні, OpenClaw пропускає Copilot і пробує наступного постачальника.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір постачальників, посилань на моделі та поведінки відмовостійкого перемикання.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Подробиці автентифікації та правила повторного використання облікових даних.
  </Card>
</CardGroup>
