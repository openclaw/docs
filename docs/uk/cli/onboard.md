---
read_when:
    - Ви хочете покрокове налаштування для Gateway, робочого простору, автентифікації, каналів і Skills
summary: Довідник CLI для `openclaw onboard` (інтерактивне налаштування)
title: Налаштування
x-i18n:
    generated_at: "2026-04-27T08:07:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 041063bce6616ed32225cb411f385dcbfd750c0bb2779ec17bc58e1aa9ada254
    source_path: cli/onboard.md
    workflow: 15
---

# `openclaw onboard`

Інтерактивне налаштування для локальної або віддаленої конфігурації Gateway.

## Пов’язані посібники

<CardGroup cols={2}>
  <Card title="Центр налаштування CLI" href="/uk/start/wizard" icon="rocket">
    Покроковий огляд інтерактивного процесу CLI.
  </Card>
  <Card title="Огляд налаштування" href="/uk/start/onboarding-overview" icon="map">
    Як поєднуються етапи налаштування OpenClaw.
  </Card>
  <Card title="Довідник із налаштування CLI" href="/uk/start/wizard-cli-reference" icon="book">
    Виводи, внутрішня логіка та поведінка на кожному кроці.
  </Card>
  <Card title="Автоматизація CLI" href="/uk/start/wizard-cli-automation" icon="terminal">
    Неінтерактивні прапорці та сценарії налаштування.
  </Card>
  <Card title="Налаштування програми macOS" href="/uk/start/onboarding" icon="apple">
    Процес налаштування для програми macOS у рядку меню.
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

`--flow import` використовує провайдери міграції, що належать Plugin, як-от Hermes. Він запускається лише для нової конфігурації OpenClaw; якщо вже існують файли конфігурації, облікові дані, сесії або файли пам’яті/ідентичності робочого простору, перед імпортом виконайте скидання або виберіть нове налаштування.

`--modern` запускає попередню версію розмовного налаштування Crestodian. Без
`--modern` команда `openclaw onboard` використовує класичний процес налаштування.

Для цілей `ws://` у приватній мережі без шифрування (лише для довірених мереж) установіть
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` у середовищі процесу налаштування.
Еквівалента в `openclaw.json` для цього аварійного клієнтського
обходу транспортного захисту немає.

Неінтерактивний користувацький провайдер:

```bash
openclaw onboard --non-interactive \
  --auth-choice custom-api-key \
  --custom-base-url "https://llm.example.com/v1" \
  --custom-model-id "foo-large" \
  --custom-api-key "$CUSTOM_API_KEY" \
  --secret-input-mode plaintext \
  --custom-compatibility openai
```

`--custom-api-key` є необов’язковим у неінтерактивному режимі. Якщо його не вказано, налаштування перевіряє `CUSTOM_API_KEY`.

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

`--custom-base-url` типово має значення `http://127.0.0.1:11434`. `--custom-model-id` є необов’язковим; якщо його не вказано, налаштування використовує рекомендовані типові значення Ollama. Ідентифікатори хмарних моделей, як-от `kimi-k2.5:cloud`, тут також працюють.

Зберігайте ключі провайдера як посилання, а не у відкритому вигляді:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

З `--secret-input-mode ref` налаштування записує посилання, що використовують змінні середовища, замість значень ключів у відкритому вигляді.
Для провайдерів на основі auth-profile це записує записи `keyRef`; для користувацьких провайдерів це записує `models.providers.<id>.apiKey` як env ref (наприклад, `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Умови неінтерактивного режиму `ref`:

- Установіть змінну середовища провайдера в середовищі процесу налаштування (наприклад, `OPENAI_API_KEY`).
- Не передавайте вбудовані прапорці ключів (наприклад, `--openai-api-key`), якщо цю змінну середовища також не встановлено.
- Якщо вбудований прапорець ключа передано без потрібної змінної середовища, налаштування негайно завершується з підказками.

Параметри токена Gateway у неінтерактивному режимі:

- `--gateway-auth token --gateway-token <token>` зберігає токен у відкритому вигляді.
- `--gateway-auth token --gateway-token-ref-env <name>` зберігає `gateway.auth.token` як env SecretRef.
- `--gateway-token` і `--gateway-token-ref-env` є взаємовиключними.
- `--gateway-token-ref-env` потребує непорожньої змінної середовища в середовищі процесу налаштування.
- Із `--install-daemon`, коли автентифікація токеном вимагає токен, токени Gateway під керуванням SecretRef перевіряються, але не зберігаються як розв’язаний відкритий текст у метаданих середовища служби supervisor.
- Із `--install-daemon`, якщо режим токена вимагає токен, а налаштований токен SecretRef не розв’язується, налаштування блокує виконання з підказками щодо усунення проблеми.
- Із `--install-daemon`, якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, але `gateway.auth.mode` не задано, налаштування блокує встановлення, доки режим не буде вказано явно.
- Локальне налаштування записує `gateway.mode="local"` у конфігурацію. Якщо в пізнішому файлі конфігурації бракує `gateway.mode`, вважайте це пошкодженням конфігурації або неповним ручним редагуванням, а не коректним скороченням для локального режиму.
- `--allow-unconfigured` — це окремий аварійний механізм середовища виконання Gateway. Це не означає, що під час налаштування можна пропустити `gateway.mode`.

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

- Якщо ви не передасте `--skip-health`, налаштування чекатиме доступності локального Gateway перед успішним завершенням.
- `--install-daemon` спочатку запускає шлях установленого керованого Gateway. Без нього локальний Gateway уже має працювати, наприклад через `openclaw gateway run`.
- Якщо в автоматизації вам потрібні лише записи конфігурації/робочого простору/bootstrap, використовуйте `--skip-health`.
- Якщо ви самостійно керуєте файлами робочого простору, передайте `--skip-bootstrap`, щоб установити `agents.defaults.skipBootstrap: true` і пропустити створення `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` і `BOOTSTRAP.md`.
- У рідному Windows `--install-daemon` спочатку пробує Scheduled Tasks, а якщо створення завдання заборонено — переходить до елемента входу в систему для поточного користувача в папці Startup.

Поведінка інтерактивного налаштування з режимом посилань:

- Коли з’явиться запит, виберіть **Use secret reference**.
- Потім виберіть один із варіантів:
  - Змінна середовища
  - Налаштований провайдер секретів (`file` або `exec`)
- Перед збереженням посилання налаштування виконує швидку попередню перевірку.
  - Якщо перевірка не проходить, налаштування покаже помилку й дозволить повторити спробу.

### Неінтерактивні варіанти кінцевих точок Z.AI

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
    - `quickstart`: мінімум запитів, автоматично створює токен Gateway.
    - `manual`: повні запити для порту, прив’язки та автентифікації (псевдонім для `advanced`).
    - `import`: запускає виявлений провайдер міграції, показує попередній план, а потім застосовує його після підтвердження.
  </Accordion>
  <Accordion title="Попередня фільтрація провайдерів">
    Коли варіант автентифікації передбачає бажаного провайдера, налаштування попередньо фільтрує засоби вибору типової моделі та списку дозволених моделей до цього провайдера. Для Volcengine і BytePlus це також охоплює варіанти coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Якщо фільтр бажаного провайдера ще не дає жодної завантаженої моделі, налаштування повертається до нефільтрованого каталогу, а не залишає засіб вибору порожнім.

  </Accordion>
  <Accordion title="Додаткові запити для вебпошуку">
    Деякі провайдери вебпошуку запускають додаткові запити, специфічні для провайдера:

    - **Grok** може запропонувати необов’язкове налаштування `x_search` з тим самим `XAI_API_KEY` і вибором моделі `x_search`.
    - **Kimi** може запитати регіон Moonshot API (`api.moonshot.ai` чи `api.moonshot.cn`) і типову модель вебпошуку Kimi.

  </Accordion>
  <Accordion title="Інша поведінка">
    - Поведінка області DM під час локального налаштування: [Довідник із налаштування CLI](/uk/start/wizard-cli-reference#outputs-and-internals).
    - Найшвидший шлях до першого чату: `openclaw dashboard` (Control UI, без налаштування каналу).
    - Користувацький провайдер: підключайте будь-яку кінцеву точку, сумісну з OpenAI або Anthropic, включно з розміщеними провайдерами, яких немає в списку. Використовуйте Unknown для автоматичного визначення.
    - Якщо виявлено стан Hermes, налаштування запропонує процес міграції. Використовуйте [Migrate](/uk/cli/migrate) для планів dry-run, режиму перезапису, звітів і точних відповідностей.
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
