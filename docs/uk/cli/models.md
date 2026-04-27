---
read_when:
    - Ви хочете змінити моделі за замовчуванням або переглянути статус auth провайдера
    - Ви хочете просканувати доступні моделі/провайдери та налагодити профілі auth
summary: Довідник CLI для `openclaw models` (status/list/set/scan, псевдоніми, fallback, auth)
title: Моделі
x-i18n:
    generated_at: "2026-04-27T06:24:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: ffafec22fb05909fd06ffc8987f8da87597ef6aa85a69bcadbcfcc1d19f7d7dc
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Виявлення моделей, сканування та конфігурація (модель за замовчуванням, fallback, профілі auth).

Пов’язане:

- Провайдери + моделі: [Моделі](/uk/providers/models)
- Концепції вибору моделі + slash-команда `/models`: [Концепція моделей](/uk/concepts/models)
- Налаштування auth провайдера: [Початок роботи](/uk/start/getting-started)

## Поширені команди

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` показує визначені модель за замовчуванням/fallback, а також огляд auth.
Коли доступні знімки використання провайдера, розділ стану OAuth/API key містить
вікна використання провайдера та знімки квот.
Поточні провайдери з вікнами використання: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi і z.ai. Usage auth надходить зі специфічних для провайдера hooks,
коли вони доступні; інакше OpenClaw повертається до зіставлення облікових даних
OAuth/API key з профілів auth, env або конфігурації.
У виводі `--json` `auth.providers` — це огляд провайдерів з урахуванням env/config/store,
тоді як `auth.oauth` — лише стан профілів сховища auth.
Додайте `--probe`, щоб виконати live-перевірки auth для кожного налаштованого профілю провайдера.
Перевірки — це реальні запити (можуть витрачати токени та спричиняти обмеження швидкості).
Використовуйте `--agent <id>`, щоб переглянути стан моделі/auth для налаштованого агента. Якщо його не вказано,
команда використовує `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`, якщо задано, інакше —
налаштованого агента за замовчуванням.
Рядки перевірок можуть походити з профілів auth, облікових даних env або `models.json`.

Примітки:

- `models set <model-or-alias>` приймає `provider/model` або псевдонім.
- `models list` працює лише на читання: вона читає конфігурацію, профілі auth, наявний стан каталогу
  та рядки каталогу, що належать провайдеру, але не переписує
  `models.json`.
- `models list --all --provider <id>` може включати статичні рядки каталогу, що належать провайдеру,
  з маніфестів plugin або метаданих вбудованого каталогу провайдера, навіть якщо ви
  ще не автентифікувалися в цього провайдера. Такі рядки все одно показуються як
  недоступні, доки не буде налаштовано відповідний auth.
- `models list` зберігає розділення між власними метаданими моделі та runtime-обмеженнями. У табличному
  виводі `Ctx` показує `contextTokens/contextWindow`, коли ефективне runtime-обмеження
  відрізняється від власного контекстного вікна; рядки JSON містять `contextTokens`,
  якщо провайдер відкриває це обмеження.
- `models list --provider <id>` фільтрує за id провайдера, наприклад `moonshot` або
  `openai-codex`. Він не приймає мітки відображення з інтерактивних
  засобів вибору провайдера, як-от `Moonshot AI`.
- Посилання на моделі розбираються поділом за **першим** `/`. Якщо ID моделі містить `/` (у стилі OpenRouter), додайте префікс провайдера (приклад: `openrouter/moonshotai/kimi-k2`).
- Якщо ви пропускаєте провайдера, OpenClaw спочатку визначає введення як псевдонім, потім —
  як унікальний збіг точного id моделі серед налаштованих провайдерів, і лише після цього
  повертається до налаштованого провайдера за замовчуванням із попередженням про застарілість.
  Якщо цей провайдер більше не надає налаштовану модель за замовчуванням, OpenClaw
  повертається до першого налаштованого провайдера/моделі замість того, щоб показувати
  застаріле типове значення видаленого провайдера.
- `models status` може показувати `marker(<value>)` у виводі auth для несекретних заповнювачів (наприклад `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) замість маскування їх як секретів.

### Сканування моделей

`models scan` читає публічний каталог `:free` OpenRouter і ранжує кандидатів для
використання як fallback. Сам каталог є публічним, тому для сканувань лише метаданих
ключ OpenRouter не потрібен.

За замовчуванням OpenClaw намагається перевірити підтримку інструментів і зображень за допомогою live-викликів моделей.
Якщо ключ OpenRouter не налаштовано, команда повертається до виводу лише метаданих і пояснює,
що моделі `:free` все одно потребують `OPENROUTER_API_KEY` для
перевірок і інференсу.

Параметри:

- `--no-probe` (лише метадані; без пошуку конфігурації/секретів)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (тайм-аут запиту каталогу та тайм-аут кожної перевірки)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` і `--set-image` вимагають live-перевірок; результати сканування
лише метаданих мають інформаційний характер і не застосовуються до конфігурації.

### Стан моделей

Параметри:

- `--json`
- `--plain`
- `--check` (код виходу 1=прострочено/відсутнє, 2=скоро спливає)
- `--probe` (live-перевірка налаштованих профілів auth)
- `--probe-provider <name>` (перевірити одного провайдера)
- `--probe-profile <id>` (повторювані або профілі через кому)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id налаштованого агента; перевизначає `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Категорії стану перевірок:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Випадки detail/reason-code перевірок, яких слід очікувати:

- `excluded_by_auth_order`: збережений профіль існує, але явний
  `auth.order.<provider>` його пропустив, тож перевірка повідомляє про це виключення замість
  спроби використати профіль.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  профіль присутній, але не придатний/не може бути визначений.
- `no_model`: auth провайдера існує, але OpenClaw не зміг визначити придатного
  кандидата моделі для перевірки для цього провайдера.

## Псевдоніми + fallback

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## Профілі auth

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` — це інтерактивний помічник auth. Він може запустити потік auth провайдера
(OAuth/API key) або провести вас через ручне вставлення токена, залежно від
вибраного провайдера.

`models auth login` запускає потік auth plugin провайдера (OAuth/API key). Використовуйте
`openclaw plugins list`, щоб побачити, які провайдери встановлено.
Використовуйте `openclaw models auth --agent <id> <subcommand>`, щоб записати результати auth у
сховище конкретного налаштованого агента. Батьківський прапорець `--agent` враховується для
`add`, `login`, `setup-token`, `paste-token` і `login-github-copilot`.

Приклади:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Примітки:

- `setup-token` і `paste-token` залишаються універсальними командами токенів для провайдерів,
  які надають методи auth через токен.
- `setup-token` вимагає інтерактивного TTY і запускає метод token-auth провайдера
  (за замовчуванням використовуючи метод `setup-token` цього провайдера, якщо він його надає).
- `paste-token` приймає рядок токена, згенерований деінде або автоматизацією.
- `paste-token` вимагає `--provider`, запитує значення токена і записує
  його до типового id профілю `<provider>:manual`, якщо ви не передасте
  `--profile-id`.
- `paste-token --expires-in <duration>` зберігає абсолютний час завершення дії токена на основі
  відносної тривалості, наприклад `365d` або `12h`.
- Примітка щодо Anthropic: співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволено, тому OpenClaw вважає повторне використання Claude CLI та `claude -p` санкціонованими для цієї інтеграції, якщо Anthropic не опублікує нову політику.
- `setup-token` / `paste-token` для Anthropic залишаються підтримуваним шляхом токенів OpenClaw, але тепер OpenClaw надає перевагу повторному використанню Claude CLI і `claude -p`, коли це доступно.

## Пов’язане

- [Довідник CLI](/uk/cli)
- [Вибір моделі](/uk/concepts/model-providers)
- [Перемикання моделі при відмові](/uk/concepts/model-failover)
