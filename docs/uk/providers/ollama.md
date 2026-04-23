---
read_when:
    - Ви хочете запускати OpenClaw з хмарними або локальними моделями через Ollama
    - Вам потрібні вказівки щодо налаштування та конфігурації Ollama
    - Ви хочете моделі Ollama з підтримкою vision для розуміння зображень
summary: Запустити OpenClaw з Ollama (хмарні та локальні моделі)
title: Ollama
x-i18n:
    generated_at: "2026-04-23T21:07:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9595459cc32ff81332b09a81388f84059f48e86039170078fd7f30ccd9b4e1f5
    source_path: providers/ollama.md
    workflow: 15
---

OpenClaw інтегрується з нативним API Ollama (`/api/chat`) для хмарних моделей і локальних/self-hosted серверів Ollama. Ви можете використовувати Ollama у трьох режимах: `Cloud + Local` через досяжний хост Ollama, `Cloud only` проти `https://ollama.com`, або `Local only` проти досяжного хоста Ollama.

<Warning>
**Користувачі віддаленого Ollama**: не використовуйте з OpenClaw URL `/v1`, сумісний з OpenAI (`http://host:11434/v1`). Це ламає виклики інструментів, і моделі можуть виводити сирий JSON інструментів як звичайний текст. Використовуйте натомість нативний URL API Ollama: `baseUrl: "http://host:11434"` (без `/v1`).
</Warning>

## Початок роботи

Виберіть бажаний спосіб налаштування та режим.

<Tabs>
  <Tab title="Onboarding (рекомендовано)">
    **Найкраще для:** найшвидшого шляху до робочого хмарного або локального налаштування Ollama.

    <Steps>
      <Step title="Запустіть onboarding">
        ```bash
        openclaw onboard
        ```

        Виберіть **Ollama** зі списку провайдерів.
      </Step>
      <Step title="Виберіть режим">
        - **Cloud + Local** — локальний хост Ollama плюс хмарні моделі, маршрутизовані через цей хост
        - **Cloud only** — хмарні моделі Ollama через `https://ollama.com`
        - **Local only** — лише локальні моделі
      </Step>
      <Step title="Виберіть модель">
        `Cloud only` запитує `OLLAMA_API_KEY` і пропонує типові хмарні значення. `Cloud + Local` і `Local only` запитують base URL Ollama, виявляють доступні моделі та автоматично виконують pull вибраної локальної моделі, якщо її ще немає. `Cloud + Local` також перевіряє, чи виконано вхід на цьому хості Ollama для хмарного доступу.
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

    За бажанням можна вказати користувацький base URL або модель:

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
        - **Cloud + Local**: установіть Ollama, увійдіть через `ollama signin` і маршрутизуйте хмарні запити через цей хост
        - **Cloud only**: використовуйте `https://ollama.com` з `OLLAMA_API_KEY`
        - **Local only**: установіть Ollama з [ollama.com/download](https://ollama.com/download)
      </Step>
      <Step title="Виконайте pull локальної моделі (лише local)">
        ```bash
        ollama pull gemma4
        # or
        ollama pull gpt-oss:20b
        # or
        ollama pull llama3.3
        ```
      </Step>
      <Step title="Увімкніть Ollama для OpenClaw">
        Для `Cloud only` використовуйте справжній `OLLAMA_API_KEY`. Для варіантів, що працюють через хост, підійде будь-яке placeholder-значення:

        ```bash
        # Cloud
        export OLLAMA_API_KEY="your-ollama-api-key"

        # Local-only
        export OLLAMA_API_KEY="ollama-local"

        # Or configure in your config file
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="Перегляньте й задайте модель">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        Або задайте типову модель у config:

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
    `Cloud + Local` використовує досяжний хост Ollama як контрольну точку і для локальних, і для хмарних моделей. Це рекомендований Ollama гібридний потік.

    Під час налаштування виберіть **Cloud + Local**. OpenClaw запитує base URL Ollama, виявляє локальні моделі з цього хоста та перевіряє, чи виконано вхід на хості для хмарного доступу через `ollama signin`. Коли вхід на хості виконано, OpenClaw також пропонує типові хмарні моделі, такі як `kimi-k2.5:cloud`, `minimax-m2.7:cloud` і `glm-5.1:cloud`.

    Якщо на хості ще не виконано вхід, OpenClaw залишає налаштування лише локальним, доки ви не виконаєте `ollama signin`.

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` працює з хмарним API Ollama за адресою `https://ollama.com`.

    Під час налаштування виберіть **Cloud only**. OpenClaw запитує `OLLAMA_API_KEY`, задає `baseUrl: "https://ollama.com"` і ініціалізує список хмарних моделей. Цей шлях **не** потребує локального сервера Ollama або `ollama signin`.

    Список хмарних моделей, який показується під час `openclaw onboard`, заповнюється в реальному часі з `https://ollama.com/api/tags`, з обмеженням у 500 записів, тому picker відображає актуальний хмарний каталог, а не статичний початковий список. Якщо `ollama.com` недоступний або не повертає моделей під час налаштування, OpenClaw повертається до попередніх жорстко заданих пропозицій, щоб onboarding усе одно завершився.

  </Tab>

  <Tab title="Local only">
    У режимі лише local OpenClaw виявляє моделі з налаштованого екземпляра Ollama. Цей шлях призначено для локальних або self-hosted серверів Ollama.

    Наразі OpenClaw пропонує `gemma4` як типову локальну модель.

  </Tab>
</Tabs>

## Виявлення моделей (неявний провайдер)

Коли ви задаєте `OLLAMA_API_KEY` (або auth profile) і **не** визначаєте `models.providers.ollama`, OpenClaw виявляє моделі з локального екземпляра Ollama за адресою `http://127.0.0.1:11434`.

| Поведінка            | Деталі                                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Запит каталогу       | Опитує `/api/tags`                                                                                                                                                 |
| Виявлення можливостей | Використовує best-effort запити до `/api/show`, щоб прочитати `contextWindow` і визначити можливості (включно з vision)                                            |
| Vision-моделі        | Моделі з можливістю `vision`, яку повертає `/api/show`, позначаються як такі, що підтримують зображення (`input: ["text", "image"]`), тому OpenClaw автоматично ін’єктує зображення в prompt |
| Виявлення reasoning  | Позначає `reasoning` за евристикою назви моделі (`r1`, `reasoning`, `think`)                                                                                       |
| Ліміти токенів       | Установлює `maxTokens` на типове обмеження max-token Ollama, яке використовує OpenClaw                                                                             |
| Вартість             | Усі значення вартості встановлюються в `0`                                                                                                                         |

Це дає змогу уникнути ручного додавання записів моделей, зберігаючи узгодженість каталогу з локальним екземпляром Ollama.

```bash
# See what models are available
ollama list
openclaw models list
```

Щоб додати нову модель, просто виконайте її pull через Ollama:

```bash
ollama pull mistral
```

Нова модель буде автоматично виявлена й доступна для використання.

<Note>
Якщо ви явно задаєте `models.providers.ollama`, автовиявлення пропускається, і моделі потрібно визначати вручну. Див. розділ про явну config нижче.
</Note>

## Vision і опис зображень

Вбудований plugin Ollama реєструє Ollama як provider розуміння медіа з підтримкою зображень. Це дає OpenClaw змогу маршрутизувати явні запити на опис зображень і налаштовані типові значення image-model через локальні або хмарні vision-моделі Ollama.

Для локального vision виконайте pull моделі, що підтримує зображення:

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

Потім перевірте через CLI infer:

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` має бути повним посиланням `<provider/model>`. Коли його задано, `openclaw infer image describe` запускає цю модель напряму замість пропуску опису через те, що модель уже нативно підтримує vision.

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

Якщо ви визначаєте `models.providers.ollama.models` вручну, позначайте vision-моделі як такі, що підтримують зображення:

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
    Найпростіший шлях увімкнення режиму лише local — через змінну середовища:

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    Якщо задано `OLLAMA_API_KEY`, можна не вказувати `apiKey` у записі провайдера, і OpenClaw сам підставить його для перевірок доступності.
    </Tip>

  </Tab>

  <Tab title="Явна (ручні моделі)">
    Використовуйте явну config, коли вам потрібне хмарне налаштування, Ollama працює на іншому хості/порту, ви хочете примусово задати конкретні context window або списки моделей, або вам потрібні повністю ручні визначення моделей.

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

  <Tab title="Користувацький base URL">
    Якщо Ollama працює на іншому хості або порту (явна config вимикає автовиявлення, тому моделі потрібно визначити вручну):

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
    Не додавайте `/v1` до URL. Шлях `/v1` використовує OpenAI-compatible mode, де виклики інструментів ненадійні. Використовуйте базовий URL Ollama без суфікса шляху.
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

## Ollama Web Search

OpenClaw підтримує **Ollama Web Search** як вбудований provider `web_search`.

| Властивість | Деталі                                                                                                            |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| Хост        | Використовує ваш налаштований хост Ollama (`models.providers.ollama.baseUrl`, якщо задано, інакше `http://127.0.0.1:11434`) |
| Auth        | Ключ не потрібен                                                                                                  |
| Вимога      | Ollama має працювати, і потрібно виконати вхід через `ollama signin`                                             |

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
  <Accordion title="Застарілий OpenAI-compatible mode">
    <Warning>
    **Виклики інструментів ненадійні в OpenAI-compatible mode.** Використовуйте цей режим лише тоді, коли вам потрібен формат OpenAI для proxy і ви не залежите від нативної поведінки викликів інструментів.
    </Warning>

    Якщо вам потрібно використовувати натомість OpenAI-compatible endpoint (наприклад, за proxy, який підтримує лише формат OpenAI), явно задайте `api: "openai-completions"`:

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

    У цьому режимі може не підтримуватися одночасно і streaming, і виклики інструментів. Може знадобитися вимкнути streaming через `params: { streaming: false }` у config моделі.

    Коли `api: "openai-completions"` використовується з Ollama, OpenClaw типово ін’єктує `options.num_ctx`, щоб Ollama не переходив мовчки до context window 4096. Якщо ваш proxy/upstream відхиляє невідомі поля `options`, вимкніть цю поведінку:

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
    Для автоматично виявлених моделей OpenClaw використовує context window, повідомлений Ollama, коли він доступний; інакше повертається до типового context window Ollama, який використовує OpenClaw.

    Ви можете перевизначити `contextWindow` і `maxTokens` в явній config провайдера:

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

  <Accordion title="Reasoning models">
    OpenClaw типово вважає моделі з назвами на кшталт `deepseek-r1`, `reasoning` або `think` такими, що підтримують reasoning.

    ```bash
    ollama pull deepseek-r1:32b
    ```

    Додаткова конфігурація не потрібна — OpenClaw позначає їх автоматично.

  </Accordion>

  <Accordion title="Вартість моделей">
    Ollama безкоштовний і працює локально, тому для всіх моделей вартість встановлюється в $0. Це стосується як автоматично виявлених, так і вручну визначених моделей.
  </Accordion>

  <Accordion title="Memory embeddings">
    Вбудований plugin Ollama реєструє provider embeddings для пам’яті для
    [пошуку пам’яті](/uk/concepts/memory). Він використовує налаштовані base URL
    та API-ключ Ollama.

    | Властивість    | Значення            |
    | -------------- | ------------------- |
    | Типова модель  | `nomic-embed-text`  |
    | Auto-pull      | Так — embedding-модель автоматично виконує pull, якщо локально її немає |

    Щоб вибрати Ollama як provider embeddings для пошуку пам’яті:

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

  <Accordion title="Конфігурація streaming">
    Інтеграція Ollama в OpenClaw типово використовує **нативний API Ollama** (`/api/chat`), який повністю підтримує одночасно streaming і виклики інструментів. Спеціальна конфігурація не потрібна.

    Для нативних запитів `/api/chat` OpenClaw також напряму передає керування thinking до Ollama: `/think off` і `openclaw agent --thinking off` надсилають верхньорівневий `think: false`, тоді як рівні thinking, відмінні від `off`, надсилають `think: true`.

    <Tip>
    Якщо вам потрібно використовувати OpenAI-compatible endpoint, див. розділ "Застарілий OpenAI-compatible mode" вище. У цьому режимі streaming і виклики інструментів можуть не працювати одночасно.
    </Tip>

  </Accordion>
</AccordionGroup>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Ollama не виявляється">
    Переконайтеся, що Ollama працює, що ви задали `OLLAMA_API_KEY` (або auth profile) і що ви **не** визначили явний запис `models.providers.ollama`:

    ```bash
    ollama serve
    ```

    Перевірте, що API доступне:

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="Немає доступних моделей">
    Якщо вашої моделі немає у списку, виконайте її локальний pull або явно визначте її в `models.providers.ollama`.

    ```bash
    ollama list  # See what's installed
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # Or another model
    ```

  </Accordion>

  <Accordion title="Connection refused">
    Переконайтеся, що Ollama працює на правильному порту:

    ```bash
    # Check if Ollama is running
    ps aux | grep ollama

    # Or restart Ollama
    ollama serve
    ```

  </Accordion>
</AccordionGroup>

<Note>
Більше допомоги: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Note>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Огляд усіх провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="Вибір моделі" href="/uk/concepts/models" icon="brain">
    Як вибирати й налаштовувати моделі.
  </Card>
  <Card title="Ollama Web Search" href="/uk/tools/ollama-search" icon="magnifying-glass">
    Повні відомості про налаштування та поведінку web search на базі Ollama.
  </Card>
  <Card title="Конфігурація" href="/uk/gateway/configuration" icon="gear">
    Повний довідник із конфігурації.
  </Card>
</CardGroup>
