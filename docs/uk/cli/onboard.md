---
read_when:
    - Ви хочете покрокове налаштування Gateway, робочого простору, автентифікації, каналів і Skills
summary: Довідник CLI для `openclaw onboard` (інтерактивне початкове налаштування)
title: Початкове налаштування
x-i18n:
    generated_at: "2026-04-27T04:37:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 98985c119f64ba41ed1a74fbb0bf1feb78b3c5daa4844e66f3aa1ae73ef6d0f5
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Інтерактивне початкове налаштування для локального або віддаленого налаштування Gateway.

## Пов’язані посібники

<CardGroup cols={2}>
  <Card title="Центр CLI для початкового налаштування" href="/uk/start/wizard" icon="rocket">
    Покроковий огляд інтерактивного процесу в CLI.
  </Card>
  <Card title="Огляд початкового налаштування" href="/uk/start/onboarding-overview" icon="map">
    Як організовано початкове налаштування OpenClaw.
  </Card>
  <Card title="Довідник налаштування CLI" href="/uk/start/wizard-cli-reference" icon="book">
    Вивід, внутрішня логіка та поведінка на кожному кроці.
  </Card>
  <Card title="Автоматизація CLI" href="/uk/start/wizard-cli-automation" icon="terminal">
    Неінтерактивні прапорці та налаштування через сценарії.
  </Card>
  <Card title="Початкове налаштування застосунку macOS" href="/uk/start/onboarding" icon="apple">
    Процес початкового налаштування для застосунку macOS у рядку меню.
  </Card>
</CardGroup>

## Приклади

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--modern` запускає попередній перегляд розмовного початкового налаштування Crestodian. Без
`--modern` команда `openclaw onboard` використовує класичний процес початкового налаштування.

Для цілей `ws://` у приватній мережі без шифрування (лише для довірених мереж) установіть
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` у середовищі процесу початкового налаштування.
Еквівалента `openclaw.json` для цього аварійного обходу клієнтського транспорту
немає.

Неінтерактивний власний провайдер:

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

`--custom-base-url` типово має значення `http://127.0.0.1:11434`. `--custom-model-id` є необов’язковим; якщо його не вказано, початкове налаштування використовує рекомендовані типові значення Ollama. Ідентифікатори хмарних моделей, як-от `kimi-k2.5:cloud`, також тут працюють.

Зберігайте ключі провайдера як посилання, а не як відкритий текст:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

З `--secret-input-mode ref` початкове налаштування записує посилання, підкріплені змінними середовища, замість значень ключів у відкритому тексті.
Для провайдерів на основі auth-profile це записує записи `keyRef`; для власних провайдерів це записує `models.providers.<id>.apiKey` як посилання env (наприклад, `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Контракт неінтерактивного режиму `ref`:

- Установіть змінну середовища провайдера в середовищі процесу початкового налаштування (наприклад, `OPENAI_API_KEY`).
- Не передавайте вбудовані прапорці ключів (наприклад, `--openai-api-key`), якщо цю змінну середовища також не встановлено.
- Якщо вбудований прапорець ключа передано без обов’язкової змінної середовища, початкове налаштування негайно завершується з помилкою та підказкою.

Параметри токена Gateway у неінтерактивному режимі:

- `--gateway-auth token --gateway-token <token>` зберігає токен у відкритому тексті.
- `--gateway-auth token --gateway-token-ref-env <name>` зберігає `gateway.auth.token` як env SecretRef.
- `--gateway-token` і `--gateway-token-ref-env` є взаємовиключними.
- `--gateway-token-ref-env` потребує непорожньої змінної середовища в середовищі процесу початкового налаштування.
- З `--install-daemon`, коли автентифікація токеном потребує токен, токени Gateway під керуванням SecretRef проходять перевірку, але не зберігаються як розв’язаний відкритий текст у метаданих середовища служби супервізора.
- З `--install-daemon`, якщо режим токена потребує токен, а налаштований SecretRef токена не розв’язується, початкове налаштування завершується за принципом fail closed з інструкціями щодо усунення проблеми.
- З `--install-daemon`, якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, але `gateway.auth.mode` не задано, початкове налаштування блокує інсталяцію, доки режим не буде явно встановлено.
- Локальне початкове налаштування записує `gateway.mode="local"` у конфігурацію. Якщо в пізнішому файлі конфігурації відсутній `gateway.mode`, вважайте це пошкодженням конфігурації або неповним ручним редагуванням, а не коректним скороченням для локального режиму.
- `--allow-unconfigured` — це окремий аварійний обхід для середовища виконання Gateway. Це не означає, що під час початкового налаштування можна пропустити `gateway.mode`.

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

- Якщо не передано `--skip-health`, початкове налаштування чекає, доки локальний Gateway стане доступним, перш ніж успішно завершитися.
- `--install-daemon` спочатку запускає керований шлях інсталяції Gateway. Без нього у вас уже має працювати локальний Gateway, наприклад `openclaw gateway run`.
- Якщо в автоматизації вам потрібні лише записи конфігурації/робочого простору/bootstrap, використовуйте `--skip-health`.
- Якщо ви самі керуєте файлами робочого простору, передайте `--skip-bootstrap`, щоб установити `agents.defaults.skipBootstrap: true` і пропустити створення `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` і `BOOTSTRAP.md`.
- У нативному Windows `--install-daemon` спочатку намагається використати Scheduled Tasks і переходить до елемента входу в систему в папці Startup для поточного користувача, якщо створення завдання заборонено.

Поведінка інтерактивного початкового налаштування в режимі посилань:

- Коли з’явиться запит, виберіть **Use secret reference**.
- Потім виберіть один із варіантів:
  - Змінна середовища
  - Налаштований провайдер секретів (`file` або `exec`)
- Початкове налаштування виконує швидку попередню перевірку перед збереженням посилання.
  - Якщо перевірка не пройде, початкове налаштування покаже помилку й дозволить повторити спробу.

### Варіанти кінцевих точок Z.AI у неінтерактивному режимі

<Note>
`--auth-choice zai-api-key` автоматично визначає найкращу кінцеву точку Z.AI для вашого ключа (надає перевагу загальному API з `zai/glm-5.1`). Якщо вам потрібні саме кінцеві точки GLM Coding Plan, виберіть `zai-coding-global` або `zai-coding-cn`.
</Note>

```bash
# Вибір кінцевої точки без запитів
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Інші варіанти кінцевих точок Z.AI:
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

## Примітки щодо процесу

<AccordionGroup>
  <Accordion title="Типи процесів">
    - `quickstart`: мінімум запитів, автоматично генерує токен Gateway.
    - `manual`: повні запити для порту, bind і автентифікації (псевдонім для `advanced`).
  </Accordion>
  <Accordion title="Попередня фільтрація провайдерів">
    Коли вибір автентифікації передбачає бажаного провайдера, початкове налаштування попередньо фільтрує засоби вибору моделі за замовчуванням і allowlist до цього провайдера. Для Volcengine і BytePlus це також охоплює варіанти coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Якщо фільтр бажаного провайдера ще не дає жодної завантаженої моделі, початкове налаштування повертається до нефільтрованого каталогу замість того, щоб залишати засіб вибору порожнім.

  </Accordion>
  <Accordion title="Додаткові запити для вебпошуку">
    Деякі провайдери вебпошуку запускають додаткові запити, специфічні для провайдера:

    - **Grok** може запропонувати необов’язкове налаштування `x_search` з тим самим `XAI_API_KEY` і вибором моделі `x_search`.
    - **Kimi** може запитати регіон Moonshot API (`api.moonshot.ai` чи `api.moonshot.cn`) і модель вебпошуку Kimi за замовчуванням.

  </Accordion>
  <Accordion title="Інші особливості">
    - Поведінка області DM під час локального початкового налаштування: [Довідник налаштування CLI](/uk/start/wizard-cli-reference#outputs-and-internals).
    - Найшвидший спосіб почати перший чат: `openclaw dashboard` (Control UI, без налаштування каналів).
    - Власний провайдер: підключення до будь-якої сумісної кінцевої точки OpenAI або Anthropic, зокрема розміщених провайдерів, яких немає в списку. Використовуйте Unknown для автоматичного визначення.
  </Accordion>
</AccordionGroup>

## Поширені команди після налаштування

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` не означає неінтерактивний режим. Для сценаріїв використовуйте `--non-interactive`.
</Note>
