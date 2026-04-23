---
read_when:
    - Ви хочете змінити типові моделі або переглянути стан auth провайдера
    - Ви хочете просканувати доступні моделі/провайдерів і налагодити профілі auth провайдера
summary: Довідка CLI для `openclaw models` (status/list/set/scan, псевдоніми, резервні варіанти, auth)
title: моделі
x-i18n:
    generated_at: "2026-04-23T06:18:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5b057688266bcb72fc9719837ae6a026bed9849ff04577949467363d83b6d069
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

Виявлення, сканування та налаштування моделей (типова модель, резервні варіанти, профілі auth).

Пов’язано:

- Провайдери + моделі: [Моделі](/uk/providers/models)
- Налаштування auth провайдера: [Початок роботи](/uk/start/getting-started)

## Поширені команди

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` показує визначені типові/резервні варіанти разом з оглядом auth.
Коли доступні знімки використання провайдера, розділ стану OAuth/API key також містить
вікна використання провайдера та знімки квот.
Поточні провайдери з вікнами використання: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi і z.ai. Auth використання надходить із хуків,
специфічних для провайдера, коли вони доступні; інакше OpenClaw повертається до зіставлення
облікових даних OAuth/API key з профілів auth, env або config.
У виводі `--json` `auth.providers` — це огляд провайдера з урахуванням
env/config/store, тоді як `auth.oauth` — це лише стан профілів сховища auth.
Додайте `--probe`, щоб виконати живі перевірки auth для кожного налаштованого профілю провайдера.
Перевірки є реальними запитами (можуть витрачати токени й спричиняти обмеження частоти).
Використовуйте `--agent <id>`, щоб перевірити стан моделі/auth для налаштованого агента. Якщо параметр не вказано,
команда використовує `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`, якщо їх задано, інакше —
типовий налаштований агент.
Рядки перевірок можуть походити з профілів auth, облікових даних env або `models.json`.

Примітки:

- `models set <model-or-alias>` приймає `provider/model` або псевдонім.
- `models list --all` включає рядки статичного каталогу, які належать bundled-провайдерам,
  навіть якщо ви ще не пройшли автентифікацію в цього провайдера. Такі рядки все одно
  показуються як недоступні, доки не буде налаштовано відповідний auth.
- Посилання на моделі аналізуються розділенням за **першим** символом `/`. Якщо ID моделі містить `/` (у стилі OpenRouter), додайте префікс провайдера (приклад: `openrouter/moonshotai/kimi-k2`).
- Якщо ви не вказали провайдера, OpenClaw спочатку визначає введення як псевдонім, потім —
  як унікальний збіг налаштованого провайдера для цього точного id моделі, і лише після цього
  повертається до типового налаштованого провайдера з попередженням про застарілість.
  Якщо цей провайдер більше не надає налаштовану типову модель, OpenClaw
  повертається до першого налаштованого провайдера/моделі замість показу
  застарілого типового значення для видаленого провайдера.
- `models status` може показувати `marker(<value>)` у виводі auth для незасекречених заповнювачів (наприклад `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) замість маскування їх як секретів.

### `models status`

Параметри:

- `--json`
- `--plain`
- `--check` (код виходу 1=прострочено/відсутнє, 2=скоро спливає)
- `--probe` (жива перевірка налаштованих профілів auth)
- `--probe-provider <name>` (перевірити один провайдер)
- `--probe-profile <id>` (повторювані або перелічені через кому id профілів)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id налаштованого агента; перевизначає `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

Категорії станів перевірок:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

Варіанти detail/reason-code перевірок, яких варто очікувати:

- `excluded_by_auth_order`: збережений профіль існує, але явний
  `auth.order.<provider>` його пропустив, тому перевірка повідомляє про виключення замість
  спроби використання.
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  профіль наявний, але не є придатним/визначуваним.
- `no_model`: auth провайдера існує, але OpenClaw не зміг визначити придатний
  кандидат моделі для перевірки для цього провайдера.

## Псевдоніми + резервні варіанти

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

`models auth add` — це інтерактивний помічник auth. Він може запускати потік auth провайдера
(OAuth/API key) або провести вас через ручне вставлення токена, залежно від
обраного провайдера.

`models auth login` запускає потік auth plugin провайдера (OAuth/API key). Використовуйте
`openclaw plugins list`, щоб побачити, які провайдери встановлено.

Приклади:

```bash
openclaw models auth login --provider openai-codex --set-default
```

Примітки:

- `setup-token` і `paste-token` залишаються загальними командами для токенів для провайдерів,
  які надають методи auth через токен.
- `setup-token` потребує інтерактивного TTY і запускає метод токен-auth провайдера
  (типово — метод `setup-token` цього провайдера, якщо він його надає).
- `paste-token` приймає рядок токена, створений деінде або автоматизацією.
- `paste-token` вимагає `--provider`, запитує значення токена та записує
  його до типового id профілю `<provider>:manual`, якщо ви не передали
  `--profile-id`.
- `paste-token --expires-in <duration>` зберігає абсолютний час завершення дії токена з
  відносної тривалості, наприклад `365d` або `12h`.
- Примітка щодо Anthropic: співробітники Anthropic повідомили нам, що використання Claude CLI у стилі OpenClaw знову дозволене, тому OpenClaw вважає повторне використання Claude CLI та використання `claude -p` дозволеними для цієї інтеграції, якщо Anthropic не опублікує нову політику.
- `setup-token` / `paste-token` для Anthropic залишаються доступними як підтримуваний шлях токена OpenClaw, але тепер OpenClaw віддає перевагу повторному використанню Claude CLI і `claude -p`, коли це можливо.
