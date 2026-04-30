---
read_when:
    - Ви хочете обслуговувати моделі з власної машини з GPU
    - Ви налаштовуєте LM Studio або проксі, сумісний з OpenAI
    - Вам потрібні найбезпечніші рекомендації щодо локальної моделі
summary: Запускайте OpenClaw на локальних великих мовних моделях (LM Studio, vLLM, LiteLLM, користувацькі кінцеві точки OpenAI)
title: Локальні моделі
x-i18n:
    generated_at: "2026-04-30T07:38:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 283da11a7896c670d3a249eeb957a252cbda7f7457bd814bb0796f3ca9956723
    source_path: gateway/local-models.md
    workflow: 16
---

Локальний запуск можливий, але OpenClaw очікує великий контекст і сильний захист від prompt injection. Малі карти обрізають контекст і погіршують безпеку. Цільтеся високо: **≥2 максимально укомплектовані Mac Studio або еквівалентна GPU-система (~$30k+)**. Один GPU на **24 GB** підходить лише для легших промптів із вищою затримкою. Використовуйте **найбільший / повнорозмірний варіант моделі, який можете запустити**; агресивно квантизовані або “малі” checkpoints підвищують ризик prompt injection (див. [Безпека](/uk/gateway/security)).

Якщо вам потрібне локальне налаштування з найменшим тертям, почніть з [LM Studio](/uk/providers/lmstudio) або [Ollama](/uk/providers/ollama) і `openclaw onboard`. Ця сторінка — позиційний посібник для висококласних локальних стеків і власних локальних серверів, сумісних з OpenAI.

<Warning>
**Користувачі WSL2 + Ollama + NVIDIA/CUDA:** офіційний Linux-інсталятор Ollama вмикає systemd-сервіс із `Restart=always`. У WSL2 GPU-налаштуваннях автозапуск може повторно завантажити останню модель під час boot і закріпити пам’ять хоста. Якщо ваша WSL2 VM неодноразово перезапускається після ввімкнення Ollama, див. [цикл падіння WSL2](/uk/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Рекомендовано: LM Studio + велика локальна модель (Responses API)

Найкращий поточний локальний стек. Завантажте велику модель у LM Studio (наприклад, повнорозмірну збірку Qwen, DeepSeek або Llama), увімкніть локальний сервер (типово `http://127.0.0.1:1234`) і використовуйте Responses API, щоб тримати reasoning окремо від фінального тексту.

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/my-local-model": { alias: "Local" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**Контрольний список налаштування**

- Установіть LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- У LM Studio завантажте **найбільшу доступну збірку моделі** (уникайте “малих”/сильно квантизованих варіантів), запустіть сервер і підтвердьте, що `http://127.0.0.1:1234/v1/models` показує її у списку.
- Замініть `my-local-model` на фактичний ID моделі, показаний у LM Studio.
- Тримайте модель завантаженою; холодне завантаження додає затримку запуску.
- Налаштуйте `contextWindow`/`maxTokens`, якщо ваша збірка LM Studio відрізняється.
- Для WhatsApp дотримуйтеся Responses API, щоб надсилати лише фінальний текст.

Тримайте hosted-моделі налаштованими навіть під час локального запуску; використовуйте `models.mode: "merge"`, щоб fallback-и залишалися доступними.

### Гібридна конфігурація: hosted основна, локальна fallback

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### Локальна основна з hosted підстрахуванням

Поміняйте місцями порядок основної моделі та fallback; залиште той самий блок providers і `models.mode: "merge"`, щоб можна було відкотитися до Sonnet або Opus, коли локальна машина недоступна.

### Регіональний hosting / маршрутизація даних

- Hosted-варіанти MiniMax/Kimi/GLM також доступні на OpenRouter із region-pinned endpoints (наприклад, hosted у США). Виберіть там регіональний варіант, щоб утримувати трафік у вибраній юрисдикції, і водночас використовуйте `models.mode: "merge"` для fallback-ів Anthropic/OpenAI.
- Тільки локальний режим залишається найсильнішим шляхом приватності; hosted регіональна маршрутизація — це середній варіант, коли вам потрібні можливості провайдера, але потрібен контроль над потоком даних.

## Інші локальні проксі, сумісні з OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy або власні
gateways працюють, якщо вони відкривають OpenAI-style `/v1/chat/completions`
endpoint. Використовуйте адаптер Chat Completions, якщо backend явно не
документує підтримку `/v1/responses`. Замініть наведений вище блок provider на ваш
endpoint і ID моделі:

```json5
{
  agents: {
    defaults: {
      model: { primary: "local/my-local-model" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

Якщо `api` пропущено у власному provider з `baseUrl`, OpenClaw типово використовує
`openai-completions`. Loopback endpoints, такі як `127.0.0.1`, вважаються довіреними
автоматично; LAN, tailnet і private DNS endpoints усе ще потребують
`request.allowPrivateNetwork: true`.

Значення `models.providers.<id>.models[].id` є локальним для provider. Не
додавайте туди префікс provider. Наприклад, сервер MLX, запущений із
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit`, має використовувати цей
catalog id і model ref:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Установіть `input: ["text", "image"]` для локальних або proxied vision-моделей, щоб image
attachments вставлялися в agent turns. Інтерактивне onboarding власного provider
виводить поширені ID vision-моделей і запитує лише невідомі імена.
Неінтерактивне onboarding використовує те саме виведення; використовуйте `--custom-image-input`
для невідомих vision ID або `--custom-text-input`, коли модель, що виглядає відомою,
є text-only за вашим endpoint.

Тримайте `models.mode: "merge"`, щоб hosted-моделі залишалися доступними як fallback-и.
Використовуйте `models.providers.<id>.timeoutSeconds` для повільних локальних або віддалених
серверів моделей перед підвищенням `agents.defaults.timeoutSeconds`. Таймаут provider
застосовується лише до HTTP-запитів моделі, включно з connect, headers, body streaming
і повним guarded-fetch abort.

<Note>
Для власних провайдерів, сумісних з OpenAI, збереження несекретного локального маркера, такого як `apiKey: "ollama-local"`, приймається, коли `baseUrl` резолвиться в loopback, private LAN, `.local` або bare hostname. OpenClaw трактує його як дійсні локальні облікові дані замість повідомлення про відсутній ключ. Використовуйте справжнє значення для будь-якого provider, який приймає public hostname.
</Note>

Нотатка про поведінку для локальних/proxied `/v1` backend-ів:

- OpenClaw трактує їх як proxy-style OpenAI-compatible routes, а не native
  OpenAI endpoints
- native OpenAI-only request shaping тут не застосовується: без
  `service_tier`, без Responses `store`, без OpenAI reasoning-compat payload
  shaping і без prompt-cache hints
- приховані attribution headers OpenClaw (`originator`, `version`, `User-Agent`)
  не вставляються на ці власні proxy URLs

Нотатки сумісності для суворіших backend-ів, сумісних з OpenAI:

- Деякі сервери приймають лише рядковий `messages[].content` у Chat Completions, а не
  structured content-part arrays. Установіть
  `models.providers.<provider>.models[].compat.requiresStringContent: true` для
  таких endpoints.
- Деякі локальні моделі виводять окремі bracketed tool requests як текст, наприклад
  `[tool_name]`, далі JSON і `[END_TOOL_REQUEST]`. OpenClaw підвищує
  їх до справжніх tool calls лише тоді, коли ім’я точно збігається із зареєстрованим
  інструментом для цього turn; інакше блок трактується як непідтримуваний текст і
  приховується з видимих користувачу відповідей.
- Якщо модель виводить JSON, XML або ReAct-style текст, що схожий на tool call,
  але provider не вивів structured invocation, OpenClaw залишає це як
  текст і записує warning з run id, provider/model, виявленим pattern і
  назвою інструмента, коли вона доступна. Розглядайте це як несумісність tool-call
  provider/model, а не як завершений запуск інструмента.
- Якщо інструменти з’являються як assistant text замість запуску, наприклад raw JSON,
  XML, ReAct syntax або порожній масив `tool_calls` у відповіді provider,
  спочатку перевірте, що сервер використовує chat template/parser із підтримкою tool-call. Для
  backend-ів OpenAI-compatible Chat Completions, чий parser працює лише коли tool
  use примусовий, установіть per-model request override замість покладання на text
  parsing:

  ```json5
  {
    agents: {
      defaults: {
        models: {
          "local/my-local-model": {
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

  Використовуйте це лише для моделей/сесій, де кожен звичайний turn має викликати інструмент.
  Це перевизначає типове proxy-значення OpenClaw `tool_choice: "auto"`.
  Замініть `local/my-local-model` на точний provider/model ref, показаний
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Якщо власна модель, сумісна з OpenAI, приймає OpenAI reasoning efforts поза межами
  вбудованого profile, оголосіть їх у model compat block. Додавання `"xhigh"`
  тут робить так, що `/think xhigh`, session pickers, валідація Gateway і валідація `llm-task`
  показують рівень для цього налаштованого provider/model ref:

  ```json5
  {
    models: {
      providers: {
        local: {
          baseUrl: "http://127.0.0.1:8000/v1",
          apiKey: "sk-local",
          api: "openai-responses",
          models: [
            {
              id: "gpt-5.4",
              name: "GPT 5.4 via local proxy",
              reasoning: true,
              input: ["text"],
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
              contextWindow: 196608,
              maxTokens: 8192,
              compat: {
                supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
                reasoningEffortMap: { xhigh: "xhigh" },
              },
            },
          ],
        },
      },
    },
  }
  ```

- Деякі менші або суворіші локальні backend-и нестабільні з повною
  agent-runtime prompt shape OpenClaw, особливо коли включені tool schemas. Спочатку
  перевірте provider path за допомогою lean local probe:

  ```bash
  openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  Щоб перевірити маршрут Gateway без повної agent prompt shape, використовуйте
  натомість Gateway model probe:

  ```bash
  openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  І локальна, і Gateway model probes надсилають лише наданий prompt. Gateway
  probe все ще перевіряє Gateway routing, auth і provider selection,
  але навмисно пропускає попередній session transcript, AGENTS/bootstrap context,
  context-engine assembly, tools і bundled MCP servers.

  Якщо це спрацьовує, але звичайні ходи агента OpenClaw завершуються з помилкою, спершу спробуйте
  `agents.defaults.experimental.localModelLean: true`, щоб прибрати важкі
  типові інструменти, як-от `browser`, `cron` і `message`; це експериментальний
  прапорець, а не стабільне налаштування режиму за замовчуванням. Див.
  [Експериментальні функції](/uk/concepts/experimental-features). Якщо це все одно не допомагає, спробуйте
  `models.providers.<provider>.models[].compat.supportsTools: false`.

- Якщо бекенд усе ще дає збій лише на більших запусках OpenClaw, решта проблем
  зазвичай пов’язана з потужністю зовнішньої моделі/сервера або помилкою бекенду, а не з
  транспортним шаром OpenClaw.

## Усунення несправностей

- Gateway може дістатися до проксі? `curl http://127.0.0.1:1234/v1/models`.
- Модель LM Studio вивантажена? Перезавантажте її; холодний старт часто спричиняє “зависання”.
- Локальний сервер повідомляє `terminated`, `ECONNRESET` або закриває потік посеред ходу?
  OpenClaw записує низькокардинальний `model.call.error.failureKind` разом зі
  знімком RSS/heap процесу OpenClaw у діагностиці. Для тиску на пам’ять LM Studio/Ollama
  зіставте цю позначку часу з журналом сервера або журналом аварій macOS /
  jetsam, щоб підтвердити, чи сервер моделі було завершено.
- OpenClaw виводить порогові значення попередньої перевірки контекстного вікна з виявленого вікна моделі або з необмеженого вікна моделі, коли `agents.defaults.contextTokens` зменшує ефективне вікно. Він попереджає нижче 20% з мінімумом **8k**. Жорсткі блокування використовують поріг 10% з мінімумом **4k**, обмежений ефективним контекстним вікном, щоб завеликі метадані моделі не могли відхилити інакше допустиме користувацьке обмеження. Якщо ви натрапили на цю попередню перевірку, збільште ліміт контексту сервера/моделі або виберіть більшу модель.
- Помилки контексту? Зменште `contextWindow` або збільште ліміт сервера.
- OpenAI-сумісний сервер повертає `messages[].content ... expected a string`?
  Додайте `compat.requiresStringContent: true` до цього запису моделі.
- Прямі маленькі виклики `/v1/chat/completions` працюють, але `openclaw infer model run --local`
  завершується з помилкою на Gemma або іншій локальній моделі? Спершу перевірте URL провайдера, посилання на модель, маркер автентифікації
  і журнали сервера; локальний `model run` не містить інструментів агента.
  Якщо локальний `model run` успішний, але більші ходи агента завершуються з помилкою, зменште поверхню
  інструментів агента за допомогою `localModelLean` або `compat.supportsTools: false`.
- Виклики інструментів з’являються як сирий текст JSON/XML/ReAct, або провайдер повертає
  порожній масив `tool_calls`? Не додавайте проксі, який сліпо перетворює текст асистента
  на виконання інструментів. Спершу виправте чат-шаблон/парсер сервера. Якщо
  модель працює лише тоді, коли використання інструментів примусове, додайте наведене вище перевизначення для окремої моделі
  `params.extra_body.tool_choice: "required"` і використовуйте цей запис моделі
  лише для сесій, де виклик інструмента очікується на кожному ході.
- Безпека: локальні моделі оминають фільтри на боці провайдера; тримайте агентів вузькоспеціалізованими й Compaction увімкненою, щоб обмежити радіус ураження ін’єкцій у промпт.

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [Відмовостійке перемикання моделей](/uk/concepts/model-failover)
