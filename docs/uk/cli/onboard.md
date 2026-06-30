---
read_when:
    - Вам потрібне покрокове налаштування Gateway, робочого простору, автентифікації, каналів і Skills
summary: Довідник CLI для `openclaw onboard` (інтерактивне первинне налаштування)
title: Початок роботи
x-i18n:
    generated_at: "2026-06-30T22:32:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e0a3c2dea3f8116bb3282d5fb160cf34d9a6f0eefcc072abcff2287d5801184
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Повне покрокове введення в роботу для налаштування локального або віддаленого Gateway. Використовуйте це, коли хочете, щоб OpenClaw провів вас через автентифікацію моделі, робочий простір, Gateway, канали, Skills і перевірку стану в одному процесі.

## Пов’язані посібники

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/uk/start/wizard" icon="rocket">
    Покроковий опис інтерактивного процесу CLI.
  </Card>
  <Card title="Onboarding overview" href="/uk/start/onboarding-overview" icon="map">
    Як складові введення в роботу OpenClaw пов’язані між собою.
  </Card>
  <Card title="CLI setup reference" href="/uk/start/wizard-cli-reference" icon="book">
    Вивід, внутрішня логіка та поведінка кожного кроку.
  </Card>
  <Card title="CLI automation" href="/uk/start/wizard-cli-automation" icon="terminal">
    Неінтерактивні прапорці та сценарні налаштування.
  </Card>
  <Card title="macOS app onboarding" href="/uk/start/onboarding" icon="apple">
    Процес введення в роботу для застосунку macOS у рядку меню.
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

`--flow import` використовує провайдери міграції, якими володіють плагіни, наприклад Hermes. Він запускається лише для нового налаштування OpenClaw; якщо вже наявні конфігурація, облікові дані, сесії або файли пам’яті/ідентичності робочого простору, перед імпортом скиньте налаштування або виберіть нове налаштування.

`--modern` запускає попередній перегляд розмовного введення в роботу Crestodian. Без
`--modern` команда `openclaw onboard` зберігає класичний процес введення в роботу.

У новій інсталяції, де активний файл конфігурації відсутній або не має заданих
налаштувань (порожній або лише з метаданими), проста команда `openclaw` також запускає класичний
процес введення в роботу. Щойно файл конфігурації має задані налаштування, проста команда `openclaw`
відкриває натомість Crestodian.

Звичайний текстовий `ws://` приймається для loopback, приватних IP-літералів, `.local` і
URL-адрес Gateway Tailnet `*.ts.net`. Для інших довірених імен приватного DNS установіть
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` у середовищі процесу введення в роботу.

## Локаль

Інтерактивне введення в роботу використовує локаль майстра CLI для фіксованого тексту налаштування. Порядок
визначення такий:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Резервна англійська

Підтримувані локалі майстра: `en`, `zh-CN` і `zh-TW`. Значення локалі можуть використовувати
підкреслення або форми з POSIX-суфіксом, як-от `zh_CN.UTF-8`. Назви продуктів, назви команд,
ключі конфігурації, URL-адреси, ідентифікатори провайдерів, ідентифікатори моделей і мітки плагінів/каналів
залишаються буквальними.

Приклад:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Неінтерактивний користувацький провайдер:

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

`--custom-api-key` необов’язковий у неінтерактивному режимі. Якщо його пропущено, введення в роботу перевіряє `CUSTOM_API_KEY`.
OpenClaw автоматично позначає поширені ідентифікатори моделей зору як такі, що підтримують зображення. Передайте `--custom-image-input` для невідомих користувацьких ідентифікаторів моделей зору або `--custom-text-input`, щоб примусово встановити метадані лише для тексту.
Використовуйте `--custom-compatibility openai-responses` для сумісних з OpenAI кінцевих точок, які підтримують `/v1/responses`, але не `/v1/chat/completions`.

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

`--custom-base-url` за замовчуванням має значення `http://127.0.0.1:11434`. `--custom-model-id` необов’язковий; якщо його пропущено, введення в роботу використовує запропоновані Ollama типові значення. Ідентифікатори хмарних моделей, як-от `kimi-k2.5:cloud`, також працюють тут.

Зберігайте ключі провайдера як посилання замість звичайного тексту:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

З `--secret-input-mode ref` введення в роботу записує посилання на основі змінних середовища замість значень ключів звичайним текстом.
Для провайдерів на основі профілю автентифікації це записує записи `keyRef`; для користувацьких провайдерів це записує `models.providers.<id>.apiKey` як посилання на змінну середовища (наприклад `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Контракт неінтерактивного режиму `ref`:

- Установіть змінну середовища провайдера в середовищі процесу введення в роботу (наприклад `OPENAI_API_KEY`).
- Не передавайте вбудовані прапорці ключів (наприклад `--openai-api-key`), якщо ця змінна середовища також не встановлена.
- Якщо вбудований прапорець ключа передано без потрібної змінної середовища, введення в роботу швидко завершується помилкою з підказками.

Параметри токена Gateway у неінтерактивному режимі:

- `--gateway-auth token --gateway-token <token>` зберігає токен звичайним текстом.
- `--gateway-auth token --gateway-token-ref-env <name>` зберігає `gateway.auth.token` як env SecretRef.
- `--gateway-token` і `--gateway-token-ref-env` взаємовиключні.
- `--gateway-token-ref-env` потребує непорожньої змінної середовища в середовищі процесу введення в роботу.
- З `--install-daemon`, коли автентифікація токеном потребує токен, токени Gateway, керовані SecretRef, перевіряються, але не зберігаються як розв’язаний звичайний текст у метаданих середовища служби супервізора.
- З `--install-daemon`, якщо режим токена потребує токен, а налаштований SecretRef токена не розв’язується, введення в роботу завершується закритою помилкою з вказівками щодо виправлення.
- З `--install-daemon`, якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не встановлено, введення в роботу блокує інсталяцію, доки режим не буде задано явно.
- Локальне введення в роботу записує `gateway.mode="local"` у конфігурацію. Якщо пізніший файл конфігурації не має `gateway.mode`, вважайте це пошкодженням конфігурації або неповним ручним редагуванням, а не чинним скороченням локального режиму.
- Локальне введення в роботу встановлює вибрані завантажувані плагіни, коли цього потребує вибраний шлях налаштування.
- Віддалене введення в роботу записує лише інформацію підключення для віддаленого Gateway і не встановлює локальні пакети плагінів.
- `--allow-unconfigured` — це окремий аварійний вихід середовища виконання Gateway. Він не означає, що введення в роботу може пропустити `gateway.mode`.

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

- Якщо ви не передасте `--skip-health`, введення в роботу чекає, доки локальний Gateway стане доступним, перш ніж успішно завершитися.
- `--install-daemon` спершу запускає шлях інсталяції керованого Gateway. Без нього у вас уже має бути запущений локальний Gateway, наприклад `openclaw gateway run`.
- Якщо в автоматизації вам потрібні лише записи конфігурації/робочого простору/bootstrap, використовуйте `--skip-health`.
- Якщо ви керуєте файлами робочого простору самостійно, передайте `--skip-bootstrap`, щоб установити `agents.defaults.skipBootstrap: true` і пропустити створення `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` і `BOOTSTRAP.md`.
- У нативній Windows `--install-daemon` спершу пробує Scheduled Tasks і переходить до елемента входу в папці запуску користувача, якщо створення завдання заборонено.

Поведінка інтерактивного введення в роботу з режимом посилань:

- Виберіть **Use secret reference**, коли з’явиться запит.
- Потім виберіть один із варіантів:
  - Змінна середовища
  - Налаштований провайдер секретів (`file` або `exec`)
- Введення в роботу виконує швидку попередню перевірку перед збереженням посилання.
  - Якщо перевірка не проходить, введення в роботу показує помилку й дозволяє повторити спробу.

### Варіанти кінцевої точки Z.AI у неінтерактивному режимі

<Note>
`--auth-choice zai-api-key` автоматично визначає найкращу кінцеву точку Z.AI і модель для
вашого ключа. Кінцеві точки Coding Plan надають перевагу `zai/glm-5.2`; загальні кінцеві точки API використовують
`zai/glm-5.1`. Щоб примусово вибрати кінцеву точку Coding Plan, виберіть `zai-coding-global` або
`zai-coding-cn`.
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

## Примітки щодо процесу

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: мінімум запитів, автоматично генерує токен Gateway.
    - `manual`: повні запити для порту, прив’язки й автентифікації (псевдонім `advanced`).
    - `import`: запускає виявленого провайдера міграції, показує попередній перегляд плану, а потім застосовує його після підтвердження.

  </Accordion>
  <Accordion title="Provider prefiltering">
    Коли вибір автентифікації передбачає бажаного провайдера, введення в роботу попередньо фільтрує вибір типових моделей і allowlist до цього провайдера. Для Volcengine і BytePlus це також зіставляє варіанти coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Якщо фільтр бажаного провайдера ще не дає завантажених моделей, введення в роботу повертається до нефільтрованого каталогу, замість того щоб залишати вибір порожнім.

  </Accordion>
  <Accordion title="Web-search follow-ups">
    Деякі провайдери вебпошуку запускають додаткові запити, специфічні для провайдера:

    - **Grok** може запропонувати необов’язкове налаштування `x_search` з тим самим профілем xAI OAuth або ключем API і вибором моделі `x_search`.
    - **Kimi** може попросити регіон Moonshot API (`api.moonshot.ai` або `api.moonshot.cn`) і типову модель вебпошуку Kimi.

  </Accordion>
  <Accordion title="Other behaviors">
    - Поведінка області DM у локальному введенні в роботу: [довідник налаштування CLI](/uk/start/wizard-cli-reference#outputs-and-internals).
    - Найшвидший перший чат: `openclaw dashboard` (Control UI, без налаштування каналу).
    - Користувацький провайдер: підключіть будь-яку сумісну з OpenAI або Anthropic кінцеву точку, включно з розміщеними провайдерами, яких немає в списку. Використовуйте Unknown для автоматичного визначення.
    - Якщо виявлено стан Hermes, введення в роботу пропонує процес міграції. Використовуйте [Migrate](/uk/cli/migrate) для планів dry-run, режиму перезапису, звітів і точних зіставлень.

  </Accordion>
</AccordionGroup>

## Поширені наступні команди

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Використовуйте `openclaw setup` як ту саму точку входу до покрокового введення в роботу. Використовуйте `openclaw setup --baseline`, коли вам потрібні лише базова конфігурація/робочий простір, `openclaw configure` пізніше для цільових змін і `openclaw channels add` для налаштування лише каналу.

<Note>
`--json` не означає неінтерактивний режим. Використовуйте `--non-interactive` для сценаріїв.
</Note>
