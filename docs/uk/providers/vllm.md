---
read_when:
    - Ви хочете запускати OpenClaw з локальним сервером vLLM
    - Вам потрібні сумісні з OpenAI кінцеві точки `/v1` із вашими власними моделями
summary: Запускайте OpenClaw з vLLM (локальним сервером, сумісним з OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-04-27T12:54:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: b638341b5138d085ed3fa781300216d5bae58b9d7e3a9edfe6cbdcdbc379c2ce
    source_path: providers/vllm.md
    workflow: 15
---

vLLM може обслуговувати open-source (і деякі користувацькі) моделі через **OpenAI-compatible** HTTP API. OpenClaw підключається до vLLM за допомогою API `openai-completions`.

OpenClaw також може **автоматично виявляти** доступні моделі з vLLM, якщо ви явно вмикаєте це через `VLLM_API_KEY` (підійде будь-яке значення, якщо ваш сервер не вимагає auth) і не визначаєте явний запис `models.providers.vllm`.

OpenClaw розглядає `vllm` як локального провайдера, сумісного з OpenAI, який підтримує
облік використання під час потокової передачі, тому лічильники токенів status/context можуть оновлюватися з
відповідей `stream_options.include_usage`.

| Властивість     | Значення                                 |
| --------------- | ---------------------------------------- |
| ID провайдера   | `vllm`                                   |
| API             | `openai-completions` (OpenAI-compatible) |
| Auth            | змінна середовища `VLLM_API_KEY`         |
| Типовий base URL | `http://127.0.0.1:8000/v1`              |

## Початок роботи

<Steps>
  <Step title="Запустіть vLLM із сервером, сумісним з OpenAI">
    Ваш base URL має надавати кінцеві точки `/v1` (наприклад `/v1/models`, `/v1/chat/completions`). vLLM зазвичай працює за адресою:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Установіть змінну середовища API-ключа">
    Підійде будь-яке значення, якщо ваш сервер не вимагає auth:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Виберіть модель">
    Замініть на один із ваших ідентифікаторів моделей vLLM:

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

Коли задано `VLLM_API_KEY` (або існує auth-профіль) і ви **не** визначаєте `models.providers.vllm`, OpenClaw запитує:

```
GET http://127.0.0.1:8000/v1/models
```

і перетворює повернуті ID на записи моделей.

<Note>
Якщо ви явно задаєте `models.providers.vllm`, автоматичне виявлення пропускається, і моделі доведеться визначати вручну.
</Note>

## Явна конфігурація (ручні моделі)

Використовуйте явну конфігурацію, коли:

- vLLM працює на іншому хості або порту
- Ви хочете зафіксувати значення `contextWindow` або `maxTokens`
- Ваш сервер вимагає справжній API-ключ (або ви хочете керувати заголовками)
- Ви підключаєтеся до довіреної кінцевої точки vLLM через loopback, LAN або Tailscale

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
  <Accordion title="Поведінка в стилі proxy">
    vLLM розглядається як backend `/v1`, сумісний з OpenAI, у стилі proxy, а не як нативна
    кінцева точка OpenAI. Це означає:

    | Поведінка | Застосовується? |
    |----------|----------|
    | Нативне формування запитів OpenAI | Ні |
    | `service_tier` | Не надсилається |
    | `store` у Responses | Не надсилається |
    | Підказки кешу prompt | Не надсилаються |
    | Формування payload сумісності reasoning OpenAI | Не застосовується |
    | Приховані заголовки attribution OpenClaw | Не додаються для користувацьких base URL |

  </Accordion>

  <Accordion title="Керування thinking для Qwen">
    Для моделей Qwen, що обслуговуються через vLLM, задайте
    `params.qwenThinkingFormat: "chat-template"` у записі моделі, якщо
    сервер очікує kwargs chat-template Qwen. OpenClaw зіставляє `/think off` з:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    Для рівнів thinking, відмінних від `off`, надсилається `enable_thinking: true`. Якщо ваша кінцева точка
    натомість очікує прапорці верхнього рівня в стилі DashScope, використовуйте
    `params.qwenThinkingFormat: "top-level"`, щоб надсилати `enable_thinking` у
    корені запиту. Також приймається snake_case `params.qwen_thinking_format`.

  </Accordion>

  <Accordion title="Керування thinking для Nemotron 3">
    vLLM/Nemotron 3 може використовувати kwargs chat-template, щоб керувати тим, чи reasoning
    повертається як приховане reasoning або як видимий текст відповіді. Коли сесія OpenClaw
    використовує `vllm/nemotron-3-*` з вимкненим thinking, комплектний плагін vLLM надсилає:

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

  <Accordion title="Виклики інструментів Qwen з’являються як текст">
    Спочатку переконайтеся, що vLLM було запущено з правильним parser tool-call і chat
    template для цієї моделі. Наприклад, документація vLLM вказує `hermes` для моделей Qwen2.5
    і `qwen3_xml` для моделей Qwen3-Coder.

    Симптоми:

    - Skills або інструменти ніколи не запускаються
    - помічник друкує сирий JSON/XML, наприклад `{"name":"read","arguments":...}`
    - vLLM повертає порожній масив `tool_calls`, коли OpenClaw надсилає
      `tool_choice: "auto"`

    Деякі комбінації Qwen/vLLM повертають структуровані виклики інструментів лише тоді, коли
    запит використовує `tool_choice: "required"`. Для таких записів моделей примусово задайте
    поле запиту, сумісне з OpenAI, через `params.extra_body`:

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

    Замініть `Qwen-Qwen2.5-Coder-32B-Instruct` на точний id, який повертає:

    ```bash
    openclaw models list --provider vllm
    ```

    Те саме перевизначення можна застосувати з CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Це workaround сумісності з явним дозволом. Він змушує кожен хід моделі з
    інструментами вимагати виклик інструмента, тому використовуйте його лише для окремого локального запису моделі,
    де така поведінка є прийнятною. Не використовуйте його як глобальне типове значення для всіх
    моделей vLLM і не використовуйте proxy, який бездумно перетворює довільний
    текст помічника на виконувані виклики інструментів.

  </Accordion>

  <Accordion title="Користувацький base URL">
    Якщо ваш сервер vLLM працює на нестандартному хості або порту, задайте `baseUrl` в явній конфігурації провайдера:

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
    Для великих локальних моделей, віддалених LAN-хостів або tailnet-з’єднань задайте
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

    `timeoutSeconds` застосовується лише до HTTP-запитів моделей vLLM, включно з
    установленням з’єднання, заголовками відповіді, потоковою передачею тіла та загальним
    аварійним перериванням guarded-fetch. Віддавайте перевагу цьому перед збільшенням
    `agents.defaults.timeoutSeconds`, який керує всім запуском агента.

  </Accordion>

  <Accordion title="Сервер недосяжний">
    Перевірте, що сервер vLLM запущено та він доступний:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Якщо ви бачите помилку з’єднання, перевірте хост, порт і те, що vLLM запущено в режимі сервера, сумісного з OpenAI.
    Для явних кінцевих точок loopback, LAN або Tailscale також задайте
    `models.providers.vllm.request.allowPrivateNetwork: true`; запити провайдера
    типово блокують URL приватної мережі, якщо провайдер
    не позначено явно як довірений.

  </Accordion>

  <Accordion title="Помилки auth у запитах">
    Якщо запити завершуються помилками auth, задайте справжній `VLLM_API_KEY`, який відповідає конфігурації вашого сервера, або налаштуйте провайдера явно в `models.providers.vllm`.

    <Tip>
    Якщо ваш сервер vLLM не вимагає auth, будь-яке непорожнє значення `VLLM_API_KEY` працює як сигнал явного дозволу для OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Моделі не виявлено">
    Автоматичне виявлення вимагає, щоб було задано `VLLM_API_KEY` **і** не було явного запису конфігурації `models.providers.vllm`. Якщо ви визначили провайдера вручну, OpenClaw пропускає виявлення та використовує лише ваші оголошені моделі.
  </Accordion>

  <Accordion title="Інструменти відображаються як сирий текст">
    Якщо модель Qwen друкує синтаксис інструментів JSON/XML замість виконання Skill,
    перегляньте вказівки щодо Qwen у розділі «Розширена конфігурація» вище. Зазвичай виправлення таке:

    - запустити vLLM з правильним parser/template для цієї моделі
    - підтвердити точний id моделі через `openclaw models list --provider vllm`
    - додати окреме перевизначення `params.extra_body.tool_choice: "required"`
      для конкретної моделі лише тоді, коли `tool_choice: "auto"` і далі повертає порожні або лише текстові
      виклики інструментів

  </Accordion>
</AccordionGroup>

<Warning>
Більше допомоги: [Troubleshooting](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінка failover.
  </Card>
  <Card title="OpenAI" href="/uk/providers/openai" icon="bolt">
    Нативний провайдер OpenAI і поведінка маршруту, сумісного з OpenAI.
  </Card>
  <Card title="OAuth і auth" href="/uk/gateway/authentication" icon="key">
    Деталі auth і правила повторного використання облікових даних.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та способи їх вирішення.
  </Card>
</CardGroup>
