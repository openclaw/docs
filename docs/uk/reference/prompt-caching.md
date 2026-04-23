---
read_when:
    - Ви хочете зменшити витрати на prompt token за допомогою збереження кешу
    - Вам потрібна поведінка кешу для кожного агента окремо в конфігураціях із кількома агентами
    - Ви налаштовуєте Heartbeat і pruning за cache-ttl разом
summary: Параметри prompt caching, порядок злиття, поведінка provider-ів і шаблони налаштування
title: Prompt caching
x-i18n:
    generated_at: "2026-04-23T21:09:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee2af4b5075f485e8e4e49c429cadbbfae2262e060612ac3e3aa55fb0322d4e5
    source_path: reference/prompt-caching.md
    workflow: 15
---

Prompt caching означає, що provider моделі може повторно використовувати незмінні префікси prompt (зазвичай system/developer instructions та інший стабільний контекст) між ходами замість повторної обробки їх щоразу. OpenClaw нормалізує використання provider-а в `cacheRead` і `cacheWrite`, коли upstream API напряму показує ці лічильники.

Поверхні статусу також можуть відновлювати лічильники кешу з найновішого usage log transcript, коли в live snapshot session їх немає, тож `/status` може й далі показувати рядок кешу після часткової втрати метаданих session. Наявні ненульові live-значення кешу все одно мають пріоритет над fallback-значеннями з transcript.

Чому це важливо: нижча вартість токенів, швидші відповіді та передбачуваніша продуктивність для довготривалих sessions. Без кешування повторювані prompt-и оплачують повну вартість prompt на кожному ході, навіть коли більшість вхідних даних не змінюється.

Ця сторінка охоплює всі параметри, пов’язані з кешем, які впливають на повторне використання prompt і вартість токенів.

Посилання на документацію provider-ів:

- Anthropic prompt caching: [https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI prompt caching: [https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- Заголовки OpenAI API та request ID: [https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Request ID та помилки Anthropic: [https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## Основні параметри

### `cacheRetention` (глобальне типове значення, модель і окремий агент)

Задайте cache retention як глобальне типове значення для всіх моделей:

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

Перевизначення для окремого агента:

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

Порядок злиття config:

1. `agents.defaults.params` (глобальне типове значення — застосовується до всіх моделей)
2. `agents.defaults.models["provider/model"].params` (перевизначення для кожної моделі)
3. `agents.list[].params` (відповідний id агента; перевизначає за ключем)

### `contextPruning.mode: "cache-ttl"`

Обрізає старий контекст результатів інструментів після вікон TTL кешу, щоб запити після простою не повторно кешували надмірну історію.

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

Повну поведінку див. в [Pruning session](/uk/concepts/session-pruning).

### Підтримання тепла кешу через Heartbeat

Heartbeat може підтримувати вікна кешу «теплими» і зменшувати повторні записи в кеш після idle-gap.

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Heartbeat для окремого агента підтримується в `agents.list[].heartbeat`.

## Поведінка provider-ів

### Anthropic (прямий API)

- `cacheRetention` підтримується.
- Для профілів auth із Anthropic API key OpenClaw типово задає `cacheRetention: "short"` для посилань на моделі Anthropic, якщо значення не задано.
- Нативні відповіді Anthropic Messages показують і `cache_read_input_tokens`, і `cache_creation_input_tokens`, тож OpenClaw може показувати і `cacheRead`, і `cacheWrite`.
- Для нативних запитів Anthropic `cacheRetention: "short"` відповідає типовому ephemeral cache на 5 хвилин, а `cacheRetention: "long"` оновлює TTL до 1 години лише на прямих host `api.anthropic.com`.

### OpenAI (прямий API)

- Prompt caching є автоматичним на підтримуваних сучасних моделях. OpenClaw не потрібно впроваджувати block-level cache marker-и.
- OpenClaw використовує `prompt_cache_key`, щоб маршрутизація кешу залишалася стабільною між ходами, і використовує `prompt_cache_retention: "24h"` лише коли на прямих host OpenAI вибрано `cacheRetention: "long"`.
- Відповіді OpenAI показують закешовані prompt tokens через `usage.prompt_tokens_details.cached_tokens` (або `input_tokens_details.cached_tokens` у подіях Responses API). OpenClaw відображає це в `cacheRead`.
- OpenAI не показує окремий лічильник токенів запису в кеш, тож `cacheWrite` залишається `0` на шляхах OpenAI, навіть коли provider прогріває кеш.
- OpenAI повертає корисні tracing- і rate-limit-заголовки, такі як `x-request-id`, `openai-processing-ms` і `x-ratelimit-*`, але облік cache-hit має братися з usage payload, а не із заголовків.
- На практиці OpenAI часто поводиться як кеш початкового префікса, а не як повне рухоме повторне використання історії у стилі Anthropic. Стабільні ходи з довгим префіксом часто виходять на плато приблизно `4864` cached tokens у поточних live probe, тоді як transcripts, важкі на tools або MCP, часто виходять на плато близько `4608` cached tokens навіть при точних повторах.

### Anthropic Vertex

- Моделі Anthropic на Vertex AI (`anthropic-vertex/*`) підтримують `cacheRetention` так само, як і прямий Anthropic.
- `cacheRetention: "long"` відповідає реальному 1-годинному TTL prompt cache на endpoint-ах Vertex AI.
- Типове cache retention для `anthropic-vertex` збігається з прямими типовими значеннями Anthropic.
- Запити Vertex маршрутизуються через boundary-aware cache shaping, щоб повторне використання кешу залишалося узгодженим із тим, що provider-и реально отримують.

### Amazon Bedrock

- Посилання на моделі Anthropic Claude (`amazon-bedrock/*anthropic.claude*`) підтримують явний pass-through для `cacheRetention`.
- Не-Anthropic моделі Bedrock під час runtime примусово отримують `cacheRetention: "none"`.

### Моделі Anthropic через OpenRouter

Для посилань на моделі `openrouter/anthropic/*` OpenClaw впроваджує Anthropic
`cache_control` у блоки system/developer prompt, щоб покращити повторне використання prompt cache лише коли запит і далі націлений на перевірений маршрут OpenRouter
(`openrouter` на його типовому endpoint, або будь-який provider/base URL, що визначається
як `openrouter.ai`).

Якщо ви перенаправляєте модель на довільний OpenAI-compatible proxy URL, OpenClaw
припиняє впроваджувати ці специфічні для OpenRouter маркери кешу Anthropic.

### Інші provider-и

Якщо provider не підтримує цей режим кешу, `cacheRetention` не має ефекту.

### Google Gemini direct API

- Прямий transport Gemini (`api: "google-generative-ai"`) показує cache hit-и
  через upstream `cachedContentTokenCount`; OpenClaw відображає це в `cacheRead`.
- Коли на прямій моделі Gemini задано `cacheRetention`, OpenClaw автоматично
  створює, повторно використовує та оновлює ресурси `cachedContents` для system prompt-ів
  у запусках Google AI Studio. Це означає, що вам більше не потрібно заздалегідь створювати
  handle cached-content вручну.
- Ви все ще можете передати наявний handle cached-content Gemini через
  `params.cachedContent` (або застарілий `params.cached_content`) на налаштованій
  моделі.
- Це окремо від кешування prompt-prefix у Anthropic/OpenAI. Для Gemini
  OpenClaw керує provider-native-ресурсом `cachedContents`, а не
  впроваджує cache marker-и в запит.

### Використання JSON Gemini CLI

- JSON-вивід Gemini CLI також може показувати cache hit-и через `stats.cached`;
  OpenClaw відображає це в `cacheRead`.
- Якщо CLI не надає прямого значення `stats.input`, OpenClaw виводить input tokens
  з `stats.input_tokens - stats.cached`.
- Це лише нормалізація usage. Це не означає, що OpenClaw створює
  Anthropic/OpenAI-style prompt-cache marker-и для Gemini CLI.

## Межа кешу системного prompt

OpenClaw ділить системний prompt на **стабільний префікс** і **мінливий
суфікс**, розділені внутрішньою межею префікса кешу. Контент над
межею (визначення інструментів, метадані Skills, файли workspace та інший
відносно статичний контекст) впорядкований так, щоб залишатися байт-ідентичним між ходами.
Контент під межею (наприклад, `HEARTBEAT.md`, runtime timestamp-и та
інші метадані для кожного ходу) може змінюватися без інвалідизації
закешованого префікса.

Ключові рішення дизайну:

- Стабільні файли project-context workspace впорядковані перед `HEARTBEAT.md`, щоб
  churn у heartbeat не ламав стабільний префікс.
- Межа застосовується до Anthropic-family, OpenAI-family, Google і
  CLI transport shaping, тож усі підтримувані provider-и отримують однакову стабільність префікса.
- Запити Codex Responses і Anthropic Vertex маршрутизуються через
  boundary-aware cache shaping, щоб повторне використання кешу залишалося узгодженим із тим, що provider-и реально отримують.
- Відбитки системного prompt нормалізуються (whitespace, line ending-и,
  контекст, доданий hook-ами, порядок runtime capabilities), щоб семантично незмінні
  prompt-и спільно використовували KV/cache між ходами.

Якщо ви бачите неочікувані сплески `cacheWrite` після зміни config або workspace, перевірте, чи ця зміна потрапляє вище чи нижче межі кешу. Переміщення
мінливого контенту під межу (або його стабілізація) часто вирішує
проблему.

## Захисти стабільності кешу в OpenClaw

OpenClaw також тримає детермінованими кілька чутливих до кешу форм payload до того, як запит досягне provider-а:

- Каталоги MCP tools із пакетів сортуються детерміновано перед реєстрацією інструментів, щоб зміни в порядку `listTools()` не churn-или блок tools і
  не ламали префікси prompt cache.
- Legacy sessions зі збереженими блоками зображень зберігають **3 найновіші
  завершені ходи** недоторканими; старі вже оброблені блоки зображень можуть
  замінюватися маркером, щоб follow-up-и, багаті на зображення, не продовжували повторно надсилати великі
  застарілі payload-и.

## Шаблони налаштування

### Змішаний трафік (рекомендоване типове значення)

Тримайте довготривалу baseline на основному агенті, а кешування вимикайте на bursty notifier-agent-ах:

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

### Baseline з пріоритетом вартості

- Задайте baseline `cacheRetention: "short"`.
- Увімкніть `contextPruning.mode: "cache-ttl"`.
- Тримайте Heartbeat нижче вашого TTL лише для агентів, які отримують користь від warm cache.

## Діагностика кешу

OpenClaw надає спеціальну діагностику cache-trace для запусків вбудованого агента.

Для звичайної користувацької діагностики `/status` та інші usage-summary можуть використовувати
останній usage entry transcript як fallback-джерело для `cacheRead` /
`cacheWrite`, коли в live entry session цих лічильників немає.

## Live regression tests

OpenClaw підтримує один комбінований live regression gate для кешу, який охоплює повторювані префікси, tool-turn-и, image-turn-и, MCP-style tool transcripts і no-cache control для Anthropic.

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

Запустіть вузький live gate так:

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

Файл baseline зберігає останні спостережувані live-значення разом із специфічними для provider-а regression floor-ами, які використовує тест.
Runner також використовує свіжі session ID для кожного запуску та простори імен prompt, щоб попередній стан кешу не забруднював поточну regression-sample.

Ці тести навмисно не використовують ідентичні критерії успіху для всіх provider-ів.

### Live-очікування Anthropic

- Очікуються явні warmup-write через `cacheWrite`.
- Очікується майже повне повторне використання історії на повторних ходах, тому що Anthropic cache control пересуває breakpoint кешу через розмову.
- Поточні live-assertion-и все ще використовують високі пороги hit-rate для стабільних шляхів, шляхів tools і image.

### Live-очікування OpenAI

- Очікується лише `cacheRead`. `cacheWrite` залишається `0`.
- Повторне використання кешу на повторних ходах слід трактувати як специфічне для provider-а плато, а не як рухоме повне повторне використання історії у стилі Anthropic.
- Поточні live-assertion-и використовують консервативні floor-перевірки, виведені зі спостережуваної live-поведінки на `gpt-5.4-mini`:
  - стабільний префікс: `cacheRead >= 4608`, hit rate `>= 0.90`
  - transcript інструментів: `cacheRead >= 4096`, hit rate `>= 0.85`
  - transcript зображень: `cacheRead >= 3840`, hit rate `>= 0.82`
  - transcript у стилі MCP: `cacheRead >= 4096`, hit rate `>= 0.85`

Свіжа комбінована live-перевірка від 2026-04-04 дала:

- стабільний префікс: `cacheRead=4864`, hit rate `0.966`
- transcript інструментів: `cacheRead=4608`, hit rate `0.896`
- transcript зображень: `cacheRead=4864`, hit rate `0.954`
- transcript у стилі MCP: `cacheRead=4608`, hit rate `0.891`

Нещодавній локальний wall-clock time для комбінованого gate становив близько `88s`.

Чому assertion-и відрізняються:

- Anthropic показує явні breakpoint-и кешу й рухоме повторне використання історії розмови.
- Prompt caching OpenAI усе ще чутливий до точного префікса, але ефективний повторно використовуваний префікс у live traffic Responses може виходити на плато раніше, ніж увесь prompt.
- Через це порівняння Anthropic і OpenAI за одним загальним міжprovider-ним відсотковим порогом створює хибні регресії.

### Конфігурація `diagnostics.cacheTrace`

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # необов’язково
    includeMessages: false # типово true
    includePrompt: false # типово true
    includeSystem: false # типово true
```

Типові значення:

- `filePath`: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`: `true`
- `includePrompt`: `true`
- `includeSystem`: `true`

### Env-перемикачі (одноразове налагодження)

- `OPENCLAW_CACHE_TRACE=1` вмикає cache tracing.
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl` перевизначає шлях виводу.
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1` перемикає захоплення повного payload повідомлень.
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1` перемикає захоплення тексту prompt.
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1` перемикає захоплення системного prompt.

### Що перевіряти

- Події cache trace є JSONL і включають staged snapshot-и, такі як `session:loaded`, `prompt:before`, `stream:context` і `session:after`.
- Вплив токенів кешу на кожен хід видно у звичайних usage-поверхнях через `cacheRead` і `cacheWrite` (наприклад, `/usage full` і usage-summary session).
- Для Anthropic очікуйте і `cacheRead`, і `cacheWrite`, коли кешування активне.
- Для OpenAI очікуйте `cacheRead` на cache hit, а `cacheWrite` має залишатися `0`; OpenAI не публікує окреме поле токенів запису в кеш.
- Якщо вам потрібен request tracing, логуйте request ID і rate-limit headers окремо від метрик кешу. Поточний вивід cache-trace в OpenClaw зосереджений на формі prompt/session і нормалізованому usage токенів, а не на сирих заголовках відповіді provider-а.

## Швидке усунення несправностей

- Високий `cacheWrite` на більшості ходів: перевірте мінливі вхідні дані системного prompt і переконайтеся, що модель/provider підтримує ваші налаштування кешу.
- Високий `cacheWrite` у Anthropic: часто означає, що breakpoint кешу потрапляє на контент, який змінюється в кожному запиті.
- Низький `cacheRead` у OpenAI: переконайтеся, що стабільний префікс знаходиться на початку, повторюваний префікс має щонайменше 1024 токени, і той самий `prompt_cache_key` повторно використовується для ходів, які мають ділити кеш.
- Немає ефекту від `cacheRetention`: підтвердьте, що ключ моделі збігається з `agents.defaults.models["provider/model"]`.
- Запити Bedrock Nova/Mistral з налаштуваннями кешу: очікуване примусове runtime-значення `none`.

Пов’язані документи:

- [Anthropic](/uk/providers/anthropic)
- [Використання токенів і вартість](/uk/reference/token-use)
- [Pruning session](/uk/concepts/session-pruning)
- [Довідник конфігурації Gateway](/uk/gateway/configuration-reference)
