---
read_when:
    - Ви хочете налаштувати Moonshot K2 (Moonshot Open Platform) та Kimi Coding окремо
    - Вам потрібно зрозуміти окремі кінцеві точки, ключі та посилання моделей
    - Ви хочете готову конфігурацію для копіювання для будь-якого provider
summary: Налаштування Moonshot K2 і Kimi Coding (окремі provider і ключі)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-24T18:13:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: fd6ababe59354a302975b68f4cdb12a623647f8e5cadfb8ae58a74bb2934ce65
    source_path: providers/moonshot.md
    workflow: 15
---

Moonshot надає API Kimi з кінцевими точками, сумісними з OpenAI. Налаштуйте
provider і встановіть типову модель `moonshot/kimi-k2.6`, або використовуйте
Kimi Coding з `kimi/kimi-code`.

<Warning>
Moonshot і Kimi Coding — **окремі provider**. Ключі не є взаємозамінними, кінцеві точки відрізняються, і посилання моделей також відрізняються (`moonshot/...` проти `kimi/...`).
</Warning>

## Вбудований каталог моделей

[//]: # "moonshot-kimi-k2-ids:start"

| Model ref                         | Назва                  | Міркування | Вхід        | Контекст | Макс. вивід |
| --------------------------------- | ---------------------- | ---------- | ----------- | -------- | ----------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Ні         | text, image | 262,144  | 262,144     |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Ні         | text, image | 262,144  | 262,144     |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Так        | text        | 262,144  | 262,144     |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Так        | text        | 262,144  | 262,144     |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Ні         | text        | 256,000  | 16,384      |

[//]: # "moonshot-kimi-k2-ids:end"

Вбудовані оцінки вартості для поточних моделей K2, що хостяться Moonshot, використовують
опубліковані тарифи Moonshot з оплатою за використання: Kimi K2.6 коштує $0.16/MTok за cache hit,
$0.95/MTok за вхід і $4.00/MTok за вивід; Kimi K2.5 коштує $0.10/MTok за cache hit,
$0.60/MTok за вхід і $3.00/MTok за вивід. Для інших застарілих записів каталогу
залишаються нульові заповнювачі вартості, якщо ви не перевизначите їх у config.

## Початок роботи

Виберіть свого provider і виконайте кроки налаштування.

<Tabs>
  <Tab title="Moonshot API">
    **Найкраще для:** моделей Kimi K2 через Moonshot Open Platform.

    <Steps>
      <Step title="Choose your endpoint region">
        | Варіант автентифікації | Endpoint                       | Регіон         |
        | ---------------------- | ------------------------------ | -------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | Міжнародний    |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | Китай          |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Або для endpoint Китаю:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Set a default model">
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
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Run a live smoke test">
        Використовуйте ізольований каталог стану, якщо хочете перевірити доступ до моделі та
        відстеження вартості, не торкаючись ваших звичайних сесій:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        У відповіді JSON має бути вказано `provider: "moonshot"` і
        `model: "kimi-k2.6"`. Запис стенограми асистента зберігає нормалізоване
        використання токенів, а також оцінену вартість у `usage.cost`, коли Moonshot повертає
        метадані використання.
      </Step>
    </Steps>

    ### Приклад config

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
    **Найкраще для:** задач, орієнтованих на код, через endpoint Kimi Coding.

    <Note>
    Kimi Coding використовує інший API-ключ і префікс provider (`kimi/...`), ніж Moonshot (`moonshot/...`). Застаріле посилання моделі `kimi/k2p5` усе ще приймається як id сумісності.
    </Note>

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-code" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### Приклад config

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: {
            "kimi/kimi-code": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Вебпошук Kimi

OpenClaw також постачається з **Kimi** як provider `web_search`, що працює на базі вебпошуку Moonshot.

<Steps>
  <Step title="Run interactive web search setup">
    ```bash
    openclaw configure --section web
    ```

    Виберіть **Kimi** у розділі вебпошуку, щоб зберегти
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Configure the web search region and model">
    Інтерактивне налаштування запитує:

    | Налаштування       | Варіанти                                                             |
    | ------------------ | -------------------------------------------------------------------- |
    | Регіон API         | `https://api.moonshot.ai/v1` (міжнародний) або `https://api.moonshot.cn/v1` (Китай) |
    | Модель вебпошуку   | Типово `kimi-k2.6`                                                   |

  </Step>
</Steps>

Config зберігається в `plugins.entries.moonshot.config.webSearch`:

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // або використовуйте KIMI_API_KEY / MOONSHOT_API_KEY
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
  <Accordion title="Рідний режим thinking">
    Moonshot Kimi підтримує двійковий рідний режим thinking:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Налаштовуйте його для кожної моделі через `agents.defaults.models.<provider/model>.params`:

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

    OpenClaw також відображає рівні `/think` під час виконання для Moonshot:

    | Рівень `/think`    | Поведінка Moonshot         |
    | ------------------ | -------------------------- |
    | `/think off`       | `thinking.type=disabled`   |
    | Будь-який рівень, крім off | `thinking.type=enabled`    |

    <Warning>
    Коли thinking Moonshot увімкнено, `tool_choice` має бути `auto` або `none`. OpenClaw нормалізує несумісні значення `tool_choice` до `auto` для сумісності.
    </Warning>

    Kimi K2.6 також приймає необов’язкове поле `thinking.keep`, яке керує
    багатокроковим збереженням `reasoning_content`. Установіть `"all"`, щоб зберігати
    повне міркування між кроками; не вказуйте його (або залиште `null`), щоб використовувати
    стандартну стратегію сервера. OpenClaw передає `thinking.keep` лише для
    `moonshot/kimi-k2.6` і видаляє його з інших моделей.

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

  <Accordion title="Очищення id викликів інструментів">
    Moonshot Kimi обслуговує id `tool_call` у форматі `functions.<name>:<index>`. OpenClaw зберігає їх без змін, щоб багатокрокові виклики інструментів продовжували працювати.

    Щоб примусово ввімкнути суворе очищення для користувацького provider, сумісного з OpenAI, встановіть `sanitizeToolCallIds: true`:

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

  <Accordion title="Сумісність потокового використання">
    Власні endpoint Moonshot (`https://api.moonshot.ai/v1` і
    `https://api.moonshot.cn/v1`) декларують сумісність потокового використання на
    спільному транспорті `openai-completions`. OpenClaw визначає це за можливостями endpoint,
    тому сумісні користувацькі id provider, націлені на ті самі власні
    хости Moonshot, успадковують таку саму поведінку потокового використання.

    Завдяки вбудованому тарифу K2.6 потокове використання, яке містить токени
    введення, виведення та cache-read, також перетворюється на локально оцінену вартість у USD для
    `/status`, `/usage full`, `/usage cost` і обліку сесій на основі стенограм.

  </Accordion>

  <Accordion title="Довідник endpoint і model ref">
    | Provider    | Префікс model ref | Endpoint                      | Змінна середовища для auth |
    | ----------- | ----------------- | ----------------------------- | -------------------------- |
    | Moonshot    | `moonshot/`       | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`         |
    | Moonshot CN | `moonshot/`       | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`         |
    | Kimi Coding | `kimi/`           | endpoint Kimi Coding          | `KIMI_API_KEY`             |
    | Вебпошук    | N/A               | Те саме, що й регіон API Moonshot | `KIMI_API_KEY` або `MOONSHOT_API_KEY` |

    - Вебпошук Kimi використовує `KIMI_API_KEY` або `MOONSHOT_API_KEY` і типово має `https://api.moonshot.ai/v1` з моделлю `kimi-k2.6`.
    - За потреби перевизначайте метадані ціни й контексту в `models.providers`.
    - Якщо Moonshot опублікує інші межі контексту для моделі, відповідно скоригуйте `contextWindow`.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір provider, model ref і поведінки failover.
  </Card>
  <Card title="Вебпошук" href="/uk/tools/web" icon="magnifying-glass">
    Налаштування provider вебпошуку, зокрема Kimi.
  </Card>
  <Card title="Довідник з конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема config для provider, моделей і plugin.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Керування API-ключами Moonshot і документація.
  </Card>
</CardGroup>
