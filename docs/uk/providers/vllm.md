---
read_when:
    - Ви хочете запускати OpenClaw з локальним сервером vLLM
    - Ви хочете OpenAI-сумісні endpoint-и `/v1` зі своїми власними моделями
summary: Запускайте OpenClaw з vLLM (локальний сервер, сумісний з OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-27T11:03:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9a4a31ec0c3b1da4ebf811759b0b6a52f02cb248282e312f02095b1c0bdb39e5
    source_path: providers/vllm.md
    workflow: 15
---

vLLM може обслуговувати open-source (і деякі кастомні) моделі через **OpenAI-сумісний** HTTP API. OpenClaw підключається до vLLM через API `openai-completions`.

OpenClaw також може **автоматично виявляти** доступні моделі з vLLM, якщо ви явно погоджуєтеся на це через `VLLM_API_KEY` (підійде будь-яке значення, якщо ваш сервер не вимагає автентифікації) і не визначаєте явний запис `models.providers.vllm`.

OpenClaw розглядає `vllm` як локальний OpenAI-сумісний provider, який підтримує
облік використання в потоці, тому лічильники токенів статусу/контексту можуть оновлюватися з
відповідей `stream_options.include_usage`.

| Властивість      | Значення                                 |
| ---------------- | ---------------------------------------- |
| ID provider-а    | `vllm`                                   |
| API              | `openai-completions` (сумісний з OpenAI) |
| Автентифікація   | змінна середовища `VLLM_API_KEY`         |
| Типовий base URL | `http://127.0.0.1:8000/v1`               |

## Початок роботи

<Steps>
  <Step title="Запустіть vLLM із OpenAI-сумісним сервером">
    Ваш base URL має відкривати endpoint-и `/v1` (наприклад `/v1/models`, `/v1/chat/completions`). vLLM зазвичай працює на:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Установіть змінну середовища API-ключа">
    Підійде будь-яке значення, якщо ваш сервер не вимагає автентифікації:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Виберіть модель">
    Замініть на один із ID моделей вашого vLLM:

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
  <Step title="Переконайтеся, що модель доступна">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Виявлення моделей (неявний provider)

Коли встановлено `VLLM_API_KEY` (або існує профіль автентифікації) і ви **не** визначаєте `models.providers.vllm`, OpenClaw виконує запит:

```
GET http://127.0.0.1:8000/v1/models
```

і перетворює повернені ID на записи моделей.

<Note>
Якщо ви явно задаєте `models.providers.vllm`, автоматичне виявлення пропускається, і ви маєте визначати моделі вручну.
</Note>

## Явна конфігурація (ручне задання моделей)

Використовуйте явну конфігурацію, коли:

- vLLM працює на іншому хості або порту
- Ви хочете жорстко задати значення `contextWindow` або `maxTokens`
- Ваш сервер вимагає реального API-ключа (або ви хочете контролювати заголовки)
- Ви підключаєтеся до довіреного loopback, LAN або endpoint-а vLLM у Tailscale

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        timeoutSeconds: 300, // Необов’язково: збільшити тайм-аут підключення/заголовків/тіла/запиту для повільних локальних моделей
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

## Розширена конфігурація

<AccordionGroup>
  <Accordion title="Поведінка в стилі проксі">
    vLLM розглядається як OpenAI-сумісний бекенд `/v1` у стилі проксі, а не як нативний
    endpoint OpenAI. Це означає:

    | Поведінка | Застосовується? |
    |----------|-----------------|
    | Нативне формування запитів OpenAI | Ні |
    | `service_tier` | Не надсилається |
    | `store` у Responses | Не надсилається |
    | Підказки кешу промптів | Не надсилаються |
    | Формування payload для сумісності з reasoning OpenAI | Не застосовується |
    | Приховані заголовки атрибуції OpenClaw | Не інжектуються в кастомні base URL |

  </Accordion>

  <Accordion title="Керування thinking у Qwen">
    Для моделей Qwen, які обслуговуються через vLLM, установіть
    `params.qwenThinkingFormat: "chat-template"` у записі моделі, коли
    сервер очікує kwargs шаблону чату Qwen. OpenClaw зіставляє `/think off` з:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    Для рівнів thinking, відмінних від `off`, надсилається `enable_thinking: true`. Якщо ваш endpoint
    замість цього очікує прапорці верхнього рівня в стилі DashScope, використовуйте
    `params.qwenThinkingFormat: "top-level"`, щоб надсилати `enable_thinking` у
    корінь запиту. Варіант snake_case `params.qwen_thinking_format` також підтримується.

  </Accordion>

  <Accordion title="Керування thinking у Nemotron 3">
    vLLM/Nemotron 3 може використовувати kwargs шаблону чату для керування тим, чи reasoning
    повертається як приховане reasoning чи як видимий текст відповіді. Коли сесія OpenClaw
    використовує `vllm/nemotron-3-*` з вимкненим thinking, OpenClaw надсилає:

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
    остаточний пріоритет, оскільки `extra_body` є останнім перевизначенням тіла запиту.

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

  <Accordion title="Виклики tools у Qwen з’являються як текст">
    Спочатку переконайтеся, що vLLM запущено з правильним парсером викликів tools і шаблоном чату
    для цієї моделі. Наприклад, документація vLLM вказує `hermes` для моделей Qwen2.5
    і `qwen3_xml` для моделей Qwen3-Coder.

    Симптоми:

    - skills або tools ніколи не запускаються
    - асистент друкує сирий JSON/XML, наприклад `{"name":"read","arguments":...}`
    - vLLM повертає порожній масив `tool_calls`, коли OpenClaw надсилає
      `tool_choice: "auto"`

    Деякі комбінації Qwen/vLLM повертають структуровані виклики tools лише тоді, коли
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

    Замініть `Qwen-Qwen2.5-Coder-32B-Instruct` на точний id, повернутий командою:

    ```bash
    openclaw models list --provider vllm
    ```

    Ви можете застосувати те саме перевизначення через CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Це сумісний обхідний шлях із явним увімкненням. Він змушує кожен хід моделі з
    tools вимагати виклику tool, тому використовуйте його лише для окремого запису локальної моделі,
    де така поведінка прийнятна. Не використовуйте його як глобальне типове значення для всіх
    моделей vLLM і не використовуйте проксі, який сліпо перетворює довільний
    текст асистента на виконувані виклики tools.

  </Accordion>

  <Accordion title="Кастомний base URL">
    Якщо ваш сервер vLLM працює на нестандартному хості або порту, задайте `baseUrl` у явній конфігурації provider-а:

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
    Для великих локальних моделей, віддалених LAN-хостів або посилань tailnet задайте
    тайм-аут запиту в межах provider-а:

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
    установленням з’єднання, заголовками відповіді, потоковою передачею тіла та загальним
    перериванням guarded fetch. Віддавайте цьому перевагу перед збільшенням
    `agents.defaults.timeoutSeconds`, який керує всім запуском агента.

  </Accordion>

  <Accordion title="Сервер недоступний">
    Перевірте, що сервер vLLM запущено й він доступний:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Якщо ви бачите помилку з’єднання, перевірте хост, порт і те, що vLLM запущено в режимі OpenAI-сумісного сервера.
    Для явних endpoint-ів loopback, LAN або Tailscale також задайте
    `models.providers.vllm.request.allowPrivateNetwork: true`; запити provider-а
    типово блокують URL-адреси приватної мережі, якщо provider не є
    явно довіреним.

  </Accordion>

  <Accordion title="Помилки автентифікації в запитах">
    Якщо запити завершуються помилками автентифікації, задайте реальний `VLLM_API_KEY`, що відповідає конфігурації вашого сервера, або явно налаштуйте provider у `models.providers.vllm`.

    <Tip>
    Якщо ваш сервер vLLM не вимагає автентифікації, будь-яке непорожнє значення `VLLM_API_KEY` працює як сигнал явної згоди для OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Моделі не виявляються">
    Автоматичне виявлення вимагає, щоб `VLLM_API_KEY` був заданий **і** не було явного запису `models.providers.vllm` у конфігурації. Якщо ви визначили provider вручну, OpenClaw пропускає виявлення і використовує лише ваші оголошені моделі.
  </Accordion>

  <Accordion title="Tools відображаються як сирий текст">
    Якщо модель Qwen друкує синтаксис JSON/XML tools замість виконання skill,
    перевірте рекомендації щодо Qwen у розділі розширеної конфігурації вище. Зазвичай виправлення таке:

    - запустити vLLM із правильним парсером/шаблоном для цієї моделі
    - підтвердити точний id моделі командою `openclaw models list --provider vllm`
    - додати окреме перевизначення `params.extra_body.tool_choice: "required"` для конкретної моделі
      лише якщо `tool_choice: "auto"` усе ще повертає порожні або лише текстові
      виклики tools

  </Accordion>
</AccordionGroup>

<Warning>
Додаткова допомога: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір provider-ів, посилань на моделі та поведінки при перемиканні через збій.
  </Card>
  <Card title="OpenAI" href="/uk/providers/openai" icon="bolt">
    Нативний provider OpenAI і поведінка OpenAI-сумісних маршрутів.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Докладно про автентифікацію та правила повторного використання облікових даних.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та способи їх вирішення.
  </Card>
</CardGroup>
