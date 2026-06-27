---
read_when:
    - Ви хочете запустити OpenClaw із локальним сервером vLLM
    - Вам потрібні сумісні з OpenAI кінцеві точки /v1 із власними моделями
summary: Запустіть OpenClaw із vLLM (локальний сервер, сумісний з OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-06-27T18:15:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a3a5da5ce359bf62c44cddd0c97d2852d98c996ad6d44552a68d4aeb4d1d2893
    source_path: providers/vllm.md
    workflow: 16
---

vLLM може обслуговувати open-source (і деякі користувацькі) моделі через **OpenAI-сумісний** HTTP API. OpenClaw підключається до vLLM за допомогою API `openai-completions`.

OpenClaw також може **автоматично виявляти** доступні моделі з vLLM, коли ви вмикаєте це через `VLLM_API_KEY` (будь-яке значення працює, якщо ваш сервер не вимагає автентифікації). Використовуйте `vllm/*` в `agents.defaults.models`, щоб зберегти виявлення динамічним, коли ви також налаштовуєте користувацький базовий URL vLLM.

OpenClaw розглядає `vllm` як локального OpenAI-сумісного провайдера, що підтримує
потоковий облік використання, тому лічильники токенів статусу/контексту можуть оновлюватися з
відповідей `stream_options.include_usage`.

| Властивість      | Значення                                 |
| ---------------- | ---------------------------------------- |
| ID провайдера    | `vllm`                                   |
| API              | `openai-completions` (OpenAI-сумісний)   |
| Автентифікація   | змінна середовища `VLLM_API_KEY`         |
| Базовий URL за замовчуванням | `http://127.0.0.1:8000/v1`   |

## Початок роботи

<Steps>
  <Step title="Start vLLM with an OpenAI-compatible server">
    Ваш базовий URL має відкривати endpoints `/v1` (наприклад, `/v1/models`, `/v1/chat/completions`). vLLM зазвичай працює на:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Set the API key environment variable">
    Будь-яке значення працює, якщо ваш сервер не вимагає автентифікації:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Select a model">
    Замініть на один із ваших ID моделей vLLM:

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
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## Виявлення моделей (неявний провайдер)

Коли `VLLM_API_KEY` задано (або існує профіль автентифікації), і ви **не** визначаєте `models.providers.vllm`, OpenClaw надсилає запит до:

```
GET http://127.0.0.1:8000/v1/models
```

і перетворює повернуті ID на записи моделей.

<Note>
Якщо ви явно задаєте `models.providers.vllm`, OpenClaw за замовчуванням використовує оголошені вами моделі. Додайте `"vllm/*": {}` до `agents.defaults.models`, коли хочете, щоб OpenClaw опитував endpoint `/models` цього налаштованого провайдера й включав усі оголошені моделі vLLM.
</Note>

## Явна конфігурація (моделі вручну)

Використовуйте явну конфігурацію, коли:

- vLLM працює на іншому хості або порту
- Ви хочете зафіксувати значення `contextWindow` або `maxTokens`
- Ваш сервер потребує справжнього API-ключа (або ви хочете керувати заголовками)
- Ви підключаєтеся до довіреного loopback, LAN або Tailscale endpoint vLLM

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
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

Щоб зберегти цього провайдера динамічним без ручного переліку кожної моделі, додайте wildcard
провайдера до видимого каталогу моделей:

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
  <Accordion title="Proxy-style behavior">
    vLLM розглядається як proxy-style OpenAI-сумісний backend `/v1`, а не як нативний
    endpoint OpenAI. Це означає:

    | Поведінка | Застосовується? |
    |----------|----------|
    | Нативне формування запитів OpenAI | Ні |
    | `service_tier` | Не надсилається |
    | Responses `store` | Не надсилається |
    | Підказки prompt-cache | Не надсилаються |
    | Формування payload для OpenAI reasoning-compat | Не застосовується |
    | Приховані заголовки атрибуції OpenClaw | Не додаються для користувацьких базових URL |

  </Accordion>

  <Accordion title="Qwen thinking controls">
    Для моделей Qwen, що обслуговуються через vLLM, задайте
    `compat.thinkingFormat: "qwen-chat-template"` у рядку налаштованої моделі провайдера,
    коли сервер очікує kwargs chat-template Qwen. Моделі,
    налаштовані так, відкривають бінарний профіль `/think` (`off`, `on`), тому що
    thinking у шаблоні Qwen є прапорцем запиту увімкнено/вимкнено, а не сходинками effort
    у стилі OpenAI.

    ```json5
    {
      models: {
        providers: {
          vllm: {
            models: [
              {
                id: "Qwen/Qwen3-8B",
                name: "Qwen3 8B",
                reasoning: true,
                compat: { thinkingFormat: "qwen-chat-template" },
              },
            ],
          },
        },
      },
    }
    ```

    OpenClaw зіставляє `/think off` з:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    Рівні thinking, відмінні від `off`, надсилають `enable_thinking: true`. Якщо ваш endpoint
    натомість очікує прапорці верхнього рівня у стилі DashScope, використовуйте
    `compat.thinkingFormat: "qwen"`, щоб надсилати `enable_thinking` у корені
    запиту.

  </Accordion>

  <Accordion title="Nemotron 3 thinking controls">
    vLLM/Nemotron 3 може використовувати kwargs chat-template, щоб керувати тим, чи reasoning
    повертається як прихований reasoning або як видимий текст відповіді. Коли сесія OpenClaw
    використовує `vllm/nemotron-3-*` з вимкненим thinking, вбудований Plugin vLLM надсилає:

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

  <Accordion title="Qwen tool calls appear as text">
    Спершу переконайтеся, що vLLM запущено з правильним parser tool-call і chat
    template для моделі. Наприклад, vLLM документує `hermes` для моделей Qwen2.5
    і `qwen3_xml` для моделей Qwen3-Coder.

    Симптоми:

    - Skills або інструменти ніколи не запускаються
    - асистент друкує сирий JSON/XML, як-от `{"name":"read","arguments":...}`
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

    Замініть `Qwen-Qwen2.5-Coder-32B-Instruct` на точний id, повернутий командою:

    ```bash
    openclaw models list --provider vllm
    ```

    Ви можете застосувати той самий override з CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Це opt-in workaround для сумісності. Він змушує кожен хід моделі з
    інструментами вимагати виклик інструмента, тому використовуйте його лише для окремого запису локальної моделі,
    де така поведінка прийнятна. Не використовуйте його як глобальне значення за замовчуванням для всіх
    моделей vLLM і не використовуйте proxy, який сліпо перетворює довільний
    текст асистента на виконувані виклики інструментів.

  </Accordion>

  <Accordion title="Custom base URL">
    Якщо ваш сервер vLLM працює на нестандартному хості або порту, задайте `baseUrl` у явній конфігурації провайдера:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
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
  <Accordion title="Slow first response or remote server timeout">
    Для великих локальних моделей, віддалених хостів LAN або посилань tailnet задайте
    timeout запиту в області провайдера:

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` застосовується лише до HTTP-запитів моделей vLLM, включно з
    налаштуванням з’єднання, заголовками відповіді, потоковою передачею тіла та загальним
    перериванням guarded-fetch. Надавайте перевагу цьому перед збільшенням
    `agents.defaults.timeoutSeconds`, який керує всім запуском агента.

  </Accordion>

  <Accordion title="Server not reachable">
    Перевірте, що сервер vLLM запущений і доступний:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Якщо бачите помилку з’єднання, перевірте хост, порт і те, що vLLM запущено в OpenAI-сумісному серверному режимі.
    Для явних loopback, LAN або Tailscale endpoints OpenClaw довіряє
    точному origin налаштованого `models.providers.vllm.baseUrl` для guarded-запитів моделей.
    Metadata/link-local origins залишаються заблокованими без явного
    opt-in. Задавайте `models.providers.vllm.request.allowPrivateNetwork: true` лише
    коли запити vLLM мають досягати іншого приватного origin, і задавайте `false`,
    щоб відмовитися від довіри до точного origin.

  </Accordion>

  <Accordion title="Auth errors on requests">
    Якщо запити завершуються помилками автентифікації, задайте справжній `VLLM_API_KEY`, який відповідає конфігурації вашого сервера, або явно налаштуйте провайдера в `models.providers.vllm`.

    <Tip>
    Якщо ваш сервер vLLM не вимагає автентифікації, будь-яке непорожнє значення `VLLM_API_KEY` працює як opt-in сигнал для OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="No models discovered">
    Автоматичне виявлення вимагає, щоб `VLLM_API_KEY` було задано. Якщо ви визначили `models.providers.vllm`, OpenClaw використовує лише оголошені вами моделі, якщо `agents.defaults.models` не містить `"vllm/*": {}`.
  </Accordion>

  <Accordion title="Tools render as raw text">
    Якщо модель Qwen друкує синтаксис інструментів JSON/XML замість виконання Skills,
    перегляньте настанови щодо Qwen у розділі розширеної конфігурації вище. Звичайне виправлення:

    - запустіть vLLM з правильним parser/template для цієї моделі
    - підтвердьте точний id моделі за допомогою `openclaw models list --provider vllm`
    - додайте окремий override `params.extra_body.tool_choice: "required"` для конкретної моделі
      лише якщо `tool_choice: "auto"` усе ще повертає порожні або лише текстові
      виклики інструментів

  </Accordion>
</AccordionGroup>

<Warning>
Більше допомоги: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="OpenAI" href="/uk/providers/openai" icon="bolt">
    Власний провайдер OpenAI і поведінка маршруту, сумісного з OpenAI.
  </Card>
  <Card title="OAuth і автентифікація" href="/uk/gateway/authentication" icon="key">
    Відомості про автентифікацію та правила повторного використання облікових даних.
  </Card>
  <Card title="Усунення несправностей" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та способи їх вирішення.
  </Card>
</CardGroup>
