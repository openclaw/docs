---
read_when:
    - Вам потрібне налаштування Moonshot K2 (Moonshot Open Platform), а не Kimi Coding
    - Потрібно розуміти окремі кінцеві точки, ключі та посилання на моделі
    - Вам потрібна конфігурація для копіювання та вставлення для будь-якого з провайдерів
summary: Налаштування Moonshot K2 і Kimi Coding (окремі провайдери + ключі)
title: Moonshot AI
x-i18n:
    generated_at: "2026-05-11T20:55:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0f6396d91ac8c1f698531ce067f79d4a4de7a5c7a166099c0fe4b7e5b78fde9e
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot надає Kimi API з OpenAI-сумісними кінцевими точками. Налаштуйте
провайдера й установіть стандартну модель на `moonshot/kimi-k2.6` або використовуйте
Kimi Coding з `kimi/kimi-for-coding`.

<Warning>
Moonshot і Kimi Coding — це **окремі провайдери**. Ключі не є взаємозамінними, кінцеві точки відрізняються, а посилання на моделі різні (`moonshot/...` проти `kimi/...`).
</Warning>

## Вбудований каталог моделей

[//]: # "moonshot-kimi-k2-ids:start"

| Посилання на модель               | Назва                  | Міркування | Ввід        | Контекст | Макс. вивід |
| --------------------------------- | ---------------------- | ---------- | ----------- | -------- | ----------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Ні         | text, image | 262,144  | 262,144     |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Ні         | text, image | 262,144  | 262,144     |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Так        | text        | 262,144  | 262,144     |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Так        | text        | 262,144  | 262,144     |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Ні         | text        | 256,000  | 16,384      |

[//]: # "moonshot-kimi-k2-ids:end"

Пакетні оцінки вартості для поточних моделей K2, розміщених у Moonshot, використовують
опубліковані Moonshot тарифи оплати за використання: Kimi K2.6 коштує $0.16/MTok за cache hit,
$0.95/MTok за ввід і $4.00/MTok за вивід; Kimi K2.5 коштує $0.10/MTok за cache hit,
$0.60/MTok за ввід і $3.00/MTok за вивід. Інші застарілі записи каталогу зберігають
заповнювачі з нульовою вартістю, якщо ви не перевизначите їх у конфігурації.

## Початок роботи

Виберіть свого провайдера та виконайте кроки налаштування.

<Tabs>
  <Tab title="Moonshot API">
    **Найкраще для:** моделей Kimi K2 через Moonshot Open Platform.

    <Steps>
      <Step title="Виберіть регіон кінцевої точки">
        | Вибір автентифікації | Кінцева точка                 | Регіон         |
        | --------------------- | ----------------------------- | -------------- |
        | `moonshot-api-key`    | `https://api.moonshot.ai/v1`  | Міжнародний    |
        | `moonshot-api-key-cn` | `https://api.moonshot.cn/v1`  | Китай          |
      </Step>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Або для кінцевої точки в Китаї:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Установіть стандартну модель">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="Перевірте, що моделі доступні">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Запустіть живий smoke-тест">
        Використовуйте ізольований каталог стану, коли хочете перевірити доступ до моделі й відстеження
        вартості, не торкаючись своїх звичайних сесій:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        JSON-відповідь має повідомити `provider: "moonshot"` і
        `model: "kimi-k2.6"`. Запис транскрипту асистента зберігає нормалізоване
        використання токенів плюс оцінену вартість у `usage.cost`, коли Moonshot повертає
        метадані використання.
      </Step>
    </Steps>

    ### Приклад конфігурації

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **Найкраще для:** задач, орієнтованих на код, через кінцеву точку Kimi Coding.

    <Note>
    Kimi Coding використовує інший API-ключ і префікс провайдера (`kimi/...`), ніж Moonshot (`moonshot/...`). Стабільне посилання на модель API — `kimi/kimi-for-coding`; застарілі посилання `kimi/kimi-code` і `kimi/k2p5` залишаються прийнятними й нормалізуються до цього ID моделі API.
    </Note>

    <Steps>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Установіть стандартну модель">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-for-coding" },
            },
          },
        }
        ```
      </Step>
      <Step title="Перевірте, що модель доступна">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### Приклад конфігурації

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: {
            "kimi/kimi-for-coding": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Вебпошук Kimi

OpenClaw також постачає **Kimi** як провайдера `web_search` на основі вебпошуку
Moonshot.

<Steps>
  <Step title="Запустіть інтерактивне налаштування вебпошуку">
    ```bash
    openclaw configure --section web
    ```

    Виберіть **Kimi** у розділі вебпошуку, щоб зберегти
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Налаштуйте регіон і модель вебпошуку">
    Інтерактивне налаштування запитує:

    | Налаштування       | Варіанти                                                             |
    | ------------------ | -------------------------------------------------------------------- |
    | Регіон API         | `https://api.moonshot.ai/v1` (міжнародний) або `https://api.moonshot.cn/v1` (Китай) |
    | Модель вебпошуку   | За замовчуванням `kimi-k2.6`                                        |

  </Step>
</Steps>

Конфігурація міститься в `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // or use KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Нативний режим міркування">
    Moonshot Kimi підтримує бінарне нативне міркування:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Налаштуйте його для кожної моделі через `agents.defaults.models.<provider/model>.params`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw також зіставляє рівні `/think` під час виконання для Moonshot:

    | Рівень `/think`    | Поведінка Moonshot        |
    | ------------------ | ------------------------- |
    | `/think off`       | `thinking.type=disabled`  |
    | Будь-який рівень не off | `thinking.type=enabled` |

    <Warning>
    Коли мислення Moonshot увімкнено, `tool_choice` має бути `auto` або `none`. OpenClaw нормалізує несумісні значення `tool_choice` до `auto` для сумісності.
    </Warning>

    Kimi K2.6 також приймає необов’язкове поле `thinking.keep`, яке керує
    багатокроковим збереженням `reasoning_content`. Установіть його на `"all"`, щоб зберігати повне
    міркування між ходами; пропустіть його (або залиште `null`), щоб використовувати серверну
    стратегію за замовчуванням. OpenClaw передає `thinking.keep` лише для
    `moonshot/kimi-k2.6` і вилучає його з інших моделей.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Санітизація ID виклику інструмента">
    Moonshot Kimi обслуговує ID tool_call у форматі `functions.<name>:<index>`. OpenClaw зберігає їх без змін, щоб багатокрокові виклики інструментів продовжували працювати.

    Щоб примусово ввімкнути сувору санітизацію для власного OpenAI-сумісного провайдера, установіть `sanitizeToolCallIds: true`:

    ```json5
    {
      models: {
        providers: {
          "my-kimi-proxy": {
            api: "openai-completions",
            sanitizeToolCallIds: true,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Сумісність використання під час стримінгу">
    Нативні кінцеві точки Moonshot (`https://api.moonshot.ai/v1` і
    `https://api.moonshot.cn/v1`) оголошують сумісність використання під час стримінгу на
    спільному транспорті `openai-completions`. OpenClaw визначає це за можливостями
    кінцевої точки, тому сумісні власні ID провайдерів, що спрямовані на ті самі нативні
    хости Moonshot, успадковують таку саму поведінку використання під час стримінгу.

    З пакетною ціною K2.6 стримінгове використання, яке включає токени вводу, виводу
    та cache-read, також перетворюється на локально оцінену вартість у USD для
    `/status`, `/usage full`, `/usage cost` і обліку сесій на основі транскриптів.

  </Accordion>

  <Accordion title="Довідник кінцевих точок і посилань на моделі">
    | Провайдер   | Префікс посилання на модель | Кінцева точка                      | Змінна середовища автентифікації        |
    | ---------- | ---------------- | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`      | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`      | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`          | Кінцева точка Kimi Coding          | `KIMI_API_KEY`      |
    | Вебпошук | N/A              | Та сама, що й регіон Moonshot API   | `KIMI_API_KEY` або `MOONSHOT_API_KEY` |

    - Вебпошук Kimi використовує `KIMI_API_KEY` або `MOONSHOT_API_KEY` і за замовчуванням застосовує `https://api.moonshot.ai/v1` з моделлю `kimi-k2.6`.
    - За потреби перевизначте ціни й метадані контексту в `models.providers`.
    - Якщо Moonshot публікує інші обмеження контексту для моделі, відповідно налаштуйте `contextWindow`.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки відмовостійкого перемикання.
  </Card>
  <Card title="Вебпошук" href="/uk/tools/web" icon="magnifying-glass">
    Налаштування провайдерів вебпошуку, зокрема Kimi.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації для провайдерів, моделей і plugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Керування ключами Moonshot API та документація.
  </Card>
</CardGroup>
