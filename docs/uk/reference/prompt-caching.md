---
read_when:
    - Ви хочете зменшити витрати на токени prompt за допомогою збереження кешу
    - Вам потрібна поведінка кешу для кожного агента окремо в конфігураціях із кількома агентами
    - Ви налаштовуєте Heartbeat і обрізання cache-ttl разом
summary: Параметри налаштування кешування prompt, порядок злиття, поведінка provider і шаблони налаштування
title: Кешування prompt
x-i18n:
    generated_at: "2026-04-25T05:58:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f3d1a5751ca0cab4c5b83c8933ec732b58c60d430e00c24ae9a75036aa0a6a3
    source_path: reference/prompt-caching.md
    workflow: 15
---

Кешування prompt означає, що provider моделі може повторно використовувати незмінні префікси prompt (зазвичай інструкції system/developer та інший стабільний контекст) між ходами замість повторної обробки щоразу. OpenClaw нормалізує використання provider до `cacheRead` і `cacheWrite`, коли upstream API напряму надає ці лічильники.

Поверхні статусу також можуть відновлювати лічильники кешу з останнього журналу
використання транскрипту, коли в живому знімку сесії їх бракує, тож `/status` може й далі
показувати рядок кешу після часткової втрати метаданих сесії. Наявні ненульові живі
значення кешу все одно мають пріоритет над резервними значеннями з транскрипту.

Чому це важливо: менша вартість токенів, швидші відповіді та передбачуваніша продуктивність для довготривалих сесій. Без кешування повторювані prompt щоразу оплачують повну вартість prompt, навіть якщо більшість вхідних даних не змінилася.

У розділах нижче описано всі параметри, пов’язані з кешем, які впливають на повторне використання prompt і вартість токенів.

Посилання на provider:

- Кешування prompt Anthropic: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- Кешування prompt OpenAI: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Заголовки API та request ID OpenAI: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Request ID та помилки Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Основні параметри

### `cacheRetention` (глобальне значення за замовчуванням, модель і для кожного агента)

Задайте збереження кешу як глобальне значення за замовчуванням для всіх моделей:

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

Перевизначення для кожної моделі:

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Перевизначення для кожного агента:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Порядок злиття config:

1. `agents.defaults.params` (глобальне значення за замовчуванням — застосовується до всіх моделей)
2. `agents.defaults.models["provider/model"].params` (перевизначення для моделі)
3. `agents.list[].params` (відповідний id агента; перевизначає за ключем)

### `contextPruning.mode: "cache-ttl"`

Обрізає старий контекст результатів tool після вікон TTL кешу, щоб запити після простою не кешували повторно надмірно велику історію.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Повну поведінку див. у [Обрізанні сесій](/uk/concepts/session-pruning).

### Підігрів кешу через Heartbeat

Heartbeat може підтримувати вікна кешу теплими та зменшувати повторні записи кешу після пауз без активності.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat для кожного агента підтримується в `agents.list[].heartbeat`.

## Поведінка provider

### Anthropic (прямий API)

- `cacheRetention` підтримується.
- Для профілів автентифікації Anthropic API-key OpenClaw задає `cacheRetention: "short"` для посилань на моделі Anthropic, якщо значення не задано.
- Відповіді native Messages Anthropic надають і `cache_read_input_tokens`, і `cache_creation_input_tokens`, тож OpenClaw може показувати і `cacheRead`, і `cacheWrite`.
- Для native-запитів Anthropic `cacheRetention: "short"` відповідає типовому ефемерному кешу на 5 хвилин, а `cacheRetention: "long"` підвищує TTL до 1 години лише на прямих хостах `api.anthropic.com`.

### OpenAI (прямий API)

- Кешування prompt автоматичне на підтримуваних нових моделях. OpenClaw не потрібно інжектувати маркери кешу на рівні блоків.
- OpenClaw використовує `prompt_cache_key`, щоб маршрутизація кешу залишалася стабільною між ходами, і використовує `prompt_cache_retention: "24h"` лише коли `cacheRetention: "long"` вибрано на прямих хостах OpenAI.
- OpenAI-сумісні provider Completions отримують `prompt_cache_key` лише тоді, коли їхній config моделі явно задає `compat.supportsPromptCacheKey: true`; `cacheRetention: "none"` усе одно його пригнічує.
- Відповіді OpenAI показують кешовані токени prompt через `usage.prompt_tokens_details.cached_tokens` (або `input_tokens_details.cached_tokens` у подіях Responses API). OpenClaw зіставляє це з `cacheRead`.
- OpenAI не надає окремого лічильника токенів запису в кеш, тому `cacheWrite` залишається `0` на шляхах OpenAI, навіть коли provider прогріває кеш.
- OpenAI повертає корисні заголовки трасування та обмеження частоти, такі як `x-request-id`, `openai-processing-ms` і `x-ratelimit-*`, але облік влучань у кеш слід брати з payload використання, а не із заголовків.
- На практиці OpenAI часто поводиться як кеш початкового префікса, а не як Anthropic-подібне рухоме повторне використання повної історії. Стабільні ходи з довгим префіксом тексту в поточних live-перевірках можуть виходити на плато близько `4864` кешованих токенів, тоді як транскрипти з великою кількістю tool або в стилі MCP часто виходять на плато близько `4608` кешованих токенів навіть при точних повторах.

### Anthropic Vertex

- Моделі Anthropic на Vertex AI (`anthropic-vertex/*`) підтримують `cacheRetention` так само, як і прямий Anthropic.
- `cacheRetention: "long"` відповідає реальному TTL prompt-кешу на 1 годину на endpoint Vertex AI.
- Значення кешу за замовчуванням для `anthropic-vertex` збігається зі значенням прямого Anthropic.
- Запити Vertex маршрутизуються через формування кешу з урахуванням меж, щоб повторне використання кешу залишалося узгодженим із тим, що фактично отримують provider.

### Amazon Bedrock

- Посилання на моделі Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) підтримують явну передачу `cacheRetention`.
- Для не-Anthropic моделей Bedrock у runtime примусово задається `cacheRetention: "none"`.

### Моделі OpenRouter

Для посилань на моделі `openrouter/anthropic/*` OpenClaw інжектує Anthropic
`cache_control` у блоки prompt system/developer, щоб покращити повторне
використання prompt-кешу лише тоді, коли запит і далі націлений на перевірений маршрут OpenRouter
(`openrouter` на endpoint за замовчуванням або будь-який provider/base URL, що вказує
на `openrouter.ai`).

Для посилань на моделі `openrouter/deepseek/*`, `openrouter/moonshot*/*` і `openrouter/zai/*`
дозволено `contextPruning.mode: "cache-ttl"`, оскільки OpenRouter
автоматично обробляє prompt-кешування на боці provider. OpenClaw не інжектує
маркери Anthropic `cache_control` у ці запити.

Побудова кешу DeepSeek виконується в режимі best-effort і може тривати кілька секунд. У
негайному повторному запиті все ще може бути `cached_tokens: 0`; перевіряйте це
повторним запитом з тим самим префіксом після короткої затримки та використовуйте `usage.prompt_tokens_details.cached_tokens`
як сигнал влучання в кеш.

Якщо ви перенаправите модель на довільний проксі-URL, сумісний з OpenAI, OpenClaw
припиняє інжектувати ці специфічні для OpenRouter маркери кешу Anthropic.

### Інші provider

Якщо provider не підтримує цей режим кешу, `cacheRetention` не має ефекту.

### Прямий API Google Gemini

- Прямий транспорт Gemini (`api: "google-generative-ai"`) повідомляє про влучання в кеш
  через upstream `cachedContentTokenCount`; OpenClaw зіставляє це з `cacheRead`.
- Коли `cacheRetention` задано для прямої моделі Gemini, OpenClaw автоматично
  створює, повторно використовує та оновлює ресурси `cachedContents` для system prompt
  у запусках Google AI Studio. Це означає, що вам більше не потрібно попередньо створювати
  handle cached-content вручну.
- Ви все ще можете передати наявний handle Gemini cached-content через
  `params.cachedContent` (або застарілий `params.cached_content`) у налаштованій
  моделі.
- Це окремо від кешування префіксів prompt Anthropic/OpenAI. Для Gemini
  OpenClaw керує native-ресурсом provider `cachedContents`, а не
  інжектує маркери кешу в запит.

### Використання JSON Gemini CLI

- Вивід JSON Gemini CLI також може показувати влучання в кеш через `stats.cached`;
  OpenClaw зіставляє це з `cacheRead`.
- Якщо CLI не надає прямого значення `stats.input`, OpenClaw виводить вхідні токени
  з `stats.input_tokens - stats.cached`.
- Це лише нормалізація використання. Це не означає, що OpenClaw створює
  Anthropic/OpenAI-подібні маркери prompt-кешу для Gemini CLI.

## Межа кешу system-prompt

OpenClaw розділяє system prompt на **стабільний префікс** і **мінливий
суфікс**, розділені внутрішньою межею cache-prefix. Вміст над
межею (визначення tool, метадані Skills, файли робочого простору та інший
відносно статичний контекст) упорядковується так, щоб залишатися
байт-ідентичним між ходами. Вміст під межею (наприклад `HEARTBEAT.md`, часові мітки runtime та
інші метадані для кожного ходу) може змінюватися без інвалідації кешованого
префікса.

Ключові рішення дизайну:

- Стабільні файли контексту проєкту робочого простору впорядковуються перед `HEARTBEAT.md`, щоб
  зміни Heartbeat не ламали стабільний префікс.
- Межа застосовується до формування запитів Anthropic-family, OpenAI-family, Google і CLI, тож усі підтримувані provider отримують перевагу від однакової стабільності префікса.
- Запити Codex Responses і Anthropic Vertex маршрутизуються через
  формування кешу з урахуванням меж, щоб повторне використання кешу залишалося узгодженим із тим,
  що фактично отримують provider.
- Відбитки system-prompt нормалізуються (пробіли, закінчення рядків,
  контекст, доданий hook, порядок можливостей runtime), щоб семантично незмінні
  prompt спільно використовували KV/cache між ходами.

Якщо ви бачите неочікувані стрибки `cacheWrite` після зміни config або робочого простору,
перевірте, чи потрапляє зміна вище чи нижче межі кешу. Переміщення
мінливого вмісту нижче межі (або його стабілізація) часто вирішує
проблему.

## Захист стабільності кешу в OpenClaw

OpenClaw також підтримує детермінованість кількох чутливих до кешу форм payload
до того, як запит досягне provider:

- Каталоги tool bundle MCP сортуються детерміновано перед реєстрацією
  tool, тож зміни порядку `listTools()` не змінюють блок tools і
  не ламають префікси prompt-кешу.
- У застарілих сесіях зі збереженими блоками зображень **3 найновіші
  завершені ходи** залишаються недоторканими; старіші вже оброблені блоки зображень можуть
  замінюватися маркером, щоб подальші запити з великою кількістю зображень не
  надсилали знову великі застарілі payload.

## Шаблони налаштування

### Змішаний трафік (рекомендоване значення за замовчуванням)

Зберігайте довгоживучу базову конфігурацію на основному агенті, а кешування вимикайте для агентів-сповіщувачів із рваним навантаженням:

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### Базова конфігурація з пріоритетом вартості

- Задайте базове `cacheRetention: "short"`.
- Увімкніть `contextPruning.mode: "cache-ttl"`.
- Тримайте Heartbeat нижче за ваш TTL лише для тих агентів, яким корисний теплий кеш.

## Діагностика кешу

OpenClaw надає окремі засоби діагностики cache-trace для вбудованих запусків агента.

Для звичайної діагностики, видимої користувачу, `/status` та інші підсумки використання можуть використовувати
останній запис використання в транскрипті як резервне джерело для `cacheRead` /
`cacheWrite`, коли живий запис сесії не має цих лічильників.

## Live regression tests

OpenClaw підтримує один комбінований live regression gate кешу для повторюваних префіксів, ходів tool, ходів із зображеннями, транскриптів tool у стилі MCP і контрольного сценарію Anthropic без кешу.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Запустіть вузький live gate так:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Базовий файл зберігає останні спостережені live-значення разом зі специфічними для provider порогами регресії, які використовує test.
Runner також використовує нові session ID і простори імен prompt для кожного запуску, щоб попередній стан кешу не спотворював поточну regression-вибірку.

Ці tests навмисно не використовують однакові критерії успіху для всіх provider.

### Очікування live для Anthropic

- Очікуються явні прогрівальні записи через `cacheWrite`.
- Очікується майже повне повторне використання історії на повторних ходах, оскільки керування кешем Anthropic просуває точку розриву кешу через усю розмову.
- Поточні live-assertions і далі використовують високі пороги частоти влучань для стабільних шляхів, шляхів tool і зображень.

### Очікування live для OpenAI

- Очікуйте лише `cacheRead`. `cacheWrite` залишається `0`.
- Розглядайте повторне використання кешу на повторних ходах як специфічне для provider плато, а не як Anthropic-подібне рухоме повторне використання повної історії.
- Поточні live-assertions використовують консервативні порогові перевірки, виведені зі спостережуваної live-поведінки на `gpt-5.4-mini`:
  - стабільний префікс: `cacheRead >= 4608`, частота влучань `>= 0.90`
  - транскрипт tool: `cacheRead >= 4096`, частота влучань `>= 0.85`
  - транскрипт із зображенням: `cacheRead >= 3840`, частота влучань `>= 0.82`
  - транскрипт у стилі MCP: `cacheRead >= 4096`, частота влучань `>= 0.85`

Свіжа комбінована live-перевірка від 2026-04-04 дала такі результати:

- стабільний префікс: `cacheRead=4864`, частота влучань `0.966`
- транскрипт tool: `cacheRead=4608`, частота влучань `0.896`
- транскрипт із зображенням: `cacheRead=4864`, частота влучань `0.954`
- транскрипт у стилі MCP: `cacheRead=4608`, частота влучань `0.891`

Нещодавній локальний wall-clock час для комбінованого gate становив приблизно `88s`.

Чому assert-умови відрізняються:

- Anthropic надає явні точки розриву кешу та рухоме повторне використання історії розмови.
- Кешування prompt OpenAI все ще чутливе до точного префікса, але ефективний префікс, який можна повторно використати в live-трафіку Responses, може досягати плато раніше за повний prompt.
- Через це порівняння Anthropic і OpenAI за єдиним міжprovider-ним порогом у відсотках створює хибні регресії.

### Config `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # optional
    includeMessages: false # default true
    includePrompt: false # default true
    includeSystem: false # default true
```

Значення за замовчуванням:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Перемикачі env (одноразове налагодження)

- `OPENCLAW_CACHE_TRACE=1` вмикає трасування кешу.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` перевизначає шлях виводу.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` перемикає захоплення повного payload повідомлень.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` перемикає захоплення тексту prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` перемикає захоплення system prompt.

### Що перевіряти

- Події трасування кешу мають формат JSONL і включають поетапні знімки, як-от `session:loaded`, `prompt:before`, `stream:context` і `session:after`.
- Вплив токенів кешу для кожного ходу видно у звичайних поверхнях використання через `cacheRead` і `cacheWrite` (наприклад `/usage full` і підсумки використання сесії).
- Для Anthropic очікуйте і `cacheRead`, і `cacheWrite`, коли кешування активне.
- Для OpenAI очікуйте `cacheRead` при влучаннях у кеш, а `cacheWrite` має залишатися `0`; OpenAI не публікує окреме поле токенів запису в кеш.
- Якщо вам потрібне трасування запитів, журналюйте request ID і заголовки обмеження частоти окремо від метрик кешу. Поточний вивід cache-trace в OpenClaw зосереджений на формі prompt/сесії та нормалізованому використанні токенів, а не на сирих заголовках відповідей provider.

## Швидке усунення несправностей

- Високий `cacheWrite` на більшості ходів: перевірте мінливі вхідні дані system prompt і підтвердьте, що model/provider підтримує ваші налаштування кешу.
- Високий `cacheWrite` на Anthropic: часто означає, що точка розриву кешу потрапляє на вміст, який змінюється в кожному запиті.
- Низький `cacheRead` в OpenAI: перевірте, що стабільний префікс розміщено на початку, повторюваний префікс має щонайменше 1024 токени, і для ходів, які мають спільно використовувати кеш, повторно використовується той самий `prompt_cache_key`.
- Немає ефекту від `cacheRetention`: підтвердьте, що ключ моделі збігається з `agents.defaults.models["provider/model"]`.
- Запити Bedrock Nova/Mistral з налаштуваннями кешу: очікуване примусове значення runtime `none`.

Пов’язані docs:

- [Anthropic](/uk/providers/anthropic)
- [Використання токенів і витрати](/uk/reference/token-use)
- [Обрізання сесій](/uk/concepts/session-pruning)
- [Довідник із конфігурації Gateway](/uk/gateway/configuration-reference)

## Пов’язане

- [Використання токенів і витрати](/uk/reference/token-use)
- [Використання API та витрати](/uk/reference/api-usage-costs)
