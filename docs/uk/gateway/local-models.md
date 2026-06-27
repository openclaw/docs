---
read_when:
    - Ви хочете обслуговувати моделі на власному комп’ютері з графічним процесором
    - Ви підключаєте LM Studio або OpenAI-сумісний проксі
    - Вам потрібні найбезпечніші рекомендації щодо локальної моделі
summary: Запускайте OpenClaw на локальних LLM (LM Studio, vLLM, LiteLLM, користувацькі кінцеві точки OpenAI)
title: Локальні моделі
x-i18n:
    generated_at: "2026-06-27T17:34:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 671c92d78fa29c778fd34b6df027cc8f9e7ad507c9d446700d97cd789becd041
    source_path: gateway/local-models.md
    workflow: 16
---

Локальні моделі цілком можливі. Вони також підвищують вимоги до обладнання, розміру контексту та захисту від prompt-injection — маленькі або агресивно квантовані карти обрізають контекст і знижують безпеку. Ця сторінка є практичним, позиційним посібником для продуктивніших локальних стеків і кастомних локальних серверів, сумісних з OpenAI. Для найпростішого онбордингу почніть із [LM Studio](/uk/providers/lmstudio) або [Ollama](/uk/providers/ollama) і `openclaw onboard`.

Для локальних серверів, які мають запускатися лише тоді, коли вони потрібні вибраній моделі, див.
[Сервіси локальних моделей](/uk/gateway/local-model-services).

## Мінімальні вимоги до обладнання

Орієнтуйтеся високо: **≥2 максимально укомплектовані Mac Studio або еквівалентна GPU-система (~$30k+)** для комфортного агентного циклу. Один GPU на **24 GB** підходить лише для легших промптів із вищою затримкою. Завжди запускайте **найбільший / повнорозмірний варіант, який можете розмістити**; маленькі або сильно квантовані checkpoints підвищують ризик prompt-injection (див. [Безпека](/uk/gateway/security)).

## Виберіть бекенд

| Бекенд                                               | Використовуйте, коли                                                         |
| ---------------------------------------------------- | --------------------------------------------------------------------------- |
| [ds4](/uk/providers/ds4)                                | Локальний DeepSeek V4 Flash на macOS Metal із сумісними з OpenAI викликами інструментів |
| [LM Studio](/uk/providers/lmstudio)                     | Перше локальне налаштування, GUI-завантажувач, нативний Responses API       |
| LiteLLM / OAI-proxy / кастомний OpenAI-сумісний проксі | Ви проксируєте інший model API і хочете, щоб OpenClaw сприймав його як OpenAI |
| MLX / vLLM / SGLang                                  | Високопродуктивний self-hosted serving з OpenAI-сумісним HTTP endpoint      |
| [Ollama](/uk/providers/ollama)                          | CLI workflow, бібліотека моделей, systemd-сервіс без ручного супроводу      |

Використовуйте Responses API (`api: "openai-responses"`), коли бекенд його підтримує (LM Studio підтримує). Інакше залишайтеся на Chat Completions (`api: "openai-completions"`).

<Warning>
**Користувачі WSL2 + Ollama + NVIDIA/CUDA:** Офіційний Linux-інсталятор Ollama вмикає systemd-сервіс із `Restart=always`. У WSL2 GPU-сетапах автозапуск може повторно завантажити останню модель під час boot і зафіксувати пам’ять хоста. Якщо ваша WSL2 VM багаторазово перезапускається після ввімкнення Ollama, див. [цикл падінь WSL2](/uk/providers/ollama#wsl2-crash-loop-repeated-reboots).
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
- У LM Studio завантажте **найбільшу доступну збірку моделі** (уникайте "small"/сильно квантованих варіантів), запустіть сервер, підтвердьте, що `http://127.0.0.1:1234/v1/models` показує її у списку.
- Замініть `my-local-model` на фактичний ID моделі, показаний у LM Studio.
- Тримайте модель завантаженою; cold-load додає затримку запуску.
- Налаштуйте `contextWindow`/`maxTokens`, якщо ваша збірка LM Studio відрізняється.
- Для WhatsApp дотримуйтеся Responses API, щоб надсилався лише фінальний текст.

Залишайте hosted-моделі налаштованими навіть під час локального запуску; використовуйте `models.mode: "merge"`, щоб fallbacks залишалися доступними.

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

### Local-first із hosted safety net

Поміняйте місцями порядок primary і fallback; залиште той самий блок providers і `models.mode: "merge"`, щоб можна було fallback на Sonnet або Opus, коли локальна машина недоступна.

### Регіональний hosting / маршрутизація даних

- Hosted-варіанти MiniMax/Kimi/GLM також існують на OpenRouter із endpoint, прив’язаними до регіону (наприклад, hosted у США). Виберіть там регіональний варіант, щоб утримувати трафік у вибраній юрисдикції, водночас використовуючи `models.mode: "merge"` для Anthropic/OpenAI fallbacks.
- Local-only залишається найсильнішим шляхом для приватності; hosted регіональна маршрутизація є компромісом, коли потрібні функції провайдера, але потрібен контроль над потоком даних.

## Інші OpenAI-сумісні локальні проксі

MLX (`mlx_lm.server`), vLLM, SGLang, LiteLLM, OAI-proxy або кастомні
gateways працюють, якщо вони надають OpenAI-style endpoint `/v1/chat/completions`.
Використовуйте адаптер Chat Completions, якщо бекенд явно не
документує підтримку `/v1/responses`. Замініть блок provider вище на ваш
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

Якщо `api` пропущено для кастомного provider із `baseUrl`, OpenClaw типово використовує
`openai-completions`. Кастомні/локальні записи provider довіряють своєму точно налаштованому
origin `baseUrl` для захищених model requests, включно з loopback, LAN, tailnet
і private DNS hosts. Запити до інших private origins все ще потребують
`request.allowPrivateNetwork: true`; metadata/link-local origins залишаються заблокованими
без явного opt-in. Установіть його в `false`, щоб відмовитися від довіри до exact-origin.

Значення `models.providers.<id>.models[].id` є локальним для provider. Не
додавайте туди префікс provider. Наприклад, MLX-сервер, запущений із
`mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit`, має використовувати цей
catalog id і model ref:

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

Установіть `input: ["text", "image"]` для локальних або proxied vision models, щоб image
attachments додавалися в agent turns. Interactive custom-provider
onboarding визначає поширені vision model IDs і запитує лише невідомі назви.
Non-interactive onboarding використовує те саме визначення; використовуйте `--custom-image-input`
для невідомих vision IDs або `--custom-text-input`, коли модель зі схожою відомою назвою є
text-only за вашим endpoint.

Залишайте `models.mode: "merge"`, щоб hosted-моделі були доступні як fallbacks.
Використовуйте `models.providers.<id>.timeoutSeconds` для повільних локальних або віддалених model
servers перед підвищенням `agents.defaults.timeoutSeconds`. Provider timeout
застосовується лише до model HTTP requests, включно з connect, headers, body streaming
і повним guarded-fetch abort. Якщо agent або run timeout нижчий, підніміть
і цю межу, бо provider timeouts не можуть подовжити весь agent run.

<Note>
Для кастомних OpenAI-сумісних providers збереження несекретного локального маркера, такого як `apiKey: "ollama-local"`, приймається, коли `baseUrl` резолвиться в loopback, приватну LAN, `.local` або bare hostname. OpenClaw розглядає його як дійсний локальний credential замість повідомлення про відсутній ключ. Використовуйте справжнє значення для будь-якого provider, який приймає public hostname.
</Note>

Примітка щодо поведінки для локальних/proxied `/v1` бекендів:

- OpenClaw розглядає їх як proxy-style OpenAI-compatible routes, а не нативні
  OpenAI endpoints
- native OpenAI-only request shaping тут не застосовується: без
  `service_tier`, без Responses `store`, без OpenAI reasoning-compat payload
  shaping і без prompt-cache hints
- приховані OpenClaw attribution headers (`originator`, `version`, `User-Agent`)
  не додаються до цих custom proxy URLs

Примітки щодо сумісності для суворіших OpenAI-compatible бекендів:

- Деякі сервери приймають лише string `messages[].content` у Chat Completions, а не
  structured content-part arrays. Установіть
  `models.providers.<provider>.models[].compat.requiresStringContent: true` для
  таких endpoints.
- Деякі локальні моделі виводять окремі bracketed tool requests як текст, наприклад
  `[tool_name]`, за яким іде JSON і `[END_TOOL_REQUEST]`. OpenClaw просуває
  їх у real tool calls лише коли назва точно збігається із зареєстрованим
  tool для цього turn; інакше блок розглядається як непідтримуваний текст і
  приховується з user-visible replies.
- Якщо модель виводить JSON, XML або ReAct-style текст, схожий на tool call,
  але provider не видав structured invocation, OpenClaw залишає його як
  текст і логуватиме warning із run id, provider/model, detected pattern і
  tool name, коли доступно. Розглядайте це як несумісність provider/model tool-call,
  а не завершений tool run.
- Якщо tools з’являються як assistant text замість запуску, наприклад raw JSON,
  XML, ReAct syntax або порожній масив `tool_calls` у provider response,
  спершу перевірте, що сервер використовує tool-call-capable chat template/parser. Для
  OpenAI-compatible Chat Completions backends, чий parser працює лише коли tool
  use примусово ввімкнено, задайте per-model request override замість reliance on text
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
  Це перевизначає типове proxy value OpenClaw `tool_choice: "auto"`.
  Замініть `local/my-local-model` на точний provider/model ref, показаний
  `openclaw models list`.

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- Якщо кастомна OpenAI-compatible модель приймає OpenAI reasoning efforts понад
  built-in profile, оголосіть їх у model compat block. Додавання `"xhigh"`
  тут робить так, що `/think xhigh`, session pickers, Gateway validation і `llm-task`
  validation показують цей level для налаштованого provider/model ref:

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

Якщо модель завантажується чисто, але повні кроки агента працюють некоректно, рухайтеся згори вниз — спочатку підтвердьте транспорт, а потім звужуйте поверхню.

1. **Підтвердьте, що сама локальна модель відповідає.** Без інструментів, без контексту агента:

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **Підтвердьте маршрутизацію Gateway.** Надсилає лише наданий промпт — пропускає транскрипт, початкове завантаження AGENTS, складання context-engine, інструменти та вбудовані MCP-сервери, але все одно перевіряє маршрутизацію Gateway, автентифікацію та вибір провайдера:

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **Спробуйте полегшений режим.** Якщо обидві перевірки проходять, але реальні кроки агента падають через некоректно сформовані виклики інструментів або завеликі промпти, увімкніть `agents.defaults.experimental.localModelLean: true`. Він прибирає три найважчі типові інструменти (`browser`, `cron`, `message`) і за замовчуванням ховає більші каталоги інструментів за структурованими елементами керування Tool Search, окрім запусків, які мають зберігати пряму семантику доставлення `message`. Див. [Експериментальні функції → полегшений режим локальної моделі](/uk/concepts/experimental-features#local-model-lean-mode), щоб отримати повне пояснення, коли його використовувати та як підтвердити, що він увімкнений.

4. **Вимкніть інструменти повністю як останній засіб.** Якщо полегшеного режиму недостатньо, установіть `models.providers.<provider>.models[].compat.supportsTools: false` для цього запису моделі. Тоді агент працюватиме з цією моделлю без викликів інструментів.

5. **Після цього вузьке місце — в апстрімі.** Якщо бекенд усе ще падає лише на більших запусках OpenClaw після полегшеного режиму та `supportsTools: false`, решта проблеми зазвичай пов’язана з апстрім-моделлю або місткістю сервера — контекстним вікном, пам’яттю GPU, витісненням kv-cache або помилкою бекенда. На цьому етапі це вже не транспортний шар OpenClaw.

## Усунення несправностей

- Gateway може дістатися до проксі? `curl http://127.0.0.1:1234/v1/models`.
- Модель LM Studio вивантажена? Перезавантажте; холодний старт є поширеною причиною «зависання».
- Локальний сервер повідомляє `terminated`, `ECONNRESET` або закриває потік посеред кроку?
  OpenClaw записує низькокардинальний `model.call.error.failureKind` плюс знімок
  RSS/heap процесу OpenClaw у діагностиці. Для тиску на пам’ять LM Studio/Ollama
  зіставте цю мітку часу з журналом сервера або журналом аварій macOS /
  jetsam, щоб підтвердити, чи сервер моделі було вбито.
- OpenClaw виводить пороги передперевірки контекстного вікна з виявленого вікна моделі або з необмеженого вікна моделі, коли `agents.defaults.contextTokens` зменшує ефективне вікно. Він попереджає нижче 20% з нижньою межею **8k**. Жорсткі блокування використовують поріг 10% з нижньою межею **4k**, обмежений ефективним контекстним вікном, щоб завеликі метадані моделі не могли відхилити інакше коректне користувацьке обмеження. Якщо ви натрапили на цю передперевірку, збільште контекстний ліміт сервера/моделі або виберіть більшу модель.
- Помилки контексту? Зменште `contextWindow` або збільште ліміт сервера.
- OpenAI-сумісний сервер повертає `messages[].content ... expected a string`?
  Додайте `compat.requiresStringContent: true` до цього запису моделі.
- OpenAI-сумісний сервер повертає `validation.keys` або каже, що записи повідомлень дозволяють лише `role` і `content`?
  Додайте `compat.strictMessageKeys: true` до цього запису моделі.
- Прямі крихітні виклики `/v1/chat/completions` працюють, але `openclaw infer model run --local`
  падає на Gemma або іншій локальній моделі? Спочатку перевірте URL провайдера, посилання на модель, маркер автентифікації
  та журнали сервера; локальний `model run` не містить інструментів агента.
  Якщо локальний `model run` успішний, але більші кроки агента падають, зменште
  набір інструментів агента за допомогою `localModelLean` або `compat.supportsTools: false`.
- Виклики інструментів з’являються як сирий текст JSON/XML/ReAct, або провайдер повертає
  порожній масив `tool_calls`? Не додавайте проксі, який сліпо перетворює текст
  асистента на виконання інструментів. Спочатку виправте chat template/parser сервера. Якщо
  модель працює лише тоді, коли використання інструментів примусове, додайте наведене вище перевизначення
  `params.extra_body.tool_choice: "required"` для окремої моделі та використовуйте цей запис моделі
  лише для сеансів, де виклик інструмента очікується на кожному кроці.
- Безпека: локальні моделі пропускають фільтри на стороні провайдера; тримайте агентів вузько сфокусованими та Compaction увімкненою, щоб обмежити радіус ураження prompt injection.

## Пов’язане

- [Довідник конфігурації](/uk/gateway/configuration-reference)
- [Відмовостійке перемикання моделей](/uk/concepts/model-failover)
