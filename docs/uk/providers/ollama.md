---
read_when:
    - Ви хочете запускати OpenClaw з хмарними або локальними моделями через Ollama
    - Вам потрібні вказівки з налаштування та конфігурації Ollama
    - Ви хочете використовувати візійні моделі Ollama для розпізнавання зображень
summary: Запустіть OpenClaw з Ollama (хмарні та локальні моделі)
title: Ollama
x-i18n:
    generated_at: "2026-04-27T02:57:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2347bab12354fbcf4065eec923695f1cc71eb2740f6fd589c9b70c0b71794469
    source_path: providers/ollama.md
    workflow: 15
---

OpenClaw інтегрується з рідним API Ollama (`/api/chat`) для розміщених хмарних моделей і локальних/самостійно розміщених серверів Ollama. Ви можете використовувати Ollama у трьох режимах: `Cloud + Local` через доступний хост Ollama, `Cloud only` з `https://ollama.com` або `Local only` через доступний хост Ollama.

<Warning>
**Користувачі віддаленого Ollama**: Не використовуйте OpenAI-сумісну URL-адресу `/v1` (`http://host:11434/v1`) з OpenClaw. Це ламає виклик інструментів, і моделі можуть виводити сирий JSON інструментів як звичайний текст. Натомість використовуйте рідну URL-адресу API Ollama: `baseUrl: "http://host:11434"` (без `/v1`).
</Warning>

Конфігурація провайдера Ollama використовує `baseUrl` як канонічний ключ. OpenClaw також приймає `baseURL` для сумісності з прикладами у стилі OpenAI SDK, але в новій конфігурації слід надавати перевагу `baseUrl`.

Локальні хости Ollama та хости Ollama у LAN не потребують справжнього bearer-токена; OpenClaw використовує локальний маркер `ollama-local` лише для базових URL-адрес Ollama з loopback, приватною мережею, `.local` і звичайним іменем хоста. Віддалені публічні хости та Ollama Cloud (`https://ollama.com`) потребують справжніх облікових даних через `OLLAMA_API_KEY`, профіль автентифікації або `apiKey` провайдера.

Коли Ollama використовується для embedding-пам’яті, bearer-автентифікація прив’язується до хоста, де її було оголошено. Ключ на рівні провайдера надсилається лише хосту Ollama цього провайдера; `agents.*.memorySearch.remote.apiKey` надсилається лише його віддаленому хосту embedding; а чисте значення змінної середовища `OLLAMA_API_KEY` трактується як домовленість для Ollama Cloud, а не надсилається локальним/самостійно розміщеним хостам за замовчуванням.

## Початок роботи

Виберіть бажаний спосіб налаштування та режим.

<Tabs>
  <Tab title="Onboarding (recommended)">
    **Найкраще для:** найшвидшого шляху до робочого хмарного або локального налаштування Ollama.

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        ```

        Виберіть **Ollama** зі списку провайдерів.
      </Step>
      <Step title="Choose your mode">
        - **Cloud + Local** — локальний хост Ollama плюс хмарні моделі, що маршрутизуються через цей хост
        - **Cloud only** — розміщені моделі Ollama через `https://ollama.com`
        - **Local only** — лише локальні моделі
      </Step>
      <Step title="Select a model">
        `Cloud only` запитує `OLLAMA_API_KEY` і пропонує стандартні хмарні варіанти. `Cloud + Local` і `Local only` запитують базову URL-адресу Ollama, виявляють доступні моделі та автоматично завантажують вибрану локальну модель, якщо вона ще недоступна. `Cloud + Local` також перевіряє, чи цей хост Ollama увійшов у систему для доступу до хмари.
      </Step>
      <Step title="Verify the model is available">
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

    За бажанням укажіть власну базову URL-адресу або модель:

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="Manual setup">
    **Найкраще для:** повного контролю над хмарним або локальним налаштуванням.

    <Steps>
      <Step title="Choose cloud or local">
        - **Cloud + Local**: установіть Ollama, увійдіть через `ollama signin` і маршрутизуйте хмарні запити через цей хост
        - **Cloud only**: використовуйте `https://ollama.com` з `OLLAMA_API_KEY`
        - **Local only**: установіть Ollama з [ollama.com/download](https://ollama.com/download)
      </Step>
      <Step title="Pull a local model (local only)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Enable Ollama for OpenClaw">
        Для `Cloud only` використовуйте справжній `OLLAMA_API_KEY`. Для конфігурацій на базі хоста підійде будь-яке значення-заповнювач:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Inspect and set your model">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Або встановіть значення за замовчуванням у конфігурації:

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

    Використовуйте **Cloud + Local** під час налаштування. OpenClaw запитує базову URL-адресу Ollama, виявляє локальні моделі з цього хоста та перевіряє, чи хост увійшов у систему для доступу до хмари через `ollama signin`. Коли хост увійшов у систему, OpenClaw також пропонує стандартні розміщені хмарні моделі, такі як `kimi-k2.5:cloud`, `minimax-m2.7:cloud` і `glm-5.1:cloud`.

    Якщо хост ще не увійшов у систему, OpenClaw залишає налаштування лише локальним, доки ви не виконаєте `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` працює з розміщеним API Ollama за адресою `https://ollama.com`.

    Використовуйте **Cloud only** під час налаштування. OpenClaw запитує `OLLAMA_API_KEY`, встановлює `baseUrl: "https://ollama.com"` і заповнює список розміщених хмарних моделей. Цей шлях **не** потребує локального сервера Ollama або `ollama signin`.

    Список хмарних моделей, що показується під час `openclaw onboard`, заповнюється в реальному часі з `https://ollama.com/api/tags`, з обмеженням у 500 записів, тому засіб вибору відображає поточний розміщений каталог, а не статичний набір. Якщо `ollama.com` недоступний або не повертає моделей під час налаштування, OpenClaw повертається до попередніх жорстко закодованих підказок, щоб onboarding усе одно завершився.

  </Tab>

  <Tab title="Local only">
    У режимі лише локального використання OpenClaw виявляє моделі з налаштованого екземпляра Ollama. Цей шлях призначений для локальних або самостійно розміщених серверів Ollama.

    Наразі OpenClaw пропонує `gemma4` як локальну модель за замовчуванням.

  </Tab>
</Tabs>

## Виявлення моделей (неявний провайдер)

Коли ви встановлюєте `OLLAMA_API_KEY` (або профіль автентифікації) і **не** визначаєте `models.providers.ollama`, OpenClaw виявляє моделі з локального екземпляра Ollama за адресою `http://127.0.0.1:11434`.

| Поведінка             | Деталі                                                                                                                                                               |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Запит каталогу        | Виконує запит до `/api/tags`                                                                                                                                         |
| Визначення можливостей | Використовує best-effort запити до `/api/show`, щоб зчитувати `contextWindow`, розгорнуті параметри Modelfile `num_ctx` і можливості, зокрема vision/tools        |
| Візійні моделі        | Моделі з можливістю `vision`, про яку повідомляє `/api/show`, позначаються як здатні працювати із зображеннями (`input: ["text", "image"]`), тому OpenClaw автоматично додає зображення до prompt |
| Визначення reasoning  | Позначає `reasoning` за евристикою назви моделі (`r1`, `reasoning`, `think`)                                                                                        |
| Ліміти токенів        | Установлює `maxTokens` на стандартний максимальний ліміт токенів Ollama, який використовує OpenClaw                                                                |
| Вартість              | Установлює всі вартості в `0`                                                                                                                                       |

Це дає змогу уникнути ручного додавання моделей, зберігаючи каталог узгодженим із локальним екземпляром Ollama.

```bash
# See what models are available
ollama list
openclaw models list
```

Щоб додати нову модель, просто завантажте її через Ollama:

```bash
ollama pull mistral
```

Нову модель буде автоматично виявлено, і вона стане доступною для використання.

<Note>
Якщо ви явно задаєте `models.providers.ollama`, автоматичне виявлення пропускається, і ви маєте визначити моделі вручну. Див. розділ явно заданої конфігурації нижче.
</Note>

## Vision і опис зображень

Вбудований Plugin Ollama реєструє Ollama як провайдера розуміння медіа, здатного працювати із зображеннями. Це дає OpenClaw змогу маршрутизувати явні запити на опис зображень і налаштовані типові моделі зображень через локальні або розміщені візійні моделі Ollama.

Для локального vision завантажте модель, яка підтримує зображення:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Потім перевірте за допомогою infer CLI:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` має бути повним посиланням у форматі `<provider/model>`. Якщо його встановлено, `openclaw infer image describe` запускає цю модель безпосередньо замість пропуску опису через те, що модель підтримує вбудоване vision.

Щоб зробити Ollama типовою моделлю для розуміння зображень для вхідних медіафайлів, налаштуйте `agents.defaults.imageModel`:

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

Якщо ви визначаєте `models.providers.ollama.models` вручну, позначайте візійні моделі підтримкою вхідних зображень:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw відхиляє запити на опис зображень для моделей, які не позначені як здатні працювати із зображеннями. За неявного виявлення OpenClaw зчитує це з Ollama, коли `/api/show` повідомляє про можливість vision.

## Конфігурація

<Tabs>
  <Tab title="Basic (implicit discovery)">
    Найпростіший шлях увімкнення режиму лише локального використання — через змінну середовища:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Якщо встановлено `OLLAMA_API_KEY`, ви можете не вказувати `apiKey` у записі провайдера, і OpenClaw заповнить його для перевірок доступності.
    </Tip>

  </Tab>

  <Tab title="Explicit (manual models)">
    Використовуйте явно задану конфігурацію, якщо вам потрібне налаштування розміщеної хмари, Ollama працює на іншому хості/порту, ви хочете примусово задати конкретні вікна контексту або списки моделей, або вам потрібні повністю ручні визначення моделей.

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

  <Tab title="Custom base URL">
    Якщо Ollama працює на іншому хості або порту (явно задана конфігурація вимикає автоматичне виявлення, тому визначайте моделі вручну):

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // No /v1 - use native Ollama API URL
            api: "ollama", // Set explicitly to guarantee native tool-calling behavior
          },
        },
      },
    }
    ```

    <Warning>
    Не додавайте `/v1` до URL-адреси. Шлях `/v1` використовує OpenAI-сумісний режим, у якому виклик інструментів ненадійний. Використовуйте базову URL-адресу Ollama без суфікса шляху.
    </Warning>

  </Tab>
</Tabs>

### Вибір моделі

Після налаштування всі ваші моделі Ollama стають доступними:

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

Також підтримуються власні ідентифікатори провайдера Ollama. Коли посилання на модель використовує префікс активного провайдера, наприклад `ollama-spark/qwen3:32b`, OpenClaw прибирає лише цей префікс перед викликом Ollama, щоб сервер отримав `qwen3:32b`.

## Вебпошук Ollama

OpenClaw підтримує **Вебпошук Ollama** як вбудований провайдер `web_search`.

| Властивість | Деталі                                                                                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Хост        | Використовує налаштований вами хост Ollama (`models.providers.ollama.baseUrl`, якщо задано, інакше `http://127.0.0.1:11434`); `https://ollama.com` напряму використовує розміщений API |
| Автентифікація | Без ключа для локальних хостів Ollama, у які виконано вхід; `OLLAMA_API_KEY` або налаштована автентифікація провайдера для прямого пошуку через `https://ollama.com` або хостів, захищених автентифікацією |
| Вимога      | Локальні/самостійно розміщені хости мають бути запущені та мати виконаний вхід через `ollama signin`; прямий розміщений пошук потребує `baseUrl: "https://ollama.com"` і справжній ключ API Ollama |

Виберіть **Ollama Web Search** під час `openclaw onboard` або `openclaw configure --section web`, або задайте:

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
Повні відомості про налаштування та поведінку див. у [Ollama Web Search](/uk/tools/ollama-search).
</Note>

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Legacy OpenAI-compatible mode">
    <Warning>
    **Виклик інструментів ненадійний у OpenAI-сумісному режимі.** Використовуйте цей режим лише якщо вам потрібен формат OpenAI для проксі та ви не залежите від рідної поведінки виклику інструментів.
    </Warning>

    Якщо вам потрібно використовувати OpenAI-сумісну кінцеву точку натомість (наприклад, за проксі, який підтримує лише формат OpenAI), явно задайте `api: "openai-completions"`:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // default: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    Цей режим може не підтримувати одночасно streaming і виклик інструментів. Можливо, вам доведеться вимкнути streaming за допомогою `params: { streaming: false }` у конфігурації моделі.

    Коли `api: "openai-completions"` використовується з Ollama, OpenClaw за замовчуванням додає `options.num_ctx`, щоб Ollama мовчки не повертався до вікна контексту 4096. Якщо ваш проксі/upstream відхиляє невідомі поля `options`, вимкніть цю поведінку:

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

  <Accordion title="Context windows">
    Для автоматично виявлених моделей OpenClaw використовує вікно контексту, про яке повідомляє Ollama, коли воно доступне, зокрема більші значення `PARAMETER num_ctx` із користувацьких Modelfile. Інакше він повертається до стандартного вікна контексту Ollama, яке використовує OpenClaw.

    Ви можете перевизначити `contextWindow` і `maxTokens` у явно заданій конфігурації провайдера. Щоб обмежити контекст виконання Ollama для кожного запиту без перебудови Modelfile, задайте `params.num_ctx`; OpenClaw надсилає його як `options.num_ctx` і для рідного Ollama, і для OpenAI-сумісного адаптера Ollama. Некоректні, нульові, від’ємні та нескінченні значення ігноруються, і використовується `contextWindow`.

    Записи рідних моделей Ollama також приймають поширені параметри виконання Ollama у `params`, зокрема `temperature`, `top_p`, `top_k`, `min_p`, `num_predict`, `stop`, `repeat_penalty`, `num_batch`, `num_thread` і `use_mmap`. OpenClaw пересилає лише ключі запиту Ollama, тому параметри виконання OpenClaw, такі як `streaming`, не витікають до Ollama. Використовуйте `params.think` або `params.thinking`, щоб надсилати верхньорівневий параметр Ollama `think`; `false` вимикає thinking на рівні API для моделей thinking у стилі Qwen.

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
                  temperature: 0.7,
                  top_p: 0.9,
                  thinking: false,
                },
              }
            ]
          }
        }
      }
    }
    ```

    `agents.defaults.models["ollama/<model>"].params.num_ctx` для окремої моделі теж працює. Якщо налаштовано обидва варіанти, явний запис моделі провайдера має пріоритет над типовим значенням агента.

  </Accordion>

  <Accordion title="Reasoning models">
    OpenClaw за замовчуванням вважає моделі з назвами на кшталт `deepseek-r1`, `reasoning` або `think` здатними до reasoning.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Додаткова конфігурація не потрібна — OpenClaw позначає їх автоматично.

  </Accordion>

  <Accordion title="Model costs">
    Ollama є безкоштовним і працює локально, тому для всіх моделей вартість встановлюється в $0. Це стосується як автоматично виявлених, так і вручну визначених моделей.
  </Accordion>

  <Accordion title="Memory embeddings">
    Вбудований Plugin Ollama реєструє провайдер embeddings пам’яті для
    [пошуку в пам’яті](/uk/concepts/memory). Він використовує налаштовані базову URL-адресу
    і ключ API Ollama, викликає поточну кінцеву точку `/api/embed` Ollama та
    по можливості об’єднує кілька фрагментів пам’яті в один запит `input`.

    | Властивість   | Значення            |
    | ------------- | ------------------- |
    | Типова модель | `nomic-embed-text`  |
    | Автозавантаження | Так — модель embedding автоматично завантажується, якщо її немає локально |

    Щоб вибрати Ollama як провайдера embeddings для пошуку в пам’яті:

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

  <Accordion title="Streaming configuration">
    Інтеграція Ollama в OpenClaw за замовчуванням використовує **рідний API Ollama** (`/api/chat`), який повністю підтримує одночасно streaming і виклик інструментів. Жодної спеціальної конфігурації не потрібно.

    Для рідних запитів `/api/chat` OpenClaw також напряму передає керування thinking до Ollama: `/think off` і `openclaw agent --thinking off` надсилають верхньорівневе `think: false`, а `/think low|medium|high` надсилають відповідний рядок зусилля верхнього рівня `think`. `/think max` зіставляється з найвищим рідним рівнем зусилля Ollama, `think: "high"`.

    <Tip>
    Якщо вам потрібно використовувати OpenAI-сумісну кінцеву точку, див. розділ "Legacy OpenAI-compatible mode" вище. У цьому режимі streaming і виклик інструментів можуть не працювати одночасно.
    </Tip>

  </Accordion>
</AccordionGroup>

## Усунення неполадок

<AccordionGroup>
  <Accordion title="Ollama not detected">
    Переконайтеся, що Ollama запущено, що ви встановили `OLLAMA_API_KEY` (або профіль автентифікації), і що ви **не** визначили явний запис `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Переконайтеся, що API доступний:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="No models available">
    Якщо вашої моделі немає у списку, або завантажте її локально, або явно визначте її в `models.providers.ollama`.

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="Connection refused">
    Перевірте, що Ollama працює на правильному порту:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
Більше довідки: [Усунення неполадок](/uk/help/troubleshooting) і [Часті запитання](/uk/help/faq).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Model selection" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх провайдерів, посилань на моделі та поведінки перемикання при збоях.
  </Card>
  <Card title="Model selection" href="/uk/concepts/models" icon="brain">
    Як вибирати та налаштовувати моделі.
  </Card>
  <Card title="Ollama Web Search" href="/uk/tools/ollama-search" icon="magnifying-glass">
    Повні відомості про налаштування та поведінку вебпошуку на базі Ollama.
  </Card>
  <Card title="Configuration" href="/uk/gateway/configuration" icon="gear">
    Повний довідник з конфігурації.
  </Card>
</CardGroup>
