---
read_when:
    - Вам потрібне кероване налаштування gateway, робочого простору, автентифікації, каналів і skills
summary: Довідник CLI для `openclaw onboard` (інтерактивне початкове налаштування)
title: Onboard
x-i18n:
    generated_at: "2026-06-27T17:21:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4ffee6b90e72f1859634fbd7ccac2f44e88bc37879b9e5b099c33b760cc0e9af
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Повне кероване введення в роботу для налаштування локального або віддаленого Gateway. Використовуйте це, коли хочете, щоб OpenClaw провів через автентифікацію моделі, робочий простір, Gateway, канали, Skills і перевірку стану в одному потоці.

## Пов’язані посібники

<CardGroup cols={2}>
  <Card title="Центр введення в роботу CLI" href="/uk/start/wizard" icon="rocket">
    Покроковий опис інтерактивного потоку CLI.
  </Card>
  <Card title="Огляд введення в роботу" href="/uk/start/onboarding-overview" icon="map">
    Як узгоджується введення в роботу OpenClaw.
  </Card>
  <Card title="Довідник налаштування CLI" href="/uk/start/wizard-cli-reference" icon="book">
    Вивід, внутрішня логіка та поведінка кожного кроку.
  </Card>
  <Card title="Автоматизація CLI" href="/uk/start/wizard-cli-automation" icon="terminal">
    Неінтерактивні прапорці та скриптові налаштування.
  </Card>
  <Card title="Введення в роботу застосунку macOS" href="/uk/start/onboarding" icon="apple">
    Потік введення в роботу для застосунку в рядку меню macOS.
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

`--flow import` використовує провайдери міграції, що належать плагінам, наприклад Hermes. Він запускається лише для свіжого налаштування OpenClaw; якщо вже наявні конфігурація, облікові дані, сеанси або файли пам’яті/ідентичності робочого простору, скиньте їх або виберіть свіже налаштування перед імпортом.

`--modern` запускає попередній перегляд розмовного введення в роботу Crestodian. Без
`--modern`, `openclaw onboard` зберігає класичний потік введення в роботу.

У свіжій інсталяції, де активний файл конфігурації відсутній або не має створених
налаштувань (порожній або лише з метаданими), проста команда `openclaw` також запускає класичний
потік введення в роботу. Щойно файл конфігурації має створені налаштування, проста команда `openclaw`
натомість відкриває Crestodian.

Відкритий текст `ws://` приймається для local loopback, приватних IP-літералів, `.local` і
URL Gateway Tailnet `*.ts.net`. Для інших довірених приватних DNS-імен установіть
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` у середовищі процесу введення в роботу.

## Локаль

Інтерактивне введення в роботу використовує локаль майстра CLI для фіксованого тексту налаштування. Порядок
визначення такий:

1. `OPENCLAW_LOCALE`
2. `LC_ALL`
3. `LC_MESSAGES`
4. `LANG`
5. Резервний варіант англійською

Підтримувані локалі майстра: `en`, `zh-CN` і `zh-TW`. Значення локалі можуть використовувати
підкреслення або форми з POSIX-суфіксом, наприклад `zh_CN.UTF-8`. Назви продуктів, назви
команд, ключі конфігурації, URL, ідентифікатори провайдерів, ідентифікатори моделей і мітки плагінів/каналів
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

`--custom-api-key` необов’язковий у неінтерактивному режимі. Якщо його пропущено, введення в роботу перевіряє `CUSTOM_API_KEY`.
OpenClaw автоматично позначає поширені ідентифікатори візійних моделей як придатні для зображень. Передайте `--custom-image-input` для невідомих власних візійних ідентифікаторів або `--custom-text-input`, щоб примусово задати метадані лише для тексту.
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

`--custom-base-url` за замовчуванням має значення `http://127.0.0.1:11434`. `--custom-model-id` необов’язковий; якщо його пропущено, введення в роботу використовує запропоновані Ollama значення за замовчуванням. Хмарні ідентифікатори моделей, як-от `kimi-k2.5:cloud`, також працюють тут.

Зберігайте ключі провайдера як посилання замість відкритого тексту:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

З `--secret-input-mode ref` введення в роботу записує посилання, підкріплені змінними середовища, замість значень ключів відкритим текстом.
Для провайдерів, підкріплених профілем автентифікації, це записує записи `keyRef`; для власних провайдерів це записує `models.providers.<id>.apiKey` як env-посилання (наприклад `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Контракт неінтерактивного режиму `ref`:

- Установіть змінну середовища провайдера в середовищі процесу введення в роботу (наприклад `OPENAI_API_KEY`).
- Не передавайте вбудовані прапорці ключів (наприклад `--openai-api-key`), якщо ця змінна середовища також не встановлена.
- Якщо вбудований прапорець ключа передано без потрібної змінної середовища, введення в роботу швидко завершується помилкою з інструкціями.

Параметри токена Gateway у неінтерактивному режимі:

- `--gateway-auth token --gateway-token <token>` зберігає токен відкритим текстом.
- `--gateway-auth token --gateway-token-ref-env <name>` зберігає `gateway.auth.token` як env SecretRef.
- `--gateway-token` і `--gateway-token-ref-env` взаємовиключні.
- `--gateway-token-ref-env` вимагає непорожньої змінної середовища в середовищі процесу введення в роботу.
- З `--install-daemon`, коли автентифікація токеном вимагає токен, керовані SecretRef токени Gateway перевіряються, але не зберігаються як розв’язаний відкритий текст у метаданих середовища служби супервізора.
- З `--install-daemon`, якщо режим токена вимагає токен, а налаштований SecretRef токена не розв’язано, введення в роботу завершується закрито з інструкціями щодо виправлення.
- З `--install-daemon`, якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, введення в роботу блокує інсталяцію, доки режим не буде встановлено явно.
- Локальне введення в роботу записує `gateway.mode="local"` у конфігурацію. Якщо в пізнішому файлі конфігурації відсутній `gateway.mode`, розглядайте це як пошкодження конфігурації або неповне ручне редагування, а не як чинне скорочення локального режиму.
- Локальне введення в роботу встановлює вибрані завантажувані плагіни, коли цього вимагає вибраний шлях налаштування.
- Віддалене введення в роботу записує лише інформацію про підключення для віддаленого Gateway і не встановлює локальні пакети плагінів.
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

- Якщо ви не передали `--skip-health`, введення в роботу чекає на доступний локальний Gateway перед успішним завершенням.
- `--install-daemon` спершу запускає шлях інсталяції керованого Gateway. Без нього у вас уже має бути запущений локальний Gateway, наприклад `openclaw gateway run`.
- Якщо в автоматизації вам потрібні лише записи конфігурації/робочого простору/bootstrap, використовуйте `--skip-health`.
- Якщо ви самі керуєте файлами робочого простору, передайте `--skip-bootstrap`, щоб установити `agents.defaults.skipBootstrap: true` і пропустити створення `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` і `BOOTSTRAP.md`.
- У нативній Windows `--install-daemon` спершу пробує Scheduled Tasks і повертається до елемента входу в папці Startup для поточного користувача, якщо створення завдання заборонено.

Поведінка інтерактивного введення в роботу з режимом посилання:

- Виберіть **Використати посилання на секрет**, коли з’явиться запит.
- Потім виберіть один із варіантів:
  - Змінна середовища
  - Налаштований провайдер секретів (`file` або `exec`)
- Введення в роботу виконує швидку попередню перевірку перед збереженням посилання.
  - Якщо перевірка не вдається, введення в роботу показує помилку та дозволяє повторити спробу.

### Варіанти неінтерактивних кінцевих точок Z.AI

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

## Примітки щодо потоку

<AccordionGroup>
  <Accordion title="Типи потоків">
    - `quickstart`: мінімальні запити, автоматично генерує токен Gateway.
    - `manual`: повні запити для порту, прив’язки та автентифікації (псевдонім `advanced`).
    - `import`: запускає виявленого провайдера міграції, попередньо показує план, а потім застосовує його після підтвердження.

  </Accordion>
  <Accordion title="Попередня фільтрація провайдерів">
    Коли вибір автентифікації передбачає бажаного провайдера, введення в роботу попередньо фільтрує засоби вибору моделі за замовчуванням і allowlist до цього провайдера. Для Volcengine і BytePlus це також відповідає варіантам coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Якщо фільтр бажаного провайдера ще не дає жодної завантаженої моделі, введення в роботу повертається до нефільтрованого каталогу замість того, щоб залишити засіб вибору порожнім.

  </Accordion>
  <Accordion title="Подальші кроки вебпошуку">
    Деякі провайдери вебпошуку запускають додаткові запити, специфічні для провайдера:

    - **Grok** може запропонувати необов’язкове налаштування `x_search` з тим самим профілем xAI OAuth або API-ключем і вибором моделі `x_search`.
    - **Kimi** може запитати регіон Moonshot API (`api.moonshot.ai` або `api.moonshot.cn`) і модель вебпошуку Kimi за замовчуванням.

  </Accordion>
  <Accordion title="Інша поведінка">
    - Поведінка області DM локального введення в роботу: [Довідник налаштування CLI](/uk/start/wizard-cli-reference#outputs-and-internals).
    - Найшвидший перший чат: `openclaw dashboard` (Control UI, без налаштування каналу).
    - Власний провайдер: підключіть будь-яку кінцеву точку, сумісну з OpenAI або Anthropic, зокрема розміщених провайдерів, яких немає в списку. Використовуйте Unknown для автоматичного визначення.
    - Якщо виявлено стан Hermes, введення в роботу пропонує потік міграції. Використовуйте [Migrate](/uk/cli/migrate) для планів dry-run, режиму перезапису, звітів і точних зіставлень.

  </Accordion>
</AccordionGroup>

## Поширені наступні команди

```bash
openclaw channels add
openclaw configure
openclaw agents add <name>
```

Натомість використовуйте `openclaw setup`, коли потрібна лише базова конфігурація/робочий простір. Використовуйте `openclaw configure` пізніше для цільових змін і `openclaw channels add` для налаштування лише каналу.

<Note>
`--json` не означає неінтерактивний режим. Використовуйте `--non-interactive` для скриптів.
</Note>
