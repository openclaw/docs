---
read_when:
    - Ви хочете обслуговувати моделі на власному сервері з GPU
    - Ви підключаєте LM Studio або OpenAI-сумісний проксі
    - Вам потрібні рекомендації щодо найбезпечнішої локальної моделі
summary: Запускайте OpenClaw на локальних LLM (LM Studio, vLLM, LiteLLM, власні кінцеві точки OpenAI)
title: Локальні моделі
x-i18n:
    generated_at: "2026-05-11T20:38:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 83a5667aa5bef697a890b0d8b6b8f5e4de56fa3cdcdfe5a5dbb826a62b64fbcf
    source_path: gateway/local-models.md
    workflow: 16
---

Локальні моделі можливі. Вони також підвищують вимоги до апаратного забезпечення, розміру контексту та захисту від prompt injection — малі або агресивно квантизовані карти обрізають контекст і послаблюють безпеку. Ця сторінка — практичний посібник для локальних стеків вищого рівня та власних локальних серверів, сумісних з OpenAI. Для найпростішого початкового налаштування почніть з [LM Studio](/uk/providers/lmstudio) або [Ollama](/uk/providers/ollama) і `openclaw onboard`.

Для локальних серверів, які мають запускатися лише тоді, коли вони потрібні вибраній моделі, див.
[Сервіси локальних моделей](/uk/gateway/local-model-services).

## Мінімальні вимоги до апаратного забезпечення

Орієнтуйтеся на високий рівень: **≥2 максимально укомплектовані Mac Studio або еквівалентна GPU-конфігурація (~$30k+)** для комфортного агентного циклу. Один GPU на **24 GB** підходить лише для легших промптів із більшою затримкою. Завжди запускайте **найбільший / повнорозмірний варіант, який можете розмістити**; малі або сильно квантизовані checkpoints підвищують ризик prompt injection (див. [Безпека](/uk/gateway/security)).

## Вибір бекенда

| Бекенд                                               | Коли використовувати                                                       |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [LM Studio](/uk/providers/lmstudio)                     | Перше локальне налаштування, GUI-завантажувач, нативний Responses API      |
| [Ollama](/uk/providers/ollama)                          | CLI-робочий процес, бібліотека моделей, автоматизований systemd-сервіс     |
| MLX / vLLM / SGLang                                  | Високопродуктивне самостійне обслуговування з OpenAI-сумісним HTTP endpoint |
| LiteLLM / OAI-proxy / власний OpenAI-сумісний proxy  | Ви ставите інший API моделі перед OpenClaw і хочете, щоб він сприймався як OpenAI |

Використовуйте Responses API (`api: "openai-responses"`), коли бекенд його підтримує (LM Studio підтримує). Інакше залишайтеся на Chat Completions (`api: "openai-completions"`).

<Warning>
**Користувачі WSL2 + Ollama + NVIDIA/CUDA:** офіційний Linux-інсталятор Ollama вмикає systemd-сервіс із `Restart=always`. У WSL2 GPU-конфігураціях автозапуск може повторно завантажити останню модель під час boot і зафіксувати пам’ять хоста. Якщо ваша WSL2 VM багаторазово перезапускається після ввімкнення Ollama, див. [циклічний збій WSL2](/uk/providers/ollama#wsl2-crash-loop-repeated-reboots).
</Warning>

## Рекомендовано: LM Studio + велика локальна модель (Responses API)

Найкращий поточний локальний стек. Завантажте велику модель у LM Studio (наприклад, повнорозмірну збірку Qwen, DeepSeek або Llama), увімкніть локальний сервер (за замовчуванням `http://127.0.0.1:1234`) і використовуйте Responses API, щоб тримати reasoning окремо від фінального тексту.

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
- У LM Studio завантажте **найбільшу доступну збірку моделі** (уникайте "small"/сильно квантизованих варіантів), запустіть сервер, підтвердьте, що `http://127.0.0.1:1234/v1/models` показує її.
- Замініть `my-local-model` на фактичний ID моделі, показаний у LM Studio.
- Тримайте модель завантаженою; cold-load додає затримку запуску.
- Налаштуйте `contextWindow`/`maxTokens`, якщо ваша збірка LM Studio відрізняється.
- Для WhatsApp залишайтеся на Responses API, щоб надсилався лише фінальний текст.

Тримайте hosted-моделі налаштованими навіть під час локального запуску; використовуйте `models.mode: "merge"`, щоб fallback-и залишалися доступними.

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

Поміняйте місцями порядок primary і fallback; залиште той самий блок providers і `models.mode: "merge"`, щоб можна було перейти на Sonnet або Opus, коли локальна машина недоступна.

### Регіональний hosting / маршрутизація даних

- Hosted-варіанти MiniMax/Kimi/GLM також доступні на OpenRouter із endpoints, прив’язаними до регіону (наприклад, розміщені в США). Виберіть там регіональний варіант, щоб утримувати трафік у вибраній юрисдикції, водночас використовуючи `models.mode: "merge"` для fallback-ів Anthropic/OpenAI.
- Local-only залишається найсильнішим шляхом для приватності; hosted регіональна маршрутизація — це проміжний варіант, коли потрібні функції провайдера, але потрібен контроль над потоком даних.

## Інші OpenAI-сумісні локальні proxy

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy або власні
gateways працюють, якщо вони надають OpenAI-подібний endpoint `/v1/chat/completions`.
Використовуйте адаптер Chat Completions, якщо бекенд явно не
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

Якщо `api` пропущено у власному provider з `baseUrl`, OpenClaw за замовчуванням використовує
`openai-completions`. Loopback endpoints, такі як `127.0.0.1`, довіряються
автоматично; endpoints LAN, tailnet і private DNS все одно потребують
`request.allowPrivateNetwork: true`.

Значення `models.providers.<id>.models[].id` є локальним для provider. Не
додавайте туди префікс provider. Наприклад, MLX-сервер, запущений із
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit`, має використовувати цей
catalog id і model ref:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Установіть `input: ["text", "image"]` для локальних або proxied vision-моделей, щоб image
attachments вставлялися в agent turns. Інтерактивний onboarding власного provider
розпізнає поширені ID vision-моделей і запитує лише невідомі назви.
Неінтерактивний onboarding використовує те саме розпізнавання; використовуйте `--custom-image-input`
для невідомих vision ID або `--custom-text-input`, коли модель, що виглядає як відома,
є text-only за вашим endpoint.

Зберігайте `models.mode: "merge"`, щоб hosted-моделі залишалися доступними як fallback-и.
Використовуйте `models.providers.<id>.timeoutSeconds` для повільних локальних або віддалених
серверів моделей перед збільшенням `agents.defaults.timeoutSeconds`. Тайм-аут provider
застосовується лише до HTTP-запитів моделі, включно з підключенням, headers, streaming body
і загальним перериванням guarded-fetch.

<Note>
Для власних OpenAI-сумісних providers дозволено зберігати несекретний локальний маркер, як-от `apiKey: "ollama-local"`, коли `baseUrl` резолвиться в loopback, приватну LAN, `.local` або bare hostname. OpenClaw сприймає його як дійсний локальний credential замість повідомлення про відсутній ключ. Використовуйте справжнє значення для будь-якого provider, який приймає публічний hostname.
</Note>

Примітка щодо поведінки для локальних/proxied `/v1` бекендів:

- OpenClaw сприймає їх як proxy-style OpenAI-сумісні routes, а не нативні
  OpenAI endpoints
- нативне OpenAI-only формування запиту тут не застосовується: без
  `service_tier`, без Responses `store`, без OpenAI reasoning-compat payload
  shaping і без prompt-cache hints
- приховані attribution headers OpenClaw (`originator`, `version`, `User-Agent`)
  не додаються до цих custom proxy URLs

Примітки щодо сумісності для суворіших OpenAI-сумісних бекендів:

- Деякі сервери приймають лише рядковий `messages[].content` у Chat Completions, а не
  structured content-part arrays. Установіть
  `models.providers.<provider>.models[].compat.requiresStringContent: true` для
  таких endpoints.
- Деякі локальні моделі виводять окремі bracketed tool requests як текст, наприклад
  `[tool_name]`, за яким іде JSON і `[END_TOOL_REQUEST]`. OpenClaw перетворює
  їх на справжні tool calls лише тоді, коли назва точно збігається із зареєстрованим
  tool для turn; інакше блок сприймається як unsupported text і
  приховується з user-visible replies.
- Якщо модель виводить JSON, XML або ReAct-style text, що виглядає як tool call,
  але provider не видав structured invocation, OpenClaw залишає це як
  текст і записує warning з run id, provider/model, detected pattern і
  tool name, коли доступно. Сприймайте це як несумісність provider/model tool-call,
  а не як завершений tool run.
- Якщо tools з’являються як assistant text замість запуску, наприклад raw JSON,
  XML, ReAct syntax або порожній масив `tool_calls` у відповіді provider,
  спочатку перевірте, що сервер використовує chat template/parser із підтримкою tool-call. Для
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

  Використовуйте це лише для моделей/сесій, де кожен нормальний turn має викликати tool.
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

Якщо модель завантажується без помилок, але повні ходи агента працюють некоректно, рухайтеся згори вниз — спочатку підтвердьте транспорт, потім звужуйте поверхню.

1. **Підтвердьте, що локальна модель сама відповідає.** Без інструментів, без контексту агента:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Підтвердьте маршрутизацію Gateway.** Надсилає лише наданий промпт — пропускає транскрипт, ініціалізацію AGENTS, збирання context-engine, інструменти та вбудовані MCP сервери, але все одно перевіряє маршрутизацію Gateway, автентифікацію та вибір провайдера:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Спробуйте lean mode.** Якщо обидві проби проходять, але реальні ходи агента падають через некоректно сформовані виклики інструментів або надто великі промпти, увімкніть `agents.defaults.experimental.localModelLean: true`. Це прибирає три найважчі стандартні інструменти (`browser`, `cron`, `message`), тож форма промпта стає меншою й менш крихкою. Повне пояснення, коли це використовувати та як підтвердити, що режим увімкнено, див. у [Експериментальні функції → Lean mode для локальної моделі](/uk/concepts/experimental-features#local-model-lean-mode).

4. **Повністю вимкніть інструменти як останній засіб.** Якщо lean mode недостатньо, задайте `models.providers.<provider>.models[].compat.supportsTools: false` для цього запису моделі. Після цього агент працюватиме на цій моделі без викликів інструментів.

5. **Після цього вузьке місце — вище за стеком.** Якщо після lean mode і `supportsTools: false` бекенд усе ще падає лише на більших запусках OpenClaw, решта проблеми зазвичай у моделі або місткості сервера вище за стеком — вікні контексту, пам’яті GPU, витісненні kv-cache або багу бекенда. На цьому етапі це вже не транспортний рівень OpenClaw.

## Усунення несправностей

- Gateway може дістатися до проксі? `curl http://127.0.0.1:1234/v1/models`.
- Модель LM Studio вивантажена? Перезавантажте; холодний старт є поширеною причиною «зависання».
- Локальний сервер повідомляє `terminated`, `ECONNRESET` або закриває потік посеред ходу?
  OpenClaw записує низькокардинальний `model.call.error.failureKind` плюс знімок
  RSS/heap процесу OpenClaw у діагностиці. Для тиску на пам’ять у LM Studio/Ollama
  зіставте цю часову мітку з журналом сервера або журналом аварійного завершення macOS /
  jetsam, щоб підтвердити, чи було вбито сервер моделі.
- OpenClaw виводить пороги попередньої перевірки вікна контексту з виявленого вікна моделі або з необмеженого вікна моделі, коли `agents.defaults.contextTokens` зменшує ефективне вікно. Він попереджає нижче 20% із нижньою межею **8k**. Жорсткі блокування використовують поріг 10% із нижньою межею **4k**, обмежений ефективним вікном контексту, щоб завеликий метаданими розмір моделі не відхилив інакше коректне користувацьке обмеження. Якщо ви натрапили на цю попередню перевірку, підвищте ліміт контексту сервера/моделі або виберіть більшу модель.
- Помилки контексту? Зменште `contextWindow` або підвищте ліміт сервера.
- OpenAI-сумісний сервер повертає `messages[].content ... expected a string`?
  Додайте `compat.requiresStringContent: true` у цей запис моделі.
- OpenAI-сумісний сервер повертає `validation.keys` або каже, що записи повідомлень дозволяють лише `role` і `content`?
  Додайте `compat.strictMessageKeys: true` у цей запис моделі.
- Прямі крихітні виклики `/v1/chat/completions` працюють, але `openclaw infer model run --local`
  падає на Gemma або іншій локальній моделі? Спершу перевірте URL провайдера, посилання на модель, маркер автентифікації
  та журнали сервера; локальний `model run` не включає інструменти агента.
  Якщо локальний `model run` проходить, але більші ходи агента падають, зменште
  поверхню інструментів агента за допомогою `localModelLean` або `compat.supportsTools: false`.
- Виклики інструментів з’являються як сирий JSON/XML/ReAct текст або провайдер повертає
  порожній масив `tool_calls`? Не додавайте проксі, який сліпо перетворює текст асистента
  на виконання інструментів. Спершу виправте chat template/parser сервера. Якщо
  модель працює лише коли використання інструментів примусове, додайте наведене вище перевизначення для окремої моделі
  `params.extra_body.tool_choice: "required"` і використовуйте цей запис моделі
  лише для сесій, де виклик інструмента очікується на кожному ході.
- Безпека: локальні моделі пропускають фільтри на боці провайдера; тримайте агентів вузькими й увімкніть Compaction, щоб обмежити радіус ураження prompt injection.

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [Failover моделей](/uk/concepts/model-failover)
