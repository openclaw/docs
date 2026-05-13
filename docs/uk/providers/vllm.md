---
read_when:
    - Ви хочете запустити OpenClaw з локальним сервером vLLM
    - Вам потрібні сумісні з OpenAI ендпоїнти /v1 із власними моделями
summary: Запуск OpenClaw із vLLM (локальний сервер, сумісний з OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-05-13T05:34:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3b58fc0694fa9629ae87b6958d1ab39e484d468e6f92346f39f55316dbc09a04
    source_path: providers/vllm.md
    workflow: 16
---

vLLM може обслуговувати моделі з відкритим кодом (і деякі кастомні) через **OpenAI-сумісний** HTTP API. OpenClaw підключається до vLLM за допомогою API `openai-completions`.

OpenClaw також може **автоматично виявляти** доступні моделі з vLLM, коли ви вмикаєте це через `VLLM_API_KEY` (будь-яке значення працює, якщо ваш сервер не вимагає автентифікації). Використовуйте `vllm/*` у `agents.defaults.models`, щоб виявлення залишалося динамічним, коли ви також налаштовуєте кастомний базовий URL vLLM.

OpenClaw розглядає `vllm` як локального OpenAI-сумісного провайдера, який підтримує
потоковий облік використання, тому лічильники токенів статусу/контексту можуть оновлюватися з
відповідей `stream_options.include_usage`.

| Властивість      | Значення                                 |
| ---------------- | ---------------------------------------- |
| ID провайдера    | `vllm`                                   |
| API              | `openai-completions` (OpenAI-сумісний)   |
| Автентифікація   | змінна середовища `VLLM_API_KEY`         |
| Базовий URL за замовчуванням | `http://127.0.0.1:8000/v1`     |

## Початок роботи

<Steps>
  <Step title="Запустіть vLLM з OpenAI-сумісним сервером">
    Ваш базовий URL має надавати ендпоінти `/v1` (наприклад, `/v1/models`, `/v1/chat/completions`). vLLM зазвичай працює на:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Задайте змінну середовища ключа API">
    Будь-яке значення працює, якщо ваш сервер не вимагає автентифікації:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Виберіть модель">
    Замініть на один з ID ваших моделей vLLM:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="Перевірте, що модель доступна">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Виявлення моделей (неявний провайдер)

Коли `VLLM_API_KEY` задано (або існує профіль автентифікації) і ви **не** визначаєте `models.providers.vllm`, OpenClaw запитує:

```
GET http://127.0.0.1:8000/v1/models
```

і перетворює повернуті ID на записи моделей.

<Note>
Якщо ви явно задаєте `models.providers.vllm`, OpenClaw за замовчуванням використовує оголошені вами моделі. Додайте `"vllm/*": {}` до `agents.defaults.models`, коли хочете, щоб OpenClaw запитував ендпоінт `/models` цього налаштованого провайдера і включав усі оголошені моделі vLLM.
</Note>

## Явна конфігурація (ручні моделі)

Використовуйте явну конфігурацію, коли:

- vLLM працює на іншому хості або порту
- Ви хочете закріпити значення `contextWindow` або `maxTokens`
- Ваш сервер вимагає справжній ключ API (або ви хочете керувати заголовками)
- Ви підключаєтеся до довіреного loopback, LAN або Tailscale ендпоінта vLLM

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        timeoutSeconds: 300, // Optional: extend connect/header/body/request timeout for slow local models
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Щоб цей провайдер залишався динамічним без ручного перелічення кожної моделі, додайте
шаблон провайдера до видимого каталогу моделей:

```json5
{
  agents: {
    defaults: {
      models: {
        "vllm/*": {},
      },
    },
  },
}
```

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Поведінка у стилі проксі">
    vLLM розглядається як проксі-стиль OpenAI-сумісного бекенда `/v1`, а не як нативний
    ендпоінт OpenAI. Це означає:

    | Поведінка | Застосовується? |
    |----------|----------|
    | Нативне формування запитів OpenAI | Ні |
    | `service_tier` | Не надсилається |
    | Responses `store` | Не надсилається |
    | Підказки prompt-cache | Не надсилаються |
    | Формування payload для сумісності з reasoning OpenAI | Не застосовується |
    | Приховані заголовки атрибуції OpenClaw | Не вставляються для кастомних базових URL |

  </Accordion>

  <Accordion title="Елементи керування мисленням Qwen">
    Для моделей Qwen, що обслуговуються через vLLM, задайте
    `params.qwenThinkingFormat: "chat-template"` у записі моделі, коли
    сервер очікує Qwen chat-template kwargs. OpenClaw зіставляє `/think off` з:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    Рівні мислення, відмінні від `off`, надсилають `enable_thinking: true`. Якщо ваш ендпоінт
    натомість очікує прапорці верхнього рівня у стилі DashScope, використовуйте
    `params.qwenThinkingFormat: "top-level"`, щоб надсилати `enable_thinking` у корені
    запиту. Snake-case `params.qwen_thinking_format` також приймається.

  </Accordion>

  <Accordion title="Елементи керування мисленням Nemotron 3">
    vLLM/Nemotron 3 може використовувати chat-template kwargs, щоб керувати, чи reasoning
    повертається як прихований reasoning або видимий текст відповіді. Коли сесія OpenClaw
    використовує `vllm/nemotron-3-*` з вимкненим мисленням, вбудований vLLM plugin надсилає:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Щоб налаштувати ці значення, задайте `chat_template_kwargs` у параметрах моделі.
    Якщо ви також задаєте `params.extra_body.chat_template_kwargs`, це значення має
    остаточний пріоритет, тому що `extra_body` є останнім override тіла запиту.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/nemotron-3-super": {
              params: {
                chat_template_kwargs: {
                  enable_thinking: false,
                  force_nonempty_content: true,
                },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Виклики інструментів Qwen відображаються як текст">
    Спершу переконайтеся, що vLLM було запущено з правильним парсером викликів інструментів і chat
    template для моделі. Наприклад, vLLM документує `hermes` для моделей Qwen2.5
    і `qwen3_xml` для моделей Qwen3-Coder.

    Симптоми:

    - skills або інструменти ніколи не запускаються
    - асистент друкує сирий JSON/XML, наприклад `{"name":"read","arguments":...}`
    - vLLM повертає порожній масив `tool_calls`, коли OpenClaw надсилає
      `tool_choice: "auto"`

    Деякі комбінації Qwen/vLLM повертають структуровані виклики інструментів лише тоді, коли
    запит використовує `tool_choice: "required"`. Для таких записів моделей примусово задайте
    OpenAI-сумісне поле запиту через `params.extra_body`:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/Qwen-Qwen2.5-Coder-32B-Instruct": {
              params: {
                extra_body: {
                  tool_choice: "required",
                },
              },
            },
          },
        },
      },
    }
    ```

    Замініть `Qwen-Qwen2.5-Coder-32B-Instruct` точним id, повернутим командою:

    ```bash
    openclaw models list --provider vllm
    ```

    Ви можете застосувати той самий override з CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Це opt-in обхід сумісності. Він змушує кожен хід моделі з
    інструментами вимагати виклик інструмента, тому використовуйте його лише для окремого локального запису моделі,
    де така поведінка прийнятна. Не використовуйте його як глобальне значення за замовчуванням для всіх
    моделей vLLM і не використовуйте проксі, який сліпо перетворює довільний
    текст асистента на виконувані виклики інструментів.

  </Accordion>

  <Accordion title="Кастомний базовий URL">
    Якщо ваш сервер vLLM працює на нестандартному хості або порту, задайте `baseUrl` у явній конфігурації провайдера:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Усунення несправностей

<AccordionGroup>
  <Accordion title="Повільна перша відповідь або тайм-аут віддаленого сервера">
    Для великих локальних моделей, віддалених хостів LAN або tailnet-посилань задайте
    тайм-аут запиту в межах провайдера:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` застосовується лише до HTTP-запитів моделі vLLM, включно з
    налаштуванням з'єднання, заголовками відповіді, потоковою передачею тіла та загальним
    guarded-fetch abort. Віддавайте перевагу цьому перед збільшенням
    `agents.defaults.timeoutSeconds`, яке керує всім запуском агента.

  </Accordion>

  <Accordion title="Сервер недоступний">
    Перевірте, що сервер vLLM запущений і доступний:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Якщо ви бачите помилку з'єднання, перевірте хост, порт і те, що vLLM запущено в OpenAI-сумісному серверному режимі.
    Для явних loopback, LAN або Tailscale ендпоінтів також задайте
    `models.providers.vllm.request.allowPrivateNetwork: true`; запити провайдера
    за замовчуванням блокують URL приватної мережі, якщо провайдер
    не є явно довіреним.

  </Accordion>

  <Accordion title="Помилки автентифікації в запитах">
    Якщо запити завершуються помилками автентифікації, задайте справжній `VLLM_API_KEY`, який відповідає конфігурації вашого сервера, або явно налаштуйте провайдера в `models.providers.vllm`.

    <Tip>
    Якщо ваш сервер vLLM не вимагає автентифікації, будь-яке непорожнє значення `VLLM_API_KEY` працює як opt-in сигнал для OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Моделі не виявлено">
    Автоматичне виявлення потребує заданого `VLLM_API_KEY`. Якщо ви визначили `models.providers.vllm`, OpenClaw використовує лише оголошені вами моделі, якщо `agents.defaults.models` не містить `"vllm/*": {}`.
  </Accordion>

  <Accordion title="Інструменти відображаються як сирий текст">
    Якщо модель Qwen друкує JSON/XML-синтаксис інструментів замість виконання skill,
    перегляньте настанови Qwen у розділі Розширена конфігурація вище. Звичайне виправлення:

    - запустіть vLLM з правильним парсером/шаблоном для цієї моделі
    - підтвердьте точний id моделі за допомогою `openclaw models list --provider vllm`
    - додайте окремий для моделі override `params.extra_body.tool_choice: "required"`
      лише якщо `tool_choice: "auto"` усе ще повертає порожні або лише текстові
      виклики інструментів

  </Accordion>
</AccordionGroup>

<Warning>
Додаткова допомога: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Warning>

## Пов'язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки failover.
  </Card>
  <Card title="OpenAI" href="/uk/providers/openai" icon="bolt">
    Нативний провайдер OpenAI і поведінка OpenAI-сумісного маршруту.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Подробиці автентифікації та правила повторного використання облікових даних.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та способи їх вирішення.
  </Card>
</CardGroup>
