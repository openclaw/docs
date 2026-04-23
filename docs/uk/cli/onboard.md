---
read_when:
    - Ви хочете кероване налаштування Gateway, робочого простору, автентифікації, каналів і Skills
summary: Довідник CLI для `openclaw onboard` (інтерактивне початкове налаштування)
title: початкове налаштування
x-i18n:
    generated_at: "2026-04-23T06:18:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 348ee9cbc14ff78b588f10297e728473668a72f9f16be385f25022bf5108340c
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Інтерактивне початкове налаштування для локального або віддаленого налаштування Gateway.

## Пов’язані посібники

- Центр початкового налаштування CLI: [Onboarding (CLI)](/uk/start/wizard)
- Огляд початкового налаштування: [Onboarding Overview](/uk/start/onboarding-overview)
- Довідник CLI початкового налаштування: [CLI Setup Reference](/uk/start/wizard-cli-reference)
- Автоматизація CLI: [CLI Automation](/uk/start/wizard-cli-automation)
- Початкове налаштування macOS: [Onboarding (macOS App)](/uk/start/onboarding)

## Приклади

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

Для plaintext-цілей `ws://` у приватній мережі (лише для довірених мереж) установіть
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` у середовищі процесу початкового налаштування.

Неінтерактивний custom provider:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` є необов’язковим у неінтерактивному режимі. Якщо його не вказано, початкове налаштування перевіряє `CUSTOM_API_KEY`.

LM Studio також підтримує прапорець ключа, специфічний для провайдера, у неінтерактивному режимі:

```bash
openclaw onboard --non-interactive \
  --auth-choice lmstudio \
  --custom-base-url "http://localhost:1234/v1" \
  --custom-model-id "qwen/qwen3.5-9b" \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --accept-risk
```

Неінтерактивний Ollama:

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

`--custom-base-url` типово дорівнює `http://127.0.0.1:11434`. `--custom-model-id` є необов’язковим; якщо його не вказано, початкове налаштування використовує типові значення, запропоновані Ollama. Cloud model ID, такі як `kimi-k2.5:cloud`, також тут працюють.

Зберігайте ключі провайдерів як refs замість plaintext:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

З `--secret-input-mode ref` початкове налаштування записує refs, підкріплені env, замість plaintext-значень ключів.
Для провайдерів, що використовують auth-profile, це записує записи `keyRef`; для custom providers це записує `models.providers.<id>.apiKey` як env ref (наприклад `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Контракт неінтерактивного режиму `ref`:

- Установіть env var провайдера в середовищі процесу початкового налаштування (наприклад, `OPENAI_API_KEY`).
- Не передавайте inline-прапорці ключів (наприклад, `--openai-api-key`), якщо цей env var також не встановлено.
- Якщо inline-прапорець ключа передано без потрібного env var, початкове налаштування одразу завершується з помилкою та підказками.

Параметри токена Gateway у неінтерактивному режимі:

- `--gateway-auth token --gateway-token <token>` зберігає plaintext-токен.
- `--gateway-auth token --gateway-token-ref-env <name>` зберігає `gateway.auth.token` як env SecretRef.
- `--gateway-token` і `--gateway-token-ref-env` є взаємовиключними.
- `--gateway-token-ref-env` потребує непорожній env var у середовищі процесу початкового налаштування.
- З `--install-daemon`, коли автентифікація токеном потребує токена, токени Gateway, якими керує SecretRef, перевіряються, але не зберігаються як визначений plaintext у метаданих середовища сервісу supervisor.
- З `--install-daemon`, якщо режим токена потребує токена, а налаштований token SecretRef не визначено, початкове налаштування завершується з відмовою за замовчуванням і підказками щодо виправлення.
- З `--install-daemon`, якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не встановлено, початкове налаштування блокує встановлення, доки режим не буде явно задано.
- Локальне початкове налаштування записує `gateway.mode="local"` у конфігурацію. Якщо в пізнішому файлі конфігурації бракує `gateway.mode`, вважайте це пошкодженням конфігурації або неповним ручним редагуванням, а не допустимим скороченням для локального режиму.
- `--allow-unconfigured` — це окремий аварійний механізм runtime Gateway. Він не означає, що початкове налаштування може пропустити `gateway.mode`.

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

Стан локального Gateway у неінтерактивному режимі:

- Якщо ви не передасте `--skip-health`, початкове налаштування чекає на доступний локальний Gateway, перш ніж успішно завершитися.
- `--install-daemon` спочатку запускає керований шлях встановлення Gateway. Без нього у вас уже має працювати локальний Gateway, наприклад `openclaw gateway run`.
- Якщо в автоматизації вам потрібні лише записи конфігурації/робочого простору/bootstrap, використовуйте `--skip-health`.
- У native Windows `--install-daemon` спочатку пробує Scheduled Tasks і повертається до елемента входу в папці Startup для конкретного користувача, якщо створення завдання заборонено.

Поведінка інтерактивного початкового налаштування в режимі reference:

- Виберіть **Use secret reference**, коли з’явиться відповідний запит.
- Потім виберіть один із варіантів:
  - Змінна середовища
  - Налаштований secret provider (`file` або `exec`)
- Перед збереженням ref початкове налаштування виконує швидку попередню перевірку.
  - Якщо перевірка не пройде, початкове налаштування покаже помилку й дозволить повторити спробу.

Неінтерактивні варіанти endpoint для Z.AI:

Примітка: `--auth-choice zai-api-key` тепер автоматично визначає найкращий endpoint Z.AI для вашого ключа (надає перевагу загальному API з `zai/glm-5.1`).
Якщо вам потрібні саме endpoint GLM Coding Plan, виберіть `zai-coding-global` або `zai-coding-cn`.

```bash
# Вибір endpoint без запитів
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

Примітки щодо flow:

- `quickstart`: мінімум запитів, автоматично генерує токен Gateway.
- `manual`: повні запити для порту/прив’язки/автентифікації (псевдонім `advanced`).
- Коли вибір автентифікації передбачає preferred provider, початкове налаштування попередньо фільтрує
  засоби вибору моделі за замовчуванням і allowlist за цим провайдером. Для Volcengine і
  BytePlus це також відповідає варіантам coding-plan
  (`volcengine-plan/*`, `byteplus-plan/*`).
- Якщо фільтр preferred-provider поки що не дає жодних завантажених моделей, початкове налаштування
  повертається до нефільтрованого каталогу замість того, щоб залишати засіб вибору порожнім.
- На кроці вебпошуку деякі провайдери можуть запускати
  додаткові запити, специфічні для провайдера:
  - **Grok** може запропонувати необов’язкове налаштування `x_search` з тим самим `XAI_API_KEY`
    і вибором моделі `x_search`.
  - **Kimi** може запитати регіон API Moonshot (`api.moonshot.ai` чи
    `api.moonshot.cn`) і типову модель вебпошуку Kimi.
- Поведінка області DM під час локального початкового налаштування: [CLI Setup Reference](/uk/start/wizard-cli-reference#outputs-and-internals).
- Найшвидший перший чат: `openclaw dashboard` (Control UI, без налаштування каналів).
- Custom Provider: підключіть будь-який endpoint, сумісний з OpenAI або Anthropic,
  включно з хостованими провайдерами, яких немає в списку. Використовуйте Unknown для автовизначення.

## Типові наступні команди

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` не означає неінтерактивний режим. Для скриптів використовуйте `--non-interactive`.
</Note>
