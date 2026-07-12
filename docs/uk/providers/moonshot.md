---
read_when:
    - Ви хочете налаштувати Moonshot K2 (Moonshot Open Platform) чи Kimi Coding
    - Вам потрібно розуміти окремі кінцеві точки, ключі та посилання на моделі
    - Вам потрібна конфігурація для копіювання та вставлення для будь-якого з провайдерів
summary: Налаштування Moonshot K2 і Kimi Coding (окремі провайдери та ключі)
title: Moonshot AI
x-i18n:
    generated_at: "2026-07-12T13:42:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c917a595337fc2138601245f4c7055815859dfa3b2ddf90a56c980a7a4e09744
    source_path: providers/moonshot.md
    workflow: 16
---

Moonshot надає Kimi API із кінцевими точками, сумісними з OpenAI. Установіть
модель за замовчуванням `moonshot/kimi-k2.6` для Moonshot Open Platform або
`kimi/kimi-for-coding` для Kimi Coding.

<Warning>
Moonshot і Kimi Coding — **окремі постачальники**, кожен із яких постачається як окремий зовнішній Plugin. Ключі не взаємозамінні, кінцеві точки відрізняються, як і посилання на моделі (`moonshot/...` і `kimi/...`).
</Warning>

## Вбудований каталог моделей

[//]: # "moonshot-kimi-k2-ids:start"

| Посилання на модель               | Назва                  | Міркування        | Вхідні дані     | Контекст | Макс. виведення |
| --------------------------------- | ---------------------- | ----------------- | --------------- | -------- | --------------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | Ні                | текст, зображення | 262,144  | 262,144         |
| `moonshot/kimi-k2.7-code`         | Kimi K2.7 Code         | Завжди ввімкнено  | текст, зображення | 262,144  | 262,144         |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | Ні                | текст, зображення | 262,144  | 262,144         |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | Так               | текст           | 262,144  | 262,144         |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | Так               | текст           | 262,144  | 262,144         |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | Ні                | текст           | 256,000  | 16,384          |

[//]: # "moonshot-kimi-k2-ids:end"

Оцінки вартості в каталозі використовують опубліковані Moonshot тарифи з оплатою за фактичне використання: для Kimi
K2.7 Code — $0.19/MTok за влучання в кеш, $0.95/MTok за вхідні дані та $4.00/MTok за виведення; для Kimi
K2.6 — $0.16/MTok за влучання в кеш, $0.95/MTok за вхідні дані та $4.00/MTok за виведення; для Kimi K2.5 —
$0.10/MTok за влучання в кеш, $0.60/MTok за вхідні дані та $3.00/MTok за виведення. Інші записи каталогу
зберігають заповнювачі з нульовою вартістю, якщо ви не перевизначите їх у конфігурації.

Kimi K2.7 Code завжди використовує нативне міркування. OpenClaw надає для цієї моделі лише стан міркування `on`
і не передає вихідні поля `thinking` та `reasoning_effort`, як того вимагає Moonshot. Він також не передає перевизначення
параметрів вибірки (`temperature`, `top_p`, `n`, `presence_penalty`,
`frequency_penalty`), для яких K2.7 використовує значення постачальника за замовчуванням. Kimi K2.6 залишається
моделлю за замовчуванням під час початкового налаштування.

## Початок роботи

Moonshot і Kimi Coding є зовнішніми плагінами — установіть потрібний перед
початковим налаштуванням.

<Tabs>
  <Tab title="Moonshot API">
    **Найкраще підходить для:** моделей Kimi K2 через Moonshot Open Platform.

    <Steps>
      <Step title="Установіть Plugin">
        ```bash
        openclaw plugins install @openclaw/moonshot-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Виберіть регіон кінцевої точки">
        | Варіант автентифікації | Кінцева точка                  | Регіон         |
        | ---------------------- | ------------------------------ | -------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | Міжнародний    |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | Китай          |
      </Step>
      <Step title="Запустіть початкове налаштування">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        Або для кінцевої точки в Китаї:

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
      <Step title="Перевірте доступність моделей">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="Запустіть оперативну базову перевірку">
        Використовуйте ізольований каталог стану, якщо потрібно перевірити доступ до моделі та відстеження
        вартості, не змінюючи звичайні сеанси:

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        У відповіді JSON мають бути вказані `provider: "moonshot"` і
        `model: "kimi-k2.6"`. Запис стенограми асистента зберігає нормалізоване
        використання токенів і приблизну вартість у `usage.cost`, коли Moonshot повертає
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
    **Найкраще підходить для:** завдань, орієнтованих на код, через кінцеву точку Kimi Coding.

    <Note>
    Kimi Coding використовує інший ключ API та інший префікс постачальника (`kimi/...`), ніж Moonshot (`moonshot/...`). Стабільне посилання на модель — `kimi/kimi-for-coding`; застарілі посилання `kimi/kimi-code` і `kimi/k2p5` залишаються прийнятними та нормалізуються до цього ідентифікатора моделі.
    </Note>

    <Steps>
      <Step title="Установіть Plugin">
        ```bash
        openclaw plugins install @openclaw/kimi-provider
        openclaw gateway restart
        ```
      </Step>
      <Step title="Запустіть початкове налаштування">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="Установіть модель за замовчуванням">
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
      <Step title="Перевірте доступність моделі">
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

Plugin Moonshot також реєструє **Kimi** як постачальника `web_search`, що використовує вебпошук Moonshot.

<Steps>
  <Step title="Запустіть інтерактивне налаштування вебпошуку">
    ```bash
    openclaw configure --section web
    ```

    Виберіть **Kimi** у розділі вебпошуку, щоб зберегти
    `plugins.entries.moonshot.config.webSearch.*`.

  </Step>
  <Step title="Налаштуйте регіон і модель вебпошуку">
    Під час інтерактивного налаштування буде запропоновано вказати:

    | Налаштування          | Варіанти                                                              |
    | --------------------- | --------------------------------------------------------------------- |
    | Регіон API            | `https://api.moonshot.ai/v1` (міжнародний) або `https://api.moonshot.cn/v1` (Китай) |
    | Модель вебпошуку      | За замовчуванням `kimi-k2.6`                                          |

  </Step>
</Steps>

Конфігурація розміщується в `plugins.entries.moonshot.config.webSearch`:

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
  <Accordion title="Режим нативного міркування">
    Kimi K2.7 Code завжди використовує нативне міркування. Moonshot вимагає, щоб клієнти
    не передавали поле `thinking` для цієї моделі, тому OpenClaw надає лише `on` та
    ігнорує застарілі налаштування `off`. K2.7 також фіксує значення `temperature`, `top_p`, `n`,
    `presence_penalty` і `frequency_penalty`; OpenClaw не передає налаштовані
    перевизначення цих полів.

    Інші моделі Moonshot Kimi підтримують двійковий режим нативного міркування:

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    Налаштуйте його окремо для кожної моделі через `agents.defaults.models.<provider/model>.params`:

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

    OpenClaw зіставляє рівні `/think` під час виконання для цих моделей:

    | Рівень `/think`       | Поведінка Moonshot          |
    | --------------------- | --------------------------- |
    | `/think off`          | `thinking.type=disabled`    |
    | Будь-який рівень, крім off | `thinking.type=enabled` |

    <Warning>
    Коли міркування Moonshot увімкнено, `tool_choice` має бути `auto` або `none`. Закріплений вибір інструмента (`type: "tool"` або `type: "function"`) натомість примусово повертає міркування до `disabled`, щоб запитаний інструмент усе одно виконався; `tool_choice: "required"` натомість нормалізується до `auto`. Це стосується кожної моделі Moonshot, крім Kimi K2.7 Code, режим міркування якої не можна вимкнути — її `tool_choice` нормалізується до `auto`, якщо значення несумісне.
    </Warning>

    Kimi K2.6 також приймає необов’язкове поле `thinking.keep`, яке керує
    збереженням `reasoning_content` між кількома ходами. Установіть для нього
    значення `"all"`, щоб зберігати повні міркування між ходами; не вказуйте його
    (або залиште `null`), щоб використовувати стандартну стратегію сервера.
    OpenClaw пересилає `thinking.keep` лише для `moonshot/kimi-k2.6` і видаляє
    його для інших моделей. Kimi K2.7 Code за замовчуванням зберігає повну
    історію міркувань, тоді як OpenClaw повністю пропускає поле `thinking`.

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
    Moonshot Kimi повертає нативні ідентифікатори tool_call у форматі `functions.<name>:<index>`. OpenClaw зберігає перше входження кожного нативного ідентифікатора Kimi, а подальші дублікати перезаписує детермінованими ідентифікаторами `call_*` у стилі OpenAI. Відповідні результати інструментів зіставляються з тим самим ідентифікатором, щоб повторне відтворення залишалося однозначним без видалення першого нативного ідентифікатора Kimi. Цю поведінку вбудовано в комплектний провайдер Moonshot, і користувач не може її налаштувати.
  </Accordion>

  <Accordion title="Сумісність використання в потоковому режимі">
    Нативні кінцеві точки Moonshot (`https://api.moonshot.ai/v1` і
    `https://api.moonshot.cn/v1`) заявляють про сумісність обліку використання
    в потоковому режимі. OpenClaw визначає це за хостом кінцевої точки, а не за
    ідентифікатором провайдера, тому власний ідентифікатор провайдера,
    спрямований на той самий нативний хост Moonshot, успадковує таку саму
    поведінку обліку використання в потоковому режимі.

    За каталожними цінами K2.6 дані про потокове використання, що містять токени
    введення, виведення та читання з кешу, також перетворюються на локальну
    орієнтовну вартість у доларах США для `/status`, `/usage full`,
    `/usage cost` та обліку сеансів на основі журналів діалогів.

  </Accordion>

  <Accordion title="Довідник кінцевих точок і посилань на моделі">
    | Провайдер   | Префікс посилання на модель | Кінцева точка                  | Змінна середовища автентифікації |
    | ------------ | --------------------------- | ------------------------------ | -------------------------------- |
    | Moonshot     | `moonshot/`                 | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`               |
    | Moonshot CN  | `moonshot/`                 | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`               |
    | Kimi Coding  | `kimi/`                     | Кінцева точка Kimi Coding      | `KIMI_API_KEY`                   |
    | Вебпошук     | Н/З                         | Відповідає регіону API Moonshot | `KIMI_API_KEY` або `MOONSHOT_API_KEY` |

    - Вебпошук Kimi використовує `KIMI_API_KEY` або `MOONSHOT_API_KEY`, а за замовчуванням — `https://api.moonshot.ai/v1` із моделлю `kimi-k2.6`.
    - За потреби перевизначте ціни та метадані контексту в `models.providers`.
    - Якщо Moonshot опублікує інші обмеження контексту для моделі, відповідно скоригуйте `contextWindow`.

  </Accordion>
</AccordionGroup>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="Вебпошук" href="/uk/tools/web" icon="magnifying-glass">
    Налаштування провайдерів вебпошуку, зокрема Kimi.
  </Card>
  <Card title="Довідник конфігурації" href="/uk/gateway/configuration-reference" icon="gear">
    Повна схема конфігурації провайдерів, моделей і плагінів.
  </Card>
  <Card title="Відкрита платформа Moonshot" href="https://platform.moonshot.ai" icon="globe">
    Керування ключами API Moonshot і документація.
  </Card>
</CardGroup>
