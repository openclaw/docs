---
read_when:
    - Ви хочете покрокове налаштування для Gateway, робочого простору, автентифікації, каналів і Skills
summary: Довідник CLI для `openclaw onboard` (інтерактивне онбординг-налаштування)
title: Онбординг
x-i18n:
    generated_at: "2026-04-25T08:04:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 234c308ea554195df1bd880bda7e30770e926af059740458d056e4a909aaeb07
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Інтерактивне онбординг-налаштування для локального або віддаленого налаштування Gateway.

## Пов’язані посібники

- Центр онбордингу CLI: [Онбординг (CLI)](/uk/start/wizard)
- Огляд онбордингу: [Огляд онбордингу](/uk/start/onboarding-overview)
- Довідник CLI для онбордингу: [Довідник із налаштування CLI](/uk/start/wizard-cli-reference)
- Автоматизація CLI: [Автоматизація CLI](/uk/start/wizard-cli-automation)
- Онбординг macOS: [Онбординг (додаток macOS)](/uk/start/onboarding)

## Приклади

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--modern` запускає попередню версію розмовного онбордингу Crestodian. Без
`--modern` `openclaw onboard` зберігає класичний сценарій онбордингу.

Для plaintext-цілей `ws://` у приватній мережі (лише для довірених мереж) установіть
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` у середовищі процесу онбордингу.
Еквівалента `openclaw.json` для цього аварійного клієнтського
обхідного механізму транспорту немає.

Некерований custom provider:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` є необов’язковим у неінтерактивному режимі. Якщо його не вказано, онбординг перевіряє `CUSTOM_API_KEY`.

LM Studio також підтримує специфічний для провайдера прапорець ключа в неінтерактивному режимі:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Некерований Ollama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` за замовчуванням має значення `http://127.0.0.1:11434`. `--custom-model-id` є необов’язковим; якщо його не вказано, онбординг використовує рекомендовані Ollama значення за замовчуванням. Ідентифікатори хмарних моделей, як-от `kimi-k2.5:cloud`, тут також працюють.

Зберігайте ключі провайдерів як ref замість plaintext:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

З `--secret-input-mode ref` онбординг записує refs на основі env замість plaintext-значень ключів.
Для провайдерів на основі auth-profile це записує записи `keyRef`; для custom providers це записує `models.providers.<id>.apiKey` як env ref (наприклад, `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Контракт неінтерактивного режиму `ref`:

- Установіть env var провайдера в середовищі процесу онбордингу (наприклад, `OPENAI_API_KEY`).
- Не передавайте вбудовані прапорці ключів (наприклад, `--openai-api-key`), якщо цей env var також не встановлено.
- Якщо вбудований прапорець ключа передано без потрібного env var, онбординг негайно завершується з підказкою щодо виправлення.

Параметри токена Gateway у неінтерактивному режимі:

- `--gateway-auth token --gateway-token <token>` зберігає plaintext-токен.
- `--gateway-auth token --gateway-token-ref-env <name>` зберігає `gateway.auth.token` як env SecretRef.
- `--gateway-token` і `--gateway-token-ref-env` є взаємовиключними.
- `--gateway-token-ref-env` потребує непорожнього env var у середовищі процесу онбордингу.
- З `--install-daemon`, коли автентифікація токеном потребує токен, токени Gateway під керуванням SecretRef проходять перевірку, але не зберігаються як розв’язані plaintext-значення в метаданих середовища сервісу supervisor.
- З `--install-daemon`, якщо режим токена потребує токен, а налаштований SecretRef токена є нерозв’язаним, онбординг завершується з блокуванням і підказкою щодо виправлення.
- З `--install-daemon`, якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не встановлено, онбординг блокує встановлення, доки режим не буде вказано явно.
- Локальний онбординг записує `gateway.mode="local"` у конфігурацію. Якщо в пізнішому файлі конфігурації бракує `gateway.mode`, розцінюйте це як пошкодження конфігурації або неповне ручне редагування, а не як припустиме скорочення для локального режиму.
- `--allow-unconfigured` — це окремий аварійний механізм часу виконання Gateway. Це не означає, що онбординг може пропустити `gateway.mode`.

Приклад:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN \
  --accept-risk
```

Стан Gateway локального режиму в неінтерактивному режимі:

- Якщо ви не передасте `--skip-health`, онбординг чекатиме, доки локальний Gateway стане доступним, перш ніж успішно завершитися.
- `--install-daemon` спочатку запускає сценарій керованого встановлення Gateway. Без нього у вас уже має працювати локальний Gateway, наприклад `openclaw gateway run`.
- Якщо в автоматизації вам потрібні лише записи конфігурації/робочого простору/bootstrap, використовуйте `--skip-health`.
- Якщо ви самі керуєте файлами робочого простору, передайте `--skip-bootstrap`, щоб установити `agents.defaults.skipBootstrap: true` і пропустити створення `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` і `BOOTSTRAP.md`.
- У нативному Windows `--install-daemon` спочатку намагається використати Scheduled Tasks і повертається до елемента входу на рівні користувача в папці Startup, якщо створення завдання заборонено.

Поведінка інтерактивного онбордингу з режимом reference:

- Коли з’явиться запит, виберіть **Використати посилання на секрет**.
- Потім виберіть один із варіантів:
  - Змінна середовища
  - Налаштований провайдер секретів (`file` або `exec`)
- Перед збереженням ref онбординг виконує швидку preflight-перевірку.
  - Якщо перевірка не вдається, онбординг показує помилку й дає змогу повторити спробу.

Варіанти endpoint Z.AI у неінтерактивному режимі:

Примітка: `--auth-choice zai-api-key` тепер автоматично визначає найкращий endpoint Z.AI для вашого ключа (надає перевагу загальному API з `zai/glm-5.1`).
Якщо вам спеціально потрібні endpoints GLM Coding Plan, виберіть `zai-coding-global` або `zai-coding-cn`.

```bash
# Вибір endpoint без запиту
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Інші варіанти endpoint Z.AI:
# --auth-choice zai-coding-cn
# --auth-choice zai-global
# --auth-choice zai-cn
```

Неінтерактивний приклад Mistral:

```bash
openclaw onboard --non-interactive \
  --auth-choice mistral-api-key \
  --mistral-api-key "$MISTRAL_API_KEY"
```

Примітки щодо сценаріїв:

- `quickstart`: мінімум запитів, автоматично генерує токен Gateway.
- `manual`: повні запити для port/bind/auth (псевдонім для `advanced`).
- Коли варіант автентифікації передбачає бажаного провайдера, онбординг попередньо фільтрує засоби вибору default-model і allowlist до цього провайдера. Для Volcengine і BytePlus це також відповідає варіантам coding-plan
  (`volcengine-plan/*`, `byteplus-plan/*`).
- Якщо фільтр preferred-provider поки що не дає жодної завантаженої моделі, онбординг
  повертається до нефільтрованого каталогу замість того, щоб залишити засіб вибору порожнім.
- На етапі web-search деякі провайдери можуть викликати додаткові запити, специфічні для провайдера:
  - **Grok** може запропонувати необов’язкове налаштування `x_search` з тим самим `XAI_API_KEY`
    і вибором моделі `x_search`.
  - **Kimi** може запитати регіон Moonshot API (`api.moonshot.ai` чи
    `api.moonshot.cn`) і модель web-search Kimi за замовчуванням.
- Поведінка області DM у локальному онбордингу: [Довідник із налаштування CLI](/uk/start/wizard-cli-reference#outputs-and-internals).
- Найшвидший перший чат: `openclaw dashboard` (Control UI, без налаштування каналів).
- Custom Provider: підключайте будь-який endpoint, сумісний з OpenAI або Anthropic,
  включно з хостованими провайдерами, яких немає в списку. Використовуйте Unknown для автоматичного визначення.

## Поширені команди після налаштування

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` не означає неінтерактивний режим. Для скриптів використовуйте `--non-interactive`.
</Note>
