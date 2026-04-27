---
read_when:
    - Ви хочете запустити OpenClaw з хмарними або локальними моделями через Ollama
    - Вам потрібні вказівки щодо налаштування та конфігурації Ollama
    - Ви хочете моделі бачення Ollama для розуміння зображень
summary: Запустіть OpenClaw з Ollama (хмарні та локальні моделі)
title: Ollama
x-i18n:
    generated_at: "2026-04-27T02:07:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: aaa8007befc589f1ed5f77bc360fa82762c771c051fbaadc8d56e296b2182980
    source_path: providers/ollama.md
    workflow: 15
---

OpenClaw інтегрується з нативним API Ollama (`/api/chat`) для розміщених хмарних моделей і локальних/self-hosted серверів Ollama. Ви можете використовувати Ollama у трьох режимах: `Cloud + Local` через доступний хост Ollama, `Cloud only` через `https://ollama.com` або `Local only` через доступний хост Ollama.

<Warning>
**Користувачі віддаленого Ollama**: Не використовуйте OpenAI-сумісний URL `/v1` (`http://host:11434/v1`) з OpenClaw. Це ламає виклики інструментів, і моделі можуть виводити сирий JSON інструментів як звичайний текст. Натомість використовуйте URL нативного API Ollama: `baseUrl: "http://host:11434"` (без `/v1`).
</Warning>

## Початок роботи

Оберіть бажаний спосіб і режим налаштування.

<Tabs>
  <Tab title="Онбординг (рекомендовано)">
    **Найкраще для:** найшвидшого шляху до робочого налаштування Ollama Cloud або локального Ollama.

    <Steps>
      <Step title="Запустіть онбординг">
        ```bash
        openclaw onboard
        ```

        Виберіть **Ollama** зі списку провайдерів.
      </Step>
      <Step title="Оберіть режим">
        - **Cloud + Local** — локальний хост Ollama плюс хмарні моделі, маршрутизовані через цей хост
        - **Cloud only** — розміщені моделі Ollama через `https://ollama.com`
        - **Local only** — лише локальні моделі
      </Step>
      <Step title="Оберіть модель">
        `Cloud only` запитує `OLLAMA_API_KEY` і пропонує стандартні хмарні значення за замовчуванням. `Cloud + Local` і `Local only` запитують базовий URL Ollama, виявляють доступні моделі та автоматично завантажують вибрану локальну модель, якщо її ще немає. `Cloud + Local` також перевіряє, чи виконано вхід на цьому хості Ollama для доступу до хмари.
      </Step>
      <Step title="Переконайтеся, що модель доступна">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### Неінтерактивний режим

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    За бажанням можна вказати власний базовий URL або модель:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Ручне налаштування">
    **Найкраще для:** повного контролю над хмарним або локальним налаштуванням.

    <Steps>
      <Step title="Оберіть хмарний або локальний режим">
        - **Cloud + Local**: встановіть Ollama, увійдіть через `ollama signin` і маршрутизуйте хмарні запити через цей хост
        - **Cloud only**: використовуйте `https://ollama.com` з `OLLAMA_API_KEY`
        - **Local only**: установіть Ollama з [ollama.com/download](https://ollama.com/download)
      </Step>
      <Step title="Завантажте локальну модель (лише локальний режим)">
        ```bash
        ollama pull gemma4
        # або
        ollama pull gpt-oss:20b
        # або
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Увімкніть Ollama для OpenClaw">
        Для `Cloud only` використовуйте свій справжній `OLLAMA_API_KEY`. Для конфігурацій через хост підійде будь-яке заповнювальне значення:

        ```bash
        # Хмара
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Лише локально
        export OLLAMA_API_KEY="ollama-local"

        # Або налаштуйте у своєму конфігураційному файлі
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Перегляньте та встановіть модель">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Або встановіть типову модель у конфігурації:

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Хмарні моделі

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` використовує доступний хост Ollama як контрольну точку і для локальних, і для хмарних моделей. Це рекомендований Ollama гібридний сценарій.

    Використовуйте **Cloud + Local** під час налаштування. OpenClaw запитує базовий URL Ollama, виявляє локальні моделі на цьому хості та перевіряє, чи виконано вхід на хості для доступу до хмари через `ollama signin`. Якщо вхід на хості виконано, OpenClaw також пропонує розміщені хмарні типові значення, такі як `kimi-k2.5:cloud`, `minimax-m2.7:cloud` і `glm-5.1:cloud`.

    Якщо вхід на хості ще не виконано, OpenClaw залишає налаштування лише локальним, доки ви не виконаєте `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` працює через розміщений API Ollama за адресою `https://ollama.com`.

    Використовуйте **Cloud only** під час налаштування. OpenClaw запитує `OLLAMA_API_KEY`, встановлює `baseUrl: "https://ollama.com"` і заповнює список розміщених хмарних моделей. Цей шлях **не** потребує локального сервера Ollama або `ollama signin`.

    Список хмарних моделей, показаний під час `openclaw onboard`, заповнюється динамічно з `https://ollama.com/api/tags`, з обмеженням до 500 записів, тому засіб вибору відображає поточний розміщений каталог, а не статичний початковий список. Якщо `ollama.com` недоступний або не повертає моделей під час налаштування, OpenClaw повертається до попередніх жорстко закодованих підказок, щоб онбординг усе одно завершився.

  </Tab>

  <Tab title="Local only">
    У режимі лише локально OpenClaw виявляє моделі з налаштованого екземпляра Ollama. Цей шлях призначений для локальних або self-hosted серверів Ollama.

    OpenClaw наразі пропонує `gemma4` як локальну модель за замовчуванням.

  </Tab>
</Tabs>

## Виявлення моделей (неявний провайдер)

Коли ви встановлюєте `OLLAMA_API_KEY` (або профіль автентифікації) і **не** визначаєте `models.providers.ollama`, OpenClaw виявляє моделі з локального екземпляра Ollama за адресою `http://127.0.0.1:11434`.

| Поведінка            | Докладно                                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Запит каталогу       | Виконує запити до `/api/tags`                                                                                                                                       |
| Виявлення можливостей | Використовує best-effort запити до `/api/show`, щоб зчитати `contextWindow`, розгорнуті параметри Modelfile `num_ctx` і можливості, включно з vision/tools       |
| Моделі бачення       | Моделі з можливістю `vision`, про яку повідомляє `/api/show`, позначаються як здатні працювати із зображеннями (`input: ["text", "image"]`), тому OpenClaw автоматично додає зображення до промпту |
| Виявлення міркування | Позначає `reasoning` за допомогою евристики на основі назви моделі (`r1`, `reasoning`, `think`)                                                                    |
| Обмеження токенів    | Встановлює `maxTokens` на типове максимальне обмеження токенів Ollama, яке використовує OpenClaw                                                                   |
| Вартість             | Встановлює всі вартості в `0`                                                                                                                                       |

Це дає змогу уникнути ручного додавання моделей, водночас зберігаючи узгодженість каталогу з локальним екземпляром Ollama.

```bash
# Подивитися, які моделі доступні
ollama list
openclaw models list
```

Щоб додати нову модель, просто завантажте її через Ollama:

```bash
ollama pull mistral
```

Нова модель буде автоматично виявлена й стане доступною для використання.

<Note>
Якщо ви явно задаєте `models.providers.ollama`, автовиявлення пропускається, і моделі потрібно визначати вручну. Дивіться розділ про явну конфігурацію нижче.
</Note>

## Бачення та опис зображень

Вбудований Plugin Ollama реєструє Ollama як провайдера розуміння медіа, здатного працювати із зображеннями. Це дає OpenClaw змогу маршрутизувати явні запити на опис зображень і налаштовані типові моделі для зображень через локальні або розміщені моделі бачення Ollama.

Для локального бачення завантажте модель, що підтримує зображення:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Потім перевірте за допомогою CLI infer:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` має бути повним посиланням у форматі `<provider/model>`. Якщо його встановлено, `openclaw infer image describe` запускає цю модель безпосередньо замість того, щоб пропускати опис, бо модель підтримує нативне бачення.

Щоб зробити Ollama типовою моделлю розуміння зображень для вхідних медіа, налаштуйте `agents.defaults.imageModel`:

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

Якщо ви визначаєте `models.providers.ollama.models` вручну, позначайте моделі бачення підтримкою вхідних зображень:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw відхиляє запити на опис зображень для моделей, які не позначено як здатні працювати із зображеннями. За неявного виявлення OpenClaw зчитує це з Ollama, коли `/api/show` повідомляє про можливість vision.

## Конфігурація

<Tabs>
  <Tab title="Базова (неявне виявлення)">
    Найпростіший спосіб увімкнути режим лише локально — через змінну середовища:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Якщо встановлено `OLLAMA_API_KEY`, ви можете не вказувати `apiKey` у записі провайдера, і OpenClaw підставить його для перевірок доступності.
    </Tip>

  </Tab>

  <Tab title="Явна (ручні моделі)">
    Використовуйте явну конфігурацію, якщо вам потрібне розміщене хмарне налаштування, Ollama працює на іншому хості/порті, ви хочете примусово задати конкретні контекстні вікна або списки моделей, або вам потрібні повністю ручні визначення моделей.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="Власний базовий URL">
    Якщо Ollama працює на іншому хості або порту (явна конфігурація вимикає автовиявлення, тому визначайте моделі вручну):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // Без /v1 - використовуйте URL нативного API Ollama
            api: "ollama", // Явно задайте, щоб гарантувати нативну поведінку виклику інструментів
          },
        },
      },
    }
    ```

    <Warning>
    Не додавайте `/v1` до URL. Шлях `/v1` використовує OpenAI-сумісний режим, де виклик інструментів працює ненадійно. Використовуйте базовий URL Ollama без суфікса шляху.
    </Warning>

  </Tab>
</Tabs>

### Вибір моделі

Після налаштування всі ваші моделі Ollama будуть доступні:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

Також підтримуються власні ідентифікатори провайдера Ollama. Коли посилання на модель використовує префікс активного провайдера, наприклад `ollama-spark/qwen3:32b`, OpenClaw прибирає лише цей префікс перед викликом Ollama, щоб сервер отримував `qwen3:32b`.

## Вебпошук Ollama

OpenClaw підтримує **Ollama Web Search** як вбудований провайдер `web_search`.

| Властивість | Докладно                                                                                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Хост        | Використовує налаштований вами хост Ollama (`models.providers.ollama.baseUrl`, якщо задано, інакше `http://127.0.0.1:11434`); `https://ollama.com` напряму використовує розміщений API |
| Автентифікація | Без ключа для локальних хостів Ollama із виконаним входом; `OLLAMA_API_KEY` або налаштована автентифікація провайдера для прямого пошуку через `https://ollama.com` або хостів, захищених автентифікацією |
| Вимога      | Локальні/self-hosted хости мають бути запущені й мати виконаний вхід через `ollama signin`; прямий розміщений пошук вимагає `baseUrl: "https://ollama.com"` плюс справжній ключ API Ollama |

Оберіть **Ollama Web Search** під час `openclaw onboard` або `openclaw configure --section web`, або задайте:

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

<Note>
Повні відомості про налаштування та поведінку дивіться в [Ollama Web Search](/uk/tools/ollama-search).
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Застарілий OpenAI-сумісний режим">
    <Warning>
    **У OpenAI-сумісному режимі виклик інструментів працює ненадійно.** Використовуйте цей режим лише тоді, коли вам потрібен формат OpenAI для проксі й ви не залежите від нативної поведінки виклику інструментів.
    </Warning>

    Якщо вам потрібно використовувати OpenAI-сумісний endpoint замість цього (наприклад, за проксі, який підтримує лише формат OpenAI), явно задайте `api: "openai-completions"`:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // типово: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    У цьому режимі одночасна підтримка потокової передачі та виклику інструментів може бути недоступною. Можливо, вам доведеться вимкнути потокову передачу за допомогою `params: { streaming: false }` у конфігурації моделі.

    Коли `api: "openai-completions"` використовується з Ollama, OpenClaw типово додає `options.num_ctx`, щоб Ollama не переходив непомітно до контекстного вікна 4096. Якщо ваш проксі/upstream відхиляє невідомі поля `options`, вимкніть цю поведінку:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Контекстні вікна">
    Для автоматично виявлених моделей OpenClaw використовує контекстне вікно, про яке повідомляє Ollama, коли воно доступне, включно з більшими значеннями `PARAMETER num_ctx` із власних Modelfile. Інакше він повертається до типового контекстного вікна Ollama, яке використовує OpenClaw.

    Ви можете перевизначити `contextWindow` і `maxTokens` у явній конфігурації провайдера. Щоб обмежити контекст Ollama під час виконання для кожного запиту без перебудови Modelfile, задайте `params.num_ctx`; OpenClaw надсилає його як `options.num_ctx` і для нативного Ollama, і для OpenAI-сумісного адаптера Ollama. Некоректні, нульові, від’ємні та нескінченні значення ігноруються, і використовується `contextWindow`.

    ```json5
    {
      models: {
        providers: {
          ollama: {
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
                params: {
                  num_ctx: 32768,
                },
              }
            ]
          }
        }
      }
    }
    ```

    Також працює `agents.defaults.models["ollama/<model>"].params.num_ctx` для окремої моделі. Якщо налаштовано обидва варіанти, явний запис моделі в провайдері має пріоритет над типовим значенням агента.

  </Accordion>

  <Accordion title="Моделі міркування">
    OpenClaw типово вважає моделі з назвами на кшталт `deepseek-r1`, `reasoning` або `think` здатними до міркування.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Додаткова конфігурація не потрібна — OpenClaw позначає їх автоматично.

  </Accordion>

  <Accordion title="Вартість моделей">
    Ollama є безкоштовним і працює локально, тому вартість усіх моделей встановлено на рівні $0. Це стосується як автоматично виявлених, так і вручну визначених моделей.
  </Accordion>

  <Accordion title="Вбудовування пам’яті">
    Вбудований Plugin Ollama реєструє провайдера вбудовувань пам’яті для
    [пошуку в пам’яті](/uk/concepts/memory). Він використовує налаштовані базовий URL
    і ключ API Ollama, викликає поточний endpoint Ollama `/api/embed` і, коли це можливо, об’єднує
    кілька фрагментів пам’яті в один запит `input`.

    | Властивість   | Значення            |
    | ------------- | ------------------- |
    | Типова модель | `nomic-embed-text`  |
    | Автозавантаження | Так — модель вбудовувань автоматично завантажується, якщо її немає локально |

    Щоб вибрати Ollama як провайдера вбудовувань для пошуку в пам’яті:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Конфігурація потокової передачі">
    Інтеграція Ollama в OpenClaw типово використовує **нативний API Ollama** (`/api/chat`), який повністю підтримує одночасно потокову передачу та виклик інструментів. Жодної спеціальної конфігурації не потрібно.

    Для нативних запитів `/api/chat` OpenClaw також напряму передає керування thinking до Ollama: `/think off` і `openclaw agent --thinking off` надсилають верхньорівневе `think: false`, а `/think low|medium|high` надсилають відповідний рядок зусилля верхнього рівня `think`. `/think max` відповідає найвищому нативному рівню зусилля Ollama, `think: "high"`.

    <Tip>
    Якщо вам потрібно використовувати OpenAI-сумісний endpoint, дивіться розділ «Застарілий OpenAI-сумісний режим» вище. У цьому режимі потокова передача та виклик інструментів можуть не працювати одночасно.
    </Tip>

  </Accordion>
</AccordionGroup>

## Усунення неполадок

<AccordionGroup>
  <Accordion title="Ollama не виявлено">
    Переконайтеся, що Ollama запущено, що ви встановили `OLLAMA_API_KEY` (або профіль автентифікації), і що ви **не** визначили явний запис `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Перевірте, що API доступний:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Немає доступних моделей">
    Якщо ваша модель не відображається у списку, або завантажте її локально, або явно визначте її в `models.providers.ollama`.

    ```bash
    ollama list  # Подивитися, що встановлено
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Або іншу модель
    ```

  </Accordion>

  <Accordion title="У з’єднанні відмовлено">
    Перевірте, що Ollama запущено на правильному порту:

    ```bash
    # Перевірити, чи запущено Ollama
    ps aux | grep ollama

    # Або перезапустити Ollama
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
Додаткова допомога: [Усунення неполадок](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх провайдерів, посилань на моделі та поведінки перемикання на резервні варіанти.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/models" icon="brain">
    Як вибирати та налаштовувати моделі.
  </Card>
  <Card title="Ollama Web Search" href="/uk/tools/ollama-search" icon="magnifying-glass">
    Повні відомості про налаштування та поведінку вебпошуку на основі Ollama.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник із конфігурації.
  </Card>
</CardGroup>
