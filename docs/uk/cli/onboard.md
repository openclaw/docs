---
read_when:
    - Вам потрібне покрокове налаштування Gateway, робочого простору, автентифікації, каналів і Skills
summary: Довідка CLI для `openclaw onboard` (інтерактивне налаштування)
title: Початок роботи
x-i18n:
    generated_at: "2026-04-28T11:07:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 583310458b2e2bc8ddc1513112c960520d972716be0c33e4177d0db30e896504
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Інтерактивне початкове налаштування для локального або віддаленого налаштування Gateway.

## Пов’язані посібники

<CardGroup cols={2}>
  <Card title="Центр початкового налаштування CLI" href="/uk/start/wizard" icon="rocket">
    Покроковий опис інтерактивного потоку CLI.
  </Card>
  <Card title="Огляд початкового налаштування" href="/uk/start/onboarding-overview" icon="map">
    Як початкове налаштування OpenClaw поєднується в єдину систему.
  </Card>
  <Card title="Довідник налаштування CLI" href="/uk/start/wizard-cli-reference" icon="book">
    Вивід, внутрішня робота та поведінка на кожному кроці.
  </Card>
  <Card title="Автоматизація CLI" href="/uk/start/wizard-cli-automation" icon="terminal">
    Неінтерактивні прапорці та сценарні налаштування.
  </Card>
  <Card title="Початкове налаштування застосунку macOS" href="/uk/start/onboarding" icon="apple">
    Потік початкового налаштування для застосунку панелі меню macOS.
  </Card>
</CardGroup>

## Приклади

```bash
openclaw onboard
openclaw onboard --modern
openclaw onboard --flow quickstart
openclaw onboard --flow manual
openclaw onboard --flow import
openclaw onboard --import-from hermes --import-source ~/.hermes
openclaw onboard --skip-bootstrap
openclaw onboard --mode remote --remote-url wss://gateway-host:18789
```

`--flow import` використовує постачальників міграції, що належать plugin, як-от Hermes. Він запускається лише для свіжого налаштування OpenClaw; якщо наявні конфігурація, облікові дані, сеанси або файли пам’яті/ідентичності робочого простору, скиньте їх або виберіть свіже налаштування перед імпортом.

`--modern` запускає попередню версію розмовного початкового налаштування Crestodian. Без
`--modern`, `openclaw onboard` зберігає класичний потік початкового налаштування.

Для plaintext цілей `ws://` у приватній мережі (лише довірені мережі) задайте
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` у середовищі процесу початкового налаштування.
Для цього клієнтського транспортного аварійного обходу немає еквівалента
`openclaw.json`.

Неінтерактивний власний постачальник:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai \
  --custom-image-input
```

`--custom-api-key` є необов’язковим у неінтерактивному режимі. Якщо його пропущено, початкове налаштування перевіряє `CUSTOM_API_KEY`.
OpenClaw автоматично позначає поширені ідентифікатори моделей із підтримкою зору як придатні для зображень. Передайте `--custom-image-input` для невідомих власних ідентифікаторів моделей із підтримкою зору або `--custom-text-input`, щоб примусово встановити метадані лише для тексту.

LM Studio також підтримує прапорець ключа, специфічний для постачальника, у неінтерактивному режимі:

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

`--custom-base-url` за замовчуванням має значення `http://127.0.0.1:11434`. `--custom-model-id` необов’язковий; якщо його пропущено, початкове налаштування використовує запропоновані Ollama значення за замовчуванням. Тут також працюють ідентифікатори хмарних моделей, як-от `kimi-k2.5:cloud`.

Зберігайте ключі постачальника як посилання замість plaintext:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

З `--secret-input-mode ref` початкове налаштування записує посилання на основі змінних середовища замість plaintext значень ключів.
Для постачальників на основі профілю автентифікації це записує записи `keyRef`; для власних постачальників це записує `models.providers.<id>.apiKey` як посилання на змінну середовища (наприклад `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Контракт неінтерактивного режиму `ref`:

- Задайте змінну середовища постачальника в середовищі процесу початкового налаштування (наприклад `OPENAI_API_KEY`).
- Не передавайте вбудовані прапорці ключів (наприклад `--openai-api-key`), якщо ця змінна середовища також не задана.
- Якщо вбудований прапорець ключа передано без потрібної змінної середовища, початкове налаштування швидко завершується помилкою з інструкціями.

Параметри токена Gateway у неінтерактивному режимі:

- `--gateway-auth token --gateway-token <token>` зберігає plaintext токен.
- `--gateway-auth token --gateway-token-ref-env <name>` зберігає `gateway.auth.token` як SecretRef зі змінної середовища.
- `--gateway-token` і `--gateway-token-ref-env` взаємовиключні.
- `--gateway-token-ref-env` потребує непорожньої змінної середовища в середовищі процесу початкового налаштування.
- З `--install-daemon`, коли автентифікація токеном потребує токена, керовані SecretRef токени Gateway перевіряються, але не зберігаються як розгорнутий plaintext у метаданих середовища служби supervisor.
- З `--install-daemon`, якщо режим токена потребує токена, а налаштований SecretRef токена не розгорнуто, початкове налаштування завершується закритою помилкою з інструкціями з виправлення.
- З `--install-daemon`, якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, початкове налаштування блокує встановлення, доки режим не буде задано явно.
- Локальне початкове налаштування записує `gateway.mode="local"` у конфігурацію. Якщо в пізнішому файлі конфігурації відсутній `gateway.mode`, вважайте це пошкодженням конфігурації або неповним ручним редагуванням, а не дійсним скороченням локального режиму.
- `--allow-unconfigured` — це окремий аварійний вихід середовища виконання Gateway. Він не означає, що початкове налаштування може пропустити `gateway.mode`.

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

- Якщо ви не передаєте `--skip-health`, початкове налаштування очікує доступного локального Gateway перед успішним завершенням.
- `--install-daemon` спочатку запускає керований шлях установлення Gateway. Без нього у вас уже має працювати локальний Gateway, наприклад `openclaw gateway run`.
- Якщо в автоматизації вам потрібні лише записи конфігурації/робочого простору/bootstrap, використовуйте `--skip-health`.
- Якщо ви керуєте файлами робочого простору самостійно, передайте `--skip-bootstrap`, щоб установити `agents.defaults.skipBootstrap: true` і пропустити створення `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` і `BOOTSTRAP.md`.
- У native Windows `--install-daemon` спочатку пробує Scheduled Tasks і повертається до login item у папці Startup для поточного користувача, якщо створення завдання заборонено.

Поведінка інтерактивного початкового налаштування в режимі посилань:

- Виберіть **Використати посилання на секрет**, коли з’явиться запит.
- Потім виберіть один із варіантів:
  - Змінна середовища
  - Налаштований постачальник секретів (`file` або `exec`)
- Початкове налаштування виконує швидку попередню перевірку перед збереженням посилання.
  - Якщо перевірка не вдається, початкове налаштування показує помилку та дозволяє повторити спробу.

### Вибір endpoints Z.AI у неінтерактивному режимі

<Note>
`--auth-choice zai-api-key` автоматично визначає найкращий endpoint Z.AI для вашого ключа (надає перевагу загальному API з `zai/glm-5.1`). Якщо вам спеціально потрібні endpoints GLM Coding Plan, виберіть `zai-coding-global` або `zai-coding-cn`.
</Note>

```bash
# Promptless endpoint selection
openclaw onboard --non-interactive \
  --auth-choice zai-coding-global \
  --zai-api-key "$ZAI_API_KEY"

# Other Z.AI endpoint choices:
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

## Примітки щодо потоку

<AccordionGroup>
  <Accordion title="Типи потоків">
    - `quickstart`: мінімальні запити, автоматично генерує токен Gateway.
    - `manual`: повні запити для порту, прив’язки та автентифікації (псевдонім `advanced`).
    - `import`: запускає виявленого постачальника міграції, показує попередній план, а потім застосовує його після підтвердження.

  </Accordion>
  <Accordion title="Попередня фільтрація постачальників">
    Коли вибір автентифікації передбачає бажаного постачальника, початкове налаштування попередньо фільтрує засоби вибору моделі за замовчуванням і allowlist до цього постачальника. Для Volcengine і BytePlus це також зіставляє варіанти coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Якщо фільтр бажаного постачальника ще не повертає завантажених моделей, початкове налаштування повертається до нефільтрованого каталогу замість того, щоб залишати засіб вибору порожнім.

  </Accordion>
  <Accordion title="Подальші запити вебпошуку">
    Деякі постачальники вебпошуку запускають подальші запити, специфічні для постачальника:

    - **Grok** може запропонувати необов’язкове налаштування `x_search` з тим самим `XAI_API_KEY` і вибором моделі `x_search`.
    - **Kimi** може запитати регіон Moonshot API (`api.moonshot.ai` або `api.moonshot.cn`) і модель вебпошуку Kimi за замовчуванням.

  </Accordion>
  <Accordion title="Інша поведінка">
    - Поведінка області DM у локальному початковому налаштуванні: [Довідник налаштування CLI](/uk/start/wizard-cli-reference#outputs-and-internals).
    - Найшвидший перший чат: `openclaw dashboard` (Control UI, без налаштування каналу).
    - Власний постачальник: під’єднайте будь-який endpoint, сумісний з OpenAI або Anthropic, включно з розміщеними постачальниками, яких немає у списку. Використовуйте Unknown для автоматичного виявлення.
    - Якщо виявлено стан Hermes, початкове налаштування пропонує потік міграції. Використовуйте [Міграція](/uk/cli/migrate) для планів dry-run, режиму перезапису, звітів і точних зіставлень.

  </Accordion>
</AccordionGroup>

## Поширені подальші команди

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` не означає неінтерактивний режим. Використовуйте `--non-interactive` для скриптів.
</Note>
