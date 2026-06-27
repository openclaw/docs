---
read_when:
    - Вам потрібне налаштування Moonshot K2 (Moonshot Open Platform) чи Kimi Coding
    - Потрібно розуміти окремі кінцеві точки, ключі та посилання на моделі.
    - Вам потрібна готова конфігурація для копіювання й вставлення для будь-якого з двох провайдерів
summary: Налаштувати Moonshot K2 порівняно з Kimi Coding (окремі провайдери + ключі)
title: Moonshot AI
x-i18n:
    generated_at: "2026-06-27T18:12:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e7365d7e843275750824a937553dcf535245146fb49fe00c622bf14b71d2dd17
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot надає Kimi API з OpenAI-сумісними кінцевими точками. Налаштуйте
provider і задайте модель за замовчуванням як `moonshot/kimi-k2.6` або використовуйте
Kimi Coding з `kimi/kimi-for-coding`.

<Warning>
Moonshot і Kimi Coding — це **окремі providers**. Ключі не є взаємозамінними, кінцеві точки відрізняються, і посилання на моделі відрізняються (`moonshot/...` проти `kimi/...`).
</Warning>

## Вбудований каталог моделей

[//]: # "moonshot-kimi-k2-ids:start"

| Посилання на модель               | Назва                  | Міркування | Ввід        | Контекст | Макс. вивід |
| --------------------------------- | ---------------------- | ---------- | ----------- | -------- | ----------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Ні         | текст, image | 262,144 | 262,144     |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | Завжди увімкнено | текст, image | 262,144 | 262,144     |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Ні         | текст, image | 262,144 | 262,144     |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Так        | text        | 262,144  | 262,144     |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Так        | text        | 262,144  | 262,144     |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Ні         | text        | 256,000  | 16,384      |

[//]: # "moonshot-kimi-k2-ids:end"

Оцінки вартості в каталозі для поточних моделей K2, розміщених Moonshot, використовують
опубліковані Moonshot тарифи pay-as-you-go: Kimi K2.7 Code — $0.19/MTok за cache hit,
$0.95/MTok вводу і $4.00/MTok виводу; Kimi K2.6 — $0.16/MTok за cache hit,
$0.95/MTok вводу і $4.00/MTok виводу; Kimi K2.5 — $0.10/MTok за cache hit,
$0.60/MTok вводу і $3.00/MTok виводу. Інші застарілі записи каталогу зберігають
заповнювачі нульової вартості, якщо ви не перевизначите їх у конфігурації.

Kimi K2.7 Code завжди використовує native thinking. OpenClaw відкриває лише стан thinking `on`
для цієї моделі й опускає вихідні елементи керування `thinking` і
`reasoning_effort`, як вимагає Moonshot. OpenClaw також опускає
перевизначення sampling, які K2.7 фіксує до стандартних значень provider. Kimi K2.6 залишається
стандартною моделлю onboarding.

## Початок роботи

Виберіть свого provider і виконайте кроки налаштування.

<Tabs>
  <Tab title="Moonshot API">
    **Найкраще для:** моделей Kimi K2 через Moonshot Open Platform.

    <Steps>
      <Step title="Виберіть регіон кінцевої точки">
        | Вибір автентифікації | Кінцева точка                 | Регіон        |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | Міжнародний   |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | Китай         |
      </Step>
      <Step title="Запустіть onboarding">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Або для кінцевої точки в Китаї:

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="Задайте модель за замовчуванням">
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
      <Step title="Запустіть live smoke test">
        Використовуйте ізольований каталог стану, коли потрібно перевірити доступ до моделі та відстеження вартості,
        не зачіпаючи ваші звичайні sessions:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        JSON-відповідь має повідомляти `provider: "moonshot"` і
        `model: "kimi-k2.6"`. Запис transcript assistant зберігає нормалізоване
        використання токенів плюс оцінену вартість у `usage.cost`, коли Moonshot повертає
        метадані usage.
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
            "moonshot/kimi-k2.7-code": { alias: "Kimi K2.7 Code" },
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
                id: "kimi-k2.7-code",
                name: "Kimi K2.7 Code",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.19, cacheWrite: 0 },
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
    Установіть офіційний Plugin, а потім перезапустіть Gateway:

    ```bash
    openclaw plugins install @openclaw/kimi-provider
    openclaw gateway restart
    ```
    **Найкраще для:** завдань, орієнтованих на код, через кінцеву точку Kimi Coding.

    <Note>
    Kimi Coding використовує інший API-ключ і префікс provider (`kimi/...`), ніж Moonshot (`moonshot/...`). Стабільне посилання на модель API — `kimi/kimi-for-coding`; застарілі посилання `kimi/kimi-code` і `kimi/k2p5` залишаються прийнятними та нормалізуються до цього id моделі API.
    </Note>

    <Steps>
      <Step title="Установіть Plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        ```
      </Step>
      <Step title="Запустіть onboarding">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Задайте модель за замовчуванням">
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

Plugin Moonshot також реєструє **Kimi** як provider `web_search`, підтримуваний вебпошуком Moonshot.

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

    | Параметр            | Варіанти                                                             |
    | ------------------- | -------------------------------------------------------------------- |
    | Регіон API          | `https://api.moonshot.ai/v1` (міжнародний) або `https://api.moonshot.cn/v1` (Китай) |
    | Модель вебпошуку    | За замовчуванням `kimi-k2.6`                                         |

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
  <Accordion title="Режим native thinking">
    Kimi K2.7 Code завжди використовує native thinking. Moonshot вимагає, щоб клієнти
    опускали поле `thinking` для цієї моделі, тому OpenClaw відкриває лише `on` і
    ігнорує застарілі налаштування `off`. K2.7 також фіксує `temperature`, `top_p`, `n`,
    `presence_penalty` і `frequency_penalty`; OpenClaw опускає налаштовані
    перевизначення для цих полів.

    Інші моделі Moonshot Kimi підтримують бінарний native thinking:

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

    OpenClaw зіставляє рівні runtime `/think` для цих моделей:

    | Рівень `/think`     | Поведінка Moonshot        |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | Будь-який рівень не off | `thinking.type=enabled`    |

    <Warning>
    Коли Moonshot thinking увімкнено, `tool_choice` має бути `auto` або `none`. OpenClaw нормалізує несумісні значення до `auto`. Це включає Kimi K2.7 Code, whose thinking mode cannot be disabled to preserve a pinned tool choice.
    </Warning>

    Kimi K2.6 також приймає необов’язкове поле `thinking.keep`, яке керує
    багатокроковим збереженням `reasoning_content`. Установіть його в `"all"`, щоб зберігати повне
    reasoning між ходами; пропустіть його (або залиште `null`), щоб використовувати
    стандартну стратегію сервера. OpenClaw передає `thinking.keep` лише для
    `moonshot/kimi-k2.6` і вилучає його з інших моделей. Kimi K2.7 Code
    за замовчуванням зберігає повну історію reasoning, тоді як OpenClaw пропускає все
    поле `thinking`.

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

  <Accordion title="Очищення ідентифікаторів викликів інструментів">
    Moonshot Kimi надає нативні ідентифікатори tool_call у форматі `functions.<name>:<index>`. Для транспорту OpenAI-completions OpenClaw зберігає першу появу кожного нативного ідентифікатора Kimi й переписує подальші дублікати в детерміновані ідентифікатори у стилі OpenAI `call_*`. Відповідні результати інструментів перепризначаються з тим самим ідентифікатором, тож повторне відтворення залишається унікальним без вилучення першого нативного ідентифікатора Kimi.

    Щоб примусово ввімкнути суворе очищення для власного OpenAI-сумісного провайдера, установіть `sanitizeToolCallIds: true`:

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
    Нативні кінцеві точки Moonshot (`https://api.moonshot.ai/v1` і
    `https://api.moonshot.cn/v1`) оголошують сумісність потокового використання в
    спільному транспорті `openai-completions`. OpenClaw визначає це за
    можливостями кінцевої точки, тому сумісні власні ідентифікатори провайдерів, що націлені на ті самі нативні
    хости Moonshot, успадковують таку саму поведінку потокового використання.

    З цінами каталогу K2.6 потокове використання, яке включає токени вводу, виводу
    та читання з кешу, також перетворюється в локальну оцінену вартість у USD для
    `/status`, `/usage full`, `/usage cost` та обліку сесій на основі транскриптів.

  </Accordion>

  <Accordion title="Довідник кінцевих точок і посилань на моделі">
    | Провайдер  | Префікс посилання на модель | Кінцева точка                  | Змінна env автентифікації |
    | ---------- | ---------------------------- | ------------------------------ | ------------------------- |
    | Moonshot   | `moonshot/`                  | `https://api.moonshot.ai/v1`   | `MOONSHOT_API_KEY`        |
    | Moonshot CN| `moonshot/`                  | `https://api.moonshot.cn/v1`   | `MOONSHOT_API_KEY`        |
    | Kimi Coding| `kimi/`                      | Кінцева точка Kimi Coding      | `KIMI_API_KEY`            |
    | Вебпошук   | N/A                          | Та сама, що й регіон Moonshot API | `KIMI_API_KEY` або `MOONSHOT_API_KEY` |

    - Вебпошук Kimi використовує `KIMI_API_KEY` або `MOONSHOT_API_KEY` і за замовчуванням використовує `https://api.moonshot.ai/v1` з моделлю `kimi-k2.6`.
    - За потреби перевизначте ціни й метадані контексту в `models.providers`.
    - Якщо Moonshot публікує інші обмеження контексту для моделі, відповідно змініть `contextWindow`.

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
