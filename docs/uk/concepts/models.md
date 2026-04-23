---
read_when:
    - Додавання або зміна CLI моделей (`models list/set/scan/aliases/fallbacks`)
    - Зміна поведінки fallback моделей або UX вибору моделей
    - Оновлення probe сканування моделей (інструменти/зображення)
summary: 'CLI моделей: list, set, aliases, fallbacks, scan, status'
title: CLI моделей
x-i18n:
    generated_at: "2026-04-23T20:50:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 057961f14ba8dbc2f6336091f4fc47c858acd4e64eec9498320b6eee61dea085
    source_path: concepts/models.md
    workflow: 15
---

Див. [/concepts/model-failover](/uk/concepts/model-failover) щодо
ротації auth profile, cooldown і того, як це взаємодіє з fallback.
Короткий огляд провайдерів + приклади: [/concepts/model-providers](/uk/concepts/model-providers).

## Як працює вибір моделі

OpenClaw вибирає моделі в такому порядку:

1. **Основна** модель (`agents.defaults.model.primary` або `agents.defaults.model`).
2. **Fallback-моделі** в `agents.defaults.model.fallbacks` (по порядку).
3. **Provider auth failover** відбувається всередині провайдера перед переходом до
   наступної моделі.

Пов’язане:

- `agents.defaults.models` — це allowlist/каталог моделей, які може використовувати OpenClaw (разом із псевдонімами).
- `agents.defaults.imageModel` використовується **лише тоді**, коли основна модель не може приймати зображення.
- `agents.defaults.pdfModel` використовується інструментом `pdf`. Якщо не вказано, інструмент
  повертається до `agents.defaults.imageModel`, а потім до визначеної для сесії/типової
  моделі.
- `agents.defaults.imageGenerationModel` використовується спільною поверхнею можливостей генерації зображень. Якщо не вказано, `image_generate` усе одно може визначити типове значення провайдера з auth. Спочатку він пробує поточного типового провайдера, а потім інші зареєстровані провайдери генерації зображень у порядку provider-id. Якщо ви задаєте конкретний provider/model, також налаштуйте auth/API key цього провайдера.
- `agents.defaults.musicGenerationModel` використовується спільною поверхнею можливостей генерації музики. Якщо не вказано, `music_generate` усе одно може визначити типове значення провайдера з auth. Спочатку він пробує поточного типового провайдера, а потім інші зареєстровані провайдери генерації музики в порядку provider-id. Якщо ви задаєте конкретний provider/model, також налаштуйте auth/API key цього провайдера.
- `agents.defaults.videoGenerationModel` використовується спільною поверхнею можливостей генерації відео. Якщо не вказано, `video_generate` усе одно може визначити типове значення провайдера з auth. Спочатку він пробує поточного типового провайдера, а потім інші зареєстровані провайдери генерації відео в порядку provider-id. Якщо ви задаєте конкретний provider/model, також налаштуйте auth/API key цього провайдера.
- Типові значення для окремого агента можуть перевизначати `agents.defaults.model` через `agents.list[].model` разом із bindings (див. [/concepts/multi-agent](/uk/concepts/multi-agent)).

## Коротка політика моделей

- Установіть як основну найсильнішу модель останнього покоління, яка вам доступна.
- Використовуйте fallback для завдань, чутливих до вартості/затримки, і менш важливих чатів.
- Для агентів з увімкненими інструментами або недовірених входів уникайте старіших/слабших рівнів моделей.

## Onboarding (рекомендовано)

Якщо ви не хочете вручну редагувати конфігурацію, запустіть onboarding:

```bash
openclaw onboard
```

Він може налаштувати model + auth для поширених провайдерів, зокрема **OpenAI Code (Codex)
subscription** (OAuth) і **Anthropic** (API key або Claude CLI).

## Ключі конфігурації (огляд)

- `agents.defaults.model.primary` і `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` і `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` і `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` і `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` і `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (allowlist + псевдоніми + параметри провайдера)
- `models.providers` (власні провайдери, записані в `models.json`)

Посилання на моделі нормалізуються до нижнього регістру. Псевдоніми провайдерів, такі як `z.ai/*`, нормалізуються
до `zai/*`.

Приклади конфігурації провайдерів (включно з OpenCode) наведено в
[/providers/opencode](/uk/providers/opencode).

### Безпечні зміни allowlist

Використовуйте адитивні записи, коли вручну оновлюєте `agents.defaults.models`:

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.5":{}}' --strict-json --merge
```

`openclaw config set` захищає map моделей/провайдерів від випадкового перезапису. Звичайне
присвоєння об’єкта для `agents.defaults.models`, `models.providers` або
`models.providers.<id>.models` відхиляється, якщо воно видалить наявні
записи. Використовуйте `--merge` для адитивних змін; використовуйте `--replace` лише тоді, коли
передане значення має стати повним цільовим значенням.

Інтерактивне налаштування провайдера і `openclaw configure --section model` також об’єднують
вибрані значення в межах провайдера в наявний allowlist, тому додавання Codex,
Ollama або іншого провайдера не видаляє не пов’язані записи моделей.

## «Model is not allowed» (і чому відповіді зупиняються)

Якщо задано `agents.defaults.models`, він стає **allowlist** для `/model` і для
перевизначень сесії. Коли користувач вибирає модель, якої немає в цьому allowlist,
OpenClaw повертає:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Це відбувається **до** генерації звичайної відповіді, тому повідомлення може виглядати так,
ніби на нього «не відповіли». Виправлення полягає в тому, щоб:

- Додати модель до `agents.defaults.models`, або
- Очистити allowlist (видалити `agents.defaults.models`), або
- Вибрати модель із `/model list`.

Приклад конфігурації allowlist:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## Перемикання моделей у чаті (`/model`)

Ви можете перемикати моделі для поточної сесії без перезапуску:

```
/model
/model list
/model 3
/model openai/gpt-5.5
/model status
```

Примітки:

- `/model` (і `/model list`) — це компактний пронумерований вибір (сімейство моделей + доступні провайдери).
- У Discord `/model` і `/models` відкривають інтерактивний вибір із випадними списками провайдера та моделі плюс кроком Submit.
- `/models add` доступна типово й може бути вимкнена через `commands.modelsWrite=false`.
- Коли ввімкнено, `/models add <provider> <modelId>` — це найшвидший шлях; просто `/models add` запускає покроковий процес «спочатку провайдер», де це підтримується.
- Після `/models add` нова модель стає доступною в `/models` і `/model` без перезапуску gateway.
- `/model <#>` вибирає з цього списку.
- `/model` одразу зберігає новий вибір для сесії.
- Якщо агент неактивний, наступний запуск відразу використає нову модель.
- Якщо запуск уже активний, OpenClaw позначає живе перемикання як відкладене й перезапускається з новою моделлю лише в чистій точці повторної спроби.
- Якщо активність інструментів або вивід відповіді вже почалися, відкладене перемикання може залишатися в черзі до пізнішої можливості повторної спроби або наступного ходу користувача.
- `/model status` — це детальний режим перегляду (кандидати auth і, якщо налаштовано, `baseUrl` endpoint провайдера + режим `api`).
- Посилання на моделі розбираються розділенням за **першим** `/`. Використовуйте `provider/model`, коли вводите `/model <ref>`.
- Якщо сам ID моделі містить `/` (у стилі OpenRouter), ви маєте вказати префікс провайдера (приклад: `/model openrouter/moonshotai/kimi-k2`).
- Якщо ви не вказали провайдера, OpenClaw визначає введення в такому порядку:
  1. збіг із псевдонімом
  2. унікальний збіг налаштованого провайдера для цього точного ID моделі без префікса
  3. застарілий fallback до налаштованого типового провайдера
     Якщо цей провайдер більше не надає налаштовану типову модель, OpenClaw
     натомість переходить до першого налаштованого провайдера/моделі, щоб не
     показувати застаріле типове значення видаленого провайдера.

Повна поведінка/конфігурація команди: [Slash commands](/uk/tools/slash-commands).

Приклади:

```text
/models add
/models add ollama glm-5.1:cloud
/models add lmstudio qwen/qwen3.5-9b
```

## Команди CLI

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (без підкоманди) — це скорочення для `models status`.

### `models list`

Типово показує налаштовані моделі. Корисні прапорці:

- `--all`: повний каталог
- `--local`: лише локальні провайдери
- `--provider <id>`: фільтрувати за ID провайдера, наприклад `moonshot`; мітки
  відображення з інтерактивних списків не приймаються
- `--plain`: одна модель на рядок
- `--json`: машинозчитуваний вивід

`--all` включає bundled статичні рядки каталогу, що належать провайдерам, ще до
налаштування auth, тому режими лише для виявлення можуть показувати моделі, які недоступні, доки
ви не додасте відповідні облікові дані провайдера.

### `models status`

Показує визначену основну модель, fallback-моделі, image model і огляд auth
налаштованих провайдерів. Також відображає стан завершення дії OAuth для профілів, знайдених
у сховищі auth (типово попереджає за 24 год). `--plain` виводить лише
визначену основну модель.
Стан OAuth показується завжди (і включається у вивід `--json`). Якщо налаштований
провайдер не має облікових даних, `models status` виводить розділ **Missing auth**.
JSON містить `auth.oauth` (вікно попередження + профілі) і `auth.providers`
(ефективний auth для кожного провайдера, включно з обліковими даними з env). `auth.oauth`
охоплює лише стан профілів у сховищі auth; провайдери лише з env там не з’являються.
Використовуйте `--check` для автоматизації (код виходу `1`, якщо дані відсутні/прострочені, `2`, якщо скоро спливають).
Використовуйте `--probe` для live-перевірок auth; рядки probe можуть надходити з auth profile, env-облікових даних
або `models.json`.
Якщо явний `auth.order.<provider>` пропускає збережений profile, probe повідомляє
`excluded_by_auth_order` замість спроби його використати. Якщо auth є, але не вдається визначити
жодну модель для probe від цього провайдера, probe повідомляє `status: no_model`.

Вибір auth залежить від провайдера/облікового запису. Для хостів gateway, що працюють постійно, API
keys зазвичай найпередбачуваніші; також підтримуються повторне використання Claude CLI і наявні
профілі OAuth/token Anthropic.

Приклад (Claude CLI):

```bash
claude auth login
openclaw models status
```

## Сканування (безкоштовні моделі OpenRouter)

`openclaw models scan` перевіряє **каталог безкоштовних моделей** OpenRouter і може
за потреби виконувати probe моделей на підтримку інструментів і зображень.

Основні прапорці:

- `--no-probe`: пропустити live-probe (лише метадані)
- `--min-params <b>`: мінімальний розмір параметрів (у мільярдах)
- `--max-age-days <days>`: пропускати старіші моделі
- `--provider <name>`: фільтр за префіксом провайдера
- `--max-candidates <n>`: розмір списку fallback
- `--set-default`: установити `agents.defaults.model.primary` на перший вибір
- `--set-image`: установити `agents.defaults.imageModel.primary` на перший вибір зображення

Для probe потрібен API key OpenRouter (з auth profile або
`OPENROUTER_API_KEY`). Без ключа використовуйте `--no-probe`, щоб лише перелічити кандидатів.

Результати сканування ранжуються за:

1. Підтримкою зображень
2. Затримкою інструментів
3. Розміром контексту
4. Кількістю параметрів

Вхідні дані

- Список OpenRouter `/models` (фільтр `:free`)
- Потрібен API key OpenRouter з auth profile або `OPENROUTER_API_KEY` (див. [/environment](/uk/help/environment))
- Необов’язкові фільтри: `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Керування probe: `--timeout`, `--concurrency`

Під час запуску в TTY ви можете інтерактивно вибирати fallback-моделі. У неінтерактивному
режимі передайте `--yes`, щоб прийняти типові значення.

## Реєстр моделей (`models.json`)

Власні провайдери в `models.providers` записуються в `models.json` у каталозі
агента (типово `~/.openclaw/agents/<agentId>/agent/models.json`). Цей файл
типово об’єднується, якщо тільки `models.mode` не встановлено на `replace`.

Пріоритет режиму merge для provider ID, що збігаються:

- Непорожній `baseUrl`, який уже є в `models.json` агента, має пріоритет.
- Непорожній `apiKey` у `models.json` агента має пріоритет лише тоді, коли цей провайдер не керується через SecretRef у поточному контексті config/auth-profile.
- Значення `apiKey` провайдерів, керованих через SecretRef, оновлюються з маркерів джерела (`ENV_VAR_NAME` для env ref, `secretref-managed` для file/exec ref) замість збереження визначених секретів.
- Значення заголовків провайдерів, керованих через SecretRef, оновлюються з маркерів джерела (`secretref-env:ENV_VAR_NAME` для env ref, `secretref-managed` для file/exec ref).
- Порожній або відсутній `apiKey`/`baseUrl` агента повертається до config `models.providers`.
- Інші поля провайдера оновлюються з config і нормалізованих даних каталогу.

Збереження маркерів є авторитетним щодо джерела: OpenClaw записує маркери з активного snapshot конфігурації джерела (до визначення), а не з визначених runtime-значень секретів.
Це застосовується щоразу, коли OpenClaw повторно генерує `models.json`, включно з шляхами, ініційованими командами, як-от `openclaw agent`.

## Пов’язане

- [Model Providers](/uk/concepts/model-providers) — маршрутизація провайдерів і auth
- [Model Failover](/uk/concepts/model-failover) — ланцюжки fallback
- [Image Generation](/uk/tools/image-generation) — конфігурація моделей зображень
- [Music Generation](/uk/tools/music-generation) — конфігурація музичних моделей
- [Video Generation](/uk/tools/video-generation) — конфігурація відеомоделей
- [Configuration Reference](/uk/gateway/configuration-reference#agent-defaults) — ключі конфігурації моделей
