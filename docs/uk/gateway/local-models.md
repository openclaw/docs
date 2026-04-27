---
read_when:
    - Ви хочете обслуговувати моделі з вашого власного GPU-сервера
    - Ви налаштовуєте LM Studio або OpenAI-сумісний проксі-сервер
    - Вам потрібні найбезпечніші рекомендації щодо локальних моделей
summary: Запустіть OpenClaw на локальних LLM (LM Studio, vLLM, LiteLLM, користувацькі OpenAI endpoint-и)
title: Локальні моделі
x-i18n:
    generated_at: "2026-04-27T22:06:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6d16948f66e8ad5b11c82939f711ad7db9edeea565c77b293227612f7ab43b6
    source_path: gateway/local-models.md
    workflow: 15
---

Локальний запуск можливий, але OpenClaw очікує великий контекст + сильний захист від prompt injection. Малі карти обрізають контекст і послаблюють безпеку. Орієнтуйтеся на високий рівень: **≥2 Mac Studio з максимальною конфігурацією або еквівалентний GPU-стенд (~$30k+)**. Один GPU з **24 GB** підходить лише для легших запитів і з вищою затримкою. Використовуйте **найбільший / повнорозмірний варіант моделі, який можете запустити**; агресивно квантизовані або “small” checkpoint-и підвищують ризик prompt injection (див. [Безпека](/uk/gateway/security)).

Якщо вам потрібне локальне налаштування з найменшими ускладненнями, почніть із [LM Studio](/uk/providers/lmstudio) або [Ollama](/uk/providers/ollama) і `openclaw onboard`. Ця сторінка — упереджений практичний посібник для локальних стеків вищого класу та користувацьких локальних OpenAI-сумісних серверів.

<Warning>
**Користувачі WSL2 + Ollama + NVIDIA/CUDA:** Офіційний інсталятор Ollama для Linux вмикає службу systemd з `Restart=always`. У конфігураціях WSL2 з GPU автозапуск може повторно завантажувати останню модель під час старту й займати пам’ять хоста. Якщо ваша ВМ WSL2 постійно перезапускається після ввімкнення Ollama, див. [цикл збоїв WSL2](/uk/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Рекомендовано: LM Studio + велика локальна модель (Responses API)

Найкращий поточний локальний стек. Завантажте велику модель у LM Studio (наприклад, повнорозмірну збірку Qwen, DeepSeek або Llama), увімкніть локальний сервер (типово `http://127.0.0.1:1234`), і використовуйте Responses API, щоб відокремити міркування від фінального тексту.

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

- Встановіть LM Studio: [https://lmstudio.ai](https://lmstudio.ai)
- У LM Studio завантажте **найбільшу доступну збірку моделі** (уникайте варіантів “small”/сильно квантизованих), запустіть сервер, переконайтеся, що `http://127.0.0.1:1234/v1/models` показує її.
- Замініть `my-local-model` на фактичний ID моделі, показаний у LM Studio.
- Тримайте модель завантаженою; холодне завантаження додає затримку запуску.
- Скоригуйте `contextWindow`/`maxTokens`, якщо ваша збірка LM Studio відрізняється.
- Для WhatsApp використовуйте Responses API, щоб надсилати лише фінальний текст.

Залишайте hosted-моделі налаштованими навіть під час локального запуску; використовуйте `models.mode: "merge"`, щоб fallback-варіанти залишалися доступними.

### Гібридна конфігурація: hosted primary, local fallback

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

### Локальний основний варіант із hosted-страховкою

Поміняйте primary і fallback місцями; залиште той самий блок providers і `models.mode: "merge"`, щоб можна було перейти на Sonnet або Opus, коли локальний сервер недоступний.

### Регіональний хостинг / маршрутизація даних

- Hosted-варіанти MiniMax/Kimi/GLM також доступні в OpenRouter з endpoint-ами, прив’язаними до регіону (наприклад, розміщеними у США). Вибирайте там регіональний варіант, щоб трафік залишався в обраній вами юрисдикції, і водночас використовуйте `models.mode: "merge"` для fallback-варіантів Anthropic/OpenAI.
- Лише локальний запуск залишається найсильнішим шляхом для приватності; hosted-регіональна маршрутизація — це проміжний варіант, коли вам потрібні можливості провайдера, але ви хочете контролювати потік даних.

## Інші OpenAI-сумісні локальні проксі

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy або користувацькі
шлюзи працюють, якщо вони надають OpenAI-подібний endpoint `/v1/chat/completions`.
Використовуйте адаптер Chat Completions, якщо backend явно
не документує підтримку `/v1/responses`. Замініть блок provider вище на ваш
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

Якщо `api` пропущено в користувацькому provider з `baseUrl`, OpenClaw типово використовує
`openai-completions`. Endpoint-и loopback, такі як `127.0.0.1`, автоматично
вважаються довіреними; endpoint-и LAN, tailnet і private DNS усе одно потребують
`request.allowPrivateNetwork: true`.

Значення `models.providers.<id>.models[].id` є локальним для provider.
Не включайте туди префікс provider. Наприклад, сервер MLX, запущений з
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit`, має використовувати
такий id каталогу й посилання на модель:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Залишайте `models.mode: "merge"`, щоб hosted-моделі залишалися доступними як fallback-варіанти.
Використовуйте `models.providers.<id>.timeoutSeconds` для повільних локальних або віддалених
серверів моделей перед тим, як збільшувати `agents.defaults.timeoutSeconds`. Тайм-аут provider
застосовується лише до HTTP-запитів моделі, зокрема до з’єднання, заголовків, потокового передавання тіла
та загального переривання guarded-fetch.

<Note>
Для користувацьких OpenAI-сумісних providers допускається збереження несекретного локального маркера, наприклад `apiKey: "ollama-local"`, коли `baseUrl` вказує на loopback, приватну LAN, `.local` або коротке ім’я хоста. OpenClaw розглядає це як дійсний локальний обліковий маркер замість повідомлення про відсутній ключ. Для будь-якого provider, який приймає публічне ім’я хоста, використовуйте реальне значення.
</Note>

Примітка щодо поведінки для локальних/проксійованих backend-ів `/v1`:

- OpenClaw розглядає їх як проксі-маршрути, сумісні з OpenAI, а не як нативні
  endpoint-и OpenAI
- нативне формування запитів лише для OpenAI тут не застосовується: немає
  `service_tier`, немає Responses `store`, немає формування payload для
  сумісності міркувань OpenAI і немає підказок prompt-cache
- приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`)
  не додаються до цих користувацьких проксі-URL

Примітки щодо сумісності для суворіших OpenAI-сумісних backend-ів:

- Деякі сервери приймають у Chat Completions лише рядковий `messages[].content`, а не
  структуровані масиви частин контенту. Для таких endpoint-ів встановіть
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- Деякі локальні моделі виводять окремі запити до інструментів у дужках як текст, наприклад
  `[tool_name]`, потім JSON і `[END_TOOL_REQUEST]`. OpenClaw підвищує
  їх до справжніх викликів інструментів лише тоді, коли назва точно збігається з зареєстрованим
  інструментом для цього ходу; інакше блок розглядається як непідтримуваний текст і
  приховується з відповідей, видимих користувачу.
- Якщо модель виводить JSON, XML або текст у стилі ReAct, який виглядає як виклик інструмента,
  але provider не надав структурований виклик, OpenClaw залишає його як
  текст і записує попередження з id запуску, provider/model, виявленим шаблоном і
  назвою інструмента, якщо вона доступна. Розглядайте це як несумісність
  виклику інструментів provider/model, а не як завершений запуск інструмента.
- Якщо інструменти з’являються як текст асистента замість виконання, наприклад необроблений JSON,
  XML, синтаксис ReAct або порожній масив `tool_calls` у відповіді provider, спочатку
  перевірте, що сервер використовує шаблон чату/парсер, здатний працювати з викликами інструментів. Для
  OpenAI-сумісних backend-ів Chat Completions, чий парсер працює лише тоді, коли використання інструментів
  примусово ввімкнено, задайте перевизначення запиту для конкретної моделі замість того, щоб покладатися на парсинг тексту:

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

  Використовуйте це лише для моделей/сеансів, де кожен звичайний хід має викликати інструмент.
  Це перевизначає стандартне проксі-значення OpenClaw `tool_choice: "auto"`.
  Замініть `local/my-local-model` на точне посилання provider/model, показане командою
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Деякі менші або суворіші локальні backend-и нестабільно працюють із повною
  формою prompt agent-runtime в OpenClaw, особливо коли включено схеми інструментів. Спочатку
  перевірте шлях provider за допомогою спрощеної локальної перевірки:

  ```bash
  openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  Якщо це працює, але звичайні ходи агента OpenClaw не працюють, спочатку спробуйте
  `agents.defaults.experimental.localModelLean: true`, щоб прибрати важкі
  стандартні інструменти на кшталт `browser`, `cron` і `message`; це експериментальний
  прапорець, а не стабільне налаштування режиму за замовчуванням. Див.
  [Експериментальні можливості](/uk/concepts/experimental-features). Якщо це все одно не допоможе, спробуйте
  `models.providers.<provider>.models[].compat.supportsTools: false`.

- Якщо backend усе ще збоїть лише на більших запусках OpenClaw, зазвичай
  проблема, що залишилася, пов’язана з можливостями моделі/сервера на стороні upstream або з помилкою backend-а, а не з транспортним шаром OpenClaw.

## Усунення несправностей

- Gateway може досягти проксі? `curl http://127.0.0.1:1234/v1/models`.
- Модель LM Studio вивантажена? Завантажте її знову; холодний старт — поширена причина “зависання”.
- Локальний сервер повідомляє `terminated`, `ECONNRESET` або закриває потік посеред ходу?
  OpenClaw записує `model.call.error.failureKind` з низькою кардинальністю, а також
  знімок RSS/heap процесу OpenClaw у діагностиці. Для тиску на пам’ять у LM Studio/Ollama
  зіставте цю часову мітку з логом сервера або логом macOS crash /
  jetsam, щоб підтвердити, чи був сервер моделі примусово завершений.
- OpenClaw попереджає, коли виявлене вікно контексту менше за **32k**, і блокує роботу, якщо воно менше за **16k**. Якщо ви натрапили на цю попередню перевірку, збільште ліміт контексту сервера/моделі або виберіть більшу модель.
- Помилки контексту? Зменште `contextWindow` або збільште ліміт вашого сервера.
- OpenAI-сумісний сервер повертає `messages[].content ... expected a string`?
  Додайте `compat.requiresStringContent: true` до запису цієї моделі.
- Прямі малі виклики `/v1/chat/completions` працюють, але `openclaw infer model run --local`
  не працює з Gemma або іншою локальною моделлю? Спочатку перевірте URL provider, посилання на модель, маркер автентифікації
  та логи сервера; локальний `model run` не включає інструменти агента.
  Якщо локальний `model run` працює, але більші ходи агента збоять, зменште
  поверхню інструментів агента за допомогою `localModelLean` або `compat.supportsTools: false`.
- Виклики інструментів з’являються як сирий текст JSON/XML/ReAct, або provider повертає
  порожній масив `tool_calls`? Не додавайте проксі, який сліпо перетворює текст асистента
  на виконання інструментів. Спочатку виправте шаблон чату/парсер сервера. Якщо
  модель працює лише тоді, коли використання інструментів примусово ввімкнено, додайте наведене вище
  перевизначення для конкретної моделі
  `params.extra_body.tool_choice: "required"` і використовуйте цей запис моделі
  лише для сеансів, де виклик інструмента очікується на кожному ході.
- Безпека: локальні моделі оминають фільтри на стороні provider; тримайте агентів вузькоспеціалізованими та залишайте Compaction увімкненим, щоб обмежити радіус ураження від prompt injection.

## Пов’язане

- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Перемикання між моделями при збої](/uk/concepts/model-failover)
