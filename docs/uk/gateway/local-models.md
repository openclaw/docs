---
read_when:
    - Ви хочете обслуговувати моделі з власної GPU-машини
    - Ви підключаєте LM Studio або OpenAI-сумісний проксі
    - Вам потрібні рекомендації щодо найбезпечнішої локальної моделі
summary: Запускайте OpenClaw на локальних LLM-моделях (LM Studio, vLLM, LiteLLM, користувацькі кінцеві точки OpenAI)
title: Локальні моделі
x-i18n:
    generated_at: "2026-04-28T11:12:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4be447ece49ec1b41456db54a223679f4e399b8e9231925fd08d12999af246c9
    source_path: gateway/local-models.md
    workflow: 16
---

Локально це можливо, але OpenClaw очікує великий контекст + сильний захист від prompt injection. Малі карти обрізають контекст і погіршують безпеку. Цільтеся високо: **≥2 максимально укомплектовані Mac Studio або еквівалентна GPU-система (~$30k+)**. Один GPU на **24 GB** працює лише для легших промптів із вищою затримкою. Використовуйте **найбільший / повнорозмірний варіант моделі, який можете запустити**; агресивно квантизовані або “малі” контрольні точки підвищують ризик prompt-injection (див. [Безпека](/uk/gateway/security)).

Якщо вам потрібне локальне налаштування з мінімальним тертям, почніть із [LM Studio](/uk/providers/lmstudio) або [Ollama](/uk/providers/ollama) і `openclaw onboard`. Ця сторінка — рекомендаційний посібник для продуктивніших локальних стеків і кастомних локальних серверів, сумісних з OpenAI.

<Warning>
**Користувачі WSL2 + Ollama + NVIDIA/CUDA:** Офіційний інсталятор Ollama для Linux вмикає службу systemd з `Restart=always`. У GPU-налаштуваннях WSL2 автозапуск може повторно завантажити останню модель під час завантаження системи й закріпити пам’ять хоста. Якщо ваша WSL2 VM неодноразово перезапускається після ввімкнення Ollama, див. [цикл аварійного перезапуску WSL2](/uk/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Рекомендовано: LM Studio + велика локальна модель (Responses API)

Найкращий поточний локальний стек. Завантажте велику модель у LM Studio (наприклад, повнорозмірну збірку Qwen, DeepSeek або Llama), увімкніть локальний сервер (типово `http://127.0.0.1:1234`) і використовуйте Responses API, щоб відокремити reasoning від фінального тексту.

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
- У LM Studio завантажте **найбільшу доступну збірку моделі** (уникайте “малих”/сильно квантизованих варіантів), запустіть сервер, підтвердьте, що `http://127.0.0.1:1234/v1/models` показує її у списку.
- Замініть `my-local-model` на фактичний ID моделі, показаний у LM Studio.
- Тримайте модель завантаженою; холодне завантаження додає затримку під час запуску.
- Налаштуйте `contextWindow`/`maxTokens`, якщо ваша збірка LM Studio відрізняється.
- Для WhatsApp дотримуйтеся Responses API, щоб надсилався лише фінальний текст.

Залишайте розміщені моделі налаштованими навіть під час локального запуску; використовуйте `models.mode: "merge"`, щоб fallback-и залишалися доступними.

### Гібридна конфігурація: розміщена основна модель, локальний fallback

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

### Локальна модель першою з розміщеною захисною сіткою

Поміняйте місцями порядок primary і fallback; залиште той самий блок providers і `models.mode: "merge"`, щоб можна було відкотитися до Sonnet або Opus, коли локальна машина недоступна.

### Регіональне розміщення / маршрутизація даних

- Розміщені варіанти MiniMax/Kimi/GLM також існують в OpenRouter з прив’язаними до регіону endpoint-ами (наприклад, розміщені у США). Виберіть там регіональний варіант, щоб тримати трафік у вибраній юрисдикції, водночас використовуючи `models.mode: "merge"` для fallback-ів Anthropic/OpenAI.
- Лише локальний режим залишається найсильнішим шляхом для приватності; розміщена регіональна маршрутизація — це компроміс, коли потрібні функції провайдера, але потрібен контроль над потоком даних.

## Інші локальні проксі, сумісні з OpenAI

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy або кастомні
Gateway-и працюють, якщо вони надають endpoint у стилі OpenAI `/v1/chat/completions`.
Використовуйте адаптер Chat Completions, якщо бекенд явно не документує
підтримку `/v1/responses`. Замініть наведений вище блок provider на ваш
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

Якщо `api` пропущено для кастомного provider з `baseUrl`, OpenClaw типово використовує
`openai-completions`. Loopback endpoint-и, як-от `127.0.0.1`, автоматично
вважаються довіреними; endpoint-и LAN, tailnet і приватного DNS все одно потребують
`request.allowPrivateNetwork: true`.

Значення `models.providers.<id>.models[].id` є локальним для provider-а. Не
включайте туди префікс provider-а. Наприклад, сервер MLX, запущений з
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit`, має використовувати такий
ID каталогу й посилання на модель:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Встановіть `input: ["text", "image"]` для локальних або проксійованих vision-моделей, щоб
вкладення зображень додавалися в ходи агента. Інтерактивний onboarding кастомного provider-а
виводить поширені ID vision-моделей і запитує лише невідомі назви.
Неінтерактивний onboarding використовує той самий висновок; використовуйте `--custom-image-input`
для невідомих vision ID або `--custom-text-input`, коли модель із назвою, схожою на відому,
є text-only за вашим endpoint-ом.

Залишайте `models.mode: "merge"`, щоб розміщені моделі залишалися доступними як fallback-и.
Використовуйте `models.providers.<id>.timeoutSeconds` для повільних локальних або віддалених
серверів моделей перед підвищенням `agents.defaults.timeoutSeconds`. Таймаут provider-а
застосовується лише до HTTP-запитів моделі, включно з підключенням, заголовками, потоковою передачею тіла
та загальним перериванням guarded-fetch.

<Note>
Для кастомних provider-ів, сумісних з OpenAI, збереження несекретного локального маркера, як-от `apiKey: "ollama-local"`, приймається, коли `baseUrl` розв’язується в loopback, приватну LAN, `.local` або просте ім’я хоста. OpenClaw розглядає його як дійсний локальний credential замість повідомлення про відсутній ключ. Використовуйте реальне значення для будь-якого provider-а, який приймає публічне ім’я хоста.
</Note>

Примітка щодо поведінки локальних/проксійованих бекендів `/v1`:

- OpenClaw розглядає їх як proxy-style маршрути, сумісні з OpenAI, а не як нативні
  endpoint-и OpenAI
- нативне OpenAI-only формування запитів тут не застосовується: без
  `service_tier`, без Responses `store`, без формування payload для сумісності з OpenAI reasoning
  і без підказок prompt-cache
- приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`)
  не додаються до цих кастомних proxy URL

Примітки щодо сумісності для суворіших бекендів, сумісних з OpenAI:

- Деякі сервери приймають лише рядковий `messages[].content` у Chat Completions, а не
  структуровані масиви content-part. Встановіть
  `models.providers.<provider>.models[].compat.requiresStringContent: true` для
  таких endpoint-ів.
- Деякі локальні моделі видають окремі bracketed tool requests як текст, наприклад
  `[tool_name]`, за яким іде JSON і `[END_TOOL_REQUEST]`. OpenClaw перетворює
  їх на реальні tool calls лише тоді, коли назва точно збігається із зареєстрованим
  інструментом для цього ходу; інакше блок розглядається як непідтримуваний текст і
  приховується з відповідей, видимих користувачу.
- Якщо модель видає JSON, XML або текст у стилі ReAct, який виглядає як tool call,
  але provider не видав структурований invocation, OpenClaw залишає це як
  текст і записує попередження з run id, provider/model, виявленим шаблоном і
  назвою інструмента, якщо вона доступна. Розглядайте це як несумісність tool-call
  у provider/model, а не як завершений запуск інструмента.
- Якщо інструменти з’являються як текст assistant замість виконання, наприклад raw JSON,
  XML, синтаксис ReAct або порожній масив `tool_calls` у відповіді provider-а,
  спершу перевірте, що сервер використовує chat template/parser із підтримкою tool-call. Для
  OpenAI-compatible бекендів Chat Completions, parser яких працює лише коли використання інструментів
  примусове, встановіть per-model request override замість покладання на text
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
  Замініть `local/my-local-model` на точне посилання provider/model, показане
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Деякі менші або суворіші локальні бекенди нестабільні з повною
  формою agent-runtime prompt OpenClaw, особливо коли включено схеми інструментів. Спершу
  перевірте шлях provider-а за допомогою lean local probe:

  ```bash
  openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  Щоб перевірити маршрут Gateway без повної форми agent prompt, використовуйте
  натомість Gateway model probe:

  ```bash
  openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
  ```

  І локальний, і Gateway model probes надсилають лише наданий prompt. Gateway
  probe все одно перевіряє маршрутизацію Gateway, автентифікацію та вибір provider-а,
  але навмисно пропускає попередній transcript сесії, AGENTS/bootstrap context,
  складання context-engine, інструменти та bundled MCP servers.

  Якщо це успішно, але звичайні ходи агента OpenClaw не вдаються, спершу спробуйте
  `agents.defaults.experimental.localModelLean: true`, щоб прибрати важкі
  стандартні інструменти, як-от `browser`, `cron` і `message`; це експериментальний
  прапорець, а не стабільне налаштування default-mode. Див.
  [Експериментальні функції](/uk/concepts/experimental-features). Якщо це все ще не працює, спробуйте
  `models.providers.<provider>.models[].compat.supportsTools: false`.

- Якщо бекенд усе ще падає лише на більших запусках OpenClaw, решта проблеми
  зазвичай пов’язана з місткістю upstream-моделі/сервера або помилкою бекенда, а не з
  транспортним шаром OpenClaw.

## Усунення несправностей

- Gateway може дістатися до проксі? `curl http://127.0.0.1:1234/v1/models`.
- Модель LM Studio вивантажено? Перезавантажте; холодний старт є поширеною причиною «зависання».
- Локальний сервер повідомляє `terminated`, `ECONNRESET` або закриває потік посеред ходу?
  OpenClaw записує низькокардинальний `model.call.error.failureKind` плюс знімок
  RSS/heap процесу OpenClaw у діагностиці. Для тиску на пам’ять LM Studio/Ollama
  зіставте цю часову позначку з журналом сервера або журналом аварій macOS /
  jetsam, щоб підтвердити, чи було завершено сервер моделі.
- OpenClaw попереджає, коли виявлене контекстне вікно менше за **32k**, і блокує роботу нижче **16k**. Якщо ви натрапили на цю попередню перевірку, збільште ліміт контексту сервера/моделі або виберіть більшу модель.
- Помилки контексту? Зменште `contextWindow` або збільште ліміт сервера.
- OpenAI-сумісний сервер повертає `messages[].content ... expected a string`?
  Додайте `compat.requiresStringContent: true` до цього запису моделі.
- Прямі крихітні виклики `/v1/chat/completions` працюють, але `openclaw infer model run --local`
  не вдається на Gemma або іншій локальній моделі? Спершу перевірте URL провайдера, посилання на модель, маркер автентифікації
  та журнали сервера; локальний `model run` не включає інструменти агента.
  Якщо локальний `model run` успішний, але більші ходи агента не вдаються, зменште
  поверхню інструментів агента за допомогою `localModelLean` або `compat.supportsTools: false`.
- Виклики інструментів відображаються як сирий JSON/XML/ReAct-текст, або провайдер повертає
  порожній масив `tool_calls`? Не додавайте проксі, який сліпо перетворює текст
  асистента на виконання інструментів. Спершу виправте chat-шаблон/парсер сервера. Якщо
  модель працює лише тоді, коли використання інструментів примусове, додайте наведене вище
  перевизначення для окремої моделі `params.extra_body.tool_choice: "required"` і використовуйте цей запис моделі
  лише для сеансів, де виклик інструмента очікується на кожному ході.
- Безпека: локальні моделі оминають фільтри на боці провайдера; тримайте агентів вузькими, а compaction увімкненою, щоб обмежити радіус ураження prompt injection.

## Пов’язане

- [Довідник із конфігурації](/uk/gateway/configuration-reference)
- [Перемикання моделей у разі збою](/uk/concepts/model-failover)
