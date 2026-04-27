---
read_when:
    - Ви хочете запустити OpenClaw з локальним сервером vLLM
    - Ви хочете OpenAI-сумісні ендпоінти `/v1` із власними моделями
summary: Запуск OpenClaw з vLLM (сумісним з OpenAI локальним сервером)
title: vLLM
x-i18n:
    generated_at: "2026-04-27T09:35:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4987a7809157b682fa6227ebde0ae8dcd2d7c5a29f19a9e30b5846771dd7ec38
    source_path: providers/vllm.md
    workflow: 15
---

vLLM може обслуговувати моделі з відкритим кодом (а також деякі кастомні) через **OpenAI-сумісний** HTTP API. OpenClaw підключається до vLLM за допомогою API `openai-completions`.

OpenClaw також може **автоматично виявляти** доступні моделі з vLLM, якщо ви явно ввімкнете це за допомогою `VLLM_API_KEY` (підійде будь-яке значення, якщо ваш сервер не вимагає автентифікації) і не визначите явний запис `models.providers.vllm`.

OpenClaw розглядає `vllm` як локальний OpenAI-сумісний провайдер, який підтримує
потоковий облік використання, тому лічильники токенів статусу/контексту можуть оновлюватися з
відповідей `stream_options.include_usage`.

| Властивість     | Значення                                 |
| --------------- | ---------------------------------------- |
| ID провайдера   | `vllm`                                   |
| API             | `openai-completions` (OpenAI-сумісний)   |
| Автентифікація  | змінна середовища `VLLM_API_KEY`         |
| Базовий URL за замовчуванням | `http://127.0.0.1:8000/v1`   |

## Початок роботи

<Steps>
  <Step title="Запустіть vLLM з OpenAI-сумісним сервером">
    Ваш базовий URL має надавати ендпоінти `/v1` (наприклад, `/v1/models`, `/v1/chat/completions`). vLLM зазвичай працює за адресою:

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="Задайте змінну середовища ключа API">
    Підійде будь-яке значення, якщо ваш сервер не вимагає автентифікації:

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="Виберіть модель">
    Замініть на один з ідентифікаторів моделей вашого vLLM:

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

Коли задано `VLLM_API_KEY` (або існує профіль автентифікації) і ви **не** визначаєте `models.providers.vllm`, OpenClaw виконує запит:

```
GET http://127.0.0.1:8000/v1/models
```

і перетворює повернуті ID на записи моделей.

<Note>
Якщо ви явно задаєте `models.providers.vllm`, автоматичне виявлення пропускається, і вам потрібно визначити моделі вручну.
</Note>

## Явна конфігурація (ручне визначення моделей)

Використовуйте явну конфігурацію, коли:

- vLLM працює на іншому хості або порту
- Ви хочете зафіксувати значення `contextWindow` або `maxTokens`
- Ваш сервер вимагає справжній API-ключ (або ви хочете керувати заголовками)
- Ви підключаєтеся до довіреного ендпоінта vLLM через local loopback, LAN або Tailscale

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        timeoutSeconds: 300, // Необов’язково: збільшити час очікування підключення/заголовків/тіла/запиту для повільних локальних моделей
        models: [
          {
            id: "your-model-id",
            name: "Локальна модель vLLM",
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
    ендпоінт OpenAI. Це означає:

    | Поведінка | Застосовується? |
    |----------|----------|
    | Нативне формування запитів OpenAI | Ні |
    | `service_tier` | Не надсилається |
    | Відповіді `store` | Не надсилаються |
    | Підказки кешу prompt | Не надсилаються |
    | Формування payload для сумісності OpenAI reasoning | Не застосовується |
    | Приховані заголовки атрибуції OpenClaw | Не додаються для кастомних базових URL |

  </Accordion>

  <Accordion title="Керування thinking у Nemotron 3">
    vLLM/Nemotron 3 може використовувати kwargs шаблону чату, щоб керувати тим, чи
    reasoning повертається як приховане reasoning або як видимий текст відповіді. Коли сесія OpenClaw
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

  <Accordion title="Парсер викликів інструментів Qwen потребує required">
    Спершу переконайтеся, що vLLM було запущено з правильним парсером викликів інструментів і шаблоном чату
    для моделі. Наприклад, у документації vLLM вказано `hermes` для моделей Qwen2.5
    і `qwen3_xml` для моделей Qwen3-Coder.

    Деякі комбінації Qwen/vLLM усе ще повертають сирий текст виклику інструмента або порожній
    масив `tool_calls`, коли запит використовує `tool_choice: "auto"`, але повертають
    структуровані виклики інструментів, коли запит використовує `tool_choice: "required"`. Для
    таких записів моделей примусово задайте OpenAI-сумісне поле запиту через
    `params.extra_body`:

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

    Це суміснісний обхідний шлях, який вмикається за згодою. Він змушує кожен хід моделі з
    інструментами вимагати виклик інструмента, тому використовуйте його лише для окремого локального запису моделі,
    де така поведінка є прийнятною.

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
                name: "Віддалена модель vLLM",
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
    Для великих локальних моделей, віддалених хостів у LAN або з’єднань tailnet задайте
    час очікування запиту на рівні провайдера:

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
            models: [{ id: "your-model-id", name: "Локальна модель vLLM" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` застосовується лише до HTTP-запитів моделі vLLM, включно з
    встановленням з’єднання, заголовками відповіді, потоковою передачею тіла та загальним
    аварійним завершенням guarded-fetch. Надавайте цьому перевагу перед збільшенням
    `agents.defaults.timeoutSeconds`, який керує всім запуском агента.

  </Accordion>

  <Accordion title="Сервер недоступний">
    Переконайтеся, що сервер vLLM запущено і він доступний:

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    Якщо ви бачите помилку з’єднання, перевірте хост, порт і те, що vLLM запущено в режимі OpenAI-сумісного сервера.
    Для явних ендпоінтів local loopback, LAN або Tailscale також задайте
    `models.providers.vllm.request.allowPrivateNetwork: true`; запити провайдера
    за замовчуванням блокують URL приватної мережі, якщо провайдер не є
    явно довіреним.

  </Accordion>

  <Accordion title="Помилки автентифікації в запитах">
    Якщо запити завершуються помилками автентифікації, задайте справжній `VLLM_API_KEY`, який відповідає конфігурації вашого сервера, або явно налаштуйте провайдера в `models.providers.vllm`.

    <Tip>
    Якщо ваш сервер vLLM не вимагає автентифікації, будь-яке непорожнє значення `VLLM_API_KEY` працює як сигнал явного ввімкнення для OpenClaw.
    </Tip>

  </Accordion>

  <Accordion title="Не виявлено жодної моделі">
    Для автоматичного виявлення потрібно, щоб `VLLM_API_KEY` було задано **і** щоб не було явного запису конфігурації `models.providers.vllm`. Якщо ви визначили провайдера вручну, OpenClaw пропускає виявлення і використовує лише оголошені вами моделі.
  </Accordion>
</AccordionGroup>

<Warning>
Додаткова допомога: [Усунення несправностей](/uk/help/troubleshooting) і [FAQ](/uk/help/faq).
</Warning>

## Пов’язане

<CardGroup cols={2}>
  <Card title="Вибір моделі" href="/uk/concepts/model-providers" icon="layers">
    Вибір провайдерів, посилань на моделі та поведінки перемикання на резервний варіант.
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
