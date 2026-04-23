---
read_when:
    - Пояснення використання токенів, вартості або контекстних вікон
    - Налагодження зростання контексту або поведінки Compaction
summary: Як OpenClaw будує контекст prompt і звітує про використання токенів + вартість
title: Використання токенів і вартість
x-i18n:
    generated_at: "2026-04-23T21:11:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb107da9a479da2c0da057221d296e2bfb76d075a35ae2f677be006b4e266659
    source_path: reference/token-use.md
    workflow: 15
---

# Використання токенів і вартість

OpenClaw відстежує **токени**, а не символи. Токени залежать від моделі, але більшість
моделей у стилі OpenAI у середньому дають ~4 символи на токен для англійського тексту.

## Як будується system prompt

OpenClaw збирає власний system prompt під час кожного запуску. Він включає:

- Список інструментів + короткі описи
- Список Skills (лише metadata; інструкції завантажуються на вимогу через `read`).
  Компактний блок Skills обмежується `skills.limits.maxSkillsPromptChars`,
  з необов’язковим override для окремого агента в
  `agents.list[].skillsLimits.maxSkillsPromptChars`.
- Інструкції self-update
- Файли workspace + bootstrap (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` для нових workspace, а також `MEMORY.md`, якщо він існує). `memory.md` у корені в нижньому регістрі не інжектується; це застарілий вхід для repair у `openclaw doctor --fix`, коли він існує разом із `MEMORY.md`. Великі файли обрізаються за `agents.defaults.bootstrapMaxChars` (типово: 12000), а загальний ліміт bootstrap-injection задається `agents.defaults.bootstrapTotalMaxChars` (типово: 60000). Щоденні файли `memory/*.md` не входять до звичайного bootstrap prompt; у звичайних ходах вони залишаються on-demand через memory tools, але прості `/new` і `/reset` можуть додавати одноразовий startup-context block із нещодавньою щоденною пам’яттю для першого ходу. Цей startup prelude керується через `agents.defaults.startupContext`.
- Час (UTC + часовий пояс користувача)
- Reply tags + поведінку Heartbeat
- Runtime metadata (host/OS/model/thinking)

Див. повну розбивку в [System Prompt](/uk/concepts/system-prompt).

## Що враховується в context window

Усе, що отримує модель, враховується в ліміті контексту:

- System prompt (усі перелічені вище секції)
- Історія розмови (повідомлення користувача + асистента)
- Виклики інструментів і результати інструментів
- Вкладення/транскрипти (зображення, аудіо, файли)
- Зведення Compaction і artifacts pruning
- Provider wrappers або safety headers (не видно, але вони все одно враховуються)

Деякі surfaces з важким runtime мають власні явні обмеження:

- `agents.defaults.contextLimits.memoryGetMaxChars`
- `agents.defaults.contextLimits.memoryGetDefaultLines`
- `agents.defaults.contextLimits.toolResultMaxChars`
- `agents.defaults.contextLimits.postCompactionMaxChars`

Override для окремого агента містяться в `agents.list[].contextLimits`. Ці параметри
призначені для обмежених runtime excerpt-ів і injected block-ів, якими володіє runtime. Вони
окремі від лімітів bootstrap, лімітів startup-context і
лімітів prompt для Skills.

Для зображень OpenClaw зменшує payload-и transcript/tool image перед викликами провайдера.
Для налаштування цього використовуйте `agents.defaults.imageMaxDimensionPx` (типово: `1200`):

- Нижчі значення зазвичай зменшують використання vision-token і розмір payload.
- Вищі значення зберігають більше візуальних деталей для OCR/UI-heavy screenshot-ів.

Для практичної розбивки (по кожному injected file, інструментах, Skills і розміру system prompt) використовуйте `/context list` або `/context detail`. Див. [Контекст](/uk/concepts/context).

## Як побачити поточне використання токенів

Використовуйте це в чаті:

- `/status` → **картка status з емодзі** з моделлю сесії, використанням контексту,
  токенами input/output останньої відповіді та **оціненою вартістю** (лише для API key).
- `/usage off|tokens|full` → додає **нижній колонтитул використання для кожної відповіді**.
  - Зберігається для кожної сесії (як `responseUsage`).
  - OAuth auth **приховує вартість** (лише токени).
- `/usage cost` → показує локальний підсумок вартості з логів сесій OpenClaw.

Інші поверхні:

- **TUI/Web TUI:** підтримуються `/status` + `/usage`.
- **CLI:** `openclaw status --usage` і `openclaw channels list` показують
  нормалізовані вікна квот провайдера (`X% left`, а не вартість кожної відповіді).
  Поточні провайдери usage-window: Anthropic, GitHub Copilot, Gemini CLI,
  OpenAI Codex, MiniMax, Xiaomi і z.ai.

Поверхні usage нормалізують поширені alias-и native-полів провайдерів перед відображенням.
Для трафіку OpenAI-family Responses це включає як `input_tokens` /
`output_tokens`, так і `prompt_tokens` / `completion_tokens`, щоб назви полів,
специфічні для транспорту, не змінювали `/status`, `/usage` або session summary.
Нормалізується і JSON usage Gemini CLI: текст відповіді береться з `response`, а
`stats.cached` мапиться в `cacheRead`, при цьому `stats.input_tokens - stats.cached`
використовується тоді, коли CLI не надає явного поля `stats.input`.
Для native-трафіку OpenAI-family Responses alias-и usage у WebSocket/SSE нормалізуються так само, а підсумки використовують fallback до нормалізованих input + output, коли
`total_tokens` відсутній або дорівнює `0`.
Коли поточний snapshot сесії є розрідженим, `/status` і `session_status` також можуть
відновлювати лічильники token/cache і активну мітку runtime model з
найновішого usage-логу транскрипту. Наявні ненульові live-значення все одно мають
пріоритет над fallback-значеннями з транскрипту, а більші загальні значення з транскрипту, орієнтовані на prompt,
можуть перемагати, коли збережені totals відсутні або менші.
Auth для usage у вікнах квот провайдерів береться зі специфічних для провайдера hook-ів, коли вони
доступні; інакше OpenClaw використовує fallback до відповідних OAuth/API-key credentials
з auth profile, env або config.
Записи транскрипту асистента зберігають ту саму нормалізовану форму usage, включно з
`usage.cost`, коли для активної моделі налаштовано pricing і провайдер
повертає usage metadata. Це дає `/usage cost` і transcript-backed session
status стабільне джерело навіть після того, як live runtime state зникає.

## Оцінка вартості (коли вона показується)

Вартість оцінюється з конфігурації pricing вашої моделі:

```text
models.providers.<provider>.models[].cost
```

Це **USD за 1M токенів** для `input`, `output`, `cacheRead` і
`cacheWrite`. Якщо pricing відсутній, OpenClaw показує лише токени. OAuth tokens
ніколи не показують вартість у доларах.

## Вплив cache TTL і pruning

Кешування prompt у провайдера застосовується лише в межах вікна cache TTL. OpenClaw може
необов’язково запускати **cache-ttl pruning**: він обрізає сесію після завершення cache TTL,
а потім скидає вікно кешу, щоб наступні запити могли повторно використати
свіжокешований контекст замість повторного кешування всієї історії. Це дозволяє
зменшити витрати на cache write, коли сесія простоює довше за TTL.

Налаштовуйте це в [Конфігурації Gateway](/uk/gateway/configuration), а деталі
поведінки див. у [Session pruning](/uk/concepts/session-pruning).

Heartbeat може **тримати кеш теплим** під час періодів простою. Якщо cache TTL
вашої моделі становить `1h`, встановлення heartbeat-інтервалу трохи менше цього значення (наприклад `55m`) може дозволити уникнути повторного кешування всього prompt, зменшуючи витрати на cache write.

У multi-agent-конфігураціях ви можете зберігати одну спільну model config і налаштовувати поведінку кешу
для кожного агента через `agents.list[].params.cacheRetention`.

Повний посібник по кожному параметру див. в [Prompt Caching](/uk/reference/prompt-caching).

Для ціноутворення Anthropic API cache reads значно дешевші за input
tokens, тоді як cache writes тарифікуються за вищим множником. Див. поточні тарифи Anthropic
на prompt caching, щоб дізнатися найновіші ставки та TTL-множники:
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### Приклад: тримати 1h-кеш теплим через heartbeat

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### Приклад: змішаний трафік зі стратегією кешу для кожного агента

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # default baseline for most agents
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # keep long cache warm for deep sessions
    - id: "alerts"
      params:
        cacheRetention: "none" # avoid cache writes for bursty notifications
```

`agents.list[].params` об’єднується поверх `params` вибраної моделі, тож ви можете
перевизначити лише `cacheRetention`, успадкувавши інші типові значення моделі без змін.

### Приклад: увімкнення beta-header Anthropic для контексту 1M

Контекстне вікно Anthropic 1M наразі закрите beta-gate. OpenClaw може інжектувати
потрібне значення `anthropic-beta`, коли ви вмикаєте `context1m` на підтримуваних моделях Opus
або Sonnet.

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

Це мапиться на beta-header Anthropic `context-1m-2025-08-07`.

Це застосовується лише тоді, коли для цього запису моделі встановлено `context1m: true`.

Вимога: credential має бути придатним для long-context usage. Якщо ні,
Anthropic поверне provider-side помилку rate limit для цього запиту.

Якщо ви автентифікуєте Anthropic через OAuth/subscription tokens (`sk-ant-oat-*`),
OpenClaw пропускає beta-header `context-1m-*`, оскільки Anthropic наразі
відхиляє таку комбінацію з HTTP 401.

## Поради щодо зменшення тиску токенів

- Використовуйте `/compact`, щоб підсумовувати довгі сесії.
- У своїх workflow обрізайте великі output інструментів.
- Зменшуйте `agents.defaults.imageMaxDimensionPx` для сесій із великою кількістю screenshot-ів.
- Тримайте описи Skills короткими (список Skills інжектується в prompt).
- Для багатослівної, дослідницької роботи віддавайте перевагу меншим моделям.

Див. [Skills](/uk/tools/skills), щоб побачити точну формулу накладних витрат від списку Skills.
