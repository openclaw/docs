---
read_when:
    - Вам потрібне кероване налаштування Gateway, робочого простору, автентифікації, каналів і Skills
summary: Довідка CLI для `openclaw onboard` (інтерактивне початкове налаштування)
title: Початок роботи
x-i18n:
    generated_at: "2026-07-01T13:22:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b8f1f1b1e4f3a9e3c544efede027d50123050660a999ae61573e41cd466bbfa4
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Повне кероване початкове налаштування для локального або віддаленого налаштування Gateway. Використовуйте це, коли хочете, щоб OpenClaw провів вас через автентифікацію моделі, робочий простір, Gateway, канали, Skills і перевірку стану в одному потоці.

## Пов’язані посібники

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/uk/start/wizard" icon="rocket">
    Покроковий опис інтерактивного потоку CLI.
  </Card>
  <Card title="Onboarding overview" href="/uk/start/onboarding-overview" icon="map">
    Як початкове налаштування OpenClaw поєднується в єдиний процес.
  </Card>
  <Card title="CLI setup reference" href="/uk/start/wizard-cli-reference" icon="book">
    Вивід, внутрішня логіка та поведінка кожного кроку.
  </Card>
  <Card title="CLI automation" href="/uk/start/wizard-cli-automation" icon="terminal">
    Неінтерактивні прапорці та сценарні налаштування.
  </Card>
  <Card title="macOS app onboarding" href="/uk/start/onboarding" icon="apple">
    Потік початкового налаштування для застосунку в рядку меню macOS.
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

`--flow import` використовує провайдери міграції, якими володіють plugin, як-от Hermes. Він запускається лише для свіжого налаштування OpenClaw; якщо вже наявні конфігурація, облікові дані, сесії або файли пам’яті/ідентичності робочого простору, перед імпортом скиньте їх або виберіть свіже налаштування.

`--modern` запускає попередню версію розмовного початкового налаштування Crestodian. Без
`--modern` `openclaw onboard` зберігає класичний потік початкового налаштування.

У свіжій інсталяції, де активний файл конфігурації відсутній або не має авторських
налаштувань (порожній або лише з метаданими), звичайний `openclaw` також запускає класичний
потік початкового налаштування. Щойно файл конфігурації має авторські налаштування, звичайний `openclaw`
натомість відкриває Crestodian.

Відкритий текстовий `ws://` приймається для loopback, приватних IP-літералів, `.local` і
URL Gateway Tailnet `*.ts.net`. Для інших довірених приватних DNS-імен задайте
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` у середовищі процесу початкового налаштування.

## Локаль

Інтерактивне початкове налаштування використовує локаль майстра CLI для фіксованого тексту налаштування. Порядок
визначення такий:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Резервна англійська локаль

Підтримувані локалі майстра: `en`, `zh-CN` і `zh-TW`. Значення локалі можуть використовувати
підкреслення або форми суфіксів POSIX, як-от `zh_CN.UTF-8`. Назви продуктів, назви команд,
ключі конфігурації, URL, ID провайдерів, ID моделей і мітки plugin/каналів
залишаються буквальними.

Приклад:

```bash
OPENCLAW_LOCALE=zh-CN openclaw onboard
```

Неінтерактивний власний провайдер:

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
OpenClaw автоматично позначає поширені ID візійних моделей як здатні працювати із зображеннями. Передайте `--custom-image-input` для невідомих власних візійних ID або `--custom-text-input`, щоб примусово задати метадані лише для тексту.
Використовуйте `--custom-compatibility openai-responses` для OpenAI-сумісних кінцевих точок, які підтримують `/v1/responses`, але не `/v1/chat/completions`.

LM Studio також підтримує специфічний для провайдера прапорець ключа в неінтерактивному режимі:

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

`--custom-base-url` за замовчуванням має значення `http://127.0.0.1:11434`. `--custom-model-id` є необов’язковим; якщо його пропущено, початкове налаштування використовує запропоновані Ollama стандартні значення. Хмарні ID моделей, як-от `kimi-k2.5:cloud`, також тут працюють.

Зберігайте ключі провайдера як посилання замість відкритого тексту:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

З `--secret-input-mode ref` початкове налаштування записує посилання на базі змінних середовища замість значень ключів у відкритому тексті.
Для провайдерів на основі профілю автентифікації це записує записи `keyRef`; для власних провайдерів це записує `models.providers.<id>.apiKey` як посилання на змінну середовища (наприклад `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Контракт неінтерактивного режиму `ref`:

- Задайте змінну середовища провайдера в середовищі процесу початкового налаштування (наприклад `OPENAI_API_KEY`).
- Не передавайте вбудовані прапорці ключів (наприклад `--openai-api-key`), якщо цю змінну середовища також не задано.
- Якщо вбудований прапорець ключа передано без потрібної змінної середовища, початкове налаштування швидко завершується помилкою з підказками.

Параметри токена Gateway у неінтерактивному режимі:

- `--gateway-auth token --gateway-token <token>` зберігає токен у відкритому тексті.
- `--gateway-auth token --gateway-token-ref-env <name>` зберігає `gateway.auth.token` як SecretRef змінної середовища.
- `--gateway-token` і `--gateway-token-ref-env` є взаємовиключними.
- `--gateway-token-ref-env` вимагає непорожньої змінної середовища в середовищі процесу початкового налаштування.
- З `--install-daemon`, коли автентифікація токеном вимагає токен, токени Gateway, керовані SecretRef, перевіряються, але не зберігаються як розв’язаний відкритий текст у метаданих середовища служби супервізора.
- З `--install-daemon`, якщо режим токена вимагає токен, а налаштований SecretRef токена не розв’язано, початкове налаштування завершується закритою помилкою з інструкціями з виправлення.
- З `--install-daemon`, якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, початкове налаштування блокує інсталяцію, доки режим не буде задано явно.
- Локальне початкове налаштування записує `gateway.mode="local"` у конфігурацію. Якщо в пізнішому файлі конфігурації відсутній `gateway.mode`, вважайте це пошкодженням конфігурації або неповним ручним редагуванням, а не припустимим скороченням локального режиму.
- Локальне початкове налаштування встановлює вибрані завантажувані plugins, коли цього вимагає вибраний шлях налаштування.
- Віддалене початкове налаштування записує лише інформацію про підключення до віддаленого Gateway і не встановлює локальні пакети plugin.
- `--allow-unconfigured` є окремим аварійним виходом часу виконання Gateway. Він не означає, що початкове налаштування може пропустити `gateway.mode`.

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

- Якщо ви не передали `--skip-health`, початкове налаштування чекає на доступний локальний Gateway перед успішним завершенням.
- `--install-daemon` спочатку запускає шлях встановлення керованого Gateway. Без нього у вас уже має працювати локальний Gateway, наприклад `openclaw gateway run`.
- Якщо в автоматизації вам потрібні лише записи конфігурації/робочого простору/початкових файлів, використовуйте `--skip-health`.
- Якщо ви самі керуєте файлами робочого простору, передайте `--skip-bootstrap`, щоб установити `agents.defaults.skipBootstrap: true` і пропустити створення `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` і `BOOTSTRAP.md`.
- У нативній Windows `--install-daemon` спершу пробує Scheduled Tasks і повертається до елемента входу в теку Startup для поточного користувача, якщо створення завдання заборонено.

Поведінка інтерактивного початкового налаштування в режимі посилання:

- Виберіть **Use secret reference**, коли з’явиться запит.
- Потім виберіть одне з двох:
  - Змінна середовища
  - Налаштований провайдер секретів (`file` або `exec`)
- Початкове налаштування виконує швидку попередню перевірку перед збереженням посилання.
  - Якщо перевірка не вдається, початкове налаштування показує помилку та дає змогу повторити спробу.

### Неінтерактивні варіанти кінцевих точок Z.AI

<Note>
`--auth-choice zai-api-key` автоматично визначає найкращу кінцеву точку й модель Z.AI для
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

## Додаткові неінтерактивні прапорці

Автентифікація моделі на основі токена (неінтерактивно; використовується з `--auth-choice token`):

- `--token-provider <id>` — ID провайдера токена. Визначає, який провайдер видає токен.
- `--token <token>` — Значення токена для автентифікації моделі.
- `--token-profile-id <id>` — ID профілю автентифікації. Загальне сховище токенів за замовчуванням використовує `<provider>:manual`; потоки налаштування, якими володіють провайдери, можуть використовувати власне стандартне значення, як-от `anthropic:default`.
- `--token-expires-in <duration>` — Необов’язкова тривалість дії токена (наприклад `365d`, `12h`).

Cloudflare AI Gateway (неінтерактивно):

- `--cloudflare-ai-gateway-account-id <id>` — ID облікового запису Cloudflare для маршрутизації через Cloudflare AI Gateway.
- `--cloudflare-ai-gateway-gateway-id <id>` — ID Cloudflare AI Gateway.

Керування встановленням демона:

- `--no-install-daemon` — Явно пропустити встановлення служби Gateway.
- `--skip-daemon` — Псевдонім для `--no-install-daemon`.

Керування налаштуванням UI і хуків:

- `--skip-ui` — Пропустити підказки Control UI / TUI під час початкового налаштування.
- `--skip-hooks` — Пропустити підказки налаштування Webhook / хуків під час початкового налаштування.

Приглушення виводу:

- `--suppress-gateway-token-output` — Приглушити вивід Gateway/UI, що містить токени (підказки токенів, URL автоматичного входу з вбудованим токеном і автоматичний запуск Control UI). Корисно в спільному терміналі та середовищах CI.

## Примітки щодо потоку

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: мінімальні підказки, автоматично генерує токен Gateway.
    - `manual`: повні підказки для порту, прив’язки та автентифікації (псевдонім `advanced`).
    - `import`: запускає виявленого провайдера міграції, попередньо показує план, а потім застосовує його після підтвердження.

  </Accordion>
  <Accordion title="Provider prefiltering">
    Коли вибір автентифікації передбачає бажаного провайдера, початкове налаштування попередньо фільтрує вибірники стандартної моделі та списку дозволених значень до цього провайдера. Для Volcengine і BytePlus це також збігається з варіантами coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Якщо фільтр бажаного провайдера ще не дає завантажених моделей, початкове налаштування повертається до нефільтрованого каталогу замість того, щоб залишити вибірник порожнім.

  </Accordion>
  <Accordion title="Web-search follow-ups">
    Деякі провайдери вебпошуку запускають специфічні для провайдера додаткові підказки:

    - **Grok** може запропонувати необов’язкове налаштування `x_search` з тим самим профілем xAI OAuth або API-ключем і вибором моделі `x_search`.
    - **Kimi** може запитати регіон Moonshot API (`api.moonshot.ai` або `api.moonshot.cn`) і стандартну модель вебпошуку Kimi.

  </Accordion>
  <Accordion title="Other behaviors">
    - Поведінка локального початкового налаштування для області DM: [довідник налаштування CLI](/uk/start/wizard-cli-reference#outputs-and-internals).
    - Найшвидший перший чат: `openclaw dashboard` (Control UI, без налаштування каналу).
    - Власний провайдер: підключіть будь-яку OpenAI- або Anthropic-сумісну кінцеву точку, включно з хостинговими провайдерами, яких немає в списку. Використовуйте Unknown для автоматичного визначення.
    - Якщо виявлено стан Hermes, початкове налаштування пропонує потік міграції. Використовуйте [Migrate](/uk/cli/migrate) для планів dry-run, режиму перезапису, звітів і точних зіставлень.

  </Accordion>
</AccordionGroup>

## Поширені подальші команди

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Використовуйте `openclaw setup` як ту саму точку входу для керованого початкового налаштування. Використовуйте `openclaw setup --baseline`, коли вам потрібні лише базова конфігурація/робочий простір, `openclaw configure` пізніше для цільових змін і `openclaw channels add` для налаштування лише каналу.

<Note>
`--json` не означає неінтерактивний режим. Використовуйте `--non-interactive` для скриптів.
</Note>
