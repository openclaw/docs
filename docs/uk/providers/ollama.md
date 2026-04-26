---
read_when:
    - Ви хочете запускати OpenClaw з хмарними або локальними моделями через Ollama
    - Вам потрібні інструкції з налаштування та конфігурації Ollama
    - Ви хочете використовувати моделі Ollama з підтримкою зору для розуміння зображень
summary: Запускайте OpenClaw з Ollama (хмарні та локальні моделі)
title: Ollama
x-i18n:
    generated_at: "2026-04-26T21:53:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6fdec2ee2b642bbc57badbc434d41a210b421ac745cd0fceb7be595cbb0cb082
    source_path: providers/ollama.md
    workflow: 15
---

OpenClaw інтегрується з нативним API Ollama (`/api/chat`) для розміщених хмарних моделей і локальних/самостійно розміщених серверів Ollama. Ви можете використовувати Ollama у трьох режимах: `Cloud + Local` через доступний хост Ollama, `Cloud only` через `https://ollama.com` або `Local only` через доступний хост Ollama.

<Warning>
**Користувачі віддаленого Ollama**: Не використовуйте URL OpenAI-сумісного `/v1` (`http://host:11434/v1`) з OpenClaw. Це ламає виклик інструментів, і моделі можуть виводити сирий JSON інструментів як звичайний текст. Натомість використовуйте URL нативного API Ollama: `baseUrl: "http://host:11434"` (без `/v1`).
</Warning>

## Початок роботи

Виберіть бажаний спосіб налаштування та режим.

<Tabs>
  <Tab title="Початкове налаштування (рекомендовано)">
    **Найкраще для:** найшвидшого способу отримати робоче хмарне або локальне налаштування Ollama.

    <Steps>
      <Step title="Запустіть початкове налаштування">
        ```bash
        openclaw onboard
        ```

        Виберіть **Ollama** зі списку провайдерів.
      </Step>
      <Step title="Виберіть свій режим">
        - **Cloud + Local** — локальний хост Ollama плюс хмарні моделі, спрямовані через цей хост
        - **Cloud only** — розміщені моделі Ollama через `https://ollama.com`
        - **Local only** — лише локальні моделі
      </Step>
      <Step title="Виберіть модель">
        `Cloud only` запитує `OLLAMA_API_KEY` і пропонує стандартні хмарні налаштування за замовчуванням. `Cloud + Local` і `Local only` запитують базовий URL Ollama, виявляють доступні моделі та автоматично завантажують вибрану локальну модель, якщо вона ще недоступна. `Cloud + Local` також перевіряє, чи виконано вхід на цьому хості Ollama для хмарного доступу.
      </Step>
      <Step title="Перевірте, що модель доступна">
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

    За потреби вкажіть власний базовий URL або модель:

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
      <Step title="Виберіть хмарний або локальний режим">
        - **Cloud + Local**: встановіть Ollama, виконайте вхід через `ollama signin` і спрямовуйте хмарні запити через цей хост
        - **Cloud only**: використовуйте `https://ollama.com` з `OLLAMA_API_KEY`
        - **Local only**: встановіть Ollama з [ollama.com/download](https://ollama.com/download)
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
        Для `Cloud only` використовуйте свій справжній `OLLAMA_API_KEY`. Для конфігурацій на основі хоста підійде будь-яке значення-заповнювач:

        ```bash
        # Хмара
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Лише локально
        export OLLAMA_API_KEY="ollama-local"

        # Або налаштуйте у своєму файлі конфігурації
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Перегляньте та встановіть свою модель">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Або встановіть модель за замовчуванням у конфігурації:

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
    `Cloud + Local` використовує доступний хост Ollama як контрольну точку і для локальних, і для хмарних моделей. Це рекомендований гібридний підхід Ollama.

    Використовуйте **Cloud + Local** під час налаштування. OpenClaw запитує базовий URL Ollama, виявляє локальні моделі з цього хоста та перевіряє, чи виконано вхід на хості для хмарного доступу через `ollama signin`. Якщо вхід на хості виконано, OpenClaw також пропонує стандартні розміщені хмарні моделі, такі як `kimi-k2.5:cloud`, `minimax-m2.7:cloud` і `glm-5.1:cloud`.

    Якщо вхід на хості ще не виконано, OpenClaw зберігає налаштування лише локальним, доки ви не запустите `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` працює через розміщений API Ollama за адресою `https://ollama.com`.

    Використовуйте **Cloud only** під час налаштування. OpenClaw запитує `OLLAMA_API_KEY`, установлює `baseUrl: "https://ollama.com"` і заповнює список розміщених хмарних моделей. Цей шлях **не** потребує локального сервера Ollama або `ollama signin`.

    Список хмарних моделей, показаний під час `openclaw onboard`, заповнюється в реальному часі з `https://ollama.com/api/tags` з обмеженням до 500 записів, тому засіб вибору відображає поточний розміщений каталог, а не статичний початковий список. Якщо `ollama.com` недоступний або не повертає моделей під час налаштування, OpenClaw повертається до попередніх жорстко закодованих рекомендацій, щоб початкове налаштування все одно завершилось.

  </Tab>

  <Tab title="Local only">
    У режимі лише локального використання OpenClaw виявляє моделі з налаштованого екземпляра Ollama. Цей шлях призначений для локальних або самостійно розміщених серверів Ollama.

    OpenClaw наразі пропонує `gemma4` як локальну модель за замовчуванням.

  </Tab>
</Tabs>

## Виявлення моделей (неявний провайдер)

Коли ви встановлюєте `OLLAMA_API_KEY` (або профіль автентифікації) і **не** визначаєте `models.providers.ollama`, OpenClaw виявляє моделі з локального екземпляра Ollama за адресою `http://127.0.0.1:11434`.

| Поведінка            | Докладно                                                                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Запит каталогу       | Виконує запити до `/api/tags`                                                                                                                                         |
| Визначення можливостей | Використовує best-effort запити до `/api/show`, щоб зчитати `contextWindow` і визначити можливості (зокрема vision)                                                |
| Vision-моделі        | Моделі з можливістю `vision`, про яку повідомляє `/api/show`, позначаються як такі, що підтримують зображення (`input: ["text", "image"]`), тому OpenClaw автоматично додає зображення до prompt |
| Визначення reasoning | Позначає `reasoning` за допомогою евристики імені моделі (`r1`, `reasoning`, `think`)                                                                                |
| Ліміти токенів       | Установлює `maxTokens` на стандартне максимальне обмеження токенів Ollama, яке використовує OpenClaw                                                                |
| Вартість             | Установлює всі значення вартості в `0`                                                                                                                                |

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

Нова модель буде автоматично виявлена й доступна для використання.

<Note>
Якщо ви явно задаєте `models.providers.ollama`, автовиявлення пропускається, і вам потрібно визначати моделі вручну. Дивіться розділ явної конфігурації нижче.
</Note>

## Vision і опис зображень

Вбудований Plugin Ollama реєструє Ollama як провайдера розуміння медіа, що підтримує зображення. Це дає змогу OpenClaw спрямовувати явні запити на опис зображень і налаштовані значення моделей зображень за замовчуванням через локальні або розміщені vision-моделі Ollama.

Для локального vision завантажте модель, що підтримує зображення:

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

`--model` має бути повним посиланням `<provider/model>`. Коли його встановлено, `openclaw infer image describe` запускає цю модель напряму замість пропуску опису, оскільки модель підтримує нативний vision.

Щоб зробити Ollama моделлю розуміння зображень за замовчуванням для вхідних медіа, налаштуйте `agents.defaults.imageModel`:

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

Якщо ви визначаєте `models.providers.ollama.models` вручну, позначте vision-моделі як такі, що підтримують вхідні зображення:

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw відхиляє запити на опис зображень для моделей, які не позначені як такі, що підтримують зображення. За неявного виявлення OpenClaw зчитує це з Ollama, коли `/api/show` повідомляє про можливість vision.

## Конфігурація

<Tabs>
  <Tab title="Базова (неявне виявлення)">
    Найпростіший спосіб увімкнути режим лише локального використання — через змінну середовища:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Якщо встановлено `OLLAMA_API_KEY`, ви можете не вказувати `apiKey` у записі провайдера, і OpenClaw підставить його для перевірок доступності.
    </Tip>

  </Tab>

  <Tab title="Явна (ручні моделі)">
    Використовуйте явну конфігурацію, якщо вам потрібне розміщене хмарне налаштування, Ollama працює на іншому хості/порту, ви хочете примусово встановити конкретні вікна контексту або списки моделей, або вам потрібні повністю ручні визначення моделей.

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
            api: "ollama", // Установіть явно, щоб гарантувати нативну поведінку виклику інструментів
          },
        },
      },
    }
    ```

    <Warning>
    Не додавайте `/v1` до URL. Шлях `/v1` використовує OpenAI-сумісний режим, у якому виклик інструментів працює ненадійно. Використовуйте базовий URL Ollama без суфікса шляху.
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

## Ollama Web Search

OpenClaw підтримує **Ollama Web Search** як вбудований провайдер `web_search`.

| Властивість | Докладно                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| Хост        | Використовує налаштований вами хост Ollama (`models.providers.ollama.baseUrl`, якщо задано, інакше `http://127.0.0.1:11434`) |
| Автентифікація | Без ключа                                                                                                        |
| Вимога      | Ollama має бути запущений, і вхід має бути виконаний через `ollama signin`                                        |

Виберіть **Ollama Web Search** під час `openclaw onboard` або `openclaw configure --section web`, або встановіть:

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
    **Виклик інструментів у OpenAI-сумісному режимі працює ненадійно.** Використовуйте цей режим лише тоді, коли вам потрібен формат OpenAI для проксі й ви не залежите від нативної поведінки виклику інструментів.
    </Warning>

    Якщо вам потрібно замість цього використовувати OpenAI-сумісну кінцеву точку (наприклад, за проксі, який підтримує лише формат OpenAI), явно встановіть `api: "openai-completions"`:

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // за замовчуванням: true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    У цьому режимі може не підтримуватися одночасно потокова передача та виклик інструментів. Вам може знадобитися вимкнути потокову передачу за допомогою `params: { streaming: false }` у конфігурації моделі.

    Коли `api: "openai-completions"` використовується з Ollama, OpenClaw за замовчуванням додає `options.num_ctx`, щоб Ollama не переходила мовчки до вікна контексту 4096. Якщо ваш проксі/апстрім відхиляє невідомі поля `options`, вимкніть цю поведінку:

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

  <Accordion title="Вікна контексту">
    Для автоматично виявлених моделей OpenClaw використовує вікно контексту, про яке повідомляє Ollama, якщо воно доступне; інакше використовується стандартне вікно контексту Ollama, яке застосовує OpenClaw.

    Ви можете перевизначити `contextWindow` і `maxTokens` у явній конфігурації провайдера:

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
              }
            ]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="Моделі reasoning">
    OpenClaw за замовчуванням вважає моделі з назвами на кшталт `deepseek-r1`, `reasoning` або `think` такими, що підтримують reasoning.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Додаткова конфігурація не потрібна — OpenClaw позначає їх автоматично.

  </Accordion>

  <Accordion title="Вартість моделей">
    Ollama є безплатною та працює локально, тому вартість усіх моделей встановлена на рівні $0. Це стосується як автоматично виявлених, так і вручну визначених моделей.
  </Accordion>

  <Accordion title="Вбудовування пам’яті">
    Вбудований Plugin Ollama реєструє провайдера вбудовувань пам’яті для
    [пошуку в пам’яті](/uk/concepts/memory). Він використовує налаштований базовий URL Ollama
    та API-ключ.

    | Властивість        | Значення            |
    | ------------------ | ------------------- |
    | Модель за замовчуванням | `nomic-embed-text`  |
    | Автозавантаження   | Так — модель вбудовувань автоматично завантажується локально, якщо її ще немає |

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
    Інтеграція Ollama в OpenClaw за замовчуванням використовує **нативний API Ollama** (`/api/chat`), який повністю підтримує одночасно потокову передачу та виклик інструментів. Жодної спеціальної конфігурації не потрібно.

    Для нативних запитів `/api/chat` OpenClaw також напряму передає керування thinking до Ollama: `/think off` і `openclaw agent --thinking off` надсилають верхньорівневе `think: false`, тоді як `/think low|medium|high` надсилають відповідний рядок рівня effort у верхньому рівні `think`. `/think max` відповідає найвищому нативному рівню effort в Ollama, `think: "high"`.

    <Tip>
    Якщо вам потрібно використовувати OpenAI-сумісну кінцеву точку, дивіться розділ "Застарілий OpenAI-сумісний режим" вище. У цьому режимі потокова передача та виклик інструментів можуть не працювати одночасно.
    </Tip>

  </Accordion>
</AccordionGroup>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Ollama не виявлено">
    Переконайтеся, що Ollama запущена, що ви встановили `OLLAMA_API_KEY` (або профіль автентифікації) і що ви **не** визначили явний запис `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Переконайтеся, що API доступний:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Немає доступних моделей">
    Якщо вашої моделі немає у списку, або завантажте її локально, або визначте її явно в `models.providers.ollama`.

    ```bash
    ollama list  # Подивитися, що встановлено
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Або іншу модель
    ```

  </Accordion>

  <Accordion title="У з’єднанні відмовлено">
    Перевірте, що Ollama запущена на правильному порту:

    ```bash
    # Перевірити, чи запущена Ollama
    ps aux | grep ollama

    # Або перезапустити Ollama
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
Додаткова допомога: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх провайдерів, посилань на моделі та поведінки перемикання при збоях.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/models" icon="brain">
    Як вибирати та налаштовувати моделі.
  </Card>
  <Card title="Ollama Web Search" href="/uk/tools/ollama-search" icon="magnifying-glass">
    Повні відомості про налаштування та поведінку вебпошуку на основі Ollama.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повна довідка з конфігурації.
  </Card>
</CardGroup>
