---
read_when:
    - Вам потрібне покрокове налаштування Gateway, робочого простору, автентифікації, каналів і Skills
summary: Довідка CLI для `openclaw onboard` (інтерактивний онбординг)
title: Онбординг
x-i18n:
    generated_at: "2026-04-23T20:48:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: ab92ff5651b7db18850558cbb47527bf0486f278c8aed0929eaeff0017b6c280
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Інтерактивний онбординг для налаштування локального або віддаленого Gateway.

## Пов’язані посібники

- Центр CLI-онбордингу: [Onboarding (CLI)](/uk/start/wizard)
- Огляд онбордингу: [Onboarding Overview](/uk/start/onboarding-overview)
- Довідка CLI-онбордингу: [CLI Setup Reference](/uk/start/wizard-cli-reference)
- Автоматизація CLI: [CLI Automation](/uk/start/wizard-cli-automation)
- Онбординг macOS: [Onboarding (macOS App)](/uk/start/onboarding)

## Приклади

```bash
openclaw onboard
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

Для цілей `ws://` у приватній мережі без шифрування (лише для довірених мереж) установіть
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` у змінних середовища процесу онбордингу.

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

`--custom-api-key` необов’язковий у неінтерактивному режимі. Якщо його не вказано, онбординг перевіряє `CUSTOM_API_KEY`.

LM Studio також підтримує специфічний для provider-а прапорець ключа в неінтерактивному режимі:

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

`--custom-base-url` типово має значення `http://127.0.0.1:11434`. `--custom-model-id` необов’язковий; якщо його не вказано, онбординг використовує типові значення, запропоновані Ollama. Cloud model id, як-от `kimi-k2.5:cloud`, тут також працюють.

Зберігайте ключі provider-а як ref, а не як відкритий текст:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

З `--secret-input-mode ref` онбординг записує refs, прив’язані до змінних середовища, замість значень ключів відкритим текстом.
Для provider-ів на основі auth-profile це записує записи `keyRef`; для custom provider-ів це записує `models.providers.<id>.apiKey` як env ref (наприклад `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Контракт неінтерактивного режиму `ref`:

- Установіть змінну середовища provider-а в середовищі процесу онбордингу (наприклад, `OPENAI_API_KEY`).
- Не передавайте вбудовані прапорці ключів (наприклад, `--openai-api-key`), якщо цю змінну середовища також не встановлено.
- Якщо передано вбудований прапорець ключа без обов’язкової змінної середовища, онбординг одразу завершується з помилкою та підказкою.

Параметри токена Gateway у неінтерактивному режимі:

- `--gateway-auth token --gateway-token <token>` зберігає токен у відкритому тексті.
- `--gateway-auth token --gateway-token-ref-env <name>` зберігає `gateway.auth.token` як env SecretRef.
- `--gateway-token` і `--gateway-token-ref-env` взаємовиключні.
- `--gateway-token-ref-env` вимагає непорожньої змінної середовища в середовищі процесу онбордингу.
- З `--install-daemon`, коли автентифікація токеном вимагає токен, токени Gateway, керовані через SecretRef, перевіряються, але не зберігаються як розв’язані значення відкритим текстом у метаданих середовища сервісу supervisor.
- З `--install-daemon`, якщо режим токена вимагає токен, а налаштований SecretRef токена не розв’язується, онбординг завершується в закритий спосіб із підказками щодо виправлення.
- З `--install-daemon`, якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не встановлено, онбординг блокує встановлення, доки режим не буде явно задано.
- Локальний онбординг записує `gateway.mode="local"` у конфігурацію. Якщо в подальшому файлі конфігурації `gateway.mode` відсутній, сприймайте це як пошкодження конфігурації або неповне ручне редагування, а не як дійсне скорочення для локального режиму.
- `--allow-unconfigured` — окремий аварійний механізм runtime Gateway. Він не означає, що онбординг може пропустити `gateway.mode`.

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

Стан здоров’я локального Gateway у неінтерактивному режимі:

- Якщо не передано `--skip-health`, онбординг чекає доступного локального gateway перед успішним завершенням.
- `--install-daemon` спочатку запускає керований шлях встановлення gateway. Без нього у вас уже має працювати локальний gateway, наприклад через `openclaw gateway run`.
- Якщо вам потрібні лише записи конфігурації/робочого простору/bootstrap в автоматизації, використовуйте `--skip-health`.
- У native Windows `--install-daemon` спочатку намагається використати Scheduled Tasks і переходить до елемента автозапуску в Startup-folder для поточного користувача, якщо створення завдання заборонено.

Поведінка інтерактивного онбордингу в режимі reference:

- Коли з’явиться запит, виберіть **Use secret reference**.
- Потім виберіть один із варіантів:
  - Environment variable
  - Configured secret provider (`file` або `exec`)
- Перед збереженням ref онбординг виконує швидку попередню перевірку.
  - Якщо перевірка не пройде, онбординг покаже помилку й дозволить повторити спробу.

Неінтерактивний вибір endpoint для Z.AI:

Примітка: `--auth-choice zai-api-key` тепер автоматично визначає найкращий endpoint Z.AI для вашого ключа (надає перевагу загальному API з `zai/glm-5.1`).
Якщо вам потрібні саме endpoints GLM Coding Plan, виберіть `zai-coding-global` або `zai-coding-cn`.

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

- `quickstart`: мінімум запитань, автоматично генерує токен gateway.
- `manual`: повний набір запитань для port/bind/auth (псевдонім `advanced`).
- Коли вибір автентифікації передбачає бажаний provider, онбординг попередньо фільтрує
  вибір типових моделей і allowlist до цього provider-а. Для Volcengine і
  BytePlus це також охоплює варіанти coding-plan
  (`volcengine-plan/*`, `byteplus-plan/*`).
- Якщо фільтр бажаного provider-а ще не дає жодної завантаженої моделі,
  онбординг повертається до нефільтрованого каталогу замість того, щоб залишити вибір порожнім.
- На кроці web-пошуку деякі providers можуть викликати додаткові запити, специфічні для provider-а:
  - **Grok** може запропонувати необов’язкове налаштування `x_search` із тим самим `XAI_API_KEY`
    і вибором моделі `x_search`.
  - **Kimi** може запитати регіон API Moonshot (`api.moonshot.ai` чи
    `api.moonshot.cn`) і типову модель web-пошуку Kimi.
- Поведінка області DM під час локального онбордингу: [CLI Setup Reference](/uk/start/wizard-cli-reference#outputs-and-internals).
- Найшвидший перший чат: `openclaw dashboard` (Control UI, без налаштування каналів).
- Custom Provider: підключайте будь-який endpoint, сумісний з OpenAI або Anthropic,
  включно з хостованими provider-ами, яких немає у списку. Використовуйте Unknown для автовизначення.

## Поширені наступні команди

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` не означає неінтерактивний режим. Для скриптів використовуйте `--non-interactive`.
</Note>
