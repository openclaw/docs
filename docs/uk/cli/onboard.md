---
read_when:
    - Вам потрібне кероване налаштування Gateway, робочого простору, автентифікації, каналів і Skills
summary: Довідник CLI для `openclaw onboard` (інтерактивне початкове налаштування)
title: Підключення
x-i18n:
    generated_at: "2026-05-01T20:36:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 79fd15da17beb5e66da760bcf490a15340d42af0730c19f04d41908995da8ffb
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
    Виведення, внутрішня логіка та поведінка на кожному кроці.
  </Card>
  <Card title="Автоматизація CLI" href="/uk/start/wizard-cli-automation" icon="terminal">
    Неінтерактивні прапорці та сценарні налаштування.
  </Card>
  <Card title="Початкове налаштування застосунку macOS" href="/uk/start/onboarding" icon="apple">
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

`--flow import` використовує провайдери міграції, що належать plugins, як-от Hermes. Він запускається лише для нового налаштування OpenClaw; якщо вже є наявні конфігурація, облікові дані, сеанси або файли пам’яті/ідентичності робочого простору, скиньте їх або виберіть нове налаштування перед імпортом.

`--modern` запускає попередній перегляд розмовного початкового налаштування Crestodian. Без
`--modern` команда `openclaw onboard` зберігає класичний потік початкового налаштування.

Для plaintext-цілей `ws://` у приватній мережі (лише довірені мережі) встановіть
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` у середовищі процесу початкового налаштування.
Еквівалента `openclaw.json` для цього клієнтського аварійного обходу транспорту
немає.

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

`--custom-api-key` необов’язковий у неінтерактивному режимі. Якщо його пропущено, початкове налаштування перевіряє `CUSTOM_API_KEY`.
OpenClaw автоматично позначає поширені ідентифікатори моделей бачення як сумісні із зображеннями. Передайте `--custom-image-input` для невідомих користувацьких ідентифікаторів моделей бачення або `--custom-text-input`, щоб примусово використати метадані лише для тексту.

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

`--custom-base-url` за замовчуванням має значення `http://127.0.0.1:11434`. `--custom-model-id` необов’язковий; якщо його пропущено, початкове налаштування використовує рекомендовані значення Ollama за замовчуванням. Ідентифікатори хмарних моделей, як-от `kimi-k2.5:cloud`, також працюють тут.

Зберігайте ключі провайдера як посилання замість plaintext:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

З `--secret-input-mode ref` початкове налаштування записує посилання на основі env замість plaintext-значень ключів.
Для провайдерів на основі auth-profile це записує записи `keyRef`; для користувацьких провайдерів це записує `models.providers.<id>.apiKey` як env-посилання (наприклад `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Контракт неінтерактивного режиму `ref`:

- Установіть env-змінну провайдера в середовищі процесу початкового налаштування (наприклад `OPENAI_API_KEY`).
- Не передавайте вбудовані прапорці ключів (наприклад `--openai-api-key`), якщо ця env-змінна також не встановлена.
- Якщо вбудований прапорець ключа передано без потрібної env-змінної, початкове налаштування швидко завершується з помилкою та підказками.

Параметри токена Gateway у неінтерактивному режимі:

- `--gateway-auth token --gateway-token <token>` зберігає plaintext-токен.
- `--gateway-auth token --gateway-token-ref-env <name>` зберігає `gateway.auth.token` як env SecretRef.
- `--gateway-token` і `--gateway-token-ref-env` взаємовиключні.
- `--gateway-token-ref-env` потребує непорожньої env-змінної в середовищі процесу початкового налаштування.
- З `--install-daemon`, коли автентифікація токеном потребує токен, керовані SecretRef токени Gateway перевіряються, але не зберігаються як розв’язаний plaintext у метаданих середовища служби супервізора.
- З `--install-daemon`, якщо режим токена потребує токен, а налаштований SecretRef токена не розв’язано, початкове налаштування завершується закритою помилкою з підказками щодо виправлення.
- З `--install-daemon`, якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, початкове налаштування блокує встановлення, доки режим не буде задано явно.
- Локальне початкове налаштування записує `gateway.mode="local"` у конфігурацію. Якщо в пізнішому конфігураційному файлі відсутній `gateway.mode`, розглядайте це як пошкодження конфігурації або неповне ручне редагування, а не як дійсний скорочений шлях локального режиму.
- Локальне початкове налаштування встановлює вибрані завантажувані plugins, коли вибраний шлях налаштування цього потребує.
- Віддалене початкове налаштування записує лише дані підключення для віддаленого Gateway і не встановлює локальні пакети plugins.
- `--allow-unconfigured` — це окремий аварійний обхід часу виконання Gateway. Він не означає, що початкове налаштування може пропустити `gateway.mode`.

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

- Якщо ви не передаєте `--skip-health`, початкове налаштування чекає на доступний локальний gateway, перш ніж успішно завершитися.
- `--install-daemon` спершу запускає шлях встановлення керованого gateway. Без нього локальний gateway уже має бути запущений, наприклад `openclaw gateway run`.
- Якщо в автоматизації вам потрібні лише записи конфігурації/робочого простору/bootstrap, використовуйте `--skip-health`.
- Якщо ви керуєте файлами робочого простору самостійно, передайте `--skip-bootstrap`, щоб установити `agents.defaults.skipBootstrap: true` і пропустити створення `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` і `BOOTSTRAP.md`.
- У нативній Windows `--install-daemon` спершу пробує Scheduled Tasks і повертається до елемента входу в папці Startup для користувача, якщо створення завдання відхилено.

Поведінка інтерактивного початкового налаштування в режимі посилань:

- Виберіть **Використати посилання на секрет**, коли з’явиться запит.
- Потім виберіть одне з:
  - Змінна середовища
  - Налаштований провайдер секретів (`file` або `exec`)
- Початкове налаштування виконує швидку попередню перевірку перед збереженням посилання.
  - Якщо перевірка не вдається, початкове налаштування показує помилку й дозволяє повторити спробу.

### Вибір кінцевих точок Z.AI у неінтерактивному режимі

<Note>
`--auth-choice zai-api-key` автоматично визначає найкращу кінцеву точку Z.AI для вашого ключа (віддає перевагу загальному API з `zai/glm-5.1`). Якщо вам конкретно потрібні кінцеві точки GLM Coding Plan, виберіть `zai-coding-global` або `zai-coding-cn`.
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
    - `quickstart`: мінімум запитів, автоматично генерує токен gateway.
    - `manual`: повні запити для порту, прив’язки та автентифікації (псевдонім `advanced`).
    - `import`: запускає виявленого провайдера міграції, показує попередній план, а потім застосовує після підтвердження.

  </Accordion>
  <Accordion title="Попередня фільтрація провайдерів">
    Коли вибір автентифікації передбачає бажаного провайдера, початкове налаштування попередньо фільтрує засоби вибору моделі за замовчуванням і списку дозволених моделей до цього провайдера. Для Volcengine і BytePlus це також відповідає варіантам coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Якщо фільтр бажаного провайдера ще не дає завантажених моделей, початкове налаштування повертається до нефільтрованого каталогу замість того, щоб залишати засіб вибору порожнім.

  </Accordion>
  <Accordion title="Подальші запити вебпошуку">
    Деякі провайдери вебпошуку запускають специфічні для провайдера подальші запити:

    - **Grok** може запропонувати необов’язкове налаштування `x_search` з тим самим `XAI_API_KEY` і вибором моделі `x_search`.
    - **Kimi** може запитати регіон Moonshot API (`api.moonshot.ai` або `api.moonshot.cn`) і стандартну модель вебпошуку Kimi.

  </Accordion>
  <Accordion title="Інша поведінка">
    - Поведінка DM-області локального початкового налаштування: [довідник налаштування CLI](/uk/start/wizard-cli-reference#outputs-and-internals).
    - Найшвидший перший чат: `openclaw dashboard` (Control UI, без налаштування каналу).
    - Користувацький провайдер: підключіть будь-яку кінцеву точку, сумісну з OpenAI або Anthropic, зокрема розміщених провайдерів, яких немає в списку. Використовуйте Unknown для автоматичного визначення.
    - Якщо виявлено стан Hermes, початкове налаштування пропонує потік міграції. Використовуйте [Migrate](/uk/cli/migrate) для планів dry-run, режиму перезапису, звітів і точних зіставлень.

  </Accordion>
</AccordionGroup>

## Поширені подальші команди

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` не означає неінтерактивний режим. Використовуйте `--non-interactive` для сценаріїв.
</Note>
