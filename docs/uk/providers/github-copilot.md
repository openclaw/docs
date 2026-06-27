---
read_when:
    - Ви хочете використовувати GitHub Copilot як постачальника моделей
    - Вам потрібен процес `openclaw models auth login-github-copilot`
    - Ви обираєте між вбудованим провайдером Copilot, harness Copilot SDK і Copilot Proxy
summary: Увійдіть у GitHub Copilot з OpenClaw за допомогою потоку пристрою або неінтерактивного імпорту токена
title: GitHub Copilot
x-i18n:
    generated_at: "2026-06-27T18:10:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0cd7103ec880592b1f4506ed844abe788f53040f3751e7034daf9aafedc2f94
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot — це AI-асистент GitHub для програмування. Він надає доступ до моделей Copilot
для вашого облікового запису та плану GitHub. OpenClaw може використовувати Copilot як провайдера
моделей або середовище виконання агента трьома різними способами.

## Три способи використання Copilot в OpenClaw

<Tabs>
  <Tab title="Вбудований провайдер (github-copilot)">
    Використайте нативний потік входу з пристрою, щоб отримати токен GitHub, а потім обмінюйте його на
    API-токени Copilot під час роботи OpenClaw. Це **типовий** і найпростіший шлях,
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

  <Tab title="Plugin обв’язки Copilot SDK (copilot)">
    Установіть зовнішній Plugin `@openclaw/copilot`, якщо потрібно, щоб GitHub
    Copilot CLI та SDK керували низькорівневим циклом агента для вибраних
    моделей `github-copilot/*`.

    ```bash
    openclaw plugins install clawhub:@openclaw/copilot
    ```

    Потім увімкніть середовище виконання для моделі або провайдера:

    ```json5
    {
      agents: {
        defaults: {
          model: "github-copilot/gpt-5.5",
          models: {
            "github-copilot/gpt-5.5": {
              agentRuntime: { id: "copilot" },
            },
          },
        },
      },
    }
    ```

    Обирайте це, коли потрібні нативні сеанси Copilot CLI, стан потоків,
    керований SDK, і Compaction, якою керує Copilot, для цих ходів агента. Див.
    [обв’язку Copilot SDK](/uk/plugins/copilot), щоб отримати повний контракт середовища виконання.

  </Tab>

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Використовуйте розширення VS Code **Copilot Proxy** як локальний міст. OpenClaw звертається до
    endpoint проксі `/v1` і використовує список моделей, який ви налаштовуєте там.

    <Note>
    Обирайте це, якщо ви вже запускаєте Copilot Proxy у VS Code або маєте маршрутизувати
    через нього. Потрібно увімкнути Plugin і тримати розширення VS Code запущеним.
    </Note>

  </Tab>
</Tabs>

## Необов’язкові прапорці

| Прапорець       | Опис                                                |
| --------------- | --------------------------------------------------- |
| `--yes`         | Пропустити запит підтвердження                      |
| `--set-default` | Також застосувати рекомендовану типову модель провайдера |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## Неінтерактивний онбординг

Якщо у вас уже є токен доступу GitHub OAuth для Copilot, імпортуйте його під час
налаштування без інтерфейсу за допомогою `openclaw onboard --non-interactive`:

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

Також можна опустити `--auth-choice`; передавання `--github-copilot-token` виводить
вибір автентифікації провайдера GitHub Copilot. Якщо прапорець пропущено, онбординг
повертається до `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, а потім `GITHUB_TOKEN`. Використовуйте
`--secret-input-mode ref` з установленим `COPILOT_GITHUB_TOKEN`, щоб зберегти підкріплений змінною середовища
`tokenRef` замість відкритого тексту в `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="Потрібен інтерактивний TTY">
    Потік входу з пристрою потребує інтерактивного TTY. Запускайте його безпосередньо в
    терміналі, а не в неінтерактивному скрипті чи CI-конвеєрі.
  </Accordion>

  <Accordion title="Доступність моделей залежить від вашого плану">
    Доступність моделей Copilot залежить від вашого плану GitHub. Якщо модель
    відхилено, спробуйте інший ID (наприклад `github-copilot/gpt-5.5`). Див.
    [підтримувані моделі GitHub для кожного плану Copilot](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)
    для поточного списку моделей.
  </Accordion>

  <Accordion title="Живе оновлення каталогу з API Copilot">
    Щойно шлях автентифікації через вхід з пристрою (або змінну середовища) розв’язав токен GitHub,
    OpenClaw оновлює каталог моделей на вимогу з `${baseUrl}/models`
    (того самого endpoint, який використовує VS Code Copilot), щоб середовище виконання відстежувало
    права доступу для конкретного облікового запису та точні контекстні вікна без
    змін маніфесту. Нові опубліковані моделі Copilot стають видимими без
    оновлення OpenClaw, а контекстні вікна відображають реальні обмеження для кожної моделі
    (наприклад, 400k для серії gpt-5.x, 1M для внутрішніх
    варіантів `claude-opus-*-1m`).

    Вбудований статичний каталог лишається видимим резервним варіантом, коли виявлення
    вимкнено, у користувача немає профілю автентифікації GitHub, обмін токена
    зазнає невдачі або HTTPS-виклик `/models` завершується помилкою. Щоб відмовитися й повністю покладатися
    на статичний каталог маніфесту (офлайн-сценарії / ізольовані середовища):

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
    OpenClaw надсилає заголовки запитів у стилі Copilot IDE через транспорти Copilot,
    зокрема для вбудованої Compaction, результатів інструментів і подальших ходів із зображеннями. Він
    не вмикає продовження Responses на рівні провайдера для Copilot, якщо
    таку поведінку не перевірено з API Copilot.
  </Accordion>

  <Accordion title="Порядок розв’язання змінних середовища">
    OpenClaw розв’язує автентифікацію Copilot зі змінних середовища в такому
    порядку пріоритету:

    | Пріоритет | Змінна                | Примітки                         |
    | --------- | --------------------- | -------------------------------- |
    | 1         | `COPILOT_GITHUB_TOKEN` | Найвищий пріоритет, специфічно для Copilot |
    | 2         | `GH_TOKEN`            | Токен GitHub CLI (резервний)     |
    | 3         | `GITHUB_TOKEN`        | Стандартний токен GitHub (найнижчий) |

    Коли встановлено кілька змінних, OpenClaw використовує змінну з найвищим пріоритетом.
    Потік входу з пристрою (`openclaw models auth login-github-copilot`) зберігає
    свій токен у сховищі профілів автентифікації та має перевагу над усіма змінними
    середовища.

  </Accordion>

  <Accordion title="Зберігання токенів">
    Вхід зберігає токен GitHub у сховищі профілів автентифікації та обмінює його
    на API-токен Copilot, коли працює OpenClaw. Вам не потрібно керувати
    токеном вручну.
  </Accordion>
</AccordionGroup>

<Warning>
Команда входу з пристрою потребує інтерактивного TTY. Використовуйте неінтерактивний
онбординг, коли потрібне налаштування без інтерфейсу.
</Warning>

## Вбудовування для пошуку в пам’яті

GitHub Copilot також може слугувати провайдером вбудовувань для
[пошуку в пам’яті](/uk/concepts/memory-search). Якщо у вас є підписка Copilot і
ви ввійшли в систему, OpenClaw може використовувати його для вбудовувань без окремого API-ключа.

### Конфігурація

Установіть `memorySearch.provider` явно, щоб використовувати вбудовування GitHub Copilot. Якщо
токен GitHub доступний, OpenClaw виявляє доступні моделі вбудовувань з
API Copilot і автоматично вибирає найкращу.

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
2. Обмінює його на короткочасний API-токен Copilot.
3. Опитує endpoint Copilot `/models`, щоб виявити доступні моделі вбудовувань.
4. Вибирає найкращу модель (віддає перевагу `text-embedding-3-small`).
5. Надсилає запити на вбудовування до endpoint Copilot `/embeddings`.

Доступність моделей залежить від вашого плану GitHub. Якщо моделі вбудовувань
недоступні, OpenClaw пропускає Copilot і пробує наступного провайдера.

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделей" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки перемикання після збою.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Відомості про автентифікацію та правила повторного використання облікових даних.
  </Card>
</CardGroup>
