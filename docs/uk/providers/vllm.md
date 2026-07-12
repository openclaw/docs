---
read_when:
    - Ви хочете запустити OpenClaw із локальним сервером vLLM
    - Вам потрібні сумісні з OpenAI кінцеві точки /v1 із власними моделями
summary: Запуск OpenClaw із vLLM (локальним сервером, сумісним з OpenAI)
title: vLLM
x-i18n:
    generated_at: "2026-07-12T13:44:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 98d1044c0a82efb6c9937e961d765d0cfcea8664cbaa043168921b457756512c
    source_path: providers/vllm.md
    workflow: 16
---

vLLM надає моделі з відкритим кодом (і деякі користувацькі моделі) через HTTP API, **сумісний з OpenAI**. OpenClaw підключається за допомогою API `openai-completions` і може **автоматично виявляти** моделі, якщо ви погодитеся на це, задавши `VLLM_API_KEY`.

| Властивість             | Значення                                           |
| ----------------------- | -------------------------------------------------- |
| Ідентифікатор провайдера | `vllm`                                             |
| API                     | `openai-completions` (сумісний з OpenAI)           |
| Автентифікація          | змінна середовища `VLLM_API_KEY`                   |
| Базова URL-адреса за замовчуванням | `http://127.0.0.1:8000/v1`              |
| Використання потокового передавання | Підтримується (`stream_options.include_usage`) |

## Початок роботи

<Steps>
  <Step title="Start vLLM with an OpenAI-compatible server">
    Ваша базова URL-адреса має надавати кінцеві точки `/v1` (`/v1/models`, `/v1/chat/completions`). Зазвичай vLLM працює за адресою:

    ```text
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Set the API key environment variable">
    Якщо ваш сервер не вимагає автентифікації, підійде будь-яке непорожнє значення:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Select a model">
    Замініть значення на один з ідентифікаторів ваших моделей vLLM:

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

<Tip>
Для неінтерактивного налаштування (CI, сценаріїв) передайте базову URL-адресу, ключ і модель безпосередньо:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice vllm \
  --custom-base-url "http://127.0.0.1:8000/v1" \
  --custom-api-key "vllm-local" \
  --custom-model-id "your-model-id"
```

</Tip>

## Виявлення моделей (неявний провайдер)

Коли задано `VLLM_API_KEY` (або існує профіль автентифікації), а `models.providers.vllm` **не** визначено, OpenClaw надсилає запит до `GET http://127.0.0.1:8000/v1/models` і перетворює отримані ідентифікатори на записи моделей.

<Note>
Якщо ви явно задасте `models.providers.vllm`, OpenClaw використовуватиме лише оголошені вами моделі. Додайте `"vllm/*": {}` до `agents.defaults.models`, щоб OpenClaw також опитував кінцеву точку `/models` налаштованого провайдера й додавав усі оголошені моделі vLLM.
</Note>

## Явна конфігурація

Використовуйте явну конфігурацію, якщо vLLM працює на іншому хості або порту, потрібно зафіксувати `contextWindow`/`maxTokens`, сервер вимагає справжній ключ API або ви підключаєтеся до довіреної кінцевої точки loopback, LAN чи Tailscale:

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        timeoutSeconds: 300, // Optional: extend request timeout for slow local models
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

Щоб провайдер залишався динамічним без переліку кожної моделі, додайте символ узагальнення до видимого каталогу моделей:

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
    vLLM розглядається як сумісний з OpenAI серверний компонент `/v1`, що працює за принципом проксі, а не як нативна кінцева точка OpenAI:

    | Поведінка                                      | Застосовується?                                   |
    | ---------------------------------------------- | ------------------------------------------------- |
    | Нативне формування запитів OpenAI              | Ні                                                |
    | `service_tier`                                 | Не надсилається                                   |
    | `store` для Responses                          | Не надсилається                                   |
    | Підказки для кешу промптів                     | Не надсилаються                                   |
    | Формування корисного навантаження для сумісності міркувань OpenAI | Не застосовується                 |
    | Приховані заголовки атрибуції OpenClaw         | Не додаються для користувацьких базових URL-адрес |

  </Accordion>

  <Accordion title="Qwen thinking controls">
    Для моделей Qwen задайте `compat.thinkingFormat: "qwen-chat-template"` у записі моделі, коли сервер очікує аргументи шаблону чату Qwen. Ці моделі надають двійковий профіль `/think` (`off`, `on`), оскільки міркування шаблону чату Qwen — це прапорець увімкнення або вимкнення, а не градація зусиль у стилі OpenAI.

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

    OpenClaw зіставляє `/think off` із:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    Для рівнів міркування, відмінних від `off`, надсилається `enable_thinking: true`. Якщо ваша кінцева точка натомість очікує прапорці верхнього рівня в стилі DashScope, використовуйте `compat.thinkingFormat: "qwen"`, щоб надсилати `enable_thinking` у корені запиту.

  </Accordion>

  <Accordion title="Nemotron 3 thinking controls">
    Для моделей `vllm/nemotron-3-*` із вимкненим міркуванням комплектний plugin надсилає:

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    Щоб налаштувати ці значення, задайте `chat_template_kwargs` у параметрах моделі. Якщо ви також задасте `params.extra_body.chat_template_kwargs`, це значення матиме пріоритет, оскільки `extra_body` є останнім перевизначенням тіла запиту.

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
    Спочатку переконайтеся, що vLLM запущено з правильним аналізатором викликів інструментів і шаблоном чату для цієї моделі. У документації vLLM зазначено `hermes` для моделей Qwen2.5 і `qwen3_xml` для моделей Qwen3-Coder.

    Ознаки: Skills або інструменти ніколи не запускаються, асистент виводить необроблений JSON/XML на зразок `{"name":"read","arguments":...}` або vLLM повертає порожній масив `tool_calls`, коли OpenClaw надсилає `tool_choice: "auto"`.

    Деякі комбінації Qwen/vLLM повертають структуровані виклики інструментів лише тоді, коли запит використовує `tool_choice: "required"`. Примусово задайте це для окремої моделі за допомогою `params.extra_body`:

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

    Замініть ідентифікатор моделі точним ідентифікатором із `openclaw models list --provider vllm` або застосуйте таке саме перевизначення через CLI:

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    Це обхідне рішення, яке потрібно явно ввімкнути: воно змушує кожен хід з інструментами виконувати виклик інструмента, тому використовуйте його лише для окремого запису моделі, де така поведінка прийнятна. Не задавайте його глобальним значенням за замовчуванням для всіх моделей vLLM і не поєднуйте з проксі, який перетворює довільний текст асистента на виконувані виклики інструментів.

  </Accordion>

  <Accordion title="Custom base URL">
    Якщо сервер vLLM працює на нестандартному хості або порту, задайте `baseUrl` у явній конфігурації провайдера:

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
    Для великих локальних моделей, віддалених хостів LAN або з’єднань tailnet задайте тайм-аут запиту в межах провайдера:

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

    `timeoutSeconds` застосовується лише до HTTP-запитів моделей vLLM: встановлення з’єднання, отримання заголовків відповіді, потокового передавання тіла та загального переривання захищеного запиту. Він також підвищує граничний час сторожового таймера бездіяльності або потоку LLM понад неявне значення за замовчуванням приблизно 120 секунд для цього провайдера. Віддавайте цьому перевагу перед збільшенням `agents.defaults.timeoutSeconds`, яке керує всім запуском агента.

  </Accordion>

  <Accordion title="Server not reachable">
    Перевірте, що сервер vLLM запущений і доступний:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Якщо виникає помилка з’єднання, перевірте хост, порт і те, що vLLM запущено в режимі сервера, сумісного з OpenAI. OpenClaw довіряє точному джерелу налаштованої URL-адреси `models.providers.vllm.baseUrl` для захищених запитів моделей до кінцевих точок loopback, LAN і Tailscale. Джерела метаданих і link-local залишаються заблокованими без явної згоди. Задавайте `models.providers.vllm.request.allowPrivateNetwork: true` лише тоді, коли запити vLLM мають надходити до іншого приватного джерела, або `false`, щоб відмовитися від довіри до точного джерела.

  </Accordion>

  <Accordion title="Auth errors on requests">
    Якщо запити завершуються помилками автентифікації, задайте справжній `VLLM_API_KEY`, що відповідає конфігурації вашого сервера, або явно налаштуйте провайдера в `models.providers.vllm`.

    <Tip>
    Якщо сервер vLLM не вимагає автентифікації, будь-яке непорожнє значення `VLLM_API_KEY` слугує для OpenClaw сигналом явної згоди.
    </Tip>

  </Accordion>

  <Accordion title="No models discovered">
    Для автоматичного виявлення потрібно задати `VLLM_API_KEY`. Якщо ви визначили `models.providers.vllm`, OpenClaw використовує лише оголошені вами моделі, якщо `agents.defaults.models` не містить `"vllm/*": {}`.
  </Accordion>

  <Accordion title="Tools render as raw text">
    Якщо модель Qwen виводить синтаксис інструментів JSON/XML замість виконання Skill:

    - Запустіть vLLM із правильним аналізатором і шаблоном для цієї моделі.
    - Перевірте точний ідентифікатор моделі за допомогою `openclaw models list --provider vllm`.
    - Додайте окреме перевизначення `params.extra_body.tool_choice: "required"` для конкретної моделі лише тоді, коли `tool_choice: "auto"` і далі повертає порожні або лише текстові виклики інструментів.

  </Accordion>
</AccordionGroup>

<Warning>
Додаткова допомога: [Усунення несправностей](/uk/help/troubleshooting) і [Поширені запитання](/uk/help/faq).
</Warning>

## Пов’язані матеріали

<CardGroup cols={2}>
  <Card title="Model selection" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки резервного перемикання.
  </Card>
  <Card title="OpenAI" href="/uk/providers/openai" icon="bolt">
    Нативний провайдер OpenAI і поведінка маршрутів, сумісних з OpenAI.
  </Card>
  <Card title="OAuth and auth" href="/uk/gateway/authentication" icon="key">
    Відомості про автентифікацію та правила повторного використання облікових даних.
  </Card>
  <Card title="Troubleshooting" href="/uk/help/troubleshooting" icon="wrench">
    Поширені проблеми та способи їх вирішення.
  </Card>
</CardGroup>
