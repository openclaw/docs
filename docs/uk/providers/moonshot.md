---
read_when:
    - Ви хочете налаштувати Moonshot K2 (Moonshot Open Platform) порівняно з Kimi Coding
    - Вам потрібно зрозуміти окремі endpoint-и, key-і та посилання на моделі
    - Вам потрібен готовий до копіювання config для будь-якого з provider-ів
summary: Налаштування Moonshot K2 порівняно з Kimi Coding (окремі provider-и та key-і)
title: Moonshot AI
x-i18n:
    generated_at: "2026-04-23T21:06:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9f9b833110aebc47f9f1f832ade48a2f13b269abd72a7ea2766ffb3af449feb9
    source_path: providers/moonshot.md
    workflow: 15
---

# Moonshot AI (Kimi)

Moonshot надає Kimi API з OpenAI-compatible endpoint-ами. Налаштуйте
provider і задайте типову модель `moonshot/kimi-k2.6`, або використовуйте
Kimi Coding з `kimi/kimi-code`.

<Warning>
Moonshot і Kimi Coding — це **окремі provider-и**. Ключі не є взаємозамінними, endpoint-и відрізняються, як і посилання на моделі (`moonshot/...` проти `kimi/...`).
</Warning>

## Вбудований каталог моделей

[//]: # "moonshot-kimi-k2-ids:start"

| Посилання на модель              | Назва                  | Reasoning | Вхід        | Контекст | Макс. output |
| -------------------------------- | ---------------------- | --------- | ----------- | -------- | ------------ |
| `moonshot/kimi-k2.6`             | Kimi K2.6              | Ні        | text, image | 262,144  | 262,144      |
| `moonshot/kimi-k2.5`             | Kimi K2.5              | Ні        | text, image | 262,144  | 262,144      |
| `moonshot/kimi-k2-thinking`      | Kimi K2 Thinking       | Так       | text        | 262,144  | 262,144      |
| `moonshot/kimi-k2-thinking-turbo`| Kimi K2 Thinking Turbo | Так       | text        | 262,144  | 262,144      |
| `moonshot/kimi-k2-turbo`         | Kimi K2 Turbo          | Ні        | text        | 256,000  | 16,384       |

[//]: # "moonshot-kimi-k2-ids:end"

Bundled-оцінки вартості для поточних моделей K2, що розміщуються Moonshot, використовують
опубліковані тарифи Moonshot pay-as-you-go: для Kimi K2.6 це $0.16/MTok cache hit,
$0.95/MTok input і $4.00/MTok output; для Kimi K2.5 — $0.10/MTok cache hit,
$0.60/MTok input і $3.00/MTok output. Інші застарілі записи каталогу зберігають
zero-cost placeholder-и, якщо ви не перевизначите їх у config.

## Початок роботи

Виберіть свій provider і виконайте кроки налаштування.

<Tabs>
  <Tab title="Moonshot API">
    **Найкраще підходить для:** моделей Kimi K2 через Moonshot Open Platform.

    <Steps>
      <Step title="Виберіть регіон endpoint-а">
        | Варіант auth          | Endpoint                       | Регіон        |
        | --------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`    | `https://api.moonshot.ai/v1`   | Міжнародний   |
        | `moonshot-api-key-cn` | `https://api.moonshot.cn/v1`   | China         |
      </Step>
      <Step title="Запустіть onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Або для endpoint-а China:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Задайте типову модель">
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
        Використовуйте ізольований каталог стану, якщо хочете перевірити доступ до моделі та облік вартості,
        не зачіпаючи свої звичайні сесії:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        У JSON-відповіді має бути `provider: "moonshot"` і
        `model: "kimi-k2.6"`. Запис transcript assistant зберігає нормалізований
        usage token-ів і оцінену вартість у `usage.cost`, коли Moonshot повертає
        usage metadata.
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
    **Найкраще підходить для:** задач, орієнтованих на код, через endpoint Kimi Coding.

    <Note>
    Kimi Coding використовує інший API key і префікс provider-а (`kimi/...`), ніж Moonshot (`moonshot/...`). Застаріле посилання на модель `kimi/k2p5` усе ще приймається як ID сумісності.
    </Note>

    <Steps>
      <Step title="Запустіть onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Задайте типову модель">
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

OpenClaw також постачається з **Kimi** як provider-ом `web_search`, який працює на основі вебпошуку Moonshot.

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

    | Налаштування       | Варіанти                                                             |
    | ------------------ | -------------------------------------------------------------------- |
    | Регіон API         | `https://api.moonshot.ai/v1` (міжнародний) або `https://api.moonshot.cn/v1` (China) |
    | Модель вебпошуку   | За замовчуванням `kimi-k2.6`                                         |

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
  <Accordion title="Нативний режим thinking">
    Moonshot Kimi підтримує бінарний нативний thinking:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Налаштовуйте його для конкретної моделі через `agents.defaults.models.<provider/model>.params`:

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

    OpenClaw також зіставляє runtime-рівні `/think` для Moonshot:

    | Рівень `/think`     | Поведінка Moonshot         |
    | ------------------- | -------------------------- |
    | `/think off`        | `thinking.type=disabled`   |
    | Будь-який не-off рівень | `thinking.type=enabled` |

    <Warning>
    Коли для Moonshot увімкнено thinking, `tool_choice` має бути `auto` або `none`. OpenClaw нормалізує несумісні значення `tool_choice` до `auto` для сумісності.
    </Warning>

    Kimi K2.6 також приймає необов’язкове поле `thinking.keep`, яке керує
    збереженням `reasoning_content` між кількома turn-ами. Установіть його в `"all"`, щоб зберігати повний
    reasoning між turn-ами; не задавайте його (або залиште `null`), щоб використовувати
    типову стратегію server-а. OpenClaw передає `thinking.keep` лише для
    `moonshot/kimi-k2.6` і прибирає його з інших моделей.

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

  <Accordion title="Санітизація id викликів tool">
    Moonshot Kimi повертає `tool_call` id у формі `functions.<name>:<index>`. OpenClaw зберігає їх без змін, щоб багатокрокові виклики tool продовжували працювати.

    Щоб примусово ввімкнути сувору санітизацію для власного OpenAI-compatible provider-а, задайте `sanitizeToolCallIds: true`:

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

  <Accordion title="Сумісність streaming usage">
    Нативні endpoint-и Moonshot (`https://api.moonshot.ai/v1` і
    `https://api.moonshot.cn/v1`) повідомляють про сумісність streaming usage на
    спільному transport `openai-completions`. OpenClaw прив’язує це до можливостей endpoint-а,
    тому сумісні власні ID provider-ів, що вказують на ті самі нативні хости
    Moonshot, успадковують ту саму поведінку streaming-usage.

    З bundled-цінами K2.6 streamed usage, що включає input, output
    і cache-read token-и, також перетворюється в локальну оцінку вартості в USD для `/status`, `/usage full`, `/usage cost` і обліку сесій на основі transcript.

  </Accordion>

  <Accordion title="Довідник endpoint-ів і посилань на моделі">
    | Provider     | Префікс посилання на модель | Endpoint                     | Auth env var       |
    | ------------ | --------------------------- | ---------------------------- | ------------------ |
    | Moonshot     | `moonshot/`                 | `https://api.moonshot.ai/v1` | `MOONSHOT_API_KEY` |
    | Moonshot CN  | `moonshot/`                 | `https://api.moonshot.cn/v1` | `MOONSHOT_API_KEY` |
    | Kimi Coding  | `kimi/`                     | endpoint Kimi Coding         | `KIMI_API_KEY`     |
    | Web search   | N/A                         | Те саме, що й регіон Moonshot API | `KIMI_API_KEY` або `MOONSHOT_API_KEY` |

    - Вебпошук Kimi використовує `KIMI_API_KEY` або `MOONSHOT_API_KEY`, а за замовчуванням — `https://api.moonshot.ai/v1` з моделлю `kimi-k2.6`.
    - За потреби перевизначайте metadata ціноутворення й контексту в `models.providers`.
    - Якщо Moonshot публікує інші обмеження контексту для моделі, відповідно змініть `contextWindow`.

  </Accordion>
</AccordionGroup>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Model selection" href="/uk/concepts/model-providers" icon="layers">
    Вибір provider-ів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Web search" href="/uk/tools/web" icon="magnifying-glass">
    Налаштування provider-ів вебпошуку, зокрема Kimi.
  </Card>
  <Card title="Configuration reference" href="/uk/gateway/configuration-reference" icon="gear">
    Повна schema config для provider-ів, моделей і Plugin-ів.
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Керування API key Moonshot і документація.
  </Card>
</CardGroup>
