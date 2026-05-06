---
read_when:
    - Ви хочете обслуговувати моделі на власному сервері з GPU
    - Ви підключаєте LM Studio або OpenAI-сумісний проксі
    - Вам потрібні найбезпечніші рекомендації щодо локальної моделі
summary: Запускайте OpenClaw на локальних LLM (LM Studio, vLLM, LiteLLM, користувацьких кінцевих точках OpenAI)
title: Локальні моделі
x-i18n:
    generated_at: "2026-05-06T05:49:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: cf0a1f960c5d0bd93eebb49e10db1066c305b2bc64401eb5000bf559f7e62349
    source_path: gateway/local-models.md
    workflow: 16
---

Локальні моделі можливі. Вони також підвищують вимоги до обладнання, розміру контексту та захисту від prompt injection — малі або агресивно квантизовані карти обрізають контекст і погіршують безпеку. Ця сторінка — практичний посібник для високопродуктивних локальних стеків і власних OpenAI-сумісних локальних серверів. Для найпростішого старту почніть із [LM Studio](/uk/providers/lmstudio) або [Ollama](/uk/providers/ollama) і `openclaw onboard`.

## Мінімальні вимоги до обладнання

Орієнтуйтеся високо: **≥2 максимально укомплектовані Mac Studio або еквівалентна GPU-система (~$30k+)** для комфортного agent loop. Один GPU на **24 GB** підходить лише для легших prompts із більшою затримкою. Завжди запускайте **найбільший / повнорозмірний варіант, який можете розмістити**; малі або сильно квантизовані checkpoints підвищують ризик prompt injection (див. [Безпека](/uk/gateway/security)).

## Виберіть бекенд

| Бекенд                                              | Використовуйте, коли                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/uk/providers/lmstudio)                     | Перше локальне налаштування, GUI-завантажувач, нативний Responses API                    |
| [Ollama](/uk/providers/ollama)                          | CLI-процес, бібліотека моделей, автономний systemd-сервіс                      |
| MLX / vLLM / SGLang                                  | Високопродуктивне самостійне обслуговування з OpenAI-сумісним HTTP endpoint |
| LiteLLM / OAI-proxy / власний OpenAI-сумісний proxy | Ви проксируєте інший model API і хочете, щоб OpenClaw обробляв його як OpenAI         |

Використовуйте Responses API (`api: "openai-responses"`), коли бекенд його підтримує (LM Studio підтримує). Інакше використовуйте Chat Completions (`api: "openai-completions"`).

<Warning>
**Користувачі WSL2 + Ollama + NVIDIA/CUDA:** офіційний Linux-інсталятор Ollama вмикає systemd-сервіс із `Restart=always`. У WSL2 GPU-конфігураціях автозапуск може перезавантажувати останню модель під час boot і утримувати пам’ять хоста. Якщо ваша WSL2 VM багаторазово перезапускається після ввімкнення Ollama, див. [цикл аварійних перезапусків WSL2](/uk/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Рекомендовано: LM Studio + велика локальна модель (Responses API)

Найкращий поточний локальний стек. Завантажте велику модель у LM Studio (наприклад, повнорозмірну збірку Qwen, DeepSeek або Llama), увімкніть локальний сервер (за замовчуванням `http://127.0.0.1:1234`) і використовуйте Responses API, щоб відокремити reasoning від фінального тексту.

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
- У LM Studio завантажте **найбільшу доступну збірку моделі** (уникайте «малих»/сильно квантизованих варіантів), запустіть сервер і переконайтеся, що `http://127.0.0.1:1234/v1/models` показує її в списку.
- Замініть `my-local-model` фактичним ID моделі, показаним у LM Studio.
- Тримайте модель завантаженою; холодне завантаження додає затримку запуску.
- Налаштуйте `contextWindow`/`maxTokens`, якщо ваша збірка LM Studio відрізняється.
- Для WhatsApp використовуйте Responses API, щоб надсилався лише фінальний текст.

Залишайте hosted-моделі налаштованими навіть під час локального запуску; використовуйте `models.mode: "merge"`, щоб fallback-и лишалися доступними.

### Гібридна конфігурація: hosted primary, локальний fallback

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

### Local-first із hosted safety net

Поміняйте порядок primary і fallback; залиште той самий блок providers і `models.mode: "merge"`, щоб мати змогу fallback до Sonnet або Opus, коли локальний сервер недоступний.

### Регіональний hosting / маршрутизація даних

- Hosted-варіанти MiniMax/Kimi/GLM також доступні на OpenRouter з endpoint-ами, прив’язаними до регіону (наприклад, hosted у США). Виберіть там регіональний варіант, щоб утримувати трафік у вибраній юрисдикції, водночас використовуючи `models.mode: "merge"` для fallback-ів Anthropic/OpenAI.
- Виключно локальний режим лишається найсильнішим шляхом для приватності; hosted регіональна маршрутизація — це компроміс, коли потрібні функції провайдера, але потрібен контроль над потоком даних.

## Інші OpenAI-сумісні локальні proxy

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy або власні
gateways працюють, якщо вони надають OpenAI-стиль `/v1/chat/completions`
endpoint. Використовуйте адаптер Chat Completions, якщо бекенд явно не
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

Якщо `api` пропущено для власного provider із `baseUrl`, OpenClaw за замовчуванням використовує
`openai-completions`. Loopback endpoint-и, як-от `127.0.0.1`, вважаються довіреними
автоматично; endpoint-и LAN, tailnet і приватного DNS усе одно потребують
`request.allowPrivateNetwork: true`.

Значення `models.providers.<id>.models[].id` є локальним для provider. Не
додавайте туди префікс provider. Наприклад, MLX-сервер, запущений із
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit`, має використовувати цей
catalog id і model ref:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Встановіть `input: ["text", "image"]` для локальних або проксійованих vision-моделей, щоб image
attachments додавалися в agent turns. Інтерактивне onboarding для власного provider
виводить поширені ID vision-моделей і запитує лише невідомі назви.
Неінтерактивне onboarding використовує той самий inference; використовуйте `--custom-image-input`
для невідомих vision ID або `--custom-text-input`, коли модель із відомою на вигляд назвою
є text-only за вашим endpoint.

Залишайте `models.mode: "merge"`, щоб hosted-моделі лишалися доступними як fallback-и.
Використовуйте `models.providers.<id>.timeoutSeconds` для повільних локальних або віддалених model
servers, перш ніж підвищувати `agents.defaults.timeoutSeconds`. Provider timeout
застосовується лише до model HTTP requests, зокрема connect, headers, body streaming
і повного guarded-fetch abort.

<Note>
Для власних OpenAI-сумісних providers збереження несекретного локального маркера, як-от `apiKey: "ollama-local"`, приймається, коли `baseUrl` резолвиться в loopback, приватну LAN, `.local` або bare hostname. OpenClaw обробляє його як дійсний локальний credential замість повідомлення про відсутній ключ. Використовуйте справжнє значення для будь-якого provider, який приймає публічний hostname.
</Note>

Примітка щодо поведінки для локальних/проксійованих `/v1` бекендів:

- OpenClaw обробляє їх як proxy-style OpenAI-сумісні routes, а не як нативні
  OpenAI endpoint-и
- нативне лише для OpenAI формування request тут не застосовується: без
  `service_tier`, без Responses `store`, без OpenAI reasoning-compat payload
  shaping і без prompt-cache hints
- приховані attribution headers OpenClaw (`originator`, `version`, `User-Agent`)
  не додаються до цих власних proxy URLs

Примітки щодо сумісності для суворіших OpenAI-сумісних бекендів:

- Деякі servers приймають лише рядковий `messages[].content` у Chat Completions, а не
  структуровані content-part arrays. Встановіть
  `models.providers.<provider>.models[].compat.requiresStringContent: true` для
  таких endpoint-ів.
- Деякі локальні моделі виводять окремі bracketed tool requests як текст, наприклад
  `[tool_name]`, за яким ідуть JSON та `[END_TOOL_REQUEST]`. OpenClaw перетворює
  їх на справжні tool calls лише тоді, коли назва точно збігається із зареєстрованим
  tool для цього turn; інакше блок обробляється як непідтримуваний текст і
  приховується з user-visible replies.
- Якщо модель виводить JSON, XML або ReAct-style text, схожий на tool call,
  але provider не вивів structured invocation, OpenClaw залишає його як
  текст і записує warning із run id, provider/model, detected pattern і
  tool name, коли доступно. Вважайте це несумісністю tool-call для provider/model,
  а не завершеним tool run.
- Якщо tools з’являються як assistant text замість запуску, наприклад raw JSON,
  XML, ReAct syntax або порожній масив `tool_calls` у provider response,
  спершу перевірте, що сервер використовує chat template/parser із підтримкою tool calls. Для
  OpenAI-сумісних бекендів Chat Completions, parser яких працює лише коли tool
  use примусове, встановіть per-model request override замість покладання на text
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

  Використовуйте це лише для models/sessions, де кожен нормальний turn має викликати tool.
  Це перевизначає стандартне proxy-значення OpenClaw `tool_choice: "auto"`.
  Замініть `local/my-local-model` на точний provider/model ref, показаний
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Якщо власна OpenAI-сумісна модель приймає OpenAI reasoning efforts поза
  вбудованим profile, оголосіть їх у model compat block. Додавання `"xhigh"`
  тут робить рівень доступним для `/think xhigh`, session pickers, Gateway validation і `llm-task`
  validation для цього налаштованого provider/model ref:

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

## Менші або суворіші бекенди

Якщо модель завантажується чисто, але повні agent turns працюють некоректно, рухайтеся згори вниз — спочатку підтвердьте transport, потім звужуйте surface.

1. **Підтвердьте, що сама локальна модель відповідає.** Без інструментів, без контексту агента:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Підтвердьте маршрутизацію Gateway.** Надсилає лише наданий промпт — пропускає транскрипт, початкове завантаження AGENTS, збирання контекстного рушія, інструменти й вбудовані сервери MCP, але все одно перевіряє маршрутизацію Gateway, автентифікацію та вибір провайдера:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Спробуйте полегшений режим.** Якщо обидві перевірки проходять, але реальні ходи агента завершуються помилками через некоректні виклики інструментів або завеликі промпти, увімкніть `agents.defaults.experimental.localModelLean: true`. Це прибирає три найважчі стандартні інструменти (`browser`, `cron`, `message`), щоб форма промпта була меншою та менш крихкою. Див. [Експериментальні функції → полегшений режим локальної моделі](/uk/concepts/experimental-features#local-model-lean-mode) для повного пояснення, коли його використовувати та як підтвердити, що він увімкнений.

4. **Повністю вимкніть інструменти як останній засіб.** Якщо полегшеного режиму недостатньо, установіть `models.providers.<provider>.models[].compat.supportsTools: false` для запису цієї моделі. Після цього агент працюватиме з цією моделлю без викликів інструментів.

5. **Після цього вузьке місце — вище за потоком.** Якщо backend усе ще падає лише на більших запусках OpenClaw після полегшеного режиму та `supportsTools: false`, решта проблеми зазвичай полягає в моделі або місткості сервера вище за потоком — контекстному вікні, пам’яті GPU, витісненні kv-cache або помилці backend. На цьому етапі це вже не транспортний шар OpenClaw.

## Усунення неполадок

- Gateway може дістатися до проксі? `curl http://127.0.0.1:1234/v1/models`.
- Модель LM Studio не завантажена? Перезавантажте; холодний старт є поширеною причиною «зависання».
- Локальний сервер повідомляє `terminated`, `ECONNRESET` або закриває потік посеред ходу?
  OpenClaw записує низькокардинальний `model.call.error.failureKind` плюс знімок
  RSS/heap процесу OpenClaw у діагностиці. Для тиску на пам’ять LM Studio/Ollama
  зіставте цю часову мітку з журналом сервера або журналом збою macOS /
  jetsam, щоб підтвердити, чи було вбито сервер моделі.
- OpenClaw виводить пороги попередньої перевірки контекстного вікна з виявленого вікна моделі або з необмеженого вікна моделі, коли `agents.defaults.contextTokens` знижує ефективне вікно. Він попереджає нижче 20% із мінімумом **8k**. Жорсткі блокування використовують поріг 10% із мінімумом **4k**, обмежений ефективним контекстним вікном, щоб завеликі метадані моделі не могли відхилити інакше коректне користувацьке обмеження. Якщо ви натрапили на цю попередню перевірку, збільште ліміт контексту сервера/моделі або виберіть більшу модель.
- Помилки контексту? Зменште `contextWindow` або збільште ліміт сервера.
- OpenAI-сумісний сервер повертає `messages[].content ... expected a string`?
  Додайте `compat.requiresStringContent: true` до запису цієї моделі.
- Прямі крихітні виклики `/v1/chat/completions` працюють, але `openclaw infer model run --local`
  падає на Gemma або іншій локальній моделі? Спершу перевірте URL провайдера, посилання на модель, маркер автентифікації
  та журнали сервера; локальний `model run` не включає інструменти агента.
  Якщо локальний `model run` успішний, але більші ходи агента падають, зменште поверхню
  інструментів агента за допомогою `localModelLean` або `compat.supportsTools: false`.
- Виклики інструментів з’являються як необроблений текст JSON/XML/ReAct, або провайдер повертає
  порожній масив `tool_calls`? Не додавайте проксі, який сліпо перетворює текст асистента
  на виконання інструментів. Спершу виправте chat template/parser сервера. Якщо
  модель працює лише тоді, коли використання інструментів примусове, додайте наведене вище перевизначення
  `params.extra_body.tool_choice: "required"` для окремої моделі та використовуйте цей запис моделі
  лише для сеансів, де виклик інструмента очікується на кожному ході.
- Безпека: локальні моделі пропускають фільтри на боці провайдера; тримайте агентів вузькими, а Compaction увімкненою, щоб обмежити радіус ураження prompt injection.

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [Аварійне перемикання моделі](/uk/concepts/model-failover)
