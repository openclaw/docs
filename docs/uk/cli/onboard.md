---
read_when:
    - Вам потрібне покрокове налаштування Gateway, робочого простору, автентифікації, каналів і Skills
summary: Довідник CLI для `openclaw onboard` (інтерактивне початкове налаштування)
title: Підключення
x-i18n:
    generated_at: "2026-05-01T07:53:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1276a0b20f37da470bb4d49b38d06bacc38e7d0e85737a22971a2a9a3d90e244
    source_path: cli/onboard.md
    workflow: 16
---

# `openclaw onboard`

Інтерактивний онбординг для налаштування локального або віддаленого Gateway.

## Пов’язані посібники

<CardGroup cols={2}>
  <Card title="CLI onboarding hub" href="/uk/start/wizard" icon="rocket">
    Покроковий опис інтерактивного потоку CLI.
  </Card>
  <Card title="Onboarding overview" href="/uk/start/onboarding-overview" icon="map">
    Як онбординг OpenClaw поєднується в єдине ціле.
  </Card>
  <Card title="CLI setup reference" href="/uk/start/wizard-cli-reference" icon="book">
    Вивід, внутрішні механізми та поведінка на кожному кроці.
  </Card>
  <Card title="CLI automation" href="/uk/start/wizard-cli-automation" icon="terminal">
    Неінтерактивні прапорці та сценарні налаштування.
  </Card>
  <Card title="macOS app onboarding" href="/uk/start/onboarding" icon="apple">
    Потік онбордингу для застосунку macOS у рядку меню.
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

`--flow import` використовує провайдери міграції, що належать plugin, як-от Hermes. Він запускається лише для нового налаштування OpenClaw; якщо вже наявні конфігурація, облікові дані, сеанси або файли пам’яті/ідентичності робочої області, скиньте їх або виберіть нове налаштування перед імпортом.

`--modern` запускає попередню версію розмовного онбордингу Crestodian. Без
`--modern`, `openclaw onboard` зберігає класичний потік онбордингу.

Для plaintext-цілей приватної мережі `ws://` (лише довірені мережі) задайте
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` в оточенні процесу онбордингу.
Для цього клієнтського transport break-glass немає еквівалента в `openclaw.json`.

Неінтерактивний кастомний провайдер:

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

`--custom-api-key` є необов’язковим у неінтерактивному режимі. Якщо його пропущено, онбординг перевіряє `CUSTOM_API_KEY`.
OpenClaw автоматично позначає поширені ID моделей з vision як здатні обробляти зображення. Передайте `--custom-image-input` для невідомих кастомних ID vision, або `--custom-text-input`, щоб примусово задати метадані лише для тексту.

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

`--custom-base-url` за замовчуванням дорівнює `http://127.0.0.1:11434`. `--custom-model-id` є необов’язковим; якщо його пропущено, онбординг використовує рекомендовані Ollama значення за замовчуванням. Хмарні ID моделей, як-от `kimi-k2.5:cloud`, також працюють тут.

Зберігайте ключі провайдера як refs замість plaintext:

```bash
openclaw onboard --non-interactive \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

З `--secret-input-mode ref` онбординг записує refs на основі env замість plaintext-значень ключів.
Для провайдерів на основі auth-profile це записує записи `keyRef`; для кастомних провайдерів це записує `models.providers.<id>.apiKey` як env ref (наприклад `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`).

Контракт неінтерактивного режиму `ref`:

- Задайте env var провайдера в оточенні процесу онбордингу (наприклад `OPENAI_API_KEY`).
- Не передавайте inline-прапорці ключа (наприклад `--openai-api-key`), якщо ця env var також не задана.
- Якщо inline-прапорець ключа передано без потрібної env var, онбординг швидко завершується з помилкою та підказкою.

Опції токена Gateway у неінтерактивному режимі:

- `--gateway-auth token --gateway-token <token>` зберігає plaintext-токен.
- `--gateway-auth token --gateway-token-ref-env <name>` зберігає `gateway.auth.token` як env SecretRef.
- `--gateway-token` і `--gateway-token-ref-env` взаємовиключні.
- `--gateway-token-ref-env` потребує непорожньої env var в оточенні процесу онбордингу.
- З `--install-daemon`, коли token auth потребує токен, керовані SecretRef токени gateway перевіряються, але не зберігаються як розв’язаний plaintext у метаданих оточення сервісу supervisor.
- З `--install-daemon`, якщо token mode потребує токен, а налаштований token SecretRef не розв’язується, онбординг закривається з помилкою та інструкціями з виправлення.
- З `--install-daemon`, якщо налаштовано і `gateway.auth.token`, і `gateway.auth.password`, а `gateway.auth.mode` не задано, онбординг блокує встановлення, доки mode не буде задано явно.
- Локальний онбординг записує `gateway.mode="local"` у конфігурацію. Якщо у пізнішому конфігураційному файлі бракує `gateway.mode`, розглядайте це як пошкодження конфігурації або неповне ручне редагування, а не як дійсний скорочений шлях для локального режиму.
- Локальний онбординг матеріалізує нові необхідні runtime-залежності bundled plugin після запису конфігурації, перш ніж продовжаться workspace/bootstrap, встановлення daemon або перевірки стану. Це вузький крок відновлення package-manager, а не повний запуск `openclaw doctor`.
- Віддалений онбординг записує лише відомості підключення для віддаленого Gateway і не встановлює локальні залежності bundled plugin.
- `--allow-unconfigured` — це окремий аварійний обхід для gateway runtime. Він не означає, що онбординг може пропустити `gateway.mode`.

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

Стан локального gateway у неінтерактивному режимі:

- Якщо ви не передасте `--skip-health`, онбординг чекатиме на доступний локальний gateway перед успішним завершенням.
- `--install-daemon` спочатку запускає керований шлях встановлення gateway. Без нього у вас уже має працювати локальний gateway, наприклад `openclaw gateway run`.
- Якщо в automation вам потрібні лише записи config/workspace/bootstrap, використовуйте `--skip-health`.
- Якщо ви самі керуєте файлами робочої області, передайте `--skip-bootstrap`, щоб задати `agents.defaults.skipBootstrap: true` і пропустити створення `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md` і `BOOTSTRAP.md`.
- На native Windows `--install-daemon` спочатку пробує Scheduled Tasks і повертається до login item у Startup-folder для кожного користувача, якщо створення task заборонено.

Поведінка інтерактивного онбордингу з режимом reference:

- Виберіть **Use secret reference**, коли з’явиться запит.
- Потім виберіть один із варіантів:
  - Змінна середовища
  - Налаштований провайдер секретів (`file` або `exec`)
- Онбординг виконує швидку preflight-перевірку перед збереженням ref.
  - Якщо перевірка завершується невдало, онбординг показує помилку й дає змогу повторити спробу.

### Вибір endpoints Z.AI у неінтерактивному режимі

<Note>
`--auth-choice zai-api-key` автоматично визначає найкращий endpoint Z.AI для вашого ключа (надає перевагу загальному API з `zai/glm-5.1`). Якщо вам потрібні саме endpoints GLM Coding Plan, виберіть `zai-coding-global` або `zai-coding-cn`.
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

## Нотатки щодо потоку

<AccordionGroup>
  <Accordion title="Flow types">
    - `quickstart`: мінімум запитів, автоматично генерує gateway token.
    - `manual`: повні запити для port, bind і auth (псевдонім `advanced`).
    - `import`: запускає виявлений провайдер міграції, показує попередній перегляд плану, а потім застосовує його після підтвердження.

  </Accordion>
  <Accordion title="Provider prefiltering">
    Коли вибір auth передбачає бажаного провайдера, онбординг попередньо фільтрує pickers default-model і allowlist до цього провайдера. Для Volcengine і BytePlus це також зіставляє варіанти coding-plan (`volcengine-plan/*`, `byteplus-plan/*`).

    Якщо фільтр preferred-provider ще не дає завантажених моделей, онбординг повертається до нефільтрованого каталогу замість того, щоб залишити picker порожнім.

  </Accordion>
  <Accordion title="Web-search follow-ups">
    Деякі провайдери web-search запускають follow-up запити, специфічні для провайдера:

    - **Grok** може запропонувати необов’язкове налаштування `x_search` з тим самим `XAI_API_KEY` і вибором моделі `x_search`.
    - **Kimi** може запитати регіон Moonshot API (`api.moonshot.ai` проти `api.moonshot.cn`) і стандартну модель Kimi web-search.

  </Accordion>
  <Accordion title="Other behaviors">
    - Поведінка DM scope у локальному онбордингу: [Довідник налаштування CLI](/uk/start/wizard-cli-reference#outputs-and-internals).
    - Найшвидший перший чат: `openclaw dashboard` (Control UI, без налаштування каналу).
    - Кастомний провайдер: підключіть будь-який endpoint, сумісний з OpenAI або Anthropic, зокрема hosted providers, яких немає у списку. Використовуйте Unknown для автоматичного виявлення.
    - Якщо виявлено стан Hermes, онбординг пропонує потік міграції. Використовуйте [Migrate](/uk/cli/migrate) для планів dry-run, режиму overwrite, звітів і точних зіставлень.

  </Accordion>
</AccordionGroup>

## Поширені подальші команди

```bash
openclaw configure
openclaw agents add <name>
```

<Note>
`--json` не означає неінтерактивний режим. Використовуйте `--non-interactive` для scripts.
</Note>
