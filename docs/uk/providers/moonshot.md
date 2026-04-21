---
read_when:
    - Ви хочете налаштування Moonshot K2 (Moonshot Open Platform) і Kimi Coding окремо одне від одного.
    - Вам потрібно розуміти окремі кінцеві точки, ключі та посилання на моделі.
    - Вам потрібна конфігурація для копіювання/вставлення для будь-якого з провайдерів.
summary: Налаштуйте Moonshot K2 і Kimi Coding (окремі провайдери та ключі)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-21T02:12:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5a04b0c45d55dbf8d56a04a1811f0850b800842ea501b212d44b53ff0680b5a2
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

Moonshot надає API Kimi із кінцевими точками, сумісними з OpenAI. Налаштуйте
провайдера та встановіть модель за замовчуванням `moonshot/kimi-k2.6`, або використовуйте
Kimi Coding з `kimi/kimi-code`.

<Warning>
Moonshot і Kimi Coding — **окремі провайдери**. Ключі не є взаємозамінними, кінцеві точки відрізняються, як і посилання на моделі (`moonshot/...` проти `kimi/...`).
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

Вбудовані оцінки вартості для поточних моделей K2, розміщених на Moonshot, використовують
опубліковані Moonshot тарифи pay-as-you-go: Kimi K2.6 коштує $0.16/MTok за cache hit,
$0.95/MTok за вхід і $4.00/MTok за вивід; Kimi K2.5 — $0.10/MTok за cache hit,
$0.60/MTok за вхід і $3.00/MTok за вивід. Інші застарілі записи каталогу зберігають
нульові заглушки вартості, якщо ви не перевизначите їх у конфігурації.

## Початок роботи

Виберіть свого провайдера та виконайте кроки налаштування.

<Tabs>
  <Tab title="Moonshot API">
    **Найкраще підходить для:** моделей Kimi K2 через Moonshot Open Platform.

    <Steps>
      <Step title="Виберіть регіон вашої кінцевої точки">
        | Варіант автентифікації | Кінцева точка                 | Регіон          |
        | ---------------------- | ----------------------------- | --------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`  | Міжнародний     |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`  | Китай           |
      </Step>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Або для кінцевої точки Китаю:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Установіть модель за замовчуванням">
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
      <Step title="Переконайтеся, що моделі доступні">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Запустіть live smoke test">
        Використовуйте ізольований каталог стану, якщо хочете перевірити доступ до моделі та відстеження вартості
        без впливу на ваші звичайні сесії:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        Відповідь JSON має містити `provider: "moonshot"` і
        `model: "kimi-k2.6"`. Запис розшифровки помічника зберігає нормалізоване
        використання токенів, а також оцінену вартість у `usage.cost`, коли Moonshot повертає
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
    **Найкраще підходить для:** завдань, орієнтованих на код, через кінцеву точку Kimi Coding.

    <Note>
    Kimi Coding використовує інший API-ключ і префікс провайдера (`kimi/...`), ніж Moonshot (`moonshot/...`). Застаріле посилання на модель `kimi/k2p5` усе ще приймається як ідентифікатор сумісності.
    </Note>

    <Steps>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Установіть модель за замовчуванням">
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
      <Step title="Переконайтеся, що модель доступна">
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

OpenClaw також постачається з **Kimi** як провайдером `web_search`, що працює на базі
вебпошуку Moonshot.

<Steps>
  <Step title="Запустіть інтерактивне налаштування вебпошуку">
    ```bash
    openclaw configure --section web
    ```

    Виберіть **Kimi** у розділі вебпошуку, щоб зберегти
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Налаштуйте регіон вебпошуку та модель">
    Інтерактивне налаштування запитує:

    | Параметр            | Варіанти                                                             |
    | ------------------- | -------------------------------------------------------------------- |
    | Регіон API          | `https://api.moonshot.ai/v1` (міжнародний) або `https://api.moonshot.cn/v1` (Китай) |
    | Модель вебпошуку    | За замовчуванням `kimi-k2.6`                                         |

  </Step>
</Steps>

Конфігурація зберігається в `plugins.entries.moonshot.config.webSearch`:

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

## Додатково

<AccordionGroup>
  <Accordion title="Нативний режим міркування">
    Moonshot Kimi підтримує двійковий нативний режим міркування:

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

    OpenClaw також зіставляє рівні виконання `/think` для Moonshot:

    | Рівень `/think`      | Поведінка Moonshot         |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | Будь-який не-off рівень | `thinking.type=enabled` |

    <Warning>
    Коли в Moonshot увімкнено режим міркування, `tool_choice` має бути `auto` або `none`. OpenClaw нормалізує несумісні значення `tool_choice` до `auto` для сумісності.
    </Warning>

    Kimi K2.6 також приймає необов’язкове поле `thinking.keep`, яке керує
    багатокроковим збереженням `reasoning_content`. Установіть `"all"`, щоб зберігати повне
    міркування між кроками; не вказуйте його (або залиште `null`), щоб використовувати
    серверну стратегію за замовчуванням. OpenClaw передає `thinking.keep` лише для
    `moonshot/kimi-k2.6` і видаляє його для інших моделей.

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

  <Accordion title="Сумісність потокового використання">
    Нативні кінцеві точки Moonshot (`https://api.moonshot.ai/v1` і
    `https://api.moonshot.cn/v1`) заявляють про сумісність потокового використання на
    спільному транспорті `openai-completions`. OpenClaw визначає це за можливостями кінцевої точки,
    тому сумісні користувацькі ідентифікатори провайдерів, націлені на ті самі нативні
    хости Moonshot, успадковують таку саму поведінку потокового використання.

    Із вбудованими тарифами K2.6 поточне використання, яке включає токени введення, виведення
    та читання кешу, також перетворюється на локальну оцінену вартість у USD для
    `/status`, `/usage full`, `/usage cost` і обліку сесій на основі розшифровок.

  </Accordion>

  <Accordion title="Довідка щодо кінцевих точок і посилань на моделі">
    | Провайдер    | Префікс посилання на модель | Кінцева точка                | Змінна середовища для автентифікації |
    | ------------ | --------------------------- | ---------------------------- | ------------------------------------ |
    | Moonshot     | `moonshot/`                 | `https://api.moonshot.ai/v1` | `MOONSHOT_API_KEY`                   |
    | Moonshot CN  | `moonshot/`                 | `https://api.moonshot.cn/v1` | `MOONSHOT_API_KEY`                   |
    | Kimi Coding  | `kimi/`                     | Кінцева точка Kimi Coding    | `KIMI_API_KEY`                       |
    | Вебпошук     | N/A                         | Та сама, що й регіон Moonshot API | `KIMI_API_KEY` або `MOONSHOT_API_KEY` |

    - Вебпошук Kimi використовує `KIMI_API_KEY` або `MOONSHOT_API_KEY` і за замовчуванням працює з `https://api.moonshot.ai/v1` та моделлю `kimi-k2.6`.
    - За потреби перевизначте метадані ціноутворення й контексту в `models.providers`.
    - Якщо Moonshot опублікує інші ліміти контексту для моделі, відповідно скоригуйте `contextWindow`.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки перемикання при відмові.
  </Card>
  <Card title="Вебпошук" href="/tools/web-search" icon="magnifying-glass">
    Налаштування провайдерів вебпошуку, зокрема Kimi.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації для провайдерів, моделей і plugins.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Керування API-ключами Moonshot і документація.
  </Card>
</CardGroup>
