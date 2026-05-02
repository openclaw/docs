---
read_when:
    - Ви хочете обслуговувати моделі з власного комп’ютера з GPU
    - Ви підключаєте LM Studio або проксі, сумісний з OpenAI
    - Вам потрібні найбезпечніші рекомендації щодо локальної моделі
summary: Запускайте OpenClaw на локальних LLM (LM Studio, vLLM, LiteLLM, власні кінцеві точки OpenAI)
title: Локальні моделі
x-i18n:
    generated_at: "2026-05-02T21:49:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 29ab8530620370e0c213714bf6fef67bafed878055102cea47935c85b6238ffb
    source_path: gateway/local-models.md
    workflow: 16
---

Локальні моделі цілком можливі. Але вони також підвищують вимоги до обладнання, розміру контексту та захисту від prompt-injection — малі або агресивно квантизовані карти урізають контекст і послаблюють безпеку. Ця сторінка — упереджений посібник для продуктивніших локальних стеків і власних локальних серверів, сумісних з OpenAI. Для найпростішого старту почніть з [LM Studio](/uk/providers/lmstudio) або [Ollama](/uk/providers/ollama) і `openclaw onboard`.

## Мінімальне обладнання

Орієнтуйтеся високо: **≥2 максимально укомплектовані Mac Studio або еквівалентна GPU-система (~$30k+)** для комфортного циклу агента. Один GPU на **24 GB** підходить лише для легших промптів із більшою затримкою. Завжди запускайте **найбільший / повнорозмірний варіант, який можете розмістити**; малі або сильно квантизовані checkpoint-и підвищують ризик prompt-injection (див. [Безпека](/uk/gateway/security)).

## Виберіть бекенд

| Бекенд                                               | Використовуйте, коли                                                        |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/uk/providers/lmstudio)                     | Перше локальне налаштування, GUI-завантажувач, нативний Responses API       |
| [Ollama](/uk/providers/ollama)                          | CLI-процес, бібліотека моделей, автономний сервіс systemd                   |
| MLX / vLLM / SGLang                                  | Високопродуктивний самостійний сервінг з OpenAI-сумісною HTTP-точкою доступу |
| LiteLLM / OAI-proxy / власний OpenAI-сумісний проксі | Ви ставите перед іншою model API проксі й хочете, щоб OpenClaw сприймав її як OpenAI |

Використовуйте Responses API (`api: "openai-responses"`), коли бекенд його підтримує (LM Studio підтримує). Інакше використовуйте Chat Completions (`api: "openai-completions"`).

<Warning>
**Користувачі WSL2 + Ollama + NVIDIA/CUDA:** офіційний Linux-інсталятор Ollama вмикає сервіс systemd з `Restart=always`. У WSL2 GPU-конфігураціях автозапуск може під час завантаження повторно завантажити останню модель і закріпити пам’ять хоста. Якщо ваша WSL2 VM постійно перезапускається після ввімкнення Ollama, див. [цикл аварій WSL2](/uk/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Рекомендовано: LM Studio + велика локальна модель (Responses API)

Найкращий актуальний локальний стек. Завантажте велику модель у LM Studio (наприклад, повнорозмірну збірку Qwen, DeepSeek або Llama), увімкніть локальний сервер (за замовчуванням `http://127.0.0.1:1234`) і використовуйте Responses API, щоб тримати reasoning окремо від фінального тексту.

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
- У LM Studio завантажте **найбільшу доступну збірку моделі** (уникайте “small”/сильно квантизованих варіантів), запустіть сервер і переконайтеся, що `http://127.0.0.1:1234/v1/models` її показує.
- Замініть `my-local-model` на фактичний ID моделі, показаний у LM Studio.
- Тримайте модель завантаженою; холодне завантаження додає затримку запуску.
- Налаштуйте `contextWindow`/`maxTokens`, якщо ваша збірка LM Studio відрізняється.
- Для WhatsApp використовуйте Responses API, щоб надсилати лише фінальний текст.

Залишайте hosted-моделі налаштованими навіть під час локального запуску; використовуйте `models.mode: "merge"`, щоб fallback-и лишалися доступними.

### Гібридна конфігурація: hosted-основна модель, локальний fallback

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

### Локальна першість із hosted-запобіжником

Поміняйте місцями порядок основної моделі й fallback-а; залиште той самий блок providers і `models.mode: "merge"`, щоб можна було повернутися до Sonnet або Opus, коли локальна машина недоступна.

### Регіональний hosting / маршрутизація даних

- Hosted-варіанти MiniMax/Kimi/GLM також доступні на OpenRouter з прив’язаними до регіону точками доступу (наприклад, hosted у США). Виберіть там регіональний варіант, щоб тримати трафік у вибраній юрисдикції, водночас використовуючи `models.mode: "merge"` для fallback-ів Anthropic/OpenAI.
- Лише локальний режим залишається найсильнішим шляхом для приватності; hosted-регіональна маршрутизація — це компроміс, коли потрібні можливості провайдера, але потрібен контроль над потоком даних.

## Інші OpenAI-сумісні локальні проксі

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy або власні
Gateway-и працюють, якщо вони надають OpenAI-style `/v1/chat/completions`
точку доступу. Використовуйте адаптер Chat Completions, якщо бекенд явно не
документує підтримку `/v1/responses`. Замініть наведений вище блок provider на вашу
точку доступу й ID моделі:

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

Якщо `api` пропущено у власному provider з `baseUrl`, OpenClaw за замовчуванням використовує
`openai-completions`. Точки доступу loopback, як-от `127.0.0.1`, довірені
автоматично; LAN, tailnet і приватні DNS-точки доступу все одно потребують
`request.allowPrivateNetwork: true`.

Значення `models.providers.<id>.models[].id` є локальним для provider. Не
включайте туди префікс provider. Наприклад, MLX-сервер, запущений з
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit`, має використовувати такий
catalog id і model ref:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Установіть `input: ["text", "image"]` для локальних або proxied vision-моделей, щоб image
attachments інжектувалися в agent turns. Інтерактивний custom-provider
onboarding визначає поширені ID vision-моделей і питає лише про невідомі назви.
Неінтерактивний onboarding використовує таке саме визначення; використовуйте `--custom-image-input`
для невідомих vision ID або `--custom-text-input`, коли модель зі знайомою назвою є
лише text-only за вашою точкою доступу.

Залишайте `models.mode: "merge"`, щоб hosted-моделі лишалися доступними як fallback-и.
Використовуйте `models.providers.<id>.timeoutSeconds` для повільних локальних або віддалених model
servers перед підвищенням `agents.defaults.timeoutSeconds`. Тайм-аут provider
застосовується лише до model HTTP requests, включно з підключенням, заголовками, потоковою передачею тіла
і загальним guarded-fetch abort.

<Note>
Для власних OpenAI-сумісних provider-ів збереження несекретного локального маркера, як-от `apiKey: "ollama-local"`, приймається, коли `baseUrl` резолвиться в loopback, приватну LAN, `.local` або bare hostname. OpenClaw сприймає його як дійсний локальний credential замість повідомлення про відсутній ключ. Використовуйте реальне значення для будь-якого provider-а, який приймає публічний hostname.
</Note>

Примітка щодо поведінки для локальних/proxied `/v1` бекендів:

- OpenClaw сприймає їх як proxy-style OpenAI-сумісні маршрути, а не нативні
  OpenAI-точки доступу
- native OpenAI-only request shaping тут не застосовується: без
  `service_tier`, без Responses `store`, без OpenAI reasoning-compat payload
  shaping і без prompt-cache hints
- приховані заголовки атрибуції OpenClaw (`originator`, `version`, `User-Agent`)
  не інжектуються в ці custom proxy URLs

Примітки щодо сумісності для суворіших OpenAI-сумісних бекендів:

- Деякі сервери приймають у Chat Completions лише string `messages[].content`, а не
  structured content-part arrays. Установіть
  `models.providers.<provider>.models[].compat.requiresStringContent: true` для
  таких точок доступу.
- Деякі локальні моделі виводять окремі bracketed tool requests як текст, наприклад
  `[tool_name]`, за яким іде JSON і `[END_TOOL_REQUEST]`. OpenClaw перетворює
  їх на справжні tool calls лише тоді, коли назва точно збігається із зареєстрованим
  tool для цього turn; інакше блок вважається unsupported text і
  приховується з видимих для користувача відповідей.
- Якщо модель виводить JSON, XML або ReAct-style text, що схожий на tool call,
  але provider не вивів structured invocation, OpenClaw лишає це як
  text і записує warning з run id, provider/model, detected pattern і
  tool name, коли доступно. Вважайте це несумісністю provider/model tool-call,
  а не завершеним tool run.
- Якщо tools з’являються як assistant text замість запуску, наприклад raw JSON,
  XML, ReAct syntax або порожній масив `tool_calls` у відповіді provider,
  спершу переконайтеся, що сервер використовує tool-call-capable chat template/parser. Для
  OpenAI-сумісних Chat Completions бекендів, parser яких працює лише коли tool
  use примусово ввімкнено, установіть per-model request override замість покладання на text
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

  Використовуйте це лише для моделей/сесій, де кожен звичайний turn має викликати tool.
  Це перевизначає стандартне proxy-значення OpenClaw `tool_choice: "auto"`.
  Замініть `local/my-local-model` на точний provider/model ref, показаний
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Якщо власна OpenAI-сумісна модель приймає OpenAI reasoning efforts поза
  вбудованим профілем, оголосіть їх у model compat block. Додавання `"xhigh"`
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

Якщо модель завантажується без проблем, але повні agent turns працюють неправильно, рухайтеся згори вниз — спершу підтвердьте transport, потім звужуйте поверхню.

1. **Підтвердьте, що сама локальна модель відповідає.** Без інструментів, без контексту агента:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Підтвердьте маршрутизацію Gateway.** Надсилає лише наданий prompt — пропускає транскрипт, ініціалізацію AGENTS, збирання context-engine, інструменти та вбудовані сервери MCP, але все одно перевіряє маршрутизацію Gateway, автентифікацію та вибір провайдера:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Спробуйте полегшений режим.** Якщо обидві перевірки проходять, але реальні ходи агента завершуються помилками через некоректно сформовані виклики інструментів або завеликі prompt-и, увімкніть `agents.defaults.experimental.localModelLean: true`. Це прибирає три найважчі стандартні інструменти (`browser`, `cron`, `message`), тож форма prompt-а стає меншою та менш крихкою. Див. [Експериментальні функції → полегшений режим локальної моделі](/uk/concepts/experimental-features#local-model-lean-mode), щоб отримати повне пояснення, дізнатися, коли його використовувати, і як підтвердити, що він увімкнений.

4. **Повністю вимкніть інструменти як останній засіб.** Якщо полегшеного режиму недостатньо, задайте `models.providers.<provider>.models[].compat.supportsTools: false` для запису цієї моделі. Після цього агент працюватиме з цією моделлю без викликів інструментів.

5. **Після цього вузьке місце — на upstream-боці.** Якщо backend усе ще падає лише на більших запусках OpenClaw після полегшеного режиму та `supportsTools: false`, решта проблеми зазвичай пов’язана з upstream-моделлю або місткістю сервера — контекстним вікном, пам’яттю GPU, витісненням kv-cache або помилкою backend. На цьому етапі це вже не транспортний рівень OpenClaw.

## Усунення несправностей

- Gateway може дістатися до проксі? `curl http://127.0.0.1:1234/v1/models`.
- Модель LM Studio вивантажена? Перезавантажте її; холодний старт є поширеною причиною «зависання».
- Локальний сервер повідомляє `terminated`, `ECONNRESET` або закриває потік посеред ходу?
  OpenClaw записує низькокардинальний `model.call.error.failureKind`, а також
  знімок RSS/heap процесу OpenClaw у діагностиці. Для проблем із пам’яттю в LM Studio/Ollama
  зіставте цей timestamp із журналом сервера або журналом аварій macOS /
  jetsam, щоб підтвердити, чи було завершено процес сервера моделі.
- OpenClaw виводить пороги попередньої перевірки контекстного вікна з виявленого вікна моделі або з необмеженого вікна моделі, коли `agents.defaults.contextTokens` зменшує ефективне вікно. Він попереджає нижче 20% з мінімумом **8k**. Жорстке блокування використовує поріг 10% з мінімумом **4k**, обмежений ефективним контекстним вікном, щоб завеликі метадані моделі не могли відхилити інакше коректне користувацьке обмеження. Якщо ви натрапили на цю попередню перевірку, збільште ліміт контексту сервера/моделі або виберіть більшу модель.
- Помилки контексту? Зменште `contextWindow` або збільште ліміт сервера.
- OpenAI-сумісний сервер повертає `messages[].content ... expected a string`?
  Додайте `compat.requiresStringContent: true` до запису цієї моделі.
- Прямі маленькі виклики `/v1/chat/completions` працюють, але `openclaw infer model run --local`
  падає на Gemma або іншій локальній моделі? Спершу перевірте URL провайдера, посилання на модель, маркер автентифікації
  та журнали сервера; локальний `model run` не включає інструменти агента.
  Якщо локальний `model run` успішний, але більші ходи агента падають, зменште поверхню інструментів агента
  за допомогою `localModelLean` або `compat.supportsTools: false`.
- Виклики інструментів з’являються як сирий текст JSON/XML/ReAct, або провайдер повертає
  порожній масив `tool_calls`? Не додавайте проксі, який наосліп перетворює текст асистента
  на виконання інструментів. Спершу виправте chat template/parser сервера. Якщо
  модель працює лише тоді, коли використання інструментів примусове, додайте наведене вище override для окремої моделі
  `params.extra_body.tool_choice: "required"` і використовуйте цей запис моделі
  лише для сесій, де виклик інструмента очікується на кожному ході.
- Безпека: локальні моделі обходять фільтри на боці провайдера; тримайте агентів вузькоспеціалізованими та Compaction увімкненою, щоб обмежити радіус ураження prompt injection.

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [Відмова та перемикання моделей](/uk/concepts/model-failover)
