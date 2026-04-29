---
read_when:
    - Ви хочете обслуговувати моделі зі свого власного GPU-сервера
    - Ви налаштовуєте LM Studio або проксі, сумісний з OpenAI
    - Вам потрібні найбезпечніші рекомендації щодо локальної моделі
summary: Запускайте OpenClaw на локальних LLM (LM Studio, vLLM, LiteLLM, власні кінцеві точки OpenAI)
title: Локальні моделі
x-i18n:
    generated_at: "2026-04-29T10:40:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ec1be4eac371328c1efe80b71450019f68fb1114df90db1532a4ff72bfa0ab1
    source_path: gateway/local-models.md
    workflow: 16
---

Локально можливо, але OpenClaw очікує великий контекст і сильний захист від prompt injection. Малі карти обрізають контекст і погіршують безпеку. Орієнтуйтеся високо: **≥2 максимально укомплектовані Mac Studios або еквівалентна GPU-система (~$30k+)**. Один GPU на **24 GB** працює лише для легших промптів із більшою затримкою. Використовуйте **найбільший / повнорозмірний варіант моделі, який можете запустити**; агресивно квантизовані або “малі” checkpoints підвищують ризик prompt injection (див. [Безпека](/uk/gateway/security)).

Якщо вам потрібне локальне налаштування з найменшим тертям, почніть із [LM Studio](/uk/providers/lmstudio) або [Ollama](/uk/providers/ollama) і `openclaw onboard`. Ця сторінка — практичний посібник для потужніших локальних стеків і власних локальних серверів, сумісних з OpenAI.

<Warning>
**Користувачі WSL2 + Ollama + NVIDIA/CUDA:** офіційний інсталятор Ollama для Linux вмикає systemd-сервіс із `Restart=always`. У GPU-налаштуваннях WSL2 автозапуск може перезавантажити останню модель під час запуску системи й закріпити пам’ять хоста. Якщо ваша WSL2 VM багаторазово перезапускається після ввімкнення Ollama, див. [цикл аварійного перезапуску WSL2](/uk/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Рекомендовано: LM Studio + велика локальна модель (Responses API)

Найкращий поточний локальний стек. Завантажте велику модель у LM Studio (наприклад, повнорозмірну збірку Qwen, DeepSeek або Llama), увімкніть локальний сервер (типово `http://127.0.0.1:1234`) і використовуйте Responses API, щоб тримати міркування окремо від фінального тексту.

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
- У LM Studio завантажте **найбільшу доступну збірку моделі** (уникайте “малих”/сильно квантизованих варіантів), запустіть сервер, підтвердьте, що `http://127.0.0.1:1234/v1/models` її показує.
- Замініть `my-local-model` фактичним ID моделі, показаним у LM Studio.
- Тримайте модель завантаженою; холодне завантаження додає затримку старту.
- Налаштуйте `contextWindow`/`maxTokens`, якщо ваша збірка LM Studio відрізняється.
- Для WhatsApp дотримуйтеся Responses API, щоб надсилався лише фінальний текст.

Тримайте розміщені моделі налаштованими навіть під час локального запуску; використовуйте `models.mode: "merge"`, щоб резервні варіанти лишалися доступними.

### Гібридна конфігурація: розміщена основна, локальна резервна

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

### Насамперед локально, з розміщеною захисною сіткою

Поміняйте порядок основної та резервної моделей; залиште той самий блок providers і `models.mode: "merge"`, щоб можна було перейти на Sonnet або Opus, коли локальна машина недоступна.

### Регіональне розміщення / маршрутизація даних

- Розміщені варіанти MiniMax/Kimi/GLM також існують на OpenRouter з прив’язаними до регіону endpoint-ами (наприклад, розміщеними в США). Виберіть там регіональний варіант, щоб утримувати трафік у вибраній юрисдикції, водночас використовуючи `models.mode: "merge"` для резервних варіантів Anthropic/OpenAI.
- Варіант лише локально лишається найсильнішим шляхом для приватності; розміщена регіональна маршрутизація — це компроміс, коли потрібні можливості провайдера, але ви хочете контролювати потік даних.

## Інші локальні проксі, сумісні з OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy або власні
gateways працюють, якщо вони надають endpoint OpenAI-стилю `/v1/chat/completions`.
Використовуйте адаптер Chat Completions, якщо бекенд явно не документує
підтримку `/v1/responses`. Замініть блок provider вище на ваш endpoint і ID моделі:

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
`openai-completions`. Loopback endpoint-и, як-от `127.0.0.1`, автоматично
вважаються довіреними; endpoint-и LAN, tailnet і приватного DNS усе ще потребують
`request.allowPrivateNetwork: true`.

Значення `models.providers.<id>.models[].id` є локальним для provider. Не
додавайте туди префікс provider. Наприклад, сервер MLX, запущений із
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit`, має використовувати
такий catalog id і model ref:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Установіть `input: ["text", "image"]` для локальних або проксійованих vision-моделей, щоб
зображення-вкладення додавалися в ходи агента. Інтерактивне onboarding власного provider
визначає поширені ID vision-моделей і питає лише про невідомі назви.
Неінтерактивне onboarding використовує те саме визначення; використовуйте `--custom-image-input`
для невідомих vision ID або `--custom-text-input`, коли модель із назвою, схожою на відому,
є text-only за вашим endpoint.

Тримайте `models.mode: "merge"`, щоб розміщені моделі лишалися доступними як резервні.
Використовуйте `models.providers.<id>.timeoutSeconds` для повільних локальних або віддалених
серверів моделей перед підвищенням `agents.defaults.timeoutSeconds`. Тайм-аут provider
застосовується лише до HTTP-запитів моделі, включно з підключенням, headers, body streaming
і загальним guarded-fetch abort.

<Note>
Для власних provider, сумісних з OpenAI, збереження несекретного локального маркера, як-от `apiKey: "ollama-local"`, приймається, коли `baseUrl` вказує на loopback, приватну LAN, `.local` або bare hostname. OpenClaw обробляє його як валідні локальні облікові дані, а не повідомляє про відсутній ключ. Використовуйте справжнє значення для будь-якого provider, який приймає публічний hostname.
</Note>

Примітка щодо поведінки для локальних/проксійованих `/v1` бекендів:

- OpenClaw обробляє їх як proxy-style маршрути, сумісні з OpenAI, а не як нативні
  endpoint-и OpenAI
- нативне лише для OpenAI формування запитів тут не застосовується: без
  `service_tier`, без Responses `store`, без формування payload для OpenAI reasoning-compat
  і без підказок prompt-cache
- приховані attribution headers OpenClaw (`originator`, `version`, `User-Agent`)
  не додаються до цих власних proxy URL

Примітки щодо сумісності для суворіших бекендів, сумісних з OpenAI:

- Деякі сервери приймають у Chat Completions лише рядковий `messages[].content`, а не
  структуровані масиви content-part. Установіть
  `models.providers.<provider>.models[].compat.requiresStringContent: true` для
  таких endpoint-ів.
- Деякі локальні моделі виводять окремі інструментальні запити в квадратних дужках як текст, наприклад
  `[tool_name]`, за яким іде JSON і `[END_TOOL_REQUEST]`. OpenClaw перетворює
  їх на справжні виклики інструментів лише коли назва точно збігається із зареєстрованим
  інструментом для цього ходу; інакше блок обробляється як непідтримуваний текст і
  приховується з видимих для користувача відповідей.
- Якщо модель виводить JSON, XML або ReAct-style текст, схожий на виклик інструмента,
  але provider не видав структурований виклик, OpenClaw залишає це як
  текст і записує попередження з run id, provider/model, виявленим шаблоном і
  назвою інструмента, коли вона доступна. Вважайте це несумісністю tool-call
  provider/model, а не завершеним запуском інструмента.
- Якщо інструменти з’являються як текст асистента замість виконання, наприклад сирий JSON,
  XML, ReAct syntax або порожній масив `tool_calls` у відповіді provider,
  спершу перевірте, що сервер використовує chat template/parser із підтримкою tool-call. Для
  OpenAI-compatible Chat Completions бекендів, parser яких працює лише коли використання інструментів
  примусове, задайте per-model request override замість покладання на текстовий
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

  Використовуйте це лише для моделей/сесій, де кожен звичайний хід має викликати інструмент.
  Це перевизначає типове proxy-значення OpenClaw `tool_choice: "auto"`.
  Замініть `local/my-local-model` точним provider/model ref, показаним
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Якщо власна модель, сумісна з OpenAI, приймає OpenAI reasoning efforts поза
  вбудованим профілем, оголосіть їх у model compat block. Додавання `"xhigh"`
  тут робить рівень доступним для `/think xhigh`, session pickers, валідації Gateway і валідації `llm-task`
  для налаштованого provider/model ref:

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

- Деякі менші або суворіші локальні бекенди нестабільні з повною
  формою промпта agent-runtime OpenClaw, особливо коли включено схеми інструментів. Спершу
  перевірте шлях provider за допомогою легкого локального probe:

  ```bash
  openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  Щоб перевірити маршрут Gateway без повної форми промпта агента, використовуйте
  натомість Gateway model probe:

  ```bash
  openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  І локальний, і Gateway model probes надсилають лише наданий промпт. Gateway
  probe усе ще перевіряє маршрутизацію Gateway, auth і вибір provider,
  але навмисно пропускає попередній transcript сесії, контекст AGENTS/bootstrap,
  складання context-engine, інструменти та bundled MCP servers.

  Якщо це спрацьовує, але звичайні ходи агента OpenClaw завершуються помилкою, спершу спробуйте
  `agents.defaults.experimental.localModelLean: true`, щоб прибрати важкі
  типові інструменти, як-от `browser`, `cron` і `message`; це експериментальний
  прапорець, а не стабільне налаштування типового режиму. Див.
  [Експериментальні функції](/uk/concepts/experimental-features). Якщо це все одно не допомагає, спробуйте
  `models.providers.<provider>.models[].compat.supportsTools: false`.

- Якщо бекенд усе ще дає збій лише на більших запусках OpenClaw, решта проблеми
  зазвичай полягає в місткості upstream моделі/сервера або в помилці бекенда, а не в
  транспортному рівні OpenClaw.

## Усунення несправностей

- Gateway може дістатися до проксі? `curl http://127.0.0.1:1234/v1/models`.
- Модель LM Studio вивантажено? Перезавантажте її; холодний старт є поширеною причиною “зависання”.
- Локальний сервер повідомляє `terminated`, `ECONNRESET` або закриває потік посеред ходу?
  OpenClaw записує низькокардинальний `model.call.error.failureKind` плюс знімок
  RSS/heap процесу OpenClaw у діагностиці. Для браку памʼяті в LM Studio/Ollama
  зіставте цю часову мітку з журналом сервера або журналом аварій macOS /
  jetsam, щоб підтвердити, чи було сервер моделі завершено примусово.
- OpenClaw попереджає, коли виявлене контекстне вікно менше за **32k**, і блокує роботу нижче **16k**. Якщо ви натрапили на цю попередню перевірку, збільште ліміт контексту сервера/моделі або виберіть більшу модель.
- Помилки контексту? Зменште `contextWindow` або збільште ліміт сервера.
- OpenAI-сумісний сервер повертає `messages[].content ... expected a string`?
  Додайте `compat.requiresStringContent: true` до запису цієї моделі.
- Прямі крихітні виклики `/v1/chat/completions` працюють, але `openclaw infer model run --local`
  дає збій на Gemma або іншій локальній моделі? Спершу перевірте URL постачальника, посилання на модель, маркер автентифікації
  та журнали сервера; локальний `model run` не включає інструменти агента.
  Якщо локальний `model run` спрацьовує, але більші ходи агента дають збій, зменште
  поверхню інструментів агента за допомогою `localModelLean` або `compat.supportsTools: false`.
- Виклики інструментів відображаються як сирий текст JSON/XML/ReAct або постачальник повертає
  порожній масив `tool_calls`? Не додавайте проксі, який сліпо перетворює текст
  асистента на виконання інструментів. Спершу виправте шаблон чату/парсер сервера. Якщо
  модель працює лише коли використання інструментів примусове, додайте наведене вище помодельне
  перевизначення `params.extra_body.tool_choice: "required"` і використовуйте цей запис моделі
  лише для сеансів, де виклик інструмента очікується на кожному ході.
- Безпека: локальні моделі пропускають фільтри на боці постачальника; тримайте агентів вузько сфокусованими й увімкніть Compaction, щоб обмежити радіус ураження prompt injection.

## Повʼязане

- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Відмовостійке перемикання моделей](/uk/concepts/model-failover)
